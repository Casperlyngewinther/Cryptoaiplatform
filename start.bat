@echo off
REM =============================================================================
REM CryptoAI Platform V2.0 - Quick Start Script (Windows)
REM =============================================================================

echo 🚀 CryptoAI Platform V2.0 Quick Start
echo ====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Visit: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version

REM Check if .env file exists
if not exist .env (
    echo ⚠️  No .env file found. Creating from template...
    if exist .env.template (
        copy .env.template .env >nul
        echo ✅ Created .env file from template
        echo.
        echo 📝 IMPORTANT: Edit .env file and add your API credentials!
        echo    At minimum, add your Crypto.com API credentials:
        echo    CRYPTO_COM_API_KEY=your_key_here
        echo    CRYPTO_COM_API_SECRET=your_secret_here
        echo.
        echo    Get API keys from: https://crypto.com/exchange
        echo.
        pause
    ) else (
        echo ❌ .env.template not found. Please create .env manually.
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file found
)

REM Install dependencies
echo 📦 Installing dependencies...
if exist package.json (
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ❌ package.json not found
    pause
    exit /b 1
)

REM Check for Ollama (optional)
echo.
echo 🤖 Checking for Ollama (AI features)...
ollama --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Ollama not found - AI features will use fallback mode
    echo    Install Ollama for full AI capabilities: https://ollama.ai/
) else (
    echo ✅ Ollama found - AI features will be available
    
    REM Check if llama3.1 model is available
    ollama list | findstr "llama3.1:8b" >nul
    if errorlevel 1 (
        echo ⚠️  Llama3.1:8b model not found
        echo    Download with: ollama pull llama3.1:8b
        echo    (This may take several minutes)
        set /p download="Download now? (y/N): "
        if /i "%download%"=="y" (
            ollama pull llama3.1:8b
        )
    ) else (
        echo ✅ Llama3.1:8b model available
    )
)

echo.
echo 🎉 Quick start completed!
echo.
echo 🚀 To start the platform:
echo    npm start
echo.
echo 🌐 Then visit:
echo    http://localhost:3000
echo.
echo 📊 API Health Check:
echo    http://localhost:3000/api/health
echo.
echo 🔧 V2.0 Status:
echo    http://localhost:3000/api/v2/status
echo.
echo 📚 For more help, see:
echo    - README.md
echo    - api_credentials_setup.md
echo    - QUICK_STARTUP_FIX.md
echo.
pause
