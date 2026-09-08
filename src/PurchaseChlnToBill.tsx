// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckCircle, Printer, Trash2, Truck, FileText, ArrowRight, Clock, ChevronUp, ChevronDown, Check, AlertCircle } from "lucide-react";
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

export default function PurchaseChlnToBill({ setScannerTarget, setShowCameraScanner, initialChallan, onClearInitialChallan }: any) {
  const { 
    purchaseChallans, savePurchaseChallans, 
    purchaseBills, savePurchaseBills,
    purchaseReturns,
    suppliers, items, showToast, showConfirm, setActiveSection,
    isDateLocked, currentUser, loadAll
  } = useMedicalStore();

  const emptyItem = (chlnNo?: string, chlnId?: string) => ({
    id: uid(),
    itemId: "",
    itemName: "",
    unit: "10T",
    batchNo: "",
    expiryDate: "",
    mrp: "",
    qty: 1,
    freeQty: 0,
    ptr: "",
    disc: 0,
    base: 0,
    gst: 5,
    amount: 0,
    refChallanNo: chlnNo || "",
    refChallanId: chlnId || "",
    lastPurchaseRate: "",
    location: "",
    category: "",
    hsn: "",
  });

  const [activeItemIdx, setActiveItemIdx] = useState(0);
  const [billSearch, setBillSearch] = useState("");
  const [billSearchDropdown, setBillSearchDropdown] = useState(false);
  const [billSearchHighlight, setBillSearchHighlight] = useState(0);

  // Bill Header form matching Visual InfoSoft Page 6
  const [billForm, setBillForm] = useState<any>({
    series: "G",
    entryNo: "",
    entryDate: today(),
    entryTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
    billNo: "",
    billDate: today(),
    supplierId: "",
    partyName: "",
    otherDetails: "",
    schemeDisc: "",
    taxType: "exclusive",
    taxZone: "sgst_ugst",
    gstOnFree: false,
    newMrp: false,
    isOrder: false,
    schInput: "",
    discInput: "",
    msg: "",
    halfScheme: 0,
    octOnFree: 0,
    otherAdj: 0,
    crNoteDeduction: 0,
    tcsValue: 0,
  });

  const [billItems, setBillItems] = useState<any[]>([emptyItem()]);

  // Dual-tab box at top-right: "challan" (F6) or "credit_note" (F5)
  const [topRightTab, setTopRightTab] = useState<"challan" | "credit_note">("challan");
  const [selectedChallanIds, setSelectedChallanIds] = useState<string[]>([]);
  const [selectedCrNoteIds, setSelectedCrNoteIds] = useState<string[]>([]);

  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierDropdown, setSupplierDropdown] = useState(false);
  const [supplierHighlight, setSupplierHighlight] = useState(0);

  const [itemSearch, setItemSearch] = useState<any>({});
  const [itemHighlight, setItemHighlight] = useState<any>({});
  const [itemDropdown, setItemDropdown] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 240 });

  const [challanListDrawer, setChallanListDrawer] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewBill, setPreviewBill] = useState<any>(null);

  // Live entry clock
  useEffect(() => {
    const timer = setInterval(() => {
      setBillForm((prev: any) => ({
        ...prev,
        entryTime: new Date().toLocaleTimeString('en-US', { hour12: false })
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut listener for F5 (Credit Note) and F6 (Challan)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F6") {
        e.preventDefault();
        setTopRightTab("challan");
      } else if (e.key === "F5") {
        e.preventDefault();
        setTopRightTab("credit_note");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-generate Entry Number if empty
  useEffect(() => {
    if (!billForm.entryNo) {
      const yr = new Date().getFullYear();
      const count = (purchaseBills || []).length + 1;
      setBillForm((prev: any) => ({
        ...prev,
        entryNo: `${yr}/${String(count).padStart(4, "0")}`
      }));
    }
  }, [purchaseBills]);

  // Handle Initial Challan passed via navigation
  useEffect(() => {
    if (initialChallan) {
      selectChallanForBill(initialChallan);
      if (onClearInitialChallan) onClearInitialChallan();
    }
  }, [initialChallan]);

  // Select Party / Supplier
  const handleSelectSupplier = (s: any) => {
    setBillForm((prev: any) => ({
      ...prev,
      supplierId: s.id,
      partyName: s.name,
      partyDetails: s
    }));
    setSupplierSearch(s.name);
    setSupplierDropdown(false);
  };

  // Select / Include Challan into Bill
  const toggleChallanSelection = (chln: any) => {
    const isSelected = selectedChallanIds.includes(chln.id);
    let newSelected: string[] = [];
    if (isSelected) {
      newSelected = selectedChallanIds.filter(id => id !== chln.id);
      // Remove items from this challan
      setBillItems(prev => {
        const kept = prev.filter(pi => pi.refChallanId !== chln.id);
        return kept.length ? kept : [emptyItem()];
      });
    } else {
      newSelected = [...selectedChallanIds, chln.id];
      // Automatically set party if not yet set
      if (!billForm.partyName && chln.partyName) {
        setBillForm((prev: any) => ({
          ...prev,
          partyName: chln.partyName,
          supplierId: chln.supplierId || "",
          taxType: chln.taxType || prev.taxType,
          taxZone: chln.taxZone || prev.taxZone,
        }));
        setSupplierSearch(chln.partyName);
      }
      if (!billForm.billNo && chln.challanNo) {
        setBillForm((prev: any) => ({
          ...prev,
          billNo: `INV-${chln.challanNo}`,
          billDate: chln.challanDate || today()
        }));
      }

      // Import line items from this challan
      const chlnItems = (chln.items || []).map((ci: any) => ({
        id: uid(),
        itemId: ci.itemId || "",
        itemName: ci.itemName || "",
        unit: ci.unit || "10T",
        batchNo: ci.batchNo || "",
        expiryDate: ci.expiryDate || "",
        mrp: ci.mrp || "",
        qty: ci.qty || 1,
        freeQty: ci.freeQty || 0,
        ptr: ci.ptr || "",
        disc: ci.disc || 0,
        base: ci.base || 0,
        gst: ci.gst || 5,
        amount: ci.amount || 0,
        refChallanNo: chln.challanNo || String(chln.entryNo || ""),
        refChallanId: chln.id,
        lastPurchaseRate: ci.lastPurchaseRate || "",
        location: ci.location || "",
        category: ci.category || "",
        hsn: ci.hsn || "",
      }));

      setBillItems(prev => {
        const existingWithoutEmpty = prev.filter(pi => pi.itemName || pi.batchNo || pi.ptr);
        return [...existingWithoutEmpty, ...chlnItems];
      });
    }
    setSelectedChallanIds(newSelected);
  };

  // Direct select from convert button
  const selectChallanForBill = (chln: any) => {
    if (!chln) return;
    setBillForm((prev: any) => ({
      ...prev,
      partyName: chln.partyName || prev.partyName,
      supplierId: chln.supplierId || prev.supplierId,
      billNo: chln.challanNo ? `INV-${chln.challanNo}` : prev.billNo,
      billDate: chln.challanDate || today(),
      taxType: chln.taxType || prev.taxType,
      taxZone: chln.taxZone || prev.taxZone,
      gstOnFree: !!chln.gstOnFree,
      otherDetails: chln.details || prev.otherDetails,
    }));
    setSupplierSearch(chln.partyName || "");
    setSelectedChallanIds([chln.id]);

    const chlnItems = (chln.items || []).map((ci: any) => ({
      id: uid(),
      itemId: ci.itemId || "",
      itemName: ci.itemName || "",
      unit: ci.unit || "10T",
      batchNo: ci.batchNo || "",
      expiryDate: ci.expiryDate || "",
      mrp: ci.mrp || "",
      qty: ci.qty || 1,
      freeQty: ci.freeQty || 0,
      ptr: ci.ptr || "",
      disc: ci.disc || 0,
      base: ci.base || 0,
      gst: ci.gst || 5,
      amount: ci.amount || 0,
      refChallanNo: chln.challanNo || String(chln.entryNo || ""),
      refChallanId: chln.id,
      lastPurchaseRate: ci.lastPurchaseRate || "",
      location: ci.location || "",
      category: ci.category || "",
      hsn: ci.hsn || "",
    }));

    setBillItems(chlnItems.length ? chlnItems : [emptyItem()]);
  };

  // Toggle Credit Note selection to deduct from Bill
  const toggleCrNoteSelection = (cr: any) => {
    const isSelected = selectedCrNoteIds.includes(cr.id);
    let newSelected: string[] = [];
    if (isSelected) {
      newSelected = selectedCrNoteIds.filter(id => id !== cr.id);
    } else {
      newSelected = [...selectedCrNoteIds, cr.id];
    }
    setSelectedCrNoteIds(newSelected);

    // Calculate total credit note amount deducted
    const totalCr = (purchaseReturns || [])
      .filter((r: any) => newSelected.includes(r.id))
      .reduce((sum: number, r: any) => sum + (num(r.total) || num(r.amount) || 0), 0);

    setBillForm((prev: any) => ({
      ...prev,
      crNoteDeduction: totalCr
    }));
  };

  // Calculations per Line Item
  const calcRow = (item: any) => {
    const q = num(item.qty) || 0;
    const rate = num(item.ptr) || 0;
    const gross = q * rate;
    const dPct = num(item.disc) || 0;
    const discAmt = (gross * dPct) / 100;
    const baseVal = gross - discAmt;
    const gPct = num(item.gst) || 0;
    const isInclusive = billForm.taxType === "inclusive";

    let rowGst = 0;
    let rowNet = 0;

    if (isInclusive) {
      rowNet = baseVal;
      rowGst = baseVal - (baseVal / (1 + gPct / 100));
    } else {
      rowGst = (baseVal * gPct) / 100;
      rowNet = baseVal + rowGst;
    }

    return {
      gross,
      discAmt,
      baseVal,
      rowGst,
      rowNet
    };
  };

  const updateItem = (idx: number, field: string, val: any) => {
    setBillItems(prev => {
      const updated = [...prev];
      const item = { ...updated[idx], [field]: val };

      // Expiry MM/YY auto-slash
      if (field === "expiryDate") {
        let v = String(val).replace(/\D/g, "");
        if (v.length > 4) v = v.slice(0, 4);
        if (v.length >= 3) {
          v = `${v.slice(0, 2)}/${v.slice(2)}`;
        }
        item.expiryDate = v;
      }

      // Recalculate
      const c = calcRow(item);
      item.base = c.baseVal;
      item.amount = c.rowNet;
      updated[idx] = item;
      return updated;
    });
  };

  const handleSelectItem = (idx: number, itm: any) => {
    setBillItems(prev => {
      const updated = [...prev];
      const cur = updated[idx];
      const latestBatch = itm.batches && itm.batches.length ? itm.batches[0] : null;

      const newItem = {
        ...cur,
        itemId: itm.id,
        itemName: itm.name,
        category: itm.category || "",
        unit: itm.unit || cur.unit || "10T",
        mrp: latestBatch?.mrp || itm.mrp || "",
        ptr: latestBatch?.ptr || itm.ptr || itm.purchaseRate || "",
        gst: itm.gstRate || itm.gst || 5,
        batchNo: latestBatch?.batchNo || cur.batchNo || "",
        expiryDate: latestBatch?.expiryDate || cur.expiryDate || "",
        location: itm.rackLocation || itm.location || "",
        lastPurchaseRate: itm.lastPurchaseRate || itm.ptr || "",
        hsn: itm.hsn || "",
      };

      const c = calcRow(newItem);
      newItem.base = c.baseVal;
      newItem.amount = c.rowNet;
      updated[idx] = newItem;
      return updated;
    });

    setItemDropdown(null);
    setTimeout(() => {
      document.getElementById(`pcb-unit-${idx}`)?.focus();
    }, 50);
  };

  const removeItem = (idx: number) => {
    if (billItems.length === 1) {
      setBillItems([emptyItem()]);
      return;
    }
    setBillItems(billItems.filter((_, i) => i !== idx));
    if (activeItemIdx >= billItems.length - 1) {
      setActiveItemIdx(Math.max(0, billItems.length - 2));
    }
  };

  // Grand Totals Calculation
  const subtotal = billItems.reduce((acc, pi) => acc + (num(pi.qty) * num(pi.ptr)), 0);
  const totalDisc = billItems.reduce((acc, pi) => acc + ((num(pi.qty) * num(pi.ptr) * num(pi.disc)) / 100), 0);
  const taxableVal = subtotal - totalDisc;

  // GST Breakdown calculation across standard rates
  const gstBreakdown = [0, 5, 12, 18, 28].map(rate => {
    const rateItems = billItems.filter(pi => num(pi.gst) === rate && pi.itemName);
    const base = rateItems.reduce((sum, pi) => sum + (num(pi.base) || 0), 0);
    const isInterState = billForm.taxZone === "igst";
    const totalGst = (base * rate) / 100;
    const sgst = isInterState ? 0 : totalGst / 2;
    const cgst = isInterState ? 0 : totalGst / 2;
    const igst = isInterState ? totalGst : 0;
    return { rate, base, sgst, cgst, igst, ugst: 0, totalGst };
  });

  const totalGstSum = gstBreakdown.reduce((s, g) => s + g.totalGst, 0);

  // Scheme/Discount and other adjustments
  const otherAdj = num(billForm.otherAdj) || 0;
  const crNoteDeduction = num(billForm.crNoteDeduction) || 0;
  const tcsValue = num(billForm.tcsValue) || 0;

  const netBillTotal = Math.max(0, Math.round((taxableVal + totalGstSum + otherAdj + tcsValue - crNoteDeduction) * 100) / 100);

  // Filter pending/unbilled challans for party
  const partyChallans = (purchaseChallans || []).filter((c: any) => {
    if (c.status === "Converted to Bill" || c.status === "BILLED") return false;
    if (!billForm.partyName) return true;
    return (c.partyName || "").toLowerCase().trim() === (billForm.partyName || "").toLowerCase().trim();
  });

  // Filter pending credit notes / purchase returns for party
  const partyCrNotes = (purchaseReturns || []).filter((r: any) => {
    if (!billForm.partyName) return true;
    return (r.partyName || r.supplierName || "").toLowerCase().trim() === (billForm.partyName || "").toLowerCase().trim();
  });

  // Reset form
  const handleNew = () => {
    showConfirm("Create a new Purchase Bill from Challan?", () => {
      setBillForm({
        series: "G",
        entryNo: `${new Date().getFullYear()}/${String((purchaseBills || []).length + 1).padStart(4, "0")}`,
        entryDate: today(),
        entryTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
        billNo: "",
        billDate: today(),
        supplierId: "",
        partyName: "",
        otherDetails: "",
        schemeDisc: "",
        taxType: "exclusive",
        taxZone: "sgst_ugst",
        gstOnFree: false,
        newMrp: false,
        isOrder: false,
        schInput: "",
        discInput: "",
        msg: "",
        halfScheme: 0,
        octOnFree: 0,
        otherAdj: 0,
        crNoteDeduction: 0,
        tcsValue: 0,
      });
      setBillItems([emptyItem()]);
      setSelectedChallanIds([]);
      setSelectedCrNoteIds([]);
      setSupplierSearch("");
    });
  };

  // Save & Generate Bill
  const handleSaveBill = async () => {
    const lockCheck = isDateLocked("purchase", billForm.billDate || billForm.entryDate || today());
    if (lockCheck.isLocked) {
      showToast(`🔒 ${lockCheck.label} is locked from ${lockCheck.from} to ${lockCheck.to} by Supervisor!`, "error");
      return;
    }

    if (!billForm.partyName) {
      showToast("Party Name is required!", "error");
      return;
    }

    if (!billForm.billNo) {
      showToast("Bill No is required!", "error");
      return;
    }

    const validItems = billItems.filter(pi => pi.itemName && (num(pi.qty) > 0 || num(pi.freeQty) > 0));
    if (!validItems.length) {
      showToast("Please add or import at least 1 valid item!", "error");
      return;
    }

    const newBill = {
      id: uid(),
      entryNo: billForm.entryNo || `${new Date().getFullYear()}/${String((purchaseBills || []).length + 1).padStart(4, "0")}`,
      billNo: billForm.billNo,
      billDate: billForm.billDate,
      entryDate: billForm.entryDate,
      supplierId: billForm.supplierId,
      partyName: billForm.partyName,
      taxType: billForm.taxType,
      taxZone: billForm.taxZone,
      paymentMode: "Credit",
      remarks: `Converted from Challan: ${selectedChallanIds.length ? selectedChallanIds.join(', ') : 'Direct'}. ${billForm.otherDetails || ''}`.trim(),
      items: validItems,
      subtotal,
      totalGst: totalGstSum,
      totalDisc,
      crNoteDeduction,
      tcsValue,
      total: netBillTotal,
      status: "Credit",
      convertedChallanIds: selectedChallanIds,
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Save Purchase Bill locally and in DB
      savePurchaseBills([newBill, ...(purchaseBills || [])]);

      // 2. Mark referenced challans as BILLED / Converted to Bill
      if (selectedChallanIds.length > 0) {
        const updatedChallans = (purchaseChallans || []).map((c: any) => {
          if (selectedChallanIds.includes(c.id)) {
            return {
              ...c,
              status: "Converted to Bill",
              convertedBillNo: newBill.billNo,
              convertedDate: today(),
            };
          }
          return c;
        });
        savePurchaseChallans(updatedChallans);
      }

      showToast(`✅ Purchase Bill #${newBill.billNo} generated & ${selectedChallanIds.length} Challan(s) converted successfully!`);
      
      // Auto-preview
      setPreviewBill(newBill);
      setShowPreviewModal(true);

      // Reset
      handleNew();
    } catch (e: any) {
      console.error(e);
      showToast("Failed to save Purchase Bill: " + e.message, "error");
    }
  };

  // Print voucher
  const printPurchaseBillVoucher = (bill: any) => {
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`
      <html>
        <head>
          <title>Purchase Bill - ${bill.billNo || bill.entryNo}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; font-size: 12px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 12px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; font-size: 11px; }
            th { background: #f8fafc; font-weight: 700; }
            .totals { float: right; width: 280px; margin-top: 10px; }
            .totals table td { border: none; padding: 3px 6px; }
            .grand-total { font-size: 14px; font-weight: 800; color: #0284c7; border-top: 1px solid #0284c7; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0; color:#0284c7;">SHIVDHARA MEDICAL STORE</h2>
            <p style="margin:2px 0; font-size:11px;">PURCHASE INVOICE / CHALLAN TO BILL VOUCHER</p>
          </div>
          <div class="meta">
            <div>
              <strong>Party:</strong> ${bill.partyName || "N/A"}<br/>
              <strong>Bill No:</strong> ${bill.billNo || "—"} | <strong>Bill Date:</strong> ${bill.billDate || "—"}
            </div>
            <div style="text-align:right;">
              <strong>Entry No:</strong> [G] ${bill.entryNo || "—"}<br/>
              <strong>Entry Date:</strong> ${bill.entryDate || "—"}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Item Name</th><th>Batch</th><th>Exp</th><th>MRP</th><th>Qty</th><th>Free</th><th>PTR</th><th>Disc%</th><th>GST%</th><th>Chn Ref</th><th>Net Amt</th>
              </tr>
            </thead>
            <tbody>
              ${(bill.items || []).map((it: any, i: number) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${it.itemName}</td>
                  <td>${it.batchNo || "—"}</td>
                  <td>${it.expiryDate || "—"}</td>
                  <td style="text-align:right;">₹${fmt(it.mrp)}</td>
                  <td style="text-align:center;">${it.qty}</td>
                  <td style="text-align:center;">${it.freeQty || 0}</td>
                  <td style="text-align:right;">₹${fmt(it.ptr)}</td>
                  <td style="text-align:center;">${it.disc || 0}%</td>
                  <td style="text-align:center;">${it.gst || 0}%</td>
                  <td style="text-align:center;">${it.refChallanNo || "—"}</td>
                  <td style="text-align:right; font-weight:700;">₹${fmt(it.amount)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="totals">
            <table>
              <tr><td>Taxable Subtotal:</td><td style="text-align:right;">₹${fmt(bill.subtotal - (bill.totalDisc || 0))}</td></tr>
              <tr><td>Total GST:</td><td style="text-align:right;">₹${fmt(bill.totalGst)}</td></tr>
              ${bill.crNoteDeduction ? `<tr><td style="color:#ef4444;">Less Cr Note:</td><td style="text-align:right; color:#ef4444;">-₹${fmt(bill.crNoteDeduction)}</td></tr>` : ''}
              <tr class="grand-total"><td>Net Total:</td><td style="text-align:right;">₹${fmt(bill.total)}</td></tr>
            </table>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    pw.document.close();
  };

  const activeItem = billItems[activeItemIdx] || billItems[0] || {};
  const activeMasterItem = items.find((i: any) => i.id === activeItem.itemId || i.name === activeItem.itemName);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden", background: "#f8fafc", color: "var(--color-text-dark)", fontSize: "12px", boxSizing: "border-box" }}>
      
      {/* ─── TOP BAR WITH BREADCRUMB & CHALLANS SUMMARY ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 14px", background: "white", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🧾</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
              Purchase Chln to Bill
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontWeight: "700" }}>Challan to Bill</span>
            </h2>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              Convert delivery challans & adjust credit notes into official Purchase Invoices
            </div>
          </div>
        </div>

        {/* Global Search / Bill lookup */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: "8px", top: "7px", color: "#64748b" }} />
            <input
              placeholder="Search Bill# / Party / Date..."
              value={billSearch}
              onChange={e => {
                setBillSearch(e.target.value);
                setBillSearchDropdown(true);
              }}
              style={{ ...inp, paddingLeft: "26px", width: "220px", height: "26px", fontSize: "11px" }}
            />
            {billSearchDropdown && billSearch && (
              <div style={{ position: "absolute", right: 0, top: "28px", width: "280px", background: "white", border: "1px solid var(--color-border)", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: "200px", overflowY: "auto" }}>
                {(purchaseBills || [])
                  .filter((b: any) => (b.billNo || "").toLowerCase().includes(billSearch.toLowerCase()) || (b.partyName || "").toLowerCase().includes(billSearch.toLowerCase()))
                  .map((b: any, idx: number) => (
                    <div
                      key={b.id || idx}
                      onClick={() => {
                        setPreviewBill(b);
                        setShowPreviewModal(true);
                        setBillSearchDropdown(false);
                      }}
                      style={{ padding: "6px 10px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: "11px", display: "flex", justifyContent: "space-between" }}
                      className="hover:bg-slate-50"
                    >
                      <div>
                        <strong>#{b.billNo}</strong> - {b.partyName}
                        <div style={{ fontSize: "10px", color: "#64748b" }}>{b.billDate}</div>
                      </div>
                      <div style={{ fontWeight: "700", color: "#16a34a" }}>₹{fmt(b.total)}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setChallanListDrawer(true)}
            style={{ ...btn("#0284c7"), fontSize: "11px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "5px" }}
          >
            <Truck size={13} /> View Challans ({partyChallans.length})
          </button>

          <button
            onClick={() => setActiveSection("purchase_challan")}
            style={{ ...btn("#f1f5f9", "#475569"), border: "1px solid #cbd5e1", fontSize: "11px", padding: "4px 10px" }}
            title="Close and return to Challans"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* ─── MAIN FORM CONTAINER (ZERO SCROLL FIT) ─── */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "8px 12px", gap: "8px", boxSizing: "border-box" }}>
        
        {/* ── HEADER CARD (SPLIT INTO LEFT FORM & RIGHT DUAL-TAB BOX) ── */}
        <div style={{ background: "white", borderRadius: "6px", border: "1px solid var(--color-border)", padding: "8px 12px", display: "grid", gridTemplateColumns: "1fr 380px", gap: "12px", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          
          {/* LEFT SIDE: ENTRY, BILL, PARTY & TAX INPUTS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            
            {/* ROW 1: Entry No, Entry Dt, Live Clock, Bill No, Bill Dt */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>EntryNo:</span>
                <input
                  value={billForm.series}
                  onChange={e => setBillForm({ ...billForm, series: e.target.value.toUpperCase() })}
                  style={{ ...inp, width: "30px", textAlign: "center", fontWeight: "800", height: "24px", fontSize: "11px", padding: "0" }}
                />
                <input
                  value={billForm.entryNo}
                  onChange={e => setBillForm({ ...billForm, entryNo: e.target.value })}
                  style={{ ...inp, width: "95px", fontWeight: "700", height: "24px", fontSize: "11px", padding: "2px 6px" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>EntryDt:</span>
                <input
                  type="date"
                  value={billForm.entryDate}
                  onChange={e => setBillForm({ ...billForm, entryDate: e.target.value })}
                  style={{ ...inp, width: "115px", height: "24px", fontSize: "11px", padding: "1px 4px" }}
                />
                <span style={{ fontSize: "10px", color: "#0284c7", fontWeight: "700", background: "#f0f9ff", padding: "2px 5px", borderRadius: "3px", border: "1px solid #bae6fd", display: "flex", alignItems: "center", gap: "3px" }}>
                  <Clock size={10} /> {billForm.entryTime}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#1e3a8a" }}>Bill No:</span>
                <input
                  value={billForm.billNo}
                  onChange={e => setBillForm({ ...billForm, billNo: e.target.value })}
                  placeholder="Invoice #"
                  style={{ ...inp, width: "100px", height: "24px", fontSize: "11px", fontWeight: "700", borderColor: "#93c5fd" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Bill Dt:</span>
                <input
                  type="date"
                  value={billForm.billDate}
                  onChange={e => setBillForm({ ...billForm, billDate: e.target.value })}
                  style={{ ...inp, width: "115px", height: "24px", fontSize: "11px", padding: "1px 4px" }}
                />
              </div>
            </div>

            {/* ROW 2: Party Name with Live Search & details badge */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", position: "relative" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155", minWidth: "68px" }}>Party Name:</span>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  value={billForm.partyName || supplierSearch}
                  onChange={e => {
                    setSupplierSearch(e.target.value);
                    setBillForm({ ...billForm, partyName: e.target.value });
                    setSupplierDropdown(true);
                  }}
                  onFocus={() => setSupplierDropdown(true)}
                  placeholder="Type Supplier name to view pending Challans & Credit Notes..."
                  style={{ ...inp, width: "100%", height: "24px", fontSize: "11px", fontWeight: "700", boxSizing: "border-box" }}
                />
                {supplierDropdown && (
                  <div style={{ position: "absolute", left: 0, top: "26px", width: "100%", background: "white", border: "1px solid var(--color-border)", borderRadius: "4px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 120, maxHeight: "180px", overflowY: "auto" }}>
                    {suppliers
                      .filter((s: any) => !supplierSearch || (s.name || "").toLowerCase().includes(supplierSearch.toLowerCase()))
                      .map((s: any, idx: number) => {
                        const pCount = (purchaseChallans || []).filter((c: any) => (c.partyName || "").toLowerCase().trim() === (s.name || "").toLowerCase().trim() && c.status !== "Converted to Bill").length;
                        return (
                          <div
                            key={s.id || idx}
                            onClick={() => handleSelectSupplier(s)}
                            style={{ padding: "5px 8px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", fontSize: "11px", display: "flex", justifyContent: "space-between", background: idx === supplierHighlight ? "#f0f9ff" : "white" }}
                          >
                            <div>
                              <strong>{s.name}</strong>
                              <span style={{ fontSize: "10px", color: "#64748b", marginLeft: "6px" }}>{s.area || s.city || ""} {s.mobile ? `· ${s.mobile}` : ""}</span>
                            </div>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              {pCount > 0 && <span style={{ background: "#dcfce7", color: "#166534", fontSize: "9px", padding: "1px 5px", borderRadius: "3px", fontWeight: "700" }}>{pCount} Chln</span>}
                              <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: "700" }}>Bal: ₹{fmt(s.balance || 0)}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Other Details */}
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Other Det.:</span>
              <input
                value={billForm.otherDetails}
                onChange={e => setBillForm({ ...billForm, otherDetails: e.target.value })}
                placeholder="Transporter, LR No, Order Ref..."
                style={{ ...inp, width: "160px", height: "24px", fontSize: "11px" }}
              />
            </div>

            {/* ROW 3: Scheme / Disc, Chn to Bill button, Tax Type, Tax Zone, Checkboxes */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>SCH DISC:</span>
                <input
                  value={billForm.schemeDisc}
                  onChange={e => setBillForm({ ...billForm, schemeDisc: e.target.value })}
                  placeholder="SCH/DISC"
                  style={{ ...inp, width: "70px", height: "24px", fontSize: "11px", padding: "2px 4px" }}
                />
                <button
                  type="button"
                  onClick={() => setTopRightTab("challan")}
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    background: topRightTab === "challan" ? "#0284c7" : "#e0f2fe",
                    color: topRightTab === "challan" ? "white" : "#0369a1",
                    border: "1px solid #7dd3fc",
                    borderRadius: "4px",
                    padding: "2px 6px",
                    cursor: "pointer",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px"
                  }}
                  title="Switch to Challan table [F6]"
                >
                  Chn to Bill
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Tax:</span>
                <select
                  value={billForm.taxType}
                  onChange={e => setBillForm({ ...billForm, taxType: e.target.value })}
                  style={{ ...inp, width: "85px", height: "24px", fontSize: "11px", padding: "1px 4px" }}
                >
                  <option value="exclusive">Exclusive</option>
                  <option value="inclusive">Inclusive</option>
                </select>
              </div>

              <select
                value={billForm.taxZone}
                onChange={e => setBillForm({ ...billForm, taxZone: e.target.value })}
                style={{ ...inp, width: "155px", height: "24px", fontSize: "11px", fontWeight: "600", padding: "1px 4px" }}
              >
                <option value="sgst_ugst">RD (Within State - SGST/CGST)</option>
                <option value="igst">RD (Outside State - IGST)</option>
                <option value="exempt">Tax Exempt</option>
              </select>

              <label style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                <input
                  type="checkbox"
                  checked={!!billForm.gstOnFree}
                  onChange={e => setBillForm({ ...billForm, gstOnFree: e.target.checked })}
                  style={{ width: "12px", height: "12px" }}
                />
                GST ON FREE
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                <input
                  type="checkbox"
                  checked={!!billForm.newMrp}
                  onChange={e => setBillForm({ ...billForm, newMrp: e.target.checked })}
                  style={{ width: "12px", height: "12px" }}
                />
                New MRP
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", cursor: "pointer", color: "#1d4ed8", fontWeight: "700" }}>
                <input
                  type="checkbox"
                  checked={!!billForm.isOrder}
                  onChange={e => setBillForm({ ...billForm, isOrder: e.target.checked })}
                  style={{ width: "12px", height: "12px" }}
                />
                Order / Challan
              </label>
            </div>
          </div>

          {/* RIGHT SIDE: DUAL-TAB PANEL (Credit Note F5 | Challan F6) */}
          <div style={{ display: "flex", flexDirection: "column", border: "1px solid #cbd5e1", borderRadius: "5px", overflow: "hidden", background: "#f8fafc" }}>
            
            {/* TAB HEADERS */}
            <div style={{ display: "flex", borderBottom: "1px solid #cbd5e1", background: "#e2e8f0" }}>
              <button
                type="button"
                onClick={() => setTopRightTab("challan")}
                style={{
                  flex: 1,
                  padding: "4px 6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  border: "none",
                  cursor: "pointer",
                  background: topRightTab === "challan" ? "white" : "transparent",
                  color: topRightTab === "challan" ? "#0284c7" : "#475569",
                  borderBottom: topRightTab === "challan" ? "2px solid #0284c7" : "none",
                }}
              >
                📦 Challan [F6] ({partyChallans.length})
              </button>
              <button
                type="button"
                onClick={() => setTopRightTab("credit_note")}
                style={{
                  flex: 1,
                  padding: "4px 6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  border: "none",
                  cursor: "pointer",
                  background: topRightTab === "credit_note" ? "white" : "transparent",
                  color: topRightTab === "credit_note" ? "#dc2626" : "#475569",
                  borderBottom: topRightTab === "credit_note" ? "2px solid #dc2626" : "none",
                }}
              >
                ↩️ Credit Note [F5] ({partyCrNotes.length})
              </button>
            </div>

            {/* TAB CONTENT: CHALLAN F6 OR CREDIT NOTE F5 */}
            <div style={{ flex: 1, minHeight: "85px", maxHeight: "85px", overflowY: "auto", background: "white", padding: "2px" }}>
              {topRightTab === "challan" ? (
                partyChallans.length === 0 ? (
                  <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "10px" }}>
                    {billForm.partyName ? "No pending challans for this party" : "Select a Party to view pending Challans"}
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9", color: "#475569", textAlign: "left" }}>
                        <th style={{ padding: "2px 4px", width: "24px" }}>YN</th>
                        <th style={{ padding: "2px 4px" }}>No</th>
                        <th style={{ padding: "2px 4px" }}>Date</th>
                        <th style={{ padding: "2px 4px", textAlign: "right" }}>Amount</th>
                        <th style={{ padding: "2px 4px", textAlign: "center" }}>Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partyChallans.map((ch: any) => {
                        const isChecked = selectedChallanIds.includes(ch.id);
                        return (
                          <tr
                            key={ch.id}
                            onClick={() => toggleChallanSelection(ch)}
                            style={{
                              cursor: "pointer",
                              background: isChecked ? "#eff6ff" : "white",
                              borderBottom: "1px solid #f1f5f9",
                            }}
                          >
                            <td style={{ padding: "2px 4px", textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // Handled by tr onClick
                                style={{ cursor: "pointer" }}
                              />
                            </td>
                            <td style={{ padding: "2px 4px", fontWeight: "700" }}>#{ch.challanNo || ch.entryNo}</td>
                            <td style={{ padding: "2px 4px", color: "#64748b" }}>{ch.challanDate || ch.entryDate}</td>
                            <td style={{ padding: "2px 4px", textAlign: "right", fontWeight: "700", color: "#0284c7" }}>₹{fmt(ch.total)}</td>
                            <td style={{ padding: "2px 4px", textAlign: "center", color: "#64748b" }}>{(ch.items || []).length}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              ) : (
                partyCrNotes.length === 0 ? (
                  <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "10px" }}>
                    {billForm.partyName ? "No pending credit notes for this party" : "Select a Party to view credit notes"}
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                    <thead>
                      <tr style={{ background: "#fef2f2", color: "#991b1b", textAlign: "left" }}>
                        <th style={{ padding: "2px 4px", width: "24px" }}>YN</th>
                        <th style={{ padding: "2px 4px" }}>No</th>
                        <th style={{ padding: "2px 4px" }}>Date</th>
                        <th style={{ padding: "2px 4px", textAlign: "right" }}>Amount</th>
                        <th style={{ padding: "2px 4px" }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partyCrNotes.map((cr: any) => {
                        const isChecked = selectedCrNoteIds.includes(cr.id);
                        return (
                          <tr
                            key={cr.id}
                            onClick={() => toggleCrNoteSelection(cr)}
                            style={{
                              cursor: "pointer",
                              background: isChecked ? "#fee2e2" : "white",
                              borderBottom: "1px solid #f1f5f9",
                            }}
                          >
                            <td style={{ padding: "2px 4px", textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                style={{ cursor: "pointer" }}
                              />
                            </td>
                            <td style={{ padding: "2px 4px", fontWeight: "700" }}>#{cr.entryNo || cr.returnNo}</td>
                            <td style={{ padding: "2px 4px", color: "#64748b" }}>{cr.date || cr.entryDate}</td>
                            <td style={{ padding: "2px 4px", textAlign: "right", fontWeight: "700", color: "#dc2626" }}>₹{fmt(cr.total || cr.amount)}</td>
                            <td style={{ padding: "2px 4px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80px" }}>{cr.reason || "Return"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              )}
            </div>

            {/* QUICK SELECTION FOOTER */}
            <div style={{ padding: "2px 6px", background: "#f1f5f9", borderTop: "1px solid #cbd5e1", fontSize: "9px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
              <span>{selectedChallanIds.length} Chln Included</span>
              {selectedCrNoteIds.length > 0 && <span style={{ color: "#dc2626", fontWeight: "700" }}>Cr Note: -₹{fmt(billForm.crNoteDeduction)}</span>}
            </div>
          </div>
        </div>

        {/* ─── MAIN ITEMS GRID (TABLE WITH EXACT PIXEL-PERFECT COLUMN ALIGNMENT) ─── */}
        <div style={{ flex: 1, minHeight: 0, background: "white", borderRadius: "6px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
          <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              
              {/* TABLE HEADER (EXPLICIT PIXEL WIDTHS) */}
              <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f1f5f9", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <tr style={{ height: "28px", borderBottom: "1px solid #cbd5e1", fontSize: "11px", fontWeight: "700", color: "#334155" }}>
                  <th style={{ width: "32px", minWidth: "32px", textAlign: "center", padding: "2px" }}>No</th>
                  <th style={{ width: "210px", minWidth: "210px", textAlign: "left", padding: "2px 6px" }}>Item Name *</th>
                  <th style={{ width: "55px", minWidth: "55px", textAlign: "center", padding: "2px" }}>Unit</th>
                  <th style={{ width: "85px", minWidth: "85px", textAlign: "left", padding: "2px 4px" }}>Batch</th>
                  <th style={{ width: "68px", minWidth: "68px", textAlign: "center", padding: "2px" }}>Exp Dt</th>
                  <th style={{ width: "68px", minWidth: "68px", textAlign: "right", padding: "2px 4px" }}>Mrp</th>
                  <th style={{ width: "52px", minWidth: "52px", textAlign: "center", padding: "2px" }}>Qty</th>
                  <th style={{ width: "46px", minWidth: "46px", textAlign: "center", padding: "2px" }}>Fr</th>
                  <th style={{ width: "68px", minWidth: "68px", textAlign: "right", padding: "2px 4px" }}>PTR</th>
                  <th style={{ width: "50px", minWidth: "50px", textAlign: "center", padding: "2px" }}>D%</th>
                  <th style={{ width: "65px", minWidth: "65px", textAlign: "right", padding: "2px 4px" }}>Disc</th>
                  <th style={{ width: "70px", minWidth: "70px", textAlign: "right", padding: "2px 4px" }}>BASE</th>
                  <th style={{ width: "58px", minWidth: "58px", textAlign: "center", padding: "2px" }}>Gst%</th>
                  <th style={{ width: "80px", minWidth: "80px", textAlign: "right", padding: "2px 6px" }}>Amount</th>
                  <th style={{ width: "75px", minWidth: "75px", textAlign: "center", padding: "2px" }}>Chn No</th>
                  <th style={{ width: "65px", minWidth: "65px", textAlign: "right", padding: "2px 4px" }}>LP</th>
                  <th style={{ width: "58px", minWidth: "58px", textAlign: "center", padding: "2px" }}>Locat.</th>
                  <th style={{ width: "30px", minWidth: "30px", textAlign: "center", padding: "2px" }}></th>
                </tr>
              </thead>

              {/* TABLE BODY (ROW BY ROW EDITING WITH FULL ENTER-KEY NAVIGATION) */}
              <tbody>
                {billItems.map((pi: any, idx: number) => {
                  const isActive = idx === activeItemIdx;
                  return (
                    <tr
                      key={pi.id || idx}
                      onClick={() => setActiveItemIdx(idx)}
                      style={{
                        background: isActive ? "#eff6ff" : idx % 2 === 0 ? "white" : "#fafafa",
                        borderBottom: "1px solid #e2e8f0",
                        height: "28px",
                      }}
                    >
                      {/* Row No */}
                      <td style={{ width: "32px", minWidth: "32px", textAlign: "center", fontSize: "10px", color: "#64748b", padding: "2px" }}>
                        {idx + 1}
                      </td>

                      {/* Item Name (Searchable dropdown with Arrow Navigation) */}
                      <td style={{ width: "210px", minWidth: "210px", padding: "2px 4px", position: "relative" }}>
                        <input
                          id={`pcb-item-${idx}`}
                          value={pi.itemName || ""}
                          onChange={e => {
                            updateItem(idx, "itemName", e.target.value);
                            setItemSearch({ ...itemSearch, [idx]: e.target.value });
                            setItemDropdown(idx);
                            setItemHighlight({ ...itemHighlight, [idx]: 0 });
                          }}
                          onFocus={e => {
                            setActiveItemIdx(idx);
                            setItemDropdown(idx);
                            const rect = e.target.getBoundingClientRect();
                            setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: 280 });
                          }}
                          onKeyDown={e => {
                            const q = (itemSearch[idx] !== undefined ? itemSearch[idx] : (pi.itemName || "")).toLowerCase();
                            const filtered = items.filter((i: any) => !q || (i.name || "").toLowerCase().includes(q) || (i.brand || "").toLowerCase().includes(q)).slice(0, 10);
                            const curH = itemHighlight[idx] || 0;

                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setItemHighlight({ ...itemHighlight, [idx]: Math.min(filtered.length - 1, curH + 1) });
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              setItemHighlight({ ...itemHighlight, [idx]: Math.max(0, curH - 1) });
                            } else if (e.key === "Enter") {
                              e.preventDefault();
                              if (filtered[curH]) {
                                handleSelectItem(idx, filtered[curH]);
                              } else {
                                document.getElementById(`pcb-unit-${idx}`)?.focus();
                              }
                            }
                          }}
                          placeholder="Type Item Name..."
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 4px", height: "24px", fontSize: "11px", fontWeight: "600" }}
                        />

                        {/* Autocomplete Popup */}
                        {itemDropdown === idx && (
                          <div style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, background: "white", border: "1px solid var(--color-border)", borderRadius: "4px", boxShadow: "0 6px 16px rgba(0,0,0,0.15)", zIndex: 9999, maxHeight: "180px", overflowY: "auto" }}>
                            {(() => {
                              const q = (itemSearch[idx] !== undefined ? itemSearch[idx] : (pi.itemName || "")).toLowerCase();
                              const filtered = items.filter((i: any) => !q || (i.name || "").toLowerCase().includes(q) || (i.brand || "").toLowerCase().includes(q)).slice(0, 10);
                              if (!filtered.length) {
                                return <div style={{ padding: "6px 8px", fontSize: "11px", color: "#94a3b8" }}>No matching medicine</div>;
                              }
                              return filtered.map((itm: any, fIdx: number) => (
                                <div
                                  key={itm.id}
                                  onMouseDown={() => handleSelectItem(idx, itm)}
                                  style={{ padding: "4px 8px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: "11px", background: fIdx === (itemHighlight[idx] || 0) ? "#f0f9ff" : "white" }}
                                >
                                  <div style={{ fontWeight: "700" }}>{itm.name}</div>
                                  <div style={{ fontSize: "10px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                                    <span>{itm.pack || itm.unit || ""} {itm.location ? `· ${itm.location}` : ""}</span>
                                    <span>PTR: ₹{fmt(itm.ptr || itm.purchaseRate)} | Stk: {itm.stock || 0}</span>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        )}
                      </td>

                      {/* Unit */}
                      <td style={{ width: "55px", minWidth: "55px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pcb-unit-${idx}`}
                          value={pi.unit || ""}
                          onChange={e => updateItem(idx, "unit", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pcb-batch-${idx}`)?.focus(); } }}
                          placeholder="Unit"
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                        />
                      </td>

                      {/* Batch */}
                      <td style={{ width: "85px", minWidth: "85px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pcb-batch-${idx}`}
                          value={pi.batchNo || ""}
                          onChange={e => updateItem(idx, "batchNo", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pcb-exp-${idx}`)?.focus(); } }}
                          placeholder="Batch"
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 4px", height: "24px", fontSize: "10px" }}
                        />
                      </td>

                      {/* Exp Dt */}
                      <td style={{ width: "68px", minWidth: "68px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pcb-exp-${idx}`}
                          value={pi.expiryDate || ""}
                          onChange={e => updateItem(idx, "expiryDate", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pcb-mrp-${idx}`)?.focus(); } }}
                          placeholder="MM/YY"
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                        />
                      </td>

                      {/* Mrp */}
                      <td style={{ width: "68px", minWidth: "68px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pcb-mrp-${idx}`}
                          type="number"
                          value={pi.mrp || ""}
                          onChange={e => updateItem(idx, "mrp", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pcb-qty-${idx}`)?.focus(); } }}
                          placeholder="0.00"
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 4px", height: "24px", fontSize: "10px", textAlign: "right" }}
                        />
                      </td>

                      {/* Qty */}
                      <td style={{ width: "52px", minWidth: "52px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pcb-qty-${idx}`}
                          type="number"
                          min="1"
                          value={pi.qty || ""}
                          onChange={e => updateItem(idx, "qty", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pcb-free-${idx}`)?.focus(); } }}
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "11px", textAlign: "center", fontWeight: "700", color: "#1d4ed8" }}
                        />
                      </td>

                      {/* Fr (Free Qty) */}
                      <td style={{ width: "46px", minWidth: "46px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pcb-free-${idx}`}
                          type="number"
                          min="0"
                          value={pi.freeQty || "0"}
                          onChange={e => updateItem(idx, "freeQty", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pcb-ptr-${idx}`)?.focus(); } }}
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                        />
                      </td>

                      {/* PTR (Purchase Rate) */}
                      <td style={{ width: "68px", minWidth: "68px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pcb-ptr-${idx}`}
                          type="number"
                          value={pi.ptr || ""}
                          onChange={e => updateItem(idx, "ptr", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pcb-disc-${idx}`)?.focus(); } }}
                          placeholder="0.00"
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 4px", height: "24px", fontSize: "10px", textAlign: "right", fontWeight: "700" }}
                        />
                      </td>

                      {/* D% */}
                      <td style={{ width: "50px", minWidth: "50px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pcb-disc-${idx}`}
                          type="number"
                          value={pi.disc || "0"}
                          onChange={e => updateItem(idx, "disc", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pcb-gst-${idx}`)?.focus(); } }}
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                        />
                      </td>

                      {/* Disc (Amount) */}
                      <td style={{ width: "65px", minWidth: "65px", padding: "2px 4px", textAlign: "right", fontSize: "10px", color: "#64748b" }}>
                        ₹{fmt(((num(pi.qty) * num(pi.ptr) * num(pi.disc)) / 100))}
                      </td>

                      {/* BASE (Taxable) */}
                      <td style={{ width: "70px", minWidth: "70px", padding: "2px 4px", textAlign: "right", fontSize: "10px", fontWeight: "600", color: "#0f172a" }}>
                        ₹{fmt(pi.base || ((num(pi.qty) * num(pi.ptr)) - ((num(pi.qty) * num(pi.ptr) * num(pi.disc)) / 100)))}
                      </td>

                      {/* Gst% */}
                      <td style={{ width: "58px", minWidth: "58px", padding: "2px", boxSizing: "border-box" }}>
                        <select
                          id={`pcb-gst-${idx}`}
                          value={pi.gst || "5"}
                          onChange={e => updateItem(idx, "gst", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`pcb-loc-${idx}`)?.focus(); } }}
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "1px 1px", height: "24px", fontSize: "10px", textAlign: "center" }}
                        >
                          {GST_RATES.map((r: any) => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>

                      {/* Amount (Net Row Amount) */}
                      <td style={{ width: "80px", minWidth: "80px", padding: "2px 6px", textAlign: "right", fontSize: "11px", fontWeight: "800", color: "#16a34a" }}>
                        ₹{fmt(pi.amount)}
                      </td>

                      {/* Chn No (Ref Challan Badge) */}
                      <td style={{ width: "75px", minWidth: "75px", padding: "2px", textAlign: "center", fontSize: "10px" }}>
                        {pi.refChallanNo ? (
                          <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "1px 4px", borderRadius: "3px", fontWeight: "700", fontSize: "9px" }}>
                            #{pi.refChallanNo}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "9px" }}>Direct</span>
                        )}
                      </td>

                      {/* LP (Last Purchase Rate) */}
                      <td style={{ width: "65px", minWidth: "65px", padding: "2px 4px", textAlign: "right", fontSize: "10px", color: "#64748b" }}>
                        {pi.lastPurchaseRate ? `₹${fmt(pi.lastPurchaseRate)}` : "—"}
                      </td>

                      {/* Locat. (Rack / Location) - LAST INPUT */}
                      <td style={{ width: "58px", minWidth: "58px", padding: "2px", boxSizing: "border-box" }}>
                        <input
                          id={`pcb-loc-${idx}`}
                          value={pi.location || ""}
                          onChange={e => updateItem(idx, "location", e.target.value)}
                          onFocus={() => setActiveItemIdx(idx)}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (idx === billItems.length - 1) {
                                setBillItems(prev => [...prev, emptyItem()]);
                                setTimeout(() => {
                                  document.getElementById(`pcb-item-${idx + 1}`)?.focus();
                                }, 50);
                              } else {
                                document.getElementById(`pcb-item-${idx + 1}`)?.focus();
                              }
                            }
                          }}
                          placeholder="Loc"
                          style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 2px", height: "24px", fontSize: "10px", textAlign: "center" }}
                        />
                      </td>

                      {/* Action (Remove Row) */}
                      <td style={{ width: "30px", minWidth: "30px", textAlign: "center", padding: "2px" }}>
                        <button
                          onClick={() => removeItem(idx)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "2px" }}
                          title="Remove item"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── BOTTOM SPLIT SECTION (LEFT: INSPECTOR + TAX GRID / RIGHT: TOTALS CARD) ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "10px", background: "white", borderRadius: "6px", border: "1px solid var(--color-border)", padding: "8px 12px", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          
          {/* LEFT SIDE: INSPECTOR BADGE, GST GRID & NOTES */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            
            {/* Active Item Inspector */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "3px 8px", background: "#f8fafc", borderRadius: "4px", border: "1px solid #e2e8f0", fontSize: "11px" }}>
              <span style={{ fontWeight: "700", color: "#334155" }}>
                Active: <span style={{ color: "#0284c7" }}>{activeItem.itemName || "No item selected"}</span>
              </span>
              <span style={{ color: "#64748b" }}>Stk: <strong>{activeMasterItem?.stock || 0}</strong></span>
              <span style={{ color: "#64748b" }}>Rack: <strong>{activeItem.location || activeMasterItem?.location || "—"}</strong></span>
              <span style={{ color: "#16a34a", fontWeight: "700" }}>
                Margin: {activeItem.mrp && activeItem.ptr ? `${Math.round(((num(activeItem.mrp) - num(activeItem.ptr)) / num(activeItem.mrp)) * 100)}%` : "—"}
              </span>
            </div>

            {/* GST Breakdown Grid */}
            <div style={{ border: "1px solid #cbd5e1", borderRadius: "4px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", textAlign: "right" }}>
                <thead style={{ background: "#f1f5f9", color: "#475569" }}>
                  <tr>
                    <th style={{ padding: "3px 6px", textAlign: "left" }}>Tax Rate</th>
                    <th style={{ padding: "3px 6px" }}>Base Val</th>
                    <th style={{ padding: "3px 6px" }}>SGST</th>
                    <th style={{ padding: "3px 6px" }}>CGST</th>
                    <th style={{ padding: "3px 6px" }}>IGST</th>
                    <th style={{ padding: "3px 6px" }}>Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {gstBreakdown.filter(g => g.base > 0).map(g => (
                    <tr key={g.rate} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "2px 6px", textAlign: "left", fontWeight: "700" }}>GST {g.rate}%</td>
                      <td style={{ padding: "2px 6px" }}>₹{fmt(g.base)}</td>
                      <td style={{ padding: "2px 6px" }}>₹{fmt(g.sgst)}</td>
                      <td style={{ padding: "2px 6px" }}>₹{fmt(g.cgst)}</td>
                      <td style={{ padding: "2px 6px" }}>₹{fmt(g.igst)}</td>
                      <td style={{ padding: "2px 6px", fontWeight: "700", color: "#0284c7" }}>₹{fmt(g.totalGst)}</td>
                    </tr>
                  ))}
                  {gstBreakdown.filter(g => g.base > 0).length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "3px 6px", textAlign: "center", color: "#94a3b8" }}>No taxable items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Scheme, Disc & Msg Fields */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Sch:</span>
                <input
                  value={billForm.schInput}
                  onChange={e => setBillForm({ ...billForm, schInput: e.target.value })}
                  style={{ ...inp, width: "65px", height: "22px", fontSize: "10px" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Disc:</span>
                <input
                  value={billForm.discInput}
                  onChange={e => setBillForm({ ...billForm, discInput: e.target.value })}
                  style={{ ...inp, width: "65px", height: "22px", fontSize: "10px" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Msg:</span>
                <input
                  value={billForm.msg}
                  onChange={e => setBillForm({ ...billForm, msg: e.target.value })}
                  placeholder="Notes, Transport or Payment comments..."
                  style={{ ...inp, width: "100%", height: "22px", fontSize: "10px" }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: TOTALS CARD MATCHING PAGE 6 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", background: "#f8fafc", padding: "6px 10px", borderRadius: "5px", border: "1px solid #cbd5e1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span style={{ color: "#64748b" }}>TOTAL (Base):</span>
              <span style={{ fontWeight: "700" }}>₹{fmt(subtotal)}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span style={{ color: "#64748b" }}>Less Disc:</span>
              <span style={{ fontWeight: "700", color: "#ef4444" }}>-₹{fmt(totalDisc)}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span style={{ color: "#64748b" }}>Taxable:</span>
              <span style={{ fontWeight: "700" }}>₹{fmt(taxableVal)}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span style={{ color: "#64748b" }}>GST Total:</span>
              <span style={{ fontWeight: "700", color: "#0284c7" }}>+₹{fmt(totalGstSum)}</span>
            </div>

            {crNoteDeduction > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#dc2626", fontWeight: "700" }}>
                <span>Cr Note:</span>
                <span>-₹{fmt(crNoteDeduction)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
              <span style={{ color: "#64748b" }}>Half Scheme:</span>
              <input
                type="number"
                value={billForm.halfScheme || 0}
                onChange={e => setBillForm({ ...billForm, halfScheme: e.target.value })}
                placeholder="0.00"
                style={{ ...inp, width: "65px", height: "19px", fontSize: "10px", textAlign: "right", padding: "1px 4px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
              <span style={{ color: "#64748b" }}>Oct on Free:</span>
              <input
                type="number"
                value={billForm.octOnFree || 0}
                onChange={e => setBillForm({ ...billForm, octOnFree: e.target.value })}
                placeholder="0.00"
                style={{ ...inp, width: "65px", height: "19px", fontSize: "10px", textAlign: "right", padding: "1px 4px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
              <span style={{ color: "#64748b" }}>Other (+/-):</span>
              <input
                type="number"
                value={billForm.otherAdj}
                onChange={e => setBillForm({ ...billForm, otherAdj: e.target.value })}
                placeholder="0.00"
                style={{ ...inp, width: "65px", height: "19px", fontSize: "10px", textAlign: "right", padding: "1px 4px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
              <span style={{ color: "#64748b" }}>TCS Value:</span>
              <input
                type="number"
                value={billForm.tcsValue || 0}
                onChange={e => setBillForm({ ...billForm, tcsValue: e.target.value })}
                placeholder="0.00"
                style={{ ...inp, width: "65px", height: "19px", fontSize: "10px", textAlign: "right", padding: "1px 4px" }}
              />
            </div>

            {/* NET BILL TOTAL BANNER */}
            <div style={{ marginTop: "4px", borderTop: "2px solid #cbd5e1", paddingTop: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a" }}>NET BILL TOTAL:</span>
              <span style={{ fontSize: "17px", fontWeight: "900", color: "#0284c7" }}>
                ₹{fmt(netBillTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* ─── BOTTOM ACTION TOOLBAR ─── */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", borderTop: "1px solid var(--color-border)", paddingTop: "6px", flexShrink: 0 }}>
          <button
            onClick={handleNew}
            style={{ ...btn("#475569"), fontSize: "12px", padding: "5px 12px" }}
          >
            📄 New
          </button>

          <button
            onClick={handleSaveBill}
            style={{ ...btn("#16a34a"), fontSize: "12px", padding: "5px 14px", fontWeight: "700" }}
          >
            <CheckCircle size={14} /> Save & Generate Bill
          </button>

          <button
            onClick={() => printPurchaseBillVoucher({ ...billForm, items: billItems, subtotal, totalGst: totalGstSum, totalDisc, crNoteDeduction, total: netBillTotal })}
            style={{ ...btn("#0284c7"), fontSize: "12px", padding: "5px 10px" }}
          >
            <Printer size={13} /> Print
          </button>

          <button
            onClick={() => setChallanListDrawer(true)}
            style={{ ...btn("#8b5cf6"), fontSize: "12px", padding: "5px 10px" }}
          >
            📦 Challans List ({partyChallans.length})
          </button>

          <button
            onClick={() => { setScannerTarget("purchase_chln_to_bill"); setShowCameraScanner(true); }}
            style={{ ...btn("#0f766e"), fontSize: "12px", padding: "5px 10px" }}
          >
            📷 Scan
          </button>

          <button
            onClick={() => setActiveSection("purchase_challan")}
            style={{ ...btn("#64748b"), fontSize: "12px", padding: "5px 12px" }}
          >
            ✕ Close
          </button>
        </div>

      </div>

      {/* ─── CHALLANS DRAWER (ALL CHALLANS AND CONVERT STATUS) ─── */}
      {challanListDrawer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "650px", background: "white", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-4px 0 20px rgba(0,0,0,0.15)", animation: "slideInRight 0.2s ease" }}>
            
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>📦 Purchase Challans Directory</h3>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Select any challan to automatically convert into a Purchase Bill</div>
              </div>
              <button onClick={() => setChallanListDrawer(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
              {(purchaseChallans || []).length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>No Challans recorded yet</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "6px" }}>Chn #</th>
                      <th style={{ padding: "6px" }}>Date</th>
                      <th style={{ padding: "6px" }}>Party Name</th>
                      <th style={{ padding: "6px", textAlign: "right" }}>Amount</th>
                      <th style={{ padding: "6px", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "6px", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(purchaseChallans || []).map((ch: any) => {
                      const isBilled = ch.status === "Converted to Bill" || ch.status === "BILLED";
                      return (
                        <tr key={ch.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "6px", fontWeight: "700" }}>#{ch.challanNo || ch.entryNo}</td>
                          <td style={{ padding: "6px", color: "#64748b" }}>{ch.challanDate || ch.entryDate}</td>
                          <td style={{ padding: "6px", fontWeight: "600" }}>{ch.partyName}</td>
                          <td style={{ padding: "6px", textAlign: "right", fontWeight: "700", color: "#0284c7" }}>₹{fmt(ch.total)}</td>
                          <td style={{ padding: "6px", textAlign: "center" }}>
                            {isBilled ? (
                              <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                                Billed ({ch.convertedBillNo || "Yes"})
                              </span>
                            ) : (
                              <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                                Pending
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "6px", textAlign: "center" }}>
                            {!isBilled && (
                              <button
                                onClick={() => {
                                  selectChallanForBill(ch);
                                  setChallanListDrawer(false);
                                  showToast(`Loaded Challan #${ch.challanNo || ch.entryNo} into Bill!`);
                                }}
                                style={{ ...btn("#0284c7"), fontSize: "10px", padding: "3px 8px" }}
                              >
                                Convert ➔
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── PREVIEW MODAL ─── */}
      {showPreviewModal && previewBill && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: "650px", background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "12px 16px", background: "#0284c7", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>🧾 Purchase Bill #{previewBill.billNo}</h3>
              <button onClick={() => setShowPreviewModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "12px" }}>
                <div>
                  <strong>Party:</strong> {previewBill.partyName}<br/>
                  <strong>Bill Date:</strong> {previewBill.billDate}
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>Entry No:</strong> [G] {previewBill.entryNo}<br/>
                  <strong>Total:</strong> <span style={{ color: "#16a34a", fontWeight: "800", fontSize: "14px" }}>₹{fmt(previewBill.total)}</span>
                </div>
              </div>

              <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #cbd5e1" }}>
                      <th style={{ padding: "4px 6px" }}>Item</th>
                      <th style={{ padding: "4px 6px" }}>Batch</th>
                      <th style={{ padding: "4px 6px", textAlign: "center" }}>Qty</th>
                      <th style={{ padding: "4px 6px", textAlign: "right" }}>PTR</th>
                      <th style={{ padding: "4px 6px", textAlign: "center" }}>Chn Ref</th>
                      <th style={{ padding: "4px 6px", textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(previewBill.items || []).map((it: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "4px 6px", fontWeight: "600" }}>{it.itemName}</td>
                        <td style={{ padding: "4px 6px" }}>{it.batchNo || "—"}</td>
                        <td style={{ padding: "4px 6px", textAlign: "center" }}>{it.qty}</td>
                        <td style={{ padding: "4px 6px", textAlign: "right" }}>₹{fmt(it.ptr)}</td>
                        <td style={{ padding: "4px 6px", textAlign: "center", color: "#0369a1" }}>{it.refChallanNo ? `#${it.refChallanNo}` : "—"}</td>
                        <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "700" }}>₹{fmt(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
                <button
                  onClick={() => printPurchaseBillVoucher(previewBill)}
                  style={{ ...btn("#0284c7"), fontSize: "12px", padding: "5px 12px" }}
                >
                  <Printer size={13} /> Print Voucher
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  style={{ ...btn("#64748b"), fontSize: "12px", padding: "5px 12px" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
