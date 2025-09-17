// Test Crypto.com Balance API
// Manually set environment variables instead of using dotenv
process.env.CRYPTOCOM_API_KEY = 'occPbLqTkumaaC8nef1iim';
process.env.CRYPTOCOM_API_SECRET = 'cxakp_skicB5hTXE2LivNV84AyQo';

const CryptoComExchange = require('./server/services/CryptoComExchange');

async function testBalanceAPI() {
  console.log('🧪 Testing Crypto.com Balance API...\n');
  
  const exchange = new CryptoComExchange();
  
  console.log('📋 API Credentials:');
  console.log(`   API Key: ${process.env.CRYPTOCOM_API_KEY ? process.env.CRYPTOCOM_API_KEY.substring(0, 8) + '...' : 'NOT SET'}`);
  console.log(`   API Secret: ${process.env.CRYPTOCOM_API_SECRET ? process.env.CRYPTOCOM_API_SECRET.substring(0, 8) + '...' : 'NOT SET'}\n`);
  
  try {
    console.log('🔄 Calling getBalance()...');
    const balanceData = await exchange.getBalance();
    
    console.log('\n✅ SUCCESS! Balance data received:');
    console.log('📊 Full Balance Response:', JSON.stringify(balanceData, null, 2));
    
    if (balanceData.currencies) {
      console.log('\n💰 Individual Currency Balances:');
      for (const [currency, balance] of Object.entries(balanceData.currencies)) {
        console.log(`   ${currency}: ${balance.total} (Free: ${balance.free}, Locked: ${balance.locked})`);
      }
    }
    
    console.log('\n🎯 This should match what you see in the Crypto.com app!');
    
  } catch (error) {
    console.error('\n❌ FAILED! Balance API Error:');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('Full Error:', error);
  }
}

testBalanceAPI();