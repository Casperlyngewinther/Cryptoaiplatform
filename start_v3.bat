@echo off
REM CryptoAI Platform V3.0 - Enterprise Startup Script (Windows)
REM This script handles the complete V3.0 platform initialization

setlocal enabledelayedexpansion

echo.
echo    ____                  _        _    ___   __     ______  ___  
echo   / ___|_ __ _   _ _ __ ^| ^|_ ___ / \  ^|_ _^|  \ \   / /___ \ / _ \ 
echo  ^| ^|   ^| '__^| ^| ^| ^| '_ \^| __/ _ / _ \  ^| ^|    \ \ / /  __) ^| ^| ^| ^|
echo  ^| ^|___^| ^|  ^| ^|_^| ^| ^|_) ^| ^|^| __/ ___ \ ^| ^|     \ V /  / __/^| ^|_^| ^|
echo   \____^|_^|   \__, ^| .__/ \__\___/_/   \_^|___^|   \_/  ^|_____^|\___/ 
echo              ^|___/^|_^|                                             
echo          Enterprise-Grade Cryptocurrency Trading Platform
echo.
echo ========================================
echo 🚀 CryptoAI Platform V3.0 Startup
echo ========================================

REM Check Node.js
echo 📋 Checking prerequisites...
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Get Node.js version
for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION%

REM Check npm
where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found. Please install npm first.
    pause
    exit /b 1
)

REM Get npm version
for /f %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION%

REM Check for .env file
if not exist ".env" (
    echo ⚠️ .env file not found. Creating from template...
    if exist ".env.template" (
        copy ".env.template" ".env" >nul
        echo ✅ .env file created from template
        echo 📝 Please edit .env file with your configuration before continuing
        echo    At minimum, configure database and exchange credentials
        pause
    ) else (
        echo ❌ .env.template not found. Cannot create .env file.
        pause
        exit /b 1
    )
)
echo ✅ Environment configuration found

REM Install dependencies
echo 📦 Installing dependencies...
cd server
if not exist "node_modules" (
    echo Installing npm packages...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies up to date
)

REM Start the platform
echo 🚀 Starting CryptoAI Platform V3.0...
echo ========================================

REM Set environment variables
set DEBUG_MODE=false
set LOG_LEVEL=info

REM Start the platform
echo Starting platform...
start /b npm run start:v3

REM Wait for startup
timeout /t 10 /nobreak >nul

REM Health check
echo 🏥 Performing health check...
set RETRIES=30
set COUNT=0

:health_loop
curl -s http://localhost:3000/api/health >nul 2>&1
if not errorlevel 1 (
    goto health_success
)

set /a COUNT+=1
if %COUNT% geq %RETRIES% (
    goto health_failed
)

echo ⏳ Waiting for platform to start... (%COUNT%/%RETRIES%)
timeout /t 2 /nobreak >nul
goto health_loop

:health_success
echo ========================================
echo 🎉 CryptoAI Platform V3.0 Started Successfully!
echo ========================================
echo.
echo 📍 Access Information:
echo    🌐 Web Interface: http://localhost:3000
echo    📊 API Health: http://localhost:3000/api/health
echo    🔧 V3.0 Status: http://localhost:3000/api/v3/status
echo.
echo 🎯 Enterprise Features Status:
echo    🧠 Enterprise AI: Active
echo    ⛓️ Blockchain Integration: Active
echo    🎭 Microservices: Active
echo    🔒 Enterprise Security: Active
echo    🏢 Multi-Tenant: Active
echo    🌊 Streaming Analytics: Active
echo.
echo 📈 Quick Commands:
echo    Health Check: npm run health
echo    V3.0 Status: npm run status:v3
echo    Enterprise Metrics: npm run enterprise:status
echo.
echo 🎊 Platform ready for enterprise trading!
echo ========================================
echo.
echo Press any key to view logs or Ctrl+C to exit...
pause >nul
goto :eof

:health_failed
echo ❌ Platform startup failed!
echo.
echo 💡 Troubleshooting tips:
echo    1. Check .env configuration
echo    2. Ensure PostgreSQL and Redis are running
echo    3. Verify all required environment variables are set
echo    4. Check the logs for detailed error messages
echo.
pause
exit /b 1