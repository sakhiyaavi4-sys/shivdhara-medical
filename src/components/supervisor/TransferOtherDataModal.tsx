// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useMedicalStore, fmt, num, int, uid, today, inp, lbl, btn } from '../../MedicalStoreContext';

interface TransferOtherDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferOtherDataModal({ isOpen, onClose }: TransferOtherDataModalProps) {
  const {
    saveItems, saveBatches, saveSuppliers, savePurchaseBills, saveSalesBills, savePayments,
    showToast, items, batches, suppliers, purchaseBills, salesBills, payments, customers, doctors, logUserChange
  } = useMedicalStore();

  const [transferOtherFile, setTransferOtherFile] = useState(null);
  const [transferOtherParsed, setTransferOtherParsed] = useState(null);
  const [transferOtherSels, setTransferOtherSels] = useState({ items: true, batches: true, suppliers: true, purchaseBills: true, salesBills: true, payments: true, doctors: true, customers: true, khata: false, advance: false });
  const [transferOtherProgress, setTransferOtherProgress] = useState("");
  const [transferOtherMsg, setTransferOtherMsg] = useState("");
  const [transferOtherMerge, setTransferOtherMerge] = useState("merge"); // 'merge' | 'replace'


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
            {/* Top Bar Header */}
            <div style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#ffffff",
              padding: "14px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #334155",
              boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #0d9488, #0f766e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  boxShadow: "0 2px 8px rgba(13,148,136,0.3)"
                }}>
                  📥
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "17px", fontWeight: "700", letterSpacing: "0.4px" }}>
                      TRANSFER OTHER DATA — IMPORT & SYNCHRONIZATION
                    </span>
                    <span style={{
                      background: "rgba(13,148,136,0.25)",
                      color: "#2dd4bf",
                      border: "1px solid rgba(45,212,191,0.4)",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: "700"
                    }}>
                      SUPERVISOR UTILITY
                    </span>
                    <span style={{
                      background: transferOtherMerge === "merge" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                      color: transferOtherMerge === "merge" ? "#34d399" : "#f87171",
                      border: `1px solid ${transferOtherMerge === "merge" ? "rgba(52,211,153,0.4)" : "rgba(248,113,113,0.4)}"}`,
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: "700"
                    }}>
                      {transferOtherMerge === "merge" ? "🔀 SAFE MERGE MODE" : "⚠️ OVERWRITE MODE"}
                    </span>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>
                    Selectively import and synchronize master catalogs and transaction data from external JSON archive backups
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {transferOtherParsed && (
                  <div style={{
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "1px solid rgba(255,255,255,0.1)"
                  }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                    <span style={{ fontSize: "12px", color: "#e2e8f0", fontWeight: "600" }}>
                      {Object.values(transferOtherSels).filter(Boolean).length} Categories Active
                    </span>
                  </div>
                )}
                <button
                  onClick={() => {
                    onClose();
                    setTransferOtherFile(null);
                    setTransferOtherParsed(null);
                    setTransferOtherMsg("");
                    setTransferOtherProgress("");
                  }}
                  style={{
                    background: "#334155",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "7px 14px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#475569"}
                  onMouseLeave={e => e.currentTarget.style.background = "#334155"}
                >
                  ✕ Close (ESC)
                </button>
              </div>
            </div>

            {/* Main Content Area: Two Column Layout */}
            <div style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "400px 1fr",
              overflow: "hidden"
            }}>
              {/* Left Column: File Control & Import Policies */}
              <div style={{
                background: "#ffffff",
                borderRight: "1px solid #e2e8f0",
                padding: "20px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "18px"
              }}>
                {/* File Upload Box */}
                <div style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  padding: "16px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "16px" }}>📂</span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Archive Source File</span>
                  </div>

                  <input
                    type="file"
                    accept=".json"
                    id="transfer-other-file-input"
                    style={{ display: "none" }}
                    onChange={e => {
                      const f = e.target.files && e.target.files[0];
                      if (!f) return;
                      setTransferOtherFile(f);
                      setTransferOtherParsed(null);
                      setTransferOtherMsg("");
                      setTransferOtherProgress("reading");
                      const reader = new FileReader();
                      reader.onload = ev => {
                        try {
                          const data = JSON.parse(ev.target.result);
                          setTransferOtherParsed(data);
                          const avail = {};
                          ["items", "batches", "suppliers", "purchaseBills", "salesBills", "payments", "doctors", "customers", "khataEntries", "advanceDeposits"].forEach(k => {
                            const sk = k === "khataEntries" ? "khata" : k === "advanceDeposits" ? "advance" : k;
                            avail[sk] = !!(data[k] && Array.isArray(data[k]) && data[k].length > 0);
                          });
                          setTransferOtherSels(avail);
                          setTransferOtherProgress("ready");
                          const meta = data._meta || {};
                          setTransferOtherMsg(`Archive file loaded successfully. Created: ${meta.exportedAt ? new Date(meta.exportedAt).toLocaleString("en-IN") : "Unknown"} | Operator: ${meta.exportedBy || "System"}`);
                        } catch (err) {
                          setTransferOtherProgress("error");
                          setTransferOtherParsed(null);
                          setTransferOtherMsg(`Invalid file format: ${err.message}`);
                        }
                      };
                      reader.readAsText(f);
                      e.target.value = "";
                    }}
                  />

                  {!transferOtherFile ? (
                    <label
                      htmlFor="transfer-other-file-input"
                      style={{
                        border: "2px dashed #cbd5e1",
                        borderRadius: "10px",
                        padding: "24px 16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        cursor: "pointer",
                        background: "#ffffff",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#0d9488"; e.currentTarget.style.background = "#f0fdfa"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#ffffff"; }}
                    >
                      <div style={{ fontSize: "32px", marginBottom: "8px" }}>📤</div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>Click to Browse Transfer File</div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Supports JSON transfer & backup archives (.json)</div>
                      <div style={{ marginTop: "12px", background: "#0d9488", color: "#ffffff", padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>
                        Browse Computer
                      </div>
                    </label>
                  ) : (
                    <div style={{
                      background: "#ffffff",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      padding: "14px"
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <div style={{ fontSize: "24px" }}>📄</div>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", wordBreak: "break-all" }}>
                              {transferOtherFile.name}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                              {(transferOtherFile.size / 1024).toFixed(1)} KB • JSON Format
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setTransferOtherFile(null);
                            setTransferOtherParsed(null);
                            setTransferOtherMsg("");
                            setTransferOtherProgress("");
                          }}
                          title="Remove File"
                          style={{
                            background: "#fee2e2",
                            color: "#ef4444",
                            border: "none",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: "700"
                          }}
                        >
                          Remove
                        </button>
                      </div>

                      {transferOtherParsed && (
                        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px" }}>
                            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Export Date</div>
                            <div style={{ fontSize: "12px", color: "#0f172a", fontWeight: "700", marginTop: "2px" }}>
                              {transferOtherParsed._meta?.exportedAt ? new Date(transferOtherParsed._meta.exportedAt).toLocaleDateString("en-IN") : "Standard"}
                            </div>
                          </div>
                          <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px" }}>
                            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Exported By</div>
                            <div style={{ fontSize: "12px", color: "#0f172a", fontWeight: "700", marginTop: "2px" }}>
                              {transferOtherParsed._meta?.exportedBy || "Supervisor"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Import Mode Policy */}
                <div style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  padding: "16px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "16px" }}>⚙️</span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Conflict Resolution Policy</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: `1.5px solid ${transferOtherMerge === "merge" ? "#0d9488" : "#e2e8f0"}`,
                        background: transferOtherMerge === "merge" ? "#f0fdfa" : "#ffffff",
                        transition: "all 0.15s"
                      }}
                      onClick={() => setTransferOtherMerge("merge")}
                    >
                      <input
                        type="radio"
                        name="transferMerge"
                        value="merge"
                        checked={transferOtherMerge === "merge"}
                        onChange={() => setTransferOtherMerge("merge")}
                        style={{ marginTop: "3px" }}
                      />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>🔀 Merge & Append</span>
                          <span style={{ background: "#d1fae5", color: "#065f46", fontSize: "10px", fontWeight: "700", padding: "1px 6px", borderRadius: "4px" }}>
                            RECOMMENDED
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Preserves all existing store data. Adds new non-duplicate records and prevents collisions.
                        </div>
                      </div>
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: `1.5px solid ${transferOtherMerge === "replace" ? "#ef4444" : "#e2e8f0"}`,
                        background: transferOtherMerge === "replace" ? "#fef2f2" : "#ffffff",
                        transition: "all 0.15s"
                      }}
                      onClick={() => setTransferOtherMerge("replace")}
                    >
                      <input
                        type="radio"
                        name="transferMerge"
                        value="replace"
                        checked={transferOtherMerge === "replace"}
                        onChange={() => setTransferOtherMerge("replace")}
                        style={{ marginTop: "3px" }}
                      />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#b91c1c" }}>⚠️ Overwrite / Replace</span>
                          <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "10px", fontWeight: "700", padding: "1px 6px", borderRadius: "4px" }}>
                            STRICT OVERRIDE
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#7f1d1d", marginTop: "2px" }}>
                          Completely replaces existing records in selected categories with the archive data.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Quick Selection Actions */}
                {transferOtherParsed && (
                  <div style={{
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    padding: "16px"
                  }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "10px" }}>
                      Category Selection Controls
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <button
                        onClick={() => {
                          const allAvail = {};
                          ["items", "batches", "suppliers", "purchaseBills", "salesBills", "payments", "doctors", "customers", "khata", "advance"].forEach(k => {
                            const rawKey = k === "khata" ? "khataEntries" : k === "advance" ? "advanceDeposits" : k;
                            allAvail[k] = !!(transferOtherParsed[rawKey] && transferOtherParsed[rawKey].length > 0);
                          });
                          setTransferOtherSels(allAvail);
                        }}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#334155",
                          cursor: "pointer"
                        }}
                      >
                        Select Available
                      </button>
                      <button
                        onClick={() => {
                          const none = {};
                          ["items", "batches", "suppliers", "purchaseBills", "salesBills", "payments", "doctors", "customers", "khata", "advance"].forEach(k => {
                            none[k] = false;
                          });
                          setTransferOtherSels(none);
                        }}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#334155",
                          cursor: "pointer"
                        }}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Interactive Entity Selection & Live Inspection */}
              <div style={{
                background: "#f8fafc",
                padding: "24px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "20px"
              }}>
                {!transferOtherParsed ? (
                  <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px dashed #cbd5e1",
                    padding: "40px 24px",
                    textAlign: "center"
                  }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#f0fdfa", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", marginBottom: "16px" }}>
                      📥
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                      No Archive Selected
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748b", maxWidth: "440px", marginTop: "6px", lineHeight: "1.5" }}>
                      Please select or upload a valid JSON transfer archive from the left panel to inspect records and select data categories to import.
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "32px", maxWidth: "600px", width: "100%" }}>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", textAlign: "left" }}>
                        <div style={{ fontSize: "20px" }}>📦</div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginTop: "6px" }}>10 Categories</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Items, Batches, Suppliers, Invoices, Khata & more</div>
                      </div>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", textAlign: "left" }}>
                        <div style={{ fontSize: "20px" }}>🛡️</div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginTop: "6px" }}>Safe Merging</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Automatic ID validation prevents duplicate entries</div>
                      </div>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", textAlign: "left" }}>
                        <div style={{ fontSize: "20px" }}>📋</div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginTop: "6px" }}>Audit Trail</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>All imported records are logged in Supervisor Changes</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                          Select Data Categories to Import
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          Check the entities you wish to import from this archive into your current database
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "4px 10px",
                          fontSize: "12px",
                          color: "#334155",
                          fontWeight: "600"
                        }}>
                          {Object.entries(transferOtherSels).filter(([_, v]) => v).length} of 10 Selected
                        </span>
                      </div>
                    </div>

                    {/* Categories Grid */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                      gap: "14px"
                    }}>
                      {[
                        { key: "items", label: "Items & Catalog", icon: "🔬", count: transferOtherParsed.items?.length || 0, current: items?.length || 0, desc: "Product master, GST rates, HSN codes, and packings" },
                        { key: "batches", label: "Batches & Inventory", icon: "📋", count: transferOtherParsed.batches?.length || 0, current: batches?.length || 0, desc: "Batch numbers, expiry dates, MRP, purchase & sale rates" },
                        { key: "suppliers", label: "Suppliers & Vendors", icon: "🚚", count: transferOtherParsed.suppliers?.length || 0, current: suppliers?.length || 0, desc: "Supplier profiles, contact details, GST numbers, credit terms" },
                        { key: "purchaseBills", label: "Purchase Invoices", icon: "📥", count: transferOtherParsed.purchaseBills?.length || 0, current: purchaseBills?.length || 0, desc: "Inward invoices, purchased item lines, taxes, and supplier bills" },
                        { key: "salesBills", label: "Sales Bills & POS", icon: "📤", count: transferOtherParsed.salesBills?.length || 0, current: salesBills?.length || 0, desc: "Customer invoices, POS counters, prescriptions, and payments" },
                        { key: "payments", label: "Payments & Receipts", icon: "💳", count: transferOtherParsed.payments?.length || 0, current: payments?.length || 0, desc: "Cashbook entries, bank settlements, and supplier payments" },
                        { key: "doctors", label: "Doctor Master", icon: "🩺", count: transferOtherParsed.doctors?.length || 0, current: doctors?.length || 0, desc: "Doctor directory, medical council reg nos, hospital clinics" },
                        { key: "customers", label: "Customer Profiles", icon: "👤", count: transferOtherParsed.customers?.length || 0, current: 0, desc: "Patient details, mobile numbers, loyalty balances, and history" },
                        { key: "khata", label: "Khata / Credit Ledger", icon: "📒", count: transferOtherParsed.khataEntries?.length || 0, current: khataEntries?.length || 0, desc: "Pending customer udhar, running credit balances, and settlements" },
                        { key: "advance", label: "Advance Deposits", icon: "💰", count: transferOtherParsed.advanceDeposits?.length || 0, current: advanceDeposits?.length || 0, desc: "Customer advance payments, security deposits, and prepaid balances" },
                      ].map(c => {
                        const available = c.count > 0;
                        const isSelected = !!transferOtherSels[c.key];

                        return (
                          <div
                            key={c.key}
                            onClick={() => {
                              if (!available) return;
                              setTransferOtherSels(prev => ({ ...prev, [c.key]: !prev[c.key] }));
                            }}
                            style={{
                              background: "#ffffff",
                              borderRadius: "10px",
                              border: `1.5px solid ${!available ? "#e2e8f0" : isSelected ? "#0d9488" : "#cbd5e1"}`,
                              boxShadow: isSelected ? "0 4px 12px rgba(13,148,136,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
                              padding: "14px 16px",
                              cursor: available ? "pointer" : "not-allowed",
                              opacity: available ? 1 : 0.45,
                              transition: "all 0.15s",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between"
                            }}
                          >
                            <div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={!available}
                                    onChange={e => {
                                      e.stopPropagation();
                                      setTransferOtherSels(prev => ({ ...prev, [c.key]: e.target.checked }));
                                    }}
                                    style={{
                                      width: "16px",
                                      height: "16px",
                                      accentColor: "#0d9488",
                                      cursor: available ? "pointer" : "default"
                                    }}
                                  />
                                  <span style={{ fontSize: "20px" }}>{c.icon}</span>
                                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                                    {c.label}
                                  </span>
                                </div>
                                <span style={{
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  background: available ? "#dcfce7" : "#f1f5f9",
                                  color: available ? "#15803d" : "#94a3b8"
                                }}>
                                  {available ? `${c.count} in archive` : "0 in file"}
                                </span>
                              </div>

                              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "8px", lineHeight: "1.4" }}>
                                {c.desc}
                              </div>
                            </div>

                            <div style={{
                              marginTop: "12px",
                              paddingTop: "8px",
                              borderTop: "1px solid #f1f5f9",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "11px"
                            }}>
                              <span style={{ color: "#64748b" }}>
                                Store: <strong>{c.current} records</strong>
                              </span>
                              <span style={{
                                fontWeight: "600",
                                color: !available ? "#94a3b8" : isSelected ? (transferOtherMerge === "merge" ? "#059669" : "#dc2626") : "#94a3b8"
                              }}>
                                {!available ? "No Data" : isSelected ? (transferOtherMerge === "merge" ? "+ Merge Unique" : "Replace Existing") : "Excluded"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Footer Action Bar */}
            <div style={{
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", maxWidth: "60%" }}>
                {transferOtherMsg ? (
                  <div style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    background: transferOtherProgress === "done" ? "#dcfce7" : transferOtherProgress === "error" ? "#fee2e2" : "#f0fdfa",
                    color: transferOtherProgress === "done" ? "#15803d" : transferOtherProgress === "error" ? "#b91c1c" : "#0d9488",
                    border: `1px solid ${transferOtherProgress === "done" ? "#bbf7d0" : transferOtherProgress === "error" ? "#fecaca" : "#ccfbf1"}`
                  }}>
                    {transferOtherMsg}
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    ℹ️ <strong>Notice:</strong> In Safe Merge mode, existing transaction IDs and bill numbers are preserved to prevent loss of local records.
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => {
                    onClose();
                    setTransferOtherFile(null);
                    setTransferOtherParsed(null);
                    setTransferOtherMsg("");
                    setTransferOtherProgress("");
                  }}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#334155",
                    borderRadius: "8px",
                    padding: "8px 18px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>

                <button
                  disabled={!transferOtherParsed || transferOtherProgress === "importing" || !Object.values(transferOtherSels).some(Boolean)}
                  onClick={async () => {
                    if (!transferOtherParsed) {
                      showToast("Please select a valid archive file first.", "error");
                      return;
                    }
                    if (!Object.values(transferOtherSels).some(Boolean)) {
                      showToast("Please select at least 1 category to import.", "error");
                      return;
                    }

                    if (transferOtherMerge === "replace") {
                      const confirmReplace = window.confirm(
                        "⚠️ CAUTION: OVERWRITE / REPLACE MODE ACTIVATED\n\n" +
                        "You have chosen to REPLACE existing store records in the selected categories with the archive data.\n\n" +
                        "Are you sure you want to completely overwrite current records?"
                      );
                      if (!confirmReplace) return;
                    }

                    setTransferOtherProgress("importing");
                    setTransferOtherMsg("⏳ Processing data transfer & synchronizing entities...");

                    try {
                      const d = transferOtherParsed;
                      const merge = transferOtherMerge === "merge";

                      const mergeArr = (existing, incoming) => {
                        if (!incoming || !incoming.length) return existing || [];
                        if (!merge) return incoming;
                        const ids = new Set((existing || []).map(e => e.id || e.billNo || e.invoiceNo || e.batchNo || JSON.stringify(e)));
                        return [...(existing || []), ...incoming.filter(i => !ids.has(i.id || i.billNo || i.invoiceNo || i.batchNo || JSON.stringify(i)))];
                      };

                      let imported = [];

                      if (transferOtherSels.items && d.items && d.items.length) {
                        const n = mergeArr(items, d.items);
                        saveItems(n);
                        save("store_items", n);
                        imported.push(`Items (${d.items.length})`);
                      }
                      if (transferOtherSels.batches && d.batches && d.batches.length) {
                        const n = mergeArr(batches, d.batches);
                        saveBatches(n);
                        save("store_batches", n);
                        imported.push(`Batches (${d.batches.length})`);
                      }
                      if (transferOtherSels.suppliers && d.suppliers && d.suppliers.length) {
                        const n = mergeArr(suppliers, d.suppliers);
                        saveSuppliers(n);
                        save("store_suppliers", n);
                        imported.push(`Suppliers (${d.suppliers.length})`);
                      }
                      if (transferOtherSels.purchaseBills && d.purchaseBills && d.purchaseBills.length) {
                        const n = mergeArr(purchaseBills, d.purchaseBills);
                        savePurchaseBills(n);
                        save("store_purchaseBills", n);
                        imported.push(`Purchase Bills (${d.purchaseBills.length})`);
                      }
                      if (transferOtherSels.salesBills && d.salesBills && d.salesBills.length) {
                        const n = mergeArr(salesBills, d.salesBills);
                        saveSalesBills(n);
                        save("store_salesBills", n);
                        imported.push(`Sales Bills (${d.salesBills.length})`);
                      }
                      if (transferOtherSels.payments && d.payments && d.payments.length) {
                        const n = mergeArr(payments, d.payments);
                        savePayments(n);
                        save("store_payments", n);
                        imported.push(`Payments (${d.payments.length})`);
                      }
                      if (transferOtherSels.doctors && d.doctors && d.doctors.length) {
                        const n = mergeArr(doctors, d.doctors);
                        setDoctors(n);
                        save("store_doctors", n);
                        imported.push(`Doctors (${d.doctors.length})`);
                      }
                      if (transferOtherSels.customers && d.customers && d.customers.length) {
                        const n = mergeArr(customers || [], d.customers);
                        save("store_customers", n);
                        imported.push(`Customers (${d.customers.length})`);
                      }
                      if (transferOtherSels.khata && d.khataEntries && d.khataEntries.length) {
                        const n = mergeArr(khataEntries || [], d.khataEntries);
                        save("store_khata_entries", n);
                        imported.push(`Khata (${d.khataEntries.length})`);
                      }
                      if (transferOtherSels.advance && d.advanceDeposits && d.advanceDeposits.length) {
                        const n = mergeArr(advanceDeposits || [], d.advanceDeposits);
                        save("store_advance_deposits", n);
                        imported.push(`Advance (${d.advanceDeposits.length})`);
                      }

                      // Log audit change
                      if (typeof logUserChange === "function") {
                        logUserChange("TRANSFER_OTHER_DATA_IMPORT", "Transfer Other Data", {
                          mode: transferOtherMerge,
                          categories: imported,
                          totalCategories: imported.length,
                          archiveName: transferOtherFile ? transferOtherFile.name : "Transfer Archive"
                        });
                      }

                      setTransferOtherProgress("done");
                      setTransferOtherMsg(`✅ Import completed successfully (${transferOtherMerge.toUpperCase()} mode): ${imported.join(", ")}`);
                      showToast(`✅ Successfully imported ${imported.length} data categories!`, "success");
                    } catch (err) {
                      console.error("Transfer Other Data Error:", err);
                      setTransferOtherProgress("error");
                      setTransferOtherMsg(`❌ Import failed: ${err.message}`);
                      showToast(`Transfer error: ${err.message}`, "error");
                    }
                  }}
                  style={{
                    background: (!transferOtherParsed || transferOtherProgress === "importing" || !Object.values(transferOtherSels).some(Boolean))
                      ? "#94a3b8"
                      : "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 22px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: (!transferOtherParsed || transferOtherProgress === "importing" || !Object.values(transferOtherSels).some(Boolean))
                      ? "not-allowed"
                      : "pointer",
                    boxShadow: (!transferOtherParsed || transferOtherProgress === "importing" || !Object.values(transferOtherSels).some(Boolean))
                      ? "none"
                      : "0 2px 8px rgba(13,148,136,0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  {transferOtherProgress === "importing" ? "⏳ Processing Import..." : "📥 Execute Transfer / Import"}
                </button>
              </div>


            </div>
          </div>
  );
}
