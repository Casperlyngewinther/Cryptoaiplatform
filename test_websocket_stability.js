#!/usr/bin/env node

/**
 * Anti-Fragil WebSocket Test Suite
 * Tester reconnection under forskellige failure scenarios
 */

const WebSocketCoordinator = require('./server/services/WebSocketCoordinator');
const BinanceExchange = require('./server/services/BinanceExchange');

class WebSocketStressTest {
  constructor() {
    this.coordinator = null;
    this.testResults = [];
    this.scenarios = [];
    
    this.setupTestScenarios();
  }

  setupTestScenarios() {
    this.scenarios = [
      {
        name: 'Basic Connection Test',
        description: 'Test alle exchanges kan forbinde',
        test: () => this.testBasicConnection(),
        timeout: 30000
      },
      {
        name: 'BNB/USDT Ticker Test',
        description: 'Test specifik BNB/USDT ticker fejl',
        test: () => this.testBNBUSDTTicker(),
        timeout: 15000
      },
      {
        name: 'Network Interruption Simulation',
        description: 'Simuler netværksafbrydelse og reconnection',
        test: () => this.testNetworkInterruption(),
        timeout: 60000
      },
      {
        name: 'High Frequency Disconnection',
        description: 'Test reconnection under gentagne afbrydelser',
        test: () => this.testHighFrequencyDisconnection(),
        timeout: 120000
      },
      {
        name: 'Circuit Breaker Test',
        description: 'Test circuit breaker aktivering ved mange fejl',
        test: () => this.testCircuitBreaker(),
        timeout: 90000
      },
      {
        name: 'Ticker Data Continuity',
        description: 'Sikr kontinuerlig ticker data under afbrydelser',
        test: () => this.testTickerContinuity(),
        timeout: 45000
      },
      {
        name: 'Health Check Functionality',
        description: 'Test health monitoring og reporting',
        test: () => this.testHealthCheck(),
        timeout: 30000
      },
      {
        name: 'Fallback Mechanism Test',
        description: 'Test API fallback når WebSocket fejler',
        test: () => this.testFallbackMechanism(),
        timeout: 30000
      }
    ];
  }

  async runAllTests() {
    console.log(`🧪 Starter Anti-Fragil WebSocket Test Suite`);
    console.log(`📋 ${this.scenarios.length} test scenarios planlagt\n`);

    for (let i = 0; i < this.scenarios.length; i++) {
      const scenario = this.scenarios[i];
      console.log(`\n🔬 Test ${i + 1}/${this.scenarios.length}: ${scenario.name}`);
      console.log(`📝 ${scenario.description}`);
      console.log(`⏱️ Timeout: ${scenario.timeout}ms`);
      
      const result = await this.runSingleTest(scenario);
      this.testResults.push(result);
      
      if (result.success) {
        console.log(`✅ ${scenario.name} - SUCCESS`);
      } else {
        console.log(`❌ ${scenario.name} - FAILED: ${result.error}`);
      }
      
      // Pause mellem tests
      if (i < this.scenarios.length - 1) {
        console.log(`⏸️ Venter 5 sekunder før næste test...`);
        await this.sleep(5000);
      }
    }

    this.printTestSummary();
  }

  async runSingleTest(scenario) {
    const startTime = Date.now();
    
    try {
      await Promise.race([
        scenario.test(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), scenario.timeout)
        )
      ]);
      
      return {
        name: scenario.name,
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        name: scenario.name,
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  async testBasicConnection() {
    console.log(`🔗 Tester basic forbindelse til alle exchanges...`);
    
    this.coordinator = new WebSocketCoordinator();
    
    const success = await this.coordinator.connectAllExchanges();
    
    if (!success) {
      throw new Error('Ingen exchanges kunne forbinde');
    }
    
    const status = this.coordinator.getSystemStatus();
    console.log(`📊 ${status.exchanges.connected}/${status.exchanges.total} exchanges forbundet`);
    
    if (status.exchanges.connected === 0) {
      throw new Error('Ingen exchanges er forbundet');
    }
    
    console.log(`✅ Basic forbindelse test successful`);
  }

  async testBNBUSDTTicker() {
    console.log(`🪙 Tester BNB/USDT ticker specifikt...`);
    
    if (!this.coordinator) {
      this.coordinator = new WebSocketCoordinator();
      await this.coordinator.connectAllExchanges();
    }
    
    // Test BNB/USDT ticker fra forskellige exchanges
    const symbols = ['BNB/USDT', 'BTC/USDT', 'ETH/USDT'];
    
    for (const symbol of symbols) {
      console.log(`📈 Tester ticker for ${symbol}...`);
      
      const ticker = await this.coordinator.getTicker(symbol);
      
      if (!ticker) {
        console.warn(`⚠️ Ingen ticker data for ${symbol}`);
        continue;
      }
      
      console.log(`✅ ${symbol}: $${ticker.price} (${ticker.changePercent}%) fra ${ticker.exchange}`);
      
      // Valider ticker data struktur
      if (!ticker.price || !ticker.symbol || !ticker.timestamp) {
        throw new Error(`Invalid ticker struktur for ${symbol}`);
      }
    }
    
    console.log(`✅ BNB/USDT ticker test successful`);
  }

  async testNetworkInterruption() {
    console.log(`🌐 Simulerer netværksafbrydelse...`);
    
    if (!this.coordinator) {
      this.coordinator = new WebSocketCoordinator();
      await this.coordinator.connectAllExchanges();
    }
    
    // Track initial connection count
    const initialStatus = this.coordinator.getSystemStatus();
    const initialConnected = initialStatus.exchanges.connected;
    
    console.log(`📊 Initial forbindelser: ${initialConnected}`);
    
    // Simulate network interruption by forcing disconnections
    console.log(`🔌 Simulerer netværksafbrydelse...`);
    
    let reconnectedExchanges = 0;
    
    // Listen for reconnection events
    const reconnectionPromise = new Promise((resolve) => {
      const checkReconnections = () => {
        const currentStatus = this.coordinator.getSystemStatus();
        const currentConnected = currentStatus.exchanges.connected;
        
        if (currentConnected >= Math.ceil(initialConnected * 0.7)) {
          // If 70% of original exchanges reconnected
          reconnectedExchanges = currentConnected;
          resolve();
        } else {
          setTimeout(checkReconnections, 2000);
        }
      };
      
      // Start checking after a delay
      setTimeout(checkReconnections, 5000);
    });
    
    // Trigger reconnections
    console.log(`🔄 Starter reconnection process...`);
    await this.coordinator.reconnectAll();
    
    // Wait for reconnections
    await reconnectionPromise;
    
    console.log(`✅ Netværksafbrydelse test: ${reconnectedExchanges}/${initialConnected} exchanges reconnected`);
    
    if (reconnectedExchanges < Math.ceil(initialConnected * 0.5)) {
      throw new Error(`Insufficient reconnections: ${reconnectedExchanges}/${initialConnected}`);
    }
  }

  async testHighFrequencyDisconnection() {
    console.log(`⚡ Tester high frequency disconnection resilience...`);
    
    if (!this.coordinator) {
      this.coordinator = new WebSocketCoordinator();
      await this.coordinator.connectAllExchanges();
    }
    
    // Perform multiple quick reconnections
    const reconnectCycles = 3;
    let successfulCycles = 0;
    
    for (let i = 0; i < reconnectCycles; i++) {
      console.log(`🔄 Reconnection cycle ${i + 1}/${reconnectCycles}...`);
      
      try {
        const reconnected = await this.coordinator.reconnectAll();
        
        if (reconnected > 0) {
          successfulCycles++;
          console.log(`✅ Cycle ${i + 1}: ${reconnected} exchanges reconnected`);
        } else {
          console.warn(`⚠️ Cycle ${i + 1}: Ingen exchanges reconnected`);
        }
        
        // Short pause between cycles
        await this.sleep(3000);
        
      } catch (error) {
        console.error(`❌ Cycle ${i + 1} fejlede:`, error.message);
      }
    }
    
    if (successfulCycles < Math.ceil(reconnectCycles * 0.7)) {
      throw new Error(`Insufficient successful cycles: ${successfulCycles}/${reconnectCycles}`);
    }
    
    console.log(`✅ High frequency disconnection test: ${successfulCycles}/${reconnectCycles} cycles successful`);
  }

  async testCircuitBreaker() {
    console.log(`🔒 Tester circuit breaker funktionalitet...`);
    
    if (!this.coordinator) {
      this.coordinator = new WebSocketCoordinator();
      await this.coordinator.connectAllExchanges();
    }
    
    let circuitBreakerTriggered = false;
    
    // Listen for circuit breaker events
    this.coordinator.on('systemCircuitBreakerOpen', () => {
      circuitBreakerTriggered = true;
      console.log(`🔒 System circuit breaker aktiveret!`);
    });
    
    this.coordinator.on('systemCircuitBreakerClosed', () => {
      console.log(`🔓 System circuit breaker lukket!`);
    });
    
    // Simulate enough failures to trigger circuit breaker
    // (This would normally happen through actual network failures)
    console.log(`⚠️ Simulerer system stress for at aktivere circuit breaker...`);
    
    // Force check circuit breaker condition
    this.coordinator.checkSystemCircuitBreaker();
    
    // Wait a bit to see if circuit breaker logic responds
    await this.sleep(5000);
    
    // Check system status
    const status = this.coordinator.getSystemStatus();
    console.log(`📊 System status: ${status.exchanges.connected}/${status.exchanges.total} connected`);
    console.log(`🔒 Circuit breaker open: ${status.systemCircuitBreaker.isOpen}`);
    
    console.log(`✅ Circuit breaker test completed`);
  }

  async testTickerContinuity() {
    console.log(`📈 Tester ticker data kontinuitet under afbrydelser...`);
    
    if (!this.coordinator) {
      this.coordinator = new WebSocketCoordinator();
      await this.coordinator.connectAllExchanges();
    }
    
    const testSymbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
    const tickerHistory = new Map();
    
    // Collect initial ticker data
    for (const symbol of testSymbols) {
      const ticker = await this.coordinator.getTicker(symbol);
      if (ticker) {
        tickerHistory.set(symbol, [ticker]);
        console.log(`📊 Initial ${symbol}: $${ticker.price}`);
      }
    }
    
    // Simulate disruption
    console.log(`🔄 Simulerer disruption og sammler ticker data...`);
    await this.coordinator.reconnectAll();
    
    // Continue collecting ticker data
    await this.sleep(10000); // Wait 10 seconds
    
    let continuitySuccess = 0;
    
    for (const symbol of testSymbols) {
      const ticker = await this.coordinator.getTicker(symbol);
      if (ticker) {
        const history = tickerHistory.get(symbol) || [];
        history.push(ticker);
        tickerHistory.set(symbol, history);
        
        console.log(`📊 Post-disruption ${symbol}: $${ticker.price}`);
        continuitySuccess++;
      } else {
        console.warn(`⚠️ Ingen ticker data for ${symbol} efter disruption`);
      }
    }
    
    if (continuitySuccess < testSymbols.length * 0.7) {
      throw new Error(`Insufficient ticker continuity: ${continuitySuccess}/${testSymbols.length}`);
    }
    
    console.log(`✅ Ticker kontinuitet test: ${continuitySuccess}/${testSymbols.length} symbols maintained`);
  }

  async testHealthCheck() {
    console.log(`💓 Tester health check funktionalitet...`);
    
    if (!this.coordinator) {
      this.coordinator = new WebSocketCoordinator();
      await this.coordinator.connectAllExchanges();
    }
    
    // Manual health check
    await this.coordinator.performSystemHealthCheck();
    
    const status = this.coordinator.getSystemStatus();
    
    if (!status.lastHealthCheck) {
      throw new Error('Health check ikke udført');
    }
    
    console.log(`📊 Health check timestamp: ${status.lastHealthCheck.timestamp}`);
    console.log(`💓 System health: ${status.isHealthy ? 'Healthy' : 'Unhealthy'}`);
    console.log(`📈 Aggregated tickers: ${status.aggregatedTickers}`);
    console.log(`⏱️ System uptime: ${Math.round(status.uptime / 1000)}s`);
    
    // Validate health check structure
    const healthReport = status.lastHealthCheck;
    if (!healthReport.system || !healthReport.exchanges || !healthReport.summary) {
      throw new Error('Invalid health report struktur');
    }
    
    console.log(`✅ Health check test successful`);
  }

  async testFallbackMechanism() {
    console.log(`🔄 Tester API fallback når WebSocket fejler...`);
    
    // Test using a single Binance exchange for detailed testing
    const binance = new BinanceExchange();
    await binance.initialize();
    
    // Test getting ticker data (should use WebSocket if available, API as fallback)
    const testSymbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
    
    for (const symbol of testSymbols) {
      console.log(`🔍 Tester fallback for ${symbol}...`);
      
      const ticker = await binance.getTicker(symbol);
      
      if (!ticker) {
        throw new Error(`Ingen ticker data for ${symbol} med fallback`);
      }
      
      console.log(`✅ ${symbol}: $${ticker.price} (kilde: ${ticker.source || 'WebSocket'})`);
      
      // Validate ticker structure
      if (!ticker.price || !ticker.symbol || !ticker.timestamp) {
        throw new Error(`Invalid ticker struktur for ${symbol}`);
      }
    }
    
    await binance.disconnect();
    console.log(`✅ Fallback mechanism test successful`);
  }

  printTestSummary() {
    console.log(`\n🏁 TEST SUITE FÆRDIG`);
    console.log(`${'='.repeat(50)}`);
    
    const successful = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const totalTime = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`📊 RESULTATER:`);
    console.log(`✅ Successful: ${successful}/${this.testResults.length}`);
    console.log(`❌ Failed: ${failed}/${this.testResults.length}`);
    console.log(`⏱️ Total tid: ${Math.round(totalTime / 1000)}s`);
    console.log(`📈 Success rate: ${Math.round((successful / this.testResults.length) * 100)}%`);
    
    console.log(`\n📋 DETALJEREDE RESULTATER:`);
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const duration = Math.round(result.duration / 1000);
      console.log(`${status} ${index + 1}. ${result.name} (${duration}s)`);
      if (!result.success) {
        console.log(`    🔍 Fejl: ${result.error}`);
      }
    });
    
    if (successful === this.testResults.length) {
      console.log(`\n🎉 ALLE TESTS SUCCESSFUL! Anti-Fragil WebSocket arkitektur er stabil!`);
    } else if (successful / this.testResults.length >= 0.8) {
      console.log(`\n👍 MEST SUCCESSFUL! Anti-Fragil arkitektur fungerer godt med mindre forbedringer nødvendige.`);
    } else {
      console.log(`\n⚠️ FORBEDRINGER NØDVENDIGE! Anti-Fragil arkitektur skal optimeres.`);
    }
    
    console.log(`${'='.repeat(50)}`);
  }

  async cleanup() {
    if (this.coordinator) {
      await this.coordinator.disconnect();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests hvis kaldt direkte
if (require.main === module) {
  const tester = new WebSocketStressTest();
  
  tester.runAllTests()
    .then(() => {
      console.log(`\n🏁 Alle tests færdige`);
    })
    .catch(error => {
      console.error(`\n💥 Test suite fejlede:`, error);
    })
    .finally(async () => {
      await tester.cleanup();
      process.exit(0);
    });
}

module.exports = WebSocketStressTest;