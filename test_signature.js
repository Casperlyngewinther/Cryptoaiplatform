const crypto = require('crypto');

// Official example from Crypto.com documentation
function isObject(obj) { 
    return obj !== undefined && obj !== null && obj.constructor == Object; 
}

function isArray(obj) { 
    return obj !== undefined && obj !== null && obj.constructor == Array; 
}

function arrayToString(obj) { 
    return obj.reduce((a,b) => { 
        return a + (isObject(b) ? objectToString(b) : (isArray(b) ? arrayToString(b) : b)); 
    }, ""); 
}

function objectToString(obj) { 
    return (obj == null ? "" : Object.keys(obj).sort().reduce((a, b) => { 
        return a + b + (isArray(obj[b]) ? arrayToString(obj[b]) : (isObject(obj[b]) ? objectToString(obj[b]) : obj[b])); 
    }, "")); 
}

const signRequest = (request_body, api_key, secret) => {
    const { id, method, params, nonce } = request_body;
    
    const paramsString = objectToString(params);
    console.log('📊 Official paramsString:', `"${paramsString}"`);
    
    const sigPayload = method + id + api_key + paramsString + nonce;
    console.log('📝 Official sigPayload:', sigPayload);
    
    const signature = crypto.createHmac('sha256', secret).update(sigPayload).digest('hex');
    console.log('🔐 Official signature:', signature);
    
    return signature;
};

// Test with our exact parameters
const apiKey = "occPbLqTkumaaC8nef1iim";
const apiSecret = "cxakp_skicB5hTXE2LivNV84AyQo";

let request = {
    id: 1757931304082,
    method: "private/user-balance",
    api_key: apiKey,
    params: {},
    nonce: 1757931304082,
};

console.log('🧪 Testing with official Crypto.com signature function:');
const officialSignature = signRequest(request, apiKey, apiSecret);

console.log('\n🧪 Testing with our current implementation:');

// Our current implementation
function ourObjectToString(obj) {
    if (obj == null) return "";
    
    function isObject(obj) { 
        return obj !== undefined && obj !== null && obj.constructor == Object; 
    }
    
    function isArray(obj) { 
        return obj !== undefined && obj !== null && obj.constructor == Array; 
    }
    
    const arrayToString = (obj) => { 
        return obj.reduce((a, b) => {
            return a + (isObject(b) ? ourObjectToString(b) : (isArray(b) ? arrayToString(b) : b));
        }, "");
    };
    
    return Object.keys(obj).sort().reduce((a, b) => {
        return a + b + (isArray(obj[b]) ? arrayToString(obj[b]) : (isObject(obj[b]) ? ourObjectToString(obj[b]) : obj[b]));
    }, "");
}

const ourParamsString = ourObjectToString(request.params);
console.log('📊 Our paramsString:', `"${ourParamsString}"`);

const ourSigPayload = request.method + request.id + apiKey + ourParamsString + request.nonce;
console.log('📝 Our sigPayload:', ourSigPayload);

const ourSignature = crypto.createHmac('sha256', apiSecret).update(ourSigPayload).digest('hex');
console.log('🔐 Our signature:', ourSignature);

console.log('\n🔍 Comparison:');
console.log('Params match:', ourParamsString === objectToString(request.params));
console.log('Payload match:', ourSigPayload === (request.method + request.id + apiKey + objectToString(request.params) + request.nonce));
console.log('Signature match:', ourSignature === officialSignature);
