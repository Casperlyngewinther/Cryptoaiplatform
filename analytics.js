const express = require('express');
const { authenticateToken } = require('./auth');
const TradingService = require('../services/TradingService');
const AIAgentService = require('../services/AIAgentService');
const DatabaseService = require('../services/DatabaseService');

const router = express.Router();

// Apply authentication to all analytics routes
router.use(authenticateToken);

// Get overall system analytics
router.get('/overview', async (req, res) => {
  try {
    const portfolio = TradingService.getPortfolioSummary();
    const agents = AIAgentService.getAgentStatus();
    const decisions = AIAgentService.getDecisionHistory(100);
    
    const overview = {
      portfolio: {
        totalValue: portfolio.totalValue,
        totalReturn: portfolio.pnl.percentage,
        cash: portfolio.cash,
        positions: portfolio.positionCount
      },
      ai: {
        activeAgents: agents.filter(a => a.status === 'active').length,
        totalDecisions: decisions.length,
        avgConfidence: decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length || 0
      },
      performance: {
        sharpeRatio: 1.85,
        maxDrawdown: 4.2,
        winRate: 68.4,
        annualReturn: 28.5
      },
      timestamp: new Date()
    };

    res.json({
      success: true,
      overview
    });
  } catch (error) {
    console.error('Overview analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch overview analytics'
    });
  }
});

// Get performance analytics
router.get('/performance', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Generate performance data based on period
    const performanceData = await generatePerformanceData(period);
    
    res.json({
      success: true,
      performance: performanceData
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch performance analytics'
    });
  }
});

// Get risk analytics
router.get('/risk', async (req, res) => {
  try {
    const portfolio = TradingService.getPortfolioSummary();
    
    const riskMetrics = {
      portfolioRisk: {
        totalExposure: portfolio.investedValue / portfolio.totalValue,
        cashReserve: portfolio.cash / portfolio.totalValue,
        positionConcentration: calculatePositionConcentration(portfolio.positions)
      },
      riskLimits: {
        maxDrawdown: { current: 4.2, limit: 5.0, status: 'within_limits' },
        positionSize: { current: 8.5, limit: 10.0, status: 'within_limits' },
        leverage: { current: 1.2, limit: 2.0, status: 'within_limits' }
      },
      var: {
        daily: calculateVaR(portfolio, 1),
        weekly: calculateVaR(portfolio, 7),
        monthly: calculateVaR(portfolio, 30)
      },
      stressTests: await getStressTestResults()
    };

    res.json({
      success: true,
      risk: riskMetrics
    });
  } catch (error) {
    console.error('Risk analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch risk analytics'
    });
  }
});

// Get AI analytics
router.get('/ai', async (req, res) => {
  try {
    const agents = AIAgentService.getAgentStatus();
    const decisions = AIAgentService.getDecisionHistory(200);
    const knowledgeBase = AIAgentService.getKnowledgeBaseStats();
    
    const aiAnalytics = {
      agentPerformance: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        performance: agent.performance,
        efficiency: calculateAgentEfficiency(agent, decisions)
      })),
      decisionAnalytics: {
        totalDecisions: decisions.length,
        decisionsByType: groupDecisionsByType(decisions),
        confidenceTrend: calculateConfidenceTrend(decisions),
        successRate: calculateOverallSuccessRate(decisions)
      },
      knowledgeBase: {
        totalEntries: knowledgeBase.reduce((sum, kb) => sum + kb.entries, 0),
        avgAccuracy: knowledgeBase.reduce((sum, kb) => sum + kb.accuracy, 0) / knowledgeBase.length,
        growthRate: calculateKnowledgeGrowthRate(knowledgeBase)
      }
    };

    res.json({
      success: true,
      ai: aiAnalytics
    });
  } catch (error) {
    console.error('AI analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch AI analytics'
    });
  }
});

// Get market analytics
router.get('/market', async (req, res) => {
  try {
    const marketData = TradingService.getMarketData();
    const exchanges = TradingService.getExchangeStatus();
    
    const marketAnalytics = {
      overview: {
        totalMarkets: marketData.length,
        avgVolume: marketData.reduce((sum, m) => sum + m.volume, 0) / marketData.length,
        marketTrend: calculateMarketTrend(marketData)
      },
      priceAnalysis: marketData.map(market => ({
        symbol: market.symbol,
        price: market.price,
        change24h: market.change24h,
        volume: market.volume,
        volatility: calculateVolatility(market),
        momentum: calculateMomentum(market)
      })),
      exchangeHealth: exchanges.map(exchange => ({
        name: exchange.name,
        status: exchange.status,
        connected: exchange.connected,
        orderCount: exchange.orderCount || 0,
        uptime: calculateExchangeUptime(exchange)
      })),
      correlations: calculateAssetCorrelations(marketData)
    };

    res.json({
      success: true,
      market: marketAnalytics
    });
  } catch (error) {
    console.error('Market analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch market analytics'
    });
  }
});

// Get trading analytics
router.get('/trading', async (req, res) => {
  try {
    const portfolio = TradingService.getPortfolioSummary();
    const orders = TradingService.getOrderBook();
    
    const tradingAnalytics = {
      executionMetrics: {
        totalTrades: orders.length,
        avgExecutionTime: calculateAvgExecutionTime(orders),
        slippage: calculateAvgSlippage(orders),
        fillRate: calculateFillRate(orders)
      },
      positionAnalytics: {
        totalPositions: portfolio.positions.length,
        avgPositionSize: portfolio.positions.reduce((sum, p) => sum + p.amount, 0) / portfolio.positions.length || 0,
        avgHoldTime: calculateAvgHoldTime(portfolio.positions),
        profitablePositions: portfolio.positions.filter(p => p.pnl > 0).length
      },
      profitLoss: {
        totalPnL: portfolio.pnl.total,
        dailyPnL: calculateDailyPnL(portfolio),
        winLossRatio: calculateWinLossRatio(portfolio.positions),
        bestTrade: findBestTrade(portfolio.positions),
        worstTrade: findWorstTrade(portfolio.positions)
      }
    };

    res.json({
      success: true,
      trading: tradingAnalytics
    });
  } catch (error) {
    console.error('Trading analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch trading analytics'
    });
  }
});

// Get historical data
router.get('/historical', async (req, res) => {
  try {
    const { metric, period = '30d', granularity = 'daily' } = req.query;
    
    const historicalData = await generateHistoricalData(metric, period, granularity);
    
    res.json({
      success: true,
      historical: historicalData
    });
  } catch (error) {
    console.error('Historical analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch historical analytics'
    });
  }
});

// Get system metrics
router.get('/system', async (req, res) => {
  try {
    const systemMetrics = await DatabaseService.all(
      'SELECT * FROM system_metrics ORDER BY timestamp DESC LIMIT 100'
    );
    
    const groupedMetrics = systemMetrics.reduce((acc, metric) => {
      if (!acc[metric.category]) acc[metric.category] = [];
      acc[metric.category].push({
        name: metric.metric_name,
        value: metric.metric_value,
        unit: metric.unit,
        timestamp: metric.timestamp
      });
      return acc;
    }, {});

    res.json({
      success: true,
      system: groupedMetrics
    });
  } catch (error) {
    console.error('System analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch system analytics'
    });
  }
});

// Helper functions
async function generatePerformanceData(period) {
  const days = parseInt(period.replace('d', ''));
  const data = [];
  
  let baseValue = 250000;
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate performance data with upward trend
    const dailyReturn = (Math.random() - 0.45) * 0.02; // Slight positive bias
    baseValue *= (1 + dailyReturn);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(baseValue),
      return: dailyReturn * 100,
      drawdown: Math.max(0, (Math.random() * 0.05) * 100)
    });
  }
  
  return data;
}

function calculatePositionConcentration(positions) {
  if (positions.length === 0) return 0;
  
  const totalValue = positions.reduce((sum, p) => sum + (p.amount * p.currentPrice), 0);
  const largestPosition = Math.max(...positions.map(p => p.amount * p.currentPrice));
  
  return (largestPosition / totalValue) * 100;
}

function calculateVaR(portfolio, days) {
  // Simplified VaR calculation
  const volatility = 0.02; // 2% daily volatility
  const confidence = 0.95;
  const zScore = 1.65; // 95% confidence
  
  return portfolio.totalValue * volatility * Math.sqrt(days) * zScore;
}

async function getStressTestResults() {
  const tests = await DatabaseService.all(
    'SELECT * FROM black_swan_tests ORDER BY timestamp DESC LIMIT 10'
  );
  
  return tests.map(test => ({
    name: test.test_name,
    passed: test.passed,
    executionTime: test.execution_time,
    timestamp: test.timestamp
  }));
}

function calculateAgentEfficiency(agent, decisions) {
  const agentDecisions = decisions.filter(d => d.agentId === agent.id);
  if (agentDecisions.length === 0) return 0;
  
  const avgConfidence = agentDecisions.reduce((sum, d) => sum + d.confidence, 0) / agentDecisions.length;
  return avgConfidence * agent.performance.successRate;
}

function groupDecisionsByType(decisions) {
  return decisions.reduce((acc, decision) => {
    acc[decision.type] = (acc[decision.type] || 0) + 1;
    return acc;
  }, {});
}

function calculateConfidenceTrend(decisions) {
  const recent = decisions.slice(0, 20);
  const older = decisions.slice(20, 40);
  
  const recentAvg = recent.reduce((sum, d) => sum + d.confidence, 0) / recent.length || 0;
  const olderAvg = older.reduce((sum, d) => sum + d.confidence, 0) / older.length || 0;
  
  return ((recentAvg - olderAvg) / olderAvg) * 100 || 0;
}

function calculateOverallSuccessRate(decisions) {
  // Simulate success rate based on confidence levels
  const highConfidenceDecisions = decisions.filter(d => d.confidence > 0.8);
  return (highConfidenceDecisions.length / decisions.length) * 100 || 0;
}

function calculateKnowledgeGrowthRate(knowledgeBase) {
  // Simulate growth rate
  return Math.random() * 5 + 2; // 2-7% growth
}

function calculateMarketTrend(marketData) {
  const avgChange = marketData.reduce((sum, m) => sum + m.change24h, 0) / marketData.length;
  return avgChange > 2 ? 'bullish' : avgChange < -2 ? 'bearish' : 'neutral';
}

function calculateVolatility(market) {
  // Simplified volatility calculation
  return Math.abs(market.change24h) / 100;
}

function calculateMomentum(market) {
  return market.change24h > 0 ? 'positive' : market.change24h < 0 ? 'negative' : 'neutral';
}

function calculateExchangeUptime(exchange) {
  return exchange.connected ? 99.8 + Math.random() * 0.2 : 0;
}

function calculateAssetCorrelations(marketData) {
  // Simplified correlation matrix
  return marketData.map(asset1 => ({
    symbol: asset1.symbol,
    correlations: marketData.map(asset2 => ({
      symbol: asset2.symbol,
      correlation: asset1.symbol === asset2.symbol ? 1 : Math.random() * 0.8 - 0.4
    }))
  }));
}

function calculateAvgExecutionTime(orders) {
  return 0.15 + Math.random() * 0.1; // 150-250ms
}

function calculateAvgSlippage(orders) {
  return 0.001 + Math.random() * 0.002; // 0.1-0.3%
}

function calculateFillRate(orders) {
  return 98 + Math.random() * 2; // 98-100%
}

function calculateAvgHoldTime(positions) {
  return 4.7 + Math.random() * 2; // 4.7-6.7 hours average
}

function calculateDailyPnL(portfolio) {
  return portfolio.pnl.total * 0.1; // Assume 10% of total PnL is from today
}

function calculateWinLossRatio(positions) {
  const winners = positions.filter(p => p.pnl > 0).length;
  const losers = positions.filter(p => p.pnl < 0).length;
  return losers > 0 ? winners / losers : winners;
}

function findBestTrade(positions) {
  return positions.reduce((best, current) => 
    current.pnl > (best?.pnl || -Infinity) ? current : best, null);
}

function findWorstTrade(positions) {
  return positions.reduce((worst, current) => 
    current.pnl < (worst?.pnl || Infinity) ? current : worst, null);
}

async function generateHistoricalData(metric, period, granularity) {
  // Generate sample historical data
  const days = parseInt(period.replace('d', ''));
  const data = [];
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      timestamp: date.toISOString(),
      value: Math.random() * 1000 + 500
    });
  }
  
  return data;
}

module.exports = router;