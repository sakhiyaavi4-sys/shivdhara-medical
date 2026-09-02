require('dotenv').config({ path: './.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function importDb() {
    console.log("Reading backup file...");
    if (!fs.existsSync('shivdhara_backup.json')) {
        console.log("No backup file found (shivdhara_backup.json)");
        return;
    }
    
    const backup = JSON.parse(fs.readFileSync('shivdhara_backup.json', 'utf8'));
    
    console.log("Connecting to Database...");
    let dbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD.trim() : 'Sakhiya@2112';
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: dbPassword,
            database: 'shivdhara_medical_db'
        });
    } catch (e) {
        if (e.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('Access denied. Falling back to empty password...');
            connection = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: '',
                database: 'shivdhara_medical_db'
            });
        } else {
            throw e;
        }
    }

    // Disable foreign key checks for dropping/inserting
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    const tables = Object.keys(backup);
    for (const table of tables) {
        console.log("Importing table: " + table);
        const rows = backup[table];
        
        // Empty the table first
        try { await connection.query(`TRUNCATE TABLE ${table}`); } catch(e) { console.log("Table empty failed:", e.message); }

        if (rows.length === 0) continue;

        // Insert rows in batches of 100
        const columns = Object.keys(rows[0]);
        const columnsStr = columns.map(c => '`' + c + '`').join(',');
        
        const insertBatch = async (batch) => {
            if (batch.length === 0) return;
            const values = [];
            const placeholders = [];
            batch.forEach(row => {
                const rowVals = columns.map(col => row[col]);
                values.push(...rowVals);
                placeholders.push('(' + columns.map(() => '?').join(',') + ')');
            });
            const sql = `INSERT INTO ${table} (${columnsStr}) VALUES ${placeholders.join(',')}`;
            try {
                await connection.query(sql, values);
            } catch(err) {
                console.error("Error inserting into " + table + ":", err.message);
            }
        };

        // Process in chunks
        let currentChunk = [];
        for (let i = 0; i < rows.length; i++) {
            currentChunk.push(rows[i]);
            if (currentChunk.length >= 100) {
                await insertBatch(currentChunk);
                currentChunk = [];
            }
        }
        if (currentChunk.length > 0) {
            await insertBatch(currentChunk);
        }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log("Database IMPORTED successfully! You can now start the software.");
    await connection.end();
}

importDb().catch(err => console.error(err));
