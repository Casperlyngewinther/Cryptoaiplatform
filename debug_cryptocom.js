// Debug script for Crypto.com Exchange connection
// This will help us identify why the wallet isn't showing

// Load environment variables manually
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        process.env[key.trim()] = value.trim();
      }
    });
    
    console.log('✅ Loaded .env file');
  } catch (error) {
    console.log('❌ Could not load .env file:', error.message);
  }
}

loadEnvFile();

// Import crypto module for HMAC signatures
const crypto = require('crypto');

// Simple fetch implementation for Node.js
const https = require('https');
const { URL } = require('url');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

console.log('🔍 Crypto.com Exchange Debug Tool');
console.log('='.repeat(40));

// Check environment variables
const apiKey = process.env.CRYPTO_COM_API_KEY;
const apiSecret = process.env.CRYPTO_COM_API_SECRET;

console.log('📋 Environment Check:');
console.log(`API Key: ${apiKey ? '✅ Set (length: ' + apiKey.length + ')' : '❌ Not set'}`);
console.log(`API Secret: ${apiSecret ? '✅ Set (length: ' + apiSecret.length + ')' : '❌ Not set'}`);
console.log('');

if (!apiKey || !apiSecret) {
  console.log('❌ API credentials missing. Please check your .env file.');
  process.exit(1);
}

// Test 1: Check public API endpoint
console.log('🌐 Test 1: Public API Connection...');
async function testPublicAPI() {
  try {
    const response = await fetch('https://api.crypto.com/v2/public/get-ticker?instrument_name=BTC_USDT');
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Public API working');
      console.log(`Sample data: ${JSON.stringify(data, null, 2)}`);
    } else {
      console.log('❌ Public API failed');
      const text = await response.text();
      console.log(`Error: ${text}`);
    }
  } catch (error) {
    console.log('❌ Public API connection error:', error.message);
  }
  console.log('');
}

// Test 2: Check private API (account balance)
console.log('🔐 Test 2: Private API Authentication...');
async function testPrivateAPI() {
  try {
    const nonce = Date.now();
    const id = nonce;
    const method = 'private/get-account-summary';
    
    // Create the request body first
    const requestBody = {
      id: id,
      method: method,
      params: {
        api_key: apiKey,
        nonce: nonce
      },
      nonce: nonce
    };
    
    // Create signature string: method + id + api_key + param_string + nonce
    const paramKeys = Object.keys(requestBody.params).filter(key => key !== 'sig').sort();
    const paramString = paramKeys.map(key => `${key}${requestBody.params[key]}`).join('');
    
    const sigPayload = `${method}${id}${apiKey}${paramString}${nonce}`;
    
    console.log(`🔧 Debug Info:`);
    console.log(`Method: ${method}`);
    console.log(`Nonce: ${nonce}`);
    console.log(`ID: ${id}`);
    console.log(`Param String: ${paramString}`);
    console.log(`Sig Payload: ${sigPayload.substring(0, 80)}...`);
    
    // Generate signature
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(sigPayload)
      .digest('hex');
    
    console.log(`Signature: ${signature.substring(0, 20)}...`);
    
    // Add signature to params
    requestBody.params.sig = signature;
    
    console.log(`🚀 Making request to: https://api.crypto.com/v2/private/get-account-summary`);
    
    const response = await fetch(`https://api.crypto.com/v2/private/get-account-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`Response: ${responseText}`);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      if (data.code === 0) {
        console.log('✅ Private API authentication successful!');
        console.log(`Account Summary: ${JSON.stringify(data.result, null, 2)}`);
      } else {
        console.log(`❌ Private API error: ${data.message} (code: ${data.code})`);
      }
    } else {
      console.log('❌ Private API request failed');
    }
    
  } catch (error) {
    console.log('❌ Private API error:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run tests
async function runTests() {
  await testPublicAPI();
  await testPrivateAPI();
  
  console.log('🏁 Debug complete!');
}

runTests().catch(console.error);