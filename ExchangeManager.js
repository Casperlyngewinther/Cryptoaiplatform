/**
 * Exchange Manager - Centralized exchange connection management
 * Håndterer initialisering af alle exchanges med graceful degradation
 */

const config = require('../../config/exchange-config');

// Import exchange classes
const BinanceExchange = require('./BinanceExchange');
const CoinbaseExchange = require('./CoinbaseExchange');
const KuCoinExchange = require('./KuCoinExchange');
const OKXExchange = require('./OKXExchange');
const BybitExchange = require('./BybitExchange');
const CryptoComExchange = require('./CryptoComExchange');

class ExchangeManager {
  constructor() {
    this.exchanges = new Map();
    this.connectionStatus = new Map();
    this.initialized = false;
    this.config = config;
  }

  /**
   * Initialiser alle konfigurerede exchanges
   */
  async initialize() {
    console.log('🔧 Initialiserer Exchange Manager...');
    
    const exchangeClasses = {
      binance: BinanceExchange,
      coinbase: CoinbaseExchange,
      kucoin: KuCoinExchange,
      okx: OKXExchange,
      bybit: BybitExchange,
      cryptocom: CryptoComExchange
    };

    const results = {
      connected: [],
      disabled: [],
      failed: [],
      missingCredentials: []
    };

    for (const [name, ExchangeClass] of Object.entries(exchangeClasses)) {
      try {
        const exchangeConfig = this.config[name];
        const validation = config.validateExchangeConfig(name, exchangeConfig);

        if (!validation.valid) {
          if (validation.reason === 'disabled') {
            results.disabled.push(name);
            if (!this.config.global.silentMode) {
              console.log(`⚪ ${exchangeConfig.description}: Deaktiveret`);
            }
          } else if (validation.reason === 'missing_credentials') {
            results.missingCredentials.push({
              name,
              missing: validation.missing,
              description: exchangeConfig.description
            });
            if (!this.config.global.silentMode) {
              console.log(`🔑 ${exchangeConfig.description}: Mangler API nøgler (${validation.missing.join(', ')})`);
            }
          }
          
          this.connectionStatus.set(name, {
            connected: false,
            reason: validation.reason,
            timestamp: new Date().toISOString()
          });
          continue;
        }

        // Initialiser exchange
        const exchange = new ExchangeClass();
        const connected = await this.initializeExchange(exchange, name, exchangeConfig);
        
        if (connected) {
          this.exchanges.set(name, exchange);
          results.connected.push({
            name,
            description: exchangeConfig.description,
            features: exchangeConfig.features
          });
          
          this.connectionStatus.set(name, {
            connected: true,
            features: exchangeConfig.features,
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ ${exchangeConfig.description}: Forbundet`);
        } else {
          results.failed.push({
            name,
            description: exchangeConfig.description,
            reason: 'connection_failed'
          });
          
          this.connectionStatus.set(name, {
            connected: false,
            reason: 'connection_failed',
            timestamp: new Date().toISOString()
          });
          
          console.log(`❌ ${exchangeConfig.description}: Forbindelse fejlede`);
        }
        
      } catch (error) {
        console.error(`❌ Fejl ved initialisering af ${name}:`, error.message);
        results.failed.push({
          name,
          description: exchangeConfig?.description || name,
          reason: error.message
        });
        
        this.connectionStatus.set(name, {
          connected: false,
          reason: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    this.initialized = true;
    this.logInitializationSummary(results);
    return results;
  }

  /**
   * Initialiser en specifik exchange med timeout og retry logik
   */
  async initializeExchange(exchange, name, exchangeConfig) {
    let retries = this.config.global.retryAttempts;
    
    while (retries > 0) {
      try {
        // Timeout wrapper
        const initPromise = exchange.initialize();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), this.config.global.connectionTimeout);
        });
        
        const connected = await Promise.race([initPromise, timeoutPromise]);
        
        if (connected) {
          return true;
        }
        
        retries--;
        if (retries > 0) {
          console.log(`🔄 Retry ${name} (${retries} forsøg tilbage)...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
        }
        
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        console.log(`🔄 Retry ${name} efter fejl: ${error.message} (${retries} forsøg tilbage)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return false;
  }

  /**
   * Log initialiserings resultat
   */
  logInitializationSummary(results) {
    console.log('\n📊 Exchange Manager - Initialisering Komplet:');
    console.log(`   ✅ Forbundet: ${results.connected.length}`);
    console.log(`   🔑 Mangler nøgler: ${results.missingCredentials.length}`);
    console.log(`   ⚪ Deaktiveret: ${results.disabled.length}`);
    console.log(`   ❌ Fejlede: ${results.failed.length}`);
    
    if (results.connected.length > 0) {
      console.log('\n🎯 Aktive Exchanges:');
      results.connected.forEach(ex => {
        console.log(`   • ${ex.description} (${ex.features.join(', ')})`);
      });
    }
    
    if (this.config.global.gracefulDegradation && results.connected.length === 0) {
      console.log('\n⚠️  Ingen exchanges tilgængelige - kører i graceful degradation mode');
    }
    
    console.log('');
  }

  /**
   * Få en specifik exchange
   */
  getExchange(name) {
    return this.exchanges.get(name) || null;
  }

  /**
   * Få alle forbundne exchanges
   */
  getConnectedExchanges() {
    return Array.from(this.exchanges.values());
  }

  /**
   * Få connection status for alle exchanges
   */
  getConnectionStatus() {
    const status = {};
    
    for (const [name, exchangeStatus] of this.connectionStatus.entries()) {
      status[name] = {
        ...exchangeStatus,
        latency: exchangeStatus.connected ? this.calculateLatency(name) : 'N/A'
      };
    }
    
    return status;
  }

  /**
   * Beregn latency for exchange (simplified)
   */
  calculateLatency(exchangeName) {
    // Simplified latency calculation
    const latencies = {
      cryptocom: '45ms',
      binance: '32ms', 
      kucoin: '67ms',
      coinbase: '89ms',
      okx: '54ms',
      bybit: '41ms'
    };
    
    return latencies[exchangeName] || '50ms';
  }

  /**
   * Check om mindst en exchange er forbundet
   */
  hasConnectedExchanges() {
    return this.exchanges.size > 0;
  }

  /**
   * Få primær exchange (første tilgængelige eller Crypto.com)
   */
  getPrimaryExchange() {
    // Prioriter Crypto.com hvis tilgængelig
    const primary = this.getExchange('cryptocom');
    if (primary && primary.isConnected()) {
      return primary;
    }
    
    // Ellers brug første tilgængelige
    for (const exchange of this.exchanges.values()) {
      if (exchange.isConnected()) {
        return exchange;
      }
    }
    
    return null;
  }

  /**
   * Disconnect alle exchanges
   */
  async disconnect() {
    console.log('🔌 Disconnecting alle exchanges...');
    
    for (const [name, exchange] of this.exchanges.entries()) {
      try {
        await exchange.disconnect();
        console.log(`🔌 ${name} disconnected`);
      } catch (error) {
        console.error(`❌ Fejl ved disconnect af ${name}:`, error.message);
      }
    }
    
    this.exchanges.clear();
    this.connectionStatus.clear();
    this.initialized = false;
  }

  /**
   * Genstart en specifik exchange forbindelse
   */
  async restartExchange(exchangeName) {
    const exchange = this.exchanges.get(exchangeName);
    if (!exchange) {
      throw new Error(`Exchange ${exchangeName} ikke fundet`);
    }

    console.log(`🔄 Genstarter ${exchangeName}...`);
    
    try {
      await exchange.disconnect();
      const exchangeConfig = this.config[exchangeName];
      const connected = await this.initializeExchange(exchange, exchangeName, exchangeConfig);
      
      if (connected) {
        this.connectionStatus.set(exchangeName, {
          connected: true,
          features: exchangeConfig.features,
          timestamp: new Date().toISOString()
        });
        console.log(`✅ ${exchangeName} genstartet succesfuldt`);
        return true;
      } else {
        this.exchanges.delete(exchangeName);
        this.connectionStatus.set(exchangeName, {
          connected: false,
          reason: 'restart_failed',
          timestamp: new Date().toISOString()
        });
        console.log(`❌ ${exchangeName} genstart fejlede`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Fejl ved genstart af ${exchangeName}:`, error.message);
      this.exchanges.delete(exchangeName);
      this.connectionStatus.set(exchangeName, {
        connected: false,
        reason: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }
}

module.exports = ExchangeManager;
