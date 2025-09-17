/**
 * QuantitativeEngine - V2.0 Mathematical Foundation
 * Implements the complete mathematical core from the blueprint:
 * - Net Return calculations with transaction costs
 * - Risk-adjusted Sharpe Ratio
 * - Kelly Criterion position sizing
 * - CVaR (Conditional Value at Risk)
 */

class QuantitativeEngine {
  constructor() {
    this.transactionCosts = {
      makerFee: 0.001,    // 0.1% maker fee
      takerFee: 0.002,    // 0.2% taker fee
      slippageModel: 'linear'
    };
    
    this.riskFreeRate = 0.02; // 2% annual risk-free rate
    this.kellyFraction = 0.5; // Fractional Kelly (50% safety margin)
  }

  /**
   * Nettoafkast (Net Return) - Core Formula from Blueprint
   * R_net = R_gross - C_tx
   * 
   * @param {number} grossReturn - The gross return from the trade
   * @param {number} volume - Trading volume
   * @param {string} orderType - 'market' or 'limit'
   * @returns {number} Net return after all transaction costs
   */
  calculateNetReturn(grossReturn, volume, orderType = 'market') {
    const transactionCosts = this.calculateTransactionCosts(volume, orderType);
    const netReturn = grossReturn - transactionCosts;
    
    return {
      grossReturn,
      transactionCosts,
      netReturn,
      costRatio: transactionCosts / Math.abs(grossReturn),
      timestamp: new Date()
    };
  }

  /**
   * Transaction Costs (C_tx) - Complete friction model
   * C_tx = C_fees + C_slippage + C_spread
   */
  calculateTransactionCosts(volume, orderType = 'market') {
    // Fee calculation
    const feeRate = orderType === 'market' ? this.transactionCosts.takerFee : this.transactionCosts.makerFee;
    const fees = volume * feeRate;

    // Slippage calculation (linear model: more volume = more slippage)
    const slippage = this.calculateSlippage(volume);

    // Spread cost (bid-ask spread impact)
    const spreadCost = this.calculateSpreadCost(volume);

    return {
      fees,
      slippage,
      spreadCost,
      total: fees + slippage + spreadCost
    };
  }

  /**
   * Slippage Model - Advanced friction calculation
   */
  calculateSlippage(volume) {
    // Simple linear model: 1 bps per $10k volume
    const baseSlippage = 0.0001; // 1 basis point
    const volumeImpact = volume / 10000; // Per $10k
    return baseSlippage * volumeImpact;
  }

  calculateSpreadCost(volume) {
    // Typical spread for crypto: 0.05-0.1%
    const averageSpread = 0.0005; // 5 bps
    return volume * averageSpread / 2; // Half spread cost
  }

  /**
   * Risk-Adjusted Sharpe Ratio (Sharpe_net) - Blueprint Formula
   * Sharpe_net = (R̄_net - R_f) / σ_net
   */
  calculateRiskAdjustedSharpe(returns) {
    if (returns.length < 2) return 0;

    // Calculate net returns (subtract transaction costs from each return)
    const netReturns = returns.map(r => {
      const costs = this.calculateTransactionCosts(Math.abs(r) * 10000); // Assume $10k base
      return r - costs.total;
    });

    const meanReturn = this.calculateMean(netReturns);
    const volatility = this.calculateVolatility(netReturns);
    const excessReturn = meanReturn - (this.riskFreeRate / 252); // Daily risk-free rate

    return volatility === 0 ? 0 : excessReturn / volatility;
  }

  /**
   * Kelly Criterion Position Sizing - Blueprint Formula
   * f* = (bp(b+1) - 1) / b
   * Using Fractional Kelly for safety
   */
  calculateKellyPosition(winRate, avgWin, avgLoss, currentCapital) {
    if (avgLoss === 0 || winRate <= 0 || winRate >= 1) return 0;

    const p = winRate; // Probability of winning
    const b = avgWin / avgLoss; // Win/loss ratio
    const q = 1 - p; // Probability of losing

    // Kelly Criterion formula
    const kellyFraction = (b * p - q) / b;
    
    // Apply safety margin (Fractional Kelly)
    const safeKellyFraction = Math.max(0, Math.min(0.25, kellyFraction * this.kellyFraction));
    
    const optimalPosition = currentCapital * safeKellyFraction;

    return {
      kellyFraction: kellyFraction,
      safeKellyFraction: safeKellyFraction,
      optimalPosition: optimalPosition,
      recommendation: this.getKellyRecommendation(safeKellyFraction),
      metadata: {
        winRate: p,
        winLossRatio: b,
        riskOfRuin: this.calculateRiskOfRuin(kellyFraction),
        timestamp: new Date()
      }
    };
  }

  /**
   * Conditional Value at Risk (CVaR) - Advanced tail risk measure
   * CVaR quantifies the expected loss in worst-case scenarios
   */
  calculateCVaR(returns, confidenceLevel = 0.95) {
    if (returns.length === 0) return 0;

    const sortedReturns = [...returns].sort((a, b) => a - b);
    const varIndex = Math.floor((1 - confidenceLevel) * returns.length);
    
    if (varIndex === 0) return sortedReturns[0];

    // Calculate average of tail losses
    const tailLosses = sortedReturns.slice(0, varIndex);
    const cvar = tailLosses.reduce((sum, loss) => sum + loss, 0) / tailLosses.length;

    return {
      cvar: cvar,
      var: sortedReturns[varIndex], // Value at Risk
      confidenceLevel: confidenceLevel,
      tailLosses: tailLosses.length,
      worstCase: sortedReturns[0],
      riskMetrics: this.calculateRiskMetrics(returns)
    };
  }

  /**
   * Maximum Drawdown - Critical risk metric
   */
  calculateMaxDrawdown(cumulativeReturns) {
    let maxDrawdown = 0;
    let peak = cumulativeReturns[0] || 0;
    let peakDate = 0;
    let troughDate = 0;

    for (let i = 1; i < cumulativeReturns.length; i++) {
      if (cumulativeReturns[i] > peak) {
        peak = cumulativeReturns[i];
        peakDate = i;
      }

      const drawdown = (peak - cumulativeReturns[i]) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        troughDate = i;
      }
    }

    return {
      maxDrawdown: maxDrawdown,
      maxDrawdownPercent: maxDrawdown * 100,
      peakDate: peakDate,
      troughDate: troughDate,
      recoveryTime: cumulativeReturns.length - troughDate
    };
  }

  /**
   * Comprehensive Performance Analysis
   */
  analyzePerformance(trades) {
    const returns = trades.map(trade => trade.return || 0);
    const volumes = trades.map(trade => trade.volume || 0);
    
    // Net returns after transaction costs
    const netReturns = returns.map((ret, i) => {
      const costs = this.calculateTransactionCosts(volumes[i]);
      return ret - costs.total;
    });

    const cumulativeReturns = this.calculateCumulativeReturns(netReturns);
    
    return {
      // Core metrics
      totalTrades: trades.length,
      winRate: this.calculateWinRate(netReturns),
      avgWin: this.calculateAverageWin(netReturns),
      avgLoss: this.calculateAverageLoss(netReturns),
      
      // Risk-adjusted metrics
      sharpeRatio: this.calculateRiskAdjustedSharpe(returns),
      netSharpeRatio: this.calculateRiskAdjustedSharpe(netReturns),
      
      // Risk metrics
      cvar: this.calculateCVaR(netReturns),
      maxDrawdown: this.calculateMaxDrawdown(cumulativeReturns),
      
      // Position sizing
      kellyRecommendation: this.calculateKellyPosition(
        this.calculateWinRate(netReturns),
        this.calculateAverageWin(netReturns),
        Math.abs(this.calculateAverageLoss(netReturns)),
        100000 // Assume $100k capital
      ),
      
      // Transaction cost analysis
      totalTransactionCosts: volumes.reduce((sum, vol) => 
        sum + this.calculateTransactionCosts(vol).total, 0),
      
      timestamp: new Date()
    };
  }

  // Utility methods
  calculateMean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateVolatility(values) {
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  calculateWinRate(returns) {
    const wins = returns.filter(r => r > 0).length;
    return returns.length > 0 ? wins / returns.length : 0;
  }

  calculateAverageWin(returns) {
    const wins = returns.filter(r => r > 0);
    return wins.length > 0 ? this.calculateMean(wins) : 0;
  }

  calculateAverageLoss(returns) {
    const losses = returns.filter(r => r < 0);
    return losses.length > 0 ? this.calculateMean(losses) : 0;
  }

  calculateCumulativeReturns(returns) {
    const cumulative = [0];
    for (let i = 0; i < returns.length; i++) {
      cumulative.push(cumulative[cumulative.length - 1] + returns[i]);
    }
    return cumulative;
  }

  calculateRiskOfRuin(kellyFraction) {
    // Simplified risk of ruin calculation
    if (kellyFraction <= 0) return 1;
    if (kellyFraction >= 1) return 0.5;
    
    // Approximate formula for risk of ruin
    return Math.pow(0.1, kellyFraction * 10);
  }

  getKellyRecommendation(kellyFraction) {
    if (kellyFraction <= 0) return 'NO_TRADE';
    if (kellyFraction < 0.05) return 'VERY_SMALL';
    if (kellyFraction < 0.1) return 'SMALL';
    if (kellyFraction < 0.15) return 'MODERATE';
    if (kellyFraction < 0.2) return 'LARGE';
    return 'VERY_LARGE';
  }

  calculateRiskMetrics(returns) {
    return {
      volatility: this.calculateVolatility(returns),
      skewness: this.calculateSkewness(returns),
      kurtosis: this.calculateKurtosis(returns),
      downside_deviation: this.calculateDownsideDeviation(returns)
    };
  }

  calculateSkewness(returns) {
    const mean = this.calculateMean(returns);
    const n = returns.length;
    const variance = this.calculateVolatility(returns) ** 2;
    
    const skewness = returns.reduce((sum, val) => sum + Math.pow(val - mean, 3), 0);
    return skewness / (n * Math.pow(variance, 1.5));
  }

  calculateKurtosis(returns) {
    const mean = this.calculateMean(returns);
    const n = returns.length;
    const variance = this.calculateVolatility(returns) ** 2;
    
    const kurtosis = returns.reduce((sum, val) => sum + Math.pow(val - mean, 4), 0);
    return kurtosis / (n * variance * variance) - 3; // Excess kurtosis
  }

  calculateDownsideDeviation(returns) {
    const downsideReturns = returns.filter(r => r < 0);
    return downsideReturns.length > 0 ? this.calculateVolatility(downsideReturns) : 0;
  }

  // Real-time metrics calculation
  calculateRealTimeMetrics(portfolio) {
    return {
      currentValue: portfolio.totalValue,
      dayPnL: portfolio.dayPnL,
      totalPnL: portfolio.totalPnL,
      unrealizedPnL: portfolio.unrealizedPnL,
      realizedPnL: portfolio.realizedPnL,
      
      // Risk metrics
      currentDrawdown: portfolio.currentDrawdown,
      riskExposure: portfolio.riskExposure,
      leverageRatio: portfolio.leverageRatio,
      
      // Performance metrics
      dailySharpe: this.calculateDailySharpe(portfolio.dailyReturns),
      winRateToday: this.calculateWinRate(portfolio.todaysTrades),
      
      timestamp: new Date()
    };
  }

  calculateDailySharpe(dailyReturns) {
    if (dailyReturns.length < 2) return 0;
    
    const meanReturn = this.calculateMean(dailyReturns);
    const volatility = this.calculateVolatility(dailyReturns);
    const dailyRiskFree = this.riskFreeRate / 252;
    
    return volatility === 0 ? 0 : (meanReturn - dailyRiskFree) / volatility;
  }
}

module.exports = QuantitativeEngine;
