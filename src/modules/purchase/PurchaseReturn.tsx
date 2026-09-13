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

export default function PurchaseReturn({ setScannerTarget, setShowCameraScanner }) {
  const {
    purchaseReturns, showPurchaseReturnForm, setShowPurchaseReturnForm,
    purchaseReturnForm, setPurchaseReturnForm,
    purchaseReturnItems, setPurchaseReturnItems,
    openPurchaseReturnForm, updatePurchaseReturnItem,
    handleSavePurchaseReturn, handleDeletePurchaseReturn,
    emptyPurchaseReturnItem, emptyPurchaseReturnForm,
    suppliers, items, batches,
    showToast, showConfirm,
    focusNext, calcTotal, isExpired, isExpiringSoon,
    lockBillData, isDateLocked, auditLogs, logUserChange,
    setActiveSection, isOwner, currentUser
  } = useMedicalStore();

  // Local states
  const [activePurchaseReturnItemIdx, setActivePurchaseReturnItemIdx] = useState(0);
  const [pendingPurchaseReturns, setPendingPurchaseReturns] = useState(() => {
    try {
      const saved = localStorage.getItem("store_pending_purchase_returns");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });
  const [showPendingPurchaseReturnModal, setShowPendingPurchaseReturnModal] = useState(false);
  const [showPurchaseReturnPreviewModal, setShowPurchaseReturnPreviewModal] = useState(false);
  const [purchaseReturnPreview, setPurchaseReturnPreview] = useState(null);
  const [showDuplicatePurchaseReturnModal, setShowDuplicatePurchaseReturnModal] = useState(false);
  const [purchaseReturnListDrawer, setPurchaseReturnListDrawer] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("store_pending_purchase_returns", JSON.stringify(pendingPurchaseReturns));
    } catch (_) {}
  }, [pendingPurchaseReturns]);

  const [purchaseReturnSearch, setPurchaseReturnSearch] = useState("");
  const [purchaseReturnSearchDropdown, setPurchaseReturnSearchDropdown] = useState(false);
  const [purchaseReturnSearchHighlight, setPurchaseReturnSearchHighlight] = useState(0);

  const [purchaseReturnItemSearch, setPurchaseReturnItemSearch] = useState({});
  const [purchaseReturnItemHighlight, setPurchaseReturnItemHighlight] = useState({});
  const [purchaseReturnItemDropdown, setPurchaseReturnItemDropdown] = useState(null);
  const [purchaseReturnDropdownPos, setPurchaseReturnDropdownPos] = useState({ top: 0, left: 0, width: 240 });

  return (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>↩️ Purchase Return / Debit Note ({purchaseReturns.length})</h2>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
                {(() => {
                  const q = (purchaseReturnSearch || "").toLowerCase();
                  const filtered = q ? purchaseReturns.filter((r: any) => (String(r.entryNo || r.returnNo) || "").toLowerCase().includes(q) || (r.partyName || r.supplierName || "").toLowerCase().includes(q) || (r.refBillNo || "").toLowerCase().includes(q) || matchesDate(r.date || r.entryDate, q)).slice(0, 15) : [];
                  return (
                    <>
                      <input
                        placeholder="Search Return# / Party / Ref Bill / Date... + Enter"
                        value={purchaseReturnSearch || ""}
                        onChange={e => {
                          setPurchaseReturnSearch(e.target.value);
                          setPurchaseReturnSearchDropdown(true);
                          setPurchaseReturnSearchHighlight(0);
                        }}
                        onKeyDown={e => {
                          if (e.key === "ArrowDown") { e.preventDefault(); setPurchaseReturnSearchHighlight(prev => Math.min(prev + 1, filtered.length - 1)); }
                          else if (e.key === "ArrowUp") { e.preventDefault(); setPurchaseReturnSearchHighlight(prev => Math.max(prev - 1, 0)); }
                          else if (e.key === "Enter") {
                            e.preventDefault();
                            if (filtered.length > 0 && purchaseReturnSearchDropdown) {
                              openPurchaseReturnForm(filtered[purchaseReturnSearchHighlight]);
                              setPurchaseReturnSearchDropdown(false);
                              setPurchaseReturnSearch("");
                            } else if (q) {
                              const match = purchaseReturns.find((r: any) => (String(r.entryNo || r.returnNo) || "").toLowerCase() === q || (r.partyName || r.supplierName || "").toLowerCase() === q || (r.refBillNo || "").toLowerCase() === q || matchesDate(r.date || r.entryDate, q));
                              if (match) {
                                openPurchaseReturnForm(match);
                                setPurchaseReturnSearchDropdown(false);
                                setPurchaseReturnSearch("");
                              } else {
                                showToast("No purchase return found matching: " + purchaseReturnSearch, "error");
                              }
                            }
                          }
                        }}
                        onFocus={() => setPurchaseReturnSearchDropdown(true)}
                        onBlur={() => setTimeout(() => setPurchaseReturnSearchDropdown(false), 200)}
                        style={{ ...inp, width: "320px", paddingLeft: "30px", borderRadius: "20px", background: "#f8fafc" }}
                      />
                      {purchaseReturnSearchDropdown && filtered.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--shadow-lg)", zIndex: 50, marginTop: "4px", overflow: "hidden" }}>
                          {filtered.map((r: any, idx: number) => (
                            <div key={r.id} onClick={() => { openPurchaseReturnForm(r); setPurchaseReturnSearchDropdown(false); setPurchaseReturnSearch(""); }} style={{ padding: "8px 12px", cursor: "pointer", background: idx === purchaseReturnSearchHighlight ? "#f1f5f9" : "white", borderBottom: "1px solid #f1f5f9" }} onMouseEnter={() => setPurchaseReturnSearchHighlight(idx)}>
                              <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b" }}>Return #{r.returnNo || r.entryNo} — {r.partyName}</div>
                              <div style={{ fontSize: "10px", color: "#64748b" }}>Ref Bill: {r.refBillNo || "N/A"} | Amt: ₹{fmt(r.total)} | Reason: {r.reason || "Expired"}</div>
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
                OWNER: PURCHASE RETURN / DEBIT NOTE FORM
            ══════════════════════════════════════════ */}
            {showPurchaseReturnForm && (
              <div style={{ background: "white", borderRadius: "8px", padding: "10px 14px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", gap: "8px", height: "calc(100vh - 48px)", maxHeight: "calc(100vh - 48px)", overflow: "hidden" }}>
                
                {/* ── TOP HEADER / TOOLBAR (MATCHES TRANSECTION.PDF PAGE 4) ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "800", fontSize: "14px", color: "#dc2626", display: "flex", alignItems: "center", gap: "6px" }}>
                      ↩️ Purchase Return / Debit Note Entry
                    </span>

                    {/* Bill Series & Entry No */}
                    <div style={{ display: "flex", alignItems: "center", background: "#fef2f2", padding: "2px 8px", borderRadius: "6px", border: "1px solid #fecaca", gap: "4px" }}>
                      <span style={{ fontSize: "11px", color: "#991b1b", fontWeight: "600" }}>Entry:</span>
                      <input
                        value={purchaseReturnForm.billSeries || "G"}
                        onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, billSeries: e.target.value.toUpperCase() })}
                        maxLength={3}
                        style={{ width: "24px", textAlign: "center", fontWeight: "800", background: "white", border: "1px solid #f87171", borderRadius: "3px", padding: "1px", fontSize: "11px", color: "#991b1b" }}
                        title="Bill Series (e.g. G, A, R)"
                      />
                      <input
                        value={purchaseReturnForm.entryNo || ""}
                        readOnly
                        style={{ width: "40px", textAlign: "center", fontWeight: "800", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "3px", padding: "1px", fontSize: "11px", color: "#b91c1c" }}
                        title="Sequential Entry Number"
                      />
                    </div>

                    {/* Sequential Nav */}
                    <div style={{ display: "flex", gap: "2px" }}>
                      <button onClick={handlePrevPurchaseReturn} style={{ ...btn("#f1f5f9", "#334155"), padding: "2px 7px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Previous Purchase Return">◀ Prev</button>
                      <button onClick={handleNextPurchaseReturn} style={{ ...btn("#f1f5f9", "#334155"), padding: "2px 7px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Next Purchase Return">Next ▶</button>
                    </div>

                    {/* Type Selector (TAX / RETAIL) */}
                    <select
                      value={purchaseReturnForm.billType || "TAX"}
                      onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, billType: e.target.value })}
                      style={{ ...inp, width: "auto", padding: "2px 6px", height: "24px", fontSize: "11px", fontWeight: "700", background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }}
                    >
                      <option value="TAX">TAX (Exclusive)</option>
                      <option value="RETAIL">RETAIL (Inclusive)</option>
                    </select>

                    {/* Tax Zone Badge */}
                    <select
                      value={purchaseReturnForm.taxZone || "sgst_ugst"}
                      onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, taxZone: e.target.value })}
                      style={{ ...inp, width: "auto", padding: "2px 6px", height: "24px", fontSize: "11px", fontWeight: "600" }}
                    >
                      <option value="sgst_ugst">RD (Within State - SGST/CGST)</option>
                      <option value="igst">RD (Outside State - IGST)</option>
                      <option value="exempt">Tax Exempt</option>
                    </select>

                    {/* Checkboxes: GST ON FREE, Return MRP, Calculate GST */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                        <input
                          type="checkbox"
                          checked={!!purchaseReturnForm.gstOnFree}
                          onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, gstOnFree: e.target.checked })}
                          style={{ width: "13px", height: "13px" }}
                        />
                        GST ON FREE
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                        <input
                          type="checkbox"
                          checked={purchaseReturnForm.returnMrp !== false}
                          onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, returnMrp: e.target.checked })}
                          style={{ width: "13px", height: "13px" }}
                        />
                        Return MRP
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "#1d4ed8", fontWeight: "700" }}>
                        <input
                          type="checkbox"
                          checked={purchaseReturnForm.calculateGst !== false}
                          onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, calculateGst: e.target.checked })}
                          style={{ width: "13px", height: "13px" }}
                        />
                        Calculate GST
                      </label>
                    </div>
                  </div>

                  <button onClick={() => setShowPurchaseReturnForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={16} /></button>
                </div>

                {/* Lock Status Banner */}
                {(() => {
                  const check = isDateLocked("purchaseReturn", purchaseReturnForm.entryDate || purchaseReturnForm.date || today());
                  if (!check.isLocked) return null;
                  return (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontSize: "12px", fontWeight: "600" }}>
                      <span>🔒</span>
                      <span>This date ({new Date(purchaseReturnForm.entryDate || purchaseReturnForm.date || today()).toLocaleDateString("en-IN")}) is <strong>LOCKED by Supervisor</strong> ({check.label}). Saving and deletion are blocked.</span>
                    </div>
                  );
                })()}

                {/* ── HEADER FORM FIELDS ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "6px", background: "#f8fafc", borderRadius: "6px", padding: "8px 10px", border: "1px solid var(--color-border)" }}>
                  {/* Party Name */}
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "700" }}>Party / Supplier Name *</label>
                    <input
                      list="pr-supp-list"
                      value={purchaseReturnForm.partyName || purchaseReturnForm.supplierName || ""}
                      onChange={e => {
                        const s = suppliers.find((x: any) => x.name === e.target.value);
                        setPurchaseReturnForm({
                          ...purchaseReturnForm,
                          partyName: e.target.value,
                          supplierName: e.target.value,
                          supplierId: s?.id || "",
                          area: s?.address || purchaseReturnForm.area || "",
                          mobile: s?.mobile || purchaseReturnForm.mobile || "",
                          gstin: s?.gstin || purchaseReturnForm.gstin || "",
                          panNo: s?.panNo || purchaseReturnForm.panNo || ""
                        });
                      }}
                      placeholder="Select or type Supplier Name..."
                      style={{ ...inp, fontWeight: "600" }}
                    />
                    <datalist id="pr-supp-list">
                      {suppliers.map((s: any) => (
                        <option key={s.id} value={s.name}>{s.mobile ? `(${s.mobile})` : ""}</option>
                      ))}
                    </datalist>
                  </div>

                  {/* Ref No */}
                  <div>
                    <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Ref No</label>
                    <input
                      value={purchaseReturnForm.refNo || ""}
                      onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, refNo: e.target.value })}
                      placeholder="Ref No"
                      style={{ ...inp, fontWeight: "600" }}
                    />
                  </div>

                  {/* P.Bill No (Original Bill) */}
                  <div>
                    <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>P.Bill No</label>
                    <input
                      value={purchaseReturnForm.refBillNo || ""}
                      onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, refBillNo: e.target.value })}
                      placeholder="Orig. Bill No"
                      style={{ ...inp, fontWeight: "600" }}
                    />
                  </div>

                  {/* Bill Date */}
                  <div>
                    <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Bill Date</label>
                    <input
                      type="date"
                      value={purchaseReturnForm.billDate || today()}
                      onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, billDate: e.target.value })}
                      style={inp}
                    />
                  </div>

                  {/* Entry Date */}
                  <div>
                    <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Entry Date</label>
                    <input
                      type="date"
                      value={purchaseReturnForm.entryDate || purchaseReturnForm.date || today()}
                      onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, entryDate: e.target.value, date: e.target.value })}
                      style={inp}
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Return Reason</label>
                    <select
                      value={purchaseReturnForm.reason || "Expired"}
                      onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, reason: e.target.value })}
                      style={inp}
                    >
                      <option value="Expired">Expired</option>
                      <option value="Damaged">Damaged / Breakage</option>
                      <option value="Near Expiry">Near Expiry</option>
                      <option value="Excess Stock">Excess Stock</option>
                      <option value="Rate Difference">Rate Difference</option>
                      <option value="Return to Vendor">Return to Vendor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Detail */}
                  <div>
                    <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Detail / Note</label>
                    <input
                      value={purchaseReturnForm.detail || ""}
                      onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, detail: e.target.value })}
                      placeholder="Detail note..."
                      style={inp}
                    />
                  </div>
                </div>

                {/* Party Metadata Badge */}
                {(() => {
                  const s = suppliers.find((x: any) => x.id === purchaseReturnForm.supplierId || x.name === purchaseReturnForm.partyName);
                  if (!s && !purchaseReturnForm.partyName) return null;
                  return (
                    <div style={{ display: "flex", gap: "12px", background: "#f1f5f9", padding: "4px 10px", borderRadius: "5px", fontSize: "11px", color: "#475569", flexWrap: "wrap" }}>
                      <span><strong>Area:</strong> {s?.address || purchaseReturnForm.area || "—"}</span>
                      <span><strong>Mobile:</strong> {s?.mobile || purchaseReturnForm.mobile || "—"}</span>
                      <span><strong>GSTIN:</strong> {s?.gstin || purchaseReturnForm.gstin || "—"}</span>
                      <span><strong>Balance:</strong> ₹{fmt(s?.balance || 0)}</span>
                    </div>
                  );
                })()}

                {/* ── RETURN ITEMS GRID (MATCHES TRANSECTION.PDF PAGE 4 COLS) ── */}
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
                          { l: "Mrp", w: "68px", a: "right" },
                          { l: "PRate", w: "68px", a: "right" },
                          { l: "Qty", w: "52px", a: "center" },
                          { l: "Fr", w: "46px", a: "center" },
                          { l: "D%", w: "50px", a: "center" },
                          { l: "Gst%", w: "58px", a: "center" },
                          { l: "Disc", w: "65px", a: "right" },
                          { l: "Amount", w: "80px", a: "right" },
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
                      {purchaseReturnItems.map((pi: any, idx: number) => {
                        const isRowActive = activePurchaseReturnItemIdx === idx;
                        return (
                          <tr
                            key={idx}
                            onClick={() => setActivePurchaseReturnItemIdx(idx)}
                            style={{
                              borderBottom: "1px solid #e2e8f0",
                              background: isRowActive ? "#fef2f2" : idx % 2 === 0 ? "white" : "#fafafa"
                            }}
                          >
                            {/* No */}
                            <td style={{ width: "32px", minWidth: "32px", padding: "3px 4px", textAlign: "center", fontWeight: "600", color: "#64748b", fontSize: "11px", boxSizing: "border-box" }}>
                              {idx + 1}
                            </td>

                            {/* Item Name (Compact 210px width) */}
                            <td style={{ width: "210px", minWidth: "210px", padding: "2px 4px", position: "relative", boxSizing: "border-box" }}>
                              {(() => {
                                const q = (purchaseReturnItemSearch[idx] || "").toLowerCase();
                                const filtered = items.filter((i: any) => !q || (i.name || "").toLowerCase().includes(q) || (i.company || "").toLowerCase().includes(q));
                                const hi = purchaseReturnItemHighlight[idx] || 0;
                                const selectItem = (i: any) => {
                                  updatePurchaseReturnItem(idx, "itemId", i.id);
                                  setActivePurchaseReturnItemIdx(idx);
                                  setPurchaseReturnItemSearch((prev: any) => ({ ...prev, [idx]: undefined }));
                                  setPurchaseReturnItemHighlight((prev: any) => ({ ...prev, [idx]: 0 }));
                                  setPurchaseReturnItemDropdown(null);
                                };
                                return (
                                  <>
                                    <input
                                      value={purchaseReturnItemSearch[idx] !== undefined ? purchaseReturnItemSearch[idx] : (pi.itemName || "")}
                                      onChange={e => {
                                        const r = e.target.getBoundingClientRect();
                                        setPurchaseReturnDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 240) });
                                        setPurchaseReturnItemSearch({ ...purchaseReturnItemSearch, [idx]: e.target.value });
                                        setPurchaseReturnItemHighlight({ ...purchaseReturnItemHighlight, [idx]: 0 });
                                        setPurchaseReturnItemDropdown(idx);
                                        setActivePurchaseReturnItemIdx(idx);
                                      }}
                                      onFocus={e => {
                                        const r = e.target.getBoundingClientRect();
                                        setPurchaseReturnDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 240) });
                                        setPurchaseReturnItemSearch((prev: any) => ({ ...prev, [idx]: prev[idx] ?? "" }));
                                        setPurchaseReturnItemHighlight((prev: any) => ({ ...prev, [idx]: 0 }));
                                        setPurchaseReturnItemDropdown(idx);
                                        setActivePurchaseReturnItemIdx(idx);
                                      }}
                                      onBlur={() => setTimeout(() => setPurchaseReturnItemDropdown(null), 200)}
                                      placeholder="Search medicine to return..."
                                      style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 6px", height: "24px", fontSize: "11px", fontWeight: "600" }}
                                      autoComplete="off"
                                      onKeyDown={e => {
                                        if (purchaseReturnItemDropdown === idx && filtered.length > 0) {
                                          if (e.key === "ArrowDown") { e.preventDefault(); setPurchaseReturnItemHighlight((prev: any) => ({ ...prev, [idx]: Math.min((prev[idx] || 0) + 1, filtered.length - 1) })); return; }
                                          if (e.key === "ArrowUp") { e.preventDefault(); setPurchaseReturnItemHighlight((prev: any) => ({ ...prev, [idx]: Math.max((prev[idx] || 0) - 1, 0) })); return; }
                                          if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); const item = filtered[hi]; if (item) { selectItem(item); } return; }
                                        }
                                      }}
                                    />
                                    {purchaseReturnItemDropdown === idx && (purchaseReturnItemSearch[idx] || "").length >= 0 && (
                                      <div style={{ position: "fixed", top: purchaseReturnDropdownPos.top, left: purchaseReturnDropdownPos.left, zIndex: 9999, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: purchaseReturnDropdownPos.width }}>
                                        {filtered.map((i: any, pos: number) => (
                                          <div
                                            key={i.id}
                                            onMouseDown={() => selectItem(i)}
                                            onMouseEnter={() => setPurchaseReturnItemHighlight((prev: any) => ({ ...prev, [idx]: pos }))}
                                            style={{ padding: "6px 10px", cursor: "pointer", borderBottom: "1px solid #e9ecef", fontSize: "11px", display: "flex", justifyContent: "space-between", alignItems: "center", background: pos === hi ? "#eff6ff" : "white" }}
                                          >
                                            <div>
                                              <strong>{i.name}</strong>
                                              <div style={{ fontSize: "10px", color: "#64748b" }}>{i.company || "Generic"} | Stock: {i.stock || 0}</div>
                                            </div>
                                            <span style={{ color: "#dc2626", fontWeight: "700", fontSize: "11px" }}>₹{i.pRate || i.price || i.mrp}</span>
                                          </div>
                                        ))}
                                        {filtered.length === 0 && (
                                          <div style={{ padding: "8px", color: "#64748b", fontSize: "11px", textAlign: "center" }}>No items found</div>
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
                                onChange={e => updatePurchaseReturnItem(idx, "unit", e.target.value)}
                                onFocus={() => setActivePurchaseReturnItemIdx(idx)}
                                placeholder="Unit"
                                style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                                title="Unit (e.g. 10T, 1B)"
                              />
                            </td>

                            {/* Batch */}
                            <td style={{ width: "85px", minWidth: "85px", padding: "2px", boxSizing: "border-box" }}>
                              <input
                                value={pi.batchNo || ""}
                                onChange={e => updatePurchaseReturnItem(idx, "batchNo", e.target.value)}
                                onFocus={() => setActivePurchaseReturnItemIdx(idx)}
                                placeholder="Batch"
                                style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 4px", height: "24px", fontSize: "10px" }}
                              />
                            </td>

                            {/* Exp Dt */}
                            <td style={{ width: "68px", minWidth: "68px", padding: "2px", boxSizing: "border-box" }}>
                              <input
                                value={pi.expiryDate || ""}
                                onChange={e => {
                                  let v = e.target.value.replace(/[^0-9/]/g, "");
                                  if (v.length === 2 && !v.includes("/") && !pi.expiryDate?.includes("/")) v = v + "/";
                                  updatePurchaseReturnItem(idx, "expiryDate", v);
                                }}
                                onFocus={() => setActivePurchaseReturnItemIdx(idx)}
                                placeholder="MM/YY"
                                maxLength={5}
                                style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                              />
                            </td>

                            {/* Mrp */}
                            <td style={{ width: "68px", minWidth: "68px", padding: "2px", boxSizing: "border-box" }}>
                              <input
                                type="number"
                                value={pi.mrp || ""}
                                onChange={e => updatePurchaseReturnItem(idx, "mrp", e.target.value)}
                                onFocus={() => setActivePurchaseReturnItemIdx(idx)}
                                placeholder="0.00"
                                style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 4px", height: "24px", fontSize: "10px", textAlign: "right" }}
                              />
                            </td>

                            {/* PRate */}
                            <td style={{ width: "68px", minWidth: "68px", padding: "2px", boxSizing: "border-box" }}>
                              <input
                                type="number"
                                value={pi.rate || ""}
                                onChange={e => updatePurchaseReturnItem(idx, "rate", e.target.value)}
                                onFocus={() => setActivePurchaseReturnItemIdx(idx)}
                                placeholder="0.00"
                                style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 4px", height: "24px", fontSize: "10px", textAlign: "right", fontWeight: "700" }}
                              />
                            </td>

                            {/* Qty */}
                            <td style={{ width: "52px", minWidth: "52px", padding: "2px", boxSizing: "border-box" }}>
                              <input
                                type="number"
                                min="1"
                                value={pi.qty || ""}
                                onChange={e => updatePurchaseReturnItem(idx, "qty", e.target.value)}
                                onFocus={() => setActivePurchaseReturnItemIdx(idx)}
                                style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "11px", textAlign: "center", fontWeight: "700", color: "#dc2626" }}
                              />
                            </td>

                            {/* Fr (Free Qty) */}
                            <td style={{ width: "46px", minWidth: "46px", padding: "2px", boxSizing: "border-box" }}>
                              <input
                                type="number"
                                min="0"
                                value={pi.freeQty || "0"}
                                onChange={e => updatePurchaseReturnItem(idx, "freeQty", e.target.value)}
                                onFocus={() => setActivePurchaseReturnItemIdx(idx)}
                                style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                              />
                            </td>

                            {/* D% */}
                            <td style={{ width: "50px", minWidth: "50px", padding: "2px", boxSizing: "border-box" }}>
                              <input
                                type="number"
                                value={pi.disc || "0"}
                                onChange={e => updatePurchaseReturnItem(idx, "disc", e.target.value)}
                                onFocus={() => setActivePurchaseReturnItemIdx(idx)}
                                style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                              />
                            </td>

                            {/* Gst% */}
                            <td style={{ width: "58px", minWidth: "58px", padding: "2px", boxSizing: "border-box" }}>
                              <select
                                value={pi.gst || "5"}
                                onChange={e => updatePurchaseReturnItem(idx, "gst", e.target.value)}
                                onFocus={() => setActivePurchaseReturnItemIdx(idx)}
                                style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "1px 1px", height: "24px", fontSize: "10px", textAlign: "center" }}
                              >
                                {GST_RATES.map((r: any) => <option key={r} value={r}>{r}%</option>)}
                              </select>
                            </td>

                            {/* Disc Amount */}
                            <td style={{ width: "65px", minWidth: "65px", padding: "3px 4px", color: "#ef4444", textAlign: "right", fontSize: "10px", whiteSpace: "nowrap", boxSizing: "border-box" }}>
                              -₹{fmt(pi.discAmt || 0)}
                            </td>

                            {/* Amount */}
                            <td style={{ width: "80px", minWidth: "80px", padding: "3px 4px", fontWeight: "800", color: "#dc2626", textAlign: "right", fontSize: "11px", whiteSpace: "nowrap", boxSizing: "border-box" }}>
                              ₹{fmt(pi.amount || 0)}
                            </td>

                            {/* Delete Row */}
                            <td style={{ width: "30px", minWidth: "30px", padding: "2px", textAlign: "center", boxSizing: "border-box" }}>
                              <button
                                onClick={() => setPurchaseReturnItems(prev => prev.filter((_, i) => i !== idx))}
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
                        <td colSpan={9} style={{ padding: "5px 8px", fontWeight: "700", textAlign: "right", fontSize: "11px", color: "#64748b" }}>TOTALS →</td>
                        <td style={{ padding: "5px 4px", fontWeight: "800", textAlign: "right", fontSize: "11px", color: "#ef4444", whiteSpace: "nowrap" }}>
                          -₹{fmt(purchaseReturnItems.reduce((s: any, pi: any) => s + (pi.discAmt || 0), 0))}
                        </td>
                        <td></td>
                        <td style={{ padding: "5px 4px", fontWeight: "800", textAlign: "right", fontSize: "11px", color: "var(--color-primary)", whiteSpace: "nowrap" }}>
                          ₹{fmt(purchaseReturnItems.reduce((s: any, pi: any) => s + (pi.base || 0), 0))}
                        </td>
                        <td style={{ padding: "5px 4px", fontWeight: "800", textAlign: "right", fontSize: "12px", color: "#dc2626", whiteSpace: "nowrap" }}>
                          ₹{fmt(purchaseReturnItems.reduce((s: any, pi: any) => s + num(pi.amount || 0), 0))}
                        </td>
                        <td></td>
                      </tr>
                      <tr style={{ background: "#fef2f2", borderTop: "1px solid #fee2e2" }}>
                        <td colSpan={9} style={{ padding: "4px 8px", fontWeight: "700", textAlign: "right", fontSize: "10px", color: "#b91c1c" }}>GST BREAKDOWN →</td>
                        <td colSpan={5} style={{ padding: "4px 8px", fontWeight: "700", fontSize: "10px", color: "#b91c1c", textAlign: "right" }}>
                          {(() => {
                            const gT = purchaseReturnItems.reduce((s: any, pi: any) => s + (pi.base || 0) * num(pi.gst || 0) / 100, 0);
                            return `SGST: ₹${fmt(gT / 2)} | CGST: ₹${fmt(gT / 2)} | IGST: ₹${fmt(gT)}`;
                          })()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* ── ACTIVE ITEM DETAILS CARD & SUMMARY BOX (MATCHES TRANSECTION.PDF PAGE 4) ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "10px", alignItems: "start" }}>
                  
                  {/* Left: Active Item Details & Tax Grid */}
                  {(() => {
                    const cur = purchaseReturnItems[activePurchaseReturnItemIdx] || purchaseReturnItems[0] || {};
                    const itemMaster = items.find((i: any) => i.id === cur.itemId || i.name === cur.itemName);
                    const baseTot = purchaseReturnItems.reduce((s: any, pi: any) => s + (pi.base || 0), 0);
                    const gstTot = purchaseReturnItems.reduce((s: any, pi: any) => s + (pi.base || 0) * num(pi.gst || 0) / 100, 0);
                    return (
                      <div style={{ background: "#f8fafc", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "8px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a" }}>
                            💊 {cur.itemName || "Select an item to view live store details"}
                          </span>
                          {cur.batchNo && (
                            <span style={{ fontSize: "10px", background: "#fef2f2", color: "#991b1b", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                              Batch: {cur.batchNo} ({cur.expiryDate || "No Exp"})
                            </span>
                          )}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", fontSize: "11px" }}>
                          <div>
                            <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Company:</span>
                            <strong style={{ color: "#334155" }}>{itemMaster?.company || "—"}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Packing:</span>
                            <strong style={{ color: "#334155" }}>{cur.unit || itemMaster?.unit || itemMaster?.packing || "—"}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Location:</span>
                            <strong style={{ color: "#1d4ed8" }}>📍 {cur.location || itemMaster?.location || itemMaster?.rack || "—"}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Store Stock:</span>
                            <strong style={{ color: (itemMaster?.stock || 0) > 0 ? "#16a34a" : "#dc2626" }}>{itemMaster?.stock || 0} Units</strong>
                          </div>
                        </div>

                        {/* Tax Grid from transection.pdf page 4 */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "4px", background: "white", padding: "4px 8px", borderRadius: "4px", border: "1px solid #e2e8f0", textAlign: "center", fontSize: "10px" }}>
                          <div><span style={{ color: "#64748b", display: "block" }}>Base</span><strong>₹{fmt(baseTot)}</strong></div>
                          <div><span style={{ color: "#64748b", display: "block" }}>SGST</span><strong>₹{fmt(gstTot / 2)}</strong></div>
                          <div><span style={{ color: "#64748b", display: "block" }}>CGST</span><strong>₹{fmt(gstTot / 2)}</strong></div>
                          <div><span style={{ color: "#64748b", display: "block" }}>IGST</span><strong>₹{fmt(gstTot)}</strong></div>
                          <div><span style={{ color: "#64748b", display: "block" }}>Total Tax</span><strong style={{ color: "#1d4ed8" }}>₹{fmt(gstTot)}</strong></div>
                          <div><span style={{ color: "#64748b", display: "block" }}>Cess</span><strong>₹0.00</strong></div>
                        </div>

                        {/* Return Message / Remark Input */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569", whiteSpace: "nowrap" }}>Msg:</span>
                          <input
                            value={purchaseReturnForm.billMsg || ""}
                            onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, billMsg: e.target.value })}
                            placeholder="Debit Note / Return memo remarks..."
                            style={{ ...inp, height: "24px", fontSize: "11px", padding: "2px 6px" }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Right: Summary & Adjustments Box (Matches Page 4 format) */}
                  {(() => {
                    const gross = purchaseReturnItems.reduce((s: any, pi: any) => s + num(pi.amount || 0), 0);
                    const base = purchaseReturnItems.reduce((s: any, pi: any) => s + (pi.base || 0), 0);
                    const discAmt = purchaseReturnItems.reduce((s: any, pi: any) => s + (pi.discAmt || 0), 0);
                    const gstTot = purchaseReturnItems.reduce((s: any, pi: any) => s + (pi.base || 0) * num(pi.gst || 0) / 100, 0);
                    const netTotal = gross - num(purchaseReturnForm.discAfterGst) - num(purchaseReturnForm.lessOther) + num(purchaseReturnForm.otherAdj) - num(purchaseReturnForm.lessDisc) - num(purchaseReturnForm.crNote);
                    return (
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 10px", fontSize: "11px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 10px" }}>
                          <span>Base Amount:</span><span style={{ textAlign: "right", fontWeight: "600" }}>₹{fmt(base)}</span>
                          <span style={{ color: "#ef4444" }}>Less Disc:</span><span style={{ textAlign: "right", color: "#ef4444" }}>-₹{fmt(discAmt)}</span>
                          <span>Taxable:</span><span style={{ textAlign: "right" }}>₹{fmt(base)}</span>
                          <span style={{ color: "#64748b" }}>GST Total:</span><span style={{ textAlign: "right", color: "#1d4ed8", fontWeight: "700" }}>₹{fmt(gstTot)}</span>
                          <span style={{ color: "#64748b" }}>Disc After GST:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseReturnForm.discAfterGst || "0"} onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, discAfterGst: e.target.value })} style={{ ...inp, width: "60px", padding: "1px 3px", fontSize: "10px", height: "18px" }} /></span>
                          <span style={{ color: "#64748b" }}>Less Other:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseReturnForm.lessOther || "0"} onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, lessOther: e.target.value })} style={{ ...inp, width: "60px", padding: "1px 3px", fontSize: "10px", height: "18px" }} /></span>
                          <span style={{ color: "#64748b" }}>Other +/-:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseReturnForm.otherAdj || "0"} onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, otherAdj: e.target.value })} style={{ ...inp, width: "60px", padding: "1px 3px", fontSize: "10px", height: "18px" }} /></span>
                          <span style={{ color: "#ef4444" }}>Less Disc:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseReturnForm.lessDisc || "0"} onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, lessDisc: e.target.value })} style={{ ...inp, width: "60px", padding: "1px 3px", fontSize: "10px", height: "18px" }} /></span>
                          <span style={{ color: "#64748b" }}>Cr Note:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseReturnForm.crNote || "0"} onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, crNote: e.target.value })} style={{ ...inp, width: "60px", padding: "1px 3px", fontSize: "10px", height: "18px" }} /></span>
                          <span style={{ fontWeight: "800", borderTop: "1px solid #cbd5e1", paddingTop: "4px" }}>NET RETURN TOTAL:</span>
                          <span style={{ textAlign: "right", fontWeight: "900", color: "#dc2626", fontSize: "14px", borderTop: "1px solid #cbd5e1", paddingTop: "4px" }}>₹{fmt(netTotal)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* ── BOTTOM ACTION TOOLBAR (ZERO SCROLL COMPLIANT) ── */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
                  <button onClick={() => setPurchaseReturnItems(prev => [...prev, emptyPurchaseReturnItem()])} style={{ ...btn("var(--color-primary)"), fontSize: "12px", padding: "5px 10px" }}>
                    <Plus size={13} /> Add Row
                  </button>
                  <button
                    onClick={handleSavePurchaseReturn}
                    style={{ ...btn("#dc2626"), fontSize: "12px", padding: "5px 12px", fontWeight: "700" }}
                  >
                    <CheckCircle size={14} /> Save Debit Note & Deduct Stock
                  </button>
                  <button
                    onClick={() => printPurchaseReturnVoucher({ ...purchaseReturnForm, items: purchaseReturnItems })}
                    style={{ ...btn("#0284c7"), fontSize: "12px", padding: "5px 10px" }}
                  >
                    <Printer size={13} /> Print Debit Note
                  </button>
                  <button
                    onClick={holdCurrentPurchaseReturn}
                    style={{ ...btn("#eab308", "#713f12"), fontSize: "12px", padding: "5px 10px" }}
                    title="Hold draft return"
                  >
                    ⏸️ Hold ({pendingPurchaseReturns.length})
                  </button>
                  <button
                    onClick={() => setShowDuplicatePurchaseReturnModal(true)}
                    style={{ ...btn("#6366f1"), fontSize: "12px", padding: "5px 10px" }}
                    title="Duplicate from existing return"
                  >
                    📋 Duplicate
                  </button>
                  {purchaseReturnForm.id && (
                    <button
                      onClick={() => handleDeletePurchaseReturn(purchaseReturnForm)}
                      style={{ ...btn("#ef4444"), fontSize: "12px", padding: "5px 10px" }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                  <button
                    onClick={() => openPurchaseReturnForm()}
                    style={{ ...btn("#2563eb", "white"), fontSize: "12px", padding: "5px 14px", fontWeight: "700" }}
                    title="New Purchase Return (Alt+N)"
                  >
                    ➕ New (Alt+N)
                  </button>
                </div>
              </div>
            )}

            {/* Ensure form is always open */}
            {!showPurchaseReturnForm && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <button onClick={() => openPurchaseReturnForm()} style={{ ...btn("var(--color-primary)"), padding: "8px 16px" }}>➕ Open Purchase Return Form</button>
              </div>
            )}

            {/* ── MODAL: PENDING PURCHASE RETURN QUEUE ── */}
            {showPendingPurchaseReturnModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "600px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>⏸️ Pending (Held) Purchase Returns ({pendingPurchaseReturns.length})</div>
                    <button onClick={() => setShowPendingPurchaseReturnModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
                  </div>
                  <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
                    {pendingPurchaseReturns.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b", fontSize: "13px" }}>
                        No held purchase returns in the pending queue.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {pendingPurchaseReturns.map((pb: any) => (
                          <div key={pb.id} style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                            <div>
                              <div style={{ fontWeight: "700", fontSize: "13px", color: "#1e293b" }}>{pb.partyName || "Supplier"} {pb.purchaseReturnForm?.refBillNo ? `(Ref Bill: ${pb.purchaseReturnForm.refBillNo})` : ""}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>Held at: {pb.heldAt} | Items: {pb.purchaseReturnItems?.length || 0} | Total: ₹{fmt(pb.totalAmt || 0)}</div>
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button onClick={() => resumePendingPurchaseReturn(pb)} style={{ ...btn("#16a34a"), padding: "4px 10px", fontSize: "12px" }}>▶️ Resume</button>
                              <button onClick={() => discardPendingPurchaseReturn(pb.id)} style={{ ...btn("#ef4444"), padding: "4px 10px", fontSize: "12px" }}>🗑️ Discard</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", textAlign: "right", background: "#f8fafc" }}>
                    <button onClick={() => setShowPendingPurchaseReturnModal(false)} style={{ ...btn("#64748b"), padding: "6px 14px" }}>Close</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── MODAL: PREVIEW DEBIT NOTE / RETURN VOUCHER ── */}
            {showPurchaseReturnPreviewModal && purchaseReturnPreview && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "680px", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>👁️ Debit Note Voucher - Return #{purchaseReturnPreview.returnNo || purchaseReturnPreview.entryNo}</div>
                    <button onClick={() => setShowPurchaseReturnPreviewModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
                  </div>
                  <div style={{ padding: "16px", overflowY: "auto", flex: 1, fontFamily: "monospace", fontSize: "12px" }}>
                    <div style={{ textAlign: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "8px", marginBottom: "8px" }}>
                      <div style={{ fontWeight: "800", fontSize: "15px" }}>{(currentUser?.pharmacyName || "SHIV DHARA MEDICAL STORE").toUpperCase()}</div>
                      <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: "700" }}>PURCHASE RETURN / DEBIT NOTE MEMO</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "11px", marginBottom: "8px" }}>
                      <div><strong>Party:</strong> {purchaseReturnPreview.partyName || purchaseReturnPreview.supplierName || "Supplier"}</div>
                      <div style={{ textAlign: "right" }}><strong>DN Entry:</strong> {purchaseReturnPreview.billSeries || "G"}-{purchaseReturnPreview.returnNo || purchaseReturnPreview.entryNo}</div>
                      <div><strong>Orig Bill:</strong> {purchaseReturnPreview.refBillNo || "—"}</div>
                      <div style={{ textAlign: "right" }}><strong>Date:</strong> {new Date(purchaseReturnPreview.date || purchaseReturnPreview.entryDate || today()).toLocaleDateString("en-IN")}</div>
                      <div><strong>Reason:</strong> {purchaseReturnPreview.reason || "Expired"}</div>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "10px" }}>
                      <thead>
                        <tr style={{ borderTop: "1px solid #cbd5e1", borderBottom: "1px solid #cbd5e1", background: "#f8fafc" }}>
                          <th style={{ textAlign: "left", padding: "4px" }}>Item</th>
                          <th style={{ textAlign: "center", padding: "4px" }}>Unit</th>
                          <th style={{ textAlign: "left", padding: "4px" }}>Batch</th>
                          <th style={{ textAlign: "center", padding: "4px" }}>Exp</th>
                          <th style={{ textAlign: "right", padding: "4px" }}>Qty</th>
                          <th style={{ textAlign: "right", padding: "4px" }}>PRate</th>
                          <th style={{ textAlign: "right", padding: "4px" }}>Amt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(purchaseReturnPreview.items || []).map((it: any, i: number) => (
                          <tr key={i} style={{ borderBottom: "1px dotted #e2e8f0" }}>
                            <td style={{ padding: "4px" }}>{it.itemName || it.name}</td>
                            <td style={{ textAlign: "center", padding: "4px" }}>{it.unit || "—"}</td>
                            <td style={{ padding: "4px" }}>{it.batchNo || "—"}</td>
                            <td style={{ textAlign: "center", padding: "4px" }}>{it.expiryDate || "—"}</td>
                            <td style={{ textAlign: "right", padding: "4px" }}>{it.qty} {it.freeQty > 0 ? `+${it.freeQty}` : ""}</td>
                            <td style={{ textAlign: "right", padding: "4px" }}>₹{fmt(it.rate || it.ptr || 0)}</td>
                            <td style={{ textAlign: "right", padding: "4px", fontWeight: "700" }}>₹{fmt(it.amount || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "6px", display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "13px" }}>
                      <span>TOTAL DEBIT NOTE VALUE:</span>
                      <span style={{ color: "#dc2626" }}>₹{fmt(purchaseReturnPreview.total || 0)}</span>
                    </div>
                  </div>
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", background: "#f8fafc" }}>
                    <button
                      onClick={() => {
                        const win = window.open('', '_blank');
                        if (win) {
                          win.document.write(`<html><head><title>Debit Note Voucher</title><style>body{font-family:monospace;padding:20px;}</style></head><body>${document.querySelector('[fontFamily="monospace"]')?.outerHTML || ''}</body></html>`);
                          win.document.close();
                          win.print();
                        }
                      }}
                      style={{ ...btn("#0284c7"), padding: "6px 16px" }}
                    >
                      <Printer size={14} /> Print
                    </button>
                    <button onClick={() => setShowPurchaseReturnPreviewModal(false)} style={{ ...btn("#64748b"), padding: "6px 14px" }}>Close</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── MODAL: DUPLICATE PURCHASE RETURN ── */}
            {showDuplicatePurchaseReturnModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "550px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>📋 Clone / Duplicate Past Purchase Return</div>
                    <button onClick={() => setShowDuplicatePurchaseReturnModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
                  </div>
                  <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
                    <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "10px" }}>Select a past debit note below to copy its item list into a new fresh return entry:</p>
                    {purchaseReturns.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "20px 0", color: "#64748b", fontSize: "12px" }}>No previous returns to clone.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {purchaseReturns.slice(0, 20).map((r: any) => (
                          <div
                            key={r.id}
                            onClick={() => duplicatePurchaseReturn(r)}
                            style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", transition: "0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                            onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
                          >
                            <div>
                              <strong style={{ fontSize: "12px" }}>{r.partyName || r.supplierName || "Supplier"}</strong>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>DN #{r.returnNo || r.entryNo} | Date: {new Date(r.date || r.entryDate).toLocaleDateString("en-IN")}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <strong style={{ color: "#dc2626", fontSize: "12px" }}>₹{fmt(r.total || 0)}</strong>
                              <div style={{ fontSize: "10px", color: "#0284c7" }}>{r.items?.length || 0} Items</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", textAlign: "right", background: "#f8fafc" }}>
                    <button onClick={() => setShowDuplicatePurchaseReturnModal(false)} style={{ ...btn("#64748b"), padding: "6px 14px" }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── DRAWER: BROWSE ALL PURCHASE RETURNS ── */}
            {purchaseReturnListDrawer && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: "white", width: "100%", maxWidth: "700px", height: "100%", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-2xl)" }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <div style={{ fontWeight: "800", fontSize: "16px", color: "#0f172a" }}>↩️ Debit Note Register ({purchaseReturns.length})</div>
                    <button onClick={() => setPurchaseReturnListDrawer(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
                  </div>
                  <div style={{ padding: "10px 18px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                    <input
                      placeholder="Filter by Supplier, DN#, Ref Bill..."
                      value={purchaseReturnSearch}
                      onChange={e => setPurchaseReturnSearch(e.target.value)}
                      style={{ ...inp, width: "100%" }}
                    />
                  </div>
                  <div style={{ padding: "16px 18px", overflowY: "auto", flex: 1 }}>
                    {(() => {
                      const q = (purchaseReturnSearch || "").toLowerCase();
                      const filtered = purchaseReturns.filter((r: any) =>
                        !q ||
                        (String(r.returnNo || r.entryNo) || "").toLowerCase().includes(q) ||
                        (r.partyName || r.supplierName || "").toLowerCase().includes(q) ||
                        (r.refBillNo || "").toLowerCase().includes(q)
                      );
                      if (filtered.length === 0) {
                        return <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>No purchase returns found.</div>;
                      }
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {filtered.map((r: any) => (
                            <div key={r.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                              <div
                                style={{ cursor: "pointer", flex: 1 }}
                                onClick={() => { openPurchaseReturnForm(r); setPurchaseReturnListDrawer(false); }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ fontWeight: "800", color: "#dc2626", fontSize: "13px" }}>DN #{r.returnNo || r.entryNo}</span>
                                  <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "13px" }}>{r.partyName || r.supplierName}</span>
                                  <span style={{ fontSize: "11px", background: "#fef2f2", color: "#991b1b", padding: "1px 6px", borderRadius: "10px" }}>{r.reason || "Expired"}</span>
                                </div>
                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                                  Date: {new Date(r.date || r.entryDate).toLocaleDateString("en-IN")} | Orig Bill: {r.refBillNo || "—"} | Items: {r.items?.length || 0}
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontWeight: "900", color: "#dc2626", fontSize: "14px" }}>₹{fmt(r.total)}</div>
                                </div>
                                <button
                                  onClick={() => printPurchaseReturnVoucher(r)}
                                  style={{ ...btn("#0284c7"), padding: "4px 8px", fontSize: "11px" }}
                                  title="Print Debit Note"
                                >
                                  <Printer size={12} />
                                </button>
                                <button
                                  onClick={() => { openPurchaseReturnForm(r); setPurchaseReturnListDrawer(false); }}
                                  style={{ ...btn("var(--color-primary)"), padding: "4px 8px", fontSize: "11px" }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeletePurchaseReturn(r)}
                                  style={{ ...btn("#ef4444"), padding: "4px 8px", fontSize: "11px" }}
                                  title="Delete & Restore Stock"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ padding: "12px 18px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px", color: "#64748b" }}>
                      Total ({purchaseReturns.length}): <strong style={{ color: "#dc2626" }}>₹{fmt(purchaseReturns.reduce((s: any, r: any) => s + num(r.total), 0))}</strong>
                    </span>
                    <button onClick={() => setPurchaseReturnListDrawer(false)} style={{ ...btn("#64748b"), padding: "6px 14px" }}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════
            OWNER: BANK ENTRY
        ══════════════════════════════════════════ */}
  );
}
