// @ts-nocheck
/* eslint-disable */
import React, { createContext, useContext, useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════
// CONSTANTS  (shared between Owner & Customer)
// ═══════════════════════════════════════════════════
export const DIVISIONS = [
  { id: "medicines", label: "Medicines", icon: "💊", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", desc: "Tablets, Syrups, Capsules" },
  { id: "surgical", label: "Surgical Items", icon: "🩺", color: "#ef4444", bg: "#fef2f2", border: "#fecaca", desc: "Bandage, Syringe, Gloves" },
  { id: "cosmetics", label: "Cosmetics", icon: "✨", color: "#ec4899", bg: "#fdf2f8", border: "#f9a8d4", desc: "Skin Care, Hair Care" },
  { id: "baby", label: "Baby Products", icon: "🍼", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", desc: "Diapers, Baby Food" },
  { id: "devices", label: "Health Devices", icon: "🩻", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", desc: "BP Machine, Thermometer" },
  { id: "vitamins", label: "Vitamins & Supplements", icon: "💪", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", desc: "Multivitamins, Protein" },
  { id: "ayurvedic", label: "Ayurvedic / Herbal", icon: "🌿", color: "#65a30d", bg: "#f7fee7", border: "#bef264", desc: "Herbal, Churna, Kadha" },
  { id: "otc", label: "OTC Products", icon: "🏥", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc", desc: "Over the Counter" },
];

export const STATUS_STYLE = {
  Pending: { bg: "#dbeafe", color: "#1d4ed8" },
  Ready: { bg: "#fef9c3", color: "#854d0e" },
  Delivered: { bg: "#d1fae5", color: "#065f46" },
  Cancelled: { bg: "#fee2e2", color: "#991b1b" },
  Paid: { bg: "#d1fae5", color: "#065f46" },
  Credit: { bg: "#fef9c3", color: "#854d0e" },
};

export const GST_RATES = [0, 5, 18];

export const MENU_RIGHTS_LIST = [
  "Item Master", "Account Master", "Doctor Master", "Company Master", "Area Master",
  "Sales Bill", "Purchase Bill", "Sales Receipt", "Purchase Payment",
  "Cash Entry", "Bank Entry", "Delete Sales Bill", "Delete Purchase Bill",
  "Sales Report", "Stock Report", "GST Report", "Ledger Account", "Expiry List",
  "Today Status", "User Master", "Group Rights", "App Setup", "Lock Bill", "Security Audit Logs"
];

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
export const nowStr = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + ":" + String(d.getSeconds()).padStart(2, "0"); };
export const fmt = (n, d = 2) => (parseFloat(n) || 0).toFixed(d);
export const num = (v) => parseFloat(v) || 0;
export const int = (v) => parseInt(v) || 0;

// ═══════════════════════════════════════════════════
// SHARED STYLES (exported so panels can use same look)
// ═══════════════════════════════════════════════════
export const inp: React.CSSProperties = { width: "100%", padding: "4px 8px", border: "1px solid var(--color-border)", borderRadius: "6px", fontSize: "12px", height: "28px", outline: "none", fontFamily: "var(--font-family)", background: "white", boxSizing: "border-box", color: "var(--color-text-dark)", textTransform: "uppercase", transition: "border-color 0.2s" };
export const lbl: React.CSSProperties = { display: "block", marginBottom: "3px", fontWeight: "600", fontSize: "11px", color: "var(--color-text-muted)" };
export const btn = (bg = "var(--color-primary)", c = "var(--color-text-dark)"): React.CSSProperties => ({ background: bg, color: c, border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "500", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s", boxShadow: "var(--shadow-sm)" });

// ═══════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════
const MedicalStoreContext = createContext(null);
export const useMedicalStore = () => useContext(MedicalStoreContext);

// ═══════════════════════════════════════════════════
// PROVIDER — wraps the whole app
// ═══════════════════════════════════════════════════
export function MedicalStoreProvider({ children }) {

  // ─── AUTH STATE ───────────────────────────────────
  const ownerSession = useRef(null);
  const [headerLogoClicks, setHeaderLogoClicks] = useState(0);
  const [hoveredNav, setHoveredNav] = useState(null);
  const headerLogoTimer = useRef(null);
  const [currentUser, setCurrentUser] = useState(() => { try { return JSON.parse(localStorage.getItem('store_currentUser') || 'null'); } catch (_) { return null; } });
  const [customers, setCustomers] = useState((() => { try { return JSON.parse(localStorage.getItem('store_customers') || 'null') || {}; } catch (_) { return {}; } })());
  const [authMode, setAuthMode] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);

  const [showUserMaster, setShowUserMaster] = useState(false);
  const [showGroupRights, setShowGroupRights] = useState(false);
  const [showAppSetup, setShowAppSetup] = useState(false);
  const [appSetupTab, setAppSetupTab] = useState("printing");
  const defaultAppSetupData = {
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

  const [appSetupData, setAppSetupData] = useState(() => {
    try {
      const saved = localStorage.getItem('store_app_setup');
      if (saved) return { ...defaultAppSetupData, ...JSON.parse(saved) };
    } catch (_) {}
    return defaultAppSetupData;
  });

  useEffect(() => {
    try {
      localStorage.setItem('store_app_setup', JSON.stringify(appSetupData));
    } catch (_) {}
  }, [appSetupData]);
  const [grSelectedUser, setGrSelectedUser] = useState(null);
  const [authInput, setAuthInput] = useState({ email: "", password: "", name: "", pharmacyName: "" });
  const [sessionPassword, setSessionPassword] = useState("");
  const [toast, setToast] = useState(null);
  const [grUserRights, setGrUserRights] = useState((() => { try { return JSON.parse(localStorage.getItem('store_gr_rights') || 'null') || {}; } catch (_) { return {}; } })());
  const [appUsers, setAppUsers] = useState((() => { try { return JSON.parse(localStorage.getItem('store_appusers') || 'null') || [
    { id: "u1", loginId: "ADMIN", fullName: "Administrator", userType: "Administrator", description: "", isDefault: false },
    { id: "u2", loginId: "SHIU", fullName: "Shiv", userType: "User", description: "", isDefault: false },
    { id: "u3", loginId: "VIPL", fullName: "VIPL User", userType: "User", description: "", isDefault: false },
  ]; } catch (_) { return []; } })());
  const [userGroups, setUserGroups] = useState((() => { try { return JSON.parse(localStorage.getItem('store_user_groups') || 'null') || [
    { id: "g1", name: "Administrator", users: ["u1"] },
    { id: "g2", name: "User", users: ["u2", "u3"] },
  ]; } catch (_) { return []; } })());
  const [umForm, setUmForm] = useState({ loginId: "", password: "", rePassword: "", fullName: "", userType: "User", description: "", isDefault: false });
  const [umEditId, setUmEditId] = useState(null);
  const [umShowPass, setUmShowPass] = useState(false);
  const [umSelectedUser, setUmSelectedUser] = useState(null);
  const [umGroupForm, setUmGroupForm] = useState("");
  const [umSelectedGroup, setUmSelectedGroup] = useState(null);
  const [umGroupUserSel, setUmGroupUserSel] = useState({});

  const [authStatus, setAuthStatus] = useState<'loading' | 'setup' | 'login'>('loading');
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [regData, setRegData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });

  // ─── GLOBAL DATA ──────────────────────────────────
  const [items, setItems] = useState((() => { try { return JSON.parse(localStorage.getItem('store_items') || 'null') || []; } catch (_) { return []; } })());
  const [batches, setBatches] = useState((() => { try { return JSON.parse(localStorage.getItem('store_batches') || 'null') || []; } catch (_) { return []; } })());
  const [suppliers, setSuppliers] = useState((() => { try { return JSON.parse(localStorage.getItem('store_suppliers') || 'null') || []; } catch (_) { return []; } })());
  const [purchaseBills, setPurchaseBills] = useState((() => { try { return JSON.parse(localStorage.getItem('store_purchaseBills') || 'null') || []; } catch (_) { return []; } })());
  const [salesBills, setSalesBills] = useState((() => { try { return JSON.parse(localStorage.getItem('store_salesBills') || 'null') || []; } catch (_) { return []; } })());
  const [payments, setPayments] = useState((() => { try { return JSON.parse(localStorage.getItem('store_payments') || 'null') || []; } catch (_) { return []; } })());

  // ─── UI STATE ─────────────────────────────────────
  const [activeSection, setActiveSection] = useState("home");
  const [ownerSubTab, setOwnerSubTab] = useState("");
  const [activeCustomerTab, setActiveCustomerTab] = useState("home");

  // ─── INVENTORY ────────────────────────────────────
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({});
  const [itemDivision, setItemDivision] = useState("medicines");
  const [itemSearch, setItemSearch] = useState("");
  const [filterStock, setFilterStock] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [quickStockItem, setQuickStockItem] = useState(null);
  const [quickQty, setQuickQty] = useState("");

  // ─── PURCHASE BILL ────────────────────────────────
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({});
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [expandedPurchase, setExpandedPurchase] = useState(null);
  const [expandedOwnerOrder, setExpandedOwnerOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [showPlans, setShowPlans] = useState(false);
  const [memberPlan, setMemberPlan] = useState(null);
  const [purchaseItemSearch, setPurchaseItemSearch] = useState({});
  const [purchaseItemDropdown, setPurchaseItemDropdown] = useState(null);
  const [purchaseItemHighlight, setPurchaseItemHighlight] = useState({});
  const [purchaseBillSearch, setPurchaseBillSearch] = useState("");

  // ─── SALES BILL (POS) ─────────────────────────────
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [salesForm, setSalesForm] = useState({});
  const [salesItems, setSalesItems] = useState([]);
  const [salesItemSearch, setSalesItemSearch] = useState({});
  const [salesItemDropdown, setSalesItemDropdown] = useState(null);
  const [salesItemHighlight, setSalesItemHighlight] = useState({});
  const [salesDropdownPos, setSalesDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [purchaseDropdownPos, setPurchaseDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [expandedSale, setExpandedSale] = useState(null);
  const [salesBillSearch, setSalesBillSearch] = useState("");
  const [isReturn, setIsReturn] = useState(false);

  // ─── PAYMENTS ─────────────────────────────────────
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({});
  const [paymentSearch, setPaymentSearch] = useState("");

  // ─── SUPPLIER MASTER ──────────────────────────────
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({});
  const [masterSearch, setMasterSearch] = useState("");

  // ─── CUSTOMER CART ────────────────────────────────
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: "", phone: "", address: "", paymentMode: "cash", transactionId: "" });
  const [upiSettings, setUpiSettings] = useState((() => { try { return JSON.parse(localStorage.getItem('store_upiSettings') || 'null') || {}; } catch (_) { return {}; } })());
  const [doctors, setDoctors] = useState((() => { try { return JSON.parse(localStorage.getItem('store_doctors') || 'null') || []; } catch (_) { return []; } })());
  const [doctorForm, setDoctorForm] = useState({ name: "", area: "", mobile: "", speciality: "" });
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [editDoctorId, setEditDoctorId] = useState(null);
  const [reportSubTab, setReportSubTab] = useState("summary");
  const [showUpiSetup, setShowUpiSetup] = useState(false);

  // ─── REPORTS ──────────────────────────────────────
  const [reportPeriod, setReportPeriod] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [menuDropPos, setMenuDropPos] = useState({ top: 24, left: 0 });
  const [printHtml, setPrintHtml] = useState(null);
  const supBtnRef = useRef(null);
  const [supPanelCoords, setSupPanelCoords] = useState({ top: 0, left: 0 });
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [stockReportComp, setStockReportComp] = useState("");
  const [stockReportSupp, setStockReportSupp] = useState("");

  // ─── BANK ENTRY ───────────────────────────────────
  const [bankEntries, setBankEntries] = useState((() => { try { return JSON.parse(localStorage.getItem('store_bankEntries') || 'null') || []; } catch (_) { return []; } })());
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({ date: "", type: "deposit", accountName: "", bank: "", amount: "", chequeNo: "", remark: "" });


  // ─── PURCHASE RETURN ──────────────────────────────
  const [showPurchaseReturnForm, setShowPurchaseReturnForm] = useState(false);
  const [purchaseReturnForm, setPurchaseReturnForm] = useState({ supplierId: "", partyName: "", date: "", refBillNo: "", reason: "Expired", remarks: "" });
  const [purchaseReturnItems, setPurchaseReturnItems] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState((() => { try { return JSON.parse(localStorage.getItem('store_purchase_returns') || 'null') || []; } catch (_) { return []; } })());
  const [purchaseChallans, setPurchaseChallans] = useState((() => { try { return JSON.parse(localStorage.getItem('store_purchase_challans') || 'null') || []; } catch (_) { return []; } })());
  const savePurchaseChallans = async (l, newChallan?: any) => {
    setPurchaseChallans(l);
    localStorage.setItem('store_purchase_challans', JSON.stringify(l));
    // Persist the new challan to MySQL if provided
    if (newChallan) {
      try {
        await fetch(`${API_BASE}/purchase-challans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newChallan)
        });
      } catch (e) { console.error('Failed to save challan to DB:', e); }
    }
  };

  const [showPurchaseChallanForm, setShowPurchaseChallanForm] = useState(false);
  const [purchaseChallanForm, setPurchaseChallanForm] = useState({});
  const [purchaseChallanItems, setPurchaseChallanItems] = useState([]);

  // ─── SUPPLIER LEDGER ──────────────────────────────
  const [showSupplierLedger, setShowSupplierLedger] = useState(false);
  const [ledgerSupplierId, setLedgerSupplierId] = useState(null);

  // ─── BARCODE SCAN ─────────────────────────────────
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeScanTarget, setBarcodeScanTarget] = useState(null);

  // ─── LABEL PRINT ──────────────────────────────────
  const [showLabelPrint, setShowLabelPrint] = useState(false);
  const [labelItem, setLabelItem] = useState(null);
  const [labelQty, setLabelQty] = useState("1");

  const [ownerViewMode, setOwnerViewMode] = useState("owner");
  const [editProfile, setEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: "", phone: "", address: "" });

  // ─── UI DENSITY & SCREEN FIT ──────────────────────
  const [uiScale, setUiScale] = useState(() => {
    try {
      const saved = localStorage.getItem("shivdhara_ui_scale");
      if (saved) return parseFloat(saved);
      if (typeof window !== "undefined" && (window.innerWidth <= 1400 || window.innerHeight <= 850)) {
        return 0.85;
      }
      return 1.0;
    } catch (_) {
      return 1.0;
    }
  });

  const changeUiScale = (newScale: number) => {
    const clamped = Math.max(0.60, Math.min(1.25, Math.round(newScale * 100) / 100));
    setUiScale(clamped);
    try {
      localStorage.setItem("shivdhara_ui_scale", String(clamped));
    } catch (_) { }
  };

  const zoomIn = () => changeUiScale(uiScale + 0.05);
  const zoomOut = () => changeUiScale(uiScale - 0.05);
  const resetZoom = () => changeUiScale(1.0);
  const setPresetScale = (preset: number) => changeUiScale(preset);

  useEffect(() => {
    try {
      document.documentElement.style.zoom = `${Math.round(uiScale * 100)}%`;
      if (uiScale <= 0.88) {
        document.body.classList.add("density-compact");
      } else {
        document.body.classList.remove("density-compact");
      }
    } catch (e) {
      console.error("Scale error:", e);
    }
  }, [uiScale]);

  useEffect(() => {
    const handleKeyZoom = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          zoomOut();
        } else if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          zoomIn();
        } else if (e.key === "0") {
          e.preventDefault();
          resetZoom();
        }
      }
    };
    window.addEventListener("keydown", handleKeyZoom);
    return () => window.removeEventListener("keydown", handleKeyZoom);
  }, [uiScale]);

  // ─── KHATA / UDHAR SYSTEM ─────────────────────────
  const [khataEntries, setKhataEntries] = useState((() => { try { return JSON.parse(localStorage.getItem('store_khata') || 'null') || []; } catch (_) { return []; } })());
  const [showKhataForm, setShowKhataForm] = useState(false);
  const [khataForm, setKhataForm] = useState({ customerName: "", customerPhone: "", amount: "", note: "", date: "" });
  const [showKhataCollect, setShowKhataCollect] = useState(null);
  const [khataCollectAmt, setKhataCollectAmt] = useState("");

  // ─── ADVANCE DEPOSIT ──────────────────────────────
  const [advanceDeposits, setAdvanceDeposits] = useState((() => { try { return JSON.parse(localStorage.getItem('store_advances') || 'null') || []; } catch (_) { return []; } })());
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ customerName: "", customerPhone: "", amount: "", note: "" });

  // ─── SPLIT PAYMENT ────────────────────────────────
  const [splitPayMode, setSplitPayMode] = useState(false);
  const [splitCash, setSplitCash] = useState("");
  const [splitUpi, setSplitUpi] = useState("");
  const [splitUpiTxn, setSplitUpiTxn] = useState("");

  // ─── BUNDLE OFFERS ────────────────────────────────
  const [bundleOffers, setBundleOffers] = useState((() => { try { return JSON.parse(localStorage.getItem('store_offers') || 'null') || []; } catch (_) { return []; } })());
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerForm, setOfferForm] = useState({ name: "", itemNames: "", discountPct: "5", active: true });
  const [editOfferId, setEditOfferId] = useState(null);

  // ─── LOYALTY POINTS ───────────────────────────────
  const [loyaltyData, setLoyaltyData] = useState((() => { try { return JSON.parse(localStorage.getItem('store_loyalty') || 'null') || {}; } catch (_) { return {}; } })());
  const [loyaltyRate, setLoyaltyRate] = useState(5); // 5 points per ₹100

  // ─── HEALTH CARDS ─────────────────────────────────
  const [healthCards, setHealthCards] = useState((() => { try { return JSON.parse(localStorage.getItem('store_health_cards') || 'null') || {}; } catch (_) { return {}; } })());
  const [showHealthCard, setShowHealthCard] = useState(false);
  const [healthCardForm, setHealthCardForm] = useState({ bloodGroup: "", allergies: "", conditions: "", primaryDoctor: "", emergencyContact: "" });

  // ─── MEDICINE REMINDERS ───────────────────────────
  const [reminders, setReminders] = useState((() => { try { return JSON.parse(localStorage.getItem('store_reminders') || 'null') || []; } catch (_) { return []; } })());
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderForm, setReminderForm] = useState({ medicineName: "", dosage: "", morning: false, afternoon: false, night: false, duration: "30", startDate: "", memberFor: "Myself" });

  // ─── PRESCRIPTION UPLOAD ──────────────────────────
  const [setPrescriptionOrders] = useState((() => { try { return JSON.parse(localStorage.getItem('store_prescriptions') || 'null') || []; } catch (_) { return []; } })());
  const [setShowPrescriptionUpload] = useState(false);

  // ─── FAMILY MEMBERS ───────────────────────────────
  const [familyMembers, setFamilyMembers] = useState((() => { try { return JSON.parse(localStorage.getItem('store_family') || 'null') || {}; } catch (_) { return {}; } })());
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [familyForm, setFamilyForm] = useState({ name: "", relation: "", dob: "" });

  // ─── BILL INSTRUCTIONS (per item in sales) ────────
  const [billInstructions, setBillInstructions] = useState({});

  // ─── DAY END CASH SUMMARY ─────────────────────────
  const [dayEndHistory, setDayEndHistory] = useState((() => { try { return JSON.parse(localStorage.getItem('store_dayend') || 'null') || []; } catch (_) { return []; } })());
  const [showDayEnd, setShowDayEnd] = useState(false);
  const [physicalCash, setPhysicalCash] = useState("");
  const [reportSearch, setReportSearch] = useState("");

  // ─── EXPIRY CALENDAR ──────────────────────────────
  const [expiryCalMonth, setExpiryCalMonth] = useState(new Date().getMonth());
  const [expiryCalYear, setExpiryCalYear] = useState(new Date().getFullYear());

  // ─── AUDIT TRAIL & SECURITY ───────────────────────
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // ─── PRINTER SETTINGS ─────────────────────────────
  const [dotMatrixMode, setDotMatrixMode] = useState(false);

  // ═══════════════════════════════════════════════════
  // TOAST
  // ═══════════════════════════════════════════════════
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // ═══════════════════════════════════════════════════
  // DERIVED HELPERS
  // ═══════════════════════════════════════════════════
  const parseExpiry = (d) => {
    if (!d) return null;
    const mmyy = d.match(/^(\d{1,2})\/(\d{2})$/);
    if (mmyy) { const yr = int(mmyy[2]) + 2000; return new Date(yr, int(mmyy[1]) - 1, 1); }
    const mmyyyy = d.match(/^(\d{1,2})\/(\d{4})$/);
    if (mmyyyy) { return new Date(int(mmyyyy[2]), int(mmyyyy[1]) - 1, 1); }
    const dt = new Date(d); return isNaN(dt) ? null : dt;
  };
  const isExpired = (d) => { const dt = parseExpiry(d); return dt && dt < new Date(); };
  const isExpiringSoon = (d) => { const dt = parseExpiry(d); if (!dt) return false; const days = Math.floor((dt - new Date()) / 86400000); return days <= 30 && days >= 0; };
  const getDivision = (id) => DIVISIONS.find(d => d.id === id) || DIVISIONS[0];
  const itemBatches = (itemId) => batches.filter(b => b.itemId === itemId && int(b.qty) > 0 && !isExpired(b.expiryDate));

  const calcTotal = (cartArr) => cartArr.reduce((s, i) => { const p = num(i.price), g = num(i.gst), q = int(i.quantity) || 1; return s + (p + p * g / 100) * q; }, 0);

  const filteredItems = (divId) => items.filter(i => i.division === divId).filter(i => {
    const q = itemSearch.toLowerCase();
    return (!q || (i.name || "").toLowerCase().includes(q) || (i.company || "").toLowerCase().includes(q)) && (!filterStock || i.stock > 0);
  }).sort((a, b) => sortBy === "price_asc" ? num(a.price) - num(b.price) : sortBy === "price_desc" ? num(b.price) - num(b.price) : (a.name || "").localeCompare(b.name || ""));

  // isOwner: true when logged-in owner is viewing owner panel
  const isOwner = !!currentUser;

  // ═══════════════════════════════════════════════════
  // LOAD / SAVE (localStorage)
  // ═══════════════════════════════════════════════════
  const safeGet = async (key) => {
    try { const val = localStorage.getItem(key); if (val) return JSON.parse(val); } catch (_) { }
    return null;
  };

  const save = async (key, data) => {
    const str = JSON.stringify(data);
    try { localStorage.setItem(key, str); } catch (_) { }
    return true;
  };

  // Use an environment variable or local proxy/URL for API calls
  const API_BASE = 'http://localhost:5000/api';

  const saveItems = async (l) => { setItems(l); await save("store_items", l); }; // Temporarily keep localStorage as fallback or remove later. Right now we are focusing on read/write API.
  const saveBatches = (l) => { setBatches(l); save("store_batches", l); };
  const saveSuppliers = (l) => { setSuppliers(l); save("store_suppliers", l); };
  const savePurchaseBills = (l) => { setPurchaseBills(l); save("store_purchaseBills", l); };
  const saveSalesBills = async (l) => {
    setSalesBills(l);
    try {
      const chunkSize = 50, chunks = [];
      for (let i = 0; i < l.length; i += chunkSize) chunks.push(l.slice(i, i + chunkSize));
      await save("store_sales_meta", { chunks: chunks.length, total: l.length });
      for (let i = 0; i < chunks.length; i++) await save(`store_sales_${i}`, chunks[i]);
    } catch (_) { }
  };
  const savePayments = (l) => { setPayments(l); save("store_payments", l); };
  const saveBankEntries = (l) => { setBankEntries(l); save("store_bankEntries", l); };

  const loadAll = async () => {
    // DB is the single source of truth. We only READ from DB, never push local data back.
    // All writes (add/edit/delete) go through API calls directly.

    const localItems = (() => { try { return JSON.parse(localStorage.getItem('store_items') || 'null') || []; } catch (_) { return []; } })();
    const localBat = (() => { try { return JSON.parse(localStorage.getItem('store_batches') || 'null') || []; } catch (_) { return []; } })();
    const localPbs = (() => { try { return JSON.parse(localStorage.getItem('store_purchaseBills') || 'null') || []; } catch (_) { return []; } })();
    const localSbs = (() => { try { return JSON.parse(localStorage.getItem('store_sales') || 'null') || []; } catch (_) { return []; } })();
    const localPs = (() => { try { return JSON.parse(localStorage.getItem('store_payments') || 'null') || []; } catch (_) { return []; } })();
    const localBank = (() => { try { return JSON.parse(localStorage.getItem('store_bankEntries') || 'null') || []; } catch (_) { return []; } })();
    const localKhata = (() => { try { return JSON.parse(localStorage.getItem('store_khata_entries') || 'null') || []; } catch (_) { return []; } })();
    const localAdv = (() => { try { return JSON.parse(localStorage.getItem('store_advance_deposits') || 'null') || []; } catch (_) { return []; } })();
    const localSupps = (() => { try { return JSON.parse(localStorage.getItem('store_suppliers') || 'null') || []; } catch (_) { return []; } })();

    try {
      // 1. ITEMS
      const itemRes = await fetch(`${API_BASE}/items`);
      if (itemRes.ok) {
        const d = await itemRes.json();
        const mapped = d.map(i => ({ ...i, division: i.division || i.category || 'medicines', barcode: i.barcode || i.batchNumber || '' }));
        if (mapped.length === 0 && localItems.length > 0) setItems(localItems);
        else { setItems(mapped); save('store_items', mapped); }
      } else setItems(localItems);

      // 2. SUPPLIERS
      const suppRes = await fetch(`${API_BASE}/suppliers`);
      if (suppRes.ok) {
        const d = await suppRes.json();
        const mapped = d.map(s => ({ ...s, contact: s.mobile, gstTin: s.gst_tin }));
        if (mapped.length === 0 && localSupps.length > 0) setSuppliers(localSupps);
        else { setSuppliers(mapped); save('store_suppliers', mapped); }
      }

      // 3. PURCHASE BILLS
      const pbRes = await fetch(`${API_BASE}/purchase-bills`);
      if (pbRes.ok) {
        const d = await pbRes.json();
        const mapped = d.map(dp => ({
          id: dp.id, entryNo: dp.entry_no, partyName: dp.party_name, supplierId: dp.supplier_id,
          billNo: dp.bill_no, billDate: dp.bill_date ? (new Date(dp.bill_date)).getFullYear() + '-' + String((new Date(dp.bill_date)).getMonth() + 1).padStart(2, '0') + '-' + String((new Date(dp.bill_date)).getDate()).padStart(2, '0') : '',
          entryDate: dp.entry_date ? (new Date(dp.entry_date)).getFullYear() + '-' + String((new Date(dp.entry_date)).getMonth() + 1).padStart(2, '0') + '-' + String((new Date(dp.entry_date)).getDate()).padStart(2, '0') : '',
          taxType: dp.tax_type, paymentMode: dp.payment_mode, remarks: dp.remarks,
          subtotal: dp.subtotal, totalGst: dp.total_gst, totalDisc: dp.total_disc,
          total: dp.total_amount, netAmount: dp.total_amount, status: dp.status, items: dp.items || [], createdAt: dp.created_at || dp.entry_date || dp.bill_date
        }));
        setPurchaseBills(mapped); save('store_purchaseBills', mapped);
      } else setPurchaseBills(localPbs);

      // 4. SALES BILLS
      const sbRes = await fetch(`${API_BASE}/sales-bills`);
      if (sbRes.ok) {
        const d = await sbRes.json();
        const mapped = d.map(ds => ({
          id: ds.id, billNo: ds.bill_no, patientName: ds.patient_name, patientArea: ds.patient_area,
          doctorName: ds.doctor_name, mobile: ds.mobile, address: ds.address, date: ds.date,
          paymentMode: ds.payment_mode, grossAmount: num(ds.gross_amount), lessDisc: num(ds.less_disc),
          netAmount: num(ds.net_amount), salesMan: ds.salesman, refillDate: ds.refill_date,
          payRec: num(ds.pay_rec), remarks: ds.remarks, isReturn: Boolean(ds.is_return),
          status: ds.status || 'Completed',
          items: Array.isArray(ds.items) ? ds.items : []
        })).filter(Boolean);
        setSalesBills(mapped); save('store_sales', mapped);
      } else setSalesBills(localSbs);

      // 5. PAYMENTS
      const payRes = await fetch(`${API_BASE}/payments`);
      if (payRes.ok) {
        const d = await payRes.json();
        const mapped = d.map(dp => ({ id: dp.id, vchNo: dp.vch_no, type: dp.type, date: dp.date, mode: dp.mode, amount: dp.amount, accountName: dp.account_name, supplierId: dp.supplier_id, bankName: dp.bank_name, chequeNo: dp.cheque_no, remark: dp.remark }));
        setPayments(mapped); save('store_payments', mapped);
      } else setPayments(localPs);

      // 6. BANK ENTRIES
      const bankRes = await fetch(`${API_BASE}/bank-entries`);
      if (bankRes.ok) {
        const d = await bankRes.json();
        const mapped = d.map(db => ({ id: db.id, date: db.date, type: db.type, accountName: db.account_name, bank: db.bank, amount: db.amount, chequeNo: db.cheque_no, remark: db.remark }));
        setBankEntries(mapped); save('store_bankEntries', mapped);
      } else setBankEntries(localBank);

      // 7. KHATA ENTRIES
      const khataRes = await fetch(`${API_BASE}/khata-entries`);
      if (khataRes.ok) {
        const d = await khataRes.json();
        const mapped = d.map(dk => ({ id: dk.id, customerName: dk.customer_name, customerPhone: dk.customer_phone, amount: dk.amount, paidAmount: dk.paid_amount, note: dk.note, date: dk.date, cleared: dk.cleared }));
        setKhataEntries(mapped); save('store_khata_entries', mapped);
      } else setKhataEntries(localKhata);

      // 8. ADVANCE DEPOSITS
      const advRes = await fetch(`${API_BASE}/advance-deposits`);
      if (advRes.ok) {
        const d = await advRes.json();
        const mapped = d.map(da => ({ id: da.id, customerName: da.customer_name, customerPhone: da.customer_phone, amount: da.amount, usedAmount: da.used_amount, note: da.note }));
        setAdvanceDeposits(mapped); save('store_advance_deposits', mapped);
      } else setAdvanceDeposits(localAdv);

      // 9. DOCTORS
      const docRes = await fetch(`${API_BASE}/doctors`);
      if (docRes.ok) { const d = await docRes.json(); setDoctors(d); save('store_doctors', d); }

      // 10. CUSTOMERS — convert array to email-keyed object for login compatibility
      const custRes = await fetch(`${API_BASE}/customers`);
      if (custRes.ok) {
        const d = await custRes.json();
        const custMap = {};
        d.forEach(c => { if (c.email) custMap[c.email.toUpperCase()] = { ...c, role: c.role || 'customer' }; });
        setCustomers(custMap); save('store_customers', custMap);
      }

      // 11. CUST ORDERS
      const coRes = await fetch(`${API_BASE}/cust-orders`);
      if (coRes.ok) {
        const d = await coRes.json();
        const mapped = d.map(o => ({ id: o.id, email: o.email, items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items, totalAmount: o.total_amount, status: o.status, date: o.date, transactionId: o.transaction_id, address: o.address }));
      }

      // 12. PRESCRIPTIONS
      const prRes = await fetch(`${API_BASE}/prescription-orders`);
      if (prRes.ok) {
        const d = await prRes.json();
        const mapped = d.map(dp => ({ id: dp.id, email: dp.email, customerName: dp.customer_name, imageData: dp.image_data, note: dp.note, status: dp.status, createdAt: dp.created_at }));
      }

      // 13. REMINDERS
      const remRes = await fetch(`${API_BASE}/medicine-reminders`);
      if (remRes.ok) {
        const d = await remRes.json();
        const mapped = d.map(dr => ({ id: dr.id, email: dr.email, medicineName: dr.medicine_name, dosage: dr.dosage, everyXHours: dr.every_x_hours, startTime: dr.start_time, active: dr.active }));
        setReminders(mapped); save('store_reminders', mapped);
      }

      // 14. LOYALTY
      const loyRes = await fetch(`${API_BASE}/loyalty-data`);
      if (loyRes.ok) {
        const d = await loyRes.json();
        const map = {}; d.forEach(l => { map[l.email.toUpperCase()] = { points: l.points, totalEarned: l.total_earned }; });
        setLoyaltyData(map); save('store_loyalty', map);
      }

      // 15. BUNDLE OFFERS
      const offRes = await fetch(`${API_BASE}/bundle-offers`);
      if (offRes.ok) {
        const d = await offRes.json();
        const mapped = d.map(o => ({ id: o.id, title: o.title, description: o.description, price: o.price, items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items, imageData: o.image_data }));
        setBundleOffers(mapped); save('store_offers', mapped);
      }

      // 16. UPI SETTINGS
      const upiRes = await fetch(`${API_BASE}/upi-settings`);
      if (upiRes.ok) {
        const d = await upiRes.json();
        if (d?.[0]) { const u = { upiId: d[0].upi_id, name: d[0].name }; setUpiSettings(u); save('store_upiSettings', u); }
      }

      // 17. HEALTH CARDS
      const hcRes = await fetch(`${API_BASE}/health-cards`);
      if (hcRes.ok) {
        const d = await hcRes.json();
        const map = {}; d.forEach(h => { try { map[h.email.toUpperCase()] = typeof h.card_data === 'string' ? JSON.parse(h.card_data) : h.card_data; } catch (_) { } });
        setHealthCards(map); save('store_health_cards', map);
      }

      // 18. BATCHES
      const batRes = await fetch(`${API_BASE}/batches`);
      if (batRes.ok) { const d = await batRes.json(); setBatches(d); save('store_batches', d); }
      else setBatches(localBat);

      // 19. PURCHASE CHALLANS
      try {
        const pcRes = await fetch(`${API_BASE}/purchase-challans`);
        if (pcRes.ok) {
          const d = await pcRes.json();
          setPurchaseChallans(d);
          localStorage.setItem('store_purchase_challans', JSON.stringify(d));
        }
      } catch (_) { /* keep existing state from localStorage */ }

      // System Status Check
      try {
        const res = await fetch(`${API_BASE}/system/status`);
        if (res.ok) {
          const data = await res.json();
          setAuthStatus(data.isSetupComplete ? 'login' : 'setup');
        } else {
          setAuthStatus('setup');
        }
      } catch (e) {
        console.error('System status check failed:', e);
        setAuthStatus('setup');
      }

    } catch (error) {
      console.error('loadAll error:', error);
    }
  };

  const forceSync = async () => {
    showToast("Starting Manual Sync...", "info");
    const localItems = await safeGet("store_items") || [];
    const localSuppliers = await safeGet("store_suppliers") || [];

    // Sync Items
    try {
      const res = await fetch(`${API_BASE}/items`);
      const dbItems = res.ok ? await res.json() : [];
      const missingItems = localItems.filter(li => li.name && !dbItems.some(di => (di.name || '').toUpperCase() === li.name.toUpperCase()));
      if (missingItems.length > 0) {
        for (const item of missingItems) {
          await fetch(`${API_BASE}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: (item.name || "UNNAMED").toUpperCase(),
              category: item.division || 'medicines',
              price: parseFloat(item.price || (item as any).mrp || 0),
              stock: parseInt(item.stock || 0),
              expiryDate: item.expiryDate || null,
              batchNumber: item.barcode || item.id,
              manufacturer: item.company || ''
            })
          });
        }
      }
    } catch (e) { console.error("Item sync error", e); }

    // Sync Suppliers
    try {
      const res = await fetch(`${API_BASE}/suppliers`);
      const dbSupps = res.ok ? await res.json() : [];
      const missingSupps = localSuppliers.filter(ls => ls.name && !dbSupps.some(ds => (ds.name || '').toUpperCase() === ls.name.toUpperCase()));
      if (missingSupps.length > 0) {
        for (const s of missingSupps) {
          await fetch(`${API_BASE}/suppliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: s.name.toUpperCase(), phone: s.phone || '', address: s.address || '', email: s.email || '' })
          });
        }
      }
    } catch (e) { console.error("Supplier sync error", e); }

    showToast("Sync Attempt Completed!", "success");
    loadAll();
  };

  useEffect(() => { loadAll(); }, []);// eslint-disable-line

  // ─── KEYBOARD SHORTCUTS ───────────────────────────────
  useEffect(() => {// eslint-disable-line
    const handler = (e) => {
      const divMap = { F1: "medicines", F2: "surgical", F3: "cosmetics", F4: "baby", F5: "devices", F6: "vitamins", F7: "ayurvedic", F8: "otc" };
      if (divMap[e.key] && currentUser) { e.preventDefault(); if (currentUser.role === "owner") { setActiveSection("inventory"); setOwnerSubTab(divMap[e.key]); } else { setActiveCustomerTab("home"); setActiveSection(divMap[e.key]); } return; }
      if (e.key === "Enter" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const tag = e.target.tagName;
        if (tag === "TEXTAREA") return;
        if (tag === "INPUT" || tag === "SELECT") {
          if (e.target.hasAttribute("data-pf")) return;
          e.preventDefault();
          const focusable = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled])')).filter(el => el.offsetParent !== null);
          const idx = focusable.indexOf(e.target);
          if (idx >= 0 && idx < focusable.length - 1) { focusable[idx + 1].focus(); focusable[idx + 1].select && focusable[idx + 1].select(); }
          else { if (showPurchaseForm) { handleSavePurchase(); return; } if (showSalesForm) { return; } if (showItemForm) { handleSaveItem(); return; } if (showPaymentForm) { handleSavePayment(); return; } if (showSupplierForm) { handleSaveSupplier(); return; } if (quickStockItem) { handleQuickStock(); return; } }
          return;
        }
      }
      if (e.altKey && currentUser?.role === "owner") {
        const altMap = { h: "home", i: "inventory", p: "purchase", s: "sales_pos", t: "payments", r: "reports", m: "masters" };
        const sec = altMap[e.key.toLowerCase()];
        if (sec) { e.preventDefault(); setActiveSection(sec); setOwnerSubTab(""); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentUser]);// eslint-disable-line

  useEffect(() => {// eslint-disable-line
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(tag);
      if (e.key === "?" && !e.ctrlKey && !e.altKey) { setShowShortcuts(p => !p); return; }
      if (e.key === "Escape") {
        setShowShortcuts(false);
        if (showPurchaseForm) { setShowPurchaseForm(false); return; } if (showSalesForm) { setShowSalesForm(false); return; } if (showItemForm) { setShowItemForm(false); setEditingItem(null); return; } if (showPaymentForm) { setShowPaymentForm(false); return; } if (showSupplierForm) { setShowSupplierForm(false); return; } if (showCart) { setShowCart(false); return; } if (quickStockItem) { setQuickStockItem(null); return; }
        return;
      }
      if (isTyping) return;
      if (!currentUser || currentUser.role !== "owner") return;
      if (e.altKey && !e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "h": e.preventDefault(); setActiveSection("home"); setOwnerSubTab(""); break;
          case "i": e.preventDefault(); setActiveSection("inventory"); setOwnerSubTab(""); break;
          case "p": e.preventDefault(); setActiveSection("purchase"); setOwnerSubTab(""); break;
          case "s": e.preventDefault(); setActiveSection("sales_pos"); setOwnerSubTab(""); break;
          case "y": e.preventDefault(); setActiveSection("payments"); setOwnerSubTab(""); break;
          case "r": e.preventDefault(); setActiveSection("reports"); setOwnerSubTab(""); break;
          case "m": e.preventDefault(); setActiveSection("masters"); setOwnerSubTab("suppliers"); break;
          default: break;
        }
        return;
      }
      if (e.ctrlKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "n": e.preventDefault(); setActiveSection("sales_pos"); setOwnerSubTab(""); setTimeout(() => openSalesForm(false), 50); break;
          case "b": e.preventDefault(); setActiveSection("purchase"); setOwnerSubTab(""); setTimeout(() => openPurchaseForm(), 50); break;
          case "q": e.preventDefault(); setActiveSection("payments"); setOwnerSubTab(""); setTimeout(() => openPaymentForm("payment"), 50); break;
          default: break;
        }
        return;
      }
      const fMap = { "F2": "medicines", "F3": "surgical", "F4": "cosmetics", "F5": "baby", "F6": "devices", "F7": "vitamins", "F8": "ayurvedic", "F9": "otc" };
      if (fMap[e.key]) { e.preventDefault(); setActiveSection("inventory"); setOwnerSubTab(fMap[e.key]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentUser, showPurchaseForm, showSalesForm, showItemForm, showPaymentForm, showSupplierForm, showCart, quickStockItem]);// eslint-disable-line

  // ═══════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════
  const handleSetupAccount = async () => {
    const { name, email, password, confirmPassword, pharmacyName } = authInput;
    if (!name || !email || !password) { showToast("Name, Email and Password required", "error"); return; }
    if (password !== confirmPassword) { showToast("Passwords do not match", "error"); return; }
    if (password.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }

    try {
      const res = await fetch(`${API_BASE}/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, pharmacyName })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCurrentUser(data.user); localStorage.setItem("store_currentUser", JSON.stringify(data.user));
        setActiveSection("home");
        showToast("System Setup Successful! Welcome.");
      } else {
        showToast(data.error || "Setup failed", "error");
      }
    } catch (e) {
      showToast("Server error during setup", "error");
    }
  };

  const handleLogin = async () => {
    const { email, password } = authInput;
    if (!email || !password) { showToast("Email and password required", "error"); return; }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCurrentUser(data.user); localStorage.setItem("store_currentUser", JSON.stringify(data.user));
        setSessionPassword(password);
        setActiveSection("home");
        showToast("Logged in successfully");
      } else {
        showToast(data.error || "Login failed", "error");
      }
    } catch (e) {
      showToast("Server error during login", "error");
    }
  };


  const handleLogout = () => {
    setCurrentUser(null); localStorage.removeItem("store_currentUser");
    setActiveSection("home");
    setAuthStatus("loading");
    fetch(`${API_BASE}/system/status`)
      .then(r => r.json())
      .then(d => setAuthStatus(d.isSetupComplete ? 'login' : 'setup'))
      .catch(() => setAuthStatus('setup'));
  };

  const handleDeleteOwnerAccount = () => {
    showConfirm("⚠️ Delete owner account? This will PERMANENTLY delete ALL data (items, bills, suppliers, etc.) from the database. You cannot undo this!", async () => {
      // 1. Wipe entire database via API
      try {
        await fetch(`${API_BASE}/clear-all-data`, { method: 'DELETE' });
      } catch (e) {
        console.error("DB clear failed:", e);
      }

      // 2. Clear all localStorage store_ keys
      Object.keys(localStorage).filter(k => k.startsWith("store_")).forEach(k => localStorage.removeItem(k));
      try { localStorage.removeItem("owner_account"); localStorage.setItem("owner_account_deleted", "true"); } catch (_) { }

      // 3. Reset all React state
      ownerSession.current = null;
      setItems([]); setSuppliers([]); setPurchaseBills([]); setSalesBills([]);
      setPayments([]); setBankEntries([]); setKhataEntries([]); setAdvanceDeposits([]);
      setDoctors([]); setBundleOffers([]); setReminders([]);
      setAuthStatus("setup"); setActiveMenu(null);
      handleLogout();
      showToast("Owner account & all data deleted permanently.");
    });
  };

  // ═══════════════════════════════════════════════════
  // ITEM MASTER
  // ═══════════════════════════════════════════════════
  const emptyItemForm = (divId) => ({ division: divId || 'medicines', name: "", company: "", pRate: "", mrp: "", gst: "5", cess: "", discount: "", stock: "", unit: "", pack: "", minimum: "5", expiryDate: "", drugGroup: "", hsn: "", barcode: "", supplier: "", location: "", description: "", scheduleH: false, rxRequired: false, taxType: "taxable", itemCategory: "" });

  const openItemForm = (divId, item = null) => { setItemDivision(divId); setEditingItem(item); setItemForm(item ? { ...item } : emptyItemForm(divId)); setShowItemForm(true); };

  const handleSaveItem = async () => {
    if (!itemForm.name) { showToast("Item name is required", "error"); return; }
    const toUpper = (v) => typeof v === "string" ? v.toUpperCase() : v;
    const parsed = { ...itemForm, name: toUpper(itemForm.name), company: toUpper(itemForm.company), drugGroup: toUpper(itemForm.drugGroup), unit: toUpper(itemForm.unit), pack: toUpper(itemForm.pack), supplier: toUpper(itemForm.supplier), location: toUpper(itemForm.location), hsn: toUpper(itemForm.hsn), barcode: toUpper(itemForm.barcode), itemCategory: toUpper(itemForm.itemCategory), division: itemForm.division || itemDivision || 'medicines', price: num(itemForm.mrp) || num(itemForm.pRate), pRate: num(itemForm.pRate), mrp: num(itemForm.mrp), gst: num(itemForm.gst), cess: num(itemForm.cess), discount: num(itemForm.discount), stock: int(itemForm.stock), minimum: int(itemForm.minimum) };

    // Save to Database via API — full payload with all fields
    try {
      const payload = {
        name: parsed.name,
        category: parsed.division || 'medicines',
        division: parsed.division || 'medicines',
        company: parsed.company || null,
        pRate: parsed.pRate || 0,
        mrp: parsed.mrp || 0,
        price: parsed.mrp || parsed.pRate || 0,
        gst: parsed.gst || 0,
        cess: parsed.cess || 0,
        discount: parsed.discount || 0,
        stock: parsed.stock || 0,
        minimum: parsed.minimum || 5,
        unit: parsed.unit || null,
        pack: parsed.pack || null,
        expiryDate: parsed.expiryDate || null,
        batchNumber: parsed.batchNumber || null,
        barcode: parsed.barcode || null,
        hsn: parsed.hsn || null,
        manufacturer: parsed.company || null,
        supplier: parsed.supplier || null,
        location: parsed.location || null,
        itemCategory: parsed.itemCategory || null,
        note: parsed.description || null,
      };

      let res;
      if (editingItem && editingItem.id && !isNaN(editingItem.id)) {
        res = await fetch(`${API_BASE}/items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res && res.ok) {
        loadAll(); // Re-fetch from DB
        showToast(editingItem ? "Item updated!" : "Item added!");
      } else {
        const errData = res ? await res.json() : {};
        console.error('Save item failed:', errData);
        // Fallback to local
        const newList = editingItem ? items.map(i => i.id === editingItem.id ? { ...i, ...parsed } : i) : [...items, { id: uid(), ...parsed, createdAt: nowStr() }];
        setItems(newList);
        await save("store_items", newList);
        showToast(editingItem ? "Item updated (local)!" : "Item added (local)!");
      }

      setShowItemForm(false);
      setEditingItem(null);
      setItemForm({});
    } catch (e) {
      console.error(e);
      showToast("Error saving to database", "error");
    }
  };

  const handleDeleteItem = (id) => {
    showConfirm("Delete this item?", async () => {
      try { await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' }); } catch (e) { }
      const p = items.filter(i => i.id !== id);
      setItems(p); await save("store_items", p);
      showToast("Item deleted");
    });
  };

  const handleQuickStock = () => {
    if (!quickStockItem || quickQty === "") { showToast("Please enter quantity", "error"); return; }
    saveItems(items.map(i => i.id === quickStockItem.id ? { ...i, stock: Math.max(0, int(i.stock) + int(quickQty)) } : i));
    showToast(`${quickStockItem.name} stock updated!`); setQuickStockItem(null); setQuickQty("");
  };

  // ═══════════════════════════════════════════════════
  // PURCHASE BILL
  // ═══════════════════════════════════════════════════
  const emptyPurchaseForm = () => ({ entryNo: "", partyName: "", supplierId: "", billNo: "", billDate: today(), entryDate: today(), taxType: "exclusive", taxZone: "sgst_ugst", gstInclusive: false, gstOnFree: false, paymentMode: "cash", remarks: "", halfScheme: "0", octOnFree: "0", otherAdj: "0", lessDisc: "0", crNote: "0", tcsValue: "0" });
  const emptyPurchaseItem = () => ({ itemId: "", itemName: "", batchNo: "", mfgDate: "", expiryDate: "", qty: "1", freeQty: "0", ptr: "", mrp: "", gst: "5", disc: "0", cess: "0", amount: 0 });

  const calcPurchaseItemAmt = (pi) => {
    const ptr = num(pi.ptr), qty = int(pi.qty), gst = num(pi.gst), disc = num(pi.disc), cess = num(pi.cess);
    const base = ptr * qty, discAmt = base * disc / 100, taxable = base - discAmt;
    return taxable + taxable * gst / 100 + taxable * cess / 100;
  };

  const openPurchaseForm = (existingBill = null) => {
    if (existingBill) {
      setPurchaseForm({
        ...existingBill,
        id: existingBill.id,
        entryNo: String(existingBill.entryNo || existingBill.id),
        partyName: existingBill.partyName || "",
        supplierId: existingBill.supplierId || "",
        billNo: existingBill.billNo || "",
        billDate: existingBill.billDate ? new Date(existingBill.billDate).toISOString().split('T')[0] : today(),
        entryDate: existingBill.entryDate ? new Date(existingBill.entryDate).toISOString().split('T')[0] : today(),
        taxType: existingBill.taxType || "exclusive",
        paymentMode: existingBill.paymentMode || "cash",
        taxZone: existingBill.taxZone || "sgst_ugst",
        isEdit: true
      });
      const bItems = (existingBill.items || []).filter(pi => pi.itemId || pi.itemName);
      setPurchaseItems(bItems.length > 0 ? bItems.map(pi => ({ ...pi, amount: calcPurchaseItemAmt(pi) })) : [emptyPurchaseItem()]);
      setShowPurchaseForm(true);
    } else {
      const nextEntry = (purchaseBills.length > 0 ? Math.max(...purchaseBills.map(b => parseInt(b.entryNo) || 0)) : 0) + 1;
      setPurchaseForm({ ...emptyPurchaseForm(), entryNo: String(nextEntry) });
      setPurchaseItems([emptyPurchaseItem()]);
      setShowPurchaseForm(true);
    }
  };

  const updatePurchaseItem = (idx, field, val) => {
    setPurchaseItems(prev => {
      const updated = [...prev]; updated[idx] = { ...updated[idx], [field]: val };
      if (field === "itemId" && val) { const found = items.find(i => i.id === val); if (found) updated[idx] = { ...updated[idx], itemName: found.name, mrp: found.mrp || found.price, ptr: found.pRate || "", gst: found.gst || 5 }; }
      updated[idx].amount = calcPurchaseItemAmt(updated[idx]); return updated;
    });
  };

  const addPurchaseItem = () => setPurchaseItems(prev => [...prev, emptyPurchaseItem()]);
  const removePurchaseItem = (idx) => setPurchaseItems(prev => {
    const updated = prev.filter((_, i) => i !== idx);
    return updated.length === 0 ? [emptyPurchaseItem()] : updated;
  });

  const focusNext = (e, rowIdx, colName) => {
    if (e.key !== "Enter") return; e.preventDefault();
    const fields = ["item", "batchNo", "expiryDate", "qty", "freeQty", "mrp", "ptr", "gst", "disc"];
    const cur = fields.indexOf(colName); const nextField = fields[cur + 1];
    if (nextField) { const el = document.querySelector(`[data-pf="${rowIdx}-${nextField}"]`); if (el) { el.focus(); el.select && el.select(); return; } }
    const nextEl = document.querySelector(`[data-pf="${rowIdx + 1}-item"]`);
    if (nextEl) nextEl.focus();
    else { addPurchaseItem(); setTimeout(() => { const el = document.querySelector(`[data-pf="${rowIdx + 1}-item"]`); if (el) el.focus(); }, 50); }
  };

  const handleSavePurchase = async () => {
    if (!purchaseForm.partyName) { showToast("Party name is required", "error"); return; }
    const validItems = purchaseItems.filter(pi => pi.itemId && int(pi.qty) > 0);
    if (!validItems.length) { showToast("Please add at least 1 item", "error"); return; }
    const subtotal = validItems.reduce((s, pi) => s + num(pi.ptr) * int(pi.qty), 0);
    const totalGst = validItems.reduce((s, pi) => s + (num(pi.ptr) * int(pi.qty) - num(pi.ptr) * int(pi.qty) * num(pi.disc) / 100) * num(pi.gst) / 100, 0);
    const totalDisc = validItems.reduce((s, pi) => s + num(pi.ptr) * int(pi.qty) * num(pi.disc) / 100, 0);
    const total = validItems.reduce((s, pi) => s + calcPurchaseItemAmt(pi), 0);
    const bill = { id: purchaseForm.id || uid(), entryNo: purchaseForm.entryNo || (purchaseBills.length + 1), ...purchaseForm, items: validItems, subtotal, totalGst, totalDisc, total, createdAt: purchaseForm.createdAt || nowStr(), status: purchaseForm.paymentMode === "credit" ? "Credit" : "Paid" };

    // Save to DB (Transactional: Bill + Items + Stock + Batches)
    try {
      const payload = {
        entry_no: bill.entryNo,
        party_name: bill.partyName,
        supplier_id: (bill.supplierId && !isNaN(bill.supplierId)) ? parseInt(bill.supplierId) : null,
        bill_no: bill.billNo,
        bill_date: bill.billDate,
        entry_date: bill.entryDate,
        tax_type: bill.taxType,
        payment_mode: bill.paymentMode,
        remarks: bill.remarks,
        subtotal: bill.subtotal,
        total_gst: bill.totalGst,
        total_disc: bill.totalDisc,
        total: bill.total,
        status: bill.status,
        items: validItems, // Full items list
      };
      const res = await fetch(`${API_BASE}/purchase-bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        loadAll(); // This will refresh items and bills from DB
        showToast("Purchase Bill & Inventory synced to DB!");
      } else {
        const dbErr = await res.json().catch(() => ({}));
        console.error("Purchase Sync Error:", dbErr);
        const existingIdx = purchaseBills.findIndex(b => b.id === bill.id);
        if (existingIdx >= 0) {
          const updated = [...purchaseBills]; updated[existingIdx] = bill;
          savePurchaseBills(updated);
        } else {
          savePurchaseBills([...purchaseBills, bill]);
        }
        showToast("Purchase Bill saved locally (API Error)");
      }
    } catch (e) {
      console.error("Purchase Sync Exception:", e);
      const existingIdx = purchaseBills.findIndex(b => b.id === bill.id);
      if (existingIdx >= 0) {
        const updated = [...purchaseBills]; updated[existingIdx] = bill;
        savePurchaseBills(updated);
      } else {
        savePurchaseBills([...purchaseBills, bill]);
      }
      showToast("Purchase Bill saved locally");
    }

    setShowPurchaseForm(false);
  };

  // ═══════════════════════════════════════════════════
  // SALES BILL (POS)
  // ═══════════════════════════════════════════════════
  const emptySalesForm = () => ({ patientName: "", patientArea: "", doctorName: "", mobile: "", address: "", paymentMode: "cash", discount: "0", salesMan: "", retailInv: "", payRec: "0", quotation: false, halfScheme: "0", octOnFree: "0", otherAdj: "0", crNote: "0", tcsValue: "0", remarks: "" });
  const emptySalesItem = () => ({ itemId: "", itemName: "", batchNo: "", qty: "1", mrp: "", rate: "", gst: "0", disc: "0", amount: 0 });

  const calcSalesItemAmt = (si) => {
    const rate = num(si.rate), qty = int(si.qty), gst = num(si.gst), disc = num(si.disc);
    const base = rate * qty, discAmt = base * disc / 100, taxable = base - discAmt;
    return taxable * (1 + gst / 100);
  };

  const openSalesForm = (returnMode = false, existingBill = null) => {
    if (existingBill) {
      setSalesForm({
        ...existingBill,
        id: existingBill.id,
        billNo: existingBill.billNo,
        patientName: existingBill.patientName || "",
        patientArea: existingBill.patientArea || "",
        doctorName: existingBill.doctorName || "",
        mobile: existingBill.mobile || "",
        address: existingBill.address || "",
        paymentMode: existingBill.paymentMode || "cash",
        discount: existingBill.discount || existingBill.lessDisc || "0",
        salesMan: existingBill.salesMan || "",
        retailInv: existingBill.retailInv || "",
        payRec: existingBill.payRec || "0",
        quotation: existingBill.quotation || false,
        halfScheme: existingBill.halfScheme || "0",
        octOnFree: existingBill.octOnFree || "0",
        otherAdj: existingBill.otherAdj || "0",
        crNote: existingBill.crNote || "0",
        tcsValue: existingBill.tcsValue || "0",
        remarks: existingBill.remarks || "",
        isEdit: true
      });
      const bItems = (existingBill.items || []).filter(si => si.itemId || si.itemName);
      setSalesItems(bItems.length > 0 ? bItems.map(si => ({ ...si, amount: calcSalesItemAmt(si) })) : [emptySalesItem()]);
      setIsReturn(existingBill.isReturn || returnMode);
      setShowSalesForm(true);
    } else {
      setSalesForm(emptySalesForm());
      setSalesItems([emptySalesItem()]);
      setIsReturn(returnMode);
      setShowSalesForm(true);
    }
  };

  const updateSalesItem = (idx, field, val) => {
    setSalesItems(prev => {
      const updated = [...prev]; updated[idx] = { ...updated[idx], [field]: val };
      if (field === "itemId" && val) { const found = items.find(i => i.id === val); if (found) updated[idx] = { ...updated[idx], itemName: found.name, mrp: num(found.mrp) || num(found.price), rate: num(found.price), gst: num(found.gst) || 0 }; }
      updated[idx].amount = calcSalesItemAmt(updated[idx]); return updated;
    });
  };

  const addSalesItem = () => setSalesItems(prev => [...prev, emptySalesItem()]);
  const removeSalesItem = (idx) => setSalesItems(prev => {
    const updated = prev.filter((_, i) => i !== idx);
    return updated.length === 0 ? [emptySalesItem()] : updated;
  });

  const handleSaveSales = async () => {
    if (!salesForm.patientName && !salesForm.mobile) { showToast("Please enter patient name or mobile", "error"); return; }
    const validItems = salesItems.filter(si => si.itemId && int(si.qty) > 0);
    if (!validItems.length) { showToast("Please add at least 1 item", "error"); return; }
    const grossAmount = validItems.reduce((s, si) => s + calcSalesItemAmt(si), 0);
    const lessDisc = grossAmount * num(salesForm.discount) / 100;
    const netAmount = grossAmount - lessDisc;
    const sign = isReturn ? -1 : 1;
    const isEdit = Boolean(salesForm.id);
    const billId = isEdit ? salesForm.id : uid();
    const billNo = salesForm.billNo || (salesBills.length + 1);
    const bill = {
      ...salesForm,
      id: billId,
      billNo,
      date: salesForm.date || nowStr(),
      items: validItems,
      grossAmount: grossAmount * sign,
      lessDisc: lessDisc * sign,
      netAmount: (netAmount - num(salesForm.crNote) + num(salesForm.otherAdj) + num(salesForm.tcsValue)) * sign,
      isReturn,
      createdAt: salesForm.createdAt || nowStr(),
      status: "Completed"
    };

    // Save to DB (Transactional: Bill + Items + Stock)
    try {
      const payload = {
        id: isEdit ? billId : undefined,
        bill_no: bill.billNo,
        patient_name: bill.patientName,
        patient_area: bill.patientArea,
        doctor_name: bill.doctorName,
        mobile: bill.mobile,
        address: bill.address,
        date: bill.date,
        payment_mode: bill.paymentMode,
        gross_amount: bill.grossAmount,
        less_disc: bill.lessDisc,
        net_amount: bill.netAmount,
        salesman: bill.salesMan,
        refill_date: bill.refillDate,
        pay_rec: bill.payRec,
        remarks: bill.remarks,
        status: bill.status,
        items: validItems,
        isReturn
      };

      let res;
      if (isEdit) {
        res = await fetch(`${API_BASE}/sales-bills/${billId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.status === 404) {
          // Fallback if running server hasn't been restarted with PUT route yet:
          try { await fetch(`${API_BASE}/sales-bills/${billId}`, { method: 'DELETE' }); } catch (_) {}
          res = await fetch(`${API_BASE}/sales-bills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      } else {
        res = await fetch(`${API_BASE}/sales-bills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res && res.ok) {
        await loadAll();
        showToast(isReturn ? "Return Bill saved!" : (isEdit ? "Sales Bill updated!" : "Sales Bill saved!"));
      } else {
        const existingIdx = salesBills.findIndex(b => String(b.id) === String(bill.id));
        if (existingIdx >= 0) {
          const updated = [...salesBills]; updated[existingIdx] = bill;
          saveSalesBills(updated);
        } else {
          saveSalesBills([...salesBills, bill]);
        }
        showToast(isReturn ? "Return Bill saved locally!" : (isEdit ? "Sales Bill updated locally!" : "Sales Bill saved locally!"));
      }
    } catch (e) {
      const existingIdx = salesBills.findIndex(b => String(b.id) === String(bill.id));
      if (existingIdx >= 0) {
        const updated = [...salesBills]; updated[existingIdx] = bill;
        saveSalesBills(updated);
      } else {
        saveSalesBills([...salesBills, bill]);
      }
      showToast(isReturn ? "Return Bill saved locally!" : (isEdit ? "Sales Bill updated locally!" : "Sales Bill saved locally!"));
    }

    setShowSalesForm(false);
  };

  const handlePrintSalesBill = (bill) => {
    // Uses the dot-matrix generator — correct @page size for EPSON LX-300+ (10x4)
    setPrintHtml(generateDotMatrixInvoiceHTML(bill));
  };

  // ═══════════════════════════════════════════════════
  // PAYMENTS
  // ═══════════════════════════════════════════════════
  const openPaymentForm = (type = "payment") => { setPaymentForm({ type, date: today(), mode: "cash", amount: "", accountName: "", supplierId: "", bankName: "", chequeNo: "", remark: "" }); setShowPaymentForm(true); };
  const handleSavePayment = async () => {
    if (!paymentForm.amount || !paymentForm.accountName) { showToast("Amount and Account Name are required", "error"); return; }
    const pay = { id: uid(), ...paymentForm, date: paymentForm.date || today(), createdAt: nowStr() };

    // Save to DB
    try {
      const payload = {
        vch_no: pay.vchNo,
        type: pay.type,
        date: pay.date,
        mode: pay.mode,
        amount: pay.amount,
        account_name: pay.accountName,
        supplier_id: (pay.supplierId && !isNaN(pay.supplierId)) ? parseInt(pay.supplierId) : null,
        bank_name: pay.bankName,
        cheque_no: pay.chequeNo,
        remark: pay.remark
      };
      const res = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        loadAll();
        showToast("Payment saved to DB!");
      } else {
        savePayments([...payments, pay]);
        showToast("Payment saved locally!");
      }
    } catch (e) {
      savePayments([...payments, pay]);
      showToast("Payment saved locally!");
    }

    setShowPaymentForm(false); setPaymentForm({});
  };

  const handleSaveBankEntry = async () => {
    if (!bankForm.amount || !bankForm.accountName) { showToast("Amount and Account are required", "error"); return; }
    const b = { id: uid(), ...bankForm, date: bankForm.date || today(), createdAt: nowStr() };

    try {
      const res = await fetch(`${API_BASE}/bank-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: b.date, type: b.type, account_name: b.accountName, bank: b.bank,
          amount: b.amount, cheque_no: b.chequeNo, remark: b.remark
        })
      });
      if (res.ok) {
        loadAll(); showToast("Bank entry synced to DB!");
      } else {
        const ln = [...bankEntries, b];
        setBankEntries(ln); save("store_bankEntries", ln);
        showToast("Bank entry saved locally!");
      }
    } catch (e) {
      const ln = [...bankEntries, b];
      setBankEntries(ln); save("store_bankEntries", ln);
      showToast("Bank entry saved locally!");
    }
    setShowBankForm(false); setBankForm({});
  };

  // ═══════════════════════════════════════════════════
  // SUPPLIERS
  // ═══════════════════════════════════════════════════
  const emptySupplierForm = () => ({ name: "", address: "", city: "Ahmedabad", state: "Gujarat", contact: "", mobile: "", email: "", gstTin: "", dlNo: "", panNo: "", creditLimit: "", creditDays: "30", openingBalance: "0", type: "supplier" });
  const openSupplierForm = (s = null) => { setEditingSupplier(s); setSupplierForm(s ? { ...s } : emptySupplierForm()); setShowSupplierForm(true); };
  const showConfirm = (msg, onOk) => setConfirmDialog({ msg, onOk });

  const handleDeletePurchaseBill = async (bill) => {
    showConfirm("Delete this purchase bill? Stock will be reversed.", async () => {
      try { await fetch(`${API_BASE}/purchase-bills/${bill.id}`, { method: 'DELETE' }); } catch (e) { }
      savePurchaseBills(purchaseBills.filter(b => b.id !== bill.id));
      let newItems = [...items];
      (bill.items || []).forEach(pi => { if (pi.itemId) newItems = newItems.map(i => i.id === pi.itemId ? { ...i, stock: Math.max(0, int(i.stock) - (int(pi.qty) + int(pi.freeQty || 0))) } : i); });
      await saveItems(newItems); saveBatches(batches.filter(b => b.purchaseBillId !== bill.id));
      showToast("Purchase bill deleted & stock reversed");
    });
  };

  const handleDeleteSalesBill = async (bill) => {
    showConfirm("Delete this sales bill? Stock will be restored.", async () => {
      try { await fetch(`${API_BASE}/sales-bills/${bill.id}`, { method: 'DELETE' }); } catch (e) { }
      await saveSalesBills(salesBills.filter(b => b.id !== bill.id));
      const sign = bill.isReturn ? -1 : 1; let newItems = [...items];
      (bill.items || []).filter(si => si.itemId).forEach(si => { newItems = newItems.map(i => i.id === si.itemId ? { ...i, stock: int(i.stock) + (int(si.qty) * sign) } : i); });
      await saveItems(newItems);
      setShowSalesForm(false);
      await loadAll();
      showToast("Sales bill deleted & stock restored");
    });
  };

  const handleDeleteSupplier = async (supplierId) => {
    showConfirm("Delete this supplier?", async () => {
      try { await fetch(`${API_BASE}/suppliers/${supplierId}`, { method: 'DELETE' }); } catch (e) { }
      const ln = suppliers.filter(s => s.id !== supplierId); setSuppliers(ln); save("store_suppliers", ln);
      showToast("Supplier deleted");
    });
  };

  const handleDeleteDoctor = async (id) => {
    showConfirm("Delete this doctor?", async () => {
      try { await fetch(`${API_BASE}/doctors/${id}`, { method: 'DELETE' }); } catch (e) { }
      const ln = doctors.filter(x => x.id !== id); setDoctors(ln); save("store_doctors", ln);
      showToast("Doctor deleted");
    });
  };

  const handleSaveDoctor = async (doctorForm, editDoctorId, onSuccess) => {
    if (!doctorForm.name) { showToast("Doctor name required", "error"); return; }
    try {
      let res;
      if (editDoctorId && !isNaN(editDoctorId)) {
        res = await fetch(`${API_BASE}/doctors/${editDoctorId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: doctorForm.name, speciality: doctorForm.speciality, phone: doctorForm.mobile,
            mobile: doctorForm.mobile, email: doctorForm.email || '', area: doctorForm.area || '', note: doctorForm.note || ''
          })
        });
      } else {
        res = await fetch(`${API_BASE}/doctors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: doctorForm.name, speciality: doctorForm.speciality, phone: doctorForm.mobile,
            mobile: doctorForm.mobile, email: doctorForm.email || '', area: doctorForm.area || '', note: doctorForm.note || ''
          })
        });
      }
      if (res && res.ok) {
        loadAll();
        showToast(editDoctorId ? "Doctor updated (DB)!" : "Doctor added (DB)!");
      } else {
        // Fallback: save locally
        const nd = editDoctorId
          ? doctors.map(d => d.id === editDoctorId ? { ...d, ...doctorForm } : d)
          : [...doctors, { ...doctorForm, id: uid() }];
        setDoctors(nd); save("store_doctors", nd);
        showToast(editDoctorId ? "Doctor updated (Local)!" : "Doctor added (Local)!");
      }
    } catch (e) {
      const nd = editDoctorId
        ? doctors.map(d => d.id === editDoctorId ? { ...d, ...doctorForm } : d)
        : [...doctors, { ...doctorForm, id: uid() }];
      setDoctors(nd); save("store_doctors", nd);
      showToast(editDoctorId ? "Doctor updated (Local)!" : "Doctor added (Local)!");
    }
    if (onSuccess) onSuccess();
  };

  const handleDeleteCustomer = async (id) => {
    showConfirm("Delete this customer?", async () => {
      try { await fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' }); } catch (e) { }
      const ln = customers.filter(x => x.id !== id); setCustomers(ln); save("store_customers", ln);
      showToast("Customer deleted");
    });
  };

  const handleDeletePayment = async (id) => {
    showConfirm("Delete this payment?", async () => {
      try { await fetch(`${API_BASE}/payments/${id}`, { method: 'DELETE' }); } catch (e) { }
      const ln = payments.filter(x => x.id !== id); setPayments(ln); save("store_payments", ln);
      showToast("Payment deleted");
    });
  };

  const handleDeleteBankEntry = async (id) => {
    showConfirm("Delete this bank entry?", async () => {
      try { await fetch(`${API_BASE}/bank-entries/${id}`, { method: 'DELETE' }); } catch (e) { }
      const ln = bankEntries.filter(x => x.id !== id); setBankEntries(ln); save("store_bankEntries", ln);
      showToast("Bank entry deleted");
    });
  };

  const handleDeleteKhataEntry = async (id) => {
    showConfirm("Delete this khata entry?", async () => {
      try { await fetch(`${API_BASE}/khata-entries/${id}`, { method: 'DELETE' }); } catch (e) { }
      const ln = khataEntries.filter(x => x.id !== id); setKhataEntries(ln); save("store_khata_entries", ln);
      showToast("Khata entry deleted");
    });
  };

  const handleDeleteAdvanceDeposit = async (id) => {
    showConfirm("Delete this advance deposit?", async () => {
      try { await fetch(`${API_BASE}/advance-deposits/${id}`, { method: 'DELETE' }); } catch (e) { }
      const ln = advanceDeposits.filter(x => x.id !== id); setAdvanceDeposits(ln); save("store_advance_deposits", ln);
      showToast("Advance deposit deleted");
    });
  };

  const handleDeleteReminder = async (id) => {
    showConfirm("Delete this reminder?", async () => {
      try { await fetch(`${API_BASE}/medicine-reminders/${id}`, { method: 'DELETE' }); } catch (e) { }
      const ln = reminders.filter(x => x.id !== id); setReminders(ln); save("store_reminders", ln);
      showToast("Reminder deleted");
    });
  };

  const handleDeleteBundleOffer = async (id) => {
    showConfirm("Delete this offer?", async () => {
      try { await fetch(`${API_BASE}/bundle-offers/${id}`, { method: 'DELETE' }); } catch (e) { }
      const ln = bundleOffers.filter(x => x.id !== id); setBundleOffers(ln); save("store_offers", ln);
      showToast("Offer deleted");
    });
  };




  const handleSaveSupplier = async () => {
    if (!supplierForm.name) { showToast("Name is required", "error"); return; }

    // Save to DB
    try {
      const payload = {
        name: supplierForm.name,
        address: supplierForm.address,
        city: supplierForm.city,
        state: supplierForm.state,
        mobile: supplierForm.mobile || supplierForm.contact,
        email: supplierForm.email,
        gst_tin: supplierForm.gstTin
      };
      let res;
      if (editingSupplier && !isNaN(editingSupplier.id)) {
        res = await fetch(`${API_BASE}/suppliers/${editingSupplier.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/suppliers`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
      }
      if (res && res.ok) {
        loadAll();
        showToast(editingSupplier ? "Supplier updated (DB)!" : "Supplier added (DB)!");
      } else {
        if (editingSupplier) saveSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...s, ...supplierForm } : s));
        else saveSuppliers([...suppliers, { id: uid(), ...supplierForm, createdAt: nowStr() }]);
        showToast(editingSupplier ? "Supplier updated (Local)!" : "Supplier added (Local)!");
      }
    } catch (e) {
      if (editingSupplier) saveSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...s, ...supplierForm } : s));
      else saveSuppliers([...suppliers, { id: uid(), ...supplierForm, createdAt: nowStr() }]);
      showToast(editingSupplier ? "Supplier updated (Local)!" : "Supplier added (Local)!");
    }

    setShowSupplierForm(false); setEditingSupplier(null);
  };

  // ═══════════════════════════════════════════════════
  // CUSTOMER CART / ORDERS
  // ═══════════════════════════════════════════════════
  const addToCart = (item) => { const ex = cart.find(i => i.id === item.id); setCart(ex ? cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...cart, { ...item, quantity: 1 }]); showToast(`${item.name} added to cart!`); };
  const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));
  const updateCartQty = (id, qty) => { if (qty <= 0) removeFromCart(id); else setCart(cart.map(i => i.id === id ? { ...i, quantity: qty } : i)); };
  const placeOrder = () => { if (!cart.length) return; setOrderForm({ name: currentUser.name || "", phone: currentUser.phone || "", address: currentUser.address || "", paymentMode: "cash" }); setShowOrderForm(true); };

  const confirmOrder = async () => {
    if (!orderForm.name || !orderForm.phone || !orderForm.address) { showToast("Name, Phone and Address required", "error"); return; }
    if (orderForm.paymentMode === "upi" && !orderForm.transactionId) { showToast("Please enter UPI Transaction ID", "error"); return; }
    const order = { id: uid(), items: cart, total: calcTotal(cart), date: nowStr(), status: "Pending", paymentMode: orderForm.paymentMode, transactionId: orderForm.transactionId || "", customer: { name: orderForm.name, email: currentUser.email, phone: orderForm.phone, address: orderForm.address } };

    // Save to DB
    try {
      const res = await fetch(`${API_BASE}/cust-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: order.customer,
          total: order.total,
          paymentMode: order.paymentMode,
          transactionId: order.transactionId,
          status: order.status,
          date: order.date,
          items: order.items
        })
      });
      if (res.ok) {
        loadAll(); showToast("Order placed & saved to DB! 🎉");
      } else {
      }
    } catch (e) {
    }
    setCart([]); setShowCart(false); setShowOrderForm(false); setOrderForm({ name: "", phone: "", address: "", paymentMode: "cash", transactionId: "" });
  };


  // ═══════════════════════════════════════════════════
  // REPORTS
  // ═══════════════════════════════════════════════════
  const getSalesReport = () => {
    const now = new Date(); let filtered = salesBills.filter(b => !b.isReturn);
    if (reportPeriod === "today") filtered = filtered.filter(b => new Date(b.date).toDateString() === now.toDateString());
    else if (reportPeriod === "week") filtered = filtered.filter(b => (now - new Date(b.date)) < 7 * 86400000);
    else if (reportPeriod === "month") filtered = filtered.filter(b => new Date(b.date).getMonth() === now.getMonth() && new Date(b.date).getFullYear() === now.getFullYear());
    const revenue = filtered.reduce((s, b) => s + num(b.netAmount), 0);
    const returns = salesBills.filter(b => b.isReturn).reduce((s, b) => s + Math.abs(num(b.netAmount)), 0);
    const purchaseTotal = purchaseBills.filter(b => {
      if (reportPeriod === "today") return new Date(b.createdAt).toDateString() === now.toDateString();
      if (reportPeriod === "week") return (now - new Date(b.createdAt)) < 7 * 86400000;
      if (reportPeriod === "month") return new Date(b.createdAt).getMonth() === now.getMonth() && new Date(b.createdAt).getFullYear() === now.getFullYear();
      return true;
    }).reduce((s, b) => s + num(b.total), 0);
    return { filtered, revenue, returns, purchaseTotal, profit: revenue - purchaseTotal };
  };

  // ═══════════════════════════════════════════════════
  // KHATA / UDHAR HANDLERS
  // ═══════════════════════════════════════════════════
  const saveKhata = (l) => { setKhataEntries(l); localStorage.setItem('store_khata', JSON.stringify(l)); };

  const handleSaveKhata = async (form) => {
    if (!form.customerName || !form.amount) { showToast("Customer name and amount required", "error"); return; }
    const entry = { id: uid(), customerName: (form.customerName || "").toUpperCase(), customerPhone: form.customerPhone || "", amount: num(form.amount), paidAmount: 0, note: form.note || "", date: form.date || today(), createdAt: nowStr(), payments: [] };

    try {
      const res = await fetch(`${API_BASE}/khata-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: entry.customerName,
          customer_phone: entry.customerPhone,
          amount: entry.amount,
          paid_amount: entry.paidAmount,
          note: entry.note,
          date: entry.date,
          cleared: false
        })
      });
      if (res.ok) {
        loadAll();
        showToast(`₹${form.amount} Due for ${entry.customerName} (DB) added!`);
      } else {
        const ln = [...khataEntries, entry];
        setKhataEntries(ln); save("store_khata_entries", ln);
        showToast(`₹${form.amount} Due for ${entry.customerName} added!`);
      }
    } catch (e) {
      const ln = [...khataEntries, entry];
      setKhataEntries(ln); save("store_khata_entries", ln);
      showToast(`₹${form.amount} Due for ${entry.customerName} added!`);
    }

    setShowKhataForm(false); setKhataForm({ customerName: "", customerPhone: "", amount: "", note: "", date: "" });
  };

  const handleCollectKhataPayment = async (entryId, collectAmt) => {
    const amt = num(collectAmt);
    if (!amt) { showToast("Enter Amount", "error"); return; }

    const entry = khataEntries.find(e => e.id === entryId);
    if (!entry) return;

    const newPaid = num(entry.paidAmount) + amt;
    const cleared = newPaid >= num(entry.amount);

    try {
      if (!isNaN(entryId)) {
        const res = await fetch(`${API_BASE}/khata-entries/${entryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paid_amount: newPaid, cleared })
        });
        if (res.ok) {
          loadAll(); showToast("Payment synced to DB!");
          setShowKhataCollect(null); setKhataCollectAmt(""); return;
        }
      }
    } catch (e) { }

    const updated = khataEntries.map(e => {
      if (e.id !== entryId) return e;
      const pmts = [...(e.payments || []), { amount: amt, date: today(), id: uid() }];
      return { ...e, paidAmount: newPaid, payments: pmts, cleared };
    });
    saveKhata(updated); showToast("Payment collected (Local)!");
    setShowKhataCollect(null); setKhataCollectAmt("");
  };

  const getKhataBalance = (customerName) => {
    const entries = khataEntries.filter(e => e.customerName === (customerName || "").toUpperCase() && !e.cleared);
    return entries.reduce((s, e) => s + num(e.amount) - num(e.paidAmount), 0);
  };

  // ═══════════════════════════════════════════════════
  // ADVANCE DEPOSIT HANDLERS
  // ═══════════════════════════════════════════════════
  const saveAdvances = (l) => { setAdvanceDeposits(l); localStorage.setItem('store_advances', JSON.stringify(l)); };

  const handleSaveAdvance = async () => {
    if (!advanceForm.customerName || !advanceForm.amount) { showToast("Customer name and amount required", "error"); return; }
    const a = { id: uid(), customerName: (advanceForm.customerName || "").toUpperCase(), customerPhone: advanceForm.customerPhone || "", amount: num(advanceForm.amount), usedAmount: 0, note: advanceForm.note || "", createdAt: nowStr() };

    try {
      const res = await fetch(`${API_BASE}/advance-deposits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: a.customerName,
          customer_phone: a.customerPhone,
          amount: a.amount,
          used_amount: a.usedAmount,
          note: a.note
        })
      });
      if (res.ok) {
        loadAll();
        showToast(`₹${advanceForm.amount} Advance for ${a.customerName} (DB)!`);
      } else {
        const ln = [...advanceDeposits, a];
        setAdvanceDeposits(ln); save("store_advance_deposits", ln);
        showToast(`₹${advanceForm.amount} Advance for ${a.customerName}!`);
      }
    } catch (e) {
      const ln = [...advanceDeposits, a];
      setAdvanceDeposits(ln); save("store_advance_deposits", ln);
      showToast(`₹${advanceForm.amount} Advance for ${a.customerName}!`);
    }

    setShowAdvanceForm(false); setAdvanceForm({ customerName: "", customerPhone: "", amount: "", note: "" });
  };

  const getAdvanceBalance = (customerName) => {
    const entries = advanceDeposits.filter(e => e.customerName === (customerName || "").toUpperCase());
    return entries.reduce((s, e) => s + num(e.amount) - num(e.usedAmount), 0);
  };

  // ═══════════════════════════════════════════════════
  // BUNDLE OFFER HANDLERS
  // ═══════════════════════════════════════════════════
  const saveBundleOffers = (l) => { setBundleOffers(l); localStorage.setItem('store_offers', JSON.stringify(l)); };

  const handleSaveOffer = async () => {
    if (!offerForm.name || !offerForm.itemNames || !offerForm.discountPct) { showToast("Offer name, items, discount required", "error"); return; }
    const newId = editOfferId || uid();
    const updatedOffer = { id: newId, ...offerForm, createdAt: nowStr() };
    // Save to DB
    try {
      const method = editOfferId ? 'PUT' : 'POST';
      const url = editOfferId ? `${API_BASE}/bundle-offers/${editOfferId}` : `${API_BASE}/bundle-offers`;
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newId, name: offerForm.name, itemNames: offerForm.itemNames, discountPct: offerForm.discountPct, active: offerForm.active })
      });
      loadAll();
    } catch (e) {
      // Fallback to local
      if (editOfferId) saveBundleOffers(bundleOffers.map(o => o.id === editOfferId ? { ...o, ...offerForm } : o));
      else saveBundleOffers([...bundleOffers, updatedOffer]);
    }
    showToast(editOfferId ? "Offer updated!" : "Offer created!"); setShowOfferForm(false); setEditOfferId(null); setOfferForm({ name: "", itemNames: "", discountPct: "5", active: true });
  };

  const checkBundleOffer = (salesItemsList) => {
    const itemNames = salesItemsList.filter(si => si.itemName).map(si => (si.itemName || "").toUpperCase());
    for (const offer of bundleOffers.filter(o => o.active)) {
      const needed = (offer.itemNames || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
      if (needed.length > 0 && needed.every(n => itemNames.some(nm => nm.includes(n)))) return offer;
    }
    return null;
  };

  // ═══════════════════════════════════════════════════
  // LOYALTY POINTS HANDLERS
  // ═══════════════════════════════════════════════════
  const saveLoyalty = (d) => { setLoyaltyData(d); localStorage.setItem('store_loyalty', JSON.stringify(d)); };

  const getCustomerPoints = (email) => { if (!email) return 0; return num((loyaltyData[email.toUpperCase()] || {}).points || 0); };

  const earnPoints = (email, amount) => {
    if (!email || !amount) return;
    const key = email.toUpperCase();
    const pts = Math.floor(num(amount) / 100) * loyaltyRate;
    const updated = { ...loyaltyData, [key]: { points: (num((loyaltyData[key] || {}).points)) + pts, totalEarned: (num((loyaltyData[key] || {}).totalEarned)) + pts } };
    saveLoyalty(updated);
  };

  const redeemPoints = (email, points) => {
    if (!email || !points) return;
    const key = email.toUpperCase();
    const cur = loyaltyData[key] || { points: 0 };
    const updated = { ...loyaltyData, [key]: { ...cur, points: Math.max(0, num(cur.points) - num(points)) } };
    saveLoyalty(updated);
  };

  const getVIPLevel = (email) => {
    if (!email) return { label: "Regular", badge: "", color: "#64748b", min: 0 };
    const key = email.toUpperCase();
    const spent = salesBills.filter(b => !b.isReturn && (b.patientName || "").toUpperCase() === key.split("@")[0]).reduce((s, b) => s + num(b.netAmount), 0)
    if (spent >= 10000) return { label: "Gold VIP", badge: "🥇", color: "#f59e0b", min: 10000, spent };
    if (spent >= 2000) return { label: "Silver", badge: "🥈", color: "#94a3b8", min: 2000, spent };
    return { label: "Regular", badge: "🥉", color: "#92400e", min: 0, spent };
  };

  // ═══════════════════════════════════════════════════
  // HEALTH CARD HANDLERS
  // ═══════════════════════════════════════════════════
  const saveHealthCards = (d) => { setHealthCards(d); localStorage.setItem('store_health_cards', JSON.stringify(d)); };

  const handleSaveHealthCard = (email, form) => {
    const key = (email || "").toUpperCase();
    saveHealthCards({ ...healthCards, [key]: form });
    showToast("Health Card saved!"); setShowHealthCard(false);
  };

  const getHealthCard = (email) => healthCards[(email || "").toUpperCase()] || null;



  // ═══════════════════════════════════════════════════
  // MEDICINE REMINDER HANDLERS
  // ═══════════════════════════════════════════════════
  const saveReminders = (l) => { setReminders(l); localStorage.setItem('store_reminders', JSON.stringify(l)); };

  const handleSaveReminder = async (email) => {
    if (!reminderForm.medicineName) { showToast("Medicine name required", "error"); return; }
    const r = { id: uid(), email: (email || "").toUpperCase(), ...reminderForm, createdAt: nowStr() };
    // Save to DB
    try {
      const res = await fetch(`${API_BASE}/medicine-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: r.email,
          medicineName: r.medicineName,
          dosage: r.dosage,
          morning: r.morning,
          afternoon: r.afternoon,
          night: r.night,
          duration: r.duration,
          startDate: r.startDate,
          memberFor: r.memberFor
        })
      });
      if (res.ok) { loadAll(); }
      else { saveReminders([...reminders, r]); }
    } catch (e) { saveReminders([...reminders, r]); }
    showToast("Reminder set!"); setShowReminderForm(false); setReminderForm({ medicineName: "", dosage: "", morning: false, afternoon: false, night: false, duration: "30", startDate: "", memberFor: "Myself" });
  };

  const getMyReminders = (email) => reminders.filter(r => r.email === (email || "").toUpperCase());

  const getDueReminders = (email) => {
    const now = new Date();
    return reminders.filter(r => r.email === (email || "").toUpperCase()).filter(r => {
      if (!r.startDate) return false;
      const start = new Date(r.startDate);
      const end = new Date(start); end.setDate(end.getDate() + int(r.duration || 30));
      const daysLeft = Math.ceil((end - now) / 86400000);
      return daysLeft >= 0 && daysLeft <= 5;
    });
  };


  // ═══════════════════════════════════════════════════
  // FAMILY MEMBERS HANDLERS
  // ═══════════════════════════════════════════════════
  const saveFamilyMembers = (d) => { setFamilyMembers(d); localStorage.setItem('store_family', JSON.stringify(d)); };

  const handleSaveFamilyMember = (email) => {
    if (!familyForm.name || !familyForm.relation) { showToast("Name and relation required", "error"); return; }
    const key = (email || "").toUpperCase();
    const existing = (familyMembers[key] || []);
    const updated = { ...familyMembers, [key]: [...existing, { id: uid(), ...familyForm, name: (familyForm.name || "").toUpperCase() }] };
    saveFamilyMembers(updated); showToast("Family member added!"); setShowFamilyForm(false); setFamilyForm({ name: "", relation: "", dob: "" });
  };

  const getMyFamily = (email) => (familyMembers[(email || "").toUpperCase()] || []);

  const handleDeleteFamilyMember = (email, memberId) => {
    const key = (email || "").toUpperCase();
    const updated = { ...familyMembers, [key]: (familyMembers[key] || []).filter(m => m.id !== memberId) };
    saveFamilyMembers(updated); showToast("Member removed");
  };

  // ═══════════════════════════════════════════════════
  // ANALYTICS / DERIVED HANDLERS
  // ═══════════════════════════════════════════════════
  const getBestSellers = (period = "month") => {
    const now = new Date();
    let bills = salesBills.filter(b => !b.isReturn);
    if (period === "week") bills = bills.filter(b => (now - new Date(b.date)) < 7 * 86400000);
    else if (period === "month") bills = bills.filter(b => new Date(b.date).getMonth() === now.getMonth() && new Date(b.date).getFullYear() === now.getFullYear());
    const map = {};
    bills.forEach(b => (b.items || []).forEach(si => { if (!si.itemName) return; const k = si.itemId || si.itemName; if (!map[k]) map[k] = { name: si.itemName, qty: 0, revenue: 0 }; map[k].qty += int(si.qty); map[k].revenue += num(si.amount); }));
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 10);
  };

  const getDeadStock = (days = 90) => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    const soldItemIds = new Set();
    salesBills.filter(b => new Date(b.date) >= cutoff).forEach(b => (b.items || []).forEach(si => { if (si.itemId) soldItemIds.add(si.itemId); }));
    return items.filter(i => i.stock > 0 && !soldItemIds.has(i.id)).map(i => ({ ...i, stockValue: num(i.pRate || i.price) * int(i.stock) }));
  };

  const getPatientHistory = (patientName) => {
    if (!patientName) return [];
    const name = (patientName || "").toUpperCase();
    return salesBills.filter(b => !b.isReturn && (b.patientName || "").toUpperCase() === name).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getDueDateAlerts = () => {
    const alerts = [];
    salesBills.filter(b => !b.isReturn && b.refillDate).forEach(b => {
      const due = new Date(b.refillDate);
      const daysLeft = Math.ceil((due - new Date()) / 86400000);
      if (daysLeft >= 0 && daysLeft <= 7) alerts.push({ ...b, daysLeft });
    });
    return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
  };

  const getDoctorReport = (period = "month") => {
    const now = new Date();
    let bills = salesBills.filter(b => !b.isReturn && b.doctorName);
    if (period === "month") bills = bills.filter(b => new Date(b.date).getMonth() === now.getMonth() && new Date(b.date).getFullYear() === now.getFullYear());
    const map = {};
    bills.forEach(b => { const d = b.doctorName; if (!d) return; if (!map[d]) map[d] = { name: d, count: 0, revenue: 0 }; map[d].count++; map[d].revenue += num(b.netAmount); });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  };

  const getSupplierScore = (supplierId) => {
    const bills = purchaseBills.filter(b => b.supplierId === supplierId);
    if (!bills.length) return { score: 0, label: "No Data" };
    const returns = bills.filter(b => b.hasReturn).length;
    const returnRate = returns / bills.length;
    const score = Math.max(1, 5 - Math.round(returnRate * 5));
    return { score, label: "⭐".repeat(score) + "☆".repeat(5 - score), bills: bills.length, returns };
  };

  const getLiveProfitToday = () => {
    const now = new Date().toDateString();
    const todaySales = salesBills.filter(b => !b.isReturn && new Date(b.date).toDateString() === now).reduce((s, b) => s + num(b.netAmount), 0);
    const todayPurchase = purchaseBills.filter(b => { const d = b.entryDate || b.createdAt || b.billDate; return new Date(d).toDateString() === now; }).reduce((s, b) => s + num(b.netAmount || b.total || b.totalAmount || 0), 0);
    return { sales: todaySales, purchase: todayPurchase, profit: todaySales - todayPurchase };
  };

  const getMonthlyGrowth = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const m = d.getMonth(), y = d.getFullYear();
      const label = d.toLocaleString("default", { month: "short" }) + " " + y;
      const sales = salesBills.filter(b => !b.isReturn && new Date(b.date).getMonth() === m && new Date(b.date).getFullYear() === y).reduce((s, b) => s + num(b.netAmount), 0);
      const purchase = purchaseBills.filter(b => { const bd = new Date(b.createdAt || b.billDate); return bd.getMonth() === m && bd.getFullYear() === y; }).reduce((s, b) => s + num(b.netAmount || b.totalAmount || 0), 0);
      months.push({ label, sales, purchase, profit: sales - purchase });
    }
    return months;
  };

  const getAutoPurchaseDrafts = () => items.filter(i => i.minimum && int(i.stock) <= int(i.minimum));

  // ═══════════════════════════════════════════════════
  // WHATSAPP BILL HANDLER
  // ═══════════════════════════════════════════════════
  const generateBillHTML = (bill) => {
    const storeName = currentUser?.pharmacyName || "Shiv Dhara Medical Store";
    const storeAddr = appSetupData?.address1 || "20, Giriraj Complex, Nikol, Ahmedabad";
    const gstNo = appSetupData?.gstNo || "24AJFPP4074M1ZU";
    const dlNo = appSetupData?.dlNo || "DL NO:20 GARA 588,21 GARA 588.";
    const footMsg = appSetupData?.message || "HAVE A FAST RECOVERY & GOOD HEALTH";
    const dateStr = new Date(bill.date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = new Date(bill.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const validItems = (bill.items || []).filter(si => si.itemId && si.itemName);
    const rows = validItems.map((si, i) => {
      const rate = num(si.rate), qty = int(si.qty), disc = num(si.disc), gst = num(si.gst);
      const base = rate * qty, discAmt = base * disc / 100, taxable = base - discAmt, gstAmt = taxable * gst / 100, total = num(si.amount || 0);
      return `<tr><td style="padding:4px 6px;border-bottom:1px solid #e2e8f0">${i + 1}</td><td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-weight:600">${si.itemName}</td><td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:center">${qty}</td><td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right">&#8377;${fmt(rate)}</td><td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right">${disc || 0}%</td><td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right">${gst || 0}%</td><td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right">&#8377;${fmt(gstAmt)}</td><td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700">&#8377;${fmt(total)}</td></tr>`;
    }).join("");
    const gross = validItems.reduce((s, si) => s + num(si.amount || 0), 0);
    const discPct = num(bill.discount) || 0, discAmt = gross * discPct / 100, net = num(bill.netAmount || 0);
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bill #${bill.billNo}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:11px;background:#fff;color:#000;padding:14px;max-width:780px;margin:0 auto}.hdr{text-align:center;border-bottom:3px double #1a3a5c;padding-bottom:8px;margin-bottom:8px}.sname{font-size:17px;font-weight:900;color:#1a3a5c;letter-spacing:1px}.saddr{font-size:10px;color:#444;margin-top:2px}.sinfo{font-size:10px;color:#444}.btitle{text-align:center;font-size:12px;font-weight:900;color:#fff;background:#1a3a5c;padding:5px;margin-bottom:8px;letter-spacing:3px}.bmeta{display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;background:#f0f4ff;padding:8px 10px;border:1px solid #c7d2fe;border-radius:4px;margin-bottom:8px;font-size:11px}.bmeta b{color:#1a3a5c}table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:8px}thead tr{background:#1a3a5c;color:white}th{padding:5px 6px;text-align:left;font-weight:700}.tot{float:right;width:280px;font-size:11px;border-top:2px solid #1a3a5c;margin-bottom:8px}.tot td{padding:3px 6px}.net td{font-size:13px;font-weight:900;color:#16a34a;border-top:2px solid #1a3a5c;padding-top:5px}.ftr{text-align:center;border-top:3px double #1a3a5c;padding-top:8px;font-size:10px;color:#555;clear:both}@media print{body{padding:4px}button{display:none}}</style></head><body>
<div class="hdr"><div class="sname">&#127973; ${storeName}</div><div class="saddr">&#128205; ${storeAddr}</div><div class="sinfo">GSTIN: ${gstNo} &nbsp;|&nbsp; ${dlNo}</div></div>
<div class="btitle">CASH MEMO / SALES BILL</div>
<div class="bmeta"><div><b>Bill No :</b> #${bill.billNo || bill.id}</div><div><b>Date :</b> ${dateStr} ${timeStr}</div><div><b>Patient :</b> ${bill.patientName || "—"}</div><div><b>Mobile :</b> ${bill.mobile || "—"}</div>${bill.doctorName ? `<div><b>Doctor :</b> Dr. ${bill.doctorName}</div>` : ""}${bill.patientArea ? `<div><b>Area :</b> ${bill.patientArea}</div>` : ""}<div><b>Payment :</b> ${(bill.paymentMode || "CASH").toUpperCase()}</div><div><b>S.Man :</b> ${bill.salesMan || "—"}</div></div>
<table><thead><tr><th>#</th><th>Item Name</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Disc%</th><th style="text-align:right">GST%</th><th style="text-align:right">GST Amt</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<table class="tot"><tr><td>Gross Amount:</td><td style="text-align:right">&#8377;${fmt(gross)}</td></tr>${discPct > 0 ? `<tr><td>Discount (${discPct}%):</td><td style="text-align:right;color:#ef4444">-&#8377;${fmt(discAmt)}</td></tr>` : ""}<tr class="net"><td><b>NET AMOUNT:</b></td><td style="text-align:right"><b>&#8377;${fmt(net)}</b></td></tr></table>
<div class="ftr"><div>&#128138; ${footMsg} &#128138;</div><div style="margin-top:4px">&#128222; 9924237606 &nbsp;|&nbsp; ${storeName}</div><div style="margin-top:4px;font-size:9px">Please check MRP. Keep medicines out of reach of children.</div></div>
<div style="text-align:center;margin-top:16px"><button onclick="window.print()" style="background:#1a3a5c;color:white;border:none;padding:10px 28px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:700">&#128438; Print / Save as PDF</button></div>
</body></html>`;
  };

  const handleWhatsAppBill = (bill) => {
    const ph = (bill.mobile || "").replace(/\D/g, "");
    if (!ph) { showToast("Mobile No is missing on bill — please add first", "error"); return; }

    const storeName = currentUser?.pharmacyName || "Shiv Dhara Medical Store";
    const storePhone = "9924237606";
    const footMsg = appSetupData?.message || "HAVE A FAST RECOVERY & GOOD HEALTH";
    const dateStr = new Date(bill.date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = new Date(bill.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const validItems = (bill.items || []).filter(si => si.itemId && si.itemName);
    const gross = validItems.reduce((s, si) => s + num(si.amount || 0), 0);
    const discPct = num(bill.discount) || 0;
    const discAmt = gross * discPct / 100;
    const net = num(bill.netAmount || 0);

    // Build formatted bill text message
    let msg = "";
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏥 *${storeName}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📋 *SALES BILL*\n\n`;
    msg += `🔢 Bill No: *#${bill.billNo || bill.id}*\n`;
    msg += `📅 Date: ${dateStr} ${timeStr}\n`;
    msg += `👤 Patient: *${bill.patientName || "—"}*\n`;
    if (bill.doctorName) msg += `🩺 Doctor: Dr. ${bill.doctorName}\n`;
    if (bill.patientArea) msg += `📍 Area: ${bill.patientArea}\n`;
    msg += `💳 Payment: ${(bill.paymentMode || "CASH").toUpperCase()}\n`;
    msg += `\n────────────────────\n`;
    msg += `📦 *ITEMS:*\n`;
    msg += `────────────────────\n`;
    validItems.forEach((si, i) => {
      const qty = int(si.qty);
      const rate = num(si.rate);
      const amt = num(si.amount || 0);
      msg += `${i + 1}. ${si.itemName}\n`;
      msg += `   ${qty} × ₹${fmt(rate)} = *₹${fmt(amt)}*\n`;
    });
    msg += `────────────────────\n`;
    msg += `   Gross: ₹${fmt(gross)}\n`;
    if (discPct > 0) {
      msg += `   Disc (${discPct}%): -₹${fmt(discAmt)}\n`;
    }
    msg += `\n💰 *NET AMOUNT: ₹${fmt(net)}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💊 ${footMsg}\n`;
    msg += `📞 ${storePhone} | ${storeName}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━`;

    // Directly open WhatsApp to customer's number with bill message
    const waUrl = `https://wa.me/91${ph}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
    showToast("Bill sent on Whatsapp✅");
  };




  // ═══════════════════════════════════════════════════
  // DAY END CASH SUMMARY
  // ═══════════════════════════════════════════════════
  const handleSaveDayEnd = () => {
    const todayStr = today();
    const cashSales = salesBills.filter(b => !b.isReturn && b.date === todayStr && (b.paymentMode === "cash" || b.splitCash)).reduce((s, b) => s + num(b.splitCash || b.netAmount), 0);
    const upiSales = salesBills.filter(b => !b.isReturn && b.date === todayStr && b.paymentMode === "upi").reduce((s, b) => s + num(b.netAmount), 0);
    const creditSales = salesBills.filter(b => !b.isReturn && b.date === todayStr && b.paymentMode === "credit").reduce((s, b) => s + num(b.netAmount), 0);
    const physical = num(physicalCash);
    const diff = physical - cashSales;
    const entry = { id: uid(), date: todayStr, cashSales, upiSales, creditSales, physical, diff, savedAt: nowStr() };
    const updated = [...dayEndHistory, entry]; setDayEndHistory(updated); localStorage.setItem('store_dayend', JSON.stringify(updated));
    showToast("Day End Summary saved!"); setShowDayEnd(false); setPhysicalCash("");
  };

  // ═══════════════════════════════════════════════════
  // EXPORT / IMPORT
  // ═══════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════
  // BACKUP / RESTORE SYSTEM
  // ═══════════════════════════════════════════════════
  const encryptData = (str, pass) => {
    let result = "";
    for (let i = 0; i < str.length; i++) result += String.fromCharCode(str.charCodeAt(i) ^ pass.charCodeAt(i % pass.length));
    return btoa(result);
  };
  const decryptData = (enc, pass) => {
    try {
      const str = atob(enc);
      let result = "";
      for (let i = 0; i < str.length; i++) result += String.fromCharCode(str.charCodeAt(i) ^ pass.charCodeAt(i % pass.length));
      return result;
    } catch (_) { return null; }
  };
  // Backup password stored in localStorage - user sets their own
  const getBackupPassword = () => localStorage.getItem("store_backup_pass") || null;
  const setStoredBackupPassword = (p) => localStorage.setItem("store_backup_pass", p);

  const [showBackupPassModal, setShowBackupPassModal] = useState(false);
  const [backupPassInput, setBackupPassInput] = useState("");
  const [backupPassError, setBackupPassError] = useState("");
  const [backupIsFirstTime, setBackupIsFirstTime] = useState(false);
  const [backupConfirmInput, setBackupConfirmInput] = useState("");
  const [showRestorePassModal, setShowRestorePassModal] = useState(false);
  const [restorePassInput, setRestorePassInput] = useState("");
  const [newPassInput, setNewPassInput] = useState("");
  const [showNewPassStep, setShowNewPassStep] = useState(false);
  const [showDeletePassModal, setShowDeletePassModal] = useState(false);
  const [deletePassInput, setDeletePassInput] = useState("");
  const [deletePassError, setDeletePassError] = useState("");
  const [pendingRestoreData, setPendingRestoreData] = useState(null);
  const [showForgotBackupPass, setShowForgotBackupPass] = useState(false);
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotOldPass, setForgotOldPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");

  const handleExportData = () => {
    setBackupPassError("");
    setShowBackupPassModal(true);
  };

  const doEncryptedBackup = () => {
    if (!sessionPassword) {
      showToast("❌ Session expired, please login again!", "error");
      return;
    }
    if (backupPassInput !== sessionPassword) {
      setBackupPassError("❌ Incorrect password! Enter login password.");
      return;
    }
    const data = { items, batches, suppliers, purchaseBills, salesBills, payments, bankEntries, upiSettings, doctors, exportedAt: nowStr() };
    const encrypted = encryptData(JSON.stringify(data), "MASTER_SHIVDHARA_KEY_2026");
    const blob = new Blob([encrypted], { type: "text/plain" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `shivdhara_backup_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.smd`;
    a.click(); URL.revokeObjectURL(url);
    setShowBackupPassModal(false);
    setBackupPassInput("");
    setBackupPassError("");
    showToast("✅ Backup downloaded successfully using your Login Password!", "success");
  };

  const handleForgotBackupPass = async () => {
    if (!forgotOldPass) {
      setBackupPassError("❌ Enter old password first!");
      return;
    }
    if (!forgotNewPass || forgotNewPass.length < 4) {
      setBackupPassError("❌ Navo password minimum 4 character no rakhvo!");
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setBackupPassError("❌ Both new passwords do not match!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id, oldPassword: forgotOldPass, newPassword: forgotNewPass })
      });
      const data = await res.json();

      if (!res.ok) {
        setBackupPassError("❌ " + (data.error || "Password change failed!"));
        return;
      }

      setSessionPassword(forgotNewPass);
      setShowForgotBackupPass(false);
      setShowBackupPassModal(false);
      setForgotOldPass(""); setForgotNewPass(""); setForgotConfirmPass("");
      setBackupPassError("");
      showToast("✅ Login Password changed successfully!", "success");
    } catch (e) {
      console.error(e);
      setBackupPassError("❌ Server connection failed!");
    }
  };

  const handleImportData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Step 1: Store raw encrypted content
      const rawContent = ev.target.result.trim();
      if (!rawContent) { showToast("❌ File is empty!", "error"); return; }
      // Step 2: Save raw file content for later decryption
      setPendingRestoreData(rawContent);
      // Step 3: Open password box — user password nakhe pachhi decrypt thashe
      setRestorePassInput("");
      setBackupPassError("");
      setShowRestorePassModal(true);
    };
    reader.readAsText(file);
  };


  // ═══════════════════════════════════════════════════
  // FEATURE 1: BARCODE SCAN
  // ═══════════════════════════════════════════════════
  const [barcodeTarget, setBarcodeTarget] = useState(null); // 'sales' | 'purchase'
  const [barcodeNewItemModal, setBarcodeNewItemModal] = useState(null); // {code, target} — when item not found
  const [barcodeNewItemForm, setBarcodeNewItemForm] = useState({});
  const [barcodeFetching, setBarcodeFetching] = useState(false);
  const [barcodeFetchSource, setBarcodeFetchSource] = useState(""); // which API found it
  const [barcodeQtyModal, setBarcodeQtyModal] = useState(null); // {item, target}
  const [barcodeQtyInput, setBarcodeQtyInput] = useState("1");

  // ═══════════════════════════════════════════════════
  // BARCODE SYSTEM — Unified Flow
  // ═══════════════════════════════════════════════════

  const getItemByBarcode = (code) => {
    const c = (code || "").trim().toUpperCase();
    if (!c) return null;
    // Search by barcode field first, then batchNumber, then partial name match
    return items.find(i => (i.barcode || "").trim().toUpperCase() === c)
      || items.find(i => (i.batchNumber || "").trim().toUpperCase() === c);
  };

  // Main barcode handler — called from inventory / sales / purchase
  const handleBarcodeDetected = (code, target) => {
    const tgt = target || barcodeTarget || 'sales';
    const trimmed = (code || "").trim();
    if (!trimmed) return;

    const found = getItemByBarcode(trimmed);

    if (found) {
      if (tgt === 'inventory') {
        // Inventory scan — item already exists, open edit
        openItemForm(found.division || "medicines", found);
        showToast("✅ Item found: " + found.name + " — Please edit");
        return;
      }
      // Sales or Purchase — open qty modal
      const maxQty = (tgt === 'purchase' || tgt === 'purchase_challan') ? 9999 : (int(found.stock) || 0);
      setBarcodeQtyModal({ item: found, target: tgt, maxQty });
      setBarcodeQtyInput("1");
      return;
    }

    // ── Item NOT found — open modal + auto-fetch from internet ──
    setBarcodeNewItemForm({
      barcode: trimmed, name: "", company: "", mrp: "", pRate: "",
      gst: "12", hsn: "", division: "medicines", stock: "0", unit: "strip"
    });
    setBarcodeFetchSource("");
    setBarcodeFetching(true);
    setBarcodeNewItemModal({ code: trimmed, target: tgt });
    fetchBarcodeData(trimmed);
  };

  const handleBarcodeQtyConfirm = () => {
    if (!barcodeQtyModal) return;
    const { item, target, maxQty } = barcodeQtyModal;
    const qty = int(barcodeQtyInput);
    if (qty <= 0) { showToast("Enter valid quantity!", "error"); return; }

    if (target === 'sales') {
      if (qty > maxQty) { showToast("Only " + maxQty + " in stock!", "error"); return; }
      const si = {
        ...emptySalesItem(), itemId: item.id, itemName: item.name,
        mrp: num((item as any).mrp) || num(item.price) || 0,
        rate: num(item.price) || num((item as any).mrp) || 0,
        gst: num(item.gst) || 0, disc: num(item.discount) || 0, qty: String(qty)
      };
      si.amount = calcSalesItemAmt(si);
      setSalesItems(prev => {
        const idx = prev.findIndex(s => s.itemId === item.id);
        if (idx >= 0) {
          const upd = [...prev];
          const nq = int(upd[idx].qty) + qty;
          if (nq > maxQty) { showToast("Only " + maxQty + " in stock!", "error"); return prev; }
          upd[idx] = { ...upd[idx], qty: String(nq) };
          upd[idx].amount = calcSalesItemAmt(upd[idx]);
          return upd;
        }
        return [...prev.filter(s => s.itemId), si];
      });
      showToast("✅ " + item.name + " × " + qty + " added to Sales Bill!");
    }

    if (target === 'purchase') {
      const pi = {
        ...emptyPurchaseItem(),
        itemId: item.id, itemName: item.name,
        ptr: num(item.pRate) || 0, mrp: num((item as any).mrp) || num(item.price) || 0,
        gst: num(item.gst) || 0, disc: num(item.discount) || 0, qty: String(qty), batchNo: "", expiryDate: ""
      };
      pi.amount = calcPurchaseItemAmt(pi);
      setPurchaseItems(prev => {
        const idx = prev.findIndex(p => p.itemId === item.id);
        if (idx >= 0) {
          const upd = [...prev];
          upd[idx] = { ...upd[idx], qty: String(int(upd[idx].qty) + qty) };
          upd[idx].amount = calcPurchaseItemAmt(upd[idx]);
          return upd;
        }
        return [...prev.filter(p => p.itemId), pi];
      });
      showToast("✅ " + item.name + " × " + qty + " added to Purchase Bill!");
    }
    setBarcodeQtyModal(null);
  };

  const fetchBarcodeData = async (code) => {
    setBarcodeFetching(true);

    const applyProduct = (name, company, src, division, gst, mrp, pRate, drugGroup) => {
      const n = (name || "").toUpperCase().trim();
      const c = (company || "").split(/[,\/]/)[0].toUpperCase().trim();
      if (!n) return false;
      setBarcodeNewItemForm(f => ({
        ...f, name: n, company: c,
        division: division || detectDivision(n),
        gst: String(gst || "12"),
        mrp: mrp ? String(mrp) : (f.mrp || ""),
        pRate: pRate ? String(pRate) : (mrp ? String((Number(mrp) * 0.75).toFixed(2)) : (f.pRate || "")),
        unit: f.unit || "strip", fetched: true
      }));
      setBarcodeFetchSource(src);
      setBarcodeFetching(false);
      showToast("✅ Auto-fill: " + n);
      return true;
    };


    const safeJSON = (text) => {
      try {
        const clean = (text || "").replace(/```json|```/gi, "").trim();
        const m = clean.match(/\{[\s\S]*?\}/);
        return m ? JSON.parse(m[0]) : null;
      } catch (_) { return null; }
    };

    const promptText = `Barcode EAN: ${code}. Identify the EXACT Indian pharmacy/FMCG product.
Return ONLY valid JSON:
{
  "found": true or false,
  "name": "EXACT NAME WITH PACK SIZE",
  "company": "MANUFACTURER NAME",
  "drugGroup": "MOLECULE/COMPOSITION (if medicine)",
  "mrp": 100,
  "prate": 75,
  "gst": 12,
  "unit": "strip",
  "division": "medicines"
}
Rules: 
- DO NOT GUESS OR INVENT FAKE PRODUCTS.
- If you are NOT 100% sure about the exact product for this specific barcode, you MUST set "found": false and leave other fields empty.
- Divisions: medicines, surgical, cosmetics, baby, devices, vitamins, ayurvedic, otc.
- GST: medicines/ayurvedic=12, cosmetics=18, food/baby=5, surgical=18, devices=18.`;

    // ── API 1: Gemini via Vite proxy (/gemini → generativelanguage.googleapis.com) ──
    try {
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "";
      const res = await fetch("/gemini/v1beta/models/gemini-3.6-flash:generateContent?key=" + GEMINI_KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          tools: [{ googleSearch: {} }], generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = safeJSON(text);
        if (parsed?.found && parsed.name) {
          if (applyProduct(parsed.name, parsed.company, "Gemini AI 🤖", parsed.division, parsed.gst, parsed.mrp, parsed.prate, parsed.drugGroup)) return;
        }
      }
    } catch (_) { }

    // ── API 2: Gemini direct (if proxy fails) ──
    try {
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "";
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" + GEMINI_KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          tools: [{ googleSearch: {} }], generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = safeJSON(text);
        if (parsed?.found && parsed.name) {
          if (applyProduct(parsed.name, parsed.company, "Gemini AI 🤖", parsed.division, parsed.gst, parsed.mrp, parsed.prate, parsed.drugGroup)) return;
        }
      }
    } catch (_) { }

    // ── API 3: Open Food Facts (medicines nahi pan cosmetics/FMCG mate) ──
    try {
      const ac = new AbortController();
      setTimeout(() => ac.abort(), 6000);
      const r = await fetch("https://world.openfoodfacts.org/api/v0/product/" + code + ".json", { signal: ac.signal });
      if (r.ok) {
        const d = await r.json();
        if (d.status === 1 && d.product) {
          const p = d.product;
          const name = p.product_name_en || p.product_name || "";
          if (name.trim()) {
            if (applyProduct(name, p.brands || "", "Open Food Facts ✅", detectDivision(name), "12", "", "", "")) return;
          }
        }
      }
    } catch (_) { }

    setBarcodeFetchSource("");
    setBarcodeFetching(false);
    showToast("⚠️ Product exact match na mali — manually details bharo", "error");
  };
  const detectDivision = (name) => {
    const n = (name || "").toLowerCase();
    if (/tablet|capsule|syrup|injection|ointment|drops|medicine|pharma/.test(n)) return "medicines";
    if (/bandage|syringe|glove|mask|gauze|cotton|surgical/.test(n)) return "surgical";
    if (/shampoo|soap|lotion|face|hair|skin|beauty|lipstick/.test(n)) return "cosmetics";
    if (/baby|diaper|nappy|infant|kids/.test(n)) return "baby";
    if (/bp|thermometer|glucometer|oximeter|stethoscope/.test(n)) return "devices";
    return "otc";
  };

  // Save new item → inventory → then open qty modal for bill (if needed)
  const handleBarcodeNewItemSave = async () => {
    const f = barcodeNewItemForm;
    if (!f.name) { showToast("Item name jaruri in stock!", "error"); return; }
    const newItem = {
      id: uid(),
      barcode: (f.barcode || "").trim().toUpperCase(),
      name: (f.name || "").toUpperCase(),
      company: (f.company || "").toUpperCase(),
      division: f.division || "medicines",
      mrp: num(f.mrp) || 0,
      pRate: num(f.pRate) || num(f.mrp) * 0.8 || 0,
      price: num(f.mrp) || num(f.pRate) || 0,
      gst: num(f.gst) || 0,
      hsn: (f.hsn || "").toUpperCase(),
      unit: (f.unit || "strip").toUpperCase(),
      stock: int(f.stock) || 0,
      minimum: 5, discount: 0, scheduleH: false,
      rxRequired: false, taxType: "taxable",
      createdAt: nowStr()
    };

    try {
      const payload = {
        name: newItem.name,
        category: newItem.division,
        division: newItem.division,
        company: newItem.company || null,
        pRate: newItem.pRate || 0,
        mrp: newItem.mrp || 0,
        price: newItem.price || 0,
        gst: newItem.gst || 0,
        stock: newItem.stock || 0,
        minimum: newItem.minimum || 5,
        unit: newItem.unit || null,
        barcode: newItem.barcode || null,
        hsn: newItem.hsn || null,
        manufacturer: newItem.company || null,
      };

      const res = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save to database");

      await loadAll(); // Reload from DB so barcode is correctly set
      showToast("✅ " + newItem.name + " saved to inventory!");
    } catch (e) {
      console.error(e);
      // Fallback to local if DB fails
      saveItems([...items, newItem]);
      showToast("✅ " + newItem.name + " added to inventory (Local)!");
    }

    const tgt = barcodeNewItemModal?.target || 'inventory';
    setBarcodeNewItemModal(null);
    setBarcodeNewItemForm({});
    setBarcodeFetching(false);
    setBarcodeFetchSource("");

    if (tgt === 'inventory') return;

    // Sales or Purchase — open qty modal after saving
    showToast("✅ Now enter quantity.");
    const maxQty = (tgt === 'purchase' || tgt === 'purchase_challan') ? 9999 : int(newItem.stock);
    setBarcodeQtyModal({ item: newItem, target: tgt, maxQty });
    setBarcodeQtyInput("1");
  };

  // ═══════════════════════════════════════════════════
  // FEATURE 2 & 3: GSTR-1 + GSTR-3B
  // ═══════════════════════════════════════════════════
  const [gstrMonth, setGstrMonth] = useState(new Date().getMonth());
  const [gstrYear, setGstrYear] = useState(new Date().getFullYear());

  const getGSTR1Data = () => {
    const from = new Date(gstrYear, gstrMonth, 1);
    const to = new Date(gstrYear, gstrMonth + 1, 0, 23, 59, 59);
    const bills = salesBills.filter(b => !b.isReturn && new Date(b.date) >= from && new Date(b.date) <= to);
    // HSN-wise summary
    const hsnMap = {};
    bills.forEach(bill => {
      (bill.items || []).filter(si => si.itemId).forEach(si => {
        const item = items.find(i => i.id === si.itemId) || {};
        const hsn = item.hsn || "0000";
        const gstPct = num(si.gst) || 0;
        const rate = num(si.rate), qty = int(si.qty), disc = num(si.disc);
        const taxable = rate * qty * (1 - disc / 100);
        const gstAmt = taxable * gstPct / 100;
        const key = `${hsn}_${gstPct}`;
        if (!hsnMap[key]) hsnMap[key] = { hsn, gstPct, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0, qty: 0 };
        hsnMap[key].taxable += taxable;
        hsnMap[key].cgst += gstAmt / 2;
        hsnMap[key].sgst += gstAmt / 2;
        hsnMap[key].total += taxable + gstAmt;
        hsnMap[key].qty += qty;
      });
    });
    const totalTaxable = Object.values(hsnMap).reduce((s, h) => s + h.taxable, 0);
    const totalGst = Object.values(hsnMap).reduce((s, h) => s + h.cgst + h.sgst, 0);
    const totalBills = bills.length;
    const totalAmt = bills.reduce((s, b) => s + num(b.netAmount), 0);
    return { hsnRows: Object.values(hsnMap).sort((a, b) => b.taxable - a.taxable), totalTaxable, totalGst, totalBills, totalAmt, bills };
  };

  const getGSTR3BData = () => {
    const from = new Date(gstrYear, gstrMonth, 1);
    const to = new Date(gstrYear, gstrMonth + 1, 0, 23, 59, 59);
    const sBills = salesBills.filter(b => !b.isReturn && new Date(b.date) >= from && new Date(b.date) <= to);
    const pBills = purchaseBills.filter(b => new Date(b.createdAt || b.date || "") >= from && new Date(b.createdAt || b.date || "") <= to);
    // Output tax (sales)
    let outTaxable = 0, outCGST = 0, outSGST = 0;
    sBills.forEach(bill => {
      (bill.items || []).filter(si => si.itemId).forEach(si => {
        const rate = num(si.rate), qty = int(si.qty), disc = num(si.disc), gst = num(si.gst);
        const taxable = rate * qty * (1 - disc / 100), gstAmt = taxable * gst / 100;
        outTaxable += taxable; outCGST += gstAmt / 2; outSGST += gstAmt / 2;
      });
    });
    // Input tax (purchase)
    let inTaxable = 0, inCGST = 0, inSGST = 0;
    pBills.forEach(bill => {
      (bill.items || []).filter(pi => pi.itemId).forEach(pi => {
        const ptr = num(pi.ptr), qty = int(pi.qty), disc = num(pi.disc), gst = num(pi.gst);
        const taxable = ptr * qty * (1 - disc / 100), gstAmt = taxable * gst / 100;
        inTaxable += taxable; inCGST += gstAmt / 2; inSGST += gstAmt / 2;
      });
    });
    const netCGST = Math.max(0, outCGST - inCGST);
    const netSGST = Math.max(0, outSGST - inSGST);
    return { outTaxable, outCGST, outSGST, outTotal: outCGST + outSGST, inTaxable, inCGST, inSGST, inTotal: inCGST + inSGST, netCGST, netSGST, netTotal: netCGST + netSGST, salesCount: sBills.length, purchaseCount: pBills.length };
  };

  // ═══════════════════════════════════════════════════
  // FEATURE 4: PURCHASE RETURN / DEBIT NOTE
  // ═══════════════════════════════════════════════════
  const [prItems, setPrItems] = useState([{ itemId: "", itemName: "", batchNo: "", qty: "1", rate: "", gst: "0", amount: 0 }]);

  const savePurchaseReturns = (l) => { setPurchaseReturns(l); localStorage.setItem('store_purchase_returns', JSON.stringify(l)); };

  const emptyPrItem = () => ({ itemId: "", itemName: "", batchNo: "", qty: "1", rate: "", gst: "0", amount: 0 });

  const calcPrItemAmt = (pi) => {
    const rate = num(pi.rate), qty = int(pi.qty), gst = num(pi.gst);
    const base = rate * qty, gstAmt = base * gst / 100;
    return base + gstAmt;
  };

  const handleSavePurchaseReturn = () => {
    if (!purchaseReturnForm.supplierName) { showToast("Supplier name is required", "error"); return; }
    const validItems = prItems.filter(pi => pi.itemId && int(pi.qty) > 0);
    if (!validItems.length) { showToast("Add at least 1 item", "error"); return; }
    const total = validItems.reduce((s, pi) => s + calcPrItemAmt(pi), 0);
    const ret = { id: uid(), returnNo: purchaseReturns.length + 1, date: purchaseReturnForm.returnDate || today(), ...purchaseReturnForm, items: validItems, total, createdAt: nowStr() };
    savePurchaseReturns([...purchaseReturns, ret]);
    // Reverse stock
    let newItems = [...items], newBatches = [...batches];
    validItems.forEach(pi => {
      newItems = newItems.map(i => i.id === pi.itemId ? { ...i, stock: Math.max(0, int(i.stock) - int(pi.qty)) } : i);
      newBatches = newBatches.map(b => (b.itemId === pi.itemId && b.batchNo === pi.batchNo) ? { ...b, qty: Math.max(0, int(b.qty) - int(pi.qty)) } : b);
    });
    saveItems(newItems); saveBatches(newBatches);
    setShowPurchaseReturnForm(false);
    setPrItems([emptyPrItem()]);
    setPurchaseReturnForm({ supplierId: "", supplierName: "", billRef: "", returnDate: "", reason: "", items: [] });
    showToast(`✅ Purchase Return #${ret.returnNo} saved! Stock updated.`);
  };

  // ═══════════════════════════════════════════════════
  // FEATURE 5: SUPPLIER LEDGER
  // ═══════════════════════════════════════════════════
  const getSupplierLedger = (supplierId) => {
    const supp = suppliers.find(s => s.id === supplierId);
    if (!supp) return null;
    const pBills = purchaseBills.filter(b => b.supplierId === supplierId || b.partyName === supp.name);
    const pReturns = purchaseReturns.filter(r => r.supplierId === supplierId || r.supplierName === supp.name);
    const pPayments = payments.filter(p => p.supplierId === supplierId || p.accountName === supp.name);
    const totalPurchase = pBills.reduce((s, b) => s + num(b.total), 0);
    const totalReturns = pReturns.reduce((s, r) => s + num(r.total), 0);
    const totalPaid = pPayments.reduce((s, p) => s + num(p.amount), 0);
    const outstanding = totalPurchase - totalReturns - totalPaid;
    // Ledger entries sorted by date
    const entries = [
      ...pBills.map(b => ({ date: b.billDate || b.createdAt, type: "Purchase", ref: `Entry #${b.entryNo}`, debit: num(b.total), credit: 0 })),
      ...pReturns.map(r => ({ date: r.date, type: "Return", ref: `Return #${r.returnNo}`, debit: 0, credit: num(r.total) })),
      ...pPayments.map(p => ({ date: p.date, type: "Payment", ref: p.remark || "Payment", debit: 0, credit: num(p.amount) })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));
    // Running balance
    let bal = 0;
    entries.forEach(e => { bal += e.debit - e.credit; e.balance = bal; });
    return { supp, entries, totalPurchase, totalReturns, totalPaid, outstanding };
  };

  const [supplierLedgerSuppId, setSupplierLedgerSuppId] = useState("");

  // ═══════════════════════════════════════════════════
  // FEATURE 6: LABEL PRINTING
  // ═══════════════════════════════════════════════════
  const [labelBatch, setLabelBatch] = useState("");

  const handlePrintLabel = (item, batch = "", qty = 1) => {
    setLabelItem(item); setLabelBatch(batch); setLabelQty(String(qty)); setShowLabelPrint(true);
  };

  const generateLabelHTML = (item, batch, qty) => {
    const storeName = currentUser?.pharmacyName || "Shiv Dhara Medical Store";
    const phone = "9924237606";
    const count = int(qty) || 1;
    // Simple barcode as text (Code 128 style visual)
    const barcodeStr = item.barcode || item.id;
    const labelHTML = `
      <div style="display:inline-block;width:180px;border:1px solid #000;padding:6px;margin:3px;font-family:Arial;font-size:9px;page-break-inside:avoid">
        <div style="font-weight:900;font-size:10px;text-align:center;border-bottom:1px solid #ccc;padding-bottom:3px;margin-bottom:3px">${storeName}</div>
        <div style="font-weight:700;font-size:11px;margin-bottom:2px">${item.name}</div>
        ${item.company ? `<div style="color:#555">${item.company}</div>` : ""}
        ${batch ? `<div>Batch: <b>${batch}</b></div>` : ""}
        <div style="display:flex;justify-content:space-between;margin-top:3px">
          <span>MRP: <b style="font-size:11px">₹${fmt((item as any).mrp || item.price || 0)}</b></span>
          ${item.expiryDate ? `<span>Exp: ${item.expiryDate}</span>` : ""}
        </div>
        ${barcodeStr ? `<div style="text-align:center;font-family:'Courier New';font-size:8px;letter-spacing:2px;margin-top:4px;border-top:1px solid #eee;padding-top:2px">||||| ${barcodeStr} |||||</div>` : ""}
        <div style="text-align:center;font-size:8px;color:#666;margin-top:2px">${phone}</div>
      </div>`;
    const labels = Array(count).fill(labelHTML).join("");
    return `<!DOCTYPE html><html><head><title>Labels</title><style>body{margin:10px;} @media print{body{margin:0} button{display:none}}</style></head><body>
      <div style="margin-bottom:10px"><button onclick="window.print()" style="background:#1a3a5c;color:white;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:13px">🖨️ Print Labels</button></div>
      <div style="display:flex;flex-wrap:wrap">${labels}</div>
    </body></html>`;
  };

  // ─── AUDIT LOGS FUNCTION ──────────────────────────────
  const loadAuditLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/audit-logs`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.warn("Could not load audit logs:", e);
    }
  };

  // ─── AUTO DB BACKUP ────────────────────────────────────
  const triggerAutoDbBackup = async () => {
    try {
      const res = await fetch(`${API_BASE}/backup-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: currentUser?.name || 'Admin' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Database auto-backed up to ${data.filename}`, "success");
      } else {
        showToast("⚠️ Backup failed: " + (data.error || "Unknown error"), "error");
      }
    } catch (e) {
      showToast("⚠️ Backup error: " + e.message, "error");
    }
  };

  // ─── SMS BILL SUMMARY (FOR KEYPAD PHONES) ──────────────
  const sendSmsBillSummary = (bill) => {
    if (!bill) return;
    const store = currentUser?.pharmacyName || "Shiv Dhara Medical";
    const phone = bill.mobile || bill.patientPhone || "";
    const itemsSummary = (bill.items || []).slice(0, 3).map(i => `${i.itemName || i.name} x${i.qty || 1}`).join(", ");
    const smsText = `Dear ${bill.patientName || 'Customer'}, your bill #${bill.billNo || bill.id} at ${store} is Rs ${fmt(bill.netAmount || bill.total || 0)}. Items: ${itemsSummary}${bill.items?.length > 3 ? '...' : ''}. Thank you!`;

    // Copy to clipboard or trigger SMS protocol
    if (navigator.clipboard) {
      navigator.clipboard.writeText(smsText);
      showToast("📋 SMS text copied to clipboard! (Ready to send to keypad phone)", "success");
    }
    if (phone) {
      window.open(`sms:${phone}?body=${encodeURIComponent(smsText)}`, '_blank');
    }
  };

  // ─── DOT MATRIX 10x4 PRINT (EPSON LX-300+) — EXACT SHOP FORMAT ────────────
  const generateDotMatrixInvoiceHTML = (bill) => {
    // Store info from appSetupData (same as Visual Infosoft setup)
    const storeName = (currentUser?.pharmacyName || "SHIV DHARA MEDICAL STORE").toUpperCase();
    const storeAddr = appSetupData?.address1 || "20, GIRIRAJ COMPLEX NIKOL GAAM ROAD ,NIKOL,AHMEDABAD";
    const dlNo = appSetupData?.dlNo || "DL NO:20 GARA 588,21 GARA 588.";
    const footMsg = appSetupData?.message || "HAVE A FAST RECOVERY & GOOD HEALTH";
    const phone = "9924237606";
    const dateStr = bill.date
      ? new Date(bill.date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
      : today();
    const validItems = (bill.items || []).filter(si => si.itemId || si.itemName);

    // ── Column layout (80-char wide = exact 80-col dot matrix carriage width) ──
    const W = 80;
    const SEP = "-".repeat(W);
    const DBL = "=".repeat(W);

    // Helper: center text in W-wide line
    const cn = (t) => { const s = String(t); const p = Math.max(0, Math.floor((W - s.length) / 2)); return " ".repeat(p) + s; };
    // Helper: right-pad to n chars (truncate if longer)
    const rp = (s, n) => String(s || "").slice(0, n).padEnd(n);
    // Helper: left-pad to n chars (truncate if longer)
    const lp = (s, n) => String(s || "").slice(0, n).padStart(n);
    // Helper: format number to 2 decimal
    const fm = (n) => num(n).toFixed(2);

    // Column widths: Sr(2)+1+Part(17)+1+Pk(4)+1+Mfg(3)+1+Batch(9)+1+Exp(5)+1+MRP(6)+1+Qty(3)+1+Rate(7)+1+Dis(4)+1+Amt(10) = 80
    const colHdr =
      rp("Sr", 2) + "|" +
      " " + rp("Particular", 16) + "|" +
      rp("Pack", 4) + "|" +
      rp("Mfg", 3) + "|" +
      " " + rp("Batch No", 8) + "|" +
      rp("Exp", 5) + "|" +
      lp("MRP", 6) + "|" +
      lp("Qty", 3) + "|" +
      lp("Rate", 7) + "|" +
      lp("Dis%", 4) + "|" +
      lp("Amount", 10);

    const gross = validItems.reduce((s, si) => s + num(si.amount || 0), 0);
    const disc = num(bill.lessDisc || 0);
    const net = num(bill.netAmount || bill.total || 0);
    const totalQty = validItems.reduce((s, si) => s + int(si.qty || 1), 0);

    // Multi-page splitting (8 items max per 10x4 sheet)
    const ITEMS_PER_PAGE = 8;
    const pages = [];
    for (let i = 0; i < validItems.length; i += ITEMS_PER_PAGE) {
      pages.push(validItems.slice(i, i + ITEMS_PER_PAGE));
    }
    if (pages.length === 0) pages.push([]);

    const pName = rp(bill.patientName || "Cash Customer", 20);
    const bNo = lp(String(bill.billNo || bill.id), 8);
    const memoTitle = "<b>CASH MEMO  Bill of Supply</b>";
    const patMemoLine = "<b>Patient Name : </b>" + pName + "  " + memoTitle + "  <b>BillNo: </b>" + bNo;

    const dName = rp(bill.doctorName || "---", 32);
    const docDateLine = "<b>Doctor's Name: </b>" + dName + "               <b>Date: </b>" + dateStr;

    const footLeft = "<b>DL NO:</b>" + dlNo.replace(/^DL NO:/i, '');
    const footCenter = "<b>Ph: </b>" + phone;
    const footLine = footLeft + " ".repeat(Math.max(2, 36 - dlNo.length)) + footCenter;

    const renderedPages = pages.map((pageItems, pIdx) => {
      const isLast = pIdx === pages.length - 1;
      const startIdx = pIdx * ITEMS_PER_PAGE;

      const itemRows = pageItems.map((si, idx) => {
        const mfg = (si.company || si.mfg || "").slice(0, 3).padEnd(3);
        return (
          lp(String(startIdx + idx + 1), 2) + "|" +
          " " + rp(si.itemName || "", 16) + "|" +
          rp(si.packing || si.pack || "1", 4) + "|" +
          mfg + "|" +
          " " + rp(si.batchNo || "NA", 8) + "|" +
          rp(si.expiryDate || "", 5) + "|" +
          lp(fm(si.mrp || si.rate || 0), 6) + "|" +
          lp(String(si.qty || 1), 3) + "|" +
          lp(fm(si.rate || 0), 7) + "|" +
          lp(fm(si.disc || 0), 4) + "|" +
          lp(fm(si.amount || 0), 10)
        );
      }).join("\n");

      let footerLines = "";
      if (!isLast) {
        const contMsg = "<b>CONTINUE ON NEXT PAGE >>></b>";
        const contRaw = "CONTINUE ON NEXT PAGE >>>";
        const contLine = " ".repeat(Math.max(0, Math.floor((W - contRaw.length) / 2))) + contMsg;
        footerLines = [
          SEP,
          contLine,
          footLine,
          DBL
        ].join("\n");
      } else {
        const msgText = "<b>Message: </b>" + footMsg;
        const msgRaw = "Message: " + footMsg;
        const qSummary = "<b>Total Qty: </b>" + lp(String(totalQty), 3);
        const qRaw = "Total Qty: " + lp(String(totalQty), 3);
        const gLabel = "<b>Gross: </b>" + lp(fm(gross), 8);
        const gRaw = "Gross: " + lp(fm(gross), 8);
        const midSpace = Math.max(1, W - msgRaw.length - qRaw.length - gRaw.length);
        const midLine = msgText + " ".repeat(midSpace) + qSummary + " " + gLabel;

        const otherLine = " ".repeat(Math.max(0, W - 22)) + "<b>Other    : </b>" + lp(fm(disc), 9);
        const netLine = " ".repeat(Math.max(0, W - 22)) + "<b>NET TOTAL: </b>" + lp(fm(net), 9);

        footerLines = [
          SEP,
          midLine,
          otherLine,
          netLine,
          footLine,
          DBL
        ].join("\n");
      }

      return `
<div class="bill-page">
  <pre><b>${cn(storeName)}</b>
${cn(storeAddr)}
${DBL}
${patMemoLine}
${docDateLine}
${SEP}
<b>${colHdr}</b>
${SEP}
${itemRows}
${footerLines}</pre>
</div>`;
    }).join("\n");

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bill #${bill.billNo || bill.id}</title>
<style>
  @page { size: 10in 4in; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; margin: 0; padding: 0; background: #fff; color: #000; }
  .bill-page {
    page-break-after: always;
    break-after: page;
    min-height: 4in;
    box-sizing: border-box;
    padding-top: 1.5mm;
    padding-left: 3mm;
  }
  .bill-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  pre {
    font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace !important;
    font-size: 13px !important;
    font-weight: 800 !important;
    line-height: 1.15 !important;
    letter-spacing: 0.1px !important;
    color: #000000 !important;
    white-space: pre !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  b {
    font-weight: 900 !important;
  }
  button {
    display: block;
    margin: 8px 0;
    padding: 6px 20px;
    background: #000;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-family: monospace;
    font-size: 13px;
    font-weight: bold;
  }
  @media print {
    button { display: none !important; }
    body { padding: 0 !important; margin: 0 !important; width: 100% !important; }
    .bill-page { min-height: 3.92in !important; }
  }
</style>
</head><body>
<button onclick="window.print()">&#128438; PRINT DOT MATRIX (10x4 EPSON)</button>
${renderedPages}
</body></html>`;
  };

  // ─── MISSING FUNCTION ALIASES & DEFINITIONS ──────────────────────────────

  // doRestoreData — decrypt with entered password then apply to state
  const doRestoreData = async () => {
    const rawContent = pendingRestoreData;
    if (!rawContent) { showToast("No data to restore", "error"); return; }
    if (!sessionPassword) { showToast("❌ Session expired, please login again", "error"); return; }
    if (!restorePassInput) { setBackupPassError("❌ Enter password!"); return; }

    try {
      let data = null;

      // Try master key first (New backup format)
      let decrypted = decryptData(rawContent, "MASTER_SHIVDHARA_KEY_2026");
      try { data = JSON.parse(decrypted); } catch (e) { data = null; }

      if (data && typeof data === 'object') {
        // If it's a new backup, verify they typed the current login password
        if (restorePassInput !== sessionPassword) {
          setBackupPassError("❌ Incorrect password! Enter login password.");
          return;
        }
      } else {
        // Fallback: Old backup format (encrypted with their old password)
        decrypted = decryptData(rawContent, restorePassInput);
        try { data = JSON.parse(decrypted); } catch (e) { data = null; }

        if (!data || typeof data !== 'object') {
          setBackupPassError("❌ Wrong password ya invalid file!");
          return;
        }
      }

      // Apply data to state
      if (data.items) { setItems(data.items); await save("store_items", data.items); }
      if (data.batches) { setBatches(data.batches); await save("store_batches", data.batches); }
      if (data.suppliers) { setSuppliers(data.suppliers); await save("store_suppliers", data.suppliers); }
      if (data.purchaseBills) { setPurchaseBills(data.purchaseBills); await save("store_purchaseBills", data.purchaseBills); }
      if (data.salesBills) { setSalesBills(data.salesBills); await save("store_salesBills", data.salesBills); }
      if (data.payments) { setPayments(data.payments); await save("store_payments", data.payments); }
      if (data.bankEntries) { setBankEntries(data.bankEntries); await save("store_bankEntries", data.bankEntries); }
      if (data.doctors) { setDoctors(data.doctors); await save("store_doctors", data.doctors); }
      if (data.upiSettings) { setUpiSettings(data.upiSettings); await save("store_upiSettings", data.upiSettings); }
      setPendingRestoreData(null);
      setShowRestorePassModal(false);
      setRestorePassInput("");
      setBackupPassError("");
      showToast("✅ Backup restored successfully!", "success");
    } catch (err) {
      setBackupPassError("❌ Wrong password ya invalid file!");
    }
  };

  // findItemByBarcode — search item by barcode or name
  const findItemByBarcode = (code) => {
    const c = (code || "").trim().toUpperCase();
    if (!c) return null;
    return items.find(i => (i.barcode || "").toUpperCase() === c)
      || items.find(i => (i.batchNumber || "").toUpperCase() === c)
      || items.find(i => (i.name || "").toUpperCase().includes(c));
  };

  // getGSTR1 / getGSTR3B — aliases for GSTR data functions
  const getGSTR1 = () => getGSTR1Data();
  const getGSTR3B = () => getGSTR3BData();

  // emptyPurchaseReturnItem — blank return item template
  const emptyPurchaseReturnItem = () => ({
    itemId: "", itemName: "", batchNo: "", qty: "1",
    rate: "", gst: "0", disc: "0", amount: 0, reason: "Expired"
  });

  // openPurchaseReturnForm — open return form with optional bill prefill
  const openPurchaseReturnForm = (bill = null) => {
    if (bill) {
      setPurchaseReturnForm({
        supplierId: bill.supplierId || "",
        supplierName: bill.partyName || bill.supplierName || "",
        partyName: bill.partyName || bill.supplierName || "",
        returnDate: today(), refBillNo: bill.billNo || bill.entryNo || "",
        reason: "Expired", remarks: ""
      });
      setPurchaseReturnItems((bill.items || []).filter(i => i.itemId).map(i => ({
        ...emptyPurchaseReturnItem(),
        itemId: i.itemId, itemName: i.itemName || "",
        batchNo: i.batchNo || "", rate: i.ptr || i.rate || "",
        gst: i.gst || "0", qty: ""
      })));
    } else {
      setPurchaseReturnForm({ supplierId: "", supplierName: "", partyName: "", returnDate: today(), refBillNo: "", reason: "Expired", remarks: "" });
      setPurchaseReturnItems([emptyPurchaseReturnItem()]);
    }
    setShowPurchaseReturnForm(true);
  };

  // updatePurchaseReturnItem — update a return item field and recalc amount
  const updatePurchaseReturnItem = (idx, k, v) => {
    setPurchaseReturnItems(prev => {
      const u = [...prev];
      u[idx] = { ...u[idx], [k]: v };
      const r = u[idx];
      const base = (num(r.rate) || 0) * (int(r.qty) || 0);
      const disc = base * (num(r.disc) || 0) / 100;
      const tax = (base - disc) * (num(r.gst) || 0) / 100;
      u[idx].amount = base - disc + tax;
      return u;
    });
  };

  const saveStateRef = useRef<any>({});
  saveStateRef.current = {
    currentUser,
    showSalesForm,
    showPurchaseForm,
    showItemForm,
    showPaymentForm,
    showSupplierForm,
    showKhataForm,
    showAdvanceForm,
    quickStockItem,
    handleSaveSales,
    handleSavePurchase,
    handleSaveItem,
    handleSavePayment,
    handleSaveSupplier,
    handleSaveKhata,
    handleSaveAdvance,
    handleQuickStock
  };

  useEffect(() => {
    const handleGlobalCtrlS = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        e.stopPropagation();
        const s = saveStateRef.current;
        if (!s.currentUser) return;
        if (s.showSalesForm) { s.handleSaveSales(); return; }
        if (s.showPurchaseForm) { s.handleSavePurchase(); return; }
        if (s.showItemForm) { s.handleSaveItem(); return; }
        if (s.showPaymentForm) { s.handleSavePayment(); return; }
        if (s.showSupplierForm) { s.handleSaveSupplier(); return; }
        if (s.showKhataForm) { s.handleSaveKhata(); return; }
        if (s.showAdvanceForm) { s.handleSaveAdvance(); return; }
        if (s.quickStockItem) { s.handleQuickStock(); return; }
      }
    };
    window.addEventListener("keydown", handleGlobalCtrlS, true);
    return () => window.removeEventListener("keydown", handleGlobalCtrlS, true);
  }, []);

  const value = {
    // Auth
    ownerSession, headerLogoClicks, setHeaderLogoClicks,
    hoveredNav, setHoveredNav, headerLogoTimer,
    currentUser, setCurrentUser, customers, setCustomers,
    authMode, setAuthMode, showPass, setShowPass, showOwnerPanel, setShowOwnerPanel,
    authStatus, setAuthStatus, authInput, setAuthInput,
    // User Master
    showUserMaster, setShowUserMaster, showGroupRights, setShowGroupRights,
    showAppSetup, setShowAppSetup, appSetupTab, setAppSetupTab, appSetupData, setAppSetupData,
    grSelectedUser, setGrSelectedUser, grUserRights, setGrUserRights,
    appUsers, setAppUsers, userGroups, setUserGroups,
    umForm, setUmForm, umEditId, setUmEditId, umShowPass, setUmShowPass,
    umSelectedUser, setUmSelectedUser, umGroupForm, setUmGroupForm,
    umSelectedGroup, setUmSelectedGroup, umGroupUserSel, setUmGroupUserSel,
    // Data
    items, setItems, batches, setBatches, suppliers, setSuppliers,
    purchaseBills, setPurchaseBills, salesBills, setSalesBills,
    payments, setPayments,
    // UI
    toast, setToast, activeSection, setActiveSection,
    ownerSubTab, setOwnerSubTab, ownerViewMode, setOwnerViewMode, activeCustomerTab, setActiveCustomerTab,
    // Inventory
    showItemForm, setShowItemForm, editingItem, setEditingItem, itemForm, setItemForm,
    itemDivision, setItemDivision, itemSearch, setItemSearch, filterStock, setFilterStock,
    sortBy, setSortBy, quickStockItem, setQuickStockItem, quickQty, setQuickQty,
    // Purchase
    showPurchaseForm, setShowPurchaseForm, purchaseForm, setPurchaseForm,
    purchaseItems, setPurchaseItems, expandedPurchase, setExpandedPurchase,
    expandedOwnerOrder, setExpandedOwnerOrder, orderFilter, setOrderFilter,
    searchQ, setSearchQ, showPlans, setShowPlans, memberPlan, setMemberPlan,
    purchaseItemSearch, setPurchaseItemSearch, purchaseItemDropdown, setPurchaseItemDropdown,
    purchaseItemHighlight, setPurchaseItemHighlight,
    // Sales
    showSalesForm, setShowSalesForm, salesForm, setSalesForm, salesItems, setSalesItems,
    salesItemSearch, setSalesItemSearch, salesItemDropdown, setSalesItemDropdown,
    salesItemHighlight, setSalesItemHighlight, salesDropdownPos, setSalesDropdownPos,
    purchaseDropdownPos, setPurchaseDropdownPos, expandedSale, setExpandedSale, isReturn, setIsReturn,
    // Payments
    showPaymentForm, setShowPaymentForm, paymentForm, setPaymentForm,
    // Suppliers
    showSupplierForm, setShowSupplierForm, editingSupplier, setEditingSupplier, supplierForm, setSupplierForm,
    // Cart

    upiSettings, setUpiSettings, doctors, setDoctors, doctorForm, setDoctorForm,
    showDoctorForm, setShowDoctorForm, editDoctorId, setEditDoctorId,
    reportSubTab, setReportSubTab, showUpiSetup, setShowUpiSetup,
    // Reports
    reportPeriod, setReportPeriod, expandedOrder, setExpandedOrder,
    showShortcuts, setShowShortcuts, activeMenu, setActiveMenu, menuDropPos, setMenuDropPos,
    printHtml, setPrintHtml, supBtnRef, supPanelCoords, setSupPanelCoords,
    confirmDialog, setConfirmDialog, stockReportComp, setStockReportComp, stockReportSupp, setStockReportSupp,
    // Bank
    bankEntries, setBankEntries, showBankForm, setShowBankForm, bankForm, setBankForm,
    // Profile
    editProfile, setEditProfile, profileData, setProfileData,
    // Handlers
    showToast, loadAll, forceSync, save,
    saveItems, saveBatches, saveSuppliers, savePurchaseBills, saveSalesBills, savePayments, saveBankEntries,
    handleLogin, handleSetupAccount, handleLogout, handleDeleteOwnerAccount,
    openItemForm, handleSaveItem, handleDeleteItem, handleQuickStock,
    openPurchaseForm, updatePurchaseItem, addPurchaseItem, removePurchaseItem, handleSavePurchase, focusNext,
    openSalesForm, updateSalesItem, addSalesItem, removeSalesItem, handleSaveSales, handlePrintSalesBill,
    openPaymentForm, handleSavePayment,
    openSupplierForm, showConfirm, handleDeletePurchaseBill, handleDeleteSalesBill, handleSaveSupplier,
    handleDeleteSupplier, handleDeleteDoctor, handleDeleteCustomer, handleDeletePayment, handleDeleteBankEntry,
    handleDeleteKhataEntry, handleDeleteAdvanceDeposit, handleDeleteReminder, handleDeleteBundleOffer,
    handleSaveDoctor,
    getSalesReport, handleExportData, handleImportData, doEncryptedBackup, doRestoreData, showBackupPassModal, setShowBackupPassModal, backupPassInput, setBackupPassInput, backupPassError, showRestorePassModal, setShowRestorePassModal, restorePassInput, setRestorePassInput, newPassInput, setNewPassInput, showNewPassStep, setShowNewPassStep, showDeletePassModal, setShowDeletePassModal, deletePassInput, setDeletePassInput, deletePassError, setDeletePassError, pendingRestoreData, setPendingRestoreData, backupIsFirstTime, setBackupIsFirstTime, backupConfirmInput, setBackupConfirmInput, showForgotBackupPass, setShowForgotBackupPass, forgotOldPass, setForgotOldPass, forgotNewPass, setForgotNewPass, forgotConfirmPass, setForgotConfirmPass, handleForgotBackupPass,
    // Derived
    isOwner, isExpired, isExpiringSoon, getDivision, itemBatches, calcTotal, filteredItems,
    calcPurchaseItemAmt, calcSalesItemAmt,
    emptyItemForm, emptyPurchaseForm, emptyPurchaseItem, emptySalesForm, emptySalesItem, emptySupplierForm,
    // ── NEW FEATURES ──
    // Khata/Udhar
    khataEntries, showKhataForm, setShowKhataForm, khataForm, setKhataForm,
    showKhataCollect, setShowKhataCollect, khataCollectAmt, setKhataCollectAmt,
    handleSaveKhata, handleCollectKhataPayment, getKhataBalance,
    // Advance Deposit
    advanceDeposits, showAdvanceForm, setShowAdvanceForm, advanceForm, setAdvanceForm,
    handleSaveAdvance, getAdvanceBalance,
    // Split Payment
    splitPayMode, setSplitPayMode, splitCash, setSplitCash, splitUpi, setSplitUpi, splitUpiTxn, setSplitUpiTxn,
    // Bundle Offers
    bundleOffers, showOfferForm, setShowOfferForm, offerForm, setOfferForm, editOfferId, setEditOfferId,
    handleSaveOffer, checkBundleOffer,
    // Loyalty Points
    loyaltyData, loyaltyRate, getCustomerPoints, earnPoints, redeemPoints, getVIPLevel,
    // Health Cards
    healthCards, showHealthCard, setShowHealthCard, healthCardForm, setHealthCardForm,
    handleSaveHealthCard, getHealthCard,    // Reminders
    reminders, showReminderForm, setShowReminderForm, reminderForm, setReminderForm,
    handleSaveReminder, getMyReminders, getDueReminders,
    // Prescriptions

    // Family Members
    familyMembers, showFamilyForm, setShowFamilyForm, familyForm, setFamilyForm,
    handleSaveFamilyMember, getMyFamily, handleDeleteFamilyMember,
    // Bill Instructions
    billInstructions, setBillInstructions,
    // Day End
    dayEndHistory, showDayEnd, setShowDayEnd, physicalCash, setPhysicalCash, handleSaveDayEnd,
    // Expiry Calendar
    expiryCalMonth, setExpiryCalMonth, expiryCalYear, setExpiryCalYear,
    // Analytics
    getBestSellers, getDeadStock, getPatientHistory, getDueDateAlerts, getDoctorReport,
    getSupplierScore, getLiveProfitToday, getMonthlyGrowth, getAutoPurchaseDrafts,
    // NEW 6 FEATURES
    // Feature 1: Barcode
    barcodeTarget, setBarcodeTarget, barcodeQtyModal, setBarcodeQtyModal,
    barcodeNewItemModal, setBarcodeNewItemModal, barcodeNewItemForm, setBarcodeNewItemForm,
    barcodeFetching, setBarcodeFetching, barcodeFetchSource, setBarcodeFetchSource, handleBarcodeNewItemSave,
    barcodeQtyInput, setBarcodeQtyInput, getItemByBarcode, handleBarcodeDetected, handleBarcodeQtyConfirm,
    barcodeInput, setBarcodeInput, showBarcodeScanner, setShowBarcodeScanner,
    barcodeScanTarget, setBarcodeScanTarget, findItemByBarcode,
    // Feature 2&3: GSTR
    gstrMonth, setGstrMonth, gstrYear, setGstrYear, getGSTR1Data, getGSTR3BData, getGSTR1, getGSTR3B,
    // Feature 4: Purchase Return
    purchaseReturns, showPurchaseReturnForm, setShowPurchaseReturnForm,
    purchaseReturnForm, setPurchaseReturnForm, purchaseReturnItems, setPurchaseReturnItems,
    openPurchaseReturnForm, updatePurchaseReturnItem, handleSavePurchaseReturn, emptyPurchaseReturnItem,
    purchaseChallans, savePurchaseChallans, showPurchaseChallanForm, setShowPurchaseChallanForm,
    purchaseChallanForm, setPurchaseChallanForm, purchaseChallanItems, setPurchaseChallanItems,
    prItems, setPrItems, emptyPrItem, calcPrItemAmt,
    // Feature 5: Supplier Ledger
    showSupplierLedger, setShowSupplierLedger, ledgerSupplierId, setLedgerSupplierId,
    getSupplierLedger, supplierLedgerSuppId, setSupplierLedgerSuppId,
    // Feature 6: Label Print
    showLabelPrint, setShowLabelPrint, labelItem, setLabelItem, labelQty, setLabelQty,
    labelBatch, setLabelBatch, handlePrintLabel, generateLabelHTML,
    // WhatsApp
    handleWhatsAppBill,
    // Search
    purchaseBillSearch, setPurchaseBillSearch,
    salesBillSearch, setSalesBillSearch,
    paymentSearch, setPaymentSearch,
    masterSearch, setMasterSearch,
    reportSearch, setReportSearch,
    // UI Density & Screen Scale
    uiScale, setUiScale, changeUiScale, zoomIn, zoomOut, resetZoom, setPresetScale,
    // Enterprise Hardening & Features
    auditLogs, setAuditLogs, loadAuditLogs, showAuditModal, setShowAuditModal,
    triggerAutoDbBackup, sendSmsBillSummary, dotMatrixMode, setDotMatrixMode, generateDotMatrixInvoiceHTML,
  };

  return (
    <MedicalStoreContext.Provider value={value}>
      {children}
    </MedicalStoreContext.Provider>
  );
}
