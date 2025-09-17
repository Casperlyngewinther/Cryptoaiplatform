# 🚀 CryptoAI Platform V5.0 - Enhanced Easy Setup

## 100% Automated Era with Easy API Key Installation

Welcome to the enhanced CryptoAI Platform V5.0! This version introduces an easy setup wizard and streamlined API key management for effortless configuration and automated trading.

---

## ⚡ Quick Start (NEW!)

### Option 1: One-Command Setup
```bash
node setup.js
```
This launches the interactive setup wizard that guides you through:
- API key configuration for multiple exchanges
- Trading preferences setup
- Security settings
- Automatic environment file generation

### Option 2: Easy API Manager
```bash
node api-manager.js
```
Use the command-line API manager for:
- Adding/removing exchange credentials
- Validating API keys
- Managing trading settings
- Checking platform status

---

## 🔧 Installation & Setup

### 1. Prerequisites
- Node.js 16+ installed
- NPM or Yarn package manager
- Exchange API credentials (optional, can be added later)

### 2. Initial Setup
```bash
# Clone or download the project
# Navigate to project directory

# Run the easy setup wizard
node setup.js
```

The setup wizard will:
1. ✅ Install dependencies automatically
2. 🔑 Guide you through API key setup
3. ⚙️ Configure trading preferences
4. 🔐 Set up security options
5. 📄 Generate environment files
6. 🚀 Optionally start the platform

### 3. Manual Setup (Alternative)
If you prefer manual setup:

```bash
# Install dependencies
cd server
npm install

# Run setup wizard
npm run setup:wizard

# Or use the API manager
npm run api:manage
```

---

## 🏦 Supported Exchanges

The platform supports all major cryptocurrency exchanges:

| Exchange | Icon | Status | Required Fields |
|----------|------|--------|----------------|
| Binance | 🟡 | ✅ Active | API Key, Secret Key |
| Coinbase Pro | 🔵 | ✅ Active | API Key, Secret Key, Passphrase |
| Kraken | 🟣 | ✅ Active | API Key, Secret Key |
| KuCoin | 🟢 | ✅ Active | API Key, Secret Key, Passphrase |
| OKX | ⚫ | ✅ Active | API Key, Secret Key, Passphrase |
| Bybit | 🟠 | ✅ Active | API Key, Secret Key |
| Crypto.com | 🔴 | ✅ Active | API Key, Secret Key |

---

## 🎯 API Key Management

### Adding Exchange Credentials
```bash
# Interactive mode
node api-manager.js add binance

# Or use the wizard
node setup.js
```

### Managing Existing Credentials
```bash
# List configured exchanges
node api-manager.js list

# Validate credentials
node api-manager.js validate binance

# Remove credentials
node api-manager.js remove binance

# Check platform status
node api-manager.js status
```

### Trading Settings Management
```bash
# Open settings menu
node api-manager.js settings
```

Configure:
- ✅ Auto trading enable/disable
- 📊 Risk level (Conservative/Moderate/Aggressive)
- 💰 Maximum daily loss percentage
- 🪙 Preferred quote currency

---

## 🚀 Running the Platform

### Start Commands
```bash
# Start V5.0 with all features
npm run start:v5

# Development mode with auto-restart
npm run dev

# Quick start (if setup wizard created script)
./quick_start_v5.sh
```

### Monitoring Commands
```bash
# Platform health check
npm run health

# Trading status
npm run trading:status

# Portfolio summary
npm run trading:portfolio

# API key status
npm run api:status
```

---

## 📊 Platform Features

### V5.0 Enhanced Features
- 🔑 **Easy API Key Setup** - Interactive wizard for secure credential management
- 🤖 **Enhanced Automated Trading** - Advanced AI-powered trading with multiple strategies
- 🛡️ **Smart Risk Management** - Autonomous risk assessment and position sizing
- 📈 **Real-time Portfolio Tracking** - Live portfolio monitoring across exchanges
- 🔐 **Encrypted Storage** - Secure credential storage with encryption
- 📱 **CLI Management Tools** - Command-line tools for easy management

### Previous Version Features
- 🚀 **Fully Autonomous Trading** (V5.0)
- 🔧 **Self-Healing Infrastructure** (V5.0)
- ⚖️ **Autonomous Risk Management** (V5.0)
- ⚡ **Intelligent Resource Optimization** (V5.0)
- 📋 **Automated Compliance** (V5.0)
- 🧠 **Self-Learning Adaptation** (V5.0)
- 🔮 **Quantum Security** (V4.0)
- 🧬 **Advanced AI** (V4.0)
- 🌍 **Global Compliance** (V4.0)
- 🏛️ **Institutional Trading** (V4.0)

---

## 🔐 Security Features

### Credential Security
- 🔐 AES-256 encryption for API keys
- 🛡️ Secure storage with encryption keys
- 🔑 Environment variable management
- 👤 Optional two-factor authentication

### Trading Security
- ⚡ Real-time risk monitoring
- 🚨 Emergency stop mechanisms
- 📊 Position size limits
- 💰 Daily loss limits

---

## 📡 API Endpoints

### V5.0 Enhanced Endpoints

#### API Key Management
- `GET /api/v5/api-keys/status` - System status
- `GET /api/v5/api-keys/exchanges` - List exchanges

#### Enhanced Trading
- `GET /api/v5/trading/status` - Trading engine status
- `GET /api/v5/trading/portfolio` - Portfolio summary
- `POST /api/v5/trading/start` - Start trading
- `POST /api/v5/trading/stop` - Stop trading

### Health & Monitoring
- `GET /api/health` - Complete system health
- All previous version endpoints remain active

---

## 📋 Configuration Options

### Environment Variables
After running the setup wizard, your `.env` file will include:

```env
# Basic Configuration
NODE_ENV=production
PORT=3000
VERSION=5.0.0

# Security
JWT_SECRET=auto_generated
ENCRYPTION_KEY=auto_generated
SESSION_SECRET=auto_generated

# Exchange Credentials (auto-configured)
BINANCE_API_KEY=your_key
BINANCE_SECRET_KEY=your_secret
# ... other exchanges

# V5.0 Features
FEATURE_AUTONOMOUS_TRADING=true
FEATURE_SELF_HEALING=true
FEATURE_AUTONOMOUS_RISK=true
FEATURE_INTELLIGENT_OPTIMIZATION=true
FEATURE_AUTOMATED_COMPLIANCE=true
FEATURE_SELF_LEARNING=true

# Trading Configuration
MAX_DAILY_LOSS_PERCENT=5
RISK_LEVEL=moderate
PREFERRED_QUOTE_CURRENCY=USDT
```

---

## 🛠️ Troubleshooting

### Common Issues

**Setup Wizard Fails**
```bash
# Ensure you're in the project root
pwd
# Should show: /path/to/cryptoai-platform

# Run with verbose output
DEBUG=* node setup.js
```

**API Key Validation Fails**
```bash
# Check credentials
node api-manager.js validate binance

# Review generated .env file
cat .env | grep BINANCE
```

**Trading Engine Won't Start**
```bash
# Check status
npm run trading:status

# Check API key configuration
npm run api:status

# Review logs
npm run dev
```

### Support Commands
```bash
# Complete platform status
node api-manager.js status

# Health check
npm run health

# API management help
node api-manager.js help
```

---

## 📈 Trading Strategies

The enhanced automated trading engine includes:

### Strategy Types
1. **Scalping** (Aggressive risk) - High-frequency, small profits
2. **Swing Trading** (Moderate risk) - Medium-term trend following
3. **Trend Following** (Conservative risk) - Long-term trend capture
4. **Arbitrage** (Low risk) - Cross-exchange price differences

### Risk Management
- Automated position sizing based on risk level
- Daily loss limits with emergency stops
- Real-time portfolio rebalancing
- Intelligent stop-loss and take-profit levels

---

## 🎉 Quick Commands Reference

```bash
# Setup & Configuration
node setup.js                    # Interactive setup wizard
node api-manager.js              # API key management CLI
npm run setup:wizard             # Alternative setup method

# Platform Control
npm run start:v5                 # Start V5.0 platform
npm run dev                      # Development mode
npm run health                   # Health check

# Trading Management
npm run trading:status           # Trading engine status
npm run trading:portfolio        # Portfolio summary
node api-manager.js settings     # Update trading settings

# API Key Management
node api-manager.js list         # List exchanges
node api-manager.js add <exchange>    # Add exchange
node api-manager.js status       # Platform status
```

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the generated logs
3. Use the built-in help commands
4. Ensure all API credentials are correctly configured

---

**CryptoAI Platform V5.0** - Making cryptocurrency trading automation accessible to everyone! 🚀

*Generated by MiniMax Agent - Enhanced Easy Setup Version*
