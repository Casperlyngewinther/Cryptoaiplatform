const WebSocket = require('ws');
const EventEmitter = require('events');

/**
 * Anti-Fragil WebSocket Manager
 * Håndterer robust reconnection med exponential backoff og circuit breaker
 */
class EnhancedWebSocketManager extends EventEmitter {
  constructor(name, wsUrl, options = {}) {
    super();
    
    this.name = name;
    this.wsUrl = wsUrl;
    this.ws = null;
    this.connected = false;
    this.authenticated = false;
    
    // Anti-fragil reconnection configuration
    this.reconnectConfig = {
      enabled: true,
      attempts: 0,
      maxAttempts: options.maxAttempts || 15,
      initialDelay: options.initialDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      delayMultiplier: options.delayMultiplier || 1.5,
      jitterFactor: options.jitterFactor || 0.1,
      currentDelay: options.initialDelay || 1000
    };
    
    // Circuit breaker pattern
    this.circuitBreaker = {
      isOpen: false,
      failures: 0,
      threshold: options.circuitBreakerThreshold || 5,
      timeout: options.circuitBreakerTimeout || 60000,
      lastFailureTime: null
    };
    
    // Connection health monitoring
    this.healthCheck = {
      enabled: true,
      interval: options.healthCheckInterval || 30000,
      timeout: options.healthCheckTimeout || 10000,
      maxMissedPings: options.maxMissedPings || 3,
      missedPings: 0,
      timer: null,
      lastPong: null
    };
    
    // State tracking
    this.state = {
      isReconnecting: false,
      manualDisconnect: false,
      connectionStartTime: null,
      totalReconnections: 0,
      lastErrorMessage: null,
      subscriptions: new Set(),
      messageBuffer: []
    };
    
    // Metrics for monitoring
    this.metrics = {
      connectionsAttempted: 0,
      connectionsSuccessful: 0,
      reconnectionsAttempted: 0,
      reconnectionsSuccessful: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      avgConnectionTime: 0
    };
    
    // Timers cleanup
    this.timers = new Set();
  }

  /**
   * Hovedforbindelse med robust error handling
   */
  async connect() {
    if (this.circuitBreaker.isOpen && !this.isCircuitBreakerReady()) {
      const waitTime = this.circuitBreaker.timeout - (Date.now() - this.circuitBreaker.lastFailureTime);
      console.log(`🔒 ${this.name} Circuit breaker åben - venter ${Math.ceil(waitTime / 1000)}s`);
      throw new Error(`Circuit breaker is open for ${Math.ceil(waitTime / 1000)} seconds`);
    }

    this.metrics.connectionsAttempted++;
    this.state.connectionStartTime = Date.now();
    this.state.manualDisconnect = false;

    try {
      await this.establishConnection();
      this.onConnectionSuccess();
      return true;
    } catch (error) {
      this.onConnectionFailure(error);
      return false;
    }
  }

  /**
   * Etabler WebSocket forbindelse med timeout
   */
  async establishConnection() {
    return new Promise((resolve, reject) => {
      try {
        // Cleanup existing connection
        this.cleanup();

        console.log(`🔗 ${this.name} Forbinder til ${this.wsUrl}...`);
        this.ws = new WebSocket(this.wsUrl);

        // Connection timeout
        const connectTimeout = this.createTimer(() => {
          if (!this.connected) {
            console.log(`⏰ ${this.name} Forbindelse timeout efter 15s`);
            this.ws?.close();
            reject(new Error('Connection timeout'));
          }
        }, 15000);

        // Error handler (setup FIRST)
        this.ws.on('error', (error) => {
          this.clearTimer(connectTimeout);
          console.error(`❌ ${this.name} WebSocket fejl:`, error.message);
          this.connected = false;
          reject(error);
        });

        // Success handler
        this.ws.on('open', () => {
          this.clearTimer(connectTimeout);
          console.log(`✅ ${this.name} WebSocket forbundet`);
          this.connected = true;
          this.state.lastErrorMessage = null;
          resolve();
        });

        // Close handler
        this.ws.on('close', (code, reason) => {
          this.clearTimer(connectTimeout);
          this.handleDisconnection(code, reason);
        });

        // Message handler
        this.ws.on('message', (data) => {
          this.handleMessage(data);
        });

        // Pong handler for health checks
        this.ws.on('pong', () => {
          this.healthCheck.lastPong = Date.now();
          this.healthCheck.missedPings = 0;
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Håndter succesfuld forbindelse
   */
  onConnectionSuccess() {
    this.metrics.connectionsSuccessful++;
    this.resetReconnection();
    this.resetCircuitBreaker();
    this.startHealthCheck();
    
    // Gensubscriber til channels
    this.resubscribeToChannels();
    
    // Emit success event
    this.emit('connected');
    
    // Update connection time metric
    if (this.state.connectionStartTime) {
      const connectionTime = Date.now() - this.state.connectionStartTime;
      this.metrics.avgConnectionTime = 
        (this.metrics.avgConnectionTime * (this.metrics.connectionsSuccessful - 1) + connectionTime) 
        / this.metrics.connectionsSuccessful;
    }
  }

  /**
   * Håndter forbindelsesfejl
   */
  onConnectionFailure(error) {
    this.metrics.errors++;
    this.state.lastErrorMessage = error.message;
    this.updateCircuitBreaker();
    
    if (!this.state.manualDisconnect && this.reconnectConfig.enabled) {
      this.scheduleReconnection();
    }
    
    this.emit('error', error);
  }

  /**
   * Håndter afbrydelse og bestem om der skal reconnectes
   */
  handleDisconnection(code, reason) {
    const reasonStr = reason ? reason.toString() : 'Ingen grund angivet';
    console.log(`🔌 ${this.name} WebSocket afbrudt (Code: ${code}, Grund: ${reasonStr})`);
    
    this.connected = false;
    this.stopHealthCheck();
    
    this.emit('disconnected', { code, reason: reasonStr });
    
    // Kun attempt reconnection hvis ikke manuel afbrydelse
    if (!this.state.manualDisconnect && this.reconnectConfig.enabled) {
      // Code 1000 = normal closure, 1001 = going away
      if (code === 1000 || code === 1001) {
        console.log(`📋 ${this.name} Normal lukning detekteret - venter før reconnection`);
        this.scheduleReconnection(5000); // 5 sekunder delay for normal closure
      } else {
        console.log(`⚠️ ${this.name} Uventet afbrydelse - starter immediate reconnection`);
        this.scheduleReconnection();
      }
    }
  }

  /**
   * Planlæg reconnection med exponential backoff og jitter
   */
  scheduleReconnection(customDelay = null) {
    if (this.state.isReconnecting || this.reconnectConfig.attempts >= this.reconnectConfig.maxAttempts) {
      if (this.reconnectConfig.attempts >= this.reconnectConfig.maxAttempts) {
        console.error(`❌ ${this.name} Maksimalt antal reconnection forsøg nået (${this.reconnectConfig.maxAttempts})`);
        this.emit('maxReconnectAttemptsReached');
      }
      return;
    }

    this.state.isReconnecting = true;
    this.reconnectConfig.attempts++;
    this.metrics.reconnectionsAttempted++;

    // Beregn delay med exponential backoff og jitter
    let delay = customDelay || this.calculateBackoffDelay();
    
    console.log(`🔄 ${this.name} Planlægger reconnection forsøg ${this.reconnectConfig.attempts}/${this.reconnectConfig.maxAttempts} om ${delay}ms`);

    const reconnectTimer = this.createTimer(async () => {
      try {
        console.log(`🔄 ${this.name} Forsøger at reconnecte...`);
        await this.connect();
        this.metrics.reconnectionsSuccessful++;
        this.state.totalReconnections++;
      } catch (error) {
        console.error(`🔄 ${this.name} Reconnection fejlede:`, error.message);
        this.state.isReconnecting = false;
        
        // Fortsæt med næste forsøg
        if (this.reconnectConfig.attempts < this.reconnectConfig.maxAttempts) {
          this.scheduleReconnection();
        }
      }
    }, delay);
  }

  /**
   * Beregn exponential backoff delay med jitter
   */
  calculateBackoffDelay() {
    const baseDelay = Math.min(
      this.reconnectConfig.initialDelay * 
      Math.pow(this.reconnectConfig.delayMultiplier, this.reconnectConfig.attempts - 1),
      this.reconnectConfig.maxDelay
    );

    // Tilføj jitter for at undgå thundering herd
    const jitter = baseDelay * this.reconnectConfig.jitterFactor * Math.random();
    return Math.floor(baseDelay + jitter);
  }

  /**
   * Reset reconnection state efter succesfuld forbindelse
   */
  resetReconnection() {
    this.reconnectConfig.attempts = 0;
    this.reconnectConfig.currentDelay = this.reconnectConfig.initialDelay;
    this.state.isReconnecting = false;
  }

  /**
   * Circuit breaker logic
   */
  updateCircuitBreaker() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      console.log(`🔒 ${this.name} Circuit breaker åbnet efter ${this.circuitBreaker.failures} fejl`);
      this.emit('circuitBreakerOpen');
    }
  }

  /**
   * Reset circuit breaker efter succesfuld forbindelse
   */
  resetCircuitBreaker() {
    if (this.circuitBreaker.isOpen || this.circuitBreaker.failures > 0) {
      console.log(`🔓 ${this.name} Circuit breaker nulstillet`);
    }
    this.circuitBreaker.isOpen = false;
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.lastFailureTime = null;
  }

  /**
   * Check om circuit breaker er klar til at åbne igen
   */
  isCircuitBreakerReady() {
    if (!this.circuitBreaker.isOpen) return true;
    
    const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime;
    return timeSinceLastFailure >= this.circuitBreaker.timeout;
  }

  /**
   * Start health check med ping/pong
   */
  startHealthCheck() {
    if (!this.healthCheck.enabled) return;
    
    this.stopHealthCheck(); // Stop existing timer
    
    this.healthCheck.timer = this.createTimer(() => {
      if (!this.isConnected()) return;
      
      // Send ping
      try {
        this.ws.ping();
        
        // Check for missed pongs
        if (this.healthCheck.lastPong) {
          const timeSinceLastPong = Date.now() - this.healthCheck.lastPong;
          if (timeSinceLastPong > this.healthCheck.timeout) {
            this.healthCheck.missedPings++;
            console.log(`⚠️ ${this.name} Missed pong - total: ${this.healthCheck.missedPings}`);
            
            if (this.healthCheck.missedPings >= this.healthCheck.maxMissedPings) {
              console.log(`💔 ${this.name} For mange mistede pings - lukker forbindelse`);
              this.ws.close(1000, 'Health check failed');
            }
          }
        } else {
          this.healthCheck.lastPong = Date.now();
        }
      } catch (error) {
        console.error(`${this.name} Health check ping fejl:`, error);
      }
    }, this.healthCheck.interval);
  }

  /**
   * Stop health check
   */
  stopHealthCheck() {
    if (this.healthCheck.timer) {
      this.clearTimer(this.healthCheck.timer);
      this.healthCheck.timer = null;
    }
    this.healthCheck.missedPings = 0;
  }

  /**
   * Håndter indkommende beskeder
   */
  handleMessage(data) {
    this.metrics.messagesReceived++;
    
    try {
      const message = JSON.parse(data);
      this.emit('message', message);
    } catch (error) {
      console.error(`${this.name} Message parse fejl:`, error);
      this.emit('parseError', { error, data });
    }
  }

  /**
   * Send besked med fejlhåndtering
   */
  send(message) {
    if (!this.isConnected()) {
      console.warn(`⚠️ ${this.name} Ikke forbundet - buffer besked`);
      this.state.messageBuffer.push(message);
      return false;
    }

    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(messageStr);
      this.metrics.messagesSent++;
      return true;
    } catch (error) {
      console.error(`${this.name} Send fejl:`, error);
      this.emit('sendError', error);
      return false;
    }
  }

  /**
   * Subscribe til channel og gem til resubscription
   */
  subscribe(subscription) {
    this.state.subscriptions.add(JSON.stringify(subscription));
    return this.send(subscription);
  }

  /**
   * Resubscriber til alle gemte channels
   */
  resubscribeToChannels() {
    if (this.state.subscriptions.size === 0) return;
    
    console.log(`📺 ${this.name} Resubscriber til ${this.state.subscriptions.size} channels`);
    
    for (const subscriptionStr of this.state.subscriptions) {
      try {
        const subscription = JSON.parse(subscriptionStr);
        this.send(subscription);
      } catch (error) {
        console.error(`${this.name} Resubscription fejl:`, error);
      }
    }
    
    // Send buffered messages
    while (this.state.messageBuffer.length > 0) {
      const message = this.state.messageBuffer.shift();
      this.send(message);
    }
  }

  /**
   * Manuel forbindelse
   */
  async reconnect() {
    console.log(`🔄 ${this.name} Manuel reconnection anmodet`);
    
    this.stopHealthCheck();
    this.resetReconnection();
    this.resetCircuitBreaker();
    
    if (this.ws) {
      this.state.manualDisconnect = true;
      this.ws.close();
    }
    
    this.state.manualDisconnect = false;
    return await this.connect();
  }

  /**
   * Manuel afbrydelse
   */
  disconnect() {
    console.log(`🔌 ${this.name} Manuel afbrydelse`);
    
    this.state.manualDisconnect = true;
    this.reconnectConfig.enabled = false;
    this.stopHealthCheck();
    this.cleanup();
  }

  /**
   * Check forbindelsesstatus
   */
  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Få detaljeret status
   */
  getStatus() {
    return {
      name: this.name,
      connected: this.connected,
      authenticated: this.authenticated,
      reconnectAttempts: this.reconnectConfig.attempts,
      maxReconnectAttempts: this.reconnectConfig.maxAttempts,
      circuitBreakerOpen: this.circuitBreaker.isOpen,
      isReconnecting: this.state.isReconnecting,
      subscriptions: this.state.subscriptions.size,
      bufferedMessages: this.state.messageBuffer.length,
      totalReconnections: this.state.totalReconnections,
      lastError: this.state.lastErrorMessage,
      metrics: this.metrics,
      healthCheck: {
        enabled: this.healthCheck.enabled,
        missedPings: this.healthCheck.missedPings,
        lastPong: this.healthCheck.lastPong
      }
    };
  }

  /**
   * Timer management for proper cleanup
   */
  createTimer(callback, delay) {
    const timer = setTimeout(callback, delay);
    this.timers.add(timer);
    return timer;
  }

  clearTimer(timer) {
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(timer);
    }
  }

  /**
   * Cleanup alle ressourcer
   */
  cleanup() {
    // Clear all timers
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
    
    // Stop health check
    this.stopHealthCheck();
    
    // Close WebSocket
    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    
    this.connected = false;
  }

  /**
   * Destructor
   */
  destroy() {
    this.disconnect();
    this.removeAllListeners();
  }
}

module.exports = EnhancedWebSocketManager;