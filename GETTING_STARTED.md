# 🚀 Getting Started with CryptoAI Platform V2.0

Welcome to your complete cryptocurrency trading platform! This guide will help you get up and running in just a few minutes.

## ⚡ Quick Start (2 Minutes)

### Option 1: Automated Setup (Recommended)

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```bash
start.bat
```

The script will automatically:
- ✅ Check Node.js installation
- ✅ Create .env file from template
- ✅ Install all dependencies
- ✅ Test server startup
- ✅ Guide you through configuration

### Option 2: Manual Setup

1. **Create configuration file:**
   ```bash
   cp .env.template .env
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API credentials** (see below)

4. **Start the platform:**
   ```bash
   npm start
   ```

## 🔑 API Configuration

### Minimum Setup (Single Exchange)

Edit your `.env` file and add **at least one exchange**:

```env
# Crypto.com (Recommended for beginners)
CRYPTO_COM_API_KEY=your_api_key_here
CRYPTO_COM_API_SECRET=your_secret_here
```

Get Crypto.com API keys:
1. Visit [Crypto.com Exchange](https://crypto.com/exchange)
2. Go to **Settings** → **API Management**
3. Create API Key with **read permissions** (trading optional)
4. Copy API Key and Secret to your `.env` file

### Multi-Exchange Setup (Advanced)

For maximum trading opportunities, configure multiple exchanges:

```env
# Primary exchanges (choose 2-3)
CRYPTO_COM_API_KEY=your_key
CRYPTO_COM_API_SECRET=your_secret

BINANCE_API_KEY=your_key
BINANCE_API_SECRET=your_secret

BYBIT_API_KEY=your_key  
BYBIT_API_SECRET=your_secret
```

📝 **See `.env.template` for all supported exchanges**

## 🤖 AI Features Setup (Optional)

For advanced AI analysis and strategy generation:

### Install Ollama
```bash
# Linux/Mac
curl -fsSL https://ollama.ai/install.sh | sh

# Windows: Download from https://ollama.ai/
```

### Download AI Model
```bash
ollama pull llama3.1:8b
```

### Enable in .env
```env
ENABLE_AI_MODEL_DOWNLOAD=true
ENABLE_OLLAMA=true
```

## 🚀 Launch Your Platform

### Start the Server
```bash
npm start
```

Expected output:
```
✅ Database Service initialized
✅ AI Agent Service initialized  
✅ Trading Service initialized
🚀 Initializing CryptoAI Platform V2.0...
✅ CryptoAI Platform V2.0 initialized successfully
🎯 V2.0 Self-evolving system active
🌟 CryptoAI Platform Server running on port 3000
```

### Access Your Dashboard

Open your browser and visit:
- **Main Dashboard:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health
- **V2.0 Status:** http://localhost:3000/api/v2/status

## 📊 Testing Your Setup

### Basic Functionality Test
```bash
npm run test
```

### V2.0 AI Features Test
```bash
npm run test:v2
```

### Health Check
```bash
npm run health
```

### All Exchanges Test
```bash
npm run test:all
```

## 🎯 What You Can Do Now

### 1. Monitor Portfolio
- View balances across all connected exchanges
- Real-time portfolio value tracking
- Multi-currency support

### 2. Market Analysis
- Live price feeds for major trading pairs
- 24-hour change indicators
- Volume and trend analysis

### 3. AI-Powered Insights
- Intelligent market sentiment analysis
- Trading recommendations with confidence scores
- Risk assessments and strategy suggestions

### 4. Trading (Advanced)
- Execute trades through the platform
- AI-assisted position sizing (Kelly Criterion)
- Risk management with stop-loss integration

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start the platform |
| `npm run dev` | Development mode with auto-restart |
| `npm run test:v2` | Test V2.0 AI features |
| `npm run health` | Check platform health |
| `npm run quick-start` | Run setup script |

## 🔧 Configuration Options

### Trading Settings
```env
# Risk management
MAX_POSITION_SIZE=0.1        # Max 10% per trade
MAX_DAILY_RISK=0.05          # Max 5% daily risk
ENABLE_PAPER_TRADING=true    # Start with paper trading
```

### Exchange Settings
```env
# Temporarily disable problematic exchanges
DISABLE_COINBASE=true
DISABLE_KUCOIN=true

# Use sandbox/testnet for development
USE_SANDBOX=true
```

### AI Settings
```env
# AI model configuration
OLLAMA_MODEL=llama3.1:8b
ENABLE_DETAILED_LOGGING=true
```

## 🚨 Troubleshooting

### Server Won't Start
1. **Check Node.js version:** `node -v` (requires 18+)
2. **Verify port availability:** Port 3000 must be free
3. **Install dependencies:** `npm install`

### Exchange Connection Issues
1. **Verify API credentials** in `.env` file
2. **Check exchange API status** on their websites
3. **Enable sandbox mode** for testing: `USE_SANDBOX=true`

### AI Features Not Working
1. **Install Ollama:** https://ollama.ai/
2. **Download model:** `ollama pull llama3.1:8b`
3. **Check Ollama service:** `ollama list`

### No Market Data
1. **Check internet connection**
2. **Verify exchange credentials**
3. **Check firewall/proxy settings**

## 📈 Next Steps

### Immediate Actions
1. ✅ **Configure API credentials** for at least one exchange
2. ✅ **Start the platform** and verify dashboard access
3. ✅ **Test basic functionality** with paper trading
4. ✅ **Monitor real-time data** feeds

### Advanced Setup
1. 🤖 **Install Ollama** for AI features
2. 📊 **Configure multiple exchanges** for diversification
3. 🎯 **Enable live trading** after paper trading success
4. 📈 **Customize risk parameters** to your preferences

### Learning & Optimization
1. 📚 **Study the AI recommendations** and their reasoning
2. 📊 **Analyze performance metrics** and risk assessments
3. 🔧 **Fine-tune parameters** based on your trading style
4. 🚀 **Explore advanced features** like multi-agent coordination

## 🤝 Support & Resources

### Documentation
- **Complete Guide:** `README.md`
- **API Setup:** `api_credentials_setup.md`
- **V2.0 Features:** `V2_IMPLEMENTATION_COMPLETE.md`
- **Quick Fixes:** `QUICK_STARTUP_FIX.md`

### Getting Help
1. **Check console logs** for specific error messages
2. **Review health endpoint** for system status
3. **Test individual exchanges** using test scripts
4. **Verify environment configuration** in `.env`

---

## 🎉 Congratulations!

Your **CryptoAI Platform V2.0** is now ready to transform your cryptocurrency trading experience with:

- ✅ **6 Major Exchange Integrations**
- ✅ **AI-Powered Market Analysis**
- ✅ **Risk-Managed Trading**
- ✅ **Real-Time Portfolio Monitoring**
- ✅ **Self-Evolving Strategies**

**Happy Trading!** 🎯

---

*CryptoAI Platform V2.0 - Built by MiniMax Agent*
