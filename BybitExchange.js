const WebSocket = require('ws');
const crypto = require('crypto');

class BybitExchange {
  constructor() {
    this.name = 'Bybit';
    this.apiKey = process.env.BYBIT_API_KEY;
    this.apiSecret = process.env.BYBIT_API_SECRET;
    this.baseUrl = 'https://api.bybit.com';
    this.wsUrl = 'wss://stream.bybit.com/v5/public/spot';
    this.connected = false;
    this.ws = null;
    this.features = ['spot', 'futures', 'options', 'websocket', 'trading'];
  }

  async initialize() {
    console.log(`🔗 Connecting to ${this.name}...`);
    
    if (!this.apiKey || !this.apiSecret) {
      console.log(`⚠️  ${this.name} API credentials not provided, skipping connection`);
      return false;
    }

    try {
      // Test API connection
      const response = await fetch(`${this.baseUrl}/v5/market/time`);
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
              args: ['tickers.BTCUSDT', 'tickers.ETHUSDT']
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
    if (message.topic && message.topic.startsWith('tickers.')) {
      // Handle ticker data
    } else if (message.op === 'subscribe') {
      console.log(`${this.name} subscription confirmed`);
    }
  }

  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  generateSignature(params) {
    const timestamp = Date.now();
    const recv_window = 5000;
    
    // Sort parameters
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    const queryString = new URLSearchParams({
      ...sortedParams,
      api_key: this.apiKey,
      timestamp,
      recv_window
    }).toString();
    
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
    
    return {
      signature,
      timestamp,
      recv_window,
      queryString
    };
  }

  async getBalance() {
    if (!this.isConnected()) {
      throw new Error(`${this.name} is not connected`);
    }

    try {
      const params = {};
      const { signature, timestamp, recv_window } = this.generateSignature(params);

      const queryParams = new URLSearchParams({
        api_key: this.apiKey,
        timestamp,
        recv_window,
        sign: signature
      });

      const response = await fetch(
        `${this.baseUrl}/v5/account/wallet-balance?accountType=SPOT&${queryParams}`,
        {
          headers: {
            'X-BAPI-API-KEY': this.apiKey,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recv_window,
            'X-BAPI-SIGN': signature
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.retCode !== 0) {
        throw new Error(`${this.name} API error: ${result.retMsg}`);
      }
      
      // Transform Bybit balance format to standardized format
      const balances = {};
      if (result.result && result.result.list && result.result.list[0] && result.result.list[0].coin) {
        result.result.list[0].coin.forEach(coin => {
          const available = parseFloat(coin.walletBalance);
          const locked = parseFloat(coin.locked || 0);
          if (available > 0 || locked > 0) {
            balances[coin.coin] = {
              free: available - locked,
              locked: locked,
              total: available
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
      // Convert symbol format (e.g., BTC/USDT -> BTCUSDT)
      const bybitSymbol = symbol.replace('/', '');
      
      const response = await fetch(
        `${this.baseUrl}/v5/market/tickers?category=spot&symbol=${bybitSymbol}`
      );

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      
      if (result.retCode !== 0 || !result.result || !result.result.list || result.result.list.length === 0) {
        return null;
      }
      
      const data = result.result.list[0];
      
      return {
        symbol,
        price: parseFloat(data.lastPrice),
        change: parseFloat(data.price24hPcnt) * parseFloat(data.lastPrice) / 100,
        changePercent: parseFloat(data.price24hPcnt),
        volume: parseFloat(data.volume24h),
        high: parseFloat(data.highPrice24h),
        low: parseFloat(data.lowPrice24h),
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

    const { symbol, side, amount, type = 'Market' } = params;
    
    try {
      const bybitSymbol = symbol.replace('/', '');
      
      const orderParams = {
        category: 'spot',
        symbol: bybitSymbol,
        side: side.charAt(0).toUpperCase() + side.slice(1).toLowerCase(),
        orderType: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
        qty: amount.toString()
      };

      const { signature, timestamp, recv_window } = this.generateSignature(orderParams);

      const response = await fetch(`${this.baseUrl}/v5/order/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BAPI-API-KEY': this.apiKey,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-RECV-WINDOW': recv_window,
          'X-BAPI-SIGN': signature
        },
        body: JSON.stringify(orderParams)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.retCode !== 0) {
        throw new Error(`${this.name} order failed: ${result.retMsg}`);
      }
      
      const data = result.result;
      
      return {
        exchange: this.name,
        orderId: data.orderId,
        symbol: bybitSymbol.replace(/([A-Z]+)(USDT)/, '$1/$2'),
        side: orderParams.side,
        amount: parseFloat(orderParams.qty),
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

module.exports = BybitExchange;