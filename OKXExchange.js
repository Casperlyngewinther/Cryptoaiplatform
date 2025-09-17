const WebSocket = require('ws');
const crypto = require('crypto');

class OKXExchange {
  constructor() {
    this.name = 'OKX';
    this.apiKey = process.env.OKX_API_KEY;
    this.apiSecret = process.env.OKX_API_SECRET;
    this.passphrase = process.env.OKX_PASSPHRASE;
    this.baseUrl = 'https://www.okx.com';
    this.wsUrl = 'wss://ws.okx.com:8443/ws/v5/public';
    this.connected = false;
    this.ws = null;
    this.features = ['spot', 'futures', 'options', 'websocket', 'trading'];
  }

  async initialize() {
    console.log(`🔗 Connecting to ${this.name}...`);
    
    if (!this.apiKey || !this.apiSecret || !this.passphrase) {
      console.log(`⚠️  ${this.name} API credentials not provided, skipping connection`);
      return false;
    }

    try {
      // Test API connection
      const response = await fetch(`${this.baseUrl}/api/v5/public/time`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Initialize WebSocket connection
      return new Promise((resolve) => {
        try {
          this.ws = new WebSocket(this.wsUrl);
          
          this.ws.on('error', (error) => {
            console.error(`${this.name} WebSocket error:`, error.message);
            this.connected = false;
            resolve(false);
          });
          
          this.ws.on('open', () => {
            console.log(`✅ ${this.name} WebSocket connected`);
            this.connected = true;
            
            // Subscribe to ticker data
            const subscribeMessage = {
              op: 'subscribe',
              args: [
                {
                  channel: 'tickers',
                  instId: 'BTC-USDT'
                },
                {
                  channel: 'tickers',
                  instId: 'ETH-USDT'
                }
              ]
            };
            
            this.ws.send(JSON.stringify(subscribeMessage));
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

  handleWebSocketMessage(message) {
    if (message.arg && message.arg.channel === 'tickers') {
      // Handle ticker data
    } else if (message.event === 'subscribe') {
      console.log(`${this.name} subscription confirmed:`, message.arg);
    }
  }

  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  generateSignature(method, requestPath, body = '') {
    const timestamp = new Date().toISOString();
    const prehash = timestamp + method + requestPath + body;
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(prehash)
      .digest('base64');
    
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
      const requestPath = '/api/v5/account/balance';
      const { signature, timestamp } = this.generateSignature('GET', requestPath);

      const response = await fetch(`${this.baseUrl}${requestPath}`, {
        headers: {
          'OK-ACCESS-KEY': this.apiKey,
          'OK-ACCESS-SIGN': signature,
          'OK-ACCESS-TIMESTAMP': timestamp,
          'OK-ACCESS-PASSPHRASE': this.passphrase,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.code !== '0') {
        throw new Error(`${this.name} API error: ${result.msg}`);
      }
      
      // Transform OKX balance format to standardized format
      const balances = {};
      if (result.data && result.data[0] && result.data[0].details) {
        result.data[0].details.forEach(detail => {
          const available = parseFloat(detail.availBal);
          const frozen = parseFloat(detail.frozenBal);
          if (available > 0 || frozen > 0) {
            balances[detail.ccy] = {
              free: available,
              locked: frozen,
              total: available + frozen
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
    if (!this.isConnected()) {
      return null;
    }

    try {
      // Convert symbol format (e.g., BTC/USDT -> BTC-USDT)
      const okxSymbol = symbol.replace('/', '-');
      
      const response = await fetch(
        `${this.baseUrl}/api/v5/market/ticker?instId=${okxSymbol}`
      );

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      
      if (result.code !== '0' || !result.data || result.data.length === 0) {
        return null;
      }
      
      const data = result.data[0];
      
      return {
        symbol,
        price: parseFloat(data.last),
        change: parseFloat(data.last) - parseFloat(data.open24h),
        changePercent: ((parseFloat(data.last) - parseFloat(data.open24h)) / parseFloat(data.open24h)) * 100,
        volume: parseFloat(data.vol24h),
        high: parseFloat(data.high24h),
        low: parseFloat(data.low24h),
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
      const okxSymbol = symbol.replace('/', '-');
      const requestPath = '/api/v5/trade/order';
      
      const orderData = {
        instId: okxSymbol,
        tdMode: 'cash',
        side: side.toLowerCase(),
        ordType: type.toLowerCase(),
        sz: amount.toString()
      };

      const body = JSON.stringify(orderData);
      const { signature, timestamp } = this.generateSignature('POST', requestPath, body);

      const response = await fetch(`${this.baseUrl}${requestPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'OK-ACCESS-KEY': this.apiKey,
          'OK-ACCESS-SIGN': signature,
          'OK-ACCESS-TIMESTAMP': timestamp,
          'OK-ACCESS-PASSPHRASE': this.passphrase,
        },
        body
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.code !== '0') {
        throw new Error(`${this.name} order failed: ${result.msg}`);
      }
      
      const data = result.data[0];
      
      return {
        exchange: this.name,
        orderId: data.ordId,
        symbol: okxSymbol.replace('-', '/'),
        side: orderData.side,
        amount: parseFloat(orderData.sz),
        price: 0, // Market order price will be filled
        status: data.sCode === '0' ? 'submitted' : 'failed',
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

module.exports = OKXExchange;