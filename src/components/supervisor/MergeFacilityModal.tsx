// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  X, Search, GitMerge, AlertTriangle, CheckCircle, Database, 
  ArrowRight, ShieldAlert, Layers, Users, Building2, Truck, 
  Stethoscope, Pill, RefreshCw, Trash2, Check
} from 'lucide-react';
import { useMedicalStore, btn, inp, lbl, fmt, num, int } from '../../MedicalStoreContext';

interface MergeFacilityModalProps {
  onClose: () => void;
}

export default function MergeFacilityModal({ onClose }: MergeFacilityModalProps) {
  const { 
    items, batches, suppliers, salesBills, purchaseBills, 
    saveItems, saveBatches, saveSuppliers, saveSalesBills, savePurchaseBills, 
    showToast, showConfirm 
  } = useMedicalStore();

  const [mergeFacilityOpt, setMergeFacilityOpt] = useState<"delete" | "nodelete">("delete");
  const [mergeCategory, setMergeCategory] = useState<"item" | "company" | "supplier" | "debtor" | "generic" | "doctor">("item");
  const [mergeSourceId, setMergeSourceId] = useState<string>("");
  const [mergeSourceName, setMergeSourceName] = useState<string>("");
  const [mergeTargetId, setMergeTargetId] = useState<string>("");
  const [mergeTargetName, setMergeTargetName] = useState<string>("");
  const [mergeSourceSearch, setMergeSourceSearch] = useState<string>("");
  const [mergeTargetSearch, setMergeTargetSearch] = useState<string>("");
  const [mergeLoading, setMergeLoading] = useState<boolean>(false);
  const [mergeStatus, setMergeStatus] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
  const [mergeConfirmChecked, setMergeConfirmChecked] = useState<boolean>(false);
  const [mergeActiveTab, setMergeActiveTab] = useState<"merge" | "logs">("merge");
  const [mergeLogs, setMergeLogs] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('store_merge_history') || '[]'); } catch (_) { return []; }
  });

  const handleExecuteMerge = async () => {
    if (!mergeSourceName || !mergeTargetName) {
      setMergeStatus({ type: "error", msg: "Please select both Source and Target records before proceeding." });
      return;
    }
    if ((mergeSourceId && mergeSourceId === mergeTargetId) || (mergeSourceName.trim().toLowerCase() === mergeTargetName.trim().toLowerCase())) {
      setMergeStatus({ type: "error", msg: "Source and Target records cannot be the same. Please select two different records." });
      return;
    }
    if (!mergeConfirmChecked) {
      setMergeStatus({ type: "error", msg: "Please confirm that you have taken a backup and accept the permanent merge action." });
      return;
    }

    setMergeLoading(true);
    setMergeStatus(null);
    const deleteSource = mergeFacilityOpt === "delete";

    try {
      // 1. Call Backend API
      try {
        await fetch('http://localhost:5000/api/merge-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: mergeCategory,
            sourceId: mergeSourceId,
            sourceName: mergeSourceName,
            targetId: mergeTargetId,
            targetName: mergeTargetName,
            deleteSource,
            changedBy: currentUser?.username || 'ADMIN'
          })
        });
      } catch (_) {}

      // 2. Perform React State update
      if (mergeCategory === "item") {
        const sId = Number(mergeSourceId);
        const tId = Number(mergeTargetId);
        const sourceItem = items.find((i: any) => i.id === sId || i.name === mergeSourceName);
        const targetItem = items.find((i: any) => i.id === tId || i.name === mergeTargetName);

        if (targetItem) {
          const addedStock = (sourceItem && Number(sourceItem.stock)) || 0;
          // Re-link batches to target item
          const updatedBatches = batches.map((b: any) => {
            if (b.itemId === sId || (sourceItem && b.itemId === sourceItem.id)) {
              return { ...b, itemId: targetItem.id, itemName: targetItem.name };
            }
            return b;
          });
          saveBatches(updatedBatches);

          // Update items
          let updatedItems = items.map((i: any) => {
            if (i.id === targetItem.id) {
              return { ...i, stock: (Number(i.stock) || 0) + addedStock };
            }
            return i;
          });
          if (deleteSource && sourceItem) {
            updatedItems = updatedItems.filter((i: any) => i.id !== sourceItem.id);
          }
          saveItems(updatedItems);
        }
      } else if (mergeCategory === "company") {
        const updatedItems = items.map((i: any) => {
          if ((i.company || '').trim().toLowerCase() === mergeSourceName.trim().toLowerCase()) {
            return { ...i, company: mergeTargetName.trim() };
          }
          return i;
        });
        saveItems(updatedItems);
      } else if (mergeCategory === "supplier") {
        const sId = mergeSourceId;
        const tId = mergeTargetId;
        const updatedPurchases = purchaseBills.map((pb: any) => {
          if (String(pb.supplierId) === String(sId) || (pb.partyName || '').toLowerCase() === mergeSourceName.toLowerCase()) {
            return { ...pb, supplierId: tId, partyName: mergeTargetName };
          }
          return pb;
        });
        savePurchaseBills(updatedPurchases);

        const updatedPayments = payments.map((p: any) => {
          if (String(p.supplierId) === String(sId) || (p.accountName || '').toLowerCase() === mergeSourceName.toLowerCase()) {
            return { ...p, supplierId: tId, accountName: mergeTargetName };
          }
          return p;
        });
        savePayments(updatedPayments);

        if (deleteSource && sId) {
          const updatedSupps = suppliers.filter((s: any) => String(s.id) !== String(sId));
          saveSuppliers(updatedSupps);
        }
      } else if (mergeCategory === "debtor") {
        const updatedSales = salesBills.map((sb: any) => {
          if ((sb.patientName || '').toLowerCase() === mergeSourceName.toLowerCase()) {
            return { ...sb, patientName: mergeTargetName };
          }
          return sb;
        });
        saveSalesBills(updatedSales);
      } else if (mergeCategory === "generic") {
        const updatedItems = items.map((i: any) => {
          if ((i.generic || i.genericName || '').toLowerCase() === mergeSourceName.toLowerCase()) {
            return { ...i, generic: mergeTargetName, genericName: mergeTargetName };
          }
          return i;
        });
        saveItems(updatedItems);
      } else if (mergeCategory === "doctor") {
        const updatedSales = salesBills.map((sb: any) => {
          if ((sb.doctorName || '').toLowerCase() === mergeSourceName.toLowerCase()) {
            return { ...sb, doctorName: mergeTargetName };
          }
          return sb;
        });
        saveSalesBills(updatedSales);
        if (deleteSource && mergeSourceId && typeof setDoctors === 'function') {
          setDoctors((prev: any[]) => prev.filter(d => String(d.id) !== String(mergeSourceId)));
        }
      }

      // 3. User Audit Logging
      logUserChange("MERGE_DATA", {
        category: mergeCategory,
        source: mergeSourceName,
        target: mergeTargetName,
        deleteSource: deleteSource ? "Deleted" : "Retained",
        user: currentUser?.username || "ADMIN"
      }, `Merged ${mergeCategory.toUpperCase()}: "${mergeSourceName}" -> "${mergeTargetName}"`);

      // 4. Save to Merge History
      const logEntry = {
        id: Date.now(),
        date: new Date().toISOString(),
        category: mergeCategory,
        source: mergeSourceName,
        target: mergeTargetName,
        deleteSource,
        user: currentUser?.username || 'ADMIN'
      };
      const updatedLogs = [logEntry, ...mergeLogs].slice(0, 100);
      setMergeLogs(updatedLogs);
      localStorage.setItem('store_merge_history', JSON.stringify(updatedLogs));

      setMergeStatus({
        type: "success",
        msg: `Successfully merged ${mergeCategory} "${mergeSourceName}" into "${mergeTargetName}"!`
      });
      setMergeSourceId("");
      setMergeSourceName("");
      setMergeTargetId("");
      setMergeTargetName("");
      setMergeConfirmChecked(false);
    } catch (err: any) {
      setMergeStatus({ type: "error", msg: err?.message || "Failed to execute merge operation." });
    } finally {
      setMergeLoading(false);
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
                  <Package size={24} color="#5eead4" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", letterSpacing: "0.5px" }}>
                      Supervisor — Data Merge Facility
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
                      ADMIN LEVEL
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#ccfbf1", marginTop: "2px" }}>
                    Consolidate duplicate items, companies, suppliers, accounts, generics, or doctors into a single primary record
                  </div>
                </div>
              </div>

              {/* Header Right Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={() => { onClose(); setMergeStatus(null); }}
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
            </div>

            {/* ── CRITICAL SAFETY BACKUP BANNER (Proper English as requested) ── */}
            <div style={{
              background: "linear-gradient(90deg, #fffbeb 0%, #fef2f2 100%)",
              borderBottom: "2px solid #fecaca",
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: "900",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  letterSpacing: "0.8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <AlertCircle size={14} /> CRITICAL SAFETY WARNING
                </div>
                <div>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#991b1b" }}>
                    PLEASE TAKE A COMPLETE DATABASE BACKUP BEFORE MERGING ANY RECORDS
                  </span>
                  <span style={{ fontSize: "12px", color: "#7f1d1d", marginLeft: "8px" }}>
                    — Merged transactions, batches, and ledger links cannot be automatically reversed.
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  try {
                    handleExportData();
                  } catch (_) {
                    alert("Backup export triggered. Please verify download.");
                  }
                }}
                style={{
                  background: "#991b1b",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(153,27,27,0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>💾</span> Take Data Backup Now
              </button>
            </div>

            {/* ── NAVIGATION BAR: CATEGORY TABS & MERGE OPTION ── */}
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
              {/* Category Selection Tabs */}
              <div style={{ display: "flex", gap: "4px" }}>
                {[
                  { id: "item", label: "Merge Item", icon: "💊" },
                  { id: "company", label: "Merge Company", icon: "🏭" },
                  { id: "supplier", label: "Merge Supplier", icon: "🚚" },
                  { id: "debtor", label: "Merge Debtor / Customer", icon: "👥" },
                  { id: "generic", label: "Merge Generic", icon: "🧬" },
                  { id: "doctor", label: "Merge Doctor", icon: "🩺" },
                ].map(cat => {
                  const isActive = mergeActiveTab === "merge" && mergeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setMergeActiveTab("merge");
                        setMergeCategory(cat.id as any);
                        setMergeSourceId("");
                        setMergeSourceName("");
                        setMergeTargetId("");
                        setMergeTargetName("");
                        setMergeSourceSearch("");
                        setMergeTargetSearch("");
                        setMergeStatus(null);
                        setMergeConfirmChecked(false);
                      }}
                      style={{
                        padding: "12px 14px",
                        border: "none",
                        background: "none",
                        borderBottom: isActive ? "3px solid #0d9488" : "3px solid transparent",
                        color: isActive ? "#0d9488" : "#64748b",
                        fontWeight: isActive ? "800" : "600",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.15s"
                      }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => { setMergeActiveTab("logs"); setMergeStatus(null); }}
                  style={{
                    padding: "12px 14px",
                    border: "none",
                    background: "none",
                    borderBottom: mergeActiveTab === "logs" ? "3px solid #0d9488" : "3px solid transparent",
                    color: mergeActiveTab === "logs" ? "#0d9488" : "#64748b",
                    fontWeight: mergeActiveTab === "logs" ? "800" : "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s"
                  }}
                >
                  <span>📜</span>
                  <span>Merge History ({mergeLogs.length})</span>
                </button>
              </div>

              {/* Merge Deletion Option Radio Buttons */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                background: "#f8fafc",
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "12px"
              }}>
                <span style={{ fontWeight: "700", color: "#475569" }}>Post-Merge Action:</span>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: mergeFacilityOpt === "delete" ? "700" : "500", color: mergeFacilityOpt === "delete" ? "#dc2626" : "#334155" }}>
                  <input
                    type="radio"
                    name="mergeFacilityOpt"
                    checked={mergeFacilityOpt === "delete"}
                    onChange={() => setMergeFacilityOpt("delete")}
                    style={{ accentColor: "#dc2626" }}
                  />
                  Delete Source Record After Merging (Recommended)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: mergeFacilityOpt === "nodelete" ? "700" : "500", color: mergeFacilityOpt === "nodelete" ? "#0f766e" : "#334155" }}>
                  <input
                    type="radio"
                    name="mergeFacilityOpt"
                    checked={mergeFacilityOpt === "nodelete"}
                    onChange={() => setMergeFacilityOpt("nodelete")}
                    style={{ accentColor: "#0d9488" }}
                  />
                  Keep Source Record (Reassign Transactions Only)
                </label>
              </div>
            </div>

            {/* ── STATUS ALERT BANNER ── */}
            {mergeStatus && (
              <div style={{
                padding: "10px 24px",
                background: mergeStatus.type === "success" ? "#dcfce7" : mergeStatus.type === "error" ? "#fee2e2" : "#e0f2fe",
                color: mergeStatus.type === "success" ? "#166534" : mergeStatus.type === "error" ? "#991b1b" : "#075985",
                fontSize: "13px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                flexShrink: 0
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {mergeStatus.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{mergeStatus.msg}</span>
                </div>
                <button
                  onClick={() => setMergeStatus(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold" }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* ── MAIN WORKSPACE ── */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              
              {/* TAB 1: ACTIVE MERGE CONFIGURATION */}
              {mergeActiveTab === "merge" && (
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", padding: "20px", overflow: "hidden" }}>
                  
                  {/* LEFT COLUMN: SOURCE AND TARGET SELECTOR */}
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    overflowY: "auto"
                  }}>
                    <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a", textTransform: "capitalize" }}>
                        Merge {mergeCategory} Configuration
                      </h3>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        Select the duplicate record to merge from, and the primary record to merge into
                      </div>
                    </div>

                    {/* SOURCE RECORD (FROM) */}
                    <div style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "10px",
                      padding: "14px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <label style={{ fontSize: "12px", fontWeight: "800", color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          🔴 1. Source {mergeCategory} (Duplicate Record to Merge Away) *
                        </label>
                        {mergeSourceName && (
                          <button
                            onClick={() => { setMergeSourceId(""); setMergeSourceName(""); setMergeSourceSearch(""); }}
                            style={{ background: "none", border: "none", color: "#ef4444", fontSize: "11px", fontWeight: "700", cursor: "pointer", textDecoration: "underline" }}
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {mergeSourceName ? (
                        <div style={{
                          background: "#ffffff",
                          border: "1px solid #f87171",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <div>
                            <div style={{ fontWeight: "800", fontSize: "14px", color: "#991b1b" }}>
                              {mergeSourceName}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                              {mergeSourceId ? `ID: #${mergeSourceId}` : 'Primary Record'}
                            </div>
                          </div>
                          <span style={{
                            background: "#fee2e2",
                            color: "#991b1b",
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "4px"
                          }}>
                            {mergeFacilityOpt === "delete" ? "Will be DELETED" : "Will be REASSIGNED"}
                          </span>
                        </div>
                      ) : (
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            value={mergeSourceSearch}
                            onChange={e => setMergeSourceSearch(e.target.value)}
                            placeholder={`Type to search source ${mergeCategory}...`}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: "1px solid #fca5a5",
                              fontSize: "13px",
                              outline: "none",
                              background: "#fff",
                              boxSizing: "border-box"
                            }}
                          />

                          {/* Matching options list */}
                          <div style={{
                            maxHeight: "180px",
                            overflowY: "auto",
                            background: "#ffffff",
                            border: "1px solid #fca5a5",
                            borderRadius: "8px",
                            marginTop: "6px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
                          }}>
                            {(() => {
                              const q = mergeSourceSearch.trim().toLowerCase();
                              let candidates: { id: string; name: string; info: string }[] = [];

                              if (mergeCategory === "item") {
                                candidates = items.filter((i: any) => !q || (i.name || '').toLowerCase().includes(q) || (i.company || '').toLowerCase().includes(q))
                                  .slice(0, 20)
                                  .map((i: any) => ({ id: String(i.id), name: i.name, info: `Stock: ${i.stock || 0} · ${i.company || 'N/A'}` }));
                              } else if (mergeCategory === "company") {
                                const comps = Array.from(new Set(items.map((i: any) => (i.company || '').trim()).filter(Boolean))) as string[];
                                candidates = comps.filter(c => !q || c.toLowerCase().includes(q))
                                  .slice(0, 20)
                                  .map(c => ({ id: "", name: c, info: `${items.filter((i: any) => (i.company || '').trim() === c).length} items linked` }));
                              } else if (mergeCategory === "supplier") {
                                candidates = suppliers.filter((s: any) => !q || (s.name || '').toLowerCase().includes(q))
                                  .slice(0, 20)
                                  .map((s: any) => ({ id: String(s.id), name: s.name, info: `Phone: ${s.phone || s.mobile || '—'}` }));
                              } else if (mergeCategory === "debtor") {
                                const names = Array.from(new Set(salesBills.map((b: any) => (b.patientName || '').trim()).filter(Boolean))) as string[];
                                candidates = names.filter(n => !q || n.toLowerCase().includes(q))
                                  .slice(0, 20)
                                  .map(n => ({ id: "", name: n, info: `${salesBills.filter((b: any) => (b.patientName || '').trim() === n).length} bills recorded` }));
                              } else if (mergeCategory === "generic") {
                                const gens = Array.from(new Set(items.map((i: any) => (i.generic || i.genericName || '').trim()).filter(Boolean))) as string[];
                                candidates = gens.filter(g => !q || g.toLowerCase().includes(g))
                                  .slice(0, 20)
                                  .map(g => ({ id: "", name: g, info: `${items.filter((i: any) => (i.generic || i.genericName || '').trim() === g).length} items` }));
                              } else if (mergeCategory === "doctor") {
                                candidates = (doctors || []).filter((d: any) => !q || (d.name || '').toLowerCase().includes(q))
                                  .slice(0, 20)
                                  .map((d: any) => ({ id: String(d.id), name: d.name, info: `Speciality: ${d.speciality || 'General'}` }));
                              }

                              if (candidates.length === 0) {
                                return <div style={{ padding: "10px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>No records found</div>;
                              }

                              return candidates.map(c => (
                                <div
                                  key={c.id || c.name}
                                  onClick={() => {
                                    setMergeSourceId(c.id);
                                    setMergeSourceName(c.name);
                                    setMergeSourceSearch("");
                                  }}
                                  style={{
                                    padding: "8px 12px",
                                    borderBottom: "1px solid #f1f5f9",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                                  onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
                                >
                                  <strong style={{ color: "#1e293b" }}>{c.name}</strong>
                                  <span style={{ color: "#64748b", fontSize: "11px" }}>{c.info}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* MERGE DIRECTION ARROW */}
                    <div style={{ textAlign: "center", margin: "-6px 0" }}>
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#0d9488",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: "800",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        letterSpacing: "0.5px",
                        boxShadow: "0 2px 6px rgba(13,148,136,0.3)"
                      }}>
                        ⬇️ MERGING ALL DATA INTO ⬇️
                      </div>
                    </div>

                    {/* TARGET RECORD (TO) */}
                    <div style={{
                      background: "#f0fdfa",
                      border: "1px solid #99f6e4",
                      borderRadius: "10px",
                      padding: "14px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <label style={{ fontSize: "12px", fontWeight: "800", color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          🟢 2. Target {mergeCategory} (Primary Record to Keep) *
                        </label>
                        {mergeTargetName && (
                          <button
                            onClick={() => { setMergeTargetId(""); setMergeTargetName(""); setMergeTargetSearch(""); }}
                            style={{ background: "none", border: "none", color: "#0d9488", fontSize: "11px", fontWeight: "700", cursor: "pointer", textDecoration: "underline" }}
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {mergeTargetName ? (
                        <div style={{
                          background: "#ffffff",
                          border: "1px solid #14b8a6",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <div>
                            <div style={{ fontWeight: "800", fontSize: "14px", color: "#0f766e" }}>
                              {mergeTargetName}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                              {mergeTargetId ? `ID: #${mergeTargetId}` : 'Primary Record'}
                            </div>
                          </div>
                          <span style={{
                            background: "#ccfbf1",
                            color: "#0f766e",
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "4px"
                          }}>
                            WILL RECEIVE ALL DATA
                          </span>
                        </div>
                      ) : (
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            value={mergeTargetSearch}
                            onChange={e => setMergeTargetSearch(e.target.value)}
                            placeholder={`Type to search target ${mergeCategory}...`}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: "1px solid #5eead4",
                              fontSize: "13px",
                              outline: "none",
                              background: "#fff",
                              boxSizing: "border-box"
                            }}
                          />

                          {/* Matching options list */}
                          <div style={{
                            maxHeight: "180px",
                            overflowY: "auto",
                            background: "#ffffff",
                            border: "1px solid #5eead4",
                            borderRadius: "8px",
                            marginTop: "6px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
                          }}>
                            {(() => {
                              const q = mergeTargetSearch.trim().toLowerCase();
                              let candidates: { id: string; name: string; info: string }[] = [];

                              if (mergeCategory === "item") {
                                candidates = items.filter((i: any) => (!q || (i.name || '').toLowerCase().includes(q) || (i.company || '').toLowerCase().includes(q)) && String(i.id) !== mergeSourceId)
                                  .slice(0, 20)
                                  .map((i: any) => ({ id: String(i.id), name: i.name, info: `Stock: ${i.stock || 0} · ${i.company || 'N/A'}` }));
                              } else if (mergeCategory === "company") {
                                const comps = Array.from(new Set(items.map((i: any) => (i.company || '').trim()).filter(Boolean))) as string[];
                                candidates = comps.filter(c => (!q || c.toLowerCase().includes(q)) && c.toLowerCase() !== mergeSourceName.toLowerCase())
                                  .slice(0, 20)
                                  .map(c => ({ id: "", name: c, info: `${items.filter((i: any) => (i.company || '').trim() === c).length} items linked` }));
                              } else if (mergeCategory === "supplier") {
                                candidates = suppliers.filter((s: any) => (!q || (s.name || '').toLowerCase().includes(q)) && String(s.id) !== mergeSourceId)
                                  .slice(0, 20)
                                  .map((s: any) => ({ id: String(s.id), name: s.name, info: `Phone: ${s.phone || s.mobile || '—'}` }));
                              } else if (mergeCategory === "debtor") {
                                const names = Array.from(new Set(salesBills.map((b: any) => (b.patientName || '').trim()).filter(Boolean))) as string[];
                                candidates = names.filter(n => (!q || n.toLowerCase().includes(q)) && n.toLowerCase() !== mergeSourceName.toLowerCase())
                                  .slice(0, 20)
                                  .map(n => ({ id: "", name: n, info: `${salesBills.filter((b: any) => (b.patientName || '').trim() === n).length} bills recorded` }));
                              } else if (mergeCategory === "generic") {
                                const gens = Array.from(new Set(items.map((i: any) => (i.generic || i.genericName || '').trim()).filter(Boolean))) as string[];
                                candidates = gens.filter(g => (!q || g.toLowerCase().includes(g)) && g.toLowerCase() !== mergeSourceName.toLowerCase())
                                  .slice(0, 20)
                                  .map(g => ({ id: "", name: g, info: `${items.filter((i: any) => (i.generic || i.genericName || '').trim() === g).length} items` }));
                              } else if (mergeCategory === "doctor") {
                                candidates = (doctors || []).filter((d: any) => (!q || (d.name || '').toLowerCase().includes(q)) && String(d.id) !== mergeSourceId)
                                  .slice(0, 20)
                                  .map((d: any) => ({ id: String(d.id), name: d.name, info: `Speciality: ${d.speciality || 'General'}` }));
                              }

                              if (candidates.length === 0) {
                                return <div style={{ padding: "10px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>No records found</div>;
                              }

                              return candidates.map(c => (
                                <div
                                  key={c.id || c.name}
                                  onClick={() => {
                                    setMergeTargetId(c.id);
                                    setMergeTargetName(c.name);
                                    setMergeTargetSearch("");
                                  }}
                                  style={{
                                    padding: "8px 12px",
                                    borderBottom: "1px solid #f1f5f9",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#f0fdfa"}
                                  onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
                                >
                                  <strong style={{ color: "#1e293b" }}>{c.name}</strong>
                                  <span style={{ color: "#64748b", fontSize: "11px" }}>{c.info}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CONFIRMATION CHECKBOX */}
                    <div style={{
                      background: "#fffbeb",
                      border: "1px solid #fef3c7",
                      borderRadius: "8px",
                      padding: "12px"
                    }}>
                      <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={mergeConfirmChecked}
                          onChange={e => setMergeConfirmChecked(e.target.checked)}
                          style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#0d9488" }}
                        />
                        <span style={{ fontSize: "12px", color: "#92400e", lineHeight: "1.4" }}>
                          <strong>I confirm this merge operation:</strong> I understand that all batches, bills, and transactions linked to <u>{mergeSourceName || 'Source'}</u> will be permanently transferred to <u>{mergeTargetName || 'Target'}</u>.
                        </span>
                      </label>
                    </div>

                    {/* SUBMIT ACTION BUTTON */}
                    <div>
                      <button
                        onClick={handleExecuteMerge}
                        disabled={mergeLoading || !mergeSourceName || !mergeTargetName || !mergeConfirmChecked}
                        style={{
                          width: "100%",
                          padding: "13px",
                          borderRadius: "8px",
                          border: "none",
                          background: (!mergeSourceName || !mergeTargetName || !mergeConfirmChecked || mergeLoading)
                            ? "#cbd5e1"
                            : "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                          color: "#ffffff",
                          fontWeight: "800",
                          fontSize: "14px",
                          letterSpacing: "0.5px",
                          cursor: (!mergeSourceName || !mergeTargetName || !mergeConfirmChecked || mergeLoading) ? "not-allowed" : "pointer",
                          boxShadow: (!mergeSourceName || !mergeTargetName || !mergeConfirmChecked) ? "none" : "0 4px 12px rgba(13,148,136,0.35)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          transition: "0.15s"
                        }}
                      >
                        {mergeLoading ? (
                          <span>Executing Merge...</span>
                        ) : (
                          <>
                            <Check size={18} /> Confirm & Execute {mergeCategory.toUpperCase()} Merge
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: LIVE IMPACT PREVIEW & COMPARISON */}
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
                    <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                        Merge Impact & Side-by-Side Comparison
                      </h3>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        Detailed preview of records and stock affected by this consolidation
                      </div>
                    </div>

                    {/* Comparison Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      
                      {/* SOURCE CARD */}
                      <div style={{
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                        borderRadius: "10px",
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}>
                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#991b1b", textTransform: "uppercase" }}>
                          Source: Will be {mergeFacilityOpt === "delete" ? "DELETED" : "REASSIGNED"}
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: "800", color: "#7f1d1d" }}>
                          {mergeSourceName || "— Not Selected —"}
                        </div>
                        {mergeCategory === "item" && mergeSourceId && (() => {
                          const item = items.find((i: any) => String(i.id) === String(mergeSourceId));
                          const itemBatches = batches.filter((b: any) => String(b.itemId) === String(mergeSourceId));
                          return (
                            <div style={{ fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "4px" }}>
                              <div>Stock: <strong>{item?.stock || 0} units</strong></div>
                              <div>Batches Linked: <strong>{itemBatches.length} batches</strong></div>
                              <div>Company: <strong>{item?.company || 'N/A'}</strong></div>
                            </div>
                          );
                        })()}
                        {mergeCategory === "company" && mergeSourceName && (() => {
                          const count = items.filter((i: any) => (i.company || '').trim().toLowerCase() === mergeSourceName.toLowerCase()).length;
                          return <div style={{ fontSize: "12px", color: "#334155" }}>Items under this company: <strong>{count}</strong></div>;
                        })()}
                        {mergeCategory === "supplier" && mergeSourceId && (() => {
                          const pCount = purchaseBills.filter((b: any) => String(b.supplierId) === String(mergeSourceId) || (b.partyName || '').toLowerCase() === mergeSourceName.toLowerCase()).length;
                          return <div style={{ fontSize: "12px", color: "#334155" }}>Purchase bills linked: <strong>{pCount}</strong></div>;
                        })()}
                        {mergeCategory === "debtor" && mergeSourceName && (() => {
                          const sCount = salesBills.filter((b: any) => (b.patientName || '').toLowerCase() === mergeSourceName.toLowerCase()).length;
                          return <div style={{ fontSize: "12px", color: "#334155" }}>Sales bills recorded: <strong>{sCount}</strong></div>;
                        })()}
                      </div>

                      {/* TARGET CARD */}
                      <div style={{
                        background: "#f0fdfa",
                        border: "1px solid #99f6e4",
                        borderRadius: "10px",
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}>
                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#0f766e", textTransform: "uppercase" }}>
                          Target: Primary Record to KEEP
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: "800", color: "#115e59" }}>
                          {mergeTargetName || "— Not Selected —"}
                        </div>
                        {mergeCategory === "item" && mergeTargetId && (() => {
                          const item = items.find((i: any) => String(i.id) === String(mergeTargetId));
                          const itemBatches = batches.filter((b: any) => String(b.itemId) === String(mergeTargetId));
                          return (
                            <div style={{ fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "4px" }}>
                              <div>Current Stock: <strong>{item?.stock || 0} units</strong></div>
                              <div>Current Batches: <strong>{itemBatches.length} batches</strong></div>
                              <div>Company: <strong>{item?.company || 'N/A'}</strong></div>
                            </div>
                          );
                        })()}
                        {mergeCategory === "company" && mergeTargetName && (() => {
                          const count = items.filter((i: any) => (i.company || '').trim().toLowerCase() === mergeTargetName.toLowerCase()).length;
                          return <div style={{ fontSize: "12px", color: "#334155" }}>Current items: <strong>{count}</strong></div>;
                        })()}
                        {mergeCategory === "supplier" && mergeTargetId && (() => {
                          const pCount = purchaseBills.filter((b: any) => String(b.supplierId) === String(mergeTargetId) || (b.partyName || '').toLowerCase() === mergeTargetName.toLowerCase()).length;
                          return <div style={{ fontSize: "12px", color: "#334155" }}>Purchase bills linked: <strong>{pCount}</strong></div>;
                        })()}
                        {mergeCategory === "debtor" && mergeTargetName && (() => {
                          const sCount = salesBills.filter((b: any) => (b.patientName || '').toLowerCase() === mergeTargetName.toLowerCase()).length;
                          return <div style={{ fontSize: "12px", color: "#334155" }}>Sales bills recorded: <strong>{sCount}</strong></div>;
                        })()}
                      </div>
                    </div>

                    {/* COMBINED RESULT CALCULATOR */}
                    {mergeSourceName && mergeTargetName && (
                      <div style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>
                          📊 Expected Result After Consolidation:
                        </div>
                        {mergeCategory === "item" && (() => {
                          const sItem = items.find((i: any) => String(i.id) === String(mergeSourceId) || i.name === mergeSourceName);
                          const tItem = items.find((i: any) => String(i.id) === String(mergeTargetId) || i.name === mergeTargetName);
                          const sStock = Number(sItem?.stock) || 0;
                          const tStock = Number(tItem?.stock) || 0;
                          const sBatches = batches.filter((b: any) => String(b.itemId) === String(mergeSourceId)).length;
                          const tBatches = batches.filter((b: any) => String(b.itemId) === String(mergeTargetId)).length;

                          return (
                            <div style={{ fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div>• Combined Stock: <strong>{tStock} + {sStock} = {tStock + sStock} units</strong></div>
                              <div>• Total Active Batches: <strong>{tBatches} + {sBatches} = {tBatches + sBatches} batches</strong></div>
                              <div>• Status of duplicate "{mergeSourceName}": <strong>{mergeFacilityOpt === "delete" ? "Permanently Deleted" : "Retained as Archived"}</strong></div>
                            </div>
                          );
                        })()}
                        {mergeCategory !== "item" && (
                          <div style={{ fontSize: "12px", color: "#334155", lineHeight: "1.5" }}>
                            All invoices, bills, payments, and transaction history currently linked to <strong>"{mergeSourceName}"</strong> will be transferred under <strong>"{mergeTargetName}"</strong>.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Informational Guidance */}
                    <div style={{
                      marginTop: "auto",
                      background: "#f1f5f9",
                      borderRadius: "8px",
                      padding: "12px",
                      fontSize: "11px",
                      color: "#475569",
                      lineHeight: "1.4"
                    }}>
                      <strong>💡 Best Practice Tip:</strong> Merge facility is typically used when the same medicine, company, or party has been entered under two different spellings or variants (e.g. "Dolo 650" vs "DOLO 650MG"). Always check item formulation and pack sizes before merging items.
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: MERGE AUDIT HISTORY / LOGS */}
              {mergeActiveTab === "logs" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "20px" }}>
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
                          Data Merge Facility Audit Logs
                        </h3>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Permanent historical trace of all consolidated items, companies, suppliers, and accounts
                        </div>
                      </div>

                      {mergeLogs.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to clear local merge logs?")) {
                              setMergeLogs([]);
                              localStorage.removeItem("store_merge_history");
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
                          Clear Logs
                        </button>
                      )}
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9", color: "#475569", textAlign: "left" }}>
                            <th style={{ padding: "8px 12px", borderRadius: "6px 0 0 6px" }}>Date & Time</th>
                            <th style={{ padding: "8px 12px" }}>Category</th>
                            <th style={{ padding: "8px 12px" }}>Source Record (Merged From)</th>
                            <th style={{ padding: "8px 12px" }}>Target Record (Merged Into)</th>
                            <th style={{ padding: "8px 12px" }}>Source Action</th>
                            <th style={{ padding: "8px 12px", borderRadius: "0 6px 6px 0" }}>User</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mergeLogs.map((log: any) => (
                            <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "10px 12px", color: "#64748b" }}>
                                {new Date(log.date).toLocaleString("en-IN")}
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{
                                  background: "#e0f2fe",
                                  color: "#0369a1",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  fontWeight: "700",
                                  textTransform: "uppercase"
                                }}>
                                  {log.category}
                                </span>
                              </td>
                              <td style={{ padding: "10px 12px", fontWeight: "700", color: "#dc2626" }}>
                                {log.source}
                              </td>
                              <td style={{ padding: "10px 12px", fontWeight: "800", color: "#16a34a" }}>
                                {log.target}
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{
                                  background: log.deleteSource ? "#fee2e2" : "#fef3c7",
                                  color: log.deleteSource ? "#991b1b" : "#92400e",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  fontWeight: "700"
                                }}>
                                  {log.deleteSource ? "DELETED" : "REASSIGNED"}
                                </span>
                              </td>
                              <td style={{ padding: "10px 12px", fontWeight: "700", color: "#0f766e" }}>
                                {log.user}
                              </td>
                            </tr>
                          ))}
                          {mergeLogs.length === 0 && (
                            <tr>
                              <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                                No data merge operations recorded yet.
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
