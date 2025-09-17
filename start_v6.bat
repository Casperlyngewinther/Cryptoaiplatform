@echo off
REM CryptoAI Platform V6.0 - Next-Generation Intelligence Era Startup Script
REM Launches the platform with all V6.0 features enabled

echo.
echo 🚀 Starting CryptoAI Platform V6.0 - Next-Generation Intelligence Era
echo ════════════════════════════════════════════════════════════════════
echo.
echo 🧠 Next-Generation AI Intelligence
echo 👥 Social Trading Network
echo 🌉 Cross-Chain DeFi Integration
echo 📊 Advanced Analytics Dashboard
echo 🤖 Enhanced Automated Trading
echo 🔐 Enterprise Security
echo.

REM Change to server directory
cd server

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

REM Start the V6.0 platform
echo 🌟 Launching V6.0 with all features...
echo.

npm run start:v6

echo.
echo Platform stopped. Thank you for using CryptoAI Platform V6.0!
pause
