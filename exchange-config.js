/**
 * Exchange API Configuration
 * 
 * For security, API keys should be set via environment variables.
 * This file provides the structure and fallback configuration.
 * 
 * CRITICAL: NEVER commit real API keys to version control!
 */

module.exports = {
  // Binance Configuration
  binance: {
    enabled: process.env.BINANCE_ENABLED !== 'false', // Default enabled
    apiKey: process.env.BINANCE_API_KEY || null,
    apiSecret: process.env.BINANCE_API_SECRET || null,
    sandbox: process.env.BINANCE_SANDBOX === 'true', // Default live trading
    features: ['spot', 'futures', 'websocket', 'trading'],
    description: 'Binance - Største globale cryptocurrency exchange'
  },

  // Coinbase Pro Configuration
  coinbase: {
    enabled: process.env.COINBASE_ENABLED !== 'false',
    apiKey: process.env.COINBASE_API_KEY || null,
    apiSecret: process.env.COINBASE_API_SECRET || null,
    passphrase: process.env.COINBASE_PASSPHRASE || null,
    sandbox: process.env.COINBASE_SANDBOX === 'true',
    features: ['spot', 'websocket', 'trading'],
    description: 'Coinbase Pro - Professionel trading platform'
  },

  // KuCoin Configuration
  kucoin: {
    enabled: process.env.KUCOIN_ENABLED !== 'false',
    apiKey: process.env.KUCOIN_API_KEY || null,
    apiSecret: process.env.KUCOIN_API_SECRET || null,
    passphrase: process.env.KUCOIN_PASSPHRASE || null,
    sandbox: process.env.KUCOIN_SANDBOX === 'true',
    features: ['spot', 'futures', 'websocket', 'trading'],
    description: 'KuCoin - Avanceret cryptocurrency exchange'
  },

  // OKX Configuration
  okx: {
    enabled: process.env.OKX_ENABLED !== 'false',
    apiKey: process.env.OKX_API_KEY || null,
    apiSecret: process.env.OKX_API_SECRET || null,
    passphrase: process.env.OKX_PASSPHRASE || null,
    sandbox: process.env.OKX_SANDBOX === 'true',
    features: ['spot', 'futures', 'options', 'websocket', 'trading'],
    description: 'OKX - Multi-asset trading platform'
  },

  // Bybit Configuration
  bybit: {
    enabled: process.env.BYBIT_ENABLED !== 'false',
    apiKey: process.env.BYBIT_API_KEY || null,
    apiSecret: process.env.BYBIT_API_SECRET || null,
    sandbox: process.env.BYBIT_SANDBOX === 'true',
    features: ['spot', 'futures', 'options', 'websocket', 'trading'],
    description: 'Bybit - Derivatives og spot trading'
  },

  // Crypto.com Configuration (existing)
  cryptocom: {
    enabled: process.env.CRYPTOCOM_ENABLED !== 'false',
    apiKey: process.env.CRYPTOCOM_API_KEY || 'occPbLqTkumaaC8nef1iim',
    apiSecret: process.env.CRYPTOCOM_API_SECRET || 'cxakp_skicB5hTXE2LivNV84AyQo',
    sandbox: process.env.CRYPTOCOM_SANDBOX === 'true',
    features: ['spot', 'websocket', 'trading'],
    description: 'Crypto.com - Main exchange (configured)'
  },

  // Global settings
  global: {
    // Default connection timeout in ms
    connectionTimeout: parseInt(process.env.EXCHANGE_TIMEOUT) || 10000,
    // Retry attempts for failed connections
    retryAttempts: parseInt(process.env.EXCHANGE_RETRY_ATTEMPTS) || 3,
    // Enable graceful degradation mode
    gracefulDegradation: process.env.GRACEFUL_DEGRADATION !== 'false',
    // Silent mode (suppress connection warnings)
    silentMode: process.env.EXCHANGE_SILENT_MODE === 'true'
  }
};

/**
 * Hjælpefunktion til at validere exchange konfiguration
 */
function validateExchangeConfig(exchangeName, config) {
  if (!config.enabled) {
    return { valid: false, reason: 'disabled' };
  }

  const required = ['apiKey', 'apiSecret'];
  
  // Tilføj passphrase for exchanges der kræver det
  if (['coinbase', 'kucoin', 'okx'].includes(exchangeName)) {
    required.push('passphrase');
  }

  const missing = required.filter(field => !config[field]);
  
  if (missing.length > 0) {
    return { valid: false, reason: 'missing_credentials', missing };
  }

  return { valid: true };
}

module.exports.validateExchangeConfig = validateExchangeConfig;
