// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, CheckCircle, Trash2, Plus, ArrowLeft, ArrowRight, Printer, AlertTriangle, FileText, RefreshCw, ShoppingCart, Check, CreditCard, DollarSign, Building, User, Calendar, MessageSquare } from "lucide-react";
import { useMedicalStore, today, uid, num, fmt, int, inp, lbl, btn } from './MedicalStoreContext';

export default function CashEntry() {
  const {
    payments, savePayments,
    salesBills, purchaseBills,
    suppliers, khataEntries,
    showToast, showConfirm,
    setPrintHtml, setActiveSection
  } = useMedicalStore();

  // Local storage persisted cash vouchers (v2)
  const [cashVouchers, setCashVouchers] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('store_cash_vouchers_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const saveCashVoucherList = (list: any[]) => {
    setCashVouchers(list);
    try {
      localStorage.setItem('store_cash_vouchers_v2', JSON.stringify(list));
    } catch (_) {}
  };

  // Form / Workstation State
  const [showForm, setShowForm] = useState(true);
  const [activeVoucherId, setActiveVoucherId] = useState<string | null>(null);
  const [overviewSearchQuery, setOverviewSearchQuery] = useState("");
  const [showFindModal, setShowFindModal] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState("10:27:07");

  useEffect(() => {
    const handleNew = () => handleNewVoucher();
    const handleKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        handleNewVoucher();
      }
    };
    window.addEventListener("new_cash_entry", handleNew);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("new_cash_entry", handleNew);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Voucher Header Fields (Matches Page 15 of transection.pdf)
  const [vchNo, setVchNo] = useState<string>("1");
  const [entryDate, setEntryDate] = useState<string>(today());

  // Current Entry Input Fields
  const [accountName, setAccountName] = useState<string>("");
  const [rpType, setRpType] = useState<"P" | "R">("R"); // P for Payment, R for Receipt
  const [amount, setAmount] = useState<string>("");
  const [salesman, setSalesman] = useState<string>("ADMIN");
  const [remark, setRemark] = useState<string>("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Table rows in current voucher
  const [voucherRows, setVoucherRows] = useState<any[]>([]);

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTimeStr(d.toTimeString().split(' ')[0]);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Preset ledger/account suggestions (Suppliers, Customers, Common Expense Heads)
  const accountSuggestions = useMemo(() => {
    const set = new Set<string>();
    
    // Expense heads
    ["Shop Rent Expense", "Electricity Bill", "Staff Salary", "Tea & Refreshment", "Stationery & Printing", "Courier & Transport", "General Maintenance", "Doctor Commission"].forEach(e => set.add(e));

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

  // Calculate live cash in hand balance
  const liveCashBalance = useMemo(() => {
    let balance = 1032408.64; // Opening base cash from ledger

    // Add cash receipts
    (salesBills || []).forEach(b => {
      if ((b.paymentMode || "").toLowerCase() === "cash") {
        balance += (num(b.paid) || num(b.total) || 0);
      }
    });

    (payments || []).forEach(p => {
      if ((p.mode || "").toLowerCase() === "cash") {
        if (p.type === "receipt") balance += num(p.amount);
        if (p.type === "payment") balance -= num(p.amount);
      }
    });

    (cashVouchers || []).forEach(v => {
      (v.rows || []).forEach(r => {
        if (r.rp === "R") balance += num(r.amount);
        if (r.rp === "P") balance -= num(r.amount);
      });
    });

    return balance;
  }, [salesBills, payments, cashVouchers]);

  // Next Voucher No generator
  const getNextVchNo = () => {
    if (cashVouchers.length === 0) return "1";
    const max = cashVouchers.reduce((m, r) => Math.max(m, int(r.vchNo) || 0), 0);
    return String(max + 1);
  };

  // Start fresh Cash Entry
  const handleNewVoucher = () => {
    setActiveVoucherId(null);
    setVchNo(getNextVchNo());
    setEntryDate(today());
    setAccountName("");
    setRpType("R");
    setAmount("");
    setSalesman("ADMIN");
    setRemark("");
    setVoucherRows([]);
    setShowForm(true);
  };

  // Open existing cash voucher
  const handleOpenVoucher = (vch: any) => {
    if (!vch) return;
    setActiveVoucherId(vch.id);
    setVchNo(String(vch.vchNo || "1"));
    setEntryDate(vch.date || today());
    setVoucherRows(vch.rows || []);
    setAccountName("");
    setAmount("");
    setRemark("");
    setShowForm(true);
    setShowFindModal(false);
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
      rp: rpType,
      amount: val,
      salesman: salesman.trim() || "ADMIN",
      remark: remark.trim() || (rpType === "R" ? "Cash Received" : "Cash Disbursed")
    };

    setVoucherRows(prev => [...prev, newRow]);
    setAccountName("");
    setAmount("");
    setRemark("");
    showToast(`Added: ${newRow.accountName} (${newRow.rp} - ₹${fmt(newRow.amount)})`);
  };

  // Remove Row
  const handleRemoveRow = (idx: number) => {
    setVoucherRows(prev => prev.filter((_, i) => i !== idx));
  };

  // Summary totals
  const totalPaymentAmt = useMemo(() => {
    return voucherRows.filter(r => r.rp === "P").reduce((s, r) => s + num(r.amount), 0);
  }, [voucherRows]);

  const totalReceivedAmt = useMemo(() => {
    return voucherRows.filter(r => r.rp === "R").reduce((s, r) => s + num(r.amount), 0);
  }, [voucherRows]);

  // Save Cash Voucher
  const handleSave = () => {
    let rowsToSave = [...voucherRows];

    // If inputs have active un-added content, add it automatically
    if (accountName.trim() && num(amount) > 0) {
      const autoRow = {
        id: uid(),
        accountName: accountName.trim(),
        rp: rpType,
        amount: num(amount),
        salesman: salesman.trim() || "ADMIN",
        remark: remark.trim() || (rpType === "R" ? "Cash Received" : "Cash Disbursed")
      };
      rowsToSave.push(autoRow);
      setVoucherRows(rowsToSave);
      setAccountName("");
      setAmount("");
      setRemark("");
    }

    if (rowsToSave.length === 0) {
      showToast("Please add at least one cash entry row before saving!", "error");
      return;
    }

    const record = {
      id: activeVoucherId || uid(),
      vchNo,
      date: entryDate,
      time: currentTimeStr,
      rows: rowsToSave,
      totalPayment: rowsToSave.filter(r => r.rp === "P").reduce((s, r) => s + num(r.amount), 0),
      totalReceived: rowsToSave.filter(r => r.rp === "R").reduce((s, r) => s + num(r.amount), 0),
      createdAt: new Date().toISOString()
    };

    let updatedList;
    if (activeVoucherId) {
      updatedList = cashVouchers.map(v => v.id === activeVoucherId ? record : v);
    } else {
      updatedList = [record, ...cashVouchers];
    }
    saveCashVoucherList(updatedList);

    // Sync to global payments for ledger & day book integration
    rowsToSave.forEach(r => {
      const pRecord = {
        id: r.id || uid(),
        voucherNo: vchNo,
        date: entryDate,
        type: r.rp === "R" ? "receipt" : "payment",
        partyName: r.accountName,
        amount: r.amount,
        mode: "cash",
        remarks: `Cash Entry - ${r.remark}`,
        bank: "CASH IN HAND"
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
    showToast(`✅ Cash Entry Voucher #${vchNo} saved successfully!`);
  };

  // Delete Cash Voucher
  const handleDelete = () => {
    if (!activeVoucherId) {
      showToast("This is an unsaved new voucher!", "info");
      return;
    }
    showConfirm(`Delete Cash Entry Voucher #${vchNo}?`, () => {
      const remaining = cashVouchers.filter(v => v.id !== activeVoucherId);
      saveCashVoucherList(remaining);
      showToast(`Voucher #${vchNo} deleted!`);
      handleNewVoucher();
    });
  };

  // Sequential Navigation: Prev < and Next >
  const handlePrevVoucher = () => {
    if (cashVouchers.length === 0) return;
    const curIdx = cashVouchers.findIndex(v => v.id === activeVoucherId);
    if (curIdx < 0 || curIdx >= cashVouchers.length - 1) {
      handleOpenVoucher(cashVouchers[cashVouchers.length - 1]);
    } else {
      handleOpenVoucher(cashVouchers[curIdx + 1]);
    }
  };

  const handleNextVoucher = () => {
    if (cashVouchers.length === 0) return;
    const curIdx = cashVouchers.findIndex(v => v.id === activeVoucherId);
    if (curIdx <= 0) {
      handleOpenVoucher(cashVouchers[0]);
    } else {
      handleOpenVoucher(cashVouchers[curIdx - 1]);
    }
  };

  // Print Cash Receipt / Voucher
  const handlePrint = (type = "Voucher") => {
    if (voucherRows.length === 0) {
      showToast("No cash entries to print!", "error");
      return;
    }

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #0f172a; max-width: 750px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 6px;">
        <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase; color: #0284c7;">SHIV DHARA MEDICAL STORE</h2>
          <p style="margin: 2px 0; font-size: 11px; color: #64748b;">20, GIRIRAJ COMPLEX NIKOL GAAM ROAD, NIKOL, AHMEDABAD | PH: 079352 07999</p>
          <div style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 14px; border-radius: 12px; font-weight: 700; font-size: 11px; margin-top: 4px; border: 1px solid #bae6fd;">
            OFFICIAL CASH ${type.toUpperCase()}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 10px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px;">
          <div>
            <strong>Voucher No:</strong> #${vchNo}<br/>
            <strong>Cashier / Salesman:</strong> ${salesman || "ADMIN"}<br/>
            <strong>Cash Ledger:</strong> CASH IN HAND A/C
          </div>
          <div style="text-align: right;">
            <strong>Date:</strong> ${entryDate}<br/>
            <strong>Time:</strong> ${currentTimeStr}<br/>
            <strong>Current Cash Balance:</strong> ₹${fmt(liveCashBalance)}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px;">
          <thead>
            <tr style="background: #f1f5f9; color: #334155; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 35px;">Sr</th>
              <th style="padding: 5px; text-align: left; border: 1px solid #cbd5e1;">Account Name</th>
              <th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 60px;">R / P</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 110px;">Amount</th>
              <th style="padding: 5px; text-align: left; border: 1px solid #cbd5e1;">Remark / Narration</th>
            </tr>
          </thead>
          <tbody>
            ${voucherRows.map((r, i) => `
              <tr>
                <td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">${i + 1}</td>
                <td style="padding: 4px; border: 1px solid #cbd5e1;"><strong>${r.accountName}</strong></td>
                <td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: ${r.rp === 'R' ? '#16a34a' : '#0284c7'};">${r.rp === 'R' ? 'RECEIPT' : 'PAYMENT'}</td>
                <td style="padding: 4px; text-align: right; border: 1px solid #cbd5e1; font-weight: bold;">₹${fmt(r.amount)}</td>
                <td style="padding: 4px; border: 1px solid #cbd5e1; color: #64748b;">${r.remark || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="background: #f8fafc; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>Total Cash Received:</strong> <span style="color: #16a34a; font-weight: bold;">₹${fmt(totalReceivedAmt)}</span><br/>
            <strong>Total Cash Paid:</strong> <span style="color: #0284c7; font-weight: bold;">₹${fmt(totalPaymentAmt)}</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 10px; color: #64748b;">Net Movement:</span><br/>
            <strong style="font-size: 15px; color: #0f172a;">₹${fmt(totalReceivedAmt - totalPaymentAmt)}</strong>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 35px; font-size: 10px;">
          <div style="border-top: 1px solid #94a3b8; width: 140px; text-align: center;">Cashier Signature</div>
          <div style="border-top: 1px solid #94a3b8; width: 140px; text-align: center;">Authorized Signatory</div>
        </div>
      </div>
    `;

    setPrintHtml(html);
  };

  // SMS Notification simulation
  const handleSendSMS = () => {
    if (voucherRows.length === 0) {
      showToast("No entries to send SMS for!", "error");
      return;
    }
    showToast(`📱 SMS / WhatsApp cash confirmation alert dispatched for Voucher #${vchNo}!`);
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
        } else if (showFindModal) {
          setShowFindModal(false);
        } else if (showForm) {
          setShowForm(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm, showAccountDropdown, showFindModal, vchNo, entryDate, accountName, amount, rpType, voucherRows]);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: SINGLE CENTER BUTTON (When no form open) — strictly Rule #2
  // ══════════════════════════════════════════════════════════════════════════════
  if (!showForm) {
    const filteredVouchers = (overviewSearchQuery.trim() ? cashVouchers.filter(v => 
      String(v.vchNo || "").toLowerCase().includes(overviewSearchQuery.toLowerCase()) ||
      String(v.date || "").includes(overviewSearchQuery) ||
      (v.rows || []).some((r: any) => r.accountName.toLowerCase().includes(overviewSearchQuery.toLowerCase()))
    ) : cashVouchers).slice(0, 15);

    return (
      <div style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header Title with Search Bar (Clean Blue Accent - Image 2 Theme) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>💰</span> Cash Entry ({cashVouchers.length})
            </h2>
            <span style={{ background: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
              Cash In Hand: ₹{fmt(liveCashBalance)}
            </span>
          </div>

          <div style={{ position: "relative", minWidth: "280px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "8px", color: "#64748b" }} />
            <input
              placeholder="Search Voucher#, Account, Date... + Enter"
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
          <div style={{ fontSize: "44px", opacity: 0.8, marginBottom: "8px" }}>💰</div>
          <h3 style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "17px", color: "var(--color-text-dark)" }}>
            Cash Counter Entry & Daily Vouchers
          </h3>
          <p style={{ fontSize: "12px", color: "#64748b", maxWidth: "520px", margin: "0 auto 18px", lineHeight: "1.5" }}>
            Record cash receipts (R) and cash payments (P). Track instant cash in hand balances, disburse shop expenses, print cash vouchers, and send SMS alerts.
          </p>

          {/* SINGLE CENTER BUTTON */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button 
              onClick={handleNewVoucher} 
              style={{ ...btn("#0284c7", "white"), padding: "10px 24px", fontSize: "14px", fontWeight: "700", borderRadius: "6px" }}
            >
              ➕ New Cash Entry
            </button>
          </div>
        </div>

        {/* Recent Cash Vouchers Table */}
        {cashVouchers.length > 0 && (
          <div style={{ marginTop: "24px", background: "white", borderRadius: "8px", border: "1px solid #cbd5e1", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                📋 Recent Cash Vouchers ({cashVouchers.length})
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Click on any voucher to view or edit details</div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", color: "#475569", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "80px" }}>Vch. No</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "110px" }}>Date</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "90px" }}>Time</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Accounts Included</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", width: "120px" }}>Received (R)</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", width: "120px" }}>Payment (P)</th>
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
                      <td style={{ padding: "8px 10px", textAlign: "center", color: "#64748b", fontSize: "11px" }}>
                        {vch.time || "-"}
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: "600", color: "#1e293b" }}>
                        {(vch.rows || []).map((r: any) => `${r.accountName} (${r.rp})`).join(", ") || "General Cash"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: "#16a34a" }}>
                        ₹{fmt(vch.totalReceived || 0)}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: "#0284c7" }}>
                        ₹{fmt(vch.totalPayment || 0)}
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
  // RENDER: FULL INTERACTIVE CASH ENTRY WORKSTATION (Matches Page 15 + Image 2 Theme)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: "white", borderRadius: "8px", border: "1px solid #cbd5e1", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", minHeight: "85vh" }}>
      
      {/* ── TOP HEADER / LIVE CASH STATUS BAR (MATCHES SCREENSHOT PAGE 15) ── */}
      <div style={{ padding: "8px 14px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", flexDirection: "column", gap: "6px" }}>
        
        {/* Row 1: Vch No, Date, Load Date */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#1e293b" }}>Vch. No:</span>
              <input
                type="text"
                value={vchNo}
                onChange={e => setVchNo(e.target.value)}
                style={{ ...inp, width: "65px", height: "24px", fontSize: "11px", fontWeight: "700", textAlign: "center", color: "#0284c7" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Date:</span>
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

          <button onClick={() => setShowForm(false)} style={{ ...btn("#475569", "white"), padding: "3px 10px", fontSize: "11px" }}>
            ✕ Close
          </button>
        </div>

        {/* Row 2: CASH *** Bar with live cash in hand */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "#e0f2fe", padding: "4px 10px", borderRadius: "4px", border: "1px solid #bae6fd", fontSize: "11px" }}>
          <strong style={{ color: "#0369a1", textTransform: "uppercase" }}>CASH ***</strong>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#0369a1", fontWeight: "600" }}>Cash:</span>
            <span style={{ fontWeight: "800", color: "#0f172a", background: "white", padding: "1px 8px", borderRadius: "4px", border: "1px solid #bae6fd" }}>
              ₹{fmt(liveCashBalance)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#0369a1", fontWeight: "600" }}>Credit Bal:</span>
            <span style={{ fontWeight: "800", color: "#0f172a", background: "white", padding: "1px 8px", borderRadius: "4px", border: "1px solid #bae6fd" }}>
              ₹0.00
            </span>
          </div>
        </div>

      </div>

      {/* ── MIDDLE ENTRY FORM (MATCHES SCREENSHOT PAGE 15 INPUT FIELDS) ── */}
      <div style={{ padding: "10px 14px", background: "#ffffff", borderBottom: "1px solid #cbd5e1", display: "flex", flexDirection: "column", gap: "8px" }}>
        
        {/* Account Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative", maxWidth: "680px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", width: "95px", color: "#334155" }}>Account Name :</span>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              placeholder="Search or enter Account Name / Expense Head..."
              value={accountName}
              onChange={e => {
                setAccountName(e.target.value);
                setShowAccountDropdown(true);
              }}
              onFocus={() => setShowAccountDropdown(true)}
              style={{ ...inp, height: "26px", fontSize: "11px", fontWeight: "700", background: "white", borderColor: showAccountDropdown ? "#0284c7" : "#cbd5e1" }}
            />

            {/* Account Auto-suggest Dropdown */}
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
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 999
              }}>
                {(() => {
                  const q = accountName.toLowerCase().trim();
                  const matches = accountSuggestions.filter(a => !q || a.toLowerCase().includes(q));

                  if (matches.length === 0) {
                    return <div style={{ padding: "6px 10px", fontSize: "11px", color: "#64748b" }}>No matches (You can type custom account)</div>;
                  }

                  return matches.map((acc, i) => (
                    <div
                      key={i}
                      onMouseDown={() => {
                        setAccountName(acc);
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

        {/* P / R Type selection */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", width: "95px", color: "#334155" }}>P/R :</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input
              type="text"
              maxLength={1}
              value={rpType}
              onChange={e => {
                const v = e.target.value.toUpperCase();
                if (v === "P" || v === "R") setRpType(v);
              }}
              style={{ ...inp, width: "35px", height: "24px", textAlign: "center", fontSize: "11px", fontWeight: "800", color: rpType === "R" ? "#16a34a" : "#0284c7" }}
            />
            <span style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
              (Type <strong style={{ color: "#0284c7" }}>P for Payment</strong> / <strong style={{ color: "#16a34a" }}>R for Receipt</strong>)
            </span>
            
            <div style={{ display: "flex", gap: "4px", marginLeft: "10px" }}>
              <button
                type="button"
                onClick={() => setRpType("R")}
                style={{
                  ...btn(rpType === "R" ? "#dcfce7" : "#f1f5f9", rpType === "R" ? "#15803d" : "#475569"),
                  padding: "2px 8px",
                  fontSize: "10px",
                  fontWeight: "700",
                  border: rpType === "R" ? "1px solid #86efac" : "1px solid #cbd5e1"
                }}
              >
                ✓ Receipt (R)
              </button>
              <button
                type="button"
                onClick={() => setRpType("P")}
                style={{
                  ...btn(rpType === "P" ? "#e0f2fe" : "#f1f5f9", rpType === "P" ? "#0369a1" : "#475569"),
                  padding: "2px 8px",
                  fontSize: "10px",
                  fontWeight: "700",
                  border: rpType === "P" ? "1px solid #7dd3fc" : "1px solid #cbd5e1"
                }}
              >
                ✓ Payment (P)
              </button>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", width: "95px", color: "#334155" }}>Amount :</span>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleAddRow();
            }}
            style={{ ...inp, width: "160px", height: "26px", fontSize: "12px", fontWeight: "800", textAlign: "right", color: rpType === "R" ? "#16a34a" : "#0284c7" }}
          />
        </div>

        {/* Salesman */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", width: "95px", color: "#334155" }}>Salesman :</span>
          <input
            type="text"
            value={salesman}
            onChange={e => setSalesman(e.target.value)}
            style={{ ...inp, width: "200px", height: "24px", fontSize: "11px" }}
          />
        </div>

        {/* Remark & Add Row Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", maxWidth: "680px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", width: "95px", color: "#334155" }}>Remark :</span>
          <input
            type="text"
            placeholder="Narration or reason for cash transaction..."
            value={remark}
            onChange={e => setRemark(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleAddRow();
            }}
            style={{ ...inp, flex: 1, height: "24px", fontSize: "11px" }}
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

      {/* ── CASH VOUCHER GRID (MATCHES SCREENSHOT PAGE 15 COLUMNS: Account Name, RP, Amount, Remark) ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", color: "#334155", textAlign: "left", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #cbd5e1" }}>
              <th style={{ padding: "6px 8px", width: "40px", textAlign: "center", borderRight: "1px solid #e2e8f0" }}>Sr</th>
              <th style={{ padding: "6px 12px", borderRight: "1px solid #e2e8f0" }}>Account Name</th>
              <th style={{ padding: "6px 8px", width: "60px", textAlign: "center", borderRight: "1px solid #e2e8f0" }}>RP</th>
              <th style={{ padding: "6px 12px", width: "120px", textAlign: "right", borderRight: "1px solid #e2e8f0" }}>Amount</th>
              <th style={{ padding: "6px 12px", borderRight: "1px solid #e2e8f0" }}>Remark</th>
              <th style={{ padding: "6px 8px", width: "50px", textAlign: "center" }}>Act</th>
            </tr>
          </thead>
          <tbody>
            {voucherRows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "50px 20px", textAlign: "center", color: "#64748b" }}>
                  <div style={{ fontSize: "32px", opacity: 0.5, marginBottom: "8px" }}>📝</div>
                  <div style={{ fontWeight: "700", fontSize: "13px" }}>No entries added yet in this cash voucher</div>
                  <div style={{ fontSize: "11px", marginTop: "4px" }}>Enter Account Name, P/R and Amount above to add to table</div>
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
                      background: r.rp === "R" ? "#dcfce7" : "#e0f2fe",
                      color: r.rp === "R" ? "#15803d" : "#0284c7"
                    }}>
                      {r.rp}
                    </span>
                  </td>
                  <td style={{ padding: "4px 12px", textAlign: "right", fontWeight: "700", color: r.rp === "R" ? "#16a34a" : "#0284c7", borderRight: "1px solid #e2e8f0" }}>
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

      {/* ── BOTTOM SUMMARY BAR (MATCHES SCREENSHOT PAGE 15: Total Amount Payment, Total Amount Received, SMS) ── */}
      <div style={{ padding: "8px 14px", background: "#f8fafc", borderTop: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", fontSize: "11px" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontWeight: "700", color: "#334155" }}>Total Amount Payment :</span>
            <input
              type="text"
              readOnly
              value={`₹ ${fmt(totalPaymentAmt)}`}
              style={{ ...inp, width: "120px", height: "24px", textAlign: "right", fontWeight: "800", background: "white", color: "#0284c7" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontWeight: "700", color: "#334155" }}>Total Amount Received :</span>
            <input
              type="text"
              readOnly
              value={`₹ ${fmt(totalReceivedAmt)}`}
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

      {/* ── BOTTOM ACTION TOOLBAR ── */}
      <div style={{ background: "#f1f5f9", borderTop: "1px solid #cbd5e1", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={handleNewVoucher} style={{ ...btn("#0284c7", "white"), padding: "5px 14px", fontSize: "11px", fontWeight: "700", border: "1px solid #0284c7" }} title="New Cash Voucher (Alt+N)">
            ➕ New (Alt+N)
          </button>

          <button onClick={handleSave} style={{ ...btn("#16a34a", "white"), padding: "5px 16px", fontSize: "11px", fontWeight: "700" }} title="Save Cash Voucher (F2)">
            Save (F2)
          </button>

          <button onClick={() => handlePrint("Receipt")} style={{ ...btn("#ffffff", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            Print Receipt
          </button>

          <button onClick={() => handlePrint("Voucher")} style={{ ...btn("#ffffff", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            Print Voucher
          </button>

          <button onClick={handleDelete} style={{ ...btn("#fee2e2", "#dc2626"), padding: "5px 10px", fontSize: "11px", border: "1px solid #fecaca" }}>
            Remove
          </button>

          <button onClick={() => setShowFindModal(true)} style={{ ...btn("#ffffff", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            List
          </button>

          {/* Sequential Navigation: Prev < and Next > */}
          <button onClick={handlePrevVoucher} style={{ ...btn("#ffffff", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Previous Cash Voucher">
            &lt;
          </button>

          <button onClick={handleNextVoucher} style={{ ...btn("#ffffff", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Next Cash Voucher">
            &gt;
          </button>

          <button onClick={() => setShowFindModal(true)} style={{ ...btn("#ffffff", "#334155"), padding: "5px 11px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            Find
          </button>
        </div>

        {/* Close / Clear Button */}
        <button onClick={handleNewVoucher} style={{ ...btn("#475569", "white"), padding: "5px 16px", fontSize: "11px", fontWeight: "700" }} title="Reset / New Form (Esc)">
          Clear (Esc)
        </button>
      </div>

      {/* ── FIND VOUCHER MODAL ── */}
      {showFindModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "8px", width: "100%", maxWidth: "580px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>🔍 Find Cash Voucher</div>
              <button onClick={() => setShowFindModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>

            <div style={{ padding: "8px", overflowY: "auto", flex: 1 }}>
              {cashVouchers.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No cash vouchers found</div>
              ) : (
                cashVouchers.map(vch => (
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
                        Voucher #{vch.vchNo} — {vch.date}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {(vch.rows || []).length} entries | {(vch.rows || []).map((r: any) => r.accountName).join(", ")}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "800", color: "#16a34a" }}>R: ₹{fmt(vch.totalReceived)}</div>
                      <div style={{ fontWeight: "800", color: "#0284c7" }}>P: ₹{fmt(vch.totalPayment)}</div>
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
