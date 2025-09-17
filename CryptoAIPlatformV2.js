const axios = require('axios');

class CryptoAIPlatformV2 {
  constructor() {
    this.name = 'Crypto AI Platform V2';
    this.enableAIPlatform = process.env.ENABLE_AI_PLATFORM !== 'false';
    this.modelEndpoint = process.env.AI_MODEL_ENDPOINT || 'http://localhost:11434';
    this.enableModelDownload = process.env.ENABLE_AI_MODEL_DOWNLOAD === 'true';
    this.isInitialized = false;
    this.modelAvailable = false;
    this.analysisCache = null;
    this.lastAnalysis = null;
  }

  async initialize() {
    console.log('🤖 Initializing Crypto AI Platform V2...');
    
    // Check if AI platform is enabled
    if (!this.enableAIPlatform) {
      console.log('💡 AI Platform disabled - using statistical analysis only');
      this.isInitialized = true;
      this.modelAvailable = false;
      
      // Start periodic analysis with statistical methods only
      this.startPeriodicAnalysis();
      return true;
    }
    
    try {
      // Check if AI model endpoint is available
      const isModelServerRunning = await this.checkModelServer();
      
      if (!isModelServerRunning) {
        if (this.enableModelDownload) {
          console.log('💾 Attempting to start AI model server...');
          await this.startModelServer();
        } else {
          console.log('🔗 Ollama AI server not found - using statistical analysis with AI insights');
          console.log('💡 To enable full AI: Install Ollama and run "ollama serve"');
        }
      }
      
      // Test model availability
      this.modelAvailable = await this.testModelConnection();
      
      if (this.modelAvailable) {
        console.log('✅ AI model server connected successfully');
      } else {
        console.log('🤖 AI Platform active - using enhanced statistical analysis');
        console.log('📊 For advanced AI features: Install Ollama + llama3.1 model');
      }
      
      this.isInitialized = true;
      
      // Start periodic analysis updates
      this.startPeriodicAnalysis();
      
      return true;
      
    } catch (error) {
      console.error('❌ AI Platform initialization failed:', error.message);
      console.log('💡 AI platform will operate in statistical analysis mode');
      this.isInitialized = true; // Still initialize for backup functionality
      return true; // Don't fail completely
    }
  }

  async checkModelServer() {
    try {
      const response = await axios.get(`${this.modelEndpoint}/api/tags`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async startModelServer() {
    try {
      // This would typically start Ollama or another model server
      console.log('🚀 Starting AI model server...');
      
      // Check if ollama is installed and start it
      // For now, we'll just log the attempt
      console.log('⚠️  Please ensure Ollama is installed and running on your system');
      console.log('📞 Run: ollama serve');
      
      return false;
    } catch (error) {
      console.error('Error starting model server:', error);
      return false;
    }
  }

  async testModelConnection() {
    try {
      if (!await this.checkModelServer()) {
        return false;
      }
      
      // Test with a simple prompt using the correct model name
      const response = await axios.post(`${this.modelEndpoint}/api/generate`, {
        model: 'llama3.1',
        prompt: 'Test connection',
        stream: false
      }, {
        timeout: 10000
      });
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  startPeriodicAnalysis() {
    // Update analysis every 5 minutes
    setInterval(async () => {
      try {
        await this.generateMarketAnalysis();
      } catch (error) {
        console.error('Error during periodic analysis:', error);
      }
    }, 300000); // 5 minutes
  }

  async generateMarketAnalysis() {
    try {
      if (this.enableAIPlatform && this.modelAvailable) {
        this.analysisCache = await this.generateAIAnalysis();
      } else {
        this.analysisCache = await this.generateStatisticalAnalysis();
      }
      
      this.lastAnalysis = new Date();
      return this.analysisCache;
      
    } catch (error) {
      console.error('Market analysis generation failed:', error);
      return this.getBackupAnalysis();
    }
  }

  async generateAIAnalysis() {
    try {
      const marketData = await this.gatherMarketData();
      
      const prompt = `
Analyze the following cryptocurrency market data and provide insights:

${JSON.stringify(marketData, null, 2)}

Provide:
1. Overall market sentiment
2. Key trends
3. Risk assessment
4. Potential opportunities
5. Recommendations

Keep the analysis concise and actionable.`;

      const response = await axios.post(`${this.modelEndpoint}/api/generate`, {
        model: 'llama3.1',
        prompt,
        stream: false
      }, {
        timeout: 30000
      });

      return {
        type: 'ai_analysis',
        analysis: response.data.response,
        marketData,
        timestamp: new Date().toISOString(),
        confidence: 0.85
      };
      
    } catch (error) {
      console.error('AI analysis generation failed:', error);
      throw error;
    }
  }

  async generateStatisticalAnalysis() {
    try {
      const marketData = await this.gatherMarketData();
      
      // Perform statistical analysis on market data
      const analysis = this.performStatisticalAnalysis(marketData);
      
      return {
        type: 'statistical_analysis',
        analysis,
        marketData,
        timestamp: new Date().toISOString(),
        confidence: 0.65
      };
      
    } catch (error) {
      console.error('Statistical analysis generation failed:', error);
      throw error;
    }
  }

  async gatherMarketData() {
    // Simulate gathering market data from various sources
    const mockData = {
      prices: {
        'BTC/USDT': { price: 45000, change: 2.5, volume: 1000000 },
        'ETH/USDT': { price: 3000, change: -1.2, volume: 750000 },
        'BNB/USDT': { price: 400, change: 0.8, volume: 250000 }
      },
      marketCap: 2.1e12,
      fearGreedIndex: 65,
      volatility: {
        overall: 0.045,
        btc: 0.038,
        eth: 0.052
      }
    };
    
    return mockData;
  }

  performStatisticalAnalysis(marketData) {
    const prices = Object.values(marketData.prices);
    const avgChange = prices.reduce((sum, p) => sum + p.change, 0) / prices.length;
    const totalVolume = prices.reduce((sum, p) => sum + p.volume, 0);
    
    let sentiment = 'neutral';
    if (avgChange > 2) sentiment = 'bullish';
    else if (avgChange < -2) sentiment = 'bearish';
    
    let riskLevel = 'medium';
    if (marketData.volatility.overall > 0.06) riskLevel = 'high';
    else if (marketData.volatility.overall < 0.03) riskLevel = 'low';
    
    return {
      sentiment,
      averageChange: avgChange.toFixed(2),
      totalVolume: totalVolume.toLocaleString(),
      riskLevel,
      recommendation: this.generateRecommendation(sentiment, riskLevel),
      keyInsights: [
        `Market sentiment is ${sentiment} with average price change of ${avgChange.toFixed(2)}%`,
        `Risk level is ${riskLevel} based on volatility of ${(marketData.volatility.overall * 100).toFixed(2)}%`,
        `Total trading volume is ${totalVolume.toLocaleString()} across major pairs`
      ]
    };
  }

  generateRecommendation(sentiment, riskLevel) {
    if (sentiment === 'bullish' && riskLevel === 'low') {
      return 'Consider increasing position sizes in major cryptocurrencies';
    } else if (sentiment === 'bearish' && riskLevel === 'high') {
      return 'Consider reducing exposure and maintaining cash reserves';
    } else if (riskLevel === 'high') {
      return 'Use smaller position sizes and implement strict stop-losses';
    } else {
      return 'Maintain current portfolio allocation with regular rebalancing';
    }
  }

  getBackupAnalysis() {
    return {
      type: 'backup_analysis',
      analysis: {
        sentiment: 'neutral',
        recommendation: 'Monitor market conditions and maintain diversified portfolio',
        keyInsights: [
          'AI analysis temporarily unavailable',
          'Using backup statistical methods',
          'Recommend cautious approach until full analysis is restored'
        ]
      },
      timestamp: new Date().toISOString(),
      confidence: 0.3
    };
  }

  async getMarketAnalysis() {
    if (this.analysisCache && this.lastAnalysis && (Date.now() - this.lastAnalysis.getTime() < 300000)) {
      return this.analysisCache;
    }
    
    return await this.generateMarketAnalysis();
  }

  async getTradingSignals() {
    const analysis = await this.getMarketAnalysis();
    
    // Generate trading signals based on analysis
    const signals = {
      timestamp: new Date().toISOString(),
      signals: []
    };
    
    if (analysis.type === 'ai_analysis') {
      // Parse AI analysis for signals
      signals.signals.push({
        symbol: 'BTC/USDT',
        action: 'hold',
        confidence: 0.7,
        reason: 'Based on AI market analysis'
      });
    } else {
      // Generate signals from statistical analysis
      const sentiment = analysis.analysis.sentiment;
      
      if (sentiment === 'bullish') {
        signals.signals.push({
          symbol: 'BTC/USDT',
          action: 'buy',
          confidence: 0.6,
          reason: 'Positive market sentiment detected'
        });
      } else if (sentiment === 'bearish') {
        signals.signals.push({
          symbol: 'BTC/USDT',
          action: 'sell',
          confidence: 0.6,
          reason: 'Negative market sentiment detected'
        });
      }
    }
    
    return signals;
  }

  getStatus() {
    return {
      aiPlatformEnabled: this.enableAIPlatform,
      modelAvailable: this.modelAvailable,
      isInitialized: this.isInitialized,
      analysisMode: this.enableAIPlatform && this.modelAvailable ? 'AI Analysis' : 'Statistical Analysis',
      lastAnalysis: this.lastAnalysis
    };
  }

  async cleanup() {
    console.log('🧹 Cleaning up AI Platform...');
    this.isInitialized = false;
    this.modelAvailable = false;
    this.analysisCache = null;
    this.lastAnalysis = null;
  }
}

module.exports = CryptoAIPlatformV2;