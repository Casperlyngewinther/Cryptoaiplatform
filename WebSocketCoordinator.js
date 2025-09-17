const EventEmitter = require('events');
const BinanceExchange = require('./BinanceExchange');
const CryptoComExchange = require('./CryptoComExchange_Enhanced');
const BybitExchange = require('./BybitExchange');
const KuCoinExchange = require('./KuCoinExchange');
const OKXExchange = require('./OKXExchange');
const CoinbaseExchange = require('./CoinbaseExchange');
const KrakenExchange = require('./KrakenExchange');

/**
 * Central Anti-Fragil WebSocket Coordinator
 * Håndterer alle exchange forbindelser med unified health monitoring
 */
class WebSocketCoordinator extends EventEmitter {
  constructor() {
    super();
    
    this.exchanges = new Map();
    this.metrics = {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      totalReconnections: 0,
      startTime: Date.now(),
      lastHealthCheck: null
    };
    
    // Global ticker aggregation
    this.aggregatedTickers = new Map();
    this.tickerSubscribers = new Set();
    
    // Health monitoring
    this.healthCheckInterval = 60000; // 1 minute
    this.healthTimer = null;
    
    // Circuit breaker for entire system
    this.systemCircuitBreaker = {
      isOpen: false,
      failures: 0,
      threshold: 3, // Open after 3 exchange failures
      timeout: 120000, // 2 minutes
      lastFailureTime: null
    };
    
    this.initializeExchanges();
    this.startHealthMonitoring();
  }

  initializeExchanges() {
    // Initialize alle exchanges med anti-fragil arkitektur
    const exchangeClasses = [
      { name: 'Binance', class: BinanceExchange, priority: 1 },
      { name: 'Crypto.com', class: CryptoComExchange, priority: 2 },
      { name: 'Bybit', class: BybitExchange, priority: 3 },
      { name: 'KuCoin', class: KuCoinExchange, priority: 4 },
      { name: 'OKX', class: OKXExchange, priority: 5 },
      { name: 'Coinbase', class: CoinbaseExchange, priority: 6 },
      { name: 'Kraken', class: KrakenExchange, priority: 7 }
    ];

    exchangeClasses.forEach(({ name, class: ExchangeClass, priority }) => {
      try {
        const exchange = new ExchangeClass();
        
        this.exchanges.set(name, {
          instance: exchange,
          priority,
          connected: false,
          lastConnect: null,
          failures: 0,
          metrics: {
            connectAttempts: 0,
            successfulConnects: 0,
            reconnections: 0,
            lastTicker: null,
            tickerCount: 0
          }
        });

        // Setup exchange event listeners
        this.setupExchangeEventHandlers(name, exchange);
        
      } catch (error) {
        console.error(`❌ Fejl ved initialisering af ${name}:`, error);
      }
    });

    console.log(`🏗️ WebSocket Coordinator initialiseret med ${this.exchanges.size} exchanges`);
  }

  setupExchangeEventHandlers(exchangeName, exchange) {
    // Enhanced event handling for anti-fragil architecture
    if (exchange.wsManager) {
      // For exchanges with enhanced WebSocket manager
      exchange.wsManager.on('connected', () => {
        this.handleExchangeConnected(exchangeName);
      });

      exchange.wsManager.on('disconnected', (data) => {
        this.handleExchangeDisconnected(exchangeName, data);
      });

      exchange.wsManager.on('ticker', (ticker) => {
        this.handleTickerUpdate(exchangeName, ticker);
      });

      exchange.wsManager.on('error', (error) => {
        this.handleExchangeError(exchangeName, error);
      });

      exchange.wsManager.on('circuitBreakerOpen', () => {
        console.log(`🔒 ${exchangeName} Circuit breaker åbnet`);
        this.checkSystemCircuitBreaker();
      });

    } else {
      // Fallback for exchanges without enhanced manager
      if (exchange.on) {
        exchange.on('connected', () => this.handleExchangeConnected(exchangeName));
        exchange.on('disconnected', (data) => this.handleExchangeDisconnected(exchangeName, data));
        exchange.on('error', (error) => this.handleExchangeError(exchangeName, error));
      }
    }
  }

  async connectAllExchanges() {
    console.log(`🚀 Starter forbindelse til alle exchanges med anti-fragil arkitektur...`);
    
    const connectionPromises = [];
    
    // Sort exchanges by priority
    const sortedExchanges = Array.from(this.exchanges.entries())
      .sort(([,a], [,b]) => a.priority - b.priority);

    for (const [name, exchangeData] of sortedExchanges) {
      const promise = this.connectExchange(name)
        .catch(error => {
          console.error(`❌ ${name} forbindelse fejlede:`, error);
          return false;
        });
      
      connectionPromises.push(promise);
      
      // Stagger connections to avoid overwhelming
      if (connectionPromises.length % 2 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const results = await Promise.allSettled(connectionPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;

    console.log(`📊 Forbindelse resultater: ${successful} successfulde, ${failed} fejlede`);
    
    this.metrics.successfulConnections = successful;
    this.metrics.failedConnections = failed;
    
    this.emit('allConnectionsAttempted', { successful, failed, total: results.length });
    
    return successful > 0;
  }

  async connectExchange(exchangeName) {
    const exchangeData = this.exchanges.get(exchangeName);
    if (!exchangeData) {
      throw new Error(`Exchange ${exchangeName} ikke fundet`);
    }

    console.log(`🔗 Forbinder til ${exchangeName}...`);
    
    exchangeData.metrics.connectAttempts++;
    this.metrics.totalConnections++;

    try {
      const success = await exchangeData.instance.initialize();
      
      if (success) {
        exchangeData.connected = true;
        exchangeData.lastConnect = Date.now();
        exchangeData.failures = 0;
        exchangeData.metrics.successfulConnects++;
        
        console.log(`✅ ${exchangeName} forbundet succesfuldt`);
        this.emit('exchangeConnected', exchangeName);
        return true;
      } else {
        throw new Error('Forbindelse fejlede');
      }
      
    } catch (error) {
      exchangeData.failures++;
      console.error(`❌ ${exchangeName} forbindelse fejlede:`, error.message);
      this.emit('exchangeConnectionFailed', { exchangeName, error });
      throw error;
    }
  }

  handleExchangeConnected(exchangeName) {
    const exchangeData = this.exchanges.get(exchangeName);
    if (exchangeData) {
      exchangeData.connected = true;
      exchangeData.lastConnect = Date.now();
      exchangeData.failures = 0;
    }
    
    console.log(`🟢 ${exchangeName} WebSocket forbundet`);
    this.emit('exchangeWebSocketConnected', exchangeName);
    
    // Reset system circuit breaker if enough exchanges are connected
    this.checkSystemHealth();
  }

  handleExchangeDisconnected(exchangeName, data) {
    const exchangeData = this.exchanges.get(exchangeName);
    if (exchangeData) {
      exchangeData.connected = false;
    }
    
    console.log(`🔴 ${exchangeName} WebSocket afbrudt: ${data?.code} - ${data?.reason}`);
    this.emit('exchangeWebSocketDisconnected', { exchangeName, ...data });
    
    // Check if we need to open system circuit breaker
    this.checkSystemCircuitBreaker();
  }

  handleExchangeError(exchangeName, error) {
    const exchangeData = this.exchanges.get(exchangeName);
    if (exchangeData) {
      exchangeData.failures++;
    }
    
    console.error(`⚠️ ${exchangeName} fejl:`, error.message);
    this.emit('exchangeError', { exchangeName, error });
  }

  handleTickerUpdate(exchangeName, ticker) {
    const exchangeData = this.exchanges.get(exchangeName);
    if (exchangeData) {
      exchangeData.metrics.lastTicker = Date.now();
      exchangeData.metrics.tickerCount++;
    }

    // Aggregate ticker data fra multiple exchanges
    const symbol = ticker.symbol;
    const existingTicker = this.aggregatedTickers.get(symbol);
    
    if (!existingTicker || new Date(ticker.timestamp) > new Date(existingTicker.timestamp)) {
      // Update with newest data
      this.aggregatedTickers.set(symbol, {
        ...ticker,
        sources: existingTicker ? [...(existingTicker.sources || []), exchangeName] : [exchangeName]
      });
      
      // Broadcast to subscribers
      this.emit('tickerUpdate', ticker);
    }
  }

  checkSystemCircuitBreaker() {
    const connectedExchanges = Array.from(this.exchanges.values())
      .filter(exchange => exchange.connected).length;
    
    const totalExchanges = this.exchanges.size;
    const connectionRatio = connectedExchanges / totalExchanges;
    
    // Open circuit breaker if less than 30% of exchanges are connected
    if (connectionRatio < 0.3) {
      if (!this.systemCircuitBreaker.isOpen) {
        this.systemCircuitBreaker.isOpen = true;
        this.systemCircuitBreaker.failures++;
        this.systemCircuitBreaker.lastFailureTime = Date.now();
        
        console.log(`🔒 SYSTEM Circuit Breaker åbnet - kun ${connectedExchanges}/${totalExchanges} exchanges forbundet`);
        this.emit('systemCircuitBreakerOpen', { connectedExchanges, totalExchanges });
      }
    }
  }

  checkSystemHealth() {
    const connectedExchanges = Array.from(this.exchanges.values())
      .filter(exchange => exchange.connected).length;
    
    const totalExchanges = this.exchanges.size;
    const connectionRatio = connectedExchanges / totalExchanges;
    
    // Close circuit breaker if more than 50% of exchanges are connected
    if (connectionRatio > 0.5 && this.systemCircuitBreaker.isOpen) {
      this.systemCircuitBreaker.isOpen = false;
      this.systemCircuitBreaker.failures = 0;
      
      console.log(`🔓 SYSTEM Circuit Breaker lukket - ${connectedExchanges}/${totalExchanges} exchanges forbundet`);
      this.emit('systemCircuitBreakerClosed', { connectedExchanges, totalExchanges });
    }
  }

  startHealthMonitoring() {
    this.healthTimer = setInterval(() => {
      this.performSystemHealthCheck();
    }, this.healthCheckInterval);
    
    console.log(`💓 System health monitoring startet (interval: ${this.healthCheckInterval}ms)`);
  }

  async performSystemHealthCheck() {
    console.log(`💓 Udfører system health check...`);
    
    const healthReport = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: Date.now() - this.metrics.startTime,
        circuitBreakerOpen: this.systemCircuitBreaker.isOpen,
        aggregatedTickers: this.aggregatedTickers.size
      },
      exchanges: {},
      summary: {
        total: this.exchanges.size,
        connected: 0,
        healthy: 0,
        errors: 0
      }
    };

    // Check each exchange
    for (const [name, exchangeData] of this.exchanges) {
      try {
        let exchangeHealth = null;
        
        // Try to get detailed health if available
        if (exchangeData.instance.performHealthCheck) {
          exchangeHealth = await exchangeData.instance.performHealthCheck();
        }
        
        const isConnected = exchangeData.connected;
        const isHealthy = isConnected && (exchangeHealth?.checks?.webSocketHealth !== false);
        
        healthReport.exchanges[name] = {
          connected: isConnected,
          healthy: isHealthy,
          priority: exchangeData.priority,
          failures: exchangeData.failures,
          metrics: exchangeData.metrics,
          detailedHealth: exchangeHealth
        };
        
        if (isConnected) healthReport.summary.connected++;
        if (isHealthy) healthReport.summary.healthy++;
        if (exchangeData.failures > 0) healthReport.summary.errors++;
        
      } catch (error) {
        console.error(`Health check fejl for ${name}:`, error);
        healthReport.exchanges[name] = {
          connected: false,
          healthy: false,
          error: error.message
        };
        healthReport.summary.errors++;
      }
    }

    this.metrics.lastHealthCheck = healthReport;
    this.emit('healthReport', healthReport);
    
    console.log(`💓 Health check færdig: ${healthReport.summary.healthy}/${healthReport.summary.total} exchanges healthy`);
  }

  // Få specifik ticker fra bedste tilgængelige kilde
  async getTicker(symbol) {
    // Try aggregated data first
    const aggregatedTicker = this.aggregatedTickers.get(symbol);
    if (aggregatedTicker) {
      const age = Date.now() - new Date(aggregatedTicker.timestamp).getTime();
      if (age < 30000) { // Less than 30 seconds old
        return aggregatedTicker;
      }
    }

    // Try exchanges in priority order
    const sortedExchanges = Array.from(this.exchanges.entries())
      .filter(([, data]) => data.connected)
      .sort(([,a], [,b]) => a.priority - b.priority);

    for (const [name, exchangeData] of sortedExchanges) {
      try {
        const ticker = await exchangeData.instance.getTicker(symbol);
        if (ticker) {
          // Cache in aggregated data
          this.aggregatedTickers.set(symbol, {
            ...ticker,
            sources: [name]
          });
          return ticker;
        }
      } catch (error) {
        console.warn(`⚠️ ${name} ticker fetch fejl for ${symbol}:`, error.message);
      }
    }

    return null;
  }

  // Få alle tilgængelige tickers
  getAllTickers() {
    const allTickers = {};
    
    // Start with aggregated data
    for (const [symbol, ticker] of this.aggregatedTickers) {
      allTickers[symbol] = ticker;
    }
    
    // Add cached data from each exchange
    for (const [name, exchangeData] of this.exchanges) {
      if (exchangeData.instance.getAllCachedTickers) {
        try {
          const exchangeTickers = exchangeData.instance.getAllCachedTickers();
          for (const [symbol, ticker] of Object.entries(exchangeTickers)) {
            if (!allTickers[symbol] || 
                new Date(ticker.timestamp) > new Date(allTickers[symbol].timestamp)) {
              allTickers[symbol] = ticker;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Fejl ved hentning af cached tickers fra ${name}:`, error.message);
        }
      }
    }
    
    return allTickers;
  }

  // Reconnect alle exchanges
  async reconnectAll() {
    console.log(`🔄 Reconnecting alle exchanges...`);
    
    const reconnectPromises = [];
    
    for (const [name, exchangeData] of this.exchanges) {
      if (exchangeData.instance.reconnect) {
        const promise = exchangeData.instance.reconnect()
          .then(() => {
            exchangeData.metrics.reconnections++;
            this.metrics.totalReconnections++;
            return true;
          })
          .catch(error => {
            console.error(`❌ ${name} reconnection fejlede:`, error);
            return false;
          });
        
        reconnectPromises.push(promise);
      }
    }

    const results = await Promise.allSettled(reconnectPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    console.log(`🔄 Reconnection færdig: ${successful}/${reconnectPromises.length} successful`);
    return successful;
  }

  // Få detaljeret system status
  getSystemStatus() {
    const connectedExchanges = Array.from(this.exchanges.values())
      .filter(exchange => exchange.connected).length;
    
    return {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.metrics.startTime,
      metrics: this.metrics,
      systemCircuitBreaker: this.systemCircuitBreaker,
      exchanges: {
        total: this.exchanges.size,
        connected: connectedExchanges,
        connectionRatio: connectedExchanges / this.exchanges.size
      },
      aggregatedTickers: this.aggregatedTickers.size,
      lastHealthCheck: this.metrics.lastHealthCheck,
      isHealthy: connectedExchanges > 0 && !this.systemCircuitBreaker.isOpen
    };
  }

  // Cleanup alle forbindelser
  async disconnect() {
    console.log(`🔌 Afbryder alle exchange forbindelser...`);
    
    // Stop health monitoring
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }

    // Disconnect all exchanges
    const disconnectPromises = [];
    for (const [name, exchangeData] of this.exchanges) {
      if (exchangeData.instance.disconnect) {
        disconnectPromises.push(
          exchangeData.instance.disconnect()
            .catch(error => console.error(`Fejl ved afbrydelse af ${name}:`, error))
        );
      }
    }

    await Promise.allSettled(disconnectPromises);
    
    // Clear aggregated data
    this.aggregatedTickers.clear();
    
    console.log(`✅ Alle exchanges afbrudt`);
  }
}

module.exports = WebSocketCoordinator;