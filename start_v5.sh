#!/bin/bash

# CryptoAI Platform V5.0 - 100% Automated Era Startup Script
# Author: MiniMax Agent

echo "🚀 Starting CryptoAI Platform V5.0 - 100% Automated Era..."
echo "================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Navigate to server directory
cd server 2>/dev/null || {
    echo "❌ Server directory not found. Please run this script from the project root."
    exit 1
}

echo "📁 Changed to server directory"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in server directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install --silent

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Set V5.0 environment variables
export NODE_ENV=production
export FEATURE_AUTONOMOUS_TRADING=true
export FEATURE_SELF_HEALING=true
export FEATURE_AUTONOMOUS_RISK=true
export FEATURE_INTELLIGENT_OPTIMIZATION=true
export FEATURE_AUTOMATED_COMPLIANCE=true
export FEATURE_SELF_LEARNING=true

echo "🔧 V5.0 100% Automation features enabled:"
echo "   🤖 Fully Autonomous Trading"
echo "   🔧 Self-Healing Infrastructure"
echo "   ⚖️ Autonomous Risk Management"
echo "   ⚡ Intelligent Resource Optimization"
echo "   📋 Automated Compliance & Reporting"
echo "   🧠 Self-Learning Market Adaptation"

echo ""
echo "🚀 Starting CryptoAI Platform V5.0..."
echo "🌐 Platform will be available at: http://localhost:3000"
echo "📊 API Documentation: http://localhost:3000/api/docs"
echo "🔄 Press Ctrl+C to stop the platform"
echo ""

# Start the V5.0 platform
npm run start:v5

echo "⏹️ CryptoAI Platform V5.0 stopped"
