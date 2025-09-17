/**
 * PostgreSQL DatabaseService med TimescaleDB optimering
 * Erstatter SQLite DatabaseService med robuste features:
 * - Connection pooling
 * - Tidserie optimering
 * - Fejlhåndtering og retry logik
 * - Query optimering
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const DatabaseConfig = require('../config/database');

class PostgreSQLDatabaseService {
  constructor() {
    this.primaryPool = null;
    this.analyticsPool = null;
    this.isReady = false;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // ms
  }

  async initialize() {
    try {
      console.log('Initializing PostgreSQL database connections...');
      
      // Initialize primary connection pool
      this.primaryPool = DatabaseConfig.getPool('primary');
      
      // Test primary connection
      const testResult = await DatabaseConfig.testConnection('primary');
      if (!testResult.success) {
        throw new Error(`Primary database connection failed: ${testResult.error}`);
      }
      
      console.log(`Connected to PostgreSQL database: ${testResult.version}`);
      
      // Initialize analytics pool if configured
      try {
        this.analyticsPool = DatabaseConfig.getPool('analytics');
        const analyticsTest = await DatabaseConfig.testConnection('analytics');
        if (analyticsTest.success) {
          console.log('Analytics read replica connected successfully');
        }
      } catch (error) {
        console.warn('Analytics database not available, using primary:', error.message);
        this.analyticsPool = this.primaryPool;
      }
      
      // Run migrations if needed
      await this.runMigrations();
      
      // Setup TimescaleDB features
      await this.setupTimescaleFeatures();
      
      this.isReady = true;
      console.log('Database initialization completed successfully');
      
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Kør database migrationer automatisk
   */
  async runMigrations() {
    try {
      // Check if migrations table exists
      const migrationTableExists = await this.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'schema_migrations'
        )
      `);
      
      if (!migrationTableExists.rows[0].exists) {
        // Create migrations tracking table
        await this.query(`
          CREATE TABLE schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
      }
      
      // Run pending migrations
      const migrationsDir = path.join(__dirname, '..', 'migrations');
      const migrationFiles = await fs.readdir(migrationsDir);
      
      for (const file of migrationFiles.sort()) {
        if (file.endsWith('.sql')) {
          const version = file.replace('.sql', '');
          
          // Check if migration already applied
          const applied = await this.query(
            'SELECT version FROM schema_migrations WHERE version = $1',
            [version]
          );
          
          if (applied.rows.length === 0) {
            console.log(`Applying migration: ${version}`);
            
            const migrationSQL = await fs.readFile(
              path.join(migrationsDir, file),
              'utf8'
            );
            
            await this.transaction(async (client) => {
              await client.query(migrationSQL);
              await client.query(
                'INSERT INTO schema_migrations (version) VALUES ($1)',
                [version]
              );
            });
            
            console.log(`Migration ${version} applied successfully`);
          }
        }
      }
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Setup TimescaleDB-specifikke features
   */
  async setupTimescaleFeatures() {
    try {
      // Enable automatic compression for hypertables
      const config = DatabaseConfig.config.primary.timescaledb;
      
      if (config.enabled && config.compression.enabled) {
        await this.query(`
          SELECT add_compression_policy('market_data', INTERVAL '${config.compression.compress_after}');
        `);
        
        await this.query(`
          SELECT add_compression_policy('ai_decisions', INTERVAL '${config.compression.compress_after}');
        `);
        
        await this.query(`
          SELECT add_compression_policy('system_metrics', INTERVAL '${config.compression.compress_after}');
        `);
        
        console.log('TimescaleDB compression policies enabled');
      }
      
      // Setup retention policies
      if (config.enabled && config.retention.enabled) {
        await this.query(`
          SELECT add_retention_policy('market_data', INTERVAL '${config.retention.market_data_retention}');
        `);
        
        await this.query(`
          SELECT add_retention_policy('ai_decisions', INTERVAL '${config.retention.ai_decisions_retention}');
        `);
        
        await this.query(`
          SELECT add_retention_policy('system_metrics', INTERVAL '${config.retention.system_metrics_retention}');
        `);
        
        console.log('TimescaleDB retention policies enabled');
      }
      
    } catch (error) {
      // TimescaleDB features are optional, log warning but don't fail
      console.warn('TimescaleDB feature setup failed:', error.message);
    }
  }

  /**
   * Udfør query med retry logik
   */
  async query(text, params = [], useAnalytics = false) {
    const pool = useAnalytics ? this.analyticsPool : this.primaryPool;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const start = Date.now();
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        // Log slow queries
        if (duration > 1000) {
          console.warn(`Slow query detected (${duration}ms):`, text.substring(0, 100));
        }
        
        return result;
      } catch (error) {
        if (attempt === this.retryAttempts) {
          console.error('Query failed after all retries:', { text, params, error: error.message });
          throw error;
        }
        
        console.warn(`Query attempt ${attempt} failed, retrying:`, error.message);
        await this.sleep(this.retryDelay * attempt);
      }
    }
  }

  /**
   * Udfør single row query
   */
  async get(text, params = [], useAnalytics = false) {
    const result = await this.query(text, params, useAnalytics);
    return result.rows[0] || null;
  }

  /**
   * Udfør multiple rows query
   */
  async all(text, params = [], useAnalytics = false) {
    const result = await this.query(text, params, useAnalytics);
    return result.rows;
  }

  /**
   * Udfør transactional query
   */
  async run(text, params = []) {
    const result = await this.query(text, params);
    return {
      id: result.rows[0]?.id || null,
      changes: result.rowCount
    };
  }

  /**
   * Udfør database transaktion
   */
  async transaction(callback) {
    const client = await this.primaryPool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Bulk insert for tidserie data (optimeret for TimescaleDB)
   */
  async bulkInsert(table, columns, data) {
    if (!data || data.length === 0) return;
    
    const columnNames = columns.join(', ');
    const valueTemplates = data.map((_, index) => {
      const start = index * columns.length;
      const end = start + columns.length;
      const placeholders = Array.from({ length: columns.length }, (_, i) => `$${start + i + 1}`);
      return `(${placeholders.join(', ')})`;
    }).join(', ');
    
    const flatValues = data.flat();
    
    const query = `INSERT INTO ${table} (${columnNames}) VALUES ${valueTemplates}`;
    
    return await this.query(query, flatValues);
  }

  /**
   * Optimeret market data insertion
   */
  async insertMarketData(marketDataArray) {
    const columns = [
      'time', 'symbol', 'price', 'open_price', 'high_price', 'low_price', 'close_price',
      'volume', 'volume_24h', 'market_cap', 'price_change_24h', 'source', 'metadata'
    ];
    
    const data = marketDataArray.map(item => [
      item.time || new Date(),
      item.symbol,
      item.price,
      item.open_price || null,
      item.high_price || null,
      item.low_price || null,
      item.close_price || null,
      item.volume || null,
      item.volume_24h || null,
      item.market_cap || null,
      item.price_change_24h || null,
      item.source || 'unknown',
      JSON.stringify(item.metadata || {})
    ]);
    
    return await this.bulkInsert('market_data', columns, data);
  }

  /**
   * Optimeret AI decision logging
   */
  async logAIDecision(agentId, decisionType, confidence, data = {}) {
    return await this.query(`
      INSERT INTO ai_decisions (
        agent_id, decision_type, confidence, input_data, 
        reasoning, execution_status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      agentId,
      decisionType,
      confidence,
      JSON.stringify(data.input || {}),
      data.reasoning || null,
      data.status || 'pending',
      JSON.stringify(data.metadata || {})
    ]);
  }

  /**
   * Få seneste market data for symbol
   */
  async getLatestMarketData(symbol, limit = 100) {
    return await this.all(`
      SELECT * FROM market_data 
      WHERE symbol = $1 
      ORDER BY time DESC 
      LIMIT $2
    `, [symbol, limit], true); // Use analytics pool for reads
  }

  /**
   * Få aggregeret market data
   */
  async getAggregatedMarketData(symbol, interval = '1h', start = null, end = null) {
    let timeFilter = '';
    const params = [symbol, interval];
    
    if (start && end) {
      timeFilter = 'AND time >= $3 AND time <= $4';
      params.push(start, end);
    }
    
    return await this.all(`
      SELECT 
        time_bucket($2::interval, time) as bucket,
        symbol,
        first(price, time) as open_price,
        max(price) as high_price,
        min(price) as low_price,
        last(price, time) as close_price,
        avg(price) as avg_price,
        sum(volume) as total_volume,
        count(*) as data_points
      FROM market_data 
      WHERE symbol = $1 ${timeFilter}
      GROUP BY bucket, symbol
      ORDER BY bucket DESC
    `, params, true);
  }

  /**
   * Database health check
   */
  async healthCheck() {
    try {
      const primaryStats = DatabaseConfig.getPoolStats('primary');
      const analyticsStats = DatabaseConfig.getPoolStats('analytics');
      
      const result = await this.query('SELECT NOW() as timestamp, version() as version');
      
      return {
        healthy: true,
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].version,
        pools: {
          primary: primaryStats,
          analytics: analyticsStats
        },
        timescaledb: await this.checkTimescaleDB()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Check TimescaleDB status
   */
  async checkTimescaleDB() {
    try {
      const result = await this.query(`
        SELECT 
          extname,
          extversion
        FROM pg_extension 
        WHERE extname = 'timescaledb'
      `);
      
      if (result.rows.length > 0) {
        const hypertables = await this.query(`
          SELECT 
            hypertable_schema,
            hypertable_name,
            num_chunks,
            compression_enabled
          FROM timescaledb_information.hypertables
        `);
        
        return {
          enabled: true,
          version: result.rows[0].extversion,
          hypertables: hypertables.rows
        };
      }
      
      return { enabled: false };
    } catch (error) {
      return { enabled: false, error: error.message };
    }
  }

  /**
   * Cleanup old data baseret på retention policies
   */
  async cleanupOldData() {
    try {
      // Manual cleanup for non-TimescaleDB setups
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 12); // 12 months retention
      
      const result = await this.query(`
        DELETE FROM market_data 
        WHERE time < $1 
        AND NOT EXISTS (
          SELECT 1 FROM timescaledb_information.hypertables 
          WHERE hypertable_name = 'market_data'
        )
      `, [cutoffDate]);
      
      if (result.rowCount > 0) {
        console.log(`Cleaned up ${result.rowCount} old market data records`);
      }
      
    } catch (error) {
      console.warn('Data cleanup failed:', error.message);
    }
  }

  /**
   * Check if database is ready
   */
  isHealthy() {
    return this.isReady && this.primaryPool !== null;
  }

  /**
   * Graceful shutdown
   */
  async close() {
    try {
      this.isReady = false;
      await DatabaseConfig.closeAll();
      console.log('Database connections closed successfully');
    } catch (error) {
      console.error('Error closing database connections:', error);
      throw error;
    }
  }

  /**
   * Utility function for sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Legacy compatibility methods (for gradual migration)
   */
  
  // Backward compatibility for existing code
  async insertDefaultData() {
    // This is now handled by migrations, but kept for compatibility
    console.log('Default data insertion is now handled by migrations');
  }
}

module.exports = new PostgreSQLDatabaseService();
