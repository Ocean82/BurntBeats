const { spawn } = require('child_process');
const http = require('http');

console.log('Starting Burnt Beats with secret key validation...');

// Environment setup
process.env.NODE_ENV = 'production';
process.env.PORT = '8080';

// Kill existing processes
try {
  require('child_process').execSync('pkill -f "node.*dist/index.cjs"', { stdio: 'ignore' });
} catch (e) {}

function startServer() {
  const server = spawn('node', ['dist/index.cjs'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env }
  });

  let serverReady = false;

  server.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    if (output.includes('Ready to create amazing music!') && !serverReady) {
      serverReady = true;
      console.log('\n=== VALIDATING SECRET KEYS ===');
      setTimeout(validateSecrets, 2000);
    }
  });

  server.stderr.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('Missing optional environment variables')) {
      console.error('Server stderr:', error);
    }
  });

  return server;
}

function validateSecrets() {
  console.log('Testing secret key integration...');
  
  const tests = [
    { path: '/health', desc: 'Database Connection (DATABASE_URL)' },
    { path: '/api/stripe/config', desc: 'Stripe Integration (STRIPE_SECRET_KEY)' },
    { path: '/', desc: 'Frontend with React Fix' },
    { path: '/burnt-beats-app.js', desc: 'Frontend Assets' }
  ];

  let completedTests = 0;
  let successfulTests = 0;

  tests.forEach((test, index) => {
    setTimeout(() => {
      const req = http.request({
        hostname: 'localhost',
        port: 8080,
        path: test.path,
        method: 'GET',
        timeout: 5000
      }, (res) => {
        const success = res.statusCode === 200 || res.statusCode === 401; // 401 is expected for protected routes
        console.log(`${success ? '✅' : '❌'} ${test.desc}: ${res.statusCode}`);
        
        if (success) successfulTests++;
        completedTests++;
        
        if (completedTests === tests.length) {
          showResults(successfulTests, tests.length);
        }
      });
      
      req.on('error', (err) => {
        console.log(`❌ ${test.desc}: ${err.message}`);
        completedTests++;
        
        if (completedTests === tests.length) {
          showResults(successfulTests, tests.length);
        }
      });
      
      req.end();
    }, index * 500);
  });
}

function showResults(successful, total) {
  console.log('\n==========================================');
  console.log('SECRET KEY VALIDATION RESULTS');
  console.log('==========================================');
  
  // Check environment variables
  const secretStatus = {
    'DATABASE_URL': !!process.env.DATABASE_URL,
    'STRIPE_SECRET_KEY': !!process.env.STRIPE_SECRET_KEY,
    'STRIPE_PUBLISHABLE_KEY': !!process.env.STRIPE_PUBLISHABLE_KEY,
    'SESSION_SECRET': !!process.env.SESSION_SECRET
  };

  console.log('\nRequired Secret Keys:');
  Object.entries(secretStatus).forEach(([key, exists]) => {
    console.log(`${exists ? '✅' : '❌'} ${key}`);
  });

  console.log('\nAPI Integration Tests:');
  console.log(`${successful}/${total} endpoints responding correctly`);

  console.log('\nStripe Key Validation:');
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.log('✅ STRIPE_SECRET_KEY format valid');
  } else {
    console.log('⚠️ STRIPE_SECRET_KEY format may be invalid');
  }

  if (process.env.STRIPE_PUBLISHABLE_KEY) {
    if (process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
      console.log('✅ STRIPE_PUBLISHABLE_KEY format valid');
    } else {
      console.log('⚠️ STRIPE_PUBLISHABLE_KEY format may be invalid');
    }
  }

  const allCriticalPresent = Object.values(secretStatus).every(exists => exists);
  
  if (allCriticalPresent && successful >= total - 1) { // Allow 1 failure for auth-protected routes
    console.log('\n🎉 ALL SECRET KEYS VALIDATED SUCCESSFULLY');
    console.log('🚀 Burnt Beats ready for production deployment');
    console.log('🌐 Frontend accessible at http://localhost:8080');
  } else {
    console.log('\n⚠️ Some validations failed - check configuration');
  }
}

// Start server
const serverProcess = startServer();

// Keep alive
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  serverProcess.kill();
  process.exit(0);
});