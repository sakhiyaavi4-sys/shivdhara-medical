// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckCircle, Trash2, Plus, ArrowRight, RefreshCw, Barcode, AlertCircle, Edit2, Layers } from "lucide-react";
import { useMedicalStore, today, uid, num, fmt, int, inp, lbl, btn, GST_RATES } from './MedicalStoreContext';

export default function StockEntryItemwise({
  initialItemName = "",
  isModal = false,
  onClose,
  onItemCreated
}: any) {
  const { 
    items, saveItems, 
    batches, saveBatches, 
    suppliers,
    showToast, showConfirm, setActiveSection
  } = useMedicalStore();

  // Search in Left Item List
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Selected Batch
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [isNewBatchMode, setIsNewBatchMode] = useState(false);

  // Left Form (Item Details)
  const [itemForm, setItemForm] = useState({
    code: "",
    name: initialItemName || "",
    hsn: "",
    barcode: "",
    size: "",
    extra: "",
    min: "5",
    max: "100",
    itemType: "Regular",
    category: "",
    breakSaleNotAllowed: false,
    rxRequired: false,
    taxInclusive: false,
    discountNotAllowed: false,
    company: "",
    supplier: "",
    generic: "",
  });

  // Right Form (Batch & Rates & Stock)
  const [batchForm, setBatchForm] = useState({
    unit: "10's",
    gst: "5",
    batchNo: "",
    expiry: "",
    discount: "0",
    mrp: "",
    sRate: "",
    pRate: "",
    lp: "",
    openStock: "0",
    currentStock: "0",
    location: "",
    newMrp: false,
  });

  // Auto-select item on mount or set up initialItemName
  useEffect(() => {
    if (initialItemName) {
      const match = (items || []).find((i: any) => (i.name || "").toLowerCase() === initialItemName.trim().toLowerCase());
      if (match) {
        handleSelectItem(match);
      } else {
        // Brand new item entry!
        setSelectedItemId("");
        setIsNewBatchMode(true);
        setItemForm(prev => ({
          ...prev,
          name: initialItemName.trim(),
          code: `ITM-${Date.now().toString().slice(-4)}`
        }));
        setBatchForm(prev => ({
          ...prev,
          batchNo: "",
          currentStock: "0",
          openStock: "0"
        }));
      }
    } else if (items && items.length > 0 && !selectedItemId) {
      handleSelectItem(items[0]);
    }
  }, [items, initialItemName]);

  // When an item is selected from Left Table
  const handleSelectItem = (item: any) => {
    if (!item) return;
    setSelectedItemId(item.id);
    setIsNewBatchMode(false);

    // Populate Item Master Form
    setItemForm({
      code: item.code || "",
      name: item.name || "",
      hsn: item.hsn || "",
      barcode: item.barcode || "",
      size: item.size || item.pack || "",
      extra: item.extra || "",
      min: String(item.minimum ?? item.min ?? "5"),
      max: String(item.maximum ?? item.max ?? "100"),
      itemType: item.itemType || item.division || "Regular",
      category: item.itemCategory || item.category || "",
      breakSaleNotAllowed: !!item.breakSaleNotAllowed,
      rxRequired: !!(item.rxRequired || item.scheduleH),
      taxInclusive: !!(item.taxType === "inclusive" || item.taxInclusive),
      discountNotAllowed: !!item.discountNotAllowed,
      company: item.company || "",
      supplier: item.supplier || "",
      generic: item.drugGroup || item.generic || item.description || "",
    });

    // Find batches for this item
    const itemBatches = (batches || []).filter((b: any) => b.itemId === item.id || (b.itemName && b.itemName === item.name));
    if (itemBatches.length > 0) {
      handleSelectBatch(itemBatches[0], item);
    } else {
      // Empty batch form ready for entry
      setSelectedBatchId("");
      setIsNewBatchMode(true);
      setBatchForm({
        unit: item.unit || item.pack || "10's",
        gst: String(item.gst || item.gstRate || "5"),
        batchNo: "",
        expiry: item.expiryDate || "",
        discount: String(item.discount || "0"),
        mrp: String(item.mrp || item.price || ""),
        sRate: String(item.sRate || item.price || ""),
        pRate: String(item.pRate || ""),
        lp: String(item.landingPrice || item.lp || item.pRate || ""),
        openStock: String(item.openingStock || "0"),
        currentStock: String(item.stock || "0"),
        location: item.location || "",
        newMrp: false,
      });
    }
  };

  // When a batch is selected from the Right Top Table
  const handleSelectBatch = (batch: any, parentItem?: any) => {
    if (!batch) return;
    setSelectedBatchId(batch.id || batch.batchNo || batch.batch);
    setIsNewBatchMode(false);

    const itm = parentItem || items.find((i: any) => i.id === selectedItemId);
    const bExp = batch.expiryDate || batch.expiry || "";
    const bMrp = String(batch.mrp ?? itm?.mrp ?? "");
    const bSRate = String(batch.sRate ?? batch.rate ?? itm?.sRate ?? itm?.price ?? "");
    const bPRate = String(batch.pRate ?? itm?.pRate ?? "");
    const bLp = String(batch.landingPrice ?? batch.lp ?? bPRate);
    const bOpen = String(batch.openingStock ?? batch.openStock ?? "0");
    const bCur = String(batch.stock ?? batch.qty ?? batch.currentStock ?? "0");

    setBatchForm({
      unit: batch.unit || itm?.unit || "10's",
      gst: String(batch.gst || batch.gstRate || itm?.gst || "5"),
      batchNo: batch.batchNo || batch.batch || "",
      expiry: bExp,
      discount: String(batch.discount || "0"),
      mrp: bMrp,
      sRate: bSRate,
      pRate: bPRate,
      lp: bLp,
      openStock: bOpen,
      currentStock: bCur,
      location: batch.location || itm?.location || "",
      newMrp: !!batch.newMrp,
    });
  };

  // Insert New Batch
  const handleInsertNewBatch = () => {
    const curItem = items.find((i: any) => i.id === selectedItemId);
    setSelectedBatchId("");
    setIsNewBatchMode(true);
    setBatchForm({
      unit: curItem?.unit || curItem?.pack || "10's",
      gst: String(curItem?.gst || curItem?.gstRate || "5"),
      batchNo: "",
      expiry: "",
      discount: "0",
      mrp: String(curItem?.mrp || curItem?.price || ""),
      sRate: String(curItem?.sRate || curItem?.price || ""),
      pRate: String(curItem?.pRate || ""),
      lp: String(curItem?.landingPrice || curItem?.pRate || ""),
      openStock: "0",
      currentStock: "0",
      location: curItem?.location || "",
      newMrp: false,
    });
    showToast("Ready to enter New Batch!");
    setTimeout(() => {
      document.getElementById("st-batchno-input")?.focus();
    }, 50);
  };

  // Delete Batch Permanently
  const handleDeleteBatch = () => {
    if (!selectedBatchId && !batchForm.batchNo) {
      showToast("Please select a batch to delete!", "error");
      return;
    }
    showConfirm(`Permanently delete batch '${batchForm.batchNo}'?`, () => {
      const curItem = items.find((i: any) => i.id === selectedItemId);
      const remainingBatches = (batches || []).filter((b: any) => {
        if (selectedBatchId && (b.id === selectedBatchId || b.batchNo === selectedBatchId)) return false;
        if (curItem && b.itemId === curItem.id && (b.batchNo === batchForm.batchNo || b.batch === batchForm.batchNo)) return false;
        return true;
      });

      saveBatches(remainingBatches);

      // Recalculate item total stock
      if (curItem) {
        const itemRemaining = remainingBatches.filter((b: any) => b.itemId === curItem.id || b.itemName === curItem.name);
        const newTotalStock = itemRemaining.reduce((sum: number, b: any) => sum + (num(b.stock ?? b.qty) || 0), 0);
        const updatedItems = items.map((i: any) => i.id === curItem.id ? { ...i, stock: newTotalStock } : i);
        saveItems(updatedItems);
      }

      showToast(`Batch '${batchForm.batchNo}' deleted permanently!`);
      // Select next batch or reset
      if (curItem) {
        const nextBatches = remainingBatches.filter((b: any) => b.itemId === curItem.id || b.itemName === curItem.name);
        if (nextBatches.length > 0) {
          handleSelectBatch(nextBatches[0], curItem);
        } else {
          handleInsertNewBatch();
        }
      }
    });
  };

  // Save Stock (Batch details, opening, current stock, rates, exp, etc.)
  const handleSaveStock = () => {
    let curItem = items.find((i: any) => i.id === selectedItemId);
    let isCreatedNew = false;
    if (!curItem) {
      if (!itemForm.name.trim()) {
        showToast("Item Name is required!", "error");
        return;
      }
      const newItemId = uid();
      curItem = {
        id: newItemId,
        name: itemForm.name.trim(),
        code: itemForm.code || `ITM-${Date.now().toString().slice(-4)}`,
        hsn: itemForm.hsn,
        barcode: itemForm.barcode,
        size: itemForm.size,
        pack: itemForm.size || "10's",
        unit: batchForm.unit || "10's",
        extra: itemForm.extra,
        minimum: num(itemForm.min) || 5,
        maximum: num(itemForm.max) || 100,
        itemType: itemForm.itemType || "Regular",
        itemCategory: itemForm.category,
        category: itemForm.category,
        breakSaleNotAllowed: itemForm.breakSaleNotAllowed,
        rxRequired: itemForm.rxRequired,
        scheduleH: itemForm.rxRequired,
        taxType: itemForm.taxInclusive ? "inclusive" : "exclusive",
        taxInclusive: itemForm.taxInclusive,
        discountNotAllowed: itemForm.discountNotAllowed,
        company: itemForm.company,
        supplier: itemForm.supplier,
        drugGroup: itemForm.generic,
        generic: itemForm.generic,
        stock: num(batchForm.currentStock) || 0,
        mrp: num(batchForm.mrp) || 0,
        sRate: num(batchForm.sRate) || 0,
        pRate: num(batchForm.pRate) || 0,
        expiryDate: batchForm.expiry,
        location: batchForm.location,
        createdAt: new Date().toISOString(),
      };
      isCreatedNew = true;
      setSelectedItemId(newItemId);
    }
    if (!batchForm.batchNo.trim()) {
      showToast("Batch No is required!", "error");
      document.getElementById("st-batchno-input")?.focus();
      return;
    }

    const newStockNum = num(batchForm.currentStock) || 0;
    const newOpenNum = num(batchForm.openStock) || 0;

    let updatedBatches = [...(batches || [])];
    const existingIdx = updatedBatches.findIndex((b: any) => 
      (selectedBatchId && (b.id === selectedBatchId || b.batchNo === selectedBatchId)) ||
      (b.itemId === curItem.id && (b.batchNo === batchForm.batchNo || b.batch === batchForm.batchNo))
    );

    const batchData = {
      id: existingIdx >= 0 ? updatedBatches[existingIdx].id : uid(),
      itemId: curItem.id,
      itemName: curItem.name,
      unit: batchForm.unit || curItem.unit || "10's",
      gst: num(batchForm.gst) || 5,
      batchNo: batchForm.batchNo.trim().toUpperCase(),
      batch: batchForm.batchNo.trim().toUpperCase(),
      expiryDate: batchForm.expiry,
      expiry: batchForm.expiry,
      discount: num(batchForm.discount) || 0,
      mrp: num(batchForm.mrp) || 0,
      sRate: num(batchForm.sRate) || 0,
      rate: num(batchForm.sRate) || 0,
      pRate: num(batchForm.pRate) || 0,
      landingPrice: num(batchForm.lp) || num(batchForm.pRate) || 0,
      lp: num(batchForm.lp) || num(batchForm.pRate) || 0,
      openingStock: newOpenNum,
      openStock: newOpenNum,
      stock: newStockNum,
      qty: newStockNum,
      currentStock: newStockNum,
      location: batchForm.location || curItem.location || "",
      newMrp: batchForm.newMrp,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      updatedBatches[existingIdx] = { ...updatedBatches[existingIdx], ...batchData };
    } else {
      updatedBatches.push(batchData);
    }

    saveBatches(updatedBatches);
    setSelectedBatchId(batchData.id);
    setIsNewBatchMode(false);

    // Recalculate total item stock across all its batches
    const itemBatches = updatedBatches.filter((b: any) => b.itemId === curItem.id || b.itemName === curItem.name);
    const totalItemStock = itemBatches.reduce((sum: number, b: any) => sum + (num(b.stock ?? b.qty) || 0), 0);

    let updatedItems = isCreatedNew ? [curItem, ...(items || [])] : [...(items || [])];
    updatedItems = updatedItems.map((i: any) => i.id === curItem.id ? {
      ...i,
      stock: totalItemStock,
      mrp: batchData.mrp || i.mrp,
      sRate: batchData.sRate || i.sRate,
      pRate: batchData.pRate || i.pRate,
      expiryDate: batchData.expiryDate || i.expiryDate,
      location: batchData.location || i.location,
    } : i);

    saveItems(updatedItems);
    showToast(`✅ Stock & Batch '${batchData.batchNo}' saved! (Current: ${newStockNum})`);
    if (onItemCreated) {
      onItemCreated(curItem, batchData);
    }
  };

  // Save Item Master details
  const handleSaveItem = () => {
    let curItem = items.find((i: any) => i.id === selectedItemId);
    if (!curItem) {
      if (!itemForm.name.trim()) {
        showToast("Item Name is required!", "error");
        return;
      }
      const newItem = {
        id: uid(),
        name: itemForm.name.trim(),
        code: itemForm.code || `ITM-${Date.now().toString().slice(-4)}`,
        hsn: itemForm.hsn,
        barcode: itemForm.barcode,
        size: itemForm.size,
        pack: itemForm.size || "10's",
        unit: batchForm.unit || "10's",
        extra: itemForm.extra,
        minimum: num(itemForm.min) || 5,
        maximum: num(itemForm.max) || 100,
        itemType: itemForm.itemType || "Regular",
        itemCategory: itemForm.category,
        category: itemForm.category,
        breakSaleNotAllowed: itemForm.breakSaleNotAllowed,
        rxRequired: itemForm.rxRequired,
        scheduleH: itemForm.rxRequired,
        taxType: itemForm.taxInclusive ? "inclusive" : "exclusive",
        taxInclusive: itemForm.taxInclusive,
        discountNotAllowed: itemForm.discountNotAllowed,
        company: itemForm.company,
        supplier: itemForm.supplier,
        drugGroup: itemForm.generic,
        generic: itemForm.generic,
        stock: num(batchForm.currentStock) || 0,
        mrp: num(batchForm.mrp) || 0,
        sRate: num(batchForm.sRate) || 0,
        pRate: num(batchForm.pRate) || 0,
        expiryDate: batchForm.expiry,
        location: batchForm.location,
        createdAt: new Date().toISOString(),
      };
      saveItems([newItem, ...(items || [])]);
      setSelectedItemId(newItem.id);
      showToast(`✅ Item '${newItem.name}' created!`);
      if (onItemCreated) {
        onItemCreated(newItem, null);
      }
      return;
    }

    const updatedItems = items.map((i: any) => i.id === curItem.id ? {
      ...i,
      name: itemForm.name || i.name,
      code: itemForm.code,
      hsn: itemForm.hsn,
      barcode: itemForm.barcode,
      size: itemForm.size,
      pack: itemForm.size || i.pack,
      extra: itemForm.extra,
      minimum: num(itemForm.min) || 5,
      maximum: num(itemForm.max) || 100,
      itemType: itemForm.itemType,
      itemCategory: itemForm.category,
      category: itemForm.category,
      breakSaleNotAllowed: itemForm.breakSaleNotAllowed,
      rxRequired: itemForm.rxRequired,
      scheduleH: itemForm.rxRequired,
      taxType: itemForm.taxInclusive ? "inclusive" : "exclusive",
      taxInclusive: itemForm.taxInclusive,
      discountNotAllowed: itemForm.discountNotAllowed,
      company: itemForm.company,
      supplier: itemForm.supplier,
      drugGroup: itemForm.generic,
      generic: itemForm.generic,
    } : i);

    saveItems(updatedItems);
    showToast(`✅ Item details for '${curItem.name}' updated!`);
    if (onItemCreated) {
      onItemCreated(curItem, null);
    }
  };

  // Keyboard navigation for F-keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        handleInsertNewBatch();
      } else if (e.key === "F7") {
        e.preventDefault();
        document.getElementById("st-item-code-input")?.focus();
      } else if (e.key === "F6") {
        e.preventDefault();
        document.getElementById("st-unit-input")?.focus();
      } else if (e.key === "F11") {
        e.preventDefault();
        setShowCompanyModal(true);
      } else if (e.key === "Insert") {
        e.preventDefault();
        handleInsertNewBatch();
      } else if (e.key === "Delete" && e.shiftKey) {
        e.preventDefault();
        handleDeleteBatch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItemId, selectedBatchId, batchForm, itemForm, items, batches]);

  // Filtered items in left list
  const filteredItems = (items || []).filter((i: any) => {
    const matchesSearch = !itemSearchQuery || 
      (i.name || "").toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      (i.code || "").toLowerCase().includes(itemSearchQuery.toLowerCase());
    const matchesComp = !companyFilter || (i.company || "").toLowerCase() === companyFilter.toLowerCase();
    return matchesSearch && matchesComp;
  });

  const selectedItem = items.find((i: any) => i.id === selectedItemId);
  const selectedItemBatches = (batches || []).filter((b: any) => 
    selectedItem && (b.itemId === selectedItem.id || (b.itemName && b.itemName === selectedItem.name))
  );

  // List of unique companies for F11
  const uniqueCompanies = Array.from(new Set((items || []).map((i: any) => i.company).filter(Boolean)));

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "calc(100vh - 120px)", width: "100%", background: "transparent", color: "var(--color-text-dark)", fontSize: "12px", boxSizing: "border-box" }}>
      
      {/* ── TOP BANNER WITH BREADCRUMB & F11 COMPANYWISE FILTER ── */}
      <div style={{ background: "white", borderRadius: "8px", border: "1px solid var(--color-border)", padding: "6px 12px", marginBottom: "8px", boxShadow: "var(--shadow-card)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>📦</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
              Stock Entry Itemwise
              <span style={{ fontSize: "10px", padding: "1px 8px", borderRadius: "10px", background: "#e0e7ff", color: "#4338ca", fontWeight: "700" }}>
                Direct Stock & Batch Manager
              </span>
            </h2>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              Manage item masters, individual batches, opening balances, rates, and current inventory
            </div>
          </div>
        </div>

        {/* Company filter indicator & action */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {companyFilter && (
            <span style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              Company: <strong>{companyFilter}</strong>
              <button onClick={() => setCompanyFilter("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#b45309", padding: "0 2px" }}>✕</button>
            </span>
          )}

          <button
            onClick={() => setShowCompanyModal(true)}
            style={{ ...btn("#0284c7"), fontSize: "11px", padding: "4px 10px", height: "26px", fontWeight: "700" }}
          >
            F11 - Select Company
          </button>

          <button
            onClick={() => {
              if (onClose) onClose();
              else setActiveSection("inventory");
            }}
            style={{ ...btn("#f1f5f9", "#475569"), border: "1px solid #cbd5e1", fontSize: "11px", padding: "4px 10px", height: "26px" }}
          >
            ✕ Close
          </button>
        </div>

      </div>

      {/* ── MAIN WORKSPACE GRID: LEFT ITEMS LIST | RIGHT BATCHES & DETAILS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: "10px", flex: 1, minHeight: "520px" }}>
        
        {/* ═══ LEFT SIDE: ITEM LIST & SHORTCUTS BOX (MATCHING PAGE 8) ═══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          
          {/* Top Search in Left Table */}
          <div style={{ background: "white", borderRadius: "8px", border: "1px solid var(--color-border)", padding: "6px 8px", boxShadow: "var(--shadow-card)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Search size={13} style={{ color: "#64748b" }} />
            <input
              value={itemSearchQuery}
              onChange={e => setItemSearchQuery(e.target.value)}
              placeholder="Search Item Name / Code..."
              style={{ ...inp, border: "none", padding: "2px", height: "22px", fontSize: "11px", flex: 1, outline: "none", background: "transparent" }}
            />
            {itemSearchQuery && (
              <button onClick={() => setItemSearchQuery("")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>✕</button>
            )}
          </div>

          {/* Left Table: Item Name | Stock (Matching Page 8 Left Table) */}
          <div style={{ background: "white", borderRadius: "8px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", flex: 1, maxHeight: "360px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 5, background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                <tr style={{ height: "26px", fontSize: "11px", fontWeight: "700", color: "#334155" }}>
                  <th style={{ textAlign: "left", padding: "4px 8px" }}>Item Name</th>
                  <th style={{ width: "65px", textAlign: "right", padding: "4px 8px" }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((itm: any) => {
                  const isSelected = itm.id === selectedItemId;
                  return (
                    <tr
                      key={itm.id}
                      onClick={() => handleSelectItem(itm)}
                      style={{
                        background: isSelected ? "#0284c7" : "transparent",
                        color: isSelected ? "white" : "inherit",
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        height: "25px",
                        fontSize: "11px",
                      }}
                    >
                      <td style={{ padding: "3px 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: isSelected ? "700" : "500" }}>
                        {itm.name}
                        {itm.code && <span style={{ opacity: 0.7, fontSize: "10px", marginLeft: "4px" }}>({itm.code})</span>}
                      </td>
                      <td style={{ padding: "3px 8px", textAlign: "right", fontWeight: "700" }}>
                        {itm.stock || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* F11 Shortcut Banner below Left Table */}
          <div
            onClick={() => setShowCompanyModal(true)}
            style={{
              background: "#1e293b",
              color: "#38bdf8",
              padding: "6px 8px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "700",
              textAlign: "center",
              cursor: "pointer",
              border: "1px solid #334155",
            }}
          >
            F11 - Select Company - Companywise Stock Entry
          </div>

          {/* HELP / SHORTCUTS CARD (MATCHING PAGE 8 BLUE BOX EXACTLY) */}
          <div style={{ background: "#0f172a", color: "#93c5fd", padding: "10px 12px", borderRadius: "8px", border: "1px solid #1e293b", fontSize: "11px", lineHeight: "1.6", fontFamily: "monospace" }}>
            <div style={{ color: "#38bdf8", fontWeight: "800", textAlign: "center", marginBottom: "4px" }}>
              ----- From Any Where -----
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
              <span>F2 - New Entry</span>
              <span>F3 - Item Name</span>
              <span>F4 - Item List</span>
              <span>F5 - Batch List</span>
              <span>F8 - Company List</span>
              <span>F9 - Supplier List</span>
            </div>
            <div style={{ color: "#38bdf8", fontWeight: "800", textAlign: "center", marginTop: "6px", marginBottom: "4px" }}>
              ----- From Batch List -----
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span>Insert - Insert New Batch</span>
              <span>Delete - Delete Batch Permanently</span>
            </div>
          </div>

        </div>

        {/* ═══ RIGHT SIDE: BATCH LIST (TOP) & ITEM + BATCH FORM (BOTTOM) ═══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          
          {/* TOP RIGHT: BATCH LIST TABLE (MATCHING PAGE 8 COLUMNS) */}
          <div style={{ background: "white", borderRadius: "8px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            
            <div style={{ padding: "5px 10px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#0f172a" }}>
                Batches for <em>{selectedItem?.name || "Selected Item"}</em> ({selectedItemBatches.length})
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={handleInsertNewBatch}
                  style={{ ...btn("#16a34a"), fontSize: "10px", padding: "2px 8px", fontWeight: "700" }}
                >
                  + Insert New Batch [F2]
                </button>
                <button
                  onClick={handleDeleteBatch}
                  style={{ ...btn("#fee2e2", "#b91c1c"), border: "1px solid #fca5a5", fontSize: "10px", padding: "2px 8px" }}
                >
                  Delete Batch [Del]
                </button>
              </div>
            </div>

            <div style={{ maxHeight: "140px", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 5, background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                  <tr style={{ height: "24px", fontSize: "10px", fontWeight: "700", color: "#334155" }}>
                    <th style={{ width: "70px", textAlign: "left", padding: "2px 6px" }}>Unit</th>
                    <th style={{ width: "110px", textAlign: "left", padding: "2px 6px" }}>Batch</th>
                    <th style={{ width: "80px", textAlign: "center", padding: "2px 4px" }}>Expiry</th>
                    <th style={{ width: "80px", textAlign: "right", padding: "2px 6px" }}>Mrp</th>
                    <th style={{ width: "80px", textAlign: "right", padding: "2px 6px" }}>Opening</th>
                    <th style={{ width: "80px", textAlign: "right", padding: "2px 6px" }}>Current</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItemBatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "12px", color: "#94a3b8", fontSize: "11px" }}>
                        No batches exist. Click "+ Insert New Batch" or enter details below to create one.
                      </td>
                    </tr>
                  ) : (
                    selectedItemBatches.map((b: any, idx: number) => {
                      const isSelected = (selectedBatchId && (b.id === selectedBatchId || b.batchNo === selectedBatchId)) || (!selectedBatchId && idx === 0 && !isNewBatchMode);
                      return (
                        <tr
                          key={b.id || idx}
                          onClick={() => handleSelectBatch(b)}
                          style={{
                            background: isSelected ? "#e0f2fe" : idx % 2 === 0 ? "white" : "#fafafa",
                            borderBottom: "1px solid #f1f5f9",
                            cursor: "pointer",
                            height: "24px",
                            fontSize: "11px",
                            fontWeight: isSelected ? "700" : "500",
                          }}
                        >
                          <td style={{ padding: "2px 6px" }}>{b.unit || selectedItem?.unit || "10's"}</td>
                          <td style={{ padding: "2px 6px", color: "#0369a1", fontWeight: "700" }}>{b.batchNo || b.batch}</td>
                          <td style={{ padding: "2px 4px", textAlign: "center" }}>{b.expiryDate || b.expiry || "—"}</td>
                          <td style={{ padding: "2px 6px", textAlign: "right" }}>₹{fmt(b.mrp)}</td>
                          <td style={{ padding: "2px 6px", textAlign: "right" }}>{b.openingStock ?? b.openStock ?? 0}</td>
                          <td style={{ padding: "2px 6px", textAlign: "right", fontWeight: "800", color: "#16a34a" }}>
                            {b.stock ?? b.qty ?? 0}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* BOTTOM RIGHT: ITEM & BATCH DETAILS FORM (MATCHING PAGE 8 EXACT FIELDS) */}
          <div style={{ background: "white", borderRadius: "8px", border: "1px solid var(--color-border)", padding: "10px 14px", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              
              {/* ─── LEFT SUB-COLUMN: ITEM MASTER DETAILS & FLAGS ─── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                
                {/* Item Name */}
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#1d4ed8" }}>Name * :</span>
                  <input
                    value={itemForm.name}
                    onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="Medicine / Item Name..."
                    style={{ ...inp, height: "22px", fontSize: "11px", fontWeight: "700", color: "#0f172a" }}
                  />
                </div>

                {/* Code [F7] */}
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Code[F7] :</span>
                  <input
                    id="st-item-code-input"
                    value={itemForm.code}
                    onChange={e => setItemForm({ ...itemForm, code: e.target.value })}
                    style={{ ...inp, height: "22px", fontSize: "11px", fontWeight: "700" }}
                  />
                </div>

                {/* HSN Code */}
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>HSN Code :</span>
                  <input
                    value={itemForm.hsn}
                    onChange={e => setItemForm({ ...itemForm, hsn: e.target.value })}
                    style={{ ...inp, height: "22px", fontSize: "11px" }}
                  />
                </div>

                {/* Barcode with VAT / GST indicator */}
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr auto", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Barcode :</span>
                  <input
                    value={itemForm.barcode}
                    onChange={e => setItemForm({ ...itemForm, barcode: e.target.value })}
                    style={{ ...inp, height: "22px", fontSize: "11px" }}
                  />
                  <span style={{ fontSize: "10px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "3px", border: "1px solid #cbd5e1", fontWeight: "700", color: "#475569" }}>
                    GST
                  </span>
                </div>

                {/* Size with New MRP */}
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr auto", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Size :</span>
                  <input
                    value={itemForm.size}
                    onChange={e => setItemForm({ ...itemForm, size: e.target.value })}
                    style={{ ...inp, height: "22px", fontSize: "11px" }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "10px", cursor: "pointer", fontWeight: "600" }}>
                    <input
                      type="checkbox"
                      checked={batchForm.newMrp}
                      onChange={e => setBatchForm({ ...batchForm, newMrp: e.target.checked })}
                      style={{ width: "11px", height: "11px" }}
                    />
                    New MRP
                  </label>
                </div>

                {/* Extra */}
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Extra :</span>
                  <input
                    value={itemForm.extra}
                    onChange={e => setItemForm({ ...itemForm, extra: e.target.value })}
                    style={{ ...inp, height: "22px", fontSize: "11px" }}
                  />
                </div>

                {/* Min & Max */}
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr 40px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Min :</span>
                  <input
                    type="number"
                    value={itemForm.min}
                    onChange={e => setItemForm({ ...itemForm, min: e.target.value })}
                    style={{ ...inp, height: "22px", fontSize: "11px" }}
                  />
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155", textAlign: "right" }}>Max :</span>
                  <input
                    type="number"
                    value={itemForm.max}
                    onChange={e => setItemForm({ ...itemForm, max: e.target.value })}
                    style={{ ...inp, height: "22px", fontSize: "11px" }}
                  />
                </div>

                {/* ItemType & Category */}
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>ItemType :</span>
                  <input
                    value={itemForm.itemType}
                    onChange={e => setItemForm({ ...itemForm, itemType: e.target.value })}
                    style={{ ...inp, height: "22px", fontSize: "11px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Category :</span>
                  <input
                    value={itemForm.category}
                    onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                    style={{ ...inp, height: "22px", fontSize: "11px" }}
                  />
                </div>

                {/* CHECKBOXES (MATCHING PAGE 8) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px", background: "#f8fafc", padding: "4px 8px", borderRadius: "4px", border: "1px solid #e2e8f0", margin: "2px 0" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={itemForm.breakSaleNotAllowed}
                      onChange={e => setItemForm({ ...itemForm, breakSaleNotAllowed: e.target.checked })}
                    />
                    Break Sale Not
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={itemForm.discountNotAllowed}
                      onChange={e => setItemForm({ ...itemForm, discountNotAllowed: e.target.checked })}
                    />
                    Disc Not Allow
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={itemForm.rxRequired}
                      onChange={e => setItemForm({ ...itemForm, rxRequired: e.target.checked })}
                    />
                    Sale on Rx Only
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={itemForm.taxInclusive}
                      onChange={e => setItemForm({ ...itemForm, taxInclusive: e.target.checked })}
                    />
                    Inclusive of Tax
                  </label>
                </div>

                {/* Company, Supplier, Generic */}
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Company :</span>
                  <input
                    value={itemForm.company}
                    onChange={e => setItemForm({ ...itemForm, company: e.target.value })}
                    placeholder="Manufacturer..."
                    style={{ ...inp, height: "22px", fontSize: "11px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Supplier :</span>
                  <input
                    value={itemForm.supplier}
                    onChange={e => setItemForm({ ...itemForm, supplier: e.target.value })}
                    placeholder="Distributor / Vendor..."
                    style={{ ...inp, height: "22px", fontSize: "11px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Generic :</span>
                  <input
                    value={itemForm.generic}
                    onChange={e => setItemForm({ ...itemForm, generic: e.target.value })}
                    placeholder="Drug composition..."
                    style={{ ...inp, height: "22px", fontSize: "11px" }}
                  />
                </div>

              </div>

              {/* ─── RIGHT SUB-COLUMN: BATCH & RATES & STOCK DETAILS ─── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                
                {/* Unit [F6] */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Unit[F6] :</span>
                  <input
                    id="st-unit-input"
                    value={batchForm.unit}
                    onChange={e => setBatchForm({ ...batchForm, unit: e.target.value })}
                    style={{ ...inp, height: "22px", fontSize: "11px" }}
                  />
                </div>

                {/* GST % */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>GST % :</span>
                  <select
                    value={batchForm.gst}
                    onChange={e => setBatchForm({ ...batchForm, gst: e.target.value })}
                    style={{ ...inp, height: "22px", fontSize: "11px", padding: "1px 4px" }}
                  >
                    {GST_RATES.map((r: any) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>

                {/* Batch No */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#1d4ed8" }}>Batch * :</span>
                  <input
                    id="st-batchno-input"
                    value={batchForm.batchNo}
                    onChange={e => setBatchForm({ ...batchForm, batchNo: e.target.value.toUpperCase() })}
                    placeholder="e.g. BATCH123"
                    style={{ ...inp, height: "22px", fontSize: "11px", fontWeight: "800", color: "#1d4ed8" }}
                  />
                </div>

                {/* Expiry with Dis: */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 35px 60px", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Expiry :</span>
                  <input
                    value={batchForm.expiry}
                    onChange={e => setBatchForm({ ...batchForm, expiry: e.target.value })}
                    placeholder="MM/YY"
                    style={{ ...inp, height: "22px", fontSize: "11px" }}
                  />
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155", textAlign: "right" }}>Dis:</span>
                  <input
                    type="number"
                    value={batchForm.discount}
                    onChange={e => setBatchForm({ ...batchForm, discount: e.target.value })}
                    placeholder="0%"
                    style={{ ...inp, height: "22px", fontSize: "11px", textAlign: "right" }}
                  />
                </div>

                {/* M.R.P. */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>M.R.P. :</span>
                  <input
                    type="number"
                    value={batchForm.mrp}
                    onChange={e => setBatchForm({ ...batchForm, mrp: e.target.value })}
                    placeholder="0.00"
                    style={{ ...inp, height: "22px", fontSize: "11px", textAlign: "right", fontWeight: "700" }}
                  />
                </div>

                {/* S.Rate (Sales Rate) */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>S.Rate :</span>
                  <input
                    type="number"
                    value={batchForm.sRate}
                    onChange={e => setBatchForm({ ...batchForm, sRate: e.target.value })}
                    placeholder="0.00"
                    style={{ ...inp, height: "22px", fontSize: "11px", textAlign: "right", fontWeight: "700", color: "#16a34a" }}
                  />
                </div>

                {/* P.Rate (Purchase Rate) */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>P.Rate :</span>
                  <input
                    type="number"
                    value={batchForm.pRate}
                    onChange={e => setBatchForm({ ...batchForm, pRate: e.target.value })}
                    placeholder="0.00"
                    style={{ ...inp, height: "22px", fontSize: "11px", textAlign: "right" }}
                  />
                </div>

                {/* LP (Landing Price) */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>LP :</span>
                  <input
                    type="number"
                    value={batchForm.lp}
                    onChange={e => setBatchForm({ ...batchForm, lp: e.target.value })}
                    placeholder="0.00"
                    style={{ ...inp, height: "22px", fontSize: "11px", textAlign: "right" }}
                  />
                </div>

                {/* Open Stock (Opening Stock) */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Open Stock :</span>
                  <input
                    type="number"
                    value={batchForm.openStock}
                    onChange={e => setBatchForm({ ...batchForm, openStock: e.target.value })}
                    placeholder="0"
                    style={{ ...inp, height: "22px", fontSize: "11px", textAlign: "right", fontWeight: "600" }}
                  />
                </div>

                {/* Current Stk (Current Stock) */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#0f172a" }}>Current Stk * :</span>
                  <input
                    type="number"
                    value={batchForm.currentStock}
                    onChange={e => setBatchForm({ ...batchForm, currentStock: e.target.value })}
                    placeholder="0"
                    style={{ ...inp, height: "24px", fontSize: "12px", textAlign: "right", fontWeight: "900", color: "#0284c7", background: "#f0f9ff", border: "1px solid #7dd3fc" }}
                  />
                </div>

                {/* Location */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Location :</span>
                  <input
                    value={batchForm.location}
                    onChange={e => setBatchForm({ ...batchForm, location: e.target.value })}
                    placeholder="Rack / Shelf / Drawer..."
                    style={{ ...inp, height: "22px", fontSize: "11px" }}
                  />
                </div>

              </div>

            </div>

            {/* ─── ACTION BUTTONS AT BOTTOM RIGHT (MATCHING PAGE 8) ─── */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", borderTop: "1px solid #e2e8f0", paddingTop: "8px", flexWrap: "wrap", alignItems: "center" }}>
              
              <button
                onClick={() => document.getElementById("st-item-code-input")?.focus()}
                style={{ ...btn("#f1f5f9", "#334155"), border: "1px solid #cbd5e1", fontSize: "11px", padding: "4px 10px" }}
              >
                Focus Code [F7]
              </button>

              <button
                onClick={handleSaveStock}
                style={{ ...btn("#0284c7"), fontSize: "12px", padding: "5px 14px", fontWeight: "800", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <CheckCircle size={13} /> Save Stock
              </button>

              <button
                onClick={handleSaveItem}
                style={{ ...btn("#16a34a"), fontSize: "12px", padding: "5px 14px", fontWeight: "800", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <CheckCircle size={13} /> Save Item
              </button>

              <button
                onClick={handleInsertNewBatch}
                style={{ ...btn("#8b5cf6"), fontSize: "11px", padding: "4px 10px" }}
              >
                Change Batch
              </button>

              <button
                onClick={() => {
                  if (selectedItem) handleSelectItem(selectedItem);
                }}
                style={{ ...btn("#f1f5f9", "#475569"), border: "1px solid #cbd5e1", fontSize: "11px", padding: "4px 10px" }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (onClose) onClose();
                  else setActiveSection("inventory");
                }}
                style={{ ...btn("#64748b"), fontSize: "11px", padding: "4px 12px" }}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* ─── COMPANY SELECT MODAL (F11) ─── */}
      {showCompanyModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: "450px", maxHeight: "80vh", background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 16px", background: "#0284c7", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800" }}>🏢 Select Company (F11)</h3>
              <button onClick={() => setShowCompanyModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>
              <button
                onClick={() => { setCompanyFilter(""); setShowCompanyModal(false); }}
                style={{ ...btn("#f1f5f9", "#334155"), width: "100%", textAlign: "left", fontSize: "11px", padding: "6px 10px", border: "1px solid #cbd5e1", marginBottom: "6px" }}
              >
                Show All Companies ({items.length} items)
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 14px" }}>
              {uniqueCompanies.map((comp: any) => {
                const count = items.filter((i: any) => i.company === comp).length;
                return (
                  <div
                    key={comp}
                    onClick={() => { setCompanyFilter(comp); setShowCompanyModal(false); }}
                    style={{ padding: "6px 8px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: "11px", display: "flex", justifyContent: "space-between" }}
                    className="hover:bg-slate-50"
                  >
                    <strong>{comp}</strong>
                    <span style={{ color: "#64748b" }}>{count} items</span>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "8px 14px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowCompanyModal(false)} style={{ ...btn("#64748b"), fontSize: "11px", padding: "4px 12px" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
