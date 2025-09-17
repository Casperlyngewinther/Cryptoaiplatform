const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
  constructor() {
    this.db = null;
    this.isReady = false;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, '../data/cryptoai.db');
      
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Database connection error:', err);
          reject(err);
          return;
        }
        
        console.log('Connected to SQLite database');
        this.createTables()
          .then(() => {
            this.isReady = true;
            resolve();
          })
          .catch(reject);
      });
    });
  }

  async createTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )`,
      
      // AI Agents table
      `CREATE TABLE IF NOT EXISTS ai_agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        config TEXT,
        performance_metrics TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Trading positions table
      `CREATE TABLE IF NOT EXISTS trading_positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        amount REAL NOT NULL,
        entry_price REAL NOT NULL,
        current_price REAL,
        pnl REAL DEFAULT 0,
        status TEXT DEFAULT 'open',
        ai_agent_id INTEGER,
        opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        closed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (ai_agent_id) REFERENCES ai_agents (id)
      )`,
      
      // Market data table
      `CREATE TABLE IF NOT EXISTS market_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        price REAL NOT NULL,
        volume REAL,
        market_cap REAL,
        price_change_24h REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        source TEXT
      )`,
      
      // AI decisions table
      `CREATE TABLE IF NOT EXISTS ai_decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER,
        decision_type TEXT NOT NULL,
        confidence REAL NOT NULL,
        reasoning TEXT,
        input_data TEXT,
        result TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES ai_agents (id)
      )`,
      
      // Security events table
      `CREATE TABLE IF NOT EXISTS security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        description TEXT,
        source_ip TEXT,
        user_id INTEGER,
        resolved BOOLEAN DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,
      
      // System metrics table
      `CREATE TABLE IF NOT EXISTS system_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        unit TEXT,
        category TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Black swan events table
      `CREATE TABLE IF NOT EXISTS black_swan_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_name TEXT NOT NULL,
        scenario TEXT NOT NULL,
        parameters TEXT,
        result TEXT,
        passed BOOLEAN,
        execution_time REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Insert default AI agents
    await this.insertDefaultData();
  }

  async insertDefaultData() {
    // Default AI agents
    const agents = [
      {
        name: 'Master Agent',
        type: 'coordinator',
        config: JSON.stringify({
          maxAgents: 6,
          decisionThreshold: 0.8,
          riskLevel: 'moderate'
        })
      },
      {
        name: 'Market Analysis Agent',
        type: 'analyzer',
        config: JSON.stringify({
          timeframes: ['1h', '4h', '1d'],
          indicators: ['RSI', 'MACD', 'BB'],
          confidence: 0.75
        })
      },
      {
        name: 'Risk Management Agent',
        type: 'risk_manager',
        config: JSON.stringify({
          maxDrawdown: 0.05,
          positionSizeLimit: 0.1,
          stopLoss: 0.02
        })
      },
      {
        name: 'Execution Agent',
        type: 'executor',
        config: JSON.stringify({
          slippage: 0.001,
          orderTimeout: 30,
          retryAttempts: 3
        })
      },
      {
        name: 'Verification Agent',
        type: 'verifier',
        config: JSON.stringify({
          checksRequired: ['balance', 'limits', 'compliance'],
          approvalThreshold: 1000
        })
      },
      {
        name: 'Learning Agent',
        type: 'learner',
        config: JSON.stringify({
          dataRetention: 90,
          modelUpdateFreq: 'daily',
          performanceTarget: 0.8
        })
      }
    ];

    for (const agent of agents) {
      await this.run(
        'INSERT OR IGNORE INTO ai_agents (name, type, config) VALUES (?, ?, ?)',
        [agent.name, agent.type, agent.config]
      );
    }

    // Insert sample metrics
    const metrics = [
      { name: 'total_profit', value: 28.5, unit: 'percent', category: 'performance' },
      { name: 'sharpe_ratio', value: 1.85, unit: 'ratio', category: 'performance' },
      { name: 'max_drawdown', value: 4.2, unit: 'percent', category: 'risk' },
      { name: 'win_rate', value: 68.4, unit: 'percent', category: 'performance' },
      { name: 'avg_trade_duration', value: 4.7, unit: 'hours', category: 'execution' }
    ];

    for (const metric of metrics) {
      await this.run(
        'INSERT INTO system_metrics (metric_name, metric_value, unit, category) VALUES (?, ?, ?, ?)',
        [metric.name, metric.value, metric.unit, metric.category]
      );
    }
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  isHealthy() {
    return this.isReady && this.db !== null;
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.isReady = false;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new DatabaseService();