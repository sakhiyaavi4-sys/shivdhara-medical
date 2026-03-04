/* eslint-disable */
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import { Search, Plus, Edit2, Trash2, ShoppingCart, Package, LogOut, Eye, EyeOff, X, CheckCircle, AlertCircle, User, ChevronDown, ChevronUp, Phone, Mail, MapPin, Clock, FileText, TrendingUp, Truck, CreditCard, Users, Home } from "lucide-react";

// ═══════════════════════════════════════════════════
// FIREBASE CONFIG
// ═══════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyDc0Xb3zgZn9CIjDQEOS_SMSPmpUVAXt9Y",
  authDomain: "shivdhara-medical-11d24.firebaseapp.com",
  projectId: "shivdhara-medical-11d24",
  storageBucket: "shivdhara-medical-11d24.firebasestorage.app",
  messagingSenderId: "910806749990",
  appId: "1:910806749990:web:c65d7b2d91c9e7893b27e7"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const fbGet = async (key) => { try { const snap = await getDoc(doc(db,"store",key)); if(snap.exists()) return JSON.parse(snap.data().value); } catch(_) {} return null; };
const fbSet = async (key, data) => { try { await setDoc(doc(db,"store",key), {value: JSON.stringify(data)}); } catch(_) {} };

// ═══════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════
const DIVISIONS = [
  { id:"medicines",  label:"Medicines",            icon:"💊", color:"#3b82f6", bg:"#eff6ff", border:"#bfdbfe", desc:"Tablets, Syrups, Capsules" },
  { id:"surgical",   label:"Surgical Items",        icon:"🩺", color:"#ef4444", bg:"#fef2f2", border:"#fecaca", desc:"Bandage, Syringe, Gloves" },
  { id:"cosmetics",  label:"Cosmetics",             icon:"✨", color:"#ec4899", bg:"#fdf2f8", border:"#f9a8d4", desc:"Skin Care, Hair Care" },
  { id:"baby",       label:"Baby Products",         icon:"🍼", color:"#f59e0b", bg:"#fffbeb", border:"#fde68a", desc:"Diapers, Baby Food" },
  { id:"devices",    label:"Health Devices",        icon:"🩻", color:"#8b5cf6", bg:"#f5f3ff", border:"#ddd6fe", desc:"BP Machine, Thermometer" },
  { id:"vitamins",   label:"Vitamins & Supplements",icon:"💪", color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0", desc:"Multivitamins, Protein" },
  { id:"ayurvedic",  label:"Ayurvedic / Herbal",    icon:"🌿", color:"#65a30d", bg:"#f7fee7", border:"#bef264", desc:"Herbal, Churna, Kadha" },
  { id:"otc",        label:"OTC Products",          icon:"🏥", color:"#0891b2", bg:"#ecfeff", border:"#a5f3fc", desc:"Over the Counter" },
];

const STATUS_STYLE = {
  Pending:   {bg:"#dbeafe",color:"#1d4ed8"},
  Ready:     {bg:"#fef9c3",color:"#854d0e"},
  Delivered: {bg:"#d1fae5",color:"#065f46"},
  Cancelled: {bg:"#fee2e2",color:"#991b1b"},
  Paid:      {bg:"#d1fae5",color:"#065f46"},
  Credit:    {bg:"#fef9c3",color:"#854d0e"},
};

const GST_RATES = [0, 5, 18];

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const today = () => new Date().toISOString().slice(0,10);
const fmt = (n, d=2) => (parseFloat(n)||0).toFixed(d);
const num = (v) => parseFloat(v)||0;
const int = (v) => parseInt(v)||0;

export default function ShivDharaMedicalStore() {

  // ─── AUTH STATE ───────────────────────────────────
  const ownerSession = useRef(null); // in-memory fallback for owner
  const [ownerViewMode, setOwnerViewMode] = useState("owner"); // "owner" | "customer"
  const [headerLogoClicks, setHeaderLogoClicks] = useState(0);
  const [hoveredNav, setHoveredNav] = useState(null);
  const headerLogoTimer = useRef(null);
  const [currentUser, setCurrentUser]     = useState(null);
  const [customers, setCustomers]         = useState({}); // email -> user
  const [authMode, setAuthMode]           = useState("login");
  const [showPass, setShowPass]           = useState(false);
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);
  // ─── USER MASTER ──────────────────────────────────
  const [showUserMaster, setShowUserMaster]   = useState(false);
  const [appUsers, setAppUsers]               = useState([
    {id:"u1", loginId:"ADMIN", fullName:"Administrator", userType:"Administrator", description:"", isDefault:false},
    {id:"u2", loginId:"SHIU",  fullName:"Shiv",          userType:"User",          description:"", isDefault:false},
    {id:"u3", loginId:"VIPL",  fullName:"VIPL User",     userType:"User",          description:"", isDefault:false},
  ]);
  const [userGroups, setUserGroups]           = useState([
    {id:"g1", name:"Administrator"},
    {id:"g2", name:"User"},
  ]);
  const [umForm, setUmForm]                   = useState({loginId:"",password:"",rePassword:"",fullName:"",userType:"User",description:"",isDefault:false});
  const [umEditId, setUmEditId]               = useState(null);
  const [umShowPass, setUmShowPass]           = useState(false);
  const [umSelectedUser, setUmSelectedUser]   = useState(null);
  const [umGroupForm, setUmGroupForm]         = useState("");
  const [umSelectedGroup, setUmSelectedGroup] = useState(null);
  const [umGroupUserSel, setUmGroupUserSel]   = useState({});

  const [ownerExists, setOwnerExists]     = useState(false);
  const [ownerMode, setOwnerMode]         = useState("login");
  const [ownerInput, setOwnerInput]       = useState({email:"",password:""});
  const [ownerRegData, setOwnerRegData]   = useState({name:"",pharmacyName:"Shiv Dhara Medical Store",email:"",phone:"",password:"",confirmPassword:""});
  const [logoClicks, setLogoClicks]       = useState(0);
  const [loginData, setLoginData]         = useState({email:"",password:""});
  const [regData, setRegData]             = useState({name:"",email:"",phone:"",password:"",confirmPassword:""});

  // ─── GLOBAL DATA ──────────────────────────────────
  const [items, setItems]                 = useState([]);       // Item Master
  const [batches, setBatches]             = useState([]);       // Batch tracking
  const [suppliers, setSuppliers]         = useState([]);       // Account Master (Suppliers)
  const [purchaseBills, setPurchaseBills] = useState([]);       // Purchase Bills
  const [salesBills, setSalesBills]       = useState([]);       // Sales Bills (POS)
  const [payments, setPayments]           = useState([]);       // Payment Receipts
  const [custOrders, setCustOrders]       = useState([]);       // Customer online orders

  // ─── UI STATE ─────────────────────────────────────
  const [toast, setToast]                 = useState(null);
  const [activeSection, setActiveSection] = useState("home");  // owner main nav
  const [ownerSubTab, setOwnerSubTab]     = useState("");
  const [activeCustomerTab, setActiveCustomerTab] = useState("home");

  // ─── INVENTORY ────────────────────────────────────
  const [showItemForm, setShowItemForm]   = useState(false);
  const [editingItem, setEditingItem]     = useState(null);
  const [itemForm, setItemForm]           = useState({});
  const [itemDivision, setItemDivision]   = useState("medicines");
  const [itemSearch, setItemSearch]       = useState("");
  const [filterStock, setFilterStock]     = useState(false);
  const [sortBy, setSortBy]               = useState("name");
  const [quickStockItem, setQuickStockItem] = useState(null);
  const [quickQty, setQuickQty]           = useState("");

  // ─── PURCHASE BILL ────────────────────────────────
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseForm, setPurchaseForm]   = useState({});
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [expandedPurchase, setExpandedPurchase] = useState(null);
  const [expandedOwnerOrder, setExpandedOwnerOrder] = useState(null);
  const [orderFilter, setOrderFilter]       = useState("All");
  const [searchQ, setSearchQ]               = useState("");
  const [showPlans, setShowPlans]           = useState(false);
  const [memberPlan, setMemberPlan]         = useState(null); // null | "silver" | "gold"
  const [purchaseItemSearch, setPurchaseItemSearch] = useState({});  // idx -> search text
  const [purchaseItemDropdown, setPurchaseItemDropdown] = useState(null); // idx of open dropdown
  const [purchaseItemHighlight, setPurchaseItemHighlight] = useState({}); // idx -> highlighted position

  // ─── SALES BILL (POS) ─────────────────────────────
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [salesForm, setSalesForm]         = useState({});
  const [salesItems, setSalesItems]       = useState([]);
  const [salesItemSearch, setSalesItemSearch] = useState({});   // idx -> search text
  const [salesItemDropdown, setSalesItemDropdown] = useState(null); // idx of open dropdown
  const [salesItemHighlight, setSalesItemHighlight] = useState({}); // idx -> highlighted position
  const [salesDropdownPos, setSalesDropdownPos] = useState({top:0,left:0,width:0});
  const [purchaseDropdownPos, setPurchaseDropdownPos] = useState({top:0,left:0,width:0});
  const [expandedSale, setExpandedSale]   = useState(null);
  const [isReturn, setIsReturn]           = useState(false);

  // ─── PAYMENTS ─────────────────────────────────────
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm]     = useState({});

  // ─── SUPPLIER MASTER ──────────────────────────────
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm]   = useState({});

  // ─── CUSTOMER CART ────────────────────────────────
  const [cart, setCart]                   = useState([]);
  const [showCart, setShowCart]           = useState(false);
  const [showOrderForm, setShowOrderForm]   = useState(false);
  const [orderForm, setOrderForm]           = useState({name:"",phone:"",address:"",paymentMode:"cash",transactionId:""});
  const [upiSettings, setUpiSettings]       = useState({upiId:"",upiName:"Shiv Dhara Medical Store",qrNote:""});
  const [doctors, setDoctors]               = useState([]);
  const [doctorForm, setDoctorForm]         = useState({name:"",area:"",mobile:"",speciality:""});
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [editDoctorId, setEditDoctorId]     = useState(null);
  const [reportSubTab, setReportSubTab]     = useState("summary");
  const [showUpiSetup, setShowUpiSetup]     = useState(false);

  // ─── REPORTS ──────────────────────────────────────
  const [reportPeriod, setReportPeriod]   = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [showShortcuts, setShowShortcuts]   = useState(false);
  const [activeMenu, setActiveMenu]         = useState(null); // classic menu bar dropdown
  const [menuDropPos, setMenuDropPos]       = useState({top:24,left:0}); // dropdown fixed position
  const [printHtml, setPrintHtml]           = useState(null);
  const supBtnRef = useRef(null);
  const [supPanelCoords, setSupPanelCoords] = useState({top:0,left:0});

  const [confirmDialog, setConfirmDialog]   = useState(null); // {msg, onOk}
  const [stockReportComp, setStockReportComp] = useState("");
  const [stockReportSupp, setStockReportSupp] = useState("");

  // ─── BANK ENTRY ───────────────────────────────────
  const [bankEntries, setBankEntries]     = useState([]);
  const [showBankForm, setShowBankForm]   = useState(false);
  const [bankForm, setBankForm]           = useState({ date:"", type:"deposit", accountName:"", bank:"", amount:"", chequeNo:"", remark:"" });

  // ─── PROFILE ──────────────────────────────────────
  const [editProfile, setEditProfile]     = useState(false);
  const [profileData, setProfileData]     = useState({name:"",phone:"",address:""});

  // ═══════════════════════════════════════════════════
  // TOAST
  // ═══════════════════════════════════════════════════
  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  // ═══════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════
  // Focus next input/select in same table row or next row on Enter
  const focusNext = (e, rowIdx, colName) => {
    if(e.key !== "Enter") return;
    e.preventDefault();
    // Order of fields in purchase row
    const fields = ["item","batchNo","expiryDate","qty","freeQty","mrp","ptr","gst","disc"];
    const cur = fields.indexOf(colName);
    const nextField = fields[cur + 1];
    if(nextField) {
      const el = document.querySelector(`[data-pf="${rowIdx}-${nextField}"]`);
      if(el) { el.focus(); el.select && el.select(); return; }
    }
    // Last field in row → go to first field of next row (or add new row)
    const nextEl = document.querySelector(`[data-pf="${rowIdx+1}-item"]`);
    if(nextEl) { nextEl.focus(); }
    else {
      // add new row and focus it after render
      addPurchaseItem();
      setTimeout(()=>{ const el=document.querySelector(`[data-pf="${rowIdx+1}-item"]`); if(el) el.focus(); },50);
    }
  };

  const parseExpiry = (d) => {
    if(!d) return null;
    const mmyy = d.match(/^(\d{1,2})\/(\d{2})$/);
    if(mmyy) { const yr=int(mmyy[2])+2000; return new Date(yr, int(mmyy[1])-1, 1); }
    const mmyyyy = d.match(/^(\d{1,2})\/(\d{4})$/);
    if(mmyyyy) { return new Date(int(mmyyyy[2]), int(mmyyyy[1])-1, 1); }
    const dt = new Date(d); return isNaN(dt) ? null : dt;
  };
  const isExpired = (d) => { const dt=parseExpiry(d); return dt && dt < new Date(); };
  const isExpiringSoon = (d) => { const dt=parseExpiry(d); if(!dt) return false; const days=Math.floor((dt-new Date())/86400000); return days<=30&&days>=0; };
  const getDivision = (id) => DIVISIONS.find(d=>d.id===id)||DIVISIONS[0];
  // const currentDivision = DIVISIONS.find(d=>d.id===activeSection);
  const itemBatches = (itemId) => batches.filter(b=>b.itemId===itemId&&int(b.qty)>0&&!isExpired(b.expiryDate));
  const myOrders = custOrders.filter(o=>o.customer?.email===currentUser?.email);

  const calcTotal = (cartArr) => cartArr.reduce((s,i)=>{
    const p=num(i.price),g=num(i.gst),q=int(i.quantity)||1;
    return s+(p+p*g/100)*q;
  },0);

  const filteredItems = (divId) => items.filter(i=>i.division===divId).filter(i=>{
    const q=itemSearch.toLowerCase();
    return (!q||(i.name||"").toLowerCase().includes(q)||(i.company||"").toLowerCase().includes(q))&&(!filterStock||i.stock>0);
  }).sort((a,b)=>sortBy==="price_asc"?num(a.price)-num(b.price):sortBy==="price_desc"?num(b.price)-num(a.price):(a.name||"").localeCompare(b.name||""));

  // ═══════════════════════════════════════════════════
  // LOAD / SAVE
  // ═══════════════════════════════════════════════════
  useEffect(()=>{ loadAll(); },[]);// eslint-disable-line react-hooks/exhaustive-deps

  // ─── KEYBOARD SHORTCUTS ───────────────────────────────
  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    const handler = (e) => {
      // F1-F8: Division shortcuts
      const divMap = { F1:"medicines", F2:"surgical", F3:"cosmetics", F4:"baby", F5:"devices", F6:"vitamins", F7:"ayurvedic", F8:"otc" };
      if(divMap[e.key] && currentUser) {
        e.preventDefault();
        if(currentUser.role === "owner") {
          setActiveSection("inventory");
          setOwnerSubTab(divMap[e.key]);
        } else {
          setActiveCustomerTab("home");
          setActiveSection(divMap[e.key]);
        }
        return;
      }
      // Enter key: move to next input/select/textarea in the page, or save on last field
      if(e.key==="Enter" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const tag = e.target.tagName;
        if(tag==="TEXTAREA") return; // allow newline in textarea
        if(tag==="INPUT" || tag==="SELECT") {
          // Don't intercept if item search dropdown is open
          if(e.target.hasAttribute("data-pf")) return; // handled by focusNext
          e.preventDefault();
          // Get all focusable form elements
          const focusable = Array.from(document.querySelectorAll(
            'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
          )).filter(el => el.offsetParent !== null); // only visible
          const idx = focusable.indexOf(e.target);
          if(idx >= 0 && idx < focusable.length - 1) {
            focusable[idx+1].focus();
            focusable[idx+1].select && focusable[idx+1].select();
          } else {
            // Last field — save the open form
            if(showPurchaseForm)  { handleSavePurchase(); return; }
            if(showSalesForm)     { handleSaveSales();    return; }
            if(showItemForm)      { handleSaveItem();     return; }
            if(showPaymentForm)   { handleSavePayment();  return; }
            if(showSupplierForm)  { handleSaveSupplier(); return; }
            if(quickStockItem)    { handleQuickStock();   return; }
          }
          return;
        }
      }

      // Ctrl+S: Save current open form
      if(e.ctrlKey && e.key.toLowerCase()==="s" && currentUser) {
        e.preventDefault();
        if(showPurchaseForm)       { handleSavePurchase(); return; }
        if(showSalesForm)          { handleSaveSales();    return; }
        if(showItemForm)           { handleSaveItem();     return; }
        if(showPaymentForm)        { handleSavePayment();  return; }
        if(showSupplierForm)       { handleSaveSupplier(); return; }
        if(quickStockItem)         { handleQuickStock();   return; }
      }

      // Alt+Key: Owner section shortcuts
      if(e.altKey && currentUser?.role === "owner") {
        const altMap = {
          h:"home", i:"inventory", p:"purchase",
          s:"sales_pos", t:"payments", r:"reports", m:"masters"
        };
        const sec = altMap[e.key.toLowerCase()];
        if(sec) {
          e.preventDefault();
          setActiveSection(sec);
          setOwnerSubTab("");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentUser]);


  // ═══════════════════════════════════════════════════
  // KEYBOARD SHORTCUTS
  // ═══════════════════════════════════════════════════
  useEffect(()=>{
    const handler = (e) => {
      // Don't fire when typing in inputs/textareas/selects
      const tag = document.activeElement?.tagName;
      const isTyping = ["INPUT","TEXTAREA","SELECT"].includes(tag);

      // ? or F1 = Show shortcuts help (always works)
      if(e.key==="?" && !e.ctrlKey && !e.altKey) { setShowShortcuts(p=>!p); return; }
      if(e.key==="Escape") {
        setShowShortcuts(false);
        if(showPurchaseForm) { setShowPurchaseForm(false); return; }
        if(showSalesForm)    { setShowSalesForm(false); return; }
        if(showItemForm)     { setShowItemForm(false); setEditingItem(null); return; }
        if(showPaymentForm)  { setShowPaymentForm(false); return; }
        if(showSupplierForm) { setShowSupplierForm(false); return; }
        if(showCart)         { setShowCart(false); return; }
        if(quickStockItem)   { setQuickStockItem(null); return; }
        return;
      }

      if(isTyping) return; // below shortcuts only when not typing

      if(!currentUser || currentUser.role !== "owner") return;

      // ── Alt + Nav shortcuts ──
      if(e.altKey && !e.ctrlKey) {
        switch(e.key.toLowerCase()) {
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

      // ── Ctrl + Action shortcuts ──
      if(e.ctrlKey && !e.altKey) {
        switch(e.key.toLowerCase()) {
          case "n": // New Sale Bill
            e.preventDefault();
            setActiveSection("sales_pos"); setOwnerSubTab("");
            setTimeout(()=>openSalesForm(false), 50);
            break;
          case "b": // New Purchase Bill
            e.preventDefault();
            setActiveSection("purchase"); setOwnerSubTab("");
            setTimeout(()=>openPurchaseForm(), 50);
            break;
          case "q": // Quick - New Payment
            e.preventDefault();
            setActiveSection("payments"); setOwnerSubTab("");
            setTimeout(()=>openPaymentForm("payment"), 50);
            break;
          default: break;
        }
        return;
      }

      // ── F keys for 8 Divisions (go to inventory + open division) ──
      const fMap = {
        "F2":"medicines","F3":"surgical","F4":"cosmetics","F5":"baby",
        "F6":"devices","F7":"vitamins","F8":"ayurvedic","F9":"otc"
      };
      if(fMap[e.key]) {
        e.preventDefault();
        setActiveSection("inventory");
        setOwnerSubTab(fMap[e.key]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line
  },[currentUser, showPurchaseForm, showSalesForm, showItemForm, showPaymentForm, showSupplierForm, showCart, quickStockItem]);




  const safeGet = async (key) => {
    // Firebase Firestore — sync across all devices
    try {
      const snap = await getDoc(doc(db, "store", key));
      if(snap.exists()) return JSON.parse(snap.data().value);
    } catch(_) {}
    // fallback to localStorage
    try {
      const val = localStorage.getItem(key);
      if(val) return JSON.parse(val);
    } catch(_) {}
    return null;
  };

  const loadAll = async () => {
    // Clear old localStorage store data — cloud is single source of truth
    // localStorage data preserved
    const it = await safeGet("store_items");
    const bt = await safeGet("store_batches");
    const su = await safeGet("store_suppliers");
    const pb = await safeGet("store_purchase");
    const pm = await safeGet("store_payments");
    const or = await safeGet("store_orders");
    const bk = await safeGet("store_bank");

    if(it && it.length>0) setItems(it);
    if(bt && bt.length>0) setBatches(bt);
    if(su && su.length>0) setSuppliers(su);
    if(pb && pb.length>0) setPurchaseBills(pb);
    if(pm && pm.length>0) setPayments(pm);
    if(or && or.length>0) setCustOrders(or);
    if(bk && bk.length>0) setBankEntries(bk);

    // Load sales bills - cloud first (shared across devices)
    let salesLoaded = false;
    const meta = await safeGet("store_sales_meta");
    if(meta && meta.chunks > 0) {
      const parts = await Promise.all(Array.from({length:meta.chunks},(_,i)=>safeGet(`store_sales_${i}`)));
      const all = parts.flatMap(p=>Array.isArray(p)?p:[]);
      if(all.length>0) { setSalesBills(all); salesLoaded=true; }
    }
    if(!salesLoaded) {
      const sb = await safeGet("store_sales");
      if(sb?.length>0) setSalesBills(sb);
    }

    // Check owner account
    // Load doctors
    const docs = await safeGet("store_doctors");
    if(docs) setDoctors(docs);
    // Load UPI settings
    const upi = await safeGet("store_upi_settings");
    if(upi) setUpiSettings(upi);
    // Load customers
    const cust = await safeGet("store_customers");
    if(cust) setCustomers(cust);

    // Check owner account from localStorage
    let owData = null;
    try { owData = await fbGet("owner_account"); } catch(_) {} if(!owData) { try { const loc = localStorage.getItem("owner_account"); if(loc) owData = JSON.parse(loc); } catch(_) {} }
    if(owData && owData.email) { setOwnerExists(true); setOwnerMode("login"); return; }
    // Check if permanent owner credentials are active (not deleted)
    let permDeleted=false;
    try{ const dd = await fbGet("owner_account_deleted"); if(dd==="true") permDeleted=true; }catch(_){} if(!permDeleted){try{const d=localStorage.getItem("owner_account_deleted");if(d==="true")permDeleted=true;}catch(_){}}
    if(!permDeleted){ setOwnerExists(true); setOwnerMode("login"); return; }
    setOwnerExists(false); setOwnerMode("register");
  };

  const save = async (key, data) => {
    const str = JSON.stringify(data);
    // Firebase Firestore — sync across all devices
    try { await setDoc(doc(db, "store", key), {value: str}); } catch(_) {}
    // also save locally as backup
    try { localStorage.setItem(key, str); } catch(_) {}
    return true;
  };
  const saveItems = async (l) => { setItems(l); await save("store_items", l); };
  const saveBatches = (l) => { setBatches(l); save("store_batches",l); };
  const saveSuppliers = (l) => { setSuppliers(l); save("store_suppliers",l); };
  const savePurchaseBills = (l) => { setPurchaseBills(l); save("store_purchase",l); };
  const saveSalesBills = async (l) => {
    setSalesBills(l);
    // Cloud in chunks
    try {
      const chunkSize = 50;
      const chunks = [];
      for(let i=0;i<l.length;i+=chunkSize) chunks.push(l.slice(i,i+chunkSize));
      await save("store_sales_meta", {chunks: chunks.length, total: l.length});
      for(let i=0;i<chunks.length;i++) await save(`store_sales_${i}`, chunks[i]);
    } catch(_) {}
  };
  const savePayments = (l) => { setPayments(l); save("store_payments",l); };
  const saveCustOrders = (l) => { setCustOrders(l); save("store_orders",l); };
  const saveBankEntries = (l) => { setBankEntries(l); save("store_bank",l); };

  const handleExportData = () => {
    const data = { items, batches, suppliers, purchaseBills, salesBills, payments, custOrders, bankEntries, upiSettings, doctors, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `shivdhara_backup_${new Date().toLocaleDateString("en-IN").replace(/\//g,"-")}.json`;
    a.click(); URL.revokeObjectURL(url);
    showToast("Data exported successfully!");
  };

  const handleImportData = (e) => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if(data.items)         { setItems(data.items);               await save("store_items",     data.items); }
        if(data.batches)       { setBatches(data.batches);           await save("store_batches",   data.batches); }
        if(data.suppliers)     { setSuppliers(data.suppliers);       await save("store_suppliers", data.suppliers); }
        if(data.purchaseBills) { setPurchaseBills(data.purchaseBills); await save("store_purchase", data.purchaseBills); }
        if(data.salesBills)    { await saveSalesBills(data.salesBills); }
        if(data.payments)      { setPayments(data.payments);         await save("store_payments",  data.payments); }
        if(data.custOrders)    { setCustOrders(data.custOrders);     await save("store_orders",    data.custOrders); }
        if(data.doctors)       { setDoctors(data.doctors);           await save("store_doctors",   data.doctors); }
        if(data.bankEntries)   { setBankEntries(data.bankEntries);   await save("store_bank",      data.bankEntries); }
        showToast("✅ Data imported successfully! All records restored.");
      } catch(err) { showToast("Import failed: Invalid file format", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ═══════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════
  const handleLogin = async () => {
    if(!loginData.email||!loginData.password){showToast("Please enter email and password","error");return;}
    const email = loginData.email.toUpperCase();
    // Check in local customers state first
    let c = customers[email];
    // Fallback: try old per-key storage
    if(!c) {
      try {
        const cd = await fbGet(`customer_${email}`) || (() => { try { const v = localStorage.getItem(`customer_${email}`); return v ? JSON.parse(v) : null; } catch(_) { return null; } })();
        if(cd) c = JSON.parse(cd);
      } catch(_) {}
    }
    if(c) {
      if(c.password === loginData.password) {
        setCurrentUser(c);
        setLoginData({email:"",password:""});
        showToast(`Welcome, ${c.name}!`);
      } else {
        showToast("Wrong password","error");
      }
    } else {
      showToast("Account not found. Please register.","error");
    }
  };

  const handleRegister = async () => {
    const{name,phone,password,confirmPassword}=regData;
    const email = (regData.email||"").toUpperCase();
    if(!name||!email||!password){showToast("Name, Email and Password are required","error");return;}
    if(password!==confirmPassword){showToast("Passwords do not match","error");return;}
    if(password.length<4){showToast("Password minimum 4 characters","error");return;}
    if(customers[email]){showToast("This email is already registered","error");return;}
    const u={name,email,phone,password,role:"customer",address:"",createdAt:new Date().toISOString()};
    const newCustomers = {...customers,[email]:u};
    setCustomers(newCustomers);
    await save("store_customers", newCustomers);
    setCurrentUser(u);
    setRegData({name:"",email:"",phone:"",password:"",confirmPassword:""});
    showToast(`Welcome, ${name}!`);
  };

  const handleOwnerLogin = async () => {
    if(!ownerInput.email||!ownerInput.password){showToast("Please enter email and password","error");return;}
    const inputEmail = ownerInput.email.trim().toUpperCase();
    const inputPass  = ownerInput.password;
    // Default admin fallback
    if(inputEmail==="ADMIN@PHARMACY.COM"&&inputPass==="admin123"){
      setCurrentUser({name:"Admin",email:"admin@pharmacy.com",role:"owner",pharmacyName:"Shiv Dhara Medical Store"});
      setOwnerInput({email:"",password:""});setShowOwnerPanel(false);showToast("Welcome, Admin!");return;
    }
    // Permanent owner fallback - always works unless account is deleted
    const PERM_EMAIL="AVI@GMAIL.COM", PERM_PASS="21122007";
    if(inputEmail===PERM_EMAIL && inputPass===PERM_PASS){
      let deleted=false;
      try{ const fd=await fbGet("owner_account_deleted"); if(fd==="true")deleted=true; }catch(_){} if(!deleted){try{const loc=localStorage.getItem("owner_account_deleted");if(loc==="true")deleted=true;}catch(_){}}
      if(!deleted){
        const permOwner={name:"Avi",email:"AVI@GMAIL.COM",role:"owner",pharmacyName:"Shiv Dhara Medical Store"};
        try{ const ex=await fbGet("owner_account"); if(!ex){ await fbSet("owner_account",{...permOwner,password:PERM_PASS}); localStorage.setItem("owner_account",JSON.stringify({...permOwner,password:PERM_PASS})); }}catch(_){}
        
        ownerSession.current={...permOwner,password:PERM_PASS};
        setOwnerExists(true);
        setCurrentUser(permOwner);setOwnerInput({email:"",password:""});setShowOwnerPanel(false);showToast("Welcome, Avi!");return;
      }
    }
    // Helper to match credentials (email case-insensitive)
    const match = (o) => o && o.email && o.email.trim().toUpperCase()===inputEmail && o.password===inputPass;
    // 1. Check in-memory session
    if(ownerSession.current && match(ownerSession.current)){
      const o=ownerSession.current;
      setCurrentUser(o);setOwnerInput({email:"",password:""});setShowOwnerPanel(false);showToast(`Welcome, ${o.name}!`);return;
    }
    // 2. Check localStorage (fastest, works offline)
    try {
      const loc = localStorage.getItem("owner_account");
      if(loc){
        const o = JSON.parse(loc);
        if(match(o)){
          ownerSession.current = o;
          setCurrentUser(o);setOwnerInput({email:"",password:""});setShowOwnerPanel(false);showToast(`Welcome, ${o.name}!`);return;
        } else if(o && o.email) {
          // Account exists but wrong password
          showToast("Incorrect email or password","error");return;
        }
      }
    }catch(_){}
    // 3. Check shared cloud storage (other device login)
    try{
      const od = localStorage.getItem("owner_account");
      if(od){
        const o = JSON.parse(od);
        if(match(o)){
          try { await fbSet("owner_account", o); fbSet("owner_account", o); localStorage.setItem("owner_account", JSON.stringify(o)); } catch(_) {}
          ownerSession.current = o;
          setCurrentUser(o);setOwnerInput({email:"",password:""});setShowOwnerPanel(false);showToast(`Welcome, ${o.name}!`);return;
        } else if(o && o.email){
          showToast("Incorrect email or password","error");return;
        }
      }
    }catch(_){}
    showToast("Owner account not found. Please register first.","error");
  };

  const handleOwnerRegister = async () => {
    const{name,pharmacyName,email,phone,password,confirmPassword}=ownerRegData;
    if(!name){showToast("Name is required","error");return;}
    if(!email){showToast("Email is required","error");return;}
    if(!password){showToast("Password is required","error");return;}
    if(password!==confirmPassword){showToast("Passwords do not match","error");return;}
    if(password.length<6){showToast("Password must be at least 6 characters","error");return;}
    // ── BLOCK if owner already exists anywhere (localStorage or cloud) ──
    try { const loc = localStorage.getItem("owner_account"); if(loc){ const ex=JSON.parse(loc); if(ex&&ex.email){showToast("Owner account already exists. Please login.","error");setOwnerMode("login");return;} } } catch(_){}
    try {
      const od = localStorage.getItem("owner_account");
      if(od){ const ex=JSON.parse(od); if(ex&&ex.email){
        // Cache locally and switch to login
        try { localStorage.setItem("owner_account", JSON.stringify(ex)); } catch(_) {}
        setOwnerExists(true); setOwnerMode("login");
        showToast("Owner account already exists. Please login.","error"); return;
      }}
    } catch(_) {}
    const o={name,pharmacyName:pharmacyName||"Shiv Dhara Medical Store",email,phone,password,role:"owner",createdAt:new Date().toISOString()};
    // Save to localStorage (this device) AND shared cloud storage (all devices)
    try { await fbSet("owner_account", o); fbSet("owner_account", o); localStorage.setItem("owner_account", JSON.stringify(o)); } catch(_) {}
    try {
      fbSet("owner_account", o); localStorage.setItem("owner_account", JSON.stringify(o));
    } catch(err) { console.warn("Cloud storage error:", err); }
    // Always set current user (in-memory session)
    ownerSession.current = o;
    setCurrentUser(o);
    setOwnerExists(true);
    setOwnerRegData({name:"",pharmacyName:"Shiv Dhara Medical Store",email:"",phone:"",password:"",confirmPassword:""});
    setShowOwnerPanel(false);
    showToast(`Welcome, ${name}! Owner account created successfully.`);
  };

  const handleLogout = () => { setCurrentUser(null);setCart([]);setShowCart(false);setActiveSection("home"); };

  const handleDeleteOwnerAccount = () => {
    showConfirm("⚠️ Delete owner account? You will need to register again to access owner panel.", async () => {
      // Remove from localStorage and set deleted flag to block permanent fallback
      try { await fbSet("owner_account_deleted","true"); await fbSet("owner_account",null); localStorage.removeItem("owner_account"); localStorage.setItem("owner_account_deleted","true"); } catch(_) {}
      // Remove from shared cloud storage
      try { localStorage.removeItem("owner_account"); } catch(_) {}
      // Clear in-memory session
      ownerSession.current = null;
      setOwnerExists(false);
      setOwnerMode("register");
      setActiveMenu(null);
      handleLogout();
      showToast("Owner account deleted. Please register again to access owner panel.");
    });
  };

  // ═══════════════════════════════════════════════════
  // ITEM MASTER
  // ═══════════════════════════════════════════════════
  const emptyItemForm = (divId) => ({ division:divId, name:"", company:"", pRate:"", mrp:"", gst:"5", cess:"", discount:"", stock:"", unit:"", pack:"", minimum:"5", expiryDate:"", drugGroup:"", hsn:"", barcode:"", supplier:"", location:"", description:"", scheduleH:false, rxRequired:false, taxType:"taxable", itemCategory:"" });

  const openItemForm = (divId, item=null) => {
    setItemDivision(divId);
    setEditingItem(item);
    setItemForm(item ? {...item} : emptyItemForm(divId));
    setShowItemForm(true);
  };

  const handleSaveItem = async () => {
    if(!itemForm.name){showToast("Item name is required","error");return;}
    const toUpper = (v) => typeof v==="string" ? v.toUpperCase() : v;
    const parsed = {
      ...itemForm,
      name: toUpper(itemForm.name),
      company: toUpper(itemForm.company),
      drugGroup: toUpper(itemForm.drugGroup),
      unit: toUpper(itemForm.unit),
      pack: toUpper(itemForm.pack),
      supplier: toUpper(itemForm.supplier),
      location: toUpper(itemForm.location),
      hsn: toUpper(itemForm.hsn),
      barcode: toUpper(itemForm.barcode),
      itemCategory: toUpper(itemForm.itemCategory),
      division: itemDivision,
      price: num(itemForm.mrp)||num(itemForm.pRate),
      pRate: num(itemForm.pRate),
      mrp: num(itemForm.mrp),
      gst: num(itemForm.gst),
      cess: num(itemForm.cess),
      discount: num(itemForm.discount),
      stock: int(itemForm.stock),
      minimum: int(itemForm.minimum)
    };
    const newList = editingItem
      ? items.map(i => i.id===editingItem.id ? {...i,...parsed} : i)
      : [...items, {id:uid(),...parsed,createdAt:new Date().toISOString()}];
    setItems(newList);
    const ok = await save("store_items", newList);
    if(ok !== false) {
      showToast(editingItem ? "Item updated successfully!" : "Item added successfully!");
      setShowItemForm(false); setEditingItem(null); setItemForm({});
    }
  };

  const handleDeleteItem = (id) => { showConfirm("Delete this item?",()=>{saveItems(items.filter(i=>i.id!==id));showToast("Item deleted");}); };

  const handleQuickStock = () => {
    if(!quickStockItem||quickQty===""){showToast("Please enter quantity","error");return;}
    saveItems(items.map(i=>i.id===quickStockItem.id?{...i,stock:Math.max(0,int(i.stock)+int(quickQty))}:i));
    showToast(`${quickStockItem.name} stock updated!`);
    setQuickStockItem(null);setQuickQty("");
  };

  // ═══════════════════════════════════════════════════
  // PURCHASE BILL
  // ═══════════════════════════════════════════════════
  const emptyPurchaseForm = () => ({ entryNo:"", partyName:"", supplierId:"", billNo:"", billDate:today(), entryDate:today(), taxType:"exclusive", taxZone:"sgst_ugst", gstInclusive:false, gstOnFree:false, paymentMode:"cash", remarks:"", halfScheme:"0", octOnFree:"0", otherAdj:"0", lessDisc:"0", crNote:"0", tcsValue:"0" });
  const emptyPurchaseItem = () => ({ itemId:"", itemName:"", batchNo:"", mfgDate:"", expiryDate:"", qty:"1", freeQty:"0", ptr:"", mrp:"", gst:"5", disc:"0", cess:"0", amount:0 });

  const calcPurchaseItemAmt = (pi) => {
    const ptr=num(pi.ptr), qty=int(pi.qty), gst=num(pi.gst), disc=num(pi.disc), cess=num(pi.cess);
    const base = ptr*qty;
    const discAmt = base*disc/100;
    const taxable = base-discAmt;
    const gstAmt = taxable*gst/100;
    const cessAmt = taxable*cess/100;
    return taxable+gstAmt+cessAmt;
  };

  const openPurchaseForm = () => {
    const nextEntry = (purchaseBills.length > 0 ? Math.max(...purchaseBills.map(b=>parseInt(b.entryNo)||0)) : 0) + 1;
    setPurchaseForm({...emptyPurchaseForm(), entryNo: String(nextEntry)});
    setPurchaseItems([emptyPurchaseItem()]);
    setShowPurchaseForm(true);
  };

  const updatePurchaseItem = (idx, field, val) => {
    setPurchaseItems(prev => {
      const updated = [...prev];
      updated[idx] = {...updated[idx], [field]:val};
      // Auto-fill item details from item master
      if(field==="itemId" && val) {
        const found = items.find(i=>i.id===val);
        if(found) updated[idx] = {...updated[idx], itemName:found.name, mrp:found.mrp||found.price, ptr:found.pRate||"", gst:found.gst||5};
      }
      updated[idx].amount = calcPurchaseItemAmt(updated[idx]);
      return updated;
    });
  };

  const addPurchaseItem = () => setPurchaseItems(prev=>[...prev,emptyPurchaseItem()]);
  const removePurchaseItem = (idx) => setPurchaseItems(prev=>prev.filter((_,i)=>i!==idx));

  const handleSavePurchase = () => {
    if(!purchaseForm.partyName){showToast("Party name is required","error");return;}
    const validItems = purchaseItems.filter(pi=>pi.itemId&&int(pi.qty)>0);
    if(!validItems.length){showToast("Please add at least 1 item","error");return;}
    const subtotal = validItems.reduce((s,pi)=>s+num(pi.ptr)*int(pi.qty),0);
    const totalGst = validItems.reduce((s,pi)=>s+(num(pi.ptr)*int(pi.qty)-num(pi.ptr)*int(pi.qty)*num(pi.disc)/100)*num(pi.gst)/100,0);
    const totalDisc = validItems.reduce((s,pi)=>s+num(pi.ptr)*int(pi.qty)*num(pi.disc)/100,0);
    const total = validItems.reduce((s,pi)=>s+calcPurchaseItemAmt(pi),0);

    const bill = { id:uid(), entryNo:purchaseForm.entryNo||(purchaseBills.length+1), ...purchaseForm, items:validItems, subtotal, totalGst, totalDisc, total, createdAt:new Date().toISOString(), status:purchaseForm.paymentMode==="credit"?"Credit":"Paid" };
    savePurchaseBills([...purchaseBills, bill]);

    // Update stock and batches
    let newItems = [...items];
    let newBatches = [...batches];
    validItems.forEach(pi => {
      // Add batch
      newBatches.push({ id:uid(), itemId:pi.itemId, batchNo:pi.batchNo||"N/A", mfgDate:pi.mfgDate, expiryDate:pi.expiryDate, qty:int(pi.qty)+int(pi.freeQty), mrp:num(pi.mrp), ptr:num(pi.ptr), gst:num(pi.gst), purchaseBillId:bill.id });
      // Update item stock
      newItems = newItems.map(i => i.id===pi.itemId ? {...i, stock:int(i.stock)+int(pi.qty)+int(pi.freeQty), pRate:num(pi.ptr), mrp:num(pi.mrp)||i.mrp} : i);
    });
    saveItems(newItems);
    saveBatches(newBatches);
    showToast("Purchase Bill saved! Stock updated.");
    setShowPurchaseForm(false);
  };

  // ═══════════════════════════════════════════════════
  // SALES BILL (POS)
  // ═══════════════════════════════════════════════════
  const emptySalesForm = () => ({ patientName:"", patientArea:"", doctorName:"", mobile:"", address:"", paymentMode:"cash", discount:"0", salesMan:"", retailInv:"", payRec:"0", quotation:false, halfScheme:"0", octOnFree:"0", otherAdj:"0", crNote:"0", tcsValue:"0", remarks:"" });
  const emptySalesItem = () => ({ itemId:"", itemName:"", batchNo:"", qty:"1", mrp:"", rate:"", gst:"0", disc:"0", amount:0 });

  const calcSalesItemAmt = (si) => {
    const rate=num(si.rate), qty=int(si.qty), gst=num(si.gst), disc=num(si.disc);
    const base=rate*qty;
    const discAmt=base*disc/100;
    const taxable=base-discAmt;
    return taxable*(1+gst/100);
  };

  const openSalesForm = (returnMode=false) => {
    setSalesForm(emptySalesForm());
    setSalesItems([emptySalesItem()]);
    setIsReturn(returnMode);
    setShowSalesForm(true);
  };

  const updateSalesItem = (idx, field, val) => {
    setSalesItems(prev => {
      const updated = [...prev];
      updated[idx] = {...updated[idx], [field]:val};
      if(field==="itemId" && val) {
        const found = items.find(i=>i.id===val);
        if(found) updated[idx] = {...updated[idx], itemName:found.name, mrp:num(found.mrp)||num(found.price), rate:num(found.price), gst:num(found.gst)||0};
      }
      updated[idx].amount = calcSalesItemAmt(updated[idx]);
      return updated;
    });
  };

  const addSalesItem = () => setSalesItems(prev=>[...prev,emptySalesItem()]);
  const removeSalesItem = (idx) => setSalesItems(prev=>prev.filter((_,i)=>i!==idx));

  const handleSaveSales = () => {
    if(!salesForm.patientName&&!salesForm.mobile){showToast("Please enter patient name or mobile","error");return;}
    const validItems = salesItems.filter(si=>si.itemId&&int(si.qty)>0);
    if(!validItems.length){showToast("Please add at least 1 item","error");return;}
    const grossAmount = validItems.reduce((s,si)=>s+calcSalesItemAmt(si),0);
    const lessDisc = grossAmount*num(salesForm.discount)/100;
    const netAmount = grossAmount-lessDisc;
    const sign = isReturn ? -1 : 1;

    const bill = { id:uid(), billNo:salesBills.length+1, date:new Date().toISOString(), ...salesForm, items:validItems, grossAmount:grossAmount*sign, lessDisc:lessDisc*sign, netAmount:netAmount*sign, isReturn, createdAt:new Date().toISOString(), status:"Completed" };
    saveSalesBills([...salesBills, bill]);

    // Update stock (reduce for sale, increase for return)
    let newItems = [...items];
    validItems.forEach(si => {
      newItems = newItems.map(i => i.id===si.itemId ? {...i, stock:Math.max(0,int(i.stock)-(int(si.qty)*sign))} : i);
    });
    saveItems(newItems);
    showToast(isReturn?"Return Bill saved successfully!":"Sales Bill saved successfully!");
    setShowSalesForm(false);
    // Auto print
    handlePrintSalesBill(bill);
  };

  const handlePrintSalesBill = (bill) => {
    const rows = bill.items.filter(si=>si.itemId).map((si,idx)=>{
      const rate=num(si.rate),qty=int(si.qty),gst=num(si.gst),disc=num(si.disc);
      const base=rate*qty, discAmt=base*disc/100, taxable=base-discAmt, total=taxable*(1+gst/100);
      return `<tr><td style="padding:5px 8px;border-bottom:1px solid #eee">${idx+1}</td><td style="padding:5px 8px;border-bottom:1px solid #eee">${si.itemName}</td><td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:center">${si.batchNo||"-"}</td><td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right">${qty}</td><td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right">₹${fmt(si.mrp)}</td><td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right">₹${fmt(rate)}</td><td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right">${gst}%</td><td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:700">₹${fmt(total)}</td></tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><title>Bill #${bill.billNo}</title><style>body{font-family:system-ui;padding:20px;max-width:700px;margin:0 auto;font-size:13px}table{width:100%;border-collapse:collapse}th{background:#f1f5f9;padding:7px 8px;text-align:left;font-size:11px}@media print{.noprint{display:none}}</style></head><body>
    <div style="text-align:center;margin-bottom:16px;border-bottom:2px solid #1e40af;padding-bottom:12px">
      <h2 style="margin:0;color:#1e40af;font-size:18px">Shiv Dhara Medical Store</h2>
      <div style="font-size:11px;color:#64748b">Drug License No: _______ | GST: _______</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;font-size:12px">
      <div><div><strong>Bill No:</strong> ${bill.billNo} ${bill.isReturn?"(RETURN)":""}</div><div><strong>Date:</strong> ${new Date(bill.date).toLocaleDateString("en-IN")}</div><div><strong>Patient:</strong> ${bill.patientName||"-"}${bill.patientArea?" ("+bill.patientArea+")":""}</div><div><strong>Mobile:</strong> ${bill.mobile||"-"}</div></div>
      <div><div><strong>Doctor:</strong> ${bill.doctorName||"-"}</div><div><strong>S.Man:</strong> ${bill.salesMan||"-"}</div><div><strong>Payment:</strong> ${bill.paymentMode?.toUpperCase()}</div><div><strong>Address:</strong> ${bill.address||"-"}</div></div>
    </div>
    <table><thead><tr><th>Sr</th><th>Item Name</th><th>Batch</th><th style="text-align:right">Qty</th><th style="text-align:right">MRP</th><th style="text-align:right">Rate</th><th style="text-align:right">GST</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td colspan="6"></td><td style="padding:8px;text-align:right;font-weight:700;border-top:2px solid #1e40af">Gross:</td><td style="padding:8px;text-align:right;font-weight:700;border-top:2px solid #1e40af">₹${fmt(Math.abs(bill.grossAmount))}</td></tr>
    ${bill.lessDisc?`<tr><td colspan="6"></td><td style="padding:4px 8px;text-align:right">Less Disc:</td><td style="padding:4px 8px;text-align:right">₹${fmt(Math.abs(bill.lessDisc))}</td></tr>`:""}
    <tr><td colspan="6"></td><td style="padding:8px;text-align:right;font-weight:800;font-size:15px;border-top:1px solid #e2e8f0">NET:</td><td style="padding:8px;text-align:right;font-weight:800;font-size:15px;color:#16a34a;border-top:1px solid #e2e8f0">₹${fmt(Math.abs(bill.netAmount))}</td></tr></tfoot></table>
    <div style="margin-top:20px;text-align:center;font-size:11px;color:#94a3b8">Thank you! Medicines: Please check MRP before giving to patient.</div>
    <br><button class="noprint" onclick="window.print()" style="background:#3b82f6;color:white;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-size:14px">🖨️ Print</button>
    </body></html>`;
    const w=window.open("","_blank");
    if(w){w.document.write(html);w.document.close();}
    else{ setPrintHtml(html); }
  };

  // ═══════════════════════════════════════════════════
  // PAYMENTS
  // ═══════════════════════════════════════════════════
  const openPaymentForm = (type="payment") => {
    setPaymentForm({ type, date:today(), mode:"cash", amount:"", accountName:"", supplierId:"", bankName:"", chequeNo:"", remark:"" });
    setShowPaymentForm(true);
  };

  const handleSavePayment = () => {
    if(!paymentForm.accountName||!paymentForm.amount){showToast("Account name and amount are required","error");return;}
    const p = { id:uid(), vchNo:payments.length+1, ...paymentForm, createdAt:new Date().toISOString() };
    savePayments([...payments, p]);
    showToast("Payment saved successfully!");
    setShowPaymentForm(false);
  };

  // ═══════════════════════════════════════════════════
  // SUPPLIERS (ACCOUNT MASTER)
  // ═══════════════════════════════════════════════════
  const emptySupplierForm = () => ({ name:"", address:"", city:"Ahmedabad", state:"Gujarat", contact:"", mobile:"", email:"", gstTin:"", dlNo:"", panNo:"", creditLimit:"", creditDays:"30", openingBalance:"0", type:"supplier" });

  const openSupplierForm = (s=null) => {
    setEditingSupplier(s);
    setSupplierForm(s?{...s}:emptySupplierForm());
    setShowSupplierForm(true);
  };

  const showConfirm = (msg, onOk) => setConfirmDialog({msg, onOk});

  const handleDeletePurchaseBill = async (bill) => {
    showConfirm("Delete this purchase bill? Stock will be reversed.", async () => {
      savePurchaseBills(purchaseBills.filter(b=>b.id!==bill.id));
      let newItems=[...items];
      (bill.items||[]).forEach(pi=>{
        if(pi.itemId) newItems=newItems.map(i=>i.id===pi.itemId?{...i,stock:Math.max(0,int(i.stock)-(int(pi.qty)+int(pi.freeQty||0)))}:i);
      });
      await saveItems(newItems);
      saveBatches(batches.filter(b=>b.purchaseBillId!==bill.id));
      showToast("Purchase bill deleted & stock reversed");
    });
  };

  const handleDeleteSalesBill = async (bill) => {
    showConfirm("Delete this sales bill? Stock will be restored.", async () => {
      await saveSalesBills(salesBills.filter(b=>b.id!==bill.id));
      const sign = bill.isReturn ? -1 : 1;
      let newItems=[...items];
      (bill.items||[]).filter(si=>si.itemId).forEach(si=>{
        newItems=newItems.map(i=>i.id===si.itemId?{...i,stock:int(i.stock)+(int(si.qty)*sign)}:i);
      });
      await saveItems(newItems);
      showToast("Sales bill deleted & stock restored");
    });
  };

  const handleSaveSupplier = () => {
    if(!supplierForm.name){showToast("Name is required","error");return;}
    if(editingSupplier) saveSuppliers(suppliers.map(s=>s.id===editingSupplier.id?{...s,...supplierForm}:s));
    else saveSuppliers([...suppliers,{id:uid(),...supplierForm,createdAt:new Date().toISOString()}]);
    showToast(editingSupplier?"Supplier updated!":"Supplier added!");
    setShowSupplierForm(false);setEditingSupplier(null);
  };

  // ═══════════════════════════════════════════════════
  // CUSTOMER CART / ORDERS
  // ═══════════════════════════════════════════════════
  const addToCart = (item) => {
    const ex=cart.find(i=>i.id===item.id);
    setCart(ex?cart.map(i=>i.id===item.id?{...i,quantity:i.quantity+1}:i):[...cart,{...item,quantity:1}]);
    showToast(`${item.name} added to cart!`);
  };
  const removeFromCart = (id) => setCart(cart.filter(i=>i.id!==id));
  const updateCartQty = (id,qty) => { if(qty<=0)removeFromCart(id);else setCart(cart.map(i=>i.id===id?{...i,quantity:qty}:i)); };
  const placeOrder = () => {
    if(!cart.length) return;
    setOrderForm({name:currentUser.name||"",phone:currentUser.phone||"",address:currentUser.address||"",paymentMode:"cash"});
    setShowOrderForm(true);
  };

  const confirmOrder = () => {
    if(!orderForm.name||!orderForm.phone||!orderForm.address){showToast("Name, Phone and Address required","error");return;}
    if(orderForm.paymentMode==="upi"&&!orderForm.transactionId){showToast("Please enter UPI Transaction ID","error");return;}
    const order = {id:uid(),items:cart,total:calcTotal(cart),date:new Date().toISOString(),status:"Pending",paymentMode:orderForm.paymentMode,transactionId:orderForm.transactionId||"",customer:{name:orderForm.name,email:currentUser.email,phone:orderForm.phone,address:orderForm.address}};
    saveCustOrders([...custOrders,order]);
    setCart([]);setShowCart(false);setShowOrderForm(false);setOrderForm({name:"",phone:"",address:"",paymentMode:"cash",transactionId:""});
    showToast("Order placed successfully! 🎉");
  };

  // ═══════════════════════════════════════════════════
  // ORDER STATUS UPDATE
  // ═══════════════════════════════════════════════════
  const updateOrderStatus = (orderId, status) => {
    saveCustOrders(custOrders.map(o=>o.id===orderId?{...o,status,updatedAt:new Date().toISOString()}:o));
    showToast(`Status: ${status}`);
  };

  // ═══════════════════════════════════════════════════
  // SALES REPORT
  // ═══════════════════════════════════════════════════
  const getSalesReport = () => {
    const now=new Date();
    let filtered=salesBills.filter(b=>!b.isReturn);
    if(reportPeriod==="today") filtered=filtered.filter(b=>new Date(b.date).toDateString()===now.toDateString());
    else if(reportPeriod==="week") filtered=filtered.filter(b=>(now-new Date(b.date))<7*86400000);
    else if(reportPeriod==="month") filtered=filtered.filter(b=>new Date(b.date).getMonth()===now.getMonth()&&new Date(b.date).getFullYear()===now.getFullYear());
    const revenue=filtered.reduce((s,b)=>s+num(b.netAmount),0);
    const returns=salesBills.filter(b=>b.isReturn).reduce((s,b)=>s+Math.abs(num(b.netAmount)),0);
    const purchaseTotal=purchaseBills.filter(b=>{
      if(reportPeriod==="today") return new Date(b.createdAt).toDateString()===now.toDateString();
      if(reportPeriod==="week") return (now-new Date(b.createdAt))<7*86400000;
      if(reportPeriod==="month") return new Date(b.createdAt).getMonth()===now.getMonth()&&new Date(b.createdAt).getFullYear()===now.getFullYear();
      return true;
    }).reduce((s,b)=>s+num(b.total),0);
    return {filtered,revenue,returns,purchaseTotal,profit:revenue-purchaseTotal};
  };

  // ═══════════════════════════════════════════════════
  // STYLES
  // ═══════════════════════════════════════════════════
  const inp = {width:"100%",padding:"6px 10px",border:"1px solid #ced4da",borderRadius:"4px",fontSize:"13px",outline:"none",fontFamily:"'Segoe UI',system-ui,sans-serif",background:"white",boxSizing:"border-box",color:"#212529",textTransform:"uppercase"};
  const lbl = {display:"block",marginBottom:"3px",fontWeight:"600",fontSize:"11px",color:"#495057",letterSpacing:"0.3px"};
  const btn = (bg="#1a3a5c",c="white") => ({background:bg,color:c,border:"none",padding:"6px 14px",borderRadius:"4px",cursor:"pointer",fontWeight:"600",fontSize:"12px",display:"flex",alignItems:"center",gap:"5px",letterSpacing:"0.2px"});

  // ═══════════════════════════════════════════════════
  // RENDER AUTH
  // ═══════════════════════════════════════════════════
  if(!currentUser) {
    const handleLogoClick=()=>{const n=logoClicks+1;setLogoClicks(n);if(n>=5){setShowOwnerPanel(true);setLogoClicks(0);}};
    return (
      <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1e40af,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',system-ui,sans-serif",padding:"20px"}}>
        {toast&&<div style={{position:"fixed",top:"20px",right:"20px",background:toast.type==="error"?"#fee2e2":"#d1fae5",color:toast.type==="error"?"#dc2626":"#059669",padding:"12px 18px",borderRadius:"5px",fontWeight:"600",fontSize:"13px",zIndex:9999,boxShadow:"0 4px 15px rgba(0,0,0,0.2)"}}>{toast.msg}</div>}
        <div style={{background:"white",padding:"32px",borderRadius:"8px",boxShadow:"0 20px 50px rgba(0,0,0,0.3)",width:"100%",maxWidth:"420px"}}>
          {showOwnerPanel ? (
            <div>
              <div style={{textAlign:"center",marginBottom:"20px"}}>
                <div style={{width:"52px",height:"52px",borderRadius:"6px",background:"linear-gradient(135deg,#dc2626,#991b1b)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}><Package size={26} color="white"/></div>
                <h2 style={{fontSize:"16px",fontWeight:"700",color:"#1a3a5c",margin:"0 0 4px"}}>Owner Access</h2>
                <p style={{color:"#6c757d",fontSize:"11px",margin:0,letterSpacing:"0.3px"}}>Authorized personnel only</p>
              </div>
              <div style={{display:"flex",background:"#fef2f2",borderRadius:"5px",padding:"4px",marginBottom:"18px",gap:"4px"}}>
                {(ownerExists ? [{id:"login",label:"Login"}] : [{id:"register",label:"Register"},{id:"login",label:"Login"}]).map(t=>(
                  <button key={t.id} onClick={()=>setOwnerMode(t.id)} style={{flex:1,padding:"8px",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"700",fontSize:"13px",background:ownerMode===t.id?"white":"transparent",color:ownerMode===t.id?"#dc2626":"#94a3b8"}}>{t.label}</button>
                ))}
              </div>
              {ownerMode==="register"&&(
                <div>
                  {ownerExists&&<div style={{background:"#fef9c3",border:"1px solid #fde047",borderRadius:"8px",padding:"8px 12px",fontSize:"12px",color:"#854d0e",marginBottom:"12px"}}>⚠️ Existing account replace thase</div>}
                  {[{k:"name",l:"Owner Name *",t:"text",ph:"Your name"},{k:"pharmacyName",l:"Pharmacy Name",t:"text",ph:"Shiv Dhara Medical Store"},{k:"email",l:"Email *",t:"email",ph:"Email"},{k:"phone",l:"Phone",t:"tel",ph:"Mobile"},{k:"password",l:"Password *",t:"password",ph:"Min 6 characters"},{k:"confirmPassword",l:"Confirm Password *",t:"password",ph:"Confirm password"}].map(f=>(
                    <div key={f.k} style={{marginBottom:"10px"}}><label style={lbl}>{f.l}</label><input type={f.t} value={ownerRegData[f.k]} onChange={e=>setOwnerRegData({...ownerRegData,[f.k]:f.t==="password"?e.target.value:e.target.value.toUpperCase()})} onKeyDown={e=>e.key==="Enter"&&handleOwnerRegister()} placeholder={f.ph} style={inp}/></div>
                  ))}
                  <button onClick={handleOwnerRegister} style={{...btn("#dc3545"),width:"100%",justifyContent:"center",padding:"11px",marginTop:"4px"}}><CheckCircle size={14}/>Create Account</button>
                  {ownerExists&&<p style={{textAlign:"center",fontSize:"12px",color:"#64748b",marginTop:"10px",marginBottom:0}}>Already have account? <span onClick={()=>setOwnerMode("login")} style={{color:"#dc2626",cursor:"pointer",fontWeight:"600"}}>Login</span></p>}
                </div>
              )}
              {ownerMode==="login"&&(
                <div>
                  <div style={{marginBottom:"12px"}}><label style={lbl}>Email</label><input type="email" value={ownerInput.email} onChange={e=>setOwnerInput({...ownerInput,email:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handleOwnerLogin()} placeholder="Owner email" style={inp}/></div>
                  <div style={{marginBottom:"20px"}}><label style={lbl}>Password</label><div style={{position:"relative"}}><input type={showPass?"text":"password"} value={ownerInput.password} onChange={e=>setOwnerInput({...ownerInput,password:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handleOwnerLogin()} placeholder="Password" style={{...inp,paddingRight:"38px",textTransform:"none"}}/><button onClick={()=>setShowPass(!showPass)} style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}>{showPass?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></div>
                  <button onClick={handleOwnerLogin} style={{...btn("#dc3545"),width:"100%",justifyContent:"center",padding:"11px"}}>Owner Login</button>
                  {!ownerExists&&<p style={{textAlign:"center",fontSize:"12px",color:"#64748b",marginTop:"10px",marginBottom:0}}>No account? <span onClick={()=>setOwnerMode("register")} style={{color:"#dc2626",cursor:"pointer",fontWeight:"600"}}>Register</span></p>}
                </div>
              )}
              <p style={{textAlign:"center",fontSize:"12px",color:"#94a3b8",marginTop:"14px",marginBottom:0}}><span onClick={()=>{setShowOwnerPanel(false);setOwnerInput({email:"",password:""}); }} style={{cursor:"pointer",color:"#3b82f6",fontWeight:"600"}}>← Back to Customer Login</span></p>
            </div>
          ) : (
            <>
              <div style={{textAlign:"center",marginBottom:"22px"}}>
                <div onClick={handleLogoClick} style={{width:"58px",height:"58px",borderRadius:"6px",background:"linear-gradient(135deg,#3b82f6,#1e40af)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",cursor:"default",userSelect:"none"}}><Package size={28} color="white"/></div>
                <h1 style={{fontSize:"20px",fontWeight:"700",color:"#1a3a5c",margin:"0 0 4px",letterSpacing:"-0.3px"}}>Shiv Dhara Medical Store</h1>
                <p style={{color:"#6c757d",fontSize:"12px",margin:0,letterSpacing:"0.3px"}}>Pharmacy & Health Products</p>
              </div>
              <div style={{display:"flex",background:"#f1f5f9",borderRadius:"5px",padding:"4px",marginBottom:"22px"}}>
                {["login","register"].map(m=>(
                  <button key={m} onClick={()=>setAuthMode(m)} style={{flex:1,padding:"9px",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"700",fontSize:"13px",background:authMode===m?"white":"transparent",color:authMode===m?"#3b82f6":"#64748b",boxShadow:authMode===m?"0 1px 4px rgba(0,0,0,0.12)":"none"}}>{m==="login"?"Login":"Register"}</button>
                ))}
              </div>
              {authMode==="login"&&(
                <div>
                  <div style={{marginBottom:"13px"}}><label style={lbl}>Email</label><input type="email" value={loginData.email} onChange={e=>setLoginData({...loginData,email:e.target.value.toUpperCase()})} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Email address" style={inp}/></div>
                  <div style={{marginBottom:"20px"}}><label style={lbl}>Password</label><div style={{position:"relative"}}><input type={showPass?"text":"password"} value={loginData.password} onChange={e=>setLoginData({...loginData,password:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Password" style={{...inp,paddingRight:"38px"}}/><button onClick={()=>setShowPass(!showPass)} style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}>{showPass?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></div>
                  <button onClick={handleLogin} style={{...btn(),width:"100%",justifyContent:"center",padding:"11px",fontSize:"14px"}}>Login</button>
                  <p style={{textAlign:"center",fontSize:"12px",color:"#94a3b8",marginTop:"12px",marginBottom:0}}>No account? <span onClick={()=>setAuthMode("register")} style={{color:"#3b82f6",cursor:"pointer",fontWeight:"600"}}>Register</span></p>
                </div>
              )}
              {authMode==="register"&&(
                <div>
                  {[{k:"name",l:"Full Name *",t:"text",ph:"Your name"},{k:"email",l:"Email *",t:"email",ph:"Email"},{k:"phone",l:"Phone",t:"tel",ph:"Mobile"},{k:"password",l:"Password *",t:"password",ph:"Min 6 characters"},{k:"confirmPassword",l:"Confirm Password *",t:"password",ph:"Confirm password"}].map(f=>(
                    <div key={f.k} style={{marginBottom:"11px"}}><label style={lbl}>{f.l}</label><input type={f.t} value={regData[f.k]} onChange={e=>setRegData({...regData,[f.k]:f.t==="password"?e.target.value:e.target.value.toUpperCase()})} onKeyDown={e=>e.key==="Enter"&&handleRegister()} placeholder={f.ph} style={inp}/></div>
                  ))}
                  <button onClick={handleRegister} style={{...btn("#198754"),width:"100%",justifyContent:"center",padding:"11px",marginTop:"6px"}}><CheckCircle size={14}/>Create Account</button>
                  <p style={{textAlign:"center",fontSize:"12px",color:"#64748b",marginTop:"12px",marginBottom:0}}>Already have account? <span onClick={()=>setAuthMode("login")} style={{color:"#3b82f6",cursor:"pointer",fontWeight:"600"}}>Login</span></p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER MAIN APP
  // ═══════════════════════════════════════════════════
  const isOwner = currentUser.role==="owner" && ownerViewMode==="owner";
  const expiredCount = items.filter(i=>isExpired(i.expiryDate)).length;
  const expiringSoonCount = items.filter(i=>isExpiringSoon(i.expiryDate)&&!isExpired(i.expiryDate)).length;
  const lowStockCount = items.filter(i=>i.stock>0&&i.stock<=(i.minimum||5)).length;
  const alertCount = expiredCount+expiringSoonCount+lowStockCount;

  // Owner nav items
  const ownerNavItems = [
    {id:"home",     label:"Dashboard", icon:<Home size={15}/>},
    {id:"inventory",label:"Inventory", icon:<Package size={15}/>},
    {id:"purchase", label:"Purchase",  icon:<Truck size={15}/>},
    {id:"sales_pos",label:"Sales Bill",icon:<FileText size={15}/>},
    {id:"payments", label:"Payments",  icon:<CreditCard size={15}/>},
    {id:"bank",     label:"Bank Entry",icon:<span style={{fontSize:"13px"}}>🏦</span>},
    {id:"reports",  label:"Reports",   icon:<TrendingUp size={15}/>},
    {id:"masters",  label:"Masters",   icon:<Users size={15}/>},
    {id:"gst2",     label:"GST 2.0",   icon:<span style={{fontSize:"11px",fontWeight:"800",color:"#f59e0b"}}>GST</span>},
  ];

  return (
    <div style={{height:"100vh",background:"#f1f5f9",fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {toast&&<div style={{position:"fixed",top:"18px",right:"18px",background:toast.type==="error"?"#fee2e2":"#d1fae5",color:toast.type==="error"?"#dc2626":"#059669",padding:"11px 16px",borderRadius:"5px",fontWeight:"600",fontSize:"13px",zIndex:9999,boxShadow:"0 4px 15px rgba(0,0,0,0.2)"}}>{toast.msg}</div>}

      {/* ─── HEADER ─── */}
      <div style={{background:currentUser.role==="owner"&&ownerViewMode==="customer"?"linear-gradient(90deg,#0a4f3c,#166534)":"linear-gradient(90deg,#1a3a5c,#1e5276)",padding:"0 16px",color:"white",display:"flex",justifyContent:"space-between",alignItems:"center",height:"50px",boxShadow:"0 2px 12px rgba(0,0,0,0.2)"}}>
        <div onClick={()=>{
          if(currentUser.role==="owner"){
            // 2 clicks within 600ms to toggle view
            const n = headerLogoClicks+1;
            setHeaderLogoClicks(n);
            clearTimeout(headerLogoTimer.current);
            if(n>=2){
              setHeaderLogoClicks(0);
              if(ownerViewMode==="owner"){
                setOwnerViewMode("customer");
                setActiveCustomerTab("home");
                setActiveSection("");
              } else {
                setOwnerViewMode("owner");
                setActiveSection("home");
              }
            } else {
              headerLogoTimer.current = setTimeout(()=>{
                setHeaderLogoClicks(0);
                setActiveSection("home");
              }, 600);
            }
          } else {
            setActiveSection("home");
          }
        }} style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer"}}>
          <Package size={20}/>
          <div>
            <div style={{fontWeight:"800",fontSize:"14px"}}>Shiv Dhara Medical Store</div>
            <div style={{fontSize:"10px",color:"#bfdbfe",display:"flex",alignItems:"center",gap:"6px"}}>
              <span>{currentUser.name} · {currentUser.role==="owner"?(ownerViewMode==="customer"?"Viewing as Customer":"Owner"):"Customer"}</span>
              {currentUser.role==="owner"&&ownerViewMode==="customer"&&<span style={{background:"rgba(255,255,255,0.25)",padding:"1px 6px",borderRadius:"8px",fontSize:"10px",fontWeight:"700"}}>👁️ Customer View — Double-click to exit</span>}
              {currentUser.role==="owner"&&ownerViewMode==="owner"&&<span style={{background:"rgba(255,255,255,0.15)",padding:"1px 6px",borderRadius:"8px",fontSize:"9px"}}>2× click = Customer View</span>}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
          {!isOwner&&(
            <button onClick={()=>setShowCart(!showCart)} style={{background:"rgba(255,255,255,0.15)",border:"none",padding:"6px 12px",borderRadius:"8px",color:"white",cursor:"pointer",display:"flex",alignItems:"center",gap:"6px",fontSize:"13px",fontWeight:"600",position:"relative"}}>
              <ShoppingCart size={15}/>
              {cart.length>0&&<span style={{background:"#ef4444",borderRadius:"50%",width:"17px",height:"17px",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"800"}}>{cart.length}</span>}
            </button>
          )}
          {isOwner&&alertCount>0&&(
            <div style={{background:"#ef4444",borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:"700",color:"white"}}>⚠️ {alertCount}</div>
          )}
          {isOwner&&(
            <button onClick={()=>setShowShortcuts(p=>!p)} title="Keyboard Shortcuts (?)" style={{background:"rgba(255,255,255,0.15)",border:"none",padding:"5px 10px",borderRadius:"8px",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:"700"}}>⌨️</button>
          )}
          <button onClick={handleLogout} style={{background:"rgba(255,255,255,0.15)",border:"none",padding:"6px 11px",borderRadius:"8px",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:"600",display:"flex",alignItems:"center",gap:"5px"}}><LogOut size={14}/></button>
        </div>
      </div>

      {/* ─── OWNER TOP NAV ─── */}
      {isOwner&&(
        <div style={{background:"#1e2a3a",padding:"0 16px",display:"flex",overflowX:"auto",borderBottom:"2px solid #0d6efd"}}>
          {ownerNavItems.map(t=>{
            const shortcutMap={"home":"Alt+H","inventory":"Alt+I","purchase":"Alt+P","sales_pos":"Alt+S","payments":"Alt+Y","reports":"Alt+R","masters":"Alt+M"};
            const isHov = hoveredNav===t.id;
            const isActive = activeSection===t.id;
            return(
            <button key={t.id}
              onClick={()=>{setActiveSection(t.id);setOwnerSubTab("");}}
              onMouseEnter={()=>setHoveredNav(t.id)}
              onMouseLeave={()=>setHoveredNav(null)}
              style={{padding:"10px 14px",border:"none",background:isActive?"#0d6efd":"transparent",cursor:"pointer",fontWeight:"600",fontSize:"12px",whiteSpace:"nowrap",color:isActive?"white":"#adb5c8",borderBottom:"none",display:"flex",alignItems:"center",gap:"6px",position:"relative",transition:"background 0.15s,color 0.15s"}}>
              {t.icon}{t.label}
              {isHov&&(
                <span style={{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",marginTop:"4px",background:"#212529",color:"#ffc107",padding:"3px 8px",borderRadius:"3px",fontSize:"10px",fontWeight:"700",fontFamily:"monospace",whiteSpace:"nowrap",zIndex:999,pointerEvents:"none",boxShadow:"0 2px 8px rgba(0,0,0,0.3)"}}>
                  {shortcutMap[t.id]}
                </span>
              )}
            </button>
            );
          })}
        </div>
      )}

      {/* ─── OWNER CLASSIC MENU BAR ─── */}
      {isOwner&&(
        <>
        {/* Menu Bar Row */}
        <div style={{background:"#c0c0c0",borderBottom:"2px solid #808080",display:"flex",alignItems:"stretch",padding:"0 2px",userSelect:"none",position:"relative",zIndex:200,overflowX:"auto",overflowY:"visible",flexWrap:"nowrap",scrollbarWidth:"none"}} onWheel={e=>{e.currentTarget.scrollLeft=e.currentTarget.scrollLeft+e.deltaY;}}>

          {/* ── SUPERVISOR ICON (before menus) ── */}
          <div style={{position:"relative",display:"flex",alignItems:"center"}}>
            <button
              ref={supBtnRef}
              onClick={()=>{
                if(activeMenu==="__supicon"){ setActiveMenu(null); }
                else {
                  const r = supBtnRef.current?.getBoundingClientRect();
                  if(r) setSupPanelCoords({top: r.bottom+2, left: r.left});
                  setActiveMenu("__supicon");
                }
              }}
              title="Supervisor Info"
              style={{width:"22px",height:"22px",margin:"1px 3px",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",background:"#d4d0c8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",padding:0,flexShrink:0}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#808080 #ffffff #ffffff #808080";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#ffffff #808080 #808080 #ffffff";}}>
              🖥️
            </button>
            {activeMenu==="__supicon"&&(
              <div style={{position:"fixed",top:supPanelCoords.top,left:supPanelCoords.left,background:"#c0c0c0",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",boxShadow:"3px 3px 0 #000",width:"220px",zIndex:9999}}>
                {/* Title bar */}
                <div style={{background:"linear-gradient(90deg,#000080,#1084d0)",color:"white",padding:"3px 8px",fontSize:"11px",fontWeight:"700",fontFamily:"Tahoma,sans-serif",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>🖥️ Supervisor Information</span>
                  <button onClick={()=>setActiveMenu(null)} style={{background:"#d4d0c8",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",width:"16px",height:"14px",cursor:"pointer",fontSize:"9px",padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"900",lineHeight:1}}>✕</button>
                </div>
                {/* Window control items - exact like original software */}
                <div style={{fontFamily:"Tahoma,sans-serif",fontSize:"12px",paddingTop:"2px"}}>
                  {[
                    {icon:"🪟", label:"Restore",  shortcut:"",         action:()=>{}},
                    {icon:"✥",  label:"Move",     shortcut:"",         action:()=>{}, dim:true},
                    {icon:"⤡",  label:"Size",     shortcut:"",         action:()=>{}, dim:true},
                    {icon:"—",  label:"Minimize", shortcut:"",         action:()=>{}},
                    {icon:"🔲", label:"Maximize", shortcut:"",         action:()=>{}, dim:true},
                    {sep:true},
                    {icon:"✕",  label:"Close",    shortcut:"Ctrl+F4",  action:()=>handleLogout(), bold:true},
                    {sep:true},
                    {icon:"",   label:"Next",     shortcut:"Ctrl+F6",  action:()=>{}},

                  ].map((row,i)=>row.sep?(
                    <div key={i} style={{height:"1px",background:"#808080",margin:"2px 4px",borderTop:"1px solid #fff"}}/>
                  ):(
                    <div key={i} onClick={()=>{row.action();setActiveMenu(null);}}
                      style={{display:"flex",alignItems:"center",padding:"3px 8px 3px 4px",cursor:row.dim?"default":"pointer",opacity:row.dim?0.4:1,gap:"6px",color:row.danger?"#dc2626":"#000"}}
                      onMouseEnter={e=>{if(!row.dim){e.currentTarget.style.background=row.danger?"#dc2626":"#000080";e.currentTarget.style.color="white";}}}
                      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=row.danger?"#dc2626":"#000";}}>
                      <span style={{fontSize:"11px",minWidth:"16px",textAlign:"center",color:row.danger?"#dc2626":"#000080",fontWeight:"900"}}>{row.icon}</span>
                      <span style={{flex:1,fontWeight:row.bold?"700":"400"}}>{row.label}</span>
                      {row.shortcut&&<span style={{marginLeft:"24px",fontSize:"11px",color:"#444",fontWeight:"700"}}>{row.shortcut}</span>}
                    </div>
                  ))}
                </div>

                {/* Footer buttons */}
                <div style={{padding:"4px 8px",borderTop:"1px solid #808080",display:"flex",gap:"4px",justifyContent:"flex-end"}}>
                  <button onClick={()=>{setActiveSection("home");setActiveMenu(null);}}
                    style={{background:"#d4d0c8",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",padding:"2px 10px",fontSize:"11px",cursor:"pointer",fontFamily:"Tahoma,sans-serif",fontWeight:"700"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#e8e8e8"}
                    onMouseLeave={e=>e.currentTarget.style.background="#d4d0c8"}>
                    📊 Dashboard
                  </button>
                  <button onClick={()=>handleLogout()}
                    style={{background:"#d4d0c8",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",padding:"2px 10px",fontSize:"11px",cursor:"pointer",fontFamily:"Tahoma,sans-serif",fontWeight:"700"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#e8e8e8"}
                    onMouseLeave={e=>e.currentTarget.style.background="#d4d0c8"}>
                    🚪 Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {[
            {id:"supervisor", label:"Supervisor", items:[
              {label:"User Master",           icon:"👤", action:()=>{setShowUserMaster(true);setActiveMenu(null);}},
              {label:"Group/User Rights",     icon:"🔐", action:()=>{}},
              {label:"Application Setup",     icon:"⚙️", action:()=>{}},
              {label:"Stationary Setting",    icon:"📄", action:()=>{}},
              {sep:true},
              {label:"Lock Bill",             icon:"🔒", action:()=>{}},
              {label:"Userwise Changes",      icon:"🔁", action:()=>{}},
              {label:"Data Utility",          icon:"🛠️", action:()=>{}},
              {label:"Bill Number Change",    icon:"🔢", action:()=>{}},
              {label:"Merge Facility",        icon:"🔀", action:()=>{}},
              {label:"Stock Rate Detail",     icon:"📊", action:()=>{setActiveSection("reports");setOwnerSubTab("");setReportSubTab("stock");}},
              {label:"Transfer Data",         icon:"📤", action:()=>{}},
              {label:"Transfer Other Data",   icon:"📥", action:()=>{}},
              {label:"Challan Problem",       icon:"⚠️", action:()=>{}},
              {label:"Change Bills",          icon:"✏️", action:()=>{}},
              {label:"Sales Bill Delete",     icon:"🗑️", action:()=>{setActiveSection("sales_pos");}},
              {label:"Purchase Delete",       icon:"🗑️", action:()=>{setActiveSection("purchase");}},
            ]},
            {id:"master", label:"Master", items:[
              {label:"Account Master",           icon:"📒", action:()=>{setActiveSection("masters");setOwnerSubTab("suppliers");}},
              {label:"Company Master",           icon:"🏢", action:()=>{setActiveSection("masters");}},
              {label:"Supplier Master",          icon:"🚚", action:()=>{setActiveSection("masters");setOwnerSubTab("suppliers");}},
              {label:"Drug Group Master",        icon:"💊", action:()=>{setActiveSection("inventory");}},
              {label:"Item Master",              icon:"📦", shortcut:"Ctrl+F1", action:()=>{setActiveSection("inventory");}},
              {label:"Kit Master",               icon:"🧰", action:()=>{}},
              {label:"Doctor Master",            icon:"🩺", action:()=>{setActiveSection("masters");setOwnerSubTab("doctors");}},
              {label:"Patient Master",           icon:"🧑‍⚕️", action:()=>{setActiveSection("masters");setOwnerSubTab("customers");}},
              {label:"Contract Employee Master", icon:"👔", action:()=>{}},
              {label:"Other Masters",            icon:"📋", action:()=>{setActiveSection("masters");}},
              {label:"Account Group",            icon:"📂", action:()=>{}},
              {label:"Generic Group Item List",  icon:"📃", action:()=>{}},
            ]},
            {id:"transaction", label:"Transaction", items:[
              {label:"Sales Bill", shortcut:"Ctrl+F2", action:()=>{setActiveSection("sales_pos");setTimeout(()=>openSalesForm(false),50);}},
              {label:"Purchase Bill", shortcut:"Ctrl+F3", action:()=>{setActiveSection("purchase");setTimeout(()=>openPurchaseForm(),50);}},
              {label:"Purchase Return", action:()=>{setActiveSection("purchase");}},
              {label:"Purchase Challan", shortcut:"Ctrl+F5", action:()=>{}},
              {label:"Purchase Chln to Bill", action:()=>{}},
              {sep:true},
              {label:"Tax", action:()=>{}},
              {label:"Sale Transfer", action:()=>{}},
              {sep:true},
              {label:"Stock Entry Itemwise", shortcut:"Ctrl+F7", action:()=>{setActiveSection("inventory");}},
              {label:"Stock Adjust", shortcut:"Ctrl+F8", action:()=>{}},
              {sep:true},
              {label:"Order Processing", action:()=>{setActiveSection("home");}},
              {label:"Purchase Order", action:()=>{}},
              {label:"Expiry List", action:()=>{setActiveSection("reports");setReportSubTab("summary");}},
              {sep:true},
              {label:"Sales Receipt", action:()=>{setActiveSection("payments");setTimeout(()=>openPaymentForm("receipt"),50);}},
              {label:"Purchase Payment", action:()=>{setActiveSection("payments");setTimeout(()=>openPaymentForm("payment"),50);}},
              {label:"Cash Entry", shortcut:"Ctrl+F11", action:()=>{setActiveSection("payments");setTimeout(()=>openPaymentForm("payment"),50);}},
              {label:"Bank Entry", shortcut:"Ctrl+F12", action:()=>{setActiveSection("bank");}},
              {label:"J V Entry", action:()=>{}},
            ]},
            {id:"mis", label:"MIS Reports", items:[
              {label:"Vat Forms", action:()=>{}},
              {label:"Sales Report", sub:[
                {label:"Sales Register", action:()=>{setActiveSection("reports");setReportSubTab("sales_reg");}},
                {label:"Sales Return Register", action:()=>{setActiveSection("reports");setReportSubTab("sales_reg");}},
                {label:"Sale Summary Itemwise", action:()=>{setActiveSection("reports");setReportSubTab("item_wise");}},
                {label:"Sales Receipt Register", action:()=>{setActiveSection("payments");}},
                {label:"Sales Summary Datewise", action:()=>{setActiveSection("reports");setReportSubTab("daily");}},
                {label:"Sales Summary Date - Bill Wise", action:()=>{setActiveSection("reports");setReportSubTab("daily");}},
                {label:"Sale Summary Salesmanwise", action:()=>{}},
                {label:"Sale Summary Cr-Dr Cardwise", action:()=>{}},
                {label:"Sales Register Detail", action:()=>{setActiveSection("reports");setReportSubTab("sales_reg");}},
                {label:"Sales Summary", action:()=>{setActiveSection("reports");setReportSubTab("summary");}},
              ]},
              {label:"Purchase Report", sub:[
                {label:"Purchase Register", action:()=>{setActiveSection("reports");setReportSubTab("purchase_reg");}},
                {label:"Purchase Return Register", action:()=>{}},
                {label:"Purchase Summary Item wise", action:()=>{setActiveSection("reports");setReportSubTab("item_wise");}},
                {label:"Purchse Summery ItemI Wise", action:()=>{}},
                {label:"Purchase Payment Register", action:()=>{setActiveSection("payments");}},
                {label:"Purchase Summary Datewise", action:()=>{setActiveSection("reports");setReportSubTab("daily");}},
                {label:"Purchase Summary Salesmanwise", action:()=>{}},
                {label:"Purchase Register Detail", action:()=>{setActiveSection("reports");setReportSubTab("purchase_reg");}},
              ]},
              {label:"Item Report", sub:[
                {label:"Item Wise Sale", action:()=>{setActiveSection("reports");setReportSubTab("item_wise");}},
                {label:"Item Wise Purchase", action:()=>{setActiveSection("reports");setReportSubTab("purchase_reg");}},
                {label:"Item Ledger", shortcut:"Shift+F1", action:()=>{}},
                {label:"Schedule Durg Sale", action:()=>{}},
                {label:"Non Moving Item", action:()=>{}},
                {label:"Rate Difference", action:()=>{}},
                {label:"Item Scheme Report", action:()=>{}},
                {label:"Itemwise Scheme Report", action:()=>{}},
                {label:"Customer Sale-Purchase", action:()=>{}},
              ]},
              {label:"Item wise Report", sub:[
                {label:"Item wise Sales", action:()=>{setActiveSection("reports");setReportSubTab("item_wise");}},
                {label:"Item wise Purchase", action:()=>{setActiveSection("reports");setReportSubTab("purchase_reg");}},
                {label:"Item wise Stock", action:()=>{setActiveSection("reports");setReportSubTab("stock");}},
                {label:"Item wise Stock 2", action:()=>{setActiveSection("reports");setReportSubTab("stock");}},
              ]},
              {label:"Stock Report", sub:[
                {label:"Stock Report", action:()=>{setActiveSection("reports");setReportSubTab("stock");}},
                {label:"Current Stock Batchwise", shortcut:"Shift+F5", action:()=>{setActiveSection("inventory");}},
                {label:"Year Opening Stock", action:()=>{}},
                {label:"New Stock Adjust", action:()=>{}},
                {label:"Stock Difference", action:()=>{}},
                {label:"Stock Adjustment", action:()=>{}},
                {label:"Stock Adjustment - 2", action:()=>{}},
              ]},
              {label:"Company Report", sub:[
                {label:"Companywise Sale", action:()=>{setActiveSection("reports");setReportSubTab("item_wise");}},
                {label:"Companywise Purchase", action:()=>{setActiveSection("reports");setReportSubTab("purchase_reg");}},
                {label:"Companywise Total Sale", action:()=>{}},
                {label:"Companywise Total Purchase", action:()=>{}},
                {label:"Company-Customer Sale", action:()=>{}},
                {label:"Company-Supplierwise Purchase", action:()=>{}},
                {label:"Company-Supplier Purchase", action:()=>{}},
              ]},
              {label:"Supplier Reports", sub:[
                {label:"Supplierwise Purchase", action:()=>{setActiveSection("masters");setOwnerSubTab("suppliers");}},
                {label:"Supplier Purchase", action:()=>{setActiveSection("masters");setOwnerSubTab("suppliers");}},
                {label:"Monthly Sale-Purchase", action:()=>{setActiveSection("reports");setReportSubTab("daily");}},
              ]},
              {label:"Doctor Reports", sub:[
                {label:"Doctor Smuuary", action:()=>{setActiveSection("reports");setReportSubTab("doctor_wise");}},
                {label:"Doctor Bill Summary", action:()=>{setActiveSection("reports");setReportSubTab("doctor_wise");}},
                {label:"Doctor Datewise Summary", action:()=>{setActiveSection("reports");setReportSubTab("daily");}},
                {label:"Bill Summary Doctorwise", action:()=>{setActiveSection("reports");setReportSubTab("doctor_wise");}},
                {label:"Doctorwise Itemwise Sale", action:()=>{setActiveSection("reports");setReportSubTab("doctor_wise");}},
                {label:"Doctor-Item Summary", action:()=>{}},
                {label:"Doctor - Item Report", action:()=>{}},
                {label:"Doctorwise Total Item Sale", action:()=>{}},
                {label:"Doctorwise Companywise Sale", action:()=>{}},
              ]},
              {label:"Graphical Reports", sub:[
                {label:"Daily Sale Graph", action:()=>{setActiveSection("reports");setReportSubTab("daily");}},
                {label:"Monthly Sale Graph", action:()=>{setActiveSection("reports");setReportSubTab("daily");}},
                {label:"Daily Purchase Graph", action:()=>{setActiveSection("reports");setReportSubTab("daily");}},
                {label:"Monthly Purchase Graph", action:()=>{setActiveSection("reports");setReportSubTab("daily");}},
                {label:"Monthly Sale/Purchase", action:()=>{setActiveSection("reports");setReportSubTab("daily");}},
              ]},
              {label:"Userwise Reports", sub:[
                {label:"User Sales Register", action:()=>{setActiveSection("reports");setReportSubTab("sales_reg");}},
                {label:"User Purchase Register", action:()=>{setActiveSection("reports");setReportSubTab("purchase_reg");}},
                {label:"Stock Adjust Register", action:()=>{}},
                {label:"User Cash Entry", action:()=>{setActiveSection("payments");}},
                {label:"User Bank Entry", action:()=>{setActiveSection("bank");}},
              ]},
              {sep:true},
              {label:"Daily Register", action:()=>{setActiveSection("reports");setReportSubTab("daily");}},
              {label:"Daily Report", action:()=>{setActiveSection("reports");setReportSubTab("daily");}},
              {label:"Daily Summary", action:()=>{setActiveSection("reports");setReportSubTab("daily");}},
              {label:"Sales-Purchase Summary", action:()=>{setActiveSection("reports");setReportSubTab("summary");}},
              {label:"Sale - Purchase Detail", action:()=>{setActiveSection("reports");}},
              {label:"Margin Report", action:()=>{setActiveSection("reports");setReportSubTab("summary");}},
            ]},
            {id:"financial", label:"Financial Reports", items:[
              {label:"Cash Reports", icon:"💵", sub:[
                {label:"Cash Book",        shortcut:"Shift+F11", action:()=>{setActiveSection("reports");}},
                {label:"Detail Cash Book",                       action:()=>{setActiveSection("reports");}},
                {label:"Cash Flow",                              action:()=>{setActiveSection("reports");}},
              ]},
              {label:"Bank Reports", icon:"🏦", sub:[
                {label:"Bank Book",        shortcut:"Shift+F12", action:()=>{setActiveSection("bank");}},
                {label:"Detail Bank Book",                       action:()=>{setActiveSection("bank");}},
                {label:"Bank Flow",                              action:()=>{setActiveSection("bank");}},
              ]},
              {label:"Customer Report", icon:"👥", sub:[
                {label:"Customer Ledger",              shortcut:"Shift+F8", action:()=>{setActiveSection("reports");}},
                {label:"Customer Status",                                   action:()=>{setActiveSection("reports");}},
                {label:"All Customer Status",                               action:()=>{setActiveSection("reports");}},
                {label:"Customer Cash Bank Detail",                         action:()=>{setActiveSection("reports");}},
                {label:"Customer Pending Detail",                           action:()=>{setActiveSection("reports");}},
                {label:"Customerwise Pending List",   shortcut:"Shift+F7", action:()=>{setActiveSection("reports");}},
                {label:"All Customer Credit Limit List",                    action:()=>{setActiveSection("reports");}},
                {label:"Customerwise Credit Limit List",                    action:()=>{setActiveSection("reports");}},
                {label:"Customerwise Sale",                                 action:()=>{setActiveSection("reports");}},
                {label:"Customer Message and SMS",                          action:()=>{setActiveSection("reports");}},
                {label:"Areawise Pending List",                             action:()=>{setActiveSection("reports");}},
              ]},
              {label:"JVBook",         icon:"📓", action:()=>{setActiveSection("reports");}},
              {label:"Contract Report",icon:"📝", sub:[
                {label:"PRL Report",      action:()=>{setActiveSection("reports");}},
                {label:"PRL Item Report", action:()=>{setActiveSection("reports");}},
              ]},
              {label:"Bank Reconciliation",           icon:"🔁", action:()=>{setActiveSection("bank");}},
              {label:"Depreciation Report",           icon:"📉", action:()=>{setActiveSection("reports");}},
              {label:"Group Outstanding",             icon:"📋", shortcut:"Shift+Ctrl+F1", action:()=>{setActiveSection("reports");}},
              {label:"Account Groupwise Statement",   icon:"📊", shortcut:"Shift+Ctrl+F2", action:()=>{setActiveSection("reports");}},
              {label:"Account Groupwise Opening-Closing", icon:"📂", action:()=>{setActiveSection("reports");}},
              {label:"Trial Balance",                 icon:"⚖️", shortcut:"Shift+Ctrl+F3", action:()=>{setActiveSection("reports");}},
              {label:"Trading Account",               icon:"💹", shortcut:"Shift+Ctrl+F7", action:()=>{setActiveSection("reports");}},
              {label:"Profit And Loss Account",       icon:"💰", shortcut:"Shift+Ctrl+F8", action:()=>{setActiveSection("reports");}},
              {label:"Balance Sheet",                 icon:"🧾", shortcut:"Shift+Ctrl+F9", action:()=>{setActiveSection("reports");}},
            ]},
            {id:"other", label:"Other Facilities", items:[
              {label:"Interest Calculation", icon:"📐", action:()=>{}},
              {label:"Directory",            icon:"📁", action:()=>{}},
              {label:"Reminder Datewise",    icon:"📅", action:()=>{}},
              {label:"Reminder Detail",      icon:"🔔", action:()=>{}},
              {label:"Daily Message",        icon:"💬", action:()=>{}},
              {label:"Reprocess of Data",    icon:"🔄", action:()=>{}},
              {label:"Upgrading Software",   icon:"⬆️", action:()=>{}},
              {label:"New Item master",      icon:"📦", shortcut:"Ctrl+N", action:()=>{setActiveSection("inventory");}},
              {label:"Backup",               icon:"💾", action:()=>handleExportData()},
              {label:"Year Closing",         icon:"📆", action:()=>{}},
            ]},
            {id:"window", label:"Window", items:[
              {label:"Cascade Windows",          icon:"🪟", action:()=>{}},
              {label:"Tile Windows Horizontally",icon:"⬛", action:()=>{}},
              {label:"Tile Windows Vertically",  icon:"⬜", action:()=>{}},
              {sep:true},
              {label:"1",                        icon:"1️⃣", action:()=>{}},
              {label:"2 Sales Bill",             icon:"🧾", action:()=>{setActiveSection("sales_pos");}},
              {label:"3 Purchase Bill",          icon:"🛒", action:()=>{setActiveSection("purchase");}},
            ]},
            {id:"exit", label:"Exit", items:[
              {label:"Close",                    icon:"❌", action:()=>handleLogout()},
              {label:"Close with Backup",        icon:"💾", action:()=>{handleExportData();handleLogout();}},
              {label:"Login as Different User",  icon:"👤", action:()=>handleLogout()},
              {label:"Year Change",              icon:"📅", action:()=>{}},
              {label:"Update Data from Last Year",icon:"🔃", action:()=>{}},
              {sep:true},
              {label:"Delete Account",           icon:"🗑️", action:()=>handleDeleteOwnerAccount(), danger:true},
            ]},
          ].map(menu=>{
            const menuBtnRef = {current:null};
            return (
            <div key={menu.id} style={{position:"relative"}}>
              <button
                ref={el=>{ menuBtnRef.current=el; }}
                onClick={(e)=>{
                  if(activeMenu===menu.id){ setActiveMenu(null); }
                  else {
                    const r=e.currentTarget.getBoundingClientRect();
                    setMenuDropPos({top:r.bottom,left:r.left});
                    setActiveMenu(menu.id);
                  }
                }}
                onMouseEnter={(e)=>{
                  if(activeMenu&&activeMenu!==menu.id){
                    const r=e.currentTarget.getBoundingClientRect();
                    setMenuDropPos({top:r.bottom,left:r.left});
                    setActiveMenu(menu.id);
                  }
                }}
                style={{padding:"3px 10px",border:"none",background:activeMenu===menu.id?"#000080":"transparent",color:activeMenu===menu.id?"white":"#000000",cursor:"pointer",fontSize:"13px",fontWeight:"normal",whiteSpace:"nowrap",height:"24px",display:"flex",alignItems:"center",fontFamily:"'Segoe UI',system-ui,sans-serif"}}
              >
                {menu.label}
              </button>
              {activeMenu===menu.id&&(
                <div style={{position:"fixed",top:menuDropPos.top,left:menuDropPos.left,background:"#c0c0c0",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",boxShadow:"2px 2px 0 #000",minWidth:menu.iconPanel?"260px":"220px",zIndex:9999}}>
                  {menu.iconPanel?(
                    /* ── SUPERVISOR: small icon grid layout ── */
                    <div>
                      <div style={{background:"#000080",color:"white",padding:"2px 8px",fontSize:"11px",fontWeight:"700",fontFamily:"Tahoma,sans-serif"}}>Supervisor</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"4px",padding:"6px"}}>
                        {menu.items.filter(i=>!i.sep).map((item,idx)=>(
                          <button key={idx} onClick={()=>{item.action();setActiveMenu(null);}}
                            style={{background:"#d4d0c8",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",padding:"6px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",fontFamily:"Tahoma,sans-serif"}}
                            onMouseEnter={e=>{e.currentTarget.style.background="#000080";e.currentTarget.style.color="white";e.currentTarget.style.borderColor="#808080 #ffffff #ffffff #808080";}}
                            onMouseLeave={e=>{e.currentTarget.style.background="#d4d0c8";e.currentTarget.style.color="#000";e.currentTarget.style.borderColor="#ffffff #808080 #808080 #ffffff";}}>
                            <span style={{fontSize:"18px"}}>{item.icon}</span>
                            <span style={{fontSize:"9px",fontWeight:"700",whiteSpace:"nowrap",textAlign:"center"}}>{item.label}</span>
                            {item.shortcut&&<span style={{fontSize:"8px",color:"#800000",fontWeight:"700"}}>{item.shortcut}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ):(
                    /* ── NORMAL: list layout with icons ── */
                    menu.items.map((item,idx)=>item.sep?(
                      <div key={idx} style={{height:"1px",background:"#808080",margin:"2px 0",borderTop:"1px solid #ffffff"}}/>
                    ):item.sub?(
                      <div key={idx} style={{position:"relative"}} onMouseEnter={e=>{const el=e.currentTarget.querySelector('.submenu');if(el)el.style.display='block';}} onMouseLeave={e=>{const el=e.currentTarget.querySelector('.submenu');if(el)el.style.display='none';}}>
                        <div
                          onMouseEnter={e=>{e.currentTarget.style.background="#000080";e.currentTarget.style.color="white";}}
                          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#000";}}
                          style={{padding:"3px 20px 3px 8px",fontSize:"13px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",whiteSpace:"nowrap",color:"#000",gap:"6px"}}>
                          {item.icon&&<span style={{fontSize:"13px",minWidth:"16px"}}>{item.icon}</span>}
                          <span style={{flex:1}}>{item.label}</span>
                          <span style={{marginLeft:"16px"}}>▶</span>
                        </div>
                        <div className="submenu" style={{display:"none",position:"absolute",top:0,left:"100%",background:"#c0c0c0",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",boxShadow:"2px 2px 0 #000",minWidth:"200px",zIndex:9999}}>
                          {item.sub.map((si,si_idx)=>(
                            <div key={si_idx} onClick={()=>{si.action();setActiveMenu(null);}} style={{padding:"3px 20px 3px 8px",fontSize:"13px",cursor:"pointer",whiteSpace:"nowrap",color:"#000",display:"flex",alignItems:"center",gap:"6px"}}
                              onMouseEnter={e=>{e.currentTarget.style.background="#000080";e.currentTarget.style.color="white";}}
                              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#000";}}>
                              {si.icon&&<span style={{fontSize:"12px",minWidth:"16px"}}>{si.icon}</span>}
                              <span>{si.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ):(
                      <div key={idx} onClick={()=>{item.action();setActiveMenu(null);}} style={{padding:"3px 20px 3px 8px",fontSize:"13px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",whiteSpace:"nowrap",color:item.danger?"#dc2626":"#000",gap:"6px"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=item.danger?"#dc2626":"#000080";e.currentTarget.style.color="white";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=item.danger?"#dc2626":"#000";}}>
                        <span style={{display:"flex",alignItems:"center",gap:"6px"}}>
                          {item.icon&&<span style={{fontSize:"13px",minWidth:"16px"}}>{item.icon}</span>}
                          <span>{item.label}</span>
                        </span>
                        {item.shortcut&&<span style={{marginLeft:"24px",color:"#555",fontSize:"11px"}}>{item.shortcut}</span>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            );
          })}
          {/* Close dropdown on outside click */}
          {activeMenu&&<div style={{position:"fixed",inset:0,zIndex:9998}} onClick={()=>setActiveMenu(null)}/>}
        </div>


        </>
      )}

      {/* ─── CUSTOMER BOTTOM NAV ─── */}
      {!isOwner&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#1a3a5c",borderTop:"2px solid #0d6efd",display:"flex",zIndex:100,boxShadow:"0 -2px 12px rgba(0,0,0,0.2)"}}>
          {[{id:"home",icon:"🏪",label:"Store"},{id:"shop",icon:"🛍️",label:"Shop"},{id:"orders",icon:"📦",label:"Orders"},{id:"membership",icon:"⭐",label:"Plans"},{id:"profile",icon:"👤",label:"Profile"}].map(t=>(
            <button key={t.id} onClick={()=>setActiveCustomerTab(t.id)} style={{flex:1,padding:"10px 4px 8px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px"}}>
              <span style={{fontSize:"20px"}}>{t.icon}</span>
              <span style={{fontSize:"10px",fontWeight:"700",color:activeCustomerTab===t.id?"#5bc8f5":"#8899aa"}}>{t.label}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{flex:1,overflowY:"auto",padding:"14px 16px",maxWidth:"1280px",width:"100%",margin:"0 auto",paddingBottom:isOwner?"16px":"80px",boxSizing:"border-box"}}>

        {/* ══════════ CUSTOMER CART SIDEBAR ══════════ */}
        {showCart&&!isOwner&&(
          <div style={{position:"fixed",top:0,right:0,width:"310px",height:"100vh",background:"white",boxShadow:"-2px 0 20px rgba(0,0,0,0.2)",zIndex:200,display:"flex",flexDirection:"column"}}>
            <div style={{padding:"14px 16px",borderBottom:"1px solid #dee2e6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h3 style={{margin:0,fontSize:"15px",fontWeight:"700"}}>🛒 Cart ({cart.length})</h3>
              <button onClick={()=>setShowCart(false)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={18}/></button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"10px"}}>
              {cart.length===0?<p style={{textAlign:"center",color:"#94a3b8",marginTop:"40px"}}>Cart is empty</p>:cart.map(item=>{
                const dv=getDivision(item.division);
                return (<div key={item.id} style={{padding:"10px",border:"1px solid #dee2e6",borderRadius:"8px",marginBottom:"8px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                    <div><span>{dv.icon}</span>{" "}<span style={{fontWeight:"600",fontSize:"13px"}}>{item.name}</span></div>
                    <button onClick={()=>removeFromCart(item.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444"}}><X size={13}/></button>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <button onClick={()=>updateCartQty(item.id,item.quantity-1)} style={{width:"25px",height:"25px",borderRadius:"5px",border:"1px solid #dee2e6",background:"white",cursor:"pointer",fontWeight:"700"}}>-</button>
                    <span style={{fontWeight:"700",minWidth:"20px",textAlign:"center"}}>{item.quantity}</span>
                    <button onClick={()=>updateCartQty(item.id,item.quantity+1)} style={{width:"25px",height:"25px",borderRadius:"5px",border:"1px solid #dee2e6",background:"white",cursor:"pointer",fontWeight:"700"}}>+</button>
                    <span style={{marginLeft:"auto",fontWeight:"700",color:"#3b82f6",fontSize:"13px"}}>₹{fmt((num(item.price)*(1+num(item.gst)/100))*item.quantity)}</span>
                  </div>
                </div>);
              })}
            </div>
            {cart.length>0&&(<div style={{padding:"12px",borderTop:"1px solid #e2e8f0"}}>
              <div style={{fontWeight:"800",fontSize:"15px",marginBottom:"10px"}}>Total: ₹{fmt(calcTotal(cart))}</div>
              <button onClick={placeOrder} style={{...btn("#198754"),width:"100%",justifyContent:"center",padding:"10px"}}>📋 Confirm & Place Order</button>
            </div>)}
          </div>
        )}



        {/* ══════════════════════════════════════════
            OWNER: DASHBOARD
        ══════════════════════════════════════════ */}
        {isOwner&&activeSection==="home"&&(
          <>
            <h2 style={{margin:"0 0 14px",fontSize:"16px",fontWeight:"700",color:"#1a3a5c",borderBottom:"2px solid #0d6efd",paddingBottom:"8px"}}>📊 Dashboard</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"12px",marginBottom:"20px"}}>
              {[
                {label:"Total Items",    val:items.length,              color:"#3b82f6",bg:"#eff6ff"},
                {label:"Sales Bills",    val:salesBills.filter(b=>!b.isReturn).length, color:"#16a34a",bg:"#f0fdf4"},
                {label:"Purchase Bills", val:purchaseBills.length,      color:"#8b5cf6",bg:"#f5f3ff"},
                {label:"Online Orders",  val:custOrders.length,         color:"#f59e0b",bg:"#fffbeb"},
                {label:"Low Stock",      val:lowStockCount,             color:"#fd7e14",bg:"#fff7ed"},
                {label:"Expiry Alerts",  val:expiredCount+expiringSoonCount, color:"#ef4444",bg:"#fef2f2"},
                {label:"Suppliers",      val:suppliers.length,          color:"#0891b2",bg:"#ecfeff"},
                {label:"Revenue (All)",  val:"₹"+fmt(salesBills.filter(b=>!b.isReturn).reduce((s,b)=>s+num(b.netAmount),0),0), color:"#16a34a",bg:"#f0fdf4"},
              ].map(s=>(
                <div key={s.label} style={{background:s.bg,borderRadius:"5px",padding:"13px 14px",border:`1px solid ${s.color}22`}}>
                  <div style={{fontSize:"20px",fontWeight:"700",color:s.color}}>{s.val}</div>
                  <div style={{fontSize:"11px",color:"#64748b"}}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Quick Actions */}
            <div style={{background:"white",borderRadius:"6px",padding:"18px",border:"1px solid #dee2e6",marginBottom:"18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                <h3 style={{margin:0,fontSize:"13px",fontWeight:"700",color:"#1a3a5c",textTransform:"uppercase",letterSpacing:"0.5px"}}>Quick Actions</h3>
                <div style={{display:"flex",gap:"8px"}}>
                  <button onClick={handleExportData} style={{background:"#f59e0b",color:"#1c1917",border:"none",borderRadius:"5px",padding:"6px 12px",cursor:"pointer",fontWeight:"700",fontSize:"12px"}}>⬇️ Backup</button>
                  <label style={{background:"#16a34a",color:"white",border:"none",borderRadius:"5px",padding:"6px 12px",cursor:"pointer",fontWeight:"700",fontSize:"12px"}}>
                    ⬆️ Restore
                    <input type="file" accept=".json" onChange={handleImportData} style={{display:"none"}}/>
                  </label>
                </div>
              </div>
              <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                {[
                  {label:"New Sales Bill",  action:()=>openSalesForm(false), color:"#16a34a"},
                  {label:"New Purchase",    action:()=>openPurchaseForm(),   color:"#3b82f6"},
                  {label:"Add Item",        action:()=>openItemForm("medicines"), color:"#8b5cf6"},
                  {label:"Payment Entry",   action:()=>openPaymentForm(),    color:"#f59e0b"},
                  {label:"Sales Return",    action:()=>openSalesForm(true),  color:"#ef4444"},
                ].map(a=>(
                  <button key={a.label} onClick={a.action} style={{...btn(a.color),fontSize:"12px",padding:"8px 14px"}}>{a.label}</button>
                ))}
              </div>
            </div>
            {/* Online Orders - All */}
            {custOrders.length>0&&(
              <div style={{background:"white",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"16px",marginTop:"8px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
                  <h3 style={{margin:0,fontSize:"14px",fontWeight:"700",color:"#1a3a5c"}}>📦 Online Orders ({custOrders.length})</h3>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                    {["All","Pending","Ready","Delivered","Cancelled"].map(s=>(
                      <button key={s} onClick={()=>setOrderFilter(s)} style={{fontSize:"11px",padding:"4px 10px",borderRadius:"20px",border:"none",cursor:"pointer",fontWeight:"600",background:orderFilter===s?"#1a3a5c":"#f1f5f9",color:orderFilter===s?"white":"#475569"}}>{s}</button>
                    ))}
                  </div>
                </div>
                {[...custOrders].reverse().filter(o=>orderFilter==="All"||o.status===orderFilter).map(o=>{
                  const ss=STATUS_STYLE[o.status]||STATUS_STYLE.Pending;
                  const [expanded,setExpanded]=[expandedOwnerOrder===o.id,id=>setExpandedOwnerOrder(expandedOwnerOrder===id?null:id)];
                  return(
                    <div key={o.id} style={{border:"1px solid #e2e8f0",borderRadius:"8px",marginBottom:"8px",overflow:"hidden"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",cursor:"pointer",background:"#fafafa"}} onClick={()=>setExpanded(o.id)}>
                        <div>
                          <div style={{fontWeight:"700",fontSize:"13px"}}>{o.customer?.name||"—"} <span style={{color:"#64748b",fontWeight:"400"}}>· {o.customer?.phone||"—"}</span>
                          {o.paymentMode&&<span style={{background:o.paymentMode==="upi"?"#dbeafe":"#f0fdf4",color:o.paymentMode==="upi"?"#1d4ed8":"#16a34a",fontSize:"10px",padding:"1px 6px",borderRadius:"10px",fontWeight:"700",marginLeft:"6px"}}>{o.paymentMode.toUpperCase()}{o.transactionId?" #"+o.transactionId:""}</span>}</div>
                          <div style={{fontSize:"11px",color:"#64748b",marginTop:"2px"}}>{o.items.length} items · {new Date(o.date).toLocaleString("en-IN")}</div>
                          {o.customer?.address&&<div style={{fontSize:"11px",color:"#475569",marginTop:"2px"}}>📍 {o.customer.address}</div>}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontWeight:"800",fontSize:"14px"}}>₹{fmt(o.total)}</div>
                            <span style={{background:ss.bg,color:ss.color,padding:"2px 8px",borderRadius:"5px",fontSize:"10px",fontWeight:"700"}}>{o.status}</span>
                          </div>
                          {expanded?<ChevronUp size={14} color="#64748b"/>:<ChevronDown size={14} color="#64748b"/>}
                        </div>
                      </div>
                      {expanded&&(
                        <div style={{borderTop:"1px solid #f1f5f9",padding:"10px 12px",background:"white"}}>
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px",marginBottom:"10px"}}>
                            <thead><tr style={{background:"#f8fafc"}}><th style={{padding:"5px 8px",textAlign:"left",color:"#64748b"}}>Item</th><th style={{padding:"5px 8px",textAlign:"right",color:"#64748b"}}>Qty</th><th style={{padding:"5px 8px",textAlign:"right",color:"#64748b"}}>Amount</th></tr></thead>
                            <tbody>
                              {o.items.map(item=>(
                                <tr key={item.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                                  <td style={{padding:"5px 8px"}}>{getDivision(item.division).icon} {item.name}</td>
                                  <td style={{padding:"5px 8px",textAlign:"right"}}>×{item.quantity}</td>
                                  <td style={{padding:"5px 8px",textAlign:"right",fontWeight:"700",color:"#3b82f6"}}>₹{fmt(num(item.price)*item.quantity)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{fontWeight:"800",color:"#16a34a"}}>Total: ₹{fmt(o.total)}</div>
                            <div style={{display:"flex",gap:"6px"}}>
                              {o.status==="Pending"&&<button onClick={()=>updateOrderStatus(o.id,"Ready")} style={{...btn("#fd7e14"),fontSize:"11px",padding:"5px 10px"}}>✅ Ready</button>}
                              {(o.status==="Pending"||o.status==="Ready")&&<button onClick={()=>updateOrderStatus(o.id,"Delivered")} style={{...btn("#198754"),fontSize:"11px",padding:"5px 10px"}}>🚀 Delivered</button>}
                              {o.status!=="Cancelled"&&o.status!=="Delivered"&&<button onClick={()=>showConfirm("Cancel this order?",()=>{updateOrderStatus(o.id,"Cancelled");})} style={{...btn("#ef4444"),fontSize:"11px",padding:"5px 10px"}}>Cancel</button>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {custOrders.filter(o=>orderFilter==="All"||o.status===orderFilter).length===0&&(
                  <div style={{textAlign:"center",padding:"20px",color:"#94a3b8",fontSize:"13px"}}>No orders found</div>
                )}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════
            OWNER: INVENTORY
        ══════════════════════════════════════════ */}
        {isOwner&&activeSection==="inventory"&&(
          <>
            {!ownerSubTab&&(
              <>
                <h2 style={{margin:"0 0 14px",fontSize:"16px",fontWeight:"700",color:"#1a3a5c",borderBottom:"2px solid #0d6efd",paddingBottom:"8px"}}>📦 Inventory</h2>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:"12px"}}>
                  {DIVISIONS.map(div=>{
                    const count=items.filter(i=>i.division===div.id).length;
                    const inStock=items.filter(i=>i.division===div.id&&i.stock>0).length;
                    return(
                      <div key={div.id} onClick={()=>setOwnerSubTab(div.id)} style={{background:"white",borderRadius:"6px",padding:"18px",border:`2px solid ${div.border}`,cursor:"pointer",boxShadow:"0 2px 6px rgba(0,0,0,0.05)"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,0.1)";}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 6px rgba(0,0,0,0.05)";}}>
                        <div style={{fontSize:"34px",marginBottom:"8px"}}>{div.icon}</div>
                        <div style={{fontWeight:"800",fontSize:"14px",color:"#1e293b",marginBottom:"3px"}}>{div.label}</div>
                        <div style={{fontSize:"11px",color:"#94a3b8",marginBottom:"10px"}}>{div.desc}</div>
                        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                          <span style={{background:div.bg,color:div.color,padding:"2px 8px",borderRadius:"5px",fontSize:"12px",fontWeight:"700"}}>{count} items</span>
                          {count>0&&<span style={{background:"#f0fdf4",color:"#16a34a",padding:"2px 8px",borderRadius:"5px",fontSize:"12px",fontWeight:"600"}}>{inStock} in stock</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {ownerSubTab&&DIVISIONS.find(d=>d.id===ownerSubTab)&&(()=>{
              const div=getDivision(ownerSubTab);
              return(
                <>
                  <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"14px",flexWrap:"wrap"}}>
                    <button onClick={()=>setOwnerSubTab("")} style={{...btn("#e9ecef","#495057"),fontSize:"12px",padding:"6px 12px"}}>← Back</button>
                    <span style={{fontSize:"24px"}}>{div.icon}</span>
                    <div><h2 style={{margin:0,fontSize:"17px",fontWeight:"800"}}>{div.label}</h2><p style={{margin:0,fontSize:"11px",color:"#94a3b8"}}>{div.desc}</p></div>
                    <button onClick={()=>openItemForm(ownerSubTab)} style={{...btn(div.color),marginLeft:"auto",fontSize:"12px"}}><Plus size={13}/>Add Item</button>
                  </div>
                  {/* Search */}
                  <div style={{background:"white",borderRadius:"5px",padding:"10px 12px",marginBottom:"12px",border:"1px solid #dee2e6",display:"flex",gap:"10px",flexWrap:"wrap"}}>
                    <div style={{flex:1,minWidth:"160px",position:"relative"}}>
                      <Search size={12} style={{position:"absolute",left:"9px",top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
                      <input value={itemSearch} onChange={e=>setItemSearch(e.target.value)} placeholder="Search..." style={{...inp,paddingLeft:"28px",padding:"8px 8px 8px 28px"}}/>
                    </div>
                    <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...inp,width:"auto"}}>
                      <option value="name">Name A-Z</option>
                      <option value="price_asc">Price ↑</option>
                      <option value="price_desc">Price ↓</option>
                    </select>
                    <label style={{display:"flex",alignItems:"center",gap:"5px",fontSize:"12px",fontWeight:"600",color:"#475569",cursor:"pointer"}}>
                      <input type="checkbox" checked={filterStock} onChange={e=>setFilterStock(e.target.checked)}/> In Stock Only
                    </label>
                  </div>
                  {/* Item Form */}
                  {showItemForm&&(
                    <div style={{background:"white",borderRadius:"6px",padding:"18px",marginBottom:"14px",border:`2px solid ${div.border}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
                        <h3 style={{margin:0,fontSize:"13px",fontWeight:"700",color:"#1a3a5c"}}>{editingItem?"Edit":"Add"} {div.label} {div.icon}</h3>
                        <button onClick={()=>{setShowItemForm(false);setEditingItem(null);}} style={{background:"none",border:"none",cursor:"pointer"}}><X size={18}/></button>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"10px",marginBottom:"12px"}}>
                        {[
                          {k:"name",l:"Item Name *",t:"text"},{k:"company",l:"Company",t:"text"},{k:"drugGroup",l:"Drug Group",t:"text"},
                          {k:"pRate",l:"Purchase Rate (PTR)",t:"number"},{k:"mrp",l:"MRP",t:"number"},
                          {k:"cess",l:"Cess %",t:"number"},{k:"discount",l:"Discount %",t:"number"},
                          {k:"stock",l:"Stock",t:"number"},{k:"unit",l:"Unit",t:"text"},{k:"pack",l:"Pack Size",t:"text"},
                          {k:"minimum",l:"Min Stock Alert",t:"number"},
                          {k:"expiryDate",l:"Expiry Date (MM/YY)",t:"text"},
                          {k:"hsn",l:"HSN Code",t:"text"},
                          {k:"barcode",l:"Barcode",t:"text"},{k:"supplier",l:"Supplier",t:"text"},
                          {k:"location",l:"Location",t:"text"},{k:"itemCategory",l:"Item Category",t:"text"},
                          {k:"gst",l:"GST %",t:"number"},
                        ].map(f=>(
                          <div key={f.k}><label style={lbl}>{f.l}</label><input type={f.t} value={itemForm[f.k]||""} onChange={e=>{let v=e.target.value;if(f.k==="expiryDate"){v=v.replace(/[^0-9/]/g,"");if(v.length===2&&!v.includes("/")&&(itemForm[f.k]||"").length!==3) v=v+"/";if(v.length>5) return;setItemForm({...itemForm,[f.k]:v});return;}setItemForm({...itemForm,[f.k]:f.t==="text"?v.toUpperCase():v});}} style={{...inp,textTransform:f.k==="expiryDate"?"none":f.t==="text"?"uppercase":"none"}}/></div>
                        ))}
                        <div><label style={lbl}>Tax Type</label><select value={itemForm.taxType||"taxable"} onChange={e=>setItemForm({...itemForm,taxType:e.target.value})} style={inp}><option value="taxable">Taxable</option><option value="exempt">Exempt</option></select></div>
                        <div style={{display:"flex",flexDirection:"column",gap:"6px",justifyContent:"center"}}>
                          <label style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"12px",cursor:"pointer"}}><input type="checkbox" checked={!!itemForm.scheduleH} onChange={e=>setItemForm({...itemForm,scheduleH:e.target.checked})}/><span style={{fontWeight:"600"}}>Schedule H Drug</span></label>
                          <label style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"12px",cursor:"pointer"}}><input type="checkbox" checked={!!itemForm.rxRequired} onChange={e=>setItemForm({...itemForm,rxRequired:e.target.checked})}/><span style={{fontWeight:"600"}}>Rx Required</span></label>
                        </div>
                        <div style={{gridColumn:"1/-1"}}><label style={lbl}>Description</label><textarea value={itemForm.description||""} onChange={e=>setItemForm({...itemForm,description:e.target.value})} style={{...inp,height:"55px",resize:"vertical"}} placeholder="Notes..."/></div>
                      </div>
                      <div style={{display:"flex",gap:"8px"}}>
                        <button onClick={handleSaveItem} style={{...btn(div.color)}}><CheckCircle size={13}/>{editingItem?"Update":"Save"}</button>
                        <button onClick={()=>{setShowItemForm(false);setEditingItem(null);}} style={{...btn("#64748b")}}><X size={13}/>Cancel</button>
                      </div>
                    </div>
                  )}
                  {/* Items Grid */}
                  {filteredItems(ownerSubTab).length===0?(
                    <div style={{textAlign:"center",padding:"50px",color:"#94a3b8"}}><div style={{fontSize:"44px"}}>{div.icon}</div><p>No items found</p><button onClick={()=>openItemForm(ownerSubTab)} style={{...btn(div.color),margin:"12px auto 0"}}><Plus size={13}/>Add Item</button></div>
                  ):(
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:"10px"}}>
                      {filteredItems(ownerSubTab).map(item=>{
                        const exp=isExpired(item.expiryDate), expSoon=isExpiringSoon(item.expiryDate);
                        const batchCount=itemBatches(item.id).length;
                        return(
                          <div key={item.id} style={{background:"white",borderRadius:"5px",padding:"13px",border:`1px solid ${exp?"#fca5a5":expSoon?"#fdba74":div.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"7px"}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontWeight:"700",fontSize:"13px",color:"#1e293b",display:"flex",alignItems:"center",gap:"5px"}}>
                                  {item.name}
                                  {item.scheduleH&&<span style={{background:"#fef9c3",color:"#854d0e",fontSize:"9px",padding:"1px 4px",borderRadius:"4px",fontWeight:"700"}}>Sch.H</span>}
                                  {item.rxRequired&&<span style={{background:"#fce7f3",color:"#be185d",fontSize:"9px",padding:"1px 4px",borderRadius:"4px",fontWeight:"700"}}>Rx</span>}
                                </div>
                                {item.company&&<div style={{fontSize:"11px",color:"#94a3b8"}}>{item.company}</div>}
                              </div>
                              {(exp||expSoon)&&<AlertCircle size={14} color={exp?"#ef4444":"#fd7e14"}/>}
                            </div>
                            <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:"7px"}}>
                              {item.pRate>0&&<span style={{background:"#f1f5f9",color:"#475569",padding:"2px 6px",borderRadius:"5px",fontSize:"10px"}}>PTR ₹{item.pRate}</span>}
                              <span style={{background:div.bg,color:div.color,padding:"2px 7px",borderRadius:"5px",fontSize:"11px",fontWeight:"700"}}>₹{item.price}</span>
                              {item.mrp>0&&item.mrp>item.price&&<span style={{background:"#f1f5f9",color:"#94a3b8",padding:"2px 7px",borderRadius:"5px",fontSize:"11px",textDecoration:"line-through"}}>₹{item.mrp}</span>}
                              {item.gst>0&&<span style={{background:"#f0fdf4",color:"#16a34a",padding:"2px 6px",borderRadius:"5px",fontSize:"11px"}}>GST {item.gst}%</span>}
                              <span style={{background:item.stock<=0?"#fef2f2":"#f8fafc",color:item.stock<=0?"#ef4444":"#475569",padding:"2px 6px",borderRadius:"5px",fontSize:"11px"}}>{item.stock<=0?"Out":item.stock+" "+(item.unit||"pcs")}</span>
                              {batchCount>0&&<span style={{background:"#f0fdf4",color:"#16a34a",padding:"2px 6px",borderRadius:"5px",fontSize:"10px"}}>{batchCount} batches</span>}
                            </div>
                            {item.expiryDate&&<div style={{fontSize:"10px",color:exp?"#ef4444":expSoon?"#fd7e14":"#94a3b8",marginBottom:"7px"}}>📅 {item.expiryDate} {exp?"(Expired)":expSoon?"(Expiring Soon)":""}</div>}
                            <div style={{display:"flex",gap:"5px"}}>
                              <button onClick={()=>{setQuickStockItem(item);setQuickQty("");}} style={{...btn("#198754"),fontSize:"11px",padding:"5px 8px"}}>+📦</button>
                              <button onClick={()=>openItemForm(ownerSubTab,item)} style={{...btn(),fontSize:"11px",padding:"5px 8px"}}><Edit2 size={11}/></button>
                              <button onClick={()=>handleDeleteItem(item.id)} style={{...btn("#dc3545"),fontSize:"11px",padding:"5px 8px"}}><Trash2 size={11}/></button>
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
        {isOwner&&activeSection==="purchase"&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",flexWrap:"wrap",gap:"10px"}}>
              <h2 style={{margin:0,fontSize:"18px",fontWeight:"800"}}>🛒 Purchase Bills ({purchaseBills.length})</h2>
              <button onClick={openPurchaseForm} style={{...btn()}}><Plus size={14}/>New Purchase</button>
            </div>

            {/* Purchase Form */}
            {showPurchaseForm&&(
              <div style={{background:"white",borderRadius:"6px",padding:"20px",marginBottom:"16px",border:"2px solid #bfdbfe",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"16px"}}>
                  <h3 style={{margin:0,fontSize:"15px",fontWeight:"700"}}>🛒 New Purchase Entry</h3>
                  <button onClick={()=>setShowPurchaseForm(false)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={18}/></button>
                </div>
                {/* Header fields */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:"10px",marginBottom:"16px",background:"#1a3a5c",borderRadius:"8px",padding:"14px"}}>
                  <div>
                    <label style={{...lbl,color:"#cbd5e1"}}>Entry No</label>
                    <input value={purchaseForm.entryNo||""} readOnly style={{...inp,background:"#f0fdf4",color:"#16a34a",fontWeight:"700",cursor:"default"}}/>
                  </div>
                  <div>
                    <label style={{...lbl,color:"#cbd5e1"}}>Party Name *</label>
                    <input list="supp-list" value={purchaseForm.partyName||""} onChange={e=>{const s=suppliers.find(x=>x.name===e.target.value);setPurchaseForm({...purchaseForm,partyName:e.target.value,supplierId:s?.id||""});}} placeholder="Party / Supplier name" style={inp}/>
                    <datalist id="supp-list">{suppliers.map(s=><option key={s.id} value={s.name}/>)}</datalist>
                  </div>
                  <div><label style={{...lbl,color:"#cbd5e1"}}>Party Bill No</label><input value={purchaseForm.billNo||""} onChange={e=>setPurchaseForm({...purchaseForm,billNo:e.target.value})} placeholder="Bill No" style={inp}/></div>
                  <div><label style={{...lbl,color:"#cbd5e1"}}>Bill Date</label><input type="date" value={purchaseForm.billDate||today()} onChange={e=>setPurchaseForm({...purchaseForm,billDate:e.target.value})} style={inp}/></div>
                  <div><label style={{...lbl,color:"#cbd5e1"}}>Entry Date</label><input type="date" value={purchaseForm.entryDate||today()} onChange={e=>setPurchaseForm({...purchaseForm,entryDate:e.target.value})} style={inp}/></div>
                  <div><label style={{...lbl,color:"#cbd5e1"}}>Tax Type</label><select value={purchaseForm.taxType||"exclusive"} onChange={e=>setPurchaseForm({...purchaseForm,taxType:e.target.value})} style={inp}><option value="exclusive">Exclusive (Tax Alag)</option><option value="inclusive">Inclusive (Tax Sathe)</option></select></div>
                  <div><label style={{...lbl,color:"#cbd5e1"}}>Payment Mode</label><select value={purchaseForm.paymentMode||"cash"} onChange={e=>setPurchaseForm({...purchaseForm,paymentMode:e.target.value})} style={inp}><option value="cash">Cash</option><option value="credit">Credit</option><option value="cheque">Cheque</option><option value="neft">NEFT/UPI</option></select></div>
                  <div><label style={{...lbl,color:"#cbd5e1"}}>Tax Zone</label><select value={purchaseForm.taxZone||"sgst_ugst"} onChange={e=>setPurchaseForm({...purchaseForm,taxZone:e.target.value})} style={inp}><option value="sgst_ugst">RD Within State - SGST/UGST</option><option value="igst">RD Outside State - IGST</option><option value="exempt">Tax Exempt</option></select></div>
                  <div><label style={{...lbl,color:"#cbd5e1"}}>Address F4 / Credit Note F5</label><input value={purchaseForm.addressF4||""} onChange={e=>setPurchaseForm({...purchaseForm,addressF4:e.target.value})} placeholder="Address / Ref" style={inp}/></div>
                  <div style={{display:"flex",gap:"16px",alignItems:"center",paddingTop:"18px"}}>
                    <label style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"12px",cursor:"pointer",color:"white",fontWeight:"600"}}>
                      <input type="checkbox" checked={!!purchaseForm.gstInclusive} onChange={e=>setPurchaseForm({...purchaseForm,gstInclusive:e.target.checked})} style={{width:"14px",height:"14px"}}/>
                      GST Inclusive
                    </label>
                    <label style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"12px",cursor:"pointer",color:"white",fontWeight:"600"}}>
                      <input type="checkbox" checked={!!purchaseForm.gstOnFree} onChange={e=>setPurchaseForm({...purchaseForm,gstOnFree:e.target.checked})} style={{width:"14px",height:"14px"}}/>
                      GST on Free
                    </label>
                  </div>
                </div>
                {/* Purchase Items Table */}
                <div style={{overflowX:"auto",marginBottom:"14px"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px",minWidth:"900px"}}>
                    <thead><tr style={{background:"#1a3a5c"}}>
                      {["Sr","Item *","Batch No","Exp Dt","Qty","Free","MRP","PTR","GST%","Disc%","Disc Amt","BASE","Amount",""].map(h=>(
                        <th key={h} style={{padding:"7px 8px",textAlign:["Disc Amt","BASE","Amount"].includes(h)?"right":h==="Sr"?"center":"left",fontWeight:"600",color:"white",fontSize:"11px",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {purchaseItems.map((pi,idx)=>(
                        <tr key={idx} style={{borderBottom:"1px solid #e9ecef"}}>
                          <td style={{padding:"6px 8px",textAlign:"center",fontWeight:"600",color:"#64748b",fontSize:"12px",whiteSpace:"nowrap"}}>{idx+1}</td>
                          <td style={{padding:"4px",position:"relative",minWidth:"160px"}}>
                            {(()=>{
                              const q=(purchaseItemSearch[idx]||"").toLowerCase();
                              const filtered=items.filter(i=>{return !q||(i.name||"").toLowerCase().includes(q)||(i.company||"").toLowerCase().includes(q);});
                              const hi=purchaseItemHighlight[idx]||0;
                              const selectItem=(i)=>{updatePurchaseItem(idx,"itemId",i.id);setPurchaseItemSearch(prev=>({...prev,[idx]:undefined}));setPurchaseItemHighlight(prev=>({...prev,[idx]:0}));setPurchaseItemDropdown(null);};
                              return (<>
                                <input
                                  value={purchaseItemSearch[idx]!==undefined ? purchaseItemSearch[idx] : (pi.itemName||"")}
                                  onChange={e=>{const r=e.target.getBoundingClientRect();setPurchaseDropdownPos({top:r.bottom+window.scrollY,left:r.left+window.scrollX,width:Math.max(r.width,220)});setPurchaseItemSearch({...purchaseItemSearch,[idx]:e.target.value});setPurchaseItemHighlight({...purchaseItemHighlight,[idx]:0});setPurchaseItemDropdown(idx);}}
                                  onFocus={e=>{const r=e.target.getBoundingClientRect();setPurchaseDropdownPos({top:r.bottom+window.scrollY,left:r.left+window.scrollX,width:Math.max(r.width,220)});setPurchaseItemSearch(prev=>({...prev,[idx]:prev[idx]??""}));setPurchaseItemHighlight(prev=>({...prev,[idx]:0}));setPurchaseItemDropdown(idx);}}
                                  onBlur={()=>setTimeout(()=>setPurchaseItemDropdown(null),200)}
                                  placeholder="Search item..."
                                  style={{...inp,minWidth:"150px",padding:"6px 8px"}}
                                  autoComplete="off"
                                  data-pf={`${idx}-item`}
                                  onKeyDown={e=>{
                                    if(purchaseItemDropdown===idx&&filtered.length>0){
                                      if(e.key==="ArrowDown"){e.preventDefault();setPurchaseItemHighlight(prev=>({...prev,[idx]:Math.min((prev[idx]||0)+1,filtered.length-1)}));return;}
                                      if(e.key==="ArrowUp"){e.preventDefault();setPurchaseItemHighlight(prev=>({...prev,[idx]:Math.max((prev[idx]||0)-1,0)}));return;}
                                      if(e.key==="Enter"){e.preventDefault();const item=filtered[hi];if(item){selectItem(item);}return;}
                                    }
                                    if(e.key==="Enter"&&purchaseItemDropdown!==idx){ focusNext(e,idx,"item"); }
                                  }}
                                />
                                {purchaseItemDropdown===idx&&(purchaseItemSearch[idx]||"").length>=0&&(
                                  <div style={{position:"fixed",top:purchaseDropdownPos.top,left:purchaseDropdownPos.left,zIndex:9999,background:"white",border:"1px solid #dee2e6",borderRadius:"8px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)",minWidth:purchaseDropdownPos.width}}>
                                    {filtered.map((i,pos)=>(
                                      <div key={i.id} onMouseDown={()=>selectItem(i)} onMouseEnter={()=>setPurchaseItemHighlight(prev=>({...prev,[idx]:pos}))} style={{padding:"7px 10px",cursor:"pointer",borderBottom:"1px solid #e9ecef",fontSize:"12px",display:"flex",justifyContent:"space-between",alignItems:"center",background:pos===hi?"#eff6ff":"white"}}>
                                        <span><strong>{i.name}</strong></span>
                                        <span style={{color:"#64748b",fontSize:"11px",marginLeft:"8px"}}>{getDivision(i.division).icon} ₹{i.price}</span>
                                      </div>
                                    ))}
                                    {filtered.length===0&&(
                                      <div style={{padding:"10px",color:"#94a3b8",fontSize:"12px",textAlign:"center"}}>No items found</div>
                                    )}
                                  </div>
                                )}
                              </>);
                            })()}
                          </td>
                          {[{f:"batchNo",ph:"Batch",w:"80px"},{f:"expiryDate",t:"text",ph:"MM/YY",w:"75px"},{f:"qty",t:"number",ph:"Qty",w:"60px"},{f:"freeQty",t:"number",ph:"Free",w:"55px"},{f:"mrp",t:"number",ph:"MRP",w:"70px"},{f:"ptr",t:"number",ph:"PTR",w:"70px"}].map(f=>(
                            <td key={f.f} style={{padding:"4px"}}><input type={f.t||"text"} value={pi[f.f]||""} onChange={e=>{let v=e.target.value;if(f.f==="expiryDate"){v=v.replace(/[^0-9/]/g,"");if(v.length===2&&!v.includes("/")&&pi[f.f]?.length!==3) v=v+"/";if(v.length>5) return;}updatePurchaseItem(idx,f.f,v);}} onKeyDown={e=>focusNext(e,idx,f.f)} placeholder={f.ph} data-pf={`${idx}-${f.f}`} style={{...inp,width:f.w,padding:"6px 7px",letterSpacing:f.f==="expiryDate"?"1px":"normal"}}/></td>
                          ))}
                          <td style={{padding:"4px"}}>
                            <select value={pi.gst||"5"} onChange={e=>updatePurchaseItem(idx,"gst",e.target.value)} onKeyDown={e=>focusNext(e,idx,"gst")} data-pf={`${idx}-gst`} style={{...inp,width:"65px",padding:"6px 5px"}}>
                              {GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}
                            </select>
                          </td>
                          <td style={{padding:"4px"}}><input type="number" value={pi.disc||"0"} onChange={e=>updatePurchaseItem(idx,"disc",e.target.value)} onKeyDown={e=>focusNext(e,idx,"disc")} data-pf={`${idx}-disc`} style={{...inp,width:"55px",padding:"6px 7px"}}/></td>
                          <td style={{padding:"6px 8px",fontWeight:"700",color:"#ef4444",whiteSpace:"nowrap",textAlign:"right"}}>₹{fmt(num(pi.ptr)*int(pi.qty)*num(pi.disc)/100)}</td>
                          <td style={{padding:"6px 8px",fontWeight:"700",color:"#0891b2",whiteSpace:"nowrap",textAlign:"right"}}>₹{fmt(num(pi.ptr)*int(pi.qty)*(1-num(pi.disc)/100))}</td>
                          <td style={{padding:"4px 8px",fontWeight:"700",color:"#3b82f6",whiteSpace:"nowrap",textAlign:"right"}}>₹{fmt(pi.amount||0)}</td>
                          <td style={{padding:"4px"}}><button onClick={()=>removePurchaseItem(idx)} style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#ef4444",borderRadius:"5px",padding:"5px 8px",cursor:"pointer"}}><X size={12}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{borderTop:"2px solid #dee2e6",background:"#f8fafc"}}>
                        <td colSpan="10" style={{padding:"10px 8px",fontWeight:"700",textAlign:"right",fontSize:"12px",color:"#64748b"}}>TOTALS →</td>
                        <td style={{padding:"10px 8px",fontWeight:"800",textAlign:"right",fontSize:"13px",color:"#ef4444",whiteSpace:"nowrap"}}>₹{fmt(purchaseItems.reduce((s,pi)=>s+num(pi.ptr)*int(pi.qty)*num(pi.disc)/100,0))}</td>
                        <td style={{padding:"10px 8px",fontWeight:"800",textAlign:"right",fontSize:"13px",color:"#0891b2",whiteSpace:"nowrap"}}>₹{fmt(purchaseItems.reduce((s,pi)=>s+num(pi.ptr)*int(pi.qty)*(1-num(pi.disc)/100),0))}</td>
                        <td style={{padding:"10px 8px",fontWeight:"800",textAlign:"right",fontSize:"14px",color:"#16a34a",whiteSpace:"nowrap"}}>₹{fmt(purchaseItems.reduce((s,pi)=>s+num(pi.amount||0),0))}</td>
                        <td></td>
                      </tr>
                      <tr style={{background:"#eff6ff",borderTop:"1px solid #bfdbfe"}}>
                        <td colSpan="10" style={{padding:"8px 8px",fontWeight:"700",textAlign:"right",fontSize:"12px",color:"#1d4ed8"}}>GST SUMMARY →</td>
                        <td style={{padding:"8px 8px",fontSize:"11px",color:"#475569",textAlign:"right"}}></td>
                        <td colSpan="2" style={{padding:"8px 8px",fontWeight:"700",fontSize:"12px",color:"#1d4ed8",whiteSpace:"nowrap",textAlign:"right"}}>
                          {(()=>{const gT=purchaseItems.reduce((s,pi)=>s+num(pi.ptr)*int(pi.qty)*(1-num(pi.disc)/100)*num(pi.gst)/100,0);return `SGST: ₹${fmt(gT/2)}  |  CGST: ₹${fmt(gT/2)}  |  IGST: ₹${fmt(gT)}`;})()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                  <button onClick={addPurchaseItem} style={{...btn("#6f42c1"),fontSize:"12px"}}><Plus size={13}/>Add Row</button>
                  <button onClick={handleSavePurchase} style={{...btn("#198754")}}><CheckCircle size={14}/>Save & Update Stock</button>
                  <button onClick={()=>setShowPurchaseForm(false)} style={{...btn("#64748b")}}><X size={13}/>Cancel</button>
                </div>
                {/* Purchase Totals - PDF format */}
                {purchaseItems.filter(pi=>pi.itemId).length>0&&(()=>{
                  const base=purchaseItems.reduce((s,pi)=>s+num(pi.ptr)*int(pi.qty),0);
                  const discAmt=purchaseItems.reduce((s,pi)=>s+num(pi.ptr)*int(pi.qty)*num(pi.disc)/100,0);
                  const taxable=base-discAmt;
                  const gstTotal=purchaseItems.reduce((s,pi)=>{const b=num(pi.ptr)*int(pi.qty)*(1-num(pi.disc)/100);return s+b*num(pi.gst)/100;},0);
                  const sgst=gstTotal/2,cgst=gstTotal/2;
                  const total=taxable+gstTotal;
                  return(
                    <div style={{display:"flex",justifyContent:"flex-end",marginTop:"12px"}}>
                      <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"12px 16px",minWidth:"280px",fontSize:"12px"}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:"3px 16px"}}>
                          <span>Base Amount:</span><span style={{textAlign:"right",fontWeight:"600"}}>₹{fmt(base)}</span>
                          <span style={{color:"#ef4444"}}>Less Disc:</span><span style={{textAlign:"right",color:"#ef4444"}}>-₹{fmt(discAmt)}</span>
                          <span>Taxable Amount:</span><span style={{textAlign:"right"}}>₹{fmt(taxable)}</span>
                          <span style={{color:"#64748b"}}>SGST:</span><span style={{textAlign:"right",color:"#64748b"}}>₹{fmt(sgst)}</span>
                          <span style={{color:"#64748b"}}>CGST:</span><span style={{textAlign:"right",color:"#64748b"}}>₹{fmt(cgst)}</span>
                          <span style={{color:"#64748b"}}>IGST (SGST+CGST):</span><span style={{textAlign:"right",color:"#1d4ed8",fontWeight:"700"}}>₹{fmt(gstTotal)}</span>
                          <span style={{color:"#64748b"}}>Half Scheme:</span><span style={{textAlign:"right"}}><input type="number" value={purchaseForm.halfScheme||"0"} onChange={e=>setPurchaseForm({...purchaseForm,halfScheme:e.target.value})} style={{...inp,width:"80px",padding:"2px 6px",fontSize:"11px"}}/></span>
                          <span style={{color:"#64748b"}}>Oct on Free:</span><span style={{textAlign:"right"}}><input type="number" value={purchaseForm.octOnFree||"0"} onChange={e=>setPurchaseForm({...purchaseForm,octOnFree:e.target.value})} style={{...inp,width:"80px",padding:"2px 6px",fontSize:"11px"}}/></span>
                          <span style={{color:"#64748b"}}>Other +/-:</span><span style={{textAlign:"right"}}><input type="number" value={purchaseForm.otherAdj||"0"} onChange={e=>setPurchaseForm({...purchaseForm,otherAdj:e.target.value})} style={{...inp,width:"80px",padding:"2px 6px",fontSize:"11px"}}/></span>
                          <span style={{color:"#ef4444"}}>Less Disc:</span><span style={{textAlign:"right"}}><input type="number" value={purchaseForm.lessDisc||"0"} onChange={e=>setPurchaseForm({...purchaseForm,lessDisc:e.target.value})} style={{...inp,width:"80px",padding:"2px 6px",fontSize:"11px"}}/></span>
                          <span style={{color:"#64748b"}}>Cr Note:</span><span style={{textAlign:"right"}}><input type="number" value={purchaseForm.crNote||"0"} onChange={e=>setPurchaseForm({...purchaseForm,crNote:e.target.value})} style={{...inp,width:"80px",padding:"2px 6px",fontSize:"11px"}}/></span>
                          <span style={{color:"#64748b"}}>TCS Value:</span><span style={{textAlign:"right"}}><input type="number" value={purchaseForm.tcsValue||"0"} onChange={e=>setPurchaseForm({...purchaseForm,tcsValue:e.target.value})} style={{...inp,width:"80px",padding:"2px 6px",fontSize:"11px"}}/></span>
                          <span style={{fontWeight:"800",borderTop:"2px solid #e2e8f0",paddingTop:"6px"}}>TOTAL:</span>
                          <span style={{textAlign:"right",fontWeight:"800",color:"#198754",fontSize:"14px",borderTop:"2px solid #e2e8f0",paddingTop:"6px"}}>₹{fmt(total-num(purchaseForm.lessDisc)-num(purchaseForm.crNote)+num(purchaseForm.otherAdj)+num(purchaseForm.tcsValue))}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Purchase Bills List */}
            {purchaseBills.length===0&&!showPurchaseForm?(
              <div style={{textAlign:"center",padding:"60px",color:"#94a3b8"}}><div style={{fontSize:"44px"}}>🛒</div><p>No purchase bills found</p></div>
            ):[...purchaseBills].reverse().map(bill=>(
              <div key={bill.id} style={{background:"white",borderRadius:"5px",marginBottom:"10px",border:"1px solid #dee2e6",overflow:"hidden"}}>
                <div style={{padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setExpandedPurchase(expandedPurchase===bill.id?null:bill.id)}>
                  <div>
                    <div style={{fontWeight:"700",fontSize:"13px"}}>Entry #{bill.entryNo} — {bill.partyName}</div>
                    <div style={{fontSize:"11px",color:"#64748b",marginTop:"2px"}}>Bill: {bill.billNo||"N/A"} · {bill.billDate} · {bill.items?.length||0} items · {bill.taxType}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:"800",fontSize:"14px"}}>₹{fmt(bill.total)}</div>
                      <span style={{background:(STATUS_STYLE[bill.status]||STATUS_STYLE.Pending).bg,color:(STATUS_STYLE[bill.status]||STATUS_STYLE.Pending).color,padding:"2px 8px",borderRadius:"5px",fontSize:"11px",fontWeight:"600"}}>{bill.status||"Paid"}</span>
                    </div>
                    <button onClick={e=>{e.stopPropagation();handleDeletePurchaseBill(bill);}} style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#ef4444",borderRadius:"6px",padding:"5px 8px",cursor:"pointer",fontSize:"12px"}} title="Delete">🗑️</button>
                    {expandedPurchase===bill.id?<ChevronUp size={15} color="#64748b"/>:<ChevronDown size={15} color="#64748b"/>}
                  </div>
                </div>
                {expandedPurchase===bill.id&&(
                  <div style={{borderTop:"1px solid #f1f5f9",padding:"12px 14px",background:"#fafafa",overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px",minWidth:"600px"}}>
                      <thead><tr style={{background:"#1a3a5c"}}>{["Item","Batch","Exp","Qty","Free","MRP","PTR","GST","Disc","Amount"].map(h=><th key={h} style={{padding:"6px 8px",textAlign:["Qty","Free","PTR","MRP","GST","Disc","Amount"].includes(h)?"right":"left",fontWeight:"600",color:"white",fontSize:"11px"}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(bill.items||[]).map((pi,i)=>(
                          <tr key={i} style={{borderBottom:"1px solid #dee2e6"}}>
                            <td style={{padding:"6px 8px",fontWeight:"600"}}>{pi.itemName||items.find(x=>x.id===pi.itemId)?.name||"—"}</td>
                            <td style={{padding:"6px 8px"}}>{pi.batchNo||"—"}</td>
                            <td style={{padding:"6px 8px",fontSize:"11px",color:isExpired(pi.expiryDate)?"#ef4444":"inherit"}}>{pi.expiryDate||"—"}</td>
                            <td style={{padding:"6px 8px",textAlign:"right"}}>{pi.qty}</td>
                            <td style={{padding:"6px 8px",textAlign:"right"}}>{pi.freeQty||0}</td>
                            <td style={{padding:"6px 8px",textAlign:"right"}}>₹{fmt(pi.ptr)}</td>
                            <td style={{padding:"6px 8px",textAlign:"right"}}>₹{fmt(pi.mrp)}</td>
                            <td style={{padding:"6px 8px",textAlign:"right"}}>{pi.gst||0}%</td>
                            <td style={{padding:"6px 8px",textAlign:"right"}}>{pi.disc||0}%</td>
                            <td style={{padding:"6px 8px",textAlign:"right",fontWeight:"700",color:"#3b82f6"}}>₹{fmt(pi.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr><td colSpan="9" style={{padding:"8px",textAlign:"right",fontWeight:"700"}}>Total:</td><td style={{padding:"8px",textAlign:"right",fontWeight:"800",color:"#16a34a"}}>₹{fmt(bill.total)}</td></tr></tfoot>
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
        {isOwner&&activeSection==="sales_pos"&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",flexWrap:"wrap",gap:"10px"}}>
              <h2 style={{margin:0,fontSize:"18px",fontWeight:"800"}}>🧾 Sales Bills ({salesBills.length})</h2>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>openSalesForm(false)} style={{...btn("#198754")}}><Plus size={14}/>New Sale</button>
                <button onClick={()=>openSalesForm(true)} style={{...btn("#dc3545")}}><Plus size={14}/>Return</button>
              </div>
            </div>

            {/* Sales Form */}
            {showSalesForm&&(
              <div style={{background:"white",borderRadius:"6px",padding:"20px",marginBottom:"16px",border:`2px solid ${isReturn?"#fecaca":"#bbf7d0"}`,boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"14px"}}>
                  <h3 style={{margin:0,fontSize:"15px",fontWeight:"700"}}>{isReturn?"↩️ Sales Return":"🧾 New Sales Bill"}</h3>
                  <button onClick={()=>setShowSalesForm(false)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={18}/></button>
                </div>
                {/* Patient/Doctor details */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"10px",marginBottom:"14px",background:"#1a3a5c",borderRadius:"8px",padding:"14px"}}>
                  {[
                    {k:"patientName",l:"Patient Name",t:"text",ph:"Patient name"},{k:"patientArea",l:"Patient Area",t:"text",ph:"Area/Locality"},
                    {k:"mobile",l:"Mobile No",t:"tel",ph:"Mobile no"},{k:"address",l:"Address",t:"text",ph:"Address"},
                    {k:"salesMan",l:"S.Man (Salesman)",t:"text",ph:"Salesman name"},
                  ].map(f=>(
                    <div key={f.k}><label style={lbl}>{f.l}</label><input type={f.t} value={salesForm[f.k]||""} onChange={e=>setSalesForm({...salesForm,[f.k]:e.target.value.toUpperCase()})} placeholder={f.ph} style={inp}/></div>
                  ))}
                  <div><label style={lbl}>Doctor Name</label>
                    <select value={salesForm.doctorName||""} onChange={e=>setSalesForm({...salesForm,doctorName:e.target.value})} style={inp}>
                      <option value="">-- Select Doctor --</option>
                      {doctors.map(d=><option key={d.id} value={d.name}>{d.name}{d.speciality?" ("+d.speciality+")":""}</option>)}
                      <option value="OTHER">Other / Manual</option>
                    </select>
                  </div>
                  <div><label style={lbl}>Payment Mode</label><select value={salesForm.paymentMode||"cash"} onChange={e=>setSalesForm({...salesForm,paymentMode:e.target.value})} style={inp}><option value="cash">Cash</option><option value="card">Card/CD</option><option value="upi">UPI/NEFT</option><option value="credit">Credit</option><option value="cheque">Cheque</option></select></div>
                  <div><label style={lbl}>Extra Discount %</label><input type="number" value={salesForm.discount||"0"} onChange={e=>setSalesForm({...salesForm,discount:e.target.value})} style={inp}/></div>
                  <div><label style={lbl}>Retail Inv / Bill Ref</label><input value={salesForm.retailInv||""} onChange={e=>setSalesForm({...salesForm,retailInv:e.target.value})} placeholder="Bill ref no" style={inp}/></div>
                  <div><label style={lbl}>Pay Rec / Refund (₹)</label><input type="number" value={salesForm.payRec||"0"} onChange={e=>setSalesForm({...salesForm,payRec:e.target.value})} placeholder="0.00" style={inp}/></div>
                  <div style={{display:"flex",gap:"16px",alignItems:"center",paddingTop:"18px"}}>
                    <label style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"12px",cursor:"pointer",color:"white",fontWeight:"600"}}>
                      <input type="checkbox" checked={!!isReturn} disabled style={{width:"14px",height:"14px"}}/>
                      Return Bill
                    </label>
                    <label style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"12px",cursor:"pointer",color:"white",fontWeight:"600"}}>
                      <input type="checkbox" checked={!!salesForm.quotation} onChange={e=>setSalesForm({...salesForm,quotation:e.target.checked})} style={{width:"14px",height:"14px"}}/>
                      Quotation
                    </label>
                  </div>
                </div>
                {/* Item search + table */}

                <div style={{overflowX:"auto",marginBottom:"14px"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px",minWidth:"680px"}}>
                    <thead><tr style={{background:"#1a3a5c"}}>{["Sr","Item","Batch No","Qty","MRP","Rate","GST%","Disc%","Amount",""].map(h=><th key={h} style={{padding:"6px 8px",textAlign:"left",fontWeight:"600",color:"white",fontSize:"11px"}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {salesItems.map((si,idx)=>(
                        <tr key={idx} style={{borderBottom:"1px solid #e9ecef"}}>
                          <td style={{padding:"6px 8px",textAlign:"center",fontWeight:"600",color:"#64748b",fontSize:"12px",whiteSpace:"nowrap"}}>{idx+1}</td>
                          <td style={{padding:"4px",position:"relative",minWidth:"160px"}}>
                            {(()=>{
                              const q=(salesItemSearch[idx]||"").toLowerCase();
                              const filtered=items.filter(i=>{const alreadyAdded=salesItems.some((s,sidx)=>sidx!==idx&&s.itemId===i.id);if(alreadyAdded) return false;return !q||(i.name||"").toLowerCase().includes(q)||(i.company||"").toLowerCase().includes(q);});
                              const hi=salesItemHighlight[idx]||0;
                              const selectItem=(i)=>{setSalesItems(prev=>{const updated=[...prev];const si2={...emptySalesItem(),itemId:i.id,itemName:i.name,mrp:num(i.mrp)||num(i.price),rate:num(i.price),gst:num(i.gst)||0};si2.amount=calcSalesItemAmt(si2);updated[idx]={...updated[idx],...si2};return updated;});setSalesItemSearch(prev=>({...prev,[idx]:undefined}));setSalesItemHighlight(prev=>({...prev,[idx]:0}));setSalesItemDropdown(null);};
                              return (<>
                                <input
                                  value={salesItemSearch[idx]!==undefined ? salesItemSearch[idx] : (si.itemName||"")}
                                  onChange={e=>{const r=e.target.getBoundingClientRect();setSalesDropdownPos({top:r.bottom+window.scrollY,left:r.left+window.scrollX,width:Math.max(r.width,220)});setSalesItemSearch({...salesItemSearch,[idx]:e.target.value});setSalesItemHighlight({...salesItemHighlight,[idx]:0});setSalesItemDropdown(idx);}}
                                  onFocus={e=>{const r=e.target.getBoundingClientRect();setSalesDropdownPos({top:r.bottom+window.scrollY,left:r.left+window.scrollX,width:Math.max(r.width,220)});setSalesItemSearch(prev=>({...prev,[idx]:prev[idx]??""}));setSalesItemHighlight(prev=>({...prev,[idx]:0}));setSalesItemDropdown(idx);}}
                                  onBlur={()=>setTimeout(()=>setSalesItemDropdown(null),200)}
                                  onKeyDown={e=>{
                                    if(salesItemDropdown!==idx||filtered.length===0) return;
                                    if(e.key==="ArrowDown"){e.preventDefault();setSalesItemHighlight(prev=>({...prev,[idx]:Math.min((prev[idx]||0)+1,filtered.length-1)}))}
                                    else if(e.key==="ArrowUp"){e.preventDefault();setSalesItemHighlight(prev=>({...prev,[idx]:Math.max((prev[idx]||0)-1,0)}))}
                                    else if(e.key==="Enter"){e.preventDefault();const item=filtered[hi];if(item) selectItem(item);}
                                  }}
                                  placeholder="Search item..."
                                  style={{...inp,minWidth:"150px",padding:"6px 8px"}}
                                  autoComplete="off"
                                />
                                {salesItemDropdown===idx&&salesItemSearch[idx]!==undefined&&(
                                  <div style={{position:"fixed",top:salesDropdownPos.top,left:salesDropdownPos.left,zIndex:9999,background:"white",border:"1px solid #dee2e6",borderRadius:"8px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)",minWidth:salesDropdownPos.width}}>
                                    {filtered.map((i,pos)=>(
                                      <div key={i.id} onMouseDown={()=>selectItem(i)} onMouseEnter={()=>setSalesItemHighlight(prev=>({...prev,[idx]:pos}))} style={{padding:"7px 10px",cursor:"pointer",borderBottom:"1px solid #e9ecef",fontSize:"12px",display:"flex",justifyContent:"space-between",alignItems:"center",background:pos===hi?"#eff6ff":"white"}}>
                                        <span><strong>{i.name}</strong></span>
                                        <span style={{color:"#64748b",fontSize:"11px",marginLeft:"8px"}}>{getDivision(i.division).icon} ₹{i.price} {i.stock<=0?<span style={{color:"#ef4444",fontSize:"10px"}}>OOS</span>:""}</span>
                                      </div>
                                    ))}
                                    {filtered.length===0&&(
                                      <div style={{padding:"10px",color:"#94a3b8",fontSize:"12px",textAlign:"center"}}>No items found</div>
                                    )}
                                  </div>
                                )}
                              </>);
                            })()}
                          </td>
                          <td style={{padding:"4px"}}><input type="text" value={si.batchNo||""} onChange={e=>updateSalesItem(idx,"batchNo",e.target.value)} placeholder="Batch No" style={{...inp,width:"90px",padding:"6px 7px"}}/></td>
                          {[{f:"qty",t:"number",w:"55px"},{f:"mrp",t:"number",w:"65px"},{f:"rate",t:"number",w:"65px"}].map(f=>(
                            <td key={f.f} style={{padding:"4px"}}><input type={f.t} value={si[f.f]||""} onChange={e=>updateSalesItem(idx,f.f,e.target.value)} style={{...inp,width:f.w,padding:"6px 7px"}}/></td>
                          ))}
                          <td style={{padding:"4px"}}><select value={si.gst||"0"} onChange={e=>updateSalesItem(idx,"gst",e.target.value)} style={{...inp,width:"60px",padding:"6px 5px"}}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</select></td>
                          <td style={{padding:"4px"}}><input type="number" value={si.disc||"0"} onChange={e=>updateSalesItem(idx,"disc",e.target.value)} style={{...inp,width:"55px",padding:"6px 7px"}}/></td>
                          <td style={{padding:"6px 8px",fontWeight:"700",color:"#3b82f6",whiteSpace:"nowrap"}}>₹{fmt(si.amount||0)}</td>
                          <td style={{padding:"4px"}}><button onClick={()=>removeSalesItem(idx)} style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#ef4444",borderRadius:"5px",padding:"5px 7px",cursor:"pointer"}}><X size={12}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Totals - PDF style */}
                {(()=>{
                  const gross=salesItems.reduce((s,si)=>s+num(si.amount||0),0);
                  const lessDisc=gross*num(salesForm.discount)/100;
                  const net=gross-lessDisc;
                  const sgst=salesItems.reduce((s,si)=>{const b=num(si.rate)*int(si.qty)*(1-num(si.disc)/100);return s+b*num(si.gst)/200;},0);
                  const cgst=sgst;
                  return(
                    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"14px"}}>
                      <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"12px 16px",minWidth:"270px",fontSize:"12px"}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:"3px 16px"}}>
                          <span style={{color:"#64748b"}}>SGST:</span><span style={{textAlign:"right"}}>₹{fmt(sgst)}</span>
                          <span style={{color:"#64748b"}}>CGST:</span><span style={{textAlign:"right"}}>₹{fmt(cgst)}</span>
                          <span style={{fontWeight:"600"}}>Gross Amount:</span><span style={{textAlign:"right",fontWeight:"600"}}>₹{fmt(gross)}</span>
                          <span style={{color:"#495057"}}>Half Scheme:</span><span style={{textAlign:"right"}}><input type="number" value={salesForm.halfScheme||"0"} onChange={e=>setSalesForm({...salesForm,halfScheme:e.target.value})} style={{...inp,width:"80px",padding:"2px 6px",fontSize:"11px"}}/></span>
                          <span style={{color:"#495057"}}>Oct on Free:</span><span style={{textAlign:"right"}}><input type="number" value={salesForm.octOnFree||"0"} onChange={e=>setSalesForm({...salesForm,octOnFree:e.target.value})} style={{...inp,width:"80px",padding:"2px 6px",fontSize:"11px"}}/></span>
                          <span style={{color:"#495057"}}>Other +/-:</span><span style={{textAlign:"right"}}><input type="number" value={salesForm.otherAdj||"0"} onChange={e=>setSalesForm({...salesForm,otherAdj:e.target.value})} style={{...inp,width:"80px",padding:"2px 6px",fontSize:"11px"}}/></span>
                          <span style={{color:"#dc3545"}}>Less Disc ({salesForm.discount||0}%):</span><span style={{textAlign:"right",color:"#dc3545"}}>-₹{fmt(lessDisc)}</span>
                          <span style={{color:"#495057"}}>Cr Note:</span><span style={{textAlign:"right"}}><input type="number" value={salesForm.crNote||"0"} onChange={e=>setSalesForm({...salesForm,crNote:e.target.value})} style={{...inp,width:"80px",padding:"2px 6px",fontSize:"11px"}}/></span>
                          <span style={{color:"#495057"}}>TCS Value:</span><span style={{textAlign:"right"}}><input type="number" value={salesForm.tcsValue||"0"} onChange={e=>setSalesForm({...salesForm,tcsValue:e.target.value})} style={{...inp,width:"80px",padding:"2px 6px",fontSize:"11px"}}/></span>
                          <span style={{fontWeight:"800",fontSize:"14px",borderTop:"2px solid #dee2e6",paddingTop:"6px"}}>NET:</span>
                          <span style={{textAlign:"right",fontWeight:"800",fontSize:"14px",color:"#198754",borderTop:"2px solid #dee2e6",paddingTop:"6px"}}>₹{fmt(net-num(salesForm.crNote)+num(salesForm.otherAdj)+num(salesForm.tcsValue))}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                  <button onClick={addSalesItem} style={{...btn("#6f42c1"),fontSize:"12px"}}><Plus size={13}/>Add Row</button>
                  <button onClick={handleSaveSales} style={{...btn(isReturn?"#ef4444":"#16a34a")}}><CheckCircle size={14}/>{isReturn?"Save Return":"Save & Print"}</button>
                  <button onClick={()=>setShowSalesForm(false)} style={{...btn("#64748b")}}><X size={13}/>Cancel</button>
                </div>
              </div>
            )}

            {/* Sales Bills List */}
            {salesBills.length===0&&!showSalesForm?(
              <div style={{textAlign:"center",padding:"60px",color:"#94a3b8"}}><div style={{fontSize:"44px"}}>🧾</div><p>No sales bills found</p></div>
            ):[...salesBills].reverse().map(bill=>(
              <div key={bill.id} style={{background:"white",borderRadius:"5px",marginBottom:"10px",border:`1px solid ${bill.isReturn?"#fecaca":"#e2e8f0"}`,overflow:"hidden"}}>
                <div style={{padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setExpandedSale(expandedSale===bill.id?null:bill.id)}>
                  <div>
                    <div style={{fontWeight:"700",fontSize:"13px"}}>Bill #{bill.billNo} {bill.isReturn&&<span style={{color:"#ef4444",fontSize:"11px"}}>(RETURN)</span>}</div>
                    <div style={{fontSize:"11px",color:"#64748b",marginTop:"2px"}}>{bill.patientName||"—"}{bill.patientArea?` (${bill.patientArea})`:""}{bill.doctorName?` · Dr. ${bill.doctorName}`:""}{bill.salesMan?` · ${bill.salesMan}`:""} · {bill.mobile||"—"} · {bill.paymentMode?.toUpperCase()} · {new Date(bill.date).toLocaleDateString("en-IN")}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:"800",fontSize:"14px",color:bill.isReturn?"#ef4444":"#1e293b"}}>{bill.isReturn?"-":""}₹{fmt(Math.abs(num(bill.netAmount)))}</div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();handlePrintSalesBill(bill);}} style={{background:"#f1f5f9",border:"none",padding:"5px 8px",borderRadius:"6px",cursor:"pointer",fontSize:"13px"}} title="Print">🖨️</button>
                    <button onClick={e=>{e.stopPropagation();handleDeleteSalesBill(bill);}} style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#ef4444",borderRadius:"6px",padding:"5px 8px",cursor:"pointer",fontSize:"12px"}} title="Delete">🗑️</button>
                    {expandedSale===bill.id?<ChevronUp size={15} color="#64748b"/>:<ChevronDown size={15} color="#64748b"/>}
                  </div>
                </div>
                {expandedSale===bill.id&&(
                  <div style={{borderTop:"1px solid #f1f5f9",padding:"12px 14px",background:"#fafafa",overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px",minWidth:"500px"}}>
                      <thead><tr style={{background:"#1a3a5c"}}>{["Item","Batch","Qty","Rate","GST","Amount"].map(h=><th key={h} style={{padding:"6px 8px",textAlign:["Qty","Rate","GST","Amount"].includes(h)?"right":"left",fontWeight:"600",color:"white",fontSize:"11px"}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(bill.items||[]).filter(si=>si.itemId).map((si,i)=>(
                          <tr key={i} style={{borderBottom:"1px solid #dee2e6"}}>
                            <td style={{padding:"6px 8px",fontWeight:"600"}}>{si.itemName||"—"}</td>
                            <td style={{padding:"6px 8px"}}>{si.batchNo||"—"}</td>
                            <td style={{padding:"6px 8px",textAlign:"right"}}>{si.qty}</td>
                            <td style={{padding:"6px 8px",textAlign:"right"}}>₹{fmt(si.rate)}</td>
                            <td style={{padding:"6px 8px",textAlign:"right"}}>{si.gst||0}%</td>
                            <td style={{padding:"6px 8px",textAlign:"right",fontWeight:"700",color:"#3b82f6"}}>₹{fmt(si.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr><td colSpan="5" style={{padding:"6px 8px",textAlign:"right",fontWeight:"600"}}>Gross:</td><td style={{padding:"6px 8px",textAlign:"right",fontWeight:"700"}}>₹{fmt(Math.abs(num(bill.grossAmount)))}</td></tr>
                        {num(bill.lessDisc)>0&&<tr><td colSpan="5" style={{padding:"4px 8px",textAlign:"right",color:"#ef4444"}}>Less Disc:</td><td style={{padding:"4px 8px",textAlign:"right",color:"#ef4444"}}>-₹{fmt(Math.abs(num(bill.lessDisc)))}</td></tr>}
                        <tr><td colSpan="5" style={{padding:"8px",textAlign:"right",fontWeight:"800",fontSize:"14px"}}>NET:</td><td style={{padding:"8px",textAlign:"right",fontWeight:"800",fontSize:"14px",color:"#16a34a"}}>₹{fmt(Math.abs(num(bill.netAmount)))}</td></tr>
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
        {isOwner&&activeSection==="payments"&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",flexWrap:"wrap",gap:"10px"}}>
              <h2 style={{margin:0,fontSize:"18px",fontWeight:"800"}}>💳 Payment Receipts ({payments.length})</h2>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>openPaymentForm("payment")} style={{...btn()}}><Plus size={14}/>Payment</button>
                <button onClick={()=>openPaymentForm("receipt")} style={{...btn("#198754")}}><Plus size={14}/>Receipt</button>
              </div>
            </div>

            {/* Payment Form */}
            {showPaymentForm&&(
              <div style={{background:"white",borderRadius:"6px",padding:"20px",marginBottom:"16px",border:"2px solid #bfdbfe"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"14px"}}>
                  <h3 style={{margin:0,fontSize:"13px",fontWeight:"700",color:"#1a3a5c"}}>{paymentForm.type==="payment"?"💸 Payment Entry":"💰 Receipt Entry"}</h3>
                  <button onClick={()=>setShowPaymentForm(false)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={18}/></button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"10px",marginBottom:"14px"}}>
                  <div><label style={lbl}>Date</label><input type="date" value={paymentForm.date||today()} onChange={e=>setPaymentForm({...paymentForm,date:e.target.value})} style={inp}/></div>
                  <div>
                    <label style={lbl}>Account / Party Name *</label>
                    <input list="acct-list" value={paymentForm.accountName||""} onChange={e=>setPaymentForm({...paymentForm,accountName:e.target.value})} placeholder="Name" style={inp}/>
                    <datalist id="acct-list">{suppliers.map(s=><option key={s.id} value={s.name}/>)}</datalist>
                  </div>
                  <div><label style={lbl}>Amount *</label><input type="number" value={paymentForm.amount||""} onChange={e=>setPaymentForm({...paymentForm,amount:e.target.value})} placeholder="₹ Amount" style={inp}/></div>
                  <div><label style={lbl}>Payment Mode</label><select value={paymentForm.mode||"cash"} onChange={e=>setPaymentForm({...paymentForm,mode:e.target.value})} style={inp}><option value="cash">Cash</option><option value="cheque">Cheque</option><option value="neft">NEFT/UPI</option></select></div>
                  {(paymentForm.mode==="cheque"||paymentForm.mode==="neft")&&<>
                    <div><label style={lbl}>Bank Name</label><input value={paymentForm.bankName||""} onChange={e=>setPaymentForm({...paymentForm,bankName:e.target.value})} placeholder="Bank" style={inp}/></div>
                    <div><label style={lbl}>Cheque / Ref No</label><input value={paymentForm.chequeNo||""} onChange={e=>setPaymentForm({...paymentForm,chequeNo:e.target.value})} placeholder="No" style={inp}/></div>
                  </>}
                </div>
                <div style={{display:"flex",gap:"8px"}}>
                  <button onClick={handleSavePayment} style={{...btn("#198754")}}><CheckCircle size={13}/>Save</button>
                  <button onClick={()=>setShowPaymentForm(false)} style={{...btn("#64748b")}}><X size={13}/>Cancel</button>
                </div>
              </div>
            )}

            {payments.length===0&&!showPaymentForm?(
              <div style={{textAlign:"center",padding:"60px",color:"#94a3b8"}}><div style={{fontSize:"44px"}}>💳</div><p>No payment entries found</p></div>
            ):(
              <>
                {/* Summary */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"16px"}}>
                  {[
                    {label:"Total Payments",val:"₹"+fmt(payments.filter(p=>p.type==="payment").reduce((s,p)=>s+num(p.amount),0),0),color:"#ef4444",bg:"#fef2f2"},
                    {label:"Total Receipts",val:"₹"+fmt(payments.filter(p=>p.type==="receipt").reduce((s,p)=>s+num(p.amount),0),0),color:"#16a34a",bg:"#f0fdf4"},
                    {label:"Entries",val:payments.length,color:"#3b82f6",bg:"#eff6ff"},
                  ].map(s=>(
                    <div key={s.label} style={{background:s.bg,borderRadius:"5px",padding:"12px 14px"}}>
                      <div style={{fontSize:"20px",fontWeight:"800",color:s.color}}>{s.val}</div>
                      <div style={{fontSize:"11px",color:"#64748b"}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:"white",borderRadius:"6px",border:"1px solid #dee2e6",overflow:"hidden"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
                    <thead><tr style={{background:"#1a3a5c"}}>{["Vch#","Date","Type","Party Name","Mode","Cheque/Ref","Amount"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:h==="Amount"?"right":"left",fontWeight:"600",color:"white",fontSize:"11px"}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {[...payments].reverse().map(p=>(
                        <tr key={p.id} style={{borderBottom:"1px solid #e9ecef"}}>
                          <td style={{padding:"10px 12px",color:"#64748b"}}>#{p.vchNo}</td>
                          <td style={{padding:"10px 12px"}}>{p.date}</td>
                          <td style={{padding:"10px 12px"}}><span style={{background:p.type==="payment"?"#fef2f2":"#f0fdf4",color:p.type==="payment"?"#dc2626":"#16a34a",padding:"2px 8px",borderRadius:"5px",fontSize:"11px",fontWeight:"700"}}>{p.type==="payment"?"Payment":"Receipt"}</span></td>
                          <td style={{padding:"10px 12px",fontWeight:"600"}}>{p.accountName}</td>
                          <td style={{padding:"10px 12px",textTransform:"uppercase",fontSize:"12px"}}>{p.mode}</td>
                          <td style={{padding:"10px 12px",color:"#64748b",fontSize:"12px"}}>{p.chequeNo||p.bankName||"—"}</td>
                          <td style={{padding:"10px 12px",textAlign:"right",fontWeight:"800",color:p.type==="payment"?"#ef4444":"#16a34a"}}>₹{fmt(p.amount)}</td>
                          <td style={{padding:"10px 12px",color:"#94a3b8",fontSize:"12px"}}>{p.remark||"—"}</td>
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
        {isOwner&&activeSection==="reports"&&(()=>{
          const {filtered:fOrders,revenue,returns,purchaseTotal,profit}=getSalesReport();
          const expiredItems=items.filter(i=>isExpired(i.expiryDate));
          const expiringItems=items.filter(i=>isExpiringSoon(i.expiryDate)&&!isExpired(i.expiryDate));
          const lowStockItems=items.filter(i=>i.stock>0&&i.stock<=(i.minimum||5));
          return(
            <>
              {/* Report Sub-Tabs */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
                <h2 style={{margin:0,fontSize:"17px",fontWeight:"800"}}>📊 Reports</h2>
                <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                  {[{id:"today",l:"Today"},{id:"week",l:"7 Days"},{id:"month",l:"Month"},{id:"all",l:"All"}].map(p=>(
                    <button key={p.id} onClick={()=>setReportPeriod(p.id)} style={{...btn(reportPeriod===p.id?"#3b82f6":"#f1f5f9",reportPeriod===p.id?"white":"#64748b"),fontSize:"11px",padding:"5px 10px"}}>{p.l}</button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:"16px",background:"#f1f5f9",padding:"4px",borderRadius:"8px"}}>
                {[
                  {id:"summary",l:"📊 Summary"},
                  {id:"sales_reg",l:"🧾 Sales Register"},
                  {id:"purchase_reg",l:"📦 Purchase Register"},
                  {id:"stock",l:"📋 Stock Report"},
                  {id:"item_wise",l:"💊 Item Wise"},
                  {id:"doctor_wise",l:"🩺 Doctor Wise"},
                  {id:"daily",l:"📅 Daily Summary"},
                ].map(t=>(
                  <button key={t.id} onClick={()=>setReportSubTab(t.id)} style={{padding:"7px 12px",border:"none",borderRadius:"6px",cursor:"pointer",fontWeight:"700",fontSize:"11px",background:reportSubTab===t.id?"white":"transparent",color:reportSubTab===t.id?"#1a3a5c":"#64748b",boxShadow:reportSubTab===t.id?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>{t.l}</button>
                ))}
              </div>
              {reportSubTab==="summary"&&(<>
              {/* Stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"12px",marginBottom:"20px"}}>
                {[
                  {l:"Sales",val:"₹"+fmt(revenue,0),color:"#16a34a",bg:"#f0fdf4"},
                  {l:"Purchase",val:"₹"+fmt(purchaseTotal,0),color:"#3b82f6",bg:"#eff6ff"},
                  {l:"Returns",val:"₹"+fmt(returns,0),color:"#ef4444",bg:"#fef2f2"},
                  {l:"Gross Profit",val:"₹"+fmt(profit,0),color:profit>=0?"#16a34a":"#ef4444",bg:profit>=0?"#f0fdf4":"#fef2f2"},
                  {l:"Bills",val:fOrders.length,color:"#8b5cf6",bg:"#f5f3ff"},
                  {l:"Expired",val:expiredItems.length,color:"#ef4444",bg:"#fef2f2"},
                  {l:"Expiring Soon",val:expiringItems.length,color:"#fd7e14",bg:"#fff7ed"},
                  {l:"Low Stock",val:lowStockItems.length,color:"#f59e0b",bg:"#fffbeb"},
                ].map(s=>(
                  <div key={s.l} style={{background:s.bg,borderRadius:"5px",padding:"12px 14px",border:`1px solid ${s.color}22`}}>
                    <div style={{fontSize:"20px",fontWeight:"800",color:s.color}}>{s.val}</div>
                    <div style={{fontSize:"11px",color:"#64748b"}}>{s.l}</div>
                  </div>
                ))}
              </div>
              {/* Expiry Alerts */}
              {expiredItems.length>0&&(
                <div style={{background:"white",borderRadius:"6px",border:"1px solid #fecaca",marginBottom:"14px",overflow:"hidden"}}>
                  <div style={{background:"#fef2f2",padding:"10px 14px",fontWeight:"700",fontSize:"13px",color:"#dc2626"}}>🚫 Expired Items ({expiredItems.length})</div>
                  {expiredItems.map(item=>{const dv=getDivision(item.division);return (<div key={item.id} style={{padding:"10px 14px",borderTop:"1px solid #fee2e2",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontWeight:"600",fontSize:"13px"}}>{dv.icon} {item.name}</div><div style={{fontSize:"11px",color:"#dc2626"}}>Exp: {item.expiryDate} · Stock: {item.stock}</div></div>
                    <button onClick={()=>handleDeleteItem(item.id)} style={{...btn("#dc3545"),fontSize:"11px",padding:"5px 9px"}}><Trash2 size={11}/>Remove</button>
                  </div>);})}
                </div>
              )}
              {expiringItems.length>0&&(
                <div style={{background:"white",borderRadius:"6px",border:"1px solid #fdba74",marginBottom:"14px",overflow:"hidden"}}>
                  <div style={{background:"#fff7ed",padding:"10px 14px",fontWeight:"700",fontSize:"13px",color:"#c2410c"}}>⏰ Expiring Soon ({expiringItems.length})</div>
                  {expiringItems.map(item=>{const dv=getDivision(item.division);const days=Math.floor(((parseExpiry(item.expiryDate)||new Date())-new Date())/86400000);return (<div key={item.id} style={{padding:"10px 14px",borderTop:"1px solid #fed7aa",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontWeight:"600",fontSize:"13px"}}>{dv.icon} {item.name}</div><div style={{fontSize:"11px",color:"#c2410c"}}>{days} din bachya · Stock: {item.stock}</div></div>
                    <button onClick={()=>{setQuickStockItem(item);setQuickQty("");setActiveSection("inventory");setOwnerSubTab(item.division);}} style={{...btn("#fd7e14"),fontSize:"11px",padding:"5px 9px"}}>+📦 Stock</button>
                  </div>);})}
                </div>
              )}
              {lowStockItems.length>0&&(
                <div style={{background:"white",borderRadius:"6px",border:"1px solid #fde68a",marginBottom:"14px",overflow:"hidden"}}>
                  <div style={{background:"#fffbeb",padding:"10px 14px",fontWeight:"700",fontSize:"13px",color:"#b45309"}}>📉 Low Stock ({lowStockItems.length})</div>
                  {lowStockItems.map(item=>{const dv=getDivision(item.division);return (<div key={item.id} style={{padding:"10px 14px",borderTop:"1px solid #fef3c7",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontWeight:"600",fontSize:"13px"}}>{dv.icon} {item.name}</div><div style={{fontSize:"11px",color:"#b45309"}}>Current: {item.stock} · Min: {item.minimum||5}</div></div>
                    <button onClick={()=>{setQuickStockItem(item);setQuickQty("");}} style={{...btn("#198754"),fontSize:"11px",padding:"5px 9px"}}>+📦 Stock</button>
                  </div>);})}
                </div>
              )}
              {/* Recent Sales */}
              {fOrders.length>0&&(
                <div style={{background:"white",borderRadius:"6px",padding:"16px",border:"1px solid #dee2e6"}}>
                  <h4 style={{margin:"0 0 12px",fontSize:"14px",fontWeight:"700"}}>Recent Sales Bills</h4>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px",minWidth:"380px"}}>
                      <thead><tr style={{background:"#1a3a5c"}}>{["Bill","Patient","Items","Mode","Net Amount"].map(h=><th key={h} style={{padding:"8px",textAlign:h==="Net Amount"?"right":"left",fontWeight:"600",color:"white"}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {[...fOrders].reverse().slice(0,15).map(b=>(
                          <tr key={b.id} style={{borderBottom:"1px solid #e9ecef"}}>
                            <td style={{padding:"8px"}}><div style={{fontWeight:"600"}}>#{b.billNo}</div><div style={{fontSize:"10px",color:"#94a3b8"}}>{new Date(b.date).toLocaleDateString("en-IN")}</div></td>
                            <td style={{padding:"8px"}}>{b.patientName||"—"}</td>
                            <td style={{padding:"8px"}}>{b.items?.filter(si=>si.itemId).length||0}</td>
                            <td style={{padding:"8px",textTransform:"uppercase",fontSize:"11px"}}>{b.paymentMode}</td>
                            <td style={{padding:"8px",textAlign:"right",fontWeight:"700",color:"#16a34a"}}>₹{fmt(num(b.netAmount))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Stock Statement */}
              <div style={{background:"white",borderRadius:"6px",border:"1px solid #dee2e6",marginBottom:"14px",overflow:"hidden"}}>
                <div style={{background:"#1a3a5c",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
                  <h4 style={{margin:0,fontSize:"13px",fontWeight:"700"}}>📦 Stock Statement</h4>
                  <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                    <select value={stockReportComp} onChange={e=>setStockReportComp(e.target.value)} style={{...inp,width:"auto",fontSize:"12px",padding:"5px 8px"}}>
                      <option value="">All Companies</option>
                      {[...new Set(items.map(i=>i.company).filter(Boolean))].map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={stockReportSupp} onChange={e=>setStockReportSupp(e.target.value)} style={{...inp,width:"auto",fontSize:"12px",padding:"5px 8px"}}>
                      <option value="">All Suppliers</option>
                      {suppliers.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px",minWidth:"750px"}}>
                    <thead><tr style={{background:"#f1f5f9"}}>{["No","Item Name","Loc","Company","Unit","Batch","ExpDt","Stock","Exp Qty","Qty","MRP","P.Rate","Amt","ST"].map(h=><th key={h} style={{padding:"7px 8px",textAlign:["Stock","Qty","MRP","P.Rate","Amt"].includes(h)?"right":"left",fontWeight:"700",color:"#475569",fontSize:"10px",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {items.filter(i=>(!stockReportComp||i.company===stockReportComp)&&(!stockReportSupp||i.supplier===stockReportSupp)).map((item,idx)=>{
                        const exp=isExpired(item.expiryDate),expSoon=isExpiringSoon(item.expiryDate);
                        const dv=getDivision(item.division);
                        return(
                          <tr key={item.id} style={{borderBottom:"1px solid #e9ecef",background:exp?"#fef2f2":expSoon?"#fff7ed":"white"}}>
                            <td style={{padding:"6px 8px",color:"#94a3b8",fontWeight:"600"}}>{idx+1}</td>
                            <td style={{padding:"6px 8px",fontWeight:"600"}}>{dv.icon} {item.name}</td>
                            <td style={{padding:"6px 8px",color:"#64748b"}}>{item.location||"—"}</td>
                            <td style={{padding:"6px 8px",color:"#64748b",fontSize:"11px"}}>{item.company||"—"}</td>
                            <td style={{padding:"6px 8px"}}>{item.unit||"pcs"}</td>
                            <td style={{padding:"6px 8px"}}>{item.batchNo||"—"}</td>
                            <td style={{padding:"6px 8px",fontSize:"11px",color:exp?"#ef4444":expSoon?"#fd7e14":"inherit"}}>{item.expiryDate||"—"}</td>
                            <td style={{padding:"6px 8px",textAlign:"right",fontWeight:"700",color:item.stock<=0?"#ef4444":item.stock<=(item.minimum||5)?"#fd7e14":"#16a34a"}}>{item.stock}</td>
                            <td style={{padding:"6px 8px",textAlign:"right"}}>{exp?item.stock:0}</td>
                            <td style={{padding:"6px 8px",textAlign:"right"}}>{item.stock}</td>
                            <td style={{padding:"6px 8px",textAlign:"right"}}>₹{fmt(item.mrp||item.price)}</td>
                            <td style={{padding:"6px 8px",textAlign:"right"}}>₹{fmt(item.pRate||0)}</td>
                            <td style={{padding:"6px 8px",textAlign:"right",fontWeight:"600"}}>₹{fmt(num(item.pRate||0)*int(item.stock))}</td>
                            <td style={{padding:"6px 8px"}}><span style={{background:exp?"#fef2f2":expSoon?"#fff7ed":item.stock>0?"#f0fdf4":"#f1f5f9",color:exp?"#ef4444":expSoon?"#fd7e14":item.stock>0?"#16a34a":"#94a3b8",padding:"1px 5px",borderRadius:"4px",fontSize:"10px",fontWeight:"700"}}>{exp?"EXP":expSoon?"SOON":item.stock>0?"OK":"OOS"}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot><tr>
                      <td colSpan="12" style={{padding:"8px",textAlign:"right",fontWeight:"700",borderTop:"2px solid #e2e8f0"}}>Total Stock Value:</td>
                      <td style={{padding:"8px",textAlign:"right",fontWeight:"800",color:"#16a34a",borderTop:"2px solid #e2e8f0"}}>₹{fmt(items.filter(i=>(!stockReportComp||i.company===stockReportComp)).reduce((s,i)=>s+num(i.pRate||0)*int(i.stock),0))}</td>
                      <td style={{borderTop:"2px solid #e2e8f0"}}></td>
                    </tr></tfoot>
                  </table>
                </div>
              </div>
              </>)}

              {/* ─── SALES REGISTER ─── */}
              {reportSubTab==="sales_reg"&&(
                <div style={{background:"white",borderRadius:"8px",border:"1px solid #e2e8f0",overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontWeight:"700",fontSize:"14px"}}>🧾 Sales Register ({fOrders.length} bills)</div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                      <thead><tr style={{background:"#1a3a5c",color:"white"}}>
                        {["#","Date","Bill No","Patient","Doctor","Items","Payment","Amount"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:"700"}}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {fOrders.length===0?<tr><td colSpan={8} style={{padding:"20px",textAlign:"center",color:"#94a3b8"}}>No bills found</td></tr>:
                        [...fOrders].reverse().map((b,i)=>(
                          <tr key={b.id} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"white":"#fafafa"}}>
                            <td style={{padding:"8px 10px",color:"#64748b"}}>{fOrders.length-i}</td>
                            <td style={{padding:"8px 10px"}}>{new Date(b.date).toLocaleDateString("en-IN")}</td>
                            <td style={{padding:"8px 10px",fontWeight:"600"}}>{b.billNo||"—"}</td>
                            <td style={{padding:"8px 10px"}}>{b.patientName||"—"}</td>
                            <td style={{padding:"8px 10px",color:"#3b82f6"}}>{b.doctorName||"—"}</td>
                            <td style={{padding:"8px 10px"}}>{b.items?.length||0}</td>
                            <td style={{padding:"8px 10px",textTransform:"uppercase"}}>{b.paymentMode||"cash"}</td>
                            <td style={{padding:"8px 10px",fontWeight:"800",color:"#16a34a"}}>₹{fmt(b.netAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr style={{background:"#f0fdf4",fontWeight:"800"}}>
                        <td colSpan={7} style={{padding:"8px 10px",textAlign:"right"}}>Total:</td>
                        <td style={{padding:"8px 10px",color:"#16a34a"}}>₹{fmt(fOrders.reduce((s,b)=>s+num(b.netAmount),0))}</td>
                      </tr></tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* ─── PURCHASE REGISTER ─── */}
              {reportSubTab==="purchase_reg"&&(
                <div style={{background:"white",borderRadius:"8px",border:"1px solid #e2e8f0",overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontWeight:"700",fontSize:"14px"}}>📦 Purchase Register ({purchaseBills.length} bills)</div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                      <thead><tr style={{background:"#1a3a5c",color:"white"}}>
                        {["#","Date","Entry","Bill No","Supplier","Items","Payment","Amount"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:"700"}}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {purchaseBills.length===0?<tr><td colSpan={8} style={{padding:"20px",textAlign:"center",color:"#94a3b8"}}>No purchase bills</td></tr>:
                        [...purchaseBills].reverse().map((b,i)=>(
                          <tr key={b.id} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"white":"#fafafa"}}>
                            <td style={{padding:"8px 10px",color:"#64748b"}}>{purchaseBills.length-i}</td>
                            <td style={{padding:"8px 10px"}}>{b.billDate||"—"}</td>
                            <td style={{padding:"8px 10px",color:"#8b5cf6",fontWeight:"600"}}>E#{b.entryNo||"—"}</td>
                            <td style={{padding:"8px 10px",fontWeight:"600"}}>{b.billNo||"—"}</td>
                            <td style={{padding:"8px 10px"}}>{b.partyName||"—"}</td>
                            <td style={{padding:"8px 10px"}}>{b.items?.length||0}</td>
                            <td style={{padding:"8px 10px",textTransform:"uppercase"}}>{b.paymentMode||"cash"}</td>
                            <td style={{padding:"8px 10px",fontWeight:"800",color:"#3b82f6"}}>₹{fmt(b.total||b.finalTotal||b.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr style={{background:"#eff6ff",fontWeight:"800"}}>
                        <td colSpan={7} style={{padding:"8px 10px",textAlign:"right"}}>Total:</td>
                        <td style={{padding:"8px 10px",color:"#3b82f6"}}>₹{fmt(purchaseBills.reduce((s,b)=>s+num(b.total||b.finalTotal||b.totalAmount),0))}</td>
                      </tr></tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* ─── STOCK REPORT ─── */}
              {reportSubTab==="stock"&&(
                <div style={{background:"white",borderRadius:"8px",border:"1px solid #e2e8f0",overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontWeight:"700",fontSize:"14px"}}>📋 Stock Report ({items.length} items)</div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                      <thead><tr style={{background:"#1a3a5c",color:"white"}}>
                        {["Item Name","Division","GST%","MRP","Rate","Stock","Expiry","Status"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:"700"}}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {items.length===0?<tr><td colSpan={8} style={{padding:"20px",textAlign:"center",color:"#94a3b8"}}>No items</td></tr>:
                        [...items].sort((a,b)=>a.name.localeCompare(b.name)).map((item,i)=>{
                          const expired=isExpired(item.expiryDate);
                          const expiring=isExpiringSoon(item.expiryDate)&&!expired;
                          const lowStock=item.stock>0&&item.stock<=(item.minimum||5);
                          return(
                            <tr key={item.id} style={{borderBottom:"1px solid #f1f5f9",background:expired?"#fef2f2":expiring?"#fff7ed":i%2===0?"white":"#fafafa"}}>
                              <td style={{padding:"8px 10px",fontWeight:"600"}}>{item.name}</td>
                              <td style={{padding:"8px 10px"}}>{getDivision(item.division).label}</td>
                              <td style={{padding:"8px 10px",textAlign:"center"}}>{item.gst||0}%</td>
                              <td style={{padding:"8px 10px"}}>₹{fmt(item.mrp)}</td>
                              <td style={{padding:"8px 10px"}}>₹{fmt(item.price)}</td>
                              <td style={{padding:"8px 10px",fontWeight:"800",color:item.stock<=0?"#ef4444":lowStock?"#f59e0b":"#16a34a"}}>{item.stock||0}</td>
                              <td style={{padding:"8px 10px",color:expired?"#ef4444":expiring?"#f59e0b":"#374151"}}>{item.expiryDate||"—"}</td>
                              <td style={{padding:"8px 10px"}}>
                                {expired&&<span style={{background:"#fef2f2",color:"#ef4444",padding:"2px 7px",borderRadius:"10px",fontSize:"10px",fontWeight:"700"}}>EXPIRED</span>}
                                {expiring&&<span style={{background:"#fff7ed",color:"#f59e0b",padding:"2px 7px",borderRadius:"10px",fontSize:"10px",fontWeight:"700"}}>EXPIRING</span>}
                                {lowStock&&!expired&&!expiring&&<span style={{background:"#fffbeb",color:"#d97706",padding:"2px 7px",borderRadius:"10px",fontSize:"10px",fontWeight:"700"}}>LOW</span>}
                                {!expired&&!expiring&&!lowStock&&item.stock>0&&<span style={{background:"#f0fdf4",color:"#16a34a",padding:"2px 7px",borderRadius:"10px",fontSize:"10px",fontWeight:"700"}}>OK</span>}
                                {item.stock<=0&&<span style={{background:"#f1f5f9",color:"#94a3b8",padding:"2px 7px",borderRadius:"10px",fontSize:"10px",fontWeight:"700"}}>OUT</span>}
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
              {reportSubTab==="item_wise"&&(()=>{
                const itemSales={};
                fOrders.forEach(b=>b.items&&b.items.forEach(it=>{
                  if(!itemSales[it.itemName]) itemSales[it.itemName]={name:it.itemName,qty:0,amount:0,bills:0};
                  itemSales[it.itemName].qty+=int(it.qty);
                  itemSales[it.itemName].amount+=num(it.amount||0);
                  itemSales[it.itemName].bills+=1;
                }));
                const rows=Object.values(itemSales).sort((a,b)=>b.amount-a.amount);
                return(
                  <div style={{background:"white",borderRadius:"8px",border:"1px solid #e2e8f0",overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontWeight:"700",fontSize:"14px"}}>💊 Item Wise Sale ({rows.length} items)</div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                      <thead><tr style={{background:"#1a3a5c",color:"white"}}>
                        {["#","Item Name","Qty Sold","Bills","Amount"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:"700"}}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {rows.length===0?<tr><td colSpan={5} style={{padding:"20px",textAlign:"center",color:"#94a3b8"}}>No sales data</td></tr>:
                        rows.map((r,i)=>(
                          <tr key={r.name} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"white":"#fafafa"}}>
                            <td style={{padding:"8px 10px",color:"#64748b"}}>{i+1}</td>
                            <td style={{padding:"8px 10px",fontWeight:"600"}}>{r.name}</td>
                            <td style={{padding:"8px 10px",textAlign:"center",fontWeight:"700",color:"#3b82f6"}}>{r.qty}</td>
                            <td style={{padding:"8px 10px",textAlign:"center"}}>{r.bills}</td>
                            <td style={{padding:"8px 10px",fontWeight:"800",color:"#16a34a"}}>₹{fmt(r.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* ─── DOCTOR WISE ─── */}
              {reportSubTab==="doctor_wise"&&(()=>{
                const docSales={};
                fOrders.forEach(b=>{
                  const doc=b.doctorName||"No Doctor";
                  if(!docSales[doc]) docSales[doc]={name:doc,bills:0,amount:0,patients:new Set()};
                  docSales[doc].bills+=1;
                  docSales[doc].amount+=num(b.netAmount);
                  if(b.patientName) docSales[doc].patients.add(b.patientName);
                });
                const rows=Object.values(docSales).sort((a,b)=>b.amount-a.amount);
                return(
                  <div style={{background:"white",borderRadius:"8px",border:"1px solid #e2e8f0",overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontWeight:"700",fontSize:"14px"}}>👨‍⚕️ Doctor Wise Sales ({rows.length} doctors)</div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                      <thead><tr style={{background:"#1a3a5c",color:"white"}}>
                        {["#","Doctor Name","Bills","Patients","Amount"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:"700"}}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {rows.length===0?<tr><td colSpan={5} style={{padding:"20px",textAlign:"center",color:"#94a3b8"}}>No data</td></tr>:
                        rows.map((r,i)=>(
                          <tr key={r.name} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"white":"#fafafa"}}>
                            <td style={{padding:"8px 10px",color:"#64748b"}}>{i+1}</td>
                            <td style={{padding:"8px 10px",fontWeight:"600",color:"#1d4ed8"}}>{r.name}</td>
                            <td style={{padding:"8px 10px",textAlign:"center",fontWeight:"700"}}>{r.bills}</td>
                            <td style={{padding:"8px 10px",textAlign:"center"}}>{r.patients.size}</td>
                            <td style={{padding:"8px 10px",fontWeight:"800",color:"#16a34a"}}>₹{fmt(r.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* ─── DAILY SUMMARY ─── */}
              {reportSubTab==="daily"&&(()=>{
                const dailyMap={};
                salesBills.filter(b=>!b.isReturn).forEach(b=>{
                  const d=new Date(b.date).toLocaleDateString("en-IN");
                  if(!dailyMap[d]) dailyMap[d]={date:d,bills:0,amount:0,dateObj:new Date(b.date)};
                  dailyMap[d].bills+=1; dailyMap[d].amount+=num(b.netAmount);
                });
                const rows=Object.values(dailyMap).sort((a,b)=>b.dateObj-a.dateObj);
                return(
                  <div style={{background:"white",borderRadius:"8px",border:"1px solid #e2e8f0",overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontWeight:"700",fontSize:"14px"}}>📅 Daily Sales Summary</div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                      <thead><tr style={{background:"#1a3a5c",color:"white"}}>
                        {["Date","Bills","Amount"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:"700"}}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {rows.length===0?<tr><td colSpan={3} style={{padding:"20px",textAlign:"center",color:"#94a3b8"}}>No data</td></tr>:
                        rows.map((r,i)=>(
                          <tr key={r.date} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"white":"#fafafa"}}>
                            <td style={{padding:"9px 10px",fontWeight:"600"}}>{r.date}</td>
                            <td style={{padding:"9px 10px",textAlign:"center",color:"#3b82f6",fontWeight:"700"}}>{r.bills}</td>
                            <td style={{padding:"9px 10px",fontWeight:"800",color:"#16a34a"}}>₹{fmt(r.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr style={{background:"#f0fdf4",fontWeight:"800"}}>
                        <td colSpan={2} style={{padding:"8px 10px",textAlign:"right"}}>Total:</td>
                        <td style={{padding:"8px 10px",color:"#16a34a"}}>₹{fmt(rows.reduce((s,r)=>s+r.amount,0))}</td>
                      </tr></tfoot>
                    </table>
                  </div>
                );
              })()}

          </>
          );
        })()}

        {/* ══════════════════════════════════════════
            OWNER: BANK ENTRY
        ══════════════════════════════════════════ */}
        {isOwner&&activeSection==="bank"&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",flexWrap:"wrap",gap:"10px"}}>
              <h2 style={{margin:0,fontSize:"18px",fontWeight:"800"}}>🏦 Bank Entry ({bankEntries.length})</h2>
              <button onClick={()=>setShowBankForm(p=>!p)} style={{...btn()}}><Plus size={14}/>New Entry</button>
            </div>
            {showBankForm&&(
              <div style={{background:"white",borderRadius:"12px",padding:"18px",marginBottom:"14px",border:"2px solid #bfdbfe"}}>
                <h3 style={{margin:"0 0 14px",fontSize:"14px",fontWeight:"700"}}>🏦 New Bank Voucher</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:"10px",marginBottom:"14px"}}>
                  <div><label style={lbl}>Date</label><input type="date" value={bankForm.date||today()} onChange={e=>setBankForm({...bankForm,date:e.target.value})} style={inp}/></div>
                  <div><label style={lbl}>Type</label><select value={bankForm.type||"deposit"} onChange={e=>setBankForm({...bankForm,type:e.target.value})} style={inp}><option value="deposit">Deposit (DR)</option><option value="withdraw">Withdraw (CR)</option><option value="transfer">Transfer</option></select></div>
                  <div><label style={lbl}>Account Name</label><input list="supp-bank" value={bankForm.accountName||""} onChange={e=>setBankForm({...bankForm,accountName:e.target.value})} placeholder="Party name" style={inp}/><datalist id="supp-bank">{suppliers.map(s=><option key={s.id} value={s.name}/>)}</datalist></div>
                  <div><label style={lbl}>Bank</label><input value={bankForm.bank||""} onChange={e=>setBankForm({...bankForm,bank:e.target.value})} placeholder="Bank name" style={inp}/></div>
                  <div><label style={lbl}>Chq No / Ref</label><input value={bankForm.chequeNo||""} onChange={e=>setBankForm({...bankForm,chequeNo:e.target.value})} placeholder="Cheque/NEFT ref" style={inp}/></div>
                  <div><label style={lbl}>Amount (₹) *</label><input type="number" value={bankForm.amount||""} onChange={e=>setBankForm({...bankForm,amount:e.target.value})} placeholder="0.00" style={inp}/></div>
                </div>
                <div style={{display:"flex",gap:"8px"}}>
                  <button onClick={()=>{if(!bankForm.accountName||!bankForm.amount){showToast("Account and amount required","error");return;}const e={id:uid(),vchNo:bankEntries.length+1,...bankForm,date:bankForm.date||today(),createdAt:new Date().toISOString()};saveBankEntries([...bankEntries,e]);setBankForm({date:today(),type:"deposit",accountName:"",bank:"",amount:"",chequeNo:"",remark:""});setShowBankForm(false);showToast("Bank entry saved!");}} style={{...btn("#16a34a")}}><CheckCircle size={13}/>Save</button>
                  <button onClick={()=>setShowBankForm(false)} style={{...btn("#64748b")}}><X size={13}/>Cancel</button>
                </div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"14px"}}>
              <div style={{background:"#f0fdf4",borderRadius:"10px",padding:"14px"}}><div style={{fontSize:"20px",fontWeight:"800",color:"#16a34a"}}>₹{fmt(bankEntries.filter(e=>e.type==="deposit").reduce((s,e)=>s+num(e.amount),0),0)}</div><div style={{fontSize:"11px",color:"#64748b"}}>Total Deposits</div></div>
              <div style={{background:"#fef2f2",borderRadius:"10px",padding:"14px"}}><div style={{fontSize:"20px",fontWeight:"800",color:"#ef4444"}}>₹{fmt(bankEntries.filter(e=>e.type==="withdraw").reduce((s,e)=>s+num(e.amount),0),0)}</div><div style={{fontSize:"11px",color:"#64748b"}}>Total Withdrawals</div></div>
              <div style={{background:"#eff6ff",borderRadius:"10px",padding:"14px"}}><div style={{fontSize:"20px",fontWeight:"800",color:"#3b82f6"}}>{bankEntries.length}</div><div style={{fontSize:"11px",color:"#64748b"}}>Total Entries</div></div>
            </div>
            {bankEntries.length===0?(
              <div style={{textAlign:"center",padding:"50px",color:"#94a3b8"}}><div style={{fontSize:"40px"}}>🏦</div><p>No bank entries found. Click New Entry to add.</p></div>
            ):(
              <div style={{background:"white",borderRadius:"12px",border:"1px solid #e2e8f0",overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                  <thead><tr style={{background:"#f8fafc"}}>{["Vch#","Date","Type","Account","Bank","Cheque/Ref","Amount"].map(h=><th key={h} style={{padding:"9px 12px",textAlign:h==="Amount"?"right":"left",fontWeight:"700",color:"#475569",fontSize:"11px"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[...bankEntries].reverse().map(e=>(
                      <tr key={e.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                        <td style={{padding:"9px 12px",color:"#64748b"}}>#{e.vchNo}</td>
                        <td style={{padding:"9px 12px"}}>{e.date}</td>
                        <td style={{padding:"9px 12px"}}><span style={{background:e.type==="deposit"?"#d1fae5":e.type==="withdraw"?"#fee2e2":"#dbeafe",color:e.type==="deposit"?"#065f46":e.type==="withdraw"?"#991b1b":"#1d4ed8",padding:"2px 8px",borderRadius:"10px",fontSize:"11px",fontWeight:"700",textTransform:"capitalize"}}>{e.type}</span></td>
                        <td style={{padding:"9px 12px",fontWeight:"600"}}>{e.accountName}</td>
                        <td style={{padding:"9px 12px"}}>{e.bank||"—"}</td>
                        <td style={{padding:"9px 12px",color:"#64748b"}}>{e.chequeNo||"—"}</td>
                        <td style={{padding:"9px 12px",textAlign:"right",fontWeight:"800",color:e.type==="deposit"?"#16a34a":"#ef4444"}}>₹{fmt(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

                {/* ══════════════════════════════════════════
            OWNER: GST 2.0 UPDATE
        ══════════════════════════════════════════ */}
        {isOwner&&activeSection==="gst2"&&(
          <>
            <h2 style={{margin:"0 0 16px",fontSize:"18px",fontWeight:"800"}}>📋 GST 2.0 (Gen2) Update</h2>
            <div style={{background:"#fffbeb",border:"2px solid #fde68a",borderRadius:"12px",padding:"18px",marginBottom:"16px"}}>
              <h3 style={{margin:"0 0 12px",color:"#b45309",fontSize:"14px",fontWeight:"800"}}>⚠️ IMPORTANT STEPS Before GST 2.0 Update</h3>
              <ol style={{margin:0,paddingLeft:"20px",fontSize:"13px",color:"#78350f",lineHeight:"2"}}>
                <li>Watch video on right side before proceeding</li>
                <li><strong>Take Backup first</strong> (very important)</li>
                <li>Ask Tax consultant/CA before updating tax</li>
                <li>Enter pending purchase / clear challan before 22nd</li>
                <li>If tax is applicable on IPD Patient bill, convert to bill before 22nd (you can keep some purchase/sales blank bills on 21st, which can be modified later)</li>
                <li>On 22nd click on [Apply GST 2.0] and then [I Agree]</li>
              </ol>
            </div>
            <div style={{background:"white",borderRadius:"12px",padding:"18px",border:"1px solid #e2e8f0",marginBottom:"16px"}}>
              <h3 style={{margin:"0 0 14px",fontSize:"14px",fontWeight:"700"}}>GST Rate Update Tool</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"10px",marginBottom:"14px"}}>
                <div><label style={lbl}>Tax%</label><select style={inp}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</select></div>
                <div><label style={lbl}>New Tax%</label><select style={inp}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</select></div>
                <div style={{display:"flex",alignItems:"flex-end"}}><label style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"12px",cursor:"pointer",paddingBottom:"2px"}}><input type="checkbox"/><span style={{fontWeight:"600"}}>Only Transaction</span></label></div>
                <div><label style={lbl}>Item Type</label><select style={inp}><option>All</option><option>Medicines</option><option>Surgical</option><option>Generic</option></select></div>
                <div><label style={lbl}>Category</label><input style={inp} placeholder="All categories"/></div>
                <div><label style={lbl}>Company</label><input style={inp} placeholder="All companies"/></div>
                <div><label style={lbl}>Tax Type</label><select style={inp}><option>All</option><option>Taxable</option><option>Exempt</option></select></div>
                <div><label style={lbl}>Search from List</label><input style={inp} placeholder="Item search..."/></div>
              </div>
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"12px"}}>
                <button style={{...btn("#3b82f6"),fontSize:"12px"}}>Show Items</button>
                <button onClick={()=>showToast("GST update applied to all listed items!")} style={{...btn("#16a34a"),fontSize:"12px"}}>✓ Apply GST (Update Above)</button>
                <button style={{...btn("#f59e0b","#000"),fontSize:"12px"}}>Update GST% from Old Purchase</button>
                <button onClick={()=>setActiveSection("home")} style={{...btn("#64748b"),fontSize:"12px"}}><X size={13}/>Close</button>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                  <thead><tr style={{background:"#f1f5f9"}}>{["Sr","Code","Item Name","HSN/CIF","GST Before 22nd","GST After 22nd","Company","Updated"].map(h=><th key={h} style={{padding:"7px 10px",textAlign:"left",fontWeight:"700",color:"#475569",fontSize:"11px"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {items.slice(0,8).map((item,idx)=>(
                      <tr key={item.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                        <td style={{padding:"6px 10px",color:"#94a3b8"}}>{idx+1}</td>
                        <td style={{padding:"6px 10px",color:"#64748b"}}>{item.code||"—"}</td>
                        <td style={{padding:"6px 10px",fontWeight:"600"}}>{getDivision(item.division).icon} {item.name}</td>
                        <td style={{padding:"6px 10px"}}>{item.hsn||"—"}</td>
                        <td style={{padding:"6px 10px",color:"#64748b"}}>{item.gst||0}%</td>
                        <td style={{padding:"6px 10px",color:"#16a34a",fontWeight:"700"}}>{item.gst||0}%</td>
                        <td style={{padding:"6px 10px",color:"#64748b"}}>{item.company||"—"}</td>
                        <td style={{padding:"6px 10px"}}><span style={{background:"#f0fdf4",color:"#16a34a",padding:"1px 6px",borderRadius:"4px",fontSize:"10px",fontWeight:"700"}}>✓</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {items.length===0&&<div style={{textAlign:"center",padding:"20px",color:"#94a3b8",fontSize:"13px"}}>No items found. Add items to inventory first.</div>}
              </div>
            </div>
            <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:"10px",padding:"14px",fontSize:"13px",color:"#1d4ed8"}}>
              <strong>ℹ️ GST 2.0 Not Implemented?</strong> Whatsapp "UPDATE GST2.0" on +91 9825280063
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            OWNER: MASTERS (Suppliers + Customers)
        ══════════════════════════════════════════ */}
        {isOwner&&activeSection==="masters"&&(
          <>
            <div style={{display:"flex",background:"#f1f5f9",borderRadius:"5px",padding:"4px",marginBottom:"16px",gap:"4px"}}>
              {[{id:"suppliers",label:"🏭 Suppliers"},{id:"doctors",label:"🩺 Doctors"},{id:"customers",label:"👥 Customers"}].map(t=>(
                <button key={t.id} onClick={()=>setOwnerSubTab(t.id)} style={{flex:1,padding:"8px",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"700",fontSize:"12px",background:ownerSubTab===t.id?"white":"transparent",color:ownerSubTab===t.id?"#3b82f6":"#64748b"}}>{t.label}</button>
              ))}
            </div>

            {/* Suppliers */}
            {(!ownerSubTab||ownerSubTab==="suppliers")&&(
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
                  <h2 style={{margin:0,fontSize:"17px",fontWeight:"800"}}>🏭 Suppliers ({suppliers.length})</h2>
                  <button onClick={()=>openSupplierForm()} style={{...btn()}}><Plus size={14}/>Add Supplier</button>
                </div>
            {/* UPI Payment Setup */}
            <div style={{background:"white",borderRadius:"6px",padding:"16px",border:"2px solid #3b82f6",marginBottom:"18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                <h3 style={{margin:0,fontSize:"13px",fontWeight:"700",color:"#1d4ed8"}}>📱 UPI Payment Setup</h3>
                <button onClick={()=>setShowUpiSetup(p=>!p)} style={{...btn("#3b82f6"),fontSize:"12px",padding:"5px 12px"}}>{showUpiSetup?"Hide":"Edit"}</button>
              </div>
              {upiSettings.upiId?(<div style={{fontSize:"13px",color:"#374151"}}>UPI ID: <strong>{upiSettings.upiId}</strong> ({upiSettings.upiName})</div>):<div style={{fontSize:"12px",color:"#ef4444"}}>⚠️ UPI not configured — customers cannot pay online</div>}
              {showUpiSetup&&(
                <div style={{marginTop:"12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                  <div><label style={lbl}>UPI ID *</label><input value={upiSettings.upiId||""} onChange={e=>setUpiSettings({...upiSettings,upiId:e.target.value})} placeholder="e.g. 9825280063@paytm" style={{...inp,textTransform:"none"}}/></div>
                  <div><label style={lbl}>Account Name</label><input value={upiSettings.upiName||""} onChange={e=>setUpiSettings({...upiSettings,upiName:e.target.value.toUpperCase()})} placeholder="Store name" style={inp}/></div>
                  <div style={{gridColumn:"1/-1"}}><label style={lbl}>Note for Customer</label><input value={upiSettings.qrNote||""} onChange={e=>setUpiSettings({...upiSettings,qrNote:e.target.value.toUpperCase()})} placeholder="e.g. After payment enter UTR number" style={inp}/></div>
                  <div style={{gridColumn:"1/-1"}}>
                    <button onClick={async()=>{await save("store_upi_settings",upiSettings);setShowUpiSetup(false);showToast("UPI settings saved!");}} style={{...btn("#16a34a")}}><CheckCircle size={13}/>Save UPI Settings</button>
                  </div>
                </div>
              )}
            </div>

                {showSupplierForm&&(
                  <div style={{background:"white",borderRadius:"6px",padding:"18px",marginBottom:"14px",border:"2px solid #bfdbfe"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"14px"}}>
                      <h3 style={{margin:0,fontSize:"13px",fontWeight:"700",color:"#1a3a5c"}}>{editingSupplier?"✏️ Edit":"➕ Add"} Account / Supplier</h3>
                      <button onClick={()=>{setShowSupplierForm(false);setEditingSupplier(null);}} style={{background:"none",border:"none",cursor:"pointer"}}><X size={18}/></button>
                    </div>
                    {/* Basic Info */}
                    <div style={{background:"#f8fafc",borderRadius:"6px",padding:"12px",marginBottom:"10px"}}>
                      <div style={{fontSize:"11px",fontWeight:"700",color:"#64748b",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Basic Detail</div>
                      <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr",gap:"8px",marginBottom:"8px"}}>
                        <div><label style={lbl}>Name... *</label><input value={supplierForm.name||""} onChange={e=>setSupplierForm({...supplierForm,name:e.target.value})} style={inp} placeholder="Party/Supplier name"/></div>
                        <div><label style={lbl}>Address:</label><input value={supplierForm.address||""} onChange={e=>setSupplierForm({...supplierForm,address:e.target.value})} style={inp} placeholder="Address"/></div>
                        <div><label style={lbl}>Area...:</label><input value={supplierForm.area||""} onChange={e=>setSupplierForm({...supplierForm,area:e.target.value})} style={inp} placeholder="Area"/></div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"8px"}}>
                        <div><label style={lbl}>City..:</label><input value={supplierForm.city||""} onChange={e=>setSupplierForm({...supplierForm,city:e.target.value})} style={inp} placeholder="City"/></div>
                        <div><label style={lbl}>Contact:</label><input value={supplierForm.contact||""} onChange={e=>setSupplierForm({...supplierForm,contact:e.target.value})} style={inp} placeholder="Contact person"/></div>
                        <div><label style={lbl}>Mobile:</label><input type="tel" value={supplierForm.mobile||""} onChange={e=>setSupplierForm({...supplierForm,mobile:e.target.value})} style={inp} placeholder="Mobile"/></div>
                        <div><label style={lbl}>E-mail..:</label><input type="email" value={supplierForm.email||""} onChange={e=>setSupplierForm({...supplierForm,email:e.target.value})} style={inp} placeholder="Email"/></div>
                      </div>
                    </div>
                    {/* Tax & Legal */}
                    <div style={{background:"#f8fafc",borderRadius:"6px",padding:"12px",marginBottom:"10px"}}>
                      <div style={{fontSize:"11px",fontWeight:"700",color:"#64748b",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Tax & Legal</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:"8px"}}>
                        <div><label style={lbl}>D.L.No.:</label><input value={supplierForm.dlNo||""} onChange={e=>setSupplierForm({...supplierForm,dlNo:e.target.value})} style={inp} placeholder="Drug Licence"/></div>
                        <div><label style={lbl}>GST Tin:</label><input value={supplierForm.gstTin||""} onChange={e=>setSupplierForm({...supplierForm,gstTin:e.target.value})} style={inp} placeholder="GSTIN"/></div>
                        <div><label style={lbl}>Pan No:</label><input value={supplierForm.panNo||""} onChange={e=>setSupplierForm({...supplierForm,panNo:e.target.value})} style={inp} placeholder="PAN"/></div>
                        <div><label style={lbl}>State:</label><input value={supplierForm.state||"24.Gujarat"} onChange={e=>setSupplierForm({...supplierForm,state:e.target.value})} style={inp}/></div>
                        <div><label style={lbl}>Aadhar No:</label><input value={supplierForm.aadharNo||""} onChange={e=>setSupplierForm({...supplierForm,aadharNo:e.target.value})} style={inp} placeholder="Aadhar"/></div>
                      </div>
                    </div>
                    {/* Billing Detail - F6 */}
                    <div style={{background:"#f8fafc",borderRadius:"6px",padding:"12px",marginBottom:"10px"}}>
                      <div style={{fontSize:"11px",fontWeight:"700",color:"#64748b",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Billing Detail (F6)</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"8px"}}>
                        <div><label style={lbl}>Opening Balance:</label><input type="number" value={supplierForm.openingBalance||""} onChange={e=>setSupplierForm({...supplierForm,openingBalance:e.target.value})} style={inp} placeholder="0"/></div>
                        <div><label style={lbl}>Account Group:</label><input value={supplierForm.accountGroup||""} onChange={e=>setSupplierForm({...supplierForm,accountGroup:e.target.value})} style={inp} placeholder="Supplier/Distributor"/></div>
                        <div><label style={lbl}>Type:</label><select value={supplierForm.type||"supplier"} onChange={e=>setSupplierForm({...supplierForm,type:e.target.value})} style={inp}><option value="supplier">Supplier</option><option value="customer">Customer</option><option value="both">Both</option></select></div>
                        <div><label style={lbl}>Invoice Type:</label><select value={supplierForm.invoiceType||"Retail"} onChange={e=>setSupplierForm({...supplierForm,invoiceType:e.target.value})} style={inp}><option value="Retail">Retail</option><option value="Wholesale">Wholesale</option><option value="TaxInvoice">Tax Invoice</option></select></div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"8px",marginTop:"8px"}}>
                        <div><label style={lbl}>P.Mode:</label><select value={supplierForm.paymentMode||"cash"} onChange={e=>setSupplierForm({...supplierForm,paymentMode:e.target.value})} style={inp}><option value="cash">Cash</option><option value="credit">Credit</option><option value="cheque">Cheque</option><option value="neft">NEFT</option></select></div>
                        <div><label style={lbl}>Credit Limit Rs:</label><input type="number" value={supplierForm.creditLimit||""} onChange={e=>setSupplierForm({...supplierForm,creditLimit:e.target.value})} style={inp} placeholder="0"/></div>
                        <div><label style={lbl}>Credit Days:</label><input type="number" value={supplierForm.creditDays||"30"} onChange={e=>setSupplierForm({...supplierForm,creditDays:e.target.value})} style={inp}/></div>
                        <div><label style={lbl}>Discount in %:</label><input type="number" value={supplierForm.discountPct||""} onChange={e=>setSupplierForm({...supplierForm,discountPct:e.target.value})} style={inp} placeholder="0"/></div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginTop:"8px"}}>
                        <div><label style={lbl}>Margin% on PTR:</label><input type="number" value={supplierForm.marginPct||""} onChange={e=>setSupplierForm({...supplierForm,marginPct:e.target.value})} style={inp} placeholder="0"/></div>
                        <div><label style={lbl}>Add % for G.C.:</label><input type="number" value={supplierForm.gcPct||""} onChange={e=>setSupplierForm({...supplierForm,gcPct:e.target.value})} style={inp} placeholder="0"/></div>
                        <div><label style={lbl}>TDS%:</label><input type="number" value={supplierForm.tdsPct||""} onChange={e=>setSupplierForm({...supplierForm,tdsPct:e.target.value})} style={inp} placeholder="0"/></div>
                      </div>
                    </div>
                    {/* Checkboxes */}
                    <div style={{display:"flex",gap:"16px",flexWrap:"wrap",marginBottom:"10px",padding:"8px 12px",background:"#f8fafc",borderRadius:"6px"}}>
                      {[{k:"taxNotCalculate",l:"TAX Not Calculate"},{k:"adtTaxCalc",l:"Adt Tax Calculate (Purchase)"},{k:"saleByLP",l:"Sale By LP"},{k:"saleByPRate",l:"Sale By P.Rate + Tax"},{k:"askBeforeSave",l:"Ask Before Save"},{k:"statusOff",l:"Status Off"},{k:"salesBillPrint0",l:"Sales Bill Print 0"}].map(f=>(
                        <label key={f.k} style={{display:"flex",alignItems:"center",gap:"5px",fontSize:"11px",cursor:"pointer"}}>
                          <input type="checkbox" checked={!!supplierForm[f.k]} onChange={e=>setSupplierForm({...supplierForm,[f.k]:e.target.checked})}/>
                          <span>{f.l}</span>
                        </label>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:"8px"}}>
                      <button onClick={handleSaveSupplier} style={{...btn("#198754")}}><CheckCircle size={13}/>Save</button>
                      <button onClick={()=>{setShowSupplierForm(false);setEditingSupplier(null);}} style={{...btn("#64748b")}}><X size={13}/>Cancel</button>
                    </div>
                  </div>
                )}

                {suppliers.length===0&&!showSupplierForm?(
                  <div style={{textAlign:"center",padding:"60px",color:"#94a3b8"}}><div style={{fontSize:"44px"}}>🏭</div><p>No suppliers found</p></div>
                ):(
                  <div style={{display:"grid",gap:"10px"}}>
                    {suppliers.map(s=>(
                      <div key={s.id} style={{background:"white",borderRadius:"5px",padding:"14px 16px",border:"1px solid #dee2e6"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"10px"}}>
                          <div>
                            <div style={{fontWeight:"800",fontSize:"14px"}}>{s.name}</div>
                            <div style={{fontSize:"12px",color:"#64748b",marginTop:"4px",display:"flex",gap:"14px",flexWrap:"wrap"}}>
                              {s.mobile&&<span>📱 {s.mobile}</span>}
                              {s.gstTin&&<span>GST: {s.gstTin}</span>}
                              {s.dlNo&&<span>DL: {s.dlNo}</span>}
                              {s.creditLimit&&<span>Credit: ₹{s.creditLimit} ({s.creditDays} days)</span>}
                              {s.city&&<span>📍 {s.city}, {s.state}</span>}
                            </div>
                          </div>
                          <div style={{display:"flex",gap:"6px"}}>
                            <button onClick={()=>openSupplierForm(s)} style={{...btn(),fontSize:"11px",padding:"5px 10px"}}><Edit2 size={11}/>Edit</button>
                            <button onClick={()=>{if(window.confirm("Delete?")){saveSuppliers(suppliers.filter(x=>x.id!==s.id));showToast("Deleted!");}}} style={{...btn("#dc3545"),fontSize:"11px",padding:"5px 10px"}}><Trash2 size={11}/></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Doctors */}
            {ownerSubTab==="doctors"&&(
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
                  <h2 style={{margin:0,fontSize:"17px",fontWeight:"800"}}>🩺 Doctor Master ({doctors.length})</h2>
                  <button onClick={()=>{setDoctorForm({name:"",area:"",mobile:"",speciality:""});setEditDoctorId(null);setShowDoctorForm(true);}} style={{...btn("#3b82f6"),fontSize:"12px"}}>+ Add Doctor</button>
                </div>
                {showDoctorForm&&(
                  <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"16px",marginBottom:"16px"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
                      <div><label style={lbl}>Doctor Name *</label><input value={doctorForm.name} onChange={e=>setDoctorForm({...doctorForm,name:e.target.value.toUpperCase()})} placeholder="DR. NAME" style={inp}/></div>
                      <div><label style={lbl}>Speciality</label><input value={doctorForm.speciality} onChange={e=>setDoctorForm({...doctorForm,speciality:e.target.value.toUpperCase()})} placeholder="GENERAL / ORTHO" style={inp}/></div>
                      <div><label style={lbl}>Area / Location</label><input value={doctorForm.area} onChange={e=>setDoctorForm({...doctorForm,area:e.target.value.toUpperCase()})} placeholder="AREA" style={inp}/></div>
                      <div><label style={lbl}>Mobile</label><input value={doctorForm.mobile} onChange={e=>setDoctorForm({...doctorForm,mobile:e.target.value})} placeholder="Mobile no." style={{...inp,textTransform:"none"}}/></div>
                    </div>
                    <div style={{display:"flex",gap:"8px"}}>
                      <button onClick={()=>{
                        if(!doctorForm.name){showToast("Doctor name required","error");return;}
                        const nd=editDoctorId?doctors.map(d=>d.id===editDoctorId?{...d,...doctorForm}:d):[...doctors,{...doctorForm,id:uid()}];
                        setDoctors(nd);save("store_doctors",nd);
                        showToast(editDoctorId?"Doctor updated!":"Doctor added!");
                        setShowDoctorForm(false);setEditDoctorId(null);
                      }} style={{...btn("#16a34a")}}><CheckCircle size={13}/>{editDoctorId?"Update":"Save"} Doctor</button>
                      <button onClick={()=>{setShowDoctorForm(false);setEditDoctorId(null);}} style={{...btn("#64748b")}}>Cancel</button>
                    </div>
                  </div>
                )}
                {doctors.length===0?
                  <div style={{textAlign:"center",padding:"40px",color:"#94a3b8"}}>
                    <div style={{fontSize:"40px",marginBottom:"8px"}}>🩺</div>
                    <p>No doctors added yet</p>
                  </div>:
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"10px"}}>
                    {doctors.map(d=>(
                      <div key={d.id} style={{background:"white",borderRadius:"8px",padding:"14px",border:"1px solid #e2e8f0"}}>
                        <div style={{fontWeight:"700",fontSize:"14px",color:"#1a3a5c",marginBottom:"4px"}}>🩺 {d.name}</div>
                        {d.speciality&&<div style={{fontSize:"11px",background:"#eff6ff",color:"#3b82f6",padding:"2px 8px",borderRadius:"10px",display:"inline-block",marginBottom:"6px"}}>{d.speciality}</div>}
                        {d.area&&<div style={{fontSize:"12px",color:"#64748b"}}>📍 {d.area}</div>}
                        {d.mobile&&<div style={{fontSize:"12px",color:"#64748b"}}>📞 {d.mobile}</div>}
                        <div style={{display:"flex",gap:"6px",marginTop:"10px"}}>
                          <button onClick={()=>{setDoctorForm({name:d.name,area:d.area||"",mobile:d.mobile||"",speciality:d.speciality||""});setEditDoctorId(d.id);setShowDoctorForm(true);}} style={{...btn("#f59e0b"),fontSize:"11px",padding:"4px 10px"}}>Edit</button>
                          <button onClick={()=>showConfirm("Delete doctor?",()=>{const nd=doctors.filter(x=>x.id!==d.id);setDoctors(nd);save("store_doctors",nd);showToast("Doctor deleted");})} style={{...btn("#ef4444"),fontSize:"11px",padding:"4px 10px"}}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </>
            )}

            {/* Customers from orders */}
            {ownerSubTab==="customers"&&(()=>{
              const customerEmails=[...new Set(custOrders.map(o=>o.customer?.email).filter(Boolean))];
              return(
                <>
                  <h2 style={{margin:"0 0 14px",fontSize:"17px",fontWeight:"800"}}>👥 Online Customers ({customerEmails.length})</h2>
                  {customerEmails.length===0?(
                    <div style={{textAlign:"center",padding:"60px",color:"#94a3b8"}}><div style={{fontSize:"44px"}}>👥</div><p>No customers found</p></div>
                  ):(
                    <div style={{display:"grid",gap:"10px"}}>
                      {customerEmails.map(email=>{
                        const cOrders=custOrders.filter(o=>o.customer?.email===email);
                        const latest=[...cOrders].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
                        const totalSpent=cOrders.reduce((s,o)=>s+num(o.total),0);
                        return(
                          <div key={email} style={{background:"white",borderRadius:"5px",padding:"14px 16px",border:"1px solid #dee2e6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                              <div style={{width:"38px",height:"38px",borderRadius:"50%",background:"linear-gradient(135deg,#1a3a5c,#0d6efd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",color:"white",fontWeight:"800"}}>{(latest?.customer?.name||"?")[0].toUpperCase()}</div>
                              <div>
                                <div style={{fontWeight:"700",fontSize:"14px"}}>{latest?.customer?.name}</div>
                                <div style={{fontSize:"11px",color:"#64748b"}}>{email}{latest?.customer?.phone?` · ${latest.customer.phone}`:""}</div>
                              </div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontWeight:"800",color:"#16a34a"}}>₹{fmt(totalSpent,0)}</div>
                              <div style={{fontSize:"11px",color:"#64748b"}}>{cOrders.length} orders</div>
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
            CUSTOMER: STORE HOME
        ══════════════════════════════════════════ */}
        {!isOwner&&activeCustomerTab==="home"&&(
          <>
            <h2 style={{margin:"0 0 14px",fontSize:"17px",fontWeight:"800"}}>🏪 Shiv Dhara Medical Store</h2>
            {/* Help Contact Banner */}
            <div style={{background:"linear-gradient(135deg,#1a3a5c,#2563eb)",borderRadius:"8px",padding:"12px 16px",marginBottom:"16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"10px"}}>
              <div style={{color:"white"}}>
                <div style={{fontSize:"12px",opacity:0.8,marginBottom:"2px"}}>❓ Help / સહાય માટે</div>
                <div style={{fontWeight:"700",fontSize:"14px"}}>Shiv Dhara Medical Store</div>
              </div>
              <a href="tel:9924237606" style={{background:"#22c55e",color:"white",padding:"8px 16px",borderRadius:"6px",fontWeight:"800",fontSize:"15px",textDecoration:"none",display:"flex",alignItems:"center",gap:"6px",boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
                📞 9924237606
              </a>
            </div>
            {/* Division grid OR items view */}
            {!activeSection ? (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:"12px"}}>
                {DIVISIONS.map(div=>{
                  const count=items.filter(i=>i.division===div.id&&i.stock>0).length;
                  return(
                    <div key={div.id} onClick={()=>setActiveSection(div.id)} style={{background:"white",borderRadius:"6px",padding:"18px",border:"2px solid "+div.border,cursor:"pointer",boxShadow:"0 2px 6px rgba(0,0,0,0.05)"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,0.1)";}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 6px rgba(0,0,0,0.05)";}}>
                      <div style={{fontSize:"34px",marginBottom:"8px"}}>{div.icon}</div>
                      <div style={{fontWeight:"800",fontSize:"14px",color:"#1e293b",marginBottom:"3px"}}>{div.label}</div>
                      <div style={{fontSize:"11px",color:"#94a3b8",marginBottom:"10px"}}>{div.desc}</div>
                      <span style={{background:div.bg,color:div.color,padding:"2px 8px",borderRadius:"5px",fontSize:"12px",fontWeight:"700"}}>{count} in stock</span>
                    </div>
                  );
                })}
              </div>
            ):(()=>{
              const div=getDivision(activeSection);
              const divItems=items.filter(i=>i.division===activeSection&&i.stock>0&&!isExpired(i.expiryDate));
              return (
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px",padding:"10px 14px",background:"white",borderRadius:"8px",border:"2px solid "+div.border}}>
                    <button onClick={()=>setActiveSection("")} style={{background:div.bg,border:"none",cursor:"pointer",color:div.color,fontWeight:"800",fontSize:"18px",lineHeight:1,padding:"2px 10px",borderRadius:"5px"}}>&#8592;</button>
                    <span style={{fontSize:"22px"}}>{div.icon}</span>
                    <div>
                      <div style={{fontWeight:"800",fontSize:"15px",color:"#1e293b"}}>{div.label}</div>
                      <div style={{fontSize:"11px",color:"#94a3b8"}}>{divItems.length} item{divItems.length!==1?"s":""} in stock</div>
                    </div>
                  </div>
                  {divItems.length===0?(
                    <div style={{textAlign:"center",padding:"40px",color:"#94a3b8",background:"white",borderRadius:"8px"}}>
                      <div style={{fontSize:"40px",marginBottom:"8px"}}>{div.icon}</div>
                      <p style={{margin:0}}>No items in stock</p>
                    </div>
                  ):(
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"10px"}}>
                      {divItems.map(item=>(
                        <div key={item.id} style={{background:"white",borderRadius:"8px",padding:"13px",border:"1px solid "+div.border,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",gap:"6px"}}>
                          <div style={{fontWeight:"700",fontSize:"13px",color:"#1e293b"}}>{item.name}</div>
                          {item.company&&<div style={{fontSize:"11px",color:"#94a3b8"}}>{item.company}</div>}
                          {item.rxRequired&&<span style={{background:"#fce7f3",color:"#be185d",fontSize:"10px",padding:"1px 5px",borderRadius:"4px",fontWeight:"700",alignSelf:"flex-start"}}>Rx Required</span>}
                          <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginTop:"2px"}}>
                            <span style={{background:div.bg,color:div.color,padding:"2px 8px",borderRadius:"5px",fontSize:"12px",fontWeight:"800"}}>&#8377;{item.price}</span>
                            {item.mrp>0&&item.mrp>item.price&&<span style={{background:"#f1f5f9",color:"#94a3b8",padding:"2px 6px",borderRadius:"5px",fontSize:"11px",textDecoration:"line-through"}}>&#8377;{item.mrp}</span>}
                            {item.gst>0&&<span style={{background:"#f0fdf4",color:"#16a34a",padding:"2px 6px",borderRadius:"5px",fontSize:"11px"}}>{item.gst}%GST</span>}
                          </div>
                          <button onClick={()=>addToCart(item)} style={{...btn(div.color),width:"100%",justifyContent:"center",fontSize:"12px",padding:"7px",marginTop:"auto"}}><ShoppingCart size={12}/>Add to Cart</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}

        {/* CUSTOMER SHOP */}
        {!isOwner&&activeCustomerTab==="shop"&&(
          <>
            {/* Search bar */}
            <div style={{marginBottom:"14px",position:"relative"}}>
              <input
                value={searchQ}
                onChange={e=>setSearchQ(e.target.value)}
                placeholder="🔍 Search medicines, cosmetics..."
                style={{...inp,width:"100%",padding:"10px 14px",fontSize:"14px",borderRadius:"8px",boxSizing:"border-box"}}
              />
              {searchQ&&<button onClick={()=>setSearchQ("")} style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={15}/></button>}
            </div>

            {/* Division filter pills */}
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"14px"}}>
              <button onClick={()=>setActiveSection("")} style={{padding:"5px 14px",borderRadius:"20px",border:"none",cursor:"pointer",fontWeight:"700",fontSize:"12px",background:!activeSection?"#1a3a5c":"#f1f5f9",color:!activeSection?"white":"#475569"}}>All</button>
              {DIVISIONS.map(d=>(
                <button key={d.id} onClick={()=>setActiveSection(activeSection===d.id?"":d.id)} style={{padding:"5px 14px",borderRadius:"20px",border:"none",cursor:"pointer",fontWeight:"700",fontSize:"12px",background:activeSection===d.id?d.color:"#f1f5f9",color:activeSection===d.id?"white":"#475569"}}>
                  {d.icon} {d.label}
                </button>
              ))}
            </div>

            {/* Items grid */}
            {(()=>{
              const q=(searchQ||"").toLowerCase();
              const divItems=items.filter(i=>
                i.stock>0&&!isExpired(i.expiryDate)&&
                (!activeSection||i.division===activeSection)&&
                (!q||(i.name||"").toLowerCase().includes(q)||(i.company||"").toLowerCase().includes(q))
              );
              if(divItems.length===0) return <div style={{textAlign:"center",padding:"50px",color:"#94a3b8"}}><div style={{fontSize:"40px"}}>🔍</div><p>No items found</p></div>;
              return(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:"12px"}}>
                  {divItems.map(item=>{
                    const dv=getDivision(item.division);
                    const inCart=cart.find(c=>c.id===item.id);
                    return(
                      <div key={item.id} style={{background:"white",borderRadius:"8px",padding:"14px",border:`1px solid ${dv.border}`,boxShadow:"0 2px 6px rgba(0,0,0,0.05)",display:"flex",flexDirection:"column"}}>
                        <div style={{fontSize:"28px",textAlign:"center",marginBottom:"8px"}}>{dv.icon}</div>
                        <div style={{fontWeight:"700",fontSize:"13px",marginBottom:"3px",color:"#1e293b"}}>{item.name}</div>
                        {item.company&&<div style={{fontSize:"11px",color:"#94a3b8",marginBottom:"6px"}}>{item.company}</div>}
                        {item.rxRequired&&<span style={{background:"#fce7f3",color:"#be185d",fontSize:"10px",padding:"1px 5px",borderRadius:"4px",fontWeight:"700",marginBottom:"6px",display:"inline-block"}}>Rx Required</span>}
                        <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"10px",marginTop:"auto"}}>
                          <span style={{background:dv.bg,color:dv.color,padding:"3px 8px",borderRadius:"5px",fontSize:"13px",fontWeight:"800"}}>₹{item.price}</span>
                          {item.mrp>0&&num(item.mrp)>num(item.price)&&<span style={{background:"#f1f5f9",color:"#94a3b8",padding:"3px 7px",borderRadius:"5px",fontSize:"11px",textDecoration:"line-through"}}>₹{item.mrp}</span>}
                        </div>
                        {inCart?(
                          <div style={{display:"flex",alignItems:"center",gap:"6px",justifyContent:"center"}}>
                            <button onClick={()=>updateCartQty(item.id,inCart.quantity-1)} style={{width:"28px",height:"28px",borderRadius:"6px",border:`1px solid ${dv.color}`,background:"white",cursor:"pointer",fontWeight:"800",color:dv.color}}>-</button>
                            <span style={{fontWeight:"800",minWidth:"20px",textAlign:"center"}}>{inCart.quantity}</span>
                            <button onClick={()=>updateCartQty(item.id,inCart.quantity+1)} style={{width:"28px",height:"28px",borderRadius:"6px",border:`1px solid ${dv.color}`,background:"white",cursor:"pointer",fontWeight:"800",color:dv.color}}>+</button>
                          </div>
                        ):(
                          <button onClick={()=>addToCart(item)} style={{...btn(dv.color),width:"100%",justifyContent:"center",fontSize:"12px",padding:"7px"}}><ShoppingCart size={12}/>Add to Cart</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </>
        )}

        {/* CUSTOMER ORDERS */}
        {!isOwner&&activeCustomerTab==="orders"&&(
          <>
            <h2 style={{margin:"0 0 14px",fontSize:"17px",fontWeight:"800"}}>📦 My Orders ({myOrders.length})</h2>
            {myOrders.length===0?(
              <div style={{textAlign:"center",padding:"60px",color:"#94a3b8"}}><div style={{fontSize:"44px"}}>📦</div><p>No orders found</p></div>
            ):[...myOrders].reverse().map(order=>{
              const ss=STATUS_STYLE[order.status]||STATUS_STYLE.Pending;
              return(
                <div key={order.id} style={{background:"white",borderRadius:"5px",marginBottom:"10px",border:"1px solid #dee2e6",overflow:"hidden"}}>
                  <div style={{padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setExpandedOrder(expandedOrder===order.id?null:order.id)}>
                    <div><div style={{fontWeight:"700",fontSize:"13px"}}>Order #{order.id.slice(-6)}</div><div style={{fontSize:"11px",color:"#64748b",marginTop:"2px"}}>{new Date(order.date).toLocaleString("en-IN")} · {order.items.length} items</div></div>
                    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                      <div style={{textAlign:"right"}}><div style={{fontWeight:"800",fontSize:"14px"}}>₹{fmt(order.total)}</div><span style={{background:ss.bg,color:ss.color,padding:"2px 8px",borderRadius:"5px",fontSize:"11px",fontWeight:"700"}}>{order.status}</span></div>
                      {order.status==="Pending"&&<button onClick={e=>{e.stopPropagation();showConfirm("Cancel this order?",()=>{saveCustOrders(custOrders.filter(o=>o.id!==order.id));showToast("Order cancelled");});}} style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#ef4444",borderRadius:"6px",padding:"4px 8px",cursor:"pointer",fontSize:"11px",fontWeight:"700"}}>Cancel</button>}
                      {expandedOrder===order.id?<ChevronUp size={15} color="#64748b"/>:<ChevronDown size={15} color="#64748b"/>}
                    </div>
                  </div>
                  {expandedOrder===order.id&&(
                    <div style={{borderTop:"1px solid #f1f5f9",padding:"12px 14px",background:"#fafafa"}}>
                      {order.items.map(item=><div key={item.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #e9ecef",fontSize:"13px"}}><span>{getDivision(item.division).icon} {item.name} ×{item.quantity}</span><span style={{fontWeight:"700",color:"#3b82f6"}}>₹{fmt((num(item.price)*(1+num(item.gst)/100))*item.quantity)}</span></div>)}
                      <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:"12px",color:"#64748b"}}><span>Payment:</span><span style={{fontWeight:"700"}}>{(order.paymentMode||"cash").toUpperCase()}</span></div>
                      {order.customer?.address&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:"12px",color:"#64748b"}}><span>Address:</span><span>{order.customer.address}</span></div>}
                      <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontWeight:"800",fontSize:"14px",color:"#16a34a"}}><span>Total:</span><span>₹{fmt(order.total)}</span></div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* CUSTOMER MEMBERSHIP PLANS */}
        {!isOwner&&activeCustomerTab==="membership"&&(
          <div style={{maxWidth:"520px",margin:"0 auto"}}>
            <h2 style={{margin:"0 0 6px",fontSize:"18px",fontWeight:"800"}}>⭐ Membership Plans</h2>
            <p style={{margin:"0 0 20px",fontSize:"13px",color:"#64748b"}}>Special discounts & benefits for members</p>

            {/* Current Plan Banner */}
            {memberPlan?(
              <div style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",borderRadius:"10px",padding:"14px 18px",marginBottom:"20px",color:"white",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:"12px",opacity:0.85}}>Current Plan</div>
                  <div style={{fontSize:"20px",fontWeight:"800"}}>{memberPlan==="gold"?"🥇 Gold Member":"🥈 Silver Member"}</div>
                </div>
                <div style={{fontSize:"28px"}}>{memberPlan==="gold"?"👑":"⭐"}</div>
              </div>
            ):(
              <div style={{background:"#f8fafc",border:"2px dashed #cbd5e1",borderRadius:"10px",padding:"14px 18px",marginBottom:"20px",textAlign:"center",color:"#64748b",fontSize:"13px"}}>
                No active plan — Choose a plan below
              </div>
            )}

            {/* Plans */}
            {[
              {
                id:"silver",icon:"🥈",name:"Silver",tagline:"For regular customers",color:"#64748b",bg:"#f8fafc",border:"#cbd5e1",badge:"POPULAR",
                price:"₹199",period:"/ month",
                features:["5% discount on all medicines","Priority order processing","Free home delivery above ₹500","Monthly health tips"],
              },
              {
                id:"gold",icon:"🥇",name:"Gold",tagline:"Maximum savings",color:"#d97706",bg:"#fffbeb",border:"#fde68a",badge:"BEST VALUE",
                price:"₹399",period:"/ month",
                features:["10% discount on all medicines","Free home delivery always","Priority order processing","Dedicated customer support","Exclusive offers & deals","Monthly free checkup consultation"],
              }
            ].map(plan=>(
              <div key={plan.id} style={{border:`2px solid ${memberPlan===plan.id?plan.color:plan.border}`,borderRadius:"12px",padding:"20px",marginBottom:"16px",background:plan.bg,position:"relative"}}>
                {plan.badge&&<span style={{position:"absolute",top:"-10px",right:"16px",background:plan.color,color:"white",fontSize:"10px",fontWeight:"800",padding:"2px 10px",borderRadius:"20px"}}>{plan.badge}</span>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px"}}>
                  <div>
                    <div style={{fontSize:"22px",fontWeight:"800",color:"#1e293b"}}>{plan.icon} {plan.name}</div>
                    <div style={{fontSize:"12px",color:"#64748b"}}>{plan.tagline}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:"24px",fontWeight:"800",color:plan.color}}>{plan.price}</div>
                    <div style={{fontSize:"11px",color:"#94a3b8"}}>{plan.period}</div>
                  </div>
                </div>
                <div style={{marginBottom:"16px"}}>
                  {plan.features.map((f,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px",fontSize:"13px",color:"#374151"}}>
                      <span style={{color:"#16a34a",fontWeight:"700"}}>✓</span> {f}
                    </div>
                  ))}
                </div>
                {memberPlan===plan.id?(
                  <div style={{textAlign:"center",padding:"10px",background:"#f0fdf4",borderRadius:"8px",color:"#16a34a",fontWeight:"700",fontSize:"13px"}}>✅ Active Plan</div>
                ):(
                  <button onClick={()=>setShowPlans(plan.id)} style={{width:"100%",padding:"12px",background:`linear-gradient(135deg,${plan.color},${plan.id==="gold"?"#f59e0b":"#475569"})`,color:"white",border:"none",borderRadius:"8px",fontWeight:"800",fontSize:"14px",cursor:"pointer",boxShadow:`0 4px 14px ${plan.color}55`}}>
                    Get {plan.name} Plan →
                  </button>
                )}
              </div>
            ))}

            <div style={{fontSize:"11px",color:"#94a3b8",textAlign:"center",marginTop:"8px"}}>Contact store to activate: 📞 9924237606</div>
          </div>
        )}

        {/* PLAN PAYMENT MODAL */}
        {showPlans&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
            <div style={{background:"white",borderRadius:"12px",width:"100%",maxWidth:"380px",boxShadow:"0 25px 60px rgba(0,0,0,0.3)"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid #e2e8f0",background:"#1a3a5c",borderRadius:"12px 12px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:"white",fontWeight:"700",fontSize:"15px"}}>💳 Activate {showPlans==="gold"?"🥇 Gold":"🥈 Silver"} Plan</span>
                <button onClick={()=>setShowPlans(false)} style={{background:"none",border:"none",cursor:"pointer",color:"white"}}><X size={18}/></button>
              </div>
              <div style={{padding:"20px"}}>
                <div style={{background:"#eff6ff",border:"2px solid #3b82f6",borderRadius:"8px",padding:"14px",marginBottom:"16px",textAlign:"center"}}>
                  <div style={{fontSize:"13px",color:"#1d4ed8",fontWeight:"700",marginBottom:"8px"}}>Pay to activate your plan</div>
                  <div style={{fontSize:"22px",fontWeight:"800",color:"#1e40af"}}>{upiSettings.upiId||"Contact store"}</div>
                  <div style={{fontSize:"12px",color:"#64748b",marginTop:"4px"}}>{upiSettings.upiName||"Shiv Dhara Medical Store"}</div>
                  <div style={{fontSize:"20px",fontWeight:"800",color:"#16a34a",marginTop:"8px"}}>{showPlans==="gold"?"₹399":"₹199"} / month</div>
                  {upiSettings.upiId&&(
                    <a href={`upi://pay?pa=${encodeURIComponent(upiSettings.upiId)}&pn=${encodeURIComponent(upiSettings.upiName||"Shiv Dhara Medical Store")}&am=${showPlans==="gold"?"399":"199"}&cu=INR&tn=${encodeURIComponent(showPlans+" Membership")}`} target="_blank" rel="noreferrer"
                      style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"linear-gradient(135deg,#5f25d5,#2d6fe8)",color:"white",padding:"10px 20px",borderRadius:"8px",fontWeight:"700",fontSize:"13px",textDecoration:"none",marginTop:"10px"}}>
                      📱 Pay Now
                    </a>
                  )}
                </div>
                <div style={{marginBottom:"14px"}}>
                  <label style={lbl}>UTR / Transaction ID *</label>
                  <input id="planTxnInput" placeholder="Enter payment transaction ID" style={{...inp,borderColor:"#3b82f6"}}/>
                </div>
                <div style={{display:"flex",gap:"10px"}}>
                  <button onClick={()=>setShowPlans(false)} style={{...btn("#64748b"),flex:1,justifyContent:"center"}}>Cancel</button>
                  <button onClick={()=>{
                    const txn=document.getElementById("planTxnInput")?.value;
                    if(!txn){showToast("Enter transaction ID","error");return;}
                    setMemberPlan(showPlans);
                    setShowPlans(false);
                    showToast(`${showPlans==="gold"?"Gold":"Silver"} plan activated! ⭐ Please await confirmation.`);
                  }} style={{...btn("#16a34a"),flex:2,justifyContent:"center"}}><CheckCircle size={13}/>Activate Plan</button>
                </div>
                <div style={{fontSize:"11px",color:"#94a3b8",textAlign:"center",marginTop:"10px"}}>Plan activates after store verification · 📞 9924237606</div>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMER PROFILE */}
        {!isOwner&&activeCustomerTab==="profile"&&(
          <div style={{maxWidth:"480px"}}>
            <h2 style={{margin:"0 0 14px",fontSize:"17px",fontWeight:"800"}}>👤 My Profile</h2>
            <div style={{background:"white",borderRadius:"6px",padding:"20px",border:"1px solid #dee2e6"}}>
              <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"20px"}}>
                <div style={{width:"54px",height:"54px",borderRadius:"50%",background:"linear-gradient(135deg,#1a3a5c,#0d6efd)",display:"flex",alignItems:"center",justifyContent:"center"}}><User size={24} color="white"/></div>
                <div><div style={{fontWeight:"800",fontSize:"16px"}}>{currentUser.name}</div><div style={{fontSize:"12px",color:"#64748b"}}>Customer</div></div>
              </div>
              {!editProfile?(
                <>
                  {[{icon:<Mail size={13}/>,l:"Email",v:currentUser.email},{icon:<Phone size={13}/>,l:"Phone",v:currentUser.phone||"—"},{icon:<MapPin size={13}/>,l:"Address",v:currentUser.address||"—"},{icon:<Clock size={13}/>,l:"Member Since",v:currentUser.createdAt?new Date(currentUser.createdAt).toLocaleDateString("en-IN"):"—"}].map(row=>(
                    <div key={row.l} style={{display:"flex",gap:"10px",padding:"9px",background:"#f8fafc",borderRadius:"8px",marginBottom:"8px"}}>
                      <span style={{color:"#3b82f6",marginTop:"1px"}}>{row.icon}</span>
                      <div><div style={{fontSize:"10px",color:"#94a3b8",fontWeight:"600"}}>{row.l}</div><div style={{fontSize:"13px",fontWeight:"600",color:"#1e293b"}}>{row.v}</div></div>
                    </div>
                  ))}
                  <button onClick={()=>{setProfileData({name:currentUser.name||"",phone:currentUser.phone||"",address:currentUser.address||""});setEditProfile(true);}} style={{...btn(),marginTop:"8px"}}><Edit2 size={13}/>Edit Profile</button>
                </>
              ):(
                <>
                  {[{k:"name",l:"Name *"},{k:"phone",l:"Phone"},{k:"address",l:"Address"}].map(f=>(
                    <div key={f.k} style={{marginBottom:"11px"}}><label style={lbl}>{f.l}</label><input value={profileData[f.k]} onChange={e=>setProfileData({...profileData,[f.k]:e.target.value})} style={inp}/></div>
                  ))}
                  <div style={{display:"flex",gap:"8px"}}>
                    <button onClick={async()=>{const u={...currentUser,...profileData};const nc={...customers,[u.email]:u};setCustomers(nc);await save("store_customers",nc);setCurrentUser(u);setEditProfile(false);showToast("Profile updated!");}} style={{...btn("#198754")}}><CheckCircle size={13}/>Save</button>
                    <button onClick={()=>setEditProfile(false)} style={{...btn("#64748b")}}><X size={13}/>Cancel</button>
                  </div>
                </>
              )}
            </div>
            <div style={{background:"white",borderRadius:"6px",padding:"16px",border:"1px solid #dee2e6",marginTop:"12px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                <div style={{background:"#eff6ff",borderRadius:"8px",padding:"12px",textAlign:"center"}}><div style={{fontSize:"22px",fontWeight:"800",color:"#3b82f6"}}>{myOrders.length}</div><div style={{fontSize:"11px",color:"#64748b"}}>Total Orders</div></div>
                <div style={{background:"#f0fdf4",borderRadius:"8px",padding:"12px",textAlign:"center"}}><div style={{fontSize:"22px",fontWeight:"800",color:"#16a34a"}}>₹{fmt(myOrders.reduce((s,o)=>s+num(o.total),0),0)}</div><div style={{fontSize:"11px",color:"#64748b"}}>Total Spent</div></div>
              </div>
            </div>
          </div>
        )}

        {/* QUICK STOCK MODAL */}
        {quickStockItem&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
            <div style={{background:"white",borderRadius:"6px",padding:"24px",width:"100%",maxWidth:"320px",boxShadow:"0 20px 50px rgba(0,0,0,0.3)"}}>
              <h3 style={{margin:"0 0 5px",fontSize:"16px",fontWeight:"800"}}>📦 Stock Update</h3>
              <p style={{margin:"0 0 14px",fontSize:"13px",color:"#64748b"}}>{getDivision(quickStockItem.division).icon} {quickStockItem.name}</p>
              <div style={{background:"#1a3a5c",borderRadius:"4px",padding:"8px 12px",marginBottom:"12px",fontSize:"13px"}}>Current: <strong>{quickStockItem.stock} {quickStockItem.unit||"pcs"}</strong></div>
              <label style={lbl}>Add / Remove Qty (+50 or -10)</label>
              <input type="number" value={quickQty} onChange={e=>setQuickQty(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleQuickStock()} placeholder="+50 or -10" style={{...inp,fontSize:"15px",marginTop:"4px",marginBottom:"12px"}} autoFocus/>
              {quickQty&&<div style={{background:"#f0fdf4",borderRadius:"8px",padding:"8px 12px",fontSize:"13px",color:"#16a34a",marginBottom:"12px"}}>New Stock: <strong>{Math.max(0,int(quickStockItem.stock)+int(quickQty))} {quickStockItem.unit||"pcs"}</strong></div>}
              <div style={{display:"flex",gap:"10px"}}>
                <button onClick={handleQuickStock} style={{...btn("#198754"),flex:1,justifyContent:"center",padding:"10px"}}>✓ Update</button>
                <button onClick={()=>{setQuickStockItem(null);setQuickQty("");}} style={{...btn("#e9ecef","#495057"),padding:"10px 16px"}}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── ORDER FORM MODAL ── */}
        {showOrderForm&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:2500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowOrderForm(false)}>
            <div style={{background:"white",borderRadius:"16px 16px 0 0",width:"100%",maxWidth:"480px",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
              
              {/* Header */}
              <div style={{padding:"16px 20px 0",position:"sticky",top:0,background:"white",zIndex:1}}>
                <div style={{width:"40px",height:"4px",background:"#e2e8f0",borderRadius:"2px",margin:"0 auto 14px"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
                  <span style={{fontWeight:"700",fontSize:"16px",color:"#0f172a"}}>Checkout</span>
                  <button onClick={()=>setShowOrderForm(false)} style={{background:"#f1f5f9",border:"none",borderRadius:"50%",width:"28px",height:"28px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14}/></button>
                </div>
                <div style={{fontSize:"12px",color:"#64748b",marginBottom:"14px"}}>{currentUser?.email}</div>
                <div style={{height:"1px",background:"#f1f5f9",marginBottom:"14px"}}/>
              </div>

              <div style={{padding:"0 20px 24px"}}>

                {/* Order Summary */}
                <div style={{background:"#f8fafc",borderRadius:"10px",padding:"12px 14px",marginBottom:"16px"}}>
                  <div style={{fontSize:"11px",color:"#64748b",fontWeight:"600",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Order Summary</div>
                  {cart.map(item=>(
                    <div key={item.id} style={{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"4px"}}>
                      <span style={{color:"#374151"}}>{item.name} ×{item.quantity}</span>
                      <span style={{fontWeight:"600"}}>₹{fmt(num(item.price)*item.quantity)}</span>
                    </div>
                  ))}
                  <div style={{borderTop:"1px solid #e2e8f0",marginTop:"8px",paddingTop:"8px",display:"flex",justifyContent:"space-between",fontWeight:"800",fontSize:"15px"}}>
                    <span>Total</span><span style={{color:"#16a34a"}}>₹{fmt(calcTotal(cart))}</span>
                  </div>
                </div>

                {/* Delivery Info */}
                <div style={{fontSize:"12px",fontWeight:"700",color:"#374151",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Delivery Details</div>
                <div style={{marginBottom:"10px"}}><input value={orderForm.name} onChange={e=>setOrderForm({...orderForm,name:e.target.value.toUpperCase()})} placeholder="Full Name *" style={{...inp,fontSize:"14px"}}/></div>
                <div style={{marginBottom:"10px"}}><input value={orderForm.phone} onChange={e=>setOrderForm({...orderForm,phone:e.target.value})} placeholder="Phone Number *" style={{...inp,fontSize:"14px",textTransform:"none"}}/></div>
                <div style={{marginBottom:"16px"}}><input value={orderForm.address} onChange={e=>setOrderForm({...orderForm,address:e.target.value.toUpperCase()})} placeholder="Delivery Address *" style={{...inp,fontSize:"14px"}}/></div>

                {/* Payment Method */}
                <div style={{fontSize:"12px",fontWeight:"700",color:"#374151",marginBottom:"10px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Payment Method</div>
                
                {/* COD */}
                <div onClick={()=>setOrderForm({...orderForm,paymentMode:"cash",transactionId:""})} style={{border:`2px solid ${orderForm.paymentMode==="cash"?"#16a34a":"#e2e8f0"}`,borderRadius:"10px",padding:"12px 14px",marginBottom:"8px",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",background:orderForm.paymentMode==="cash"?"#f0fdf4":"white"}}>
                  <div style={{width:"20px",height:"20px",borderRadius:"50%",border:`2px solid ${orderForm.paymentMode==="cash"?"#16a34a":"#cbd5e1"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {orderForm.paymentMode==="cash"&&<div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#16a34a"}}/>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:"600",fontSize:"14px"}}>💵 Cash on Delivery</div>
                    <div style={{fontSize:"11px",color:"#64748b"}}>Pay when you receive your order</div>
                  </div>
                </div>

                {/* UPI */}
                <div onClick={()=>setOrderForm({...orderForm,paymentMode:"upi",transactionId:""})} style={{border:`2px solid ${orderForm.paymentMode==="upi"?"#3b82f6":"#e2e8f0"}`,borderRadius:"10px",padding:"12px 14px",marginBottom:"8px",cursor:"pointer",background:orderForm.paymentMode==="upi"?"#eff6ff":"white"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                    <div style={{width:"20px",height:"20px",borderRadius:"50%",border:`2px solid ${orderForm.paymentMode==="upi"?"#3b82f6":"#cbd5e1"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {orderForm.paymentMode==="upi"&&<div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#3b82f6"}}/>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:"600",fontSize:"14px"}}>📱 Pay with UPI</div>
                      <div style={{display:"flex",gap:"6px",marginTop:"4px"}}>
                        {["GPay","PhonePe","Paytm","BHIM"].map(a=><span key={a} style={{fontSize:"10px",background:"#f1f5f9",color:"#475569",padding:"2px 7px",borderRadius:"8px"}}>{a}</span>)}
                      </div>
                    </div>
                  </div>
                  {orderForm.paymentMode==="upi"&&(
                    <div style={{marginTop:"12px",borderTop:"1px solid #bfdbfe",paddingTop:"12px"}}>
                      {upiSettings.upiId?(
                        <>
                          <div style={{textAlign:"center",marginBottom:"12px"}}>
                            <div style={{fontSize:"12px",color:"#64748b",marginBottom:"4px"}}>Pay to</div>
                            <div style={{fontSize:"16px",fontWeight:"800",color:"#1e40af",background:"white",padding:"8px 20px",borderRadius:"8px",border:"1px solid #bfdbfe",display:"inline-block",letterSpacing:"0.5px"}}>{upiSettings.upiId}</div>
                            <div style={{fontSize:"11px",color:"#64748b",marginTop:"4px"}}>{upiSettings.upiName}</div>
                          </div>
                          <a href={`upi://pay?pa=${encodeURIComponent(upiSettings.upiId)}&pn=${encodeURIComponent(upiSettings.upiName||"Shiv Dhara Medical")}&am=${calcTotal(cart).toFixed(2)}&cu=INR&tn=${encodeURIComponent("Medicine Order")}`} target="_blank" rel="noreferrer"
                            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",background:"linear-gradient(135deg,#4f46e5,#2563eb)",color:"white",padding:"11px",borderRadius:"8px",fontWeight:"700",fontSize:"14px",textDecoration:"none",marginBottom:"10px"}}>
                            📲 Open UPI App · Pay ₹{fmt(calcTotal(cart))}
                          </a>
                          <div style={{fontSize:"11px",color:"#64748b",marginBottom:"6px"}}>After payment, enter your UTR/Transaction ID:</div>
                          <input value={orderForm.transactionId||""} onChange={e=>setOrderForm({...orderForm,transactionId:e.target.value.toUpperCase()})} placeholder="UTR Number (e.g. 401234567890)" style={{...inp,fontSize:"13px",letterSpacing:"1px",borderColor:"#93c5fd"}}/>
                        </>
                      ):(
                        <div style={{textAlign:"center",color:"#ef4444",fontSize:"12px",padding:"8px"}}>⚠️ UPI not configured. Please contact store: 9924237606</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Place Order Button */}
                <button onClick={confirmOrder} style={{width:"100%",background:"#1a3a5c",color:"white",border:"none",borderRadius:"10px",padding:"14px",fontWeight:"800",fontSize:"15px",cursor:"pointer",marginTop:"8px",letterSpacing:"0.3px"}}>
                  {orderForm.paymentMode==="upi"?"✅ Confirm & Place Order":"📦 Place Order"}
                </button>
                <div style={{textAlign:"center",fontSize:"11px",color:"#94a3b8",marginTop:"8px"}}>
                  By placing order you agree to our terms
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ── CONFIRM DIALOG ── */}
        {confirmDialog&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
            <div style={{background:"white",borderRadius:"8px",padding:"24px",maxWidth:"380px",width:"100%",boxShadow:"0 25px 60px rgba(0,0,0,0.3)"}}>
              <div style={{fontSize:"16px",fontWeight:"700",marginBottom:"12px",color:"#1a3a5c"}}>⚠️ Confirm</div>
              <div style={{fontSize:"14px",color:"#475569",marginBottom:"20px",lineHeight:"1.5"}}>{confirmDialog.msg}</div>
              <div style={{display:"flex",gap:"10px",justifyContent:"flex-end"}}>
                <button onClick={()=>setConfirmDialog(null)} style={{...btn("#64748b"),padding:"8px 20px"}}>Cancel</button>
                <button onClick={()=>{confirmDialog.onOk();setConfirmDialog(null);}} style={{...btn("#ef4444"),padding:"8px 20px"}}>Delete</button>
              </div>
            </div>
          </div>
        )}
        {/* ── PRINT MODAL ── */}
        {printHtml&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:2000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px"}}>
            <div style={{background:"white",borderRadius:"8px",width:"100%",maxWidth:"720px",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 25px 60px rgba(0,0,0,0.4)"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#1a3a5c",borderRadius:"8px 8px 0 0"}}>
                <span style={{color:"white",fontWeight:"700",fontSize:"14px"}}>🖨️ Bill Preview</span>
                <div style={{display:"flex",gap:"8px"}}>
                  <button onClick={()=>{const iframe=document.getElementById("printFrame");if(iframe)iframe.contentWindow.print();}} style={{...btn("#16a34a"),padding:"6px 16px"}}>🖨️ Print</button>
                  <button onClick={()=>setPrintHtml(null)} style={{...btn("#ef4444"),padding:"6px 12px"}}><X size={13}/>Close</button>
                </div>
              </div>
              <iframe id="printFrame" srcDoc={printHtml} style={{flex:1,border:"none",borderRadius:"0 0 8px 8px"}} title="Bill Preview"/>
            </div>
          </div>
        )}

        {/* ── SHORTCUT HELP MODAL ── */}
        {showShortcuts&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>setShowShortcuts(false)}>
            <div style={{background:"white",borderRadius:"6px",padding:"24px",width:"100%",maxWidth:"560px",boxShadow:"0 25px 60px rgba(0,0,0,0.3)",borderTop:"3px solid #1a3a5c"}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
                <h2 style={{margin:0,fontSize:"18px",fontWeight:"800"}}>⌨️ Keyboard Shortcuts</h2>
                <button onClick={()=>setShowShortcuts(false)} style={{background:"#f1f5f9",border:"none",padding:"6px 10px",borderRadius:"8px",cursor:"pointer",fontSize:"16px"}}>✕</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
                {/* Navigation */}
                <div>
                  <div style={{fontWeight:"800",fontSize:"12px",color:"#3b82f6",marginBottom:"10px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Navigation (Alt+Key)</div>
                  {[
                    ["Alt + H","Dashboard"],
                    ["Alt + I","Inventory"],
                    ["Alt + P","Purchase Bill"],
                    ["Alt + S","Sales Bill"],
                    ["Alt + Y","Payments"],
                    ["Alt + R","Reports"],
                    ["Alt + M","Masters / Suppliers"],
                  ].map(([k,l])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #e9ecef"}}>
                      <span style={{fontSize:"13px",color:"#475569"}}>{l}</span>
                      <kbd style={{background:"#f1f5f9",border:"1px solid #dee2e6",borderRadius:"5px",padding:"2px 8px",fontSize:"11px",fontWeight:"700",fontFamily:"monospace"}}>{k}</kbd>
                    </div>
                  ))}
                </div>
                {/* Divisions */}
                <div>
                  <div style={{fontWeight:"800",fontSize:"12px",color:"#16a34a",marginBottom:"10px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Divisions (F Keys)</div>
                  {[
                    ["F2","💊 Medicines"],
                    ["F3","🩺 Surgical Items"],
                    ["F4","✨ Cosmetics"],
                    ["F5","🍼 Baby Products"],
                    ["F6","🩻 Health Devices"],
                    ["F7","💪 Vitamins"],
                    ["F8","🌿 Ayurvedic"],
                    ["F9","🏥 OTC Products"],
                  ].map(([k,l])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #e9ecef"}}>
                      <span style={{fontSize:"13px",color:"#475569"}}>{l}</span>
                      <kbd style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:"5px",padding:"2px 8px",fontSize:"11px",fontWeight:"700",fontFamily:"monospace"}}>{k}</kbd>
                    </div>
                  ))}
                </div>
                {/* Quick Actions */}
                <div>
                  <div style={{fontWeight:"800",fontSize:"12px",color:"#8b5cf6",marginBottom:"10px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Quick Actions (Ctrl+Key)</div>
                  {[
                    ["Ctrl + N","New Sales Bill"],
                    ["Ctrl + B","New Purchase Bill"],
                    ["Ctrl + Q","New Payment Entry"],
                  ].map(([k,l])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #e9ecef"}}>
                      <span style={{fontSize:"13px",color:"#475569"}}>{l}</span>
                      <kbd style={{background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:"5px",padding:"2px 8px",fontSize:"11px",fontWeight:"700",fontFamily:"monospace"}}>{k}</kbd>
                    </div>
                  ))}
                </div>
                {/* General */}
                <div>
                  <div style={{fontWeight:"800",fontSize:"12px",color:"#ef4444",marginBottom:"10px",textTransform:"uppercase",letterSpacing:"0.5px"}}>General</div>
                  {[
                    ["Esc","Close / Cancel any form"],
                    ["?","Show / Hide this help"],
                    ["Ctrl + S","Save current open form"],
                    ["Enter","Next field → Last field saves form"],
                  ].map(([k,l])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #e9ecef"}}>
                      <span style={{fontSize:"13px",color:"#475569"}}>{l}</span>
                      <kbd style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"5px",padding:"2px 8px",fontSize:"11px",fontWeight:"700",fontFamily:"monospace"}}>{k}</kbd>
                    </div>
                  ))}
                  <div style={{marginTop:"14px",background:"#1a3a5c",borderRadius:"8px",padding:"10px 12px",fontSize:"11px",color:"#64748b"}}>
                    💡 Press <kbd style={{background:"#f1f5f9",border:"1px solid #dee2e6",borderRadius:"4px",padding:"1px 5px",fontSize:"10px",fontWeight:"700"}}>?</kbd> anytime to show this panel
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ══ USER MASTER MODAL ══ */}
        {showUserMaster&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{background:"#d4d0c8",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",width:"700px",maxWidth:"98vw",fontFamily:"Tahoma,Arial,sans-serif",fontSize:"13px",boxShadow:"4px 4px 10px rgba(0,0,0,0.4)"}}>
              {/* Title Bar */}
              <div style={{background:"linear-gradient(to right,#0a246a,#a6b4d8)",color:"#fff",padding:"3px 6px",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"12px",fontWeight:"700",userSelect:"none"}}>
                <span>GST Ver. 1003A - [User Master]</span>
                <button onClick={()=>setShowUserMaster(false)} style={{background:"#d4d0c8",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",width:"16px",height:"14px",lineHeight:1,fontSize:"11px",cursor:"pointer",fontWeight:"700",padding:0,color:"#000"}}>✕</button>
              </div>
              {/* Body */}
              <div style={{padding:"10px 12px"}}>
                {/* Form Fields */}
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:"8px"}}>
                  <tbody>
                    {[["Login ID","loginId"],["Password","password"],["Re-Enter Password","rePassword"],["Full Name","fullName"]].map(([lbl,key])=>(
                      <tr key={key}>
                        <td style={{padding:"3px 6px",width:"165px",fontFamily:"Courier New,monospace",fontSize:"12px",whiteSpace:"nowrap"}}>{lbl}:</td>
                        <td style={{padding:"3px 0"}}>
                          <input
                            type={key.toLowerCase().includes("pass")&&!umShowPass?"password":"text"}
                            value={umForm[key]}
                            onChange={e=>setUmForm(f=>({...f,[key]:e.target.value}))}
                            style={{width:"260px",border:"2px inset #808080",background:"#fff",padding:"1px 4px",fontFamily:"Tahoma",fontSize:"12px",outline:"none"}}
                          />
                          {key==="password"&&<label style={{marginLeft:8,fontSize:11,cursor:"pointer"}}><input type="checkbox" checked={umShowPass} onChange={e=>setUmShowPass(e.target.checked)}/> Show</label>}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{padding:"3px 6px",fontFamily:"Courier New,monospace",fontSize:"12px",whiteSpace:"nowrap"}}>User Type............:</td>
                      <td style={{padding:"3px 0"}}>
                        <select value={umForm.userType} onChange={e=>setUmForm(f=>({...f,userType:e.target.value}))}
                          style={{width:"268px",border:"2px inset #808080",background:"#fff",padding:"1px 4px",fontFamily:"Tahoma",fontSize:"12px"}}>
                          <option>Administrator</option>
                          <option>User</option>
                          <option>Supervisor</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td style={{padding:"3px 6px",fontFamily:"Courier New,monospace",fontSize:"12px",verticalAlign:"top",whiteSpace:"nowrap"}}>Description.........:</td>
                      <td style={{padding:"3px 0"}}>
                        <textarea value={umForm.description} onChange={e=>setUmForm(f=>({...f,description:e.target.value}))}
                          style={{width:"260px",height:"40px",border:"2px inset #808080",background:"#fff",padding:"1px 4px",fontFamily:"Tahoma",fontSize:"12px",resize:"none"}}/>
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td style={{padding:"4px 0"}}>
                        <label style={{display:"flex",gap:5,alignItems:"center",fontSize:"12px",cursor:"pointer"}}>
                          <input type="checkbox" checked={umForm.isDefault} onChange={e=>setUmForm(f=>({...f,isDefault:e.target.checked}))}/>
                          Make this User Default User
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Action Buttons Row */}
                <div style={{display:"flex",gap:"6px",marginBottom:"10px",alignItems:"center"}}>
                  {[
                    {lbl:"New", action:()=>{setUmForm({loginId:"",password:"",rePassword:"",fullName:"",userType:"User",description:"",isDefault:false});setUmEditId(null);setUmSelectedUser(null);}},
                    {lbl:"Save", action:()=>{
                      if(!umForm.loginId.trim()){showToast("Login ID required!","error");return;}
                      if(!umEditId&&umForm.password!==umForm.rePassword){showToast("Passwords do not match!","error");return;}
                      if(umEditId){
                        const upd=appUsers.map(u=>u.id===umEditId?{...u,loginId:umForm.loginId,fullName:umForm.fullName,userType:umForm.userType,description:umForm.description,isDefault:umForm.isDefault}:u);
                        setAppUsers(upd);save("store_appusers",upd);
                      } else {
                        const newU={id:uid(),loginId:umForm.loginId,fullName:umForm.fullName,userType:umForm.userType,description:umForm.description,isDefault:umForm.isDefault,password:umForm.password};
                        const upd=[...appUsers,newU];setAppUsers(upd);save("store_appusers",upd);
                      }
                      showToast("User saved successfully!");
                      setUmForm({loginId:"",password:"",rePassword:"",fullName:"",userType:"User",description:"",isDefault:false});setUmEditId(null);setUmSelectedUser(null);
                    }},
                    {lbl:"List", action:()=>{}},
                  ].map(b=>(
                    <button key={b.lbl} onClick={b.action}
                      style={{minWidth:"68px",padding:"3px 10px",background:"#d4d0c8",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",fontFamily:"Tahoma",fontSize:"12px",cursor:"pointer",fontWeight:"700"}}>
                      {b.lbl}
                    </button>
                  ))}
                  <div style={{flex:1}}/>
                  <button onClick={()=>{
                    if(!umSelectedUser){showToast("Select a user first!","error");return;}
                    const upd=appUsers.filter(u=>u.id!==umSelectedUser.id);
                    setAppUsers(upd);save("store_appusers",upd);
                    setUmSelectedUser(null);
                    setUmForm({loginId:"",password:"",rePassword:"",fullName:"",userType:"User",description:"",isDefault:false});
                    setUmEditId(null);
                    showToast("User deleted!");
                  }} style={{padding:"3px 10px",background:"#d4d0c8",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",fontFamily:"Tahoma",fontSize:"12px",cursor:"pointer",fontWeight:"700"}}>
                    Delete User
                  </button>
                  <button onClick={()=>{
                    if(!umSelectedUser){showToast("Select a user first!","error");return;}
                    setUmForm(f=>({...f,password:"",rePassword:""}));
                    showToast("Clear Password fields, enter new password, then click Save.");
                  }} style={{padding:"3px 10px",background:"#d4d0c8",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",fontFamily:"Tahoma",fontSize:"12px",cursor:"pointer",fontWeight:"700"}}>
                    Change Password
                  </button>
                </div>

                {/* Bottom Panel */}
                <div style={{display:"flex",gap:"8px",alignItems:"flex-start"}}>
                  {/* Group Name Input Panel */}
                  <div style={{width:"160px",border:"2px inset #808080",background:"#fff",padding:"6px"}}>
                    <div style={{textAlign:"center",fontWeight:"700",fontSize:"12px",marginBottom:"6px",background:"#d4d0c8",padding:"2px 4px",border:"1px solid #999"}}>: Group Name :</div>
                    <input value={umGroupForm} onChange={e=>setUmGroupForm(e.target.value)} placeholder="Group name..."
                      style={{width:"100%",border:"1px inset #808080",padding:"2px",fontSize:"12px",marginBottom:"8px",boxSizing:"border-box"}}/>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      <div style={{display:"flex",gap:3}}>
                        <button onClick={()=>{if(!umGroupForm.trim())return;const ng={id:uid(),name:umGroupForm.trim(),users:[]};const upd=[...userGroups,ng];setUserGroups(upd);setUmGroupForm("");setUmSelectedGroup(ng);}}
                          style={{flex:1,padding:"2px 4px",background:"#d4d0c8",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",fontSize:"11px",cursor:"pointer",fontWeight:"700"}}>New Group</button>
                        <button onClick={()=>{if(!umSelectedGroup)return;const upd=userGroups.filter(g=>g.id!==umSelectedGroup.id);setUserGroups(upd);setUmSelectedGroup(null);}}
                          style={{flex:1,padding:"2px 4px",background:"#d4d0c8",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",fontSize:"11px",cursor:"pointer"}}>{"<<--"}</button>
                      </div>
                      <div style={{display:"flex",gap:3}}>
                        <button onClick={()=>{if(!umSelectedGroup)return;showToast("Group '"+umSelectedGroup.name+"' saved with users!");}}
                          style={{flex:1,padding:"2px 4px",background:"#d4d0c8",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",fontSize:"11px",cursor:"pointer",fontWeight:"700"}}>Save Group</button>
                        <button style={{flex:1,padding:"2px 4px",background:"#d4d0c8",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",fontSize:"11px",cursor:"pointer"}}>{"-->>"}</button>
                      </div>
                    </div>
                  </div>

                  {/* Group List */}
                  <div style={{flex:1,border:"2px inset #808080",background:"#fff",minHeight:"130px",padding:"4px"}}>
                    <div style={{textAlign:"center",fontWeight:"700",fontSize:"11px",marginBottom:4,background:"#b8e8b8",border:"1px solid #808080",padding:"1px 4px"}}>GROUP LIST</div>
                    {userGroups.map(g=>(
                      <div key={g.id} onClick={()=>setUmSelectedGroup(g)}
                        style={{padding:"3px 6px",fontSize:"12px",cursor:"pointer",fontFamily:"Tahoma",
                          background:umSelectedGroup?.id===g.id?"#000080":"transparent",
                          color:umSelectedGroup?.id===g.id?"#fff":"#000"}}>
                        {g.name}
                      </div>
                    ))}
                  </div>

                  {/* User List */}
                  <div style={{flex:1,border:"2px inset #808080",background:"#fff",minHeight:"130px",padding:"4px"}}>
                    <div style={{textAlign:"center",fontWeight:"700",fontSize:"11px",marginBottom:4,background:"#b8b8e8",border:"1px solid #808080",padding:"1px 4px"}}>USER LIST</div>
                    {appUsers.map(u=>(
                      <div key={u.id} style={{display:"flex",gap:5,alignItems:"center",padding:"2px 4px",cursor:"pointer",
                        background:umSelectedUser?.id===u.id?"#1a56db":"transparent"}}
                        onClick={()=>{setUmSelectedUser(u);setUmEditId(u.id);setUmForm({loginId:u.loginId,password:"",rePassword:"",fullName:u.fullName||"",userType:u.userType||"User",description:u.description||"",isDefault:u.isDefault||false});}}>
                        <input type="checkbox" checked={!!umGroupUserSel[u.id]}
                          onChange={e=>setUmGroupUserSel(s=>({...s,[u.id]:e.target.checked}))}
                          onClick={e=>e.stopPropagation()}
                          style={{cursor:"pointer"}}/>
                        <span style={{fontSize:"12px",fontFamily:"Tahoma",color:umSelectedUser?.id===u.id?"#fff":"#000"}}>{u.loginId}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div style={{display:"flex",justifyContent:"center",gap:"8px",marginTop:"10px",paddingTop:"8px",borderTop:"1px solid #999"}}>
                  <button onClick={()=>showToast("Users saved for group!")}
                    style={{padding:"3px 18px",background:"#d4d0c8",border:"2px solid",borderColor:"#ffffff #808080 #808080 #ffffff",fontFamily:"Tahoma",fontSize:"12px",cursor:"pointer",fontWeight:"700"}}>
                    Save Users for Group
                  </button>
                  <button onClick={()=>setShowUserMaster(false)}
                    style={{padding:"3px 18px",background:"#cc2222",color:"#fff",border:"2px solid",borderColor:"#ff7777 #770000 #770000 #ff7777",fontFamily:"Tahoma",fontSize:"12px",cursor:"pointer",fontWeight:"700"}}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
