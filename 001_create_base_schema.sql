-- PostgreSQL/TimescaleDB Migration: Base Schema
-- Migrer fra SQLite til PostgreSQL med TimescaleDB optimering
-- Dato: 2025-09-16

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Enable additional extensions for enhanced functionality
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- for composite indexes

-- Create custom domains for common data types
CREATE DOMAIN positive_decimal AS DECIMAL(20,8) CHECK (VALUE >= 0);
CREATE DOMAIN percentage AS DECIMAL(5,2) CHECK (VALUE >= -100 AND VALUE <= 100);
CREATE DOMAIN confidence_score AS DECIMAL(3,2) CHECK (VALUE >= 0 AND VALUE <= 1);

-- Users table with enhanced security
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'api_only')),
    
    -- Security tracking
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMPTZ,
    last_password_change TIMESTAMPTZ DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- AI Agents table with enhanced configuration
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('coordinator', 'analyzer', 'risk_manager', 'executor', 'verifier', 'learner')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'error')),
    
    -- Configuration and performance
    config JSONB NOT NULL DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    
    -- Resource management
    cpu_limit DECIMAL(4,2) DEFAULT 1.0,
    memory_limit_mb INTEGER DEFAULT 1024,
    priority INTEGER DEFAULT 50 CHECK (priority >= 1 AND priority <= 100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_heartbeat TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Trading positions table with comprehensive tracking
CREATE TABLE trading_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    ai_agent_id UUID REFERENCES ai_agents(id),
    
    -- Position details
    exchange VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell', 'long', 'short')),
    position_type VARCHAR(20) DEFAULT 'spot' CHECK (position_type IN ('spot', 'futures', 'options')),
    
    -- Quantities and prices
    amount positive_decimal NOT NULL,
    entry_price positive_decimal NOT NULL,
    current_price positive_decimal,
    exit_price positive_decimal,
    
    -- P&L tracking
    unrealized_pnl DECIMAL(20,8) DEFAULT 0,
    realized_pnl DECIMAL(20,8) DEFAULT 0,
    fees DECIMAL(20,8) DEFAULT 0,
    
    -- Risk management
    stop_loss positive_decimal,
    take_profit positive_decimal,
    leverage DECIMAL(4,2) DEFAULT 1.0,
    
    -- Status and timing
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'partially_filled', 'cancelled')),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    
    -- Additional data
    metadata JSONB DEFAULT '{}'
);

-- Market data table - HYPERTABLE for time-series data
CREATE TABLE market_data (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    symbol VARCHAR(20) NOT NULL,
    
    -- Price data
    price positive_decimal NOT NULL,
    open_price positive_decimal,
    high_price positive_decimal,
    low_price positive_decimal,
    close_price positive_decimal,
    
    -- Volume and market cap
    volume positive_decimal,
    volume_24h positive_decimal,
    market_cap positive_decimal,
    
    -- Price changes
    price_change_24h percentage,
    price_change_7d percentage,
    price_change_30d percentage,
    
    -- Data source and quality
    source VARCHAR(50) NOT NULL,
    data_quality DECIMAL(3,2) DEFAULT 1.0,
    
    -- Additional metrics
    bid_price positive_decimal,
    ask_price positive_decimal,
    spread DECIMAL(10,6),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Convert market_data to hypertable
SELECT create_hypertable('market_data', 'time', 
    chunk_time_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- AI decisions table - HYPERTABLE for time-series data
CREATE TABLE ai_decisions (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id),
    
    -- Decision details
    decision_type VARCHAR(50) NOT NULL,
    decision_action VARCHAR(100),
    confidence confidence_score NOT NULL,
    
    -- Input and output
    input_data JSONB,
    output_data JSONB,
    reasoning TEXT,
    
    -- Execution
    execution_status VARCHAR(20) DEFAULT 'pending' CHECK (execution_status IN ('pending', 'executed', 'failed', 'cancelled')),
    execution_time_ms INTEGER,
    
    -- Results
    success BOOLEAN,
    error_message TEXT,
    
    -- Performance tracking
    accuracy_score DECIMAL(3,2),
    impact_score DECIMAL(10,6),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Convert ai_decisions to hypertable
SELECT create_hypertable('ai_decisions', 'time', 
    chunk_time_interval => INTERVAL '6 hours',
    if_not_exists => TRUE
);

-- Security events table
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Event details
    description TEXT,
    source_ip INET,
    user_agent TEXT,
    user_id UUID REFERENCES users(id),
    
    -- Response
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Additional data
    metadata JSONB DEFAULT '{}'
);

-- System metrics table - HYPERTABLE for time-series data
CREATE TABLE system_metrics (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(20,6) NOT NULL,
    
    -- Metadata
    unit VARCHAR(20),
    category VARCHAR(50),
    source VARCHAR(50),
    
    -- Aggregation support
    aggregation_period VARCHAR(20), -- e.g., '1m', '5m', '1h', '1d'
    
    -- Additional data
    metadata JSONB DEFAULT '{}'
);

-- Convert system_metrics to hypertable
SELECT create_hypertable('system_metrics', 'time', 
    chunk_time_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Black swan tests table
CREATE TABLE black_swan_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_name VARCHAR(100) NOT NULL,
    scenario TEXT NOT NULL,
    
    -- Test configuration
    parameters JSONB,
    expected_outcome JSONB,
    
    -- Results
    actual_result JSONB,
    passed BOOLEAN,
    execution_time_ms INTEGER,
    
    -- Performance impact
    system_impact JSONB,
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for optimal performance
-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_role ON users(role);

-- AI Agents indexes
CREATE INDEX idx_ai_agents_type ON ai_agents(type);
CREATE INDEX idx_ai_agents_status ON ai_agents(status);
CREATE INDEX idx_ai_agents_priority ON ai_agents(priority DESC);

-- Trading positions indexes
CREATE INDEX idx_trading_positions_user_id ON trading_positions(user_id);
CREATE INDEX idx_trading_positions_symbol ON trading_positions(symbol);
CREATE INDEX idx_trading_positions_status ON trading_positions(status);
CREATE INDEX idx_trading_positions_opened_at ON trading_positions(opened_at DESC);
CREATE INDEX idx_trading_positions_exchange_symbol ON trading_positions(exchange, symbol);

-- Market data indexes (time-series optimized)
CREATE INDEX idx_market_data_symbol_time ON market_data(symbol, time DESC);
CREATE INDEX idx_market_data_source ON market_data(source);
CREATE INDEX idx_market_data_price ON market_data(price);

-- AI decisions indexes (time-series optimized)
CREATE INDEX idx_ai_decisions_agent_time ON ai_decisions(agent_id, time DESC);
CREATE INDEX idx_ai_decisions_type ON ai_decisions(decision_type);
CREATE INDEX idx_ai_decisions_confidence ON ai_decisions(confidence DESC);

-- Security events indexes
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX idx_security_events_resolved ON security_events(resolved) WHERE resolved = false;

-- System metrics indexes (time-series optimized)
CREATE INDEX idx_system_metrics_name_time ON system_metrics(metric_name, time DESC);
CREATE INDEX idx_system_metrics_category ON system_metrics(category);

-- Black swan tests indexes
CREATE INDEX idx_black_swan_tests_name ON black_swan_tests(test_name);
CREATE INDEX idx_black_swan_tests_passed ON black_swan_tests(passed);
CREATE INDEX idx_black_swan_tests_executed_at ON black_swan_tests(executed_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_market_data_symbol_source_time ON market_data(symbol, source, time DESC);
CREATE INDEX idx_ai_decisions_agent_type_time ON ai_decisions(agent_id, decision_type, time DESC);
CREATE INDEX idx_trading_positions_user_status_opened ON trading_positions(user_id, status, opened_at DESC);

-- GIN indexes for JSONB columns for fast JSON queries
CREATE INDEX idx_users_metadata_gin ON users USING GIN(metadata);
CREATE INDEX idx_ai_agents_config_gin ON ai_agents USING GIN(config);
CREATE INDEX idx_ai_agents_metrics_gin ON ai_agents USING GIN(performance_metrics);
CREATE INDEX idx_trading_positions_metadata_gin ON trading_positions USING GIN(metadata);
CREATE INDEX idx_market_data_metadata_gin ON market_data USING GIN(metadata);
CREATE INDEX idx_ai_decisions_input_gin ON ai_decisions USING GIN(input_data);
CREATE INDEX idx_ai_decisions_output_gin ON ai_decisions USING GIN(output_data);
CREATE INDEX idx_security_events_metadata_gin ON security_events USING GIN(metadata);
CREATE INDEX idx_system_metrics_metadata_gin ON system_metrics USING GIN(metadata);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts with enhanced security tracking';
COMMENT ON TABLE ai_agents IS 'AI agent definitions and configurations';
COMMENT ON TABLE trading_positions IS 'Active and historical trading positions';
COMMENT ON TABLE market_data IS 'Time-series market data (TimescaleDB hypertable)';
COMMENT ON TABLE ai_decisions IS 'Time-series AI decision logs (TimescaleDB hypertable)';
COMMENT ON TABLE security_events IS 'Security events and incident tracking';
COMMENT ON TABLE system_metrics IS 'Time-series system performance metrics (TimescaleDB hypertable)';
COMMENT ON TABLE black_swan_tests IS 'Stress testing and black swan event simulations';

-- Create views for common queries
CREATE VIEW active_positions AS
SELECT 
    p.*,
    u.username,
    a.name as agent_name,
    m.price as current_market_price
FROM trading_positions p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN ai_agents a ON p.ai_agent_id = a.id
LEFT JOIN LATERAL (
    SELECT price 
    FROM market_data 
    WHERE symbol = p.symbol 
    ORDER BY time DESC 
    LIMIT 1
) m ON true
WHERE p.status = 'open';

COMMENT ON VIEW active_positions IS 'All open trading positions with current market prices';

-- Migration completed successfully message
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL/TimescaleDB schema migration completed successfully!';
    RAISE NOTICE 'Created % tables with TimescaleDB hypertables for time-series data', 8;
    RAISE NOTICE 'TimescaleDB chunks will be created automatically with optimal intervals';
END $$;
