@echo off
color 0A
title Shivdhara Medical Store - Server

echo ===================================================
echo     Starting Shivdhara Medical Store Server...
echo ===================================================

cd /d "%~dp0"

echo Verifying Database Connection...
node src\server\setup-db.js

echo.
echo Starting Application...
echo.
echo ===================================================
echo     DO NOT CLOSE THIS BLACK WINDOW!
echo     To use the app, open Google Chrome and go to:
echo     http://localhost:5000
echo ===================================================
echo.

node src\server\index.js

pause
