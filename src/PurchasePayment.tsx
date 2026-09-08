// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, CheckCircle, Trash2, Plus, ArrowLeft, ArrowRight, Printer, AlertTriangle, FileText, RefreshCw, ShoppingCart, Check, CreditCard, DollarSign, Building, User, Calendar, CheckSquare } from "lucide-react";
import { useMedicalStore, today, uid, num, fmt, int, inp, lbl, btn } from './MedicalStoreContext';

export default function PurchasePayment() {
  const {
    purchaseBills, savePurchaseBills,
    suppliers,
    payments, savePayments,
    bankEntries,
    showToast, showConfirm,
    setPrintHtml, setActiveSection
  } = useMedicalStore();

  // Local storage persisted purchase payment vouchers (v2)
  const [purchasePayments, setPurchasePayments] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('store_purchase_payments_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const savePurchasePaymentList = (list: any[]) => {
    setPurchasePayments(list);
    try {
      localStorage.setItem('store_purchase_payments_v2', JSON.stringify(list));
    } catch (_) {}
  };

  // Form / Workstation state
  const [showForm, setShowForm] = useState(false);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [overviewSearchQuery, setOverviewSearchQuery] = useState("");
  const [showFindModal, setShowFindModal] = useState(false);
  const [showChequeFormatModal, setShowChequeFormatModal] = useState(false);

  // Form Fields (Matches Page 14 of transection.pdf)
  const [voucherNo, setVoucherNo] = useState<string>("1");
  const [paymentDate, setPaymentDate] = useState<string>(today());
  const [paymentAmount, setPaymentAmount] = useState<string>("0.00");
  const [partyReceiptNo, setPartyReceiptNo] = useState<string>("");
  const [message, setMessage] = useState<string>("Payment disbursed towards purchase supplier bills");

  // Account / Supplier Selection
  const [accountInput, setAccountInput] = useState<string>("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Transfer pending amount checkbox & input
  const [transferPending, setTransferPending] = useState(false);
  const [transferAccount, setTransferAccount] = useState("");

  // Payment Mode (CASH / CHEQUE / NEFT)
  const [paymentMode, setPaymentMode] = useState<"CASH" | "CHEQUE" | "NEFT">("CASH");
  const [drawerBank, setDrawerBank] = useState<string>("STATE BANK OF INDIA - A/C 382910");
  const [supplierBank, setSupplierBank] = useState<string>("");
  const [chequeNo, setChequeNo] = useState<string>("");
  const [chequeSize, setChequeSize] = useState<string>("1000X400");
  const [printCopies, setPrintCopies] = useState<number>(1);

  // Table rows: Pending Purchase Invoices
  const [billRows, setBillRows] = useState<any[]>([]);

  // Distinct suppliers list from suppliers & purchaseBills
  const supplierList = useMemo(() => {
    const map = new Map<string, any>();
    (suppliers || []).forEach(s => {
      if (s.name && s.name.trim()) {
        map.set(s.name.trim().toLowerCase(), {
          id: s.id,
          name: s.name.trim(),
          phone: s.phone || s.mobile || "",
          gstin: s.gstin || "",
          bank: s.bankName || ""
        });
      }
    });

    (purchaseBills || []).forEach(b => {
      const name = b.supplierName || b.partyName;
      if (name && name.trim()) {
        const key = name.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: uid(),
            name: name.trim(),
            phone: "",
            gstin: "",
            bank: ""
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, purchaseBills]);

  // Next Voucher No generator
  const getNextVoucherNo = () => {
    if (purchasePayments.length === 0) return "1";
    const max = purchasePayments.reduce((m, r) => Math.max(m, int(r.voucherNo) || 0), 0);
    return String(max + 1);
  };

  // Start fresh Payment Voucher
  const handleNewPayment = () => {
    setActivePaymentId(null);
    setVoucherNo(getNextVoucherNo());
    setPaymentDate(today());
    setAccountInput("");
    setSelectedSupplierId("");
    setShowAccountDropdown(false);
    setPaymentAmount("0.00");
    setPartyReceiptNo("");
    setMessage("Payment disbursed towards purchase supplier bills");
    setPaymentMode("CASH");
    setSupplierBank("");
    setChequeNo("");
    setTransferPending(false);
    setTransferAccount("");
    setBillRows([]);
    setShowForm(true);
  };

  // Open existing payment voucher
  const handleOpenPayment = (pmt: any) => {
    if (!pmt) return;
    setActivePaymentId(pmt.id);
    setVoucherNo(String(pmt.voucherNo || "1"));
    setPaymentDate(pmt.paymentDate || pmt.date || today());
    setAccountInput(pmt.accountName || pmt.supplierName || "");
    setSelectedSupplierId(pmt.supplierId || "");
    setShowAccountDropdown(false);
    setPaymentAmount(fmt(pmt.amount || 0));
    setPartyReceiptNo(pmt.partyReceiptNo || "");
    setMessage(pmt.message || "");
    setPaymentMode(pmt.paymentMode || "CASH");
    setDrawerBank(pmt.drawerBank || "STATE BANK OF INDIA - A/C 382910");
    setSupplierBank(pmt.supplierBank || "");
    setChequeNo(pmt.chequeNo || "");
    setTransferPending(!!pmt.transferPending);
    setTransferAccount(pmt.transferAccount || "");
    setBillRows(pmt.bills || []);
    setShowForm(true);
    setShowFindModal(false);
  };

  // When Supplier is selected, fetch all pending/unpaid purchase bills for this supplier
  const handleSelectAccount = (supp: any) => {
    const suppName = typeof supp === "string" ? supp : supp.name;
    setAccountInput(suppName);
    setSelectedSupplierId(supp.id || "");
    setSupplierBank(supp.bank || "");
    setShowAccountDropdown(false);

    // Filter matching purchase bills
    const matchingBills = (purchaseBills || []).filter(b => {
      const bSupp = (b.supplierName || b.partyName || "").trim().toLowerCase();
      return bSupp === suppName.trim().toLowerCase();
    });

    if (matchingBills.length === 0) {
      // Create a default opening bill row if no purchase bills exist yet
      setBillRows([{
        id: uid(),
        srNo: 1,
        entryNo: "2026/001",
        entryDate: today(),
        billNo: "PUR-OP-01",
        billDate: today(),
        billAmount: fmt(4500),
        paidPrev: "0.00",
        paidToday: "0.00",
        pendingAmt: fmt(4500),
        status: "Unpaid",
        tmAmt: "0.00"
      }]);
      showToast(`Selected supplier: ${suppName} (Opening invoice loaded)`);
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
        entryNo: b.entryNo || `${idx + 1}`,
        entryDate: b.entryDate || b.date || today(),
        billNo: b.invoiceNo || b.billNo || `PB-${idx + 1}`,
        billDate: b.billDate || b.date || today(),
        billAmount: fmt(totalAmt),
        paidPrev: fmt(alreadyPaid),
        paidToday: "0.00",
        pendingAmt: fmt(dueAmt),
        status: dueAmt <= 0 ? "Paid" : alreadyPaid > 0 ? "Partial" : "Unpaid",
        tmAmt: "0.00"
      };
    });

    setBillRows(rows);
    showToast(`Loaded ${rows.length} purchase invoices for ${suppName}`);
  };

  // Update Paid Today on a specific bill row
  const handlePaidTodayChange = (index: number, val: string) => {
    const enteredPaid = num(val);
    setBillRows(prev => {
      const next = [...prev];
      const r = next[index];
      const billTotal = num(r.billAmount);
      const prevPaid = num(r.paidPrev);
      const discountTmAmt = num(r.tmAmt);
      const newPending = Math.max(0, billTotal - prevPaid - enteredPaid - discountTmAmt);

      r.paidToday = val;
      r.pendingAmt = fmt(newPending);
      r.status = newPending <= 0 ? "Full" : (prevPaid + enteredPaid) > 0 ? "Partial" : "Unpaid";

      // Re-sum total payment amount from all rows
      const totalPaidToday = next.reduce((s, row) => s + (num(row.paidToday) || 0), 0);
      setPaymentAmount(fmt(totalPaidToday));

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
      const discountTmAmt = num(r.tmAmt);
      const due = Math.max(0, billTotal - prevPaid - discountTmAmt);

      r.paidToday = fmt(due);
      r.pendingAmt = "0.00";
      r.status = "Full";

      const totalPaidToday = next.reduce((s, row) => s + (num(row.paidToday) || 0), 0);
      setPaymentAmount(fmt(totalPaidToday));

      return next;
    });
  };

  // F5 - Paid All (Mark full payment across all pending bills)
  const handlePaidAll = () => {
    setBillRows(prev => {
      const next = prev.map(r => {
        const billTotal = num(r.billAmount);
        const prevPaid = num(r.paidPrev);
        const discountTmAmt = num(r.tmAmt);
        const due = Math.max(0, billTotal - prevPaid - discountTmAmt);
        return {
          ...r,
          paidToday: fmt(due),
          pendingAmt: "0.00",
          status: "Full"
        };
      });

      const totalPaidToday = next.reduce((s, row) => s + (num(row.paidToday) || 0), 0);
      setPaymentAmount(fmt(totalPaidToday));
      return next;
    });
    showToast("F5: Full payment applied to all pending bills!");
  };

  // F4 - Pend All (Reset all Paid Today to 0)
  const handlePendAll = () => {
    setBillRows(prev => {
      return prev.map(r => {
        const billTotal = num(r.billAmount);
        const prevPaid = num(r.paidPrev);
        const discountTmAmt = num(r.tmAmt);
        const due = Math.max(0, billTotal - prevPaid - discountTmAmt);
        return {
          ...r,
          paidToday: "0.00",
          pendingAmt: fmt(due),
          status: prevPaid > 0 ? "Partial" : "Unpaid"
        };
      });
    });
    setPaymentAmount("0.00");
    showToast("F4: Reset all pending allocations!");
  };

  // Distribute entered Payment Amount across oldest pending bills automatically
  const handlePaymentAmountChange = (val: string) => {
    setPaymentAmount(val);
    let remainingToAllocate = num(val);

    setBillRows(prev => {
      return prev.map(r => {
        const billTotal = num(r.billAmount);
        const prevPaid = num(r.paidPrev);
        const discountTmAmt = num(r.tmAmt);
        const maxDue = Math.max(0, billTotal - prevPaid - discountTmAmt);

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

  // Save Purchase Payment Voucher
  const handleSave = () => {
    if (!accountInput.trim()) {
      showToast("Please select or enter a Supplier Account!", "error");
      return;
    }

    const totalAmt = num(paymentAmount);
    if (totalAmt <= 0) {
      showToast("Please enter a valid Payment Amount!", "error");
      return;
    }

    const paymentRecord = {
      id: activePaymentId || uid(),
      voucherNo,
      paymentDate,
      accountName: accountInput.trim(),
      supplierId: selectedSupplierId,
      amount: totalAmt,
      partyReceiptNo,
      paymentMode,
      drawerBank: paymentMode !== "CASH" ? drawerBank : "",
      supplierBank: paymentMode !== "CASH" ? supplierBank : "",
      chequeNo: paymentMode !== "CASH" ? chequeNo : "",
      message,
      transferPending,
      transferAccount,
      bills: billRows,
      createdAt: new Date().toISOString()
    };

    let updatedList;
    if (activePaymentId) {
      updatedList = purchasePayments.map(r => r.id === activePaymentId ? paymentRecord : r);
    } else {
      updatedList = [paymentRecord, ...purchasePayments];
    }
    savePurchasePaymentList(updatedList);

    // Sync to global payments for ledger & reports
    const globalPaymentRecord = {
      id: paymentRecord.id,
      voucherNo,
      date: paymentDate,
      type: "payment",
      partyName: accountInput.trim(),
      amount: totalAmt,
      mode: paymentMode.toLowerCase(),
      remarks: message,
      bank: drawerBank,
      chequeNo
    };

    const existingIdx = (payments || []).findIndex(p => p.id === paymentRecord.id);
    if (existingIdx >= 0) {
      const pList = [...payments];
      pList[existingIdx] = globalPaymentRecord;
      savePayments(pList);
    } else {
      savePayments([globalPaymentRecord, ...(payments || [])]);
    }

    // Update purchaseBills paid status
    const updatedPurchaseBills = (purchaseBills || []).map(b => {
      const match = billRows.find(br => br.billId === b.id || br.billNo === b.invoiceNo || br.billNo === b.billNo);
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
    savePurchaseBills(updatedPurchaseBills);

    setActivePaymentId(paymentRecord.id);
    showToast(`✅ Purchase Payment Voucher #${voucherNo} saved successfully!`);
  };

  // Delete Purchase Payment Voucher
  const handleDelete = () => {
    if (!activePaymentId) {
      showToast("This is an unsaved new voucher!", "info");
      return;
    }
    showConfirm(`Delete Purchase Payment Voucher #${voucherNo}?`, () => {
      const remaining = purchasePayments.filter(r => r.id !== activePaymentId);
      savePurchasePaymentList(remaining);
      const remainingGlobal = (payments || []).filter(p => p.id !== activePaymentId);
      savePayments(remainingGlobal);
      showToast(`Voucher #${voucherNo} deleted!`);
      handleNewPayment();
    });
  };

  // Sequential Navigation: Previous Voucher
  const handlePrevPayment = () => {
    if (purchasePayments.length === 0) return;
    const curIdx = purchasePayments.findIndex(r => r.id === activePaymentId);
    if (curIdx < 0 || curIdx >= purchasePayments.length - 1) {
      handleOpenPayment(purchasePayments[purchasePayments.length - 1]);
    } else {
      handleOpenPayment(purchasePayments[curIdx + 1]);
    }
  };

  // Sequential Navigation: Next Voucher
  const handleNextPayment = () => {
    if (purchasePayments.length === 0) return;
    const curIdx = purchasePayments.findIndex(r => r.id === activePaymentId);
    if (curIdx <= 0) {
      handleOpenPayment(purchasePayments[0]);
    } else {
      handleOpenPayment(purchasePayments[curIdx - 1]);
    }
  };

  // Print Payment Voucher
  const handlePrintVoucher = (onlySelected = false) => {
    const totalAmt = num(paymentAmount);
    if (totalAmt <= 0) {
      showToast("No payment amount to print!", "error");
      return;
    }

    const billsToPrint = onlySelected ? billRows.filter(r => num(r.paidToday) > 0) : billRows;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #0f172a; max-width: 750px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 6px;">
        <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase; color: #0284c7;">SHIV DHARA MEDICAL STORE</h2>
          <p style="margin: 2px 0; font-size: 11px; color: #64748b;">20, GIRIRAJ COMPLEX NIKOL GAAM ROAD, NIKOL, AHMEDABAD | PH: 079352 07999</p>
          <div style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 14px; border-radius: 12px; font-weight: 700; font-size: 11px; margin-top: 4px; border: 1px solid #bae6fd;">
            SUPPLIER PURCHASE PAYMENT DISBURSEMENT VOUCHER
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 10px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px;">
          <div>
            <strong>Voucher No:</strong> #${voucherNo}<br/>
            <strong>Paid To (Supplier):</strong> ${accountInput || "N/A"}<br/>
            <strong>Payment Mode:</strong> ${paymentMode} ${paymentMode !== 'CASH' ? `(${drawerBank} - Ref/Chq# ${chequeNo})` : ''}
          </div>
          <div style="text-align: right;">
            <strong>Payment Date:</strong> ${paymentDate}<br/>
            <strong>Party Receipt Ref:</strong> ${partyReceiptNo || "DIRECT"}<br/>
            <strong>Disbursement Time:</strong> ${new Date().toLocaleTimeString()}
          </div>
        </div>

        ${billsToPrint.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">Sr</th>
                <th style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">Entry No</th>
                <th style="padding: 4px; text-align: left; border: 1px solid #cbd5e1;">Supplier Bill No</th>
                <th style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">Bill Date</th>
                <th style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">Bill Amt</th>
                <th style="padding: 4px; text-align: right; border: 1px solid #cbd5e1; background: #e0f2fe;">Paid Today</th>
                <th style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">Balance Due</th>
              </tr>
            </thead>
            <tbody>
              ${billsToPrint.map((r, i) => `
                <tr>
                  <td style="padding: 3px; text-align: center; border: 1px solid #cbd5e1;">${i + 1}</td>
                  <td style="padding: 3px; text-align: center; border: 1px solid #cbd5e1;">${r.entryNo}</td>
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
              <strong>Narration / Remarks:</strong> ${message || "Towards settlement of supplier invoices"}
            </div>
            <div style="text-align: right;">
              <span style="font-size: 10px; color: #64748b;">Total Amount Paid:</span><br/>
              <strong style="font-size: 15px; color: #0284c7;">₹${fmt(totalAmt)}</strong>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 35px; font-size: 10px;">
          <div style="border-top: 1px solid #94a3b8; width: 140px; text-align: center;">Authorized Signatory</div>
          <div style="border-top: 1px solid #94a3b8; width: 140px; text-align: center;">Supplier Receipt Stamp</div>
        </div>
      </div>
    `;

    setPrintHtml(html);
  };

  // Print Cheque Slip (CTS-2010 compliant visual cheque)
  const handlePrintCheque = () => {
    const totalAmt = num(paymentAmount);
    if (totalAmt <= 0) {
      showToast("No payment amount for cheque printing!", "error");
      return;
    }

    const html = `
      <div style="font-family: 'Courier New', Courier, monospace; width: 8in; height: 3.5in; padding: 0.4in; border: 1px dashed #64748b; margin: 20px auto; position: relative; background: #fffdf5; box-sizing: border-box;">
        <div style="position: absolute; top: 0.4in; right: 0.5in; font-weight: bold; letter-spacing: 4px; font-size: 13px;">
          ${paymentDate.replace(/-/g, ' ')}
        </div>

        <div style="position: absolute; top: 1.1in; left: 1.2in; font-weight: bold; font-size: 14px; text-transform: uppercase;">
          *** ${accountInput || "SUPPLIER"} ***
        </div>

        <div style="position: absolute; top: 1.55in; left: 1.4in; font-weight: bold; font-size: 12px; width: 4.8in; line-height: 1.4; text-transform: uppercase;">
          RUPEES ${fmt(totalAmt)} ONLY
        </div>

        <div style="position: absolute; top: 1.6in; right: 0.6in; font-weight: bold; font-size: 15px; border: 1px solid #000; padding: 4px 10px; background: white;">
          ₹ ${fmt(totalAmt)} /-
        </div>

        <div style="position: absolute; top: 0.3in; left: 0.4in; font-size: 10px; border: 1px solid #000; padding: 2px 4px;">
          A/C PAYEE ONLY
        </div>

        <div style="position: absolute; bottom: 0.5in; right: 0.6in; text-align: center; font-size: 10px; font-weight: bold;">
          For SHIV DHARA MEDICAL STORE<br/><br/><br/>
          Authorised Signatory
        </div>

        <div style="position: absolute; bottom: 0.2in; left: 2.2in; font-size: 11px; letter-spacing: 5px;">
          ||'${chequeNo || '000000'}'|| 382002015: 000000' 29
        </div>
      </div>
    `;

    setPrintHtml(html);
  };

  // Keyboard shortcut listener (F2 Save, F4 Pend All, F5 Paid All, Esc Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "F4") {
        e.preventDefault();
        handlePendAll();
      } else if (e.key === "F5") {
        e.preventDefault();
        handlePaidAll();
      } else if (e.key === "F6") {
        e.preventDefault();
        setTransferPending(prev => !prev);
      } else if (e.key === "Escape") {
        if (showAccountDropdown) {
          setShowAccountDropdown(false);
        } else if (showFindModal) {
          setShowFindModal(false);
        } else if (showForm) {
          setShowForm(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm, showAccountDropdown, showFindModal, voucherNo, paymentDate, accountInput, paymentAmount, paymentMode, billRows]);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: SINGLE CENTER BUTTON (When no form open) — strictly Rule #2
  // ══════════════════════════════════════════════════════════════════════════════
  if (!showForm) {
    const filteredPayments = (overviewSearchQuery.trim() ? purchasePayments.filter(r => 
      String(r.voucherNo || "").toLowerCase().includes(overviewSearchQuery.toLowerCase()) ||
      String(r.accountName || "").toLowerCase().includes(overviewSearchQuery.toLowerCase()) ||
      String(r.paymentDate || "").includes(overviewSearchQuery)
    ) : purchasePayments).slice(0, 15);

    return (
      <div style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header Title with Search Bar (Clean Blue Accent - Image 2 Theme) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>💳</span> Purchase Payment ({purchasePayments.length})
            </h2>
            <span style={{ background: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
              Supplier Invoice Settlement
            </span>
          </div>

          <div style={{ position: "relative", minWidth: "280px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "8px", color: "#64748b" }} />
            <input
              placeholder="Search Voucher#, Supplier, Date... + Enter"
              value={overviewSearchQuery}
              onChange={e => setOverviewSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && filteredPayments.length > 0) {
                  handleOpenPayment(filteredPayments[0]);
                }
              }}
              style={{ ...inp, paddingLeft: "30px", background: "white", borderColor: "#cbd5e1" }}
            />
          </div>
        </div>

        {/* ── SINGLE CENTER BUTTON WORKSPACE (Strict Rule #2: Only Center Button) ── */}
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "8px", border: "1px dashed #cbd5e1", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "44px", opacity: 0.8, marginBottom: "8px" }}>💳</div>
          <h3 style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "17px", color: "var(--color-text-dark)" }}>
            Supplier Purchase Payment & Invoice Clearance
          </h3>
          <p style={{ fontSize: "12px", color: "#64748b", maxWidth: "520px", margin: "0 auto 18px", lineHeight: "1.5" }}>
            Disburse payments to medicine suppliers (Cash, Cheque, NEFT/RTGS). Clear inward purchase invoices, print official disbursement vouchers, and generate CTS cheques.
          </p>

          {/* SINGLE CENTER BUTTON */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button 
              onClick={handleNewPayment} 
              style={{ ...btn("#0284c7", "white"), padding: "10px 24px", fontSize: "14px", fontWeight: "700", borderRadius: "6px" }}
            >
              ➕ New Purchase Payment
            </button>
          </div>
        </div>

        {/* Recent Purchase Payments Table */}
        {purchasePayments.length > 0 && (
          <div style={{ marginTop: "24px", background: "white", borderRadius: "8px", border: "1px solid #cbd5e1", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                📋 Recent Purchase Payment Vouchers ({purchasePayments.length})
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Click on any payment voucher to view or edit</div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", color: "#475569", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "80px" }}>Voucher#</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Supplier / Creditor Name</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "110px" }}>Payment Date</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "100px" }}>Mode</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", width: "130px" }}>Amount Paid</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Bank / Narration</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(pmt => (
                    <tr 
                      key={pmt.id}
                      onClick={() => handleOpenPayment(pmt)}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "700", color: "#0284c7" }}>
                        #{pmt.voucherNo}
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: "600", color: "#1e293b" }}>
                        {pmt.accountName}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", color: "#64748b" }}>
                        {pmt.paymentDate}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "10px",
                          fontWeight: "700",
                          background: pmt.paymentMode === "CASH" ? "#dcfce7" : "#eff6ff",
                          color: pmt.paymentMode === "CASH" ? "#15803d" : "#0284c7"
                        }}>
                          {pmt.paymentMode}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: "#0284c7" }}>
                        ₹{fmt(pmt.amount || 0)}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#64748b", fontSize: "11px" }}>
                        {pmt.drawerBank || pmt.message || "-"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenPayment(pmt)} 
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
  // RENDER: FULL INTERACTIVE PURCHASE PAYMENT SCREEN (Matches Page 14 + Image 2 Theme)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: "white", borderRadius: "8px", border: "1px solid #cbd5e1", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", minHeight: "85vh" }}>
      
      {/* ── TOP HEADER / ACCOUNT BAR (MATCHES SCREENSHOT PAGE 14) ── */}
      <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", flexDirection: "column", gap: "8px" }}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          
          {/* Select Account Input with popup auto-suggest list */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, maxWidth: "550px", position: "relative" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#1e293b", minWidth: "95px" }}>Select Account:</span>
            
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type="text"
                placeholder="Type or search Supplier / Agency Account Name..."
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
                    const matches = supplierList.filter(s => !q || s.name.toLowerCase().includes(q) || s.phone.includes(q));

                    if (matches.length === 0) {
                      return <div style={{ padding: "8px 12px", fontSize: "11px", color: "#64748b" }}>No supplier accounts found</div>;
                    }

                    return matches.map((supp, i) => (
                      <div
                        key={i}
                        onMouseDown={() => handleSelectAccount(supp)}
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
                        <div>
                          <span style={{ fontWeight: "700", color: "#0f172a" }}>{supp.name}</span>
                          {supp.gstin && <span style={{ fontSize: "9px", color: "#64748b", marginLeft: "6px" }}>({supp.gstin})</span>}
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>{supp.phone}</div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Voucher No & Shortcut Badges (F4, F5, F6, F8) */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Voucher No:</span>
              <input
                type="text"
                value={voucherNo}
                onChange={e => setVoucherNo(e.target.value)}
                style={{ ...inp, width: "65px", height: "26px", fontSize: "11px", fontWeight: "700", textAlign: "center", color: "#0284c7" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: "700" }}>
              <button onClick={handlePendAll} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "2px 6px", borderRadius: "4px", color: "#475569", cursor: "pointer" }}>
                F4 - Pend All
              </button>
              <button onClick={handlePaidAll} style={{ background: "#e0f2fe", border: "1px solid #bae6fd", padding: "2px 6px", borderRadius: "4px", color: "#0369a1", cursor: "pointer" }}>
                F5 - Paid All
              </button>
              <span style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "2px 6px", borderRadius: "4px", color: "#475569" }}>
                F6 - Transfer Entry
              </span>
              <span style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "2px 6px", borderRadius: "4px", color: "#475569" }}>
                F8 - Payment
              </span>
            </div>

            <button onClick={() => setShowForm(false)} style={{ ...btn("#475569", "white"), padding: "3px 10px", fontSize: "11px" }}>
              ✕ Close
            </button>
          </div>

        </div>

      </div>

      {/* ── PENDING PURCHASE INVOICES GRID (MATCHES SCREENSHOT PAGE 14) ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", color: "#334155", textAlign: "center", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #cbd5e1" }}>
              <th style={{ padding: "6px 4px", width: "35px", borderRight: "1px solid #e2e8f0" }}>Sr.</th>
              <th style={{ padding: "6px 6px", width: "70px", borderRight: "1px solid #e2e8f0" }}>Entry</th>
              <th style={{ padding: "6px 6px", width: "80px", borderRight: "1px solid #e2e8f0" }}>Entry Dt</th>
              <th style={{ padding: "6px 8px", textAlign: "left", width: "110px", borderRight: "1px solid #e2e8f0" }}>Bill No</th>
              <th style={{ padding: "6px 6px", width: "80px", borderRight: "1px solid #e2e8f0" }}>P.BillDate</th>
              <th style={{ padding: "6px 6px", width: "85px", borderRight: "1px solid #e2e8f0", textAlign: "right" }}>Bill Amt</th>
              <th style={{ padding: "6px 6px", width: "80px", borderRight: "1px solid #e2e8f0", textAlign: "right" }}>Paid Prev.</th>
              <th style={{ padding: "6px 6px", width: "95px", borderRight: "1px solid #e2e8f0", textAlign: "right", background: "#e0f2fe", color: "#0369a1" }}>Paid Today</th>
              <th style={{ padding: "6px 6px", width: "85px", borderRight: "1px solid #e2e8f0", textAlign: "right" }}>Pend Amt</th>
              <th style={{ padding: "6px 6px", width: "65px", borderRight: "1px solid #e2e8f0" }}>Status</th>
              <th style={{ padding: "6px 6px", width: "70px", borderRight: "1px solid #e2e8f0", textAlign: "right" }}>Tm.Amt</th>
              <th style={{ padding: "6px 4px", width: "65px" }}>Quick</th>
            </tr>
          </thead>
          <tbody>
            {billRows.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: "50px 20px", textAlign: "center", color: "#64748b" }}>
                  <div style={{ fontSize: "32px", opacity: 0.5, marginBottom: "8px" }}>📦</div>
                  <div style={{ fontWeight: "700", fontSize: "13px" }}>Please select a Supplier Account to load pending purchase bills</div>
                  <div style={{ fontSize: "11px", marginTop: "4px" }}>Invoices awaiting payment clearance will appear here</div>
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
                  <td style={{ padding: "4px 6px", textAlign: "center", color: "#0284c7", fontWeight: "700", borderRight: "1px solid #e2e8f0" }}>
                    {row.entryNo}
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "center", color: "#64748b", borderRight: "1px solid #e2e8f0" }}>
                    {row.entryDate}
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

                  {/* Pend Amt */}
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

                  {/* Tm.Amt */}
                  <td style={{ padding: "4px 6px", textAlign: "right", color: "#64748b", borderRight: "1px solid #e2e8f0" }}>
                    ₹{fmt(row.tmAmt)}
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

      {/* ── TRANSFER PENDING & PARTY RECEIPT NO BAR (MATCHES SCREENSHOT PAGE 14) ── */}
      <div style={{ padding: "6px 14px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", fontSize: "11px" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={handleSave} style={{ ...btn("#0284c7", "white"), padding: "2px 10px", fontSize: "11px", fontWeight: "700" }}>
            OK
          </button>
          <button onClick={handleDelete} style={{ ...btn("#fee2e2", "#dc2626"), padding: "2px 8px", fontSize: "11px", border: "1px solid #fecaca" }}>
            Delete
          </button>
          
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "600", color: "#334155", marginLeft: "12px" }}>
            <input
              type="checkbox"
              checked={transferPending}
              onChange={e => setTransferPending(e.target.checked)}
            />
            Transfer Pending Amount in:
          </label>
          <input
            type="text"
            placeholder="Transfer Ledger / Account (F6)..."
            disabled={!transferPending}
            value={transferAccount}
            onChange={e => setTransferAccount(e.target.value)}
            style={{ ...inp, width: "240px", height: "24px", fontSize: "11px", background: transferPending ? "white" : "#f1f5f9" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontWeight: "700", color: "#334155" }}>Party Receipt No:</span>
          <input
            type="text"
            placeholder="Supplier Ref Receipt..."
            value={partyReceiptNo}
            onChange={e => setPartyReceiptNo(e.target.value)}
            style={{ ...inp, width: "140px", height: "24px", fontSize: "11px", background: "white" }}
          />
        </div>

      </div>

      {/* ── PAYMENT RECEIVED BY / PAYMENT MODE & DETAILS (MATCHES BOX IN SCREENSHOT) ── */}
      <div style={{ padding: "10px 14px", background: "#f1f5f9", borderTop: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        
        {/* PAYMENT PAID BY BOX (CASH, CHEQUE, NEFT) */}
        <div style={{ background: "white", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", minWidth: "260px", flex: 1, maxWidth: "340px" }}>
          <div style={{ fontSize: "11px", fontWeight: "800", color: "#0284c7", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px", marginBottom: "8px", textTransform: "uppercase" }}>
            PAYMENT RECEIVED BY (MODE)
          </div>

          <div style={{ display: "flex", gap: "16px", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <input
                type="radio"
                name="pmtMode"
                checked={paymentMode === "CASH"}
                onChange={() => setPaymentMode("CASH")}
              />
              CASH
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <input
                type="radio"
                name="pmtMode"
                checked={paymentMode === "CHEQUE"}
                onChange={() => setPaymentMode("CHEQUE")}
              />
              CHEQUE
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <input
                type="radio"
                name="pmtMode"
                checked={paymentMode === "NEFT"}
                onChange={() => setPaymentMode("NEFT")}
              />
              NEFT
            </label>
          </div>

          {/* Drawer Bank Selection */}
          <div style={{ fontSize: "11px", color: "#475569" }}>
            <span style={{ fontWeight: "700", display: "block", marginBottom: "2px" }}>Chq.Given of Bank:</span>
            <select
              value={drawerBank}
              onChange={e => setDrawerBank(e.target.value)}
              disabled={paymentMode === "CASH"}
              style={{ ...inp, height: "26px", fontSize: "11px", background: paymentMode === "CASH" ? "#f1f5f9" : "white" }}
            >
              <option value="STATE BANK OF INDIA - A/C 382910">STATE BANK OF INDIA - A/C 382910</option>
              <option value="HDFC BANK - A/C 50200084">HDFC BANK - A/C 50200084</option>
              <option value="BANK OF BARODA - A/C 192837">BANK OF BARODA - A/C 192837</option>
              <option value="KOTAK MAHINDRA BANK - A/C 992817">KOTAK MAHINDRA BANK - A/C 992817</option>
            </select>
          </div>
        </div>

        {/* Date, Amount, Supplier Bank, ChqNo, Message */}
        <div style={{ flex: 1.5, minWidth: "340px", display: "flex", flexDirection: "column", gap: "6px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", width: "55px", color: "#334155" }}>Date..:</span>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                style={{ ...inp, height: "26px", fontSize: "11px", width: "130px", background: "white" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", width: "45px", color: "#334155" }}>Bank :</span>
              <input
                type="text"
                placeholder="Supplier's Bank Name"
                disabled={paymentMode === "CASH"}
                value={supplierBank}
                onChange={e => setSupplierBank(e.target.value)}
                style={{ ...inp, height: "26px", fontSize: "11px", width: "180px", background: paymentMode === "CASH" ? "#f1f5f9" : "white" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", width: "55px", color: "#334155" }}>Amount :</span>
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={e => handlePaymentAmountChange(e.target.value)}
                style={{
                  ...inp,
                  height: "28px",
                  fontSize: "14px",
                  fontWeight: "800",
                  width: "130px",
                  textAlign: "right",
                  background: "white",
                  color: "#0284c7",
                  borderColor: "#7dd3fc"
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", width: "45px", color: "#334155" }}>ChqNo:</span>
              <input
                type="text"
                placeholder="Cheque / UTR No"
                disabled={paymentMode === "CASH"}
                value={chequeNo}
                onChange={e => setChequeNo(e.target.value)}
                style={{ ...inp, height: "26px", fontSize: "11px", width: "180px", background: paymentMode === "CASH" ? "#f1f5f9" : "white" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", width: "55px", color: "#334155" }}>Message:</span>
            <input
              type="text"
              placeholder="Narration / Payment purpose / Note..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{ ...inp, height: "26px", fontSize: "11px", flex: 1, background: "white" }}
            />
          </div>

        </div>

      </div>

      {/* ── BOTTOM ACTION TOOLBAR (MATCHES SCREENSHOT PAGE 14 BUTTONS) ── */}
      <div style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        
        {/* Row 1 Action Buttons */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={handleNewPayment} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 12px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            New
          </button>

          <button onClick={handleSave} style={{ ...btn("#0284c7", "white"), padding: "5px 16px", fontSize: "11px", fontWeight: "700" }} title="Save Purchase Payment (F2)">
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
            <button onClick={() => handlePrintVoucher(false)} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
              Print
            </button>
          </div>

          <button onClick={() => handlePrintVoucher(true)} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Print only selected bills">
            Print Sel
          </button>

          {/* Cheque Print Size & Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <select
              value={chequeSize}
              onChange={e => setChequeSize(e.target.value)}
              style={{ ...inp, height: "26px", fontSize: "10px", width: "90px", padding: "2px", border: "1px solid #cbd5e1" }}
            >
              <option value="1000X400">1000X400</option>
              <option value="800X350">800X350</option>
              <option value="STANDARD">STANDARD</option>
            </select>
            <button onClick={handlePrintCheque} style={{ ...btn("#f1f5f9", "#0284c7"), padding: "5px 10px", fontSize: "11px", fontWeight: "700", border: "1px solid #bae6fd" }} title="Print Cheque Slip">
              Print Cheque
            </button>
          </div>

          {/* Sequential Navigation: Prev < and Next > */}
          <button onClick={handlePrevPayment} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Previous Payment Voucher">
            &lt;
          </button>
          <button onClick={handleNextPayment} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Next Payment Voucher">
            &gt;
          </button>

          <button onClick={() => setShowFindModal(true)} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 11px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            Find
          </button>

          <button onClick={() => setShowFindModal(true)} style={{ ...btn("#f1f5f9", "#334155"), padding: "5px 11px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            List
          </button>
        </div>

        {/* Close Button */}
        <button onClick={() => setShowForm(false)} style={{ ...btn("#475569", "white"), padding: "5px 16px", fontSize: "11px", fontWeight: "700" }}>
          Close (Esc)
        </button>

      </div>

      {/* ── FIND VOUCHER MODAL ── */}
      {showFindModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "8px", width: "100%", maxWidth: "580px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>🔍 Find Purchase Payment Voucher</div>
              <button onClick={() => setShowFindModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>

            <div style={{ padding: "8px", overflowY: "auto", flex: 1 }}>
              {purchasePayments.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No payment vouchers found</div>
              ) : (
                purchasePayments.map(pmt => (
                  <div
                    key={pmt.id}
                    onClick={() => handleOpenPayment(pmt)}
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
                        Voucher #{pmt.voucherNo} — {pmt.accountName}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Date: {pmt.paymentDate} | Mode: {pmt.paymentMode} {pmt.chequeNo ? `(Ref# ${pmt.chequeNo})` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "800", color: "#0284c7" }}>₹{fmt(pmt.amount)}</div>
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
