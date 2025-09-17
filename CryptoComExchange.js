const WebSocket = require('ws');
const crypto = require('crypto');
const EnhancedWebSocketManager = require('./EnhancedWebSocketManager');

class CryptoComExchange {
  constructor() {
    this.name = 'Crypto.com';
    this.apiKey = process.env.CRYPTOCOM_API_KEY;
    this.apiSecret = process.env.CRYPTOCOM_API_SECRET;
    this.baseUrl = 'https://api.crypto.com/v2';
    this.publicBaseUrl = 'https://api.crypto.com/exchange/v1';
    this.wsUrl = 'wss://stream.crypto.com/exchange/v1/market';
    this.connected = false;
    this.features = ['spot', 'websocket', 'trading'];
    
    // Debug API credentials (log first few chars only for security)
    console.log(`🔑 Crypto.com API Key: ${this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'NOT SET'}`);
    console.log(`🔑 Crypto.com API Secret: ${this.apiSecret ? this.apiSecret.substring(0, 8) + '...' : 'NOT SET'}`);
    
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
    
    // Ticker data cache
    this.tickerCache = new Map();
  }

  async initialize() {
    console.log(`🔗 Connecting to ${this.name}...`);
    
    if (!this.apiKey || !this.apiSecret) {
      console.log(`⚠️  ${this.name} API credentials not provided, skipping connection`);
      return false;
    }

    try {
      // Test API connection by getting public tickers
      const testResponse = await fetch(`${this.publicBaseUrl}/public/get-tickers`);
      if (!testResponse.ok) {
        throw new Error(`HTTP ${testResponse.status}: ${testResponse.statusText}`);
      }
      
      const testResult = await testResponse.json();
      if (testResult.code !== 0) {
        throw new Error(`API Error: ${testResult.code}`);
      }
      
      console.log(`✅ ${this.name} API connection successful`);

      // Initialize WebSocket connection with auto-reconnect
      return await this.connectWebSocket();
      
    } catch (error) {
      console.error(`❌ ${this.name} connection failed:`, error.message);
      return false;
    }
  }

  async connectWebSocket() {
    return new Promise((resolve) => {
      try {
        // Clean up existing connection
        if (this.ws) {
          this.ws.removeAllListeners();
          this.ws.close();
        }

        this.ws = new WebSocket(this.wsUrl);
        
        this.ws.on('error', (error) => {
          console.error(`${this.name} WebSocket error:`, error.message);
          this.connected = false;
          if (!this.isReconnecting) {
            this.scheduleReconnect();
          }
          resolve(false);
        });
        
        this.ws.on('open', () => {
          console.log(`✅ ${this.name} WebSocket connected`);
          this.connected = true;
          this.reconnectAttempts = 0; // Reset attempts on successful connection
          this.reconnectDelay = 1000; // Reset delay
          this.isReconnecting = false;
          
          // Subscribe to ticker data
          const subscribeMessage = {
            id: Date.now(),
            method: 'subscribe',
            params: {
              channels: ['ticker.BTC_USDT', 'ticker.ETH_USDT']
            }
          };
          
          this.ws.send(JSON.stringify(subscribeMessage));
          resolve(true);
        });
        
        this.ws.on('close', (code, reason) => {
          console.log(`🔌 ${this.name} WebSocket disconnected (Code: ${code}, Reason: ${reason})`);
          this.connected = false;
          
          // Only attempt reconnection if not manually disconnected
          if (code !== 1000 && !this.isReconnecting) {
            this.scheduleReconnect();
          }
        });
        
        this.ws.on('message', (data) => {
          try {
            const message = JSON.parse(data);
            this.handleWebSocketMessage(message);
          } catch (error) {
            console.error(`${this.name} WebSocket message parse error:`, error);
          }
        });
        
        // Connection timeout
        setTimeout(() => {
          if (!this.connected) {
            console.log(`⏰ ${this.name} WebSocket connection timeout`);
            if (this.ws) {
              this.ws.close();
            }
            if (!this.isReconnecting) {
              this.scheduleReconnect();
            }
            resolve(false);
          }
        }, 10000);
        
      } catch (error) {
        console.error(`${this.name} WebSocket initialization error:`, error);
        if (!this.isReconnecting) {
          this.scheduleReconnect();
        }
        resolve(false);
      }
    });
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ ${this.name} reached maximum reconnection attempts (${this.maxReconnectAttempts})`);
      return;
    }

    if (this.isReconnecting) {
      return; // Already attempting to reconnect
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    console.log(`🔄 ${this.name} scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        console.log(`🔄 ${this.name} attempting to reconnect...`);
        await this.connectWebSocket();
      } catch (error) {
        console.error(`${this.name} reconnection failed:`, error);
        this.isReconnecting = false;
        // Exponential backoff with jitter
        this.reconnectDelay = Math.min(
          this.reconnectDelay * 2 + Math.random() * 1000,
          this.maxReconnectDelay
        );
        this.scheduleReconnect();
      }
    }, this.reconnectDelay);
  }

  handleWebSocketMessage(message) {
    if (message.result && message.result.channel) {
      // Handle ticker updates
      if (message.result.channel.startsWith('ticker.')) {
        // Process ticker data
      }
    }
  }

  isConnected() {
    // For balance/API operations, we only need valid credentials
    // WebSocket connection is separate and used for real-time data
    return !!(this.apiKey && this.apiSecret);
  }
  
  isWebSocketConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  async reconnect() {
    console.log(`🔄 ${this.name} manual reconnection requested`);
    
    // Clear any existing reconnection attempts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Reset reconnection state
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    
    // Disconnect existing connection
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
    }
    
    // Attempt new connection
    return await this.connectWebSocket();
  }

  generateSignature(method, params) {
    const nonce = Date.now();
    
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const payload = method + (paramString ? '&' + paramString : '');
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(payload)
      .digest('hex');
    
    return {
      signature,
      nonce
    };
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
    
    // FIXED: Korrekt signature generation ifølge officiel Crypto.com dokumentation
    // Signature payload: method + id + api_key + paramsString + nonce
    const paramsString = this.objectToString(stringifiedParams);
    const sigPayload = `${method}${id}${this.apiKey}${paramsString}${nonce}`;
    
    console.log(`🔍 Signature payload: "${sigPayload}"`);
    
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
    
    console.log(`🔍 Crypto.com API Request:`, {
      url: `${this.baseUrl}/${method}`,
      method: method,
      body: JSON.stringify(requestBody, null, 2)
    });

    // FIXED: Korrekt endpoint format - POST til V2 API med method path
    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'crypto-dashboard/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    
    console.log(`🔍 Response: ${response.status} - ${responseText}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} - Response: ${responseText}`);
    }

    const result = JSON.parse(responseText);
    
    // Check for API-level errors
    if (result.code && result.code !== 0) {
      throw new Error(`Crypto.com API Error (${result.code}): ${result.message || 'Unknown error'}`);
    }
    
    return result;
  }

  async getBalance() {
    if (!this.isConnected()) {
      throw new Error(`${this.name} is not connected`);
    }

    try {
      const result = await this.makePrivateRequest('private/get-account-summary');
      
      if (result.code !== 0) {
        throw new Error(`${this.name} API error: ${result.message}`);
      }
      
      // Transform Crypto.com API balance format to standardized format
      const balances = {};
      
      if (result.result && result.result.accounts && Array.isArray(result.result.accounts)) {
        result.result.accounts.forEach(account => {
          if (account.balance && account.currency) {
            const balance = parseFloat(account.balance || 0);
            const available = parseFloat(account.available || account.balance || 0);
            const locked = balance - available;
            
            if (balance > 0) {
              balances[account.currency] = {
                free: Math.max(available, 0),
                locked: Math.max(locked, 0),
                total: balance
              };
            }
          }
        });
      }

      console.log(`💰 ${this.name} balance fetched:`, balances);

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
    if (!this.isConnected()) {
      return null;
    }

    try {
      // Convert symbol format (e.g., BTC/USDT -> BTC_USDT)
      const cryptoComSymbol = symbol.replace('/', '_');
      
      // Use get-tickers endpoint and filter for our symbol
      const response = await fetch(`${this.publicBaseUrl}/public/get-tickers`);

      if (!response.ok) {
        console.error(`${this.name} API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const result = await response.json();
      
      if (result.code !== 0 || !result.result || !result.result.data) {
        console.error(`${this.name} API returned error or no data:`, result);
        return null;
      }
      
      // Find our specific symbol in the tickers data
      const ticker = result.result.data.find(t => t.i === cryptoComSymbol);
      
      if (!ticker) {
        console.log(`${this.name} symbol ${cryptoComSymbol} not found in ticker data`);
        return null;
      }
      
      // Map Crypto.com fields to our standard format
      const price = parseFloat(ticker.a); // Ask price (last price)
      const high = parseFloat(ticker.h || 0); // 24h high
      const low = parseFloat(ticker.l || 0); // 24h low
      const volume = parseFloat(ticker.v || 0); // 24h volume
      
      // Calculate 24h change percentage if high/low available
      const changePercent = high > 0 && low > 0 ? 
        ((price - low) / low * 100) : 0;
      
      const result_data = {
        symbol,
        price,
        bid: parseFloat(ticker.b || price), // Bid price
        ask: parseFloat(ticker.a || price), // Ask price
        change: 0, // Crypto.com doesn't provide direct change value
        changePercent,
        volume,
        baseVolume: volume, // Use same volume for base volume
        high,
        low,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ ${this.name} ticker for ${symbol}:`, { price, changePercent: changePercent.toFixed(2) + '%' });
      return result_data;
      
    } catch (error) {
      console.error(`${this.name} ticker fetch error for ${symbol}:`, error);
      return null;
    }
  }

  async createOrder(params) {
    if (!this.isConnected()) {
      throw new Error(`${this.name} is not connected`);
    }

    const { symbol, side, amount, type = 'MARKET' } = params;
    
    try {
      const cryptoComSymbol = symbol.replace('/', '_');
      
        // Build order parameters according to Crypto.com API spec
      const orderParams = {
        instrument_name: cryptoComSymbol,
        side: side.toUpperCase(),
        type: type.toUpperCase()
      };
      
      // For MARKET orders, use different parameters based on side
      if (type.toUpperCase() === 'MARKET') {
        if (side.toUpperCase() === 'SELL') {
          // SELL MARKET orders require 'quantity'
          orderParams.quantity = amount.toString();
        } else {
          // BUY MARKET orders require 'notional' (amount to spend)
          orderParams.notional = amount.toString();
        }
      } else {
        // For LIMIT orders, always use quantity
        orderParams.quantity = amount.toString();
      }
      
      // Add client order ID for tracking
      orderParams.client_oid = `trade_${Date.now()}`;

      console.log(`🔄 ${this.name} creating order:`, orderParams);
      
      const result = await this.makePrivateRequest('private/create-order', orderParams);
      
      console.log(`📋 ${this.name} order response:`, result);
      
      if (result.code !== 0) {
        throw new Error(`${this.name} order failed: ${result.message}`);
      }
      
      const data = result.result;
      
      return {
        exchange: this.name,
        orderId: data.order_id,
        symbol: cryptoComSymbol.replace('_', '/'),
        side: orderParams.side,
        amount: parseFloat(orderParams.quantity || orderParams.notional || amount),
        price: 0, // Market order price will be filled
        status: 'submitted',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`${this.name} order creation error:`, error);
      throw error;
    }
  }

  async disconnect() {
    // Clear any pending reconnection attempts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    
    if (this.ws) {
      this.ws.removeAllListeners(); // Clean up listeners to prevent memory leaks
      this.ws.close(1000, 'Manual disconnect'); // Use code 1000 for normal closure
      this.ws = null;
    }
    this.connected = false;
    console.log(`🔌 ${this.name} disconnected`);
  }
}

module.exports = CryptoComExchange;