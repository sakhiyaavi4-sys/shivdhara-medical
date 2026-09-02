require('dotenv').config({ path: './.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function exportDb() {
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
    const [tables] = await connection.query('SHOW TABLES');
    const backup = {};

    for (let i = 0; i < tables.length; i++) {
        const tableName = Object.values(tables[i])[0];
        console.log("Exporting table: " + tableName);
        const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
        backup[tableName] = rows;
    }

    fs.writeFileSync('shivdhara_backup.json', JSON.stringify(backup, null, 2));
    console.log("Database exported successfully to shivdhara_backup.json");
    await connection.end();
}

exportDb().catch(err => console.error(err));
