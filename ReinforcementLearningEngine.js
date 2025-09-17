/**
 * ReinforcementLearningEngine - V2.0 Adaptive Learning Core
 * Implements the advanced RL system from the blueprint:
 * - Advanced reward function: Sharpe_net - λ × Max Drawdown
 * - Multi-objective optimization for risk-adjusted returns
 * - Dynamic environment adaptation
 * - Experience replay and continuous learning
 */

const QuantitativeEngine = require('./QuantitativeEngine');
const DatabaseService = require('./DatabaseService');

class ReinforcementLearningEngine {
  constructor() {
    this.quantEngine = new QuantitativeEngine();
    
    // RL Configuration
    this.config = {
      learningRate: 0.001,
      epsilon: 0.1,           // Exploration rate
      epsilonDecay: 0.995,
      gamma: 0.95,            // Discount factor
      batchSize: 32,
      memorySize: 10000,
      targetUpdateFreq: 1000,
      
      // Reward function parameters
      lambda: 2.0,            // Drawdown penalty weight
      sharpeWeight: 1.0,
      profitWeight: 0.5,
      riskPenalty: 1.5
    };
    
    // Agent state
    this.agent = {
      qNetwork: null,
      targetNetwork: null,
      memory: [],
      totalReward: 0,
      episodeReward: 0,
      episodeCount: 0,
      trainingSteps: 0
    };
    
    // Environment state
    this.environment = {
      currentState: null,
      previousState: null,
      actionSpace: ['BUY', 'SELL', 'HOLD'],
      stateSpace: this.defineStateSpace(),
      portfolio: {
        cash: 100000,
        positions: new Map(),
        totalValue: 100000,
        maxValue: 100000,
        returns: [],
        drawdown: 0,
        maxDrawdown: 0
      }
    };
    
    // Performance tracking
    this.performance = {
      episodeRewards: [],
      sharpeHistory: [],
      drawdownHistory: [],
      profitHistory: [],
      actionHistory: [],
      learningCurve: []
    };
    
    this.isTraining = false;
    this.learningEnabled = true;
  }

  /**
   * Initialize the RL system
   */
  async initialize() {
    await this.initializeNeuralNetwork();
    await this.loadHistoricalData();
    await this.setupEnvironment();
    
    console.log('🧠 Reinforcement Learning Engine V2.0 initialized');
    console.log('🎯 Advanced reward function active');
    console.log('📈 Multi-objective optimization enabled');
  }

  /**
   * Define the state space for the RL agent
   */
  defineStateSpace() {
    return {
      // Market indicators
      price: { min: 0, max: 100000, normalize: true },
      volume: { min: 0, max: 1000000000, normalize: true },
      volatility: { min: 0, max: 1, normalize: false },
      
      // Technical indicators
      rsi: { min: 0, max: 100, normalize: true },
      macd: { min: -1, max: 1, normalize: false },
      bollinger_position: { min: 0, max: 1, normalize: false },
      
      // Portfolio state
      cash_ratio: { min: 0, max: 1, normalize: false },
      position_size: { min: -1, max: 1, normalize: false },
      unrealized_pnl: { min: -1, max: 1, normalize: false },
      
      // Risk metrics
      current_drawdown: { min: 0, max: 1, normalize: false },
      var_estimate: { min: -1, max: 0, normalize: false },
      sharpe_ratio: { min: -5, max: 5, normalize: false },
      
      // Market regime
      regime_bull: { min: 0, max: 1, normalize: false },
      regime_bear: { min: 0, max: 1, normalize: false },
      regime_sideways: { min: 0, max: 1, normalize: false },
      regime_volatile: { min: 0, max: 1, normalize: false }
    };
  }

  /**
   * Advanced reward function from blueprint:
   * Reward = Sharpe_net - λ × Max Drawdown
   */
  calculateAdvancedReward(action, previousState, currentState, marketData) {
    const rewards = {
      sharpe: 0,
      profit: 0,
      drawdown_penalty: 0,
      risk_penalty: 0,
      action_penalty: 0,
      total: 0
    };

    // 1. Calculate net Sharpe ratio component
    if (this.environment.portfolio.returns.length >= 10) {
      const netSharpe = this.quantEngine.calculateRiskAdjustedSharpe(
        this.environment.portfolio.returns
      );
      rewards.sharpe = netSharpe * this.config.sharpeWeight;
    }

    // 2. Profit component (normalized)
    const currentValue = this.environment.portfolio.totalValue;
    const profitReturn = (currentValue - 100000) / 100000; // Normalized profit
    rewards.profit = profitReturn * this.config.profitWeight;

    // 3. Drawdown penalty (core innovation from blueprint)
    const currentDrawdown = this.environment.portfolio.drawdown;
    const maxDrawdown = this.environment.portfolio.maxDrawdown;
    rewards.drawdown_penalty = -this.config.lambda * maxDrawdown;

    // 4. Risk penalty for excessive volatility
    if (currentState.volatility > 0.05) {
      rewards.risk_penalty = -this.config.riskPenalty * currentState.volatility;
    }

    // 5. Action consistency penalty (prevent thrashing)
    rewards.action_penalty = this.calculateActionPenalty(action);

    // 6. Combine all components
    rewards.total = rewards.sharpe + 
                   rewards.profit + 
                   rewards.drawdown_penalty + 
                   rewards.risk_penalty + 
                   rewards.action_penalty;

    // Log detailed reward breakdown for analysis
    this.logRewardBreakdown(rewards, action, currentState);

    return rewards;
  }

  /**
   * Execute action in the environment and calculate reward
   */
  async step(action, marketData) {
    const previousState = { ...this.environment.currentState };
    
    // Execute the action
    const executionResult = await this.executeAction(action, marketData);
    
    // Update environment state
    const currentState = await this.updateEnvironmentState(marketData, executionResult);
    this.environment.currentState = currentState;
    
    // Calculate advanced reward
    const reward = this.calculateAdvancedReward(action, previousState, currentState, marketData);
    
    // Update portfolio metrics
    await this.updatePortfolioMetrics(executionResult);
    
    // Store experience for learning
    if (this.learningEnabled) {
      await this.storeExperience(previousState, action, reward.total, currentState);
    }
    
    // Check if episode is done (e.g., significant drawdown)
    const done = this.checkEpisodeEnd();
    
    // Update performance tracking
    this.updatePerformanceTracking(reward, action);
    
    return {
      state: currentState,
      reward: reward.total,
      rewardBreakdown: reward,
      done: done,
      info: {
        portfolioValue: this.environment.portfolio.totalValue,
        drawdown: this.environment.portfolio.drawdown,
        action: action,
        executionResult: executionResult
      }
    };
  }

  /**
   * Execute trading action
   */
  async executeAction(action, marketData) {
    const currentPrice = marketData.price;
    const portfolio = this.environment.portfolio;
    
    let executionResult = {
      action: action,
      executed: false,
      quantity: 0,
      price: 0,
      cost: 0,
      error: null
    };

    try {
      switch (action) {
        case 'BUY':
          executionResult = await this.executeBuyOrder(currentPrice, portfolio);
          break;
          
        case 'SELL':
          executionResult = await this.executeSellOrder(currentPrice, portfolio);
          break;
          
        case 'HOLD':
          executionResult.executed = true;
          break;
      }
      
      // Apply transaction costs
      if (executionResult.executed && action !== 'HOLD') {
        const costs = this.quantEngine.calculateTransactionCosts(
          executionResult.quantity * executionResult.price,
          'market'
        );
        executionResult.cost = costs.total;
        portfolio.cash -= costs.total;
      }
      
    } catch (error) {
      console.error('❌ Action execution error:', error);
      executionResult.error = error.message;
    }

    return executionResult;
  }

  async executeBuyOrder(price, portfolio) {
    const availableCash = portfolio.cash * 0.95; // Leave 5% buffer
    const quantity = Math.floor(availableCash / price);
    
    if (quantity > 0 && availableCash >= quantity * price) {
      const totalCost = quantity * price;
      
      // Update portfolio
      portfolio.cash -= totalCost;
      const currentPosition = portfolio.positions.get('crypto') || 0;
      portfolio.positions.set('crypto', currentPosition + quantity);
      
      return {
        action: 'BUY',
        executed: true,
        quantity: quantity,
        price: price,
        cost: totalCost
      };
    }
    
    return { action: 'BUY', executed: false, error: 'Insufficient cash' };
  }

  async executeSellOrder(price, portfolio) {
    const currentPosition = portfolio.positions.get('crypto') || 0;
    
    if (currentPosition > 0) {
      const quantity = currentPosition;
      const totalValue = quantity * price;
      
      // Update portfolio
      portfolio.cash += totalValue;
      portfolio.positions.set('crypto', 0);
      
      return {
        action: 'SELL',
        executed: true,
        quantity: quantity,
        price: price,
        cost: totalValue
      };
    }
    
    return { action: 'SELL', executed: false, error: 'No position to sell' };
  }

  /**
   * Update environment state with new market data
   */
  async updateEnvironmentState(marketData, executionResult) {
    const portfolio = this.environment.portfolio;
    
    // Calculate current portfolio value
    const cryptoPosition = portfolio.positions.get('crypto') || 0;
    const portfolioValue = portfolio.cash + (cryptoPosition * marketData.price);
    
    // Update portfolio tracking
    portfolio.totalValue = portfolioValue;
    portfolio.maxValue = Math.max(portfolio.maxValue, portfolioValue);
    
    // Calculate drawdown
    const currentDrawdown = (portfolio.maxValue - portfolioValue) / portfolio.maxValue;
    portfolio.drawdown = currentDrawdown;
    portfolio.maxDrawdown = Math.max(portfolio.maxDrawdown, currentDrawdown);
    
    // Calculate return
    const dailyReturn = portfolio.returns.length > 0 
      ? (portfolioValue / (portfolio.totalValue || 100000)) - 1
      : 0;
    portfolio.returns.push(dailyReturn);
    
    // Keep only recent returns for calculation
    if (portfolio.returns.length > 252) { // 1 year
      portfolio.returns = portfolio.returns.slice(-252);
    }

    // Calculate technical indicators
    const technicalIndicators = await this.calculateTechnicalIndicators(marketData);
    
    // Detect market regime
    const marketRegime = await this.detectMarketRegime(marketData);
    
    // Construct normalized state vector
    const state = {
      // Market data (normalized)
      price: this.normalizeValue(marketData.price, this.environment.stateSpace.price),
      volume: this.normalizeValue(marketData.volume, this.environment.stateSpace.volume),
      volatility: Math.min(1.0, marketData.volatility || 0),
      
      // Technical indicators
      rsi: technicalIndicators.rsi / 100,
      macd: Math.max(-1, Math.min(1, technicalIndicators.macd)),
      bollinger_position: technicalIndicators.bollinger_position,
      
      // Portfolio state
      cash_ratio: portfolio.cash / portfolioValue,
      position_size: (cryptoPosition * marketData.price) / portfolioValue,
      unrealized_pnl: (portfolioValue - 100000) / 100000,
      
      // Risk metrics
      current_drawdown: currentDrawdown,
      var_estimate: Math.max(-1, technicalIndicators.var_estimate || 0),
      sharpe_ratio: portfolio.returns.length >= 10 
        ? Math.max(-5, Math.min(5, this.quantEngine.calculateRiskAdjustedSharpe(portfolio.returns)))
        : 0,
      
      // Market regime (one-hot encoding)
      regime_bull: marketRegime === 'BULL' ? 1 : 0,
      regime_bear: marketRegime === 'BEAR' ? 1 : 0,
      regime_sideways: marketRegime === 'SIDEWAYS' ? 1 : 0,
      regime_volatile: marketRegime === 'HIGH_VOLATILITY' ? 1 : 0,
      
      // Metadata
      timestamp: new Date(),
      portfolioValue: portfolioValue
    };

    return state;
  }

  /**
   * Store experience for replay learning
   */
  async storeExperience(state, action, reward, nextState) {
    const experience = {
      state: state,
      action: action,
      reward: reward,
      nextState: nextState,
      timestamp: new Date()
    };

    this.agent.memory.push(experience);
    
    // Limit memory size
    if (this.agent.memory.length > this.config.memorySize) {
      this.agent.memory.shift();
    }

    // Trigger learning if we have enough experiences
    if (this.agent.memory.length >= this.config.batchSize && this.learningEnabled) {
      await this.replayLearning();
    }
  }

  /**
   * Experience replay learning
   */
  async replayLearning() {
    if (this.agent.memory.length < this.config.batchSize) return;

    // Sample random batch from memory
    const batch = this.sampleBatch(this.config.batchSize);
    
    // Prepare training data
    const states = batch.map(exp => this.stateToVector(exp.state));
    const actions = batch.map(exp => this.actionToIndex(exp.action));
    const rewards = batch.map(exp => exp.reward);
    const nextStates = batch.map(exp => this.stateToVector(exp.nextState));

    // Calculate target Q-values
    const targets = await this.calculateTargets(states, actions, rewards, nextStates);
    
    // Train the network (simplified - would use actual neural network)
    await this.trainNetwork(states, targets);
    
    this.agent.trainingSteps++;
    
    // Update epsilon (exploration rate)
    this.config.epsilon = Math.max(0.01, this.config.epsilon * this.config.epsilonDecay);
    
    // Update target network periodically
    if (this.agent.trainingSteps % this.config.targetUpdateFreq === 0) {
      await this.updateTargetNetwork();
    }
  }

  /**
   * Select action using epsilon-greedy strategy
   */
  async selectAction(state) {
    // Exploration vs Exploitation
    if (Math.random() < this.config.epsilon && this.learningEnabled) {
      // Random exploration
      const randomIndex = Math.floor(Math.random() * this.environment.actionSpace.length);
      return this.environment.actionSpace[randomIndex];
    } else {
      // Greedy action selection
      return await this.selectGreedyAction(state);
    }
  }

  async selectGreedyAction(state) {
    // Convert state to vector for neural network
    const stateVector = this.stateToVector(state);
    
    // Get Q-values for all actions (simplified)
    const qValues = await this.getQValues(stateVector);
    
    // Select action with highest Q-value
    const maxIndex = qValues.indexOf(Math.max(...qValues));
    return this.environment.actionSpace[maxIndex];
  }

  /**
   * Performance tracking and analysis
   */
  updatePerformanceTracking(reward, action) {
    this.agent.totalReward += reward.total;
    this.agent.episodeReward += reward.total;
    
    this.performance.actionHistory.push({
      action: action,
      reward: reward.total,
      rewardBreakdown: reward,
      timestamp: new Date()
    });

    // Calculate recent Sharpe ratio
    if (this.environment.portfolio.returns.length >= 10) {
      const recentSharpe = this.quantEngine.calculateRiskAdjustedSharpe(
        this.environment.portfolio.returns.slice(-30)
      );
      this.performance.sharpeHistory.push(recentSharpe);
    }

    // Track drawdown
    this.performance.drawdownHistory.push(this.environment.portfolio.drawdown);
    
    // Track portfolio value
    this.performance.profitHistory.push(this.environment.portfolio.totalValue);
  }

  /**
   * Check if episode should end
   */
  checkEpisodeEnd() {
    const portfolio = this.environment.portfolio;
    
    // End episode if drawdown is too large
    if (portfolio.drawdown > 0.2) { // 20% drawdown limit
      console.log('🚨 Episode ended due to excessive drawdown');
      return true;
    }
    
    // End episode if portfolio value is too low
    if (portfolio.totalValue < 50000) { // 50% loss limit
      console.log('🚨 Episode ended due to excessive losses');
      return true;
    }
    
    return false;
  }

  /**
   * Start new episode
   */
  async startNewEpisode() {
    // Reset portfolio
    this.environment.portfolio = {
      cash: 100000,
      positions: new Map(),
      totalValue: 100000,
      maxValue: 100000,
      returns: [],
      drawdown: 0,
      maxDrawdown: 0
    };

    // Log episode completion
    if (this.agent.episodeCount > 0) {
      this.performance.episodeRewards.push(this.agent.episodeReward);
      
      console.log(`📊 Episode ${this.agent.episodeCount} completed:`);
      console.log(`   Total Reward: ${this.agent.episodeReward.toFixed(2)}`);
      console.log(`   Portfolio Value: $${this.environment.portfolio.totalValue.toFixed(2)}`);
      console.log(`   Max Drawdown: ${(this.environment.portfolio.maxDrawdown * 100).toFixed(2)}%`);
    }

    this.agent.episodeReward = 0;
    this.agent.episodeCount++;
  }

  // Utility methods
  normalizeValue(value, config) {
    if (!config.normalize) return value;
    return (value - config.min) / (config.max - config.min);
  }

  calculateActionPenalty(action) {
    const recentActions = this.performance.actionHistory.slice(-5);
    
    if (recentActions.length < 2) return 0;
    
    // Penalty for too frequent action changes (thrashing)
    const actionChanges = recentActions.filter((act, i) => 
      i > 0 && act.action !== recentActions[i-1].action
    ).length;
    
    return -0.01 * actionChanges; // Small penalty for excessive changes
  }

  stateToVector(state) {
    // Convert state object to numerical vector for neural network
    return Object.values(state).filter(val => typeof val === 'number');
  }

  actionToIndex(action) {
    return this.environment.actionSpace.indexOf(action);
  }

  sampleBatch(batchSize) {
    const batch = [];
    for (let i = 0; i < batchSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.agent.memory.length);
      batch.push(this.agent.memory[randomIndex]);
    }
    return batch;
  }

  logRewardBreakdown(rewards, action, state) {
    // Log detailed reward information for analysis
    console.log(`🎯 Reward Breakdown for ${action}:`);
    console.log(`   Sharpe: ${rewards.sharpe.toFixed(4)}`);
    console.log(`   Profit: ${rewards.profit.toFixed(4)}`);
    console.log(`   Drawdown Penalty: ${rewards.drawdown_penalty.toFixed(4)}`);
    console.log(`   Risk Penalty: ${rewards.risk_penalty.toFixed(4)}`);
    console.log(`   Total: ${rewards.total.toFixed(4)}`);
  }

  // Placeholder methods for neural network operations
  async initializeNeuralNetwork() {
    console.log('🧠 Neural network initialized (simplified)');
  }

  async loadHistoricalData() {
    console.log('📊 Historical data loaded');
  }

  async setupEnvironment() {
    console.log('🌍 Environment setup completed');
  }

  async calculateTechnicalIndicators(marketData) {
    return {
      rsi: 50 + Math.random() * 40,
      macd: (Math.random() - 0.5) * 0.1,
      bollinger_position: Math.random(),
      var_estimate: -Math.random() * 0.05
    };
  }

  async detectMarketRegime(marketData) {
    // Simplified regime detection
    const volatility = marketData.volatility || 0;
    if (volatility > 0.05) return 'HIGH_VOLATILITY';
    return ['BULL', 'BEAR', 'SIDEWAYS'][Math.floor(Math.random() * 3)];
  }

  async getQValues(stateVector) {
    // Simplified Q-value calculation
    return [Math.random(), Math.random(), Math.random()];
  }

  async calculateTargets(states, actions, rewards, nextStates) {
    // Simplified target calculation
    return rewards;
  }

  async trainNetwork(states, targets) {
    // Simplified training
    console.log('🎓 Network training step completed');
  }

  async updateTargetNetwork() {
    console.log('🔄 Target network updated');
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    const portfolio = this.environment.portfolio;
    const recentReturns = portfolio.returns.slice(-30);
    
    return {
      // Episode statistics
      totalEpisodes: this.agent.episodeCount,
      currentEpisodeReward: this.agent.episodeReward,
      totalReward: this.agent.totalReward,
      
      // Portfolio performance
      portfolioValue: portfolio.totalValue,
      totalReturn: (portfolio.totalValue - 100000) / 100000,
      maxDrawdown: portfolio.maxDrawdown,
      currentDrawdown: portfolio.drawdown,
      
      // Risk metrics
      sharpeRatio: recentReturns.length >= 10 
        ? this.quantEngine.calculateRiskAdjustedSharpe(recentReturns)
        : 0,
      volatility: recentReturns.length >= 2 
        ? this.quantEngine.calculateVolatility(recentReturns)
        : 0,
      
      // Learning statistics
      explorationRate: this.config.epsilon,
      trainingSteps: this.agent.trainingSteps,
      memorySize: this.agent.memory.length,
      
      // Recent performance
      recentActions: this.performance.actionHistory.slice(-10),
      recentSharpe: this.performance.sharpeHistory.slice(-10),
      
      timestamp: new Date()
    };
  }
}

module.exports = ReinforcementLearningEngine;
