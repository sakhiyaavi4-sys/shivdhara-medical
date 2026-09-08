// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckCircle, Trash2, Plus, ArrowLeft, ArrowRight, Printer, AlertTriangle, FileText, RefreshCw, ShoppingCart, Check, Clock } from "lucide-react";
import { useMedicalStore, today, uid, num, fmt, int, inp, lbl, btn } from './MedicalStoreContext';

export default function PurchaseOrder() {
  const {
    items, saveItems,
    batches, suppliers,
    showToast, showConfirm,
    setPrintHtml, setActiveSection,
    openPurchaseForm
  } = useMedicalStore();

  // ─── LOCAL STORAGE PERSISTED PURCHASE ORDERS ───
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('store_purchase_orders_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const saveOrders = (list: any[]) => {
    setPurchaseOrders(list);
    try {
      localStorage.setItem('store_purchase_orders_v2', JSON.stringify(list));
    } catch (_) {}
  };

  // ─── FORM & WORKSTATION STATE ───
  const [showForm, setShowForm] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFindModal, setShowFindModal] = useState(false);
  const [showPendModal, setShowPendModal] = useState(false);
  const [showListDrawer, setShowListDrawer] = useState(false);
  const [showSalesDetailModal, setShowSalesDetailModal] = useState(false);
  const [salesDetailItem, setSalesDetailItem] = useState<any>(null);

  // Form Headers (Matches Page 11 of transection.pdf)
  const [entryNo, setEntryNo] = useState<string>("1");
  const [orderDate, setOrderDate] = useState<string>(today());
  const [orderTime, setOrderTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  });

  // Checkboxes
  const [onlyStock, setOnlyStock] = useState(false);
  const [reGivenOrder, setReGivenOrder] = useState(false);

  // Supplier Search & Dropdown (As shown in screenshot)
  const [supplierInput, setSupplierInput] = useState<string>("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Table rows
  const [rows, setRows] = useState<any[]>([
    createEmptyRow(1)
  ]);

  // Selected row index
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);

  // Autocomplete state for item search
  const [activeDropdownRow, setActiveDropdownRow] = useState<number | null>(null);
  const [itemSearchText, setItemSearchText] = useState<{ [key: number]: string }>({});

  function createEmptyRow(rowNum: number) {
    return {
      id: uid(),
      sr: rowNum,
      itemId: "",
      itemCode: "",
      itemName: "",
      batch: "",
      expiry: "",
      mrp: "0.00",
      pRate: "0.00",
      qty: 1,
      free: 0,
      disc: 0,
      amount: "0.00",
      s: "Y",
      unit: "10'S"
    };
  }

  // Calculate Next Entry No
  const getNextEntryNo = () => {
    if (purchaseOrders.length === 0) return "1";
    const max = purchaseOrders.reduce((m, o) => Math.max(m, int(o.entryNo) || 0), 0);
    return String(max + 1);
  };

  // Start fresh Purchase Order
  const handleNewOrder = () => {
    setActiveOrderId(null);
    setEntryNo(getNextEntryNo());
    setOrderDate(today());
    const d = new Date();
    setOrderTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`);
    setSupplierInput("");
    setSelectedSupplierId("");
    setShowSupplierDropdown(false);
    setRows([createEmptyRow(1)]);
    setSelectedRowIndex(0);
    setShowForm(true);
  };

  // Open existing Purchase Order
  const handleOpenOrder = (ord: any) => {
    if (!ord) return;
    setActiveOrderId(ord.id);
    setEntryNo(String(ord.entryNo || "1"));
    setOrderDate(ord.orderDate || ord.date || today());
    setOrderTime(ord.orderTime || "12:00:00");
    setSupplierInput(ord.supplierName || "");
    setSelectedSupplierId(ord.supplierId || "");
    setShowSupplierDropdown(false);
    setRows((ord.items && ord.items.length > 0) ? ord.items : [createEmptyRow(1)]);
    setSelectedRowIndex(0);
    setShowForm(true);
    setShowListDrawer(false);
    setShowFindModal(false);
    setShowPendModal(false);
  };

  // Calculate Row Amount: (qty * pRate) * (1 - disc / 100)
  const calculateRowAmount = (qty: number, pRate: number, disc: number) => {
    const gross = (num(qty) || 0) * (num(pRate) || 0);
    const net = gross * (1 - (num(disc) || 0) / 100);
    return fmt(net);
  };

  // Select Item for a row
  const handleSelectItem = (index: number, itm: any) => {
    if (!itm) return;
    const itmBatches = (batches || []).filter((b: any) => b.itemId === itm.id || b.itemName === itm.name);
    const primaryBatch = itmBatches.length > 0 ? itmBatches[0] : null;

    const pRateVal = primaryBatch ? (primaryBatch.pRate || itm.pRate || 0) : (itm.pRate || itm.price || 0);
    const mrpVal = primaryBatch ? (primaryBatch.mrp || itm.mrp || 0) : (itm.mrp || 0);
    const batchNo = primaryBatch ? (primaryBatch.batchNo || primaryBatch.batch || "") : (itm.batchNumber || "");
    const expiryVal = primaryBatch ? (primaryBatch.expiryDate || primaryBatch.expiry || "") : (itm.expiryDate || "");
    const defaultQty = 1;
    const defaultDisc = num(itm.discount) || 0;

    setRows(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        itemId: itm.id,
        itemCode: itm.code || `ITM-${String(itm.id).slice(-4)}`,
        itemName: itm.name,
        batch: batchNo,
        expiry: expiryVal,
        mrp: fmt(mrpVal),
        pRate: fmt(pRateVal),
        qty: defaultQty,
        free: 0,
        disc: defaultDisc,
        amount: calculateRowAmount(defaultQty, pRateVal, defaultDisc),
        s: "Y",
        unit: itm.unit || itm.pack || "10'S"
      };
      return next;
    });

    setActiveDropdownRow(null);

    // Auto-add an empty row if this was the last row
    if (index === rows.length - 1) {
      setRows(curr => [...curr, createEmptyRow(curr.length + 1)]);
    }
  };

  // Row input changes
  const handleRowChange = (index: number, field: string, value: any) => {
    setRows(prev => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };
      if (field === "qty" || field === "pRate" || field === "disc") {
        row.amount = calculateRowAmount(row.qty, row.pRate, row.disc);
      }
      next[index] = row;
      return next;
    });
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
    const filtered = rows.filter((_, i) => i !== index).map((r, i) => ({ ...r, sr: i + 1 }));
    setRows(filtered);
    setSelectedRowIndex(Math.max(0, index - 1));
  };

  // Auto Order handler: loads items from this supplier where stock <= minimum
  const handleAutoOrder = () => {
    let list = [...(items || [])];
    if (supplierInput.trim()) {
      list = list.filter(i => (i.supplier || "").toLowerCase() === supplierInput.trim().toLowerCase());
    }

    // Filter items at or below minimum
    const lowStockItems = list.filter(i => {
      const curStock = num(i.stock) || 0;
      const minStock = num(i.minimum) || num(i.min) || 5;
      return curStock <= minStock;
    });

    if (lowStockItems.length === 0) {
      showToast("No low-stock items found for this supplier!", "info");
      return;
    }

    const newRows = lowStockItems.map((itm, idx) => {
      const curStock = num(itm.stock) || 0;
      const maxStock = num(itm.maximum) || num(itm.max) || 15;
      const suggestedQty = Math.max(1, maxStock - curStock);
      const pRateVal = num(itm.pRate) || num(itm.price) || 0;
      const discVal = num(itm.discount) || 0;

      return {
        id: uid(),
        sr: idx + 1,
        itemId: itm.id,
        itemCode: itm.code || "",
        itemName: itm.name,
        batch: itm.batchNumber || "",
        expiry: itm.expiryDate || "",
        mrp: fmt(itm.mrp || 0),
        pRate: fmt(pRateVal),
        qty: suggestedQty,
        free: 0,
        disc: discVal,
        amount: calculateRowAmount(suggestedQty, pRateVal, discVal),
        s: "Y",
        unit: itm.unit || itm.pack || "10'S"
      };
    });

    setRows(newRows);
    showToast(`⚡ Auto-loaded ${newRows.length} low-stock items into Purchase Order!`);
  };

  // Save Purchase Order
  const handleSave = () => {
    const validRows = rows.filter(r => r.itemName && r.itemName.trim() !== "");
    if (!supplierInput.trim()) {
      showToast("Please select a Supplier Name!", "error");
      return;
    }
    if (validRows.length === 0) {
      showToast("Please enter at least one item before saving!", "error");
      return;
    }

    const totalQty = validRows.reduce((s, r) => s + num(r.qty), 0);
    const totalFree = validRows.reduce((s, r) => s + num(r.free), 0);
    const grossAmount = validRows.reduce((s, r) => s + (num(r.qty) * num(r.pRate)), 0);
    const netAmount = validRows.reduce((s, r) => s + num(r.amount), 0);

    const orderRecord = {
      id: activeOrderId || uid(),
      entryNo,
      orderDate,
      orderTime,
      supplierName: supplierInput.trim(),
      supplierId: selectedSupplierId,
      items: validRows,
      totalItems: validRows.length,
      totalQty,
      totalFree,
      grossAmount,
      netAmount,
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    let updatedList;
    if (activeOrderId) {
      updatedList = purchaseOrders.map(o => o.id === activeOrderId ? orderRecord : o);
    } else {
      updatedList = [orderRecord, ...purchaseOrders];
    }

    saveOrders(updatedList);
    setActiveOrderId(orderRecord.id);
    showToast(`✅ Purchase Order #${entryNo} saved successfully!`);
  };

  // Delete Purchase Order
  const handleDelete = () => {
    if (!activeOrderId) {
      showToast("This is an unsaved new order!", "info");
      return;
    }
    showConfirm(`Delete Purchase Order #${entryNo}?`, () => {
      const remaining = purchaseOrders.filter(o => o.id !== activeOrderId);
      saveOrders(remaining);
      showToast(`Purchase Order #${entryNo} deleted!`);
      handleNewOrder();
    });
  };

  // Print Order Slip
  const handlePrint = () => {
    const validRows = rows.filter(r => r.itemName && r.itemName.trim() !== "");
    if (validRows.length === 0) {
      showToast("No items to print!", "error");
      return;
    }

    const netAmount = validRows.reduce((s, r) => s + num(r.amount), 0);
    const totalQty = validRows.reduce((s, r) => s + num(r.qty), 0);

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #0f172a; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px;">
          <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;">SHIV DHARA MEDICAL STORE</h2>
          <p style="margin: 2px 0; font-size: 11px;">20, GIRIRAJ COMPLEX NIKOL GAAM ROAD, NIKOL, AHMEDABAD | PH: 079352 07999</p>
          <div style="display: inline-block; background: #0284c7; color: white; padding: 2px 14px; border-radius: 4px; font-weight: 700; font-size: 12px; margin-top: 5px;">
            PURCHASE ORDER VOUCHER
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px;">
          <div>
            <strong>PO Number:</strong> #${entryNo}<br/>
            <strong>Supplier:</strong> ${supplierInput || "N/A"}<br/>
            <strong>Payment Mode:</strong> Credit / As per Terms
          </div>
          <div style="text-align: right;">
            <strong>Order Date:</strong> ${orderDate} ${orderTime}<br/>
            <strong>Total Items:</strong> ${validRows.length}<br/>
            <strong>Total Order Units:</strong> ${totalQty}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1px solid #94a3b8;">
              <th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 35px;">Sr.</th>
              <th style="padding: 5px; text-align: left; border: 1px solid #cbd5e1;">Item Name</th>
              <th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 80px;">Batch</th>
              <th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 65px;">Expiry</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 65px;">MRP</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 65px;">P.Rate</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 60px; background: #e0f2fe;">Qty</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 50px;">Free</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 50px;">Disc%</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 80px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${validRows.map((r, i) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">${i + 1}</td>
                <td style="padding: 4px; border: 1px solid #cbd5e1;"><strong>${r.itemName}</strong></td>
                <td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">${r.batch || '-'}</td>
                <td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">${r.expiry || '-'}</td>
                <td style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">₹${fmt(r.mrp)}</td>
                <td style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">₹${fmt(r.pRate)}</td>
                <td style="padding: 4px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1; background: #f0f9ff; color: #0369a1;">${r.qty}</td>
                <td style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">${r.free || '-'}</td>
                <td style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">${r.disc ? `${r.disc}%` : '-'}</td>
                <td style="padding: 4px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1;">₹${fmt(r.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px;">
          <div>
            <strong>Special Note:</strong> Please supply fresh stock with minimum 12 months expiry.
          </div>
          <div style="text-align: right;">
            <strong>Net PO Amount:</strong> <span style="font-size: 13px; font-weight: bold; color: #16a34a;">₹${fmt(netAmount)}</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 8px; font-size: 10px;">
          <div style="border-top: 1px solid #94a3b8; width: 150px; text-align: center;">Authorized Signatory</div>
          <div style="border-top: 1px solid #94a3b8; width: 150px; text-align: center;">Supplier Acceptance</div>
        </div>
      </div>
    `;

    setPrintHtml(html);
  };

  // Convert Purchase Order to Purchase Bill
  const handleConvertToBill = () => {
    const validRows = rows.filter(r => r.itemName && r.itemName.trim() !== "");
    if (validRows.length === 0) {
      showToast("No items to convert!", "error");
      return;
    }
    showConfirm(`Convert Purchase Order #${entryNo} to Purchase Bill?`, () => {
      openPurchaseForm({
        partyName: supplierInput.trim(),
        billNo: `PO-${entryNo}`,
        billDate: today(),
        entryDate: today(),
        taxType: "exclusive",
        taxZone: "sgst_ugst",
        remarks: `Converted from Purchase Order #${entryNo}`,
        items: validRows.map(r => ({
          itemId: r.itemId,
          itemName: r.itemName,
          batchNo: r.batch || `B-${Date.now().toString().slice(-4)}`,
          expiryDate: r.expiry || "12/28",
          qty: r.qty,
          freeQty: r.free || 0,
          ptr: r.pRate,
          mrp: r.mrp,
          rate: r.pRate,
          disc: r.disc || 0,
          amount: r.amount
        }))
      });
      setActiveSection("purchase");
      showToast(`Transferred PO #${entryNo} to Purchase Bill!`);
    });
  };

  // Open Sales Detail modal for selected item
  const handleShowSalesDetail = () => {
    const sel = rows[selectedRowIndex];
    if (!sel || !sel.itemName) {
      showToast("Please select a row with an item first!", "info");
      return;
    }
    setSalesDetailItem(sel);
    setShowSalesDetailModal(true);
  };

  // Keyboard shortcut listener (F2 Save, Esc Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        if (showSupplierDropdown) {
          setShowSupplierDropdown(false);
        } else if (activeDropdownRow !== null) {
          setActiveDropdownRow(null);
        } else if (showSalesDetailModal) {
          setShowSalesDetailModal(false);
        } else if (showFindModal) {
          setShowFindModal(false);
        } else if (showPendModal) {
          setShowPendModal(false);
        } else if (showListDrawer) {
          setShowListDrawer(false);
        } else if (showForm) {
          setShowForm(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm, showSupplierDropdown, activeDropdownRow, showSalesDetailModal, showFindModal, showPendModal, showListDrawer, rows, entryNo, supplierInput, orderDate]);

  // Calculations for totals
  const validItems = rows.filter(r => r.itemName && r.itemName.trim() !== "");
  const totalUnits = validItems.reduce((s, r) => s + num(r.qty), 0);
  const totalFreeUnits = validItems.reduce((s, r) => s + num(r.free), 0);
  const totalAmount = validItems.reduce((s, r) => s + num(r.amount), 0);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: CENTER BUTTON (When no form is open) — strictly conforming to Rule #2
  // ══════════════════════════════════════════════════════════════════════════════
  if (!showForm) {
    const filteredPOs = (searchQuery.trim() ? purchaseOrders.filter(o => 
      String(o.entryNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(o.supplierName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(o.orderDate || o.date || "").includes(searchQuery)
    ) : purchaseOrders).slice(0, 15);

    return (
      <div style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header Title with Search Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🛒</span> Purchase Order ({purchaseOrders.length})
            </h2>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
              Manage Supplier Requisitions, Purchase Orders, Batch Tracking & Inward Conversion
            </p>
          </div>

          <div style={{ position: "relative", minWidth: "280px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "8px", color: "#64748b" }} />
            <input
              placeholder="Search PO#, Supplier, Date... + Enter"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && filteredPOs.length > 0) {
                  handleOpenOrder(filteredPOs[0]);
                }
              }}
              style={{ ...inp, paddingLeft: "30px", background: "white" }}
            />
          </div>
        </div>

        {/* ── SINGLE CENTER BUTTON WORKSPACE (Strict Rule #2: Only Center Button) ── */}
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b", background: "white", borderRadius: "10px", border: "1px dashed var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "44px", opacity: 0.8, marginBottom: "8px" }}>🛒</div>
          <h3 style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "17px", color: "var(--color-text-dark)" }}>
            Supplier Purchase Order Entry
          </h3>
          <p style={{ fontSize: "12px", opacity: 0.75, maxWidth: "520px", margin: "0 auto 18px", lineHeight: "1.5" }}>
            Create formal purchase order slips for pharmaceutical suppliers. Auto-calculate rates, batches, expiry, and convert POs directly into incoming Purchase Bills.
          </p>

          {/* SINGLE CENTER BUTTON */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button 
              onClick={handleNewOrder} 
              style={{ ...btn("var(--color-primary)"), padding: "10px 22px", fontSize: "14px", fontWeight: "700", borderRadius: "8px" }}
            >
              ➕ New Purchase Order
            </button>
          </div>
        </div>

        {/* Recent Purchase Orders Table */}
        {purchaseOrders.length > 0 && (
          <div style={{ marginTop: "24px", background: "white", borderRadius: "8px", border: "1px solid var(--color-border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                📋 Recent Purchase Orders ({purchaseOrders.length})
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Click on any order to view or edit</div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", color: "#475569", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "80px" }}>PO#</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Supplier Name</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "110px" }}>Order Date</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "80px" }}>Items</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", width: "90px" }}>Total Qty</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", width: "120px" }}>Net PO Amount</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "100px" }}>Status</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPOs.map(ord => (
                    <tr 
                      key={ord.id}
                      onClick={() => handleOpenOrder(ord)}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "700", color: "var(--color-primary)" }}>
                        #{ord.entryNo}
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: "600", color: "#1e293b" }}>
                        {ord.supplierName}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", color: "#64748b" }}>
                        {ord.orderDate || ord.date}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", color: "#475569" }}>
                        {ord.totalItems || (ord.items ? ord.items.length : 0)}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: "#0284c7" }}>
                        {ord.totalQty || 0}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: "#16a34a" }}>
                        ₹{fmt(ord.netAmount || 0)}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "10px",
                          fontWeight: "700",
                          background: ord.status === "Converted" ? "#dcfce7" : "#eff6ff",
                          color: ord.status === "Converted" ? "#15803d" : "#1d4ed8"
                        }}>
                          {ord.status || "Pending"}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenOrder(ord)} 
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
  // RENDER: FULL INTERACTIVE PURCHASE ORDER ENTRY SCREEN (Matches Page 11 of transection.pdf)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: "white", borderRadius: "8px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", minHeight: "84vh" }}>
      
      {/* ── TOP HEADER / SUPPLIER SELECTION BAR (MATCHES EXACT LAYOUT IN SCREENSHOT) ── */}
      <div style={{ padding: "8px 12px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", flexDirection: "column", gap: "6px" }}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          
          {/* Left: Entry No, Date, Time, Checkboxes */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
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
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#1e293b" }}>Date:</span>
              <input
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                style={{ ...inp, width: "125px", height: "26px", fontSize: "11px", fontWeight: "600" }}
              />
            </div>

            <div style={{ fontSize: "11px", color: "#64748b", background: "#e2e8f0", padding: "3px 8px", borderRadius: "4px", fontWeight: "700" }}>
              🕒 {orderTime}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", fontWeight: "600", color: "#475569" }}>
              <span style={{ padding: "2px 6px", background: "#0284c7", color: "white", borderRadius: "3px", fontWeight: "800", fontSize: "10px" }}>P</span>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input type="checkbox" checked={onlyStock} onChange={e => setOnlyStock(e.target.checked)} />
                Only Stock
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input type="checkbox" checked={reGivenOrder} onChange={e => setReGivenOrder(e.target.checked)} />
                Re Given Order
              </label>
            </div>
          </div>

          {/* Right Status Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button 
              onClick={handleConvertToBill}
              style={{ ...btn("#16a34a", "white"), padding: "4px 12px", fontSize: "11px", fontWeight: "700" }}
              title="Convert this order directly to a Purchase Bill"
            >
              🔄 Convert to Bill
            </button>
            <button 
              onClick={() => setShowForm(false)} 
              style={{ ...btn("#475569", "white"), padding: "4px 12px", fontSize: "11px" }}
            >
              ✕ Close (Esc)
            </button>
          </div>

        </div>

        {/* Row 2: Supplier Search Input with Auto-suggest popup list (MATCHES POPUP LIST IN SCREENSHOT) */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", position: "relative" }}>
          <span style={{ fontSize: "11px", fontWeight: "800", width: "65px", color: "#0f172a" }}>Supplier:</span>
          
          <div style={{ position: "relative", flex: 1, maxWidth: "450px" }}>
            <input
              type="text"
              placeholder="Search or type Supplier Name..."
              value={supplierInput}
              onChange={e => {
                setSupplierInput(e.target.value);
                setShowSupplierDropdown(true);
              }}
              onFocus={() => setShowSupplierDropdown(true)}
              style={{ ...inp, height: "26px", fontSize: "11px", fontWeight: "700", color: "#0f172a", background: "white", borderColor: showSupplierDropdown ? "#3b82f6" : "var(--color-border)" }}
            />

            {/* Supplier Popup List (Visible when searching or focused, as shown in user screenshot) */}
            {showSupplierDropdown && (
              <div style={{
                position: "absolute",
                top: "30px",
                left: 0,
                width: "100%",
                background: "white",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                maxHeight: "220px",
                overflowY: "auto",
                zIndex: 999
              }}>
                {(() => {
                  const q = supplierInput.toLowerCase().trim();
                  const matchedSuppliers = (suppliers || []).filter((s: any) => 
                    !q || (s.name || "").toLowerCase().includes(q) || (s.city || "").toLowerCase().includes(q)
                  );

                  if (matchedSuppliers.length === 0) {
                    return (
                      <div style={{ padding: "8px 12px", fontSize: "11px", color: "#64748b" }}>
                        No supplier found. (You can type a custom supplier name)
                      </div>
                    );
                  }

                  return matchedSuppliers.map((supp: any) => (
                    <div
                      key={supp.id}
                      onMouseDown={() => {
                        setSupplierInput(supp.name);
                        setSelectedSupplierId(supp.id);
                        setShowSupplierDropdown(false);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#0f172a",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}
                    >
                      <span>{supp.name}</span>
                      <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "normal" }}>{supp.city || supp.gst_tin || ""}</span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          <span style={{ fontSize: "11px", color: "#64748b" }}>
            {selectedSupplierId ? "✓ Supplier selected" : "(Search or type supplier name)"}
          </span>
        </div>

      </div>

      {/* ── MAIN TABLE / GRID (MATCHES COLUMNS: Sr., Item Name, Batch, Expiry, MRP, P.Rate, Qty, Free, Disc, Amount, S) ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#475569", color: "white", textAlign: "center", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #334155" }}>
              <th style={{ padding: "6px 4px", width: "35px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Sr.</th>
              <th style={{ padding: "6px 8px", textAlign: "left", minWidth: "250px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Item Name</th>
              <th style={{ padding: "6px 6px", width: "95px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Batch</th>
              <th style={{ padding: "6px 6px", width: "75px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Expiry</th>
              <th style={{ padding: "6px 6px", width: "70px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right" }}>MRP</th>
              <th style={{ padding: "6px 6px", width: "75px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right" }}>P.Rate</th>
              <th style={{ padding: "6px 6px", width: "65px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right", background: "#0284c7" }}>Qty</th>
              <th style={{ padding: "6px 6px", width: "50px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right" }}>Free</th>
              <th style={{ padding: "6px 6px", width: "50px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right" }}>Disc</th>
              <th style={{ padding: "6px 6px", width: "85px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right", background: "#334155" }}>Amount</th>
              <th style={{ padding: "6px 4px", width: "35px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>S</th>
              <th style={{ padding: "6px 4px", width: "35px" }}>Act</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isSelected = selectedRowIndex === idx;

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
                  {/* Sr. */}
                  <td style={{ textAlign: "center", fontWeight: "700", color: "#64748b", padding: "4px 2px", borderRight: "1px solid #e2e8f0" }}>
                    {idx + 1}
                  </td>

                  {/* Item Name (Searchable with live popup list: "list search kari e to j hoy to aavi joia") */}
                  <td style={{ padding: "3px 6px", position: "relative", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="text"
                      placeholder="Type to search Item Name..."
                      value={row.itemName || (itemSearchText[idx] || "")}
                      onChange={e => {
                        const val = e.target.value;
                        setItemSearchText(prev => ({ ...prev, [idx]: val }));
                        setRows(curr => {
                          const nxt = [...curr];
                          nxt[idx] = { ...nxt[idx], itemName: val, itemId: "" };
                          return nxt;
                        });
                        setActiveDropdownRow(idx);
                      }}
                      onFocus={() => setActiveDropdownRow(idx)}
                      style={{
                        ...inp,
                        height: "25px",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#0f172a",
                        borderColor: isSelected ? "#3b82f6" : "var(--color-border)"
                      }}
                    />

                    {/* Item Auto-suggest list (Only appears when searching/focused) */}
                    {activeDropdownRow === idx && (
                      <div style={{
                        position: "absolute",
                        top: "32px",
                        left: "6px",
                        width: "380px",
                        background: "white",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                        maxHeight: "220px",
                        overflowY: "auto",
                        zIndex: 999
                      }}>
                        {(() => {
                          const q = (itemSearchText[idx] || row.itemName || "").toLowerCase().trim();
                          const matches = (items || []).filter((i: any) => 
                            !q || (i.name || "").toLowerCase().includes(q) || (i.code || "").toLowerCase().includes(q) || (i.company || "").toLowerCase().includes(q)
                          ).slice(0, 15);

                          if (matches.length === 0) {
                            return <div style={{ padding: "8px 12px", fontSize: "11px", color: "#64748b" }}>No matching items in master</div>;
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
                                  Co: {m.company || "N/A"} | Pack: {m.pack || m.unit || "10'S"}
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: "800", color: "#2563eb" }}>P.Rate: ₹{fmt(m.pRate || m.price)}</div>
                                <div style={{ fontSize: "10px", color: "#64748b" }}>Stock: {m.stock || 0}</div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </td>

                  {/* Batch */}
                  <td style={{ padding: "3px 4px", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="text"
                      placeholder="Batch"
                      value={row.batch || ""}
                      onChange={e => handleRowChange(idx, "batch", e.target.value)}
                      style={{ ...inp, height: "25px", fontSize: "11px", textAlign: "center", fontWeight: "600" }}
                    />
                  </td>

                  {/* Expiry */}
                  <td style={{ padding: "3px 4px", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={row.expiry || ""}
                      onChange={e => handleRowChange(idx, "expiry", e.target.value)}
                      style={{ ...inp, height: "25px", fontSize: "11px", textAlign: "center" }}
                    />
                  </td>

                  {/* MRP */}
                  <td style={{ padding: "3px 4px", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="number"
                      step="0.01"
                      value={row.mrp}
                      onChange={e => handleRowChange(idx, "mrp", e.target.value)}
                      style={{ ...inp, height: "25px", fontSize: "11px", textAlign: "right" }}
                    />
                  </td>

                  {/* P.Rate */}
                  <td style={{ padding: "3px 4px", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="number"
                      step="0.01"
                      value={row.pRate}
                      onChange={e => handleRowChange(idx, "pRate", e.target.value)}
                      style={{ ...inp, height: "25px", fontSize: "11px", textAlign: "right", fontWeight: "600" }}
                    />
                  </td>

                  {/* Qty */}
                  <td style={{ padding: "3px 4px", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="number"
                      min="1"
                      value={row.qty}
                      onChange={e => handleRowChange(idx, "qty", e.target.value)}
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

                  {/* Free */}
                  <td style={{ padding: "3px 4px", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="number"
                      min="0"
                      value={row.free}
                      onChange={e => handleRowChange(idx, "free", e.target.value)}
                      style={{ ...inp, height: "25px", fontSize: "11px", textAlign: "right" }}
                    />
                  </td>

                  {/* Disc */}
                  <td style={{ padding: "3px 4px", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={row.disc}
                      onChange={e => handleRowChange(idx, "disc", e.target.value)}
                      style={{ ...inp, height: "25px", fontSize: "11px", textAlign: "right" }}
                    />
                  </td>

                  {/* Amount */}
                  <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "800", color: "#0f172a", borderRight: "1px solid #e2e8f0" }}>
                    ₹{fmt(row.amount)}
                  </td>

                  {/* S */}
                  <td style={{ textAlign: "center", padding: "2px", borderRight: "1px solid #e2e8f0" }}>
                    <span style={{ fontWeight: "800", fontSize: "11px", color: "#16a34a" }}>
                      {row.s || "Y"}
                    </span>
                  </td>

                  {/* Act: Remove Row */}
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

      {/* ── BOTTOM ACTION TOOLBAR (MATCHES SCREENSHOT BUTTONS ROW 1 & ROW 2) ── */}
      <div style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1", padding: "8px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
        
        {/* Row 1 Buttons: New, Save, Print, PDF, Print Only, Pend Ord, List, Find, Delete, Close */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
          
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={handleNewOrder} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 12px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              New
            </button>
            <button onClick={handleSave} style={{ ...btn("var(--color-primary)"), padding: "5px 14px", fontSize: "11px", fontWeight: "700" }} title="Save Purchase Order (F2)">
              Save (F2)
            </button>
            <button onClick={handlePrint} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 11px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              Print
            </button>
            <button onClick={handlePrint} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 11px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              PDF
            </button>
            <button onClick={handlePrint} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              Print Only
            </button>
            <button onClick={() => setShowPendModal(true)} style={{ ...btn("#fef3c7", "#b45309"), padding: "5px 10px", fontSize: "11px", border: "1px solid #fde68a" }}>
              Pend Ord
            </button>
            <button onClick={() => setShowListDrawer(true)} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              List
            </button>
            <button onClick={() => setShowFindModal(true)} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              Find
            </button>
            <button onClick={handleDelete} style={{ ...btn("#fee2e2", "#dc2626"), padding: "5px 11px", fontSize: "11px", border: "1px solid #fecaca" }}>
              Delete
            </button>
            <button onClick={handleAddRow} style={{ ...btn("#e0f2fe", "#0369a1"), padding: "5px 10px", fontSize: "11px", border: "1px solid #bae6fd" }}>
              + Add Row
            </button>
          </div>

          <button onClick={() => setShowForm(false)} style={{ ...btn("#dc2626", "white"), padding: "5px 14px", fontSize: "11px", fontWeight: "700" }}>
            Close (Esc)
          </button>

        </div>

        {/* Row 2 Buttons: Sales Detail, Auto Order, Header Footer Setting, Q Order & Totals */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginTop: "2px" }}>
          
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button onClick={handleShowSalesDetail} style={{ ...btn("#f1f5f9", "#334155"), padding: "4px 12px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              Sales Detail
            </button>
            <button onClick={handleAutoOrder} style={{ ...btn("#f1f5f9", "#0f172a"), padding: "4px 12px", fontSize: "11px", fontWeight: "700", border: "1px solid #cbd5e1" }}>
              Auto Order
            </button>
            <button onClick={() => showToast("PO Header/Footer setting: Standard Shiv Dhara Format", "info")} style={{ ...btn("#f1f5f9", "#334155"), padding: "4px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              Header Footer Setting
            </button>
            <button onClick={() => handleAutoOrder()} style={{ ...btn("#f1f5f9", "#0f172a"), padding: "4px 12px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              Q Order
            </button>
          </div>

          {/* Right Summary Totals */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "white", padding: "4px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              <span>Items: <strong>{validItems.length}</strong></span> |{" "}
              <span>Total Units: <strong>{totalUnits}</strong> {totalFreeUnits > 0 ? `(+${totalFreeUnits} Fr)` : ''}</span>
            </div>

            <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "12px", fontSize: "11px" }}>
              <span style={{ color: "#475569" }}>Net PO Amount:</span>{" "}
              <strong style={{ fontSize: "14px", color: "#16a34a" }}>₹{fmt(totalAmount)}</strong>
            </div>
          </div>

        </div>

      </div>

      {/* ── SALES DETAIL MODAL ── */}
      {showSalesDetailModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "8px", width: "100%", maxWidth: "480px", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>📊 Sales & Stock Detail</div>
              <button onClick={() => setShowSalesDetailModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
            <div style={{ padding: "14px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div><strong>Item Name:</strong> {salesDetailItem?.itemName}</div>
              <div><strong>Item Code:</strong> {salesDetailItem?.itemCode || "N/A"}</div>
              <div><strong>Current Stock:</strong> {salesDetailItem?.stock || 0} units</div>
              <div><strong>Min / Max Stock:</strong> {salesDetailItem?.min || 5} / {salesDetailItem?.max || 15}</div>
              <div><strong>Suggested PO Qty:</strong> {salesDetailItem?.qty || 1} units</div>
              <div><strong>Purchase Rate:</strong> ₹{fmt(salesDetailItem?.pRate || 0)}</div>
              <div><strong>MRP:</strong> ₹{fmt(salesDetailItem?.mrp || 0)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── FIND MODAL ── */}
      {showFindModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "8px", width: "100%", maxWidth: "600px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>🔍 Find Purchase Order</div>
              <button onClick={() => setShowFindModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
            
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>
              <input
                placeholder="Search by PO Number, Supplier, or Date..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ ...inp, width: "100%" }}
                autoFocus
              />
            </div>

            <div style={{ padding: "8px", overflowY: "auto", flex: 1 }}>
              {purchaseOrders.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No purchase orders found</div>
              ) : (
                purchaseOrders.map(ord => (
                  <div
                    key={ord.id}
                    onClick={() => handleOpenOrder(ord)}
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
                        PO #{ord.entryNo} — {ord.supplierName}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Date: {ord.orderDate || ord.date} | Items: {ord.totalItems || (ord.items ? ord.items.length : 0)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "800", color: "#16a34a" }}>₹{fmt(ord.netAmount || 0)}</div>
                      <div style={{ fontSize: "10px", color: "#64748b" }}>{ord.status || "Pending"}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PENDING ORDERS MODAL ── */}
      {showPendModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "8px", width: "100%", maxWidth: "600px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fef3c7" }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#b45309" }}>⏳ Pending Purchase Orders</div>
              <button onClick={() => setShowPendModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
            
            <div style={{ padding: "8px", overflowY: "auto", flex: 1 }}>
              {purchaseOrders.filter(o => o.status !== "Converted").length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No pending orders</div>
              ) : (
                purchaseOrders.filter(o => o.status !== "Converted").map(ord => (
                  <div
                    key={ord.id}
                    onClick={() => handleOpenOrder(ord)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #fde68a",
                      background: "#fffbeb",
                      marginBottom: "6px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>
                        PO #{ord.entryNo} — {ord.supplierName}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Date: {ord.orderDate || ord.date} | Items: {ord.totalItems || 0}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "800", color: "#16a34a" }}>₹{fmt(ord.netAmount || 0)}</div>
                      <span style={{ fontSize: "10px", background: "#fef3c7", color: "#b45309", padding: "2px 6px", borderRadius: "10px", fontWeight: "bold" }}>Pending</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── LIST DRAWER ── */}
      {showListDrawer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "450px", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-5px 0 25px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>📋 All Purchase Orders ({purchaseOrders.length})</div>
              <button onClick={() => setShowListDrawer(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>

            <div style={{ padding: "8px", overflowY: "auto", flex: 1 }}>
              {purchaseOrders.map(ord => (
                <div
                  key={ord.id}
                  onClick={() => handleOpenOrder(ord)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "6px",
                    cursor: "pointer"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "700", color: "var(--color-primary)" }}>PO #{ord.entryNo}</span>
                    <span style={{ fontWeight: "700", color: "#16a34a" }}>₹{fmt(ord.netAmount || 0)}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#1e293b", fontWeight: "600", marginTop: "2px" }}>{ord.supplierName}</div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Date: {ord.orderDate || ord.date} | Items: {ord.totalItems || 0}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
