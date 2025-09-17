#!/bin/bash

# CryptoAI Platform V4.0 - Quantum & Advanced AI Era Startup Script
# For Linux/Mac systems

echo "🚀 Starting CryptoAI Platform V4.0 - Quantum & Advanced AI Era..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

print_quantum() {
    echo -e "${PURPLE}🔮 $1${NC}"
}

print_ai() {
    echo -e "${CYAN}🧬 $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ to continue."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION is not supported. Please install Node.js 18+ or later."
    exit 1
fi

print_status "Node.js version $NODE_VERSION detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm to continue."
    exit 1
fi

print_status "npm detected"

# Navigate to server directory
if [ -d "server" ]; then
    cd server
    print_status "Changed to server directory"
elif [ -f "package.json" ] && grep -q "ai-crypto-trading-platform" package.json; then
    print_status "Already in server directory"
else
    print_error "Cannot find server directory or package.json. Please run this script from the project root."
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please ensure you're in the correct directory."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_status "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_status "Dependencies already installed"
fi

# Check if .env file exists, if not create from template
if [ ! -f ".env" ]; then
    if [ -f ".env.template" ]; then
        print_info "Creating .env file from template..."
        cp .env.template .env
        print_warning "Please configure your .env file with appropriate values before starting the platform"
        print_info "Opening .env file for editing..."
        if command -v nano &> /dev/null; then
            nano .env
        elif command -v vim &> /dev/null; then
            vim .env
        elif command -v code &> /dev/null; then
            code .env
        else
            print_warning "Please manually edit the .env file and configure your settings"
        fi
    else
        print_warning ".env file not found and no template available. Creating basic .env file..."
        cat > .env << EOL
# CryptoAI Platform V4.0 Configuration
NODE_ENV=development
PORT=3000

# V4.0 Quantum & Advanced AI Era Features
FEATURE_QUANTUM_SECURITY=true
FEATURE_ADVANCED_AI=true
FEATURE_GLOBAL_COMPLIANCE=true
FEATURE_INSTITUTIONAL_TRADING=true
FEATURE_NEXTGEN_BLOCKCHAIN=true
FEATURE_PREDICTIVE_ANALYTICS=true

# V3.0 Enterprise Features
FEATURE_AI_TRADING=true
FEATURE_BLOCKCHAIN_INTEGRATION=true
FEATURE_ENTERPRISE_SECURITY=true
FEATURE_MULTI_TENANT=true
FEATURE_STREAMING_ANALYTICS=true
FEATURE_MICROSERVICES=true

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cryptoai_v4
DB_USER=postgres
DB_PASSWORD=your_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Exchange API Keys (Configure as needed)
BINANCE_API_KEY=
BINANCE_API_SECRET=
COINBASE_API_KEY=
COINBASE_API_SECRET=
COINBASE_PASSPHRASE=

# Quantum Security Settings
QUANTUM_KEY_ROTATION_INTERVAL=24
QUANTUM_THREAT_MONITORING=true
BIOMETRIC_AUTHENTICATION=true

# Advanced AI Settings
TENSORFLOW_GPU_ENABLED=false
AI_REAL_TIME_INFERENCE=true
AI_DISTRIBUTED_TRAINING=false

# Compliance Settings
REGULATORY_MONITORING=true
KYC_VERIFICATION_LEVEL=ADVANCED
AML_SCREENING=true

# Institutional Features
INSTITUTIONAL_API_ENABLED=true
LARGE_ORDER_EXECUTION=true
PRIME_BROKERAGE=true

# Blockchain Settings
ETHEREUM_RPC_URL=
SOLANA_RPC_URL=
LAYER2_INTEGRATION=true
CROSS_CHAIN_BRIDGES=true

# Predictive Analytics
QUANTUM_MODELING=true
MARKET_INTELLIGENCE=true
SENTIMENT_ANALYSIS=true
EOL
        print_status "Basic .env file created. Please configure it with your settings."
    fi
else
    print_status ".env file found"
fi

# Perform system checks
print_info "Performing system compatibility checks..."

# Check available memory
AVAILABLE_RAM=$(free -h | awk '/^Mem:/ {print $7}' 2>/dev/null || echo "Unknown")
print_info "Available RAM: $AVAILABLE_RAM"

# Check disk space
AVAILABLE_DISK=$(df -h . | awk 'NR==2 {print $4}')
print_info "Available disk space: $AVAILABLE_DISK"

# Check for required services
print_info "Checking for recommended services..."

# Check PostgreSQL
if command -v psql &> /dev/null; then
    print_status "PostgreSQL client detected"
else
    print_warning "PostgreSQL client not found. Install PostgreSQL for optimal performance."
fi

# Check Redis
if command -v redis-cli &> /dev/null; then
    print_status "Redis client detected"
else
    print_warning "Redis client not found. Install Redis for caching and session management."
fi

# Check Python (for AI/ML features)
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | sed 's/Python //')
    print_status "Python $PYTHON_VERSION detected (for AI/ML features)"
else
    print_warning "Python 3 not found. Some AI/ML features may not work optimally."
fi

# Display V4.0 feature status
echo ""
print_quantum "CryptoAI Platform V4.0 Features:"
echo "=================================="
print_quantum "🔮 Quantum Security Engine - Post-quantum cryptography & biometric auth"
print_ai "🧬 Advanced AI Engine - GPT integration & neural networks"
print_info "🌍 Global Regulatory Compliance - Multi-jurisdiction compliance"
print_info "🏛️ Institutional Trading Engine - Large order execution & prime brokerage"
print_info "⚡ Next-Gen Blockchain Engine - Layer 2, cross-chain, ZK-rollups"
print_info "🔬 Predictive Analytics Engine - Quantum-enhanced market intelligence"
echo ""

# Ask for confirmation
read -p "Do you want to start CryptoAI Platform V4.0? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Startup cancelled by user."
    exit 0
fi

# Start the platform
print_info "Starting CryptoAI Platform V4.0..."
echo ""
print_quantum "🚀 Launching Quantum & Advanced AI Era..."
echo ""

# Set environment variables for V4.0
export FEATURE_QUANTUM_SECURITY=true
export FEATURE_ADVANCED_AI=true
export FEATURE_GLOBAL_COMPLIANCE=true
export FEATURE_INSTITUTIONAL_TRADING=true
export FEATURE_NEXTGEN_BLOCKCHAIN=true
export FEATURE_PREDICTIVE_ANALYTICS=true

# Start the application
npm run start:v4

# If npm start fails, try alternative
if [ $? -ne 0 ]; then
    print_warning "npm start:v4 failed, trying alternative startup method..."
    NODE_ENV=production node index.js
fi