// const fetch = require('node-fetch'); // Not needed in newer Node.js versions

async function testTiming() {
    console.log('🕐 Testing timestamp timing...');
    
    // Get our local time
    const localTime = Date.now();
    console.log('📱 Local timestamp:', localTime);
    console.log('📱 Local time:', new Date(localTime).toISOString());
    
    try {
        // Try to get a reference time from a public Crypto.com endpoint
        const response = await fetch('https://api.crypto.com/exchange/v1/public/get-tickers');
        const serverHeaders = response.headers;
        
        console.log('🌐 Response headers from Crypto.com:');
        for (const [key, value] of serverHeaders.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        // Check if there's a server time in the response
        const responseData = await response.json();
        console.log('📊 Response data fields:', Object.keys(responseData));
        
        // Calculate time difference
        const afterRequestTime = Date.now();
        const requestDuration = afterRequestTime - localTime;
        console.log(`⏱️  Request took ${requestDuration}ms`);
        
        // Check if response contains timestamp info
        if (responseData && responseData.result && responseData.result.data) {
            console.log('📈 Sample ticker data available');
        }
        
    } catch (error) {
        console.error('❌ Error testing timing:', error.message);
    }
}

testTiming();
