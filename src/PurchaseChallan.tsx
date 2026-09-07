// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, CheckCircle, Printer, Trash2, Truck, FileText, ArrowRight, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { useMedicalStore, today, uid, num, fmt, int, inp, lbl, btn, GST_RATES } from './MedicalStoreContext';

const matchesDate = (dateVal: any, query: string) => {
  if (!dateVal || !query) return false;
  const qClean = query.trim().toLowerCase().replace(/[\/\.]/g, "-");
  const dStr = String(dateVal).toLowerCase();
  if (dStr.includes(qClean)) return true;
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const d1 = `${yyyy}-${mm}-${dd}`;
      const d2 = `${dd}-${mm}-${yyyy}`;
      return d1.includes(qClean) || d2.includes(qClean);
    }
  } catch (_) {}
  return false;
};

export default function PurchaseChallan({ setScannerTarget, setShowCameraScanner, openListOnMount, onDrawerClosed }: any) {
  const { 
    purchaseChallans, savePurchaseChallans, 
    purchaseChallanForm, setPurchaseChallanForm, 
    purchaseChallanItems, setPurchaseChallanItems,
    suppliers, items, showToast, showConfirm, openPurchaseForm, setActiveSection,
    isDateLocked, currentUser
  } = useMedicalStore();

  const [activeItemIdx, setActiveItemIdx] = useState(0);
  const [challanSearch, setChallanSearch] = useState("");
  const [challanSearchDropdown, setChallanSearchDropdown] = useState(false);
  const [challanSearchHighlight, setChallanSearchHighlight] = useState(0);

  const [itemSearch, setItemSearch] = useState<any>({});
  const [itemHighlight, setItemHighlight] = useState<any>({});
  const [itemDropdown, setItemDropdown] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 240 });

  const [showForm, setShowForm] = useState(true);
  const [challanListDrawer, setChallanListDrawer] = useState(!!openListOnMount);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewChallan, setPreviewChallan] = useState<any>(null);

  useEffect(() => {
    if (openListOnMount) {
      setChallanListDrawer(true);
    }
  }, [openListOnMount]);

  const closeDrawer = () => {
    setChallanListDrawer(false);
    if (onDrawerClosed) onDrawerClosed();
  };

  // Held (Pending) Challans Queue
  const [pendingChallans, setPendingChallans] = useState<any[]>(() => {
    try {
      const s = localStorage.getItem("store_pending_purchase_challans");
      return s ? JSON.parse(s) : [];
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("store_pending_purchase_challans", JSON.stringify(pendingChallans));
    } catch (_) {}
  }, [pendingChallans]);

  const emptyItem = () => ({
    itemId: "",
    itemName: "",
    unit: "",
    batchNo: "",
    expiryDate: "",
    mrp: "",
    qty: "1",
    freeQty: "0",
    ptr: "",
    disc: "0",
    discAmt: 0,
    base: 0,
    gst: "5",
    amount: 0,
    lastPurchaseRate: "",
    location: ""
  });

  const emptyForm = () => {
    const nextEntry = (purchaseChallans.length > 0 ? Math.max(...purchaseChallans.map((b: any) => parseInt(b.entryNo) || 0)) : 0) + 1;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return {
      entryNo: String(nextEntry),
      billSeries: "G",
      entryDate: today(),
      entryTime: nowTime,
      challanDate: today(),
      challanNo: "",
      partyName: "",
      supplierId: "",
      detail: "",
      taxType: "exclusive",
      taxZone: "sgst_ugst",
      gstOnFree: false,
      newMrp: false,
      isOrder: true,
      paymentMode: "cash",
      cashDisc: "0",
      otherAdj: "0",
      billMsg: "",
      status: "Pending"
    };
  };

  const calcRow = (item: any) => {
    const ptr = num(item.ptr);
    const qty = int(item.qty);
    const disc = num(item.disc);
    const gst = num(item.gst);
    const base = ptr * qty;
    const discAmt = base * (disc / 100);
    const taxable = base - discAmt;
    const tax = taxable * (gst / 100);
    const amount = taxable + tax;
    return { ...item, discAmt, base: taxable, amount };
  };

  const openForm = (chln: any = null) => {
    if (chln) {
      setPurchaseChallanForm({
        ...emptyForm(),
        ...chln,
        entryNo: String(chln.entryNo || (purchaseChallans.length + 1)),
        billSeries: chln.billSeries || "G",
        entryDate: chln.entryDate || chln.challanDate || today(),
        challanDate: chln.challanDate || chln.entryDate || today(),
        partyName: chln.partyName || "",
        supplierId: chln.supplierId || "",
        isEdit: true
      });
      const bItems = (chln.items || []).filter((i: any) => i.itemId || i.itemName);
      setPurchaseChallanItems(bItems.length > 0 ? bItems.map((i: any) => {
        const found = items.find((it: any) => it.id === i.itemId || it.name === i.itemName);
        return calcRow({
          ...emptyItem(),
          ...i,
          unit: i.unit || found?.unit || "",
          mrp: i.mrp || found?.mrp || found?.price || "",
          ptr: i.ptr || i.rate || found?.pRate || "",
          gst: i.gst || found?.gst || 5,
          location: i.location || found?.location || found?.rack || "",
          lastPurchaseRate: found?.lastPurchaseRate || found?.pRate || ""
        });
      }) : [emptyItem()]);
    } else {
      setPurchaseChallanForm(emptyForm());
      setPurchaseChallanItems([emptyItem()]);
    }
    setActiveItemIdx(0);
    setShowForm(true);
  };

  const addItem = () => {
    setPurchaseChallanItems((prev: any) => [...prev, emptyItem()]);
    setActiveItemIdx(purchaseChallanItems.length);
  };

  const removeItem = (idx: number) => {
    setPurchaseChallanItems((prev: any) => {
      const n = prev.filter((_: any, i: number) => i !== idx);
      return n.length === 0 ? [emptyItem()] : n;
    });
    setActiveItemIdx(Math.max(0, idx - 1));
  };

  const updateItem = (idx: number, field: string, val: any) => {
    setPurchaseChallanItems((prev: any) => {
      const n = [...prev];
      n[idx] = { ...n[idx], [field]: val };

      if (field === "itemId" && val) {
        const found = items.find((i: any) => i.id === val);
        if (found) {
          n[idx] = {
            ...n[idx],
            itemName: found.name,
            unit: found.unit || n[idx].unit || "",
            mrp: found.mrp || found.price || "",
            ptr: found.pRate || "",
            gst: found.gst || 5,
            location: found.location || found.rack || "",
            lastPurchaseRate: found.lastPurchaseRate || found.pRate || ""
          };
        }
      }

      n[idx] = calcRow(n[idx]);
      return n;
    });
  };

  const handleSave = async () => {
    const party = purchaseChallanForm.partyName;
    if (!party) { showToast("Party / Supplier name is required", "error"); return; }
    
    // Supervisor lock check
    const lockCheck = isDateLocked("purchase", purchaseChallanForm.challanDate || purchaseChallanForm.entryDate || today());
    if (lockCheck.isLocked) {
      showToast(`🔒 Cannot save! ${lockCheck.label} is locked from ${lockCheck.from} to ${lockCheck.to} by Supervisor.`, "error");
      return;
    }

    const validItems = purchaseChallanItems.filter((pi: any) => (pi.itemId || pi.itemName) && int(pi.qty) > 0);
    if (!validItems.length) { showToast("Please add at least 1 item with Qty > 0", "error"); return; }

    const baseTotal = validItems.reduce((s: any, pi: any) => s + (pi.base || 0), 0);
    const discTotal = validItems.reduce((s: any, pi: any) => s + (pi.discAmt || 0), 0);
    const gstTotal = validItems.reduce((s: any, pi: any) => s + (pi.base || 0) * (num(pi.gst) / 100), 0);
    const grossTotal = validItems.reduce((s: any, pi: any) => s + (pi.amount || 0), 0);
    const netTotal = grossTotal - num(purchaseChallanForm.cashDisc) + num(purchaseChallanForm.otherAdj);

    const chln = {
      id: purchaseChallanForm.id || uid(),
      entryNo: purchaseChallanForm.entryNo || (purchaseChallans.length + 1),
      billSeries: purchaseChallanForm.billSeries || "G",
      ...purchaseChallanForm,
      items: validItems,
      subtotal: baseTotal,
      totalDisc: discTotal,
      totalGst: gstTotal,
      grossTotal,
      netTotal,
      total: netTotal,
      createdAt: purchaseChallanForm.createdAt || new Date().toISOString(),
      status: purchaseChallanForm.status || "Pending"
    };

    const existingIdx = purchaseChallans.findIndex((c: any) => c.id === chln.id);
    const updated = existingIdx >= 0 
      ? purchaseChallans.map((c: any) => c.id === chln.id ? chln : c)
      : [chln, ...purchaseChallans];

    await savePurchaseChallans(updated, chln);
    setShowForm(false);
    showToast(`✅ Purchase Challan #${chln.entryNo} saved successfully!`);
  };

  const handleDelete = (chln: any) => {
    const lockCheck = isDateLocked("purchase", chln.challanDate || chln.entryDate || today());
    if (lockCheck.isLocked) {
      showToast(`🔒 Cannot delete! ${lockCheck.label} is locked by Supervisor.`, "error");
      return;
    }
    showConfirm(`Delete Purchase Challan #${chln.entryNo || chln.challanNo}?`, async () => {
      const updated = purchaseChallans.filter((c: any) => c.id !== chln.id);
      await savePurchaseChallans(updated, null, chln.id);
      setShowForm(false);
      showToast("Purchase Challan deleted successfully");
    });
  };

  const convertToPurchaseBill = (chln: any) => {
    if (!chln) return;
    showConfirm(`Convert Challan #${chln.entryNo || chln.challanNo} to Purchase Bill?`, () => {
      // Mark as converted
      const updated = purchaseChallans.map((c: any) => c.id === chln.id ? { ...c, status: "Converted to Bill" } : c);
      savePurchaseChallans(updated);

      // Pre-fill purchase bill form
      openPurchaseForm({
        supplierId: chln.supplierId || "",
        partyName: chln.partyName || "",
        billNo: chln.challanNo || `CHLN-${chln.entryNo}`,
        billDate: chln.challanDate || today(),
        entryDate: today(),
        taxType: chln.taxType || "exclusive",
        taxZone: chln.taxZone || "sgst_ugst",
        remarks: `Converted from Challan #${chln.entryNo || chln.challanNo}`,
        billMsg: chln.billMsg || "",
        items: (chln.items || []).map((i: any) => ({
          ...i,
          ptr: i.ptr || i.rate || "",
          rate: i.ptr || i.rate || ""
        }))
      });
      setActiveSection("purchase");
      showToast(`Transferred Challan #${chln.entryNo} to Purchase Bill!`);
    });
  };

  const holdCurrentChallan = () => {
    const valid = purchaseChallanItems.filter((pi: any) => pi.itemId || pi.itemName);
    if (!valid.length) { showToast("Add at least 1 item to hold challan", "error"); return; }
    const totalAmt = purchaseChallanItems.reduce((s: any, pi: any) => s + (pi.amount || 0), 0);
    const held = {
      id: uid(),
      heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      partyName: purchaseChallanForm.partyName || "Supplier",
      purchaseChallanForm: { ...purchaseChallanForm },
      purchaseChallanItems: [...purchaseChallanItems],
      totalAmt
    };
    setPendingChallans((prev: any) => [held, ...prev]);
    setPurchaseChallanForm(emptyForm());
    setPurchaseChallanItems([emptyItem()]);
    showToast(`Purchase challan held in Pending Queue! (${pendingChallans.length + 1} held)`);
  };

  const resumePendingChallan = (held: any) => {
    setPurchaseChallanForm({ ...emptyForm(), ...held.purchaseChallanForm });
    setPurchaseChallanItems(held.purchaseChallanItems && held.purchaseChallanItems.length > 0 ? held.purchaseChallanItems : [emptyItem()]);
    setPendingChallans((prev: any) => prev.filter((b: any) => b.id !== held.id));
    setShowPendingModal(false);
    showToast(`Resumed challan for ${held.partyName || 'Supplier'}`);
  };

  const discardPendingChallan = (id: string) => {
    setPendingChallans((prev: any) => prev.filter((b: any) => b.id !== id));
    showToast("Pending challan discarded");
  };

  const handlePrevChallan = () => {
    if (!purchaseChallans.length) { showToast("No purchase challans found", "info"); return; }
    if (!purchaseChallanForm.id) {
      openForm(purchaseChallans[0]);
    } else {
      const idx = purchaseChallans.findIndex((b: any) => String(b.id) === String(purchaseChallanForm.id));
      if (idx < purchaseChallans.length - 1) {
        openForm(purchaseChallans[idx + 1]);
      } else {
        showToast("Already at oldest challan", "info");
      }
    }
  };

  const handleNextChallan = () => {
    if (!purchaseChallans.length) { showToast("No purchase challans found", "info"); return; }
    if (!purchaseChallanForm.id) {
      showToast("Already at new challan", "info");
      return;
    }
    const idx = purchaseChallans.findIndex((b: any) => String(b.id) === String(purchaseChallanForm.id));
    if (idx > 0) {
      openForm(purchaseChallans[idx - 1]);
    } else {
      openForm(null);
      showToast("Opened new fresh challan");
    }
  };

  const duplicateChallan = (targetChln: any) => {
    if (!targetChln) return;
    const nextEntry = (purchaseChallans.length > 0 ? Math.max(...purchaseChallans.map((b: any) => parseInt(b.entryNo) || 0)) : 0) + 1;
    setPurchaseChallanForm({
      ...emptyForm(),
      entryNo: String(nextEntry),
      billSeries: targetChln.billSeries || "G",
      partyName: targetChln.partyName || "",
      supplierId: targetChln.supplierId || "",
      challanDate: today(),
      entryDate: today(),
      taxType: targetChln.taxType || "exclusive",
      taxZone: targetChln.taxZone || "sgst_ugst",
      detail: targetChln.detail ? `Copy of ${targetChln.challanNo || targetChln.entryNo}` : "",
      billMsg: targetChln.billMsg || ""
    });
    const dupItems = (targetChln.items || []).map((pi: any) => calcRow({
      ...emptyItem(),
      ...pi,
      batchNo: "",
      expiryDate: ""
    }));
    setPurchaseChallanItems(dupItems.length > 0 ? dupItems : [emptyItem()]);
    setShowDuplicateModal(false);
    showToast(`Duplicated ${dupItems.length} items from Challan #${targetChln.challanNo || targetChln.entryNo}`);
  };

  const printVoucher = (chln: any) => {
    setPreviewChallan(chln);
    setShowPreviewModal(true);
  };

  return (
    <>
      {/* ── TOP SEARCH & ACTION BAR ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>📦 Purchase Challans ({purchaseChallans.length})</h2>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
          {(() => {
            const q = (challanSearch || "").toLowerCase();
            const filtered = q ? purchaseChallans.filter((b: any) => (String(b.entryNo) || "").toLowerCase().includes(q) || (b.challanNo || "").toLowerCase().includes(q) || (b.partyName || "").toLowerCase().includes(q) || matchesDate(b.challanDate || b.entryDate, q)).slice(0, 15) : [];
            return (
              <>
                <input
                  placeholder="Search Challan# / Party / Entry... + Enter"
                  value={challanSearch || ""}
                  onChange={e => {
                    setChallanSearch(e.target.value);
                    setChallanSearchDropdown(true);
                    setChallanSearchHighlight(0);
                  }}
                  onKeyDown={e => {
                    if (e.key === "ArrowDown") { e.preventDefault(); setChallanSearchHighlight(prev => Math.min(prev + 1, filtered.length - 1)); }
                    else if (e.key === "ArrowUp") { e.preventDefault(); setChallanSearchHighlight(prev => Math.max(prev - 1, 0)); }
                    else if (e.key === "Enter") {
                      e.preventDefault();
                      if (filtered.length > 0 && challanSearchDropdown) {
                        openForm(filtered[challanSearchHighlight]);
                        setChallanSearchDropdown(false);
                        setChallanSearch("");
                      } else if (q) {
                        const match = purchaseChallans.find((b: any) => (String(b.entryNo) || "").toLowerCase() === q || (b.challanNo || "").toLowerCase() === q || (b.partyName || "").toLowerCase() === q || matchesDate(b.challanDate || b.entryDate, q));
                        if (match) {
                          openForm(match);
                          setChallanSearchDropdown(false);
                          setChallanSearch("");
                        } else {
                          showToast("No purchase challan found matching: " + challanSearch, "error");
                        }
                      }
                    }
                  }}
                  onFocus={() => setChallanSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setChallanSearchDropdown(false), 200)}
                  style={{ ...inp, width: "320px", paddingLeft: "30px", borderRadius: "20px", background: "#f8fafc" }}
                />
                {challanSearchDropdown && filtered.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--shadow-lg)", zIndex: 50, marginTop: "4px", overflow: "hidden" }}>
                    {filtered.map((b: any, idx: number) => (
                      <div key={b.id} onClick={() => { openForm(b); setChallanSearchDropdown(false); setChallanSearch(""); }} style={{ padding: "8px 12px", cursor: "pointer", background: idx === challanSearchHighlight ? "#f1f5f9" : "white", borderBottom: "1px solid #f1f5f9" }} onMouseEnter={() => setChallanSearchHighlight(idx)}>
                        <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b" }}>Entry #{b.entryNo} — {b.partyName}</div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>Challan: {b.challanNo || "N/A"} | Amt: ₹{fmt(b.total)} | Status: {b.status || "Pending"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
        <button onClick={() => openForm()} style={{ ...btn() }}><Plus size={14} />New Challan</button>
      </div>

      {/* ══════════════════════════════════════════
          OWNER: PURCHASE CHALLAN ENTRY FORM
      ══════════════════════════════════════════ */}
      {showForm && (
        <div style={{ background: "white", borderRadius: "8px", padding: "10px 14px", marginBottom: "8px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", gap: "8px" }}>
          
          {/* ── TOP HEADER / TOOLBAR (MATCHES TRANSECTION.PDF PAGE 5) ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: "800", fontSize: "14px", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Truck size={16} /> Purchase Challan Entry
              </span>

              {/* Bill Series & Entry No */}
              <div style={{ display: "flex", alignItems: "center", background: "#f1f5f9", padding: "2px 8px", borderRadius: "6px", border: "1px solid var(--color-border)", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Entry:</span>
                <input
                  value={purchaseChallanForm.billSeries || "G"}
                  onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, billSeries: e.target.value.toUpperCase() })}
                  maxLength={3}
                  style={{ width: "24px", textAlign: "center", fontWeight: "800", background: "white", border: "1px solid #cbd5e1", borderRadius: "3px", padding: "1px", fontSize: "11px" }}
                  title="Bill Series (e.g. G, A, R)"
                />
                <input
                  value={purchaseChallanForm.entryNo || ""}
                  readOnly
                  style={{ width: "40px", textAlign: "center", fontWeight: "800", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "3px", padding: "1px", fontSize: "11px", color: "#065f46" }}
                  title="Sequential Entry Number"
                />
              </div>

              {/* Sequential Nav */}
              <div style={{ display: "flex", gap: "2px" }}>
                <button onClick={handlePrevChallan} style={{ ...btn("#f1f5f9", "#334155"), padding: "2px 7px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Previous Challan">◀ Prev</button>
                <button onClick={handleNextChallan} style={{ ...btn("#f1f5f9", "#334155"), padding: "2px 7px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Next Challan">Next ▶</button>
                <button onClick={() => setChallanListDrawer(true)} style={{ ...btn("#f1f5f9", "#334155"), padding: "2px 8px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Browse All Challans">📋 List</button>
              </div>

              {/* Time Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#64748b", background: "#f8fafc", padding: "2px 6px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                <Clock size={12} />
                <span>{purchaseChallanForm.entryTime || "11:06:52"}</span>
              </div>

              {/* Tax Mode Toggle */}
              <select
                value={purchaseChallanForm.taxType || "exclusive"}
                onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, taxType: e.target.value })}
                style={{ ...inp, width: "auto", padding: "2px 6px", height: "24px", fontSize: "11px", fontWeight: "700", background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }}
              >
                <option value="exclusive">TAX (Exclusive)</option>
                <option value="inclusive">RETAIL (Inclusive)</option>
              </select>

              {/* Tax Zone Badge */}
              <select
                value={purchaseChallanForm.taxZone || "sgst_ugst"}
                onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, taxZone: e.target.value })}
                style={{ ...inp, width: "auto", padding: "2px 6px", height: "24px", fontSize: "11px", fontWeight: "600" }}
              >
                <option value="sgst_ugst">RD (Within State - SGST/CGST)</option>
                <option value="igst">RD (Outside State - IGST)</option>
                <option value="exempt">Tax Exempt</option>
              </select>

              {/* Checkboxes: GST ON FREE, New MRP, Order */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                  <input
                    type="checkbox"
                    checked={!!purchaseChallanForm.gstOnFree}
                    onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, gstOnFree: e.target.checked })}
                    style={{ width: "13px", height: "13px" }}
                  />
                  GST ON FREE
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                  <input
                    type="checkbox"
                    checked={!!purchaseChallanForm.newMrp}
                    onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, newMrp: e.target.checked })}
                    style={{ width: "13px", height: "13px" }}
                  />
                  New MRP
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "#1d4ed8", fontWeight: "700" }}>
                  <input
                    type="checkbox"
                    checked={purchaseChallanForm.isOrder !== false}
                    onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, isOrder: e.target.checked })}
                    style={{ width: "13px", height: "13px" }}
                  />
                  Order / Challan
                </label>
              </div>
            </div>

            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={16} /></button>
          </div>

          {/* Lock Status Banner */}
          {(() => {
            const check = isDateLocked("purchase", purchaseChallanForm.challanDate || purchaseChallanForm.entryDate || today());
            if (!check.isLocked) return null;
            return (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontSize: "12px", fontWeight: "600" }}>
                <span>🔒</span>
                <span>This date ({new Date(purchaseChallanForm.challanDate || purchaseChallanForm.entryDate || today()).toLocaleDateString("en-IN")}) is <strong>LOCKED by Supervisor</strong> ({check.label}). Saving and deletion are blocked.</span>
              </div>
            );
          })()}

          {/* ── HEADER FORM FIELDS (MATCHES TRANSECTION.PDF PAGE 5) ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "6px", background: "#f8fafc", borderRadius: "6px", padding: "8px 10px", border: "1px solid var(--color-border)" }}>
            {/* Party Name */}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "700" }}>Party / Supplier Name *</label>
              <input
                list="pc-supp-list"
                value={purchaseChallanForm.partyName || ""}
                onChange={e => {
                  const s = suppliers.find((x: any) => x.name === e.target.value);
                  setPurchaseChallanForm({
                    ...purchaseChallanForm,
                    partyName: e.target.value,
                    supplierId: s?.id || "",
                    area: s?.address || purchaseChallanForm.area || "",
                    mobile: s?.mobile || purchaseChallanForm.mobile || "",
                    gstin: s?.gstin || purchaseChallanForm.gstin || "",
                    panNo: s?.panNo || purchaseChallanForm.panNo || ""
                  });
                }}
                placeholder="Select or type Supplier Name..."
                style={{ ...inp, fontWeight: "600" }}
              />
              <datalist id="pc-supp-list">
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.name}>{s.mobile ? `(${s.mobile})` : ""}</option>
                ))}
              </datalist>
            </div>

            {/* Chn No (Challan Number) */}
            <div>
              <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Chn No (Challan #)</label>
              <input
                value={purchaseChallanForm.challanNo || ""}
                onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, challanNo: e.target.value })}
                placeholder="Challan No"
                style={{ ...inp, fontWeight: "600" }}
              />
            </div>

            {/* Chn Dt (Challan Date) */}
            <div>
              <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Chn Dt</label>
              <input
                type="date"
                value={purchaseChallanForm.challanDate || today()}
                onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, challanDate: e.target.value })}
                style={inp}
              />
            </div>

            {/* Entry Dt */}
            <div>
              <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Entry Dt</label>
              <input
                type="date"
                value={purchaseChallanForm.entryDate || today()}
                onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, entryDate: e.target.value })}
                style={inp}
              />
            </div>

            {/* Detail */}
            <div>
              <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Detail</label>
              <input
                value={purchaseChallanForm.detail || ""}
                onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, detail: e.target.value })}
                placeholder="Delivery / Transport detail..."
                style={inp}
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Payment Mode</label>
              <select
                value={purchaseChallanForm.paymentMode || "cash"}
                onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, paymentMode: e.target.value })}
                style={inp}
              >
                <option value="cash">Cash</option>
                <option value="credit">Credit (Udhar)</option>
                <option value="cheque">Cheque</option>
                <option value="neft">NEFT / UPI</option>
              </select>
            </div>
          </div>

          {/* Party Metadata Badge */}
          {(() => {
            const s = suppliers.find((x: any) => x.id === purchaseChallanForm.supplierId || x.name === purchaseChallanForm.partyName);
            if (!s && !purchaseChallanForm.partyName) return null;
            return (
              <div style={{ display: "flex", gap: "12px", background: "#f1f5f9", padding: "4px 10px", borderRadius: "5px", fontSize: "11px", color: "#475569", flexWrap: "wrap" }}>
                <span><strong>Area:</strong> {s?.address || purchaseChallanForm.area || "—"}</span>
                <span><strong>Mobile:</strong> {s?.mobile || purchaseChallanForm.mobile || "—"}</span>
                <span><strong>GSTIN:</strong> {s?.gstin || purchaseChallanForm.gstin || "—"}</span>
                <span><strong>Balance:</strong> ₹{fmt(s?.balance || 0)}</span>
                <span style={{ marginLeft: "auto", fontWeight: "700", color: purchaseChallanForm.status === "Converted to Bill" ? "#16a34a" : "#ca8a04" }}>
                  Status: {purchaseChallanForm.status || "Pending"}
                </span>
              </div>
            );
          })()}

          {/* ── CHALLAN ITEMS GRID (MATCHES TRANSECTION.PDF PAGE 5 COLS) ── */}
          <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "6px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  {[
                    { l: "No", w: "32px", a: "center" },
                    { l: "Item Name *", w: "210px", a: "left" },
                    { l: "Unit", w: "55px", a: "center" },
                    { l: "Batch", w: "85px", a: "left" },
                    { l: "Exp Dt", w: "68px", a: "center" },
                    { l: "Mrp", w: "68px", a: "right" },
                    { l: "Qty", w: "52px", a: "center" },
                    { l: "Fr", w: "46px", a: "center" },
                    { l: "PTR", w: "68px", a: "right" },
                    { l: "D%", w: "50px", a: "center" },
                    { l: "Disc", w: "65px", a: "right" },
                    { l: "BASE", w: "70px", a: "right" },
                    { l: "Gst%", w: "58px", a: "center" },
                    { l: "Amount", w: "80px", a: "right" },
                    { l: "LP", w: "65px", a: "right" },
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
                {purchaseChallanItems.map((pi: any, idx: number) => {
                  const isRowActive = activeItemIdx === idx;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setActiveItemIdx(idx)}
                      style={{
                        borderBottom: "1px solid #e2e8f0",
                        background: isRowActive ? "#eff6ff" : idx % 2 === 0 ? "white" : "#fafafa"
                      }}
                    >
                      {/* No */}
                      <td style={{ width: "32px", minWidth: "32px", padding: "3px 4px", textAlign: "center", fontWeight: "600", color: "#64748b", fontSize: "11px", boxSizing: "border-box" }}>
                        {idx + 1}
                      </td>

                      {/* Item Name (Compact 210px width) */}
                      <td style={{ width: "210px", minWidth: "210px", padding: "2px 4px", position: "relative", boxSizing: "border-box" }}>
                        {(() => {
                          const q = (itemSearch[idx] || "").toLowerCase();
                          const filtered = items.filter((i: any) => !q || (i.name || "").toLowerCase().includes(q) || (i.company || "").toLowerCase().includes(q));
                          const hi = itemHighlight[idx] || 0;
                          const selectItem = (i: any) => {
                            updateItem(idx, "itemId", i.id);
                            setActiveItemIdx(idx);
                            setItemSearch((prev: any) => ({ ...prev, [idx]: undefined }));
                            setItemHighlight((prev: any) => ({ ...prev, [idx]: 0 }));
                            setItemDropdown(null);
                            setTimeout(() => document.getElementById(`pc-unit-${idx}`)?.focus(), 50);
                          };
                          return (
                            <>
                              <input
                                id={`pc-item-${idx}`}
                                value={itemSearch[idx] !== undefined ? itemSearch[idx] : (pi.itemName || "")}
                                onChange={e => {
                                  const r = e.target.getBoundingClientRect();
                                  setDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 240) });
                                  setItemSearch({ ...itemSearch, [idx]: e.target.value });
                                  setItemHighlight({ ...itemHighlight, [idx]: 0 });
                                  setItemDropdown(idx);
                                  setActiveItemIdx(idx);
                                }}
                                onFocus={e => {
                                  const r = e.target.getBoundingClientRect();
                                  setDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 240) });
                                  setItemSearch((prev: any) => ({ ...prev, [idx]: prev[idx] ?? "" }));
                                  setItemHighlight((prev: any) => ({ ...prev, [idx]: 0 }));
                                  setItemDropdown(idx);
                                  setActiveItemIdx(idx);
                                }}
                                onBlur={() => setTimeout(() => setItemDropdown(null), 200)}
                                placeholder="Search medicine..."
                                style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 6px", height: "24px", fontSize: "11px", fontWeight: "600" }}
                                autoComplete="off"
                                onKeyDown={e => {
                                  if (itemDropdown === idx && filtered.length > 0) {
                                    if (e.key === "ArrowDown") { e.preventDefault(); setItemHighlight((prev: any) => ({ ...prev, [idx]: Math.min((prev[idx] || 0) + 1, filtered.length - 1) })); return; }
                                    if (e.key === "ArrowUp") { e.preventDefault(); setItemHighlight((prev: any) => ({ ...prev, [idx]: Math.max((prev[idx] || 0) - 1, 0) })); return; }
                                    if (e.key === "Enter") {
                                      e.preventDefault(); e.stopPropagation();
                                      const item = filtered[hi];
                                      if (item) { selectItem(item); } else { document.getElementById(`pc-unit-${idx}`)?.focus(); }
                                      return;
                                    }
                                  } else if (e.key === "Enter") {
                                    e.preventDefault();
                                    document.getElementById(`pc-unit-${idx}`)?.focus();
                                  }
                                }}
                              />
                              {itemDropdown === idx && (itemSearch[idx] || "").length >= 0 && (
                                <div style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: dropdownPos.width }}>
                                  {filtered.map((i: any, pos: number) => (
                                    <div
                                      key={i.id}
                                      onMouseDown={() => selectItem(i)}
                                      onMouseEnter={() => setItemHighlight((prev: any) => ({ ...prev, [idx]: pos }))}
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
                          id={`pc-unit-${idx}`}
                          value={pi.unit || ""}
                          onChange={e => updateItem(idx, "unit", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pc-batch-${idx}`)?.focus(); } }}
                          placeholder="Unit"
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                          title="Unit (e.g. 10T, 1B)"
                        />
                      </td>

                      {/* Batch */}
                      <td style={{ width: "85px", minWidth: "85px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pc-batch-${idx}`}
                          value={pi.batchNo || ""}
                          onChange={e => updateItem(idx, "batchNo", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pc-exp-${idx}`)?.focus(); } }}
                          placeholder="Batch"
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 4px", height: "24px", fontSize: "10px" }}
                        />
                      </td>

                      {/* Exp Dt */}
                      <td style={{ width: "68px", minWidth: "68px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pc-exp-${idx}`}
                          value={pi.expiryDate || ""}
                          onChange={e => {
                            let v = e.target.value.replace(/[^0-9/]/g, "");
                            if (v.length === 2 && !v.includes("/") && !pi.expiryDate?.includes("/")) v = v + "/";
                            updateItem(idx, "expiryDate", v);
                          }}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pc-mrp-${idx}`)?.focus(); } }}
                          placeholder="MM/YY"
                          maxLength={5}
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                        />
                      </td>

                      {/* Mrp */}
                      <td style={{ width: "68px", minWidth: "68px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pc-mrp-${idx}`}
                          type="number"
                          value={pi.mrp || ""}
                          onChange={e => updateItem(idx, "mrp", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pc-qty-${idx}`)?.focus(); } }}
                          placeholder="0.00"
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 4px", height: "24px", fontSize: "10px", textAlign: "right" }}
                        />
                      </td>

                      {/* Qty */}
                      <td style={{ width: "52px", minWidth: "52px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pc-qty-${idx}`}
                          type="number"
                          min="1"
                          value={pi.qty || ""}
                          onChange={e => updateItem(idx, "qty", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pc-free-${idx}`)?.focus(); } }}
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "11px", textAlign: "center", fontWeight: "700", color: "#1d4ed8" }}
                        />
                      </td>

                      {/* Fr (Free Qty) */}
                      <td style={{ width: "46px", minWidth: "46px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pc-free-${idx}`}
                          type="number"
                          min="0"
                          value={pi.freeQty || "0"}
                          onChange={e => updateItem(idx, "freeQty", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pc-ptr-${idx}`)?.focus(); } }}
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                        />
                      </td>

                      {/* PTR (Purchase Rate) */}
                      <td style={{ width: "68px", minWidth: "68px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pc-ptr-${idx}`}
                          type="number"
                          value={pi.ptr || ""}
                          onChange={e => updateItem(idx, "ptr", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pc-disc-${idx}`)?.focus(); } }}
                          placeholder="0.00"
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 4px", height: "24px", fontSize: "10px", textAlign: "right", fontWeight: "700" }}
                        />
                      </td>

                      {/* D% */}
                      <td style={{ width: "50px", minWidth: "50px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pc-disc-${idx}`}
                          type="number"
                          value={pi.disc || "0"}
                          onChange={e => updateItem(idx, "disc", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pc-gst-${idx}`)?.focus(); } }}
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                        />
                      </td>

                      {/* Disc Amount */}
                      <td style={{ width: "65px", minWidth: "65px", padding: "3px 4px", color: "#ef4444", textAlign: "right", fontSize: "10px", whiteSpace: "nowrap", boxSizing: "border-box" }}>
                        -₹{fmt(pi.discAmt || 0)}
                      </td>

                      {/* BASE (Taxable) */}
                      <td style={{ width: "70px", minWidth: "70px", padding: "3px 4px", fontWeight: "700", color: "var(--color-primary)", textAlign: "right", fontSize: "10px", whiteSpace: "nowrap", boxSizing: "border-box" }}>
                        ₹{fmt(pi.base || 0)}
                      </td>

                      {/* Gst% */}
                      <td style={{ width: "58px", minWidth: "58px", padding: "2px", boxSizing: "border-box" }}>
                        <select
                          id={`pc-gst-${idx}`}
                          value={pi.gst || "5"}
                          onChange={e => updateItem(idx, "gst", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pc-loc-${idx}`)?.focus(); } }}
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "1px 1px", height: "24px", fontSize: "10px", textAlign: "center" }}
                        >
                          {GST_RATES.map((r: any) => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>

                      {/* Amount */}
                      <td style={{ width: "80px", minWidth: "80px", padding: "3px 4px", fontWeight: "800", color: "#16a34a", textAlign: "right", fontSize: "11px", whiteSpace: "nowrap", boxSizing: "border-box" }}>
                        ₹{fmt(pi.amount || 0)}
                      </td>

                      {/* LP (Last Purchase Rate) */}
                      <td style={{ width: "65px", minWidth: "65px", padding: "3px 4px", color: "#64748b", textAlign: "right", fontSize: "10px", whiteSpace: "nowrap", boxSizing: "border-box" }}>
                        {pi.lastPurchaseRate ? `₹${fmt(pi.lastPurchaseRate)}` : "—"}
                      </td>

                      {/* Locat. (Rack location) - THE LAST INPUT IN THE ROW */}
                      <td style={{ width: "58px", minWidth: "58px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pc-loc-${idx}`}
                          value={pi.location || ""}
                          onChange={e => updateItem(idx, "location", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (idx === purchaseChallanItems.length - 1) {
                                setPurchaseChallanItems((prev: any) => [...prev, emptyItem()]);
                                setTimeout(() => {
                                  document.getElementById(`pc-item-${idx + 1}`)?.focus();
                                }, 50);
                              } else {
                                document.getElementById(`pc-item-${idx + 1}`)?.focus();
                              }
                            }
                          }}
                          placeholder="Loc"
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                        />
                      </td>

                      {/* Delete Row */}
                      <td style={{ width: "30px", minWidth: "30px", padding: "2px", textAlign: "center", boxSizing: "border-box" }}>
                        <button
                          onClick={() => removeItem(idx)}
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
                    -₹{fmt(purchaseChallanItems.reduce((s: any, pi: any) => s + (pi.discAmt || 0), 0))}
                  </td>
                  <td style={{ padding: "5px 4px", fontWeight: "800", textAlign: "right", fontSize: "11px", color: "var(--color-primary)", whiteSpace: "nowrap" }}>
                    ₹{fmt(purchaseChallanItems.reduce((s: any, pi: any) => s + (pi.base || 0), 0))}
                  </td>
                  <td></td>
                  <td style={{ padding: "5px 4px", fontWeight: "800", textAlign: "right", fontSize: "12px", color: "#16a34a", whiteSpace: "nowrap" }}>
                    ₹{fmt(purchaseChallanItems.reduce((s: any, pi: any) => s + num(pi.amount || 0), 0))}
                  </td>
                  <td colSpan={3}></td>
                </tr>
                <tr style={{ background: "#eff6ff", borderTop: "1px solid #bfdbfe" }}>
                  <td colSpan={10} style={{ padding: "4px 8px", fontWeight: "700", textAlign: "right", fontSize: "10px", color: "#1d4ed8" }}>GST BREAKDOWN →</td>
                  <td colSpan={7} style={{ padding: "4px 8px", fontWeight: "700", fontSize: "10px", color: "#1d4ed8", textAlign: "right" }}>
                    {(() => {
                      const gT = purchaseChallanItems.reduce((s: any, pi: any) => s + (pi.base || 0) * num(pi.gst || 0) / 100, 0);
                      return `SGST: ₹${fmt(gT / 2)} | CGST: ₹${fmt(gT / 2)} | IGST: ₹${fmt(gT)}`;
                    })()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── ACTIVE ITEM DETAILS CARD & SUMMARY BOX (MATCHES TRANSECTION.PDF PAGE 5) ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "10px", alignItems: "start" }}>
            
            {/* Left: Active Item Stock Inspector & Tax Grid */}
            {(() => {
              const cur = purchaseChallanItems[activeItemIdx] || purchaseChallanItems[0] || {};
              const itemMaster = items.find((i: any) => i.id === cur.itemId || i.name === cur.itemName);
              const baseTot = purchaseChallanItems.reduce((s: any, pi: any) => s + (pi.base || 0), 0);
              const gstTot = purchaseChallanItems.reduce((s: any, pi: any) => s + (pi.base || 0) * num(pi.gst || 0) / 100, 0);
              return (
                <div style={{ background: "#f8fafc", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "8px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a" }}>
                      💊 {cur.itemName || "Select an item to view live store details"}
                    </span>
                    {cur.batchNo && (
                      <span style={{ fontSize: "10px", background: "#eff6ff", color: "#1d4ed8", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
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
                      <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Current Stock:</span>
                      <strong style={{ color: (itemMaster?.stock || 0) > 0 ? "#16a34a" : "#dc2626" }}>{itemMaster?.stock || 0} Units</strong>
                    </div>
                  </div>

                  {/* Tax Grid from transection.pdf page 5 */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "4px", background: "white", padding: "4px 8px", borderRadius: "4px", border: "1px solid #e2e8f0", textAlign: "center", fontSize: "10px" }}>
                    <div><span style={{ color: "#64748b", display: "block" }}>Base</span><strong>₹{fmt(baseTot)}</strong></div>
                    <div><span style={{ color: "#64748b", display: "block" }}>SGST</span><strong>₹{fmt(gstTot / 2)}</strong></div>
                    <div><span style={{ color: "#64748b", display: "block" }}>CGST</span><strong>₹{fmt(gstTot / 2)}</strong></div>
                    <div><span style={{ color: "#64748b", display: "block" }}>IGST</span><strong>₹{fmt(gstTot)}</strong></div>
                    <div><span style={{ color: "#64748b", display: "block" }}>Total Tax</span><strong style={{ color: "#1d4ed8" }}>₹{fmt(gstTot)}</strong></div>
                    <div><span style={{ color: "#64748b", display: "block" }}>Cess</span><strong>₹0.00</strong></div>
                  </div>

                  {/* Challan Message / Note Input */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569", whiteSpace: "nowrap" }}>Msg:</span>
                    <input
                      value={purchaseChallanForm.billMsg || ""}
                      onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, billMsg: e.target.value })}
                      placeholder="Delivery note / Transport / Challan memo remarks..."
                      style={{ ...inp, height: "24px", fontSize: "11px", padding: "2px 6px" }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Right: Summary Box (Matches Page 5 format) */}
            {(() => {
              const gross = purchaseChallanItems.reduce((s: any, pi: any) => s + num(pi.amount || 0), 0);
              const base = purchaseChallanItems.reduce((s: any, pi: any) => s + (pi.base || 0), 0);
              const discAmt = purchaseChallanItems.reduce((s: any, pi: any) => s + (pi.discAmt || 0), 0);
              const gstTot = purchaseChallanItems.reduce((s: any, pi: any) => s + (pi.base || 0) * num(pi.gst || 0) / 100, 0);
              const netTotal = gross - num(purchaseChallanForm.cashDisc) + num(purchaseChallanForm.otherAdj);
              return (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 10px", fontSize: "11px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 10px" }}>
                    <span>Base Amount:</span><span style={{ textAlign: "right", fontWeight: "600" }}>₹{fmt(base)}</span>
                    <span style={{ color: "#ef4444" }}>Less Disc:</span><span style={{ textAlign: "right", color: "#ef4444" }}>-₹{fmt(discAmt)}</span>
                    <span>Taxable:</span><span style={{ textAlign: "right" }}>₹{fmt(base)}</span>
                    <span style={{ color: "#64748b" }}>GST Total:</span><span style={{ textAlign: "right", color: "#1d4ed8", fontWeight: "700" }}>₹{fmt(gstTot)}</span>
                    <span style={{ color: "#64748b" }}>Cash Disc (CD):</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseChallanForm.cashDisc || "0"} onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, cashDisc: e.target.value })} style={{ ...inp, width: "60px", padding: "1px 3px", fontSize: "10px", height: "18px" }} /></span>
                    <span style={{ color: "#64748b" }}>Other +/-:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseChallanForm.otherAdj || "0"} onChange={e => setPurchaseChallanForm({ ...purchaseChallanForm, otherAdj: e.target.value })} style={{ ...inp, width: "60px", padding: "1px 3px", fontSize: "10px", height: "18px" }} /></span>
                    <span style={{ fontWeight: "800", borderTop: "1px solid #cbd5e1", paddingTop: "4px" }}>NET CHALLAN TOTAL:</span>
                    <span style={{ textAlign: "right", fontWeight: "900", color: "#16a34a", fontSize: "14px", borderTop: "1px solid #cbd5e1", paddingTop: "4px" }}>₹{fmt(netTotal)}</span>
                  </div>
                  {purchaseChallanForm.id && (
                    <div style={{ marginTop: "8px", borderTop: "1px dashed #cbd5e1", paddingTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "10px", color: "#64748b" }}>Status:</span>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: purchaseChallanForm.status === "Converted to Bill" ? "#16a34a" : "#ca8a04" }}>
                        {purchaseChallanForm.status || "Pending"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* ── BOTTOM ACTION TOOLBAR (ZERO SCROLL COMPLIANT) ── */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
            <button
              onClick={handleSave}
              style={{ ...btn("#16a34a"), fontSize: "12px", padding: "5px 12px", fontWeight: "700" }}
            >
              <CheckCircle size={14} /> Save Challan
            </button>
            <button
              onClick={() => printVoucher({ ...purchaseChallanForm, items: purchaseChallanItems })}
              style={{ ...btn("#0284c7"), fontSize: "12px", padding: "5px 10px" }}
            >
              <Printer size={13} /> Print Challan
            </button>
            <button
              onClick={holdCurrentChallan}
              style={{ ...btn("#eab308", "#713f12"), fontSize: "12px", padding: "5px 10px" }}
              title="Hold draft challan"
            >
              ⏸️ Hold ({pendingChallans.length})
            </button>
            <button
              onClick={() => setShowDuplicateModal(true)}
              style={{ ...btn("#6366f1"), fontSize: "12px", padding: "5px 10px" }}
              title="Duplicate from existing challan"
            >
              📋 Duplicate
            </button>
            {purchaseChallanForm.id && purchaseChallanForm.status !== "Converted to Bill" && (
              <button
                onClick={() => convertToPurchaseBill({ ...purchaseChallanForm, items: purchaseChallanItems })}
                style={{ ...btn("#8b5cf6"), fontSize: "12px", padding: "5px 10px", fontWeight: "700" }}
                title="Convert this delivery challan into an official purchase invoice"
              >
                🔄 Convert to Bill
              </button>
            )}
            <button
              onClick={() => { setScannerTarget("purchase_challan"); setShowCameraScanner(true); }}
              style={{ ...btn("#0f766e"), fontSize: "12px", padding: "5px 10px" }}
            >
              📷 Scan
            </button>
            {purchaseChallanForm.id && (
              <button
                onClick={() => handleDelete(purchaseChallanForm)}
                style={{ ...btn("#ef4444"), fontSize: "12px", padding: "5px 10px" }}
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
            <button
              onClick={() => setShowForm(false)}
              style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "12px", padding: "5px 10px", marginLeft: "auto" }}
            >
              <X size={13} /> Close
            </button>
          </div>
        </div>
      )}

      {/* Purchase Challans List (When form closed) */}
      {!showForm && (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#64748b", background: "white", borderRadius: "8px", border: "1px dashed var(--color-border)" }}>
          <div style={{ fontSize: "44px", opacity: 0.5 }}>📦</div>
          <p style={{ marginTop: "16px", fontWeight: "600", fontSize: "16px" }}>Search Challan#, Party, or Entry# to Open</p>
          <p style={{ fontSize: "13px", opacity: 0.7, marginTop: "6px" }}>Type in the search box above or browse the register to edit, reprint, or convert a delivery challan into a purchase bill.</p>
          <div style={{ marginTop: "16px", display: "flex", gap: "10px", justifyContent: "center" }}>
            <button onClick={() => openForm()} style={{ ...btn("var(--color-primary)"), padding: "8px 16px" }}>➕ New Purchase Challan</button>
            <button onClick={() => setChallanListDrawer(true)} style={{ ...btn("#475569"), padding: "8px 16px" }}>📋 Browse All Challans</button>
          </div>
        </div>
      )}

      {/* ── MODAL: PENDING PURCHASE CHALLAN QUEUE ── */}
      {showPendingModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "600px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>⏸️ Pending (Held) Purchase Challans ({pendingChallans.length})</div>
              <button onClick={() => setShowPendingModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
            <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
              {pendingChallans.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b", fontSize: "13px" }}>
                  No held purchase challans in the pending queue.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {pendingChallans.map((pb: any) => (
                    <div key={pb.id} style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "13px", color: "#1e293b" }}>{pb.partyName || "Supplier"} {pb.purchaseChallanForm?.challanNo ? `(Challan: ${pb.purchaseChallanForm.challanNo})` : ""}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>Held at: {pb.heldAt} | Items: {pb.purchaseChallanItems?.length || 0} | Total: ₹{fmt(pb.totalAmt || 0)}</div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => resumePendingChallan(pb)} style={{ ...btn("#16a34a"), padding: "4px 10px", fontSize: "12px" }}>▶️ Resume</button>
                        <button onClick={() => discardPendingChallan(pb.id)} style={{ ...btn("#ef4444"), padding: "4px 10px", fontSize: "12px" }}>🗑️ Discard</button>
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

      {/* ── MODAL: PREVIEW DELIVERY CHALLAN VOUCHER ── */}
      {showPreviewModal && previewChallan && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "680px", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>👁️ Purchase Challan Voucher - #{previewChallan.challanNo || previewChallan.entryNo}</div>
              <button onClick={() => setShowPreviewModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
            <div style={{ padding: "16px", overflowY: "auto", flex: 1, fontFamily: "monospace", fontSize: "12px" }}>
              <div style={{ textAlign: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "8px", marginBottom: "8px" }}>
                <div style={{ fontWeight: "800", fontSize: "15px" }}>{(currentUser?.pharmacyName || "SHIV DHARA MEDICAL STORE").toUpperCase()}</div>
                <div style={{ fontSize: "11px", color: "#1d4ed8", fontWeight: "700" }}>PURCHASE DELIVERY CHALLAN / INWARD MEMO</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "11px", marginBottom: "8px" }}>
                <div><strong>Party:</strong> {previewChallan.partyName || "Supplier"}</div>
                <div style={{ textAlign: "right" }}><strong>Entry No:</strong> {previewChallan.billSeries || "G"}-{previewChallan.entryNo}</div>
                <div><strong>Challan No:</strong> {previewChallan.challanNo || "—"}</div>
                <div style={{ textAlign: "right" }}><strong>Date:</strong> {new Date(previewChallan.challanDate || previewChallan.entryDate || today()).toLocaleDateString("en-IN")}</div>
                <div><strong>Status:</strong> {previewChallan.status || "Pending"}</div>
                <div style={{ textAlign: "right" }}><strong>Mode:</strong> {previewChallan.paymentMode || "Cash"}</div>
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
                  {(previewChallan.items || []).map((it: any, i: number) => (
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
                <span>TOTAL CHALLAN VALUE:</span>
                <span style={{ color: "#16a34a" }}>₹{fmt(previewChallan.total || 0)}</span>
              </div>
            </div>
            <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", background: "#f8fafc" }}>
              <button
                onClick={() => {
                  const win = window.open('', '_blank');
                  if (win) {
                    win.document.write(`<html><head><title>Challan Voucher</title><style>body{font-family:monospace;padding:20px;}</style></head><body>${document.querySelector('[fontFamily="monospace"]')?.outerHTML || ''}</body></html>`);
                    win.document.close();
                    win.print();
                  }
                }}
                style={{ ...btn("#0284c7"), padding: "6px 16px" }}
              >
                <Printer size={14} /> Print
              </button>
              <button onClick={() => setShowPreviewModal(false)} style={{ ...btn("#64748b"), padding: "6px 14px" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DUPLICATE PURCHASE CHALLAN ── */}
      {showDuplicateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "550px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>📋 Clone / Duplicate Past Purchase Challan</div>
              <button onClick={() => setShowDuplicateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
            <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
              <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "10px" }}>Select a past challan below to copy its item list into a new fresh delivery entry:</p>
              {purchaseChallans.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#64748b", fontSize: "12px" }}>No previous challans to clone.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {purchaseChallans.slice(0, 20).map((r: any) => (
                    <div
                      key={r.id}
                      onClick={() => duplicateChallan(r)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", transition: "0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                      onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
                    >
                      <div>
                        <strong style={{ fontSize: "12px" }}>{r.partyName || "Supplier"}</strong>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>Challan #{r.challanNo || r.entryNo} | Date: {new Date(r.challanDate || r.entryDate).toLocaleDateString("en-IN")}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <strong style={{ color: "#16a34a", fontSize: "12px" }}>₹{fmt(r.total || 0)}</strong>
                        <div style={{ fontSize: "10px", color: "#0284c7" }}>{r.items?.length || 0} Items</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", textAlign: "right", background: "#f8fafc" }}>
              <button onClick={() => setShowDuplicateModal(false)} style={{ ...btn("#64748b"), padding: "6px 14px" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAWER: BROWSE ALL PURCHASE CHALLANS ── */}
      {challanListDrawer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "700px", height: "100%", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-2xl)" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ fontWeight: "800", fontSize: "16px", color: "#0f172a" }}>📦 Purchase Challan Register ({purchaseChallans.length})</div>
              <button onClick={closeDrawer} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
            <div style={{ padding: "10px 18px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <input
                placeholder="Filter by Supplier, Challan#, Entry#..."
                value={challanSearch}
                onChange={e => setChallanSearch(e.target.value)}
                style={{ ...inp, width: "100%" }}
              />
            </div>
            <div style={{ padding: "16px 18px", overflowY: "auto", flex: 1 }}>
              {(() => {
                const q = (challanSearch || "").toLowerCase();
                const filtered = purchaseChallans.filter((r: any) =>
                  !q ||
                  (String(r.entryNo) || "").toLowerCase().includes(q) ||
                  (r.challanNo || "").toLowerCase().includes(q) ||
                  (r.partyName || "").toLowerCase().includes(q)
                );
                if (filtered.length === 0) {
                  return <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>No purchase challans found.</div>;
                }
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {filtered.map((r: any) => (
                      <div key={r.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <div
                          style={{ cursor: "pointer", flex: 1 }}
                          onClick={() => { openForm(r); closeDrawer(); }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: "800", color: "#1d4ed8", fontSize: "13px" }}>#{r.entryNo}</span>
                            <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "13px" }}>{r.partyName}</span>
                            <span style={{ fontSize: "11px", background: r.status === "Converted to Bill" ? "#dcfce7" : "#fef9c3", color: r.status === "Converted to Bill" ? "#16a34a" : "#854d0e", padding: "1px 6px", borderRadius: "10px", fontWeight: "600" }}>
                              {r.status || "Pending"}
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                            Challan: {r.challanNo || "—"} | Date: {new Date(r.challanDate || r.entryDate).toLocaleDateString("en-IN")} | Items: {r.items?.length || 0}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: "900", color: "#16a34a", fontSize: "14px" }}>₹{fmt(r.total)}</div>
                          </div>
                          <button
                            onClick={() => printVoucher(r)}
                            style={{ ...btn("#0284c7"), padding: "4px 8px", fontSize: "11px" }}
                            title="Print Challan"
                          >
                            <Printer size={12} />
                          </button>
                          {r.status !== "Converted to Bill" && (
                            <button
                              onClick={() => convertToPurchaseBill(r)}
                              style={{ ...btn("#8b5cf6"), padding: "4px 8px", fontSize: "11px" }}
                              title="Convert to Purchase Bill"
                            >
                              🔄 Bill
                            </button>
                          )}
                          <button
                            onClick={() => { openForm(r); closeDrawer(); }}
                            style={{ ...btn("var(--color-primary)"), padding: "4px 8px", fontSize: "11px" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(r)}
                            style={{ ...btn("#ef4444"), padding: "4px 8px", fontSize: "11px" }}
                            title="Delete Challan"
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
                Total ({purchaseChallans.length}): <strong style={{ color: "#16a34a" }}>₹{fmt(purchaseChallans.reduce((s: any, r: any) => s + num(r.total), 0))}</strong>
              </span>
              <button onClick={closeDrawer} style={{ ...btn("#64748b"), padding: "6px 14px" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
