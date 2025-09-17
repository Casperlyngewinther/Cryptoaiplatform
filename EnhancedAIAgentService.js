// server/services/EnhancedAIAgentService.js
const AIAgentService = require('./AIAgentService');

class EnhancedAIAgentService extends AIAgentService {
  constructor() {
    super();
    this.performanceHistory = new Map();
    this.marketRegimes = new Map();
    this.explanationEngine = new ExplanationEngine();
  }

  async initialize() {
    await super.initialize();
    
    // Initialize enhanced features
    await this.initializePerformanceTracking();
    await this.initializeMarketRegimeDetection();
    
    console.log('🧠 Enhanced AI Agent Service initialized');
  }

  // Advanced decision making with market regime awareness
  async makeEnhancedDecision(agent, marketData) {
    const baseDecision = await super.makeAgentDecision(agent, marketData);
    
    // Detect current market regime
    const marketRegime = await this.detectMarketRegime(marketData);
    
    // Adjust confidence based on agent's historical performance in this regime
    const regimePerformance = await this.getAgentRegimePerformance(agent.id, marketRegime);
    const adjustedConfidence = this.adjustConfidenceForRegime(baseDecision.confidence, regimePerformance);
    
    // Enhanced decision with regime awareness
    const enhancedDecision = {
      ...baseDecision,
      confidence: adjustedConfidence,
      marketRegime,
      regimePerformance,
      enhancementMetadata: {
        originalConfidence: baseDecision.confidence,
        regimeAdjustment: adjustedConfidence - baseDecision.confidence,
        regimeContext: marketRegime
      }
    };

    // Generate explanation
    enhancedDecision.explanation = await this.explanationEngine.explainDecision(enhancedDecision);

    return enhancedDecision;
  }

  // Market regime detection (Bull, Bear, Sideways, High Volatility)
  async detectMarketRegime(marketData) {
    const historicalData = await this.getHistoricalData(marketData.symbol, 30); // 30 days
    
    if (!historicalData || historicalData.length < 10) {
      return 'UNKNOWN';
    }

    const returns = this.calculateReturns(historicalData);
    const volatility = this.calculateVolatility(returns);
    const trend = this.calculateTrend(historicalData);
    
    // Regime classification logic
    if (volatility > 0.05) { // 5% daily volatility threshold
      return 'HIGH_VOLATILITY';
    } else if (trend > 0.02) { // 2% daily trend threshold
      return 'BULL_MARKET';
    } else if (trend < -0.02) {
      return 'BEAR_MARKET';
    } else {
      return 'SIDEWAYS_MARKET';
    }
  }

  // Performance tracking per market regime
  async trackAgentPerformance(agentId, decision, actualOutcome) {
    const performance = {
      agentId,
      marketRegime: decision.marketRegime,
      predictedAction: decision.recommendation,
      actualOutcome,
      confidence: decision.confidence,
      timestamp: new Date(),
      profitLoss: actualOutcome.profitLoss || 0
    };

    // Store in performance history
    if (!this.performanceHistory.has(agentId)) {
      this.performanceHistory.set(agentId, []);
    }
    
    this.performanceHistory.get(agentId).push(performance);

    // Update database
    await this.storePerformanceRecord(performance);

    // Update agent's regime-specific metrics
    await this.updateAgentRegimeMetrics(agentId, decision.marketRegime, performance);
  }

  // Dynamic agent weighting based on recent performance
  async calculateDynamicAgentWeights() {
    const agentWeights = new Map();
    
    for (const [agentId, agent] of this.agents) {
      const recentPerformance = await this.getRecentPerformance(agentId, 14); // Last 14 days
      
      if (recentPerformance.length === 0) {
        agentWeights.set(agentId, 1.0); // Default weight
        continue;
      }

      // Calculate performance metrics
      const winRate = recentPerformance.filter(p => p.profitLoss > 0).length / recentPerformance.length;
      const avgProfit = recentPerformance.reduce((sum, p) => sum + p.profitLoss, 0) / recentPerformance.length;
      const sharpeRatio = this.calculateSharpeRatio(recentPerformance.map(p => p.profitLoss));

      // Weight calculation (higher weight for better performing agents)
      const performanceScore = (winRate * 0.4) + (Math.min(sharpeRatio, 3) / 3 * 0.6);
      const weight = Math.max(0.1, Math.min(2.0, performanceScore));

      agentWeights.set(agentId, weight);
    }

    return agentWeights;
  }

  // Enhanced coordination with dynamic weighting
  async coordinateDecisionsEnhanced(masterAgent, decisions) {
    const agentWeights = await this.calculateDynamicAgentWeights();
    
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const decision of decisions) {
      const agentWeight = agentWeights.get(decision.agentId) || 1.0;
      const decisionWeight = decision.confidence * agentWeight;
      
      const score = this.getDecisionScore(decision.recommendation);
      totalWeightedScore += score * decisionWeight;
      totalWeight += decisionWeight;
    }

    const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    
    const enhancedDecision = {
      type: 'enhanced_coordinated_decision',
      score: finalScore,
      confidence: Math.min(0.95, 0.5 + Math.abs(finalScore) * 0.4),
      action: this.scoreToAction(finalScore),
      reasoning: `Enhanced coordination using ${decisions.length} agents with dynamic weighting`,
      timestamp: new Date(),
      agentDecisions: decisions,
      agentWeights: Object.fromEntries(agentWeights),
      enhancementMetadata: {
        totalWeight,
        weightedScore: totalWeightedScore,
        dynamicWeightingActive: true
      }
    };

    return enhancedDecision;
  }

  // Utility methods
  calculateReturns(historicalData) {
    const returns = [];
    for (let i = 1; i < historicalData.length; i++) {
      const currentPrice = historicalData[i].price;
      const previousPrice = historicalData[i-1].price;
      returns.push((currentPrice - previousPrice) / previousPrice);
    }
    return returns;
  }

  calculateVolatility(returns) {
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  calculateTrend(historicalData) {
    if (historicalData.length < 2) return 0;
    
    const firstPrice = historicalData[0].price;
    const lastPrice = historicalData[historicalData.length - 1].price;
    const days = historicalData.length - 1;
    
    return (lastPrice - firstPrice) / firstPrice / days; // Daily trend
  }

  calculateSharpeRatio(returns) {
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const std = this.calculateVolatility(returns);
    
    return std === 0 ? 0 : mean / std;
  }
}

// Explanation Engine for XAI (Explainable AI)
class ExplanationEngine {
  async explainDecision(decision) {
    const explanation = {
      summary: this.generateSummary(decision),
      reasoning_chain: this.buildReasoningChain(decision),
      confidence_breakdown: this.analyzeConfidence(decision),
      market_context: this.explainMarketContext(decision),
      risk_factors: this.identifyRiskFactors(decision),
      alternative_actions: this.suggestAlternatives(decision)
    };

    return explanation;
  }

  generateSummary(decision) {
    const action = decision.recommendation || decision.action;
    const confidence = Math.round(decision.confidence * 100);
    const regime = decision.marketRegime;

    return `Recommendation: ${action} with ${confidence}% confidence in ${regime} market conditions.`;
  }

  buildReasoningChain(decision) {
    return [
      `Market regime detected: ${decision.marketRegime}`,
      `Agent historical performance in this regime: ${decision.regimePerformance?.winRate || 'Unknown'}`,
      `Base confidence: ${Math.round((decision.enhancementMetadata?.originalConfidence || decision.confidence) * 100)}%`,
      `Regime adjustment: ${decision.enhancementMetadata?.regimeAdjustment > 0 ? '+' : ''}${Math.round((decision.enhancementMetadata?.regimeAdjustment || 0) * 100)}%`,
      `Final recommendation: ${decision.recommendation || decision.action}`
    ];
  }

  analyzeConfidence(decision) {
    return {
      overall: decision.confidence,
      factors: {
        base_model: decision.enhancementMetadata?.originalConfidence || decision.confidence,
        regime_adjustment: decision.enhancementMetadata?.regimeAdjustment || 0,
        historical_performance: decision.regimePerformance?.avgConfidence || 0.5
      }
    };
  }

  explainMarketContext(decision) {
    const regime = decision.marketRegime;
    const contexts = {
      'BULL_MARKET': 'Strong upward trend with positive momentum',
      'BEAR_MARKET': 'Significant downward pressure and negative sentiment',
      'SIDEWAYS_MARKET': 'Range-bound trading with low directional bias',
      'HIGH_VOLATILITY': 'Elevated price swings and increased uncertainty',
      'UNKNOWN': 'Insufficient data for regime classification'
    };

    return contexts[regime] || 'Market context unclear';
  }

  identifyRiskFactors(decision) {
    const risks = [];
    
    if (decision.confidence < 0.6) {
      risks.push('Low confidence level may indicate uncertain market conditions');
    }
    
    if (decision.marketRegime === 'HIGH_VOLATILITY') {
      risks.push('High volatility increases execution risk and potential slippage');
    }
    
    if (decision.enhancementMetadata?.regimeAdjustment < -0.1) {
      risks.push('Agent shows poor historical performance in current market regime');
    }

    return risks.length > 0 ? risks : ['No significant risk factors identified'];
  }

  suggestAlternatives(decision) {
    const alternatives = [];
    
    if (decision.recommendation === 'BUY') {
      alternatives.push({ action: 'HOLD', rationale: 'Wait for better entry point' });
      alternatives.push({ action: 'PARTIAL_BUY', rationale: 'Reduce position size due to uncertainty' });
    } else if (decision.recommendation === 'SELL') {
      alternatives.push({ action: 'HOLD', rationale: 'Market may recover' });
      alternatives.push({ action: 'PARTIAL_SELL', rationale: 'Take partial profits while maintaining exposure' });
    } else {
      alternatives.push({ action: 'MONITOR', rationale: 'Continue observation for clearer signals' });
    }

    return alternatives;
  }
}

module.exports = EnhancedAIAgentService;
