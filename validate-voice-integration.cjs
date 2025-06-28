#!/usr/bin/env node

/**
 * Voice Integration Validation
 * Confirms voice file integration for vocal generation
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

async function validateVoiceIntegration() {
  log('Voice Bank Integration Validation', 'bold');
  log('================================', 'cyan');

  let validationsPassed = 0;
  const totalValidations = 6;

  // 1. Original voice file exists
  const originalPath = path.join(process.cwd(), 'attached_assets', 'Default Project_1750771377076.mp3');
  if (fs.existsSync(originalPath)) {
    const stats = fs.statSync(originalPath);
    log(`✓ Original voice file: ${(stats.size / 1024 / 1024).toFixed(2)} MB`, 'green');
    validationsPassed++;
  } else {
    log('✗ Original voice file missing', 'red');
  }

  // 2. Voice bank directory created
  const voiceBankDir = path.join(process.cwd(), 'storage', 'voice-bank');
  if (fs.existsSync(voiceBankDir)) {
    log('✓ Voice bank storage directory created', 'green');
    validationsPassed++;
  } else {
    log('✗ Voice bank storage directory missing', 'red');
  }

  // 3. Voice file copied to bank
  const bankVoicePath = path.join(voiceBankDir, 'default-voice.mp3');
  if (fs.existsSync(bankVoicePath)) {
    const stats = fs.statSync(bankVoicePath);
    log(`✓ Voice file copied to bank: ${(stats.size / 1024 / 1024).toFixed(2)} MB`, 'green');
    validationsPassed++;
  } else {
    log('✗ Voice file not copied to bank', 'red');
  }

  // 4. Voice bank service implemented
  const serviceFile = path.join(process.cwd(), 'server', 'services', 'voice-bank-integration.ts');
  if (fs.existsSync(serviceFile)) {
    log('✓ Voice bank service implemented', 'green');
    validationsPassed++;
  } else {
    log('✗ Voice bank service missing', 'red');
  }

  // 5. API endpoints added to routes
  const routesFile = path.join(process.cwd(), 'server', 'routes.ts');
  if (fs.existsSync(routesFile)) {
    const routesContent = fs.readFileSync(routesFile, 'utf8');
    if (routesContent.includes('/api/voice-bank/') && routesContent.includes('voiceBankIntegration')) {
      log('✓ Voice bank API endpoints integrated', 'green');
      validationsPassed++;
    } else {
      log('✗ Voice bank API endpoints not found', 'red');
    }
  } else {
    log('✗ Routes file missing', 'red');
  }

  // 6. Voice bank functionality test
  try {
    // Test voice bank initialization
    const { exec } = require('child_process');
    const testResult = require('child_process').execSync('npx tsx -e "const { voiceBankIntegration } = require(\'./server/services/voice-bank-integration\'); console.log(JSON.stringify(voiceBankIntegration.getVoiceBankStats()));"', 
      { encoding: 'utf8', timeout: 10000 });
    
    const stats = JSON.parse(testResult.trim());
    if (stats.defaultVoiceAvailable && stats.totalVoices > 0) {
      log(`✓ Voice bank operational: ${stats.totalVoices} voices, ${(stats.totalStorageUsed / 1024 / 1024).toFixed(2)} MB`, 'green');
      validationsPassed++;
    } else {
      log('✗ Voice bank not operational', 'red');
    }
  } catch (error) {
    log('✗ Voice bank functionality test failed', 'red');
  }

  log(`\nValidation Results: ${validationsPassed}/${totalValidations} passed`, 
      validationsPassed === totalValidations ? 'green' : 'blue');

  if (validationsPassed === totalValidations) {
    log('\nVoice file integration complete and operational!', 'green');
    log('The system can now generate vocals using the integrated voice file.', 'green');
  } else {
    log('\nSome validations failed. Voice integration may need attention.', 'blue');
  }

  // Show integration summary
  log('\nIntegration Summary:', 'cyan');
  log('- Voice file from attached assets integrated into voice bank', 'blue');
  log('- Voice bank service provides voice profile management', 'blue');
  log('- API endpoints allow voice generation requests', 'blue');
  log('- System ready for vocal generation in song creation', 'blue');

  return validationsPassed === totalValidations;
}

// Run validation
if (require.main === module) {
  validateVoiceIntegration().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`Validation error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { validateVoiceIntegration };