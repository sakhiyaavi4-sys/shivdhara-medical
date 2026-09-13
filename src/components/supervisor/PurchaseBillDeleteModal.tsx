// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Search, Trash2, X, Check, CheckCircle, AlertCircle, TrendingUp, Truck } from 'lucide-react';
import { useMedicalStore, fmt, num, int, uid, today, inp, lbl, btn } from '../../MedicalStoreContext';

interface PurchaseBillDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PurchaseBillDeleteModal({ isOpen, onClose }: PurchaseBillDeleteModalProps) {
  const {
    saveItems, saveBatches, savePurchaseBills, items, batches, suppliers, purchaseBills, logUserChange
  } = useMedicalStore();

  const [pbdActiveTab, setPbdActiveTab] = useState<"delete" | "renumber">("delete");
  const [pbdFromDate, setPbdFromDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [pbdToDate, setPbdToDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [pbdLowerAmt, setPbdLowerAmt] = useState("");
  const [pbdHigherAmt, setPbdHigherAmt] = useState("");
  const [pbdSelectedMap, setPbdSelectedMap] = useState<{ [key: string]: boolean }>({});
  const [pbdSearchQuery, setPbdSearchQuery] = useState("");
  const [pbdConfirmModal, setPbdConfirmModal] = useState(false);
  const [pbdStatusMsg, setPbdStatusMsg] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Purchase Renumbering States
  const [pbdRenumberStart, setPbdRenumberStart] = useState(1);
  const [pbdRenumberPrefix, setPbdRenumberPrefix] = useState("ENT-");
  const [pbdRenumberDigits, setPbdRenumberDigits] = useState(4);
  const [pbdRenumberConfirm, setPbdRenumberConfirm] = useState(false);


  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pbdConfirmModal) {
          setPbdConfirmModal(false);
        } else if (pbdRenumberConfirm) {
          setPbdRenumberConfirm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pbdConfirmModal, pbdRenumberConfirm]);

  if (!isOpen) return null;

  return (() => {
          // Normalize purchase bills
          const rawBills = (purchaseBills || []).map((b: any, index: number) => {
            const billTotal = Number(b.totalAmount || b.total || b.netAmount || b.subtotal || 0);
            const billEntNo = String(b.entryNo || b.entNo || b.voucherNo || index + 1);
            const billEntDate = b.entryDate || b.entDate || b.date || today();
            const billNo = String(b.billNo || b.invoiceNo || b.challanNo || `PB-${index + 1}`);
            const billDate = b.billDate || b.date || billEntDate;
            const supplierName = b.supplier || b.supplierName || b.partyName || 'Standard Supplier';
            const billDiscount = Number(b.discount || b.disc || 0);
            const billUser = b.createdByName || b.user || currentUser?.username || 'ADMIN';
            const billId = String(b.id || b.billNo || index + 1);

            // Lookup supplier GST / ST No
            const suppObj = (suppliers || []).find((s: any) => (s.name || '').trim().toLowerCase() === supplierName.trim().toLowerCase());
            const stNo = suppObj?.gst || suppObj?.gstin || b.stNo || b.gstin || '-';

            return {
              ...b,
              _id: billId,
              _srNo: index + 1,
              _entNo: billEntNo,
              _entDate: billEntDate,
              _billNo: billNo,
              _billDate: billDate,
              _supplierName: supplierName,
              _amount: billTotal,
              _stNo: stNo,
              _disc: billDiscount,
              _user: billUser
            };
          });

          // Apply filters for Tab 1 (Delete Cash Purchase Bill)
          const eligibleBills = rawBills.filter((b: any) => {
            if (pbdFromDate && b._entDate < pbdFromDate) return false;
            if (pbdToDate && b._entDate > pbdToDate) return false;

            if (pbdLowerAmt.trim() && b._amount < Number(pbdLowerAmt)) return false;
            if (pbdHigherAmt.trim() && b._amount > Number(pbdHigherAmt)) return false;

            if (pbdSearchQuery.trim()) {
              const q = pbdSearchQuery.toLowerCase();
              const matchBill = b._billNo.toLowerCase().includes(q);
              const matchEnt = b._entNo.toLowerCase().includes(q);
              const matchSupp = b._supplierName.toLowerCase().includes(q);
              if (!matchBill && !matchEnt && !matchSupp) return false;
            }

            return true;
          });

          // Selected Bills calculation
          const selectedBills = eligibleBills.filter((b: any) => !!pbdSelectedMap[b._id]);
          const selectedCount = selectedBills.length;
          const selectedTotalAmt = selectedBills.reduce((acc: number, b: any) => acc + (b._amount || 0), 0);

          // Calculate total units to deduct from inventory across selected purchase bills
          const totalUnitsToDeduct = selectedBills.reduce((acc: number, b: any) => {
            const lineItems = b.items || [];
            const billUnits = lineItems.reduce((sum: number, it: any) => sum + Number(it.qty || it.quantity || 1) + Number(it.freeQty || 0), 0);
            return acc + billUnits;
          }, 0);

          // Select All (Yes)
          const handleSelectAll = () => {
            const nextMap: { [key: string]: boolean } = {};
            eligibleBills.forEach((b: any) => { nextMap[b._id] = true; });
            setPbdSelectedMap(nextMap);
          };

          // Deselect All (No)
          const handleDeselectAll = () => {
            setPbdSelectedMap({});
          };

          // Toggle Individual Row
          const handleToggleRow = (id: string) => {
            setPbdSelectedMap(prev => ({ ...prev, [id]: !prev[id] }));
          };

          // Export CSV
          const handleExportCSV = () => {
            try {
              const headers = ["Sr No", "Ent No", "Ent Date", "Bill No", "Bill Date", "Supplier Name", "Amount", "S.T.No", "Disc", "User", "Selected Y/N"];
              const rows = eligibleBills.map((b: any, idx: number) => [
                idx + 1,
                `"${b._entNo}"`,
                b._entDate,
                `"${b._billNo}"`,
                b._billDate,
                `"${b._supplierName.replace(/"/g, '""')}"`,
                b._amount.toFixed(2),
                `"${b._stNo}"`,
                b._disc.toFixed(2),
                `"${b._user}"`,
                pbdSelectedMap[b._id] ? "Y" : "N"
              ]);

              const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `Purchase_Bills_Delete_Register_${pbdFromDate}_to_${pbdToDate}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (err: any) {
              alert("Failed to export CSV: " + (err?.message || "Unknown error"));
            }
          };

          // Execute Batch Delete with Inventory Stock Deduction
          const handleExecuteDelete = () => {
            if (selectedBills.length === 0) {
              alert("Please select at least one purchase bill to delete.");
              return;
            }

            try {
              const selectedIds = new Set(selectedBills.map((b: any) => b._id));
              
              // 1. Deduct Inventory Stock for items and batches
              const updatedItems = [...items];
              const updatedBatches = [...batches];

              selectedBills.forEach((bill: any) => {
                const lineItems = bill.items || [];
                lineItems.forEach((li: any) => {
                  const qtyToDeduct = Number(li.qty || li.quantity || 1) + Number(li.freeQty || 0);
                  const targetItemId = li.itemId || li.id;
                  const targetBatchNo = li.batch || li.batchNo;

                  // Deduct from batch stock
                  if (targetBatchNo) {
                    const bIdx = updatedBatches.findIndex((b: any) => 
                      (b.itemId === targetItemId || !targetItemId) && (b.batchNo === targetBatchNo || b.batch === targetBatchNo)
                    );
                    if (bIdx !== -1) {
                      const currentStk = Number(updatedBatches[bIdx].stock || 0);
                      const newStk = Math.max(0, currentStk - qtyToDeduct);
                      updatedBatches[bIdx] = {
                        ...updatedBatches[bIdx],
                        stock: newStk,
                        currentStock: newStk
                      };
                    }
                  }

                  // Deduct from overall item stock
                  if (targetItemId) {
                    const iIdx = updatedItems.findIndex((it: any) => it.id === targetItemId);
                    if (iIdx !== -1) {
                      const curStk = Number(updatedItems[iIdx].stock || 0);
                      updatedItems[iIdx] = {
                        ...updatedItems[iIdx],
                        stock: Math.max(0, curStk - qtyToDeduct)
                      };
                    }
                  }
                });
              });

              // 2. Remove deleted bills from purchaseBills
              const updatedPurchases = (purchaseBills || []).filter((pb: any, idx: number) => {
                const id = String(pb.id || pb.billNo || idx + 1);
                return !selectedIds.has(id);
              });

              // Save to Store
              if (typeof saveItems === 'function') saveItems(updatedItems);
              if (typeof saveBatches === 'function') saveBatches(updatedBatches);
              if (typeof savePurchaseBills === 'function') savePurchaseBills(updatedPurchases);

              // 3. User Audit Logging
              if (typeof logUserChange === 'function') {
                logUserChange('SUPERVISOR_BATCH_DELETE_PURCHASE', {
                  deletedCount: selectedBills.length,
                  totalAmount: selectedTotalAmt,
                  deductedUnits: totalUnitsToDeduct,
                  billNumbers: selectedBills.map((b: any) => b._billNo).slice(0, 15).join(', ')
                }, `Permanently deleted ${selectedBills.length} purchase bills totalling ₹${selectedTotalAmt.toFixed(2)} and reversed ${totalUnitsToDeduct} inventory units`);
              }

              setPbdStatusMsg({
                type: "success",
                msg: `Successfully deleted ${selectedBills.length} purchase bills! ${totalUnitsToDeduct} medicine units have been deducted from inventory.`
              });

              setPbdSelectedMap({});
              setPbdConfirmModal(false);
              setTimeout(() => setPbdStatusMsg(null), 5000);
            } catch (err: any) {
              setPbdStatusMsg({ type: "error", msg: "Failed to delete purchase bills: " + (err?.message || "Unknown error") });
            }
          };

          // Execute Purchase Renumbering Logic
          const handleExecuteRenumbering = () => {
            try {
              // Sort purchase bills chronologically
              const sorted = [...(purchaseBills || [])].sort((a: any, b: any) => {
                const da = a.entryDate || a.date || a.createdAt || '';
                const db = b.entryDate || b.date || b.createdAt || '';
                return da.localeCompare(db);
              });

              let currentSeq = Number(pbdRenumberStart) || 1;
              const padLen = Number(pbdRenumberDigits) || 4;
              const prefix = pbdRenumberPrefix || '';

              const renumbered = sorted.map((pb: any) => {
                const newEntNo = `${prefix}${String(currentSeq).padStart(padLen, '0')}`;
                currentSeq++;
                return { ...pb, entryNo: newEntNo, entNo: newEntNo, voucherNo: newEntNo, hasRenumbered: true };
              });

              if (typeof savePurchaseBills === 'function') savePurchaseBills(renumbered);

              if (typeof logUserChange === 'function') {
                logUserChange('SUPERVISOR_PURCHASE_RENUMBER', {
                  totalRenumbered: renumbered.length,
                  startNo: pbdRenumberStart,
                  prefix: pbdRenumberPrefix
                }, `Renumbered ${renumbered.length} purchase vouchers starting from ${pbdRenumberPrefix}${pbdRenumberStart}`);
              }

              setPbdStatusMsg({
                type: "success",
                msg: `Successfully renumbered all ${renumbered.length} purchase entries consecutively!`
              });
              setPbdRenumberConfirm(false);
              setTimeout(() => setPbdStatusMsg(null), 4500);
            } catch (err: any) {
              setPbdStatusMsg({ type: "error", msg: "Renumbering failed: " + (err?.message || "Unknown error") });
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
              {/* Top Warning Banner (Light Red/Amber Alert Theme) */}
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
                    CAUTION: DELETING PURCHASE BILLS REVERSES INWARD VOUCHERS AND DEDUCTS STOCK QUANTITIES FROM INVENTORY
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
                      background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(220, 38, 38, 0.4)"
                    }}
                  >
                    <Truck size={22} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "17px", fontWeight: "800", color: "#ffffff" }}>
                        Purchase Bill Delete &amp; Renumbering Facility
                      </span>
                      <span
                        style={{
                          background: "rgba(220, 38, 38, 0.25)",
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
                      Batch reverse purchase inward invoices, adjust inventory batch stock, and re-sequence entry vouchers
                    </div>
                  </div>
                </div>

                {/* Sub-tabs Selector */}
                <div style={{ display: "flex", background: "rgba(255,255,255,0.1)", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <button
                    onClick={() => setPbdActiveTab("delete")}
                    style={{
                      background: pbdActiveTab === "delete" ? "#dc2626" : "transparent",
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
                    <Trash2 size={13} /> Delete Cash Purchase Bill
                  </button>

                  <button
                    onClick={() => setPbdActiveTab("renumber")}
                    style={{
                      background: pbdActiveTab === "renumber" ? "#3b82f6" : "transparent",
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
                    <TrendingUp size={13} /> Renumbering Purchase Bill
                  </button>
                </div>
              </div>

              {/* Status Alert Banner */}
              {pbdStatusMsg && (
                <div
                  style={{
                    padding: "10px 24px",
                    background: pbdStatusMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
                    borderBottom: `1px solid ${pbdStatusMsg.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                    color: pbdStatusMsg.type === "success" ? "#065f46" : "#991b1b",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0
                  }}
                >
                  {pbdStatusMsg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{pbdStatusMsg.msg}</span>
                </div>
              )}

              {/* ─── TAB 1: DELETE CASH PURCHASE BILL (LIGHT THEME) ─── */}
              {pbdActiveTab === "delete" && (
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
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>From Date:</span>
                        <input
                          type="date"
                          value={pbdFromDate}
                          onChange={(e) => setPbdFromDate(e.target.value)}
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
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>To Date...:</span>
                        <input
                          type="date"
                          value={pbdToDate}
                          onChange={(e) => setPbdToDate(e.target.value)}
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
                          setPbdFromDate(t);
                          setPbdToDate(t);
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
                          value={pbdLowerAmt}
                          onChange={(e) => setPbdLowerAmt(e.target.value)}
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
                          value={pbdHigherAmt}
                          onChange={(e) => setPbdHigherAmt(e.target.value)}
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

                      {/* Search Box */}
                      <div style={{ position: "relative" }}>
                        <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "8px", top: "8px" }} />
                        <input
                          type="text"
                          placeholder="Search Bill, Ent No, Supplier..."
                          value={pbdSearchQuery}
                          onChange={(e) => setPbdSearchQuery(e.target.value)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "6px 10px 6px 28px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            width: "200px"
                          }}
                        />
                      </div>
                    </div>

                    {/* Right Summary & Action Buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Bills:</span>
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

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Amount:</span>
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
                        Yes
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
                        No
                      </button>

                      {/* Delete Action Button */}
                      <button
                        onClick={() => {
                          if (selectedCount === 0) {
                            alert("No purchase bills selected for deletion. Mark Y on the bills you wish to delete.");
                            return;
                          }
                          setPbdConfirmModal(true);
                        }}
                        style={{
                          background: "#dc2626",
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
                          boxShadow: "0 2px 6px rgba(220, 38, 38, 0.4)"
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>

                      {/* File CSV Export */}
                      <button
                        onClick={handleExportCSV}
                        style={{
                          background: "#0284c7",
                          color: "#ffffff",
                          border: "none",
                          padding: "7px 14px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        File (CSV)
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
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Eligible Purchase Invoices</div>
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
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Stock Units to Deduct</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#ef4444", marginTop: "2px" }}>{totalUnitsToDeduct} Units</div>
                    </div>
                  </div>

                  {/* Main 12-Column Table (Light Theme) */}
                  <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
                    <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                          <tr style={{ background: "#0f172a", color: "#ffffff" }}>
                            <th style={{ padding: "10px 8px", textAlign: "center", width: "45px" }}>Sr No</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "85px" }}>Ent No</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "95px" }}>Ent Date</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "110px" }}>Bill No</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "95px" }}>Bill Date</th>
                            <th style={{ padding: "10px 12px", textAlign: "left" }}>Supplier Name</th>
                            <th style={{ padding: "10px 12px", textAlign: "right", width: "120px" }}>Amount</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "130px" }}>S.T.No</th>
                            <th style={{ padding: "10px 10px", textAlign: "right", width: "80px" }}>Disc.</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "90px" }}>User</th>
                            <th style={{ padding: "10px 8px", textAlign: "center", width: "65px" }}>Y/N</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eligibleBills.length === 0 ? (
                            <tr>
                              <td colSpan={11} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                                No purchase bills found matching the selected period and criteria.
                              </td>
                            </tr>
                          ) : (
                            eligibleBills.map((bill: any, idx: number) => {
                              const isSelected = !!pbdSelectedMap[bill._id];
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
                                  <td style={{ padding: "9px 10px", fontWeight: "700", color: "#7c3aed" }}>
                                    {bill._entNo}
                                  </td>
                                  <td style={{ padding: "9px 10px", color: "#334155" }}>
                                    {bill._entDate}
                                  </td>
                                  <td style={{ padding: "9px 10px", fontWeight: "700", color: "#1d4ed8" }}>
                                    {bill._billNo}
                                  </td>
                                  <td style={{ padding: "9px 10px", color: "#334155" }}>
                                    {bill._billDate}
                                  </td>
                                  <td style={{ padding: "9px 12px", color: "#0f172a", fontWeight: "600" }}>
                                    {bill._supplierName}
                                  </td>
                                  <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: "800", color: "#047857", fontFamily: "monospace", fontSize: "13px" }}>
                                    ₹{bill._amount.toFixed(2)}
                                  </td>
                                  <td style={{ padding: "9px 10px", color: "#64748b", fontSize: "11px", fontFamily: "monospace" }}>
                                    {bill._stNo}
                                  </td>
                                  <td style={{ padding: "9px 10px", textAlign: "right", color: "#d97706", fontFamily: "monospace" }}>
                                    {bill._disc > 0 ? `₹${bill._disc.toFixed(2)}` : "-"}
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

              {/* ─── TAB 2: RENUMBERING PURCHASE BILL (LIGHT THEME) ─── */}
              {pbdActiveTab === "renumber" && (
                <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
                  <div style={{ maxWidth: "750px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
                        Sequential Purchase Bill / Voucher Renumbering Configuration
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
                        When purchase bills are deleted, vouchers leave missing sequence numbers. This tool renumbers all purchase entries consecutively by entry date.
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "20px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            Entry Voucher Prefix:
                          </label>
                          <input
                            type="text"
                            value={pbdRenumberPrefix}
                            onChange={(e) => setPbdRenumberPrefix(e.target.value)}
                            placeholder="e.g. ENT-"
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
                            value={pbdRenumberStart}
                            onChange={(e) => setPbdRenumberStart(Number(e.target.value) || 1)}
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
                            value={pbdRenumberDigits}
                            onChange={(e) => setPbdRenumberDigits(Number(e.target.value) || 4)}
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
                            Sample Renumbered Entry Voucher:
                          </div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#7c3aed", marginTop: "2px" }}>
                            {`${pbdRenumberPrefix}${String(pbdRenumberStart).padStart(pbdRenumberDigits, '0')}`}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>
                            Total Purchase Bills to Sequence:
                          </div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#2563eb", marginTop: "2px" }}>
                            {(purchaseBills || []).length} Invoices
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button
                          onClick={() => setPbdRenumberConfirm(true)}
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
              {pbdConfirmModal && (
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
                      width: "500px",
                      maxWidth: "95vw",
                      overflow: "hidden",
                      boxShadow: "0 25px 50px -12px rgba(220, 38, 38, 0.25)"
                    }}
                  >
                    <div style={{ padding: "16px 20px", background: "#fef2f2", borderBottom: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "10px" }}>
                      <AlertCircle size={22} color="#dc2626" />
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "#991b1b" }}>
                        Confirm Permanent Purchase Bill Deletion
                      </span>
                    </div>

                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#334155" }}>
                      <p style={{ margin: 0 }}>
                        Are you sure you want to permanently delete <strong>{selectedCount}</strong> purchase bills totaling <strong style={{ color: "#047857" }}>₹{selectedTotalAmt.toFixed(2)}</strong>?
                      </p>
                      <div style={{ background: "#fff7ed", padding: "12px 14px", borderRadius: "8px", border: "1px solid #fed7aa", fontSize: "12px" }}>
                        <div style={{ color: "#c2410c", fontWeight: "700" }}>⚠️ Stock Deduction Warning:</div>
                        <div style={{ color: "#9a3412", marginTop: "4px" }}>
                          Approximately <strong>{totalUnitsToDeduct} medicine units</strong> will be deducted / removed from batch inventory.
                        </div>
                      </div>
                      <p style={{ margin: 0, color: "#dc2626", fontSize: "12px", fontWeight: "600" }}>
                        ⚠️ This action cannot be reversed automatically. A supervisor audit log entry will be permanently recorded.
                      </p>
                    </div>

                    <div style={{ padding: "14px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button
                        onClick={() => setPbdConfirmModal(false)}
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
              {pbdRenumberConfirm && (
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
                        All <strong>{(purchaseBills || []).length}</strong> purchase vouchers will be sorted by entry date and renumbered sequentially starting from <strong style={{ color: "#1d4ed8" }}>{`${pbdRenumberPrefix}${String(pbdRenumberStart).padStart(pbdRenumberDigits, '0')}`}</strong>.
                      </p>
                      <p style={{ margin: 0, color: "#b45309", fontSize: "12px" }}>
                        Please ensure you have printed or archived any historical purchase reports if old entry voucher numbers are required.
                      </p>
                    </div>

                    <div style={{ padding: "14px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button
                        onClick={() => setPbdRenumberConfirm(false)}
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
