-- TimescaleDB Continuous Aggregates Setup
-- Opret kontinuerlige aggregeringer for optimal query performance

-- Enable continuous aggregates for market data
CREATE MATERIALIZED VIEW market_data_1m
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', time) AS bucket,
    symbol,
    first(price, time) AS open_price,
    max(price) AS high_price,
    min(price) AS low_price,
    last(price, time) AS close_price,
    avg(price) AS avg_price,
    sum(volume) AS total_volume,
    count(*) AS data_points,
    stddev(price) AS price_volatility
FROM market_data
GROUP BY bucket, symbol;

CREATE MATERIALIZED VIEW market_data_5m
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('5 minutes', time) AS bucket,
    symbol,
    first(price, time) AS open_price,
    max(price) AS high_price,
    min(price) AS low_price,
    last(price, time) AS close_price,
    avg(price) AS avg_price,
    sum(volume) AS total_volume,
    count(*) AS data_points,
    stddev(price) AS price_volatility
FROM market_data
GROUP BY bucket, symbol;

CREATE MATERIALIZED VIEW market_data_1h
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    symbol,
    first(price, time) AS open_price,
    max(price) AS high_price,
    min(price) AS low_price,
    last(price, time) AS close_price,
    avg(price) AS avg_price,
    sum(volume) AS total_volume,
    count(*) AS data_points,
    stddev(price) AS price_volatility,
    
    -- Advanced metrics
    (last(price, time) - first(price, time)) / first(price, time) * 100 AS price_change_pct,
    (max(price) - min(price)) / min(price) * 100 AS price_range_pct
FROM market_data
GROUP BY bucket, symbol;

CREATE MATERIALIZED VIEW market_data_1d
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    symbol,
    first(price, time) AS open_price,
    max(price) AS high_price,
    min(price) AS low_price,
    last(price, time) AS close_price,
    avg(price) AS avg_price,
    sum(volume) AS total_volume,
    count(*) AS data_points,
    stddev(price) AS price_volatility,
    
    -- Daily metrics
    (last(price, time) - first(price, time)) / first(price, time) * 100 AS daily_change_pct,
    (max(price) - min(price)) / min(price) * 100 AS daily_range_pct,
    
    -- Volume metrics
    avg(volume) AS avg_volume,
    max(volume) AS max_volume
FROM market_data
GROUP BY bucket, symbol;

-- Continuous aggregates for AI decisions
CREATE MATERIALIZED VIEW ai_decisions_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    agent_id,
    decision_type,
    count(*) AS total_decisions,
    avg(confidence) AS avg_confidence,
    sum(CASE WHEN success = true THEN 1 ELSE 0 END) AS successful_decisions,
    sum(CASE WHEN success = false THEN 1 ELSE 0 END) AS failed_decisions,
    avg(execution_time_ms) AS avg_execution_time
FROM ai_decisions
GROUP BY bucket, agent_id, decision_type;

-- System metrics aggregates
CREATE MATERIALIZED VIEW system_metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    metric_name,
    category,
    avg(metric_value) AS avg_value,
    min(metric_value) AS min_value,
    max(metric_value) AS max_value,
    stddev(metric_value) AS stddev_value,
    count(*) AS data_points
FROM system_metrics
GROUP BY bucket, metric_name, category;

-- Add refresh policies for continuous aggregates
SELECT add_continuous_aggregate_policy('market_data_1m',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '1 minute');

SELECT add_continuous_aggregate_policy('market_data_5m',
    start_offset => INTERVAL '6 hours',
    end_offset => INTERVAL '10 minutes',
    schedule_interval => INTERVAL '5 minutes');

SELECT add_continuous_aggregate_policy('market_data_1h',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

SELECT add_continuous_aggregate_policy('market_data_1d',
    start_offset => INTERVAL '7 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');

SELECT add_continuous_aggregate_policy('ai_decisions_hourly',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

SELECT add_continuous_aggregate_policy('system_metrics_hourly',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Create indexes on continuous aggregates
CREATE INDEX idx_market_data_1m_symbol_bucket ON market_data_1m (symbol, bucket DESC);
CREATE INDEX idx_market_data_5m_symbol_bucket ON market_data_5m (symbol, bucket DESC);
CREATE INDEX idx_market_data_1h_symbol_bucket ON market_data_1h (symbol, bucket DESC);
CREATE INDEX idx_market_data_1d_symbol_bucket ON market_data_1d (symbol, bucket DESC);

CREATE INDEX idx_ai_decisions_hourly_agent_bucket ON ai_decisions_hourly (agent_id, bucket DESC);
CREATE INDEX idx_system_metrics_hourly_name_bucket ON system_metrics_hourly (metric_name, bucket DESC);

-- Create helpful views for common queries
CREATE VIEW latest_market_prices AS
SELECT DISTINCT ON (symbol)
    symbol,
    time,
    price,
    volume,
    price_change_24h,
    source
FROM market_data
ORDER BY symbol, time DESC;

CREATE VIEW trading_performance_summary AS
SELECT
    COUNT(*) AS total_positions,
    COUNT(CASE WHEN status = 'open' THEN 1 END) AS open_positions,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed_positions,
    SUM(realized_pnl) AS total_realized_pnl,
    SUM(unrealized_pnl) AS total_unrealized_pnl,
    AVG(CASE WHEN status = 'closed' THEN realized_pnl END) AS avg_trade_pnl,
    COUNT(CASE WHEN realized_pnl > 0 THEN 1 END) AS winning_trades,
    COUNT(CASE WHEN realized_pnl < 0 THEN 1 END) AS losing_trades
FROM trading_positions;

CREATE VIEW ai_agent_performance AS
SELECT
    a.id,
    a.name,
    a.type,
    a.status,
    COUNT(d.id) AS total_decisions,
    AVG(d.confidence) AS avg_confidence,
    SUM(CASE WHEN d.success = true THEN 1 ELSE 0 END) AS successful_decisions,
    SUM(CASE WHEN d.success = false THEN 1 ELSE 0 END) AS failed_decisions,
    CASE 
        WHEN COUNT(d.id) > 0 THEN 
            ROUND(SUM(CASE WHEN d.success = true THEN 1 ELSE 0 END)::DECIMAL / COUNT(d.id) * 100, 2)
        ELSE 0
    END AS success_rate_pct
FROM ai_agents a
LEFT JOIN ai_decisions d ON a.id = d.agent_id
GROUP BY a.id, a.name, a.type, a.status;

-- Comments for documentation
COMMENT ON MATERIALIZED VIEW market_data_1m IS 'Continuous aggregate: 1-minute OHLCV data';
COMMENT ON MATERIALIZED VIEW market_data_5m IS 'Continuous aggregate: 5-minute OHLCV data';
COMMENT ON MATERIALIZED VIEW market_data_1h IS 'Continuous aggregate: 1-hour OHLCV data with advanced metrics';
COMMENT ON MATERIALIZED VIEW market_data_1d IS 'Continuous aggregate: Daily OHLCV data with comprehensive metrics';
COMMENT ON MATERIALIZED VIEW ai_decisions_hourly IS 'Continuous aggregate: Hourly AI decision performance metrics';
COMMENT ON MATERIALIZED VIEW system_metrics_hourly IS 'Continuous aggregate: Hourly system performance metrics';

COMMENT ON VIEW latest_market_prices IS 'Latest price for each symbol';
COMMENT ON VIEW trading_performance_summary IS 'Overall trading performance summary';
COMMENT ON VIEW ai_agent_performance IS 'AI agent performance metrics with success rates';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'TimescaleDB continuous aggregates and views created successfully!';
    RAISE NOTICE 'Performance optimization setup completed';
END $$;
