const crypto = require('crypto');
const https = require('https');

// Load environment variables
require('dotenv').config();

console.log('🔧 Testing multiple signature variations for Crypto.com v1...\n');

const API_KEY = process.env.CRYPTO_COM_API_KEY;
const API_SECRET = process.env.CRYPTO_COM_API_SECRET;

// Helper function for making HTTPS requests
function makeRequest(url, options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testVariation(variation, sigPayload, requestBody, baseUrl, method) {
  console.log(`\n📊 Testing Variation ${variation}:`);
  console.log(`   Signature Payload: ${sigPayload}`);
  
  try {
    const url = new URL(`${baseUrl}/${method}`);
    const postData = JSON.stringify(requestBody);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'crypto-dashboard/1.0'
      }
    };

    const response = await makeRequest(url, options, postData);
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${response.body.substring(0, 100)}...`);
    
    if (response.status === 200) {
      const result = JSON.parse(response.body);
      if (result.code === 0) {
        console.log(`   ✅ SUCCESS! Variation ${variation} works!`);
        return true;
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  return false;
}

async function testAllVariations() {
  const baseUrl = 'https://api.crypto.com/exchange/v1';
  const method = 'private/user-balance';
  const nonce = Date.now();
  const id = nonce;
  
  // Test different signature variations
  
  // Variation 1: user-balance + id + api_key + "" + nonce
  const sig1 = `user-balance${id}${API_KEY}${nonce}`;
  const signature1 = crypto.createHmac('sha256', API_SECRET).update(sig1).digest('hex');
  const body1 = {
    id: id,
    method: method,
    api_key: API_KEY,
    params: {},
    nonce: nonce,
    sig: signature1
  };
  
  // Variation 2: private/user-balance + id + api_key + "" + nonce  
  const sig2 = `${method}${id}${API_KEY}${nonce}`;
  const signature2 = crypto.createHmac('sha256', API_SECRET).update(sig2).digest('hex');
  const body2 = {
    id: id,
    method: method,
    api_key: API_KEY,
    params: {},
    nonce: nonce,
    sig: signature2
  };
  
  // Variation 3: Method + ID + API Key + Params + Nonce (params as string)
  const sig3 = `user-balance${id}${API_KEY}{}${nonce}`;
  const signature3 = crypto.createHmac('sha256', API_SECRET).update(sig3).digest('hex');
  const body3 = {
    id: id,
    method: method,
    api_key: API_KEY,
    params: {},
    nonce: nonce,
    sig: signature3
  };
  
  // Variation 4: Different parameter order in signature
  const sig4 = `${API_KEY}${method}${nonce}${id}`;
  const signature4 = crypto.createHmac('sha256', API_SECRET).update(sig4).digest('hex');
  const body4 = {
    id: id,
    method: method,
    api_key: API_KEY,
    params: {},
    nonce: nonce,
    sig: signature4
  };
  
  // Variation 5: Using string ID instead of number
  const stringId = nonce.toString();
  const sig5 = `user-balance${stringId}${API_KEY}${nonce}`;
  const signature5 = crypto.createHmac('sha256', API_SECRET).update(sig5).digest('hex');
  const body5 = {
    id: stringId,
    method: method,
    api_key: API_KEY,
    params: {},
    nonce: nonce,
    sig: signature5
  };
  
  console.log(`🔑 API Key: ${API_KEY}`);
  console.log(`🔐 API Secret: ${API_SECRET.substring(0, 8)}...`);
  console.log(`🕐 Nonce/ID: ${nonce}`);
  
  // Test all variations
  if (await testVariation(1, sig1, body1, baseUrl, method)) return;
  if (await testVariation(2, sig2, body2, baseUrl, method)) return;
  if (await testVariation(3, sig3, body3, baseUrl, method)) return;
  if (await testVariation(4, sig4, body4, baseUrl, method)) return;
  if (await testVariation(5, sig5, body5, baseUrl, method)) return;
  
  console.log('\n❌ All variations failed. The issue might be:');
  console.log('1. Your API key needs to be activated/enabled');
  console.log('2. The IP address is still not whitelisted correctly'); 
  console.log('3. There\'s a different signature format requirement');
  console.log('4. The API key lacks required permissions');
}

testAllVariations();