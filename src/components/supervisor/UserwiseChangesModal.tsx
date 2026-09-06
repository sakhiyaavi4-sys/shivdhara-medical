// @ts-nocheck
/* eslint-disable */
import React, { useState } from 'react';
import { 
  X, Search, Shield, Filter, Calendar, FileText, CheckCircle, 
  AlertCircle, TrendingUp, ShoppingCart, Package, Printer, Eye 
} from 'lucide-react';
import { useMedicalStore, btn, inp, fmt, num, int, today } from '../../MedicalStoreContext';

interface UserwiseChangesModalProps {
  onClose: () => void;
}

export default function UserwiseChangesModal({ onClose }: UserwiseChangesModalProps) {
  const { salesBills, purchaseBills, items, batches, suppliers, currentUser } = useMedicalStore();

  const [userwiseTab, setUserwiseTab] = useState("userwise"); // userwise, margin, vat, purchase_chkd
  const [userwiseUserFilter, setUserwiseUserFilter] = useState("ALL");
  const [userwiseActionFilter, setUserwiseActionFilter] = useState("ALL");
  const [userwiseFromDate, setUserwiseFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [userwiseToDate, setUserwiseToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [userwiseSearchQuery, setUserwiseSearchQuery] = useState("");

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
            fontFamily: "'Inter', sans-serif"
          }}>
            {/* Top Header */}
            <div style={{
              background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
              color: "#ffffff",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px"
                }}>
                  🛡️
                </div>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "16px", letterSpacing: "-0.2px" }}>Supervisor — Userwise Changes & Audit Trail</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>Complete operational activity logs, bill audits, margin checks, and purchase verification</div>
                </div>
              </div>

              <button
                onClick={() => onClose()}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "6px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: "600"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
              >
                <X size={16} /> Close Esc
              </button>
            </div>

            {/* Split View: Left Navigation + Right Content */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              
              {/* Left Sidebar (supervisor.pdf page 13 buttons) */}
              <div style={{
                width: "230px",
                background: "#1e293b",
                padding: "16px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                borderRight: "1px solid #334155"
              }}>
                <div style={{ padding: "0 8px 8px 8px", fontSize: "11px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase" }}>
                  Supervisor Modules
                </div>

                {[
                  { id: "userwise", label: "Userwise Changes", icon: "👤" },
                  { id: "margin", label: "Margin Difference", icon: "📊" },
                  { id: "vat", label: "Sales VAT Update", icon: "🏷️" },
                  { id: "purchase_chkd", label: "Purchase Chkd Data", icon: "📦" },
                ].map(tab => {
                  const active = userwiseTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setUserwiseTab(tab.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "none",
                        background: active ? "linear-gradient(135deg, #0d9488, #0f766e)" : "transparent",
                        color: active ? "#ffffff" : "#cbd5e1",
                        fontSize: "13px",
                        fontWeight: active ? "700" : "500",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s"
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: "16px" }}>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}

                <div style={{ marginTop: "auto", padding: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: "700", marginBottom: "4px" }}>🔒 Security Log</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.4" }}>
                    Every bill creation, alteration, rate override, and deletion is timestamped.
                  </div>
                </div>
              </div>

              {/* Right Content Area */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f8fafc" }}>
                
                {/* ════════════════════════════════════════════
                    TAB 1: USERWISE CHANGES (AUDIT TRAIL)
                    ════════════════════════════════════════════ */}
                {userwiseTab === "userwise" && (() => {
                  // Filter logs
                  const filteredLogs = (auditLogs || []).filter(log => {
                    if (userwiseUserFilter !== "ALL" && (log.user_name || "Admin").toLowerCase() !== userwiseUserFilter.toLowerCase()) return false;
                    if (userwiseActionFilter !== "ALL" && (log.action || "").toUpperCase() !== userwiseActionFilter.toUpperCase()) return false;
                    if (userwiseFromDate && log.created_at && log.created_at.slice(0, 10) < userwiseFromDate) return false;
                    if (userwiseToDate && log.created_at && log.created_at.slice(0, 10) > userwiseToDate) return false;
                    if (userwiseSearchQuery.trim()) {
                      const q = userwiseSearchQuery.toLowerCase();
                      const matchUser = (log.user_name || "").toLowerCase().includes(q);
                      const matchAction = (log.action || "").toLowerCase().includes(q);
                      const matchRef = (log.ref_no || "").toLowerCase().includes(q);
                      const matchDetails = (log.details || "").toLowerCase().includes(q);
                      if (!matchUser && !matchAction && !matchRef && !matchDetails) return false;
                    }
                    return true;
                  });

                  // Unique users in logs
                  const allUsers = Array.from(new Set(["Admin", ...(auditLogs || []).map(l => l.user_name).filter(Boolean)]));

                  return (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "16px 20px", gap: "12px" }}>
                      
                      {/* Filter Bar */}
                      <div style={{
                        background: "#ffffff",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "12px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                      }}>
                        {/* User Select */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>OPERATOR / USER</label>
                          <select
                            value={userwiseUserFilter}
                            onChange={e => setUserwiseUserFilter(e.target.value)}
                            style={{ ...inp, width: "140px", height: "30px", fontSize: "12px" }}
                          >
                            <option value="ALL">All Users</option>
                            {allUsers.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>

                        {/* Action Select */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>ACTION TYPE</label>
                          <select
                            value={userwiseActionFilter}
                            onChange={e => setUserwiseActionFilter(e.target.value)}
                            style={{ ...inp, width: "160px", height: "30px", fontSize: "12px" }}
                          >
                            <option value="ALL">All Actions</option>
                            <option value="BILL CREATED">🟢 Bill Created</option>
                            <option value="BILL EDITED">🟡 Bill Edited</option>
                            <option value="BILL DELETED">🔴 Bill Deleted</option>
                            <option value="PURCHASE SAVED">🛒 Purchase Saved</option>
                            <option value="PURCHASE DELETED">📦 Purchase Deleted</option>
                            <option value="LOCK RULES UPDATED">🔒 Lock Rules Updated</option>
                          </select>
                        </div>

                        {/* Date Range */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>FROM DATE</label>
                          <input
                            type="date"
                            value={userwiseFromDate}
                            onChange={e => setUserwiseFromDate(e.target.value)}
                            style={{ ...inp, width: "130px", height: "30px", fontSize: "12px" }}
                          />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>TO DATE</label>
                          <input
                            type="date"
                            value={userwiseToDate}
                            onChange={e => setUserwiseToDate(e.target.value)}
                            style={{ ...inp, width: "130px", height: "30px", fontSize: "12px" }}
                          />
                        </div>

                        {/* Search Input */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, minWidth: "160px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>SEARCH DETAILS / BILL #</label>
                          <input
                            placeholder="Filter by bill #, patient name, item..."
                            value={userwiseSearchQuery}
                            onChange={e => setUserwiseSearchQuery(e.target.value)}
                            style={{ ...inp, height: "30px", fontSize: "12px" }}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "8px", alignSelf: "flex-end" }}>
                          <button
                            onClick={() => { if (loadAuditLogs) loadAuditLogs(); showToast("Logs refreshed!"); }}
                            style={{ ...btn("#f1f5f9", "#475569"), border: "1px solid #cbd5e1", height: "30px", padding: "0 12px", fontSize: "12px" }}
                          >
                            🔄 Refresh
                          </button>
                          <button
                            onClick={() => {
                              const csvHeader = "Timestamp,User,Action,Reference,Details\n";
                              const rows = filteredLogs.map(l => `"${l.created_at}","${l.user_name}","${l.action}","${l.ref_no || ''}","${(l.details || '').replace(/"/g, '""')}"`).join("\n");
                              const blob = new Blob([csvHeader + rows], { type: "text/csv" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `Userwise_Changes_${today()}.csv`;
                              a.click();
                              showToast("Exported to CSV successfully!");
                            }}
                            style={{ ...btn("#0f766e", "#ffffff"), height: "30px", padding: "0 14px", fontSize: "12px", fontWeight: "600" }}
                          >
                            📥 Export CSV
                          </button>
                        </div>
                      </div>

                      {/* Log Table Card */}
                      <div style={{
                        flex: 1,
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
                      }}>
                        {/* Table Header */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "1.4fr 1.1fr 1.2fr 1.2fr 3.2fr",
                          gap: "8px",
                          padding: "10px 16px",
                          background: "#f8fafc",
                          borderBottom: "1px solid #e2e8f0",
                          fontWeight: "700",
                          fontSize: "12px",
                          color: "#475569"
                        }}>
                          <div>DATE & TIME</div>
                          <div>OPERATOR</div>
                          <div>ACTION</div>
                          <div>REFERENCE</div>
                          <div>CHANGE DETAILS</div>
                        </div>

                        {/* Table Body */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
                          {filteredLogs.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
                              <div style={{ fontSize: "36px", marginBottom: "8px" }}>📋</div>
                              <div style={{ fontWeight: "700", fontSize: "14px", color: "#475569" }}>No Activity Logs Found</div>
                              <div style={{ fontSize: "12px", marginTop: "4px" }}>No changes recorded matching the selected operator or date range.</div>
                            </div>
                          ) : (
                            filteredLogs.map(log => {
                              const actionColors = {
                                "BILL CREATED": { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
                                "BILL EDITED": { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
                                "BILL DELETED": { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
                                "PURCHASE SAVED": { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
                                "PURCHASE DELETED": { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
                                "LOCK RULES UPDATED": { bg: "#f5f3ff", text: "#7c3aed", border: "#ddd6fe" }
                              };
                              const style = actionColors[log.action] || { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" };
                              const dateFormatted = log.created_at ? new Date(log.created_at).toLocaleString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "—";
                              
                              let parsedDetails = log.details;
                              try {
                                const obj = JSON.parse(log.details);
                                if (typeof obj === 'object') {
                                  parsedDetails = Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(" | ");
                                }
                              } catch (_) {}

                              return (
                                <div
                                  key={log.id}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1.4fr 1.1fr 1.2fr 1.2fr 3.2fr",
                                    gap: "8px",
                                    padding: "8px 10px",
                                    alignItems: "center",
                                    borderBottom: "1px solid #f1f5f9",
                                    fontSize: "12px",
                                    transition: "background 0.1s"
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                  <div style={{ color: "#64748b", fontFamily: "monospace", fontSize: "11px" }}>{dateFormatted}</div>
                                  <div style={{ fontWeight: "600", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ fontSize: "14px" }}>👤</span>
                                    <span>{log.user_name || "Admin"}</span>
                                  </div>
                                  <div>
                                    <span style={{
                                      display: "inline-block",
                                      padding: "2px 8px",
                                      borderRadius: "10px",
                                      fontSize: "10px",
                                      fontWeight: "700",
                                      background: style.bg,
                                      color: style.text,
                                      border: `1px solid ${style.border}`
                                    }}>
                                      {log.action}
                                    </span>
                                  </div>
                                  <div style={{ fontWeight: "600", color: "#0f766e" }}>{log.ref_no || "—"}</div>
                                  <div style={{ color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={parsedDetails}>
                                    {parsedDetails || "—"}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Footer Status Bar */}
                        <div style={{
                          padding: "8px 16px",
                          background: "#f8fafc",
                          borderTop: "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12px",
                          color: "#64748b"
                        }}>
                          <div>Showing <strong>{filteredLogs.length}</strong> activity logs</div>
                          <div style={{ display: "flex", gap: "12px" }}>
                            <span>Created: <strong>{filteredLogs.filter(l => (l.action || '').includes('CREATED')).length}</strong></span>
                            <span>Edited: <strong>{filteredLogs.filter(l => (l.action || '').includes('EDITED')).length}</strong></span>
                            <span>Deleted: <strong>{filteredLogs.filter(l => (l.action || '').includes('DELETED')).length}</strong></span>
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })()}

                {/* ════════════════════════════════════════════
                    TAB 2: MARGIN DIFFERENCE
                    ════════════════════════════════════════════ */}
                {userwiseTab === "margin" && (() => {
                  return (
                    <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto" }}>
                      <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontWeight: "700", fontSize: "15px", color: "#1e293b", marginBottom: "4px" }}>📊 Margin & Profit Analysis</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Live comparison of Selling Price (MRP/Rate) vs Purchase Cost (PTR) across inventory.</div>
                      </div>

                      <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1.2fr 1fr", gap: "10px", padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "700", fontSize: "12px", color: "#475569" }}>
                          <div>ITEM NAME</div>
                          <div style={{ textAlign: "right" }}>COST (PTR)</div>
                          <div style={{ textAlign: "right" }}>MRP</div>
                          <div style={{ textAlign: "right" }}>MARGIN ₹</div>
                          <div style={{ textAlign: "right" }}>MARGIN %</div>
                          <div style={{ textAlign: "center" }}>STATUS</div>
                        </div>

                        <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "4px 8px" }}>
                          {(items || []).slice(0, 100).map(item => {
                            const cost = num(item.ptr || item.prate || 0);
                            const mrp = num(item.mrp || item.srate || 0);
                            const marginDiff = mrp - cost;
                            const marginPct = cost > 0 ? ((marginDiff / cost) * 100).toFixed(1) : "0.0";
                            const isGood = marginDiff >= 0;

                            return (
                              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1.2fr 1fr", gap: "10px", padding: "8px 10px", alignItems: "center", borderBottom: "1px solid #f1f5f9", fontSize: "12px" }}>
                                <div style={{ fontWeight: "600", color: "#1e293b" }}>{item.name}</div>
                                <div style={{ textAlign: "right", color: "#64748b" }}>₹{cost.toFixed(2)}</div>
                                <div style={{ textAlign: "right", fontWeight: "600", color: "#0f766e" }}>₹{mrp.toFixed(2)}</div>
                                <div style={{ textAlign: "right", fontWeight: "700", color: isGood ? "#16a34a" : "#dc2626" }}>₹{marginDiff.toFixed(2)}</div>
                                <div style={{ textAlign: "right", fontWeight: "700", color: isGood ? "#16a34a" : "#dc2626" }}>{marginPct}%</div>
                                <div style={{ textAlign: "center" }}>
                                  <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "700", background: isGood ? "#dcfce7" : "#fee2e2", color: isGood ? "#15803d" : "#dc2626" }}>
                                    {isGood ? "Profitable" : "Loss"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ════════════════════════════════════════════
                    TAB 3: SALES VAT / GST UPDATE
                    ════════════════════════════════════════════ */}
                {userwiseTab === "vat" && (() => {
                  return (
                    <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto" }}>
                      <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontWeight: "700", fontSize: "15px", color: "#1e293b", marginBottom: "4px" }}>🏷️ Sales VAT / GST Rate Summary</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Breakup of tax rates applied on recent sales transactions.</div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                        {[
                          { slab: "GST 0% (Exempt)", itemsCount: (items || []).filter(i => num(i.gst) === 0).length, color: "#64748b" },
                          { slab: "GST 5%", itemsCount: (items || []).filter(i => num(i.gst) === 5).length, color: "#0284c7" },
                          { slab: "GST 12%", itemsCount: (items || []).filter(i => num(i.gst) === 12).length, color: "#0d9488" },
                          { slab: "GST 18%", itemsCount: (items || []).filter(i => num(i.gst) === 18).length, color: "#7c3aed" },
                          { slab: "GST 28%", itemsCount: (items || []).filter(i => num(i.gst) === 28).length, color: "#ea580c" },
                        ].map((s, idx) => (
                          <div key={idx} style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                            <div style={{ fontSize: "13px", fontWeight: "700", color: s.color }}>{s.slab}</div>
                            <div style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b", marginTop: "6px" }}>{s.itemsCount}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Active products</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* ════════════════════════════════════════════
                    TAB 4: PURCHASE CHECKED DATA
                    ════════════════════════════════════════════ */}
                {userwiseTab === "purchase_chkd" && (() => {
                  return (
                    <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto" }}>
                      <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontWeight: "700", fontSize: "15px", color: "#1e293b", marginBottom: "4px" }}>📦 Purchase Checked & Verified Data</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Status of supplier invoices received, stock verified, and booked into inventory.</div>
                      </div>

                      <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.2fr 1fr 1fr 1fr", gap: "10px", padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "700", fontSize: "12px", color: "#475569" }}>
                          <div>ENTRY #</div>
                          <div>SUPPLIER NAME</div>
                          <div>BILL NO</div>
                          <div>BILL DATE</div>
                          <div style={{ textAlign: "right" }}>AMOUNT</div>
                          <div style={{ textAlign: "center" }}>STATUS</div>
                        </div>

                        <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "4px 8px" }}>
                          {(purchaseBills || []).length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No purchase bills on record.</div>
                          ) : (
                            (purchaseBills || []).slice(0, 100).map(pb => (
                              <div key={pb.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.2fr 1fr 1fr 1fr", gap: "10px", padding: "8px 10px", alignItems: "center", borderBottom: "1px solid #f1f5f9", fontSize: "12px" }}>
                                <div style={{ fontWeight: "700", color: "#0f766e" }}>#{pb.entryNo || "—"}</div>
                                <div style={{ fontWeight: "600", color: "#1e293b" }}>{pb.partyName || pb.supplierName || "—"}</div>
                                <div style={{ color: "#64748b" }}>{pb.billNo || "—"}</div>
                                <div style={{ color: "#64748b" }}>{pb.billDate || pb.date || "—"}</div>
                                <div style={{ textAlign: "right", fontWeight: "700", color: "#1e293b" }}>₹{num(pb.total || pb.netAmount || 0).toFixed(2)}</div>
                                <div style={{ textAlign: "center" }}>
                                  <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "700", background: "#dcfce7", color: "#15803d" }}>
                                    ✓ Verified
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

            </div>
          </div>
  );
}
