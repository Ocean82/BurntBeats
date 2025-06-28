const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function runAllTests() {
  console.log('Burnt Beats Complete Test Suite');
  console.log('===============================\n');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: { total: 0, passed: 0, failed: 0 }
  };

  // Start server for testing
  console.log('Starting server for testing...');
  const server = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Wait for server startup
  await new Promise(resolve => setTimeout(resolve, 8000));

  // Test 1: Health Check
  console.log('1. Health Check Tests');
  const healthResults = await runHealthTests();
  testResults.tests.health = healthResults;
  updateSummary(testResults.summary, healthResults);

  // Test 2: API Functionality
  console.log('\n2. API Functionality Tests');
  const apiResults = await runAPITests();
  testResults.tests.api = apiResults;
  updateSummary(testResults.summary, apiResults);

  // Test 3: Database Operations
  console.log('\n3. Database Operation Tests');
  const dbResults = await runDatabaseTests();
  testResults.tests.database = dbResults;
  updateSummary(testResults.summary, dbResults);

  // Test 4: Frontend Validation
  console.log('\n4. Frontend Validation Tests');
  const frontendResults = await runFrontendTests();
  testResults.tests.frontend = frontendResults;
  updateSummary(testResults.summary, frontendResults);

  // Test 5: Security Features
  console.log('\n5. Security Feature Tests');
  const securityResults = await runSecurityTests();
  testResults.tests.security = securityResults;
  updateSummary(testResults.summary, securityResults);

  // Cleanup
  server.kill();

  // Generate report
  generateTestReport(testResults);
  
  return testResults;
}

async function runHealthTests() {
  const tests = [
    { name: 'Server Response', test: () => testEndpoint('/health', 200) },
    { name: 'Database Connection', test: () => testDatabaseConnection() },
    { name: 'Environment Variables', test: () => testEnvironmentVariables() }
  ];

  return await runTestSuite(tests);
}

async function runAPITests() {
  const tests = [
    { name: 'Business Profile Endpoint', test: () => testEndpoint('/api/business-profile', 200) },
    { name: 'System Status Endpoint', test: () => testEndpoint('/api/system-status', 200) },
    { name: 'Auth User Endpoint (Protected)', test: () => testEndpoint('/api/auth/user', [401, 200]) },
    { name: 'Songs Endpoint (Protected)', test: () => testEndpoint('/api/songs', [401, 200]) }
  ];

  return await runTestSuite(tests);
}

async function runDatabaseTests() {
  const tests = [
    { name: 'Users Table Access', test: () => testTableAccess('users') },
    { name: 'Songs Table Access', test: () => testTableAccess('songs') },
    { name: 'Voice Samples Table Access', test: () => testTableAccess('voice_samples') },
    { name: 'Foreign Key Constraints', test: () => testForeignKeys() }
  ];

  return await runTestSuite(tests);
}

async function runFrontendTests() {
  const tests = [
    { name: 'Homepage Loads', test: () => testEndpoint('/', 200) },
    { name: 'React Root Element', test: () => testReactRoot() },
    { name: 'JavaScript Bundle', test: () => testJavaScriptBundle() },
    { name: 'CSS Framework', test: () => testCSSFramework() }
  ];

  return await runTestSuite(tests);
}

async function runSecurityTests() {
  const tests = [
    { name: 'Auth Middleware Exists', test: () => testAuthMiddleware() },
    { name: 'Protected Routes', test: () => testProtectedRoutes() },
    { name: 'Input Validation', test: () => testInputValidation() }
  ];

  return await runTestSuite(tests);
}

async function runTestSuite(tests) {
  const results = { passed: 0, failed: 0, tests: [] };
  
  for (const test of tests) {
    try {
      const result = await test.test();
      const passed = result === true || (result && result.success);
      
      if (passed) {
        console.log(`   ✓ ${test.name}`);
        results.passed++;
      } else {
        console.log(`   ✗ ${test.name}`);
        results.failed++;
      }
      
      results.tests.push({
        name: test.name,
        passed,
        result: result
      });
    } catch (error) {
      console.log(`   ✗ ${test.name} - ${error.message}`);
      results.failed++;
      results.tests.push({
        name: test.name,
        passed: false,
        error: error.message
      });
    }
  }
  
  return results;
}

async function testEndpoint(path, expectedStatus) {
  const response = await makeHttpRequest('GET', `http://localhost:5000${path}`);
  const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  return expected.includes(response.statusCode);
}

async function testDatabaseConnection() {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

async function testTableAccess(tableName) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const client = await pool.connect();
    await client.query(`SELECT COUNT(*) FROM ${tableName}`);
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    throw new Error(`Table ${tableName} access failed`);
  }
}

async function testForeignKeys() {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.table_constraints 
      WHERE constraint_type = 'FOREIGN KEY'
    `);
    client.release();
    await pool.end();
    return result.rows[0].count > 0;
  } catch (error) {
    throw new Error('Foreign key check failed');
  }
}

async function testReactRoot() {
  const response = await makeHttpRequest('GET', 'http://localhost:5000/');
  return response.data.includes('id="root"');
}

async function testJavaScriptBundle() {
  const response = await makeHttpRequest('GET', 'http://localhost:5000/');
  return response.data.includes('.js') || response.data.includes('script');
}

async function testCSSFramework() {
  const response = await makeHttpRequest('GET', 'http://localhost:5000/');
  return response.data.includes('tailwind') || response.data.includes('.css');
}

async function testAuthMiddleware() {
  return fs.existsSync('server/middleware/auth.ts');
}

async function testProtectedRoutes() {
  const response = await makeHttpRequest('GET', 'http://localhost:5000/api/songs');
  return response.statusCode === 401; // Should be unauthorized without auth
}

async function testInputValidation() {
  return fs.existsSync('shared/schema.ts');
}

async function testEnvironmentVariables() {
  const required = ['DATABASE_URL'];
  return required.every(env => process.env[env]);
}

function updateSummary(summary, results) {
  summary.total += results.passed + results.failed;
  summary.passed += results.passed;
  summary.failed += results.failed;
}

function generateTestReport(results) {
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY REPORT');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success Rate: ${Math.round((results.summary.passed / results.summary.total) * 100)}%`);
  
  console.log('\nDETAILED RESULTS:');
  Object.entries(results.tests).forEach(([category, categoryResults]) => {
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  Passed: ${categoryResults.passed}/${categoryResults.passed + categoryResults.failed}`);
    
    categoryResults.tests.forEach(test => {
      console.log(`  ${test.passed ? '✓' : '✗'} ${test.name}`);
    });
  });
  
  const overallSuccess = results.summary.failed === 0;
  console.log(`\nOVERALL STATUS: ${overallSuccess ? 'ALL SYSTEMS OPERATIONAL' : 'ISSUES DETECTED'}`);
  
  // Save detailed report
  fs.writeFileSync('test-report.json', JSON.stringify(results, null, 2));
  console.log('\nDetailed report saved to test-report.json');
}

function makeHttpRequest(method, url) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method }, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          data: data
        });
      });
    });
    
    request.on('error', reject);
    request.setTimeout(5000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
    
    request.end();
  });
}

// Execute the complete test suite
runAllTests().catch(console.error);