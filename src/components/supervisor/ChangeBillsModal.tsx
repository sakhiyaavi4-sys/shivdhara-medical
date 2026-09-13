// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Search, Edit2, Eye, X, Check, CheckCircle, AlertCircle, FileText, Printer } from 'lucide-react';
import { useMedicalStore, fmt, num, int, uid, today, inp, lbl, btn } from '../../MedicalStoreContext';

interface ChangeBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangeBillsModal({ isOpen, onClose }: ChangeBillsModalProps) {
  const {
    saveSalesBills, items, salesBills, customers, logUserChange
  } = useMedicalStore();

  const [cbFromDate, setCbFromDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [cbToDate, setCbToDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [cbSearchQuery, setCbSearchQuery] = useState("");
  const [cbFilterType, setCbFilterType] = useState("ALL"); // ALL | Cash | Credit | UPI | Card
  const [cbFilterYN, setCbFilterYN] = useState("ALL"); // ALL | Y | N
  const [cbDetailModal, setCbDetailModal] = useState<any>(null);
  const [cbEditModal, setCbEditModal] = useState<any>(null);
  const [cbEditForm, setCbEditForm] = useState<{ payMode: string; patientName: string; doctorName: string; remarks: string; yn: string }>({
    payMode: "Cash",
    patientName: "",
    doctorName: "",
    remarks: "",
    yn: "N"
  });
  const [cbActionMsg, setCbActionMsg] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);


  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (cbEditModal) {
          setCbEditModal(null);
        } else if (cbDetailModal) {
          setCbDetailModal(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, cbDetailModal, cbEditModal]);

  if (!isOpen) return null;

  return (() => {
          // Normalize and filter sales bills
          const allBills = (salesBills || []).map((b: any, index: number) => {
            const billTotal = Number(b.total || b.netAmount || b.grandTotal || 0);
            const billBase = Number(b.taxableAmount || b.baseAmount || b.subTotal || (billTotal > 0 ? (billTotal / 1.12).toFixed(2) : 0));
            const billGst = Number(b.taxAmount || b.gstAmount || b.vatAmount || (billTotal > 0 ? (billTotal - billBase).toFixed(2) : 0));
            const billAdTax = Number(b.adTax || b.cess || b.roundOff || 0);
            const billDate = b.date || (b.createdAt ? String(b.createdAt).slice(0, 10) : today());
            const billType = b.payMode || b.paymentMode || b.type || (b.isCredit ? 'Credit' : 'Cash');
            const billYN = b.isAudited || b.yn === 'Y' || b.hasChanged ? 'Y' : 'N';
            const billRT = b.isTaxInvoice || b.invoiceType === 'tax' ? 'T' : 'R';
            return {
              ...b,
              _srNo: index + 1,
              _billNo: String(b.billNo || b.invoiceNo || b.id || index + 1),
              _date: billDate,
              _type: billType,
              _customerName: b.patientName || b.customerName || b.partyName || 'Walk-in Customer',
              _doctorName: b.doctorName || b.doctor || '-',
              _base: billBase,
              _gst: billGst,
              _adTax: billAdTax,
              _amount: billTotal,
              _yn: billYN,
              _rt: billRT
            };
          });

          // Apply filters: Date range, Search query, Payment Type, Y/N status
          const filteredBills = allBills.filter((b: any) => {
            if (cbFromDate && b._date < cbFromDate) return false;
            if (cbToDate && b._date > cbToDate) return false;

            if (cbFilterType !== "ALL") {
              if (cbFilterType === "Cash" && !/cash/i.test(b._type)) return false;
              if (cbFilterType === "Credit" && !/credit/i.test(b._type)) return false;
              if (cbFilterType === "UPI" && !/upi|online|gpay|paytm/i.test(b._type)) return false;
              if (cbFilterType === "Card" && !/card/i.test(b._type)) return false;
            }

            if (cbFilterYN !== "ALL") {
              if (b._yn !== cbFilterYN) return false;
            }

            if (cbSearchQuery.trim()) {
              const q = cbSearchQuery.toLowerCase();
              const matchNo = b._billNo.toLowerCase().includes(q);
              const matchCust = b._customerName.toLowerCase().includes(q);
              const matchDoc = b._doctorName.toLowerCase().includes(q);
              const matchMobile = String(b.mobile || b.phone || '').includes(q);
              if (!matchNo && !matchCust && !matchDoc && !matchMobile) return false;
            }

            return true;
          });

          // Aggregate Metrics
          const totalBillsCount = filteredBills.length;
          const totalBaseAmt = filteredBills.reduce((acc: number, b: any) => acc + (b._base || 0), 0);
          const totalGstAmt = filteredBills.reduce((acc: number, b: any) => acc + (b._gst || 0), 0);
          const totalNetAmt = filteredBills.reduce((acc: number, b: any) => acc + (b._amount || 0), 0);
          const totalAuditedCount = filteredBills.filter((b: any) => b._yn === 'Y').length;

          // Toggle Y/N Audit Flag
          const handleToggleYN = (bill: any) => {
            const nextYN = bill._yn === 'Y' ? 'N' : 'Y';
            const updated = (salesBills || []).map((sb: any) => {
              if (sb.id === bill.id || String(sb.billNo) === bill._billNo) {
                return { ...sb, yn: nextYN, isAudited: nextYN === 'Y', hasChanged: true, auditDate: new Date().toISOString() };
              }
              return sb;
            });
            saveSalesBills(updated);
            if (typeof logUserChange === 'function') {
              logUserChange('BILL_AUDIT_TOGGLE', { billNo: bill._billNo, oldStatus: bill._yn, newStatus: nextYN, amount: bill._amount }, `Toggled Audit status to ${nextYN} for Bill #${bill._billNo}`);
            }
            setCbActionMsg({ type: "success", msg: `Bill #${bill._billNo} status updated to "${nextYN}" successfully.` });
            setTimeout(() => setCbActionMsg(null), 3500);
          };

          // Open Quick Edit
          const handleOpenEdit = (bill: any) => {
            setCbEditModal(bill);
            setCbEditForm({
              payMode: bill._type || "Cash",
              patientName: bill._customerName === 'Walk-in Customer' ? '' : bill._customerName,
              doctorName: bill._doctorName === '-' ? '' : bill._doctorName,
              remarks: bill.remarks || bill.changeReason || "",
              yn: bill._yn || "N"
            });
          };

          // Save Quick Edit
          const handleSaveQuickEdit = () => {
            if (!cbEditModal) return;
            const targetBill = cbEditModal;
            const updated = (salesBills || []).map((sb: any) => {
              if (sb.id === targetBill.id || String(sb.billNo) === targetBill._billNo) {
                return {
                  ...sb,
                  payMode: cbEditForm.payMode,
                  paymentMode: cbEditForm.payMode,
                  patientName: cbEditForm.patientName || "Walk-in Customer",
                  customerName: cbEditForm.patientName || "Walk-in Customer",
                  doctorName: cbEditForm.doctorName || "",
                  doctor: cbEditForm.doctorName || "",
                  remarks: cbEditForm.remarks,
                  changeReason: cbEditForm.remarks,
                  yn: cbEditForm.yn,
                  isAudited: cbEditForm.yn === 'Y',
                  hasChanged: true,
                  lastModifiedBy: currentUser?.username || "ADMIN",
                  lastModifiedAt: new Date().toISOString()
                };
              }
              return sb;
            });

            saveSalesBills(updated);
            if (typeof logUserChange === 'function') {
              logUserChange('SUPERVISOR_CHANGE_BILL', {
                billNo: targetBill._billNo,
                oldPayMode: targetBill._type,
                newPayMode: cbEditForm.payMode,
                oldCustomer: targetBill._customerName,
                newCustomer: cbEditForm.patientName || "Walk-in Customer",
                reason: cbEditForm.remarks
              }, `Supervisor changed Bill #${targetBill._billNo} details`);
            }

            setCbActionMsg({ type: "success", msg: `Bill #${targetBill._billNo} has been modified successfully!` });
            setTimeout(() => setCbActionMsg(null), 4000);
            setCbEditModal(null);
          };

          // Export CSV
          const handleExportCSV = () => {
            try {
              const headers = ["SrNo", "Bill No", "R/T", "Date", "Type", "Customer Name", "Doctor", "Base Amount", "GST Amount", "Additional Tax", "Net Amount", "Audited Y/N"];
              const rows = filteredBills.map((b: any, idx: number) => [
                idx + 1,
                `"${b._billNo}"`,
                b._rt,
                b._date,
                `"${b._type}"`,
                `"${b._customerName.replace(/"/g, '""')}"`,
                `"${b._doctorName.replace(/"/g, '""')}"`,
                b._base.toFixed(2),
                b._gst.toFixed(2),
                b._adTax.toFixed(2),
                b._amount.toFixed(2),
                b._yn
              ]);

              const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `Sales_Change_Bills_Register_${cbFromDate}_to_${cbToDate}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (err: any) {
              alert("Failed to export CSV: " + (err?.message || "Unknown error"));
            }
          };

          // Print Register
          const handlePrintRegister = () => {
            const printWindow = window.open("", "_blank");
            if (!printWindow) {
              alert("Please allow popups to print report.");
              return;
            }

            const html = `
              <!DOCTYPE html>
              <html>
              <head>
                <title>Sales Bill Change & Audit Register</title>
                <style>
                  body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; color: #111; }
                  .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 8px; }
                  .title { font-size: 18px; font-weight: bold; }
                  .subtitle { font-size: 12px; color: #444; margin-top: 4px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                  th, td { border: 1px solid #999; padding: 5px 7px; text-align: left; }
                  th { background: #f0f0f0; font-weight: bold; }
                  .text-right { text-align: right; }
                  .text-center { text-align: center; }
                  .footer { margin-top: 20px; display: flex; justify-content: space-between; font-weight: bold; }
                </style>
              </head>
              <body>
                <div class="header">
                  <div class="title">SHIVDHARA MEDICAL STORE</div>
                  <div class="subtitle">Sales Bill Change / Audit Register (Period: ${cbFromDate} to ${cbToDate})</div>
                  <div class="subtitle">Printed on: ${new Date().toLocaleString()} | Filter: ${cbFilterType} | Audited Status: ${cbFilterYN}</div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th class="text-center">Sr</th>
                      <th>Bill No</th>
                      <th class="text-center">R/T</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Customer Name</th>
                      <th class="text-right">Base (₹)</th>
                      <th class="text-right">GST (₹)</th>
                      <th class="text-right">Ad.Tax (₹)</th>
                      <th class="text-right">Amount (₹)</th>
                      <th class="text-center">Y/N</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredBills.map((b: any, i: number) => `
                      <tr>
                        <td class="text-center">${i + 1}</td>
                        <td>${b._billNo}</td>
                        <td class="text-center">${b._rt}</td>
                        <td>${b._date}</td>
                        <td>${b._type}</td>
                        <td>${b._customerName}</td>
                        <td class="text-right">${b._base.toFixed(2)}</td>
                        <td class="text-right">${b._gst.toFixed(2)}</td>
                        <td class="text-right">${b._adTax.toFixed(2)}</td>
                        <td class="text-right"><strong>${b._amount.toFixed(2)}</strong></td>
                        <td class="text-center">${b._yn}</td>
                      </tr>
                    `).join('')}
                    <tr style="background:#e8f4f8; font-weight:bold;">
                      <td colspan="6" class="text-right">TOTALS:</td>
                      <td class="text-right">${totalBaseAmt.toFixed(2)}</td>
                      <td class="text-right">${totalGstAmt.toFixed(2)}</td>
                      <td class="text-right">0.00</td>
                      <td class="text-right">${totalNetAmt.toFixed(2)}</td>
                      <td class="text-center">${totalAuditedCount} Y</td>
                    </tr>
                  </tbody>
                </table>
                <div class="footer">
                  <div>Total Invoices: ${totalBillsCount}</div>
                  <div>Audited Bills: ${totalAuditedCount}</div>
                  <div>Supervisor Signature: ______________________</div>
                </div>
                <script>
                  window.onload = function() { window.print(); };
                </script>
              </body>
              </html>
            `;

            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
          };

          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "#f1f5f9",
                color: "#0f172a",
                display: "flex",
                flexDirection: "column",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              }}
            >
              {/* Top Header Bar (Light / Modern Theme) */}
              <div
                style={{
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  padding: "12px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#ffffff",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  flexShrink: 0
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(59, 130, 246, 0.4)"
                    }}
                  >
                    <FileText size={22} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "17px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.3px" }}>
                        Change Bills / Sales Invoice Audit &amp; Modification Manager
                      </span>
                      <span
                        style={{
                          background: "rgba(59, 130, 246, 0.25)",
                          color: "#93c5fd",
                          border: "1px solid rgba(147, 197, 253, 0.4)",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "700"
                        }}
                      >
                        SUPERVISOR
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                      Audit, verify, edit payment types, customers, or re-open bills in POS with supervisor privileges
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "11px", color: "#cbd5e1", background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: "6px" }}>
                    ESC: Close | Double-click: Quick Edit
                  </span>
                  <button
                    onClick={() => onClose()}
                    style={{
                      background: "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      padding: "7px 16px",
                      borderRadius: "6px",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)"
                    }}
                  >
                    <X size={15} /> Close (ESC)
                  </button>
                </div>
              </div>

              {/* Status Alert Banner */}
              {cbActionMsg && (
                <div
                  style={{
                    padding: "10px 24px",
                    background: cbActionMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
                    borderBottom: `1px solid ${cbActionMsg.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                    color: cbActionMsg.type === "success" ? "#065f46" : "#991b1b",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0
                  }}
                >
                  {cbActionMsg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{cbActionMsg.msg}</span>
                </div>
              )}

              {/* Filter Controls Bar (Light Theme) */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "12px 24px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                  flexShrink: 0,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                }}
              >
                {/* Date Filters & Presets */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>From:</span>
                    <input
                      type="date"
                      value={cbFromDate}
                      onChange={(e) => setCbFromDate(e.target.value)}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        color: "#0f172a",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>To:</span>
                    <input
                      type="date"
                      value={cbToDate}
                      onChange={(e) => setCbToDate(e.target.value)}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        color: "#0f172a",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}
                    />
                  </div>

                  {/* Quick Presets */}
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => {
                        const d = new Date();
                        const t = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        setCbFromDate(t);
                        setCbToDate(t);
                      }}
                      style={{
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        color: "#334155",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        const d = new Date();
                        const f = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
                        const t = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        setCbFromDate(f);
                        setCbToDate(t);
                      }}
                      style={{
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        color: "#334155",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      This Month
                    </button>
                    <button
                      onClick={() => {
                        setCbFromDate("");
                        setCbToDate("");
                      }}
                      style={{
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        color: "#334155",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      All Time
                    </button>
                  </div>

                  {/* Search Query */}
                  <div style={{ position: "relative" }}>
                    <Search size={15} color="#94a3b8" style={{ position: "absolute", left: "9px", top: "8px" }} />
                    <input
                      type="text"
                      placeholder="Search Bill No, Customer, Mobile..."
                      value={cbSearchQuery}
                      onChange={(e) => setCbSearchQuery(e.target.value)}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        color: "#0f172a",
                        padding: "6px 12px 6px 30px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        width: "240px"
                      }}
                    />
                  </div>

                  {/* Payment Type Filter */}
                  <select
                    value={cbFilterType}
                    onChange={(e) => setCbFilterType(e.target.value)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      color: "#0f172a",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    <option value="ALL">All Payment Types</option>
                    <option value="Cash">Cash Bills Only</option>
                    <option value="Credit">Credit Bills Only</option>
                    <option value="UPI">UPI / Online Only</option>
                    <option value="Card">Card Only</option>
                  </select>

                  {/* Y/N Filter */}
                  <select
                    value={cbFilterYN}
                    onChange={(e) => setCbFilterYN(e.target.value)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      color: "#0f172a",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    <option value="ALL">Y/N: All Status</option>
                    <option value="Y">Audited (Y) Only</option>
                    <option value="N">Unaudited (N) Only</option>
                  </select>
                </div>

                {/* Actions: Show, Print, Salereg, File (CSV) */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={() => {
                      setCbActionMsg({ type: "info", msg: "Refreshed sales bills list." });
                      setTimeout(() => setCbActionMsg(null), 2000);
                    }}
                    style={{
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    Show
                  </button>

                  <button
                    onClick={handlePrintRegister}
                    style={{
                      background: "#0284c7",
                      color: "#ffffff",
                      border: "none",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Printer size={13} /> Print
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      setActiveSection("reports");
                      setReportSubTab("sales");
                    }}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      color: "#334155",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    Salereg
                  </button>

                  <button
                    onClick={handleExportCSV}
                    style={{
                      background: "#059669",
                      color: "#ffffff",
                      border: "none",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    File (CSV)
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards (Light Theme) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "14px",
                  padding: "14px 24px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  flexShrink: 0
                }}
              >
                <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Total Bills</div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#2563eb", marginTop: "2px" }}>{totalBillsCount}</div>
                </div>

                <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Taxable Base</div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>₹{totalBaseAmt.toFixed(2)}</div>
                </div>

                <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>GST / Tax</div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#d97706", marginTop: "2px" }}>₹{totalGstAmt.toFixed(2)}</div>
                </div>

                <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Net Revenue (Total)</div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#059669", marginTop: "2px" }}>₹{totalNetAmt.toFixed(2)}</div>
                </div>

                <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Audited Bills (Y)</div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#7c3aed", marginTop: "2px" }}>{totalAuditedCount} / {totalBillsCount}</div>
                </div>
              </div>

              {/* Main Data Table (Light Theme) */}
              <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
                <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                      <tr style={{ background: "#0f172a", color: "#ffffff" }}>
                        <th style={{ padding: "10px 8px", textAlign: "center", width: "45px" }}>SrNo</th>
                        <th style={{ padding: "10px 10px", textAlign: "left", width: "110px" }}>Bill No</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", width: "45px" }}>R/T</th>
                        <th style={{ padding: "10px 10px", textAlign: "left", width: "95px" }}>Date</th>
                        <th style={{ padding: "10px 10px", textAlign: "left", width: "85px" }}>Type</th>
                        <th style={{ padding: "10px 12px", textAlign: "left" }}>Customer Name</th>
                        <th style={{ padding: "10px 10px", textAlign: "right", width: "105px" }}>Base</th>
                        <th style={{ padding: "10px 10px", textAlign: "right", width: "95px" }}>Vat/GST Rs</th>
                        <th style={{ padding: "10px 10px", textAlign: "right", width: "80px" }}>Ad.Tax</th>
                        <th style={{ padding: "10px 12px", textAlign: "right", width: "120px" }}>Amount</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", width: "65px" }}>Y/N</th>
                        <th style={{ padding: "10px 10px", textAlign: "center", width: "180px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.length === 0 ? (
                        <tr>
                          <td colSpan={12} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                            No sales bills found matching the selected period and criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredBills.map((bill: any, idx: number) => {
                          const isAudited = bill._yn === "Y";
                          return (
                            <tr
                              key={bill.id || idx}
                              onDoubleClick={() => handleOpenEdit(bill)}
                              style={{
                                borderBottom: "1px solid #e2e8f0",
                                background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                                transition: "background 0.15s ease"
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f8fafc")}
                            >
                              <td style={{ padding: "9px 8px", textAlign: "center", color: "#64748b", fontWeight: "600" }}>
                                {idx + 1}
                              </td>
                              <td style={{ padding: "9px 10px", fontWeight: "700", color: "#1d4ed8" }}>
                                {bill._billNo}
                              </td>
                              <td style={{ padding: "9px 8px", textAlign: "center" }}>
                                <span
                                  style={{
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontSize: "10px",
                                    fontWeight: "700",
                                    background: bill._rt === "T" ? "#e0e7ff" : "#ccfbf1",
                                    color: bill._rt === "T" ? "#3730a3" : "#0f766e"
                                  }}
                                >
                                  {bill._rt}
                                </span>
                              </td>
                              <td style={{ padding: "9px 10px", color: "#334155" }}>
                                {bill._date}
                              </td>
                              <td style={{ padding: "9px 10px" }}>
                                <span
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    fontSize: "10px",
                                    fontWeight: "700",
                                    background: /credit/i.test(bill._type) ? "#fef3c7" : /upi|online/i.test(bill._type) ? "#dbeafe" : "#dcfce7",
                                    color: /credit/i.test(bill._type) ? "#92400e" : /upi|online/i.test(bill._type) ? "#1e40af" : "#166534"
                                  }}
                                >
                                  {bill._type}
                                </span>
                              </td>
                              <td style={{ padding: "9px 12px", color: "#0f172a", fontWeight: "600" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span>{bill._customerName}</span>
                                  {bill._doctorName && bill._doctorName !== "-" && (
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                                      (Dr. {bill._doctorName})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: "9px 10px", textAlign: "right", color: "#475569", fontFamily: "monospace" }}>
                                ₹{bill._base.toFixed(2)}
                              </td>
                              <td style={{ padding: "9px 10px", textAlign: "right", color: "#d97706", fontFamily: "monospace", fontWeight: "600" }}>
                                ₹{bill._gst.toFixed(2)}
                              </td>
                              <td style={{ padding: "9px 10px", textAlign: "right", color: "#64748b", fontFamily: "monospace" }}>
                                ₹{bill._adTax.toFixed(2)}
                              </td>
                              <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: "800", color: "#047857", fontFamily: "monospace", fontSize: "13px" }}>
                                ₹{bill._amount.toFixed(2)}
                              </td>
                              <td style={{ padding: "9px 8px", textAlign: "center" }}>
                                <button
                                  onClick={() => handleToggleYN(bill)}
                                  title="Click to toggle Audited status (Y/N)"
                                  style={{
                                    background: isAudited ? "#059669" : "#e2e8f0",
                                    color: isAudited ? "#ffffff" : "#475569",
                                    border: "none",
                                    borderRadius: "4px",
                                    padding: "3px 9px",
                                    fontSize: "11px",
                                    fontWeight: "800",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease"
                                  }}
                                >
                                  {bill._yn}
                                </button>
                              </td>
                              <td style={{ padding: "9px 10px", textAlign: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                                  <button
                                    onClick={() => handleOpenEdit(bill)}
                                    title="Change Bill Details"
                                    style={{
                                      background: "#2563eb",
                                      color: "#ffffff",
                                      border: "none",
                                      borderRadius: "4px",
                                      padding: "4px 8px",
                                      fontSize: "11px",
                                      fontWeight: "600",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "3px"
                                    }}
                                  >
                                    <Edit2 size={11} /> Change
                                  </button>
                                  <button
                                    onClick={() => setCbDetailModal(bill)}
                                    title="View Line Items"
                                    style={{
                                      background: "#f1f5f9",
                                      color: "#334155",
                                      border: "1px solid #cbd5e1",
                                      borderRadius: "4px",
                                      padding: "4px 8px",
                                      fontSize: "11px",
                                      fontWeight: "600",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "3px"
                                    }}
                                  >
                                    <Eye size={11} /> Items
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (typeof handlePrintSalesBill === 'function') {
                                        handlePrintSalesBill(bill);
                                      }
                                    }}
                                    title="Reprint Bill"
                                    style={{
                                      background: "#0284c7",
                                      color: "#ffffff",
                                      border: "none",
                                      borderRadius: "4px",
                                      padding: "4px 8px",
                                      fontSize: "11px",
                                      cursor: "pointer"
                                    }}
                                  >
                                    <Printer size={11} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submodal A: Quick Edit Bill Details (Light Theme) */}
              {cbEditModal && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 100000,
                    background: "rgba(15, 23, 42, 0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(4px)"
                  }}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      width: "520px",
                      maxWidth: "95vw",
                      overflow: "hidden",
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                    }}
                  >
                    <div
                      style={{
                        padding: "16px 20px",
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Edit2 size={16} color="#2563eb" />
                        <span style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                          Change Bill #{cbEditModal._billNo}
                        </span>
                      </div>
                      <button
                        onClick={() => setCbEditModal(null)}
                        style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          Payment Mode / Bill Type:
                        </label>
                        <select
                          value={cbEditForm.payMode}
                          onChange={(e) => setCbEditForm({ ...cbEditForm, payMode: e.target.value })}
                          style={{
                            width: "100%",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            fontSize: "13px"
                          }}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Credit">Credit (Khata)</option>
                          <option value="UPI">UPI / Online / GPay</option>
                          <option value="Card">Card / Debit</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          Customer / Patient Name:
                        </label>
                        <input
                          type="text"
                          value={cbEditForm.patientName}
                          placeholder="e.g. Ramesh Patel"
                          onChange={(e) => setCbEditForm({ ...cbEditForm, patientName: e.target.value })}
                          style={{
                            width: "100%",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            boxSizing: "border-box"
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          Doctor Name:
                        </label>
                        <input
                          type="text"
                          value={cbEditForm.doctorName}
                          placeholder="e.g. Dr. Shah"
                          onChange={(e) => setCbEditForm({ ...cbEditForm, doctorName: e.target.value })}
                          style={{
                            width: "100%",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            boxSizing: "border-box"
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          Audited Status (Y/N):
                        </label>
                        <select
                          value={cbEditForm.yn}
                          onChange={(e) => setCbEditForm({ ...cbEditForm, yn: e.target.value })}
                          style={{
                            width: "100%",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            fontSize: "13px"
                          }}
                        >
                          <option value="N">N - Unaudited / Standard</option>
                          <option value="Y">Y - Verified / Audited</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          Change / Audit Reason:
                        </label>
                        <input
                          type="text"
                          value={cbEditForm.remarks}
                          placeholder="e.g. Customer changed payment from Cash to Credit"
                          onChange={(e) => setCbEditForm({ ...cbEditForm, remarks: e.target.value })}
                          style={{
                            width: "100%",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            boxSizing: "border-box"
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "14px 20px",
                        background: "#f8fafc",
                        borderTop: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <button
                        onClick={() => {
                          const billToEdit = cbEditModal;
                          setCbEditModal(null);
                          onClose();
                          if (typeof openSalesForm === 'function') {
                            openSalesForm(billToEdit.isReturn, billToEdit);
                          }
                        }}
                        style={{
                          background: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 14px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        ⚡ Full Bill POS Edit
                      </button>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => setCbEditModal(null)}
                          style={{
                            background: "#ffffff",
                            color: "#475569",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            padding: "8px 14px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveQuickEdit}
                          style={{
                            background: "#059669",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 16px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submodal B: View Bill Line Items (Light Theme) */}
              {cbDetailModal && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 100000,
                    background: "rgba(15, 23, 42, 0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(4px)"
                  }}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      width: "750px",
                      maxWidth: "95vw",
                      maxHeight: "85vh",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                    }}
                  >
                    <div
                      style={{
                        padding: "16px 20px",
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexShrink: 0
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                          Bill #{cbDetailModal._billNo} Line Items
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Customer: {cbDetailModal._customerName} | Date: {cbDetailModal._date} | Type: {cbDetailModal._type}
                        </div>
                      </div>
                      <button
                        onClick={() => setCbDetailModal(null)}
                        style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
                      {(!cbDetailModal.items || cbDetailModal.items.length === 0) && (!cbDetailModal.saleItems || cbDetailModal.saleItems.length === 0) ? (
                        <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                          No line items recorded for this invoice.
                        </div>
                      ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                          <thead>
                            <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", color: "#475569" }}>
                              <th style={{ padding: "8px 6px", textAlign: "center" }}>#</th>
                              <th style={{ padding: "8px", textAlign: "left" }}>Medicine / Item</th>
                              <th style={{ padding: "8px", textAlign: "left" }}>Batch</th>
                              <th style={{ padding: "8px", textAlign: "center" }}>Exp</th>
                              <th style={{ padding: "8px", textAlign: "right" }}>Qty</th>
                              <th style={{ padding: "8px", textAlign: "right" }}>MRP</th>
                              <th style={{ padding: "8px", textAlign: "right" }}>Rate</th>
                              <th style={{ padding: "8px", textAlign: "right" }}>Disc %</th>
                              <th style={{ padding: "8px", textAlign: "right" }}>GST %</th>
                              <th style={{ padding: "8px", textAlign: "right" }}>Total (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(cbDetailModal.items || cbDetailModal.saleItems || []).map((it: any, i: number) => {
                              const lineQty = it.qty || it.quantity || 1;
                              const lineRate = it.rate || it.sellingRate || it.mrp || 0;
                              const lineTotal = it.total || it.amount || (lineQty * lineRate);
                              return (
                                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                  <td style={{ padding: "8px 6px", textAlign: "center", color: "#94a3b8" }}>{i + 1}</td>
                                  <td style={{ padding: "8px", color: "#0f172a", fontWeight: "700" }}>{it.name || it.itemName || it.drugName || "Item"}</td>
                                  <td style={{ padding: "8px", color: "#64748b", fontFamily: "monospace" }}>{it.batch || it.batchNo || "-"}</td>
                                  <td style={{ padding: "8px", textAlign: "center", color: "#64748b" }}>{it.expiry || it.expiryDate || "-"}</td>
                                  <td style={{ padding: "8px", textAlign: "right", color: "#1d4ed8", fontWeight: "700" }}>{lineQty}</td>
                                  <td style={{ padding: "8px", textAlign: "right", color: "#64748b" }}>₹{Number(it.mrp || lineRate).toFixed(2)}</td>
                                  <td style={{ padding: "8px", textAlign: "right", color: "#334155" }}>₹{Number(lineRate).toFixed(2)}</td>
                                  <td style={{ padding: "8px", textAlign: "right", color: "#64748b" }}>{it.discount || it.disc || 0}%</td>
                                  <td style={{ padding: "8px", textAlign: "right", color: "#d97706" }}>{it.gst || it.tax || 12}%</td>
                                  <td style={{ padding: "8px", textAlign: "right", color: "#047857", fontWeight: "800" }}>₹{Number(lineTotal).toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}

                      <div
                        style={{
                          marginTop: "16px",
                          padding: "12px 16px",
                          background: "#f8fafc",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          Total Items: <strong>{(cbDetailModal.items || cbDetailModal.saleItems || []).length}</strong>
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: "800", color: "#047857" }}>
                          Net Bill Total: ₹{cbDetailModal._amount.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "14px 20px",
                        background: "#f8fafc",
                        borderTop: "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                        flexShrink: 0
                      }}
                    >
                      <button
                        onClick={() => {
                          if (typeof handlePrintSalesBill === 'function') {
                            handlePrintSalesBill(cbDetailModal);
                          }
                        }}
                        style={{
                          background: "#0284c7",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 16px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <Printer size={13} /> Print Bill
                      </button>
                      <button
                        onClick={() => setCbDetailModal(null)}
                        style={{
                          background: "#ffffff",
                          color: "#475569",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "8px 16px",
                          fontSize: "12px",
                          fontWeight: "700",
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
