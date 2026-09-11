// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, CheckCircle, Trash2, Plus, ArrowLeft, ArrowRight, Printer, AlertTriangle, FileText, RefreshCw, ShoppingCart, Check, CreditCard, DollarSign, Building, User, Calendar, MessageSquare } from "lucide-react";
import { useMedicalStore, today, uid, num, fmt, int, inp, lbl, btn } from './MedicalStoreContext';

export default function BankEntry() {
  const {
    payments, savePayments,
    salesBills, purchaseBills,
    suppliers, khataEntries,
    showToast, showConfirm,
    setPrintHtml, setActiveSection
  } = useMedicalStore();

  // Local storage persisted Bank Accounts in Account Master
  const [bankAccounts, setBankAccounts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('store_bank_accounts_v2');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      { id: "b1", bankName: "STATE BANK OF INDIA", branch: "NIKOL AHMEDABAD", acNo: "38291083921", ifsc: "SBIN0016084", balance: 485210.50 },
      { id: "b2", bankName: "HDFC BANK", branch: "BAPUNAGAR", acNo: "5020008492019", ifsc: "HDFC0001092", balance: 294150.00 },
      { id: "b3", bankName: "BANK OF BARODA", branch: "ODHAV ROAD", acNo: "1928374619283", ifsc: "BARB0ODHAVX", balance: 187420.75 },
      { id: "b4", bankName: "KOTAK MAHINDRA BANK", branch: "VASTRAL", acNo: "992817264810", ifsc: "KKBK0000821", balance: 95300.00 }
    ];
  });

  // Local storage persisted Bank Vouchers (v2)
  const [bankVouchers, setBankVouchers] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('store_bank_vouchers_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const saveBankVoucherList = (list: any[]) => {
    setBankVouchers(list);
    try {
      localStorage.setItem('store_bank_vouchers_v2', JSON.stringify(list));
    } catch (_) {}
  };

  // Form / Workstation State
  const [showForm, setShowForm] = useState(true);
  const [activeVoucherId, setActiveVoucherId] = useState<string | null>(null);
  const [overviewSearchQuery, setOverviewSearchQuery] = useState("");
  const [showFindModal, setShowFindModal] = useState(false);
  const [showBankSelectModal, setShowBankSelectModal] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState("10:27:07");

  useEffect(() => {
    const handleNew = () => handleNewVoucher();
    const handleKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        handleNewVoucher();
      }
    };
    window.addEventListener("new_bank_entry", handleNew);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("new_bank_entry", handleNew);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Selected Bank for this Entry
  const [selectedBank, setSelectedBank] = useState<any>(bankAccounts[0] || null);

  // Voucher Header Fields (Matches Page 16 of transection.pdf)
  const [vchNo, setVchNo] = useState<string>("1");
  const [lastEntryNo, setLastEntryNo] = useState<string>("0");
  const [entryDate, setEntryDate] = useState<string>(today());

  // Current Entry Input Fields
  const [accountName, setAccountName] = useState<string>("");
  const [dwType, setDwType] = useState<"D" | "W">("D"); // D for Deposit, W for Withdraw
  const [chqNo, setChqNo] = useState<string>("");
  const [partyBankName, setPartyBankName] = useState<string>("");
  const [salesman, setSalesman] = useState<string>("ADMIN");
  const [inFavorOf, setInFavorOf] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Table rows in current voucher
  const [voucherRows, setVoucherRows] = useState<any[]>([]);

  // Update live clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTimeStr(d.toTimeString().split(' ')[0]);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Account Suggestions (Suppliers, Customers, Common Expense & Capital Heads)
  const accountSuggestions = useMemo(() => {
    const set = new Set<string>();
    
    // Ledger accounts
    ["Cash in Hand", "Shop Rent Expense", "Electricity Bill", "Staff Salary", "GST Tax Payment", "Income Tax Payment", "Loan Account", "Owner Capital Account"].forEach(e => set.add(e));

    // Suppliers
    (suppliers || []).forEach(s => {
      if (s.name) set.add(s.name.trim());
    });

    // Customers
    (salesBills || []).forEach(b => {
      const name = b.customerName || b.patientName;
      if (name && name !== "Counter Sale") set.add(name.trim());
    });

    (khataEntries || []).forEach(k => {
      if (k.customerName) set.add(k.customerName.trim());
    });

    return Array.from(set).sort();
  }, [suppliers, salesBills, khataEntries]);

  // Next Voucher No generator
  const getNextVchNo = () => {
    if (bankVouchers.length === 0) return "1";
    const max = bankVouchers.reduce((m, r) => Math.max(m, int(r.vchNo) || 0), 0);
    return String(max + 1);
  };

  // Start fresh Bank Entry
  const handleNewVoucher = () => {
    setActiveVoucherId(null);
    setVchNo(getNextVchNo());
    setLastEntryNo(bankVouchers.length > 0 ? String(bankVouchers[0].vchNo || 0) : "0");
    setEntryDate(today());
    setAccountName("");
    setDwType("D");
    setChqNo("");
    setPartyBankName("");
    setSalesman("ADMIN");
    setInFavorOf("");
    setAmount("");
    setRemark("");
    setVoucherRows([]);
    setShowForm(true);
    setShowBankSelectModal(true); // Open bank selection list on fresh entry (matches screenshot)
  };

  // Open existing bank voucher
  const handleOpenVoucher = (vch: any) => {
    if (!vch) return;
    setActiveVoucherId(vch.id);
    setVchNo(String(vch.vchNo || "1"));
    setLastEntryNo(String(vch.lastEntryNo || "0"));
    setEntryDate(vch.date || today());
    const matchedBank = bankAccounts.find(b => b.id === vch.bankId || b.bankName === vch.bankName);
    if (matchedBank) setSelectedBank(matchedBank);
    setVoucherRows(vch.rows || []);
    setAccountName("");
    setAmount("");
    setRemark("");
    setShowForm(true);
    setShowFindModal(false);
  };

  // Select Bank from Modal
  const handleSelectBankFromModal = (bank: any) => {
    setSelectedBank(bank);
    setShowBankSelectModal(false);
    showToast(`Selected Bank: ${bank.bankName} (A/C ${bank.acNo})`);
  };

  // Add Row to current voucher
  const handleAddRow = () => {
    if (!accountName.trim()) {
      showToast("Please enter an Account Name!", "error");
      return;
    }
    const val = num(amount);
    if (val <= 0) {
      showToast("Please enter a valid Amount!", "error");
      return;
    }

    const newRow = {
      id: uid(),
      accountName: accountName.trim(),
      dw: dwType,
      chqNo: chqNo.trim() || "-",
      partyBankName: partyBankName.trim() || "-",
      salesman: salesman.trim() || "ADMIN",
      inFavorOf: inFavorOf.trim() || accountName.trim(),
      amount: val,
      remark: remark.trim() || (dwType === "D" ? "Bank Deposit" : "Bank Withdrawal / Cheque")
    };

    setVoucherRows(prev => [...prev, newRow]);
    setAccountName("");
    setAmount("");
    setChqNo("");
    setPartyBankName("");
    setInFavorOf("");
    setRemark("");
    showToast(`Added: ${newRow.accountName} (${newRow.dw === 'D' ? 'Deposit' : 'Withdraw'} - ₹${fmt(newRow.amount)})`);
  };

  // Remove Row
  const handleRemoveRow = (idx: number) => {
    setVoucherRows(prev => prev.filter((_, i) => i !== idx));
  };

  // Summary totals
  const totalWithdrawAmt = useMemo(() => {
    return voucherRows.filter(r => r.dw === "W").reduce((s, r) => s + num(r.amount), 0);
  }, [voucherRows]);

  const totalDepositAmt = useMemo(() => {
    return voucherRows.filter(r => r.dw === "D").reduce((s, r) => s + num(r.amount), 0);
  }, [voucherRows]);

  // Save Bank Voucher
  const handleSave = () => {
    let rowsToSave = [...voucherRows];

    // If inputs have active un-added content, add it automatically
    if (accountName.trim() && num(amount) > 0) {
      const autoRow = {
        id: uid(),
        accountName: accountName.trim(),
        dw: dwType,
        chqNo: chqNo.trim() || "-",
        partyBankName: partyBankName.trim() || "-",
        salesman: salesman.trim() || "ADMIN",
        inFavorOf: inFavorOf.trim() || accountName.trim(),
        amount: num(amount),
        remark: remark.trim() || (dwType === "D" ? "Bank Deposit" : "Bank Withdrawal")
      };
      rowsToSave.push(autoRow);
      setVoucherRows(rowsToSave);
      setAccountName("");
      setAmount("");
      setChqNo("");
      setRemark("");
    }

    if (rowsToSave.length === 0) {
      showToast("Please add at least one bank entry row before saving!", "error");
      return;
    }

    const record = {
      id: activeVoucherId || uid(),
      vchNo,
      lastEntryNo,
      date: entryDate,
      time: currentTimeStr,
      bankId: selectedBank?.id,
      bankName: selectedBank?.bankName || "STATE BANK OF INDIA",
      bankAcNo: selectedBank?.acNo || "",
      rows: rowsToSave,
      totalWithdraw: rowsToSave.filter(r => r.dw === "W").reduce((s, r) => s + num(r.amount), 0),
      totalDeposit: rowsToSave.filter(r => r.dw === "D").reduce((s, r) => s + num(r.amount), 0),
      createdAt: new Date().toISOString()
    };

    let updatedList;
    if (activeVoucherId) {
      updatedList = bankVouchers.map(v => v.id === activeVoucherId ? record : v);
    } else {
      updatedList = [record, ...bankVouchers];
    }
    saveBankVoucherList(updatedList);

    // Update bank balance in bankAccounts
    const netChange = record.totalDeposit - record.totalWithdraw;
    if (selectedBank) {
      const updatedBanks = bankAccounts.map(b => {
        if (b.id === selectedBank.id) {
          return { ...b, balance: b.balance + netChange };
        }
        return b;
      });
      setBankAccounts(updatedBanks);
      try {
        localStorage.setItem('store_bank_accounts_v2', JSON.stringify(updatedBanks));
      } catch (_) {}
    }

    // Sync to global payments for ledger & audit
    rowsToSave.forEach(r => {
      const pRecord = {
        id: r.id || uid(),
        voucherNo: vchNo,
        date: entryDate,
        type: r.dw === "D" ? "receipt" : "payment",
        partyName: r.accountName,
        amount: r.amount,
        mode: "bank",
        bank: selectedBank?.bankName || "BANK A/C",
        chequeNo: r.chqNo,
        remarks: `Bank Entry - ${r.remark}`
      };

      const existingIdx = (payments || []).findIndex(p => p.id === pRecord.id);
      if (existingIdx >= 0) {
        const list = [...payments];
        list[existingIdx] = pRecord;
        savePayments(list);
      } else {
        savePayments([pRecord, ...(payments || [])]);
      }
    });

    setActiveVoucherId(record.id);
    showToast(`✅ Bank Entry Voucher #${vchNo} saved successfully!`);
  };

  // Delete Bank Voucher
  const handleDelete = () => {
    if (!activeVoucherId) {
      showToast("This is an unsaved new voucher!", "info");
      return;
    }
    showConfirm(`Delete Bank Entry Voucher #${vchNo}?`, () => {
      const remaining = bankVouchers.filter(v => v.id !== activeVoucherId);
      saveBankVoucherList(remaining);
      showToast(`Voucher #${vchNo} deleted!`);
      handleNewVoucher();
    });
  };

  // Sequential Navigation: Prev < and Next >
  const handlePrevVoucher = () => {
    if (bankVouchers.length === 0) return;
    const curIdx = bankVouchers.findIndex(v => v.id === activeVoucherId);
    if (curIdx < 0 || curIdx >= bankVouchers.length - 1) {
      handleOpenVoucher(bankVouchers[bankVouchers.length - 1]);
    } else {
      handleOpenVoucher(bankVouchers[curIdx + 1]);
    }
  };

  const handleNextVoucher = () => {
    if (bankVouchers.length === 0) return;
    const curIdx = bankVouchers.findIndex(v => v.id === activeVoucherId);
    if (curIdx <= 0) {
      handleOpenVoucher(bankVouchers[0]);
    } else {
      handleOpenVoucher(bankVouchers[curIdx - 1]);
    }
  };

  // Print Bank Voucher / Receipt
  const handlePrint = (type = "Voucher") => {
    if (voucherRows.length === 0) {
      showToast("No bank entries to print!", "error");
      return;
    }

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #0f172a; max-width: 750px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 6px;">
        <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase; color: #0284c7;">SHIV DHARA MEDICAL STORE</h2>
          <p style="margin: 2px 0; font-size: 11px; color: #64748b;">20, GIRIRAJ COMPLEX NIKOL GAAM ROAD, NIKOL, AHMEDABAD | PH: 079352 07999</p>
          <div style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 14px; border-radius: 12px; font-weight: 700; font-size: 11px; margin-top: 4px; border: 1px solid #bae6fd;">
            OFFICIAL BANK ${type.toUpperCase()}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 10px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px;">
          <div>
            <strong>Voucher No:</strong> #${vchNo}<br/>
            <strong>Store Bank:</strong> ${selectedBank?.bankName} (A/C: ${selectedBank?.acNo})<br/>
            <strong>Branch / IFSC:</strong> ${selectedBank?.branch} | ${selectedBank?.ifsc}
          </div>
          <div style="text-align: right;">
            <strong>Date:</strong> ${entryDate}<br/>
            <strong>Time:</strong> ${currentTimeStr}<br/>
            <strong>Operator:</strong> ${salesman || "ADMIN"}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px;">
          <thead>
            <tr style="background: #f1f5f9; color: #334155; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 35px;">Sr</th>
              <th style="padding: 5px; text-align: left; border: 1px solid #cbd5e1;">Account Name</th>
              <th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 60px;">D / W</th>
              <th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 80px;">Chq / Ref#</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 100px;">Amount</th>
              <th style="padding: 5px; text-align: left; border: 1px solid #cbd5e1;">Remark / Narration</th>
            </tr>
          </thead>
          <tbody>
            ${voucherRows.map((r, i) => `
              <tr>
                <td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">${i + 1}</td>
                <td style="padding: 4px; border: 1px solid #cbd5e1;"><strong>${r.accountName}</strong></td>
                <td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: ${r.dw === 'D' ? '#16a34a' : '#0284c7'};">${r.dw === 'D' ? 'DEPOSIT' : 'WITHDRAW'}</td>
                <td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">${r.chqNo}</td>
                <td style="padding: 4px; text-align: right; border: 1px solid #cbd5e1; font-weight: bold;">₹${fmt(r.amount)}</td>
                <td style="padding: 4px; border: 1px solid #cbd5e1; color: #64748b;">${r.remark || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="background: #f8fafc; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>Total Deposited (D):</strong> <span style="color: #16a34a; font-weight: bold;">₹${fmt(totalDepositAmt)}</span><br/>
            <strong>Total Withdrawn (W):</strong> <span style="color: #0284c7; font-weight: bold;">₹${fmt(totalWithdrawAmt)}</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 10px; color: #64748b;">Net Bank Impact:</span><br/>
            <strong style="font-size: 15px; color: #0f172a;">₹${fmt(totalDepositAmt - totalWithdrawAmt)}</strong>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 35px; font-size: 10px;">
          <div style="border-top: 1px solid #94a3b8; width: 140px; text-align: center;">Accountant Signature</div>
          <div style="border-top: 1px solid #94a3b8; width: 140px; text-align: center;">Authorized Signatory</div>
        </div>
      </div>
    `;

    setPrintHtml(html);
  };

  // Print Cheque
  const handlePrintCheque = () => {
    if (voucherRows.length === 0) {
      showToast("No entries to print cheque for!", "error");
      return;
    }
    const r = voucherRows[0];
    const totalAmt = num(r.amount);

    const html = `
      <div style="font-family: 'Courier New', Courier, monospace; width: 8in; height: 3.5in; padding: 0.4in; border: 1px dashed #64748b; margin: 20px auto; position: relative; background: #fffdf5; box-sizing: border-box;">
        <div style="position: absolute; top: 0.4in; right: 0.5in; font-weight: bold; letter-spacing: 4px; font-size: 13px;">
          ${entryDate.replace(/-/g, ' ')}
        </div>

        <div style="position: absolute; top: 1.1in; left: 1.2in; font-weight: bold; font-size: 14px; text-transform: uppercase;">
          *** ${r.inFavorOf || r.accountName} ***
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
          ||'${r.chqNo || '000000'}'|| 382002015: 000000' 29
        </div>
      </div>
    `;

    setPrintHtml(html);
  };

  // Print Bank Pay-in / Deposit Slip
  const handlePrintBankSlip = () => {
    if (voucherRows.length === 0) {
      showToast("No deposit rows to print slip!", "error");
      return;
    }

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 15px; color: #0f172a; max-width: 650px; margin: 0 auto; border: 2px solid #0284c7; border-radius: 4px; background: #fafafa;">
        <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 4px; margin-bottom: 8px;">
          <h3 style="margin: 0; color: #0284c7; font-size: 16px;">${selectedBank?.bankName || "BANK"} - PAY-IN SLIP (DEPOSIT VOUCHER)</h3>
          <p style="margin: 2px 0; font-size: 11px; color: #64748b;">Branch: ${selectedBank?.branch} | Account: <strong>${selectedBank?.acNo}</strong></p>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px;">
          <div><strong>Deposited By:</strong> SHIV DHARA MEDICAL STORE</div>
          <div><strong>Date:</strong> ${entryDate} | <strong>Voucher#:</strong> #${vchNo}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px;">
          <thead>
            <tr style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;">
              <th style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">Sr</th>
              <th style="padding: 4px; text-align: left; border: 1px solid #cbd5e1;">Particulars / Customer</th>
              <th style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">Cheque / Draft No</th>
              <th style="padding: 4px; text-align: right; border: 1px solid #cbd5e1;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${voucherRows.map((r, i) => `
              <tr>
                <td style="padding: 3px; text-align: center; border: 1px solid #cbd5e1;">${i + 1}</td>
                <td style="padding: 3px; border: 1px solid #cbd5e1;">${r.accountName}</td>
                <td style="padding: 3px; text-align: center; border: 1px solid #cbd5e1;">${r.chqNo}</td>
                <td style="padding: 3px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1;">₹${fmt(r.amount)}</td>
              </tr>
            `).join('')}
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td colspan="3" style="padding: 5px; text-align: right; border: 1px solid #cbd5e1;">TOTAL DEPOSITED:</td>
              <td style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; color: #16a34a;">₹${fmt(totalDepositAmt)}</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 10px;">
          <div style="border-top: 1px solid #94a3b8; width: 130px; text-align: center;">Depositor's Signature</div>
          <div style="border-top: 1px solid #94a3b8; width: 130px; text-align: center;">Bank Officer Stamp</div>
        </div>
      </div>
    `;

    setPrintHtml(html);
  };

  // SMS simulation
  const handleSendSMS = () => {
    if (voucherRows.length === 0) {
      showToast("No entries to send SMS for!", "error");
      return;
    }
    showToast(`📱 SMS / WhatsApp bank confirmation alert sent for Voucher #${vchNo}!`);
  };

  // Keyboard shortcut listener (F2 Save, Esc Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        if (showAccountDropdown) {
          setShowAccountDropdown(false);
        } else if (showBankSelectModal) {
          setShowBankSelectModal(false);
        } else if (showFindModal) {
          setShowFindModal(false);
        } else if (showForm) {
          setShowForm(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm, showAccountDropdown, showBankSelectModal, showFindModal, vchNo, entryDate, accountName, amount, dwType, voucherRows]);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: SINGLE CENTER BUTTON (When no form open) — strictly Rule #2
  // ══════════════════════════════════════════════════════════════════════════════
  if (!showForm) {
    const filteredVouchers = (overviewSearchQuery.trim() ? bankVouchers.filter(v => 
      String(v.vchNo || "").toLowerCase().includes(overviewSearchQuery.toLowerCase()) ||
      String(v.bankName || "").toLowerCase().includes(overviewSearchQuery.toLowerCase()) ||
      String(v.date || "").includes(overviewSearchQuery) ||
      (v.rows || []).some((r: any) => r.accountName.toLowerCase().includes(overviewSearchQuery.toLowerCase()))
    ) : bankVouchers).slice(0, 15);

    return (
      <div style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header Title with Search Bar (Clean Blue Accent - Image 2 Theme) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🏦</span> Bank Entry ({bankVouchers.length})
            </h2>
            <span style={{ background: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
              Multi-Bank Deposits & Withdrawals
            </span>
          </div>

          <div style={{ position: "relative", minWidth: "280px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "8px", color: "#64748b" }} />
            <input
              placeholder="Search Voucher#, Bank, Account, Date... + Enter"
              value={overviewSearchQuery}
              onChange={e => setOverviewSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && filteredVouchers.length > 0) {
                  handleOpenVoucher(filteredVouchers[0]);
                }
              }}
              style={{ ...inp, paddingLeft: "30px", background: "white", borderColor: "#cbd5e1" }}
            />
          </div>
        </div>

        {/* ── SINGLE CENTER BUTTON WORKSPACE (Strict Rule #2: Only Center Button) ── */}
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "8px", border: "1px dashed #cbd5e1", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "44px", opacity: 0.8, marginBottom: "8px" }}>🏦</div>
          <h3 style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "17px", color: "var(--color-text-dark)" }}>
            Bank Deposit, Withdrawal & Cheque Clearances
          </h3>
          <p style={{ fontSize: "12px", color: "#64748b", maxWidth: "520px", margin: "0 auto 18px", lineHeight: "1.5" }}>
            Manage bank transactions across SBI, HDFC, BOB, Kotak. Record deposits (D), withdrawals (W), print deposit slips, cheques and vouchers with real-time bank ledger balances.
          </p>

          {/* SINGLE CENTER BUTTON */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button 
              onClick={handleNewVoucher} 
              style={{ ...btn("#0284c7", "white"), padding: "10px 24px", fontSize: "14px", fontWeight: "700", borderRadius: "6px" }}
            >
              ➕ New Bank Entry
            </button>
          </div>
        </div>

        {/* Recent Bank Vouchers Table */}
        {bankVouchers.length > 0 && (
          <div style={{ marginTop: "24px", background: "white", borderRadius: "8px", border: "1px solid #cbd5e1", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                📋 Recent Bank Vouchers ({bankVouchers.length})
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Click on any voucher to view or edit details</div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", color: "#475569", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "80px" }}>Voucher#</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "110px" }}>Date</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", width: "180px" }}>Store Bank</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Particulars / Accounts</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", width: "120px" }}>Deposit (D)</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", width: "120px" }}>Withdraw (W)</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.map(vch => (
                    <tr 
                      key={vch.id}
                      onClick={() => handleOpenVoucher(vch)}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "700", color: "#0284c7" }}>
                        #{vch.vchNo}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", color: "#64748b" }}>
                        {vch.date}
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: "600", color: "#0369a1" }}>
                        {vch.bankName}
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: "600", color: "#1e293b" }}>
                        {(vch.rows || []).map((r: any) => `${r.accountName} (${r.dw})`).join(", ") || "General Bank"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: "#16a34a" }}>
                        ₹{fmt(vch.totalDeposit || 0)}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: "#0284c7" }}>
                        ₹{fmt(vch.totalWithdraw || 0)}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenVoucher(vch)} 
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
  // RENDER: FULL INTERACTIVE BANK ENTRY WORKSTATION (Matches Page 16 + Image 2 Theme)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: "white", borderRadius: "8px", border: "1px solid #cbd5e1", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", height: "100%", maxHeight: "100%", minHeight: 0, overflow: "hidden" }}>
      
      {/* ── TOP HEADER (MATCHES SCREENSHOT PAGE 16: Voucher#, Last Entry, Date, Load Date) ── */}
      <div style={{ padding: "8px 14px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", flexDirection: "column", gap: "6px" }}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#1e293b" }}>Voucher# :</span>
              <input
                type="text"
                value={vchNo}
                onChange={e => setVchNo(e.target.value)}
                style={{ ...inp, width: "65px", height: "24px", fontSize: "11px", fontWeight: "700", textAlign: "center", color: "#0284c7" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Last Entry:</span>
              <input
                type="text"
                readOnly
                value={lastEntryNo}
                style={{ ...inp, width: "45px", height: "24px", fontSize: "11px", textAlign: "center", background: "#f1f5f9", color: "#64748b" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Date :</span>
              <input
                type="date"
                value={entryDate}
                onChange={e => setEntryDate(e.target.value)}
                style={{ ...inp, width: "125px", height: "24px", fontSize: "11px", background: "white" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Load Date:</span>
              <input
                type="text"
                readOnly
                value={currentTimeStr}
                style={{ ...inp, width: "80px", height: "24px", fontSize: "11px", textAlign: "center", background: "#f1f5f9", color: "#64748b" }}
              />
            </div>
          </div>

          {/* Close Button */}
          <button onClick={() => setShowForm(false)} style={{ ...btn("#475569", "white"), padding: "3px 10px", fontSize: "11px" }}>
            ✕ Close
          </button>
        </div>

        {/* Selected Bank Banner */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#e0f2fe", padding: "4px 10px", borderRadius: "4px", border: "1px solid #bae6fd", fontSize: "11px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: "800", color: "#0369a1" }}>SELECTED STORE BANK:</span>
            <strong style={{ color: "#0f172a" }}>{selectedBank?.bankName || "STATE BANK OF INDIA"}</strong>
            <span style={{ color: "#475569" }}>(A/C: {selectedBank?.acNo} - {selectedBank?.branch})</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontSize: "11px", color: "#0369a1" }}>
              Book Balance: <strong style={{ color: "#0f172a" }}>₹{fmt(selectedBank?.balance || 0)}</strong>
            </div>
            <button
              onClick={() => setShowBankSelectModal(true)}
              style={{ ...btn("#0284c7", "white"), padding: "2px 8px", fontSize: "10px", fontWeight: "700" }}
            >
              Change Bank
            </button>
          </div>
        </div>

      </div>

      {/* ── MIDDLE ENTRY FORM (MATCHES SCREENSHOT PAGE 16 INPUT FIELDS) ── */}
      <div style={{ padding: "10px 14px", background: "#ffffff", borderBottom: "1px solid #cbd5e1", display: "flex", flexDirection: "column", gap: "8px" }}>
        
        {/* Row 1: Select Account Name, DW, Chq No, Bank Name, Sales Man */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "6px", position: "relative", minWidth: "300px", flex: 1 }}>
            <span style={{ fontSize: "11px", fontWeight: "700", width: "125px", color: "#334155" }}>Select Account Name :</span>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                placeholder="Search Account / Party..."
                value={accountName}
                onChange={e => {
                  setAccountName(e.target.value);
                  setShowAccountDropdown(true);
                }}
                onFocus={() => setShowAccountDropdown(true)}
                style={{ ...inp, height: "24px", fontSize: "11px", fontWeight: "700", background: "white", borderColor: showAccountDropdown ? "#0284c7" : "#cbd5e1" }}
              />

              {showAccountDropdown && (
                <div style={{
                  position: "absolute",
                  top: "28px",
                  left: 0,
                  width: "100%",
                  background: "white",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                  maxHeight: "180px",
                  overflowY: "auto",
                  zIndex: 999
                }}>
                  {(() => {
                    const q = accountName.toLowerCase().trim();
                    const matches = accountSuggestions.filter(a => !q || a.toLowerCase().includes(q));

                    if (matches.length === 0) {
                      return <div style={{ padding: "6px 10px", fontSize: "11px", color: "#64748b" }}>Custom Account Name</div>;
                    }

                    return matches.map((acc, i) => (
                      <div
                        key={i}
                        onMouseDown={() => {
                          setAccountName(acc);
                          setInFavorOf(acc);
                          setShowAccountDropdown(false);
                        }}
                        style={{
                          padding: "5px 10px",
                          borderBottom: "1px solid #f1f5f9",
                          cursor: "pointer",
                          fontSize: "11px",
                          color: "#0f172a"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}
                      >
                        {acc}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* DW (Deposit / Withdraw) */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>DW :</span>
            <input
              type="text"
              maxLength={1}
              value={dwType}
              onChange={e => {
                const v = e.target.value.toUpperCase();
                if (v === "D" || v === "W") setDwType(v);
              }}
              style={{ ...inp, width: "30px", height: "24px", textAlign: "center", fontSize: "11px", fontWeight: "800", color: dwType === "D" ? "#16a34a" : "#0284c7" }}
            />
            <div style={{ display: "flex", gap: "2px" }}>
              <button
                type="button"
                onClick={() => setDwType("D")}
                style={{
                  ...btn(dwType === "D" ? "#dcfce7" : "#f1f5f9", dwType === "D" ? "#15803d" : "#475569"),
                  padding: "2px 6px",
                  fontSize: "10px",
                  fontWeight: "700",
                  border: dwType === "D" ? "1px solid #86efac" : "1px solid #cbd5e1"
                }}
              >
                D (Deposit)
              </button>
              <button
                type="button"
                onClick={() => setDwType("W")}
                style={{
                  ...btn(dwType === "W" ? "#e0f2fe" : "#f1f5f9", dwType === "W" ? "#0369a1" : "#475569"),
                  padding: "2px 6px",
                  fontSize: "10px",
                  fontWeight: "700",
                  border: dwType === "W" ? "1px solid #7dd3fc" : "1px solid #cbd5e1"
                }}
              >
                W (Withdraw)
              </button>
            </div>
          </div>

          {/* Chq.No */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Chq.No :</span>
            <input
              type="text"
              placeholder="Cheque / Ref#"
              value={chqNo}
              onChange={e => setChqNo(e.target.value)}
              style={{ ...inp, width: "110px", height: "24px", fontSize: "11px" }}
            />
          </div>

          {/* Bank Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Bank Name :</span>
            <input
              type="text"
              placeholder="Party's Bank"
              value={partyBankName}
              onChange={e => setPartyBankName(e.target.value)}
              style={{ ...inp, width: "130px", height: "24px", fontSize: "11px" }}
            />
          </div>

          {/* Sales Man */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Sales Man :</span>
            <input
              type="text"
              value={salesman}
              onChange={e => setSalesman(e.target.value)}
              style={{ ...inp, width: "90px", height: "24px", fontSize: "11px" }}
            />
          </div>

        </div>

        {/* Row 2: In favor of, Amount, Remark & Add Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: "220px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", width: "125px", color: "#334155" }}>In favor of :</span>
            <input
              type="text"
              placeholder="Payee / In favor of..."
              value={inFavorOf}
              onChange={e => setInFavorOf(e.target.value)}
              style={{ ...inp, height: "24px", fontSize: "11px", flex: 1 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Amount :</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleAddRow();
              }}
              style={{ ...inp, width: "130px", height: "24px", fontSize: "12px", fontWeight: "800", textAlign: "right", color: dwType === "D" ? "#16a34a" : "#0284c7" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1.2, minWidth: "240px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Remark :</span>
            <input
              type="text"
              placeholder="Narration / Note..."
              value={remark}
              onChange={e => setRemark(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleAddRow();
              }}
              style={{ ...inp, height: "24px", fontSize: "11px", flex: 1 }}
            />

            <button
              type="button"
              onClick={handleAddRow}
              style={{ ...btn("#0284c7", "white"), padding: "3px 12px", fontSize: "11px", fontWeight: "700" }}
            >
              + Add Entry
            </button>
          </div>

        </div>

      </div>

      {/* ── TABLE GRID (MATCHES SCREENSHOT PAGE 16: Account Name, DW, Chq No, Amount, Remark) ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", color: "#334155", textAlign: "left", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #cbd5e1" }}>
              <th style={{ padding: "6px 8px", width: "35px", textAlign: "center", borderRight: "1px solid #e2e8f0" }}>Sr</th>
              <th style={{ padding: "6px 12px", borderRight: "1px solid #e2e8f0" }}>Account Name</th>
              <th style={{ padding: "6px 8px", width: "60px", textAlign: "center", borderRight: "1px solid #e2e8f0" }}>DW</th>
              <th style={{ padding: "6px 10px", width: "100px", textAlign: "center", borderRight: "1px solid #e2e8f0" }}>Chq No</th>
              <th style={{ padding: "6px 12px", width: "120px", textAlign: "right", borderRight: "1px solid #e2e8f0" }}>Amount</th>
              <th style={{ padding: "6px 12px", borderRight: "1px solid #e2e8f0" }}>Remark</th>
              <th style={{ padding: "6px 8px", width: "45px", textAlign: "center" }}>Act</th>
            </tr>
          </thead>
          <tbody>
            {voucherRows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "50px 20px", textAlign: "center", color: "#64748b" }}>
                  <div style={{ fontSize: "32px", opacity: 0.5, marginBottom: "8px" }}>🏦</div>
                  <div style={{ fontWeight: "700", fontSize: "13px" }}>No bank entries added in this voucher</div>
                  <div style={{ fontSize: "11px", marginTop: "4px" }}>Enter Account Name, D/W and Amount above to add to table</div>
                </td>
              </tr>
            ) : (
              voucherRows.map((r, idx) => (
                <tr
                  key={r.id || idx}
                  style={{
                    background: idx % 2 === 0 ? "white" : "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    transition: "background 0.1s"
                  }}
                >
                  <td style={{ textAlign: "center", fontWeight: "700", color: "#64748b", padding: "4px 2px", borderRight: "1px solid #e2e8f0" }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: "4px 12px", fontWeight: "700", color: "#0f172a", borderRight: "1px solid #e2e8f0" }}>
                    {r.accountName}
                  </td>
                  <td style={{ textAlign: "center", padding: "4px 6px", borderRight: "1px solid #e2e8f0" }}>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: "800",
                      background: r.dw === "D" ? "#dcfce7" : "#e0f2fe",
                      color: r.dw === "D" ? "#15803d" : "#0284c7"
                    }}>
                      {r.dw}
                    </span>
                  </td>
                  <td style={{ padding: "4px 10px", textAlign: "center", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                    {r.chqNo}
                  </td>
                  <td style={{ padding: "4px 12px", textAlign: "right", fontWeight: "700", color: r.dw === "D" ? "#16a34a" : "#0284c7", borderRight: "1px solid #e2e8f0" }}>
                    ₹{fmt(r.amount)}
                  </td>
                  <td style={{ padding: "4px 12px", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                    {r.remark || "-"}
                  </td>
                  <td style={{ textAlign: "center", padding: "2px" }}>
                    <button
                      onClick={() => handleRemoveRow(idx)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}
                      title="Remove row"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── BOTTOM SUMMARY BAR (MATCHES SCREENSHOT PAGE 16: Total Amount Withdraw, Total Amount Deposited, SMS) ── */}
      <div style={{ padding: "8px 14px", background: "#f8fafc", borderTop: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", fontSize: "11px" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontWeight: "700", color: "#334155" }}>Total Amount Withdraw :</span>
            <input
              type="text"
              readOnly
              value={`₹ ${fmt(totalWithdrawAmt)}`}
              style={{ ...inp, width: "120px", height: "24px", textAlign: "right", fontWeight: "800", background: "white", color: "#0284c7" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontWeight: "700", color: "#334155" }}>Total Amount Deposited :</span>
            <input
              type="text"
              readOnly
              value={`₹ ${fmt(totalDepositAmt)}`}
              style={{ ...inp, width: "120px", height: "24px", textAlign: "right", fontWeight: "800", background: "white", color: "#16a34a" }}
            />
          </div>
        </div>

        {/* SMS Button */}
        <button
          onClick={handleSendSMS}
          style={{ ...btn("#e0f2fe", "#0284c7"), padding: "4px 14px", fontSize: "11px", fontWeight: "700", border: "1px solid #bae6fd" }}
          title="Send SMS / WhatsApp confirmation"
        >
          SMS
        </button>

      </div>

      {/* ── BOTTOM ACTION TOOLBAR (MATCHES SCREENSHOT PAGE 16 BUTTONS: New, Save, Print Receipt, Print Cheque, Print Voucher, Print Bank Slip, Remove, List, <, >, Find, Select Bank, Close) ── */}
      <div style={{ background: "#f1f5f9", borderTop: "1px solid #cbd5e1", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
        
        <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={handleNewVoucher} style={{ ...btn("#0284c7", "white"), padding: "5px 12px", fontSize: "11px", fontWeight: "700", border: "1px solid #0284c7" }} title="New Bank Voucher (Alt+N)">
            ➕ New (Alt+N)
          </button>

          <button onClick={handleSave} style={{ ...btn("#0284c7", "white"), padding: "5px 14px", fontSize: "11px", fontWeight: "700" }} title="Save Bank Voucher (F2)">
            Save (F2)
          </button>

          <button onClick={() => handlePrint("Receipt")} style={{ ...btn("#ffffff", "#334155"), padding: "5px 8px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            Print Receipt
          </button>

          <button onClick={handlePrintCheque} style={{ ...btn("#ffffff", "#0284c7"), padding: "5px 8px", fontSize: "11px", fontWeight: "700", border: "1px solid #bae6fd" }}>
            Print Cheque
          </button>

          <button onClick={() => handlePrint("Voucher")} style={{ ...btn("#ffffff", "#334155"), padding: "5px 8px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            Print Voucher
          </button>

          <button onClick={handlePrintBankSlip} style={{ ...btn("#ffffff", "#16a34a"), padding: "5px 8px", fontSize: "11px", fontWeight: "700", border: "1px solid #86efac" }}>
            Print Bank Slip
          </button>

          <button onClick={handleDelete} style={{ ...btn("#fee2e2", "#dc2626"), padding: "5px 8px", fontSize: "11px", border: "1px solid #fecaca" }}>
            Remove
          </button>

          <button onClick={() => setShowFindModal(true)} style={{ ...btn("#ffffff", "#334155"), padding: "5px 8px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            List
          </button>

          {/* Sequential Navigation: Prev < and Next > */}
          <button onClick={handlePrevVoucher} style={{ ...btn("#ffffff", "#334155"), padding: "5px 9px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Previous Bank Voucher">
            &lt;
          </button>
          <button onClick={handleNextVoucher} style={{ ...btn("#ffffff", "#334155"), padding: "5px 9px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Next Bank Voucher">
            &gt;
          </button>

          <button onClick={() => setShowFindModal(true)} style={{ ...btn("#ffffff", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            Find
          </button>

          <button onClick={() => setShowBankSelectModal(true)} style={{ ...btn("#e0f2fe", "#0369a1"), padding: "5px 10px", fontSize: "11px", fontWeight: "700", border: "1px solid #bae6fd" }}>
            Select Bank
          </button>
        </div>

        {/* Close / Clear Button */}
        <button onClick={handleNewVoucher} style={{ ...btn("#475569", "white"), padding: "5px 14px", fontSize: "11px", fontWeight: "700" }} title="Reset / New Form (Esc)">
          Clear (Esc)
        </button>

      </div>

      {/* ── MODAL: LIST OF BANK CREATED IN ACCOUNT MASTER (MATCHES SCREENSHOT MODAL EXACTLY) ── */}
      {showBankSelectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "8px", width: "100%", maxWidth: "560px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)" }}>
            
            <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: "800", fontSize: "13px", color: "#0f172a" }}>
                🏦 List of Bank created in Account Master
              </div>
              <button onClick={() => setShowBankSelectModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={16} /></button>
            </div>

            <div style={{ padding: "12px", overflowY: "auto", maxHeight: "300px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", color: "#334155", textAlign: "left", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "6px 8px" }}>Bank A/c</th>
                    <th style={{ padding: "6px 8px" }}>Branch</th>
                    <th style={{ padding: "6px 8px" }}>Account No</th>
                    <th style={{ padding: "6px 8px", textAlign: "right" }}>Current Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.map((b, i) => (
                    <tr
                      key={b.id || i}
                      onDoubleClick={() => handleSelectBankFromModal(b)}
                      onClick={() => setSelectedBank(b)}
                      style={{
                        borderBottom: "1px solid #e2e8f0",
                        cursor: "pointer",
                        background: selectedBank?.id === b.id ? "#eff6ff" : "white",
                        fontWeight: selectedBank?.id === b.id ? "700" : "normal"
                      }}
                      onMouseEnter={e => { if (selectedBank?.id !== b.id) e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={e => { if (selectedBank?.id !== b.id) e.currentTarget.style.background = "white"; }}
                    >
                      <td style={{ padding: "6px 8px", color: "#0284c7" }}><strong>{b.bankName}</strong></td>
                      <td style={{ padding: "6px 8px", color: "#64748b" }}>{b.branch}</td>
                      <td style={{ padding: "6px 8px" }}>{b.acNo}</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", color: "#16a34a", fontWeight: "700" }}>₹{fmt(b.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: "8px 14px", background: "#f8fafc", borderTop: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
              <div style={{ color: "#0369a1", fontStyle: "italic", fontWeight: "600" }}>
                Double Click on Bank Name for Which you want to make Deposit / Withdraw entry
              </div>
              <button
                onClick={() => setShowBankSelectModal(false)}
                style={{ ...btn("#475569", "white"), padding: "4px 12px", fontSize: "11px" }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── FIND VOUCHER MODAL ── */}
      {showFindModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "8px", width: "100%", maxWidth: "580px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>🔍 Find Bank Voucher</div>
              <button onClick={() => setShowFindModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>

            <div style={{ padding: "8px", overflowY: "auto", flex: 1 }}>
              {bankVouchers.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No bank vouchers found</div>
              ) : (
                bankVouchers.map(vch => (
                  <div
                    key={vch.id}
                    onClick={() => handleOpenVoucher(vch)}
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
                        Voucher #{vch.vchNo} — {vch.bankName}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Date: {vch.date} | {(vch.rows || []).length} items | {(vch.rows || []).map((r: any) => r.accountName).join(", ")}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "800", color: "#16a34a" }}>D: ₹{fmt(vch.totalDeposit)}</div>
                      <div style={{ fontWeight: "800", color: "#0284c7" }}>W: ₹{fmt(vch.totalWithdraw)}</div>
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
