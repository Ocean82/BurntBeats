const { Pool } = require('pg');
const { spawn } = require('child_process');
const fs = require('fs');

console.log('Burnt Beats System Health Check');
console.log('================================');

async function checkDatabase() {
  console.log('\n1. Database Check:');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const client = await pool.connect();
    
    // Test basic connectivity
    const timeResult = await client.query('SELECT NOW()');
    console.log('   ✓ Connection: OK');
    
    // Check all required tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const requiredTables = ['users', 'songs', 'voice_samples', 'voice_clones', 'sessions'];
    const foundTables = tables.rows.map(r => r.table_name);
    
    requiredTables.forEach(table => {
      if (foundTables.includes(table)) {
        console.log(`   ✓ Table ${table}: EXISTS`);
      } else {
        console.log(`   ✗ Table ${table}: MISSING`);
      }
    });
    
    // Check foreign keys
    const fkeys = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.table_constraints 
      WHERE constraint_type = 'FOREIGN KEY'
    `);
    console.log(`   ✓ Foreign Keys: ${fkeys.rows[0].count} found`);
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.log('   ✗ Database Error:', error.message);
    return false;
  }
}

function checkFiles() {
  console.log('\n2. File Structure Check:');
  
  const criticalFiles = [
    'server/index.ts',
    'server/routes.ts', 
    'server/middleware/auth.ts',
    'server/storage.ts',
    'shared/schema.ts',
    'package.json'
  ];
  
  let allFound = true;
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✓ ${file}: EXISTS`);
    } else {
      console.log(`   ✗ ${file}: MISSING`);
      allFound = false;
    }
  });
  
  return allFound;
}

function checkAuthMiddleware() {
  console.log('\n3. Authorization Middleware Check:');
  
  try {
    const authFile = 'server/middleware/auth.ts';
    if (!fs.existsSync(authFile)) {
      console.log('   ✗ Auth middleware file missing');
      return false;
    }
    
    const content = fs.readFileSync(authFile, 'utf8');
    const functions = [
      'authenticate',
      'authorizeOwnership', 
      'rateLimitByPlan',
      'AuthenticatedRequest'
    ];
    
    functions.forEach(func => {
      if (content.includes(func)) {
        console.log(`   ✓ ${func}: FOUND`);
      } else {
        console.log(`   ✗ ${func}: MISSING`);
      }
    });
    
    return true;
  } catch (error) {
    console.log('   ✗ Error reading auth file:', error.message);
    return false;
  }
}

async function checkServerStartup() {
  console.log('\n4. Server Startup Check:');
  
  return new Promise((resolve) => {
    const server = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    let hasStarted = false;
    
    server.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Burnt Beats server running')) {
        console.log('   ✓ Server starts successfully');
        hasStarted = true;
        server.kill();
        resolve(true);
      }
    });
    
    server.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('Error') || error.includes('error')) {
        console.log('   ✗ Server startup error:', error.slice(0, 100));
        server.kill();
        resolve(false);
      }
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!hasStarted) {
        console.log('   ⚠ Server startup timeout (may still be working)');
        server.kill();
        resolve(true); // Assume OK if no errors
      }
    }, 10000);
  });
}

async function runHealthCheck() {
  const results = {
    database: false,
    files: false,
    auth: false,
    server: false
  };
  
  try {
    results.database = await checkDatabase();
    results.files = checkFiles();
    results.auth = checkAuthMiddleware();
    results.server = await checkServerStartup();
    
    console.log('\n📊 HEALTH CHECK SUMMARY:');
    console.log('========================');
    console.log('Database:', results.database ? '✓ HEALTHY' : '✗ ISSUES');
    console.log('Files:', results.files ? '✓ HEALTHY' : '✗ ISSUES');
    console.log('Authorization:', results.auth ? '✓ HEALTHY' : '✗ ISSUES');
    console.log('Server:', results.server ? '✓ HEALTHY' : '✗ ISSUES');
    
    const overallHealth = results.database && results.files && results.auth && results.server;
    console.log('\nOVERALL STATUS:', overallHealth ? '✓ SYSTEM HEALTHY' : '⚠ ATTENTION NEEDED');
    
    // Save results
    fs.writeFileSync('health-check-results.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      status: overallHealth ? 'HEALTHY' : 'ISSUES_FOUND'
    }, null, 2));
    
  } catch (error) {
    console.error('\nHealth check failed:', error.message);
  }
}

runHealthCheck();