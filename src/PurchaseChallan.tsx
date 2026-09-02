import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, CheckCircle, ChevronUp, ChevronDown } from "lucide-react";
import { useMedicalStore, today, uid, num, fmt, int, inp, lbl, btn, GST_RATES } from './MedicalStoreContext';

export default function PurchaseChallan({ setScannerTarget, setShowCameraScanner }) {
  const { 
    purchaseChallans, savePurchaseChallans, 
    purchaseChallanForm, setPurchaseChallanForm, 
    purchaseChallanItems, setPurchaseChallanItems,
    suppliers, items
  } = useMedicalStore();

  const [itemSearch, setItemSearch] = useState({});
  const [itemHighlight, setItemHighlight] = useState({});
  const [itemDropdown, setItemDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [challanSearch, setChallanSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedChallan, setExpandedChallan] = useState(null);

  const emptyItem = () => ({ itemId: "", itemName: "", batchNo: "", expiryDate: "", qty: "1", freeQty: "0", ptr: "", mrp: "", gst: "5", disc: "0", cess: "0", amount: 0 });

  const calcAmount = (pi) => {
    const qty = int(pi.qty);
    const ptr = num(pi.ptr);
    const disc = num(pi.disc);
    const gst = num(pi.gst);
    const base = qty * ptr;
    const afterDisc = base * (1 - disc / 100);
    const tax = afterDisc * (gst / 100);
    return afterDisc + tax;
  };

  const addItem = () => setPurchaseChallanItems([...purchaseChallanItems, emptyItem()]);
  const removeItem = (idx) => {
    const n = [...purchaseChallanItems];
    n.splice(idx, 1);
    setPurchaseChallanItems(n.length === 0 ? [emptyItem()] : n);
  };
  
  const updateItem = (idx, field, val) => {
    const n = [...purchaseChallanItems];
    n[idx] = { ...n[idx], [field]: val };
    
    // Auto-fill details if an item is selected from dropdown
    if (field === "itemId" && val) {
      const found = items.find(i => i.id === val);
      if (found) {
        n[idx] = { 
          ...n[idx], 
          itemName: found.name, 
          mrp: found.mrp || found.price, 
          ptr: found.pRate || "", 
          gst: found.gst || 5 
        };
      }
    }
    
    if (["qty", "ptr", "disc", "gst", "freeQty"].includes(field) || field === "itemId") {
      n[idx].amount = calcAmount(n[idx]);
    }
    setPurchaseChallanItems(n);
  };

  const openForm = () => {
    const nextEntry = (purchaseChallans.length > 0 ? Math.max(...purchaseChallans.map(b => parseInt(b.entryNo) || 0)) : 0) + 1;
    setPurchaseChallanForm({ entryNo: String(nextEntry), challanDate: today(), entryDate: today(), taxType: "exclusive", paymentMode: "cash", taxZone: "sgst_ugst" });
    setPurchaseChallanItems([emptyItem()]);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!purchaseChallanForm.partyName) { alert("Party name is required"); return; }
    const validItems = purchaseChallanItems.filter(pi => (pi.itemId || pi.itemName) && int(pi.qty) > 0);
    if (!validItems.length) { alert("Please add at least 1 item with Qty > 0"); return; }
    
    const subtotal = validItems.reduce((s, pi) => s + num(pi.ptr) * int(pi.qty), 0);
    const totalGst = validItems.reduce((s, pi) => s + (num(pi.ptr) * int(pi.qty) - num(pi.ptr) * int(pi.qty) * num(pi.disc) / 100) * num(pi.gst) / 100, 0);
    const totalDisc = validItems.reduce((s, pi) => s + num(pi.ptr) * int(pi.qty) * num(pi.disc) / 100, 0);
    const total = validItems.reduce((s, pi) => s + calcAmount(pi), 0);
    
    const chln = { 
      id: uid(), 
      entryNo: purchaseChallanForm.entryNo || (purchaseChallans.length + 1), 
      ...purchaseChallanForm, 
      items: validItems, 
      subtotal, totalGst, totalDisc, total, 
      createdAt: new Date().toISOString(),
      status: "Pending"
    };

    // Pass the new challan as second arg so it gets saved to MySQL DB too
    await savePurchaseChallans([...purchaseChallans, chln], chln);
    setShowForm(false);
  };

  const challanSaveRef = useRef({ showForm, handleSave });
  challanSaveRef.current = { showForm, handleSave };

  useEffect(() => {
    const handleCtrlS = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (challanSaveRef.current.showForm) {
          e.preventDefault();
          e.stopPropagation();
          challanSaveRef.current.handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleCtrlS, true);
    return () => window.removeEventListener("keydown", handleCtrlS, true);
  }, []);

  const focusNext = (e, idx, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const fields = ["item", "batchNo", "expiryDate", "qty", "freeQty", "mrp", "ptr", "gst", "disc"];
      const fIdx = fields.indexOf(field);
      if (fIdx >= 0 && fIdx < fields.length - 1) {
        const next = document.querySelector(`[data-pcf="${idx}-${fields[fIdx + 1]}"]`) as HTMLElement;
        if (next) { next.focus(); (next as any).select && (next as any).select(); }
      } else {
        if (idx === purchaseChallanItems.length - 1) {
          addItem();
          setTimeout(() => {
            const el = document.querySelector(`[data-pcf="${idx + 1}-item"]`) as HTMLElement;
            if (el) el.focus();
          }, 50);
        } else {
          const el = document.querySelector(`[data-pcf="${idx + 1}-item"]`) as HTMLElement;
          if (el) el.focus();
        }
      }
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>📦 Purchase Challans ({purchaseChallans.length})</h2>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
          <input
            placeholder="Search Challan# / Party / Entry..."
            value={challanSearch || ""}
            onChange={e => setChallanSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                const q = (challanSearch || "").toLowerCase().trim();
                if (q) {
                  const match = purchaseChallans.find(c => 
                    (c.challanNo || "").toLowerCase().includes(q) || 
                    (c.partyName || "").toLowerCase().includes(q) || 
                    (c.entryNo || "").toString().includes(q)
                  );
                  if (match) {
                    setPurchaseChallanForm(match);
                    setPurchaseChallanItems(match.items || [emptyItem()]);
                    setShowForm(true);
                  }
                }
              }
            }}
            style={{ ...inp, width: "280px", paddingLeft: "30px", borderRadius: "20px", background: "#f8fafc" }}
          />
        </div>
        <button onClick={openForm} style={{ ...btn() }}><Plus size={14} />New Challan</button>
      </div>

      {showForm && (
        <div style={{ background: "white", borderRadius: "12px", padding: "24px", marginBottom: "20px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>📦 New Purchase Challan Entry</h3>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: "10px", marginBottom: "16px", background: "#f8fafc", borderRadius: "12px", padding: "20px", border: "1px solid var(--color-border)" }}>
            <div>
              <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Entry No</label>
              <input value={purchaseChallanForm.entryNo || ""} readOnly style={{ ...inp, background: "#ecfdf5", color: "var(--color-primary)", fontWeight: "700", cursor: "default", border: "none" }} />
            </div>
            <div>
              <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Party Name *</label>
              <input list="supp-list-chln" value={purchaseChallanForm.partyName || ""} onChange={e => { const s = suppliers.find(x => x.name === e.target.value); setPurchaseChallanForm({ ...purchaseChallanForm, partyName: e.target.value, supplierId: s?.id || "" }); }} placeholder="Party / Supplier name" style={inp} />
              <datalist id="supp-list-chln">{suppliers.map(s => <option key={s.id} value={s.name} />)}</datalist>
            </div>
            <div><label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Challan No</label><input value={purchaseChallanForm.challanNo || ""} onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, challanNo: e.target.value })} placeholder="Challan No" style={inp} /></div>
            <div><label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Challan Date</label><input type="date" value={purchaseChallanForm.challanDate || today()} onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, challanDate: e.target.value })} style={inp} /></div>
            <div><label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Entry Date</label><input type="date" value={purchaseChallanForm.entryDate || today()} onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, entryDate: e.target.value })} style={inp} /></div>
            <div><label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Tax Type</label><select value={purchaseChallanForm.taxType || "exclusive"} onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, taxType: e.target.value })} style={inp}><option value="exclusive">Exclusive (Tax Alag)</option><option value="inclusive">Inclusive (Tax Sathe)</option></select></div>
            <div><label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Payment Mode</label><select value={purchaseChallanForm.paymentMode || "cash"} onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, paymentMode: e.target.value })} style={inp}><option value="cash">Cash</option><option value="credit">Credit</option><option value="cheque">Cheque</option><option value="neft">NEFT/UPI</option></select></div>
            <div><label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Tax Zone</label><select value={purchaseChallanForm.taxZone || "sgst_ugst"} onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, taxZone: e.target.value })} style={inp}><option value="sgst_ugst">RD Within State - SGST/UGST</option><option value="igst">RD Outside State - IGST</option><option value="exempt">Tax Exempt</option></select></div>
            <div><label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Details / Mobile</label><input value={purchaseChallanForm.details || ""} onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, details: e.target.value })} placeholder="Mobile/Message" style={inp} /></div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", paddingTop: "18px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                <input type="checkbox" checked={!!purchaseChallanForm.gstInclusive} onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, gstInclusive: e.target.checked })} style={{ width: "14px", height: "14px" }} />
                GST Inclusive
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                <input type="checkbox" checked={!!purchaseChallanForm.gstOnFree} onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, gstOnFree: e.target.checked })} style={{ width: "14px", height: "14px" }} />
                GST on Free
              </label>
            </div>
          </div>

          <div style={{ overflowX: "auto", marginBottom: "14px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "900px" }}>
              <thead><tr style={{ background: "#f1f5f9" }}>
                {["Sr", "Item *", "Batch No", "Exp Dt", "Qty", "Free", "MRP", "PTR", "GST%", "Disc%", "Disc Amt", "BASE", "Amount", ""].map(h => (
                  <th key={h} style={{ padding: "7px 8px", textAlign: ["Disc Amt", "BASE", "Amount"].includes(h) ? "right" : h === "Sr" ? "center" : "left", fontWeight: "600", color: "var(--color-text-dark)", fontSize: "12px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {purchaseChallanItems.map((pi, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e9ecef" }}>
                    <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: "600", color: "#64748b", fontSize: "12px", whiteSpace: "nowrap" }}>{idx + 1}</td>
                    <td style={{ padding: "4px", position: "relative", minWidth: "160px" }}>
                      {(() => {
                        const q = (itemSearch[idx] || "").toLowerCase();
                        const filtered = items.filter(i => { return !q || (i.name || "").toLowerCase().includes(q) || (i.company || "").toLowerCase().includes(q); });
                        const hi = itemHighlight[idx] || 0;
                        const selectItem = (i) => {
                          updateItem(idx, "itemId", i.id);
                          setItemSearch(prev => ({ ...prev, [idx]: undefined }));
                          setItemHighlight(prev => ({ ...prev, [idx]: 0 }));
                          setItemDropdown(null);
                          setTimeout(() => {
                            const nextEl = document.querySelector(`[data-pcf="${idx}-batchNo"]`) as HTMLElement;
                            if (nextEl) { nextEl.focus(); (nextEl as any).select && (nextEl as any).select(); }
                          }, 50);
                        };
                        return (<>
                          <input
                            value={itemSearch[idx] !== undefined ? itemSearch[idx] : (pi.itemName || "")}
                            onChange={e => { const r = e.target.getBoundingClientRect(); setDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 220) }); setItemSearch({ ...itemSearch, [idx]: e.target.value }); setItemHighlight({ ...itemHighlight, [idx]: 0 }); setItemDropdown(idx); updateItem(idx, "itemName", e.target.value); }}
                            onFocus={e => { const r = e.target.getBoundingClientRect(); setDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 220) }); setItemSearch(prev => ({ ...prev, [idx]: prev[idx] ?? (pi.itemName || "") })); setItemHighlight(prev => ({ ...prev, [idx]: 0 })); setItemDropdown(idx); }}
                            onBlur={() => setTimeout(() => setItemDropdown(null), 200)}
                            placeholder="Search item..."
                            style={{ ...inp, minWidth: "150px", padding: "6px 8px" }}
                            autoComplete="off"
                            data-pcf={`${idx}-item`}
                            onKeyDown={e => {
                              if (itemDropdown === idx && filtered.length > 0) {
                                if (e.key === "ArrowDown") { e.preventDefault(); setItemHighlight(prev => ({ ...prev, [idx]: Math.min((prev[idx] || 0) + 1, filtered.length - 1) })); return; }
                                if (e.key === "ArrowUp") { e.preventDefault(); setItemHighlight(prev => ({ ...prev, [idx]: Math.max((prev[idx] || 0) - 1, 0) })); return; }
                                if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); const item = filtered[hi]; if (item) { selectItem(item); } return; }
                              }
                              if (e.key === "Enter" && itemDropdown !== idx) { focusNext(e, idx, "item"); }
                            }}
                          />
                          {itemDropdown === idx && (itemSearch[idx] || "").length >= 0 && (
                            <div style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999, background: "white", border: "1px solid #dee2e6", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: dropdownPos.width }}>
                              {filtered.map((i, pos) => (
                                <div key={i.id} onMouseDown={() => selectItem(i)} onMouseEnter={() => setItemHighlight(prev => ({ ...prev, [idx]: pos }))} style={{ padding: "7px 10px", cursor: "pointer", borderBottom: "1px solid #e9ecef", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", background: pos === hi ? "#eff6ff" : "white" }}>
                                  <span><strong>{i.name}</strong></span>
                                  <span style={{ color: "#64748b", fontSize: "11px", marginLeft: "8px" }}>₹{i.price}</span>
                                </div>
                              ))}
                              {filtered.length === 0 && (
                                <div style={{ padding: "10px", color: "#94a3b8", fontSize: "12px", textAlign: "center" }}>No items found</div>
                              )}
                            </div>
                          )}
                        </>);
                      })()}
                    </td>
                    {[{ f: "batchNo", ph: "Batch", w: "80px" }, { f: "expiryDate", t: "text", ph: "MM/YY", w: "75px" }, { f: "qty", t: "number", ph: "Qty", w: "60px" }, { f: "freeQty", t: "number", ph: "Free", w: "55px" }, { f: "mrp", t: "number", ph: "MRP", w: "70px" }, { f: "ptr", t: "number", ph: "PTR", w: "70px" }].map(f => (
                      <td key={f.f} style={{ padding: "4px" }}><input type={f.t || "text"} value={pi[f.f] || ""} onChange={e => { let v = e.target.value; if (f.f === "expiryDate") { v = v.replace(/[^0-9/]/g, ""); if (v.length === 2 && !v.includes("/") && pi[f.f]?.length !== 3) v = v + "/"; if (v.length > 5) return; } updateItem(idx, f.f, v); }} onKeyDown={e => focusNext(e, idx, f.f)} placeholder={f.ph} data-pcf={`${idx}-${f.f}`} style={{ ...inp, width: f.w, padding: "6px 7px", letterSpacing: f.f === "expiryDate" ? "1px" : "normal" }} /></td>
                    ))}
                    <td style={{ padding: "4px" }}>
                      <select value={pi.gst || "5"} onChange={e => updateItem(idx, "gst", e.target.value)} onKeyDown={e => focusNext(e, idx, "gst")} data-pcf={`${idx}-gst`} style={{ ...inp, width: "65px", padding: "6px 5px" }}>
                        {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "4px" }}><input type="number" value={pi.disc || "0"} onChange={e => updateItem(idx, "disc", e.target.value)} onKeyDown={e => focusNext(e, idx, "disc")} data-pcf={`${idx}-disc`} style={{ ...inp, width: "55px", padding: "6px 7px" }} /></td>
                    <td style={{ padding: "6px 8px", fontWeight: "700", color: "#ef4444", whiteSpace: "nowrap", textAlign: "right" }}>₹{fmt(num(pi.ptr) * int(pi.qty) * num(pi.disc) / 100)}</td>
                    <td style={{ padding: "6px 8px", fontWeight: "700", color: "#0891b2", whiteSpace: "nowrap", textAlign: "right" }}>₹{fmt(num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100))}</td>
                    <td style={{ padding: "4px 8px", fontWeight: "700", color: "#3b82f6", whiteSpace: "nowrap", textAlign: "right" }}>₹{fmt(pi.amount || 0)}</td>
                    <td style={{ padding: "4px" }}><button onClick={() => removeItem(idx)} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "5px", padding: "5px 8px", cursor: "pointer" }}><X size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid var(--color-border)", background: "#f8fafc" }}>
                  <td colSpan={10} style={{ padding: "10px 8px", fontWeight: "700", textAlign: "right", fontSize: "12px", color: "#64748b" }}>TOTALS →</td>
                  <td style={{ padding: "10px 8px", fontWeight: "800", textAlign: "right", fontSize: "13px", color: "#ef4444", whiteSpace: "nowrap" }}>₹{fmt(purchaseChallanItems.reduce((s, pi) => s + num(pi.ptr) * int(pi.qty) * num(pi.disc) / 100, 0))}</td>
                  <td style={{ padding: "10px 8px", fontWeight: "800", textAlign: "right", fontSize: "13px", color: "#0891b2", whiteSpace: "nowrap" }}>₹{fmt(purchaseChallanItems.reduce((s, pi) => s + num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100), 0))}</td>
                  <td style={{ padding: "10px 8px", fontWeight: "800", textAlign: "right", fontSize: "14px", color: "#16a34a", whiteSpace: "nowrap" }}>₹{fmt(purchaseChallanItems.reduce((s, pi) => s + num(pi.amount || 0), 0))}</td>
                  <td></td>
                </tr>
                <tr style={{ background: "#f8fafc" }}>
                  <td colSpan={14}>
                    <div style={{ display: "flex", justifyContent: "flex-end", color: "#1d4ed8", fontWeight: "600", fontSize: "11px", padding: "4px 8px" }}>
                      GST SUMMARY → 
                      <span style={{ marginLeft: "15px" }}>SGST: ₹{fmt(purchaseChallanItems.reduce((s, pi) => s + (num(pi.amount) - num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100)) / 2, 0))}</span>
                      <span style={{ marginLeft: "15px" }}>CGST: ₹{fmt(purchaseChallanItems.reduce((s, pi) => s + (num(pi.amount) - num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100)) / 2, 0))}</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={() => { setScannerTarget("purchase_challan"); setShowCameraScanner(true); }}
                style={{ ...btn("var(--color-primary)"), fontSize: "12px" }}>📸 Scan — Challan</button>
              <button onClick={handleSave} style={{ ...btn("var(--color-primary)") }}><CheckCircle size={14} />Save Challan</button>
              <button onClick={() => setShowForm(false)} style={{ ...btn("#64748b") }}><X size={13} />Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* List of saved challans - ONLY show when search text is entered AND form is closed */}
      {!showForm && (challanSearch || "").trim() && (
        <div style={{ marginTop: "12px" }}>
          {purchaseChallans.filter(c => (c.challanNo || "").toLowerCase().includes(challanSearch.toLowerCase().trim()) || (c.partyName || "").toLowerCase().includes(challanSearch.toLowerCase().trim()) || (c.entryNo || "").toString().includes(challanSearch.toLowerCase().trim())).map(c => (
            <div key={c.id} style={{ background: "white", borderRadius: "12px", marginBottom: "12px", border: "1px solid var(--color-border)", overflow: "hidden", boxShadow: "var(--shadow-sm)", transition: "all 0.2s" }}>
              <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpandedChallan(expandedChallan === c.id ? null : c.id)}>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "13px" }}>Entry #{c.entryNo} — {c.partyName}</div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Challan: {c.challanNo || "N/A"} • {c.challanDate} • {c.items?.length || 0} items</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "800", fontSize: "14px" }}>₹{fmt(c.total)}</div>
                    <span style={{ background: "#fef9c3", color: "#854d0e", padding: "2px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "600" }}>{c.status}</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setPurchaseChallanForm(c); setPurchaseChallanItems(c.items || [emptyItem()]); setShowForm(true); }} style={{ background: "#e0f2fe", border: "1px solid #bae6fd", color: "#0284c7", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", fontSize: "12px" }} title="Edit Challan">✏️ Edit</button>
                  {expandedChallan === c.id ? <ChevronUp size={15} color="#64748b" /> : <ChevronDown size={15} color="#64748b" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
