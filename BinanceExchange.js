const WebSocket = require('ws');
const crypto = require('crypto');
const EnhancedWebSocketManager = require('./EnhancedWebSocketManager');

class BinanceExchange {
  constructor() {
    this.name = 'Binance';
    this.apiKey = process.env.BINANCE_API_KEY;
    this.apiSecret = process.env.BINANCE_API_SECRET;
    this.baseUrl = 'https://api.binance.com';
    this.wsUrl = 'wss://stream.binance.com:9443/ws';
    this.connected = false;
    this.features = ['spot', 'futures', 'websocket', 'trading'];
    
    // Enhanced WebSocket Manager med anti-fragil arkitektur
    this.wsManager = new EnhancedWebSocketManager(this.name, this.wsUrl, {
      maxAttempts: 15,
      initialDelay: 1000,
      maxDelay: 30000,
      delayMultiplier: 1.5,
      jitterFactor: 0.1,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      healthCheckInterval: 30000,
      maxMissedPings: 3
    });
    
    // Ticker data cache med built-in error handling
    this.tickerCache = new Map();
    this.subscriptionMap = new Map();
    
    // Setup event handlers
    this.setupWebSocketEventHandlers();
  }

  setupWebSocketEventHandlers() {
    this.wsManager.on('connected', () => {
      console.log(`✅ ${this.name} Enhanced WebSocket forbundet`);
      this.connected = true;
      this.subscribeToMarketData();
    });

    this.wsManager.on('disconnected', ({ code, reason }) => {
      console.log(`🔌 ${this.name} Enhanced WebSocket afbrudt: ${code} - ${reason}`);
      this.connected = false;
    });

    this.wsManager.on('message', (message) => {
      this.handleWebSocketMessage(message);
    });

    this.wsManager.on('error', (error) => {
      console.error(`❌ ${this.name} Enhanced WebSocket fejl:`, error.message);
    });

    this.wsManager.on('circuitBreakerOpen', () => {
      console.log(`🔒 ${this.name} Circuit breaker åbnet - skifter til API fallback`);
    });

    this.wsManager.on('maxReconnectAttemptsReached', () => {
      console.error(`❌ ${this.name} Maksimalt antal reconnection forsøg nået`);
      // Fallback til API-only mode
      this.connected = false;
    });
  }

  async initialize() {
    console.log(`🔗 Forbinder til ${this.name} med anti-fragil arkitektur...`);
    
    if (!this.apiKey || !this.apiSecret) {
      console.log(`⚠️  ${this.name} API credentials ikke angivet, springer forbindelse over`);
      return false;
    }

    try {
      // Test API forbindelse først
      const response = await fetch(`${this.baseUrl}/api/v3/time`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ ${this.name} API forbindelse succesfuld`);

      // Initialiser enhanced WebSocket forbindelse
      const wsConnected = await this.wsManager.connect();
      
      if (wsConnected) {
        console.log(`🚀 ${this.name} Fuldt initialiseret med anti-fragil WebSocket`);
        return true;
      } else {
        console.log(`⚠️ ${this.name} WebSocket fejlede, men API fungerer`);
        return true; // Kan stadig fungere i API-only mode
      }
      
    } catch (error) {
      console.error(`❌ ${this.name} forbindelse fejlede:`, error.message);
      return false;
    }
  }

  subscribeToMarketData() {
    // Subscribe til kritiske trading pairs inklusive BNB/USDT fix
    const symbols = [
      'btcusdt@ticker',
      'ethusdt@ticker', 
      'bnbusdt@ticker',  // FIXED: Specifik BNB/USDT subscription
      'adausdt@ticker',
      'dotusdt@ticker',
      'solusdt@ticker'
    ];

    console.log(`📺 ${this.name} Subscriber til ${symbols.length} ticker streams`);

    // Subscribe til alle streams i en samlet besked
    const subscribeMessage = {
      method: 'SUBSCRIBE',
      params: symbols,
      id: Date.now()
    };

    // Gem subscription for resubscription
    symbols.forEach(symbol => {
      const baseSymbol = symbol.split('@')[0].toUpperCase();
      this.subscriptionMap.set(baseSymbol, symbol);
    });

    return this.wsManager.subscribe(subscribeMessage);
  }

  handleWebSocketMessage(message) {
    try {
      // Håndter forskellige beskedtyper fra Binance WebSocket
      if (message.stream && message.data) {
        // Ticker data stream
        const { stream, data } = message;
        
        if (stream.includes('@ticker')) {
          this.processTicker(data);
        }
      } else if (message.result === null && message.id) {
        // Subscription confirmation
        console.log(`✅ ${this.name} Subscription bekræftet for ID: ${message.id}`);
      } else if (message.error) {
        console.error(`❌ ${this.name} WebSocket fejl:`, message.error);
      }
    } catch (error) {
      console.error(`${this.name} Besked håndteringsfejl:`, error);
    }
  }

  processTicker(tickerData) {
    try {
      const symbol = tickerData.s; // Symbol fra Binance (f.eks. BNBUSDT)
      
      // FIXED: Forbedret symbol mapping for BNB/USDT og andre
      const normalizedSymbol = this.normalizeSymbol(symbol);
      
      const processedTicker = {
        symbol: normalizedSymbol,
        price: parseFloat(tickerData.c), // Current price
        change: parseFloat(tickerData.P), // Price change percent  
        changePercent: parseFloat(tickerData.P),
        volume: parseFloat(tickerData.v), // Volume
        high: parseFloat(tickerData.h), // High price
        low: parseFloat(tickerData.l), // Low price
        timestamp: new Date().toISOString(),
        exchange: this.name,
        raw: tickerData // Gem raw data til debugging
      };

      // Cache ticker data
      this.tickerCache.set(normalizedSymbol, processedTicker);
      
      // Emit event for real-time updates
      if (this.wsManager) {
        this.wsManager.emit('ticker', processedTicker);
      }

    } catch (error) {
      console.error(`${this.name} Ticker processing fejl:`, error);
    }
  }

  normalizeSymbol(binanceSymbol) {
    // FIXED: Robust symbol normalization for BNB/USDT problem
    const symbolMappings = {
      'BTCUSDT': 'BTC/USDT',
      'ETHUSDT': 'ETH/USDT',
      'BNBUSDT': 'BNB/USDT',  // CRITICAL FIX
      'ADAUSDT': 'ADA/USDT',
      'DOTUSDT': 'DOT/USDT',
      'SOLUSDT': 'SOL/USDT',
      'XRPUSDT': 'XRP/USDT',
      'LINKUSDT': 'LINK/USDT',
      'LTCUSDT': 'LTC/USDT',
      'BCHUSDT': 'BCH/USDT'
    };

    // Hvis direkte mapping eksisterer, brug den
    if (symbolMappings[binanceSymbol]) {
      return symbolMappings[binanceSymbol];
    }

    // Ellers, automatisk konvertering
    if (binanceSymbol.endsWith('USDT')) {
      const base = binanceSymbol.slice(0, -4);
      return `${base}/USDT`;
    }
    
    if (binanceSymbol.endsWith('BTC')) {
      const base = binanceSymbol.slice(0, -3);
      return `${base}/BTC`;
    }
    
    if (binanceSymbol.endsWith('ETH')) {
      const base = binanceSymbol.slice(0, -3);
      return `${base}/ETH`;
    }

    // Fallback - returner som er
    return binanceSymbol;
  }

  isConnected() {
    return this.wsManager.isConnected() || !!(this.apiKey && this.apiSecret);
  }

  isWebSocketConnected() {
    return this.wsManager.isConnected();
  }

  async getBalance() {
    if (!this.isConnected()) {
      throw new Error(`${this.name} is not connected`);
    }

    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = crypto
        .createHmac('sha256', this.apiSecret)
        .update(queryString)
        .digest('hex');

      const response = await fetch(
        `${this.baseUrl}/api/v3/account?${queryString}&signature=${signature}`,
        {
          headers: {
            'X-MBX-APIKEY': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform Binance balance format to standardized format
      const balances = {};
      if (data.balances) {
        data.balances.forEach(balance => {
          const free = parseFloat(balance.free);
          const locked = parseFloat(balance.locked);
          if (free > 0 || locked > 0) {
            balances[balance.asset] = {
              free,
              locked,
              total: free + locked
            };
          }
        });
      }

      return {
        exchange: this.name,
        currencies: balances,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`${this.name} balance fetch error:`, error);
      throw error;
    }
  }

  async getTicker(symbol) {
    // FIXED: Robuste multi-layer approach til ticker data
    try {
      // Forsøg 1: Check cache fra WebSocket data
      const cachedTicker = this.tickerCache.get(symbol);
      if (cachedTicker) {
        const ageMs = new Date() - new Date(cachedTicker.timestamp);
        if (ageMs < 10000) { // Data younger than 10 seconds
          return cachedTicker;
        }
      }

      // Forsøg 2: Hent fra API som fallback
      return await this.getTickerFromAPI(symbol);
      
    } catch (error) {
      console.error(`${this.name} getTicker fejl for ${symbol}:`, error);
      
      // Forsøg 3: Returner cached data selvom det er gammelt
      const staleTicker = this.tickerCache.get(symbol);
      if (staleTicker) {
        console.warn(`⚠️ ${this.name} Returnerer gammelt ticker data for ${symbol}`);
        return staleTicker;
      }
      
      return null;
    }
  }

  async getTickerFromAPI(symbol) {
    try {
      // Convert symbol format (e.g., BTC/USDT -> BTCUSDT)
      const binanceSymbol = this.convertToBinanceSymbol(symbol);
      
      // FIXED: Specifik API call med error handling
      const response = await fetch(
        `${this.baseUrl}/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
        {
          timeout: 5000,
          headers: {
            'User-Agent': 'Binance/Anti-Fragil-Client'
          }
        }
      );

      if (!response.ok) {
        // Specifik håndtering af forskellige fejlkoder
        if (response.status === 400) {
          console.error(`❌ ${this.name} Ugyldigt symbol: ${binanceSymbol} (fra ${symbol})`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const processedTicker = {
        symbol,
        price: parseFloat(data.lastPrice),
        change: parseFloat(data.priceChange),
        changePercent: parseFloat(data.priceChangePercent),
        volume: parseFloat(data.volume),
        high: parseFloat(data.highPrice),
        low: parseFloat(data.lowPrice),
        timestamp: new Date().toISOString(),
        exchange: this.name,
        source: 'API'
      };

      // Cache API data
      this.tickerCache.set(symbol, processedTicker);
      
      return processedTicker;
      
    } catch (error) {
      console.error(`${this.name} API ticker fetch fejl for ${symbol}:`, error);
      throw error;
    }
  }

  convertToBinanceSymbol(normalizedSymbol) {
    // FIXED: Robust conversion handling for BNB/USDT issue
    const directMappings = {
      'BTC/USDT': 'BTCUSDT',
      'ETH/USDT': 'ETHUSDT',
      'BNB/USDT': 'BNBUSDT',  // CRITICAL FIX
      'ADA/USDT': 'ADAUSDT',
      'DOT/USDT': 'DOTUSDT',
      'SOL/USDT': 'SOLUSDT',
      'XRP/USDT': 'XRPUSDT',
      'LINK/USDT': 'LINKUSDT',
      'LTC/USDT': 'LTCUSDT',
      'BCH/USDT': 'BCHUSDT'
    };

    if (directMappings[normalizedSymbol]) {
      return directMappings[normalizedSymbol];
    }

    // Auto-conversion for other symbols
    return normalizedSymbol.replace('/', '');
  }

  async createOrder(params) {
    if (!this.isConnected()) {
      throw new Error(`${this.name} is not connected`);
    }

    const { symbol, side, amount, type = 'MARKET' } = params;
    
    try {
      const timestamp = Date.now();
      const binanceSymbol = symbol.replace('/', '');
      
      const orderParams = {
        symbol: binanceSymbol,
        side: side.toUpperCase(),
        type: type.toUpperCase(),
        quantity: amount,
        timestamp
      };

      const queryString = new URLSearchParams(orderParams).toString();
      const signature = crypto
        .createHmac('sha256', this.apiSecret)
        .update(queryString)
        .digest('hex');

      const response = await fetch(
        `${this.baseUrl}/api/v3/order?${queryString}&signature=${signature}`,
        {
          method: 'POST',
          headers: {
            'X-MBX-APIKEY': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`${this.name} order failed: ${error.msg || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        exchange: this.name,
        orderId: data.orderId,
        symbol: data.symbol,
        side: data.side,
        amount: parseFloat(data.origQty),
        price: parseFloat(data.price || 0),
        status: data.status,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`${this.name} order creation error:`, error);
      throw error;
    }
  }

  async disconnect() {
    console.log(`🔌 ${this.name} Afbryder med anti-fragil cleanup...`);
    
    this.connected = false;
    
    // Cleanup enhanced WebSocket manager
    if (this.wsManager) {
      this.wsManager.disconnect();
    }
    
    // Clear cache
    this.tickerCache.clear();
    this.subscriptionMap.clear();
    
    console.log(`✅ ${this.name} Afbrudt og cleanup færdig`);
  }

  async reconnect() {
    console.log(`🔄 ${this.name} Manuel reconnection anmodet`);
    return await this.wsManager.reconnect();
  }

  // Få alle cached ticker data
  getAllCachedTickers() {
    const tickers = {};
    for (const [symbol, data] of this.tickerCache.entries()) {
      tickers[symbol] = data;
    }
    return tickers;
  }

  // Få detaljeret status
  getDetailedStatus() {
    const wsStatus = this.wsManager.getStatus();
    
    return {
      exchange: this.name,
      apiConnected: !!(this.apiKey && this.apiSecret),
      webSocketStatus: wsStatus,
      cachedTickers: this.tickerCache.size,
      subscriptions: this.subscriptionMap.size,
      features: this.features,
      isHealthy: this.isConnected()
    };
  }

  // Health check metode
  async performHealthCheck() {
    const status = {
      exchange: this.name,
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // Check API connectivity
    try {
      const response = await fetch(`${this.baseUrl}/api/v3/time`, { timeout: 5000 });
      status.checks.apiHealth = response.ok;
    } catch (error) {
      status.checks.apiHealth = false;
      status.checks.apiError = error.message;
    }

    // Check WebSocket connectivity
    status.checks.webSocketHealth = this.wsManager.isConnected();
    status.checks.webSocketDetails = this.wsManager.getStatus();

    // Check ticker data freshness
    let freshTickers = 0;
    const now = Date.now();
    for (const [symbol, ticker] of this.tickerCache.entries()) {
      const age = now - new Date(ticker.timestamp).getTime();
      if (age < 30000) { // Less than 30 seconds old
        freshTickers++;
      }
    }
    status.checks.freshTickerCount = freshTickers;
    status.checks.totalTickerCount = this.tickerCache.size;

    return status;
  }
}

module.exports = BinanceExchange;