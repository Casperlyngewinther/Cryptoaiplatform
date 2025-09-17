const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

// Import routes
const { router: authRoutes } = require('./routes/auth');
const tradingRoutes = require('./routes/trading');
const aiRoutes = require('./routes/ai');
const analyticsRoutes = require('./routes/analytics');
const securityRoutes = require('./routes/security');
const dashboardRoutes = require('./routes/dashboard');

// Import services
const DatabaseService = require('./services/DatabaseService');
const AIAgentService = require('./services/AIAgentService');
const TradingService = require('./services/TradingService');
const SecurityService = require('./services/SecurityService');
const WebSocketService = require('./services/WebSocketService');
const CryptoComExchange = require('./services/CryptoComExchange');

// Import V2.0 Enhanced Services
const CryptoAIPlatformV2 = require('./services/CryptoAIPlatformV2');
const QuantitativeEngine = require('./services/QuantitativeEngine');
const MasterAgentSystem = require('./services/MasterAgentSystem');
const ReinforcementLearningEngine = require('./services/ReinforcementLearningEngine');
const EnhancedOllamaGenerativeEngine = require('./services/EnhancedOllamaGenerativeEngine');
const OllamaHealthMonitor = require('./services/OllamaHealthMonitor');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });
const wsService = new WebSocketService(wss);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize V2.0 Platform
let platformV2;
let ollamaHealthMonitor;

// Initialize services
const initializeServices = async () => {
  try {
    // Legacy services initialization
    await DatabaseService.initialize();
    console.log('✅ Database Service initialized');
    
    await AIAgentService.initialize();
    console.log('✅ AI Agent Service initialized');
    
    await TradingService.initialize();
    console.log('✅ Trading Service initialized');
    
    await SecurityService.initialize();
    console.log('✅ Security Service initialized');
    
    // V2.0 Platform initialization
    console.log('🚀 Initializing CryptoAI Platform V2.0...');
    platformV2 = new CryptoAIPlatformV2();
    
    try {
      await platformV2.initialize();
      console.log('✅ CryptoAI Platform V2.0 initialized successfully');
      
      // Start the V2.0 platform
      await platformV2.start();
      console.log('🎯 V2.0 Self-evolving system active');
      
    } catch (v2Error) {
      console.warn('⚠️ V2.0 Platform initialization failed, running legacy mode:', v2Error.message);
      platformV2 = null;
    }
    
    console.log('🚀 All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: DatabaseService.isHealthy(),
      ai: AIAgentService.isHealthy(),
      trading: TradingService.isHealthy(),
      security: SecurityService.isHealthy()
    }
  };

  // Add V2.0 status if available
  if (platformV2) {
    health.v2Platform = platformV2.getSystemStatus();
  }

  res.json(health);
});

// V2.0 API Endpoints
// V2.0 Trading decision endpoint
app.post('/api/v2/trading/decision', async (req, res) => {
  try {
    if (!platformV2) {
      return res.status(503).json({ error: 'V2.0 platform not available' });
    }
    
    const { marketData } = req.body;
    
    if (!marketData) {
      return res.status(400).json({ error: 'Market data required' });
    }

    const decision = await platformV2.makeTradingDecision(marketData);
    res.json({
      success: true,
      decision: decision,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('V2.0 trading decision error:', error);
    res.status(500).json({
      error: 'Trading decision failed',
      message: error.message
    });
  }
});

// V2.0 Execute trading decision
app.post('/api/v2/trading/execute', async (req, res) => {
  try {
    if (!platformV2) {
      return res.status(503).json({ error: 'V2.0 platform not available' });
    }
    
    const { decision } = req.body;
    
    if (!decision) {
      return res.status(400).json({ error: 'Decision required' });
    }

    const result = await platformV2.executeTradingDecision(decision);
    res.json({
      success: true,
      execution: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('V2.0 execution error:', error);
    res.status(500).json({
      error: 'Execution failed',
      message: error.message
    });
  }
});

// V2.0 System status
app.get('/api/v2/status', (req, res) => {
  try {
    if (!platformV2) {
      return res.status(503).json({ error: 'V2.0 platform not available' });
    }
    
    const status = platformV2.getSystemStatus();
    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Status retrieval failed',
      message: error.message
    });
  }
});

// V2.0 Performance metrics
app.get('/api/v2/performance', async (req, res) => {
  try {
    if (!platformV2) {
      return res.status(503).json({ error: 'V2.0 platform not available' });
    }
    
    const performance = {
      quantitative: platformV2.quantEngine ? 'Available' : 'Not Available',
      reinforcementLearning: platformV2.rlEngine ? platformV2.rlEngine.getPerformanceReport() : 'Not Available',
      generativeAI: platformV2.ollamaEngine ? platformV2.ollamaEngine.getSystemStatus() : 'Not Available',
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      performance: performance
    });
  } catch (error) {
    res.status(500).json({
      error: 'Performance retrieval failed',
      message: error.message
    });
  }
});

// V2.0 Ollama AI explanations
app.post('/api/v2/ai/explain', async (req, res) => {
  try {
    if (!platformV2) {
      return res.status(503).json({ error: 'V2.0 platform not available' });
    }
    
    const { decision, marketContext, agentStates } = req.body;

    const explanation = await platformV2.ollamaEngine.explainTradingDecision(
      decision,
      marketContext,
      agentStates
    );

    res.json({
      success: true,
      explanation: explanation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'AI explanation failed',
      message: error.message
    });
  }
});

// New Crypto.com Exchange API endpoints
app.get('/api/v2/exchange/cryptocom/status', (req, res) => {
  try {
    const status = TradingService.cryptoComExchange 
      ? TradingService.cryptoComExchange.getStatus()
      : { error: 'Exchange not initialized' };

    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get exchange status',
      message: error.message
    });
  }
});

app.get('/api/v2/exchange/cryptocom/balance', async (req, res) => {
  try {
    if (!TradingService.cryptoComExchange) {
      return res.status(404).json({ error: 'Crypto.com exchange not initialized' });
    }

    const balance = await TradingService.cryptoComExchange.getBalance();
    
    res.json({
      success: true,
      balance: balance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get balance',
      message: error.message
    });
  }
});

app.get('/api/v2/exchange/cryptocom/market-data/:symbol?', (req, res) => {
  try {
    if (!TradingService.cryptoComExchange) {
      return res.status(404).json({ error: 'Crypto.com exchange not initialized' });
    }

    const { symbol } = req.params;
    const marketData = TradingService.cryptoComExchange.getMarketData(symbol);
    
    res.json({
      success: true,
      data: marketData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get market data',
      message: error.message
    });
  }
});

app.post('/api/v2/exchange/cryptocom/order', async (req, res) => {
  try {
    if (!TradingService.cryptoComExchange) {
      return res.status(404).json({ error: 'Crypto.com exchange not initialized' });
    }

    const { symbol, side, type, quantity, price } = req.body;
    
    if (!symbol || !side || !type || !quantity) {
      return res.status(400).json({ 
        error: 'Missing required parameters: symbol, side, type, quantity' 
      });
    }

    const orderParams = {
      symbol: symbol,
      side: side,
      type: type,
      quantity: parseFloat(quantity),
      ...(price && { price: parseFloat(price) })
    };

    const result = await TradingService.cryptoComExchange.placeOrder(orderParams);
    
    res.json({
      success: true,
      order: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Order placement failed',
      message: error.message
    });
  }
});

// Enhanced All Exchanges API endpoints
app.get('/api/v2/exchange/all-real-data', async (req, res) => {
  try {
    const realBalances = await TradingService.getRealExchangeBalances();
    const realMarketData = await TradingService.getRealMarketData();
    const exchangeStatuses = TradingService.getExchangeStatus();
    const summary = TradingService.getConnectedExchangesSummary();
    
    res.json({
      success: true,
      data: {
        summary,
        exchanges: exchangeStatuses,
        balances: realBalances,
        marketData: realMarketData
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get real exchange data',
      message: error.message
    });
  }
});

// Generic exchange endpoints for all connected exchanges
app.get('/api/v2/exchange/:exchangeName/status', (req, res) => {
  try {
    const { exchangeName } = req.params;
    const exchange = TradingService.realExchanges.get(exchangeName);
    
    if (!exchange) {
      return res.status(404).json({ 
        error: `Exchange ${exchangeName} not connected`,
        availableExchanges: Array.from(TradingService.realExchanges.keys())
      });
    }

    const status = exchange.getStatus();
    
    res.json({
      success: true,
      exchange: exchangeName,
      status: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get exchange status',
      message: error.message
    });
  }
});

app.get('/api/v2/exchange/:exchangeName/balance', async (req, res) => {
  try {
    const { exchangeName } = req.params;
    const exchange = TradingService.realExchanges.get(exchangeName);
    
    if (!exchange) {
      return res.status(404).json({ 
        error: `Exchange ${exchangeName} not connected`,
        availableExchanges: Array.from(TradingService.realExchanges.keys())
      });
    }

    if (!exchange.authenticated) {
      return res.status(401).json({ error: `Exchange ${exchangeName} not authenticated` });
    }

    const balance = await exchange.getBalances();
    
    res.json({
      success: true,
      exchange: exchangeName,
      balance: balance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get balance',
      message: error.message
    });
  }
});

app.get('/api/v2/exchange/:exchangeName/market-data/:symbol?', async (req, res) => {
  try {
    const { exchangeName, symbol } = req.params;
    const exchange = TradingService.realExchanges.get(exchangeName);
    
    if (!exchange) {
      return res.status(404).json({ 
        error: `Exchange ${exchangeName} not connected`,
        availableExchanges: Array.from(TradingService.realExchanges.keys())
      });
    }

    const marketData = await exchange.getMarketData(symbol || 'BTCUSDT');
    
    res.json({
      success: true,
      exchange: exchangeName,
      symbol: symbol || 'BTCUSDT',
      data: marketData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get market data',
      message: error.message
    });
  }
});

app.post('/api/v2/exchange/:exchangeName/order', async (req, res) => {
  try {
    const { exchangeName } = req.params;
    const { symbol, side, type, quantity, price } = req.body;

    if (!symbol || !side || !type || !quantity) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['symbol', 'side', 'type', 'quantity'],
        optional: ['price']
      });
    }

    const result = await TradingService.placeRealOrder(exchangeName, symbol, side, type, quantity, price);
    
    res.json({
      success: true,
      exchange: exchangeName,
      order: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to place order',
      message: error.message
    });
  }
});

app.get('/api/v2/exchange/:exchangeName/order/:symbol/:orderId', async (req, res) => {
  try {
    const { exchangeName, symbol, orderId } = req.params;

    const result = await TradingService.getOrderStatus(exchangeName, symbol, orderId);
    
    res.json({
      success: true,
      exchange: exchangeName,
      order: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get order status',
      message: error.message
    });
  }
});

app.delete('/api/v2/exchange/:exchangeName/order/:symbol/:orderId', async (req, res) => {
  try {
    const { exchangeName, symbol, orderId } = req.params;

    const result = await TradingService.cancelOrder(exchangeName, symbol, orderId);
    
    res.json({
      success: true,
      exchange: exchangeName,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to cancel order',
      message: error.message
    });
  }
});

// Get all market data from all exchanges
app.get('/api/v2/exchange/all/market-data/:symbol?', async (req, res) => {
  try {
    const { symbol } = req.params;
    const marketData = await TradingService.getRealMarketData(symbol);
    
    res.json({
      success: true,
      symbol: symbol || 'all_major_pairs',
      data: marketData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get market data from exchanges',
      message: error.message
    });
  }
});

// Get summary of all connected exchanges
app.get('/api/v2/exchange/summary', (req, res) => {
  try {
    const summary = TradingService.getConnectedExchangesSummary();
    
    res.json({
      success: true,
      summary: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get exchange summary',
      message: error.message
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Resource not found'
    }
  });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  await initializeServices();
  
  server.listen(PORT, () => {
    console.log(`🌟 CryptoAI Platform Server running on port ${PORT}`);
    console.log(`📊 WebSocket service active`);
    console.log(`🔒 Security service monitoring active`);
    console.log(`🤖 AI Agents operational`);
  });
};

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;