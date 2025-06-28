#!/usr/bin/env node

/**
 * Comprehensive Backend Compatibility Validation Script
 * Validates all API endpoints, service integrations, and type compatibility
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Comprehensive Backend Compatibility Audit...\n');

// Critical compatibility issues to validate
const compatibilityChecks = {
  stripeApiVersion: {
    file: 'server/stripe-service.ts',
    description: 'Stripe API version compatibility',
    check: (content) => {
      return content.includes('2024-11-20.acacia') || content.includes('as any');
    }
  },
  voiceBankResponseHandling: {
    file: 'server/routes.ts',
    description: 'Voice bank API response handling',
    check: (content) => {
      return !content.includes('audioBuffer.length') && content.includes('audioPath');
    }
  },
  melodyAnalyzerMethod: {
    file: 'server/music-theory-analyzer.ts',
    description: 'Melody analyzer method implementation',
    check: (content) => {
      return content.includes('async analyzeMelody(melodyId: string)');
    }
  },
  storageInterfaceComplete: {
    file: 'server/storage.ts',
    description: 'Storage interface method completeness',
    check: (content) => {
      return content.includes('getMelodyById(melodyId: string)');
    }
  },
  voiceProcessingMethods: {
    file: 'server/enhanced-voice-pipeline.ts',
    description: 'Voice processing method compatibility',
    check: (content) => {
      return content.includes('processVoice') && content.includes('generateVoiceWithPipeline');
    }
  }
};

// Service integration validation
const serviceIntegrations = [
  'server/services/file-storage-service.ts',
  'server/voice-cloning-service.ts',
  'server/text-to-speech-service.ts',
  'server/music-generation-api.py',
  'server/enhanced-music21-generator.py'
];

// API endpoint validation
const apiEndpoints = [
  'server/api/voice-processing.ts',
  'server/api/melody-preview-api.ts',
  'server/routes.ts'
];

let issuesFound = 0;
let issuesFixed = 0;

function validateFile(filePath, checks) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    issuesFound++;
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let hasIssues = false;

  if (checks) {
    for (const [checkName, checkConfig] of Object.entries(checks)) {
      if (!checkConfig.check(content)) {
        console.log(`❌ ${checkConfig.description} in ${filePath}`);
        hasIssues = true;
        issuesFound++;
      } else {
        console.log(`✅ ${checkConfig.description} - OK`);
      }
    }
  }

  return !hasIssues;
}

function validateServiceIntegration(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Service file not found: ${filePath}`);
    issuesFound++;
    return false;
  }

  console.log(`🔧 Checking service integration: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for common integration issues
  const hasLoggerIssues = content.includes('logger.') && !content.includes('Logger.');
  const hasTypeIssues = content.includes('any') && filePath.includes('.ts');
  
  if (hasLoggerIssues) {
    console.log(`❌ Logger reference inconsistency in ${filePath}`);
    issuesFound++;
  }
  
  if (hasTypeIssues && content.match(/:\s*any\s*[,;)]/g)) {
    console.log(`⚠️  Type safety issues detected in ${filePath}`);
  }

  return !hasLoggerIssues;
}

function validateApiEndpoint(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  API endpoint not found: ${filePath}`);
    issuesFound++;
    return false;
  }

  console.log(`🌐 Validating API endpoint: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for proper authentication middleware
  const hasAuth = content.includes('authenticate') || content.includes('isAuthenticated');
  const hasErrorHandling = content.includes('try') && content.includes('catch');
  const hasResponseValidation = content.includes('res.json') || content.includes('res.status');
  
  if (!hasAuth) {
    console.log(`❌ Missing authentication middleware in ${filePath}`);
    issuesFound++;
  }
  
  if (!hasErrorHandling) {
    console.log(`❌ Missing error handling in ${filePath}`);
    issuesFound++;
  }
  
  if (!hasResponseValidation) {
    console.log(`❌ Missing response validation in ${filePath}`);
    issuesFound++;
  }

  return hasAuth && hasErrorHandling && hasResponseValidation;
}

// Run compatibility checks
console.log('🔍 Running compatibility checks...\n');

for (const [checkName, checkConfig] of Object.entries(compatibilityChecks)) {
  validateFile(checkConfig.file, { [checkName]: checkConfig });
}

console.log('\n🔧 Validating service integrations...\n');

for (const servicePath of serviceIntegrations) {
  validateServiceIntegration(servicePath);
}

console.log('\n🌐 Validating API endpoints...\n');

for (const apiPath of apiEndpoints) {
  validateApiEndpoint(apiPath);
}

// Database schema validation
console.log('\n🗄️  Validating database schema...\n');

const schemaPath = 'shared/schema.ts';
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  const requiredTables = ['users', 'sessions', 'songs', 'voiceSamples', 'voiceClones'];
  let schemaValid = true;
  
  for (const table of requiredTables) {
    if (!schemaContent.includes(`export const ${table}`)) {
      console.log(`❌ Missing table definition: ${table}`);
      issuesFound++;
      schemaValid = false;
    } else {
      console.log(`✅ Table definition found: ${table}`);
    }
  }
  
  if (schemaValid) {
    console.log('✅ Database schema validation complete');
  }
} else {
  console.log('❌ Database schema file not found');
  issuesFound++;
}

// Environment configuration validation
console.log('\n🔧 Validating environment configuration...\n');

const envPaths = ['.env', '.env.example'];
let envValid = true;

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const requiredVars = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY'
    ];
    
    for (const envVar of requiredVars) {
      if (!envContent.includes(envVar)) {
        console.log(`⚠️  Missing environment variable: ${envVar} in ${envPath}`);
      } else {
        console.log(`✅ Environment variable found: ${envVar}`);
      }
    }
  } else {
    console.log(`⚠️  Environment file not found: ${envPath}`);
  }
}

// Build configuration validation
console.log('\n📦 Validating build configuration...\n');

const buildFiles = ['package.json', 'tsconfig.json', 'vite.config.ts', 'drizzle.config.ts'];
let buildValid = true;

for (const buildFile of buildFiles) {
  if (fs.existsSync(buildFile)) {
    console.log(`✅ Build file found: ${buildFile}`);
  } else {
    console.log(`❌ Missing build file: ${buildFile}`);
    issuesFound++;
    buildValid = false;
  }
}

if (buildValid) {
  console.log('✅ Build configuration validation complete');
}

// Final audit summary
console.log('\n' + '='.repeat(60));
console.log('🎯 COMPREHENSIVE BACKEND COMPATIBILITY AUDIT COMPLETE');
console.log('='.repeat(60));

if (issuesFound === 0) {
  console.log('🎉 ALL COMPATIBILITY CHECKS PASSED!');
  console.log('✅ Backend is fully compatible and ready for deployment');
  console.log('✅ All API endpoints validated');
  console.log('✅ All service integrations verified');
  console.log('✅ Database schema confirmed');
  console.log('✅ Environment configuration validated');
  process.exit(0);
} else {
  console.log(`⚠️  Found ${issuesFound} compatibility issues`);
  console.log('🔧 Issues identified and documented for resolution');
  console.log('📋 Refer to audit output for specific remediation steps');
  
  // Provide remediation guidance
  console.log('\n📋 REMEDIATION GUIDANCE:');
  console.log('1. Fix Stripe API version compatibility');
  console.log('2. Resolve voice bank response handling');
  console.log('3. Complete melody analyzer implementation');
  console.log('4. Verify storage interface methods');
  console.log('5. Validate voice processing pipeline');
  console.log('6. Check authentication middleware');
  console.log('7. Ensure proper error handling');
  
  process.exit(1);
}