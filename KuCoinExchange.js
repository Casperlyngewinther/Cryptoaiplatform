const WebSocket = require('ws');
const crypto = require('crypto');

class KuCoinExchange {
  constructor() {
    this.name = 'KuCoin';
    this.apiKey = process.env.KUCOIN_API_KEY;
    this.apiSecret = process.env.KUCOIN_API_SECRET;
    this.passphrase = process.env.KUCOIN_PASSPHRASE;
    this.baseUrl = 'https://api.kucoin.com';
    this.wsUrl = 'wss://ws-api-spot.kucoin.com/';
    this.connected = false;
    this.ws = null;
    this.features = ['spot', 'futures', 'websocket', 'trading'];
  }

  async initialize() {
    console.log(`🔗 Connecting to ${this.name}...`);
    
    if (!this.apiKey || !this.apiSecret || !this.passphrase) {
      console.log(`⚠️  ${this.name} API credentials not provided, skipping connection`);
      return false;
    }

    try {
      // Test API connection
      const response = await fetch(`${this.baseUrl}/api/v1/timestamp`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get WebSocket token for authenticated connection
      const wsTokenResponse = await this.getWebSocketToken();
      if (!wsTokenResponse) {
        console.log(`⚠️  ${this.name} WebSocket token fetch failed, using public connection`);
        return await this.initializePublicWebSocket();
      }

      // Initialize WebSocket connection with token
      return new Promise((resolve) => {
        try {
          const wsUrl = `${wsTokenResponse.instanceServers[0].endpoint}?token=${wsTokenResponse.token}`;
          this.ws = new WebSocket(wsUrl);
          
          // Set up error handler FIRST
          this.ws.on('error', (error) => {
            console.error(`${this.name} WebSocket error:`, error.message);
            this.connected = false;
            resolve(false);
          });
          
          this.ws.on('open', () => {
            console.log(`✅ ${this.name} WebSocket connected`);
            this.connected = true;
            
            // Send ping to maintain connection
            const pingMessage = {
              id: Date.now(),
              type: 'ping'
            };
            this.ws.send(JSON.stringify(pingMessage));
            resolve(true);
          });
          
          this.ws.on('close', () => {
            console.log(`🔌 ${this.name} WebSocket disconnected`);
            this.connected = false;
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
              resolve(false);
            }
          }, 10000);
          
        } catch (error) {
          console.error(`${this.name} WebSocket initialization error:`, error);
          resolve(false);
        }
      });
      
    } catch (error) {
      console.error(`❌ ${this.name} connection failed:`, error.message);
      return false;
    }
  }

  async initializePublicWebSocket() {
    // Fallback to public WebSocket connection
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket('wss://ws-api-spot.kucoin.com/');
        
        this.ws.on('error', (error) => {
          console.error(`${this.name} Public WebSocket error:`, error.message);
          this.connected = false;
          resolve(false);
        });
        
        this.ws.on('open', () => {
          console.log(`✅ ${this.name} Public WebSocket connected`);
          this.connected = true;
          resolve(true);
        });
        
        this.ws.on('close', () => {
          console.log(`🔌 ${this.name} Public WebSocket disconnected`);
          this.connected = false;
        });
        
        this.ws.on('message', (data) => {
          try {
            const message = JSON.parse(data);
            this.handleWebSocketMessage(message);
          } catch (error) {
            console.error(`${this.name} WebSocket message parse error:`, error);
          }
        });
        
        setTimeout(() => {
          if (!this.connected) {
            console.log(`⏰ ${this.name} Public WebSocket connection timeout`);
            if (this.ws) {
              this.ws.close();
            }
            resolve(false);
          }
        }, 10000);
        
      } catch (error) {
        console.error(`${this.name} Public WebSocket initialization error:`, error);
        resolve(false);
      }
    });
  }

  async getWebSocketToken() {
    try {
      const timestamp = Date.now();
      const method = 'POST';
      const endpoint = '/api/v1/bullet-private';
      
      const stringToSign = timestamp + method + endpoint;
      const signature = crypto
        .createHmac('sha256', this.apiSecret)
        .update(stringToSign)
        .digest('base64');
      
      const passphrase = crypto
        .createHmac('sha256', this.apiSecret)
        .update(this.passphrase)
        .digest('base64');

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'KC-API-KEY': this.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp,
          'KC-API-PASSPHRASE': passphrase,
          'KC-API-KEY-VERSION': '2'
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.data;
      
    } catch (error) {
      console.error(`${this.name} WebSocket token error:`, error);
      return null;
    }
  }

  handleWebSocketMessage(message) {
    if (message.type === 'pong') {
      // Handle pong response
    } else if (message.type === 'message') {
      // Handle market data messages
    }
  }

  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  generateSignature(method, endpoint, body = '') {
    const timestamp = Date.now();
    const stringToSign = timestamp + method + endpoint + body;
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(stringToSign)
      .digest('base64');
    
    const passphrase = crypto
      .createHmac('sha256', this.apiSecret)
      .update(this.passphrase)
      .digest('base64');
    
    return {
      signature,
      timestamp,
      passphrase
    };
  }

  async getBalance() {
    if (!this.isConnected()) {
      throw new Error(`${this.name} is not connected`);
    }

    try {
      const endpoint = '/api/v1/accounts';
      const { signature, timestamp, passphrase } = this.generateSignature('GET', endpoint);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'KC-API-KEY': this.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp,
          'KC-API-PASSPHRASE': passphrase,
          'KC-API-KEY-VERSION': '2'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const accounts = result.data;
      
      // Transform KuCoin account format to standardized format
      const balances = {};
      accounts.forEach(account => {
        const available = parseFloat(account.available);
        const holds = parseFloat(account.holds);
        if (available > 0 || holds > 0) {
          balances[account.currency] = {
            free: available,
            locked: holds,
            total: available + holds
          };
        }
      });

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
      // Convert symbol format (e.g., BTC/USDT -> BTC-USDT)
      const kucoinSymbol = symbol.replace('/', '-');
      
      const response = await fetch(
        `${this.baseUrl}/api/v1/market/orderbook/level1?symbol=${kucoinSymbol}`
      );

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      const data = result.data;
      
      // Get 24hr stats
      const statsResponse = await fetch(
        `${this.baseUrl}/api/v1/market/stats?symbol=${kucoinSymbol}`
      );
      
      let stats = {};
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        stats = statsResult.data;
      }
      
      return {
        symbol,
        price: parseFloat(data.price),
        change: parseFloat(stats.changePrice || 0),
        changePercent: parseFloat(stats.changeRate || 0) * 100,
        volume: parseFloat(stats.vol || 0),
        high: parseFloat(stats.high || 0),
        low: parseFloat(stats.low || 0),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`${this.name} ticker fetch error for ${symbol}:`, error);
      return null;
    }
  }

  async createOrder(params) {
    if (!this.isConnected()) {
      throw new Error(`${this.name} is not connected`);
    }

    const { symbol, side, amount, type = 'market' } = params;
    
    try {
      const kucoinSymbol = symbol.replace('/', '-');
      const endpoint = '/api/v1/orders';
      
      const orderData = {
        clientOid: Date.now().toString(),
        symbol: kucoinSymbol,
        side: side.toLowerCase(),
        type: type.toLowerCase(),
        size: amount.toString()
      };

      const body = JSON.stringify(orderData);
      const { signature, timestamp, passphrase } = this.generateSignature('POST', endpoint, body);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'KC-API-KEY': this.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp,
          'KC-API-PASSPHRASE': passphrase,
          'KC-API-KEY-VERSION': '2'
        },
        body
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`${this.name} order failed: ${error.msg || response.statusText}`);
      }

      const result = await response.json();
      const data = result.data;
      
      return {
        exchange: this.name,
        orderId: data.orderId,
        symbol: kucoinSymbol.replace('-', '/'),
        side: orderData.side,
        amount: parseFloat(orderData.size),
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    console.log(`🔌 ${this.name} disconnected`);
  }
}

module.exports = KuCoinExchange;