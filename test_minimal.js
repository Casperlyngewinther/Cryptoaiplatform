const crypto = require('crypto');

async function minimalTest() {
    console.log('🧪 Minimal Crypto.com API test...');
    
    const apiKey = "occPbLqTkumaaC8nef1iim";
    const apiSecret = "cxakp_skicB5hTXE2LivNV84AyQo";
    const baseUrl = 'https://api.crypto.com/exchange/v1';
    
    const nonce = Date.now();
    const id = nonce;
    const method = "private/user-balance";
    const params = {};
    
    // Official signature generation
    function objectToString(obj) { 
        return (obj == null ? "" : Object.keys(obj).sort().reduce((a, b) => { 
            return a + b + (Array.isArray(obj[b]) ? arrayToString(obj[b]) : (typeof obj[b] === 'object' ? objectToString(obj[b]) : obj[b])); 
        }, "")); 
    }
    
    function arrayToString(obj) { 
        return obj.reduce((a,b) => { 
            return a + (typeof b === 'object' && !Array.isArray(b) ? objectToString(b) : (Array.isArray(b) ? arrayToString(b) : b)); 
        }, ""); 
    }
    
    const paramsString = objectToString(params);
    const sigPayload = method + id + apiKey + paramsString + nonce;
    const signature = crypto.createHmac('sha256', apiSecret).update(sigPayload).digest('hex');
    
    console.log('📊 Test parameters:');
    console.log('  Method:', method);
    console.log('  ID:', id);
    console.log('  Nonce:', nonce);
    console.log('  Params string:', `"${paramsString}"`);
    console.log('  Sig payload:', sigPayload);
    console.log('  Signature:', signature);
    
    // Test different request formats
    const tests = [
        {
            name: 'Standard JSON request',
            requestBody: {
                id: id.toString(),
                method: method,
                api_key: apiKey,
                params: params,
                nonce: nonce.toString(),
                sig: signature
            },
            headers: {
                'Content-Type': 'application/json'
            }
        },
        {
            name: 'Without toString conversion',
            requestBody: {
                id: id,
                method: method,
                api_key: apiKey,
                params: params,
                nonce: nonce,
                sig: signature
            },
            headers: {
                'Content-Type': 'application/json'
            }
        },
        {
            name: 'With User-Agent header',
            requestBody: {
                id: id.toString(),
                method: method,
                api_key: apiKey,
                params: params,
                nonce: nonce.toString(),
                sig: signature
            },
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'crypto-dashboard/1.0'
            }
        }
    ];
    
    for (const test of tests) {
        console.log(`\n🔬 Testing: ${test.name}`);
        console.log('  Request body:', JSON.stringify(test.requestBody, null, 2));
        console.log('  Headers:', JSON.stringify(test.headers, null, 2));
        
        try {
            const response = await fetch(`${baseUrl}/${method}`, {
                method: 'POST',
                headers: test.headers,
                body: JSON.stringify(test.requestBody)
            });
            
            const responseText = await response.text();
            console.log(`  Status: ${response.status}`);
            console.log(`  Response: ${responseText.substring(0, 200)}...`);
            
            if (response.status === 200) {
                console.log('  ✅ SUCCESS!');
                break;
            }
            
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
        }
    }
}

minimalTest();
