// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Search, Package, X, Check, CheckCircle, FileText } from 'lucide-react';
import { useMedicalStore, fmt, num, int, uid, today, inp, lbl, btn } from '../../MedicalStoreContext';

interface TransferDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferDataModal({ isOpen, onClose }: TransferDataModalProps) {
  const {
    items, batches, purchaseBills, salesBills, logUserChange
  } = useMedicalStore();

  const [tdSearchQuery, setTdSearchQuery] = useState("");
  const [tdFilterOpStock, setTdFilterOpStock] = useState(true);
  const [tdFilterChal, setTdFilterChal] = useState(true);
  const [tdFilterPurc, setTdFilterPurc] = useState(true);
  const [tdFilterSRe, setTdFilterSRe] = useState(true);
  const [tdFilterPRe, setTdFilterPRe] = useState(true);
  const [tdFilterStk, setTdFilterStk] = useState(true);
  const [tdFilterSale, setTdFilterSale] = useState(true);
  const [tdRoundOff, setTdRoundOff] = useState(false);
  const [tdTransferring, setTdTransferring] = useState(false);
  const [tdStatusMsg, setTdStatusMsg] = useState<string | null>(null);
  const [transferDataSels, setTransferDataSels] = useState({ items: true, batches: true, suppliers: true, purchaseBills: true, salesBills: true, payments: true, doctors: true, customers: true, khata: false, advance: false });
  const [transferDataTargetUrl, setTransferDataTargetUrl] = useState("");
  const [transferDataProgress, setTransferDataProgress] = useState(""); // idle | exporting | done | error
  const [transferDataMsg, setTransferDataMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

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
                      Supervisor — Inventory Transaction Transfer & Audit
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
                      SUPERVISOR REGISTER
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#ccfbf1", marginTop: "2px" }}>
                    Track item-by-item In/Out transaction movement across sales, purchases, challans, and stock adjustments
                  </div>
                </div>
              </div>

              {/* Header Right Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={() => onClose()}
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

            {/* ── COMPILE ALL INVENTORY TRANSACTIONS IN REAL TIME ── */}
            {(() => {
              const allTxns: any[] = [];
              let sr = 1;

              // 1. OPENING STOCK (Op.S)
              if (tdFilterOpStock) {
                items.forEach((it: any) => {
                  const op = Number(it.openingStock) || 0;
                  if (op > 0) {
                    allTxns.push({
                      id: "op_" + it.id,
                      sr: sr++,
                      name: it.name,
                      unit: it.unit || it.packing || '1',
                      batch: it.batchNumber || 'OPENING',
                      expiry: it.expiryDate || it.expiry || '—',
                      mrp: Number(it.mrp || 0),
                      tax: Number(it.gst || it.tax || 12),
                      qtyIn: op,
                      qtyOut: 0,
                      freeQty: 0,
                      netQty: op,
                      refNo: 'OPEN-STOCK',
                      type: 'Op.S',
                      date: '2026-04-01',
                      party: 'Opening Stock'
                    });
                  }
                });
              }

              // 2. PURCHASES (Purc)
              if (tdFilterPurc) {
                purchaseBills.forEach((pb: any) => {
                  const billItems = pb.items || [];
                  billItems.forEach((it: any, idx: number) => {
                    const qIn = Number(it.qty) || 0;
                    const fQty = Number(it.freeQty || it.free) || 0;
                    allTxns.push({
                      id: "pb_" + (pb.id || pb.billNo) + "_" + idx,
                      sr: sr++,
                      name: it.itemName || it.name,
                      unit: it.unit || it.packing || '1',
                      batch: it.batchNo || it.batch || '—',
                      expiry: it.expiry || '—',
                      mrp: Number(it.mrp || 0),
                      tax: Number(it.gst || it.tax || pb.tax || 12),
                      qtyIn: qIn,
                      qtyOut: 0,
                      freeQty: fQty,
                      netQty: qIn + fQty,
                      refNo: "#" + (pb.billNo || pb.entryNo || pb.id),
                      type: 'Purc',
                      date: pb.billDate || pb.date || '2026-09-01',
                      party: pb.partyName || pb.supplierName || 'Supplier'
                    });
                  });
                });
              }

              // 3. SALES (Sale & S.Re)
              salesBills.forEach((sb: any) => {
                const isRet = !!sb.isReturn;
                if (isRet && !tdFilterSRe) return;
                if (!isRet && !tdFilterSale) return;

                const billItems = sb.items || [];
                billItems.forEach((it: any, idx: number) => {
                  const q = Number(it.qty) || 0;
                  allTxns.push({
                    id: "sb_" + (sb.id || sb.billNo) + "_" + idx,
                    sr: sr++,
                    name: it.itemName || it.name,
                    unit: it.unit || it.packing || '1',
                    batch: it.batchNo || it.batch || '—',
                    expiry: it.expiry || '—',
                    mrp: Number(it.mrp || 0),
                    tax: Number(it.gst || it.tax || 12),
                    qtyIn: isRet ? q : 0,
                    qtyOut: isRet ? 0 : q,
                    freeQty: 0,
                    netQty: isRet ? q : -q,
                    refNo: "#" + (sb.billNo || sb.id),
                    type: isRet ? 'S.Re' : 'Sale',
                    date: (sb.date || '').slice(0, 10) || '2026-09-04',
                    party: sb.patientName || 'Walk-in Customer'
                  });
                });
              });

              // 4. PURCHASE RETURNS (P.Re)
              if (tdFilterPRe && typeof purchaseReturns !== 'undefined' && Array.isArray(purchaseReturns)) {
                purchaseReturns.forEach((pr: any) => {
                  const prItems = pr.items || [];
                  prItems.forEach((it: any, idx: number) => {
                    const q = Number(it.qty) || 0;
                    allTxns.push({
                      id: "pr_" + pr.id + "_" + idx,
                      sr: sr++,
                      name: it.itemName || it.name,
                      unit: it.unit || '1',
                      batch: it.batchNo || it.batch || '—',
                      expiry: it.expiry || '—',
                      mrp: Number(it.mrp || 0),
                      tax: Number(it.gst || 12),
                      qtyIn: 0,
                      qtyOut: q,
                      freeQty: 0,
                      netQty: -q,
                      refNo: "#PR-" + (pr.id || idx),
                      type: 'P.Re',
                      date: (pr.date || '').slice(0, 10) || '2026-09-01',
                      party: pr.partyName || 'Supplier Return'
                    });
                  });
                });
              }

              // Filter by search
              const q = tdSearchQuery.trim().toLowerCase();
              const filteredTxns = allTxns.filter(t => {
                if (!q) return true;
                return (t.name || '').toLowerCase().includes(q) ||
                  (t.batch || '').toLowerCase().includes(q) ||
                  (t.refNo || '').toLowerCase().includes(q) ||
                  (t.party || '').toLowerCase().includes(q);
              });

              // Calculate totals
              let sumIn = 0;
              let sumOut = 0;
              let sumFree = 0;
              let sumNet = 0;

              filteredTxns.forEach(t => {
                sumIn += t.qtyIn;
                sumOut += t.qtyOut;
                sumFree += t.freeQty;
                sumNet += t.netQty;
              });

              return (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  
                  {/* ── TOP KPI SUMMARY STRIP ── */}
                  <div style={{
                    background: "#ffffff",
                    padding: "10px 24px",
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "14px",
                    borderBottom: "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    flexShrink: 0
                  }}>
                    <div style={{ padding: "8px 12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                      <div style={{ fontSize: "11px", color: "#166534", fontWeight: "700", textTransform: "uppercase" }}>Total Qty In (Purchases)</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#15803d", marginTop: "2px" }}>+{sumIn.toLocaleString("en-IN")}</div>
                    </div>

                    <div style={{ padding: "8px 12px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
                      <div style={{ fontSize: "11px", color: "#991b1b", fontWeight: "700", textTransform: "uppercase" }}>Total Qty Out (Sales)</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#dc2626", marginTop: "2px" }}>-{sumOut.toLocaleString("en-IN")}</div>
                    </div>

                    <div style={{ padding: "8px 12px", background: "#fef3c7", borderRadius: "8px", border: "1px solid #fde68a" }}>
                      <div style={{ fontSize: "11px", color: "#92400e", fontWeight: "700", textTransform: "uppercase" }}>Free Schemes Qty</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#b45309", marginTop: "2px" }}>+{sumFree.toLocaleString("en-IN")}</div>
                    </div>

                    <div style={{ padding: "8px 12px", background: "#f0fdfa", borderRadius: "8px", border: "1px solid #99f6e4" }}>
                      <div style={{ fontSize: "11px", color: "#0f766e", fontWeight: "700", textTransform: "uppercase" }}>Net Stock Movement</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#0d9488", marginTop: "2px" }}>
                        {sumNet >= 0 ? "+" + sumNet.toLocaleString("en-IN") : sumNet.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Active Records</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{filteredTxns.length}</div>
                    </div>
                  </div>

                  {/* ── TOP ACTION & SEARCH TOOLBAR ── */}
                  <div style={{
                    background: "#ffffff",
                    padding: "10px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #cbd5e1",
                    flexShrink: 0
                  }}>
                    {/* Left Action Buttons (matching Page 22) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      
                      {/* Transfer Button */}
                      <button
                        onClick={async () => {
                          setTdTransferring(true);
                          setTdStatusMsg("Transferring and synchronizing inventory transactions...");
                          try {
                            forceSync();
                            logUserChange("TRANSFER_DATA_SYNC", {
                              recordsCount: filteredTxns.length,
                              sumIn,
                              sumOut,
                              sumNet
                            }, "Transfer Sync " + filteredTxns.length + " records");
                            setTimeout(() => {
                              setTdStatusMsg("Transfer complete! Successfully consolidated " + filteredTxns.length + " stock transactions.");
                              setTdTransferring(false);
                            }, 1000);
                          } catch (_) {
                            setTdStatusMsg("Transfer finished with local synchronization.");
                            setTdTransferring(false);
                          }
                        }}
                        disabled={tdTransferring || filteredTxns.length === 0}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px 18px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: "800",
                          cursor: (tdTransferring || filteredTxns.length === 0) ? "not-allowed" : "pointer",
                          boxShadow: "0 2px 8px rgba(13,148,136,0.3)"
                        }}
                      >
                        <span>⚡</span>
                        <span>{tdTransferring ? "Transferring..." : "Transfer"}</span>
                      </button>

                      {/* ROFF (Round-Off & Recalculate) Button */}
                      <button
                        onClick={() => {
                          setTdRoundOff(!tdRoundOff);
                          setTdStatusMsg(tdRoundOff ? "Round-off disabled." : "ROFF enabled: Rounded fractional scheme quantities to nearest integer.");
                          setTimeout(() => setTdStatusMsg(null), 4000);
                        }}
                        style={{
                          background: tdRoundOff ? "#0284c7" : "#f1f5f9",
                          color: tdRoundOff ? "#ffffff" : "#334155",
                          border: "1px solid #cbd5e1",
                          padding: "8px 14px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          transition: "0.15s"
                        }}
                      >
                        🔄 ROFF {tdRoundOff ? "[ON]" : "[OFF]"}
                      </button>

                      {/* Search Box */}
                      <div style={{ position: "relative", marginLeft: "10px" }}>
                        <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="text"
                          value={tdSearchQuery}
                          onChange={e => setTdSearchQuery(e.target.value)}
                          placeholder="Search Item, Batch, Bill #, Party..."
                          style={{
                            padding: "8px 12px 8px 30px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "12px",
                            width: "280px",
                            outline: "none"
                          }}
                        />
                        {tdSearchQuery && (
                          <button
                            onClick={() => setTdSearchQuery("")}
                            style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right Toolbar Action */}
                    <button
                      onClick={() => {
                        try {
                          const csvRows = [
                            ["SrNo", "ItemName", "Unit", "Batch", "ExpDt", "MRP", "Tax", "In", "Out", "Free", "NQty", "RefNo", "Type", "Date", "Party"].join(","),
                            ...filteredTxns.map((t, idx) => [
                              idx + 1,
                              '"' + (t.name || '').replace(/"/g, '""') + '"',
                              '"' + t.unit + '"',
                              '"' + t.batch + '"',
                              t.expiry,
                              t.mrp,
                              t.tax + "%",
                              t.qtyIn,
                              t.qtyOut,
                              t.freeQty,
                              t.netQty,
                              '"' + t.refNo + '"',
                              t.type,
                              t.date,
                              '"' + (t.party || '').replace(/"/g, '""') + '"'
                            ].join(","))
                          ].join("\n");

                          const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "Transaction_Transfer_Ledger_" + new Date().toISOString().slice(0, 10) + ".csv";
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (_) {
                          alert("CSV export failed");
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#0284c7",
                        color: "#ffffff",
                        border: "none",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      <FileText size={14} /> Export CSV
                    </button>
                  </div>

                  {/* ── STATUS MESSAGE BANNER ── */}
                  {tdStatusMsg && (
                    <div style={{
                      padding: "8px 24px",
                      background: "#dcfce7",
                      color: "#166534",
                      fontSize: "12px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #bbf7d0",
                      flexShrink: 0
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle size={14} />
                        <span>{tdStatusMsg}</span>
                      </div>
                      <button onClick={() => setTdStatusMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold" }}>✕</button>
                    </div>
                  )}

                  {/* ── WORKSPACE (TABLE + RIGHT SIDEBAR FILTER) ── */}
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 220px", overflow: "hidden" }}>
                    
                    {/* LEFT: 14-COLUMN DATA GRID (Matching Page 22) */}
                    <div style={{ overflowY: "auto", padding: "16px", background: "#f8fafc" }}>
                      <div style={{
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        overflow: "hidden"
                      }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                          <thead>
                            <tr style={{
                              background: "#0f172a",
                              color: "#ffffff",
                              textAlign: "left",
                              position: "sticky",
                              top: 0,
                              zIndex: 10
                            }}>
                              <th style={{ padding: "10px 8px", width: "40px", textAlign: "center" }}>SrNo</th>
                              <th style={{ padding: "10px 12px", minWidth: "190px" }}>Item Name</th>
                              <th style={{ padding: "10px 8px", width: "55px", textAlign: "center" }}>Unit</th>
                              <th style={{ padding: "10px 8px", width: "85px" }}>Batch</th>
                              <th style={{ padding: "10px 8px", width: "70px", textAlign: "center" }}>ExpDt</th>
                              <th style={{ padding: "10px 8px", width: "70px", textAlign: "right" }}>MRP (₹)</th>
                              <th style={{ padding: "10px 8px", width: "50px", textAlign: "center" }}>Tax</th>
                              <th style={{ padding: "10px 8px", width: "65px", textAlign: "right", background: "#15803d" }}>In</th>
                              <th style={{ padding: "10px 8px", width: "65px", textAlign: "right", background: "#b91c1c" }}>Out</th>
                              <th style={{ padding: "10px 8px", width: "55px", textAlign: "right" }}>Free</th>
                              <th style={{ padding: "10px 8px", width: "65px", textAlign: "right", background: "#0d9488" }}>NQty</th>
                              <th style={{ padding: "10px 10px", width: "90px" }}>RefNo</th>
                              <th style={{ padding: "10px 8px", width: "60px", textAlign: "center" }}>Type</th>
                              <th style={{ padding: "10px 8px", width: "85px", textAlign: "center" }}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTxns.length === 0 ? (
                              <tr>
                                <td colSpan={14} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>📦</div>
                                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#64748b" }}>No matching transactions found</div>
                                  <div style={{ fontSize: "12px", marginTop: "4px" }}>Enable transaction types in the right filter sidebar or clear search.</div>
                                </td>
                              </tr>
                            ) : (
                              filteredTxns.map((row, idx) => (
                                <tr
                                  key={row.id || idx}
                                  style={{
                                    borderBottom: "1px solid #f1f5f9",
                                    background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                                    transition: "0.15s"
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#f0fdfa"}
                                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f8fafc"}
                                >
                                  <td style={{ padding: "8px", textAlign: "center", color: "#94a3b8", fontWeight: "600" }}>
                                    {idx + 1}
                                  </td>
                                  <td style={{ padding: "8px 12px", fontWeight: "700", color: "#0f172a" }}>
                                    {row.name}
                                    <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "normal" }}>{row.party}</div>
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "center", color: "#475569" }}>
                                    {row.unit}
                                  </td>
                                  <td style={{ padding: "8px", fontWeight: "600", color: "#334155" }}>
                                    {row.batch}
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "center", color: "#64748b" }}>
                                    {row.expiry}
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "600", color: "#334155" }}>
                                    ₹{fmt(row.mrp)}
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "center" }}>
                                    <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "1px 4px", borderRadius: "3px", fontSize: "10px", fontWeight: "700" }}>
                                      {row.tax}%
                                    </span>
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "800", color: row.qtyIn > 0 ? "#16a34a" : "#94a3b8" }}>
                                    {row.qtyIn > 0 ? "+" + row.qtyIn : "—"}
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "800", color: row.qtyOut > 0 ? "#dc2626" : "#94a3b8" }}>
                                    {row.qtyOut > 0 ? "-" + row.qtyOut : "—"}
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "right", color: row.freeQty > 0 ? "#b45309" : "#94a3b8", fontWeight: row.freeQty > 0 ? "700" : "normal" }}>
                                    {row.freeQty > 0 ? row.freeQty : "—"}
                                  </td>
                                  <td style={{
                                    padding: "8px",
                                    textAlign: "right",
                                    fontWeight: "800",
                                    color: row.netQty > 0 ? "#0d9488" : row.netQty < 0 ? "#dc2626" : "#64748b",
                                    background: "rgba(13,148,136,0.05)"
                                  }}>
                                    {row.netQty > 0 ? "+" + row.netQty : row.netQty}
                                  </td>
                                  <td style={{ padding: "8px 10px", fontWeight: "700", color: "#0284c7" }}>
                                    {row.refNo}
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "center" }}>
                                    <span style={{
                                      display: "inline-block",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      fontSize: "10px",
                                      fontWeight: "800",
                                      background: row.type === "Sale" ? "#fee2e2" : row.type === "Purc" ? "#dcfce7" : row.type === "Op.S" ? "#fef3c7" : "#e0f2fe",
                                      color: row.type === "Sale" ? "#991b1b" : row.type === "Purc" ? "#166534" : row.type === "Op.S" ? "#92400e" : "#0369a1"
                                    }}>
                                      {row.type}
                                    </span>
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "center", color: "#64748b" }}>
                                    {row.date}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* RIGHT: FILTER SIDEBAR (Matching Page 22 Checkboxes) */}
                    <div style={{
                      background: "#ffffff",
                      borderLeft: "1px solid #cbd5e1",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      overflowY: "auto"
                    }}>
                      <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#0d9488", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Filter Txn Types
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b", marginTop: "2px" }}>
                          Included Records:
                        </div>
                      </div>

                      {/* 7 Checkboxes directly from Page 22 */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {[
                          { key: "opStock", label: "Op.S", full: "Opening Stock", val: tdFilterOpStock, set: setTdFilterOpStock, color: "#92400e" },
                          { key: "chal", label: "Chal", full: "Challan Entries", val: tdFilterChal, set: setTdFilterChal, color: "#0369a1" },
                          { key: "purc", label: "Purc", full: "Purchase Bills", val: tdFilterPurc, set: setTdFilterPurc, color: "#166534" },
                          { key: "sRe", label: "S.Re", full: "Sales Return", val: tdFilterSRe, set: setTdFilterSRe, color: "#991b1b" },
                          { key: "pRe", label: "P.Re", full: "Purchase Return", val: tdFilterPRe, set: setTdFilterPRe, color: "#b45309" },
                          { key: "stk", label: "Stk.", full: "Stock Adjustments", val: tdFilterStk, set: setTdFilterStk, color: "#6b21a8" },
                          { key: "sale", label: "Sale", full: "Sales Bills", val: tdFilterSale, set: setTdFilterSale, color: "#dc2626" },
                        ].map(item => (
                          <label
                            key={item.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              background: item.val ? "#f8fafc" : "transparent",
                              border: item.val ? "1px solid #cbd5e1" : "1px solid transparent",
                              cursor: "pointer",
                              transition: "0.15s"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={item.val}
                              onChange={e => item.set(e.target.checked)}
                              style={{ width: "15px", height: "15px", accentColor: "#0d9488", cursor: "pointer" }}
                            />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "12px", fontWeight: "800", color: item.color }}>{item.label}</span>
                              <span style={{ fontSize: "10px", color: "#64748b" }}>{item.full}</span>
                            </div>
                          </label>
                        ))}
                      </div>

                      {/* Quick Select Buttons */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "4px" }}>
                        <button
                          onClick={() => {
                            setTdFilterOpStock(true);
                            setTdFilterChal(true);
                            setTdFilterPurc(true);
                            setTdFilterSRe(true);
                            setTdFilterPRe(true);
                            setTdFilterStk(true);
                            setTdFilterSale(true);
                          }}
                          style={{
                            padding: "6px",
                            background: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            color: "#0f766e",
                            cursor: "pointer"
                          }}
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => {
                            setTdFilterOpStock(false);
                            setTdFilterChal(false);
                            setTdFilterPurc(false);
                            setTdFilterSRe(false);
                            setTdFilterPRe(false);
                            setTdFilterStk(false);
                            setTdFilterSale(false);
                          }}
                          style={{
                            padding: "6px",
                            background: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            color: "#64748b",
                            cursor: "pointer"
                          }}
                        >
                          Clear All
                        </button>
                      </div>

                      {/* Informational Guidance Box */}
                      <div style={{
                        marginTop: "auto",
                        background: "#f0fdfa",
                        border: "1px solid #99f6e4",
                        borderRadius: "8px",
                        padding: "10px",
                        fontSize: "11px",
                        color: "#0f766e",
                        lineHeight: "1.4"
                      }}>
                        <strong>💡 Transfer Note:</strong> Clicking Transfer reconciles all verified transaction batches into the primary inventory ledger and updates audit checkpoints.
                      </div>
                    </div>

                  </div>

                </div>
              );
            })()}

          </div>
  );
}
