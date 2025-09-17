/**
 * OllamaHealthMonitor - Advanced monitoring and management for Ollama connectivity
 * 
 * Features:
 * - Continuous health monitoring
 * - Automatic recovery attempts
 * - Performance metrics collection
 * - Alert system for failures
 * - Dashboard integration
 */

const EventEmitter = require('events');
const EnhancedOllamaGenerativeEngine = require('./EnhancedOllamaGenerativeEngine');

class OllamaHealthMonitor extends EventEmitter {
  constructor() {
    super();
    
    this.config = {
      healthCheckInterval: 30000,    // 30 seconds
      performanceWindow: 300000,     // 5 minutes for performance calculations
      alertThreshold: 5,             // Consecutive failures before alert
      recoveryAttemptInterval: 60000, // 1 minute between recovery attempts
    };
    
    this.ollamaEngine = null;
    this.isMonitoring = false;
    this.healthCheckTimer = null;
    this.recoveryTimer = null;
    
    // Health metrics
    this.metrics = {
      uptime: 0,
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      consecutiveFailures: 0,
      lastSuccessfulCheck: null,
      lastFailedCheck: null,
      avgResponseTime: 0,
      responseTimeSamples: [],
      currentStatus: 'unknown'
    };
    
    // Performance history
    this.performanceHistory = [];
    this.alertHistory = [];
    
    this.startTime = Date.now();
  }

  /**
   * Initialize the health monitor
   */
  async initialize() {
    console.log('🏥 Initializing Ollama Health Monitor...');
    
    try {
      this.ollamaEngine = new EnhancedOllamaGenerativeEngine();
      
      // Setup event listeners for the engine
      this.setupEngineEventListeners();
      
      // Initialize the engine
      await this.ollamaEngine.initialize();
      
      console.log('✅ Ollama Health Monitor initialized');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize Ollama Health Monitor:', error);
      throw error;
    }
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ Health monitoring already running');
      return;
    }
    
    this.isMonitoring = true;
    console.log('🔍 Starting Ollama health monitoring...');
    
    // Start health check timer
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
    
    // Perform initial health check
    this.performHealthCheck();
    
    console.log(`📊 Health checks every ${this.config.healthCheckInterval/1000} seconds`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = false;
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
    }
    
    console.log('🛑 Ollama health monitoring stopped');
  }

  /**
   * Perform a health check
   */
  async performHealthCheck() {
    const startTime = Date.now();
    this.metrics.totalChecks++;
    
    try {
      if (!this.ollamaEngine) {
        throw new Error('Ollama engine not initialized');
      }
      
      // Get system status
      const status = this.ollamaEngine.getSystemStatus();
      const responseTime = Date.now() - startTime;
      
      // Update metrics for successful check
      this.handleSuccessfulCheck(status, responseTime);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.handleFailedCheck(error, responseTime);
    }
  }

  /**
   * Handle successful health check
   */
  handleSuccessfulCheck(status, responseTime) {
    this.metrics.successfulChecks++;
    this.metrics.consecutiveFailures = 0;
    this.metrics.lastSuccessfulCheck = new Date();
    this.metrics.currentStatus = status.usingFallback ? 'fallback' : 'connected';
    
    // Update response time metrics
    this.updateResponseTimeMetrics(responseTime);
    
    // Record performance data
    this.recordPerformanceData({
      timestamp: new Date(),
      status: 'success',
      responseTime,
      usingFallback: status.usingFallback,
      connectionAttempts: status.connectionAttempts,
      totalRequests: status.metrics.totalRequests,
      successRate: parseFloat(status.metrics.successRate)
    });
    
    // Emit success event
    this.emit('health-check-success', {
      status,
      responseTime,
      metrics: this.metrics
    });
    
    console.log(`✅ Health check passed (${responseTime}ms) - ${status.usingFallback ? 'Fallback' : 'Live'} mode`);
  }

  /**
   * Handle failed health check
   */
  handleFailedCheck(error, responseTime) {
    this.metrics.failedChecks++;
    this.metrics.consecutiveFailures++;
    this.metrics.lastFailedCheck = new Date();
    this.metrics.currentStatus = 'failed';
    
    // Record failure
    this.recordPerformanceData({
      timestamp: new Date(),
      status: 'failed',
      responseTime,
      error: error.message
    });
    
    // Check if we need to send alerts
    if (this.metrics.consecutiveFailures >= this.config.alertThreshold) {
      this.sendAlert({
        type: 'consecutive_failures',
        count: this.metrics.consecutiveFailures,
        error: error.message,
        timestamp: new Date()
      });
    }
    
    // Attempt recovery if not already trying
    if (!this.recoveryTimer) {
      this.startRecoveryAttempts();
    }
    
    // Emit failure event
    this.emit('health-check-failed', {
      error,
      responseTime,
      consecutiveFailures: this.metrics.consecutiveFailures,
      metrics: this.metrics
    });
    
    console.error(`❌ Health check failed (${responseTime}ms): ${error.message}`);
  }

  /**
   * Update response time metrics
   */
  updateResponseTimeMetrics(responseTime) {
    this.metrics.responseTimeSamples.push(responseTime);
    
    // Keep only recent samples for performance calculation
    const maxSamples = 100;
    if (this.metrics.responseTimeSamples.length > maxSamples) {
      this.metrics.responseTimeSamples = this.metrics.responseTimeSamples.slice(-maxSamples);
    }
    
    // Calculate average response time
    this.metrics.avgResponseTime = this.metrics.responseTimeSamples.reduce((sum, time) => sum + time, 0) / this.metrics.responseTimeSamples.length;
  }

  /**
   * Record performance data
   */
  recordPerformanceData(data) {
    this.performanceHistory.push(data);
    
    // Clean up old performance data
    const cutoffTime = Date.now() - this.config.performanceWindow;
    this.performanceHistory = this.performanceHistory.filter(
      entry => entry.timestamp.getTime() > cutoffTime
    );
  }

  /**
   * Start recovery attempts
   */
  startRecoveryAttempts() {
    console.log('🔄 Starting automatic recovery attempts...');
    
    this.recoveryTimer = setInterval(async () => {
      try {
        console.log('🔄 Attempting Ollama recovery...');
        
        if (this.ollamaEngine) {
          const success = await this.ollamaEngine.forceReconnect();
          
          if (success) {
            console.log('✅ Ollama recovery successful');
            this.stopRecoveryAttempts();
            
            this.emit('recovery-success');
          } else {
            console.log('❌ Recovery attempt failed');
          }
        }
        
      } catch (error) {
        console.error('❌ Recovery attempt error:', error.message);
      }
    }, this.config.recoveryAttemptInterval);
  }

  /**
   * Stop recovery attempts
   */
  stopRecoveryAttempts() {
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = null;
      console.log('🛑 Recovery attempts stopped');
    }
  }

  /**
   * Send alert
   */
  sendAlert(alert) {
    this.alertHistory.push(alert);
    
    // Keep only recent alerts
    const maxAlerts = 50;
    if (this.alertHistory.length > maxAlerts) {
      this.alertHistory = this.alertHistory.slice(-maxAlerts);
    }
    
    console.warn(`🚨 ALERT: ${alert.type} - ${alert.count || 1} failures`);
    
    this.emit('alert', alert);
  }

  /**
   * Setup event listeners for the Ollama engine
   */
  setupEngineEventListeners() {
    if (!this.ollamaEngine) return;
    
    this.ollamaEngine.on('connected', () => {
      console.log('📡 Ollama engine connected');
      this.emit('engine-connected');
      this.stopRecoveryAttempts();
    });
    
    this.ollamaEngine.on('disconnected', () => {
      console.log('📡 Ollama engine disconnected');
      this.emit('engine-disconnected');
      this.startRecoveryAttempts();
    });
    
    this.ollamaEngine.on('fallback-activated', () => {
      console.log('🤖 Fallback service activated');
      this.emit('fallback-activated');
    });
    
    this.ollamaEngine.on('circuit-breaker-open', () => {
      console.log('🚨 Circuit breaker opened');
      this.sendAlert({
        type: 'circuit_breaker_open',
        timestamp: new Date()
      });
    });
  }

  /**
   * Get comprehensive health report
   */
  getHealthReport() {
    const uptime = Date.now() - this.startTime;
    const successRate = this.metrics.totalChecks > 0 ? 
      (this.metrics.successfulChecks / this.metrics.totalChecks * 100).toFixed(2) : 0;
    
    // Calculate performance trends
    const recentPerformance = this.performanceHistory.slice(-10);
    const avgRecentResponseTime = recentPerformance.length > 0 ?
      recentPerformance.reduce((sum, p) => sum + (p.responseTime || 0), 0) / recentPerformance.length : 0;
    
    return {
      status: this.metrics.currentStatus,
      isMonitoring: this.isMonitoring,
      uptime: uptime,
      uptimeFormatted: this.formatDuration(uptime),
      
      // Connection metrics
      totalChecks: this.metrics.totalChecks,
      successfulChecks: this.metrics.successfulChecks,
      failedChecks: this.metrics.failedChecks,
      successRate: `${successRate}%`,
      consecutiveFailures: this.metrics.consecutiveFailures,
      
      // Performance metrics
      avgResponseTime: Math.round(this.metrics.avgResponseTime),
      recentAvgResponseTime: Math.round(avgRecentResponseTime),
      lastSuccessfulCheck: this.metrics.lastSuccessfulCheck,
      lastFailedCheck: this.metrics.lastFailedCheck,
      
      // Engine status
      engineStatus: this.ollamaEngine ? this.ollamaEngine.getSystemStatus() : null,
      
      // Recent performance data
      recentPerformance: recentPerformance,
      
      // Alert history
      recentAlerts: this.alertHistory.slice(-5),
      
      timestamp: new Date()
    };
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    
    // Calculate hourly and daily success rates
    const lastHour = this.performanceHistory.filter(p => p.timestamp.getTime() > now - oneHour);
    const lastDay = this.performanceHistory.filter(p => p.timestamp.getTime() > now - oneDay);
    
    const hourlySuccessRate = lastHour.length > 0 ?
      (lastHour.filter(p => p.status === 'success').length / lastHour.length * 100).toFixed(2) : 0;
    
    const dailySuccessRate = lastDay.length > 0 ?
      (lastDay.filter(p => p.status === 'success').length / lastDay.length * 100).toFixed(2) : 0;
    
    return {
      hourly: {
        totalChecks: lastHour.length,
        successRate: `${hourlySuccessRate}%`,
        avgResponseTime: lastHour.length > 0 ? 
          Math.round(lastHour.reduce((sum, p) => sum + (p.responseTime || 0), 0) / lastHour.length) : 0
      },
      daily: {
        totalChecks: lastDay.length,
        successRate: `${dailySuccessRate}%`,
        avgResponseTime: lastDay.length > 0 ? 
          Math.round(lastDay.reduce((sum, p) => sum + (p.responseTime || 0), 0) / lastDay.length) : 0
      },
      trends: this.calculateTrends()
    };
  }

  /**
   * Calculate performance trends
   */
  calculateTrends() {
    if (this.performanceHistory.length < 10) {
      return { trend: 'insufficient_data' };
    }
    
    const recent = this.performanceHistory.slice(-10);
    const older = this.performanceHistory.slice(-20, -10);
    
    if (older.length === 0) {
      return { trend: 'insufficient_data' };
    }
    
    const recentSuccessRate = recent.filter(p => p.status === 'success').length / recent.length;
    const olderSuccessRate = older.filter(p => p.status === 'success').length / older.length;
    
    const difference = recentSuccessRate - olderSuccessRate;
    
    if (difference > 0.1) {
      return { trend: 'improving', change: difference };
    } else if (difference < -0.1) {
      return { trend: 'declining', change: difference };
    } else {
      return { trend: 'stable', change: difference };
    }
  }

  /**
   * Test Ollama functionality
   */
  async testOllamaFunctionality() {
    try {
      if (!this.ollamaEngine) {
        throw new Error('Ollama engine not initialized');
      }
      
      console.log('🧪 Testing Ollama functionality...');
      
      // Test feature generation
      const testMarketData = {
        symbol: 'BTC/USDT',
        price: 42000,
        volume: 1000000,
        timestamp: new Date()
      };
      
      const features = await this.ollamaEngine.generatePredictiveFeatures(testMarketData);
      
      return {
        success: true,
        featuresGenerated: features.length,
        engineStatus: this.ollamaEngine.getSystemStatus(),
        timestamp: new Date()
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Format duration in human readable format
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.stopMonitoring();
    
    if (this.ollamaEngine) {
      await this.ollamaEngine.cleanup();
    }
    
    console.log('🧹 Ollama Health Monitor cleaned up');
  }
}

module.exports = OllamaHealthMonitor;