#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  console.log(`\n🔧 ${description}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} - Complete`);
  } catch (error) {
    console.error(`❌ ${description} - Failed:`, error.message);
    throw error;
  }
}

function ensureDirectories() {
  const dirs = ['dist', 'dist/public'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

function createProductionPackageJson() {
  const productionPackage = {
    name: "burnt-beats-production",
    version: "1.0.0",
    type: "commonjs",
    main: "index.cjs",
    scripts: {
      start: "node index.cjs"
    },
    dependencies: {
      express: "^4.21.2",
      cors: "^2.8.5",
      "express-session": "^1.18.1",
      "connect-pg-simple": "^10.0.0",
      "express-rate-limit": "^7.5.1",
      multer: "^2.0.1",
      stripe: "^18.2.1",
      "drizzle-orm": "^0.39.1",
      "@neondatabase/serverless": "^0.10.4",
      zod: "^3.24.2",
      "sanitize-filename": "^1.6.3",
      nanoid: "^5.1.5",
      ws: "^8.18.0"
    }
  };

  fs.writeFileSync('dist/package.json', JSON.stringify(productionPackage, null, 2));
  console.log('✅ Created production package.json');
}

function buildClientOptimized() {
  console.log('\n🏗️  Building Client (Optimized)');
  
  // Clean previous build
  if (fs.existsSync('dist/public')) {
    execSync('rm -rf dist/public/*');
  }
  
  // Build with Vite in production mode
  runCommand(
    'NODE_ENV=production npx vite build --outDir dist/public --mode production',
    'Building optimized React frontend'
  );
}

function buildServerOptimized() {
  console.log('\n🖥️  Building Server (Optimized)');
  
  const esbuildCommand = [
    'npx esbuild server/index.ts',
    '--bundle',
    '--platform=node',
    '--target=node20',
    '--format=cjs',
    '--outfile=dist/index.cjs',
    '--external:pg-native',
    '--external:bufferutil',
    '--external:utf-8-validate',
    '--external:fsevents',
    '--minify',
    '--sourcemap=false'
  ].join(' ');
  
  runCommand(esbuildCommand, 'Building Node.js server bundle');
}

function createHealthCheck() {
  const healthCheck = `
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Health check passed');
    process.exit(0);
  } else {
    console.log('❌ Health check failed:', res.statusCode);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.log('❌ Health check error:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Health check timeout');
  req.destroy();
  process.exit(1);
});

req.end();
`;

  fs.writeFileSync('dist/health-check.js', healthCheck);
  console.log('✅ Created health check script');
}

function validateBuild() {
  console.log('\n🔍 Validating Build');
  
  const requiredFiles = [
    'dist/index.cjs',
    'dist/package.json',
    'dist/public/index.html'
  ];
  
  let allValid = true;
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      console.log(`✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
    } else {
      console.log(`❌ Missing: ${file}`);
      allValid = false;
    }
  });
  
  return allValid;
}

async function main() {
  try {
    console.log('🚀 Burnt Beats - Production Deployment');
    console.log('======================================\n');
    
    // Set production environment
    process.env.NODE_ENV = 'production';
    
    ensureDirectories();
    buildClientOptimized();
    buildServerOptimized();
    createProductionPackageJson();
    createHealthCheck();
    
    const isValid = validateBuild();
    
    if (isValid) {
      console.log('\n🎉 Production Build Complete!');
      console.log('=============================');
      console.log('✅ Client assets built and optimized');
      console.log('✅ Server bundle created (CommonJS)');
      console.log('✅ Production package.json configured');
      console.log('✅ Health check endpoint ready');
      console.log('\nTo test locally:');
      console.log('  cd dist && npm start');
      console.log('\nFor deployment, use:');
      console.log('  Run command: npm start');
      console.log('  Working directory: dist/');
    } else {
      console.log('\n❌ Build validation failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };