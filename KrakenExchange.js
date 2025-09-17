const crypto = require('crypto');
const axios = require('axios');
const WebSocket = require('ws');
const EventEmitter = require('events');

class KrakenExchange extends EventEmitter {
  constructor(config = {}) {
    super();
    this.name = 'Kraken';
    this.baseURL = process.env.KRAKEN_BASE_URL || 'https://api.kraken.com';
    this.wsURL = process.env.KRAKEN_WS_URL || 'wss://ws.kraken.com';
    this.apiKey = process.env.KRAKEN_API_KEY || config.apiKey;
    this.apiSecret = process.env.KRAKEN_API_SECRET || config.apiSecret;
    
    this.ws = null;
    this.connected = false;
    this.authenticated = false;
    this.nonce = Date.now() * 1000; // Start with microseconds
    
    this.rateLimits = {
      requests: 0,
      lastReset: Date.now()
    };
    
    // Circuit breaker
    this.circuitBreaker = {
      failures: 0,
      lastFailTime: 0,
      isOpen: false,
      threshold: 5,
      timeout: 30000
    };
  }

  // Generate nonce (always increasing)
  generateNonce() {
    this.nonce = Math.max(this.nonce + 1, Date.now() * 1000);
    return this.nonce.toString();
  }

  // Generate API-Sign signature
  generateSignature(path, nonce, postData) {
    const message = nonce + postData;
    const secretBuffer = Buffer.from(this.apiSecret, 'base64');
    const hash = crypto.createHash('sha256').update(message).digest();
    const hmac = crypto.createHmac('sha512', secretBuffer);
    const pathBuffer = Buffer.from(path, 'utf8');
    
    return hmac.update(Buffer.concat([pathBuffer, hash])).digest('base64');
  }

  // Make authenticated API request
  async makeRequest(method, endpoint, params = {}, isPrivate = false) {
    try {
      // Check circuit breaker
      if (this.circuitBreaker.isOpen && 
          Date.now() - this.circuitBreaker.lastFailTime < this.circuitBreaker.timeout) {
        throw new Error('Circuit breaker is open');
      }

      // Rate limiting (15 calls per second)
      if (Date.now() - this.rateLimits.lastReset > 1000) {
        this.rateLimits.requests = 0;
        this.rateLimits.lastReset = Date.now();
      }
      
      if (this.rateLimits.requests >= 15) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const url = `${this.baseURL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      let data = null;

      if (isPrivate) {
        const nonce = this.generateNonce();
        params.nonce = nonce;
        
        const postData = new URLSearchParams(params).toString();
        const signature = this.generateSignature(endpoint, nonce, postData);
        
        headers['API-Key'] = this.apiKey;
        headers['API-Sign'] = signature;
        data = postData;
      } else if (method === 'GET') {
        const queryString = new URLSearchParams(params).toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const response = await axios({
        method,
        url,
        headers,
        data,
        timeout: 10000
      });

      this.rateLimits.requests++;
      
      // Reset circuit breaker on success
      if (this.circuitBreaker.failures > 0) {
        this.circuitBreaker.failures = 0;
        this.circuitBreaker.isOpen = false;
      }

      if (response.data.error && response.data.error.length > 0) {
        throw new Error(`Kraken API Error: ${response.data.error.join(', ')}`);
      }

      return response.data.result;
    } catch (error) {
      // Handle circuit breaker
      this.circuitBreaker.failures++;
      this.circuitBreaker.lastFailTime = Date.now();
      
      if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        this.circuitBreaker.isOpen = true;
      }

      throw new Error(`Kraken API Error: ${error.response?.data?.error?.join(', ') || error.message}`);
    }
  }

  // Initialize connection and authenticate
  async connect() {
    try {
      // Test API credentials
      if (this.apiKey && this.apiSecret) {
        await this.getBalance();
        this.authenticated = true;
      }
      
      // Initialize WebSocket
      await this.initializeWebSocket();
      
      this.connected = true;
      this.emit('connected');
      
      console.log(`✅ ${this.name} Exchange connected`);
      return true;
    } catch (error) {
      console.error(`❌ ${this.name} connection failed:`, error.message);
      return false;
    }
  }

  // Initialize WebSocket connection
  async initializeWebSocket() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsURL);
      
      this.ws.on('open', () => {
        console.log(`📡 ${this.name} WebSocket connected`);
        
        // Subscribe to ticker updates
        const subscribeMessage = {
          event: 'subscribe',
          pair: ['XBT/USD', 'ETH/USD', 'ADA/USD'],
          subscription: { name: 'ticker' }
        };
        
        this.ws.send(JSON.stringify(subscribeMessage));
        resolve();
      });
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error(`${this.name} WebSocket message error:`, error);
        }
      });
      
      this.ws.on('error', (error) => {
        console.error(`${this.name} WebSocket error:`, error);
        reject(error);
      });
      
      this.ws.on('close', () => {
        console.log(`📡 ${this.name} WebSocket disconnected`);
        setTimeout(() => this.initializeWebSocket(), 5000);
      });
    });
  }

  // Handle WebSocket messages
  handleWebSocketMessage(message) {
    if (Array.isArray(message) && message.length > 1 && typeof message[1] === 'object') {
      const tickerData = message[1];
      const pair = message[3];
      
      if (tickerData.c) {
        this.emit('ticker', {
          exchange: this.name,
          symbol: pair,
          price: parseFloat(tickerData.c[0]),
          volume: parseFloat(tickerData.v[1]),
          timestamp: Date.now()
        });
      }
    }
  }

  // Get account balance
  async getBalance() {
    return await this.makeRequest('POST', '/0/private/Balance', {}, true);
  }

  // Get account balances (formatted)
  async getBalances() {
    const balances = await this.getBalance();
    const formattedBalances = [];
    
    for (const [currency, amount] of Object.entries(balances)) {
      if (parseFloat(amount) > 0) {
        formattedBalances.push({
          currency,
          available: parseFloat(amount),
          total: parseFloat(amount)
        });
      }
    }
    
    return formattedBalances;
  }

  // Get market data
  async getMarketData(symbol = 'XBTUSD') {
    try {
      const [ticker, orderBook] = await Promise.all([
        this.makeRequest('GET', '/0/public/Ticker', { pair: symbol }),
        this.makeRequest('GET', '/0/public/Depth', { pair: symbol, count: 10 })
      ]);

      const tickerKey = Object.keys(ticker)[0];
      const orderBookKey = Object.keys(orderBook)[0];
      const tickerData = ticker[tickerKey];
      const orderBookData = orderBook[orderBookKey];

      return {
        exchange: this.name,
        symbol,
        price: parseFloat(tickerData.c[0]),
        bid: parseFloat(orderBookData.bids[0][0]),
        ask: parseFloat(orderBookData.asks[0][0]),
        volume: parseFloat(tickerData.v[1]),
        high: parseFloat(tickerData.h[1]),
        low: parseFloat(tickerData.l[1]),
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to get market data: ${error.message}`);
    }
  }

  // Place order
  async placeOrder(symbol, side, type, quantity, price = null) {
    try {
      const params = {
        pair: symbol,
        type: side.toLowerCase(),
        ordertype: type.toLowerCase(),
        volume: quantity.toString()
      };

      if (type.toLowerCase() === 'limit') {
        if (!price) throw new Error('Price required for limit orders');
        params.price = price.toString();
      }

      const result = await this.makeRequest('POST', '/0/private/AddOrder', params, true);
      
      return {
        exchange: this.name,
        orderId: result.txid[0],
        symbol: symbol,
        side: side,
        type: type,
        quantity: parseFloat(quantity),
        price: price ? parseFloat(price) : null,
        status: 'PENDING',
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to place order: ${error.message}`);
    }
  }

  // Get order status
  async getOrderStatus(orderId) {
    try {
      const result = await this.makeRequest('POST', '/0/private/QueryOrders', {
        txid: orderId
      }, true);

      const orderData = result[orderId];
      if (!orderData) {
        throw new Error('Order not found');
      }

      return {
        exchange: this.name,
        orderId,
        symbol: orderData.descr.pair,
        side: orderData.descr.type,
        type: orderData.descr.ordertype,
        quantity: parseFloat(orderData.vol),
        executedQuantity: parseFloat(orderData.vol_exec),
        price: parseFloat(orderData.descr.price || 0),
        status: orderData.status,
        timestamp: parseFloat(orderData.opentm) * 1000
      };
    } catch (error) {
      throw new Error(`Failed to get order status: ${error.message}`);
    }
  }

  // Cancel order
  async cancelOrder(orderId) {
    try {
      const result = await this.makeRequest('POST', '/0/private/CancelOrder', {
        txid: orderId
      }, true);

      return {
        exchange: this.name,
        orderId,
        status: 'CANCELED',
        count: result.count
      };
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  // Get exchange status
  getStatus() {
    return {
      exchange: this.name,
      connected: this.connected,
      authenticated: this.authenticated,
      circuitBreakerOpen: this.circuitBreaker.isOpen,
      rateLimitUsed: `${this.rateLimits.requests}/15`,
      environment: 'PRODUCTION'
    };
  }

  // Cleanup
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.authenticated = false;
  }
}

module.exports = KrakenExchange;