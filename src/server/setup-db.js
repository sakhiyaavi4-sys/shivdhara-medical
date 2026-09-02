import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: './.env' });

async function setup() {
  const passwordsToTry = ['AviSakhiya21', ''];
  let connection = null;
  let successPassword = null;

  for (let pass of passwordsToTry) {
    try {
      console.log(`Trying password: '${pass}'...`);
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: pass
      });
      successPassword = pass;
      console.log(`Successfully connected with password: '${pass}'!`);
      break; // Stop trying if connected
    } catch (error) {
      console.log(`Failed with password '${pass}'.`);
    }
  }

  if (!connection) {
    console.error('\nERROR: Could not connect to MySQL. Are you sure you entered the correct password during installation?');
    return;
  }
  
  try {
    await connection.query('CREATE DATABASE IF NOT EXISTS shivdhara_medical_db;');
    console.log('Database created or already exists.');
    await connection.end();

    // Update .env with the correct password
    let envContent = fs.readFileSync('./src/server/.env', 'utf8');
    envContent = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${successPassword}`);
    fs.writeFileSync('./src/server/.env', envContent);
    console.log('.env file updated with correct password!');
  } catch (error) {
    console.error('Error creating database:', error);
  }
}

setup();
