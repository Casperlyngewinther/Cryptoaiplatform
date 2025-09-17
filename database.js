/**
 * PostgreSQL/TimescaleDB Database Configuration
 * Secure centralized konfiguration for database forbindelser
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseConfig {
  constructor() {
    this.pools = new Map();
    this.config = this.loadConfig();
  }

  loadConfig() {
    return {
      // Primary PostgreSQL connection
      primary: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'cryptoai_production',
        user: process.env.DB_USER || 'cryptoai_user',
        password: process.env.DB_PASSWORD || null,
        
        // Connection pooling configuration
        pool: {
          min: parseInt(process.env.DB_POOL_MIN) || 2,
          max: parseInt(process.env.DB_POOL_MAX) || 20,
          acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 30000,
          createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT) || 30000,
          destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT) || 5000,
          idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
          reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL) || 1000,
        },
        
        // SSL configuration for production
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false,
          ca: process.env.DB_SSL_CA ? fs.readFileSync(process.env.DB_SSL_CA) : undefined,
          cert: process.env.DB_SSL_CERT ? fs.readFileSync(process.env.DB_SSL_CERT) : undefined,
          key: process.env.DB_SSL_KEY ? fs.readFileSync(process.env.DB_SSL_KEY) : undefined
        } : false,
        
        // Query timeout
        statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
        query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
        
        // Application specific settings
        application_name: process.env.DB_APP_NAME || 'CryptoAI_Trading_Platform',
        
        // TimescaleDB specific settings
        timescaledb: {
          enabled: process.env.TIMESCALEDB_ENABLED !== 'false',
          compression: {
            enabled: process.env.TIMESCALEDB_COMPRESSION !== 'false',
            compress_after: process.env.TIMESCALEDB_COMPRESS_AFTER || '7 days'
          },
          retention: {
            enabled: process.env.TIMESCALEDB_RETENTION !== 'false',
            market_data_retention: process.env.MARKET_DATA_RETENTION || '1 year',
            system_metrics_retention: process.env.SYSTEM_METRICS_RETENTION || '6 months',
            ai_decisions_retention: process.env.AI_DECISIONS_RETENTION || '3 months'
          }
        }
      },
      
      // Read-only replica for analytics (optional)
      analytics: {
        host: process.env.DB_ANALYTICS_HOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_ANALYTICS_PORT) || parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_ANALYTICS_NAME || process.env.DB_NAME || 'cryptoai_production',
        user: process.env.DB_ANALYTICS_USER || process.env.DB_USER || 'cryptoai_user',
        password: process.env.DB_ANALYTICS_PASSWORD || process.env.DB_PASSWORD || null,
        
        pool: {
          min: 1,
          max: 5,
          acquireTimeoutMillis: 30000,
          idleTimeoutMillis: 30000
        },
        
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false
        } : false,
        
        application_name: 'CryptoAI_Analytics_Reader'
      }
    };
  }

  /**
   * Få connection pool for specificeret database
   */
  getPool(name = 'primary') {
    if (!this.pools.has(name)) {
      const config = this.config[name];
      if (!config) {
        throw new Error(`Database configuration '${name}' not found`);
      }
      
      const pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: config.ssl,
        statement_timeout: config.statement_timeout,
        query_timeout: config.query_timeout,
        application_name: config.application_name,
        ...config.pool
      });
      
      // Error handling for pool
      pool.on('error', (err) => {
        console.error(`Database pool error for '${name}':`, err);
      });
      
      pool.on('connect', (client) => {
        console.log(`New client connected to ${name} database`);
      });
      
      this.pools.set(name, pool);
    }
    
    return this.pools.get(name);
  }

  /**
   * Test database forbindelse
   */
  async testConnection(name = 'primary') {
    try {
      const pool = this.getPool(name);
      const client = await pool.connect();
      
      const result = await client.query('SELECT NOW() as timestamp, version() as version');
      client.release();
      
      return {
        success: true,
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].version,
        pool_size: pool.totalCount,
        idle_connections: pool.idleCount,
        waiting_requests: pool.waitingCount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Luk alle database pools
   */
  async closeAll() {
    const promises = [];
    for (const [name, pool] of this.pools) {
      console.log(`Closing database pool: ${name}`);
      promises.push(pool.end());
    }
    
    await Promise.all(promises);
    this.pools.clear();
  }

  /**
   * Få database statistikker
   */
  getPoolStats(name = 'primary') {
    const pool = this.pools.get(name);
    if (!pool) return null;
    
    return {
      total_connections: pool.totalCount,
      idle_connections: pool.idleCount,
      waiting_requests: pool.waitingCount
    };
  }
}

module.exports = new DatabaseConfig();
