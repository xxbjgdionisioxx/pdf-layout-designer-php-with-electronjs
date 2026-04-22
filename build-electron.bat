@echo off
:: ============================================================
:: PDF Layout Designer — Electron Build Script for Windows
:: Downloads portable PHP 8.x and packages the app as .exe
:: ============================================================

setlocal enabledelayedexpansion
title PDF Designer — Electron Build

echo.
echo ============================================================
echo   PDF Layout Designer — Windows Desktop Build
echo ============================================================
echo.

:: ─── Check Node.js ───
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo         Download it from https://nodejs.org and try again.
    pause
    exit /b 1
)
echo [OK] Node.js found: 
node --version

:: ─── Check npm ───
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm not found.
    pause
    exit /b 1
)
echo [OK] npm found:
npm --version
echo.

:: ─── Download portable PHP if not present ───
set PHP_DIR=%~dp0php
set PHP_EXE=%PHP_DIR%\php.exe
set PHP_ZIP=%TEMP%\php-portable.zip
set PHP_URL=https://windows.php.net/downloads/releases/php-8.3.21-nts-Win32-vs16-x64.zip

if not exist "%PHP_EXE%" (
    echo [INFO] PHP not found. Downloading portable PHP 8.3...
    echo        URL: %PHP_URL%
    echo.

    if not exist "%PHP_DIR%" mkdir "%PHP_DIR%"

    :: Use PowerShell to download
    powershell -NoProfile -Command "Invoke-WebRequest -Uri '%PHP_URL%' -OutFile '%PHP_ZIP%' -UseBasicParsing"
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to download PHP. Check your internet connection.
        pause
        exit /b 1
    )

    echo [INFO] Extracting PHP...
    powershell -NoProfile -Command "Expand-Archive -Path '%PHP_ZIP%' -DestinationPath '%PHP_DIR%' -Force"
    del "%PHP_ZIP%"

    :: Copy php.ini-development as php.ini and enable pdo_pgsql
    if exist "%PHP_DIR%\php.ini-development" (
        copy "%PHP_DIR%\php.ini-development" "%PHP_DIR%\php.ini" >nul
        powershell -NoProfile -Command "(Get-Content '%PHP_DIR%\php.ini') -replace ';extension=pdo_pgsql','extension=pdo_pgsql' | Set-Content '%PHP_DIR%\php.ini'"
        powershell -NoProfile -Command "(Get-Content '%PHP_DIR%\php.ini') -replace ';extension=openssl','extension=openssl' | Set-Content '%PHP_DIR%\php.ini'"
        powershell -NoProfile -Command "(Get-Content '%PHP_DIR%\php.ini') -replace ';extension=mbstring','extension=mbstring' | Set-Content '%PHP_DIR%\php.ini'"
        powershell -NoProfile -Command "(Get-Content '%PHP_DIR%\php.ini') -replace ';extension=curl','extension=curl' | Set-Content '%PHP_DIR%\php.ini'"
    )
    echo [OK] PHP ready at: %PHP_EXE%
) else (
    echo [OK] PHP already present: %PHP_EXE%
)
echo.

:: ─── Install Electron dependencies ───
echo [INFO] Installing Electron dependencies...
cd /d "%~dp0electron"
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)
echo [OK] Dependencies installed.
echo.

:: ─── Install PHP Composer dependencies (PHPMailer etc.) ───
set COMPOSER_PHAR=%~dp0composer.phar
if not exist "%COMPOSER_PHAR%" (
    echo [INFO] Downloading Composer...
    powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://getcomposer.org/composer.phar' -OutFile '%COMPOSER_PHAR%' -UseBasicParsing"
)

if not exist "%~dp0vendor\autoload.php" (
    echo [INFO] Installing PHP dependencies via Composer...
    cd /d "%~dp0"
    "%PHP_EXE%" "%COMPOSER_PHAR%" install --no-dev
)
echo [OK] PHP dependencies ready.
echo.

:: ─── Build the Electron installer ───
echo [INFO] Building Windows installer (this may take a few minutes)...
cd /d "%~dp0electron"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Electron build failed.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   BUILD COMPLETE!
echo   Installer is in: %~dp0dist\
echo ============================================================
echo.
pause
