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

export default function SalesPOS({ setScannerTarget, setShowCameraScanner }) {
  const {
    salesBills, saveSalesBills,
    items, batches, customers, doctors,
    salesForm, setSalesForm, showSalesForm, setShowSalesForm,
    salesItems, setSalesItems,
    salesItemSearch, setSalesItemSearch,
    salesItemDropdown, setSalesItemDropdown,
    salesItemHighlight, setSalesItemHighlight,
    salesDropdownPos, setSalesDropdownPos,
    salesBillSearch, setSalesBillSearch,
    openSalesForm, updateSalesItem, addSalesItem, removeSalesItem,
    handleSaveSales, handlePrintSalesBill, handleDeleteSalesBill,
    calcSalesItemAmt, emptySalesItem, emptySalesForm,
    showToast, showConfirm,
    focusNext, calcTotal, isExpired, isExpiringSoon,
    getVIPLevel, getCustomerPoints, healthCards, getHealthCard,
    lockBillData, isDateLocked, auditLogs, logUserChange,
    handleWhatsAppBill, dotMatrixMode, generateDotMatrixInvoiceHTML,
    billInstructions, setBillInstructions,
    setActiveSection, isOwner, currentUser
  } = useMedicalStore();

  // Local states
  const [salesBillSearchDropdown, setSalesBillSearchDropdown] = useState(false);
  const [salesBillSearchHighlight, setSalesBillSearchHighlight] = useState(0);
  const [activeSalesItemIdx, setActiveSalesItemIdx] = useState(0);
  const [pendingSalesBills, setPendingSalesBills] = useState(() => {
    try {
      const saved = localStorage.getItem("store_pending_sales_bills");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showSalesPreviewModal, setShowSalesPreviewModal] = useState(false);
  const [salesPreviewBill, setSalesPreviewBill] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [salesBillListDrawer, setSalesBillListDrawer] = useState(false);
  const [printCopies, setPrintCopies] = useState(1);

  useEffect(() => {
    try {
      localStorage.setItem("store_pending_sales_bills", JSON.stringify(pendingSalesBills));
    } catch (_) {}
  }, [pendingSalesBills]);

  return (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>🧾 Sales Bills ({salesBills.length})</h2>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
                  {(() => {
                    const q = (salesBillSearch || "").toLowerCase();
                    const filtered = q ? salesBills.filter((b: any) => (String(b.billNo) || "").toLowerCase().includes(q) || (b.mobile || "").includes(q) || (b.patientName || "").toLowerCase().includes(q) || matchesDate(b.date, q)).slice(0, 15) : [];
                    return (
                      <>
                        <input
                          placeholder="Search Patient / Bill# / Mobile / Date... + Enter"
                          value={salesBillSearch}
                          onChange={e => {
                            setSalesBillSearch(e.target.value);
                            setSalesBillSearchDropdown(true);
                            setSalesBillSearchHighlight(0);
                          }}
                          onKeyDown={e => {
                            if (e.key === "ArrowDown") { e.preventDefault(); setSalesBillSearchHighlight(prev => Math.min(prev + 1, filtered.length - 1)); }
                            else if (e.key === "ArrowUp") { e.preventDefault(); setSalesBillSearchHighlight(prev => Math.max(prev - 1, 0)); }
                            else if (e.key === "Enter") {
                              e.preventDefault();
                              if (filtered.length > 0 && salesBillSearchDropdown) {
                                openSalesForm(filtered[salesBillSearchHighlight].isReturn, filtered[salesBillSearchHighlight]);
                                setSalesBillSearchDropdown(false);
                                setSalesBillSearch("");
                              } else if (q) {
                                const match = salesBills.find((b: any) => (String(b.billNo) || "").toLowerCase() === q || (b.mobile || "") === q || (b.patientName || "").toLowerCase() === q || matchesDate(b.date, q));
                                if (match) {
                                  openSalesForm(match.isReturn, match);
                                  setSalesBillSearchDropdown(false);
                                  setSalesBillSearch("");
                                } else {
                                  showToast("No bill found matching: " + salesBillSearch, "error");
                                }
                              }
                            }
                          }}
                          onFocus={() => setSalesBillSearchDropdown(true)}
                          onBlur={() => setTimeout(() => setSalesBillSearchDropdown(false), 200)}
                          style={{ ...inp, width: "300px", paddingLeft: "30px", borderRadius: "20px", background: "#f8fafc" }}
                        />
                        {salesBillSearchDropdown && filtered.length > 0 && (
                          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--shadow-lg)", zIndex: 50, marginTop: "4px", overflow: "hidden" }}>
                            {filtered.map((b: any, idx: number) => (
                              <div key={b.id} onClick={() => { openSalesForm(b.isReturn, b); setSalesBillSearchDropdown(false); setSalesBillSearch(""); }} style={{ padding: "8px 12px", cursor: "pointer", background: idx === salesBillSearchHighlight ? "#f1f5f9" : "white", borderBottom: "1px solid #f1f5f9" }} onMouseEnter={() => setSalesBillSearchHighlight(idx)}>
                                <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b" }}>Bill #{b.billNo} {b.patientName ? ` - ${b.patientName}` : ""}</div>
                                <div style={{ fontSize: "10px", color: "#64748b" }}>Date: {new Date(b.date).toLocaleDateString("en-IN")} | Net: ₹{fmt(Math.abs(num(b.netAmount)))}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {pendingSalesBills.length > 0 && (
                  <button onClick={() => setShowPendingModal(true)} style={{ ...btn("#f59e0b"), padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }} title="View Held/Pending Bills">
                    <span>⏸️</span>
                    <span><strong>{pendingSalesBills.length}</strong> Pending</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sales Form */}
            {showSalesForm && (
              <div style={{ background: "white", borderRadius: "8px", padding: "12px 14px", border: `2px solid ${isReturn ? "#fecaca" : "#bbf7d0"}`, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", height: "calc(100vh - 48px)", maxHeight: "calc(100vh - 48px)", overflow: "hidden" }}>
                {/* Header Bar with Bill No Series, Prev/Next, Mode Switcher & Date */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center", flexWrap: "wrap", gap: "8px", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  {/* Left: Bill No, Series, Navigation & Mode */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Bill No:</span>
                      <span style={{ background: "#e2e8f0", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "2px 8px", fontWeight: "800", fontSize: "12px", color: "#1e293b" }}>{salesForm.billSeries || (isReturn ? "R" : (salesForm.quotation ? "Q" : (salesForm.billType === "Tax" ? "T" : "G")))}</span>
                      <span style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "2px 10px", fontWeight: "800", fontSize: "13px", color: "#0f172a" }}>{salesForm.billNo || (salesBills.length + 1)}</span>
                    </div>

                    <div style={{ display: "flex", gap: "3px" }}>
                      <button type="button" onClick={handlePrevBill} title="Previous Bill" style={{ ...btn("#f1f5f9"), color: "#334155", padding: "2px 8px", fontSize: "11px", height: "24px" }}>◀ Prev</button>
                      <button type="button" onClick={handleNextBill} title="Next Bill" style={{ ...btn("#f1f5f9"), color: "#334155", padding: "2px 8px", fontSize: "11px", height: "24px" }}>Next ▶</button>
                    </div>

                    {/* Mode Buttons: Retail, Tax, Return, Quot */}
                    <div style={{ display: "inline-flex", background: "#e2e8f0", padding: "2px", borderRadius: "6px", gap: "2px" }}>
                      <button
                        type="button"
                        onClick={() => { setIsReturn(false); setSalesForm({ ...salesForm, quotation: false, billType: "Retail", billSeries: "G" }); }}
                        style={{
                          border: "none",
                          background: !isReturn && !salesForm.quotation && salesForm.billType !== "Tax" ? "#16a34a" : "transparent",
                          color: !isReturn && !salesForm.quotation && salesForm.billType !== "Tax" ? "white" : "#475569",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Retail
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsReturn(false); setSalesForm({ ...salesForm, quotation: false, billType: "Tax", billSeries: "T" }); }}
                        style={{
                          border: "none",
                          background: !isReturn && !salesForm.quotation && salesForm.billType === "Tax" ? "#2563eb" : "transparent",
                          color: !isReturn && !salesForm.quotation && salesForm.billType === "Tax" ? "white" : "#475569",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Tax
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsReturn(true); setSalesForm({ ...salesForm, quotation: false, billType: "Return", billSeries: "R" }); }}
                        style={{
                          border: "none",
                          background: isReturn ? "#ef4444" : "transparent",
                          color: isReturn ? "white" : "#475569",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Return
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsReturn(false); setSalesForm({ ...salesForm, quotation: true, billType: "Quot", billSeries: "Q" }); }}
                        style={{
                          border: "none",
                          background: salesForm.quotation ? "#d97706" : "transparent",
                          color: salesForm.quotation ? "white" : "#475569",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Quot
                      </button>
                    </div>
                  </div>

                  {/* Right: Tax Indicator, Date & Close */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ background: "#dbeafe", color: "#1e40af", padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                      RD (Within State - SGST/CGST)
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>Date:</span>
                      <input
                        type="date"
                        value={salesForm.date ? String(salesForm.date).slice(0, 10) : today()}
                        onChange={e => setSalesForm({ ...salesForm, date: e.target.value })}
                        style={{ ...inp, width: "125px", height: "26px", fontSize: "11px", fontWeight: "600" }}
                      />
                    </div>
                    <button onClick={() => setShowSalesForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
                  </div>
                </div>

                {/* Lock Status Banner */}
                {(() => {
                  const check = isDateLocked(isReturn ? "salesReturn" : "sales", salesForm.date || today());
                  if (!check.isLocked) return null;
                  return (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px 12px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontSize: "12px", fontWeight: "600" }}>
                      <span>🔒</span>
                      <span>This date ({new Date(salesForm.date || today()).toLocaleDateString("en-IN")}) is <strong>LOCKED by Supervisor</strong> ({check.label}). Edits and deletions are blocked.</span>
                    </div>
                  );
                })()}

                {/* Patient/Doctor details */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: "6px", marginBottom: "8px", background: "#f8fafc", borderRadius: "8px", padding: "8px 12px", border: "1px solid var(--color-border)" }}>
                  <div>
                    <label style={lbl}>A/c Name</label>
                    <input
                      type="text"
                      value={salesForm.acName || "CASH ***"}
                      onChange={e => setSalesForm({ ...salesForm, acName: e.target.value.toUpperCase() })}
                      placeholder="CASH ***"
                      style={inp}
                    />
                  </div>
                  {[
                    { k: "patientName", l: "Patient Name", t: "text", ph: "Patient name" }, { k: "patientArea", l: "Patient Area", t: "text", ph: "Area/Locality" },
                    { k: "mobile", l: "Mobile No", t: "tel", ph: "Mobile no" }, { k: "address", l: "Address", t: "text", ph: "Address" },
                    { k: "salesMan", l: "S.Man (Salesman)", t: "text", ph: "Salesman name" },
                  ].map(f => (
                    <div key={f.k}><label style={lbl}>{f.l}</label><input type={f.t} value={salesForm[f.k] || ""} onChange={e => setSalesForm({ ...salesForm, [f.k]: e.target.value.toUpperCase() })} placeholder={f.ph} style={inp} /></div>
                  ))}
                  <div><label style={lbl}>Doctor Name</label>
                    <select value={salesForm.doctorName || ""} onChange={e => setSalesForm({ ...salesForm, doctorName: e.target.value })} style={inp}>
                      <option value="">-- Select Doctor --</option>
                      {doctors.map((d: any) => <option key={d.id} value={d.name}>{d.name}{d.speciality ? " (" + d.speciality + ")" : ""}</option>)}
                      <option value="OTHER">Other / Manual</option>
                    </select>
                  </div>
                  <div><label style={lbl}>Payment Mode</label><select value={salesForm.paymentMode || "cash"} onChange={e => { setSalesForm({ ...salesForm, paymentMode: e.target.value }); setSplitPayMode(false); }} style={inp}><option value="cash">Cash</option><option value="split">Split (Cash+UPI)</option><option value="card">Card/CD</option><option value="upi">UPI/NEFT</option><option value="credit">Credit/Khata</option><option value="cheque">Cheque</option></select></div>
                  {salesForm.paymentMode === "split" && (
                    <div style={{ gridColumn: "span 2", background: "rgba(255,255,255,0.1)", borderRadius: "6px", padding: "6px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      <div><label style={{ ...lbl, color: "#d97706" }}>💵 Cash Amount ₹</label><input type="number" value={splitCash} onChange={e => { setSplitCash(e.target.value); }} placeholder="Cash" style={inp} /></div>
                      <div><label style={{ ...lbl, color: "#2563eb" }}>📱 UPI Amount ₹</label><input type="number" value={splitUpi} onChange={e => setSplitUpi(e.target.value)} placeholder="UPI" style={inp} /></div>
                      <div style={{ gridColumn: "span 2" }}><label style={{ ...lbl, color: "#64748b" }}>UPI Txn ID</label><input value={splitUpiTxn} onChange={e => setSplitUpiTxn(e.target.value.toUpperCase())} placeholder="Transaction ID" style={inp} /></div>
                    </div>
                  )}
                  {salesForm.paymentMode === "credit" && salesForm.patientName && (
                    <div style={{ gridColumn: "span 2", background: "rgba(250,204,21,0.15)", borderRadius: "6px", padding: "6px", border: "1px solid rgba(250,204,21,0.3)" }}>
                      <span style={{ fontSize: "11px", color: "#facc15", fontWeight: "700" }}>📒 {salesForm.patientName} - Current Khata Balance: ₹{fmt(getKhataBalance(salesForm.patientName))}</span>
                    </div>
                  )}
                  <div><label style={lbl}>Extra Discount %</label><input type="number" value={salesForm.discount || "0"} onChange={e => setSalesForm({ ...salesForm, discount: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Refill Due Date (Optional)</label><input type="date" value={salesForm.refillDate || ""} onChange={e => setSalesForm({ ...salesForm, refillDate: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Pay Rec / Refund (₹)</label><input type="number" value={salesForm.payRec || "0"} onChange={e => setSalesForm({ ...salesForm, payRec: e.target.value })} placeholder="0.00" style={inp} /></div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", paddingTop: "6px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                      <input type="checkbox" checked={!!isReturn} disabled style={{ width: "13px", height: "13px" }} />
                      Return Bill
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                      <input type="checkbox" checked={!!salesForm.quotation} onChange={e => setSalesForm({ ...salesForm, quotation: e.target.checked })} style={{ width: "13px", height: "13px" }} />
                      Quotation
                    </label>
                  </div>
                </div>

                {/* Item search + table (Legacy Visual InfoSoft Parity Columns: No, Item Name, Unit, Batch, Expiry, MRP, Base, GST%, Qty, Disc%, Amount) */}
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "auto", marginBottom: "8px", border: "1px solid var(--color-border)", borderRadius: "6px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                      <tr style={{ background: "#f1f5f9" }}>
                        {[
                          { l: "NO", w: "35px", a: "center" },
                          { l: "ITEM NAME", w: "240px", a: "left" },
                          { l: "UNIT", w: "65px", a: "center" },
                          { l: "BATCH", w: "95px", a: "left" },
                          { l: "EXPIRY", w: "75px", a: "center" },
                          { l: "MRP", w: "75px", a: "right" },
                          { l: "BASE", w: "75px", a: "right" },
                          { l: "GST%", w: "65px", a: "center" },
                          { l: "QTY", w: "55px", a: "center" },
                          { l: "DISC%", w: "55px", a: "center" },
                          { l: "AMOUNT", w: "85px", a: "right" },
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
                              textTransform: "uppercase",
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
                      {salesItems.map((si: any, idx: number) => (
                        <tr
                          key={idx}
                          onClick={() => setActiveSalesItemIdx(idx)}
                          style={{ borderBottom: "1px solid #e9ecef", background: activeSalesItemIdx === idx ? "#f0fdf4" : "white" }}
                        >
                          {/* No */}
                          <td style={{ width: "35px", minWidth: "35px", padding: "3px 4px", textAlign: "center", fontWeight: "600", color: "#64748b", fontSize: "11px", boxSizing: "border-box" }}>
                            {idx + 1}
                          </td>

                          {/* Item Name (Compact 240px width) */}
                          <td style={{ width: "240px", minWidth: "240px", padding: "3px 4px", position: "relative", boxSizing: "border-box" }}>
                            {(() => {
                              const q = (salesItemSearch[idx] || "").toLowerCase();
                              const filtered = items.filter((i: any) => { const alreadyAdded = salesItems.some((s: any, sidx: number) => sidx !== idx && s.itemId === i.id); if (alreadyAdded) return false; return !q || (i.name || "").toLowerCase().includes(q) || (i.company || "").toLowerCase().includes(q); });
                              const hi = salesItemHighlight[idx] || 0;
                              const selectItem = (i: any) => {
                                const availBatches = batches.filter((b: any) => String(b.itemId) === String(i.id) && int(b.qty) > 0 && !isExpired(b.expiryDate));
                                const firstB = availBatches[0];
                                const bNo = firstB ? (firstB.batchNo || firstB.batch || "") : "";
                                const bExp = firstB ? (firstB.expiryDate || firstB.expiry || "") : (i.expiryDate || "");
                                const bMrp = firstB ? (num(firstB.mrp) || num(i.mrp) || num(i.price)) : (num(i.mrp) || num(i.price));
                                const bRate = firstB ? (num(firstB.sRate) || num(i.sRate) || num(firstB.mrp) || num(i.price)) : (num(i.price));
                                const bGst = num(i.gst) || 0;
                                const bBase = bGst > 0 ? (bMrp / (1 + bGst / 100)) : bMrp;

                                setSalesItems((prev: any) => {
                                  const updated = [...prev];
                                  const si2 = {
                                    ...emptySalesItem(),
                                    itemId: i.id,
                                    itemName: i.name,
                                    unit: i.unit || i.pack || "10's",
                                    batchNo: bNo,
                                    expiry: bExp,
                                    qty: "1",
                                    freeQty: "0",
                                    mrp: bMrp,
                                    rate: bRate,
                                    base: bBase > 0 ? bBase.toFixed(2) : "",
                                    gst: bGst,
                                    disc: "0",
                                    company: i.company || "",
                                    genericName: i.drugGroup || i.description || "",
                                    location: i.location || "",
                                    message: i.message || "",
                                    oldMrp: i.mrp || "",
                                    newMrp: bMrp
                                  };
                                  si2.amount = calcSalesItemAmt(si2);
                                  updated[idx] = { ...updated[idx], ...si2 };
                                  return updated;
                                });
                                setActiveSalesItemIdx(idx);
                                setSalesItemSearch((prev: any) => ({ ...prev, [idx]: undefined }));
                                setSalesItemHighlight((prev: any) => ({ ...prev, [idx]: 0 }));
                                setSalesItemDropdown(null);
                              };
                              return (<>
                                <input
                                  id={`sales-item-${idx}`}
                                  value={salesItemSearch[idx] !== undefined ? salesItemSearch[idx] : (si.itemName || "")}
                                  onChange={e => { const r = e.target.getBoundingClientRect(); setSalesDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 240) }); setSalesItemSearch({ ...salesItemSearch, [idx]: e.target.value }); setSalesItemHighlight({ ...salesItemHighlight, [idx]: 0 }); setSalesItemDropdown(idx); }}
                                  onFocus={e => { setActiveSalesItemIdx(idx); const r = e.target.getBoundingClientRect(); setSalesDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 240) }); setSalesItemSearch((prev: any) => ({ ...prev, [idx]: prev[idx] ?? "" })); setSalesItemHighlight((prev: any) => ({ ...prev, [idx]: 0 })); setSalesItemDropdown(idx); }}
                                  onBlur={() => setTimeout(() => setSalesItemDropdown(null), 200)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") {
                                      e.preventDefault(); e.stopPropagation();
                                      if (salesItemDropdown === idx && filtered.length > 0) {
                                        const item = filtered[hi]; if (item) { selectItem(item); setTimeout(() => document.getElementById(`sales-unit-${idx}`)?.focus() || document.getElementById(`sales-batch-${idx}`)?.focus(), 50); }
                                      } else {
                                        document.getElementById(`sales-unit-${idx}`)?.focus() || document.getElementById(`sales-batch-${idx}`)?.focus();
                                      }
                                    }
                                    else if (e.key === "ArrowDown" && salesItemDropdown === idx && filtered.length > 0) { e.preventDefault(); setSalesItemHighlight((prev: any) => ({ ...prev, [idx]: Math.min((prev[idx] || 0) + 1, filtered.length - 1) })) }
                                    else if (e.key === "ArrowUp" && salesItemDropdown === idx && filtered.length > 0) { e.preventDefault(); setSalesItemHighlight((prev: any) => ({ ...prev, [idx]: Math.max((prev[idx] || 0) - 1, 0) })) }
                                  }}
                                  placeholder="Search item..."
                                  style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "3px 8px", height: "26px", fontSize: "12px", fontWeight: "600" }}
                                  autoComplete="off"
                                  data-pf="skip"
                                />
                                {salesItemDropdown === idx && salesItemSearch[idx] !== undefined && (
                                  <div style={{ position: "fixed", top: salesDropdownPos.top, left: salesDropdownPos.left, zIndex: 9999, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: salesDropdownPos.width }}>
                                    {filtered.map((i: any, pos: number) => (
                                      <div key={i.id} onMouseDown={() => selectItem(i)} onMouseEnter={() => setSalesItemHighlight((prev: any) => ({ ...prev, [idx]: pos }))} style={{ padding: "7px 10px", cursor: "pointer", borderBottom: "1px solid #e9ecef", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", background: pos === hi ? "#eff6ff" : "white" }}>
                                        <span><strong>{i.name}</strong> {i.unit ? `(${i.unit})` : ""}</span>
                                        <span style={{ color: "#64748b", fontSize: "11px", marginLeft: "8px" }}>{getDivision(i.division).icon} ₹{i.price} {i.stock <= 0 ? <span style={{ color: "#ef4444", fontSize: "10px" }}>OOS</span> : ""}</span>
                                      </div>
                                    ))}
                                    {filtered.length === 0 && (
                                      <div style={{ padding: "10px", color: "#64748b", fontSize: "12px", textAlign: "center" }}>No items found</div>
                                    )}
                                  </div>
                                )}
                              </>);
                            })()}
                          </td>

                          {/* Unit / Packing */}
                          <td style={{ width: "65px", minWidth: "65px", padding: "2px", boxSizing: "border-box" }}>
                            <input
                              id={`sales-unit-${idx}`}
                              type="text"
                              value={si.unit || ""}
                              onChange={e => updateSalesItem(idx, "unit", e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`sales-batch-${idx}`)?.focus(); } }}
                              placeholder="10's"
                              style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "3px 2px", height: "26px", fontSize: "11px", textAlign: "center" }}
                            />
                          </td>

                          {/* Batch No */}
                          <td style={{ width: "95px", minWidth: "95px", padding: "2px", boxSizing: "border-box" }}>
                            <input
                              id={`sales-batch-${idx}`}
                              type="text"
                              value={si.batchNo || ""}
                              onChange={e => {
                                const v = e.target.value;
                                updateSalesItem(idx, "batchNo", v);
                                if (si.itemId) {
                                  const matchB = batches.find((b: any) => String(b.itemId) === String(si.itemId) && String(b.batchNo || b.batch).toLowerCase() === v.toLowerCase());
                                  if (matchB) {
                                    const bExp = matchB.expiryDate || matchB.expiry || "";
                                    const bMrp = num(matchB.mrp) || si.mrp;
                                    const bRate = num(matchB.sRate) || si.rate;
                                    const bGst = num(si.gst) || 0;
                                    const bBase = bGst > 0 ? (bMrp / (1 + bGst / 100)) : bMrp;
                                    setSalesItems((prev: any) => {
                                      const up = [...prev];
                                      up[idx] = { ...up[idx], batchNo: v, expiry: bExp, mrp: bMrp, rate: bRate, base: bBase > 0 ? bBase.toFixed(2) : up[idx].base };
                                      up[idx].amount = calcSalesItemAmt(up[idx]);
                                      return up;
                                    });
                                  }
                                }
                              }}
                              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`sales-expiry-${idx}`)?.focus(); } }}
                              placeholder="Batch"
                              style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "3px 4px", height: "26px", fontSize: "11px" }}
                            />
                          </td>

                          {/* Expiry Date */}
                          <td style={{ width: "75px", minWidth: "75px", padding: "2px", boxSizing: "border-box" }}>
                            <input
                              id={`sales-expiry-${idx}`}
                              type="text"
                              value={si.expiry || ""}
                              onChange={e => {
                                let v = e.target.value.replace(/[^0-9/]/g, "");
                                const prev = si.expiry || "";
                                if (v.length === 2 && !v.includes("/") && prev.length !== 3) {
                                  v = v + "/";
                                } else if (v.length === 4 && !v.includes("/")) {
                                  v = v.slice(0, 2) + "/" + v.slice(2);
                                }
                                if (v.length > 5) return;
                                updateSalesItem(idx, "expiry", v);
                              }}
                              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`sales-mrp-${idx}`)?.focus(); } }}
                              placeholder="MM/YY"
                              style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "3px 2px", height: "26px", fontSize: "11px", textAlign: "center", letterSpacing: "1px" }}
                            />
                          </td>

                          {/* MRP */}
                          <td style={{ width: "75px", minWidth: "75px", padding: "2px", boxSizing: "border-box" }}>
                            <input
                              id={`sales-mrp-${idx}`}
                              type="number"
                              value={si.mrp || ""}
                              onChange={e => updateSalesItem(idx, "mrp", e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`sales-base-${idx}`)?.focus(); } }}
                              style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "3px 4px", height: "26px", fontSize: "11px", textAlign: "right" }}
                            />
                          </td>

                          {/* Base Rate */}
                          <td style={{ width: "75px", minWidth: "75px", padding: "2px", boxSizing: "border-box" }}>
                            <input
                              id={`sales-base-${idx}`}
                              type="number"
                              value={si.base || ""}
                              onChange={e => updateSalesItem(idx, "base", e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`sales-gst-${idx}`)?.focus(); } }}
                              placeholder="Base"
                              style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "3px 4px", height: "26px", fontSize: "11px", textAlign: "right", background: "#f8fafc" }}
                            />
                          </td>

                          {/* GST % */}
                          <td style={{ width: "65px", minWidth: "65px", padding: "2px", boxSizing: "border-box" }}>
                            <select
                              id={`sales-gst-${idx}`}
                              value={si.gst || "0"}
                              onChange={e => updateSalesItem(idx, "gst", e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`sales-qty-${idx}`)?.focus(); } }}
                              style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "26px", fontSize: "11px" }}
                            >
                              {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                            </select>
                          </td>

                          {/* Qty */}
                          <td style={{ width: "55px", minWidth: "55px", padding: "2px", boxSizing: "border-box" }}>
                            <input
                              id={`sales-qty-${idx}`}
                              type="number"
                              value={si.qty || ""}
                              onChange={e => updateSalesItem(idx, "qty", e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`sales-disc-${idx}`)?.focus(); } }}
                              style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "3px 2px", height: "26px", fontSize: "11px", textAlign: "center", fontWeight: "700" }}
                            />
                          </td>

                          {/* Disc % */}
                          <td style={{ width: "55px", minWidth: "55px", padding: "2px", boxSizing: "border-box" }}>
                            <input
                              id={`sales-disc-${idx}`}
                              type="number"
                              value={si.disc || "0"}
                              onChange={e => updateSalesItem(idx, "disc", e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addSalesItem();
                                  setTimeout(() => document.getElementById(`sales-item-${idx + 1}`)?.focus(), 100);
                                }
                              }}
                              style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "3px 2px", height: "26px", fontSize: "11px", textAlign: "center" }}
                            />
                          </td>

                          {/* Amount */}
                          <td style={{ width: "85px", minWidth: "85px", padding: "3px 6px", fontWeight: "700", color: "#3b82f6", whiteSpace: "nowrap", textAlign: "right", fontSize: "12px", boxSizing: "border-box" }}>
                            ₹{fmt(si.amount || 0)}
                          </td>

                          {/* Action */}
                          <td style={{ width: "30px", minWidth: "30px", padding: "2px", textAlign: "center", boxSizing: "border-box" }}>
                            <button onClick={() => removeSalesItem(idx)} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "4px", padding: "3px 5px", cursor: "pointer" }}><X size={11} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Active Item Details Bar (Legacy Visual InfoSoft Parity Box below grid) */}
                {(() => {
                  const activeSi = salesItems[activeSalesItemIdx] || salesItems[0] || {};
                  const activeItemObj = items.find((i: any) => i.id === activeSi.itemId) || {};
                  const companyName = activeSi.company || activeItemObj.company || "—";
                  const genericName = activeSi.genericName || activeItemObj.drugGroup || activeItemObj.description || "—";
                  const location = activeSi.location || activeItemObj.location || "—";
                  const itemMsg = activeSi.message || activeItemObj.message || "—";
                  const oldMrp = activeSi.oldMrp || activeItemObj.mrp || activeSi.mrp || "—";
                  const currentMrp = activeSi.mrp || activeItemObj.price || "—";

                  return (
                    <div style={{
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      marginBottom: "8px",
                      display: "grid",
                      gridTemplateColumns: "1.2fr 1fr",
                      gap: "10px",
                      fontSize: "11px"
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <span style={{ color: "#64748b", width: "95px", fontWeight: "600" }}>Company Name :</span>
                          <span style={{ color: "#0f172a", fontWeight: "700" }}>{companyName}</span>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <span style={{ color: "#64748b", width: "95px", fontWeight: "600" }}>Drug Name :</span>
                          <span style={{ color: "#2563eb", fontWeight: "600" }}>{genericName}</span>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ color: "#64748b", width: "95px", fontWeight: "600" }}>Location :</span>
                          <span style={{
                            background: location !== "—" ? "#fef3c7" : "#f1f5f9",
                            color: location !== "—" ? "#92400e" : "#64748b",
                            padding: "1px 8px",
                            borderRadius: "4px",
                            fontWeight: "700"
                          }}>
                            📍 {location}
                          </span>
                          {itemMsg !== "—" && (
                            <span style={{ color: "#dc2626", marginLeft: "10px", fontStyle: "italic" }}>
                              ⚠️ {itemMsg}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#64748b" }}>Old / New MRP :</span>
                          <span style={{ fontWeight: "700", color: "#334155" }}>
                            Old: ₹{fmt(oldMrp)} | New: ₹{fmt(currentMrp)}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ color: "#64748b", width: "60px", fontWeight: "600" }}>Msg :</span>
                          <input
                            value={salesForm.billMsg || "HAVE A FAST RECOVERY & GOOD HEALTH"}
                            onChange={e => setSalesForm({ ...salesForm, billMsg: e.target.value.toUpperCase() })}
                            placeholder="Footer message on bill"
                            style={{ ...inp, flex: 1, padding: "2px 6px", height: "24px", fontSize: "11px", background: "white" }}
                          />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: "10px" }}>
                          <span>⏰ {new Date().toLocaleTimeString()} | User: <strong>{currentUser?.name || "SHIV"}</strong></span>
                          <span style={{ color: "#059669", fontWeight: "600" }}>● READY TO BILL</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Totals & Tax Breakdown - PDF / Visual InfoSoft style */}
                {(() => {
                  const gross = salesItems.reduce((s: number, si: any) => s + num(si.amount || 0), 0);
                  const lessDisc = gross * num(salesForm.discount) / 100;
                  const net = gross - lessDisc;
                  const sgst = salesItems.reduce((s: number, si: any) => { const b = num(si.rate || si.mrp) * int(si.qty) * (1 - num(si.disc) / 100); return s + b * num(si.gst) / 200; }, 0);
                  const cgst = sgst;
                  const totalGst = sgst + cgst;
                  const taxableBase = gross > totalGst ? (gross - totalGst) : gross;
                  const netFinal = net - num(salesForm.crNote) + num(salesForm.otherAdj) + num(salesForm.tcsValue);

                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "8px" }}>
                      {/* Left: GST Breakdown */}
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 12px", fontSize: "11px" }}>
                        <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "4px", borderBottom: "1px solid #e2e8f0", paddingBottom: "2px" }}>GST Tax Breakdown</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 14px" }}>
                          <span style={{ color: "#64748b" }}>Taxable Base:</span><span style={{ textAlign: "right" }}>₹{fmt(taxableBase)}</span>
                          <span style={{ color: "#64748b" }}>SGST:</span><span style={{ textAlign: "right" }}>₹{fmt(sgst)}</span>
                          <span style={{ color: "#64748b" }}>CGST:</span><span style={{ textAlign: "right" }}>₹{fmt(cgst)}</span>
                          <span style={{ color: "#64748b" }}>IGST:</span><span style={{ textAlign: "right" }}>₹0.00</span>
                          <span style={{ fontWeight: "700", color: "#0f172a", borderTop: "1px solid #e2e8f0", paddingTop: "2px" }}>Total Tax:</span>
                          <span style={{ textAlign: "right", fontWeight: "700", color: "#0f172a", borderTop: "1px solid #e2e8f0", paddingTop: "2px" }}>₹{fmt(totalGst)}</span>
                        </div>
                      </div>

                      {/* Right: Gross, Discount & Net Final */}
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 12px", fontSize: "11px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 14px" }}>
                          <span style={{ fontWeight: "600" }}>Gross Amount:</span><span style={{ textAlign: "right", fontWeight: "600" }}>₹{fmt(gross)}</span>
                          <span style={{ color: "#ef4444" }}>Less Disc ({salesForm.discount || 0}%):</span><span style={{ textAlign: "right", color: "#ef4444" }}>-₹{fmt(lessDisc)}</span>
                          <span style={{ color: "#495057" }}>Other +/-:</span><span style={{ textAlign: "right" }}><input type="number" value={salesForm.otherAdj || "0"} onChange={e => setSalesForm({ ...salesForm, otherAdj: e.target.value })} style={{ ...inp, width: "65px", padding: "1px 4px", fontSize: "10px", height: "20px" }} /></span>
                          <span style={{ color: "#495057" }}>Cr Note:</span><span style={{ textAlign: "right" }}><input type="number" value={salesForm.crNote || "0"} onChange={e => setSalesForm({ ...salesForm, crNote: e.target.value })} style={{ ...inp, width: "65px", padding: "1px 4px", fontSize: "10px", height: "20px" }} /></span>
                          <span style={{ fontWeight: "800", fontSize: "14px", borderTop: "1px solid var(--color-border)", paddingTop: "4px" }}>NET AMOUNT:</span>
                          <span style={{ textAlign: "right", fontWeight: "800", fontSize: "15px", color: "var(--color-primary)", borderTop: "1px solid var(--color-border)", paddingTop: "4px" }}>₹{fmt(netFinal)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Bottom Action Toolbar (Legacy Visual InfoSoft Parity: New, Pending, Save, Print, Copies, Preview, Return, Duplicate, WhatsApp, Delete) */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "10px" }}>
                  <button onClick={() => openSalesForm(false)} style={{ ...btn("#0284c7"), fontSize: "12px", fontWeight: "600" }} title="Start Fresh New Bill">
                    <Plus size={13} />New
                  </button>

                  <button
                    onClick={holdCurrentSalesBill}
                    style={{ ...btn("#f59e0b"), fontSize: "12px", fontWeight: "600" }}
                    title="Hold current bill temporarily to attend to another customer"
                  >
                    ⏸️ Pending ({pendingSalesBills.length})
                  </button>

                  <button onClick={handleSaveSales} style={{ ...btn(isReturn ? "#ef4444" : "#16a34a"), fontSize: "13px", fontWeight: "700" }}>
                    <CheckCircle size={14} />{salesForm.id ? "Update Bill" : (isReturn ? "Save Return" : "Save Bill")}
                  </button>

                  <button onClick={() => {
                    const validItems = salesItems.filter((si: any) => si.itemId && int(si.qty) > 0);
                    const grossAmount = validItems.reduce((s: number, si: any) => s + num(si.amount || 0), 0);
                    const lessDisc = grossAmount * num(salesForm.discount) / 100;
                    const netAmount = grossAmount - lessDisc;
                    const sign = isReturn ? -1 : 1;
                    const b = {
                      id: salesForm.id || "preview",
                      billNo: salesForm.billNo || (salesBills.length + 1),
                      date: salesForm.date || today(),
                      ...salesForm,
                      items: validItems.length > 0 ? validItems : salesItems,
                      grossAmount: grossAmount * sign,
                      lessDisc: lessDisc * sign,
                      netAmount: (netAmount - num(salesForm.crNote) + num(salesForm.otherAdj) + num(salesForm.tcsValue)) * sign,
                      isReturn,
                      status: "Completed",
                      printCopies
                    };
                    handlePrintSalesBill(b);
                  }} style={{ ...btn("#2563eb"), fontSize: "13px", fontWeight: "600" }}>
                    🖨️ Print Bill
                  </button>

                  {/* Print Copies Selector (1 | 2) */}
                  <button
                    type="button"
                    onClick={() => setPrintCopies(prev => prev === 1 ? 2 : 1)}
                    style={{
                      ...btn(printCopies === 2 ? "#7c3aed" : "#64748b"),
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "6px 10px"
                    }}
                    title="Toggle 1 Copy (Customer) or 2 Copies (Shop + Customer)"
                  >
                    Copies: <strong>{printCopies}</strong>
                  </button>

                  {/* Preview Modal Trigger */}
                  <button
                    onClick={() => {
                      const validItems = salesItems.filter((si: any) => si.itemId && int(si.qty) > 0);
                      const grossAmount = validItems.reduce((s: number, si: any) => s + num(si.amount || 0), 0);
                      const lessDisc = grossAmount * num(salesForm.discount) / 100;
                      const netAmount = grossAmount - lessDisc;
                      const sign = isReturn ? -1 : 1;
                      const b = {
                        id: salesForm.id || "preview",
                        billNo: salesForm.billNo || (salesBills.length + 1),
                        date: salesForm.date || today(),
                        ...salesForm,
                        items: validItems.length > 0 ? validItems : salesItems,
                        grossAmount: grossAmount * sign,
                        lessDisc: lessDisc * sign,
                        netAmount: (netAmount - num(salesForm.crNote) + num(salesForm.otherAdj) + num(salesForm.tcsValue)) * sign,
                        isReturn,
                        status: "Completed"
                      };
                      setSalesPreviewBill(b);
                      setShowSalesPreviewModal(true);
                    }}
                    style={{ ...btn("#475569"), fontSize: "12px", fontWeight: "600" }}
                  >
                    👁️ Preview
                  </button>

                  {/* Z Return Quick Toggle */}
                  <button
                    onClick={() => setIsReturn((prev: boolean) => !prev)}
                    style={{ ...btn(isReturn ? "#b91c1c" : "#64748b"), fontSize: "12px", fontWeight: "600" }}
                    title="Toggle Sales Return Mode"
                  >
                    ↩️ {isReturn ? "Exit Return" : "Z Return"}
                  </button>

                  {/* Duplicate Bill */}
                  <button
                    onClick={() => setShowDuplicateModal(true)}
                    style={{ ...btn("#0891b2"), fontSize: "12px", fontWeight: "600" }}
                    title="Clone items from a previous bill"
                  >
                    📋 Duplicate
                  </button>

                  {/* Send WhatsApp */}
                  <button onClick={() => {
                    const validItems = salesItems.filter((si: any) => si.itemId && int(si.qty) > 0);
                    const grossAmount = validItems.reduce((s: number, si: any) => s + num(si.amount || 0), 0);
                    const lessDisc = grossAmount * num(salesForm.discount) / 100;
                    const netAmount = grossAmount - lessDisc;
                    const sign = isReturn ? -1 : 1;
                    const b = {
                      id: salesForm.id || "preview",
                      billNo: salesForm.billNo || (salesBills.length + 1),
                      date: salesForm.date || today(),
                      ...salesForm,
                      items: validItems.length > 0 ? validItems : salesItems,
                      grossAmount: grossAmount * sign,
                      lessDisc: lessDisc * sign,
                      netAmount: (netAmount - num(salesForm.crNote) + num(salesForm.otherAdj) + num(salesForm.tcsValue)) * sign,
                      isReturn,
                      status: "Completed"
                    };
                    if (!b.mobile) {
                      showToast("Please enter patient mobile number for WhatsApp", "error");
                      return;
                    }
                    handleWhatsAppBill(b);
                  }} style={{ ...btn("#15803d"), fontSize: "12px", fontWeight: "600" }}>
                    💬 WhatsApp
                  </button>

                  {/* Barcode Camera Scanner */}
                  <button
                    onClick={() => { setScannerTarget("sales"); setShowCameraScanner(true); }}
                    style={{ ...btn("#0284c7"), fontSize: "12px" }}
                  >
                    📷 Scan
                  </button>

                  {/* Delete / Discard */}
                  <button
                    onClick={() => {
                      if (salesForm.id) {
                        handleDeleteSalesBill(salesForm);
                      } else {
                        showConfirm("Discard this bill?", () => {
                          setSalesForm(emptySalesForm());
                          setSalesItems([emptySalesItem()]);
                          setShowSalesForm(false);
                          showToast("Bill discarded");
                        });
                      }
                    }}
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#ef4444",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: "auto"
                    }}
                    title={salesForm.id ? "Delete this Bill" : "Discard Bill"}
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    onClick={() => openSalesForm(false)}
                    style={{ ...btn("#2563eb", "white"), fontSize: "12px", padding: "5px 14px", fontWeight: "700" }}
                    title="New Sales Bill (Alt+N)"
                  >
                    ➕ New (Alt+N)
                  </button>
                </div>
              </div>
            )}

            {/* Ensure form is always open */}
            {!showSalesForm && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <button onClick={() => openSalesForm(false)} style={{ ...btn("var(--color-primary)"), padding: "8px 16px" }}><Plus size={15} /> Open Sales Bill Form</button>
              </div>
            )}

            {/* ── MODAL: PENDING SALES BILLS QUEUE ── */}
            {showPendingModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "600px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>⏸️ Pending (Held) Sales Bills ({pendingSalesBills.length})</div>
                    <button onClick={() => setShowPendingModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
                  </div>
                  <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
                    {pendingSalesBills.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b", fontSize: "13px" }}>
                        No held bills in the pending queue.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {pendingSalesBills.map((pb: any) => (
                          <div key={pb.id} style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                            <div>
                              <div style={{ fontWeight: "700", fontSize: "13px", color: "#1e293b" }}>{pb.patientName || "Walk-in"} {pb.salesForm?.mobile ? `(${pb.salesForm.mobile})` : ""}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>Held at: {pb.heldAt} | Items: {pb.salesItems?.length || 0} | Total: ₹{fmt(pb.totalAmt || 0)}</div>
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button onClick={() => resumePendingSalesBill(pb)} style={{ ...btn("#16a34a"), padding: "4px 10px", fontSize: "12px" }}>▶️ Resume</button>
                              <button onClick={() => discardPendingSalesBill(pb.id)} style={{ ...btn("#ef4444"), padding: "4px 10px", fontSize: "12px" }}>🗑️ Discard</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", textAlign: "right", background: "#f8fafc" }}>
                    <button onClick={() => setShowPendingModal(false)} style={{ ...btn("#64748b"), padding: "6px 14px" }}>Close</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── MODAL: PREVIEW SALES INVOICE ── */}
            {showSalesPreviewModal && salesPreviewBill && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "680px", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>👁️ Invoice Preview - Bill #{salesPreviewBill.billNo}</div>
                    <button onClick={() => setShowSalesPreviewModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
                  </div>
                  <div style={{ padding: "16px", overflowY: "auto", flex: 1, fontFamily: "monospace", fontSize: "12px" }}>
                    <div style={{ textAlign: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "8px", marginBottom: "8px" }}>
                      <div style={{ fontWeight: "800", fontSize: "15px" }}>{(currentUser?.pharmacyName || "SHIV DHARA MEDICAL STORE").toUpperCase()}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>20, GIRIRAJ COMPLEX NIKOL GAAM ROAD, NIKOL, AHMEDABAD</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>DL NO: 20 GARA 588, 21 GARA 588 | PH: 9924237606</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "11px", marginBottom: "8px" }}>
                      <div><strong>Patient:</strong> {salesPreviewBill.patientName || "Walk-in"}</div>
                      <div style={{ textAlign: "right" }}><strong>Bill No:</strong> {salesPreviewBill.billSeries || "G"}-{salesPreviewBill.billNo}</div>
                      <div><strong>Doctor:</strong> {salesPreviewBill.doctorName || "—"}</div>
                      <div style={{ textAlign: "right" }}><strong>Date:</strong> {new Date(salesPreviewBill.date).toLocaleDateString("en-IN")}</div>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "10px" }}>
                      <thead>
                        <tr style={{ borderTop: "1px solid #cbd5e1", borderBottom: "1px solid #cbd5e1", background: "#f8fafc" }}>
                          <th style={{ textAlign: "left", padding: "4px" }}>Item</th>
                          <th style={{ textAlign: "center", padding: "4px" }}>Unit</th>
                          <th style={{ textAlign: "left", padding: "4px" }}>Batch</th>
                          <th style={{ textAlign: "center", padding: "4px" }}>Exp</th>
                          <th style={{ textAlign: "right", padding: "4px" }}>Qty</th>
                          <th style={{ textAlign: "right", padding: "4px" }}>MRP</th>
                          <th style={{ textAlign: "right", padding: "4px" }}>Amt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(salesPreviewBill.items || []).map((it: any, i: number) => (
                          <tr key={i} style={{ borderBottom: "1px dotted #e2e8f0" }}>
                            <td style={{ padding: "4px" }}>{it.itemName}</td>
                            <td style={{ textAlign: "center", padding: "4px" }}>{it.unit || it.pack || "10's"}</td>
                            <td style={{ padding: "4px" }}>{it.batchNo || "NA"}</td>
                            <td style={{ textAlign: "center", padding: "4px" }}>{it.expiry || it.expiryDate || "—"}</td>
                            <td style={{ textAlign: "right", padding: "4px" }}>{it.qty}</td>
                            <td style={{ textAlign: "right", padding: "4px" }}>₹{fmt(it.mrp)}</td>
                            <td style={{ textAlign: "right", padding: "4px" }}>₹{fmt(it.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "6px", display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "13px" }}>
                      <span>NET AMOUNT:</span>
                      <span style={{ color: "var(--color-primary)" }}>₹{fmt(salesPreviewBill.netAmount)}</span>
                    </div>
                    <div style={{ textAlign: "center", marginTop: "12px", color: "#64748b", fontStyle: "italic", fontSize: "11px" }}>
                      "{salesPreviewBill.billMsg || "HAVE A FAST RECOVERY & GOOD HEALTH"}"
                    </div>
                  </div>
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", background: "#f8fafc" }}>
                    <button onClick={() => { setShowSalesPreviewModal(false); handlePrintSalesBill(salesPreviewBill); }} style={{ ...btn("#2563eb"), padding: "6px 16px" }}>🖨️ Print Now</button>
                    <button onClick={() => setShowSalesPreviewModal(false)} style={{ ...btn("#64748b"), padding: "6px 16px" }}>Close</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── MODAL: DUPLICATE SALES BILL ── */}
            {showDuplicateModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "600px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>📋 Duplicate Previous Sales Bill</div>
                    <button onClick={() => setShowDuplicateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
                  </div>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
                    <input
                      placeholder="Search bill# or patient to clone..."
                      value={dupSearch}
                      onChange={e => setDupSearch(e.target.value)}
                      style={{ ...inp, width: "100%" }}
                    />
                  </div>
                  <div style={{ padding: "12px 16px", overflowY: "auto", flex: 1 }}>
                    {(() => {
                      const q = dupSearch.toLowerCase();
                      const list = salesBills.filter((b: any) => !q || String(b.billNo).includes(q) || (b.patientName || "").toLowerCase().includes(q) || (b.mobile || "").includes(q)).slice(0, 20);
                      if (!list.length) {
                        return <div style={{ textAlign: "center", padding: "20px 0", color: "#64748b", fontSize: "13px" }}>No matching bills found.</div>;
                      }
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {list.map((b: any) => (
                            <div key={b.id} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                              <div>
                                <div style={{ fontWeight: "700", fontSize: "12px", color: "#1e293b" }}>Bill #{b.billNo} - {b.patientName || "Walk-in"}</div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>Date: {new Date(b.date).toLocaleDateString("en-IN")} | Net: ₹{fmt(Math.abs(num(b.netAmount)))} | Items: {b.items?.length || 0}</div>
                              </div>
                              <button onClick={() => duplicateSalesBill(b)} style={{ ...btn("#0891b2"), padding: "4px 10px", fontSize: "11px" }}>Clone Items</button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", textAlign: "right", background: "#f8fafc" }}>
                    <button onClick={() => setShowDuplicateModal(false)} style={{ ...btn("#64748b"), padding: "6px 14px" }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── DRAWER / MODAL: BROWSE ALL SALES BILLS ── */}
            {salesBillListDrawer && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "720px", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>📋 Recent Sales Bills ({salesBills.length})</div>
                    <button onClick={() => setSalesBillListDrawer(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
                  </div>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
                    <input
                      placeholder="Filter by bill#, patient name, or mobile..."
                      value={listDrawerSearch}
                      onChange={e => setListDrawerSearch(e.target.value)}
                      style={{ ...inp, width: "100%" }}
                    />
                  </div>
                  <div style={{ padding: "12px 16px", overflowY: "auto", flex: 1 }}>
                    {(() => {
                      const q = listDrawerSearch.toLowerCase();
                      const list = salesBills.filter((b: any) => !q || String(b.billNo).includes(q) || (b.patientName || "").toLowerCase().includes(q) || (b.mobile || "").includes(q)).slice(0, 30);
                      if (!list.length) {
                        return <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b", fontSize: "13px" }}>No bills found.</div>;
                      }
                      return (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                          <thead>
                            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                              <th style={{ padding: "6px" }}>Bill#</th>
                              <th style={{ padding: "6px" }}>Date</th>
                              <th style={{ padding: "6px" }}>Patient</th>
                              <th style={{ padding: "6px" }}>Mode</th>
                              <th style={{ padding: "6px", textAlign: "right" }}>Net Amt</th>
                              <th style={{ padding: "6px", textAlign: "center" }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {list.map((b: any) => (
                              <tr key={b.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                <td style={{ padding: "6px", fontWeight: "700" }}>#{b.billNo}</td>
                                <td style={{ padding: "6px", color: "#64748b" }}>{new Date(b.date).toLocaleDateString("en-IN")}</td>
                                <td style={{ padding: "6px" }}>{b.patientName || "Walk-in"}</td>
                                <td style={{ padding: "6px", textTransform: "capitalize" }}>{b.paymentMode || "cash"}</td>
                                <td style={{ padding: "6px", textAlign: "right", fontWeight: "700", color: b.isReturn ? "#ef4444" : "#16a34a" }}>
                                  ₹{fmt(Math.abs(num(b.netAmount)))}
                                </td>
                                <td style={{ padding: "6px", textAlign: "center" }}>
                                  <button
                                    onClick={() => { openSalesForm(b.isReturn, b); setSalesBillListDrawer(false); }}
                                    style={{ ...btn("#2563eb"), padding: "2px 8px", fontSize: "11px" }}
                                  >
                                    Open
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", textAlign: "right", background: "#f8fafc" }}>
                    <button onClick={() => setSalesBillListDrawer(false)} style={{ ...btn("#64748b"), padding: "6px 14px" }}>Close</button>
                  </div>
                </div>
              </div>
            )}

          </>
  );
}
