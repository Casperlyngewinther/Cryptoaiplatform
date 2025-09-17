const WebSocket = require('ws');
const crypto = require('crypto');

class CoinbaseExchange {
  constructor() {
    this.name = 'Coinbase Pro';
    this.apiKey = process.env.COINBASE_API_KEY;
    this.apiSecret = process.env.COINBASE_API_SECRET;
    this.passphrase = process.env.COINBASE_PASSPHRASE;
    this.baseUrl = 'https://api.exchange.coinbase.com';
    this.wsUrl = 'wss://ws-feed-public.sandbox.exchange.coinbase.com';
    this.connected = false;
    this.ws = null;
    this.features = ['spot', 'websocket', 'trading'];
  }

  async initialize() {
    console.log(`🔗 Connecting to ${this.name}...`);
    
    if (!this.apiKey || !this.apiSecret || !this.passphrase) {
      console.log(`⚠️  ${this.name} API credentials not provided, skipping connection`);
      return false;
    }

    try {
      // Test API connection
      const response = await fetch(`${this.baseUrl}/time`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Initialize WebSocket connection with comprehensive error handling
      return new Promise((resolve) => {
        try {
          this.ws = new WebSocket(this.wsUrl);
          
          // Set up error handler FIRST to catch any connection errors
          this.ws.on('error', (error) => {
            console.error(`${this.name} WebSocket error:`, error.message);
            this.connected = false;
            // Resolve with false instead of rejecting to prevent unhandled rejection
            resolve(false);
          });
          
          this.ws.on('open', () => {
            console.log(`✅ ${this.name} WebSocket connected`);
            this.connected = true;
            
            // Subscribe to ticker data
            const subscribeMessage = {
              type: 'subscribe',
              channels: ['ticker'],
              product_ids: ['BTC-USD', 'ETH-USD']
            };
            
            this.ws.send(JSON.stringify(subscribeMessage));
            resolve(true);
          });
          
          this.ws.on('close', (code, reason) => {
            console.log(`🔌 ${this.name} WebSocket disconnected:`, code, reason.toString());
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
          
          // Connection timeout with graceful handling
          setTimeout(() => {
            if (!this.connected) {
              console.log(`⏰ ${this.name} WebSocket connection timeout`);
              if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close();
              }
              resolve(false);
            }
          }, 15000); // Increased timeout for Coinbase
          
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

  handleWebSocketMessage(message) {
    if (message.type === 'ticker') {
      // Handle ticker data
      // console.log(`${this.name} Ticker:`, message.product_id, message.price);
    } else if (message.type === 'error') {
      console.error(`${this.name} WebSocket error:`, message.message);
    }
  }

  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  generateSignature(method, requestPath, body = '') {
    const timestamp = Date.now() / 1000;
    const message = timestamp + method + requestPath + body;
    const key = Buffer.from(this.apiSecret, 'base64');
    const hmac = crypto.createHmac('sha256', key);
    const signature = hmac.update(message).digest('base64');
    
    return {
      signature,
      timestamp
    };
  }

  async getBalance() {
    if (!this.isConnected()) {
      throw new Error(`${this.name} is not connected`);
    }

    try {
      const requestPath = '/accounts';
      const { signature, timestamp } = this.generateSignature('GET', requestPath);

      const response = await fetch(`${this.baseUrl}${requestPath}`, {
        headers: {
          'CB-ACCESS-KEY': this.apiKey,
          'CB-ACCESS-SIGN': signature,
          'CB-ACCESS-TIMESTAMP': timestamp,
          'CB-ACCESS-PASSPHRASE': this.passphrase,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const accounts = await response.json();
      
      // Transform Coinbase account format to standardized format
      const balances = {};
      accounts.forEach(account => {
        const available = parseFloat(account.available);
        const hold = parseFloat(account.hold);
        if (available > 0 || hold > 0) {
          balances[account.currency] = {
            free: available,
            locked: hold,
            total: available + hold
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
      // Convert symbol format (e.g., BTC/USDT -> BTC-USD for Coinbase)
      const coinbaseSymbol = symbol.replace('/', '-').replace('USDT', 'USD');
      
      const response = await fetch(
        `${this.baseUrl}/products/${coinbaseSymbol}/ticker`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Get 24hr stats for volume and change data
      const statsResponse = await fetch(
        `${this.baseUrl}/products/${coinbaseSymbol}/stats`
      );
      
      let stats = {};
      if (statsResponse.ok) {
        stats = await statsResponse.json();
      }
      
      return {
        symbol,
        price: parseFloat(data.price),
        change: stats.last && stats.open ? parseFloat(stats.last) - parseFloat(stats.open) : 0,
        changePercent: stats.last && stats.open ? ((parseFloat(stats.last) - parseFloat(stats.open)) / parseFloat(stats.open)) * 100 : 0,
        volume: parseFloat(data.volume || 0),
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
      const coinbaseSymbol = symbol.replace('/', '-').replace('USDT', 'USD');
      const requestPath = '/orders';
      
      const orderData = {
        product_id: coinbaseSymbol,
        side: side.toLowerCase(),
        type: type.toLowerCase(),
        size: amount.toString()
      };

      const body = JSON.stringify(orderData);
      const { signature, timestamp } = this.generateSignature('POST', requestPath, body);

      const response = await fetch(`${this.baseUrl}${requestPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CB-ACCESS-KEY': this.apiKey,
          'CB-ACCESS-SIGN': signature,
          'CB-ACCESS-TIMESTAMP': timestamp,
          'CB-ACCESS-PASSPHRASE': this.passphrase,
        },
        body
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`${this.name} order failed: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        exchange: this.name,
        orderId: data.id,
        symbol: data.product_id.replace('-', '/'),
        side: data.side,
        amount: parseFloat(data.size),
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    console.log(`🔌 ${this.name} disconnected`);
  }
}

module.exports = CoinbaseExchange;