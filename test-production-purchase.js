
// Burnt Beats Production Purchase Test
// Run this to test the complete purchase flow

const testPurchaseFlow = async () => {
  console.log('🚀 Burnt Beats Production Test Starting...');
  
  // Test 1: Health Check
  try {
    const healthResponse = await fetch('https://burnt-beats-sammyjernigan.replit.app/api/health');
    const health = await healthResponse.json();
    console.log('✅ Health Check:', health.status);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
  }
  
  // Test 2: Business Profile
  try {
    const profileResponse = await fetch('https://burnt-beats-sammyjernigan.replit.app/api/business-profile');
    const profile = await profileResponse.json();
    console.log('✅ Business Profile:', profile.businessName);
  } catch (error) {
    console.log('❌ Business Profile Failed:', error.message);
  }
  
  // Test 3: Stripe Webhook Endpoint
  try {
    const webhookResponse = await fetch('https://burnt-beats-sammyjernigan.replit.app/api/stripe/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test' })
    });
    console.log('✅ Webhook Endpoint Responsive:', webhookResponse.status);
  } catch (error) {
    console.log('❌ Webhook Test Failed:', error.message);
  }
  
  console.log('🎯 Manual Test Required:');
  console.log('1. Go to: https://burnt-beats-sammyjernigan.replit.app');
  console.log('2. Generate a beat');
  console.log('3. Click "Purchase License"'); 
  console.log('4. Complete Stripe checkout');
  console.log('5. Check console logs for license generation');
  console.log('6. Verify download link works');
};

// Run the test
testPurchaseFlow();
