const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

// Test 1: Check your actual public IP address
function getPublicIP() {
  return new Promise((resolve, reject) => {
    console.log('🌐 Checking your actual public IP address...');
    
    https.get('https://api.ipify.org/', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`🔍 Your actual public IP: ${data.trim()}`);
        console.log(`📋 Whitelisted IP in Crypto.com: 89.150.136.14`);
        
        if (data.trim() === '89.150.136.14') {
          console.log('✅ IP addresses match!\n');
        } else {
          console.log('❌ IP addresses do NOT match! This is the problem.\n');
          console.log('💡 Solution: Update your Crypto.com API whitelist to: ' + data.trim());
        }
        resolve(data.trim());
      });
    }).on('error', reject);
  });
}

// Test 2: Check if you're behind a proxy/VPN
function checkNetworkDetails() {
  console.log('🔍 Network diagnostics:');
  
  // Check multiple IP services to confirm
  const ipServices = [
    'https://api.ipify.org/',
    'https://httpbin.org/ip',
    'https://ipinfo.io/ip'
  ];
  
  return Promise.all(ipServices.map(service => 
    new Promise((resolve) => {
      https.get(service, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            // Handle different response formats
            let ip;
            if (service.includes('httpbin')) {
              ip = JSON.parse(data).origin.split(',')[0].trim();
            } else if (service.includes('ipinfo')) {
              ip = data.trim();
            } else {
              ip = data.trim();
            }
            console.log(`   ${service}: ${ip}`);
            resolve(ip);
          } catch (e) {
            console.log(`   ${service}: Error parsing response`);
            resolve(null);
          }
        });
      }).on('error', () => {
        console.log(`   ${service}: Connection failed`);
        resolve(null);
      });
    })
  ));
}

// Test 3: Test Crypto.com authentication with detailed error handling
async function testCryptoComFromLocal() {
  console.log('\n🔐 Testing Crypto.com authentication from your local network...\n');
  
  // Load your API credentials from .env file
  const envContent = fs.readFileSync('.env', 'utf8');
  const apiKey = envContent.match(/CRYPTO_COM_API_KEY=(.+)/)?.[1];
  const apiSecret = envContent.match(/CRYPTO_COM_API_SECRET=(.+)/)?.[1];
  
  if (!apiKey || !apiSecret) {
    console.log('❌ Could not read API credentials from .env file');
    return;
  }
  
  console.log(`🔑 API Key: ${apiKey}`);
  console.log(`🔐 API Secret: ${apiSecret.substring(0, 8)}...\n`);
  
  const nonce = Date.now();
  const method = 'private/get-account-summary';
  const params = {};
  
  // Create signature according to Crypto.com spec
  const paramsString = '';
  const sigPayload = `${method}${nonce}${apiKey}${paramsString}${nonce}`;
  const signature = crypto.createHmac('sha256', apiSecret).update(sigPayload).digest('hex');
  
  const requestBody = {
    id: nonce,
    method: method,
    api_key: apiKey,
    params: params,
    nonce: nonce,
    sig: signature
  };
  
  console.log('📊 Request details:');
  console.log(`   Signature payload: ${sigPayload}`);
  console.log(`   Signature: ${signature.substring(0, 16)}...`);
  
  // Make the request
  const postData = JSON.stringify(requestBody);
  
  const options = {
    hostname: 'api.crypto.com',
    port: 443,
    path: '/v2/private/get-account-summary',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'crypto-dashboard/1.0'
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`\n📡 Response status: ${res.statusCode}`);
      console.log(`📄 Response body: ${data}`);
      
      try {
        const response = JSON.parse(data);
        if (response.code === 0) {
          console.log('\n✅ SUCCESS! Your API is working correctly!');
        } else if (response.code === 10003) {
          console.log('\n❌ IP_ILLEGAL - Your current IP is not whitelisted');
        } else if (response.code === 10002) {
          console.log('\n❌ UNAUTHORIZED - API key or signature issue');
        } else {
          console.log(`\n❌ API Error ${response.code}: ${response.message}`);
        }
      } catch (e) {
        console.log('\n❌ Could not parse response as JSON');
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`\n❌ Request error: ${e.message}`);
  });
  
  req.write(postData);
  req.end();
}

// Run all tests
async function runDiagnostics() {
  console.log('🚀 Crypto.com Local Network Diagnostics\n');
  console.log('=' * 50);
  
  try {
    // Test 1: Get public IP
    await getPublicIP();
    
    // Test 2: Check network details
    console.log('🔍 Confirming IP from multiple sources:');
    await checkNetworkDetails();
    
    // Test 3: Test API authentication
    await testCryptoComFromLocal();
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
  }
}

runDiagnostics();