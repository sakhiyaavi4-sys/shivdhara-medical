// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, CheckCircle, Trash2, Plus, ArrowLeft, ArrowRight, Printer, AlertTriangle, FileText, RefreshCw, ShoppingCart, Check, CreditCard, DollarSign, Building, User, Calendar } from "lucide-react";
import { useMedicalStore, today, uid, num, fmt, int, inp, lbl, btn } from './MedicalStoreContext';

export default function SalesReceipt() {
  const {
    salesBills, saveSalesBills,
    payments, savePayments,
    khataEntries,
    showToast, showConfirm,
    setPrintHtml, setActiveSection
  } = useMedicalStore();

  // Local storage persisted sales receipts (v2)
  const [salesReceipts, setSalesReceipts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('store_sales_receipts_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const saveReceipts = (list: any[]) => {
    setSalesReceipts(list);
    try {
      localStorage.setItem('store_sales_receipts_v2', JSON.stringify(list));
    } catch (_) {}
  };

  // Form / Workstation State
  const [showForm, setShowForm] = useState(false);
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);
  const [overviewSearchQuery, setOverviewSearchQuery] = useState("");
  const [showFindModal, setShowFindModal] = useState(false);
  const [showCustomerStatusModal, setShowCustomerStatusModal] = useState(false);

  // Form Fields (Matches Page 13 of transection.pdf)
  const [voucherNo, setVoucherNo] = useState<string>("1");
  const [receiptDate, setReceiptDate] = useState<string>(today());
  const [receiptAmount, setReceiptAmount] = useState<string>("0.00");
  const [message, setMessage] = useState<string>("Received with thanks towards sales account clearance");

  // Account / Customer Selection
  const [accountInput, setAccountInput] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Transfer pending amount checkbox & input
  const [transferPending, setTransferPending] = useState(false);
  const [transferAccount, setTransferAccount] = useState("");

  // Payment Mode (CASH RECEIPT / CHEQUE - NEFT / C-D CARD RECEIPT)
  const [paymentMode, setPaymentMode] = useState<"CASH" | "CHEQUE" | "CARD">("CASH");
  const [bankName, setBankName] = useState<string>("");
  const [chequeNo, setChequeNo] = useState<string>("");
  const [chequeDate, setChequeDate] = useState<string>(today());
  const [printCopies, setPrintCopies] = useState<number>(1);

  // Table rows: Pending Bills for the selected account
  const [billRows, setBillRows] = useState<any[]>([]);

  // Distinct customer accounts list from salesBills, payments, and khata
  const customerList = useMemo(() => {
    const map = new Map<string, any>();
    (salesBills || []).forEach(b => {
      const name = b.customerName || b.patientName || b.partyName || "Counter Sale";
      if (name && name !== "Counter Sale") {
        if (!map.has(name.toLowerCase())) {
          map.set(name.toLowerCase(), {
            name,
            phone: b.customerPhone || b.mobile || "",
            address: b.address || ""
          });
        }
      }
    });

    (khataEntries || []).forEach(k => {
      const name = k.customerName || k.name;
      if (name) {
        if (!map.has(name.toLowerCase())) {
          map.set(name.toLowerCase(), {
            name,
            phone: k.phone || "",
            address: ""
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [salesBills, khataEntries]);

  // Next Voucher No generator
  const getNextVoucherNo = () => {
    if (salesReceipts.length === 0) return "1";
    const max = salesReceipts.reduce((m, r) => Math.max(m, int(r.voucherNo) || 0), 0);
    return String(max + 1);
  };

  // Start fresh Receipt
  const handleNewReceipt = () => {
    setActiveReceiptId(null);
    setVoucherNo(getNextVoucherNo());
    setReceiptDate(today());
    setAccountInput("");
    setSelectedCustomerId("");
    setShowAccountDropdown(false);
    setReceiptAmount("0.00");
    setMessage("Received with thanks towards sales account clearance");
    setPaymentMode("CASH");
    setBankName("");
    setChequeNo("");
    setChequeDate(today());
    setTransferPending(false);
    setTransferAccount("");
    setBillRows([]);
    setShowForm(true);
  };

  // Open existing receipt
  const handleOpenReceipt = (rec: any) => {
    if (!rec) return;
    setActiveReceiptId(rec.id);
    setVoucherNo(String(rec.voucherNo || "1"));
    setReceiptDate(rec.receiptDate || rec.date || today());
    setAccountInput(rec.accountName || rec.customerName || "");
    setSelectedCustomerId(rec.customerId || "");
    setShowAccountDropdown(false);
    setReceiptAmount(fmt(rec.amount || 0));
    setMessage(rec.message || "");
    setPaymentMode(rec.paymentMode || "CASH");
    setBankName(rec.bankName || "");
    setChequeNo(rec.chequeNo || "");
    setChequeDate(rec.chequeDate || today());
    setTransferPending(!!rec.transferPending);
    setTransferAccount(rec.transferAccount || "");
    setBillRows(rec.bills || []);
    setShowForm(true);
    setShowFindModal(false);
  };

  // When Account is selected, fetch all pending/unpaid sales bills for this customer
  const handleSelectAccount = (customer: any) => {
    const custName = typeof customer === "string" ? customer : customer.name;
    setAccountInput(custName);
    setSelectedCustomerId(customer.phone || "");
    setShowAccountDropdown(false);

    // Filter matching sales bills
    const matchingBills = (salesBills || []).filter(b => {
      const bCust = (b.customerName || b.patientName || b.partyName || "").trim().toLowerCase();
      return bCust === custName.trim().toLowerCase();
    });

    if (matchingBills.length === 0) {
      // Create a default general debit balance row if no bills exist yet
      setBillRows([{
        id: uid(),
        srNo: 1,
        billNo: "OPENING-BAL",
        billDate: today(),
        billAmount: fmt(1500),
        paidPrev: "0.00",
        paidToday: "0.00",
        pendingAmt: fmt(1500),
        status: "Unpaid",
        tmatAmt: "0.00",
        patient: custName
      }]);
      showToast(`Selected account: ${custName} (Opening balance row loaded)`);
      return;
    }

    const rows = matchingBills.map((b, idx) => {
      const totalAmt = num(b.total) || num(b.netTotal) || num(b.amount) || 0;
      const alreadyPaid = num(b.paid) || 0;
      const dueAmt = Math.max(0, totalAmt - alreadyPaid);

      return {
        id: b.id || uid(),
        billId: b.id,
        srNo: idx + 1,
        billNo: b.billNo || b.invoiceNo || `SB-${idx + 1}`,
        billDate: b.billDate || b.date || today(),
        billAmount: fmt(totalAmt),
        paidPrev: fmt(alreadyPaid),
        paidToday: "0.00",
        pendingAmt: fmt(dueAmt),
        status: dueAmt <= 0 ? "Paid" : alreadyPaid > 0 ? "Partial" : "Unpaid",
        tmatAmt: "0.00",
        patient: b.patientName || b.customerName || custName
      };
    });

    setBillRows(rows);
    showToast(`Loaded ${rows.length} bills for ${custName}`);
  };

  // Update Paid Today on a specific bill row
  const handlePaidTodayChange = (index: number, val: string) => {
    const enteredPaid = num(val);
    setBillRows(prev => {
      const next = [...prev];
      const r = next[index];
      const billTotal = num(r.billAmount);
      const prevPaid = num(r.paidPrev);
      const discountTmat = num(r.tmatAmt);
      const newPending = Math.max(0, billTotal - prevPaid - enteredPaid - discountTmat);

      r.paidToday = val;
      r.pendingAmt = fmt(newPending);
      r.status = newPending <= 0 ? "Full" : (prevPaid + enteredPaid) > 0 ? "Partial" : "Unpaid";

      // Re-sum total receipt amount from all rows
      const totalPaidToday = next.reduce((s, row) => s + (num(row.paidToday) || 0), 0);
      setReceiptAmount(fmt(totalPaidToday));

      return next;
    });
  };

  // Quick Pay Full on a bill row
  const handlePayFullRow = (index: number) => {
    setBillRows(prev => {
      const next = [...prev];
      const r = next[index];
      const billTotal = num(r.billAmount);
      const prevPaid = num(r.paidPrev);
      const discountTmat = num(r.tmatAmt);
      const due = Math.max(0, billTotal - prevPaid - discountTmat);

      r.paidToday = fmt(due);
      r.pendingAmt = "0.00";
      r.status = "Full";

      const totalPaidToday = next.reduce((s, row) => s + (num(row.paidToday) || 0), 0);
      setReceiptAmount(fmt(totalPaidToday));

      return next;
    });
  };

  // Distribute entered Receipt Amount across oldest pending bills automatically
  const handleReceiptAmountChange = (val: string) => {
    setReceiptAmount(val);
    let remainingToAllocate = num(val);

    setBillRows(prev => {
      return prev.map(r => {
        const billTotal = num(r.billAmount);
        const prevPaid = num(r.paidPrev);
        const discountTmat = num(r.tmatAmt);
        const maxDue = Math.max(0, billTotal - prevPaid - discountTmat);

        if (remainingToAllocate <= 0) {
          return {
            ...r,
            paidToday: "0.00",
            pendingAmt: fmt(maxDue),
            status: prevPaid > 0 ? "Partial" : "Unpaid"
          };
        }

        const allocated = Math.min(remainingToAllocate, maxDue);
        remainingToAllocate -= allocated;
        const newPending = Math.max(0, maxDue - allocated);

        return {
          ...r,
          paidToday: fmt(allocated),
          pendingAmt: fmt(newPending),
          status: newPending <= 0 ? "Full" : (prevPaid + allocated) > 0 ? "Partial" : "Unpaid"
        };
      });
    });
  };

  // Save Sales Receipt
  const handleSave = () => {
    if (!accountInput.trim()) {
      showToast("Please select or enter an Account Name!", "error");
      return;
    }

    const totalAmt = num(receiptAmount);
    if (totalAmt <= 0) {
      showToast("Please enter a valid Receipt Amount!", "error");
      return;
    }

    const receiptRecord = {
      id: activeReceiptId || uid(),
      voucherNo,
      receiptDate,
      accountName: accountInput.trim(),
      customerId: selectedCustomerId,
      amount: totalAmt,
      paymentMode,
      bankName: paymentMode === "CHEQUE" ? bankName : "",
      chequeNo: paymentMode === "CHEQUE" ? chequeNo : "",
      chequeDate: paymentMode === "CHEQUE" ? chequeDate : "",
      message,
      transferPending,
      transferAccount,
      bills: billRows,
      createdAt: new Date().toISOString()
    };

    let updatedList;
    if (activeReceiptId) {
      updatedList = salesReceipts.map(r => r.id === activeReceiptId ? receiptRecord : r);
    } else {
      updatedList = [receiptRecord, ...salesReceipts];
    }
    saveReceipts(updatedList);

    // Also sync to global payments state for accounting integration
    const globalPaymentRecord = {
      id: receiptRecord.id,
      voucherNo,
      date: receiptDate,
      type: "receipt",
      partyName: accountInput.trim(),
      amount: totalAmt,
      mode: paymentMode.toLowerCase(),
      remarks: message,
      bank: bankName,
      chequeNo
    };

    const existingPaymentIdx = (payments || []).findIndex(p => p.id === receiptRecord.id);
    if (existingPaymentIdx >= 0) {
      const pList = [...payments];
      pList[existingPaymentIdx] = globalPaymentRecord;
      savePayments(pList);
    } else {
      savePayments([globalPaymentRecord, ...(payments || [])]);
    }

    // Update salesBills paid status
    const updatedSalesBills = (salesBills || []).map(b => {
      const match = billRows.find(br => br.billId === b.id || br.billNo === b.billNo);
      if (match && num(match.paidToday) > 0) {
        const curPaid = num(b.paid) || 0;
        const newPaid = curPaid + num(match.paidToday);
        const bTotal = num(b.total) || num(b.netTotal) || 0;
        return {
          ...b,
          paid: newPaid,
          due: Math.max(0, bTotal - newPaid),
          status: newPaid >= bTotal ? "Paid" : "Credit"
        };
      }
      return b;
    });
    saveSalesBills(updatedSalesBills);

    setActiveReceiptId(receiptRecord.id);
    showToast(`✅ Sales Receipt Voucher #${voucherNo} saved successfully!`);
  };

  // Delete Sales Receipt
  const handleDelete = () => {
    if (!activeReceiptId) {
      showToast("This is an unsaved new receipt!", "info");
      return;
    }
    showConfirm(`Delete Sales Receipt Voucher #${voucherNo}?`, () => {
      const remaining = salesReceipts.filter(r => r.id !== activeReceiptId);
      saveReceipts(remaining);
      const remainingGlobal = (payments || []).filter(p => p.id !== activeReceiptId);
      savePayments(remainingGlobal);
      showToast(`Voucher #${voucherNo} deleted!`);
      handleNewReceipt();
    });
  };

  // Sequential Navigation: Previous Voucher
  const handlePrevReceipt = () => {
    if (salesReceipts.length === 0) return;
    const curIdx = salesReceipts.findIndex(r => r.id === activeReceiptId);
    if (curIdx < 0 || curIdx >= salesReceipts.length - 1) {
      handleOpenReceipt(salesReceipts[salesReceipts.length - 1]);
    } else {
      handleOpenReceipt(salesReceipts[curIdx + 1]);
    }
  };

  // Sequential Navigation: Next Voucher
  const handleNextReceipt = () => {
    if (salesReceipts.length === 0) return;
    const curIdx = salesReceipts.findIndex(r => r.id === activeReceiptId);
    if (curIdx <= 0) {
      handleOpenReceipt(salesReceipts[0]);
    } else {
      handleOpenReceipt(salesReceipts[curIdx - 1]);
    }
  };

  // Print Standard Receipt Voucher
  const handlePrintReceipt = (format = "A4") => {
    const totalAmt = num(receiptAmount);
    if (totalAmt <= 0) {
      showToast("No receipt amount to print!", "error");
      return;
    }

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #0f172a; max-width: ${format === '6X4' ? '500px' : '750px'}; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 6px;">
        <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase; color: #0284c7;">SHIV DHARA MEDICAL STORE</h2>
          <p style="margin: 2px 0; font-size: 11px; color: #64748b;">20, GIRIRAJ COMPLEX NIKOL GAAM ROAD, NIKOL, AHMEDABAD | PH: 079352 07999</p>
          <div style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 14px; border-radius: 12px; font-weight: 700; font-size: 11px; margin-top: 4px; border: 1px solid #bae6fd;">
            OFFICIAL SALES RECEIPT VOUCHER
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 10px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px;">
          <div>
            <strong>Voucher No:</strong> #${voucherNo}<br/>
            <strong>Received From:</strong> ${accountInput || "N/A"}<br/>
            <strong>Payment Mode:</strong> ${paymentMode} ${paymentMode === 'CHEQUE' ? `(${bankName} - Chq# ${chequeNo})` : ''}
          </div>
          <div style="text-align: right;">
            <strong>Receipt Date:</strong> ${receiptDate}<br/>
            <strong>Time:</strong> ${new Date().toLocaleTimeString()}<br/>
            <strong>Status:</strong> CLEARED
          </div>
        </div>

        ${billRows.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">Sr</th>
                <th style="padding: 4px; text-align: left; border: 1px solid #cbd5e1;">Bill No</th>
                <th style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">Date</th>
                <th style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">Bill Amt</th>
                <th style="padding: 4px; text-align: right; border: 1px solid #cbd5e1; background: #e0f2fe;">Paid Today</th>
                <th style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">Pending</th>
              </tr>
            </thead>
            <tbody>
              ${billRows.filter(r => num(r.paidToday) > 0).map((r, i) => `
                <tr>
                  <td style="padding: 3px; text-align: center; border: 1px solid #cbd5e1;">${i + 1}</td>
                  <td style="padding: 3px; border: 1px solid #cbd5e1;"><strong>${r.billNo}</strong></td>
                  <td style="padding: 3px; text-align: center; border: 1px solid #cbd5e1;">${r.billDate}</td>
                  <td style="padding: 3px; text-align: right; border: 1px solid #cbd5e1;">₹${fmt(r.billAmount)}</td>
                  <td style="padding: 3px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1; background: #f0f9ff; color: #0284c7;">₹${fmt(r.paidToday)}</td>
                  <td style="padding: 3px; text-align: right; border: 1px solid #cbd5e1;">₹${fmt(r.pendingAmt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div style="background: #f8fafc; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Amount in Words:</strong> Rupees ${fmt(totalAmt)} Only<br/>
              <strong>Narration:</strong> ${message || "Towards settlement of account"}
            </div>
            <div style="text-align: right;">
              <span style="font-size: 10px; color: #64748b;">Total Received:</span><br/>
              <strong style="font-size: 15px; color: #16a34a;">₹${fmt(totalAmt)}</strong>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 10px;">
          <div style="border-top: 1px solid #94a3b8; width: 140px; text-align: center;">Customer Signature</div>
          <div style="border-top: 1px solid #94a3b8; width: 140px; text-align: center;">For Shiv Dhara Medical</div>
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
      } else if (e.key === "F6") {
        e.preventDefault();
        setTransferPending(prev => !prev);
      } else if (e.key === "F11") {
        e.preventDefault();
        setShowCustomerStatusModal(true);
      } else if (e.key === "Escape") {
        if (showAccountDropdown) {
          setShowAccountDropdown(false);
        } else if (showCustomerStatusModal) {
          setShowCustomerStatusModal(false);
        } else if (showFindModal) {
          setShowFindModal(false);
        } else if (showForm) {
          setShowForm(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm, showAccountDropdown, showCustomerStatusModal, showFindModal, voucherNo, receiptDate, accountInput, receiptAmount, paymentMode, billRows]);

  // Customer Status statistics
  const customerStats = useMemo(() => {
    if (!accountInput.trim()) return null;
    const bills = (salesBills || []).filter(b => (b.customerName || b.patientName || "").trim().toLowerCase() === accountInput.trim().toLowerCase());
    const totalPurchases = bills.reduce((s, b) => s + (num(b.total) || num(b.netTotal) || 0), 0);
    const totalPaid = bills.reduce((s, b) => s + (num(b.paid) || 0), 0);
    const totalPending = Math.max(0, totalPurchases - totalPaid);

    return {
      billCount: bills.length,
      totalPurchases,
      totalPaid,
      totalPending
    };
  }, [accountInput, salesBills]);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: SINGLE CENTER BUTTON (When no form open) — strictly Rule #2
  // ══════════════════════════════════════════════════════════════════════════════
  if (!showForm) {
    const filteredReceipts = (overviewSearchQuery.trim() ? salesReceipts.filter(r => 
      String(r.voucherNo || "").toLowerCase().includes(overviewSearchQuery.toLowerCase()) ||
      String(r.accountName || "").toLowerCase().includes(overviewSearchQuery.toLowerCase()) ||
      String(r.receiptDate || "").includes(overviewSearchQuery)
    ) : salesReceipts).slice(0, 15);

    return (
      <div style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header Title with Search Bar (Clean Blue Accent - Image 2 Theme) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>💵</span> Sales Receipt ({salesReceipts.length})
            </h2>
            <span style={{ background: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
              Customer Collection & Settlement
            </span>
          </div>

          <div style={{ position: "relative", minWidth: "280px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "8px", color: "#64748b" }} />
            <input
              placeholder="Search Voucher#, Customer, Date... + Enter"
              value={overviewSearchQuery}
              onChange={e => setOverviewSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && filteredReceipts.length > 0) {
                  handleOpenReceipt(filteredReceipts[0]);
                }
              }}
              style={{ ...inp, paddingLeft: "30px", background: "white", borderColor: "#cbd5e1" }}
            />
          </div>
        </div>

        {/* ── SINGLE CENTER BUTTON WORKSPACE (Strict Rule #2: Only Center Button) ── */}
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "8px", border: "1px dashed #cbd5e1", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "44px", opacity: 0.8, marginBottom: "8px" }}>💵</div>
          <h3 style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "17px", color: "var(--color-text-dark)" }}>
            Customer Sales Receipt & Payment Settlement
          </h3>
          <p style={{ fontSize: "12px", color: "#64748b", maxWidth: "520px", margin: "0 auto 18px", lineHeight: "1.5" }}>
            Record customer payments (Cash, Cheque/NEFT, Card/UPI). Track bill-by-bill clearance, calculate pending balances, and generate instant 6x4 receipt slips.
          </p>

          {/* SINGLE CENTER BUTTON */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button 
              onClick={handleNewReceipt} 
              style={{ ...btn("#0284c7", "white"), padding: "10px 24px", fontSize: "14px", fontWeight: "700", borderRadius: "6px" }}
            >
              ➕ New Sales Receipt
            </button>
          </div>
        </div>

        {/* Recent Receipts Table */}
        {salesReceipts.length > 0 && (
          <div style={{ marginTop: "24px", background: "white", borderRadius: "8px", border: "1px solid #cbd5e1", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                📋 Recent Sales Receipts ({salesReceipts.length})
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Click on any receipt voucher to view or edit</div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", color: "#475569", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "80px" }}>Voucher#</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Account / Customer Name</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "110px" }}>Receipt Date</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "100px" }}>Mode</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", width: "130px" }}>Amount Received</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Narration / Remarks</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map(rec => (
                    <tr 
                      key={rec.id}
                      onClick={() => handleOpenReceipt(rec)}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "700", color: "#0284c7" }}>
                        #{rec.voucherNo}
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: "600", color: "#1e293b" }}>
                        {rec.accountName}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", color: "#64748b" }}>
                        {rec.receiptDate}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "10px",
                          fontWeight: "700",
                          background: rec.paymentMode === "CASH" ? "#dcfce7" : rec.paymentMode === "CHEQUE" ? "#eff6ff" : "#fef3c7",
                          color: rec.paymentMode === "CASH" ? "#15803d" : rec.paymentMode === "CHEQUE" ? "#1d4ed8" : "#b45309"
                        }}>
                          {rec.paymentMode}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: "#16a34a" }}>
                        ₹{fmt(rec.amount || 0)}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#64748b", fontSize: "11px" }}>
                        {rec.message || "-"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenReceipt(rec)} 
                          style={{ ...btn("#0284c7", "white"), padding: "3px 8px", fontSize: "11px" }}
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
  // RENDER: FULL INTERACTIVE SALES RECEIPT SCREEN (Matches Page 13 + Image 2 Theme)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: "white", borderRadius: "8px", border: "1px solid #cbd5e1", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", minHeight: "85vh" }}>
      
      {/* ── TOP HEADER / ACCOUNT BAR (MATCHES SCREENSHOT PAGE 13) ── */}
      <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", flexDirection: "column", gap: "8px" }}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          
          {/* Account Input with popup auto-suggest list */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, maxWidth: "550px", position: "relative" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#1e293b", minWidth: "60px" }}>Account:</span>
            
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type="text"
                placeholder="Type or search Customer / Debtor Account Name..."
                value={accountInput}
                onChange={e => {
                  setAccountInput(e.target.value);
                  setShowAccountDropdown(true);
                }}
                onFocus={() => setShowAccountDropdown(true)}
                style={{ ...inp, height: "26px", fontSize: "11px", fontWeight: "700", background: "white", borderColor: showAccountDropdown ? "#0284c7" : "#cbd5e1" }}
              />

              {/* Account Dropdown */}
              {showAccountDropdown && (
                <div style={{
                  position: "absolute",
                  top: "30px",
                  left: 0,
                  width: "100%",
                  background: "white",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                  maxHeight: "220px",
                  overflowY: "auto",
                  zIndex: 999
                }}>
                  {(() => {
                    const q = accountInput.toLowerCase().trim();
                    const matches = customerList.filter(c => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q));

                    if (matches.length === 0) {
                      return <div style={{ padding: "8px 12px", fontSize: "11px", color: "#64748b" }}>No accounts found (You can type custom account)</div>;
                    }

                    return matches.map((cust, i) => (
                      <div
                        key={i}
                        onMouseDown={() => handleSelectAccount(cust)}
                        style={{
                          padding: "6px 12px",
                          borderBottom: "1px solid #f1f5f9",
                          cursor: "pointer",
                          fontSize: "11px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}
                      >
                        <div style={{ fontWeight: "700", color: "#0f172a" }}>{cust.name}</div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>{cust.phone}</div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Voucher No & Shortcut Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Voucher:</span>
              <input
                type="text"
                value={voucherNo}
                onChange={e => setVoucherNo(e.target.value)}
                style={{ ...inp, width: "65px", height: "26px", fontSize: "11px", fontWeight: "700", textAlign: "center", color: "#0284c7" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10px", fontWeight: "700" }}>
              <span style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "2px 6px", borderRadius: "4px", color: "#475569" }}>
                F6 - Transfer Entry
              </span>
              <span 
                onClick={() => setShowCustomerStatusModal(true)}
                style={{ background: "#e0f2fe", border: "1px solid #bae6fd", padding: "2px 6px", borderRadius: "4px", color: "#0369a1", cursor: "pointer" }}
                title="View Customer Balance & History"
              >
                F11 - Customer Status
              </span>
            </div>

            <button onClick={() => setShowForm(false)} style={{ ...btn("#475569", "white"), padding: "3px 10px", fontSize: "11px" }}>
              ✕ Close
            </button>
          </div>

        </div>

      </div>

      {/* ── PENDING BILLS GRID (MATCHES COLUMNS IN SCREENSHOT WITH SLATE HEADER) ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", color: "#334155", textAlign: "center", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #cbd5e1" }}>
              <th style={{ padding: "6px 4px", width: "40px", borderRight: "1px solid #e2e8f0" }}>SrNo</th>
              <th style={{ padding: "6px 8px", textAlign: "left", width: "110px", borderRight: "1px solid #e2e8f0" }}>Bill No</th>
              <th style={{ padding: "6px 6px", width: "85px", borderRight: "1px solid #e2e8f0" }}>Bill Date</th>
              <th style={{ padding: "6px 6px", width: "85px", borderRight: "1px solid #e2e8f0", textAlign: "right" }}>Bill Amount</th>
              <th style={{ padding: "6px 6px", width: "80px", borderRight: "1px solid #e2e8f0", textAlign: "right" }}>Paid Prev</th>
              <th style={{ padding: "6px 6px", width: "95px", borderRight: "1px solid #e2e8f0", textAlign: "right", background: "#e0f2fe", color: "#0369a1" }}>Paid Today</th>
              <th style={{ padding: "6px 6px", width: "85px", borderRight: "1px solid #e2e8f0", textAlign: "right" }}>Pending Amt</th>
              <th style={{ padding: "6px 6px", width: "70px", borderRight: "1px solid #e2e8f0" }}>Status</th>
              <th style={{ padding: "6px 6px", width: "70px", borderRight: "1px solid #e2e8f0", textAlign: "right" }}>Tmat Amt</th>
              <th style={{ padding: "6px 8px", textAlign: "left" }}>Patient</th>
              <th style={{ padding: "6px 4px", width: "65px" }}>Quick</th>
            </tr>
          </thead>
          <tbody>
            {billRows.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: "50px 20px", textAlign: "center", color: "#64748b" }}>
                  <div style={{ fontSize: "32px", opacity: 0.5, marginBottom: "8px" }}>📋</div>
                  <div style={{ fontWeight: "700", fontSize: "13px" }}>Please select an Account from above to view pending sales bills</div>
                  <div style={{ fontSize: "11px", marginTop: "4px" }}>Bills with pending credit dues will populate automatically</div>
                </td>
              </tr>
            ) : (
              billRows.map((row, idx) => (
                <tr 
                  key={row.id}
                  style={{
                    background: idx % 2 === 0 ? "white" : "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    transition: "background 0.1s"
                  }}
                >
                  <td style={{ textAlign: "center", fontWeight: "700", color: "#64748b", padding: "4px 2px", borderRight: "1px solid #e2e8f0" }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: "4px 8px", fontWeight: "700", color: "#0f172a", borderRight: "1px solid #e2e8f0" }}>
                    {row.billNo}
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", borderRight: "1px solid #e2e8f0" }}>
                    {row.billDate}
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "600", color: "#0f172a", borderRight: "1px solid #e2e8f0" }}>
                    ₹{fmt(row.billAmount)}
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "right", color: "#64748b", borderRight: "1px solid #e2e8f0" }}>
                    ₹{fmt(row.paidPrev)}
                  </td>
                  
                  {/* Paid Today (Editable) */}
                  <td style={{ padding: "2px 4px", borderRight: "1px solid #e2e8f0" }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.paidToday}
                      onChange={e => handlePaidTodayChange(idx, e.target.value)}
                      style={{
                        ...inp,
                        height: "24px",
                        fontSize: "11px",
                        fontWeight: "800",
                        textAlign: "right",
                        background: "#f0f9ff",
                        color: "#0284c7",
                        borderColor: "#7dd3fc"
                      }}
                    />
                  </td>

                  {/* Pending Amt */}
                  <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "700", color: num(row.pendingAmt) > 0 ? "#b45309" : "#16a34a", borderRight: "1px solid #e2e8f0" }}>
                    ₹{fmt(row.pendingAmt)}
                  </td>

                  {/* Status */}
                  <td style={{ padding: "4px 6px", textAlign: "center", borderRight: "1px solid #e2e8f0" }}>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: "10px",
                      fontSize: "9px",
                      fontWeight: "800",
                      background: row.status === "Full" || row.status === "Paid" ? "#dcfce7" : row.status === "Partial" ? "#fef3c7" : "#fee2e2",
                      color: row.status === "Full" || row.status === "Paid" ? "#15803d" : row.status === "Partial" ? "#b45309" : "#b91c1c"
                    }}>
                      {row.status}
                    </span>
                  </td>

                  {/* Tmat Amt */}
                  <td style={{ padding: "4px 6px", textAlign: "right", color: "#64748b", borderRight: "1px solid #e2e8f0" }}>
                    ₹{fmt(row.tmatAmt)}
                  </td>

                  {/* Patient */}
                  <td style={{ padding: "4px 8px", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                    {row.patient || "-"}
                  </td>

                  {/* Quick Action: Pay Full */}
                  <td style={{ textAlign: "center", padding: "2px" }}>
                    <button
                      onClick={() => handlePayFullRow(idx)}
                      style={{ ...btn("#e0f2fe", "#0284c7"), padding: "2px 6px", fontSize: "10px", fontWeight: "700" }}
                      title="Clear full pending balance on this bill"
                    >
                      Pay Full
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── TRANSFER PENDING CHECKBOX BAR (MATCHES SCREENSHOT) ── */}
      <div style={{ padding: "6px 14px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px", fontSize: "11px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "600", color: "#334155" }}>
          <input
            type="checkbox"
            checked={transferPending}
            onChange={e => setTransferPending(e.target.checked)}
          />
          Transfer Pending amount in:
        </label>
        <input
          type="text"
          placeholder="Transfer Account / Party Name (F6)..."
          disabled={!transferPending}
          value={transferAccount}
          onChange={e => setTransferAccount(e.target.value)}
          style={{ ...inp, width: "300px", height: "24px", fontSize: "11px", background: transferPending ? "white" : "#f1f5f9" }}
        />
      </div>

      {/* ── PAYMENT RECEIVED IN & RECEIPT DETAILS (MATCHES BOX IN SCREENSHOT) ── */}
      <div style={{ padding: "10px 14px", background: "#f1f5f9", borderTop: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        
        {/* PAYMENT RECEIVED IN BOX (Radio Buttons: CASH, CHEQUE - NEFT, C-D CARD) */}
        <div style={{ background: "white", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", minWidth: "300px", flex: 1, maxWidth: "420px" }}>
          <div style={{ fontSize: "11px", fontWeight: "800", color: "#0284c7", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px", marginBottom: "8px", textTransform: "uppercase" }}>
            PAYMENT RECEIVED IN
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", fontWeight: "700", color: "#334155" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input
                type="radio"
                name="payMode"
                checked={paymentMode === "CASH"}
                onChange={() => setPaymentMode("CASH")}
              />
              CASH RECEIPT
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input
                type="radio"
                name="payMode"
                checked={paymentMode === "CHEQUE"}
                onChange={() => setPaymentMode("CHEQUE")}
              />
              CHEQUE - NEFT
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input
                type="radio"
                name="payMode"
                checked={paymentMode === "CARD"}
                onChange={() => setPaymentMode("CARD")}
              />
              C-D CARD RECEIPT (UPI / POS)
            </label>
          </div>

          {/* Conditional Cheque / Card Inputs */}
          {paymentMode === "CHEQUE" && (
            <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #e2e8f0", display: "flex", flexDirection: "column", gap: "4px" }}>
              <input
                placeholder="Bank Name (e.g. SBI, HDFC)"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                style={{ ...inp, height: "24px", fontSize: "11px" }}
              />
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  placeholder="Cheque / UTR No"
                  value={chequeNo}
                  onChange={e => setChequeNo(e.target.value)}
                  style={{ ...inp, height: "24px", fontSize: "11px", flex: 1 }}
                />
                <input
                  type="date"
                  value={chequeDate}
                  onChange={e => setChequeDate(e.target.value)}
                  style={{ ...inp, height: "24px", fontSize: "11px", width: "120px" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Date, Amount, Message Details */}
        <div style={{ flex: 1, minWidth: "320px", display: "flex", flexDirection: "column", gap: "6px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", width: "65px", color: "#334155" }}>Date...:</span>
            <input
              type="date"
              value={receiptDate}
              onChange={e => setReceiptDate(e.target.value)}
              style={{ ...inp, height: "26px", fontSize: "11px", width: "140px", background: "white" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", width: "65px", color: "#334155" }}>Amount..:</span>
            <input
              type="number"
              step="0.01"
              value={receiptAmount}
              onChange={e => handleReceiptAmountChange(e.target.value)}
              style={{
                ...inp,
                height: "28px",
                fontSize: "14px",
                fontWeight: "800",
                width: "160px",
                textAlign: "right",
                background: "white",
                color: "#16a34a",
                borderColor: "#86efac"
              }}
            />
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              (Auto-allocated to pending bills above)
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", width: "65px", color: "#334155" }}>Message:</span>
            <input
              type="text"
              placeholder="Narration / Remarks / Transaction Note..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{ ...inp, height: "26px", fontSize: "11px", flex: 1, background: "white" }}
            />
          </div>

        </div>

      </div>

      {/* ── BOTTOM ACTION TOOLBAR (MATCHES SCREENSHOT BUTTONS: New, Save, 1, Print, Print 6X4, <, >, Find, Remove, Close) ── */}
      <div style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        
        {/* Row 1 Action Buttons */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={handleNewReceipt} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 12px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            New
          </button>
          
          <button onClick={handleSave} style={{ ...btn("#0284c7", "white"), padding: "5px 16px", fontSize: "11px", fontWeight: "700" }} title="Save Sales Receipt (F2)">
            Save (F2)
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <input
              type="number"
              min="1"
              max="5"
              value={printCopies}
              onChange={e => setPrintCopies(int(e.target.value) || 1)}
              style={{ ...inp, width: "36px", height: "26px", textAlign: "center", fontSize: "11px", padding: "2px" }}
              title="Print copies"
            />
            <button onClick={() => handlePrintReceipt("A4")} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              Print
            </button>
          </div>

          <button onClick={() => handlePrintReceipt("6X4")} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Print 6x4 inch customer receipt slip">
            Print 6 X 4
          </button>

          {/* Sequential Navigation: Prev < and Next > */}
          <button onClick={handlePrevReceipt} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Previous Receipt Voucher">
            &lt;
          </button>
          <button onClick={handleNextReceipt} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Next Receipt Voucher">
            &gt;
          </button>

          <button onClick={() => setShowFindModal(true)} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 11px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            Find
          </button>

          <button onClick={handleDelete} style={{ ...btn("#fee2e2", "#dc2626"), padding: "5px 11px", fontSize: "11px", border: "1px solid #fecaca" }}>
            Remove
          </button>
        </div>

        {/* Close Button */}
        <button onClick={() => setShowForm(false)} style={{ ...btn("#475569", "white"), padding: "5px 16px", fontSize: "11px", fontWeight: "700" }}>
          Close (Esc)
        </button>

      </div>

      {/* ── FIND RECEIPT MODAL ── */}
      {showFindModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "8px", width: "100%", maxWidth: "580px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>🔍 Find Sales Receipt Voucher</div>
              <button onClick={() => setShowFindModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>

            <div style={{ padding: "8px", overflowY: "auto", flex: 1 }}>
              {salesReceipts.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No receipts found</div>
              ) : (
                salesReceipts.map(rec => (
                  <div
                    key={rec.id}
                    onClick={() => handleOpenReceipt(rec)}
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
                    onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>
                        Voucher #{rec.voucherNo} — {rec.accountName}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Date: {rec.receiptDate} | Mode: {rec.paymentMode}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "800", color: "#16a34a" }}>₹{fmt(rec.amount)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── F11 CUSTOMER STATUS MODAL ── */}
      {showCustomerStatusModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "8px", width: "100%", maxWidth: "480px", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>📊 F11 - Customer Account Status</div>
              <button onClick={() => setShowCustomerStatusModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
            
            <div style={{ padding: "14px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ padding: "8px", background: "#eff6ff", borderRadius: "6px", border: "1px solid #bfdbfe" }}>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Account Name:</div>
                <div style={{ fontWeight: "800", fontSize: "14px", color: "#1e40af" }}>{accountInput || "No Account Selected"}</div>
              </div>

              {customerStats ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                    <span>Total Sales Invoices:</span>
                    <strong>{customerStats.billCount} bills</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                    <span>Total Purchases Valuation:</span>
                    <strong>₹{fmt(customerStats.totalPurchases)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                    <span>Total Amount Paid:</span>
                    <strong style={{ color: "#16a34a" }}>₹{fmt(customerStats.totalPaid)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", background: "#fef3c7", padding: "6px 8px", borderRadius: "4px" }}>
                    <span style={{ fontWeight: "700", color: "#b45309" }}>Total Current Pending Dues:</span>
                    <strong style={{ color: "#b45309", fontSize: "13px" }}>₹{fmt(customerStats.totalPending)}</strong>
                  </div>
                </>
              ) : (
                <div style={{ color: "#64748b", textAlign: "center", padding: "10px" }}>Select a customer account to view sales balance breakdown</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
