# Shiv Dhara Medical Store - Core Architecture & AI System Guidelines (AGENTS.md)

This file contains the persistent system rules, architecture specifications, and design guidelines for **Shiv Dhara Medical Store ERP**.
All AI agents and assistants working on this repository **MUST** read and strictly follow these rules before making any changes.

---

## 1. Core Operating Principles (સખત નિયમો)

1. **Strictly Scope-Bound (જેટલું કહ્યું હોય તેટલું જ કરવું):**
   - Do NOT make extraneous or unrequested changes to any file.
   - Always make edits fast, precise, and targeted to the user's specific request.
   - Preserve existing working logic, comments, and state management.

2. **Single Center Button Rule (બટનનો કાયમી નિયમ):**
   - In all Transaction modules (`Sales Bill`, `Purchase Bill`, `Purchase Challan`, `Purchase Return`, etc.):
     - The **"New Entry / New Bill / New Challan / New Return"** button MUST ONLY appear **ONCE in the CENTER** of the screen when no bill/form is open.
     - **NEVER** add a duplicate "New" button in the top header or toolbar.
     - Do **NOT** clutter headers with duplicate "Browse / List" drawer buttons if the search-to-edit workflow is active.

3. **Theme & Design Consistency (એપની કલર થીમ):**
   - Always match the app's established design tokens and CSS variables:
     - Primary Color: `var(--color-primary)`
     - Background: `#f8fafc` / `#ffffff` with subtle borders (`#cbd5e1`, `var(--color-border)`)
     - Input Elements: use the shared `inp` style from `MedicalStoreContext.tsx`
     - Labels: use the shared `lbl` style
     - Buttons: use the shared `btn(bgColor, textColor)` helper
     - Cards & Panels: use `var(--shadow-card)` or `var(--shadow-sm)`
     - Fonts: `Segoe UI, system-ui, sans-serif`

---

## 2. Technical Stack & Architecture

- **Frontend:** React 18 + TypeScript + Vite (`src/`)
- **State Management:** `src/MedicalStoreContext.tsx` (`MedicalStoreProvider`, `useMedicalStore`)
  - Global caching with `localStorage` fallback and REST API sync with MySQL backend.
- **Backend:** Node.js + Express (`src/server/index.js`), running on port `5000`.
- **Database:** MySQL (`shivdhara_medical_db`) managed via connection pool in `src/server/index.js` and initialized by `src/server/init-db.js`.
- **Desktop Runtime:** Electron support and startup scripts (`START_ADMIN.bat`, `START_SHOP.bat`, `ShivDhara_Medical.bat`).

---

## 3. Directory Structure & Key Files

```
shivdhara-medical/
├── AGENTS.md                         # This persistent rule & knowledge file
├── index.html                        # Main HTML entry point
├── package.json                      # Scripts & dependencies
├── vite.config.js                    # Vite bundler configuration
└── src/
    ├── main.tsx                      # React root rendering
    ├── MedicalStore.tsx              # ErrorBoundary, Updater, Auth views
    ├── MedicalStoreContext.tsx       # Global Context: state, CRUD, configs, styles (inp, lbl, btn)
    ├── OwnerPanel.tsx                # Central ERP Dashboard & all primary screens (1.5MB+)
    ├── PurchaseChallan.tsx           # Purchase Delivery Challan Module
    ├── PurchaseChlnToBill.tsx        # Purchase Challan to Purchase Bill Conversion Module
    ├── SaleTransfer.tsx              # Stock & Sale Transfer Module
    ├── StockEntryItemwise.tsx        # Item-wise Stock Entry & Adjustments
    ├── ApplicationSetupModal.tsx     # Hardware, Dot-matrix, Laser/Thermal printer setup
    ├── components/
    │   └── supervisor/
    │       ├── BillNumberChangeModal.tsx  # Change/Renumber Sales & Purchase Bills
    │       ├── LockBillModal.tsx          # Freeze/Lock historical invoices
    │       ├── DataUtilityModal.tsx       # Database maintenance & data cleanup
    │       ├── MergeFacilityModal.tsx     # Merge duplicate items/accounts
    │       ├── StockRateDetailModal.tsx   # Detailed item purchase/sale rate audit
    │       └── UserwiseChangesModal.tsx   # Audit user activity & bill changes
    └── server/
        ├── index.js                  # Express API server (port 5000)
        ├── init-db.js                # Schema migrations & table initialization
        └── .env                      # Database credentials & port configuration
```

---

## 4. Module-Wise Functional Overview

### A. Transactions (`src/OwnerPanel.tsx` & transaction submodules)
1. **Sales Bill (`activeSection === "sales"`):**
   - Full Retail & Tax POS billing.
   - Batch selection, MRP, PTR, custom discount %, tax breakdown (CGST/SGST/IGST).
   - Cash / Credit / UPI / Cheque payment options.
   - Suspended/Held bills queue (`pendingSalesBills`).
   - Center button: `➕ New Sales Bill` (NO duplicate top button).

2. **Purchase Bill (`activeSection === "purchase"`):**
   - Supplier invoice inward with batch generation, expiry, PTR, MRP.
   - Tax zone auto-detection (SGST/UGST for intrastate, IGST for interstate).
   - Sequential navigation (◀ Prev / Next ▶).
   - Search-to-edit workflow by Bill#, Supplier, or Entry#.
   - Center button: `➕ New Purchase Bill` (NO duplicate top button).

3. **Purchase Challan (`src/PurchaseChallan.tsx`, `activeSection === "purchase_challan"`):**
   - Delivery challan entry for goods received before formal billing.
   - Tracks received batches, in-transit items, and conversion status.
   - Center button: `➕ New Purchase Challan` (NO duplicate top button).

4. **Purchase Chln to Bill (`src/PurchaseChlnToBill.tsx`, `activeSection === "purchase_chln_to_bill"`):**
   - Allows selecting one or multiple unbilled Delivery Challans of a supplier.
   - Automatically merges challan items into a unified Purchase Bill.
   - Calculates taxes, discounts, net payable, and updates challan status to "Converted".

5. **Purchase Return / Debit Note (`activeSection === "purchase_return"`):**
   - Generates debit notes for expired, damaged, or slow-moving items returned to suppliers.
   - Reverse tax calculations and supplier ledger adjustment.
   - Center button: `➕ New Purchase Return` (NO duplicate top button).

6. **Sale Transfer & Stock Entry Itemwise:**
   - Inter-branch or counter sale transfers (`SaleTransfer.tsx`).
   - Physical inventory adjustments & opening balance entries (`StockEntryItemwise.tsx`).

7. **Cash & Bank Management:**
   - Cash vouchers (Receipt & Payment).
   - Bank vouchers (Cheque, NEFT/RTGS, Online).

---

### B. Masters (`src/OwnerPanel.tsx`)
- **Item Master:** Item name, division, company/manufacturer, pack, unit, HSN, barcode, Schedule H, Rx required, TB flag, minimum/maximum stock levels.
- **Account / Supplier Master:** Name, address, GSTIN, DL numbers, credit days, credit limit, opening balance.
- **Doctor Master:** Doctor name, degree, registration number, specialization, clinic address.
- **Company Master & Area Master:** Grouping and territory filtering.

---

### C. Inventory & Reports
- **Stock Status:** Real-time quantity, batch breakdown, PTR valuation, MRP valuation.
- **Expiry Register:** Critical expiry tracking (Expired vs Expiring within 30/60/90 days).
- **Financial Books:** Ledger Account, Day Book, Cash Book, Bank Book, Outstanding Receivables/Payables.
- **GST Reports:** GSTR-1 (Sales), GSTR-2 (Purchases), GSTR-3B monthly summary.

---

### D. Supervisor & Utilities (`src/components/supervisor/`)
- Bill Number Change: reassign sequential numbers safely.
- Lock Bill: lock billing transactions before a cutoff date.
- Merge Facility: merge duplicated items or parties without losing historical transactions.
- Stock Rate Detail & Userwise Changes: full audit trail of edits.

---

### E. Hardware & Printing Configurations (`src/ApplicationSetupModal.tsx`)
- Printers supported: Dot Matrix (EPSON LX-300+ / II), Laser/Inkjet, Thermal 3-inch/2-inch.
- Customizable margins (top, bottom, left), fonts (Courier New, Draft 10cpi, Code 128 barcode).
- Multi-copy settings for original, duplicate, and transport copies.

---

## 5. Standard Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + N` | New Sales Bill |
| `Ctrl + B` | New Purchase Bill |
| `F2` | Save / Submit Current Form |
| `Esc` | Close Modal / Cancel Form |
| `Alt + S` | Open Sales Section |
| `Alt + P` | Open Purchase Section |
| `Alt + I` | Open Item Master |

---

## 6. Guidelines for AI Changes

- **Verification:** Always run `npm run build` (`vite build`) after any code modifications to ensure 0 TypeScript/build errors.
- **Non-Destructive:** Always keep existing functions and handlers intact.
- **Speed & Economy:** Answer directly and accurately without bloating conversations.
