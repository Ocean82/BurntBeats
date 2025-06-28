#!/usr/bin/env node

// Comprehensive System Test for Burnt Beats Platform
import { spawn } from 'child_process';
import pkg from 'pg';
const { Pool } = pkg;
import http from 'http';
import fs from 'fs';

console.log('🚀 Starting Burnt Beats System Test...\n');

// Test 1: Database Connectivity
async function testDatabase() {
  console.log('1. Testing Database Connection...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const client = await pool.connect();
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('   ✅ Database connected:', result.rows[0].current_time);
    
    // Test schema existence
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('   📋 Tables found:', tables.rows.map(r => r.table_name).join(', '));
    
    // Test foreign keys
    const fkeys = await client.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY'
    `);
    
    console.log('   🔗 Foreign keys:', fkeys.rows.length);
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.log('   ❌ Database error:', error.message);
    return false;
  }
}

// Test 2: Server Startup
function testServerStartup() {
  return new Promise((resolve) => {
    console.log('\n2. Testing Server Startup...');
    
    const server = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: process.cwd()
    });
    
    let output = '';
    let errorOutput = '';
    
    server.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // Give server 10 seconds to start
    setTimeout(() => {
      if (output.includes('Burnt Beats server running')) {
        console.log('   ✅ Server started successfully');
        server.kill();
        resolve({ success: true, output, error: errorOutput });
      } else {
        console.log('   ❌ Server failed to start');
        console.log('   Output:', output.slice(-200));
        console.log('   Error:', errorOutput.slice(-200));
        server.kill();
        resolve({ success: false, output, error: errorOutput });
      }
    }, 10000);
  });
}

// Test 3: API Endpoints
async function testAPIEndpoints() {
  console.log('\n3. Testing API Endpoints...');
  
  // Start server for testing
  const server = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const endpoints = [
    '/api/health',
    '/api/business-profile',
    '/api/system-status'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeHttpRequest('GET', `http://localhost:5000${endpoint}`);
      console.log(`   ✅ ${endpoint}: ${response.statusCode}`);
      results.push({ endpoint, status: response.statusCode, success: true });
    } catch (error) {
      console.log(`   ❌ ${endpoint}: ${error.message}`);
      results.push({ endpoint, error: error.message, success: false });
    }
  }
  
  server.kill();
  return results;
}

// Helper function for HTTP requests
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

// Test 4: Authorization Middleware
function testAuthMiddleware() {
  console.log('\n4. Testing Authorization Middleware...');
  
  // Check if middleware files exist
  const fs = require('fs');
  const authFile = 'server/middleware/auth.ts';
  
  if (fs.existsSync(authFile)) {
    console.log('   ✅ Authorization middleware file exists');
    
    const content = fs.readFileSync(authFile, 'utf8');
    const hasAuthenticate = content.includes('authenticate');
    const hasAuthorizeOwnership = content.includes('authorizeOwnership');
    const hasRateLimit = content.includes('rateLimitByPlan');
    
    console.log('   ✅ authenticate function:', hasAuthenticate ? 'Found' : 'Missing');
    console.log('   ✅ authorizeOwnership function:', hasAuthorizeOwnership ? 'Found' : 'Missing');
    console.log('   ✅ rateLimitByPlan function:', hasRateLimit ? 'Found' : 'Missing');
    
    return { success: true, functions: { authenticate: hasAuthenticate, authorizeOwnership: hasAuthorizeOwnership, rateLimit: hasRateLimit }};
  } else {
    console.log('   ❌ Authorization middleware file missing');
    return { success: false, error: 'Middleware file not found' };
  }
}

// Main test runner
async function runTests() {
  const results = {
    database: false,
    server: false,
    api: [],
    auth: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Run all tests
    results.database = await testDatabase();
    
    const serverTest = await testServerStartup();
    results.server = serverTest.success;
    
    if (serverTest.success) {
      results.api = await testAPIEndpoints();
    }
    
    const authTest = testAuthMiddleware();
    results.auth = authTest.success;
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('   Database:', results.database ? '✅ PASS' : '❌ FAIL');
    console.log('   Server:', results.server ? '✅ PASS' : '❌ FAIL');
    console.log('   API Endpoints:', results.api.filter(r => r.success).length + '/' + results.api.length, 'working');
    console.log('   Authorization:', results.auth ? '✅ PASS' : '❌ FAIL');
    
    const overallSuccess = results.database && results.server && results.auth;
    console.log('\n🎯 Overall Status:', overallSuccess ? '✅ SYSTEM HEALTHY' : '❌ ISSUES FOUND');
    
    // Write results to file
    fs.writeFileSync('system-test-results.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Detailed results saved to system-test-results.json');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);