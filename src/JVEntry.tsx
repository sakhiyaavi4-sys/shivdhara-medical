// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, CheckCircle, Trash2, Plus, ArrowLeft, ArrowRight, Printer, AlertTriangle, FileText, RefreshCw, ShoppingCart, Check, CreditCard, DollarSign, Building, User, Calendar, MessageSquare } from "lucide-react";
import { useMedicalStore, today, uid, num, fmt, int, inp, lbl, btn } from './MedicalStoreContext';

export default function JVEntry() {
  const {
    payments, savePayments,
    salesBills, purchaseBills,
    suppliers, khataEntries,
    showToast, showConfirm,
    setPrintHtml, setActiveSection
  } = useMedicalStore();

  // Local storage persisted JV Vouchers (v2)
  const [jvVouchers, setJvVouchers] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('store_jv_vouchers_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const saveJvVoucherList = (list: any[]) => {
    setJvVouchers(list);
    try {
      localStorage.setItem('store_jv_vouchers_v2', JSON.stringify(list));
    } catch (_) {}
  };

  // Form / Workstation State
  const [showForm, setShowForm] = useState(true);
  const [activeVoucherId, setActiveVoucherId] = useState<string | null>(null);
  const [overviewSearchQuery, setOverviewSearchQuery] = useState("");
  const [showFindModal, setShowFindModal] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState("11:08:12");

  useEffect(() => {
    const handleNew = () => handleNewVoucher();
    const handleKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        handleNewVoucher();
      }
    };
    window.addEventListener("new_jv_entry", handleNew);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("new_jv_entry", handleNew);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Voucher Header Fields (Matches Page 17 of transection.pdf)
  const [vouNo, setVouNo] = useState<string>("35957");
  const [lastJvEntry, setLastJvEntry] = useState<string>("35956");
  const [entryDate, setEntryDate] = useState<string>(today());

  // Current Entry Input Fields
  const [accountName, setAccountName] = useState<string>("");
  const [creditAmt, setCreditAmt] = useState<string>("");
  const [debitAmt, setDebitAmt] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Table rows in current voucher
  const [voucherRows, setVoucherRows] = useState<any[]>([]);

  // Update live clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Account Suggestions (Suppliers, Customers, Common Expense, Asset & Liability Heads)
  const accountSuggestions = useMemo(() => {
    const set = new Set<string>();
    
    // Ledger accounts
    [
      "Cash in Hand", "State Bank of India", "HDFC Bank", "Bank of Baroda",
      "Shop Rent Expense", "Electricity Bill", "Staff Salary", "Doctor Commission",
      "Discount Given A/c", "Discount Received A/c", "GST Input SGST", "GST Input CGST",
      "GST Output SGST", "GST Output CGST", "Bad Debts / Written Off", "Depreciation A/c",
      "Owner Capital A/c", "Owner Drawings A/c", "Interest on Loan A/c"
    ].forEach(e => set.add(e));

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
  const getNextVouNo = () => {
    if (jvVouchers.length === 0) return "35957";
    const max = jvVouchers.reduce((m, r) => Math.max(m, int(r.vouNo) || 0), 35956);
    return String(max + 1);
  };

  // Start fresh JV Entry
  const handleNewVoucher = () => {
    setActiveVoucherId(null);
    setVouNo(getNextVouNo());
    setLastJvEntry(jvVouchers.length > 0 ? String(jvVouchers[0].vouNo || "35956") : "35956");
    setEntryDate(today());
    setAccountName("");
    setCreditAmt("");
    setDebitAmt("");
    setRemark("");
    setVoucherRows([]);
    setShowForm(true);
  };

  // Open existing JV voucher
  const handleOpenVoucher = (vch: any) => {
    if (!vch) return;
    setActiveVoucherId(vch.id);
    setVouNo(String(vch.vouNo || "35957"));
    setLastJvEntry(String(vch.lastJvEntry || "35956"));
    setEntryDate(vch.date || today());
    setVoucherRows(vch.rows || []);
    setAccountName("");
    setCreditAmt("");
    setDebitAmt("");
    setRemark("");
    setShowForm(true);
    setShowFindModal(false);
  };

  // Add Row to current voucher
  const handleAddRow = () => {
    if (!accountName.trim()) {
      showToast("Please select an Account Name for transaction!", "error");
      return;
    }

    const cVal = num(creditAmt);
    const dVal = num(debitAmt);

    if (cVal <= 0 && dVal <= 0) {
      showToast("Please enter either Credit Amount or Debit Amount!", "error");
      return;
    }

    if (cVal > 0 && dVal > 0) {
      showToast("A single journal row cannot have both Credit and Debit amount!", "error");
      return;
    }

    const newRow = {
      id: uid(),
      accountName: accountName.trim(),
      creditAmt: cVal,
      debitAmt: dVal,
      remark: remark.trim() || (cVal > 0 ? "Credit Entry" : "Debit Entry")
    };

    setVoucherRows(prev => [...prev, newRow]);
    setAccountName("");
    setCreditAmt("");
    setDebitAmt("");
    setRemark("");
    showToast(`Added: ${newRow.accountName} (${newRow.creditAmt > 0 ? `Cr ₹${fmt(newRow.creditAmt)}` : `Dr ₹${fmt(newRow.debitAmt)}`})`);
  };

  // Remove Row
  const handleRemoveRow = (idx: number) => {
    setVoucherRows(prev => prev.filter((_, i) => i !== idx));
  };

  // Summary totals
  const totalCredit = useMemo(() => {
    return voucherRows.reduce((s, r) => s + num(r.creditAmt), 0);
  }, [voucherRows]);

  const totalDebit = useMemo(() => {
    return voucherRows.reduce((s, r) => s + num(r.debitAmt), 0);
  }, [voucherRows]);

  const difference = useMemo(() => {
    return Math.abs(totalCredit - totalDebit);
  }, [totalCredit, totalDebit]);

  // Save JV Voucher
  const handleSave = () => {
    let rowsToSave = [...voucherRows];

    // If inputs have active un-added content, add it automatically
    if (accountName.trim() && (num(creditAmt) > 0 || num(debitAmt) > 0)) {
      const autoRow = {
        id: uid(),
        accountName: accountName.trim(),
        creditAmt: num(creditAmt),
        debitAmt: num(debitAmt),
        remark: remark.trim() || (num(creditAmt) > 0 ? "Credit Entry" : "Debit Entry")
      };
      rowsToSave.push(autoRow);
      setVoucherRows(rowsToSave);
      setAccountName("");
      setCreditAmt("");
      setDebitAmt("");
      setRemark("");
    }

    if (rowsToSave.length < 2) {
      showToast("A Journal Voucher requires at least 2 entries (Debit and Credit)! ", "error");
      return;
    }

    const curCredit = rowsToSave.reduce((s, r) => s + num(r.creditAmt), 0);
    const curDebit = rowsToSave.reduce((s, r) => s + num(r.debitAmt), 0);

    if (Math.abs(curCredit - curDebit) > 0.01) {
      showToast(`⚠️ Journal Voucher is unbalanced! Total Credit (₹${fmt(curCredit)}) must equal Total Debit (₹${fmt(curDebit)})!`, "error");
      return;
    }

    const record = {
      id: activeVoucherId || uid(),
      vouNo,
      lastJvEntry,
      date: entryDate,
      time: currentTimeStr,
      rows: rowsToSave,
      totalCredit: curCredit,
      totalDebit: curDebit,
      createdAt: new Date().toISOString()
    };

    let updatedList;
    if (activeVoucherId) {
      updatedList = jvVouchers.map(v => v.id === activeVoucherId ? record : v);
    } else {
      updatedList = [record, ...jvVouchers];
    }
    saveJvVoucherList(updatedList);

    setActiveVoucherId(record.id);
    showToast(`✅ Journal Voucher #${vouNo} saved successfully!`);
  };

  // Delete JV Voucher
  const handleDelete = () => {
    if (!activeVoucherId) {
      showToast("This is an unsaved new voucher!", "info");
      return;
    }
    showConfirm(`Delete Journal Voucher #${vouNo}?`, () => {
      const remaining = jvVouchers.filter(v => v.id !== activeVoucherId);
      saveJvVoucherList(remaining);
      showToast(`Voucher #${vouNo} deleted!`);
      handleNewVoucher();
    });
  };

  // Sequential Navigation: Prev < and Next >
  const handlePrevVoucher = () => {
    if (jvVouchers.length === 0) return;
    const curIdx = jvVouchers.findIndex(v => v.id === activeVoucherId);
    if (curIdx < 0 || curIdx >= jvVouchers.length - 1) {
      handleOpenVoucher(jvVouchers[jvVouchers.length - 1]);
    } else {
      handleOpenVoucher(jvVouchers[curIdx + 1]);
    }
  };

  const handleNextVoucher = () => {
    if (jvVouchers.length === 0) return;
    const curIdx = jvVouchers.findIndex(v => v.id === activeVoucherId);
    if (curIdx <= 0) {
      handleOpenVoucher(jvVouchers[0]);
    } else {
      handleOpenVoucher(jvVouchers[curIdx - 1]);
    }
  };

  // Print Official Journal Voucher
  const handlePrint = () => {
    if (voucherRows.length === 0) {
      showToast("No JV entries to print!", "error");
      return;
    }

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #0f172a; max-width: 750px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 6px;">
        <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase; color: #0284c7;">SHIV DHARA MEDICAL STORE</h2>
          <p style="margin: 2px 0; font-size: 11px; color: #64748b;">20, GIRIRAJ COMPLEX NIKOL GAAM ROAD, NIKOL, AHMEDABAD | PH: 079352 07999</p>
          <div style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 14px; border-radius: 12px; font-weight: 700; font-size: 11px; margin-top: 4px; border: 1px solid #bae6fd;">
            JOURNAL VOUCHER (J. V. ENTRY)
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 10px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px;">
          <div>
            <strong>Voucher No:</strong> #${vouNo}<br/>
            <strong>Last Ref#:</strong> #${lastJvEntry}
          </div>
          <div style="text-align: right;">
            <strong>Date:</strong> ${entryDate}<br/>
            <strong>Time:</strong> ${currentTimeStr}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px;">
          <thead>
            <tr style="background: #f1f5f9; color: #334155; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 5px; text-align: center; border: 1px solid #cbd5e1; width: 35px;">Sr</th>
              <th style="padding: 5px; text-align: left; border: 1px solid #cbd5e1;">Particulars / Account Name</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 110px;">Debit Amt (₹)</th>
              <th style="padding: 5px; text-align: right; border: 1px solid #cbd5e1; width: 110px;">Credit Amt (₹)</th>
              <th style="padding: 5px; text-align: left; border: 1px solid #cbd5e1;">Remark / Narration</th>
            </tr>
          </thead>
          <tbody>
            ${voucherRows.map((r, i) => `
              <tr>
                <td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">${i + 1}</td>
                <td style="padding: 4px; border: 1px solid #cbd5e1;"><strong>${r.accountName}</strong></td>
                <td style="padding: 4px; text-align: right; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">${r.debitAmt > 0 ? `₹${fmt(r.debitAmt)}` : '-'}</td>
                <td style="padding: 4px; text-align: right; border: 1px solid #cbd5e1; font-weight: bold; color: #16a34a;">${r.creditAmt > 0 ? `₹${fmt(r.creditAmt)}` : '-'}</td>
                <td style="padding: 4px; border: 1px solid #cbd5e1; color: #64748b;">${r.remark || '-'}</td>
              </tr>
            `).join('')}
            <tr style="background: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1;">
              <td colspan="2" style="padding: 6px; text-align: right; border: 1px solid #cbd5e1;">TOTAL :</td>
              <td style="padding: 6px; text-align: right; border: 1px solid #cbd5e1; color: #0284c7;">₹${fmt(totalDebit)}</td>
              <td style="padding: 6px; text-align: right; border: 1px solid #cbd5e1; color: #16a34a;">₹${fmt(totalCredit)}</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 10px; color: #16a34a;">BALANCED</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; font-size: 10px;">
          <div style="border-top: 1px solid #94a3b8; width: 140px; text-align: center;">Prepared By</div>
          <div style="border-top: 1px solid #94a3b8; width: 140px; text-align: center;">Checked By</div>
          <div style="border-top: 1px solid #94a3b8; width: 140px; text-align: center;">Authorized Signatory</div>
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
      } else if (e.key === "Escape") {
        if (showAccountDropdown) {
          setShowAccountDropdown(false);
        } else if (showFindModal) {
          setShowFindModal(false);
        } else {
          handleNewVoucher();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAccountDropdown, showFindModal, vouNo, entryDate, accountName, creditAmt, debitAmt, voucherRows]);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: FULL INTERACTIVE JV ENTRY WORKSTATION (Matches Page 17 + Image 2 Theme)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: "white", borderRadius: "8px", border: "1px solid #cbd5e1", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", height: "100%", maxHeight: "100%", minHeight: 0, overflow: "hidden" }}>
      
      {/* ── TOP HEADER (MATCHES SCREENSHOT PAGE 17: Vou. No, Date, Load Date Entry, Last JV Entry) ── */}
      <div style={{ padding: "8px 14px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#1e293b" }}>Vou. No :</span>
            <input
              type="text"
              value={vouNo}
              onChange={e => setVouNo(e.target.value)}
              style={{ ...inp, width: "75px", height: "24px", fontSize: "11px", fontWeight: "700", textAlign: "center", color: "#0284c7" }}
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
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Load Date Entry :</span>
            <input
              type="text"
              readOnly
              value={currentTimeStr}
              style={{ ...inp, width: "85px", height: "24px", fontSize: "11px", textAlign: "center", background: "#f1f5f9", color: "#64748b" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Last JV Entry :</span>
            <input
              type="text"
              readOnly
              value={`# ${lastJvEntry}`}
              style={{ ...inp, width: "80px", height: "24px", fontSize: "11px", textAlign: "center", background: "#e0f2fe", color: "#0369a1", fontWeight: "700" }}
            />
          </div>

        </div>

        {/* Close Button */}
        <button onClick={() => setShowForm(false)} style={{ ...btn("#475569", "white"), padding: "3px 10px", fontSize: "11px" }}>
          ✕ Close
        </button>

      </div>

      {/* ── ACTIVE ENTRY INPUT ROW (MATCHES SCREENSHOT PAGE 17 GRID HEADERS) ── */}
      <div style={{ padding: "10px 14px", background: "#ffffff", borderBottom: "1px solid #cbd5e1" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 2fr auto", gap: "8px", alignItems: "center" }}>
          
          {/* Select Account Name */}
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
              Select Account Name for Transaction
            </div>
            <input
              type="text"
              placeholder="Search or enter Ledger / Party Name..."
              value={accountName}
              onChange={e => {
                setAccountName(e.target.value);
                setShowAccountDropdown(true);
              }}
              onFocus={() => setShowAccountDropdown(true)}
              style={{ ...inp, height: "26px", fontSize: "11px", fontWeight: "700", background: "white", borderColor: showAccountDropdown ? "#0284c7" : "#cbd5e1" }}
            />

            {showAccountDropdown && (
              <div style={{
                position: "absolute",
                top: "48px",
                left: 0,
                width: "100%",
                background: "white",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                maxHeight: "190px",
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

          {/* Credit Amt */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a", marginBottom: "3px" }}>
              Credit Amt (Cr)
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={creditAmt}
              onChange={e => {
                setCreditAmt(e.target.value);
                if (e.target.value) setDebitAmt(""); // clear opposite
              }}
              onKeyDown={e => {
                if (e.key === "Enter") handleAddRow();
              }}
              style={{ ...inp, height: "26px", fontSize: "12px", fontWeight: "800", textAlign: "right", color: "#16a34a" }}
            />
          </div>

          {/* Debit Amt */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#0284c7", marginBottom: "3px" }}>
              Debit Amt (Dr)
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={debitAmt}
              onChange={e => {
                setDebitAmt(e.target.value);
                if (e.target.value) setCreditAmt(""); // clear opposite
              }}
              onKeyDown={e => {
                if (e.key === "Enter") handleAddRow();
              }}
              style={{ ...inp, height: "26px", fontSize: "12px", fontWeight: "800", textAlign: "right", color: "#0284c7" }}
            />
          </div>

          {/* Remark */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
              Remark
            </div>
            <input
              type="text"
              placeholder="Narration / Purpose..."
              value={remark}
              onChange={e => setRemark(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleAddRow();
              }}
              style={{ ...inp, height: "26px", fontSize: "11px" }}
            />
          </div>

          {/* Add Row Button */}
          <div style={{ alignSelf: "end" }}>
            <button
              type="button"
              onClick={handleAddRow}
              style={{ ...btn("#0284c7", "white"), height: "28px", padding: "0 14px", fontSize: "11px", fontWeight: "700" }}
            >
              + Add Line
            </button>
          </div>

        </div>

      </div>

      {/* ── TABLE GRID (MATCHES SCREENSHOT PAGE 17: Select Account Name for Transaction, Credit Amt, Debit Amt, Remark) ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", color: "#334155", textAlign: "left", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #cbd5e1" }}>
              <th style={{ padding: "6px 8px", width: "40px", textAlign: "center", borderRight: "1px solid #e2e8f0" }}>Sr</th>
              <th style={{ padding: "6px 14px", borderRight: "1px solid #e2e8f0" }}>Select Account Name for Transaction</th>
              <th style={{ padding: "6px 14px", width: "130px", textAlign: "right", borderRight: "1px solid #e2e8f0", color: "#16a34a" }}>Credit Amt (Cr)</th>
              <th style={{ padding: "6px 14px", width: "130px", textAlign: "right", borderRight: "1px solid #e2e8f0", color: "#0284c7" }}>Debit Amt (Dr)</th>
              <th style={{ padding: "6px 14px", borderRight: "1px solid #e2e8f0" }}>Remark</th>
              <th style={{ padding: "6px 8px", width: "45px", textAlign: "center" }}>Act</th>
            </tr>
          </thead>
          <tbody>
            {voucherRows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
                  <div style={{ fontSize: "36px", opacity: 0.5, marginBottom: "8px" }}>⚖️</div>
                  <div style={{ fontWeight: "700", fontSize: "14px" }}>No Journal entries added in this voucher</div>
                  <div style={{ fontSize: "11px", marginTop: "4px" }}>Select Account Name, enter Credit or Debit amount above and click "+ Add Line"</div>
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
                  <td style={{ textAlign: "center", fontWeight: "700", color: "#64748b", padding: "5px 2px", borderRight: "1px solid #e2e8f0" }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: "5px 14px", fontWeight: "700", color: "#0f172a", borderRight: "1px solid #e2e8f0" }}>
                    {r.accountName}
                  </td>
                  <td style={{ padding: "5px 14px", textAlign: "right", fontWeight: "700", color: "#16a34a", borderRight: "1px solid #e2e8f0" }}>
                    {r.creditAmt > 0 ? `₹${fmt(r.creditAmt)}` : "-"}
                  </td>
                  <td style={{ padding: "5px 14px", textAlign: "right", fontWeight: "700", color: "#0284c7", borderRight: "1px solid #e2e8f0" }}>
                    {r.debitAmt > 0 ? `₹${fmt(r.debitAmt)}` : "-"}
                  </td>
                  <td style={{ padding: "5px 14px", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
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

      {/* ── BOTTOM SUMMARY BAR (MATCHES SCREENSHOT PAGE 17: Total Amount Credit/Debit) ── */}
      <div style={{ padding: "8px 14px", background: "#f8fafc", borderTop: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", fontSize: "11px" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontWeight: "700", color: "#334155" }}>Total Amount :</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontWeight: "700", color: "#16a34a" }}>Total Credit (Cr):</span>
            <input
              type="text"
              readOnly
              value={`₹ ${fmt(totalCredit)}`}
              style={{ ...inp, width: "125px", height: "24px", textAlign: "right", fontWeight: "800", background: "white", color: "#16a34a" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontWeight: "700", color: "#0284c7" }}>Total Debit (Dr):</span>
            <input
              type="text"
              readOnly
              value={`₹ ${fmt(totalDebit)}`}
              style={{ ...inp, width: "125px", height: "24px", textAlign: "right", fontWeight: "800", background: "white", color: "#0284c7" }}
            />
          </div>
        </div>

        {/* Balance Status Badge */}
        <div>
          {difference < 0.01 ? (
            <span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 10px", borderRadius: "12px", fontWeight: "700", border: "1px solid #86efac", fontSize: "11px" }}>
              ✓ Journal Balanced (₹0.00 Diff)
            </span>
          ) : (
            <span style={{ background: "#fee2e2", color: "#dc2626", padding: "3px 10px", borderRadius: "12px", fontWeight: "700", border: "1px solid #fecaca", fontSize: "11px" }}>
              ⚠️ Difference: ₹{fmt(difference)} (Unbalanced)
            </span>
          )}
        </div>

      </div>

      {/* ── BOTTOM ACTION TOOLBAR (MATCHES SCREENSHOT PAGE 17 BUTTONS: New, Save, Print, Remove, Find, <, >, Close) ── */}
      <div style={{ background: "#f1f5f9", borderTop: "1px solid #cbd5e1", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
        
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={handleNewVoucher} style={{ ...btn("#0284c7", "white"), padding: "5px 14px", fontSize: "11px", fontWeight: "700", border: "1px solid #0284c7" }} title="New JV Entry (Alt+N)">
            ➕ New (Alt+N)
          </button>

          <button onClick={handleSave} style={{ ...btn("#0284c7", "white"), padding: "5px 16px", fontSize: "11px", fontWeight: "700" }} title="Save Journal Voucher (F2)">
            Save (F2)
          </button>

          <button onClick={handlePrint} style={{ ...btn("#ffffff", "#334155"), padding: "5px 12px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            Print
          </button>

          <button onClick={handleDelete} style={{ ...btn("#fee2e2", "#dc2626"), padding: "5px 12px", fontSize: "11px", border: "1px solid #fecaca" }}>
            Remove
          </button>

          <button onClick={() => setShowFindModal(true)} style={{ ...btn("#ffffff", "#334155"), padding: "5px 12px", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            Find
          </button>

          {/* Sequential Navigation: Prev < and Next > */}
          <button onClick={handlePrevVoucher} style={{ ...btn("#ffffff", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Previous JV">
            &lt;
          </button>
          <button onClick={handleNextVoucher} style={{ ...btn("#ffffff", "#334155"), padding: "5px 10px", fontSize: "11px", border: "1px solid #cbd5e1" }} title="Next JV">
            &gt;
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
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>🔍 Find Journal Voucher</div>
              <button onClick={() => setShowFindModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>

            <div style={{ padding: "8px", overflowY: "auto", flex: 1 }}>
              {jvVouchers.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No journal vouchers found</div>
              ) : (
                jvVouchers.map(vch => (
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
                        Voucher #{vch.vouNo} — {vch.date}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {(vch.rows || []).length} accounts | {(vch.rows || []).map((r: any) => r.accountName).join(" ⇄ ")}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "800", color: "#0284c7" }}>Amount: ₹{fmt(vch.totalDebit)}</div>
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
