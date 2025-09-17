const crypto = require('crypto');
const https = require('https');

// Load environment variables
require('dotenv').config();

// Your API credentials
const API_KEY = process.env.CRYPTO_COM_API_KEY;
const API_SECRET = process.env.CRYPTO_COM_API_SECRET;

console.log('🔧 Testing Crypto.com Exchange v1 API...\n');
console.log(`🔑 API Key: ${API_KEY}`);
console.log(`🔐 API Secret: ${API_SECRET?.substring(0, 8)}...\n`);

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

// Helper function for v1 API
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

async function testV1Auth() {
  const baseUrl = 'https://api.crypto.com/exchange/v1';
  const method = 'private/user-balance';
  const nonce = Date.now();
  const id = nonce;
  
  // Empty params for user-balance
  const params = {};
  const paramsString = objectToString(params);
  
  // Create signature payload: method + id + api_key + paramsString + nonce
  // NOTE: For signature, use method WITHOUT 'private/' prefix
  const methodForSignature = method.replace('private/', '');
  const sigPayload = `${methodForSignature}${id}${API_KEY}${paramsString}${nonce}`;
  
  const signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(sigPayload)
    .digest('hex');
  
  const requestBody = {
    id: id,
    method: method, // Full method name in request body
    api_key: API_KEY,
    params: params,
    nonce: nonce,
    sig: signature
  };

  console.log('🔍 v1 API Authentication Details:');
  console.log(`   Method: ${method}`);
  console.log(`   Method for signature: ${methodForSignature}`);
  console.log(`   ID: ${id}`);
  console.log(`   Nonce: ${nonce}`);
  console.log(`   Params String: "${paramsString}"`);
  console.log(`   Signature Payload: ${sigPayload}`);
  console.log(`   Signature: ${signature}`);
  console.log(`   URL: ${baseUrl}/${method}`);
  console.log(`   Request Body: ${JSON.stringify(requestBody, null, 2)}\n`);

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
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📄 Response Headers: ${JSON.stringify(response.headers, null, 2)}`);
    console.log(`📄 Full Response: ${response.body}\n`);
    
    if (response.status === 200) {
      const result = JSON.parse(response.body);
      if (result.code === 0) {
        console.log('✅ SUCCESS! v1 API authentication works!');
        console.log('💰 User balance data:', JSON.stringify(result.result, null, 2));
      } else {
        console.log(`❌ API Error Code ${result.code}: ${result.message}`);
        
        if (result.code === 10003) {
          console.log('💡 IP_ILLEGAL - Run this test from your local machine with your whitelisted IP');
        }
      }
    } else {
      console.log(`❌ HTTP Error ${response.status}`);
    }
    
  } catch (error) {
    console.error(`❌ Request Error: ${error.message}`);
  }
}

testV1Auth();