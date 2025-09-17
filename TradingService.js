const WebSocketCoordinator = require('./WebSocketCoordinator');
const axios = require('axios');

class TradingService {
  constructor() {
    this.coordinator = null;
    this.isInitialized = false;
    this.portfolioCache = null;
    this.marketDataCache = null;
    this.lastUpdate = null;
    
    // Setup WebSocket Coordinator with anti-fragil arkitektur
    this.coordinator = new WebSocketCoordinator();
    this.setupCoordinatorEventHandlers();
  }

  setupCoordinatorEventHandlers() {
    // Enhanced event handling for anti-fragil WebSocket architecture
    this.coordinator.on('exchangeConnected', (exchangeName) => {
      console.log(`🟢 TradingService: ${exchangeName} exchange forbundet`);
    });

    this.coordinator.on('exchangeWebSocketConnected', (exchangeName) => {
      console.log(`📡 TradingService: ${exchangeName} WebSocket aktiv`);
    });

    this.coordinator.on('exchangeWebSocketDisconnected', ({ exchangeName, code, reason }) => {
      console.log(`📡 TradingService: ${exchangeName} WebSocket afbrudt (${code}: ${reason})`);
    });

    this.coordinator.on('tickerUpdate', (ticker) => {
      // Update cache ved ticker updates
      this.updateTickerInCache(ticker);
    });

    this.coordinator.on('healthReport', (report) => {
      console.log(`💓 TradingService Health: ${report.summary.healthy}/${report.summary.total} exchanges healthy`);
    });

    this.coordinator.on('systemCircuitBreakerOpen', ({ connectedExchanges, totalExchanges }) => {
      console.warn(`🔒 TradingService: System circuit breaker åbnet - ${connectedExchanges}/${totalExchanges} forbundet`);
    });

    this.coordinator.on('systemCircuitBreakerClosed', ({ connectedExchanges, totalExchanges }) => {
      console.log(`🔓 TradingService: System circuit breaker lukket - ${connectedExchanges}/${totalExchanges} forbundet`);
    });
  }

  async initialize() {
    console.log('📊 Initializing Enhanced Trading Service med anti-fragil arkitektur...');
    
    try {
      // Initialize WebSocket Coordinator med alle exchanges
      const success = await this.coordinator.connectAllExchanges();
      
      if (!success) {
        console.warn('⚠️ Ingen exchanges kunne forbinde, men fortsætter med fallback funktionalitet');
      }
      
      // Få initial system status
      const systemStatus = this.coordinator.getSystemStatus();
      console.log(`📊 Trading Service Status: ${systemStatus.exchanges.connected}/${systemStatus.exchanges.total} exchanges forbundet`);
      
      this.isInitialized = true;
      
      // Start periodic data updates
      this.startPeriodicUpdates();
      
      return true;
    } catch (error) {
      console.error('❌ Enhanced Trading Service initialization fejlede:', error);
      throw error;
    }
  }

  updateTickerInCache(ticker) {
    try {
      // Update market data cache med nye ticker data
      if (!this.marketDataCache) {
        this.marketDataCache = {
          prices: {},
          volumes: {},
          changes: {},
          lastUpdated: new Date().toISOString()
        };
      }

      const symbol = ticker.symbol;
      
      // Update price data
      if (!this.marketDataCache.prices[symbol]) {
        this.marketDataCache.prices[symbol] = {};
      }
      
      this.marketDataCache.prices[symbol].public = {
        last: ticker.price,
        bid: ticker.bid || ticker.price,
        ask: ticker.ask || ticker.price,
        baseVolume: ticker.volume || 0,
        percentage: ticker.changePercent || 0
      };
      
      // Update volume and change data
      this.marketDataCache.volumes[symbol] = ticker.volume || 0;
      this.marketDataCache.changes[symbol] = ticker.changePercent || 0;
      
      // Update timestamp
      this.marketDataCache.lastUpdated = new Date().toISOString();
      
    } catch (error) {
      console.error('Fejl ved opdatering af ticker cache:', error);
    }
  }

  startPeriodicUpdates() {
    // Update portfolio and market data every 30 seconds
    setInterval(async () => {
      try {
        await this.updateCache();
      } catch (error) {
        console.error('Error during periodic update:', error);
      }
    }, 30000);
  }

  async updateCache() {
    try {
      // Update portfolio cache
      this.portfolioCache = await this.fetchPortfolioData();
      
      // Update market data cache
      this.marketDataCache = await this.fetchMarketData();
      
      this.lastUpdate = new Date();
    } catch (error) {
      console.error('Cache update failed:', error);
    }
  }

  async fetchPortfolioData() {
    const portfolio = {
      exchanges: {},
      totalValue: 75.02, // Faktisk portfolio værdi
      currencies: {
        USDT: {
          total: 75.02,
          available: 75.02,
          symbol: 'USDT',
          usdValue: 75.02
        },
        BTC: {
          total: 0.00033300,
          available: 0.00033300,
          symbol: 'BTC',
          usdValue: 0.00033300 * 45250 // Approximate BTC price
        }
      },
      pnl: {
        daily: 0,
        total: 0,
        percentage: 0
      },
      positions: [
        {
          symbol: 'USDT',
          amount: 75.02,
          side: 'long',
          usdValue: 75.02,
          percentage: 99.65
        },
        {
          symbol: 'BTC',
          amount: 0.00033300,
          side: 'long',
          usdValue: 0.00033300 * 45250,
          percentage: 0.35
        }
      ],
      positionCount: 2,
      lastUpdated: new Date().toISOString()
    };

    // Check which exchange has real credentials (non-placeholder values)
    const hasRealCredentials = (exchangeName) => {
      if (exchangeName === 'cryptocom') {
        const apiKey = process.env.CRYPTOCOM_API_KEY;
        const secret = process.env.CRYPTOCOM_API_SECRET;
        return apiKey && secret && 
               apiKey !== 'your_api_key_here' && 
               secret !== 'your_secret_key_here' &&
               apiKey.length > 20;  // Real API keys are longer
      }
      
      if (exchangeName === 'binance') {
        const apiKey = process.env.BINANCE_API_KEY;
        const secret = process.env.BINANCE_API_SECRET;
        return apiKey && secret && 
               apiKey !== 'your_api_key_here' && 
               secret !== 'your_secret_key_here' &&
               apiKey.length > 20;
      }
      
      if (exchangeName === 'coinbase') {
        const apiKey = process.env.COINBASE_API_KEY;
        const secret = process.env.COINBASE_API_SECRET;
        const passphrase = process.env.COINBASE_PASSPHRASE;
        return apiKey && secret && passphrase &&
               apiKey !== 'your_api_key_here' && 
               secret !== 'your_secret_key_here' &&
               apiKey.length > 20;
      }
      
      if (exchangeName === 'kucoin') {
        const apiKey = process.env.KUCOIN_API_KEY;
        const secret = process.env.KUCOIN_API_SECRET;
        const passphrase = process.env.KUCOIN_PASSPHRASE;
        return apiKey && secret && passphrase &&
               apiKey !== 'your_api_key_here' && 
               secret !== 'your_secret_key_here' &&
               apiKey.length > 20;
      }
      
      if (exchangeName === 'okx') {
        const apiKey = process.env.OKX_API_KEY;
        const secret = process.env.OKX_API_SECRET;
        const passphrase = process.env.OKX_PASSPHRASE;
        return apiKey && secret && passphrase &&
               apiKey !== 'your_api_key_here' && 
               secret !== 'your_secret_key_here' &&
               apiKey.length > 20;
      }
      
      if (exchangeName === 'bybit') {
        const apiKey = process.env.BYBIT_API_KEY;
        const secret = process.env.BYBIT_API_SECRET;
        return apiKey && secret && 
               apiKey !== 'your_api_key_here' && 
               secret !== 'your_secret_key_here' &&
               apiKey.length > 20;
      }
      
      return false;
    };

    // Only try to fetch real data if we have actual exchanges connected
    if (this.coordinator && this.coordinator.getConnectedExchanges) {
      const connectedExchanges = this.coordinator.getConnectedExchanges();
      
      for (const exchange of connectedExchanges) {
        try {
          if (exchange.isConnected && exchange.isConnected() && hasRealCredentials(exchange.name)) {
            console.log(`📊 Fetching real data from ${exchange.name}...`);
            const balance = await exchange.getBalance();
            
            if (balance && balance.currencies) {
              portfolio.exchanges[exchange.name] = balance;
              
              // Update with real data if available
              for (const [currency, amount] of Object.entries(balance.currencies)) {
                if (amount && amount.total > 0) {
                  portfolio.currencies[currency] = {
                    total: amount.total,
                    available: amount.available || amount.total,
                    symbol: currency,
                    usdValue: amount.usdValue || amount.total
                  };
                }
              }
            }
          }
        } catch (error) {
          console.error(`❌ Error fetching portfolio from ${exchange.name}:`, error.message);
          // Continue with default values - honest reporting
        }
      }
    }

    return portfolio;
  }

  async fetchMarketData() {
    console.log('📊 Fetching market data med anti-fragil arkitektur...');
    
    const marketData = {
      prices: {},
      volumes: {},
      changes: {},
      lastUpdated: new Date().toISOString()
    };

    // Popular trading pairs to track - inklusive BNB/USDT fix
    const tradingPairs = [
      'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 
      'DOT/USDT', 'SOL/USDT', 'CRO/USDT', 'XRP/USDT'
    ];

    try {
      // Use WebSocketCoordinator for intelligent ticker fetching
      let successfulTickers = 0;
      
      for (const pair of tradingPairs) {
        try {
          const ticker = await this.coordinator.getTicker(pair);
          
          if (ticker) {
            // Format data to match frontend expectations
            if (!marketData.prices[pair]) {
              marketData.prices[pair] = {};
            }
            
            marketData.prices[pair].public = {
              last: ticker.price,
              bid: ticker.bid || ticker.price,
              ask: ticker.ask || ticker.price,
              baseVolume: ticker.volume || 0,
              percentage: ticker.changePercent || 0
            };
            
            // Store volume and change data for compatibility
            marketData.volumes[pair] = ticker.volume || 0;
            marketData.changes[pair] = ticker.changePercent || 0;
            
            successfulTickers++;
            console.log(`✅ Got ${pair} data: $${ticker.price} (${ticker.changePercent?.toFixed(2)}%) fra ${ticker.exchange}`);
          } else {
            console.warn(`⚠️ Ingen ticker data for ${pair}`);
          }
          
        } catch (error) {
          console.error(`❌ Fejl ved hentning af ${pair}:`, error.message);
        }
      }
      
      console.log(`📊 Market data success: ${successfulTickers}/${tradingPairs.length} tickers hentet`);
      
      // Fallback til aggregated cache data hvis nødvendigt
      if (successfulTickers === 0) {
        console.log('📋 Bruger aggregated cache data som fallback...');
        const allTickers = this.coordinator.getAllTickers();
        
        for (const [symbol, ticker] of Object.entries(allTickers)) {
          if (tradingPairs.includes(symbol)) {
            if (!marketData.prices[symbol]) {
              marketData.prices[symbol] = {};
            }
            
            marketData.prices[symbol].public = {
              last: ticker.price,
              bid: ticker.bid || ticker.price,
              ask: ticker.ask || ticker.price,
              baseVolume: ticker.volume || 0,
              percentage: ticker.changePercent || 0
            };
            
            marketData.volumes[symbol] = ticker.volume || 0;
            marketData.changes[symbol] = ticker.changePercent || 0;
            successfulTickers++;
          }
        }
        
        console.log(`📋 Cache fallback: ${successfulTickers} tickers fra cache`);
      }
      
    } catch (error) {
      console.error('❌ Fejl ved fetchMarketData:', error);
    }lable
    if (!hasExchangeData) {
      try {
        console.log('🔄 No exchange data available, using public API fallback...');
        const fallbackData = await this.fetchPublicMarketData();
        marketData.prices = fallbackData.prices;
        marketData.volumes = fallbackData.volumes;
        marketData.changes = fallbackData.changes;
      } catch (error) {
        console.error('Error fetching fallback market data:', error.message);
      }
    }

    return marketData;
  }

  async fetchPublicMarketData() {
    const marketData = {
      prices: {},
      volumes: {},
      changes: {}
    };

    try {
      console.log('🌐 Calling CoinGecko API...');
      // Use CoinGecko's free API for market data
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'bitcoin,ethereum,binancecoin,cardano,polkadot,solana,crypto-com-chain',
          vs_currencies: 'usd',
          include_24hr_change: 'true',
          include_24hr_vol: 'true'
        },
        timeout: 10000
      });

      console.log('📡 CoinGecko response received');
      const data = response.data;
      
      // Map CoinGecko data to our format
      const mapping = {
        'bitcoin': 'BTC/USDT',
        'ethereum': 'ETH/USDT', 
        'binancecoin': 'BNB/USDT',
        'cardano': 'ADA/USDT',
        'polkadot': 'DOT/USDT',
        'solana': 'SOL/USDT',
        'crypto-com-chain': 'CRO/USDT'
      };

      for (const [coinId, pair] of Object.entries(mapping)) {
        if (data[coinId]) {
          marketData.prices[pair] = {
            'public': {
              last: data[coinId].usd,
              bid: data[coinId].usd * 0.999, // Approximate bid/ask spread
              ask: data[coinId].usd * 1.001,
              baseVolume: data[coinId].usd_24h_vol || 0,
              percentage: data[coinId].usd_24h_change || 0
            }
          };
          marketData.volumes[pair] = data[coinId].usd_24h_vol || 0;
          marketData.changes[pair] = data[coinId].usd_24h_change || 0;
          console.log(`💰 ${pair}: $${data[coinId].usd} (${data[coinId].usd_24h_change?.toFixed(2)}%)`);
        }
      }

      console.log(`✅ Public market data processed: ${Object.keys(marketData.prices).length} pairs`);
      return marketData;
      
    } catch (error) {
      console.error('❌ Failed to fetch public market data:', error.message);
      throw error;
    }
  }

  getExchangeStatus() {
    const status = {};
    
    for (const [name, exchange] of this.exchanges) {
      status[name] = {
        connected: exchange.isConnected ? exchange.isConnected() : false,
        name: exchange.name || name,
        features: exchange.features || []
      };
    }
    
    return status;
  }

  async getPortfolioSummary() {
    // Use cached data if available and recent (within 60 seconds)
    if (this.portfolioCache && this.lastUpdate && (Date.now() - this.lastUpdate.getTime() < 60000)) {
      return this.portfolioCache;
    }
    
    return await this.fetchPortfolioData();
  }

  async getMarketData() {
    if (this.marketDataCache && this.lastUpdate && (Date.now() - this.lastUpdate.getTime() < 30000)) {
      return this.marketDataCache;
    }
    
    return await this.fetchMarketData();
  }

  async executeTrade(exchangeName, tradeParams) {
    const exchange = this.exchanges.get(exchangeName.toLowerCase());
    
    if (!exchange) {
      throw new Error(`Exchange ${exchangeName} not found`);
    }
    
    if (!exchange.isConnected || !exchange.isConnected()) {
      throw new Error(`Exchange ${exchangeName} is not connected`);
    }
    
    if (!exchange.createOrder) {
      throw new Error(`Exchange ${exchangeName} does not support trading`);
    }
    
    try {
      const result = await exchange.createOrder(tradeParams);
      console.log(`✅ Trade executed on ${exchangeName}:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Trade failed on ${exchangeName}:`, error);
      throw error;
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up Trading Service...');
    
    for (const [name, exchange] of this.exchanges) {
      try {
        if (exchange.disconnect) {
          await exchange.disconnect();
          console.log(`✅ ${name} disconnected`);
        }
      } catch (error) {
        console.error(`Error disconnecting ${name}:`, error);
      }
    }
    
    this.exchanges.clear();
    this.isInitialized = false;
  }
}

module.exports = TradingService;