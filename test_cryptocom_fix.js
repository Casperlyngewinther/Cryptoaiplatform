#!/usr/bin/env node
// Test script for Crypto.com Exchange connection after fixes

// Manual environment loading
process.env.CRYPTOCOM_API_KEY = 'occPbLqTkumaaC8nef1iim';
process.env.CRYPTOCOM_API_SECRET = 'cxakp_skicB5hTXE2LivNV84AyQo';

const CryptoComExchange = require('./server/services/CryptoComExchange');

async function testCryptoComConnection() {
  console.log('🔧 Testing Fixed Crypto.com Exchange Connection...\n');
  
  // Test environment variables
  console.log('📋 Environment Check:');
  console.log(`   API Key: ${process.env.CRYPTOCOM_API_KEY ? 'Found' : 'Missing'}`);
  console.log(`   API Secret: ${process.env.CRYPTOCOM_API_SECRET ? 'Found' : 'Missing'}\n`);
  
  if (!process.env.CRYPTOCOM_API_KEY || !process.env.CRYPTOCOM_API_SECRET) {
    console.log('⚠️ Missing API credentials, but we can still test public data access\n');
  }
  
  // Create exchange instance
  const exchange = new CryptoComExchange();
  
  // Test connection
  console.log('🔗 Testing exchange initialization...');
  try {
    const connected = await exchange.initialize();
    console.log(`   Connection result: ${connected ? '✅ Success' : '❌ Failed'}\n`);
  } catch (error) {
    console.log(`   Connection error: ${error.message}\n`);
  }
  
  // Test market data fetching
  console.log('📊 Testing market data fetching...');
  const testSymbols = ['BTC/USDT', 'ETH/USDT', 'CRO/USDT'];
  
  for (const symbol of testSymbols) {
    try {
      const ticker = await exchange.getTicker(symbol);
      if (ticker) {
        console.log(`   ✅ ${symbol}: $${ticker.price} (${ticker.changePercent?.toFixed(2)}%)`);
      } else {
        console.log(`   ❌ ${symbol}: No data received`);
      }
    } catch (error) {
      console.log(`   ❌ ${symbol}: Error - ${error.message}`);
    }
  }
  
  console.log('\n🔍 Connection Status:');
  console.log(`   Is Connected: ${exchange.isConnected()}`);
  console.log(`   WebSocket Connected: ${exchange.isWebSocketConnected()}`);
  
  // Cleanup
  if (exchange.disconnect) {
    await exchange.disconnect();
  }
  
  console.log('\n✅ Test complete!');
}

testCryptoComConnection().catch(console.error);
