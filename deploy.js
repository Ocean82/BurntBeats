#!/usr/bin/env node

/**
 * Comprehensive deployment script for Burnt Beats
 * Handles all build requirements for Replit deployment
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

console.log('🎵 Burnt Beats - Deployment Script');
console.log('=====================================\n');

function runCommand(command, description, options = {}) {
  console.log(`📋 ${description}...`);
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
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
  const dirs = ['dist', 'dist/public', 'uploads'];
  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

function createProductionPackageJson() {
  const prodPackage = {
    "name": "burnt-beats",
    "version": "1.0.0",
    "type": "module",
    "engines": {
      "node": ">=20.0.0"
    },
    "scripts": {
      "start": "node index.js"
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
    }
  };
  
  writeFileSync(
    path.resolve('dist', 'package.json'), 
    JSON.stringify(prodPackage, null, 2)
  );
  console.log('📦 Created production package.json');
}

async function buildClient() {
  console.log('🏗️  Building Client Application');
  console.log('===============================');
  
  ensureDirectories();
  
  // Use production Vite config if available, otherwise use default
  const viteConfig = existsSync('vite.config.client.ts') 
    ? '--config vite.config.client.ts'
    : '';
    
  runCommand(
    `npx vite build ${viteConfig}`,
    'Compiling React frontend with Vite'
  );
}

async function buildServer() {
  console.log('🖥️  Building Server Application');
  console.log('==============================');
  
  ensureDirectories();
  
  // Build server with esbuild
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
    '--minify',
    '--sourcemap=false'
  ].join(' ');
  
  runCommand(esbuildCommand, 'Bundling Node.js server with esbuild');
  
  // Create production package.json
  createProductionPackageJson();
}

async function validateBuild() {
  console.log('✅ Validating Build');
  console.log('===================');
  
  const requiredFiles = [
    'dist/index.js',
    'dist/package.json',
    'dist/public/index.html'
  ];
  
  let allValid = true;
  
  for (const file of requiredFiles) {
    if (existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      allValid = false;
    }
  }
  
  if (allValid) {
    console.log('\n🎉 Build validation successful!');
    console.log('📁 Deployment files ready in ./dist/');
  } else {
    console.log('\n❌ Build validation failed - missing required files');
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'build:client':
        await buildClient();
        break;
        
      case 'build:server':
        await buildServer();
        break;
        
      case 'start':
        if (!existsSync('dist/index.js')) {
          console.log('❌ Server not built. Run build first.');
          process.exit(1);
        }
        runCommand('node dist/index.js', 'Starting production server');
        break;
        
      case 'build':
      default:
        console.log('🚀 Starting Full Build Process');
        console.log('==============================\n');
        
        await buildClient();
        await buildServer();
        await validateBuild();
        
        console.log('\n🎵 Burnt Beats deployment ready!');
        console.log('Run "node deploy.js start" to test the production build');
        break;
    }
  } catch (error) {
    console.error('\n💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

main();