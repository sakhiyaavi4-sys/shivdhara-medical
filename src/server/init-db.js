export async function initDatabase(pool) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      pharmacy_name VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS app_users (
      id VARCHAR(50) PRIMARY KEY,
      login_id VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255),
      full_name VARCHAR(255),
      user_type VARCHAR(50),
      description TEXT,
      is_default TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_groups (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      users_json TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_rights (
      user_id VARCHAR(50) PRIMARY KEY,
      rights_json TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      division VARCHAR(100),
      company VARCHAR(255),
      pRate DECIMAL(10,2) DEFAULT 0,
      mrp DECIMAL(10,2) DEFAULT 0,
      price DECIMAL(10,2) DEFAULT 0,
      gst DECIMAL(10,2) DEFAULT 0,
      cess DECIMAL(10,2) DEFAULT 0,
      discount DECIMAL(10,2) DEFAULT 0,
      stock INT DEFAULT 0,
      minimum INT DEFAULT 5,
      unit VARCHAR(50),
      pack VARCHAR(50),
      expiryDate VARCHAR(50),
      batchNumber VARCHAR(100),
      barcode VARCHAR(100),
      hsn VARCHAR(50),
      manufacturer VARCHAR(255),
      supplier VARCHAR(255),
      location VARCHAR(100),
      itemCategory VARCHAR(100),
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS suppliers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      contact VARCHAR(100),
      mobile VARCHAR(50),
      email VARCHAR(100),
      gst_tin VARCHAR(100),
      dl_no VARCHAR(100),
      pan_no VARCHAR(100),
      credit_limit DECIMAL(12,2) DEFAULT 0,
      credit_days INT DEFAULT 0,
      opening_balance DECIMAL(12,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS purchase_bills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      entry_no VARCHAR(50),
      party_name VARCHAR(255),
      supplier_id VARCHAR(50),
      bill_no VARCHAR(100),
      bill_date DATETIME,
      entry_date DATETIME,
      tax_type VARCHAR(50),
      payment_mode VARCHAR(50),
      remarks TEXT,
      subtotal DECIMAL(12,2) DEFAULT 0,
      total_gst DECIMAL(12,2) DEFAULT 0,
      total_disc DECIMAL(12,2) DEFAULT 0,
      total_amount DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS purchase_invoice_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      purchase_bill_id INT,
      itemId VARCHAR(50),
      itemName VARCHAR(255),
      batchNo VARCHAR(100),
      mfgDate VARCHAR(50),
      expiryDate VARCHAR(50),
      qty INT DEFAULT 0,
      freeQty INT DEFAULT 0,
      ptr DECIMAL(10,2) DEFAULT 0,
      mrp DECIMAL(10,2) DEFAULT 0,
      gst DECIMAL(10,2) DEFAULT 0,
      disc DECIMAL(10,2) DEFAULT 0,
      amount DECIMAL(12,2) DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS batches (
      id VARCHAR(191) PRIMARY KEY,
      itemId VARCHAR(50),
      batchNo VARCHAR(100),
      mfgDate VARCHAR(50),
      expiryDate VARCHAR(50),
      qty INT DEFAULT 0,
      mrp DECIMAL(10,2) DEFAULT 0,
      ptr DECIMAL(10,2) DEFAULT 0,
      gst DECIMAL(10,2) DEFAULT 0,
      purchaseBillId VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sales_bills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_no VARCHAR(100),
      patient_name VARCHAR(255),
      patient_area VARCHAR(255),
      doctor_name VARCHAR(255),
      mobile VARCHAR(50),
      address TEXT,
      date DATETIME,
      payment_mode VARCHAR(50),
      gross_amount DECIMAL(12,2) DEFAULT 0,
      less_disc DECIMAL(12,2) DEFAULT 0,
      net_amount DECIMAL(12,2) DEFAULT 0,
      salesman VARCHAR(100),
      refill_date DATE,
      pay_rec DECIMAL(12,2) DEFAULT 0,
      remarks TEXT,
      status VARCHAR(50),
      is_return TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sales_invoice_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sales_bill_id INT,
      itemId VARCHAR(50),
      itemName VARCHAR(255),
      batchNo VARCHAR(100),
      qty INT DEFAULT 0,
      mrp DECIMAL(10,2) DEFAULT 0,
      rate DECIMAL(10,2) DEFAULT 0,
      gst DECIMAL(10,2) DEFAULT 0,
      disc DECIMAL(10,2) DEFAULT 0,
      amount DECIMAL(12,2) DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vch_no VARCHAR(100),
      type VARCHAR(50),
      date DATETIME,
      mode VARCHAR(50),
      amount DECIMAL(12,2) DEFAULT 0,
      account_name VARCHAR(255),
      supplier_id VARCHAR(50),
      bank_name VARCHAR(255),
      cheque_no VARCHAR(100),
      remark TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS bank_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE,
      type VARCHAR(50),
      account_name VARCHAR(255),
      bank VARCHAR(255),
      amount DECIMAL(12,2) DEFAULT 0,
      cheque_no VARCHAR(100),
      remark TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS khata_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(255),
      customer_phone VARCHAR(50),
      amount DECIMAL(12,2) DEFAULT 0,
      paid_amount DECIMAL(12,2) DEFAULT 0,
      note TEXT,
      date DATE,
      cleared TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS advance_deposits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(255),
      customer_phone VARCHAR(50),
      amount DECIMAL(12,2) DEFAULT 0,
      used_amount DECIMAL(12,2) DEFAULT 0,
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS doctors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      specialization VARCHAR(255),
      mobile VARCHAR(50),
      email VARCHAR(100),
      area VARCHAR(255),
      note TEXT,
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(100) UNIQUE,
      phone VARCHAR(50),
      address TEXT,
      note TEXT,
      password VARCHAR(255),
      role VARCHAR(50) DEFAULT 'customer',
      points INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS loyalty_data (
      email VARCHAR(100) PRIMARY KEY,
      points INT DEFAULT 0,
      total_earned INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS bundle_offers (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255),
      item_names TEXT,
      discount_pct DECIMAL(5,2) DEFAULT 0,
      active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS upi_settings (
      id INT PRIMARY KEY,
      upi_id VARCHAR(255),
      name VARCHAR(255),
      active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(100),
      action VARCHAR(100) NOT NULL,
      details TEXT,
      ip_address VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const query of tables) {
    try {
      await pool.query(query);
    } catch (err) {
      console.error('Error creating table:', err.message);
    }
  }
  console.log('Database initialization complete.');
}
