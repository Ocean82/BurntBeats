#!/usr/bin/env node

/**
 * Direct Voice Bank Integration Test
 * Tests voice file integration without requiring web server
 */

const fs = require('fs');
const path = require('path');

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

async function testVoiceFileIntegrity() {
  log('\n🔍 Testing Voice File Integration...', 'cyan');
  
  try {
    const originalPath = path.join(process.cwd(), 'attached_assets', 'Default Project_1750771377076.mp3');
    const voiceBankPath = path.join(process.cwd(), 'storage', 'voice-bank', 'default-voice.mp3');
    const storageDir = path.join(process.cwd(), 'storage', 'voice-bank');
    
    let testsPass = 0;
    let totalTests = 5;
    
    // Test 1: Original file exists
    if (fs.existsSync(originalPath)) {
      const originalStats = fs.statSync(originalPath);
      log(`   ✅ Original voice file found (${(originalStats.size / 1024 / 1024).toFixed(2)} MB)`, 'green');
      testsPass++;
    } else {
      log(`   ❌ Original voice file missing: ${originalPath}`, 'red');
    }
    
    // Test 2: Storage directory exists
    if (fs.existsSync(storageDir)) {
      log(`   ✅ Voice bank storage directory exists`, 'green');
      testsPass++;
    } else {
      log(`   ❌ Voice bank storage directory missing: ${storageDir}`, 'red');
    }
    
    // Test 3: Test voice bank service instantiation
    try {
      const { voiceBankIntegration } = require('./server/services/voice-bank-integration');
      log(`   ✅ Voice bank service instantiated successfully`, 'green');
      testsPass++;
    } catch (error) {
      log(`   ❌ Voice bank service instantiation failed: ${error.message}`, 'red');
    }
    
    // Test 4: Check if voice bank copy exists after instantiation
    if (fs.existsSync(voiceBankPath)) {
      const bankStats = fs.statSync(voiceBankPath);
      log(`   ✅ Voice bank copy created (${(bankStats.size / 1024 / 1024).toFixed(2)} MB)`, 'green');
      testsPass++;
    } else {
      log(`   ❌ Voice bank copy not created: ${voiceBankPath}`, 'red');
    }
    
    // Test 5: Test voice bank functionality
    try {
      const { voiceBankIntegration } = require('./server/services/voice-bank-integration');
      const stats = voiceBankIntegration.getVoiceBankStats();
      const defaultVoice = voiceBankIntegration.getDefaultVoice();
      
      if (stats.defaultVoiceAvailable && defaultVoice) {
        log(`   ✅ Voice bank functionality operational (${stats.totalVoices} voices)`, 'green');
        log(`      Default voice: ${defaultVoice.name} (${defaultVoice.format})`, 'blue');
        testsPass++;
      } else {
        log(`   ❌ Voice bank functionality test failed`, 'red');
      }
    } catch (error) {
      log(`   ❌ Voice bank functionality test error: ${error.message}`, 'red');
    }
    
    log(`\n📊 Voice Integration Results: ${testsPass}/${totalTests} tests passed`, 
        testsPass === totalTests ? 'green' : 'yellow');
    
    return testsPass === totalTests;
  } catch (error) {
    log(`❌ Voice integration test error: ${error.message}`, 'red');
    return false;
  }
}

async function testVoiceGeneration() {
  log('\n🎶 Testing Voice Generation Capability...', 'cyan');
  
  try {
    const { voiceBankIntegration } = require('./server/services/voice-bank-integration');
    
    // Test voice generation
    const testText = "This is a test of the voice generation system";
    const audioBuffer = await voiceBankIntegration.generateVocalSample('default-voice', testText);
    
    if (audioBuffer && audioBuffer.length > 0) {
      log(`   ✅ Voice generation successful (${(audioBuffer.length / 1024).toFixed(1)} KB output)`, 'green');
      return true;
    } else {
      log(`   ❌ Voice generation failed - no audio output`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ❌ Voice generation test error: ${error.message}`, 'red');
    return false;
  }
}

async function testVoiceProfiles() {
  log('\n🎭 Testing Voice Profile Management...', 'cyan');
  
  try {
    const { voiceBankIntegration } = require('./server/services/voice-bank-integration');
    
    // Get all profiles
    const profiles = voiceBankIntegration.getAllVoiceProfiles();
    const defaultVoice = voiceBankIntegration.getDefaultVoice();
    const stats = voiceBankIntegration.getVoiceBankStats();
    
    log(`   📊 Voice Bank Statistics:`, 'blue');
    log(`      Total Voices: ${stats.totalVoices}`, 'blue');
    log(`      Default Voice Available: ${stats.defaultVoiceAvailable}`, 'blue');
    log(`      Storage Used: ${(stats.totalStorageUsed / 1024 / 1024).toFixed(2)} MB`, 'blue');
    
    if (profiles.length > 0) {
      log(`   🎤 Voice Profiles (${profiles.length}):`, 'blue');
      profiles.forEach((profile, index) => {
        log(`      ${index + 1}. ${profile.name} (${profile.id}) - ${profile.format.toUpperCase()}`, 'blue');
        log(`         Size: ${(profile.fileSize / 1024 / 1024).toFixed(2)} MB, Duration: ${profile.duration}s`, 'blue');
        log(`         Default: ${profile.isDefault}, Created: ${profile.createdAt.toLocaleDateString()}`, 'blue');
      });
    }
    
    if (defaultVoice) {
      log(`   ✅ Default voice profile loaded: ${defaultVoice.name}`, 'green');
      return true;
    } else {
      log(`   ❌ No default voice profile found`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ❌ Voice profile test error: ${error.message}`, 'red');
    return false;
  }
}

async function testDirectoryStructure() {
  log('\n📁 Testing Directory Structure...', 'cyan');
  
  const requiredPaths = [
    'attached_assets',
    'attached_assets/Default Project_1750771377076.mp3',
    'server/services/voice-bank-integration.ts',
    'server/routes.ts'
  ];
  
  let testsPass = 0;
  
  for (const testPath of requiredPaths) {
    const fullPath = path.join(process.cwd(), testPath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const type = stats.isDirectory() ? 'directory' : 'file';
      const size = stats.isFile() ? ` (${(stats.size / 1024).toFixed(1)} KB)` : '';
      log(`   ✅ ${type}: ${testPath}${size}`, 'green');
      testsPass++;
    } else {
      log(`   ❌ Missing: ${testPath}`, 'red');
    }
  }
  
  log(`\n📊 Directory Structure: ${testsPass}/${requiredPaths.length} items found`, 
      testsPass === requiredPaths.length ? 'green' : 'yellow');
  
  return testsPass === requiredPaths.length;
}

// Main test execution
async function runDirectTests() {
  log('🚀 Voice Bank Direct Integration Test', 'bold');
  log('=====================================', 'cyan');
  
  const testResults = {
    directoryStructure: false,
    voiceFileIntegrity: false,
    voiceProfiles: false,
    voiceGeneration: false
  };
  
  // Test 1: Directory Structure
  testResults.directoryStructure = await testDirectoryStructure();
  
  // Test 2: Voice File Integrity
  testResults.voiceFileIntegrity = await testVoiceFileIntegrity();
  
  // Test 3: Voice Profiles
  testResults.voiceProfiles = await testVoiceProfiles();
  
  // Test 4: Voice Generation
  testResults.voiceGeneration = await testVoiceGeneration();
  
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
    log('\n🎉 VOICE BANK INTEGRATION COMPLETE!', 'green');
    log('Voice file successfully integrated for vocal generation', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check results above.', 'yellow');
  }
  
  return passedTests === totalTests;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runDirectTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`❌ Test suite error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runDirectTests };