// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckCircle, Trash2, Plus, ArrowLeft, ArrowRight, Printer, AlertTriangle, Copy, FileText, Check } from "lucide-react";
import { useMedicalStore, today, uid, num, fmt, int, inp, lbl, btn } from './MedicalStoreContext';

export default function StockAdjust() {
  const {
    items, saveItems,
    batches, saveBatches,
    showToast, showConfirm,
    setPrintHtml, appSetupData
  } = useMedicalStore();

  // ─── LOCAL STORAGE PERSISTED STOCK ADJUSTMENT ENTRIES ───
  const [stockAdjustments, setStockAdjustments] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('store_stock_adjustments');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const saveAdjustmentsList = (list: any[]) => {
    setStockAdjustments(list);
    try {
      localStorage.setItem('store_stock_adjustments', JSON.stringify(list));
    } catch (_) {}
  };

  // ─── FORM & VIEW STATE ───
  const [showForm, setShowForm] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFindModal, setShowFindModal] = useState(false);

  // Form Headers
  const [entryNo, setEntryNo] = useState<string>("1");
  const [acName, setAcName] = useState<string>("STOCK ADJUSTMENT");
  const [entryDate, setEntryDate] = useState<string>(today());
  const [message, setMessage] = useState<string>("");

  // Checkboxes from screenshot
  const [chkLocation, setChkLocation] = useState(false);
  const [chkEntry, setChkEntry] = useState(true);
  const [chkBarcode, setChkBarcode] = useState(false);
  const [chkStatus, setChkStatus] = useState(false);

  // Table rows
  const [rows, setRows] = useState<any[]>([
    createEmptyRow(1)
  ]);

  // Active selected row index for keyboard/button actions (Delete row, Duplicate row)
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);

  // Autocomplete state for item search
  const [activeDropdownRow, setActiveDropdownRow] = useState<number | null>(null);
  const [itemSearchText, setItemSearchText] = useState<{ [key: number]: string }>({});

  function createEmptyRow(rowNum: number) {
    return {
      id: uid(),
      no: rowNum,
      itemId: "",
      itemCode: "",
      itemName: "",
      unit: "10'S",
      batch: "",
      batchId: "",
      expiry: "",
      mrp: "0.00",
      sRate: "0.00",
      pRate: "0.00",
      cStock: 0,
      phStock: 0,
      adjust: 0,
      location: ""
    };
  }

  // Calculate Next Entry No
  const getNextEntryNo = () => {
    if (stockAdjustments.length === 0) return "1";
    const max = stockAdjustments.reduce((m, a) => Math.max(m, int(a.entryNo) || 0), 0);
    return String(max + 1);
  };

  // Start a new Adjustment form
  const handleNewEntry = () => {
    setActiveEntryId(null);
    setEntryNo(getNextEntryNo());
    setAcName("STOCK ADJUSTMENT");
    setEntryDate(today());
    setMessage("");
    setRows([createEmptyRow(1)]);
    setSelectedRowIndex(0);
    setShowForm(true);
  };

  // Open an existing entry
  const handleOpenEntry = (entry: any) => {
    if (!entry) return;
    setActiveEntryId(entry.id);
    setEntryNo(String(entry.entryNo || "1"));
    setAcName(entry.acName || "STOCK ADJUSTMENT");
    setEntryDate(entry.entryDate || today());
    setMessage(entry.message || "");
    setRows((entry.items && entry.items.length > 0) ? entry.items : [createEmptyRow(1)]);
    setSelectedRowIndex(0);
    setShowForm(true);
  };

  // Recalculate row adjustment
  const handlePhStockChange = (index: number, val: string) => {
    const phStock = num(val);
    setRows(prev => {
      const next = [...prev];
      const row = { ...next[index] };
      row.phStock = phStock;
      row.adjust = phStock - (row.cStock || 0);
      next[index] = row;
      return next;
    });
  };

  // Select Item for a row
  const handleSelectItem = (index: number, itm: any) => {
    if (!itm) return;
    // Look up batches for this item
    const itmBatches = (batches || []).filter((b: any) => b.itemId === itm.id || b.itemName === itm.name);
    const primaryBatch = itmBatches.length > 0 ? itmBatches[0] : null;

    const currentStock = primaryBatch ? (num(primaryBatch.stock ?? primaryBatch.qty) || 0) : (num(itm.stock) || 0);
    const mrpVal = primaryBatch ? (primaryBatch.mrp || itm.mrp || 0) : (itm.mrp || 0);
    const sRateVal = primaryBatch ? (primaryBatch.sRate || itm.sRate || itm.price || 0) : (itm.sRate || itm.price || 0);
    const pRateVal = primaryBatch ? (primaryBatch.pRate || itm.pRate || 0) : (itm.pRate || 0);
    const batchNo = primaryBatch ? (primaryBatch.batchNo || primaryBatch.batch || "") : (itm.batchNumber || "");
    const expiryVal = primaryBatch ? (primaryBatch.expiryDate || primaryBatch.expiry || "") : (itm.expiryDate || "");

    setRows(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        itemId: itm.id,
        itemCode: itm.code || `ITM-${String(itm.id).slice(-4)}`,
        itemName: itm.name,
        unit: itm.unit || itm.pack || "10'S",
        batch: batchNo,
        batchId: primaryBatch ? primaryBatch.id : "",
        expiry: expiryVal,
        mrp: fmt(mrpVal),
        sRate: fmt(sRateVal),
        pRate: fmt(pRateVal),
        cStock: currentStock,
        phStock: currentStock, // default physical stock equal to current stock
        adjust: 0,
        location: itm.location || ""
      };
      return next;
    });

    setActiveDropdownRow(null);

    // Auto-add an empty row if this was the last row
    if (index === rows.length - 1) {
      setRows(curr => [...curr, createEmptyRow(curr.length + 1)]);
    }
  };

  // Add empty row
  const handleAddRow = () => {
    setRows(prev => [...prev, createEmptyRow(prev.length + 1)]);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) {
      setRows([createEmptyRow(1)]);
      setSelectedRowIndex(0);
      return;
    }
    const filtered = rows.filter((_, i) => i !== index).map((r, i) => ({ ...r, no: i + 1 }));
    setRows(filtered);
    setSelectedRowIndex(Math.max(0, index - 1));
  };

  // Duplicate row
  const handleDuplicateRow = () => {
    const target = rows[selectedRowIndex];
    if (!target || !target.itemName) {
      showToast("Select a row with an item to duplicate!", "error");
      return;
    }
    const cloned = { ...target, id: uid(), no: rows.length + 1 };
    setRows(prev => [...prev, cloned]);
    setSelectedRowIndex(rows.length);
    showToast(`Row #${target.no} duplicated!`);
  };

  // Save Stock Adjustment (Commits difference to items & batches)
  const handleSave = () => {
    const validRows = rows.filter(r => r.itemName && r.itemName.trim() !== "");
    if (validRows.length === 0) {
      showToast("Please enter at least one item before saving!", "error");
      return;
    }

    // Apply adjustments to items & batches
    let updatedItems = [...items];
    let updatedBatches = [...(batches || [])];

    validRows.forEach(row => {
      // 1. Update item total stock
      const itmIdx = updatedItems.findIndex(i => i.id === row.itemId || i.name === row.itemName);
      if (itmIdx !== -1) {
        const item = { ...updatedItems[itmIdx] };
        // Set item stock to entered physical stock
        item.stock = Math.max(0, num(row.phStock));
        if (row.mrp) item.mrp = num(row.mrp);
        if (row.sRate) item.price = num(row.sRate);
        updatedItems[itmIdx] = item;
      }

      // 2. Update specific batch if batch exists
      if (row.batch) {
        const bIdx = updatedBatches.findIndex(b => 
          (row.batchId && b.id === row.batchId) || 
          (b.itemId === row.itemId && (b.batchNo === row.batch || b.batch === row.batch))
        );
        if (bIdx !== -1) {
          const b = { ...updatedBatches[bIdx] };
          b.qty = Math.max(0, num(row.phStock));
          b.stock = Math.max(0, num(row.phStock));
          if (row.mrp) b.mrp = num(row.mrp);
          if (row.sRate) b.sRate = num(row.sRate);
          updatedBatches[bIdx] = b;
        } else if (row.itemId) {
          // Create new batch if didn't exist
          updatedBatches.push({
            id: uid(),
            itemId: row.itemId,
            itemName: row.itemName,
            batchNo: row.batch,
            expiryDate: row.expiry,
            qty: Math.max(0, num(row.phStock)),
            stock: Math.max(0, num(row.phStock)),
            mrp: num(row.mrp),
            sRate: num(row.sRate),
            ptr: num(row.pRate),
            created_at: new Date().toISOString()
          });
        }
      }
    });

    saveItems(updatedItems);
    saveBatches(updatedBatches);

    // Save adjustment record
    const entryRecord = {
      id: activeEntryId || uid(),
      entryNo,
      acName,
      entryDate,
      message,
      items: validRows,
      totalItems: validRows.length,
      totalAdjustUnits: validRows.reduce((sum, r) => sum + (num(r.adjust) || 0), 0),
      totalMrpVal: validRows.reduce((sum, r) => sum + (num(r.mrp) * num(r.phStock)), 0),
      totalLpVal: validRows.reduce((sum, r) => sum + (num(r.pRate) * num(r.phStock)), 0),
      createdAt: new Date().toISOString()
    };

    let updatedList;
    if (activeEntryId) {
      updatedList = stockAdjustments.map(a => a.id === activeEntryId ? entryRecord : a);
    } else {
      updatedList = [entryRecord, ...stockAdjustments];
    }

    saveAdjustmentsList(updatedList);
    setActiveEntryId(entryRecord.id);
    showToast(`✅ Stock Adjustment #${entryNo} saved successfully!`);
  };

  // Delete current adjustment voucher
  const handleDeleteEntry = () => {
    if (!activeEntryId) {
      showToast("This is a new unsaved entry!", "info");
      return;
    }
    showConfirm(`Delete Stock Adjustment #${entryNo}?`, () => {
      const remaining = stockAdjustments.filter(a => a.id !== activeEntryId);
      saveAdjustmentsList(remaining);
      showToast(`Stock Adjustment #${entryNo} deleted!`);
      handleNewEntry();
    });
  };

  // Sequential Navigation: Prev / Next
  const handlePrevEntry = () => {
    if (stockAdjustments.length === 0) return;
    const currentIndex = stockAdjustments.findIndex(a => a.id === activeEntryId);
    if (currentIndex === -1) {
      // Open the latest entry
      handleOpenEntry(stockAdjustments[0]);
    } else if (currentIndex < stockAdjustments.length - 1) {
      handleOpenEntry(stockAdjustments[currentIndex + 1]);
    } else {
      showToast("At oldest adjustment entry", "info");
    }
  };

  const handleNextEntry = () => {
    if (stockAdjustments.length === 0) return;
    const currentIndex = stockAdjustments.findIndex(a => a.id === activeEntryId);
    if (currentIndex > 0) {
      handleOpenEntry(stockAdjustments[currentIndex - 1]);
    } else if (currentIndex === 0) {
      showToast("At newest adjustment entry", "info");
    } else {
      handleOpenEntry(stockAdjustments[0]);
    }
  };

  // Print Stock Adjustment Voucher
  const handlePrint = () => {
    const validRows = rows.filter(r => r.itemName && r.itemName.trim() !== "");
    if (validRows.length === 0) {
      showToast("No items to print!", "error");
      return;
    }

    const mrpTotal = validRows.reduce((sum, r) => sum + (num(r.mrp) * num(r.phStock)), 0);
    const lpTotal = validRows.reduce((sum, r) => sum + (num(r.pRate) * num(r.phStock)), 0);

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px;">
          <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;">SHIV DHARA MEDICAL STORE</h2>
          <p style="margin: 3px 0; font-size: 11px;">20, GIRIRAJ COMPLEX NIKOL GAAM ROAD, NIKOL, AHMEDABAD</p>
          <div style="display: inline-block; background: #0f172a; color: white; padding: 3px 12px; border-radius: 4px; font-weight: bold; font-size: 13px; margin-top: 6px;">
            STOCK ADJUSTMENT VOUCHER
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px;">
          <div>
            <strong>Entry No:</strong> #${entryNo}<br/>
            <strong>A/c Name:</strong> ${acName}<br/>
            <strong>Remarks:</strong> ${message || "N/A"}
          </div>
          <div style="text-align: right;">
            <strong>Entry Date:</strong> ${entryDate}<br/>
            <strong>Print Date:</strong> ${today()}<br/>
            <strong>Status:</strong> Adjusted & Verified
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1px solid #94a3b8;">
              <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">#</th>
              <th style="padding: 6px; text-align: left; border: 1px solid #cbd5e1;">Item Name / Code</th>
              <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">Unit</th>
              <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">Batch</th>
              <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">Expiry</th>
              <th style="padding: 6px; text-align: right; border: 1px solid #cbd5e1;">MRP</th>
              <th style="padding: 6px; text-align: right; border: 1px solid #cbd5e1;">S.Rate</th>
              <th style="padding: 6px; text-align: right; border: 1px solid #cbd5e1;">C.Stock</th>
              <th style="padding: 6px; text-align: right; border: 1px solid #cbd5e1; background: #e0f2fe;">Ph.Stock</th>
              <th style="padding: 6px; text-align: right; border: 1px solid #cbd5e1;">Adjust</th>
            </tr>
          </thead>
          <tbody>
            ${validRows.map((r, i) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 5px; text-align: center; border: 1px solid #cbd5e1;">${i + 1}</td>
                <td style="padding: 5px; border: 1px solid #cbd5e1;"><strong>${r.itemName}</strong> ${r.itemCode ? `(${r.itemCode})` : ''}</td>
                <td style="padding: 5px; text-align: center; border: 1px solid #cbd5e1;">${r.unit}</td>
                <td style="padding: 5px; text-align: center; border: 1px solid #cbd5e1;">${r.batch || '-'}</td>
                <td style="padding: 5px; text-align: center; border: 1px solid #cbd5e1;">${r.expiry || '-'}</td>
                <td style="padding: 5px; text-align: right; border: 1px solid #cbd5e1;">₹${fmt(r.mrp)}</td>
                <td style="padding: 5px; text-align: right; border: 1px solid #cbd5e1;">₹${fmt(r.sRate)}</td>
                <td style="padding: 5px; text-align: right; border: 1px solid #cbd5e1;">${r.cStock}</td>
                <td style="padding: 5px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1; background: #f0f9ff;">${r.phStock}</td>
                <td style="padding: 5px; text-align: right; font-weight: bold; color: ${r.adjust > 0 ? '#16a34a' : r.adjust < 0 ? '#dc2626' : '#64748b'}; border: 1px solid #cbd5e1;">
                  ${r.adjust > 0 ? `+${r.adjust}` : r.adjust}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; margin-bottom: 30px;">
          <div>
            <strong>Total Adjusted Items:</strong> ${validRows.length}<br/>
            <strong>Net Physical Stock Units:</strong> ${validRows.reduce((s, r) => s + num(r.phStock), 0)}
          </div>
          <div style="text-align: right;">
            <strong>MRP Total:</strong> ₹${fmt(mrpTotal)}<br/>
            <strong>LP / Purchase Valuation:</strong> ₹${fmt(lpTotal)}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 50px; padding-top: 10px; font-size: 11px;">
          <div style="border-top: 1px solid #94a3b8; width: 180px; text-align: center;">Verified By (Pharmacist)</div>
          <div style="border-top: 1px solid #94a3b8; width: 180px; text-align: center;">Authorized Signatory</div>
        </div>
      </div>
    `;

    setPrintHtml(html);
  };

  // Keyboard shortcut listener (F2 Save, Esc Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        if (showFindModal) {
          setShowFindModal(false);
        } else if (activeDropdownRow !== null) {
          setActiveDropdownRow(null);
        } else if (showForm) {
          setShowForm(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm, showFindModal, activeDropdownRow, rows, entryNo, acName, entryDate, message]);

  // Calculations for Footer
  const validItems = rows.filter(r => r.itemName && r.itemName.trim() !== "");
  const mrpTotal = validItems.reduce((sum, r) => sum + (num(r.mrp) * num(r.phStock)), 0);
  const lpTotal = validItems.reduce((sum, r) => sum + (num(r.pRate) * num(r.phStock)), 0);
  const totalAdjustDifference = validItems.reduce((sum, r) => sum + (num(r.adjust) || 0), 0);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: CENTER BUTTON (When no form is open) — strictly conforming to Rule #2
  // ══════════════════════════════════════════════════════════════════════════════
  if (!showForm) {
    const filteredEntries = (searchQuery.trim() ? stockAdjustments.filter(a => 
      String(a.entryNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(a.acName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(a.message || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(a.entryDate || "").includes(searchQuery)
    ) : stockAdjustments).slice(0, 15);

    return (
      <div style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header Title with Search Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚖️</span> Stock Adjustment ({stockAdjustments.length})
            </h2>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
              Physical Inventory Count vs System Stock Reconciliation & Variance Audit
            </p>
          </div>

          <div style={{ position: "relative", minWidth: "280px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "8px", color: "#64748b" }} />
            <input
              placeholder="Search Entry#, Date, Remark... + Enter"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && filteredEntries.length > 0) {
                  handleOpenEntry(filteredEntries[0]);
                }
              }}
              style={{ ...inp, paddingLeft: "30px", background: "white" }}
            />
          </div>
        </div>

        {/* ── SINGLE CENTER BUTTON WORKSPACE (Strict Rule #2: Only Center Button) ── */}
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b", background: "white", borderRadius: "10px", border: "1px dashed var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "44px", opacity: 0.8, marginBottom: "8px" }}>⚖️</div>
          <h3 style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "17px", color: "var(--color-text-dark)" }}>
            Physical Stock Adjustment & Reconciliation
          </h3>
          <p style={{ fontSize: "12px", opacity: 0.75, maxWidth: "520px", margin: "0 auto 18px", lineHeight: "1.5" }}>
            Reconcile physical stock counts with system balances. Adjust stock surpluses or deficits item-by-item, record batches, and audit differences.
          </p>

          {/* SINGLE CENTER BUTTON */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button 
              onClick={handleNewEntry} 
              style={{ ...btn("var(--color-primary)"), padding: "10px 22px", fontSize: "14px", fontWeight: "700", borderRadius: "8px" }}
            >
              ➕ New Stock Adjustment
            </button>
          </div>
        </div>

        {/* Recent Stock Adjustments Table */}
        {stockAdjustments.length > 0 && (
          <div style={{ marginTop: "24px", background: "white", borderRadius: "8px", border: "1px solid var(--color-border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                📋 Recent Stock Adjustments ({stockAdjustments.length})
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Click on any entry to view or edit</div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", color: "#475569", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "70px" }}>Entry#</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>A/c Name</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "110px" }}>Entry Date</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "90px" }}>Items</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", width: "110px" }}>Net Adjust Qty</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", width: "120px" }}>MRP Valuation</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Message / Note</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map(entry => (
                    <tr 
                      key={entry.id}
                      onClick={() => handleOpenEntry(entry)}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "700", color: "var(--color-primary)" }}>
                        #{entry.entryNo}
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: "600", color: "#1e293b" }}>
                        {entry.acName || "STOCK ADJUSTMENT"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", color: "#64748b" }}>
                        {entry.entryDate}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", color: "#475569" }}>
                        {entry.totalItems || (entry.items ? entry.items.length : 0)}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: (entry.totalAdjustUnits || 0) >= 0 ? "#16a34a" : "#dc2626" }}>
                        {(entry.totalAdjustUnits || 0) > 0 ? `+${entry.totalAdjustUnits}` : entry.totalAdjustUnits || 0}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "600", color: "#0f172a" }}>
                        ₹{fmt(entry.totalMrpVal || 0)}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#64748b", fontSize: "11px" }}>
                        {entry.message || "-"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenEntry(entry)} 
                          style={{ ...btn("var(--color-primary)"), padding: "3px 8px", fontSize: "11px" }}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: FULL INTERACTIVE STOCK ADJUSTMENT ENTRY FORM (Matches transection.pdf Page 9)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: "white", borderRadius: "8px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", minHeight: "84vh" }}>
      
      {/* ── TOP HEADER / CONTROLS (MATCHES PDF PAGE 9) ── */}
      <div style={{ padding: "8px 12px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        
        {/* Left Inputs: Entry No, A/c Name, Entry Date */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#1e293b" }}>Entry No:</span>
            <input
              type="text"
              value={entryNo}
              onChange={e => setEntryNo(e.target.value)}
              style={{ ...inp, width: "70px", fontWeight: "700", textAlign: "center", color: "var(--color-primary)", height: "26px" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#1e293b" }}>A/c Name:</span>
            <input
              type="text"
              value={acName}
              onChange={e => setAcName(e.target.value)}
              style={{ ...inp, width: "190px", fontWeight: "700", color: "#0f172a", height: "26px" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#1e293b" }}>Ent Dt:</span>
            <input
              type="date"
              value={entryDate}
              onChange={e => setEntryDate(e.target.value)}
              style={{ ...inp, width: "125px", height: "26px", fontSize: "11px", fontWeight: "600" }}
            />
          </div>
        </div>

        {/* Right Red Warning Banner (Matches exact text and red banner from screenshot) */}
        <div style={{
          background: "#dc2626",
          color: "white",
          padding: "4px 12px",
          borderRadius: "4px",
          fontSize: "11px",
          fontWeight: "800",
          letterSpacing: "0.4px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "0 2px 6px rgba(220,38,38,0.3)"
        }}>
          <AlertTriangle size={13} color="white" />
          <span>PLEASE CLEAR STOCK DIFFERENCE BEFORE STARTING STOCK ADJUSTMENT...</span>
        </div>
      </div>

      {/* ── MAIN TABLE / GRID (MATCHES EXACT COLUMNS IN SCREENSHOT) ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#0284c7", color: "white", textAlign: "center", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #0369a1" }}>
              <th style={{ padding: "6px 4px", width: "36px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>No</th>
              <th style={{ padding: "6px 8px", textAlign: "left", minWidth: "260px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Item Name / Item Code</th>
              <th style={{ padding: "6px 4px", width: "65px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Unit</th>
              <th style={{ padding: "6px 6px", width: "95px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Batch</th>
              <th style={{ padding: "6px 6px", width: "75px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Expiry</th>
              <th style={{ padding: "6px 6px", width: "75px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right" }}>Mrp</th>
              <th style={{ padding: "6px 6px", width: "75px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right" }}>SRate</th>
              <th style={{ padding: "6px 6px", width: "75px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right", background: "#0369a1" }}>C.Stock</th>
              <th style={{ padding: "6px 6px", width: "85px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right", background: "#0284c7" }}>Ph. Stock</th>
              <th style={{ padding: "6px 6px", width: "75px", textAlign: "right", background: "#0369a1", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Adjust</th>
              <th style={{ padding: "6px 4px", width: "36px" }}>Act</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isSelected = selectedRowIndex === idx;
              const hasAdjust = row.adjust !== 0;

              return (
                <tr 
                  key={row.id}
                  onClick={() => setSelectedRowIndex(idx)}
                  style={{
                    background: isSelected ? "#eff6ff" : idx % 2 === 0 ? "white" : "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    transition: "background 0.1s"
                  }}
                >
                  {/* No */}
                  <td style={{ textAlign: "center", fontWeight: "700", color: "#64748b", padding: "4px 2px", borderRight: "1px solid #e2e8f0" }}>
                    {idx + 1}
                  </td>

                  {/* Item Name / Item Code with Auto-Complete Dropdown */}
                  <td style={{ padding: "3px 6px", position: "relative", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="text"
                      placeholder="Type Item Name or Code..."
                      value={row.itemName ? (row.itemCode ? `${row.itemName} (${row.itemCode})` : row.itemName) : (itemSearchText[idx] || "")}
                      onChange={e => {
                        const val = e.target.value;
                        setItemSearchText(prev => ({ ...prev, [idx]: val }));
                        setRows(curr => {
                          const nxt = [...curr];
                          nxt[idx] = { ...nxt[idx], itemName: val, itemId: "", itemCode: "" };
                          return nxt;
                        });
                        setActiveDropdownRow(idx);
                      }}
                      onFocus={() => setActiveDropdownRow(idx)}
                      style={{
                        ...inp,
                        height: "25px",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#0f172a",
                        borderColor: isSelected ? "#3b82f6" : "var(--color-border)"
                      }}
                    />

                    {/* Auto-suggest dropdown */}
                    {activeDropdownRow === idx && (
                      <div style={{
                        position: "absolute",
                        top: "32px",
                        left: "6px",
                        width: "380px",
                        background: "white",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                        maxHeight: "220px",
                        overflowY: "auto",
                        zIndex: 999
                      }}>
                        {(() => {
                          const q = (itemSearchText[idx] || row.itemName || "").toLowerCase();
                          const matches = (items || []).filter((i: any) => 
                            !q || (i.name || "").toLowerCase().includes(q) || (i.code || "").toLowerCase().includes(q) || (i.company || "").toLowerCase().includes(q)
                          ).slice(0, 15);

                          if (matches.length === 0) {
                            return <div style={{ padding: "8px 12px", fontSize: "11px", color: "#64748b" }}>No matching items found</div>;
                          }

                          return matches.map((m: any) => (
                            <div
                              key={m.id}
                              onMouseDown={() => handleSelectItem(idx, m)}
                              style={{
                                padding: "6px 10px",
                                borderBottom: "1px solid #f1f5f9",
                                cursor: "pointer",
                                fontSize: "11px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <div>
                                <div style={{ fontWeight: "700", color: "#0f172a" }}>{m.name}</div>
                                <div style={{ fontSize: "10px", color: "#64748b" }}>
                                  Code: {m.code || 'N/A'} | Pack: {m.pack || m.unit || "10's"} | Co: {m.company || "N/A"}
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: "800", color: "#2563eb" }}>Stock: {m.stock || 0}</div>
                                <div style={{ fontSize: "10px", color: "#16a34a" }}>MRP: ₹{fmt(m.mrp)}</div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </td>

                  {/* Unit */}
                  <td style={{ padding: "3px 4px", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="text"
                      value={row.unit || ""}
                      onChange={e => {
                        const val = e.target.value;
                        setRows(curr => {
                          const nxt = [...curr];
                          nxt[idx] = { ...nxt[idx], unit: val };
                          return nxt;
                        });
                      }}
                      style={{ ...inp, height: "25px", fontSize: "11px", textAlign: "center" }}
                    />
                  </td>

                  {/* Batch */}
                  <td style={{ padding: "3px 4px", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="text"
                      placeholder="Batch#"
                      value={row.batch || ""}
                      onChange={e => {
                        const val = e.target.value;
                        setRows(curr => {
                          const nxt = [...curr];
                          nxt[idx] = { ...nxt[idx], batch: val };
                          return nxt;
                        });
                      }}
                      style={{ ...inp, height: "25px", fontSize: "11px", textAlign: "center", fontWeight: "600" }}
                    />
                  </td>

                  {/* Expiry */}
                  <td style={{ padding: "3px 4px", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={row.expiry || ""}
                      onChange={e => {
                        const val = e.target.value;
                        setRows(curr => {
                          const nxt = [...curr];
                          nxt[idx] = { ...nxt[idx], expiry: val };
                          return nxt;
                        });
                      }}
                      style={{ ...inp, height: "25px", fontSize: "11px", textAlign: "center" }}
                    />
                  </td>

                  {/* MRP */}
                  <td style={{ padding: "3px 4px", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="number"
                      step="0.01"
                      value={row.mrp}
                      onChange={e => {
                        const val = e.target.value;
                        setRows(curr => {
                          const nxt = [...curr];
                          nxt[idx] = { ...nxt[idx], mrp: val };
                          return nxt;
                        });
                      }}
                      style={{ ...inp, height: "25px", fontSize: "11px", textAlign: "right" }}
                    />
                  </td>

                  {/* SRate */}
                  <td style={{ padding: "3px 4px", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="number"
                      step="0.01"
                      value={row.sRate}
                      onChange={e => {
                        const val = e.target.value;
                        setRows(curr => {
                          const nxt = [...curr];
                          nxt[idx] = { ...nxt[idx], sRate: val };
                          return nxt;
                        });
                      }}
                      style={{ ...inp, height: "25px", fontSize: "11px", textAlign: "right" }}
                    />
                  </td>

                  {/* C.Stock (Current System Stock) */}
                  <td style={{ padding: "3px 6px", textAlign: "right", fontWeight: "700", color: "#334155", background: "#f1f5f9", borderRight: "1px solid #cbd5e1" }}>
                    {row.cStock}
                  </td>

                  {/* Ph. Stock (Physical Stock Count - User Editable) */}
                  <td style={{ padding: "3px 4px", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="number"
                      value={row.phStock}
                      onChange={e => handlePhStockChange(idx, e.target.value)}
                      style={{
                        ...inp,
                        height: "25px",
                        fontSize: "12px",
                        fontWeight: "800",
                        textAlign: "right",
                        background: "#f0f9ff",
                        color: "#0369a1",
                        borderColor: "#7dd3fc"
                      }}
                    />
                  </td>

                  {/* Adjust (Calculated Difference: Ph.Stock - C.Stock) */}
                  <td style={{
                    padding: "3px 6px",
                    textAlign: "right",
                    fontWeight: "800",
                    borderRight: "1px solid #cbd5e1",
                    color: row.adjust > 0 ? "#16a34a" : row.adjust < 0 ? "#dc2626" : "#64748b",
                    background: row.adjust > 0 ? "#dcfce7" : row.adjust < 0 ? "#fee2e2" : "transparent"
                  }}>
                    {row.adjust > 0 ? `+${row.adjust}` : row.adjust}
                  </td>

                  {/* Action: Delete Row */}
                  <td style={{ textAlign: "center", padding: "2px" }}>
                    <button
                      onClick={() => handleRemoveRow(idx)}
                      title="Remove Row"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "2px" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                      onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── BOTTOM ACTION TOOLBAR & FOOTER (MATCHES SCREENSHOT PAGE 9) ── */}
      <div style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1", padding: "8px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
        
        {/* Row 1: Message Input and Checkboxes */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          
          {/* Message input */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: "260px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569" }}>Message:</span>
            <input
              type="text"
              placeholder="Enter remarks or audit reason (e.g. Monthly Stock Reconciliation)..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{ ...inp, height: "25px", fontSize: "11px" }}
            />
          </div>

          {/* Checkboxes: Location, Entry, Barcode, Status (from screenshot) */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", fontWeight: "600", color: "#475569" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <input type="checkbox" checked={chkLocation} onChange={e => setChkLocation(e.target.checked)} />
              Location
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <input type="checkbox" checked={chkEntry} onChange={e => setChkEntry(e.target.checked)} />
              Entry
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <input type="checkbox" checked={chkBarcode} onChange={e => setChkBarcode(e.target.checked)} />
              Barcode
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <input type="checkbox" checked={chkStatus} onChange={e => setChkStatus(e.target.checked)} />
              Status
            </label>
          </div>
        </div>

        {/* Row 2: Action Buttons & Right Totals Box (Matches layout in screenshot) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginTop: "2px" }}>
          
          {/* Action Buttons: New, Save, Delete, Remove Item, Duplicate, Print, <, >, Find, Close */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <button onClick={handleNewEntry} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 12px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              New
            </button>
            <button onClick={handleSave} style={{ ...btn("var(--color-primary)"), padding: "5px 14px", fontSize: "11px", fontWeight: "700" }} title="Save Stock Adjustment (F2)">
              Save (F2)
            </button>
            <button onClick={handleDeleteEntry} style={{ ...btn("#fee2e2", "#dc2626"), padding: "5px 11px", fontSize: "11px", border: "1px solid #fecaca" }}>
              Delete
            </button>
            <button onClick={() => handleRemoveRow(selectedRowIndex)} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              Remove Item
            </button>
            <button onClick={handleDuplicateRow} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              Duplicate
            </button>
            <button onClick={handlePrint} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 11px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              Print
            </button>

            {/* Sequential Nav: < > */}
            <div style={{ display: "flex", gap: "2px", marginLeft: "4px" }}>
              <button onClick={handlePrevEntry} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 9px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Previous Adjustment Entry">
                &lt;
              </button>
              <button onClick={handleNextEntry} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 9px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Next Adjustment Entry">
                &gt;
              </button>
            </div>

            <button onClick={() => setShowFindModal(true)} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 11px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              Find
            </button>
            <button onClick={() => setShowForm(false)} style={{ ...btn("#475569"), padding: "5px 12px", fontSize: "11px" }}>
              Close (Esc)
            </button>

            <button onClick={handleAddRow} style={{ ...btn("#e0f2fe", "#0369a1"), padding: "5px 10px", fontSize: "11px", border: "1px solid #bae6fd" }}>
              + Add Row
            </button>
          </div>

          {/* Right Summary / Totals Box (Matches PRate, LP, MRP Total, LP Total from screenshot) */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "5px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              <span>Items: <strong>{validItems.length}</strong></span> |{" "}
              <span>Net Variance: <strong style={{ color: totalAdjustDifference >= 0 ? "#16a34a" : "#dc2626" }}>{totalAdjustDifference > 0 ? `+${totalAdjustDifference}` : totalAdjustDifference}</strong></span>
            </div>

            <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "12px", fontSize: "11px" }}>
              <span style={{ color: "#475569" }}>MRP Total:</span>{" "}
              <strong style={{ fontSize: "13px", color: "#0f172a" }}>₹{fmt(mrpTotal)}</strong>
            </div>

            <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "12px", fontSize: "11px" }}>
              <span style={{ color: "#475569" }}>LP Total:</span>{" "}
              <strong style={{ fontSize: "13px", color: "#2563eb" }}>₹{fmt(lpTotal)}</strong>
            </div>
          </div>

        </div>
      </div>

      {/* ── FIND MODAL: SEARCH PAST ADJUSTMENT ENTRIES ── */}
      {showFindModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "8px", width: "100%", maxWidth: "600px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>🔍 Find Stock Adjustment</div>
              <button onClick={() => setShowFindModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
            
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #e2e8f0" }}>
              <input
                placeholder="Search by Entry No, Date, or Remark..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ ...inp, width: "100%" }}
                autoFocus
              />
            </div>

            <div style={{ padding: "8px", overflowY: "auto", flex: 1 }}>
              {stockAdjustments.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No past adjustment vouchers found</div>
              ) : (
                stockAdjustments.map(entry => (
                  <div
                    key={entry.id}
                    onClick={() => {
                      handleOpenEntry(entry);
                      setShowFindModal(false);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      marginBottom: "6px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>
                        Entry #{entry.entryNo} — {entry.acName}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Date: {entry.entryDate} | Items: {entry.totalItems || (entry.items ? entry.items.length : 0)} | Note: {entry.message || "N/A"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "800", color: "#16a34a" }}>MRP: ₹{fmt(entry.totalMrpVal || 0)}</div>
                      <div style={{ fontSize: "11px", color: (entry.totalAdjustUnits || 0) >= 0 ? "#16a34a" : "#dc2626" }}>
                        Diff: {(entry.totalAdjustUnits || 0) > 0 ? `+${entry.totalAdjustUnits}` : entry.totalAdjustUnits || 0}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
