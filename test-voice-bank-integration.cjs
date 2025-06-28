#!/usr/bin/env node

/**
 * Comprehensive Voice Bank Integration Tests
 * Tests all aspects of the voice bank system for vocal generation
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true 
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    
    process.on('error', (error) => {
      reject(error);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      process.kill();
      reject(new Error('Command timeout'));
    }, 10000);
  });
}

async function testVoiceBankIntegration() {
  log('Voice Bank Integration Test Suite', 'bold');
  log('=================================', 'cyan');

  let totalTests = 0;
  let passedTests = 0;

  // Test 1: Voice file accessibility
  log('\nTest 1: Voice File Accessibility', 'blue');
  try {
    const voiceFile = path.join(process.cwd(), 'storage', 'voice-bank', 'default-voice.mp3');
    const stats = fs.statSync(voiceFile);
    log(`✓ Voice file exists: ${(stats.size / 1024 / 1024).toFixed(2)} MB`, 'green');
    
    if (stats.size < 1000000) {
      throw new Error('Voice file too small');
    }
    
    totalTests++;
    passedTests++;
  } catch (error) {
    log(`✗ Voice file test failed: ${error.message}`, 'red');
    totalTests++;
  }

  // Test 2: Voice bank service initialization
  log('\nTest 2: Voice Bank Service Initialization', 'blue');
  try {
    const result = await runCommand('npx tsx -e "const { voiceBankIntegration } = require(\'./server/services/voice-bank-integration\'); console.log(JSON.stringify(voiceBankIntegration.getVoiceBankStats()));"');
    
    if (result.code === 0 && result.stdout.trim()) {
      const stats = JSON.parse(result.stdout.trim());
      log(`✓ Voice bank operational: ${stats.totalVoices} voices available`, 'green');
      log(`✓ Storage usage: ${(stats.totalStorageUsed / 1024 / 1024).toFixed(2)} MB`, 'green');
      
      if (stats.defaultVoiceAvailable) {
        log('✓ Default voice available for generation', 'green');
      } else {
        throw new Error('Default voice not available');
      }
      
      totalTests++;
      passedTests++;
    } else {
      throw new Error('Service initialization failed');
    }
  } catch (error) {
    log(`✗ Service initialization failed: ${error.message}`, 'red');
    totalTests++;
  }

  // Test 3: Voice profile management
  log('\nTest 3: Voice Profile Management', 'blue');
  try {
    const result = await runCommand('npx tsx -e "const { voiceBankIntegration } = require(\'./server/services/voice-bank-integration\'); const profiles = voiceBankIntegration.getVoiceProfiles(); console.log(JSON.stringify(profiles));"');
    
    if (result.code === 0 && result.stdout.trim()) {
      const profiles = JSON.parse(result.stdout.trim());
      
      if (profiles.length > 0) {
        log(`✓ Voice profiles available: ${profiles.length}`, 'green');
        
        const defaultProfile = profiles.find(p => p.id === 'default-voice');
        if (defaultProfile) {
          log(`✓ Default profile: ${defaultProfile.gender}, ${defaultProfile.language}`, 'green');
        } else {
          throw new Error('Default profile not found');
        }
      } else {
        throw new Error('No voice profiles available');
      }
      
      totalTests++;
      passedTests++;
    } else {
      throw new Error('Profile management test failed');
    }
  } catch (error) {
    log(`✗ Profile management failed: ${error.message}`, 'red');
    totalTests++;
  }

  // Test 4: API endpoint integration
  log('\nTest 4: API Endpoint Integration', 'blue');
  try {
    const routesFile = path.join(process.cwd(), 'server', 'routes.ts');
    const routesContent = fs.readFileSync(routesFile, 'utf8');
    
    const requiredEndpoints = [
      '/api/voice-bank/stats',
      '/api/voice-bank/profiles',
      '/api/voice-bank/default',
      '/api/voice-bank/generate'
    ];
    
    let endpointsFound = 0;
    requiredEndpoints.forEach(endpoint => {
      if (routesContent.includes(endpoint)) {
        log(`✓ Endpoint integrated: ${endpoint}`, 'green');
        endpointsFound++;
      } else {
        log(`✗ Missing endpoint: ${endpoint}`, 'red');
      }
    });
    
    if (endpointsFound === requiredEndpoints.length) {
      log('✓ All voice bank endpoints integrated', 'green');
      totalTests++;
      passedTests++;
    } else {
      throw new Error(`Missing ${requiredEndpoints.length - endpointsFound} endpoints`);
    }
  } catch (error) {
    log(`✗ API endpoint integration failed: ${error.message}`, 'red');
    totalTests++;
  }

  // Test 5: Authentication integration
  log('\nTest 5: Authentication Integration', 'blue');
  try {
    const apiFile = path.join(process.cwd(), 'server', 'api', 'voice-bank.ts');
    
    if (fs.existsSync(apiFile)) {
      const apiContent = fs.readFileSync(apiFile, 'utf8');
      
      if (apiContent.includes('isAuthenticated') || apiContent.includes('auth')) {
        log('✓ Authentication middleware integrated', 'green');
        totalTests++;
        passedTests++;
      } else {
        throw new Error('No authentication middleware found');
      }
    } else {
      throw new Error('Voice bank API file missing');
    }
  } catch (error) {
    log(`✗ Authentication integration failed: ${error.message}`, 'red');
    totalTests++;
  }

  // Test 6: Voice generation capability
  log('\nTest 6: Voice Generation Capability', 'blue');
  try {
    const result = await runCommand('npx tsx -e "const { voiceBankIntegration } = require(\'./server/services/voice-bank-integration\'); console.log(\'Voice generation ready:\', voiceBankIntegration.canGenerateVocals());"');
    
    if (result.code === 0 && result.stdout.includes('true')) {
      log('✓ Voice generation capability confirmed', 'green');
      log('✓ System ready for vocal synthesis', 'green');
      totalTests++;
      passedTests++;
    } else {
      throw new Error('Voice generation not ready');
    }
  } catch (error) {
    log(`✗ Voice generation test failed: ${error.message}`, 'red');
    totalTests++;
  }

  const failedTests = totalTests - passedTests;

  log(`\nVoice Bank Integration Results:`, 'bold');
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');

  if (failedTests === 0) {
    log('\nVoice bank integration fully operational! 🎤', 'green');
    log('The system is ready for vocal generation in song creation.', 'green');
  } else {
    log(`\n${failedTests} test(s) failed - voice integration needs attention`, 'red');
  }

  return failedTests === 0;
}

// Run tests
if (require.main === module) {
  testVoiceBankIntegration().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`Test error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testVoiceBankIntegration };