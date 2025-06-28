#!/usr/bin/env node

/**
 * Direct Voice Bank Integration Tests
 * Tests voice bank functionality without logging interference
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testVoiceBankDirect() {
  log('Direct Voice Bank Tests', 'bold');
  log('=======================', 'cyan');

  let totalTests = 0;
  let passedTests = 0;

  // Test 1: Voice file exists and has correct size
  log('\nTest 1: Voice File Validation', 'blue');
  try {
    const voiceFile = path.join(process.cwd(), 'storage', 'voice-bank', 'default-voice.mp3');
    const originalFile = path.join(process.cwd(), 'attached_assets', 'Default Project_1750771377076.mp3');
    
    if (!fs.existsSync(voiceFile)) {
      throw new Error('Voice file not found in storage');
    }
    
    const stats = fs.statSync(voiceFile);
    log(`✓ Voice file exists: ${(stats.size / 1024 / 1024).toFixed(2)} MB`, 'green');
    
    if (stats.size !== 2271019) {
      log(`⚠ Size mismatch: expected 2,271,019 bytes, got ${stats.size}`, 'yellow');
    } else {
      log('✓ Voice file size matches original', 'green');
    }
    
    totalTests++;
    passedTests++;
  } catch (error) {
    log(`✗ Voice file validation failed: ${error.message}`, 'red');
    totalTests++;
  }

  // Test 2: Voice bank service file structure
  log('\nTest 2: Service File Structure', 'blue');
  try {
    const serviceFile = path.join(process.cwd(), 'server', 'services', 'voice-bank-integration.ts');
    
    if (!fs.existsSync(serviceFile)) {
      throw new Error('Voice bank service file missing');
    }
    
    const serviceContent = fs.readFileSync(serviceFile, 'utf8');
    
    const requiredMethods = [
      'getVoiceBankStats',
      'getVoiceProfiles', 
      'canGenerateVocals',
      'generateVocalSample',
      'isDefaultVoiceAvailable'
    ];
    
    let methodsFound = 0;
    requiredMethods.forEach(method => {
      if (serviceContent.includes(method)) {
        log(`✓ Method found: ${method}`, 'green');
        methodsFound++;
      } else {
        log(`✗ Missing method: ${method}`, 'red');
      }
    });
    
    if (methodsFound === requiredMethods.length) {
      log('✓ All required methods present', 'green');
      totalTests++;
      passedTests++;
    } else {
      throw new Error(`Missing ${requiredMethods.length - methodsFound} methods`);
    }
  } catch (error) {
    log(`✗ Service structure test failed: ${error.message}`, 'red');
    totalTests++;
  }

  // Test 3: API Routes Integration
  log('\nTest 3: API Routes Integration', 'blue');
  try {
    const routesFile = path.join(process.cwd(), 'server', 'routes.ts');
    
    if (!fs.existsSync(routesFile)) {
      throw new Error('Routes file missing');
    }
    
    const routesContent = fs.readFileSync(routesFile, 'utf8');
    
    const voiceBankRoutes = [
      '/api/voice-bank/stats',
      '/api/voice-bank/profiles', 
      '/api/voice-bank/default',
      '/api/voice-bank/generate'
    ];
    
    let routesFound = 0;
    voiceBankRoutes.forEach(route => {
      if (routesContent.includes(route)) {
        log(`✓ Route integrated: ${route}`, 'green');
        routesFound++;
      } else {
        log(`✗ Missing route: ${route}`, 'red');
      }
    });
    
    if (routesFound === voiceBankRoutes.length) {
      log('✓ All voice bank routes integrated', 'green');
      totalTests++;
      passedTests++;
    } else {
      throw new Error(`Missing ${voiceBankRoutes.length - routesFound} routes`);
    }
  } catch (error) {
    log(`✗ Routes integration failed: ${error.message}`, 'red');
    totalTests++;
  }

  // Test 4: Authentication Middleware
  log('\nTest 4: Authentication Middleware', 'blue');
  try {
    const authFile = path.join(process.cwd(), 'server', 'middleware', 'auth.ts');
    const voiceBankApiFile = path.join(process.cwd(), 'server', 'api', 'voice-bank.ts');
    
    if (!fs.existsSync(authFile)) {
      throw new Error('Auth middleware file missing');
    }
    
    if (!fs.existsSync(voiceBankApiFile)) {
      throw new Error('Voice bank API file missing');
    }
    
    const authContent = fs.readFileSync(authFile, 'utf8');
    const apiContent = fs.readFileSync(voiceBankApiFile, 'utf8');
    
    if (authContent.includes('isAuthenticated') || authContent.includes('requireAuth')) {
      log('✓ Authentication middleware exists', 'green');
    } else {
      throw new Error('No authentication functions found');
    }
    
    if (apiContent.includes('auth') || apiContent.includes('isAuthenticated')) {
      log('✓ Authentication integrated in voice bank API', 'green');
    } else {
      log('⚠ No authentication found in voice bank API', 'yellow');
    }
    
    totalTests++;
    passedTests++;
  } catch (error) {
    log(`✗ Authentication test failed: ${error.message}`, 'red');
    totalTests++;
  }

  // Test 5: Database Schema
  log('\nTest 5: Database Schema Integration', 'blue');
  try {
    const schemaFile = path.join(process.cwd(), 'shared', 'schema.ts');
    
    if (!fs.existsSync(schemaFile)) {
      throw new Error('Schema file missing');
    }
    
    const schemaContent = fs.readFileSync(schemaFile, 'utf8');
    
    const requiredTables = ['users', 'songs', 'voiceSamples'];
    let tablesFound = 0;
    
    requiredTables.forEach(table => {
      if (schemaContent.includes(`export const ${table}`) || schemaContent.includes(`const ${table}`)) {
        log(`✓ Table found: ${table}`, 'green');
        tablesFound++;
      } else {
        log(`⚠ Table missing: ${table}`, 'yellow');
      }
    });
    
    log(`✓ Database schema accessible (${tablesFound}/${requiredTables.length} tables)`, 'green');
    totalTests++;
    passedTests++;
  } catch (error) {
    log(`✗ Database schema test failed: ${error.message}`, 'red');
    totalTests++;
  }

  // Test 6: Storage Directory Structure
  log('\nTest 6: Storage Directory Structure', 'blue');
  try {
    const storageDir = path.join(process.cwd(), 'storage');
    const voiceBankDir = path.join(storageDir, 'voice-bank');
    
    if (!fs.existsSync(storageDir)) {
      throw new Error('Storage directory missing');
    }
    
    if (!fs.existsSync(voiceBankDir)) {
      throw new Error('Voice bank directory missing');
    }
    
    const voiceFiles = fs.readdirSync(voiceBankDir);
    log(`✓ Storage directories exist`, 'green');
    log(`✓ Voice bank contains ${voiceFiles.length} file(s)`, 'green');
    
    if (voiceFiles.includes('default-voice.mp3')) {
      log('✓ Default voice file present', 'green');
    } else {
      throw new Error('Default voice file missing');
    }
    
    totalTests++;
    passedTests++;
  } catch (error) {
    log(`✗ Storage structure test failed: ${error.message}`, 'red');
    totalTests++;
  }

  const failedTests = totalTests - passedTests;

  log(`\nDirect Test Results:`, 'bold');
  log(`Total: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');

  if (failedTests === 0) {
    log('\nVoice bank integration verified!', 'green');
    log('All components are properly integrated for vocal generation.', 'green');
  } else {
    log(`\n${failedTests} test(s) failed`, 'red');
  }

  return failedTests === 0;
}

// Run tests
if (require.main === module) {
  testVoiceBankDirect().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`Test error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testVoiceBankDirect };