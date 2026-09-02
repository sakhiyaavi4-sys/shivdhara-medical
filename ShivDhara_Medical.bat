@echo off
title Shiv Dhara Medical Store Launcher
echo ==========================================
echo Starting Shiv Dhara Medical Store Server...
echo ==========================================

:: Start the Backend Server
cd /d "c:\Users\avisa\OneDrive\Desktop\shivdhara-medical\src\server"
start "Medical-Backend" cmd /k "node index.js"

echo Waiting for backend to initialize...
timeout /t 3

:: Start the Frontend React App
cd /d "c:\Users\avisa\OneDrive\Desktop\shivdhara-medical"
start "Medical-Frontend" cmd /k "npm run dev"

echo Waiting for frontend to initialize...
timeout /t 5

:: Open the Web Browser
start http://localhost:5173

echo ==========================================
echo All services are starting up. 
echo You can minimize the black windows.
echo ==========================================
exit
