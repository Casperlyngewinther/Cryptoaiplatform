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
    console.log('💼 Fetching portfolio data med anti-fragil arkitektur...');
    
    const portfolio = {
      exchanges: {},
      totalValue: 0,
      currencies: {},
      lastUpdated: new Date().toISOString()
    };

    // Check hvilke exchanges har rigtige credentials
    const hasRealCredentials = (exchangeName) => {
      if (exchangeName === 'Crypto.com') {
        const apiKey = process.env.CRYPTOCOM_API_KEY;
        const secret = process.env.CRYPTOCOM_API_SECRET;
        return apiKey && secret && 
               apiKey !== 'your_api_key_here' && 
               secret !== 'your_secret_key_here' &&
               apiKey.length > 20;
      }
      
      if (exchangeName === 'Binance') {
        const apiKey = process.env.BINANCE_API_KEY;
        const secret = process.env.BINANCE_API_SECRET;
        return apiKey && secret && 
               apiKey !== 'your_api_key_here' && 
               secret !== 'your_secret_key_here' &&
               apiKey.length > 20;
      }
      
      if (exchangeName === 'Coinbase Pro') {
        const apiKey = process.env.COINBASE_API_KEY;
        const secret = process.env.COINBASE_API_SECRET;
        const passphrase = process.env.COINBASE_PASSPHRASE;
        return apiKey && secret && passphrase &&
               apiKey !== 'your_api_key_here' && 
               secret !== 'your_secret_key_here' &&
               apiKey.length > 20;
      }
      
      if (exchangeName === 'KuCoin') {
        const apiKey = process.env.KUCOIN_API_KEY;
        const secret = process.env.KUCOIN_API_SECRET;
        const passphrase = process.env.KUCOIN_PASSPHRASE;
        return apiKey && secret && passphrase &&
               apiKey !== 'your_api_key_here' && 
               secret !== 'your_secret_key_here' &&
               apiKey.length > 20;
      }
      
      if (exchangeName === 'OKX') {
        const apiKey = process.env.OKX_API_KEY;
        const secret = process.env.OKX_API_SECRET;
        const passphrase = process.env.OKX_PASSPHRASE;
        return apiKey && secret && passphrase &&
               apiKey !== 'your_api_key_here' && 
               secret !== 'your_secret_key_here' &&
               apiKey.length > 20;
      }
      
      if (exchangeName === 'Bybit') {
        const apiKey = process.env.BYBIT_API_KEY;
        const secret = process.env.BYBIT_API_SECRET;
        return apiKey && secret && 
               apiKey !== 'your_api_key_here' && 
               secret !== 'your_secret_key_here' &&
               apiKey.length > 20;
      }
      
      return false;
    };

    // Brug WebSocketCoordinator til at få exchange instances
    if (this.coordinator && this.coordinator.exchanges) {
      for (const [name, exchangeData] of this.coordinator.exchanges) {
        try {
          const exchange = exchangeData.instance;
          
          if (exchange && exchange.isConnected && exchange.isConnected() && hasRealCredentials(name)) {
            console.log(`💼 Fetching real portfolio data fra ${name}...`);
            const balance = await exchange.getBalance();
            
            if (balance && balance.currencies) {
              portfolio.exchanges[name] = balance;
              
              // Aggregate currency totals
              for (const [currency, amount] of Object.entries(balance.currencies)) {
                if (amount && amount.total > 0) {
                  portfolio.currencies[currency] = (portfolio.currencies[currency] || 0) + amount.total;
                }
              }
            }
          } else if (!hasRealCredentials(name)) {
            // Skip exchanges uden credentials
            continue;
          }
        } catch (error) {
          console.error(`❌ Fejl ved hentning af portfolio fra ${name}:`, error.message);
          // Skip denne exchange ved fejl
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
      
      // Final fallback to public API if no ticker data available
      if (successfulTickers === 0) {
        try {
          console.log('🔄 Ingen exchange data tilgængelig, bruger public API fallback...');
          const fallbackData = await this.fetchPublicMarketData();
          Object.assign(marketData.prices, fallbackData.prices);
          Object.assign(marketData.volumes, fallbackData.volumes);
          Object.assign(marketData.changes, fallbackData.changes);
          console.log(`🌐 Public API fallback: ${Object.keys(fallbackData.prices).length} pairs hentet`);
        } catch (error) {
          console.error('❌ Fejl ved hentning af fallback market data:', error.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Fejl ved fetchMarketData:', error);
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
          ids: 'bitcoin,ethereum,binancecoin,cardano,polkadot,solana,crypto-com-chain,ripple',
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
        'crypto-com-chain': 'CRO/USDT',
        'ripple': 'XRP/USDT'
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
    
    if (this.coordinator && this.coordinator.exchanges) {
      for (const [name, exchangeData] of this.coordinator.exchanges) {
        status[name] = {
          connected: exchangeData.connected,
          name: exchangeData.instance.name || name,
          features: exchangeData.instance.features || [],
          priority: exchangeData.priority,
          failures: exchangeData.failures,
          lastConnect: exchangeData.lastConnect
        };
      }
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
    if (!this.coordinator || !this.coordinator.exchanges) {
      throw new Error('WebSocket Coordinator ikke initialiseret');
    }

    const exchangeData = this.coordinator.exchanges.get(exchangeName);
    
    if (!exchangeData) {
      throw new Error(`Exchange ${exchangeName} ikke fundet`);
    }
    
    const exchange = exchangeData.instance;
    
    if (!exchange.isConnected || !exchange.isConnected()) {
      throw new Error(`Exchange ${exchangeName} er ikke forbundet`);
    }
    
    if (!exchange.createOrder) {
      throw new Error(`Exchange ${exchangeName} understøtter ikke trading`);
    }
    
    try {
      const result = await exchange.createOrder(tradeParams);
      console.log(`✅ Trade udført på ${exchangeName}:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Trade fejlede på ${exchangeName}:`, error);
      throw error;
    }
  }

  // Få system health status
  async getSystemHealth() {
    if (!this.coordinator) {
      return { healthy: false, error: 'Coordinator ikke initialiseret' };
    }

    const systemStatus = this.coordinator.getSystemStatus();
    await this.coordinator.performSystemHealthCheck();
    
    return {
      healthy: systemStatus.isHealthy,
      connectedExchanges: systemStatus.exchanges.connected,
      totalExchanges: systemStatus.exchanges.total,
      connectionRatio: systemStatus.exchanges.connectionRatio,
      circuitBreakerOpen: systemStatus.systemCircuitBreaker.isOpen,
      uptime: systemStatus.uptime,
      aggregatedTickers: systemStatus.aggregatedTickers,
      lastHealthCheck: systemStatus.lastHealthCheck,
      detailedStatus: systemStatus
    };
  }

  // Test specifik ticker (for debugging BNB/USDT issue)
  async testTicker(symbol) {
    console.log(`🧪 Testing ticker for ${symbol}...`);
    
    if (!this.coordinator) {
      throw new Error('Coordinator ikke initialiseret');
    }

    try {
      const ticker = await this.coordinator.getTicker(symbol);
      
      if (ticker) {
        console.log(`✅ Ticker test success for ${symbol}:`, {
          price: ticker.price,
          exchange: ticker.exchange,
          timestamp: ticker.timestamp,
          source: ticker.source || 'WebSocket'
        });
        return ticker;
      } else {
        console.warn(`⚠️ Ingen ticker data for ${symbol}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Ticker test fejlede for ${symbol}:`, error);
      throw error;
    }
  }

  // Manuel reconnection af alle exchanges
  async reconnectAllExchanges() {
    console.log('🔄 TradingService: Manuel reconnection af alle exchanges...');
    
    if (!this.coordinator) {
      throw new Error('Coordinator ikke initialiseret');
    }

    return await this.coordinator.reconnectAll();
  }

  isHealthy() {
    if (!this.coordinator) return false;
    
    const systemStatus = this.coordinator.getSystemStatus();
    return systemStatus.isHealthy && this.isInitialized;
  }

  async cleanup() {
    console.log('🧹 Cleaning up Enhanced Trading Service...');
    
    if (this.coordinator) {
      await this.coordinator.disconnect();
    }
    
    this.isInitialized = false;
    this.portfolioCache = null;
    this.marketDataCache = null;
    this.lastUpdate = null;
  }
}

module.exports = TradingService;