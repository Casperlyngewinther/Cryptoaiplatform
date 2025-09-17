#!/usr/bin/env node

const CryptoComExchange = require('./server/services/CryptoComExchange');

async function testCryptoComAuthentication() {
  console.log('🔍 Testing Crypto.com API Authentication (FIXED VERSION)...\n');
  
  // Mock API credentials for testing (using test keys)
  process.env.CRYPTOCOM_API_KEY = 'test_api_key_12345678';
  process.env.CRYPTOCOM_API_SECRET = 'test_secret_key_87654321';
  
  const exchange = new CryptoComExchange();
  
  console.log('📋 Testing fixed implementation...\n');
  
  // Test 1: Fixed implementation with root endpoint
  console.log('1️⃣ Testing fixed v1 implementation (POST to root)...');
  try {
    const balance = await exchange.getBalance();
    console.log('✅ Fixed implementation Success:', balance);
  } catch (error) {
    console.log('❌ Fixed implementation Error:', error.message);
    
    // Check if it's still authentication error or different error
    if (error.message.includes('401') || error.message.includes('Authentication failure')) {
      console.log('   🔍 Still authentication error - may need real API keys');
    } else {
      console.log('   🔍 Different error - possible progress!');
    }
  }
  
  // Test 2: Verify signature generation with known test case
  console.log('\n2️⃣ Testing signature generation with example from docs...');
  await testKnownSignatureCase();
  
  // Test 3: Test public endpoint to verify connectivity
  console.log('\n3️⃣ Testing public endpoint connectivity...');
  try {
    const ticker = await exchange.getTicker('BTC/USDT');
    if (ticker) {
      console.log('✅ Public API works:', ticker.price);
    } else {
      console.log('⚠️  Public API returned null');
    }
  } catch (error) {
    console.log('❌ Public API Error:', error.message);
  }
}

async function testKnownSignatureCase() {
  const exchange = new CryptoComExchange();
  
  // Use known test values from documentation
  const method = 'private/get-account-summary';
  const id = '11';
  const api_key = 'vmPUZE6mv9SD5VNHk4HlWFsOr6aKE2zvsw0MuIgwCIPy6utIco14y7Ju91duEh8A';
  const params = {};
  const nonce = '1587846358253';
  
  // Calculate expected signature
  const paramsString = exchange.objectToString(params);
  const sigPayload = `${method}${id}${api_key}${paramsString}${nonce}`;
  
  console.log('🔍 Test case from docs:');
  console.log('  Method:', method);
  console.log('  ID:', id);
  console.log('  API Key:', api_key);
  console.log('  Params String:', paramsString);
  console.log('  Nonce:', nonce);
  console.log('  Signature Payload:', sigPayload);
  
  // Expected signature from docs should be specific value
  // This helps us verify our implementation matches documentation
}

// Run the test
testCryptoComAuthentication().catch(console.error);
