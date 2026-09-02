@echo off
:: BatchGotAdmin
:-------------------------------------
REM  --> Check for permissions
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"

REM --> If error flag set, we do not have admin.
if '%errorlevel%' NEQ '0' (
    echo Requesting administrative privileges...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    set params = %*:"=""
    echo UAC.ShellExecute "cmd.exe", "/c %~s0 %params%", "", "runas", 1 >> "%temp%\getadmin.vbs"

    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    pushd "%CD%"
    CD /D "%~dp0"
:--------------------------------------

echo ==================================================
echo   Shivdhara Medical Store - SHOP PC LAUNCHER
echo ==================================================
echo.

:: Check Windows Architecture (32-bit or 64-bit)
if "%PROCESSOR_ARCHITECTURE%"=="x86" (
    if not defined PROCESSOR_ARCHITEW6432 (
        set "NODE_PATH=%~dp0node-v13.14.0-win-x86\node.exe"
    ) else (
        set "NODE_PATH=%~dp0node-v13.14.0-win-x64\node.exe"
    )
) else (
    set "NODE_PATH=%~dp0node-v13.14.0-win-x64\node.exe"
)

if exist "%NODE_PATH%" (
    echo Found portable Node.js for Windows 7!
    echo Starting Server...
    "%NODE_PATH%" "%~dp0src\server\setup-db.js"
    start "Shivdhara Server" "%NODE_PATH%" "%~dp0src\server\index.js"
) else (
    echo Portable Node.js not found, trying system Node...
    cmd /c "cd /d %~dp0\src\server && node setup-db.js"
    start "Shivdhara Server" cmd /k "cd /d %~dp0\src\server && node index.js"
)

echo.
echo Server is running! Opening in Chrome...
timeout /t 3 >nul

start chrome "http://localhost:5000" || start "" "http://localhost:5000"

exit
