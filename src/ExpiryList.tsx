// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, CheckCircle, Trash2, Plus, ArrowLeft, ArrowRight, Printer, AlertTriangle, FileText, RefreshCw, ShoppingCart, Check, Download, Calendar, Filter, ArrowUpDown } from "lucide-react";
import { useMedicalStore, today, uid, num, fmt, int, inp, lbl, btn } from './MedicalStoreContext';

export default function ExpiryList() {
  const {
    items, saveItems,
    batches, saveBatches,
    suppliers,
    showToast, showConfirm,
    setPrintHtml, setActiveSection,
    openPurchaseReturnForm
  } = useMedicalStore();

  // Workstation visibility state
  const [showWorkstation, setShowWorkstation] = useState(false);
  const [overviewSearchQuery, setOverviewSearchQuery] = useState("");

  // Top Filter States (Matches Page 12 of transection.pdf)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });

  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [lessPercent, setLessPercent] = useState<number>(0);

  // Checkboxes from screenshot
  const [showComp, setShowComp] = useState(true);
  const [showSupp, setShowSupp] = useState(true);
  const [unitCalculation, setUnitCalculation] = useState(false);
  const [returnMrp, setReturnMrp] = useState(false);
  const [oldYearDetail, setOldYearDetail] = useState(false);
  const [calculateGst, setCalculateGst] = useState(true);
  const [allSupp, setAllSupp] = useState(true);
  const [printForSupplier, setPrintForSupplier] = useState(true);

  // Table items state
  const [rows, setRows] = useState<any[]>([]);

  // Distinct Companies
  const companyList = useMemo(() => {
    const set = new Set<string>();
    (items || []).forEach(i => {
      if (i.company && i.company.trim()) set.add(i.company.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  // Distinct Categories
  const categoryList = useMemo(() => {
    const set = new Set<string>();
    (items || []).forEach(i => {
      if (i.category && i.category.trim()) set.add(i.category.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  // Parse MM/YY or YYYY-MM-DD expiry string into Date object
  const parseExpiryDate = (expStr: string): Date | null => {
    if (!expStr) return null;
    const str = String(expStr).trim();
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 2) {
        const month = parseInt(parts[0], 10) - 1;
        let year = parseInt(parts[1], 10);
        if (year < 100) year += 2000;
        return new Date(year, month + 1, 0); // end of month
      }
    } else if (str.includes('-')) {
      const parts = str.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    return null;
  };

  // Compile expiry rows from batches and items
  const loadExpiryData = () => {
    const curDate = new Date();
    const fromD = fromDate ? new Date(fromDate) : new Date(2000, 0, 1);
    const toD = toDate ? new Date(toDate) : new Date(2100, 0, 1);

    const compiledRows: any[] = [];
    const processedKeys = new Set<string>();

    // 1. From batches
    (batches || []).forEach(b => {
      const parentItem = (items || []).find(i => i.id === b.itemId || i.name === b.itemName);
      const expDate = parseExpiryDate(b.expiryDate || b.expiry);
      if (!expDate) return;

      if (expDate >= fromD && expDate <= toD) {
        const stockQty = num(b.stock) || num(b.quantity) || 0;
        if (stockQty <= 0 && !oldYearDetail) return;

        const isExpired = expDate < curDate;
        const pRate = num(b.pRate) || num(parentItem?.pRate) || num(parentItem?.price) || 0;
        const mrp = num(b.mrp) || num(parentItem?.mrp) || 0;
        const baseRate = returnMrp ? mrp : pRate;
        const rateAfterLess = baseRate * (1 - lessPercent / 100);

        const rowKey = `${b.itemId || b.itemName}_${b.batchNo || b.batch}`;
        processedKeys.add(rowKey);

        compiledRows.push({
          id: b.id || uid(),
          batchId: b.id,
          itemId: b.itemId || parentItem?.id,
          itemName: b.itemName || parentItem?.name || "Unknown Item",
          loc: parentItem?.location || parentItem?.rack || "-",
          comp: parentItem?.company || b.company || "GENERIC",
          supp: parentItem?.supplier || b.supplier || "DEFAULT SUPPLIER",
          cate: parentItem?.category || "GENERAL",
          unit: parentItem?.unit || parentItem?.pack || "10'S",
          batch: b.batchNo || b.batch || "-",
          expDt: b.expiryDate || b.expiry || "-",
          expObj: expDate,
          stock: stockQty,
          expQt: stockQty > 0 ? stockQty : 1, // editable return qty
          qty: 1,
          mrp: fmt(mrp),
          pRate: fmt(pRate),
          amt: fmt(stockQty * rateAfterLess),
          yr: isExpired ? "EXPIRED" : "EXPIRING SOON",
          isExpired,
          selected: true
        });
      }
    });

    // 2. Also check items with expiryDate if no batch recorded
    (items || []).forEach(itm => {
      if (itm.expiryDate) {
        const expDate = parseExpiryDate(itm.expiryDate);
        if (expDate && expDate >= fromD && expDate <= toD) {
          const rowKey = `${itm.id}_${itm.batchNumber || 'NO_BATCH'}`;
          if (!processedKeys.has(rowKey)) {
            const stockQty = num(itm.stock) || 0;
            if (stockQty <= 0 && !oldYearDetail) return;

            const isExpired = expDate < curDate;
            const pRate = num(itm.pRate) || num(itm.price) || 0;
            const mrp = num(itm.mrp) || 0;
            const baseRate = returnMrp ? mrp : pRate;
            const rateAfterLess = baseRate * (1 - lessPercent / 100);

            compiledRows.push({
              id: itm.id || uid(),
              itemId: itm.id,
              itemName: itm.name,
              loc: itm.location || itm.rack || "-",
              comp: itm.company || "GENERIC",
              supp: itm.supplier || "DEFAULT SUPPLIER",
              cate: itm.category || "GENERAL",
              unit: itm.unit || itm.pack || "10'S",
              batch: itm.batchNumber || "-",
              expDt: itm.expiryDate || "-",
              expObj: expDate,
              stock: stockQty,
              expQt: stockQty > 0 ? stockQty : 1,
              qty: 1,
              mrp: fmt(mrp),
              pRate: fmt(pRate),
              amt: fmt(stockQty * rateAfterLess),
              yr: isExpired ? "EXPIRED" : "EXPIRING SOON",
              isExpired,
              selected: true
            });
          }
        }
      }
    });

    // Apply Supplier Filter
    let filtered = compiledRows;
    if (selectedSupplier && !allSupp) {
      filtered = filtered.filter(r => r.supp.toLowerCase() === selectedSupplier.toLowerCase());
    }

    // Apply Company Filter
    if (selectedCompany) {
      filtered = filtered.filter(r => r.comp.toLowerCase() === selectedCompany.toLowerCase());
    }

    // Apply Category Filter
    if (selectedCategory) {
      filtered = filtered.filter(r => r.cate.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Sort by Expiry Date ascending (oldest/expired first)
    filtered.sort((a, b) => (a.expObj?.getTime() || 0) - (b.expObj?.getTime() || 0));

    setRows(filtered);
    showToast(`Loaded ${filtered.length} expired/expiring items`);
  };

  // Trigger load when dates or filters change
  useEffect(() => {
    if (showWorkstation) {
      loadExpiryData();
    }
  }, [showWorkstation, fromDate, toDate, selectedCompany, selectedSupplier, selectedCategory, lessPercent, returnMrp, oldYearDetail, allSupp]);

  // Handle Return Qty Change
  const handleExpQtChange = (index: number, val: string) => {
    const q = num(val);
    setRows(prev => {
      const next = [...prev];
      const r = next[index];
      const baseRate = returnMrp ? num(r.mrp) : num(r.pRate);
      const rateAfterLess = baseRate * (1 - lessPercent / 100);
      r.expQt = q;
      r.amt = fmt(q * rateAfterLess);
      return next;
    });
  };

  // Toggle Row Selection
  const toggleRowSelect = (index: number) => {
    setRows(prev => {
      const next = [...prev];
      next[index].selected = !next[index].selected;
      return next;
    });
  };

  // Select All (Yes)
  const handleSelectAll = (select: boolean) => {
    setRows(prev => prev.map(r => ({ ...r, selected: select })));
    showToast(select ? "All items selected" : "All items deselected");
  };

  // Sort A-Z or Z-A
  const handleSort = (direction: 'asc' | 'desc') => {
    setRows(prev => {
      const next = [...prev];
      next.sort((a, b) => {
        const cmp = a.itemName.localeCompare(b.itemName);
        return direction === 'asc' ? cmp : -cmp;
      });
      return next;
    });
  };

  // Convert Selected to Purchase Return (Debit Note)
  const handleConvertToPurchaseReturn = () => {
    const selectedRows = rows.filter(r => r.selected && num(r.expQt) > 0);
    if (selectedRows.length === 0) {
      showToast("Please select at least one expired item to return!", "error");
      return;
    }

    const firstSupplier = selectedRows[0]?.supp || selectedSupplier || "SUPPLIER";

    showConfirm(`Generate Purchase Return / Debit Note for ${selectedRows.length} items to '${firstSupplier}'?`, () => {
      openPurchaseReturnForm({
        partyName: firstSupplier,
        returnDate: today(),
        entryDate: today(),
        refBillNo: "EXPIRY-RET",
        remarks: `Expiry return processed from Expiry Register (${selectedRows.length} items)`,
        items: selectedRows.map(r => ({
          itemId: r.itemId,
          itemName: r.itemName,
          batchNo: r.batch,
          expiryDate: r.expDt,
          qty: r.expQt,
          ptr: r.pRate,
          mrp: r.mrp,
          rate: r.pRate,
          disc: lessPercent,
          amount: r.amt
        }))
      });
      setActiveSection("purchase_return");
      showToast(`Transferred ${selectedRows.length} items to Purchase Return!`);
    });
  };

  // Stock Adjustment (Write Off Expired Items)
  const handleAdjustStockWriteOff = () => {
    const selectedRows = rows.filter(r => r.selected && num(r.expQt) > 0);
    if (selectedRows.length === 0) {
      showToast("Please select at least one expired item to write off!", "error");
      return;
    }

    showConfirm(`Write off ${selectedRows.length} expired items from active inventory?`, () => {
      // Deduct from items
      const updatedItems = (items || []).map(i => {
        const found = selectedRows.find(sr => sr.itemId === i.id);
        if (found) {
          const newStock = Math.max(0, (num(i.stock) || 0) - num(found.expQt));
          return { ...i, stock: newStock };
        }
        return i;
      });
      saveItems(updatedItems);

      // Deduct from batches
      const updatedBatches = (batches || []).map(b => {
        const found = selectedRows.find(sr => sr.batchId === b.id || (sr.itemId === b.itemId && sr.batch === b.batchNo));
        if (found) {
          const newBatchStock = Math.max(0, (num(b.stock) || 0) - num(found.expQt));
          return { ...b, stock: newBatchStock };
        }
        return b;
      });
      saveBatches(updatedBatches);

      showToast(`✅ Successfully written off ${selectedRows.length} expired items from stock!`);
      loadExpiryData();
    });
  };

  // Export Expiry List to CSV/File
  const handleExportFile = () => {
    const selectedRows = rows.filter(r => r.selected);
    if (selectedRows.length === 0) {
      showToast("No items selected to export!", "error");
      return;
    }

    const csvRows = [
      ["No", "Item Name", "Location", "Company", "Supplier", "Unit", "Batch", "Expiry", "Stock", "Return Qty", "MRP", "P.Rate", "Amount", "Status"].join(",")
    ];

    selectedRows.forEach((r, idx) => {
      csvRows.push([
        idx + 1,
        `"${r.itemName.replace(/"/g, '""')}"`,
        `"${r.loc}"`,
        `"${r.comp}"`,
        `"${r.supp}"`,
        `"${r.unit}"`,
        `"${r.batch}"`,
        `"${r.expDt}"`,
        r.stock,
        r.expQt,
        r.mrp,
        r.pRate,
        r.amt,
        `"${r.yr}"`
      ].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Expiry_List_${today()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Expiry list exported to CSV!");
  };

  // Print Expiry Register / Supplier Return Statement
  const handlePrint = () => {
    const selectedRows = rows.filter(r => r.selected && num(r.expQt) > 0);
    if (selectedRows.length === 0) {
      showToast("No items selected to print!", "error");
      return;
    }

    const totalQty = selectedRows.reduce((s, r) => s + num(r.expQt), 0);
    const totalAmt = selectedRows.reduce((s, r) => s + num(r.amt), 0);

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #0f172a; max-width: 850px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 12px;">
          <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; color: #0284c7;">SHIV DHARA MEDICAL STORE</h2>
          <p style="margin: 2px 0; font-size: 11px; color: #475569;">20, GIRIRAJ COMPLEX NIKOL GAAM ROAD, NIKOL, AHMEDABAD | PH: 079352 07999</p>
          <div style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 3px 16px; border-radius: 12px; font-weight: 700; font-size: 12px; margin-top: 5px; border: 1px solid #bae6fd;">
            EXPIRY RETURN & VALUATION STATEMENT
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px;">
          <div>
            <strong>Report Period:</strong> ${fromDate} to ${toDate}<br/>
            <strong>Supplier:</strong> ${selectedSupplier || "ALL SUPPLIERS"}<br/>
            <strong>Company:</strong> ${selectedCompany || "ALL COMPANIES"}
          </div>
          <div style="text-align: right;">
            <strong>Generated Date:</strong> ${today()}<br/>
            <strong>Total Items:</strong> ${selectedRows.length}<br/>
            <strong>Deduction Less %:</strong> ${lessPercent}%
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px;">
          <thead>
            <tr style="background: #f1f5f9; color: #334155; border-bottom: 1px solid #94a3b8;">
              <th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 30px;">#</th>
              <th style="padding: 5px; text-align: left; border: 1px solid #cbd5e1;">Item Name</th>
              <th style="padding: 5px; text-align: left; border: 1px solid #cbd5e1; width: 110px;">Company</th>
              <th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 55px;">Unit</th>
              <th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 75px;">Batch</th>
              <th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 65px;">Exp. Date</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 55px;">Stock</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 60px; background: #e0f2fe;">Ret. Qty</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 60px;">MRP</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 60px;">P.Rate</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 75px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${selectedRows.map((r, i) => `
              <tr style="border-bottom: 1px solid #e2e8f0; background: ${r.isExpired ? '#fef2f2' : 'white'};">
                <td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">${i + 1}</td>
                <td style="padding: 4px; border: 1px solid #cbd5e1;"><strong>${r.itemName}</strong></td>
                <td style="padding: 4px; border: 1px solid #cbd5e1;">${r.comp}</td>
                <td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">${r.unit}</td>
                <td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">${r.batch}</td>
                <td style="padding: 4px; text-align: center; font-weight: bold; color: ${r.isExpired ? '#dc2626' : '#b45309'}; border: 1px solid #cbd5e1;">${r.expDt}</td>
                <td style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">${r.stock}</td>
                <td style="padding: 4px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1; background: #f0f9ff; color: #0284c7;">${r.expQt}</td>
                <td style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">₹${fmt(r.mrp)}</td>
                <td style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">₹${fmt(r.pRate)}</td>
                <td style="padding: 4px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1;">₹${fmt(r.amt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px;">
          <div>
            <strong>Total Expired Units:</strong> ${totalQty} units
          </div>
          <div style="text-align: right;">
            <strong>Total Return Valuation:</strong> <span style="font-size: 13px; font-weight: bold; color: #0284c7;">₹${fmt(totalAmt)}</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 8px; font-size: 10px;">
          <div style="border-top: 1px solid #94a3b8; width: 160px; text-align: center;">Verified By Pharmacist</div>
          <div style="border-top: 1px solid #94a3b8; width: 160px; text-align: center;">Supplier / Agency Signature</div>
        </div>
      </div>
    `;

    setPrintHtml(html);
  };

  // Calculations for totals
  const selectedRows = rows.filter(r => r.selected);
  const totalSelectedUnits = selectedRows.reduce((s, r) => s + num(r.expQt), 0);
  const totalNetValuation = selectedRows.reduce((s, r) => s + num(r.amt), 0);

  // Overview quick stats
  const expiredCount = useMemo(() => {
    const cur = new Date();
    return (batches || []).filter(b => {
      const d = parseExpiryDate(b.expiryDate || b.expiry);
      return d && d < cur && num(b.stock) > 0;
    }).length;
  }, [batches]);

  const expiring30Count = useMemo(() => {
    const cur = new Date();
    const d30 = new Date();
    d30.setDate(d30.getDate() + 30);
    return (batches || []).filter(b => {
      const d = parseExpiryDate(b.expiryDate || b.expiry);
      return d && d >= cur && d <= d30 && num(b.stock) > 0;
    }).length;
  }, [batches]);

  const expiring90Count = useMemo(() => {
    const cur = new Date();
    const d90 = new Date();
    d90.setDate(d90.getDate() + 90);
    return (batches || []).filter(b => {
      const d = parseExpiryDate(b.expiryDate || b.expiry);
      return d && d >= cur && d <= d90 && num(b.stock) > 0;
    }).length;
  }, [batches]);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: SINGLE CENTER BUTTON (When workstation closed) — strictly following Rule #2
  // ══════════════════════════════════════════════════════════════════════════════
  if (!showWorkstation) {
    return (
      <div style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header Title with Clean Blue Accent (Matching Image 2 Theme) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⏳</span> Expiry List
            </h2>
            <span style={{ background: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
              Expiry Register & Return
            </span>
          </div>

          <div style={{ position: "relative", minWidth: "280px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "8px", color: "#64748b" }} />
            <input
              placeholder="Search Expired Item / Batch / Supplier..."
              value={overviewSearchQuery}
              onChange={e => setOverviewSearchQuery(e.target.value)}
              style={{ ...inp, paddingLeft: "30px", background: "white", borderColor: "#cbd5e1" }}
            />
          </div>
        </div>

        {/* ── SINGLE CENTER BUTTON WORKSPACE (Strict Rule #2: Only Center Button) ── */}
        <div style={{ textAlign: "center", padding: "50px 20px", background: "white", borderRadius: "8px", border: "1px dashed #cbd5e1", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "42px", opacity: 0.8, marginBottom: "8px" }}>📦</div>
          <h3 style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "17px", color: "var(--color-text-dark)" }}>
            Expiry Register & Supplier Return Management
          </h3>
          <p style={{ fontSize: "12px", color: "#64748b", maxWidth: "520px", margin: "0 auto 18px", lineHeight: "1.5" }}>
            Track expired medicines and impending expiries. Automatically convert expired stock into supplier debit notes (Purchase Returns) or perform inventory write-offs.
          </p>

          {/* SINGLE CENTER BUTTON */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button 
              onClick={() => {
                setShowWorkstation(true);
                loadExpiryData();
              }} 
              style={{ ...btn("#0284c7", "white"), padding: "10px 24px", fontSize: "14px", fontWeight: "700", borderRadius: "6px" }}
            >
              ➕ Open Expiry Management Workstation
            </button>
          </div>
        </div>

        {/* Quick Expiry Metric Cards (Clean Blue/Slate Theme - Matches Image 2) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginTop: "20px" }}>
          
          <div style={{ background: "white", padding: "14px", borderRadius: "8px", border: "1px solid #fee2e2", borderLeft: "4px solid #ef4444", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#b91c1c", textTransform: "uppercase" }}>Already Expired Items</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#dc2626", marginTop: "4px" }}>{expiredCount} <span style={{ fontSize: "12px", fontWeight: "normal", color: "#64748b" }}>batches</span></div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Requires immediate return or write-off</div>
          </div>

          <div style={{ background: "white", padding: "14px", borderRadius: "8px", border: "1px solid #fef3c7", borderLeft: "4px solid #f59e0b", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#b45309", textTransform: "uppercase" }}>Expiring Within 30 Days</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#d97706", marginTop: "4px" }}>{expiring30Count} <span style={{ fontSize: "12px", fontWeight: "normal", color: "#64748b" }}>batches</span></div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Prioritize sales or notify supplier</div>
          </div>

          <div style={{ background: "white", padding: "14px", borderRadius: "8px", border: "1px solid #e0f2fe", borderLeft: "4px solid #0284c7", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#0369a1", textTransform: "uppercase" }}>Expiring Within 90 Days</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#0284c7", marginTop: "4px" }}>{expiring90Count} <span style={{ fontSize: "12px", fontWeight: "normal", color: "#64748b" }}>batches</span></div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Upcoming slow-moving expiries</div>
          </div>

        </div>

      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: FULL WORKSTATION (Matches Page 12 transection.pdf + Theme of Image 2)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: "white", borderRadius: "8px", border: "1px solid #cbd5e1", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", minHeight: "85vh" }}>
      
      {/* ── TOP HEADER / FILTER BAR (MATCHES EXACT LAYOUT IN SCREENSHOT PAGE 12 WITH CLEAN THEME) ── */}
      <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", flexDirection: "column", gap: "8px" }}>
        
        {/* Row 1: Dates, Comp, Supp, Cate, Less % and Right Action Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          
          {/* Left Inputs Block */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155", width: "40px" }}>From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  style={{ ...inp, height: "24px", fontSize: "11px", width: "120px", background: "white" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155", width: "25px" }}>To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  style={{ ...inp, height: "24px", fontSize: "11px", width: "120px", background: "white" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155", width: "45px" }}>Comp. :</span>
                <select
                  value={selectedCompany}
                  onChange={e => setSelectedCompany(e.target.value)}
                  style={{ ...inp, height: "24px", fontSize: "11px", minWidth: "160px", background: "white" }}
                >
                  <option value="">-- All Companies --</option>
                  {companyList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155", width: "45px" }}>Supp. :</span>
                <select
                  value={selectedSupplier}
                  onChange={e => setSelectedSupplier(e.target.value)}
                  style={{ ...inp, height: "24px", fontSize: "11px", minWidth: "170px", background: "white" }}
                >
                  <option value="">-- All Suppliers --</option>
                  {(suppliers || []).map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155", width: "40px" }}>Cate:</span>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  style={{ ...inp, height: "24px", fontSize: "11px", width: "120px", background: "white" }}
                >
                  <option value="">-- All --</option>
                  {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Less %:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={lessPercent}
                  onChange={e => setLessPercent(num(e.target.value))}
                  style={{ ...inp, height: "24px", fontSize: "11px", width: "60px", textAlign: "right", background: "white" }}
                />
              </div>

              <button 
                onClick={() => setSelectedCompany("")} 
                style={{ ...btn("#f1f5f9", "#334155"), padding: "2px 8px", fontSize: "11px", border: "1px solid #cbd5e1" }}
              >
                Show All Comp
              </button>

              <button 
                onClick={handleConvertToPurchaseReturn} 
                style={{ ...btn("#0284c7", "white"), padding: "2px 10px", fontSize: "11px", fontWeight: "700" }}
                title="Convert selected items directly to a Purchase Return"
              >
                ↩️ Purchase Return
              </button>

              <button 
                onClick={handleAdjustStockWriteOff} 
                style={{ ...btn("#f1f5f9", "#b91c1c"), padding: "2px 10px", fontSize: "11px", fontWeight: "700", border: "1px solid #fecaca" }}
                title="Write off expired items from inventory"
              >
                Adjust Stock
              </button>
            </div>

          </div>

          {/* Right Action & Sorting Buttons (Matches page 12 screenshot) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button onClick={() => handleSort('asc')} style={{ ...btn("#f1f5f9", "#334155"), padding: "3px 7px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Sort A-Z">A-Z</button>
              <button onClick={() => handleSort('desc')} style={{ ...btn("#f1f5f9", "#334155"), padding: "3px 7px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Sort Z-A">Z-A</button>
              <button onClick={() => handleSelectAll(true)} style={{ ...btn("#f1f5f9", "#15803d"), padding: "3px 8px", fontSize: "11px", border: "1px solid #bbf7d0" }}>Yes</button>
              <button onClick={() => handleSelectAll(false)} style={{ ...btn("#f1f5f9", "#dc2626"), padding: "3px 8px", fontSize: "11px", border: "1px solid #fecaca" }}>No</button>
              <button onClick={handleExportFile} style={{ ...btn("#f1f5f9", "#0f172a"), padding: "3px 8px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Export File">File</button>
              <button onClick={handlePrint} style={{ ...btn("#f1f5f9", "#0f172a"), padding: "3px 9px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Print Statement">Print</button>
              <button onClick={() => setShowWorkstation(false)} style={{ ...btn("#475569", "white"), padding: "3px 12px", fontSize: "11px", fontWeight: "700" }}>Close</button>
            </div>
          </div>

        </div>

        {/* Row 2: Checkboxes row (Matches screenshot) */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "11px", color: "#475569", flexWrap: "wrap", borderTop: "1px dashed #e2e8f0", paddingTop: "6px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input type="checkbox" checked={showComp} onChange={e => setShowComp(e.target.checked)} />
            Show Comp
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input type="checkbox" checked={showSupp} onChange={e => setShowSupp(e.target.checked)} />
            Show Supp
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input type="checkbox" checked={unitCalculation} onChange={e => setUnitCalculation(e.target.checked)} />
            Unit Calculation
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input type="checkbox" checked={returnMrp} onChange={e => setReturnMrp(e.target.checked)} />
            Return Mrp
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input type="checkbox" checked={oldYearDetail} onChange={e => setOldYearDetail(e.target.checked)} />
            Old Year Detail
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input type="checkbox" checked={calculateGst} onChange={e => setCalculateGst(e.target.checked)} />
            Calculate GST
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input type="checkbox" checked={allSupp} onChange={e => setAllSupp(e.target.checked)} />
            All Supp.
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input type="checkbox" checked={printForSupplier} onChange={e => setPrintForSupplier(e.target.checked)} />
            Print for Supplier
          </label>
        </div>

      </div>

      {/* ── MAIN TABLE / GRID (MATCHES COLUMNS WITH CLEAN SLATE/WHITE THEME) ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", color: "#334155", textAlign: "center", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #cbd5e1" }}>
              <th style={{ padding: "6px 4px", width: "35px", borderRight: "1px solid #e2e8f0" }}>
                <input 
                  type="checkbox" 
                  checked={rows.length > 0 && rows.every(r => r.selected)} 
                  onChange={e => handleSelectAll(e.target.checked)} 
                />
              </th>
              <th style={{ padding: "6px 4px", width: "35px", borderRight: "1px solid #e2e8f0" }}>No</th>
              <th style={{ padding: "6px 8px", textAlign: "left", minWidth: "220px", borderRight: "1px solid #e2e8f0" }}>Item Name</th>
              <th style={{ padding: "6px 6px", width: "55px", borderRight: "1px solid #e2e8f0" }}>Loc.</th>
              <th style={{ padding: "6px 8px", textAlign: "left", width: "130px", borderRight: "1px solid #e2e8f0" }}>Comp</th>
              <th style={{ padding: "6px 6px", width: "55px", borderRight: "1px solid #e2e8f0" }}>Unit</th>
              <th style={{ padding: "6px 6px", width: "85px", borderRight: "1px solid #e2e8f0" }}>Batch</th>
              <th style={{ padding: "6px 6px", width: "70px", borderRight: "1px solid #e2e8f0" }}>ExpDt</th>
              <th style={{ padding: "6px 6px", width: "60px", borderRight: "1px solid #e2e8f0", textAlign: "right" }}>Stock</th>
              <th style={{ padding: "6px 6px", width: "65px", borderRight: "1px solid #e2e8f0", textAlign: "right", background: "#e0f2fe", color: "#0369a1" }}>ExpQt</th>
              <th style={{ padding: "6px 6px", width: "45px", borderRight: "1px solid #e2e8f0", textAlign: "right" }}>Qty</th>
              <th style={{ padding: "6px 6px", width: "65px", borderRight: "1px solid #e2e8f0", textAlign: "right" }}>MRP</th>
              <th style={{ padding: "6px 6px", width: "65px", borderRight: "1px solid #e2e8f0", textAlign: "right" }}>P.Rate</th>
              <th style={{ padding: "6px 6px", width: "80px", borderRight: "1px solid #e2e8f0", textAlign: "right" }}>Amt</th>
              <th style={{ padding: "6px 6px", width: "85px" }}>YR</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={15} style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                  <div style={{ fontSize: "32px", opacity: 0.5, marginBottom: "8px" }}>✅</div>
                  <div style={{ fontWeight: "700", fontSize: "14px" }}>No expired or expiring items found for the selected period</div>
                  <div style={{ fontSize: "11px", marginTop: "4px" }}>Adjust the Date Range (From/To) above to expand your search</div>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                return (
                  <tr 
                    key={row.id}
                    onClick={() => toggleRowSelect(idx)}
                    style={{
                      background: row.selected ? (row.isExpired ? "#fef2f2" : "#f0f9ff") : (idx % 2 === 0 ? "white" : "#f8fafc"),
                      borderBottom: "1px solid #e2e8f0",
                      cursor: "pointer",
                      transition: "background 0.1s"
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ textAlign: "center", padding: "4px", borderRight: "1px solid #e2e8f0" }} onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={row.selected} 
                        onChange={() => toggleRowSelect(idx)} 
                      />
                    </td>

                    {/* No */}
                    <td style={{ textAlign: "center", fontWeight: "700", color: "#64748b", padding: "4px 2px", borderRight: "1px solid #e2e8f0" }}>
                      {idx + 1}
                    </td>

                    {/* Item Name */}
                    <td style={{ padding: "4px 8px", fontWeight: "700", color: "#0f172a", borderRight: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {row.isExpired ? (
                          <span style={{ color: "#ef4444", fontSize: "10px" }}>🔴</span>
                        ) : (
                          <span style={{ color: "#f59e0b", fontSize: "10px" }}>🟡</span>
                        )}
                        <span>{row.itemName}</span>
                      </div>
                    </td>

                    {/* Loc */}
                    <td style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", borderRight: "1px solid #e2e8f0" }}>
                      {row.loc}
                    </td>

                    {/* Comp */}
                    <td style={{ padding: "4px 8px", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                      {row.comp}
                    </td>

                    {/* Unit */}
                    <td style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", borderRight: "1px solid #e2e8f0" }}>
                      {row.unit}
                    </td>

                    {/* Batch */}
                    <td style={{ padding: "4px 6px", textAlign: "center", fontWeight: "600", color: "#1e293b", borderRight: "1px solid #e2e8f0" }}>
                      {row.batch}
                    </td>

                    {/* ExpDt */}
                    <td style={{
                      padding: "4px 6px",
                      textAlign: "center",
                      fontWeight: "700",
                      borderRight: "1px solid #e2e8f0",
                      color: row.isExpired ? "#dc2626" : "#b45309"
                    }}>
                      {row.expDt}
                    </td>

                    {/* Stock */}
                    <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "700", color: "#0f172a", borderRight: "1px solid #e2e8f0" }}>
                      {row.stock}
                    </td>

                    {/* ExpQt (Editable Return Qty) */}
                    <td style={{ padding: "2px 4px", borderRight: "1px solid #e2e8f0" }} onClick={e => e.stopPropagation()}>
                      <input
                        type="number"
                        min="0"
                        value={row.expQt}
                        onChange={e => handleExpQtChange(idx, e.target.value)}
                        style={{
                          ...inp,
                          height: "24px",
                          fontSize: "11px",
                          fontWeight: "800",
                          textAlign: "right",
                          background: "#f0f9ff",
                          color: "#0369a1",
                          borderColor: "#7dd3fc"
                        }}
                      />
                    </td>

                    {/* Qty */}
                    <td style={{ padding: "4px 6px", textAlign: "right", color: "#64748b", borderRight: "1px solid #e2e8f0" }}>
                      {row.qty}
                    </td>

                    {/* MRP */}
                    <td style={{ padding: "4px 6px", textAlign: "right", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                      ₹{fmt(row.mrp)}
                    </td>

                    {/* P.Rate */}
                    <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "600", color: "#0f172a", borderRight: "1px solid #e2e8f0" }}>
                      ₹{fmt(row.pRate)}
                    </td>

                    {/* Amt */}
                    <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "800", color: "#0f172a", borderRight: "1px solid #e2e8f0" }}>
                      ₹{fmt(row.amt)}
                    </td>

                    {/* YR (Status) */}
                    <td style={{ padding: "4px 6px", textAlign: "center" }}>
                      <span style={{
                        padding: "2px 6px",
                        borderRadius: "10px",
                        fontSize: "9px",
                        fontWeight: "800",
                        background: row.isExpired ? "#fee2e2" : "#fef3c7",
                        color: row.isExpired ? "#b91c1c" : "#b45309"
                      }}>
                        {row.yr}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── BOTTOM TOTALS / ACTION BAR (CLEAN SLATE & BLUE THEME - MATCHES IMAGE 2) ── */}
      <div style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        
        {/* Left Quick Actions */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <button 
            onClick={handleConvertToPurchaseReturn} 
            style={{ ...btn("#0284c7", "white"), padding: "5px 14px", fontSize: "12px", fontWeight: "700" }}
          >
            ↩️ Convert Selected to Purchase Return
          </button>

          <button 
            onClick={handleAdjustStockWriteOff} 
            style={{ ...btn("#f1f5f9", "#b91c1c"), padding: "5px 12px", fontSize: "12px", fontWeight: "700", border: "1px solid #fecaca" }}
          >
            📦 Write Off Selected Stock
          </button>

          <button 
            onClick={handlePrint} 
            style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 12px", fontSize: "12px", border: "1px solid #cbd5e1" }}
          >
            🖨️ Print Report
          </button>
        </div>

        {/* Right Totals Box (Matches Net: from screenshot) */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "white", padding: "6px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "11px", color: "#64748b" }}>
            <span>Selected Items: <strong>{selectedRows.length}</strong> / {rows.length}</span>
          </div>

          <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "12px", fontSize: "11px" }}>
            <span style={{ color: "#475569" }}>Total Exp. Units:</span>{" "}
            <strong style={{ fontSize: "13px", color: "#0284c7" }}>{totalSelectedUnits}</strong>
          </div>

          <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "12px", fontSize: "11px" }}>
            <span style={{ color: "#475569", fontWeight: "700" }}>Net:</span>{" "}
            <strong style={{ fontSize: "14px", color: "#16a34a" }}>₹{fmt(totalNetValuation)}</strong>
          </div>
        </div>

      </div>

    </div>
  );
}
