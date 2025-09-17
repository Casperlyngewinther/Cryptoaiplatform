@echo off
:: CryptoAI Platform V4.0 - Quantum & Advanced AI Era Startup Script
:: For Windows systems

echo 🚀 Starting CryptoAI Platform V4.0 - Quantum ^& Advanced AI Era...
echo ==========================================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ to continue.
    pause
    exit /b 1
)

echo ✅ Node.js detected

:: Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm to continue.
    pause
    exit /b 1
)

echo ✅ npm detected

:: Navigate to server directory
if exist "server" (
    cd server
    echo ✅ Changed to server directory
) else if exist "package.json" (
    findstr /c:"ai-crypto-trading-platform" package.json >nul
    if %errorlevel% equ 0 (
        echo ✅ Already in server directory
    ) else (
        echo ❌ Cannot find server directory or package.json. Please run this script from the project root.
        pause
        exit /b 1
    )
) else (
    echo ❌ Cannot find server directory or package.json. Please run this script from the project root.
    pause
    exit /b 1
)

:: Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found. Please ensure you're in the correct directory.
    pause
    exit /b 1
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo ℹ️ Installing dependencies...
    npm install
    if %errorlevel% equ 0 (
        echo ✅ Dependencies installed successfully
    ) else (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencies already installed
)

:: Check if .env file exists, if not create from template
if not exist ".env" (
    if exist ".env.template" (
        echo ℹ️ Creating .env file from template...
        copy ".env.template" ".env" >nul
        echo ⚠️ Please configure your .env file with appropriate values before starting the platform
        echo ℹ️ Opening .env file for editing...
        notepad .env
    ) else (
        echo ⚠️ .env file not found and no template available. Creating basic .env file...
        (
            echo # CryptoAI Platform V4.0 Configuration
            echo NODE_ENV=development
            echo PORT=3000
            echo.
            echo # V4.0 Quantum ^& Advanced AI Era Features
            echo FEATURE_QUANTUM_SECURITY=true
            echo FEATURE_ADVANCED_AI=true
            echo FEATURE_GLOBAL_COMPLIANCE=true
            echo FEATURE_INSTITUTIONAL_TRADING=true
            echo FEATURE_NEXTGEN_BLOCKCHAIN=true
            echo FEATURE_PREDICTIVE_ANALYTICS=true
            echo.
            echo # V3.0 Enterprise Features
            echo FEATURE_AI_TRADING=true
            echo FEATURE_BLOCKCHAIN_INTEGRATION=true
            echo FEATURE_ENTERPRISE_SECURITY=true
            echo FEATURE_MULTI_TENANT=true
            echo FEATURE_STREAMING_ANALYTICS=true
            echo FEATURE_MICROSERVICES=true
            echo.
            echo # Database Configuration
            echo DB_HOST=localhost
            echo DB_PORT=5432
            echo DB_NAME=cryptoai_v4
            echo DB_USER=postgres
            echo DB_PASSWORD=your_password
            echo.
            echo # Redis Configuration
            echo REDIS_HOST=localhost
            echo REDIS_PORT=6379
            echo REDIS_PASSWORD=
            echo.
            echo # Security
            echo JWT_SECRET=your_jwt_secret_here
            echo ENCRYPTION_KEY=your_encryption_key_here
            echo.
            echo # Exchange API Keys ^(Configure as needed^)
            echo BINANCE_API_KEY=
            echo BINANCE_API_SECRET=
            echo COINBASE_API_KEY=
            echo COINBASE_API_SECRET=
            echo COINBASE_PASSPHRASE=
            echo.
            echo # Quantum Security Settings
            echo QUANTUM_KEY_ROTATION_INTERVAL=24
            echo QUANTUM_THREAT_MONITORING=true
            echo BIOMETRIC_AUTHENTICATION=true
            echo.
            echo # Advanced AI Settings
            echo TENSORFLOW_GPU_ENABLED=false
            echo AI_REAL_TIME_INFERENCE=true
            echo AI_DISTRIBUTED_TRAINING=false
            echo.
            echo # Compliance Settings
            echo REGULATORY_MONITORING=true
            echo KYC_VERIFICATION_LEVEL=ADVANCED
            echo AML_SCREENING=true
            echo.
            echo # Institutional Features
            echo INSTITUTIONAL_API_ENABLED=true
            echo LARGE_ORDER_EXECUTION=true
            echo PRIME_BROKERAGE=true
            echo.
            echo # Blockchain Settings
            echo ETHEREUM_RPC_URL=
            echo SOLANA_RPC_URL=
            echo LAYER2_INTEGRATION=true
            echo CROSS_CHAIN_BRIDGES=true
            echo.
            echo # Predictive Analytics
            echo QUANTUM_MODELING=true
            echo MARKET_INTELLIGENCE=true
            echo SENTIMENT_ANALYSIS=true
        ) > .env
        echo ✅ Basic .env file created. Please configure it with your settings.
        notepad .env
    )
) else (
    echo ✅ .env file found
)

:: Perform system checks
echo ℹ️ Performing system compatibility checks...

:: Check available memory
for /f "skip=1" %%p in ('wmic os get freephysicalmemory') do (
    set /a "RAM_MB=%%p/1024"
    goto :ram_done
)
:ram_done
echo ℹ️ Available RAM: %RAM_MB% MB

:: Check for recommended services
echo ℹ️ Checking for recommended services...

:: Check PostgreSQL
psql --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL client detected
) else (
    echo ⚠️ PostgreSQL client not found. Install PostgreSQL for optimal performance.
)

:: Check Redis
redis-cli --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis client detected
) else (
    echo ⚠️ Redis client not found. Install Redis for caching and session management.
)

:: Check Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo ✅ Python %%i detected ^(for AI/ML features^)
) else (
    echo ⚠️ Python not found. Some AI/ML features may not work optimally.
)

:: Display V4.0 feature status
echo.
echo 🔮 CryptoAI Platform V4.0 Features:
echo ==================================
echo 🔮 Quantum Security Engine - Post-quantum cryptography ^& biometric auth
echo 🧬 Advanced AI Engine - GPT integration ^& neural networks
echo 🌍 Global Regulatory Compliance - Multi-jurisdiction compliance
echo 🏛️ Institutional Trading Engine - Large order execution ^& prime brokerage
echo ⚡ Next-Gen Blockchain Engine - Layer 2, cross-chain, ZK-rollups
echo 🔬 Predictive Analytics Engine - Quantum-enhanced market intelligence
echo.

:: Ask for confirmation
set /p "confirm=Do you want to start CryptoAI Platform V4.0? (y/n): "
if /i not "%confirm%"=="y" (
    echo ℹ️ Startup cancelled by user.
    pause
    exit /b 0
)

:: Start the platform
echo ℹ️ Starting CryptoAI Platform V4.0...
echo.
echo 🚀 Launching Quantum ^& Advanced AI Era...
echo.

:: Set environment variables for V4.0
set FEATURE_QUANTUM_SECURITY=true
set FEATURE_ADVANCED_AI=true
set FEATURE_GLOBAL_COMPLIANCE=true
set FEATURE_INSTITUTIONAL_TRADING=true
set FEATURE_NEXTGEN_BLOCKCHAIN=true
set FEATURE_PREDICTIVE_ANALYTICS=true

:: Start the application
npm run start:v4

:: If npm start fails, try alternative
if %errorlevel% neq 0 (
    echo ⚠️ npm start:v4 failed, trying alternative startup method...
    set NODE_ENV=production
    node index.js
)

pause