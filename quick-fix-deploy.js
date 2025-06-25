#!/usr/bin/env node

/**
 * Quick Fix Deployment Script for Burnt Beats
 * Addresses common deployment failures with optimized build process
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';

console.log('🔧 Burnt Beats - Quick Deployment Fix');
console.log('====================================\n');

function runCommand(command, description, options = {}) {
  console.log(`📋 ${description}...`);
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      timeout: 300000, // 5 minute timeout
      ...options
    });
    console.log(`✅ ${description} completed\n`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.message);
    if (!options.continueOnError) {
      process.exit(1);
    }
    return null;
  }
}

function ensureDirectories() {
  const dirs = ['dist', 'dist/public', 'uploads', 'dist/reports'];
  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

function createOptimizedPackageJson() {
  const prodPackage = {
    "name": "burnt-beats",
    "version": "1.0.0",
    "type": "module",
    "engines": {
      "node": ">=20.0.0"
    },
    "scripts": {
      "start": "node index.js",
      "health-check": "curl -f http://0.0.0.0:5000/health || exit 1"
    },
    "dependencies": {
      "express": "^4.21.2",
      "express-session": "^1.18.1",
      "cors": "^2.8.5",
      "multer": "^2.0.1",
      "drizzle-orm": "^0.39.1",
      "@neondatabase/serverless": "^0.10.4",
      "connect-pg-simple": "^10.0.0",
      "passport": "^0.7.0",
      "passport-local": "^1.0.0",
      "openid-client": "^6.5.3",
      "stripe": "^18.2.1",
      "ws": "^8.18.0",
      "zod": "^3.24.2",
      "nanoid": "^5.1.5"
    },
    "optionalDependencies": {
      "fsevents": "*"
    }
  };
  
  writeFileSync(
    path.resolve('dist', 'package.json'), 
    JSON.stringify(prodPackage, null, 2)
  );
  console.log('📦 Created optimized production package.json');
}

function createHealthCheck() {
  const healthCheckContent = `#!/usr/bin/env node

/**
 * Health check endpoint for deployment validation
 */

import http from 'http';

const options = {
  hostname: '0.0.0.0',
  port: 5000,
  path: '/health',
  method: 'GET',
  timeout: 10000
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Health check passed');
      process.exit(0);
    } else {
      console.log('❌ Health check failed - Status:', res.statusCode);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Health check failed - Error:', error.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Health check failed - Timeout');
  req.destroy();
  process.exit(1);
});

req.setTimeout(10000);
req.end();
`;

  writeFileSync('dist/health-check.js', healthCheckContent);
  console.log('🏥 Created health check script');
}

async function optimizedClientBuild() {
  console.log('🏗️  Optimized Client Build');
  console.log('=========================');
  
  ensureDirectories();
  
  // Clean previous build
  if (existsSync('dist/public')) {
    runCommand('rm -rf dist/public/*', 'Cleaning previous client build', { continueOnError: true });
  }
  
  // Build with optimized settings
  const viteCommand = [
    'npx vite build',
    '--config vite.config.client.ts',
    '--mode production',
    '--logLevel warn'
  ].join(' ');
  
  runCommand(viteCommand, 'Building optimized React frontend');
}

async function optimizedServerBuild() {
  console.log('🖥️  Optimized Server Build');
  console.log('==========================');
  
  ensureDirectories();
  
  // Enhanced esbuild configuration
  const esbuildCommand = [
    'npx esbuild server/index.ts',
    '--bundle',
    '--platform=node',
    '--target=node20',
    '--format=esm',
    '--outfile=dist/index.js',
    '--external:pg-native',
    '--external:bufferutil', 
    '--external:utf-8-validate',
    '--external:fsevents',
    '--external:@swc/core',
    '--external:esbuild',
    '--external:lightningcss',
    '--minify',
    '--sourcemap=false',
    '--log-level=warning',
    '--tree-shaking=true'
  ].join(' ');
  
  runCommand(esbuildCommand, 'Building optimized Node.js server');
  
  createOptimizedPackageJson();
  createHealthCheck();
}

function validateDeployment() {
  console.log('✅ Deployment Validation');
  console.log('========================');
  
  const requiredFiles = [
    'dist/index.js',
    'dist/package.json',
    'dist/public/index.html',
    'dist/health-check.js'
  ];
  
  let allValid = true;
  const issues = [];
  
  for (const file of requiredFiles) {
    if (existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      issues.push(file);
      allValid = false;
    }
  }
  
  // Check file sizes
  if (existsSync('dist/index.js')) {
    const stats = require('fs').statSync('dist/index.js');
    console.log(`📊 Server bundle size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    if (stats.size > 10 * 1024 * 1024) {
      console.log('⚠️  Warning: Server bundle is quite large (>10MB)');
    }
  }
  
  if (allValid) {
    console.log('\n🎉 Deployment validation successful!');
    console.log('📁 All required files present in ./dist/');
    console.log('🚀 Ready for production deployment');
    return true;
  } else {
    console.log('\n❌ Deployment validation failed');
    console.log('Missing files:', issues.join(', '));
    return false;
  }
}

function fixCommonIssues() {
  console.log('🔧 Fixing Common Deployment Issues');
  console.log('==================================');
  
  // Fix 1: Ensure NODE_ENV is set
  if (!process.env.NODE_ENV) {
    console.log('🔧 Setting NODE_ENV to production');
    process.env.NODE_ENV = 'production';
  }
  
  // Fix 2: Ensure uploads directory exists
  if (!existsSync('uploads')) {
    mkdirSync('uploads', { recursive: true });
    console.log('🔧 Created uploads directory');
  }
  
  // Fix 3: Check database connection
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  Warning: DATABASE_URL not set');
  } else {
    console.log('✅ Database URL configured');
  }
  
  console.log('✅ Common issues addressed\n');
}

async function main() {
  try {
    console.log('🚀 Starting Quick Fix Deployment');
    console.log('=================================\n');
    
    fixCommonIssues();
    await optimizedClientBuild();
    await optimizedServerBuild();
    
    const isValid = validateDeployment();
    
    if (isValid) {
      console.log('\n🎵 Burnt Beats - Deployment Fixed!');
      console.log('==================================');
      console.log('✅ All build artifacts created successfully');
      console.log('✅ Optimized for production deployment');
      console.log('✅ Health checks configured');
      console.log('\nTo test the build locally:');
      console.log('  cd dist && node index.js');
      console.log('\nTo run health check:');
      console.log('  node dist/health-check.js');
    } else {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Quick fix deployment failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

main();