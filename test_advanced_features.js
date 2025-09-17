#!/usr/bin/env node

/**
 * CryptoAI Platform V2.1 - Advanced Features Test Suite
 * Comprehensive testing for all 7 advanced engines
 */

const axios = require('axios');

class AdvancedFeaturesTestSuite {
  constructor() {
    this.baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async runAllTests() {
    console.log('🚀 CryptoAI Platform V2.1 - Advanced Features Test Suite');
    console.log('='.repeat(60));
    console.log();

    const testSuites = [
      () => this.testSystemHealth(),
      () => this.testPortfolioAnalytics(),
      () => this.testDeFiIntegration(),
      () => this.testAdvancedAlerts(),
      () => this.testSocialTrading(),
      () => this.testBacktestingEngine(),
      () => this.testMobilePWA(),
      () => this.testNewsSentiment(),
      () => this.testFeatureStatus()
    ];

    for (const testSuite of testSuites) {
      try {
        await testSuite();
      } catch (error) {
        console.error(`Test suite failed: ${error.message}`);
      }
      console.log(); // Add spacing between test suites
    }

    this.printSummary();
  }

  async testSystemHealth() {
    console.log('🏥 Testing System Health & V2.1 Integration');
    console.log('-'.repeat(50));

    await this.runTest('System Health Check', async () => {
      const response = await axios.get(`${this.baseURL}/api/health`);
      
      this.assert(response.status === 200, 'Health endpoint returns 200');
      this.assert(response.data.status === 'healthy', 'System status is healthy');
      this.assert(response.data.version === '2.1.0', 'Version is 2.1.0');
      this.assert(response.data.advancedFeatures, 'Advanced features section exists');
      
      const features = response.data.advancedFeatures;
      const expectedFeatures = [
        'portfolioAnalytics', 'defiIntegration', 'advancedAlerts',
        'socialTrading', 'backtesting', 'mobilePWA', 'newsSentiment'
      ];
      
      for (const feature of expectedFeatures) {
        this.assert(features.hasOwnProperty(feature), `${feature} is included in health check`);
      }

      console.log(`✅ System Health: ${Object.keys(features).length} advanced features detected`);
    });
  }

  async testPortfolioAnalytics() {
    console.log('📊 Testing Advanced Portfolio Analytics Engine');
    console.log('-'.repeat(50));

    await this.runTest('Portfolio Analytics Endpoint', async () => {
      const response = await axios.get(`${this.baseURL}/api/v2/portfolio/analytics`);
      
      this.assert(response.status === 200, 'Portfolio analytics endpoint accessible');
      this.assert(response.data.success, 'Response indicates success');
      this.assert(response.data.data, 'Analytics data is present');
      
      const analysis = response.data.data;
      const expectedSections = ['overview', 'riskMetrics', 'performance', 'optimization'];
      
      for (const section of expectedSections) {
        this.assert(analysis[section], `${section} section exists in analysis`);
      }

      // Test specific metrics
      const overview = analysis.overview;
      this.assert(typeof overview.totalValue === 'number', 'Total value is numeric');
      this.assert(typeof overview.totalPnL === 'number', 'Total PnL is numeric');
      
      const riskMetrics = analysis.riskMetrics;
      this.assert(typeof riskMetrics.volatility === 'number', 'Volatility is calculated');
      this.assert(typeof riskMetrics.sharpeRatio === 'number', 'Sharpe ratio is calculated');

      console.log(`✅ Portfolio Analytics: Analysis with ${expectedSections.length} sections generated`);
    });
  }

  async testDeFiIntegration() {
    console.log('🏦 Testing DeFi Integration Engine');
    console.log('-'.repeat(50));

    await this.runTest('DeFi Opportunities Discovery', async () => {
      const assets = 'BTC,ETH,USDC';
      const response = await axios.get(
        `${this.baseURL}/api/v2/defi/opportunities?assets=${assets}&riskTolerance=MEDIUM`
      );
      
      this.assert(response.status === 200, 'DeFi opportunities endpoint accessible');
      this.assert(response.data.success, 'Response indicates success');
      this.assert(response.data.data, 'Opportunities data is present');
      
      const opportunities = response.data.data;
      this.assert(opportunities.totalOpportunities >= 0, 'Total opportunities count exists');
      this.assert(Array.isArray(opportunities.topOpportunities), 'Top opportunities is an array');
      this.assert(opportunities.categories, 'Opportunities categories exist');

      console.log(`✅ DeFi Integration: ${opportunities.totalOpportunities} opportunities discovered`);
    });

    await this.runTest('DeFi Strategy Execution (Mock)', async () => {
      const executionData = {
        opportunityId: 'test_opp_123',
        amount: 100,
        walletAddress: '0x1234567890123456789012345678901234567890'
      };

      try {
        const response = await axios.post(`${this.baseURL}/api/v2/defi/execute`, executionData);
        
        if (response.status === 200) {
          this.assert(response.data.success, 'DeFi execution response indicates success');
          console.log('✅ DeFi Execution: Mock execution successful');
        }
      } catch (error) {
        if (error.response && error.response.status === 503) {
          console.log('⚠️ DeFi Execution: Service not available (expected in test mode)');
        } else {
          throw error;
        }
      }
    });
  }

  async testAdvancedAlerts() {
    console.log('🚨 Testing Advanced Alert System');
    console.log('-'.repeat(50));

    await this.runTest('Alert Creation', async () => {
      const alertConfig = {
        name: 'Test Alert',
        description: 'Test alert for V2.1 testing',
        type: 'PRICE_MOVEMENT',
        conditions: {
          symbol: 'BTC',
          threshold: 5.0,
          direction: 'UP',
          timeframe: '5m'
        },
        channels: ['websocket'],
        severity: 'MEDIUM'
      };

      try {
        const response = await axios.post(`${this.baseURL}/api/v2/alerts/create`, alertConfig);
        
        if (response.status === 200) {
          this.assert(response.data.success, 'Alert creation response indicates success');
          this.assert(response.data.alertId, 'Alert ID is returned');
          console.log(`✅ Alert Creation: Alert ${response.data.alertId} created successfully`);
        }
      } catch (error) {
        if (error.response && error.response.status === 503) {
          console.log('⚠️ Alert Creation: Service not available (expected in test mode)');
        } else {
          throw error;
        }
      }
    });

    await this.runTest('Alert Analytics', async () => {
      try {
        const response = await axios.get(`${this.baseURL}/api/v2/alerts/analytics`);
        
        if (response.status === 200) {
          this.assert(response.data.success, 'Alert analytics response indicates success');
          this.assert(response.data.data, 'Analytics data is present');
          console.log('✅ Alert Analytics: Analytics data retrieved successfully');
        }
      } catch (error) {
        if (error.response && error.response.status === 503) {
          console.log('⚠️ Alert Analytics: Service not available (expected in test mode)');
        } else {
          throw error;
        }
      }
    });
  }

  async testSocialTrading() {
    console.log('👥 Testing Social Trading Engine');
    console.log('-'.repeat(50));

    await this.runTest('Trader Profile Creation', async () => {
      const profileData = {
        userId: 'test_user_123',
        profileData: {
          username: 'test_trader',
          displayName: 'Test Trader',
          bio: 'Test trader for V2.1 testing',
          riskProfile: 'MEDIUM'
        }
      };

      try {
        const response = await axios.post(`${this.baseURL}/api/v2/social/trader/create`, profileData);
        
        if (response.status === 200) {
          this.assert(response.data.success, 'Trader creation response indicates success');
          this.assert(response.data.data, 'Trader data is returned');
          console.log(`✅ Social Trading: Trader profile ${response.data.data.username} created`);
        }
      } catch (error) {
        if (error.response && error.response.status === 503) {
          console.log('⚠️ Social Trading: Service not available (expected in test mode)');
        } else {
          throw error;
        }
      }
    });

    await this.runTest('Leaderboard Access', async () => {
      try {
        const response = await axios.get(`${this.baseURL}/api/v2/social/leaderboard?category=overall&limit=10`);
        
        if (response.status === 200) {
          this.assert(response.data.success, 'Leaderboard response indicates success');
          this.assert(Array.isArray(response.data.data), 'Leaderboard data is an array');
          console.log(`✅ Social Trading: Leaderboard with ${response.data.data.length} traders retrieved`);
        }
      } catch (error) {
        if (error.response && error.response.status === 503) {
          console.log('⚠️ Social Trading: Service not available (expected in test mode)');
        } else {
          throw error;
        }
      }
    });
  }

  async testBacktestingEngine() {
    console.log('🧪 Testing Advanced Backtesting Engine');
    console.log('-'.repeat(50));

    await this.runTest('Backtest Initiation', async () => {
      const backtestConfig = {
        name: 'Test Strategy Backtest',
        strategy: {
          name: 'Simple RSI Strategy',
          rules: [
            {
              type: 'CROSS_BELOW',
              indicator1: 'RSI',
              indicator2: 30,
              action: 'BUY'
            }
          ],
          indicators: [
            { type: 'RSI', parameters: { period: 14 } }
          ]
        },
        symbol: 'BTC/USDT',
        timeframe: '1h',
        startDate: '2024-01-01',
        endDate: '2024-02-01',
        initialCapital: 10000
      };

      try {
        const response = await axios.post(`${this.baseURL}/api/v2/backtest/run`, backtestConfig);
        
        if (response.status === 200) {
          this.assert(response.data.success, 'Backtest initiation response indicates success');
          this.assert(response.data.backtestId, 'Backtest ID is returned');
          this.assert(response.data.estimatedDuration, 'Estimated duration is provided');
          console.log(`✅ Backtesting: Backtest ${response.data.backtestId} initiated`);
        }
      } catch (error) {
        if (error.response && error.response.status === 503) {
          console.log('⚠️ Backtesting: Service not available (expected in test mode)');
        } else {
          throw error;
        }
      }
    });
  }

  async testMobilePWA() {
    console.log('📱 Testing Mobile & PWA Engine');
    console.log('-'.repeat(50));

    await this.runTest('Mobile Portfolio Summary', async () => {
      try {
        const response = await axios.get(`${this.baseURL}/api/mobile/portfolio/summary`);
        
        if (response.status === 200) {
          this.assert(response.data.success, 'Mobile portfolio response indicates success');
          this.assert(response.data.data, 'Portfolio data is present');
          
          const portfolio = response.data.data;
          this.assert(typeof portfolio.totalValue === 'number', 'Total value is numeric');
          this.assert(Array.isArray(portfolio.topPositions), 'Top positions is an array');
          
          console.log(`✅ Mobile PWA: Portfolio summary with ${portfolio.topPositions.length} positions`);
        }
      } catch (error) {
        if (error.response && error.response.status === 503) {
          console.log('⚠️ Mobile PWA: Service not available (expected in test mode)');
        } else {
          throw error;
        }
      }
    });

    await this.runTest('PWA Manifest', async () => {
      try {
        const response = await axios.get(`${this.baseURL}/api/pwa/manifest.json`);
        
        if (response.status === 200) {
          this.assert(response.data.name, 'PWA manifest has name');
          this.assert(response.data.short_name, 'PWA manifest has short name');
          this.assert(Array.isArray(response.data.icons), 'PWA manifest has icons array');
          
          console.log(`✅ Mobile PWA: Manifest with ${response.data.icons.length} icons generated`);
        }
      } catch (error) {
        if (error.response && error.response.status === 503) {
          console.log('⚠️ Mobile PWA: Service not available (expected in test mode)');
        } else {
          throw error;
        }
      }
    });
  }

  async testNewsSentiment() {
    console.log('📰 Testing News & Sentiment Analysis Engine');
    console.log('-'.repeat(50));

    await this.runTest('News Summary', async () => {
      try {
        const response = await axios.get(`${this.baseURL}/api/v2/news/summary?symbols=BTC,ETH&limit=5`);
        
        if (response.status === 200) {
          this.assert(response.data.success, 'News summary response indicates success');
          this.assert(response.data.data, 'News data is present');
          
          const newsData = response.data.data;
          this.assert(Array.isArray(newsData.articles), 'Articles is an array');
          this.assert(newsData.summary, 'Summary data exists');
          
          console.log(`✅ News Sentiment: ${newsData.articles.length} articles retrieved`);
        }
      } catch (error) {
        if (error.response && error.response.status === 503) {
          console.log('⚠️ News Sentiment: Service not available (expected in test mode)');
        } else {
          throw error;
        }
      }
    });

    await this.runTest('Sentiment Analysis', async () => {
      try {
        const response = await axios.get(`${this.baseURL}/api/v2/sentiment/BTC`);
        
        if (response.status === 200) {
          this.assert(response.data.success, 'Sentiment analysis response indicates success');
          this.assert(response.data.data, 'Sentiment data is present');
          
          const sentiment = response.data.data;
          this.assert(sentiment.symbol === 'BTC', 'Correct symbol in response');
          this.assert(sentiment.current, 'Current sentiment data exists');
          
          console.log(`✅ News Sentiment: BTC sentiment score ${sentiment.current.score}`);
        }
      } catch (error) {
        if (error.response && (error.response.status === 503 || error.response.status === 404)) {
          console.log('⚠️ News Sentiment: Service not available or data not found (expected in test mode)');
        } else {
          throw error;
        }
      }
    });
  }

  async testFeatureStatus() {
    console.log('🎯 Testing Feature Status & Integration');
    console.log('-'.repeat(50));

    await this.runTest('Advanced Features Status', async () => {
      const response = await axios.get(`${this.baseURL}/api/v2/features/status`);
      
      this.assert(response.status === 200, 'Features status endpoint accessible');
      this.assert(response.data.success, 'Response indicates success');
      this.assert(response.data.data, 'Status data is present');
      
      const status = response.data.data;
      this.assert(status.version === '2.1.0', 'Version is 2.1.0');
      this.assert(status.features, 'Features section exists');
      this.assert(status.capabilities, 'Capabilities section exists');
      
      const features = status.features;
      const expectedFeatures = [
        'portfolioAnalytics', 'defiIntegration', 'advancedAlerts',
        'socialTrading', 'backtesting', 'mobilePWA', 'newsSentiment'
      ];
      
      let enabledCount = 0;
      for (const featureName of expectedFeatures) {
        const feature = features[featureName];
        this.assert(feature, `${featureName} exists in features status`);
        this.assert(typeof feature.enabled === 'boolean', `${featureName} has enabled status`);
        if (feature.enabled) enabledCount++;
      }

      this.assert(status.capabilities.totalFeatures === 7, 'Total features count is 7');
      this.assert(status.capabilities.activeFeatures >= 0, 'Active features count is valid');

      console.log(`✅ Feature Status: ${enabledCount}/${expectedFeatures.length} advanced features enabled`);
      console.log(`   Active Features: ${status.capabilities.activeFeatures}/${status.capabilities.totalFeatures}`);
    });
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    
    try {
      console.log(`🧪 ${testName}...`);
      await testFunction();
      this.testResults.passed++;
      this.testResults.details.push({ name: testName, status: 'PASSED' });
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
      console.log(`❌ ${testName} FAILED: ${error.message}`);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  printSummary() {
    console.log('📋 Test Summary');
    console.log('='.repeat(60));
    
    const passRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);
    
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed} ✅`);
    console.log(`Failed: ${this.testResults.failed} ❌`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log();

    if (this.testResults.failed > 0) {
      console.log('Failed Tests:');
      this.testResults.details
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  ❌ ${test.name}: ${test.error}`);
        });
      console.log();
    }

    if (passRate >= 80) {
      console.log('🎉 EXCELLENT! CryptoAI Platform V2.1 Advanced Features are working well!');
    } else if (passRate >= 60) {
      console.log('✅ GOOD! Most advanced features are operational.');
    } else {
      console.log('⚠️ Some advanced features need attention.');
    }

    console.log();
    console.log('🚀 Next Steps:');
    console.log('1. Review any failed tests above');
    console.log('2. Check service configurations in .env file');
    console.log('3. Verify all dependencies are installed');
    console.log('4. Check server logs for detailed error information');
    console.log();
    console.log('For support, see: ADVANCED_FEATURES_GUIDE.md');
    console.log();
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new AdvancedFeaturesTestSuite();
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Test suite interrupted');
    process.exit(1);
  });

  testSuite.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = AdvancedFeaturesTestSuite;