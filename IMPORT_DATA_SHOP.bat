@echo off
echo ==========================================
echo   Shivdhara - Shop PC Data Import Tool
echo ==========================================
echo.
echo Please make sure MySQL Server is running on this PC.
echo.
pause

cd /d "%~dp0src\server"
node import_db.cjs

echo.
echo Import completed! Press any key to exit.
pause
