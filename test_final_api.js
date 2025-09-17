// Test correct Crypto.com API format
const crypto = require('crypto');

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

async function testCorrectFormat() {
  console.log('🎯 Testing CORRECT Crypto.com API Format...\n');
  
  const nonce = Date.now();
  const id = nonce;
  const method = 'private/get-account-summary';
  const params = {};
  
  // Generate signature
  const paramsString = objectToString(params);
  const sigPayload = method + id + API_KEY + paramsString + nonce;
  const signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(sigPayload)
    .digest('hex');
  
  const requestBody = {
    id: id.toString(),
    method: method,
    api_key: API_KEY,
    params: params,
    nonce: nonce.toString(),
    sig: signature
  };
  
  console.log('📋 Request:', JSON.stringify(requestBody, null, 2));
  
  // Test CORRECT endpoint: POST to base URL only
  try {
    console.log('\n🔄 POST to https://api.crypto.com/v2');
    const response = await fetch('https://api.crypto.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${responseText}`);
    
    if (response.ok) {
      console.log('🎉 SUCCESS! Balance API working!');
      const result = JSON.parse(responseText);
      if (result.result && result.result.accounts) {
        console.log('\n💰 Account balances:');
        result.result.accounts.forEach(account => {
          if (parseFloat(account.balance) > 0) {
            console.log(`   ${account.currency}: ${account.balance} (Available: ${account.available})`);
          }
        });
      }
    } else {
      console.log('❌ Still failing...');
    }
    
  } catch (error) {
    console.error('❌ Request error:', error.message);
  }
}

testCorrectFormat();