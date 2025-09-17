#!/bin/bash

# =============================================================================
# CryptoAI Platform V2.0 - Quick Start Script
# =============================================================================

echo "🚀 CryptoAI Platform V2.0 Quick Start"
echo "===================================="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    echo "   Please upgrade Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    if [ -f .env.template ]; then
        cp .env.template .env
        echo "✅ Created .env file from template"
        echo
        echo "📝 IMPORTANT: Edit .env file and add your API credentials!"
        echo "   At minimum, add your Crypto.com API credentials:"
        echo "   CRYPTO_COM_API_KEY=your_key_here"
        echo "   CRYPTO_COM_API_SECRET=your_secret_here"
        echo
        echo "   Get API keys from: https://crypto.com/exchange"
        echo
        read -p "Press Enter when you've configured your .env file..."
    else
        echo "❌ .env.template not found. Please create .env manually."
        exit 1
    fi
else
    echo "✅ .env file found"
fi

# Install dependencies
echo "📦 Installing dependencies..."
if [ -f package.json ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "❌ package.json not found"
    exit 1
fi

# Check for Ollama (optional)
echo
echo "🤖 Checking for Ollama (AI features)..."
if command -v ollama &> /dev/null; then
    echo "✅ Ollama found - AI features will be available"
    
    # Check if llama3.1 model is available
    if ollama list | grep -q "llama3.1:8b"; then
        echo "✅ Llama3.1:8b model available"
    else
        echo "⚠️  Llama3.1:8b model not found"
        echo "   Download with: ollama pull llama3.1:8b"
        echo "   (This may take several minutes)"
        read -p "Download now? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ollama pull llama3.1:8b
        fi
    fi
else
    echo "⚠️  Ollama not found - AI features will use fallback mode"
    echo "   Install Ollama for full AI capabilities: https://ollama.ai/"
fi

# Test server startup
echo
echo "🧪 Testing server startup..."
echo "Starting server in test mode..."

# Set test environment
export NODE_ENV=development
export USE_SANDBOX=true

# Start server in background for testing
timeout 30s npm start &
SERVER_PID=$!

# Wait a bit for server to start
sleep 10

# Test if server is responding
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Server test successful!"
    
    # Stop test server
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
    
    echo
    echo "🎉 Quick start completed successfully!"
    echo
    echo "🚀 To start the platform:"
    echo "   npm start"
    echo
    echo "🌐 Then visit:"
    echo "   http://localhost:3000"
    echo
    echo "📊 API Health Check:"
    echo "   http://localhost:3000/api/health"
    echo
    echo "🔧 V2.0 Status:"
    echo "   http://localhost:3000/api/v2/status"
    echo
    
else
    echo "⚠️  Server test failed - check your configuration"
    echo "   Common issues:"
    echo "   - Missing API credentials in .env"
    echo "   - Port 3000 already in use"
    echo "   - Network connectivity issues"
    echo
    echo "📝 Check logs when starting with: npm start"
    
    # Stop test server
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
fi

echo
echo "📚 For more help, see:"
echo "   - README.md"
echo "   - api_credentials_setup.md"
echo "   - QUICK_STARTUP_FIX.md"
