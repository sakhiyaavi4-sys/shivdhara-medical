// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckCircle, Printer, Trash2, FileText, ArrowRight, Clock, ChevronUp, ChevronDown, Check, AlertCircle, ShoppingCart, RefreshCw, Barcode } from "lucide-react";
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

export default function SaleTransfer({ setScannerTarget, setShowCameraScanner }: any) {
  const { 
    salesBills, saveSalesBills,
    items, batches, doctors, customers,
    showToast, showConfirm, setActiveSection,
    isDateLocked, currentUser, loadAll
  } = useMedicalStore();

  const emptyTransferItem = () => ({
    id: uid(),
    itemId: "",
    itemName: "",
    unit: "10's",
    batchNo: "",
    expiry: "",
    mrp: "",
    rate: "",
    gst: 5,
    qty: 1,
    transferQty: 1,
    amount: 0,
    selected: true,
  });

  // Header State (matching Page 7: Bill/Slip No, Series, Date, Cust No)
  const [billNoInput, setBillNoInput] = useState(() => {
    const yr = new Date().getFullYear();
    const count = (salesBills || []).length + 1;
    return String(count);
  });
  const [billSeries, setBillSeries] = useState("G");
  const [billDate, setBillDate] = useState(today());
  const [custNo, setCustNo] = useState("1");
  const [selectAll, setSelectAll] = useState(true);

  // Items State
  const [transferItems, setTransferItems] = useState<any[]>([emptyTransferItem()]);
  const [activeItemIdx, setActiveItemIdx] = useState(0);

  // Autocomplete / Search state for table
  const [itemSearch, setItemSearch] = useState<any>({});
  const [itemHighlight, setItemHighlight] = useState<any>({});
  const [itemDropdown, setItemDropdown] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 280 });

  // Bottom Form State (matching Page 7 left side: Cash/Debit, A/c Name, Patient, Area, Doctor, Message, Mob)
  const [paymentMode, setPaymentMode] = useState<"cash" | "debit">("cash");
  const [acName, setAcName] = useState("CASH ***");
  const [patientName, setPatientName] = useState("");
  const [patientArea, setPatientArea] = useState("");
  const [doctorName, setDoctorName] = useState("DAKSHA SHANKET PATEL");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("HAVE A FAST RECOVERY & GOOD HEALTH");

  // Summary State (matching Page 7 right side: Direct Bill Total, Less, Other +, Net Amt)
  const [lessDisc, setLessDisc] = useState<number | string>(0);
  const [otherAdj, setOtherAdj] = useState<number | string>(0);

  // Drawers & Modals
  const [showSlipListModal, setShowSlipListModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printedBill, setPrintedBill] = useState<any>(null);

  // Keyboard shortcut listener for F12 (Transfer Item), F9 (Item List), F11 (Focus Code), F1 (Clear Amount)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12") {
        e.preventDefault();
        handleSaveBill();
      } else if (e.key === "F9") {
        e.preventDefault();
        setShowSlipListModal(true);
      } else if (e.key === "F1") {
        e.preventDefault();
        handleClearAll();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [transferItems, billNoInput, patientName, doctorName, paymentMode, lessDisc, otherAdj]);

  // Calculate single row amount
  const calcRowAmount = (row: any) => {
    const q = num(row.transferQty !== undefined ? row.transferQty : row.qty) || 0;
    const r = num(row.rate || row.mrp) || 0;
    return Math.round(q * r * 100) / 100;
  };

  const updateItem = (idx: number, field: string, val: any) => {
    setTransferItems(prev => {
      const updated = [...prev];
      const cur = { ...updated[idx], [field]: val };
      if (field === "transferQty" || field === "rate" || field === "qty" || field === "mrp") {
        cur.amount = calcRowAmount(cur);
      }
      updated[idx] = cur;
      return updated;
    });
  };

  // Select Item from master
  const handleSelectItem = (idx: number, itm: any) => {
    setTransferItems(prev => {
      const updated = [...prev];
      const cur = updated[idx];
      const availBatches = (batches || []).filter((b: any) => b.itemId === itm.id);
      const latestBatch = availBatches.length ? availBatches[0] : null;

      const rateVal = latestBatch?.sRate || itm.sRate || latestBatch?.rate || itm.price || itm.mrp || 0;
      const mrpVal = latestBatch?.mrp || itm.mrp || itm.price || 0;

      const newItem = {
        ...cur,
        itemId: itm.id,
        itemName: itm.name,
        unit: itm.unit || itm.pack || cur.unit || "10's",
        batchNo: latestBatch?.batchNo || cur.batchNo || "BATCH1",
        expiry: latestBatch?.expiryDate || cur.expiry || "12/28",
        mrp: mrpVal,
        rate: rateVal,
        gst: itm.gst || itm.gstRate || 5,
        qty: 1,
        transferQty: 1,
        selected: true,
      };

      newItem.amount = calcRowAmount(newItem);
      updated[idx] = newItem;
      return updated;
    });

    setItemDropdown(null);
    setTimeout(() => {
      document.getElementById(`st-batch-${idx}`)?.focus();
    }, 50);
  };

  // Add Item
  const handleAddItem = () => {
    setTransferItems(prev => [...prev, emptyTransferItem()]);
    setTimeout(() => {
      document.getElementById(`st-item-${transferItems.length}`)?.focus();
    }, 50);
  };

  // Remove Item
  const handleRemoveActiveItem = () => {
    if (transferItems.length <= 1) {
      setTransferItems([emptyTransferItem()]);
      return;
    }
    setTransferItems(prev => prev.filter((_, i) => i !== activeItemIdx));
    setActiveItemIdx(Math.max(0, activeItemIdx - 1));
  };

  // Clear All
  const handleClearAll = () => {
    showConfirm("Clear all items and reset transfer form?", () => {
      setTransferItems([emptyTransferItem()]);
      setActiveItemIdx(0);
      setLessDisc(0);
      setOtherAdj(0);
      showToast("Form cleared");
    });
  };

  // Toggle All Item Selection
  const handleToggleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setTransferItems(prev => prev.map(it => ({ ...it, selected: checked })));
  };

  // Calculations for Direct Bill Total
  const activeSelectedItems = transferItems.filter(it => it.selected && it.itemName);
  const baseSubtotal = activeSelectedItems.reduce((sum, it) => {
    const amt = calcRowAmount(it);
    const gPct = num(it.gst) || 0;
    const baseVal = gPct > 0 ? (amt / (1 + gPct / 100)) : amt;
    return sum + baseVal;
  }, 0);

  const totalGstAmount = activeSelectedItems.reduce((sum, it) => {
    const amt = calcRowAmount(it);
    const gPct = num(it.gst) || 0;
    const baseVal = gPct > 0 ? (amt / (1 + gPct / 100)) : amt;
    return sum + (amt - baseVal);
  }, 0);

  const sgstAmount = Math.round((totalGstAmount / 2) * 100) / 100;
  const cgstAmount = Math.round((totalGstAmount / 2) * 100) / 100;
  const grossTotal = Math.round((baseSubtotal + totalGstAmount) * 100) / 100;

  const lessVal = num(lessDisc) || 0;
  const otherVal = num(otherAdj) || 0;
  const netAmount = Math.max(0, Math.round((grossTotal - lessVal + otherVal) * 100) / 100);

  // Load existing Bill/Slip into Transfer
  const loadSlipForTransfer = (slip: any) => {
    if (!slip) return;
    setBillNoInput(slip.billNo ? String(slip.billNo).replace(/\D/g, '') || slip.billNo : slip.id);
    setBillSeries(slip.billSeries || "G");
    setBillDate(slip.date || slip.billDate || today());
    setPatientName(slip.patientName || "");
    setPatientArea(slip.patientArea || slip.area || "");
    setDoctorName(slip.doctorName || "DAKSHA SHANKET PATEL");
    setMobile(slip.mobile || "");
    setAcName(slip.acName || (slip.paymentMode === "debit" ? slip.patientName : "CASH ***"));
    setPaymentMode(slip.paymentMode === "debit" ? "debit" : "cash");

    const loadedItems = (slip.items || []).map((it: any) => ({
      id: uid(),
      itemId: it.itemId || "",
      itemName: it.itemName || "",
      unit: it.unit || "10's",
      batchNo: it.batchNo || "",
      expiry: it.expiry || it.expiryDate || "",
      mrp: it.mrp || "",
      rate: it.rate || it.mrp || "",
      gst: it.gst || 5,
      qty: it.qty || 1,
      transferQty: it.qty || 1,
      amount: it.amount || (num(it.qty) * num(it.rate || it.mrp)),
      selected: true,
    }));

    setTransferItems(loadedItems.length ? loadedItems : [emptyTransferItem()]);
    setShowSlipListModal(false);
    showToast(`Loaded Bill #${slip.billNo || slip.id} into Sale Transfer!`);
  };

  // Save Bill / Official Sale Bill Conversion
  const handleSaveBill = async () => {
    const lockCheck = isDateLocked("sales", billDate);
    if (lockCheck.isLocked) {
      showToast(`🔒 Sales date is locked from ${lockCheck.from} to ${lockCheck.to} by Supervisor!`, "error");
      return;
    }

    const itemsToSave = transferItems.filter(it => it.selected && it.itemName && num(it.transferQty) > 0);
    if (!itemsToSave.length) {
      showToast("Please add or select at least 1 item to transfer!", "error");
      return;
    }

    const finalBillNo = `${billSeries}-${billNoInput || (salesBills.length + 1)}`;
    const newBill = {
      id: uid(),
      billNo: finalBillNo,
      billSeries,
      date: billDate,
      billDate,
      custNo,
      paymentMode,
      acName: paymentMode === "debit" ? (patientName || acName) : acName,
      patientName: patientName || "Counter Customer",
      patientArea,
      doctorName,
      mobile,
      billMsg: message,
      items: itemsToSave.map(it => ({
        ...it,
        qty: it.transferQty,
        amount: calcRowAmount(it),
      })),
      baseSubtotal,
      sgst: sgstAmount,
      cgst: cgstAmount,
      totalGst: totalGstAmount,
      lessDisc: lessVal,
      otherAdj: otherVal,
      total: netAmount,
      status: paymentMode === "cash" ? "Paid" : "Credit",
      transferType: "Direct Sale Transfer",
      createdAt: new Date().toISOString(),
    };

    try {
      saveSalesBills([newBill, ...(salesBills || [])]);
      showToast(`✅ Sale Bill #${finalBillNo} generated successfully!`);
      setPrintedBill(newBill);
      setShowPrintModal(true);

      // Increment Entry / Bill No for next entry
      setBillNoInput(String(parseInt(billNoInput || "0") + 1));
      setTransferItems([emptyTransferItem()]);
      setLessDisc(0);
      setOtherAdj(0);
    } catch (e: any) {
      console.error(e);
      showToast("Error saving sale bill: " + e.message, "error");
    }
  };

  // Voucher Print preview
  const printSalesVoucher = (bill: any) => {
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`
      <html>
        <head>
          <title>Sale Bill - ${bill.billNo}</title>
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
            <p style="margin:2px 0; font-size:11px;">RETAIL / CASH SALE INVOICE (SALE TRANSFER)</p>
          </div>
          <div class="meta">
            <div>
              <strong>Patient:</strong> ${bill.patientName || "Cash Customer"} ${bill.mobile ? `(${bill.mobile})` : ""}<br/>
              <strong>Doctor:</strong> ${bill.doctorName || "—"}<br/>
              <strong>Area:</strong> ${bill.patientArea || "—"}
            </div>
            <div style="text-align:right;">
              <strong>Bill No:</strong> [${bill.billSeries || "G"}] #${bill.billNo}<br/>
              <strong>Date:</strong> ${bill.date || today()}<br/>
              <strong>Mode:</strong> ${bill.paymentMode?.toUpperCase()}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Item Name</th><th>Batch</th><th>Exp</th><th>MRP</th><th>Rate</th><th>Qty</th><th>GST%</th><th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${(bill.items || []).map((it: any, i: number) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${it.itemName}</td>
                  <td>${it.batchNo || "—"}</td>
                  <td>${it.expiry || "—"}</td>
                  <td style="text-align:right;">₹${fmt(it.mrp)}</td>
                  <td style="text-align:right;">₹${fmt(it.rate)}</td>
                  <td style="text-align:center;">${it.qty}</td>
                  <td style="text-align:center;">${it.gst || 5}%</td>
                  <td style="text-align:right; font-weight:700;">₹${fmt(it.amount)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="totals">
            <table>
              <tr><td>Taxable Base:</td><td style="text-align:right;">₹${fmt(bill.baseSubtotal || bill.total)}</td></tr>
              <tr><td>SGST:</td><td style="text-align:right;">₹${fmt(bill.sgst || 0)}</td></tr>
              <tr><td>CGST:</td><td style="text-align:right;">₹${fmt(bill.cgst || 0)}</td></tr>
              ${bill.lessDisc ? `<tr><td>Less Disc:</td><td style="text-align:right; color:#ef4444;">-₹${fmt(bill.lessDisc)}</td></tr>` : ''}
              <tr class="grand-total"><td>Net Total:</td><td style="text-align:right;">₹${fmt(bill.total)}</td></tr>
            </table>
          </div>
          <div style="clear:both; margin-top:20px; font-size:11px; text-align:center; color:#64748b;">
            ${bill.billMsg || "HAVE A FAST RECOVERY & GOOD HEALTH"}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    pw.document.close();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "calc(100vh - 120px)", width: "100%", background: "transparent", color: "var(--color-text-dark)", fontSize: "12px", boxSizing: "border-box" }}>
      
      {/* ── TOP HEADER / TOOLBAR MATCHING PAGE 7 ── */}
      <div style={{ background: "white", borderRadius: "8px", border: "1px solid var(--color-border)", padding: "8px 12px", marginBottom: "8px", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", gap: "8px" }}>
        
        {/* ROW 1: Bill No, Series, Date, View, List, Clear All, Remove Item, All Item, Barcode, Close, Shortcuts */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            
            {/* Title / Section Badge */}
            <span style={{ fontWeight: "800", fontSize: "15px", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "6px", marginRight: "6px" }}>
              <RefreshCw size={17} /> Sale Transfer
              <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontWeight: "700" }}>
                GST Sale Transfer
              </span>
            </span>

            {/* Bill / Entry No Input */}
            <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--color-border)", gap: "4px" }}>
              <input
                value={billNoInput}
                onChange={e => setBillNoInput(e.target.value)}
                placeholder="No"
                style={{ ...inp, width: "55px", textAlign: "center", fontWeight: "800", height: "24px", fontSize: "12px", padding: "0" }}
              />
              <input
                value={billSeries}
                onChange={e => setBillSeries(e.target.value.toUpperCase())}
                style={{ ...inp, width: "24px", textAlign: "center", fontWeight: "800", height: "24px", fontSize: "12px", padding: "0" }}
                title="Series"
              />
            </div>

            {/* Date Field */}
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Date:</span>
              <input
                type="date"
                value={billDate}
                onChange={e => setBillDate(e.target.value)}
                style={{ ...inp, width: "115px", height: "24px", fontSize: "11px", padding: "1px 4px" }}
              />
            </div>

            {/* View / Find Button */}
            <button
              onClick={() => {
                const found = (salesBills || []).find(b => String(b.billNo).includes(billNoInput));
                if (found) loadSlipForTransfer(found);
                else showToast(`No bill found matching #${billNoInput}`, "error");
              }}
              style={{ ...btn("#f1f5f9", "#334155"), border: "1px solid #cbd5e1", fontSize: "11px", padding: "3px 8px", height: "24px" }}
            >
              View
            </button>

            {/* List Button */}
            <button
              onClick={() => setShowSlipListModal(true)}
              style={{ ...btn("#0284c7"), fontSize: "11px", padding: "3px 10px", height: "24px", fontWeight: "700" }}
            >
              List [F9]
            </button>

            {/* Clear All */}
            <button
              onClick={handleClearAll}
              style={{ ...btn("#fee2e2", "#b91c1c"), border: "1px solid #fca5a5", fontSize: "11px", padding: "3px 8px", height: "24px" }}
            >
              Clear All
            </button>

            {/* Remove Item */}
            <button
              onClick={handleRemoveActiveItem}
              style={{ ...btn("#f8fafc", "#dc2626"), border: "1px solid #cbd5e1", fontSize: "11px", padding: "3px 8px", height: "24px" }}
            >
              Remove Item
            </button>

            {/* All Item Checkbox */}
            <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "700", marginLeft: "4px" }}>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={e => handleToggleSelectAll(e.target.checked)}
                style={{ width: "13px", height: "13px", cursor: "pointer" }}
              />
              All Item
            </label>

            {/* Barcode Scanner */}
            <button
              onClick={() => {
                if (setScannerTarget && setShowCameraScanner) {
                  setScannerTarget("sale_transfer");
                  setShowCameraScanner(true);
                } else {
                  showToast("Barcode scanner ready - scan items or enter code!");
                }
              }}
              style={{ ...btn("#f0fdf4", "#15803d"), border: "1px solid #bbf7d0", fontSize: "11px", padding: "3px 8px", height: "24px", display: "flex", alignItems: "center", gap: "3px" }}
            >
              <Barcode size={13} /> Barcode
            </button>
          </div>

          {/* RIGHT SHORTCUTS & CLOSE BUTTON */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", gap: "6px", fontSize: "10px", color: "#64748b", fontWeight: "700" }}>
              <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "3px", border: "1px solid #e2e8f0" }}>F12 - Transfer Item</span>
              <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "3px", border: "1px solid #e2e8f0" }}>F11 - Item Code</span>
              <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "3px", border: "1px solid #e2e8f0" }}>F9 - Item List</span>
            </div>

            <button
              onClick={() => setActiveSection("sales_pos")}
              style={{ ...btn("#f1f5f9", "#475569"), border: "1px solid #cbd5e1", fontSize: "11px", padding: "3px 10px", height: "24px" }}
              title="Close Sale Transfer"
            >
              ✕ Close
            </button>
          </div>

        </div>

        {/* ROW 2: F1 Clear Amount & Cust No */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "6px" }}>
          <button
            onClick={() => { setLessDisc(0); setOtherAdj(0); showToast("Amount fields reset [F1]"); }}
            style={{ fontSize: "10px", color: "#0369a1", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "3px", padding: "2px 6px", cursor: "pointer", fontWeight: "700" }}
          >
            F1 Clear Amount
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Cust No:</span>
            <input
              value={custNo}
              onChange={e => setCustNo(e.target.value)}
              style={{ ...inp, width: "40px", textAlign: "center", height: "22px", fontSize: "11px", padding: "0" }}
            />
          </div>

          <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "auto" }}>
            Items: <strong>{activeSelectedItems.length}</strong> / {transferItems.length} selected
          </span>
        </div>

      </div>

      {/* ── MAIN ITEMS GRID TABLE (MATCHING PAGE 7 COLUMNS) ── */}
      <div style={{ background: "white", borderRadius: "8px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", flex: 1, minHeight: "220px", overflow: "hidden", marginBottom: "8px" }}>
        
        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            
            {/* Table Header */}
            <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f1f5f9", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              <tr style={{ height: "28px", borderBottom: "1px solid #cbd5e1", fontSize: "11px", fontWeight: "700", color: "#334155" }}>
                <th style={{ width: "32px", minWidth: "32px", textAlign: "center", padding: "2px" }}>YN</th>
                <th style={{ width: "32px", minWidth: "32px", textAlign: "center", padding: "2px" }}>No</th>
                <th style={{ width: "240px", minWidth: "240px", textAlign: "left", padding: "2px 6px" }}>Item Name *</th>
                <th style={{ width: "65px", minWidth: "65px", textAlign: "center", padding: "2px" }}>Unit</th>
                <th style={{ width: "85px", minWidth: "85px", textAlign: "left", padding: "2px 4px" }}>Batch</th>
                <th style={{ width: "70px", minWidth: "70px", textAlign: "center", padding: "2px" }}>Exp.</th>
                <th style={{ width: "75px", minWidth: "75px", textAlign: "right", padding: "2px 4px" }}>Mrp</th>
                <th style={{ width: "75px", minWidth: "75px", textAlign: "right", padding: "2px 4px" }}>Rate</th>
                <th style={{ width: "55px", minWidth: "55px", textAlign: "center", padding: "2px" }}>Gs%</th>
                <th style={{ width: "55px", minWidth: "55px", textAlign: "center", padding: "2px" }}>Qty</th>
                <th style={{ width: "65px", minWidth: "65px", textAlign: "center", padding: "2px" }}>Q (Trf)</th>
                <th style={{ width: "85px", minWidth: "85px", textAlign: "right", padding: "2px 6px" }}>Amount</th>
                <th style={{ width: "35px", minWidth: "35px", textAlign: "center", padding: "2px" }}></th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {transferItems.map((it: any, idx: number) => {
                const isActive = idx === activeItemIdx;
                return (
                  <tr
                    key={it.id || idx}
                    onClick={() => setActiveItemIdx(idx)}
                    style={{
                      background: isActive ? "#eff6ff" : idx % 2 === 0 ? "white" : "#fafafa",
                      borderBottom: "1px solid #e2e8f0",
                      height: "28px",
                    }}
                  >
                    {/* YN Checkbox */}
                    <td style={{ width: "32px", minWidth: "32px", textAlign: "center", padding: "2px" }}>
                      <input
                        type="checkbox"
                        checked={!!it.selected}
                        onChange={e => updateItem(idx, "selected", e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>

                    {/* Row No */}
                    <td style={{ width: "32px", minWidth: "32px", textAlign: "center", fontSize: "10px", color: "#64748b", padding: "2px" }}>
                      {idx + 1}
                    </td>

                    {/* Item Name Autocomplete */}
                    <td style={{ width: "240px", minWidth: "240px", padding: "2px 4px", position: "relative" }}>
                      <input
                        id={`st-item-${idx}`}
                        value={it.itemName || ""}
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
                          const q = (itemSearch[idx] !== undefined ? itemSearch[idx] : (it.itemName || "")).toLowerCase();
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
                              document.getElementById(`st-batch-${idx}`)?.focus();
                            }
                          }
                        }}
                        placeholder="Type Item Name..."
                        style={{ ...inp, width: "100%", boxSizing: "border-box", padding: "2px 4px", height: "24px", fontSize: "11px", fontWeight: "600" }}
                      />

                      {/* Dropdown popup */}
                      {itemDropdown === idx && (
                        <div style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, background: "white", border: "1px solid var(--color-border)", borderRadius: "4px", boxShadow: "0 6px 16px rgba(0,0,0,0.15)", zIndex: 9999, maxHeight: "180px", overflowY: "auto" }}>
                          {(() => {
                            const q = (itemSearch[idx] !== undefined ? itemSearch[idx] : (it.itemName || "")).toLowerCase();
                            const filtered = items.filter((i: any) => !q || (i.name || "").toLowerCase().includes(q) || (i.brand || "").toLowerCase().includes(q)).slice(0, 10);
                            if (!filtered.length) {
                              return <div style={{ padding: "6px 8px", fontSize: "11px", color: "#94a3b8" }}>No item found</div>;
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
                                  <span>MRP: ₹{fmt(itm.mrp || itm.price)} | Stk: {itm.stock || 0}</span>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </td>

                    {/* Unit */}
                    <td style={{ width: "65px", minWidth: "65px", padding: "2px" }}>
                      <input
                        value={it.unit || ""}
                        onChange={e => updateItem(idx, "unit", e.target.value)}
                        style={{ ...inp, width: "100%", height: "24px", fontSize: "10px", textAlign: "center", padding: "2px" }}
                      />
                    </td>

                    {/* Batch */}
                    <td style={{ width: "85px", minWidth: "85px", padding: "2px" }}>
                      <input
                        id={`st-batch-${idx}`}
                        value={it.batchNo || ""}
                        onChange={e => updateItem(idx, "batchNo", e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`st-exp-${idx}`)?.focus(); } }}
                        style={{ ...inp, width: "100%", height: "24px", fontSize: "10px", padding: "2px 4px" }}
                      />
                    </td>

                    {/* Exp. */}
                    <td style={{ width: "70px", minWidth: "70px", padding: "2px" }}>
                      <input
                        id={`st-exp-${idx}`}
                        value={it.expiry || ""}
                        onChange={e => updateItem(idx, "expiry", e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`st-mrp-${idx}`)?.focus(); } }}
                        placeholder="MM/YY"
                        style={{ ...inp, width: "100%", height: "24px", fontSize: "10px", textAlign: "center", padding: "2px" }}
                      />
                    </td>

                    {/* Mrp */}
                    <td style={{ width: "75px", minWidth: "75px", padding: "2px" }}>
                      <input
                        id={`st-mrp-${idx}`}
                        type="number"
                        value={it.mrp || ""}
                        onChange={e => updateItem(idx, "mrp", e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`st-rate-${idx}`)?.focus(); } }}
                        style={{ ...inp, width: "100%", height: "24px", fontSize: "10px", textAlign: "right", padding: "2px 4px" }}
                      />
                    </td>

                    {/* Rate */}
                    <td style={{ width: "75px", minWidth: "75px", padding: "2px" }}>
                      <input
                        id={`st-rate-${idx}`}
                        type="number"
                        value={it.rate || ""}
                        onChange={e => updateItem(idx, "rate", e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`st-tqty-${idx}`)?.focus(); } }}
                        style={{ ...inp, width: "100%", height: "24px", fontSize: "10px", textAlign: "right", fontWeight: "700", padding: "2px 4px" }}
                      />
                    </td>

                    {/* Gs% */}
                    <td style={{ width: "55px", minWidth: "55px", padding: "2px" }}>
                      <select
                        value={it.gst || 5}
                        onChange={e => updateItem(idx, "gst", e.target.value)}
                        style={{ ...inp, width: "100%", height: "24px", fontSize: "10px", textAlign: "center", padding: "1px" }}
                      >
                        {GST_RATES.map((r: any) => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </td>

                    {/* Qty (Original Slip Qty) */}
                    <td style={{ width: "55px", minWidth: "55px", padding: "2px", textAlign: "center", fontSize: "11px", fontWeight: "600", color: "#64748b" }}>
                      {it.qty || 1}
                    </td>

                    {/* Q (Transfer Qty) */}
                    <td style={{ width: "65px", minWidth: "65px", padding: "2px" }}>
                      <input
                        id={`st-tqty-${idx}`}
                        type="number"
                        min="1"
                        value={it.transferQty !== undefined ? it.transferQty : 1}
                        onChange={e => updateItem(idx, "transferQty", e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (idx === transferItems.length - 1) {
                              handleAddItem();
                            } else {
                              document.getElementById(`st-item-${idx + 1}`)?.focus();
                            }
                          }
                        }}
                        style={{ ...inp, width: "100%", height: "24px", fontSize: "11px", textAlign: "center", fontWeight: "800", color: "#1d4ed8", padding: "2px" }}
                      />
                    </td>

                    {/* Amount */}
                    <td style={{ width: "85px", minWidth: "85px", padding: "2px 6px", textAlign: "right", fontSize: "11px", fontWeight: "800", color: "#16a34a" }}>
                      ₹{fmt(calcRowAmount(it))}
                    </td>

                    {/* Action Trash */}
                    <td style={{ width: "35px", minWidth: "35px", textAlign: "center", padding: "2px" }}>
                      <button
                        onClick={() => {
                          if (transferItems.length === 1) {
                            setTransferItems([emptyTransferItem()]);
                          } else {
                            setTransferItems(transferItems.filter((_, i) => i !== idx));
                          }
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "2px" }}
                        title="Remove row"
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

        {/* Add Row Button at bottom of table */}
        <div style={{ padding: "4px 8px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={handleAddItem}
            style={{ ...btn("#f1f5f9", "#334155"), border: "1px solid #cbd5e1", fontSize: "11px", padding: "2px 8px" }}
          >
            + Add Row
          </button>
          <span style={{ fontSize: "10px", color: "#64748b" }}>
            Press <strong>Enter</strong> on Transfer Qty to automatically add and focus next row
          </span>
        </div>

      </div>

      {/* ── BOTTOM SECTION MATCHING PAGE 7 (SPLIT: BILL DETAILS & DIRECT BILL TOTAL) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "10px", background: "white", borderRadius: "8px", border: "1px solid var(--color-border)", padding: "10px 14px", boxShadow: "var(--shadow-card)", flexShrink: 0 }}>
        
        {/* LEFT PANEL: SAVE BUTTON, CASH/DEBIT, A/C NAME, PATIENT, AREA, DOCTOR, MSG, MOB */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          
          {/* Top Line: Save Bill Button, Date, Cash/Debit Radios */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
            
            <button
              onClick={handleSaveBill}
              style={{ ...btn("#16a34a"), fontSize: "12px", padding: "5px 16px", fontWeight: "800", display: "flex", alignItems: "center", gap: "5px" }}
            >
              <CheckCircle size={14} /> Save Bill [F12]
            </button>

            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155", background: "#f8fafc", padding: "3px 8px", borderRadius: "4px", border: "1px solid var(--color-border)" }}>
              📅 {billDate}
            </span>

            {/* Cash / Debit Radios */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "6px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "700", cursor: "pointer", color: paymentMode === "cash" ? "#16a34a" : "#475569" }}>
                <input
                  type="radio"
                  name="pmode"
                  checked={paymentMode === "cash"}
                  onChange={() => {
                    setPaymentMode("cash");
                    setAcName("CASH ***");
                  }}
                  style={{ cursor: "pointer" }}
                />
                Cash
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "700", cursor: "pointer", color: paymentMode === "debit" ? "#dc2626" : "#475569" }}>
                <input
                  type="radio"
                  name="pmode"
                  checked={paymentMode === "debit"}
                  onChange={() => {
                    setPaymentMode("debit");
                    if (acName === "CASH ***") setAcName(patientName || "");
                  }}
                  style={{ cursor: "pointer" }}
                />
                Debit
              </label>
            </div>

            <button
              onClick={() => {
                if (printedBill) printSalesVoucher(printedBill);
                else printSalesVoucher({ billNo: `${billSeries}-${billNoInput}`, billSeries, date: billDate, paymentMode, patientName, patientArea, doctorName, mobile, billMsg: message, items: activeSelectedItems, baseSubtotal, sgst: sgstAmount, cgst: cgstAmount, lessDisc: lessVal, total: netAmount });
              }}
              style={{ ...btn("#0284c7"), fontSize: "11px", padding: "4px 10px", marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Printer size={13} /> Print
            </button>

          </div>

          {/* Form Rows: A/c Name, Patient Name, Patient Area, Doctor Name, Message, Mob */}
          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "5px", alignItems: "center" }}>
            
            {/* A/c Name */}
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>A/c Name :</span>
            <input
              value={acName}
              onChange={e => setAcName(e.target.value)}
              style={{ ...inp, height: "22px", fontSize: "11px", fontWeight: "700" }}
            />

            {/* Patient Name */}
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Patient Name :</span>
            <input
              value={patientName}
              onChange={e => {
                setPatientName(e.target.value);
                if (paymentMode === "debit" && acName === "CASH ***") setAcName(e.target.value);
              }}
              placeholder="Customer / Patient Name..."
              style={{ ...inp, height: "22px", fontSize: "11px", fontWeight: "700" }}
            />

            {/* Patient Area */}
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Patient Area :</span>
            <input
              value={patientArea}
              onChange={e => setPatientArea(e.target.value)}
              placeholder="City, locality, village..."
              style={{ ...inp, height: "22px", fontSize: "11px" }}
            />

            {/* Doctor Name */}
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Doctor Name :</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                placeholder="Doctor Name..."
                style={{ ...inp, height: "22px", fontSize: "11px", fontWeight: "600", flex: 1 }}
              />
              <select
                onChange={e => { if (e.target.value) setDoctorName(e.target.value); }}
                style={{ ...inp, width: "140px", height: "22px", fontSize: "10px" }}
              >
                <option value="">Select Doctor...</option>
                {(doctors || []).map((d: any) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Message & Mob */}
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Message :</span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Invoice footer message..."
                style={{ ...inp, height: "22px", fontSize: "11px", flex: 1 }}
              />
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Mob:</span>
              <input
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="Mobile..."
                style={{ ...inp, width: "100px", height: "22px", fontSize: "11px" }}
              />
            </div>

          </div>

        </div>

        {/* RIGHT PANEL: DIRECT BILL TOTAL TABLE (MATCHING PAGE 7 EXACT GRID) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
          
          <div style={{ fontSize: "11px", fontWeight: "800", color: "#0f172a", borderBottom: "1px solid #cbd5e1", paddingBottom: "3px", textAlign: "center" }}>
            Direct Bill Total
          </div>

          {/* Table: Base | SGST | CGST | Total */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", textAlign: "right" }}>
            <thead>
              <tr style={{ background: "#e2e8f0", color: "#334155" }}>
                <th style={{ padding: "3px 4px" }}>Base</th>
                <th style={{ padding: "3px 4px" }}>SGST</th>
                <th style={{ padding: "3px 4px" }}>CGST</th>
                <th style={{ padding: "3px 4px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: "white", borderBottom: "1px solid #cbd5e1", fontWeight: "700" }}>
                <td style={{ padding: "4px" }}>₹{fmt(baseSubtotal)}</td>
                <td style={{ padding: "4px", color: "#0284c7" }}>₹{fmt(sgstAmount)}</td>
                <td style={{ padding: "4px", color: "#0284c7" }}>₹{fmt(cgstAmount)}</td>
                <td style={{ padding: "4px", color: "#16a34a" }}>₹{fmt(grossTotal)}</td>
              </tr>
            </tbody>
          </table>

          {/* Less (Discount) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", marginTop: "2px" }}>
            <span style={{ color: "#475569", fontWeight: "600" }}>Less :</span>
            <input
              type="number"
              value={lessDisc}
              onChange={e => setLessDisc(e.target.value)}
              placeholder="0.00"
              style={{ ...inp, width: "80px", height: "20px", fontSize: "11px", textAlign: "right", padding: "1px 4px" }}
            />
          </div>

          {/* Other (+) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
            <span style={{ color: "#475569", fontWeight: "600" }}>Other (+) :</span>
            <input
              type="number"
              value={otherAdj}
              onChange={e => setOtherAdj(e.target.value)}
              placeholder="0.00"
              style={{ ...inp, width: "80px", height: "20px", fontSize: "11px", textAlign: "right", padding: "1px 4px" }}
            />
          </div>

          {/* Net Amt Banner */}
          <div style={{ marginTop: "4px", borderTop: "2px solid #cbd5e1", paddingTop: "5px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a" }}>Net Amt :</span>
            <span style={{ fontSize: "17px", fontWeight: "900", color: "#0284c7" }}>
              ₹{fmt(netAmount)}
            </span>
          </div>

        </div>

      </div>

      {/* ── SLIPS DIRECTORY MODAL (F9 LIST) ── */}
      {showSlipListModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: "700px", maxHeight: "80vh", background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
            
            <div style={{ padding: "12px 16px", background: "#0284c7", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                <RefreshCw size={15} /> Select Bill / Counter Slip to Transfer [F9]
              </h3>
              <button onClick={() => setShowSlipListModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={16} /></button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {(salesBills || []).length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>No existing bills or slips available</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "6px" }}>Bill #</th>
                      <th style={{ padding: "6px" }}>Date</th>
                      <th style={{ padding: "6px" }}>Patient / Party</th>
                      <th style={{ padding: "6px" }}>Doctor</th>
                      <th style={{ padding: "6px", textAlign: "center" }}>Items</th>
                      <th style={{ padding: "6px", textAlign: "right" }}>Amount</th>
                      <th style={{ padding: "6px", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(salesBills || []).map((b: any) => (
                      <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "6px", fontWeight: "700" }}>#{b.billNo || b.id}</td>
                        <td style={{ padding: "6px", color: "#64748b" }}>{b.date || b.billDate}</td>
                        <td style={{ padding: "6px", fontWeight: "600" }}>{b.patientName || "Cash Customer"}</td>
                        <td style={{ padding: "6px", color: "#64748b" }}>{b.doctorName || "—"}</td>
                        <td style={{ padding: "6px", textAlign: "center" }}>{(b.items || []).length}</td>
                        <td style={{ padding: "6px", textAlign: "right", fontWeight: "700", color: "#16a34a" }}>₹{fmt(b.total)}</td>
                        <td style={{ padding: "6px", textAlign: "center" }}>
                          <button
                            onClick={() => loadSlipForTransfer(b)}
                            style={{ ...btn("#0284c7"), fontSize: "10px", padding: "3px 8px" }}
                          >
                            Load ➔
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ padding: "10px 14px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowSlipListModal(false)}
                style={{ ...btn("#64748b"), fontSize: "11px", padding: "4px 12px" }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── PRINT MODAL ── */}
      {showPrintModal && printedBill && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: "550px", background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "12px 16px", background: "#16a34a", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>🧾 Sale Bill Generated #{printedBill.billNo}</h3>
              <button onClick={() => setShowPrintModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ padding: "16px" }}>
              <p style={{ margin: "0 0 12px 0", fontSize: "12px" }}>
                Sale Bill for <strong>{printedBill.patientName}</strong> of <strong>₹{fmt(printedBill.total)}</strong> has been generated successfully.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  onClick={() => printSalesVoucher(printedBill)}
                  style={{ ...btn("#0284c7"), fontSize: "12px", padding: "5px 14px", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Printer size={13} /> Print Voucher
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  style={{ ...btn("#64748b"), fontSize: "12px", padding: "5px 12px" }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
