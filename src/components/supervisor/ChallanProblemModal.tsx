// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useMedicalStore, fmt, num, int, uid, today, inp, lbl, btn } from '../../MedicalStoreContext';

interface ChallanProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChallanProblemModal({ isOpen, onClose }: ChallanProblemModalProps) {
  const {
    savePurchaseBills, showToast, items, purchaseBills, logUserChange, purchaseChallans, savePurchaseChallans
  } = useMedicalStore();

  const [cpActiveTab, setCpActiveTab] = useState("all"); // all | pending | mismatch | orphan | duplicate
  const [cpSearchQuery, setCpSearchQuery] = useState("");
  const [cpFilterSupplier, setCpFilterSupplier] = useState("ALL");
  const [cpDetailModal, setCpDetailModal] = useState(null);
  const [cpActionMsg, setCpActionMsg] = useState(null);


  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (cpDetailModal) {
          setCpDetailModal(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, cpDetailModal]);

  if (!isOpen) return null;

  return (() => {
          const challans = purchaseChallans || [];
          const bills = purchaseBills || [];

          // Group by party + challanNo to detect duplicates
          const dupCountMap = new Map();
          challans.forEach(c => {
            const key = `${(c.partyName || "").trim().toLowerCase()}__${(c.challanNo || c.entryNo || "").trim().toLowerCase()}`;
            dupCountMap.set(key, (dupCountMap.get(key) || 0) + 1);
          });

          // Build diagnostics list
          const auditRows = [];

          challans.forEach((ch, idx) => {
            const key = `${(ch.partyName || "").trim().toLowerCase()}__${(ch.challanNo || ch.entryNo || "").trim().toLowerCase()}`;
            const isDuplicate = (dupCountMap.get(key) || 0) > 1;

            // Find matching bill
            const linkedBill = bills.find(b =>
              (b.supplier && ch.partyName && b.supplier.trim().toLowerCase() === ch.partyName.trim().toLowerCase()) &&
              (b.challanNo === ch.challanNo || b.challanNo === ch.entryNo || b.challanRef === ch.id || b.billNo === ch.challanNo)
            );

            const chQty = (ch.items || []).reduce((sum, it) => sum + (parseInt(it.qty) || 0) + (parseInt(it.freeQty) || 0), 0);
            const bQty = linkedBill ? (linkedBill.items || []).reduce((sum, it) => sum + (parseInt(it.qty) || 0) + (parseInt(it.freeQty) || 0), 0) : 0;
            const diff = linkedBill ? chQty - bQty : chQty;

            let issueType = "CLEAN";
            let issueLabel = "Verified / Invoiced";
            let badgeBg = "#dcfce7";
            let badgeColor = "#15803d";

            if (ch.status === "Cancelled") {
              issueType = "CANCELLED";
              issueLabel = "Cancelled / Void";
              badgeBg = "#f1f5f9";
              badgeColor = "#64748b";
            } else if (isDuplicate) {
              issueType = "DUPLICATE";
              issueLabel = "Duplicate Challan";
              badgeBg = "#fee2e2";
              badgeColor = "#b91c1c";
            } else if (!linkedBill && ch.status !== "Converted") {
              issueType = "PENDING";
              issueLabel = "Unbilled / Pending Bill";
              badgeBg = "#fef3c7";
              badgeColor = "#b45309";
            } else if (linkedBill && diff !== 0) {
              issueType = "MISMATCH";
              issueLabel = `Qty Mismatch (${diff > 0 ? `+${diff}` : diff})`;
              badgeBg = "#fee2e2";
              badgeColor = "#dc2626";
            }

            auditRows.push({
              id: ch.id || `ch-${idx}`,
              rawChallan: ch,
              entryNo: ch.entryNo || (idx + 1),
              challanNo: ch.challanNo || ch.entryNo || `CH-${idx + 1}`,
              challanDate: ch.challanDate || ch.entryDate || today(),
              partyName: ch.partyName || "Unknown Supplier",
              items: ch.items || [],
              itemCount: (ch.items || []).length,
              itemSummary: (ch.items || []).map(i => i.itemName || i.name).filter(Boolean).slice(0, 2).join(", ") + ((ch.items || []).length > 2 ? ` + ${ch.items.length - 2} more` : ""),
              challanQty: chQty,
              billedQty: linkedBill ? bQty : 0,
              diffQty: diff,
              amount: parseFloat(ch.total || ch.subtotal || 0),
              linkedBillNo: linkedBill ? linkedBill.billNo : null,
              status: ch.status || "Pending",
              issueType,
              issueLabel,
              badgeBg,
              badgeColor
            });
          });

          // Also check for orphan bills (bills having a challanNo that doesn't exist in challans)
          bills.forEach((b, bIdx) => {
            if (b.challanNo && b.challanNo.toString().trim() !== "") {
              const exists = challans.some(c =>
                (c.challanNo && c.challanNo.toString().trim() === b.challanNo.toString().trim()) ||
                (c.entryNo && c.entryNo.toString().trim() === b.challanNo.toString().trim())
              );
              if (!exists) {
                const bQty = (b.items || []).reduce((sum, it) => sum + (parseInt(it.qty) || 0), 0);
                auditRows.push({
                  id: `orphan-${b.id || bIdx}`,
                  rawBill: b,
                  entryNo: b.billNo || (bIdx + 1),
                  challanNo: b.challanNo,
                  challanDate: b.billDate || today(),
                  partyName: b.supplier || "Unknown Supplier",
                  items: b.items || [],
                  itemCount: (b.items || []).length,
                  itemSummary: (b.items || []).map(i => i.itemName || i.name).slice(0, 2).join(", "),
                  challanQty: 0,
                  billedQty: bQty,
                  diffQty: -bQty,
                  amount: parseFloat(b.totalAmount || 0),
                  linkedBillNo: b.billNo,
                  status: "Orphan",
                  issueType: "ORPHAN",
                  issueLabel: "Missing Challan Reference",
                  badgeBg: "#ede9fe",
                  badgeColor: "#7c3aed"
                });
              }
            }
          });

          // Metrics calculation
          const totalChallansCount = challans.length;
          const pendingUnbilledCount = auditRows.filter(r => r.issueType === "PENDING").length;
          const mismatchCount = auditRows.filter(r => r.issueType === "MISMATCH").length;
          const duplicateCount = auditRows.filter(r => r.issueType === "DUPLICATE").length;
          const orphanCount = auditRows.filter(r => r.issueType === "ORPHAN").length;
          const totalPendingAmount = auditRows.filter(r => r.issueType === "PENDING").reduce((sum, r) => sum + r.amount, 0);

          // Filtering
          const filteredRows = auditRows.filter(row => {
            // Tab filter
            if (cpActiveTab === "pending" && row.issueType !== "PENDING") return false;
            if (cpActiveTab === "mismatch" && row.issueType !== "MISMATCH") return false;
            if (cpActiveTab === "orphan" && row.issueType !== "ORPHAN") return false;
            if (cpActiveTab === "duplicate" && row.issueType !== "DUPLICATE") return false;
            if (cpActiveTab === "all" && row.issueType === "CLEAN" && auditRows.length > 5) {
              // in 'all issues' show rows that need supervisor attention first
            }

            // Supplier filter
            if (cpFilterSupplier !== "ALL" && row.partyName !== cpFilterSupplier) return false;

            // Search query
            if (cpSearchQuery.trim()) {
              const q = cpSearchQuery.toLowerCase();
              const mChallan = String(row.challanNo).toLowerCase().includes(q);
              const mSupplier = String(row.partyName).toLowerCase().includes(q);
              const mItems = String(row.itemSummary).toLowerCase().includes(q);
              const mBill = row.linkedBillNo ? String(row.linkedBillNo).toLowerCase().includes(q) : false;
              if (!mChallan && !mSupplier && !mItems && !mBill) return false;
            }

            return true;
          });

          // Suppliers list for dropdown
          const uniqueSuppliers = Array.from(new Set(auditRows.map(r => r.partyName).filter(Boolean))).sort();

          // Handler: 1-Click Convert to Purchase Bill
          const handleConvertToPurchaseBill = async (row) => {
            if (!row.rawChallan) {
              showToast("Cannot convert orphan record without original challan data.", "error");
              return;
            }

            const ch = row.rawChallan;
            const newBillNo = `PB-${Date.now().toString().slice(-6)}`;
            const validItems = (ch.items || []).map(it => ({
              ...it,
              qty: it.qty || "1",
              freeQty: it.freeQty || "0",
              ptr: it.ptr || "0",
              mrp: it.mrp || "0",
              gst: it.gst || "5",
              disc: it.disc || "0"
            }));

            const newBill = {
              id: uid(),
              billNo: newBillNo,
              billDate: today(),
              entryDate: today(),
              supplier: ch.partyName || row.partyName,
              challanNo: ch.challanNo || ch.entryNo || row.challanNo,
              items: validItems,
              subtotal: ch.subtotal || row.amount,
              totalAmount: ch.total || row.amount,
              taxType: ch.taxType || "exclusive",
              paymentMode: ch.paymentMode || "credit",
              taxZone: ch.taxZone || "sgst_ugst",
              status: "Active",
              createdAt: new Date().toISOString()
            };

            const updatedBills = [...purchaseBills, newBill];
            savePurchaseBills(updatedBills);
            save("store_purchaseBills", updatedBills);

            const updatedChallans = purchaseChallans.map(c =>
              (c.id === ch.id || c.entryNo === ch.entryNo) ? { ...c, status: "Converted", convertedBillNo: newBillNo } : c
            );
            await savePurchaseChallans(updatedChallans);
            save("store_purchaseChallans", updatedChallans);

            if (typeof logUserChange === "function") {
              logUserChange("CHALLAN_PROBLEM_RESOLVED", "Challan Problem", {
                action: "CONVERT_TO_PURCHASE_BILL",
                challanNo: row.challanNo,
                createdBillNo: newBillNo,
                supplier: row.partyName,
                amount: row.amount
              });
            }

            setCpActionMsg(`✅ Challan ${row.challanNo} converted to Purchase Bill #${newBillNo}!`);
            showToast(`Challan converted to Purchase Bill #${newBillNo}`, "success");
          };

          // Handler: Cancel / Void Challan
          const handleVoidChallan = async (row) => {
            if (!window.confirm(`Are you sure you want to void / cancel Challan ${row.challanNo} from ${row.partyName}?`)) return;

            const updatedChallans = purchaseChallans.map(c =>
              (c.id === row.rawChallan?.id || c.entryNo === row.rawChallan?.entryNo) ? { ...c, status: "Cancelled" } : c
            );
            await savePurchaseChallans(updatedChallans);
            save("store_purchaseChallans", updatedChallans);

            if (typeof logUserChange === "function") {
              logUserChange("CHALLAN_PROBLEM_RESOLVED", "Challan Problem", {
                action: "CANCEL_VOID_CHALLAN",
                challanNo: row.challanNo,
                supplier: row.partyName
              });
            }

            setCpActionMsg(`⚠️ Challan ${row.challanNo} has been marked as Void / Cancelled.`);
            showToast(`Challan ${row.challanNo} cancelled`, "info");
          };

          // Handler: Export CSV Report
          const exportAuditCSV = () => {
            if (!filteredRows.length) {
              showToast("No records to export.", "error");
              return;
            }
            const headers = ["SrNo", "ChallanNo", "Date", "Supplier", "ChallanQty", "BilledQty", "Difference", "Amount", "Status", "IssueType", "LinkedBillNo"];
            const rows = filteredRows.map((r, i) => [
              i + 1,
              `"${r.challanNo}"`,
              r.challanDate,
              `"${r.partyName}"`,
              r.challanQty,
              r.billedQty,
              r.diffQty,
              r.amount.toFixed(2),
              r.status,
              r.issueLabel,
              r.linkedBillNo || "None"
            ]);
            const csv = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Challan_Problem_Audit_${today()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("Challan audit report downloaded as CSV", "success");
          };

          // Handler: Print Audit Report HTML
          const printAuditReport = () => {
            const printWin = window.open("", "_blank", "width=900,height=650");
            if (!printWin) return;
            const rowsHtml = filteredRows.map((r, idx) => `
              <tr>
                <td style="border:1px solid #ccc;padding:6px;text-align:center;">${idx + 1}</td>
                <td style="border:1px solid #ccc;padding:6px;font-weight:bold;">${r.challanNo}</td>
                <td style="border:1px solid #ccc;padding:6px;">${r.challanDate}</td>
                <td style="border:1px solid #ccc;padding:6px;">${r.partyName}</td>
                <td style="border:1px solid #ccc;padding:6px;">${r.itemSummary}</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:right;">${r.challanQty}</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:right;">${r.billedQty}</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:right;font-weight:bold;color:${r.diffQty !== 0 ? '#b91c1c' : '#15803d'};">${r.diffQty > 0 ? `+${r.diffQty}` : r.diffQty}</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:right;font-weight:bold;">₹${r.amount.toFixed(2)}</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:center;">${r.issueLabel}</td>
                <td style="border:1px solid #ccc;padding:6px;text-align:center;">${r.linkedBillNo || '—'}</td>
              </tr>
            `).join("");

            printWin.document.write(`
              <html>
                <head>
                  <title>Challan Problem Audit Report — Shivdhara Medical Store</title>
                  <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #1e293b; }
                    h2 { margin: 0 0 4px 0; color: #0f172a; }
                    .meta { color: #64748b; font-size: 11px; margin-bottom: 16px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { background: #0f172a; color: #ffffff; padding: 8px; border: 1px solid #0f172a; font-size: 11px; }
                  </style>
                </head>
                <body>
                  <h2>SHIVDHARA MEDICAL STORE — CHALLAN AUDIT & PROBLEM REPORT</h2>
                  <div class="meta">Generated on: ${new Date().toLocaleString("en-IN")} | Supervisor Reconciliation Center</div>
                  <table>
                    <thead>
                      <tr>
                        <th>Sr</th>
                        <th>Challan No</th>
                        <th>Date</th>
                        <th>Supplier Name</th>
                        <th>Items</th>
                        <th>Challan Qty</th>
                        <th>Billed Qty</th>
                        <th>Variance</th>
                        <th>Amount</th>
                        <th>Issue Flag</th>
                        <th>Bill Ref</th>
                      </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                  </table>
                  <script>window.onload = function() { window.print(); };</script>
                </body>
              </html>
            `);
            printWin.document.close();
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
              {/* Header Bar */}
              <div style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                padding: "14px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #334155",
                boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                flexShrink: 0
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #0d9488, #0f766e)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    boxShadow: "0 2px 8px rgba(13,148,136,0.3)"
                  }}>
                    🚚
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "17px", fontWeight: "700", letterSpacing: "0.4px" }}>
                        CHALLAN PROBLEM — AUDIT & RECONCILIATION MANAGER
                      </span>
                      <span style={{
                        background: "rgba(13,148,136,0.25)",
                        color: "#2dd4bf",
                        border: "1px solid rgba(45,212,191,0.4)",
                        borderRadius: "6px",
                        padding: "2px 8px",
                        fontSize: "11px",
                        fontWeight: "700"
                      }}>
                        SUPERVISOR SYSTEM
                      </span>
                      {pendingUnbilledCount > 0 && (
                        <span style={{
                          background: "rgba(245,158,11,0.2)",
                          color: "#fbbf24",
                          border: "1px solid rgba(251,191,36,0.4)",
                          borderRadius: "6px",
                          padding: "2px 8px",
                          fontSize: "11px",
                          fontWeight: "700"
                        }}>
                          {pendingUnbilledCount} UNBILLED PENDING
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>
                      Identify unbilled inward delivery notes, resolve quantity mismatches, and reconcile purchase invoice discrepancies
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    onClick={exportAuditCSV}
                    style={{
                      background: "#1e293b",
                      color: "#e2e8f0",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      padding: "7px 14px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#334155"}
                    onMouseLeave={e => e.currentTarget.style.background = "#1e293b"}
                  >
                    📊 Export CSV
                  </button>

                  <button
                    onClick={printAuditReport}
                    style={{
                      background: "#1e293b",
                      color: "#e2e8f0",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      padding: "7px 14px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#334155"}
                    onMouseLeave={e => e.currentTarget.style.background = "#1e293b"}
                  >
                    🖨️ Print Report
                  </button>

                  <button
                    onClick={() => { onClose(); setCpDetailModal(null); setCpActionMsg(null); }}
                    style={{
                      background: "#334155",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "7px 14px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#475569"}
                    onMouseLeave={e => e.currentTarget.style.background = "#334155"}
                  >
                    ✕ Close (ESC)
                  </button>
                </div>
              </div>

              {/* KPI Summary Banner */}
              <div style={{
                background: "#ffffff",
                borderBottom: "1px solid #e2e8f0",
                padding: "14px 24px",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
                flexShrink: 0
              }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Total Challans Active</div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{totalChallansCount}</div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Recorded in store database</div>
                </div>

                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#b45309", textTransform: "uppercase" }}>Pending Unbilled Challans</div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#b45309", marginTop: "4px" }}>{pendingUnbilledCount}</div>
                  <div style={{ fontSize: "11px", color: "#92400e", marginTop: "2px" }}>Awaiting purchase bill conversion</div>
                </div>

                <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#b91c1c", textTransform: "uppercase" }}>Quantity & Ref Discrepancies</div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#b91c1c", marginTop: "4px" }}>{mismatchCount + duplicateCount + orphanCount}</div>
                  <div style={{ fontSize: "11px", color: "#991b1b", marginTop: "2px" }}>{mismatchCount} qty mismatches • {duplicateCount} duplicates</div>
                </div>

                <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: "10px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#0d9488", textTransform: "uppercase" }}>Pending Inward Valuation</div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#0d9488", marginTop: "4px" }}>₹{totalPendingAmount.toFixed(2)}</div>
                  <div style={{ fontSize: "11px", color: "#0f766e", marginTop: "2px" }}>Estimated stock value on pending notes</div>
                </div>
              </div>

              {/* Action Banner / Notification if any */}
              {cpActionMsg && (
                <div style={{
                  background: "#dcfce7",
                  borderBottom: "1px solid #86efac",
                  padding: "8px 24px",
                  color: "#15803d",
                  fontSize: "12px",
                  fontWeight: "600",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span>{cpActionMsg}</span>
                  <button onClick={() => setCpActionMsg(null)} style={{ background: "transparent", border: "none", color: "#15803d", cursor: "pointer", fontWeight: "700" }}>✕</button>
                </div>
              )}

              {/* Controls & Filter Bar */}
              <div style={{
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                padding: "12px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0
              }}>
                {/* Filter Tabs */}
                <div style={{ display: "flex", gap: "6px" }}>
                  {[
                    { id: "all", label: "🚨 All Issues & Records", count: auditRows.length },
                    { id: "pending", label: "⏳ Pending Unbilled", count: pendingUnbilledCount },
                    { id: "mismatch", label: "📉 Qty Mismatch", count: mismatchCount },
                    { id: "orphan", label: "🔗 Orphan Ref", count: orphanCount },
                    { id: "duplicate", label: "🔄 Duplicate", count: duplicateCount },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCpActiveTab(tab.id)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "8px",
                        border: cpActiveTab === tab.id ? "1.5px solid #0d9488" : "1px solid #cbd5e1",
                        background: cpActiveTab === tab.id ? "#0d9488" : "#ffffff",
                        color: cpActiveTab === tab.id ? "#ffffff" : "#334155",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.15s"
                      }}
                    >
                      <span>{tab.label}</span>
                      <span style={{
                        fontSize: "10px",
                        padding: "1px 6px",
                        borderRadius: "10px",
                        background: cpActiveTab === tab.id ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                        color: cpActiveTab === tab.id ? "#ffffff" : "#475569"
                      }}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search & Supplier Filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Search challan, party, item..."
                      value={cpSearchQuery}
                      onChange={e => setCpSearchQuery(e.target.value)}
                      style={{
                        padding: "7px 12px 7px 30px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        fontSize: "12px",
                        width: "220px",
                        outline: "none"
                      }}
                    />
                    <span style={{ position: "absolute", left: "9px", top: "7px", fontSize: "13px", color: "#94a3b8" }}>🔍</span>
                  </div>

                  <select
                    value={cpFilterSupplier}
                    onChange={e => setCpFilterSupplier(e.target.value)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#334155",
                      outline: "none"
                    }}
                  >
                    <option value="ALL">All Suppliers ({uniqueSuppliers.length})</option>
                    {uniqueSuppliers.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Main Audit Table */}
              <div style={{ flex: 1, overflowY: "auto", background: "#ffffff", padding: "0" }}>
                {filteredRows.length === 0 ? (
                  <div style={{
                    padding: "60px 20px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>No Challan Problems Detected</div>
                    <div style={{ fontSize: "12px", color: "#64748b", maxWidth: "420px", marginTop: "4px" }}>
                      All delivery challans are clean, correctly matched with purchase invoices, or no records match the active filter criteria.
                    </div>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "#0f172a", color: "#ffffff", textAlign: "left", position: "sticky", top: 0, zIndex: 10 }}>
                        <th style={{ padding: "10px 14px", width: "45px" }}>Sr</th>
                        <th style={{ padding: "10px 14px" }}>Challan / Entry No</th>
                        <th style={{ padding: "10px 14px" }}>Date</th>
                        <th style={{ padding: "10px 14px" }}>Supplier / Party Name</th>
                        <th style={{ padding: "10px 14px" }}>Medicines & Items</th>
                        <th style={{ padding: "10px 14px", textAlign: "right" }}>Challan Qty</th>
                        <th style={{ padding: "10px 14px", textAlign: "right" }}>Billed Qty</th>
                        <th style={{ padding: "10px 14px", textAlign: "right" }}>Variance</th>
                        <th style={{ padding: "10px 14px", textAlign: "right" }}>Amount (₹)</th>
                        <th style={{ padding: "10px 14px", textAlign: "center" }}>Diagnostic Issue</th>
                        <th style={{ padding: "10px 14px", textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row, idx) => (
                        <tr
                          key={row.id}
                          style={{
                            borderBottom: "1px solid #e2e8f0",
                            background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                            transition: "background 0.15s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f0fdfa"}
                          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f8fafc"}
                        >
                          <td style={{ padding: "10px 14px", color: "#64748b", fontWeight: "600" }}>{idx + 1}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ fontWeight: "700", color: "#0f172a" }}>{row.challanNo}</div>
                            <div style={{ fontSize: "10px", color: "#64748b" }}>Entry #{row.entryNo}</div>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#334155", whiteSpace: "nowrap" }}>
                            {row.challanDate}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ fontWeight: "700", color: "#0f172a" }}>{row.partyName}</div>
                            {row.linkedBillNo && (
                              <div style={{ fontSize: "11px", color: "#0d9488", fontWeight: "600" }}>
                                Linked: Bill #{row.linkedBillNo}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "10px 14px", maxWidth: "260px" }}>
                            <div style={{ color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {row.itemSummary || "No items listed"}
                            </div>
                            <div style={{ fontSize: "10px", color: "#64748b" }}>
                              {row.itemCount} items listed
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>
                            {row.challanQty}
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600", color: "#475569" }}>
                            {row.billedQty}
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "800" }}>
                            <span style={{
                              color: row.diffQty > 0 ? "#b45309" : row.diffQty < 0 ? "#dc2626" : "#15803d"
                            }}>
                              {row.diffQty > 0 ? `+${row.diffQty}` : row.diffQty}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>
                            ₹{row.amount.toFixed(2)}
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "center" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "3px 10px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700",
                              background: row.badgeBg,
                              color: row.badgeColor
                            }}>
                              {row.issueLabel}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                              {row.issueType === "PENDING" && (
                                <button
                                  onClick={() => handleConvertToPurchaseBill(row)}
                                  title="Convert Challan directly to Purchase Bill"
                                  style={{
                                    background: "#0d9488",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "4px 10px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap"
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#0f766e"}
                                  onMouseLeave={e => e.currentTarget.style.background = "#0d9488"}
                                >
                                  📥 Convert to Bill
                                </button>
                              )}

                              <button
                                onClick={() => setCpDetailModal(row)}
                                title="View detailed item lines"
                                style={{
                                  background: "#f1f5f9",
                                  color: "#334155",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "6px",
                                  padding: "4px 8px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  cursor: "pointer"
                                }}
                              >
                                👁️ View
                              </button>

                              {row.status !== "Cancelled" && row.issueType !== "ORPHAN" && (
                                <button
                                  onClick={() => handleVoidChallan(row)}
                                  title="Cancel/Void Challan"
                                  style={{
                                    background: "#fee2e2",
                                    color: "#b91c1c",
                                    border: "1px solid #fecaca",
                                    borderRadius: "6px",
                                    padding: "4px 8px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                  }}
                                >
                                  ❌
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Detail Inspection Modal */}
              {cpDetailModal && (
                <div style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(15,23,42,0.65)",
                  backdropFilter: "blur(4px)",
                  zIndex: 10005,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px"
                }}>
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    width: "750px",
                    maxWidth: "95vw",
                    maxHeight: "85vh",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                    overflow: "hidden"
                  }}>
                    {/* Modal Header */}
                    <div style={{
                      background: "#0f172a",
                      color: "#ffffff",
                      padding: "14px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: "700" }}>
                          Challan Details: #{cpDetailModal.challanNo}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                          Supplier: {cpDetailModal.partyName} • Date: {cpDetailModal.challanDate}
                        </div>
                      </div>
                      <button
                        onClick={() => setCpDetailModal(null)}
                        style={{ background: "#334155", border: "none", color: "#ffffff", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
                        <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Total Quantity</div>
                          <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>{cpDetailModal.challanQty} units</div>
                        </div>
                        <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Challan Valuation</div>
                          <div style={{ fontSize: "16px", fontWeight: "800", color: "#0d9488" }}>₹{cpDetailModal.amount.toFixed(2)}</div>
                        </div>
                        <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Diagnostic Flag</div>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: cpDetailModal.badgeColor, marginTop: "2px" }}>
                            {cpDetailModal.issueLabel}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                        Item Line Details ({(cpDetailModal.items || []).length} items)
                      </div>

                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                            <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>Item Name</th>
                            <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>Batch</th>
                            <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>Expiry</th>
                            <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0", textAlign: "right" }}>Qty</th>
                            <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0", textAlign: "right" }}>Free</th>
                            <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0", textAlign: "right" }}>PTR (₹)</th>
                            <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0", textAlign: "right" }}>MRP (₹)</th>
                            <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0", textAlign: "right" }}>Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(cpDetailModal.items || []).map((it, iIdx) => (
                            <tr key={iIdx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                              <td style={{ padding: "8px 10px", fontWeight: "600" }}>{it.itemName || it.name || "Item"}</td>
                              <td style={{ padding: "8px 10px", color: "#64748b" }}>{it.batchNo || "—"}</td>
                              <td style={{ padding: "8px 10px", color: "#64748b" }}>{it.expiryDate || "—"}</td>
                              <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700" }}>{it.qty || 1}</td>
                              <td style={{ padding: "8px 10px", textAlign: "right", color: "#64748b" }}>{it.freeQty || 0}</td>
                              <td style={{ padding: "8px 10px", textAlign: "right" }}>{parseFloat(it.ptr || 0).toFixed(2)}</td>
                              <td style={{ padding: "8px 10px", textAlign: "right" }}>{parseFloat(it.mrp || 0).toFixed(2)}</td>
                              <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700" }}>
                                ₹{parseFloat(it.amount || ((parseInt(it.qty) || 1) * (parseFloat(it.ptr) || 0))).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Modal Footer */}
                    <div style={{
                      background: "#f8fafc",
                      borderTop: "1px solid #e2e8f0",
                      padding: "12px 20px",
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "10px"
                    }}>
                      {cpDetailModal.issueType === "PENDING" && (
                        <button
                          onClick={() => {
                            const m = cpDetailModal;
                            setCpDetailModal(null);
                            handleConvertToPurchaseBill(m);
                          }}
                          style={{
                            background: "#0d9488",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 14px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                        >
                          📥 Convert to Purchase Bill Now
                        </button>
                      )}
                      <button
                        onClick={() => setCpDetailModal(null)}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          borderRadius: "6px",
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
  })();
}
