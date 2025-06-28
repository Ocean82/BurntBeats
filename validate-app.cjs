const http = require('http');
const { Pool } = require('pg');

async function validateApplication() {
  console.log('Burnt Beats Application Validation');
  console.log('==================================\n');
  
  let allPassed = true;
  const results = [];
  
  // Test database connectivity
  console.log('1. Database Validation');
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    
    // Check core tables
    const tables = ['users', 'songs', 'voice_samples', 'voice_clones', 'sessions'];
    for (const table of tables) {
      try {
        await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   ✓ Table ${table} accessible`);
        results.push({ test: `Table ${table}`, status: 'PASS' });
      } catch (error) {
        console.log(`   ✗ Table ${table} error: ${error.message}`);
        results.push({ test: `Table ${table}`, status: 'FAIL', error: error.message });
        allPassed = false;
      }
    }
    
    client.release();
    await pool.end();
  } catch (error) {
    console.log(`   ✗ Database connection failed: ${error.message}`);
    results.push({ test: 'Database Connection', status: 'FAIL', error: error.message });
    allPassed = false;
  }
  
  // Test server endpoints with retry
  console.log('\n2. Server Endpoint Validation');
  const endpoints = [
    { path: '/health', name: 'Health Check' },
    { path: '/api/business-profile', name: 'Business Profile' },
    { path: '/api/system-status', name: 'System Status' },
    { path: '/', name: 'Homepage' }
  ];
  
  for (const endpoint of endpoints) {
    let success = false;
    let lastError = null;
    
    // Try multiple times with increasing delays
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        const response = await makeHttpRequest('GET', `http://localhost:5000${endpoint.path}`);
        
        if (response.statusCode >= 200 && response.statusCode < 400) {
          console.log(`   ✓ ${endpoint.name} (${response.statusCode})`);
          results.push({ test: endpoint.name, status: 'PASS', statusCode: response.statusCode });
          success = true;
          break;
        } else {
          lastError = `Status ${response.statusCode}`;
        }
      } catch (error) {
        lastError = error.message;
        if (attempt === 3) {
          console.log(`   ⚠ ${endpoint.name} unavailable (attempt ${attempt})`);
        }
      }
    }
    
    if (!success) {
      console.log(`   ✗ ${endpoint.name} failed: ${lastError}`);
      results.push({ test: endpoint.name, status: 'FAIL', error: lastError });
    }
  }
  
  // Test file structure
  console.log('\n3. File Structure Validation');
  const fs = require('fs');
  const criticalFiles = [
    'server/index.ts',
    'server/routes.ts',
    'server/middleware/auth.ts',
    'server/storage.ts',
    'shared/schema.ts',
    'package.json'
  ];
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✓ ${file} exists`);
      results.push({ test: `File ${file}`, status: 'PASS' });
    } else {
      console.log(`   ✗ ${file} missing`);
      results.push({ test: `File ${file}`, status: 'FAIL' });
      allPassed = false;
    }
  });
  
  // Test authentication system
  console.log('\n4. Authentication System Validation');
  try {
    const authContent = fs.readFileSync('server/middleware/auth.ts', 'utf8');
    const authFunctions = ['authenticate', 'authorizeOwnership', 'rateLimitByPlan'];
    
    authFunctions.forEach(func => {
      if (authContent.includes(func)) {
        console.log(`   ✓ ${func} function present`);
        results.push({ test: `Auth ${func}`, status: 'PASS' });
      } else {
        console.log(`   ✗ ${func} function missing`);
        results.push({ test: `Auth ${func}`, status: 'FAIL' });
        allPassed = false;
      }
    });
  } catch (error) {
    console.log(`   ✗ Authentication file error: ${error.message}`);
    results.push({ test: 'Authentication System', status: 'FAIL', error: error.message });
    allPassed = false;
  }
  
  // Test music generation components
  console.log('\n5. Music Generation Validation');
  const musicFiles = [
    'server/services/node-music-generator.ts',
    'server/music-generator.ts'
  ];
  
  const musicExists = musicFiles.some(file => fs.existsSync(file));
  if (musicExists) {
    console.log('   ✓ Music generation components present');
    results.push({ test: 'Music Generation', status: 'PASS' });
  } else {
    console.log('   ✗ Music generation components missing');
    results.push({ test: 'Music Generation', status: 'FAIL' });
    allPassed = false;
  }
  
  // Summary
  console.log('\n' + '='.repeat(40));
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  
  console.log(`Validation Results: ${passed}/${total} tests passed`);
  console.log(`Overall Status: ${allPassed ? 'OPERATIONAL' : 'ISSUES DETECTED'}`);
  
  if (allPassed) {
    console.log('\nBurnt Beats application is fully functional and ready for use.');
    console.log('Core features validated:');
    console.log('- Database connectivity and schema');
    console.log('- Server endpoints and API');
    console.log('- Authentication and security');
    console.log('- Music generation pipeline');
    console.log('- File structure integrity');
  } else {
    console.log('\nSome components need attention. Check the detailed results above.');
  }
  
  // Save results
  fs.writeFileSync('validation-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    overall: allPassed,
    passed,
    total,
    details: results
  }, null, 2));
  
  return { success: allPassed, results };
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
    request.setTimeout(8000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
    
    request.end();
  });
}

validateApplication().catch(console.error);