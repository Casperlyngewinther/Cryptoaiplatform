const crypto = require('crypto');
const fetch = require('node-fetch');

// Your actual API credentials
const API_KEY = 'occPbLqTkumaaC8nef1iim';
const API_SECRET = 'cxakp_skicB5hTXE2LivNV84AyQo';
const BASE_URL = 'https://api.crypto.com/v2';

// Helper function to create parameter string
function objectToString(obj) {
  if (obj == null) return "";
  
  function isObject(obj) { 
    return obj !== undefined && obj !== null && obj.constructor == Object; 
  }
  
  function isArray(obj) { 
    return obj !== undefined && obj !== null && obj.constructor == Array; 
  }
  
  const arrayToString = (obj) => { 
    return obj.reduce((a, b) => {
      return a + (isObject(b) ? objectToString(b) : (isArray(b) ? arrayToString(b) : b));
    }, "");
  };
  
  return Object.keys(obj).sort().reduce((a, b) => {
    return a + b + (isArray(obj[b]) ? arrayToString(obj[b]) : (isObject(obj[b]) ? objectToString(obj[b]) : obj[b]));
  }, "");
}

async function testCryptoComAuth() {
  console.log('🔧 Testing Crypto.com Authentication...\n');
  
  // Test 1: Public endpoint (should work)
  console.log('📡 Test 1: Public API (get-ticker)');
  try {
    const publicResponse = await fetch(`${BASE_URL}/public/get-ticker?instrument_name=BTC_USDT`);
    const publicData = await publicResponse.text();
    console.log(`✅ Public API Status: ${publicResponse.status}`);
    console.log(`📄 Public Response: ${publicData.substring(0, 100)}...\n`);
  } catch (error) {
    console.log(`❌ Public API Error: ${error.message}\n`);
  }

  // Test 2: Private endpoint with your exact authentication method
  console.log('🔐 Test 2: Private API (get-account-summary)');
  
  const nonce = Date.now();
  const id = nonce;
  const method = 'private/get-account-summary';
  
  // Empty params for get-account-summary
  const params = {};
  
  // Create parameter string
  const paramsString = objectToString(params);
  
  // Create signature payload: method + id + api_key + paramsString + nonce
  const sigPayload = `${method}${id}${API_KEY}${paramsString}${nonce}`;
  
  const signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(sigPayload)
    .digest('hex');
  
  const requestBody = {
    id: id,
    method: method,
    api_key: API_KEY,
    params: params,
    nonce: nonce,
    sig: signature
  };

  console.log('🔍 Authentication Details:');
  console.log(`   Method: ${method}`);
  console.log(`   ID: ${id}`);
  console.log(`   Nonce: ${nonce}`);
  console.log(`   API Key: ${API_KEY}`);
  console.log(`   Params: ${JSON.stringify(params)}`);
  console.log(`   Params String: "${paramsString}"`);
  console.log(`   Signature Payload: ${sigPayload}`);
  console.log(`   Signature: ${signature}`);
  console.log(`   Request Body: ${JSON.stringify(requestBody, null, 2)}\n`);

  try {
    const response = await fetch(`${BASE_URL}/private/get-account-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'crypto-dashboard/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📄 Full Response: ${responseText}\n`);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      if (result.code === 0) {
        console.log('✅ SUCCESS! Authentication is working correctly!');
        console.log('💰 Account Summary received:', JSON.stringify(result.result, null, 2));
      } else {
        console.log(`❌ API Error Code ${result.code}: ${result.message}`);
      }
    } else {
      console.log(`❌ HTTP Error ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    console.log(`❌ Request Error: ${error.message}`);
  }
}

// Alternative signature method test (in case the first one is still wrong)
async function testAlternativeSignature() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 Testing Alternative Signature Method...\n');
  
  const nonce = Date.now();
  const id = nonce;
  const method = 'get-account-summary'; // Without 'private/' prefix for signature
  
  // Try different signature payload format
  const sigPayload2 = `${method}${id}${API_KEY}${nonce}`;
  
  const signature2 = crypto
    .createHmac('sha256', API_SECRET)
    .update(sigPayload2)
    .digest('hex');
  
  const requestBody2 = {
    id: id,
    method: `private/${method}`,
    api_key: API_KEY,
    params: {},
    nonce: nonce,
    sig: signature2
  };

  console.log('🔍 Alternative Authentication:');
  console.log(`   Signature Payload: ${sigPayload2}`);
  console.log(`   Signature: ${signature2}`);

  try {
    const response = await fetch(`${BASE_URL}/private/get-account-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'crypto-dashboard/1.0'
      },
      body: JSON.stringify(requestBody2)
    });

    const responseText = await response.text();
    
    console.log(`📊 Alternative Response Status: ${response.status}`);
    console.log(`📄 Alternative Response: ${responseText}\n`);
    
  } catch (error) {
    console.log(`❌ Alternative Request Error: ${error.message}`);
  }
}

// Run tests
testCryptoComAuth().then(() => testAlternativeSignature());