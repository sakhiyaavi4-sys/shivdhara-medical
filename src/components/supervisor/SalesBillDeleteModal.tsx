// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Trash2, X, Check, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useMedicalStore, fmt, num, int, uid, today, inp, lbl, btn } from '../../MedicalStoreContext';

interface SalesBillDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SalesBillDeleteModal({ isOpen, onClose }: SalesBillDeleteModalProps) {
  const {
    saveItems, saveBatches, saveSalesBills, items, batches, salesBills, logUserChange
  } = useMedicalStore();

  const [sbdActiveTab, setSbdActiveTab] = useState<"delete" | "renumber">("delete");
  const [sbdFromDate, setSbdFromDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [sbdToDate, setSbdToDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [sbdLowerAmt, setSbdLowerAmt] = useState("");
  const [sbdHigherAmt, setSbdHigherAmt] = useState("");
  const [sbdSelectedMap, setSbdSelectedMap] = useState<{ [key: string]: boolean }>({});
  const [sbdSearchQuery, setSbdSearchQuery] = useState("");
  const [sbdConfirmModal, setSbdConfirmModal] = useState(false);
  const [sbdStatusMsg, setSbdStatusMsg] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Renumbering States
  const [sbdRenumberStart, setSbdRenumberStart] = useState(1);
  const [sbdRenumberPrefix, setSbdRenumberPrefix] = useState("INV-");
  const [sbdRenumberDigits, setSbdRenumberDigits] = useState(4);
  const [sbdRenumberConfirm, setSbdRenumberConfirm] = useState(false);


  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (sbdConfirmModal) {
          setSbdConfirmModal(false);
        } else if (sbdRenumberConfirm) {
          setSbdRenumberConfirm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, sbdConfirmModal, sbdRenumberConfirm]);

  if (!isOpen) return null;

  return (() => {
          // Normalize sales bills - Filter for Cash bills only (Per system rule: NO DEBIT BILLS)
          const rawBills = (salesBills || []).map((b: any, index: number) => {
            const billTotal = Number(b.total || b.netAmount || b.grandTotal || 0);
            const billBase = Number(b.taxableAmount || b.baseAmount || b.subTotal || (billTotal > 0 ? (billTotal / 1.12).toFixed(2) : 0));
            const billGst = Number(b.taxAmount || b.gstAmount || b.vatAmount || (billTotal > 0 ? (billTotal - billBase).toFixed(2) : 0));
            const billDate = b.date || (b.createdAt ? String(b.createdAt).slice(0, 10) : today());
            const billType = b.payMode || b.paymentMode || b.type || (b.isCredit ? 'Credit' : 'Cash');
            const isCashOnly = !/credit/i.test(billType);
            const billUser = b.createdByName || b.user || b.cashier || currentUser?.username || 'ADMIN';
            const billId = String(b.id || b.billNo || index + 1);

            return {
              ...b,
              _id: billId,
              _srNo: index + 1,
              _billNo: String(b.billNo || b.invoiceNo || b.id || index + 1),
              _date: billDate,
              _type: billType,
              _isCash: isCashOnly,
              _customerName: b.patientName || b.customerName || b.partyName || 'Walk-in Customer',
              _gst: billGst,
              _amount: billTotal,
              _user: billUser
            };
          });

          // Apply filters for Tab 1 (Delete Cash Sales Bill)
          const eligibleBills = rawBills.filter((b: any) => {
            if (!b._isCash) return false; // Must be Cash bill only
            if (sbdFromDate && b._date < sbdFromDate) return false;
            if (sbdToDate && b._date > sbdToDate) return false;

            if (sbdLowerAmt.trim() && b._amount < Number(sbdLowerAmt)) return false;
            if (sbdHigherAmt.trim() && b._amount > Number(sbdHigherAmt)) return false;

            if (sbdSearchQuery.trim()) {
              const q = sbdSearchQuery.toLowerCase();
              const matchNo = b._billNo.toLowerCase().includes(q);
              const matchCust = b._customerName.toLowerCase().includes(q);
              if (!matchNo && !matchCust) return false;
            }

            return true;
          });

          // Selected Bills calculation
          const selectedBills = eligibleBills.filter((b: any) => !!sbdSelectedMap[b._id]);
          const selectedCount = selectedBills.length;
          const selectedTotalAmt = selectedBills.reduce((acc: number, b: any) => acc + (b._amount || 0), 0);

          // Calculate total units to restore across selected bills
          const totalUnitsToRestore = selectedBills.reduce((acc: number, b: any) => {
            const lineItems = b.items || b.saleItems || [];
            const billUnits = lineItems.reduce((sum: number, it: any) => sum + Number(it.qty || it.quantity || 1), 0);
            return acc + billUnits;
          }, 0);

          // Select All (Yes)
          const handleSelectAll = () => {
            const nextMap: { [key: string]: boolean } = {};
            eligibleBills.forEach((b: any) => { nextMap[b._id] = true; });
            setSbdSelectedMap(nextMap);
          };

          // Deselect All (No)
          const handleDeselectAll = () => {
            setSbdSelectedMap({});
          };

          // Toggle Individual Row
          const handleToggleRow = (id: string) => {
            setSbdSelectedMap(prev => ({ ...prev, [id]: !prev[id] }));
          };

          // Execute Batch Delete with Inventory Stock Restoration
          const handleExecuteDelete = () => {
            if (selectedBills.length === 0) {
              alert("Please select at least one bill to delete.");
              return;
            }

            try {
              const selectedIds = new Set(selectedBills.map((b: any) => b._id));
              
              // 1. Restore Inventory Stock for items and batches
              const updatedItems = [...items];
              const updatedBatches = [...batches];

              selectedBills.forEach((bill: any) => {
                const lineItems = bill.items || bill.saleItems || [];
                lineItems.forEach((li: any) => {
                  const qtyToRestore = Number(li.qty || li.quantity || 1);
                  const targetItemId = li.itemId || li.id;
                  const targetBatchNo = li.batch || li.batchNo;

                  // Restore batch stock
                  if (targetBatchNo) {
                    const bIdx = updatedBatches.findIndex((b: any) => 
                      (b.itemId === targetItemId || !targetItemId) && (b.batchNo === targetBatchNo || b.batch === targetBatchNo)
                    );
                    if (bIdx !== -1) {
                      updatedBatches[bIdx] = {
                        ...updatedBatches[bIdx],
                        stock: Number(updatedBatches[bIdx].stock || 0) + qtyToRestore,
                        currentStock: Number(updatedBatches[bIdx].currentStock || updatedBatches[bIdx].stock || 0) + qtyToRestore
                      };
                    }
                  }

                  // Restore item overall stock
                  if (targetItemId) {
                    const iIdx = updatedItems.findIndex((it: any) => it.id === targetItemId);
                    if (iIdx !== -1) {
                      updatedItems[iIdx] = {
                        ...updatedItems[iIdx],
                        stock: Number(updatedItems[iIdx].stock || 0) + qtyToRestore
                      };
                    }
                  }
                });
              });

              // 2. Remove deleted bills from salesBills
              const updatedSales = (salesBills || []).filter((sb: any, idx: number) => {
                const id = String(sb.id || sb.billNo || idx + 1);
                return !selectedIds.has(id);
              });

              // Save to Store
              if (typeof saveItems === 'function') saveItems(updatedItems);
              if (typeof saveBatches === 'function') saveBatches(updatedBatches);
              if (typeof saveSalesBills === 'function') saveSalesBills(updatedSales);

              // 3. User Audit Logging
              if (typeof logUserChange === 'function') {
                logUserChange('SUPERVISOR_BATCH_DELETE_SALES', {
                  deletedCount: selectedBills.length,
                  totalAmount: selectedTotalAmt,
                  restoredUnits: totalUnitsToRestore,
                  billNumbers: selectedBills.map((b: any) => b._billNo).slice(0, 15).join(', ')
                }, `Permanently deleted ${selectedBills.length} Cash sales bills totalling ₹${selectedTotalAmt.toFixed(2)} and restored ${totalUnitsToRestore} inventory units`);
              }

              setSbdStatusMsg({
                type: "success",
                msg: `Successfully deleted ${selectedBills.length} sales bills! ${totalUnitsToRestore} medicine units have been restored to inventory.`
              });

              setSbdSelectedMap({});
              setSbdConfirmModal(false);
              setTimeout(() => setSbdStatusMsg(null), 5000);
            } catch (err: any) {
              setSbdStatusMsg({ type: "error", msg: "Failed to delete sales bills: " + (err?.message || "Unknown error") });
            }
          };

          // Execute Renumbering Logic
          const handleExecuteRenumbering = () => {
            try {
              // Sort sales bills chronologically
              const sorted = [...(salesBills || [])].sort((a: any, b: any) => {
                const da = a.date || a.createdAt || '';
                const db = b.date || b.createdAt || '';
                return da.localeCompare(db);
              });

              let currentSeq = Number(sbdRenumberStart) || 1;
              const padLen = Number(sbdRenumberDigits) || 4;
              const prefix = sbdRenumberPrefix || '';

              const renumbered = sorted.map((sb: any) => {
                const newNo = `${prefix}${String(currentSeq).padStart(padLen, '0')}`;
                currentSeq++;
                return { ...sb, billNo: newNo, hasRenumbered: true };
              });

              if (typeof saveSalesBills === 'function') saveSalesBills(renumbered);

              if (typeof logUserChange === 'function') {
                logUserChange('SUPERVISOR_SALES_RENUMBER', {
                  totalRenumbered: renumbered.length,
                  startNo: sbdRenumberStart,
                  prefix: sbdRenumberPrefix
                }, `Renumbered ${renumbered.length} sales bills starting from ${sbdRenumberPrefix}${sbdRenumberStart}`);
              }

              setSbdStatusMsg({
                type: "success",
                msg: `Successfully renumbered all ${renumbered.length} sales bills consecutively!`
              });
              setSbdRenumberConfirm(false);
              setTimeout(() => setSbdStatusMsg(null), 4500);
            } catch (err: any) {
              setSbdStatusMsg({ type: "error", msg: "Renumbering failed: " + (err?.message || "Unknown error") });
            }
          };

          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "#f1f5f9",
                color: "#0f172a",
                display: "flex",
                flexDirection: "column",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              }}
            >
              {/* Top Warning Banner (Light Red Alert Theme) */}
              <div
                style={{
                  background: "#fef2f2",
                  padding: "8px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #fecaca",
                  flexShrink: 0
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <AlertCircle size={17} color="#dc2626" />
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#991b1b", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    USE THIS FACILITY ONLY IF YOU MAKE CASH BILLS ONLY — NO DEBIT / CREDIT BILLS
                  </span>
                </div>

                <button
                  onClick={() => onClose()}
                  style={{
                    background: "#ffffff",
                    color: "#dc2626",
                    border: "1px solid #fca5a5",
                    padding: "4px 12px",
                    borderRadius: "4px",
                    fontWeight: "700",
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <X size={13} /> Close (ESC)
                </button>
              </div>

              {/* Header Title & Subtabs (Light/Modern Theme) */}
              <div
                style={{
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  padding: "12px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#ffffff",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  flexShrink: 0
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)"
                    }}
                  >
                    <Trash2 size={22} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "17px", fontWeight: "800", color: "#ffffff" }}>
                        Sales Bill Delete &amp; Renumbering Facility
                      </span>
                      <span
                        style={{
                          background: "rgba(239, 68, 68, 0.25)",
                          color: "#fca5a5",
                          border: "1px solid rgba(252, 165, 165, 0.4)",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "700"
                        }}
                      >
                        SUPERVISOR
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                      Batch reverse cash sales invoices, restore batch inventory quantities, and re-sequence bill numbers
                    </div>
                  </div>
                </div>

                {/* Sub-tabs Selector */}
                <div style={{ display: "flex", background: "rgba(255,255,255,0.1)", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <button
                    onClick={() => setSbdActiveTab("delete")}
                    style={{
                      background: sbdActiveTab === "delete" ? "#ef4444" : "transparent",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <Trash2 size={13} /> Delete Cash Sales Bill
                  </button>

                  <button
                    onClick={() => setSbdActiveTab("renumber")}
                    style={{
                      background: sbdActiveTab === "renumber" ? "#3b82f6" : "transparent",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <TrendingUp size={13} /> Sales Bill Renumbering
                  </button>
                </div>
              </div>

              {/* Status Alert Banner */}
              {sbdStatusMsg && (
                <div
                  style={{
                    padding: "10px 24px",
                    background: sbdStatusMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
                    borderBottom: `1px solid ${sbdStatusMsg.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                    color: sbdStatusMsg.type === "success" ? "#065f46" : "#991b1b",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0
                  }}
                >
                  {sbdStatusMsg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{sbdStatusMsg.msg}</span>
                </div>
              )}

              {/* ─── TAB 1: DELETE CASH SALES BILL (LIGHT THEME) ─── */}
              {sbdActiveTab === "delete" && (
                <>
                  {/* Controls & Filter Panel (Light Theme) */}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "12px 24px",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "14px",
                      flexWrap: "wrap",
                      flexShrink: 0,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                    }}
                  >
                    {/* Left Filters */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>From:</span>
                        <input
                          type="date"
                          value={sbdFromDate}
                          onChange={(e) => setSbdFromDate(e.target.value)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>To:</span>
                        <input
                          type="date"
                          value={sbdToDate}
                          onChange={(e) => setSbdToDate(e.target.value)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}
                        />
                      </div>

                      <button
                        onClick={() => {
                          const d = new Date();
                          const t = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          setSbdFromDate(t);
                          setSbdToDate(t);
                        }}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          color: "#334155",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Today
                      </button>

                      {/* Lower / Higher Amount Filter */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Lower Amount:</span>
                        <input
                          type="number"
                          placeholder="Min ₹"
                          value={sbdLowerAmt}
                          onChange={(e) => setSbdLowerAmt(e.target.value)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            width: "85px"
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Higher Amount:</span>
                        <input
                          type="number"
                          placeholder="Max ₹"
                          value={sbdHigherAmt}
                          onChange={(e) => setSbdHigherAmt(e.target.value)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            width: "85px"
                          }}
                        />
                      </div>
                    </div>

                    {/* Right Summary & Action Buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Total (₹):</span>
                        <input
                          type="text"
                          readOnly
                          value={`₹${selectedTotalAmt.toFixed(2)}`}
                          style={{
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            color: "#1d4ed8",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "800",
                            width: "120px",
                            textAlign: "right"
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Sales (Qty):</span>
                        <input
                          type="text"
                          readOnly
                          value={selectedCount}
                          style={{
                            background: "#fef3c7",
                            border: "1px solid #fde68a",
                            color: "#b45309",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "800",
                            width: "55px",
                            textAlign: "center"
                          }}
                        />
                      </div>

                      {/* Selection Buttons */}
                      <button
                        onClick={handleSelectAll}
                        style={{
                          background: "#059669",
                          color: "#ffffff",
                          border: "none",
                          padding: "7px 14px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Yes (All)
                      </button>

                      <button
                        onClick={handleDeselectAll}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          padding: "7px 14px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        No (None)
                      </button>

                      {/* Delete Action Button */}
                      <button
                        onClick={() => {
                          if (selectedCount === 0) {
                            alert("No bills selected for deletion. Mark Y on the bills you wish to delete.");
                            return;
                          }
                          setSbdConfirmModal(true);
                        }}
                        style={{
                          background: "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          padding: "7px 18px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4)"
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>

                  {/* 4 KPI Summary Cards (Light Theme) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "14px",
                      padding: "14px 24px",
                      background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      flexShrink: 0
                    }}
                  >
                    <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Eligible Cash Bills</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#2563eb", marginTop: "2px" }}>{eligibleBills.length}</div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Selected For Deletion</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#dc2626", marginTop: "2px" }}>{selectedCount} / {eligibleBills.length}</div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Selected Total Value</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#b45309", marginTop: "2px" }}>₹{selectedTotalAmt.toFixed(2)}</div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Stock Units to Restore</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#059669", marginTop: "2px" }}>{totalUnitsToRestore} Units</div>
                    </div>
                  </div>

                  {/* Main 9-Column Table (Light Theme) */}
                  <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
                    <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                          <tr style={{ background: "#0f172a", color: "#ffffff" }}>
                            <th style={{ padding: "10px 8px", textAlign: "center", width: "45px" }}>SrNo</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "110px" }}>Bill No</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "95px" }}>Date</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "85px" }}>Type</th>
                            <th style={{ padding: "10px 12px", textAlign: "left" }}>Customer Name</th>
                            <th style={{ padding: "10px 10px", textAlign: "right", width: "100px" }}>Vat/GST Rs</th>
                            <th style={{ padding: "10px 12px", textAlign: "right", width: "120px" }}>Amount</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "100px" }}>User</th>
                            <th style={{ padding: "10px 8px", textAlign: "center", width: "65px" }}>Y/N</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eligibleBills.length === 0 ? (
                            <tr>
                              <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                                No cash sales bills found matching the selected period and amount criteria.
                              </td>
                            </tr>
                          ) : (
                            eligibleBills.map((bill: any, idx: number) => {
                              const isSelected = !!sbdSelectedMap[bill._id];
                              return (
                                <tr
                                  key={bill._id}
                                  onClick={() => handleToggleRow(bill._id)}
                                  style={{
                                    borderBottom: "1px solid #e2e8f0",
                                    background: isSelected ? "#fee2e2" : idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                                    cursor: "pointer",
                                    transition: "background 0.15s ease"
                                  }}
                                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f1f5f9"; }}
                                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f8fafc"; }}
                                >
                                  <td style={{ padding: "9px 8px", textAlign: "center", color: "#64748b", fontWeight: "600" }}>
                                    {idx + 1}
                                  </td>
                                  <td style={{ padding: "9px 10px", fontWeight: "700", color: "#1d4ed8" }}>
                                    {bill._billNo}
                                  </td>
                                  <td style={{ padding: "9px 10px", color: "#334155" }}>
                                    {bill._date}
                                  </td>
                                  <td style={{ padding: "9px 10px" }}>
                                    <span
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        fontSize: "10px",
                                        fontWeight: "700",
                                        background: "#dcfce7",
                                        color: "#166534"
                                      }}
                                    >
                                      Cash
                                    </span>
                                  </td>
                                  <td style={{ padding: "9px 12px", color: "#0f172a", fontWeight: "600" }}>
                                    {bill._customerName}
                                  </td>
                                  <td style={{ padding: "9px 10px", textAlign: "right", color: "#d97706", fontFamily: "monospace", fontWeight: "600" }}>
                                    ₹{bill._gst.toFixed(2)}
                                  </td>
                                  <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: "800", color: "#047857", fontFamily: "monospace", fontSize: "13px" }}>
                                    ₹{bill._amount.toFixed(2)}
                                  </td>
                                  <td style={{ padding: "9px 10px", color: "#64748b" }}>
                                    {bill._user}
                                  </td>
                                  <td style={{ padding: "9px 8px", textAlign: "center" }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleRow(bill._id);
                                      }}
                                      style={{
                                        background: isSelected ? "#dc2626" : "#e2e8f0",
                                        color: isSelected ? "#ffffff" : "#475569",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "3px 9px",
                                        fontSize: "11px",
                                        fontWeight: "800",
                                        cursor: "pointer"
                                      }}
                                    >
                                      {isSelected ? "Y" : "N"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* ─── TAB 2: SALES BILL RENUMBERING (LIGHT THEME) ─── */}
              {sbdActiveTab === "renumber" && (
                <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
                  <div style={{ maxWidth: "750px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
                        Sequential Sales Bill Renumbering Configuration
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
                        After deleting sales bills, gaps appear in the invoice sequence. This utility re-sequences all existing sales bills consecutively by date.
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "20px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            Invoice Prefix:
                          </label>
                          <input
                            type="text"
                            value={sbdRenumberPrefix}
                            onChange={(e) => setSbdRenumberPrefix(e.target.value)}
                            placeholder="e.g. INV-"
                            style={{
                              width: "100%",
                              background: "#ffffff",
                              border: "1px solid #cbd5e1",
                              color: "#0f172a",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            Starting Number:
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={sbdRenumberStart}
                            onChange={(e) => setSbdRenumberStart(Number(e.target.value) || 1)}
                            style={{
                              width: "100%",
                              background: "#ffffff",
                              border: "1px solid #cbd5e1",
                              color: "#0f172a",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            Zero Padding Digits:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="8"
                            value={sbdRenumberDigits}
                            onChange={(e) => setSbdRenumberDigits(Number(e.target.value) || 4)}
                            style={{
                              width: "100%",
                              background: "#ffffff",
                              border: "1px solid #cbd5e1",
                              color: "#0f172a",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: "20px",
                          padding: "16px",
                          background: "#f8fafc",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>
                            Sample Renumbered Bill Number:
                          </div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#2563eb", marginTop: "2px" }}>
                            {`${sbdRenumberPrefix}${String(sbdRenumberStart).padStart(sbdRenumberDigits, '0')}`}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>
                            Total Invoices to Sequence:
                          </div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#7c3aed", marginTop: "2px" }}>
                            {(salesBills || []).length} Invoices
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button
                          onClick={() => setSbdRenumberConfirm(true)}
                          style={{
                            background: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "10px 22px",
                            fontSize: "13px",
                            fontWeight: "700",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
                          }}
                        >
                          Execute Renumbering
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation Modal for Batch Delete (Light Theme) */}
              {sbdConfirmModal && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 100000,
                    background: "rgba(15, 23, 42, 0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(4px)"
                  }}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #fecaca",
                      borderRadius: "12px",
                      width: "480px",
                      maxWidth: "95vw",
                      overflow: "hidden",
                      boxShadow: "0 25px 50px -12px rgba(220, 38, 38, 0.25)"
                    }}
                  >
                    <div style={{ padding: "16px 20px", background: "#fef2f2", borderBottom: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "10px" }}>
                      <AlertCircle size={22} color="#dc2626" />
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "#991b1b" }}>
                        Confirm Permanent Sales Bill Deletion
                      </span>
                    </div>

                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#334155" }}>
                      <p style={{ margin: 0 }}>
                        Are you sure you want to permanently delete <strong>{selectedCount}</strong> sales bills totaling <strong style={{ color: "#047857" }}>₹{selectedTotalAmt.toFixed(2)}</strong>?
                      </p>
                      <div style={{ background: "#f0fdf4", padding: "12px 14px", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "12px" }}>
                        <div style={{ color: "#166534", fontWeight: "700" }}>✓ Inventory Auto-Restoration:</div>
                        <div style={{ color: "#15803d", marginTop: "4px" }}>
                          Approximately <strong>{totalUnitsToRestore} medicine units</strong> will be returned to their respective batch stock.
                        </div>
                      </div>
                      <p style={{ margin: 0, color: "#dc2626", fontSize: "12px", fontWeight: "600" }}>
                        ⚠️ This action cannot be undone directly. A supervisor audit log entry will be permanently recorded.
                      </p>
                    </div>

                    <div style={{ padding: "14px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button
                        onClick={() => setSbdConfirmModal(false)}
                        style={{
                          background: "#ffffff",
                          color: "#475569",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "8px 16px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleExecuteDelete}
                        style={{
                          background: "#dc2626",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 18px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)"
                        }}
                      >
                        Confirm &amp; Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation Modal for Renumbering (Light Theme) */}
              {sbdRenumberConfirm && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 100000,
                    background: "rgba(15, 23, 42, 0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(4px)"
                  }}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "12px",
                      width: "480px",
                      maxWidth: "95vw",
                      overflow: "hidden",
                      boxShadow: "0 25px 50px -12px rgba(37, 99, 235, 0.25)"
                    }}
                  >
                    <div style={{ padding: "16px 20px", background: "#eff6ff", borderBottom: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: "10px" }}>
                      <TrendingUp size={22} color="#1d4ed8" />
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "#1e40af" }}>
                        Confirm Consecutive Renumbering
                      </span>
                    </div>

                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#334155" }}>
                      <p style={{ margin: 0 }}>
                        All <strong>{(salesBills || []).length}</strong> sales invoices will be sorted by date and renumbered sequentially starting from <strong style={{ color: "#1d4ed8" }}>{`${sbdRenumberPrefix}${String(sbdRenumberStart).padStart(sbdRenumberDigits, '0')}`}</strong>.
                      </p>
                      <p style={{ margin: 0, color: "#b45309", fontSize: "12px" }}>
                        Please ensure you have printed or archived any historical reports if old invoice numbers are required.
                      </p>
                    </div>

                    <div style={{ padding: "14px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button
                        onClick={() => setSbdRenumberConfirm(false)}
                        style={{
                          background: "#ffffff",
                          color: "#475569",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "8px 16px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleExecuteRenumbering}
                        style={{
                          background: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 18px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer"
                        }}
                      >
                        Confirm Renumbering
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
  })();
}
