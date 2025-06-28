#!/usr/bin/env node

/**
 * Comprehensive Voice Bank Integration Test
 * Tests voice file integration and vocal generation capabilities
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP request helper
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: res.headers['content-type']?.includes('application/json') ? JSON.parse(body) : body
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testServerHealth() {
  log('\n🏥 Testing Server Health...', 'cyan');
  
  try {
    const response = await makeRequest('GET', '/api/health');
    
    if (response.statusCode === 200) {
      log('✅ Server is healthy and running', 'green');
      return true;
    } else {
      log(`❌ Server health check failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Server connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function authenticateUser() {
  log('\n🔐 Authenticating test user...', 'cyan');
  
  try {
    // Try to register user first (might already exist)
    await makeRequest('POST', '/api/auth/register', TEST_USER);
    
    // Login to get session
    const loginResponse = await makeRequest('POST', '/api/auth/login', TEST_USER);
    
    if (loginResponse.statusCode === 200) {
      log('✅ User authentication successful', 'green');
      
      // Extract session cookie for future requests
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies) {
        return cookies.join('; ');
      }
      return null;
    } else {
      log(`❌ Authentication failed: ${loginResponse.statusCode}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Authentication error: ${error.message}`, 'red');
    return null;
  }
}

async function testVoiceBankStats(sessionCookie) {
  log('\n📊 Testing Voice Bank Statistics...', 'cyan');
  
  try {
    const response = await makeRequest('GET', '/api/voice-bank/stats', null, {
      Cookie: sessionCookie
    });
    
    if (response.statusCode === 200 && response.body.success) {
      const stats = response.body.data;
      log('✅ Voice bank stats retrieved successfully', 'green');
      log(`   📁 Total voices: ${stats.totalVoices}`, 'blue');
      log(`   🎤 Default voice available: ${stats.defaultVoiceAvailable}`, 'blue');
      log(`   💾 Storage used: ${(stats.totalStorageUsed / 1024 / 1024).toFixed(2)} MB`, 'blue');
      return stats;
    } else {
      log(`❌ Voice bank stats failed: ${response.statusCode}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Voice bank stats error: ${error.message}`, 'red');
    return null;
  }
}

async function testVoiceProfiles(sessionCookie) {
  log('\n🎭 Testing Voice Profiles...', 'cyan');
  
  try {
    const response = await makeRequest('GET', '/api/voice-bank/profiles', null, {
      Cookie: sessionCookie
    });
    
    if (response.statusCode === 200 && response.body.success) {
      const profiles = response.body.data;
      log('✅ Voice profiles retrieved successfully', 'green');
      
      profiles.forEach((profile, index) => {
        log(`   🎤 Profile ${index + 1}:`, 'blue');
        log(`      ID: ${profile.id}`, 'blue');
        log(`      Name: ${profile.name}`, 'blue');
        log(`      Format: ${profile.format}`, 'blue');
        log(`      Size: ${(profile.fileSize / 1024 / 1024).toFixed(2)} MB`, 'blue');
        log(`      Default: ${profile.isDefault}`, 'blue');
        log(`      Duration: ${profile.duration}s`, 'blue');
      });
      
      return profiles;
    } else {
      log(`❌ Voice profiles failed: ${response.statusCode}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Voice profiles error: ${error.message}`, 'red');
    return null;
  }
}

async function testDefaultVoice(sessionCookie) {
  log('\n🎯 Testing Default Voice...', 'cyan');
  
  try {
    const response = await makeRequest('GET', '/api/voice-bank/default', null, {
      Cookie: sessionCookie
    });
    
    if (response.statusCode === 200 && response.body.success) {
      const defaultVoice = response.body.data;
      log('✅ Default voice retrieved successfully', 'green');
      log(`   🎤 Voice ID: ${defaultVoice.id}`, 'blue');
      log(`   📝 Name: ${defaultVoice.name}`, 'blue');
      log(`   🎵 Format: ${defaultVoice.format}`, 'blue');
      log(`   📏 Size: ${(defaultVoice.fileSize / 1024 / 1024).toFixed(2)} MB`, 'blue');
      log(`   ⏱️ Duration: ${defaultVoice.duration}s`, 'blue');
      
      if (defaultVoice.metadata) {
        log(`   🎭 Gender: ${defaultVoice.metadata.gender || 'unknown'}`, 'blue');
        log(`   🌍 Language: ${defaultVoice.metadata.language || 'unknown'}`, 'blue');
        log(`   🎼 Pitch: ${defaultVoice.metadata.pitch || 'unknown'}Hz`, 'blue');
      }
      
      return defaultVoice;
    } else {
      log(`❌ Default voice test failed: ${response.statusCode}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Default voice error: ${error.message}`, 'red');
    return null;
  }
}

async function testVocalGeneration(sessionCookie) {
  log('\n🎶 Testing Vocal Generation...', 'cyan');
  
  const testTexts = [
    "Hello world, this is a test vocal generation",
    "In the shadows of the night, music comes alive",
    "Dancing through the melodies of time"
  ];
  
  let successCount = 0;
  
  for (const [index, text] of testTexts.entries()) {
    try {
      log(`   🎤 Testing vocal generation ${index + 1}/3: "${text.substring(0, 30)}..."`, 'yellow');
      
      const response = await makeRequest('POST', '/api/voice-bank/generate', {
        voiceId: 'default-voice',
        text: text,
        duration: 30
      }, {
        Cookie: sessionCookie
      });
      
      if (response.statusCode === 200) {
        const audioSize = Buffer.byteLength(response.body);
        log(`   ✅ Vocal sample generated successfully (${(audioSize / 1024).toFixed(1)} KB)`, 'green');
        successCount++;
      } else {
        log(`   ❌ Vocal generation failed: ${response.statusCode}`, 'red');
        if (response.body && response.body.message) {
          log(`      Error: ${response.body.message}`, 'red');
        }
      }
    } catch (error) {
      log(`   ❌ Vocal generation error: ${error.message}`, 'red');
    }
  }
  
  log(`\n📊 Vocal Generation Results: ${successCount}/${testTexts.length} successful`, 
      successCount === testTexts.length ? 'green' : 'yellow');
  
  return successCount === testTexts.length;
}

async function testVoiceFileIntegrity() {
  log('\n🔍 Testing Voice File Integrity...', 'cyan');
  
  try {
    // Check if the default voice file exists in attached assets
    const originalPath = path.join(process.cwd(), 'attached_assets', 'Default Project_1750771377076.mp3');
    const voiceBankPath = path.join(process.cwd(), 'storage', 'voice-bank', 'default-voice.mp3');
    
    let testsPass = 0;
    let totalTests = 3;
    
    // Test 1: Original file exists
    if (fs.existsSync(originalPath)) {
      const originalStats = fs.statSync(originalPath);
      log(`   ✅ Original voice file found (${(originalStats.size / 1024 / 1024).toFixed(2)} MB)`, 'green');
      testsPass++;
    } else {
      log(`   ❌ Original voice file missing: ${originalPath}`, 'red');
    }
    
    // Test 2: Voice bank copy exists
    if (fs.existsSync(voiceBankPath)) {
      const bankStats = fs.statSync(voiceBankPath);
      log(`   ✅ Voice bank copy found (${(bankStats.size / 1024 / 1024).toFixed(2)} MB)`, 'green');
      testsPass++;
    } else {
      log(`   ❌ Voice bank copy missing: ${voiceBankPath}`, 'red');
    }
    
    // Test 3: Storage directory exists
    const storageDir = path.join(process.cwd(), 'storage', 'voice-bank');
    if (fs.existsSync(storageDir)) {
      log(`   ✅ Voice bank storage directory exists`, 'green');
      testsPass++;
    } else {
      log(`   ❌ Voice bank storage directory missing: ${storageDir}`, 'red');
    }
    
    log(`\n📊 File Integrity Results: ${testsPass}/${totalTests} tests passed`, 
        testsPass === totalTests ? 'green' : 'yellow');
    
    return testsPass === totalTests;
  } catch (error) {
    log(`❌ File integrity test error: ${error.message}`, 'red');
    return false;
  }
}

async function testIntegrationWorkflow(sessionCookie) {
  log('\n🔄 Testing Complete Integration Workflow...', 'cyan');
  
  try {
    // Step 1: Get default voice
    const defaultVoiceResponse = await makeRequest('GET', '/api/voice-bank/default', null, {
      Cookie: sessionCookie
    });
    
    if (defaultVoiceResponse.statusCode !== 200) {
      log('   ❌ Failed to get default voice for workflow test', 'red');
      return false;
    }
    
    const defaultVoice = defaultVoiceResponse.body.data;
    log(`   ✅ Step 1: Retrieved default voice "${defaultVoice.name}"`, 'green');
    
    // Step 2: Generate vocal with default voice
    const vocalResponse = await makeRequest('POST', '/api/voice-bank/generate', {
      voiceId: defaultVoice.id,
      text: "This is a complete integration test of the voice bank system",
      duration: 45
    }, {
      Cookie: sessionCookie
    });
    
    if (vocalResponse.statusCode !== 200) {
      log('   ❌ Failed to generate vocal in workflow test', 'red');
      return false;
    }
    
    const audioSize = Buffer.byteLength(vocalResponse.body);
    log(`   ✅ Step 2: Generated vocal sample (${(audioSize / 1024).toFixed(1)} KB)`, 'green');
    
    // Step 3: Verify voice bank stats reflect usage
    const statsResponse = await makeRequest('GET', '/api/voice-bank/stats', null, {
      Cookie: sessionCookie
    });
    
    if (statsResponse.statusCode !== 200) {
      log('   ❌ Failed to get stats in workflow test', 'red');
      return false;
    }
    
    const stats = statsResponse.body.data;
    log(`   ✅ Step 3: Verified voice bank stats (${stats.totalVoices} voices available)`, 'green');
    
    log('\n🎉 Complete integration workflow successful!', 'green');
    return true;
  } catch (error) {
    log(`❌ Integration workflow error: ${error.message}`, 'red');
    return false;
  }
}

// Main test execution
async function runAllTests() {
  log('🚀 Starting Voice Bank Integration Test Suite', 'bold');
  log('================================================', 'cyan');
  
  const testResults = {
    serverHealth: false,
    authentication: false,
    voiceBankStats: false,
    voiceProfiles: false,
    defaultVoice: false,
    vocalGeneration: false,
    fileIntegrity: false,
    integrationWorkflow: false
  };
  
  // Test 1: Server Health
  testResults.serverHealth = await testServerHealth();
  if (!testResults.serverHealth) {
    log('\n❌ Server health check failed. Aborting tests.', 'red');
    process.exit(1);
  }
  
  // Test 2: Authentication
  const sessionCookie = await authenticateUser();
  testResults.authentication = !!sessionCookie;
  if (!testResults.authentication) {
    log('\n❌ Authentication failed. Aborting tests.', 'red');
    process.exit(1);
  }
  
  // Test 3: Voice Bank Stats
  testResults.voiceBankStats = !!(await testVoiceBankStats(sessionCookie));
  
  // Test 4: Voice Profiles
  testResults.voiceProfiles = !!(await testVoiceProfiles(sessionCookie));
  
  // Test 5: Default Voice
  testResults.defaultVoice = !!(await testDefaultVoice(sessionCookie));
  
  // Test 6: Vocal Generation
  testResults.vocalGeneration = await testVocalGeneration(sessionCookie);
  
  // Test 7: File Integrity
  testResults.fileIntegrity = await testVoiceFileIntegrity();
  
  // Test 8: Integration Workflow
  testResults.integrationWorkflow = await testIntegrationWorkflow(sessionCookie);
  
  // Final Results
  log('\n📊 VOICE BANK INTEGRATION TEST RESULTS', 'bold');
  log('==========================================', 'cyan');
  
  Object.entries(testResults).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} ${test.replace(/([A-Z])/g, ' $1').toUpperCase()}`, color);
  });
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  
  log(`\n🎯 OVERALL RESULT: ${passedTests}/${totalTests} tests passed`, 
      passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('\n🎉 VOICE BANK INTEGRATION COMPLETE AND OPERATIONAL!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Review the results above.', 'yellow');
  }
  
  return passedTests === totalTests;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`❌ Test suite error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runAllTests };