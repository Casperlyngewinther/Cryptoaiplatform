/**
 * OllamaMockService - Mock implementation for testing when Ollama is unavailable
 * Provides fallback responses for AI functionality
 */

class OllamaMockService {
  constructor() {
    this.isRunning = false;
    this.models = ['llama3.1:8b', 'mistral:7b', 'codellama:7b'];
    this.responses = this.initializeMockResponses();
  }

  async start() {
    console.log('🤖 Starting Ollama Mock Service...');
    this.isRunning = true;
    return true;
  }

  async stop() {
    this.isRunning = false;
    return true;
  }

  async checkHealth() {
    return {
      status: this.isRunning ? 'running' : 'stopped',
      models: this.models
    };
  }

  async generateCompletion(prompt, model = 'llama3.1:8b') {
    if (!this.isRunning) {
      throw new Error('Mock service not running');
    }

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Return appropriate mock response based on prompt content
    if (prompt.toLowerCase().includes('feature')) {
      return this.responses.featureGeneration;
    } else if (prompt.toLowerCase().includes('reward')) {
      return this.responses.rewardSynthesis;
    } else if (prompt.toLowerCase().includes('explain')) {
      return this.responses.explanation;
    } else if (prompt.toLowerCase().includes('pattern')) {
      return this.responses.patternDiscovery;
    } else if (prompt.toLowerCase().includes('risk')) {
      return this.responses.riskNarrative;
    } else if (prompt.toLowerCase().includes('code')) {
      return this.responses.codeGeneration;
    } else if (prompt.toLowerCase().includes('market')) {
      return this.responses.marketAnalysis;
    }

    return this.responses.generic;
  }

  initializeMockResponses() {
    return {
      featureGeneration: `[
        {
          "name": "volume_momentum_ratio",
          "method": "Calculate volume_change / price_change ratio over 24h",
          "expected_value": "High predictive value for breakouts",
          "difficulty": 2
        },
        {
          "name": "cross_exchange_spread",
          "method": "Price difference between major exchanges",
          "expected_value": "Arbitrage opportunity indicator",
          "difficulty": 3
        },
        {
          "name": "social_sentiment_velocity",
          "method": "Rate of change in social media sentiment",
          "expected_value": "Early trend reversal signal",
          "difficulty": 4
        }
      ]`,

      rewardSynthesis: `def adaptive_reward_function(returns, drawdown, sharpe_ratio, volatility):
    """
    Enhanced reward function with adaptive components
    """
    # Base reward from returns
    base_reward = returns * 100
    
    # Penalize maximum drawdown heavily
    drawdown_penalty = -abs(drawdown) * 200
    
    # Reward high Sharpe ratio
    sharpe_bonus = max(0, sharpe_ratio - 1) * 50
    
    # Volatility adjustment - prefer moderate volatility
    vol_penalty = -abs(volatility - 0.02) * 100
    
    # Combine components with adaptive weighting
    total_reward = base_reward + drawdown_penalty + sharpe_bonus + vol_penalty
    
    # Apply sigmoid scaling to prevent extreme values
    return np.tanh(total_reward / 100) * 100`,

      explanation: `SUMMARY: Based on current market analysis, recommendation is to HOLD with 75% confidence due to mixed signals in sideways market conditions.

REASONING: The decision is based on multiple factors including technical indicators showing neutral momentum, volume analysis indicating reduced participation, and current market regime classification as sideways with low directional bias.

RISK_ASSESSMENT: Moderate risk level with primary concerns being potential false breakouts and low liquidity during current market hours. Position sizing should be conservative.

MARKET_CONTEXT: Market is currently range-bound between key support and resistance levels. No clear trend direction established, suggesting patience is warranted.

ALTERNATIVES: Could consider small position entry with tight stops, or wait for clearer directional signal above/below key levels.

CONFIDENCE: 7.5/10 - Decision supported by multiple indicators but market uncertainty limits conviction.`,

      patternDiscovery: `1. **Volatility Squeeze Pattern**: Market shows recurring periods of low volatility followed by explosive moves. Best performance in 65% of cases when combined with volume expansion.

2. **Cross-Exchange Arbitrage Opportunities**: Price differences between major exchanges create profit windows lasting 15-45 seconds. Success rate: 78% with proper execution.

3. **News-Momentum Correlation**: Strong positive correlation (0.73) between major news releases and price movements within 30 minutes. Risk factor: fake news and market manipulation.

4. **Weekend Effect**: Systematic lower volatility on weekends with trend continuations on Monday open. Implementation complexity: Medium, requires 24/7 monitoring.`,

      riskNarrative: `Current portfolio risk assessment indicates MODERATE exposure with several key factors requiring attention:

**Primary Risk Factors:**
- Portfolio concentration in top 3 positions (68% of total value)
- Increased correlation between major holdings during market stress
- Leverage ratio approaching upper management limits

**Market-Specific Risks:**
- High volatility environment increases execution risk
- Liquidity concerns in smaller cap positions
- Regulatory uncertainty in emerging markets segment

**Recommendations:**
1. Reduce position concentration through strategic rebalancing
2. Implement additional hedging for correlated positions
3. Monitor leverage ratios closely and consider reduction
4. Increase cash reserves for upcoming market volatility`,

      codeGeneration: `def momentum_strategy(price_data, volume_data, lookback=14):
    """
    Momentum trading strategy with volume confirmation
    """
    import numpy as np
    import pandas as pd
    
    # Calculate momentum indicators
    returns = price_data.pct_change(lookback)
    volume_sma = volume_data.rolling(lookback).mean()
    volume_ratio = volume_data / volume_sma
    
    # Generate signals
    momentum_signal = np.where(returns > 0.05, 1, 
                              np.where(returns < -0.05, -1, 0))
    
    # Volume confirmation
    volume_confirmed = np.where(volume_ratio > 1.2, True, False)
    
    # Final signal
    final_signal = np.where(volume_confirmed, momentum_signal, 0)
    
    return {
        'signal': final_signal,
        'momentum': returns,
        'volume_ratio': volume_ratio,
        'confidence': np.abs(returns) * volume_ratio
    }`,

      marketAnalysis: `**Current Market Regime**: SIDEWAYS_MARKET with elevated volatility

**Key Market Drivers:**
- Central bank policy uncertainty driving defensive positioning
- Institutional rotation from growth to value sectors
- Geopolitical tensions affecting risk sentiment
- Technical levels providing strong support/resistance

**Sentiment Analysis**: NEUTRAL with slight bearish bias. Institutional flows show risk-off behavior while retail sentiment remains optimistic.

**Short-term Outlook**: Range-bound trading expected with potential breakout catalyst from upcoming economic data releases. Key levels: Support at $42,150, Resistance at $45,800.

**Medium-term Outlook**: Structural trends favor continued volatility with potential trend establishment after policy clarity emerges.`,

      generic: `Mock response generated successfully. This is a fallback response when the specific prompt type cannot be determined. The system is functioning correctly in mock mode.`
    };
  }
}

module.exports = OllamaMockService;