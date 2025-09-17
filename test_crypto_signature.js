// Test exact Crypto.com signature implementation
const crypto = require('crypto');

// Test API credentials (your confirmed keys)
const API_KEY = 'occPbLqTkumaaC8nef1iim';
const API_SECRET = 'cxakp_skicB5hTXE2LivNV84AyQo';

function objectToString(obj) {
  if (obj == null) return "";
  
  function isObject(obj) {
    return obj !== undefined && obj !== null && obj.constructor === Object;
  }

  function isArray(obj) {
    return obj !== undefined && obj !== null && obj.constructor === Array;
  }

  function arrayToString(obj) {
    return obj.reduce((a, b) => {
      return a + (isObject(b) ? objectToString(b) : (isArray(b) ? arrayToString(b) : b));
    }, "");
  }

  return (
    obj == null
      ? ""
      : Object.keys(obj).sort().reduce((a, b) => {
          return a + b + (isArray(obj[b]) ? arrayToString(obj[b]) : (isObject(obj[b]) ? objectToString(obj[b]) : obj[b]));
        }, "")
  );
}

function generateSignature(method, id, apiKey, params, nonce, apiSecret) {
  // Step 1: Convert params to string
  const paramsString = objectToString(params);
  
  // Step 2: Create signature payload: method + id + api_key + paramsString + nonce
  const sigPayload = method + id + apiKey + paramsString + nonce;
  
  console.log('🔍 Signature components:');
  console.log('  method:', method);
  console.log('  id:', id);
  console.log('  apiKey:', apiKey);
  console.log('  paramsString:', paramsString);
  console.log('  nonce:', nonce);
  console.log('  sigPayload:', sigPayload);
  
  // Step 3: Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(sigPayload)
    .digest('hex');
  
  return signature;
}

async function testAPICall() {
  console.log('🧪 Testing Crypto.com Signature Generation...\n');
  
  // Test request parameters
  const nonce = Date.now();
  const id = nonce;
  const method = 'private/get-account-summary';
  const params = {};
  
  // Generate signature
  const signature = generateSignature(method, id, API_KEY, params, nonce, API_SECRET);
  
  const requestBody = {
    id: id.toString(),
    method: method,
    api_key: API_KEY,
    params: params,
    nonce: nonce.toString(),
    sig: signature
  };
  
  console.log('\n📋 Final Request Body:');
  console.log(JSON.stringify(requestBody, null, 2));
  
  // Test different base URLs
  const testUrls = [
    'https://api.crypto.com/exchange/v1/',
    'https://api.crypto.com/v2/',
    'https://uat-api.3ona.co/v2/',  // UAT/Sandbox
    'https://api.crypto.com/exchange/v1'
  ];
  
  for (const baseUrl of testUrls) {
    try {
      console.log(`\n🔄 Testing ${baseUrl}...`);
      
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const responseText = await response.text();
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${responseText.substring(0, 200)}...`);
      
      if (response.status !== 401) {
        console.log(`   ✅ Different response! Might be correct endpoint.`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

testAPICall();