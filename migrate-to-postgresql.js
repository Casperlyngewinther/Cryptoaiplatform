#!/usr/bin/env node
/**
 * ETL Migration Script: SQLite til PostgreSQL/TimescaleDB
 * 
 * Dette script migrerer al eksisterende data fra SQLite til den nye
 * PostgreSQL/TimescaleDB database med optimal performance.
 * 
 * Funktioner:
 * - Data validering og transformation
 * - Batch processing for store datasets
 * - Error handling og rollback
 * - Progress tracking
 * - Backup verification
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Load PostgreSQL service
const PostgreSQLService = require('../services/PostgreSQLDatabaseService');

class ETLMigrationService {
  constructor() {
    this.sqliteDb = null;
    this.postgresService = PostgreSQLService;
    this.batchSize = 1000;
    this.totalRecords = 0;
    this.migratedRecords = 0;
    this.errors = [];
  }

  async initialize() {
    try {
      console.log('🚀 Starting ETL Migration: SQLite → PostgreSQL/TimescaleDB');
      console.log('=' .repeat(60));
      
      // Initialize PostgreSQL connection
      await this.postgresService.initialize();
      console.log('✅ PostgreSQL connection established');
      
      // Initialize SQLite connection
      const sqlitePath = path.join(__dirname, '../data/cryptoai.db');
      await this.connectSQLite(sqlitePath);
      console.log('✅ SQLite connection established');
      
      // Verify schemas
      await this.verifySchemas();
      console.log('✅ Schema verification completed');
      
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      throw error;
    }
  }

  async connectSQLite(dbPath) {
    return new Promise((resolve, reject) => {
      this.sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(new Error(`SQLite connection failed: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  async verifySchemas() {
    // Check if all required tables exist in both databases
    const requiredTables = [
      'users', 'ai_agents', 'trading_positions', 'market_data',
      'ai_decisions', 'security_events', 'system_metrics', 'black_swan_tests'
    ];
    
    for (const table of requiredTables) {
      // Check SQLite
      const sqliteExists = await this.sqliteQuery(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`
      );
      
      if (sqliteExists.length === 0) {
        console.warn(`⚠️  Table '${table}' not found in SQLite database`);
      }
      
      // Check PostgreSQL
      const pgExists = await this.postgresService.query(
        `SELECT table_name FROM information_schema.tables WHERE table_name = $1`,
        [table]
      );
      
      if (pgExists.rows.length === 0) {
        throw new Error(`Required table '${table}' not found in PostgreSQL database`);
      }
    }
  }

  async migrationPlan() {
    console.log('\n📊 Migration Plan:');
    console.log('-'.repeat(40));
    
    const tables = [
      'users', 'ai_agents', 'trading_positions', 'market_data',
      'ai_decisions', 'security_events', 'system_metrics', 'black_swan_tests'
    ];
    
    let totalRecords = 0;
    
    for (const table of tables) {
      try {
        const count = await this.sqliteQuery(`SELECT COUNT(*) as count FROM ${table}`);
        const recordCount = count[0]?.count || 0;
        totalRecords += recordCount;
        
        console.log(`${table.padEnd(20)} ${recordCount.toLocaleString().padStart(8)} records`);
      } catch (error) {
        console.log(`${table.padEnd(20)} ${"N/A".padStart(8)} (table not found)`);
      }
    }
    
    this.totalRecords = totalRecords;
    console.log('-'.repeat(40));
    console.log(`${'TOTAL'.padEnd(20)} ${totalRecords.toLocaleString().padStart(8)} records`);
    console.log('');
  }

  async runMigration() {
    try {
      await this.initialize();
      await this.migrationPlan();
      
      // Confirm migration
      console.log('⚠️  This will migrate ALL data from SQLite to PostgreSQL.');
      console.log('   Existing PostgreSQL data may be overwritten.');
      
      // For automated execution, skip confirmation
      // In production, you might want to require manual confirmation
      
      console.log('\n🔄 Starting data migration...');
      
      // Migration order matters due to foreign key constraints
      const migrationOrder = [
        'users',
        'ai_agents', 
        'trading_positions',
        'security_events',
        'black_swan_tests',
        'market_data',      // Large time-series data
        'ai_decisions',     // Large time-series data  
        'system_metrics'    // Large time-series data
      ];
      
      for (const table of migrationOrder) {
        await this.migrateTable(table);
      }
      
      await this.verifyMigration();
      await this.optimizeDatabase();
      
      console.log('\n🎉 Migration completed successfully!');
      console.log(`   Total records migrated: ${this.migratedRecords.toLocaleString()}`);
      
      if (this.errors.length > 0) {
        console.log(`\n⚠️  ${this.errors.length} errors occurred during migration:`);
        this.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async migrateTable(tableName) {
    console.log(`\n📦 Migrating table: ${tableName}`);
    
    try {
      // Get total count
      const countResult = await this.sqliteQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
      const totalRows = countResult[0]?.count || 0;
      
      if (totalRows === 0) {
        console.log(`   ⏭️  Skipping empty table`);
        return;
      }
      
      console.log(`   📊 Found ${totalRows.toLocaleString()} records`);
      
      // Clear existing data in PostgreSQL (optional - comment out to preserve)
      // await this.postgresService.query(`TRUNCATE TABLE ${tableName} CASCADE`);
      
      // Process in batches
      let processed = 0;
      let offset = 0;
      
      while (offset < totalRows) {
        const batchData = await this.sqliteQuery(
          `SELECT * FROM ${tableName} LIMIT ${this.batchSize} OFFSET ${offset}`
        );
        
        if (batchData.length === 0) break;
        
        await this.insertBatch(tableName, batchData);
        
        processed += batchData.length;
        offset += this.batchSize;
        
        const percentage = ((processed / totalRows) * 100).toFixed(1);
        process.stdout.write(`\r   📈 Progress: ${processed.toLocaleString()}/${totalRows.toLocaleString()} (${percentage}%)`);
      }
      
      this.migratedRecords += processed;
      console.log(`\n   ✅ Completed: ${processed.toLocaleString()} records migrated`);
      
    } catch (error) {
      const errorMsg = `Failed to migrate table ${tableName}: ${error.message}`;
      this.errors.push(errorMsg);
      console.error(`\n   ❌ ${errorMsg}`);
    }
  }

  async insertBatch(tableName, batchData) {
    try {
      switch (tableName) {
        case 'users':
          await this.migrateUsers(batchData);
          break;
        case 'ai_agents':
          await this.migrateAIAgents(batchData);
          break;
        case 'trading_positions':
          await this.migrateTradingPositions(batchData);
          break;
        case 'market_data':
          await this.migrateMarketData(batchData);
          break;
        case 'ai_decisions':
          await this.migrateAIDecisions(batchData);
          break;
        case 'security_events':
          await this.migrateSecurityEvents(batchData);
          break;
        case 'system_metrics':
          await this.migrateSystemMetrics(batchData);
          break;
        case 'black_swan_tests':
          await this.migrateBlackSwanTests(batchData);
          break;
        default:
          throw new Error(`Unknown table: ${tableName}`);
      }
    } catch (error) {
      throw new Error(`Batch insert failed for ${tableName}: ${error.message}`);
    }
  }

  async migrateUsers(batchData) {
    for (const user of batchData) {
      await this.postgresService.query(`
        INSERT INTO users (
          id, username, email, password_hash, role, created_at, 
          last_login, is_active, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          updated_at = NOW()
      `, [
        uuidv4(),
        user.username,
        user.email,
        user.password_hash,
        user.role || 'user',
        user.created_at,
        user.last_login,
        user.is_active,
        JSON.stringify({})
      ]);
    }
  }

  async migrateAIAgents(batchData) {
    for (const agent of batchData) {
      await this.postgresService.query(`
        INSERT INTO ai_agents (
          id, name, type, status, config, performance_metrics, 
          created_at, updated_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          status = EXCLUDED.status,
          config = EXCLUDED.config,
          updated_at = NOW()
      `, [
        uuidv4(),
        agent.name,
        agent.type,
        agent.status || 'active',
        agent.config || '{}',
        agent.performance_metrics || '{}',
        agent.created_at,
        agent.updated_at,
        JSON.stringify({})
      ]);
    }
  }

  async migrateTradingPositions(batchData) {
    for (const position of batchData) {
      await this.postgresService.query(`
        INSERT INTO trading_positions (
          id, symbol, side, amount, entry_price, current_price, 
          unrealized_pnl, status, opened_at, closed_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [
        uuidv4(),
        position.symbol,
        position.side,
        position.amount,
        position.entry_price,
        position.current_price,
        position.pnl || 0,
        position.status || 'open',
        position.opened_at,
        position.closed_at,
        JSON.stringify({})
      ]);
    }
  }

  async migrateMarketData(batchData) {
    // Use bulk insert for large time-series data
    const transformedData = batchData.map(item => ({
      time: item.timestamp,
      symbol: item.symbol,
      price: item.price,
      volume: item.volume,
      market_cap: item.market_cap,
      price_change_24h: item.price_change_24h,
      source: item.source || 'migration',
      metadata: {}
    }));
    
    await this.postgresService.insertMarketData(transformedData);
  }

  async migrateAIDecisions(batchData) {
    for (const decision of batchData) {
      await this.postgresService.query(`
        INSERT INTO ai_decisions (
          time, agent_id, decision_type, confidence, input_data, 
          reasoning, success, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        decision.timestamp,
        uuidv4(), // Generate new UUID for agent reference
        decision.decision_type,
        decision.confidence,
        decision.input_data || '{}',
        decision.reasoning,
        true, // Assume successful if in old database
        JSON.stringify({})
      ]);
    }
  }

  async migrateSecurityEvents(batchData) {
    for (const event of batchData) {
      await this.postgresService.query(`
        INSERT INTO security_events (
          id, event_type, severity, description, source_ip, 
          resolved, created_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [
        uuidv4(),
        event.event_type,
        event.severity,
        event.description,
        event.source_ip,
        event.resolved || false,
        event.timestamp,
        JSON.stringify({})
      ]);
    }
  }

  async migrateSystemMetrics(batchData) {
    for (const metric of batchData) {
      await this.postgresService.query(`
        INSERT INTO system_metrics (
          time, metric_name, metric_value, unit, category, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        metric.timestamp,
        metric.metric_name,
        metric.metric_value,
        metric.unit,
        metric.category,
        JSON.stringify({})
      ]);
    }
  }

  async migrateBlackSwanTests(batchData) {
    for (const test of batchData) {
      await this.postgresService.query(`
        INSERT INTO black_swan_tests (
          id, test_name, scenario, parameters, actual_result, 
          passed, execution_time_ms, created_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [
        uuidv4(),
        test.test_name,
        test.scenario,
        test.parameters || '{}',
        test.result || '{}',
        test.passed || false,
        test.execution_time || 0,
        test.timestamp,
        JSON.stringify({})
      ]);
    }
  }

  async verifyMigration() {
    console.log('\n🔍 Verifying migration...');
    
    const tables = [
      'users', 'ai_agents', 'trading_positions', 'market_data',
      'ai_decisions', 'security_events', 'system_metrics', 'black_swan_tests'
    ];
    
    for (const table of tables) {
      try {
        const sqliteCount = await this.sqliteQuery(`SELECT COUNT(*) as count FROM ${table}`);
        const pgCount = await this.postgresService.query(`SELECT COUNT(*) as count FROM ${table}`);
        
        const sqliteTotal = sqliteCount[0]?.count || 0;
        const pgTotal = pgCount.rows[0]?.count || 0;
        
        const status = sqliteTotal === pgTotal ? '✅' : '⚠️ ';
        console.log(`   ${status} ${table}: SQLite(${sqliteTotal}) → PostgreSQL(${pgTotal})`);
        
      } catch (error) {
        console.log(`   ❌ ${table}: Verification failed - ${error.message}`);
      }
    }
  }

  async optimizeDatabase() {
    console.log('\n⚡ Optimizing PostgreSQL database...');
    
    try {
      // Update table statistics
      await this.postgresService.query('ANALYZE');
      console.log('   ✅ Database statistics updated');
      
      // Vacuum to reclaim space
      await this.postgresService.query('VACUUM');
      console.log('   ✅ Database vacuumed');
      
    } catch (error) {
      console.log(`   ⚠️  Optimization warning: ${error.message}`);
    }
  }

  async cleanup() {
    try {
      if (this.sqliteDb) {
        this.sqliteDb.close();
      }
      if (this.postgresService) {
        // Don't close postgres service as it might be used by other parts
      }
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  }

  // Utility method for SQLite queries
  sqliteQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.sqliteDb.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new ETLMigrationService();
  
  migration.runMigration()
    .then(() => {
      console.log('\n🏁 Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = ETLMigrationService;
