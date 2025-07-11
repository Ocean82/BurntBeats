
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 BURNT BEATS INTEGRATION CHECK');
console.log('='.repeat(50));

let issues = 0;
let warnings = 0;

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} - MISSING`);
    issues++;
    return false;
  }
}

function checkFileContent(filePath, patterns, description) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${description}: ${filePath} - FILE MISSING`);
    issues++;
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let allFound = true;
  
  for (const [name, pattern] of Object.entries(patterns)) {
    if (content.includes(pattern)) {
      console.log(`  ✅ ${name}: found`);
    } else {
      console.log(`  ❌ ${name}: missing`);
      allFound = false;
      issues++;
    }
  }
  
  return allFound;
}

console.log('\n1. CORE FILE STRUCTURE');
console.log('-'.repeat(30));

// Check essential files
const coreFiles = {
  'Server Entry': 'server/index.ts',
  'Routes': 'server/routes.ts', 
  'Database Schema': 'shared/schema.ts',
  'Main App Component': 'client/src/components/BurntBeatsEnhancedComplete.tsx',
  'Auth Context': 'client/src/contexts/auth-context.tsx',
  'Package Config': 'package.json'
};

for (const [desc, file] of Object.entries(coreFiles)) {
  checkFile(file, desc);
}

console.log('\n2. SERVER INTEGRATION');
console.log('-'.repeat(30));

// Check server integrations
checkFileContent('server/index.ts', {
  'Express Setup': 'import express',
  'Routes Import': './routes',
  'Database Connection': 'db',
  'Port Configuration': 'PORT'
}, 'Server Entry Point');

checkFileContent('server/routes.ts', {
  'Auth Routes': '/api/auth',
  'Music Routes': '/api/music',
  'Voice Routes': '/api/voice',
  'Stripe Routes': '/api/stripe'
}, 'API Routes');

console.log('\n3. DATABASE INTEGRATION');
console.log('-'.repeat(30));

checkFileContent('shared/schema.ts', {
  'Users Table': 'export const users',
  'Songs Table': 'export const songs',
  'Voice Samples': 'voiceSamples',
  'Sessions Table': 'sessions'
}, 'Database Schema');

console.log('\n4. FRONTEND INTEGRATION');
console.log('-'.repeat(30));

checkFileContent('client/src/App.tsx', {
  'Router Setup': 'Router',
  'Auth Context': 'AuthProvider',
  'Main Component': 'BurntBeats'
}, 'Main App');

checkFileContent('client/src/components/BurntBeatsEnhancedComplete.tsx', {
  'Song Generation': 'song-form',
  'Voice Cloning': 'voice',
  'AI Chat': 'sassy-ai',
  'Audio Player': 'audio-player'
}, 'Enhanced Complete Component');

console.log('\n5. BUILD SYSTEM INTEGRATION');
console.log('-'.repeat(30));

checkFile('build-client.js', 'Client Build Script');
checkFile('build-server.js', 'Server Build Script');
checkFile('vite.config.ts', 'Vite Config');
checkFile('tsconfig.json', 'TypeScript Config');

console.log('\n6. DEPLOYMENT INTEGRATION');
console.log('-'.repeat(30));

checkFile('replit.toml', 'Replit Configuration');
checkFile('run-production.js', 'Production Runner');
checkFile('deploy-production-fix.cjs', 'Deployment Builder');

console.log('\n7. CI/CD INTEGRATION');
console.log('-'.repeat(30));

checkFile('.github/workflows/build-and-test.yml', 'Build Workflow');
checkFile('.github/workflows/deploy.yml', 'Deploy Workflow');
checkFile('jest.config.cjs', 'Jest Configuration');

console.log('\n8. ENVIRONMENT INTEGRATION');
console.log('-'.repeat(30));

if (fs.existsSync('.env.example')) {
  console.log('✅ Environment Template: .env.example');
  const envContent = fs.readFileSync('.env.example', 'utf8');
  
  const requiredVars = [
    'DATABASE_URL',
    'SESSION_SECRET', 
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`  ✅ ${varName}: defined`);
    } else {
      console.log(`  ⚠️  ${varName}: missing`);
      warnings++;
    }
  });
} else {
  console.log('❌ Environment Template: .env.example - MISSING');
  issues++;
}

console.log('\n9. ASSET INTEGRATION');
console.log('-'.repeat(30));

const assetPaths = [
  'client/public/burnt-beats-logo.jpeg',
  'client/public/index.html'
];

assetPaths.forEach(asset => {
  checkFile(asset, `Asset: ${path.basename(asset)}`);
});

console.log('\n10. VALIDATION SCRIPTS');
console.log('-'.repeat(30));

const validationScripts = [
  'quick-health-check.cjs',
  'validate-deployment.cjs',
  'validate-backend-compatibility.cjs'
];

validationScripts.forEach(script => {
  checkFile(script, `Validation: ${script}`);
});

console.log('\n' + '='.repeat(50));
console.log('📊 INTEGRATION CHECK SUMMARY');
console.log('='.repeat(50));

if (issues === 0 && warnings === 0) {
  console.log('🎉 ALL INTEGRATIONS VERIFIED!');
  console.log('✅ Files are properly integrated');
  console.log('✅ No issues found');
  console.log('✅ System ready for deployment');
} else {
  console.log(`⚠️  Found ${issues} critical issues and ${warnings} warnings`);
  
  if (issues > 0) {
    console.log('🔧 Critical issues require immediate attention');
  }
  
  if (warnings > 0) {
    console.log('📝 Warnings should be reviewed but won\'t block deployment');
  }
}

console.log('\n📋 NEXT STEPS:');
if (issues === 0) {
  console.log('1. Run: npm test');
  console.log('2. Run: npm run build:client && npm run build:server');  
  console.log('3. Deploy using Production Build workflow');
} else {
  console.log('1. Fix critical integration issues identified above');
  console.log('2. Re-run this integration check');
  console.log('3. Proceed with testing and deployment');
}

process.exit(issues > 0 ? 1 : 0);
