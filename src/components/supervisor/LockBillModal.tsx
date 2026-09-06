// @ts-nocheck
/* eslint-disable */
import React from 'react';
import { Check, X } from 'lucide-react';
import { useMedicalStore, btn, inp } from '../../MedicalStoreContext';

interface LockBillModalProps {
  onClose: () => void;
}

export default function LockBillModal({ onClose }: LockBillModalProps) {
  const { lockBillData, setLockBillData, saveLockBillData, showToast } = useMedicalStore();

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
            
            {/* ── TOP HEADER (FULLSCREEN) ── */}
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
                  🔒
                </div>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "16px", letterSpacing: "-0.2px" }}>Supervisor — Bill Lock Management</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>Secure & lock sales, purchase, cash, and voucher books between specified date ranges</div>
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

            {/* ── BODY CONTENT (FULLSCREEN SCROLL) ── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
              <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* Information Banner */}
                <div style={{
                  background: "#e0f2fe",
                  border: "1px solid #bae6fd",
                  borderRadius: "10px",
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  color: "#0369a1"
                }}>
                  <span style={{ fontSize: "20px", lineHeight: "1" }}>ℹ️</span>
                  <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
                    <strong>Audit & Compliance Notice:</strong> When a book is locked for a date range, users will be prohibited from adding, modifying, or deleting any voucher records within that period. To allow modifications again, simply uncheck the book and update.
                  </div>
                </div>

                {/* Quick Actions Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: "700", fontSize: "15px", color: "#1e293b" }}>
                    Select Transaction Registers to Lock
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => {
                        const allLocked = (lockBillData || []).map(b => ({ ...b, checked: true }));
                        setLockBillData(allLocked);
                      }}
                      style={{ padding: "6px 12px", background: "#f8fafc", color: "#0f766e", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => {
                        const allUnlocked = (lockBillData || []).map(b => ({ ...b, checked: false }));
                        setLockBillData(allUnlocked);
                      }}
                      style={{ padding: "6px 12px", background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Main Table Card */}
                <div style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}>
                  {/* Table Header */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "2.8fr 1.5fr 1.5fr 1.2fr",
                    gap: "12px",
                    padding: "12px 20px",
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    fontWeight: "700",
                    fontSize: "12px",
                    color: "#475569",
                    letterSpacing: "0.5px"
                  }}>
                    <div>TRANSACTION BOOK NAME</div>
                    <div style={{ textAlign: "center" }}>FROM DATE</div>
                    <div style={{ textAlign: "center" }}>TO DATE</div>
                    <div style={{ textAlign: "center" }}>CURRENT STATUS</div>
                  </div>

                  {/* Book Rows */}
                  <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {(lockBillData || []).map((b, idx) => {
                      const icons = {
                        sales: "🧾",
                        salesReturn: "↩️",
                        purchase: "🛒",
                        purchaseReturn: "📦",
                        cash: "💵",
                        jv: "📑",
                        bank: "🏦"
                      };
                      const icon = icons[b.id] || "📘";
                      const isLocked = !!b.checked;
                      return (
                        <div
                          key={b.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2.8fr 1.5fr 1.5fr 1.2fr",
                            gap: "12px",
                            alignItems: "center",
                            padding: "10px 14px",
                            background: isLocked ? "#fff7ed" : "#ffffff",
                            border: isLocked ? "1px solid #fed7aa" : "1px solid #f1f5f9",
                            borderRadius: "10px",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {/* Book & Checkbox */}
                          <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={isLocked}
                              onChange={e => {
                                const newData = [...lockBillData];
                                newData[idx].checked = e.target.checked;
                                setLockBillData(newData);
                              }}
                              style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#ea580c" }}
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "16px" }}>{icon}</span>
                              <span style={{ fontWeight: "700", fontSize: "13px", color: isLocked ? "#9a3412" : "#1e293b" }}>{b.label}</span>
                            </div>
                          </label>

                          {/* From Date */}
                          <div>
                            <input
                              type="date"
                              value={b.from || ""}
                              onChange={e => {
                                const newData = [...lockBillData];
                                newData[idx].from = e.target.value;
                                setLockBillData(newData);
                              }}
                              style={{
                                ...inp,
                                height: "32px",
                                padding: "4px 10px",
                                fontSize: "12px",
                                background: isLocked ? "#ffffff" : "#f8fafc",
                                border: isLocked ? "1px solid #fdba74" : "1px solid #cbd5e1"
                              }}
                            />
                          </div>

                          {/* To Date */}
                          <div>
                            <input
                              type="date"
                              value={b.to || ""}
                              onChange={e => {
                                const newData = [...lockBillData];
                                newData[idx].to = e.target.value;
                                setLockBillData(newData);
                              }}
                              style={{
                                ...inp,
                                height: "32px",
                                padding: "4px 10px",
                                fontSize: "12px",
                                background: isLocked ? "#ffffff" : "#f8fafc",
                                border: isLocked ? "1px solid #fdba74" : "1px solid #cbd5e1"
                              }}
                            />
                          </div>

                          {/* Status Badge */}
                          <div style={{ textAlign: "center" }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 12px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "700",
                              background: isLocked ? "#fee2e2" : "#f1f5f9",
                              color: isLocked ? "#dc2626" : "#64748b",
                              border: isLocked ? "1px solid #fca5a5" : "1px solid #e2e8f0"
                            }}>
                              {isLocked ? "🔒 LOCKED" : "🔓 ACTIVE / OPEN"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* ── STICKY FOOTER (FULLSCREEN) ── */}
            <div style={{
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              padding: "12px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 -2px 10px rgba(0,0,0,0.03)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b" }}>
                <span>💡</span>
                <span>Select the books you wish to lock, adjust the date range, then click <strong>Update & Enforce Locks</strong>.</span>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    const unlocked = (lockBillData || []).map(b => ({ ...b, checked: false }));
                    setLockBillData(unlocked);
                    saveLockBillData(unlocked);
                    showToast("All book locks have been unlocked!", "success");
                  }}
                  style={{ ...btn("#f3e8ff", "#7e22ce"), border: "1px solid #d8b4fe", padding: "8px 16px", fontWeight: "600" }}
                >
                  🔓 Unlock All Books
                </button>

                <button
                  onClick={() => onClose()}
                  style={{ ...btn("#f1f5f9", "#475569"), border: "1px solid #cbd5e1", padding: "8px 16px" }}
                >
                  ✕ Close
                </button>

                <button
                  onClick={() => {
                    saveLockBillData(lockBillData);
                    showToast("Bill lock rules saved & enforced successfully!", "success");
                    onClose();
                  }}
                  style={{ ...btn("#0f766e", "#ffffff"), padding: "8px 20px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Check size={16} /> Update & Enforce Locks
                </button>
              </div>
            </div>

          </div>

  );
}
