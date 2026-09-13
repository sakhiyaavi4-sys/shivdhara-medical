// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Plus, Edit2, Trash2, ShoppingCart, Eye, EyeOff, X, Check, CheckCircle, 
  AlertCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Phone, Mail, 
  MapPin, Clock, FileText, TrendingUp, Truck, CreditCard, Users, Printer, Barcode,
  RotateCcw, Copy, ExternalLink, HelpCircle
} from 'lucide-react';
import { 
  useMedicalStore, DIVISIONS, GST_RATES, fmt, num, int, uid, today, inp, lbl, btn 
} from '../../MedicalStoreContext';

interface MastersModuleProps {
  ownerSubTab: string;
  setOwnerSubTab: (tab: string) => void;
  setShowWipModal: (msg: string) => void;
  kitViewMode?: string;
  setKitViewMode?: (mode: string) => void;
  contractEmpViewMode?: string;
  setContractEmpViewMode?: (mode: string) => void;
}

export default function MastersModule({
  ownerSubTab,
  setOwnerSubTab,
  setShowWipModal,
  kitViewMode = "editor",
  setKitViewMode = () => {},
  contractEmpViewMode = "editor",
  setContractEmpViewMode = () => {},
}: MastersModuleProps) {
  const {
    items, batches, suppliers, salesBills, customers, doctors,
    saveItems, saveSuppliers, showToast, showConfirm,
    isOwner, setActiveSection, activeSection
  } = useMedicalStore();

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

  // ═════════════════════════════════════════════════════════════
  // COMPANY MASTER STATES (Theme matching Inventory / Image 2)
  // ═════════════════════════════════════════════════════════════
  const defaultCompanyForm = {
    id: "",
    srNo: 1,
    code: "",
    location: "",
    name: "",
    person: "",
    address: "",
    area: "",
    city: "",
    contact: "",
    mobile: "",
    email: "",
    dlNo: "",
    remarks: "",
    relatedSuppliers: [], // array of supplier names
    status: "active" // "active" | "inactive"
  };

  const [companies, setCompanies] = useState(() => {
    try {
      const stored = localStorage.getItem("store_companies");
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    // Seed from unique company names in items if available
    const itemComps = [...new Set((items || []).map(i => i.company?.trim()).filter(Boolean))];
    if (itemComps.length > 0) {
      return itemComps.map((cName, idx) => ({
        ...defaultCompanyForm,
        id: uid(),
        srNo: idx + 1,
        code: cName.substring(0, 4).toUpperCase(),
        name: cName.toUpperCase(),
        status: "active",
        relatedSuppliers: []
      }));
    }
    return [];
  });

  const [companyForm, setCompanyForm] = useState(defaultCompanyForm);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [companySearch, setCompanySearch] = useState("");
  const [companySearchDropdown, setCompanySearchDropdown] = useState(false);
  const [companySearchHighlight, setCompanySearchHighlight] = useState(0);
  const [companyStatusFilter, setCompanyStatusFilter] = useState("All");
  const [companySortBy, setCompanySortBy] = useState("name");
  const [deleteWithItems, setDeleteWithItems] = useState(false);
  const [newSupplierInput, setNewSupplierInput] = useState("");
  const [supplierFilterText, setSupplierFilterText] = useState("");

  // ═════════════════════════════════════════════════════════════
  // SUPPLIER MASTER STATES (Theme matching Inventory / Image 2)
  // ═════════════════════════════════════════════════════════════
  const defaultSupplierMasterForm = {
    id: "",
    srNo: 1,
    code: "",
    name: "",
    person: "",
    address: "",
    area: "",
    city: "",
    contact: "",
    mobile: "",
    email: "",
    message: "",
    dlNo: "",
    stNo: "",
    remarks: "",
    relatedCompanies: [], // array of company names
    status: "active"
  };

  const [suppMasterForm, setSuppMasterForm] = useState(defaultSupplierMasterForm);
  const [showSuppMasterForm, setShowSuppMasterForm] = useState(false);
  const [editingSuppMaster, setEditingSuppMaster] = useState(null);
  const [suppMasterSearch, setSuppMasterSearch] = useState("");
  const [suppMasterSearchDropdown, setSuppMasterSearchDropdown] = useState(false);
  const [suppMasterSearchHighlight, setSuppMasterSearchHighlight] = useState(0);
  const [suppMasterStatusFilter, setSuppMasterStatusFilter] = useState("All");
  const [suppMasterSortBy, setSuppMasterSortBy] = useState("name");
  const [newCompanyInput, setNewCompanyInput] = useState("");
  const [companyFilterText, setCompanyFilterText] = useState("");
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelSupplier, setLabelSupplier] = useState(null);

  // ═════════════════════════════════════════════════════════════
  // DRUG GROUP MASTER STATES (Theme matching Inventory / Image 2)
  // ═════════════════════════════════════════════════════════════
  const defaultDrugGroupForm = {
    id: "",
    srNo: 1,
    code: "",
    name: "",
    onlyStockProduct: false,
    contents: "",
    remarks: "",
    fileAttachment: ""
  };

  const [drugGroups, setDrugGroups] = useState(() => {
    try {
      const stored = localStorage.getItem("store_drug_groups");
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    // Seed from unique drug groups in items if available
    const itemGroups = [...new Set((items || []).map(i => i.drugGroup?.trim()).filter(Boolean))];
    if (itemGroups.length > 0) {
      return itemGroups.map((gName, idx) => ({
        ...defaultDrugGroupForm,
        id: uid(),
        srNo: idx + 1,
        code: gName.substring(0, 4).toUpperCase(),
        name: gName.toUpperCase()
      }));
    }
    return [];
  });

  const [drugGroupForm, setDrugGroupForm] = useState(defaultDrugGroupForm);
  const [showDrugGroupForm, setShowDrugGroupForm] = useState(false);
  const [editingDrugGroup, setEditingDrugGroup] = useState(null);
  const [drugGroupSearch, setDrugGroupSearch] = useState("");
  const [drugGroupSearchDropdown, setDrugGroupSearchDropdown] = useState(false);
  const [drugGroupSearchHighlight, setDrugGroupSearchHighlight] = useState(0);
  const [onlyStockFilter, setOnlyStockFilter] = useState(false);
  const [drugGroupSortBy, setDrugGroupSortBy] = useState("name");
  const [selectedGroupForItemsModal, setSelectedGroupForItemsModal] = useState(null);

  // ─── KIT MASTER STATES ───
  const defaultKitForm = {
    id: "",
    srNo: 1,
    code: "KIT001",
    refDate: today ? today() : "05/09/2026",
    doctor: "",
    kitName: "",
    remindDays: 0,
    add1: "",
    remark: "",
    viewLocation: false,
    add2: "",
    contact: "",
    disc: 0,
    items: []
  };

  const [kits, setKits] = useState(() => {
    try {
      const stored = localStorage.getItem("store_kits");
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return [
      {
        id: "kit-101",
        srNo: 1,
        code: "KIT001",
        refDate: "05/09/2026",
        doctor: "DR. PATEL (MD MEDICINE)",
        kitName: "FEVER & VIRAL 5-DAY TREATMENT KIT",
        remindDays: 5,
        add1: "A-102, SHREEJI HEIGHTS",
        add2: "NEAR MEDICAL CAMPUS, SURAT",
        contact: "9876543210",
        remark: "Take tablets after food with warm water. Complete full course.",
        viewLocation: true,
        disc: 5,
        items: [
          { id: "ki-1", itemId: "1", itemName: "PARACETAMOL 650MG", morning: 1, noon: 0, evening: 1, night: 1, days: 5, total: 15, sRate: 3.5, location: "RACK-A1" },
          { id: "ki-2", itemId: "2", itemName: "CETIRIZINE 10MG", morning: 0, noon: 0, evening: 0, night: 1, days: 5, total: 5, sRate: 4.0, location: "RACK-B2" },
          { id: "ki-3", itemId: "3", itemName: "AZITHROMYCIN 500MG", morning: 1, noon: 0, evening: 0, night: 0, days: 3, total: 3, sRate: 22.0, location: "RACK-C1" },
          { id: "ki-4", itemId: "4", itemName: "PANTOPRAZOLE 40MG", morning: 1, noon: 0, evening: 0, night: 0, days: 5, total: 5, sRate: 9.5, location: "RACK-A3" }
        ]
      },
      {
        id: "kit-102",
        srNo: 2,
        code: "KIT002",
        refDate: "05/09/2026",
        doctor: "DR. SHAH (ORTHOPEDIC)",
        kitName: "POST SURGERY JOINT PAIN RECOVERY KIT",
        remindDays: 10,
        add1: "B-404, RADHE COMPLEX",
        add2: "RING ROAD, SURAT",
        contact: "9825123456",
        remark: "Take pain medication with antacid. Strictly avoid heavy lifting.",
        viewLocation: false,
        disc: 10,
        items: [
          { id: "ki-5", itemId: "5", itemName: "AMOXYCLAV 625MG", morning: 1, noon: 0, evening: 1, night: 0, days: 7, total: 14, sRate: 18.0, location: "RACK-C2" },
          { id: "ki-6", itemId: "6", itemName: "ACECLOFENAC + PARACETAMOL", morning: 1, noon: 0, evening: 1, night: 0, days: 5, total: 10, sRate: 7.5, location: "RACK-A2" },
          { id: "ki-7", itemId: "7", itemName: "RABEPRAZOLE DSR", morning: 1, noon: 0, evening: 0, night: 0, days: 7, total: 7, sRate: 14.0, location: "RACK-A4" }
        ]
      }
    ];
  });

  const [kitForm, setKitForm] = useState(() => {
    try {
      const stored = localStorage.getItem("store_kits");
      if (stored) {
        const arr = JSON.parse(stored);
        if (arr && arr.length > 0) return { ...arr[0] };
      }
    } catch (_) {}
    return {
      id: "kit-101",
      srNo: 1,
      code: "KIT001",
      refDate: "05/09/2026",
      doctor: "DR. PATEL (MD MEDICINE)",
      kitName: "FEVER & VIRAL 5-DAY TREATMENT KIT",
      remindDays: 5,
      add1: "A-102, SHREEJI HEIGHTS",
      add2: "NEAR MEDICAL CAMPUS, SURAT",
      contact: "9876543210",
      remark: "Take tablets after food with warm water. Complete full course.",
      viewLocation: true,
      disc: 5,
      items: [
        { id: "ki-1", itemId: "1", itemName: "PARACETAMOL 650MG", morning: 1, noon: 0, evening: 1, night: 1, days: 5, total: 15, sRate: 3.5, location: "RACK-A1" },
        { id: "ki-2", itemId: "2", itemName: "CETIRIZINE 10MG", morning: 0, noon: 0, evening: 0, night: 1, days: 5, total: 5, sRate: 4.0, location: "RACK-B2" },
        { id: "ki-3", itemId: "3", itemName: "AZITHROMYCIN 500MG", morning: 1, noon: 0, evening: 0, night: 0, days: 3, total: 3, sRate: 22.0, location: "RACK-C1" },
        { id: "ki-4", itemId: "4", itemName: "PANTOPRAZOLE 40MG", morning: 1, noon: 0, evening: 0, night: 0, days: 5, total: 5, sRate: 9.5, location: "RACK-A3" }
      ]
    };
  });

  const [editingKit, setEditingKit] = useState(null);
  // (kitViewMode managed via props)
  const [kitSearch, setKitSearch] = useState("");
  const [kitSelectedRowIndex, setKitSelectedRowIndex] = useState(null);
  const [kitItemSearchText, setKitItemSearchText] = useState("");
  const [kitItemDropdown, setKitItemDropdown] = useState(false);
  const [kitItemHighlight, setKitItemHighlight] = useState(0);
  const [kitQuickDosage, setKitQuickDosage] = useState("1-0-1");
  const [kitQuickDays, setKitQuickDays] = useState(5);

  // ─── DOCTOR MASTER ADVANCED STATES (Matching Legacy Screenshot) ───
  const defaultFullDoctorForm = {
    id: "",
    srNo: 1,
    code: "DOC001",
    regNo: "",
    name: "",
    degree: "",
    password: "",
    address: "",
    address2: "",
    area: "",
    salesPercent: 10,
    city: "SURAT",
    returnPercent: 10,
    mobile: "",
    contact: "",
    email: "",
    remarks: "",
    isPermanent: false,
    date1: "",
    note1: "",
    date2: "",
    note2: "",
    date3: "",
    note3: "",
    linkedItems: []
  };

  const [docMasterForm, setDocMasterForm] = useState(defaultFullDoctorForm);
  const [editingDocId, setEditingDocId] = useState(null);
  const [docViewMode, setDocViewMode] = useState("editor"); // "editor" | "list"
  const [docSearch, setDocSearch] = useState("");
  const [docFilterPermanent, setDocFilterPermanent] = useState(false);
  const [showItemLinkModal, setShowItemLinkModal] = useState(false);
  const [itemLinkSearch, setItemLinkSearch] = useState("");
  const [itemLinkDropdown, setItemLinkDropdown] = useState(false);

  // ─── PATIENT MASTER ADVANCED STATES (Matching Legacy Screenshot 1 & 2) ───
  const defaultPatientForm = {
    id: "",
    srNo: 1,
    type: "General", // "General" | "TB" | "Chronic" | "Senior Citizen"
    code: "PAT001",
    birthDate: "01/01/1990",
    sex: "Male",
    name: "",
    relativeName: "",
    address: "",
    address2: "",
    area: "",
    pincode: "395006",
    city: "SURAT",
    contact: "",
    mobile: "",
    email: "",
    remarks: "",
    goiIdNo: "",
    tbDiagnosisDate: "01/01/1900",
    tbTreatInitDate: "01/01/1900",
    diagnosis: ""
  };

  const [patients, setPatients] = useState(() => {
    try {
      const stored = localStorage.getItem("store_patients");
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return [
      {
        id: "pat-101",
        srNo: 1,
        type: "General",
        code: "PAT001",
        birthDate: "15/08/1985",
        sex: "Male",
        name: "RAMESHBHAI P. PATEL",
        relativeName: "PRAVINBHAI PATEL",
        address: "Plot No. 45, Sardar Society",
        address2: "Near Mini Bazar",
        area: "Varachha",
        pincode: "395006",
        city: "SURAT",
        contact: "0261-2541234",
        mobile: "9825012345",
        email: "ramesh.patel@gmail.com",
        remarks: "Hypertension regular patient. Avoid penicillin.",
        goiIdNo: "",
        tbDiagnosisDate: "01/01/1900",
        tbTreatInitDate: "01/01/1900",
        diagnosis: "Essential Hypertension, Mild Hyperlipidemia, Vitamin D3 Deficiency."
      },
      {
        id: "pat-102",
        srNo: 2,
        type: "TB",
        code: "PAT002",
        birthDate: "10/03/1992",
        sex: "Female",
        name: "ANITABEN S. CHAUHAN",
        relativeName: "SANJAYBHAI CHAUHAN",
        address: "B-203, Radhe Krishna Apts",
        address2: "Opp. Community Hall",
        area: "Katargam",
        pincode: "395004",
        city: "SURAT",
        contact: "9898123456",
        mobile: "9898123456",
        email: "anita.chauhan@outlook.com",
        remarks: "Under Central TB Program Category 1 DOTS Intensive Phase.",
        goiIdNo: "NIKSHAY-GJ-SRT-2026-8841",
        tbDiagnosisDate: "12/07/2026",
        tbTreatInitDate: "15/07/2026",
        diagnosis: "Pulmonary Tuberculosis (Bacteriologically Confirmed). Active 4-FDC (HRZE) regimen."
      }
    ];
  });

  const [patientForm, setPatientForm] = useState(() => {
    try {
      const stored = localStorage.getItem("store_patients");
      if (stored) {
        const arr = JSON.parse(stored);
        if (arr && arr.length > 0) return { ...arr[0] };
      }
    } catch (_) {}
    return {
      id: "pat-101",
      srNo: 1,
      type: "General",
      code: "PAT001",
      birthDate: "15/08/1985",
      sex: "Male",
      name: "RAMESHBHAI P. PATEL",
      relativeName: "PRAVINBHAI PATEL",
      address: "Plot No. 45, Sardar Society",
      address2: "Near Mini Bazar",
      area: "Varachha",
      pincode: "395006",
      city: "SURAT",
      contact: "0261-2541234",
      mobile: "9825012345",
      email: "ramesh.patel@gmail.com",
      remarks: "Hypertension regular patient. Avoid penicillin.",
      goiIdNo: "",
      tbDiagnosisDate: "01/01/1900",
      tbTreatInitDate: "01/01/1900",
      diagnosis: "Essential Hypertension, Mild Hyperlipidemia, Vitamin D3 Deficiency."
    };
  });

  const [editingPatientId, setEditingPatientId] = useState(null);
  const [patientViewMode, setPatientViewMode] = useState("editor"); // "editor" | "list"
  const [patientSearch, setPatientSearch] = useState("");
  const [patientTypeFilter, setPatientTypeFilter] = useState("All");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [customPatientMsg, setCustomPatientMsg] = useState("");

  // ─── CONTRACT EMPLOYEE MASTER STATES (Matching Legacy Screenshot) ───
  const defaultContractCompanies = [
    "RELIANCE INDUSTRIES LTD (HAZIRA)",
    "LARSEN & TOUBRO (L&T HAZIRA)",
    "AM/NS INDIA (ESSAR STEEL)",
    "GUJARAT GAS CO. LTD",
    "ONGC HAZIRA PLANT",
    "ONLINE ORDER A/C",
    "PENDING PAYMENT A/C"
  ];

  const defaultContractEmployeeForm = {
    id: "",
    srNo: 1,
    code: "EMP001",
    name: "",
    contractCompany: "RELIANCE INDUSTRIES LTD (HAZIRA)",
    department: "",
    designation: "",
    mobile: "",
    email: "",
    creditLimit: 25000,
    remarks: "",
    dependents: [
      { id: "dep-1", relation: "Self", name: "", age: 35, gender: "Male" }
    ]
  };

  const [contractEmployees, setContractEmployees] = useState(() => {
    try {
      const stored = localStorage.getItem("store_contract_employees");
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return [
      {
        id: "ce-101",
        srNo: 1,
        code: "EMP001",
        name: "RAKESH M. SHARMA",
        contractCompany: "RELIANCE INDUSTRIES LTD (HAZIRA)",
        department: "OPERATIONS & MAINTENANCE",
        designation: "SENIOR ENGINEER",
        mobile: "9825112233",
        email: "rakesh.sharma@reliance.com",
        creditLimit: 25000,
        remarks: "Approved for 100% cashless corporate medicine supply.",
        dependents: [
          { id: "dep-1", relation: "Self", name: "RAKESH M. SHARMA", age: 38, gender: "Male" },
          { id: "dep-2", relation: "Wife", name: "PRIYABEN SHARMA", age: 35, gender: "Female" },
          { id: "dep-3", relation: "Son", name: "AARAV SHARMA", age: 10, gender: "Male" },
          { id: "dep-4", relation: "Mother", name: "KANTABEN SHARMA", age: 65, gender: "Female" }
        ]
      },
      {
        id: "ce-102",
        srNo: 2,
        code: "EMP002",
        name: "PRAKASHBHAI G. DESAI",
        contractCompany: "LARSEN & TOUBRO (L&T HAZIRA)",
        department: "HEAVY ENGINEERING",
        designation: "SUPERVISOR",
        mobile: "9879012345",
        email: "prakash.desai@larsentoubro.com",
        creditLimit: 20000,
        remarks: "Monthly credit limit approved by HR department.",
        dependents: [
          { id: "dep-5", relation: "Self", name: "PRAKASHBHAI G. DESAI", age: 44, gender: "Male" },
          { id: "dep-6", relation: "Wife", name: "GEETABEN DESAI", age: 41, gender: "Female" },
          { id: "dep-7", relation: "Daughter", name: "RIDDHI DESAI", age: 16, gender: "Female" },
          { id: "dep-8", relation: "Father", name: "GOVINDBHAI DESAI", age: 72, gender: "Male" }
        ]
      },
      {
        id: "ce-103",
        srNo: 3,
        code: "EMP003",
        name: "MANISH K. CHAUHAN",
        contractCompany: "AM/NS INDIA (ESSAR STEEL)",
        department: "QUALITY ASSURANCE",
        designation: "MANAGER",
        mobile: "9898054321",
        email: "manish.chauhan@amns.in",
        creditLimit: 30000,
        remarks: "Regular corporate account. All bills attached with prescription.",
        dependents: [
          { id: "dep-9", relation: "Self", name: "MANISH K. CHAUHAN", age: 42, gender: "Male" },
          { id: "dep-10", relation: "Wife", name: "MEENABEN CHAUHAN", age: 39, gender: "Female" },
          { id: "dep-11", relation: "Son", name: "DHRUV CHAUHAN", age: 14, gender: "Male" }
        ]
      }
    ];
  });

  const [contractEmployeeForm, setContractEmployeeForm] = useState(() => {
    try {
      const stored = localStorage.getItem("store_contract_employees");
      if (stored) {
        const arr = JSON.parse(stored);
        if (arr && arr.length > 0) return { ...arr[0] };
      }
    } catch (_) {}
    return {
      id: "ce-101",
      srNo: 1,
      code: "EMP001",
      name: "RAKESH M. SHARMA",
      contractCompany: "RELIANCE INDUSTRIES LTD (HAZIRA)",
      department: "OPERATIONS & MAINTENANCE",
      designation: "SENIOR ENGINEER",
      mobile: "9825112233",
      email: "rakesh.sharma@reliance.com",
      creditLimit: 25000,
      remarks: "Approved for 100% cashless corporate medicine supply.",
      dependents: [
        { id: "dep-1", relation: "Self", name: "RAKESH M. SHARMA", age: 38, gender: "Male" },
        { id: "dep-2", relation: "Wife", name: "PRIYABEN SHARMA", age: 35, gender: "Female" },
        { id: "dep-3", relation: "Son", name: "AARAV SHARMA", age: 10, gender: "Male" },
        { id: "dep-4", relation: "Mother", name: "KANTABEN SHARMA", age: 65, gender: "Female" }
      ]
    };
  });

  const [editingContractEmpId, setEditingContractEmpId] = useState(null);
  // (contractEmpViewMode managed via props)
  const [contractEmpSearch, setContractEmpSearch] = useState("");
  const [contractEmpCompanyFilter, setContractEmpCompanyFilter] = useState("All");
  const [showTransferCompanyModal, setShowTransferCompanyModal] = useState(false);
  const [targetTransferCompany, setTargetTransferCompany] = useState("");
  const [newDepRelation, setNewDepRelation] = useState("Self");
  const [newDepName, setNewDepName] = useState("");
  const [newDepAge, setNewDepAge] = useState(30);
  const [newDepGender, setNewDepGender] = useState("Male");

  // ─── OTHER MASTERS (101 to 119 Lookup Categories) ───
  const OTHER_MASTER_CATEGORIES = [
    { code: "101", name: "Area Master", icon: "📍", desc: "Local territory delivery zones and sales areas" },
    { code: "102", name: "City Master", icon: "🏙️", desc: "Municipalities and logistics cities" },
    { code: "103", name: "Customer Bank", icon: "🏦", desc: "Customer banking institutions & clearing branches" },
    { code: "104", name: "Payment Term", icon: "⏳", desc: "Credit terms, payment due day definitions" },
    { code: "105", name: "Payment Type", icon: "💳", desc: "Accepted settlement modes & tender channels" },
    { code: "106", name: "Item Type", icon: "💊", desc: "Formulation dosage forms (Tablet, Syrup, Injection)" },
    { code: "107", name: "Doctor Degree", icon: "🎓", desc: "Medical qualification titles and doctor designations" },
    { code: "108", name: "Sales Man (Purchase)", icon: "👔", desc: "Purchase procurement agents & field staff" },
    { code: "109", name: "Sales Man (Sales)", icon: "💼", desc: "Counter sales personnel & marketing reps" },
    { code: "111", name: "Mobile Company (Sim Form)", icon: "📱", desc: "Cellular network operators for SIM documentation" },
    { code: "112", name: "Distributors (Sim Form)", icon: "🏢", desc: "Telecom and agency distributors" },
    { code: "113", name: "Dealers (Sim Form)", icon: "🏪", desc: "Authorized dealers and franchised retailers" },
    { code: "114", name: "Nationality (Sim Form)", icon: "🌍", desc: "Citizen and resident nationality classifications" },
    { code: "115", name: "Item Category", icon: "🏷️", desc: "Product department (Ethical, OTC, Generic, Surgical)" },
    { code: "116", name: "Item Location", icon: "📦", desc: "Store warehouse aisle, rack, and shelf locations" },
    { code: "117", name: "ID Proof1 (Sim Form)", icon: "🪪", desc: "Primary government identity proof types" },
    { code: "118", name: "ID Proof2 (Sim Form)", icon: "📄", desc: "Secondary identity and address verification proofs" },
    { code: "119", name: "Patient Diagnosis", icon: "🩺", desc: "Clinical conditions, ICD descriptions, symptom tags" }
  ];

  const INITIAL_OTHER_MASTERS_DATA = {
    "101": [
      { id: "101-1", srNo: 1, name: "Station Road", description: "Central Station commercial area", createdAt: "2026-01-10" },
      { id: "101-2", srNo: 2, name: "Market Yard", description: "Agricultural and wholesale market zone", createdAt: "2026-01-10" },
      { id: "101-3", srNo: 3, name: "Ring Road", description: "Outer bypass commercial hub", createdAt: "2026-01-11" },
      { id: "101-4", srNo: 4, name: "City Center", description: "Prime urban hospital area", createdAt: "2026-01-12" }
    ],
    "102": [
      { id: "102-1", srNo: 1, name: "Surat", description: "South Gujarat region", createdAt: "2026-01-05" },
      { id: "102-2", srNo: 2, name: "Ahmedabad", description: "Central corporate region", createdAt: "2026-01-05" },
      { id: "102-3", srNo: 3, name: "Rajkot", description: "Saurashtra region", createdAt: "2026-01-06" },
      { id: "102-4", srNo: 4, name: "Vadodara", description: "East Central region", createdAt: "2026-01-06" },
      { id: "102-5", srNo: 5, name: "Navsari", description: "South highway belt", createdAt: "2026-01-08" }
    ],
    "103": [
      { id: "103-1", srNo: 1, name: "HDFC Bank", description: "Private commercial bank", createdAt: "2026-01-15" },
      { id: "103-2", srNo: 2, name: "State Bank of India (SBI)", description: "Public sector scheduled bank", createdAt: "2026-01-15" },
      { id: "103-3", srNo: 3, name: "ICICI Bank", description: "Private retail bank", createdAt: "2026-01-16" },
      { id: "103-4", srNo: 4, name: "Axis Bank", description: "Private retail bank", createdAt: "2026-01-16" },
      { id: "103-5", srNo: 5, name: "Bank of Baroda", description: "Public sector commercial bank", createdAt: "2026-01-18" }
    ],
    "104": [
      { id: "104-1", srNo: 1, name: "Immediate (Cash)", description: "Net 0 days payment due immediately", createdAt: "2026-01-01" },
      { id: "104-2", srNo: 2, name: "Net 15 Days", description: "Payment due within 15 calendar days", createdAt: "2026-01-01" },
      { id: "104-3", srNo: 3, name: "Net 30 Days", description: "Standard month credit term", createdAt: "2026-01-01" },
      { id: "104-4", srNo: 4, name: "Net 45 Days", description: "Extended supplier credit term", createdAt: "2026-01-02" },
      { id: "104-5", srNo: 5, name: "Net 60 Days", description: "Quarterly institutional credit term", createdAt: "2026-01-02" }
    ],
    "105": [
      { id: "105-1", srNo: 1, name: "Cash", description: "Physical currency notes & coins", createdAt: "2026-01-01" },
      { id: "105-2", srNo: 2, name: "UPI / QR Code", description: "Google Pay, PhonePe, Paytm instant transfer", createdAt: "2026-01-01" },
      { id: "105-3", srNo: 3, name: "Credit / Debit Card", description: "POS EDC swipe machine transaction", createdAt: "2026-01-01" },
      { id: "105-4", srNo: 4, name: "Cheque / DD", description: "Bank clearing instrument", createdAt: "2026-01-02" },
      { id: "105-5", srNo: 5, name: "NEFT / RTGS / IMPS", description: "Direct net banking ledger settlement", createdAt: "2026-01-02" },
      { id: "105-6", srNo: 6, name: "Credit Note / Ledger", description: "Adjustment against customer credit account", createdAt: "2026-01-05" }
    ],
    "106": [
      { id: "106-1", srNo: 1, name: "Tablet", description: "Solid oral compressed tablet dosage", createdAt: "2026-01-01" },
      { id: "106-2", srNo: 2, name: "Capsule", description: "Hard/soft gelatin encapsulated medicine", createdAt: "2026-01-01" },
      { id: "106-3", srNo: 3, name: "Syrup / Suspension", description: "Liquid oral formulation", createdAt: "2026-01-01" },
      { id: "106-4", srNo: 4, name: "Injection (Vial/Ampoule)", description: "Sterile parenteral liquid or powder", createdAt: "2026-01-02" },
      { id: "106-5", srNo: 5, name: "Ointment / Gel / Cream", description: "Topical dermatological application", createdAt: "2026-01-02" },
      { id: "106-6", srNo: 6, name: "Eye / Ear / Nasal Drops", description: "Sterile ophthalmic / otic drops", createdAt: "2026-01-03" },
      { id: "106-7", srNo: 7, name: "Powder / Sachet", description: "Effervescent or oral rehydration salt", createdAt: "2026-01-03" }
    ],
    "107": [
      { id: "107-1", srNo: 1, name: "M.B.B.S.", description: "Bachelor of Medicine & Bachelor of Surgery", createdAt: "2026-01-01" },
      { id: "107-2", srNo: 2, name: "M.D. (Medicine)", description: "Doctor of Medicine - Internal Physician", createdAt: "2026-01-01" },
      { id: "107-3", srNo: 3, name: "M.S. (Surgeon)", description: "Master of Surgery - General / Ortho Surgeon", createdAt: "2026-01-01" },
      { id: "107-4", srNo: 4, name: "B.A.M.S.", description: "Bachelor of Ayurvedic Medicine & Surgery", createdAt: "2026-01-02" },
      { id: "107-5", srNo: 5, name: "B.H.M.S.", description: "Bachelor of Homeopathic Medicine & Surgery", createdAt: "2026-01-02" },
      { id: "107-6", srNo: 6, name: "B.D.S. / M.D.S.", description: "Dental Surgery Specialist", createdAt: "2026-01-03" },
      { id: "107-7", srNo: 7, name: "D.N.B. / D.C.H.", description: "Diplomate National Board / Child Health Specialist", createdAt: "2026-01-04" },
      { id: "107-8", srNo: 8, name: "M.Ch. / D.M.", description: "Super-specialist (Cardio / Neuro / Nephro)", createdAt: "2026-01-05" }
    ],
    "108": [
      { id: "108-1", srNo: 1, name: "Ramesh Patel", description: "Senior Purchase Procurement Incharge", createdAt: "2026-01-10" },
      { id: "108-2", srNo: 2, name: "Suresh Shah", description: "Generic & Surgical Vendor Relations", createdAt: "2026-01-12" },
      { id: "108-3", srNo: 3, name: "Kishor Verma", description: "Direct Depot Stock Incharge", createdAt: "2026-01-15" }
    ],
    "109": [
      { id: "109-1", srNo: 1, name: "Amit Dave", description: "Senior Counter Sales Executive", createdAt: "2026-01-05" },
      { id: "109-2", srNo: 2, name: "Jignesh Modi", description: "Institutional & Hospital Supply Rep", createdAt: "2026-01-05" },
      { id: "109-3", srNo: 3, name: "Pravin Solanki", description: "Evening Shift Billing Incharge", createdAt: "2026-01-08" },
      { id: "109-4", srNo: 4, name: "Bhavin Trivedi", description: "Retail Delivery Executive", createdAt: "2026-01-12" }
    ],
    "111": [
      { id: "111-1", srNo: 1, name: "Airtel", description: "Bharti Airtel Telecommunications", createdAt: "2026-01-01" },
      { id: "111-2", srNo: 2, name: "Jio (Reliance)", description: "Reliance Jio Infocomm Ltd", createdAt: "2026-01-01" },
      { id: "111-3", srNo: 3, name: "Vodafone Idea (Vi)", description: "Vi Cellular Network Operator", createdAt: "2026-01-01" },
      { id: "111-4", srNo: 4, name: "BSNL", description: "Bharat Sanchar Nigam Limited", createdAt: "2026-01-02" }
    ],
    "112": [
      { id: "112-1", srNo: 1, name: "Shivam Pharma Distribution", description: "Authorized Regional Distributor", createdAt: "2026-01-04" },
      { id: "112-2", srNo: 2, name: "Royal Healthcare Agency", description: "Vaccines & Critical Care C&F", createdAt: "2026-01-04" },
      { id: "112-3", srNo: 3, name: "Shreeji Medico Syndicate", description: "Generic medicines wholesale distributor", createdAt: "2026-01-06" }
    ],
    "113": [
      { id: "113-1", srNo: 1, name: "MedPlus Dealers", description: "Secondary stockist & retail dealer", createdAt: "2026-01-04" },
      { id: "113-2", srNo: 2, name: "Apex Surgical Supplies", description: "Disposable needles, gloves, IV sets dealer", createdAt: "2026-01-06" },
      { id: "113-3", srNo: 3, name: "Gujarat Medical Agencies", description: "Surgical and implants stock dealer", createdAt: "2026-01-08" }
    ],
    "114": [
      { id: "114-1", srNo: 1, name: "Indian", description: "Resident Indian citizen", createdAt: "2026-01-01" },
      { id: "114-2", srNo: 2, name: "Non-Resident Indian (NRI)", description: "Overseas Indian national with passport", createdAt: "2026-01-01" },
      { id: "114-3", srNo: 3, name: "Foreign National", description: "International traveler / medical visa holder", createdAt: "2026-01-02" }
    ],
    "115": [
      { id: "115-1", srNo: 1, name: "Ethical Prescription", description: "Doctor prescribed pharmaceutical drugs", createdAt: "2026-01-01" },
      { id: "115-2", srNo: 2, name: "Generic Medicine", description: "Affordable branded generic pharmaceuticals", createdAt: "2026-01-01" },
      { id: "115-3", srNo: 3, name: "OTC (Over The Counter)", description: "Wellness, balms, antiseptics, vitamins", createdAt: "2026-01-01" },
      { id: "115-4", srNo: 4, name: "Surgical & Disposable", description: "Bandages, syringes, catheters, surgical tape", createdAt: "2026-01-02" },
      { id: "115-5", srNo: 5, name: "Ayurvedic & Herbal", description: "Ayush formulations, herbal oils, powders", createdAt: "2026-01-02" },
      { id: "115-6", srNo: 6, name: "Cold Storage (2-8°C)", description: "Insulins, vaccines, immunoglobulin sera", createdAt: "2026-01-03" }
    ],
    "116": [
      { id: "116-1", srNo: 1, name: "Rack A1 - Main Counter", description: "Top fast-moving pain & fever items", createdAt: "2026-01-01" },
      { id: "116-2", srNo: 2, name: "Rack A2 - Antibiotics", description: "Secondary antibiotic tablets & syrups", createdAt: "2026-01-01" },
      { id: "116-3", srNo: 3, name: "Rack B1 - Cardiac & Diabetic", description: "Chronic regular refill medicine rack", createdAt: "2026-01-01" },
      { id: "116-4", srNo: 4, name: "Shelf C3 - Syrups & Liquids", description: "Cough syrups, tonics, antacids liquids", createdAt: "2026-01-02" },
      { id: "116-5", srNo: 5, name: "Cold Storage Refrigerator 1", description: "Insulins and injectables (2°C to 8°C)", createdAt: "2026-01-02" },
      { id: "116-6", srNo: 6, name: "Warehouse Mezzanine Floor", description: "Bulk carton storage for seasonal goods", createdAt: "2026-01-05" }
    ],
    "117": [
      { id: "117-1", srNo: 1, name: "Aadhaar Card (UIDAI)", description: "12-digit Indian national unique identity", createdAt: "2026-01-01" },
      { id: "117-2", srNo: 2, name: "PAN Card (Income Tax)", description: "Permanent Account Number card", createdAt: "2026-01-01" },
      { id: "117-3", srNo: 3, name: "Election Voter ID (EPIC)", description: "Election Commission of India voter identity", createdAt: "2026-01-01" },
      { id: "117-4", srNo: 4, name: "Driving License", description: "State RTO motor vehicle driving license", createdAt: "2026-01-02" }
    ],
    "118": [
      { id: "118-1", srNo: 1, name: "Indian Passport", description: "Government issued passport for travel & ID", createdAt: "2026-01-01" },
      { id: "118-2", srNo: 2, name: "Ration Card", description: "Food & civil supplies family ration booklet", createdAt: "2026-01-01" },
      { id: "118-3", srNo: 3, name: "Electricity / Utility Bill", description: "Address verification proof within 3 months", createdAt: "2026-01-02" },
      { id: "118-4", srNo: 4, name: "Bank Passbook with Photo", description: "Attested scheduled bank account passbook", createdAt: "2026-01-02" }
    ],
    "119": [
      { id: "119-1", srNo: 1, name: "Hypertension (High BP)", description: "Elevated systolic/diastolic blood pressure", createdAt: "2026-01-01" },
      { id: "119-2", srNo: 2, name: "Type 2 Diabetes Mellitus", description: "Chronic hyperglycemia insulin resistance", createdAt: "2026-01-01" },
      { id: "119-3", srNo: 3, name: "Acute Bronchitis / Cough", description: "Upper respiratory tract infection and wheezing", createdAt: "2026-01-01" },
      { id: "119-4", srNo: 4, name: "Viral Fever & Body Ache", description: "Seasonal pyrexia with myalgia and chills", createdAt: "2026-01-02" },
      { id: "119-5", srNo: 5, name: "Acid Peptic Disease (GERD)", description: "Hyperacidity, gastroesophageal reflux, gastritis", createdAt: "2026-01-02" },
      { id: "119-6", srNo: 6, name: "Allergic Rhinitis / Asthma", description: "Bronchospasm, wheezing, dust/cold allergy", createdAt: "2026-01-03" },
      { id: "119-7", srNo: 7, name: "Pulmonary TB (Nikshay)", description: "Mycobacterium tuberculosis under DOTS therapy", createdAt: "2026-01-04" },
      { id: "119-8", srNo: 8, name: "Typhoid Enteric Fever", description: "Salmonella typhi infection, high grade fever", createdAt: "2026-01-05" }
    ]
  };

  const [selectedOtherMasterCode, setSelectedOtherMasterCode] = useState("107"); // Default Doctor Degree matching user screenshot
  const [otherMasterCategorySearch, setOtherMasterCategorySearch] = useState("");
  const [otherMasterEntrySearch, setOtherMasterEntrySearch] = useState("");
  const [newMasterEntryName, setNewMasterEntryName] = useState("");
  const [newMasterEntryDesc, setNewMasterEntryDesc] = useState("");
  const [editingMasterEntryId, setEditingMasterEntryId] = useState(null);
  const [selectedMasterEntryIds, setSelectedMasterEntryIds] = useState<string[]>([]);
  const [showOtherMasterPrintModal, setShowOtherMasterPrintModal] = useState(false);

  // ─── ACCOUNT GROUP MASTER ───
  // Type Definitions matching legacy software:
  // 1-Liabilities, 2-Assets, 3-Expense, 4-Income, 5-Trading Expense, 6-Trading Income
  const ACCOUNT_GROUP_TYPES = [
    { id: 1, name: "Liabilities", label: "1 - Liabilities", color: "#e11d48", bg: "#ffe4e6", border: "#fecdd3" },
    { id: 2, name: "Assets", label: "2 - Assets", color: "#0284c7", bg: "#e0f2fe", border: "#bae6fd" },
    { id: 3, name: "Expense", label: "3 - Expense (Indirect)", color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
    { id: 4, name: "Income", label: "4 - Income (Indirect)", color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
    { id: 5, name: "Trading Expense", label: "5 - Trading Expense", color: "#9333ea", bg: "#f3e8ff", border: "#e9d5ff" },
    { id: 6, name: "Trading Income", label: "6 - Trading Income", color: "#0d9488", bg: "#ccfbf1", border: "#99f6e4" }
  ];

  // User requested: Do NOT pre-fill static list. Load ONLY if saved in localStorage, else start empty []
  const [accountGroups, setAccountGroups] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("store_account_groups");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error reading store_account_groups from localStorage", e);
    }
    return []; // Clean empty start as instructed by user
  });

  const [accountGroupSearch, setAccountGroupSearch] = useState("");
  const [accountGroupTypeFilter, setAccountGroupTypeFilter] = useState("All");
  const [accountGroupSort, setAccountGroupSort] = useState<"sr_asc" | "name_asc" | "name_desc" | "seq_asc">("sr_asc");
  const [selectedAccountGroupIds, setSelectedAccountGroupIds] = useState<string[]>([]);
  const [editingAccountGroupId, setEditingAccountGroupId] = useState<string | null>(null);
  
  // Entry Form States
  const [newAccGroupName, setNewAccGroupName] = useState("");
  const [newAccGroupType, setNewAccGroupType] = useState<number>(1);
  const [newAccGroupSeq, setNewAccGroupSeq] = useState<number>(0);
  const [newAccGroupParent, setNewAccGroupParent] = useState<string>("0");
  const [newAccGroupDesc, setNewAccGroupDesc] = useState("");
  const [showAccountGroupPrintModal, setShowAccountGroupPrintModal] = useState(false);

  // ─── GENERIC GROUP ITEM LIST STATES ───
  const [genericDrugGroupSearch, setGenericDrugGroupSearch] = useState("");
  const [genericProductNameSearch, setGenericProductNameSearch] = useState("");
  const [genericCategoryFilter, setGenericCategoryFilter] = useState("All");
  const [genericDiscountInput, setGenericDiscountInput] = useState("");
  const [genericRxOnlyFilter, setGenericRxOnlyFilter] = useState(false);
  const [genericNoDiscountFilter, setGenericNoDiscountFilter] = useState(false);
  const [genericTbOnlyFilter, setGenericTbOnlyFilter] = useState(false);
  const [genericScheduleOnlyFilter, setGenericScheduleOnlyFilter] = useState(false);
  const [genericStockOnlyFilter, setGenericStockOnlyFilter] = useState(false);
  const [genericSelectedDetailItem, setGenericSelectedDetailItem] = useState<any>(null);
  const [showGenericScheduleModal, setShowGenericScheduleModal] = useState(false);
  const [showGenericPrintModal, setShowGenericPrintModal] = useState(false);
  const [showGenericDrugDropdown, setShowGenericDrugDropdown] = useState(false);

  // Common Pharmacy Drug Groups / Molecules for quick autocomplete suggestion
  const COMMON_DRUG_GROUPS = [
    "2, 4-DICHLOROBENZYL ALCOHOL + AMYLMETACRESOL",
    "5-AMINOSALICYLIC ACID (MESALAZINE)",
    "A-B ARTEETHER 150 MG",
    "ACAMPROSATE CALCIUM 333 MG",
    "ACARBOSE 50 MG",
    "ACEBROPHYLLINE 100 MG",
    "ACECLOFENAC 100 MG",
    "ACECLOFENAC + PARACETAMOL (100MG + 325MG)",
    "ACECLOFENAC + PARACETAMOL + CHLORZOXAZONE",
    "ACECLOFENAC + PARACETAMOL + RABEPRAZOLE",
    "ACECLOFENAC + SERRATIOPEPTIDASE",
    "ALBENDazole 400 MG",
    "AMLODIPINE 5 MG",
    "AMLODIPINE + ATENOLOL (5MG + 50MG)",
    "AMOXICILLIN 500 MG",
    "AMOXICILLIN + CLAVULANIC ACID (625MG)",
    "ATORVASTATIN 10 MG",
    "ATORVASTATIN 20 MG",
    "AZITHROMYCIN 500 MG",
    "CEFIXIME 200 MG",
    "CEFPODOXIME PROXETIL 200 MG",
    "CETIRIZINE 10 MG",
    "CIPROFLOXACIN 500 MG",
    "DEXAMETHASONE 0.5 MG",
    "DICLOFENAC SODIUM 50 MG",
    "DOLO 650 (PARACETAMOL 650 MG)",
    "GLIMEPIRIDE + METFORMIN (2MG + 500MG)",
    "IBUPROFEN + PARACETAMOL (400MG + 325MG)",
    "LEVOCETIRIZINE + MONTELUKAST (5MG + 10MG)",
    "METFORMIN HCL 500 MG",
    "OMEPRAZOLE 20 MG",
    "PANTOPRAZOLE 40 MG",
    "PANTOPRAZOLE + DOMPERIDONE (40MG + 30MG)",
    "PARACETAMOL 500 MG",
    "PARACETAMOL 650 MG",
    "RABEPRAZOLE 20 MG",
    "RABEPRAZOLE + LEVOSULPIRIDE",
    "ROSUVASTATIN 10 MG",
    "TELMISARTAN 40 MG",
    "TELMISARTAN + AMLODIPINE (40MG + 5MG)",
    "TELMISARTAN + HYDROCHLOROTHIAZIDE (40MG + 12.5MG)"
  ];


  const saveAccountGroups = (updater: any) => {
    setAccountGroups((prev: any) => {
      const updated = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem("store_account_groups", JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving store_account_groups to localStorage", e);
      }
      return updated;
    });
  };

  const handleAddOrUpdateAccountGroup = (e?: any) => {
    if (e) e.preventDefault();
    const cleanName = (newAccGroupName || "").trim();
    if (!cleanName) {
      alert("Please enter a valid Account Group Name.");
      return;
    }

    if (editingAccountGroupId) {
      // Update
      const updated = accountGroups.map((g: any) => {
        if (g.id === editingAccountGroupId) {
          return {
            ...g,
            name: cleanName.toUpperCase(),
            typeId: Number(newAccGroupType),
            seq: Number(newAccGroupSeq) || 0,
            inGroup: newAccGroupParent || "0",
            description: (newAccGroupDesc || "").trim()
          };
        }
        return g;
      });
      saveAccountGroups(updated);
      setEditingAccountGroupId(null);
      setNewAccGroupName("");
      setNewAccGroupType(1);
      setNewAccGroupSeq(0);
      setNewAccGroupParent("0");
      setNewAccGroupDesc("");
      showToast("Account Group updated successfully!");
    } else {
      // Add
      const exists = accountGroups.some((g: any) => (g.name || "").toLowerCase() === cleanName.toLowerCase());
      if (exists) {
        if (!window.confirm("An account group with this name already exists. Add anyway?")) return;
      }

      const nextSrNo = accountGroups.length > 0 ? Math.max(...accountGroups.map((g: any) => Number(g.srNo) || 0)) + 1 : 1;
      const newGroup = {
        id: "ag-" + Date.now(),
        srNo: nextSrNo,
        name: cleanName.toUpperCase(),
        typeId: Number(newAccGroupType),
        seq: Number(newAccGroupSeq) || 0,
        inGroup: newAccGroupParent || "0",
        description: (newAccGroupDesc || "").trim(),
        createdAt: new Date().toISOString().split("T")[0]
      };

      saveAccountGroups([...accountGroups, newGroup]);
      setNewAccGroupName("");
      setNewAccGroupType(1);
      setNewAccGroupSeq(0);
      setNewAccGroupParent("0");
      setNewAccGroupDesc("");
      showToast("Account Group added successfully!");
    }
  };

  const handleEditAccountGroup = (group: any) => {
    setEditingAccountGroupId(group.id);
    setNewAccGroupName(group.name || "");
    setNewAccGroupType(Number(group.typeId) || 1);
    setNewAccGroupSeq(Number(group.seq) || 0);
    setNewAccGroupParent(group.inGroup || "0");
    setNewAccGroupDesc(group.description || "");
  };

  const handleCancelAccountGroupEdit = () => {
    setEditingAccountGroupId(null);
    setNewAccGroupName("");
    setNewAccGroupType(1);
    setNewAccGroupSeq(0);
    setNewAccGroupParent("0");
    setNewAccGroupDesc("");
  };

  const handleDeleteAccountGroup = (id: string, name: string) => {
    if (!window.confirm("Are you sure you want to delete Account Group '" + name + "'?")) return;
    const filtered = accountGroups.filter((g: any) => g.id !== id);
    const renumbered = filtered.map((g: any, idx: number) => ({ ...g, srNo: idx + 1 }));
    saveAccountGroups(renumbered);
    setSelectedAccountGroupIds(prev => prev.filter(x => x !== id));
    if (editingAccountGroupId === id) handleCancelAccountGroupEdit();
    showToast("Account Group deleted!");
  };

  const handleDeleteSelectedAccountGroups = () => {
    if (selectedAccountGroupIds.length === 0) {
      alert("Please select at least one Account Group to delete.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete " + selectedAccountGroupIds.length + " selected Account Groups?")) return;
    const filtered = accountGroups.filter((g: any) => !selectedAccountGroupIds.includes(g.id));
    const renumbered = filtered.map((g: any, idx: number) => ({ ...g, srNo: idx + 1 }));
    saveAccountGroups(renumbered);
    setSelectedAccountGroupIds([]);
    handleCancelAccountGroupEdit();
    showToast(selectedAccountGroupIds.length + " Account Groups deleted!");
  };

  const handleDeleteAllAccountGroups = () => {
    if (accountGroups.length === 0) {
      alert("Account Group list is already empty.");
      return;
    }
    if (!window.confirm("WARNING: Are you sure you want to delete ALL Account Groups? This cannot be undone.")) return;
    saveAccountGroups([]);
    setSelectedAccountGroupIds([]);
    handleCancelAccountGroupEdit();
    showToast("All Account Groups cleared.");
  };

  // Optional tool to import standard pharmacy accounting chart of groups if user requests
  const handleLoadStandardAccountGroups = () => {
    if (accountGroups.length > 0) {
      if (!window.confirm("This will append standard pharmacy account groups to your list. Continue?")) return;
    }
    const standardPresets = [
      { id: "ag-1", srNo: 1, name: "BANK ACCOUNT", typeId: 2, seq: 101, inGroup: "0", description: "Current and savings bank accounts" },
      { id: "ag-2", srNo: 2, name: "BANK OVERDRAFT", typeId: 1, seq: 100, inGroup: "0", description: "Bank credit line & overdraft facility" },
      { id: "ag-3", srNo: 3, name: "BRANCH A/C", typeId: 2, seq: 1, inGroup: "0", description: "Inter-branch clearing accounts" },
      { id: "ag-4", srNo: 4, name: "CAPITAL ACCOUNT", typeId: 1, seq: 0, inGroup: "0", description: "Proprietor capital and equity fund" },
      { id: "ag-5", srNo: 5, name: "CASH IN HAND", typeId: 2, seq: 0, inGroup: "0", description: "Counter drawer cash and petty cash" },
      { id: "ag-6", srNo: 6, name: "CASH SALES ACCOUNT", typeId: 6, seq: 2, inGroup: "0", description: "Direct retail OTC cash revenues" },
      { id: "ag-7", srNo: 7, name: "C-D CARD A/C", typeId: 2, seq: 0, inGroup: "0", description: "POS debit/credit card swipe settlements" },
      { id: "ag-8", srNo: 8, name: "CLOSING STOCK ACCOUNT", typeId: 2, seq: 2, inGroup: "0", description: "Inventory valuation ledger" },
      { id: "ag-9", srNo: 9, name: "CONTRACT", typeId: 1, seq: 2, inGroup: "0", description: "Corporate and hospital contracted liabilities" },
      { id: "ag-10", srNo: 10, name: "CURRENT ASSETS", typeId: 2, seq: 1, inGroup: "0", description: "Short-term convertible store assets" },
      { id: "ag-11", srNo: 11, name: "CURRENT LIABILITIES", typeId: 1, seq: 1, inGroup: "0", description: "Short-term dues and payables" },
      { id: "ag-12", srNo: 12, name: "DEPARTMENT A/C", typeId: 1, seq: 0, inGroup: "0", description: "Internal clinic and pharmacy departments" },
      { id: "ag-13", srNo: 13, name: "DUTIES & TAXES", typeId: 1, seq: 3, inGroup: "0", description: "GST (CGST, SGST, IGST) tax ledger" },
      { id: "ag-14", srNo: 14, name: "FAMILY MEMBER LOAN ACCOUNT", typeId: 1, seq: 2, inGroup: "0", description: "Unsecured personal and family borrowings" },
      { id: "ag-15", srNo: 15, name: "FIXED ASSETS", typeId: 2, seq: 4, inGroup: "0", description: "Furniture, refrigerators, POS computers" },
      { id: "ag-16", srNo: 16, name: "INDIRECT EXPENSE", typeId: 3, seq: 2, inGroup: "0", description: "Store electricity, rent, staff salary, tea" },
      { id: "ag-17", srNo: 17, name: "INDIRECT INCOME", typeId: 4, seq: 0, inGroup: "0", description: "Bank interest, vendor discounts, scrap sale" },
      { id: "ag-18", srNo: 18, name: "INVESTMENTS", typeId: 2, seq: 0, inGroup: "0", description: "Fixed deposits and mutual fund investments" }
    ];
    // Merge without duplicate names
    const existingNames = new Set(accountGroups.map(g => (g.name || "").toLowerCase()));
    const toAdd = standardPresets.filter(p => !existingNames.has(p.name.toLowerCase()));
    const combined = [...accountGroups, ...toAdd].map((g, idx) => ({ ...g, srNo: idx + 1, createdAt: g.createdAt || new Date().toISOString().split("T")[0] }));
    saveAccountGroups(combined);
    showToast("Standard Account Groups loaded!");
  };


  const [otherMastersData, setOtherMastersData] = useState(() => {
    try {
      const saved = localStorage.getItem("store_other_masters_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults if any category is missing
        return { ...INITIAL_OTHER_MASTERS_DATA, ...parsed };
      }
    } catch (e) {
      console.error("Error loading other_masters_data from localStorage", e);
    }
    return INITIAL_OTHER_MASTERS_DATA;
  });

  const saveOtherMastersData = (updater: any) => {
    setOtherMastersData((prev: any) => {
      const updated = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem("store_other_masters_data", JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving other_masters_data to localStorage", e);
      }
      return updated;
    });
  };

  const handleAddOrUpdateOtherMasterEntry = (e?: any) => {
    if (e) e.preventDefault();
    const cleanName = (newMasterEntryName || "").trim();
    if (!cleanName) {
      alert("Please enter a valid entry name / title.");
      return;
    }

    const currentList = otherMastersData[selectedOtherMasterCode] || [];

    if (editingMasterEntryId) {
      // Update existing
      const updatedList = currentList.map((item: any) => {
        if (item.id === editingMasterEntryId) {
          return {
            ...item,
            name: cleanName,
            description: (newMasterEntryDesc || "").trim()
          };
        }
        return item;
      });
      saveOtherMastersData((prev: any) => ({
        ...prev,
        [selectedOtherMasterCode]: updatedList
      }));
      setEditingMasterEntryId(null);
      setNewMasterEntryName("");
      setNewMasterEntryDesc("");
      showToast("Entry updated successfully!");
    } else {
      // Add new
      // Check duplicate
      const isDuplicate = currentList.some((it: any) => (it.name || "").toLowerCase() === cleanName.toLowerCase());
      if (isDuplicate) {
        if (!window.confirm("An entry with this name already exists. Do you still want to add it?")) {
          return;
        }
      }

      const nextSrNo = currentList.length > 0 ? Math.max(...currentList.map((it: any) => Number(it.srNo) || 0)) + 1 : 1;
      const newEntry = {
        id: selectedOtherMasterCode + "-" + Date.now(),
        srNo: nextSrNo,
        name: cleanName,
        description: (newMasterEntryDesc || "").trim(),
        createdAt: new Date().toISOString().split("T")[0]
      };

      saveOtherMastersData((prev: any) => ({
        ...prev,
        [selectedOtherMasterCode]: [...currentList, newEntry]
      }));
      setNewMasterEntryName("");
      setNewMasterEntryDesc("");
      showToast("Entry added successfully!");
    }
  };

  const handleEditOtherMasterEntry = (item: any) => {
    setEditingMasterEntryId(item.id);
    setNewMasterEntryName(item.name || "");
    setNewMasterEntryDesc(item.description || "");
  };

  const handleCancelOtherMasterEdit = () => {
    setEditingMasterEntryId(null);
    setNewMasterEntryName("");
    setNewMasterEntryDesc("");
  };

  const handleDeleteOtherMasterEntry = (id: string, name: string) => {
    if (!window.confirm("Are you sure you want to delete '" + name + "'?")) return;
    const currentList = otherMastersData[selectedOtherMasterCode] || [];
    const updatedList = currentList.filter((it: any) => it.id !== id);
    // Renumber srNo
    const renumbered = updatedList.map((it: any, idx: number) => ({ ...it, srNo: idx + 1 }));
    saveOtherMastersData((prev: any) => ({
      ...prev,
      [selectedOtherMasterCode]: renumbered
    }));
    setSelectedMasterEntryIds((prev) => prev.filter(x => x !== id));
    if (editingMasterEntryId === id) handleCancelOtherMasterEdit();
    showToast("Entry deleted successfully!");

  return (
          <>
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "6px", padding: "3px 4px", marginBottom: "6px", gap: "4px", flexWrap: "wrap", flexShrink: 0 }}>
              {[{ id: "accounts", label: "🏛️ Account Master" }, { id: "companies", label: "🏢 Company Master" }, { id: "suppliers", label: "🏭 Suppliers" }, { id: "drug_groups", label: "🧪 Drug Group Master" }, { id: "kits", label: "🧰 Kit Master" }, { id: "doctors", label: "🩺 Doctors" }, { id: "customers", label: "🧑‍⚕️ Patient Master" }, { id: "contract_employees", label: "👷 Contract Employee Master" }, { id: "other_masters", label: "📑 Other Masters" }, { id: "account_groups", label: "📊 Account Groups" }, { id: "generic_group_items", label: "💊 Generic Group Items" }, { id: "offers", label: "🎁 Bundle Offers" }, { id: "expiry_cal", label: "📅 Expiry Calendar" }, { id: "auto_reorder", label: "🔄 Auto Reorder" }, { id: "prescriptions", label: "📋 Prescriptions" }].map(t => (
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
                  {!showAccountForm && (
                  <>
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
                  </>
                  )}

                  {/* ─── ADD / EDIT ACCOUNT CARD (Theme: Add Item in Image 2 + All Legacy Fields) ─── */}
                  {showAccountForm && (
                    <div style={{ background: "white", borderRadius: "10px", padding: "12px 16px", marginBottom: "8px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", animation: "fadeIn 0.15s ease-out", height: "calc(100vh - 150px)", maxHeight: "calc(100vh - 150px)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
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
                      <div style={{ position: "sticky", bottom: 0, background: "#ffffff", zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", paddingTop: "8px", paddingBottom: "8px", borderTop: "2px solid #cbd5e1", boxShadow: "0 -4px 12px rgba(0,0,0,0.08)" }}>
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
                  {!showAccountForm && (
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
                      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 315px)", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                          <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc" }}>
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
                  )}

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


            {/* ═════════════════════════════════════════════════════════════
                COMPANY MASTER (Matching Inventory Page Layout / Image 2)
            ═════════════════════════════════════════════════════════════ */}
            {ownerSubTab === "companies" && (() => {
              // Filtering & Sorting
              const q = (companySearch || "").trim().toLowerCase();
              let filtered = (companies || []).filter(c => {
                if (companyStatusFilter === "active" && c.status === "inactive") return false;
                if (companyStatusFilter === "inactive" && c.status !== "inactive") return false;
                if (!q) return true;
                return (
                  (c.name || "").toLowerCase().includes(q) ||
                  (c.code || "").toLowerCase().includes(q) ||
                  (c.city || "").toLowerCase().includes(q) ||
                  (c.person || "").toLowerCase().includes(q) ||
                  (c.mobile || "").includes(q) ||
                  String(c.srNo || "").includes(q)
                );
              });

              if (companySortBy === "name") {
                filtered = [...filtered].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
              } else if (companySortBy === "code") {
                filtered = [...filtered].sort((a, b) => (a.code || "").localeCompare(b.code || ""));
              } else if (companySortBy === "sr_desc") {
                filtered = [...filtered].sort((a, b) => Number(b.srNo || 0) - Number(a.srNo || 0));
              } else if (companySortBy === "items_desc") {
                filtered = [...filtered].sort((a, b) => {
                  const countA = (items || []).filter(i => (i.company || "").toUpperCase() === (a.name || "").toUpperCase()).length;
                  const countB = (items || []).filter(i => (i.company || "").toUpperCase() === (b.name || "").toUpperCase()).length;
                  return countB - countA;
                });
              }

              // Search dropdown results (max 10)
              const searchDropdownResults = q ? (companies || []).filter(c =>
                (c.name || "").toLowerCase().includes(q) ||
                (c.code || "").toLowerCase().includes(q) ||
                (c.city || "").toLowerCase().includes(q)
              ).slice(0, 10) : [];

              // Open Form Handler
              const handleOpenCompanyForm = (comp = null) => {
                if (comp) {
                  setEditingCompany(comp);
                  setCompanyForm({ ...defaultCompanyForm, ...comp, relatedSuppliers: comp.relatedSuppliers || [] });
                } else {
                  setEditingCompany(null);
                  const nextSr = companies.length > 0 ? Math.max(...companies.map(c => Number(c.srNo || 0))) + 1 : 1;
                  setCompanyForm({ ...defaultCompanyForm, id: uid(), srNo: nextSr, relatedSuppliers: [] });
                }
                setDeleteWithItems(false);
                setShowCompanyForm(true);
              };

              // Save Company Handler
              const handleSaveCompany = () => {
                if (!companyForm.name || !companyForm.name.trim()) {
                  showToast("Company Name is required!", "error");
                  return;
                }

                const cId = companyForm.id || uid();
                const compData = {
                  ...companyForm,
                  id: cId,
                  name: companyForm.name.trim().toUpperCase(),
                  code: (companyForm.code || companyForm.name.substring(0, 4)).trim().toUpperCase(),
                  srNo: Number(companyForm.srNo) || (companies.length + 1),
                  updatedAt: new Date().toISOString()
                };

                let updatedList;
                if (editingCompany) {
                  updatedList = companies.map(c => c.id === editingCompany.id ? compData : c);
                } else {
                  updatedList = [...companies, compData];
                }

                setCompanies(updatedList);
                try {
                  localStorage.setItem("store_companies", JSON.stringify(updatedList));
                } catch (_) {}

                showToast(editingCompany ? "Company updated successfully!" : "Company created successfully!");
                setShowCompanyForm(false);
                setEditingCompany(null);
              };

              // Delete Company Handler
              const handleDeleteCompany = (comp) => {
                const targetName = comp.name;
                const linkedItemsCount = (items || []).filter(i => (i.company || "").toUpperCase() === targetName.toUpperCase()).length;
                const msg = deleteWithItems && linkedItemsCount > 0
                  ? `Delete company "${targetName}" AND all ${linkedItemsCount} linked items?`
                  : `Are you sure you want to delete company "${targetName}"?`;

                showConfirm(msg, () => {
                  const nextList = companies.filter(c => c.id !== comp.id);
                  setCompanies(nextList);
                  try {
                    localStorage.setItem("store_companies", JSON.stringify(nextList));
                  } catch (_) {}

                  // If deleteWithItems is checked, also remove matching items
                  if (deleteWithItems && linkedItemsCount > 0) {
                    const remainingItems = (items || []).filter(i => (i.company || "").toUpperCase() !== targetName.toUpperCase());
                    saveItems(remainingItems);
                    showToast(`Company "${targetName}" and ${linkedItemsCount} items deleted!`);
                  } else {
                    showToast(`Company "${targetName}" deleted successfully!`);
                  }

                  if (editingCompany?.id === comp.id) {
                    setShowCompanyForm(false);
                    setEditingCompany(null);
                  }
                });
              };

              // Bulk Item Status (Off / On)
              const handleSetCompanyItemStatus = (statusValue) => {
                if (!companyForm.name || !companyForm.name.trim()) {
                  showToast("Please select or save the company first", "error");
                  return;
                }

                const targetName = companyForm.name.trim().toUpperCase();
                const matchingItems = (items || []).filter(i => (i.company || "").toUpperCase() === targetName);

                if (matchingItems.length === 0) {
                  showToast(`No items found under company "${targetName}"`, "error");
                  return;
                }

                const updatedItems = (items || []).map(i => {
                  if ((i.company || "").toUpperCase() === targetName) {
                    return { ...i, status: statusValue };
                  }
                  return i;
                });

                saveItems(updatedItems);
                showToast(`✅ All ${matchingItems.length} items of "${targetName}" set to Status ${statusValue.toUpperCase()}!`);
              };

              // Record Navigation (< Prev & Next >)
              const handleNavigateCompany = (direction) => {
                if (companies.length === 0) return;
                const currentIdx = editingCompany ? companies.findIndex(c => c.id === editingCompany.id) : 0;
                let nextIdx = direction === "prev" ? currentIdx - 1 : currentIdx + 1;
                if (nextIdx < 0) nextIdx = companies.length - 1;
                if (nextIdx >= companies.length) nextIdx = 0;
                const target = companies[nextIdx];
                setEditingCompany(target);
                setCompanyForm({ ...defaultCompanyForm, ...target, relatedSuppliers: target.relatedSuppliers || [] });
              };

              // All available suppliers in the system (starts completely blank if no suppliers exist!)
              const allSystemSuppliers = (suppliers || []).map(s => s.name?.trim().toUpperCase()).filter(Boolean);
              // Plus any suppliers manually added by the user
              const combinedSupplierPool = [...new Set([...allSystemSuppliers, ...(companyForm.relatedSuppliers || [])])];
              
              const filteredPoolSuppliers = combinedSupplierPool.filter(sName => {
                if (!supplierFilterText) return true;
                return sName.toLowerCase().includes(supplierFilterText.toLowerCase());
              });

              // Add Supplier to Related List
              const handleAddRelatedSupplier = (suppName) => {
                if (!suppName || !suppName.trim()) return;
                const clean = suppName.trim().toUpperCase();
                if ((companyForm.relatedSuppliers || []).includes(clean)) {
                  showToast(`Supplier "${clean}" is already mapped to this company`, "error");
                  return;
                }
                setCompanyForm(prev => ({
                  ...prev,
                  relatedSuppliers: [...(prev.relatedSuppliers || []), clean]
                }));
                setNewSupplierInput("");
              };

              // Remove Supplier from Related List
              const handleRemoveRelatedSupplier = (suppName) => {
                setCompanyForm(prev => ({
                  ...prev,
                  relatedSuppliers: (prev.relatedSuppliers || []).filter(s => s !== suppName)
                }));
              };

              // Move Related Supplier Up/Down
              const handleMoveSupplier = (idx, direction) => {
                const list = [...(companyForm.relatedSuppliers || [])];
                const targetIdx = direction === "up" ? idx - 1 : idx + 1;
                if (targetIdx < 0 || targetIdx >= list.length) return;
                const temp = list[idx];
                list[idx] = list[targetIdx];
                list[targetIdx] = temp;
                setCompanyForm(prev => ({ ...prev, relatedSuppliers: list }));
              };

              // Print Company Directory
              const handlePrintCompanyList = () => {
                const printWindow = window.open("", "_blank");
                if (!printWindow) return;
                const rows = filtered.map((c, i) => {
                  const itemCount = (items || []).filter(it => (it.company || "").toUpperCase() === (c.name || "").toUpperCase()).length;
                  const suppList = (c.relatedSuppliers || []).join(", ") || "-";
                  return `
                    <tr style="border-bottom: 1px solid #ddd;">
                      <td style="padding: 6px; text-align: center;">${i + 1}</td>
                      <td style="padding: 6px; text-align: center; font-weight: bold;">${c.code || '-'}</td>
                      <td style="padding: 6px; font-weight: bold;">${c.name}</td>
                      <td style="padding: 6px;">${c.person || '-'}</td>
                      <td style="padding: 6px;">${c.city || '-'}</td>
                      <td style="padding: 6px;">${c.mobile || '-'}</td>
                      <td style="padding: 6px; text-align: center; font-weight: bold;">${itemCount}</td>
                      <td style="padding: 6px; font-size: 11px;">${suppList}</td>
                      <td style="padding: 6px; text-align: center;">${c.status === 'inactive' ? 'Inactive' : 'Active'}</td>
                    </tr>
                  `;
                }).join("");

                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Company Master Directory - Shiv Dhara Medical Store</title>
                      <style>
                        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; color: #111; }
                        h2, h4 { margin: 0 0 6px 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th { background: #0f172a; color: white; padding: 8px 6px; text-align: left; }
                      </style>
                    </head>
                    <body>
                      <h2>Shiv Dhara Medical Store</h2>
                      <h4>Company Master Directory (Total: ${filtered.length})</h4>
                      <p style="font-size: 11px; color: #555;">Generated: ${new Date().toLocaleString()}</p>
                      <table>
                        <thead>
                          <tr>
                            <th style="width: 35px; text-align: center;">#</th>
                            <th style="width: 55px; text-align: center;">Code</th>
                            <th>Company Name</th>
                            <th>Contact Person</th>
                            <th>City</th>
                            <th>Mobile</th>
                            <th style="width: 50px; text-align: center;">Items</th>
                            <th>Related Suppliers</th>
                            <th style="width: 60px; text-align: center;">Status</th>
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
                  {!showCompanyForm && (
                  <>
                  {/* ─── HEADER ROW (Inventory Style / Image 2) ─── */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "26px" }}>🏢</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Company Master</h2>
                      <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Pharmaceutical Manufacturers, Location & Supplier Mapping</p>
                    </div>

                    <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        onClick={handlePrintCompanyList}
                        style={{ ...btn("#334155"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <Printer size={13} /> Print Directory
                      </button>
                      <button
                        onClick={() => handleOpenCompanyForm(null)}
                        style={{ ...btn("var(--color-primary)"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <Plus size={13} /> Add Company
                      </button>
                    </div>
                  </div>

                  {/* ─── SEARCH & FILTER BAR (Inventory Style / Image 2) ─── */}
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
                      <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                      <input
                        placeholder="Search Company Name, Code or City... + Enter"
                        value={companySearch}
                        onChange={e => {
                          setCompanySearch(e.target.value);
                          setCompanySearchDropdown(true);
                          setCompanySearchHighlight(0);
                        }}
                        onKeyDown={e => {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setCompanySearchHighlight(prev => Math.min(prev + 1, searchDropdownResults.length - 1));
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setCompanySearchHighlight(prev => Math.max(prev - 1, 0));
                          } else if (e.key === "Enter") {
                            e.preventDefault();
                            if (searchDropdownResults.length > 0 && companySearchDropdown) {
                              handleOpenCompanyForm(searchDropdownResults[companySearchHighlight]);
                              setCompanySearchDropdown(false);
                              setCompanySearch("");
                            } else if (q && filtered.length > 0) {
                              handleOpenCompanyForm(filtered[0]);
                              setCompanySearchDropdown(false);
                              setCompanySearch("");
                            } else if (q) {
                              showToast("No company found matching: " + companySearch, "error");
                            }
                          }
                        }}
                        onFocus={() => setCompanySearchDropdown(true)}
                        onBlur={() => setTimeout(() => setCompanySearchDropdown(false), 200)}
                        style={{ ...inp, paddingLeft: "30px", width: "100%", height: "36px" }}
                      />

                      {/* Search Dropdown Popup */}
                      {companySearchDropdown && searchDropdownResults.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--shadow-lg)", zIndex: 50, marginTop: "4px", overflow: "hidden", maxHeight: "280px", overflowY: "auto" }}>
                          {searchDropdownResults.map((comp, idx) => {
                            const count = (items || []).filter(i => (i.company || "").toUpperCase() === (comp.name || "").toUpperCase()).length;
                            return (
                              <div
                                key={comp.id}
                                onClick={() => {
                                  handleOpenCompanyForm(comp);
                                  setCompanySearchDropdown(false);
                                  setCompanySearch("");
                                }}
                                onMouseEnter={() => setCompanySearchHighlight(idx)}
                                style={{
                                  padding: "8px 12px",
                                  cursor: "pointer",
                                  background: idx === companySearchHighlight ? "#f1f5f9" : "white",
                                  borderBottom: "1px solid #f1f5f9",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center"
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>
                                    {comp.name} <span style={{ color: "#3b82f6", fontSize: "11px" }}>({comp.code})</span>
                                  </div>
                                  <div style={{ fontSize: "10px", color: "#64748b" }}>
                                    {comp.city ? `City: ${comp.city}` : ""} {comp.person ? `· Rep: ${comp.person}` : ""}
                                  </div>
                                </div>
                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#0f766e", background: "#f0fdf4", padding: "2px 6px", borderRadius: "4px" }}>
                                  {count} Items
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <select
                      value={companyStatusFilter}
                      onChange={e => setCompanyStatusFilter(e.target.value)}
                      style={{ ...inp, width: "auto", height: "36px" }}
                    >
                      <option value="All">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>

                    <select
                      value={companySortBy}
                      onChange={e => setCompanySortBy(e.target.value)}
                      style={{ ...inp, width: "auto", height: "36px" }}
                    >
                      <option value="name">Name A-Z</option>
                      <option value="code">Code A-Z</option>
                      <option value="items_desc">Items Count ↓</option>
                      <option value="sr_desc">Sr No ↓</option>
                    </select>
                  </div>
                  </>
                  )}

                  {/* ─── ADD / EDIT COMPANY CARD (Theme: Add Item in Image 2 + Dual Panel Mapping) ─── */}
                  {showCompanyForm && (
                    <div style={{ background: "white", borderRadius: "10px", padding: "12px 16px", marginBottom: "8px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", animation: "fadeIn 0.15s ease-out", height: "calc(100vh - 150px)", maxHeight: "calc(100vh - 150px)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                      {/* Form Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "18px" }}>🏢</span>
                          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                            {editingCompany ? `Edit Company: ${editingCompany.name}` : "Add New Company"}
                          </h3>
                          <span style={{ fontSize: "11px", fontWeight: "700", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "4px" }}>
                            Sr. No: {companyForm.srNo || "Auto"}
                          </span>
                        </div>
                        <button
                          onClick={() => { setShowCompanyForm(false); setEditingCompany(null); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Dual Panel Layout (Company Details Left, Supplier Mapping Right) */}
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr", gap: "20px", marginBottom: "16px" }}>
                        {/* ─── LEFT PANEL: COMPANY DETAILS ─── */}
                        <div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "10px" }}>
                            {/* Sr. No (Pink Accent Box from Legacy Screenshot) */}
                            <div>
                              <label style={lbl}>Sr. No.</label>
                              <input
                                type="number"
                                value={companyForm.srNo || ""}
                                onChange={e => setCompanyForm({ ...companyForm, srNo: e.target.value })}
                                placeholder="Auto"
                                style={{ ...inp, background: "#fce7f3", border: "1px solid #f472b6", fontWeight: "800", color: "#831843" }}
                              />
                            </div>

                            {/* Code */}
                            <div>
                              <label style={lbl}>Company Code *</label>
                              <input
                                value={companyForm.code || ""}
                                onChange={e => setCompanyForm({ ...companyForm, code: e.target.value.toUpperCase() })}
                                placeholder="e.g. ZYD, CIP, SUN"
                                maxLength={8}
                                style={{ ...inp, textTransform: "uppercase", fontWeight: "800", color: "#1e3a8a" }}
                              />
                            </div>

                            {/* Location */}
                            <div>
                              <label style={lbl}>Location / Rack</label>
                              <input
                                value={companyForm.location || ""}
                                onChange={e => setCompanyForm({ ...companyForm, location: e.target.value.toUpperCase() })}
                                placeholder="e.g. RACK-B2, W-01"
                                style={{ ...inp, textTransform: "uppercase" }}
                              />
                            </div>

                            {/* Company Name */}
                            <div style={{ gridColumn: "span 2" }}>
                              <label style={lbl}>Company Name *</label>
                              <input
                                value={companyForm.name || ""}
                                onChange={e => setCompanyForm({ ...companyForm, name: e.target.value.toUpperCase() })}
                                placeholder="e.g. ZYDUS HEALTHCARE LTD or CIPLA LIMITED"
                                style={{ ...inp, textTransform: "uppercase", fontWeight: "800" }}
                              />
                            </div>

                            {/* Contact Person (MR / Area Manager) */}
                            <div>
                              <label style={lbl}>Person / Representative</label>
                              <input
                                value={companyForm.person || ""}
                                onChange={e => setCompanyForm({ ...companyForm, person: e.target.value.toUpperCase() })}
                                placeholder="MR / Area Manager Name"
                                style={{ ...inp, textTransform: "uppercase" }}
                              />
                            </div>

                            {/* Area */}
                            <div>
                              <label style={lbl}>Area</label>
                              <input
                                value={companyForm.area || ""}
                                onChange={e => setCompanyForm({ ...companyForm, area: e.target.value.toUpperCase() })}
                                placeholder="e.g. RING ROAD"
                                style={{ ...inp, textTransform: "uppercase" }}
                              />
                            </div>

                            {/* City */}
                            <div>
                              <label style={lbl}>City</label>
                              <input
                                value={companyForm.city || ""}
                                onChange={e => setCompanyForm({ ...companyForm, city: e.target.value.toUpperCase() })}
                                placeholder="e.g. AHMEDABAD, SURAT"
                                style={{ ...inp, textTransform: "uppercase" }}
                              />
                            </div>

                            {/* Contact (Landline / Office) */}
                            <div>
                              <label style={lbl}>Contact Phone</label>
                              <input
                                value={companyForm.contact || ""}
                                onChange={e => setCompanyForm({ ...companyForm, contact: e.target.value })}
                                placeholder="Office phone number"
                                style={inp}
                              />
                            </div>

                            {/* Mobile */}
                            <div>
                              <label style={lbl}>Mobile Number</label>
                              <input
                                value={companyForm.mobile || ""}
                                onChange={e => setCompanyForm({ ...companyForm, mobile: e.target.value.replace(/[^0-9]/g, "") })}
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
                                value={companyForm.email || ""}
                                onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })}
                                placeholder="orders@pharma.com"
                                style={inp}
                              />
                            </div>

                            {/* Drug License No (D.L.No) */}
                            <div>
                              <label style={lbl}>D.L. No. (Drug License)</label>
                              <input
                                value={companyForm.dlNo || ""}
                                onChange={e => setCompanyForm({ ...companyForm, dlNo: e.target.value.toUpperCase() })}
                                placeholder="e.g. 20B/21B-GJ-9988"
                                style={{ ...inp, textTransform: "uppercase" }}
                              />
                            </div>

                            {/* Status */}
                            <div>
                              <label style={lbl}>Company Status</label>
                              <select
                                value={companyForm.status || "active"}
                                onChange={e => setCompanyForm({ ...companyForm, status: e.target.value })}
                                style={{ ...inp, fontWeight: "700", color: companyForm.status === "inactive" ? "#dc2626" : "#16a34a" }}
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>

                            {/* Full Address */}
                            <div style={{ gridColumn: "1 / -1" }}>
                              <label style={lbl}>Company Address</label>
                              <textarea
                                value={companyForm.address || ""}
                                onChange={e => setCompanyForm({ ...companyForm, address: e.target.value.toUpperCase() })}
                                placeholder="Corporate / Depot Address..."
                                style={{ ...inp, height: "42px", resize: "vertical", textTransform: "uppercase" }}
                              />
                            </div>

                            {/* Remarks */}
                            <div style={{ gridColumn: "1 / -1" }}>
                              <label style={lbl}>Remarks / Internal Notes</label>
                              <input
                                value={companyForm.remarks || ""}
                                onChange={e => setCompanyForm({ ...companyForm, remarks: e.target.value })}
                                placeholder="Internal notes, distributor terms, ordering policies..."
                                style={inp}
                              />
                            </div>
                          </div>
                        </div>

                        {/* ─── RIGHT PANEL: SUPPLIER MAPPING (Blank by default, no hardcoded dummy list!) ─── */}
                        <div style={{ background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          {/* Function Keys Shortcut Banner (Matching Legacy Screenshot) */}
                          <div style={{ background: "#1e293b", color: "#f8fafc", padding: "6px 10px", borderRadius: "5px", fontSize: "10px", fontWeight: "700", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                            <span>F5-Company Name</span>
                            <span>F6-New Supplier</span>
                            <span>F7-All Supplier</span>
                            <span>F8-Company Supplier</span>
                          </div>

                          {/* Quick Add / Register Supplier */}
                          <div>
                            <label style={{ ...lbl, fontSize: "10px" }}>Add New Supplier to List</label>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <input
                                value={newSupplierInput}
                                onChange={e => setNewSupplierInput(e.target.value.toUpperCase())}
                                onKeyDown={e => e.key === "Enter" && handleAddRelatedSupplier(newSupplierInput)}
                                placeholder="Type supplier name..."
                                style={{ ...inp, textTransform: "uppercase", fontSize: "11px", height: "30px" }}
                              />
                              <button
                                type="button"
                                onClick={() => handleAddRelatedSupplier(newSupplierInput)}
                                style={{ ...btn("var(--color-primary)"), padding: "4px 10px", fontSize: "11px" }}
                              >
                                Add
                              </button>
                            </div>
                          </div>

                          {/* Top Box: List of All Supplier (Blank if no suppliers created yet!) */}
                          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#334155" }}>
                                List of All Supplier ({combinedSupplierPool.length})
                              </span>
                              <input
                                placeholder="Filter suppliers..."
                                value={supplierFilterText}
                                onChange={e => setSupplierFilterText(e.target.value)}
                                style={{ ...inp, width: "110px", height: "22px", fontSize: "10px", padding: "2px 6px" }}
                              />
                            </div>

                            <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "5px", height: "130px", overflowY: "auto", padding: "4px" }}>
                              {filteredPoolSuppliers.length === 0 ? (
                                <div style={{ padding: "30px 10px", textAlign: "center", color: "#94a3b8", fontSize: "11px" }}>
                                  No suppliers in system yet.<br/>Type above or add in Supplier Master to populate.
                                </div>
                              ) : (
                                filteredPoolSuppliers.map(sName => {
                                  const isAlreadyRelated = (companyForm.relatedSuppliers || []).includes(sName);
                                  return (
                                    <div
                                      key={sName}
                                      onClick={() => !isAlreadyRelated && handleAddRelatedSupplier(sName)}
                                      style={{
                                        padding: "4px 8px",
                                        fontSize: "11px",
                                        cursor: isAlreadyRelated ? "default" : "pointer",
                                        borderRadius: "3px",
                                        marginBottom: "2px",
                                        background: isAlreadyRelated ? "#f1f5f9" : "transparent",
                                        color: isAlreadyRelated ? "#94a3b8" : "#0f172a",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                      }}
                                      onMouseEnter={e => { if (!isAlreadyRelated) e.currentTarget.style.background = "#e0e7ff"; }}
                                      onMouseLeave={e => { if (!isAlreadyRelated) e.currentTarget.style.background = "transparent"; }}
                                    >
                                      <span style={{ fontWeight: isAlreadyRelated ? "400" : "600" }}>{sName}</span>
                                      {isAlreadyRelated ? (
                                        <span style={{ fontSize: "9px", color: "#16a34a", fontWeight: "700" }}>Mapped</span>
                                      ) : (
                                        <span style={{ fontSize: "10px", color: "#2563eb", fontWeight: "700" }}>+ Map</span>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* Bottom Box: List of Supplier Related to Company */}
                          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#1e3a8a" }}>
                                List of Supplier Related to Company ({(companyForm.relatedSuppliers || []).length})
                              </span>
                              <span style={{ fontSize: "10px", color: "#64748b" }}>Use UP/DOWN to reorder</span>
                            </div>

                            <div style={{ background: "#ffffff", border: "1px solid #93c5fd", borderRadius: "5px", height: "130px", overflowY: "auto", padding: "4px" }}>
                              {(companyForm.relatedSuppliers || []).length === 0 ? (
                                <div style={{ padding: "30px 10px", textAlign: "center", color: "#94a3b8", fontSize: "11px" }}>
                                  No suppliers mapped to this company yet.<br/>Click "+ Map" above to associate distributors.
                                </div>
                              ) : (
                                (companyForm.relatedSuppliers || []).map((sName, idx) => (
                                  <div
                                    key={sName}
                                    style={{
                                      padding: "4px 8px",
                                      fontSize: "11px",
                                      background: "#eff6ff",
                                      borderBottom: "1px solid #dbeafe",
                                      borderRadius: "3px",
                                      marginBottom: "2px",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center"
                                    }}
                                  >
                                    <span style={{ fontWeight: "700", color: "#1e40af" }}>
                                      {idx + 1}. {sName}
                                    </span>
                                    <div style={{ display: "flex", gap: "3px" }}>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveSupplier(idx, "up")}
                                        disabled={idx === 0}
                                        style={{ padding: "1px 5px", fontSize: "9px", border: "1px solid #cbd5e1", borderRadius: "2px", background: "white", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.4 : 1 }}
                                        title="Move UP"
                                      >
                                        ▲
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveSupplier(idx, "down")}
                                        disabled={idx === (companyForm.relatedSuppliers || []).length - 1}
                                        style={{ padding: "1px 5px", fontSize: "9px", border: "1px solid #cbd5e1", borderRadius: "2px", background: "white", cursor: idx === (companyForm.relatedSuppliers || []).length - 1 ? "default" : "pointer", opacity: idx === (companyForm.relatedSuppliers || []).length - 1 ? 0.4 : 1 }}
                                        title="Move DOWN"
                                      >
                                        ▼
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveRelatedSupplier(sName)}
                                        style={{ padding: "1px 5px", fontSize: "9px", border: "none", borderRadius: "2px", background: "#fee2e2", color: "#dc2626", cursor: "pointer", fontWeight: "700" }}
                                        title="Remove"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ─── FORM ACTION BUTTONS (Matching Legacy Controls & Image 2 Theme) ─── */}
                      <div style={{ position: "sticky", bottom: 0, background: "#ffffff", zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", paddingTop: "8px", paddingBottom: "8px", borderTop: "2px solid #cbd5e1", boxShadow: "0 -4px 12px rgba(0,0,0,0.08)" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => handleNavigateCompany("prev")}
                            style={{ ...btn("#475569"), padding: "7px 12px", fontSize: "12px" }}
                            title="Previous Company"
                          >
                            <ChevronLeft size={14} /> Prev
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavigateCompany("next")}
                            style={{ ...btn("#475569"), padding: "7px 12px", fontSize: "12px" }}
                            title="Next Company"
                          >
                            Next <ChevronRight size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetCompanyItemStatus("off")}
                            style={{ ...btn("#e11d48"), padding: "7px 12px", fontSize: "12px" }}
                            title="Turn Off all items under this company"
                          >
                            Item Status - Off
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetCompanyItemStatus("on")}
                            style={{ ...btn("#059669"), padding: "7px 12px", fontSize: "12px" }}
                            title="Turn On all items under this company"
                          >
                            Item Status - On
                          </button>

                          {editingCompany && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "6px" }}>
                              <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#dc2626", cursor: "pointer", fontWeight: "600" }}>
                                <input
                                  type="checkbox"
                                  checked={deleteWithItems}
                                  onChange={e => setDeleteWithItems(e.target.checked)}
                                />
                                Delete with Item List
                              </label>
                              <button
                                type="button"
                                onClick={() => handleDeleteCompany(editingCompany)}
                                style={{ ...btn("#dc2626"), padding: "7px 12px", fontSize: "12px" }}
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => { setShowCompanyForm(false); setEditingCompany(null); }}
                            style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), padding: "7px 14px", fontSize: "12px" }}
                          >
                            <X size={13} /> Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveCompany}
                            style={{ ...btn("var(--color-primary)"), padding: "7px 18px", fontSize: "12px", fontWeight: "800" }}
                          >
                            <CheckCircle size={14} /> {editingCompany ? "Update Company" : "Save Company"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── COMPANIES DIRECTORY TABLE (Inventory Style / Image 2) ─── */}
                  {!showCompanyForm && (
                  <div style={{ background: "white", borderRadius: "12px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>
                        Registered Companies ({filtered.length})
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        Click any company to edit or manage supplier associations
                      </span>
                    </div>

                    {filtered.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                        <div style={{ fontSize: "40px", opacity: 0.6 }}>🏢</div>
                        <p style={{ marginTop: "12px", fontWeight: "700", fontSize: "15px", color: "#334155" }}>
                          No companies found matching your criteria
                        </p>
                        <p style={{ fontSize: "12px", color: "#64748b" }}>
                          Add a new manufacturer company or search with different keywords.
                        </p>
                        <button
                          onClick={() => handleOpenCompanyForm(null)}
                          style={{ ...btn("var(--color-primary)"), margin: "14px auto 0", fontSize: "12px" }}
                        >
                          <Plus size={13} /> Add New Company
                        </button>
                      </div>
                    ) : (
                      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 315px)", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                          <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc" }}>
                            <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                              <th style={{ padding: "10px 8px", textAlign: "center", width: "45px" }}>Sr No</th>
                              <th style={{ padding: "10px 8px", textAlign: "center", width: "65px" }}>Code</th>
                              <th style={{ padding: "10px 12px", textAlign: "left" }}>Company Name</th>
                              <th style={{ padding: "10px 10px", textAlign: "left", width: "140px" }}>Representative</th>
                              <th style={{ padding: "10px 10px", textAlign: "left", width: "110px" }}>City</th>
                              <th style={{ padding: "10px 10px", textAlign: "left", width: "110px" }}>Mobile</th>
                              <th style={{ padding: "10px 10px", textAlign: "center", width: "85px" }}>Items</th>
                              <th style={{ padding: "10px 12px", textAlign: "left", width: "180px" }}>Related Suppliers</th>
                              <th style={{ padding: "10px 8px", textAlign: "center", width: "75px" }}>Status</th>
                              <th style={{ padding: "10px 12px", textAlign: "center", width: "110px" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((comp, idx) => {
                              const itemCount = (items || []).filter(i => (i.company || "").toUpperCase() === (comp.name || "").toUpperCase()).length;
                              const isInactive = comp.status === "inactive";
                              return (
                                <tr
                                  key={comp.id}
                                  style={{
                                    borderBottom: "1px solid #f1f5f9",
                                    background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                                    transition: "background 0.15s ease"
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f8fafc"}
                                >
                                  <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "700", color: "#64748b" }}>
                                    {comp.srNo || idx + 1}
                                  </td>
                                  <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "800", color: "#2563eb", fontFamily: "monospace" }}>
                                    {comp.code || "-"}
                                  </td>
                                  <td
                                    onClick={() => handleOpenCompanyForm(comp)}
                                    style={{ padding: "8px 12px", fontWeight: "800", color: "#1e3a8a", cursor: "pointer" }}
                                    title="Click to edit company"
                                  >
                                    {comp.name}
                                    {comp.location && <span style={{ display: "block", fontSize: "10px", fontWeight: "500", color: "#64748b" }}>📍 Location: {comp.location}</span>}
                                  </td>
                                  <td style={{ padding: "8px 10px", color: "#334155" }}>{comp.person || "-"}</td>
                                  <td style={{ padding: "8px 10px", color: "#475569" }}>{comp.city || "-"}</td>
                                  <td style={{ padding: "8px 10px", color: "#475569", fontWeight: "600" }}>{comp.mobile || "-"}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                                    <span style={{ background: itemCount > 0 ? "#dbeafe" : "#f1f5f9", color: itemCount > 0 ? "#1e40af" : "#64748b", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                                      {itemCount}
                                    </span>
                                  </td>
                                  <td style={{ padding: "8px 12px", fontSize: "11px", color: "#475569" }}>
                                    {(comp.relatedSuppliers || []).length === 0 ? (
                                      <span style={{ color: "#94a3b8", fontStyle: "italic" }}>None</span>
                                    ) : (
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                        {(comp.relatedSuppliers || []).slice(0, 2).map(s => (
                                          <span key={s} style={{ background: "#e0e7ff", color: "#3730a3", padding: "1px 5px", borderRadius: "3px", fontSize: "10px", fontWeight: "600" }}>
                                            {s}
                                          </span>
                                        ))}
                                        {(comp.relatedSuppliers || []).length > 2 && (
                                          <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "700" }}>
                                            +{(comp.relatedSuppliers || []).length - 2} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: "8px 6px", textAlign: "center" }}>
                                    <span style={{ background: isInactive ? "#fee2e2" : "#dcfce7", color: isInactive ? "#991b1b" : "#166534", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                                      {isInactive ? "Off" : "Active"}
                                    </span>
                                  </td>
                                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                      <button
                                        onClick={() => handleOpenCompanyForm(comp)}
                                        style={{ ...btn("#2563eb"), padding: "4px 8px", fontSize: "11px" }}
                                        title="Edit Company"
                                      >
                                        <Edit2 size={11} /> Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCompany(comp)}
                                        style={{ ...btn("#dc2626"), padding: "4px 6px", fontSize: "11px" }}
                                        title="Delete Company"
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
            {ownerSubTab === "suppliers" && (() => {
              // Filtering & Sorting
              const q = (suppMasterSearch || "").trim().toLowerCase();
              let filtered = (suppliers || []).filter(s => {
                if (suppMasterStatusFilter === "active" && s.status === "inactive") return false;
                if (suppMasterStatusFilter === "inactive" && s.status !== "inactive") return false;
                if (!q) return true;
                return (
                  (s.name || "").toLowerCase().includes(q) ||
                  (s.code || "").toLowerCase().includes(q) ||
                  (s.city || "").toLowerCase().includes(q) ||
                  (s.person || "").toLowerCase().includes(q) ||
                  (s.mobile || "").includes(q) ||
                  (s.gstTin || "").toLowerCase().includes(q) ||
                  (s.stNo || "").toLowerCase().includes(q) ||
                  String(s.srNo || "").includes(q)
                );
              });

              if (suppMasterSortBy === "name") {
                filtered = [...filtered].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
              } else if (suppMasterSortBy === "code") {
                filtered = [...filtered].sort((a, b) => (a.code || "").localeCompare(b.code || ""));
              } else if (suppMasterSortBy === "sr_desc") {
                filtered = [...filtered].sort((a, b) => Number(b.srNo || 0) - Number(a.srNo || 0));
              } else if (suppMasterSortBy === "comp_desc") {
                filtered = [...filtered].sort((a, b) => ((b.relatedCompanies || []).length) - ((a.relatedCompanies || []).length));
              }

              // Search dropdown results (max 10)
              const searchDropdownResults = q ? (suppliers || []).filter(s =>
                (s.name || "").toLowerCase().includes(q) ||
                (s.code || "").toLowerCase().includes(q) ||
                (s.city || "").toLowerCase().includes(q) ||
                (s.mobile || "").includes(q)
              ).slice(0, 10) : [];

              // Open Form Handler
              const handleOpenSuppForm = (supp = null) => {
                if (supp) {
                  setEditingSuppMaster(supp);
                  setSuppMasterForm({
                    ...defaultSupplierMasterForm,
                    ...supp,
                    stNo: supp.stNo || supp.gstTin || "",
                    relatedCompanies: supp.relatedCompanies || []
                  });
                } else {
                  setEditingSuppMaster(null);
                  const nextSr = suppliers.length > 0 ? Math.max(...suppliers.map(s => Number(s.srNo || 0))) + 1 : 1;
                  setSuppMasterForm({
                    ...defaultSupplierMasterForm,
                    id: uid(),
                    srNo: nextSr,
                    relatedCompanies: []
                  });
                }
                setShowSuppMasterForm(true);
              };

              // Save Supplier Handler
              const handleSaveSuppMaster = () => {
                if (!suppMasterForm.name || !suppMasterForm.name.trim()) {
                  showToast("Supplier Name is required!", "error");
                  return;
                }

                const sId = suppMasterForm.id || uid();
                const suppData = {
                  ...suppMasterForm,
                  id: sId,
                  name: suppMasterForm.name.trim().toUpperCase(),
                  code: (suppMasterForm.code || suppMasterForm.name.substring(0, 4)).trim().toUpperCase(),
                  gstTin: (suppMasterForm.stNo || suppMasterForm.gstTin || "").trim().toUpperCase(),
                  stNo: (suppMasterForm.stNo || suppMasterForm.gstTin || "").trim().toUpperCase(),
                  srNo: Number(suppMasterForm.srNo) || (suppliers.length + 1),
                  updatedAt: new Date().toISOString()
                };

                let updatedList;
                if (editingSuppMaster) {
                  updatedList = suppliers.map(s => s.id === editingSuppMaster.id ? suppData : s);
                } else {
                  updatedList = [...suppliers, suppData];
                }

                saveSuppliers(updatedList);

                // Also sync with accounts if an account with same name or id exists
                try {
                  const storedAccounts = JSON.parse(localStorage.getItem("store_accounts") || "[]");
                  const accMatch = storedAccounts.find(a => a.id === suppData.id || a.name === suppData.name);
                  if (accMatch) {
                    const nextAccs = storedAccounts.map(a => a.id === accMatch.id ? { ...a, name: suppData.name, mobile: suppData.mobile, city: suppData.city, gstTin: suppData.gstTin } : a);
                    localStorage.setItem("store_accounts", JSON.stringify(nextAccs));
                  }
                } catch (_) {}

                showToast(editingSuppMaster ? "Supplier updated successfully!" : "Supplier created successfully!");
                setShowSuppMasterForm(false);
                setEditingSuppMaster(null);
              };

              // Delete Supplier Handler
              const handleDeleteSuppMaster = (supp) => {
                showConfirm(`Are you sure you want to delete supplier "${supp.name}"?`, () => {
                  const nextList = suppliers.filter(s => s.id !== supp.id);
                  saveSuppliers(nextList);
                  if (editingSuppMaster?.id === supp.id) {
                    setShowSuppMasterForm(false);
                    setEditingSuppMaster(null);
                  }
                  showToast(`Supplier "${supp.name}" deleted successfully!`);
                });
              };

              // Record Navigation (< Prev & Next >)
              const handleNavigateSupp = (direction) => {
                if (suppliers.length === 0) return;
                const currentIdx = editingSuppMaster ? suppliers.findIndex(s => s.id === editingSuppMaster.id) : 0;
                let nextIdx = direction === "prev" ? currentIdx - 1 : currentIdx + 1;
                if (nextIdx < 0) nextIdx = suppliers.length - 1;
                if (nextIdx >= suppliers.length) nextIdx = 0;
                const target = suppliers[nextIdx];
                setEditingSuppMaster(target);
                setSuppMasterForm({
                  ...defaultSupplierMasterForm,
                  ...target,
                  stNo: target.stNo || target.gstTin || "",
                  relatedCompanies: target.relatedCompanies || []
                });
              };

              // All available companies in the system (starts completely blank if no companies exist!)
              const allSystemCompanies = (companies || []).map(c => c.name?.trim().toUpperCase()).filter(Boolean);
              // Plus any companies in items
              const itemComps = (items || []).map(i => i.company?.trim().toUpperCase()).filter(Boolean);
              // Combined company pool (NO hardcoded dummy list!)
              const combinedCompanyPool = [...new Set([...allSystemCompanies, ...itemComps, ...(suppMasterForm.relatedCompanies || [])])];

              const filteredPoolCompanies = combinedCompanyPool.filter(cName => {
                if (!companyFilterText) return true;
                return cName.toLowerCase().includes(companyFilterText.toLowerCase());
              });

              // Add Company to Supplier Related List
              const handleAddRelatedCompany = (compName) => {
                if (!compName || !compName.trim()) return;
                const clean = compName.trim().toUpperCase();
                if ((suppMasterForm.relatedCompanies || []).includes(clean)) {
                  showToast(`Company "${clean}" is already mapped to this supplier`, "error");
                  return;
                }
                setSuppMasterForm(prev => ({
                  ...prev,
                  relatedCompanies: [...(prev.relatedCompanies || []), clean]
                }));
                setNewCompanyInput("");
              };

              // Remove Company from Related List
              const handleRemoveRelatedCompany = (compName) => {
                setSuppMasterForm(prev => ({
                  ...prev,
                  relatedCompanies: (prev.relatedCompanies || []).filter(c => c !== compName)
                }));
              };

              // Move Related Company Up/Down
              const handleMoveCompany = (idx, direction) => {
                const list = [...(suppMasterForm.relatedCompanies || [])];
                const targetIdx = direction === "up" ? idx - 1 : idx + 1;
                if (targetIdx < 0 || targetIdx >= list.length) return;
                const temp = list[idx];
                list[idx] = list[targetIdx];
                list[targetIdx] = temp;
                setSuppMasterForm(prev => ({ ...prev, relatedCompanies: list }));
              };

              // Print Suppliers Directory
              const handlePrintSuppList = () => {
                const printWindow = window.open("", "_blank");
                if (!printWindow) return;
                const rows = filtered.map((s, i) => {
                  const compList = (s.relatedCompanies || []).join(", ") || "-";
                  return `
                    <tr style="border-bottom: 1px solid #ddd;">
                      <td style="padding: 6px; text-align: center;">${i + 1}</td>
                      <td style="padding: 6px; text-align: center; font-weight: bold;">${s.code || '-'}</td>
                      <td style="padding: 6px; font-weight: bold;">${s.name}</td>
                      <td style="padding: 6px;">${s.person || '-'}</td>
                      <td style="padding: 6px;">${s.city || '-'}</td>
                      <td style="padding: 6px;">${s.mobile || '-'}</td>
                      <td style="padding: 6px;">${s.gstTin || s.stNo || '-'}</td>
                      <td style="padding: 6px; font-size: 11px;">${compList}</td>
                      <td style="padding: 6px; text-align: center;">${s.status === 'inactive' ? 'Inactive' : 'Active'}</td>
                    </tr>
                  `;
                }).join("");

                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Supplier Master Directory - Shiv Dhara Medical Store</title>
                      <style>
                        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; color: #111; }
                        h2, h4 { margin: 0 0 6px 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th { background: #0f172a; color: white; padding: 8px 6px; text-align: left; }
                      </style>
                    </head>
                    <body>
                      <h2>Shiv Dhara Medical Store</h2>
                      <h4>Supplier Master Directory Register (Total: ${filtered.length})</h4>
                      <p style="font-size: 11px; color: #555;">Generated: ${new Date().toLocaleString()}</p>
                      <table>
                        <thead>
                          <tr>
                            <th style="width: 35px; text-align: center;">#</th>
                            <th style="width: 55px; text-align: center;">Code</th>
                            <th>Supplier Name</th>
                            <th>Representative</th>
                            <th>City</th>
                            <th>Mobile</th>
                            <th>GSTIN / ST No</th>
                            <th>Related Companies</th>
                            <th style="width: 60px; text-align: center;">Status</th>
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
                  {!showSuppMasterForm && (
                  <>
                  {/* ─── HEADER ROW (Inventory Style / Image 2) ─── */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "26px" }}>🏭</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Supplier Master</h2>
                      <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Distributors, Stockists & Company Supply Mapping</p>
                    </div>

                    <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        onClick={handlePrintSuppList}
                        style={{ ...btn("#334155"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <Printer size={13} /> Print Directory
                      </button>
                      <button
                        onClick={() => handleOpenSuppForm(null)}
                        style={{ ...btn("var(--color-primary)"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <Plus size={13} /> Add Supplier
                      </button>
                    </div>
                  </div>

                  {/* ─── SEARCH & FILTER BAR (Inventory Style / Image 2) ─── */}
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
                      <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                      <input
                        placeholder="Search Supplier Name, Code, City or Mobile... + Enter"
                        value={suppMasterSearch}
                        onChange={e => {
                          setSuppMasterSearch(e.target.value);
                          setSuppMasterSearchDropdown(true);
                          setSuppMasterSearchHighlight(0);
                        }}
                        onKeyDown={e => {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setSuppMasterSearchHighlight(prev => Math.min(prev + 1, searchDropdownResults.length - 1));
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setSuppMasterSearchHighlight(prev => Math.max(prev - 1, 0));
                          } else if (e.key === "Enter") {
                            e.preventDefault();
                            if (searchDropdownResults.length > 0 && suppMasterSearchDropdown) {
                              handleOpenSuppForm(searchDropdownResults[suppMasterSearchHighlight]);
                              setSuppMasterSearchDropdown(false);
                              setSuppMasterSearch("");
                            } else if (q && filtered.length > 0) {
                              handleOpenSuppForm(filtered[0]);
                              setSuppMasterSearchDropdown(false);
                              setSuppMasterSearch("");
                            } else if (q) {
                              showToast("No supplier found matching: " + suppMasterSearch, "error");
                            }
                          }
                        }}
                        onFocus={() => setSuppMasterSearchDropdown(true)}
                        onBlur={() => setTimeout(() => setSuppMasterSearchDropdown(false), 200)}
                        style={{ ...inp, paddingLeft: "30px", width: "100%", height: "36px" }}
                      />

                      {/* Search Dropdown Popup */}
                      {suppMasterSearchDropdown && searchDropdownResults.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--shadow-lg)", zIndex: 50, marginTop: "4px", overflow: "hidden", maxHeight: "280px", overflowY: "auto" }}>
                          {searchDropdownResults.map((supp, idx) => (
                            <div
                              key={supp.id}
                              onClick={() => {
                                handleOpenSuppForm(supp);
                                setSuppMasterSearchDropdown(false);
                                setSuppMasterSearch("");
                              }}
                              onMouseEnter={() => setSuppMasterSearchHighlight(idx)}
                              style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                background: idx === suppMasterSearchHighlight ? "#f1f5f9" : "white",
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                              }}
                            >
                              <div>
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>
                                  {supp.name} <span style={{ color: "#3b82f6", fontSize: "11px" }}>({supp.code || 'SUP'})</span>
                                </div>
                                <div style={{ fontSize: "10px", color: "#64748b" }}>
                                  {supp.city ? `City: ${supp.city}` : ""} {supp.mobile ? `· 📱 ${supp.mobile}` : ""} {supp.person ? `· Rep: ${supp.person}` : ""}
                                </div>
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: "700", color: "#1e40af", background: "#dbeafe", padding: "2px 6px", borderRadius: "4px" }}>
                                {(supp.relatedCompanies || []).length} Companies
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <select
                      value={suppMasterStatusFilter}
                      onChange={e => setSuppMasterStatusFilter(e.target.value)}
                      style={{ ...inp, width: "auto", height: "36px" }}
                    >
                      <option value="All">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>

                    <select
                      value={suppMasterSortBy}
                      onChange={e => setSuppMasterSortBy(e.target.value)}
                      style={{ ...inp, width: "auto", height: "36px" }}
                    >
                      <option value="name">Name A-Z</option>
                      <option value="code">Code A-Z</option>
                      <option value="comp_desc">Companies Count ↓</option>
                      <option value="sr_desc">Sr No ↓</option>
                    </select>
                  </div>
                  </>
                  )}

                  {/* ─── ADD / EDIT SUPPLIER CARD (Theme: Add Item in Image 2 + Dual Panel Mapping) ─── */}
                  {showSuppMasterForm && (
                    <div style={{ background: "white", borderRadius: "10px", padding: "14px 18px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", animation: "fadeIn 0.15s ease-out", height: "calc(100vh - 150px)", maxHeight: "calc(100vh - 150px)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                      {/* Form Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "18px" }}>🏭</span>
                          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                            {editingSuppMaster ? `Edit Supplier: ${editingSuppMaster.name}` : "Add New Supplier"}
                          </h3>
                          <span style={{ fontSize: "11px", fontWeight: "700", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "4px" }}>
                            Sr. No: {suppMasterForm.srNo || "Auto"}
                          </span>
                        </div>
                        <button
                          onClick={() => { setShowSuppMasterForm(false); setEditingSuppMaster(null); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Dual Panel Layout (Supplier Details Left, Company Mapping Right) */}
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr", gap: "20px", marginBottom: "16px" }}>
                        {/* ─── LEFT PANEL: SUPPLIER DETAILS (Matching Image 4 Screenshot) ─── */}
                        <div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "10px" }}>
                            {/* Sr. No (Pink Accent Box from Legacy Screenshot) */}
                            <div>
                              <label style={lbl}>Sr. No.</label>
                              <input
                                type="number"
                                value={suppMasterForm.srNo || ""}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, srNo: e.target.value })}
                                placeholder="Auto"
                                style={{ ...inp, background: "#fce7f3", border: "1px solid #f472b6", fontWeight: "800", color: "#831843" }}
                              />
                            </div>

                            {/* Code */}
                            <div>
                              <label style={lbl}>Supplier Code *</label>
                              <input
                                value={suppMasterForm.code || ""}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, code: e.target.value.toUpperCase() })}
                                placeholder="e.g. SUP01, ABHA"
                                maxLength={10}
                                style={{ ...inp, textTransform: "uppercase", fontWeight: "800", color: "#1e3a8a" }}
                              />
                            </div>

                            {/* Supplier Name */}
                            <div style={{ gridColumn: "span 2" }}>
                              <label style={lbl}>Supplier / Agency Name *</label>
                              <input
                                value={suppMasterForm.name || ""}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, name: e.target.value.toUpperCase() })}
                                placeholder="e.g. AAI SHREE KHODIYAR MARKETING"
                                style={{ ...inp, textTransform: "uppercase", fontWeight: "800" }}
                              />
                            </div>

                            {/* Person (Contact Person / Representative) */}
                            <div>
                              <label style={lbl}>Contact Person</label>
                              <input
                                value={suppMasterForm.person || ""}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, person: e.target.value.toUpperCase() })}
                                placeholder="Owner / Manager / Rep"
                                style={{ ...inp, textTransform: "uppercase" }}
                              />
                            </div>

                            {/* Area */}
                            <div>
                              <label style={lbl}>Area</label>
                              <input
                                value={suppMasterForm.area || ""}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, area: e.target.value.toUpperCase() })}
                                placeholder="e.g. RING ROAD"
                                style={{ ...inp, textTransform: "uppercase" }}
                              />
                            </div>

                            {/* City */}
                            <div>
                              <label style={lbl}>City</label>
                              <input
                                value={suppMasterForm.city || ""}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, city: e.target.value.toUpperCase() })}
                                placeholder="e.g. SURAT, AHMEDABAD"
                                style={{ ...inp, textTransform: "uppercase" }}
                              />
                            </div>

                            {/* Contact (Landline / Office) */}
                            <div>
                              <label style={lbl}>Contact Phone</label>
                              <input
                                value={suppMasterForm.contact || ""}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, contact: e.target.value })}
                                placeholder="Office landline"
                                style={inp}
                              />
                            </div>

                            {/* Mobile */}
                            <div>
                              <label style={lbl}>Mobile Number</label>
                              <input
                                value={suppMasterForm.mobile || ""}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, mobile: e.target.value.replace(/[^0-9]/g, "") })}
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
                                value={suppMasterForm.email || ""}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, email: e.target.value })}
                                placeholder="orders@distributor.com"
                                style={inp}
                              />
                            </div>

                            {/* Drug License No (D.L.No) */}
                            <div>
                              <label style={lbl}>D.L. No. (Drug License)</label>
                              <input
                                value={suppMasterForm.dlNo || ""}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, dlNo: e.target.value.toUpperCase() })}
                                placeholder="e.g. 20B/21B-GJ-1122"
                                style={{ ...inp, textTransform: "uppercase" }}
                              />
                            </div>

                            {/* Sales Tax / GSTIN (S.T.No) */}
                            <div>
                              <label style={lbl}>S.T. No. / GSTIN</label>
                              <input
                                value={suppMasterForm.stNo || suppMasterForm.gstTin || ""}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, stNo: e.target.value.toUpperCase(), gstTin: e.target.value.toUpperCase() })}
                                placeholder="15-digit GSTIN / ST No"
                                maxLength={15}
                                style={{ ...inp, textTransform: "uppercase", fontWeight: "700" }}
                              />
                            </div>

                            {/* Billing Message Alert */}
                            <div style={{ gridColumn: "span 2" }}>
                              <label style={lbl}>Billing Alert Message</label>
                              <input
                                value={suppMasterForm.message || ""}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, message: e.target.value })}
                                placeholder="Alert message shown during purchase billing..."
                                style={inp}
                              />
                            </div>

                            {/* Status */}
                            <div>
                              <label style={lbl}>Status</label>
                              <select
                                value={suppMasterForm.status || "active"}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, status: e.target.value })}
                                style={{ ...inp, fontWeight: "700", color: suppMasterForm.status === "inactive" ? "#dc2626" : "#16a34a" }}
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>

                            {/* Address */}
                            <div style={{ gridColumn: "1 / -1" }}>
                              <label style={lbl}>Supplier Address</label>
                              <textarea
                                value={suppMasterForm.address || ""}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, address: e.target.value.toUpperCase() })}
                                placeholder="Godown / Office Address..."
                                style={{ ...inp, height: "42px", resize: "vertical", textTransform: "uppercase" }}
                              />
                            </div>

                            {/* Remarks */}
                            <div style={{ gridColumn: "1 / -1" }}>
                              <label style={lbl}>Remarks / Terms</label>
                              <input
                                value={suppMasterForm.remarks || ""}
                                onChange={e => setSuppMasterForm({ ...suppMasterForm, remarks: e.target.value })}
                                placeholder="Payment terms, bank details, return policy notes..."
                                style={inp}
                              />
                            </div>
                          </div>
                        </div>

                        {/* ─── RIGHT PANEL: COMPANY MAPPING (Blank by default, no hardcoded dummy list!) ─── */}
                        <div style={{ background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          {/* Function Keys Shortcut Banner (Matching Legacy Screenshot Image 4) */}
                          <div style={{ background: "#1e293b", color: "#f8fafc", padding: "6px 10px", borderRadius: "5px", fontSize: "10px", fontWeight: "700", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                            <span>F5-Supplier Name</span>
                            <span>F6-New Company</span>
                            <span>F7-All Company</span>
                            <span>F8-Supplier Company</span>
                          </div>

                          {/* Quick Add / Register Company */}
                          <div>
                            <label style={{ ...lbl, fontSize: "10px" }}>Add New Company to List</label>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <input
                                value={newCompanyInput}
                                onChange={e => setNewCompanyInput(e.target.value.toUpperCase())}
                                onKeyDown={e => e.key === "Enter" && handleAddRelatedCompany(newCompanyInput)}
                                placeholder="Type company name..."
                                style={{ ...inp, textTransform: "uppercase", fontSize: "11px", height: "30px" }}
                              />
                              <button
                                type="button"
                                onClick={() => handleAddRelatedCompany(newCompanyInput)}
                                style={{ ...btn("var(--color-primary)"), padding: "4px 10px", fontSize: "11px" }}
                              >
                                Add
                              </button>
                            </div>
                          </div>

                          {/* Top Box: List of All Company (Blank if no companies created yet!) */}
                          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#334155" }}>
                                List of All Company ({combinedCompanyPool.length})
                              </span>
                              <input
                                placeholder="Filter companies..."
                                value={companyFilterText}
                                onChange={e => setCompanyFilterText(e.target.value)}
                                style={{ ...inp, width: "110px", height: "22px", fontSize: "10px", padding: "2px 6px" }}
                              />
                            </div>

                            <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "5px", height: "130px", overflowY: "auto", padding: "4px" }}>
                              {filteredPoolCompanies.length === 0 ? (
                                <div style={{ padding: "30px 10px", textAlign: "center", color: "#94a3b8", fontSize: "11px" }}>
                                  No companies in system yet.<br/>Type above or add in Company Master to populate.
                                </div>
                              ) : (
                                filteredPoolCompanies.map(cName => {
                                  const isAlreadyRelated = (suppMasterForm.relatedCompanies || []).includes(cName);
                                  return (
                                    <div
                                      key={cName}
                                      onClick={() => !isAlreadyRelated && handleAddRelatedCompany(cName)}
                                      style={{
                                        padding: "4px 8px",
                                        fontSize: "11px",
                                        cursor: isAlreadyRelated ? "default" : "pointer",
                                        borderRadius: "3px",
                                        marginBottom: "2px",
                                        background: isAlreadyRelated ? "#f1f5f9" : "transparent",
                                        color: isAlreadyRelated ? "#94a3b8" : "#0f172a",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                      }}
                                      onMouseEnter={e => { if (!isAlreadyRelated) e.currentTarget.style.background = "#e0e7ff"; }}
                                      onMouseLeave={e => { if (!isAlreadyRelated) e.currentTarget.style.background = "transparent"; }}
                                    >
                                      <span style={{ fontWeight: isAlreadyRelated ? "400" : "600" }}>{cName}</span>
                                      {isAlreadyRelated ? (
                                        <span style={{ fontSize: "9px", color: "#16a34a", fontWeight: "700" }}>Mapped</span>
                                      ) : (
                                        <span style={{ fontSize: "10px", color: "#2563eb", fontWeight: "700" }}>+ Map</span>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* Bottom Box: List of Company Related Supplier */}
                          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#1e3a8a" }}>
                                List of Company Related Supplier ({(suppMasterForm.relatedCompanies || []).length})
                              </span>
                              <span style={{ fontSize: "10px", color: "#64748b" }}>Use UP/DOWN to reorder</span>
                            </div>

                            <div style={{ background: "#ffffff", border: "1px solid #93c5fd", borderRadius: "5px", height: "130px", overflowY: "auto", padding: "4px" }}>
                              {(suppMasterForm.relatedCompanies || []).length === 0 ? (
                                <div style={{ padding: "30px 10px", textAlign: "center", color: "#94a3b8", fontSize: "11px" }}>
                                  No companies mapped to this supplier yet.<br/>Click "+ Map" above to link distributed brands.
                                </div>
                              ) : (
                                (suppMasterForm.relatedCompanies || []).map((cName, idx) => (
                                  <div
                                    key={cName}
                                    style={{
                                      padding: "4px 8px",
                                      fontSize: "11px",
                                      background: "#eff6ff",
                                      borderBottom: "1px solid #dbeafe",
                                      borderRadius: "3px",
                                      marginBottom: "2px",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center"
                                    }}
                                  >
                                    <span style={{ fontWeight: "700", color: "#1e40af" }}>
                                      {idx + 1}. {cName}
                                    </span>
                                    <div style={{ display: "flex", gap: "3px" }}>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveCompany(idx, "up")}
                                        disabled={idx === 0}
                                        style={{ padding: "1px 5px", fontSize: "9px", border: "1px solid #cbd5e1", borderRadius: "2px", background: "white", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.4 : 1 }}
                                        title="Move UP"
                                      >
                                        ▲
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveCompany(idx, "down")}
                                        disabled={idx === (suppMasterForm.relatedCompanies || []).length - 1}
                                        style={{ padding: "1px 5px", fontSize: "9px", border: "1px solid #cbd5e1", borderRadius: "2px", background: "white", cursor: idx === (suppMasterForm.relatedCompanies || []).length - 1 ? "default" : "pointer", opacity: idx === (suppMasterForm.relatedCompanies || []).length - 1 ? 0.4 : 1 }}
                                        title="Move DOWN"
                                      >
                                        ▼
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveRelatedCompany(cName)}
                                        style={{ padding: "1px 5px", fontSize: "9px", border: "none", borderRadius: "2px", background: "#fee2e2", color: "#dc2626", cursor: "pointer", fontWeight: "700" }}
                                        title="Remove"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ─── FORM ACTION BUTTONS (Matching Legacy Controls & Image 2 Theme) ─── */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => handleNavigateSupp("prev")}
                            style={{ ...btn("#475569"), padding: "7px 12px", fontSize: "12px" }}
                            title="Previous Supplier"
                          >
                            <ChevronLeft size={14} /> Prev
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavigateSupp("next")}
                            style={{ ...btn("#475569"), padding: "7px 12px", fontSize: "12px" }}
                            title="Next Supplier"
                          >
                            Next <ChevronRight size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLabelSupplier(suppMasterForm);
                              setShowLabelModal(true);
                            }}
                            style={{ ...btn("#0284c7"), padding: "7px 12px", fontSize: "12px" }}
                          >
                            🏷️ Label
                          </button>
                          {editingSuppMaster && (
                            <button
                              type="button"
                              onClick={() => {
                                setLedgerSupplierId(editingSuppMaster.id);
                                setShowSupplierLedger(true);
                              }}
                              style={{ ...btn("#7c3aed"), padding: "7px 12px", fontSize: "12px" }}
                            >
                              📒 Ledger
                            </button>
                          )}
                          {editingSuppMaster && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSuppMaster(editingSuppMaster)}
                              style={{ ...btn("#dc2626"), padding: "7px 12px", fontSize: "12px" }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => { setShowSuppMasterForm(false); setEditingSuppMaster(null); }}
                            style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), padding: "7px 14px", fontSize: "12px" }}
                          >
                            <X size={13} /> Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveSuppMaster}
                            style={{ ...btn("var(--color-primary)"), padding: "7px 18px", fontSize: "12px", fontWeight: "800" }}
                          >
                            <CheckCircle size={14} /> {editingSuppMaster ? "Update Supplier" : "Save Supplier"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── SUPPLIERS DIRECTORY TABLE (Inventory Style / Image 2) ─── */}
                  {!showSuppMasterForm && (
                  <div style={{ background: "white", borderRadius: "12px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>
                        Registered Suppliers ({filtered.length})
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        Click any supplier to edit details or manage distributed companies
                      </span>
                    </div>

                    {filtered.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                        <div style={{ fontSize: "40px", opacity: 0.6 }}>🏭</div>
                        <p style={{ marginTop: "12px", fontWeight: "700", fontSize: "15px", color: "#334155" }}>
                          No suppliers found matching your criteria
                        </p>
                        <p style={{ fontSize: "12px", color: "#64748b" }}>
                          Add a new distributor or change your search keywords.
                        </p>
                        <button
                          onClick={() => handleOpenSuppForm(null)}
                          style={{ ...btn("var(--color-primary)"), margin: "14px auto 0", fontSize: "12px" }}
                        >
                          <Plus size={13} /> Add New Supplier
                        </button>
                      </div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                          <thead>
                            <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                              <th style={{ padding: "10px 8px", textAlign: "center", width: "45px" }}>Sr No</th>
                              <th style={{ padding: "10px 8px", textAlign: "center", width: "65px" }}>Code</th>
                              <th style={{ padding: "10px 12px", textAlign: "left" }}>Supplier / Agency Name</th>
                              <th style={{ padding: "10px 10px", textAlign: "left", width: "140px" }}>Representative</th>
                              <th style={{ padding: "10px 10px", textAlign: "left", width: "110px" }}>City</th>
                              <th style={{ padding: "10px 10px", textAlign: "left", width: "110px" }}>Mobile</th>
                              <th style={{ padding: "10px 10px", textAlign: "left", width: "135px" }}>GSTIN / ST No</th>
                              <th style={{ padding: "10px 12px", textAlign: "left", width: "170px" }}>Mapped Companies</th>
                              <th style={{ padding: "10px 8px", textAlign: "center", width: "75px" }}>Status</th>
                              <th style={{ padding: "10px 12px", textAlign: "center", width: "140px" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((supp, idx) => {
                              const isInactive = supp.status === "inactive";
                              return (
                                <tr
                                  key={supp.id}
                                  style={{
                                    borderBottom: "1px solid #f1f5f9",
                                    background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                                    transition: "background 0.15s ease"
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f8fafc"}
                                >
                                  <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "700", color: "#64748b" }}>
                                    {supp.srNo || idx + 1}
                                  </td>
                                  <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "800", color: "#2563eb", fontFamily: "monospace" }}>
                                    {supp.code || "SUP"}
                                  </td>
                                  <td
                                    onClick={() => handleOpenSuppForm(supp)}
                                    style={{ padding: "8px 12px", fontWeight: "800", color: "#1e3a8a", cursor: "pointer" }}
                                    title="Click to edit supplier"
                                  >
                                    {supp.name}
                                    {supp.address && <span style={{ display: "block", fontSize: "10px", fontWeight: "400", color: "#64748b" }}>{supp.address}</span>}
                                  </td>
                                  <td style={{ padding: "8px 10px", color: "#334155" }}>{supp.person || "-"}</td>
                                  <td style={{ padding: "8px 10px", color: "#475569" }}>{supp.city || "-"}</td>
                                  <td style={{ padding: "8px 10px", color: "#475569", fontWeight: "600" }}>{supp.mobile || "-"}</td>
                                  <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: "11px", color: "#334155" }}>
                                    {supp.stNo || supp.gstTin || "-"}
                                  </td>
                                  <td style={{ padding: "8px 12px", fontSize: "11px", color: "#475569" }}>
                                    {(supp.relatedCompanies || []).length === 0 ? (
                                      <span style={{ color: "#94a3b8", fontStyle: "italic" }}>None</span>
                                    ) : (
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                        {(supp.relatedCompanies || []).slice(0, 2).map(c => (
                                          <span key={c} style={{ background: "#dbeafe", color: "#1e40af", padding: "1px 5px", borderRadius: "3px", fontSize: "10px", fontWeight: "600" }}>
                                            {c}
                                          </span>
                                        ))}
                                        {(supp.relatedCompanies || []).length > 2 && (
                                          <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "700" }}>
                                            +{(supp.relatedCompanies || []).length - 2} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: "8px 6px", textAlign: "center" }}>
                                    <span style={{ background: isInactive ? "#fee2e2" : "#dcfce7", color: isInactive ? "#991b1b" : "#166534", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                                      {isInactive ? "Off" : "Active"}
                                    </span>
                                  </td>
                                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                      <button
                                        onClick={() => handleOpenSuppForm(supp)}
                                        style={{ ...btn("#2563eb"), padding: "4px 8px", fontSize: "11px" }}
                                        title="Edit Supplier"
                                      >
                                        <Edit2 size={11} /> Edit
                                      </button>
                                      <button
                                        onClick={() => {
                                          setLabelSupplier(supp);
                                          setShowLabelModal(true);
                                        }}
                                        style={{ ...btn("#0284c7"), padding: "4px 6px", fontSize: "11px" }}
                                        title="Print Address Label"
                                      >
                                        🏷️
                                      </button>
                                      <button
                                        onClick={() => {
                                          setLedgerSupplierId(supp.id);
                                          setShowSupplierLedger(true);
                                        }}
                                        style={{ ...btn("#7c3aed"), padding: "4px 6px", fontSize: "11px" }}
                                        title="Supplier Ledger"
                                      >
                                        📒
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSuppMaster(supp)}
                                        style={{ ...btn("#dc2626"), padding: "4px 6px", fontSize: "11px" }}
                                        title="Delete Supplier"
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
                  )}

                  {/* ─── SUPPLIER SHIPPING / COURIER LABEL MODAL ─── */}
                  {showLabelModal && labelSupplier && (
                    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                      <div style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "540px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", overflow: "hidden" }}>
                        <div style={{ padding: "14px 20px", background: "#1e293b", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "700", fontSize: "14px" }}>🏷️ Print Supplier Address Label</span>
                          <button onClick={() => setShowLabelModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={16} /></button>
                        </div>
                        <div style={{ padding: "24px", border: "2px dashed #cbd5e1", margin: "20px", borderRadius: "8px", background: "#ffffff" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", letterSpacing: "1px" }}>PHARMA PARCEL LABEL</span>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>Code: {labelSupplier.code || "SUP"}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>To Supplier:</div>
                          <div style={{ fontWeight: "900", fontSize: "16px", color: "#0f172a", marginTop: "2px" }}>{labelSupplier.name}</div>
                          {labelSupplier.person && <div style={{ fontSize: "12px", color: "#334155", fontWeight: "600" }}>Attn: {labelSupplier.person}</div>}
                          <div style={{ fontSize: "13px", color: "#334155", marginTop: "4px" }}>{labelSupplier.address || "Godown / Office Address"}</div>
                          <div style={{ fontSize: "13px", color: "#334155" }}>
                            {labelSupplier.area ? `${labelSupplier.area}, ` : ""}{labelSupplier.city || ""}
                          </div>
                          {labelSupplier.mobile && <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a", marginTop: "6px" }}>📱 Phone: {labelSupplier.mobile}</div>}
                          {labelSupplier.dlNo && <div style={{ fontSize: "11px", color: "#64748b" }}>D.L. No: {labelSupplier.dlNo}</div>}
                          {(labelSupplier.stNo || labelSupplier.gstTin) && <div style={{ fontSize: "11px", color: "#64748b" }}>GSTIN / ST: {labelSupplier.stNo || labelSupplier.gstTin}</div>}
                        </div>
                        <div style={{ padding: "12px 20px", background: "#f8fafc", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <button onClick={() => setShowLabelModal(false)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "12px" }}>Close</button>
                          <button
                            onClick={() => {
                              const pw = window.open("", "_blank");
                              if (!pw) return;
                              pw.document.write(`
                                <html>
                                  <head>
                                    <title>Label - ${labelSupplier.name}</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; padding: 20px; }
                                      .label-box { border: 2px solid #000; padding: 20px; width: 400px; border-radius: 6px; }
                                      .title { font-size: 10px; font-weight: bold; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; }
                                      .name { font-size: 16px; font-weight: bold; }
                                      .line { font-size: 13px; margin: 3px 0; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="label-box">
                                      <div class="title">SUPPLIER DISPATCH LABEL · CODE: ${labelSupplier.code || 'SUP'}</div>
                                      <div class="name">${labelSupplier.name}</div>
                                      ${labelSupplier.person ? `<div class="line">Attn: ${labelSupplier.person}</div>` : ''}
                                      <div class="line">${labelSupplier.address || ''}</div>
                                      <div class="line">${labelSupplier.area ? labelSupplier.area + ', ' : ''}${labelSupplier.city || ''}</div>
                                      ${labelSupplier.mobile ? `<div class="line"><strong>Phone: ${labelSupplier.mobile}</strong></div>` : ''}
                                      ${labelSupplier.dlNo ? `<div class="line" style="font-size:11px;">D.L. No: ${labelSupplier.dlNo}</div>` : ''}
                                      ${(labelSupplier.stNo || labelSupplier.gstTin) ? `<div class="line" style="font-size:11px;">GSTIN/ST: ${labelSupplier.stNo || labelSupplier.gstTin}</div>` : ''}
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
                            <Printer size={13} /> Print Label
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ═════════════════════════════════════════════════════════════
                DRUG GROUP MASTER (Matching Inventory Page Layout / Image 2)
            ═════════════════════════════════════════════════════════════ */}
            {ownerSubTab === "drug_groups" && (() => {
              // Filtering & Sorting
              const q = (drugGroupSearch || "").trim().toLowerCase();
              let filtered = (drugGroups || []).filter(dg => {
                const linkedItems = (items || []).filter(i => (i.drugGroup || "").toUpperCase() === (dg.name || "").toUpperCase());
                const totalStock = linkedItems.reduce((acc, it) => acc + (Number(it.stock) || 0), 0);
                if (onlyStockFilter && totalStock <= 0) return false;
                if (!q) return true;
                return (
                  (dg.name || "").toLowerCase().includes(q) ||
                  (dg.code || "").toLowerCase().includes(q) ||
                  (dg.contents || "").toLowerCase().includes(q) ||
                  (dg.remarks || "").toLowerCase().includes(q) ||
                  String(dg.srNo || "").includes(q)
                );
              });

              if (drugGroupSortBy === "name") {
                filtered = [...filtered].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
              } else if (drugGroupSortBy === "code") {
                filtered = [...filtered].sort((a, b) => (a.code || "").localeCompare(b.code || ""));
              } else if (drugGroupSortBy === "sr_desc") {
                filtered = [...filtered].sort((a, b) => Number(b.srNo || 0) - Number(a.srNo || 0));
              } else if (drugGroupSortBy === "items_desc") {
                filtered = [...filtered].sort((a, b) => {
                  const countA = (items || []).filter(i => (i.drugGroup || "").toUpperCase() === (a.name || "").toUpperCase()).length;
                  const countB = (items || []).filter(i => (i.drugGroup || "").toUpperCase() === (b.name || "").toUpperCase()).length;
                  return countB - countA;
                });
              }

              // Search dropdown results (max 10)
              const searchDropdownResults = q ? (drugGroups || []).filter(dg =>
                (dg.name || "").toLowerCase().includes(q) ||
                (dg.code || "").toLowerCase().includes(q) ||
                (dg.contents || "").toLowerCase().includes(q)
              ).slice(0, 10) : [];

              // Open Form Handler
              const handleOpenDrugGroupForm = (dg = null) => {
                if (dg) {
                  setEditingDrugGroup(dg);
                  setDrugGroupForm({ ...defaultDrugGroupForm, ...dg });
                } else {
                  setEditingDrugGroup(null);
                  const nextSr = drugGroups.length > 0 ? Math.max(...drugGroups.map(d => Number(d.srNo || 0))) + 1 : 1;
                  setDrugGroupForm({ ...defaultDrugGroupForm, id: uid(), srNo: nextSr });
                }
                setShowDrugGroupForm(true);
              };

              // Save Drug Group Handler
              const handleSaveDrugGroup = () => {
                if (!drugGroupForm.name || !drugGroupForm.name.trim()) {
                  showToast("Drug Group Name is required!", "error");
                  return;
                }

                const dgId = drugGroupForm.id || uid();
                const dgData = {
                  ...drugGroupForm,
                  id: dgId,
                  name: drugGroupForm.name.trim().toUpperCase(),
                  code: (drugGroupForm.code || drugGroupForm.name.substring(0, 4)).trim().toUpperCase(),
                  srNo: Number(drugGroupForm.srNo) || (drugGroups.length + 1),
                  updatedAt: new Date().toISOString()
                };

                let updatedList;
                if (editingDrugGroup) {
                  // If name changed, update items matching old name
                  if (editingDrugGroup.name !== dgData.name) {
                    const oldName = editingDrugGroup.name.toUpperCase();
                    const updatedItems = (items || []).map(i => {
                      if ((i.drugGroup || "").toUpperCase() === oldName) {
                        return { ...i, drugGroup: dgData.name };
                      }
                      return i;
                    });
                    saveItems(updatedItems);
                  }
                  updatedList = drugGroups.map(d => d.id === editingDrugGroup.id ? dgData : d);
                } else {
                  updatedList = [...drugGroups, dgData];
                }

                setDrugGroups(updatedList);
                try {
                  localStorage.setItem("store_drug_groups", JSON.stringify(updatedList));
                } catch (_) {}

                showToast(editingDrugGroup ? "Drug Group updated successfully!" : "Drug Group created successfully!");
                setShowDrugGroupForm(false);
                setEditingDrugGroup(null);
              };

              // Bulk Update Items with this Group Name
              const handleUpdateGroupItems = () => {
                if (!drugGroupForm.name || !drugGroupForm.name.trim()) {
                  showToast("Please enter a valid Drug Group name first", "error");
                  return;
                }

                const groupName = drugGroupForm.name.trim().toUpperCase();
                const matchingCount = (items || []).filter(i => (i.drugGroup || "").toUpperCase() === groupName).length;

                showToast(`✅ Verified: ${matchingCount} inventory items linked with ${groupName}`);
              };

              // Delete Drug Group Handler
              const handleDeleteDrugGroup = (dg) => {
                const targetName = dg.name;
                const linkedCount = (items || []).filter(i => (i.drugGroup || "").toUpperCase() === targetName.toUpperCase()).length;

                showConfirm(`Are you sure you want to delete drug group "${targetName}" (${linkedCount} linked medicines)?`, () => {
                  const nextList = drugGroups.filter(d => d.id !== dg.id);
                  setDrugGroups(nextList);
                  try {
                    localStorage.setItem("store_drug_groups", JSON.stringify(nextList));
                  } catch (_) {}

                  if (editingDrugGroup?.id === dg.id) {
                    setShowDrugGroupForm(false);
                    setEditingDrugGroup(null);
                  }
                  showToast(`Drug group "${targetName}" deleted successfully!`);
                });
              };

              // Record Navigation (< Prev & Next >)
              const handleNavigateDrugGroup = (direction) => {
                if (drugGroups.length === 0) return;
                const currentIdx = editingDrugGroup ? drugGroups.findIndex(d => d.id === editingDrugGroup.id) : 0;
                let nextIdx = direction === "prev" ? currentIdx - 1 : currentIdx + 1;
                if (nextIdx < 0) nextIdx = drugGroups.length - 1;
                if (nextIdx >= drugGroups.length) nextIdx = 0;
                const target = drugGroups[nextIdx];
                setEditingDrugGroup(target);
                setDrugGroupForm({ ...defaultDrugGroupForm, ...target });
              };

              // Print Formulary Register
              const handlePrintFormulary = () => {
                const printWindow = window.open("", "_blank");
                if (!printWindow) return;
                const rows = filtered.map((dg, i) => {
                  const linkedItems = (items || []).filter(it => (it.drugGroup || "").toUpperCase() === (dg.name || "").toUpperCase());
                  const namesList = linkedItems.map(it => `${it.name} (${it.stock || 0} ${it.unit || ''})`).join(", ") || "None";
                  return `
                    <tr style="border-bottom: 1px solid #ddd;">
                      <td style="padding: 6px; text-align: center;">${i + 1}</td>
                      <td style="padding: 6px; text-align: center; font-weight: bold;">${dg.code || '-'}</td>
                      <td style="padding: 6px; font-weight: bold;">${dg.name}</td>
                      <td style="padding: 6px; font-size: 11px;">${dg.contents || '-'}</td>
                      <td style="padding: 6px; font-size: 11px;">${namesList}</td>
                      <td style="padding: 6px; text-align: center; font-weight: bold;">${linkedItems.length}</td>
                      <td style="padding: 6px; font-size: 11px;">${dg.remarks || '-'}</td>
                    </tr>
                  `;
                }).join("");

                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Drug Group Formulary - Shiv Dhara Medical Store</title>
                      <style>
                        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; color: #111; }
                        h2, h4 { margin: 0 0 6px 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th { background: #0f172a; color: white; padding: 8px 6px; text-align: left; }
                      </style>
                    </head>
                    <body>
                      <h2>Shiv Dhara Medical Store</h2>
                      <h4>Generic Drug Group Master Formulary (Total: ${filtered.length})</h4>
                      <p style="font-size: 11px; color: #555;">Generated: ${new Date().toLocaleString()}</p>
                      <table>
                        <thead>
                          <tr>
                            <th style="width: 35px; text-align: center;">#</th>
                            <th style="width: 55px; text-align: center;">Code</th>
                            <th>Generic / Molecule Name</th>
                            <th>Contents & Formulation</th>
                            <th>Linked Brands / Substitutes</th>
                            <th style="width: 50px; text-align: center;">Brands</th>
                            <th>Remarks & Precautions</th>
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
                  {!showDrugGroupForm && (
                  <>
                  {/* ─── HEADER ROW (Inventory Style / Image 2) ─── */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "26px" }}>🧪</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Drug Group Master</h2>
                      <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Generic Formulations, Active Molecules & Brand Substitutes</p>
                    </div>

                    <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        onClick={handlePrintFormulary}
                        style={{ ...btn("#334155"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <Printer size={13} /> Print Formulary
                      </button>
                      <button
                        onClick={() => handleOpenDrugGroupForm(null)}
                        style={{ ...btn("var(--color-primary)"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <Plus size={13} /> Add Drug Group
                      </button>
                    </div>
                  </div>

                  {/* ─── SEARCH & FILTER BAR (Inventory Style / Image 2) ─── */}
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
                      <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                      <input
                        placeholder="Search Generic Name, Code or Composition... + Enter"
                        value={drugGroupSearch}
                        onChange={e => {
                          setDrugGroupSearch(e.target.value);
                          setDrugGroupSearchDropdown(true);
                          setDrugGroupSearchHighlight(0);
                        }}
                        onKeyDown={e => {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setDrugGroupSearchHighlight(prev => Math.min(prev + 1, searchDropdownResults.length - 1));
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setDrugGroupSearchHighlight(prev => Math.max(prev - 1, 0));
                          } else if (e.key === "Enter") {
                            e.preventDefault();
                            if (searchDropdownResults.length > 0 && drugGroupSearchDropdown) {
                              handleOpenDrugGroupForm(searchDropdownResults[drugGroupSearchHighlight]);
                              setDrugGroupSearchDropdown(false);
                              setDrugGroupSearch("");
                            } else if (q && filtered.length > 0) {
                              handleOpenDrugGroupForm(filtered[0]);
                              setDrugGroupSearchDropdown(false);
                              setDrugGroupSearch("");
                            } else if (q) {
                              showToast("No drug group found matching: " + drugGroupSearch, "error");
                            }
                          }
                        }}
                        onFocus={() => setDrugGroupSearchDropdown(true)}
                        onBlur={() => setTimeout(() => setDrugGroupSearchDropdown(false), 200)}
                        style={{ ...inp, paddingLeft: "30px", width: "100%", height: "36px" }}
                      />

                      {/* Search Dropdown Popup */}
                      {drugGroupSearchDropdown && searchDropdownResults.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--shadow-lg)", zIndex: 50, marginTop: "4px", overflow: "hidden", maxHeight: "280px", overflowY: "auto" }}>
                          {searchDropdownResults.map((dg, idx) => {
                            const count = (items || []).filter(i => (i.drugGroup || "").toUpperCase() === (dg.name || "").toUpperCase()).length;
                            return (
                              <div
                                key={dg.id}
                                onClick={() => {
                                  handleOpenDrugGroupForm(dg);
                                  setDrugGroupSearchDropdown(false);
                                  setDrugGroupSearch("");
                                }}
                                onMouseEnter={() => setDrugGroupSearchHighlight(idx)}
                                style={{
                                  padding: "8px 12px",
                                  cursor: "pointer",
                                  background: idx === drugGroupSearchHighlight ? "#f1f5f9" : "white",
                                  borderBottom: "1px solid #f1f5f9",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center"
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>
                                    {dg.name} <span style={{ color: "#3b82f6", fontSize: "11px" }}>({dg.code})</span>
                                  </div>
                                  <div style={{ fontSize: "10px", color: "#64748b" }}>
                                    {dg.contents ? dg.contents.substring(0, 50) + "..." : "No composition entered"}
                                  </div>
                                </div>
                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#0f766e", background: "#f0fdf4", padding: "2px 6px", borderRadius: "4px" }}>
                                  {count} Medicines
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", color: "#475569", cursor: "pointer", userSelect: "none" }}>
                      <input
                        type="checkbox"
                        checked={onlyStockFilter}
                        onChange={e => setOnlyStockFilter(e.target.checked)}
                      />
                      Only Stock Products
                    </label>

                    <select
                      value={drugGroupSortBy}
                      onChange={e => setDrugGroupSortBy(e.target.value)}
                      style={{ ...inp, width: "auto", height: "36px" }}
                    >
                      <option value="name">Name A-Z</option>
                      <option value="code">Code A-Z</option>
                      <option value="items_desc">Medicines Count ↓</option>
                      <option value="sr_desc">Sr No ↓</option>
                    </select>
                  </div>
                  </>
                  )}

                  {/* ─── ADD / EDIT DRUG GROUP CARD (Theme: Add Item in Image 2 + Image 5 Screenshot) ─── */}
                  {showDrugGroupForm && (
                    <div style={{ background: "white", borderRadius: "10px", padding: "12px 16px", marginBottom: "8px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", animation: "fadeIn 0.15s ease-out", height: "calc(100vh - 150px)", maxHeight: "calc(100vh - 150px)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                      {/* Form Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "18px" }}>🧪</span>
                          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                            {editingDrugGroup ? `Edit Drug Group: ${editingDrugGroup.name}` : "Add New Drug Group"}
                          </h3>
                          <span style={{ fontSize: "11px", fontWeight: "700", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "4px" }}>
                            Sr. No: {drugGroupForm.srNo || "Auto"}
                          </span>
                        </div>
                        <button
                          onClick={() => { setShowDrugGroupForm(false); setEditingDrugGroup(null); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Main Form Fields Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "140px 180px 1fr 180px", gap: "12px", marginBottom: "14px", alignItems: "flex-end" }}>
                        {/* Sr. No (Pink Accent Box from Legacy Screenshot) */}
                        <div>
                          <label style={lbl}>Sr No. :</label>
                          <input
                            type="number"
                            value={drugGroupForm.srNo || ""}
                            onChange={e => setDrugGroupForm({ ...drugGroupForm, srNo: e.target.value })}
                            placeholder="Auto"
                            style={{ ...inp, background: "#fce7f3", border: "1px solid #f472b6", fontWeight: "800", color: "#831843" }}
                          />
                        </div>

                        {/* Code */}
                        <div>
                          <label style={lbl}>Code :</label>
                          <input
                            value={drugGroupForm.code || ""}
                            onChange={e => setDrugGroupForm({ ...drugGroupForm, code: e.target.value.toUpperCase() })}
                            placeholder="e.g. PARA, AMOX"
                            maxLength={10}
                            style={{ ...inp, textTransform: "uppercase", fontWeight: "800", color: "#1e3a8a" }}
                          />
                        </div>

                        {/* Name */}
                        <div>
                          <label style={lbl}>Generic / Drug Group Name * :</label>
                          <input
                            value={drugGroupForm.name || ""}
                            onChange={e => setDrugGroupForm({ ...drugGroupForm, name: e.target.value.toUpperCase() })}
                            placeholder="e.g. PARACETAMOL 650 MG or AMOXICILLIN + CLAVULANIC ACID"
                            style={{ ...inp, textTransform: "uppercase", fontWeight: "800" }}
                          />
                        </div>

                        {/* Only Stock Product Checkbox */}
                        <div style={{ paddingBottom: "8px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", userSelect: "none", fontWeight: "600", color: "#334155" }}>
                            <input
                              type="checkbox"
                              checked={!!drugGroupForm.onlyStockProduct}
                              onChange={e => setDrugGroupForm({ ...drugGroupForm, onlyStockProduct: e.target.checked })}
                            />
                            Only Stock Product
                          </label>
                        </div>
                      </div>

                      {/* Contents (Active Formulation) */}
                      <div style={{ marginBottom: "12px" }}>
                        <label style={lbl}>Contents : (Active Ingredients & Composition)</label>
                        <textarea
                          value={drugGroupForm.contents || ""}
                          onChange={e => setDrugGroupForm({ ...drugGroupForm, contents: e.target.value })}
                          placeholder="Detailed formulation, therapeutic class, standard strength, e.g. Paracetamol IP 650mg, Analgesic & Antipyretic..."
                          style={{ ...inp, height: "70px", resize: "vertical" }}
                        />
                      </div>

                      {/* Remarks */}
                      <div style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <label style={lbl}>Remarks : (Clinical Guidelines & Precautions)</label>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => {
                                const fn = prompt("Enter reference file path or document link:", drugGroupForm.fileAttachment || "");
                                if (fn !== null) setDrugGroupForm({ ...drugGroupForm, fileAttachment: fn });
                              }}
                              style={{ ...btn("#334155"), padding: "2px 8px", fontSize: "10px" }}
                            >
                              📎 File Attachment
                            </button>
                            {drugGroupForm.fileAttachment && (
                              <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: "600" }}>
                                Attached: {drugGroupForm.fileAttachment}
                              </span>
                            )}
                          </div>
                        </div>
                        <textarea
                          value={drugGroupForm.remarks || ""}
                          onChange={e => setDrugGroupForm({ ...drugGroupForm, remarks: e.target.value })}
                          placeholder="Dosage instructions, contraindications, pregnancy warnings, schedule classification..."
                          style={{ ...inp, height: "65px", resize: "vertical" }}
                        />
                      </div>

                      {/* Live Linked Inventory Medicines (Generic Substitutes) */}
                      {editingDrugGroup && (
                        <div style={{ background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "12px", marginBottom: "16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "800", color: "#1e3a8a" }}>
                              💊 Linked Inventory Medicines (Generic Substitutes):
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                              Total Brands in Stock: {(items || []).filter(i => (i.drugGroup || "").toUpperCase() === (editingDrugGroup.name || "").toUpperCase()).length}
                            </span>
                          </div>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {(() => {
                              const linked = (items || []).filter(i => (i.drugGroup || "").toUpperCase() === (editingDrugGroup.name || "").toUpperCase());
                              if (linked.length === 0) {
                                return <span style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>No branded medicines in inventory mapped to this group yet.</span>;
                              }
                              return linked.map(it => (
                                <div key={it.id} style={{ background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontWeight: "700", color: "#0f172a" }}>{it.name}</span>
                                  <span style={{ color: "#64748b", fontSize: "10px" }}>({it.company || "Generic"})</span>
                                  <span style={{ background: (Number(it.stock) || 0) > 0 ? "#dcfce7" : "#fee2e2", color: (Number(it.stock) || 0) > 0 ? "#166534" : "#991b1b", padding: "1px 5px", borderRadius: "3px", fontSize: "10px", fontWeight: "700" }}>
                                    {it.stock || 0} {it.unit || ""}
                                  </span>
                                  <span style={{ color: "#2563eb", fontWeight: "700", fontSize: "10px" }}>₹{it.price || it.mrp || 0}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* ─── FORM ACTION BUTTONS (Matching Legacy Controls & Image 2 Theme) ─── */}
                      <div style={{ position: "sticky", bottom: 0, background: "#ffffff", zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", paddingTop: "8px", paddingBottom: "8px", borderTop: "2px solid #cbd5e1", boxShadow: "0 -4px 12px rgba(0,0,0,0.08)" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => handleNavigateDrugGroup("prev")}
                            style={{ ...btn("#475569"), padding: "7px 12px", fontSize: "12px" }}
                            title="Previous Group"
                          >
                            <ChevronLeft size={14} /> Prev
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavigateDrugGroup("next")}
                            style={{ ...btn("#475569"), padding: "7px 12px", fontSize: "12px" }}
                            title="Next Group"
                          >
                            Next <ChevronRight size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={handleUpdateGroupItems}
                            style={{ ...btn("#0284c7"), padding: "7px 12px", fontSize: "12px" }}
                            title="Verify and update inventory items with this group"
                          >
                            Update Group
                          </button>

                          {editingDrugGroup && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDrugGroup(editingDrugGroup)}
                              style={{ ...btn("#dc2626"), padding: "7px 12px", fontSize: "12px" }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => { setShowDrugGroupForm(false); setEditingDrugGroup(null); }}
                            style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), padding: "7px 14px", fontSize: "12px" }}
                          >
                            <X size={13} /> Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveDrugGroup}
                            style={{ ...btn("var(--color-primary)"), padding: "7px 18px", fontSize: "12px", fontWeight: "800" }}
                          >
                            <CheckCircle size={14} /> {editingDrugGroup ? "Update Drug Group" : "Save Drug Group"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── DRUG GROUPS DIRECTORY TABLE (Inventory Style / Image 2) ─── */}
                  {!showDrugGroupForm && (
                  <div style={{ background: "white", borderRadius: "12px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>
                        Registered Generic Drug Groups ({filtered.length})
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        Click any generic group to edit composition, substitute brands or therapeutic notes
                      </span>
                    </div>

                    {filtered.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                        <div style={{ fontSize: "40px", opacity: 0.6 }}>🧪</div>
                        <p style={{ marginTop: "12px", fontWeight: "700", fontSize: "15px", color: "#334155" }}>
                          No drug groups found matching your criteria
                        </p>
                        <p style={{ fontSize: "12px", color: "#64748b" }}>
                          Add a new generic formulation or change search keywords.
                        </p>
                        <button
                          onClick={() => handleOpenDrugGroupForm(null)}
                          style={{ ...btn("var(--color-primary)"), margin: "14px auto 0", fontSize: "12px" }}
                        >
                          <Plus size={13} /> Add New Drug Group
                        </button>
                      </div>
                    ) : (
                      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 315px)", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                          <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc" }}>
                            <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                              <th style={{ padding: "10px 8px", textAlign: "center", width: "45px" }}>Sr No</th>
                              <th style={{ padding: "10px 8px", textAlign: "center", width: "65px" }}>Code</th>
                              <th style={{ padding: "10px 12px", textAlign: "left" }}>Generic / Molecule Name</th>
                              <th style={{ padding: "10px 12px", textAlign: "left", width: "220px" }}>Contents & Strength</th>
                              <th style={{ padding: "10px 10px", textAlign: "center", width: "110px" }}>Brands in Stock</th>
                              <th style={{ padding: "10px 12px", textAlign: "left", width: "200px" }}>Remarks / Precautions</th>
                              <th style={{ padding: "10px 12px", textAlign: "center", width: "120px" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((dg, idx) => {
                              const linkedItems = (items || []).filter(i => (i.drugGroup || "").toUpperCase() === (dg.name || "").toUpperCase());
                              const totalStock = linkedItems.reduce((acc, it) => acc + (Number(it.stock) || 0), 0);
                              return (
                                <tr
                                  key={dg.id}
                                  style={{
                                    borderBottom: "1px solid #f1f5f9",
                                    background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                                    transition: "background 0.15s ease"
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f8fafc"}
                                >
                                  <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "700", color: "#64748b" }}>
                                    {dg.srNo || idx + 1}
                                  </td>
                                  <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "800", color: "#2563eb", fontFamily: "monospace" }}>
                                    {dg.code || "DRG"}
                                  </td>
                                  <td
                                    onClick={() => handleOpenDrugGroupForm(dg)}
                                    style={{ padding: "8px 12px", fontWeight: "800", color: "#1e3a8a", cursor: "pointer" }}
                                    title="Click to edit drug group"
                                  >
                                    {dg.name}
                                  </td>
                                  <td style={{ padding: "8px 12px", color: "#475569", fontSize: "11px" }}>
                                    {dg.contents || "-"}
                                  </td>
                                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedGroupForItemsModal(dg)}
                                      style={{
                                        background: linkedItems.length > 0 ? "#dbeafe" : "#f1f5f9",
                                        color: linkedItems.length > 0 ? "#1e40af" : "#64748b",
                                        border: "none",
                                        padding: "3px 8px",
                                        borderRadius: "10px",
                                        fontSize: "11px",
                                        fontWeight: "700",
                                        cursor: linkedItems.length > 0 ? "pointer" : "default"
                                      }}
                                      title="View linked substitute medicines"
                                    >
                                      {linkedItems.length} Brands ({totalStock} Stock)
                                    </button>
                                  </td>
                                  <td style={{ padding: "8px 12px", color: "#64748b", fontSize: "11px" }}>
                                    {dg.remarks || "-"}
                                  </td>
                                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                      <button
                                        onClick={() => handleOpenDrugGroupForm(dg)}
                                        style={{ ...btn("#2563eb"), padding: "4px 8px", fontSize: "11px" }}
                                        title="Edit Drug Group"
                                      >
                                        <Edit2 size={11} /> Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteDrugGroup(dg)}
                                        style={{ ...btn("#dc2626"), padding: "4px 6px", fontSize: "11px" }}
                                        title="Delete Drug Group"
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
                  )}

                  {/* ─── LINKED MEDICINES (GENERIC SUBSTITUTES) MODAL ─── */}
                  {selectedGroupForItemsModal && (
                    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                      <div style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "600px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", overflow: "hidden" }}>
                        <div style={{ padding: "14px 20px", background: "#1e293b", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "700", fontSize: "14px" }}>
                            💊 Generic Substitutes: {selectedGroupForItemsModal.name}
                          </span>
                          <button onClick={() => setSelectedGroupForItemsModal(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
                            <X size={16} />
                          </button>
                        </div>
                        <div style={{ padding: "16px", maxHeight: "400px", overflowY: "auto" }}>
                          {(() => {
                            const matching = (items || []).filter(i => (i.drugGroup || "").toUpperCase() === (selectedGroupForItemsModal.name || "").toUpperCase());
                            if (matching.length === 0) {
                              return <p style={{ textAlign: "center", color: "#64748b", margin: "20px 0" }}>No branded medicines in inventory mapped to this generic group.</p>;
                            }
                            return (
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                                <thead>
                                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                                    <th style={{ padding: "8px", textAlign: "left" }}>Brand / Item Name</th>
                                    <th style={{ padding: "8px", textAlign: "left" }}>Manufacturer</th>
                                    <th style={{ padding: "8px", textAlign: "center" }}>Stock</th>
                                    <th style={{ padding: "8px", textAlign: "right" }}>Price / MRP</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matching.map(it => (
                                    <tr key={it.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                      <td style={{ padding: "8px", fontWeight: "700", color: "#0f172a" }}>{it.name}</td>
                                      <td style={{ padding: "8px", color: "#475569" }}>{it.company || "-"}</td>
                                      <td style={{ padding: "8px", textAlign: "center" }}>
                                        <span style={{ background: (Number(it.stock) || 0) > 0 ? "#dcfce7" : "#fee2e2", color: (Number(it.stock) || 0) > 0 ? "#166534" : "#991b1b", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                                          {it.stock || 0} {it.unit || ""}
                                        </span>
                                      </td>
                                      <td style={{ padding: "8px", textAlign: "right", fontWeight: "700", color: "#2563eb" }}>
                                        ₹{Number(it.price || it.mrp || 0).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            );
                          })()}
                        </div>
                        <div style={{ padding: "12px 20px", background: "#f8fafc", display: "flex", justifyContent: "flex-end" }}>
                          <button onClick={() => setSelectedGroupForItemsModal(null)} style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "12px" }}>
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

{/* ═════════════════════════════════════════════════════════════
                KIT MASTER (Matching Legacy Screenshot & Inventory Light Theme)
            ═════════════════════════════════════════════════════════════ */}
            {ownerSubTab === "kits" && (() => {
              // Calculate Totals
              const totalItemsCount = (kitForm.items || []).length;
              const totalUnitsCount = (kitForm.items || []).reduce((acc, it) => acc + (Number(it.total) || 0), 0);
              const grossAmount = (kitForm.items || []).reduce((acc, it) => acc + ((Number(it.total) || 0) * (Number(it.sRate) || 0)), 0);
              const discountPercent = Number(kitForm.disc) || 0;
              const discountValue = (grossAmount * discountPercent) / 100;
              const netAmount = Math.max(0, grossAmount - discountValue);

              // Filtered kits for List View or Quick Jump
              const qk = (kitSearch || "").trim().toLowerCase();
              const filteredKits = (kits || []).filter(k => {
                if (!qk) return true;
                return (
                  (k.kitName || "").toLowerCase().includes(qk) ||
                  (k.code || "").toLowerCase().includes(qk) ||
                  (k.doctor || "").toLowerCase().includes(qk) ||
                  (k.contact || "").includes(qk) ||
                  (k.remark || "").toLowerCase().includes(qk) ||
                  String(k.srNo || "").includes(qk)
                );
              });

              // Autocomplete for inventory items
              const qItem = (kitItemSearchText || "").trim().toLowerCase();
              const matchingInventoryItems = qItem ? (items || []).filter(i =>
                (i.name || "").toLowerCase().includes(qItem) ||
                (i.barcode || "").includes(qItem) ||
                (i.company || "").toLowerCase().includes(qItem)
              ).slice(0, 8) : [];

              // Handlers
              const handleNewKit = () => {
                const nextSr = kits.length > 0 ? Math.max(...kits.map(k => Number(k.srNo || 0))) + 1 : 1;
                const nextCode = "KIT" + String(nextSr).padStart(3, "0");
                const todayStr = new Date().toLocaleDateString("en-GB");
                setEditingKit(null);
                setKitForm({
                  ...defaultKitForm,
                  id: uid(),
                  srNo: nextSr,
                  code: nextCode,
                  refDate: todayStr,
                  items: []
                });
                setKitSelectedRowIndex(null);
                setKitViewMode("editor");
                showToast("New Kit form ready");
              };

              const handleSaveKit = () => {
                if (!kitForm.kitName || !kitForm.kitName.trim()) {
                  showToast("Kit Name is required!", "error");
                  return;
                }
                if (!kitForm.items || kitForm.items.length === 0) {
                  showToast("Please add at least one medicine to the Kit!", "error");
                  return;
                }

                const kitId = kitForm.id || uid();
                const savedData = {
                  ...kitForm,
                  id: kitId,
                  kitName: kitForm.kitName.trim().toUpperCase(),
                  code: (kitForm.code || "KIT" + String(kitForm.srNo || 1).padStart(3, "0")).trim().toUpperCase(),
                  doctor: (kitForm.doctor || "").trim().toUpperCase(),
                  add1: (kitForm.add1 || "").trim().toUpperCase(),
                  add2: (kitForm.add2 || "").trim().toUpperCase(),
                  remark: (kitForm.remark || "").trim(),
                  disc: Number(kitForm.disc) || 0,
                  remindDays: Number(kitForm.remindDays) || 0,
                  updatedAt: new Date().toISOString()
                };

                const existingIndex = kits.findIndex(k => k.id === kitId);
                let nextKits;
                if (existingIndex >= 0) {
                  nextKits = kits.map(k => k.id === kitId ? savedData : k);
                } else {
                  nextKits = [...kits, savedData];
                }

                setKits(nextKits);
                setKitForm(savedData);
                try {
                  localStorage.setItem("store_kits", JSON.stringify(nextKits));
                } catch (_) {}

                showToast(`Kit "${savedData.kitName}" saved successfully!`);
              };

              const handleDeleteKit = (kitToDelete = kitForm) => {
                if (!kitToDelete || !kitToDelete.id) return;
                showConfirm(`Are you sure you want to delete Kit "${kitToDelete.kitName || kitToDelete.code}"?`, () => {
                  const updated = kits.filter(k => k.id !== kitToDelete.id);
                  setKits(updated);
                  try {
                    localStorage.setItem("store_kits", JSON.stringify(updated));
                  } catch (_) {}
                  showToast("Kit deleted");
                  if (updated.length > 0) {
                    setKitForm({ ...updated[0] });
                  } else {
                    handleNewKit();
                  }
                });
              };

              const handleNavigateKit = (direction) => {
                if (kits.length === 0) return;
                const currentId = kitForm.id;
                const curIdx = kits.findIndex(k => k.id === currentId);
                let targetIdx = 0;
                if (direction === "prev") {
                  targetIdx = curIdx > 0 ? curIdx - 1 : kits.length - 1;
                } else {
                  targetIdx = curIdx < kits.length - 1 ? curIdx + 1 : 0;
                }
                setKitForm({ ...kits[targetIdx] });
                setKitSelectedRowIndex(null);
                setKitViewMode("editor");
              };

              const handleAddMedicineToKit = (inventoryItem) => {
                if (!inventoryItem) return;
                let m = 1, n = 0, e = 1, ni = 0;
                if (kitQuickDosage === "1-0-0") { m = 1; n = 0; e = 0; ni = 0; }
                else if (kitQuickDosage === "1-1-1") { m = 1; n = 1; e = 1; ni = 0; }
                else if (kitQuickDosage === "1-0-1") { m = 1; n = 0; e = 1; ni = 0; }
                else if (kitQuickDosage === "0-0-1") { m = 0; n = 0; e = 0; ni = 1; }
                else if (kitQuickDosage === "0.5-0-0.5") { m = 0.5; n = 0; e = 0.5; ni = 0; }

                const d = Number(kitQuickDays) || 5;
                const totalQty = Math.round((m + n + e + ni) * d);
                const rate = Number(inventoryItem.sRate || inventoryItem.price || inventoryItem.mrp || 0);

                const newItemRow = {
                  id: uid(),
                  itemId: inventoryItem.id,
                  itemName: inventoryItem.name,
                  morning: m,
                  noon: n,
                  evening: e,
                  night: ni,
                  days: d,
                  total: totalQty,
                  sRate: rate,
                  location: inventoryItem.location || ""
                };

                const updatedItems = [...(kitForm.items || []), newItemRow];
                setKitForm({ ...kitForm, items: updatedItems });
                setKitItemSearchText("");
                setKitItemDropdown(false);
                setKitSelectedRowIndex(updatedItems.length - 1);
                showToast(`Added ${inventoryItem.name} to Kit`);
              };

              const handleRemoveSelectedItem = () => {
                if (!kitForm.items || kitForm.items.length === 0) return;
                const idxToRemove = kitSelectedRowIndex !== null ? kitSelectedRowIndex : kitForm.items.length - 1;
                const updatedItems = kitForm.items.filter((_, idx) => idx !== idxToRemove);
                setKitForm({ ...kitForm, items: updatedItems });
                setKitSelectedRowIndex(null);
                showToast("Item removed from Kit");
              };

              const handleUpdateRow = (idx, field, value) => {
                const updatedItems = [...kitForm.items];
                const row = { ...updatedItems[idx], [field]: value };

                // Auto calculate Total when dosage or days change
                if (["morning", "noon", "evening", "night", "days"].includes(field)) {
                  const m = Number(field === "morning" ? value : row.morning) || 0;
                  const n = Number(field === "noon" ? value : row.noon) || 0;
                  const e = Number(field === "evening" ? value : row.evening) || 0;
                  const ni = Number(field === "night" ? value : row.night) || 0;
                  const d = Number(field === "days" ? value : row.days) || 0;
                  row.total = Math.round((m + n + e + ni) * d);
                }

                updatedItems[idx] = row;
                setKitForm({ ...kitForm, items: updatedItems });
              };

              const handlePrintKit = () => {
                const printWindow = window.open("", "_blank");
                if (!printWindow) {
                  showToast("Please allow popups to print Kit prescription", "error");
                  return;
                }

                const itemsHTML = (kitForm.items || []).map((it, idx) => `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px; text-align: center;">${idx + 1}</td>
                    <td style="padding: 8px; font-weight: bold; text-align: left;">${it.itemName}</td>
                    <td style="padding: 8px; text-align: center; color: #1e40af;">${it.morning || 0}</td>
                    <td style="padding: 8px; text-align: center; color: #1e40af;">${it.noon || 0}</td>
                    <td style="padding: 8px; text-align: center; color: #1e40af;">${it.evening || 0}</td>
                    <td style="padding: 8px; text-align: center; color: #1e40af;">${it.night || 0}</td>
                    <td style="padding: 8px; text-align: center; font-weight: 600;">${it.days || 1} Days</td>
                    <td style="padding: 8px; text-align: center; font-weight: bold; background: #f8fafc;">${it.total || 0}</td>
                    <td style="padding: 8px; text-align: right;">₹${Number(it.sRate || 0).toFixed(2)}</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold;">₹${((Number(it.total) || 0) * (Number(it.sRate) || 0)).toFixed(2)}</td>
                    ${kitForm.viewLocation ? `<td style="padding: 8px; text-align: center; font-size: 11px;">${it.location || "-"}</td>` : ""}
                  </tr>
                `).join("");

                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Kit Prescription - ${kitForm.kitName || "SHIV DHARA"}</title>
                    <style>
                      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 25px; color: #0f172a; }
                      .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
                      .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 12px; margin-bottom: 18px; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
                      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
                      th { background: #0f172a; color: white; padding: 8px; font-size: 11px; text-transform: uppercase; }
                      .totals-box { width: 280px; margin-left: auto; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #f8fafc; }
                      .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
                      @media print { body { padding: 0; } button { display: none; } }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <h2 style="margin: 0; font-size: 20px; color: #0f172a;">SHIV DHARA MEDICAL STORE</h2>
                      <p style="margin: 2px 0; font-size: 12px; color: #475569;">Complete Healthcare & Pharmacy Solutions | GST Registered</p>
                      <p style="margin: 0; font-size: 11px; font-weight: 700; color: #2563eb;">PRESCRIPTION & TREATMENT KIT DOSAGE REGISTER</p>
                    </div>

                    <div class="meta-grid">
                      <div><strong>Kit Code:</strong> ${kitForm.code || "-"} | <strong>Sr No:</strong> ${kitForm.srNo || "1"}</div>
                      <div><strong>Ref Date:</strong> ${kitForm.refDate || "-"}</div>
                      <div><strong>Kit Name:</strong> ${kitForm.kitName || "-"}</div>
                      <div><strong>Consulting Doctor:</strong> ${kitForm.doctor || "N/A"}</div>
                      <div><strong>Patient / Contact:</strong> ${kitForm.contact || "N/A"}</div>
                      <div><strong>Reminder Follow-up:</strong> ${kitForm.remindDays ? `After ${kitForm.remindDays} Days` : "Not Set"}</div>
                      ${kitForm.add1 ? `<div style="grid-column: span 2;"><strong>Address:</strong> ${kitForm.add1} ${kitForm.add2 || ""}</div>` : ""}
                      ${kitForm.remark ? `<div style="grid-column: span 2; color: #b45309;"><strong>Special Instructions:</strong> ${kitForm.remark}</div>` : ""}
                    </div>

                    <table>
                      <thead>
                        <tr>
                          <th style="width: 30px;">#</th>
                          <th>Medicine / Item Name</th>
                          <th>Morning</th>
                          <th>Noon</th>
                          <th>Evening</th>
                          <th>Night</th>
                          <th>Days</th>
                          <th>Total Qty</th>
                          <th>S.Rate</th>
                          <th>Amount</th>
                          ${kitForm.viewLocation ? `<th>Location</th>` : ""}
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHTML}
                      </tbody>
                    </table>

                    <div class="totals-box">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Total Items:</span>
                        <strong>${totalItemsCount} Medicines</strong>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Total Course Qty:</span>
                        <strong>${totalUnitsCount} Units</strong>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Gross Amount:</span>
                        <span>₹${grossAmount.toFixed(2)}</span>
                      </div>
                      ${discountPercent > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #16a34a;">
                          <span>Kit Discount (${discountPercent}%):</span>
                          <span>-₹${discountValue.toFixed(2)}</span>
                        </div>
                      ` : ""}
                      <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; border-top: 1px solid #cbd5e1; padding-top: 6px; color: #0f172a;">
                        <span>Net Kit Amount:</span>
                        <span>₹${netAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div class="footer">
                      <div>
                        <p style="margin: 0;">* Take medicines strictly as directed by the registered medical practitioner.</p>
                        <p style="margin: 2px 0;">Generated on ${new Date().toLocaleString()}</p>
                      </div>
                      <div style="text-align: right;">
                        <div style="height: 35px;"></div>
                        <p style="margin: 0; font-weight: bold; border-top: 1px solid #64748b; padding-top: 4px;">Authorized Pharmacist Signature</p>
                      </div>
                    </div>
                  </body>
                  </html>
                `);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 300);
              };

              const handleBillKitInSales = () => {
                if (!kitForm.items || kitForm.items.length === 0) {
                  showToast("Kit has no items to bill", "error");
                  return;
                }

                // Transfer items to POS salesItems
                const mappedSalesItems = kitForm.items.map(ki => {
                  const invMatch = (items || []).find(i => String(i.id) === String(ki.itemId) || i.name.toUpperCase() === ki.itemName.toUpperCase()) || {};
                  return {
                    id: uid(),
                    itemId: invMatch.id || ki.itemId || uid(),
                    name: ki.itemName,
                    batch: invMatch.batchNumber || "STANDARD",
                    expiry: invMatch.expiryDate || "",
                    qty: Number(ki.total) || 1,
                    mrp: Number(ki.sRate || invMatch.mrp || invMatch.price || 0),
                    rate: Number(ki.sRate || invMatch.price || invMatch.mrp || 0),
                    unit: invMatch.unit || "TAB",
                    gst: Number(invMatch.gst) || 5,
                    discount: Number(kitForm.disc) || 0,
                    amount: ((Number(ki.total) || 1) * Number(ki.sRate || invMatch.price || invMatch.mrp || 0)),
                    availableStock: Number(invMatch.stock) || 100
                  };
                });

                if (setSalesItems) setSalesItems(mappedSalesItems);
                if (setSalesForm) {
                  setSalesForm(prev => ({
                    ...prev,
                    customerName: kitForm.contact ? `Kit: ${kitForm.kitName} (${kitForm.contact})` : `Kit: ${kitForm.kitName}`,
                    doctorName: kitForm.doctor || prev.doctorName || "",
                    remarks: `Dispensed from Kit: ${kitForm.code} - ${kitForm.kitName}. ${kitForm.remark || ""}`
                  }));
                }
                setActiveSection("sales_pos");
                showToast(`Transferred ${mappedSalesItems.length} Kit medicines into Sales POS!`);
              };

              return (
                <div style={{ animation: "fadeIn 0.2s ease-in-out" }}>
                  {/* ─── HEADER ROW (Inventory Style / Image 2) ─── */}
                  {kitViewMode === "list" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "26px" }}>🧰</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Kit Master</h2>
                      <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Prescription Treatment Kits, Disease Combos & Multi-Dose Schedules</p>
                    </div>

                    <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setKitViewMode(kitViewMode === "editor" ? "list" : "editor")}
                        style={{ ...btn("#334155"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <FileText size={13} /> {kitViewMode === "editor" ? "View Kit Directory (List)" : "Back to Kit Editor"}
                      </button>
                      <button
                        type="button"
                        onClick={handleNewKit}
                        style={{ ...btn("var(--color-primary)"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <Plus size={13} /> New Kit
                      </button>
                    </div>
                  </div>
                  )}

                  {/* ═══════════════════════════════════════════════════════════
                      VIEW MODE 1: KIT DIRECTORY LIST VIEW
                  ═══════════════════════════════════════════════════════════ */}
                  {kitViewMode === "list" && (
                    <div style={{ animation: "fadeIn 0.15s ease-out" }}>
                      {/* Search Bar */}
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", display: "flex", gap: "10px", alignItems: "center" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                          <input
                            placeholder="Search Kit Name, Code, Doctor or Patient Contact... + Enter"
                            value={kitSearch}
                            onChange={e => setKitSearch(e.target.value)}
                            style={{ ...inp, paddingLeft: "30px", width: "100%", height: "36px" }}
                          />
                        </div>
                        {kitSearch && (
                          <button onClick={() => setKitSearch("")} style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "11px" }}>Clear</button>
                        )}
                      </div>

                      {/* Stat Cards */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Total Kits</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{kits.length}</div>
                        </div>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Total Medicines Mapped</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>
                            {kits.reduce((acc, k) => acc + (k.items || []).length, 0)} Items
                          </div>
                        </div>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Follow-up Reminders</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#16a34a", marginTop: "4px" }}>
                            {kits.filter(k => (Number(k.remindDays) || 0) > 0).length} Kits
                          </div>
                        </div>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Active Doctors Linked</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#7c3aed", marginTop: "4px" }}>
                            {[...new Set(kits.map(k => k.doctor).filter(Boolean))].length} Doctors
                          </div>
                        </div>
                      </div>

                      {/* Kits Directory Table */}
                      <div style={{ background: "white", borderRadius: "12px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                          <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>
                            Kit Master Directory ({filteredKits.length})
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            Click any Kit to open editor, dosage schedule or bill directly
                          </span>
                        </div>

                        {filteredKits.length === 0 ? (
                          <div style={{ padding: "50px 20px", textAlign: "center", color: "#64748b" }}>
                            <div style={{ fontSize: "36px", opacity: 0.5, marginBottom: "8px" }}>🧰</div>
                            <p style={{ margin: 0, fontWeight: "700", fontSize: "14px" }}>No treatment kits found</p>
                            <p style={{ margin: "4px 0 12px", fontSize: "12px" }}>Create your first prescription treatment kit using the button below.</p>
                            <button onClick={handleNewKit} style={{ ...btn("var(--color-primary)"), margin: "0 auto", fontSize: "12px" }}>
                              <Plus size={13} /> Create First Kit
                            </button>
                          </div>
                        ) : (
                          <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 315px)", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                              <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc" }}>
                                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "11px", textTransform: "uppercase" }}>
                                  <th style={{ padding: "10px 8px", width: "40px", textAlign: "center" }}>Sr.</th>
                                  <th style={{ padding: "10px 8px", width: "80px", textAlign: "center" }}>Code</th>
                                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Kit Name</th>
                                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Doctor</th>
                                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Contact / Address</th>
                                  <th style={{ padding: "10px 8px", width: "90px", textAlign: "center" }}>Medicines</th>
                                  <th style={{ padding: "10px 8px", width: "80px", textAlign: "center" }}>Remind</th>
                                  <th style={{ padding: "10px 12px", width: "100px", textAlign: "right" }}>Kit Value</th>
                                  <th style={{ padding: "10px 12px", width: "180px", textAlign: "center" }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredKits.map((k, idx) => {
                                  const kitGross = (k.items || []).reduce((acc, it) => acc + ((Number(it.total) || 0) * (Number(it.sRate) || 0)), 0);
                                  const kitDisc = (kitGross * (Number(k.disc) || 0)) / 100;
                                  const kitNet = Math.max(0, kitGross - kitDisc);

                                  return (
                                    <tr
                                      key={k.id || idx}
                                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.1s" }}
                                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                      <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "700", color: "#64748b" }}>{k.srNo || idx + 1}</td>
                                      <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "800", color: "#2563eb", fontFamily: "monospace" }}>{k.code || "KIT"}</td>
                                      <td
                                        onClick={() => { setKitForm({ ...k }); setKitViewMode("editor"); }}
                                        style={{ padding: "8px 14px", fontWeight: "800", color: "#1e3a8a", cursor: "pointer" }}
                                        title="Click to edit kit"
                                      >
                                        {k.kitName}
                                      </td>
                                      <td style={{ padding: "8px 12px", color: "#475569" }}>{k.doctor || "-"}</td>
                                      <td style={{ padding: "8px 12px", color: "#64748b", fontSize: "11px" }}>
                                        {k.contact ? <span>📞 {k.contact}</span> : null}
                                        {k.add1 ? <div style={{ color: "#94a3b8" }}>{k.add1}</div> : null}
                                      </td>
                                      <td style={{ padding: "8px 8px", textAlign: "center" }}>
                                        <span style={{ background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                                          {(k.items || []).length} items
                                        </span>
                                      </td>
                                      <td style={{ padding: "8px 8px", textAlign: "center", fontSize: "11px", color: (Number(k.remindDays) || 0) > 0 ? "#16a34a" : "#94a3b8", fontWeight: "700" }}>
                                        {(Number(k.remindDays) || 0) > 0 ? `${k.remindDays} Days` : "-"}
                                      </td>
                                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "800", color: "#0f172a" }}>
                                        ₹{kitNet.toFixed(2)}
                                      </td>
                                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                          <button
                                            type="button"
                                            onClick={() => { setKitForm({ ...k }); setKitViewMode("editor"); }}
                                            style={{ ...btn("#2563eb"), padding: "4px 8px", fontSize: "11px" }}
                                            title="Edit Kit"
                                          >
                                            <Edit2 size={11} /> Edit
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => { setKitForm({ ...k }); setTimeout(handlePrintKit, 100); }}
                                            style={{ ...btn("#334155"), padding: "4px 8px", fontSize: "11px" }}
                                            title="Print Kit Prescription"
                                          >
                                            <Printer size={11} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => { setKitForm({ ...k }); setTimeout(handleBillKitInSales, 100); }}
                                            style={{ ...btn("#16a34a"), padding: "4px 8px", fontSize: "11px" }}
                                            title="Bill in Sales POS"
                                          >
                                            <ShoppingCart size={11} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteKit(k)}
                                            style={{ ...btn("#dc2626"), padding: "4px 8px", fontSize: "11px" }}
                                            title="Delete Kit"
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
                    </div>
                  )}

                  {/* ═══════════════════════════════════════════════════════════
                      VIEW MODE 2: MAIN KIT MASTER FORM & ITEM GRID (Image 1)
                  ═══════════════════════════════════════════════════════════ */}
                  {kitViewMode === "editor" && (
                    <div style={{ background: "white", borderRadius: "10px", padding: "12px 16px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", animation: "fadeIn 0.15s ease-out", height: "calc(100vh - 150px)", maxHeight: "calc(100vh - 150px)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                      
                      {/* Top Bar with Kit Title & Navigation */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "18px" }}>📦</span>
                          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                            {kitForm.kitName ? kitForm.kitName : "New Kit Specification"}
                          </h3>
                          <span style={{ fontSize: "11px", fontWeight: "700", background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "4px", fontFamily: "monospace" }}>
                            Code: {kitForm.code || "KIT001"}
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: "700", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "4px" }}>
                            Sr.No: {kitForm.srNo || 1}
                          </span>
                        </div>

                        {/* Search to Jump */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <div style={{ position: "relative", width: "200px" }}>
                            <Search size={12} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                            <input
                              placeholder="Jump to Kit..."
                              value={kitSearch}
                              onChange={e => setKitSearch(e.target.value)}
                              style={{ ...inp, paddingLeft: "26px", height: "30px", fontSize: "11px" }}
                            />
                            {kitSearch && filteredKits.length > 0 && (
                              <div style={{ position: "absolute", top: "100%", right: 0, width: "240px", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 60, marginTop: "2px", overflow: "hidden" }}>
                                {filteredKits.slice(0, 6).map(k => (
                                  <div
                                    key={k.id}
                                    onClick={() => { setKitForm({ ...k }); setKitSearch(""); }}
                                    style={{ padding: "6px 10px", fontSize: "11px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                                  >
                                    <div style={{ fontWeight: "700", color: "#1e293b" }}>{k.kitName}</div>
                                    <div style={{ fontSize: "10px", color: "#64748b" }}>Code: {k.code} | {k.doctor || "General"}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ─── HEADER FIELDS GRID (Matching Image 1 Exact Fields) ─── */}
                      <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "80px 110px 130px 1fr", gap: "10px", marginBottom: "10px" }}>
                          {/* Row 1: Sr.No | Code | Ref Date | Doctor */}
                          <div>
                            <label style={lbl}>Sr.No.</label>
                            <input
                              type="number"
                              value={kitForm.srNo || 1}
                              onChange={e => setKitForm({ ...kitForm, srNo: Number(e.target.value) || 1 })}
                              style={{ ...inp, background: "#ffffff", fontWeight: "700" }}
                            />
                          </div>
                          <div>
                            <label style={lbl}>Code</label>
                            <input
                              type="text"
                              value={kitForm.code || ""}
                              onChange={e => setKitForm({ ...kitForm, code: e.target.value.toUpperCase() })}
                              style={{ ...inp, background: "#ffffff", textTransform: "uppercase", fontWeight: "700", color: "#1e40af" }}
                            />
                          </div>
                          <div>
                            <label style={lbl}>Ref Date</label>
                            <input
                              type="text"
                              value={kitForm.refDate || ""}
                              onChange={e => setKitForm({ ...kitForm, refDate: e.target.value })}
                              placeholder="DD/MM/YYYY"
                              style={{ ...inp, background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={lbl}>Doctor</label>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <input
                                type="text"
                                list="doctor-suggestions"
                                value={kitForm.doctor || ""}
                                onChange={e => setKitForm({ ...kitForm, doctor: e.target.value.toUpperCase() })}
                                placeholder="Consulting Doctor Name / Hospital"
                                style={{ ...inp, background: "#ffffff", textTransform: "uppercase", flex: 1 }}
                              />
                              <datalist id="doctor-suggestions">
                                {(doctors || []).map(d => (
                                  <option key={d.id} value={d.name}>{d.specialization ? `${d.name} (${d.specialization})` : d.name}</option>
                                ))}
                              </datalist>
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Kit Name | Remind After Days */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: "10px", marginBottom: "10px" }}>
                          <div>
                            <label style={lbl}>Kit Name *</label>
                            <input
                              type="text"
                              value={kitForm.kitName || ""}
                              onChange={e => setKitForm({ ...kitForm, kitName: e.target.value.toUpperCase() })}
                              placeholder="e.g. FEVER & COLD 5-DAY TREATMENT KIT"
                              style={{ ...inp, background: "#ffffff", fontWeight: "700", textTransform: "uppercase" }}
                            />
                          </div>
                          <div>
                            <label style={lbl}>Remind After Days</label>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <input
                                type="number"
                                min="0"
                                value={kitForm.remindDays ?? 0}
                                onChange={e => setKitForm({ ...kitForm, remindDays: Number(e.target.value) || 0 })}
                                style={{ ...inp, background: "#ffffff", textAlign: "center", fontWeight: "700" }}
                              />
                              <span style={{ fontSize: "11px", color: "#64748b", whiteSpace: "nowrap" }}>Days</span>
                            </div>
                          </div>
                        </div>

                        {/* Row 3: Add 1 | Remark | View Location Checkbox */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 130px", gap: "10px", marginBottom: "10px" }}>
                          <div>
                            <label style={lbl}>Address Line 1</label>
                            <input
                              type="text"
                              value={kitForm.add1 || ""}
                              onChange={e => setKitForm({ ...kitForm, add1: e.target.value.toUpperCase() })}
                              placeholder="Patient Address Line 1"
                              style={{ ...inp, background: "#ffffff", textTransform: "uppercase" }}
                            />
                          </div>
                          <div>
                            <label style={lbl}>Remark / Doctor Instructions</label>
                            <input
                              type="text"
                              value={kitForm.remark || ""}
                              onChange={e => setKitForm({ ...kitForm, remark: e.target.value })}
                              placeholder="Instructions (e.g. after food, avoid cold water)"
                              style={{ ...inp, background: "#ffffff" }}
                            />
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "8px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", userSelect: "none" }}>
                              <input
                                type="checkbox"
                                checked={!!kitForm.viewLocation}
                                onChange={e => setKitForm({ ...kitForm, viewLocation: e.target.checked })}
                              />
                              <span style={{ fontWeight: "700", color: "#334155" }}>View Location</span>
                            </label>
                          </div>
                        </div>

                        {/* Row 4: Add 2 | Contact | Disc % */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 130px", gap: "10px" }}>
                          <div>
                            <label style={lbl}>Address Line 2</label>
                            <input
                              type="text"
                              value={kitForm.add2 || ""}
                              onChange={e => setKitForm({ ...kitForm, add2: e.target.value.toUpperCase() })}
                              placeholder="Patient City / Area"
                              style={{ ...inp, background: "#ffffff", textTransform: "uppercase" }}
                            />
                          </div>
                          <div>
                            <label style={lbl}>Contact No.</label>
                            <input
                              type="text"
                              value={kitForm.contact || ""}
                              onChange={e => setKitForm({ ...kitForm, contact: e.target.value })}
                              placeholder="Mobile No."
                              style={{ ...inp, background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={lbl}>Discount %</label>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={kitForm.disc ?? 0}
                                onChange={e => setKitForm({ ...kitForm, disc: Number(e.target.value) || 0 })}
                                style={{ ...inp, background: "#ffffff", textAlign: "center", fontWeight: "700" }}
                              />
                              <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ─── ADD MEDICINE QUICK BAR ─── */}
                      <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ position: "relative", flex: "1 1 260px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>
                            Search Medicine to Add:
                          </span>
                          <div style={{ position: "relative" }}>
                            <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                            <input
                              placeholder="Type Medicine Name or Barcode..."
                              value={kitItemSearchText}
                              onChange={e => {
                                setKitItemSearchText(e.target.value);
                                setKitItemDropdown(true);
                              }}
                              onFocus={() => setKitItemDropdown(true)}
                              style={{ ...inp, paddingLeft: "30px", height: "34px", width: "100%" }}
                            />
                          </div>

                          {/* Inventory Item Autocomplete Dropdown */}
                          {kitItemDropdown && matchingInventoryItems.length > 0 && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", zIndex: 70, marginTop: "4px", overflow: "hidden", maxHeight: "250px", overflowY: "auto" }}>
                              {matchingInventoryItems.map(invItem => (
                                <div
                                  key={invItem.id}
                                  onClick={() => handleAddMedicineToKit(invItem)}
                                  style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                  onMouseLeave={e => e.currentTarget.style.background = "white"}
                                >
                                  <div>
                                    <div style={{ fontWeight: "700", fontSize: "12px", color: "#1e293b" }}>{invItem.name}</div>
                                    <div style={{ fontSize: "10px", color: "#64748b" }}>
                                      {invItem.company || "General"} | Stock: {invItem.stock || 0} {invItem.unit || ""} {invItem.location ? `| Loc: ${invItem.location}` : ""}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ fontWeight: "800", color: "#2563eb", fontSize: "12px" }}>₹{Number(invItem.price || invItem.mrp || 0).toFixed(2)}</div>
                                    <span style={{ fontSize: "9px", background: "#dcfce7", color: "#166534", padding: "1px 5px", borderRadius: "3px", fontWeight: "700" }}>+ Add to Kit</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Quick Dosage Preset */}
                        <div style={{ width: "110px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Schedule:</span>
                          <select
                            value={kitQuickDosage}
                            onChange={e => setKitQuickDosage(e.target.value)}
                            style={{ ...inp, height: "34px", padding: "4px 8px" }}
                          >
                            <option value="1-0-1">1-0-1 (BD)</option>
                            <option value="1-1-1">1-1-1 (TDS)</option>
                            <option value="1-0-0">1-0-0 (OD Morn)</option>
                            <option value="0-0-1">0-0-1 (OD Night)</option>
                            <option value="0.5-0-0.5">0.5-0-0.5 (Half)</option>
                          </select>
                        </div>

                        {/* Quick Days */}
                        <div style={{ width: "80px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Days:</span>
                          <input
                            type="number"
                            min="1"
                            value={kitQuickDays}
                            onChange={e => setKitQuickDays(Number(e.target.value) || 1)}
                            style={{ ...inp, height: "34px", textAlign: "center", fontWeight: "700" }}
                          />
                        </div>

                        {/* Direct Add Blank Row Button */}
                        <div style={{ alignSelf: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => {
                              const newEmptyRow = {
                                id: uid(),
                                itemId: "",
                                itemName: "NEW MEDICINE",
                                morning: 1,
                                noon: 0,
                                evening: 1,
                                night: 0,
                                days: 5,
                                total: 10,
                                sRate: 10,
                                location: ""
                              };
                              setKitForm({ ...kitForm, items: [...(kitForm.items || []), newEmptyRow] });
                              setKitSelectedRowIndex((kitForm.items || []).length);
                            }}
                            style={{ ...btn("#0284c7"), height: "34px", padding: "0 12px", fontSize: "11px", fontWeight: "700" }}
                          >
                            <Plus size={12} /> Add Blank Row
                          </button>
                        </div>
                      </div>

                      {/* ─── MEDICINE ITEMS GRID (Matching Legacy Columns Exactly) ─── */}
                      <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden", marginBottom: "14px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                          <thead>
                            <tr style={{ background: "#0f172a", color: "#ffffff", fontSize: "11px", textTransform: "uppercase" }}>
                              <th style={{ padding: "8px 6px", width: "30px", textAlign: "center" }}>#</th>
                              <th style={{ padding: "8px 10px", textAlign: "left" }}>Item Name</th>
                              <th style={{ padding: "8px 4px", width: "65px", textAlign: "center" }}>Morning</th>
                              <th style={{ padding: "8px 4px", width: "65px", textAlign: "center" }}>Noon</th>
                              <th style={{ padding: "8px 4px", width: "65px", textAlign: "center" }}>Evening</th>
                              <th style={{ padding: "8px 4px", width: "65px", textAlign: "center" }}>Night</th>
                              <th style={{ padding: "8px 6px", width: "65px", textAlign: "center" }}>Days</th>
                              <th style={{ padding: "8px 6px", width: "70px", textAlign: "center" }}>Total</th>
                              <th style={{ padding: "8px 6px", width: "80px", textAlign: "right" }}>Srate</th>
                              <th style={{ padding: "8px 8px", width: "90px", textAlign: "right" }}>Amount</th>
                              {kitForm.viewLocation && (
                                <th style={{ padding: "8px 6px", width: "85px", textAlign: "center" }}>Location</th>
                              )}
                              <th style={{ padding: "8px 6px", width: "40px", textAlign: "center" }}>Del</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(!kitForm.items || kitForm.items.length === 0) ? (
                              <tr>
                                <td colSpan={kitForm.viewLocation ? 12 : 11} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                                  No medicines added to this Kit yet. Use the search bar above to add medicines.
                                </td>
                              </tr>
                            ) : (
                              kitForm.items.map((it, idx) => {
                                const rowSelected = kitSelectedRowIndex === idx;
                                const rowAmount = (Number(it.total) || 0) * (Number(it.sRate) || 0);

                                return (
                                  <tr
                                    key={it.id || idx}
                                    onClick={() => setKitSelectedRowIndex(idx)}
                                    style={{
                                      background: rowSelected ? "#eff6ff" : (idx % 2 === 0 ? "#ffffff" : "#f8fafc"),
                                      borderBottom: "1px solid #e2e8f0",
                                      cursor: "pointer"
                                    }}
                                  >
                                    <td style={{ padding: "6px", textAlign: "center", fontWeight: "700", color: "#64748b" }}>
                                      {idx + 1}
                                    </td>
                                    <td style={{ padding: "4px 8px" }}>
                                      <input
                                        type="text"
                                        value={it.itemName || ""}
                                        onChange={e => handleUpdateRow(idx, "itemName", e.target.value.toUpperCase())}
                                        style={{ ...inp, padding: "4px 6px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", width: "100%" }}
                                      />
                                    </td>
                                    <td style={{ padding: "4px 4px", textAlign: "center" }}>
                                      <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={it.morning ?? 0}
                                        onChange={e => handleUpdateRow(idx, "morning", Number(e.target.value) || 0)}
                                        style={{ ...inp, padding: "4px 2px", fontSize: "12px", textAlign: "center", width: "100%", color: "#1e40af", fontWeight: "700" }}
                                      />
                                    </td>
                                    <td style={{ padding: "4px 4px", textAlign: "center" }}>
                                      <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={it.noon ?? 0}
                                        onChange={e => handleUpdateRow(idx, "noon", Number(e.target.value) || 0)}
                                        style={{ ...inp, padding: "4px 2px", fontSize: "12px", textAlign: "center", width: "100%", color: "#1e40af", fontWeight: "700" }}
                                      />
                                    </td>
                                    <td style={{ padding: "4px 4px", textAlign: "center" }}>
                                      <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={it.evening ?? 0}
                                        onChange={e => handleUpdateRow(idx, "evening", Number(e.target.value) || 0)}
                                        style={{ ...inp, padding: "4px 2px", fontSize: "12px", textAlign: "center", width: "100%", color: "#1e40af", fontWeight: "700" }}
                                      />
                                    </td>
                                    <td style={{ padding: "4px 4px", textAlign: "center" }}>
                                      <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={it.night ?? 0}
                                        onChange={e => handleUpdateRow(idx, "night", Number(e.target.value) || 0)}
                                        style={{ ...inp, padding: "4px 2px", fontSize: "12px", textAlign: "center", width: "100%", color: "#1e40af", fontWeight: "700" }}
                                      />
                                    </td>
                                    <td style={{ padding: "4px 4px", textAlign: "center" }}>
                                      <input
                                        type="number"
                                        min="1"
                                        value={it.days ?? 1}
                                        onChange={e => handleUpdateRow(idx, "days", Number(e.target.value) || 1)}
                                        style={{ ...inp, padding: "4px 2px", fontSize: "12px", textAlign: "center", width: "100%", fontWeight: "600" }}
                                      />
                                    </td>
                                    <td style={{ padding: "4px 4px", textAlign: "center" }}>
                                      <input
                                        type="number"
                                        value={it.total ?? 0}
                                        onChange={e => handleUpdateRow(idx, "total", Number(e.target.value) || 0)}
                                        style={{ ...inp, padding: "4px 2px", fontSize: "12px", textAlign: "center", width: "100%", fontWeight: "800", background: "#f1f5f9" }}
                                      />
                                    </td>
                                    <td style={{ padding: "4px 4px", textAlign: "right" }}>
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={it.sRate ?? 0}
                                        onChange={e => handleUpdateRow(idx, "sRate", Number(e.target.value) || 0)}
                                        style={{ ...inp, padding: "4px 4px", fontSize: "12px", textAlign: "right", width: "100%", fontWeight: "600" }}
                                      />
                                    </td>
                                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "800", color: "#0f172a" }}>
                                      ₹{rowAmount.toFixed(2)}
                                    </td>
                                    {kitForm.viewLocation && (
                                      <td style={{ padding: "4px 4px", textAlign: "center" }}>
                                        <input
                                          type="text"
                                          value={it.location || ""}
                                          onChange={e => handleUpdateRow(idx, "location", e.target.value.toUpperCase())}
                                          placeholder="Rack"
                                          style={{ ...inp, padding: "4px 4px", fontSize: "11px", textAlign: "center", width: "100%", textTransform: "uppercase" }}
                                        />
                                      </td>
                                    )}
                                    <td style={{ padding: "4px 6px", textAlign: "center" }}>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const updated = kitForm.items.filter((_, i) => i !== idx);
                                          setKitForm({ ...kitForm, items: updated });
                                          setKitSelectedRowIndex(null);
                                        }}
                                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", padding: "2px" }}
                                        title="Delete Row"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* ─── SUMMARY TOTALS BAR ─── */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
                        <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#475569" }}>
                          <span>Medicines: <strong style={{ color: "#0f172a" }}>{totalItemsCount}</strong></span>
                          <span>Total Units: <strong style={{ color: "#2563eb" }}>{totalUnitsCount}</strong></span>
                          <span>Gross: <strong style={{ color: "#0f172a" }}>₹{grossAmount.toFixed(2)}</strong></span>
                          {discountPercent > 0 && (
                            <span style={{ color: "#16a34a" }}>
                              Disc ({discountPercent}%): <strong>-₹{discountValue.toFixed(2)}</strong>
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>Net Kit Amount:</span>
                          <span style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a" }}>₹{netAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* ─── EXACT LEGACY BOTTOM ACTION TOOLBAR ─── */}
                      <div style={{ position: "sticky", bottom: 0, background: "#ffffff", zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", paddingTop: "12px", paddingBottom: "12px", borderTop: "2px solid #cbd5e1", boxShadow: "0 -4px 16px rgba(0,0,0,0.12)" }}>
                        {/* Left Group: New, Save, Print, Remove Item, Delete, List */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={handleNewKit}
                            style={{ ...btn("#475569"), fontSize: "12px", padding: "7px 12px", fontWeight: "700" }}
                            title="New Blank Kit"
                          >
                            New
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveKit}
                            style={{ ...btn("var(--color-primary)"), fontSize: "12px", padding: "7px 14px", fontWeight: "800" }}
                            title="Save Kit"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={handlePrintKit}
                            style={{ ...btn("#334155"), fontSize: "12px", padding: "7px 12px" }}
                            title="Print Prescription & Dosage Chart"
                          >
                            Print
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveSelectedItem}
                            disabled={!kitForm.items || kitForm.items.length === 0}
                            style={{ ...btn("#64748b"), fontSize: "12px", padding: "7px 12px", opacity: (!kitForm.items || kitForm.items.length === 0) ? 0.6 : 1 }}
                            title="Remove selected row"
                          >
                            Remove Item
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteKit(kitForm)}
                            style={{ ...btn("#dc2626"), fontSize: "12px", padding: "7px 12px" }}
                            title="Delete this Kit"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setKitViewMode("list")}
                            style={{ ...btn("#0284c7"), fontSize: "12px", padding: "7px 12px", fontWeight: "700" }}
                            title="View all kits in directory"
                          >
                            List
                          </button>
                        </div>

                        {/* Right Group: <, >, Search, Bill Kit, Close */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => handleNavigateKit("prev")}
                            style={{ ...btn("#475569"), fontSize: "12px", padding: "7px 10px" }}
                            title="Previous Kit"
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavigateKit("next")}
                            style={{ ...btn("#475569"), fontSize: "12px", padding: "7px 10px" }}
                            title="Next Kit"
                          >
                            <ChevronRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setKitViewMode("list")}
                            style={{ ...btn("#475569"), fontSize: "12px", padding: "7px 12px" }}
                            title="Search directory"
                          >
                            Search
                          </button>
                          <button
                            type="button"
                            onClick={handleBillKitInSales}
                            style={{ ...btn("#16a34a"), fontSize: "12px", padding: "7px 14px", fontWeight: "800" }}
                            title="Bill all kit medicines in Sales POS"
                          >
                            ⚡ Bill This Kit
                          </button>
                          <button
                            type="button"
                            onClick={() => setOwnerSubTab("accounts")}
                            style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "12px", padding: "7px 14px" }}
                            title="Close Kit Master"
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

            {/* ═════════════════════════════════════════════════════════════
                DOCTOR MASTER (Matching Legacy Screenshot & Inventory Light Theme)
            ═════════════════════════════════════════════════════════════ */}
            {ownerSubTab === "doctors" && (() => {
              // Ensure doctors have consistent data
              const allDoctors = (doctors || []).map((d, idx) => ({
                ...defaultFullDoctorForm,
                ...d,
                srNo: d.srNo || idx + 1,
                code: d.code || ("DOC" + String(idx + 1).padStart(3, "0")),
                regNo: d.regNo || "",
                degree: d.degree || d.speciality || d.specialization || "",
                remarks: d.remarks || d.note || "",
                salesPercent: d.salesPercent ?? 10,
                returnPercent: d.returnPercent ?? 10,
                city: d.city || "SURAT",
                linkedItems: d.linkedItems || []
              }));

              // Filtering for directory list
              const qd = (docSearch || "").trim().toLowerCase();
              const filteredDoctors = allDoctors.filter(d => {
                if (docFilterPermanent && !d.isPermanent) return false;
                if (!qd) return true;
                return (
                  (d.name || "").toLowerCase().includes(qd) ||
                  (d.code || "").toLowerCase().includes(qd) ||
                  (d.regNo || "").toLowerCase().includes(qd) ||
                  (d.degree || "").toLowerCase().includes(qd) ||
                  (d.area || "").toLowerCase().includes(qd) ||
                  (d.city || "").toLowerCase().includes(qd) ||
                  (d.mobile || "").includes(qd) ||
                  (d.contact || "").includes(qd) ||
                  String(d.srNo || "").includes(qd)
                );
              });

              // Inventory matches for Item Link Modal
              const qLink = (itemLinkSearch || "").trim().toLowerCase();
              const matchingInventoryForLink = qLink ? (items || []).filter(i =>
                (i.name || "").toLowerCase().includes(qLink) ||
                (i.barcode || "").includes(qLink) ||
                (i.company || "").toLowerCase().includes(qLink)
              ).slice(0, 8) : [];

              // Handlers
              const handleNewDoctor = () => {
                const nextSr = allDoctors.length > 0 ? Math.max(...allDoctors.map(d => Number(d.srNo || 0))) + 1 : 1;
                const nextCode = "DOC" + String(nextSr).padStart(3, "0");
                setEditingDocId(null);
                setDocMasterForm({
                  ...defaultFullDoctorForm,
                  id: uid(),
                  srNo: nextSr,
                  code: nextCode,
                  linkedItems: []
                });
                setDocViewMode("editor");
                showToast("New Doctor entry form ready");
              };

              const handleOpenDoctorForEdit = (doc) => {
                setEditingDocId(doc.id);
                setDocMasterForm({
                  ...defaultFullDoctorForm,
                  ...doc
                });
                setDocViewMode("editor");
              };

              const handleSaveDoctorRecord = () => {
                if (!docMasterForm.name || !docMasterForm.name.trim()) {
                  showToast("Doctor Name is required!", "error");
                  return;
                }

                const docId = editingDocId || docMasterForm.id || uid();
                const recordData = {
                  ...docMasterForm,
                  id: docId,
                  name: docMasterForm.name.trim().toUpperCase(),
                  code: (docMasterForm.code || "DOC" + String(docMasterForm.srNo || 1).padStart(3, "0")).trim().toUpperCase(),
                  regNo: (docMasterForm.regNo || "").trim().toUpperCase(),
                  degree: (docMasterForm.degree || "").trim().toUpperCase(),
                  speciality: (docMasterForm.degree || "").trim().toUpperCase(),
                  address: (docMasterForm.address || "").trim().toUpperCase(),
                  address2: (docMasterForm.address2 || "").trim().toUpperCase(),
                  area: (docMasterForm.area || "").trim().toUpperCase(),
                  city: (docMasterForm.city || "SURAT").trim().toUpperCase(),
                  remarks: (docMasterForm.remarks || "").trim(),
                  note: (docMasterForm.remarks || "").trim(),
                  mobile: (docMasterForm.mobile || "").trim(),
                  contact: (docMasterForm.contact || "").trim(),
                  email: (docMasterForm.email || "").trim(),
                  password: (docMasterForm.password || "").trim(),
                  salesPercent: Number(docMasterForm.salesPercent) || 0,
                  returnPercent: Number(docMasterForm.returnPercent) || 0,
                  isPermanent: !!docMasterForm.isPermanent,
                  srNo: Number(docMasterForm.srNo) || (allDoctors.length + 1),
                  linkedItems: docMasterForm.linkedItems || [],
                  updatedAt: new Date().toISOString()
                };

                handleSaveDoctor(recordData, editingDocId, () => {
                  setDocMasterForm(recordData);
                  setEditingDocId(docId);
                  showToast(editingDocId ? `Doctor "${recordData.name}" updated!` : `Doctor "${recordData.name}" added successfully!`);
                });
              };

              const handleDeleteDoctorRecord = (docToDelete = docMasterForm) => {
                if (!docToDelete || !docToDelete.id) return;
                showConfirm(`Are you sure you want to delete Doctor "${docToDelete.name || docToDelete.code}"?`, () => {
                  handleDeleteDoctor(docToDelete.id);
                  if (allDoctors.length > 1) {
                    const remaining = allDoctors.filter(d => d.id !== docToDelete.id);
                    setDocMasterForm({ ...remaining[0] });
                    setEditingDocId(remaining[0].id);
                  } else {
                    handleNewDoctor();
                  }
                });
              };

              const handleNavigateDoctor = (direction) => {
                if (allDoctors.length === 0) return;
                const currentId = editingDocId || docMasterForm.id;
                const curIdx = allDoctors.findIndex(d => d.id === currentId);
                let targetIdx = 0;
                if (direction === "prev") {
                  targetIdx = curIdx > 0 ? curIdx - 1 : allDoctors.length - 1;
                } else {
                  targetIdx = curIdx < allDoctors.length - 1 ? curIdx + 1 : 0;
                }
                handleOpenDoctorForEdit(allDoctors[targetIdx]);
              };

              const handleTogglePermanent = () => {
                const nextState = !docMasterForm.isPermanent;
                setDocMasterForm({ ...docMasterForm, isPermanent: nextState });
                showToast(nextState ? "Marked as Permanent Doctor for Sales Bill" : "Permanent status removed");
              };

              const handleAddLinkedMedicine = (inventoryItem) => {
                if (!inventoryItem) return;
                const exists = (docMasterForm.linkedItems || []).some(li => String(li.itemId) === String(inventoryItem.id));
                if (exists) {
                  showToast("Medicine already linked to this Doctor", "error");
                  return;
                }

                const newItem = {
                  id: uid(),
                  itemId: inventoryItem.id,
                  itemName: inventoryItem.name,
                  company: inventoryItem.company || "General",
                  sRate: Number(inventoryItem.sRate || inventoryItem.price || inventoryItem.mrp || 0),
                  note: "Preferred Brand"
                };

                const updatedLinks = [...(docMasterForm.linkedItems || []), newItem];
                setDocMasterForm({ ...docMasterForm, linkedItems: updatedLinks });
                setItemLinkSearch("");
                setItemLinkDropdown(false);
                showToast(`Linked ${inventoryItem.name}`);
              };

              const handleRemoveLinkedMedicine = (linkId) => {
                const updatedLinks = (docMasterForm.linkedItems || []).filter(li => li.id !== linkId);
                setDocMasterForm({ ...docMasterForm, linkedItems: updatedLinks });
              };

              const handlePrintDoctorProfile = () => {
                const printWindow = window.open("", "_blank");
                if (!printWindow) {
                  showToast("Please allow popups to print doctor profile", "error");
                  return;
                }

                const linkedHTML = (docMasterForm.linkedItems || []).map((li, idx) => `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 6px; text-align: center;">${idx + 1}</td>
                    <td style="padding: 6px; font-weight: bold;">${li.itemName}</td>
                    <td style="padding: 6px; color: #475569;">${li.company || "-"}</td>
                    <td style="padding: 6px; text-align: right; color: #2563eb; font-weight: bold;">₹${Number(li.sRate || 0).toFixed(2)}</td>
                    <td style="padding: 6px; color: #64748b;">${li.note || "-"}</td>
                  </tr>
                `).join("");

                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Doctor Profile - ${docMasterForm.name}</title>
                    <style>
                      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 25px; color: #0f172a; }
                      .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
                      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px; background: #f8fafc; padding: 14px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
                      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
                      th { background: #0f172a; color: white; padding: 8px; font-size: 11px; text-transform: uppercase; text-align: left; }
                      @media print { body { padding: 0; } }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <h2 style="margin: 0; font-size: 20px;">SHIV DHARA MEDICAL STORE</h2>
                      <p style="margin: 2px 0; font-size: 12px; color: #475569;">Registered Pharmacy & Healthcare Provider</p>
                      <p style="margin: 0; font-size: 11px; font-weight: 700; color: #2563eb;">DOCTOR REFERRAL & PRESCRIPTION PROFILE</p>
                    </div>

                    <div class="grid">
                      <div><strong>Doctor Name:</strong> ${docMasterForm.name}</div>
                      <div><strong>Doctor Code:</strong> ${docMasterForm.code || "-"} | <strong>Sr.No:</strong> ${docMasterForm.srNo || 1}</div>
                      <div><strong>Degree / Spec:</strong> ${docMasterForm.degree || "N/A"}</div>
                      <div><strong>Council Reg. No:</strong> ${docMasterForm.regNo || "N/A"}</div>
                      <div><strong>Primary Mobile:</strong> ${docMasterForm.mobile || "N/A"}</div>
                      <div><strong>Clinic Contact:</strong> ${docMasterForm.contact || "N/A"}</div>
                      <div><strong>Email:</strong> ${docMasterForm.email || "N/A"}</div>
                      <div><strong>Permanent POS Status:</strong> ${docMasterForm.isPermanent ? "YES (Permanent Doctor)" : "NO"}</div>
                      <div><strong>Area / Locality:</strong> ${docMasterForm.area || "-"}, ${docMasterForm.city || "-"}</div>
                      <div><strong>Sales Commission:</strong> ${docMasterForm.salesPercent}% | <strong>Return:</strong> ${docMasterForm.returnPercent}%</div>
                      ${docMasterForm.address ? `<div style="grid-column: span 2;"><strong>Address:</strong> ${docMasterForm.address} ${docMasterForm.address2 || ""}</div>` : ""}
                      ${docMasterForm.remarks ? `<div style="grid-column: span 2; color: #b45309;"><strong>Visiting Hours / Remarks:</strong> ${docMasterForm.remarks}</div>` : ""}
                    </div>

                    ${(docMasterForm.date1 || docMasterForm.date2 || docMasterForm.date3) ? `
                      <h4 style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #475569;">Important Doctor Dates & Occasions:</h4>
                      <table style="margin-bottom: 20px;">
                        <thead>
                          <tr><th style="width: 120px;">Date</th><th>Occasion / Event Note</th></tr>
                        </thead>
                        <tbody>
                          ${docMasterForm.date1 ? `<tr><td style="padding: 6px; font-weight: bold;">${docMasterForm.date1}</td><td style="padding: 6px;">${docMasterForm.note1 || "Birthday / Event"}</td></tr>` : ""}
                          ${docMasterForm.date2 ? `<tr><td style="padding: 6px; font-weight: bold;">${docMasterForm.date2}</td><td style="padding: 6px;">${docMasterForm.note2 || "Anniversary / Opening"}</td></tr>` : ""}
                          ${docMasterForm.date3 ? `<tr><td style="padding: 6px; font-weight: bold;">${docMasterForm.date3}</td><td style="padding: 6px;">${docMasterForm.note3 || "Renewal / Note"}</td></tr>` : ""}
                        </tbody>
                      </table>
                    ` : ""}

                    <h4 style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #475569;">Preferred Prescribed Medicines:</h4>
                    <table>
                      <thead>
                        <tr><th style="width: 30px;">#</th><th>Medicine / Brand</th><th>Manufacturer</th><th style="text-align: right;">S.Rate</th><th>Notes</th></tr>
                      </thead>
                      <tbody>
                        ${linkedHTML || '<tr><td colspan="5" style="padding: 15px; text-align: center; color: #64748b;">No preferred medicines linked yet.</td></tr>'}
                      </tbody>
                    </table>

                    <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
                      <div>Generated on ${new Date().toLocaleString()}</div>
                      <div style="font-weight: bold; text-align: right;">Shiv Dhara Medical Store</div>
                    </div>
                  </body>
                  </html>
                `);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 300);
              };

              return (
                <div style={{ animation: "fadeIn 0.2s ease-in-out" }}>
                  {/* ─── HEADER ROW (Inventory Style / Image 2) ─── */}
                  {docViewMode === "list" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "26px" }}>🩺</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Doctor Master</h2>
                      <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Consulting Doctors, Medical Reg. No., Referral Commissions & Preferred Brands</p>
                    </div>

                    <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setDocViewMode(docViewMode === "editor" ? "list" : "editor")}
                        style={{ ...btn("#334155"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <FileText size={13} /> {docViewMode === "editor" ? "View Doctor Directory (List)" : "Back to Doctor Form"}
                      </button>
                      <button
                        type="button"
                        onClick={handleNewDoctor}
                        style={{ ...btn("var(--color-primary)"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <Plus size={13} /> Add Doctor
                      </button>
                    </div>
                  </div>
                  )}

                  {/* ═══════════════════════════════════════════════════════════
                      VIEW MODE 1: DOCTORS DIRECTORY LIST VIEW
                  ═══════════════════════════════════════════════════════════ */}
                  {docViewMode === "list" && (
                    <div style={{ animation: "fadeIn 0.15s ease-out" }}>
                      {/* Search Bar & Filters */}
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
                          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                          <input
                            placeholder="Search Doctor Name, Code, Reg.No, Degree, Area, Mobile... + Enter"
                            value={docSearch}
                            onChange={e => setDocSearch(e.target.value)}
                            style={{ ...inp, paddingLeft: "30px", width: "100%", height: "36px" }}
                          />
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#334155", cursor: "pointer", userSelect: "none" }}>
                          <input
                            type="checkbox"
                            checked={docFilterPermanent}
                            onChange={e => setDocFilterPermanent(e.target.checked)}
                          />
                          Permanent Doctors Only ⭐
                        </label>
                        {docSearch && (
                          <button onClick={() => setDocSearch("")} style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "11px" }}>Clear</button>
                        )}
                      </div>

                      {/* Stat Cards */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Registered Doctors</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{allDoctors.length}</div>
                        </div>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Permanent POS Doctors</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#ca8a04", marginTop: "4px" }}>
                            {allDoctors.filter(d => d.isPermanent).length} Doctors
                          </div>
                        </div>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Specialities Covered</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>
                            {[...new Set(allDoctors.map(d => d.degree).filter(Boolean))].length} Specialities
                          </div>
                        </div>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Preferred Items Linked</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#16a34a", marginTop: "4px" }}>
                            {allDoctors.reduce((acc, d) => acc + (d.linkedItems || []).length, 0)} Medicines
                          </div>
                        </div>
                      </div>

                      {/* Directory Table */}
                      <div style={{ background: "white", borderRadius: "12px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                          <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>
                            Doctor Master Directory ({filteredDoctors.length})
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            Click any Doctor to open full details, referral rates or link preferred medicines
                          </span>
                        </div>

                        {filteredDoctors.length === 0 ? (
                          <div style={{ padding: "50px 20px", textAlign: "center", color: "#64748b" }}>
                            <div style={{ fontSize: "36px", opacity: 0.5, marginBottom: "8px" }}>🩺</div>
                            <p style={{ margin: 0, fontWeight: "700", fontSize: "14px" }}>No doctors found</p>
                            <p style={{ margin: "4px 0 12px", fontSize: "12px" }}>Add your first consulting doctor using the button below.</p>
                            <button onClick={handleNewDoctor} style={{ ...btn("var(--color-primary)"), margin: "0 auto", fontSize: "12px" }}>
                              <Plus size={13} /> Add First Doctor
                            </button>
                          </div>
                        ) : (
                          <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 315px)", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                              <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc" }}>
                                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "11px", textTransform: "uppercase" }}>
                                  <th style={{ padding: "10px 8px", width: "40px", textAlign: "center" }}>Sr.</th>
                                  <th style={{ padding: "10px 8px", width: "80px", textAlign: "center" }}>Code</th>
                                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Doctor Name</th>
                                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Degree / Spec.</th>
                                  <th style={{ padding: "10px 10px", textAlign: "center" }}>Reg. No.</th>
                                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Mobile / Contact</th>
                                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Area & City</th>
                                  <th style={{ padding: "10px 8px", width: "70px", textAlign: "center" }}>Sales %</th>
                                  <th style={{ padding: "10px 8px", width: "80px", textAlign: "center" }}>POS Type</th>
                                  <th style={{ padding: "10px 12px", width: "160px", textAlign: "center" }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredDoctors.map((doc, idx) => (
                                  <tr
                                    key={doc.id || idx}
                                    style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.1s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                  >
                                    <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "700", color: "#64748b" }}>{doc.srNo || idx + 1}</td>
                                    <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "800", color: "#2563eb", fontFamily: "monospace" }}>{doc.code || "DOC"}</td>
                                    <td
                                      onClick={() => handleOpenDoctorForEdit(doc)}
                                      style={{ padding: "8px 14px", fontWeight: "800", color: "#1e3a8a", cursor: "pointer" }}
                                      title="Click to edit doctor details"
                                    >
                                      {doc.name}
                                    </td>
                                    <td style={{ padding: "8px 12px", color: "#475569" }}>
                                      {doc.degree ? <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>{doc.degree}</span> : "-"}
                                    </td>
                                    <td style={{ padding: "8px 10px", textAlign: "center", fontFamily: "monospace", fontSize: "11px", color: "#64748b" }}>
                                      {doc.regNo || "-"}
                                    </td>
                                    <td style={{ padding: "8px 12px", color: "#334155" }}>
                                      {doc.mobile ? <div>📞 {doc.mobile}</div> : null}
                                      {doc.contact && doc.contact !== doc.mobile ? <div style={{ fontSize: "11px", color: "#94a3b8" }}>{doc.contact}</div> : null}
                                    </td>
                                    <td style={{ padding: "8px 12px", color: "#475569", fontSize: "11px" }}>
                                      {doc.area ? <div>📍 {doc.area}</div> : null}
                                      <span style={{ color: "#64748b" }}>{doc.city || "SURAT"}</span>
                                    </td>
                                    <td style={{ padding: "8px 8px", textAlign: "center", fontWeight: "700", color: "#16a34a" }}>
                                      {doc.salesPercent}%
                                    </td>
                                    <td style={{ padding: "8px 8px", textAlign: "center" }}>
                                      {doc.isPermanent ? (
                                        <span style={{ background: "#fef3c7", color: "#854d0e", border: "1px solid #fde047", padding: "2px 6px", borderRadius: "10px", fontSize: "10px", fontWeight: "800" }}>
                                          ⭐ Permanent
                                        </span>
                                      ) : (
                                        <span style={{ color: "#94a3b8", fontSize: "11px" }}>Regular</span>
                                      )}
                                    </td>
                                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenDoctorForEdit(doc)}
                                          style={{ ...btn("#2563eb"), padding: "4px 8px", fontSize: "11px" }}
                                          title="Edit Doctor"
                                        >
                                          <Edit2 size={11} /> Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => { handleOpenDoctorForEdit(doc); setShowItemLinkModal(true); }}
                                          style={{ ...btn("#0284c7"), padding: "4px 8px", fontSize: "11px" }}
                                          title="Link Preferred Medicines"
                                        >
                                          Item Link
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => { handleOpenDoctorForEdit(doc); setTimeout(handlePrintDoctorProfile, 100); }}
                                          style={{ ...btn("#334155"), padding: "4px 8px", fontSize: "11px" }}
                                          title="Print Profile"
                                        >
                                          <Printer size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteDoctorRecord(doc)}
                                          style={{ ...btn("#dc2626"), padding: "4px 8px", fontSize: "11px" }}
                                          title="Delete Doctor"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ═══════════════════════════════════════════════════════════
                      VIEW MODE 2: DOCTOR MASTER FORM (Exact Legacy Layout)
                  ═══════════════════════════════════════════════════════════ */}
                  {docViewMode === "editor" && (
                    <div style={{ background: "white", borderRadius: "10px", padding: "12px 16px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", animation: "fadeIn 0.15s ease-out", height: "calc(100vh - 150px)", maxHeight: "calc(100vh - 150px)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                      
                      {/* Top Header Row with Permanent Doctor Action (Image 1 Pink Banner) */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "18px" }}>🩺</span>
                          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                            {docMasterForm.name ? docMasterForm.name : "New Doctor Record"}
                          </h3>
                          <span style={{ fontSize: "11px", fontWeight: "700", background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "4px", fontFamily: "monospace" }}>
                            Code: {docMasterForm.code || "DOC001"}
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: "700", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "4px" }}>
                            Sr.No: {docMasterForm.srNo || 1}
                          </span>
                        </div>

                        {/* Top Banner Button (Matching Image 1 Pink Box) */}
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={handleTogglePermanent}
                            style={{
                              background: docMasterForm.isPermanent ? "#fef3c7" : "#fee2e2",
                              color: docMasterForm.isPermanent ? "#854d0e" : "#991b1b",
                              border: docMasterForm.isPermanent ? "2px solid #ca8a04" : "1px solid #fca5a5",
                              borderRadius: "8px",
                              padding: "7px 14px",
                              fontSize: "12px",
                              fontWeight: "800",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                            }}
                            title="Click to toggle default permanent doctor for rapid billing"
                          >
                            <span>⭐</span>
                            {docMasterForm.isPermanent
                              ? "Permanent Doctor for Sales Bill: ACTIVE"
                              : "Click here To Create Permanent Doctor for Sales Bill"}
                          </button>
                        </div>
                      </div>

                      {/* Main Form Split: Left Core Form (2 cols) | Right Imp. Dates & Notes */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", marginBottom: "16px" }}>
                        
                        {/* ─── LEFT COLUMN: CORE DOCTOR DETAILS ─── */}
                        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          {/* Row 1: Sr.No | Code | Reg.No */}
                          <div style={{ display: "grid", gridTemplateColumns: "80px 110px 1fr", gap: "10px", marginBottom: "10px" }}>
                            <div>
                              <label style={lbl}>Sr.No.</label>
                              <input
                                type="number"
                                value={docMasterForm.srNo || 1}
                                onChange={e => setDocMasterForm({ ...docMasterForm, srNo: Number(e.target.value) || 1 })}
                                style={{ ...inp, background: "#ffffff", fontWeight: "700" }}
                              />
                            </div>
                            <div>
                              <label style={lbl}>Code</label>
                              <input
                                type="text"
                                value={docMasterForm.code || ""}
                                onChange={e => setDocMasterForm({ ...docMasterForm, code: e.target.value.toUpperCase() })}
                                style={{ ...inp, background: "#ffffff", textTransform: "uppercase", fontWeight: "700", color: "#1e40af" }}
                              />
                            </div>
                            <div>
                              <label style={lbl}>Reg. No.</label>
                              <input
                                type="text"
                                value={docMasterForm.regNo || ""}
                                onChange={e => setDocMasterForm({ ...docMasterForm, regNo: e.target.value.toUpperCase() })}
                                placeholder="Council Registration No. (e.g. G-18942)"
                                style={{ ...inp, background: "#ffffff", textTransform: "uppercase" }}
                              />
                            </div>
                          </div>

                          {/* Row 2: Name */}
                          <div style={{ marginBottom: "10px" }}>
                            <label style={lbl}>Doctor Name *</label>
                            <input
                              type="text"
                              value={docMasterForm.name || ""}
                              onChange={e => setDocMasterForm({ ...docMasterForm, name: e.target.value.toUpperCase() })}
                              placeholder="e.g. DR. R.K. PATEL"
                              style={{ ...inp, background: "#ffffff", fontWeight: "800", textTransform: "uppercase", fontSize: "13px" }}
                            />
                          </div>

                          {/* Row 3: Degree | Password */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "10px", marginBottom: "10px" }}>
                            <div>
                              <label style={lbl}>Degree / Specialization</label>
                              <input
                                type="text"
                                value={docMasterForm.degree || ""}
                                onChange={e => setDocMasterForm({ ...docMasterForm, degree: e.target.value.toUpperCase() })}
                                placeholder="e.g. MBBS, MD (PHYSICIAN)"
                                style={{ ...inp, background: "#ffffff", textTransform: "uppercase" }}
                              />
                            </div>
                            <div>
                              <label style={lbl}>Password / PIN</label>
                              <input
                                type="text"
                                value={docMasterForm.password || ""}
                                onChange={e => setDocMasterForm({ ...docMasterForm, password: e.target.value })}
                                placeholder="Referral PIN"
                                style={{ ...inp, background: "#ffffff" }}
                              />
                            </div>
                          </div>

                          {/* Row 4 & 5: Address Lines 1 & 2 */}
                          <div style={{ marginBottom: "10px" }}>
                            <label style={lbl}>Hospital / Clinic Address</label>
                            <input
                              type="text"
                              value={docMasterForm.address || ""}
                              onChange={e => setDocMasterForm({ ...docMasterForm, address: e.target.value.toUpperCase() })}
                              placeholder="Address Line 1 (Clinic Name, Hospital, Complex)"
                              style={{ ...inp, background: "#ffffff", textTransform: "uppercase", marginBottom: "6px" }}
                            />
                            <input
                              type="text"
                              value={docMasterForm.address2 || ""}
                              onChange={e => setDocMasterForm({ ...docMasterForm, address2: e.target.value.toUpperCase() })}
                              placeholder="Address Line 2 (Street, Landmark)"
                              style={{ ...inp, background: "#ffffff", textTransform: "uppercase" }}
                            />
                          </div>

                          {/* Row 6 & 7: Area, City | Sales %, Return % */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: "10px", marginBottom: "10px" }}>
                            <div>
                              <label style={lbl}>Area / Locality</label>
                              <input
                                type="text"
                                value={docMasterForm.area || ""}
                                onChange={e => setDocMasterForm({ ...docMasterForm, area: e.target.value.toUpperCase() })}
                                placeholder="e.g. VARACHHA ROAD"
                                style={{ ...inp, background: "#ffffff", textTransform: "uppercase" }}
                              />
                            </div>
                            <div>
                              <label style={lbl}>Sales %</label>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={docMasterForm.salesPercent ?? 10}
                                  onChange={e => setDocMasterForm({ ...docMasterForm, salesPercent: Number(e.target.value) || 0 })}
                                  style={{ ...inp, background: "#ffffff", textAlign: "center", fontWeight: "700" }}
                                />
                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>%</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: "10px", marginBottom: "10px" }}>
                            <div>
                              <label style={lbl}>City</label>
                              <input
                                type="text"
                                value={docMasterForm.city || "SURAT"}
                                onChange={e => setDocMasterForm({ ...docMasterForm, city: e.target.value.toUpperCase() })}
                                placeholder="SURAT"
                                style={{ ...inp, background: "#ffffff", textTransform: "uppercase" }}
                              />
                            </div>
                            <div>
                              <label style={lbl}>Return %</label>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={docMasterForm.returnPercent ?? 10}
                                  onChange={e => setDocMasterForm({ ...docMasterForm, returnPercent: Number(e.target.value) || 0 })}
                                  style={{ ...inp, background: "#ffffff", textAlign: "center", fontWeight: "700" }}
                                />
                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>%</span>
                              </div>
                            </div>
                          </div>

                          {/* Row 8, 9, 10: Mobile, Contact, Email */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                            <div>
                              <label style={lbl}>Mobile No.</label>
                              <input
                                type="text"
                                value={docMasterForm.mobile || ""}
                                onChange={e => setDocMasterForm({ ...docMasterForm, mobile: e.target.value })}
                                placeholder="Primary Mobile"
                                style={{ ...inp, background: "#ffffff" }}
                              />
                            </div>
                            <div>
                              <label style={lbl}>Contact No. (Landline/Alt)</label>
                              <input
                                type="text"
                                value={docMasterForm.contact || ""}
                                onChange={e => setDocMasterForm({ ...docMasterForm, contact: e.target.value })}
                                placeholder="Clinic Landline"
                                style={{ ...inp, background: "#ffffff" }}
                              />
                            </div>
                          </div>

                          <div style={{ marginBottom: "10px" }}>
                            <label style={lbl}>E-mail</label>
                            <input
                              type="email"
                              value={docMasterForm.email || ""}
                              onChange={e => setDocMasterForm({ ...docMasterForm, email: e.target.value })}
                              placeholder="doctor@hospital.com"
                              style={{ ...inp, background: "#ffffff" }}
                            />
                          </div>

                          {/* Row 11: Remarks */}
                          <div>
                            <label style={lbl}>Remarks / Visiting Hours</label>
                            <textarea
                              value={docMasterForm.remarks || ""}
                              onChange={e => setDocMasterForm({ ...docMasterForm, remarks: e.target.value })}
                              placeholder="Visiting hours (e.g. 10am-1pm, 5pm-8pm), hospital tie-up, bank account / UPI for referral..."
                              style={{ ...inp, background: "#ffffff", height: "55px", resize: "vertical" }}
                            />
                          </div>
                        </div>

                        {/* ─── RIGHT COLUMN: IMP. DATES AND NOTES (Image 1 Sub-Grid) ─── */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                          
                          {/* Imp. Dates & Notes Box */}
                          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "12px", fontWeight: "800", color: "#334155", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>📅 Imp. Dates And Notes</span>
                              <span style={{ fontSize: "10px", color: "#64748b" }}>Anniversaries & Events</span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {/* Date Row 1 */}
                              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "6px" }}>
                                <input
                                  type="text"
                                  value={docMasterForm.date1 || ""}
                                  onChange={e => setDocMasterForm({ ...docMasterForm, date1: e.target.value })}
                                  placeholder="DD/MM/YYYY"
                                  style={{ ...inp, background: "#ffffff", fontSize: "11px", textAlign: "center" }}
                                />
                                <input
                                  type="text"
                                  value={docMasterForm.note1 || ""}
                                  onChange={e => setDocMasterForm({ ...docMasterForm, note1: e.target.value })}
                                  placeholder="e.g. Doctor Birthday"
                                  style={{ ...inp, background: "#ffffff", fontSize: "11px" }}
                                />
                              </div>

                              {/* Date Row 2 */}
                              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "6px" }}>
                                <input
                                  type="text"
                                  value={docMasterForm.date2 || ""}
                                  onChange={e => setDocMasterForm({ ...docMasterForm, date2: e.target.value })}
                                  placeholder="DD/MM/YYYY"
                                  style={{ ...inp, background: "#ffffff", fontSize: "11px", textAlign: "center" }}
                                />
                                <input
                                  type="text"
                                  value={docMasterForm.note2 || ""}
                                  onChange={e => setDocMasterForm({ ...docMasterForm, note2: e.target.value })}
                                  placeholder="e.g. Clinic Opening"
                                  style={{ ...inp, background: "#ffffff", fontSize: "11px" }}
                                />
                              </div>

                              {/* Date Row 3 */}
                              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "6px" }}>
                                <input
                                  type="text"
                                  value={docMasterForm.date3 || ""}
                                  onChange={e => setDocMasterForm({ ...docMasterForm, date3: e.target.value })}
                                  placeholder="DD/MM/YYYY"
                                  style={{ ...inp, background: "#ffffff", fontSize: "11px", textAlign: "center" }}
                                />
                                <input
                                  type="text"
                                  value={docMasterForm.note3 || ""}
                                  onChange={e => setDocMasterForm({ ...docMasterForm, note3: e.target.value })}
                                  placeholder="e.g. License Renewal"
                                  style={{ ...inp, background: "#ffffff", fontSize: "11px" }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Preferred Linked Items Preview Box */}
                          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #cbd5e1", flex: 1, display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{ fontSize: "12px", fontWeight: "800", color: "#1e293b" }}>
                                💊 Linked Medicines ({(docMasterForm.linkedItems || []).length})
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowItemLinkModal(true)}
                                style={{ ...btn("#0284c7"), fontSize: "10px", padding: "3px 8px", fontWeight: "700" }}
                              >
                                + Link Items
                              </button>
                            </div>

                            {(!docMasterForm.linkedItems || docMasterForm.linkedItems.length === 0) ? (
                              <div style={{ textAlign: "center", padding: "20px 10px", color: "#94a3b8", fontSize: "11px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                                <span>No preferred medicines linked yet.</span>
                                <span style={{ fontSize: "10px", marginTop: "4px" }}>Click "Item Link" below to map common medicines for this doctor.</span>
                              </div>
                            ) : (
                              <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                                {docMasterForm.linkedItems.map((li, idx) => (
                                  <div key={li.id || idx} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 8px", fontSize: "11px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                      <div style={{ fontWeight: "700", color: "#0f172a" }}>{li.itemName}</div>
                                      <div style={{ fontSize: "10px", color: "#64748b" }}>{li.company || "General"} | ₹{Number(li.sRate || 0).toFixed(2)}</div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveLinkedMedicine(li.id)}
                                      style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}
                                      title="Remove"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ─── EXACT LEGACY BOTTOM ACTION TOOLBAR (Image 1 Bottom Buttons) ─── */}
                      <div style={{ position: "sticky", bottom: 0, background: "#ffffff", zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", paddingTop: "12px", paddingBottom: "12px", borderTop: "2px solid #cbd5e1", boxShadow: "0 -4px 16px rgba(0,0,0,0.12)" }}>
                        {/* Left Buttons: New | Save | Delete | List | Item Link */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={handleNewDoctor}
                            style={{ ...btn("#475569"), fontSize: "12px", padding: "7px 14px", fontWeight: "700" }}
                            title="New Blank Doctor Form"
                          >
                            New
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveDoctorRecord}
                            style={{ ...btn("var(--color-primary)"), fontSize: "12px", padding: "7px 16px", fontWeight: "800" }}
                            title="Save / Update Doctor"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoctorRecord(docMasterForm)}
                            disabled={!editingDocId}
                            style={{ ...btn("#dc2626"), fontSize: "12px", padding: "7px 14px", opacity: !editingDocId ? 0.5 : 1 }}
                            title="Delete this Doctor"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocViewMode("list")}
                            style={{ ...btn("#0284c7"), fontSize: "12px", padding: "7px 14px", fontWeight: "700" }}
                            title="View all doctors in directory"
                          >
                            List
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowItemLinkModal(true)}
                            style={{ ...btn("#16a34a"), fontSize: "12px", padding: "7px 14px", fontWeight: "700" }}
                            title="Open Preferred Medicine Link Modal"
                          >
                            Item Link
                          </button>
                        </div>

                        {/* Right Buttons: < | > | Print | Close */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => handleNavigateDoctor("prev")}
                            style={{ ...btn("#475569"), fontSize: "12px", padding: "7px 10px" }}
                            title="Previous Doctor"
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavigateDoctor("next")}
                            style={{ ...btn("#475569"), fontSize: "12px", padding: "7px 10px" }}
                            title="Next Doctor"
                          >
                            <ChevronRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={handlePrintDoctorProfile}
                            style={{ ...btn("#334155"), fontSize: "12px", padding: "7px 14px" }}
                            title="Print Doctor Profile"
                          >
                            <Printer size={13} /> Print
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocViewMode("list")}
                            style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "12px", padding: "7px 14px" }}
                            title="Close Doctor Form"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═══════════════════════════════════════════════════════════
                      MODAL: ITEM LINK (PREFERRED MEDICINES FOR DOCTOR)
                  ═══════════════════════════════════════════════════════════ */}
                  {showItemLinkModal && (
                    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                      <div style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "680px", boxShadow: "0 20px 40px rgba(0,0,0,0.25)", overflow: "hidden", animation: "fadeIn 0.15s ease-out" }}>
                        
                        {/* Modal Header */}
                        <div style={{ padding: "14px 20px", background: "#0f172a", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: "800", fontSize: "14px" }}>
                              💊 Doctor - Item Linkage
                            </div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                              Map Preferred Medicines & Prescription Brands for: <strong>{docMasterForm.name || "Doctor"}</strong>
                            </div>
                          </div>
                          <button onClick={() => setShowItemLinkModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
                            <X size={16} />
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: "18px 20px" }}>
                          {/* Search & Add Bar */}
                          <div style={{ position: "relative", marginBottom: "14px" }}>
                            <label style={lbl}>Search Inventory to Link Medicine:</label>
                            <div style={{ position: "relative" }}>
                              <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                              <input
                                placeholder="Type Brand Name, Formula or Company to Link..."
                                value={itemLinkSearch}
                                onChange={e => {
                                  setItemLinkSearch(e.target.value);
                                  setItemLinkDropdown(true);
                                }}
                                onFocus={() => setItemLinkDropdown(true)}
                                style={{ ...inp, paddingLeft: "30px", height: "36px", width: "100%" }}
                              />
                            </div>

                            {/* Dropdown Suggestions */}
                            {itemLinkDropdown && matchingInventoryForLink.length > 0 && (
                              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", zIndex: 90, marginTop: "4px", overflow: "hidden", maxHeight: "200px", overflowY: "auto" }}>
                                {matchingInventoryForLink.map(invItem => (
                                  <div
                                    key={invItem.id}
                                    onClick={() => handleAddLinkedMedicine(invItem)}
                                    style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                                  >
                                    <div>
                                      <div style={{ fontWeight: "700", fontSize: "12px", color: "#1e293b" }}>{invItem.name}</div>
                                      <div style={{ fontSize: "10px", color: "#64748b" }}>{invItem.company || "General"} | Stock: {invItem.stock || 0}</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb" }}>₹{Number(invItem.price || invItem.mrp || 0).toFixed(2)}</span>
                                      <span style={{ display: "block", fontSize: "9px", background: "#dcfce7", color: "#166534", padding: "1px 5px", borderRadius: "3px", fontWeight: "700" }}>+ Link</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Linked Medicines List Table */}
                          <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden", maxHeight: "260px", overflowY: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                              <thead>
                                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "11px", textTransform: "uppercase" }}>
                                  <th style={{ padding: "8px", width: "30px", textAlign: "center" }}>#</th>
                                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Medicine / Brand</th>
                                  <th style={{ padding: "8px 10px", textAlign: "left" }}>Company</th>
                                  <th style={{ padding: "8px 10px", textAlign: "right" }}>Selling Rate</th>
                                  <th style={{ padding: "8px 10px", textAlign: "left" }}>Special Note</th>
                                  <th style={{ padding: "8px", width: "40px", textAlign: "center" }}>Del</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(!docMasterForm.linkedItems || docMasterForm.linkedItems.length === 0) ? (
                                  <tr>
                                    <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                                      No medicines linked yet. Search and link medicines from inventory above.
                                    </td>
                                  </tr>
                                ) : (
                                  docMasterForm.linkedItems.map((li, idx) => (
                                    <tr key={li.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                      <td style={{ padding: "6px", textAlign: "center", fontWeight: "700", color: "#64748b" }}>{idx + 1}</td>
                                      <td style={{ padding: "6px 12px", fontWeight: "700", color: "#0f172a" }}>{li.itemName}</td>
                                      <td style={{ padding: "6px 10px", color: "#64748b" }}>{li.company || "-"}</td>
                                      <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700", color: "#2563eb" }}>₹{Number(li.sRate || 0).toFixed(2)}</td>
                                      <td style={{ padding: "6px 10px" }}>
                                        <input
                                          type="text"
                                          value={li.note || ""}
                                          onChange={e => {
                                            const updated = [...docMasterForm.linkedItems];
                                            updated[idx] = { ...updated[idx], note: e.target.value };
                                            setDocMasterForm({ ...docMasterForm, linkedItems: updated });
                                          }}
                                          placeholder="e.g. 1st Choice"
                                          style={{ ...inp, padding: "2px 6px", fontSize: "11px", height: "26px" }}
                                        />
                                      </td>
                                      <td style={{ padding: "6px", textAlign: "center" }}>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveLinkedMedicine(li.id)}
                                          style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}
                                          title="Remove Link"
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
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            Total Linked: <strong>{(docMasterForm.linkedItems || []).length} medicines</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowItemLinkModal(false);
                              handleSaveDoctorRecord();
                            }}
                            style={{ ...btn("var(--color-primary)"), fontSize: "12px", padding: "6px 16px", fontWeight: "700" }}
                          >
                            <CheckCircle size={13} /> Done & Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ═════════════════════════════════════════════════════════════
                PATIENT MASTER (Matching Legacy Screenshot 1 & 2 & Theme)
            ═════════════════════════════════════════════════════════════ */}
            {ownerSubTab === "customers" && (() => {
              // Ensure all patients have complete fields
              const allPatients = (patients || []).map((p, idx) => ({
                ...defaultPatientForm,
                ...p,
                srNo: p.srNo || idx + 1,
                code: p.code || ("PAT" + String(idx + 1).padStart(3, "0")),
                type: p.type || "General",
                sex: p.sex || "Male",
                city: p.city || "SURAT",
                birthDate: p.birthDate || "01/01/1990",
                tbDiagnosisDate: p.tbDiagnosisDate || "01/01/1900",
                tbTreatInitDate: p.tbTreatInitDate || "01/01/1900"
              }));

              // Filtering for list view
              const qp = (patientSearch || "").trim().toLowerCase();
              const filteredPatients = allPatients.filter(p => {
                if (patientTypeFilter !== "All" && p.type !== patientTypeFilter) return false;
                if (!qp) return true;
                return (
                  (p.name || "").toLowerCase().includes(qp) ||
                  (p.code || "").toLowerCase().includes(qp) ||
                  (p.relativeName || "").toLowerCase().includes(qp) ||
                  (p.mobile || "").includes(qp) ||
                  (p.contact || "").includes(qp) ||
                  (p.area || "").toLowerCase().includes(qp) ||
                  (p.city || "").toLowerCase().includes(qp) ||
                  (p.diagnosis || "").toLowerCase().includes(qp) ||
                  (p.goiIdNo || "").toLowerCase().includes(qp) ||
                  String(p.srNo || "").includes(qp)
                );
              });

              // Handlers
              const handleNewPatient = () => {
                const nextSr = allPatients.length > 0 ? Math.max(...allPatients.map(p => Number(p.srNo || 0))) + 1 : 1;
                const nextCode = "PAT" + String(nextSr).padStart(3, "0");
                setEditingPatientId(null);
                setPatientForm({
                  ...defaultPatientForm,
                  id: uid(),
                  srNo: nextSr,
                  code: nextCode,
                  birthDate: "01/01/1990",
                  type: "General"
                });
                setPatientViewMode("editor");
                showToast("New Patient entry form ready");
              };

              const handleOpenPatientForEdit = (pat) => {
                setEditingPatientId(pat.id);
                setPatientForm({
                  ...defaultPatientForm,
                  ...pat
                });
                setPatientViewMode("editor");
              };

              const handleSavePatientRecord = () => {
                if (!patientForm.name || !patientForm.name.trim()) {
                  showToast("Patient Name is required!", "error");
                  return;
                }

                const patId = editingPatientId || patientForm.id || uid();
                const recordData = {
                  ...patientForm,
                  id: patId,
                  name: patientForm.name.trim().toUpperCase(),
                  code: (patientForm.code || "PAT" + String(patientForm.srNo || 1).padStart(3, "0")).trim().toUpperCase(),
                  relativeName: (patientForm.relativeName || "").trim().toUpperCase(),
                  type: patientForm.type || "General",
                  sex: patientForm.sex || "Male",
                  birthDate: (patientForm.birthDate || "01/01/1990").trim(),
                  address: (patientForm.address || "").trim().toUpperCase(),
                  address2: (patientForm.address2 || "").trim().toUpperCase(),
                  area: (patientForm.area || "").trim().toUpperCase(),
                  city: (patientForm.city || "SURAT").trim().toUpperCase(),
                  pincode: (patientForm.pincode || "").trim(),
                  mobile: (patientForm.mobile || "").trim(),
                  contact: (patientForm.contact || "").trim(),
                  email: (patientForm.email || "").trim(),
                  remarks: (patientForm.remarks || "").trim(),
                  diagnosis: (patientForm.diagnosis || "").trim(),
                  goiIdNo: (patientForm.goiIdNo || "").trim().toUpperCase(),
                  tbDiagnosisDate: (patientForm.tbDiagnosisDate || "01/01/1900").trim(),
                  tbTreatInitDate: (patientForm.tbTreatInitDate || "01/01/1900").trim(),
                  srNo: Number(patientForm.srNo) || (allPatients.length + 1),
                  updatedAt: new Date().toISOString()
                };

                let updatedPatients;
                const existingIndex = allPatients.findIndex(p => p.id === patId);
                if (existingIndex >= 0) {
                  updatedPatients = allPatients.map(p => p.id === patId ? recordData : p);
                } else {
                  updatedPatients = [...allPatients, recordData];
                }

                setPatients(updatedPatients);
                setPatientForm(recordData);
                setEditingPatientId(patId);
                try {
                  localStorage.setItem("store_patients", JSON.stringify(updatedPatients));
                } catch (_) {}

                showToast(editingPatientId ? `Patient "${recordData.name}" updated!` : `Patient "${recordData.name}" added successfully!`);
              };

              const handleDeletePatientRecord = (patToDelete = patientForm) => {
                if (!patToDelete || !patToDelete.id) return;
                showConfirm(`Are you sure you want to delete Patient "${patToDelete.name || patToDelete.code}"?`, () => {
                  const remaining = allPatients.filter(p => p.id !== patToDelete.id);
                  setPatients(remaining);
                  try {
                    localStorage.setItem("store_patients", JSON.stringify(remaining));
                  } catch (_) {}
                  showToast("Patient record deleted");
                  if (remaining.length > 0) {
                    setPatientForm({ ...remaining[0] });
                    setEditingPatientId(remaining[0].id);
                  } else {
                    handleNewPatient();
                  }
                });
              };

              const handleNavigatePatient = (direction) => {
                if (allPatients.length === 0) return;
                const currentId = editingPatientId || patientForm.id;
                const curIdx = allPatients.findIndex(p => p.id === currentId);
                let targetIdx = 0;
                if (direction === "prev") {
                  targetIdx = curIdx > 0 ? curIdx - 1 : allPatients.length - 1;
                } else {
                  targetIdx = curIdx < allPatients.length - 1 ? curIdx + 1 : 0;
                }
                handleOpenPatientForEdit(allPatients[targetIdx]);
              };

              const handleOpenMessageModal = () => {
                const phone = patientForm.mobile || patientForm.contact || "";
                if (!phone) {
                  showToast("Patient mobile number not available", "error");
                  return;
                }
                const defaultMsg = `Hello ${patientForm.name || "Patient"}, your prescription medication from Shiv Dhara Medical Store is ready. For queries, contact us.`;
                setCustomPatientMsg(defaultMsg);
                setShowMessageModal(true);
              };

              const handleSendWhatsApp = () => {
                let phone = (patientForm.mobile || patientForm.contact || "").replace(/[^0-9]/g, "");
                if (phone.length === 10) phone = "91" + phone;
                const url = `https://wa.me/${phone}?text=${encodeURIComponent(customPatientMsg)}`;
                window.open(url, "_blank");
                setShowMessageModal(false);
                showToast("WhatsApp opened in browser");
              };

              const handlePrintPatientCard = () => {
                const printWindow = window.open("", "_blank");
                if (!printWindow) {
                  showToast("Please allow popups to print Patient Card", "error");
                  return;
                }

                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Patient Health Card - ${patientForm.name}</title>
                    <style>
                      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 25px; color: #0f172a; }
                      .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
                      .card-box { border: 2px solid #2563eb; border-radius: 10px; padding: 16px; background: #f8fafc; margin-bottom: 20px; }
                      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px; }
                      .tb-badge { display: inline-block; background: #6b21a8; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
                      .section-title { font-size: 13px; font-weight: bold; color: #1e40af; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin: 15px 0 8px; }
                      @media print { body { padding: 0; } }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <h2 style="margin: 0; font-size: 20px; color: #0f172a;">SHIV DHARA MEDICAL STORE</h2>
                      <p style="margin: 2px 0; font-size: 12px; color: #475569;">Pharmacy & Patient Healthcare Records | GST Registered</p>
                      <p style="margin: 0; font-size: 11px; font-weight: 700; color: #2563eb;">PATIENT MEDICAL PROFILE & HEALTH CARD</p>
                    </div>

                    <div class="card-box">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">
                        <div>
                          <span style="font-size: 16px; font-weight: 800; color: #0f172a;">${patientForm.name}</span>
                          <span style="margin-left: 8px; font-size: 11px; background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Code: ${patientForm.code || "-"}</span>
                        </div>
                        <div>
                          ${patientForm.type === "TB" ? `<span class="tb-badge">GOI NIKSHAY TB REGISTRY</span>` : `<span style="background: #e2e8f0; color: #334155; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${patientForm.type} PATIENT</span>`}
                        </div>
                      </div>

                      <div class="grid">
                        <div><strong>Father / Husband:</strong> ${patientForm.relativeName || "N/A"}</div>
                        <div><strong>Gender:</strong> ${patientForm.sex || "-"} | <strong>Birth Date:</strong> ${patientForm.birthDate || "-"}</div>
                        <div><strong>Primary Mobile:</strong> ${patientForm.mobile || "N/A"}</div>
                        <div><strong>Contact / Phone:</strong> ${patientForm.contact || "N/A"}</div>
                        <div><strong>Area / Locality:</strong> ${patientForm.area || "-"}, ${patientForm.city || "SURAT"} - ${patientForm.pincode || ""}</div>
                        <div><strong>Email:</strong> ${patientForm.email || "N/A"}</div>
                        ${patientForm.address ? `<div style="grid-column: span 2;"><strong>Full Address:</strong> ${patientForm.address} ${patientForm.address2 || ""}</div>` : ""}
                      </div>

                      ${patientForm.type === "TB" ? `
                        <div class="section-title">Central Tuberculosis Regulatory Details (NIKSHAY / GOI):</div>
                        <div class="grid" style="background: #faf5ff; padding: 10px; border-radius: 6px; border: 1px solid #e9d5ff;">
                          <div><strong>GOI ID No (NIKSHAY):</strong> ${patientForm.goiIdNo || "N/A"}</div>
                          <div><strong>Diagnosis Date:</strong> ${patientForm.tbDiagnosisDate || "-"}</div>
                          <div><strong>Treatment Initiation Date:</strong> ${patientForm.tbTreatInitDate || "-"}</div>
                          <div><strong>Status:</strong> Under Medical Observation</div>
                        </div>
                      ` : ""}

                      <div class="section-title">Patient Diagnosis & Medical History:</div>
                      <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; font-size: 12px; line-height: 1.5; min-height: 50px;">
                        ${patientForm.diagnosis || "No specific chronic diagnosis entered."}
                      </div>

                      ${patientForm.remarks ? `
                        <div class="section-title" style="color: #b45309;">Special Patient Remarks & Drug Allergies:</div>
                        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 10px; font-size: 12px; color: #92400e;">
                          ⚠️ ${patientForm.remarks}
                        </div>
                      ` : ""}
                    </div>

                    <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
                      <div>Card Generated on ${new Date().toLocaleString()}</div>
                      <div style="font-weight: bold; text-align: right;">Shiv Dhara Medical Store</div>
                    </div>
                  </body>
                  </html>
                `);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 300);
              };

              const handleBillPatientInPOS = () => {
                if (setSalesForm) {
                  setSalesForm(prev => ({
                    ...prev,
                    customerName: patientForm.name,
                    phone: patientForm.mobile || patientForm.contact || "",
                    address: `${patientForm.address || ""} ${patientForm.area || ""} ${patientForm.city || ""}`.trim(),
                    remarks: patientForm.type === "TB" ? `[TB Patient: NIKSHAY ${patientForm.goiIdNo || "ID"}] ${patientForm.remarks || ""}` : (patientForm.remarks || "")
                  }));
                }
                setActiveSection("sales_pos");
                showToast(`Patient "${patientForm.name}" selected for Sales Billing!`);
              };

              return (
                <div style={{ animation: "fadeIn 0.2s ease-in-out" }}>
                  {/* ─── HEADER ROW (Inventory Style / Image 2) ─── */}
                  {patientViewMode === "list" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "26px" }}>🧑‍⚕️</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Patient Master</h2>
                      <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Patient Demographics, Clinical Diagnosis & GOI NIKSHAY TB Registry</p>
                    </div>

                    <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setPatientViewMode(patientViewMode === "editor" ? "list" : "editor")}
                        style={{ ...btn("#334155"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <FileText size={13} /> {patientViewMode === "editor" ? "View Patient Directory (List)" : "Back to Patient Form"}
                      </button>
                      <button
                        type="button"
                        onClick={handleNewPatient}
                        style={{ ...btn("var(--color-primary)"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <Plus size={13} /> New Patient
                      </button>
                    </div>
                  </div>
                  )}

                  {/* ═══════════════════════════════════════════════════════════
                      VIEW MODE 1: PATIENT DIRECTORY LIST VIEW
                  ═══════════════════════════════════════════════════════════ */}
                  {patientViewMode === "list" && (
                    <div style={{ animation: "fadeIn 0.15s ease-out" }}>
                      {/* Search Bar & Type Filter */}
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
                          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                          <input
                            placeholder="Search Patient Name, Code, Mobile, Area, Diagnosis, NIKSHAY ID... + Enter"
                            value={patientSearch}
                            onChange={e => setPatientSearch(e.target.value)}
                            style={{ ...inp, paddingLeft: "30px", width: "100%", height: "36px" }}
                          />
                        </div>

                        {/* Filter Tabs */}
                        <div style={{ display: "flex", gap: "4px" }}>
                          {["All", "General", "TB", "Chronic", "Senior Citizen"].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setPatientTypeFilter(t)}
                              style={{
                                padding: "6px 12px",
                                fontSize: "11px",
                                fontWeight: "700",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                cursor: "pointer",
                                background: patientTypeFilter === t ? (t === "TB" ? "#6b21a8" : "#2563eb") : "#ffffff",
                                color: patientTypeFilter === t ? "#ffffff" : "#475569"
                              }}
                            >
                              {t === "TB" ? "TB (NIKSHAY)" : t}
                            </button>
                          ))}
                        </div>

                        {patientSearch && (
                          <button onClick={() => setPatientSearch("")} style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "11px" }}>Clear</button>
                        )}
                      </div>

                      {/* Stat Cards */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Total Registered Patients</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{allPatients.length}</div>
                        </div>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>GOI NIKSHAY TB Registry</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#6b21a8", marginTop: "4px" }}>
                            {allPatients.filter(p => p.type === "TB").length} Patients
                          </div>
                        </div>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>General Category</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>
                            {allPatients.filter(p => p.type === "General").length} Patients
                          </div>
                        </div>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Chronic Care Patients</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#16a34a", marginTop: "4px" }}>
                            {allPatients.filter(p => p.type === "Chronic" || (p.diagnosis || "").toLowerCase().includes("hypertension") || (p.diagnosis || "").toLowerCase().includes("diabet")).length} Patients
                          </div>
                        </div>
                      </div>

                      {/* Directory Table */}
                      <div style={{ background: "white", borderRadius: "12px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                          <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>
                            Patient Master Directory ({filteredPatients.length})
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            Click any Patient to open clinical history, NIKSHAY registry or bill in POS
                          </span>
                        </div>

                        {filteredPatients.length === 0 ? (
                          <div style={{ padding: "50px 20px", textAlign: "center", color: "#64748b" }}>
                            <div style={{ fontSize: "36px", opacity: 0.5, marginBottom: "8px" }}>🧑‍⚕️</div>
                            <p style={{ margin: 0, fontWeight: "700", fontSize: "14px" }}>No patients found</p>
                            <p style={{ margin: "4px 0 12px", fontSize: "12px" }}>Register a new patient using the button below.</p>
                            <button onClick={handleNewPatient} style={{ ...btn("var(--color-primary)"), margin: "0 auto", fontSize: "12px" }}>
                              <Plus size={13} /> Add First Patient
                            </button>
                          </div>
                        ) : (
                          <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 315px)", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                              <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc" }}>
                                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "11px", textTransform: "uppercase" }}>
                                  <th style={{ padding: "10px 8px", width: "40px", textAlign: "center" }}>Sr.</th>
                                  <th style={{ padding: "10px 8px", width: "80px", textAlign: "center" }}>Code</th>
                                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Patient Name</th>
                                  <th style={{ padding: "10px 8px", width: "100px", textAlign: "center" }}>Category</th>
                                  <th style={{ padding: "10px 10px", textAlign: "center" }}>Sex / Age</th>
                                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Mobile / Contact</th>
                                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Area & City</th>
                                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Clinical Diagnosis</th>
                                  <th style={{ padding: "10px 12px", width: "180px", textAlign: "center" }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredPatients.map((pat, idx) => (
                                  <tr
                                    key={pat.id || idx}
                                    style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.1s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                  >
                                    <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "700", color: "#64748b" }}>{pat.srNo || idx + 1}</td>
                                    <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "800", color: "#2563eb", fontFamily: "monospace" }}>{pat.code || "PAT"}</td>
                                    <td
                                      onClick={() => handleOpenPatientForEdit(pat)}
                                      style={{ padding: "8px 14px", fontWeight: "800", color: "#1e3a8a", cursor: "pointer" }}
                                      title="Click to edit patient record"
                                    >
                                      <div>{pat.name}</div>
                                      {pat.relativeName ? <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "normal" }}>C/O: {pat.relativeName}</div> : null}
                                    </td>
                                    <td style={{ padding: "8px 8px", textAlign: "center" }}>
                                      {pat.type === "TB" ? (
                                        <span style={{ background: "#f3e8ff", color: "#6b21a8", border: "1px solid #d8b4fe", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "800" }}>
                                          TB (NIKSHAY)
                                        </span>
                                      ) : (
                                        <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>
                                          {pat.type}
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: "8px 10px", textAlign: "center", fontSize: "11px", color: "#334155" }}>
                                      {pat.sex}
                                      {pat.birthDate && pat.birthDate !== "01/01/1900" ? <div style={{ fontSize: "10px", color: "#94a3b8" }}>{pat.birthDate}</div> : null}
                                    </td>
                                    <td style={{ padding: "8px 12px", color: "#334155" }}>
                                      {pat.mobile ? <div>📞 {pat.mobile}</div> : null}
                                      {pat.contact && pat.contact !== pat.mobile ? <div style={{ fontSize: "10px", color: "#94a3b8" }}>{pat.contact}</div> : null}
                                    </td>
                                    <td style={{ padding: "8px 12px", color: "#475569", fontSize: "11px" }}>
                                      {pat.area ? <div>📍 {pat.area}</div> : null}
                                      <span style={{ color: "#64748b" }}>{pat.city || "SURAT"}</span>
                                    </td>
                                    <td style={{ padding: "8px 14px", color: "#1e293b", fontSize: "11px", maxWidth: "220px" }}>
                                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {pat.diagnosis || "-"}
                                      </div>
                                      {pat.goiIdNo ? <div style={{ fontSize: "10px", color: "#6b21a8", fontWeight: "700" }}>ID: {pat.goiIdNo}</div> : null}
                                    </td>
                                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenPatientForEdit(pat)}
                                          style={{ ...btn("#2563eb"), padding: "4px 8px", fontSize: "11px" }}
                                          title="Edit Patient"
                                        >
                                          <Edit2 size={11} /> Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => { handleOpenPatientForEdit(pat); handleOpenMessageModal(); }}
                                          style={{ ...btn("#16a34a"), padding: "4px 8px", fontSize: "11px" }}
                                          title="Send WhatsApp Message"
                                        >
                                          💬
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => { handleOpenPatientForEdit(pat); setTimeout(handlePrintPatientCard, 100); }}
                                          style={{ ...btn("#334155"), padding: "4px 8px", fontSize: "11px" }}
                                          title="Print Patient Card"
                                        >
                                          <Printer size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => { handleOpenPatientForEdit(pat); handleBillPatientInPOS(); }}
                                          style={{ ...btn("#0284c7"), padding: "4px 8px", fontSize: "11px" }}
                                          title="Bill in Sales POS"
                                        >
                                          <ShoppingCart size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeletePatientRecord(pat)}
                                          style={{ ...btn("#dc2626"), padding: "4px 8px", fontSize: "11px" }}
                                          title="Delete Patient"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ═══════════════════════════════════════════════════════════
                      VIEW MODE 2: PATIENT MASTER FORM (Exact Legacy Layout)
                  ═══════════════════════════════════════════════════════════ */}
                  {patientViewMode === "editor" && (
                    <div style={{ background: "white", borderRadius: "10px", padding: "12px 16px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", animation: "fadeIn 0.15s ease-out", height: "calc(100vh - 150px)", maxHeight: "calc(100vh - 150px)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                      
                      {/* Top Header Row with Status Badges */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "18px" }}>🧑‍⚕️</span>
                          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                            {patientForm.name ? patientForm.name : "New Patient Registration"}
                          </h3>
                          <span style={{ fontSize: "11px", fontWeight: "700", background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "4px", fontFamily: "monospace" }}>
                            Code: {patientForm.code || "PAT001"}
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: "700", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "4px" }}>
                            Sr.No: {patientForm.srNo || 1}
                          </span>
                          {patientForm.type === "TB" && (
                            <span style={{ fontSize: "11px", fontWeight: "800", background: "#f3e8ff", color: "#6b21a8", border: "1px solid #d8b4fe", padding: "2px 8px", borderRadius: "4px" }}>
                              TB (GOI NIKSHAY Tracking Active)
                            </span>
                          )}
                        </div>

                        {/* Search to Jump */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <div style={{ position: "relative", width: "210px" }}>
                            <Search size={12} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                            <input
                              placeholder="Jump to Patient..."
                              value={patientSearch}
                              onChange={e => setPatientSearch(e.target.value)}
                              style={{ ...inp, paddingLeft: "26px", height: "30px", fontSize: "11px" }}
                            />
                            {patientSearch && filteredPatients.length > 0 && (
                              <div style={{ position: "absolute", top: "100%", right: 0, width: "250px", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 60, marginTop: "2px", overflow: "hidden" }}>
                                {filteredPatients.slice(0, 6).map(p => (
                                  <div
                                    key={p.id}
                                    onClick={() => { handleOpenPatientForEdit(p); setPatientSearch(""); }}
                                    style={{ padding: "6px 10px", fontSize: "11px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                                  >
                                    <div style={{ fontWeight: "700", color: "#1e293b" }}>{p.name}</div>
                                    <div style={{ fontSize: "10px", color: "#64748b" }}>Code: {p.code} | {p.mobile || p.area || "Surat"}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Main Layout Split: Left (Demographics & TB box) | Right (Patient Diagnosis) */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", marginBottom: "16px" }}>
                        
                        {/* ─── LEFT COLUMN: CORE PATIENT FIELDS & TB BOX ─── */}
                        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          
                          {/* Row 1: Sr No | Type | Code | B.Date | Sex (Matching Image 1 & 2) */}
                          <div style={{ display: "grid", gridTemplateColumns: "70px 110px 90px 110px 1fr", gap: "8px", marginBottom: "10px" }}>
                            <div>
                              <label style={lbl}>Sr No.</label>
                              <input
                                type="number"
                                value={patientForm.srNo || 1}
                                onChange={e => setPatientForm({ ...patientForm, srNo: Number(e.target.value) || 1 })}
                                style={{ ...inp, background: "#ffffff", fontWeight: "700" }}
                              />
                            </div>
                            <div>
                              <label style={lbl}>Type</label>
                              <select
                                value={patientForm.type || "General"}
                                onChange={e => setPatientForm({ ...patientForm, type: e.target.value })}
                                style={{
                                  ...inp,
                                  background: patientForm.type === "TB" ? "#f3e8ff" : "#ffffff",
                                  fontWeight: "700",
                                  color: patientForm.type === "TB" ? "#6b21a8" : "#0f172a"
                                }}
                              >
                                <option value="General">General</option>
                                <option value="TB">TB (NIKSHAY)</option>
                                <option value="Chronic">Chronic</option>
                                <option value="Senior Citizen">Senior Citizen</option>
                              </select>
                            </div>
                            <div>
                              <label style={lbl}>Code</label>
                              <input
                                type="text"
                                value={patientForm.code || ""}
                                onChange={e => setPatientForm({ ...patientForm, code: e.target.value.toUpperCase() })}
                                style={{ ...inp, background: "#ffffff", textTransform: "uppercase", fontWeight: "700", color: "#1e40af" }}
                              />
                            </div>
                            <div>
                              <label style={lbl}>B.Date</label>
                              <input
                                type="text"
                                value={patientForm.birthDate || ""}
                                onChange={e => setPatientForm({ ...patientForm, birthDate: e.target.value })}
                                placeholder="DD/MM/YYYY"
                                style={{ ...inp, background: "#ffffff", fontSize: "11px", textAlign: "center" }}
                              />
                            </div>
                            <div>
                              <label style={lbl}>Sex</label>
                              <select
                                value={patientForm.sex || "Male"}
                                onChange={e => setPatientForm({ ...patientForm, sex: e.target.value })}
                                style={{ ...inp, background: "#ffffff" }}
                              >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </div>

                          {/* Row 2: Name */}
                          <div style={{ marginBottom: "10px" }}>
                            <label style={lbl}>Patient Name *</label>
                            <input
                              type="text"
                              value={patientForm.name || ""}
                              onChange={e => setPatientForm({ ...patientForm, name: e.target.value.toUpperCase() })}
                              placeholder="e.g. RAMESHBHAI P. PATEL"
                              style={{ ...inp, background: "#ffffff", fontWeight: "800", textTransform: "uppercase", fontSize: "13px" }}
                            />
                          </div>

                          {/* Row 3: Father/Hus */}
                          <div style={{ marginBottom: "10px" }}>
                            <label style={lbl}>Father / Husband Name (C/O)</label>
                            <input
                              type="text"
                              value={patientForm.relativeName || ""}
                              onChange={e => setPatientForm({ ...patientForm, relativeName: e.target.value.toUpperCase() })}
                              placeholder="Father's or Husband's Name"
                              style={{ ...inp, background: "#ffffff", textTransform: "uppercase" }}
                            />
                          </div>

                          {/* Row 4 & 5: Address Line 1 & Line 2 */}
                          <div style={{ marginBottom: "10px" }}>
                            <label style={lbl}>Residential Address</label>
                            <input
                              type="text"
                              value={patientForm.address || ""}
                              onChange={e => setPatientForm({ ...patientForm, address: e.target.value.toUpperCase() })}
                              placeholder="Address Line 1 (House/Flat No, Society, Landmark)"
                              style={{ ...inp, background: "#ffffff", textTransform: "uppercase", marginBottom: "6px" }}
                            />
                            <input
                              type="text"
                              value={patientForm.address2 || ""}
                              onChange={e => setPatientForm({ ...patientForm, address2: e.target.value.toUpperCase() })}
                              placeholder="Address Line 2 (Street, Road)"
                              style={{ ...inp, background: "#ffffff", textTransform: "uppercase" }}
                            />
                          </div>

                          {/* Row 6: Area | PinCode */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: "10px", marginBottom: "10px" }}>
                            <div>
                              <label style={lbl}>Area / Locality</label>
                              <input
                                type="text"
                                value={patientForm.area || ""}
                                onChange={e => setPatientForm({ ...patientForm, area: e.target.value.toUpperCase() })}
                                placeholder="e.g. VARACHHA"
                                style={{ ...inp, background: "#ffffff", textTransform: "uppercase" }}
                              />
                            </div>
                            <div>
                              <label style={lbl}>PinCode</label>
                              <input
                                type="text"
                                value={patientForm.pincode || ""}
                                onChange={e => setPatientForm({ ...patientForm, pincode: e.target.value })}
                                placeholder="395006"
                                style={{ ...inp, background: "#ffffff", textAlign: "center" }}
                              />
                            </div>
                          </div>

                          {/* Row 7: City */}
                          <div style={{ marginBottom: "10px" }}>
                            <label style={lbl}>City</label>
                            <input
                              type="text"
                              value={patientForm.city || "SURAT"}
                              onChange={e => setPatientForm({ ...patientForm, city: e.target.value.toUpperCase() })}
                              placeholder="SURAT"
                              style={{ ...inp, background: "#ffffff", textTransform: "uppercase" }}
                            />
                          </div>

                          {/* Row 8 & 9: Contact (Landline) | Mobile */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                            <div>
                              <label style={lbl}>Contact No. (Landline/Alt)</label>
                              <input
                                type="text"
                                value={patientForm.contact || ""}
                                onChange={e => setPatientForm({ ...patientForm, contact: e.target.value })}
                                placeholder="Alternate Phone"
                                style={{ ...inp, background: "#ffffff" }}
                              />
                            </div>
                            <div>
                              <label style={lbl}>Mobile No. *</label>
                              <input
                                type="text"
                                value={patientForm.mobile || ""}
                                onChange={e => setPatientForm({ ...patientForm, mobile: e.target.value })}
                                placeholder="Primary Mobile (for WhatsApp)"
                                style={{ ...inp, background: "#ffffff", fontWeight: "700" }}
                              />
                            </div>
                          </div>

                          {/* Row 10: E-mail */}
                          <div style={{ marginBottom: "10px" }}>
                            <label style={lbl}>E-mail</label>
                            <input
                              type="email"
                              value={patientForm.email || ""}
                              onChange={e => setPatientForm({ ...patientForm, email: e.target.value })}
                              placeholder="patient@gmail.com"
                              style={{ ...inp, background: "#ffffff" }}
                            />
                          </div>

                          {/* Row 11: Remarks */}
                          <div style={{ marginBottom: patientForm.type === "TB" ? "14px" : "0" }}>
                            <label style={lbl}>Remarks / Allergies / Notes</label>
                            <textarea
                              value={patientForm.remarks || ""}
                              onChange={e => setPatientForm({ ...patientForm, remarks: e.target.value })}
                              placeholder="Special allergy warnings, chronic illness history, emergency contact..."
                              style={{ ...inp, background: "#ffffff", height: "45px", resize: "vertical" }}
                            />
                          </div>

                          {/* ─── SPECIAL TB REGISTRY PANEL (Matching Legacy Image 2 Exact Box) ─── */}
                          {patientForm.type === "TB" && (
                            <div style={{ background: "#f5f3ff", border: "2px solid #a855f7", borderRadius: "8px", padding: "14px", marginTop: "10px", animation: "fadeIn 0.15s ease-out" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "800", color: "#6b21a8", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span>🏛️</span> Central TB Elimination Program (GOI NIKSHAY)
                                </span>
                                <span style={{ fontSize: "10px", background: "#6b21a8", color: "white", padding: "1px 6px", borderRadius: "3px", fontWeight: "700" }}>
                                  MANDATORY REGISTRY
                                </span>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                                <div>
                                  <label style={{ ...lbl, color: "#6b21a8", fontWeight: "700" }}>GOI ID No :</label>
                                  <input
                                    type="text"
                                    value={patientForm.goiIdNo || ""}
                                    onChange={e => setPatientForm({ ...patientForm, goiIdNo: e.target.value.toUpperCase() })}
                                    placeholder="e.g. NIKSHAY-GJ-SRT-2026-8841"
                                    style={{ ...inp, background: "#ffffff", fontWeight: "800", color: "#581c87", textTransform: "uppercase" }}
                                  />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                  <div>
                                    <label style={{ ...lbl, color: "#6b21a8" }}>Date TB Diagnosis :</label>
                                    <input
                                      type="text"
                                      value={patientForm.tbDiagnosisDate || ""}
                                      onChange={e => setPatientForm({ ...patientForm, tbDiagnosisDate: e.target.value })}
                                      placeholder="DD/MM/YYYY"
                                      style={{ ...inp, background: "#ffffff", textAlign: "center" }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ ...lbl, color: "#6b21a8" }}>Date TB Treat Init. :</label>
                                    <input
                                      type="text"
                                      value={patientForm.tbTreatInitDate || ""}
                                      onChange={e => setPatientForm({ ...patientForm, tbTreatInitDate: e.target.value })}
                                      placeholder="DD/MM/YYYY"
                                      style={{ ...inp, background: "#ffffff", textAlign: "center" }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ─── RIGHT COLUMN: PATIENT DIAGNOSIS (Matching Image 1 & 2) ─── */}
                        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #cbd5e1", display: "flex", flexDirection: "column" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <label style={{ ...lbl, fontWeight: "800", color: "#0f172a", fontSize: "12px", margin: 0 }}>
                              📋 Patient Diagnosis
                            </label>
                            <span style={{ fontSize: "10px", color: "#64748b" }}>Medical Conditions</span>
                          </div>

                          {/* Quick Diagnosis Chips */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                            {["Fever / Viral", "Hypertension", "Type-2 Diabetes", "Asthma", "Allergy", "TB Active"].map(diag => (
                              <button
                                key={diag}
                                type="button"
                                onClick={() => {
                                  const cur = patientForm.diagnosis ? patientForm.diagnosis + ", " + diag : diag;
                                  setPatientForm({ ...patientForm, diagnosis: cur });
                                }}
                                style={{
                                  background: "#f1f5f9",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "12px",
                                  padding: "2px 8px",
                                  fontSize: "10px",
                                  fontWeight: "700",
                                  color: "#334155",
                                  cursor: "pointer"
                                }}
                              >
                                + {diag}
                              </button>
                            ))}
                          </div>

                          {/* Diagnosis Textarea */}
                          <textarea
                            value={patientForm.diagnosis || ""}
                            onChange={e => setPatientForm({ ...patientForm, diagnosis: e.target.value })}
                            placeholder="Type or select clinical diagnosis, chronic illnesses, active symptoms, lab test findings..."
                            style={{
                              ...inp,
                              background: "#f8fafc",
                              flex: 1,
                              minHeight: "220px",
                              resize: "none",
                              lineHeight: 1.5,
                              fontSize: "12px"
                            }}
                          />

                          <div style={{ marginTop: "10px", padding: "10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "11px", color: "#64748b" }}>
                            <div style={{ fontWeight: "700", color: "#334155", marginBottom: "2px" }}>💡 Pharmacy Care Tip:</div>
                            Recording chronic conditions ensures automatic drug-drug interaction alerts and dosage verification during Sales Billing.
                          </div>
                        </div>
                      </div>

                      {/* ─── EXACT LEGACY BOTTOM ACTION TOOLBAR (Image 1 & 2 Bottom Buttons) ─── */}
                      <div style={{ position: "sticky", bottom: 0, background: "#ffffff", zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", paddingTop: "12px", paddingBottom: "12px", borderTop: "2px solid #cbd5e1", boxShadow: "0 -4px 16px rgba(0,0,0,0.12)" }}>
                        {/* Left Buttons: New | Save | List | Delete | Message */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={handleNewPatient}
                            style={{ ...btn("#475569"), fontSize: "12px", padding: "7px 14px", fontWeight: "700" }}
                            title="New Blank Patient Form"
                          >
                            New
                          </button>
                          <button
                            type="button"
                            onClick={handleSavePatientRecord}
                            style={{ ...btn("var(--color-primary)"), fontSize: "12px", padding: "7px 16px", fontWeight: "800" }}
                            title="Save / Update Patient"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setPatientViewMode("list")}
                            style={{ ...btn("#0284c7"), fontSize: "12px", padding: "7px 14px", fontWeight: "700" }}
                            title="View Patient Directory"
                          >
                            List
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePatientRecord(patientForm)}
                            disabled={!editingPatientId}
                            style={{ ...btn("#dc2626"), fontSize: "12px", padding: "7px 14px", opacity: !editingPatientId ? 0.5 : 1 }}
                            title="Delete this Patient"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={handleOpenMessageModal}
                            style={{ ...btn("#16a34a"), fontSize: "12px", padding: "7px 14px", fontWeight: "700" }}
                            title="Send WhatsApp or SMS reminder"
                          >
                            Message
                          </button>
                        </div>

                        {/* Right Buttons: < | > | Print Card | Bill in POS | Close */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => handleNavigatePatient("prev")}
                            style={{ ...btn("#475569"), fontSize: "12px", padding: "7px 10px" }}
                            title="Previous Patient"
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavigatePatient("next")}
                            style={{ ...btn("#475569"), fontSize: "12px", padding: "7px 10px" }}
                            title="Next Patient"
                          >
                            <ChevronRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={handlePrintPatientCard}
                            style={{ ...btn("#334155"), fontSize: "12px", padding: "7px 14px" }}
                            title="Print Patient Health Card"
                          >
                            <Printer size={13} /> Print Card
                          </button>
                          <button
                            type="button"
                            onClick={handleBillPatientInPOS}
                            style={{ ...btn("#0284c7"), fontSize: "12px", padding: "7px 14px", fontWeight: "800" }}
                            title="Load Patient into Sales Bill"
                          >
                            <ShoppingCart size={13} /> Bill in POS
                          </button>
                          <button
                            type="button"
                            onClick={() => setPatientViewMode("list")}
                            style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "12px", padding: "7px 14px" }}
                            title="Close Patient Form"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═══════════════════════════════════════════════════════════
                      MODAL: SEND MESSAGE / WHATSAPP REMINDER
                  ═══════════════════════════════════════════════════════════ */}
                  {showMessageModal && (
                    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                      <div style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 40px rgba(0,0,0,0.25)", overflow: "hidden", animation: "fadeIn 0.15s ease-out" }}>
                        <div style={{ padding: "14px 20px", background: "#16a34a", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontWeight: "800", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>💬</span> Send WhatsApp Notification to: {patientForm.name}
                          </div>
                          <button onClick={() => setShowMessageModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
                            <X size={16} />
                          </button>
                        </div>

                        <div style={{ padding: "18px 20px" }}>
                          <div style={{ marginBottom: "12px", fontSize: "12px", color: "#475569" }}>
                            Recipient: <strong style={{ color: "#0f172a" }}>{patientForm.mobile || patientForm.contact || "No Number"}</strong>
                          </div>

                          <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => setCustomPatientMsg(`Hello ${patientForm.name}, your prescription order is ready for pickup at Shiv Dhara Medical Store. Thank you!`)}
                              style={{ ...btn("#f1f5f9", "#334155"), fontSize: "10px", padding: "3px 8px" }}
                            >
                              Ready for Pickup
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomPatientMsg(`Dear ${patientForm.name}, this is a gentle reminder to refill your regular monthly medicines from Shiv Dhara Medical Store.`)}
                              style={{ ...btn("#f1f5f9", "#334155"), fontSize: "10px", padding: "3px 8px" }}
                            >
                              Refill Reminder
                            </button>
                            {patientForm.type === "TB" && (
                              <button
                                type="button"
                                onClick={() => setCustomPatientMsg(`Dear ${patientForm.name}, please visit Shiv Dhara Medical Store for your regular DOTS TB medication follow-up under GOI ID ${patientForm.goiIdNo || ""}.`)}
                                style={{ ...btn("#f3e8ff", "#6b21a8"), fontSize: "10px", padding: "3px 8px", fontWeight: "700" }}
                              >
                                TB DOTS Reminder
                              </button>
                            )}
                          </div>

                          <label style={lbl}>Message Content:</label>
                          <textarea
                            value={customPatientMsg}
                            onChange={e => setCustomPatientMsg(e.target.value)}
                            style={{ ...inp, height: "100px", resize: "vertical", width: "100%", lineHeight: 1.4 }}
                          />
                        </div>

                        <div style={{ padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setShowMessageModal(false)}
                            style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "12px", padding: "6px 14px" }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSendWhatsApp}
                            style={{ ...btn("#16a34a"), fontSize: "12px", padding: "6px 18px", fontWeight: "700" }}
                          >
                            Open WhatsApp & Send 🚀
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ═════════════════════════════════════════════════════════════
                CONTRACT EMPLOYEE MASTER (Matching Legacy Screenshot & Light Theme)
            ═════════════════════════════════════════════════════════════ */}
            {ownerSubTab === "contract_employees" && (() => {
              // Ensure consistent data
              const allEmployees = (contractEmployees || []).map((e, idx) => ({
                ...defaultContractEmployeeForm,
                ...e,
                srNo: e.srNo || idx + 1,
                code: e.code || ("EMP" + String(idx + 1).padStart(3, "0")),
                contractCompany: e.contractCompany || "RELIANCE INDUSTRIES LTD (HAZIRA)",
                dependents: e.dependents || []
              }));

              // Filtering for directory list
              const qe = (contractEmpSearch || "").trim().toLowerCase();
              const filteredEmployees = allEmployees.filter(emp => {
                if (contractEmpCompanyFilter !== "All" && emp.contractCompany !== contractEmpCompanyFilter) return false;
                if (!qe) return true;
                const matchesDep = (emp.dependents || []).some(d => (d.name || "").toLowerCase().includes(qe) || (d.relation || "").toLowerCase().includes(qe));
                return (
                  (emp.name || "").toLowerCase().includes(qe) ||
                  (emp.code || "").toLowerCase().includes(qe) ||
                  (emp.contractCompany || "").toLowerCase().includes(qe) ||
                  (emp.department || "").toLowerCase().includes(qe) ||
                  (emp.designation || "").toLowerCase().includes(qe) ||
                  (emp.mobile || "").includes(qe) ||
                  matchesDep ||
                  String(emp.srNo || "").includes(qe)
                );
              });

              // Available companies
              const companyOptions = [...new Set([
                ...defaultContractCompanies,
                ...(accounts || []).filter(a => a.group === "Corporate A/c" || a.group === "Sundry Debtors").map(a => a.name)
              ])];

              // Relations list matching exact legacy screenshot
              const RELATION_CHOICES = [
                "Self", "Wife", "Daughter", "Son", "Father", "Mother", "Husband", "Else", "Sister", "Brother"
              ];

              // Handlers
              const handleNewEmployee = () => {
                const nextSr = allEmployees.length > 0 ? Math.max(...allEmployees.map(e => Number(e.srNo || 0))) + 1 : 1;
                const nextCode = "EMP" + String(nextSr).padStart(3, "0");
                setEditingContractEmpId(null);
                setContractEmployeeForm({
                  ...defaultContractEmployeeForm,
                  id: uid(),
                  srNo: nextSr,
                  code: nextCode,
                  dependents: [
                    { id: uid(), relation: "Self", name: "", age: 30, gender: "Male" }
                  ]
                });
                setContractEmpViewMode("editor");
                showToast("New Contract Employee form ready");
              };

              const handleOpenEmployeeForEdit = (emp) => {
                setEditingContractEmpId(emp.id);
                setContractEmployeeForm({
                  ...defaultContractEmployeeForm,
                  ...emp
                });
                setContractEmpViewMode("editor");
              };

              const handleSaveEmployeeRecord = () => {
                if (!contractEmployeeForm.name || !contractEmployeeForm.name.trim()) {
                  showToast("Employee Name is required!", "error");
                  return;
                }
                if (!contractEmployeeForm.contractCompany) {
                  showToast("Contract Company is required!", "error");
                  return;
                }

                const empId = editingContractEmpId || contractEmployeeForm.id || uid();
                const recordData = {
                  ...contractEmployeeForm,
                  id: empId,
                  name: contractEmployeeForm.name.trim().toUpperCase(),
                  code: (contractEmployeeForm.code || "EMP" + String(contractEmployeeForm.srNo || 1).padStart(3, "0")).trim().toUpperCase(),
                  contractCompany: contractEmployeeForm.contractCompany.trim().toUpperCase(),
                  department: (contractEmployeeForm.department || "").trim().toUpperCase(),
                  designation: (contractEmployeeForm.designation || "").trim().toUpperCase(),
                  mobile: (contractEmployeeForm.mobile || "").trim(),
                  email: (contractEmployeeForm.email || "").trim(),
                  creditLimit: Number(contractEmployeeForm.creditLimit) || 20000,
                  remarks: (contractEmployeeForm.remarks || "").trim(),
                  srNo: Number(contractEmployeeForm.srNo) || (allEmployees.length + 1),
                  dependents: contractEmployeeForm.dependents || [],
                  updatedAt: new Date().toISOString()
                };

                let updatedList;
                const existingIndex = allEmployees.findIndex(e => e.id === empId);
                if (existingIndex >= 0) {
                  updatedList = allEmployees.map(e => e.id === empId ? recordData : e);
                } else {
                  updatedList = [...allEmployees, recordData];
                }

                setContractEmployees(updatedList);
                setContractEmployeeForm(recordData);
                setEditingContractEmpId(empId);
                try {
                  localStorage.setItem("store_contract_employees", JSON.stringify(updatedList));
                } catch (_) {}

                showToast(editingContractEmpId ? `Employee "${recordData.name}" updated!` : `Employee "${recordData.name}" saved successfully!`);
              };

              const handleDeleteEmployeeRecord = (empToDelete = contractEmployeeForm) => {
                if (!empToDelete || !empToDelete.id) return;
                showConfirm(`Are you sure you want to delete Employee "${empToDelete.name || empToDelete.code}"?`, () => {
                  const remaining = allEmployees.filter(e => e.id !== empToDelete.id);
                  setContractEmployees(remaining);
                  try {
                    localStorage.setItem("store_contract_employees", JSON.stringify(remaining));
                  } catch (_) {}
                  showToast("Contract Employee deleted");
                  if (remaining.length > 0) {
                    setContractEmployeeForm({ ...remaining[0] });
                    setEditingContractEmpId(remaining[0].id);
                  } else {
                    handleNewEmployee();
                  }
                });
              };

              const handleNavigateEmployee = (direction) => {
                if (allEmployees.length === 0) return;
                const currentId = editingContractEmpId || contractEmployeeForm.id;
                const curIdx = allEmployees.findIndex(e => e.id === currentId);
                let targetIdx = 0;
                if (direction === "prev") {
                  targetIdx = curIdx > 0 ? curIdx - 1 : allEmployees.length - 1;
                } else {
                  targetIdx = curIdx < allEmployees.length - 1 ? curIdx + 1 : 0;
                }
                handleOpenEmployeeForEdit(allEmployees[targetIdx]);
              };

              const handleAddDependent = (rel = newDepRelation) => {
                const depName = (newDepName || (rel === "Self" ? contractEmployeeForm.name : "")).trim().toUpperCase();
                if (!depName) {
                  showToast("Please enter beneficiary dependent name", "error");
                  return;
                }

                const newDep = {
                  id: uid(),
                  relation: rel,
                  name: depName,
                  age: Number(newDepAge) || 25,
                  gender: newDepGender || (["Wife", "Mother", "Sister", "Daughter"].includes(rel) ? "Female" : "Male")
                };

                const updatedDeps = [...(contractEmployeeForm.dependents || []), newDep];
                setContractEmployeeForm({ ...contractEmployeeForm, dependents: updatedDeps });
                setNewDepName("");
                showToast(`Added ${rel}: ${depName}`);
              };

              const handleRemoveDependent = (depId) => {
                const updatedDeps = (contractEmployeeForm.dependents || []).filter(d => d.id !== depId);
                setContractEmployeeForm({ ...contractEmployeeForm, dependents: updatedDeps });
              };

              const handleExecuteCompanyTransfer = () => {
                if (!targetTransferCompany || targetTransferCompany === contractEmployeeForm.contractCompany) {
                  showToast("Please select a different target company to transfer", "error");
                  return;
                }

                const prevCompany = contractEmployeeForm.contractCompany;
                const updatedForm = { ...contractEmployeeForm, contractCompany: targetTransferCompany };
                setContractEmployeeForm(updatedForm);

                if (editingContractEmpId) {
                  const updatedList = allEmployees.map(e => e.id === editingContractEmpId ? { ...e, contractCompany: targetTransferCompany } : e);
                  setContractEmployees(updatedList);
                  try {
                    localStorage.setItem("store_contract_employees", JSON.stringify(updatedList));
                  } catch (_) {}
                }

                setShowTransferCompanyModal(false);
                showToast(`Transferred employee from "${prevCompany}" to "${targetTransferCompany}"!`);
              };

              const handleBillContractEmployeeInPOS = () => {
                if (setSalesForm) {
                  setSalesForm(prev => ({
                    ...prev,
                    customerName: `${contractEmployeeForm.name} (${contractEmployeeForm.code})`,
                    phone: contractEmployeeForm.mobile || "",
                    remarks: `[Contract Supply: ${contractEmployeeForm.contractCompany}] Emp: ${contractEmployeeForm.name} (${contractEmployeeForm.code})`
                  }));
                }
                setActiveSection("sales_pos");
                showToast(`Employee "${contractEmployeeForm.name}" loaded for Corporate Contract Billing!`);
              };

              const handlePrintEmployeeCard = () => {
                const printWindow = window.open("", "_blank");
                if (!printWindow) {
                  showToast("Please allow popups to print Employee Benefit Card", "error");
                  return;
                }

                const depsHTML = (contractEmployeeForm.dependents || []).map((d, idx) => `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 6px; text-align: center;">${idx + 1}</td>
                    <td style="padding: 6px; font-weight: bold; color: #1e40af;">${d.relation}</td>
                    <td style="padding: 6px; font-weight: bold;">${d.name}</td>
                    <td style="padding: 6px; text-align: center;">${d.gender}</td>
                    <td style="padding: 6px; text-align: center;">${d.age} Yrs</td>
                    <td style="padding: 6px; text-align: center; color: #16a34a; font-weight: bold;">Eligible</td>
                  </tr>
                `).join("");

                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Contract Employee Benefit Card - ${contractEmployeeForm.name}</title>
                    <style>
                      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 25px; color: #0f172a; }
                      .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
                      .card-box { border: 2px solid #0284c7; border-radius: 10px; padding: 16px; background: #f8fafc; margin-bottom: 20px; }
                      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px; }
                      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; }
                      th { background: #0f172a; color: white; padding: 8px; font-size: 11px; text-transform: uppercase; text-align: left; }
                      @media print { body { padding: 0; } }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <h2 style="margin: 0; font-size: 20px; color: #0f172a;">SHIV DHARA MEDICAL STORE</h2>
                      <p style="margin: 2px 0; font-size: 12px; color: #475569;">Authorized Corporate Pharmacy & Cashless Healthcare Services</p>
                      <p style="margin: 0; font-size: 11px; font-weight: 700; color: #0284c7;">CORPORATE CONTRACT MEDICAL BENEFIT CARD</p>
                    </div>

                    <div class="card-box">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">
                        <div>
                          <span style="font-size: 16px; font-weight: 800; color: #0f172a;">${contractEmployeeForm.name}</span>
                          <span style="margin-left: 8px; font-size: 11px; background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Badge Code: ${contractEmployeeForm.code || "-"}</span>
                        </div>
                        <div style="background: #0284c7; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                          ${contractEmployeeForm.contractCompany}
                        </div>
                      </div>

                      <div class="grid">
                        <div><strong>Contract Company:</strong> ${contractEmployeeForm.contractCompany}</div>
                        <div><strong>Department:</strong> ${contractEmployeeForm.department || "General"}</div>
                        <div><strong>Designation:</strong> ${contractEmployeeForm.designation || "Staff"}</div>
                        <div><strong>Registered Mobile:</strong> ${contractEmployeeForm.mobile || "N/A"}</div>
                        <div><strong>Email:</strong> ${contractEmployeeForm.email || "N/A"}</div>
                        <div><strong>Monthly Credit Limit:</strong> ₹${Number(contractEmployeeForm.creditLimit || 0).toLocaleString()}</div>
                        ${contractEmployeeForm.remarks ? `<div style="grid-column: span 2; color: #b45309;"><strong>Benefit Rules / Remarks:</strong> ${contractEmployeeForm.remarks}</div>` : ""}
                      </div>

                      <h4 style="margin: 15px 0 6px; font-size: 12px; text-transform: uppercase; color: #0284c7;">Authorized Family Beneficiaries Covered:</h4>
                      <table>
                        <thead>
                          <tr><th style="width: 30px; text-align: center;">#</th><th>Relation</th><th>Beneficiary Name</th><th style="text-align: center;">Gender</th><th style="text-align: center;">Age</th><th style="text-align: center;">Status</th></tr>
                        </thead>
                        <tbody>
                          ${depsHTML || '<tr><td colspan="6" style="padding: 12px; text-align: center; color: #64748b;">No dependents registered under this contract employee.</td></tr>'}
                        </tbody>
                      </table>
                    </div>

                    <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
                      <div>Generated on ${new Date().toLocaleString()}</div>
                      <div style="font-weight: bold; text-align: right;">Shiv Dhara Medical Store | Corporate Desk</div>
                    </div>
                  </body>
                  </html>
                `);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 300);
              };

              return (
                <div style={{ animation: "fadeIn 0.2s ease-in-out" }}>
                  {/* ─── HEADER ROW (Inventory Style / Image 2) ─── */}
                  {contractEmpViewMode === "list" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "26px" }}>👷</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Contract Employee Master</h2>
                      <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Corporate Company Tie-ups, Employee Beneficiaries & Credit Billing Limits</p>
                    </div>

                    <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setContractEmpViewMode(contractEmpViewMode === "editor" ? "list" : "editor")}
                        style={{ ...btn("#334155"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <FileText size={13} /> {contractEmpViewMode === "editor" ? "View Employee Directory (List)" : "Back to Employee Form"}
                      </button>
                      <button
                        type="button"
                        onClick={handleNewEmployee}
                        style={{ ...btn("var(--color-primary)"), fontSize: "12px", padding: "7px 14px" }}
                      >
                        <Plus size={13} /> Add Contract Employee
                      </button>
                    </div>
                  </div>
                  )}

                  {/* ═══════════════════════════════════════════════════════════
                      VIEW MODE 1: CONTRACT EMPLOYEES DIRECTORY (LIST VIEW)
                  ═══════════════════════════════════════════════════════════ */}
                  {contractEmpViewMode === "list" && (
                    <div style={{ animation: "fadeIn 0.15s ease-out" }}>
                      {/* Search & Company Filter */}
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
                          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                          <input
                            placeholder="Search Employee Name, Code, Company, Department, Mobile or Dependent... + Enter"
                            value={contractEmpSearch}
                            onChange={e => setContractEmpSearch(e.target.value)}
                            style={{ ...inp, paddingLeft: "30px", width: "100%", height: "36px" }}
                          />
                        </div>

                        {/* Company Filter Dropdown */}
                        <div style={{ minWidth: "200px" }}>
                          <select
                            value={contractEmpCompanyFilter}
                            onChange={e => setContractEmpCompanyFilter(e.target.value)}
                            style={{ ...inp, height: "36px", fontWeight: "700" }}
                          >
                            <option value="All">All Contract Companies</option>
                            {companyOptions.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        {contractEmpSearch && (
                          <button onClick={() => setContractEmpSearch("")} style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "11px" }}>Clear</button>
                        )}
                      </div>

                      {/* Stat Cards */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Total Contract Employees</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{allEmployees.length}</div>
                        </div>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Contract Companies</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#0284c7", marginTop: "4px" }}>
                            {[...new Set(allEmployees.map(e => e.contractCompany))].length} Companies
                          </div>
                        </div>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Family Beneficiaries</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#16a34a", marginTop: "4px" }}>
                            {allEmployees.reduce((acc, e) => acc + (e.dependents || []).length, 0)} Persons
                          </div>
                        </div>
                        <div style={{ background: "white", padding: "14px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Corporate Credit Allotted</div>
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#7c3aed", marginTop: "4px" }}>
                            ₹{allEmployees.reduce((acc, e) => acc + (Number(e.creditLimit) || 0), 0).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Directory Table */}
                      <div style={{ background: "white", borderRadius: "12px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                          <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>
                            Contract Employees Directory ({filteredEmployees.length})
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            Click any Employee to open family dependents, company mapping or bill in POS
                          </span>
                        </div>

                        {filteredEmployees.length === 0 ? (
                          <div style={{ padding: "50px 20px", textAlign: "center", color: "#64748b" }}>
                            <div style={{ fontSize: "36px", opacity: 0.5, marginBottom: "8px" }}>👷</div>
                            <p style={{ margin: 0, fontWeight: "700", fontSize: "14px" }}>No contract employees found</p>
                            <p style={{ margin: "4px 0 12px", fontSize: "12px" }}>Enroll your first contract employee using the button below.</p>
                            <button onClick={handleNewEmployee} style={{ ...btn("var(--color-primary)"), margin: "0 auto", fontSize: "12px" }}>
                              <Plus size={13} /> Add First Employee
                            </button>
                          </div>
                        ) : (
                          <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 315px)", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                              <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc" }}>
                                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "11px", textTransform: "uppercase" }}>
                                  <th style={{ padding: "10px 8px", width: "40px", textAlign: "center" }}>Sr.</th>
                                  <th style={{ padding: "10px 8px", width: "80px", textAlign: "center" }}>Code</th>
                                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Employee Name</th>
                                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Contract Company</th>
                                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Department & Role</th>
                                  <th style={{ padding: "10px 10px", textAlign: "center" }}>Beneficiaries</th>
                                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Credit Limit</th>
                                  <th style={{ padding: "10px 12px", width: "180px", textAlign: "center" }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredEmployees.map((emp, idx) => (
                                  <tr
                                    key={emp.id || idx}
                                    style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.1s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                  >
                                    <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "700", color: "#64748b" }}>{emp.srNo || idx + 1}</td>
                                    <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: "800", color: "#0284c7", fontFamily: "monospace" }}>{emp.code || "EMP"}</td>
                                    <td
                                      onClick={() => handleOpenEmployeeForEdit(emp)}
                                      style={{ padding: "8px 14px", fontWeight: "800", color: "#1e3a8a", cursor: "pointer" }}
                                      title="Click to edit employee"
                                    >
                                      <div>{emp.name}</div>
                                      {emp.mobile ? <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "normal" }}>📞 {emp.mobile}</div> : null}
                                    </td>
                                    <td style={{ padding: "8px 12px" }}>
                                      <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" }}>
                                        {emp.contractCompany}
                                      </span>
                                    </td>
                                    <td style={{ padding: "8px 12px", color: "#475569", fontSize: "11px" }}>
                                      <div style={{ fontWeight: "600", color: "#1e293b" }}>{emp.department || "General"}</div>
                                      <div>{emp.designation || "-"}</div>
                                    </td>
                                    <td style={{ padding: "8px 10px", textAlign: "center" }}>
                                      <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                                        {(emp.dependents || []).length} Persons
                                      </span>
                                    </td>
                                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "800", color: "#0f172a" }}>
                                      ₹{Number(emp.creditLimit || 0).toLocaleString()}
                                    </td>
                                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEmployeeForEdit(emp)}
                                          style={{ ...btn("#2563eb"), padding: "4px 8px", fontSize: "11px" }}
                                          title="Edit Employee"
                                        >
                                          <Edit2 size={11} /> Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => { handleOpenEmployeeForEdit(emp); setTargetTransferCompany(emp.contractCompany); setShowTransferCompanyModal(true); }}
                                          style={{ ...btn("#d97706"), padding: "4px 8px", fontSize: "11px" }}
                                          title="Transfer to Other Company"
                                        >
                                          Transfer
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => { handleOpenEmployeeForEdit(emp); handleBillContractEmployeeInPOS(); }}
                                          style={{ ...btn("#0284c7"), padding: "4px 8px", fontSize: "11px" }}
                                          title="Bill in Sales POS"
                                        >
                                          <ShoppingCart size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => { handleOpenEmployeeForEdit(emp); setTimeout(handlePrintEmployeeCard, 100); }}
                                          style={{ ...btn("#334155"), padding: "4px 8px", fontSize: "11px" }}
                                          title="Print Card"
                                        >
                                          <Printer size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteEmployeeRecord(emp)}
                                          style={{ ...btn("#dc2626"), padding: "4px 8px", fontSize: "11px" }}
                                          title="Delete Employee"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ═══════════════════════════════════════════════════════════
                      VIEW MODE 2: CONTRACT EMPLOYEE FORM (Matching Legacy Layout)
                  ═══════════════════════════════════════════════════════════ */}
                  {contractEmpViewMode === "editor" && (
                    <div style={{ background: "white", borderRadius: "10px", padding: "12px 16px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", animation: "fadeIn 0.15s ease-out", height: "calc(100vh - 150px)", maxHeight: "calc(100vh - 150px)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                      
                      {/* Top Header Row with Status & Quick Jump */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "18px" }}>👷</span>
                          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                            {contractEmployeeForm.name ? contractEmployeeForm.name : "New Contract Employee"}
                          </h3>
                          <span style={{ fontSize: "11px", fontWeight: "700", background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "4px", fontFamily: "monospace" }}>
                            Code: {contractEmployeeForm.code || "EMP001"}
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: "700", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "4px" }}>
                            {contractEmployeeForm.contractCompany}
                          </span>
                        </div>

                        {/* Top Action: Transfer to Other Company Button (Matching Legacy Screen) */}
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetTransferCompany(contractEmployeeForm.contractCompany);
                              setShowTransferCompanyModal(true);
                            }}
                            style={{
                              background: "#fffbeb",
                              color: "#b45309",
                              border: "1px solid #fde68a",
                              borderRadius: "8px",
                              padding: "7px 14px",
                              fontSize: "12px",
                              fontWeight: "800",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                            title="Move employee to another contract company"
                          >
                            <span>🏢</span> Transfer to Other Company
                          </button>
                        </div>
                      </div>

                      {/* Main Split Layout: Left Company & Employee Fields | Right Relation with Emp Beneficiaries */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "16px", marginBottom: "16px" }}>
                        
                        {/* ─── LEFT COLUMN: CONTRACT COMPANY & EMPLOYEE DETAILS (Matching Image) ─── */}
                        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          
                          {/* Contract Company Selection Box (Matching Image List Box) */}
                          <div style={{ marginBottom: "14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <label style={{ ...lbl, fontWeight: "800", color: "#0f172a" }}>Contract Company : *</label>
                              <span style={{ fontSize: "10px", color: "#64748b" }}>Select Corporate Client</span>
                            </div>
                            <select
                              value={contractEmployeeForm.contractCompany || ""}
                              onChange={e => setContractEmployeeForm({ ...contractEmployeeForm, contractCompany: e.target.value })}
                              style={{ ...inp, background: "#ffffff", fontWeight: "800", color: "#0369a1", fontSize: "13px" }}
                            >
                              {companyOptions.map(comp => (
                                <option key={comp} value={comp}>{comp}</option>
                              ))}
                            </select>
                          </div>

                          {/* Employee Code & Sr.No */}
                          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "10px", marginBottom: "12px" }}>
                            <div>
                              <label style={lbl}>Sr No.</label>
                              <input
                                type="number"
                                value={contractEmployeeForm.srNo || 1}
                                onChange={e => setContractEmployeeForm({ ...contractEmployeeForm, srNo: Number(e.target.value) || 1 })}
                                style={{ ...inp, background: "#ffffff", fontWeight: "700" }}
                              />
                            </div>
                            <div>
                              <label style={lbl}>Employee Code : *</label>
                              <input
                                type="text"
                                value={contractEmployeeForm.code || ""}
                                onChange={e => setContractEmployeeForm({ ...contractEmployeeForm, code: e.target.value.toUpperCase() })}
                                placeholder="e.g. EMP001, BADGE-8841"
                                style={{ ...inp, background: "#ffffff", fontWeight: "800", color: "#0284c7", textTransform: "uppercase" }}
                              />
                            </div>
                          </div>

                          {/* Employee Name : */}
                          <div style={{ marginBottom: "12px" }}>
                            <label style={{ ...lbl, fontWeight: "800" }}>Employee Name : *</label>
                            <input
                              type="text"
                              value={contractEmployeeForm.name || ""}
                              onChange={e => setContractEmployeeForm({ ...contractEmployeeForm, name: e.target.value.toUpperCase() })}
                              placeholder="e.g. RAKESH M. SHARMA"
                              style={{ ...inp, background: "#ffffff", fontWeight: "800", textTransform: "uppercase", fontSize: "13px" }}
                            />
                          </div>

                          {/* Department & Designation */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                            <div>
                              <label style={lbl}>Department</label>
                              <input
                                type="text"
                                value={contractEmployeeForm.department || ""}
                                onChange={e => setContractEmployeeForm({ ...contractEmployeeForm, department: e.target.value.toUpperCase() })}
                                placeholder="e.g. OPERATIONS / PLANT"
                                style={{ ...inp, background: "#ffffff", textTransform: "uppercase" }}
                              />
                            </div>
                            <div>
                              <label style={lbl}>Designation / Role</label>
                              <input
                                type="text"
                                value={contractEmployeeForm.designation || ""}
                                onChange={e => setContractEmployeeForm({ ...contractEmployeeForm, designation: e.target.value.toUpperCase() })}
                                placeholder="e.g. SENIOR ENGINEER"
                                style={{ ...inp, background: "#ffffff", textTransform: "uppercase" }}
                              />
                            </div>
                          </div>

                          {/* Mobile & Monthly Credit Limit */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                            <div>
                              <label style={lbl}>Mobile No.</label>
                              <input
                                type="text"
                                value={contractEmployeeForm.mobile || ""}
                                onChange={e => setContractEmployeeForm({ ...contractEmployeeForm, mobile: e.target.value })}
                                placeholder="Primary Phone"
                                style={{ ...inp, background: "#ffffff" }}
                              />
                            </div>
                            <div>
                              <label style={lbl}>Monthly Credit Limit (₹)</label>
                              <input
                                type="number"
                                value={contractEmployeeForm.creditLimit ?? 20000}
                                onChange={e => setContractEmployeeForm({ ...contractEmployeeForm, creditLimit: Number(e.target.value) || 0 })}
                                style={{ ...inp, background: "#ffffff", fontWeight: "700" }}
                              />
                            </div>
                          </div>

                          {/* Remarks / Contract Supply Terms */}
                          <div>
                            <label style={lbl}>Remarks / Corporate Authorization Notes</label>
                            <textarea
                              value={contractEmployeeForm.remarks || ""}
                              onChange={e => setContractEmployeeForm({ ...contractEmployeeForm, remarks: e.target.value })}
                              placeholder="Approved billing conditions, prescription verification rules, HR email authorization..."
                              style={{ ...inp, background: "#ffffff", height: "55px", resize: "vertical" }}
                            />
                          </div>
                        </div>

                        {/* ─── RIGHT COLUMN: RELATION WITH EMP = (Exact Legacy Screenshot Grid) ─── */}
                        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #cbd5e1", display: "flex", flexDirection: "column" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <label style={{ ...lbl, fontWeight: "800", color: "#0f172a", fontSize: "12px", margin: 0 }}>
                              Relation with Emp =
                            </label>
                            <span style={{ fontSize: "10px", color: "#64748b" }}>Family Beneficiaries</span>
                          </div>

                          {/* Relation Choice Chips (Matching Legacy: Self, Wife, Daughter, Son, Father, Mother, Husband, Else, Sister, Brother) */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
                            {RELATION_CHOICES.map(rel => {
                              const alreadyAdded = (contractEmployeeForm.dependents || []).some(d => d.relation === rel);
                              return (
                                <button
                                  key={rel}
                                  type="button"
                                  onClick={() => {
                                    setNewDepRelation(rel);
                                    if (rel === "Self") setNewDepName(contractEmployeeForm.name);
                                    if (["Wife", "Mother", "Sister", "Daughter"].includes(rel)) setNewDepGender("Female");
                                    else setNewDepGender("Male");
                                  }}
                                  style={{
                                    background: newDepRelation === rel ? "#0284c7" : "#f1f5f9",
                                    color: newDepRelation === rel ? "#ffffff" : (alreadyAdded ? "#1e40af" : "#334155"),
                                    border: newDepRelation === rel ? "1px solid #0284c7" : (alreadyAdded ? "1px solid #bfdbfe" : "1px solid #cbd5e1"),
                                    borderRadius: "4px",
                                    padding: "3px 9px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                  }}
                                  title={`Select ${rel}`}
                                >
                                  {rel} {alreadyAdded ? "✓" : ""}
                                </button>
                              );
                            })}
                          </div>

                          {/* Quick Beneficiary Adder Row */}
                          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                              Add Beneficiary as <strong>{newDepRelation}</strong>:
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 42px", gap: "6px" }}>
                              <input
                                type="text"
                                value={newDepName}
                                onChange={e => setNewDepName(e.target.value.toUpperCase())}
                                placeholder="Beneficiary Full Name"
                                style={{ ...inp, padding: "4px 8px", fontSize: "11px", textTransform: "uppercase" }}
                              />
                              <input
                                type="number"
                                min="1"
                                max="110"
                                value={newDepAge}
                                onChange={e => setNewDepAge(Number(e.target.value) || 1)}
                                placeholder="Age"
                                style={{ ...inp, padding: "4px 4px", fontSize: "11px", textAlign: "center" }}
                              />
                              <button
                                type="button"
                                onClick={() => handleAddDependent(newDepRelation)}
                                style={{ ...btn("#16a34a"), padding: "0", fontSize: "11px", justifyContent: "center" }}
                                title="Add to List"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Enrolled Beneficiaries List */}
                          <div style={{ flex: 1, minHeight: "180px", maxHeight: "240px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                            {(!contractEmployeeForm.dependents || contractEmployeeForm.dependents.length === 0) ? (
                              <div style={{ padding: "30px 10px", textAlign: "center", color: "#94a3b8", fontSize: "11px" }}>
                                No beneficiaries added yet. Select a relationship above and add family members.
                              </div>
                            ) : (
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                                <thead>
                                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase" }}>
                                    <th style={{ padding: "6px", width: "70px", textAlign: "left" }}>Relation</th>
                                    <th style={{ padding: "6px 8px", textAlign: "left" }}>Name</th>
                                    <th style={{ padding: "6px", width: "40px", textAlign: "center" }}>Age</th>
                                    <th style={{ padding: "6px", width: "30px", textAlign: "center" }}>Del</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {contractEmployeeForm.dependents.map(dep => (
                                    <tr key={dep.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                      <td style={{ padding: "6px" }}>
                                        <span style={{ background: dep.relation === "Self" ? "#dbeafe" : "#f1f5f9", color: dep.relation === "Self" ? "#1e40af" : "#334155", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                                          {dep.relation}
                                        </span>
                                      </td>
                                      <td style={{ padding: "6px 8px", fontWeight: "700", color: "#0f172a" }}>
                                        {dep.name || "(Name Pending)"}
                                      </td>
                                      <td style={{ padding: "6px", textAlign: "center", color: "#64748b" }}>
                                        {dep.age || "-"}
                                      </td>
                                      <td style={{ padding: "6px", textAlign: "center" }}>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveDependent(dep.id)}
                                          style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", padding: "2px" }}
                                          title="Remove Dependent"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ─── EXACT LEGACY BOTTOM ACTION TOOLBAR (Image Bottom Buttons) ─── */}
                      <div style={{ position: "sticky", bottom: 0, background: "#ffffff", zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", paddingTop: "12px", paddingBottom: "12px", borderTop: "2px solid #cbd5e1", boxShadow: "0 -4px 16px rgba(0,0,0,0.12)" }}>
                        {/* Left Buttons: New | Save | List | Delete */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={handleNewEmployee}
                            style={{ ...btn("#475569"), fontSize: "12px", padding: "7px 14px", fontWeight: "700" }}
                            title="New Blank Employee Form"
                          >
                            New
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEmployeeRecord}
                            style={{ ...btn("var(--color-primary)"), fontSize: "12px", padding: "7px 16px", fontWeight: "800" }}
                            title="Save / Update Employee"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setContractEmpViewMode("list")}
                            style={{ ...btn("#0284c7"), fontSize: "12px", padding: "7px 14px", fontWeight: "700" }}
                            title="View Employee Directory"
                          >
                            List
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEmployeeRecord(contractEmployeeForm)}
                            disabled={!editingContractEmpId}
                            style={{ ...btn("#dc2626"), fontSize: "12px", padding: "7px 14px", opacity: !editingContractEmpId ? 0.5 : 1 }}
                            title="Delete this Employee"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetTransferCompany(contractEmployeeForm.contractCompany);
                              setShowTransferCompanyModal(true);
                            }}
                            style={{ ...btn("#d97706"), fontSize: "12px", padding: "7px 14px", fontWeight: "700" }}
                            title="Transfer to Other Company"
                          >
                            Transfer Company
                          </button>
                        </div>

                        {/* Right Buttons: < | > | Print | Bill in POS | Close */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => handleNavigateEmployee("prev")}
                            style={{ ...btn("#475569"), fontSize: "12px", padding: "7px 10px" }}
                            title="Previous Employee"
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavigateEmployee("next")}
                            style={{ ...btn("#475569"), fontSize: "12px", padding: "7px 10px" }}
                            title="Next Employee"
                          >
                            <ChevronRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={handlePrintEmployeeCard}
                            style={{ ...btn("#334155"), fontSize: "12px", padding: "7px 14px" }}
                            title="Print Medical Benefit Card"
                          >
                            <Printer size={13} /> Print Card
                          </button>
                          <button
                            type="button"
                            onClick={handleBillContractEmployeeInPOS}
                            style={{ ...btn("#16a34a"), fontSize: "12px", padding: "7px 14px", fontWeight: "800" }}
                            title="Bill under Corporate Contract in Sales POS"
                          >
                            <ShoppingCart size={13} /> Bill in POS
                          </button>
                          <button
                            type="button"
                            onClick={() => setContractEmpViewMode("list")}
                            style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "12px", padding: "7px 14px" }}
                            title="Close Employee Form"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═══════════════════════════════════════════════════════════
                      MODAL: TRANSFER TO OTHER COMPANY (Image Special Feature)
                  ═══════════════════════════════════════════════════════════ */}
                  {showTransferCompanyModal && (
                    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                      <div style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 40px rgba(0,0,0,0.25)", overflow: "hidden", animation: "fadeIn 0.15s ease-out" }}>
                        <div style={{ padding: "14px 20px", background: "#0f172a", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontWeight: "800", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>🏢</span> Transfer Employee to Other Company
                          </div>
                          <button onClick={() => setShowTransferCompanyModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
                            <X size={16} />
                          </button>
                        </div>

                        <div style={{ padding: "20px" }}>
                          <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "14px", fontSize: "12px" }}>
                            <div>Employee: <strong style={{ color: "#0f172a" }}>{contractEmployeeForm.name} ({contractEmployeeForm.code})</strong></div>
                            <div style={{ marginTop: "4px" }}>Current Company: <strong style={{ color: "#0284c7" }}>{contractEmployeeForm.contractCompany}</strong></div>
                          </div>

                          <label style={lbl}>Select New Target Contract Company: *</label>
                          <select
                            value={targetTransferCompany}
                            onChange={e => setTargetTransferCompany(e.target.value)}
                            style={{ ...inp, height: "38px", fontWeight: "700", marginBottom: "14px", width: "100%" }}
                          >
                            <option value="">-- Choose Target Company --</option>
                            {companyOptions.map(comp => (
                              <option key={comp} value={comp} disabled={comp === contractEmployeeForm.contractCompany}>
                                {comp} {comp === contractEmployeeForm.contractCompany ? "(Current)" : ""}
                              </option>
                            ))}
                          </select>

                          <div style={{ fontSize: "11px", color: "#64748b", background: "#fffbeb", padding: "10px", borderRadius: "6px", border: "1px solid #fde68a" }}>
                            ⚠️ Note: All registered family beneficiaries and active prescription entitlements will be transferred to the new corporate company ledger.
                          </div>
                        </div>

                        <div style={{ padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setShowTransferCompanyModal(false)}
                            style={{ ...btn("var(--color-border)", "var(--color-text-dark)"), fontSize: "12px", padding: "6px 14px" }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleExecuteCompanyTransfer}
                            style={{ ...btn("#d97706"), fontSize: "12px", padding: "6px 18px", fontWeight: "800" }}
                          >
                            Confirm Transfer 🏢
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ═════════════════════════════════════════════════════════════
                OTHER MASTERS (System Lookup Masters 101 to 119)
                Pure English UI - Matching Inventory Light Theme
            ═════════════════════════════════════════════════════════════ */}
            {ownerSubTab === "other_masters" && (() => {
              const activeCat = OTHER_MASTER_CATEGORIES.find(c => c.code === selectedOtherMasterCode) || OTHER_MASTER_CATEGORIES[6]; // default 107
              const currentEntries = otherMastersData[selectedOtherMasterCode] || [];
              
              // Filter categories by search
              const catQ = (otherMasterCategorySearch || "").trim().toLowerCase();
              const filteredCats = OTHER_MASTER_CATEGORIES.filter(c => {
                if (!catQ) return true;
                return c.code.toLowerCase().includes(catQ) || c.name.toLowerCase().includes(catQ) || c.desc.toLowerCase().includes(catQ);
              });

              // Filter entries by search
              const entryQ = (otherMasterEntrySearch || "").trim().toLowerCase();
              const filteredEntries = currentEntries.filter((item: any) => {
                if (!entryQ) return true;
                return (
                  String(item.srNo).includes(entryQ) ||
                  (item.name || "").toLowerCase().includes(entryQ) ||
                  (item.description || "").toLowerCase().includes(entryQ) ||
                  (item.createdAt || "").toLowerCase().includes(entryQ)
                );
              });

              const totalSystemEntries = Object.values(otherMastersData).reduce((sum: number, list: any) => sum + (Array.isArray(list) ? list.length : 0), 0);

              const handleSelectAll = (e: any) => {
                if (e.target.checked) {
                  setSelectedMasterEntryIds(filteredEntries.map((it: any) => it.id));
                } else {
                  setSelectedMasterEntryIds([]);
                }
              };

              const handleToggleSelect = (id: string) => {
                setSelectedMasterEntryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
              };

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", animation: "fadeIn 0.2s ease-in" }}>
                  {/* TOP HEADER BAR */}
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    padding: "16px 20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px"
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "24px" }}>📑</span>
                        <div>
                          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                            Other Masters Configuration
                            <span style={{ fontSize: "11px", fontWeight: "700", background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: "12px" }}>
                              GST Ver. 1005A
                            </span>
                          </h2>
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                            Lic To: SHIV DHARA MEDICAL STORE : 2026 - 2027 &nbsp;•&nbsp; 17 System Master Categories &nbsp;•&nbsp; Total {totalSystemEntries} active entries
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button
                        onClick={() => setShowOtherMasterPrintModal(true)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          borderRadius: "6px",
                          background: "#0284c7",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "700",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                        }}
                      >
                        🖨️ Print Master List
                      </button>
                      <button
                        onClick={handleResetOtherMasterDefaults}
                        title="Reset current category to standard pharmacy entries"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          background: "#f1f5f9",
                          color: "#475569",
                          fontSize: "12px",
                          fontWeight: "700",
                          border: "1px solid #cbd5e1",
                          cursor: "pointer"
                        }}
                      >
                        ↺ Reset Defaults
                      </button>
                      <button
                        onClick={() => setOwnerSubTab("accounts")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          background: "#f8fafc",
                          color: "#64748b",
                          fontSize: "12px",
                          fontWeight: "700",
                          border: "1px solid #e2e8f0",
                          cursor: "pointer"
                        }}
                      >
                        ✕ Close
                      </button>
                    </div>
                  </div>

                  {/* 2-COLUMN WORKSPACE: LEFT (70% ENTRIES & FORM) | RIGHT (30% MASTER DATA LIST) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", alignItems: "start" }}>
                    
                    {/* LEFT PANEL: ENTRY WORKBENCH & CURRENT TABLE */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      
                      {/* ENTRY FORM CARD */}
                      <div style={{
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        padding: "18px 20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "20px" }}>{activeCat.icon}</span>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Code #{activeCat.code} &nbsp;•&nbsp; {editingMasterEntryId ? "EDIT ENTRY" : "NEW ENTRY"}
                              </div>
                              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                                Entry for : {activeCat.name}
                              </h3>
                            </div>
                          </div>
                          {editingMasterEntryId && (
                            <button
                              onClick={handleCancelOtherMasterEdit}
                              style={{
                                padding: "4px 10px",
                                background: "#fef2f2",
                                color: "#ef4444",
                                border: "1px solid #fecaca",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer"
                              }}
                            >
                              ✕ Cancel Edit
                            </button>
                          )}
                        </div>

                        <form onSubmit={handleAddOrUpdateOtherMasterEntry} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                                Add New Entry / Name <span style={{ color: "#ef4444" }}>*</span>
                              </label>
                              <input
                                type="text"
                                value={newMasterEntryName}
                                onChange={(e) => setNewMasterEntryName(e.target.value)}
                                placeholder={"Enter " + activeCat.name.toLowerCase() + " name..."}
                                autoFocus
                                style={{
                                  width: "100%",
                                  padding: "9px 12px",
                                  border: "1.5px solid #cbd5e1",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  color: "#0f172a",
                                  outline: "none",
                                  background: "#ffffff",
                                  boxSizing: "border-box"
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                                Description / Notes
                              </label>
                              <input
                                type="text"
                                value={newMasterEntryDesc}
                                onChange={(e) => setNewMasterEntryDesc(e.target.value)}
                                placeholder="Additional details, code, or description..."
                                style={{
                                  width: "100%",
                                  padding: "9px 12px",
                                  border: "1.5px solid #cbd5e1",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  color: "#0f172a",
                                  outline: "none",
                                  background: "#ffffff",
                                  boxSizing: "border-box"
                                }}
                              />
                            </div>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              {activeCat.desc}
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                type="submit"
                                style={{
                                  padding: "9px 20px",
                                  borderRadius: "6px",
                                  background: editingMasterEntryId ? "#0284c7" : "#16a34a",
                                  color: "#ffffff",
                                  fontWeight: "800",
                                  fontSize: "13px",
                                  border: "none",
                                  cursor: "pointer",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px"
                                }}
                              >
                                {editingMasterEntryId ? "💾 Update Entry" : "➕ Add Entry"}
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>

                      {/* DATA TABLE CARD */}
                      <div style={{
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        padding: "16px 20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                      }}>
                        {/* TABLE TOOLBAR */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ position: "relative", width: "260px" }}>
                              <input
                                type="text"
                                value={otherMasterEntrySearch}
                                onChange={(e) => setOtherMasterEntrySearch(e.target.value)}
                                placeholder={"Search in " + activeCat.name + "..."}
                                style={{
                                  width: "100%",
                                  padding: "7px 10px 7px 30px",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5e1",
                                  fontSize: "12px",
                                  outline: "none",
                                  boxSizing: "border-box"
                                }}
                              />
                              <span style={{ position: "absolute", left: "9px", top: "7px", fontSize: "13px", color: "#94a3b8" }}>🔍</span>
                            </div>
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                              Showing {filteredEntries.length} of {currentEntries.length} entries
                            </span>
                          </div>

                          {/* ACTION BUTTONS */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {selectedMasterEntryIds.length > 0 && (
                              <button
                                onClick={handleDeleteSelectedOtherMasterEntries}
                                style={{
                                  padding: "6px 12px",
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  border: "1px solid #fecaca",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                🗑️ Delete Selected ({selectedMasterEntryIds.length})
                              </button>
                            )}
                            <button
                              onClick={handleDeleteAllOtherMasterEntries}
                              style={{
                                padding: "6px 12px",
                                background: "#fff1f2",
                                color: "#e11d48",
                                border: "1px solid #ffe4e6",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              ⚠️ Delete All
                            </button>
                          </div>
                        </div>

                        {/* TABLE */}
                        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflowY: "auto", maxHeight: "calc(100vh - 430px)" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                            <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc" }}>
                              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                                <th style={{ padding: "10px 12px", width: "36px", textAlign: "center" }}>
                                  <input
                                    type="checkbox"
                                    checked={filteredEntries.length > 0 && selectedMasterEntryIds.length === filteredEntries.length}
                                    onChange={handleSelectAll}
                                  />
                                </th>
                                <th style={{ padding: "10px 12px", width: "60px", color: "#475569", fontWeight: "700" }}>Sr No.</th>
                                <th style={{ padding: "10px 12px", color: "#475569", fontWeight: "700" }}>Description / Value</th>
                                <th style={{ padding: "10px 12px", color: "#475569", fontWeight: "700" }}>Notes / Extra Details</th>
                                <th style={{ padding: "10px 12px", width: "100px", color: "#475569", fontWeight: "700" }}>Created</th>
                                <th style={{ padding: "10px 12px", width: "110px", color: "#475569", fontWeight: "700", textAlign: "center" }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredEntries.length === 0 ? (
                                <tr>
                                  <td colSpan={6} style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
                                    <div style={{ fontWeight: "700", fontSize: "14px", color: "#475569" }}>No entries found</div>
                                    <div style={{ fontSize: "12px", marginTop: "4px" }}>
                                      Use the form above to add your first entry for {activeCat.name}
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                filteredEntries.map((item: any) => {
                                  const isSelected = selectedMasterEntryIds.includes(item.id);
                                  const isEditing = editingMasterEntryId === item.id;
                                  return (
                                    <tr
                                      key={item.id}
                                      style={{
                                        borderBottom: "1px solid #f1f5f9",
                                        background: isEditing ? "#eff6ff" : isSelected ? "#f8fafc" : "#ffffff",
                                        transition: "background 0.15s"
                                      }}
                                    >
                                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => handleToggleSelect(item.id)}
                                        />
                                      </td>
                                      <td style={{ padding: "10px 12px", fontWeight: "700", color: "#64748b" }}>
                                        #{item.srNo}
                                      </td>
                                      <td style={{ padding: "10px 12px", fontWeight: "700", color: "#0f172a" }}>
                                        {item.name}
                                      </td>
                                      <td style={{ padding: "10px 12px", color: "#475569" }}>
                                        {item.description || <span style={{ color: "#cbd5e1" }}>-</span>}
                                      </td>
                                      <td style={{ padding: "10px 12px", color: "#64748b", fontSize: "11.5px" }}>
                                        {item.createdAt || "-"}
                                      </td>
                                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                        <div style={{ display: "inline-flex", gap: "6px" }}>
                                          <button
                                            onClick={() => handleEditOtherMasterEntry(item)}
                                            title="Edit this entry"
                                            style={{
                                              padding: "4px 8px",
                                              background: "#f1f5f9",
                                              color: "#0284c7",
                                              border: "1px solid #cbd5e1",
                                              borderRadius: "4px",
                                              fontSize: "11px",
                                              fontWeight: "700",
                                              cursor: "pointer"
                                            }}
                                          >
                                            ✏️ Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteOtherMasterEntry(item.id, item.name)}
                                            title="Delete this entry"
                                            style={{
                                              padding: "4px 8px",
                                              background: "#fef2f2",
                                              color: "#ef4444",
                                              border: "1px solid #fecaca",
                                              borderRadius: "4px",
                                              fontSize: "11px",
                                              fontWeight: "700",
                                              cursor: "pointer"
                                            }}
                                          >
                                            🗑️
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

                        {/* FOOTER BAR MATCHING LEGACY FORM BUTTONS */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                          <div style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ padding: "2px 6px", background: "#f1f5f9", borderRadius: "4px", fontWeight: "700", border: "1px solid #e2e8f0" }}>F1</span>
                            <span>Click any category on the right master data list to switch tables</span>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => {
                                if (filteredEntries.length > 0) {
                                  handleDeleteOtherMasterEntry(filteredEntries[0].id, filteredEntries[0].name);
                                } else {
                                  alert("No entry to delete in this view.");
                                }
                              }}
                              style={{
                                padding: "7px 14px",
                                background: "#f1f5f9",
                                color: "#475569",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer"
                              }}
                            >
                              Delete
                            </button>
                            <button
                              onClick={handleDeleteAllOtherMasterEntries}
                              style={{
                                padding: "7px 14px",
                                background: "#fee2e2",
                                color: "#b91c1c",
                                border: "1px solid #fca5a5",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer"
                              }}
                            >
                              Delete All
                            </button>
                            <button
                              onClick={() => setOwnerSubTab("accounts")}
                              style={{
                                padding: "7px 16px",
                                background: "#334155",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "6px",
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

                    </div>

                    {/* RIGHT PANEL: MASTER DATA LIST (: Master Data List :) */}
                    <div style={{
                      background: "#ffffff",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      padding: "16px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                            Navigation Index
                          </div>
                          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
                            : Master Data List :
                          </h4>
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "700", background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: "10px" }}>
                          {OTHER_MASTER_CATEGORIES.length} Tables
                        </span>
                      </div>

                      {/* SEARCH CATEGORY */}
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          value={otherMasterCategorySearch}
                          onChange={(e) => setOtherMasterCategorySearch(e.target.value)}
                          placeholder="Filter master categories..."
                          style={{
                            width: "100%",
                            padding: "7px 10px 7px 28px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "12px",
                            outline: "none",
                            boxSizing: "border-box"
                          }}
                        />
                        <span style={{ position: "absolute", left: "8px", top: "7px", fontSize: "12px", color: "#94a3b8" }}>🔍</span>
                      </div>

                      {/* LIST OF 17 MASTER TABLES */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "calc(100vh - 230px)", overflowY: "auto", paddingRight: "4px" }}>
                        {filteredCats.map((cat) => {
                          const isSelected = cat.code === selectedOtherMasterCode;
                          const count = (otherMastersData[cat.code] || []).length;
                          return (
                            <button
                              key={cat.code}
                              onClick={() => {
                                setSelectedOtherMasterCode(cat.code);
                                handleCancelOtherMasterEdit();
                                setSelectedMasterEntryIds([]);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: "6px",
                                border: isSelected ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                                background: isSelected ? "#eff6ff" : "#ffffff",
                                color: isSelected ? "#1d4ed8" : "#334155",
                                fontWeight: isSelected ? "800" : "600",
                                fontSize: "12px",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.15s ease",
                                boxShadow: isSelected ? "0 1px 3px rgba(37, 99, 235, 0.15)" : "none"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{
                                  fontSize: "11px",
                                  fontWeight: "800",
                                  fontFamily: "monospace",
                                  background: isSelected ? "#2563eb" : "#f1f5f9",
                                  color: isSelected ? "#ffffff" : "#64748b",
                                  padding: "2px 6px",
                                  borderRadius: "4px"
                                }}>
                                  {cat.code}
                                </span>
                                <span>{cat.name}</span>
                              </div>
                              <span style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                background: isSelected ? "#dbeafe" : "#f1f5f9",
                                color: isSelected ? "#1e40af" : "#64748b",
                                padding: "2px 6px",
                                borderRadius: "10px"
                              }}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* QUICK STATS IN RIGHT BAR */}
                      <div style={{ background: "#f8fafc", borderRadius: "6px", padding: "10px", border: "1px solid #e2e8f0", fontSize: "11.5px", color: "#64748b" }}>
                        <div style={{ fontWeight: "700", color: "#334155", marginBottom: "4px" }}>System Master Tip:</div>
                        All entries configured here automatically populate dropdowns in Sales, Purchase, Patient, Doctor, and Inventory modules.
                      </div>
                    </div>

                  </div>

                  {/* PRINT MODAL */}
                  {showOtherMasterPrintModal && (
                    <div style={{
                      position: "fixed",
                      inset: 0,
                      background: "rgba(15, 23, 42, 0.65)",
                      backdropFilter: "blur(3px)",
                      zIndex: 9999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "20px"
                    }}>
                      <div style={{
                        background: "#ffffff",
                        borderRadius: "12px",
                        maxWidth: "750px",
                        width: "100%",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        padding: "24px"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0f172a", paddingBottom: "12px", marginBottom: "16px" }}>
                          <div>
                            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "#0f172a" }}>
                              SHIV DHARA MEDICAL STORE
                            </h2>
                            <div style={{ fontSize: "12px", color: "#475569" }}>
                              Official Master Data Directory &nbsp;•&nbsp; Category #{activeCat.code}: {activeCat.name}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", fontSize: "11px", color: "#64748b" }}>
                            Date: {new Date().toLocaleDateString("en-GB")}<br />
                            GST Ver. 1005A
                          </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                            <thead>
                              <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #cbd5e1" }}>
                                <th style={{ padding: "8px 10px", textAlign: "left", width: "60px" }}>Sr No.</th>
                                <th style={{ padding: "8px 10px", textAlign: "left" }}>Name / Value</th>
                                <th style={{ padding: "8px 10px", textAlign: "left" }}>Description / Extra Details</th>
                                <th style={{ padding: "8px 10px", textAlign: "left", width: "90px" }}>Created Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentEntries.map((it: any) => (
                                <tr key={it.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                  <td style={{ padding: "8px 10px", fontWeight: "700" }}>#{it.srNo}</td>
                                  <td style={{ padding: "8px 10px", fontWeight: "700", color: "#0f172a" }}>{it.name}</td>
                                  <td style={{ padding: "8px 10px", color: "#475569" }}>{it.description || "-"}</td>
                                  <td style={{ padding: "8px 10px", color: "#64748b" }}>{it.createdAt || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                          <button
                            onClick={() => window.print()}
                            style={{
                              padding: "8px 16px",
                              background: "#0284c7",
                              color: "#ffffff",
                              borderRadius: "6px",
                              border: "none",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            🖨️ Print Now
                          </button>
                          <button
                            onClick={() => setShowOtherMasterPrintModal(false)}
                            style={{
                              padding: "8px 16px",
                              background: "#f1f5f9",
                              color: "#475569",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
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


            {/* ═════════════════════════════════════════════════════════════
                ACCOUNT GROUP MASTER (Chart of Groups 1 to 6)
                Pure English UI - Matching Inventory Light Theme
            ═════════════════════════════════════════════════════════════ */}
            {ownerSubTab === "account_groups" && (() => {
              // Filter
              const q = (accountGroupSearch || "").trim().toLowerCase();
              let filtered = (accountGroups || []).filter((g: any) => {
                if (accountGroupTypeFilter !== "All" && String(g.typeId) !== accountGroupTypeFilter) return false;
                if (!q) return true;
                return (
                  String(g.srNo).includes(q) ||
                  (g.name || "").toLowerCase().includes(q) ||
                  String(g.seq).includes(q) ||
                  (g.description || "").toLowerCase().includes(q)
                );
              });

              // Sort
              if (accountGroupSort === "name_asc") {
                filtered = [...filtered].sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
              } else if (accountGroupSort === "name_desc") {
                filtered = [...filtered].sort((a: any, b: any) => (b.name || "").localeCompare(a.name || ""));
              } else if (accountGroupSort === "seq_asc") {
                filtered = [...filtered].sort((a: any, b: any) => (Number(a.seq) || 0) - (Number(b.seq) || 0));
              } else {
                filtered = [...filtered].sort((a: any, b: any) => (Number(a.srNo) || 0) - (Number(b.srNo) || 0));
              }

              const handleSelectAll = (e: any) => {
                if (e.target.checked) {
                  setSelectedAccountGroupIds(filtered.map((g: any) => g.id));
                } else {
                  setSelectedAccountGroupIds([]);
                }
              };

              const handleToggleSelect = (id: string) => {
                setSelectedAccountGroupIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
              };

              const getTypeObj = (typeId: number) => {
                return ACCOUNT_GROUP_TYPES.find(t => t.id === Number(typeId)) || ACCOUNT_GROUP_TYPES[0];
              };

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", animation: "fadeIn 0.2s ease-in" }}>
                  {/* TOP HEADER BAR */}
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    padding: "16px 20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px"
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "24px" }}>📊</span>
                        <div>
                          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                            Account Group Master
                            <span style={{ fontSize: "11px", fontWeight: "700", background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "12px" }}>
                              GST Ver. 1005A
                            </span>
                          </h2>
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                            Lic To: SHIV DHARA MEDICAL STORE : 2026 - 2027 &nbsp;•&nbsp; Chart of Financial & Ledger Account Groups ({accountGroups.length} configured)
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {accountGroups.length === 0 && (
                        <button
                          onClick={handleLoadStandardAccountGroups}
                          title="Click to populate standard pharmaceutical account groups"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 14px",
                            borderRadius: "6px",
                            background: "#059669",
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: "700",
                            border: "none",
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                          }}
                        >
                          ⚡ Load Standard Groups
                        </button>
                      )}
                      <button
                        onClick={() => setShowAccountGroupPrintModal(true)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          borderRadius: "6px",
                          background: "#0284c7",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "700",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                        }}
                      >
                        🖨️ Print Groups Directory
                      </button>
                      <button
                        onClick={() => setOwnerSubTab("accounts")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          background: "#f8fafc",
                          color: "#64748b",
                          fontSize: "12px",
                          fontWeight: "700",
                          border: "1px solid #e2e8f0",
                          cursor: "pointer"
                        }}
                      >
                        ✕ Close
                      </button>
                    </div>
                  </div>

                  {/* LEGEND BAR MATCHING LEGACY HEADER: Type 1-Liabilities, 2-Assets, 3-Expense, 4-Income, 5-Trading Expense, 6-Trading Income */}
                  <div style={{
                    background: "#0f172a",
                    color: "#ffffff",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", textTransform: "uppercase", color: "#94a3b8" }}>
                      <span>🏷️ ACCOUNT TYPES:</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      {ACCOUNT_GROUP_TYPES.map(t => (
                        <div
                          key={t.id}
                          onClick={() => setAccountGroupTypeFilter(accountGroupTypeFilter === String(t.id) ? "All" : String(t.id))}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: accountGroupTypeFilter === String(t.id) ? t.bg : "rgba(255,255,255,0.08)",
                            color: accountGroupTypeFilter === String(t.id) ? t.color : "#cbd5e1",
                            border: accountGroupTypeFilter === String(t.id) ? ("1px solid " + t.color) : "1px solid rgba(255,255,255,0.15)",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                        >
                          <span style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: t.color,
                            color: "#ffffff",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: "800"
                          }}>
                            {t.id}
                          </span>
                          <span>{t.name}</span>
                          {accountGroupTypeFilter === String(t.id) && <span style={{ fontSize: "10px" }}>✓</span>}
                        </div>
                      ))}
                      {accountGroupTypeFilter !== "All" && (
                        <button
                          onClick={() => setAccountGroupTypeFilter("All")}
                          style={{
                            background: "transparent",
                            color: "#f87171",
                            border: "1px dashed #f87171",
                            borderRadius: "4px",
                            padding: "3px 8px",
                            fontSize: "10.5px",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                        >
                          Clear Filter
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ENTRY FORM CARD (Add / Edit) */}
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    padding: "18px 20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "20px" }}>{editingAccountGroupId ? "✏️" : "➕"}</span>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            {editingAccountGroupId ? "EDITING EXISTING GROUP" : "NEW ACCOUNT GROUP DEFINITION"}
                          </div>
                          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                            {editingAccountGroupId ? ("Edit: " + newAccGroupName) : "Add New Account Group"}
                          </h3>
                        </div>
                      </div>

                      {editingAccountGroupId && (
                        <button
                          onClick={handleCancelAccountGroupEdit}
                          style={{
                            padding: "4px 10px",
                            background: "#fef2f2",
                            color: "#ef4444",
                            border: "1px solid #fecaca",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                        >
                          ✕ Cancel Edit
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleAddOrUpdateAccountGroup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr", gap: "14px", alignItems: "end" }}>
                        
                        {/* GROUP NAME */}
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                            Group Name <span style={{ color: "#ef4444" }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={newAccGroupName}
                            onChange={(e) => setNewAccGroupName(e.target.value)}
                            placeholder="e.g. BANK ACCOUNT, SUNDRY DEBTORS..."
                            autoFocus
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              border: "1.5px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "13px",
                              color: "#0f172a",
                              fontWeight: "700",
                              textTransform: "uppercase",
                              outline: "none",
                              background: "#ffffff",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>

                        {/* GROUP TYPE (1 to 6) */}
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                            Group Type (1 to 6) <span style={{ color: "#ef4444" }}>*</span>
                          </label>
                          <select
                            value={newAccGroupType}
                            onChange={(e) => setNewAccGroupType(Number(e.target.value))}
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              border: "1.5px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "13px",
                              color: "#0f172a",
                              outline: "none",
                              background: "#ffffff",
                              boxSizing: "border-box",
                              cursor: "pointer"
                            }}
                          >
                            {ACCOUNT_GROUP_TYPES.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* SEQ NUMBER */}
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                            Seq- No.
                          </label>
                          <input
                            type="number"
                            value={newAccGroupSeq}
                            onChange={(e) => setNewAccGroupSeq(Number(e.target.value))}
                            placeholder="0"
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              border: "1.5px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "13px",
                              color: "#0f172a",
                              outline: "none",
                              background: "#ffffff",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>

                        {/* IN GROUP (PARENT / SUBGROUP) */}
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                            In Group (Parent)
                          </label>
                          <select
                            value={newAccGroupParent}
                            onChange={(e) => setNewAccGroupParent(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              border: "1.5px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "13px",
                              color: "#0f172a",
                              outline: "none",
                              background: "#ffffff",
                              boxSizing: "border-box",
                              cursor: "pointer"
                            }}
                          >
                            <option value="0">0 - Primary / Root Group</option>
                            {accountGroups
                              .filter((g: any) => g.id !== editingAccountGroupId)
                              .map((g: any) => (
                                <option key={g.id} value={g.name}>
                                  {g.name}
                                </option>
                              ))}
                          </select>
                        </div>

                      </div>

                      {/* DESCRIPTION / NOTES & SUBMIT BUTTON */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "14px", alignItems: "center", paddingTop: "4px" }}>
                        <div>
                          <input
                            type="text"
                            value={newAccGroupDesc}
                            onChange={(e) => setNewAccGroupDesc(e.target.value)}
                            placeholder="Optional notes, accounting balance sheet remarks, or tax schedule..."
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "12px",
                              color: "#334155",
                              outline: "none",
                              background: "#f8fafc",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="submit"
                            style={{
                              padding: "9px 24px",
                              borderRadius: "6px",
                              background: editingAccountGroupId ? "#0284c7" : "#16a34a",
                              color: "#ffffff",
                              fontWeight: "800",
                              fontSize: "13px",
                              border: "none",
                              cursor: "pointer",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            {editingAccountGroupId ? "💾 Update Group" : "➕ Ok / Add Group"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* DATA TABLE CARD */}
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    padding: "16px 20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                  }}>
                    {/* TABLE TOOLBAR */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ position: "relative", width: "260px" }}>
                          <input
                            type="text"
                            value={accountGroupSearch}
                            onChange={(e) => setAccountGroupSearch(e.target.value)}
                            placeholder="Search account group name, seq..."
                            style={{
                              width: "100%",
                              padding: "7px 10px 7px 30px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "12px",
                              outline: "none",
                              boxSizing: "border-box"
                            }}
                          />
                          <span style={{ position: "absolute", left: "9px", top: "7px", fontSize: "13px", color: "#94a3b8" }}>🔍</span>
                        </div>
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                          Showing {filtered.length} of {accountGroups.length} groups
                        </span>
                      </div>

                      {/* SORT & BULK ACTIONS */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {/* SORT BUTTONS MATCHING SCREENSHOT (A-Z, Z-A) */}
                        <div style={{ display: "inline-flex", borderRadius: "6px", border: "1px solid #cbd5e1", overflow: "hidden" }}>
                          <button
                            onClick={() => setAccountGroupSort("name_asc")}
                            title="Sort Alphabetically A to Z"
                            style={{
                              padding: "6px 12px",
                              background: accountGroupSort === "name_asc" ? "#2563eb" : "#f8fafc",
                              color: accountGroupSort === "name_asc" ? "#ffffff" : "#475569",
                              border: "none",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            A-Z
                          </button>
                          <button
                            onClick={() => setAccountGroupSort("name_desc")}
                            title="Sort Alphabetically Z to A"
                            style={{
                              padding: "6px 12px",
                              background: accountGroupSort === "name_desc" ? "#2563eb" : "#f8fafc",
                              color: accountGroupSort === "name_desc" ? "#ffffff" : "#475569",
                              borderLeft: "1px solid #cbd5e1",
                              borderRight: "1px solid #cbd5e1",
                              borderTop: "none",
                              borderBottom: "none",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            Z-A
                          </button>
                          <button
                            onClick={() => setAccountGroupSort("seq_asc")}
                            title="Sort by Sequence"
                            style={{
                              padding: "6px 10px",
                              background: accountGroupSort === "seq_asc" ? "#2563eb" : "#f8fafc",
                              color: accountGroupSort === "seq_asc" ? "#ffffff" : "#475569",
                              border: "none",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            Seq
                          </button>
                        </div>

                        {selectedAccountGroupIds.length > 0 && (
                          <button
                            onClick={handleDeleteSelectedAccountGroups}
                            style={{
                              padding: "6px 12px",
                              background: "#fef2f2",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            🗑️ Delete Selected ({selectedAccountGroupIds.length})
                          </button>
                        )}

                        <button
                          onClick={handleDeleteAllAccountGroups}
                          style={{
                            padding: "6px 12px",
                            background: "#fff1f2",
                            color: "#e11d48",
                            border: "1px solid #ffe4e6",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          ⚠️ Delete All
                        </button>
                      </div>
                    </div>

                    {/* TABLE */}
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflowY: "auto", maxHeight: "calc(100vh - 420px)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                        <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc" }}>
                          <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                            <th style={{ padding: "10px 12px", width: "36px", textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={filtered.length > 0 && selectedAccountGroupIds.length === filtered.length}
                                onChange={handleSelectAll}
                              />
                            </th>
                            <th style={{ padding: "10px 12px", width: "60px", color: "#475569", fontWeight: "700" }}>Sr No.</th>
                            <th style={{ padding: "10px 12px", color: "#475569", fontWeight: "700" }}>Group Name</th>
                            <th style={{ padding: "10px 12px", width: "180px", color: "#475569", fontWeight: "700" }}>Group Type</th>
                            <th style={{ padding: "10px 12px", width: "80px", color: "#475569", fontWeight: "700", textAlign: "center" }}>Seq-</th>
                            <th style={{ padding: "10px 12px", width: "150px", color: "#475569", fontWeight: "700" }}>In Group</th>
                            <th style={{ padding: "10px 12px", color: "#475569", fontWeight: "700" }}>Description</th>
                            <th style={{ padding: "10px 12px", width: "110px", color: "#475569", fontWeight: "700", textAlign: "center" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.length === 0 ? (
                            <tr>
                              <td colSpan={8} style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                                <div style={{ fontSize: "36px", marginBottom: "8px" }}>📊</div>
                                <div style={{ fontWeight: "800", fontSize: "15px", color: "#334155" }}>
                                  {accountGroups.length === 0 ? "No Account Groups Added Yet" : "No matching groups found"}
                                </div>
                                <div style={{ fontSize: "12px", marginTop: "4px", color: "#64748b" }}>
                                  {accountGroups.length === 0 ? "Use the form above to add your custom account groups, or click 'Load Standard Groups'." : "Try changing your search keywords or type filter."}
                                </div>
                                {accountGroups.length === 0 && (
                                  <div style={{ marginTop: "14px" }}>
                                    <button
                                      onClick={handleLoadStandardAccountGroups}
                                      style={{
                                        padding: "8px 16px",
                                        background: "#2563eb",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        cursor: "pointer"
                                      }}
                                    >
                                      ⚡ Load Standard Groups Preset
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ) : (
                            filtered.map((item: any) => {
                              const isSelected = selectedAccountGroupIds.includes(item.id);
                              const isEditing = editingAccountGroupId === item.id;
                              const typeObj = getTypeObj(item.typeId);
                              return (
                                <tr
                                  key={item.id}
                                  style={{
                                    borderBottom: "1px solid #f1f5f9",
                                    background: isEditing ? "#eff6ff" : isSelected ? "#f8fafc" : "#ffffff",
                                    transition: "background 0.15s"
                                  }}
                                >
                                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleSelect(item.id)}
                                    />
                                  </td>
                                  <td style={{ padding: "10px 12px", fontWeight: "700", color: "#64748b" }}>
                                    #{item.srNo}
                                  </td>
                                  <td style={{ padding: "10px 12px", fontWeight: "800", color: "#0f172a" }}>
                                    {item.name}
                                  </td>
                                  <td style={{ padding: "10px 12px" }}>
                                    <span style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      padding: "3px 8px",
                                      borderRadius: "6px",
                                      background: typeObj.bg,
                                      color: typeObj.color,
                                      border: "1px solid " + typeObj.border,
                                      fontSize: "11px",
                                      fontWeight: "800"
                                    }}>
                                      <span>{typeObj.id}</span>
                                      <span>•</span>
                                      <span>{typeObj.name}</span>
                                    </span>
                                  </td>
                                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: "700", color: "#334155" }}>
                                    {item.seq ?? 0}
                                  </td>
                                  <td style={{ padding: "10px 12px", color: "#64748b", fontSize: "12px" }}>
                                    {item.inGroup && item.inGroup !== "0" ? (
                                      <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#334155", fontWeight: "600" }}>
                                        ↳ {item.inGroup}
                                      </span>
                                    ) : (
                                      <span style={{ color: "#94a3b8" }}>0 (Root)</span>
                                    )}
                                  </td>
                                  <td style={{ padding: "10px 12px", color: "#475569", fontSize: "12px" }}>
                                    {item.description || <span style={{ color: "#cbd5e1" }}>-</span>}
                                  </td>
                                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                    <div style={{ display: "inline-flex", gap: "6px" }}>
                                      <button
                                        onClick={() => handleEditAccountGroup(item)}
                                        title="Edit this account group"
                                        style={{
                                          padding: "4px 8px",
                                          background: "#f1f5f9",
                                          color: "#0284c7",
                                          border: "1px solid #cbd5e1",
                                          borderRadius: "4px",
                                          fontSize: "11px",
                                          fontWeight: "700",
                                          cursor: "pointer"
                                        }}
                                      >
                                        ✏️ Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAccountGroup(item.id, item.name)}
                                        title="Delete this account group"
                                        style={{
                                          padding: "4px 8px",
                                          background: "#fef2f2",
                                          color: "#ef4444",
                                          border: "1px solid #fecaca",
                                          borderRadius: "4px",
                                          fontSize: "11px",
                                          fontWeight: "700",
                                          cursor: "pointer"
                                        }}
                                      >
                                        🗑️
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

                    {/* BOTTOM FOOTER BAR MATCHING LEGACY FORM BUTTONS */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Total <strong>{filtered.length}</strong> Groups displayed &nbsp;•&nbsp; Sorted by <strong>{accountGroupSort.toUpperCase()}</strong>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => {
                            if (filtered.length > 0) {
                              handleDeleteAccountGroup(filtered[0].id, filtered[0].name);
                            } else {
                              alert("No account group to delete.");
                            }
                          }}
                          style={{
                            padding: "7px 14px",
                            background: "#f1f5f9",
                            color: "#475569",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                        >
                          Delete Group
                        </button>
                        <button
                          onClick={handleDeleteAllAccountGroups}
                          style={{
                            padding: "7px 14px",
                            background: "#fee2e2",
                            color: "#b91c1c",
                            border: "1px solid #fca5a5",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                        >
                          Delete All
                        </button>
                        <button
                          onClick={() => setOwnerSubTab("accounts")}
                          style={{
                            padding: "7px 16px",
                            background: "#334155",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
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

                  {/* PRINT MODAL FOR ACCOUNT GROUPS DIRECTORY */}
                  {showAccountGroupPrintModal && (
                    <div style={{
                      position: "fixed",
                      inset: 0,
                      background: "rgba(15, 23, 42, 0.65)",
                      backdropFilter: "blur(3px)",
                      zIndex: 9999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "20px"
                    }}>
                      <div style={{
                        background: "#ffffff",
                        borderRadius: "12px",
                        maxWidth: "800px",
                        width: "100%",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        padding: "24px"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0f172a", paddingBottom: "12px", marginBottom: "16px" }}>
                          <div>
                            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "#0f172a" }}>
                              SHIV DHARA MEDICAL STORE
                            </h2>
                            <div style={{ fontSize: "12px", color: "#475569" }}>
                              Official Chart of Accounts &amp; Financial Groups Directory
                            </div>
                          </div>
                          <div style={{ textAlign: "right", fontSize: "11px", color: "#64748b" }}>
                            Date: {new Date().toLocaleDateString("en-GB")}<br />
                            GST Ver. 1005A
                          </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                            <thead>
                              <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #cbd5e1" }}>
                                <th style={{ padding: "8px 10px", textAlign: "left", width: "50px" }}>Sr.</th>
                                <th style={{ padding: "8px 10px", textAlign: "left" }}>Group Name</th>
                                <th style={{ padding: "8px 10px", textAlign: "left", width: "140px" }}>Type</th>
                                <th style={{ padding: "8px 10px", textAlign: "center", width: "60px" }}>Seq</th>
                                <th style={{ padding: "8px 10px", textAlign: "left", width: "120px" }}>In Group</th>
                                <th style={{ padding: "8px 10px", textAlign: "left" }}>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {accountGroups.map((it: any) => {
                                const typeObj = getTypeObj(it.typeId);
                                return (
                                  <tr key={it.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                    <td style={{ padding: "8px 10px", fontWeight: "700" }}>#{it.srNo}</td>
                                    <td style={{ padding: "8px 10px", fontWeight: "700", color: "#0f172a" }}>{it.name}</td>
                                    <td style={{ padding: "8px 10px" }}>{typeObj.label}</td>
                                    <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "600" }}>{it.seq ?? 0}</td>
                                    <td style={{ padding: "8px 10px", color: "#64748b" }}>{it.inGroup && it.inGroup !== "0" ? it.inGroup : "0"}</td>
                                    <td style={{ padding: "8px 10px", color: "#475569" }}>{it.description || "-"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                          <button
                            onClick={() => window.print()}
                            style={{
                              padding: "8px 16px",
                              background: "#0284c7",
                              color: "#ffffff",
                              borderRadius: "6px",
                              border: "none",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            🖨️ Print Now
                          </button>
                          <button
                            onClick={() => setShowAccountGroupPrintModal(false)}
                            style={{
                              padding: "8px 16px",
                              background: "#f1f5f9",
                              color: "#475569",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
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



            {/* ═════════════════════════════════════════════════════════════
                GENERIC GROUP ITEM LIST (Molecule & Brand Cross-Index)
                Pure English UI - Matching Inventory Light Theme
            ═════════════════════════════════════════════════════════════ */}
            {ownerSubTab === "generic_group_items" && (() => {
              // Prepare enriched item list combining items from context with generic/schedule attributes
              const inventoryList = (items && items.length > 0) ? items : [
                {
                  id: "gen-1",
                  srNo: 1,
                  name: "Zerodol-P Tablet (10 Tab)",
                  company: "Ipca Laboratories Ltd",
                  generic: "ACECLOFENAC + PARACETAMOL (100MG + 325MG)",
                  supplier: "Shivam Pharma Distribution",
                  category: "Ethical",
                  division: "Tablets",
                  breakSale: "Yes",
                  rxRequired: true,
                  taxPercent: 12,
                  stock: 150,
                  unit: "Strip",
                  mrp: 68.50,
                  rate: 49.00,
                  schedule: "Schedule H",
                  tbItem: false,
                  discountAllowed: true,
                  discountPercent: 10
                },
                {
                  id: "gen-2",
                  srNo: 2,
                  name: "Augmentin 625 Duo Tablet (10 Tab)",
                  company: "GlaxoSmithKline Pharmaceuticals",
                  generic: "AMOXICILLIN + CLAVULANIC ACID (625MG)",
                  supplier: "Royal Healthcare Agency",
                  category: "Ethical",
                  division: "Tablets",
                  breakSale: "No",
                  rxRequired: true,
                  taxPercent: 12,
                  stock: 80,
                  unit: "Strip",
                  mrp: 204.00,
                  rate: 155.00,
                  schedule: "Schedule H1",
                  tbItem: false,
                  discountAllowed: false,
                  discountPercent: 0
                },
                {
                  id: "gen-3",
                  srNo: 3,
                  name: "Pan-D Capsule (15 Cap)",
                  company: "Alkem Laboratories Ltd",
                  generic: "PANTOPRAZOLE + DOMPERIDONE (40MG + 30MG)",
                  supplier: "Shreeji Medico Syndicate",
                  category: "Ethical",
                  division: "Capsules",
                  breakSale: "Yes",
                  rxRequired: true,
                  taxPercent: 12,
                  stock: 120,
                  unit: "Strip",
                  mrp: 199.00,
                  rate: 142.00,
                  schedule: "Schedule H",
                  tbItem: false,
                  discountAllowed: true,
                  discountPercent: 12
                },
                {
                  id: "gen-4",
                  srNo: 4,
                  name: "Dolo 650 Tablet (15 Tab)",
                  company: "Micro Labs Ltd",
                  generic: "PARACETAMOL 650 MG",
                  supplier: "Apex Surgical Supplies",
                  category: "OTC",
                  division: "Tablets",
                  breakSale: "Yes",
                  rxRequired: false,
                  taxPercent: 12,
                  stock: 350,
                  unit: "Strip",
                  mrp: 34.00,
                  rate: 26.50,
                  schedule: "General",
                  tbItem: false,
                  discountAllowed: true,
                  discountPercent: 5
                },
                {
                  id: "gen-5",
                  srNo: 5,
                  name: "Akilozox Tablet (10 Tab)",
                  company: "Torrent Pharmaceuticals",
                  generic: "ACECLOFENAC + PARACETAMOL + CHLORZOXAZONE",
                  supplier: "Shivam Pharma Distribution",
                  category: "Ethical",
                  division: "Tablets",
                  breakSale: "Yes",
                  rxRequired: true,
                  taxPercent: 12,
                  stock: 95,
                  unit: "Strip",
                  mrp: 115.00,
                  rate: 82.00,
                  schedule: "Schedule H",
                  tbItem: false,
                  discountAllowed: true,
                  discountPercent: 10
                },
                {
                  id: "gen-6",
                  srNo: 6,
                  name: "Forecox 4-FDC Tablet (3 Tab blister)",
                  company: "Macleods Pharmaceuticals",
                  generic: "RIFAMPICIN + ISONIAZID + PYRAZINAMIDE + ETHAMBUTOL",
                  supplier: "State DOTS Depot",
                  category: "Ethical",
                  division: "Tablets",
                  breakSale: "No",
                  rxRequired: true,
                  taxPercent: 5,
                  stock: 200,
                  unit: "Blister",
                  mrp: 45.00,
                  rate: 32.00,
                  schedule: "Schedule H1",
                  tbItem: true,
                  discountAllowed: false,
                  discountPercent: 0
                },
                {
                  id: "gen-7",
                  srNo: 7,
                  name: "Montair-LC Tablet (10 Tab)",
                  company: "Cipla Ltd",
                  generic: "LEVOCETIRIZINE + MONTELUKAST (5MG + 10MG)",
                  supplier: "Royal Healthcare Agency",
                  category: "Ethical",
                  division: "Tablets",
                  breakSale: "Yes",
                  rxRequired: true,
                  taxPercent: 12,
                  stock: 140,
                  unit: "Strip",
                  mrp: 220.00,
                  rate: 165.00,
                  schedule: "Schedule H",
                  tbItem: false,
                  discountAllowed: true,
                  discountPercent: 8
                },
                {
                  id: "gen-8",
                  srNo: 8,
                  name: "Glycomet-GP 2 Tablet (15 Tab)",
                  company: "USV Private Limited",
                  generic: "GLIMEPIRIDE + METFORMIN (2MG + 500MG)",
                  supplier: "MedPlus Dealers",
                  category: "Ethical",
                  division: "Tablets",
                  breakSale: "Yes",
                  rxRequired: true,
                  taxPercent: 12,
                  stock: 110,
                  unit: "Strip",
                  mrp: 158.00,
                  rate: 118.00,
                  schedule: "Schedule H",
                  tbItem: false,
                  discountAllowed: true,
                  discountPercent: 10
                },
                {
                  id: "gen-9",
                  srNo: 9,
                  name: "Azithral 500 Tablet (5 Tab)",
                  company: "Alembic Pharmaceuticals Ltd",
                  generic: "AZITHROMYCIN 500 MG",
                  supplier: "Shivam Pharma Distribution",
                  category: "Ethical",
                  division: "Tablets",
                  breakSale: "No",
                  rxRequired: true,
                  taxPercent: 12,
                  stock: 65,
                  unit: "Strip",
                  mrp: 132.00,
                  rate: 98.00,
                  schedule: "Schedule H1",
                  tbItem: false,
                  discountAllowed: false,
                  discountPercent: 0
                },
                {
                  id: "gen-10",
                  srNo: 10,
                  name: "Telma 40 Tablet (30 Tab)",
                  company: "Glenmark Pharmaceuticals",
                  generic: "TELMISARTAN 40 MG",
                  supplier: "Shreeji Medico Syndicate",
                  category: "Ethical",
                  division: "Tablets",
                  breakSale: "Yes",
                  rxRequired: true,
                  taxPercent: 12,
                  stock: 90,
                  unit: "Strip",
                  mrp: 260.00,
                  rate: 195.00,
                  schedule: "Schedule H",
                  tbItem: false,
                  discountAllowed: true,
                  discountPercent: 12
                }
              ];

              // Filtering logic
              const dgQuery = (genericDrugGroupSearch || "").trim().toLowerCase();
              const prodQuery = (genericProductNameSearch || "").trim().toLowerCase();

              const filteredItems = inventoryList.filter((item: any) => {
                // Drug Group filter
                if (dgQuery) {
                  const gen = (item.generic || item.molecule || item.drugGroup || "").toLowerCase();
                  if (!gen.includes(dgQuery)) return false;
                }

                // Product name filter
                if (prodQuery) {
                  const name = (item.name || "").toLowerCase();
                  const comp = (item.company || item.mfg || "").toLowerCase();
                  if (!name.includes(prodQuery) && !comp.includes(prodQuery)) return false;
                }

                // Category filter
                if (genericCategoryFilter !== "All" && (item.category || "Ethical") !== genericCategoryFilter) {
                  return false;
                }

                // Rx required filter
                if (genericRxOnlyFilter && !item.rxRequired) return false;

                // No discount filter
                if (genericNoDiscountFilter && (item.discountAllowed !== false && Number(item.discountPercent || 0) > 0)) {
                  return false;
                }

                // TB item filter
                if (genericTbOnlyFilter && !item.tbItem) return false;

                // Schedule drug filter
                if (genericScheduleOnlyFilter && (!item.schedule || item.schedule === "General")) return false;

                // Stock filter
                if (genericStockOnlyFilter && Number(item.stock || 0) <= 0) return false;

                return true;
              });

              // Autocomplete suggestions for Drug Group input
              const suggestedDrugGroups = COMMON_DRUG_GROUPS.filter(dg => {
                if (!dgQuery) return true;
                return dg.toLowerCase().includes(dgQuery);
              }).slice(0, 10);

              const handleClearAllFilters = () => {
                setGenericDrugGroupSearch("");
                setGenericProductNameSearch("");
                setGenericCategoryFilter("All");
                setGenericDiscountInput("");
                setGenericRxOnlyFilter(false);
                setGenericNoDiscountFilter(false);
                setGenericTbOnlyFilter(false);
                setGenericScheduleOnlyFilter(false);
                setGenericStockOnlyFilter(false);
                showToast("All filters cleared!");
              };

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", animation: "fadeIn 0.2s ease-in" }}>
                  
                  {/* TOP HEADER BAR */}
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    padding: "16px 20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px"
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "24px" }}>💊</span>
                        <div>
                          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                            Generic Group Item List
                            <span style={{ fontSize: "11px", fontWeight: "700", background: "#f3e8ff", color: "#7e22ce", padding: "2px 8px", borderRadius: "12px" }}>
                              GST Ver. 1005A
                            </span>
                          </h2>
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                            Lic To: SHIV DHARA MEDICAL STORE : 2026 - 2027 &nbsp;•&nbsp; Active Salt / Generic Formulation &amp; Commercial Brand Directory
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button
                        onClick={() => setShowGenericPrintModal(true)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          borderRadius: "6px",
                          background: "#0284c7",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "700",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                        }}
                      >
                        🖨️ Print Directory
                      </button>
                      <button
                        onClick={() => setOwnerSubTab("accounts")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          borderRadius: "6px",
                          background: "#ef4444",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "700",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                        }}
                      >
                        ✕ Close
                      </button>
                    </div>
                  </div>

                  {/* FUNCTION KEY SHORTCUTS STRIP (F3 to F9 matching screenshot) */}
                  <div style={{
                    background: "#0f172a",
                    color: "#ffffff",
                    borderRadius: "8px",
                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                    fontSize: "11.5px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", fontSize: "10.5px" }}>
                      ⚡ QUICK ACCESS:
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        onClick={handleClearAllFilters}
                        style={{ background: "transparent", border: "1px solid #475569", color: "#f8fafc", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "700", fontSize: "11px" }}
                      >
                        <span style={{ color: "#38bdf8" }}>F3</span> Clear All
                      </button>
                      <button
                        onClick={() => setShowGenericDrugDropdown(true)}
                        style={{ background: "transparent", border: "1px solid #475569", color: "#f8fafc", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "700", fontSize: "11px" }}
                      >
                        <span style={{ color: "#38bdf8" }}>F4</span> Generic List
                      </button>
                      <button
                        onClick={() => { setGenericDrugGroupSearch(""); setGenericProductNameSearch(""); }}
                        style={{ background: "transparent", border: "1px solid #475569", color: "#f8fafc", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "700", fontSize: "11px" }}
                      >
                        <span style={{ color: "#38bdf8" }}>F5</span> Item List
                      </button>
                      <button
                        onClick={() => {
                          if (filteredItems.length > 0) setGenericSelectedDetailItem(filteredItems[0]);
                        }}
                        style={{ background: "transparent", border: "1px solid #475569", color: "#f8fafc", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "700", fontSize: "11px" }}
                      >
                        <span style={{ color: "#38bdf8" }}>F6</span> Item Detail
                      </button>
                      <button
                        onClick={() => setGenericStockOnlyFilter(!genericStockOnlyFilter)}
                        style={{
                          background: genericStockOnlyFilter ? "#2563eb" : "transparent",
                          border: "1px solid " + (genericStockOnlyFilter ? "#3b82f6" : "#475569"),
                          color: "#f8fafc",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "700",
                          fontSize: "11px"
                        }}
                      >
                        <span style={{ color: "#38bdf8" }}>F7</span> Stock Detail {genericStockOnlyFilter ? "✓" : ""}
                      </button>
                      <button
                        onClick={() => setOwnerSubTab("suppliers")}
                        style={{ background: "transparent", border: "1px solid #475569", color: "#f8fafc", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "700", fontSize: "11px" }}
                      >
                        <span style={{ color: "#38bdf8" }}>F8</span> Stockiest List
                      </button>
                      <button
                        onClick={() => setOwnerSubTab("companies")}
                        style={{ background: "transparent", border: "1px solid #475569", color: "#f8fafc", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "700", fontSize: "11px" }}
                      >
                        <span style={{ color: "#38bdf8" }}>F9</span> Company List
                      </button>
                    </div>
                  </div>

                  {/* WORKBENCH: TOP INPUTS & RIGHT-HAND CATEGORY BUTTONS */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px", alignItems: "start" }}>
                    
                    {/* LEFT WORKBENCH: DRUGGROUP & PRODUCT NAME INPUTS */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      
                      {/* SEARCH BOX CARD */}
                      <div style={{
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        padding: "16px 20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "14px" }}>
                          
                          {/* DRUGGROUP SEARCH WITH AUTOCOMPLETE POPUP (MATCHING SCREENSHOT) */}
                          <div style={{ position: "relative" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                              DrugGroup : <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>(Molecule Formulation)</span>
                            </label>
                            <div style={{ position: "relative" }}>
                              <input
                                type="text"
                                value={genericDrugGroupSearch}
                                onChange={(e) => {
                                  setGenericDrugGroupSearch(e.target.value);
                                  setShowGenericDrugDropdown(true);
                                }}
                                onFocus={() => setShowGenericDrugDropdown(true)}
                                placeholder="Type molecule: e.g. ACECLOFENAC, PARACETAMOL..."
                                style={{
                                  width: "100%",
                                  padding: "9px 12px 9px 32px",
                                  borderRadius: "6px",
                                  border: "1.5px solid #cbd5e1",
                                  fontSize: "13px",
                                  color: "#0f172a",
                                  fontWeight: "700",
                                  outline: "none",
                                  background: "#ffffff",
                                  boxSizing: "border-box"
                                }}
                              />
                              <span style={{ position: "absolute", left: "10px", top: "9px", fontSize: "13px", color: "#94a3b8" }}>🧪</span>
                              {genericDrugGroupSearch && (
                                <button
                                  type="button"
                                  onClick={() => setGenericDrugGroupSearch("")}
                                  style={{
                                    position: "absolute",
                                    right: "8px",
                                    top: "8px",
                                    background: "#f1f5f9",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "20px",
                                    height: "20px",
                                    fontSize: "10px",
                                    cursor: "pointer",
                                    color: "#64748b"
                                  }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            {/* AUTOCOMPLETE POPUP (MATCHING LEGACY DROP-DOWN IN SCREENSHOT) */}
                            {showGenericDrugDropdown && suggestedDrugGroups.length > 0 && (
                              <div style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                background: "#ffffff",
                                border: "1.5px solid #2563eb",
                                borderRadius: "8px",
                                marginTop: "4px",
                                maxHeight: "240px",
                                overflowY: "auto",
                                zIndex: 1000,
                                boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
                              }}>
                                <div style={{ padding: "6px 10px", background: "#eff6ff", borderBottom: "1px solid #dbeafe", fontSize: "11px", fontWeight: "800", color: "#1d4ed8", display: "flex", justifyContent: "space-between" }}>
                                  <span>SELECT DRUG GROUP MOLECULE</span>
                                  <button
                                    onClick={() => setShowGenericDrugDropdown(false)}
                                    style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "10px", fontWeight: "700" }}
                                  >
                                    CLOSE ✕
                                  </button>
                                </div>
                                {suggestedDrugGroups.map((dg, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      setGenericDrugGroupSearch(dg);
                                      setShowGenericDrugDropdown(false);
                                    }}
                                    style={{
                                      padding: "8px 12px",
                                      borderBottom: "1px solid #f1f5f9",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      fontFamily: "monospace",
                                      color: "#1e293b",
                                      cursor: "pointer",
                                      background: "#ffffff",
                                      transition: "background 0.1s"
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                                  >
                                    • {dg}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* PRODUCT NAME INPUT */}
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                              Product Name : <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>(Brand Medicine)</span>
                            </label>
                            <div style={{ position: "relative" }}>
                              <input
                                type="text"
                                value={genericProductNameSearch}
                                onChange={(e) => setGenericProductNameSearch(e.target.value)}
                                placeholder="Search brand: e.g. Zerodol, Augmentin, Pan-D..."
                                style={{
                                  width: "100%",
                                  padding: "9px 12px 9px 32px",
                                  borderRadius: "6px",
                                  border: "1.5px solid #cbd5e1",
                                  fontSize: "13px",
                                  color: "#0f172a",
                                  outline: "none",
                                  background: "#ffffff",
                                  boxSizing: "border-box"
                                }}
                              />
                              <span style={{ position: "absolute", left: "10px", top: "9px", fontSize: "13px", color: "#94a3b8" }}>🔍</span>
                              {genericProductNameSearch && (
                                <button
                                  type="button"
                                  onClick={() => setGenericProductNameSearch("")}
                                  style={{
                                    position: "absolute",
                                    right: "8px",
                                    top: "8px",
                                    background: "#f1f5f9",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "20px",
                                    height: "20px",
                                    fontSize: "10px",
                                    cursor: "pointer",
                                    color: "#64748b"
                                  }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* DATA TABLE CARD (: Item Detail :) */}
                      <div style={{
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        padding: "16px 20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ padding: "4px 8px", background: "#f3e8ff", color: "#7e22ce", borderRadius: "6px", fontSize: "11px", fontWeight: "800" }}>
                              : Item Detail :
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                              Showing {filteredItems.length} matching pharmaceutical formulations
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "6px" }}>
                            {genericCategoryFilter !== "All" && (
                              <span style={{ fontSize: "11px", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>
                                Category: {genericCategoryFilter}
                              </span>
                            )}
                            {genericRxOnlyFilter && (
                              <span style={{ fontSize: "11px", background: "#ccfbf1", color: "#0f766e", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>
                                Rx Only
                              </span>
                            )}
                            {genericTbOnlyFilter && (
                              <span style={{ fontSize: "11px", background: "#ffe4e6", color: "#be123c", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>
                                TB Regimen
                              </span>
                            )}
                          </div>
                        </div>

                        {/* TABLE WITH PURPLE ACCENT MATCHING SCREENSHOT */}
                        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 350px)" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "900px" }}>
                            <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                              <tr style={{ background: "#7e22ce", color: "#ffffff", textAlign: "left" }}>
                                <th style={{ padding: "9px 10px", width: "45px" }}>Sr.</th>
                                <th style={{ padding: "9px 10px" }}>Message / Item Name</th>
                                <th style={{ padding: "9px 10px" }}>Company</th>
                                <th style={{ padding: "9px 10px" }}>Generic Formulation</th>
                                <th style={{ padding: "9px 10px" }}>Supplier</th>
                                <th style={{ padding: "9px 10px", width: "75px", textAlign: "center" }}>Break Sale</th>
                                <th style={{ padding: "9px 10px", width: "80px", textAlign: "center" }}>Prescription</th>
                                <th style={{ padding: "9px 10px", width: "70px", textAlign: "center" }}>Tax %</th>
                                <th style={{ padding: "9px 10px", width: "75px" }}>Category</th>
                                <th style={{ padding: "9px 10px", width: "70px", textAlign: "right" }}>Stock</th>
                                <th style={{ padding: "9px 10px", width: "75px", textAlign: "right" }}>MRP (₹)</th>
                                <th style={{ padding: "9px 10px", width: "85px", textAlign: "center" }}>Schedule</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredItems.length === 0 ? (
                                <tr>
                                  <td colSpan={12} style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>🔍</div>
                                    <div style={{ fontWeight: "800", fontSize: "15px", color: "#334155" }}>No matching medicines found</div>
                                    <div style={{ fontSize: "12px", marginTop: "4px", color: "#64748b" }}>
                                      Try clearing search filters or pick another molecule.
                                    </div>
                                    <button
                                      onClick={handleClearAllFilters}
                                      style={{ marginTop: "12px", padding: "6px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                    >
                                      Reset All Filters
                                    </button>
                                  </td>
                                </tr>
                              ) : (
                                filteredItems.map((item: any, idx: number) => {
                                  return (
                                    <tr
                                      key={item.id || idx}
                                      onClick={() => setGenericSelectedDetailItem(item)}
                                      style={{
                                        borderBottom: "1px solid #f1f5f9",
                                        background: idx % 2 === 0 ? "#ffffff" : "#fdf4ff",
                                        cursor: "pointer",
                                        transition: "background 0.12s"
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = "#ede9fe")}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#fdf4ff")}
                                    >
                                      <td style={{ padding: "9px 10px", fontWeight: "700", color: "#64748b" }}>
                                        #{idx + 1}
                                      </td>
                                      <td style={{ padding: "9px 10px", fontWeight: "800", color: "#0f172a" }}>
                                        {item.name}
                                        {item.tbItem && (
                                          <span style={{ marginLeft: "6px", fontSize: "10px", background: "#ffe4e6", color: "#be123c", padding: "1px 5px", borderRadius: "4px", fontWeight: "800" }}>
                                            TB
                                          </span>
                                        )}
                                      </td>
                                      <td style={{ padding: "9px 10px", color: "#475569", fontWeight: "600" }}>
                                        {item.company || "Standard Pharma"}
                                      </td>
                                      <td style={{ padding: "9px 10px", color: "#7e22ce", fontWeight: "700", fontFamily: "monospace", fontSize: "11px" }}>
                                        {item.generic || item.molecule || "-"}
                                      </td>
                                      <td style={{ padding: "9px 10px", color: "#64748b" }}>
                                        {item.supplier || "Direct"}
                                      </td>
                                      <td style={{ padding: "9px 10px", textAlign: "center" }}>
                                        <span style={{
                                          padding: "2px 6px",
                                          borderRadius: "4px",
                                          fontSize: "10.5px",
                                          fontWeight: "800",
                                          background: item.breakSale === "Yes" ? "#ecfdf5" : "#f1f5f9",
                                          color: item.breakSale === "Yes" ? "#047857" : "#64748b"
                                        }}>
                                          {item.breakSale || "No"}
                                        </span>
                                      </td>
                                      <td style={{ padding: "9px 10px", textAlign: "center" }}>
                                        <span style={{
                                          padding: "2px 6px",
                                          borderRadius: "4px",
                                          fontSize: "10.5px",
                                          fontWeight: "800",
                                          background: item.rxRequired ? "#eff6ff" : "#f1f5f9",
                                          color: item.rxRequired ? "#1d4ed8" : "#64748b"
                                        }}>
                                          {item.rxRequired ? "Rx" : "OTC"}
                                        </span>
                                      </td>
                                      <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: "700", color: "#334155" }}>
                                        {item.taxPercent ?? 12}%
                                      </td>
                                      <td style={{ padding: "9px 10px", color: "#475569" }}>
                                        {item.category || "Ethical"}
                                      </td>
                                      <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: "800", color: Number(item.stock) > 0 ? "#16a34a" : "#dc2626" }}>
                                        {item.stock} {item.unit || "pcs"}
                                      </td>
                                      <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: "800", color: "#0f172a" }}>
                                        ₹{Number(item.mrp || 0).toFixed(2)}
                                      </td>
                                      <td style={{ padding: "9px 10px", textAlign: "center" }}>
                                        <span style={{
                                          padding: "2px 6px",
                                          borderRadius: "4px",
                                          fontSize: "10.5px",
                                          fontWeight: "800",
                                          background: item.schedule === "Schedule H1" ? "#fef2f2" : item.schedule === "Schedule H" ? "#fffbeb" : "#f1f5f9",
                                          color: item.schedule === "Schedule H1" ? "#b91c1c" : item.schedule === "Schedule H" ? "#b45309" : "#64748b",
                                          border: item.schedule === "Schedule H1" ? "1px solid #fecaca" : "1px solid #e2e8f0"
                                        }}>
                                          {item.schedule || "General"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* BOTTOM ACTIONS BAR MATCHING SCREENSHOT */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                          <div>
                            <button
                              onClick={() => setShowGenericScheduleModal(true)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "7px 14px",
                                borderRadius: "6px",
                                background: "#06b6d4",
                                color: "#ffffff",
                                fontSize: "12px",
                                fontWeight: "800",
                                border: "none",
                                cursor: "pointer",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                              }}
                            >
                              📋 Schedule List Register
                            </button>
                          </div>

                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            Click any medicine row to inspect comprehensive stock &amp; composition details
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* RIGHT-HAND FILTER PANEL MATCHING SCREENSHOT COLOR BUTTONS */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      
                      {/* 1. ALL ITEM WITH SELECT CATEGORY + DISCOUNT (MATCHING SCREENSHOT) */}
                      <div style={{
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        padding: "14px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px"
                      }}>
                        <div style={{
                          padding: "8px 12px",
                          background: "#7c3aed",
                          color: "#ffffff",
                          fontWeight: "800",
                          fontSize: "12px",
                          borderRadius: "6px",
                          textAlign: "center"
                        }}>
                          All Item with Select Category
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            Category
                          </label>
                          <select
                            value={genericCategoryFilter}
                            onChange={(e) => setGenericCategoryFilter(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "12px",
                              outline: "none",
                              background: "#ffffff",
                              cursor: "pointer"
                            }}
                          >
                            <option value="All">All Categories</option>
                            <option value="Ethical">Ethical Prescription</option>
                            <option value="Generic">Generic Medicine</option>
                            <option value="OTC">OTC (Over The Counter)</option>
                            <option value="Surgical">Surgical &amp; Disposables</option>
                            <option value="Ayurvedic">Ayurvedic</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            Discount % Filter
                          </label>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <input
                              type="number"
                              value={genericDiscountInput}
                              onChange={(e) => setGenericDiscountInput(e.target.value)}
                              placeholder="Discount %"
                              style={{
                                flex: 1,
                                padding: "7px 10px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontSize: "12px",
                                outline: "none",
                                background: "#ffffff"
                              }}
                            />
                            <button
                              onClick={() => {
                                if (genericDiscountInput) showToast("Filtered discount >= " + genericDiscountInput + "%");
                              }}
                              style={{
                                padding: "7px 12px",
                                background: "#0284c7",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer"
                              }}
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 2. ALL ITEM WITH RX REQUIRED (CYAN BUTTON MATCHING SCREENSHOT) */}
                      <button
                        onClick={() => setGenericRxOnlyFilter(!genericRxOnlyFilter)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: genericRxOnlyFilter ? "#0891b2" : "#06b6d4",
                          color: "#ffffff",
                          fontSize: "12.5px",
                          fontWeight: "800",
                          border: genericRxOnlyFilter ? "2px solid #155e75" : "none",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(6, 182, 212, 0.25)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span>All Item with Rx Required</span>
                        <span>{genericRxOnlyFilter ? "✓ ON" : "➔"}</span>
                      </button>

                      {/* 3. ALL ITEM WITH NO DISCOUNT (GREEN BUTTON MATCHING SCREENSHOT) */}
                      <button
                        onClick={() => setGenericNoDiscountFilter(!genericNoDiscountFilter)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: genericNoDiscountFilter ? "#059669" : "#10b981",
                          color: "#ffffff",
                          fontSize: "12.5px",
                          fontWeight: "800",
                          border: genericNoDiscountFilter ? "2px solid #065f46" : "none",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(16, 185, 129, 0.25)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span>All Item with No Discount</span>
                        <span>{genericNoDiscountFilter ? "✓ ON" : "➔"}</span>
                      </button>

                      {/* 4. ALL ITEM WITH T.B. ITEM (PINK/ROSE BUTTON MATCHING SCREENSHOT) */}
                      <button
                        onClick={() => setGenericTbOnlyFilter(!genericTbOnlyFilter)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: genericTbOnlyFilter ? "#e11d48" : "#f43f5e",
                          color: "#ffffff",
                          fontSize: "12.5px",
                          fontWeight: "800",
                          border: genericTbOnlyFilter ? "2px solid #9f1239" : "none",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(244, 63, 94, 0.25)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span>All Item with T.B. Item</span>
                        <span>{genericTbOnlyFilter ? "✓ ON" : "➔"}</span>
                      </button>

                      {/* 5. ALL ITEM WITH SCHEDULE DRUG (AMBER/BROWN BUTTON MATCHING SCREENSHOT) */}
                      <button
                        onClick={() => setGenericScheduleOnlyFilter(!genericScheduleOnlyFilter)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: genericScheduleOnlyFilter ? "#b45309" : "#d97706",
                          color: "#ffffff",
                          fontSize: "12.5px",
                          fontWeight: "800",
                          border: genericScheduleOnlyFilter ? "2px solid #78350f" : "none",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(217, 119, 6, 0.25)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span>All Item with Schedule Drug</span>
                        <span>{genericScheduleOnlyFilter ? "✓ ON" : "➔"}</span>
                      </button>

                      {/* RESET FILTERS CARD */}
                      <div style={{
                        background: "#f8fafc",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        padding: "12px",
                        fontSize: "11.5px",
                        color: "#64748b"
                      }}>
                        <div style={{ fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                          Quick Filter Status:
                        </div>
                        Active filters automatically restrict table results for fast counter dispensation and regulatory inspection checks.
                        <button
                          onClick={handleClearAllFilters}
                          style={{
                            marginTop: "8px",
                            width: "100%",
                            padding: "6px",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "4px",
                            fontWeight: "700",
                            color: "#475569",
                            cursor: "pointer"
                          }}
                        >
                          Clear All Filters
                        </button>
                      </div>

                    </div>

                  </div>

                  {/* SCHEDULE DRUG MODAL REGISTER */}
                  {showGenericScheduleModal && (
                    <div style={{
                      position: "fixed",
                      inset: 0,
                      background: "rgba(15, 23, 42, 0.65)",
                      backdropFilter: "blur(3px)",
                      zIndex: 9999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "20px"
                    }}>
                      <div style={{
                        background: "#ffffff",
                        borderRadius: "12px",
                        maxWidth: "850px",
                        width: "100%",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        padding: "24px"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0891b2", paddingBottom: "12px", marginBottom: "16px" }}>
                          <div>
                            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                              <span>📋</span> Schedule H / H1 / X Controlled Drug Register
                            </h2>
                            <div style={{ fontSize: "12px", color: "#475569" }}>
                              Drugs and Cosmetics Rules 1945 Statutory Compliance Log
                            </div>
                          </div>
                          <button
                            onClick={() => setShowGenericScheduleModal(false)}
                            style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontWeight: "800" }}
                          >
                            ✕
                          </button>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                            <thead>
                              <tr style={{ background: "#f0fdfa", borderBottom: "1.5px solid #99f6e4" }}>
                                <th style={{ padding: "8px 10px", textAlign: "left" }}>Medicine Name</th>
                                <th style={{ padding: "8px 10px", textAlign: "left" }}>Generic / Salt</th>
                                <th style={{ padding: "8px 10px", textAlign: "left" }}>Manufacturer</th>
                                <th style={{ padding: "8px 10px", textAlign: "center" }}>Schedule</th>
                                <th style={{ padding: "8px 10px", textAlign: "left" }}>Prescription &amp; Record Rule</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inventoryList.filter((it: any) => it.schedule && it.schedule !== "General").map((it: any, i: number) => (
                                <tr key={it.id || i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                  <td style={{ padding: "8px 10px", fontWeight: "800", color: "#0f172a" }}>{it.name}</td>
                                  <td style={{ padding: "8px 10px", color: "#7e22ce", fontFamily: "monospace" }}>{it.generic}</td>
                                  <td style={{ padding: "8px 10px", color: "#475569" }}>{it.company}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                                    <span style={{
                                      padding: "2px 8px",
                                      borderRadius: "4px",
                                      fontWeight: "800",
                                      fontSize: "11px",
                                      background: it.schedule === "Schedule H1" ? "#fef2f2" : "#fffbeb",
                                      color: it.schedule === "Schedule H1" ? "#b91c1c" : "#b45309"
                                    }}>
                                      {it.schedule}
                                    </span>
                                  </td>
                                  <td style={{ padding: "8px 10px", fontSize: "11.5px", color: "#475569" }}>
                                    {it.schedule === "Schedule H1"
                                      ? "Maintain Register for 3 years (Patient, Doctor, Reg No)"
                                      : "Sell only on Registered Medical Practitioner Rx"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                          <button
                            onClick={() => window.print()}
                            style={{
                              padding: "8px 16px",
                              background: "#0891b2",
                              color: "#ffffff",
                              borderRadius: "6px",
                              border: "none",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            🖨️ Print Schedule Register
                          </button>
                          <button
                            onClick={() => setShowGenericScheduleModal(false)}
                            style={{
                              padding: "8px 16px",
                              background: "#f1f5f9",
                              color: "#475569",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
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

                  {/* ITEM DETAIL QUICK MODAL */}
                  {genericSelectedDetailItem && (
                    <div style={{
                      position: "fixed",
                      inset: 0,
                      background: "rgba(15, 23, 42, 0.65)",
                      backdropFilter: "blur(3px)",
                      zIndex: 9999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "20px"
                    }}>
                      <div style={{
                        background: "#ffffff",
                        borderRadius: "12px",
                        maxWidth: "600px",
                        width: "100%",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        padding: "24px"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#7e22ce", textTransform: "uppercase" }}>
                              {genericSelectedDetailItem.category || "Ethical"} • {genericSelectedDetailItem.schedule || "General"}
                            </div>
                            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
                              {genericSelectedDetailItem.name}
                            </h3>
                          </div>
                          <button
                            onClick={() => setGenericSelectedDetailItem(null)}
                            style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontWeight: "800" }}
                          >
                            ✕
                          </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12.5px", marginBottom: "18px" }}>
                          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>GENERIC FORMULATION</div>
                            <div style={{ fontWeight: "800", color: "#7e22ce", marginTop: "2px" }}>{genericSelectedDetailItem.generic}</div>
                          </div>
                          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>MANUFACTURER COMPANY</div>
                            <div style={{ fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{genericSelectedDetailItem.company}</div>
                          </div>
                          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>CURRENT INVENTORY STOCK</div>
                            <div style={{ fontWeight: "800", color: "#16a34a", fontSize: "14px", marginTop: "2px" }}>
                              {genericSelectedDetailItem.stock} {genericSelectedDetailItem.unit || "pcs"}
                            </div>
                          </div>
                          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>MAX RETAIL PRICE (MRP)</div>
                            <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "14px", marginTop: "2px" }}>
                              ₹{Number(genericSelectedDetailItem.mrp || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                          <button
                            onClick={() => {
                              setGenericSelectedDetailItem(null);
                              setActiveSection("inventory");
                            }}
                            style={{
                              padding: "8px 16px",
                              background: "#2563eb",
                              color: "#ffffff",
                              borderRadius: "6px",
                              border: "none",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            Open in Item Master 📦
                          </button>
                          <button
                            onClick={() => setGenericSelectedDetailItem(null)}
                            style={{
                              padding: "8px 16px",
                              background: "#f1f5f9",
                              color: "#475569",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
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

                  {/* PRINT MODAL */}
                  {showGenericPrintModal && (
                    <div style={{
                      position: "fixed",
                      inset: 0,
                      background: "rgba(15, 23, 42, 0.65)",
                      backdropFilter: "blur(3px)",
                      zIndex: 9999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "20px"
                    }}>
                      <div style={{
                        background: "#ffffff",
                        borderRadius: "12px",
                        maxWidth: "850px",
                        width: "100%",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        padding: "24px"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0f172a", paddingBottom: "12px", marginBottom: "16px" }}>
                          <div>
                            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "#0f172a" }}>
                              SHIV DHARA MEDICAL STORE
                            </h2>
                            <div style={{ fontSize: "12px", color: "#475569" }}>
                              Generic Group Item List Directory
                            </div>
                          </div>
                          <div style={{ textAlign: "right", fontSize: "11px", color: "#64748b" }}>
                            Date: {new Date().toLocaleDateString("en-GB")}<br />
                            GST Ver. 1005A
                          </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px" }}>
                            <thead>
                              <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #cbd5e1" }}>
                                <th style={{ padding: "8px", textAlign: "left", width: "40px" }}>Sr.</th>
                                <th style={{ padding: "8px", textAlign: "left" }}>Product Name</th>
                                <th style={{ padding: "8px", textAlign: "left" }}>Manufacturer</th>
                                <th style={{ padding: "8px", textAlign: "left" }}>Generic Salt Composition</th>
                                <th style={{ padding: "8px", textAlign: "center", width: "60px" }}>Rx</th>
                                <th style={{ padding: "8px", textAlign: "right", width: "70px" }}>MRP</th>
                                <th style={{ padding: "8px", textAlign: "center", width: "80px" }}>Schedule</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredItems.map((it: any, idx: number) => (
                                <tr key={it.id || idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                  <td style={{ padding: "8px", fontWeight: "700" }}>#{idx + 1}</td>
                                  <td style={{ padding: "8px", fontWeight: "700", color: "#0f172a" }}>{it.name}</td>
                                  <td style={{ padding: "8px", color: "#475569" }}>{it.company}</td>
                                  <td style={{ padding: "8px", color: "#7e22ce", fontFamily: "monospace" }}>{it.generic}</td>
                                  <td style={{ padding: "8px", textAlign: "center" }}>{it.rxRequired ? "Yes" : "No"}</td>
                                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "700" }}>₹{Number(it.mrp || 0).toFixed(2)}</td>
                                  <td style={{ padding: "8px", textAlign: "center" }}>{it.schedule || "General"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                          <button
                            onClick={() => window.print()}
                            style={{
                              padding: "8px 16px",
                              background: "#0284c7",
                              color: "#ffffff",
                              borderRadius: "6px",
                              border: "none",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            🖨️ Print Now
                          </button>
                          <button
                            onClick={() => setShowGenericPrintModal(false)}
                            style={{
                              padding: "8px 16px",
                              background: "#f1f5f9",
                              color: "#475569",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
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


          </>
  );
}
}
