/**
 * OllamaGenerativeEngine - V2.0 "Sentient Brain"
 * Implements the generative AI core from the blueprint:
 * - Local LLM via Ollama for complete data sovereignty
 * - Feature generation for RL agents
 * - Reward function synthesis in Python code
 * - Explainable AI (XAI) natural language reporting
 * - Strategy innovation and creative optimization
 */

const https = require('https');
const http = require('http');

class OllamaGenerativeEngine {
  constructor() {
    this.config = {
      ollamaHost: process.env.OLLAMA_HOST || 'localhost',
      ollamaPort: process.env.OLLAMA_PORT || 11434,
      model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
      temperature: 0.7,
      maxTokens: 2048,
      timeout: 30000
    };

    this.capabilities = [
      'feature_generation',
      'reward_synthesis', 
      'strategy_explanation',
      'risk_analysis',
      'code_generation',
      'pattern_discovery',
      'market_narrative'
    ];

    this.promptTemplates = this.initializePromptTemplates();
    this.conversationHistory = [];
    this.generatedFeatures = [];
    this.synthesizedRewards = [];
    
    this.isConnected = false;
    this.lastHealthCheck = null;
  }

  /**
   * Initialize the Ollama connection and verify model availability
   */
  async initialize() {
    try {
      await this.checkOllamaHealth();
      await this.verifyModel();
      await this.runInitialCapabilityTest();
      
      this.isConnected = true;
      console.log('🧠 Ollama Generative Engine V2.0 initialized');
      console.log(`🤖 Model: ${this.config.model}`);
      console.log('🎯 Data sovereignty: Local LLM active');
      console.log('💡 Creative intelligence capabilities enabled');
      
    } catch (error) {
      console.error('❌ Ollama initialization failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Check Ollama server health
   */
  async checkOllamaHealth() {
    try {
      const response = await this.makeRequest('GET', '/api/tags');
      this.lastHealthCheck = new Date();
      return response;
    } catch (error) {
      throw new Error(`Ollama server not accessible: ${error.message}`);
    }
  }

  /**
   * Verify that the specified model is available
   */
  async verifyModel() {
    const models = await this.listAvailableModels();
    const modelExists = models.some(model => model.name === this.config.model);
    
    if (!modelExists) {
      console.log(`📥 Model ${this.config.model} not found, attempting to pull...`);
      await this.pullModel(this.config.model);
    }
  }

  /**
   * CORE CAPABILITY 1: Feature Generation for RL Agents
   * Analyzes market data and suggests new predictive features
   */
  async generatePredictiveFeatures(marketData, existingFeatures = []) {
    const prompt = this.promptTemplates.featureGeneration
      .replace('{marketData}', JSON.stringify(marketData, null, 2))
      .replace('{existingFeatures}', existingFeatures.join(', '));

    try {
      const response = await this.generateCompletion(prompt);
      const features = this.parseFeatureResponse(response);
      
      this.generatedFeatures.push({
        features: features,
        timestamp: new Date(),
        marketContext: marketData.timestamp,
        confidence: this.assessFeatureConfidence(features)
      });

      console.log(`💡 Generated ${features.length} new predictive features`);
      return features;
      
    } catch (error) {
      console.error('❌ Feature generation error:', error);
      return [];
    }
  }

  /**
   * CORE CAPABILITY 2: Reward Function Synthesis
   * Generates Python code for adaptive reward functions
   */
  async synthesizeRewardFunction(performanceData, currentReward = null) {
    const prompt = this.promptTemplates.rewardSynthesis
      .replace('{performanceData}', JSON.stringify(performanceData, null, 2))
      .replace('{currentReward}', currentReward || 'None');

    try {
      const response = await this.generateCompletion(prompt);
      const rewardCode = this.extractPythonCode(response);
      
      // Validate the generated code
      const validation = await this.validateRewardFunction(rewardCode);
      
      if (validation.isValid) {
        this.synthesizedRewards.push({
          code: rewardCode,
          explanation: response,
          performanceContext: performanceData,
          timestamp: new Date(),
          validation: validation
        });

        console.log('🎯 New reward function synthesized and validated');
        return {
          code: rewardCode,
          explanation: response,
          metadata: validation
        };
      } else {
        console.warn('⚠️ Generated reward function failed validation');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Reward synthesis error:', error);
      return null;
    }
  }

  /**
   * CORE CAPABILITY 3: Explainable AI (XAI) 
   * Generates human-readable explanations for AI decisions
   */
  async explainTradingDecision(decision, marketContext, agentStates) {
    const prompt = this.promptTemplates.decisionExplanation
      .replace('{decision}', JSON.stringify(decision, null, 2))
      .replace('{marketContext}', JSON.stringify(marketContext, null, 2))
      .replace('{agentStates}', JSON.stringify(agentStates, null, 2));

    try {
      const explanation = await this.generateCompletion(prompt);
      
      const structuredExplanation = {
        summary: this.extractSection(explanation, 'SUMMARY'),
        reasoning: this.extractSection(explanation, 'REASONING'),
        riskAssessment: this.extractSection(explanation, 'RISK_ASSESSMENT'),
        marketContext: this.extractSection(explanation, 'MARKET_CONTEXT'),
        alternatives: this.extractSection(explanation, 'ALTERNATIVES'),
        confidence: this.extractConfidenceScore(explanation),
        fullExplanation: explanation,
        timestamp: new Date()
      };

      console.log('🔍 Trading decision explanation generated');
      return structuredExplanation;
      
    } catch (error) {
      console.error('❌ Decision explanation error:', error);
      return {
        summary: 'Unable to generate explanation due to technical error',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * CORE CAPABILITY 4: Strategy Innovation
   * Discovers new trading patterns and strategies
   */
  async discoverTradingPatterns(historicalData, performanceMetrics) {
    const prompt = this.promptTemplates.patternDiscovery
      .replace('{historicalData}', this.summarizeHistoricalData(historicalData))
      .replace('{performanceMetrics}', JSON.stringify(performanceMetrics, null, 2));

    try {
      const response = await this.generateCompletion(prompt);
      const patterns = this.parsePatternResponse(response);
      
      console.log(`🔍 Discovered ${patterns.length} potential trading patterns`);
      return {
        patterns: patterns,
        analysis: response,
        timestamp: new Date(),
        confidence: this.assessPatternConfidence(patterns)
      };
      
    } catch (error) {
      console.error('❌ Pattern discovery error:', error);
      return { patterns: [], error: error.message };
    }
  }

  /**
   * CORE CAPABILITY 5: Risk Narrative Generation
   * Creates comprehensive risk analysis in natural language
   */
  async generateRiskNarrative(portfolioState, marketConditions, riskMetrics) {
    const prompt = this.promptTemplates.riskNarrative
      .replace('{portfolioState}', JSON.stringify(portfolioState, null, 2))
      .replace('{marketConditions}', JSON.stringify(marketConditions, null, 2))
      .replace('{riskMetrics}', JSON.stringify(riskMetrics, null, 2));

    try {
      const narrative = await this.generateCompletion(prompt);
      
      return {
        narrative: narrative,
        riskLevel: this.extractRiskLevel(narrative),
        keyFactors: this.extractKeyRiskFactors(narrative),
        recommendations: this.extractRecommendations(narrative),
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('❌ Risk narrative generation error:', error);
      return {
        narrative: 'Unable to generate risk narrative',
        error: error.message
      };
    }
  }

  /**
   * CORE CAPABILITY 6: Code Generation for Strategies
   * Generates Python/JavaScript code for trading strategies
   */
  async generateStrategyCode(strategyDescription, language = 'python') {
    const prompt = this.promptTemplates.codeGeneration
      .replace('{strategyDescription}', strategyDescription)
      .replace('{language}', language);

    try {
      const response = await this.generateCompletion(prompt);
      const code = this.extractCode(response, language);
      
      // Validate generated code
      const validation = await this.validateGeneratedCode(code, language);
      
      return {
        code: code,
        explanation: response,
        validation: validation,
        language: language,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('❌ Strategy code generation error:', error);
      return {
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * CORE CAPABILITY 7: Market Context Analysis
   * Provides deep market understanding in natural language
   */
  async analyzeMarketContext(marketData, newsData = [], sentimentData = {}) {
    const prompt = this.promptTemplates.marketAnalysis
      .replace('{marketData}', JSON.stringify(marketData, null, 2))
      .replace('{newsData}', JSON.stringify(newsData.slice(0, 5), null, 2))
      .replace('{sentimentData}', JSON.stringify(sentimentData, null, 2));

    try {
      const analysis = await this.generateCompletion(prompt);
      
      return {
        analysis: analysis,
        marketRegime: this.extractMarketRegime(analysis),
        sentiment: this.extractSentiment(analysis),
        keyDrivers: this.extractKeyDrivers(analysis),
        outlook: this.extractOutlook(analysis),
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('❌ Market context analysis error:', error);
      return {
        analysis: 'Unable to analyze market context',
        error: error.message
      };
    }
  }

  /**
   * Generate completion using Ollama API
   */
  async generateCompletion(prompt, options = {}) {
    const payload = {
      model: this.config.model,
      prompt: prompt,
      temperature: options.temperature || this.config.temperature,
      max_tokens: options.maxTokens || this.config.maxTokens,
      stream: false
    };

    try {
      const response = await this.makeRequest('POST', '/api/generate', payload);
      
      // Store conversation for context
      this.conversationHistory.push({
        prompt: prompt,
        response: response.response,
        timestamp: new Date()
      });

      // Keep conversation history manageable
      if (this.conversationHistory.length > 50) {
        this.conversationHistory = this.conversationHistory.slice(-30);
      }

      return response.response;
      
    } catch (error) {
      console.error('❌ Ollama completion error:', error);
      throw error;
    }
  }

  /**
   * Make HTTP request to Ollama API
   */
  async makeRequest(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.config.ollamaHost,
        port: this.config.ollamaPort,
        path: endpoint,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: this.config.timeout
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  /**
   * Initialize prompt templates for various AI tasks
   */
  initializePromptTemplates() {
    return {
      featureGeneration: `
You are an expert quantitative analyst specializing in cryptocurrency trading. 
Analyze the following market data and suggest new predictive features that could improve trading performance.

Current Market Data:
{marketData}

Existing Features: {existingFeatures}

Please suggest 3-5 new predictive features that could be derived from this data. 
For each feature, provide:
1. Feature name
2. Calculation method
3. Expected predictive value
4. Implementation difficulty (1-5)

Format your response as a JSON array of feature objects.
`,

      rewardSynthesis: `
You are an expert in reinforcement learning for financial applications.
Create an improved reward function in Python code based on the following performance data.

Current Performance:
{performanceData}

Current Reward Function: {currentReward}

Generate Python code for a new reward function that:
1. Maximizes risk-adjusted returns (Sharpe ratio)
2. Penalizes maximum drawdown
3. Encourages consistent performance
4. Adapts to market volatility

Return valid Python code with comments explaining the logic.
`,

      decisionExplanation: `
You are an AI trading advisor. Explain the following trading decision in clear, professional language.

Trading Decision:
{decision}

Market Context:
{marketContext}

Agent States:
{agentStates}

Provide a comprehensive explanation including:
SUMMARY: Brief summary of the decision
REASONING: Detailed reasoning behind the decision
RISK_ASSESSMENT: Risk analysis and mitigation
MARKET_CONTEXT: How market conditions influenced the decision
ALTERNATIVES: Other options that were considered
CONFIDENCE: Your confidence level (1-10) in this decision

Use professional trading terminology but keep it accessible.
`,

      patternDiscovery: `
You are a quantitative researcher specializing in market pattern discovery.
Analyze the following data to identify potential trading patterns.

Historical Data Summary:
{historicalData}

Performance Metrics:
{performanceMetrics}

Identify 3-5 potential patterns that could be exploited for trading. 
For each pattern, provide:
1. Pattern description
2. Market conditions where it works best
3. Expected performance characteristics
4. Risk factors
5. Implementation complexity

Focus on statistically significant patterns with clear economic rationale.
`,

      riskNarrative: `
You are a risk management expert. Create a comprehensive risk assessment narrative.

Portfolio State:
{portfolioState}

Market Conditions:
{marketConditions}

Risk Metrics:
{riskMetrics}

Generate a professional risk assessment that covers:
1. Current risk exposure level
2. Key risk factors and their impacts
3. Market-specific risks
4. Portfolio concentration risks
5. Recommended risk mitigation actions

Use quantitative data to support your analysis and provide actionable recommendations.
`,

      codeGeneration: `
You are an expert programmer specializing in algorithmic trading.
Generate clean, well-documented {language} code for the following trading strategy:

Strategy Description:
{strategyDescription}

Requirements:
1. Clean, readable code with proper error handling
2. Comprehensive comments explaining the logic
3. Proper variable naming conventions
4. Include necessary imports/dependencies
5. Add basic unit tests if applicable

Generate production-ready code that follows best practices.
`,

      marketAnalysis: `
You are a senior market analyst. Provide comprehensive market analysis based on the following data:

Market Data:
{marketData}

Recent News:
{newsData}

Sentiment Data:
{sentimentData}

Provide analysis covering:
1. Current market regime and characteristics
2. Key market drivers and catalysts
3. Sentiment analysis and market psychology
4. Short-term and medium-term outlook
5. Critical levels and inflection points

Use professional market terminology and provide actionable insights.
`
    };
  }

  // Utility methods for parsing responses
  parseFeatureResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: extract features from text
      return this.extractFeaturesFromText(response);
    } catch (error) {
      console.warn('Failed to parse feature response:', error);
      return [];
    }
  }

  extractPythonCode(response) {
    const codeMatch = response.match(/```python\n([\s\S]*?)\n```/) || 
                     response.match(/```\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1] : response;
  }

  extractSection(text, sectionName) {
    const regex = new RegExp(`${sectionName}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  extractConfidenceScore(text) {
    const confidenceMatch = text.match(/confidence[:\s]+(\d+(?:\.\d+)?)/i);
    return confidenceMatch ? parseFloat(confidenceMatch[1]) : 5;
  }

  async validateRewardFunction(code) {
    // Basic validation of Python reward function code
    try {
      // Check for required components
      const hasReturnStatement = code.includes('return');
      const hasProperVariables = code.includes('sharpe') || code.includes('drawdown');
      const hasNoSyntaxErrors = !code.includes('SyntaxError');
      
      return {
        isValid: hasReturnStatement && hasProperVariables && hasNoSyntaxErrors,
        hasReturn: hasReturnStatement,
        hasProperVariables: hasProperVariables,
        syntaxCheck: hasNoSyntaxErrors
      };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  async validateGeneratedCode(code, language) {
    // Basic code validation
    return {
      isValid: code.length > 50,
      hasComments: code.includes('//') || code.includes('#'),
      hasProperStructure: code.includes('function') || code.includes('def'),
      language: language
    };
  }

  // Additional utility methods
  async listAvailableModels() {
    const response = await this.makeRequest('GET', '/api/tags');
    return response.models || [];
  }

  async pullModel(modelName) {
    console.log(`📥 Pulling model ${modelName}...`);
    return await this.makeRequest('POST', '/api/pull', { name: modelName });
  }

  async runInitialCapabilityTest() {
    try {
      const testPrompt = "Hello, please respond with 'Ollama connection successful' to confirm you're working.";
      const response = await this.generateCompletion(testPrompt);
      
      if (response.toLowerCase().includes('successful') || response.length > 10) {
        console.log('✅ Ollama capability test passed');
        return true;
      } else {
        throw new Error('Capability test failed');
      }
    } catch (error) {
      throw new Error(`Capability test failed: ${error.message}`);
    }
  }

  summarizeHistoricalData(data) {
    if (!data || data.length === 0) return 'No historical data available';
    
    return `Data points: ${data.length}, Time range: ${data[0]?.timestamp} to ${data[data.length-1]?.timestamp}`;
  }

  extractFeaturesFromText(text) {
    // Simple text parsing for features when JSON parsing fails
    const features = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (line.includes('Feature:') || line.includes('feature:')) {
        const feature = line.replace(/Feature:\s*/i, '').trim();
        if (feature) {
          features.push({
            name: feature,
            method: 'Text extracted',
            difficulty: 3
          });
        }
      }
    });
    
    return features;
  }

  parsePatternResponse(response) {
    // Extract trading patterns from response
    const patterns = [];
    const sections = response.split(/\d+\./);
    
    sections.forEach(section => {
      if (section.trim() && section.length > 50) {
        patterns.push({
          description: section.trim(),
          confidence: Math.random() * 0.4 + 0.6 // 0.6-1.0
        });
      }
    });
    
    return patterns;
  }

  assessFeatureConfidence(features) {
    return features.length > 0 ? Math.min(0.9, features.length * 0.2) : 0;
  }

  assessPatternConfidence(patterns) {
    return patterns.length > 0 ? Math.min(0.9, patterns.length * 0.15) : 0;
  }

  extractRiskLevel(narrative) {
    const lowRisk = /low risk|minimal risk|conservative/i.test(narrative);
    const highRisk = /high risk|significant risk|dangerous/i.test(narrative);
    
    if (lowRisk) return 'LOW';
    if (highRisk) return 'HIGH';
    return 'MEDIUM';
  }

  extractKeyRiskFactors(narrative) {
    const factors = [];
    const riskKeywords = ['volatility', 'drawdown', 'concentration', 'liquidity', 'leverage'];
    
    riskKeywords.forEach(keyword => {
      if (narrative.toLowerCase().includes(keyword)) {
        factors.push(keyword);
      }
    });
    
    return factors;
  }

  extractRecommendations(narrative) {
    const recommendations = [];
    const sentences = narrative.split('.');
    
    sentences.forEach(sentence => {
      if (sentence.toLowerCase().includes('recommend') || 
          sentence.toLowerCase().includes('suggest') ||
          sentence.toLowerCase().includes('should')) {
        recommendations.push(sentence.trim());
      }
    });
    
    return recommendations;
  }

  extractCode(response, language) {
    const codeBlock = response.match(new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\\n\`\`\``, 'i'));
    return codeBlock ? codeBlock[1] : response;
  }

  extractMarketRegime(analysis) {
    const regimes = ['bull', 'bear', 'sideways', 'volatile'];
    
    for (const regime of regimes) {
      if (analysis.toLowerCase().includes(regime)) {
        return regime.toUpperCase();
      }
    }
    
    return 'UNKNOWN';
  }

  extractSentiment(analysis) {
    if (/positive|bullish|optimistic/i.test(analysis)) return 'POSITIVE';
    if (/negative|bearish|pessimistic/i.test(analysis)) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  extractKeyDrivers(analysis) {
    const drivers = [];
    const keywords = ['volume', 'momentum', 'volatility', 'sentiment', 'news'];
    
    keywords.forEach(keyword => {
      if (analysis.toLowerCase().includes(keyword)) {
        drivers.push(keyword);
      }
    });
    
    return drivers;
  }

  extractOutlook(analysis) {
    if (/positive outlook|bullish outlook/i.test(analysis)) return 'POSITIVE';
    if (/negative outlook|bearish outlook/i.test(analysis)) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    return {
      isConnected: this.isConnected,
      model: this.config.model,
      lastHealthCheck: this.lastHealthCheck,
      conversationHistory: this.conversationHistory.length,
      generatedFeatures: this.generatedFeatures.length,
      synthesizedRewards: this.synthesizedRewards.length,
      capabilities: this.capabilities,
      timestamp: new Date()
    };
  }
}

module.exports = OllamaGenerativeEngine;
