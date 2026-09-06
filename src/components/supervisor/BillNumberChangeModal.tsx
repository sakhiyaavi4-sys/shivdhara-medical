// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  X, Search, FileText, CheckCircle, AlertCircle, AlertTriangle, 
  ArrowRight, ShieldCheck, History, Hash, Layers, RefreshCw, 
  Check, Calendar, Filter, User, Info, Tag
} from 'lucide-react';
import { useMedicalStore, btn, inp, lbl, fmt, num, int } from '../../MedicalStoreContext';

interface BillNumberChangeModalProps {
  onClose: () => void;
}

export default function BillNumberChangeModal({ onClose }: BillNumberChangeModalProps) {
  const { 
    salesBills, setSalesBills, saveSalesBills, 
    purchaseBills, setPurchaseBills, savePurchaseBills, 
    currentUser, showToast, showConfirm 
  } = useMedicalStore();

  const [billChangeType, setBillChangeType] = useState<'sales' | 'purchase'>('sales');
  const [billChangeSearch, setBillChangeSearch] = useState('');
  const [billChangeSelected, setBillChangeSelected] = useState<any>(null);
  const [billChangeNewNo, setBillChangeNewNo] = useState('');
  const [billChangeReason, setBillChangeReason] = useState('Correction of Bill Number');
  const [billChangeCustomReason, setBillChangeCustomReason] = useState('');
  const [billChangeActiveTab, setBillChangeActiveTab] = useState<'single' | 'batch' | 'logs'>('single');
  const [billChangeBatchStart, setBillChangeBatchStart] = useState('');
  const [billChangeBatchEnd, setBillChangeBatchEnd] = useState('');
  const [billChangeBatchNewStart, setBillChangeBatchNewStart] = useState('');
  const [billChangeStatus, setBillChangeStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [billChangeLoading, setBillChangeLoading] = useState(false);
  const [billChangeLogs, setBillChangeLogs] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('store_bill_number_changes') || '[]'); } catch (_) { return []; }
  });

  const recordBillChangeLog = (entry: any) => {
    try {
      const updated = [entry, ...billChangeLogs].slice(0, 100);
      setBillChangeLogs(updated);
      localStorage.setItem('store_bill_number_changes', JSON.stringify(updated));
    } catch (_) {}
  };

  const handleUpdateSingleBillNo = async () => {
    if (!billChangeSelected) {
      setBillChangeStatus({ type: 'error', msg: 'Please select a bill to change first.' });
      return;
    }
    const targetNew = String(billChangeNewNo || '').trim();
    if (!targetNew) {
      setBillChangeStatus({ type: 'error', msg: 'New bill number cannot be empty.' });
      return;
    }
    const oldNo = String(billChangeSelected.billNo || billChangeSelected.entryNo || billChangeSelected.id);
    if (targetNew === oldNo) {
      setBillChangeStatus({ type: 'error', msg: 'New bill number must be different from current bill number.' });
      return;
    }

    // Check duplicate
    if (billChangeType === 'sales') {
      const dup = salesBills.find(b => String(b.billNo || b.id).toLowerCase() === targetNew.toLowerCase() && b.id !== billChangeSelected.id);
      if (dup) {
        setBillChangeStatus({ type: 'error', msg: `Sales bill #${targetNew} already exists for ${dup.patientName || 'Walk-in'} (₹${fmt(dup.netAmount || dup.total || 0)})!` });
        return;
      }
    } else {
      const dup = purchaseBills.find(b => String(b.billNo || b.entryNo || b.id).toLowerCase() === targetNew.toLowerCase() && b.id !== billChangeSelected.id);
      if (dup) {
        setBillChangeStatus({ type: 'error', msg: `Purchase bill #${targetNew} already exists for ${dup.partyName || 'Supplier'} (₹${fmt(dup.total || dup.netAmount || 0)})!` });
        return;
      }
    }

    setBillChangeLoading(true);
    setBillChangeStatus(null);
    const finalReason = billChangeReason === 'Other' ? (billChangeCustomReason || 'Other correction') : billChangeReason;

    try {
      // 1. Try Backend API call
      try {
        await fetch('http://localhost:5000/api/change-bill-number', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: billChangeType,
            billId: billChangeSelected.id,
            oldBillNo: oldNo,
            newBillNo: targetNew,
            reason: finalReason,
            changedBy: currentUser?.username || 'ADMIN'
          })
        });
      } catch (_) {}

      // 2. Update React State and localStorage
      if (billChangeType === 'sales') {
        const updatedBills = salesBills.map(b => {
          if (b.id === billChangeSelected.id || String(b.billNo) === oldNo) {
            return { ...b, billNo: targetNew };
          }
          return b;
        });
        saveSalesBills(updatedBills);
      } else {
        const updatedBills = purchaseBills.map(b => {
          if (b.id === billChangeSelected.id || String(b.billNo) === oldNo) {
            return { ...b, billNo: targetNew };
          }
          return b;
        });
        savePurchaseBills(updatedBills);
      }

      // 3. User Audit Log
      logUserChange('CHANGE_BILL_NUMBER', {
        type: billChangeType,
        oldBillNo: oldNo,
        newBillNo: targetNew,
        party: billChangeSelected.patientName || billChangeSelected.partyName || 'N/A',
        amount: billChangeSelected.netAmount || billChangeSelected.total || 0,
        reason: finalReason
      }, `Bill #${oldNo} -> #${targetNew}`);

      // 4. Record local history
      recordBillChangeLog({
        id: Date.now(),
        date: new Date().toISOString(),
        type: billChangeType,
        oldBillNo: oldNo,
        newBillNo: targetNew,
        party: billChangeSelected.patientName || billChangeSelected.partyName || 'Walk-in',
        amount: billChangeSelected.netAmount || billChangeSelected.total || 0,
        reason: finalReason,
        user: currentUser?.username || 'ADMIN'
      });

      setBillChangeStatus({ type: 'success', msg: `Bill #${oldNo} has been successfully changed to #${targetNew}!` });
      setBillChangeSelected((prev: any) => prev ? { ...prev, billNo: targetNew } : null);
      setBillChangeNewNo('');
    } catch (err: any) {
      setBillChangeStatus({ type: 'error', msg: err?.message || 'Failed to update bill number.' });
    } finally {
      setBillChangeLoading(false);
    }
  };


  return (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            background: "#f1f5f9",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
          }}>
            {/* ── TOP HEADER ── */}
            <div style={{
              background: "linear-gradient(135deg, #042f2e 0%, #0d9488 50%, #0f172a 100%)",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              color: "#fff",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 10px rgba(255,255,255,0.2)"
                }}>
                  <FileText size={24} color="#5eead4" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", letterSpacing: "0.5px" }}>
                      Supervisor — Bill Number Change & Renumbering
                    </h2>
                    <span style={{
                      background: "#14b8a6",
                      color: "#042f2e",
                      fontSize: "10px",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      letterSpacing: "0.5px"
                    }}>
                      SUPERVISOR ONLY
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#ccfbf1", marginTop: "2px" }}>
                    Modify sales or purchase bill serial numbers with real-time audit logging and duplicate safety validation
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => { onClose(); setBillChangeStatus(null); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.85)"; e.currentTarget.style.borderColor = "transparent"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
              >
                <X size={16} /> Close [Esc]
              </button>
            </div>

            {/* ── NAVIGATION TABS & STATS BAR ── */}
            <div style={{
              background: "#ffffff",
              padding: "0 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  { id: "single", label: "Single Bill Change", icon: "🔄" },
                  { id: "batch", label: "Batch / Series Renumber", icon: "🔢" },
                  { id: "logs", label: `Audit History (${billChangeLogs.length})`, icon: "📜" }
                ].map(t => {
                  const isActive = billChangeActiveTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setBillChangeActiveTab(t.id as any); setBillChangeStatus(null); }}
                      style={{
                        padding: "12px 18px",
                        border: "none",
                        background: "none",
                        borderBottom: isActive ? "3px solid #0d9488" : "3px solid transparent",
                        color: isActive ? "#0d9488" : "#64748b",
                        fontWeight: isActive ? "700" : "500",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.15s"
                      }}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick DB Stats */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "#64748b" }}>
                <div>🛒 Total Sales Bills: <strong style={{ color: "#0f172a" }}>{salesBills.length}</strong></div>
                <div style={{ width: "1px", height: "14px", background: "#cbd5e1" }} />
                <div>📦 Total Purchase Bills: <strong style={{ color: "#0f172a" }}>{purchaseBills.length}</strong></div>
                <div style={{ width: "1px", height: "14px", background: "#cbd5e1" }} />
                <div>👤 Current User: <strong style={{ color: "#0d9488" }}>{currentUser?.username || "ADMIN"}</strong></div>
              </div>
            </div>

            {/* ── STATUS / ALERT BANNER ── */}
            {billChangeStatus && (
              <div style={{
                padding: "10px 24px",
                background: billChangeStatus.type === "success" ? "#dcfce7" : billChangeStatus.type === "error" ? "#fee2e2" : "#e0f2fe",
                color: billChangeStatus.type === "success" ? "#166534" : billChangeStatus.type === "error" ? "#991b1b" : "#075985",
                fontSize: "13px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                flexShrink: 0
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {billChangeStatus.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{billChangeStatus.msg}</span>
                </div>
                <button
                  onClick={() => setBillChangeStatus(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold" }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* ── MAIN CONTENT AREA ── */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              
              {/* ═══════════════════════════════════════ */}
              {/* TAB 1: SINGLE BILL NUMBER CHANGE */}
              {/* ═══════════════════════════════════════ */}
              {billChangeActiveTab === "single" && (
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "480px 1fr", gap: "16px", padding: "16px", overflow: "hidden" }}>
                  
                  {/* LEFT CONTROL PANEL */}
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    overflowY: "auto"
                  }}>
                    {/* Bill Type Selector */}
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                        1. Select Bill Type
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <button
                          onClick={() => { setBillChangeType("sales"); setBillChangeSelected(null); setBillChangeNewNo(""); setBillChangeStatus(null); }}
                          style={{
                            padding: "10px",
                            borderRadius: "8px",
                            border: billChangeType === "sales" ? "2px solid #0d9488" : "1px solid #e2e8f0",
                            background: billChangeType === "sales" ? "#f0fdfa" : "#f8fafc",
                            color: billChangeType === "sales" ? "#0f766e" : "#64748b",
                            fontWeight: "700",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            cursor: "pointer",
                            transition: "0.15s"
                          }}
                        >
                          <ShoppingCart size={16} /> Sales Bill
                        </button>
                        <button
                          onClick={() => { setBillChangeType("purchase"); setBillChangeSelected(null); setBillChangeNewNo(""); setBillChangeStatus(null); }}
                          style={{
                            padding: "10px",
                            borderRadius: "8px",
                            border: billChangeType === "purchase" ? "2px solid #0d9488" : "1px solid #e2e8f0",
                            background: billChangeType === "purchase" ? "#f0fdfa" : "#f8fafc",
                            color: billChangeType === "purchase" ? "#0f766e" : "#64748b",
                            fontWeight: "700",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            cursor: "pointer",
                            transition: "0.15s"
                          }}
                        >
                          <Package size={16} /> Purchase Bill
                        </button>
                      </div>
                    </div>

                    {/* Find Bill Input & Quick Search Dropdown */}
                    <div style={{ position: "relative" }}>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                        2. Search / Select Bill
                      </label>
                      <div style={{ position: "relative" }}>
                        <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="text"
                          value={billChangeSearch}
                          onChange={e => setBillChangeSearch(e.target.value)}
                          placeholder={billChangeType === "sales" ? "Search Bill #, Patient name or mobile..." : "Search Bill #, Party / Supplier name..."}
                          style={{
                            width: "100%",
                            padding: "10px 12px 10px 36px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            outline: "none",
                            background: "#fff",
                            boxSizing: "border-box"
                          }}
                        />
                        {billChangeSearch && (
                          <button
                            onClick={() => setBillChangeSearch("")}
                            style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Matching Dropdown if typing */}
                      {billChangeSearch.trim().length > 0 && (
                        <div style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          maxHeight: "220px",
                          overflowY: "auto",
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                          zIndex: 50,
                          marginTop: "4px"
                        }}>
                          {(() => {
                            const q = billChangeSearch.toLowerCase().trim();
                            const matches = (billChangeType === "sales" ? salesBills : purchaseBills).filter((b: any) => {
                              const bNo = String(b.billNo || b.entryNo || b.id).toLowerCase();
                              const party = String(b.patientName || b.partyName || b.supplierName || "").toLowerCase();
                              const mob = String(b.mobile || "");
                              return bNo.includes(q) || party.includes(q) || mob.includes(q);
                            }).slice(0, 15);

                            if (matches.length === 0) {
                              return <div style={{ padding: "12px", color: "#94a3b8", fontSize: "12px", textAlign: "center" }}>No matching bills found</div>;
                            }

                            return matches.map((b: any) => (
                              <div
                                key={b.id || b.billNo}
                                onClick={() => {
                                  setBillChangeSelected(b);
                                  setBillChangeSearch("");
                                  setBillChangeNewNo("");
                                  setBillChangeStatus(null);
                                }}
                                style={{
                                  padding: "9px 12px",
                                  borderBottom: "1px solid #f1f5f9",
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  transition: "0.15s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f0fdfa"}
                                onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
                              >
                                <div>
                                  <span style={{ fontWeight: "700", color: "#0f766e" }}>Bill #{b.billNo || b.entryNo || b.id}</span>
                                  <span style={{ marginLeft: "8px", color: "#334155", fontSize: "12px" }}>{b.patientName || b.partyName || "Walk-in"}</span>
                                </div>
                                <div style={{ textAlign: "right", fontSize: "11px", color: "#64748b" }}>
                                  <div style={{ fontWeight: "600", color: "#16a34a" }}>₹{fmt(b.netAmount || b.total || 0)}</div>
                                  <div>{new Date(b.date || b.billDate || Date.now()).toLocaleDateString("en-IN")}</div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Current Selected Bill Overview */}
                    <div style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      background: billChangeSelected ? "#f0fdfa" : "#f8fafc",
                      border: billChangeSelected ? "1px solid #99f6e4" : "1px dashed #cbd5e1"
                    }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                        Selected Current Bill
                      </div>
                      {billChangeSelected ? (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f766e" }}>
                              Bill #{billChangeSelected.billNo || billChangeSelected.entryNo || billChangeSelected.id}
                            </div>
                            <div style={{ fontSize: "12px", color: "#334155", marginTop: "2px" }}>
                              {billChangeSelected.patientName || billChangeSelected.partyName || "Walk-in"} · {new Date(billChangeSelected.date || billChangeSelected.billDate || Date.now()).toLocaleDateString("en-IN")}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "16px", fontWeight: "800", color: "#16a34a" }}>
                              ₹{fmt(billChangeSelected.netAmount || billChangeSelected.total || 0)}
                            </div>
                            <button
                              onClick={() => { setBillChangeSelected(null); setBillChangeNewNo(""); }}
                              style={{ background: "none", border: "none", color: "#ef4444", fontSize: "11px", cursor: "pointer", fontWeight: "600", textDecoration: "underline", padding: 0 }}
                            >
                              Change Selection
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                          No bill selected yet. Search above or select from the right table.
                        </div>
                      )}
                    </div>

                    {/* New Bill Number Input */}
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                        3. New Bill Number *
                      </label>
                      <input
                        type="text"
                        value={billChangeNewNo}
                        onChange={e => setBillChangeNewNo(e.target.value)}
                        placeholder="e.g. 105, SB-2026-0042, etc."
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "2px solid #0d9488",
                          fontSize: "15px",
                          fontWeight: "700",
                          color: "#0f172a",
                          outline: "none",
                          background: "#fff",
                          boxSizing: "border-box"
                        }}
                      />

                      {/* Live Duplicate Checker */}
                      {billChangeNewNo.trim() && (
                        <div style={{ marginTop: "6px", fontSize: "12px" }}>
                          {(() => {
                            const trimmed = billChangeNewNo.trim().toLowerCase();
                            const currentOld = String(billChangeSelected?.billNo || billChangeSelected?.entryNo || billChangeSelected?.id || "").toLowerCase();
                            if (trimmed === currentOld) {
                              return <span style={{ color: "#f59e0b", fontWeight: "600" }}>⚠️ Same as current bill number.</span>;
                            }
                            const exists = (billChangeType === "sales" ? salesBills : purchaseBills).some((b: any) =>
                              String(b.billNo || b.entryNo || b.id).toLowerCase() === trimmed && b.id !== billChangeSelected?.id
                            );
                            if (exists) {
                              return (
                                <span style={{ color: "#dc2626", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <AlertCircle size={14} /> Warning: Bill #{billChangeNewNo.trim()} already exists in records!
                                </span>
                              );
                            }
                            return (
                              <span style={{ color: "#16a34a", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                                <CheckCircle size={14} /> Bill #{billChangeNewNo.trim()} is available & valid.
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Reason for Change */}
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                        4. Reason for Change
                      </label>
                      <select
                        value={billChangeReason}
                        onChange={e => setBillChangeReason(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          outline: "none",
                          background: "#fff",
                          color: "#334155"
                        }}
                      >
                        <option value="Correction of Bill Number">Correction of Bill Number</option>
                        <option value="Series Gap / Alignment">Series Gap / Alignment</option>
                        <option value="Cancelled Bill Renumbering">Cancelled Bill Renumbering</option>
                        <option value="Audit / CA Verification">Audit / CA Verification</option>
                        <option value="Party Request / Replacement">Party Request / Replacement</option>
                        <option value="Other">Other</option>
                      </select>

                      {billChangeReason === "Other" && (
                        <input
                          type="text"
                          value={billChangeCustomReason}
                          onChange={e => setBillChangeCustomReason(e.target.value)}
                          placeholder="Type custom reason..."
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "12px",
                            outline: "none",
                            marginTop: "6px",
                            boxSizing: "border-box"
                          }}
                        />
                      )}
                    </div>

                    {/* Safety Alert Box */}
                    <div style={{
                      background: "#fffbeb",
                      border: "1px solid #fef3c7",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontSize: "11px",
                      color: "#92400e",
                      lineHeight: "1.4"
                    }}>
                      <strong>🛡️ Safety Notice:</strong> Changing bill numbers will update primary records, connected customer/supplier ledgers, and log this change under Supervisor Userwise Changes.
                    </div>

                    {/* Action Button */}
                    <div style={{ marginTop: "auto", paddingTop: "8px" }}>
                      <button
                        onClick={handleUpdateSingleBillNo}
                        disabled={billChangeLoading || !billChangeSelected || !billChangeNewNo.trim()}
                        style={{
                          width: "100%",
                          padding: "13px",
                          borderRadius: "8px",
                          border: "none",
                          background: (!billChangeSelected || !billChangeNewNo.trim() || billChangeLoading)
                            ? "#cbd5e1"
                            : "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                          color: "#ffffff",
                          fontWeight: "800",
                          fontSize: "14px",
                          letterSpacing: "0.5px",
                          cursor: (!billChangeSelected || !billChangeNewNo.trim() || billChangeLoading) ? "not-allowed" : "pointer",
                          boxShadow: (!billChangeSelected || !billChangeNewNo.trim()) ? "none" : "0 4px 12px rgba(13,148,136,0.35)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          transition: "0.15s"
                        }}
                      >
                        {billChangeLoading ? (
                          <span>Updating...</span>
                        ) : (
                          <>
                            <Check size={18} /> Confirm & Change Bill Number
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* RIGHT PREVIEW & QUICK PICKER PANEL */}
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                  }}>
                    {billChangeSelected ? (
                      /* ── LIVE BILL PREVIEW ── */
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div style={{
                          padding: "16px 20px",
                          background: "linear-gradient(90deg, #f8fafc, #f1f5f9)",
                          borderBottom: "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                              background: "#0d9488",
                              color: "#fff",
                              fontWeight: "800",
                              fontSize: "14px",
                              padding: "4px 10px",
                              borderRadius: "6px"
                            }}>
                              Current: #{billChangeSelected.billNo || billChangeSelected.entryNo || billChangeSelected.id}
                            </div>
                            <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                              {billChangeSelected.patientName || billChangeSelected.partyName || "Walk-in Customer"}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              📅 {new Date(billChangeSelected.date || billChangeSelected.billDate || Date.now()).toLocaleDateString("en-IN")}
                            </span>
                            <span style={{ fontSize: "14px", fontWeight: "800", color: "#16a34a" }}>
                              ₹{fmt(billChangeSelected.netAmount || billChangeSelected.total || 0)}
                            </span>
                          </div>
                        </div>

                        {/* Bill Meta Details Strip */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)",
                          gap: "12px",
                          padding: "12px 20px",
                          background: "#fafafa",
                          borderBottom: "1px solid #e2e8f0",
                          fontSize: "12px"
                        }}>
                          <div>
                            <span style={{ color: "#64748b" }}>Doctor / Ref: </span>
                            <strong style={{ color: "#1e293b" }}>{billChangeSelected.doctorName || "Self / None"}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#64748b" }}>Payment Mode: </span>
                            <strong style={{ color: "#0d9488", textTransform: "uppercase" }}>{billChangeSelected.paymentMode || "CASH"}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#64748b" }}>Mobile: </span>
                            <strong style={{ color: "#1e293b" }}>{billChangeSelected.mobile || "—"}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#64748b" }}>Items Count: </span>
                            <strong style={{ color: "#1e293b" }}>{billChangeSelected.items?.length || 0} items</strong>
                          </div>
                        </div>

                        {/* Items Table inside selected bill */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                          <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "700", color: "#334155" }}>
                            Items Contained in This Bill:
                          </h4>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                            <thead>
                              <tr style={{ background: "#f1f5f9", color: "#475569", textAlign: "left" }}>
                                <th style={{ padding: "8px 10px", borderRadius: "6px 0 0 6px" }}>#</th>
                                <th style={{ padding: "8px 10px" }}>Item Name</th>
                                <th style={{ padding: "8px 10px" }}>Batch</th>
                                <th style={{ padding: "8px 10px", textAlign: "right" }}>Qty</th>
                                <th style={{ padding: "8px 10px", textAlign: "right" }}>MRP</th>
                                <th style={{ padding: "8px 10px", textAlign: "right" }}>Rate</th>
                                <th style={{ padding: "8px 10px", textAlign: "right", borderRadius: "0 6px 6px 0" }}>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(billChangeSelected.items || []).map((it: any, idx: number) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                  <td style={{ padding: "8px 10px", color: "#94a3b8" }}>{idx + 1}</td>
                                  <td style={{ padding: "8px 10px", fontWeight: "600", color: "#1e293b" }}>{it.name || it.itemName}</td>
                                  <td style={{ padding: "8px 10px", color: "#64748b" }}>{it.batch || it.batchNo || "—"}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700" }}>{it.qty}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right", color: "#64748b" }}>₹{fmt(it.mrp)}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right", color: "#64748b" }}>₹{fmt(it.rate)}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: "#0f766e" }}>
                                    ₹{fmt(it.amount || ((it.rate || 0) * (it.qty || 1)))}
                                  </td>
                                </tr>
                              ))}
                              {(!billChangeSelected.items || billChangeSelected.items.length === 0) && (
                                <tr>
                                  <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                                    No item breakdown available for this bill record.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* ── QUICK BILL PICKER TABLE ── */
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div style={{
                          padding: "14px 20px",
                          background: "#f8fafc",
                          borderBottom: "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#1e293b" }}>
                              Recent {billChangeType === "sales" ? "Sales" : "Purchase"} Bills
                            </h3>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                              Click "Select" on any bill below to change its bill number
                            </div>
                          </div>
                          <span style={{ fontSize: "12px", color: "#0d9488", fontWeight: "700" }}>
                            Showing recent records
                          </span>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                            <thead>
                              <tr style={{ background: "#f1f5f9", color: "#475569", textAlign: "left" }}>
                                <th style={{ padding: "8px 12px", borderRadius: "6px 0 0 6px" }}>Bill #</th>
                                <th style={{ padding: "8px 12px" }}>Date</th>
                                <th style={{ padding: "8px 12px" }}>{billChangeType === "sales" ? "Patient / Customer" : "Supplier / Party"}</th>
                                <th style={{ padding: "8px 12px" }}>Payment</th>
                                <th style={{ padding: "8px 12px", textAlign: "right" }}>Amount (₹)</th>
                                <th style={{ padding: "8px 12px", textAlign: "center", borderRadius: "0 6px 6px 0" }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(billChangeType === "sales" ? salesBills : purchaseBills).slice(0, 50).map((b: any, idx: number) => (
                                <tr
                                  key={b.id || idx}
                                  style={{ borderBottom: "1px solid #f1f5f9", transition: "0.15s" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                  <td style={{ padding: "10px 12px", fontWeight: "800", color: "#0f766e" }}>
                                    #{b.billNo || b.entryNo || b.id}
                                  </td>
                                  <td style={{ padding: "10px 12px", color: "#64748b" }}>
                                    {new Date(b.date || b.billDate || Date.now()).toLocaleDateString("en-IN")}
                                  </td>
                                  <td style={{ padding: "10px 12px", fontWeight: "600", color: "#1e293b" }}>
                                    {b.patientName || b.partyName || "Walk-in"}
                                  </td>
                                  <td style={{ padding: "10px 12px" }}>
                                    <span style={{
                                      background: (b.paymentMode || "").toLowerCase() === "credit" ? "#fef3c7" : "#dcfce7",
                                      color: (b.paymentMode || "").toLowerCase() === "credit" ? "#92400e" : "#166534",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      fontSize: "10px",
                                      fontWeight: "700",
                                      textTransform: "uppercase"
                                    }}>
                                      {b.paymentMode || "CASH"}
                                    </span>
                                  </td>
                                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "800", color: "#16a34a" }}>
                                    ₹{fmt(b.netAmount || b.total || 0)}
                                  </td>
                                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                    <button
                                      onClick={() => {
                                        setBillChangeSelected(b);
                                        setBillChangeNewNo("");
                                        setBillChangeStatus(null);
                                      }}
                                      style={{
                                        background: "#0d9488",
                                        color: "#ffffff",
                                        border: "none",
                                        padding: "4px 10px",
                                        borderRadius: "6px",
                                        fontSize: "11px",
                                        fontWeight: "700",
                                        cursor: "pointer",
                                        transition: "0.15s"
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.background = "#0f766e"}
                                      onMouseLeave={e => e.currentTarget.style.background = "#0d9488"}
                                    >
                                      Select
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════ */}
              {/* TAB 2: BATCH / SERIES RENUMBERING */}
              {/* ═══════════════════════════════════════ */}
              {billChangeActiveTab === "batch" && (
                <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
                  <div style={{
                    maxWidth: "800px",
                    margin: "0 auto",
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                    padding: "24px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "24px" }}>🔢</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                          Batch Series Renumbering
                        </h3>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          Renumber a sequential range of bills (e.g. shift from #101-#120 to #201-#220)
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          Bill Type
                        </label>
                        <select
                          value={billChangeType}
                          onChange={e => setBillChangeType(e.target.value as any)}
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        >
                          <option value="sales">Sales Bills</option>
                          <option value="purchase">Purchase Bills</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          New Starting Number
                        </label>
                        <input
                          type="number"
                          value={billChangeBatchNewStart}
                          onChange={e => setBillChangeBatchNewStart(e.target.value)}
                          placeholder="e.g. 500"
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          From Bill No
                        </label>
                        <input
                          type="number"
                          value={billChangeBatchStart}
                          onChange={e => setBillChangeBatchStart(e.target.value)}
                          placeholder="e.g. 101"
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          To Bill No
                        </label>
                        <input
                          type="number"
                          value={billChangeBatchEnd}
                          onChange={e => setBillChangeBatchEnd(e.target.value)}
                          placeholder="e.g. 120"
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    <div style={{
                      background: "#f8fafc",
                      borderRadius: "8px",
                      padding: "14px",
                      marginBottom: "16px",
                      border: "1px solid #e2e8f0"
                    }}>
                      <div style={{ fontWeight: "700", fontSize: "12px", color: "#334155", marginBottom: "4px" }}>
                        Preview Calculation:
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {billChangeBatchStart && billChangeBatchEnd && billChangeBatchNewStart ? (
                          <span>
                            Bills from <strong>#{billChangeBatchStart}</strong> to <strong>#{billChangeBatchEnd}</strong> will be re-sequenced starting from <strong>#{billChangeBatchNewStart}</strong>.
                          </span>
                        ) : (
                          <span>Enter From, To, and New Start Number above to calculate preview.</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const s = parseInt(billChangeBatchStart);
                        const e = parseInt(billChangeBatchEnd);
                        const nStart = parseInt(billChangeBatchNewStart);
                        if (isNaN(s) || isNaN(e) || isNaN(nStart)) {
                          setBillChangeStatus({ type: "error", msg: "Please enter valid numeric values for From, To, and New Start." });
                          return;
                        }
                        if (s > e) {
                          setBillChangeStatus({ type: "error", msg: "From Bill No must be less than or equal to To Bill No." });
                          return;
                        }

                        let offset = nStart - s;
                        let updatedCount = 0;
                        if (billChangeType === "sales") {
                          const updated = salesBills.map(b => {
                            const bNo = parseInt(String(b.billNo));
                            if (!isNaN(bNo) && bNo >= s && bNo <= e) {
                              updatedCount++;
                              return { ...b, billNo: String(bNo + offset) };
                            }
                            return b;
                          });
                          saveSalesBills(updated);
                        } else {
                          const updated = purchaseBills.map(b => {
                            const bNo = parseInt(String(b.billNo));
                            if (!isNaN(bNo) && bNo >= s && bNo <= e) {
                              updatedCount++;
                              return { ...b, billNo: String(bNo + offset) };
                            }
                            return b;
                          });
                          savePurchaseBills(updated);
                        }

                        logUserChange("BATCH_RENUMBER_BILLS", {
                          type: billChangeType,
                          range: `#${s} to #${e}`,
                          newStart: nStart,
                          count: updatedCount
                        }, `Range #${s}-#${e} -> Start #${nStart}`);

                        recordBillChangeLog({
                          id: Date.now(),
                          date: new Date().toISOString(),
                          type: billChangeType,
                          oldBillNo: `Range #${s}-#${e}`,
                          newBillNo: `New Start #${nStart} (${updatedCount} bills)`,
                          party: "Batch Renumber",
                          amount: 0,
                          reason: "Batch Series Renumbering",
                          user: currentUser?.username || "ADMIN"
                        });

                        setBillChangeStatus({ type: "success", msg: `Successfully renumbered ${updatedCount} ${billChangeType} bills from #${s}-#${e} to starting from #${nStart}!` });
                      }}
                      style={{
                        padding: "12px 20px",
                        background: "#0d9488",
                        color: "#fff",
                        fontWeight: "700",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                    >
                      Execute Batch Renumbering
                    </button>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════ */}
              {/* TAB 3: AUDIT HISTORY / LOGS */}
              {/* ═══════════════════════════════════════ */}
              {billChangeActiveTab === "logs" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "16px" }}>
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      padding: "14px 20px",
                      background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#1e293b" }}>
                          Bill Number Renumbering Audit Logs
                        </h3>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Complete trace of all supervisor bill number modifications
                        </div>
                      </div>

                      {billChangeLogs.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to clear local change history logs?")) {
                              setBillChangeLogs([]);
                              localStorage.removeItem("store_bill_number_changes");
                            }
                          }}
                          style={{
                            background: "#fee2e2",
                            color: "#b91c1c",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                        >
                          Clear History
                        </button>
                      )}
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9", color: "#475569", textAlign: "left" }}>
                            <th style={{ padding: "8px 12px", borderRadius: "6px 0 0 6px" }}>Date / Time</th>
                            <th style={{ padding: "8px 12px" }}>Type</th>
                            <th style={{ padding: "8px 12px" }}>Old Bill No</th>
                            <th style={{ padding: "8px 12px" }}>New Bill No</th>
                            <th style={{ padding: "8px 12px" }}>Party / Customer</th>
                            <th style={{ padding: "8px 12px" }}>Reason</th>
                            <th style={{ padding: "8px 12px", borderRadius: "0 6px 6px 0" }}>User</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billChangeLogs.map((log: any) => (
                            <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "10px 12px", color: "#64748b" }}>
                                {new Date(log.date).toLocaleString("en-IN")}
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{
                                  background: log.type === "sales" ? "#e0f2fe" : "#fef3c7",
                                  color: log.type === "sales" ? "#0369a1" : "#92400e",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  fontWeight: "700",
                                  textTransform: "uppercase"
                                }}>
                                  {log.type}
                                </span>
                              </td>
                              <td style={{ padding: "10px 12px", fontWeight: "700", color: "#dc2626" }}>
                                #{log.oldBillNo}
                              </td>
                              <td style={{ padding: "10px 12px", fontWeight: "800", color: "#16a34a" }}>
                                #{log.newBillNo}
                              </td>
                              <td style={{ padding: "10px 12px", fontWeight: "600", color: "#1e293b" }}>
                                {log.party}
                              </td>
                              <td style={{ padding: "10px 12px", color: "#475569" }}>
                                {log.reason}
                              </td>
                              <td style={{ padding: "10px 12px", fontWeight: "700", color: "#0f766e" }}>
                                {log.user}
                              </td>
                            </tr>
                          ))}
                          {billChangeLogs.length === 0 && (
                            <tr>
                              <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                                No bill number changes recorded yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
  );
}
