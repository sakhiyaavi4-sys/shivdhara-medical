// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  X, Search, Database, Layers, CheckCircle, AlertCircle, 
  TrendingUp, ArrowUpDown, Filter, Printer, RefreshCw, Check, Eye
} from 'lucide-react';
import { useMedicalStore, btn, inp, lbl, fmt, num, int } from '../../MedicalStoreContext';

interface StockRateDetailModalProps {
  onClose: () => void;
}

export default function StockRateDetailModal({ onClose }: StockRateDetailModalProps) {
  const { 
    items, batches, purchaseBills, saveItems, showToast 
  } = useMedicalStore();

  const [srdCompanyFilter, setSrdCompanyFilter] = useState("ALL");
  const [srdSearchQuery, setSrdSearchQuery] = useState("");
  const [srdTaxFilter, setSrdTaxFilter] = useState("ALL");
  const [srdStockFilter, setSrdStockFilter] = useState<"all" | "in_stock" | "zero_stock">("all");
  const [srdSortField, setSrdSortField] = useState<"name" | "stock" | "mrp" | "lp">("name");
  const [srdSortOrder, setSrdSortOrder] = useState<"asc" | "desc">("asc");
  const [srdCalculatedLPs, setSrdCalculatedLPs] = useState<{ [key: string]: number }>({});
  const [srdIsCalculating, setSrdIsCalculating] = useState(false);
  const [srdStatusMsg, setSrdStatusMsg] = useState<string | null>(null);

  const handleCalculateAllLP = () => {
    setSrdIsCalculating(true);
    try {
      const newLPs: { [key: string]: number } = {};
      let count = 0;

      items.forEach((item: any) => {
        const itemBatches = batches.filter((b: any) => b.itemId === item.id);
        const taxRate = Number(item.gst || item.tax || 12);

        if (itemBatches.length > 0) {
          itemBatches.forEach((b: any) => {
            const key = `${item.id}_${b.batchNo || b.batch || 'default'}`;
            const basePurchaseRate = Number(b.purchaseRate || item.purchaseRate || (item.mrp ? item.mrp * 0.7 : 0));
            // Landing Price = Base Purchase Rate + GST on Purchase
            const calculatedLP = parseFloat((basePurchaseRate * (1 + taxRate / 100)).toFixed(2));
            newLPs[key] = calculatedLP;
            count++;
          });
        } else {
          const key = `${item.id}_default`;
          const basePurchaseRate = Number(item.purchaseRate || (item.mrp ? item.mrp * 0.7 : 0));
          const calculatedLP = parseFloat((basePurchaseRate * (1 + taxRate / 100)).toFixed(2));
          newLPs[key] = calculatedLP;
          count++;
        }
      });

      setSrdCalculatedLPs(newLPs);
      setSrdStatusMsg(`Landing Price (LP) successfully calculated for ${count} items and batches!`);
      setTimeout(() => setSrdStatusMsg(null), 5000);
    } catch (err: any) {
      setSrdStatusMsg("Failed to calculate landing prices.");
    } finally {
      setSrdIsCalculating(false);
    }
  };

  const handleExportStockRateCSV = () => {
    try {
      const headers = ["SrNo", "ItemName", "Company", "Tax", "Unit", "Batch", "Expiry", "MRP", "SRate", "PRate", "LP", "OpenStock", "CurrentStock"];
      const rows: any[] = [];
      let sr = 1;

      items.forEach((item: any) => {
        const itemBatches = batches.filter((b: any) => b.itemId === item.id);
        const taxRate = Number(item.gst || item.tax || 12);

        if (itemBatches.length > 0) {
          itemBatches.forEach((b: any) => {
            const key = `${item.id}_${b.batchNo || b.batch || 'default'}`;
            const pRate = Number(b.purchaseRate || item.purchaseRate || (item.mrp ? item.mrp * 0.7 : 0));
            const sRate = Number(b.saleRate || item.saleRate || item.mrp || 0);
            const lp = srdCalculatedLPs[key] || Number(b.landingPrice || b.netCost) || parseFloat((pRate * (1 + taxRate / 100)).toFixed(2));

            rows.push([
              sr++,
              `"${(item.name || '').replace(/"/g, '""')}"`,
              `"${(item.company || '').replace(/"/g, '""')}"`,
              `${taxRate}%`,
              `"${item.unit || item.packing || '1'}"`,
              `"${b.batchNo || b.batch || '—'}"`,
              b.expiry || item.expiry || '—',
              b.mrp || item.mrp || 0,
              sRate,
              pRate,
              lp,
              item.openingStock || 0,
              b.qty || 0
            ]);
          });
        } else {
          const key = `${item.id}_default`;
          const pRate = Number(item.purchaseRate || (item.mrp ? item.mrp * 0.7 : 0));
          const sRate = Number(item.saleRate || item.mrp || 0);
          const lp = srdCalculatedLPs[key] || parseFloat((pRate * (1 + taxRate / 100)).toFixed(2));

          rows.push([
            sr++,
            `"${(item.name || '').replace(/"/g, '""')}"`,
            `"${(item.company || '').replace(/"/g, '""')}"`,
            `${taxRate}%`,
            `"${item.unit || item.packing || '1'}"`,
            '—',
            item.expiry || '—',
            item.mrp || 0,
            sRate,
            pRate,
            lp,
            item.openingStock || 0,
            item.stock || 0
          ]);
        }
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Stock_Rate_Detail_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (_) {
      alert("Failed to generate CSV export.");
    }
  };


  return (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            background: "#f1f5f9",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
          }}>
            {/* ── TOP HEADER ── */}
            <div style={{
              background: "linear-gradient(135deg, #042f2e 0%, #0d9488 50%, #0f172a 100%)",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              color: "#fff",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 10px rgba(255,255,255,0.2)"
                }}>
                  <TrendingUp size={24} color="#5eead4" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", letterSpacing: "0.5px" }}>
                      Supervisor — Stock Rate Detail & Price Ledger
                    </h2>
                    <span style={{
                      background: "#14b8a6",
                      color: "#042f2e",
                      fontSize: "10px",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      letterSpacing: "0.5px"
                    }}>
                      SUPERVISOR AUDIT
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#ccfbf1", marginTop: "2px" }}>
                    Complete inventory valuation with MRP, Sale Rate, Purchase Rate, and calculated Landing Price (LP)
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => onClose()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.85)"; e.currentTarget.style.borderColor = "transparent"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
              >
                <X size={16} /> Close [Esc]
              </button>
            </div>

            {/* ── KPI SUMMARY CARDS ── */}
            {(() => {
              let totalStockUnits = 0;
              let totalValMRP = 0;
              let totalValCost = 0;
              let totalBatchesCount = 0;

              items.forEach((item: any) => {
                const itemBatches = batches.filter((b: any) => b.itemId === item.id);
                const taxRate = Number(item.gst || item.tax || 12);

                if (itemBatches.length > 0) {
                  itemBatches.forEach((b: any) => {
                    totalBatchesCount++;
                    const qty = Number(b.qty) || 0;
                    const mrp = Number(b.mrp || item.mrp || 0);
                    const key = `${item.id}_${b.batchNo || b.batch || 'default'}`;
                    const pRate = Number(b.purchaseRate || item.purchaseRate || (mrp * 0.7));
                    const lp = srdCalculatedLPs[key] || Number(b.landingPrice || b.netCost) || (pRate * (1 + taxRate / 100));

                    totalStockUnits += qty;
                    totalValMRP += qty * mrp;
                    totalValCost += qty * lp;
                  });
                } else {
                  const qty = Number(item.stock) || 0;
                  const mrp = Number(item.mrp || 0);
                  const key = `${item.id}_default`;
                  const pRate = Number(item.purchaseRate || (mrp * 0.7));
                  const lp = srdCalculatedLPs[key] || (pRate * (1 + taxRate / 100));

                  totalStockUnits += qty;
                  totalValMRP += qty * mrp;
                  totalValCost += qty * lp;
                }
              });

              const grossProfitPotential = totalValMRP - totalValCost;
              const marginPct = totalValMRP > 0 ? ((grossProfitPotential / totalValMRP) * 100).toFixed(1) : "0";

              return (
                <div style={{
                  background: "#ffffff",
                  padding: "10px 24px",
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: "14px",
                  borderBottom: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  flexShrink: 0
                }}>
                  <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Items</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{items.length}</div>
                  </div>

                  <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Active Batches</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0d9488", marginTop: "2px" }}>{totalBatchesCount}</div>
                  </div>

                  <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Stock Qty</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0284c7", marginTop: "2px" }}>{totalStockUnits.toLocaleString("en-IN")}</div>
                  </div>

                  <div style={{ padding: "8px 12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: "11px", color: "#166534", fontWeight: "700", textTransform: "uppercase" }}>Stock Value (MRP)</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#15803d", marginTop: "2px" }}>₹{fmt(totalValMRP)}</div>
                  </div>

                  <div style={{ padding: "8px 12px", background: "#f0fdfa", borderRadius: "8px", border: "1px solid #99f6e4" }}>
                    <div style={{ fontSize: "11px", color: "#0f766e", fontWeight: "700", textTransform: "uppercase" }}>Stock Cost (Landing)</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0d9488", marginTop: "2px" }}>₹{fmt(totalValCost)}</div>
                  </div>

                  <div style={{ padding: "8px 12px", background: "#fef3c7", borderRadius: "8px", border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: "11px", color: "#92400e", fontWeight: "700", textTransform: "uppercase" }}>Potential Margin</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#b45309", marginTop: "2px" }}>
                      {marginPct}% <span style={{ fontSize: "11px", fontWeight: "600" }}>(₹{fmt(grossProfitPotential)})</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── FILTER & CONTROL TOOLBAR ── */}
            <div style={{
              background: "#ffffff",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              borderBottom: "1px solid #cbd5e1",
              flexShrink: 0
            }}>
              {/* Left Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                
                {/* Company Filter Dropdown */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Company:</label>
                  <select
                    value={srdCompanyFilter}
                    onChange={e => setSrdCompanyFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: "#fff",
                      minWidth: "160px",
                      maxWidth: "220px"
                    }}
                  >
                    <option value="ALL">All Companies</option>
                    {Array.from(new Set(items.map((i: any) => (i.company || '').trim()).filter(Boolean))).sort().map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {srdCompanyFilter !== "ALL" && (
                    <button
                      onClick={() => setSrdCompanyFilter("ALL")}
                      style={{
                        padding: "7px 12px",
                        background: "#0d9488",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      All
                    </button>
                  )}
                </div>

                {/* Search Input */}
                <div style={{ position: "relative" }}>
                  <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    value={srdSearchQuery}
                    onChange={e => setSrdSearchQuery(e.target.value)}
                    placeholder="Search Item, Batch, Barcode..."
                    style={{
                      padding: "8px 12px 8px 30px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      width: "220px",
                      outline: "none"
                    }}
                  />
                  {srdSearchQuery && (
                    <button
                      onClick={() => setSrdSearchQuery("")}
                      style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Stock Filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Stock:</label>
                  <select
                    value={srdStockFilter}
                    onChange={e => setSrdStockFilter(e.target.value as any)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      background: "#fff"
                    }}
                  >
                    <option value="all">All Stock Status</option>
                    <option value="in_stock">In Stock Only (&gt; 0)</option>
                    <option value="zero_stock">Zero Stock Only (0)</option>
                  </select>
                </div>

                {/* Tax Filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Tax:</label>
                  <select
                    value={srdTaxFilter}
                    onChange={e => setSrdTaxFilter(e.target.value)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      background: "#fff"
                    }}
                  >
                    <option value="ALL">All Tax Rates</option>
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>

              {/* Right Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                
                {/* Calculate LP Button */}
                <button
                  onClick={handleCalculateAllLP}
                  disabled={srdIsCalculating}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: srdIsCalculating ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 6px rgba(13,148,136,0.3)"
                  }}
                >
                  <span style={{ fontSize: "14px" }}>⚡</span>
                  <span>{srdIsCalculating ? "Calculating..." : "Calculate LP"}</span>
                </button>

                {/* Export CSV Button */}
                <button
                  onClick={handleExportStockRateCSV}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  <FileText size={14} /> Export CSV
                </button>
              </div>
            </div>

            {/* ── STATUS ALERT ── */}
            {srdStatusMsg && (
              <div style={{
                padding: "8px 24px",
                background: "#dcfce7",
                color: "#166534",
                fontSize: "12px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #bbf7d0"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle size={14} />
                  <span>{srdStatusMsg}</span>
                </div>
                <button onClick={() => setSrdStatusMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold" }}>✕</button>
              </div>
            )}

            {/* ── DATA GRID TABLE (12 COLUMNS) ── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", background: "#f8fafc" }}>
              <div style={{
                background: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                overflow: "hidden"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{
                      background: "#0f172a",
                      color: "#ffffff",
                      textAlign: "left",
                      position: "sticky",
                      top: 0,
                      zIndex: 10
                    }}>
                      <th style={{ padding: "10px 8px", width: "45px", textAlign: "center" }}>SrNo</th>
                      <th style={{ padding: "10px 12px", minWidth: "220px" }}>Item Name & Company</th>
                      <th style={{ padding: "10px 8px", width: "55px", textAlign: "center" }}>Tax</th>
                      <th style={{ padding: "10px 8px", width: "65px", textAlign: "center" }}>Unit</th>
                      <th style={{ padding: "10px 10px", width: "95px" }}>Batch</th>
                      <th style={{ padding: "10px 8px", width: "80px", textAlign: "center" }}>Expiry</th>
                      <th style={{ padding: "10px 10px", width: "85px", textAlign: "right" }}>MRP (₹)</th>
                      <th style={{ padding: "10px 10px", width: "85px", textAlign: "right" }}>SRate (₹)</th>
                      <th style={{ padding: "10px 10px", width: "85px", textAlign: "right" }}>PRate (₹)</th>
                      <th style={{ padding: "10px 10px", width: "90px", textAlign: "right", background: "#0d9488", color: "#fff" }}>LP (₹)</th>
                      <th style={{ padding: "10px 8px", width: "70px", textAlign: "right" }}>Open.</th>
                      <th style={{ padding: "10px 10px", width: "75px", textAlign: "right" }}>Curr.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const q = srdSearchQuery.trim().toLowerCase();
                      let displayRows: any[] = [];

                      items.forEach((item: any) => {
                        // Company filter
                        if (srdCompanyFilter !== "ALL" && (item.company || '').trim().toLowerCase() !== srdCompanyFilter.toLowerCase()) {
                          return;
                        }

                        // Tax filter
                        const taxRate = Number(item.gst || item.tax || 12);
                        if (srdTaxFilter !== "ALL" && String(taxRate) !== srdTaxFilter) {
                          return;
                        }

                        // Search query
                        const iName = (item.name || '').toLowerCase();
                        const iComp = (item.company || '').toLowerCase();
                        const iBar = (item.barcode || '').toLowerCase();

                        const itemBatches = batches.filter((b: any) => b.itemId === item.id);

                        if (itemBatches.length > 0) {
                          itemBatches.forEach((b: any) => {
                            const bNo = (b.batchNo || b.batch || '').toLowerCase();
                            if (q && !iName.includes(q) && !iComp.includes(q) && !iBar.includes(q) && !bNo.includes(q)) {
                              return;
                            }

                            const currQty = Number(b.qty) || 0;
                            if (srdStockFilter === "in_stock" && currQty <= 0) return;
                            if (srdStockFilter === "zero_stock" && currQty > 0) return;

                            const key = `${item.id}_${b.batchNo || b.batch || 'default'}`;
                            const pRate = Number(b.purchaseRate || item.purchaseRate || ((b.mrp || item.mrp || 0) * 0.7));
                            const sRate = Number(b.saleRate || item.saleRate || b.mrp || item.mrp || 0);
                            const lp = srdCalculatedLPs[key] || Number(b.landingPrice || b.netCost) || parseFloat((pRate * (1 + taxRate / 100)).toFixed(2));

                            displayRows.push({
                              itemId: item.id,
                              name: item.name,
                              company: item.company || '—',
                              tax: taxRate,
                              unit: item.unit || item.packing || '1',
                              batch: b.batchNo || b.batch || '—',
                              expiry: b.expiry || item.expiry || '—',
                              mrp: Number(b.mrp || item.mrp || 0),
                              sRate,
                              pRate,
                              lp,
                              openStock: Number(item.openingStock || 0),
                              currStock: currQty
                            });
                          });
                        } else {
                          if (q && !iName.includes(q) && !iComp.includes(q) && !iBar.includes(q)) {
                            return;
                          }

                          const currQty = Number(item.stock) || 0;
                          if (srdStockFilter === "in_stock" && currQty <= 0) return;
                          if (srdStockFilter === "zero_stock" && currQty > 0) return;

                          const key = `${item.id}_default`;
                          const pRate = Number(item.purchaseRate || ((item.mrp || 0) * 0.7));
                          const sRate = Number(item.saleRate || item.mrp || 0);
                          const lp = srdCalculatedLPs[key] || parseFloat((pRate * (1 + taxRate / 100)).toFixed(2));

                          displayRows.push({
                            itemId: item.id,
                            name: item.name,
                            company: item.company || '—',
                            tax: taxRate,
                            unit: item.unit || item.packing || '1',
                            batch: '—',
                            expiry: item.expiry || '—',
                            mrp: Number(item.mrp || 0),
                            sRate,
                            pRate,
                            lp,
                            openStock: Number(item.openingStock || 0),
                            currStock: currQty
                          });
                        }
                      });

                      if (displayRows.length === 0) {
                        return (
                          <tr>
                            <td colSpan={12} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                              <div style={{ fontSize: "28px", marginBottom: "8px" }}>📦</div>
                              <div style={{ fontSize: "14px", fontWeight: "700", color: "#64748b" }}>No stock items found</div>
                              <div style={{ fontSize: "12px", marginTop: "4px" }}>Try adjusting your company, search, or stock status filters.</div>
                            </td>
                          </tr>
                        );
                      }

                      return displayRows.map((row, idx) => {
                        const isZero = row.currStock <= 0;
                        return (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: "1px solid #f1f5f9",
                              background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                              transition: "0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f0fdfa"}
                            onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f8fafc"}
                          >
                            <td style={{ padding: "9px 8px", textAlign: "center", color: "#94a3b8", fontWeight: "600" }}>
                              {idx + 1}
                            </td>
                            <td style={{ padding: "9px 12px" }}>
                              <div style={{ fontWeight: "700", color: "#0f172a" }}>{row.name}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>{row.company}</div>
                            </td>
                            <td style={{ padding: "9px 8px", textAlign: "center" }}>
                              <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                                {row.tax}%
                              </span>
                            </td>
                            <td style={{ padding: "9px 8px", textAlign: "center", color: "#475569" }}>
                              {row.unit}
                            </td>
                            <td style={{ padding: "9px 10px", fontWeight: "600", color: "#334155" }}>
                              {row.batch}
                            </td>
                            <td style={{ padding: "9px 8px", textAlign: "center", color: "#64748b" }}>
                              {row.expiry}
                            </td>
                            <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: "700", color: "#334155" }}>
                              ₹{fmt(row.mrp)}
                            </td>
                            <td style={{ padding: "9px 10px", textAlign: "right", color: "#0f766e", fontWeight: "700" }}>
                              ₹{fmt(row.sRate)}
                            </td>
                            <td style={{ padding: "9px 10px", textAlign: "right", color: "#475569" }}>
                              ₹{fmt(row.pRate)}
                            </td>
                            <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: "800", color: "#0d9488", background: "rgba(13,148,136,0.06)" }}>
                              ₹{fmt(row.lp)}
                            </td>
                            <td style={{ padding: "9px 8px", textAlign: "right", color: "#94a3b8" }}>
                              {row.openStock}
                            </td>
                            <td style={{ padding: "9px 10px", textAlign: "right" }}>
                              <span style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "800",
                                background: isZero ? "#fee2e2" : "#dcfce7",
                                color: isZero ? "#991b1b" : "#166534"
                              }}>
                                {row.currStock}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
  );
}
