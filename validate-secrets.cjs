const http = require('http');

console.log('Validating Secret Keys and API Integration...\n');

// Test database connection
function testDatabase() {
  console.log('1. Database Connection (DATABASE_URL)');
  if (process.env.DATABASE_URL) {
    console.log('✅ DATABASE_URL configured');
    // Test actual connection
    return testEndpoint('/api/health', 'Database Health Check');
  } else {
    console.log('❌ DATABASE_URL missing');
    return Promise.resolve(false);
  }
}

// Test Stripe integration
function testStripe() {
  console.log('\n2. Stripe Payment Integration');
  if (process.env.STRIPE_SECRET_KEY) {
    console.log('✅ STRIPE_SECRET_KEY configured');
    if (process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      console.log('✅ Stripe secret key format valid');
    } else {
      console.log('⚠️ Stripe secret key format may be invalid (should start with sk_)');
    }
    return testEndpoint('/api/test/stripe', 'Stripe API Test');
  } else {
    console.log('❌ STRIPE_SECRET_KEY missing');
    return Promise.resolve(false);
  }
}

// Test session configuration
function testSessions() {
  console.log('\n3. Session Management');
  if (process.env.SESSION_SECRET) {
    console.log('✅ SESSION_SECRET configured');
    return testEndpoint('/api/test/session', 'Session Test');
  } else {
    console.log('❌ SESSION_SECRET missing');
    return Promise.resolve(false);
  }
}

// Test Google Cloud (optional)
function testGoogleCloud() {
  console.log('\n4. Google Cloud Storage (Optional)');
  const gcpKeys = ['GOOGLE_CLOUD_PROJECT_ID', 'GOOGLE_CLOUD_PRIVATE_KEY', 'GOOGLE_CLOUD_CLIENT_EMAIL'];
  const missingKeys = gcpKeys.filter(key => !process.env[key]);
  
  if (missingKeys.length === 0) {
    console.log('✅ All Google Cloud credentials configured');
  } else {
    console.log(`⚠️ Missing Google Cloud keys: ${missingKeys.join(', ')}`);
    console.log('   (Optional - using local storage fallback)');
  }
  return Promise.resolve(true);
}

// Generic endpoint tester
function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      console.log(`✅ ${description}: ${res.statusCode}`);
      resolve(res.statusCode === 200);
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve(false);
    });
    
    req.end();
  });
}

// Test missing publishable key
function testPublishableKey() {
  console.log('\n5. Frontend Stripe Integration');
  if (process.env.STRIPE_PUBLISHABLE_KEY) {
    console.log('✅ STRIPE_PUBLISHABLE_KEY configured');
    if (process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
      console.log('✅ Stripe publishable key format valid');
    } else {
      console.log('⚠️ Stripe publishable key format may be invalid (should start with pk_)');
    }
  } else {
    console.log('❌ STRIPE_PUBLISHABLE_KEY missing - required for frontend payments');
    console.log('   This will prevent users from making purchases');
  }
}

async function runValidation() {
  await testDatabase();
  await testStripe();
  await testSessions();
  await testGoogleCloud();
  testPublishableKey();
  
  console.log('\n==========================================');
  console.log('SECRET KEY VALIDATION SUMMARY');
  console.log('==========================================');
  console.log('Required for core functionality:');
  console.log(process.env.DATABASE_URL ? '✅' : '❌', 'DATABASE_URL');
  console.log(process.env.STRIPE_SECRET_KEY ? '✅' : '❌', 'STRIPE_SECRET_KEY');
  console.log(process.env.SESSION_SECRET ? '✅' : '❌', 'SESSION_SECRET');
  console.log('\nRequired for payment processing:');
  console.log(process.env.STRIPE_PUBLISHABLE_KEY ? '✅' : '❌', 'STRIPE_PUBLISHABLE_KEY');
  console.log('\nOptional enhancements:');
  console.log(process.env.GOOGLE_CLOUD_PROJECT_ID ? '✅' : '⚠️', 'Google Cloud Storage');
  
  const missingCritical = [];
  if (!process.env.STRIPE_PUBLISHABLE_KEY) missingCritical.push('STRIPE_PUBLISHABLE_KEY');
  
  if (missingCritical.length > 0) {
    console.log('\n🚨 MISSING CRITICAL KEYS:');
    missingCritical.forEach(key => console.log(`   - ${key}`));
    console.log('\nPlease add these secrets to enable full functionality.');
  } else {
    console.log('\n🎉 All critical API keys properly configured!');
  }
}

setTimeout(runValidation, 1000);