// @ts-nocheck
/* eslint-disable */
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Edit2, Trash2, ShoppingCart, Package, LogOut, Eye, EyeOff, X, CheckCircle, AlertCircle, User, ChevronDown, ChevronUp, Phone, Mail, MapPin, Clock, FileText, TrendingUp, Truck, CreditCard, Users, Home, Printer } from "lucide-react";
import React from 'react';
import PurchaseChallan from './PurchaseChallan';
import ApplicationSetupModal from './ApplicationSetupModal';
import { useMedicalStore, DIVISIONS, GST_RATES, MENU_RIGHTS_LIST, STATUS_STYLE, fmt, num, int, uid, today, inp, lbl, btn } from "./MedicalStoreContext";
const _useState = useState, _useEffect = useEffect, _useRef = useRef, _useCallback = useCallback;

// ═══════════════════════════════════════
// CAMERA BARCODE SCANNER COMPONENT (ZXing)
// ═══════════════════════════════════════

function CameraBarcodeScanner({ onDetected, onClose }) {
  const videoRef = _useRef(null);
  const streamRef = _useRef(null);
  const readerRef = _useRef(null);
  const [error, setError] = _useState("");
  const [scanning, setScanning] = _useState(false);
  const [detected, setDetected] = _useState(null);
  const [manualCode, setManualCode] = _useState("");

  const stopCamera = _useCallback(() => {
    // Stop ZXing reader
    if (readerRef.current) {
      try { readerRef.current.reset(); } catch (_) {}
      readerRef.current = null;
    }
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  _useEffect(() => {
    startScanner();
    return () => stopCamera();
  }, []);

  const startScanner = async () => {
    setError("");
    try {
      // Dynamic import so it doesn't fail if lib is missing
      const { BrowserMultiFormatReader, NotFoundException } = await import("@zxing/library");
      const codeReader = new BrowserMultiFormatReader();
      readerRef.current = codeReader;

      // Get available cameras — prefer back camera
      const devices = await codeReader.listVideoInputDevices();
      const backCam = devices.find(d => /back|rear|environment/i.test(d.label)) || devices[0];
      const deviceId = backCam?.deviceId || undefined;

      setScanning(true);

      // Start continuous decode
      codeReader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
        if (result) {
          const code = result.getText();
          setDetected(code);
          stopCamera();
          setTimeout(() => {
            onDetected(code);
          }, 400);
        }
        // NotFoundException = no barcode yet in frame — normal, keep scanning
        if (err && !(err instanceof NotFoundException)) {
          console.warn("ZXing error:", err?.message);
        }
      });

      // Also capture the stream for display
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        streamRef.current = stream;
      } catch (_) {}

    } catch (e) {
      console.error("Scanner error:", e);
      if (e?.name === "NotAllowedError" || String(e).includes("Permission")) {
        setError("Camera permission denied. Allow camera in browser settings.\n\nOr type barcode manually below.");
      } else if (String(e).includes("Could not start")) {
        setError("Could not start camera. Close camera in other tabs.");
      } else {
        setError("Camera error: " + (e?.message || String(e)));
      }
      setScanning(false);
    }
  };

  const handleManualSubmit = () => {
    const v = manualCode.trim();
    if (!v) return;
    setManualCode("");
    stopCamera();
    onDetected(v);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.93)", zIndex: 19999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {/* Header */}
      <div style={{ width: "100%", maxWidth: "400px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", marginBottom: "8px" }}>
        <div style={{ color: "var(--color-text-dark)", fontWeight: "800", fontSize: "16px" }}>📷 Barcode Scan Karo</div>
        <button onClick={() => { stopCamera(); onClose(); }} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "var(--color-text-dark)", borderRadius: "50%", width: "34px", height: "34px", cursor: "pointer", fontSize: "16px" }}>✕</button>
      </div>

      {/* Camera View */}
      <div style={{ position: "relative", width: "min(360px,92vw)", height: "260px", borderRadius: "16px", overflow: "hidden", border: `2px solid ${detected ? "#22c55e" : "rgba(255,255,255,0.3)"}`, background: "#111" }}>
        <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} playsInline muted autoPlay />

        {/* Scan overlay guide */}
        {scanning && !detected && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {/* Dim edges */}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
            {/* Scan window */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "76%", height: "50%", border: "2px solid #22d3ee", borderRadius: "8px", boxShadow: "0 0 0 9999px rgba(0,0,0,0.0)" }}>
              {/* Corners */}
              {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h], i) => (
                <div key={i} style={{ position: "absolute", [v]: "-2px", [h]: "-2px", width: "22px", height: "22px",
                  borderTop: v === "top" ? "3px solid #22d3ee" : "none",
                  borderBottom: v === "bottom" ? "3px solid #22d3ee" : "none",
                  borderLeft: h === "left" ? "3px solid #22d3ee" : "none",
                  borderRight: h === "right" ? "3px solid #22d3ee" : "none"
                }} />
              ))}
              {/* Animated scan line */}
              <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #22d3ee, transparent)", animation: "scanline 1.8s ease-in-out infinite" }} />
            </div>
          </div>
        )}

        {/* Detected overlay */}
        {detected && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(34,197,94,0.88)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <div style={{ fontSize: "44px" }}>✅</div>
            <div style={{ color: "var(--color-text-dark)", fontWeight: "800", marginTop: "8px", fontSize: "18px" }}>{detected}</div>
            <div style={{ color: "var(--color-text-dark)", fontSize: "12px", marginTop: "4px" }}>Milli gayu!</div>
          </div>
        )}

        {/* Error overlay */}
        {error && !detected && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div style={{ color: "#dc2626", textAlign: "center", fontSize: "12px", lineHeight: "1.6", whiteSpace: "pre-line" }}>{error}</div>
          </div>
        )}
      </div>

      {/* Status */}
      <div style={{ color: "var(--color-text-muted)", fontSize: "12px", textAlign: "center", marginTop: "12px", maxWidth: "300px", lineHeight: "1.5" }}>
        {detected ? "Barcode detected!" : scanning ? "📦 Keep barcode steady in front of camera" : error ? "" : "Starting camera..."}
      </div>

      {/* Manual fallback */}
      {!detected && (
        <div style={{ marginTop: "14px", display: "flex", gap: "8px", width: "min(360px,92vw)" }}>
          <input
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            placeholder="Or manually type barcode..."
            style={{ flex: 1, padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.1)", color: "var(--color-text-dark)", fontSize: "14px", outline: "none" }}
            onKeyDown={e => { if (e.key === "Enter") handleManualSubmit(); }}
            autoComplete="off"
          />
          <button onClick={handleManualSubmit} style={{ padding: "10px 16px", background: "#22c55e", color: "var(--color-text-dark)", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>Go</button>
        </div>
      )}

      <style>{`@keyframes scanline { 0%{top:5%} 50%{top:90%} 100%{top:5%} }`}</style>
    </div>
  );
}


export default function OwnerPanel() {
  const {
    currentUser, isOwner, activeSection, setActiveSection,
    ownerSubTab, setOwnerSubTab,
    hoveredNav, setHoveredNav, activeMenu, setActiveMenu, menuDropPos, setMenuDropPos,
    supBtnRef, supPanelCoords, setSupPanelCoords,
    items, batches, suppliers, purchaseBills, salesBills, payments, bankEntries,
    saveItems, saveBatches, saveSuppliers, savePurchaseBills, saveSalesBills, savePayments, saveBankEntries,
    showItemForm, setShowItemForm, editingItem, setEditingItem, itemForm, setItemForm,
    itemDivision, setItemDivision, itemSearch, setItemSearch, filterStock, setFilterStock,
    sortBy, setSortBy, quickStockItem, setQuickStockItem, quickQty, setQuickQty,
    showPurchaseForm, setShowPurchaseForm, purchaseForm, setPurchaseForm,
    purchaseItems, setPurchaseItems, expandedPurchase, setExpandedPurchase,
    expandedOwnerOrder, setExpandedOwnerOrder, orderFilter, setOrderFilter,
    purchaseBillSearch, setPurchaseBillSearch,
    salesBillSearch, setSalesBillSearch,
    paymentSearch, setPaymentSearch,
    reportSearch, setReportSearch,
    masterSearch, setMasterSearch,
    purchaseItemSearch, setPurchaseItemSearch, purchaseItemDropdown, setPurchaseItemDropdown,
    purchaseItemHighlight, setPurchaseItemHighlight, purchaseDropdownPos, setPurchaseDropdownPos,
    showSalesForm, setShowSalesForm, salesForm, setSalesForm, salesItems, setSalesItems,
    salesItemSearch, setSalesItemSearch, salesItemDropdown, setSalesItemDropdown,
    salesItemHighlight, setSalesItemHighlight, salesDropdownPos, setSalesDropdownPos,
    expandedSale, setExpandedSale, isReturn, setIsReturn,
    showPaymentForm, setShowPaymentForm, paymentForm, setPaymentForm,
    showSupplierForm, setShowSupplierForm, editingSupplier, setEditingSupplier, supplierForm, setSupplierForm,
    upiSettings, setUpiSettings, showUpiSetup, setShowUpiSetup,
    doctors, setDoctors, doctorForm, setDoctorForm, showDoctorForm, setShowDoctorForm, editDoctorId, setEditDoctorId,
    reportPeriod, setReportPeriod, reportSubTab, setReportSubTab,
    showShortcuts, setShowShortcuts, printHtml, setPrintHtml,
    confirmDialog, setConfirmDialog, stockReportComp, setStockReportComp, stockReportSupp, setStockReportSupp,
    showBankForm, setShowBankForm, bankForm, setBankForm,
    showUserMaster, setShowUserMaster, showGroupRights, setShowGroupRights,
    showAppSetup, setShowAppSetup, appSetupTab, setAppSetupTab, appSetupData, setAppSetupData,
    grSelectedUser, setGrSelectedUser, grUserRights, setGrUserRights,
    appUsers, setAppUsers, userGroups, setUserGroups,
    umForm, setUmForm, umEditId, setUmEditId, umShowPass, setUmShowPass,
    umSelectedUser, setUmSelectedUser, umGroupForm, setUmGroupForm,
    umSelectedGroup, setUmSelectedGroup, umGroupUserSel, setUmGroupUserSel,
    showToast, showConfirm, forceSync, save,
    openItemForm, handleSaveItem, handleDeleteItem, handleQuickStock,
    openPurchaseForm, updatePurchaseItem, addPurchaseItem, removePurchaseItem, handleSavePurchase, focusNext,
    openSalesForm, updateSalesItem, addSalesItem, removeSalesItem, handleSaveSales, handlePrintSalesBill,
    openPaymentForm, handleSavePayment,
    openSupplierForm, handleDeletePurchaseBill, handleDeleteSalesBill,
    handleDeleteSupplier, handleDeleteDoctor, handleDeleteCustomer, handleDeletePayment,
    handleDeleteBankEntry, handleDeleteKhataEntry, handleDeleteAdvanceDeposit,
    handleDeleteReminder, handleDeleteBundleOffer, handleSaveSupplier, handleSaveDoctor,
    getSalesReport, handleExportData, handleImportData, doEncryptedBackup, doRestoreData, handleLogout, handleDeleteOwnerAccount,
    showBackupPassModal, setShowBackupPassModal, backupPassInput, setBackupPassInput, backupPassError,
    backupIsFirstTime, backupConfirmInput, setBackupConfirmInput,
    showForgotBackupPass, setShowForgotBackupPass, forgotOldPass, setForgotOldPass, forgotNewPass, setForgotNewPass,
    forgotConfirmPass, setForgotConfirmPass, handleForgotBackupPass,
    showRestorePassModal, setShowRestorePassModal, restorePassInput, setRestorePassInput,
    newPassInput, setNewPassInput, showNewPassStep, setShowNewPassStep,
    showDeletePassModal, setShowDeletePassModal, deletePassInput, setDeletePassInput, deletePassError, setDeletePassError,
    isExpired, isExpiringSoon, getDivision, itemBatches, filteredItems, calcTotal,
    calcPurchaseItemAmt, calcSalesItemAmt,
    emptyItemForm, emptyPurchaseForm, emptyPurchaseItem, emptySalesForm, emptySalesItem, emptySupplierForm,
    // NEW FEATURES
    khataEntries, showKhataForm, setShowKhataForm, khataForm, setKhataForm,
    showKhataCollect, setShowKhataCollect, khataCollectAmt, setKhataCollectAmt,
    handleSaveKhata, handleCollectKhataPayment, getKhataBalance,
    advanceDeposits, showAdvanceForm, setShowAdvanceForm, advanceForm, setAdvanceForm, handleSaveAdvance, getAdvanceBalance,
    splitPayMode, setSplitPayMode, splitCash, setSplitCash, splitUpi, setSplitUpi, splitUpiTxn, setSplitUpiTxn,
    bundleOffers, showOfferForm, setShowOfferForm, offerForm, setOfferForm, editOfferId, setEditOfferId, handleSaveOffer, checkBundleOffer,
    loyaltyData, getCustomerPoints, getVIPLevel,
    billInstructions, setBillInstructions,
    dayEndHistory, showDayEnd, setShowDayEnd, physicalCash, setPhysicalCash, handleSaveDayEnd,
    expiryCalMonth, setExpiryCalMonth, expiryCalYear, setExpiryCalYear,
    getBestSellers, getDeadStock, getPatientHistory, getDueDateAlerts, getDoctorReport,
    getSupplierScore, getLiveProfitToday, getMonthlyGrowth, getAutoPurchaseDrafts,
    purchaseReturns, showPurchaseReturnForm, setShowPurchaseReturnForm,
    purchaseReturnForm, setPurchaseReturnForm, purchaseReturnItems, setPurchaseReturnItems,
    openPurchaseReturnForm, updatePurchaseReturnItem, handleSavePurchaseReturn,
    emptyPurchaseReturnItem,
    showSupplierLedger, setShowSupplierLedger, ledgerSupplierId, setLedgerSupplierId,
    getSupplierLedger,
    barcodeInput, setBarcodeInput, findItemByBarcode,
    barcodeQtyModal, setBarcodeQtyModal, barcodeQtyInput, setBarcodeQtyInput,
    barcodeNewItemModal, setBarcodeNewItemModal, barcodeNewItemForm, setBarcodeNewItemForm,
    barcodeFetching, setBarcodeFetching, barcodeFetchSource, setBarcodeFetchSource, handleBarcodeNewItemSave,
    handleBarcodeDetected, handleBarcodeQtyConfirm, getItemByBarcode,
    showLabelPrint, setShowLabelPrint, labelItem, setLabelItem, labelQty, setLabelQty,
    labelBatch, setLabelBatch, handlePrintLabel, generateLabelHTML,
    getGSTR1, getGSTR3B,
    handleWhatsAppBill, healthCards, getHealthCard,
  } = useMedicalStore();

  // ── Camera Scanner States ──
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState("purchase");

  // ── Lock Bill States ──
  const [showLockBill, setShowLockBill] = useState(false);
  const [lockBillData, setLockBillData] = useState([
    { id: "sales", label: "SALES BOOK", checked: true, from: today(), to: today() },
    { id: "salesReturn", label: "SALES RETURN BOOK", checked: true, from: today(), to: today() },
    { id: "purchase", label: "PURCHASE BOOK", checked: true, from: today(), to: today() },
    { id: "purchaseReturn", label: "PURCHASE RETURN BOOK", checked: true, from: today(), to: today() },
    { id: "cash", label: "CASH BOOK", checked: true, from: today(), to: today() },
    { id: "jv", label: "J.V.BOOK", checked: true, from: today(), to: today() },
    { id: "bank", label: "BANK BOOK", checked: true, from: today(), to: today() }
  ]);

  // ── Data Utility States ──
  const [showDataUtility, setShowDataUtility] = useState(false);
  const [dataUtilityTab, setDataUtilityTab] = useState("itemDetail");
  const [dataUtilTaxMode, setDataUtilTaxMode] = useState("withZero");
  const [dataUtilBatchLockFilter, setDataUtilBatchLockFilter] = useState("all");

  // ── Merge Facility States ──
  const [showMergeFacility, setShowMergeFacility] = useState(false);
  const [mergeFacilityOpt, setMergeFacilityOpt] = useState("delete");

  // ── Stock Rate Detail States ──
  const [showStockRateDetail, setShowStockRateDetail] = useState(false);

  // ── Transfer Data States ──
  const [showTransferData, setShowTransferData] = useState(false);
  const [transferDataSels, setTransferDataSels] = useState({ items: true, batches: true, suppliers: true, purchaseBills: true, salesBills: true, payments: true, doctors: true, customers: true, khata: false, advance: false });
  const [transferDataTargetUrl, setTransferDataTargetUrl] = useState("");
  const [transferDataProgress, setTransferDataProgress] = useState(""); // idle | exporting | done | error
  const [transferDataMsg, setTransferDataMsg] = useState("");

  // ── Transfer Other Data (Import) States ──
  const [showTransferOtherData, setShowTransferOtherData] = useState(false);
  const [transferOtherFile, setTransferOtherFile] = useState(null);
  const [transferOtherParsed, setTransferOtherParsed] = useState(null);
  const [transferOtherSels, setTransferOtherSels] = useState({ items: true, batches: true, suppliers: true, purchaseBills: true, salesBills: true, payments: true, doctors: true, customers: true, khata: false, advance: false });
  const [transferOtherProgress, setTransferOtherProgress] = useState("");
  const [transferOtherMsg, setTransferOtherMsg] = useState("");
  const [transferOtherMerge, setTransferOtherMerge] = useState("merge"); // 'merge' | 'replace'

    // -- WIP Feature State --
  const [showWipModal, setShowWipModal] = useState("");

  const expiredCount = items.filter(i => isExpired(i.expiryDate)).length;
  const expiringSoonCount = items.filter(i => isExpiringSoon(i.expiryDate) && !isExpired(i.expiryDate)).length;
  const lowStockCount = items.filter(i => i.stock > 0 && i.stock <= (i.minimum || 5)).length;
  const alertCount = expiredCount + expiringSoonCount + lowStockCount;

  const parseExpiry = (d) => {
    if (!d) return null;
    const mmyy = d.match(/^(\d{1,2})\/(\d{2})$/);
    if (mmyy) { const yr = parseInt(mmyy[2]) + 2000; return new Date(yr, parseInt(mmyy[1]) - 1, 1); }
    const dt = new Date(d); return isNaN(dt) ? null : dt;
  };

  const ownerNavItems = [
    { id: "home", label: "Dashboard", icon: <Home size={15} /> },
    { id: "inventory", label: "Inventory", icon: <Package size={15} /> },
    { id: "purchase", label: "Purchase", icon: <Truck size={15} /> },
    { id: "purchase_return", label: "P.Return", icon: <span>↩️</span> },
    { id: "sales_pos", label: "Sales Bill", icon: <FileText size={15} /> },
    { id: "payments", label: "Payments", icon: <CreditCard size={15} /> },
    { id: "bank", label: "Bank Entry", icon: <span style={{ fontSize: "13px" }}>🏦</span> },
    { id: "reports", label: "Reports", icon: <TrendingUp size={15} /> },
    { id: "masters", label: "Masters", icon: <Users size={15} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "row", flex: 1, minHeight: 0, overflow: "hidden", width: "100%", background: "var(--bg-body)" }}>
      
      {/* ─── MODERN SIDEBAR ─── */}
      {isOwner && (
        <div style={{ width: "260px", background: "white", borderRight: "1px solid var(--color-border)", display: "flex", flexDirection: "column", flexShrink: 0, zIndex: 100 }}>
          <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ width: "32px", height: "32px", background: "var(--color-primary)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-dark)", fontWeight: "bold", fontSize: "18px" }}>S</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--color-text-dark)", letterSpacing: "-0.5px" }}>Shivdhara</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", paddingLeft: "12px" }}>Dashboard</div>
            {ownerNavItems.map(t => {
              const isActive = activeSection === t.id;
              return (
                <button key={t.id}
                  onClick={() => { setActiveSection(t.id); setOwnerSubTab(""); }}
                  style={{
                    padding: "12px 16px", border: "none", background: isActive ? "#e0f7fa" : "transparent",
                    cursor: "pointer", fontWeight: isActive ? "700" : "500", fontSize: "14px",
                    color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                    display: "flex", alignItems: "center", gap: "12px", borderRadius: "12px",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "var(--color-text-dark)"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-muted)"; } }}
                >
                  <div style={{ color: isActive ? "var(--color-primary)" : "#64748b" }}>{t.icon}</div>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* ─── MODERN TOP NAVBAR ─── */}
        <div style={{ background: "white", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", zIndex: 90 }}>
          
          {/* Legacy Menus Re-added (Full) */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, paddingLeft: "10px", flexWrap: "nowrap" }}>
            {[
              {id:"supervisor", label:"Supervisor", items:[
                {label:"User Master", action:()=>{setShowUserMaster(true);setActiveMenu(null);}},
                {label:"Group/User Rights", action:()=>{setShowGroupRights(true);setActiveMenu(null);}},
                {label:"Application Setup", action:()=>{setShowAppSetup(true);setActiveMenu(null);}},
                {label:"Stationary Setting", action:()=>{setShowWipModal("Stationary Setting");}},
                {sep:true},
                {label:"Lock Bill", action:()=>{setShowLockBill(true);setActiveMenu(null);}},
                {label:"Userwise Changes", action:()=>{setShowWipModal("Userwise Changes");}},
                {label:"Data Utility", action:()=>{setShowDataUtility(true);setActiveMenu(null);}},
                {label:"Sync Offline Data to DB", action:()=>{forceSync();setActiveMenu(null);}},
                {label:"Bill Number Change", action:()=>{setShowWipModal("Bill Number Change");}},
                {label:"Merge Facility", action:()=>{setShowMergeFacility(true);setActiveMenu(null);}},
                {label:"Stock Rate Detail", action:()=>{setShowStockRateDetail(true);setActiveMenu(null);}},
                {label:"Transfer Data", action:()=>{setShowTransferData(true);setActiveMenu(null);}},
                {label:"Transfer Other Data", action:()=>{setShowTransferOtherData(true);setActiveMenu(null);}},
                {label:"Challan Problem", action:()=>{setShowWipModal("Challan Problem");}},
                {label:"Change Bills", action:()=>{setShowWipModal("Change Bills");}},
                {label:"Sales Bill Delete", action:()=>{setActiveSection("sales_pos");setActiveMenu(null);}},
                {label:"Purchase Delete", action:()=>{setActiveSection("purchase");setActiveMenu(null);}},
              ]},
              {id:"master", label:"Master", items:[
                {label:"Account Master", action:()=>{setActiveSection("masters");setOwnerSubTab("suppliers");setActiveMenu(null);}},
                {label:"Company Master", action:()=>{setActiveSection("masters");setActiveMenu(null);}},
                {label:"Supplier Master", action:()=>{setActiveSection("masters");setOwnerSubTab("suppliers");setActiveMenu(null);}},
                {label:"Drug Group Master", action:()=>{setActiveSection("inventory");setActiveMenu(null);}},
                {label:"Item Master", action:()=>{setActiveSection("inventory");setActiveMenu(null);}},
                {label:"Kit Master", action:()=>{setShowWipModal("Kit Master");}},
                {label:"Doctor Master", action:()=>{setActiveSection("masters");setOwnerSubTab("doctors");setActiveMenu(null);}},
                {label:"Patient Master", action:()=>{setActiveSection("masters");setOwnerSubTab("customers");setActiveMenu(null);}},
                {label:"Contract Employee Master", action:()=>{setShowWipModal("Contract Employee Master");}},
                {label:"Other Masters", action:()=>{setActiveSection("masters");setActiveMenu(null);}},
                {label:"Account Group", action:()=>{setShowWipModal("Account Group");}},
                {label:"Generic Group Item List", action:()=>{setShowWipModal("Generic Group Item List");}},
              ]},
              {id:"transaction", label:"Transaction", items:[
                {label:"Sales Bill", action:()=>{setActiveSection("sales_pos");setTimeout(()=>openSalesForm(false),50);setActiveMenu(null);}},
                {label:"Purchase Bill", action:()=>{setActiveSection("purchase");setTimeout(()=>openPurchaseForm(),50);setActiveMenu(null);}},
                {label:"Purchase Return", action:()=>{setActiveSection("purchase_return");setActiveMenu(null);}},
                {label:"Purchase Challan", action:()=>{setActiveSection("purchase_challan");setActiveMenu(null);}},
                {label:"Purchase Chln to Bill", action:()=>{setShowWipModal("Purchase Chln to Bill");}},
                {sep:true},
                {label:"Tax", action:()=>{setShowWipModal("Tax");}},
                {label:"Sale Transfer", action:()=>{setShowWipModal("Sale Transfer");}},
                {sep:true},
                {label:"Stock Entry Itemwise", action:()=>{setActiveSection("inventory");setActiveMenu(null);}},
                {label:"Stock Adjust", action:()=>{setShowWipModal("Stock Adjust");}},
                {sep:true},
                {label:"Order Processing", action:()=>{setActiveSection("home");setActiveMenu(null);}},
                {label:"Purchase Order", action:()=>{setShowWipModal("Purchase Order");}},
                {label:"Expiry List", action:()=>{setActiveSection("reports");setReportSubTab("summary");setActiveMenu(null);}},
                {sep:true},
                {label:"Sales Receipt", action:()=>{setActiveSection("payments");setTimeout(()=>openPaymentForm("receipt"),50);setActiveMenu(null);}},
                {label:"Purchase Payment", action:()=>{setActiveSection("payments");setTimeout(()=>openPaymentForm("payment"),50);setActiveMenu(null);}},
                {label:"Cash Entry", action:()=>{setActiveSection("payments");setTimeout(()=>openPaymentForm("payment"),50);setActiveMenu(null);}},
                {label:"Bank Entry", action:()=>{setActiveSection("bank");setActiveMenu(null);}},
                {label:"J V Entry", action:()=>{setShowWipModal("J V Entry");}},
              ]},
              {id:"mis", label:"MIS Reports", items:[
                {label:"Vat Forms", action:()=>{setShowWipModal("Vat Forms");}},
                {label:"Sales Register", action:()=>{setActiveSection("reports");setReportSubTab("sales_reg");setActiveMenu(null);}},
                {label:"Sales Return Register", action:()=>{setActiveSection("reports");setReportSubTab("sales_reg");setActiveMenu(null);}},
                {label:"Sale Summary Itemwise", action:()=>{setActiveSection("reports");setReportSubTab("item_wise");setActiveMenu(null);}},
                {label:"Sales Receipt Register", action:()=>{setActiveSection("payments");setActiveMenu(null);}},
                {label:"Sales Summary Datewise", action:()=>{setActiveSection("reports");setReportSubTab("daily");setActiveMenu(null);}},
                {label:"Sales Summary Date - Bill Wise", action:()=>{setActiveSection("reports");setReportSubTab("daily");setActiveMenu(null);}},
                {label:"Sales Summary", action:()=>{setActiveSection("reports");setReportSubTab("summary");setActiveMenu(null);}},
                {sep:true},
                {label:"Purchase Register", action:()=>{setActiveSection("reports");setReportSubTab("purchase_reg");setActiveMenu(null);}},
                {label:"Purchase Return Register", action:()=>{setShowWipModal("Purchase Return Register");}},
                {label:"Purchase Summary Item wise", action:()=>{setActiveSection("reports");setReportSubTab("item_wise");setActiveMenu(null);}},
                {label:"Purchase Payment Register", action:()=>{setActiveSection("payments");setActiveMenu(null);}},
                {label:"Purchase Summary Datewise", action:()=>{setActiveSection("reports");setReportSubTab("daily");setActiveMenu(null);}},
                {label:"Purchase Register Detail", action:()=>{setActiveSection("reports");setReportSubTab("purchase_reg");setActiveMenu(null);}},
              ]},
              {id:"financial", label:"Financial Reports", items:[
                {label:"Cash Book", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Detail Cash Book", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Cash Flow", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {sep:true},
                {label:"Bank Book", action:()=>{setActiveSection("bank");setActiveMenu(null);}},
                {label:"Detail Bank Book", action:()=>{setActiveSection("bank");setActiveMenu(null);}},
                {label:"Bank Flow", action:()=>{setActiveSection("bank");setActiveMenu(null);}},
                {sep:true},
                {label:"Customer Ledger", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Customer Status", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"All Customer Status", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Customer Cash Bank Detail", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Customer Pending Detail", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Customerwise Pending List", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"All Customer Credit Limit List", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Customerwise Credit Limit List", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Customerwise Sale", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Customer Message and SMS", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Areawise Pending List", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {sep:true},
                {label:"JVBook", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {sep:true},
                {label:"PRL Report", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"PRL Item Report", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {sep:true},
                {label:"Bank Reconciliation", action:()=>{setActiveSection("bank");setActiveMenu(null);}},
                {label:"Depreciation Report", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Group Outstanding", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Account Groupwise Statement", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Account Groupwise Opening-Closing", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Trial Balance", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Trading Account", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Profit And Loss Account", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
                {label:"Balance Sheet", action:()=>{setActiveSection("reports");setActiveMenu(null);}},
              ]},
              {id:"other", label:"Other Facilities", items:[
                {label:"Interest Calculation", action:()=>{setShowWipModal("Interest Calculation");}},
                {label:"Directory", action:()=>{setShowWipModal("Directory");}},
                {label:"Reminder Datewise", action:()=>{setShowWipModal("Reminder Datewise");}},
                {label:"Reminder Detail", action:()=>{setShowWipModal("Reminder Detail");}},
                {label:"Daily Message", action:()=>{setShowWipModal("Daily Message");}},
                {label:"Reprocess of Data", action:()=>{setShowWipModal("Reprocess of Data");}},
                {label:"Upgrading Software", action:()=>{setShowWipModal("Upgrading Software");}},
                {label:"New Item master", action:()=>{setActiveSection("inventory");setActiveMenu(null);}},
                {label:"Backup", action:()=>{handleExportData();setActiveMenu(null);}},
                {label:"Year Closing", action:()=>{setShowWipModal("Year Closing");}},
              ]},
              {id:"window", label:"Window", items:[
                {label:"Cascade Windows", action:()=>{setShowWipModal("Cascade Windows");}},
                {label:"Tile Windows Horizontally", action:()=>{setShowWipModal("Tile Windows Horizontally");}},
                {label:"Tile Windows Vertically", action:()=>{setShowWipModal("Tile Windows Vertically");}},
                {sep:true},
                {label:"1", action:()=>{setShowWipModal("1");}},
                {label:"2 Sales Bill", action:()=>{setActiveSection("sales_pos");setActiveMenu(null);}},
                {label:"3 Purchase Bill", action:()=>{setActiveSection("purchase");setActiveMenu(null);}},
              ]},
              {id:"exit", label:"Exit", items:[
                {label:"Close", action:()=>handleLogout()},
                {label:"Close with Backup", action:()=>{handleExportData();handleLogout();}},
                {label:"Login as Different User", action:()=>handleLogout()},
                {label:"Year Change", action:()=>{setShowWipModal("Year Change");}},
                {label:"Update Data from Last Year", action:()=>{setShowWipModal("Update Data from Last Year");}},
                {sep:true},
                {label:"Delete Account", action:()=>handleDeleteOwnerAccount()},
              ]}
            ].map(m => (
              <div key={m.id} style={{ position: "relative" }}>
                <button onClick={() => setActiveMenu(activeMenu === m.id ? null : m.id)} 
                  style={{ background: "transparent", border: "none", color: "var(--color-text-dark)", fontWeight: "600", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px", padding: "6px 10px", borderRadius: "6px", whiteSpace: "nowrap" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {m.label} <ChevronDown size={14} color="#64748b" />
                </button>
                {activeMenu === m.id && (
                  <div style={{ position: "absolute", top: "35px", left: 0, width: "240px", background: "white", borderRadius: "10px", boxShadow: "var(--shadow-lg)", border: "1px solid var(--color-border)", zIndex: 9999, padding: "6px", maxHeight: "80vh", overflowY: "auto" }}>
                    {m.items.map((item, idx) => item.sep ? (
                      <div key={idx} style={{ height: "1px", background: "var(--color-border)", margin: "4px 0" }} />
                    ) : (
                      <button key={idx} onClick={() => { if(item.action) item.action(); setActiveMenu(null); }}
                        style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: "13px", color: "var(--color-text-dark)", background: "transparent", border: "none", cursor: "pointer", borderRadius: "6px" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "var(--color-primary)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-dark)"; }}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", width: "260px" }}>
            <Search size={16} style={{ position: "absolute", left: "16px", color: "#64748b" }} />
            <input
              placeholder="Search items, bills, patients..."
              value={itemSearch}
              onChange={e => setItemSearch(e.target.value)}
              style={{
                width: "100%", background: "#f3f4f7", border: "none", borderRadius: "20px",
                padding: "10px 16px 10px 42px", fontSize: "13px", color: "var(--color-text-dark)", outline: "none"
              }}
            />
            {itemSearch && (
              <button onClick={() => setItemSearch("")} style={{ position: "absolute", right: "12px", border: "none", background: "none", cursor: "pointer", color: "#64748b" }}><X size={14} /></button>
            )}
            {/* Quick Search Overlay */}
            {itemSearch && (
              <div style={{ position: "absolute", top: "45px", left: 0, width: "100%", background: "white", borderRadius: "12px", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border)", zIndex: 1000, overflow: "hidden" }}>
                 <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", background: "var(--color-primary)", color: "var(--color-text-dark)", fontSize: "13px", fontWeight: "700" }}>Quick results for "{itemSearch}"</div>
                 <div style={{ padding: "8px" }}>
                   {items.filter(i => i.name?.toLowerCase().includes(itemSearch.toLowerCase())).slice(0, 5).map(i => (
                     <div key={i.id} onClick={() => { setActiveSection("inventory"); setOwnerSubTab(i.division); setItemSearch(""); }} style={{ padding: "8px 12px", cursor: "pointer", borderRadius: "8px", marginBottom: "4px" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                       <div style={{ fontSize: "13px", fontWeight: "600" }}>{i.name}</div>
                       <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Price: ₹{i.price} · Stock: {i.stock}</div>
                     </div>
                   ))}
                   {salesBills.filter(b => (b.billNo || "").includes(itemSearch) || (b.patientName || "").toLowerCase().includes(itemSearch.toLowerCase())).slice(0, 3).map(b => (
                     <div key={b.id} onClick={() => { setActiveSection("sales_pos"); setItemSearch(""); }} style={{ padding: "8px 12px", cursor: "pointer", borderRadius: "8px", background: "#e0f7fa", marginTop: "4px" }}>
                       <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-text-dark)" }}>🧾 Bill #{b.billNo} — {b.patientName}</div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>

          
          {/* Right Utility Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button style={{ border: "none", background: "none", color: "#64748b", cursor: "pointer", display: "flex" }}><Package size={20} /></button>
            <button style={{ border: "none", background: "none", color: "#64748b", cursor: "pointer", display: "flex" }}><AlertCircle size={20} /></button>
            
            {/* System Settings Dropdown */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setActiveMenu(activeMenu === "__system" ? null : "__system")} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", border: "1px solid var(--color-border)", padding: "6px 12px", borderRadius: "20px", cursor: "pointer" }}>
                <div style={{ width: "24px", height: "24px", background: "var(--color-primary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-dark)", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold" }}>{(currentUser?.name || "U").slice(0,1).toUpperCase()}</div>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-text-dark)" }}>{currentUser?.name || "Admin"}</span>
                <ChevronDown size={14} color="#64748b" />
              </button>
              {activeMenu === "__system" && (
                <div style={{ position: "absolute", top: "40px", right: 0, width: "220px", background: "white", borderRadius: "12px", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border)", zIndex: 999 }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text-dark)" }}>System Options</div>
                  </div>
                  <div style={{ padding: "8px" }}>
                    <button onClick={() => { setShowTransferData(true); setActiveMenu(null); }} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: "13px", color: "var(--color-text-muted)", background: "transparent", border: "none", cursor: "pointer", borderRadius: "6px" }} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>📤 Export Data</button>
                    <button onClick={() => { setShowTransferOtherData(true); setActiveMenu(null); }} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: "13px", color: "var(--color-text-muted)", background: "transparent", border: "none", cursor: "pointer", borderRadius: "6px" }} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>📥 Import Data</button>
                    <div style={{ height: "1px", background: "var(--color-border)", margin: "4px 0" }} />
                    <button onClick={() => handleLogout()} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: "13px", color: "#ef4444", background: "transparent", border: "none", cursor: "pointer", borderRadius: "6px", fontWeight: "600" }} onMouseEnter={e=>e.currentTarget.style.background="#fef2f2"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>🚪 Logout</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* ─────────────────────────────────── */}
      {/* OWNER CONTENT SECTIONS               */}
      {/* ─────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", width: "100%", paddingBottom: "32px", boxSizing: "border-box", background: "var(--bg-body)", color: "var(--color-text-dark)" }}>

        {isOwner && activeSection === "home" && (
          <>
            {/* ── DARK DASHBOARD STYLES ── */}
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
              .dash-wrap { background: transparent; }
              .stat-card {
                background: white;
                border: 1px solid var(--color-border);
                border-radius: 14px;
                padding: 16px;
                position: relative;
                overflow: hidden;
                transition: transform 0.2s, box-shadow 0.2s;
                backdrop-filter: blur(10px);
              }
              .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
              .stat-card::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 2px;
                border-radius: 14px 14px 0 0;
              }
              .card-blue::before { background: linear-gradient(90deg, #4f8ef7, #a78bfa); }
              .card-green::before { background: linear-gradient(90deg, #34d399, #059669); }
              .card-purple::before { background: linear-gradient(90deg, #a78bfa, #ec4899); }
              .card-orange::before { background: linear-gradient(90deg, #fb923c, #f59e0b); }
              .card-red::before { background: linear-gradient(90deg, #f87171, #ef4444); }
              .card-cyan::before { background: linear-gradient(90deg, #22d3ee, #3b82f6); }
              .mini-bar {
                height: 4px;
                border-radius: 2px;
                margin-top: 10px;
                background: #e2e8f0;
                overflow: hidden;
              }
              .mini-bar-fill {
                height: 100%;
                border-radius: 2px;
                animation: fillBar 1.2s ease-out forwards;
              }
              @keyframes fillBar { from { width: 0%; } }
              .risk-ring-wrap { position: relative; display: inline-flex; align-items: center; justify-content: center; }
              .risk-ring-wrap svg { transform: rotate(-90deg); }
              .ring-text { position: absolute; text-align: center; }
              .quick-btn {
                background: #f1f5f9;
                border: 1px solid #cbd5e1;
                border-radius: 10px;
                color: var(--color-text-dark);
                padding: 10px 16px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.2s;
                letter-spacing: 0.3px;
              }
              .quick-btn:hover { background: #e2e8f0; transform: translateY(-2px); }
              .order-row {
                background: white;
                border: 1px solid var(--color-border);
                border-radius: 10px;
                padding: 12px 16px;
                margin-bottom: 8px;
                transition: background 0.2s;
              }
              .order-row:hover { background: #f1f5f9; }
              .spark-bar {
                display: inline-block;
                width: 6px;
                border-radius: 3px 3px 0 0;
                background: linear-gradient(180deg, #4f8ef7, #a78bfa);
                animation: growBar 0.8s ease-out forwards;
                transform-origin: bottom;
              }
              @keyframes growBar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
            `}</style>

            {(() => {
              const totalRevenue = salesBills.filter(b => !b.isReturn).reduce((s, b) => s + num(b.netAmount), 0);
              const totalPurchase = purchaseBills.reduce((s, b) => s + num(b.netAmount || b.totalAmount || 0), 0);
              const profit = totalRevenue - totalPurchase;
              const lowStock = items.filter(i => i.stock > 0 && i.stock <= (i.minimum || 5));
              const expiredItems = items.filter(i => isExpired(i.expiryDate));
              const expiringSoon = items.filter(i => isExpiringSoon(i.expiryDate) && !isExpired(i.expiryDate));
              const stockRiskPct = items.length ? Math.round(((lowStock.length + expiredItems.length) / items.length) * 100) : 0;
              const stockHealthPct = 100 - stockRiskPct;
              const salesLast7 = [0, 1, 2, 3, 4, 5, 6].map(d => {
                const dt = new Date(); dt.setDate(dt.getDate() - d);
                const ds = dt.toISOString().slice(0, 10);
                return salesBills.filter(b => !b.isReturn && b.date && b.date.startsWith(ds)).reduce((s, b) => s + num(b.netAmount), 0);
              }).reverse();
              const maxSales = Math.max(...salesLast7, 1);

              const statCards = [
                { label: "Total Items", val: items.length, icon: "📦", cls: "card-blue", pct: 70 },
                { label: "Sales Bills", val: salesBills.filter(b => !b.isReturn).length, icon: "🧾", cls: "card-green", pct: 85 },
                { label: "Purchase Bills", val: purchaseBills.length, icon: "🛒", cls: "card-purple", pct: 60 },{ label: "Low Stock", val: lowStock.length, icon: "⚠️", cls: "card-red", pct: lowStock.length * 10 },
                { label: "Expiry Alerts", val: expiredItems.length + expiringSoon.length, icon: "💊", cls: "card-cyan", pct: 50 },
              ];

              const riskCircle = (pct, color, label, size = 80) => {
                const r = (size - 12) / 2;
                const circ = 2 * Math.PI * r;
                const dash = circ * (pct / 100);
                return (
                  <div className="risk-ring-wrap" style={{ width: size, height: size }}>
                    <svg width={size} height={size}>
                      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
                        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 1s ease" }} />
                    </svg>
                    <div className="ring-text">
                      <div style={{ fontSize: size > 70 ? "16px" : "12px", fontWeight: "800", color: "var(--color-text-dark)" }}>{pct}%</div>
                      <div style={{ fontSize: "9px", color: "#64748b", marginTop: "1px" }}>{label}</div>
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--color-text-dark)", letterSpacing: "-0.5px", fontFamily: "Rajdhani, sans-serif" }}>
                        🏥 Shivdhara Medical
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Dashboard Overview</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button onClick={() => setShowDayEnd(true)} style={{ background: "rgba(139,92,246,0.15)", color: "#7c3aed", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>🏁 Day End</button>
                      <button onClick={handleExportData} style={{ background: "rgba(245,158,11,0.15)", color: "#d97706", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>⬇️ Backup</button>
                      <label style={{ background: "rgba(22,163,74,0.15)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.3)", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                        ⬆️ Restore
                        <input type="file" accept=".json" onChange={handleImportData} style={{ display: "none" }} />
                      </label>
                    </div>
                  </div>

                  {/* LIVE PROFIT METER */}
                  {(() => {
                    const p = getLiveProfitToday(); const pct = p.sales > 0 ? Math.min(100, Math.round((p.profit / p.sales) * 100)) : 0; return (
                      <div style={{ background: "linear-gradient(135deg,rgba(16,163,74,0.15),rgba(5,150,105,0.1))", border: "1px solid rgba(16,163,74,0.25)", borderRadius: "14px", padding: "16px", marginBottom: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 120px", gap: "12px", alignItems: "center" }}>
                        <div><div style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px" }}>💰 Today's Sales</div><div style={{ fontSize: "20px", fontWeight: "800", color: "#16a34a" }}>₹{fmt(p.sales, 0)}</div></div>
                        <div><div style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px" }}>🛒 Today's Purchase</div><div style={{ fontSize: "20px", fontWeight: "800", color: "#fb923c" }}>₹{fmt(p.purchase, 0)}</div></div>
                        <div><div style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px" }}>📈 Live Profit</div><div style={{ fontSize: "20px", fontWeight: "800", color: p.profit >= 0 ? "#4ade80" : "#f87171" }}>₹{fmt(p.profit, 0)}</div></div>
                        <div style={{ textAlign: "center" }}>
                          <svg width="90" height="90" style={{ transform: "rotate(-90deg)" }}>
                            <circle cx="45" cy="45" r="35" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                            <circle cx="45" cy="45" r="35" fill="none" stroke={p.profit >= 0 ? "#4ade80" : "#f87171"} strokeWidth="8" strokeDasharray={`${2 * Math.PI * 35 * (pct / 100)} ${2 * Math.PI * 35}`} strokeLinecap="round" />
                          </svg>
                          <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--color-text-dark)", marginTop: "-56px", position: "relative", zIndex: 1 }}>{pct}%<br /><span style={{ fontSize: "9px", color: "#64748b" }}>Margin</span></div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* NEW FEATURE ALERTS STRIP */}
                  {(() => {
                    const autoDrafts = getAutoPurchaseDrafts();
                    const dues = getDueDateAlerts();
const pending = [];
                    const khataUncleared = khataEntries.filter(e => !e.cleared);
                    if (!autoDrafts.length && !dues.length && !pending.length && !khataUncleared.length) return null;
                    return (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                        {autoDrafts.length > 0 && <button onClick={() => { setActiveSection("purchase"); }} style={{ background: "rgba(239,68,68,0.15)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "20px", padding: "5px 12px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>🔄 {autoDrafts.length} Auto Reorder Pending</button>}
                        {dues.length > 0 && <button onClick={() => { setActiveSection("masters"); setOwnerSubTab("patients"); }} style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)", borderRadius: "20px", padding: "5px 12px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>💊 {dues.length} Refill Alerts</button>}
                        {pending.length > 0 && <button onClick={() => { setActiveSection("masters"); setOwnerSubTab("prescriptions"); }} style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "20px", padding: "5px 12px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>📋 {pending.length} Prescriptions Pending</button>}
                        {khataUncleared.length > 0 && <button onClick={() => { setActiveSection("payments"); setOwnerSubTab("khata"); }} style={{ background: "rgba(250,204,21,0.15)", color: "#facc15", border: "1px solid rgba(250,204,21,0.3)", borderRadius: "20px", padding: "5px 12px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>📒 {khataUncleared.length} Khata Pending</button>}
                      </div>
                    );
                  })()}

                  {/* Stat Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: "12px", marginBottom: "20px" }}>
                    {statCards.map(s => (
                      <div key={s.label} className={"stat-card " + s.cls}>
                        <div style={{ fontSize: "22px", marginBottom: "6px" }}>{s.icon}</div>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--color-text-dark)", fontFamily: "Rajdhani, sans-serif" }}>{s.val}</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{s.label}</div>
                        <div className="mini-bar">
                          <div className="mini-bar-fill" style={{ width: Math.min(s.pct, 100) + "%", background: "linear-gradient(90deg, var(--color-primary), #60a5fa)" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Main Grid: Charts + Risk */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "14px", marginBottom: "14px" }}>

                    {/* Sales Chart */}
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--color-text-dark)" }}>📈 Sales — Last 7 Days</div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>₹{fmt(salesLast7.reduce((a, b) => a + b, 0), 0)} total</div>
                        </div>
                        <div style={{ fontSize: "11px", color: "#4f8ef7", background: "rgba(79,142,247,0.12)", padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(79,142,247,0.2)" }}>Weekly</div>
                      </div>
                      {/* Bar Chart */}
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "90px", padding: "0 4px" }}>
                        {salesLast7.map((v, i) => {
                          const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                          const d = new Date(); d.setDate(d.getDate() - (6 - i));
                          const label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
                          const h = maxSales > 0 ? Math.max((v / maxSales) * 75, 3) : 3;
                          return (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                              <div style={{ fontSize: "9px", color: "#64748b" }}>₹{v > 0 ? fmt(v, 0) : "-"}</div>
                              <div style={{
                                width: "100%", height: h + "px",
                                background: i === 6 ? "linear-gradient(180deg,#4f8ef7,#a78bfa)" : "linear-gradient(180deg,rgba(79,142,247,0.5),rgba(167,139,250,0.3))",
                                borderRadius: "4px 4px 0 0",
                                transition: "height 0.8s ease",
                                boxShadow: i === 6 ? "0 0 12px rgba(79,142,247,0.4)" : "none"
                              }} />
                              <div style={{ fontSize: "9px", color: "#64748b" }}>{label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Risk Panel */}
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "18px" }}>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--color-text-dark)", marginBottom: "14px" }}>🛡️ Stock Risk</div>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
                        {riskCircle(stockRiskPct, stockRiskPct > 30 ? "#f87171" : "#4ade80", "Risk", 100)}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>⚠️ Low Stock</div>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: "#fb923c" }}>{lowStock.length} items</div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>💊 Expiring Soon</div>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: "#facc15" }}>{expiringSoon.length} items</div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>❌ Expired</div>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: "#dc2626" }}>{expiredItems.length} items</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Summary Row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "14px" }}>
                    {[
                      { label: "Total Revenue", val: "₹" + fmt(totalRevenue, 0), color: "#16a34a", icon: "💰", bg: "rgba(74,222,128,0.1)" },
                      { label: "Total Purchase", val: "₹" + fmt(totalPurchase, 0), color: "#2563eb", icon: "🛒", bg: "rgba(96,165,250,0.1)" },
                      { label: "Gross Profit", val: "₹" + fmt(profit, 0), color: profit >= 0 ? "#a78bfa" : "#f87171", icon: "📊", bg: profit >= 0 ? "rgba(167,139,250,0.1)" : "rgba(248,113,113,0.1)" },
                    ].map(c => (
                      <div key={c.label} style={{ background: c.bg, border: "1px solid " + c.color + "33", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontSize: "24px" }}>{c.icon}</div>
                        <div>
                          <div style={{ fontSize: "18px", fontWeight: "800", color: c.color, fontFamily: "Rajdhani, sans-serif" }}>{c.val}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{c.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "16px", marginBottom: "14px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>⚡ Quick Actions</div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {[
                        { label: "🧾 New Sales Bill", action: () => openSalesForm(false), color: "#16a34a" },
                        { label: "🛒 New Purchase", action: () => openPurchaseForm(), color: "#2563eb" },
                        { label: "📦 Add Item", action: () => openItemForm("medicines"), color: "#7c3aed" },
                        { label: "💳 Payment Entry", action: () => openPaymentForm(), color: "#d97706" },
                        { label: "↩️ Sales Return", action: () => openSalesForm(true), color: "#dc2626" },
                      ].map(a => (
                        <button key={a.label} onClick={a.action} style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid " + a.color + "44",
                          borderRadius: "10px",
                          color: a.color,
                          padding: "9px 16px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          transition: "all 0.2s"
                        }}
                          onMouseOver={e => { e.currentTarget.style.background = a.color + "22"; e.currentTarget.style.transform = "translateY(-2px)" }}
                          onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(0)" }}
                        >{a.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Online Orders */}
                  {([]).length > 0 && (
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--color-text-dark)" }}>📦 Online Orders ({([]).length})</div>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {["All", "Pending", "Ready", "Delivered", "Cancelled"].map(s => (
                            <button key={s} onClick={() => setOrderFilter(s)} style={{
                              fontSize: "11px", padding: "4px 12px", borderRadius: "20px", border: "none", cursor: "pointer", fontWeight: "600",
                              background: orderFilter === s ? "linear-gradient(135deg,#4f8ef7,#a78bfa)" : "rgba(255,255,255,0.07)",
                              color: orderFilter === s ? "white" : "#64748b",
                              transition: "all 0.2s"
                            }}>{s}</button>
                          ))}
                        </div>
                      </div>
                      {[...([])].reverse().filter(o => orderFilter === "All" || o.status === orderFilter).map(o => {
                        const ss = STATUS_STYLE[o.status] || STATUS_STYLE.Pending;
                        const [expanded, setExpanded] = [expandedOwnerOrder === o.id, id => setExpandedOwnerOrder(expandedOwnerOrder === id ? null : id)];
                        return (
                          <div key={o.id} className="order-row">
                            <div onClick={() => setExpanded(o.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                              <div>
                                <div style={{ fontWeight: "700", fontSize: "13px", color: "#e2e8f0" }}>{o.customer?.name || "—"} <span style={{ color: "#64748b", fontWeight: "400", fontSize: "11px" }}>· {o.customer?.phone || ""}</span></div>
                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{(o.items || []).length} items · {new Date(o.date).toLocaleString("en-IN")}</div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontWeight: "800", fontSize: "14px", color: "#16a34a" }}>₹{fmt(o.total)}</div>
                                  <span style={{ background: ss.bg, color: ss.color, padding: "2px 8px", borderRadius: "5px", fontSize: "10px", fontWeight: "700" }}>{o.status}</span>
                                </div>
                                {expanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                              </div>
                            </div>
                            {expanded && (
                              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "10px", paddingTop: "10px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "10px" }}>
                                  <thead><tr style={{ background: "rgba(255,255,255,0.05)" }}><th style={{ padding: "5px 8px", textAlign: "left", color: "#64748b" }}>Item</th><th style={{ padding: "5px 8px", textAlign: "right", color: "#64748b" }}>Qty</th><th style={{ padding: "5px 8px", textAlign: "right", color: "#64748b" }}>Amount</th></tr></thead>
                                  <tbody>
                                    {(o.items || []).map(item => (
                                      <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                        <td style={{ padding: "5px 8px", color: "#e2e8f0" }}>{getDivision(item.division).icon} {item.name}</td>
                                        <td style={{ padding: "5px 8px", textAlign: "right", color: "#64748b" }}>×{item.quantity}</td>
                                        <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: "700", color: "#2563eb" }}>₹{fmt(num(item.price) * item.quantity)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div style={{ fontWeight: "800", color: "#16a34a" }}>Total: ₹{fmt(o.total)}</div>
                                  <div style={{ display: "flex", gap: "6px" }}>
                                    {o.status === "Pending" && <button onClick={() => (() => {})(o.id, "Ready")} style={{ background: "rgba(251,146,60,0.2)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>Mark Ready</button>}
                                    {(o.status === "Pending" || o.status === "Ready") && <button onClick={() => (() => {})(o.id, "Delivered")} style={{ background: "rgba(74,222,128,0.2)", color: "#16a34a", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>Delivered</button>}
                                    {o.status !== "Cancelled" && o.status !== "Delivered" && <button onClick={() => showConfirm("Cancel this order?", () => { (() => {})(o.id, "Cancelled") })} style={{ background: "rgba(248,113,113,0.2)", color: "#dc2626", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>Cancel</button>}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {([]).filter(o => orderFilter === "All" || o.status === orderFilter).length === 0 && (
                        <div style={{ textAlign: "center", padding: "20px", color: "#475569", fontSize: "13px" }}>No orders found</div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {/* ══════════════════════════════════════════
            OWNER: INVENTORY
        ══════════════════════════════════════════ */}
        {isOwner && activeSection === "inventory" && (
          <>
            {(() => {
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "24px" }}>📦</span>
                    <div><h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>Inventory</h2><p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>All items in stock</p></div>
                    <button onClick={() => openItemForm("")} style={{ ...btn("var(--color-primary)"), fontSize: "12px", marginLeft: "auto" }}><Plus size={13} />Add Item</button>
                    <button onClick={() => { setScannerTarget("inventory"); setShowCameraScanner(true); }}
                      style={{ ...btn("var(--color-primary)"), fontSize: "12px" }}>📷 Scan Barcode</button>
                  </div>
                  {/* Search */}
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "160px", position: "relative" }}>
                      <Search size={12} style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                      <input value={itemSearch} onChange={e => setItemSearch(e.target.value)} placeholder="Search..." style={{ ...inp, paddingLeft: "28px", padding: "8px 8px 8px 28px" }} />
                    </div>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inp, width: "auto" }}>
                      <option value="name">Name A-Z</option>
                      <option value="price_asc">Price ↑</option>
                      <option value="price_desc">Price ↓</option>
                    </select>
                    <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: "600", color: "#475569", cursor: "pointer" }}>
                      <input type="checkbox" checked={filterStock} onChange={e => setFilterStock(e.target.checked)} /> In Stock Only
                    </label>
                  </div>
                  {/* Item Form */}
                  {showItemForm && (
                    <div style={{ background: "white", borderRadius: "12px", padding: "24px", marginBottom: "20px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                        <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "var(--color-text-dark)" }}>{editingItem ? "Edit" : "Add"} Item 📦</h3>
                        <button onClick={() => { setShowItemForm(false); setEditingItem(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "10px", marginBottom: "12px" }}>
                        {[
                          { k: "name", l: "Item Name *", t: "text" }, { k: "company", l: "Company", t: "text" }, { k: "drugGroup", l: "Drug Group", t: "text" },
                          { k: "pRate", l: "Purchase Rate (PTR)", t: "number" }, { k: "mrp", l: "MRP", t: "number" },
                          { k: "cess", l: "Cess %", t: "number" }, { k: "discount", l: "Discount %", t: "number" },
                          { k: "stock", l: "Stock", t: "number" }, { k: "unit", l: "Unit", t: "text" }, { k: "pack", l: "Pack Size", t: "text" },
                          { k: "minimum", l: "Min Stock Alert", t: "number" },
                          { k: "expiryDate", l: "Expiry Date (MM/YY)", t: "text" },
                          { k: "hsn", l: "HSN Code", t: "text" },
                          { k: "barcode", l: "Barcode", t: "text" }, { k: "supplier", l: "Supplier", t: "text" },
                          { k: "location", l: "Location", t: "text" },
                          { k: "gst", l: "GST %", t: "number" },
                        ].map(f => (
                          <div key={f.k}><label style={lbl}>{f.l}</label><input type={f.t} value={itemForm[f.k] || ""} onChange={e => { let v = e.target.value; if (f.k === "expiryDate") { v = v.replace(/[^0-9/]/g, ""); if (v.length === 2 && !v.includes("/") && (itemForm[f.k] || "").length !== 3) v = v + "/"; if (v.length > 5) return; setItemForm({ ...itemForm, [f.k]: v }); return; } setItemForm({ ...itemForm, [f.k]: f.t === "text" ? v.toUpperCase() : v }); }} style={{ ...inp, textTransform: f.k === "expiryDate" ? "none" : f.t === "text" ? "uppercase" : "none" }} /></div>
                        ))}
                        <div><label style={lbl}>Category</label><select value={itemForm.division || itemDivision || "medicines"} onChange={e => setItemForm({ ...itemForm, division: e.target.value })} style={inp}>{DIVISIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select></div>
                        <div><label style={lbl}>Tax Type</label><select value={itemForm.taxType || "taxable"} onChange={e => setItemForm({ ...itemForm, taxType: e.target.value })} style={inp}><option value="taxable">Taxable</option><option value="exempt">Exempt</option></select></div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", justifyContent: "center" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer" }}><input type="checkbox" checked={!!itemForm.scheduleH} onChange={e => setItemForm({ ...itemForm, scheduleH: e.target.checked })} /><span style={{ fontWeight: "600" }}>Schedule H Drug</span></label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer" }}><input type="checkbox" checked={!!itemForm.rxRequired} onChange={e => setItemForm({ ...itemForm, rxRequired: e.target.checked })} /><span style={{ fontWeight: "600" }}>Rx Required</span></label>
                        </div>
                        <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Description</label><textarea value={itemForm.description || ""} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} style={{ ...inp, height: "55px", resize: "vertical" }} placeholder="Notes..." /></div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={handleSaveItem} style={{ ...btn("var(--color-primary)") }}><CheckCircle size={13} />{editingItem ? "Update" : "Save"}</button>
                        <button onClick={() => { setShowItemForm(false); setEditingItem(null); }} style={{ ...btn("var(--color-border)", "var(--color-text-dark)") }}><X size={13} />Cancel</button>
                      </div>
                    </div>
                  )}
                  {/* Items Grid */}
                  {filteredItems("").length === 0 ? (
                    <div style={{ textAlign: "center", padding: "50px", color: "#64748b" }}><div style={{ fontSize: "44px" }}>📦</div><p>No items found</p><button onClick={() => openItemForm("")} style={{ ...btn("var(--color-primary)"), margin: "12px auto 0" }}><Plus size={13} />Add Item</button></div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: "10px" }}>
                      {filteredItems("").map(item => {
                        const exp = isExpired(item.expiryDate), expSoon = isExpiringSoon(item.expiryDate);
                        const batchCount = itemBatches(item.id).length;
                        const itemDiv = DIVISIONS.find(d => d.id === item.division) || DIVISIONS[0];
                        return (
                          <div key={item.id} style={{ background: "white", borderRadius: "12px", padding: "16px", border: `1px solid ${exp ? "#fca5a5" : expSoon ? "#fdba74" : itemDiv.border}`, boxShadow: "var(--shadow-sm)", transition: "all 0.2s" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: "700", fontSize: "13px", color: "#1e293b", display: "flex", alignItems: "center", gap: "5px" }}>
                                  {item.name}
                                  {item.scheduleH && <span style={{ background: "#fef9c3", color: "#854d0e", fontSize: "9px", padding: "1px 4px", borderRadius: "4px", fontWeight: "700" }}>Sch.H</span>}
                                  {item.rxRequired && <span style={{ background: "#fce7f3", color: "#be185d", fontSize: "9px", padding: "1px 4px", borderRadius: "4px", fontWeight: "700" }}>Rx</span>}
                                </div>
                                {item.company && <div style={{ fontSize: "11px", color: "#64748b" }}>{item.company}</div>}
                              </div>
                              {(exp || expSoon) && <AlertCircle size={14} color={exp ? "#ef4444" : "#fd7e14"} />}
                            </div>
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "7px" }}>
                              {item.pRate > 0 && <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: "5px", fontSize: "10px" }}>PTR ₹{item.pRate}</span>}
                              <span style={{ background: itemDiv.bg, color: itemDiv.color, padding: "2px 7px", borderRadius: "5px", fontSize: "11px", fontWeight: "700" }}>₹{item.price}</span>
                              {item.mrp > 0 && item.mrp > item.price && <span style={{ background: "#f1f5f9", color: "#64748b", padding: "2px 7px", borderRadius: "5px", fontSize: "11px", textDecoration: "line-through" }}>₹{item.mrp}</span>}
                              {item.gst > 0 && <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "2px 6px", borderRadius: "5px", fontSize: "11px" }}>GST {item.gst}%</span>}
                              <span style={{ background: item.stock <= 0 ? "#fef2f2" : "#f8fafc", color: item.stock <= 0 ? "#ef4444" : "#475569", padding: "2px 6px", borderRadius: "5px", fontSize: "11px" }}>{item.stock <= 0 ? "Out" : item.stock + " " + (item.unit || "pcs")}</span>
                              {batchCount > 0 && <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "2px 6px", borderRadius: "5px", fontSize: "10px" }}>{batchCount} batches</span>}
                            </div>
                            {item.expiryDate && <div style={{ fontSize: "10px", color: exp ? "#ef4444" : expSoon ? "#fd7e14" : "#64748b", marginBottom: "7px" }}>📅 {item.expiryDate} {exp ? "(Expired)" : expSoon ? "(Expiring Soon)" : ""}</div>}
                            <div style={{ display: "flex", gap: "5px" }}>
                              <button onClick={() => { setQuickStockItem(item); setQuickQty(""); }} style={{ ...btn("var(--color-primary)"), fontSize: "11px", padding: "5px 8px" }}>+📦</button>
                              <button onClick={() => { setLabelItem(item); setLabelQty(1); setShowLabelPrint(true); }} style={{ ...btn("#7c3aed"), fontSize: "11px", padding: "5px 8px" }}>🏷️</button>
                              <button onClick={() => openItemForm("", item)} style={{ ...btn(), fontSize: "11px", padding: "5px 8px" }}><Edit2 size={11} /></button>
                              <button onClick={() => handlePrintLabel(item)} style={{ ...btn("#7c3aed"), fontSize: "11px", padding: "5px 8px", marginRight: "4px" }} title="Print Label">🏷️</button>
                              <button onClick={() => handleDeleteItem(item.id)} style={{ ...btn("#ef4444"), fontSize: "11px", padding: "5px 8px" }}><Trash2 size={11} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {/* ══════════════════════════════════════════
            OWNER: PURCHASE BILL
        ══════════════════════════════════════════ */}
        {isOwner && activeSection === "purchase" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>🛒 Purchase Bills ({purchaseBills.length})</h2>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
                <input
                  placeholder="Search Bill# / Party / Entry..."
                  value={purchaseBillSearch || ""}
                  onChange={e => setPurchaseBillSearch(e.target.value)}
                  style={{ ...inp, width: "280px", paddingLeft: "30px", borderRadius: "20px", background: "#f8fafc" }}
                />
              </div>
              <button onClick={openPurchaseForm} style={{ ...btn() }}><Plus size={14} />New Purchase</button>
            </div>

            {/* Purchase Form */}
            {showPurchaseForm && (
              <div style={{ background: "white", borderRadius: "12px", padding: "24px", marginBottom: "20px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>🛒 New Purchase Entry</h3>
                  <button onClick={() => setShowPurchaseForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
                </div>
                {/* Header fields */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: "10px", marginBottom: "16px", background: "#f8fafc", borderRadius: "12px", padding: "20px", border: "1px solid var(--color-border)" }}>
                  <div>
                    <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Entry No</label>
                    <input value={purchaseForm.entryNo || ""} readOnly style={{ ...inp, background: "#ecfdf5", color: "var(--color-text-dark)", fontWeight: "700", cursor: "default", border: "none" }} />
                  </div>
                  <div>
                    <label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Party Name *</label>
                    <input list="supp-list" value={purchaseForm.partyName || ""} onChange={e => { const s = suppliers.find(x => x.name === e.target.value); setPurchaseForm({ ...purchaseForm, partyName: e.target.value, supplierId: s?.id || "" }); }} placeholder="Party / Supplier name" style={inp} />
                    <datalist id="supp-list">{suppliers.map(s => <option key={s.id} value={s.name} />)}</datalist>
                  </div>
                  <div><label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Party Bill No</label><input value={purchaseForm.billNo || ""} onChange={e => setPurchaseForm({ ...purchaseForm, billNo: e.target.value })} placeholder="Bill No" style={inp} /></div>
                  <div><label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Bill Date</label><input type="date" value={purchaseForm.billDate || today()} onChange={e => setPurchaseForm({ ...purchaseForm, billDate: e.target.value })} style={inp} /></div>
                  <div><label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Entry Date</label><input type="date" value={purchaseForm.entryDate || today()} onChange={e => setPurchaseForm({ ...purchaseForm, entryDate: e.target.value })} style={inp} /></div>
                  <div><label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Tax Type</label><select value={purchaseForm.taxType || "exclusive"} onChange={e => setPurchaseForm({ ...purchaseForm, taxType: e.target.value })} style={inp}><option value="exclusive">Exclusive (Tax Alag)</option><option value="inclusive">Inclusive (Tax Sathe)</option></select></div>
                  <div><label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Payment Mode</label><select value={purchaseForm.paymentMode || "cash"} onChange={e => setPurchaseForm({ ...purchaseForm, paymentMode: e.target.value })} style={inp}><option value="cash">Cash</option><option value="credit">Credit</option><option value="cheque">Cheque</option><option value="neft">NEFT/UPI</option></select></div>
                  <div><label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Tax Zone</label><select value={purchaseForm.taxZone || "sgst_ugst"} onChange={e => setPurchaseForm({ ...purchaseForm, taxZone: e.target.value })} style={inp}><option value="sgst_ugst">RD Within State - SGST/UGST</option><option value="igst">RD Outside State - IGST</option><option value="exempt">Tax Exempt</option></select></div>
                  <div><label style={{ ...lbl, color: "var(--color-text-muted)", fontWeight: "600" }}>Address F4 / Credit Note F5</label><input value={purchaseForm.addressF4 || ""} onChange={e => setPurchaseForm({ ...purchaseForm, addressF4: e.target.value })} placeholder="Address / Ref" style={inp} /></div>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center", paddingTop: "18px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                      <input type="checkbox" checked={!!purchaseForm.gstInclusive} onChange={e => setPurchaseForm({ ...purchaseForm, gstInclusive: e.target.checked })} style={{ width: "14px", height: "14px" }} />
                      GST Inclusive
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                      <input type="checkbox" checked={!!purchaseForm.gstOnFree} onChange={e => setPurchaseForm({ ...purchaseForm, gstOnFree: e.target.checked })} style={{ width: "14px", height: "14px" }} />
                      GST on Free
                    </label>
                  </div>
                </div>
                {/* Purchase Items Table */}
                <div style={{ overflowX: "auto", marginBottom: "14px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "900px" }}>
                    <thead><tr style={{ background: "#f1f5f9" }}>
                      {["Sr", "Item *", "Batch No", "Exp Dt", "Qty", "Free", "MRP", "PTR", "GST%", "Disc%", "Disc Amt", "BASE", "Amount", ""].map(h => (
                        <th key={h} style={{ padding: "7px 8px", textAlign: ["Disc Amt", "BASE", "Amount"].includes(h) ? "right" : h === "Sr" ? "center" : "left", fontWeight: "600", color: "var(--color-text-dark)", fontSize: "12px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {purchaseItems.map((pi, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #e9ecef" }}>
                          <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: "600", color: "#64748b", fontSize: "12px", whiteSpace: "nowrap" }}>{idx + 1}</td>
                          <td style={{ padding: "4px", position: "relative", minWidth: "160px" }}>
                            {(() => {
                              const q = (purchaseItemSearch[idx] || "").toLowerCase();
                              const filtered = items.filter(i => { return !q || (i.name || "").toLowerCase().includes(q) || (i.company || "").toLowerCase().includes(q); });
                              const hi = purchaseItemHighlight[idx] || 0;
                              const selectItem = (i) => { updatePurchaseItem(idx, "itemId", i.id); setPurchaseItemSearch(prev => ({ ...prev, [idx]: undefined })); setPurchaseItemHighlight(prev => ({ ...prev, [idx]: 0 })); setPurchaseItemDropdown(null); };
                              return (<>
                                <input
                                  value={purchaseItemSearch[idx] !== undefined ? purchaseItemSearch[idx] : (pi.itemName || "")}
                                  onChange={e => { const r = e.target.getBoundingClientRect(); setPurchaseDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 220) }); setPurchaseItemSearch({ ...purchaseItemSearch, [idx]: e.target.value }); setPurchaseItemHighlight({ ...purchaseItemHighlight, [idx]: 0 }); setPurchaseItemDropdown(idx); }}
                                  onFocus={e => { const r = e.target.getBoundingClientRect(); setPurchaseDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 220) }); setPurchaseItemSearch(prev => ({ ...prev, [idx]: prev[idx] ?? "" })); setPurchaseItemHighlight(prev => ({ ...prev, [idx]: 0 })); setPurchaseItemDropdown(idx); }}
                                  onBlur={() => setTimeout(() => setPurchaseItemDropdown(null), 200)}
                                  placeholder="Search item..."
                                  style={{ ...inp, minWidth: "150px", padding: "6px 8px" }}
                                  autoComplete="off"
                                  data-pf={`${idx}-item`}
                                  onKeyDown={e => {
                                    if (purchaseItemDropdown === idx && filtered.length > 0) {
                                      if (e.key === "ArrowDown") { e.preventDefault(); setPurchaseItemHighlight(prev => ({ ...prev, [idx]: Math.min((prev[idx] || 0) + 1, filtered.length - 1) })); return; }
                                      if (e.key === "ArrowUp") { e.preventDefault(); setPurchaseItemHighlight(prev => ({ ...prev, [idx]: Math.max((prev[idx] || 0) - 1, 0) })); return; }
                                      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); const item = filtered[hi]; if (item) { selectItem(item); } return; }
                                    }
                                    if (e.key === "Enter" && purchaseItemDropdown !== idx) { focusNext(e, idx, "item"); }
                                  }}
                                />
                                {purchaseItemDropdown === idx && (purchaseItemSearch[idx] || "").length >= 0 && (
                                  <div style={{ position: "fixed", top: purchaseDropdownPos.top, left: purchaseDropdownPos.left, zIndex: 9999, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: purchaseDropdownPos.width }}>
                                    {filtered.map((i, pos) => (
                                      <div key={i.id} onMouseDown={() => selectItem(i)} onMouseEnter={() => setPurchaseItemHighlight(prev => ({ ...prev, [idx]: pos }))} style={{ padding: "7px 10px", cursor: "pointer", borderBottom: "1px solid #e9ecef", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", background: pos === hi ? "#eff6ff" : "white" }}>
                                        <span><strong>{i.name}</strong></span>
                                        <span style={{ color: "#64748b", fontSize: "11px", marginLeft: "8px" }}>{getDivision(i.division).icon} ₹{i.price}</span>
                                      </div>
                                    ))}
                                    {filtered.length === 0 && (
                                      <div style={{ padding: "10px", color: "#64748b", fontSize: "12px", textAlign: "center" }}>No items found</div>
                                    )}
                                  </div>
                                )}
                              </>);
                            })()}
                          </td>
                          {[{ f: "batchNo", ph: "Batch", w: "80px" }, { f: "expiryDate", t: "text", ph: "MM/YY", w: "75px" }, { f: "qty", t: "number", ph: "Qty", w: "60px" }, { f: "freeQty", t: "number", ph: "Free", w: "55px" }, { f: "mrp", t: "number", ph: "MRP", w: "70px" }, { f: "ptr", t: "number", ph: "PTR", w: "70px" }].map(f => (
                            <td key={f.f} style={{ padding: "4px" }}><input type={f.t || "text"} value={pi[f.f] || ""} onChange={e => { let v = e.target.value; if (f.f === "expiryDate") { v = v.replace(/[^0-9/]/g, ""); if (v.length === 2 && !v.includes("/") && pi[f.f]?.length !== 3) v = v + "/"; if (v.length > 5) return; } updatePurchaseItem(idx, f.f, v); }} onKeyDown={e => focusNext(e, idx, f.f)} placeholder={f.ph} data-pf={`${idx}-${f.f}`} style={{ ...inp, width: f.w, padding: "6px 7px", letterSpacing: f.f === "expiryDate" ? "1px" : "normal" }} /></td>
                          ))}
                          <td style={{ padding: "4px" }}>
                            <select value={pi.gst || "5"} onChange={e => updatePurchaseItem(idx, "gst", e.target.value)} onKeyDown={e => focusNext(e, idx, "gst")} data-pf={`${idx}-gst`} style={{ ...inp, width: "65px", padding: "6px 5px" }}>
                              {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                            </select>
                          </td>
                          <td style={{ padding: "4px" }}><input type="number" value={pi.disc || "0"} onChange={e => updatePurchaseItem(idx, "disc", e.target.value)} onKeyDown={e => focusNext(e, idx, "disc")} data-pf={`${idx}-disc`} style={{ ...inp, width: "55px", padding: "6px 7px" }} /></td>
                          <td style={{ padding: "6px 8px", fontWeight: "700", color: "#ef4444", whiteSpace: "nowrap", textAlign: "right" }}>₹{fmt(num(pi.ptr) * int(pi.qty) * num(pi.disc) / 100)}</td>
                          <td style={{ padding: "6px 8px", fontWeight: "700", color: "var(--color-primary)", whiteSpace: "nowrap", textAlign: "right" }}>₹{fmt(num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100))}</td>
                          <td style={{ padding: "4px 8px", fontWeight: "700", color: "#3b82f6", whiteSpace: "nowrap", textAlign: "right" }}>₹{fmt(pi.amount || 0)}</td>
                          <td style={{ padding: "4px" }}><button onClick={() => removePurchaseItem(idx)} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "5px", padding: "5px 8px", cursor: "pointer" }}><X size={12} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: "2px solid var(--color-border)", background: "#f8fafc" }}>
                        <td colSpan="10" style={{ padding: "10px 8px", fontWeight: "700", textAlign: "right", fontSize: "12px", color: "#64748b" }}>TOTALS →</td>
                        <td style={{ padding: "10px 8px", fontWeight: "800", textAlign: "right", fontSize: "13px", color: "#ef4444", whiteSpace: "nowrap" }}>₹{fmt(purchaseItems.reduce((s, pi) => s + num(pi.ptr) * int(pi.qty) * num(pi.disc) / 100, 0))}</td>
                        <td style={{ padding: "10px 8px", fontWeight: "800", textAlign: "right", fontSize: "13px", color: "var(--color-primary)", whiteSpace: "nowrap" }}>₹{fmt(purchaseItems.reduce((s, pi) => s + num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100), 0))}</td>
                        <td style={{ padding: "10px 8px", fontWeight: "800", textAlign: "right", fontSize: "14px", color: "#16a34a", whiteSpace: "nowrap" }}>₹{fmt(purchaseItems.reduce((s, pi) => s + num(pi.amount || 0), 0))}</td>
                        <td></td>
                      </tr>
                      <tr style={{ background: "#eff6ff", borderTop: "1px solid #bfdbfe" }}>
                        <td colSpan="10" style={{ padding: "8px 8px", fontWeight: "700", textAlign: "right", fontSize: "12px", color: "#1d4ed8" }}>GST SUMMARY →</td>
                        <td style={{ padding: "8px 8px", fontSize: "11px", color: "#475569", textAlign: "right" }}></td>
                        <td colSpan="2" style={{ padding: "8px 8px", fontWeight: "700", fontSize: "12px", color: "#1d4ed8", whiteSpace: "nowrap", textAlign: "right" }}>
                          {(() => { const gT = purchaseItems.reduce((s, pi) => s + num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100) * num(pi.gst) / 100, 0); return `SGST: ₹${fmt(gT / 2)}  |  CGST: ₹${fmt(gT / 2)}  |  IGST: ₹${fmt(gT)}`; })()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button onClick={addPurchaseItem} style={{ ...btn("var(--color-primary)"), fontSize: "12px" }}><Plus size={13} />Add Row</button>
                  <button onClick={() => { setScannerTarget("purchase"); setShowCameraScanner(true); }}
                    style={{ ...btn("var(--color-primary)"), fontSize: "12px" }}>📷 Scan — Purchase</button>
                  <button onClick={handleSavePurchase} style={{ ...btn("var(--color-primary)") }}><CheckCircle size={14} />Save & Update Stock</button>
                  <button onClick={() => setShowPurchaseForm(false)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)") }}><X size={13} />Cancel</button>
                </div>
                {/* Purchase Totals - PDF format */}
                {purchaseItems.filter(pi => pi.itemId).length > 0 && (() => {
                  const base = purchaseItems.reduce((s, pi) => s + num(pi.ptr) * int(pi.qty), 0);
                  const discAmt = purchaseItems.reduce((s, pi) => s + num(pi.ptr) * int(pi.qty) * num(pi.disc) / 100, 0);
                  const taxable = base - discAmt;
                  const gstTotal = purchaseItems.reduce((s, pi) => { const b = num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100); return s + b * num(pi.gst) / 100; }, 0);
                  const sgst = gstTotal / 2, cgst = gstTotal / 2;
                  const total = taxable + gstTotal;
                  return (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px", minWidth: "280px", fontSize: "12px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "3px 16px" }}>
                          <span>Base Amount:</span><span style={{ textAlign: "right", fontWeight: "600" }}>₹{fmt(base)}</span>
                          <span style={{ color: "#ef4444" }}>Less Disc:</span><span style={{ textAlign: "right", color: "#ef4444" }}>-₹{fmt(discAmt)}</span>
                          <span>Taxable Amount:</span><span style={{ textAlign: "right" }}>₹{fmt(taxable)}</span>
                          <span style={{ color: "#64748b" }}>SGST:</span><span style={{ textAlign: "right", color: "#64748b" }}>₹{fmt(sgst)}</span>
                          <span style={{ color: "#64748b" }}>CGST:</span><span style={{ textAlign: "right", color: "#64748b" }}>₹{fmt(cgst)}</span>
                          <span style={{ color: "#64748b" }}>IGST (SGST+CGST):</span><span style={{ textAlign: "right", color: "#1d4ed8", fontWeight: "700" }}>₹{fmt(gstTotal)}</span>
                          <span style={{ color: "#64748b" }}>Half Scheme:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.halfScheme || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, halfScheme: e.target.value })} style={{ ...inp, width: "80px", padding: "2px 6px", fontSize: "11px" }} /></span>
                          <span style={{ color: "#64748b" }}>Oct on Free:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.octOnFree || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, octOnFree: e.target.value })} style={{ ...inp, width: "80px", padding: "2px 6px", fontSize: "11px" }} /></span>
                          <span style={{ color: "#64748b" }}>Other +/-:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.otherAdj || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, otherAdj: e.target.value })} style={{ ...inp, width: "80px", padding: "2px 6px", fontSize: "11px" }} /></span>
                          <span style={{ color: "#ef4444" }}>Less Disc:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.lessDisc || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, lessDisc: e.target.value })} style={{ ...inp, width: "80px", padding: "2px 6px", fontSize: "11px" }} /></span>
                          <span style={{ color: "#64748b" }}>Cr Note:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.crNote || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, crNote: e.target.value })} style={{ ...inp, width: "80px", padding: "2px 6px", fontSize: "11px" }} /></span>
                          <span style={{ color: "#64748b" }}>TCS Value:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.tcsValue || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, tcsValue: e.target.value })} style={{ ...inp, width: "80px", padding: "2px 6px", fontSize: "11px" }} /></span>
                          <span style={{ fontWeight: "800", borderTop: "2px solid #e2e8f0", paddingTop: "6px" }}>TOTAL:</span>
                          <span style={{ textAlign: "right", fontWeight: "800", color: "var(--color-primary)", fontSize: "14px", borderTop: "2px solid #e2e8f0", paddingTop: "6px" }}>₹{fmt(total - num(purchaseForm.lessDisc) - num(purchaseForm.crNote) + num(purchaseForm.otherAdj) + num(purchaseForm.tcsValue))}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Purchase Bills List */}
            {purchaseBills.length === 0 && !showPurchaseForm ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}><div style={{ fontSize: "44px" }}>🛒</div><p>No purchase bills found</p></div>
            ) : [...purchaseBills].reverse().filter(bill => {
              const q = purchaseBillSearch.toLowerCase();
              return !q || (bill.billNo || "").toLowerCase().includes(q) || (bill.partyName || "").toLowerCase().includes(q) || (bill.entryNo || "").toString().includes(q);
            }).map(bill => (
              <div key={bill.id} style={{ background: "white", borderRadius: "12px", marginBottom: "12px", border: "1px solid var(--color-border)", overflow: "hidden", boxShadow: "var(--shadow-sm)", transition: "all 0.2s" }}>
                <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpandedPurchase(expandedPurchase === bill.id ? null : bill.id)}>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "13px" }}>Entry #{bill.entryNo} — {bill.partyName}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Bill: {bill.billNo || "N/A"} · {bill.billDate} · {bill.items?.length || 0} items · {bill.taxType}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "800", fontSize: "14px" }}>₹{fmt(bill.total)}</div>
                      <span style={{ background: (STATUS_STYLE[bill.status] || STATUS_STYLE.Pending).bg, color: (STATUS_STYLE[bill.status] || STATUS_STYLE.Pending).color, padding: "2px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "600" }}>{bill.status || "Paid"}</span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDeletePurchaseBill(bill); }} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", fontSize: "12px" }} title="Delete">🗑️</button>
                    {expandedPurchase === bill.id ? <ChevronUp size={15} color="#64748b" /> : <ChevronDown size={15} color="#64748b" />}
                  </div>
                </div>
                {expandedPurchase === bill.id && (
                  <div style={{ borderTop: "1px solid #f1f5f9", padding: "12px 14px", background: "#fafafa", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "600px" }}>
                      <thead><tr style={{ background: "#f1f5f9" }}>{["Item", "Batch", "Exp", "Qty", "Free", "MRP", "PTR", "GST", "Disc", "Amount"].map(h => <th key={h} style={{ padding: "6px 8px", textAlign: ["Qty", "Free", "PTR", "MRP", "GST", "Disc", "Amount"].includes(h) ? "right" : "left", fontWeight: "600", color: "var(--color-text-dark)", fontSize: "12px", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(bill.items || []).map((pi, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                            <td style={{ padding: "6px 8px", fontWeight: "600" }}>{pi.itemName || items.find(x => x.id === pi.itemId)?.name || "—"}</td>
                            <td style={{ padding: "6px 8px" }}>{pi.batchNo || "—"}</td>
                            <td style={{ padding: "6px 8px", fontSize: "11px", color: isExpired(pi.expiryDate) ? "#ef4444" : "inherit" }}>{pi.expiryDate || "—"}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>{pi.qty}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>{pi.freeQty || 0}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>₹{fmt(pi.ptr)}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>₹{fmt(pi.mrp)}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>{pi.gst || 0}%</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>{pi.disc || 0}%</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "700", color: "#3b82f6" }}>₹{fmt(pi.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr><td colSpan="9" style={{ padding: "8px", textAlign: "right", fontWeight: "700" }}>Total:</td><td style={{ padding: "8px", textAlign: "right", fontWeight: "800", color: "#16a34a" }}>₹{fmt(bill.total)}</td></tr></tfoot>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* ══════════════════════════════════════════
            OWNER: SALES BILL (POS)
        ══════════════════════════════════════════ */}
        {isOwner && activeSection === "sales_pos" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>🧾 Sales Bills ({salesBills.length})</h2>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
                  <input
                    placeholder="Search Patient / Bill# / Mobile..."
                    value={salesBillSearch}
                    onChange={e => setSalesBillSearch(e.target.value)}
                    style={{ ...inp, width: "280px", paddingLeft: "30px", borderRadius: "20px", background: "#f8fafc" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => openSalesForm(false)} style={{ ...btn("var(--color-primary)") }}><Plus size={14} />New Sale</button>
                <button onClick={() => openSalesForm(true)} style={{ ...btn("#ef4444") }}><Plus size={14} />Return</button>
              </div>
            </div>

            {/* Sales Form */}
            {showSalesForm && (
              <div style={{ background: "white", borderRadius: "6px", padding: "20px", marginBottom: "16px", border: `2px solid ${isReturn ? "#fecaca" : "#bbf7d0"}`, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>{isReturn ? "↩️ Sales Return" : "🧾 New Sales Bill"}</h3>
                  <button onClick={() => setShowSalesForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
                </div>
                {/* Patient/Doctor details */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "10px", marginBottom: "14px", background: "#f8fafc", borderRadius: "12px", padding: "20px", border: "1px solid var(--color-border)" }}>
                  {[
                    { k: "patientName", l: "Patient Name", t: "text", ph: "Patient name" }, { k: "patientArea", l: "Patient Area", t: "text", ph: "Area/Locality" },
                    { k: "mobile", l: "Mobile No", t: "tel", ph: "Mobile no" }, { k: "address", l: "Address", t: "text", ph: "Address" },
                    { k: "salesMan", l: "S.Man (Salesman)", t: "text", ph: "Salesman name" },
                  ].map(f => (
                    <div key={f.k}><label style={lbl}>{f.l}</label><input type={f.t} value={salesForm[f.k] || ""} onChange={e => setSalesForm({ ...salesForm, [f.k]: e.target.value.toUpperCase() })} placeholder={f.ph} style={inp} /></div>
                  ))}
                  <div><label style={lbl}>Doctor Name</label>
                    <select value={salesForm.doctorName || ""} onChange={e => setSalesForm({ ...salesForm, doctorName: e.target.value })} style={inp}>
                      <option value="">-- Select Doctor --</option>
                      {doctors.map(d => <option key={d.id} value={d.name}>{d.name}{d.speciality ? " (" + d.speciality + ")" : ""}</option>)}
                      <option value="OTHER">Other / Manual</option>
                    </select>
                  </div>
                  <div><label style={lbl}>Payment Mode</label><select value={salesForm.paymentMode || "cash"} onChange={e => { setSalesForm({ ...salesForm, paymentMode: e.target.value }); setSplitPayMode(false); }} style={inp}><option value="cash">Cash</option><option value="split">Split (Cash+UPI)</option><option value="card">Card/CD</option><option value="upi">UPI/NEFT</option><option value="credit">Credit/Khata</option><option value="cheque">Cheque</option></select></div>
                  {salesForm.paymentMode === "split" && (
                    <div style={{ gridColumn: "span 2", background: "rgba(255,255,255,0.1)", borderRadius: "6px", padding: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div><label style={{ ...lbl, color: "#d97706" }}>💵 Cash Amount ₹</label><input type="number" value={splitCash} onChange={e => { setSplitCash(e.target.value); }} placeholder="Cash" style={inp} /></div>
                      <div><label style={{ ...lbl, color: "#2563eb" }}>📱 UPI Amount ₹</label><input type="number" value={splitUpi} onChange={e => setSplitUpi(e.target.value)} placeholder="UPI" style={inp} /></div>
                      <div style={{ gridColumn: "span 2" }}><label style={{ ...lbl, color: "#64748b" }}>UPI Txn ID</label><input value={splitUpiTxn} onChange={e => setSplitUpiTxn(e.target.value.toUpperCase())} placeholder="Transaction ID" style={inp} /></div>
                    </div>
                  )}
                  {salesForm.paymentMode === "credit" && salesForm.patientName && (
                    <div style={{ gridColumn: "span 2", background: "rgba(250,204,21,0.15)", borderRadius: "6px", padding: "8px", border: "1px solid rgba(250,204,21,0.3)" }}>
                      <span style={{ fontSize: "11px", color: "#facc15", fontWeight: "700" }}>📒 {salesForm.patientName} - Current Khata Balance: ₹{fmt(getKhataBalance(salesForm.patientName))}</span>
                    </div>
                  )}
                  <div><label style={lbl}>Extra Discount %</label><input type="number" value={salesForm.discount || "0"} onChange={e => setSalesForm({ ...salesForm, discount: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Refill Due Date (Optional)</label><input type="date" value={salesForm.refillDate || ""} onChange={e => setSalesForm({ ...salesForm, refillDate: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Pay Rec / Refund (₹)</label><input type="number" value={salesForm.payRec || "0"} onChange={e => setSalesForm({ ...salesForm, payRec: e.target.value })} placeholder="0.00" style={inp} /></div>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center", paddingTop: "18px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                      <input type="checkbox" checked={!!isReturn} disabled style={{ width: "14px", height: "14px" }} />
                      Return Bill
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                      <input type="checkbox" checked={!!salesForm.quotation} onChange={e => setSalesForm({ ...salesForm, quotation: e.target.checked })} style={{ width: "14px", height: "14px" }} />
                      Quotation
                    </label>
                  </div>
                </div>
                {/* Item search + table */}

                <div style={{ overflowX: "auto", marginBottom: "14px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "680px" }}>
                    <thead><tr style={{ background: "#f1f5f9" }}>{["Sr", "Item", "Batch No", "Qty", "MRP", "Rate", "GST%", "Disc%", "Amount", ""].map(h => <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: "600", color: "var(--color-text-dark)", fontSize: "12px", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {salesItems.map((si, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #e9ecef" }}>
                          <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: "600", color: "#64748b", fontSize: "12px", whiteSpace: "nowrap" }}>{idx + 1}</td>
                          <td style={{ padding: "4px", position: "relative", minWidth: "160px" }}>
                            {(() => {
                              const q = (salesItemSearch[idx] || "").toLowerCase();
                              const filtered = items.filter(i => { const alreadyAdded = salesItems.some((s, sidx) => sidx !== idx && s.itemId === i.id); if (alreadyAdded) return false; return !q || (i.name || "").toLowerCase().includes(q) || (i.company || "").toLowerCase().includes(q); });
                              const hi = salesItemHighlight[idx] || 0;
                              const selectItem = (i) => { setSalesItems(prev => { const updated = [...prev]; const si2 = { ...emptySalesItem(), itemId: i.id, itemName: i.name, mrp: num(i.mrp) || num(i.price), rate: num(i.price), gst: num(i.gst) || 0 }; si2.amount = calcSalesItemAmt(si2); updated[idx] = { ...updated[idx], ...si2 }; return updated; }); setSalesItemSearch(prev => ({ ...prev, [idx]: undefined })); setSalesItemHighlight(prev => ({ ...prev, [idx]: 0 })); setSalesItemDropdown(null); };
                              return (<>
                                <input
                                  value={salesItemSearch[idx] !== undefined ? salesItemSearch[idx] : (si.itemName || "")}
                                  onChange={e => { const r = e.target.getBoundingClientRect(); setSalesDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 220) }); setSalesItemSearch({ ...salesItemSearch, [idx]: e.target.value }); setSalesItemHighlight({ ...salesItemHighlight, [idx]: 0 }); setSalesItemDropdown(idx); }}
                                  onFocus={e => { const r = e.target.getBoundingClientRect(); setSalesDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 220) }); setSalesItemSearch(prev => ({ ...prev, [idx]: prev[idx] ?? "" })); setSalesItemHighlight(prev => ({ ...prev, [idx]: 0 })); setSalesItemDropdown(idx); }}
                                  onBlur={() => setTimeout(() => setSalesItemDropdown(null), 200)}
                                  onKeyDown={e => {
                                    if (salesItemDropdown !== idx || filtered.length === 0) return;
                                    if (e.key === "ArrowDown") { e.preventDefault(); setSalesItemHighlight(prev => ({ ...prev, [idx]: Math.min((prev[idx] || 0) + 1, filtered.length - 1) })) }
                                    else if (e.key === "ArrowUp") { e.preventDefault(); setSalesItemHighlight(prev => ({ ...prev, [idx]: Math.max((prev[idx] || 0) - 1, 0) })) }
                                    else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); const item = filtered[hi]; if (item) selectItem(item); }
                                  }}
                                  placeholder="Search item..."
                                  style={{ ...inp, minWidth: "150px", padding: "6px 8px" }}
                                  autoComplete="off"
                                  data-pf="skip"
                                />
                                {salesItemDropdown === idx && salesItemSearch[idx] !== undefined && (
                                  <div style={{ position: "fixed", top: salesDropdownPos.top, left: salesDropdownPos.left, zIndex: 9999, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: salesDropdownPos.width }}>
                                    {filtered.map((i, pos) => (
                                      <div key={i.id} onMouseDown={() => selectItem(i)} onMouseEnter={() => setSalesItemHighlight(prev => ({ ...prev, [idx]: pos }))} style={{ padding: "7px 10px", cursor: "pointer", borderBottom: "1px solid #e9ecef", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", background: pos === hi ? "#eff6ff" : "white" }}>
                                        <span><strong>{i.name}</strong></span>
                                        <span style={{ color: "#64748b", fontSize: "11px", marginLeft: "8px" }}>{getDivision(i.division).icon} ₹{i.price} {i.stock <= 0 ? <span style={{ color: "#ef4444", fontSize: "10px" }}>OOS</span> : ""}</span>
                                      </div>
                                    ))}
                                    {filtered.length === 0 && (
                                      <div style={{ padding: "10px", color: "#64748b", fontSize: "12px", textAlign: "center" }}>No items found</div>
                                    )}
                                  </div>
                                )}
                              </>);
                            })()}
                          </td>
                          <td style={{ padding: "4px" }}><input type="text" value={si.batchNo || ""} onChange={e => updateSalesItem(idx, "batchNo", e.target.value)} placeholder="Batch No" style={{ ...inp, width: "90px", padding: "6px 7px" }} /></td>
                          {[{ f: "qty", t: "number", w: "55px" }, { f: "mrp", t: "number", w: "65px" }, { f: "rate", t: "number", w: "65px" }].map(f => (
                            <td key={f.f} style={{ padding: "4px" }}><input type={f.t} value={si[f.f] || ""} onChange={e => updateSalesItem(idx, f.f, e.target.value)} style={{ ...inp, width: f.w, padding: "6px 7px" }} /></td>
                          ))}
                          <td style={{ padding: "4px" }}><select value={si.gst || "0"} onChange={e => updateSalesItem(idx, "gst", e.target.value)} style={{ ...inp, width: "60px", padding: "6px 5px" }}>{GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}</select></td>
                          <td style={{ padding: "4px" }}><input type="number" value={si.disc || "0"} onChange={e => updateSalesItem(idx, "disc", e.target.value)} style={{ ...inp, width: "55px", padding: "6px 7px" }} /></td>
                          <td style={{ padding: "6px 8px", fontWeight: "700", color: "#3b82f6", whiteSpace: "nowrap" }}>₹{fmt(si.amount || 0)}</td>
                          <td style={{ padding: "4px" }}><button onClick={() => removeSalesItem(idx)} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "5px", padding: "5px 7px", cursor: "pointer" }}><X size={12} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Totals - PDF style */}
                {(() => {
                  const gross = salesItems.reduce((s, si) => s + num(si.amount || 0), 0);
                  const lessDisc = gross * num(salesForm.discount) / 100;
                  const net = gross - lessDisc;
                  const sgst = salesItems.reduce((s, si) => { const b = num(si.rate) * int(si.qty) * (1 - num(si.disc) / 100); return s + b * num(si.gst) / 200; }, 0);
                  const cgst = sgst;
                  return (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px", minWidth: "270px", fontSize: "12px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "3px 16px" }}>
                          <span style={{ color: "#64748b" }}>SGST:</span><span style={{ textAlign: "right" }}>₹{fmt(sgst)}</span>
                          <span style={{ color: "#64748b" }}>CGST:</span><span style={{ textAlign: "right" }}>₹{fmt(cgst)}</span>
                          <span style={{ fontWeight: "600" }}>Gross Amount:</span><span style={{ textAlign: "right", fontWeight: "600" }}>₹{fmt(gross)}</span>
                          <span style={{ color: "#495057" }}>Half Scheme:</span><span style={{ textAlign: "right" }}><input type="number" value={salesForm.halfScheme || "0"} onChange={e => setSalesForm({ ...salesForm, halfScheme: e.target.value })} style={{ ...inp, width: "80px", padding: "2px 6px", fontSize: "11px" }} /></span>
                          <span style={{ color: "#495057" }}>Oct on Free:</span><span style={{ textAlign: "right" }}><input type="number" value={salesForm.octOnFree || "0"} onChange={e => setSalesForm({ ...salesForm, octOnFree: e.target.value })} style={{ ...inp, width: "80px", padding: "2px 6px", fontSize: "11px" }} /></span>
                          <span style={{ color: "#495057" }}>Other +/-:</span><span style={{ textAlign: "right" }}><input type="number" value={salesForm.otherAdj || "0"} onChange={e => setSalesForm({ ...salesForm, otherAdj: e.target.value })} style={{ ...inp, width: "80px", padding: "2px 6px", fontSize: "11px" }} /></span>
                          <span style={{ color: "#ef4444" }}>Less Disc ({salesForm.discount || 0}%):</span><span style={{ textAlign: "right", color: "#ef4444" }}>-₹{fmt(lessDisc)}</span>
                          <span style={{ color: "#495057" }}>Cr Note:</span><span style={{ textAlign: "right" }}><input type="number" value={salesForm.crNote || "0"} onChange={e => setSalesForm({ ...salesForm, crNote: e.target.value })} style={{ ...inp, width: "80px", padding: "2px 6px", fontSize: "11px" }} /></span>
                          <span style={{ color: "#495057" }}>TCS Value:</span><span style={{ textAlign: "right" }}><input type="number" value={salesForm.tcsValue || "0"} onChange={e => setSalesForm({ ...salesForm, tcsValue: e.target.value })} style={{ ...inp, width: "80px", padding: "2px 6px", fontSize: "11px" }} /></span>
                          <span style={{ fontWeight: "800", fontSize: "14px", borderTop: "1px solid var(--color-border)", paddingTop: "6px" }}>NET:</span>
                          <span style={{ textAlign: "right", fontWeight: "800", fontSize: "14px", color: "var(--color-primary)", borderTop: "1px solid var(--color-border)", paddingTop: "6px" }}>₹{fmt(net - num(salesForm.crNote) + num(salesForm.otherAdj) + num(salesForm.tcsValue))}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={addSalesItem} style={{ ...btn("var(--color-primary)"), fontSize: "12px" }}><Plus size={13} />Add Row</button>
                  <button onClick={() => { setScannerTarget("sales"); setShowCameraScanner(true); }}
                    style={{ ...btn("var(--color-primary)"), fontSize: "12px" }}>📷 Scan — Sales</button>
                  <button onClick={handleSaveSales} style={{ ...btn(isReturn ? "#ef4444" : "#16a34a") }}><CheckCircle size={14} />{isReturn ? "Save Return" : "Save & Print"}</button>
                  <button onClick={() => setShowSalesForm(false)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)") }}><X size={13} />Cancel</button>
                </div>
              </div>
            )}

            {/* Sales Bills List */}
            {salesBills.length === 0 && !showSalesForm ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}><div style={{ fontSize: "44px" }}>🧾</div><p>No sales bills found</p></div>
            ) : [...salesBills].reverse().filter(bill => {
              const q = salesBillSearch.toLowerCase();
              return !q || (bill.billNo || "").toLowerCase().includes(q) || (bill.patientName || "").toLowerCase().includes(q) || (bill.mobile || "").includes(q);
            }).map(bill => (
              <div key={bill.id} style={{ background: "white", borderRadius: "5px", marginBottom: "10px", border: `1px solid ${bill.isReturn ? "#fecaca" : "#e2e8f0"}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpandedSale(expandedSale === bill.id ? null : bill.id)}>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "13px" }}>Bill #{bill.billNo} {bill.isReturn && <span style={{ color: "#ef4444", fontSize: "11px" }}>(RETURN)</span>}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{bill.patientName || "—"}{bill.patientArea ? ` (${bill.patientArea})` : ""}{bill.doctorName ? ` · Dr. ${bill.doctorName}` : ""}{bill.salesMan ? ` · ${bill.salesMan}` : ""} · {bill.mobile || "—"} · {bill.paymentMode?.toUpperCase()} · {new Date(bill.date).toLocaleDateString("en-IN")}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "800", fontSize: "14px", color: bill.isReturn ? "#ef4444" : "#1e293b" }}>{bill.isReturn ? "-" : ""}₹{fmt(Math.abs(num(bill.netAmount)))}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handlePrintSalesBill(bill); }} style={{ background: "#f1f5f9", border: "none", padding: "5px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }} title="Print">🖨️</button>
                    <button onClick={e => { e.stopPropagation(); handleWhatsAppBill(bill); }} style={{ background: "#dcfce7", border: "none", padding: "5px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }} title="WhatsApp Bill">💬</button>
                    <button onClick={e => { e.stopPropagation(); handleDeleteSalesBill(bill); }} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", fontSize: "12px" }} title="Delete">🗑️</button>
                    {expandedSale === bill.id ? <ChevronUp size={15} color="#64748b" /> : <ChevronDown size={15} color="#64748b" />}
                  </div>
                </div>
                {expandedSale === bill.id && (
                  <div style={{ borderTop: "1px solid #f1f5f9", padding: "12px 14px", background: "#fafafa", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "500px" }}>
                      <thead><tr style={{ background: "#f1f5f9" }}>{["Item", "Batch", "Qty", "Rate", "GST", "Amount"].map(h => <th key={h} style={{ padding: "6px 8px", textAlign: ["Qty", "Rate", "GST", "Amount"].includes(h) ? "right" : "left", fontWeight: "600", color: "var(--color-text-dark)", fontSize: "12px", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(bill.items || []).filter(si => si.itemId).map((si, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                            <td style={{ padding: "6px 8px", fontWeight: "600" }}>{si.itemName || "—"}</td>
                            <td style={{ padding: "6px 8px" }}>{si.batchNo || "—"}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>{si.qty}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>₹{fmt(si.rate)}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>{si.gst || 0}%</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "700", color: "#3b82f6" }}>₹{fmt(si.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr><td colSpan="5" style={{ padding: "6px 8px", textAlign: "right", fontWeight: "600" }}>Gross:</td><td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "700" }}>₹{fmt(Math.abs(num(bill.grossAmount)))}</td></tr>
                        {num(bill.lessDisc) > 0 && <tr><td colSpan="5" style={{ padding: "4px 8px", textAlign: "right", color: "#ef4444" }}>Less Disc:</td><td style={{ padding: "4px 8px", textAlign: "right", color: "#ef4444" }}>-₹{fmt(Math.abs(num(bill.lessDisc)))}</td></tr>}
                        <tr><td colSpan="5" style={{ padding: "8px", textAlign: "right", fontWeight: "800", fontSize: "14px" }}>NET:</td><td style={{ padding: "8px", textAlign: "right", fontWeight: "800", fontSize: "14px", color: "#16a34a" }}>₹{fmt(Math.abs(num(bill.netAmount)))}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* ══════════════════════════════════════════
            OWNER: PAYMENTS
        ══════════════════════════════════════════ */}
        {isOwner && activeSection === "payments" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>💳 Payment Receipts ({payments.length})</h2>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
                  <input
                    placeholder="Search Party Name..."
                    value={paymentSearch}
                    onChange={e => setPaymentSearch(e.target.value)}
                    style={{ ...inp, width: "220px", paddingLeft: "30px", borderRadius: "20px", background: "#f8fafc" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={() => openPaymentForm("payment")} style={{ ...btn() }}><Plus size={14} />Payment</button>
                <button onClick={() => openPaymentForm("receipt")} style={{ ...btn("var(--color-primary)") }}><Plus size={14} />Receipt</button>
                <button onClick={() => setShowKhataForm(true)} style={{ ...btn("var(--color-primary)") }}><Plus size={14} />📒 Khata Entry</button>
                <button onClick={() => setShowAdvanceForm(true)} style={{ ...btn("var(--color-primary)") }}><Plus size={14} />💰 Advance</button>
              </div>
            </div>
            {/* Sub tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "14px", background: "#f1f5f9", padding: "4px", borderRadius: "8px", flexWrap: "wrap" }}>
              {[{ id: "payments", l: "💳 Payments/Receipts" }, { id: "khata", l: "📒 Khata/Udhar" }, { id: "advance", l: "💰 Advance Deposit" }].map(t => (
                <button key={t.id} onClick={() => setOwnerSubTab(t.id || "")} style={{ ...btn(ownerSubTab === t.id ? "var(--color-primary)" : "transparent", ownerSubTab === t.id ? "white" : "#64748b"), fontSize: "12px", padding: "6px 14px", border: "none" }}>{t.l}</button>
              ))}
            </div>

            {/* KHATA FORM */}
            {showKhataForm && (
              <div style={{ background: "white", borderRadius: "8px", padding: "20px", marginBottom: "16px", border: "2px solid #fde68a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#92400e" }}>📒 New Khata / Due Entry</h3>
                  <button onClick={() => setShowKhataForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "10px", marginBottom: "12px" }}>
                  <div><label style={lbl}>Customer Name *</label><input value={khataForm.customerName || ""} onChange={e => setKhataForm({ ...khataForm, customerName: e.target.value.toUpperCase() })} placeholder="Name" style={inp} /></div>
                  <div><label style={lbl}>Phone</label><input value={khataForm.customerPhone || ""} onChange={e => setKhataForm({ ...khataForm, customerPhone: e.target.value })} placeholder="Mobile" style={inp} type="tel" /></div>
                  <div><label style={lbl}>Amount *</label><input type="number" value={khataForm.amount || ""} onChange={e => setKhataForm({ ...khataForm, amount: e.target.value })} placeholder="₹" style={inp} /></div>
                  <div><label style={lbl}>Date</label><input type="date" value={khataForm.date || today()} onChange={e => setKhataForm({ ...khataForm, date: e.target.value })} style={inp} /></div>
                  <div style={{ gridColumn: "span 2" }}><label style={lbl}>Note</label><input value={khataForm.note || ""} onChange={e => setKhataForm({ ...khataForm, note: e.target.value })} placeholder="Medicine details / reason" style={inp} /></div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleSaveKhata(khataForm)} style={{ ...btn("var(--color-primary)", "#1a1a1a") }}><CheckCircle size={13} />Save Khata</button>
                  <button onClick={() => setShowKhataForm(false)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)") }}><X size={13} />Cancel</button>
                </div>
              </div>
            )}

            {/* ADVANCE FORM */}
            {showAdvanceForm && (
              <div style={{ background: "white", borderRadius: "8px", padding: "20px", marginBottom: "16px", border: "2px solid #ddd6fe" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#5b21b6" }}>💰 New Advance Deposit</h3>
                  <button onClick={() => setShowAdvanceForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "10px", marginBottom: "12px" }}>
                  <div><label style={lbl}>Customer Name *</label><input value={advanceForm.customerName || ""} onChange={e => setAdvanceForm({ ...advanceForm, customerName: e.target.value.toUpperCase() })} placeholder="Name" style={inp} /></div>
                  <div><label style={lbl}>Phone</label><input value={advanceForm.customerPhone || ""} onChange={e => setAdvanceForm({ ...advanceForm, customerPhone: e.target.value })} placeholder="Mobile" style={inp} type="tel" /></div>
                  <div><label style={lbl}>Amount *</label><input type="number" value={advanceForm.amount || ""} onChange={e => setAdvanceForm({ ...advanceForm, amount: e.target.value })} placeholder="₹" style={inp} /></div>
                  <div><label style={lbl}>Note</label><input value={advanceForm.note || ""} onChange={e => setAdvanceForm({ ...advanceForm, note: e.target.value })} placeholder="Reason" style={inp} /></div>
                </div>
                <button onClick={handleSaveAdvance} style={{ ...btn("var(--color-primary)") }}><CheckCircle size={13} />Save Advance</button>
              </div>
            )}

            {/* KHATA LIST */}
            {(!ownerSubTab || ownerSubTab === "khata") && ownerSubTab === "khata" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#92400e" }}>₹{fmt(khataEntries.filter(e => !e.cleared).reduce((s, e) => s + num(e.amount) - num(e.paidAmount), 0), 0)}</div>
                    <div style={{ fontSize: "11px", color: "#78716c" }}>Total Pending Dues</div>
                  </div>
                  <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#15803d" }}>{khataEntries.filter(e => e.cleared).length}</div>
                    <div style={{ fontSize: "11px", color: "#78716c" }}>Cleared Entries</div>
                  </div>
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#dc2626" }}>{khataEntries.filter(e => !e.cleared).length}</div>
                    <div style={{ fontSize: "11px", color: "#78716c" }}>Pending Entries</div>
                  </div>
                </div>
                {khataEntries.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>📒 No khata entries</div> :
                  [...khataEntries].reverse().map(entry => (
                    <div key={entry.id} style={{ background: "white", borderRadius: "8px", border: `1px solid ${entry.cleared ? "#86efac" : "#fde68a"}`, padding: "14px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "14px" }}>{entry.customerName} {entry.cleared && <span style={{ background: "#dcfce7", color: "#15803d", fontSize: "10px", padding: "2px 6px", borderRadius: "8px", marginLeft: "6px" }}>✓ Cleared</span>}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{entry.date} {entry.customerPhone && `· 📞${entry.customerPhone}`} {entry.note && `· ${entry.note}`}</div>
                        <div style={{ fontSize: "12px", marginTop: "4px" }}>Pending: <strong style={{ color: "#dc2626" }}>₹{fmt(num(entry.amount) - num(entry.paidAmount))}</strong> / Total: ₹{fmt(entry.amount)}</div>
                      </div>
                      {!entry.cleared && (
                        showKhataCollect === entry.id ? (
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <input type="number" value={khataCollectAmt} onChange={e => setKhataCollectAmt(e.target.value)} placeholder="₹ Amount" style={{ ...inp, width: "100px", padding: "5px 8px" }} />
                            <button onClick={() => handleCollectKhataPayment(entry.id, khataCollectAmt)} style={{ ...btn("#16a34a"), fontSize: "11px", padding: "5px 10px" }}>✓ Save</button>
                            <button onClick={() => { setShowKhataCollect(null); setKhataCollectAmt(""); }} style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "11px", padding: "5px 8px" }}><X size={12} /></button>
                          </div>
                        ) : (
                          <button onClick={() => setShowKhataCollect(entry.id)} style={{ ...btn("var(--color-primary)", "#1a1a1a"), fontSize: "12px" }}>💰 Collect</button>
                        )
                      )}
                      <button onClick={() => handleDeleteKhataEntry(entry.id)} style={{ ...btn("#fef2f2", "#ef4444"), border: "1px solid #fecaca", fontSize: "11px", padding: "5px 8px" }} title="Delete Entry"><Trash2 size={12} /></button>
                    </div>
                  ))
                }
              </div>
            )}

            {/* ADVANCE LIST */}
            {ownerSubTab === "advance" && (
              <div>
                {advanceDeposits.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>💰 No advance deposits</div> :
                  advanceDeposits.map(a => (
                    <div key={a.id} style={{ background: "white", borderRadius: "8px", border: "1px solid #ddd6fe", padding: "14px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "700" }}>{a.customerName}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{new Date(a.createdAt).toLocaleDateString("en-IN")} {a.note && `· ${a.note}`}</div>
                        <div style={{ fontSize: "12px", marginTop: "3px" }}>Balance: <strong style={{ color: "#7c3aed" }}>₹{fmt(num(a.amount) - num(a.usedAmount))}</strong> / Deposited: ₹{fmt(a.amount)}</div>
                      </div>
                      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{a.customerPhone}</div>
                        <button onClick={() => handleDeleteAdvanceDeposit(a.id)} style={{ ...btn("#fef2f2", "#ef4444"), border: "1px solid #fecaca", fontSize: "11px", padding: "4px 8px" }} title="Delete Advance"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}


            {/* Payment Form */}
            {showPaymentForm && (
              <div style={{ background: "white", borderRadius: "6px", padding: "20px", marginBottom: "16px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                  <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "var(--color-text-dark)" }}>{paymentForm.type === "payment" ? "💸 Payment Entry" : "💰 Receipt Entry"}</h3>
                  <button onClick={() => setShowPaymentForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "10px", marginBottom: "14px" }}>
                  <div><label style={lbl}>Date</label><input type="date" value={paymentForm.date || today()} onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} style={inp} /></div>
                  <div>
                    <label style={lbl}>Account / Party Name *</label>
                    <input list="acct-list" value={paymentForm.accountName || ""} onChange={e => setPaymentForm({ ...paymentForm, accountName: e.target.value })} placeholder="Name" style={inp} />
                    <datalist id="acct-list">{suppliers.map(s => <option key={s.id} value={s.name} />)}</datalist>
                  </div>
                  <div><label style={lbl}>Amount *</label><input type="number" value={paymentForm.amount || ""} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="₹ Amount" style={inp} /></div>
                  <div><label style={lbl}>Payment Mode</label><select value={paymentForm.mode || "cash"} onChange={e => setPaymentForm({ ...paymentForm, mode: e.target.value })} style={inp}><option value="cash">Cash</option><option value="cheque">Cheque</option><option value="neft">NEFT/UPI</option></select></div>
                  {(paymentForm.mode === "cheque" || paymentForm.mode === "neft") && <>
                    <div><label style={lbl}>Bank Name</label><input value={paymentForm.bankName || ""} onChange={e => setPaymentForm({ ...paymentForm, bankName: e.target.value })} placeholder="Bank" style={inp} /></div>
                    <div><label style={lbl}>Cheque / Ref No</label><input value={paymentForm.chequeNo || ""} onChange={e => setPaymentForm({ ...paymentForm, chequeNo: e.target.value })} placeholder="No" style={inp} /></div>
                  </>}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleSavePayment} style={{ ...btn("var(--color-primary)") }}><CheckCircle size={13} />Save</button>
                  <button onClick={() => setShowPaymentForm(false)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)") }}><X size={13} />Cancel</button>
                </div>
              </div>
            )}

            {payments.length === 0 && !showPaymentForm ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}><div style={{ fontSize: "44px" }}>💳</div><p>No payment entries found</p></div>
            ) : (
              <>
                {/* Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "16px" }}>
                  {[
                    { label: "Total Payments", val: "₹" + fmt(payments.filter(p => p.type === "payment").reduce((s, p) => s + num(p.amount), 0), 0), color: "#ef4444", bg: "#fef2f2" },
                    { label: "Total Receipts", val: "₹" + fmt(payments.filter(p => p.type === "receipt").reduce((s, p) => s + num(p.amount), 0), 0), color: "#16a34a", bg: "#f0fdf4" },
                    { label: "Entries", val: payments.length, color: "#3b82f6", bg: "#eff6ff" },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: "5px", padding: "12px 14px" }}>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "white", borderRadius: "6px", border: "1px solid var(--color-border)", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead><tr style={{ background: "#f1f5f9" }}>{["Vch#", "Date", "Type", "Party Name", "Mode", "Cheque/Ref", "Amount", "Actions"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: ["Amount", "Actions"].includes(h) ? "right" : "left", fontWeight: "600", color: "var(--color-text-dark)", fontSize: "12px", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {[...payments].reverse().filter(p => {
                        const q = paymentSearch.toLowerCase();
                        return !q || (p.accountName || "").toLowerCase().includes(q) || (p.vchNo || "").toString().includes(q);
                      }).map(p => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #e9ecef" }}>
                          <td style={{ padding: "10px 12px", color: "#64748b" }}>#{p.vchNo}</td>
                          <td style={{ padding: "10px 12px" }}>{p.date}</td>
                          <td style={{ padding: "10px 12px" }}><span style={{ background: p.type === "payment" ? "#fef2f2" : "#f0fdf4", color: p.type === "payment" ? "#dc2626" : "#16a34a", padding: "2px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "700" }}>{p.type === "payment" ? "Payment" : "Receipt"}</span></td>
                          <td style={{ padding: "10px 12px", fontWeight: "600" }}>{p.accountName}</td>
                          <td style={{ padding: "10px 12px", textTransform: "uppercase", fontSize: "12px" }}>{p.mode}</td>
                          <td style={{ padding: "10px 12px", color: "#64748b", fontSize: "12px" }}>{p.chequeNo || p.bankName || "—"}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "800", color: p.type === "payment" ? "#ef4444" : "#16a34a" }}>₹{fmt(p.amount)}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right" }}><button onClick={() => handleDeletePayment(p.id)} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "6px", padding: "4px 8px", cursor: "pointer" }} title="Delete Payment"><Trash2 size={12} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════
            OWNER: REPORTS & ALERTS
        ══════════════════════════════════════════ */}
        {isOwner && activeSection === "reports" && (() => {
          const { filtered: fOrders, revenue, returns, purchaseTotal, profit } = getSalesReport();
          const expiredItems = items.filter(i => isExpired(i.expiryDate));
          const expiringItems = items.filter(i => isExpiringSoon(i.expiryDate) && !isExpired(i.expiryDate));
          const lowStockItems = items.filter(i => i.stock > 0 && i.stock <= (i.minimum || 5));
          return (
            <>
              {/* Report Sub-Tabs */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>📊 Reports</h2>
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
                    <input
                      placeholder="Search in Report..."
                      value={reportSearch}
                      onChange={e => setReportSearch(e.target.value)}
                      style={{ ...inp, width: "220px", paddingLeft: "30px", borderRadius: "20px", background: "#f8fafc" }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {[{ id: "today", l: "Today" }, { id: "week", l: "7 Days" }, { id: "month", l: "Month" }, { id: "all", l: "All" }].map(p => (
                    <button key={p.id} onClick={() => setReportPeriod(p.id)} style={{ ...btn(reportPeriod === p.id ? "#3b82f6" : "#f1f5f9", reportPeriod === p.id ? "white" : "#64748b"), fontSize: "11px", padding: "5px 10px" }}>{p.l}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "16px", background: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
                {[
                  { id: "summary", l: "📊 Summary" },
                  { id: "sales_reg", l: "🧾 Sales Register" },
                  { id: "purchase_reg", l: "📦 Purchase Register" },
                  { id: "stock", l: "📋 Stock Report" },
                  { id: "item_wise", l: "💊 Item Wise" },
                  { id: "doctor_wise", l: "🩺 Doctor Wise" },
                  { id: "daily", l: "📅 Daily Summary" },
                  { id: "gstr1", l: "📑 GSTR-1" },
                  { id: "gstr3b", l: "📑 GSTR-3B" },
                  { id: "best_sellers", l: "🏆 Best Sellers" },
                  { id: "dead_stock", l: "💀 Dead Stock" },
                  { id: "growth", l: "📈 Growth Chart" },
                  { id: "patient_alerts", l: "⏰ Patient Alerts" },
                  { id: "prescriptions_owner", l: "📋 Prescriptions" },
                ].map(t => (
                  <button key={t.id} onClick={() => setReportSubTab(t.id)} style={{ padding: "7px 12px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "11px", background: reportSubTab === t.id ? "white" : "transparent", color: reportSubTab === t.id ? "var(--color-primary)" : "#64748b", boxShadow: reportSubTab === t.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>{t.l}</button>
                ))}
              </div>


              {/* ─── GSTR-1 ─── */}
              {reportSubTab === "gstr1" && (() => {
                const months = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
                const now = new Date();
                const [gm, setGm] = React.useState(String(now.getMonth()));
                const [gy, setGy] = React.useState(String(now.getFullYear()));
                const data = getGSTR1(gm, gy);
                return (
                  <div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
                      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800" }}>📑 GSTR-1 — HSN Wise Sales Summary</h3>
                      <select value={gm} onChange={e => setGm(e.target.value)} style={{ ...inp, width: "120px" }}>
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => <option key={i} value={String(i)}>{m}</option>)}
                      </select>
                      <select value={gy} onChange={e => setGy(e.target.value)} style={{ ...inp, width: "90px" }}>
                        {[2023, 2024, 2025, 2026].map(y => <option key={y} value={String(y)}>{y}</option>)}
                      </select>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Bills: {data.billCount}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "14px" }}>
                      {[{ l: "Total Sales", v: "₹" + fmt(data.totalSales), c: "var(--color-primary)" }, { l: "Total Tax", v: "₹" + fmt(data.totalTax), c: "#dc2626" }, { l: "Taxable Value", v: "₹" + fmt(data.totalSales - data.totalTax), c: "#16a34a" }].map(s => (
                        <div key={s.l} style={{ background: "white", borderRadius: "8px", padding: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{s.l}</div>
                          <div style={{ fontSize: "16px", fontWeight: "800", color: s.c }}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead><tr style={{ background: "#f1f5f9", color: "var(--color-text-dark)" }}>
                          {["HSN Code", "GST %", "Qty", "Taxable Amt", "CGST", "SGST", "Total"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: "700" }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {data.rows.length === 0 ? <tr><td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>No sales data for this period</td></tr> :
                            data.rows.map((r, i) => (
                              <tr key={r.hsn} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                                <td style={{ padding: "8px 10px", fontWeight: "700" }}>{r.hsn}</td>
                                <td style={{ padding: "8px 10px", textAlign: "center" }}>{r.gst}%</td>
                                <td style={{ padding: "8px 10px", textAlign: "center" }}>{r.qty}</td>
                                <td style={{ padding: "8px 10px", fontWeight: "700" }}>₹{fmt(r.taxable)}</td>
                                <td style={{ padding: "8px 10px", color: "#dc2626" }}>₹{fmt(r.cgst)}</td>
                                <td style={{ padding: "8px 10px", color: "#dc2626" }}>₹{fmt(r.sgst)}</td>
                                <td style={{ padding: "8px 10px", fontWeight: "800", color: "var(--color-text-dark)" }}>₹{fmt(r.total)}</td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot><tr style={{ background: "#f0f4ff", fontWeight: "800" }}>
                          <td colSpan={2} style={{ padding: "8px 10px" }}>Total</td>
                          <td style={{ padding: "8px 10px", textAlign: "center" }}>{data.rows.reduce((s, r) => s + r.qty, 0)}</td>
                          <td style={{ padding: "8px 10px" }}>₹{fmt(data.rows.reduce((s, r) => s + r.taxable, 0))}</td>
                          <td style={{ padding: "8px 10px", color: "#dc2626" }}>₹{fmt(data.rows.reduce((s, r) => s + r.cgst, 0))}</td>
                          <td style={{ padding: "8px 10px", color: "#dc2626" }}>₹{fmt(data.rows.reduce((s, r) => s + r.sgst, 0))}</td>
                          <td style={{ padding: "8px 10px", color: "var(--color-text-dark)" }}>₹{fmt(data.totalSales)}</td>
                        </tr></tfoot>
                      </table>
                    </div>
                    <div style={{ marginTop: "10px", fontSize: "11px", color: "#64748b" }}>* CGST & SGST are 50% each of total GST. For interstate supply use IGST = full GST amount.</div>
                  </div>
                );
              })()}

              {/* ─── GSTR-3B ─── */}
              {reportSubTab === "gstr3b" && (() => {
                const now = new Date();
                const [gm, setGm] = React.useState(String(now.getMonth()));
                const [gy, setGy] = React.useState(String(now.getFullYear()));
                const data = getGSTR3B(gm, gy);
                const netPayable = Math.max(0, data.outputTax - data.inputTax);
                return (
                  <div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
                      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800" }}>📑 GSTR-3B — Tax Summary</h3>
                      <select value={gm} onChange={e => setGm(e.target.value)} style={{ ...inp, width: "120px" }}>
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => <option key={i} value={String(i)}>{m}</option>)}
                      </select>
                      <select value={gy} onChange={e => setGy(e.target.value)} style={{ ...inp, width: "90px" }}>
                        {[2023, 2024, 2025, 2026].map(y => <option key={y} value={String(y)}>{y}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px", marginBottom: "16px" }}>
                      <div style={{ background: "#fef2f2", borderRadius: "10px", padding: "16px", border: "1px solid #fecaca" }}>
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: "700" }}>3.1 — Outward Supplies (Sales)</div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span style={{ fontSize: "12px" }}>Total Sales:</span><span style={{ fontWeight: "800", color: "var(--color-text-dark)" }}>₹{fmt(data.totalSales)}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #fecaca", paddingTop: "6px", marginTop: "4px" }}><span style={{ fontSize: "12px", fontWeight: "700" }}>Output Tax:</span><span style={{ fontWeight: "900", color: "#dc2626", fontSize: "16px" }}>₹{fmt(data.outputTax)}</span></div>
                      </div>
                      <div style={{ background: "#f0fdf4", borderRadius: "10px", padding: "16px", border: "1px solid #bbf7d0" }}>
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: "700" }}>4 — Input Tax Credit (Purchase)</div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span style={{ fontSize: "12px" }}>Total Purchase:</span><span style={{ fontWeight: "800", color: "var(--color-text-dark)" }}>₹{fmt(data.totalPurchase)}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #bbf7d0", paddingTop: "6px", marginTop: "4px" }}><span style={{ fontSize: "12px", fontWeight: "700" }}>Input Tax (ITC):</span><span style={{ fontWeight: "900", color: "#16a34a", fontSize: "16px" }}>₹{fmt(data.inputTax)}</span></div>
                      </div>
                    </div>
                    <div style={{ background: netPayable > 0 ? "#fef2f2" : "#f0fdf4", borderRadius: "12px", padding: "18px", border: "2px solid " + (netPayable > 0 ? "#fecaca" : "#bbf7d0"), textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "6px" }}>Net Tax Payable (Output - ITC)</div>
                      <div style={{ fontSize: "28px", fontWeight: "900", color: netPayable > 0 ? "#dc2626" : "#16a34a" }}>₹{fmt(netPayable)}</div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{netPayable > 0 ? "Payable to Government" : "Sufficient ITC — nothing payable"}</div>
                      {netPayable > 0 && <div style={{ marginTop: "10px", fontSize: "11px", color: "#dc2626", fontWeight: "700" }}>= CGST ₹{fmt(netPayable / 2)} + SGST ₹{fmt(netPayable / 2)}</div>}
                    </div>
                    <div style={{ marginTop: "10px", fontSize: "11px", color: "#64748b" }}>* Estimated values based on app data. Verify with CA before final filing.</div>
                  </div>
                );
              })()}

              {/* BEST SELLERS */}
              {reportSubTab === "best_sellers" && (() => {
                const bs = getBestSellers(reportPeriod === "all" ? "all" : reportPeriod);
                return (
                  <div>
                    <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: "800" }}>🏆 Best Selling Medicines</h3>
                    {bs.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No sales data</div> :
                      bs.map((item, i) => (
                        <div key={i} style={{ background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "12px 16px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: i === 0 ? "#fef9c3" : i === 1 ? "#f1f5f9" : i === 2 ? "#fff7ed" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "900", color: i === 0 ? "#854d0e" : i === 1 ? "#475569" : i === 2 ? "#92400e" : "#64748b", flexShrink: 0 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</div>
                          <div style={{ flex: 1 }}><div style={{ fontWeight: "700", fontSize: "13px" }}>{item.name}</div><div style={{ fontSize: "11px", color: "#64748b" }}>Revenue: ₹{fmt(item.revenue, 0)}</div></div>
                          <div style={{ textAlign: "right" }}><div style={{ fontWeight: "800", fontSize: "16px", color: "#1e293b" }}>{item.qty}</div><div style={{ fontSize: "10px", color: "#64748b" }}>units sold</div></div>
                          <div style={{ width: "80px", background: "#f1f5f9", borderRadius: "4px", height: "8px", overflow: "hidden" }}><div style={{ height: "100%", background: "linear-gradient(90deg,#3b82f6,#1d4ed8)", width: `${Math.min(100, (item.qty / (bs[0]?.qty || 1)) * 100)}%` }} /></div>
                        </div>
                      ))
                    }
                  </div>
                );
              })()}

              {/* DEAD STOCK */}
              {reportSubTab === "dead_stock" && (() => {
                const ds = getDeadStock(90);
                const totalVal = ds.reduce((s, i) => s + num(i.stockValue), 0);
                return (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800" }}>💀 Dead Stock (90+ days not sold)</h3>
                      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", fontWeight: "700", color: "#dc2626" }}>💸 ₹{fmt(totalVal, 0)} blocked</div>
                    </div>
                    {ds.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>🎉 No dead stock!</div> :
                      ds.map(item => (
                        <div key={item.id} style={{ background: "white", borderRadius: "8px", border: "1px solid #fecaca", padding: "12px 16px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: "700", fontSize: "13px" }}>{item.name}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{item.company} · {item.division} · Rack: {item.location || "—"}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: "800", color: "#dc2626" }}>₹{fmt(item.stockValue, 0)}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{item.stock} {item.unit || "units"}</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                );
              })()}

              {/* GROWTH CHART */}
              {reportSubTab === "growth" && (() => {
                const months = getMonthlyGrowth();
                const maxVal = Math.max(...months.map(m => m.sales), 1);
                return (
                  <div>
                    <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: "800" }}>📈 Month-on-Month Growth (Last 6 Months)</h3>
                    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "160px", padding: "0 4px" }}>
                        {months.map((m, i) => (
                          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%", justifyContent: "flex-end" }}>
                            <div style={{ fontSize: "10px", fontWeight: "700", color: "#16a34a" }}>₹{m.sales >= 1000 ? `${(m.sales / 1000).toFixed(1)}k` : fmt(m.sales, 0)}</div>
                            <div style={{ width: "100%", borderRadius: "6px 6px 0 0", background: "linear-gradient(180deg,#4ade80,#16a34a)", height: `${Math.max(4, (m.sales / maxVal) * 120)}px` }} />
                            <div style={{ fontSize: "9px", color: "#64748b", textAlign: "center", transform: "rotate(-20deg)", whiteSpace: "nowrap" }}>{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "10px" }}>
                      {months.map((m, i) => (
                        <div key={i} style={{ background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "12px" }}>
                          <div style={{ fontWeight: "700", marginBottom: "6px" }}>{m.label}</div>
                          <div style={{ fontSize: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                            <span style={{ color: "#64748b" }}>Sales:</span><span style={{ fontWeight: "700", color: "#16a34a" }}>₹{fmt(m.sales, 0)}</span>
                            <span style={{ color: "#64748b" }}>Purchase:</span><span style={{ fontWeight: "700", color: "#3b82f6" }}>₹{fmt(m.purchase, 0)}</span>
                            <span style={{ color: "#64748b" }}>Profit:</span><span style={{ fontWeight: "700", color: m.profit >= 0 ? "#16a34a" : "#dc2626" }}>₹{fmt(m.profit, 0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* PATIENT ALERTS / DUE DATES */}
              {reportSubTab === "patient_alerts" && (() => {
                const alerts = getDueDateAlerts();
                const allPats = [...new Set(salesBills.filter(b => b.patientName).map(b => b.patientName))];
                return (
                  <div>
                    <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: "800" }}>⏰ Medicine Refill Alerts</h3>
                    {alerts.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>✅ No pending refill alerts</div> :
                      alerts.map((bill, i) => (
                        <div key={i} style={{ background: "white", borderRadius: "8px", border: `1px solid ${bill.daysLeft <= 2 ? "#fecaca" : "#fde68a"}`, padding: "14px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: "700", fontSize: "13px" }}>{bill.patientName}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>📞 {bill.mobile || "—"} · Bill #{bill.billNo} · {new Date(bill.date).toLocaleDateString("en-IN")}</div>
                            <div style={{ fontSize: "11px", marginTop: "4px" }}>{(bill.items || []).filter(si => si.itemName).slice(0, 2).map(si => si.itemName).join(", ")}</div>
                          </div>
                          <div style={{ textAlign: "right", display: "flex", gap: "8px", alignItems: "center" }}>
                            <div style={{ background: bill.daysLeft <= 2 ? "#fef2f2" : "#fffbeb", borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
                              <div style={{ fontWeight: "800", fontSize: "16px", color: bill.daysLeft <= 2 ? "#dc2626" : "#92400e" }}>{bill.daysLeft}d</div>
                              <div style={{ fontSize: "9px", color: "#64748b" }}>remaining</div>
                            </div>
                            {(() => { const ph = (bill.mobile || "").replace(/\D/g, ""); const msg = `Dear ${bill.patientName}, your medicines from Shiv Dhara Medical are due for refill. Please visit or call 9924237606.`; return (<a href={`https://wa.me/91${ph}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" style={{ background: "#dcfce7", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", textDecoration: "none", display: "inline-block" }} title="WhatsApp Reminder">💬</a>); })()}
                          </div>
                        </div>
                      ))
                    }
                    {/* Patient history search */}
                    <div style={{ marginTop: "20px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px" }}>
                      <h4 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: "700" }}>🔍 Patient Medicine History</h4>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                        <select style={{ ...inp, flex: 1 }} onChange={e => { setOwnerSubTab(e.target.value ? `ph_${e.target.value}` : "") }}>
                          <option value="">-- Select Patient --</option>
                          {allPats.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      {ownerSubTab?.startsWith("ph_") && (() => {
                        const pname = ownerSubTab.replace("ph_", "");
                        const hist = getPatientHistory(pname);
                        return hist.map(b => (
                          <div key={b.id} style={{ background: "#f8fafc", borderRadius: "6px", padding: "10px", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                            <div><div style={{ fontWeight: "600", fontSize: "12px" }}>Bill #{b.billNo} — {new Date(b.date).toLocaleDateString("en-IN")}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>{(b.items || []).filter(si => si.itemName).map(si => si.itemName).join(", ")}</div></div>
                            <div style={{ fontWeight: "700", color: "#16a34a" }}>₹{fmt(b.netAmount)}</div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                );
              })()}

              {/* PRESCRIPTIONS FOR OWNER */}
              {reportSubTab === "prescriptions_owner" && (
                <div>
                  <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: "800" }}>📋 Customer Prescriptions</h3>
                  {([]).length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No prescriptions submitted</div> :
                    [...([])].reverse().map(p => (
                      <div key={p.id} style={{ background: "white", borderRadius: "8px", border: `1px solid ${p.status === "Pending" ? "#fde68a" : p.status === "Ready" ? "#86efac" : "#e2e8f0"}`, padding: "14px", marginBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                          <div>
                            <div style={{ fontWeight: "700" }}>{p.customerName} <span style={{ background: p.status === "Pending" ? "#fffbeb" : p.status === "Ready" ? "#f0fdf4" : "#f1f5f9", color: p.status === "Pending" ? "#92400e" : p.status === "Ready" ? "#15803d" : "#475569", fontSize: "10px", padding: "2px 8px", borderRadius: "8px", marginLeft: "8px" }}>{p.status}</span></div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{new Date(p.createdAt).toLocaleDateString("en-IN")} {p.note && `· ${p.note}`}</div>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {p.status === "Pending" && <button onClick={() => (() => {})(p.id, "Ready")} style={{ ...btn("var(--color-primary)", "#1a1a1a"), fontSize: "11px", padding: "4px 10px" }}>✓ Ready</button>}
                            {p.status === "Ready" && <button onClick={() => (() => {})(p.id, "Delivered")} style={{ ...btn("#16a34a"), fontSize: "11px", padding: "4px 10px" }}>✓ Delivered</button>}
                          </div>
                        </div>
                        {p.imageData && <img src={p.imageData} alt="prescription" style={{ maxWidth: "300px", maxHeight: "200px", objectFit: "contain", borderRadius: "6px", border: "1px solid #e2e8f0" }} />}
                      </div>
                    ))
                  }
                </div>
              )}

              {reportSubTab === "summary" && (<>
                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: "12px", marginBottom: "20px" }}>
                  {[
                    { l: "Sales", val: "₹" + fmt(revenue, 0), color: "#16a34a", bg: "#f0fdf4" },
                    { l: "Purchase", val: "₹" + fmt(purchaseTotal, 0), color: "#3b82f6", bg: "#eff6ff" },
                    { l: "Returns", val: "₹" + fmt(returns, 0), color: "#ef4444", bg: "#fef2f2" },
                    { l: "Gross Profit", val: "₹" + fmt(profit, 0), color: profit >= 0 ? "#16a34a" : "#ef4444", bg: profit >= 0 ? "#f0fdf4" : "#fef2f2" },
                    { l: "Bills", val: fOrders.length, color: "#8b5cf6", bg: "#f5f3ff" },
                    { l: "Expired", val: expiredItems.length, color: "#ef4444", bg: "#fef2f2" },
                    { l: "Expiring Soon", val: expiringItems.length, color: "#fd7e14", bg: "#fff7ed" },
                    { l: "Low Stock", val: lowStockItems.length, color: "#f59e0b", bg: "#fffbeb" },
                  ].map(s => (
                    <div key={s.l} style={{ background: s.bg, borderRadius: "5px", padding: "12px 14px", border: `1px solid ${s.color}22` }}>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                {/* Expiry Alerts */}
                {expiredItems.length > 0 && (
                  <div style={{ background: "white", borderRadius: "6px", border: "1px solid #fecaca", marginBottom: "14px", overflow: "hidden" }}>
                    <div style={{ background: "#fef2f2", padding: "10px 14px", fontWeight: "700", fontSize: "13px", color: "#dc2626" }}>🚫 Expired Items ({expiredItems.length})</div>
                    {expiredItems.map(item => {
                      const dv = getDivision(item.division); return (<div key={item.id} style={{ padding: "10px 14px", borderTop: "1px solid #fee2e2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div><div style={{ fontWeight: "600", fontSize: "13px" }}>{dv.icon} {item.name}</div><div style={{ fontSize: "11px", color: "#dc2626" }}>Exp: {item.expiryDate} · Stock: {item.stock}</div></div>
                        <button onClick={() => handleDeleteItem(item.id)} style={{ ...btn("#ef4444"), fontSize: "11px", padding: "5px 9px" }}><Trash2 size={11} />Remove</button>
                      </div>);
                    })}
                  </div>
                )}
                {expiringItems.length > 0 && (
                  <div style={{ background: "white", borderRadius: "6px", border: "1px solid #fdba74", marginBottom: "14px", overflow: "hidden" }}>
                    <div style={{ background: "#fff7ed", padding: "10px 14px", fontWeight: "700", fontSize: "13px", color: "#c2410c" }}>⏰ Expiring Soon ({expiringItems.length})</div>
                    {expiringItems.map(item => {
                      const dv = getDivision(item.division); const days = Math.floor(((parseExpiry(item.expiryDate) || new Date()) - new Date()) / 86400000); return (<div key={item.id} style={{ padding: "10px 14px", borderTop: "1px solid #fed7aa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div><div style={{ fontWeight: "600", fontSize: "13px" }}>{dv.icon} {item.name}</div><div style={{ fontSize: "11px", color: "#c2410c" }}>{days} din bachya · Stock: {item.stock}</div></div>
                        <button onClick={() => { setQuickStockItem(item); setQuickQty(""); setActiveSection("inventory"); setOwnerSubTab(item.division); }} style={{ ...btn("#fd7e14"), fontSize: "11px", padding: "5px 9px" }}>+📦 Stock</button>
                      </div>);
                    })}
                  </div>
                )}
                {lowStockItems.length > 0 && (
                  <div style={{ background: "white", borderRadius: "6px", border: "1px solid #fde68a", marginBottom: "14px", overflow: "hidden" }}>
                    <div style={{ background: "#fffbeb", padding: "10px 14px", fontWeight: "700", fontSize: "13px", color: "#b45309" }}>📉 Low Stock ({lowStockItems.length})</div>
                    {lowStockItems.map(item => {
                      const dv = getDivision(item.division); return (<div key={item.id} style={{ padding: "10px 14px", borderTop: "1px solid #fef3c7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div><div style={{ fontWeight: "600", fontSize: "13px" }}>{dv.icon} {item.name}</div><div style={{ fontSize: "11px", color: "#b45309" }}>Current: {item.stock} · Min: {item.minimum || 5}</div></div>
                        <button onClick={() => { setQuickStockItem(item); setQuickQty(""); }} style={{ ...btn("var(--color-primary)"), fontSize: "11px", padding: "5px 9px" }}>+📦 Stock</button>
                      </div>);
                    })}
                  </div>
                )}
                {/* Recent Sales */}
                {fOrders.length > 0 && (
                  <div style={{ background: "white", borderRadius: "6px", padding: "16px", border: "1px solid var(--color-border)" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "700" }}>Recent Sales Bills</h4>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "380px" }}>
                        <thead><tr style={{ background: "#f1f5f9" }}>{["Bill", "Patient", "Items", "Mode", "Net Amount"].map(h => <th key={h} style={{ padding: "8px", textAlign: h === "Net Amount" ? "right" : "left", fontWeight: "600", color: "var(--color-text-dark)" }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {[...fOrders].reverse().slice(0, 15).map(b => (
                            <tr key={b.id} style={{ borderBottom: "1px solid #e9ecef" }}>
                              <td style={{ padding: "8px" }}><div style={{ fontWeight: "600" }}>#{b.billNo}</div><div style={{ fontSize: "10px", color: "#64748b" }}>{new Date(b.date).toLocaleDateString("en-IN")}</div></td>
                              <td style={{ padding: "8px" }}>{b.patientName || "—"}</td>
                              <td style={{ padding: "8px" }}>{b.items?.filter(si => si.itemId).length || 0}</td>
                              <td style={{ padding: "8px", textTransform: "uppercase", fontSize: "11px" }}>{b.paymentMode}</td>
                              <td style={{ padding: "8px", textAlign: "right", fontWeight: "700", color: "#16a34a" }}>₹{fmt(num(b.netAmount))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* Stock Statement */}
                <div style={{ background: "white", borderRadius: "6px", border: "1px solid var(--color-border)", marginBottom: "14px", overflow: "hidden" }}>
                  <div style={{ background: "#f1f5f9", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700" }}>📦 Stock Statement</h4>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <select value={stockReportComp} onChange={e => setStockReportComp(e.target.value)} style={{ ...inp, width: "auto", fontSize: "12px", padding: "5px 8px" }}>
                        <option value="">All Companies</option>
                        {[...new Set(items.map(i => i.company).filter(Boolean))].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select value={stockReportSupp} onChange={e => setStockReportSupp(e.target.value)} style={{ ...inp, width: "auto", fontSize: "12px", padding: "5px 8px" }}>
                        <option value="">All Suppliers</option>
                        {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "750px" }}>
                      <thead><tr style={{ background: "#f1f5f9" }}>{["No", "Item Name", "Loc", "Company", "Unit", "Batch", "ExpDt", "Stock", "Exp Qty", "Qty", "MRP", "P.Rate", "Amt", "ST"].map(h => <th key={h} style={{ padding: "7px 8px", textAlign: ["Stock", "Qty", "MRP", "P.Rate", "Amt"].includes(h) ? "right" : "left", fontWeight: "700", color: "#475569", fontSize: "10px", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {items.filter(i => (!stockReportComp || i.company === stockReportComp) && (!stockReportSupp || i.supplier === stockReportSupp)).map((item, idx) => {
                          const exp = isExpired(item.expiryDate), expSoon = isExpiringSoon(item.expiryDate);
                          const dv = getDivision(item.division);
                          return (
                            <tr key={item.id} style={{ borderBottom: "1px solid #e9ecef", background: exp ? "#fef2f2" : expSoon ? "#fff7ed" : "white" }}>
                              <td style={{ padding: "6px 8px", color: "#64748b", fontWeight: "600" }}>{idx + 1}</td>
                              <td style={{ padding: "6px 8px", fontWeight: "600" }}>{dv.icon} {item.name}</td>
                              <td style={{ padding: "6px 8px", color: "#64748b" }}>{item.location || "—"}</td>
                              <td style={{ padding: "6px 8px", color: "#64748b", fontSize: "11px" }}>{item.company || "—"}</td>
                              <td style={{ padding: "6px 8px" }}>{item.unit || "pcs"}</td>
                              <td style={{ padding: "6px 8px" }}>{item.batchNo || "—"}</td>
                              <td style={{ padding: "6px 8px", fontSize: "11px", color: exp ? "#ef4444" : expSoon ? "#fd7e14" : "inherit" }}>{item.expiryDate || "—"}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "700", color: item.stock <= 0 ? "#ef4444" : item.stock <= (item.minimum || 5) ? "#fd7e14" : "#16a34a" }}>{item.stock}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right" }}>{exp ? item.stock : 0}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right" }}>{item.stock}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right" }}>₹{fmt(item.mrp || item.price)}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right" }}>₹{fmt(item.pRate || 0)}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "600" }}>₹{fmt(num(item.pRate || 0) * int(item.stock))}</td>
                              <td style={{ padding: "6px 8px" }}><span style={{ background: exp ? "#fef2f2" : expSoon ? "#fff7ed" : item.stock > 0 ? "#f0fdf4" : "#f1f5f9", color: exp ? "#ef4444" : expSoon ? "#fd7e14" : item.stock > 0 ? "#16a34a" : "#64748b", padding: "1px 5px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>{exp ? "EXP" : expSoon ? "SOON" : item.stock > 0 ? "OK" : "OOS"}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot><tr>
                        <td colSpan="12" style={{ padding: "8px", textAlign: "right", fontWeight: "700", borderTop: "2px solid #e2e8f0" }}>Total Stock Value:</td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: "800", color: "#16a34a", borderTop: "2px solid #e2e8f0" }}>₹{fmt(items.filter(i => (!stockReportComp || i.company === stockReportComp)).reduce((s, i) => s + num(i.pRate || 0) * int(i.stock), 0))}</td>
                        <td style={{ borderTop: "2px solid #e2e8f0" }}></td>
                      </tr></tfoot>
                    </table>
                  </div>
                </div>
              </>)}

              {/* ─── SALES REGISTER ─── */}
              {reportSubTab === "sales_reg" && (
                <div style={{ background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "700", fontSize: "14px" }}>🧾 Sales Register ({fOrders.length} bills)</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead><tr style={{ background: "#f1f5f9", color: "var(--color-text-dark)" }}>
                        {["#", "Date", "Bill No", "Patient", "Doctor", "Items", "Payment", "Amount"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: "700" }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {[...fOrders].reverse().filter(b => {
                          const q = reportSearch.toLowerCase();
                          return !q || (b.billNo || "").toLowerCase().includes(q) || (b.patientName || "").toLowerCase().includes(q) || (b.doctorName || "").toLowerCase().includes(q);
                        }).map((b, i) => (
                          <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                            <td style={{ padding: "8px 10px", color: "#64748b" }}>{fOrders.length - i}</td>
                            <td style={{ padding: "8px 10px" }}>{new Date(b.date).toLocaleDateString("en-IN")}</td>
                            <td style={{ padding: "8px 10px", fontWeight: "600" }}>{b.billNo || "—"}</td>
                            <td style={{ padding: "8px 10px" }}>{b.patientName || "—"}</td>
                            <td style={{ padding: "8px 10px", color: "#3b82f6" }}>{b.doctorName || "—"}</td>
                            <td style={{ padding: "8px 10px" }}>{b.items?.length || 0}</td>
                            <td style={{ padding: "8px 10px", textTransform: "uppercase" }}>{b.paymentMode || "cash"}</td>
                            <td style={{ padding: "8px 10px", fontWeight: "800", color: "#16a34a" }}>₹{fmt(b.netAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr style={{ background: "#f0fdf4", fontWeight: "800" }}>
                        <td colSpan={7} style={{ padding: "8px 10px", textAlign: "right" }}>Total:</td>
                        <td style={{ padding: "8px 10px", color: "#16a34a" }}>₹{fmt(fOrders.reduce((s, b) => s + num(b.netAmount), 0))}</td>
                      </tr></tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* ─── PURCHASE REGISTER ─── */}
              {reportSubTab === "purchase_reg" && (
                <div style={{ background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "700", fontSize: "14px" }}>📦 Purchase Register ({purchaseBills.length} bills)</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead><tr style={{ background: "#f1f5f9", color: "var(--color-text-dark)" }}>
                        {["#", "Date", "Entry", "Bill No", "Supplier", "Items", "Payment", "Amount"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: "700" }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {purchaseBills.length === 0 ? <tr><td colSpan={8} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>No purchase bills</td></tr> :
                          [...purchaseBills].reverse().map((b, i) => (
                            <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                              <td style={{ padding: "8px 10px", color: "#64748b" }}>{purchaseBills.length - i}</td>
                              <td style={{ padding: "8px 10px" }}>{b.billDate || "—"}</td>
                              <td style={{ padding: "8px 10px", color: "#8b5cf6", fontWeight: "600" }}>E#{b.entryNo || "—"}</td>
                              <td style={{ padding: "8px 10px", fontWeight: "600" }}>{b.billNo || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{b.partyName || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{b.items?.length || 0}</td>
                              <td style={{ padding: "8px 10px", textTransform: "uppercase" }}>{b.paymentMode || "cash"}</td>
                              <td style={{ padding: "8px 10px", fontWeight: "800", color: "#3b82f6" }}>₹{fmt(b.total || b.finalTotal || b.totalAmount)}</td>
                            </tr>
                          ))}
                      </tbody>
                      <tfoot><tr style={{ background: "#eff6ff", fontWeight: "800" }}>
                        <td colSpan={7} style={{ padding: "8px 10px", textAlign: "right" }}>Total:</td>
                        <td style={{ padding: "8px 10px", color: "#3b82f6" }}>₹{fmt(purchaseBills.reduce((s, b) => s + num(b.total || b.finalTotal || b.totalAmount), 0))}</td>
                      </tr></tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* ─── STOCK REPORT ─── */}
              {reportSubTab === "stock" && (
                <div style={{ background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "700", fontSize: "14px" }}>📋 Stock Report ({items.length} items)</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead><tr style={{ background: "#f1f5f9", color: "var(--color-text-dark)" }}>
                        {["Item Name", "Division", "GST%", "MRP", "Rate", "Stock", "Expiry", "Status"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: "700" }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {[...items].sort((a, b) => a.name.localeCompare(b.name)).filter(item => {
                          const q = reportSearch.toLowerCase();
                          return !q || (item.name || "").toLowerCase().includes(q) || (item.company || "").toLowerCase().includes(q);
                        }).map((item, i) => {
                          const expired = isExpired(item.expiryDate);
                          const expiring = isExpiringSoon(item.expiryDate) && !expired;
                          const lowStock = item.stock > 0 && item.stock <= (item.minimum || 5);
                          return (
                            <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9", background: expired ? "#fef2f2" : expiring ? "#fff7ed" : i % 2 === 0 ? "white" : "#fafafa" }}>
                              <td style={{ padding: "8px 10px", fontWeight: "600" }}>{item.name}</td>
                              <td style={{ padding: "8px 10px" }}>{getDivision(item.division).label}</td>
                              <td style={{ padding: "8px 10px", textAlign: "center" }}>{item.gst || 0}%</td>
                              <td style={{ padding: "8px 10px" }}>₹{fmt(item.mrp)}</td>
                              <td style={{ padding: "8px 10px" }}>₹{fmt(item.price)}</td>
                              <td style={{ padding: "8px 10px", fontWeight: "800", color: item.stock <= 0 ? "#ef4444" : lowStock ? "#f59e0b" : "#16a34a" }}>{item.stock || 0}</td>
                              <td style={{ padding: "8px 10px", color: expired ? "#ef4444" : expiring ? "#f59e0b" : "#374151" }}>{item.expiryDate || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>
                                {expired && <span style={{ background: "#fef2f2", color: "#ef4444", padding: "2px 7px", borderRadius: "10px", fontSize: "10px", fontWeight: "700" }}>EXPIRED</span>}
                                {expiring && <span style={{ background: "#fff7ed", color: "#f59e0b", padding: "2px 7px", borderRadius: "10px", fontSize: "10px", fontWeight: "700" }}>EXPIRING</span>}
                                {lowStock && !expired && !expiring && <span style={{ background: "#fffbeb", color: "#d97706", padding: "2px 7px", borderRadius: "10px", fontSize: "10px", fontWeight: "700" }}>LOW</span>}
                                {!expired && !expiring && !lowStock && item.stock > 0 && <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "2px 7px", borderRadius: "10px", fontSize: "10px", fontWeight: "700" }}>OK</span>}
                                {item.stock <= 0 && <span style={{ background: "#f1f5f9", color: "#64748b", padding: "2px 7px", borderRadius: "10px", fontSize: "10px", fontWeight: "700" }}>OUT</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ─── ITEM WISE ─── */}
              {reportSubTab === "item_wise" && (() => {
                const itemSales = {};
                fOrders.forEach(b => b.items && b.items.forEach(it => {
                  if (!itemSales[it.itemName]) itemSales[it.itemName] = { name: it.itemName, qty: 0, amount: 0, bills: 0 };
                  itemSales[it.itemName].qty += int(it.qty);
                  itemSales[it.itemName].amount += num(it.amount || 0);
                  itemSales[it.itemName].bills += 1;
                }));
                const rows = Object.values(itemSales).sort((a, b) => b.amount - a.amount);
                return (
                  <div style={{ background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "700", fontSize: "14px" }}>💊 Item Wise Sale ({rows.length} items)</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead><tr style={{ background: "#f1f5f9", color: "var(--color-text-dark)" }}>
                        {["#", "Item Name", "Qty Sold", "Bills", "Amount"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: "700" }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {rows.filter(r => {
                          const q = reportSearch.toLowerCase();
                          return !q || (r.name || "").toLowerCase().includes(q);
                        }).length === 0 ? <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>No sales data</td></tr> :
                          rows.filter(r => {
                            const q = reportSearch.toLowerCase();
                            return !q || (r.name || "").toLowerCase().includes(q);
                          }).map((r, i) => (
                            <tr key={r.name} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                              <td style={{ padding: "8px 10px", color: "#64748b" }}>{i + 1}</td>
                              <td style={{ padding: "8px 10px", fontWeight: "600" }}>{r.name}</td>
                              <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "700", color: "#3b82f6" }}>{r.qty}</td>
                              <td style={{ padding: "8px 10px", textAlign: "center" }}>{r.bills}</td>
                              <td style={{ padding: "8px 10px", fontWeight: "800", color: "#16a34a" }}>₹{fmt(r.amount)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* ─── DOCTOR WISE ─── */}
              {reportSubTab === "doctor_wise" && (() => {
                const docSales = {};
                fOrders.forEach(b => {
                  const doc = b.doctorName || "No Doctor";
                  if (!docSales[doc]) docSales[doc] = { name: doc, bills: 0, amount: 0, patients: new Set() };
                  docSales[doc].bills += 1;
                  docSales[doc].amount += num(b.netAmount);
                  if (b.patientName) docSales[doc].patients.add(b.patientName);
                });
                const rows = Object.values(docSales).sort((a, b) => b.amount - a.amount);
                return (
                  <div style={{ background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "700", fontSize: "14px" }}>👨‍⚕️ Doctor Wise Sales ({rows.length} doctors)</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead><tr style={{ background: "#f1f5f9", color: "var(--color-text-dark)" }}>
                        {["#", "Doctor Name", "Bills", "Patients", "Amount"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: "700" }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {rows.length === 0 ? <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>No data</td></tr> :
                          rows.map((r, i) => (
                            <tr key={r.name} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                              <td style={{ padding: "8px 10px", color: "#64748b" }}>{i + 1}</td>
                              <td style={{ padding: "8px 10px", fontWeight: "600", color: "#1d4ed8" }}>{r.name}</td>
                              <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "700" }}>{r.bills}</td>
                              <td style={{ padding: "8px 10px", textAlign: "center" }}>{r.patients.size}</td>
                              <td style={{ padding: "8px 10px", fontWeight: "800", color: "#16a34a" }}>₹{fmt(r.amount)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* ─── DAILY SUMMARY ─── */}
              {reportSubTab === "daily" && (() => {
                const dailyMap = {};
                salesBills.filter(b => !b.isReturn).forEach(b => {
                  const d = new Date(b.date).toLocaleDateString("en-IN");
                  if (!dailyMap[d]) dailyMap[d] = { date: d, bills: 0, amount: 0, dateObj: new Date(b.date) };
                  dailyMap[d].bills += 1; dailyMap[d].amount += num(b.netAmount);
                });
                const rows = Object.values(dailyMap).sort((a, b) => b.dateObj - a.dateObj);
                return (
                  <div style={{ background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "700", fontSize: "14px" }}>📅 Daily Sales Summary</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead><tr style={{ background: "#f1f5f9", color: "var(--color-text-dark)" }}>
                        {["Date", "Bills", "Amount"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: "700" }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {rows.length === 0 ? <tr><td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>No data</td></tr> :
                          rows.map((r, i) => (
                            <tr key={r.date} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                              <td style={{ padding: "9px 10px", fontWeight: "600" }}>{r.date}</td>
                              <td style={{ padding: "9px 10px", textAlign: "center", color: "#3b82f6", fontWeight: "700" }}>{r.bills}</td>
                              <td style={{ padding: "9px 10px", fontWeight: "800", color: "#16a34a" }}>₹{fmt(r.amount)}</td>
                            </tr>
                          ))}
                      </tbody>
                      <tfoot><tr style={{ background: "#f0fdf4", fontWeight: "800" }}>
                        <td colSpan={2} style={{ padding: "8px 10px", textAlign: "right" }}>Total:</td>
                        <td style={{ padding: "8px 10px", color: "#16a34a" }}>₹{fmt(rows.reduce((s, r) => s + r.amount, 0))}</td>
                      </tr></tfoot>
                    </table>
                  </div>
                );
              })()}

            </>
          );
        })()}


        {/* ══════════════════════════════════════════
            OWNER: PURCHASE RETURN / DEBIT NOTE
        ══════════════════════════════════════════ */}
        {isOwner && activeSection === "purchase_challan" && (
          <PurchaseChallan setScannerTarget={setScannerTarget} setShowCameraScanner={setShowCameraScanner} />
        )}

        {isOwner && activeSection === "purchase_return" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>↩️ Purchase Return / Debit Note ({purchaseReturns.length})</h2>
              <button onClick={() => openPurchaseReturnForm()} style={{ ...btn() }}><Plus size={14} />New Return</button>
            </div>

            {showPurchaseReturnForm && (
              <div style={{ background: "white", borderRadius: "12px", padding: "18px", marginBottom: "16px", border: "2px solid #fecaca" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: "700", color: "#dc2626" }}>↩️ Purchase Return Entry</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: "10px", marginBottom: "14px" }}>
                  <div><label style={lbl}>Supplier</label>
                    <select value={purchaseReturnForm.supplierId || ""} onChange={e => { const s = suppliers.find(x => x.id === e.target.value); setPurchaseReturnForm({ ...purchaseReturnForm, supplierId: e.target.value, partyName: s?.name || "" }); }} style={inp}>
                      <option value="">-- Select --</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Party Name</label><input value={purchaseReturnForm.partyName || ""} onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, partyName: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Date</label><input type="date" value={purchaseReturnForm.date || today()} onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, date: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Ref Bill No</label><input value={purchaseReturnForm.refBillNo || ""} onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, refBillNo: e.target.value })} style={inp} placeholder="Original bill no" /></div>
                  <div><label style={lbl}>Reason</label>
                    <select value={purchaseReturnForm.reason || "Expired"} onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, reason: e.target.value })} style={inp}>
                      <option>Expired</option><option>Damaged</option><option>Wrong Item</option><option>Excess Stock</option><option>Other</option>
                    </select>
                  </div>
                  <div><label style={lbl}>Remarks</label><input value={purchaseReturnForm.remarks || ""} onChange={e => setPurchaseReturnForm({ ...purchaseReturnForm, remarks: e.target.value })} style={inp} /></div>
                </div>
                <div style={{ overflowX: "auto", marginBottom: "12px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead><tr style={{ background: "#fef2f2" }}>
                      {["Item", "Batch", "Qty", "Rate", "GST%", "Amount", ""].map(h => <th key={h} style={{ padding: "7px 6px", textAlign: "left", fontWeight: "700", color: "#dc2626", whiteSpace: "nowrap" }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {purchaseReturnItems.map((ri, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #fee2e2" }}>
                          <td style={{ padding: "4px 4px" }}>
                            <select value={ri.itemId || ""} onChange={e => { const it = items.find(x => x.id === e.target.value); updatePurchaseReturnItem(idx, "itemId", e.target.value); if (it) { updatePurchaseReturnItem(idx, "itemName", it.name); updatePurchaseReturnItem(idx, "rate", it.pRate || 0); updatePurchaseReturnItem(idx, "gst", it.gst || 0); } }} style={{ ...inp, minWidth: "160px", padding: "4px 6px" }}>
                              <option value="">-- Item --</option>
                              {items.filter(i => i.division).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: "4px 4px" }}><input value={ri.batchNo || ""} onChange={e => updatePurchaseReturnItem(idx, "batchNo", e.target.value)} style={{ ...inp, width: "80px", padding: "4px 6px" }} placeholder="Batch" /></td>
                          <td style={{ padding: "4px 4px" }}><input type="number" min="1" value={ri.qty || ""} onChange={e => updatePurchaseReturnItem(idx, "qty", e.target.value)} style={{ ...inp, width: "60px", padding: "4px 6px" }} /></td>
                          <td style={{ padding: "4px 4px" }}><input type="number" value={ri.rate || ""} onChange={e => updatePurchaseReturnItem(idx, "rate", e.target.value)} style={{ ...inp, width: "70px", padding: "4px 6px" }} /></td>
                          <td style={{ padding: "4px 4px" }}><input type="number" value={ri.gst || ""} onChange={e => updatePurchaseReturnItem(idx, "gst", e.target.value)} style={{ ...inp, width: "50px", padding: "4px 6px" }} /></td>
                          <td style={{ padding: "4px 6px", fontWeight: "700", color: "#dc2626" }}>₹{fmt(ri.amount || 0)}</td>
                          <td><button onClick={() => setPurchaseReturnItems(prev => prev.filter((_, i) => i !== idx))} style={{ ...btn("#ef4444"), padding: "3px 8px", fontSize: "11px" }}><X size={11} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <button onClick={() => setPurchaseReturnItems(prev => [...prev, emptyPurchaseReturnItem()])} style={{ ...btn("var(--color-primary)"), fontSize: "12px" }}><Plus size={13} />Add Row</button>
                  <button onClick={handleSavePurchaseReturn} style={{ ...btn("#dc2626") }}><CheckCircle size={14} />Save Debit Note</button>
                  <button onClick={() => setShowPurchaseReturnForm(false)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)") }}><X size={13} />Cancel</button>
                  <span style={{ marginLeft: "auto", fontWeight: "800", fontSize: "14px", color: "#dc2626" }}>Total: ₹{fmt(purchaseReturnItems.reduce((s, i) => s + num(i.amount), 0))}</span>
                </div>
              </div>
            )}

            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: "#fef2f2", borderBottom: "1px solid #fecaca", fontWeight: "700", fontSize: "13px", color: "#dc2626" }}>↩️ Debit Note Register</div>
              {purchaseReturns.length === 0 ? <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>No purchase returns yet</div> : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead><tr style={{ background: "#f1f5f9", color: "var(--color-text-dark)" }}>
                    {["DN#", "Date", "Supplier", "Reason", "Items", "Total", ""].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: "700" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {[...purchaseReturns].reverse().map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                        <td style={{ padding: "9px 10px", fontWeight: "700", color: "#dc2626" }}>#{r.returnNo}</td>
                        <td style={{ padding: "9px 10px" }}>{new Date(r.date).toLocaleDateString("en-IN")}</td>
                        <td style={{ padding: "9px 10px", fontWeight: "600" }}>{r.partyName}</td>
                        <td style={{ padding: "9px 10px" }}><span style={{ background: "#fef2f2", color: "#dc2626", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>{r.reason}</span></td>
                        <td style={{ padding: "9px 10px", textAlign: "center" }}>{(r.items || []).length}</td>
                        <td style={{ padding: "9px 10px", fontWeight: "800", color: "#dc2626" }}>₹{fmt(r.total)}</td>
                        <td style={{ padding: "9px 6px" }}><button onClick={() => openPurchaseReturnForm({ partyName: r.partyName, supplierId: r.supplierId, billNo: r.refBillNo })} style={{ ...btn("var(--color-primary)"), padding: "4px 8px", fontSize: "11px" }}>Copy</button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr style={{ background: "#fef2f2", fontWeight: "800" }}>
                    <td colSpan={5} style={{ padding: "8px 10px", textAlign: "right", color: "#dc2626" }}>Total Returns:</td>
                    <td colSpan={2} style={{ padding: "8px 10px", color: "#dc2626" }}>₹{fmt(purchaseReturns.reduce((s, r) => s + num(r.total), 0))}</td>
                  </tr></tfoot>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            OWNER: BANK ENTRY
        ══════════════════════════════════════════ */}
        {isOwner && activeSection === "bank" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>🏦 Bank Entry ({(bankEntries || []).length})</h2>
              <button onClick={() => setShowBankForm(p => !p)} style={{ ...btn() }}><Plus size={14} />New Entry</button>
            </div>
            {showBankForm && (
              <div style={{ background: "white", borderRadius: "12px", padding: "18px", marginBottom: "14px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: "700" }}>🏦 New Bank Voucher</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: "10px", marginBottom: "14px" }}>
                  <div><label style={lbl}>Date</label><input type="date" value={bankForm.date || today()} onChange={e => setBankForm({ ...bankForm, date: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Type</label><select value={bankForm.type || "deposit"} onChange={e => setBankForm({ ...bankForm, type: e.target.value })} style={inp}><option value="deposit">Deposit (DR)</option><option value="withdraw">Withdraw (CR)</option><option value="transfer">Transfer</option></select></div>
                  <div><label style={lbl}>Account Name</label><input list="supp-bank" value={bankForm.accountName || ""} onChange={e => setBankForm({ ...bankForm, accountName: e.target.value })} placeholder="Party name" style={inp} /><datalist id="supp-bank">{suppliers.map(s => <option key={s.id} value={s.name} />)}</datalist></div>
                  <div><label style={lbl}>Bank</label><input value={bankForm.bank || ""} onChange={e => setBankForm({ ...bankForm, bank: e.target.value })} placeholder="Bank name" style={inp} /></div>
                  <div><label style={lbl}>Chq No / Ref</label><input value={bankForm.chequeNo || ""} onChange={e => setBankForm({ ...bankForm, chequeNo: e.target.value })} placeholder="Cheque/NEFT ref" style={inp} /></div>
                  <div><label style={lbl}>Amount (₹) *</label><input type="number" value={bankForm.amount || ""} onChange={e => setBankForm({ ...bankForm, amount: e.target.value })} placeholder="0.00" style={inp} /></div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => { if (!bankForm.accountName || !bankForm.amount) { showToast("Account and amount required", "error"); return; } const e = { id: uid(), vchNo: (bankEntries || []).length + 1, ...bankForm, date: bankForm.date || today(), createdAt: new Date().toISOString() }; saveBankEntries([...(bankEntries || []), e]); setBankForm({ date: today(), type: "deposit", accountName: "", bank: "", amount: "", chequeNo: "", remark: "" }); setShowBankForm(false); showToast("Bank entry saved!"); }} style={{ ...btn("#16a34a") }}><CheckCircle size={13} />Save</button>
                  <button onClick={() => setShowBankForm(false)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)") }}><X size={13} />Cancel</button>
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
              <div style={{ background: "#f0fdf4", borderRadius: "10px", padding: "14px" }}><div style={{ fontSize: "20px", fontWeight: "800", color: "#16a34a" }}>₹{fmt((bankEntries || []).filter(e => e.type === "deposit").reduce((s, e) => s + num(e.amount), 0), 0)}</div><div style={{ fontSize: "11px", color: "#64748b" }}>Total Deposits</div></div>
              <div style={{ background: "#fef2f2", borderRadius: "10px", padding: "14px" }}><div style={{ fontSize: "20px", fontWeight: "800", color: "#ef4444" }}>₹{fmt((bankEntries || []).filter(e => e.type === "withdraw").reduce((s, e) => s + num(e.amount), 0), 0)}</div><div style={{ fontSize: "11px", color: "#64748b" }}>Total Withdrawals</div></div>
              <div style={{ background: "#eff6ff", borderRadius: "10px", padding: "14px" }}><div style={{ fontSize: "20px", fontWeight: "800", color: "#3b82f6" }}>{(bankEntries || []).length}</div><div style={{ fontSize: "11px", color: "#64748b" }}>Total Entries</div></div>
            </div>
            {(bankEntries || []).length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px", color: "#64748b" }}><div style={{ fontSize: "40px" }}>🏦</div><p>No bank entries found. Click New Entry to add.</p></div>
            ) : (
              <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead><tr style={{ background: "#f8fafc" }}>{["Vch#", "Date", "Type", "Account", "Bank", "Cheque/Ref", "Amount", ""].map(h => <th key={h} style={{ padding: "9px 12px", textAlign: h === "Amount" ? "right" : "left", fontWeight: "700", color: "#475569", fontSize: "11px" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[...(bankEntries || [])].reverse().map(e => (
                      <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "9px 12px", color: "#64748b" }}>#{e.vchNo}</td>
                        <td style={{ padding: "9px 12px" }}>{e.date}</td>
                        <td style={{ padding: "9px 12px" }}><span style={{ background: e.type === "deposit" ? "#d1fae5" : e.type === "withdraw" ? "#fee2e2" : "#dbeafe", color: e.type === "deposit" ? "#065f46" : e.type === "withdraw" ? "#991b1b" : "#1d4ed8", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700", textTransform: "capitalize" }}>{e.type}</span></td>
                        <td style={{ padding: "9px 12px", fontWeight: "600" }}>{e.accountName}</td>
                        <td style={{ padding: "9px 12px" }}>{e.bank || "—"}</td>
                        <td style={{ padding: "9px 12px", color: "#64748b" }}>{e.chequeNo || "—"}</td>
                        <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: "800", color: e.type === "deposit" ? "#16a34a" : "#ef4444" }}>₹{fmt(e.amount)}</td>
                        <td style={{ padding: "9px 12px", textAlign: "right" }}><button onClick={() => handleDeleteBankEntry(e.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }} title="Delete Entry"><Trash2 size={12} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════
            OWNER: MASTERS (Suppliers + Customers)
        ══════════════════════════════════════════ */}
        {isOwner && activeSection === "masters" && (
          <>
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "5px", padding: "4px", marginBottom: "16px", gap: "4px", flexWrap: "wrap" }}>
              {[{ id: "suppliers", label: "🏭 Suppliers" }, { id: "doctors", label: "🩺 Doctors" }, { id: "customers", label: "👥 Customers" }, { id: "offers", label: "🎁 Bundle Offers" }, { id: "expiry_cal", label: "📅 Expiry Calendar" }, { id: "auto_reorder", label: "🔄 Auto Reorder" }, { id: "prescriptions", label: "📋 Prescriptions" }].map(t => (
                <button key={t.id} onClick={() => setOwnerSubTab(t.id)} style={{ padding: "8px 12px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "11px", background: ownerSubTab === t.id ? "white" : "transparent", color: ownerSubTab === t.id ? "#3b82f6" : "#64748b" }}>{t.label}</button>
              ))}
            </div>

            {/* BUNDLE OFFERS */}
            {ownerSubTab === "offers" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>🎁 Bundle Offers</h2>
                  <button onClick={() => setShowOfferForm(true)} style={{ ...btn("var(--color-primary)", "#1a1a1a") }}><Plus size={14} />New Offer</button>
                </div>
                {showOfferForm && (
                  <div style={{ background: "white", borderRadius: "8px", border: "2px solid #fde68a", padding: "16px", marginBottom: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "10px", marginBottom: "12px" }}>
                      <div><label style={lbl}>Offer Name *</label><input value={offerForm.name || ""} onChange={e => setOfferForm({ ...offerForm, name: e.target.value.toUpperCase() })} placeholder="e.g. BP COMBO" style={inp} /></div>
                      <div style={{ gridColumn: "span 2" }}><label style={lbl}>Items (comma separated) *</label><input value={offerForm.itemNames || ""} onChange={e => setOfferForm({ ...offerForm, itemNames: e.target.value.toUpperCase() })} placeholder="e.g. PARACETAMOL, CROCIN, DISPRIN" style={inp} /></div>
                      <div><label style={lbl}>Discount % *</label><input type="number" value={offerForm.discountPct || ""} onChange={e => setOfferForm({ ...offerForm, discountPct: e.target.value })} placeholder="10" style={inp} /></div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "20px" }}>
                        <input type="checkbox" checked={!!offerForm.active} onChange={e => setOfferForm({ ...offerForm, active: e.target.checked })} id="offerActive" />
                        <label htmlFor="offerActive" style={{ fontWeight: "600", fontSize: "12px" }}>Active</label>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={handleSaveOffer} style={{ ...btn("var(--color-primary)", "#1a1a1a") }}><CheckCircle size={13} />Save Offer</button>
                      <button onClick={() => { setShowOfferForm(false); setEditOfferId(null); }} style={{ ...btn("var(--color-border)", "var(--color-text-dark)") }}><X size={13} />Cancel</button>
                    </div>
                  </div>
                )}
                {bundleOffers.length === 0 && !showOfferForm ? <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No bundle offers yet</div> :
                  bundleOffers.map(o => (
                    <div key={o.id} style={{ background: "white", borderRadius: "8px", border: `1px solid ${o.active ? "#fde68a" : "#e2e8f0"}`, padding: "14px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "700" }}>{o.name} {!o.active && <span style={{ fontSize: "10px", color: "#64748b" }}>(Inactive)</span>}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>Items: {o.itemNames}</div>
                        <div style={{ fontSize: "12px", marginTop: "3px" }}>Discount: <strong style={{ color: "#16a34a" }}>{o.discountPct}%</strong></div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => { setEditOfferId(o); setOfferForm(o); setShowOfferForm(true); }} style={{ ...btn(), fontSize: "11px", padding: "5px 10px" }}><Edit2 size={11} />Edit</button>
                        <button onClick={() => handleDeleteBundleOffer(o.id)} style={{ ...btn("#ef4444"), fontSize: "11px", padding: "5px 10px" }}><Trash2 size={11} />Delete</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* EXPIRY CALENDAR */}
            {ownerSubTab === "expiry_cal" && (() => {
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const daysInMonth = new Date(expiryCalYear, expiryCalMonth + 1, 0).getDate();
              const firstDay = new Date(expiryCalYear, expiryCalMonth, 1).getDay();
              const getDayItems = (day) => {
                const checkDate = new Date(expiryCalYear, expiryCalMonth, day);
                return items.filter(i => { const exp = parseExpiry(i.expiryDate); if (!exp) return false; return exp.getMonth() === checkDate.getMonth() && exp.getFullYear() === checkDate.getFullYear() && exp.getDate() <= day; });
              };
              return (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>📅 Expiry Calendar</h2>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button onClick={() => { const d = new Date(expiryCalYear, expiryCalMonth - 1); setExpiryCalMonth(d.getMonth()); setExpiryCalYear(d.getFullYear()); }} style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), padding: "5px 10px" }}>←</button>
                      <span style={{ fontWeight: "700", minWidth: "100px", textAlign: "center" }}>{monthNames[expiryCalMonth]} {expiryCalYear}</span>
                      <button onClick={() => { const d = new Date(expiryCalYear, expiryCalMonth + 1); setExpiryCalMonth(d.getMonth()); setExpiryCalYear(d.getFullYear()); }} style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), padding: "5px 10px" }}>→</button>
                    </div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: "#f1f5f9" }}>
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d} style={{ padding: "10px", textAlign: "center", fontSize: "11px", fontWeight: "700", color: "var(--color-text-dark)" }}>{d}</div>)}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
                      {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} style={{ padding: "8px", minHeight: "60px", background: "#f8fafc" }} />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayItems = getDayItems(day);
                        const isToday = new Date().getDate() === day && new Date().getMonth() === expiryCalMonth && new Date().getFullYear() === expiryCalYear;
                        const hasPast = dayItems.filter(it => isExpired(it.expiryDate)).length;
                        const hasSoon = dayItems.filter(it => isExpiringSoon(it.expiryDate)).length;
                        return (
                          <div key={day} style={{ padding: "6px", minHeight: "60px", border: "1px solid #f1f5f9", background: isToday ? "#eff6ff" : "white" }}>
                            <div style={{ fontWeight: isToday ? "800" : "400", fontSize: "12px" }}>{day}</div>
                            {hasPast > 0 && <div style={{ background: "#fef2f2", color: "#dc2626", fontSize: "9px", borderRadius: "3px", padding: "1px 4px", marginTop: "2px" }}>🔴 {hasPast}</div>}
                            {hasSoon > 0 && <div style={{ background: "#fffbeb", color: "#92400e", fontSize: "9px", borderRadius: "3px", padding: "1px 4px", marginTop: "2px" }}>🟡 {hasSoon}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* AUTO REORDER */}
            {ownerSubTab === "auto_reorder" && (() => {
              const drafts = items.filter(i => num(i.stock) <= num(i.minimum || 5));
              return (
                <div>
                  <h2 style={{ margin: "0 0 14px", fontSize: "17px", fontWeight: "800" }}>🔄 Auto Reorder ({drafts.length})</h2>
                  {drafts.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>✅ All items above minimum stock!</div> :
                    drafts.map(item => (
                      <div key={item.id} style={{ background: "white", borderRadius: "8px", border: "1px solid #fecaca", padding: "14px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: "700" }}>{item.name}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{item.company} · Stock: <strong style={{ color: "#dc2626" }}>{item.stock}</strong> · Min: {item.minimum || 5}</div>
                        </div>
                        <button onClick={() => { setActiveSection("purchase"); openPurchaseForm(); }} style={{ ...btn("#3b82f6"), fontSize: "11px", padding: "6px 12px" }}>+ Order</button>
                      </div>
                    ))
                  }
                </div>
              );
            })()}

            {/* PRESCRIPTIONS */}
            {ownerSubTab === "prescriptions" && (
              <div>
                <h2 style={{ margin: "0 0 14px", fontSize: "17px", fontWeight: "800" }}>📋 Customer Prescriptions</h2>
                {([]).length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No prescriptions submitted yet</div> :
                  [...([])].reverse().map(p => (
                    <div key={p.id} style={{ background: "white", borderRadius: "8px", border: `1px solid ${p.status === "Pending" ? "#fde68a" : "#e2e8f0"}`, padding: "14px", marginBottom: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div><div style={{ fontWeight: "700" }}>{p.customerName} <span style={{ background: p.status === "Pending" ? "#fffbeb" : "#f1f5f9", color: p.status === "Pending" ? "#92400e" : "#475569", fontSize: "10px", padding: "2px 8px", borderRadius: "8px", marginLeft: "6px" }}>{p.status}</span></div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{new Date(p.createdAt).toLocaleDateString("en-IN")}</div></div>
                      </div>
                      {p.imageData && <img src={p.imageData} alt="prescription" style={{ maxWidth: "300px", borderRadius: "8px" }} />}
                    </div>
                  ))
                }
              </div>
            )}

            {/* SUPPLIERS */}
            {ownerSubTab === "suppliers" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>🏭 Supplier Master</h2>
                  <div style={{ position: "relative" }}>
                    <Search size={13} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
                    <input
                      placeholder="Search Supplier..."
                      value={masterSearch}
                      onChange={e => setMasterSearch(e.target.value)}
                      style={{ ...inp, width: "200px", paddingLeft: "28px", borderRadius: "20px", background: "#f8fafc" }}
                    />
                  </div>
                </div>
                {suppliers.length === 0 && !showSupplierForm ? (
                  <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}><div style={{ fontSize: "44px" }}>🏭</div><p>No suppliers found</p></div>
                ) : (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {suppliers.filter(s => !masterSearch || s.name?.toLowerCase().includes(masterSearch.toLowerCase())).map(s => (
                      <div key={s.id} style={{ background: "white", borderRadius: "5px", padding: "14px 16px", border: "1px solid var(--color-border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                          <div>
                            <div style={{ fontWeight: "800", fontSize: "14px" }}>{s.name}</div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
                              {s.mobile && <span>📱 {s.mobile}</span>}
                              {s.gstTin && <span>GST: {s.gstTin}</span>}
                              {s.dlNo && <span>DL: {s.dlNo}</span>}
                              {s.creditLimit && <span>Credit: ₹{s.creditLimit} ({s.creditDays} days)</span>}
                              {s.city && <span>📍 {s.city}, {s.state}</span>}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => openSupplierForm(s)} style={{ ...btn(), fontSize: "11px", padding: "5px 10px" }}><Edit2 size={11} />Edit</button>
                            <button onClick={() => { setLedgerSupplierId(s.id); setShowSupplierLedger(true); }} style={{ ...btn("#7c3aed"), fontSize: "11px", padding: "5px 10px" }}>📒 Ledger</button>
                            <button onClick={() => handleDeleteSupplier(s.id)} style={{ ...btn("#ef4444"), fontSize: "11px", padding: "5px 10px" }}><Trash2 size={11} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Doctors */}
            {ownerSubTab === "doctors" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>🩺 Doctor Master ({doctors.length})</h2>
                    <div style={{ position: "relative" }}>
                      <Search size={13} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
                      <input
                        placeholder="Search Doctor..."
                        value={masterSearch}
                        onChange={e => setMasterSearch(e.target.value)}
                        style={{ ...inp, width: "180px", paddingLeft: "28px", borderRadius: "20px", background: "#f8fafc" }}
                      />
                    </div>
                  </div>
                  <button onClick={() => { setDoctorForm({ name: "", area: "", mobile: "", speciality: "" }); setEditDoctorId(null); setShowDoctorForm(true); }} style={{ ...btn("#3b82f6"), fontSize: "12px" }}>+ Add Doctor</button>
                </div>
                {showDoctorForm && (
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                      <div><label style={lbl}>Doctor Name *</label><input value={doctorForm.name} onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value.toUpperCase() })} placeholder="DR. NAME" style={inp} /></div>
                      <div><label style={lbl}>Speciality</label><input value={doctorForm.speciality} onChange={e => setDoctorForm({ ...doctorForm, speciality: e.target.value.toUpperCase() })} placeholder="GENERAL / ORTHO" style={inp} /></div>
                      <div><label style={lbl}>Area / Location</label><input value={doctorForm.area} onChange={e => setDoctorForm({ ...doctorForm, area: e.target.value.toUpperCase() })} placeholder="AREA" style={inp} /></div>
                      <div><label style={lbl}>Mobile</label><input value={doctorForm.mobile} onChange={e => setDoctorForm({ ...doctorForm, mobile: e.target.value })} placeholder="Mobile no." style={{ ...inp, textTransform: "none" }} /></div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => {
                        handleSaveDoctor(doctorForm, editDoctorId, () => { setShowDoctorForm(false); setEditDoctorId(null); });
                      }} style={{ ...btn("#16a34a") }}><CheckCircle size={13} />{editDoctorId ? "Update" : "Save"} Doctor</button>
                      <button onClick={() => { setShowDoctorForm(false); setEditDoctorId(null); }} style={{ ...btn("var(--color-border)", "var(--color-text-dark)") }}>Cancel</button>
                    </div>
                  </div>
                )}
                {doctors.length === 0 ?
                  <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    <div style={{ fontSize: "40px", marginBottom: "8px" }}>🩺</div>
                    <p>No doctors added yet</p>
                  </div> :
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "10px" }}>
                    {doctors.filter(d => !masterSearch || d.name?.toLowerCase().includes(masterSearch.toLowerCase()) || d.speciality?.toLowerCase().includes(masterSearch.toLowerCase())).map(d => (
                      <div key={d.id} style={{ background: "white", borderRadius: "8px", padding: "14px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--color-text-dark)", marginBottom: "4px" }}>🩺 {d.name}</div>
                        {d.speciality && <div style={{ fontSize: "11px", background: "#eff6ff", color: "#3b82f6", padding: "2px 8px", borderRadius: "10px", display: "inline-block", marginBottom: "6px" }}>{d.speciality}</div>}
                        {d.area && <div style={{ fontSize: "12px", color: "#64748b" }}>📍 {d.area}</div>}
                        {d.mobile && <div style={{ fontSize: "12px", color: "#64748b" }}>📞 {d.mobile}</div>}
                        <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                          <button onClick={() => { setDoctorForm({ name: d.name, area: d.area || "", mobile: d.mobile || "", speciality: d.speciality || "" }); setEditDoctorId(d.id); setShowDoctorForm(true); }} style={{ ...btn("var(--color-primary)"), fontSize: "11px", padding: "4px 10px" }}>Edit</button>
                          <button onClick={() => showConfirm("Delete doctor?", () => { const nd = doctors.filter(x => x.id !== d.id); setDoctors(nd); save("store_doctors", nd); showToast("Doctor deleted"); })} style={{ ...btn("#ef4444"), fontSize: "11px", padding: "4px 10px" }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </>
            )}

            {/* Customers from orders */}
            {ownerSubTab === "customers" && (() => {
              const customerEmails = [...new Set(([]).map(o => o.customer?.email).filter(Boolean))];
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>👥 Online Customers ({customerEmails.length})</h2>
                    <div style={{ position: "relative" }}>
                      <Search size={13} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
                      <input
                        placeholder="Search Customer..."
                        value={masterSearch}
                        onChange={e => setMasterSearch(e.target.value)}
                        style={{ ...inp, width: "180px", paddingLeft: "28px", borderRadius: "20px", background: "#f8fafc" }}
                      />
                    </div>
                  </div>
                  {customerEmails.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}><div style={{ fontSize: "44px" }}>👥</div><p>No customers found</p></div>
                  ) : (
                    <div style={{ display: "grid", gap: "10px" }}>
                      {customerEmails.filter(email => {
                        const q = masterSearch.toLowerCase();
                        if (!q) return true;
                        const cOrders = ([]).filter(o => o.customer?.email === email);
                        const name = cOrders[0]?.customer?.name || "";
                        return email.toLowerCase().includes(q) || name.toLowerCase().includes(q);
                      }).map(email => {
                        const cOrders = ([]).filter(o => o.customer?.email === email);
                        const latest = [...cOrders].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                        const totalSpent = cOrders.reduce((s, o) => s + num(o.total), 0);
                        const vip = getVIPLevel(email);
                        const pts = getCustomerPoints(email);
                        const hc = getHealthCard(email);
                        return (
                          <div key={email} style={{ background: "white", borderRadius: "8px", padding: "14px 16px", border: `1px solid ${vip.label === "Gold VIP" ? "#fde68a" : vip.label === "Silver" ? "#e2e8f0" : "#dee2e6"}`, boxShadow: vip.label === "Gold VIP" ? "0 2px 8px rgba(245,158,11,0.15)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: `linear-gradient(135deg,${vip.label === "Gold VIP" ? "#f59e0b,#d97706" : "var(--color-primary),#0d6efd"})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "var(--color-text-dark)", fontWeight: "800" }}>{vip.badge || ((latest?.customer?.name || "?")[0].toUpperCase())}</div>
                              <div>
                                <div style={{ fontWeight: "700", fontSize: "14px" }}>{latest?.customer?.name} <span style={{ background: vip.label === "Gold VIP" ? "#fffbeb" : vip.label === "Silver" ? "#f8fafc" : "#f1f5f9", color: vip.color, fontSize: "10px", padding: "2px 8px", borderRadius: "8px", marginLeft: "4px" }}>{vip.badge} {vip.label}</span></div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>{email}{latest?.customer?.phone ? ` · ${latest.customer.phone}` : ""}</div>
                                {hc && <div style={{ fontSize: "10px", color: "#7c3aed", marginTop: "2px" }}>🩸 {hc.bloodGroup} {hc.allergies && `⚠️ Allergic: ${hc.allergies}`}</div>}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", display: "flex", gap: "12px", alignItems: "center" }}>
                              {pts > 0 && <div style={{ textAlign: "center" }}>
                                <div style={{ fontWeight: "800", color: "#f59e0b" }}>⭐{pts}</div>
                                <div style={{ fontSize: "9px", color: "#64748b" }}>Points</div>
                              </div>}
                              <div>
                                <div style={{ fontWeight: "800", color: "#16a34a" }}>₹{fmt(totalSpent, 0)}</div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>{cOrders.length} orders</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {/* QUICK STOCK MODAL */}
        {quickStockItem && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "white", borderRadius: "6px", padding: "24px", width: "100%", maxWidth: "320px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
              <h3 style={{ margin: "0 0 5px", fontSize: "16px", fontWeight: "800" }}>📦 Stock Update</h3>
              <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#64748b" }}>{getDivision(quickStockItem.division).icon} {quickStockItem.name}</p>
              <div style={{ background: "#f1f5f9", borderRadius: "4px", padding: "8px 12px", marginBottom: "12px", fontSize: "13px" }}>Current: <strong>{quickStockItem.stock} {quickStockItem.unit || "pcs"}</strong></div>
              <label style={lbl}>Add / Remove Qty (+50 or -10)</label>
              <input type="number" value={quickQty} onChange={e => setQuickQty(e.target.value)} onKeyDown={e => e.key === "Enter" && handleQuickStock()} placeholder="+50 or -10" style={{ ...inp, fontSize: "15px", marginTop: "4px", marginBottom: "12px" }} autoFocus />
              {quickQty && <div style={{ background: "#f0fdf4", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#16a34a", marginBottom: "12px" }}>New Stock: <strong>{Math.max(0, int(quickStockItem.stock) + int(quickQty))} {quickStockItem.unit || "pcs"}</strong></div>}
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleQuickStock} style={{ ...btn("var(--color-primary)"), flex: 1, justifyContent: "center", padding: "10px" }}>✓ Update</button>
                <button onClick={() => { setQuickStockItem(null); setQuickQty(""); }} style={{ ...btn("#e9ecef", "#495057"), padding: "10px 16px" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}


        {/* ── DAY END CASH SUMMARY MODAL ── */}
        {showDayEnd && (() => {
          const todayStr = today();
          const cashSales = salesBills.filter(b => !b.isReturn && b.date === todayStr && (b.paymentMode === "cash" || b.paymentMode === "split")).reduce((s, b) => s + num(b.paymentMode === "split" ? b.splitCash || b.netAmount : b.netAmount), 0);
          const upiSales = salesBills.filter(b => !b.isReturn && b.date === todayStr && (b.paymentMode === "upi" || b.paymentMode === "split")).reduce((s, b) => s + num(b.paymentMode === "split" ? b.splitUpi || 0 : b.netAmount), 0);
          const creditSales = salesBills.filter(b => !b.isReturn && b.date === todayStr && (b.paymentMode === "credit")).reduce((s, b) => s + num(b.netAmount), 0);
          const diff = num(physicalCash) - cashSales;
          return (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
              <div style={{ background: "white", borderRadius: "12px", padding: "28px", width: "100%", maxWidth: "460px", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>🏁 Day End Summary — {todayStr}</h2>
                  <button onClick={() => setShowDayEnd(false)} style={{ background: "#f1f5f9", border: "none", padding: "6px 10px", borderRadius: "8px", cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                  {[
                    { l: "💵 Cash Sales", val: cashSales, color: "#16a34a" },
                    { l: "📱 UPI Sales", val: upiSales, color: "#3b82f6" },
                    { l: "📒 Credit Sales", val: creditSales, color: "#f59e0b" },
                    { l: "📊 Total Sales", val: cashSales + upiSales + creditSales, color: "var(--color-text-dark)" },
                  ].map(s => (
                    <div key={s.l} style={{ background: "#f8fafc", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>{s.l}</div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: s.color }}>₹{fmt(s.val, 0)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={lbl}>Physical Cash Count (Actual ₹ in drawer)</label>
                  <input type="number" value={physicalCash} onChange={e => setPhysicalCash(e.target.value)} placeholder="Enter actual cash amount" style={{ ...inp, fontSize: "16px" }} autoFocus />
                </div>
                {physicalCash && (
                  <div style={{ background: diff === 0 ? "#f0fdf4" : diff > 0 ? "#fffbeb" : "#fef2f2", border: `1px solid ${diff === 0 ? "#86efac" : diff > 0 ? "#fde68a" : "#fecaca"}`, borderRadius: "8px", padding: "12px", marginBottom: "14px", textAlign: "center" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: diff === 0 ? "#15803d" : diff > 0 ? "#92400e" : "#dc2626" }}>
                      {diff === 0 ? "✅ Perfect Match!" : diff > 0 ? `📈 Excess: ₹${fmt(diff)}` : `📉 Short: ₹${fmt(Math.abs(diff))}`}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>System: ₹{fmt(cashSales)} | Physical: ₹{fmt(num(physicalCash))}</div>
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleSaveDayEnd} style={{ ...btn("#16a34a"), flex: 1, justifyContent: "center", padding: "12px" }}><CheckCircle size={14} />Save Summary</button>
                  <button onClick={() => setShowDayEnd(false)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), padding: "12px 16px" }}><X size={13} /></button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── SHORTCUT HELP MODAL ── */}
        {showShortcuts && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowShortcuts(false)}>
            <div style={{ background: "white", borderRadius: "6px", padding: "24px", width: "100%", maxWidth: "560px", boxShadow: "0 25px 60px rgba(0,0,0,0.3)", borderTop: "3px solid var(--color-primary)" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>⌨️ Keyboard Shortcuts</h2>
                <button onClick={() => setShowShortcuts(false)} style={{ background: "#f1f5f9", border: "none", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "16px" }}>✕</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Navigation */}
                <div>
                  <div style={{ fontWeight: "800", fontSize: "12px", color: "#3b82f6", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Navigation (Alt+Key)</div>
                  {[
                    ["Alt + H", "Dashboard"],
                    ["Alt + I", "Inventory"],
                    ["Alt + P", "Purchase Bill"],
                    ["Alt + S", "Sales Bill"],
                    ["Alt + Y", "Payments"],
                    ["Alt + R", "Reports"],
                    ["Alt + M", "Masters / Suppliers"],
                  ].map(([k, l]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #e9ecef" }}>
                      <span style={{ fontSize: "13px", color: "#475569" }}>{l}</span>
                      <kbd style={{ background: "#f1f5f9", border: "1px solid var(--color-border)", borderRadius: "5px", padding: "2px 8px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace" }}>{k}</kbd>
                    </div>
                  ))}
                </div>
                {/* Divisions */}
                <div>
                  <div style={{ fontWeight: "800", fontSize: "12px", color: "#16a34a", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Divisions (F Keys)</div>
                  {[
                    ["F2", "💊 Medicines"],
                    ["F3", "🩺 Surgical Items"],
                    ["F4", "✨ Cosmetics"],
                    ["F5", "🍼 Baby Products"],
                    ["F6", "🩻 Health Devices"],
                    ["F7", "💪 Vitamins"],
                    ["F8", "🌿 Ayurvedic"],
                    ["F9", "🏥 OTC Products"],
                  ].map(([k, l]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #e9ecef" }}>
                      <span style={{ fontSize: "13px", color: "#475569" }}>{l}</span>
                      <kbd style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "5px", padding: "2px 8px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace" }}>{k}</kbd>
                    </div>
                  ))}
                </div>
                {/* Quick Actions */}
                <div>
                  <div style={{ fontWeight: "800", fontSize: "12px", color: "#8b5cf6", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Quick Actions (Ctrl+Key)</div>
                  {[
                    ["Ctrl + N", "New Sales Bill"],
                    ["Ctrl + B", "New Purchase Bill"],
                    ["Ctrl + Q", "New Payment Entry"],
                  ].map(([k, l]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #e9ecef" }}>
                      <span style={{ fontSize: "13px", color: "#475569" }}>{l}</span>
                      <kbd style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "5px", padding: "2px 8px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace" }}>{k}</kbd>
                    </div>
                  ))}
                </div>
                {/* General */}
                <div>
                  <div style={{ fontWeight: "800", fontSize: "12px", color: "#ef4444", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>General</div>
                  {[
                    ["Esc", "Close / Cancel any form"],
                    ["?", "Show / Hide this help"],
                    ["Ctrl + S", "Save current open form"],
                    ["Enter", "Next field → Last field saves form"],
                  ].map(([k, l]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #e9ecef" }}>
                      <span style={{ fontSize: "13px", color: "#475569" }}>{l}</span>
                      <kbd style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "5px", padding: "2px 8px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace" }}>{k}</kbd>
                    </div>
                  ))}
                  <div style={{ marginTop: "14px", background: "#f1f5f9", borderRadius: "8px", padding: "10px 12px", fontSize: "11px", color: "#64748b" }}>
                    💡 Press <kbd style={{ background: "#f1f5f9", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "1px 5px", fontSize: "10px", fontWeight: "700" }}>?</kbd> anytime to show this panel
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}




        {/* ══ USER MASTER MODAL ══ */}
        
      {/* --- WIP MODAL --- */}
      {showWipModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", width: "400px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: "1px solid var(--color-border)" }}>
            <div style={{ background: "#f8fafc", padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>??</span> ???? ???????????? ??
              </div>
              <button onClick={() => setShowWipModal("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
            </div>
            <div style={{ padding: "30px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "16px", color: "var(--color-text-dark)", fontWeight: "800", marginBottom: "8px" }}>{showWipModal}</div>
              <div style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: "1.6" }}>
                ? ???? ?? ?????? ??? ???? ?????? ??.<br/>? ??????? ????? ??? ???????? ???? ??????? ???? ?? ???? ??? ??? ??????? ???? ?? ?? ??? ????? ???? ??? ???? ???? ???? ????? ????.
              </div>
              <button onClick={() => setShowWipModal("")} style={{ marginTop: "24px", background: "var(--color-primary)", color: "var(--color-text-dark)", padding: "10px 32px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>Close</button>
            </div>
          </div>
        </div>
      )}
{showUserMaster && (
  <div style={{ position: "fixed", inset: 0, background: "#ffffff", zIndex: 9999, display: "flex", flexDirection: "column", width: "100vw", height: "100vh", overflow: "hidden", fontFamily: "Inter, sans-serif" }}>
      
      {/* Header */}
      <div style={{ background: "linear-gradient(90deg, #1e3a8a, #0f172a)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "rgba(255,255,255,0.15)", padding: "6px", borderRadius: "8px" }}><Users size={20} color="#93c5fd" /></div>
          <span style={{ color: "#ffffff", fontWeight: "700", fontSize: "16px", letterSpacing: "0.5px" }}>User Master</span>
        </div>
        <button onClick={() => setShowUserMaster(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.9)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}><X size={18} /></button>
      </div>

      {/* Main Content (2 Columns) */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Col: User Details */}
        <div style={{ flex: 1, borderRight: "1px solid #e2e8f0", padding: "20px", display: "flex", flexDirection: "column", overflowY: "auto", background: "#f8fafc" }}>
          <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>User Details</div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { lbl: "Login ID", key: "loginId", ph: "e.g. admin_01" },
              { lbl: "Password", key: "password", ph: "••••••••", type: umShowPass ? "text" : "password" },
              { lbl: "Re-Enter Password", key: "rePassword", ph: "••••••••", type: umShowPass ? "text" : "password" },
              { lbl: "Full Name", key: "fullName", ph: "John Doe" }
            ].map(f => (
              <div key={f.key}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label style={{ display: "block", color: "#475569", fontSize: "12px", marginBottom: "6px", fontWeight: "600" }}>{f.lbl}</label>
                  {f.key === "password" && <label style={{ color: "#2563eb", fontSize: "11px", cursor: "pointer" }}><input type="checkbox" checked={umShowPass} onChange={e=>setUmShowPass(e.target.checked)} style={{marginRight:4}} />Show</label>}
                </div>
                <input type={f.type || "text"} placeholder={f.ph} value={umForm[f.key] || ""} onChange={e => setUmForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ width: "100%", background: "#ffffff", border: "1px solid #cbd5e1", padding: "10px 12px", borderRadius: "8px", color: "#0f172a", fontSize: "13px", outline: "none", boxSizing: "border-box", transition: "border 0.2s" }} onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#cbd5e1"} />
              </div>
            ))}
            
            <div>
              <label style={{ display: "block", color: "#475569", fontSize: "12px", marginBottom: "6px", fontWeight: "600" }}>User Type</label>
              <select value={umForm.userType || "User"} onChange={e => setUmForm(prev => ({ ...prev, userType: e.target.value }))} style={{ width: "100%", background: "#ffffff", border: "1px solid #cbd5e1", padding: "10px 12px", borderRadius: "8px", color: "#0f172a", fontSize: "13px", outline: "none", boxSizing: "border-box" }}>
                <option>Administrator</option>
                <option>User</option>
                <option>Supervisor</option>
                <option>Cashier</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", color: "#475569", fontSize: "12px", marginBottom: "6px", fontWeight: "600" }}>Description</label>
              <textarea placeholder="Optional notes..." value={umForm.description || ""} onChange={e => setUmForm(prev => ({ ...prev, description: e.target.value }))} style={{ width: "100%", background: "#ffffff", border: "1px solid #cbd5e1", padding: "10px 12px", borderRadius: "8px", color: "#0f172a", fontSize: "13px", outline: "none", boxSizing: "border-box", minHeight: "50px", resize: "none" }} />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#475569", fontSize: "13px", cursor: "pointer", marginTop: "4px" }}>
              <input type="checkbox" checked={umForm.isDefault || false} onChange={e => setUmForm(prev => ({ ...prev, isDefault: e.target.checked }))} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
              Make this User Default User
            </label>
          </div>

          <div style={{ flex: 1 }} />
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "20px" }}>
            <button onClick={() => { 
              setUmForm({ loginId: "", password: "", rePassword: "", fullName: "", userType: "User", description: "", isDefault: false }); 
              setUmEditId(null); 
              setUmSelectedUser(null);
              setUmGroupUserSel({});
            }} style={{ padding: "10px", background: "#e2e8f0", border: "none", borderRadius: "8px", color: "#334155", fontWeight: "600", cursor: "pointer" }}>New User</button>
            
            <button onClick={() => {
              if (!umForm.loginId.trim()) { showToast("Login ID required!", "error"); return; }
              if (!umEditId && umForm.password !== umForm.rePassword) { showToast("Passwords do not match!", "error"); return; }
              
              let upd;
              if (umEditId) {
                upd = appUsers.map(u => u.id === umEditId ? { 
                  ...u, 
                  loginId: umForm.loginId.trim(), 
                  fullName: umForm.fullName.trim(), 
                  userType: umForm.userType || "User", 
                  description: umForm.description || "", 
                  isDefault: !!umForm.isDefault, 
                  password: umForm.password ? umForm.password : u.password 
                } : u);
              } else {
                const newU = { 
                  id: uid(), 
                  loginId: umForm.loginId.trim(), 
                  fullName: umForm.fullName.trim(), 
                  userType: umForm.userType || "User", 
                  description: umForm.description || "", 
                  isDefault: !!umForm.isDefault, 
                  password: umForm.password 
                };
                upd = [...appUsers, newU];
              }
              
              setAppUsers(upd);
              save("store_appusers", upd);
              try { localStorage.setItem("store_appusers", JSON.stringify(upd)); } catch (_) {}
              showToast("User saved successfully!");
              setUmForm({ loginId: "", password: "", rePassword: "", fullName: "", userType: "User", description: "", isDefault: false }); 
              setUmEditId(null); 
              setUmSelectedUser(null);
              setUmGroupUserSel({});
            }} style={{ padding: "10px", background: "#2563eb", border: "none", borderRadius: "8px", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}>Save User</button>
            
            <button onClick={() => {
              // Collect checked IDs or selected user ID
              const checkedIds = Object.keys(umGroupUserSel).filter(k => umGroupUserSel[k]);
              const idsToDelete = checkedIds.length > 0 ? checkedIds : (umSelectedUser ? [umSelectedUser.id] : []);
              
              if (idsToDelete.length === 0) { 
                showToast("Please select/tick a user to delete!", "error"); 
                return; 
              }
              
              const upd = appUsers.filter(u => !idsToDelete.includes(u.id));
              setAppUsers(upd);
              save("store_appusers", upd);
              try { localStorage.setItem("store_appusers", JSON.stringify(upd)); } catch (_) {}
              
              setUmSelectedUser(null);
              setUmEditId(null);
              setUmGroupUserSel({});
              setUmForm({ loginId: "", password: "", rePassword: "", fullName: "", userType: "User", description: "", isDefault: false });
              showToast("User(s) deleted successfully!");
            }} style={{ padding: "10px", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontWeight: "600", cursor: "pointer" }}>Delete</button>
            
            <button onClick={() => {
              if (!umSelectedUser) { showToast("Select a user first!", "error"); return; }
              setUmForm(f => ({ ...f, password: "", rePassword: "" })); 
              showToast("Enter new password and click Save User.");
            }} style={{ padding: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#475569", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>Change Pass</button>
          </div>
        </div>

        {/* Right Col: Groups & Users List */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#ffffff" }}>
          
          {/* Groups Section */}
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Groups</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <input value={umGroupForm} onChange={e => setUmGroupForm(e.target.value)} placeholder="New group name..." style={{ flex: 1, background: "#ffffff", border: "1px solid #cbd5e1", padding: "8px 10px", borderRadius: "6px", color: "#0f172a", fontSize: "13px", outline: "none" }} />
              <button onClick={() => { 
                if (!umGroupForm.trim()) return; 
                const ng = { id: uid(), name: umGroupForm.trim(), users: [] }; 
                const upd = [...userGroups, ng]; 
                setUserGroups(upd); 
                save("store_user_groups", upd);
                try { localStorage.setItem("store_user_groups", JSON.stringify(upd)); } catch (_) {}
                setUmGroupForm(""); 
                setUmSelectedGroup(ng); 
                showToast("Group created!");
              }} style={{ padding: "0 14px", background: "#2563eb", border: "none", borderRadius: "6px", color: "#ffffff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={16} /></button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "80px", overflowY: "auto" }}>
              {userGroups.map(g => (
                <div key={g.id} onClick={() => {
                  setUmSelectedGroup(g);
                  const selMap = {};
                  (g.users || []).forEach(uid => { selMap[uid] = true; });
                  setUmGroupUserSel(selMap);
                }} style={{ padding: "5px 12px", background: umSelectedGroup?.id === g.id ? "#3b82f6" : "#f1f5f9", borderRadius: "20px", fontSize: "12px", color: umSelectedGroup?.id === g.id ? "#ffffff" : "#475569", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "0.2s" }}>
                  {g.name}
                  <X size={13} style={{cursor:"pointer", opacity: 0.8}} onClick={(e) => { 
                    e.stopPropagation(); 
                    const upd = userGroups.filter(xg => xg.id !== g.id); 
                    setUserGroups(upd); 
                    save("store_user_groups", upd);
                    try { localStorage.setItem("store_user_groups", JSON.stringify(upd)); } catch (_) {}
                    if (umSelectedGroup?.id === g.id) setUmSelectedGroup(null); 
                    showToast("Group deleted!");
                  }} />
                </div>
              ))}
            </div>
          </div>

          {/* Users Section */}
          <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Users List ({appUsers.length})</div>
              {umSelectedGroup && (
                <button onClick={() => {
                  const assignedUserIds = Object.keys(umGroupUserSel).filter(k => umGroupUserSel[k]);
                  const upd = userGroups.map(g => g.id === umSelectedGroup.id ? { ...g, users: assignedUserIds } : g);
                  setUserGroups(upd);
                  save("store_user_groups", upd);
                  try { localStorage.setItem("store_user_groups", JSON.stringify(upd)); } catch (_) {}
                  showToast("Assigned users saved to group " + umSelectedGroup.name + "!");
                }} style={{ padding: "5px 12px", background: "#dcfce7", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>Save to {umSelectedGroup.name}</button>
              )}
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {appUsers.length === 0 ? (
                <div style={{ color: "#94a3b8", textAlign: "center", padding: "30px 0", fontSize: "13px" }}>No users found. Click "New User" to create one.</div>
              ) : (
                appUsers.map(u => {
                  const isChecked = !!umGroupUserSel[u.id];
                  const isSelected = umSelectedUser?.id === u.id;
                  return (
                    <div key={u.id} 
                      onClick={() => { 
                        setUmSelectedUser(u); 
                        setUmEditId(u.id); 
                        setUmForm({ loginId: u.loginId, password: "", rePassword: "", fullName: u.fullName || "", userType: u.userType || "User", description: u.description || "", isDefault: !!u.isDefault }); 
                        setGrSelectedUser(u);
                        setUmGroupUserSel(s => ({ ...s, [u.id]: !s[u.id] }));
                      }}
                      style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: isSelected || isChecked ? "#eff6ff" : "#ffffff", border: `1px solid ${isSelected || isChecked ? "#93c5fd" : "#e2e8f0"}`, borderRadius: "10px", cursor: "pointer", transition: "0.2s" }}
                    >
                      <div 
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "6px", background: isChecked ? "#2563eb" : "#f1f5f9", border: `1px solid ${isChecked ? "#2563eb" : "#cbd5e1"}`, cursor: "pointer", transition: "0.2s" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUmGroupUserSel(s => ({ ...s, [u.id]: !s[u.id] }));
                          setUmSelectedUser(u);
                          setUmEditId(u.id);
                          setUmForm({ loginId: u.loginId, password: "", rePassword: "", fullName: u.fullName || "", userType: u.userType || "User", description: u.description || "", isDefault: !!u.isDefault });
                        }}
                      >
                        {isChecked && <CheckCircle size={14} color="#ffffff" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#0f172a", fontSize: "14px", fontWeight: "700" }}>{u.loginId}</div>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>{u.fullName ? u.fullName + " • " : ""}{u.userType || "User"}</div>
                      </div>
                      {u.isDefault && <span style={{ fontSize: "10px", padding: "2px 6px", background: "#fef3c7", color: "#92400e", borderRadius: "4px", fontWeight: "600" }}>Default</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
)}



        {/* APPLICATION SETUP MODAL */}
        <ApplicationSetupModal />

{/* DATA UTILITY MODAL */}
        {showDataUtility && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", width: "880px", fontFamily: "Tahoma,Arial,sans-serif", fontSize: "12px", boxShadow: "4px 4px 10px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", padding: "4px" }}>

              {/* Top Warning Bar */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                <div style={{ flex: 1, background: "#222", color: "#16a34a", textAlign: "center", fontWeight: "700", padding: "4px", fontSize: "13px", letterSpacing: "1px" }}>
                  PLEASE TAKE BACKUP BEFORE CHANGING ANYTHING
                </div>
                <button onClick={() => setShowDataUtility(false)} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "2px 40px", fontWeight: "700", cursor: "pointer" }}>Close</button>
              </div>

              {/* Main Tabbed Area */}
              <div style={{ border: "1px solid var(--color-border)", borderRightColor: "#ffffff", borderBottomColor: "#ffffff", background: "#f8fafc", padding: "4px 4px 16px 4px", flex: 1, position: "relative", marginTop: "18px" }}>

                {/* Tabs */}
                <div style={{ display: "flex", gap: "4px", position: "absolute", top: "-21px", left: "4px" }}>
                  {["Item Detail", "Batch Changes", "Batch Lock", "Master/Trans.", "Disc/Margin", "Merge Data"].map(t => {
                    const tabKey = t === "Item Detail" ? "itemDetail" : t === "Batch Changes" ? "batchChanges" : t === "Batch Lock" ? "batchLock" : t === "Master/Trans." ? "masterTrans" : t === "Merge Data" ? "mergeData" : "other";
                    const isActive = dataUtilityTab === tabKey && tabKey !== "other";
                    return (
                      <div key={t} onClick={() => setDataUtilityTab(tabKey)} style={{
                        padding: "2px 14px", fontWeight: "700",
                        background: "#f8fafc", border: "2px solid",
                        borderColor: isActive ? "#ffffff #808080 #d4d0c8 #ffffff" : "#ffffff #808080 #808080 #ffffff",
                        borderBottom: isActive ? "none" : undefined,
                        paddingBottom: isActive ? "4px" : "2px",
                        zIndex: isActive ? 10 : 1,
                        cursor: "pointer"
                      }}>{t}</div>
                    );
                  })}
                </div>

                {/* Tab Content: Item Detail */}
                {dataUtilityTab === "itemDetail" && (
                  <div style={{ padding: "20px 40px" }}>

                    {/* Top 5 rows */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "26px", paddingLeft: "40px" }}>
                      {[
                        { label: "Change Unit", btn: "1 Update" },
                        { label: "Change Tax", btn: "2 Update" },
                        { label: "Change Minimum", btn: "3 Update" },
                        { label: "Change Maximum", btn: "4 Update" },
                        { label: "Change Location", btn: "5 Update" }
                      ].map((row, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", fontWeight: "700", color: "#000080" }}>
                          <div style={{ width: "120px", textAlign: "right" }}>{row.label}</div>
                          <select style={{ width: "180px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif" }}><option></option></select>
                          <div style={{ color: "#000080", fontWeight: "700", fontSize: "12px" }}>To:</div>
                          <input style={{ width: "120px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif" }} />
                          <button onClick={() => showToast(`Updated ${row.label}`)} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "2px 16px", fontWeight: "700", color: "#808080", minWidth: "90px", cursor: "pointer" }}>
                            <u>{row.btn[0]}</u> {row.btn.slice(2)}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Bulk Update Grid */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <button onClick={() => showToast("Tax updated with 0")} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "4px 16px", fontWeight: "700", color: "#000080", width: "240px", cursor: "pointer" }}><u>6</u> Update All Tax with 0</button>
                        <button onClick={() => showToast("Location updated")} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "4px 16px", fontWeight: "700", color: "#000080", width: "240px", cursor: "pointer" }}><u>7</u> Update All Location with Null</button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <button onClick={() => showToast("AdTax Allowed")} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "4px 16px", fontWeight: "700", color: "#000080", width: "250px", cursor: "pointer" }}>Update All Item with AdTax Allow</button>
                        <button onClick={() => showToast("No AdTax")} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "4px 16px", fontWeight: "700", color: "#000080", width: "250px", cursor: "pointer" }}>Update All Item with No AdTax</button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <button onClick={() => showToast("Status = On")} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "4px 16px", fontWeight: "700", color: "#000080", width: "200px", cursor: "pointer" }}>Update Item Status = On</button>
                        <button onClick={() => showToast("Creditor Tax Inv")} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "4px 16px", fontWeight: "700", color: "#000080", width: "200px", cursor: "pointer" }}>Update Creditor as Tax Inv</button>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontWeight: "700", color: "#000080", paddingLeft: "30px" }}>
                      <div>Update All Tax with :</div>
                      <input style={{ width: "80px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif" }} />
                      <button onClick={() => showToast("Tax updated")} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "4px 16px", fontWeight: "700", color: "#808080", cursor: "pointer" }}><u>8</u> Update</button>
                      <div style={{ border: "2px solid", borderColor: "#808080 #ffffff #ffffff #808080", padding: "4px 12px", display: "flex", gap: "16px", alignItems: "center", color: "#000" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}><input type="radio" name="tax_opt" checked={dataUtilTaxMode === "withZero"} onChange={() => setDataUtilTaxMode("withZero")} /> With 0 (Not Include)</label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}><input type="radio" name="tax_opt" checked={dataUtilTaxMode === "all"} onChange={() => setDataUtilTaxMode("all")} /> All</label>
                      </div>
                    </div>

                  </div>
                )}

                {/* Tab Content: Batch Changes */}
                {dataUtilityTab === "batchChanges" && (
                  <div style={{ padding: "20px 40px" }}>
                    {/* layout for batch changes */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", fontWeight: "700", color: "#000080", marginBottom: "20px" }}>
                      <div style={{ width: "180px", textAlign: "left" }}>SELECT ITEM</div>
                      <div style={{ marginRight: "4px" }}>:</div>
                      <input style={{ flex: 1, borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif" }} />
                    </div>

                    <div style={{ marginLeft: "205px", display: "flex", gap: "24px", fontWeight: "700", color: "#000080", marginBottom: "4px", fontSize: "11px" }}>
                      <div style={{ width: "80px" }}>UNIT</div>
                      <div style={{ width: "120px" }}>BATCH</div>
                      <div style={{ width: "80px" }}>EXPIRY</div>
                      <div style={{ width: "80px" }}>MRP</div>
                      <div style={{ width: "80px" }}>Stock</div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px", fontWeight: "700", color: "#000080", marginBottom: "30px" }}>
                      <div style={{ width: "180px", textAlign: "left" }}>BATCH TRANSFER FROM</div>
                      <div style={{ marginRight: "4px" }}>:</div>
                      <select style={{ width: "520px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif", background: "#c7d2fe" }}><option></option></select>
                    </div>

                    <div style={{ marginLeft: "205px", display: "flex", gap: "24px", fontWeight: "700", color: "#000080", marginBottom: "4px", fontSize: "11px" }}>
                      <div style={{ width: "80px" }}>UNIT</div>
                      <div style={{ width: "120px" }}>BATCH</div>
                      <div style={{ width: "80px" }}>EXPIRY</div>
                      <div style={{ width: "80px" }}>MRP</div>
                      <div style={{ width: "80px" }}>Stock</div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px", fontWeight: "700", color: "#000080", marginBottom: "30px" }}>
                      <div style={{ width: "180px", textAlign: "left" }}>BATCH TRANSFER INTO</div>
                      <div style={{ marginRight: "4px" }}>:</div>
                      <select style={{ width: "520px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif", background: "#fbcfe8" }}><option></option></select>
                    </div>

                    <div style={{ textAlign: "center", marginBottom: "40px" }}>
                      <button onClick={() => showToast("Transferred to Existing Batch")} style={{ background: "transparent", border: "none", borderBottom: "2px solid #64748b", paddingBottom: "2px", fontWeight: "700", color: "#000080", fontSize: "13px", cursor: "pointer" }}>
                        <u>T</u>ransfer into Existing Batch
                      </button>
                    </div>

                    <div style={{ marginLeft: "205px", display: "flex", gap: "4px", fontWeight: "700", color: "#000080", marginBottom: "4px", fontSize: "11px" }}>
                      <div style={{ width: "60px", textAlign: "center" }}>UNIT</div>
                      <div style={{ width: "110px", textAlign: "center" }}>BATCH</div>
                      <div style={{ width: "76px", textAlign: "center" }}>EXPIRY</div>
                      <div style={{ width: "80px", textAlign: "center" }}>MRP</div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px", fontWeight: "700", color: "#000080", marginBottom: "30px" }}>
                      <div style={{ width: "180px", textAlign: "left" }}>BATCH TRANSFER INTO</div>
                      <div style={{ marginRight: "4px" }}>:</div>

                      <div style={{ display: "flex" }}>
                        <input style={{ width: "60px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif", background: "#fce7f3", marginRight: "4px" }} />
                        <input style={{ width: "110px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif", background: "#fce7f3", marginRight: "4px" }} />
                        <div style={{ display: "flex", alignItems: "center", background: "#fce7f3", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", marginRight: "4px", width: "76px" }}>
                          <input style={{ width: "30px", border: "none", background: "transparent", outline: "none", textAlign: "center", padding: "2px 0", fontFamily: "Inter, sans-serif" }} />
                          <span style={{ color: "#000080", fontWeight: "700" }}>/</span>
                          <input style={{ width: "30px", border: "none", background: "transparent", outline: "none", textAlign: "center", padding: "2px 0", fontFamily: "Inter, sans-serif" }} />
                        </div>
                        <input style={{ width: "80px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif", background: "#fce7f3" }} />
                      </div>
                    </div>

                    <div style={{ textAlign: "center", paddingBottom: "20px" }}>
                      <button onClick={() => showToast("Transferred to New Batch")} style={{ background: "transparent", border: "none", borderBottom: "2px solid #64748b", paddingBottom: "2px", fontWeight: "700", color: "#000080", fontSize: "13px", cursor: "pointer" }}>
                        <u>T</u>ransfer into New Batch
                      </button>
                    </div>

                  </div>
                )}

                {/* Tab Content: Batch Lock */}
                {dataUtilityTab === "batchLock" && (
                  <div style={{ padding: "20px 40px" }}>
                    {/* layout for batch lock */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", color: "#000080", marginBottom: "30px" }}>
                      <div style={{ width: "160px", textAlign: "left" }}>SELECT ITEM....:</div>
                      <input style={{ flex: 1, maxWidth: "600px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif" }} />
                    </div>

                    <div style={{ display: "flex", gap: "24px", fontWeight: "700", color: "#000080", marginBottom: "4px", fontSize: "11px", paddingLeft: "170px" }}>
                      <div style={{ width: "60px", textAlign: "center" }}>UNIT</div>
                      <div style={{ width: "100px", textAlign: "center" }}>BATCH</div>
                      <div style={{ width: "80px", textAlign: "center" }}>EXPIRY</div>
                      <div style={{ width: "70px", textAlign: "center" }}>MRP</div>
                      <div style={{ width: "70px", textAlign: "center" }}>STOCK</div>
                      <div style={{ width: "70px", textAlign: "center" }}>STATUS</div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", color: "#000080", marginBottom: "50px" }}>
                      <div style={{ width: "160px", textAlign: "left" }}>BATCH LIST.....:</div>
                      <select style={{ flex: 1, maxWidth: "600px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif", background: "#fffbe2" }}><option></option></select>
                    </div>

                    <div style={{ display: "flex", paddingLeft: "20px", gap: "80px", marginBottom: "40px" }}>
                      {/* Left side: Radios */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontWeight: "700", color: "#000080" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <input type="radio" name="batchlock_opt" checked={dataUtilBatchLockFilter === "unlocked"} onChange={() => setDataUtilBatchLockFilter("unlocked")} /> Unlocked Batches
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <input type="radio" name="batchlock_opt" checked={dataUtilBatchLockFilter === "locked"} onChange={() => setDataUtilBatchLockFilter("locked")} /> Locked Batches
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <input type="radio" name="batchlock_opt" checked={dataUtilBatchLockFilter === "all"} onChange={() => setDataUtilBatchLockFilter("all")} /> All Batches
                        </label>
                      </div>

                      {/* Right side: Buttons */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "40px", paddingTop: "10px" }}>
                        <button onClick={() => showToast("Selected Batch Locked")} style={{ background: "transparent", border: "none", borderBottom: "2px solid #64748b", paddingBottom: "2px", fontWeight: "700", color: "#000080", fontSize: "13px", cursor: "pointer", width: "250px" }}>
                          <u>L</u>ock Selected Batch
                        </button>
                        <button onClick={() => showToast("Selected Batch Unlocked")} style={{ background: "transparent", border: "none", borderBottom: "2px solid #64748b", paddingBottom: "2px", fontWeight: "700", color: "#000080", fontSize: "13px", cursor: "pointer", width: "250px" }}>
                          <u>U</u>nlock Selected Batch
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content: Master/Trans. */}
                {dataUtilityTab === "masterTrans" && (
                  <div style={{ padding: "20px 40px", minHeight: "300px" }}>
                    {/* layout for master/trans */}
                    <div style={{ width: "180px", height: "16px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", marginBottom: "70px", marginLeft: "20px" }}></div>

                    <div style={{ marginLeft: "30px" }}>
                      <button onClick={() => showToast("Index Created Successfully")} style={{ background: "#fbcfe8", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "8px 32px", fontWeight: "700", color: "#000080", fontSize: "13px", cursor: "pointer", letterSpacing: "1px" }}>
                        Create Index
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab Content: Merge Data */}
                {dataUtilityTab === "mergeData" && (
                  <div style={{ padding: "40px 60px", minHeight: "300px" }}>
                    {/* layout for merge data */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", rowGap: "40px", columnGap: "40px" }}>
                      <div></div>
                      <div style={{ textAlign: "center" }}><button onClick={() => showToast("Batch Auto Adjust")} style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--color-border)", paddingBottom: "4px", fontWeight: "800", color: "#000080", fontSize: "12px", cursor: "pointer", width: "100%" }}>Batch Auto Adjust</button></div>
                      <div style={{ textAlign: "center" }}><button onClick={() => showToast("Shri Hari Med")} style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--color-border)", paddingBottom: "4px", fontWeight: "800", color: "#000080", fontSize: "12px", cursor: "pointer", width: "100%" }}>Shri Hari Med</button></div>

                      <div style={{ textAlign: "center" }}><button onClick={() => showToast("Batch Change")} style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--color-border)", paddingBottom: "4px", fontWeight: "800", color: "#000080", fontSize: "12px", cursor: "pointer", width: "100%" }}>Batch Change</button></div>
                      <div style={{ textAlign: "center" }}><button onClick={() => showToast("Delete New Item")} style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--color-border)", paddingBottom: "4px", fontWeight: "800", color: "#000080", fontSize: "12px", cursor: "pointer", width: "100%" }}>Delete New Item</button></div>
                      <div style={{ textAlign: "center" }}><button onClick={() => showToast("Delete Batch")} style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--color-border)", paddingBottom: "4px", fontWeight: "800", color: "#000080", fontSize: "12px", cursor: "pointer", width: "100%" }}>Delete Batch</button></div>

                      <div style={{ textAlign: "center" }}><button onClick={() => showToast("Batch Report")} style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--color-border)", paddingBottom: "4px", fontWeight: "800", color: "#000080", fontSize: "12px", cursor: "pointer", width: "100%" }}>Batch Report</button></div>
                      <div style={{ textAlign: "center" }}><button onClick={() => showToast("Stock No Check")} style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--color-border)", paddingBottom: "4px", fontWeight: "800", color: "#000080", fontSize: "12px", cursor: "pointer", width: "100%" }}>Stock No Check</button></div>
                      <div></div>

                      <div style={{ textAlign: "center" }}><button onClick={() => showToast("Indexing")} style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--color-border)", paddingBottom: "4px", fontWeight: "800", color: "#000080", fontSize: "12px", cursor: "pointer", width: "100%" }}>Indexing</button></div>
                      <div style={{ textAlign: "center" }}><button onClick={() => showToast("Stock Item Check")} style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--color-border)", paddingBottom: "4px", fontWeight: "800", color: "#000080", fontSize: "12px", cursor: "pointer", width: "100%" }}>Stock Item Check</button></div>
                      <div></div>

                      <div style={{ textAlign: "center" }}><button onClick={() => showToast("Add New Item")} style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--color-border)", paddingBottom: "4px", fontWeight: "800", color: "#000080", fontSize: "12px", cursor: "pointer", width: "100%" }}>Add New Item</button></div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>
                )}

                {dataUtilityTab !== "itemDetail" && dataUtilityTab !== "batchChanges" && dataUtilityTab !== "batchLock" && dataUtilityTab !== "masterTrans" && dataUtilityTab !== "mergeData" && (
                  <div style={{ padding: "80px", textAlign: "center", color: "#000080", fontWeight: "700" }}>
                    Coming Soon...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MERGE FACILITY MODAL */}
        {showMergeFacility && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "20px" }}>
            <div style={{ background: "#1084d0", padding: "2px", boxShadow: "4px 4px 10px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>
              <div style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", width: "880px", fontFamily: "Tahoma,Arial,sans-serif", fontSize: "12px", display: "flex", flexDirection: "column" }}>
                {/* Title Bar */}
                <div style={{ background: "linear-gradient(90deg,#000080,#1084d0)", padding: "3px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--color-text-dark)", fontWeight: "700", fontSize: "12px" }}>GST Ver. 1003A - [Merging Data]</span>
                  <button onClick={() => setShowMergeFacility(false)} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", width: "16px", height: "14px", cursor: "pointer", fontSize: "10px", fontWeight: "700", lineHeight: 1, padding: 0 }}>✕</button>
                </div>

                {/* Banner */}
                <div style={{ background: "#fffbe2", color: "#cc0000", textAlign: "center", fontWeight: "800", fontSize: "28px", padding: "4px", borderBottom: "1px solid var(--color-border)", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "Arial", letterSpacing: "1px" }}>mjR krta phela bekYAp lo</span>
                </div>

                <div style={{ padding: "8px" }}>
                  {/* Top Options Bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "8px", borderBottom: "2px solid #fff" }}>
                    <div style={{ display: "flex", gap: "40px", fontWeight: "700", color: "#000080" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input type="radio" name="mergeopt" checked={mergeFacilityOpt === "delete"} onChange={() => setMergeFacilityOpt("delete")} /> Delete Item/Account after Merging
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input type="radio" name="mergeopt" checked={mergeFacilityOpt === "nodelete"} onChange={() => setMergeFacilityOpt("nodelete")} /> Do Not Delete Item/Account after Merging
                      </label>
                    </div>
                    <button onClick={() => setShowMergeFacility(false)} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "2px 20px", fontWeight: "700", cursor: "pointer" }}><u>C</u>lose</button>
                  </div>

                  {/* Rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingLeft: "10px", paddingRight: "10px", marginBottom: "20px" }}>
                    {[
                      { label: "Merge Item :", withLabel: "With Item :", btn: "1 Merge", type: "input" },
                      { label: "Merge Company :", withLabel: "With Company :", btn: "2 Merge", type: "select" },
                      { label: "Merge Supplier :", withLabel: "With Supplier :", btn: "3 Merge", type: "select" },
                      { label: "Merge Debtor :", withLabel: "With Debtor :", btn: "4 Merge", type: "select" },
                      { label: "Merge Generic :", withLabel: "With Generic :", btn: "5 Merge", type: "select" },
                      { label: "Merge Doctor :", withLabel: "With Doctor :", btn: "6 Merge", type: "select" },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: "2px solid #fff", paddingBottom: "12px" }}>
                        <div style={{ width: "280px" }}>
                          <div style={{ background: "#aa2222", color: "#fff", fontWeight: "700", padding: "2px 8px", border: "2px solid", borderColor: "#808080 #ffffff #ffffff #808080", marginBottom: "4px", width: "max-content" }}>{row.label}</div>
                          {row.type === "input" ? (
                            <input style={{ width: "100%", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif" }} />
                          ) : (
                            <select style={{ width: "100%", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif" }}><option></option></select>
                          )}
                        </div>

                        <div style={{ width: "280px", marginLeft: "40px" }}>
                          <div style={{ background: "#2222aa", color: "#fff", fontWeight: "700", padding: "2px 8px", border: "2px solid", borderColor: "#808080 #ffffff #ffffff #808080", marginBottom: "4px", width: "max-content" }}>{row.withLabel}</div>
                          {row.type === "input" ? (
                            <input style={{ width: "100%", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif" }} />
                          ) : (
                            <select style={{ width: "100%", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif" }}><option></option></select>
                          )}
                        </div>

                        <div style={{ flex: 1, textAlign: "right", paddingRight: "20px" }}>
                          <button onClick={() => showToast(`Merged ${row.label.split(' ')[1]}`)} style={{ background: "transparent", border: "none", borderBottom: "2px solid #64748b", paddingBottom: "2px", fontWeight: "700", color: "#000080", fontSize: "13px", cursor: "pointer", width: "100px" }}>
                            <u>{row.btn[0]}</u> {row.btn.slice(2)}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Read Only Rows */}
                  <div style={{ background: "#fce7f3", padding: "8px 20px", borderTop: "2px solid #ffffff", borderBottom: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "4px", fontWeight: "700", color: "#000080", fontSize: "13px" }}>
                    <div>Merge Item :</div>
                    <div>Merge Item :</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* STOCK RATE DETAIL MODAL */}
        {showStockRateDetail && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#1084d0", padding: "2px", boxShadow: "4px 4px 10px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>
              <div style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", width: "1000px", height: "600px", fontFamily: "Tahoma,Arial,sans-serif", fontSize: "12px", display: "flex", flexDirection: "column" }}>

                {/* Top Filter Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px", borderBottom: "1px solid var(--color-border)", marginBottom: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontWeight: "700", color: "#000000" }}>Company:</label>
                    <select style={{ width: "200px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px", fontFamily: "Inter, sans-serif" }}><option></option></select>
                    <button onClick={() => showToast("All Companies Selected")} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "1px 16px", fontWeight: "700", cursor: "pointer" }}>All</button>
                    <button onClick={() => showToast("LP Calculated")} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "1px 16px", fontWeight: "700", cursor: "pointer" }}>Calculate LP</button>
                  </div>
                  <button onClick={() => setShowStockRateDetail(false)} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "1px 16px", fontWeight: "700", cursor: "pointer" }}><u>C</u>lose</button>
                </div>

                {/* Table Container */}
                <div style={{ flex: 1, backgroundColor: "#e3e3e3", border: "1px solid var(--color-border)", borderRightColor: "#ffffff", borderBottomColor: "#ffffff", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", margin: "2px", paddingBottom: "2px" }}>

                  {/* Headers */}
                  <div style={{ display: "flex", background: "#99b4d1", color: "#000000", fontWeight: "700", borderBottom: "1px solid #808080" }}>
                    {[{ label: "SrNo", w: "40px" }, { label: "ItemName", w: "240px" }, { label: "Tax", w: "60px" }, { label: "Unit", w: "50px" }, { label: "Batch", w: "100px" }, { label: "Expiry", w: "70px" }, { label: "Mrp", w: "70px" }, { label: "SRate", w: "70px" }, { label: "PRate", w: "70px" }, { label: "LP", w: "70px" }, { label: "Open", w: "60px" }, { label: "Curr.", w: "60px" }].map((h, i) => (
                      <div key={i} style={{ width: h.w, padding: "4px", borderRight: "1px solid #808080", borderLeft: "1px solid #ffffff", textAlign: i === 0 ? "center" : "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.label}</div>
                    ))}
                  </div>

                  {/* Blank Data Row / Filter Input Row */}
                  <div style={{ display: "flex", background: "#b0c4de", borderBottom: "1px solid #808080" }}>
                    {[{ w: "40px" }, { w: "240px" }, { w: "60px" }, { w: "50px" }, { w: "100px" }, { w: "70px" }, { w: "70px" }, { w: "70px" }, { w: "70px" }, { w: "70px" }, { w: "60px" }, { w: "60px" }].map((h, i) => (
                      <div key={i} style={{ width: h.w, height: "18px", borderRight: "1px solid #808080", borderLeft: "1px solid #ffffff" }}></div>
                    ))}
                  </div>

                  {/* Empty Table Body */}
                  <div style={{ flex: 1, background: "#e3e3e3" }}></div>

                </div>

              </div>
            </div>
          </div>
        )}

        {/* BILL LOCK MODAL */}
        {showLockBill && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#1084d0", padding: "2px", boxShadow: "4px 4px 10px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>
              <div style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", width: "720px", fontFamily: "Tahoma,Arial,sans-serif", fontSize: "12px", display: "flex", flexDirection: "column" }}>
                {/* Title Bar */}
                <div style={{ background: "linear-gradient(90deg,#000080,#1084d0)", padding: "3px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--color-text-dark)", fontWeight: "700", fontSize: "12px" }}>GST Ver. 1003A - [Bill Lock]</span>
                  <button onClick={() => setShowLockBill(false)} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", width: "16px", height: "14px", cursor: "pointer", fontSize: "10px", fontWeight: "700", lineHeight: 1, padding: 0 }}>✕</button>
                </div>

                {/* Content */}
                <div style={{ padding: "20px", display: "flex", gap: "40px", background: "#c4ccdc" }}>
                  {/* Left: Books and Dates */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", fontWeight: "700", color: "#000080", marginBottom: "8px", paddingLeft: "200px" }}>
                      <div style={{ width: "120px", textAlign: "center" }}>From:</div>
                      <div style={{ width: "120px", textAlign: "center" }}>To:</div>
                    </div>
                    {lockBillData.map((b, idx) => (
                      <div key={b.id} style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                        <input type="checkbox" checked={b.checked} onChange={e => {
                          const newData = [...lockBillData];
                          newData[idx].checked = e.target.checked;
                          setLockBillData(newData);
                        }} style={{ marginRight: "8px", cursor: "pointer" }} />
                        <span style={{ width: "200px", fontFamily: "Courier New,monospace", fontSize: "13px", fontWeight: "700", color: "#000080", letterSpacing: "1px" }}>{b.label}{".".repeat(Math.max(2, 22 - b.label.length))}:</span>
                        <div style={{ background: "#fff", border: "1px solid var(--color-border)", display: "flex", marginRight: "16px" }}>
                          <input type="date" value={b.from} onChange={e => {
                            const newData = [...lockBillData];
                            newData[idx].from = e.target.value;
                            setLockBillData(newData);
                          }} style={{ width: "110px", border: "none", outline: "none", padding: "1px 4px", fontFamily: "Inter, sans-serif", fontSize: "11px", background: "transparent" }} />
                        </div>
                        <div style={{ background: "#fff", border: "1px solid var(--color-border)", display: "flex" }}>
                          <input type="date" value={b.to} onChange={e => {
                            const newData = [...lockBillData];
                            newData[idx].to = e.target.value;
                            setLockBillData(newData);
                          }} style={{ width: "110px", border: "none", outline: "none", padding: "1px 4px", fontFamily: "Inter, sans-serif", fontSize: "11px", background: "transparent" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right: Buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100px", paddingTop: "16px" }}>
                    <button onClick={() => { showToast("Bills locked successfully!"); setShowLockBill(false); }} style={{ background: "#c5d0a6", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "4px 8px", fontWeight: "700", color: "#000080", cursor: "pointer" }}><u>U</u>pdate</button>
                    <button onClick={() => setShowLockBill(false)} style={{ background: "#d0a6a6", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "4px 8px", fontWeight: "700", color: "#000080", cursor: "pointer" }}><u>C</u>lose</button>
                    <button onClick={() => { showToast("Bills unlocked!"); setShowLockBill(false); }} style={{ background: "#e0d4e5", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "4px 8px", fontWeight: "700", color: "#000080", cursor: "pointer" }}>U<u>n</u>lock</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GROUP/USER RIGHTS MODAL */}
{showGroupRights && (
  <div style={{ position: "fixed", inset: 0, background: "#ffffff", zIndex: 9999, display: "flex", flexDirection: "column", width: "100vw", height: "100vh", overflow: "hidden", fontFamily: "Inter, sans-serif" }}>
      
      {/* Header */}
      <div style={{ background: "linear-gradient(90deg, #1e3a8a, #0f172a)", padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Users size={18} color="#93c5fd" />
          <span style={{ color: "#ffffff", fontWeight: "700", fontSize: "15px", letterSpacing: "0.5px" }}>Group / User Rights Management</span>
        </div>
        <button onClick={() => setShowGroupRights(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.9)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}><X size={18} /></button>
      </div>

      {/* Toolbar */}
      <div style={{ background: "#f8fafc", padding: "10px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {[
          { label: "Select All", action: () => {
              if(!grSelectedUser) { showToast("Select a user from the left first!", "error"); return; }
              const r = {}; MENU_RIGHTS_LIST.forEach(m => { r[m] = true; });
              const next = { ...grUserRights, [grSelectedUser.id]: r };
              setGrUserRights(next);
              save("store_gr_rights", next);
              try { localStorage.setItem("store_gr_rights", JSON.stringify(next)); } catch (_) {}
              showToast("All rights granted!");
            } 
          },
          { label: "Remove All", action: () => {
              if(!grSelectedUser) { showToast("Select a user from the left first!", "error"); return; }
              const next = { ...grUserRights, [grSelectedUser.id]: {} };
              setGrUserRights(next);
              save("store_gr_rights", next);
              try { localStorage.setItem("store_gr_rights", JSON.stringify(next)); } catch (_) {}
              showToast("All rights removed!");
            } 
          },
          { label: "Save", action: () => {
              save("store_gr_rights", grUserRights);
              try { localStorage.setItem("store_gr_rights", JSON.stringify(grUserRights)); } catch (_) {}
              showToast("Rights saved successfully!");
            }, primary: true 
          },
          { label: "Close", action: () => setShowGroupRights(false), danger: true }
        ].map(btn => (
          <button key={btn.label}
            onClick={btn.action}
            style={{ 
              padding: "7px 16px", 
              background: btn.primary ? "#2563eb" : btn.danger ? "#fee2e2" : "#ffffff", 
              border: btn.primary ? "1px solid #1d4ed8" : btn.danger ? "1px solid #fecaca" : "1px solid #cbd5e1",
              color: btn.primary ? "#ffffff" : btn.danger ? "#dc2626" : "#334155",
              borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "0.2s" 
            }}
          >
            {btn.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {grSelectedUser && <span style={{ color: "#475569", fontSize: "13px", fontWeight: "600" }}>Selected User: <span style={{ color: "#2563eb", fontWeight: "700" }}>{grSelectedUser.loginId}</span></span>}
      </div>

      {/* Main Content (2 Columns) */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Col: Users */}
        <div style={{ width: "260px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
          <div style={{ padding: "12px 18px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "12px", fontWeight: "700", letterSpacing: "1px" }}>USERS ({appUsers.length})</div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {appUsers.map(u => (
                <div key={u.id} 
                  onClick={() => setGrSelectedUser(u)}
                  style={{ 
                    padding: "10px 14px", 
                    background: grSelectedUser?.id === u.id ? "#eff6ff" : "transparent",
                    border: `1px solid ${grSelectedUser?.id === u.id ? "#93c5fd" : "transparent"}`,
                    borderRadius: "8px", cursor: "pointer", transition: "0.2s",
                    display: "flex", alignItems: "center", gap: "10px"
                  }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: grSelectedUser?.id === u.id ? "#3b82f6" : "#cbd5e1" }} />
                  <div style={{ color: grSelectedUser?.id === u.id ? "#1e3a8a" : "#334155", fontSize: "14px", fontWeight: grSelectedUser?.id === u.id ? "700" : "500" }}>{u.loginId}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Menu Rights */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#ffffff" }}>
          <div style={{ padding: "12px 24px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "12px", fontWeight: "700", letterSpacing: "1px" }}>MENU SELECTION FOR RIGHTS</div>
          
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {!grSelectedUser ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "14px" }}>Select a user from the left to configure rights.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                {MENU_RIGHTS_LIST.map(item => {
                  const isActive = !!(grUserRights[grSelectedUser?.id || "_"]?.[item]);
                  return (
                    <div key={item} 
                      onClick={() => {
                        const userRights = { ...(grUserRights[grSelectedUser.id] || {}), [item]: !isActive };
                        const next = { ...grUserRights, [grSelectedUser.id]: userRights };
                        setGrUserRights(next);
                        save("store_gr_rights", next);
                        try { localStorage.setItem("store_gr_rights", JSON.stringify(next)); } catch (_) {}
                      }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: isActive ? "#f0fdf4" : "#ffffff", border: `1px solid ${isActive ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: "8px", cursor: "pointer", transition: "0.2s" }}
                    >
                      <span style={{ color: isActive ? "#15803d" : "#475569", fontSize: "13px", fontWeight: "600" }}>{item}</span>
                      
                      {/* Modern Toggle Switch */}
                      <div style={{ width: "38px", height: "20px", background: isActive ? "#22c55e" : "#cbd5e1", borderRadius: "20px", position: "relative", transition: "background 0.3s" }}>
                        <div style={{ position: "absolute", top: "2px", left: isActive ? "20px" : "2px", width: "16px", height: "16px", background: "#ffffff", borderRadius: "50%", transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
)}
        {/* ══ BACKUP DOWNLOAD MODAL ══ */}
        {showBackupPassModal && !showForgotBackupPass && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#1e293b", borderRadius: "12px", padding: "28px", width: "360px", border: "1px solid #334155", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--color-text-dark)", marginBottom: "4px" }}>🔐 Backup Password</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>Enter password to download backup</div>
              
              <input
                type="password"
                placeholder="Enter password..."
                value={backupPassInput}
                onChange={e => setBackupPassInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doEncryptedBackup()}
                autoFocus
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "var(--color-text-dark)", fontSize: "14px", boxSizing: "border-box", outline: "none", marginBottom: "10px" }}
              />

              {backupPassError && <div style={{ color: "#dc2626", fontSize: "12px", marginBottom: "12px" }}>{backupPassError}</div>}

              <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => { setShowForgotBackupPass(true); setForgotOldPass(""); setForgotNewPass(""); setForgotConfirmPass(""); setBackupPassError(""); }}
                  style={{ padding: "6px 10px", borderRadius: "6px", border: "none", background: "transparent", color: "#2563eb", cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}
                >🔁 Forgot Password?</button>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => { setShowBackupPassModal(false); setBackupPassInput(""); setBackupPassError(""); }} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #475569", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
                  <button onClick={doEncryptedBackup} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#f59e0b", color: "#000", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}>💾 Download</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ══ CHANGE LOGIN PASSWORD MODAL ══ */}
        {showBackupPassModal && showForgotBackupPass && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#1e293b", borderRadius: "12px", padding: "28px", width: "400px", border: "1px solid #334155", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--color-text-dark)", marginBottom: "4px" }}>🔑 Login Password Change Karo</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px", lineHeight: "1.6" }}>Your <b style={{ color: "#d97706" }}>Login password</b> will change — old password will be verified first</div>

              {/* OLD PASSWORD */}
              <div style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "11px", color: "#64748b", display: "block", marginBottom: "4px" }}>🔒 Juno Password (Current)</label>
                <input
                  type="password"
                  placeholder="Enter old password..."
                  value={forgotOldPass}
                  onChange={e => { setForgotOldPass(e.target.value); (() => {})(""); }}
                  autoFocus
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "var(--color-text-dark)", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                />
              </div>

              {/* DIVIDER */}
              <div style={{ borderTop: "1px solid #334155", margin: "14px 0" }} />

              {/* NEW PASSWORD */}
              <div style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "11px", color: "#64748b", display: "block", marginBottom: "4px" }}>🆕 Navo Password</label>
                <input
                  type="password"
                  placeholder="Enter new password..."
                  value={forgotNewPass}
                  onChange={e => { setForgotNewPass(e.target.value); (() => {})(""); }}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "var(--color-text-dark)", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: "6px" }}>
                <label style={{ fontSize: "11px", color: "#64748b", display: "block", marginBottom: "4px" }}>✅ Navo Password Confirm</label>
                <input
                  type="password"
                  placeholder="Confirm new password..."
                  value={forgotConfirmPass}
                  onChange={e => { setForgotConfirmPass(e.target.value); (() => {})(""); }}
                  onKeyDown={e => e.key === "Enter" && handleForgotBackupPass()}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "var(--color-text-dark)", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                />
              </div>

              {backupPassError && <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "8px", background: "rgba(248,113,113,0.1)", padding: "8px 10px", borderRadius: "6px" }}>{backupPassError}</div>}

              <div style={{ display: "flex", gap: "8px", marginTop: "20px", justifyContent: "flex-end" }}>
                <button onClick={() => { setShowForgotBackupPass(false); setForgotOldPass(""); setForgotNewPass(""); setForgotConfirmPass(""); (() => {})(""); }} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #475569", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: "13px" }}>← Back</button>
                <button onClick={handleForgotBackupPass} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}>🔁 Password Change Karo</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ RESTORE PASSWORD MODAL ══ */}
        {showRestorePassModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#1e293b", borderRadius: "12px", padding: "28px", width: "340px", border: "1px solid #334155", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--color-text-dark)", marginBottom: "6px" }}>🔑 Restore Data</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>Enter your Login Password (used during backup) to restore</div>
              <input
                type="password"
                placeholder="Enter Login Password..."
                value={restorePassInput}
                onChange={e => setRestorePassInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doRestoreData()}
                autoFocus
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "var(--color-text-dark)", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
              />
              {backupPassError && <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "8px" }}>{backupPassError}</div>}
              <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
                <button onClick={() => { setShowRestorePassModal(false); setRestorePassInput(""); }} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #475569", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
                <button onClick={doRestoreData} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#22c55e", color: "#000", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}>✅ Restore</button>
              </div>
            </div>
          </div>
        )}



        {/* ══════════════════════════════════════════
            BARCODE — NEW ITEM MODAL
        ══════════════════════════════════════════ */}
        {barcodeNewItemModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }}>
            <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "480px", maxHeight: "92vh", overflow: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>

              {/* ── Header ── */}
              <div style={{
                padding: "14px 18px", borderRadius: "16px 16px 0 0", background:
                  barcodeFetching ? "#6366f1" : barcodeFetchSource ? "#16a34a" : "#f59e0b",
                color: "var(--color-text-dark)", transition: "background 0.3s"
              }}>
                <div style={{ fontWeight: "800", fontSize: "15px" }}>
                  {barcodeFetching
                    ? "🔍 Searching on the internet..."
                    : barcodeFetchSource
                      ? "✅ Product info found — Please confirm"
                      : "📦 Navo Item — Details bharvo"}
                </div>
                <div style={{ fontSize: "11px", opacity: 0.9, marginTop: "2px" }}>
                  Barcode: <b>{barcodeNewItemModal.code}</b>
                  {barcodeFetchSource && <span> · 🤖 {barcodeFetchSource}</span>}
                  <span style={{ marginLeft: "8px", background: "rgba(255,255,255,0.25)", padding: "1px 8px", borderRadius: "8px" }}>
                    {barcodeNewItemModal.target === 'inventory' ? '📦 Inventory' :
                      barcodeNewItemModal.target === 'purchase' ? '📋 Purchase Bill' : '🧾 Sales Bill'}
                  </span>
                </div>
              </div>

              {/* ── Loading ── */}
              {barcodeFetching ? (
                <div style={{ padding: "32px 20px", textAlign: "center", color: "#6366f1" }}>
                  <div style={{ fontSize: "36px", marginBottom: "10px", display: "inline-block", animation: "spin 1s linear infinite" }}>🔄</div>
                  <div style={{ fontWeight: "700", fontSize: "15px", marginBottom: "6px" }}>🔍 Searching in product database...</div>
                  <div style={{ fontSize: "12px", color: "#a5b4fc", marginBottom: "12px" }}>Dove, Colgate, Himalaya, Patanjali, Dabur...</div>
                  <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", color: "#e0e7ff", fontFamily: "monospace", letterSpacing: "1px" }}>
                    {barcodeNewItemModal?.code}
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "11px", color: "#a5b4fc" }}>2-3 seconds lagse...</div>
                </div>
              ) : (
                <div style={{ padding: "16px 18px" }}>

                  {/* ── Item Fields ── */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                    <div style={{ gridColumn: "1/-1" }}>
                      <label style={lbl}>📂 Category *</label>
                      <select value={barcodeNewItemForm.division || ""} onChange={e => setBarcodeNewItemForm(f => ({ ...f, division: e.target.value }))} style={{ ...inp, fontWeight: "700" }}>
                        {DIVISIONS.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: "1/-1" }}>
                      <label style={lbl}>💊 Item Name *</label>
                      <input value={barcodeNewItemForm.name || ""} onChange={e => setBarcodeNewItemForm(f => ({ ...f, name: e.target.value }))}
                        style={{ ...inp, fontWeight: "700", border: barcodeNewItemForm.name ? "2px solid #16a34a" : "2px solid #fca5a5" }}
                        placeholder="Enter Medicine / Product name" autoFocus />
                    </div>
                    <div>
                      <label style={lbl}>🏢 Company</label>
                      <input value={barcodeNewItemForm.company || ""} onChange={e => setBarcodeNewItemForm(f => ({ ...f, company: e.target.value }))}
                        style={inp} placeholder="Manufacturer" />
                    </div>
                    <div>
                      <label style={lbl}>📦 Unit</label>
                      <select value={barcodeNewItemForm.unit || "strip"} onChange={e => setBarcodeNewItemForm(f => ({ ...f, unit: e.target.value }))} style={inp}>
                        {["strip", "tablet", "bottle", "tube", "box", "packet", "sachet", "vial", "kg", "gm", "ml", "pair", "piece"].map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>💰 MRP (₹)</label>
                      <input type="number" value={barcodeNewItemForm.mrp || ""} onChange={e => setBarcodeNewItemForm(f => ({ ...f, mrp: e.target.value }))}
                        style={inp} placeholder="0" />
                    </div>
                    <div>
                      <label style={lbl}>🏷️ Purchase Rate (₹)</label>
                      <input type="number" value={barcodeNewItemForm.pRate || ""} onChange={e => setBarcodeNewItemForm(f => ({ ...f, pRate: e.target.value }))}
                        style={inp} placeholder="0" />
                    </div>
                    <div>
                      <label style={lbl}>📊 GST %</label>
                      <select value={barcodeNewItemForm.gst || "5"} onChange={e => setBarcodeNewItemForm(f => ({ ...f, gst: e.target.value }))} style={inp}>
                        {["0", "5", "12", "18", "28"].map(g => <option key={g} value={g}>{g}%</option>)}
                      </select>
                    </div>
                    {barcodeNewItemModal.target === 'inventory' && (
                      <div>
                        <label style={lbl}>📦 Opening Stock</label>
                        <input type="number" value={barcodeNewItemForm.stock || "0"} onChange={e => setBarcodeNewItemForm(f => ({ ...f, stock: e.target.value }))}
                          style={inp} />
                      </div>
                    )}
                    <div>
                      <label style={lbl}>🔖 HSN Code</label>
                      <input value={barcodeNewItemForm.hsn || ""} onChange={e => setBarcodeNewItemForm(f => ({ ...f, hsn: e.target.value }))}
                        style={inp} placeholder="30049099" />
                    </div>
                  </div>

                  {/* ── Barcode chip ── */}
                  <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "8px 12px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #e2e8f0" }}>
                    <span>🔍</span>
                    <span style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "13px", flex: 1 }}>{barcodeNewItemModal.code}</span>

                    {barcodeFetchSource && <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "700" }}>✅ Auto-filled</span>}
                  </div>

                  {/* ── Buttons ── */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => { setBarcodeNewItemModal(null); setBarcodeNewItemForm({}); setBarcodeFetching(false); setBarcodeFetchSource(""); }}
                      style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), flex: 1 }}><X size={14} />Cancel</button>
                    <button onClick={handleBarcodeNewItemSave}
                      style={{ ...btn(barcodeFetchSource ? "#16a34a" : "#f59e0b"), flex: 2, fontWeight: "800" }}>
                      <Plus size={14} />
                      {barcodeNewItemModal.target === 'inventory'
                        ? "Inventory Ma Add Karo ✓"
                        : "Inventory + Bill Ma Add ✓"}
                    </button>
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", textAlign: "center", marginTop: "8px" }}>
                    {barcodeNewItemModal.target !== 'inventory' && "Item inventory ma save thashe → pachhi qty nakhi → bill ma add thashe"}
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            CAMERA BARCODE SCANNER
      ══════════════════════════════════════════ */}
        {showCameraScanner && (
          <CameraBarcodeScanner
            onDetected={(code) => {
              setShowCameraScanner(false);
              handleBarcodeDetected(code, scannerTarget);
            }}
            onClose={() => setShowCameraScanner(false)}
          />
        )}

        {/* ══════════════════════════════════════════
            LABEL PRINT MODAL
        ══════════════════════════════════════════ */}
        {showLabelPrint && labelItem && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "white", borderRadius: "14px", width: "100%", maxWidth: "500px", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
              <div style={{ padding: "14px 18px", background: "#7c3aed", color: "var(--color-text-dark)", borderRadius: "14px 14px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "800", fontSize: "15px" }}>🏷️ Label Print — {labelItem.name}</span>
                <button onClick={() => setShowLabelPrint(false)} style={{ background: "transparent", border: "none", color: "var(--color-text-dark)", fontSize: "20px", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ padding: "18px" }}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={lbl}>Kitna Labels Print Karna Hai?</label>
                  <input type="number" min="1" max="100" value={labelQty} onChange={e => setLabelQty(Math.max(1, int(e.target.value)))} style={{ ...inp, width: "100px" }} />
                </div>
                {/* Label Preview */}
                <div id="label-preview" style={{ border: "2px dashed #7c3aed", borderRadius: "8px", padding: "12px", marginBottom: "14px", background: "#faf5ff" }}>
                  <div style={{ fontWeight: "900", fontSize: "14px", color: "var(--color-text-dark)", marginBottom: "2px" }}>{labelItem.name}</div>
                  {labelItem.company && <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>{labelItem.company}</div>}
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "700" }}>MRP: ₹{labelItem.mrp}</span>
                    {labelItem.gst > 0 && <span>GST: {labelItem.gst}%</span>}
                    {labelItem.hsn && <span>HSN: {labelItem.hsn}</span>}
                  </div>
                  {labelItem.barcode && <div style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: "900", color: "#000", letterSpacing: "2px" }}>||||| {labelItem.barcode} |||||</div>}
                  <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>Shiv Dhara Medical Store, Nikol, Ahmedabad</div>
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button onClick={() => setShowLabelPrint(false)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)") }}>Cancel</button>
                  <button onClick={() => {
                    let html = "<html><head><style>@media print{@page{margin:5mm;size:60mm 40mm;}body{margin:0;}}.label{width:58mm;height:38mm;border:1px solid #ccc;padding:4mm;font-family:Arial,sans-serif;box-sizing:border-box;page-break-after:always;display:flex;flex-direction:column;justify-content:space-between;}.nm{font-weight:900;font-size:11px;}.co{font-size:9px;color:#666;}.row{display:flex;gap:8px;font-size:9px;}.mrp{font-weight:900;font-size:12px;}.bc{font-family:monospace;font-size:11px;font-weight:900;letter-spacing:2px;}.ft{font-size:8px;color:#666;}</style></head><body>";
                    for (let i = 0; i < labelQty; i++) {
                      html += `<div class='label'><div><div class='nm'>${labelItem.name}</div>${labelItem.company ? `<div class='co'>${labelItem.company}</div>` : ""}</div><div class='row'><span class='mrp'>MRP: ₹${labelItem.mrp}</span>${labelItem.gst > 0 ? `<span>GST:${labelItem.gst}%</span>` : ""}</div>${labelItem.barcode ? `<div class='bc'>|||${labelItem.barcode}|||</div>` : ""}<div class='ft'>Shiv Dhara Medical, Nikol, Ahmedabad</div></div>`;
                    }
                    html += "</body></html>";
                    const w = window.open("", "_blank", "width=600,height=400");
                    w.document.write(html);
                    w.document.close();
                    w.focus();
                    setTimeout(() => { w.print(); }, 500);
                    setShowLabelPrint(false);
                  }} style={{ ...btn("#7c3aed") }}><Printer size={14} /> Print {labelQty} Label{labelQty > 1 ? "s" : ""}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            SUPPLIER LEDGER MODAL
        ══════════════════════════════════════════ */}
        {showSupplierLedger && ledgerSupplierId && (() => {
          const ld = getSupplierLedger(ledgerSupplierId);
          if (!ld.supplier) return null;
          let running = 0;
          return (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
              <div style={{ background: "white", borderRadius: "14px", width: "100%", maxWidth: "750px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
                <div style={{ padding: "16px 20px", background: "#7c3aed", color: "var(--color-text-dark)", borderRadius: "14px 14px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "800", fontSize: "16px" }}>📒 {ld.supplier.name} — Ledger</div>
                    <div style={{ fontSize: "12px", opacity: 0.85 }}>{ld.supplier.phone || ""} {ld.supplier.city ? `| ${ld.supplier.city}` : ""}</div>
                  </div>
                  <button onClick={() => setShowSupplierLedger(false)} style={{ ...btn("#ffffff22"), color: "var(--color-text-dark)", fontSize: "18px", padding: "4px 10px" }}>✕</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", padding: "14px 16px", background: "#f5f3ff" }}>
                  {[
                    { l: "Total Purchase", v: "₹" + fmt(ld.totalPurchase), c: "var(--color-primary)" },
                    { l: "Total Returns", v: "₹" + fmt(ld.totalReturns || 0), c: "#dc2626" },
                    { l: "Total Paid", v: "₹" + fmt(ld.totalPaid), c: "#16a34a" },
                  ].map(s => (
                    <div key={s.l} style={{ background: "white", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid #ede9fe" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>{s.l}</div>
                      <div style={{ fontSize: "16px", fontWeight: "800", color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "8px 16px", background: ld.outstanding > 0 ? "#fef2f2" : "#f0fdf4", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
                  <span style={{ fontWeight: "700", color: "#64748b" }}>Outstanding Balance:</span>
                  <span style={{ fontWeight: "900", fontSize: "18px", color: ld.outstanding > 0 ? "#dc2626" : "#16a34a" }}>{ld.outstanding > 0 ? "▲" : "✅"} ₹{fmt(Math.abs(ld.outstanding))}</span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead><tr style={{ background: "#7c3aed", color: "var(--color-text-dark)" }}>
                      {["Date", "Type", "Reference", "Debit (Dr)", "Credit (Cr)", "Balance"].map(h => <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: "700" }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {ld.entries.length === 0 ? <tr><td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>No transactions</td></tr> :
                        ld.entries.map((e, i) => {
                          running += e.dr - e.cr;
                          return (
                            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#faf5ff" }}>
                              <td style={{ padding: "8px 10px" }}>{new Date(e.date).toLocaleDateString("en-IN")}</td>
                              <td style={{ padding: "8px 10px" }}><span style={{ background: e.dr > 0 ? "#fef2f2" : "#f0fdf4", color: e.dr > 0 ? "#dc2626" : "#16a34a", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>{e.type}</span></td>
                              <td style={{ padding: "8px 10px", color: "#64748b" }}>{e.ref}</td>
                              <td style={{ padding: "8px 10px", color: "#dc2626", fontWeight: "700" }}>{e.dr > 0 ? "₹" + fmt(e.dr) : "-"}</td>
                              <td style={{ padding: "8px 10px", color: "#16a34a", fontWeight: "700" }}>{e.cr > 0 ? "₹" + fmt(e.cr) : "-"}</td>
                              <td style={{ padding: "8px 10px", fontWeight: "800", color: running > 0 ? "#dc2626" : "#16a34a" }}>₹{fmt(Math.abs(running))}{running > 0 ? " Dr" : " Cr"}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button onClick={() => setShowSupplierLedger(false)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)") }}>Close</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════
            BARCODE QTY MODAL
        ══════════════════════════════════════════ */}
        {barcodeQtyModal && (() => {
          const isPurchase = barcodeQtyModal.target === 'purchase';
          const overStock = !isPurchase && int(barcodeQtyInput) > barcodeQtyModal.maxQty;
          const noStock = !isPurchase && barcodeQtyModal.maxQty === 0;
          const { item } = barcodeQtyModal;
          const div = DIVISIONS.find(d => d.id === item.division) || DIVISIONS[0];
          return (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "white", borderRadius: "16px", padding: "28px", minWidth: "320px", maxWidth: "440px", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "18px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "6px" }}>{div.icon}</div>
                  <div style={{ display: "inline-block", background: div.bg, color: div.color, border: `1px solid ${div.border}`, borderRadius: "12px", padding: "2px 10px", fontSize: "11px", fontWeight: "700", marginBottom: "8px" }}>{div.label}</div>
                  <div style={{ fontWeight: "800", fontSize: "17px", color: "var(--color-text-dark)", marginBottom: "4px" }}>{item.name}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    MRP: ₹{fmt(item.mrp || item.price || 0)} | Rate: ₹{fmt(item.pRate || item.price || 0)}
                    {!isPurchase && <span> | Stock: <b style={{ color: barcodeQtyModal.maxQty > 0 ? "#16a34a" : "#dc2626" }}>{barcodeQtyModal.maxQty}</b> available</span>}
                    {isPurchase && <span style={{ color: "var(--color-primary)", fontWeight: "700" }}> | Purchase Bill</span>}
                  </div>
                </div>
                {/* Qty Input */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ ...lbl, fontSize: "13px", fontWeight: "700", color: "var(--color-text-dark)", display: "block", marginBottom: "8px", textAlign: "center" }}>
                    {isPurchase ? "How many packets purchased?" : "How many packets to buy?"}
                  </label>
                  <input
                    type="number" min="1"
                    value={barcodeQtyInput}
                    onChange={e => setBarcodeQtyInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !overStock && !noStock) handleBarcodeQtyConfirm(); }}
                    style={{ ...inp, fontSize: "24px", fontWeight: "800", textAlign: "center", color: "var(--color-text-dark)", width: "100%", border: `2px solid ${overStock ? "#dc2626" : "#bfdbfe"}`, borderRadius: "10px", padding: "12px" }}
                    autoFocus
                  />
                  {overStock && <div style={{ color: "#dc2626", fontSize: "12px", fontWeight: "700", marginTop: "6px", textAlign: "center" }}>❌ Only {barcodeQtyModal.maxQty} in stock!</div>}
                  {noStock && <div style={{ color: "#dc2626", fontSize: "12px", fontWeight: "700", marginTop: "6px", textAlign: "center" }}>⚠️ Out of stock! Add stock via Purchase bill first.</div>}
                </div>
                {/* Buttons */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setBarcodeQtyModal(null)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), flex: 1 }}><X size={14} />Cancel</button>
                  <button onClick={handleBarcodeQtyConfirm} disabled={overStock || noStock}
                    style={{ ...btn(isPurchase ? "#0891b2" : "#16a34a"), flex: 2, opacity: (overStock || noStock) ? 0.5 : 1 }}>
                    <CheckCircle size={14} />{isPurchase ? "Purchase ma Add ✓" : "Sales Bill ma Add ✓"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}




        {/* ══════════════════════════════════════════
            LABEL PRINT MODAL
        ══════════════════════════════════════════ */}
        {showLabelPrint && labelItem && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "white", borderRadius: "14px", width: "100%", maxWidth: "500px", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
              <div style={{ padding: "14px 18px", background: "#7c3aed", color: "var(--color-text-dark)", borderRadius: "14px 14px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "800", fontSize: "15px" }}>🏷️ Label Print — {labelItem.name}</span>
                <button onClick={() => setShowLabelPrint(false)} style={{ background: "transparent", border: "none", color: "var(--color-text-dark)", fontSize: "20px", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ padding: "18px" }}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={lbl}>Kitna Labels Print Karna Hai?</label>
                  <input type="number" min="1" max="100" value={labelQty} onChange={e => setLabelQty(Math.max(1, int(e.target.value)))} style={{ ...inp, width: "100px" }} />
                </div>
                {/* Label Preview */}
                <div id="label-preview" style={{ border: "2px dashed #7c3aed", borderRadius: "8px", padding: "12px", marginBottom: "14px", background: "#faf5ff" }}>
                  <div style={{ fontWeight: "900", fontSize: "14px", color: "var(--color-text-dark)", marginBottom: "2px" }}>{labelItem.name}</div>
                  {labelItem.company && <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>{labelItem.company}</div>}
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "700" }}>MRP: ₹{labelItem.mrp}</span>
                    {labelItem.gst > 0 && <span>GST: {labelItem.gst}%</span>}
                    {labelItem.hsn && <span>HSN: {labelItem.hsn}</span>}
                  </div>
                  {labelItem.barcode && <div style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: "900", color: "#000", letterSpacing: "2px" }}>||||| {labelItem.barcode} |||||</div>}
                  <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>Shiv Dhara Medical Store, Nikol, Ahmedabad</div>
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button onClick={() => setShowLabelPrint(false)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)") }}>Cancel</button>
                  <button onClick={() => {
                    let html = "<html><head><style>@media print{@page{margin:5mm;size:60mm 40mm;}body{margin:0;}}.label{width:58mm;height:38mm;border:1px solid #ccc;padding:4mm;font-family:Arial,sans-serif;box-sizing:border-box;page-break-after:always;display:flex;flex-direction:column;justify-content:space-between;}.nm{font-weight:900;font-size:11px;}.co{font-size:9px;color:#666;}.row{display:flex;gap:8px;font-size:9px;}.mrp{font-weight:900;font-size:12px;}.bc{font-family:monospace;font-size:11px;font-weight:900;letter-spacing:2px;}.ft{font-size:8px;color:#666;}</style></head><body>";
                    for (let i = 0; i < labelQty; i++) {
                      html += `<div class='label'><div><div class='nm'>${labelItem.name}</div>${labelItem.company ? `<div class='co'>${labelItem.company}</div>` : ""}</div><div class='row'><span class='mrp'>MRP: ₹${labelItem.mrp}</span>${labelItem.gst > 0 ? `<span>GST:${labelItem.gst}%</span>` : ""}</div>${labelItem.barcode ? `<div class='bc'>|||${labelItem.barcode}|||</div>` : ""}<div class='ft'>Shiv Dhara Medical, Nikol, Ahmedabad</div></div>`;
                    }
                    html += "</body></html>";
                    const w = window.open("", "_blank", "width=600,height=400");
                    w.document.write(html);
                    w.document.close();
                    w.focus();
                    setTimeout(() => { w.print(); }, 500);
                    setShowLabelPrint(false);
                  }} style={{ ...btn("#7c3aed") }}><Printer size={14} /> Print {labelQty} Label{labelQty > 1 ? "s" : ""}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            SUPPLIER LEDGER MODAL
        ══════════════════════════════════════════ */}
        {showSupplierLedger && ledgerSupplierId && (() => {
          const ld = getSupplierLedger(ledgerSupplierId);
          if (!ld.supplier) return null;
          let running = 0;
          return (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
              <div style={{ background: "white", borderRadius: "14px", width: "100%", maxWidth: "750px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
                <div style={{ padding: "16px 20px", background: "#7c3aed", color: "var(--color-text-dark)", borderRadius: "14px 14px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "800", fontSize: "16px" }}>📒 {ld.supplier.name} — Ledger</div>
                    <div style={{ fontSize: "12px", opacity: 0.85 }}>{ld.supplier.phone || ""} {ld.supplier.city ? `| ${ld.supplier.city}` : ""}</div>
                  </div>
                  <button onClick={() => setShowSupplierLedger(false)} style={{ ...btn("#ffffff22"), color: "var(--color-text-dark)", fontSize: "18px", padding: "4px 10px" }}>✕</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", padding: "14px 16px", background: "#f5f3ff" }}>
                  {[
                    { l: "Total Purchase", v: "₹" + fmt(ld.totalPurchase), c: "var(--color-primary)" },
                    { l: "Total Returns", v: "₹" + fmt(ld.totalReturns || 0), c: "#dc2626" },
                    { l: "Total Paid", v: "₹" + fmt(ld.totalPaid), c: "#16a34a" },
                  ].map(s => (
                    <div key={s.l} style={{ background: "white", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid #ede9fe" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>{s.l}</div>
                      <div style={{ fontSize: "16px", fontWeight: "800", color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "8px 16px", background: ld.outstanding > 0 ? "#fef2f2" : "#f0fdf4", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
                  <span style={{ fontWeight: "700", color: "#64748b" }}>Outstanding Balance:</span>
                  <span style={{ fontWeight: "900", fontSize: "18px", color: ld.outstanding > 0 ? "#dc2626" : "#16a34a" }}>{ld.outstanding > 0 ? "▲" : "✅"} ₹{fmt(Math.abs(ld.outstanding))}</span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead><tr style={{ background: "#7c3aed", color: "var(--color-text-dark)" }}>
                      {["Date", "Type", "Reference", "Debit (Dr)", "Credit (Cr)", "Balance"].map(h => <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: "700" }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {ld.entries.length === 0 ? <tr><td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>No transactions</td></tr> :
                        ld.entries.map((e, i) => {
                          running += e.dr - e.cr;
                          return (
                            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#faf5ff" }}>
                              <td style={{ padding: "8px 10px" }}>{new Date(e.date).toLocaleDateString("en-IN")}</td>
                              <td style={{ padding: "8px 10px" }}><span style={{ background: e.dr > 0 ? "#fef2f2" : "#f0fdf4", color: e.dr > 0 ? "#dc2626" : "#16a34a", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>{e.type}</span></td>
                              <td style={{ padding: "8px 10px", color: "#64748b" }}>{e.ref}</td>
                              <td style={{ padding: "8px 10px", color: "#dc2626", fontWeight: "700" }}>{e.dr > 0 ? "₹" + fmt(e.dr) : "-"}</td>
                              <td style={{ padding: "8px 10px", color: "#16a34a", fontWeight: "700" }}>{e.cr > 0 ? "₹" + fmt(e.cr) : "-"}</td>
                              <td style={{ padding: "8px 10px", fontWeight: "800", color: running > 0 ? "#dc2626" : "#16a34a" }}>₹{fmt(Math.abs(running))}{running > 0 ? " Dr" : " Cr"}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button onClick={() => setShowSupplierLedger(false)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)") }}>Close</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════
            BARCODE QTY MODAL
        ══════════════════════════════════════════ */}
        {barcodeQtyModal && (() => {
          const isPurchase = barcodeQtyModal.target === 'purchase';
          const overStock = !isPurchase && int(barcodeQtyInput) > barcodeQtyModal.maxQty;
          const noStock = !isPurchase && barcodeQtyModal.maxQty === 0;
          const { item } = barcodeQtyModal;
          const div = DIVISIONS.find(d => d.id === item.division) || DIVISIONS[0];
          return (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "white", borderRadius: "16px", padding: "28px", minWidth: "320px", maxWidth: "440px", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "18px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "6px" }}>{div.icon}</div>
                  <div style={{ display: "inline-block", background: div.bg, color: div.color, border: `1px solid ${div.border}`, borderRadius: "12px", padding: "2px 10px", fontSize: "11px", fontWeight: "700", marginBottom: "8px" }}>{div.label}</div>
                  <div style={{ fontWeight: "800", fontSize: "17px", color: "var(--color-text-dark)", marginBottom: "4px" }}>{item.name}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    MRP: ₹{fmt(item.mrp || item.price || 0)} | Rate: ₹{fmt(item.pRate || item.price || 0)}
                    {!isPurchase && <span> | Stock: <b style={{ color: barcodeQtyModal.maxQty > 0 ? "#16a34a" : "#dc2626" }}>{barcodeQtyModal.maxQty}</b> available</span>}
                    {isPurchase && <span style={{ color: "var(--color-primary)", fontWeight: "700" }}> | Purchase Bill</span>}
                  </div>
                </div>
                {/* Qty Input */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ ...lbl, fontSize: "13px", fontWeight: "700", color: "var(--color-text-dark)", display: "block", marginBottom: "8px", textAlign: "center" }}>
                    {isPurchase ? "How many packets purchased?" : "How many packets to buy?"}
                  </label>
                  <input
                    type="number" min="1"
                    value={barcodeQtyInput}
                    onChange={e => setBarcodeQtyInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !overStock && !noStock) handleBarcodeQtyConfirm(); }}
                    style={{ ...inp, fontSize: "24px", fontWeight: "800", textAlign: "center", color: "var(--color-text-dark)", width: "100%", border: `2px solid ${overStock ? "#dc2626" : "#bfdbfe"}`, borderRadius: "10px", padding: "12px" }}
                    autoFocus
                  />
                  {overStock && <div style={{ color: "#dc2626", fontSize: "12px", fontWeight: "700", marginTop: "6px", textAlign: "center" }}>❌ Only {barcodeQtyModal.maxQty} in stock!</div>}
                  {noStock && <div style={{ color: "#dc2626", fontSize: "12px", fontWeight: "700", marginTop: "6px", textAlign: "center" }}>⚠️ Out of stock! Add stock via Purchase bill first.</div>}
                </div>
                {/* Buttons */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setBarcodeQtyModal(null)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), flex: 1 }}><X size={14} />Cancel</button>
                  <button onClick={handleBarcodeQtyConfirm} disabled={overStock || noStock}
                    style={{ ...btn(isPurchase ? "#0891b2" : "#16a34a"), flex: 2, opacity: (overStock || noStock) ? 0.5 : 1 }}>
                    <CheckCircle size={14} />{isPurchase ? "Purchase ma Add ✓" : "Sales Bill ma Add ✓"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}



        {/* ══════════════════════════════════════════
            LABEL PRINT MODAL
        ══════════════════════════════════════════ */}
        {showLabelPrint && labelItem && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", borderRadius: "14px", padding: "24px", minWidth: "340px", maxWidth: "460px", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <div style={{ fontWeight: "800", fontSize: "16px", color: "#7c3aed" }}>🏷️ Print Medicine Label</div>
                <button onClick={() => setShowLabelPrint(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#64748b" }}>✕</button>
              </div>
              <div style={{ background: "#faf5ff", borderRadius: "10px", padding: "14px", marginBottom: "16px", border: "1px solid #e9d5ff" }}>
                <div style={{ fontWeight: "800", fontSize: "15px", marginBottom: "4px" }}>{labelItem.name}</div>
                {labelItem.company && <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "2px" }}>{labelItem.company}</div>}
                <div style={{ display: "flex", gap: "16px", fontSize: "12px", marginTop: "6px" }}>
                  <span>MRP: <b>₹{fmt(labelItem.mrp || labelItem.price || 0)}</b></span>
                  {labelItem.expiryDate && <span>Exp: <b>{labelItem.expiryDate}</b></span>}
                  {labelItem.barcode && <span>Barcode: <b>{labelItem.barcode}</b></span>}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={lbl}>Batch No (optional)</label>
                  <input value={labelBatch || ""} onChange={e => setLabelBatch(e.target.value)} style={inp} placeholder="Batch no" />
                </div>
                <div>
                  <label style={lbl}>Number of Labels</label>
                  <input type="number" min="1" max="100" value={labelQty} onChange={e => setLabelQty(e.target.value)} style={inp} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowLabelPrint(false)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), flex: 1 }}><X size={13} />Cancel</button>
                <button onClick={() => {
                  const html = generateLabelHTML(labelItem, labelBatch, int(labelQty) || 1);
                  const win = window.open("", "_blank", "width=700,height=500");
                  win.document.write(html); win.document.close();
                  setShowLabelPrint(false);
                }} style={{ ...btn("#7c3aed"), flex: 2 }}>🖨️ Print {labelQty || 1} Label{int(labelQty) > 1 ? "s" : ""}</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TRANSFER DATA MODAL (Export)
        ══════════════════════════════════════════════ */}
        {showTransferData && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#1084d0", padding: "2px", boxShadow: "6px 6px 14px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column" }}>
              <div style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", width: "560px", fontFamily: "Tahoma,Arial,sans-serif", fontSize: "12px", display: "flex", flexDirection: "column" }}>

                {/* Title Bar */}
                <div style={{ background: "linear-gradient(90deg,#000080,#1084d0)", padding: "3px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--color-text-dark)", fontWeight: "700", fontSize: "12px" }}>📤 Transfer Data — Export to File / URL</span>
                  <button onClick={() => setShowTransferData(false)} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", width: "16px", height: "14px", cursor: "pointer", fontSize: "10px", fontWeight: "700", lineHeight: 1, padding: 0 }}>✕</button>
                </div>

                <div style={{ padding: "16px 20px", background: "#c4ccdc" }}>
                  {/* Category Selection */}
                  <div style={{ background: "#f8fafc", border: "2px solid", borderColor: "#808080 #ffffff #ffffff #808080", padding: "10px 14px", marginBottom: "12px" }}>
                    <div style={{ fontWeight: "700", color: "#000080", marginBottom: "8px", fontSize: "12px" }}>📦 Select Data to Transfer:</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      {[
                        { key: "items", label: "🔬 Items (Inventory)" },
                        { key: "batches", label: "📋 Batches" },
                        { key: "suppliers", label: "🚚 Suppliers" },
                        { key: "purchaseBills", label: "📥 Purchase Bills" },
                        { key: "salesBills", label: "📤 Sales Bills" },
                        { key: "payments", label: "💳 Payments" },
                        { key: "doctors", label: "🩺 Doctors" },
                        { key: "customers", label: "👤 Customers" },
                        { key: "khata", label: "📒 Khata/Udhar" },
                        { key: "advance", label: "💰 Advance Deposits" },
                      ].map(c => (
                        <label key={c.key} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "3px 6px", background: transferDataSels[c.key] ? "#d0e4ff" : "transparent", borderRadius: "2px" }}>
                          <input type="checkbox" checked={!!transferDataSels[c.key]} onChange={e => setTransferDataSels(p => ({ ...p, [c.key]: e.target.checked }))} style={{ cursor: "pointer" }} />
                          <span style={{ fontSize: "12px", fontWeight: transferDataSels[c.key] ? "700" : "400" }}>{c.label}</span>
                        </label>
                      ))}
                    </div>
                    <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                      <button onClick={() => setTransferDataSels({ items: true, batches: true, suppliers: true, purchaseBills: true, salesBills: true, payments: true, doctors: true, customers: true, khata: true, advance: true })} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "1px 10px", fontSize: "11px", cursor: "pointer", fontWeight: "700" }}><u>A</u>ll</button>
                      <button onClick={() => setTransferDataSels({ items: false, batches: false, suppliers: false, purchaseBills: false, salesBills: false, payments: false, doctors: false, customers: false, khata: false, advance: false })} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "1px 10px", fontSize: "11px", cursor: "pointer", fontWeight: "700" }}><u>N</u>one</button>
                    </div>
                  </div>

                  {/* Target URL (optional) */}
                  <div style={{ background: "#f8fafc", border: "2px solid", borderColor: "#808080 #ffffff #ffffff #808080", padding: "10px 14px", marginBottom: "12px" }}>
                    <div style={{ fontWeight: "700", color: "#000080", marginBottom: "6px", fontSize: "12px" }}>🌐 Remote Transfer (Optional — leave blank to export as file):</div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <label style={{ fontSize: "11px", whiteSpace: "nowrap", fontWeight: "700" }}>Target URL:</label>
                      <input
                        value={transferDataTargetUrl}
                        onChange={e => setTransferDataTargetUrl(e.target.value)}
                        placeholder="https://other-server.com/api/import-data"
                        style={{ flex: 1, borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #ffffff", borderRight: "2px solid #ffffff", padding: "2px 4px", fontFamily: "Inter, sans-serif", fontSize: "11px", outline: "none" }}
                      />
                    </div>
                  </div>

                  {/* Progress / Messages */}
                  {transferDataMsg && (
                    <div style={{
                      padding: "8px 12px", borderRadius: "3px", marginBottom: "10px", fontWeight: "700", fontSize: "12px",
                      background: transferDataProgress === "done" ? "#c6efce" : transferDataProgress === "error" ? "#ffc7ce" : "#ffeb9c",
                      color: transferDataProgress === "done" ? "#174d1c" : transferDataProgress === "error" ? "#9c0006" : "#7d4e00",
                      border: `1px solid ${transferDataProgress === "done" ? "#006100" : transferDataProgress === "error" ? "#9c0006" : "#c9a500"}`
                    }}>{transferDataMsg}</div>
                  )}

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button onClick={() => setShowTransferData(false)} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "4px 18px", fontWeight: "700", cursor: "pointer" }}><u>C</u>lose</button>
                    <button
                      disabled={transferDataProgress === "exporting"}
                      onClick={async () => {
                        const sel = transferDataSels;
                        if (!Object.values(sel).some(Boolean)) { showToast("Select at least 1 category", "error"); return; }
                        setTransferDataProgress("exporting");
                        setTransferDataMsg("⏳ Collecting data...");
                        // Build export payload
                        const payload = {};
                        if (sel.items) payload.items = items;
                        if (sel.batches) payload.batches = batches;
                        if (sel.suppliers) payload.suppliers = suppliers;
                        if (sel.purchaseBills) payload.purchaseBills = purchaseBills;
                        if (sel.salesBills) payload.salesBills = salesBills;
                        if (sel.payments) payload.payments = payments;
                        if (sel.doctors) payload.doctors = doctors;
                        if (sel.customers) payload.customers = typeof customers === "object" && !Array.isArray(customers) ? Object.values(customers) : customers;
                        if (sel.khata) payload.khataEntries = khataEntries;
                        if (sel.advance) payload.advanceDeposits = advanceDeposits;
                        payload._meta = { exportedAt: new Date().toISOString(), exportedBy: currentUser?.name || "Owner", version: "1.0", categories: Object.keys(sel).filter(k => sel[k]) };

                        if (transferDataTargetUrl.trim()) {
                          // Remote transfer
                          try {
                            const res = await fetch(transferDataTargetUrl.trim(), {
                              method: "POST",
                              headers: { "Content-Type": "application/json", "X-Transfer-Auth": "shivdhara-transfer-v1" },
                              body: JSON.stringify(payload)
                            });
                            if (res.ok) {
                              setTransferDataProgress("done");
                              setTransferDataMsg(`✅ Data successfully transferred to remote server! (${Object.keys(payload).filter(k => k !== "_meta").length} categories)`);
                            } else {
                              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                            }
                          } catch (err) {
                            setTransferDataProgress("error");
                            setTransferDataMsg(`❌ Remote transfer failed: ${err.message}`);
                          }
                        } else {
                          // Local file download
                          try {
                            const json = JSON.stringify(payload, null, 2);
                            const blob = new Blob([json], { type: "application/json" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            const date = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");
                            a.href = url;
                            a.download = `shivdhara_transfer_${date}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            setTransferDataProgress("done");
                            const cats = Object.keys(sel).filter(k => sel[k]);
                            setTransferDataMsg(`✅ Transfer file downloaded! (${cats.length} categories: ${cats.join(", ")})`);
                          } catch (err) {
                            setTransferDataProgress("error");
                            setTransferDataMsg(`❌ Download failed: ${err.message}`);
                          }
                        }
                      }}
                      style={{ background: transferDataProgress === "exporting" ? "#9dbad4" : "#000080", color: "#fff", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "4px 18px", fontWeight: "700", cursor: transferDataProgress === "exporting" ? "not-allowed" : "pointer" }}
                    >
                      {transferDataProgress === "exporting" ? "⏳ Exporting..." : transferDataTargetUrl.trim() ? "🌐 Transfer to URL" : "📥 Export to File"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TRANSFER OTHER DATA MODAL (Import)
        ══════════════════════════════════════════════ */}
        {showTransferOtherData && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#1084d0", padding: "2px", boxShadow: "6px 6px 14px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column" }}>
              <div style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", width: "580px", fontFamily: "Tahoma,Arial,sans-serif", fontSize: "12px", display: "flex", flexDirection: "column" }}>

                {/* Title Bar */}
                <div style={{ background: "linear-gradient(90deg,#000080,#1084d0)", padding: "3px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--color-text-dark)", fontWeight: "700", fontSize: "12px" }}>📥 Transfer Other Data — Import from File</span>
                  <button onClick={() => { setShowTransferOtherData(false); setTransferOtherFile(null); setTransferOtherParsed(null); setTransferOtherMsg(""); setTransferOtherProgress(""); }} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", width: "16px", height: "14px", cursor: "pointer", fontSize: "10px", fontWeight: "700", lineHeight: 1, padding: 0 }}>✕</button>
                </div>

                <div style={{ padding: "16px 20px", background: "#c4ccdc" }}>

                  {/* Step 1: File picker */}
                  <div style={{ background: "#f8fafc", border: "2px solid", borderColor: "#808080 #ffffff #ffffff #808080", padding: "10px 14px", marginBottom: "12px" }}>
                    <div style={{ fontWeight: "700", color: "#000080", marginBottom: "8px", fontSize: "12px" }}>📂 Step 1: Transfer File Select Karo (.json)</div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="file"
                        accept=".json"
                        id="transfer-other-file"
                        style={{ display: "none" }}
                        onChange={e => {
                          const f = e.target.files[0];
                          if (!f) return;
                          setTransferOtherFile(f);
                          setTransferOtherParsed(null);
                          setTransferOtherMsg("");
                          setTransferOtherProgress("reading");
                          const reader = new FileReader();
                          reader.onload = ev => {
                            try {
                              const data = JSON.parse(ev.target.result);
                              setTransferOtherParsed(data);
                              // Auto-select only what's available in file
                              const avail = {};
                              ["items", "batches", "suppliers", "purchaseBills", "salesBills", "payments", "doctors", "customers", "khataEntries", "advanceDeposits"].forEach(k => {
                                const sk = k === "khataEntries" ? "khata" : k === "advanceDeposits" ? "advance" : k;
                                avail[sk] = !!(data[k] && data[k].length > 0);
                              });
                              setTransferOtherSels(avail);
                              setTransferOtherProgress("ready");
                              const meta = data._meta || {};
                              setTransferOtherMsg(`✅ File loaded! Exported on: ${meta.exportedAt ? new Date(meta.exportedAt).toLocaleString("en-IN") : "Unknown"}  |  By: ${meta.exportedBy || "Unknown"}`);
                            } catch (err) {
                              setTransferOtherProgress("error");
                              setTransferOtherParsed(null);
                              setTransferOtherMsg(`❌ Invalid file format: ${err.message}`);
                            }
                          };
                          reader.readAsText(f);
                          e.target.value = "";
                        }}
                      />
                      <label htmlFor="transfer-other-file" style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "3px 14px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>📂 Browse...</label>
                      <span style={{ flex: 1, fontSize: "11px", color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{transferOtherFile ? transferOtherFile.name : "No file selected"}</span>
                    </div>
                  </div>

                  {/* Step 2: Category Selection (only shown when file loaded) */}
                  {transferOtherParsed && (
                    <>
                      <div style={{ background: "#f8fafc", border: "2px solid", borderColor: "#808080 #ffffff #ffffff #808080", padding: "10px 14px", marginBottom: "12px" }}>
                        <div style={{ fontWeight: "700", color: "#000080", marginBottom: "8px", fontSize: "12px" }}>📦 Step 2: Import Karva Na Category Select Karo:</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                          {[
                            { key: "items", label: "🔬 Items", count: transferOtherParsed.items?.length },
                            { key: "batches", label: "📋 Batches", count: transferOtherParsed.batches?.length },
                            { key: "suppliers", label: "🚚 Suppliers", count: transferOtherParsed.suppliers?.length },
                            { key: "purchaseBills", label: "📥 Purchase Bills", count: transferOtherParsed.purchaseBills?.length },
                            { key: "salesBills", label: "📤 Sales Bills", count: transferOtherParsed.salesBills?.length },
                            { key: "payments", label: "💳 Payments", count: transferOtherParsed.payments?.length },
                            { key: "doctors", label: "🩺 Doctors", count: transferOtherParsed.doctors?.length },
                            { key: "customers", label: "👤 Customers", count: transferOtherParsed.customers?.length },
                            { key: "khata", label: "📒 Khata/Udhar", count: transferOtherParsed.khataEntries?.length },
                            { key: "advance", label: "💰 Advance Deposits", count: transferOtherParsed.advanceDeposits?.length },
                          ].map(c => {
                            const available = c.count > 0;
                            return (
                              <label key={c.key} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: available ? "pointer" : "default", padding: "3px 6px", background: !available ? "#e0e0e0" : transferOtherSels[c.key] ? "#d0e4ff" : "transparent", borderRadius: "2px", opacity: available ? 1 : 0.5 }}>
                                <input type="checkbox" checked={!!transferOtherSels[c.key]} disabled={!available} onChange={e => setTransferOtherSels(p => ({ ...p, [c.key]: e.target.checked }))} style={{ cursor: available ? "pointer" : "default" }} />
                                <span style={{ fontSize: "12px", fontWeight: transferOtherSels[c.key] ? "700" : "400" }}>{c.label}</span>
                                <span style={{ marginLeft: "auto", fontSize: "10px", color: available ? "#006400" : "#888", fontWeight: "700" }}>{available ? `(${c.count})` : `(empty)`}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Merge Mode */}
                      <div style={{ background: "#f8fafc", border: "2px solid", borderColor: "#808080 #ffffff #ffffff #808080", padding: "8px 14px", marginBottom: "12px" }}>
                        <div style={{ fontWeight: "700", color: "#000080", marginBottom: "6px", fontSize: "12px" }}>⚙️ Import Mode:</div>
                        <div style={{ display: "flex", gap: "20px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                            <input type="radio" name="transferMerge" value="merge" checked={transferOtherMerge === "merge"} onChange={() => setTransferOtherMerge("merge")} style={{ cursor: "pointer" }} />
                            <span style={{ fontSize: "12px", fontWeight: "700" }}>🔀 Merge <span style={{ fontWeight: "400", color: "#555" }}>(ID duplicate hoy to skip kare)</span></span>
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                            <input type="radio" name="transferMerge" value="replace" checked={transferOtherMerge === "replace"} onChange={() => setTransferOtherMerge("replace")} style={{ cursor: "pointer" }} />
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#9c0006" }}>⚠️ Replace <span style={{ fontWeight: "400", color: "#555" }}>(existing data overwrite thashe)</span></span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Status message */}
                  {transferOtherMsg && (
                    <div style={{
                      padding: "8px 12px", borderRadius: "3px", marginBottom: "10px", fontWeight: "700", fontSize: "12px",
                      background: transferOtherProgress === "done" ? "#c6efce" : transferOtherProgress === "error" ? "#ffc7ce" : "#ffeb9c",
                      color: transferOtherProgress === "done" ? "#174d1c" : transferOtherProgress === "error" ? "#9c0006" : "#7d4e00",
                      border: `1px solid ${transferOtherProgress === "done" ? "#006100" : transferOtherProgress === "error" ? "#9c0006" : "#c9a500"}`
                    }}>{transferOtherMsg}</div>
                  )}

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button onClick={() => { setShowTransferOtherData(false); setTransferOtherFile(null); setTransferOtherParsed(null); setTransferOtherMsg(""); setTransferOtherProgress(""); }} style={{ background: "#f8fafc", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "4px 18px", fontWeight: "700", cursor: "pointer" }}><u>C</u>lose</button>

                    {transferOtherParsed && (
                      <button
                        disabled={transferOtherProgress === "importing"}
                        onClick={async () => {
                          if (!Object.values(transferOtherSels).some(Boolean)) { showToast("Select at least 1 category", "error"); return; }
                          if (transferOtherMerge === "replace") {
                            const ok = await new Promise(res => {
                              if (window.confirm("⚠️ REPLACE mode: existing data overwrite thashe! Continue karvanu?")) res(true); else res(false);
                            });
                            if (!ok) return;
                          }
                          setTransferOtherProgress("importing");
                          setTransferOtherMsg("⏳ Importing data...");
                          const d = transferOtherParsed;
                          const merge = transferOtherMerge === "merge";
                          const mergeArr = (existing, incoming) => {
                            if (!incoming || !incoming.length) return existing;
                            if (!merge) return incoming;
                            const ids = new Set(existing.map(e => e.id));
                            return [...existing, ...incoming.filter(i => !ids.has(i.id))];
                          };
                          let imported = [];
                          try {
                            if (transferOtherSels.items && d.items) { const n = mergeArr(items, d.items); saveItems(n); save("store_items", n); imported.push(`Items(${d.items.length})`); }
                            if (transferOtherSels.batches && d.batches) { const n = mergeArr(batches, d.batches); saveBatches(n); save("store_batches", n); imported.push(`Batches(${d.batches.length})`); }
                            if (transferOtherSels.suppliers && d.suppliers) { const n = mergeArr(suppliers, d.suppliers); (() => {})(n); save("store_suppliers", n); imported.push(`Suppliers(${d.suppliers.length})`); }
                            if (transferOtherSels.purchaseBills && d.purchaseBills) { const n = mergeArr(purchaseBills, d.purchaseBills); savePurchaseBills(n); save("store_purchaseBills", n); imported.push(`PurchaseBills(${d.purchaseBills.length})`); }
                            if (transferOtherSels.salesBills && d.salesBills) { const n = mergeArr(salesBills, d.salesBills); saveSalesBills(n); save("store_salesBills", n); imported.push(`SalesBills(${d.salesBills.length})`); }
                            if (transferOtherSels.payments && d.payments) { const n = mergeArr(payments, d.payments); savePayments(n); save("store_payments", n); imported.push(`Payments(${d.payments.length})`); }
                            if (transferOtherSels.doctors && d.doctors) { const n = mergeArr(doctors, d.doctors); setDoctors(n); save("store_doctors", n); imported.push(`Doctors(${d.doctors.length})`); }
                            if (transferOtherSels.khata && d.khataEntries) { const n = mergeArr(khataEntries, d.khataEntries); (() => {})(n); save("store_khata_entries", n); imported.push(`Khata(${d.khataEntries.length})`); }
                            if (transferOtherSels.advance && d.advanceDeposits) { const n = mergeArr(advanceDeposits, d.advanceDeposits); (() => {})(n); save("store_advance_deposits", n); imported.push(`Advance(${d.advanceDeposits.length})`); }
                            setTransferOtherProgress("done");
                            setTransferOtherMsg(`✅ Import successful! ${merge ? "Merge" : "Replace"} mode — ${imported.join(", ")}`);
                            showToast(`✅ Data imported: ${imported.length} categories!`, "success");
                          } catch (err) {
                            setTransferOtherProgress("error");
                            setTransferOtherMsg(`❌ Import failed: ${err.message}`);
                          }
                        }}
                        style={{ background: transferOtherProgress === "importing" ? "#9dbad4" : "#000080", color: "#fff", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", padding: "4px 18px", fontWeight: "700", cursor: transferOtherProgress === "importing" ? "not-allowed" : "pointer" }}
                      >
                        {transferOtherProgress === "importing" ? "⏳ Importing..." : "📥 Import Data"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
</div>
  );
}
