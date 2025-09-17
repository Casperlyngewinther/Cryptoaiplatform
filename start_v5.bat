@echo off
REM CryptoAI Platform V5.0 - 100% Automated Era Startup Script
REM Author: MiniMax Agent

echo 🚀 Starting CryptoAI Platform V5.0 - 100% Automated Era...
echo =================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available

REM Navigate to server directory
cd server 2>nul
if %errorlevel% neq 0 (
    echo ❌ Server directory not found. Please run this script from the project root.
    pause
    exit /b 1
)

echo 📁 Changed to server directory

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found in server directory
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
npm install --silent

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Set V5.0 environment variables
set NODE_ENV=production
set FEATURE_AUTONOMOUS_TRADING=true
set FEATURE_SELF_HEALING=true
set FEATURE_AUTONOMOUS_RISK=true
set FEATURE_INTELLIGENT_OPTIMIZATION=true
set FEATURE_AUTOMATED_COMPLIANCE=true
set FEATURE_SELF_LEARNING=true

echo 🔧 V5.0 100% Automation features enabled:
echo    🤖 Fully Autonomous Trading
echo    🔧 Self-Healing Infrastructure
echo    ⚖️ Autonomous Risk Management
echo    ⚡ Intelligent Resource Optimization
echo    📋 Automated Compliance ^& Reporting
echo    🧠 Self-Learning Market Adaptation

echo.
echo 🚀 Starting CryptoAI Platform V5.0...
echo 🌐 Platform will be available at: http://localhost:3000
echo 📊 API Documentation: http://localhost:3000/api/docs
echo 🔄 Press Ctrl+C to stop the platform
echo.

REM Start the V5.0 platform
npm run start:v5

echo ⏹️ CryptoAI Platform V5.0 stopped
pause
