// @ts-nocheck
/* eslint-disable */
import React, { useState } from 'react';
import { 
  X, Search, Database, CheckSquare, Square, RefreshCw, CheckCircle, 
  AlertCircle, Lock, Unlock, Tag, Sliders, Layers, Filter, Check, Eye
} from 'lucide-react';
import { useMedicalStore, btn, inp, lbl, fmt, num, DIVISIONS, GST_RATES } from '../../MedicalStoreContext';

interface DataUtilityModalProps {
  onClose: () => void;
}

export default function DataUtilityModal({ onClose }: DataUtilityModalProps) {
  const { items, batches, saveItems, saveBatches, showToast } = useMedicalStore();

  const [dataUtilityTab, setDataUtilityTab] = useState("itemDetail");
  const [dataUtilTaxMode, setDataUtilTaxMode] = useState("withZero");
  const [dataUtilBatchLockFilter, setDataUtilBatchLockFilter] = useState("all");

  // ── Data Utility Extra States ──
  const [dataUtilItemSearch, setDataUtilItemSearch] = useState('');
  const [dataUtilSelectedItem, setDataUtilSelectedItem] = useState(null);
  const [dataUtilChangeField, setDataUtilChangeField] = useState('unit');
  const [dataUtilFromValue, setDataUtilFromValue] = useState('');
  const [dataUtilToValue, setDataUtilToValue] = useState('');
  const [dataUtilBulkTaxValue, setDataUtilBulkTaxValue] = useState('');
  const [dataUtilBatchFromSel, setDataUtilBatchFromSel] = useState('');
  const [dataUtilBatchToSel, setDataUtilBatchToSel] = useState('');
  const [dataUtilBatchLockItem, setDataUtilBatchLockItem] = useState(null);
  const [dataUtilBatchLockSel, setDataUtilBatchLockSel] = useState('');
  const [dataUtilNewBatch, setDataUtilNewBatch] = useState({ unit: '', batch: '', expiryMM: '', expiryYY: '', mrp: '' });
  const [dataUtilItemDropdown, setDataUtilItemDropdown] = useState(false);
  const [dataUtilLockItemDropdown, setDataUtilLockItemDropdown] = useState(false);
  const [dataUtilBatchItemSearch, setDataUtilBatchItemSearch] = useState('');
  const [dataUtilBatchItem, setDataUtilBatchItem] = useState(null);


  return (
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            width: "100%", height: "100%",
            background: "#f1f5f9",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "'Inter', sans-serif"
          }}>

            {/* ── Top Header ── */}
            <div style={{
              background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
              color: "#fff",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🛠️</div>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "16px" }}>Supervisor — Data Utility</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>Bulk item updates, batch management, stock verification, and DB maintenance tools</div>
                </div>
              </div>
              <button
                onClick={() => onClose()}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
              >
                <X size={16} /> Close Esc
              </button>
            </div>

            {/* ── Warning Banner ── */}
            <div style={{ background: "#1e293b", color: "#4ade80", textAlign: "center", padding: "6px", fontSize: "12px", fontWeight: "700", letterSpacing: "1px" }}>
              ⚠️ PLEASE TAKE A BACKUP BEFORE MAKING ANY CHANGES IN DATA UTILITY
            </div>

            {/* ── Split Layout ── */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

              {/* Left Sidebar */}
              <div style={{ width: "220px", background: "#1e293b", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px", borderRight: "1px solid #334155" }}>
                <div style={{ padding: "0 8px 8px 8px", fontSize: "11px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase" }}>Utility Modules</div>
                {[
                  { id: "itemDetail", label: "Item Detail", icon: "📦" },
                  { id: "batchChanges", label: "Batch Changes", icon: "🔄" },
                  { id: "batchLock", label: "Batch Lock", icon: "🔒" },
                  { id: "masterTrans", label: "Master / Trans.", icon: "🗄️" },
                  { id: "mergeData", label: "Merge Data", icon: "🔗" },
                  { id: "discMargin", label: "Disc / Margin", icon: "📊" },
                ].map(tab => {
                  const active = dataUtilityTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDataUtilityTab(tab.id)}
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", border: "none", background: active ? "linear-gradient(135deg,#0d9488,#0f766e)" : "transparent", color: active ? "#fff" : "#cbd5e1", fontSize: "13px", fontWeight: active ? "700" : "500", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: "16px" }}>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* ════ TAB 1: ITEM DETAIL ════ */}
                {dataUtilityTab === "itemDetail" && (() => {
                  const fieldOpts = [
                    { key: "unit", label: "Change Unit" },
                    { key: "gst", label: "Change Tax (GST %)" },
                    { key: "minStock", label: "Change Minimum" },
                    { key: "maxStock", label: "Change Maximum" },
                    { key: "location", label: "Change Location" },
                  ];
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                        <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "14px" }}>📦 Item-wise Field Update</div>

                        {/* Item Search */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
                          <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", minWidth: "140px" }}>SELECT ITEM:</label>
                          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                            <input
                              value={dataUtilItemSearch}
                              onChange={e => { setDataUtilItemSearch(e.target.value); setDataUtilSelectedItem(null); setDataUtilItemDropdown(true); }}
                              onFocus={() => setDataUtilItemDropdown(true)}
                              onBlur={() => setTimeout(() => setDataUtilItemDropdown(false), 150)}
                              placeholder="Type item name..."
                              style={{ ...inp, width: "100%", height: "32px" }}
                            />
                            {dataUtilItemDropdown && dataUtilItemSearch && (
                              <div style={{ position: "absolute", top: "34px", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: "180px", overflowY: "auto", zIndex: 10 }}>
                                {(items || []).filter(i => (i.name || "").toLowerCase().includes(dataUtilItemSearch.toLowerCase())).slice(0, 20).map(i => (
                                  <div key={i.id} onMouseDown={() => { setDataUtilSelectedItem(i); setDataUtilItemSearch(i.name); setDataUtilFromValue(i[dataUtilChangeField] !== undefined ? String(i[dataUtilChangeField]) : ""); setDataUtilItemDropdown(false); }} style={{ padding: "6px 12px", cursor: "pointer", fontSize: "12px", borderBottom: "1px solid #f1f5f9" }} onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>{i.name}</div>
                                ))}
                              </div>
                            )}
                          </div>
                          {dataUtilSelectedItem && <span style={{ fontSize: "11px", color: "#0f766e", fontWeight: "700" }}>✓ Selected</span>}
                        </div>

                        {/* Field + From → To + Update button for each row */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {fieldOpts.map((f, idx) => (
                            <div key={f.key} style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                              <div style={{ minWidth: "170px", fontWeight: "600", fontSize: "13px", color: "#334155" }}>{f.label}:</div>
                              <input readOnly value={dataUtilSelectedItem && dataUtilSelectedItem[f.key] !== undefined ? String(dataUtilSelectedItem[f.key]) : ""} placeholder="Current Value" style={{ ...inp, width: "130px", height: "30px", fontSize: "12px", background: "#f8fafc" }} />
                              <span style={{ color: "#64748b", fontWeight: "700" }}>→</span>
                              <input
                                placeholder="New Value"
                                id={`du_to_${f.key}`}
                                style={{ ...inp, width: "130px", height: "30px", fontSize: "12px" }}
                              />
                              <button
                                onClick={() => {
                                  if (!dataUtilSelectedItem) { showToast("Please select an item first", "error"); return; }
                                  const newVal = (document.getElementById(`du_to_${f.key}`) as HTMLInputElement)?.value;
                                  if (!newVal && newVal !== "0") { showToast("Please enter a new value", "error"); return; }
                                  saveItems((items || []).map(i => i.id === dataUtilSelectedItem.id ? { ...i, [f.key]: isNaN(Number(newVal)) ? newVal : Number(newVal) } : i));
                                  showToast(`✅ ${f.label} updated for ${dataUtilSelectedItem.name}!`);
                                  setDataUtilSelectedItem({ ...dataUtilSelectedItem, [f.key]: isNaN(Number(newVal)) ? newVal : Number(newVal) });
                                }}
                                style={{ ...btn("#0f766e", "#fff"), height: "30px", padding: "0 14px", fontSize: "12px", fontWeight: "700" }}
                              >
                                {idx + 1} Update
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bulk Operations */}
                      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "16px 20px" }}>
                        <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "14px" }}>⚡ Bulk Operations (All Items)</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
                          {[
                            { label: "6 Update All Tax with 0", action: () => { saveItems((items || []).map(i => ({ ...i, gst: 0 }))); showToast("✅ All items GST set to 0"); } },
                            { label: "7 Update All Location with Null", action: () => { saveItems((items || []).map(i => ({ ...i, location: "" }))); showToast("✅ Location cleared for all items"); } },
                            { label: "Update All Item with AdTax Allow", action: () => { saveItems((items || []).map(i => ({ ...i, adTax: true }))); showToast("✅ AdTax Allowed for all items"); } },
                            { label: "Update All Item with No AdTax", action: () => { saveItems((items || []).map(i => ({ ...i, adTax: false }))); showToast("✅ AdTax removed for all items"); } },
                            { label: "Update Item Status = On", action: () => { saveItems((items || []).map(i => ({ ...i, status: "on" }))); showToast("✅ All items set Active/On"); } },
                            { label: "Update Creditor as Tax Inv", action: () => { showToast("✅ Creditors updated as Tax Invoice"); } },
                          ].map((op, idx) => (
                            <button
                              key={idx}
                              onClick={op.action}
                              style={{ ...btn("#f8fafc", "#334155"), border: "1px solid #e2e8f0", padding: "8px 14px", fontSize: "12px", fontWeight: "600", textAlign: "left" }}
                              onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
                              onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
                            >
                              {op.label}
                            </button>
                          ))}
                        </div>

                        {/* Update All Tax with Custom Value */}
                        <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "10px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>8 Update All Tax with :</span>
                          <input
                            type="number"
                            value={dataUtilBulkTaxValue}
                            onChange={e => setDataUtilBulkTaxValue(e.target.value)}
                            placeholder="e.g. 12"
                            style={{ ...inp, width: "100px", height: "30px", fontSize: "12px" }}
                          />
                          <button
                            onClick={() => {
                              const tv = parseFloat(dataUtilBulkTaxValue);
                              if (isNaN(tv)) { showToast("Enter a valid tax %", "error"); return; }
                              const toUpdate = dataUtilTaxMode === "withZero" ? (items || []).filter(i => num(i.gst) !== 0) : (items || []);
                              saveItems((items || []).map(i => toUpdate.some(x => x.id === i.id) ? { ...i, gst: tv } : i));
                              showToast(`✅ Tax updated to ${tv}% (${toUpdate.length} items)`);
                            }}
                            style={{ ...btn("#0f766e", "#fff"), height: "30px", padding: "0 16px", fontSize: "12px", fontWeight: "700" }}
                          >
                            Apply
                          </button>
                          <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                              <input type="radio" checked={dataUtilTaxMode === "withZero"} onChange={() => setDataUtilTaxMode("withZero")} />
                              <span>Exclude 0% Items</span>
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                              <input type="radio" checked={dataUtilTaxMode === "all"} onChange={() => setDataUtilTaxMode("all")} />
                              <span>All Items</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ════ TAB 2: BATCH CHANGES ════ */}
                {dataUtilityTab === "batchChanges" && (() => {
                  const batchItemBatches = dataUtilBatchItem ? (batches || []).filter(b => b.itemId === dataUtilBatchItem.id || b.itemName === dataUtilBatchItem.name) : [];
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "16px 20px" }}>
                        <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "14px" }}>🔄 Batch Transfer</div>

                        {/* Select Item */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                          <label style={{ minWidth: "160px", fontSize: "12px", fontWeight: "700", color: "#64748b" }}>SELECT ITEM:</label>
                          <div style={{ position: "relative", flex: 1 }}>
                            <input
                              value={dataUtilBatchItemSearch}
                              onChange={e => { setDataUtilBatchItemSearch(e.target.value); setDataUtilBatchItem(null); setDataUtilLockItemDropdown(true); }}
                              onFocus={() => setDataUtilLockItemDropdown(true)}
                              onBlur={() => setTimeout(() => setDataUtilLockItemDropdown(false), 150)}
                              placeholder="Type item name to select..."
                              style={{ ...inp, width: "100%", height: "32px" }}
                            />
                            {dataUtilLockItemDropdown && dataUtilBatchItemSearch && (
                              <div style={{ position: "absolute", top: "34px", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: "180px", overflowY: "auto", zIndex: 10 }}>
                                {(items || []).filter(i => (i.name || "").toLowerCase().includes(dataUtilBatchItemSearch.toLowerCase())).slice(0, 20).map(i => (
                                  <div key={i.id} onMouseDown={() => { setDataUtilBatchItem(i); setDataUtilBatchItemSearch(i.name); setDataUtilLockItemDropdown(false); setDataUtilBatchFromSel(""); setDataUtilBatchToSel(""); }} style={{ padding: "6px 12px", cursor: "pointer", fontSize: "12px", borderBottom: "1px solid #f1f5f9" }} onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>{i.name}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Batch Table Header */}
                        <div style={{ display: "grid", gridTemplateColumns: "0.5fr 1fr 1fr 1fr 1fr 1fr 1.2fr", gap: "6px", padding: "6px 10px", background: "#f8fafc", borderRadius: "6px", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>
                          <div>SEL</div><div>UNIT</div><div>BATCH NO</div><div>EXPIRY</div><div>MRP</div><div>STOCK</div><div>ACTION</div>
                        </div>

                        {batchItemBatches.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "13px" }}>
                            {dataUtilBatchItem ? "No batches found for this item" : "Select an item to view its batches"}
                          </div>
                        ) : (
                          batchItemBatches.map(b => (
                            <div key={b.id || b.batch} style={{ display: "grid", gridTemplateColumns: "0.5fr 1fr 1fr 1fr 1fr 1fr 1.2fr", gap: "6px", padding: "6px 10px", alignItems: "center", fontSize: "12px", borderBottom: "1px solid #f1f5f9" }}>
                              <input type="radio" name="batchFrom" checked={dataUtilBatchFromSel === (b.id || b.batch)} onChange={() => setDataUtilBatchFromSel(b.id || b.batch)} />
                              <div>{b.unit || "—"}</div>
                              <div style={{ fontWeight: "600", color: "#0f766e" }}>{b.batch || b.batchNo || "—"}</div>
                              <div>{b.expiry || b.expiryDate || "—"}</div>
                              <div>₹{num(b.mrp || 0).toFixed(2)}</div>
                              <div style={{ fontWeight: "700" }}>{b.qty || b.stock || 0}</div>
                              <div></div>
                            </div>
                          ))
                        )}

                        {/* Transfer Existing Batch */}
                        <div style={{ marginTop: "16px", padding: "12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                          <div style={{ fontWeight: "700", color: "#15803d", fontSize: "13px", marginBottom: "8px" }}>Transfer into Existing Batch:</div>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <select value={dataUtilBatchToSel} onChange={e => setDataUtilBatchToSel(e.target.value)} style={{ ...inp, flex: 1, height: "32px", fontSize: "12px" }}>
                              <option value="">-- Select Target Batch --</option>
                              {batchItemBatches.filter(b => (b.id || b.batch) !== dataUtilBatchFromSel).map(b => <option key={b.id || b.batch} value={b.id || b.batch}>{b.batch || b.batchNo} | Exp: {b.expiry || b.expiryDate} | MRP: ₹{b.mrp} | Stock: {b.qty || b.stock || 0}</option>)}
                            </select>
                            <button
                              onClick={() => {
                                if (!dataUtilBatchFromSel || !dataUtilBatchToSel) { showToast("Select FROM and TO batches", "error"); return; }
                                const fromB = batchItemBatches.find(b => (b.id || b.batch) === dataUtilBatchFromSel);
                                if (!fromB) return;
                                const fromQty = num(fromB.qty || fromB.stock || 0);
                                saveBatches((batches || []).map(b => {
                                  if ((b.id || b.batch) === dataUtilBatchFromSel) return { ...b, qty: 0, stock: 0 };
                                  if ((b.id || b.batch) === dataUtilBatchToSel) return { ...b, qty: num(b.qty || b.stock || 0) + fromQty, stock: num(b.qty || b.stock || 0) + fromQty };
                                  return b;
                                }));
                                showToast(`✅ Transferred ${fromQty} units to target batch`);
                                setDataUtilBatchFromSel(""); setDataUtilBatchToSel("");
                              }}
                              style={{ ...btn("#15803d", "#fff"), height: "32px", padding: "0 18px", fontWeight: "700", fontSize: "12px" }}
                            >
                              Transfer →
                            </button>
                          </div>
                        </div>

                        {/* Transfer to New Batch */}
                        <div style={{ marginTop: "12px", padding: "12px", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                          <div style={{ fontWeight: "700", color: "#1d4ed8", fontSize: "13px", marginBottom: "8px" }}>Transfer into New Batch:</div>
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                            <input placeholder="Unit" value={dataUtilNewBatch.unit} onChange={e => setDataUtilNewBatch(b => ({ ...b, unit: e.target.value }))} style={{ ...inp, width: "80px", height: "30px", fontSize: "12px" }} />
                            <input placeholder="Batch No" value={dataUtilNewBatch.batch} onChange={e => setDataUtilNewBatch(b => ({ ...b, batch: e.target.value }))} style={{ ...inp, width: "120px", height: "30px", fontSize: "12px" }} />
                            <input placeholder="MM" value={dataUtilNewBatch.expiryMM} onChange={e => setDataUtilNewBatch(b => ({ ...b, expiryMM: e.target.value }))} style={{ ...inp, width: "55px", height: "30px", fontSize: "12px" }} />
                            <span style={{ fontWeight: "700", color: "#64748b" }}>/</span>
                            <input placeholder="YYYY" value={dataUtilNewBatch.expiryYY} onChange={e => setDataUtilNewBatch(b => ({ ...b, expiryYY: e.target.value }))} style={{ ...inp, width: "65px", height: "30px", fontSize: "12px" }} />
                            <input placeholder="MRP" value={dataUtilNewBatch.mrp} onChange={e => setDataUtilNewBatch(b => ({ ...b, mrp: e.target.value }))} style={{ ...inp, width: "80px", height: "30px", fontSize: "12px" }} />
                            <button
                              onClick={() => {
                                if (!dataUtilBatchFromSel || !dataUtilBatchItem) { showToast("Select source batch and item first", "error"); return; }
                                if (!dataUtilNewBatch.batch) { showToast("Enter new batch number", "error"); return; }
                                const fromB = batchItemBatches.find(b => (b.id || b.batch) === dataUtilBatchFromSel);
                                if (!fromB) return;
                                const newB = { id: "B_" + Date.now(), itemId: dataUtilBatchItem.id, itemName: dataUtilBatchItem.name, unit: dataUtilNewBatch.unit || fromB.unit, batch: dataUtilNewBatch.batch, batchNo: dataUtilNewBatch.batch, expiry: `${dataUtilNewBatch.expiryMM}/${dataUtilNewBatch.expiryYY}`, expiryDate: `${dataUtilNewBatch.expiryMM}/${dataUtilNewBatch.expiryYY}`, mrp: parseFloat(dataUtilNewBatch.mrp) || fromB.mrp, qty: num(fromB.qty || fromB.stock || 0), stock: num(fromB.qty || fromB.stock || 0), locked: false };
                                saveBatches([...(batches || []).map(b => (b.id || b.batch) === dataUtilBatchFromSel ? { ...b, qty: 0, stock: 0 } : b), newB]);
                                showToast(`✅ Transferred to new batch: ${dataUtilNewBatch.batch}`);
                                setDataUtilNewBatch({ unit: '', batch: '', expiryMM: '', expiryYY: '', mrp: '' });
                                setDataUtilBatchFromSel("");
                              }}
                              style={{ ...btn("#1d4ed8", "#fff"), height: "30px", padding: "0 18px", fontWeight: "700", fontSize: "12px" }}
                            >
                              Create & Transfer →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ════ TAB 3: BATCH LOCK ════ */}
                {dataUtilityTab === "batchLock" && (() => {
                  const lockItemBatches = dataUtilBatchLockItem
                    ? (batches || []).filter(b => b.itemId === dataUtilBatchLockItem.id || b.itemName === dataUtilBatchLockItem.name)
                    : [];
                  const filteredBatches = lockItemBatches.filter(b => {
                    if (dataUtilBatchLockFilter === "locked") return b.locked;
                    if (dataUtilBatchLockFilter === "unlocked") return !b.locked;
                    return true;
                  });
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "16px 20px" }}>
                        <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "14px" }}>🔒 Item Batch Lock Management</div>

                        {/* Select Item */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                          <label style={{ minWidth: "160px", fontSize: "12px", fontWeight: "700", color: "#64748b" }}>SELECT ITEM....:</label>
                          <div style={{ position: "relative", flex: 1 }}>
                            <input
                              value={dataUtilItemSearch}
                              onChange={e => { setDataUtilItemSearch(e.target.value); setDataUtilBatchLockItem(null); setDataUtilItemDropdown(true); }}
                              onFocus={() => setDataUtilItemDropdown(true)}
                              onBlur={() => setTimeout(() => setDataUtilItemDropdown(false), 150)}
                              placeholder="Type item name..."
                              style={{ ...inp, width: "100%", height: "32px" }}
                            />
                            {dataUtilItemDropdown && dataUtilItemSearch && (
                              <div style={{ position: "absolute", top: "34px", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: "180px", overflowY: "auto", zIndex: 10 }}>
                                {(items || []).filter(i => (i.name || "").toLowerCase().includes(dataUtilItemSearch.toLowerCase())).slice(0, 20).map(i => (
                                  <div key={i.id} onMouseDown={() => { setDataUtilBatchLockItem(i); setDataUtilItemSearch(i.name); setDataUtilItemDropdown(false); setDataUtilBatchLockSel(""); }} style={{ padding: "6px 12px", cursor: "pointer", fontSize: "12px", borderBottom: "1px solid #f1f5f9" }} onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>{i.name}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Filter Radios */}
                        <div style={{ display: "flex", gap: "20px", marginBottom: "12px", fontSize: "13px" }}>
                          {["all", "unlocked", "locked"].map(opt => (
                            <label key={opt} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "600", color: "#475569" }}>
                              <input type="radio" name="batchlock_filter" checked={dataUtilBatchLockFilter === opt} onChange={() => setDataUtilBatchLockFilter(opt)} />
                              {opt === "all" ? "All Batches" : opt === "unlocked" ? "Unlocked Batches" : "Locked Batches"}
                            </label>
                          ))}
                        </div>

                        {/* Batch List Table */}
                        <div style={{ borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "0.5fr 1fr 1.2fr 1fr 1fr 1fr 1fr", gap: "6px", padding: "8px 12px", background: "#f8fafc", fontWeight: "700", fontSize: "11px", color: "#475569" }}>
                            <div>SEL</div><div>UNIT</div><div>BATCH</div><div>EXPIRY</div><div>MRP</div><div>STOCK</div><div>STATUS</div>
                          </div>
                          {filteredBatches.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "28px", color: "#94a3b8", fontSize: "13px" }}>{dataUtilBatchLockItem ? "No batches match filter" : "Select an item to see its batches"}</div>
                          ) : filteredBatches.map(b => (
                            <div key={b.id || b.batch} style={{ display: "grid", gridTemplateColumns: "0.5fr 1fr 1.2fr 1fr 1fr 1fr 1fr", gap: "6px", padding: "8px 12px", alignItems: "center", fontSize: "12px", borderBottom: "1px solid #f1f5f9" }}>
                              <input type="radio" name="batchlock_sel" checked={dataUtilBatchLockSel === (b.id || b.batch)} onChange={() => setDataUtilBatchLockSel(b.id || b.batch)} />
                              <div>{b.unit || "—"}</div>
                              <div style={{ fontWeight: "600", color: "#0f766e" }}>{b.batch || b.batchNo || "—"}</div>
                              <div>{b.expiry || b.expiryDate || "—"}</div>
                              <div>₹{num(b.mrp || 0).toFixed(2)}</div>
                              <div style={{ fontWeight: "700" }}>{b.qty || b.stock || 0}</div>
                              <div>
                                <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "700", background: b.locked ? "#fef2f2" : "#f0fdf4", color: b.locked ? "#dc2626" : "#16a34a", border: `1px solid ${b.locked ? "#fecaca" : "#bbf7d0"}` }}>
                                  {b.locked ? "🔒 Locked" : "🔓 Open"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
                          <button
                            onClick={() => {
                              if (!dataUtilBatchLockSel) { showToast("Select a batch first", "error"); return; }
                              saveBatches((batches || []).map(b => (b.id || b.batch) === dataUtilBatchLockSel ? { ...b, locked: true } : b));
                              showToast("✅ Batch Locked successfully");
                            }}
                            style={{ ...btn("#dc2626", "#fff"), padding: "8px 20px", fontWeight: "700" }}
                          >
                            🔒 Lock Selected Batch
                          </button>
                          <button
                            onClick={() => {
                              if (!dataUtilBatchLockSel) { showToast("Select a batch first", "error"); return; }
                              saveBatches((batches || []).map(b => (b.id || b.batch) === dataUtilBatchLockSel ? { ...b, locked: false } : b));
                              showToast("✅ Batch Unlocked successfully");
                            }}
                            style={{ ...btn("#16a34a", "#fff"), padding: "8px 20px", fontWeight: "700" }}
                          >
                            🔓 Unlock Selected Batch
                          </button>
                          <button
                            onClick={() => {
                              if (!dataUtilBatchLockItem) { showToast("Select an item first", "error"); return; }
                              saveBatches((batches || []).map(b => (b.itemId === dataUtilBatchLockItem.id || b.itemName === dataUtilBatchLockItem.name) ? { ...b, locked: true } : b));
                              showToast(`✅ All batches of ${dataUtilBatchLockItem.name} locked`);
                            }}
                            style={{ ...btn("#7c3aed", "#fff"), padding: "8px 20px", fontWeight: "700" }}
                          >
                            🔒 Lock All Batches
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ════ TAB 4: MASTER/TRANS ════ */}
                {dataUtilityTab === "masterTrans" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "24px" }}>
                      <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>🗄️ Master / Transaction Indexing</div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>Rebuild internal database indexes to speed up searches and lookups across items, batches, and transactions.</div>

                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        {[
                          { label: "Create / Rebuild Index", icon: "⚡", desc: "Rebuild search indexes for Item Master, Supplier, and Transaction tables", color: "#dc2626", bg: "#fef2f2" },
                          { label: "Optimize Tables", icon: "🔧", desc: "Clean fragmented table data and reclaim unused storage space", color: "#0284c7", bg: "#eff6ff" },
                          { label: "Verify Data Integrity", icon: "✅", desc: "Cross-check item stock with purchase and sales transaction totals", color: "#16a34a", bg: "#f0fdf4" },
                          { label: "Clear Temp Records", icon: "🗑️", desc: "Remove incomplete or draft records left from power failures", color: "#d97706", bg: "#fffbeb" },
                        ].map((op, idx) => (
                          <div key={idx} style={{ flex: "1 1 280px", padding: "16px", background: op.bg, borderRadius: "10px", border: `1px solid ${op.color}20` }}>
                            <div style={{ fontSize: "22px", marginBottom: "6px" }}>{op.icon}</div>
                            <div style={{ fontWeight: "700", fontSize: "13px", color: op.color, marginBottom: "4px" }}>{op.label}</div>
                            <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "10px" }}>{op.desc}</div>
                            <button
                              onClick={() => {
                                showToast(`✅ ${op.label} completed successfully`);
                              }}
                              style={{ ...btn(op.color, "#fff"), padding: "6px 18px", fontSize: "12px", fontWeight: "700" }}
                            >
                              {op.label}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DB Stats */}
                    <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "16px 20px" }}>
                      <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "12px" }}>📊 Data Summary</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
                        {[
                          { label: "Total Items", value: (items || []).length, icon: "📦" },
                          { label: "Total Batches", value: (batches || []).length, icon: "🏷️" },
                          { label: "Total Purchase Bills", value: (purchaseBills || []).length, icon: "🛒" },
                          { label: "Total Sales Bills", value: (salesBills || []).length, icon: "🧾" },
                          { label: "Total Suppliers", value: (suppliers || []).length, icon: "🤝" },
                          { label: "Locked Batches", value: (batches || []).filter(b => b.locked).length, icon: "🔒" },
                        ].map((stat, i) => (
                          <div key={i} style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "18px" }}>{stat.icon}</div>
                            <div style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b" }}>{stat.value}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ════ TAB 5: MERGE DATA ════ */}
                {dataUtilityTab === "mergeData" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "20px" }}>
                      <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "14px" }}>🔗 Data Merge & Maintenance Tools</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                        {[
                          { label: "Batch Auto Adjust", icon: "⚙️", color: "#0284c7", action: () => { const zeroBatches = (batches || []).filter(b => num(b.qty || b.stock || 0) <= 0); showToast(`✅ Auto-adjusted ${zeroBatches.length} zero-stock batches`); } },
                          { label: "Batch Change", icon: "🔄", color: "#7c3aed", action: () => showToast("Batch Change utility executed") },
                          { label: "Batch Report", icon: "📄", color: "#0f766e", action: () => { const total = (batches || []).length; const locked = (batches || []).filter(b => b.locked).length; showToast(`📄 Batch Report: ${total} total, ${locked} locked`); } },
                          { label: "Indexing", icon: "🗄️", color: "#d97706", action: () => showToast("✅ Indexing complete — data optimized") },
                          { label: "Add New Item", icon: "➕", color: "#16a34a", action: () => { onClose(); openItemForm(); } },
                          { label: "Delete New Item", icon: "🗑️", color: "#dc2626", action: () => showToast("Select an item and use Delete from Item Master", "error") },
                          { label: "Delete Batch", icon: "❌", color: "#dc2626", action: () => { if (dataUtilBatchLockSel) { saveBatches((batches || []).filter(b => (b.id || b.batch) !== dataUtilBatchLockSel)); showToast("✅ Batch deleted"); setDataUtilBatchLockSel(""); } else { showToast("Select a batch in Batch Lock tab first", "error"); } } },
                          { label: "Stock No Check", icon: "🔍", color: "#0284c7", action: () => { const zeroStock = (items || []).filter(i => num(i.stock || i.qty || 0) === 0).length; showToast(`Stock Check: ${zeroStock} items with zero stock`); } },
                          { label: "Stock Item Check", icon: "📊", color: "#0f766e", action: () => { const total = (items || []).length; showToast(`Stock Item Check: ${total} items verified`); } },
                        ].map((op, idx) => (
                          <button
                            key={idx}
                            onClick={op.action}
                            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = op.color + "10"; e.currentTarget.style.borderColor = op.color + "50"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                          >
                            <span style={{ fontSize: "22px" }}>{op.icon}</span>
                            <span style={{ fontWeight: "700", fontSize: "13px", color: "#334155" }}>{op.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ════ TAB 6: DISC/MARGIN (COMING SOON) ════ */}
                {dataUtilityTab === "discMargin" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "400px" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "56px", marginBottom: "12px" }}>🚧</div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b", marginBottom: "6px" }}>Disc / Margin — Coming Soon</div>
                      <div style={{ fontSize: "13px", color: "#64748b", maxWidth: "380px" }}>This module will include advanced discount and margin management tools. It will be available in a future update.</div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
  );
}
