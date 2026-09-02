@echo off
title Shivdhara Medical Store

echo ==========================================
echo   Shivdhara Medical Store - Starting...
echo ==========================================
echo.

:: Start Backend Server (Port 5000) - silent background
start "" /B cmd /c "cd /d ""%~dp0src\server"" && node index.js > ""%~dp0server.log"" 2>&1"

echo [1/3] Backend server starting on port 5000...
timeout /t 4 /nobreak > nul

:: Build and serve dist folder (production mode)
echo [2/3] Starting frontend server on port 5000...

:: Open browser
timeout /t 3 /nobreak > nul
echo [3/3] Opening browser...
start http://localhost:5173

echo.
echo ==========================================
echo   App is running! Do NOT close this window.
echo   Browser: http://localhost:5173
echo   Press Ctrl+C to stop server
echo ==========================================

:: Keep backend alive (npm run dev in foreground)
cd /d "%~dp0"
npm run dev
