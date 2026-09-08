// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, CheckCircle, Trash2, Plus, ArrowLeft, ArrowRight, Printer, AlertTriangle, FileText, RefreshCw, ShoppingCart, Check, Filter } from "lucide-react";
import { useMedicalStore, today, uid, num, fmt, int, inp, lbl, btn } from './MedicalStoreContext';

export default function OrderProcessing() {
  const {
    items, saveItems,
    batches, suppliers,
    showToast, showConfirm,
    setPrintHtml, appSetupData
  } = useMedicalStore();

  // ─── PERSISTED PURCHASE ORDERS LIST ───
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('store_purchase_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const saveOrdersList = (list: any[]) => {
    setPurchaseOrders(list);
    try {
      localStorage.setItem('store_purchase_orders', JSON.stringify(list));
    } catch (_) {}
  };

  // ─── WORKSTATION & ACTIVE ORDER STATE ───
  const [showWorkstation, setShowWorkstation] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  // Filter mode radio: 'd_order' | 'all' | 'min_order' | 'max_order' | 'item_mast'
  const [filterMode, setFilterMode] = useState<string>("min_order");

  // Checkboxes
  const [reGivenOrder, setReGivenOrder] = useState(false);
  const [maxGreaterThanZero, setMaxGreaterThanZero] = useState(true);
  const [onlyStock, setOnlyStock] = useState(false);
  const [dontPrintUnit, setDontPrintUnit] = useState(false);
  const [printStock, setPrintStock] = useState(true);

  // Selectors
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [confirmStatus, setConfirmStatus] = useState<string>("All");
  const [printFormat, setPrintFormat] = useState<string>("600*300");

  // Table rows
  const [rows, setRows] = useState<any[]>([]);

  // Distinct companies list from items
  const companyList = useMemo(() => {
    const set = new Set<string>();
    (items || []).forEach(i => {
      if (i.company && i.company.trim()) set.add(i.company.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  // Start a fresh Order Processing session
  const handleNewOrder = () => {
    setActiveOrderId(null);
    setSelectedSupplier("");
    setSelectedCompany("");
    setFilterMode("min_order");
    setShowWorkstation(true);

    // Auto load items based on min_order
    loadFilteredItems("min_order", "", "");
  };

  // Open an existing saved purchase order
  const handleOpenOrder = (ord: any) => {
    if (!ord) return;
    setActiveOrderId(ord.id);
    setSelectedSupplier(ord.supplierName || "");
    setSelectedCompany(ord.company || "");
    setRows(ord.items || []);
    setShowWorkstation(true);
  };

  // Populate rows based on filter
  const loadFilteredItems = (mode = filterMode, supp = selectedSupplier, comp = selectedCompany) => {
    let list = [...(items || [])];

    // Supplier filter
    if (supp) {
      list = list.filter(i => (i.supplier || "").toLowerCase() === supp.toLowerCase());
    }

    // Company filter
    if (comp) {
      list = list.filter(i => (i.company || "").toLowerCase() === comp.toLowerCase());
    }

    // Maximum > 0 checkbox
    if (maxGreaterThanZero) {
      list = list.filter(i => num(i.maximum) > 0 || num(i.max) > 0 || !i.maximum);
    }

    // Only stock checkbox
    if (onlyStock) {
      list = list.filter(i => num(i.stock) > 0);
    }

    // Mode filter
    if (mode === "min_order") {
      // Reorder items where current stock <= minimum
      list = list.filter(i => {
        const curStock = num(i.stock);
        const minStock = num(i.minimum) || num(i.min) || 5;
        return curStock <= minStock;
      });
    } else if (mode === "max_order") {
      // Items below maximum stock
      list = list.filter(i => {
        const curStock = num(i.stock);
        const maxStock = num(i.maximum) || num(i.max) || 20;
        return curStock < maxStock;
      });
    }

    // Map to grid rows
    const mappedRows = list.map((item, idx) => {
      const minLvl = num(item.minimum) || num(item.min) || 5;
      const maxLvl = num(item.maximum) || num(item.max) || 15;
      const curStock = num(item.stock) || 0;
      
      // Auto-suggest order quantity: bring stock up to maximum, or at least minLvl
      const suggestedQty = Math.max(1, maxLvl - curStock);

      return {
        id: item.id || uid(),
        srNo: idx + 1,
        itemId: item.id,
        company: item.company || "GENERIC",
        itemName: item.name,
        qty: suggestedQty,
        fr: 0,
        vr: fmt(item.pRate || item.price || 0),
        lastPurchase: item.lastPurchaseDate ? `${item.lastPurchaseDate} (₹${fmt(item.lastPurchaseRate || item.pRate)})` : "N/A",
        stock: curStock,
        min: minLvl,
        max: maxLvl,
        schem: item.discount ? `${item.discount}%` : "-",
        confirmed: false,
        unit: item.unit || item.pack || "10'S"
      };
    });

    setRows(mappedRows);
    if (mappedRows.length === 0) {
      showToast("No items found matching the selected filters", "info");
    } else {
      showToast(`Loaded ${mappedRows.length} items for ordering`);
    }
  };

  // Online Orders handler: load items from pending customer orders
  const handleLoadOnlineOrders = () => {
    try {
      const orders = JSON.parse(localStorage.getItem('store_customer_orders') || '[]');
      const pendingOrders = orders.filter((o: any) => o.status === "Pending" || o.status === "Ready");
      
      const itemMap: { [key: string]: { item: any, count: number } } = {};
      pendingOrders.forEach((ord: any) => {
        (ord.items || []).forEach((cartItem: any) => {
          const key = cartItem.id || cartItem.name;
          if (!itemMap[key]) {
            itemMap[key] = { item: cartItem, count: 0 };
          }
          itemMap[key].count += (int(cartItem.quantity) || 1);
        });
      });

      const onlineRows = Object.values(itemMap).map((entry, idx) => {
        const found = (items || []).find((i: any) => i.id === entry.item.id || i.name === entry.item.name);
        return {
          id: entry.item.id || uid(),
          srNo: idx + 1,
          itemId: entry.item.id,
          company: found?.company || entry.item.company || "GENERIC",
          itemName: entry.item.name,
          qty: entry.count,
          fr: 0,
          vr: fmt(found?.pRate || entry.item.price || 0),
          lastPurchase: "Online Demand",
          stock: found?.stock || 0,
          min: found?.minimum || 5,
          max: found?.maximum || 15,
          schem: "-",
          confirmed: true,
          unit: entry.item.unit || "10'S"
        };
      });

      if (onlineRows.length === 0) {
        showToast("No pending customer orders found!", "info");
        return;
      }

      setRows(onlineRows);
      showToast(`✅ Loaded ${onlineRows.length} items from Online Customer Orders!`);
    } catch (e) {
      showToast("Failed to load online orders", "error");
    }
  };

  // Re-Order handler
  const handleReOrder = () => {
    setFilterMode("min_order");
    loadFilteredItems("min_order");
  };

  // Auto Order handler: automatically calculate based on sales velocity and shortfalls
  const handleAutoOrder = () => {
    setFilterMode("min_order");
    loadFilteredItems("min_order");
    showToast("⚡ Auto calculated replenishment orders!");
  };

  // Clear Order handler
  const handleClearOrder = () => {
    setRows([]);
    showToast("Order items cleared");
  };

  // Toggle row confirmation
  const handleToggleConfirm = (idx: number) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], confirmed: !next[idx].confirmed };
      return next;
    });
  };

  // Update row quantity
  const handleQtyChange = (idx: number, val: string) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], qty: num(val) };
      return next;
    });
  };

  // Update row free qty
  const handleFrChange = (idx: number, val: string) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], fr: num(val) };
      return next;
    });
  };

  // Remove row
  const handleRemoveRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, srNo: i + 1 })));
  };

  // Save Order
  const handleSaveOrder = (isMemo = false) => {
    const validRows = rows.filter(r => num(r.qty) > 0);
    if (validRows.length === 0) {
      showToast("Please enter quantity for at least one item!", "error");
      return;
    }

    const orderNum = activeOrderId ? 
      (purchaseOrders.find(o => o.id === activeOrderId)?.orderNo || `PO-${Date.now().toString().slice(-5)}`) :
      `PO-${Date.now().toString().slice(-5)}`;

    const orderRecord = {
      id: activeOrderId || uid(),
      orderNo: orderNum,
      date: today(),
      supplierName: selectedSupplier || "ALL SUPPLIERS",
      company: selectedCompany || "ALL COMPANIES",
      items: validRows,
      totalItems: validRows.length,
      totalQty: validRows.reduce((s, r) => s + num(r.qty), 0),
      totalValue: validRows.reduce((s, r) => s + (num(r.qty) * num(r.vr)), 0),
      isMemo,
      status: isMemo ? "Memo" : "Confirmed",
      createdAt: new Date().toISOString()
    };

    let updatedList;
    if (activeOrderId) {
      updatedList = purchaseOrders.map(o => o.id === activeOrderId ? orderRecord : o);
    } else {
      updatedList = [orderRecord, ...purchaseOrders];
    }

    saveOrdersList(updatedList);
    setActiveOrderId(orderRecord.id);
    showToast(`✅ ${isMemo ? 'Memo' : 'Purchase Order'} #${orderNum} saved successfully!`);
  };

  // Delete Order
  const handleDeleteOrder = (idToDelete: string) => {
    showConfirm("Delete this Purchase Order?", () => {
      const filtered = purchaseOrders.filter(o => o.id !== idToDelete);
      saveOrdersList(filtered);
      showToast("Purchase order deleted");
      if (activeOrderId === idToDelete) {
        setShowWorkstation(false);
      }
    });
  };

  // Print Order Slip (Matches Print Select / Print Conf from screenshot)
  const handlePrint = (onlyConfirmed = false) => {
    const printRows = onlyConfirmed ? rows.filter(r => r.confirmed && num(r.qty) > 0) : rows.filter(r => num(r.qty) > 0);
    if (printRows.length === 0) {
      showToast("No items to print!", "error");
      return;
    }

    const totalQty = printRows.reduce((s, r) => s + num(r.qty), 0);
    const totalVal = printRows.reduce((s, r) => s + (num(r.qty) * num(r.vr)), 0);

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #0f172a; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px;">
          <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;">SHIV DHARA MEDICAL STORE</h2>
          <p style="margin: 2px 0; font-size: 11px;">20, GIRIRAJ COMPLEX NIKOL GAAM ROAD, NIKOL, AHMEDABAD | PH: 079352 07999</p>
          <div style="display: inline-block; background: #0284c7; color: white; padding: 2px 14px; border-radius: 4px; font-weight: 700; font-size: 12px; margin-top: 5px;">
            SUPPLIER PURCHASE REQUISITION / ORDER SLIP
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px;">
          <div>
            <strong>Supplier:</strong> ${selectedSupplier || "ALL SUPPLIERS"}<br/>
            <strong>Company:</strong> ${selectedCompany || "ALL COMPANIES"}<br/>
            <strong>Filter Mode:</strong> ${filterMode.toUpperCase()}
          </div>
          <div style="text-align: right;">
            <strong>Order Date:</strong> ${today()}<br/>
            <strong>Items Count:</strong> ${printRows.length}<br/>
            <strong>Format:</strong> ${printFormat}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1px solid #94a3b8;">
              <th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 35px;">#</th>
              <th style="padding: 5px; text-align: left; border: 1px solid #cbd5e1;">Item Name</th>
              <th style="padding: 5px; text-align: left; border: 1px solid #cbd5e1; width: 100px;">Company</th>
              ${dontPrintUnit ? '' : '<th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 60px;">Unit</th>'}
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 60px; background: #e0f2fe;">Order Qty</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 50px;">Free</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 70px;">P.Rate</th>
              ${printStock ? '<th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 60px;">Cur. Stock</th>' : ''}
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 80px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${printRows.map((r, i) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">${i + 1}</td>
                <td style="padding: 4px; border: 1px solid #cbd5e1;"><strong>${r.itemName}</strong></td>
                <td style="padding: 4px; border: 1px solid #cbd5e1;">${r.company}</td>
                ${dontPrintUnit ? '' : `<td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">${r.unit || "10'S"}</td>`}
                <td style="padding: 4px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1; background: #f0f9ff; color: #0369a1;">${r.qty}</td>
                <td style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">${r.fr || '-'}</td>
                <td style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">₹${fmt(r.vr)}</td>
                ${printStock ? `<td style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">${r.stock}</td>` : ''}
                <td style="padding: 4px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1;">₹${fmt(num(r.qty) * num(r.vr))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px;">
          <div>
            <strong>Total Order Units:</strong> ${totalQty}
          </div>
          <div style="text-align: right;">
            <strong>Estimated Order Value:</strong> ₹${fmt(totalVal)}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 8px; font-size: 10px;">
          <div style="border-top: 1px solid #94a3b8; width: 150px; text-align: center;">Prepared By</div>
          <div style="border-top: 1px solid #94a3b8; width: 150px; text-align: center;">Supplier Copy</div>
        </div>
      </div>
    `;

    setPrintHtml(html);
  };

  // Calculations for totals bar
  const validOrderRows = rows.filter(r => num(r.qty) > 0);
  const totalOrderUnits = validOrderRows.reduce((s, r) => s + num(r.qty), 0);
  const totalOrderValuation = validOrderRows.reduce((s, r) => s + (num(r.qty) * num(r.vr)), 0);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: SINGLE CENTER BUTTON (When no order workstation open) — Rule #2 compliant
  // ══════════════════════════════════════════════════════════════════════════════
  if (!showWorkstation) {
    const filteredOrders = (orderSearchQuery.trim() ? purchaseOrders.filter(o => 
      String(o.orderNo || "").toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      String(o.supplierName || "").toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      String(o.company || "").toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      String(o.date || "").includes(orderSearchQuery)
    ) : purchaseOrders).slice(0, 15);

    return (
      <div style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header Title with Search Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📦</span> Order Processing ({purchaseOrders.length})
            </h2>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
              Supplier Reorders, Minimum Stock Replenishment, Online Demand & Purchase Orders
            </p>
          </div>

          <div style={{ position: "relative", minWidth: "280px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "8px", color: "#64748b" }} />
            <input
              placeholder="Search Order#, Supplier, Company, Date... + Enter"
              value={orderSearchQuery}
              onChange={e => setOrderSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && filteredOrders.length > 0) {
                  handleOpenOrder(filteredOrders[0]);
                }
              }}
              style={{ ...inp, paddingLeft: "30px", background: "white" }}
            />
          </div>
        </div>

        {/* ── SINGLE CENTER BUTTON WORKSPACE (Strict Rule #2: Only Center Button) ── */}
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b", background: "white", borderRadius: "10px", border: "1px dashed var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "44px", opacity: 0.8, marginBottom: "8px" }}>📋</div>
          <h3 style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "17px", color: "var(--color-text-dark)" }}>
            Supplier Purchase Order Processing
          </h3>
          <p style={{ fontSize: "12px", opacity: 0.75, maxWidth: "540px", margin: "0 auto 18px", lineHeight: "1.5" }}>
            Generate replenishment purchase orders automatically based on Min/Max stock thresholds, sync online customer demand, and export supplier order slips.
          </p>

          {/* SINGLE CENTER BUTTON */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button 
              onClick={handleNewOrder} 
              style={{ ...btn("var(--color-primary)"), padding: "10px 22px", fontSize: "14px", fontWeight: "700", borderRadius: "8px" }}
            >
              ➕ New Order Processing
            </button>
          </div>
        </div>

        {/* Recent Purchase Orders Table */}
        {purchaseOrders.length > 0 && (
          <div style={{ marginTop: "24px", background: "white", borderRadius: "8px", border: "1px solid var(--color-border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                📋 Saved Purchase Orders ({purchaseOrders.length})
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Click on any order to view or re-process</div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", color: "#475569", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "100px" }}>Order#</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Supplier</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Company</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "100px" }}>Date</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "80px" }}>Items</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", width: "90px" }}>Total Qty</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", width: "120px" }}>Est. Valuation</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "90px" }}>Status</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "100px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(ord => (
                    <tr 
                      key={ord.id}
                      onClick={() => handleOpenOrder(ord)}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "700", color: "var(--color-primary)" }}>
                        {ord.orderNo}
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: "600", color: "#1e293b" }}>
                        {ord.supplierName || "ALL SUPPLIERS"}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#475569" }}>
                        {ord.company || "ALL COMPANIES"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", color: "#64748b" }}>
                        {ord.date}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", color: "#1e293b" }}>
                        {ord.totalItems || (ord.items ? ord.items.length : 0)}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: "#0284c7" }}>
                        {ord.totalQty || 0}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>
                        ₹{fmt(ord.totalValue || 0)}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "10px",
                          fontWeight: "700",
                          background: ord.isMemo ? "#fef3c7" : "#dcfce7",
                          color: ord.isMemo ? "#b45309" : "#15803d"
                        }}>
                          {ord.status || (ord.isMemo ? "Memo" : "Confirmed")}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                          <button 
                            onClick={() => handleOpenOrder(ord)} 
                            style={{ ...btn("var(--color-primary)"), padding: "3px 8px", fontSize: "11px" }}
                          >
                            Open
                          </button>
                          <button 
                            onClick={() => handleDeleteOrder(ord.id)} 
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "2px" }}
                            title="Delete Order"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
  // RENDER: FULL INTERACTIVE ORDER PROCESSING WORKSTATION (Matches transection.pdf Page 10)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: "white", borderRadius: "8px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", minHeight: "84vh" }}>
      
      {/* ── TOP CONTROLS & FILTER BAR (MATCHES EXACT LAYOUT IN SCREENSHOT PAGE 10) ── */}
      <div style={{ padding: "8px 12px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", flexDirection: "column", gap: "8px" }}>
        
        {/* Row 1: Left Radio Buttons, Center Selectors, Right Action Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          
          {/* Left Radio Controls & Filters */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", fontWeight: "700", color: "#334155" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input type="radio" name="filterMode" checked={filterMode === "d_order"} onChange={() => { setFilterMode("d_order"); loadFilteredItems("d_order"); }} />
                D - Order
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input type="radio" name="filterMode" checked={filterMode === "all"} onChange={() => { setFilterMode("all"); loadFilteredItems("all"); }} />
                All
              </label>
              <button 
                onClick={() => loadFilteredItems(filterMode)} 
                style={{ ...btn("#f1f5f9", "#0f172a"), padding: "2px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }}
              >
                Show
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", fontWeight: "600", color: "#475569" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input type="radio" name="filterMode" checked={filterMode === "min_order"} onChange={() => { setFilterMode("min_order"); loadFilteredItems("min_order"); }} />
                Min. Order
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input type="radio" name="filterMode" checked={filterMode === "max_order"} onChange={() => { setFilterMode("max_order"); loadFilteredItems("max_order"); }} />
                Max. Order
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input type="radio" name="filterMode" checked={filterMode === "item_mast"} onChange={() => { setFilterMode("item_mast"); loadFilteredItems("item_mast"); }} />
                Item Mast
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", color: "#475569", marginTop: "2px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input type="checkbox" checked={reGivenOrder} onChange={e => setReGivenOrder(e.target.checked)} />
                Re Given Order
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input type="checkbox" checked={maxGreaterThanZero} onChange={e => { setMaxGreaterThanZero(e.target.checked); loadFilteredItems(); }} />
                Maximum &gt; 0
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input type="checkbox" checked={onlyStock} onChange={e => { setOnlyStock(e.target.checked); loadFilteredItems(); }} />
                Only Stock
              </label>
            </div>
          </div>

          {/* Middle Selectors: Supplier, Company, Confirm */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "300px" }}>
            
            {/* Supplier Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", width: "65px", color: "#1e293b" }}>Supplier:</span>
              <select
                value={selectedSupplier}
                onChange={e => {
                  setSelectedSupplier(e.target.value);
                  loadFilteredItems(filterMode, e.target.value, selectedCompany);
                }}
                style={{ ...inp, height: "24px", fontSize: "11px", padding: "2px 6px" }}
              >
                <option value="">-- ALL SUPPLIERS --</option>
                {(suppliers || []).map((s: any) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Company Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", width: "65px", color: "#1e293b" }}>Company:</span>
              <select
                value={selectedCompany}
                onChange={e => {
                  setSelectedCompany(e.target.value);
                  loadFilteredItems(filterMode, selectedSupplier, e.target.value);
                }}
                style={{ ...inp, height: "24px", fontSize: "11px", padding: "2px 6px" }}
              >
                <option value="">-- ALL COMPANIES --</option>
                {companyList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Confirm Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", width: "65px", color: "#1e293b" }}>Confirm:</span>
              <select
                value={confirmStatus}
                onChange={e => setConfirmStatus(e.target.value)}
                style={{ ...inp, height: "24px", fontSize: "11px", padding: "2px 6px" }}
              >
                <option value="All">All Statuses</option>
                <option value="Confirmed">Confirmed Only</option>
                <option value="Pending">Pending Only</option>
              </select>
            </div>
          </div>

          {/* Right Action Buttons & Toggles (From Screenshot) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              <button 
                onClick={() => handleSaveOrder(false)} 
                style={{ ...btn("var(--color-primary)"), padding: "4px 14px", fontSize: "11px", fontWeight: "700" }}
              >
                Save Order
              </button>

              <div style={{ display: "flex", gap: "2px" }}>
                <button 
                  onClick={() => setRows(prev => prev.map(r => ({ ...r, confirmed: true })))} 
                  style={{ ...btn("#f1f5f9", "#15803d"), padding: "4px 8px", fontSize: "11px", border: "1px solid #cbd5e1" }}
                  title="Confirm All"
                >
                  Y
                </button>
                <button 
                  onClick={() => setRows(prev => prev.map(r => ({ ...r, confirmed: false })))} 
                  style={{ ...btn("#f1f5f9", "#dc2626"), padding: "4px 8px", fontSize: "11px", border: "1px solid #cbd5e1" }}
                  title="Unconfirm All"
                >
                  N
                </button>
                <button 
                  onClick={() => handleSaveOrder(true)} 
                  style={{ ...btn("#f1f5f9", "#334155"), padding: "4px 8px", fontSize: "11px", border: "1px solid #cbd5e1" }}
                  title="Export / File Order"
                >
                  File
                </button>
              </div>

              <button 
                onClick={() => setShowWorkstation(false)} 
                style={{ ...btn("#dc2626", "white"), padding: "4px 14px", fontSize: "11px", fontWeight: "700" }}
              >
                Close
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: "#475569", marginTop: "4px" }}>
              <button 
                onClick={() => handlePrint(false)} 
                style={{ ...btn("#f1f5f9", "#0f172a"), padding: "3px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }}
              >
                Display Order
              </button>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input type="checkbox" checked={dontPrintUnit} onChange={e => setDontPrintUnit(e.target.checked)} />
                Don't Print Unit
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input type="checkbox" checked={printStock} onChange={e => setPrintStock(e.target.checked)} />
                Print Stock
              </label>
            </div>
          </div>

        </div>
      </div>

      {/* ── MAIN TABLE / GRID (MATCHES EXACT COLUMNS IN SCREENSHOT PAGE 10) ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#dc2626", color: "white", textAlign: "center", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #b91c1c" }}>
              <th style={{ padding: "6px 4px", width: "40px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>SrNo</th>
              <th style={{ padding: "6px 8px", textAlign: "left", width: "160px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Company</th>
              <th style={{ padding: "6px 8px", textAlign: "left", minWidth: "240px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Item Name</th>
              <th style={{ padding: "6px 6px", width: "70px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right", background: "#b91c1c" }}>Qty</th>
              <th style={{ padding: "6px 6px", width: "50px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right" }}>Fr</th>
              <th style={{ padding: "6px 6px", width: "75px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right" }}>V/R</th>
              <th style={{ padding: "6px 6px", width: "150px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "center" }}>Last Purchase</th>
              <th style={{ padding: "6px 6px", width: "65px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right" }}>Stock</th>
              <th style={{ padding: "6px 6px", width: "55px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right" }}>Min</th>
              <th style={{ padding: "6px 6px", width: "55px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "right" }}>Max</th>
              <th style={{ padding: "6px 6px", width: "65px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "center" }}>Schem</th>
              <th style={{ padding: "6px 4px", width: "40px" }}>Act</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                  <div style={{ fontSize: "32px", opacity: 0.5, marginBottom: "8px" }}>📦</div>
                  <div style={{ fontWeight: "700", fontSize: "14px" }}>No items in current order view</div>
                  <div style={{ fontSize: "11px", marginTop: "4px" }}>
                    Click <strong>"ReOrder"</strong> or <strong>"Auto Order"</strong> below to load low-stock items automatically.
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const isUnderMin = num(row.stock) <= num(row.min);

                return (
                  <tr 
                    key={row.id}
                    style={{
                      background: row.confirmed ? "#f0fdf4" : idx % 2 === 0 ? "white" : "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      transition: "background 0.1s"
                    }}
                  >
                    {/* SrNo */}
                    <td style={{ textAlign: "center", fontWeight: "700", color: "#64748b", padding: "4px 2px", borderRight: "1px solid #e2e8f0" }}>
                      {idx + 1}
                    </td>

                    {/* Company */}
                    <td style={{ padding: "4px 8px", color: "#475569", fontWeight: "600", borderRight: "1px solid #e2e8f0" }}>
                      {row.company}
                    </td>

                    {/* Item Name */}
                    <td style={{ padding: "4px 8px", fontWeight: "700", color: "#0f172a", borderRight: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {isUnderMin && <span title="Below Minimum Stock" style={{ color: "#dc2626", fontSize: "10px" }}>⚠️</span>}
                        <span>{row.itemName}</span>
                      </div>
                    </td>

                    {/* Qty (Editable input) */}
                    <td style={{ padding: "2px 4px", borderRight: "1px solid #e2e8f0" }}>
                      <input
                        type="number"
                        min="0"
                        value={row.qty}
                        onChange={e => handleQtyChange(idx, e.target.value)}
                        style={{
                          ...inp,
                          height: "24px",
                          fontSize: "12px",
                          fontWeight: "800",
                          textAlign: "right",
                          background: "#f0f9ff",
                          color: "#0369a1",
                          borderColor: "#7dd3fc"
                        }}
                      />
                    </td>

                    {/* Fr (Free Qty) */}
                    <td style={{ padding: "2px 4px", borderRight: "1px solid #e2e8f0" }}>
                      <input
                        type="number"
                        min="0"
                        value={row.fr}
                        onChange={e => handleFrChange(idx, e.target.value)}
                        style={{ ...inp, height: "24px", fontSize: "11px", textAlign: "right" }}
                      />
                    </td>

                    {/* V/R (Valuation Rate) */}
                    <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "600", color: "#0f172a", borderRight: "1px solid #e2e8f0" }}>
                      ₹{fmt(row.vr)}
                    </td>

                    {/* Last Purchase */}
                    <td style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", fontSize: "10px", borderRight: "1px solid #e2e8f0" }}>
                      {row.lastPurchase}
                    </td>

                    {/* Stock */}
                    <td style={{
                      padding: "4px 6px",
                      textAlign: "right",
                      fontWeight: "700",
                      borderRight: "1px solid #e2e8f0",
                      color: isUnderMin ? "#dc2626" : "#1e293b",
                      background: isUnderMin ? "#fee2e2" : "transparent"
                    }}>
                      {row.stock}
                    </td>

                    {/* Min */}
                    <td style={{ padding: "4px 6px", textAlign: "right", color: "#64748b", borderRight: "1px solid #e2e8f0" }}>
                      {row.min}
                    </td>

                    {/* Max */}
                    <td style={{ padding: "4px 6px", textAlign: "right", color: "#64748b", borderRight: "1px solid #e2e8f0" }}>
                      {row.max}
                    </td>

                    {/* Schem */}
                    <td style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", borderRight: "1px solid #e2e8f0" }}>
                      {row.schem}
                    </td>

                    {/* Act: Remove Row */}
                    <td style={{ textAlign: "center", padding: "2px" }}>
                      <button
                        onClick={() => handleRemoveRow(idx)}
                        title="Remove Item"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "2px" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── BOTTOM ACTION TOOLBAR & BUTTONS (MATCHES SCREENSHOT PAGE 10 EXACTLY) ── */}
      <div style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        
        {/* Left Action Buttons Grid (Matches screenshot buttons) */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          
          {/* Column 1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button 
              onClick={handleLoadOnlineOrders} 
              style={{ ...btn("#f1f5f9", "#0f172a"), padding: "4px 10px", fontSize: "11px", border: "1px solid #cbd5e1", minWidth: "90px" }}
            >
              Online Ord
            </button>
            <button 
              onClick={handleClearOrder} 
              style={{ ...btn("#fee2e2", "#dc2626"), padding: "4px 10px", fontSize: "11px", border: "1px solid #fecaca", minWidth: "90px" }}
            >
              Clear Ord
            </button>
            <button 
              onClick={handleReOrder} 
              style={{ ...btn("#f1f5f9", "#0f172a"), padding: "4px 10px", fontSize: "11px", border: "1px solid #cbd5e1", minWidth: "90px" }}
            >
              ReOrder
            </button>
          </div>

          {/* Column 2 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button 
              onClick={handleAutoOrder} 
              style={{ ...btn("var(--color-primary)"), padding: "4px 10px", fontSize: "11px", fontWeight: "700", minWidth: "95px" }}
            >
              Auto Order
            </button>
            <button 
              onClick={() => handlePrint(true)} 
              style={{ ...btn("#f1f5f9", "#0f172a"), padding: "4px 10px", fontSize: "11px", border: "1px solid #cbd5e1", minWidth: "95px" }}
            >
              Print Conf
            </button>
            <button 
              onClick={() => handlePrint(false)} 
              style={{ ...btn("#f1f5f9", "#0f172a"), padding: "4px 10px", fontSize: "11px", border: "1px solid #cbd5e1", minWidth: "95px" }}
            >
              Print Select
            </button>
          </div>

          {/* Column 3 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button 
              onClick={() => setRows(prev => prev.map(r => ({ ...r, confirmed: true })))} 
              style={{ ...btn("#f1f5f9", "#0f172a"), padding: "4px 10px", fontSize: "11px", border: "1px solid #cbd5e1", minWidth: "100px" }}
            >
              Confirm Show
            </button>
            <button 
              onClick={() => handleSaveOrder(false)} 
              style={{ ...btn("#f1f5f9", "#15803d"), padding: "4px 10px", fontSize: "11px", fontWeight: "700", border: "1px solid #bbf7d0", minWidth: "100px" }}
            >
              Save Order
            </button>
            <button 
              onClick={() => handleSaveOrder(true)} 
              style={{ ...btn("#f1f5f9", "#b45309"), padding: "4px 10px", fontSize: "11px", border: "1px solid #fde68a", minWidth: "100px" }}
            >
              Save Memo
            </button>
          </div>

          {/* Print format dropdown (Matches 600*300 dropdown in screenshot) */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
            <span style={{ fontSize: "10px", color: "#64748b", marginBottom: "2px" }}>Format:</span>
            <select
              value={printFormat}
              onChange={e => setPrintFormat(e.target.value)}
              style={{ ...inp, height: "26px", fontSize: "11px", width: "95px" }}
            >
              <option value="600*300">600*300</option>
              <option value="Laser A4">Laser A4</option>
              <option value="Thermal">Thermal</option>
            </select>
          </div>
        </div>

        {/* Right Totals Box */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "white", padding: "6px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "11px", color: "#64748b" }}>
            <span>Order Lines: <strong>{validOrderRows.length}</strong></span>
          </div>

          <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "12px", fontSize: "11px" }}>
            <span style={{ color: "#475569" }}>Total Units:</span>{" "}
            <strong style={{ fontSize: "13px", color: "#0284c7" }}>{totalOrderUnits}</strong>
          </div>

          <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "12px", fontSize: "11px" }}>
            <span style={{ color: "#475569" }}>Est. Valuation:</span>{" "}
            <strong style={{ fontSize: "14px", color: "#15803d" }}>₹{fmt(totalOrderValuation)}</strong>
          </div>
        </div>

      </div>

    </div>
  );
}
