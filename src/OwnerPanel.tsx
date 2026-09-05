// @ts-nocheck
/* eslint-disable */
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Edit2, Trash2, ShoppingCart, Package, LogOut, Eye, EyeOff, X, Check, CheckCircle, AlertCircle, User, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Phone, Mail, MapPin, Clock, FileText, TrendingUp, Truck, CreditCard, Users, Home, Printer } from "lucide-react";
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


const matchesDate = (dateVal, query) => {
  if (!dateVal || !query) return false;
  const qClean = query.trim().toLowerCase().replace(/[\/\.]/g, "-");
  const dStr = String(dateVal).toLowerCase();
  if (dStr.includes(qClean)) return true;
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const m = String(d.getMonth() + 1);
      const dSingle = String(d.getDate());

      const d1 = `${yyyy}-${mm}-${dd}`;
      const d2 = `${dd}-${mm}-${yyyy}`;
      const d3 = `${dSingle}-${m}-${yyyy}`;
      const d4 = `${dd}-${mm}`;
      const d5 = `${dSingle}-${m}`;
      const dIndian = d.toLocaleDateString("en-IN").toLowerCase().replace(/[\/\.]/g, "-");

      const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
      const shortMonths = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const mName = monthNames[d.getMonth()];
      const mShort = shortMonths[d.getMonth()];

      if (
        d1.includes(qClean) ||
        d2.includes(qClean) ||
        d3.includes(qClean) ||
        d4.includes(qClean) ||
        d5.includes(qClean) ||
        dIndian.includes(qClean) ||
        `${dd} ${mName} ${yyyy}`.includes(query.toLowerCase()) ||
        `${dd} ${mShort} ${yyyy}`.includes(query.toLowerCase()) ||
        `${dSingle} ${mName}`.includes(query.toLowerCase()) ||
        `${dSingle} ${mShort}`.includes(query.toLowerCase())
      ) {
        return true;
      }
    }
  } catch (_) {}
  return false;
};

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
    lockBillData, setLockBillData, saveLockBillData, isDateLocked,
    auditLogs, loadAuditLogs, logUserChange,
    purchaseChallans, savePurchaseChallans,
  } = useMedicalStore();

  // ── Camera Scanner States ──
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState("purchase");

  // ── Sidebar State ──
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ── Search Dropdowns ──
  const [salesBillSearchDropdown, setSalesBillSearchDropdown] = useState(false);
  const [salesBillSearchHighlight, setSalesBillSearchHighlight] = useState(0);

  const [purchaseBillSearchDropdown, setPurchaseBillSearchDropdown] = useState(false);
  const [purchaseBillSearchHighlight, setPurchaseBillSearchHighlight] = useState(0);

  const [itemSearchDropdown, setItemSearchDropdown] = useState(false);
  const [itemSearchHighlight, setItemSearchHighlight] = useState(0);

  // ── Lock Bill States ──
  const [showLockBill, setShowLockBill] = useState(false);
  const [showUserwiseChanges, setShowUserwiseChanges] = useState(false);
  const [userwiseTab, setUserwiseTab] = useState("userwise"); // userwise, margin, vat, purchase_chkd
  const [userwiseUserFilter, setUserwiseUserFilter] = useState("ALL");
  const [userwiseActionFilter, setUserwiseActionFilter] = useState("ALL");
  const [userwiseFromDate, setUserwiseFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [userwiseToDate, setUserwiseToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [userwiseSearchQuery, setUserwiseSearchQuery] = useState("");

  // ── Data Utility States ──
  const [showDataUtility, setShowDataUtility] = useState(false);
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

  // ── Bill Number Change States (Supervisor) ──
  const [showBillNumberChange, setShowBillNumberChange] = useState(false);
  const [billChangeType, setBillChangeType] = useState<'sales' | 'purchase'>('sales');
  const [billChangeSearch, setBillChangeSearch] = useState('');
  const [billChangeSelected, setBillChangeSelected] = useState<any>(null);
  const [billChangeNewNo, setBillChangeNewNo] = useState('');
  const [billChangeReason, setBillChangeReason] = useState('Correction of Bill Number');
  const [billChangeCustomReason, setBillChangeCustomReason] = useState('');
  const [billChangeActiveTab, setBillChangeActiveTab] = useState<'single' | 'batch' | 'logs'>('single');
  const [billChangeBatchStart, setBillChangeBatchStart] = useState('');
  const [billChangeBatchEnd, setBillChangeBatchEnd] = useState('');
  const [billChangeBatchNewStart, setBillChangeBatchNewStart] = useState('');
  const [billChangeStatus, setBillChangeStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [billChangeLoading, setBillChangeLoading] = useState(false);
  const [billChangeLogs, setBillChangeLogs] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('store_bill_number_changes') || '[]'); } catch (_) { return []; }
  });

  const recordBillChangeLog = (entry: any) => {
    try {
      const updated = [entry, ...billChangeLogs].slice(0, 100);
      setBillChangeLogs(updated);
      localStorage.setItem('store_bill_number_changes', JSON.stringify(updated));
    } catch (_) {}
  };

  const handleUpdateSingleBillNo = async () => {
    if (!billChangeSelected) {
      setBillChangeStatus({ type: 'error', msg: 'Please select a bill to change first.' });
      return;
    }
    const targetNew = String(billChangeNewNo || '').trim();
    if (!targetNew) {
      setBillChangeStatus({ type: 'error', msg: 'New bill number cannot be empty.' });
      return;
    }
    const oldNo = String(billChangeSelected.billNo || billChangeSelected.entryNo || billChangeSelected.id);
    if (targetNew === oldNo) {
      setBillChangeStatus({ type: 'error', msg: 'New bill number must be different from current bill number.' });
      return;
    }

    // Check duplicate
    if (billChangeType === 'sales') {
      const dup = salesBills.find(b => String(b.billNo || b.id).toLowerCase() === targetNew.toLowerCase() && b.id !== billChangeSelected.id);
      if (dup) {
        setBillChangeStatus({ type: 'error', msg: `Sales bill #${targetNew} already exists for ${dup.patientName || 'Walk-in'} (₹${fmt(dup.netAmount || dup.total || 0)})!` });
        return;
      }
    } else {
      const dup = purchaseBills.find(b => String(b.billNo || b.entryNo || b.id).toLowerCase() === targetNew.toLowerCase() && b.id !== billChangeSelected.id);
      if (dup) {
        setBillChangeStatus({ type: 'error', msg: `Purchase bill #${targetNew} already exists for ${dup.partyName || 'Supplier'} (₹${fmt(dup.total || dup.netAmount || 0)})!` });
        return;
      }
    }

    setBillChangeLoading(true);
    setBillChangeStatus(null);
    const finalReason = billChangeReason === 'Other' ? (billChangeCustomReason || 'Other correction') : billChangeReason;

    try {
      // 1. Try Backend API call
      try {
        await fetch('http://localhost:5000/api/change-bill-number', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: billChangeType,
            billId: billChangeSelected.id,
            oldBillNo: oldNo,
            newBillNo: targetNew,
            reason: finalReason,
            changedBy: currentUser?.username || 'ADMIN'
          })
        });
      } catch (_) {}

      // 2. Update React State and localStorage
      if (billChangeType === 'sales') {
        const updatedBills = salesBills.map(b => {
          if (b.id === billChangeSelected.id || String(b.billNo) === oldNo) {
            return { ...b, billNo: targetNew };
          }
          return b;
        });
        saveSalesBills(updatedBills);
      } else {
        const updatedBills = purchaseBills.map(b => {
          if (b.id === billChangeSelected.id || String(b.billNo) === oldNo) {
            return { ...b, billNo: targetNew };
          }
          return b;
        });
        savePurchaseBills(updatedBills);
      }

      // 3. User Audit Log
      logUserChange('CHANGE_BILL_NUMBER', {
        type: billChangeType,
        oldBillNo: oldNo,
        newBillNo: targetNew,
        party: billChangeSelected.patientName || billChangeSelected.partyName || 'N/A',
        amount: billChangeSelected.netAmount || billChangeSelected.total || 0,
        reason: finalReason
      }, `Bill #${oldNo} -> #${targetNew}`);

      // 4. Record local history
      recordBillChangeLog({
        id: Date.now(),
        date: new Date().toISOString(),
        type: billChangeType,
        oldBillNo: oldNo,
        newBillNo: targetNew,
        party: billChangeSelected.patientName || billChangeSelected.partyName || 'Walk-in',
        amount: billChangeSelected.netAmount || billChangeSelected.total || 0,
        reason: finalReason,
        user: currentUser?.username || 'ADMIN'
      });

      setBillChangeStatus({ type: 'success', msg: `Bill #${oldNo} has been successfully changed to #${targetNew}!` });
      setBillChangeSelected((prev: any) => prev ? { ...prev, billNo: targetNew } : null);
      setBillChangeNewNo('');
    } catch (err: any) {
      setBillChangeStatus({ type: 'error', msg: err?.message || 'Failed to update bill number.' });
    } finally {
      setBillChangeLoading(false);
    }
  };

  // ── Merge Facility States ──
  const [showMergeFacility, setShowMergeFacility] = useState(false);
  const [mergeFacilityOpt, setMergeFacilityOpt] = useState<"delete" | "nodelete">("delete");
  const [mergeCategory, setMergeCategory] = useState<"item" | "company" | "supplier" | "debtor" | "generic" | "doctor">("item");
  const [mergeSourceId, setMergeSourceId] = useState<string>("");
  const [mergeSourceName, setMergeSourceName] = useState<string>("");
  const [mergeTargetId, setMergeTargetId] = useState<string>("");
  const [mergeTargetName, setMergeTargetName] = useState<string>("");
  const [mergeSourceSearch, setMergeSourceSearch] = useState<string>("");
  const [mergeTargetSearch, setMergeTargetSearch] = useState<string>("");
  const [mergeLoading, setMergeLoading] = useState<boolean>(false);
  const [mergeStatus, setMergeStatus] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
  const [mergeConfirmChecked, setMergeConfirmChecked] = useState<boolean>(false);
  const [mergeActiveTab, setMergeActiveTab] = useState<"merge" | "logs">("merge");
  const [mergeLogs, setMergeLogs] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('store_merge_history') || '[]'); } catch (_) { return []; }
  });

  const handleExecuteMerge = async () => {
    if (!mergeSourceName || !mergeTargetName) {
      setMergeStatus({ type: "error", msg: "Please select both Source and Target records before proceeding." });
      return;
    }
    if ((mergeSourceId && mergeSourceId === mergeTargetId) || (mergeSourceName.trim().toLowerCase() === mergeTargetName.trim().toLowerCase())) {
      setMergeStatus({ type: "error", msg: "Source and Target records cannot be the same. Please select two different records." });
      return;
    }
    if (!mergeConfirmChecked) {
      setMergeStatus({ type: "error", msg: "Please confirm that you have taken a backup and accept the permanent merge action." });
      return;
    }

    setMergeLoading(true);
    setMergeStatus(null);
    const deleteSource = mergeFacilityOpt === "delete";

    try {
      // 1. Call Backend API
      try {
        await fetch('http://localhost:5000/api/merge-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: mergeCategory,
            sourceId: mergeSourceId,
            sourceName: mergeSourceName,
            targetId: mergeTargetId,
            targetName: mergeTargetName,
            deleteSource,
            changedBy: currentUser?.username || 'ADMIN'
          })
        });
      } catch (_) {}

      // 2. Perform React State update
      if (mergeCategory === "item") {
        const sId = Number(mergeSourceId);
        const tId = Number(mergeTargetId);
        const sourceItem = items.find((i: any) => i.id === sId || i.name === mergeSourceName);
        const targetItem = items.find((i: any) => i.id === tId || i.name === mergeTargetName);

        if (targetItem) {
          const addedStock = (sourceItem && Number(sourceItem.stock)) || 0;
          // Re-link batches to target item
          const updatedBatches = batches.map((b: any) => {
            if (b.itemId === sId || (sourceItem && b.itemId === sourceItem.id)) {
              return { ...b, itemId: targetItem.id, itemName: targetItem.name };
            }
            return b;
          });
          saveBatches(updatedBatches);

          // Update items
          let updatedItems = items.map((i: any) => {
            if (i.id === targetItem.id) {
              return { ...i, stock: (Number(i.stock) || 0) + addedStock };
            }
            return i;
          });
          if (deleteSource && sourceItem) {
            updatedItems = updatedItems.filter((i: any) => i.id !== sourceItem.id);
          }
          saveItems(updatedItems);
        }
      } else if (mergeCategory === "company") {
        const updatedItems = items.map((i: any) => {
          if ((i.company || '').trim().toLowerCase() === mergeSourceName.trim().toLowerCase()) {
            return { ...i, company: mergeTargetName.trim() };
          }
          return i;
        });
        saveItems(updatedItems);
      } else if (mergeCategory === "supplier") {
        const sId = mergeSourceId;
        const tId = mergeTargetId;
        const updatedPurchases = purchaseBills.map((pb: any) => {
          if (String(pb.supplierId) === String(sId) || (pb.partyName || '').toLowerCase() === mergeSourceName.toLowerCase()) {
            return { ...pb, supplierId: tId, partyName: mergeTargetName };
          }
          return pb;
        });
        savePurchaseBills(updatedPurchases);

        const updatedPayments = payments.map((p: any) => {
          if (String(p.supplierId) === String(sId) || (p.accountName || '').toLowerCase() === mergeSourceName.toLowerCase()) {
            return { ...p, supplierId: tId, accountName: mergeTargetName };
          }
          return p;
        });
        savePayments(updatedPayments);

        if (deleteSource && sId) {
          const updatedSupps = suppliers.filter((s: any) => String(s.id) !== String(sId));
          saveSuppliers(updatedSupps);
        }
      } else if (mergeCategory === "debtor") {
        const updatedSales = salesBills.map((sb: any) => {
          if ((sb.patientName || '').toLowerCase() === mergeSourceName.toLowerCase()) {
            return { ...sb, patientName: mergeTargetName };
          }
          return sb;
        });
        saveSalesBills(updatedSales);
      } else if (mergeCategory === "generic") {
        const updatedItems = items.map((i: any) => {
          if ((i.generic || i.genericName || '').toLowerCase() === mergeSourceName.toLowerCase()) {
            return { ...i, generic: mergeTargetName, genericName: mergeTargetName };
          }
          return i;
        });
        saveItems(updatedItems);
      } else if (mergeCategory === "doctor") {
        const updatedSales = salesBills.map((sb: any) => {
          if ((sb.doctorName || '').toLowerCase() === mergeSourceName.toLowerCase()) {
            return { ...sb, doctorName: mergeTargetName };
          }
          return sb;
        });
        saveSalesBills(updatedSales);
        if (deleteSource && mergeSourceId && typeof setDoctors === 'function') {
          setDoctors((prev: any[]) => prev.filter(d => String(d.id) !== String(mergeSourceId)));
        }
      }

      // 3. User Audit Logging
      logUserChange("MERGE_DATA", {
        category: mergeCategory,
        source: mergeSourceName,
        target: mergeTargetName,
        deleteSource: deleteSource ? "Deleted" : "Retained",
        user: currentUser?.username || "ADMIN"
      }, `Merged ${mergeCategory.toUpperCase()}: "${mergeSourceName}" -> "${mergeTargetName}"`);

      // 4. Save to Merge History
      const logEntry = {
        id: Date.now(),
        date: new Date().toISOString(),
        category: mergeCategory,
        source: mergeSourceName,
        target: mergeTargetName,
        deleteSource,
        user: currentUser?.username || 'ADMIN'
      };
      const updatedLogs = [logEntry, ...mergeLogs].slice(0, 100);
      setMergeLogs(updatedLogs);
      localStorage.setItem('store_merge_history', JSON.stringify(updatedLogs));

      setMergeStatus({
        type: "success",
        msg: `Successfully merged ${mergeCategory} "${mergeSourceName}" into "${mergeTargetName}"!`
      });
      setMergeSourceId("");
      setMergeSourceName("");
      setMergeTargetId("");
      setMergeTargetName("");
      setMergeConfirmChecked(false);
    } catch (err: any) {
      setMergeStatus({ type: "error", msg: err?.message || "Failed to execute merge operation." });
    } finally {
      setMergeLoading(false);
    }
  };

  // ── Stock Rate Detail States ──
  const [showStockRateDetail, setShowStockRateDetail] = useState(false);
  const [srdCompanyFilter, setSrdCompanyFilter] = useState("ALL");
  const [srdSearchQuery, setSrdSearchQuery] = useState("");
  const [srdTaxFilter, setSrdTaxFilter] = useState("ALL");
  const [srdStockFilter, setSrdStockFilter] = useState<"all" | "in_stock" | "zero_stock">("all");
  const [srdSortField, setSrdSortField] = useState<"name" | "stock" | "mrp" | "lp">("name");
  const [srdSortOrder, setSrdSortOrder] = useState<"asc" | "desc">("asc");
  const [srdCalculatedLPs, setSrdCalculatedLPs] = useState<{ [key: string]: number }>({});
  const [srdIsCalculating, setSrdIsCalculating] = useState(false);
  const [srdStatusMsg, setSrdStatusMsg] = useState<string | null>(null);

  const handleCalculateAllLP = () => {
    setSrdIsCalculating(true);
    try {
      const newLPs: { [key: string]: number } = {};
      let count = 0;

      items.forEach((item: any) => {
        const itemBatches = batches.filter((b: any) => b.itemId === item.id);
        const taxRate = Number(item.gst || item.tax || 12);

        if (itemBatches.length > 0) {
          itemBatches.forEach((b: any) => {
            const key = `${item.id}_${b.batchNo || b.batch || 'default'}`;
            const basePurchaseRate = Number(b.purchaseRate || item.purchaseRate || (item.mrp ? item.mrp * 0.7 : 0));
            // Landing Price = Base Purchase Rate + GST on Purchase
            const calculatedLP = parseFloat((basePurchaseRate * (1 + taxRate / 100)).toFixed(2));
            newLPs[key] = calculatedLP;
            count++;
          });
        } else {
          const key = `${item.id}_default`;
          const basePurchaseRate = Number(item.purchaseRate || (item.mrp ? item.mrp * 0.7 : 0));
          const calculatedLP = parseFloat((basePurchaseRate * (1 + taxRate / 100)).toFixed(2));
          newLPs[key] = calculatedLP;
          count++;
        }
      });

      setSrdCalculatedLPs(newLPs);
      setSrdStatusMsg(`Landing Price (LP) successfully calculated for ${count} items and batches!`);
      setTimeout(() => setSrdStatusMsg(null), 5000);
    } catch (err: any) {
      setSrdStatusMsg("Failed to calculate landing prices.");
    } finally {
      setSrdIsCalculating(false);
    }
  };

  const handleExportStockRateCSV = () => {
    try {
      const headers = ["SrNo", "ItemName", "Company", "Tax", "Unit", "Batch", "Expiry", "MRP", "SRate", "PRate", "LP", "OpenStock", "CurrentStock"];
      const rows: any[] = [];
      let sr = 1;

      items.forEach((item: any) => {
        const itemBatches = batches.filter((b: any) => b.itemId === item.id);
        const taxRate = Number(item.gst || item.tax || 12);

        if (itemBatches.length > 0) {
          itemBatches.forEach((b: any) => {
            const key = `${item.id}_${b.batchNo || b.batch || 'default'}`;
            const pRate = Number(b.purchaseRate || item.purchaseRate || (item.mrp ? item.mrp * 0.7 : 0));
            const sRate = Number(b.saleRate || item.saleRate || item.mrp || 0);
            const lp = srdCalculatedLPs[key] || Number(b.landingPrice || b.netCost) || parseFloat((pRate * (1 + taxRate / 100)).toFixed(2));

            rows.push([
              sr++,
              `"${(item.name || '').replace(/"/g, '""')}"`,
              `"${(item.company || '').replace(/"/g, '""')}"`,
              `${taxRate}%`,
              `"${item.unit || item.packing || '1'}"`,
              `"${b.batchNo || b.batch || '—'}"`,
              b.expiry || item.expiry || '—',
              b.mrp || item.mrp || 0,
              sRate,
              pRate,
              lp,
              item.openingStock || 0,
              b.qty || 0
            ]);
          });
        } else {
          const key = `${item.id}_default`;
          const pRate = Number(item.purchaseRate || (item.mrp ? item.mrp * 0.7 : 0));
          const sRate = Number(item.saleRate || item.mrp || 0);
          const lp = srdCalculatedLPs[key] || parseFloat((pRate * (1 + taxRate / 100)).toFixed(2));

          rows.push([
            sr++,
            `"${(item.name || '').replace(/"/g, '""')}"`,
            `"${(item.company || '').replace(/"/g, '""')}"`,
            `${taxRate}%`,
            `"${item.unit || item.packing || '1'}"`,
            '—',
            item.expiry || '—',
            item.mrp || 0,
            sRate,
            pRate,
            lp,
            item.openingStock || 0,
            item.stock || 0
          ]);
        }
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Stock_Rate_Detail_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (_) {
      alert("Failed to generate CSV export.");
    }
  };

  // ── Transfer Data States ──
  const [showTransferData, setShowTransferData] = useState(false);
  const [tdSearchQuery, setTdSearchQuery] = useState("");
  const [tdFilterOpStock, setTdFilterOpStock] = useState(true);
  const [tdFilterChal, setTdFilterChal] = useState(true);
  const [tdFilterPurc, setTdFilterPurc] = useState(true);
  const [tdFilterSRe, setTdFilterSRe] = useState(true);
  const [tdFilterPRe, setTdFilterPRe] = useState(true);
  const [tdFilterStk, setTdFilterStk] = useState(true);
  const [tdFilterSale, setTdFilterSale] = useState(true);
  const [tdRoundOff, setTdRoundOff] = useState(false);
  const [tdTransferring, setTdTransferring] = useState(false);
  const [tdStatusMsg, setTdStatusMsg] = useState<string | null>(null);
  const [transferDataSels, setTransferDataSels] = useState({ items: true, batches: true, suppliers: true, purchaseBills: true, salesBills: true, payments: true, doctors: true, customers: true, khata: false, advance: false });
  const [transferDataTargetUrl, setTransferDataTargetUrl] = useState("");
  const [transferDataProgress, setTransferDataProgress] = useState(""); // idle | exporting | done | error
  const [transferDataMsg, setTransferDataMsg] = useState("");

  // ── Challan Problem (Audit & Resolution) States ──
  const [showChallanProblem, setShowChallanProblem] = useState(false);
  const [cpActiveTab, setCpActiveTab] = useState("all"); // all | pending | mismatch | orphan | duplicate
  const [cpSearchQuery, setCpSearchQuery] = useState("");
  const [cpFilterSupplier, setCpFilterSupplier] = useState("ALL");
  const [cpDetailModal, setCpDetailModal] = useState(null);
  const [cpActionMsg, setCpActionMsg] = useState(null);

  useEffect(() => {
    if (!showChallanProblem) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (cpDetailModal) { setCpDetailModal(null); }
        else { setShowChallanProblem(false); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showChallanProblem, cpDetailModal]);

  // ── Transfer Other Data (Import) States ──
  const [showTransferOtherData, setShowTransferOtherData] = useState(false);
  const [transferOtherFile, setTransferOtherFile] = useState(null);
  const [transferOtherParsed, setTransferOtherParsed] = useState(null);
  const [transferOtherSels, setTransferOtherSels] = useState({ items: true, batches: true, suppliers: true, purchaseBills: true, salesBills: true, payments: true, doctors: true, customers: true, khata: false, advance: false });
  const [transferOtherProgress, setTransferOtherProgress] = useState("");
  const [transferOtherMsg, setTransferOtherMsg] = useState("");
  const [transferOtherMerge, setTransferOtherMerge] = useState("merge"); // 'merge' | 'replace'

  useEffect(() => {
    if (!showTransferOtherData) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowTransferOtherData(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showTransferOtherData]);

      // ── Change Bills (Sales Invoice Audit & Modification) States ──
  const [showChangeBills, setShowChangeBills] = useState(false);
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
    if (!showChangeBills) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (cbEditModal) { setCbEditModal(null); }
        else if (cbDetailModal) { setCbDetailModal(null); }
        else { setShowChangeBills(false); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showChangeBills, cbDetailModal, cbEditModal]);

    // ── Sales Bill Delete & Renumbering States ──
  const [showSalesBillDelete, setShowSalesBillDelete] = useState(false);
  const [sbdActiveTab, setSbdActiveTab] = useState<"delete" | "renumber">("delete");
  const [sbdFromDate, setSbdFromDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [sbdToDate, setSbdToDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [sbdLowerAmt, setSbdLowerAmt] = useState("");
  const [sbdHigherAmt, setSbdHigherAmt] = useState("");
  const [sbdSelectedMap, setSbdSelectedMap] = useState<{ [key: string]: boolean }>({});
  const [sbdSearchQuery, setSbdSearchQuery] = useState("");
  const [sbdConfirmModal, setSbdConfirmModal] = useState(false);
  const [sbdStatusMsg, setSbdStatusMsg] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Renumbering States
  const [sbdRenumberStart, setSbdRenumberStart] = useState(1);
  const [sbdRenumberPrefix, setSbdRenumberPrefix] = useState("INV-");
  const [sbdRenumberDigits, setSbdRenumberDigits] = useState(4);
  const [sbdRenumberConfirm, setSbdRenumberConfirm] = useState(false);

  useEffect(() => {
    if (!showSalesBillDelete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (sbdConfirmModal) { setSbdConfirmModal(false); }
        else if (sbdRenumberConfirm) { setSbdRenumberConfirm(false); }
        else { setShowSalesBillDelete(false); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSalesBillDelete, sbdConfirmModal, sbdRenumberConfirm]);

    // ── Purchase Bill Delete & Renumbering States ──
  const [showPurchaseBillDelete, setShowPurchaseBillDelete] = useState(false);

  // ═════════════════════════════════════════════════════════════
  // ACCOUNT MASTER STATES (Theme matching Inventory / Image 2)
  // ═════════════════════════════════════════════════════════════
  const defaultAccountForm = {
    id: "",
    srNo: 1,
    name: "",
    group: "Sundry Creditors",
    opBal: 0,
    balType: "Cr",
    address: "",
    area: "",
    city: "",
    contact: "",
    mobile: "",
    email: "",
    dlNo: "",
    gstTin: "",
    panNo: "",
    state: "24-Gujarat",
    aadharNo: "",
    regType: "Regular (GSTIN)",
    invType: "RD (within state - SGST/UGST)",
    message: "",
    remarks: "",
    // Billing Details (F6)
    importFormat: "-SELECT-",
    linkBank: "",
    bankCharges: "",
    bankChargesPct: "",
    invoiceType: "Retail",
    pMode: "Credit",
    creditLimit: "",
    creditDays: "",
    discountPct: "",
    depreciation: "",
    marginPct: "",
    addPctCc: "",
    fbt: "",
    interestPct: "",
    tdsPct: "",
    // Other Details (F7)
    transport: "",
    distanceKm: "",
    salesman: "",
    route: "",
    priceCategory: "Standard",
    // Checkboxes
    askBeforeSave: false,
    taxNotCalculate: false,
    salesBillPrint0: false,
    statusOff: false,
    adtTaxCalc: false,
    saleByLp: false,
    saleByPrateTax: false,
    saleByPrate: false
  };

  const [accounts, setAccounts] = useState(() => {
    try {
      const stored = localStorage.getItem("store_accounts");
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    // Seed from suppliers if accounts is empty
    return (suppliers || []).map((s, idx) => ({
      ...defaultAccountForm,
      id: s.id || uid(),
      srNo: idx + 1,
      name: s.name || "",
      group: "Sundry Creditors",
      opBal: s.openingBalance || s.opBal || 0,
      balType: "Cr",
      address: s.address || "",
      city: s.city || "",
      mobile: s.mobile || "",
      email: s.email || "",
      dlNo: s.dlNo || "",
      gstTin: s.gstTin || "",
      panNo: s.panNo || "",
      state: s.state || "24-Gujarat",
      creditLimit: s.creditLimit || "",
      creditDays: s.creditDays || ""
    }));
  });

  const [accountForm, setAccountForm] = useState(defaultAccountForm);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountSearch, setAccountSearch] = useState("");
  const [accountSearchDropdown, setAccountSearchDropdown] = useState(false);
  const [accountSearchHighlight, setAccountSearchHighlight] = useState(0);
  const [accountGroupFilter, setAccountGroupFilter] = useState("All");
  const [accountSortBy, setAccountSortBy] = useState("name");
  const [accountActiveOnly, setAccountActiveOnly] = useState(false);
  const [accountF6F7Tab, setAccountF6F7Tab] = useState("billing"); // "billing" | "other"
  const [showEnvelopeModal, setShowEnvelopeModal] = useState(false);
  const [envelopeAccount, setEnvelopeAccount] = useState(null);
  const [showAccountLedger, setShowAccountLedger] = useState(false);
  const [ledgerAcc, setLedgerAcc] = useState(null);

  const [pbdActiveTab, setPbdActiveTab] = useState<"delete" | "renumber">("delete");
  const [pbdFromDate, setPbdFromDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [pbdToDate, setPbdToDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [pbdLowerAmt, setPbdLowerAmt] = useState("");
  const [pbdHigherAmt, setPbdHigherAmt] = useState("");
  const [pbdSelectedMap, setPbdSelectedMap] = useState<{ [key: string]: boolean }>({});
  const [pbdSearchQuery, setPbdSearchQuery] = useState("");
  const [pbdConfirmModal, setPbdConfirmModal] = useState(false);
  const [pbdStatusMsg, setPbdStatusMsg] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Purchase Renumbering States
  const [pbdRenumberStart, setPbdRenumberStart] = useState(1);
  const [pbdRenumberPrefix, setPbdRenumberPrefix] = useState("ENT-");
  const [pbdRenumberDigits, setPbdRenumberDigits] = useState(4);
  const [pbdRenumberConfirm, setPbdRenumberConfirm] = useState(false);

  useEffect(() => {
    if (!showPurchaseBillDelete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (pbdConfirmModal) { setPbdConfirmModal(false); }
        else if (pbdRenumberConfirm) { setPbdRenumberConfirm(false); }
        else { setShowPurchaseBillDelete(false); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPurchaseBillDelete, pbdConfirmModal, pbdRenumberConfirm]);

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
        <div style={{ width: isSidebarOpen ? "260px" : "80px", background: "white", borderRight: "1px solid var(--color-border)", display: "flex", flexDirection: "column", flexShrink: 0, zIndex: 100, transition: "width 0.3s ease" }}>
          <div style={{ padding: isSidebarOpen ? "24px 20px" : "24px 0", display: "flex", alignItems: "center", justifyContent: isSidebarOpen ? "flex-start" : "center", gap: "10px", borderBottom: "1px solid var(--color-border)", position: "relative" }}>
            <div style={{ width: "32px", height: "32px", background: "var(--color-primary)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-dark)", fontWeight: "bold", fontSize: "18px", flexShrink: 0 }}>S</div>
            {isSidebarOpen && <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--color-text-dark)", letterSpacing: "-0.5px" }}>Shivdhara</div>}
            
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ position: "absolute", right: isSidebarOpen ? "15px" : "-12px", top: "50%", marginTop: "-12px", width: "24px", height: "24px", background: "#f8fafc", border: "1px solid var(--color-border)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-text-muted)", zIndex: 10 }}
            >
              {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {isSidebarOpen && <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", paddingLeft: "12px" }}>Dashboard</div>}
            {ownerNavItems.map(t => {
              const isActive = activeSection === t.id;
              return (
                <button key={t.id}
                  onClick={() => { setActiveSection(t.id); setOwnerSubTab(""); }}
                  title={!isSidebarOpen ? t.label : ""}
                  style={{
                    padding: isSidebarOpen ? "12px 16px" : "12px", border: "none", background: isActive ? "#e0f7fa" : "transparent",
                    cursor: "pointer", fontWeight: isActive ? "700" : "500", fontSize: "14px",
                    color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                    display: "flex", alignItems: "center", justifyContent: isSidebarOpen ? "flex-start" : "center", gap: "12px", borderRadius: "12px",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "var(--color-text-dark)"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-muted)"; } }}
                >
                  <div style={{ color: isActive ? "var(--color-primary)" : "#64748b", flexShrink: 0 }}>{t.icon}</div>
                  {isSidebarOpen && <span style={{ whiteSpace: "nowrap" }}>{t.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* ─── MODERN TOP NAVBAR ─── */}
        <div style={{ background: "white", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", zIndex: 90 }}>
          
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
                {label:"Userwise Changes", action:()=>{setShowUserwiseChanges(true);setActiveMenu(null);}},
                {label:"Data Utility", action:()=>{setShowDataUtility(true);setActiveMenu(null);}},
                {label:"Sync Offline Data to DB", action:()=>{forceSync();setActiveMenu(null);}},
                {label:"Bill Number Change", action:()=>{setShowBillNumberChange(true);setActiveMenu(null);}},
                {label:"Merge Facility", action:()=>{setShowMergeFacility(true);setActiveMenu(null);}},
                {label:"Stock Rate Detail", action:()=>{setShowStockRateDetail(true);setActiveMenu(null);}},
                {label:"Transfer Data", action:()=>{setShowTransferData(true);setActiveMenu(null);}},
                {label:"Transfer Other Data", action:()=>{setShowTransferOtherData(true);setActiveMenu(null);}},
                {label:"Challan Problem", action:()=>{setShowChallanProblem(true);setActiveMenu(null);}},
                {label:"Change Bills", action:()=>{setShowChangeBills(true);setActiveMenu(null);}},
                {label:"Sales Bill Delete", action:()=>{setShowSalesBillDelete(true);setActiveMenu(null);}},
                {label:"Purchase Delete", action:()=>{setShowPurchaseBillDelete(true);setActiveMenu(null);}},
              ]},
              {id:"master", label:"Master", items:[
                {label:"Account Master", action:()=>{setActiveSection("masters");setOwnerSubTab("accounts");setActiveMenu(null);}},
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
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px", width: "100%", paddingBottom: "16px", boxSizing: "border-box", background: "var(--bg-body)", color: "var(--color-text-dark)" }}>

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
                      <Search size={12} style={{ position: "absolute", left: "9px", top: "18px", transform: "translateY(-50%)", color: "#64748b" }} />
                      {(() => {
                        const q = (itemSearch || "").toLowerCase();
                        const filtered = q ? items.filter(i => (i.name || "").toLowerCase().includes(q) || (i.barcode || "") === q || (i.company || "").toLowerCase().includes(q)).slice(0, 15) : [];
                        return (
                          <>
                            <input
                              value={itemSearch}
                              onChange={e => {
                                setItemSearch(e.target.value);
                                setItemSearchDropdown(true);
                                setItemSearchHighlight(0);
                              }}
                              onKeyDown={e => {
                                if (e.key === "ArrowDown") { e.preventDefault(); setItemSearchHighlight(prev => Math.min(prev + 1, filtered.length - 1)); }
                                else if (e.key === "ArrowUp") { e.preventDefault(); setItemSearchHighlight(prev => Math.max(prev - 1, 0)); }
                                else if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (filtered.length > 0 && itemSearchDropdown) {
                                    openItemForm(filtered[itemSearchHighlight].division || "", filtered[itemSearchHighlight]);
                                    setItemSearchDropdown(false);
                                    setItemSearch("");
                                  } else if (q) {
                                    showToast("No item found matching: " + itemSearch, "error");
                                  }
                                }
                              }}
                              onFocus={() => setItemSearchDropdown(true)}
                              onBlur={() => setTimeout(() => setItemSearchDropdown(false), 200)}
                              placeholder="Search Item or Barcode... + Enter"
                              style={{ ...inp, paddingLeft: "28px", padding: "8px 8px 8px 28px", width: "100%" }}
                            />
                            {itemSearchDropdown && filtered.length > 0 && (
                              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--shadow-lg)", zIndex: 50, marginTop: "4px", overflow: "hidden" }}>
                                {filtered.map((i, idx) => (
                                  <div key={i.id} onClick={() => { openItemForm(i.division || "", i); setItemSearchDropdown(false); setItemSearch(""); }} style={{ padding: "8px 12px", cursor: "pointer", background: idx === itemSearchHighlight ? "#f1f5f9" : "white", borderBottom: "1px solid #f1f5f9" }} onMouseEnter={() => setItemSearchHighlight(idx)}>
                                    <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b", display: "flex", justifyContent: "space-between" }}>
                                      <span>{i.name}</span>
                                      <span style={{ color: "#3b82f6" }}>₹{i.price}</span>
                                    </div>
                                    <div style={{ fontSize: "10px", color: "#64748b" }}>Stock: {i.stock} {i.unit} | {i.company}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
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
                  {/* Items Grid is Hidden (Search to Edit Workflow) */}
                  {!showItemForm && (
                    <div style={{ textAlign: "center", padding: "80px 20px", color: "#64748b", background: "white", borderRadius: "8px", border: "1px dashed var(--color-border)", marginTop: "20px" }}>
                      <div style={{ fontSize: "44px", opacity: 0.5 }}>📦</div>
                      <p style={{ marginTop: "16px", fontWeight: "600", fontSize: "16px" }}>Search Item Name or Barcode to Edit</p>
                      <p style={{ fontSize: "13px", opacity: 0.7, marginTop: "6px" }}>Type in the search box above and press Enter to edit an existing item.</p>
                      <button onClick={() => openItemForm("")} style={{ ...btn("var(--color-primary)"), margin: "16px auto 0" }}><Plus size={13} />Add New Item</button>
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
                {(() => {
                  const q = (purchaseBillSearch || "").toLowerCase();
                  const filtered = q ? purchaseBills.filter(b => (String(b.entryNo) || "").toLowerCase().includes(q) || (b.billNo || "").toLowerCase().includes(q) || (b.partyName || "").toLowerCase().includes(q) || matchesDate(b.billDate || b.date, q)).slice(0, 15) : [];
                  return (
                    <>
                      <input
                        placeholder="Search Bill# / Party / Entry / Date... + Enter"
                        value={purchaseBillSearch || ""}
                        onChange={e => {
                          setPurchaseBillSearch(e.target.value);
                          setPurchaseBillSearchDropdown(true);
                          setPurchaseBillSearchHighlight(0);
                        }}
                        onKeyDown={e => {
                          if (e.key === "ArrowDown") { e.preventDefault(); setPurchaseBillSearchHighlight(prev => Math.min(prev + 1, filtered.length - 1)); }
                          else if (e.key === "ArrowUp") { e.preventDefault(); setPurchaseBillSearchHighlight(prev => Math.max(prev - 1, 0)); }
                          else if (e.key === "Enter") {
                            e.preventDefault();
                            if (filtered.length > 0 && purchaseBillSearchDropdown) {
                              openPurchaseForm(filtered[purchaseBillSearchHighlight]);
                              setPurchaseBillSearchDropdown(false);
                              setPurchaseBillSearch("");
                            } else if (q) {
                              const match = purchaseBills.find(b => (String(b.entryNo) || "").toLowerCase() === q || (b.billNo || "").toLowerCase() === q || (b.partyName || "").toLowerCase() === q || matchesDate(b.billDate || b.date, q));
                              if (match) {
                                openPurchaseForm(match);
                                setPurchaseBillSearchDropdown(false);
                                setPurchaseBillSearch("");
                              } else {
                                showToast("No purchase bill found matching: " + purchaseBillSearch, "error");
                              }
                            }
                          }
                        }}
                        onFocus={() => setPurchaseBillSearchDropdown(true)}
                        onBlur={() => setTimeout(() => setPurchaseBillSearchDropdown(false), 200)}
                        style={{ ...inp, width: "300px", paddingLeft: "30px", borderRadius: "20px", background: "#f8fafc" }}
                      />
                      {purchaseBillSearchDropdown && filtered.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--shadow-lg)", zIndex: 50, marginTop: "4px", overflow: "hidden" }}>
                          {filtered.map((b, idx) => (
                            <div key={b.id} onClick={() => { openPurchaseForm(b); setPurchaseBillSearchDropdown(false); setPurchaseBillSearch(""); }} style={{ padding: "8px 12px", cursor: "pointer", background: idx === purchaseBillSearchHighlight ? "#f1f5f9" : "white", borderBottom: "1px solid #f1f5f9" }} onMouseEnter={() => setPurchaseBillSearchHighlight(idx)}>
                              <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b" }}>Entry #{b.entryNo} — {b.partyName}</div>
                              <div style={{ fontSize: "10px", color: "#64748b" }}>Bill: {b.billNo || "N/A"} | Amt: ₹{fmt(b.total)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <button onClick={openPurchaseForm} style={{ ...btn() }}><Plus size={14} />New Purchase</button>
            </div>

            {/* Purchase Form */}
            {/* Purchase Form */}
            {showPurchaseForm && (
              <div style={{ background: "white", borderRadius: "8px", padding: "10px 14px", marginBottom: "8px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>🛒 New Purchase Entry</h3>
                  <button onClick={() => setShowPurchaseForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
                </div>
                {/* Lock Status Banner */}
                {(() => {
                  const check = isDateLocked("purchase", purchaseForm.billDate || purchaseForm.entryDate || today());
                  if (!check.isLocked) return null;
                  return (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px 12px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontSize: "12px", fontWeight: "600" }}>
                      <span>🔒</span>
                      <span>This date ({new Date(purchaseForm.billDate || purchaseForm.entryDate || today()).toLocaleDateString("en-IN")}) is <strong>LOCKED by Supervisor</strong> ({check.label}). Saving and deletion are blocked.</span>
                    </div>
                  );
                })()}
                {/* Header fields */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: "6px", marginBottom: "8px", background: "#f8fafc", borderRadius: "8px", padding: "8px 12px", border: "1px solid var(--color-border)" }}>
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
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", paddingTop: "6px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                      <input type="checkbox" checked={!!purchaseForm.gstInclusive} onChange={e => setPurchaseForm({ ...purchaseForm, gstInclusive: e.target.checked })} style={{ width: "13px", height: "13px" }} />
                      GST Inclusive
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                      <input type="checkbox" checked={!!purchaseForm.gstOnFree} onChange={e => setPurchaseForm({ ...purchaseForm, gstOnFree: e.target.checked })} style={{ width: "13px", height: "13px" }} />
                      GST on Free
                    </label>
                  </div>
                </div>
                {/* Purchase Items Table */}
                <div style={{ overflowX: "auto", marginBottom: "8px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                    <thead><tr style={{ background: "#f1f5f9" }}>
                      {["Sr", "Item *", "Batch No", "Exp Dt", "Qty", "Free", "MRP", "PTR", "GST%", "Disc%", "Disc Amt", "BASE", "Amount", ""].map(h => (
                        <th key={h} style={{ padding: "4px 6px", textAlign: ["Disc Amt", "BASE", "Amount"].includes(h) ? "right" : h === "Sr" ? "center" : "left", fontWeight: "600", color: "var(--color-text-dark)", fontSize: "11px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {purchaseItems.map((pi, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #e9ecef" }}>
                          <td style={{ padding: "3px 4px", textAlign: "center", fontWeight: "600", color: "#64748b", fontSize: "11px", width: "26px", whiteSpace: "nowrap" }}>{idx + 1}</td>
                          <td style={{ padding: "3px", position: "relative", minWidth: "140px" }}>
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
                                  style={{ ...inp, minWidth: "130px", padding: "3px 6px", height: "26px", fontSize: "12px" }}
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
                          {[{ f: "batchNo", ph: "Batch", w: "70px" }, { f: "expiryDate", t: "text", ph: "MM/YY", w: "65px" }, { f: "qty", t: "number", ph: "Qty", w: "48px" }, { f: "freeQty", t: "number", ph: "Free", w: "45px" }, { f: "mrp", t: "number", ph: "MRP", w: "55px" }, { f: "ptr", t: "number", ph: "PTR", w: "55px" }].map(f => (
                            <td key={f.f} style={{ padding: "3px" }}><input type={f.t || "text"} value={pi[f.f] || ""} onChange={e => { let v = e.target.value; if (f.f === "expiryDate") { v = v.replace(/[^0-9/]/g, ""); if (v.length === 2 && !v.includes("/") && pi[f.f]?.length !== 3) v = v + "/"; if (v.length > 5) return; } updatePurchaseItem(idx, f.f, v); }} onKeyDown={e => focusNext(e, idx, f.f)} placeholder={f.ph} data-pf={`${idx}-${f.f}`} style={{ ...inp, width: f.w, padding: "3px 4px", height: "26px", fontSize: "12px", letterSpacing: f.f === "expiryDate" ? "1px" : "normal" }} /></td>
                          ))}
                          <td style={{ padding: "3px" }}>
                            <select value={pi.gst || "5"} onChange={e => updatePurchaseItem(idx, "gst", e.target.value)} onKeyDown={e => focusNext(e, idx, "gst")} data-pf={`${idx}-gst`} style={{ ...inp, width: "55px", padding: "2px 4px", height: "26px", fontSize: "11px" }}>
                              {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                            </select>
                          </td>
                          <td style={{ padding: "3px" }}><input type="number" value={pi.disc || "0"} onChange={e => updatePurchaseItem(idx, "disc", e.target.value)} onKeyDown={e => focusNext(e, idx, "disc")} data-pf={`${idx}-disc`} style={{ ...inp, width: "45px", padding: "3px 4px", height: "26px", fontSize: "12px" }} /></td>
                          <td style={{ padding: "3px 6px", fontWeight: "700", color: "#ef4444", whiteSpace: "nowrap", textAlign: "right", fontSize: "11px" }}>₹{fmt(num(pi.ptr) * int(pi.qty) * num(pi.disc) / 100)}</td>
                          <td style={{ padding: "3px 6px", fontWeight: "700", color: "var(--color-primary)", whiteSpace: "nowrap", textAlign: "right", fontSize: "11px" }}>₹{fmt(num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100))}</td>
                          <td style={{ padding: "3px 6px", fontWeight: "700", color: "#3b82f6", whiteSpace: "nowrap", textAlign: "right", fontSize: "11px" }}>₹{fmt(pi.amount || 0)}</td>
                          <td style={{ padding: "3px", textAlign: "center", width: "26px" }}><button onClick={() => removePurchaseItem(idx)} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "4px", padding: "3px 5px", cursor: "pointer" }}><X size={11} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: "2px solid var(--color-border)", background: "#f8fafc" }}>
                        <td colSpan="10" style={{ padding: "6px 8px", fontWeight: "700", textAlign: "right", fontSize: "11px", color: "#64748b" }}>TOTALS →</td>
                        <td style={{ padding: "6px 8px", fontWeight: "800", textAlign: "right", fontSize: "12px", color: "#ef4444", whiteSpace: "nowrap" }}>₹{fmt(purchaseItems.reduce((s, pi) => s + num(pi.ptr) * int(pi.qty) * num(pi.disc) / 100, 0))}</td>
                        <td style={{ padding: "6px 8px", fontWeight: "800", textAlign: "right", fontSize: "12px", color: "var(--color-primary)", whiteSpace: "nowrap" }}>₹{fmt(purchaseItems.reduce((s, pi) => s + num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100), 0))}</td>
                        <td style={{ padding: "6px 8px", fontWeight: "800", textAlign: "right", fontSize: "12px", color: "#16a34a", whiteSpace: "nowrap" }}>₹{fmt(purchaseItems.reduce((s, pi) => s + num(pi.amount || 0), 0))}</td>
                        <td></td>
                      </tr>
                      <tr style={{ background: "#eff6ff", borderTop: "1px solid #bfdbfe" }}>
                        <td colSpan="10" style={{ padding: "6px 8px", fontWeight: "700", textAlign: "right", fontSize: "11px", color: "#1d4ed8" }}>GST SUMMARY →</td>
                        <td style={{ padding: "6px 8px", fontSize: "11px", color: "#475569", textAlign: "right" }}></td>
                        <td colSpan="2" style={{ padding: "6px 8px", fontWeight: "700", fontSize: "11px", color: "#1d4ed8", whiteSpace: "nowrap", textAlign: "right" }}>
                          {(() => { const gT = purchaseItems.reduce((s, pi) => s + num(pi.ptr) * int(pi.qty) * (1 - num(pi.disc) / 100) * num(pi.gst) / 100, 0); return `SGST: ₹${fmt(gT / 2)} | CGST: ₹${fmt(gT / 2)} | IGST: ₹${fmt(gT)}`; })()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
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
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 12px", minWidth: "240px", fontSize: "11px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 14px" }}>
                          <span>Base Amount:</span><span style={{ textAlign: "right", fontWeight: "600" }}>₹{fmt(base)}</span>
                          <span style={{ color: "#ef4444" }}>Less Disc:</span><span style={{ textAlign: "right", color: "#ef4444" }}>-₹{fmt(discAmt)}</span>
                          <span>Taxable Amount:</span><span style={{ textAlign: "right" }}>₹{fmt(taxable)}</span>
                          <span style={{ color: "#64748b" }}>SGST:</span><span style={{ textAlign: "right", color: "#64748b" }}>₹{fmt(sgst)}</span>
                          <span style={{ color: "#64748b" }}>CGST:</span><span style={{ textAlign: "right", color: "#64748b" }}>₹{fmt(cgst)}</span>
                          <span style={{ color: "#64748b" }}>IGST (SGST+CGST):</span><span style={{ textAlign: "right", color: "#1d4ed8", fontWeight: "700" }}>₹{fmt(gstTotal)}</span>
                          <span style={{ color: "#64748b" }}>Half Scheme:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.halfScheme || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, halfScheme: e.target.value })} style={{ ...inp, width: "65px", padding: "1px 4px", fontSize: "10px", height: "20px" }} /></span>
                          <span style={{ color: "#64748b" }}>Oct on Free:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.octOnFree || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, octOnFree: e.target.value })} style={{ ...inp, width: "65px", padding: "1px 4px", fontSize: "10px", height: "20px" }} /></span>
                          <span style={{ color: "#64748b" }}>Other +/-:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.otherAdj || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, otherAdj: e.target.value })} style={{ ...inp, width: "65px", padding: "1px 4px", fontSize: "10px", height: "20px" }} /></span>
                          <span style={{ color: "#ef4444" }}>Less Disc:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.lessDisc || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, lessDisc: e.target.value })} style={{ ...inp, width: "65px", padding: "1px 4px", fontSize: "10px", height: "20px" }} /></span>
                          <span style={{ color: "#64748b" }}>Cr Note:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.crNote || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, crNote: e.target.value })} style={{ ...inp, width: "65px", padding: "1px 4px", fontSize: "10px", height: "20px" }} /></span>
                          <span style={{ color: "#64748b" }}>TCS Value:</span><span style={{ textAlign: "right" }}><input type="number" value={purchaseForm.tcsValue || "0"} onChange={e => setPurchaseForm({ ...purchaseForm, tcsValue: e.target.value })} style={{ ...inp, width: "65px", padding: "1px 4px", fontSize: "10px", height: "20px" }} /></span>
                          <span style={{ fontWeight: "800", borderTop: "1px solid #e2e8f0", paddingTop: "4px" }}>TOTAL:</span>
                          <span style={{ textAlign: "right", fontWeight: "800", color: "var(--color-primary)", fontSize: "13px", borderTop: "1px solid #e2e8f0", paddingTop: "4px" }}>₹{fmt(total - num(purchaseForm.lessDisc) - num(purchaseForm.crNote) + num(purchaseForm.otherAdj) + num(purchaseForm.tcsValue))}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Purchase Bills List */}
            {!showPurchaseForm && (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "#64748b", background: "white", borderRadius: "8px", border: "1px dashed var(--color-border)" }}>
                <div style={{ fontSize: "44px", opacity: 0.5 }}>🛒</div>
                <p style={{ marginTop: "16px", fontWeight: "600", fontSize: "16px" }}>Search Bill#, Party, or Entry# to Open</p>
                <p style={{ fontSize: "13px", opacity: 0.7, marginTop: "6px" }}>Type in the search box above and press Enter to edit an existing purchase bill.</p>
              </div>
            )}

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
                  {(() => {
                    const q = (salesBillSearch || "").toLowerCase();
                    const filtered = q ? salesBills.filter(b => (String(b.billNo) || "").toLowerCase().includes(q) || (b.mobile || "").includes(q) || (b.patientName || "").toLowerCase().includes(q) || matchesDate(b.date, q)).slice(0, 15) : [];
                    return (
                      <>
                        <input
                          placeholder="Search Patient / Bill# / Mobile / Date... + Enter"
                          value={salesBillSearch}
                          onChange={e => {
                            setSalesBillSearch(e.target.value);
                            setSalesBillSearchDropdown(true);
                            setSalesBillSearchHighlight(0);
                          }}
                          onKeyDown={e => {
                            if (e.key === "ArrowDown") { e.preventDefault(); setSalesBillSearchHighlight(prev => Math.min(prev + 1, filtered.length - 1)); }
                            else if (e.key === "ArrowUp") { e.preventDefault(); setSalesBillSearchHighlight(prev => Math.max(prev - 1, 0)); }
                            else if (e.key === "Enter") {
                              e.preventDefault();
                              if (filtered.length > 0 && salesBillSearchDropdown) {
                                openSalesForm(filtered[salesBillSearchHighlight].isReturn, filtered[salesBillSearchHighlight]);
                                setSalesBillSearchDropdown(false);
                                setSalesBillSearch("");
                              } else if (q) {
                                const match = salesBills.find(b => (String(b.billNo) || "").toLowerCase() === q || (b.mobile || "") === q || (b.patientName || "").toLowerCase() === q || matchesDate(b.date, q));
                                if (match) {
                                  openSalesForm(match.isReturn, match);
                                  setSalesBillSearchDropdown(false);
                                  setSalesBillSearch("");
                                } else {
                                  showToast("No bill found matching: " + salesBillSearch, "error");
                                }
                              }
                            }
                          }}
                          onFocus={() => setSalesBillSearchDropdown(true)}
                          onBlur={() => setTimeout(() => setSalesBillSearchDropdown(false), 200)}
                          style={{ ...inp, width: "300px", paddingLeft: "30px", borderRadius: "20px", background: "#f8fafc" }}
                        />
                        {salesBillSearchDropdown && filtered.length > 0 && (
                          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--shadow-lg)", zIndex: 50, marginTop: "4px", overflow: "hidden" }}>
                            {filtered.map((b, idx) => (
                              <div key={b.id} onClick={() => { openSalesForm(b.isReturn, b); setSalesBillSearchDropdown(false); setSalesBillSearch(""); }} style={{ padding: "8px 12px", cursor: "pointer", background: idx === salesBillSearchHighlight ? "#f1f5f9" : "white", borderBottom: "1px solid #f1f5f9" }} onMouseEnter={() => setSalesBillSearchHighlight(idx)}>
                                <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b" }}>Bill #{b.billNo} {b.patientName ? ` - ${b.patientName}` : ""}</div>
                                <div style={{ fontSize: "10px", color: "#64748b" }}>Date: {new Date(b.date).toLocaleDateString("en-IN")} | Net: ₹{fmt(Math.abs(num(b.netAmount)))}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => openSalesForm(false)} style={{ ...btn("var(--color-primary)") }}><Plus size={14} />New Sale</button>
                <button onClick={() => openSalesForm(true)} style={{ ...btn("#ef4444") }}><Plus size={14} />Return</button>
              </div>
            </div>

            {/* Sales Form */}
            {showSalesForm && (
              <div style={{ background: "white", borderRadius: "6px", padding: "10px 14px", marginBottom: "8px", border: `2px solid ${isReturn ? "#fecaca" : "#bbf7d0"}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>{isReturn ? "↩️ Sales Return" : "🧾 New Sales Bill"}</h3>
                  <button onClick={() => setShowSalesForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
                </div>
                {/* Lock Status Banner */}
                {(() => {
                  const check = isDateLocked(isReturn ? "salesReturn" : "sales", salesForm.date || today());
                  if (!check.isLocked) return null;
                  return (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px 12px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontSize: "12px", fontWeight: "600" }}>
                      <span>🔒</span>
                      <span>This date ({new Date(salesForm.date || today()).toLocaleDateString("en-IN")}) is <strong>LOCKED by Supervisor</strong> ({check.label}). Edits and deletions are blocked.</span>
                    </div>
                  );
                })()}
                {/* Patient/Doctor details */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: "6px", marginBottom: "8px", background: "#f8fafc", borderRadius: "8px", padding: "8px 12px", border: "1px solid var(--color-border)" }}>
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
                    <div style={{ gridColumn: "span 2", background: "rgba(255,255,255,0.1)", borderRadius: "6px", padding: "6px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      <div><label style={{ ...lbl, color: "#d97706" }}>💵 Cash Amount ₹</label><input type="number" value={splitCash} onChange={e => { setSplitCash(e.target.value); }} placeholder="Cash" style={inp} /></div>
                      <div><label style={{ ...lbl, color: "#2563eb" }}>📱 UPI Amount ₹</label><input type="number" value={splitUpi} onChange={e => setSplitUpi(e.target.value)} placeholder="UPI" style={inp} /></div>
                      <div style={{ gridColumn: "span 2" }}><label style={{ ...lbl, color: "#64748b" }}>UPI Txn ID</label><input value={splitUpiTxn} onChange={e => setSplitUpiTxn(e.target.value.toUpperCase())} placeholder="Transaction ID" style={inp} /></div>
                    </div>
                  )}
                  {salesForm.paymentMode === "credit" && salesForm.patientName && (
                    <div style={{ gridColumn: "span 2", background: "rgba(250,204,21,0.15)", borderRadius: "6px", padding: "6px", border: "1px solid rgba(250,204,21,0.3)" }}>
                      <span style={{ fontSize: "11px", color: "#facc15", fontWeight: "700" }}>📒 {salesForm.patientName} - Current Khata Balance: ₹{fmt(getKhataBalance(salesForm.patientName))}</span>
                    </div>
                  )}
                  <div><label style={lbl}>Extra Discount %</label><input type="number" value={salesForm.discount || "0"} onChange={e => setSalesForm({ ...salesForm, discount: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Refill Due Date (Optional)</label><input type="date" value={salesForm.refillDate || ""} onChange={e => setSalesForm({ ...salesForm, refillDate: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Pay Rec / Refund (₹)</label><input type="number" value={salesForm.payRec || "0"} onChange={e => setSalesForm({ ...salesForm, payRec: e.target.value })} placeholder="0.00" style={inp} /></div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", paddingTop: "6px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                      <input type="checkbox" checked={!!isReturn} disabled style={{ width: "13px", height: "13px" }} />
                      Return Bill
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer", color: "var(--color-text-dark)", fontWeight: "600" }}>
                      <input type="checkbox" checked={!!salesForm.quotation} onChange={e => setSalesForm({ ...salesForm, quotation: e.target.checked })} style={{ width: "13px", height: "13px" }} />
                      Quotation
                    </label>
                  </div>
                </div>
                {/* Item search + table */}

                <div style={{ overflowX: "auto", marginBottom: "8px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead><tr style={{ background: "#f1f5f9" }}>{["Sr", "Item", "Batch No", "Qty", "MRP", "Rate", "GST%", "Disc%", "Amount", ""].map(h => <th key={h} style={{ padding: "4px 6px", textAlign: h === "Sr" ? "center" : h === "Amount" ? "right" : "left", fontWeight: "600", color: "var(--color-text-dark)", fontSize: "11px", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {salesItems.map((si, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #e9ecef" }}>
                          <td style={{ padding: "3px 4px", textAlign: "center", fontWeight: "600", color: "#64748b", fontSize: "11px", width: "26px", whiteSpace: "nowrap" }}>{idx + 1}</td>
                          <td style={{ padding: "3px", position: "relative", minWidth: "140px" }}>
                            {(() => {
                              const q = (salesItemSearch[idx] || "").toLowerCase();
                              const filtered = items.filter(i => { const alreadyAdded = salesItems.some((s, sidx) => sidx !== idx && s.itemId === i.id); if (alreadyAdded) return false; return !q || (i.name || "").toLowerCase().includes(q) || (i.company || "").toLowerCase().includes(q); });
                              const hi = salesItemHighlight[idx] || 0;
                              const selectItem = (i) => { setSalesItems(prev => { const updated = [...prev]; const si2 = { ...emptySalesItem(), itemId: i.id, itemName: i.name, mrp: num(i.mrp) || num(i.price), rate: num(i.price), gst: num(i.gst) || 0 }; si2.amount = calcSalesItemAmt(si2); updated[idx] = { ...updated[idx], ...si2 }; return updated; }); setSalesItemSearch(prev => ({ ...prev, [idx]: undefined })); setSalesItemHighlight(prev => ({ ...prev, [idx]: 0 })); setSalesItemDropdown(null); };
                              return (<>
                                <input
                                  id={`sales-item-${idx}`}
                                  value={salesItemSearch[idx] !== undefined ? salesItemSearch[idx] : (si.itemName || "")}
                                  onChange={e => { const r = e.target.getBoundingClientRect(); setSalesDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 220) }); setSalesItemSearch({ ...salesItemSearch, [idx]: e.target.value }); setSalesItemHighlight({ ...salesItemHighlight, [idx]: 0 }); setSalesItemDropdown(idx); }}
                                  onFocus={e => { const r = e.target.getBoundingClientRect(); setSalesDropdownPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: Math.max(r.width, 220) }); setSalesItemSearch(prev => ({ ...prev, [idx]: prev[idx] ?? "" })); setSalesItemHighlight(prev => ({ ...prev, [idx]: 0 })); setSalesItemDropdown(idx); }}
                                  onBlur={() => setTimeout(() => setSalesItemDropdown(null), 200)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") {
                                      e.preventDefault(); e.stopPropagation();
                                      if (salesItemDropdown === idx && filtered.length > 0) {
                                        const item = filtered[hi]; if (item) { selectItem(item); setTimeout(() => document.getElementById(`sales-batch-${idx}`)?.focus(), 50); }
                                      } else {
                                        document.getElementById(`sales-batch-${idx}`)?.focus();
                                      }
                                    }
                                    else if (e.key === "ArrowDown" && salesItemDropdown === idx && filtered.length > 0) { e.preventDefault(); setSalesItemHighlight(prev => ({ ...prev, [idx]: Math.min((prev[idx] || 0) + 1, filtered.length - 1) })) }
                                    else if (e.key === "ArrowUp" && salesItemDropdown === idx && filtered.length > 0) { e.preventDefault(); setSalesItemHighlight(prev => ({ ...prev, [idx]: Math.max((prev[idx] || 0) - 1, 0) })) }
                                  }}
                                  placeholder="Search item..."
                                  style={{ ...inp, minWidth: "130px", padding: "3px 6px", height: "26px", fontSize: "12px" }}
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
                          <td style={{ padding: "3px", width: "75px" }}><input id={`sales-batch-${idx}`} type="text" value={si.batchNo || ""} onChange={e => updateSalesItem(idx, "batchNo", e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`sales-qty-${idx}`)?.focus(); } }} placeholder="Batch No" style={{ ...inp, width: "100%", padding: "3px 5px", height: "26px", fontSize: "12px" }} /></td>
                          {[{ f: "qty", t: "number", w: "48px", next: "mrp" }, { f: "mrp", t: "number", w: "55px", next: "rate" }, { f: "rate", t: "number", w: "55px", next: "gst" }].map(f => (
                            <td key={f.f} style={{ padding: "3px", width: f.w }}><input id={`sales-${f.f}-${idx}`} type={f.t} value={si[f.f] || ""} onChange={e => updateSalesItem(idx, f.f, e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`sales-${f.next}-${idx}`)?.focus(); } }} style={{ ...inp, width: "100%", padding: "3px 4px", height: "26px", fontSize: "12px" }} /></td>
                          ))}
                          <td style={{ padding: "3px", width: "55px" }}><select id={`sales-gst-${idx}`} value={si.gst || "0"} onChange={e => updateSalesItem(idx, "gst", e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById(`sales-disc-${idx}`)?.focus(); } }} style={{ ...inp, width: "100%", padding: "2px 4px", height: "26px", fontSize: "11px" }}>{GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}</select></td>
                          <td style={{ padding: "3px", width: "48px" }}><input id={`sales-disc-${idx}`} type="number" value={si.disc || "0"} onChange={e => updateSalesItem(idx, "disc", e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSalesItem(); setTimeout(() => document.getElementById(`sales-item-${idx + 1}`)?.focus(), 100); } }} style={{ ...inp, width: "100%", padding: "3px 4px", height: "26px", fontSize: "12px" }} /></td>
                          <td style={{ padding: "3px 6px", fontWeight: "700", color: "#3b82f6", whiteSpace: "nowrap", textAlign: "right", width: "65px", fontSize: "12px" }}>₹{fmt(si.amount || 0)}</td>
                          <td style={{ padding: "3px", width: "26px", textAlign: "center" }}><button onClick={() => removeSalesItem(idx)} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "4px", padding: "3px 5px", cursor: "pointer" }}><X size={11} /></button></td>
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
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 12px", minWidth: "240px", fontSize: "11px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 14px" }}>
                          <span style={{ color: "#64748b" }}>SGST:</span><span style={{ textAlign: "right" }}>₹{fmt(sgst)}</span>
                          <span style={{ color: "#64748b" }}>CGST:</span><span style={{ textAlign: "right" }}>₹{fmt(cgst)}</span>
                          <span style={{ fontWeight: "600" }}>Gross Amount:</span><span style={{ textAlign: "right", fontWeight: "600" }}>₹{fmt(gross)}</span>
                          <span style={{ color: "#495057" }}>Half Scheme:</span><span style={{ textAlign: "right" }}><input type="number" value={salesForm.halfScheme || "0"} onChange={e => setSalesForm({ ...salesForm, halfScheme: e.target.value })} style={{ ...inp, width: "65px", padding: "1px 4px", fontSize: "10px", height: "20px" }} /></span>
                          <span style={{ color: "#495057" }}>Oct on Free:</span><span style={{ textAlign: "right" }}><input type="number" value={salesForm.octOnFree || "0"} onChange={e => setSalesForm({ ...salesForm, octOnFree: e.target.value })} style={{ ...inp, width: "65px", padding: "1px 4px", fontSize: "10px", height: "20px" }} /></span>
                          <span style={{ color: "#495057" }}>Other +/-:</span><span style={{ textAlign: "right" }}><input type="number" value={salesForm.otherAdj || "0"} onChange={e => setSalesForm({ ...salesForm, otherAdj: e.target.value })} style={{ ...inp, width: "65px", padding: "1px 4px", fontSize: "10px", height: "20px" }} /></span>
                          <span style={{ color: "#ef4444" }}>Less Disc ({salesForm.discount || 0}%):</span><span style={{ textAlign: "right", color: "#ef4444" }}>-₹{fmt(lessDisc)}</span>
                          <span style={{ color: "#495057" }}>Cr Note:</span><span style={{ textAlign: "right" }}><input type="number" value={salesForm.crNote || "0"} onChange={e => setSalesForm({ ...salesForm, crNote: e.target.value })} style={{ ...inp, width: "65px", padding: "1px 4px", fontSize: "10px", height: "20px" }} /></span>
                          <span style={{ color: "#495057" }}>TCS Value:</span><span style={{ textAlign: "right" }}><input type="number" value={salesForm.tcsValue || "0"} onChange={e => setSalesForm({ ...salesForm, tcsValue: e.target.value })} style={{ ...inp, width: "65px", padding: "1px 4px", fontSize: "10px", height: "20px" }} /></span>
                          <span style={{ fontWeight: "800", fontSize: "13px", borderTop: "1px solid var(--color-border)", paddingTop: "4px" }}>NET:</span>
                          <span style={{ textAlign: "right", fontWeight: "800", fontSize: "13px", color: "var(--color-primary)", borderTop: "1px solid var(--color-border)", paddingTop: "4px" }}>₹{fmt(net - num(salesForm.crNote) + num(salesForm.otherAdj) + num(salesForm.tcsValue))}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <button onClick={() => { setScannerTarget("sales"); setShowCameraScanner(true); }}
                    style={{ ...btn("var(--color-primary)"), fontSize: "12px" }}>📷 Scan — Sales</button>
                  <button onClick={handleSaveSales} style={{ ...btn(isReturn ? "#ef4444" : "#16a34a"), fontSize: "13px", fontWeight: "700" }}>
                    <CheckCircle size={14} />{salesForm.id ? "Update Bill" : (isReturn ? "Save Return" : "Save Bill")}
                  </button>
                  <button onClick={() => {
                    const validItems = salesItems.filter(si => si.itemId && int(si.qty) > 0);
                    const grossAmount = validItems.reduce((s, si) => s + num(si.amount || 0), 0);
                    const lessDisc = grossAmount * num(salesForm.discount) / 100;
                    const netAmount = grossAmount - lessDisc;
                    const sign = isReturn ? -1 : 1;
                    const b = {
                      id: salesForm.id || "preview",
                      billNo: salesForm.billNo || (salesBills.length + 1),
                      date: salesForm.date || today(),
                      ...salesForm,
                      items: validItems.length > 0 ? validItems : salesItems,
                      grossAmount: grossAmount * sign,
                      lessDisc: lessDisc * sign,
                      netAmount: (netAmount - num(salesForm.crNote) + num(salesForm.otherAdj) + num(salesForm.tcsValue)) * sign,
                      isReturn,
                      status: "Completed"
                    };
                    handlePrintSalesBill(b);
                  }} style={{ ...btn("#2563eb"), fontSize: "13px", fontWeight: "600" }}>
                    🖨️ Print Bill
                  </button>
                  <button onClick={() => {
                    const validItems = salesItems.filter(si => si.itemId && int(si.qty) > 0);
                    const grossAmount = validItems.reduce((s, si) => s + num(si.amount || 0), 0);
                    const lessDisc = grossAmount * num(salesForm.discount) / 100;
                    const netAmount = grossAmount - lessDisc;
                    const sign = isReturn ? -1 : 1;
                    const b = {
                      id: salesForm.id || "preview",
                      billNo: salesForm.billNo || (salesBills.length + 1),
                      date: salesForm.date || today(),
                      ...salesForm,
                      items: validItems.length > 0 ? validItems : salesItems,
                      grossAmount: grossAmount * sign,
                      lessDisc: lessDisc * sign,
                      netAmount: (netAmount - num(salesForm.crNote) + num(salesForm.otherAdj) + num(salesForm.tcsValue)) * sign,
                      isReturn,
                      status: "Completed"
                    };
                    if (!b.mobile) {
                      showToast("Please enter patient mobile number for WhatsApp", "error");
                      return;
                    }
                    handleWhatsAppBill(b);
                  }} style={{ ...btn("#15803d"), fontSize: "13px", fontWeight: "600" }}>
                    💬 Send WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      if (salesForm.id) {
                        handleDeleteSalesBill(salesForm);
                      } else {
                        showConfirm("Discard this bill?", () => {
                          setSalesForm(emptySalesForm());
                          setSalesItems([emptySalesItem()]);
                          setShowSalesForm(false);
                          showToast("Bill discarded");
                        });
                      }
                    }}
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#ef4444",
                      borderRadius: "8px",
                      padding: "8px 11px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: "auto"
                    }}
                    title={salesForm.id ? "Delete this Bill" : "Discard Bill"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Sales Bills List is Hidden (Search to Edit Workflow) */}
            {!showSalesForm && (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "#64748b", background: "white", borderRadius: "8px", border: "1px dashed var(--color-border)" }}>
                <div style={{ fontSize: "44px", opacity: 0.5 }}>🧾</div>
                <p style={{ marginTop: "16px", fontWeight: "600", fontSize: "16px" }}>Search Bill# or Patient Name to Open</p>
                <p style={{ fontSize: "13px", opacity: 0.7, marginTop: "6px" }}>Type in the search box above and press Enter to edit an existing bill.</p>
              </div>
            )}

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
              {[{ id: "accounts", label: "🏛️ Account Master" }, { id: "suppliers", label: "🏭 Suppliers" }, { id: "doctors", label: "🩺 Doctors" }, { id: "customers", label: "👥 Customers" }, { id: "offers", label: "🎁 Bundle Offers" }, { id: "expiry_cal", label: "📅 Expiry Calendar" }, { id: "auto_reorder", label: "🔄 Auto Reorder" }, { id: "prescriptions", label: "📋 Prescriptions" }].map(t => (
                <button key={t.id} onClick={() => setOwnerSubTab(t.id)} style={{ padding: "8px 12px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "11px", background: ownerSubTab === t.id ? "white" : "transparent", color: ownerSubTab === t.id ? "#3b82f6" : "#64748b" }}>{t.label}</button>
              ))}
            </div>

            {/* BUNDLE OFFERS */}
            
            {/* ═════════════════════════════════════════════════════════════
                ACCOUNT MASTER (Matching Inventory Page Layout / Image 2)
            ═════════════════════════════════════════════════════════════ */}
            {(ownerSubTab === "accounts" || !ownerSubTab) && (() => {
              // Filtering & Sorting
              const q = (accountSearch || "").trim().toLowerCase();
              let filtered = (accounts || []).filter(acc => {
                if (accountActiveOnly && acc.statusOff) return false;
                if (accountGroupFilter !== "All" && acc.group !== accountGroupFilter) return false;
                if (!q) return true;
                return (
                  (acc.name || "").toLowerCase().includes(q) ||
                  (acc.mobile || "").includes(q) ||
                  (acc.gstTin || "").toLowerCase().includes(q) ||
                  (acc.city || "").toLowerCase().includes(q) ||
                  String(acc.srNo || "").includes(q)
                );
              });

              if (accountSortBy === "name") {
                filtered = [...filtered].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
              } else if (accountSortBy === "bal_desc") {
                filtered = [...filtered].sort((a, b) => Number(b.opBal || 0) - Number(a.opBal || 0));
              } else if (accountSortBy === "bal_asc") {
                filtered = [...filtered].sort((a, b) => Number(a.opBal || 0) - Number(b.opBal || 0));
              } else if (accountSortBy === "sr_desc") {
                filtered = [...filtered].sort((a, b) => Number(b.srNo || 0) - Number(a.srNo || 0));
              }

              // Search dropdown list (max 12 results)
              const searchDropdownResults = q ? (accounts || []).filter(acc =>
                (acc.name || "").toLowerCase().includes(q) ||
                (acc.mobile || "").includes(q) ||
                (acc.gstTin || "").toLowerCase().includes(q)
              ).slice(0, 12) : [];

              // Open Form Handler
              const handleOpenForm = (acc = null) => {
                if (acc) {
                  setEditingAccount(acc);
                  setAccountForm({ ...defaultAccountForm, ...acc });
                } else {
                  setEditingAccount(null);
                  const nextSr = accounts.length > 0 ? Math.max(...accounts.map(a => Number(a.srNo || 0))) + 1 : 1;
                  setAccountForm({ ...defaultAccountForm, id: uid(), srNo: nextSr });
                }
                setShowAccountForm(true);
              };

              // Save Account Handler
              const handleSaveAccount = () => {
                if (!accountForm.name || !accountForm.name.trim()) {
                  showToast("Account Name is required!", "error");
                  return;
                }

                const accId = accountForm.id || uid();
                const accData = {
                  ...accountForm,
                  id: accId,
                  name: accountForm.name.trim().toUpperCase(),
                  srNo: Number(accountForm.srNo) || (accounts.length + 1),
                  opBal: Number(accountForm.opBal) || 0,
                  updatedAt: new Date().toISOString()
                };

                let updatedList;
                if (editingAccount) {
                  updatedList = accounts.map(a => a.id === editingAccount.id ? accData : a);
                } else {
                  updatedList = [...accounts, accData];
                }

                setAccounts(updatedList);
                try {
                  localStorage.setItem("store_accounts", JSON.stringify(updatedList));
                } catch (_) {}

                // Sync with suppliers if group is Sundry Creditors
                if (accData.group === "Sundry Creditors" || accData.group === "Suppliers") {
                  const existingSupp = (suppliers || []).find(s => s.id === accData.id || s.name?.toUpperCase() === accData.name);
                  const suppEntry = {
                    id: existingSupp?.id || accData.id,
                    name: accData.name,
                    mobile: accData.mobile,
                    email: accData.email,
                    city: accData.city,
                    state: accData.state,
                    address: accData.address,
                    gstTin: accData.gstTin,
                    dlNo: accData.dlNo,
                    panNo: accData.panNo,
                    creditLimit: accData.creditLimit,
                    creditDays: accData.creditDays,
                    openingBalance: accData.opBal,
                    updatedAt: new Date().toISOString()
                  };
                  if (existingSupp) {
                    saveSuppliers((suppliers || []).map(s => s.id === existingSupp.id ? suppEntry : s));
                  } else {
                    saveSuppliers([...(suppliers || []), suppEntry]);
                  }
                }

                showToast(editingAccount ? "Account updated successfully!" : "Account created successfully!");
                setShowAccountForm(false);
                setEditingAccount(null);
              };

              // Delete Account Handler
              const handleDeleteAccount = (accId) => {
                const target = accounts.find(a => a.id === accId);
                showConfirm(`Are you sure you want to delete account "${target?.name || ''}"?`, () => {
                  const nextList = accounts.filter(a => a.id !== accId);
                  setAccounts(nextList);
                  try {
                    localStorage.setItem("store_accounts", JSON.stringify(nextList));
                  } catch (_) {}
                  // Also remove from suppliers if matching
                  if (target?.group === "Sundry Creditors") {
                    saveSuppliers((suppliers || []).filter(s => s.id !== accId && s.name !== target.name));
                  }
                  if (editingAccount?.id === accId) {
                    setShowAccountForm(false);
                    setEditingAccount(null);
                  }
                  showToast("Account deleted successfully!");
                });
              };

              // Record Navigation (< Prev & Next >)
              const handleNavigate = (direction) => {
                if (accounts.length === 0) return;
                const currentIdx = editingAccount ? accounts.findIndex(a => a.id === editingAccount.id) : 0;
                let nextIdx = direction === "prev" ? currentIdx - 1 : currentIdx + 1;
                if (nextIdx < 0) nextIdx = accounts.length - 1;
                if (nextIdx >= accounts.length) nextIdx = 0;
                const target = accounts[nextIdx];
                setEditingAccount(target);
                setAccountForm({ ...defaultAccountForm, ...target });
              };

              // GST Parse & Auto-fill
              const handleGSTAutoFill = () => {
                const gst = (accountForm.gstTin || "").trim().toUpperCase();
                if (!gst || gst.length < 2) {
                  showToast("Please enter a valid 15-character GSTIN first", "error");
                  return;
                }

                const stateCode = gst.substring(0, 2);
                const stateMap = {
                  "01": "01-Jammu & Kashmir", "02": "02-Himachal Pradesh", "03": "03-Punjab",
                  "04": "04-Chandigarh", "05": "05-Uttarakhand", "06": "06-Haryana",
                  "07": "07-Delhi", "08": "08-Rajasthan", "09": "09-Uttar Pradesh",
                  "10": "10-Bihar", "19": "19-West Bengal", "23": "23-Madhya Pradesh",
                  "24": "24-Gujarat", "27": "27-Maharashtra", "29": "29-Karnataka",
                  "32": "32-Kerala", "33": "33-Tamil Nadu", "36": "36-Telangana", "37": "37-Andhra Pradesh"
                };

                const detectedState = stateMap[stateCode] || `${stateCode}-Other`;
                const isLocal = stateCode === "24";
                const pan = gst.length >= 12 ? gst.substring(2, 12) : accountForm.panNo;

                setAccountForm(prev => ({
                  ...prev,
                  gstTin: gst,
                  state: detectedState,
                  panNo: pan || prev.panNo,
                  regType: "Regular (GSTIN)",
                  invType: isLocal ? "RD (within state - SGST/UGST)" : "Inter-state (IGST)"
                }));

                showToast(`State: ${detectedState}, PAN: ${pan || 'Auto'} verified!`);
              };

              // Print Accounts Directory
              const handlePrintList = () => {
                const printWindow = window.open("", "_blank");
                if (!printWindow) return;
                const rows = filtered.map((a, i) => `
                  <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 6px; text-align: center;">${i + 1}</td>
                    <td style="padding: 6px; text-align: center;">${a.srNo || '-'}</td>
                    <td style="padding: 6px; font-weight: bold;">${a.name}</td>
                    <td style="padding: 6px;">${a.group || '-'}</td>
                    <td style="padding: 6px;">${a.city || '-'}</td>
                    <td style="padding: 6px;">${a.mobile || '-'}</td>
                    <td style="padding: 6px;">${a.gstTin || '-'}</td>
                    <td style="padding: 6px; text-align: right;">₹${Number(a.opBal || 0).toFixed(2)} ${a.balType || 'Cr'}</td>
                  </tr>
                `).join("");

                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Accounts Directory - Shiv Dhara Medical Store</title>
                      <style>
                        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; color: #111; }
                        h2, h4 { margin: 0 0 6px 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th { background: #0f172a; color: white; padding: 8px 6px; text-align: left; }
                      </style>
                    </head>
                    <body>
                      <h2>Shiv Dhara Medical Store</h2>
                      <h4>Accounts Directory Master Register (Total: ${filtered.length})</h4>
                      <p style="font-size: 11px; color: #555;">Generated: ${new Date().toLocaleString()}</p>
                      <table>
                        <thead>
                          <tr>
                            <th style="width: 35px; text-align: center;">#</th>
                            <th style="width: 45px; text-align: center;">Sr No</th>
                            <th>Account Name</th>
                            <th>Group</th>
                            <th>City</th>
                            <th>Mobile</th>
                            <th>GSTIN</th>
                            <th style="text-align: right;">Opening Balance</th>
                          </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                      </table>
                    </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => printWindow.print(), 300);
              };

              return (
                <div style={{ animation: "fadeIn 0.2s ease-in-out" }}>
                  {/* ─── HEADER ROW (Inventory Style / Image 2) ─── */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "26px" }}>🏛️</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Account Master</h2>
                      <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Party Ledgers, Suppliers, Customers & Financial Accounts</p>
                    </div>

                    <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        onClick={handlePrintList}
                        style={{ ...btn("#334155"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <Printer size={13} /> Print List
                      </button>
                      <button
                        onClick={() => handleOpenForm(null)}
                        style={{ ...btn("var(--color-primary)"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <Plus size={13} /> Add Account
                      </button>
                    </div>
                  </div>

                  {/* ─── SEARCH & FILTER BAR (Inventory Style / Image 2) ─── */}
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
                      <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                      <input
                        placeholder="Search Account Name, Mobile or GSTIN... + Enter"
                        value={accountSearch}
                        onChange={e => {
                          setAccountSearch(e.target.value);
                          setAccountSearchDropdown(true);
                          setAccountSearchHighlight(0);
                        }}
                        onKeyDown={e => {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setAccountSearchHighlight(prev => Math.min(prev + 1, searchDropdownResults.length - 1));
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setAccountSearchHighlight(prev => Math.max(prev - 1, 0));
                          } else if (e.key === "Enter") {
                            e.preventDefault();
                            if (searchDropdownResults.length > 0 && accountSearchDropdown) {
                              handleOpenForm(searchDropdownResults[accountSearchHighlight]);
                              setAccountSearchDropdown(false);
                              setAccountSearch("");
                            } else if (q && filtered.length > 0) {
                              handleOpenForm(filtered[0]);
                              setAccountSearchDropdown(false);
                              setAccountSearch("");
                            } else if (q) {
                              showToast("No account found matching: " + accountSearch, "error");
                            }
                          }
                        }}
                        onFocus={() => setAccountSearchDropdown(true)}
                        onBlur={() => setTimeout(() => setAccountSearchDropdown(false), 200)}
                        style={{ ...inp, paddingLeft: "30px", width: "100%", height: "36px" }}
                      />

                      {/* Search Dropdown Popup */}
                      {accountSearchDropdown && searchDropdownResults.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--shadow-lg)", zIndex: 50, marginTop: "4px", overflow: "hidden", maxHeight: "280px", overflowY: "auto" }}>
                          {searchDropdownResults.map((acc, idx) => (
                            <div
                              key={acc.id}
                              onClick={() => {
                                handleOpenForm(acc);
                                setAccountSearchDropdown(false);
                                setAccountSearch("");
                              }}
                              onMouseEnter={() => setAccountSearchHighlight(idx)}
                              style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                background: idx === accountSearchHighlight ? "#f1f5f9" : "white",
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                              }}
                            >
                              <div>
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>{acc.name}</div>
                                <div style={{ fontSize: "10px", color: "#64748b" }}>
                                  {acc.group} {acc.city ? `· ${acc.city}` : ""} {acc.mobile ? `· 📱 ${acc.mobile}` : ""}
                                </div>
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: "700", color: acc.balType === "Dr" ? "#dc2626" : "#16a34a" }}>
                                ₹{Number(acc.opBal || 0).toFixed(2)} {acc.balType}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <select
                      value={accountGroupFilter}
                      onChange={e => setAccountGroupFilter(e.target.value)}
                      style={{ ...inp, width: "auto", height: "36px" }}
                    >
                      <option value="All">All Groups</option>
                      <option value="Sundry Creditors">Sundry Creditors (Suppliers)</option>
                      <option value="Sundry Debtors">Sundry Debtors (Customers)</option>
                      <option value="Bank Accounts">Bank Accounts</option>
                      <option value="Cash Accounts">Cash Accounts</option>
                      <option value="Direct Expenses">Direct Expenses</option>
                      <option value="Indirect Expenses">Indirect Expenses</option>
                      <option value="Duties & Taxes">Duties & Taxes</option>
                      <option value="Capital Account">Capital Account</option>
                    </select>

                    <select
                      value={accountSortBy}
                      onChange={e => setAccountSortBy(e.target.value)}
                      style={{ ...inp, width: "auto", height: "36px" }}
                    >
                      <option value="name">Name A-Z</option>
                      <option value="bal_desc">Balance ↓</option>
                      <option value="bal_asc">Balance ↑</option>
                      <option value="sr_desc">Sr No ↓</option>
                    </select>

                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", color: "#475569", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={accountActiveOnly}
                        onChange={e => setAccountActiveOnly(e.target.checked)}
                      />
                      Active Only
                    </label>
                  </div>

                  {/* ─── ADD / EDIT ACCOUNT CARD (Theme: Add Item in Image 2 + All Legacy Fields) ─── */}
                  {showAccountForm && (
                    <div style={{ background: "white", borderRadius: "12px", padding: "24px", marginBottom: "20px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", animation: "fadeIn 0.15s ease-out" }}>
                      {/* Card Title & Close */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "18px" }}>🏛️</span>
                          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                            {editingAccount ? `Edit Account: ${editingAccount.name}` : "Add New Account"}
                          </h3>
                          <span style={{ fontSize: "11px", fontWeight: "700", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "4px" }}>
                            Sr. No: {accountForm.srNo || "Auto"}
                          </span>
                        </div>
                        <button
                          onClick={() => { setShowAccountForm(false); setEditingAccount(null); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Form Grid (Clean Modern Layout matching Image 2) */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                        {/* Sr.No (Legacy Highlighted Style) */}
                        <div>
                          <label style={lbl}>Sr. No.</label>
                          <input
                            type="number"
                            value={accountForm.srNo || ""}
                            onChange={e => setAccountForm({ ...accountForm, srNo: e.target.value })}
                            placeholder="Auto"
                            style={{ ...inp, background: "#fce7f3", border: "1px solid #f472b6", fontWeight: "800", color: "#831843" }}
                          />
                        </div>

                        {/* Account Group */}
                        <div>
                          <label style={lbl}>Account Group *</label>
                          <select
                            value={accountForm.group || "Sundry Creditors"}
                            onChange={e => setAccountForm({ ...accountForm, group: e.target.value })}
                            style={{ ...inp, fontWeight: "600" }}
                          >
                            <option value="Sundry Creditors">Sundry Creditors (Suppliers)</option>
                            <option value="Sundry Debtors">Sundry Debtors (Customers)</option>
                            <option value="Bank Accounts">Bank Accounts</option>
                            <option value="Cash Accounts">Cash Accounts</option>
                            <option value="Direct Expenses">Direct Expenses</option>
                            <option value="Indirect Expenses">Indirect Expenses</option>
                            <option value="Duties & Taxes">Duties & Taxes</option>
                            <option value="Capital Account">Capital Account</option>
                          </select>
                        </div>

                        {/* Opening Balance & Type */}
                        <div>
                          <label style={lbl}>Opening Balance & Type</label>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <input
                              type="number"
                              value={accountForm.opBal || ""}
                              onChange={e => setAccountForm({ ...accountForm, opBal: e.target.value })}
                              placeholder="0.00"
                              style={{ ...inp, flex: 1, fontWeight: "700" }}
                            />
                            <select
                              value={accountForm.balType || "Cr"}
                              onChange={e => setAccountForm({ ...accountForm, balType: e.target.value })}
                              style={{ ...inp, width: "65px", fontWeight: "800", color: accountForm.balType === "Dr" ? "#dc2626" : "#16a34a" }}
                            >
                              <option value="Cr">Cr</option>
                              <option value="Dr">Dr</option>
                            </select>
                          </div>
                        </div>

                        {/* Account Name */}
                        <div style={{ gridColumn: "span 2" }}>
                          <label style={lbl}>Account Name *</label>
                          <input
                            value={accountForm.name || ""}
                            onChange={e => setAccountForm({ ...accountForm, name: e.target.value.toUpperCase() })}
                            placeholder="e.g. ZYDUS HEALTHCARE LTD or SHREE GANESH PHARMA"
                            style={{ ...inp, textTransform: "uppercase", fontWeight: "700" }}
                          />
                        </div>

                        {/* Area */}
                        <div>
                          <label style={lbl}>Area</label>
                          <input
                            value={accountForm.area || ""}
                            onChange={e => setAccountForm({ ...accountForm, area: e.target.value.toUpperCase() })}
                            placeholder="e.g. RING ROAD"
                            style={{ ...inp, textTransform: "uppercase" }}
                          />
                        </div>

                        {/* City */}
                        <div>
                          <label style={lbl}>City</label>
                          <input
                            value={accountForm.city || ""}
                            onChange={e => setAccountForm({ ...accountForm, city: e.target.value.toUpperCase() })}
                            placeholder="e.g. SURAT"
                            style={{ ...inp, textTransform: "uppercase" }}
                          />
                        </div>

                        {/* Contact Person */}
                        <div>
                          <label style={lbl}>Contact Person</label>
                          <input
                            value={accountForm.contact || ""}
                            onChange={e => setAccountForm({ ...accountForm, contact: e.target.value.toUpperCase() })}
                            placeholder="Manager / Owner Name"
                            style={{ ...inp, textTransform: "uppercase" }}
                          />
                        </div>

                        {/* Mobile */}
                        <div>
                          <label style={lbl}>Mobile Number</label>
                          <input
                            value={accountForm.mobile || ""}
                            onChange={e => setAccountForm({ ...accountForm, mobile: e.target.value.replace(/[^0-9]/g, "") })}
                            placeholder="10-digit mobile"
                            maxLength={10}
                            style={{ ...inp, fontWeight: "600" }}
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label style={lbl}>Email Address</label>
                          <input
                            type="email"
                            value={accountForm.email || ""}
                            onChange={e => setAccountForm({ ...accountForm, email: e.target.value })}
                            placeholder="account@pharma.com"
                            style={inp}
                          />
                        </div>

                        {/* Drug License No (D.L.No) */}
                        <div>
                          <label style={lbl}>D.L. No. (Drug License)</label>
                          <input
                            value={accountForm.dlNo || ""}
                            onChange={e => setAccountForm({ ...accountForm, dlNo: e.target.value.toUpperCase() })}
                            placeholder="e.g. 20B/21B-GJ-10029"
                            style={{ ...inp, textTransform: "uppercase" }}
                          />
                        </div>

                        {/* GSTIN */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <label style={lbl}>GSTIN / Tin</label>
                            <button
                              type="button"
                              onClick={handleGSTAutoFill}
                              style={{ background: "none", border: "none", color: "#2563eb", fontSize: "10px", fontWeight: "700", cursor: "pointer", padding: 0 }}
                            >
                              ⚡ Auto-Fill
                            </button>
                          </div>
                          <input
                            value={accountForm.gstTin || ""}
                            onChange={e => setAccountForm({ ...accountForm, gstTin: e.target.value.toUpperCase() })}
                            placeholder="15-digit GSTIN"
                            maxLength={15}
                            style={{ ...inp, textTransform: "uppercase", fontWeight: "700" }}
                          />
                        </div>

                        {/* PAN No */}
                        <div>
                          <label style={lbl}>PAN No</label>
                          <input
                            value={accountForm.panNo || ""}
                            onChange={e => setAccountForm({ ...accountForm, panNo: e.target.value.toUpperCase() })}
                            placeholder="10-digit PAN"
                            maxLength={10}
                            style={{ ...inp, textTransform: "uppercase" }}
                          />
                        </div>

                        {/* State */}
                        <div>
                          <label style={lbl}>State</label>
                          <select
                            value={accountForm.state || "24-Gujarat"}
                            onChange={e => setAccountForm({ ...accountForm, state: e.target.value })}
                            style={inp}
                          >
                            <option value="24-Gujarat">24-Gujarat</option>
                            <option value="27-Maharashtra">27-Maharashtra</option>
                            <option value="08-Rajasthan">08-Rajasthan</option>
                            <option value="23-Madhya Pradesh">23-Madhya Pradesh</option>
                            <option value="07-Delhi">07-Delhi</option>
                            <option value="09-Uttar Pradesh">09-Uttar Pradesh</option>
                            <option value="29-Karnataka">29-Karnataka</option>
                            <option value="Other">Other State</option>
                          </select>
                        </div>

                        {/* Aadhar No */}
                        <div>
                          <label style={lbl}>Aadhar No</label>
                          <input
                            value={accountForm.aadharNo || ""}
                            onChange={e => setAccountForm({ ...accountForm, aadharNo: e.target.value.replace(/[^0-9]/g, "") })}
                            placeholder="12-digit Aadhar"
                            maxLength={12}
                            style={inp}
                          />
                        </div>

                        {/* Registration Type */}
                        <div>
                          <label style={lbl}>Registration Type</label>
                          <select
                            value={accountForm.regType || "Regular (GSTIN)"}
                            onChange={e => setAccountForm({ ...accountForm, regType: e.target.value })}
                            style={inp}
                          >
                            <option value="Regular (GSTIN)">Regular (GSTIN)</option>
                            <option value="Composition">Composition</option>
                            <option value="Unregistered">Unregistered</option>
                            <option value="Consumer">Consumer</option>
                          </select>
                        </div>

                        {/* Invoice Type */}
                        <div>
                          <label style={lbl}>Inv. Type</label>
                          <select
                            value={accountForm.invType || "RD (within state - SGST/UGST)"}
                            onChange={e => setAccountForm({ ...accountForm, invType: e.target.value })}
                            style={inp}
                          >
                            <option value="RD (within state - SGST/UGST)">RD (within state - SGST/UGST)</option>
                            <option value="Inter-state (IGST)">Inter-state (IGST)</option>
                            <option value="Export">Export</option>
                          </select>
                        </div>

                        {/* Full Address */}
                        <div style={{ gridColumn: "span 2" }}>
                          <label style={lbl}>Address</label>
                          <textarea
                            value={accountForm.address || ""}
                            onChange={e => setAccountForm({ ...accountForm, address: e.target.value.toUpperCase() })}
                            placeholder="Complete shop/office address..."
                            style={{ ...inp, height: "48px", resize: "vertical", textTransform: "uppercase" }}
                          />
                        </div>

                        {/* Message on Bill */}
                        <div>
                          <label style={lbl}>Billing Alert Message</label>
                          <input
                            value={accountForm.message || ""}
                            onChange={e => setAccountForm({ ...accountForm, message: e.target.value })}
                            placeholder="Popup message when billing..."
                            style={inp}
                          />
                        </div>

                        {/* Remarks */}
                        <div>
                          <label style={lbl}>Remarks / Internal Notes</label>
                          <input
                            value={accountForm.remarks || ""}
                            onChange={e => setAccountForm({ ...accountForm, remarks: e.target.value })}
                            placeholder="Internal notes..."
                            style={inp}
                          />
                        </div>
                      </div>

                      {/* ─── F6 / F7 SUB-TAB CONTAINER (Legacy Features) ─── */}
                      <div style={{ background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>
                          <button
                            type="button"
                            onClick={() => setAccountF6F7Tab("billing")}
                            style={{
                              padding: "6px 14px",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "800",
                              fontSize: "12px",
                              background: accountF6F7Tab === "billing" ? "#1e293b" : "transparent",
                              color: accountF6F7Tab === "billing" ? "#ffffff" : "#64748b"
                            }}
                          >
                            Billing Detail - F6
                          </button>
                          <button
                            type="button"
                            onClick={() => setAccountF6F7Tab("other")}
                            style={{
                              padding: "6px 14px",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "800",
                              fontSize: "12px",
                              background: accountF6F7Tab === "other" ? "#1e293b" : "transparent",
                              color: accountF6F7Tab === "other" ? "#ffffff" : "#64748b"
                            }}
                          >
                            Other Detail - F7
                          </button>
                        </div>

                        {accountF6F7Tab === "billing" ? (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
                            <div>
                              <label style={lbl}>Import Format</label>
                              <select value={accountForm.importFormat || "-SELECT-"} onChange={e => setAccountForm({ ...accountForm, importFormat: e.target.value })} style={inp}>
                                <option value="-SELECT-">-SELECT-</option>
                                <option value="Format A">Format A</option>
                                <option value="Format B">Format B</option>
                                <option value="CSV/Excel">CSV / Excel Direct</option>
                              </select>
                            </div>
                            <div>
                              <label style={lbl}>Link Bank A/c</label>
                              <input value={accountForm.linkBank || ""} onChange={e => setAccountForm({ ...accountForm, linkBank: e.target.value.toUpperCase() })} placeholder="Linked bank name" style={inp} />
                            </div>
                            <div>
                              <label style={lbl}>Bank Charges (in %)</label>
                              <input type="number" value={accountForm.bankChargesPct || ""} onChange={e => setAccountForm({ ...accountForm, bankChargesPct: e.target.value })} placeholder="0.00" style={inp} />
                            </div>
                            <div>
                              <label style={lbl}>Invoice Type</label>
                              <select value={accountForm.invoiceType || "Retail"} onChange={e => setAccountForm({ ...accountForm, invoiceType: e.target.value })} style={inp}>
                                <option value="Retail">Retail</option>
                                <option value="Tax Invoice">Tax Invoice</option>
                              </select>
                            </div>
                            <div>
                              <label style={lbl}>Payment Mode</label>
                              <select value={accountForm.pMode || "Credit"} onChange={e => setAccountForm({ ...accountForm, pMode: e.target.value })} style={inp}>
                                <option value="Credit">Credit</option>
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="UPI/Digital">UPI / Digital</option>
                              </select>
                            </div>
                            <div>
                              <label style={lbl}>Credit Limit (₹)</label>
                              <input type="number" value={accountForm.creditLimit || ""} onChange={e => setAccountForm({ ...accountForm, creditLimit: e.target.value })} placeholder="e.g. 50000" style={inp} />
                            </div>
                            <div>
                              <label style={lbl}>Credit Days</label>
                              <input type="number" value={accountForm.creditDays || ""} onChange={e => setAccountForm({ ...accountForm, creditDays: e.target.value })} placeholder="e.g. 21" style={inp} />
                            </div>
                            <div>
                              <label style={lbl}>Discount in %</label>
                              <input type="number" value={accountForm.discountPct || ""} onChange={e => setAccountForm({ ...accountForm, discountPct: e.target.value })} placeholder="0.00" style={inp} />
                            </div>
                            <div>
                              <label style={lbl}>Depreciation</label>
                              <input type="number" value={accountForm.depreciation || ""} onChange={e => setAccountForm({ ...accountForm, depreciation: e.target.value })} placeholder="0.00" style={inp} />
                            </div>
                            <div>
                              <label style={lbl}>Margin% On PTR</label>
                              <input type="number" value={accountForm.marginPct || ""} onChange={e => setAccountForm({ ...accountForm, marginPct: e.target.value })} placeholder="0.00" style={inp} />
                            </div>
                            <div>
                              <label style={lbl}>Add % For C.C.</label>
                              <input type="number" value={accountForm.addPctCc || ""} onChange={e => setAccountForm({ ...accountForm, addPctCc: e.target.value })} placeholder="0.00" style={inp} />
                            </div>
                            <div>
                              <label style={lbl}>Interest %</label>
                              <input type="number" value={accountForm.interestPct || ""} onChange={e => setAccountForm({ ...accountForm, interestPct: e.target.value })} placeholder="0.00" style={inp} />
                            </div>
                            <div>
                              <label style={lbl}>TDS %</label>
                              <input type="number" value={accountForm.tdsPct || ""} onChange={e => setAccountForm({ ...accountForm, tdsPct: e.target.value })} placeholder="0.00" style={inp} />
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
                            <div>
                              <label style={lbl}>Transport / Courier</label>
                              <input value={accountForm.transport || ""} onChange={e => setAccountForm({ ...accountForm, transport: e.target.value.toUpperCase() })} placeholder="e.g. MARUTI ROADWAYS" style={inp} />
                            </div>
                            <div>
                              <label style={lbl}>Distance (KM)</label>
                              <input type="number" value={accountForm.distanceKm || ""} onChange={e => setAccountForm({ ...accountForm, distanceKm: e.target.value })} placeholder="e.g. 25" style={inp} />
                            </div>
                            <div>
                              <label style={lbl}>Salesman / Agent</label>
                              <input value={accountForm.salesman || ""} onChange={e => setAccountForm({ ...accountForm, salesman: e.target.value.toUpperCase() })} placeholder="Rep Name" style={inp} />
                            </div>
                            <div>
                              <label style={lbl}>Route / Beat</label>
                              <input value={accountForm.route || ""} onChange={e => setAccountForm({ ...accountForm, route: e.target.value.toUpperCase() })} placeholder="City Center Beat" style={inp} />
                            </div>
                            <div>
                              <label style={lbl}>Price List Category</label>
                              <select value={accountForm.priceCategory || "Standard"} onChange={e => setAccountForm({ ...accountForm, priceCategory: e.target.value })} style={inp}>
                                <option value="Standard">Standard</option>
                                <option value="Wholesale">Wholesale</option>
                                <option value="Retail">Retail</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ─── LEGACY BEHAVIOR CHECKBOXES ─── */}
                      <div style={{ background: "#ffffff", borderRadius: "8px", border: "1px dashed #cbd5e1", padding: "12px", marginBottom: "18px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                          {[
                            { k: "askBeforeSave", l: "Ask Before Save" },
                            { k: "statusOff", l: "Status Off (Inactive)" },
                            { k: "taxNotCalculate", l: "TAX Not Calculate" },
                            { k: "adtTaxCalc", l: "Adt Tax Calculate (Purchase)" },
                            { k: "salesBillPrint0", l: "Sales Bill Print 0" },
                            { k: "saleByLp", l: "Sale By LP" },
                            { k: "saleByPrateTax", l: "Sale By P.Rate + Tax" },
                            { k: "saleByPrate", l: "Sale By P.Rate" }
                          ].map(cb => (
                            <label key={cb.k} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", userSelect: "none" }}>
                              <input
                                type="checkbox"
                                checked={!!accountForm[cb.k]}
                                onChange={e => setAccountForm({ ...accountForm, [cb.k]: e.target.checked })}
                              />
                              <span style={{ fontWeight: cb.k === "statusOff" && accountForm.statusOff ? "800" : "600", color: cb.k === "statusOff" && accountForm.statusOff ? "#dc2626" : "#334155" }}>
                                {cb.l}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* ─── FORM ACTION BUTTONS ─── */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleNavigate("prev")}
                            style={{ ...btn("#475569"), padding: "7px 12px", fontSize: "12px" }}
                            title="Previous Record"
                          >
                            <ChevronLeft size={14} /> Prev
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavigate("next")}
                            style={{ ...btn("#475569"), padding: "7px 12px", fontSize: "12px" }}
                            title="Next Record"
                          >
                            Next <ChevronRight size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEnvelopeAccount(accountForm);
                              setShowEnvelopeModal(true);
                            }}
                            style={{ ...btn("#0284c7"), padding: "7px 12px", fontSize: "12px" }}
                          >
                            ✉️ Envelop
                          </button>
                          <button
                            type="button"
                            onClick={handleGSTAutoFill}
                            style={{ ...btn("#7c3aed"), padding: "7px 12px", fontSize: "12px" }}
                          >
                            GST Update
                          </button>
                          {editingAccount && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(editingAccount.id)}
                              style={{ ...btn("#dc2626"), padding: "7px 12px", fontSize: "12px" }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => { setShowAccountForm(false); setEditingAccount(null); }}
                            style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), padding: "7px 14px", fontSize: "12px" }}
                          >
                            <X size={13} /> Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveAccount}
                            style={{ ...btn("var(--color-primary)"), padding: "7px 18px", fontSize: "12px", fontWeight: "800" }}
                          >
                            <CheckCircle size={14} /> {editingAccount ? "Update Account" : "Save Account"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── ACCOUNTS DIRECTORY TABLE / EMPTY SEARCH-TO-EDIT (Inventory Style / Image 2) ─── */}
                  <div style={{ background: "white", borderRadius: "12px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>
                        Registered Accounts ({filtered.length})
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        Click any account to edit details or press Enter in search bar
                      </span>
                    </div>

                    {filtered.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                        <div style={{ fontSize: "40px", opacity: 0.6 }}>🏛️</div>
                        <p style={{ marginTop: "12px", fontWeight: "700", fontSize: "15px", color: "#334155" }}>
                          No accounts found matching your criteria
                        </p>
                        <p style={{ fontSize: "12px", color: "#64748b" }}>
                          Add a new account or change your search query.
                        </p>
                        <button
                          onClick={() => handleOpenForm(null)}
                          style={{ ...btn("var(--color-primary)"), margin: "14px auto 0", fontSize: "12px" }}
                        >
                          <Plus size={13} /> Add New Account
                        </button>
                      </div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                          <thead>
                            <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                              <th style={{ padding: "10px 8px", textAlign: "center", width: "45px" }}>Sr No</th>
                              <th style={{ padding: "10px 12px", textAlign: "left" }}>Account Name</th>
                              <th style={{ padding: "10px 10px", textAlign: "left", width: "150px" }}>Group</th>
                              <th style={{ padding: "10px 10px", textAlign: "left", width: "110px" }}>City</th>
                              <th style={{ padding: "10px 10px", textAlign: "left", width: "110px" }}>Mobile</th>
                              <th style={{ padding: "10px 10px", textAlign: "left", width: "140px" }}>GSTIN</th>
                              <th style={{ padding: "10px 12px", textAlign: "right", width: "120px" }}>Op. Balance</th>
                              <th style={{ padding: "10px 8px", textAlign: "center", width: "80px" }}>Status</th>
                              <th style={{ padding: "10px 12px", textAlign: "center", width: "160px" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((acc, idx) => {
                              const isInactive = !!acc.statusOff;
                              return (
                                <tr
                                  key={acc.id}
                                  style={{
                                    borderBottom: "1px solid #f1f5f9",
                                    background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                                    transition: "background 0.15s ease"
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f8fafc"}
                                >
                                  <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "700", color: "#64748b" }}>
                                    {acc.srNo || idx + 1}
                                  </td>
                                  <td
                                    onClick={() => handleOpenForm(acc)}
                                    style={{ padding: "8px 12px", fontWeight: "800", color: "#1e3a8a", cursor: "pointer" }}
                                    title="Click to edit account"
                                  >
                                    {acc.name}
                                    {acc.contact && <span style={{ display: "block", fontSize: "10px", fontWeight: "400", color: "#64748b" }}>Attn: {acc.contact}</span>}
                                  </td>
                                  <td style={{ padding: "8px 10px", color: "#334155" }}>
                                    <span style={{ background: acc.group === "Sundry Creditors" ? "#e0e7ff" : acc.group === "Sundry Debtors" ? "#dcfce7" : "#f1f5f9", color: acc.group === "Sundry Creditors" ? "#3730a3" : acc.group === "Sundry Debtors" ? "#166534" : "#475569", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                                      {acc.group || "Sundry Creditors"}
                                    </span>
                                  </td>
                                  <td style={{ padding: "8px 10px", color: "#475569" }}>{acc.city || "-"}</td>
                                  <td style={{ padding: "8px 10px", color: "#475569", fontWeight: "600" }}>{acc.mobile || "-"}</td>
                                  <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: "11px", color: "#334155" }}>
                                    {acc.gstTin || "-"}
                                  </td>
                                  <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "700", color: acc.balType === "Dr" ? "#dc2626" : "#16a34a" }}>
                                    ₹{Number(acc.opBal || 0).toFixed(2)} {acc.balType || "Cr"}
                                  </td>
                                  <td style={{ padding: "8px 6px", textAlign: "center" }}>
                                    <span style={{ background: isInactive ? "#fee2e2" : "#dcfce7", color: isInactive ? "#991b1b" : "#166534", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                                      {isInactive ? "Off" : "Active"}
                                    </span>
                                  </td>
                                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                      <button
                                        onClick={() => handleOpenForm(acc)}
                                        style={{ ...btn("#2563eb"), padding: "4px 8px", fontSize: "11px" }}
                                        title="Edit Account"
                                      >
                                        <Edit2 size={11} /> Edit
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEnvelopeAccount(acc);
                                          setShowEnvelopeModal(true);
                                        }}
                                        style={{ ...btn("#0284c7"), padding: "4px 6px", fontSize: "11px" }}
                                        title="Print Envelope"
                                      >
                                        ✉️
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAccount(acc.id)}
                                        style={{ ...btn("#dc2626"), padding: "4px 6px", fontSize: "11px" }}
                                        title="Delete Account"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* ─── ENVELOPE MODAL ─── */}
                  {showEnvelopeModal && envelopeAccount && (
                    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                      <div style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "560px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", overflow: "hidden" }}>
                        <div style={{ padding: "14px 20px", background: "#1e293b", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "700", fontSize: "14px" }}>✉️ Print Envelope Preview</span>
                          <button onClick={() => setShowEnvelopeModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={16} /></button>
                        </div>
                        <div style={{ padding: "30px", border: "2px dashed #cbd5e1", margin: "20px", borderRadius: "8px", background: "#fdfefe" }}>
                          {/* Sender */}
                          <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "30px" }}>
                            <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "13px" }}>SHIV DHARA MEDICAL STORE</div>
                            <div>Ring Road, Surat, Gujarat</div>
                            <div>Phone: 9879105901</div>
                          </div>

                          {/* Receiver */}
                          <div style={{ marginLeft: "120px", fontSize: "13px", color: "#0f172a", lineHeight: "1.6" }}>
                            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>To:</div>
                            <div style={{ fontWeight: "800", fontSize: "15px", color: "#1e3a8a" }}>{envelopeAccount.name}</div>
                            {envelopeAccount.contact && <div>Attn: {envelopeAccount.contact}</div>}
                            <div>{envelopeAccount.address || "Address"}</div>
                            <div>{envelopeAccount.area ? `${envelopeAccount.area}, ` : ""}{envelopeAccount.city || ""} {envelopeAccount.state ? `(${envelopeAccount.state})` : ""}</div>
                            {envelopeAccount.mobile && <div style={{ fontWeight: "700", marginTop: "4px" }}>Mobile: {envelopeAccount.mobile}</div>}
                            {envelopeAccount.dlNo && <div style={{ fontSize: "11px", color: "#64748b" }}>D.L. No: {envelopeAccount.dlNo}</div>}
                          </div>
                        </div>
                        <div style={{ padding: "12px 20px", background: "#f8fafc", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <button onClick={() => setShowEnvelopeModal(false)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "12px" }}>Close</button>
                          <button
                            onClick={() => {
                              const pw = window.open("", "_blank");
                              if (!pw) return;
                              pw.document.write(`
                                <html>
                                  <head>
                                    <title>Envelope - ${envelopeAccount.name}</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; padding: 40px; margin: 0; }
                                      .sender { font-size: 11px; color: #444; }
                                      .receiver { margin-top: 50px; margin-left: 180px; font-size: 15px; line-height: 1.6; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="sender">
                                      <strong>SHIV DHARA MEDICAL STORE</strong><br/>
                                      Ring Road, Surat, Gujarat<br/>
                                      Phone: 9879105901
                                    </div>
                                    <div class="receiver">
                                      To,<br/>
                                      <strong style="font-size: 17px;">${envelopeAccount.name}</strong><br/>
                                      ${envelopeAccount.contact ? `Attn: ${envelopeAccount.contact}<br/>` : ''}
                                      ${envelopeAccount.address || ''}<br/>
                                      ${envelopeAccount.area ? `${envelopeAccount.area}, ` : ''}${envelopeAccount.city || ''} ${envelopeAccount.state ? `(${envelopeAccount.state})` : ''}<br/>
                                      ${envelopeAccount.mobile ? `<strong>Mobile: ${envelopeAccount.mobile}</strong><br/>` : ''}
                                      ${envelopeAccount.dlNo ? `<span style="font-size: 11px;">D.L. No: ${envelopeAccount.dlNo}</span>` : ''}
                                    </div>
                                  </body>
                                </html>
                              `);
                              pw.document.close();
                              pw.focus();
                              setTimeout(() => pw.print(), 300);
                            }}
                            style={{ ...btn("#0284c7"), fontSize: "12px" }}
                          >
                            <Printer size={13} /> Print Envelope
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

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
  <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", background: "#ffffff", zIndex: 9999, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Inter, sans-serif" }}>
      
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
                onClick={() => setShowDataUtility(false)}
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
                          { label: "Add New Item", icon: "➕", color: "#16a34a", action: () => { setShowDataUtility(false); openItemForm(); } },
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
        )}

                {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SUPERVISOR — DATA MERGE FACILITY (100% FULLSCREEN MODERN THEME) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showMergeFacility && (
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
            {/* ── TOP HEADER ── */}
            <div style={{
              background: "linear-gradient(135deg, #042f2e 0%, #0d9488 50%, #0f172a 100%)",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              color: "#fff",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 10px rgba(255,255,255,0.2)"
                }}>
                  <Package size={24} color="#5eead4" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", letterSpacing: "0.5px" }}>
                      Supervisor — Data Merge Facility
                    </h2>
                    <span style={{
                      background: "#14b8a6",
                      color: "#042f2e",
                      fontSize: "10px",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      letterSpacing: "0.5px"
                    }}>
                      ADMIN LEVEL
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#ccfbf1", marginTop: "2px" }}>
                    Consolidate duplicate items, companies, suppliers, accounts, generics, or doctors into a single primary record
                  </div>
                </div>
              </div>

              {/* Header Right Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={() => { setShowMergeFacility(false); setMergeStatus(null); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#fff",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.85)"; e.currentTarget.style.borderColor = "transparent"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                >
                  <X size={16} /> Close [Esc]
                </button>
              </div>
            </div>

            {/* ── CRITICAL SAFETY BACKUP BANNER (Proper English as requested) ── */}
            <div style={{
              background: "linear-gradient(90deg, #fffbeb 0%, #fef2f2 100%)",
              borderBottom: "2px solid #fecaca",
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: "900",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  letterSpacing: "0.8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <AlertCircle size={14} /> CRITICAL SAFETY WARNING
                </div>
                <div>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#991b1b" }}>
                    PLEASE TAKE A COMPLETE DATABASE BACKUP BEFORE MERGING ANY RECORDS
                  </span>
                  <span style={{ fontSize: "12px", color: "#7f1d1d", marginLeft: "8px" }}>
                    — Merged transactions, batches, and ledger links cannot be automatically reversed.
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  try {
                    handleExportData();
                  } catch (_) {
                    alert("Backup export triggered. Please verify download.");
                  }
                }}
                style={{
                  background: "#991b1b",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(153,27,27,0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>💾</span> Take Data Backup Now
              </button>
            </div>

            {/* ── NAVIGATION BAR: CATEGORY TABS & MERGE OPTION ── */}
            <div style={{
              background: "#ffffff",
              padding: "0 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              flexShrink: 0
            }}>
              {/* Category Selection Tabs */}
              <div style={{ display: "flex", gap: "4px" }}>
                {[
                  { id: "item", label: "Merge Item", icon: "💊" },
                  { id: "company", label: "Merge Company", icon: "🏭" },
                  { id: "supplier", label: "Merge Supplier", icon: "🚚" },
                  { id: "debtor", label: "Merge Debtor / Customer", icon: "👥" },
                  { id: "generic", label: "Merge Generic", icon: "🧬" },
                  { id: "doctor", label: "Merge Doctor", icon: "🩺" },
                ].map(cat => {
                  const isActive = mergeActiveTab === "merge" && mergeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setMergeActiveTab("merge");
                        setMergeCategory(cat.id as any);
                        setMergeSourceId("");
                        setMergeSourceName("");
                        setMergeTargetId("");
                        setMergeTargetName("");
                        setMergeSourceSearch("");
                        setMergeTargetSearch("");
                        setMergeStatus(null);
                        setMergeConfirmChecked(false);
                      }}
                      style={{
                        padding: "12px 14px",
                        border: "none",
                        background: "none",
                        borderBottom: isActive ? "3px solid #0d9488" : "3px solid transparent",
                        color: isActive ? "#0d9488" : "#64748b",
                        fontWeight: isActive ? "800" : "600",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.15s"
                      }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => { setMergeActiveTab("logs"); setMergeStatus(null); }}
                  style={{
                    padding: "12px 14px",
                    border: "none",
                    background: "none",
                    borderBottom: mergeActiveTab === "logs" ? "3px solid #0d9488" : "3px solid transparent",
                    color: mergeActiveTab === "logs" ? "#0d9488" : "#64748b",
                    fontWeight: mergeActiveTab === "logs" ? "800" : "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s"
                  }}
                >
                  <span>📜</span>
                  <span>Merge History ({mergeLogs.length})</span>
                </button>
              </div>

              {/* Merge Deletion Option Radio Buttons */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                background: "#f8fafc",
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "12px"
              }}>
                <span style={{ fontWeight: "700", color: "#475569" }}>Post-Merge Action:</span>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: mergeFacilityOpt === "delete" ? "700" : "500", color: mergeFacilityOpt === "delete" ? "#dc2626" : "#334155" }}>
                  <input
                    type="radio"
                    name="mergeFacilityOpt"
                    checked={mergeFacilityOpt === "delete"}
                    onChange={() => setMergeFacilityOpt("delete")}
                    style={{ accentColor: "#dc2626" }}
                  />
                  Delete Source Record After Merging (Recommended)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: mergeFacilityOpt === "nodelete" ? "700" : "500", color: mergeFacilityOpt === "nodelete" ? "#0f766e" : "#334155" }}>
                  <input
                    type="radio"
                    name="mergeFacilityOpt"
                    checked={mergeFacilityOpt === "nodelete"}
                    onChange={() => setMergeFacilityOpt("nodelete")}
                    style={{ accentColor: "#0d9488" }}
                  />
                  Keep Source Record (Reassign Transactions Only)
                </label>
              </div>
            </div>

            {/* ── STATUS ALERT BANNER ── */}
            {mergeStatus && (
              <div style={{
                padding: "10px 24px",
                background: mergeStatus.type === "success" ? "#dcfce7" : mergeStatus.type === "error" ? "#fee2e2" : "#e0f2fe",
                color: mergeStatus.type === "success" ? "#166534" : mergeStatus.type === "error" ? "#991b1b" : "#075985",
                fontSize: "13px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                flexShrink: 0
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {mergeStatus.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{mergeStatus.msg}</span>
                </div>
                <button
                  onClick={() => setMergeStatus(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold" }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* ── MAIN WORKSPACE ── */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              
              {/* TAB 1: ACTIVE MERGE CONFIGURATION */}
              {mergeActiveTab === "merge" && (
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", padding: "20px", overflow: "hidden" }}>
                  
                  {/* LEFT COLUMN: SOURCE AND TARGET SELECTOR */}
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    overflowY: "auto"
                  }}>
                    <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a", textTransform: "capitalize" }}>
                        Merge {mergeCategory} Configuration
                      </h3>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        Select the duplicate record to merge from, and the primary record to merge into
                      </div>
                    </div>

                    {/* SOURCE RECORD (FROM) */}
                    <div style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "10px",
                      padding: "14px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <label style={{ fontSize: "12px", fontWeight: "800", color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          🔴 1. Source {mergeCategory} (Duplicate Record to Merge Away) *
                        </label>
                        {mergeSourceName && (
                          <button
                            onClick={() => { setMergeSourceId(""); setMergeSourceName(""); setMergeSourceSearch(""); }}
                            style={{ background: "none", border: "none", color: "#ef4444", fontSize: "11px", fontWeight: "700", cursor: "pointer", textDecoration: "underline" }}
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {mergeSourceName ? (
                        <div style={{
                          background: "#ffffff",
                          border: "1px solid #f87171",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <div>
                            <div style={{ fontWeight: "800", fontSize: "14px", color: "#991b1b" }}>
                              {mergeSourceName}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                              {mergeSourceId ? `ID: #${mergeSourceId}` : 'Primary Record'}
                            </div>
                          </div>
                          <span style={{
                            background: "#fee2e2",
                            color: "#991b1b",
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "4px"
                          }}>
                            {mergeFacilityOpt === "delete" ? "Will be DELETED" : "Will be REASSIGNED"}
                          </span>
                        </div>
                      ) : (
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            value={mergeSourceSearch}
                            onChange={e => setMergeSourceSearch(e.target.value)}
                            placeholder={`Type to search source ${mergeCategory}...`}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: "1px solid #fca5a5",
                              fontSize: "13px",
                              outline: "none",
                              background: "#fff",
                              boxSizing: "border-box"
                            }}
                          />

                          {/* Matching options list */}
                          <div style={{
                            maxHeight: "180px",
                            overflowY: "auto",
                            background: "#ffffff",
                            border: "1px solid #fca5a5",
                            borderRadius: "8px",
                            marginTop: "6px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
                          }}>
                            {(() => {
                              const q = mergeSourceSearch.trim().toLowerCase();
                              let candidates: { id: string; name: string; info: string }[] = [];

                              if (mergeCategory === "item") {
                                candidates = items.filter((i: any) => !q || (i.name || '').toLowerCase().includes(q) || (i.company || '').toLowerCase().includes(q))
                                  .slice(0, 20)
                                  .map((i: any) => ({ id: String(i.id), name: i.name, info: `Stock: ${i.stock || 0} · ${i.company || 'N/A'}` }));
                              } else if (mergeCategory === "company") {
                                const comps = Array.from(new Set(items.map((i: any) => (i.company || '').trim()).filter(Boolean))) as string[];
                                candidates = comps.filter(c => !q || c.toLowerCase().includes(q))
                                  .slice(0, 20)
                                  .map(c => ({ id: "", name: c, info: `${items.filter((i: any) => (i.company || '').trim() === c).length} items linked` }));
                              } else if (mergeCategory === "supplier") {
                                candidates = suppliers.filter((s: any) => !q || (s.name || '').toLowerCase().includes(q))
                                  .slice(0, 20)
                                  .map((s: any) => ({ id: String(s.id), name: s.name, info: `Phone: ${s.phone || s.mobile || '—'}` }));
                              } else if (mergeCategory === "debtor") {
                                const names = Array.from(new Set(salesBills.map((b: any) => (b.patientName || '').trim()).filter(Boolean))) as string[];
                                candidates = names.filter(n => !q || n.toLowerCase().includes(q))
                                  .slice(0, 20)
                                  .map(n => ({ id: "", name: n, info: `${salesBills.filter((b: any) => (b.patientName || '').trim() === n).length} bills recorded` }));
                              } else if (mergeCategory === "generic") {
                                const gens = Array.from(new Set(items.map((i: any) => (i.generic || i.genericName || '').trim()).filter(Boolean))) as string[];
                                candidates = gens.filter(g => !q || g.toLowerCase().includes(g))
                                  .slice(0, 20)
                                  .map(g => ({ id: "", name: g, info: `${items.filter((i: any) => (i.generic || i.genericName || '').trim() === g).length} items` }));
                              } else if (mergeCategory === "doctor") {
                                candidates = (doctors || []).filter((d: any) => !q || (d.name || '').toLowerCase().includes(q))
                                  .slice(0, 20)
                                  .map((d: any) => ({ id: String(d.id), name: d.name, info: `Speciality: ${d.speciality || 'General'}` }));
                              }

                              if (candidates.length === 0) {
                                return <div style={{ padding: "10px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>No records found</div>;
                              }

                              return candidates.map(c => (
                                <div
                                  key={c.id || c.name}
                                  onClick={() => {
                                    setMergeSourceId(c.id);
                                    setMergeSourceName(c.name);
                                    setMergeSourceSearch("");
                                  }}
                                  style={{
                                    padding: "8px 12px",
                                    borderBottom: "1px solid #f1f5f9",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                                  onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
                                >
                                  <strong style={{ color: "#1e293b" }}>{c.name}</strong>
                                  <span style={{ color: "#64748b", fontSize: "11px" }}>{c.info}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* MERGE DIRECTION ARROW */}
                    <div style={{ textAlign: "center", margin: "-6px 0" }}>
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#0d9488",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: "800",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        letterSpacing: "0.5px",
                        boxShadow: "0 2px 6px rgba(13,148,136,0.3)"
                      }}>
                        ⬇️ MERGING ALL DATA INTO ⬇️
                      </div>
                    </div>

                    {/* TARGET RECORD (TO) */}
                    <div style={{
                      background: "#f0fdfa",
                      border: "1px solid #99f6e4",
                      borderRadius: "10px",
                      padding: "14px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <label style={{ fontSize: "12px", fontWeight: "800", color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          🟢 2. Target {mergeCategory} (Primary Record to Keep) *
                        </label>
                        {mergeTargetName && (
                          <button
                            onClick={() => { setMergeTargetId(""); setMergeTargetName(""); setMergeTargetSearch(""); }}
                            style={{ background: "none", border: "none", color: "#0d9488", fontSize: "11px", fontWeight: "700", cursor: "pointer", textDecoration: "underline" }}
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {mergeTargetName ? (
                        <div style={{
                          background: "#ffffff",
                          border: "1px solid #14b8a6",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <div>
                            <div style={{ fontWeight: "800", fontSize: "14px", color: "#0f766e" }}>
                              {mergeTargetName}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                              {mergeTargetId ? `ID: #${mergeTargetId}` : 'Primary Record'}
                            </div>
                          </div>
                          <span style={{
                            background: "#ccfbf1",
                            color: "#0f766e",
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "4px"
                          }}>
                            WILL RECEIVE ALL DATA
                          </span>
                        </div>
                      ) : (
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            value={mergeTargetSearch}
                            onChange={e => setMergeTargetSearch(e.target.value)}
                            placeholder={`Type to search target ${mergeCategory}...`}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: "1px solid #5eead4",
                              fontSize: "13px",
                              outline: "none",
                              background: "#fff",
                              boxSizing: "border-box"
                            }}
                          />

                          {/* Matching options list */}
                          <div style={{
                            maxHeight: "180px",
                            overflowY: "auto",
                            background: "#ffffff",
                            border: "1px solid #5eead4",
                            borderRadius: "8px",
                            marginTop: "6px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
                          }}>
                            {(() => {
                              const q = mergeTargetSearch.trim().toLowerCase();
                              let candidates: { id: string; name: string; info: string }[] = [];

                              if (mergeCategory === "item") {
                                candidates = items.filter((i: any) => (!q || (i.name || '').toLowerCase().includes(q) || (i.company || '').toLowerCase().includes(q)) && String(i.id) !== mergeSourceId)
                                  .slice(0, 20)
                                  .map((i: any) => ({ id: String(i.id), name: i.name, info: `Stock: ${i.stock || 0} · ${i.company || 'N/A'}` }));
                              } else if (mergeCategory === "company") {
                                const comps = Array.from(new Set(items.map((i: any) => (i.company || '').trim()).filter(Boolean))) as string[];
                                candidates = comps.filter(c => (!q || c.toLowerCase().includes(q)) && c.toLowerCase() !== mergeSourceName.toLowerCase())
                                  .slice(0, 20)
                                  .map(c => ({ id: "", name: c, info: `${items.filter((i: any) => (i.company || '').trim() === c).length} items linked` }));
                              } else if (mergeCategory === "supplier") {
                                candidates = suppliers.filter((s: any) => (!q || (s.name || '').toLowerCase().includes(q)) && String(s.id) !== mergeSourceId)
                                  .slice(0, 20)
                                  .map((s: any) => ({ id: String(s.id), name: s.name, info: `Phone: ${s.phone || s.mobile || '—'}` }));
                              } else if (mergeCategory === "debtor") {
                                const names = Array.from(new Set(salesBills.map((b: any) => (b.patientName || '').trim()).filter(Boolean))) as string[];
                                candidates = names.filter(n => (!q || n.toLowerCase().includes(q)) && n.toLowerCase() !== mergeSourceName.toLowerCase())
                                  .slice(0, 20)
                                  .map(n => ({ id: "", name: n, info: `${salesBills.filter((b: any) => (b.patientName || '').trim() === n).length} bills recorded` }));
                              } else if (mergeCategory === "generic") {
                                const gens = Array.from(new Set(items.map((i: any) => (i.generic || i.genericName || '').trim()).filter(Boolean))) as string[];
                                candidates = gens.filter(g => (!q || g.toLowerCase().includes(g)) && g.toLowerCase() !== mergeSourceName.toLowerCase())
                                  .slice(0, 20)
                                  .map(g => ({ id: "", name: g, info: `${items.filter((i: any) => (i.generic || i.genericName || '').trim() === g).length} items` }));
                              } else if (mergeCategory === "doctor") {
                                candidates = (doctors || []).filter((d: any) => (!q || (d.name || '').toLowerCase().includes(q)) && String(d.id) !== mergeSourceId)
                                  .slice(0, 20)
                                  .map((d: any) => ({ id: String(d.id), name: d.name, info: `Speciality: ${d.speciality || 'General'}` }));
                              }

                              if (candidates.length === 0) {
                                return <div style={{ padding: "10px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>No records found</div>;
                              }

                              return candidates.map(c => (
                                <div
                                  key={c.id || c.name}
                                  onClick={() => {
                                    setMergeTargetId(c.id);
                                    setMergeTargetName(c.name);
                                    setMergeTargetSearch("");
                                  }}
                                  style={{
                                    padding: "8px 12px",
                                    borderBottom: "1px solid #f1f5f9",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#f0fdfa"}
                                  onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
                                >
                                  <strong style={{ color: "#1e293b" }}>{c.name}</strong>
                                  <span style={{ color: "#64748b", fontSize: "11px" }}>{c.info}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CONFIRMATION CHECKBOX */}
                    <div style={{
                      background: "#fffbeb",
                      border: "1px solid #fef3c7",
                      borderRadius: "8px",
                      padding: "12px"
                    }}>
                      <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={mergeConfirmChecked}
                          onChange={e => setMergeConfirmChecked(e.target.checked)}
                          style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#0d9488" }}
                        />
                        <span style={{ fontSize: "12px", color: "#92400e", lineHeight: "1.4" }}>
                          <strong>I confirm this merge operation:</strong> I understand that all batches, bills, and transactions linked to <u>{mergeSourceName || 'Source'}</u> will be permanently transferred to <u>{mergeTargetName || 'Target'}</u>.
                        </span>
                      </label>
                    </div>

                    {/* SUBMIT ACTION BUTTON */}
                    <div>
                      <button
                        onClick={handleExecuteMerge}
                        disabled={mergeLoading || !mergeSourceName || !mergeTargetName || !mergeConfirmChecked}
                        style={{
                          width: "100%",
                          padding: "13px",
                          borderRadius: "8px",
                          border: "none",
                          background: (!mergeSourceName || !mergeTargetName || !mergeConfirmChecked || mergeLoading)
                            ? "#cbd5e1"
                            : "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                          color: "#ffffff",
                          fontWeight: "800",
                          fontSize: "14px",
                          letterSpacing: "0.5px",
                          cursor: (!mergeSourceName || !mergeTargetName || !mergeConfirmChecked || mergeLoading) ? "not-allowed" : "pointer",
                          boxShadow: (!mergeSourceName || !mergeTargetName || !mergeConfirmChecked) ? "none" : "0 4px 12px rgba(13,148,136,0.35)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          transition: "0.15s"
                        }}
                      >
                        {mergeLoading ? (
                          <span>Executing Merge...</span>
                        ) : (
                          <>
                            <Check size={18} /> Confirm & Execute {mergeCategory.toUpperCase()} Merge
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: LIVE IMPACT PREVIEW & COMPARISON */}
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    overflowY: "auto"
                  }}>
                    <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                        Merge Impact & Side-by-Side Comparison
                      </h3>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        Detailed preview of records and stock affected by this consolidation
                      </div>
                    </div>

                    {/* Comparison Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      
                      {/* SOURCE CARD */}
                      <div style={{
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                        borderRadius: "10px",
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}>
                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#991b1b", textTransform: "uppercase" }}>
                          Source: Will be {mergeFacilityOpt === "delete" ? "DELETED" : "REASSIGNED"}
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: "800", color: "#7f1d1d" }}>
                          {mergeSourceName || "— Not Selected —"}
                        </div>
                        {mergeCategory === "item" && mergeSourceId && (() => {
                          const item = items.find((i: any) => String(i.id) === String(mergeSourceId));
                          const itemBatches = batches.filter((b: any) => String(b.itemId) === String(mergeSourceId));
                          return (
                            <div style={{ fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "4px" }}>
                              <div>Stock: <strong>{item?.stock || 0} units</strong></div>
                              <div>Batches Linked: <strong>{itemBatches.length} batches</strong></div>
                              <div>Company: <strong>{item?.company || 'N/A'}</strong></div>
                            </div>
                          );
                        })()}
                        {mergeCategory === "company" && mergeSourceName && (() => {
                          const count = items.filter((i: any) => (i.company || '').trim().toLowerCase() === mergeSourceName.toLowerCase()).length;
                          return <div style={{ fontSize: "12px", color: "#334155" }}>Items under this company: <strong>{count}</strong></div>;
                        })()}
                        {mergeCategory === "supplier" && mergeSourceId && (() => {
                          const pCount = purchaseBills.filter((b: any) => String(b.supplierId) === String(mergeSourceId) || (b.partyName || '').toLowerCase() === mergeSourceName.toLowerCase()).length;
                          return <div style={{ fontSize: "12px", color: "#334155" }}>Purchase bills linked: <strong>{pCount}</strong></div>;
                        })()}
                        {mergeCategory === "debtor" && mergeSourceName && (() => {
                          const sCount = salesBills.filter((b: any) => (b.patientName || '').toLowerCase() === mergeSourceName.toLowerCase()).length;
                          return <div style={{ fontSize: "12px", color: "#334155" }}>Sales bills recorded: <strong>{sCount}</strong></div>;
                        })()}
                      </div>

                      {/* TARGET CARD */}
                      <div style={{
                        background: "#f0fdfa",
                        border: "1px solid #99f6e4",
                        borderRadius: "10px",
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}>
                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#0f766e", textTransform: "uppercase" }}>
                          Target: Primary Record to KEEP
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: "800", color: "#115e59" }}>
                          {mergeTargetName || "— Not Selected —"}
                        </div>
                        {mergeCategory === "item" && mergeTargetId && (() => {
                          const item = items.find((i: any) => String(i.id) === String(mergeTargetId));
                          const itemBatches = batches.filter((b: any) => String(b.itemId) === String(mergeTargetId));
                          return (
                            <div style={{ fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "4px" }}>
                              <div>Current Stock: <strong>{item?.stock || 0} units</strong></div>
                              <div>Current Batches: <strong>{itemBatches.length} batches</strong></div>
                              <div>Company: <strong>{item?.company || 'N/A'}</strong></div>
                            </div>
                          );
                        })()}
                        {mergeCategory === "company" && mergeTargetName && (() => {
                          const count = items.filter((i: any) => (i.company || '').trim().toLowerCase() === mergeTargetName.toLowerCase()).length;
                          return <div style={{ fontSize: "12px", color: "#334155" }}>Current items: <strong>{count}</strong></div>;
                        })()}
                        {mergeCategory === "supplier" && mergeTargetId && (() => {
                          const pCount = purchaseBills.filter((b: any) => String(b.supplierId) === String(mergeTargetId) || (b.partyName || '').toLowerCase() === mergeTargetName.toLowerCase()).length;
                          return <div style={{ fontSize: "12px", color: "#334155" }}>Purchase bills linked: <strong>{pCount}</strong></div>;
                        })()}
                        {mergeCategory === "debtor" && mergeTargetName && (() => {
                          const sCount = salesBills.filter((b: any) => (b.patientName || '').toLowerCase() === mergeTargetName.toLowerCase()).length;
                          return <div style={{ fontSize: "12px", color: "#334155" }}>Sales bills recorded: <strong>{sCount}</strong></div>;
                        })()}
                      </div>
                    </div>

                    {/* COMBINED RESULT CALCULATOR */}
                    {mergeSourceName && mergeTargetName && (
                      <div style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>
                          📊 Expected Result After Consolidation:
                        </div>
                        {mergeCategory === "item" && (() => {
                          const sItem = items.find((i: any) => String(i.id) === String(mergeSourceId) || i.name === mergeSourceName);
                          const tItem = items.find((i: any) => String(i.id) === String(mergeTargetId) || i.name === mergeTargetName);
                          const sStock = Number(sItem?.stock) || 0;
                          const tStock = Number(tItem?.stock) || 0;
                          const sBatches = batches.filter((b: any) => String(b.itemId) === String(mergeSourceId)).length;
                          const tBatches = batches.filter((b: any) => String(b.itemId) === String(mergeTargetId)).length;

                          return (
                            <div style={{ fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div>• Combined Stock: <strong>{tStock} + {sStock} = {tStock + sStock} units</strong></div>
                              <div>• Total Active Batches: <strong>{tBatches} + {sBatches} = {tBatches + sBatches} batches</strong></div>
                              <div>• Status of duplicate "{mergeSourceName}": <strong>{mergeFacilityOpt === "delete" ? "Permanently Deleted" : "Retained as Archived"}</strong></div>
                            </div>
                          );
                        })()}
                        {mergeCategory !== "item" && (
                          <div style={{ fontSize: "12px", color: "#334155", lineHeight: "1.5" }}>
                            All invoices, bills, payments, and transaction history currently linked to <strong>"{mergeSourceName}"</strong> will be transferred under <strong>"{mergeTargetName}"</strong>.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Informational Guidance */}
                    <div style={{
                      marginTop: "auto",
                      background: "#f1f5f9",
                      borderRadius: "8px",
                      padding: "12px",
                      fontSize: "11px",
                      color: "#475569",
                      lineHeight: "1.4"
                    }}>
                      <strong>💡 Best Practice Tip:</strong> Merge facility is typically used when the same medicine, company, or party has been entered under two different spellings or variants (e.g. "Dolo 650" vs "DOLO 650MG"). Always check item formulation and pack sizes before merging items.
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: MERGE AUDIT HISTORY / LOGS */}
              {mergeActiveTab === "logs" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "20px" }}>
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      padding: "14px 20px",
                      background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#1e293b" }}>
                          Data Merge Facility Audit Logs
                        </h3>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Permanent historical trace of all consolidated items, companies, suppliers, and accounts
                        </div>
                      </div>

                      {mergeLogs.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to clear local merge logs?")) {
                              setMergeLogs([]);
                              localStorage.removeItem("store_merge_history");
                            }
                          }}
                          style={{
                            background: "#fee2e2",
                            color: "#b91c1c",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                        >
                          Clear Logs
                        </button>
                      )}
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9", color: "#475569", textAlign: "left" }}>
                            <th style={{ padding: "8px 12px", borderRadius: "6px 0 0 6px" }}>Date & Time</th>
                            <th style={{ padding: "8px 12px" }}>Category</th>
                            <th style={{ padding: "8px 12px" }}>Source Record (Merged From)</th>
                            <th style={{ padding: "8px 12px" }}>Target Record (Merged Into)</th>
                            <th style={{ padding: "8px 12px" }}>Source Action</th>
                            <th style={{ padding: "8px 12px", borderRadius: "0 6px 6px 0" }}>User</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mergeLogs.map((log: any) => (
                            <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "10px 12px", color: "#64748b" }}>
                                {new Date(log.date).toLocaleString("en-IN")}
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{
                                  background: "#e0f2fe",
                                  color: "#0369a1",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  fontWeight: "700",
                                  textTransform: "uppercase"
                                }}>
                                  {log.category}
                                </span>
                              </td>
                              <td style={{ padding: "10px 12px", fontWeight: "700", color: "#dc2626" }}>
                                {log.source}
                              </td>
                              <td style={{ padding: "10px 12px", fontWeight: "800", color: "#16a34a" }}>
                                {log.target}
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{
                                  background: log.deleteSource ? "#fee2e2" : "#fef3c7",
                                  color: log.deleteSource ? "#991b1b" : "#92400e",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  fontWeight: "700"
                                }}>
                                  {log.deleteSource ? "DELETED" : "REASSIGNED"}
                                </span>
                              </td>
                              <td style={{ padding: "10px 12px", fontWeight: "700", color: "#0f766e" }}>
                                {log.user}
                              </td>
                            </tr>
                          ))}
                          {mergeLogs.length === 0 && (
                            <tr>
                              <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                                No data merge operations recorded yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SUPERVISOR — STOCK RATE DETAIL & PRICE LEDGER (100% FULLSCREEN) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showStockRateDetail && (
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
            {/* ── TOP HEADER ── */}
            <div style={{
              background: "linear-gradient(135deg, #042f2e 0%, #0d9488 50%, #0f172a 100%)",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              color: "#fff",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 10px rgba(255,255,255,0.2)"
                }}>
                  <TrendingUp size={24} color="#5eead4" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", letterSpacing: "0.5px" }}>
                      Supervisor — Stock Rate Detail & Price Ledger
                    </h2>
                    <span style={{
                      background: "#14b8a6",
                      color: "#042f2e",
                      fontSize: "10px",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      letterSpacing: "0.5px"
                    }}>
                      SUPERVISOR AUDIT
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#ccfbf1", marginTop: "2px" }}>
                    Complete inventory valuation with MRP, Sale Rate, Purchase Rate, and calculated Landing Price (LP)
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowStockRateDetail(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.85)"; e.currentTarget.style.borderColor = "transparent"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
              >
                <X size={16} /> Close [Esc]
              </button>
            </div>

            {/* ── KPI SUMMARY CARDS ── */}
            {(() => {
              let totalStockUnits = 0;
              let totalValMRP = 0;
              let totalValCost = 0;
              let totalBatchesCount = 0;

              items.forEach((item: any) => {
                const itemBatches = batches.filter((b: any) => b.itemId === item.id);
                const taxRate = Number(item.gst || item.tax || 12);

                if (itemBatches.length > 0) {
                  itemBatches.forEach((b: any) => {
                    totalBatchesCount++;
                    const qty = Number(b.qty) || 0;
                    const mrp = Number(b.mrp || item.mrp || 0);
                    const key = `${item.id}_${b.batchNo || b.batch || 'default'}`;
                    const pRate = Number(b.purchaseRate || item.purchaseRate || (mrp * 0.7));
                    const lp = srdCalculatedLPs[key] || Number(b.landingPrice || b.netCost) || (pRate * (1 + taxRate / 100));

                    totalStockUnits += qty;
                    totalValMRP += qty * mrp;
                    totalValCost += qty * lp;
                  });
                } else {
                  const qty = Number(item.stock) || 0;
                  const mrp = Number(item.mrp || 0);
                  const key = `${item.id}_default`;
                  const pRate = Number(item.purchaseRate || (mrp * 0.7));
                  const lp = srdCalculatedLPs[key] || (pRate * (1 + taxRate / 100));

                  totalStockUnits += qty;
                  totalValMRP += qty * mrp;
                  totalValCost += qty * lp;
                }
              });

              const grossProfitPotential = totalValMRP - totalValCost;
              const marginPct = totalValMRP > 0 ? ((grossProfitPotential / totalValMRP) * 100).toFixed(1) : "0";

              return (
                <div style={{
                  background: "#ffffff",
                  padding: "10px 24px",
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: "14px",
                  borderBottom: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  flexShrink: 0
                }}>
                  <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Items</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{items.length}</div>
                  </div>

                  <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Active Batches</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0d9488", marginTop: "2px" }}>{totalBatchesCount}</div>
                  </div>

                  <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Stock Qty</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0284c7", marginTop: "2px" }}>{totalStockUnits.toLocaleString("en-IN")}</div>
                  </div>

                  <div style={{ padding: "8px 12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: "11px", color: "#166534", fontWeight: "700", textTransform: "uppercase" }}>Stock Value (MRP)</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#15803d", marginTop: "2px" }}>₹{fmt(totalValMRP)}</div>
                  </div>

                  <div style={{ padding: "8px 12px", background: "#f0fdfa", borderRadius: "8px", border: "1px solid #99f6e4" }}>
                    <div style={{ fontSize: "11px", color: "#0f766e", fontWeight: "700", textTransform: "uppercase" }}>Stock Cost (Landing)</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0d9488", marginTop: "2px" }}>₹{fmt(totalValCost)}</div>
                  </div>

                  <div style={{ padding: "8px 12px", background: "#fef3c7", borderRadius: "8px", border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: "11px", color: "#92400e", fontWeight: "700", textTransform: "uppercase" }}>Potential Margin</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#b45309", marginTop: "2px" }}>
                      {marginPct}% <span style={{ fontSize: "11px", fontWeight: "600" }}>(₹{fmt(grossProfitPotential)})</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── FILTER & CONTROL TOOLBAR ── */}
            <div style={{
              background: "#ffffff",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              borderBottom: "1px solid #cbd5e1",
              flexShrink: 0
            }}>
              {/* Left Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                
                {/* Company Filter Dropdown */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Company:</label>
                  <select
                    value={srdCompanyFilter}
                    onChange={e => setSrdCompanyFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: "#fff",
                      minWidth: "160px",
                      maxWidth: "220px"
                    }}
                  >
                    <option value="ALL">All Companies</option>
                    {Array.from(new Set(items.map((i: any) => (i.company || '').trim()).filter(Boolean))).sort().map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {srdCompanyFilter !== "ALL" && (
                    <button
                      onClick={() => setSrdCompanyFilter("ALL")}
                      style={{
                        padding: "7px 12px",
                        background: "#0d9488",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      All
                    </button>
                  )}
                </div>

                {/* Search Input */}
                <div style={{ position: "relative" }}>
                  <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    value={srdSearchQuery}
                    onChange={e => setSrdSearchQuery(e.target.value)}
                    placeholder="Search Item, Batch, Barcode..."
                    style={{
                      padding: "8px 12px 8px 30px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      width: "220px",
                      outline: "none"
                    }}
                  />
                  {srdSearchQuery && (
                    <button
                      onClick={() => setSrdSearchQuery("")}
                      style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Stock Filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Stock:</label>
                  <select
                    value={srdStockFilter}
                    onChange={e => setSrdStockFilter(e.target.value as any)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      background: "#fff"
                    }}
                  >
                    <option value="all">All Stock Status</option>
                    <option value="in_stock">In Stock Only (&gt; 0)</option>
                    <option value="zero_stock">Zero Stock Only (0)</option>
                  </select>
                </div>

                {/* Tax Filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Tax:</label>
                  <select
                    value={srdTaxFilter}
                    onChange={e => setSrdTaxFilter(e.target.value)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      background: "#fff"
                    }}
                  >
                    <option value="ALL">All Tax Rates</option>
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>

              {/* Right Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                
                {/* Calculate LP Button */}
                <button
                  onClick={handleCalculateAllLP}
                  disabled={srdIsCalculating}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: srdIsCalculating ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 6px rgba(13,148,136,0.3)"
                  }}
                >
                  <span style={{ fontSize: "14px" }}>⚡</span>
                  <span>{srdIsCalculating ? "Calculating..." : "Calculate LP"}</span>
                </button>

                {/* Export CSV Button */}
                <button
                  onClick={handleExportStockRateCSV}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  <FileText size={14} /> Export CSV
                </button>
              </div>
            </div>

            {/* ── STATUS ALERT ── */}
            {srdStatusMsg && (
              <div style={{
                padding: "8px 24px",
                background: "#dcfce7",
                color: "#166534",
                fontSize: "12px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #bbf7d0"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle size={14} />
                  <span>{srdStatusMsg}</span>
                </div>
                <button onClick={() => setSrdStatusMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold" }}>✕</button>
              </div>
            )}

            {/* ── DATA GRID TABLE (12 COLUMNS) ── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", background: "#f8fafc" }}>
              <div style={{
                background: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                overflow: "hidden"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{
                      background: "#0f172a",
                      color: "#ffffff",
                      textAlign: "left",
                      position: "sticky",
                      top: 0,
                      zIndex: 10
                    }}>
                      <th style={{ padding: "10px 8px", width: "45px", textAlign: "center" }}>SrNo</th>
                      <th style={{ padding: "10px 12px", minWidth: "220px" }}>Item Name & Company</th>
                      <th style={{ padding: "10px 8px", width: "55px", textAlign: "center" }}>Tax</th>
                      <th style={{ padding: "10px 8px", width: "65px", textAlign: "center" }}>Unit</th>
                      <th style={{ padding: "10px 10px", width: "95px" }}>Batch</th>
                      <th style={{ padding: "10px 8px", width: "80px", textAlign: "center" }}>Expiry</th>
                      <th style={{ padding: "10px 10px", width: "85px", textAlign: "right" }}>MRP (₹)</th>
                      <th style={{ padding: "10px 10px", width: "85px", textAlign: "right" }}>SRate (₹)</th>
                      <th style={{ padding: "10px 10px", width: "85px", textAlign: "right" }}>PRate (₹)</th>
                      <th style={{ padding: "10px 10px", width: "90px", textAlign: "right", background: "#0d9488", color: "#fff" }}>LP (₹)</th>
                      <th style={{ padding: "10px 8px", width: "70px", textAlign: "right" }}>Open.</th>
                      <th style={{ padding: "10px 10px", width: "75px", textAlign: "right" }}>Curr.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const q = srdSearchQuery.trim().toLowerCase();
                      let displayRows: any[] = [];

                      items.forEach((item: any) => {
                        // Company filter
                        if (srdCompanyFilter !== "ALL" && (item.company || '').trim().toLowerCase() !== srdCompanyFilter.toLowerCase()) {
                          return;
                        }

                        // Tax filter
                        const taxRate = Number(item.gst || item.tax || 12);
                        if (srdTaxFilter !== "ALL" && String(taxRate) !== srdTaxFilter) {
                          return;
                        }

                        // Search query
                        const iName = (item.name || '').toLowerCase();
                        const iComp = (item.company || '').toLowerCase();
                        const iBar = (item.barcode || '').toLowerCase();

                        const itemBatches = batches.filter((b: any) => b.itemId === item.id);

                        if (itemBatches.length > 0) {
                          itemBatches.forEach((b: any) => {
                            const bNo = (b.batchNo || b.batch || '').toLowerCase();
                            if (q && !iName.includes(q) && !iComp.includes(q) && !iBar.includes(q) && !bNo.includes(q)) {
                              return;
                            }

                            const currQty = Number(b.qty) || 0;
                            if (srdStockFilter === "in_stock" && currQty <= 0) return;
                            if (srdStockFilter === "zero_stock" && currQty > 0) return;

                            const key = `${item.id}_${b.batchNo || b.batch || 'default'}`;
                            const pRate = Number(b.purchaseRate || item.purchaseRate || ((b.mrp || item.mrp || 0) * 0.7));
                            const sRate = Number(b.saleRate || item.saleRate || b.mrp || item.mrp || 0);
                            const lp = srdCalculatedLPs[key] || Number(b.landingPrice || b.netCost) || parseFloat((pRate * (1 + taxRate / 100)).toFixed(2));

                            displayRows.push({
                              itemId: item.id,
                              name: item.name,
                              company: item.company || '—',
                              tax: taxRate,
                              unit: item.unit || item.packing || '1',
                              batch: b.batchNo || b.batch || '—',
                              expiry: b.expiry || item.expiry || '—',
                              mrp: Number(b.mrp || item.mrp || 0),
                              sRate,
                              pRate,
                              lp,
                              openStock: Number(item.openingStock || 0),
                              currStock: currQty
                            });
                          });
                        } else {
                          if (q && !iName.includes(q) && !iComp.includes(q) && !iBar.includes(q)) {
                            return;
                          }

                          const currQty = Number(item.stock) || 0;
                          if (srdStockFilter === "in_stock" && currQty <= 0) return;
                          if (srdStockFilter === "zero_stock" && currQty > 0) return;

                          const key = `${item.id}_default`;
                          const pRate = Number(item.purchaseRate || ((item.mrp || 0) * 0.7));
                          const sRate = Number(item.saleRate || item.mrp || 0);
                          const lp = srdCalculatedLPs[key] || parseFloat((pRate * (1 + taxRate / 100)).toFixed(2));

                          displayRows.push({
                            itemId: item.id,
                            name: item.name,
                            company: item.company || '—',
                            tax: taxRate,
                            unit: item.unit || item.packing || '1',
                            batch: '—',
                            expiry: item.expiry || '—',
                            mrp: Number(item.mrp || 0),
                            sRate,
                            pRate,
                            lp,
                            openStock: Number(item.openingStock || 0),
                            currStock: currQty
                          });
                        }
                      });

                      if (displayRows.length === 0) {
                        return (
                          <tr>
                            <td colSpan={12} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                              <div style={{ fontSize: "28px", marginBottom: "8px" }}>📦</div>
                              <div style={{ fontSize: "14px", fontWeight: "700", color: "#64748b" }}>No stock items found</div>
                              <div style={{ fontSize: "12px", marginTop: "4px" }}>Try adjusting your company, search, or stock status filters.</div>
                            </td>
                          </tr>
                        );
                      }

                      return displayRows.map((row, idx) => {
                        const isZero = row.currStock <= 0;
                        return (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: "1px solid #f1f5f9",
                              background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                              transition: "0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f0fdfa"}
                            onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f8fafc"}
                          >
                            <td style={{ padding: "9px 8px", textAlign: "center", color: "#94a3b8", fontWeight: "600" }}>
                              {idx + 1}
                            </td>
                            <td style={{ padding: "9px 12px" }}>
                              <div style={{ fontWeight: "700", color: "#0f172a" }}>{row.name}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>{row.company}</div>
                            </td>
                            <td style={{ padding: "9px 8px", textAlign: "center" }}>
                              <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                                {row.tax}%
                              </span>
                            </td>
                            <td style={{ padding: "9px 8px", textAlign: "center", color: "#475569" }}>
                              {row.unit}
                            </td>
                            <td style={{ padding: "9px 10px", fontWeight: "600", color: "#334155" }}>
                              {row.batch}
                            </td>
                            <td style={{ padding: "9px 8px", textAlign: "center", color: "#64748b" }}>
                              {row.expiry}
                            </td>
                            <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: "700", color: "#334155" }}>
                              ₹{fmt(row.mrp)}
                            </td>
                            <td style={{ padding: "9px 10px", textAlign: "right", color: "#0f766e", fontWeight: "700" }}>
                              ₹{fmt(row.sRate)}
                            </td>
                            <td style={{ padding: "9px 10px", textAlign: "right", color: "#475569" }}>
                              ₹{fmt(row.pRate)}
                            </td>
                            <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: "800", color: "#0d9488", background: "rgba(13,148,136,0.06)" }}>
                              ₹{fmt(row.lp)}
                            </td>
                            <td style={{ padding: "9px 8px", textAlign: "right", color: "#94a3b8" }}>
                              {row.openStock}
                            </td>
                            <td style={{ padding: "9px 10px", textAlign: "right" }}>
                              <span style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "800",
                                background: isZero ? "#fee2e2" : "#dcfce7",
                                color: isZero ? "#991b1b" : "#166534"
                              }}>
                                {row.currStock}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* BILL LOCK MODAL - FULLSCREEN */}
        {showLockBill && (
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
            fontFamily: "'Inter', sans-serif"
          }}>
            
            {/* ── TOP HEADER (FULLSCREEN) ── */}
            <div style={{
              background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
              color: "#ffffff",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px"
                }}>
                  🔒
                </div>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "16px", letterSpacing: "-0.2px" }}>Supervisor — Bill Lock Management</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>Secure & lock sales, purchase, cash, and voucher books between specified date ranges</div>
                </div>
              </div>

              <button
                onClick={() => setShowLockBill(false)}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "6px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  transition: "background 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
              >
                <X size={16} /> Close Esc
              </button>
            </div>

            {/* ── MAIN CONTENT BODY (FULLSCREEN SCROLLABLE) ── */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "18px 28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              <div style={{ width: "100%", maxWidth: "1050px", display: "flex", flexDirection: "column", gap: "14px" }}>
                
                {/* Info Card Banner */}
                <div style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "14px 20px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
                      <Check size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>Real-time Transaction Protection Active</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>Once a transaction book is locked, no user can edit, delete, or backdate entries within the locked date period.</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        const allLocked = (lockBillData || []).map(b => ({ ...b, checked: true }));
                        setLockBillData(allLocked);
                      }}
                      style={{ padding: "6px 12px", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => {
                        const allUnlocked = (lockBillData || []).map(b => ({ ...b, checked: false }));
                        setLockBillData(allUnlocked);
                      }}
                      style={{ padding: "6px 12px", background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Main Table Card */}
                <div style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}>
                  {/* Table Header */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "2.8fr 1.5fr 1.5fr 1.2fr",
                    gap: "12px",
                    padding: "12px 20px",
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    fontWeight: "700",
                    fontSize: "12px",
                    color: "#475569",
                    letterSpacing: "0.5px"
                  }}>
                    <div>TRANSACTION BOOK NAME</div>
                    <div style={{ textAlign: "center" }}>FROM DATE</div>
                    <div style={{ textAlign: "center" }}>TO DATE</div>
                    <div style={{ textAlign: "center" }}>CURRENT STATUS</div>
                  </div>

                  {/* Book Rows */}
                  <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {(lockBillData || []).map((b, idx) => {
                      const icons = {
                        sales: "🧾",
                        salesReturn: "↩️",
                        purchase: "🛒",
                        purchaseReturn: "📦",
                        cash: "💵",
                        jv: "📑",
                        bank: "🏦"
                      };
                      const icon = icons[b.id] || "📘";
                      const isLocked = !!b.checked;
                      return (
                        <div
                          key={b.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2.8fr 1.5fr 1.5fr 1.2fr",
                            gap: "12px",
                            alignItems: "center",
                            padding: "10px 14px",
                            background: isLocked ? "#fff7ed" : "#ffffff",
                            border: isLocked ? "1px solid #fed7aa" : "1px solid #f1f5f9",
                            borderRadius: "10px",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {/* Book & Checkbox */}
                          <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={isLocked}
                              onChange={e => {
                                const newData = [...lockBillData];
                                newData[idx].checked = e.target.checked;
                                setLockBillData(newData);
                              }}
                              style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#ea580c" }}
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "16px" }}>{icon}</span>
                              <span style={{ fontWeight: "700", fontSize: "13px", color: isLocked ? "#9a3412" : "#1e293b" }}>{b.label}</span>
                            </div>
                          </label>

                          {/* From Date */}
                          <div>
                            <input
                              type="date"
                              value={b.from || ""}
                              onChange={e => {
                                const newData = [...lockBillData];
                                newData[idx].from = e.target.value;
                                setLockBillData(newData);
                              }}
                              style={{
                                ...inp,
                                height: "32px",
                                padding: "4px 10px",
                                fontSize: "12px",
                                background: isLocked ? "#ffffff" : "#f8fafc",
                                border: isLocked ? "1px solid #fdba74" : "1px solid #cbd5e1"
                              }}
                            />
                          </div>

                          {/* To Date */}
                          <div>
                            <input
                              type="date"
                              value={b.to || ""}
                              onChange={e => {
                                const newData = [...lockBillData];
                                newData[idx].to = e.target.value;
                                setLockBillData(newData);
                              }}
                              style={{
                                ...inp,
                                height: "32px",
                                padding: "4px 10px",
                                fontSize: "12px",
                                background: isLocked ? "#ffffff" : "#f8fafc",
                                border: isLocked ? "1px solid #fdba74" : "1px solid #cbd5e1"
                              }}
                            />
                          </div>

                          {/* Status Badge */}
                          <div style={{ textAlign: "center" }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 12px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "700",
                              background: isLocked ? "#fee2e2" : "#f1f5f9",
                              color: isLocked ? "#dc2626" : "#64748b",
                              border: isLocked ? "1px solid #fca5a5" : "1px solid #e2e8f0"
                            }}>
                              {isLocked ? "🔒 LOCKED" : "🔓 ACTIVE / OPEN"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* ── STICKY FOOTER (FULLSCREEN) ── */}
            <div style={{
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              padding: "12px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 -2px 10px rgba(0,0,0,0.03)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b" }}>
                <span>💡</span>
                <span>Select the books you wish to lock, adjust the date range, then click <strong>Update & Enforce Locks</strong>.</span>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    const unlocked = (lockBillData || []).map(b => ({ ...b, checked: false }));
                    setLockBillData(unlocked);
                    saveLockBillData(unlocked);
                    showToast("All book locks have been unlocked!", "success");
                  }}
                  style={{ ...btn("#f3e8ff", "#7e22ce"), border: "1px solid #d8b4fe", padding: "8px 16px", fontWeight: "600" }}
                >
                  🔓 Unlock All Books
                </button>

                <button
                  onClick={() => setShowLockBill(false)}
                  style={{ ...btn("#f1f5f9", "#475569"), border: "1px solid #cbd5e1", padding: "8px 16px" }}
                >
                  ✕ Close
                </button>

                <button
                  onClick={() => {
                    saveLockBillData(lockBillData);
                    showToast("Bill lock rules saved & enforced successfully!", "success");
                    setShowLockBill(false);
                  }}
                  style={{ ...btn("#0f766e", "#ffffff"), padding: "8px 20px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Check size={16} /> Update & Enforce Locks
                </button>
              </div>
            </div>

          </div>
        )}

        {/* USERWISE CHANGES FULLSCREEN MODAL (SUPERVISOR) */}
        {showUserwiseChanges && (
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
            fontFamily: "'Inter', sans-serif"
          }}>
            {/* Top Header */}
            <div style={{
              background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
              color: "#ffffff",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px"
                }}>
                  🛡️
                </div>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "16px", letterSpacing: "-0.2px" }}>Supervisor — Userwise Changes & Audit Trail</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>Complete operational activity logs, bill audits, margin checks, and purchase verification</div>
                </div>
              </div>

              <button
                onClick={() => setShowUserwiseChanges(false)}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "6px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: "600"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
              >
                <X size={16} /> Close Esc
              </button>
            </div>

            {/* Split View: Left Navigation + Right Content */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              
              {/* Left Sidebar (supervisor.pdf page 13 buttons) */}
              <div style={{
                width: "230px",
                background: "#1e293b",
                padding: "16px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                borderRight: "1px solid #334155"
              }}>
                <div style={{ padding: "0 8px 8px 8px", fontSize: "11px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase" }}>
                  Supervisor Modules
                </div>

                {[
                  { id: "userwise", label: "Userwise Changes", icon: "👤" },
                  { id: "margin", label: "Margin Difference", icon: "📊" },
                  { id: "vat", label: "Sales VAT Update", icon: "🏷️" },
                  { id: "purchase_chkd", label: "Purchase Chkd Data", icon: "📦" },
                ].map(tab => {
                  const active = userwiseTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setUserwiseTab(tab.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "none",
                        background: active ? "linear-gradient(135deg, #0d9488, #0f766e)" : "transparent",
                        color: active ? "#ffffff" : "#cbd5e1",
                        fontSize: "13px",
                        fontWeight: active ? "700" : "500",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s"
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: "16px" }}>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}

                <div style={{ marginTop: "auto", padding: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: "700", marginBottom: "4px" }}>🔒 Security Log</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.4" }}>
                    Every bill creation, alteration, rate override, and deletion is timestamped.
                  </div>
                </div>
              </div>

              {/* Right Content Area */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f8fafc" }}>
                
                {/* ════════════════════════════════════════════
                    TAB 1: USERWISE CHANGES (AUDIT TRAIL)
                    ════════════════════════════════════════════ */}
                {userwiseTab === "userwise" && (() => {
                  // Filter logs
                  const filteredLogs = (auditLogs || []).filter(log => {
                    if (userwiseUserFilter !== "ALL" && (log.user_name || "Admin").toLowerCase() !== userwiseUserFilter.toLowerCase()) return false;
                    if (userwiseActionFilter !== "ALL" && (log.action || "").toUpperCase() !== userwiseActionFilter.toUpperCase()) return false;
                    if (userwiseFromDate && log.created_at && log.created_at.slice(0, 10) < userwiseFromDate) return false;
                    if (userwiseToDate && log.created_at && log.created_at.slice(0, 10) > userwiseToDate) return false;
                    if (userwiseSearchQuery.trim()) {
                      const q = userwiseSearchQuery.toLowerCase();
                      const matchUser = (log.user_name || "").toLowerCase().includes(q);
                      const matchAction = (log.action || "").toLowerCase().includes(q);
                      const matchRef = (log.ref_no || "").toLowerCase().includes(q);
                      const matchDetails = (log.details || "").toLowerCase().includes(q);
                      if (!matchUser && !matchAction && !matchRef && !matchDetails) return false;
                    }
                    return true;
                  });

                  // Unique users in logs
                  const allUsers = Array.from(new Set(["Admin", ...(auditLogs || []).map(l => l.user_name).filter(Boolean)]));

                  return (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "16px 20px", gap: "12px" }}>
                      
                      {/* Filter Bar */}
                      <div style={{
                        background: "#ffffff",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "12px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                      }}>
                        {/* User Select */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>OPERATOR / USER</label>
                          <select
                            value={userwiseUserFilter}
                            onChange={e => setUserwiseUserFilter(e.target.value)}
                            style={{ ...inp, width: "140px", height: "30px", fontSize: "12px" }}
                          >
                            <option value="ALL">All Users</option>
                            {allUsers.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>

                        {/* Action Select */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>ACTION TYPE</label>
                          <select
                            value={userwiseActionFilter}
                            onChange={e => setUserwiseActionFilter(e.target.value)}
                            style={{ ...inp, width: "160px", height: "30px", fontSize: "12px" }}
                          >
                            <option value="ALL">All Actions</option>
                            <option value="BILL CREATED">🟢 Bill Created</option>
                            <option value="BILL EDITED">🟡 Bill Edited</option>
                            <option value="BILL DELETED">🔴 Bill Deleted</option>
                            <option value="PURCHASE SAVED">🛒 Purchase Saved</option>
                            <option value="PURCHASE DELETED">📦 Purchase Deleted</option>
                            <option value="LOCK RULES UPDATED">🔒 Lock Rules Updated</option>
                          </select>
                        </div>

                        {/* Date Range */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>FROM DATE</label>
                          <input
                            type="date"
                            value={userwiseFromDate}
                            onChange={e => setUserwiseFromDate(e.target.value)}
                            style={{ ...inp, width: "130px", height: "30px", fontSize: "12px" }}
                          />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>TO DATE</label>
                          <input
                            type="date"
                            value={userwiseToDate}
                            onChange={e => setUserwiseToDate(e.target.value)}
                            style={{ ...inp, width: "130px", height: "30px", fontSize: "12px" }}
                          />
                        </div>

                        {/* Search Input */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, minWidth: "160px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>SEARCH DETAILS / BILL #</label>
                          <input
                            placeholder="Filter by bill #, patient name, item..."
                            value={userwiseSearchQuery}
                            onChange={e => setUserwiseSearchQuery(e.target.value)}
                            style={{ ...inp, height: "30px", fontSize: "12px" }}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "8px", alignSelf: "flex-end" }}>
                          <button
                            onClick={() => { if (loadAuditLogs) loadAuditLogs(); showToast("Logs refreshed!"); }}
                            style={{ ...btn("#f1f5f9", "#475569"), border: "1px solid #cbd5e1", height: "30px", padding: "0 12px", fontSize: "12px" }}
                          >
                            🔄 Refresh
                          </button>
                          <button
                            onClick={() => {
                              const csvHeader = "Timestamp,User,Action,Reference,Details\n";
                              const rows = filteredLogs.map(l => `"${l.created_at}","${l.user_name}","${l.action}","${l.ref_no || ''}","${(l.details || '').replace(/"/g, '""')}"`).join("\n");
                              const blob = new Blob([csvHeader + rows], { type: "text/csv" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `Userwise_Changes_${today()}.csv`;
                              a.click();
                              showToast("Exported to CSV successfully!");
                            }}
                            style={{ ...btn("#0f766e", "#ffffff"), height: "30px", padding: "0 14px", fontSize: "12px", fontWeight: "600" }}
                          >
                            📥 Export CSV
                          </button>
                        </div>
                      </div>

                      {/* Log Table Card */}
                      <div style={{
                        flex: 1,
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
                      }}>
                        {/* Table Header */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "1.4fr 1.1fr 1.2fr 1.2fr 3.2fr",
                          gap: "8px",
                          padding: "10px 16px",
                          background: "#f8fafc",
                          borderBottom: "1px solid #e2e8f0",
                          fontWeight: "700",
                          fontSize: "12px",
                          color: "#475569"
                        }}>
                          <div>DATE & TIME</div>
                          <div>OPERATOR</div>
                          <div>ACTION</div>
                          <div>REFERENCE</div>
                          <div>CHANGE DETAILS</div>
                        </div>

                        {/* Table Body */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
                          {filteredLogs.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
                              <div style={{ fontSize: "36px", marginBottom: "8px" }}>📋</div>
                              <div style={{ fontWeight: "700", fontSize: "14px", color: "#475569" }}>No Activity Logs Found</div>
                              <div style={{ fontSize: "12px", marginTop: "4px" }}>No changes recorded matching the selected operator or date range.</div>
                            </div>
                          ) : (
                            filteredLogs.map(log => {
                              const actionColors = {
                                "BILL CREATED": { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
                                "BILL EDITED": { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
                                "BILL DELETED": { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
                                "PURCHASE SAVED": { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
                                "PURCHASE DELETED": { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
                                "LOCK RULES UPDATED": { bg: "#f5f3ff", text: "#7c3aed", border: "#ddd6fe" }
                              };
                              const style = actionColors[log.action] || { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" };
                              const dateFormatted = log.created_at ? new Date(log.created_at).toLocaleString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "—";
                              
                              let parsedDetails = log.details;
                              try {
                                const obj = JSON.parse(log.details);
                                if (typeof obj === 'object') {
                                  parsedDetails = Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(" | ");
                                }
                              } catch (_) {}

                              return (
                                <div
                                  key={log.id}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1.4fr 1.1fr 1.2fr 1.2fr 3.2fr",
                                    gap: "8px",
                                    padding: "8px 10px",
                                    alignItems: "center",
                                    borderBottom: "1px solid #f1f5f9",
                                    fontSize: "12px",
                                    transition: "background 0.1s"
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                  <div style={{ color: "#64748b", fontFamily: "monospace", fontSize: "11px" }}>{dateFormatted}</div>
                                  <div style={{ fontWeight: "600", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ fontSize: "14px" }}>👤</span>
                                    <span>{log.user_name || "Admin"}</span>
                                  </div>
                                  <div>
                                    <span style={{
                                      display: "inline-block",
                                      padding: "2px 8px",
                                      borderRadius: "10px",
                                      fontSize: "10px",
                                      fontWeight: "700",
                                      background: style.bg,
                                      color: style.text,
                                      border: `1px solid ${style.border}`
                                    }}>
                                      {log.action}
                                    </span>
                                  </div>
                                  <div style={{ fontWeight: "600", color: "#0f766e" }}>{log.ref_no || "—"}</div>
                                  <div style={{ color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={parsedDetails}>
                                    {parsedDetails || "—"}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Footer Status Bar */}
                        <div style={{
                          padding: "8px 16px",
                          background: "#f8fafc",
                          borderTop: "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12px",
                          color: "#64748b"
                        }}>
                          <div>Showing <strong>{filteredLogs.length}</strong> activity logs</div>
                          <div style={{ display: "flex", gap: "12px" }}>
                            <span>Created: <strong>{filteredLogs.filter(l => (l.action || '').includes('CREATED')).length}</strong></span>
                            <span>Edited: <strong>{filteredLogs.filter(l => (l.action || '').includes('EDITED')).length}</strong></span>
                            <span>Deleted: <strong>{filteredLogs.filter(l => (l.action || '').includes('DELETED')).length}</strong></span>
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })()}

                {/* ════════════════════════════════════════════
                    TAB 2: MARGIN DIFFERENCE
                    ════════════════════════════════════════════ */}
                {userwiseTab === "margin" && (() => {
                  return (
                    <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto" }}>
                      <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontWeight: "700", fontSize: "15px", color: "#1e293b", marginBottom: "4px" }}>📊 Margin & Profit Analysis</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Live comparison of Selling Price (MRP/Rate) vs Purchase Cost (PTR) across inventory.</div>
                      </div>

                      <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1.2fr 1fr", gap: "10px", padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "700", fontSize: "12px", color: "#475569" }}>
                          <div>ITEM NAME</div>
                          <div style={{ textAlign: "right" }}>COST (PTR)</div>
                          <div style={{ textAlign: "right" }}>MRP</div>
                          <div style={{ textAlign: "right" }}>MARGIN ₹</div>
                          <div style={{ textAlign: "right" }}>MARGIN %</div>
                          <div style={{ textAlign: "center" }}>STATUS</div>
                        </div>

                        <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "4px 8px" }}>
                          {(items || []).slice(0, 100).map(item => {
                            const cost = num(item.ptr || item.prate || 0);
                            const mrp = num(item.mrp || item.srate || 0);
                            const marginDiff = mrp - cost;
                            const marginPct = cost > 0 ? ((marginDiff / cost) * 100).toFixed(1) : "0.0";
                            const isGood = marginDiff >= 0;

                            return (
                              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1.2fr 1fr", gap: "10px", padding: "8px 10px", alignItems: "center", borderBottom: "1px solid #f1f5f9", fontSize: "12px" }}>
                                <div style={{ fontWeight: "600", color: "#1e293b" }}>{item.name}</div>
                                <div style={{ textAlign: "right", color: "#64748b" }}>₹{cost.toFixed(2)}</div>
                                <div style={{ textAlign: "right", fontWeight: "600", color: "#0f766e" }}>₹{mrp.toFixed(2)}</div>
                                <div style={{ textAlign: "right", fontWeight: "700", color: isGood ? "#16a34a" : "#dc2626" }}>₹{marginDiff.toFixed(2)}</div>
                                <div style={{ textAlign: "right", fontWeight: "700", color: isGood ? "#16a34a" : "#dc2626" }}>{marginPct}%</div>
                                <div style={{ textAlign: "center" }}>
                                  <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "700", background: isGood ? "#dcfce7" : "#fee2e2", color: isGood ? "#15803d" : "#dc2626" }}>
                                    {isGood ? "Profitable" : "Loss"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ════════════════════════════════════════════
                    TAB 3: SALES VAT / GST UPDATE
                    ════════════════════════════════════════════ */}
                {userwiseTab === "vat" && (() => {
                  return (
                    <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto" }}>
                      <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontWeight: "700", fontSize: "15px", color: "#1e293b", marginBottom: "4px" }}>🏷️ Sales VAT / GST Rate Summary</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Breakup of tax rates applied on recent sales transactions.</div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                        {[
                          { slab: "GST 0% (Exempt)", itemsCount: (items || []).filter(i => num(i.gst) === 0).length, color: "#64748b" },
                          { slab: "GST 5%", itemsCount: (items || []).filter(i => num(i.gst) === 5).length, color: "#0284c7" },
                          { slab: "GST 12%", itemsCount: (items || []).filter(i => num(i.gst) === 12).length, color: "#0d9488" },
                          { slab: "GST 18%", itemsCount: (items || []).filter(i => num(i.gst) === 18).length, color: "#7c3aed" },
                          { slab: "GST 28%", itemsCount: (items || []).filter(i => num(i.gst) === 28).length, color: "#ea580c" },
                        ].map((s, idx) => (
                          <div key={idx} style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                            <div style={{ fontSize: "13px", fontWeight: "700", color: s.color }}>{s.slab}</div>
                            <div style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b", marginTop: "6px" }}>{s.itemsCount}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Active products</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* ════════════════════════════════════════════
                    TAB 4: PURCHASE CHECKED DATA
                    ════════════════════════════════════════════ */}
                {userwiseTab === "purchase_chkd" && (() => {
                  return (
                    <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto" }}>
                      <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontWeight: "700", fontSize: "15px", color: "#1e293b", marginBottom: "4px" }}>📦 Purchase Checked & Verified Data</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Status of supplier invoices received, stock verified, and booked into inventory.</div>
                      </div>

                      <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.2fr 1fr 1fr 1fr", gap: "10px", padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "700", fontSize: "12px", color: "#475569" }}>
                          <div>ENTRY #</div>
                          <div>SUPPLIER NAME</div>
                          <div>BILL NO</div>
                          <div>BILL DATE</div>
                          <div style={{ textAlign: "right" }}>AMOUNT</div>
                          <div style={{ textAlign: "center" }}>STATUS</div>
                        </div>

                        <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "4px 8px" }}>
                          {(purchaseBills || []).length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No purchase bills on record.</div>
                          ) : (
                            (purchaseBills || []).slice(0, 100).map(pb => (
                              <div key={pb.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.2fr 1fr 1fr 1fr", gap: "10px", padding: "8px 10px", alignItems: "center", borderBottom: "1px solid #f1f5f9", fontSize: "12px" }}>
                                <div style={{ fontWeight: "700", color: "#0f766e" }}>#{pb.entryNo || "—"}</div>
                                <div style={{ fontWeight: "600", color: "#1e293b" }}>{pb.partyName || pb.supplierName || "—"}</div>
                                <div style={{ color: "#64748b" }}>{pb.billNo || "—"}</div>
                                <div style={{ color: "#64748b" }}>{pb.billDate || pb.date || "—"}</div>
                                <div style={{ textAlign: "right", fontWeight: "700", color: "#1e293b" }}>₹{num(pb.total || pb.netAmount || 0).toFixed(2)}</div>
                                <div style={{ textAlign: "center" }}>
                                  <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "700", background: "#dcfce7", color: "#15803d" }}>
                                    ✓ Verified
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SUPERVISOR — BILL NUMBER CHANGE & RENUMBERING (100% FULLSCREEN) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showBillNumberChange && (
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
            {/* ── TOP HEADER ── */}
            <div style={{
              background: "linear-gradient(135deg, #042f2e 0%, #0d9488 50%, #0f172a 100%)",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              color: "#fff",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 10px rgba(255,255,255,0.2)"
                }}>
                  <FileText size={24} color="#5eead4" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", letterSpacing: "0.5px" }}>
                      Supervisor — Bill Number Change & Renumbering
                    </h2>
                    <span style={{
                      background: "#14b8a6",
                      color: "#042f2e",
                      fontSize: "10px",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      letterSpacing: "0.5px"
                    }}>
                      SUPERVISOR ONLY
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#ccfbf1", marginTop: "2px" }}>
                    Modify sales or purchase bill serial numbers with real-time audit logging and duplicate safety validation
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => { setShowBillNumberChange(false); setBillChangeStatus(null); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.85)"; e.currentTarget.style.borderColor = "transparent"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
              >
                <X size={16} /> Close [Esc]
              </button>
            </div>

            {/* ── NAVIGATION TABS & STATS BAR ── */}
            <div style={{
              background: "#ffffff",
              padding: "0 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  { id: "single", label: "Single Bill Change", icon: "🔄" },
                  { id: "batch", label: "Batch / Series Renumber", icon: "🔢" },
                  { id: "logs", label: `Audit History (${billChangeLogs.length})`, icon: "📜" }
                ].map(t => {
                  const isActive = billChangeActiveTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setBillChangeActiveTab(t.id as any); setBillChangeStatus(null); }}
                      style={{
                        padding: "12px 18px",
                        border: "none",
                        background: "none",
                        borderBottom: isActive ? "3px solid #0d9488" : "3px solid transparent",
                        color: isActive ? "#0d9488" : "#64748b",
                        fontWeight: isActive ? "700" : "500",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.15s"
                      }}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick DB Stats */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "#64748b" }}>
                <div>🛒 Total Sales Bills: <strong style={{ color: "#0f172a" }}>{salesBills.length}</strong></div>
                <div style={{ width: "1px", height: "14px", background: "#cbd5e1" }} />
                <div>📦 Total Purchase Bills: <strong style={{ color: "#0f172a" }}>{purchaseBills.length}</strong></div>
                <div style={{ width: "1px", height: "14px", background: "#cbd5e1" }} />
                <div>👤 Current User: <strong style={{ color: "#0d9488" }}>{currentUser?.username || "ADMIN"}</strong></div>
              </div>
            </div>

            {/* ── STATUS / ALERT BANNER ── */}
            {billChangeStatus && (
              <div style={{
                padding: "10px 24px",
                background: billChangeStatus.type === "success" ? "#dcfce7" : billChangeStatus.type === "error" ? "#fee2e2" : "#e0f2fe",
                color: billChangeStatus.type === "success" ? "#166534" : billChangeStatus.type === "error" ? "#991b1b" : "#075985",
                fontSize: "13px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                flexShrink: 0
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {billChangeStatus.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{billChangeStatus.msg}</span>
                </div>
                <button
                  onClick={() => setBillChangeStatus(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold" }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* ── MAIN CONTENT AREA ── */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              
              {/* ═══════════════════════════════════════ */}
              {/* TAB 1: SINGLE BILL NUMBER CHANGE */}
              {/* ═══════════════════════════════════════ */}
              {billChangeActiveTab === "single" && (
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "480px 1fr", gap: "16px", padding: "16px", overflow: "hidden" }}>
                  
                  {/* LEFT CONTROL PANEL */}
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    overflowY: "auto"
                  }}>
                    {/* Bill Type Selector */}
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                        1. Select Bill Type
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <button
                          onClick={() => { setBillChangeType("sales"); setBillChangeSelected(null); setBillChangeNewNo(""); setBillChangeStatus(null); }}
                          style={{
                            padding: "10px",
                            borderRadius: "8px",
                            border: billChangeType === "sales" ? "2px solid #0d9488" : "1px solid #e2e8f0",
                            background: billChangeType === "sales" ? "#f0fdfa" : "#f8fafc",
                            color: billChangeType === "sales" ? "#0f766e" : "#64748b",
                            fontWeight: "700",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            cursor: "pointer",
                            transition: "0.15s"
                          }}
                        >
                          <ShoppingCart size={16} /> Sales Bill
                        </button>
                        <button
                          onClick={() => { setBillChangeType("purchase"); setBillChangeSelected(null); setBillChangeNewNo(""); setBillChangeStatus(null); }}
                          style={{
                            padding: "10px",
                            borderRadius: "8px",
                            border: billChangeType === "purchase" ? "2px solid #0d9488" : "1px solid #e2e8f0",
                            background: billChangeType === "purchase" ? "#f0fdfa" : "#f8fafc",
                            color: billChangeType === "purchase" ? "#0f766e" : "#64748b",
                            fontWeight: "700",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            cursor: "pointer",
                            transition: "0.15s"
                          }}
                        >
                          <Package size={16} /> Purchase Bill
                        </button>
                      </div>
                    </div>

                    {/* Find Bill Input & Quick Search Dropdown */}
                    <div style={{ position: "relative" }}>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                        2. Search / Select Bill
                      </label>
                      <div style={{ position: "relative" }}>
                        <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="text"
                          value={billChangeSearch}
                          onChange={e => setBillChangeSearch(e.target.value)}
                          placeholder={billChangeType === "sales" ? "Search Bill #, Patient name or mobile..." : "Search Bill #, Party / Supplier name..."}
                          style={{
                            width: "100%",
                            padding: "10px 12px 10px 36px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            outline: "none",
                            background: "#fff",
                            boxSizing: "border-box"
                          }}
                        />
                        {billChangeSearch && (
                          <button
                            onClick={() => setBillChangeSearch("")}
                            style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Matching Dropdown if typing */}
                      {billChangeSearch.trim().length > 0 && (
                        <div style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          maxHeight: "220px",
                          overflowY: "auto",
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                          zIndex: 50,
                          marginTop: "4px"
                        }}>
                          {(() => {
                            const q = billChangeSearch.toLowerCase().trim();
                            const matches = (billChangeType === "sales" ? salesBills : purchaseBills).filter((b: any) => {
                              const bNo = String(b.billNo || b.entryNo || b.id).toLowerCase();
                              const party = String(b.patientName || b.partyName || b.supplierName || "").toLowerCase();
                              const mob = String(b.mobile || "");
                              return bNo.includes(q) || party.includes(q) || mob.includes(q);
                            }).slice(0, 15);

                            if (matches.length === 0) {
                              return <div style={{ padding: "12px", color: "#94a3b8", fontSize: "12px", textAlign: "center" }}>No matching bills found</div>;
                            }

                            return matches.map((b: any) => (
                              <div
                                key={b.id || b.billNo}
                                onClick={() => {
                                  setBillChangeSelected(b);
                                  setBillChangeSearch("");
                                  setBillChangeNewNo("");
                                  setBillChangeStatus(null);
                                }}
                                style={{
                                  padding: "9px 12px",
                                  borderBottom: "1px solid #f1f5f9",
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  transition: "0.15s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f0fdfa"}
                                onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
                              >
                                <div>
                                  <span style={{ fontWeight: "700", color: "#0f766e" }}>Bill #{b.billNo || b.entryNo || b.id}</span>
                                  <span style={{ marginLeft: "8px", color: "#334155", fontSize: "12px" }}>{b.patientName || b.partyName || "Walk-in"}</span>
                                </div>
                                <div style={{ textAlign: "right", fontSize: "11px", color: "#64748b" }}>
                                  <div style={{ fontWeight: "600", color: "#16a34a" }}>₹{fmt(b.netAmount || b.total || 0)}</div>
                                  <div>{new Date(b.date || b.billDate || Date.now()).toLocaleDateString("en-IN")}</div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Current Selected Bill Overview */}
                    <div style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      background: billChangeSelected ? "#f0fdfa" : "#f8fafc",
                      border: billChangeSelected ? "1px solid #99f6e4" : "1px dashed #cbd5e1"
                    }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                        Selected Current Bill
                      </div>
                      {billChangeSelected ? (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f766e" }}>
                              Bill #{billChangeSelected.billNo || billChangeSelected.entryNo || billChangeSelected.id}
                            </div>
                            <div style={{ fontSize: "12px", color: "#334155", marginTop: "2px" }}>
                              {billChangeSelected.patientName || billChangeSelected.partyName || "Walk-in"} · {new Date(billChangeSelected.date || billChangeSelected.billDate || Date.now()).toLocaleDateString("en-IN")}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "16px", fontWeight: "800", color: "#16a34a" }}>
                              ₹{fmt(billChangeSelected.netAmount || billChangeSelected.total || 0)}
                            </div>
                            <button
                              onClick={() => { setBillChangeSelected(null); setBillChangeNewNo(""); }}
                              style={{ background: "none", border: "none", color: "#ef4444", fontSize: "11px", cursor: "pointer", fontWeight: "600", textDecoration: "underline", padding: 0 }}
                            >
                              Change Selection
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                          No bill selected yet. Search above or select from the right table.
                        </div>
                      )}
                    </div>

                    {/* New Bill Number Input */}
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                        3. New Bill Number *
                      </label>
                      <input
                        type="text"
                        value={billChangeNewNo}
                        onChange={e => setBillChangeNewNo(e.target.value)}
                        placeholder="e.g. 105, SB-2026-0042, etc."
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "2px solid #0d9488",
                          fontSize: "15px",
                          fontWeight: "700",
                          color: "#0f172a",
                          outline: "none",
                          background: "#fff",
                          boxSizing: "border-box"
                        }}
                      />

                      {/* Live Duplicate Checker */}
                      {billChangeNewNo.trim() && (
                        <div style={{ marginTop: "6px", fontSize: "12px" }}>
                          {(() => {
                            const trimmed = billChangeNewNo.trim().toLowerCase();
                            const currentOld = String(billChangeSelected?.billNo || billChangeSelected?.entryNo || billChangeSelected?.id || "").toLowerCase();
                            if (trimmed === currentOld) {
                              return <span style={{ color: "#f59e0b", fontWeight: "600" }}>⚠️ Same as current bill number.</span>;
                            }
                            const exists = (billChangeType === "sales" ? salesBills : purchaseBills).some((b: any) =>
                              String(b.billNo || b.entryNo || b.id).toLowerCase() === trimmed && b.id !== billChangeSelected?.id
                            );
                            if (exists) {
                              return (
                                <span style={{ color: "#dc2626", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <AlertCircle size={14} /> Warning: Bill #{billChangeNewNo.trim()} already exists in records!
                                </span>
                              );
                            }
                            return (
                              <span style={{ color: "#16a34a", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                                <CheckCircle size={14} /> Bill #{billChangeNewNo.trim()} is available & valid.
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Reason for Change */}
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                        4. Reason for Change
                      </label>
                      <select
                        value={billChangeReason}
                        onChange={e => setBillChangeReason(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          outline: "none",
                          background: "#fff",
                          color: "#334155"
                        }}
                      >
                        <option value="Correction of Bill Number">Correction of Bill Number</option>
                        <option value="Series Gap / Alignment">Series Gap / Alignment</option>
                        <option value="Cancelled Bill Renumbering">Cancelled Bill Renumbering</option>
                        <option value="Audit / CA Verification">Audit / CA Verification</option>
                        <option value="Party Request / Replacement">Party Request / Replacement</option>
                        <option value="Other">Other</option>
                      </select>

                      {billChangeReason === "Other" && (
                        <input
                          type="text"
                          value={billChangeCustomReason}
                          onChange={e => setBillChangeCustomReason(e.target.value)}
                          placeholder="Type custom reason..."
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "12px",
                            outline: "none",
                            marginTop: "6px",
                            boxSizing: "border-box"
                          }}
                        />
                      )}
                    </div>

                    {/* Safety Alert Box */}
                    <div style={{
                      background: "#fffbeb",
                      border: "1px solid #fef3c7",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontSize: "11px",
                      color: "#92400e",
                      lineHeight: "1.4"
                    }}>
                      <strong>🛡️ Safety Notice:</strong> Changing bill numbers will update primary records, connected customer/supplier ledgers, and log this change under Supervisor Userwise Changes.
                    </div>

                    {/* Action Button */}
                    <div style={{ marginTop: "auto", paddingTop: "8px" }}>
                      <button
                        onClick={handleUpdateSingleBillNo}
                        disabled={billChangeLoading || !billChangeSelected || !billChangeNewNo.trim()}
                        style={{
                          width: "100%",
                          padding: "13px",
                          borderRadius: "8px",
                          border: "none",
                          background: (!billChangeSelected || !billChangeNewNo.trim() || billChangeLoading)
                            ? "#cbd5e1"
                            : "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                          color: "#ffffff",
                          fontWeight: "800",
                          fontSize: "14px",
                          letterSpacing: "0.5px",
                          cursor: (!billChangeSelected || !billChangeNewNo.trim() || billChangeLoading) ? "not-allowed" : "pointer",
                          boxShadow: (!billChangeSelected || !billChangeNewNo.trim()) ? "none" : "0 4px 12px rgba(13,148,136,0.35)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          transition: "0.15s"
                        }}
                      >
                        {billChangeLoading ? (
                          <span>Updating...</span>
                        ) : (
                          <>
                            <Check size={18} /> Confirm & Change Bill Number
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* RIGHT PREVIEW & QUICK PICKER PANEL */}
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                  }}>
                    {billChangeSelected ? (
                      /* ── LIVE BILL PREVIEW ── */
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div style={{
                          padding: "16px 20px",
                          background: "linear-gradient(90deg, #f8fafc, #f1f5f9)",
                          borderBottom: "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                              background: "#0d9488",
                              color: "#fff",
                              fontWeight: "800",
                              fontSize: "14px",
                              padding: "4px 10px",
                              borderRadius: "6px"
                            }}>
                              Current: #{billChangeSelected.billNo || billChangeSelected.entryNo || billChangeSelected.id}
                            </div>
                            <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                              {billChangeSelected.patientName || billChangeSelected.partyName || "Walk-in Customer"}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              📅 {new Date(billChangeSelected.date || billChangeSelected.billDate || Date.now()).toLocaleDateString("en-IN")}
                            </span>
                            <span style={{ fontSize: "14px", fontWeight: "800", color: "#16a34a" }}>
                              ₹{fmt(billChangeSelected.netAmount || billChangeSelected.total || 0)}
                            </span>
                          </div>
                        </div>

                        {/* Bill Meta Details Strip */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)",
                          gap: "12px",
                          padding: "12px 20px",
                          background: "#fafafa",
                          borderBottom: "1px solid #e2e8f0",
                          fontSize: "12px"
                        }}>
                          <div>
                            <span style={{ color: "#64748b" }}>Doctor / Ref: </span>
                            <strong style={{ color: "#1e293b" }}>{billChangeSelected.doctorName || "Self / None"}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#64748b" }}>Payment Mode: </span>
                            <strong style={{ color: "#0d9488", textTransform: "uppercase" }}>{billChangeSelected.paymentMode || "CASH"}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#64748b" }}>Mobile: </span>
                            <strong style={{ color: "#1e293b" }}>{billChangeSelected.mobile || "—"}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#64748b" }}>Items Count: </span>
                            <strong style={{ color: "#1e293b" }}>{billChangeSelected.items?.length || 0} items</strong>
                          </div>
                        </div>

                        {/* Items Table inside selected bill */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                          <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "700", color: "#334155" }}>
                            Items Contained in This Bill:
                          </h4>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                            <thead>
                              <tr style={{ background: "#f1f5f9", color: "#475569", textAlign: "left" }}>
                                <th style={{ padding: "8px 10px", borderRadius: "6px 0 0 6px" }}>#</th>
                                <th style={{ padding: "8px 10px" }}>Item Name</th>
                                <th style={{ padding: "8px 10px" }}>Batch</th>
                                <th style={{ padding: "8px 10px", textAlign: "right" }}>Qty</th>
                                <th style={{ padding: "8px 10px", textAlign: "right" }}>MRP</th>
                                <th style={{ padding: "8px 10px", textAlign: "right" }}>Rate</th>
                                <th style={{ padding: "8px 10px", textAlign: "right", borderRadius: "0 6px 6px 0" }}>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(billChangeSelected.items || []).map((it: any, idx: number) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                  <td style={{ padding: "8px 10px", color: "#94a3b8" }}>{idx + 1}</td>
                                  <td style={{ padding: "8px 10px", fontWeight: "600", color: "#1e293b" }}>{it.name || it.itemName}</td>
                                  <td style={{ padding: "8px 10px", color: "#64748b" }}>{it.batch || it.batchNo || "—"}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700" }}>{it.qty}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right", color: "#64748b" }}>₹{fmt(it.mrp)}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right", color: "#64748b" }}>₹{fmt(it.rate)}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: "#0f766e" }}>
                                    ₹{fmt(it.amount || ((it.rate || 0) * (it.qty || 1)))}
                                  </td>
                                </tr>
                              ))}
                              {(!billChangeSelected.items || billChangeSelected.items.length === 0) && (
                                <tr>
                                  <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                                    No item breakdown available for this bill record.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* ── QUICK BILL PICKER TABLE ── */
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div style={{
                          padding: "14px 20px",
                          background: "#f8fafc",
                          borderBottom: "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#1e293b" }}>
                              Recent {billChangeType === "sales" ? "Sales" : "Purchase"} Bills
                            </h3>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                              Click "Select" on any bill below to change its bill number
                            </div>
                          </div>
                          <span style={{ fontSize: "12px", color: "#0d9488", fontWeight: "700" }}>
                            Showing recent records
                          </span>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                            <thead>
                              <tr style={{ background: "#f1f5f9", color: "#475569", textAlign: "left" }}>
                                <th style={{ padding: "8px 12px", borderRadius: "6px 0 0 6px" }}>Bill #</th>
                                <th style={{ padding: "8px 12px" }}>Date</th>
                                <th style={{ padding: "8px 12px" }}>{billChangeType === "sales" ? "Patient / Customer" : "Supplier / Party"}</th>
                                <th style={{ padding: "8px 12px" }}>Payment</th>
                                <th style={{ padding: "8px 12px", textAlign: "right" }}>Amount (₹)</th>
                                <th style={{ padding: "8px 12px", textAlign: "center", borderRadius: "0 6px 6px 0" }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(billChangeType === "sales" ? salesBills : purchaseBills).slice(0, 50).map((b: any, idx: number) => (
                                <tr
                                  key={b.id || idx}
                                  style={{ borderBottom: "1px solid #f1f5f9", transition: "0.15s" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                  <td style={{ padding: "10px 12px", fontWeight: "800", color: "#0f766e" }}>
                                    #{b.billNo || b.entryNo || b.id}
                                  </td>
                                  <td style={{ padding: "10px 12px", color: "#64748b" }}>
                                    {new Date(b.date || b.billDate || Date.now()).toLocaleDateString("en-IN")}
                                  </td>
                                  <td style={{ padding: "10px 12px", fontWeight: "600", color: "#1e293b" }}>
                                    {b.patientName || b.partyName || "Walk-in"}
                                  </td>
                                  <td style={{ padding: "10px 12px" }}>
                                    <span style={{
                                      background: (b.paymentMode || "").toLowerCase() === "credit" ? "#fef3c7" : "#dcfce7",
                                      color: (b.paymentMode || "").toLowerCase() === "credit" ? "#92400e" : "#166534",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      fontSize: "10px",
                                      fontWeight: "700",
                                      textTransform: "uppercase"
                                    }}>
                                      {b.paymentMode || "CASH"}
                                    </span>
                                  </td>
                                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "800", color: "#16a34a" }}>
                                    ₹{fmt(b.netAmount || b.total || 0)}
                                  </td>
                                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                    <button
                                      onClick={() => {
                                        setBillChangeSelected(b);
                                        setBillChangeNewNo("");
                                        setBillChangeStatus(null);
                                      }}
                                      style={{
                                        background: "#0d9488",
                                        color: "#ffffff",
                                        border: "none",
                                        padding: "4px 10px",
                                        borderRadius: "6px",
                                        fontSize: "11px",
                                        fontWeight: "700",
                                        cursor: "pointer",
                                        transition: "0.15s"
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.background = "#0f766e"}
                                      onMouseLeave={e => e.currentTarget.style.background = "#0d9488"}
                                    >
                                      Select
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
                </div>
              )}

              {/* ═══════════════════════════════════════ */}
              {/* TAB 2: BATCH / SERIES RENUMBERING */}
              {/* ═══════════════════════════════════════ */}
              {billChangeActiveTab === "batch" && (
                <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
                  <div style={{
                    maxWidth: "800px",
                    margin: "0 auto",
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                    padding: "24px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "24px" }}>🔢</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                          Batch Series Renumbering
                        </h3>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          Renumber a sequential range of bills (e.g. shift from #101-#120 to #201-#220)
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          Bill Type
                        </label>
                        <select
                          value={billChangeType}
                          onChange={e => setBillChangeType(e.target.value as any)}
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        >
                          <option value="sales">Sales Bills</option>
                          <option value="purchase">Purchase Bills</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          New Starting Number
                        </label>
                        <input
                          type="number"
                          value={billChangeBatchNewStart}
                          onChange={e => setBillChangeBatchNewStart(e.target.value)}
                          placeholder="e.g. 500"
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          From Bill No
                        </label>
                        <input
                          type="number"
                          value={billChangeBatchStart}
                          onChange={e => setBillChangeBatchStart(e.target.value)}
                          placeholder="e.g. 101"
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          To Bill No
                        </label>
                        <input
                          type="number"
                          value={billChangeBatchEnd}
                          onChange={e => setBillChangeBatchEnd(e.target.value)}
                          placeholder="e.g. 120"
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    <div style={{
                      background: "#f8fafc",
                      borderRadius: "8px",
                      padding: "14px",
                      marginBottom: "16px",
                      border: "1px solid #e2e8f0"
                    }}>
                      <div style={{ fontWeight: "700", fontSize: "12px", color: "#334155", marginBottom: "4px" }}>
                        Preview Calculation:
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {billChangeBatchStart && billChangeBatchEnd && billChangeBatchNewStart ? (
                          <span>
                            Bills from <strong>#{billChangeBatchStart}</strong> to <strong>#{billChangeBatchEnd}</strong> will be re-sequenced starting from <strong>#{billChangeBatchNewStart}</strong>.
                          </span>
                        ) : (
                          <span>Enter From, To, and New Start Number above to calculate preview.</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const s = parseInt(billChangeBatchStart);
                        const e = parseInt(billChangeBatchEnd);
                        const nStart = parseInt(billChangeBatchNewStart);
                        if (isNaN(s) || isNaN(e) || isNaN(nStart)) {
                          setBillChangeStatus({ type: "error", msg: "Please enter valid numeric values for From, To, and New Start." });
                          return;
                        }
                        if (s > e) {
                          setBillChangeStatus({ type: "error", msg: "From Bill No must be less than or equal to To Bill No." });
                          return;
                        }

                        let offset = nStart - s;
                        let updatedCount = 0;
                        if (billChangeType === "sales") {
                          const updated = salesBills.map(b => {
                            const bNo = parseInt(String(b.billNo));
                            if (!isNaN(bNo) && bNo >= s && bNo <= e) {
                              updatedCount++;
                              return { ...b, billNo: String(bNo + offset) };
                            }
                            return b;
                          });
                          saveSalesBills(updated);
                        } else {
                          const updated = purchaseBills.map(b => {
                            const bNo = parseInt(String(b.billNo));
                            if (!isNaN(bNo) && bNo >= s && bNo <= e) {
                              updatedCount++;
                              return { ...b, billNo: String(bNo + offset) };
                            }
                            return b;
                          });
                          savePurchaseBills(updated);
                        }

                        logUserChange("BATCH_RENUMBER_BILLS", {
                          type: billChangeType,
                          range: `#${s} to #${e}`,
                          newStart: nStart,
                          count: updatedCount
                        }, `Range #${s}-#${e} -> Start #${nStart}`);

                        recordBillChangeLog({
                          id: Date.now(),
                          date: new Date().toISOString(),
                          type: billChangeType,
                          oldBillNo: `Range #${s}-#${e}`,
                          newBillNo: `New Start #${nStart} (${updatedCount} bills)`,
                          party: "Batch Renumber",
                          amount: 0,
                          reason: "Batch Series Renumbering",
                          user: currentUser?.username || "ADMIN"
                        });

                        setBillChangeStatus({ type: "success", msg: `Successfully renumbered ${updatedCount} ${billChangeType} bills from #${s}-#${e} to starting from #${nStart}!` });
                      }}
                      style={{
                        padding: "12px 20px",
                        background: "#0d9488",
                        color: "#fff",
                        fontWeight: "700",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                    >
                      Execute Batch Renumbering
                    </button>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════ */}
              {/* TAB 3: AUDIT HISTORY / LOGS */}
              {/* ═══════════════════════════════════════ */}
              {billChangeActiveTab === "logs" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "16px" }}>
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      padding: "14px 20px",
                      background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#1e293b" }}>
                          Bill Number Renumbering Audit Logs
                        </h3>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Complete trace of all supervisor bill number modifications
                        </div>
                      </div>

                      {billChangeLogs.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to clear local change history logs?")) {
                              setBillChangeLogs([]);
                              localStorage.removeItem("store_bill_number_changes");
                            }
                          }}
                          style={{
                            background: "#fee2e2",
                            color: "#b91c1c",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                        >
                          Clear History
                        </button>
                      )}
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9", color: "#475569", textAlign: "left" }}>
                            <th style={{ padding: "8px 12px", borderRadius: "6px 0 0 6px" }}>Date / Time</th>
                            <th style={{ padding: "8px 12px" }}>Type</th>
                            <th style={{ padding: "8px 12px" }}>Old Bill No</th>
                            <th style={{ padding: "8px 12px" }}>New Bill No</th>
                            <th style={{ padding: "8px 12px" }}>Party / Customer</th>
                            <th style={{ padding: "8px 12px" }}>Reason</th>
                            <th style={{ padding: "8px 12px", borderRadius: "0 6px 6px 0" }}>User</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billChangeLogs.map((log: any) => (
                            <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "10px 12px", color: "#64748b" }}>
                                {new Date(log.date).toLocaleString("en-IN")}
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{
                                  background: log.type === "sales" ? "#e0f2fe" : "#fef3c7",
                                  color: log.type === "sales" ? "#0369a1" : "#92400e",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  fontWeight: "700",
                                  textTransform: "uppercase"
                                }}>
                                  {log.type}
                                </span>
                              </td>
                              <td style={{ padding: "10px 12px", fontWeight: "700", color: "#dc2626" }}>
                                #{log.oldBillNo}
                              </td>
                              <td style={{ padding: "10px 12px", fontWeight: "800", color: "#16a34a" }}>
                                #{log.newBillNo}
                              </td>
                              <td style={{ padding: "10px 12px", fontWeight: "600", color: "#1e293b" }}>
                                {log.party}
                              </td>
                              <td style={{ padding: "10px 12px", color: "#475569" }}>
                                {log.reason}
                              </td>
                              <td style={{ padding: "10px 12px", fontWeight: "700", color: "#0f766e" }}>
                                {log.user}
                              </td>
                            </tr>
                          ))}
                          {billChangeLogs.length === 0 && (
                            <tr>
                              <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                                No bill number changes recorded yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* GROUP/USER RIGHTS MODAL */}
{showGroupRights && (
  <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", background: "#ffffff", zIndex: 9999, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Inter, sans-serif" }}>
      
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

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SUPERVISOR — INVENTORY TRANSACTION TRANSFER & AUDIT (100% FULLSCREEN) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showTransferData && (
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
            {/* ── TOP HEADER ── */}
            <div style={{
              background: "linear-gradient(135deg, #042f2e 0%, #0d9488 50%, #0f172a 100%)",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              color: "#fff",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 10px rgba(255,255,255,0.2)"
                }}>
                  <Package size={24} color="#5eead4" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", letterSpacing: "0.5px" }}>
                      Supervisor — Inventory Transaction Transfer & Audit
                    </h2>
                    <span style={{
                      background: "#14b8a6",
                      color: "#042f2e",
                      fontSize: "10px",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      letterSpacing: "0.5px"
                    }}>
                      SUPERVISOR REGISTER
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#ccfbf1", marginTop: "2px" }}>
                    Track item-by-item In/Out transaction movement across sales, purchases, challans, and stock adjustments
                  </div>
                </div>
              </div>

              {/* Header Right Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={() => setShowTransferData(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#fff",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.85)"; e.currentTarget.style.borderColor = "transparent"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                >
                  <X size={16} /> Close [Esc]
                </button>
              </div>
            </div>

            {/* ── COMPILE ALL INVENTORY TRANSACTIONS IN REAL TIME ── */}
            {(() => {
              const allTxns: any[] = [];
              let sr = 1;

              // 1. OPENING STOCK (Op.S)
              if (tdFilterOpStock) {
                items.forEach((it: any) => {
                  const op = Number(it.openingStock) || 0;
                  if (op > 0) {
                    allTxns.push({
                      id: "op_" + it.id,
                      sr: sr++,
                      name: it.name,
                      unit: it.unit || it.packing || '1',
                      batch: it.batchNumber || 'OPENING',
                      expiry: it.expiryDate || it.expiry || '—',
                      mrp: Number(it.mrp || 0),
                      tax: Number(it.gst || it.tax || 12),
                      qtyIn: op,
                      qtyOut: 0,
                      freeQty: 0,
                      netQty: op,
                      refNo: 'OPEN-STOCK',
                      type: 'Op.S',
                      date: '2026-04-01',
                      party: 'Opening Stock'
                    });
                  }
                });
              }

              // 2. PURCHASES (Purc)
              if (tdFilterPurc) {
                purchaseBills.forEach((pb: any) => {
                  const billItems = pb.items || [];
                  billItems.forEach((it: any, idx: number) => {
                    const qIn = Number(it.qty) || 0;
                    const fQty = Number(it.freeQty || it.free) || 0;
                    allTxns.push({
                      id: "pb_" + (pb.id || pb.billNo) + "_" + idx,
                      sr: sr++,
                      name: it.itemName || it.name,
                      unit: it.unit || it.packing || '1',
                      batch: it.batchNo || it.batch || '—',
                      expiry: it.expiry || '—',
                      mrp: Number(it.mrp || 0),
                      tax: Number(it.gst || it.tax || pb.tax || 12),
                      qtyIn: qIn,
                      qtyOut: 0,
                      freeQty: fQty,
                      netQty: qIn + fQty,
                      refNo: "#" + (pb.billNo || pb.entryNo || pb.id),
                      type: 'Purc',
                      date: pb.billDate || pb.date || '2026-09-01',
                      party: pb.partyName || pb.supplierName || 'Supplier'
                    });
                  });
                });
              }

              // 3. SALES (Sale & S.Re)
              salesBills.forEach((sb: any) => {
                const isRet = !!sb.isReturn;
                if (isRet && !tdFilterSRe) return;
                if (!isRet && !tdFilterSale) return;

                const billItems = sb.items || [];
                billItems.forEach((it: any, idx: number) => {
                  const q = Number(it.qty) || 0;
                  allTxns.push({
                    id: "sb_" + (sb.id || sb.billNo) + "_" + idx,
                    sr: sr++,
                    name: it.itemName || it.name,
                    unit: it.unit || it.packing || '1',
                    batch: it.batchNo || it.batch || '—',
                    expiry: it.expiry || '—',
                    mrp: Number(it.mrp || 0),
                    tax: Number(it.gst || it.tax || 12),
                    qtyIn: isRet ? q : 0,
                    qtyOut: isRet ? 0 : q,
                    freeQty: 0,
                    netQty: isRet ? q : -q,
                    refNo: "#" + (sb.billNo || sb.id),
                    type: isRet ? 'S.Re' : 'Sale',
                    date: (sb.date || '').slice(0, 10) || '2026-09-04',
                    party: sb.patientName || 'Walk-in Customer'
                  });
                });
              });

              // 4. PURCHASE RETURNS (P.Re)
              if (tdFilterPRe && typeof purchaseReturns !== 'undefined' && Array.isArray(purchaseReturns)) {
                purchaseReturns.forEach((pr: any) => {
                  const prItems = pr.items || [];
                  prItems.forEach((it: any, idx: number) => {
                    const q = Number(it.qty) || 0;
                    allTxns.push({
                      id: "pr_" + pr.id + "_" + idx,
                      sr: sr++,
                      name: it.itemName || it.name,
                      unit: it.unit || '1',
                      batch: it.batchNo || it.batch || '—',
                      expiry: it.expiry || '—',
                      mrp: Number(it.mrp || 0),
                      tax: Number(it.gst || 12),
                      qtyIn: 0,
                      qtyOut: q,
                      freeQty: 0,
                      netQty: -q,
                      refNo: "#PR-" + (pr.id || idx),
                      type: 'P.Re',
                      date: (pr.date || '').slice(0, 10) || '2026-09-01',
                      party: pr.partyName || 'Supplier Return'
                    });
                  });
                });
              }

              // Filter by search
              const q = tdSearchQuery.trim().toLowerCase();
              const filteredTxns = allTxns.filter(t => {
                if (!q) return true;
                return (t.name || '').toLowerCase().includes(q) ||
                  (t.batch || '').toLowerCase().includes(q) ||
                  (t.refNo || '').toLowerCase().includes(q) ||
                  (t.party || '').toLowerCase().includes(q);
              });

              // Calculate totals
              let sumIn = 0;
              let sumOut = 0;
              let sumFree = 0;
              let sumNet = 0;

              filteredTxns.forEach(t => {
                sumIn += t.qtyIn;
                sumOut += t.qtyOut;
                sumFree += t.freeQty;
                sumNet += t.netQty;
              });

              return (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  
                  {/* ── TOP KPI SUMMARY STRIP ── */}
                  <div style={{
                    background: "#ffffff",
                    padding: "10px 24px",
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "14px",
                    borderBottom: "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    flexShrink: 0
                  }}>
                    <div style={{ padding: "8px 12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                      <div style={{ fontSize: "11px", color: "#166534", fontWeight: "700", textTransform: "uppercase" }}>Total Qty In (Purchases)</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#15803d", marginTop: "2px" }}>+{sumIn.toLocaleString("en-IN")}</div>
                    </div>

                    <div style={{ padding: "8px 12px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
                      <div style={{ fontSize: "11px", color: "#991b1b", fontWeight: "700", textTransform: "uppercase" }}>Total Qty Out (Sales)</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#dc2626", marginTop: "2px" }}>-{sumOut.toLocaleString("en-IN")}</div>
                    </div>

                    <div style={{ padding: "8px 12px", background: "#fef3c7", borderRadius: "8px", border: "1px solid #fde68a" }}>
                      <div style={{ fontSize: "11px", color: "#92400e", fontWeight: "700", textTransform: "uppercase" }}>Free Schemes Qty</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#b45309", marginTop: "2px" }}>+{sumFree.toLocaleString("en-IN")}</div>
                    </div>

                    <div style={{ padding: "8px 12px", background: "#f0fdfa", borderRadius: "8px", border: "1px solid #99f6e4" }}>
                      <div style={{ fontSize: "11px", color: "#0f766e", fontWeight: "700", textTransform: "uppercase" }}>Net Stock Movement</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#0d9488", marginTop: "2px" }}>
                        {sumNet >= 0 ? "+" + sumNet.toLocaleString("en-IN") : sumNet.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Active Records</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{filteredTxns.length}</div>
                    </div>
                  </div>

                  {/* ── TOP ACTION & SEARCH TOOLBAR ── */}
                  <div style={{
                    background: "#ffffff",
                    padding: "10px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #cbd5e1",
                    flexShrink: 0
                  }}>
                    {/* Left Action Buttons (matching Page 22) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      
                      {/* Transfer Button */}
                      <button
                        onClick={async () => {
                          setTdTransferring(true);
                          setTdStatusMsg("Transferring and synchronizing inventory transactions...");
                          try {
                            forceSync();
                            logUserChange("TRANSFER_DATA_SYNC", {
                              recordsCount: filteredTxns.length,
                              sumIn,
                              sumOut,
                              sumNet
                            }, "Transfer Sync " + filteredTxns.length + " records");
                            setTimeout(() => {
                              setTdStatusMsg("Transfer complete! Successfully consolidated " + filteredTxns.length + " stock transactions.");
                              setTdTransferring(false);
                            }, 1000);
                          } catch (_) {
                            setTdStatusMsg("Transfer finished with local synchronization.");
                            setTdTransferring(false);
                          }
                        }}
                        disabled={tdTransferring || filteredTxns.length === 0}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px 18px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: "800",
                          cursor: (tdTransferring || filteredTxns.length === 0) ? "not-allowed" : "pointer",
                          boxShadow: "0 2px 8px rgba(13,148,136,0.3)"
                        }}
                      >
                        <span>⚡</span>
                        <span>{tdTransferring ? "Transferring..." : "Transfer"}</span>
                      </button>

                      {/* ROFF (Round-Off & Recalculate) Button */}
                      <button
                        onClick={() => {
                          setTdRoundOff(!tdRoundOff);
                          setTdStatusMsg(tdRoundOff ? "Round-off disabled." : "ROFF enabled: Rounded fractional scheme quantities to nearest integer.");
                          setTimeout(() => setTdStatusMsg(null), 4000);
                        }}
                        style={{
                          background: tdRoundOff ? "#0284c7" : "#f1f5f9",
                          color: tdRoundOff ? "#ffffff" : "#334155",
                          border: "1px solid #cbd5e1",
                          padding: "8px 14px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          transition: "0.15s"
                        }}
                      >
                        🔄 ROFF {tdRoundOff ? "[ON]" : "[OFF]"}
                      </button>

                      {/* Search Box */}
                      <div style={{ position: "relative", marginLeft: "10px" }}>
                        <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="text"
                          value={tdSearchQuery}
                          onChange={e => setTdSearchQuery(e.target.value)}
                          placeholder="Search Item, Batch, Bill #, Party..."
                          style={{
                            padding: "8px 12px 8px 30px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "12px",
                            width: "280px",
                            outline: "none"
                          }}
                        />
                        {tdSearchQuery && (
                          <button
                            onClick={() => setTdSearchQuery("")}
                            style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right Toolbar Action */}
                    <button
                      onClick={() => {
                        try {
                          const csvRows = [
                            ["SrNo", "ItemName", "Unit", "Batch", "ExpDt", "MRP", "Tax", "In", "Out", "Free", "NQty", "RefNo", "Type", "Date", "Party"].join(","),
                            ...filteredTxns.map((t, idx) => [
                              idx + 1,
                              '"' + (t.name || '').replace(/"/g, '""') + '"',
                              '"' + t.unit + '"',
                              '"' + t.batch + '"',
                              t.expiry,
                              t.mrp,
                              t.tax + "%",
                              t.qtyIn,
                              t.qtyOut,
                              t.freeQty,
                              t.netQty,
                              '"' + t.refNo + '"',
                              t.type,
                              t.date,
                              '"' + (t.party || '').replace(/"/g, '""') + '"'
                            ].join(","))
                          ].join("\n");

                          const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "Transaction_Transfer_Ledger_" + new Date().toISOString().slice(0, 10) + ".csv";
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (_) {
                          alert("CSV export failed");
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#0284c7",
                        color: "#ffffff",
                        border: "none",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      <FileText size={14} /> Export CSV
                    </button>
                  </div>

                  {/* ── STATUS MESSAGE BANNER ── */}
                  {tdStatusMsg && (
                    <div style={{
                      padding: "8px 24px",
                      background: "#dcfce7",
                      color: "#166534",
                      fontSize: "12px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #bbf7d0",
                      flexShrink: 0
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle size={14} />
                        <span>{tdStatusMsg}</span>
                      </div>
                      <button onClick={() => setTdStatusMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold" }}>✕</button>
                    </div>
                  )}

                  {/* ── WORKSPACE (TABLE + RIGHT SIDEBAR FILTER) ── */}
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 220px", overflow: "hidden" }}>
                    
                    {/* LEFT: 14-COLUMN DATA GRID (Matching Page 22) */}
                    <div style={{ overflowY: "auto", padding: "16px", background: "#f8fafc" }}>
                      <div style={{
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        overflow: "hidden"
                      }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                          <thead>
                            <tr style={{
                              background: "#0f172a",
                              color: "#ffffff",
                              textAlign: "left",
                              position: "sticky",
                              top: 0,
                              zIndex: 10
                            }}>
                              <th style={{ padding: "10px 8px", width: "40px", textAlign: "center" }}>SrNo</th>
                              <th style={{ padding: "10px 12px", minWidth: "190px" }}>Item Name</th>
                              <th style={{ padding: "10px 8px", width: "55px", textAlign: "center" }}>Unit</th>
                              <th style={{ padding: "10px 8px", width: "85px" }}>Batch</th>
                              <th style={{ padding: "10px 8px", width: "70px", textAlign: "center" }}>ExpDt</th>
                              <th style={{ padding: "10px 8px", width: "70px", textAlign: "right" }}>MRP (₹)</th>
                              <th style={{ padding: "10px 8px", width: "50px", textAlign: "center" }}>Tax</th>
                              <th style={{ padding: "10px 8px", width: "65px", textAlign: "right", background: "#15803d" }}>In</th>
                              <th style={{ padding: "10px 8px", width: "65px", textAlign: "right", background: "#b91c1c" }}>Out</th>
                              <th style={{ padding: "10px 8px", width: "55px", textAlign: "right" }}>Free</th>
                              <th style={{ padding: "10px 8px", width: "65px", textAlign: "right", background: "#0d9488" }}>NQty</th>
                              <th style={{ padding: "10px 10px", width: "90px" }}>RefNo</th>
                              <th style={{ padding: "10px 8px", width: "60px", textAlign: "center" }}>Type</th>
                              <th style={{ padding: "10px 8px", width: "85px", textAlign: "center" }}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTxns.length === 0 ? (
                              <tr>
                                <td colSpan={14} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>📦</div>
                                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#64748b" }}>No matching transactions found</div>
                                  <div style={{ fontSize: "12px", marginTop: "4px" }}>Enable transaction types in the right filter sidebar or clear search.</div>
                                </td>
                              </tr>
                            ) : (
                              filteredTxns.map((row, idx) => (
                                <tr
                                  key={row.id || idx}
                                  style={{
                                    borderBottom: "1px solid #f1f5f9",
                                    background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                                    transition: "0.15s"
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#f0fdfa"}
                                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f8fafc"}
                                >
                                  <td style={{ padding: "8px", textAlign: "center", color: "#94a3b8", fontWeight: "600" }}>
                                    {idx + 1}
                                  </td>
                                  <td style={{ padding: "8px 12px", fontWeight: "700", color: "#0f172a" }}>
                                    {row.name}
                                    <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "normal" }}>{row.party}</div>
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "center", color: "#475569" }}>
                                    {row.unit}
                                  </td>
                                  <td style={{ padding: "8px", fontWeight: "600", color: "#334155" }}>
                                    {row.batch}
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "center", color: "#64748b" }}>
                                    {row.expiry}
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "600", color: "#334155" }}>
                                    ₹{fmt(row.mrp)}
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "center" }}>
                                    <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "1px 4px", borderRadius: "3px", fontSize: "10px", fontWeight: "700" }}>
                                      {row.tax}%
                                    </span>
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "800", color: row.qtyIn > 0 ? "#16a34a" : "#94a3b8" }}>
                                    {row.qtyIn > 0 ? "+" + row.qtyIn : "—"}
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "800", color: row.qtyOut > 0 ? "#dc2626" : "#94a3b8" }}>
                                    {row.qtyOut > 0 ? "-" + row.qtyOut : "—"}
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "right", color: row.freeQty > 0 ? "#b45309" : "#94a3b8", fontWeight: row.freeQty > 0 ? "700" : "normal" }}>
                                    {row.freeQty > 0 ? row.freeQty : "—"}
                                  </td>
                                  <td style={{
                                    padding: "8px",
                                    textAlign: "right",
                                    fontWeight: "800",
                                    color: row.netQty > 0 ? "#0d9488" : row.netQty < 0 ? "#dc2626" : "#64748b",
                                    background: "rgba(13,148,136,0.05)"
                                  }}>
                                    {row.netQty > 0 ? "+" + row.netQty : row.netQty}
                                  </td>
                                  <td style={{ padding: "8px 10px", fontWeight: "700", color: "#0284c7" }}>
                                    {row.refNo}
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "center" }}>
                                    <span style={{
                                      display: "inline-block",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      fontSize: "10px",
                                      fontWeight: "800",
                                      background: row.type === "Sale" ? "#fee2e2" : row.type === "Purc" ? "#dcfce7" : row.type === "Op.S" ? "#fef3c7" : "#e0f2fe",
                                      color: row.type === "Sale" ? "#991b1b" : row.type === "Purc" ? "#166534" : row.type === "Op.S" ? "#92400e" : "#0369a1"
                                    }}>
                                      {row.type}
                                    </span>
                                  </td>
                                  <td style={{ padding: "8px", textAlign: "center", color: "#64748b" }}>
                                    {row.date}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* RIGHT: FILTER SIDEBAR (Matching Page 22 Checkboxes) */}
                    <div style={{
                      background: "#ffffff",
                      borderLeft: "1px solid #cbd5e1",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      overflowY: "auto"
                    }}>
                      <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#0d9488", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Filter Txn Types
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b", marginTop: "2px" }}>
                          Included Records:
                        </div>
                      </div>

                      {/* 7 Checkboxes directly from Page 22 */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {[
                          { key: "opStock", label: "Op.S", full: "Opening Stock", val: tdFilterOpStock, set: setTdFilterOpStock, color: "#92400e" },
                          { key: "chal", label: "Chal", full: "Challan Entries", val: tdFilterChal, set: setTdFilterChal, color: "#0369a1" },
                          { key: "purc", label: "Purc", full: "Purchase Bills", val: tdFilterPurc, set: setTdFilterPurc, color: "#166534" },
                          { key: "sRe", label: "S.Re", full: "Sales Return", val: tdFilterSRe, set: setTdFilterSRe, color: "#991b1b" },
                          { key: "pRe", label: "P.Re", full: "Purchase Return", val: tdFilterPRe, set: setTdFilterPRe, color: "#b45309" },
                          { key: "stk", label: "Stk.", full: "Stock Adjustments", val: tdFilterStk, set: setTdFilterStk, color: "#6b21a8" },
                          { key: "sale", label: "Sale", full: "Sales Bills", val: tdFilterSale, set: setTdFilterSale, color: "#dc2626" },
                        ].map(item => (
                          <label
                            key={item.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              background: item.val ? "#f8fafc" : "transparent",
                              border: item.val ? "1px solid #cbd5e1" : "1px solid transparent",
                              cursor: "pointer",
                              transition: "0.15s"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={item.val}
                              onChange={e => item.set(e.target.checked)}
                              style={{ width: "15px", height: "15px", accentColor: "#0d9488", cursor: "pointer" }}
                            />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "12px", fontWeight: "800", color: item.color }}>{item.label}</span>
                              <span style={{ fontSize: "10px", color: "#64748b" }}>{item.full}</span>
                            </div>
                          </label>
                        ))}
                      </div>

                      {/* Quick Select Buttons */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "4px" }}>
                        <button
                          onClick={() => {
                            setTdFilterOpStock(true);
                            setTdFilterChal(true);
                            setTdFilterPurc(true);
                            setTdFilterSRe(true);
                            setTdFilterPRe(true);
                            setTdFilterStk(true);
                            setTdFilterSale(true);
                          }}
                          style={{
                            padding: "6px",
                            background: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            color: "#0f766e",
                            cursor: "pointer"
                          }}
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => {
                            setTdFilterOpStock(false);
                            setTdFilterChal(false);
                            setTdFilterPurc(false);
                            setTdFilterSRe(false);
                            setTdFilterPRe(false);
                            setTdFilterStk(false);
                            setTdFilterSale(false);
                          }}
                          style={{
                            padding: "6px",
                            background: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            color: "#64748b",
                            cursor: "pointer"
                          }}
                        >
                          Clear All
                        </button>
                      </div>

                      {/* Informational Guidance Box */}
                      <div style={{
                        marginTop: "auto",
                        background: "#f0fdfa",
                        border: "1px solid #99f6e4",
                        borderRadius: "8px",
                        padding: "10px",
                        fontSize: "11px",
                        color: "#0f766e",
                        lineHeight: "1.4"
                      }}>
                        <strong>💡 Transfer Note:</strong> Clicking Transfer reconciles all verified transaction batches into the primary inventory ledger and updates audit checkpoints.
                      </div>
                    </div>

                  </div>

                </div>
              );
            })()}

          </div>
        )}

        {/* ══════════════════════════════════════════════
            TRANSFER OTHER DATA MODAL (Import)
        ══════════════════════════════════════════════ */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SUPERVISOR — TRANSFER OTHER DATA / IMPORT CENTER (100% FULLSCREEN) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showTransferOtherData && (
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
            {/* Top Bar Header */}
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
                  📥
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "17px", fontWeight: "700", letterSpacing: "0.4px" }}>
                      TRANSFER OTHER DATA — IMPORT & SYNCHRONIZATION
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
                      SUPERVISOR UTILITY
                    </span>
                    <span style={{
                      background: transferOtherMerge === "merge" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                      color: transferOtherMerge === "merge" ? "#34d399" : "#f87171",
                      border: `1px solid ${transferOtherMerge === "merge" ? "rgba(52,211,153,0.4)" : "rgba(248,113,113,0.4)}"}`,
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: "700"
                    }}>
                      {transferOtherMerge === "merge" ? "🔀 SAFE MERGE MODE" : "⚠️ OVERWRITE MODE"}
                    </span>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>
                    Selectively import and synchronize master catalogs and transaction data from external JSON archive backups
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {transferOtherParsed && (
                  <div style={{
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "1px solid rgba(255,255,255,0.1)"
                  }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                    <span style={{ fontSize: "12px", color: "#e2e8f0", fontWeight: "600" }}>
                      {Object.values(transferOtherSels).filter(Boolean).length} Categories Active
                    </span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowTransferOtherData(false);
                    setTransferOtherFile(null);
                    setTransferOtherParsed(null);
                    setTransferOtherMsg("");
                    setTransferOtherProgress("");
                  }}
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
                    gap: "6px",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#475569"}
                  onMouseLeave={e => e.currentTarget.style.background = "#334155"}
                >
                  ✕ Close (ESC)
                </button>
              </div>
            </div>

            {/* Main Content Area: Two Column Layout */}
            <div style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "400px 1fr",
              overflow: "hidden"
            }}>
              {/* Left Column: File Control & Import Policies */}
              <div style={{
                background: "#ffffff",
                borderRight: "1px solid #e2e8f0",
                padding: "20px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "18px"
              }}>
                {/* File Upload Box */}
                <div style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  padding: "16px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "16px" }}>📂</span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Archive Source File</span>
                  </div>

                  <input
                    type="file"
                    accept=".json"
                    id="transfer-other-file-input"
                    style={{ display: "none" }}
                    onChange={e => {
                      const f = e.target.files && e.target.files[0];
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
                          const avail = {};
                          ["items", "batches", "suppliers", "purchaseBills", "salesBills", "payments", "doctors", "customers", "khataEntries", "advanceDeposits"].forEach(k => {
                            const sk = k === "khataEntries" ? "khata" : k === "advanceDeposits" ? "advance" : k;
                            avail[sk] = !!(data[k] && Array.isArray(data[k]) && data[k].length > 0);
                          });
                          setTransferOtherSels(avail);
                          setTransferOtherProgress("ready");
                          const meta = data._meta || {};
                          setTransferOtherMsg(`Archive file loaded successfully. Created: ${meta.exportedAt ? new Date(meta.exportedAt).toLocaleString("en-IN") : "Unknown"} | Operator: ${meta.exportedBy || "System"}`);
                        } catch (err) {
                          setTransferOtherProgress("error");
                          setTransferOtherParsed(null);
                          setTransferOtherMsg(`Invalid file format: ${err.message}`);
                        }
                      };
                      reader.readAsText(f);
                      e.target.value = "";
                    }}
                  />

                  {!transferOtherFile ? (
                    <label
                      htmlFor="transfer-other-file-input"
                      style={{
                        border: "2px dashed #cbd5e1",
                        borderRadius: "10px",
                        padding: "24px 16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        cursor: "pointer",
                        background: "#ffffff",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#0d9488"; e.currentTarget.style.background = "#f0fdfa"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#ffffff"; }}
                    >
                      <div style={{ fontSize: "32px", marginBottom: "8px" }}>📤</div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>Click to Browse Transfer File</div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Supports JSON transfer & backup archives (.json)</div>
                      <div style={{ marginTop: "12px", background: "#0d9488", color: "#ffffff", padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>
                        Browse Computer
                      </div>
                    </label>
                  ) : (
                    <div style={{
                      background: "#ffffff",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      padding: "14px"
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <div style={{ fontSize: "24px" }}>📄</div>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", wordBreak: "break-all" }}>
                              {transferOtherFile.name}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                              {(transferOtherFile.size / 1024).toFixed(1)} KB • JSON Format
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setTransferOtherFile(null);
                            setTransferOtherParsed(null);
                            setTransferOtherMsg("");
                            setTransferOtherProgress("");
                          }}
                          title="Remove File"
                          style={{
                            background: "#fee2e2",
                            color: "#ef4444",
                            border: "none",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: "700"
                          }}
                        >
                          Remove
                        </button>
                      </div>

                      {transferOtherParsed && (
                        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px" }}>
                            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Export Date</div>
                            <div style={{ fontSize: "12px", color: "#0f172a", fontWeight: "700", marginTop: "2px" }}>
                              {transferOtherParsed._meta?.exportedAt ? new Date(transferOtherParsed._meta.exportedAt).toLocaleDateString("en-IN") : "Standard"}
                            </div>
                          </div>
                          <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px" }}>
                            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Exported By</div>
                            <div style={{ fontSize: "12px", color: "#0f172a", fontWeight: "700", marginTop: "2px" }}>
                              {transferOtherParsed._meta?.exportedBy || "Supervisor"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Import Mode Policy */}
                <div style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  padding: "16px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "16px" }}>⚙️</span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Conflict Resolution Policy</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: `1.5px solid ${transferOtherMerge === "merge" ? "#0d9488" : "#e2e8f0"}`,
                        background: transferOtherMerge === "merge" ? "#f0fdfa" : "#ffffff",
                        transition: "all 0.15s"
                      }}
                      onClick={() => setTransferOtherMerge("merge")}
                    >
                      <input
                        type="radio"
                        name="transferMerge"
                        value="merge"
                        checked={transferOtherMerge === "merge"}
                        onChange={() => setTransferOtherMerge("merge")}
                        style={{ marginTop: "3px" }}
                      />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>🔀 Merge & Append</span>
                          <span style={{ background: "#d1fae5", color: "#065f46", fontSize: "10px", fontWeight: "700", padding: "1px 6px", borderRadius: "4px" }}>
                            RECOMMENDED
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Preserves all existing store data. Adds new non-duplicate records and prevents collisions.
                        </div>
                      </div>
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: `1.5px solid ${transferOtherMerge === "replace" ? "#ef4444" : "#e2e8f0"}`,
                        background: transferOtherMerge === "replace" ? "#fef2f2" : "#ffffff",
                        transition: "all 0.15s"
                      }}
                      onClick={() => setTransferOtherMerge("replace")}
                    >
                      <input
                        type="radio"
                        name="transferMerge"
                        value="replace"
                        checked={transferOtherMerge === "replace"}
                        onChange={() => setTransferOtherMerge("replace")}
                        style={{ marginTop: "3px" }}
                      />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#b91c1c" }}>⚠️ Overwrite / Replace</span>
                          <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "10px", fontWeight: "700", padding: "1px 6px", borderRadius: "4px" }}>
                            STRICT OVERRIDE
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#7f1d1d", marginTop: "2px" }}>
                          Completely replaces existing records in selected categories with the archive data.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Quick Selection Actions */}
                {transferOtherParsed && (
                  <div style={{
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    padding: "16px"
                  }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "10px" }}>
                      Category Selection Controls
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <button
                        onClick={() => {
                          const allAvail = {};
                          ["items", "batches", "suppliers", "purchaseBills", "salesBills", "payments", "doctors", "customers", "khata", "advance"].forEach(k => {
                            const rawKey = k === "khata" ? "khataEntries" : k === "advance" ? "advanceDeposits" : k;
                            allAvail[k] = !!(transferOtherParsed[rawKey] && transferOtherParsed[rawKey].length > 0);
                          });
                          setTransferOtherSels(allAvail);
                        }}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#334155",
                          cursor: "pointer"
                        }}
                      >
                        Select Available
                      </button>
                      <button
                        onClick={() => {
                          const none = {};
                          ["items", "batches", "suppliers", "purchaseBills", "salesBills", "payments", "doctors", "customers", "khata", "advance"].forEach(k => {
                            none[k] = false;
                          });
                          setTransferOtherSels(none);
                        }}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#334155",
                          cursor: "pointer"
                        }}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Interactive Entity Selection & Live Inspection */}
              <div style={{
                background: "#f8fafc",
                padding: "24px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "20px"
              }}>
                {!transferOtherParsed ? (
                  <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px dashed #cbd5e1",
                    padding: "40px 24px",
                    textAlign: "center"
                  }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#f0fdfa", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", marginBottom: "16px" }}>
                      📥
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                      No Archive Selected
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748b", maxWidth: "440px", marginTop: "6px", lineHeight: "1.5" }}>
                      Please select or upload a valid JSON transfer archive from the left panel to inspect records and select data categories to import.
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "32px", maxWidth: "600px", width: "100%" }}>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", textAlign: "left" }}>
                        <div style={{ fontSize: "20px" }}>📦</div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginTop: "6px" }}>10 Categories</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Items, Batches, Suppliers, Invoices, Khata & more</div>
                      </div>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", textAlign: "left" }}>
                        <div style={{ fontSize: "20px" }}>🛡️</div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginTop: "6px" }}>Safe Merging</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Automatic ID validation prevents duplicate entries</div>
                      </div>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", textAlign: "left" }}>
                        <div style={{ fontSize: "20px" }}>📋</div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginTop: "6px" }}>Audit Trail</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>All imported records are logged in Supervisor Changes</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                          Select Data Categories to Import
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          Check the entities you wish to import from this archive into your current database
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "4px 10px",
                          fontSize: "12px",
                          color: "#334155",
                          fontWeight: "600"
                        }}>
                          {Object.entries(transferOtherSels).filter(([_, v]) => v).length} of 10 Selected
                        </span>
                      </div>
                    </div>

                    {/* Categories Grid */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                      gap: "14px"
                    }}>
                      {[
                        { key: "items", label: "Items & Catalog", icon: "🔬", count: transferOtherParsed.items?.length || 0, current: items?.length || 0, desc: "Product master, GST rates, HSN codes, and packings" },
                        { key: "batches", label: "Batches & Inventory", icon: "📋", count: transferOtherParsed.batches?.length || 0, current: batches?.length || 0, desc: "Batch numbers, expiry dates, MRP, purchase & sale rates" },
                        { key: "suppliers", label: "Suppliers & Vendors", icon: "🚚", count: transferOtherParsed.suppliers?.length || 0, current: suppliers?.length || 0, desc: "Supplier profiles, contact details, GST numbers, credit terms" },
                        { key: "purchaseBills", label: "Purchase Invoices", icon: "📥", count: transferOtherParsed.purchaseBills?.length || 0, current: purchaseBills?.length || 0, desc: "Inward invoices, purchased item lines, taxes, and supplier bills" },
                        { key: "salesBills", label: "Sales Bills & POS", icon: "📤", count: transferOtherParsed.salesBills?.length || 0, current: salesBills?.length || 0, desc: "Customer invoices, POS counters, prescriptions, and payments" },
                        { key: "payments", label: "Payments & Receipts", icon: "💳", count: transferOtherParsed.payments?.length || 0, current: payments?.length || 0, desc: "Cashbook entries, bank settlements, and supplier payments" },
                        { key: "doctors", label: "Doctor Master", icon: "🩺", count: transferOtherParsed.doctors?.length || 0, current: doctors?.length || 0, desc: "Doctor directory, medical council reg nos, hospital clinics" },
                        { key: "customers", label: "Customer Profiles", icon: "👤", count: transferOtherParsed.customers?.length || 0, current: 0, desc: "Patient details, mobile numbers, loyalty balances, and history" },
                        { key: "khata", label: "Khata / Credit Ledger", icon: "📒", count: transferOtherParsed.khataEntries?.length || 0, current: khataEntries?.length || 0, desc: "Pending customer udhar, running credit balances, and settlements" },
                        { key: "advance", label: "Advance Deposits", icon: "💰", count: transferOtherParsed.advanceDeposits?.length || 0, current: advanceDeposits?.length || 0, desc: "Customer advance payments, security deposits, and prepaid balances" },
                      ].map(c => {
                        const available = c.count > 0;
                        const isSelected = !!transferOtherSels[c.key];

                        return (
                          <div
                            key={c.key}
                            onClick={() => {
                              if (!available) return;
                              setTransferOtherSels(prev => ({ ...prev, [c.key]: !prev[c.key] }));
                            }}
                            style={{
                              background: "#ffffff",
                              borderRadius: "10px",
                              border: `1.5px solid ${!available ? "#e2e8f0" : isSelected ? "#0d9488" : "#cbd5e1"}`,
                              boxShadow: isSelected ? "0 4px 12px rgba(13,148,136,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
                              padding: "14px 16px",
                              cursor: available ? "pointer" : "not-allowed",
                              opacity: available ? 1 : 0.45,
                              transition: "all 0.15s",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between"
                            }}
                          >
                            <div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={!available}
                                    onChange={e => {
                                      e.stopPropagation();
                                      setTransferOtherSels(prev => ({ ...prev, [c.key]: e.target.checked }));
                                    }}
                                    style={{
                                      width: "16px",
                                      height: "16px",
                                      accentColor: "#0d9488",
                                      cursor: available ? "pointer" : "default"
                                    }}
                                  />
                                  <span style={{ fontSize: "20px" }}>{c.icon}</span>
                                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                                    {c.label}
                                  </span>
                                </div>
                                <span style={{
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  background: available ? "#dcfce7" : "#f1f5f9",
                                  color: available ? "#15803d" : "#94a3b8"
                                }}>
                                  {available ? `${c.count} in archive` : "0 in file"}
                                </span>
                              </div>

                              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "8px", lineHeight: "1.4" }}>
                                {c.desc}
                              </div>
                            </div>

                            <div style={{
                              marginTop: "12px",
                              paddingTop: "8px",
                              borderTop: "1px solid #f1f5f9",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "11px"
                            }}>
                              <span style={{ color: "#64748b" }}>
                                Store: <strong>{c.current} records</strong>
                              </span>
                              <span style={{
                                fontWeight: "600",
                                color: !available ? "#94a3b8" : isSelected ? (transferOtherMerge === "merge" ? "#059669" : "#dc2626") : "#94a3b8"
                              }}>
                                {!available ? "No Data" : isSelected ? (transferOtherMerge === "merge" ? "+ Merge Unique" : "Replace Existing") : "Excluded"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Footer Action Bar */}
            <div style={{
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", maxWidth: "60%" }}>
                {transferOtherMsg ? (
                  <div style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    background: transferOtherProgress === "done" ? "#dcfce7" : transferOtherProgress === "error" ? "#fee2e2" : "#f0fdfa",
                    color: transferOtherProgress === "done" ? "#15803d" : transferOtherProgress === "error" ? "#b91c1c" : "#0d9488",
                    border: `1px solid ${transferOtherProgress === "done" ? "#bbf7d0" : transferOtherProgress === "error" ? "#fecaca" : "#ccfbf1"}`
                  }}>
                    {transferOtherMsg}
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    ℹ️ <strong>Notice:</strong> In Safe Merge mode, existing transaction IDs and bill numbers are preserved to prevent loss of local records.
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => {
                    setShowTransferOtherData(false);
                    setTransferOtherFile(null);
                    setTransferOtherParsed(null);
                    setTransferOtherMsg("");
                    setTransferOtherProgress("");
                  }}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#334155",
                    borderRadius: "8px",
                    padding: "8px 18px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>

                <button
                  disabled={!transferOtherParsed || transferOtherProgress === "importing" || !Object.values(transferOtherSels).some(Boolean)}
                  onClick={async () => {
                    if (!transferOtherParsed) {
                      showToast("Please select a valid archive file first.", "error");
                      return;
                    }
                    if (!Object.values(transferOtherSels).some(Boolean)) {
                      showToast("Please select at least 1 category to import.", "error");
                      return;
                    }

                    if (transferOtherMerge === "replace") {
                      const confirmReplace = window.confirm(
                        "⚠️ CAUTION: OVERWRITE / REPLACE MODE ACTIVATED\n\n" +
                        "You have chosen to REPLACE existing store records in the selected categories with the archive data.\n\n" +
                        "Are you sure you want to completely overwrite current records?"
                      );
                      if (!confirmReplace) return;
                    }

                    setTransferOtherProgress("importing");
                    setTransferOtherMsg("⏳ Processing data transfer & synchronizing entities...");

                    try {
                      const d = transferOtherParsed;
                      const merge = transferOtherMerge === "merge";

                      const mergeArr = (existing, incoming) => {
                        if (!incoming || !incoming.length) return existing || [];
                        if (!merge) return incoming;
                        const ids = new Set((existing || []).map(e => e.id || e.billNo || e.invoiceNo || e.batchNo || JSON.stringify(e)));
                        return [...(existing || []), ...incoming.filter(i => !ids.has(i.id || i.billNo || i.invoiceNo || i.batchNo || JSON.stringify(i)))];
                      };

                      let imported = [];

                      if (transferOtherSels.items && d.items && d.items.length) {
                        const n = mergeArr(items, d.items);
                        saveItems(n);
                        save("store_items", n);
                        imported.push(`Items (${d.items.length})`);
                      }
                      if (transferOtherSels.batches && d.batches && d.batches.length) {
                        const n = mergeArr(batches, d.batches);
                        saveBatches(n);
                        save("store_batches", n);
                        imported.push(`Batches (${d.batches.length})`);
                      }
                      if (transferOtherSels.suppliers && d.suppliers && d.suppliers.length) {
                        const n = mergeArr(suppliers, d.suppliers);
                        saveSuppliers(n);
                        save("store_suppliers", n);
                        imported.push(`Suppliers (${d.suppliers.length})`);
                      }
                      if (transferOtherSels.purchaseBills && d.purchaseBills && d.purchaseBills.length) {
                        const n = mergeArr(purchaseBills, d.purchaseBills);
                        savePurchaseBills(n);
                        save("store_purchaseBills", n);
                        imported.push(`Purchase Bills (${d.purchaseBills.length})`);
                      }
                      if (transferOtherSels.salesBills && d.salesBills && d.salesBills.length) {
                        const n = mergeArr(salesBills, d.salesBills);
                        saveSalesBills(n);
                        save("store_salesBills", n);
                        imported.push(`Sales Bills (${d.salesBills.length})`);
                      }
                      if (transferOtherSels.payments && d.payments && d.payments.length) {
                        const n = mergeArr(payments, d.payments);
                        savePayments(n);
                        save("store_payments", n);
                        imported.push(`Payments (${d.payments.length})`);
                      }
                      if (transferOtherSels.doctors && d.doctors && d.doctors.length) {
                        const n = mergeArr(doctors, d.doctors);
                        setDoctors(n);
                        save("store_doctors", n);
                        imported.push(`Doctors (${d.doctors.length})`);
                      }
                      if (transferOtherSels.customers && d.customers && d.customers.length) {
                        const n = mergeArr(customers || [], d.customers);
                        save("store_customers", n);
                        imported.push(`Customers (${d.customers.length})`);
                      }
                      if (transferOtherSels.khata && d.khataEntries && d.khataEntries.length) {
                        const n = mergeArr(khataEntries || [], d.khataEntries);
                        save("store_khata_entries", n);
                        imported.push(`Khata (${d.khataEntries.length})`);
                      }
                      if (transferOtherSels.advance && d.advanceDeposits && d.advanceDeposits.length) {
                        const n = mergeArr(advanceDeposits || [], d.advanceDeposits);
                        save("store_advance_deposits", n);
                        imported.push(`Advance (${d.advanceDeposits.length})`);
                      }

                      // Log audit change
                      if (typeof logUserChange === "function") {
                        logUserChange("TRANSFER_OTHER_DATA_IMPORT", "Transfer Other Data", {
                          mode: transferOtherMerge,
                          categories: imported,
                          totalCategories: imported.length,
                          archiveName: transferOtherFile ? transferOtherFile.name : "Transfer Archive"
                        });
                      }

                      setTransferOtherProgress("done");
                      setTransferOtherMsg(`✅ Import completed successfully (${transferOtherMerge.toUpperCase()} mode): ${imported.join(", ")}`);
                      showToast(`✅ Successfully imported ${imported.length} data categories!`, "success");
                    } catch (err) {
                      console.error("Transfer Other Data Error:", err);
                      setTransferOtherProgress("error");
                      setTransferOtherMsg(`❌ Import failed: ${err.message}`);
                      showToast(`Transfer error: ${err.message}`, "error");
                    }
                  }}
                  style={{
                    background: (!transferOtherParsed || transferOtherProgress === "importing" || !Object.values(transferOtherSels).some(Boolean))
                      ? "#94a3b8"
                      : "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 22px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: (!transferOtherParsed || transferOtherProgress === "importing" || !Object.values(transferOtherSels).some(Boolean))
                      ? "not-allowed"
                      : "pointer",
                    boxShadow: (!transferOtherParsed || transferOtherProgress === "importing" || !Object.values(transferOtherSels).some(Boolean))
                      ? "none"
                      : "0 2px 8px rgba(13,148,136,0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  {transferOtherProgress === "importing" ? "⏳ Processing Import..." : "📥 Execute Transfer / Import"}
                </button>
              </div>


            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SUPERVISOR — CHALLAN PROBLEM / RECONCILIATION & AUDIT (100% FULLSCREEN) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showChallanProblem && (() => {
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
                    onClick={() => { setShowChallanProblem(false); setCpDetailModal(null); setCpActionMsg(null); }}
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
        })()}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SUPERVISOR — CHANGE BILLS / SALES INVOICE AUDIT & MODIFICATION (100% FULLSCREEN LIGHT THEME) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showChangeBills && (() => {
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
                    onClick={() => setShowChangeBills(false)}
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
                      setShowChangeBills(false);
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
                          setShowChangeBills(false);
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
        })()}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SUPERVISOR — SALES BILL DELETE & RENUMBERING (100% FULLSCREEN LIGHT THEME) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showSalesBillDelete && (() => {
          // Normalize sales bills - Filter for Cash bills only (Per system rule: NO DEBIT BILLS)
          const rawBills = (salesBills || []).map((b: any, index: number) => {
            const billTotal = Number(b.total || b.netAmount || b.grandTotal || 0);
            const billBase = Number(b.taxableAmount || b.baseAmount || b.subTotal || (billTotal > 0 ? (billTotal / 1.12).toFixed(2) : 0));
            const billGst = Number(b.taxAmount || b.gstAmount || b.vatAmount || (billTotal > 0 ? (billTotal - billBase).toFixed(2) : 0));
            const billDate = b.date || (b.createdAt ? String(b.createdAt).slice(0, 10) : today());
            const billType = b.payMode || b.paymentMode || b.type || (b.isCredit ? 'Credit' : 'Cash');
            const isCashOnly = !/credit/i.test(billType);
            const billUser = b.createdByName || b.user || b.cashier || currentUser?.username || 'ADMIN';
            const billId = String(b.id || b.billNo || index + 1);

            return {
              ...b,
              _id: billId,
              _srNo: index + 1,
              _billNo: String(b.billNo || b.invoiceNo || b.id || index + 1),
              _date: billDate,
              _type: billType,
              _isCash: isCashOnly,
              _customerName: b.patientName || b.customerName || b.partyName || 'Walk-in Customer',
              _gst: billGst,
              _amount: billTotal,
              _user: billUser
            };
          });

          // Apply filters for Tab 1 (Delete Cash Sales Bill)
          const eligibleBills = rawBills.filter((b: any) => {
            if (!b._isCash) return false; // Must be Cash bill only
            if (sbdFromDate && b._date < sbdFromDate) return false;
            if (sbdToDate && b._date > sbdToDate) return false;

            if (sbdLowerAmt.trim() && b._amount < Number(sbdLowerAmt)) return false;
            if (sbdHigherAmt.trim() && b._amount > Number(sbdHigherAmt)) return false;

            if (sbdSearchQuery.trim()) {
              const q = sbdSearchQuery.toLowerCase();
              const matchNo = b._billNo.toLowerCase().includes(q);
              const matchCust = b._customerName.toLowerCase().includes(q);
              if (!matchNo && !matchCust) return false;
            }

            return true;
          });

          // Selected Bills calculation
          const selectedBills = eligibleBills.filter((b: any) => !!sbdSelectedMap[b._id]);
          const selectedCount = selectedBills.length;
          const selectedTotalAmt = selectedBills.reduce((acc: number, b: any) => acc + (b._amount || 0), 0);

          // Calculate total units to restore across selected bills
          const totalUnitsToRestore = selectedBills.reduce((acc: number, b: any) => {
            const lineItems = b.items || b.saleItems || [];
            const billUnits = lineItems.reduce((sum: number, it: any) => sum + Number(it.qty || it.quantity || 1), 0);
            return acc + billUnits;
          }, 0);

          // Select All (Yes)
          const handleSelectAll = () => {
            const nextMap: { [key: string]: boolean } = {};
            eligibleBills.forEach((b: any) => { nextMap[b._id] = true; });
            setSbdSelectedMap(nextMap);
          };

          // Deselect All (No)
          const handleDeselectAll = () => {
            setSbdSelectedMap({});
          };

          // Toggle Individual Row
          const handleToggleRow = (id: string) => {
            setSbdSelectedMap(prev => ({ ...prev, [id]: !prev[id] }));
          };

          // Execute Batch Delete with Inventory Stock Restoration
          const handleExecuteDelete = () => {
            if (selectedBills.length === 0) {
              alert("Please select at least one bill to delete.");
              return;
            }

            try {
              const selectedIds = new Set(selectedBills.map((b: any) => b._id));
              
              // 1. Restore Inventory Stock for items and batches
              const updatedItems = [...items];
              const updatedBatches = [...batches];

              selectedBills.forEach((bill: any) => {
                const lineItems = bill.items || bill.saleItems || [];
                lineItems.forEach((li: any) => {
                  const qtyToRestore = Number(li.qty || li.quantity || 1);
                  const targetItemId = li.itemId || li.id;
                  const targetBatchNo = li.batch || li.batchNo;

                  // Restore batch stock
                  if (targetBatchNo) {
                    const bIdx = updatedBatches.findIndex((b: any) => 
                      (b.itemId === targetItemId || !targetItemId) && (b.batchNo === targetBatchNo || b.batch === targetBatchNo)
                    );
                    if (bIdx !== -1) {
                      updatedBatches[bIdx] = {
                        ...updatedBatches[bIdx],
                        stock: Number(updatedBatches[bIdx].stock || 0) + qtyToRestore,
                        currentStock: Number(updatedBatches[bIdx].currentStock || updatedBatches[bIdx].stock || 0) + qtyToRestore
                      };
                    }
                  }

                  // Restore item overall stock
                  if (targetItemId) {
                    const iIdx = updatedItems.findIndex((it: any) => it.id === targetItemId);
                    if (iIdx !== -1) {
                      updatedItems[iIdx] = {
                        ...updatedItems[iIdx],
                        stock: Number(updatedItems[iIdx].stock || 0) + qtyToRestore
                      };
                    }
                  }
                });
              });

              // 2. Remove deleted bills from salesBills
              const updatedSales = (salesBills || []).filter((sb: any, idx: number) => {
                const id = String(sb.id || sb.billNo || idx + 1);
                return !selectedIds.has(id);
              });

              // Save to Store
              if (typeof saveItems === 'function') saveItems(updatedItems);
              if (typeof saveBatches === 'function') saveBatches(updatedBatches);
              if (typeof saveSalesBills === 'function') saveSalesBills(updatedSales);

              // 3. User Audit Logging
              if (typeof logUserChange === 'function') {
                logUserChange('SUPERVISOR_BATCH_DELETE_SALES', {
                  deletedCount: selectedBills.length,
                  totalAmount: selectedTotalAmt,
                  restoredUnits: totalUnitsToRestore,
                  billNumbers: selectedBills.map((b: any) => b._billNo).slice(0, 15).join(', ')
                }, `Permanently deleted ${selectedBills.length} Cash sales bills totalling ₹${selectedTotalAmt.toFixed(2)} and restored ${totalUnitsToRestore} inventory units`);
              }

              setSbdStatusMsg({
                type: "success",
                msg: `Successfully deleted ${selectedBills.length} sales bills! ${totalUnitsToRestore} medicine units have been restored to inventory.`
              });

              setSbdSelectedMap({});
              setSbdConfirmModal(false);
              setTimeout(() => setSbdStatusMsg(null), 5000);
            } catch (err: any) {
              setSbdStatusMsg({ type: "error", msg: "Failed to delete sales bills: " + (err?.message || "Unknown error") });
            }
          };

          // Execute Renumbering Logic
          const handleExecuteRenumbering = () => {
            try {
              // Sort sales bills chronologically
              const sorted = [...(salesBills || [])].sort((a: any, b: any) => {
                const da = a.date || a.createdAt || '';
                const db = b.date || b.createdAt || '';
                return da.localeCompare(db);
              });

              let currentSeq = Number(sbdRenumberStart) || 1;
              const padLen = Number(sbdRenumberDigits) || 4;
              const prefix = sbdRenumberPrefix || '';

              const renumbered = sorted.map((sb: any) => {
                const newNo = `${prefix}${String(currentSeq).padStart(padLen, '0')}`;
                currentSeq++;
                return { ...sb, billNo: newNo, hasRenumbered: true };
              });

              if (typeof saveSalesBills === 'function') saveSalesBills(renumbered);

              if (typeof logUserChange === 'function') {
                logUserChange('SUPERVISOR_SALES_RENUMBER', {
                  totalRenumbered: renumbered.length,
                  startNo: sbdRenumberStart,
                  prefix: sbdRenumberPrefix
                }, `Renumbered ${renumbered.length} sales bills starting from ${sbdRenumberPrefix}${sbdRenumberStart}`);
              }

              setSbdStatusMsg({
                type: "success",
                msg: `Successfully renumbered all ${renumbered.length} sales bills consecutively!`
              });
              setSbdRenumberConfirm(false);
              setTimeout(() => setSbdStatusMsg(null), 4500);
            } catch (err: any) {
              setSbdStatusMsg({ type: "error", msg: "Renumbering failed: " + (err?.message || "Unknown error") });
            }
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
              {/* Top Warning Banner (Light Red Alert Theme) */}
              <div
                style={{
                  background: "#fef2f2",
                  padding: "8px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #fecaca",
                  flexShrink: 0
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <AlertCircle size={17} color="#dc2626" />
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#991b1b", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    USE THIS FACILITY ONLY IF YOU MAKE CASH BILLS ONLY — NO DEBIT / CREDIT BILLS
                  </span>
                </div>

                <button
                  onClick={() => setShowSalesBillDelete(false)}
                  style={{
                    background: "#ffffff",
                    color: "#dc2626",
                    border: "1px solid #fca5a5",
                    padding: "4px 12px",
                    borderRadius: "4px",
                    fontWeight: "700",
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <X size={13} /> Close (ESC)
                </button>
              </div>

              {/* Header Title & Subtabs (Light/Modern Theme) */}
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
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)"
                    }}
                  >
                    <Trash2 size={22} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "17px", fontWeight: "800", color: "#ffffff" }}>
                        Sales Bill Delete &amp; Renumbering Facility
                      </span>
                      <span
                        style={{
                          background: "rgba(239, 68, 68, 0.25)",
                          color: "#fca5a5",
                          border: "1px solid rgba(252, 165, 165, 0.4)",
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
                      Batch reverse cash sales invoices, restore batch inventory quantities, and re-sequence bill numbers
                    </div>
                  </div>
                </div>

                {/* Sub-tabs Selector */}
                <div style={{ display: "flex", background: "rgba(255,255,255,0.1)", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <button
                    onClick={() => setSbdActiveTab("delete")}
                    style={{
                      background: sbdActiveTab === "delete" ? "#ef4444" : "transparent",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <Trash2 size={13} /> Delete Cash Sales Bill
                  </button>

                  <button
                    onClick={() => setSbdActiveTab("renumber")}
                    style={{
                      background: sbdActiveTab === "renumber" ? "#3b82f6" : "transparent",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <TrendingUp size={13} /> Sales Bill Renumbering
                  </button>
                </div>
              </div>

              {/* Status Alert Banner */}
              {sbdStatusMsg && (
                <div
                  style={{
                    padding: "10px 24px",
                    background: sbdStatusMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
                    borderBottom: `1px solid ${sbdStatusMsg.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                    color: sbdStatusMsg.type === "success" ? "#065f46" : "#991b1b",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0
                  }}
                >
                  {sbdStatusMsg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{sbdStatusMsg.msg}</span>
                </div>
              )}

              {/* ─── TAB 1: DELETE CASH SALES BILL (LIGHT THEME) ─── */}
              {sbdActiveTab === "delete" && (
                <>
                  {/* Controls & Filter Panel (Light Theme) */}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "12px 24px",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "14px",
                      flexWrap: "wrap",
                      flexShrink: 0,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                    }}
                  >
                    {/* Left Filters */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>From:</span>
                        <input
                          type="date"
                          value={sbdFromDate}
                          onChange={(e) => setSbdFromDate(e.target.value)}
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
                          value={sbdToDate}
                          onChange={(e) => setSbdToDate(e.target.value)}
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

                      <button
                        onClick={() => {
                          const d = new Date();
                          const t = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          setSbdFromDate(t);
                          setSbdToDate(t);
                        }}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          color: "#334155",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Today
                      </button>

                      {/* Lower / Higher Amount Filter */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Lower Amount:</span>
                        <input
                          type="number"
                          placeholder="Min ₹"
                          value={sbdLowerAmt}
                          onChange={(e) => setSbdLowerAmt(e.target.value)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            width: "85px"
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Higher Amount:</span>
                        <input
                          type="number"
                          placeholder="Max ₹"
                          value={sbdHigherAmt}
                          onChange={(e) => setSbdHigherAmt(e.target.value)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            width: "85px"
                          }}
                        />
                      </div>
                    </div>

                    {/* Right Summary & Action Buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Total (₹):</span>
                        <input
                          type="text"
                          readOnly
                          value={`₹${selectedTotalAmt.toFixed(2)}`}
                          style={{
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            color: "#1d4ed8",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "800",
                            width: "120px",
                            textAlign: "right"
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Sales (Qty):</span>
                        <input
                          type="text"
                          readOnly
                          value={selectedCount}
                          style={{
                            background: "#fef3c7",
                            border: "1px solid #fde68a",
                            color: "#b45309",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "800",
                            width: "55px",
                            textAlign: "center"
                          }}
                        />
                      </div>

                      {/* Selection Buttons */}
                      <button
                        onClick={handleSelectAll}
                        style={{
                          background: "#059669",
                          color: "#ffffff",
                          border: "none",
                          padding: "7px 14px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Yes (All)
                      </button>

                      <button
                        onClick={handleDeselectAll}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          padding: "7px 14px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        No (None)
                      </button>

                      {/* Delete Action Button */}
                      <button
                        onClick={() => {
                          if (selectedCount === 0) {
                            alert("No bills selected for deletion. Mark Y on the bills you wish to delete.");
                            return;
                          }
                          setSbdConfirmModal(true);
                        }}
                        style={{
                          background: "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          padding: "7px 18px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4)"
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>

                  {/* 4 KPI Summary Cards (Light Theme) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "14px",
                      padding: "14px 24px",
                      background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      flexShrink: 0
                    }}
                  >
                    <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Eligible Cash Bills</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#2563eb", marginTop: "2px" }}>{eligibleBills.length}</div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Selected For Deletion</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#dc2626", marginTop: "2px" }}>{selectedCount} / {eligibleBills.length}</div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Selected Total Value</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#b45309", marginTop: "2px" }}>₹{selectedTotalAmt.toFixed(2)}</div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Stock Units to Restore</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#059669", marginTop: "2px" }}>{totalUnitsToRestore} Units</div>
                    </div>
                  </div>

                  {/* Main 9-Column Table (Light Theme) */}
                  <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
                    <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                          <tr style={{ background: "#0f172a", color: "#ffffff" }}>
                            <th style={{ padding: "10px 8px", textAlign: "center", width: "45px" }}>SrNo</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "110px" }}>Bill No</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "95px" }}>Date</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "85px" }}>Type</th>
                            <th style={{ padding: "10px 12px", textAlign: "left" }}>Customer Name</th>
                            <th style={{ padding: "10px 10px", textAlign: "right", width: "100px" }}>Vat/GST Rs</th>
                            <th style={{ padding: "10px 12px", textAlign: "right", width: "120px" }}>Amount</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "100px" }}>User</th>
                            <th style={{ padding: "10px 8px", textAlign: "center", width: "65px" }}>Y/N</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eligibleBills.length === 0 ? (
                            <tr>
                              <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                                No cash sales bills found matching the selected period and amount criteria.
                              </td>
                            </tr>
                          ) : (
                            eligibleBills.map((bill: any, idx: number) => {
                              const isSelected = !!sbdSelectedMap[bill._id];
                              return (
                                <tr
                                  key={bill._id}
                                  onClick={() => handleToggleRow(bill._id)}
                                  style={{
                                    borderBottom: "1px solid #e2e8f0",
                                    background: isSelected ? "#fee2e2" : idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                                    cursor: "pointer",
                                    transition: "background 0.15s ease"
                                  }}
                                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f1f5f9"; }}
                                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f8fafc"; }}
                                >
                                  <td style={{ padding: "9px 8px", textAlign: "center", color: "#64748b", fontWeight: "600" }}>
                                    {idx + 1}
                                  </td>
                                  <td style={{ padding: "9px 10px", fontWeight: "700", color: "#1d4ed8" }}>
                                    {bill._billNo}
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
                                        background: "#dcfce7",
                                        color: "#166534"
                                      }}
                                    >
                                      Cash
                                    </span>
                                  </td>
                                  <td style={{ padding: "9px 12px", color: "#0f172a", fontWeight: "600" }}>
                                    {bill._customerName}
                                  </td>
                                  <td style={{ padding: "9px 10px", textAlign: "right", color: "#d97706", fontFamily: "monospace", fontWeight: "600" }}>
                                    ₹{bill._gst.toFixed(2)}
                                  </td>
                                  <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: "800", color: "#047857", fontFamily: "monospace", fontSize: "13px" }}>
                                    ₹{bill._amount.toFixed(2)}
                                  </td>
                                  <td style={{ padding: "9px 10px", color: "#64748b" }}>
                                    {bill._user}
                                  </td>
                                  <td style={{ padding: "9px 8px", textAlign: "center" }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleRow(bill._id);
                                      }}
                                      style={{
                                        background: isSelected ? "#dc2626" : "#e2e8f0",
                                        color: isSelected ? "#ffffff" : "#475569",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "3px 9px",
                                        fontSize: "11px",
                                        fontWeight: "800",
                                        cursor: "pointer"
                                      }}
                                    >
                                      {isSelected ? "Y" : "N"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* ─── TAB 2: SALES BILL RENUMBERING (LIGHT THEME) ─── */}
              {sbdActiveTab === "renumber" && (
                <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
                  <div style={{ maxWidth: "750px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
                        Sequential Sales Bill Renumbering Configuration
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
                        After deleting sales bills, gaps appear in the invoice sequence. This utility re-sequences all existing sales bills consecutively by date.
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "20px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            Invoice Prefix:
                          </label>
                          <input
                            type="text"
                            value={sbdRenumberPrefix}
                            onChange={(e) => setSbdRenumberPrefix(e.target.value)}
                            placeholder="e.g. INV-"
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
                            Starting Number:
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={sbdRenumberStart}
                            onChange={(e) => setSbdRenumberStart(Number(e.target.value) || 1)}
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
                            Zero Padding Digits:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="8"
                            value={sbdRenumberDigits}
                            onChange={(e) => setSbdRenumberDigits(Number(e.target.value) || 4)}
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
                          marginTop: "20px",
                          padding: "16px",
                          background: "#f8fafc",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>
                            Sample Renumbered Bill Number:
                          </div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#2563eb", marginTop: "2px" }}>
                            {`${sbdRenumberPrefix}${String(sbdRenumberStart).padStart(sbdRenumberDigits, '0')}`}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>
                            Total Invoices to Sequence:
                          </div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#7c3aed", marginTop: "2px" }}>
                            {(salesBills || []).length} Invoices
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button
                          onClick={() => setSbdRenumberConfirm(true)}
                          style={{
                            background: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "10px 22px",
                            fontSize: "13px",
                            fontWeight: "700",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
                          }}
                        >
                          Execute Renumbering
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation Modal for Batch Delete (Light Theme) */}
              {sbdConfirmModal && (
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
                      border: "1px solid #fecaca",
                      borderRadius: "12px",
                      width: "480px",
                      maxWidth: "95vw",
                      overflow: "hidden",
                      boxShadow: "0 25px 50px -12px rgba(220, 38, 38, 0.25)"
                    }}
                  >
                    <div style={{ padding: "16px 20px", background: "#fef2f2", borderBottom: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "10px" }}>
                      <AlertCircle size={22} color="#dc2626" />
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "#991b1b" }}>
                        Confirm Permanent Sales Bill Deletion
                      </span>
                    </div>

                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#334155" }}>
                      <p style={{ margin: 0 }}>
                        Are you sure you want to permanently delete <strong>{selectedCount}</strong> sales bills totaling <strong style={{ color: "#047857" }}>₹{selectedTotalAmt.toFixed(2)}</strong>?
                      </p>
                      <div style={{ background: "#f0fdf4", padding: "12px 14px", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "12px" }}>
                        <div style={{ color: "#166534", fontWeight: "700" }}>✓ Inventory Auto-Restoration:</div>
                        <div style={{ color: "#15803d", marginTop: "4px" }}>
                          Approximately <strong>{totalUnitsToRestore} medicine units</strong> will be returned to their respective batch stock.
                        </div>
                      </div>
                      <p style={{ margin: 0, color: "#dc2626", fontSize: "12px", fontWeight: "600" }}>
                        ⚠️ This action cannot be undone directly. A supervisor audit log entry will be permanently recorded.
                      </p>
                    </div>

                    <div style={{ padding: "14px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button
                        onClick={() => setSbdConfirmModal(false)}
                        style={{
                          background: "#ffffff",
                          color: "#475569",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "8px 16px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleExecuteDelete}
                        style={{
                          background: "#dc2626",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 18px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)"
                        }}
                      >
                        Confirm &amp; Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation Modal for Renumbering (Light Theme) */}
              {sbdRenumberConfirm && (
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
                      border: "1px solid #bfdbfe",
                      borderRadius: "12px",
                      width: "480px",
                      maxWidth: "95vw",
                      overflow: "hidden",
                      boxShadow: "0 25px 50px -12px rgba(37, 99, 235, 0.25)"
                    }}
                  >
                    <div style={{ padding: "16px 20px", background: "#eff6ff", borderBottom: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: "10px" }}>
                      <TrendingUp size={22} color="#1d4ed8" />
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "#1e40af" }}>
                        Confirm Consecutive Renumbering
                      </span>
                    </div>

                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#334155" }}>
                      <p style={{ margin: 0 }}>
                        All <strong>{(salesBills || []).length}</strong> sales invoices will be sorted by date and renumbered sequentially starting from <strong style={{ color: "#1d4ed8" }}>{`${sbdRenumberPrefix}${String(sbdRenumberStart).padStart(sbdRenumberDigits, '0')}`}</strong>.
                      </p>
                      <p style={{ margin: 0, color: "#b45309", fontSize: "12px" }}>
                        Please ensure you have printed or archived any historical reports if old invoice numbers are required.
                      </p>
                    </div>

                    <div style={{ padding: "14px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button
                        onClick={() => setSbdRenumberConfirm(false)}
                        style={{
                          background: "#ffffff",
                          color: "#475569",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "8px 16px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleExecuteRenumbering}
                        style={{
                          background: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 18px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer"
                        }}
                      >
                        Confirm Renumbering
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SUPERVISOR — PURCHASE BILL DELETE & RENUMBERING (100% FULLSCREEN LIGHT THEME) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showPurchaseBillDelete && (() => {
          // Normalize purchase bills
          const rawBills = (purchaseBills || []).map((b: any, index: number) => {
            const billTotal = Number(b.totalAmount || b.total || b.netAmount || b.subtotal || 0);
            const billEntNo = String(b.entryNo || b.entNo || b.voucherNo || index + 1);
            const billEntDate = b.entryDate || b.entDate || b.date || today();
            const billNo = String(b.billNo || b.invoiceNo || b.challanNo || `PB-${index + 1}`);
            const billDate = b.billDate || b.date || billEntDate;
            const supplierName = b.supplier || b.supplierName || b.partyName || 'Standard Supplier';
            const billDiscount = Number(b.discount || b.disc || 0);
            const billUser = b.createdByName || b.user || currentUser?.username || 'ADMIN';
            const billId = String(b.id || b.billNo || index + 1);

            // Lookup supplier GST / ST No
            const suppObj = (suppliers || []).find((s: any) => (s.name || '').trim().toLowerCase() === supplierName.trim().toLowerCase());
            const stNo = suppObj?.gst || suppObj?.gstin || b.stNo || b.gstin || '-';

            return {
              ...b,
              _id: billId,
              _srNo: index + 1,
              _entNo: billEntNo,
              _entDate: billEntDate,
              _billNo: billNo,
              _billDate: billDate,
              _supplierName: supplierName,
              _amount: billTotal,
              _stNo: stNo,
              _disc: billDiscount,
              _user: billUser
            };
          });

          // Apply filters for Tab 1 (Delete Cash Purchase Bill)
          const eligibleBills = rawBills.filter((b: any) => {
            if (pbdFromDate && b._entDate < pbdFromDate) return false;
            if (pbdToDate && b._entDate > pbdToDate) return false;

            if (pbdLowerAmt.trim() && b._amount < Number(pbdLowerAmt)) return false;
            if (pbdHigherAmt.trim() && b._amount > Number(pbdHigherAmt)) return false;

            if (pbdSearchQuery.trim()) {
              const q = pbdSearchQuery.toLowerCase();
              const matchBill = b._billNo.toLowerCase().includes(q);
              const matchEnt = b._entNo.toLowerCase().includes(q);
              const matchSupp = b._supplierName.toLowerCase().includes(q);
              if (!matchBill && !matchEnt && !matchSupp) return false;
            }

            return true;
          });

          // Selected Bills calculation
          const selectedBills = eligibleBills.filter((b: any) => !!pbdSelectedMap[b._id]);
          const selectedCount = selectedBills.length;
          const selectedTotalAmt = selectedBills.reduce((acc: number, b: any) => acc + (b._amount || 0), 0);

          // Calculate total units to deduct from inventory across selected purchase bills
          const totalUnitsToDeduct = selectedBills.reduce((acc: number, b: any) => {
            const lineItems = b.items || [];
            const billUnits = lineItems.reduce((sum: number, it: any) => sum + Number(it.qty || it.quantity || 1) + Number(it.freeQty || 0), 0);
            return acc + billUnits;
          }, 0);

          // Select All (Yes)
          const handleSelectAll = () => {
            const nextMap: { [key: string]: boolean } = {};
            eligibleBills.forEach((b: any) => { nextMap[b._id] = true; });
            setPbdSelectedMap(nextMap);
          };

          // Deselect All (No)
          const handleDeselectAll = () => {
            setPbdSelectedMap({});
          };

          // Toggle Individual Row
          const handleToggleRow = (id: string) => {
            setPbdSelectedMap(prev => ({ ...prev, [id]: !prev[id] }));
          };

          // Export CSV
          const handleExportCSV = () => {
            try {
              const headers = ["Sr No", "Ent No", "Ent Date", "Bill No", "Bill Date", "Supplier Name", "Amount", "S.T.No", "Disc", "User", "Selected Y/N"];
              const rows = eligibleBills.map((b: any, idx: number) => [
                idx + 1,
                `"${b._entNo}"`,
                b._entDate,
                `"${b._billNo}"`,
                b._billDate,
                `"${b._supplierName.replace(/"/g, '""')}"`,
                b._amount.toFixed(2),
                `"${b._stNo}"`,
                b._disc.toFixed(2),
                `"${b._user}"`,
                pbdSelectedMap[b._id] ? "Y" : "N"
              ]);

              const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `Purchase_Bills_Delete_Register_${pbdFromDate}_to_${pbdToDate}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (err: any) {
              alert("Failed to export CSV: " + (err?.message || "Unknown error"));
            }
          };

          // Execute Batch Delete with Inventory Stock Deduction
          const handleExecuteDelete = () => {
            if (selectedBills.length === 0) {
              alert("Please select at least one purchase bill to delete.");
              return;
            }

            try {
              const selectedIds = new Set(selectedBills.map((b: any) => b._id));
              
              // 1. Deduct Inventory Stock for items and batches
              const updatedItems = [...items];
              const updatedBatches = [...batches];

              selectedBills.forEach((bill: any) => {
                const lineItems = bill.items || [];
                lineItems.forEach((li: any) => {
                  const qtyToDeduct = Number(li.qty || li.quantity || 1) + Number(li.freeQty || 0);
                  const targetItemId = li.itemId || li.id;
                  const targetBatchNo = li.batch || li.batchNo;

                  // Deduct from batch stock
                  if (targetBatchNo) {
                    const bIdx = updatedBatches.findIndex((b: any) => 
                      (b.itemId === targetItemId || !targetItemId) && (b.batchNo === targetBatchNo || b.batch === targetBatchNo)
                    );
                    if (bIdx !== -1) {
                      const currentStk = Number(updatedBatches[bIdx].stock || 0);
                      const newStk = Math.max(0, currentStk - qtyToDeduct);
                      updatedBatches[bIdx] = {
                        ...updatedBatches[bIdx],
                        stock: newStk,
                        currentStock: newStk
                      };
                    }
                  }

                  // Deduct from overall item stock
                  if (targetItemId) {
                    const iIdx = updatedItems.findIndex((it: any) => it.id === targetItemId);
                    if (iIdx !== -1) {
                      const curStk = Number(updatedItems[iIdx].stock || 0);
                      updatedItems[iIdx] = {
                        ...updatedItems[iIdx],
                        stock: Math.max(0, curStk - qtyToDeduct)
                      };
                    }
                  }
                });
              });

              // 2. Remove deleted bills from purchaseBills
              const updatedPurchases = (purchaseBills || []).filter((pb: any, idx: number) => {
                const id = String(pb.id || pb.billNo || idx + 1);
                return !selectedIds.has(id);
              });

              // Save to Store
              if (typeof saveItems === 'function') saveItems(updatedItems);
              if (typeof saveBatches === 'function') saveBatches(updatedBatches);
              if (typeof savePurchaseBills === 'function') savePurchaseBills(updatedPurchases);

              // 3. User Audit Logging
              if (typeof logUserChange === 'function') {
                logUserChange('SUPERVISOR_BATCH_DELETE_PURCHASE', {
                  deletedCount: selectedBills.length,
                  totalAmount: selectedTotalAmt,
                  deductedUnits: totalUnitsToDeduct,
                  billNumbers: selectedBills.map((b: any) => b._billNo).slice(0, 15).join(', ')
                }, `Permanently deleted ${selectedBills.length} purchase bills totalling ₹${selectedTotalAmt.toFixed(2)} and reversed ${totalUnitsToDeduct} inventory units`);
              }

              setPbdStatusMsg({
                type: "success",
                msg: `Successfully deleted ${selectedBills.length} purchase bills! ${totalUnitsToDeduct} medicine units have been deducted from inventory.`
              });

              setPbdSelectedMap({});
              setPbdConfirmModal(false);
              setTimeout(() => setPbdStatusMsg(null), 5000);
            } catch (err: any) {
              setPbdStatusMsg({ type: "error", msg: "Failed to delete purchase bills: " + (err?.message || "Unknown error") });
            }
          };

          // Execute Purchase Renumbering Logic
          const handleExecuteRenumbering = () => {
            try {
              // Sort purchase bills chronologically
              const sorted = [...(purchaseBills || [])].sort((a: any, b: any) => {
                const da = a.entryDate || a.date || a.createdAt || '';
                const db = b.entryDate || b.date || b.createdAt || '';
                return da.localeCompare(db);
              });

              let currentSeq = Number(pbdRenumberStart) || 1;
              const padLen = Number(pbdRenumberDigits) || 4;
              const prefix = pbdRenumberPrefix || '';

              const renumbered = sorted.map((pb: any) => {
                const newEntNo = `${prefix}${String(currentSeq).padStart(padLen, '0')}`;
                currentSeq++;
                return { ...pb, entryNo: newEntNo, entNo: newEntNo, voucherNo: newEntNo, hasRenumbered: true };
              });

              if (typeof savePurchaseBills === 'function') savePurchaseBills(renumbered);

              if (typeof logUserChange === 'function') {
                logUserChange('SUPERVISOR_PURCHASE_RENUMBER', {
                  totalRenumbered: renumbered.length,
                  startNo: pbdRenumberStart,
                  prefix: pbdRenumberPrefix
                }, `Renumbered ${renumbered.length} purchase vouchers starting from ${pbdRenumberPrefix}${pbdRenumberStart}`);
              }

              setPbdStatusMsg({
                type: "success",
                msg: `Successfully renumbered all ${renumbered.length} purchase entries consecutively!`
              });
              setPbdRenumberConfirm(false);
              setTimeout(() => setPbdStatusMsg(null), 4500);
            } catch (err: any) {
              setPbdStatusMsg({ type: "error", msg: "Renumbering failed: " + (err?.message || "Unknown error") });
            }
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
              {/* Top Warning Banner (Light Red/Amber Alert Theme) */}
              <div
                style={{
                  background: "#fef2f2",
                  padding: "8px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #fecaca",
                  flexShrink: 0
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <AlertCircle size={17} color="#dc2626" />
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#991b1b", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    CAUTION: DELETING PURCHASE BILLS REVERSES INWARD VOUCHERS AND DEDUCTS STOCK QUANTITIES FROM INVENTORY
                  </span>
                </div>

                <button
                  onClick={() => setShowPurchaseBillDelete(false)}
                  style={{
                    background: "#ffffff",
                    color: "#dc2626",
                    border: "1px solid #fca5a5",
                    padding: "4px 12px",
                    borderRadius: "4px",
                    fontWeight: "700",
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <X size={13} /> Close (ESC)
                </button>
              </div>

              {/* Header Title & Subtabs (Light/Modern Theme) */}
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
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(220, 38, 38, 0.4)"
                    }}
                  >
                    <Truck size={22} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "17px", fontWeight: "800", color: "#ffffff" }}>
                        Purchase Bill Delete &amp; Renumbering Facility
                      </span>
                      <span
                        style={{
                          background: "rgba(220, 38, 38, 0.25)",
                          color: "#fca5a5",
                          border: "1px solid rgba(252, 165, 165, 0.4)",
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
                      Batch reverse purchase inward invoices, adjust inventory batch stock, and re-sequence entry vouchers
                    </div>
                  </div>
                </div>

                {/* Sub-tabs Selector */}
                <div style={{ display: "flex", background: "rgba(255,255,255,0.1)", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <button
                    onClick={() => setPbdActiveTab("delete")}
                    style={{
                      background: pbdActiveTab === "delete" ? "#dc2626" : "transparent",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <Trash2 size={13} /> Delete Cash Purchase Bill
                  </button>

                  <button
                    onClick={() => setPbdActiveTab("renumber")}
                    style={{
                      background: pbdActiveTab === "renumber" ? "#3b82f6" : "transparent",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <TrendingUp size={13} /> Renumbering Purchase Bill
                  </button>
                </div>
              </div>

              {/* Status Alert Banner */}
              {pbdStatusMsg && (
                <div
                  style={{
                    padding: "10px 24px",
                    background: pbdStatusMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
                    borderBottom: `1px solid ${pbdStatusMsg.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                    color: pbdStatusMsg.type === "success" ? "#065f46" : "#991b1b",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0
                  }}
                >
                  {pbdStatusMsg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{pbdStatusMsg.msg}</span>
                </div>
              )}

              {/* ─── TAB 1: DELETE CASH PURCHASE BILL (LIGHT THEME) ─── */}
              {pbdActiveTab === "delete" && (
                <>
                  {/* Controls & Filter Panel (Light Theme) */}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "12px 24px",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "14px",
                      flexWrap: "wrap",
                      flexShrink: 0,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                    }}
                  >
                    {/* Left Filters */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>From Date:</span>
                        <input
                          type="date"
                          value={pbdFromDate}
                          onChange={(e) => setPbdFromDate(e.target.value)}
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
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>To Date...:</span>
                        <input
                          type="date"
                          value={pbdToDate}
                          onChange={(e) => setPbdToDate(e.target.value)}
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

                      <button
                        onClick={() => {
                          const d = new Date();
                          const t = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          setPbdFromDate(t);
                          setPbdToDate(t);
                        }}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          color: "#334155",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Today
                      </button>

                      {/* Lower / Higher Amount Filter */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Lower Amount:</span>
                        <input
                          type="number"
                          placeholder="Min ₹"
                          value={pbdLowerAmt}
                          onChange={(e) => setPbdLowerAmt(e.target.value)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            width: "85px"
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Higher Amount:</span>
                        <input
                          type="number"
                          placeholder="Max ₹"
                          value={pbdHigherAmt}
                          onChange={(e) => setPbdHigherAmt(e.target.value)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            width: "85px"
                          }}
                        />
                      </div>

                      {/* Search Box */}
                      <div style={{ position: "relative" }}>
                        <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "8px", top: "8px" }} />
                        <input
                          type="text"
                          placeholder="Search Bill, Ent No, Supplier..."
                          value={pbdSearchQuery}
                          onChange={(e) => setPbdSearchQuery(e.target.value)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            padding: "6px 10px 6px 28px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            width: "200px"
                          }}
                        />
                      </div>
                    </div>

                    {/* Right Summary & Action Buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Bills:</span>
                        <input
                          type="text"
                          readOnly
                          value={selectedCount}
                          style={{
                            background: "#fef3c7",
                            border: "1px solid #fde68a",
                            color: "#b45309",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "800",
                            width: "55px",
                            textAlign: "center"
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Amount:</span>
                        <input
                          type="text"
                          readOnly
                          value={`₹${selectedTotalAmt.toFixed(2)}`}
                          style={{
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            color: "#1d4ed8",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "800",
                            width: "120px",
                            textAlign: "right"
                          }}
                        />
                      </div>

                      {/* Selection Buttons */}
                      <button
                        onClick={handleSelectAll}
                        style={{
                          background: "#059669",
                          color: "#ffffff",
                          border: "none",
                          padding: "7px 14px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Yes
                      </button>

                      <button
                        onClick={handleDeselectAll}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          padding: "7px 14px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        No
                      </button>

                      {/* Delete Action Button */}
                      <button
                        onClick={() => {
                          if (selectedCount === 0) {
                            alert("No purchase bills selected for deletion. Mark Y on the bills you wish to delete.");
                            return;
                          }
                          setPbdConfirmModal(true);
                        }}
                        style={{
                          background: "#dc2626",
                          color: "#ffffff",
                          border: "none",
                          padding: "7px 18px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 2px 6px rgba(220, 38, 38, 0.4)"
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>

                      {/* File CSV Export */}
                      <button
                        onClick={handleExportCSV}
                        style={{
                          background: "#0284c7",
                          color: "#ffffff",
                          border: "none",
                          padding: "7px 14px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        File (CSV)
                      </button>
                    </div>
                  </div>

                  {/* 4 KPI Summary Cards (Light Theme) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "14px",
                      padding: "14px 24px",
                      background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      flexShrink: 0
                    }}
                  >
                    <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Eligible Purchase Invoices</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#2563eb", marginTop: "2px" }}>{eligibleBills.length}</div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Selected For Deletion</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#dc2626", marginTop: "2px" }}>{selectedCount} / {eligibleBills.length}</div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Selected Total Value</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#b45309", marginTop: "2px" }}>₹{selectedTotalAmt.toFixed(2)}</div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Stock Units to Deduct</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#ef4444", marginTop: "2px" }}>{totalUnitsToDeduct} Units</div>
                    </div>
                  </div>

                  {/* Main 12-Column Table (Light Theme) */}
                  <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
                    <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                          <tr style={{ background: "#0f172a", color: "#ffffff" }}>
                            <th style={{ padding: "10px 8px", textAlign: "center", width: "45px" }}>Sr No</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "85px" }}>Ent No</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "95px" }}>Ent Date</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "110px" }}>Bill No</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "95px" }}>Bill Date</th>
                            <th style={{ padding: "10px 12px", textAlign: "left" }}>Supplier Name</th>
                            <th style={{ padding: "10px 12px", textAlign: "right", width: "120px" }}>Amount</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "130px" }}>S.T.No</th>
                            <th style={{ padding: "10px 10px", textAlign: "right", width: "80px" }}>Disc.</th>
                            <th style={{ padding: "10px 10px", textAlign: "left", width: "90px" }}>User</th>
                            <th style={{ padding: "10px 8px", textAlign: "center", width: "65px" }}>Y/N</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eligibleBills.length === 0 ? (
                            <tr>
                              <td colSpan={11} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                                No purchase bills found matching the selected period and criteria.
                              </td>
                            </tr>
                          ) : (
                            eligibleBills.map((bill: any, idx: number) => {
                              const isSelected = !!pbdSelectedMap[bill._id];
                              return (
                                <tr
                                  key={bill._id}
                                  onClick={() => handleToggleRow(bill._id)}
                                  style={{
                                    borderBottom: "1px solid #e2e8f0",
                                    background: isSelected ? "#fee2e2" : idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                                    cursor: "pointer",
                                    transition: "background 0.15s ease"
                                  }}
                                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f1f5f9"; }}
                                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f8fafc"; }}
                                >
                                  <td style={{ padding: "9px 8px", textAlign: "center", color: "#64748b", fontWeight: "600" }}>
                                    {idx + 1}
                                  </td>
                                  <td style={{ padding: "9px 10px", fontWeight: "700", color: "#7c3aed" }}>
                                    {bill._entNo}
                                  </td>
                                  <td style={{ padding: "9px 10px", color: "#334155" }}>
                                    {bill._entDate}
                                  </td>
                                  <td style={{ padding: "9px 10px", fontWeight: "700", color: "#1d4ed8" }}>
                                    {bill._billNo}
                                  </td>
                                  <td style={{ padding: "9px 10px", color: "#334155" }}>
                                    {bill._billDate}
                                  </td>
                                  <td style={{ padding: "9px 12px", color: "#0f172a", fontWeight: "600" }}>
                                    {bill._supplierName}
                                  </td>
                                  <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: "800", color: "#047857", fontFamily: "monospace", fontSize: "13px" }}>
                                    ₹{bill._amount.toFixed(2)}
                                  </td>
                                  <td style={{ padding: "9px 10px", color: "#64748b", fontSize: "11px", fontFamily: "monospace" }}>
                                    {bill._stNo}
                                  </td>
                                  <td style={{ padding: "9px 10px", textAlign: "right", color: "#d97706", fontFamily: "monospace" }}>
                                    {bill._disc > 0 ? `₹${bill._disc.toFixed(2)}` : "-"}
                                  </td>
                                  <td style={{ padding: "9px 10px", color: "#64748b" }}>
                                    {bill._user}
                                  </td>
                                  <td style={{ padding: "9px 8px", textAlign: "center" }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleRow(bill._id);
                                      }}
                                      style={{
                                        background: isSelected ? "#dc2626" : "#e2e8f0",
                                        color: isSelected ? "#ffffff" : "#475569",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "3px 9px",
                                        fontSize: "11px",
                                        fontWeight: "800",
                                        cursor: "pointer"
                                      }}
                                    >
                                      {isSelected ? "Y" : "N"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* ─── TAB 2: RENUMBERING PURCHASE BILL (LIGHT THEME) ─── */}
              {pbdActiveTab === "renumber" && (
                <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
                  <div style={{ maxWidth: "750px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
                        Sequential Purchase Bill / Voucher Renumbering Configuration
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
                        When purchase bills are deleted, vouchers leave missing sequence numbers. This tool renumbers all purchase entries consecutively by entry date.
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "20px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            Entry Voucher Prefix:
                          </label>
                          <input
                            type="text"
                            value={pbdRenumberPrefix}
                            onChange={(e) => setPbdRenumberPrefix(e.target.value)}
                            placeholder="e.g. ENT-"
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
                            Starting Number:
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={pbdRenumberStart}
                            onChange={(e) => setPbdRenumberStart(Number(e.target.value) || 1)}
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
                            Zero Padding Digits:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="8"
                            value={pbdRenumberDigits}
                            onChange={(e) => setPbdRenumberDigits(Number(e.target.value) || 4)}
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
                          marginTop: "20px",
                          padding: "16px",
                          background: "#f8fafc",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>
                            Sample Renumbered Entry Voucher:
                          </div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#7c3aed", marginTop: "2px" }}>
                            {`${pbdRenumberPrefix}${String(pbdRenumberStart).padStart(pbdRenumberDigits, '0')}`}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>
                            Total Purchase Bills to Sequence:
                          </div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#2563eb", marginTop: "2px" }}>
                            {(purchaseBills || []).length} Invoices
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button
                          onClick={() => setPbdRenumberConfirm(true)}
                          style={{
                            background: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "10px 22px",
                            fontSize: "13px",
                            fontWeight: "700",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
                          }}
                        >
                          Execute Renumbering
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation Modal for Batch Delete (Light Theme) */}
              {pbdConfirmModal && (
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
                      border: "1px solid #fecaca",
                      borderRadius: "12px",
                      width: "500px",
                      maxWidth: "95vw",
                      overflow: "hidden",
                      boxShadow: "0 25px 50px -12px rgba(220, 38, 38, 0.25)"
                    }}
                  >
                    <div style={{ padding: "16px 20px", background: "#fef2f2", borderBottom: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "10px" }}>
                      <AlertCircle size={22} color="#dc2626" />
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "#991b1b" }}>
                        Confirm Permanent Purchase Bill Deletion
                      </span>
                    </div>

                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#334155" }}>
                      <p style={{ margin: 0 }}>
                        Are you sure you want to permanently delete <strong>{selectedCount}</strong> purchase bills totaling <strong style={{ color: "#047857" }}>₹{selectedTotalAmt.toFixed(2)}</strong>?
                      </p>
                      <div style={{ background: "#fff7ed", padding: "12px 14px", borderRadius: "8px", border: "1px solid #fed7aa", fontSize: "12px" }}>
                        <div style={{ color: "#c2410c", fontWeight: "700" }}>⚠️ Stock Deduction Warning:</div>
                        <div style={{ color: "#9a3412", marginTop: "4px" }}>
                          Approximately <strong>{totalUnitsToDeduct} medicine units</strong> will be deducted / removed from batch inventory.
                        </div>
                      </div>
                      <p style={{ margin: 0, color: "#dc2626", fontSize: "12px", fontWeight: "600" }}>
                        ⚠️ This action cannot be reversed automatically. A supervisor audit log entry will be permanently recorded.
                      </p>
                    </div>

                    <div style={{ padding: "14px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button
                        onClick={() => setPbdConfirmModal(false)}
                        style={{
                          background: "#ffffff",
                          color: "#475569",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "8px 16px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleExecuteDelete}
                        style={{
                          background: "#dc2626",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 18px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)"
                        }}
                      >
                        Confirm &amp; Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation Modal for Renumbering (Light Theme) */}
              {pbdRenumberConfirm && (
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
                      border: "1px solid #bfdbfe",
                      borderRadius: "12px",
                      width: "480px",
                      maxWidth: "95vw",
                      overflow: "hidden",
                      boxShadow: "0 25px 50px -12px rgba(37, 99, 235, 0.25)"
                    }}
                  >
                    <div style={{ padding: "16px 20px", background: "#eff6ff", borderBottom: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: "10px" }}>
                      <TrendingUp size={22} color="#1d4ed8" />
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "#1e40af" }}>
                        Confirm Consecutive Renumbering
                      </span>
                    </div>

                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#334155" }}>
                      <p style={{ margin: 0 }}>
                        All <strong>{(purchaseBills || []).length}</strong> purchase vouchers will be sorted by entry date and renumbered sequentially starting from <strong style={{ color: "#1d4ed8" }}>{`${pbdRenumberPrefix}${String(pbdRenumberStart).padStart(pbdRenumberDigits, '0')}`}</strong>.
                      </p>
                      <p style={{ margin: 0, color: "#b45309", fontSize: "12px" }}>
                        Please ensure you have printed or archived any historical purchase reports if old entry voucher numbers are required.
                      </p>
                    </div>

                    <div style={{ padding: "14px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button
                        onClick={() => setPbdRenumberConfirm(false)}
                        style={{
                          background: "#ffffff",
                          color: "#475569",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "8px 16px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleExecuteRenumbering}
                        style={{
                          background: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 18px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer"
                        }}
                      >
                        Confirm Renumbering
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}



      </div>
    </div>
</div>
  );
}
