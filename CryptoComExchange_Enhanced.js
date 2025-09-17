const WebSocket = require('ws');
const crypto = require('crypto');
const EnhancedWebSocketManager = require('./EnhancedWebSocketManager');

class CryptoComExchange {
  constructor() {
    this.name = 'Crypto.com';
    this.apiKey = process.env.CRYPTOCOM_API_KEY;
    this.apiSecret = process.env.CRYPTOCOM_API_SECRET;
    this.baseUrl = 'https://api.crypto.com/v2';
    this.wsUrl = 'wss://stream.crypto.com/exchange/v1/market';
    this.connected = false;
    this.features = ['spot', 'websocket', 'trading'];
    
    // Debug API credentials (log first few chars only for security)
    console.log(`🔑 Crypto.com API Key: ${this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'NOT SET'}`);
    console.log(`🔑 Crypto.com API Secret: ${this.apiSecret ? this.apiSecret.substring(0, 8) + '...' : 'NOT SET'}`);
    
    // Enhanced WebSocket Manager med anti-fragil arkitektur
    // KRITISK INFRASTRUKTUR: Exponential Backoff konfigureret iht. specifikationer
    this.wsManager = new EnhancedWebSocketManager(this.name, this.wsUrl, {
      maxAttempts: 10,           // Max retry attempts: 10
      initialDelay: 1000,        // Start delay: 1000ms  
      maxDelay: 30000,           // Max delay: 30 sekunder
      delayMultiplier: 2.0,      // Backoff multiplicator: 2.0
      jitterFactor: 0.1,         // Jitter for at undgå thundering herd
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      healthCheckInterval: 30000,
      maxMissedPings: 3
    });
    
    // Ticker data cache
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
      console.log(`🔒 ${this.name} Circuit breaker åbnet - aktiverer CoinGecko fallback`);
      console.log(`📊 System faldt tilbage til CoinGecko API pga. gentagne Code: 1000 afbrydelser`);
    });

    this.wsManager.on('maxReconnectAttemptsReached', () => {
      console.error(`❌ ${this.name} Maksimalt antal reconnection forsøg nået`);
      console.log(`🌐 Aktiverer permanent CoinGecko fallback mode`);
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
      const testResponse = await fetch(`${this.baseUrl}/public/get-tickers`);
      if (!testResponse.ok) {
        throw new Error(`HTTP ${testResponse.status}: ${testResponse.statusText}`);
      }
      
      const testResult = await testResponse.json();
      if (testResult.code !== 0) {
        throw new Error(`API Error: ${testResult.code}`);
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
    // Subscribe til kritiske trading pairs
    const subscribeMessage = {
      id: Date.now(),
      method: 'subscribe',
      params: {
        channels: [
          'ticker.BTC_USDT',
          'ticker.ETH_USDT',
          'ticker.CRO_USDT',
          'ticker.ADA_USDT',
          'ticker.DOT_USDT'
        ]
      }
    };

    console.log(`📺 ${this.name} Subscriber til ticker streams`);
    return this.wsManager.subscribe(subscribeMessage);
  }

  handleWebSocketMessage(message) {
    try {
      if (message.result && message.result.channel) {
        // Handle ticker updates
        if (message.result.channel.startsWith('ticker.')) {
          this.processTicker(message.result);
        }
      } else if (message.id && message.method === 'subscribe') {
        console.log(`✅ ${this.name} Subscription bekræftet for ID: ${message.id}`);
      }
    } catch (error) {
      console.error(`${this.name} Besked håndteringsfejl:`, error);
    }
  }

  processTicker(tickerData) {
    try {
      // Extract symbol from channel name (e.g., ticker.BTC_USDT -> BTC/USDT)
      const channelParts = tickerData.channel.split('.');
      if (channelParts.length !== 2) return;
      
      const symbolParts = channelParts[1].split('_');
      if (symbolParts.length !== 2) return;
      
      const normalizedSymbol = `${symbolParts[0]}/${symbolParts[1]}`;
      
      const processedTicker = {
        symbol: normalizedSymbol,
        price: parseFloat(tickerData.data?.price || 0),
        change: parseFloat(tickerData.data?.change || 0),
        changePercent: parseFloat(tickerData.data?.change_24h || 0),
        volume: parseFloat(tickerData.data?.volume || 0),
        high: parseFloat(tickerData.data?.high || 0),
        low: parseFloat(tickerData.data?.low || 0),
        timestamp: new Date().toISOString(),
        exchange: this.name,
        raw: tickerData
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

  isConnected() {
    return this.wsManager.isConnected() || !!(this.apiKey && this.apiSecret);
  }

  isWebSocketConnected() {
    return this.wsManager.isConnected();
  }

  async getTicker(symbol) {
    try {
      // Forsøg 1: Check cache fra WebSocket data
      const cachedTicker = this.tickerCache.get(symbol);
      if (cachedTicker) {
        const ageMs = new Date() - new Date(cachedTicker.timestamp);
        if (ageMs < 10000) { // Data younger than 10 seconds
          return cachedTicker;
        }
      }

      // Forsøg 2: Hent fra Crypto.com API som fallback
      return await this.getTickerFromAPI(symbol);
      
    } catch (error) {
      console.error(`${this.name} getTicker fejl for ${symbol}:`, error);
      
      // Forsøg 3: Fallback til CoinGecko API (TRANSPARENT LOGGING)
      console.log(`🔄 ${this.name} → CoinGecko fallback for ${symbol} (Crypto.com utilgængeligt)`);
      try {
        const coinGeckoTicker = await this.getTickerFromCoinGecko(symbol);
        if (coinGeckoTicker) {
          console.log(`✅ CoinGecko fallback successful for ${symbol}: $${coinGeckoTicker.price}`);
          return coinGeckoTicker;
        }
      } catch (coinGeckoError) {
        console.error(`❌ CoinGecko fallback fejlede for ${symbol}:`, coinGeckoError.message);
      }
      
      // Forsøg 4: Returner cached data selvom det er gammelt
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
      // Convert symbol format (e.g., BTC/USDT -> BTC_USDT)
      const cryptoComSymbol = symbol.replace('/', '_');
      
      const response = await fetch(
        `${this.baseUrl}/public/get-ticker?instrument_name=${cryptoComSymbol}`,
        {
          timeout: 5000,
          headers: {
            'User-Agent': 'CryptoCom/Anti-Fragil-Client'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.code !== 0 || !result.result) {
        throw new Error(`Crypto.com API fejl: ${result.code}`);
      }

      const data = result.result.data;
      
      const processedTicker = {
        symbol,
        price: parseFloat(data.a), // Ask price
        change: parseFloat(data.c), // Change
        changePercent: parseFloat(data.c) / parseFloat(data.o) * 100, // Change percentage
        volume: parseFloat(data.v), // Volume
        high: parseFloat(data.h), // High
        low: parseFloat(data.l), // Low
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

  async getTickerFromCoinGecko(symbol) {
    try {
      console.log(`🌐 Fallback til CoinGecko API for ${symbol}...`);
      
      // Map crypto symbols to CoinGecko IDs
      const symbolToCoinGeckoId = {
        'BTC/USDT': 'bitcoin',
        'ETH/USDT': 'ethereum', 
        'BNB/USDT': 'binancecoin',
        'ADA/USDT': 'cardano',
        'DOT/USDT': 'polkadot',
        'SOL/USDT': 'solana',
        'CRO/USDT': 'crypto-com-chain',
        'XRP/USDT': 'ripple',
        'MATIC/USDT': 'polygon',
        'AVAX/USDT': 'avalanche-2',
        'ATOM/USDT': 'cosmos',
        'LTC/USDT': 'litecoin'
      };
      
      const coinGeckoId = symbolToCoinGeckoId[symbol];
      if (!coinGeckoId) {
        throw new Error(`Symbol ${symbol} ikke supporteret af CoinGecko fallback`);
      }
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
        {
          timeout: 5000,
          headers: {
            'User-Agent': 'CryptoCom-Enhanced/Anti-Fragil-Client'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const coinData = data[coinGeckoId];
      
      if (!coinData) {
        throw new Error(`Ingen data tilgængelig fra CoinGecko for ${symbol}`);
      }

      const processedTicker = {
        symbol,
        price: coinData.usd,
        change: coinData.usd_24h_change || 0,
        changePercent: coinData.usd_24h_change || 0,
        volume: coinData.usd_24h_vol || 0,
        high: coinData.usd * 1.02, // Approximate high (2% above current)
        low: coinData.usd * 0.98,  // Approximate low (2% below current)
        timestamp: new Date().toISOString(),
        exchange: 'CoinGecko',
        source: 'CoinGecko_Fallback'
      };

      // Cache CoinGecko data med fallback indikator
      this.tickerCache.set(symbol, processedTicker);
      
      return processedTicker;
      
    } catch (error) {
      console.error(`❌ CoinGecko fallback fejl for ${symbol}:`, error.message);
      throw error;
    }
  }

  objectToString(obj) {
    // Exact implementation from Crypto.com official documentation
    const self = this;
    
    function isObject(obj) {
      return obj !== undefined && obj !== null && obj.constructor === Object;
    }

    function isArray(obj) {
      return obj !== undefined && obj !== null && obj.constructor === Array;
    }

    function arrayToString(obj) {
      return obj.reduce((a, b) => {
        return a + (isObject(b) ? self.objectToString(b) : (isArray(b) ? arrayToString(b) : b));
      }, "");
    }

    return (
      obj == null
        ? ""
        : Object.keys(obj).sort().reduce((a, b) => {
            return a + b + (isArray(obj[b]) ? arrayToString(obj[b]) : (isObject(obj[b]) ? self.objectToString(obj[b]) : obj[b]));
          }, "")
    );
  }

  async makePrivateRequest(method, params = {}) {
    const nonce = Date.now();
    const id = nonce;
    
    // Convert all numbers to strings as required by Crypto.com API
    const stringifiedParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'number') {
        stringifiedParams[key] = value.toString();
      } else {
        stringifiedParams[key] = value;
      }
    }
    
    // FIXED: Korrekt signature generation ifølge Crypto.com docs
    const paramsString = this.objectToString(stringifiedParams);
    const sigPayload = `${method}${id}${this.apiKey}${paramsString}${nonce}`;
    
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(sigPayload)
      .digest('hex');
    
    const requestBody = {
      id: id.toString(),
      method: method,
      api_key: this.apiKey,
      params: stringifiedParams,
      nonce: nonce.toString(),
      sig: signature
    };

    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'crypto-dashboard/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} - Response: ${responseText}`);
    }

    const result = JSON.parse(responseText);
    
    // Check for API-level errors
    if (result.code && result.code !== 0) {
      throw new Error(`Crypto.com API Error (${result.code}): ${result.message || 'Unknown error'}`);
    }

    return result.result;
  }

  async getBalance() {
    if (!this.isConnected()) {
      throw new Error(`${this.name} is not connected`);
    }

    try {
      const result = await this.makePrivateRequest('private/get-account-summary');
      
      // Transform Crypto.com balance format to standardized format
      const balances = {};
      if (result && result.accounts) {
        result.accounts.forEach(account => {
          const available = parseFloat(account.available);
          const locked = parseFloat(account.locked);
          if (available > 0 || locked > 0) {
            balances[account.currency] = {
              free: available,
              locked: locked,
              total: available + locked
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

  async createOrder(params) {
    if (!this.isConnected()) {
      throw new Error(`${this.name} is not connected`);
    }

    const { symbol, side, amount, type = 'MARKET' } = params;
    
    try {
      const cryptoComSymbol = symbol.replace('/', '_');
      
      const orderParams = {
        instrument_name: cryptoComSymbol,
        side: side.toUpperCase(),
        type: type.toUpperCase(),
        quantity: amount.toString()
      };

      const result = await this.makePrivateRequest('private/create-order', orderParams);
      
      return {
        exchange: this.name,
        orderId: result.order_id,
        symbol: symbol,
        side: side,
        amount: parseFloat(amount),
        price: parseFloat(result.price || 0),
        status: result.status || 'submitted',
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
      const response = await fetch(`${this.baseUrl}/public/get-tickers`, { timeout: 5000 });
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

module.exports = CryptoComExchange;