import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './init-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Determine correct database password intelligently
let dbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD.trim() : 'Sakhiya@2112';

try {
  const testConn = await mysql.createConnection({ 
    host: process.env.DB_HOST || 'localhost', 
    user: process.env.DB_USER || 'root', 
    password: dbPassword 
  });
  await testConn.end();
} catch (e) {
  if (e.code === 'ER_ACCESS_DENIED_ERROR') {
    console.log('Access denied with default password. Falling back to empty password for XAMPP...');
    dbPassword = '';
  }
}

// Database connection pool setup (MySQL)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: dbPassword,
  database: process.env.DB_NAME || 'shivdhara_medical_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
// Initialize complete database schema
initDatabase(pool);

// --- AUTO-MIGRATE: Ensure admin_users table exists ---
pool.query(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    pharmacy_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating admin_users table:', err));
;

// â”€â”€â”€ AUTO-MIGRATE: Add missing columns to items table â”€â”€â”€
async function migrateItemsTable() {
  const cols = [
    ['division', 'VARCHAR(100)'],
    ['company', 'VARCHAR(255)'],
    ['gst', 'DECIMAL(10,2) DEFAULT 0'],
    ['cess', 'DECIMAL(10,2) DEFAULT 0'],
    ['discount', 'DECIMAL(10,2) DEFAULT 0'],
    ['minimum', 'INT DEFAULT 5'],
    ['unit', 'VARCHAR(50)'],
    ['pack', 'VARCHAR(50)'],
    ['barcode', 'VARCHAR(100)'],
    ['hsn', 'VARCHAR(50)'],
    ['supplier', 'VARCHAR(255)'],
    ['location', 'VARCHAR(100)'],
    ['itemCategory', 'VARCHAR(100)'],
    ['note', 'TEXT'],
    ['pRate', 'DECIMAL(10,2) DEFAULT 0'],
    ['mrp', 'DECIMAL(10,2) DEFAULT 0'],
  ];
  for (const [col, def] of cols) {
    try {
      await pool.query(`ALTER TABLE items ADD COLUMN \`${col}\` ${def}`);
      console.log(`âœ… items.${col} added`);
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.log(`items.${col}: ${e.code}`);
    }
  }
}
migrateItemsTable().catch(e => console.error('Migration error:', e.message));

// â”€â”€â”€ AUTO-CREATE purchase_challans TABLE â”€â”€â”€
async function ensurePurchaseChallansTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_challans (
        id VARCHAR(64) PRIMARY KEY,
        entry_no VARCHAR(20),
        challan_no VARCHAR(50),
        party_name VARCHAR(200),
        supplier_id VARCHAR(64),
        challan_date DATE,
        entry_date DATE,
        tax_type VARCHAR(30) DEFAULT 'exclusive',
        payment_mode VARCHAR(30) DEFAULT 'cash',
        tax_zone VARCHAR(30) DEFAULT 'sgst_ugst',
        details VARCHAR(500),
        gst_inclusive TINYINT(1) DEFAULT 0,
        gst_on_free TINYINT(1) DEFAULT 0,
        items JSON,
        subtotal DECIMAL(12,2) DEFAULT 0,
        total_gst DECIMAL(12,2) DEFAULT 0,
        total_disc DECIMAL(12,2) DEFAULT 0,
        total DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('âœ… purchase_challans table ready');
  } catch (e) {
    console.error('purchase_challans table error:', e.message);
  }
}
ensurePurchaseChallansTable();

// â”€â”€â”€ API ROUTES FOR PURCHASE CHALLANS â”€â”€â”€

app.get('/api/purchase-challans', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM purchase_challans ORDER BY created_at DESC');
    res.json(rows.map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []),
      challanDate: r.challan_date ? new Date(r.challan_date).toISOString().split('T')[0] : '',
      entryDate: r.entry_date ? new Date(r.entry_date).toISOString().split('T')[0] : '',
      entryNo: r.entry_no,
      challanNo: r.challan_no,
      partyName: r.party_name,
      supplierId: r.supplier_id,
      taxType: r.tax_type,
      paymentMode: r.payment_mode,
      taxZone: r.tax_zone,
      gstInclusive: !!r.gst_inclusive,
      gstOnFree: !!r.gst_on_free,
      totalGst: r.total_gst,
      totalDisc: r.total_disc,
    })));
  } catch (error) {
    console.error('Error fetching purchase challans:', error);
    res.status(500).json({ error: 'Failed to fetch purchase challans' });
  }
});

app.post('/api/purchase-challans', async (req, res) => {
  const { id, entryNo, challanNo, partyName, supplierId, challanDate, entryDate, taxType, paymentMode, taxZone, details, gstInclusive, gstOnFree, items, subtotal, totalGst, totalDisc, total, status } = req.body;
  try {
    await pool.query(
      `INSERT INTO purchase_challans (id, entry_no, challan_no, party_name, supplier_id, challan_date, entry_date, tax_type, payment_mode, tax_zone, details, gst_inclusive, gst_on_free, items, subtotal, total_gst, total_disc, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         entry_no=VALUES(entry_no), challan_no=VALUES(challan_no), party_name=VALUES(party_name),
         supplier_id=VALUES(supplier_id), challan_date=VALUES(challan_date), entry_date=VALUES(entry_date),
         tax_type=VALUES(tax_type), payment_mode=VALUES(payment_mode), tax_zone=VALUES(tax_zone),
         details=VALUES(details), gst_inclusive=VALUES(gst_inclusive), gst_on_free=VALUES(gst_on_free),
         items=VALUES(items), subtotal=VALUES(subtotal), total_gst=VALUES(total_gst),
         total_disc=VALUES(total_disc), total=VALUES(total), status=VALUES(status)`,
      [id, entryNo, challanNo||null, partyName, supplierId||null, challanDate||null, entryDate||null, taxType||'exclusive', paymentMode||'cash', taxZone||'sgst_ugst', details||null, gstInclusive?1:0, gstOnFree?1:0, JSON.stringify(items||[]), subtotal||0, totalGst||0, totalDisc||0, total||0, status||'Pending']
    );
    res.status(201).json({ id, message: 'Purchase challan saved' });
  } catch (error) {
    console.error('Error saving purchase challan:', error);
    res.status(500).json({ error: 'Failed to save purchase challan', details: error.message });
  }
});

app.delete('/api/purchase-challans/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM purchase_challans WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete purchase challan' });
  }
});



// â”€â”€â”€ API ROUTES FOR ITEMS â”€â”€â”€

app.get('/api/items', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM items ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS time');
    res.json({ message: 'MySQL Database connected successfully!', time: rows[0].time });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

app.post('/api/items', async (req, res) => {
  const { name, category, division, company, pRate, mrp, price, gst, cess, discount, stock, minimum, unit, pack, expiryDate, batchNumber, barcode, hsn, manufacturer, supplier, location, itemCategory, note } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Item name is required' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO items (name, category, division, company, pRate, mrp, price, gst, cess, discount, stock, minimum, unit, pack, expiryDate, batchNumber, barcode, hsn, manufacturer, supplier, location, itemCategory, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category||'medicines', division||category||'medicines', company||null, pRate||0, mrp||0, mrp||price||0, gst||0, cess||0, discount||0, stock||0, minimum||5, unit||null, pack||null, expiryDate||null, batchNumber||null, barcode||null, hsn||null, manufacturer||company||null, supplier||null, location||null, itemCategory||null, note||null]
    );
    res.status(201).json({ id: result.insertId, message: 'Item added successfully' });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ error: 'Failed to add item', details: error.message });
  }
});

app.put('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, division, company, pRate, mrp, price, gst, cess, discount, stock, minimum, unit, pack, expiryDate, batchNumber, barcode, hsn, manufacturer, supplier, location, itemCategory, note } = req.body;
  try {
    const [result] = await pool.query(
      `UPDATE items SET name=?, category=?, division=?, company=?, pRate=?, mrp=?, price=?, gst=?, cess=?, discount=?, stock=?, minimum=?, unit=?, pack=?, expiryDate=?, batchNumber=?, barcode=?, hsn=?, manufacturer=?, supplier=?, location=?, itemCategory=?, note=? WHERE id=?`,
      [name, category||'medicines', division||category||'medicines', company||null, pRate||0, mrp||0, mrp||price||0, gst||0, cess||0, discount||0, stock||0, minimum||5, unit||null, pack||null, expiryDate||null, batchNumber||null, barcode||null, hsn||null, manufacturer||company||null, supplier||null, location||null, itemCategory||null, note||null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item', details: error.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM items WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// â”€â”€â”€ API ROUTES FOR SUPPLIERS â”€â”€â”€

app.get('/api/suppliers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

app.post('/api/suppliers', async (req, res) => {
  const { name, address, city, state, contact, mobile, email, gst_tin, dl_no, pan_no, credit_limit, credit_days, opening_balance } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO suppliers (name, address, city, state, contact, mobile, email, gst_tin, dl_no, pan_no, credit_limit, credit_days, opening_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, address, city, state, contact || mobile, mobile || contact, email, gst_tin, dl_no, pan_no, credit_limit, credit_days, opening_balance]
    );
    res.status(201).json({ id: result.insertId, message: 'Supplier added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add supplier' });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, address, city, state, contact, mobile, email, gst_tin, dl_no, pan_no, credit_limit, credit_days, opening_balance } = req.body;
  try {
    await pool.query(
      'UPDATE suppliers SET name=?, address=?, city=?, state=?, contact=?, mobile=?, email=?, gst_tin=?, dl_no=?, pan_no=?, credit_limit=?, credit_days=?, opening_balance=? WHERE id=?',
      [name, address, city, state, contact || mobile, mobile || contact, email, gst_tin, dl_no, pan_no, credit_limit, credit_days, opening_balance, id]
    );
    res.json({ success: true, message: 'Supplier updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// â”€â”€â”€ API ROUTES FOR PURCHASE BILLS â”€â”€â”€

app.get('/api/purchase-bills', async (req, res) => {
  try {
    const [bills] = await pool.query('SELECT * FROM purchase_bills ORDER BY created_at DESC');
    const [items] = await pool.query('SELECT * FROM purchase_invoice_items');
    
    const billsWithItems = bills.map(bill => ({
      ...bill,
      items: items.filter(item => item.purchase_bill_id === bill.id)
    }));
    
    res.json(billsWithItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/purchase-bills', async (req, res) => {
  const { entry_no, party_name, supplier_id, bill_no, bill_date, entry_date, tax_type, payment_mode, remarks, subtotal, total_gst, total_disc, total, status, items } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const formattedBillDate = bill_date ? bill_date.replace('T', ' ').replace(/\..*$/, '').replace('Z', '') : null;
    const formattedEntryDate = entry_date ? entry_date.replace('T', ' ').replace(/\..*$/, '').replace('Z', '') : null;
    const [billResult] = await connection.query(
      'INSERT INTO purchase_bills (entry_no, party_name, supplier_id, bill_no, bill_date, entry_date, tax_type, payment_mode, remarks, subtotal, total_gst, total_disc, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [entry_no, party_name, supplier_id, bill_no, formattedBillDate, formattedEntryDate, tax_type, payment_mode, remarks, subtotal, total_gst, total_disc, total, status]
    );
    const billId = billResult.insertId;

    for (const item of items) {
      const qty = parseInt(item.qty) || 0;
      const freeQty = parseInt(item.freeQty) || 0;
      const totalQty = qty + freeQty;
      const ptr = parseFloat(item.ptr) || 0;
      const mrp = parseFloat(item.mrp) || 0;
      const gst = parseFloat(item.gst) || 0;
      const disc = parseFloat(item.disc) || 0;
      const amt = parseFloat(item.amount) || 0;

      await connection.query(
        'INSERT INTO purchase_invoice_items (purchase_bill_id, itemId, itemName, batchNo, mfgDate, expiryDate, qty, freeQty, ptr, mrp, gst, disc, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [billId, item.itemId, item.itemName, item.batchNo, item.mfgDate, item.expiryDate, qty, freeQty, ptr, mrp, gst, disc, amt]
      );

      const batchId = `${item.itemId}_${item.batchNo || 'NA'}_${billId}`;
      await connection.query(
        'INSERT INTO batches (id, itemId, batchNo, mfgDate, expiryDate, qty, mrp, ptr, gst, purchaseBillId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)',
        [batchId, item.itemId, item.batchNo, item.mfgDate, item.expiryDate, totalQty, mrp, ptr, gst, String(billId)]
      );

      if (item.itemId && !isNaN(item.itemId)) {
        await connection.query(
          'UPDATE items SET stock = stock + ?, pRate = ?, mrp = ? WHERE id = ?',
          [totalQty, ptr, mrp, Number(item.itemId)]
        );
      }
    }

    await connection.commit();
    await logAudit(party_name || 'Admin', 'CREATE_PURCHASE_BILL', `Purchase Invoice #${bill_no || 'NA'} from ${party_name || 'Supplier'} (Total: ₹${total || 0})`, req.ip);
    res.status(201).json({ id: billId, message: 'Purchase bill saved successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Failed' });
  } finally {
    connection.release();
  }
});

app.delete('/api/purchase-bills/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query('SELECT bill_no, party_name, total_amount FROM purchase_bills WHERE id = ?', [req.params.id]);
    await connection.query('DELETE FROM purchase_invoice_items WHERE purchase_bill_id = ?', [req.params.id]);
    await connection.query('DELETE FROM purchase_bills WHERE id = ?', [req.params.id]);
    await connection.commit();
    const pInfo = existing[0] ? `Purchase Bill #${existing[0].bill_no} (${existing[0].party_name}, ₹${existing[0].total_amount})` : `Purchase Bill ID ${req.params.id}`;
    await logAudit('Admin', 'DELETE_PURCHASE_BILL', `${pInfo} was deleted`, req.ip);
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Failed' });
  } finally {
    connection.release();
  }
});

// ─── API ROUTES FOR SALES BILLS ───

app.get('/api/sales-bills', async (req, res) => {
  try {
    const [bills] = await pool.query('SELECT * FROM sales_bills ORDER BY date DESC');
    const [items] = await pool.query('SELECT * FROM sales_invoice_items');
    
    const billsWithItems = bills.map(bill => ({
      ...bill,
      items: items.filter(item => item.sales_bill_id === bill.id)
    }));
    
    res.json(billsWithItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/sales-bills', async (req, res) => {
  const { bill_no, patient_name, patient_area, doctor_name, mobile, address, date, payment_mode, gross_amount, less_disc, net_amount, salesman, refill_date, pay_rec, remarks, status, items, isReturn } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const sign = isReturn ? -1 : 1;

    const formattedDate = date ? date.replace('T', ' ').replace(/\..*$/, '').replace('Z', '') : null;
    const formattedRefillDate = refill_date ? refill_date.split('T')[0] : null;

    const [billResult] = await connection.query(
      'INSERT INTO sales_bills (bill_no, patient_name, patient_area, doctor_name, mobile, address, date, payment_mode, gross_amount, less_disc, net_amount, salesman, refill_date, pay_rec, remarks, status, is_return) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [bill_no, patient_name, patient_area, doctor_name, mobile, address, formattedDate, payment_mode, gross_amount || 0, less_disc || 0, net_amount, salesman, formattedRefillDate, pay_rec || 0, remarks, status, isReturn ? 1 : 0]
    );
    const billId = billResult.insertId;

    for (const item of items) {
      const qty = parseInt(item.qty) || 0;
      const mrp = parseFloat(item.mrp) || 0;
      const rate = parseFloat(item.rate) || 0;
      const gst = parseFloat(item.gst) || 0;
      const disc = parseFloat(item.disc) || 0;
      const amt = parseFloat(item.amount) || 0;

      await connection.query(
        'INSERT INTO sales_invoice_items (sales_bill_id, itemId, itemName, batchNo, qty, mrp, rate, gst, disc, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [billId, item.itemId, item.itemName, item.batchNo, qty, mrp, rate, gst, disc, amt]
      );

      if (item.itemId && !isNaN(item.itemId)) {
        await connection.query(
          'UPDATE items SET stock = stock - ? WHERE id = ?',
          [qty * sign, Number(item.itemId)]
        );
      }
      if (item.batchNo) {
        await connection.query(
          'UPDATE batches SET qty = qty - ? WHERE itemId = ? AND batchNo = ?',
          [qty * sign, item.itemId, item.batchNo]
        );
      }
    }
    await connection.commit();
    await logAudit(salesman || 'Sales POS', isReturn ? 'SALES_RETURN' : 'CREATE_SALES_BILL', `Bill #${bill_no} created for ${patient_name || 'Walk-in'} (Total: ₹${net_amount})`, req.ip);
    res.status(201).json({ id: billId, message: 'Sales bill saved successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Failed' });
  } finally {
    connection.release();
  }
});

app.put('/api/sales-bills/:id', async (req, res) => {
  const billId = req.params.id;
  const { bill_no, patient_name, patient_area, doctor_name, mobile, address, date, payment_mode, gross_amount, less_disc, net_amount, salesman, refill_date, pay_rec, remarks, status, items, isReturn } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Revert previous items' stock
    const [oldBills] = await connection.query('SELECT is_return FROM sales_bills WHERE id = ?', [billId]);
    const oldSign = (oldBills[0] && oldBills[0].is_return) ? -1 : 1;
    const [oldItems] = await connection.query('SELECT itemId, batchNo, qty FROM sales_invoice_items WHERE sales_bill_id = ?', [billId]);
    for (const old of oldItems) {
      const oQty = parseInt(old.qty) || 0;
      if (old.itemId && !isNaN(old.itemId)) {
        await connection.query('UPDATE items SET stock = stock + ? WHERE id = ?', [oQty * oldSign, Number(old.itemId)]);
      }
      if (old.batchNo) {
        await connection.query('UPDATE batches SET qty = qty + ? WHERE itemId = ? AND batchNo = ?', [oQty * oldSign, old.itemId, old.batchNo]);
      }
    }

    // 2. Delete old invoice items
    await connection.query('DELETE FROM sales_invoice_items WHERE sales_bill_id = ?', [billId]);

    // 3. Update sales_bills header
    const sign = isReturn ? -1 : 1;
    const formattedDate = date ? date.replace('T', ' ').replace(/\..*$/, '').replace('Z', '') : null;
    const formattedRefillDate = refill_date ? refill_date.split('T')[0] : null;

    await connection.query(
      'UPDATE sales_bills SET bill_no = ?, patient_name = ?, patient_area = ?, doctor_name = ?, mobile = ?, address = ?, date = ?, payment_mode = ?, gross_amount = ?, less_disc = ?, net_amount = ?, salesman = ?, refill_date = ?, pay_rec = ?, remarks = ?, status = ?, is_return = ? WHERE id = ?',
      [bill_no, patient_name, patient_area, doctor_name, mobile, address, formattedDate, payment_mode, gross_amount || 0, less_disc || 0, net_amount, salesman, formattedRefillDate, pay_rec || 0, remarks, status, isReturn ? 1 : 0, billId]
    );

    // 4. Insert new items and deduct stock
    for (const item of items) {
      const qty = parseInt(item.qty) || 0;
      const mrp = parseFloat(item.mrp) || 0;
      const rate = parseFloat(item.rate) || 0;
      const gst = parseFloat(item.gst) || 0;
      const disc = parseFloat(item.disc) || 0;
      const amt = parseFloat(item.amount) || 0;

      await connection.query(
        'INSERT INTO sales_invoice_items (sales_bill_id, itemId, itemName, batchNo, qty, mrp, rate, gst, disc, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [billId, item.itemId, item.itemName, item.batchNo, qty, mrp, rate, gst, disc, amt]
      );

      if (item.itemId && !isNaN(item.itemId)) {
        await connection.query(
          'UPDATE items SET stock = stock - ? WHERE id = ?',
          [qty * sign, Number(item.itemId)]
        );
      }
      if (item.batchNo) {
        await connection.query(
          'UPDATE batches SET qty = qty - ? WHERE itemId = ? AND batchNo = ?',
          [qty * sign, item.itemId, item.batchNo]
        );
      }
    }

    await connection.commit();
    await logAudit(salesman || 'Sales POS', isReturn ? 'UPDATE_SALES_RETURN' : 'UPDATE_SALES_BILL', `Bill #${bill_no} updated for ${patient_name || 'Walk-in'} (Total: ₹${net_amount})`, req.ip);
    res.json({ id: billId, message: 'Sales bill updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Update sales bill error:', error);
    res.status(500).json({ error: 'Failed' });
  } finally {
    connection.release();
  }
});

app.delete('/api/sales-bills/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query('SELECT bill_no, patient_name, net_amount FROM sales_bills WHERE id = ?', [req.params.id]);
    await connection.query('DELETE FROM sales_invoice_items WHERE sales_bill_id = ?', [req.params.id]);
    await connection.query('DELETE FROM sales_bills WHERE id = ?', [req.params.id]);
    await connection.commit();
    const bInfo = existing[0] ? `Sales Bill #${existing[0].bill_no} (${existing[0].patient_name || 'Walk-in'}, ₹${existing[0].net_amount})` : `Bill ID ${req.params.id}`;
    await logAudit('Admin', 'DELETE_SALES_BILL', `${bInfo} was deleted`, req.ip);
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Failed' });
  } finally {
    connection.release();
  }
});

app.get('/api/payments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payments ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/payments', async (req, res) => {
  const { vch_no, type, date, mode, amount, account_name, supplier_id, bank_name, cheque_no, remark } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO payments (vch_no, type, date, mode, amount, account_name, supplier_id, bank_name, cheque_no, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [vch_no, type, date, mode, amount, account_name, supplier_id, bank_name, cheque_no, remark]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/bank-entries', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bank_entries ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/bank-entries', async (req, res) => {
  const { date, type, account_name, bank, amount, cheque_no, remark } = req.body;
  try {
    const formattedDate = date ? date.split('T')[0] : null;
    const [result] = await pool.query(
      'INSERT INTO bank_entries (date, type, account_name, bank, amount, cheque_no, remark) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [formattedDate, type, account_name, bank, amount, cheque_no, remark]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/khata-entries', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM khata_entries ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/khata-entries', async (req, res) => {
  const { customer_name, customer_phone, amount, paid_amount, note, date, cleared } = req.body;
  try {
    const formattedDate = date ? date.split('T')[0] : null;
    const [result] = await pool.query(
      'INSERT INTO khata_entries (customer_name, customer_phone, amount, paid_amount, note, date, cleared) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [customer_name, customer_phone, amount, paid_amount || 0, note, formattedDate, cleared ? 1 : 0]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.put('/api/khata-entries/:id', async (req, res) => {
  const { id } = req.params;
  const { paid_amount, cleared } = req.body;
  try {
    await pool.query('UPDATE khata_entries SET paid_amount = ?, cleared = ? WHERE id = ?', [paid_amount, cleared ? 1 : 0, id]);
    res.json({ message: 'Success' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/advance-deposits', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM advance_deposits ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/advance-deposits', async (req, res) => {
  const { customer_name, customer_phone, amount, used_amount, note } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO advance_deposits (customer_name, customer_phone, amount, used_amount, note) VALUES (?, ?, ?, ?, ?)',
      [customer_name, customer_phone, amount, used_amount || 0, note]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.delete('/api/advance-deposits/:id', async (req, res) => {
  try { await pool.query('DELETE FROM advance_deposits WHERE id = ?', [req.params.id]); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/doctors/:id', async (req, res) => {
  try { await pool.query('DELETE FROM doctors WHERE id = ?', [req.params.id]); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/customers/:id', async (req, res) => {
  try { await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/payments/:id', async (req, res) => {
  try { await pool.query('DELETE FROM payments WHERE id = ?', [req.params.id]); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/bank-entries/:id', async (req, res) => {
  try { await pool.query('DELETE FROM bank_entries WHERE id = ?', [req.params.id]); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/khata-entries/:id', async (req, res) => {
  try { await pool.query('DELETE FROM khata_entries WHERE id = ?', [req.params.id]); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: 'Failed' }); }
});



app.delete('/api/bundle-offers/:id', async (req, res) => {
  try { await pool.query('DELETE FROM bundle_offers WHERE id = ?', [req.params.id]); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: 'Failed' }); }
});



app.get('/api/doctors', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM doctors ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/doctors', async (req, res) => {
  const { name, speciality, specialization, phone, mobile, email, area, note, address } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO doctors (name, specialization, mobile, email, area, note, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, speciality || specialization || '', phone || mobile || '', email || '', area || '', note || '', address || '']
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  const { id } = req.params;
  const { name, speciality, specialization, phone, mobile, email, area, note, address } = req.body;
  try {
    await pool.query(
      'UPDATE doctors SET name=?, specialization=?, mobile=?, email=?, area=?, note=?, address=? WHERE id=?',
      [name, speciality || specialization || '', phone || mobile || '', email || '', area || '', note || '', address || '', id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, address, role, note, points, created_at FROM customers ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/customers', async (req, res) => {
  const { name, email, phone, address, note, password, role, points } = req.body;
  try {
    const sql = `
      INSERT INTO customers (name, email, phone, address, note, password, role, points) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), address=VALUES(address), password=VALUES(password)
    `;
    await pool.query(sql, [name, (email || '').toUpperCase(), phone || '', address || '', note || '', password || '', role || 'customer', points || 0]);
    const [rows] = await pool.query('SELECT * FROM customers WHERE email = ?', [(email || '').toUpperCase()]);
    res.status(201).json({ id: rows[0] ? rows[0].id : undefined });
  } catch (error) {
    console.error('Customer POST error:', error);
    res.status(500).json({ error: 'Failed', details: error.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, address, note, points } = req.body;
  try {
    await pool.query('UPDATE customers SET name=?, phone=?, address=?, note=?, points=? WHERE id=?', [name, phone, address, note, points || 0, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});



app.get('/api/loyalty-data', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM loyalty_data');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/loyalty-data', async (req, res) => {
  const { email, points, total_earned } = req.body;
  try {
    const sql = `
      INSERT INTO loyalty_data (email, points, total_earned) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE points=VALUES(points), total_earned=VALUES(total_earned)
    `;
    await pool.query(sql, [email, points, total_earned]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/bundle-offers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bundle_offers ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/bundle-offers', async (req, res) => {
  const { id, name, itemNames, discountPct, active } = req.body;
  try {
    const offerId = id || require('crypto').randomUUID();
    const sql = `
      INSERT INTO bundle_offers (id, name, item_names, discount_pct, active) 
      VALUES (?, ?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE name=VALUES(name), item_names=VALUES(item_names), discount_pct=VALUES(discount_pct), active=VALUES(active)
    `;
    await pool.query(sql, [offerId, name || '', itemNames || '', parseFloat(discountPct) || 0, active !== false ? 1 : 0]);
    res.json({ success: true, id: offerId });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.put('/api/bundle-offers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, itemNames, discountPct, active } = req.body;
  try {
    await pool.query('UPDATE bundle_offers SET name=?, item_names=?, discount_pct=?, active=? WHERE id=?', [name || '', itemNames || '', parseFloat(discountPct) || 0, active !== false ? 1 : 0, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/upi-settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM upi_settings');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/upi-settings', async (req, res) => {
  const { upi_id, name, upiId } = req.body;
  try {
    const sql = `
      INSERT INTO upi_settings (id, upi_id, name, active) 
      VALUES (1, ?, ?, 1) 
      ON DUPLICATE KEY UPDATE upi_id=VALUES(upi_id), name=VALUES(name)
    `;
    await pool.query(sql, [upi_id || upiId || '', name || '']);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});



app.get('/api/batches', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM batches ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

app.post('/api/batches', async (req, res) => {
  const { id, itemId, batchNo, mfgDate, expiryDate, qty, mrp, ptr, gst, purchaseBillId, barcode } = req.body;
  try {
    await pool.query(
      `INSERT INTO batches (id, itemId, batchNo, mfgDate, expiryDate, qty, mrp, ptr, gst, purchaseBillId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE batchNo=VALUES(batchNo), mfgDate=VALUES(mfgDate), expiryDate=VALUES(expiryDate), qty=VALUES(qty), mrp=VALUES(mrp), ptr=VALUES(ptr), gst=VALUES(gst), purchaseBillId=VALUES(purchaseBillId)`,
      [id, itemId, batchNo||null, mfgDate||null, expiryDate||null, qty||0, mrp||0, ptr||0, gst||0, purchaseBillId||null]
    );
    // Also update barcode in items table if barcode provided and itemId is numeric
    if (barcode && itemId && !isNaN(itemId)) {
      await pool.query('UPDATE items SET barcode=? WHERE id=? AND (barcode IS NULL OR barcode="")', [barcode, itemId]);
    }
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save batch', details: error.message });
  }
});

app.put('/api/batches/:id', async (req, res) => {
  const { id } = req.params;
  const { itemId, batchNo, mfgDate, expiryDate, qty, mrp, ptr, gst, purchaseBillId } = req.body;
  try {
    await pool.query(
      `UPDATE batches SET itemId=?, batchNo=?, mfgDate=?, expiryDate=?, qty=?, mrp=?, ptr=?, gst=?, purchaseBillId=? WHERE id=?`,
      [itemId, batchNo||null, mfgDate||null, expiryDate||null, qty||0, mrp||0, ptr||0, gst||0, purchaseBillId||null, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update batch', details: error.message });
  }
});

app.delete('/api/batches/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM batches WHERE id=?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete batch' });
  }
});

app.delete('/api/clear-all-data', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const tables = [
      'sales_invoice_items', 'purchase_invoice_items', 'batches',
      'sales_bills', 'purchase_bills', 'payments', 'bank_entries',
      'khata_entries', 'advance_deposits', 'loyalty_data',
      'bundle_offers', 'upi_settings',
      'doctors', 'customers', 'suppliers', 'items'
    ];
    for (const t of tables) {
      await connection.query(`TRUNCATE TABLE ${t}`);
    }
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Failed' });
  } finally {
    connection.release();
  }
});

// â”€â”€â”€ API ROUTES FOR AUTH â”€â”€â”€

app.get('/api/system/status', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id FROM admin_users LIMIT 1");
    res.json({ isSetupComplete: rows.length > 0 });
  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({ error: 'Failed to check system status' });
  }
});

app.post('/api/auth/setup', async (req, res) => {
  const { name, email, password, pharmacyName } = req.body;
  try {
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    const formattedEmail = email.trim().toUpperCase();
    
    // Check if system is already setup
    const [existingAdmin] = await pool.query('SELECT id FROM admin_users LIMIT 1');
    if (existingAdmin.length > 0) return res.status(400).json({ error: 'System is already setup. Please login.' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const sql = `
      INSERT INTO admin_users (name, email, password_hash, pharmacy_name) 
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      name.toUpperCase(), 
      formattedEmail, 
      hashedPassword, 
      pharmacyName || "Shiv Dhara Medical Store"
    ]);

    res.status(201).json({ 
      success: true, 
      user: { id: result.insertId, name: name.toUpperCase(), email: formattedEmail, pharmacyName: pharmacyName || "Shiv Dhara Medical Store" }
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Setup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const formattedEmail = email.trim().toUpperCase();

    const [rows] = await pool.query('SELECT * FROM admin_users WHERE email = ?', [formattedEmail]);
    if (rows.length === 0) return res.status(401).json({ error: 'Incorrect email or password' });

    const user = rows[0];
    
    // Check hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect email or password' });

    // Remove password from response
    delete user.password_hash;
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, pharmacyName: user.pharmacy_name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Old and new passwords are required' });

  try {
    const [rows] = await pool.query('SELECT password_hash FROM admin_users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Old password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ─── AUDIT LOGS API ──────────────────────────────
async function logAudit(userName, action, details, ip = '') {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_name, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [userName || 'System', action, typeof details === 'object' ? JSON.stringify(details) : String(details), ip]
    );
  } catch (e) {
    console.error('Audit log write error:', e.message);
  }
}

app.get('/api/audit-logs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 150');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  const { user_name, action, details } = req.body;
  if (!action) return res.status(400).json({ error: 'Action is required' });
  try {
    await logAudit(user_name, action, details, req.ip);
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// ─── AUTOMATED DATABASE BACKUP API ──────────────────────────────
app.post('/api/backup-db', async (req, res) => {
  try {
    // Check possible backup directories
    let backupDir = 'D:\\Shivdhara_Backups';
    if (!fs.existsSync('D:\\')) {
      backupDir = path.join(process.env.USERPROFILE || 'C:\\Users\\avisa', 'Shivdhara_Backups');
    }
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const tables = ['items', 'batches', 'suppliers', 'purchase_bills', 'purchase_invoice_items', 'sales_bills', 'sales_invoice_items', 'payments', 'bank_entries', 'khata_entries', 'advance_deposits', 'doctors', 'customers', 'loyalty_data', 'bundle_offers', 'upi_settings', 'audit_logs'];
    const backupData = {
      timestamp: new Date().toISOString(),
      database: 'shivdhara_medical_db',
      data: {}
    };

    for (const table of tables) {
      try {
        const [rows] = await pool.query(`SELECT * FROM ${table}`);
        backupData.data[table] = rows;
      } catch (err) {
        console.warn(`Could not backup table ${table}:`, err.message);
      }
    }

    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
    const filename = `shivdhara_backup_${timestampStr}.json`;
    const filePath = path.join(backupDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');

    await logAudit(req.body.user_name || 'Admin', 'DATABASE_BACKUP', `Automated backup created at ${filePath}`, req.ip);

    res.json({ success: true, filePath, filename, message: 'Database backup created successfully' });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Database backup failed', details: error.message });
  }
});


// Serve Frontend
app.use(express.static(path.join(__dirname, '../../dist')));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  } else {
    next();
  }
});


// --- APP USERS, GROUPS, AND RIGHTS API ---

app.get('/api/app-users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM app_users');
    const [groups] = await pool.query('SELECT * FROM user_groups');
    const [rights] = await pool.query('SELECT * FROM user_rights');
    
    // Parse JSON fields
    const parsedGroups = groups.map(g => ({...g, users: g.users_json ? JSON.parse(g.users_json) : []}));
    
    const parsedRights = {};
    rights.forEach(r => {
      parsedRights[r.user_id] = r.rights_json ? JSON.parse(r.rights_json) : {};
    });

    res.json({ appUsers: users, userGroups: parsedGroups, userRights: parsedRights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/app-users', async (req, res) => {
  try {
    const { id, loginId, password, fullName, userType, description, isDefault } = req.body;
    await pool.query(
      'INSERT INTO app_users (id, login_id, password, full_name, user_type, description, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, loginId, password, fullName, userType, description, isDefault ? 1 : 0]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/app-users/:id', async (req, res) => {
  try {
    const { loginId, password, fullName, userType, description, isDefault } = req.body;
    if(password) {
      await pool.query(
        'UPDATE app_users SET login_id=?, password=?, full_name=?, user_type=?, description=?, is_default=? WHERE id=?',
        [loginId, password, fullName, userType, description, isDefault ? 1 : 0, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE app_users SET login_id=?, full_name=?, user_type=?, description=?, is_default=? WHERE id=?',
        [loginId, fullName, userType, description, isDefault ? 1 : 0, req.params.id]
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/app-users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM app_users WHERE id=?', [req.params.id]);
    await pool.query('DELETE FROM user_rights WHERE user_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user-groups', async (req, res) => {
  try {
    const { groups } = req.body; // array of {id, name, users: []}
    await pool.query('TRUNCATE TABLE user_groups');
    if(groups && groups.length > 0) {
      for(const g of groups) {
        await pool.query('INSERT INTO user_groups (id, name, users_json) VALUES (?, ?, ?)', [g.id, g.name, JSON.stringify(g.users || [])]);
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user-rights', async (req, res) => {
  try {
    const { rights } = req.body; // object mapping userId -> { menu: true }
    await pool.query('TRUNCATE TABLE user_rights');
    for(const userId of Object.keys(rights)) {
      await pool.query('INSERT INTO user_rights (user_id, rights_json) VALUES (?, ?)', [userId, JSON.stringify(rights[userId])]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- END APP USERS API ---


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

