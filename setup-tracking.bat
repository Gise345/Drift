@echo off
REM ============================================================================
REM Drift Live Tracking - Setup Script (Windows)
REM ============================================================================
REM
REM This script automates the setup process for Firebase Hosting and
REM the Live Tracking feature for the Drift rideshare application.
REM
REM Usage: setup-tracking.bat
REM
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================
echo Drift Live Tracking - Setup Script
echo ============================================
echo.

REM ============================================================================
REM Check Prerequisites
REM ============================================================================

echo Checking Prerequisites...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js v18 or later: https://nodejs.org
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js installed: %NODE_VERSION%

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm installed: %NPM_VERSION%

REM Check Firebase CLI
where firebase >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] Firebase CLI not installed
    echo Installing Firebase CLI...
    call npm install -g firebase-tools
    echo [OK] Firebase CLI installed
) else (
    for /f "tokens=*" %%i in ('firebase --version') do set FIREBASE_VERSION=%%i
    echo [OK] Firebase CLI installed: %FIREBASE_VERSION%
)

echo.

REM ============================================================================
REM Verify Project Structure
REM ============================================================================

echo Verifying Project Structure...
echo.

if not exist "package.json" (
    echo [ERROR] package.json not found. Are you in the Drift project root?
    exit /b 1
)

if not exist "functions" (
    echo [ERROR] functions\ directory not found
    exit /b 1
)

echo [OK] Project structure verified

REM ============================================================================
REM Create/Verify Public Directory
REM ============================================================================

echo.
echo Setting Up Public Directory...
echo.

if not exist "public" (
    mkdir public
    echo [OK] Created public\ directory
) else (
    echo [OK] public\ directory exists
)

if exist "public\index.html" (
    echo [OK] index.html exists
) else (
    echo [WARN] index.html not found - you'll need to create it
)

if exist "public\track.html" (
    echo [OK] track.html exists
) else (
    echo [WARN] track.html not found - you'll need to create it
)

if exist "public\404.html" (
    echo [OK] 404.html exists
) else (
    echo [WARN] 404.html not found - you'll need to create it
)

REM ============================================================================
REM Install Dependencies
REM ============================================================================

echo.
echo Installing Dependencies...
echo.

echo Installing root dependencies...
call npm install

echo Installing functions dependencies...
cd functions
call npm install
cd ..

echo [OK] Dependencies installed

REM ============================================================================
REM Install Expo Packages
REM ============================================================================

echo.
echo Installing Expo Packages...
echo.

call npx expo install expo-sms expo-contacts expo-clipboard expo-haptics expo-location

echo [OK] Expo packages installed

REM ============================================================================
REM Build Functions
REM ============================================================================

echo.
echo Building Cloud Functions...
echo.

cd functions
call npm run build
cd ..

echo [OK] Functions built successfully

REM ============================================================================
REM Verify Configuration Files
REM ============================================================================

echo.
echo Verifying Configuration Files...
echo.

if exist "firebase.json" (
    echo [OK] firebase.json exists
) else (
    echo [ERROR] firebase.json not found
    exit /b 1
)

if exist ".firebaserc" (
    echo [OK] .firebaserc exists
) else (
    echo [WARN] .firebaserc not found
)

if exist "firestore.rules" (
    echo [OK] firestore.rules exists
) else (
    echo [WARN] firestore.rules not found
)

if exist "firestore.indexes.json" (
    echo [OK] firestore.indexes.json exists
) else (
    echo [WARN] firestore.indexes.json not found
)

REM ============================================================================
REM Verify Tracking Files
REM ============================================================================

echo.
echo Verifying Tracking Implementation Files...
echo.

if exist "functions\src\tracking.ts" (
    echo [OK] functions\src\tracking.ts exists
) else (
    echo [ERROR] functions\src\tracking.ts not found
)

if exist "src\services\trackingService.ts" (
    echo [OK] src\services\trackingService.ts exists
) else (
    echo [ERROR] src\services\trackingService.ts not found
)

if exist "src\types\tracking.ts" (
    echo [OK] src\types\tracking.ts exists
) else (
    echo [ERROR] src\types\tracking.ts not found
)

if exist "src\components\ShareTrackingModal.tsx" (
    echo [OK] src\components\ShareTrackingModal.tsx exists
) else (
    echo [ERROR] src\components\ShareTrackingModal.tsx not found
)

REM ============================================================================
REM Summary
REM ============================================================================

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Your Drift Live Tracking feature is ready for deployment.
echo.
echo Next steps:
echo.
echo   1. Create/verify your public HTML files:
echo      - public\index.html (landing page)
echo      - public\track.html (tracking page)
echo      - public\404.html (error page)
echo.
echo   2. Deploy to Firebase:
echo      npm run firebase:deploy:all
echo.
echo   3. Or deploy individually:
echo      npm run firebase:deploy:hosting    # Hosting only
echo      npm run firebase:deploy:functions  # Functions only
echo      npm run firebase:deploy:rules      # Security rules
echo.
echo   4. Test locally first:
echo      npm run firebase:serve
echo.
echo   5. View logs:
echo      npm run firebase:logs
echo.
echo Documentation:
echo   - DEPLOYMENT_GUIDE.md     - Full deployment instructions
echo   - QUICK_REFERENCE.md      - Commands and checklist
echo   - TRACKING_IMPLEMENTATION.md - Technical details
echo.
echo Happy tracking!
echo.

endlocal
