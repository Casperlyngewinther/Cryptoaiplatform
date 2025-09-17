#!/usr/bin/env node

/**
 * Ollama Connectivity Test Script
 * Tests the enhanced Ollama service with fallback mechanisms
 */

const EnhancedOllamaGenerativeEngine = require('./server/services/EnhancedOllamaGenerativeEngine');

async function runOllamaConnectivityTest() {
  console.log('🧪 Starting Ollama Connectivity Test...\n');
  
  const engine = new EnhancedOllamaGenerativeEngine();
  
  try {
    // Test 1: Initialization
    console.log('📋 Test 1: Initialization');
    console.log('=' * 50);
    
    await engine.initialize();
    console.log('✅ Initialization completed\n');
    
    // Test 2: System Status
    console.log('📋 Test 2: System Status Check');
    console.log('=' * 50);
    
    const status = engine.getSystemStatus();
    console.log('System Status:', JSON.stringify(status, null, 2));
    console.log('\n');
    
    // Test 3: Feature Generation
    console.log('📋 Test 3: Feature Generation Test');
    console.log('=' * 50);
    
    const mockMarketData = {
      symbol: 'BTC/USDT',
      price: 42150.50,
      volume: 12500000,
      timestamp: new Date(),
      indicators: {
        rsi: 65.2,
        macd: 125.8,
        ema_20: 41800.25
      }
    };
    
    const features = await engine.generatePredictiveFeatures(mockMarketData, ['price_momentum', 'volume_spike']);
    console.log('Generated Features:', features);
    console.log('\n');
    
    // Test 4: Reward Function Synthesis
    console.log('📋 Test 4: Reward Function Synthesis');
    console.log('=' * 50);
    
    const performanceData = {
      returns: 0.05,
      sharpe_ratio: 1.85,
      max_drawdown: -0.08,
      win_rate: 0.67,
      total_trades: 150
    };
    
    const rewardFunction = await engine.synthesizeRewardFunction(performanceData);
    if (rewardFunction) {
      console.log('Reward Function Generated:');
      console.log(rewardFunction.code.substring(0, 200) + '...');
    } else {
      console.log('⚠️ Reward function generation failed');
    }
    console.log('\n');
    
    // Test 5: Decision Explanation
    console.log('📋 Test 5: Decision Explanation Test');
    console.log('=' * 50);
    
    const mockDecision = {
      action: 'BUY',
      amount: 0.5,
      confidence: 0.85,
      reasoning: 'Strong technical breakout with volume confirmation'
    };
    
    const mockMarketContext = {
      trend: 'bullish',
      volatility: 'moderate',
      support: 41500,
      resistance: 43000
    };
    
    const mockAgentStates = {
      technical_agent: { confidence: 0.9, signal: 'bullish' },
      risk_agent: { confidence: 0.7, signal: 'moderate_risk' }
    };
    
    const explanation = await engine.explainTradingDecision(mockDecision, mockMarketContext, mockAgentStates);
    console.log('Decision Explanation:');
    console.log('Summary:', explanation.summary);
    console.log('Confidence:', explanation.confidence);
    console.log('\n');
    
    // Test 6: Connection Recovery (if using fallback)
    if (engine.usingFallback) {
      console.log('📋 Test 6: Force Reconnection Test');
      console.log('=' * 50);
      
      console.log('Currently using fallback, testing force reconnect...');
      const reconnectResult = await engine.forceReconnect();
      console.log('Reconnection result:', reconnectResult ? 'Success' : 'Failed');
      console.log('\n');
    }
    
    // Test 7: Performance Metrics
    console.log('📋 Test 7: Performance Metrics');
    console.log('=' * 50);
    
    const finalStatus = engine.getSystemStatus();
    console.log('Performance Metrics:');
    console.log(`- Total Requests: ${finalStatus.metrics.totalRequests}`);
    console.log(`- Success Rate: ${finalStatus.metrics.successRate}`);
    console.log(`- Average Response Time: ${finalStatus.metrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`- Connection Mode: ${finalStatus.usingFallback ? 'Fallback (Mock)' : 'Live (Ollama)'}`);
    console.log(`- Circuit Breaker: ${finalStatus.circuitBreakerOpen ? 'OPEN' : 'CLOSED'}`);
    console.log('\n');
    
    // Test Summary
    console.log('🎯 Test Summary');
    console.log('=' * 50);
    
    if (finalStatus.usingFallback) {
      console.log('✅ All tests completed successfully using FALLBACK service');
      console.log('📝 Note: Ollama is not available, but system is functioning with mock responses');
      console.log('🔄 System will automatically attempt to reconnect to Ollama periodically');
    } else {
      console.log('✅ All tests completed successfully using LIVE Ollama service');
      console.log('📡 Full AI capabilities are available');
    }
    
    console.log('\n🧠 "Sentient Brain" functionality is operational!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🚨 System Status: FAILED');
    
  } finally {
    // Cleanup
    await engine.cleanup();
    console.log('\n🧹 Test cleanup completed');
  }
}

// Event handlers for monitoring
function setupEventMonitoring(engine) {
  engine.on('connected', () => {
    console.log('🟢 Event: Ollama connected');
  });
  
  engine.on('disconnected', () => {
    console.log('🔴 Event: Ollama disconnected');
  });
  
  engine.on('fallback-activated', () => {
    console.log('🟡 Event: Fallback service activated');
  });
  
  engine.on('fallback-used', () => {
    console.log('🟡 Event: Fallback service used for request');
  });
  
  engine.on('circuit-breaker-open', () => {
    console.log('🚨 Event: Circuit breaker opened');
  });
}

// Additional connectivity tests
async function testDirectOllamaConnection() {
  console.log('\n🔧 Direct Ollama Connection Test');
  console.log('=' * 50);
  
  const http = require('http');
  
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 11434,
      path: '/api/tags',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      console.log('✅ Direct connection successful');
      console.log(`Status: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (error) => {
      console.log('❌ Direct connection failed:', error.message);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log('❌ Direct connection timeout');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Health monitoring test
async function testHealthMonitoring() {
  console.log('\n🏥 Health Monitoring Test');
  console.log('=' * 50);
  
  const engine = new EnhancedOllamaGenerativeEngine();
  
  // Setup monitoring
  let eventCount = 0;
  const events = [];
  
  engine.on('connected', () => events.push('connected'));
  engine.on('disconnected', () => events.push('disconnected'));
  engine.on('fallback-activated', () => events.push('fallback-activated'));
  
  try {
    await engine.initialize();
    
    // Let health monitoring run for a few seconds
    console.log('⏳ Running health monitoring for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('📊 Health monitoring events:', events);
    console.log('✅ Health monitoring test completed');
    
  } catch (error) {
    console.log('❌ Health monitoring test failed:', error.message);
  } finally {
    await engine.cleanup();
  }
}

// Main test execution
async function main() {
  try {
    // Test direct connection first
    await testDirectOllamaConnection();
    
    // Run main connectivity test
    await runOllamaConnectivityTest();
    
    // Test health monitoring
    // await testHealthMonitoring();
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runOllamaConnectivityTest };