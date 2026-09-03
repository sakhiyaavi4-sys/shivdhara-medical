// @ts-nocheck
/* eslint-disable */
import React, { useState } from "react";
import { 
  Settings, Printer, ShoppingCart, Package, FileText, Shield, 
  Save, RefreshCw, X, Search, Check, Sliders, Lock, Key, 
  HelpCircle, Monitor, HardDrive, AlertCircle, ChevronRight, 
  Layers, CheckCircle2, Sparkles, Filter, Hash, Database
} from "lucide-react";
import { useMedicalStore, inp, btn, fmt } from "./MedicalStoreContext";

export default function ApplicationSetupModal() {
  const {
    showAppSetup, setShowAppSetup,
    appSetupTab, setAppSetupTab,
    appSetupData, setAppSetupData,
    showToast
  } = useMedicalStore();

  const [searchQuery, setSearchQuery] = useState("");

  if (!showAppSetup) return null;

  const tabs = [
    { id: "printing", label: "Printing Option", icon: <Printer size={18} />, badge: "Header & Formats", color: "#0d9488" },
    { id: "sales", label: "Sales Option", icon: <ShoppingCart size={18} />, badge: "Billing & Stock", color: "#0284c7" },
    { id: "sales2", label: "Sales Option 2", icon: <Sliders size={18} />, badge: "Rules & Invoices", color: "#6366f1" },
    { id: "purch", label: "Purch Option", icon: <Package size={18} />, badge: "Purchase & Margin", color: "#8b5cf6" },
    { id: "other", label: "Other Option", icon: <FileText size={18} />, badge: "Barcode & Slips", color: "#d97706" },
    { id: "admin1", label: "Admin Option 1", icon: <Shield size={18} />, badge: "Access Controls", color: "#e11d48" },
    { id: "admin2", label: "Admin Option 2", icon: <HardDrive size={18} />, badge: "Printers & System", color: "#059669" },
  ];

  const toggle = (key: string) => {
    setAppSetupData((prev: any) => ({
      ...prev,
      [key]: !prev?.[key]
    }));
  };

  const update = (key: string, val: any) => {
    setAppSetupData((prev: any) => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem("store_app_setup", JSON.stringify(appSetupData));
      showToast("Application Setup saved successfully!", "success");
    } catch (e) {
      showToast("Failed to save setup data", "error");
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all settings to default values?")) {
      const defaultData = {
        companyAccessCode: "",
        address1: "20, GIRIRAJ COMPLEX NIKOL GAAM ROAD ,NIKOL,AHMEDABAD",
        address2: "", address3: "", address4: "",
        gstNo: "24AJFPP4074M1ZU", dlNo: "DL NO:20 GARA 588,21 GARA 588.",
        jurisdiction: "SUBJECT TO AHMEDABAD JURISDICTION",
        message: "HAVE A FAST RECOVERY & GOOD HEALTH",
        billingFonts: "Courier New", billStyle: "Dot Matrix",
        reportFonts: "Courier New", reportStyle: "Dot Matrix",
        headerFont: "Draft 10cpi", printerFonts: "Draft",
        marginTop: "0", marginBottom: "0", marginLeft: "0", marginLines: "0",
        selectedBillStyle: 0,
        menuLanguage: "Gujarati",
        rateCalc: "Normal Calc",
        stockMarginPct: "5",
        contractDiscPct: "6",
        esiBillItemPrint: "1",
        filePath: "D:\\Retail",
        chqPrinter: "EPSON LX-300+ /II",
        billPrinter: "EPSON LX-300+ /II",
        reportPrinter: "EPSON LX-300+ /II",
        barcodePrinter: "EPSON LX-300+ /II",
        esiStationary: "Inkjet/Laser",
        vatBillingType: "Retail Invoice",
        vatRateSale: "Set Rate & Tax on Mrp",
        retailTaxSelect: "Retail (Close)",
        salesBillCopies: "1",
        fixedAreaName: "",
        ptrFormat: "Rs.",
        purchRetailTax: "Tax (Open)",
        purchReturnPrint: "Normal",
        barcodeHeader: "",
        barcodeFont: "Code 128",
        fixedDiscPurchRet: "",
        softKeyOtherBill: "",
        passKeyOtherBill: "",
        passKeyCashBank: "",
        myCode: "",
        fixVatPct: ""
      };
      setAppSetupData(defaultData);
      showToast("Settings reset to defaults", "info");
    }
  };

  // Modern Switch Card Component
  const SwitchCard = ({ label, optKey, desc }: { label: string, optKey: string, desc?: string }) => {
    const isChecked = !!appSetupData?.[optKey];
    const matchesSearch = searchQuery && label.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (searchQuery && !matchesSearch) return null;

    return (
      <div 
        onClick={() => toggle(optKey)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: isChecked ? "rgba(13, 148, 136, 0.05)" : "#ffffff",
          borderRadius: "10px",
          border: matchesSearch 
            ? "2px solid #0d9488" 
            : isChecked 
            ? "1px solid rgba(13, 148, 136, 0.35)" 
            : "1px solid #e2e8f0",
          cursor: "pointer",
          transition: "all 0.18s ease-in-out",
          boxShadow: isChecked ? "0 2px 8px rgba(13, 148, 136, 0.08)" : "0 1px 3px rgba(0,0,0,0.02)",
        }}
        onMouseEnter={e => {
          if (!isChecked) {
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.background = "#f8fafc";
          }
        }}
        onMouseLeave={e => {
          if (!isChecked) {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.background = "#ffffff";
          }
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, paddingRight: "14px" }}>
          <span style={{ 
            fontSize: "13px", 
            fontWeight: isChecked ? "600" : "500", 
            color: isChecked ? "#0f766e" : "#334155",
            lineHeight: "1.4"
          }}>
            {label}
          </span>
          {desc && <span style={{ fontSize: "11px", color: "#94a3b8" }}>{desc}</span>}
        </div>

        {/* Animated Toggle Switch */}
        <div style={{
          width: "42px",
          height: "22px",
          borderRadius: "11px",
          background: isChecked ? "#0d9488" : "#cbd5e1",
          position: "relative",
          flexShrink: 0,
          transition: "background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: isChecked ? "inset 0 1px 3px rgba(0,0,0,0.2)" : "inset 0 1px 2px rgba(0,0,0,0.1)"
        }}>
          <div style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "#ffffff",
            position: "absolute",
            top: "3px",
            left: isChecked ? "23px" : "3px",
            transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)"
          }} />
        </div>
      </div>
    );
  };

  // Modern Inline Input / Select Card
  const InputCard = ({ label, optKey, type = "text", placeholder, options, desc }: any) => {
    const val = appSetupData?.[optKey] || "";
    const matchesSearch = searchQuery && label.toLowerCase().includes(searchQuery.toLowerCase());

    if (searchQuery && !matchesSearch) return null;

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "12px 16px",
        background: "#ffffff",
        borderRadius: "10px",
        border: matchesSearch ? "2px solid #0d9488" : "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>
            {label}
          </label>
          {desc && <span style={{ fontSize: "10px", color: "#94a3b8" }}>{desc}</span>}
        </div>

        {type === "select" ? (
          <select 
            value={val} 
            onChange={e => update(optKey, e.target.value)}
            style={{
              width: "100%",
              padding: "7px 10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              color: "#1e293b",
              fontSize: "13px",
              fontWeight: "500",
              outline: "none",
              cursor: "pointer"
            }}
          >
            {options.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input 
            type={type}
            value={val}
            placeholder={placeholder}
            onChange={e => update(optKey, e.target.value)}
            style={{
              width: "100%",
              padding: "7px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#1e293b",
              fontSize: "13px",
              fontWeight: "500",
              outline: "none"
            }}
            onFocus={e => e.currentTarget.style.borderColor = "#0d9488"}
            onBlur={e => e.currentTarget.style.borderColor = "#cbd5e1"}
          />
        )}
      </div>
    );
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
      background: "#ffffff",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
        
        {/* ── TOP HEADER ── */}
        <div style={{
          background: "linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)",
          color: "#ffffff",
          padding: "10px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          flexShrink: 0
        }}>
          {/* Title & Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
            }}>
              <Settings size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: "700", fontSize: "17px", letterSpacing: "-0.2px" }}>
                  Application Setup & Configuration
                </span>
                <span style={{
                  fontSize: "11px",
                  background: "rgba(255,255,255,0.22)",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontWeight: "600",
                  letterSpacing: "0.4px"
                }}>
                  7 CORE MODULES
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>
                Configure global printing, sales rules, barcode scanning, POS workflow & admin restrictions
              </span>
            </div>
          </div>

          {/* Right Action Tools */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Live Search */}
            <div style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.18)",
              borderRadius: "8px",
              padding: "4px 10px",
              width: "240px",
              border: "1px solid rgba(255,255,255,0.25)"
            }}>
              <Search size={14} color="#ffffff" style={{ opacity: 0.8, marginRight: "6px" }} />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search any setting..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#ffffff",
                  fontSize: "12px",
                  width: "100%",
                }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: 0 }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Access Code */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(0,0,0,0.18)",
              padding: "4px 10px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)"
            }}>
              <Key size={13} color="#ffffff" style={{ opacity: 0.8 }} />
              <span style={{ fontSize: "11px", fontWeight: "500", opacity: 0.9 }}>Code:</span>
              <input 
                value={appSetupData?.companyAccessCode || ""} 
                onChange={e => update("companyAccessCode", e.target.value)} 
                placeholder="Access"
                style={{ 
                  background: "transparent", 
                  border: "none", 
                  color: "#fff", 
                  width: "65px", 
                  outline: "none", 
                  fontSize: "12px", 
                  fontWeight: "600" 
                }} 
              />
            </div>

            {/* Reset Button */}
            <button 
              onClick={handleReset}
              title="Reset all settings to default"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            >
              <RefreshCw size={13} /> Reset
            </button>

            {/* Save Button */}
            <button 
              onClick={handleSave}
              style={{
                background: "#ffffff",
                color: "#0f766e",
                border: "none",
                padding: "6px 18px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                transition: "all 0.15s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
              }}
            >
              <Save size={15} /> Save Setup
            </button>

            {/* Close Button */}
            <button 
              onClick={() => setShowAppSetup(false)}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "#ffffff",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── HORIZONTAL 7-TAB NAVBAR ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 16px",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          overflowX: "auto",
          flexShrink: 0
        }}>
          {tabs.map(t => {
            const isActive = appSetupTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setAppSetupTab(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: isActive ? "1px solid #0f766e" : "1px solid transparent",
                  background: isActive ? "#0f766e" : "#ffffff",
                  color: isActive ? "#ffffff" : "#475569",
                  fontWeight: isActive ? "600" : "500",
                  fontSize: "13px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.18s ease-in-out",
                  boxShadow: isActive ? "0 2px 6px rgba(15, 118, 110, 0.25)" : "0 1px 2px rgba(0,0,0,0.03)"
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#f1f5f9";
                    e.currentTarget.style.color = "#0f766e";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.color = "#475569";
                  }
                }}
              >
                <span style={{ color: isActive ? "#ffffff" : t.color }}>{t.icon}</span>
                <span>{t.label}</span>
                <span style={{
                  fontSize: "10px",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  background: isActive ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                  color: isActive ? "#ffffff" : "#64748b",
                  fontWeight: "600"
                }}>
                  {t.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT BODY ── */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 16px",
          background: "#f1f5f9"
        }}>

          {/* ══════════════════════════════════════════════════
              TAB 1: PRINTING OPTION
              ══════════════════════════════════════════════════ */}
          {appSetupTab === "printing" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px" }}>
                
                {/* Store Header & Addresses */}
                <div style={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                    <FileText size={16} color="#0d9488" />
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                      Store Identity & Bill Header Details
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <InputCard label="Address Line 1" optKey="address1" placeholder="20, GIRIRAJ COMPLEX NIKOL GAAM ROAD ,NIKOL,AHMEDABAD" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      <InputCard label="Address Line 2" optKey="address2" placeholder="Near City Center / Landmark" />
                      <InputCard label="Address Line 3" optKey="address3" placeholder="Area / City / Pincode" />
                    </div>
                    <InputCard label="Address Line 4 (Contact / Phone)" optKey="address4" placeholder="Ph: +91 98765 43210, Email: store@example.com" />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "2px" }}>
                      <InputCard label="GSTIN Number" optKey="gstNo" placeholder="GST NO:24AJFPP4074M1ZU" />
                      <InputCard label="Drug License (DL) No." optKey="dlNo" placeholder="DL NO:20 GARA 588, 21 GARA 588" />
                    </div>

                    <InputCard label="Legal Jurisdiction" optKey="jurisdiction" placeholder="SUBJECT TO AHMEDABAD JURISDICTION" />
                    <InputCard label="Bill Footer Recovery Message" optKey="message" placeholder="HAVE A FAST RECOVERY & GOOD HEALTH" />
                  </div>
                </div>

                {/* Typography & Dimensions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    padding: "20px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                      <Printer size={18} color="#0d9488" />
                      <span style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>
                        Typography & Formatting Styles
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <InputCard label="Billing Fonts" optKey="billingFonts" placeholder="Courier New" />
                      <InputCard label="Bill Print Style" optKey="billStyle" type="select" options={["Dot Matrix", "Laser", "Thermal 80mm", "Inkjet"]} />
                      <InputCard label="Report Fonts" optKey="reportFonts" placeholder="Courier New" />
                      <InputCard label="Report Print Style" optKey="reportStyle" type="select" options={["Dot Matrix", "Laser", "Thermal 80mm", "Inkjet"]} />
                      <InputCard label="Header Font Style" optKey="headerFont" placeholder="Draft 10cpi" />
                      <InputCard label="Printer Fonts Mode" optKey="printerFonts" type="select" options={["Draft", "Courier", "Roman", "Sans-Serif"]} />
                    </div>

                    <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "16px", paddingTop: "14px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "8px" }}>
                        Print Margins (in mm / lines)
                      </span>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                        <InputCard label="Top" optKey="marginTop" type="number" placeholder="0" />
                        <InputCard label="Bottom" optKey="marginBottom" type="number" placeholder="0" />
                        <InputCard label="Left" optKey="marginLeft" type="number" placeholder="0" />
                        <InputCard label="Lines" optKey="marginLines" type="number" placeholder="0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill Formats Visual Grid */}
              <div style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sparkles size={18} color="#0d9488" />
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>
                      Select Standard Bill Print Format & Layout
                    </span>
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Selected: <strong>{[
                      "Plain 1000×400", "Plain 1000×600", "Plain 600×300", 
                      "Plain 1000×400 (No Rate)", "Plain 1000×300", "Inkjet / Laser A4", 
                      "Plain 600×600", "Thermal POS (3 Inch)", "Thermal POS (4 Inch)"
                    ][appSetupData?.selectedBillStyle || 0]}</strong>
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {[
                    { id: 0, title: "Plain 1000×400", type: "Dot Matrix Half Page", icon: "📄" },
                    { id: 1, title: "Plain 1000×600", type: "Full Page Invoice", icon: "📋" },
                    { id: 2, title: "Plain 600×300", type: "Compact Slip", icon: "📑" },
                    { id: 3, title: "Plain 1000×400 (No Rate)", type: "Delivery Challan Format", icon: "📦" },
                    { id: 4, title: "Plain 1000×300", type: "Narrow Continuous", icon: "📜" },
                    { id: 5, title: "Inkjet / Laser A4", type: "Modern Graphic Bill", icon: "🖨️" },
                    { id: 6, title: "Plain 600×600", type: "Square Format", icon: "📑" },
                    { id: 7, title: "Thermal POS (3 Inch)", type: "80mm Fast POS Roll", icon: "🧾" },
                    { id: 8, title: "Thermal POS (4 Inch)", type: "100mm Wide Roll", icon: "🧾" },
                  ].map(f => {
                    const isSelected = appSetupData?.selectedBillStyle === f.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => update("selectedBillStyle", f.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          borderRadius: "10px",
                          border: isSelected ? "2px solid #0d9488" : "1px solid #e2e8f0",
                          background: isSelected ? "rgba(13, 148, 136, 0.06)" : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.15s ease-in-out"
                        }}
                      >
                        <span style={{ fontSize: "24px" }}>{f.icon}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: isSelected ? "#0f766e" : "#1e293b", display: "block" }}>
                            {f.title}
                          </span>
                          <span style={{ fontSize: "11px", color: isSelected ? "#0d9488" : "#94a3b8" }}>
                            {f.type}
                          </span>
                        </div>
                        {isSelected && (
                          <div style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: "#0d9488",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            <Check size={12} color="#fff" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 2: SALES OPTION (Module 1)
              ══════════════════════════════════════════════════ */}
          {appSetupTab === "sales" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "16px 20px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ShoppingCart size={20} color="#0284c7" />
                  <div>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", display: "block" }}>
                      Sales Bill & POS Operations Controls
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Define real-time item lookup, batch selection, doctor/patient auto-records, and sale locks
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { opt: "Search Items on MRP in Sales Bill", key: "sale_search_mrp" },
                  { opt: "Search Items on Batch in Sales Bill", key: "sale_search_batch" },
                  { opt: "Display All Items in Sales Bill", key: "sale_display_all" },
                  { opt: "Display Only Stock Items in Sales Bill", key: "sale_display_stock_only" },
                  { opt: "Cursor at Item Name in Sales Bill", key: "sale_cursor_item" },
                  { opt: "Sales Rate in Sales Bill Changeable", key: "sale_rate_changeable" },
                  { opt: "Itemwise Discount Allowed", key: "sale_itemwise_disc" },
                  { opt: "Batch/Expiry/Rate No change in Sales Bill", key: "sale_lock_batch_exp" },
                  { opt: "Expired Item No Sale in Sales Bill", key: "sale_block_expired" },
                  { opt: "Give message for Short Expired Item", key: "sale_short_expiry_msg" },
                  { opt: "Don't Ask for TAX% in Sales Bill", key: "sale_no_tax_prompt" },
                  { opt: "In Sales Bill TAX % = 0", key: "sale_zero_tax" },
                  { opt: "Ask for Save Bill as Kit after Save", key: "sale_save_kit_prompt" },
                  { opt: "Open Selection box when cursor at Item", key: "sale_open_sel_box" },
                  { opt: "Don't Display Auto Item Detail (F4)", key: "sale_no_auto_f4" },
                  { opt: "Do Not Accept if Sale Qty > Stock Qty", key: "sale_block_overselling" },
                  { opt: "Auto Select Another Batch of Item", key: "sale_auto_switch_batch" },
                  { opt: "Search Mrp from Stock-Mrp Code", key: "sale_mrp_code_search" },
                  { opt: "Search Only Same Mrp From Batch List", key: "sale_same_mrp_filter" },
                  { opt: "Patient Name Add in List in Sales Bill", key: "sale_auto_add_patient" },
                  { opt: "Doctor Name Add in List in Sales Bill", key: "sale_auto_add_doctor" },
                  { opt: "Display Item Other Detail in Sales Bill", key: "sale_display_extra_info" },
                  { opt: "Sales Man Compulsory in Sales Bill", key: "sale_salesman_mandatory" },
                  { opt: "Print Default in Custom Selection BPrint", key: "sale_bprint_default" },
                  { opt: "Contract Employee Name in Single", key: "sale_contract_emp" },
                  { opt: "Patient Code Searching", key: "sale_patient_code_search" },
                  { opt: "Open box to enter Order Qty", key: "sale_order_qty_box" },
                  { opt: "Select Discount Batchwise from Purchase", key: "sale_disc_from_purch" },
                  { opt: "Display Schedule Product in colour", key: "sale_schedule_color" }
                ].map(item => (
                  <SwitchCard key={item.key} label={item.opt} optKey={item.key} />
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 3: SALES OPTION 2 (Module 2)
              ══════════════════════════════════════════════════ */}
          {appSetupTab === "sales2" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "16px 20px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Sliders size={20} color="#6366f1" />
                  <div>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", display: "block" }}>
                      Sales Rules 2 & Tax / Bill Copy Settings
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Rounding logic, Profit calculations, invoice categories, copies and area setup
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { opt: "Profit Percent Amount / 100", key: "sale2_profit_pct" },
                  { opt: "Sorted Batch in Sales Bill (Expiry Date)", key: "sale2_sort_exp_batch" },
                  { opt: "Round off .50 Paise Round", key: "sale2_round_50p" },
                  { opt: "Show Batches where Minimum Stock is 0", key: "sale2_show_zero_stock" },
                  { opt: "Fixed Disc for Sales Bill", key: "sale2_fixed_disc" },
                  { opt: "Disc For Debit Sales Bill", key: "sale2_debit_disc" },
                  { opt: "Don't Display Minus Stock in Batch List", key: "sale2_no_minus_stock" },
                  { opt: "Default Selection N.A.", key: "sale2_default_na" }
                ].map(item => (
                  <SwitchCard key={item.key} label={item.opt} optKey={item.key} />
                ))}

                <InputCard 
                  label="VAT / GST Billing Type" 
                  optKey="vatBillingType" 
                  type="select" 
                  options={["Retail Invoice", "Tax Invoice", "Composite Invoice", "Bill of Supply"]} 
                />
                <InputCard 
                  label="VAT / GST Rate in Sale Bill" 
                  optKey="vatRateSale" 
                  type="select" 
                  options={["Set Rate & Tax on Mrp", "Exclusive Tax", "Inclusive Tax"]} 
                />
                <InputCard 
                  label="Retail / Tax Selection Mode" 
                  optKey="retailTaxSelect" 
                  type="select" 
                  options={["Retail (Close)", "Tax (Open)", "Always Open", "Ask Every Time"]} 
                />
                <InputCard 
                  label="Number of Sales Bill Copies to Print" 
                  optKey="salesBillCopies" 
                  type="number" 
                  placeholder="1" 
                />
                <InputCard 
                  label="Fixed Area Name for Sales Bill" 
                  optKey="fixedAreaName" 
                  placeholder="e.g. Local Area / City" 
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 4: PURCH OPTION
              ══════════════════════════════════════════════════ */}
          {appSetupTab === "purch" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "16px 20px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Package size={20} color="#8b5cf6" />
                  <div>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", display: "block" }}>
                      Purchase Inward, Challan & Margin Rules
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Configure stripwise entry, margin formulas, PTR options, challans, and supplier relations
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { opt: "Search Items on MRP in Purchase Bill", key: "pur_search_mrp" },
                  { opt: "Display All Items in Purchase / Challan", key: "pur_display_all" },
                  { opt: "Item Name Setfocus in Purchase Bill", key: "pur_setfocus_name" },
                  { opt: "Challan Entry in Purchase Bill", key: "pur_challan_entry" },
                  { opt: "Challan Transfer Item Wise", key: "pur_challan_item_trans" },
                  { opt: "Challan Item Display in Purchase Bill", key: "pur_challan_item_disp" },
                  { opt: "Purchase Entry Strip Wise", key: "pur_stripwise_entry" },
                  { opt: "Purchase Return Entry Unit Wise", key: "pur_return_unitwise" },
                  { opt: "Round off in Purchase Bill", key: "pur_roundoff" },
                  { opt: "Scheme Display on Selection of Item", key: "pur_scheme_disp" },
                  { opt: "Challan No is not Compulsory", key: "pur_challan_not_comp" },
                  { opt: "Purchase/Challan Qty/Free Before Amount", key: "pur_qty_before_amt" },
                  { opt: "In Purchase Bill Display LP 1-0 Challan", key: "pur_disp_lp_challan" },
                  { opt: "In Purchase PTR - Disc + Oct + Vat", key: "pur_ptr_calc" },
                  { opt: "Octroi in Free Goods Added", key: "pur_octroi_free_goods" },
                  { opt: "In Purchase Rate Display of Unit", key: "pur_rate_disp_unit" },
                  { opt: "Multiple Discount Allowed", key: "pur_multi_disc" },
                  { opt: "Don't Display Itemwise Margin", key: "pur_no_margin_disp" },
                  { opt: "In Purchase Vat/GST Calculate on M.R.P.", key: "pur_vat_on_mrp" },
                  { opt: "In Purchase Vat/GST on M.R.P. Inclusive", key: "pur_vat_mrp_inc" },
                  { opt: "Supplier - Company Relation no auto save", key: "pur_supp_comp_no_save" },
                  { opt: "If LP Different Add New Batch (Purchase)", key: "pur_lp_diff_new_batch" },
                  { opt: "In Purchase Margin - Mrp Pr / Pr = 100", key: "pur_margin_mrp_pr" },
                  { opt: "In Purchase Margin - Mrp LP / LP = 100", key: "pur_margin_mrp_lp" },
                  { opt: "In Purchase Margin - Mrp LP / Mrp = 100", key: "pur_margin_mrp_mrp" },
                  { opt: "In Purch. Disc. Calculate after Half Schm", key: "pur_disc_half_schm" },
                  { opt: "From Convert to Challan Display Sch Color", key: "pur_convert_sch_color" },
                  { opt: "In Purchase Open Excise Calculation", key: "pur_open_excise" },
                  { opt: "Disable Order/Max/Vat on Mrp in Purchase", key: "pur_disable_order_max" },
                  { opt: "Display Last PRate as Message in Purchase", key: "pur_last_prate_msg" },
                  { opt: "Clear From Order if Old Purchase Save", key: "pur_clear_order_save" },
                  { opt: "Item wise Vat on PTR/Mrp", key: "pur_itemwise_vat" },
                  { opt: "Display Purchase Detail Auto", key: "pur_disp_detail_auto" }
                ].map(item => (
                  <SwitchCard key={item.key} label={item.opt} optKey={item.key} />
                ))}

                <InputCard label="PTR Format in Rs...." optKey="ptrFormat" placeholder="Rs." />
                <InputCard label="Retail/Tax Selection" optKey="purchRetailTax" type="select" options={["Tax (Open)", "Retail (Close)", "Automatic"]} />
                <InputCard label="Purchase Return Print Style" optKey="purchReturnPrint" type="select" options={["Normal", "Compact", "Detailed"]} />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 5: OTHER OPTION
              ══════════════════════════════════════════════════ */}
          {appSetupTab === "other" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "16px 20px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FileText size={20} color="#d97706" />
                  <div>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", display: "block" }}>
                      Barcode Scanner, Stationary & Miscellaneous Rules
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Barcode detection, search workflows, stationary layouts, and receipt messages
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <InputCard label="Barcode Header" optKey="barcodeHeader" placeholder="SHIVDHARA MEDICAL" />
                <InputCard label="Barcode Font" optKey="barcodeFont" type="select" options={["Code 128", "EAN-13", "QR Code", "Code 39"]} />

                {[
                  { opt: "Search Item with Item BarCode", key: "bar_search_item" },
                  { opt: "Search Item with Company BarCode", key: "bar_search_company" },
                  { opt: "Search Item with BarCode as Batch", key: "bar_search_batch" },
                  { opt: "Search Item with Stock Barcode", key: "bar_search_stock" },
                  { opt: "Search Items by Item / Batch / Mrp Barcode", key: "bar_search_all_combos" },
                  { opt: "Add Item After Selecting Barcode", key: "bar_auto_add_item" },
                  { opt: "Merge Item For Printing Sales Bill", key: "bar_merge_item_print" },
                  { opt: "Search Item with BarCode in Purchase", key: "bar_search_purch" },
                  { opt: "Don't Open Barcode Box", key: "bar_no_open_box" },
                  { opt: "Order in Sequence from Su-Co Relation", key: "bar_seq_su_co" },
                  { opt: "Print Order in Stationary", key: "bar_print_order_stat" },
                  { opt: "Print Order in Pre-Defined", key: "bar_print_order_pre" },
                  { opt: "Print Purchase Return in 600 x 400", key: "bar_pur_ret_600x400" },
                  { opt: "In Purchase Return - Rate not Update", key: "bar_pur_ret_no_rate_upd" },
                  { opt: "Display Sales Return in Sales Receipt", key: "bar_sales_ret_in_rcpt" },
                  { opt: "Display P.Return in Purchase Payment", key: "bar_pret_in_payment" },
                  { opt: "Dont Update Receipt Message in Sales", key: "bar_no_upd_rcpt_msg" },
                  { opt: "Add Tax Print in Message", key: "bar_tax_in_msg" },
                  { opt: "Print Original / Duplicate in Bill", key: "bar_orig_dup_bill" }
                ].map(item => (
                  <SwitchCard key={item.key} label={item.opt} optKey={item.key} />
                ))}

                <InputCard label="Fixed Discount For Purchase Return" optKey="fixedDiscPurchRet" placeholder="0.00 %" />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 6: ADMIN OPTION 1
              ══════════════════════════════════════════════════ */}
          {appSetupTab === "admin1" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "16px 20px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Shield size={20} color="#e11d48" />
                  <div>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", display: "block" }}>
                      Administrative Restrictions & Staff Security Locks
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Enforce strict operator permissions, modification locks, mandatory fields, and safety gates
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { opt: "Display Kit List in Main Screen", key: "adm_display_kit" },
                  { opt: "Display Reminder in Main Screen", key: "adm_display_reminder" },
                  { opt: "Balance Sheet Account Group Trans", key: "adm_bs_group_trans" },
                  { opt: "Do Not Display Detail for USER", key: "adm_hide_detail_user" },
                  { opt: "In Sales: Calculate Amt on PTR", key: "adm_sales_amt_ptr" },
                  { opt: "Do Not Display Time in Sales Bill", key: "adm_no_time_bill" },
                  { opt: "Do Not Display Bill Nos in Sales Bill", key: "adm_no_billno_bill" },
                  { opt: "Item Ledger Sr Display in Sales", key: "adm_ledger_sr_sales" },
                  { opt: "Closing Stock Auto in Finance Rep", key: "adm_closing_stock_fin" },
                  { opt: "No Round off in Contract Report", key: "adm_no_round_contract" },
                  { opt: "In Sales Bill duplicate Batch Allowed", key: "adm_dup_batch_sales" },
                  { opt: "Cursor at Item Name in Direct Bill", key: "adm_cursor_item_direct" },
                  { opt: "Stripwise Enter in Stock/Sales", key: "adm_stripwise_stock_sales" },
                  { opt: "No Display Party in Batch in Purchase", key: "adm_no_disp_party_batch" },
                  { opt: "Pur.Ret Allow if not in Stock", key: "adm_pur_ret_nostock" },
                  { opt: "Purchase Bill Edit even after Payment", key: "adm_pur_edit_after_pay" },
                  { opt: "Mobile No Compulsory in Sales", key: "adm_mobile_compulsory" },
                  { opt: "Sales Rate Changeable in Purchase", key: "adm_srate_change_purch" },
                  { opt: "S.Rate < LP not Allowed in Purchase", key: "adm_srate_lt_lp_block" },
                  { opt: "Sale Bill Item Search Fast", key: "adm_fast_item_search" },
                  { opt: "SMS to Doctor from Sales", key: "adm_sms_doctor" },
                  { opt: "Stock Display in Strip/Loose", key: "adm_stock_strip_loose" },
                  { opt: "Display Item Margin in Sale", key: "adm_display_margin_sale" },
                  { opt: "No Less Allowed in Sales", key: "adm_no_less_sale" },
                  { opt: "Round Off Effect in A/c", key: "adm_round_effect_ac" },
                  { opt: "On Num Lock if Close Sales", key: "adm_numlock_close_sale" },
                  { opt: "No Direct Sales Allowed", key: "adm_no_direct_sale" },
                  { opt: "Batch / ExpDt Compulsory", key: "adm_batch_exp_compulsory" },
                  { opt: "On Edit Cursor at Grid", key: "adm_cursor_grid_edit" },
                  { opt: "Chalan to Bill Screen Open", key: "adm_chln_bill_open" },
                  { opt: "Hide Previous Year in Login", key: "adm_hide_prev_year" },
                  { opt: "Do Not Save Changed Entry in History", key: "adm_no_save_history" },
                  { opt: "User Can Not Modify Direct Sales Bill", key: "adm_user_no_mod_direct" },
                  { opt: "User Can Not Modify Purchase Bill", key: "adm_user_no_mod_purch" },
                  { opt: "User Can Not Modify Purchase Challan", key: "adm_user_no_mod_challan" },
                  { opt: "User Can Not Modify Sales Bill", key: "adm_user_no_mod_sales" },
                  { opt: "User Can Not Modify Cash/Bank/JV Entry", key: "adm_user_no_mod_cashbank" },
                  { opt: "User Can Not Create Old Date Sales", key: "adm_user_no_old_date" },
                  { opt: "User Can Not Modify Date in SalesBill", key: "adm_user_no_mod_date_sale" },
                  { opt: "Admin Can Not Modify Date in Purchase", key: "adm_admin_no_mod_date_pur" },
                  { opt: "User Can Not View List in Sales Bill", key: "adm_user_no_view_list_sale" },
                  { opt: "User Can View List of Sell in Sale", key: "adm_user_view_sell_list" },
                  { opt: "User Can Not Use Function Key in Sales", key: "adm_user_no_fn_keys" },
                  { opt: "User Can Not Delete Pending Bills", key: "adm_user_no_del_pending" },
                  { opt: "User Can Not Use F2 for Create New", key: "adm_user_no_f2_new" },
                  { opt: "User Can Not Enter Less/Discount/Other", key: "adm_user_no_less_disc" },
                  { opt: "Ask Password to view Report M Detail", key: "adm_pass_rep_m" },
                  { opt: "Cash/Bank/JV Entry Password Protected", key: "adm_pass_cash_bank" },
                  { opt: "Patient Slow Searching Load in Startup", key: "adm_slow_patient_load" }
                ].map(item => (
                  <SwitchCard key={item.key} label={item.opt} optKey={item.key} />
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 7: ADMIN OPTION 2
              ══════════════════════════════════════════════════ */}
          {appSetupTab === "admin2" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "16px 20px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <HardDrive size={20} color="#059669" />
                  <div>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", display: "block" }}>
                      Hardware, Printers & System Security Codes
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Specify hardware device ports, printer models, margin defaults, and system language
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <InputCard label="Software Key For Other Bill" optKey="softKeyOtherBill" placeholder="KEY-XXXX-XXXX" />
                <InputCard label="Password Key for Other Bill" optKey="passKeyOtherBill" type="password" placeholder="••••••••" />
                <InputCard label="Password Key for Cash/Bank Entry" optKey="passKeyCashBank" type="password" placeholder="••••••••" />
                <InputCard label="My Store Code" optKey="myCode" placeholder="SDM-001" />

                <InputCard label="Margin % of Purchase for Stock Entry" optKey="stockMarginPct" type="number" placeholder="5" />
                <InputCard label="Discount % in Contract Bills" optKey="contractDiscPct" type="number" placeholder="6" />
                <InputCard label="Bill Item Printing For ESI Reports" optKey="esiBillItemPrint" type="number" placeholder="1" />
                
                <SwitchCard label="Discount / Addition in Item Allowed" optKey="disc_addition_item_allowed" />

                <InputCard label="Menu Language" optKey="menuLanguage" type="select" options={["Gujarati", "English", "Hindi"]} />
                <InputCard label="Rate Calculation Method" optKey="rateCalc" type="select" options={["Normal Calc", "Reverse Calc", "MRP Inclusive Formula"]} />
                <InputCard label="Fix VAT% / GST%" optKey="fixVatPct" placeholder="18%" />
                <InputCard label="Data Backup / Local File Path" optKey="filePath" placeholder="D:\Retail or C:\Shivdhara\Data" />

                <InputCard label="Cheque Printer Device" optKey="chqPrinter" type="select" options={["EPSON LX-300+ /II", "HP LaserJet 1020", "Thermal 80mm", "Generic / Text Only"]} />
                <InputCard label="Sales Bill Printer Device" optKey="billPrinter" type="select" options={["EPSON LX-300+ /II", "HP LaserJet M1005", "TVS MSP 240 Star", "Thermal POS 80mm"]} />
                <InputCard label="Report Printer Device" optKey="reportPrinter" type="select" options={["EPSON LX-300+ /II", "HP LaserJet M1005", "Canon LBP2900", "Microsoft Print to PDF"]} />
                <InputCard label="Barcode Label Printer Device" optKey="barcodePrinter" type="select" options={["EPSON LX-300+ /II", "TVS LP 46 Neo", "Zebra GK420t", "Citizen CL-S621", "TSC TE244"]} />
                <InputCard label="ESI Stationary Format" optKey="esiStationary" type="select" options={["Inkjet/Laser", "Dot Matrix Pre-Printed", "Continuous Roll"]} />
              </div>
            </div>
          )}

        </div>

        {/* ── FOOTER STATUS BAR ── */}
        <div style={{
          background: "#ffffff",
          padding: "10px 24px",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "#64748b",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span>Status: <strong style={{ color: "#0d9488" }}>● System Active & Synced</strong></span>
            <span>Module: <strong>{tabs.find(t => t.id === appSetupTab)?.label}</strong></span>
            {searchQuery && (
              <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "6px", fontWeight: "600" }}>
                Filter: "{searchQuery}"
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>Changes are stored in Local & Database Profile.</span>
            <button 
              onClick={() => setShowAppSetup(false)}
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                padding: "4px 12px",
                borderRadius: "6px",
                color: "#334155",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>

      </div>
  );
}
