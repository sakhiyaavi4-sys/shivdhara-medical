// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Plus, Edit2, Trash2, ShoppingCart, Eye, EyeOff, X, Check, CheckCircle, 
  AlertCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Phone, Mail, 
  MapPin, Clock, FileText, TrendingUp, Truck, CreditCard, Users, Printer, Barcode,
  RotateCcw, Copy, ExternalLink, HelpCircle
} from "lucide-react";
import { 
  useMedicalStore, DIVISIONS, GST_RATES, fmt, num, int, uid, today, inp, lbl, btn 
} from "../../MedicalStoreContext";
import { matchesDate } from "../../utils/dateUtils";

export default function PurchaseBill({ setScannerTarget, setShowCameraScanner }) {
  const {
    purchaseBills, savePurchaseBills,
    items, batches, suppliers,
    purchaseForm, setPurchaseForm, showPurchaseForm, setShowPurchaseForm,
    purchaseItems, setPurchaseItems,
    purchaseItemSearch, setPurchaseItemSearch,
    purchaseItemDropdown, setPurchaseItemDropdown,
    purchaseItemHighlight, setPurchaseItemHighlight,
    purchaseDropdownPos, setPurchaseDropdownPos,
    purchaseBillSearch, setPurchaseBillSearch,
    openPurchaseForm, updatePurchaseItem, addPurchaseItem, removePurchaseItem,
    handleSavePurchase, handleDeletePurchaseBill,
    calcPurchaseItemAmt, emptyPurchaseItem, emptyPurchaseForm,
    showToast, showConfirm,
    focusNext, calcTotal, isExpired, isExpiringSoon,
    lockBillData, isDateLocked, auditLogs, logUserChange,
    setActiveSection, isOwner, currentUser
  } = useMedicalStore();

  // Local states
  const [purchaseBillSearchDropdown, setPurchaseBillSearchDropdown] = useState(false);
  const [purchaseBillSearchHighlight, setPurchaseBillSearchHighlight] = useState(0);
  const [activePurchaseItemIdx, setActivePurchaseItemIdx] = useState(0);
  const [pendingPurchaseBills, setPendingPurchaseBills] = useState(() => {
    try {
      const saved = localStorage.getItem("store_pending_purchase_bills");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });
  const [showPendingPurchaseModal, setShowPendingPurchaseModal] = useState(false);
  const [showPurchasePreviewModal, setShowPurchasePreviewModal] = useState(false);
  const [purchasePreviewBill, setPurchasePreviewBill] = useState(null);
  const [showDuplicatePurchaseModal, setShowDuplicatePurchaseModal] = useState(false);
  const [purchaseBillListDrawer, setPurchaseBillListDrawer] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("store_pending_purchase_bills", JSON.stringify(pendingPurchaseBills));
    } catch (_) {}
  }, [pendingPurchaseBills]);

  return (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>🛒 Purchase Bills ({purchaseBills.length})</h2>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
                {(() => {
                  const q = (purchaseBillSearch || "").toLowerCase();
                  const filtered = q ? purchaseBills.filter(b => (String(b.entryNo) || "").toLowerCase().includes(q) || (b.billNo || "").toLowerCase().includes(q) || (b.partyName || "").toLowerCase().includes(q) || matchesDate(b.billDate || b.date, q)).slice(0, 15) : [];
                  return (
                    <>
                      <input
                        placeholder="Search Bill# / Party / Entry / Date... + Enter"
                        value={purchaseBillSearch || ""}
                        onChange={e => {
                          setPurchaseBillSearch(e.target.value);
                          setPurchaseBillSearchDropdown(true);
                          setPurchaseBillSearchHighlight(0);
                        }}
                        onKeyDown={e => {
                          if (e.key === "ArrowDown") { e.preventDefault(); setPurchaseBillSearchHighlight(prev => Math.min(prev + 1, filtered.length - 1)); }
                          else if (e.key === "ArrowUp") { e.preventDefault(); setPurchaseBillSearchHighlight(prev => Math.max(prev - 1, 0)); }
                          else if (e.key === "Enter") {
                            e.preventDefault();
                            if (filtered.length > 0 && purchaseBillSearchDropdown) {
                              openPurchaseForm(filtered[purchaseBillSearchHighlight]);
                              setPurchaseBillSearchDropdown(false);
                              setPurchaseBillSearch("");
                            } else if (q) {
                              const match = purchaseBills.find(b => (String(b.entryNo) || "").toLowerCase() === q || (b.billNo || "").toLowerCase() === q || (b.partyName || "").toLowerCase() === q || matchesDate(b.billDate || b.date, q));
                              if (match) {
                                openPurchaseForm(match);
                                setPurchaseBillSearchDropdown(false);
                                setPurchaseBillSearch("");
                              } else {
                                showToast("No purchase bill found matching: " + purchaseBillSearch, "error");
                              }
                            }
                          }
                        }}
                        onFocus={() => setPurchaseBillSearchDropdown(true)}
                        onBlur={() => setTimeout(() => setPurchaseBillSearchDropdown(false), 200)}
                        style={{ ...inp, width: "300px", paddingLeft: "30px", borderRadius: "20px", background: "#f8fafc" }}
                      />
                      {purchaseBillSearchDropdown && filtered.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--shadow-lg)", zIndex: 50, marginTop: "4px", overflow: "hidden" }}>
                          {filtered.map((b, idx) => (
                            <div key={b.id} onClick={() => { openPurchaseForm(b); setPurchaseBillSearchDropdown(false); setPurchaseBillSearch(""); }} style={{ padding: "8px 12px", cursor: "pointer", background: idx === purchaseBillSearchHighlight ? "#f1f5f9" : "white", borderBottom: "1px solid #f1f5f9" }} onMouseEnter={() => setPurchaseBillSearchHighlight(idx)}>
                              <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b" }}>Entry #{b.entryNo} — {b.partyName}</div>
                              <div style={{ fontSize: "10px", color: "#64748b" }}>Bill: {b.billNo || "N/A"} | Amt: ₹{fmt(b.total)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* ══════════════════════════════════════════
            OWNER: PURCHASE BILL (ENTRY & AUDIT)
        ══════════════════════════════════════════ */}
        {showPurchaseForm && (
          <div style={{ background: "white", borderRadius: "8px", padding: "10px 14px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", gap: "8px", height: "calc(100vh - 48px)", maxHeight: "calc(100vh - 48px)", overflow: "hidden" }}>
            
            {/* ── TOP HEADER / TOOLBAR ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontWeight: "800", fontSize: "14px", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Truck size={16} /> Purchase Bill Entry
                </span>

                {/* Bill Series & Entry No */}
                <div style={{ display: "flex", alignItems: "center", background: "#f1f5f9", padding: "2px 8px", borderRadius: "6px", border: "1px solid var(--color-border)", gap: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Entry:</span>
                  <input
                    value={purchaseForm.billSeries || "G"}
                    onChange={e => setPurchaseForm({ ...purchaseForm, billSeries: e.target.value.toUpperCase() })}
                    maxLength={3}
                    style={{ width: "24px", textAlign: "center", fontWeight: "800", background: "white", border: "1px solid #cbd5e1", borderRadius: "3px", padding: "1px", fontSize: "11px" }}
                    title="Bill Series (e.g. G, A, R)"
                  />
                  <input
                    value={purchaseForm.entryNo || ""}
                    readOnly
                    style={{ width: "40px", textAlign: "center", fontWeight: "800", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "3px", padding: "1px", fontSize: "11px", color: "#065f46" }}
                    title="Sequential Entry Number"
                  />
                </div>

                {/* Sequential Nav */}
                <div style={{ display: "flex", gap: "2px" }}>
                  <button onClick={handlePrevPurchaseBill} style={{ ...btn("#f1f5f9", "#334155"), padding: "2px 7px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Previous Purchase Bill">◀ Prev</button>
                  <button onClick={handleNextPurchaseBill} style={{ ...btn("#f1f5f9", "#334155"), padding: "2px 7px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Next Purchase Bill">Next ▶</button>
                </div>

                {/* Tax Mode Toggle */}
                <select
                  value={purchaseForm.taxType || "exclusive"}
                  onChange={e => setPurchaseForm({ ...purchaseForm, taxType: e.target.value })}
                  style={{ ...inp, width: "auto", padding: "2px 6px", height: "24px", fontSize: "11px", fontWeight: "700", background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }}
                >
                  <option value="exclusive">TAX (Exclusive)</option>
                  <option value="inclusive">RETAIL (Inclusive)</option>
                </select>

                {/* Tax Zone Badge */}
                <select
                  value={purchaseForm.taxZone || "sgst_ugst"}
                  onChange={e => setPurchaseForm({ ...purchaseForm, taxZone: e.target.value })}
                  style={{ ...inp, width: "auto", padding: "2px 6px", height: "24px", fontSize: "11px", fontWeight: "600" }}
                >
                  <option value="sgst_ugst">RD (Within State - SGST/CGST)</option>
                  <option value="igst">RD (Outside State - IGST)</option>
                  <option value="exempt">Tax Exempt</option>
                </select>

                {/* New MRP Alert Indicator */}
                {(() => {
                  const newMrpCount = purchaseItems.filter((pi: any) => {
                    const found = items.find((i: any) => i.id === pi.itemId || i.name === pi.itemName);
                    return found && num(pi.mrp) > 0 && num(found.mrp || found.price) > 0 && num(pi.mrp) !== num(found.mrp || found.price);
                  }).length;
                  return (
                    <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "12px", background: newMrpCount > 0 ? "#fef3c7" : "#f1f5f9", color: newMrpCount > 0 ? "#b45309" : "#64748b", border: "1px solid " + (newMrpCount > 0 ? "#fde68a" : "#e2e8f0") }}>
                      🏷️ {newMrpCount} New MRP
                    </span>
                  );
                })()}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => setShowCreditNoteModal(true)}
                  style={{ ...btn("#f8fafc", "#475569"), border: "1px solid #cbd5e1", padding: "3px 8px", fontSize: "11px" }}
                  title="Address F4 / Credit Note F5"
                >
                  📑 Address F4 / Cr Note F5
                </button>
                <button onClick={() => setShowPurchaseForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={16} /></button>
              </div>
            </div>

            {/* Lock Status Banner */}
            {(() => {
              const check = isDateLocked("purchase", purchaseForm.billDate || purchaseForm.entryDate || today());
              if (!check.isLocked) return null;
              return (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontSize: "12px", fontWeight: "600" }}>
                  <span>🔒</span>
                  <span>This date ({new Date(purchaseForm.billDate || purchaseForm.entryDate || today()).toLocaleDateString("en-IN")}) is <strong>LOCKED by Supervisor</strong> ({check.label}). Saving and deletion are blocked.</span>
                </div>
              );
            })()}

            {/* ── HEADER FORM FIELDS ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))", gap: "6px", background: "#f8fafc", borderRadius: "6px", padding: "8px 10px", border: "1px solid var(--color-border)" }}>
              {/* Party Name */}
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "700" }}>Party / Supplier Name *</label>
                <input
                  list="supp-list"
                  value={purchaseForm.partyName || ""}
                  onChange={e => {
                    const s = suppliers.find((x: any) => x.name === e.target.value);
                    setPurchaseForm({
                      ...purchaseForm,
                      partyName: e.target.value,
                      supplierId: s?.id || "",
                      addressF4: s?.address || purchaseForm.addressF4 || ""
                    });
                  }}
                  placeholder="Select or type Supplier Name..."
                  style={{ ...inp, fontWeight: "600" }}
                />
                <datalist id="supp-list">
                  {suppliers.map((s: any) => (
                    <option key={s.id} value={s.name}>{s.mobile ? `(${s.mobile})` : ""}</option>
                  ))}
                </datalist>
              </div>

              {/* Bill No */}
              <div>
                <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Party Bill No</label>
                <input
                  value={purchaseForm.billNo || ""}
                  onChange={e => setPurchaseForm({ ...purchaseForm, billNo: e.target.value })}
                  placeholder="Bill / Invoice No"
                  style={{ ...inp, fontWeight: "600" }}
                />
              </div>

              {/* Bill Date */}
              <div>
                <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Bill Date</label>
                <input
                  type="date"
                  value={purchaseForm.billDate || today()}
                  onChange={e => setPurchaseForm({ ...purchaseForm, billDate: e.target.value })}
                  style={inp}
                />
              </div>

              {/* Entry Date */}
              <div>
                <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Entry Date</label>
                <input
                  type="date"
                  value={purchaseForm.entryDate || today()}
                  onChange={e => setPurchaseForm({ ...purchaseForm, entryDate: e.target.value })}
                  style={inp}
                />
              </div>

              {/* Scheme Disc (SCH DISC) */}
              <div>
                <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>SCH DISC %</label>
                <input
                  type="number"
                  value={purchaseForm.schDisc || "0"}
                  onChange={e => setPurchaseForm({ ...purchaseForm, schDisc: e.target.value })}
                  placeholder="Scheme %"
                  style={inp}
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Payment Mode</label>
                <select
                  value={purchaseForm.paymentMode || "cash"}
                  onChange={e => setPurchaseForm({ ...purchaseForm, paymentMode: e.target.value })}
                  style={inp}
                >
                  <option value="cash">Cash</option>
                  <option value="credit">Credit (Udhar)</option>
                  <option value="cheque">Cheque</option>
                  <option value="neft">NEFT / UPI</option>
                </select>
              </div>

              {/* Checkboxes: GST Inclusive, GST on Free, Order */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center", paddingTop: "14px", gridColumn: "span 2" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                  <input
                    type="checkbox"
                    checked={!!purchaseForm.gstInclusive}
                    onChange={e => setPurchaseForm({ ...purchaseForm, gstInclusive: e.target.checked })}
                    style={{ width: "13px", height: "13px" }}
                  />
                  GST Inclusive
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                  <input
                    type="checkbox"
                    checked={!!purchaseForm.gstOnFree}
                    onChange={e => setPurchaseForm({ ...purchaseForm, gstOnFree: e.target.checked })}
                    style={{ width: "13px", height: "13px" }}
                  />
                  GST on Free
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "#1d4ed8", fontWeight: "700" }}>
                  <input
                    type="checkbox"
                    checked={!!purchaseForm.isOrder}
                    onChange={e => setPurchaseForm({ ...purchaseForm, isOrder: e.target.checked })}
                    style={{ width: "13px", height: "13px" }}
                  />
                  Order / Challan
                </label>
              </div>
            </div>

            {/* ── PURCHASE ITEMS GRID (MATCHES LEGACY VISUAL INFOSOFT COLS) ── */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "6px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                  <tr style={{ background: "#f1f5f9" }}>
                    {[
                      { l: "No", w: "32px", a: "center" },
                      { l: "Item Name *", w: "210px", a: "left" },
                      { l: "Unit", w: "55px", a: "center" },
                      { l: "Batch", w: "85px", a: "left" },
                      { l: "Exp Dt", w: "68px", a: "center" },
                      { l: "MRP", w: "68px", a: "right" },
                      { l: "Qty", w: "52px", a: "center" },
                      { l: "Fr", w: "46px", a: "center" },
                      { l: "PTR", w: "68px", a: "right" },
                      { l: "D%", w: "50px", a: "center" },
                      { l: "Disc", w: "65px", a: "right" },
                      { l: "BASE", w: "70px", a: "right" },
                      { l: "Gst%", w: "58px", a: "center" },
                      { l: "Amount", w: "80px", a: "right" },
                      { l: "L.P.", w: "65px", a: "right" },
                      { l: "Locat.", w: "58px", a: "center" },
                      { l: "", w: "30px", a: "center" },
                    ].map(h => (
                      <th
                        key={h.l}
                        style={{
                          width: h.w,
                          minWidth: h.w,
                          padding: "5px 4px",
                          textAlign: h.a as any,
                          fontWeight: "700",
                          color: "var(--color-text-dark)",
                          fontSize: "11px",
                          whiteSpace: "nowrap",
                          borderBottom: "1px solid #cbd5e1",
                          boxSizing: "border-box"
                        }}
                      >
                        {h.l}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchaseItems.map((pi: any, idx: number) => {
                    const isRowActive = activePurchaseItemIdx === idx;
                    return (
                      <tr
                        key={idx}
                        onClick={() => setActivePurchaseItemIdx(idx)}
                        style={{
                          borderBottom: "1px solid #e2e8f0",
                          background: isRowActive ? "#f0fdf4" : idx % 2 === 0 ? "white" : "#fafafa"
                        }}
                      >
                        {/* No */}
                        <td style={{ width: "32px", minWidth: "32px", padding: "3px 4px", textAlign: "center", fontWeight: "600", color: "#64748b", fontSize: "11px", boxSizing: "border-box" }}>
                          {idx + 1}
                        </td>

                        {/* Item Name (Compact 210px width) */}
                        <td style={{ width: "210px", minWidth: "210px", padding: "2px 4px", position: "relative", boxSizing: "border-box" }}>
                          {(() => {
                            const q = (purchaseItemSearch[idx] || "").toLowerCase();
                            const filtered = items.filter((i: any) => !q || (i.name || "").toLowerCase().includes(q) || (i.company || "").toLowerCase().includes(q));
                            const hi = purchaseItemHighlight[idx] || 0;
                            const selectItem = (i: any) => {
                              updatePurchaseItem(idx, "itemId", i.id);
                              setActivePurchaseItemIdx(idx);
                              setPurchaseItemSearch((prev: any) => ({ ...prev, [idx]: undefined }));
                              setPurchaseItemHighlight((prev: any) => ({ ...prev, [idx]: 0 }));
                              setPurchaseItemDropdown(null);
                            };
                            return (
                              <>
                                <input
                                  value={purchaseItemSearch[idx] !== undefined ? purchaseItemSearch[idx] : (pi.itemName || "")}
                                  onChange={e => {
                                    const r = e.target.getBoundingClientRect();
                                    setPurchaseDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 240) });
                                    setPurchaseItemSearch({ ...purchaseItemSearch, [idx]: e.target.value });
                                    setPurchaseItemHighlight({ ...purchaseItemHighlight, [idx]: 0 });
                                    setPurchaseItemDropdown(idx);
                                    setActivePurchaseItemIdx(idx);
                                  }}
                                  onFocus={e => {
                                    const r = e.target.getBoundingClientRect();
                                    setPurchaseDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 240) });
                                    setPurchaseItemSearch((prev: any) => ({ ...prev, [idx]: prev[idx] ?? "" }));
                                    setPurchaseItemHighlight((prev: any) => ({ ...prev, [idx]: 0 }));
                                    setPurchaseItemDropdown(idx);
                                    setActivePurchaseItemIdx(idx);
                                  }}
                                  onBlur={() => setTimeout(() => setPurchaseItemDropdown(null), 200)}
                                  placeholder="Search medicine..."
                                  style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 6px", height: "24px", fontSize: "11px", fontWeight: "600" }}
                                  autoComplete="off"
                                  data-pf={`${idx}-item`}
                                  onKeyDown={e => {
                                    if (purchaseItemDropdown === idx && filtered.length > 0) {
                                      if (e.key === "ArrowDown") { e.preventDefault(); setPurchaseItemHighlight((prev: any) => ({ ...prev, [idx]: Math.min((prev[idx] || 0) + 1, filtered.length - 1) })); return; }
                                      if (e.key === "ArrowUp") { e.preventDefault(); setPurchaseItemHighlight((prev: any) => ({ ...prev, [idx]: Math.max((prev[idx] || 0) - 1, 0) })); return; }
                                      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); const item = filtered[hi]; if (item) { selectItem(item); } return; }
                                    }
                                    if (e.key === "Enter") {
                                      const query = (purchaseItemSearch[idx] !== undefined ? purchaseItemSearch[idx] : (pi.itemName || "")).trim();
                                      if (query && filtered.length === 0) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setStockEntryInitialName(query);
                                        setStockEntryTargetIdx(idx);
                                        setPurchaseItemDropdown(null);
                                        setStockEntryModalOpen(true);
                                        return;
                                      }
                                      if (purchaseItemDropdown !== idx) { focusNext(e, idx, "item"); }
                                    }
                                  }}
                                />
                                {purchaseItemDropdown === idx && (purchaseItemSearch[idx] || "").length >= 0 && (
                                  <div style={{ position: "fixed", top: purchaseDropdownPos.top, left: purchaseDropdownPos.left, zIndex: 9999, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: purchaseDropdownPos.width }}>
                                    {filtered.map((i: any, pos: number) => (
                                      <div
                                        key={i.id}
                                        onMouseDown={() => selectItem(i)}
                                        onMouseEnter={() => setPurchaseItemHighlight((prev: any) => ({ ...prev, [idx]: pos }))}
                                        style={{ padding: "6px 10px", cursor: "pointer", borderBottom: "1px solid #e9ecef", fontSize: "11px", display: "flex", justifyContent: "space-between", alignItems: "center", background: pos === hi ? "#eff6ff" : "white" }}
                                      >
                                        <div>
                                          <strong>{i.name}</strong>
                                          <div style={{ fontSize: "10px", color: "#64748b" }}>{i.company || "Generic"} | Stock: {i.stock || 0}</div>
                                        </div>
                                        <span style={{ color: "#16a34a", fontWeight: "700", fontSize: "11px" }}>₹{i.price || i.mrp}</span>
                                      </div>
                                    ))}
                                    {filtered.length === 0 && (
                                      <div
                                        onMouseDown={() => {
                                          const query = (purchaseItemSearch[idx] !== undefined ? purchaseItemSearch[idx] : (pi.itemName || "")).trim();
                                          setStockEntryInitialName(query);
                                          setStockEntryTargetIdx(idx);
                                          setPurchaseItemDropdown(null);
                                          setStockEntryModalOpen(true);
                                        }}
                                        style={{ padding: "8px 10px", color: "#0284c7", fontSize: "11px", textAlign: "center", cursor: "pointer", background: "#f0f9ff", fontWeight: "700" }}
                                      >
                                        ➕ Item not found. Press Enter to open Stock Entry Itemwise
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </td>

                        {/* Unit */}
                        <td style={{ width: "55px", minWidth: "55px", padding: "2px", boxSizing: "border-box" }}>
                          <input
                            value={pi.unit || ""}
                            onChange={e => updatePurchaseItem(idx, "unit", e.target.value)}
                            onFocus={() => setActivePurchaseItemIdx(idx)}
                            onKeyDown={e => focusNext(e, idx, "unit")}
                            data-pf={`${idx}-unit`}
                            placeholder="Unit"
                            style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                            title="Unit (e.g. 10T, 1B)"
                          />
                        </td>

                        {/* Batch */}
                        <td style={{ width: "85px", minWidth: "85px", padding: "2px", boxSizing: "border-box" }}>
                          <input
                            value={pi.batchNo || ""}
                            onChange={e => updatePurchaseItem(idx, "batchNo", e.target.value)}
                            onFocus={() => setActivePurchaseItemIdx(idx)}
                            onKeyDown={e => focusNext(e, idx, "batchNo")}
                            placeholder="Batch"
                            data-pf={`${idx}-batchNo`}
                            style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 4px", height: "24px", fontSize: "11px" }}
                          />
                        </td>

                        {/* Exp Dt (MM/YY) */}
                        <td style={{ width: "68px", minWidth: "68px", padding: "2px", boxSizing: "border-box" }}>
                          <input
                            value={pi.expiryDate || ""}
                            onChange={e => {
                              let v = e.target.value.replace(/[^0-9/]/g, "");
                              if (v.length === 2 && !v.includes("/") && pi.expiryDate?.length !== 3) v = v + "/";
                              if (v.length > 5) return;
                              updatePurchaseItem(idx, "expiryDate", v);
                            }}
                            onFocus={() => setActivePurchaseItemIdx(idx)}
                            onKeyDown={e => focusNext(e, idx, "expiryDate")}
                            placeholder="MM/YY"
                            data-pf={`${idx}-expiryDate`}
                            style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "11px", textAlign: "center", letterSpacing: "1px" }}
                          />
                        </td>

                        {/* MRP */}
                        <td style={{ width: "68px", minWidth: "68px", padding: "2px", boxSizing: "border-box" }}>
                          <input
                            type="number"
                            value={pi.mrp || ""}
                            onChange={e => updatePurchaseItem(idx, "mrp", e.target.value)}
                            onFocus={() => setActivePurchaseItemIdx(idx)}
                            onKeyDown={e => focusNext(e, idx, "mrp")}
                            placeholder="MRP"
                            data-pf={`${idx}-mrp`}
                            style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 3px", height: "24px", fontSize: "11px", textAlign: "right" }}
                          />
                        </td>

                        {/* Qty */}
                        <td style={{ width: "52px", minWidth: "52px", padding: "2px", boxSizing: "border-box" }}>
                          <input
                            type="number"
                            value={pi.qty || ""}
                            onChange={e => updatePurchaseItem(idx, "qty", e.target.value)}
                            onFocus={() => setActivePurchaseItemIdx(idx)}
                            onKeyDown={e => focusNext(e, idx, "qty")}
                            placeholder="Qty"
                            data-pf={`${idx}-qty`}
                            style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "11px", textAlign: "center", fontWeight: "700" }}
                          />
                        </td>

                        {/* Fr (Free Qty) */}
                        <td style={{ width: "46px", minWidth: "46px", padding: "2px", boxSizing: "border-box" }}>
                          <input
                            type="number"
                            value={pi.freeQty || ""}
                            onChange={e => updatePurchaseItem(idx, "freeQty", e.target.value)}
                            onFocus={() => setActivePurchaseItemIdx(idx)}
                            onKeyDown={e => focusNext(e, idx, "freeQty")}
                            placeholder="Free"
                            data-pf={`${idx}-freeQty`}
                            style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "11px", textAlign: "center" }}
                          />
                        </td>

                        {/* PTR */}
                        <td style={{ width: "68px", minWidth: "68px", padding: "2px", boxSizing: "border-box" }}>
                          <input
                            type="number"
                            value={pi.ptr || ""}
                            onChange={e => updatePurchaseItem(idx, "ptr", e.target.value)}
                            onFocus={() => setActivePurchaseItemIdx(idx)}
                            onKeyDown={e => focusNext(e, idx, "ptr")}
                            placeholder="PTR"
                            data-pf={`${idx}-ptr`}
                            style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 3px", height: "24px", fontSize: "11px", textAlign: "right", fontWeight: "700" }}
                          />
                        </td>

                        {/* D% */}
                        <td style={{ width: "50px", minWidth: "50px", padding: "2px", boxSizing: "border-box" }}>
                          <input
                            type="number"
                            value={pi.disc || "0"}
                            onChange={e => updatePurchaseItem(idx, "disc", e.target.value)}
                            onFocus={() => setActivePurchaseItemIdx(idx)}
                            onKeyDown={e => focusNext(e, idx, "disc")}
                            placeholder="D%"
                            data-pf={`${idx}-disc`}
                            style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "11px", textAlign: "center" }}
                          />
                        </td>

                        {/* Disc Amt */}
                        <td style={{ width: "65px", minWidth: "65px", padding: "3px 4px", fontWeight: "700", color: "#ef4444", textAlign: "right", fontSize: "11px", whiteSpace: "nowrap", boxSizing: "border-box" }}>
                          ₹{fmt(num(pi.ptr) * int(pi.qty) * num(pi.disc) / 100)}
                        </td>

                        {/* BASE (Taxable) */}
                        <td style={{ width: "70px", minWidth: "70px", padding: "3px 4px", fontWeight: "700", color: "var(--color-primary)", textAlign: "right", fontSize: "11px", whiteSpace: "nowrap", boxSizing: "border-box" }}>
                          ₹{fmt(num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100))}
                        </td>

                        {/* GST% */}
                        <td style={{ width: "58px", minWidth: "58px", padding: "2px", boxSizing: "border-box" }}>
                          <select
                            value={pi.gst || "5"}
                            onChange={e => updatePurchaseItem(idx, "gst", e.target.value)}
                            onFocus={() => setActivePurchaseItemIdx(idx)}
                            onKeyDown={e => focusNext(e, idx, "gst")}
                            data-pf={`${idx}-gst`}
                            style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "1px 1px", height: "24px", fontSize: "10px", textAlign: "center" }}
                          >
                            {GST_RATES.map((r: any) => <option key={r} value={r}>{r}%</option>)}
                          </select>
                        </td>

                        {/* Amount */}
                        <td style={{ width: "80px", minWidth: "80px", padding: "3px 4px", fontWeight: "800", color: "#2563eb", textAlign: "right", fontSize: "11px", whiteSpace: "nowrap", boxSizing: "border-box" }}>
                          ₹{fmt(pi.amount || 0)}
                        </td>

                        {/* L.P. (Last Purchase Rate) */}
                        <td style={{ width: "65px", minWidth: "65px", padding: "3px 4px", color: "#475569", textAlign: "right", fontSize: "10px", whiteSpace: "nowrap", boxSizing: "border-box" }}>
                          {pi.lastPurchaseRate ? `₹${fmt(pi.lastPurchaseRate)}` : "—"}
                        </td>

                        {/* Locat. (Rack / Location) */}
                        <td style={{ width: "58px", minWidth: "58px", padding: "2px", boxSizing: "border-box" }}>
                          <input
                            value={pi.location || ""}
                            onChange={e => updatePurchaseItem(idx, "location", e.target.value)}
                            onFocus={() => setActivePurchaseItemIdx(idx)}
                            onKeyDown={e => focusNext(e, idx, "location")}
                            data-pf={`${idx}-location`}
                            placeholder="Loc"
                            style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                            title="Rack / Shelf Location"
                          />
                        </td>

                        {/* Delete Row */}
                        <td style={{ width: "30px", minWidth: "30px", padding: "2px", textAlign: "center", boxSizing: "border-box" }}>
                          <button
                            onClick={() => removePurchaseItem(idx)}
                            style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "4px", padding: "2px 4px", cursor: "pointer" }}
                            title="Remove row"
                          >
                            <X size={11} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid var(--color-border)", background: "#f8fafc" }}>
                    <td colSpan={10} style={{ padding: "5px 8px", fontWeight: "700", textAlign: "right", fontSize: "11px", color: "#64748b" }}>TOTALS →</td>
                    <td style={{ padding: "5px 4px", fontWeight: "800", textAlign: "right", fontSize: "11px", color: "#ef4444", whiteSpace: "nowrap" }}>
                      ₹{fmt(purchaseItems.reduce((s: any, pi: any) => s + num(pi.ptr) * int(pi.qty) * num(pi.disc) / 100, 0))}
                    </td>
                    <td style={{ padding: "5px 4px", fontWeight: "800", textAlign: "right", fontSize: "11px", color: "var(--color-primary)", whiteSpace: "nowrap" }}>
                      ₹{fmt(purchaseItems.reduce((s: any, pi: any) => s + num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100), 0))}
                    </td>
                    <td></td>
                    <td style={{ padding: "5px 4px", fontWeight: "800", textAlign: "right", fontSize: "12px", color: "#16a34a", whiteSpace: "nowrap" }}>
                      ₹{fmt(purchaseItems.reduce((s: any, pi: any) => s + num(pi.amount || 0), 0))}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                  <tr style={{ background: "#eff6ff", borderTop: "1px solid #bfdbfe" }}>
                    <td colSpan={10} style={{ padding: "4px 8px", fontWeight: "700", textAlign: "right", fontSize: "10px", color: "#1d4ed8" }}>GST BREAKDOWN →</td>
                    <td colSpan={7} style={{ padding: "4px 8px", fontWeight: "700", fontSize: "10px", color: "#1d4ed8", textAlign: "right" }}>
                      {(() => {
                        const gT = purchaseItems.reduce((s: any, pi: any) => s + num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100) * num(pi.gst) / 100, 0);
                        return `SGST: ₹${fmt(gT / 2)} | CGST: ₹${fmt(gT / 2)} | IGST: ₹${fmt(gT)}`;
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ── ACTIVE ITEM DETAILS CARD & SUMMARY BOX (MATCHES TRANSECTION.PDF PAGE 3) ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "10px", alignItems: "start" }}>
              
              {/* Left: Active Item Details Box */}
              {(() => {
                const cur = purchaseItems[activePurchaseItemIdx] || purchaseItems[0] || {};
                const itemMaster = items.find((i: any) => i.id === cur.itemId || i.name === cur.itemName);
                return (
                  <div style={{ background: "#f8fafc", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "8px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a" }}>
                        💊 {cur.itemName || "Select an item to view live master details"}
                      </span>
                      {cur.batchNo && (
                        <span style={{ fontSize: "10px", background: "#ecfdf5", color: "#065f46", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                          Batch: {cur.batchNo} ({cur.expiryDate || "No Exp"})
                        </span>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", fontSize: "11px" }}>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Company:</span>
                        <strong style={{ color: "#334155" }}>{cur.company || itemMaster?.company || "—"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Packing:</span>
                        <strong style={{ color: "#334155" }}>{cur.packing || cur.unit || itemMaster?.packing || itemMaster?.unit || "—"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Location:</span>
                        <strong style={{ color: "#1d4ed8" }}>📍 {cur.location || itemMaster?.location || itemMaster?.rack || "—"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Current Stock:</span>
                        <strong style={{ color: (itemMaster?.stock || 0) > 0 ? "#16a34a" : "#dc2626" }}>{itemMaster?.stock || cur.stock || 0} Units</strong>
                      </div>
                    </div>
                    {/* Bill Remark / Message Input */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569", whiteSpace: "nowrap" }}>Msg:</span>
                      <input
                        value={purchaseForm.billMsg || ""}
                        onChange={e => setPurchaseForm({ ...purchaseForm, billMsg: e.target.value })}
                        placeholder="Distributor / Purchase remark or note (e.g. Delivery memo, Transport ref)..."
                        style={{ ...inp, height: "24px", fontSize: "11px", padding: "2px 6px" }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Right: Summary & Adjustments Box */}
              {(() => {
                const base = purchaseItems.reduce((s: any, pi: any) => s + num(pi.ptr) * int(pi.qty), 0);
                const discAmt = purchaseItems.reduce((s: any, pi: any) => s + num(pi.ptr) * int(pi.qty) * num(pi.disc) / 100, 0);
                const taxable = base - discAmt;
                const gstTotal = purchaseItems.reduce((s: any, pi: any) => { const b = num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100); return s + b * num(pi.gst) / 100; }, 0);
                const total = taxable + gstTotal;
                const netTotal = total - num(purchaseForm.lessDisc) - num(purchaseForm.crNote) + num(purchaseForm.otherAdj) + num(purchaseForm.tcsValue);
                return (
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 10px", fontSize: "11px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 10px" }}>
                      <span>Base Amount:</span><span style={{ textAlign: "right", fontWeight: "600" }}>₹{fmt(base)}</span>
                      <span style={{ color: "#ef4444" }}>Less Disc:</span><span style={{ textAlign: "right", color: "#ef4444" }}>-₹{fmt(discAmt)}</span>
                      <span>Taxable:</span><span style={{ textAlign: "right" }}>₹{fmt(taxable)}</span>
                      <span style={{ color: "#64748b" }}>GST Total:</span><span style={{ textAlign: "right", color: "#1d4ed8", fontWeight: "700" }}>₹{fmt(gstTotal)}</span>
                      <span style={{ color: "#64748b" }}>Half Scheme:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.halfScheme || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, halfScheme: e.target.value })} style={{ ...inp, width: "60px", padding: "1px 3px", fontSize: "10px", height: "18px" }} /></span>
                      <span style={{ color: "#64748b" }}>Oct on Free:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.octOnFree || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, octOnFree: e.target.value })} style={{ ...inp, width: "60px", padding: "1px 3px", fontSize: "10px", height: "18px" }} /></span>
                      <span style={{ color: "#64748b" }}>Other +/-:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.otherAdj || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, otherAdj: e.target.value })} style={{ ...inp, width: "60px", padding: "1px 3px", fontSize: "10px", height: "18px" }} /></span>
                      <span style={{ color: "#ef4444" }}>Less Disc:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.lessDisc || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, lessDisc: e.target.value })} style={{ ...inp, width: "60px", padding: "1px 3px", fontSize: "10px", height: "18px" }} /></span>
                      <span style={{ color: "#64748b" }}>Cr Note:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.crNote || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, crNote: e.target.value })} style={{ ...inp, width: "60px", padding: "1px 3px", fontSize: "10px", height: "18px" }} /></span>
                      <span style={{ color: "#64748b" }}>TCS Value:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.tcsValue || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, tcsValue: e.target.value })} style={{ ...inp, width: "60px", padding: "1px 3px", fontSize: "10px", height: "18px" }} /></span>
                      <span style={{ fontWeight: "800", borderTop: "1px solid #cbd5e1", paddingTop: "4px" }}>NET PAYABLE:</span>
                      <span style={{ textAlign: "right", fontWeight: "900", color: "#16a34a", fontSize: "14px", borderTop: "1px solid #cbd5e1", paddingTop: "4px" }}>₹{fmt(netTotal)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ── BOTTOM ACTION TOOLBAR (ZERO SCROLL COMPLIANT) ── */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
              <button
                onClick={handleSavePurchase}
                style={{ ...btn("#16a34a"), fontSize: "12px", padding: "5px 12px", fontWeight: "700" }}
              >
                <CheckCircle size={14} /> Save & Update Stock
              </button>
              <button
                onClick={() => printPurchaseVoucher({ ...purchaseForm, items: purchaseItems })}
                style={{ ...btn("#0284c7"), fontSize: "12px", padding: "5px 10px" }}
              >
                <Printer size={13} /> Print Voucher
              </button>
              <button
                onClick={holdCurrentPurchaseBill}
                style={{ ...btn("#eab308", "#713f12"), fontSize: "12px", padding: "5px 10px" }}
                title="Hold draft purchase bill"
              >
                ⏸️ Hold ({pendingPurchaseBills.length})
              </button>
              <button
                onClick={() => setShowDuplicatePurchaseModal(true)}
                style={{ ...btn("#6366f1"), fontSize: "12px", padding: "5px 10px" }}
                title="Duplicate from existing purchase bill"
              >
                📋 Duplicate
              </button>
              <button
                onClick={() => { setScannerTarget("purchase"); setShowCameraScanner(true); }}
                style={{ ...btn("#0f766e"), fontSize: "12px", padding: "5px 10px" }}
              >
                📷 Scan
              </button>
              {purchaseForm.id && (
                <button
                  onClick={() => handleDeletePurchaseBill(purchaseForm)}
                  style={{ ...btn("#ef4444"), fontSize: "12px", padding: "5px 10px" }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
              <button
                onClick={() => openPurchaseForm()}
                style={{ ...btn("#2563eb", "white"), fontSize: "12px", padding: "5px 14px", fontWeight: "700" }}
                title="New Purchase Bill (Alt+N)"
              >
                ➕ New (Alt+N)
              </button>
            </div>
          </div>
        )}

        {/* Ensure form is always open */}
        {!showPurchaseForm && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <button onClick={openPurchaseForm} style={{ ...btn("var(--color-primary)"), padding: "8px 16px" }}>➕ Open Purchase Form</button>
          </div>
        )}

        {/* ── MODAL: PENDING PURCHASE BILLS QUEUE ── */}
        {showPendingPurchaseModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "600px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>⏸️ Pending (Held) Purchase Bills ({pendingPurchaseBills.length})</div>
                <button onClick={() => setShowPendingPurchaseModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
              </div>
              <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
                {pendingPurchaseBills.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b", fontSize: "13px" }}>
                    No held purchase bills in the pending queue.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {pendingPurchaseBills.map((pb: any) => (
                      <div key={pb.id} style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                        <div>
                          <div style={{ fontWeight: "700", fontSize: "13px", color: "#1e293b" }}>{pb.partyName || "Supplier"} {pb.purchaseForm?.billNo ? `(Bill: ${pb.purchaseForm.billNo})` : ""}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>Held at: {pb.heldAt} | Items: {pb.purchaseItems?.length || 0} | Total: ₹{fmt(pb.totalAmt || 0)}</div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => resumePendingPurchaseBill(pb)} style={{ ...btn("#16a34a"), padding: "4px 10px", fontSize: "12px" }}>▶️ Resume</button>
                          <button onClick={() => discardPendingPurchaseBill(pb.id)} style={{ ...btn("#ef4444"), padding: "4px 10px", fontSize: "12px" }}>🗑️ Discard</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", textAlign: "right", background: "#f8fafc" }}>
                <button onClick={() => setShowPendingPurchaseModal(false)} style={{ ...btn("#64748b"), padding: "6px 14px" }}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: PURCHASE BILL LIST DRAWER ── */}
        {purchaseBillListDrawer && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "800px", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>📋 Purchase Bills Directory ({purchaseBills.length})</div>
                <button onClick={() => setPurchaseBillListDrawer(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
              </div>
              <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
                {purchaseBills.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b", fontSize: "13px" }}>
                    No purchase bills recorded yet.
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>Entry#</th>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>Bill No</th>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>Date</th>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>Party Name</th>
                        <th style={{ padding: "6px 8px", textAlign: "center" }}>Items</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>Total</th>
                        <th style={{ padding: "6px 8px", textAlign: "center" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseBills.map((b: any) => (
                        <tr key={b.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "6px 8px", fontWeight: "700", color: "#0284c7" }}>{b.entryNo || b.id}</td>
                          <td style={{ padding: "6px 8px", fontWeight: "600" }}>{b.billNo || "—"}</td>
                          <td style={{ padding: "6px 8px", color: "#64748b" }}>{new Date(b.billDate || b.date).toLocaleDateString("en-IN")}</td>
                          <td style={{ padding: "6px 8px", fontWeight: "600" }}>{b.partyName || "Supplier"}</td>
                          <td style={{ padding: "6px 8px", textAlign: "center" }}>{b.items?.length || 0}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "800", color: "#16a34a" }}>₹{fmt(b.total || 0)}</td>
                          <td style={{ padding: "6px 8px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                              <button
                                onClick={() => { openPurchaseForm(b); setPurchaseBillListDrawer(false); }}
                                style={{ ...btn("#0284c7"), padding: "3px 8px", fontSize: "11px" }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => printPurchaseVoucher(b)}
                                style={{ ...btn("#475569"), padding: "3px 8px", fontSize: "11px" }}
                              >
                                Voucher
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", textAlign: "right", background: "#f8fafc" }}>
                <button onClick={() => setPurchaseBillListDrawer(false)} style={{ ...btn("#64748b"), padding: "6px 14px" }}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: PREVIEW PURCHASE VOUCHER ── */}
        {showPurchasePreviewModal && purchasePreviewBill && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "680px", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>👁️ Purchase Voucher - Bill #{purchasePreviewBill.billNo || purchasePreviewBill.entryNo}</div>
                <button onClick={() => setShowPurchasePreviewModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
              </div>
              <div style={{ padding: "16px", overflowY: "auto", flex: 1, fontFamily: "monospace", fontSize: "12px" }}>
                <div style={{ textAlign: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "8px", marginBottom: "8px" }}>
                  <div style={{ fontWeight: "800", fontSize: "15px" }}>{(currentUser?.pharmacyName || "SHIV DHARA MEDICAL STORE").toUpperCase()}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>GOODS INWARD / PURCHASE VOUCHER</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "11px", marginBottom: "8px" }}>
                  <div><strong>Party:</strong> {purchasePreviewBill.partyName || "Supplier"}</div>
                  <div style={{ textAlign: "right" }}><strong>Entry No:</strong> {purchasePreviewBill.billSeries || "G"}-{purchasePreviewBill.entryNo}</div>
                  <div><strong>Bill No:</strong> {purchasePreviewBill.billNo || "—"}</div>
                  <div style={{ textAlign: "right" }}><strong>Date:</strong> {new Date(purchasePreviewBill.billDate || purchasePreviewBill.entryDate || today()).toLocaleDateString("en-IN")}</div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "10px" }}>
                  <thead>
                    <tr style={{ borderTop: "1px solid #cbd5e1", borderBottom: "1px solid #cbd5e1", background: "#f8fafc" }}>
                      <th style={{ textAlign: "left", padding: "4px" }}>Item</th>
                      <th style={{ textAlign: "center", padding: "4px" }}>Unit</th>
                      <th style={{ textAlign: "left", padding: "4px" }}>Batch</th>
                      <th style={{ textAlign: "center", padding: "4px" }}>Exp</th>
                      <th style={{ textAlign: "right", padding: "4px" }}>Qty</th>
                      <th style={{ textAlign: "right", padding: "4px" }}>PTR</th>
                      <th style={{ textAlign: "right", padding: "4px" }}>Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(purchasePreviewBill.items || []).map((it: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px dotted #e2e8f0" }}>
                        <td style={{ padding: "4px" }}>{it.itemName || it.name}</td>
                        <td style={{ textAlign: "center", padding: "4px" }}>{it.unit || "—"}</td>
                        <td style={{ padding: "4px" }}>{it.batchNo || "—"}</td>
                        <td style={{ textAlign: "center", padding: "4px" }}>{it.expiryDate || "—"}</td>
                        <td style={{ textAlign: "right", padding: "4px" }}>{it.qty} {it.freeQty > 0 ? `+${it.freeQty}` : ""}</td>
                        <td style={{ textAlign: "right", padding: "4px" }}>₹{fmt(it.ptr || 0)}</td>
                        <td style={{ textAlign: "right", padding: "4px", fontWeight: "700" }}>₹{fmt(it.amount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "6px", display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "13px" }}>
                  <span>NET PAYABLE TOTAL:</span>
                  <span style={{ color: "#16a34a" }}>₹{fmt(purchasePreviewBill.total || 0)}</span>
                </div>
              </div>
              <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", background: "#f8fafc" }}>
                <button
                  onClick={() => {
                    const win = window.open('', '_blank');
                    if (win) {
                      win.document.write(`<html><head><title>Purchase Voucher</title><style>body{font-family:monospace;padding:20px;}</style></head><body>${document.querySelector('[fontFamily="monospace"]')?.outerHTML || ''}</body></html>`);
                      win.document.close();
                      win.print();
                    }
                  }}
                  style={{ ...btn("#0284c7"), padding: "6px 16px" }}
                >
                  <Printer size={14} /> Print
                </button>
                <button onClick={() => setShowPurchasePreviewModal(false)} style={{ ...btn("#64748b"), padding: "6px 14px" }}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: DUPLICATE PURCHASE BILL ── */}
        {showDuplicatePurchaseModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "550px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>📋 Clone / Duplicate Past Purchase Bill</div>
                <button onClick={() => setShowDuplicatePurchaseModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
              </div>
              <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "10px" }}>Select a distributor bill below to copy its item list into a new fresh purchase entry:</p>
                {purchaseBills.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#64748b", fontSize: "12px" }}>No previous bills to clone.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {purchaseBills.slice(0, 20).map((b: any) => (
                      <div
                        key={b.id}
                        onClick={() => duplicatePurchaseBill(b)}
                        style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", transition: "0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                        onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
                      >
                        <div>
                          <strong style={{ fontSize: "12px" }}>{b.partyName || "Supplier"}</strong>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>Bill #{b.billNo || b.entryNo} | Date: {new Date(b.billDate || b.date).toLocaleDateString("en-IN")}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong style={{ color: "#16a34a", fontSize: "12px" }}>₹{fmt(b.total || 0)}</strong>
                          <div style={{ fontSize: "10px", color: "#0284c7" }}>{b.items?.length || 0} Items</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", textAlign: "right", background: "#f8fafc" }}>
                <button onClick={() => setShowDuplicatePurchaseModal(false)} style={{ ...btn("#64748b"), padding: "6px 14px" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: ADDRESS F4 / CREDIT NOTE F5 ── */}
        {showCreditNoteModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "550px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>📑 Address F4 / Credit Note F5 Lookup</div>
                <button onClick={() => setShowCreditNoteModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
              </div>
              <div style={{ padding: "16px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ ...lbl, fontWeight: "700" }}>Supplier Address (F4)</label>
                  <textarea
                    value={purchaseForm.addressF4 || ""}
                    onChange={e => setPurchaseForm({ ...purchaseForm, addressF4: e.target.value })}
                    placeholder="Enter or view supplier registered address / contact..."
                    rows={2}
                    style={{ ...inp, width: "100%", height: "auto" }}
                  />
                </div>
                <div>
                  <label style={{ ...lbl, fontWeight: "700" }}>Credit Note Amount / Ref (F5)</label>
                  <input
                    type="number"
                    value={purchaseForm.crNote || "0"}
                    onChange={e => setPurchaseForm({ ...purchaseForm, crNote: e.target.value })}
                    placeholder="Credit note amount to deduct..."
                    style={{ ...inp, width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ ...lbl, fontWeight: "700" }}>Credit Note Remark / Voucher No</label>
                  <input
                    value={purchaseForm.creditNoteF5 || ""}
                    onChange={e => setPurchaseForm({ ...purchaseForm, creditNoteF5: e.target.value })}
                    placeholder="E.g. CRN-2026-004 Expired returns deduction"
                    style={{ ...inp, width: "100%" }}
                  />
                </div>
              </div>
              <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", textAlign: "right", background: "#f8fafc" }}>
                <button onClick={() => setShowCreditNoteModal(false)} style={{ ...btn("#16a34a"), padding: "6px 14px" }}>Save & Apply</button>
              </div>
            </div>
          </div>
        )}

                  </>
        )}

        {/* ══════════════════════════════════════════
            OWNER: SALES BILL (POS)
        ══════════════════════════════════════════ */}
  );
}
