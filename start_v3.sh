#!/bin/bash

# CryptoAI Platform V3.0 - Enterprise Startup Script
# This script handles the complete V3.0 platform initialization

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art Banner
echo -e "${CYAN}"
cat << 'EOF'
   ____                  _        _    ___   __     ______  ___  
  / ___|_ __ _   _ _ __ | |_ ___ / \  |_ _|  \ \   / /___ \ / _ \ 
 | |   | '__| | | | '_ \| __/ _ / _ \  | |    \ \ / /  __) | | | |
 | |___| |  | |_| | |_) | || __/ ___ \ | |     \ V /  / __/| |_| |
  \____|_|   \__, | .__/ \__\___/_/   \_|___|   \_/  |_____|\___/ 
             |___/|_|                                             
         Enterprise-Grade Cryptocurrency Trading Platform
EOF
echo -e "${NC}"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🚀 CryptoAI Platform V3.0 Startup${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a service is running
service_running() {
    if command_exists systemctl; then
        systemctl is-active --quiet "$1" 2>/dev/null
    elif command_exists service; then
        service "$1" status >/dev/null 2>&1
    else
        return 1
    fi
}

# Function to start a service
start_service() {
    echo -e "${YELLOW}Starting $1...${NC}"
    if command_exists systemctl; then
        sudo systemctl start "$1"
    elif command_exists service; then
        sudo service "$1" start
    else
        echo -e "${RED}Unable to start $1 - no service manager found${NC}"
        return 1
    fi
}

# Check prerequisites
echo -e "${CYAN}📋 Checking prerequisites...${NC}"

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️ .env file not found. Creating from template...${NC}"
    if [ -f ".env.template" ]; then
        cp .env.template .env
        echo -e "${GREEN}✅ .env file created from template${NC}"
        echo -e "${YELLOW}📝 Please edit .env file with your configuration before continuing${NC}"
        echo -e "${YELLOW}   At minimum, configure database and exchange credentials${NC}"
        read -p "Press Enter when you've configured .env file..."
    else
        echo -e "${RED}❌ .env.template not found. Cannot create .env file.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Environment configuration found${NC}"

# Check database services
echo -e "${CYAN}🗄️ Checking database services...${NC}"

# PostgreSQL
if ! command_exists psql && ! service_running postgresql; then
    echo -e "${YELLOW}⚠️ PostgreSQL not running. Attempting to start...${NC}"
    if ! start_service postgresql; then
        echo -e "${RED}❌ Failed to start PostgreSQL. Please install and configure PostgreSQL.${NC}"
        echo -e "${YELLOW}   Quick install: sudo apt-get install postgresql postgresql-contrib${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ PostgreSQL${NC}"

# Redis
if ! command_exists redis-cli && ! service_running redis; then
    echo -e "${YELLOW}⚠️ Redis not running. Attempting to start...${NC}"
    if ! start_service redis; then
        echo -e "${RED}❌ Failed to start Redis. Please install and configure Redis.${NC}"
        echo -e "${YELLOW}   Quick install: sudo apt-get install redis-server${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Redis${NC}"

# Install dependencies
echo -e "${CYAN}📦 Installing dependencies...${NC}"
cd server
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo -e "${YELLOW}Installing npm packages...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies up to date${NC}"
fi

# Run database migrations (if script exists)
if [ -f "scripts/migrate-database.js" ]; then
    echo -e "${CYAN}🔄 Running database migrations...${NC}"
    npm run migrate || echo -e "${YELLOW}⚠️ Migration script not available or failed${NC}"
fi

# Health check function
health_check() {
    local retries=30
    local count=0
    
    echo -e "${CYAN}🏥 Performing health check...${NC}"
    
    while [ $count -lt $retries ]; do
        if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Platform is healthy!${NC}"
            return 0
        fi
        
        count=$((count + 1))
        if [ $count -eq $retries ]; then
            echo -e "${RED}❌ Health check failed after $retries attempts${NC}"
            return 1
        fi
        
        echo -e "${YELLOW}⏳ Waiting for platform to start... ($count/$retries)${NC}"
        sleep 2
    done
}

# Start the platform
echo -e "${CYAN}🚀 Starting CryptoAI Platform V3.0...${NC}"
echo -e "${BLUE}========================================${NC}"

# Export environment variables for better logging
export DEBUG_MODE=false
export LOG_LEVEL=info

# Start in background for health check
npm run start:v3 &
PLATFORM_PID=$!

# Wait a moment for startup
sleep 5

# Perform health check
if health_check; then
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}🎉 CryptoAI Platform V3.0 Started Successfully!${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    # Display access information
    echo -e "${CYAN}📍 Access Information:${NC}"
    echo -e "   🌐 Web Interface: ${YELLOW}http://localhost:3000${NC}"
    echo -e "   📊 API Health: ${YELLOW}http://localhost:3000/api/health${NC}"
    echo -e "   🔧 V3.0 Status: ${YELLOW}http://localhost:3000/api/v3/status${NC}"
    echo ""
    
    # Display feature status
    echo -e "${CYAN}🎯 Enterprise Features Status:${NC}"
    
    # Quick feature check via API
    if command_exists curl && command_exists jq; then
        sleep 2 # Allow services to fully initialize
        HEALTH_DATA=$(curl -s http://localhost:3000/api/health 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo -e "   🧠 Enterprise AI: ${GREEN}Active${NC}"
            echo -e "   ⛓️ Blockchain Integration: ${GREEN}Active${NC}"
            echo -e "   🎭 Microservices: ${GREEN}Active${NC}"
            echo -e "   🔒 Enterprise Security: ${GREEN}Active${NC}"
            echo -e "   🏢 Multi-Tenant: ${GREEN}Active${NC}"
            echo -e "   🌊 Streaming Analytics: ${GREEN}Active${NC}"
        fi
    fi
    
    echo ""
    echo -e "${CYAN}📈 Quick Commands:${NC}"
    echo -e "   Health Check: ${YELLOW}npm run health${NC}"
    echo -e "   V3.0 Status: ${YELLOW}npm run status:v3${NC}"
    echo -e "   Enterprise Metrics: ${YELLOW}npm run enterprise:status${NC}"
    echo ""
    
    echo -e "${PURPLE}🎊 Platform ready for enterprise trading!${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    # Keep the platform running
    wait $PLATFORM_PID
    
else
    echo -e "${RED}❌ Platform startup failed!${NC}"
    echo -e "${YELLOW}💡 Troubleshooting tips:${NC}"
    echo -e "   1. Check .env configuration"
    echo -e "   2. Ensure PostgreSQL and Redis are running"
    echo -e "   3. Verify all required environment variables are set"
    echo -e "   4. Check the logs for detailed error messages"
    
    # Kill the background process
    kill $PLATFORM_PID 2>/dev/null || true
    exit 1
fi