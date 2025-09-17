const express = require('express');
const { authenticateToken } = require('./auth');
const AIAgentService = require('../services/AIAgentService');
const SecurityService = require('../services/SecurityService');

const router = express.Router();

// Apply authentication to all AI routes
router.use(authenticateToken);

// Get AI agent status
router.get('/agents', async (req, res) => {
  try {
    const agents = AIAgentService.getAgentStatus();
    
    res.json({
      success: true,
      agents
    });
  } catch (error) {
    console.error('Agent status fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch agent status'
    });
  }
});

// Get specific agent details
router.get('/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const agents = AIAgentService.getAgentStatus();
    const agent = agents.find(a => a.id === parseInt(agentId));
    
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found'
      });
    }

    // Get recent decisions for this agent
    const decisions = AIAgentService.getDecisionHistory().filter(
      d => d.agentId === parseInt(agentId)
    );

    res.json({
      success: true,
      agent,
      recentDecisions: decisions.slice(0, 10)
    });
  } catch (error) {
    console.error('Agent details fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch agent details'
    });
  }
});

// Get AI decision history
router.get('/decisions', async (req, res) => {
  try {
    const { limit = 50, agentId, type } = req.query;
    
    let decisions = AIAgentService.getDecisionHistory(parseInt(limit));
    
    // Filter by agent ID if specified
    if (agentId) {
      decisions = decisions.filter(d => d.agentId === parseInt(agentId));
    }
    
    // Filter by decision type if specified
    if (type) {
      decisions = decisions.filter(d => d.type === type);
    }

    res.json({
      success: true,
      decisions,
      total: decisions.length
    });
  } catch (error) {
    console.error('Decision history fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch decision history'
    });
  }
});

// Explain a specific AI decision (XAI functionality)
router.get('/decisions/:decisionId/explain', async (req, res) => {
  try {
    const { decisionId } = req.params;
    
    const explanation = await AIAgentService.explainDecision(parseInt(decisionId));
    
    if (!explanation) {
      return res.status(404).json({
        error: 'Decision not found'
      });
    }

    res.json({
      success: true,
      explanation
    });
  } catch (error) {
    console.error('Decision explanation error:', error);
    res.status(500).json({
      error: 'Failed to explain decision'
    });
  }
});

// Get knowledge base statistics
router.get('/knowledge-base', async (req, res) => {
  try {
    const stats = AIAgentService.getKnowledgeBaseStats();
    
    res.json({
      success: true,
      knowledgeBase: stats
    });
  } catch (error) {
    console.error('Knowledge base fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch knowledge base stats'
    });
  }
});

// Get AI performance metrics
router.get('/performance', async (req, res) => {
  try {
    const agents = AIAgentService.getAgentStatus();
    const decisions = AIAgentService.getDecisionHistory(100);
    
    // Calculate performance metrics
    const totalDecisions = decisions.length;
    const avgConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / totalDecisions;
    const recentDecisions = decisions.slice(0, 10);
    const recentAvgConfidence = recentDecisions.reduce((sum, d) => sum + d.confidence, 0) / recentDecisions.length;
    
    const performance = {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      totalDecisions,
      avgConfidence: avgConfidence || 0,
      recentAvgConfidence: recentAvgConfidence || 0,
      agentPerformance: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        decisions: agent.performance.decisions,
        successRate: agent.performance.successRate,
        avgConfidence: agent.performance.avgConfidence
      }))
    };

    res.json({
      success: true,
      performance
    });
  } catch (error) {
    console.error('AI performance fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch AI performance'
    });
  }
});

// Manual trigger for AI decision cycle (admin only)
router.post('/trigger-decision-cycle', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin role required'
      });
    }

    await SecurityService.logSecurityEvent(
      'manual_decision_cycle',
      'medium',
      'Manual AI decision cycle triggered',
      req.user.userId,
      req.ip
    );

    // Trigger decision cycle
    await AIAgentService.runDecisionCycle();
    
    res.json({
      success: true,
      message: 'Decision cycle triggered successfully'
    });
  } catch (error) {
    console.error('Manual decision cycle error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger decision cycle'
    });
  }
});

// Get AI system health
router.get('/health', async (req, res) => {
  try {
    const isHealthy = AIAgentService.isHealthy();
    const agents = AIAgentService.getAgentStatus();
    const knowledgeBase = AIAgentService.getKnowledgeBaseStats();
    
    const health = {
      overall: isHealthy,
      agents: {
        total: agents.length,
        active: agents.filter(a => a.status === 'active').length,
        inactive: agents.filter(a => a.status !== 'active').length
      },
      knowledgeBase: {
        totalEntries: knowledgeBase.reduce((sum, kb) => sum + kb.entries, 0),
        categories: knowledgeBase.length,
        avgAccuracy: knowledgeBase.reduce((sum, kb) => sum + kb.accuracy, 0) / knowledgeBase.length
      },
      timestamp: new Date()
    };

    res.json({
      success: true,
      health
    });
  } catch (error) {
    console.error('AI health check error:', error);
    res.status(500).json({
      error: 'Failed to check AI health'
    });
  }
});

// Get decision types and their explanations
router.get('/decision-types', async (req, res) => {
  try {
    const decisionTypes = [
      {
        type: 'market_analysis',
        agent: 'Market Analysis Agent',
        description: 'Analysis of market trends, technical indicators, and price movements',
        confidence_factors: ['Technical indicators', 'Volume analysis', 'Market sentiment']
      },
      {
        type: 'risk_assessment',
        agent: 'Risk Management Agent',
        description: 'Evaluation of portfolio risk and position sizing recommendations',
        confidence_factors: ['Portfolio exposure', 'Volatility analysis', 'Correlation risk']
      },
      {
        type: 'trade_execution',
        agent: 'Execution Agent',
        description: 'Optimal timing and execution strategy for trades',
        confidence_factors: ['Liquidity analysis', 'Slippage estimation', 'Market timing']
      },
      {
        type: 'decision_verification',
        agent: 'Verification Agent',
        description: 'Validation of trading decisions against risk parameters',
        confidence_factors: ['Compliance checks', 'Risk limits', 'Balance verification']
      },
      {
        type: 'pattern_learning',
        agent: 'Learning Agent',
        description: 'Continuous learning from market patterns and outcomes',
        confidence_factors: ['Historical accuracy', 'Pattern recognition', 'Model performance']
      }
    ];

    res.json({
      success: true,
      decisionTypes
    });
  } catch (error) {
    console.error('Decision types fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch decision types'
    });
  }
});

// Update agent configuration (admin only)
router.put('/agents/:agentId/config', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin role required'
      });
    }

    const { agentId } = req.params;
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        error: 'Configuration is required'
      });
    }

    // Update agent configuration in database
    await DatabaseService.run(
      'UPDATE ai_agents SET config = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(config), new Date().toISOString(), agentId]
    );

    await SecurityService.logSecurityEvent(
      'agent_config_updated',
      'medium',
      `Agent ${agentId} configuration updated`,
      req.user.userId,
      req.ip
    );

    res.json({
      success: true,
      message: 'Agent configuration updated successfully'
    });
  } catch (error) {
    console.error('Agent config update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update agent configuration'
    });
  }
});

// Get AI learning progress
router.get('/learning-progress', async (req, res) => {
  try {
    const decisions = AIAgentService.getDecisionHistory(200);
    const knowledgeBase = AIAgentService.getKnowledgeBaseStats();
    
    // Calculate learning metrics
    const learningProgress = {
      totalLearningEvents: decisions.length,
      knowledgeGrowth: knowledgeBase.reduce((sum, kb) => sum + kb.entries, 0),
      avgAccuracy: knowledgeBase.reduce((sum, kb) => sum + kb.accuracy, 0) / knowledgeBase.length,
      recentImprovement: {
        last30Days: Math.random() * 5 + 2, // Simulate 2-7% improvement
        last7Days: Math.random() * 2 + 1    // Simulate 1-3% improvement
      },
      categories: knowledgeBase.map(kb => ({
        category: kb.category,
        entries: kb.entries,
        accuracy: kb.accuracy,
        lastUpdated: kb.lastUpdated
      }))
    };

    res.json({
      success: true,
      learningProgress
    });
  } catch (error) {
    console.error('Learning progress fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch learning progress'
    });
  }
});

module.exports = router;