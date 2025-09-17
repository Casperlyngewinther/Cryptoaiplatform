const crypto = require('crypto');

async function testDifferentMethods() {
    console.log('🧪 Testing different private methods...');
    
    const apiKey = "occPbLqTkumaaC8nef1iim";
    const apiSecret = "cxakp_skicB5hTXE2LivNV84AyQo";
    const baseUrl = 'https://api.crypto.com/exchange/v1';
    
    // Test different private methods
    const methods = [
        'private/user-balance',
        'private/get-account-summary',
        'private/get-order-history',
        'private/get-trades'
    ];
    
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
    
    for (const method of methods) {
        console.log(`\n🔬 Testing method: ${method}`);
        
        const nonce = Date.now();
        const id = nonce;
        const params = {};
        
        const paramsString = objectToString(params);
        const sigPayload = method + id + apiKey + paramsString + nonce;
        const signature = crypto.createHmac('sha256', apiSecret).update(sigPayload).digest('hex');
        
        const requestBody = {
            id: id.toString(),
            method: method,
            api_key: apiKey,
            params: params,
            nonce: nonce.toString(),
            sig: signature
        };
        
        try {
            const response = await fetch(`${baseUrl}/${method}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            const responseText = await response.text();
            console.log(`  Status: ${response.status}`);
            console.log(`  Response: ${responseText}`);
            
            // Parse response to get specific error details
            try {
                const responseData = JSON.parse(responseText);
                if (responseData.code) {
                    console.log(`  Error Code: ${responseData.code}`);
                    console.log(`  Error Message: ${responseData.message || 'No message'}`);
                }
            } catch (e) {
                // Response wasn't JSON
            }
            
        } catch (error) {
            console.log(`  ❌ Request Error: ${error.message}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Also test the UAT/Sandbox endpoint
    console.log('\n🧪 Testing UAT/Sandbox endpoint...');
    const uatUrl = 'https://uat-api.3ona.co/exchange/v1';
    const method = 'private/user-balance';
    
    const nonce = Date.now();
    const id = nonce;
    const params = {};
    
    const paramsString = objectToString(params);
    const sigPayload = method + id + apiKey + paramsString + nonce;
    const signature = crypto.createHmac('sha256', apiSecret).update(sigPayload).digest('hex');
    
    const requestBody = {
        id: id.toString(),
        method: method,
        api_key: apiKey,
        params: params,
        nonce: nonce.toString(),
        sig: signature
    };
    
    try {
        const response = await fetch(`${uatUrl}/${method}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const responseText = await response.text();
        console.log(`  UAT Status: ${response.status}`);
        console.log(`  UAT Response: ${responseText}`);
        
    } catch (error) {
        console.log(`  ❌ UAT Request Error: ${error.message}`);
    }
}

testDifferentMethods();
