const WebSocket = require('ws');
const AIAgentService = require('./AIAgentService');
const TradingService = require('./TradingService');
const SecurityService = require('./SecurityService');

class WebSocketService {
  constructor(wss) {
    this.wss = wss;
    this.clients = new Map();
    this.channels = new Map();
    this.isRunning = false;
    
    this.initializeChannels();
    this.setupWebSocketServer();
    this.startDataBroadcasting();
  }

  initializeChannels() {
    // Define different data channels
    this.channels.set('market_data', {
      name: 'Market Data',
      subscribers: new Set(),
      lastUpdate: null,
      updateInterval: 5000 // 5 seconds
    });

    this.channels.set('portfolio', {
      name: 'Portfolio Updates',
      subscribers: new Set(),
      lastUpdate: null,
      updateInterval: 10000 // 10 seconds
    });

    this.channels.set('ai_decisions', {
      name: 'AI Decisions',
      subscribers: new Set(),
      lastUpdate: null,
      updateInterval: 30000 // 30 seconds
    });

    this.channels.set('security', {
      name: 'Security Events',
      subscribers: new Set(),
      lastUpdate: null,
      updateInterval: 15000 // 15 seconds
    });

    this.channels.set('system_health', {
      name: 'System Health',
      subscribers: new Set(),
      lastUpdate: null,
      updateInterval: 20000 // 20 seconds
    });
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, request) => {
      const clientId = this.generateClientId();
      
      // Store client info
      this.clients.set(clientId, {
        ws,
        id: clientId,
        ip: request.socket.remoteAddress,
        connectedAt: new Date(),
        subscriptions: new Set(),
        lastPong: new Date()
      });

      console.log(`📡 Client connected: ${clientId} (${this.clients.size} total)`);

      // Setup message handlers
      ws.on('message', (message) => {
        this.handleMessage(clientId, message);
      });

      ws.on('close', () => {
        this.handleDisconnection(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnection(clientId);
      });

      // Setup ping/pong for connection health
      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPong = new Date();
        }
      });

      // Send initial connection confirmation
      this.sendToClient(clientId, {
        type: 'connection',
        data: {
          clientId,
          status: 'connected',
          availableChannels: Array.from(this.channels.keys()),
          timestamp: new Date()
        }
      });
    });

    this.isRunning = true;
    console.log('🔌 WebSocket service started');
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  handleMessage(clientId, message) {
    try {
      const data = JSON.parse(message.toString());
      const client = this.clients.get(clientId);
      
      if (!client) return;

      switch (data.type) {
        case 'subscribe':
          this.handleSubscription(clientId, data.channel);
          break;
        
        case 'unsubscribe':
          this.handleUnsubscription(clientId, data.channel);
          break;
        
        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: new Date() });
          break;
        
        case 'request_data':
          this.handleDataRequest(clientId, data);
          break;
        
        default:
          console.log(`Unknown message type from ${clientId}:`, data.type);
      }
    } catch (error) {
      console.error(`Error handling message from ${clientId}:`, error);
    }
  }

  handleSubscription(clientId, channel) {
    const client = this.clients.get(clientId);
    const channelData = this.channels.get(channel);

    if (!client || !channelData) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Invalid client or channel'
      });
      return;
    }

    // Add client to channel subscribers
    channelData.subscribers.add(clientId);
    client.subscriptions.add(channel);

    console.log(`📺 Client ${clientId} subscribed to ${channel}`);

    this.sendToClient(clientId, {
      type: 'subscription_confirmed',
      channel,
      timestamp: new Date()
    });

    // Send latest data immediately
    this.sendChannelData(channel);
  }

  handleUnsubscription(clientId, channel) {
    const client = this.clients.get(clientId);
    const channelData = this.channels.get(channel);

    if (client && channelData) {
      channelData.subscribers.delete(clientId);
      client.subscriptions.delete(channel);

      console.log(`📺 Client ${clientId} unsubscribed from ${channel}`);

      this.sendToClient(clientId, {
        type: 'unsubscription_confirmed',
        channel,
        timestamp: new Date()
      });
    }
  }

  handleDataRequest(clientId, data) {
    // Handle specific data requests
    switch (data.request) {
      case 'portfolio_summary':
        this.sendPortfolioSummary(clientId);
        break;
      
      case 'ai_status':
        this.sendAIStatus(clientId);
        break;
      
      case 'security_status':
        this.sendSecurityStatus(clientId);
        break;
      
      case 'market_overview':
        this.sendMarketOverview(clientId);
        break;
      
      default:
        this.sendToClient(clientId, {
          type: 'error',
          message: 'Unknown data request'
        });
    }
  }

  handleDisconnection(clientId) {
    const client = this.clients.get(clientId);
    
    if (client) {
      // Remove from all channel subscriptions
      for (const channel of client.subscriptions) {
        const channelData = this.channels.get(channel);
        if (channelData) {
          channelData.subscribers.delete(clientId);
        }
      }

      this.clients.delete(clientId);
      console.log(`📡 Client disconnected: ${clientId} (${this.clients.size} remaining)`);
    }
  }

  startDataBroadcasting() {
    // Market data broadcasting
    setInterval(() => {
      this.sendChannelData('market_data');
    }, this.channels.get('market_data').updateInterval);

    // Portfolio updates
    setInterval(() => {
      this.sendChannelData('portfolio');
    }, this.channels.get('portfolio').updateInterval);

    // AI decisions
    setInterval(() => {
      this.sendChannelData('ai_decisions');
    }, this.channels.get('ai_decisions').updateInterval);

    // Security events
    setInterval(() => {
      this.sendChannelData('security');
    }, this.channels.get('security').updateInterval);

    // System health
    setInterval(() => {
      this.sendChannelData('system_health');
    }, this.channels.get('system_health').updateInterval);

    // Connection health check
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  async sendChannelData(channelName) {
    const channel = this.channels.get(channelName);
    if (!channel || channel.subscribers.size === 0) return;

    let data;
    
    try {
      switch (channelName) {
        case 'market_data':
          data = await this.getMarketDataUpdate();
          break;
        
        case 'portfolio':
          data = await this.getPortfolioUpdate();
          break;
        
        case 'ai_decisions':
          data = await this.getAIDecisionsUpdate();
          break;
        
        case 'security':
          data = await this.getSecurityUpdate();
          break;
        
        case 'system_health':
          data = await this.getSystemHealthUpdate();
          break;
        
        default:
          return;
      }

      const message = {
        type: 'channel_data',
        channel: channelName,
        data,
        timestamp: new Date()
      };

      // Broadcast to all subscribers
      for (const clientId of channel.subscribers) {
        this.sendToClient(clientId, message);
      }

      channel.lastUpdate = new Date();

    } catch (error) {
      console.error(`Error sending ${channelName} data:`, error);
    }
  }

  async getMarketDataUpdate() {
    const marketData = TradingService.getMarketData();
    return {
      symbols: marketData,
      exchangeStatus: TradingService.getExchangeStatus(),
      timestamp: new Date()
    };
  }

  async getPortfolioUpdate() {
    return TradingService.getPortfolioSummary();
  }

  async getAIDecisionsUpdate() {
    return {
      agents: AIAgentService.getAgentStatus(),
      recentDecisions: AIAgentService.getDecisionHistory(10),
      knowledgeBase: AIAgentService.getKnowledgeBaseStats()
    };
  }

  async getSecurityUpdate() {
    return SecurityService.getSecurityMetrics();
  }

  async getSystemHealthUpdate() {
    return {
      services: {
        ai: AIAgentService.isHealthy(),
        trading: TradingService.isHealthy(),
        security: SecurityService.isHealthy(),
        websocket: this.isRunning
      },
      connections: this.clients.size,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date()
    };
  }

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to client ${clientId}:`, error);
        this.handleDisconnection(clientId);
      }
    }
  }

  broadcast(message) {
    for (const [clientId, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Error broadcasting to client ${clientId}:`, error);
          this.handleDisconnection(clientId);
        }
      }
    }
  }

  sendPortfolioSummary(clientId) {
    const summary = TradingService.getPortfolioSummary();
    this.sendToClient(clientId, {
      type: 'portfolio_summary',
      data: summary,
      timestamp: new Date()
    });
  }

  sendAIStatus(clientId) {
    const status = {
      agents: AIAgentService.getAgentStatus(),
      recentDecisions: AIAgentService.getDecisionHistory(5),
      isHealthy: AIAgentService.isHealthy()
    };
    
    this.sendToClient(clientId, {
      type: 'ai_status',
      data: status,
      timestamp: new Date()
    });
  }

  sendSecurityStatus(clientId) {
    const status = SecurityService.getSecurityMetrics();
    this.sendToClient(clientId, {
      type: 'security_status',
      data: status,
      timestamp: new Date()
    });
  }

  sendMarketOverview(clientId) {
    const overview = {
      marketData: TradingService.getMarketData(),
      exchanges: TradingService.getExchangeStatus()
    };
    
    this.sendToClient(clientId, {
      type: 'market_overview',
      data: overview,
      timestamp: new Date()
    });
  }

  performHealthCheck() {
    const now = new Date();
    const staleClients = [];

    for (const [clientId, client] of this.clients) {
      // Check if client hasn't responded to ping in 60 seconds
      if (now - client.lastPong > 60000) {
        staleClients.push(clientId);
      } else {
        // Send ping to active clients
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      }
    }

    // Clean up stale connections
    for (const clientId of staleClients) {
      console.log(`🧹 Cleaning up stale client: ${clientId}`);
      this.handleDisconnection(clientId);
    }
  }

  getConnectionStats() {
    const stats = {
      totalConnections: this.clients.size,
      channels: Array.from(this.channels.entries()).map(([name, channel]) => ({
        name,
        subscribers: channel.subscribers.size,
        lastUpdate: channel.lastUpdate
      })),
      uptime: process.uptime()
    };

    return stats;
  }

  // Emergency broadcast for critical alerts
  emergencyBroadcast(alert) {
    const message = {
      type: 'emergency_alert',
      alert,
      timestamp: new Date()
    };

    console.log('🚨 Emergency broadcast:', alert);
    this.broadcast(message);
  }
}

module.exports = WebSocketService;