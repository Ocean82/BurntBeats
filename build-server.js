#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, statSync } from 'fs';

console.log('🖥️  Building server application...');

// Validation checks
function validatePrerequisites() {
  const requiredFiles = [
    'server/index.ts',
    'tsconfig.server.json'
  ];
  
  const missing = requiredFiles.filter(file => !existsSync(file));
  if (missing.length > 0) {
    throw new Error(`Missing required files: ${missing.join(', ')}`);
  }
  
  // Check if esbuild is available
  try {
    execSync('npx esbuild --version', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('esbuild not available. Run: npm install esbuild');
  }
  
  console.log('✅ Prerequisites validated');
}

// Ensure dist directory exists
function ensureDirectories() {
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true });
    console.log('📁 Created dist directory');
  }
}

// Create production package.json
function createProductionPackage() {
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
  
  writeFileSync('dist/package.json', JSON.stringify(prodPackage, null, 2));
  console.log('📦 Created production package.json');
}

// Validate build output
function validateBuildOutput() {
  if (!existsSync('dist/index.js')) {
    throw new Error('Build failed: dist/index.js not generated');
  }
  
  const stats = statSync('dist/index.js');
  if (stats.size < 1000) {
    throw new Error('Build failed: Server bundle appears to be empty or corrupted');
  }
  
  console.log(`✅ Server bundle created: ${Math.round(stats.size / 1024)}KB`);
}

try {
  // Step 1: Validate prerequisites
  validatePrerequisites();
  
  // Step 2: Ensure directories
  ensureDirectories();
  
  // Step 3: Build server with esbuild
  console.log('🔨 Building server with esbuild...');
  
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
    '--external:lightningcss',
    '--external:@babel/preset-typescript',
    '--external:@babel/core',
    '--external:tailwindcss',
    '--external:autoprefixer',
    '--external:postcss',
    '--external:vite',
    '--external:@vitejs/plugin-react',
    '--external:@replit/vite-plugin-cartographer',
    '--external:@replit/vite-plugin-runtime-error-modal',
    '--minify',
    '--sourcemap=external'
  ].join(' ');
  
  execSync(esbuildCommand, { stdio: 'inherit' });
  
  // Step 4: Create production package.json
  createProductionPackage();
  
  // Step 5: Validate build output
  validateBuildOutput();
  
  console.log('🎉 Server build completed successfully!');
  
} catch (error) {
  console.error('❌ Server build failed:', error.message);
  process.exit(1);
}