#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, statSync } from 'fs';
import path from 'path';

// Enhanced logging with colors and timestamps
function log(message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'
  };
  const timestamp = new Date().toISOString();
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

// Configuration
const BUILD_DIR = 'dist';
const SERVER_ENTRY = 'server/index.ts';
const OUTPUT_FILE = 'index.js';
const TSCONFIG_FILE = 'tsconfig.server.json';

// Validation checks
function validatePrerequisites() {
  log('Validating prerequisites...');

  const requiredFiles = [
    SERVER_ENTRY,
    TSCONFIG_FILE
  ];

  const missing = requiredFiles.filter(file => !existsSync(file));
  if (missing.length > 0) {
    throw new Error(`Missing required files: ${missing.join(', ')}`);
  }

  // Check Node version
  const nodeVersion = process.versions.node.split('.')[0];
  if (parseInt(nodeVersion) < 20) {
    throw new Error(`Node.js 20+ required (current: ${process.versions.node})`);
  }

  // Check if esbuild is available
  try {
    const esbuildVersion = execSync('npx esbuild --version', { stdio: 'pipe' }).toString().trim();
    log(`Using esbuild v${esbuildVersion}`);
  } catch (error) {
    throw new Error('esbuild not available. Run: npm install esbuild');
  }

  log('✅ Prerequisites validated', 'success');
}

// Ensure dist directory exists
function ensureDirectories() {
  if (!existsSync(BUILD_DIR)) {
    log('Creating dist directory...');
    mkdirSync(BUILD_DIR, { recursive: true });
    log('📁 Created dist directory', 'success');
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
      "health-check": "curl -f http://0.0.0.0:5000/health || exit 1",
      "migrate": "drizzle-kit migrate"
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

  const packagePath = path.join(BUILD_DIR, 'package.json');
  writeFileSync(packagePath, JSON.stringify(prodPackage, null, 2));
  log('📦 Created production package.json', 'success');
}

// Validate build output
function validateBuildOutput() {
  const outputPath = path.join(BUILD_DIR, OUTPUT_FILE);

  if (!existsSync(outputPath)) {
    throw new Error('Build failed: dist/index.js not generated');
  }

  const stats = statSync(outputPath);
  if (stats.size < 1000) {
    throw new Error('Build failed: Server bundle appears to be empty or corrupted');
  }

  log(`✅ Server bundle created: ${Math.round(stats.size / 1024)}KB`, 'success');
}

async function main() {
  try {
    log('🖥️  Building server application...');

    // Step 1: Validate prerequisites
    validatePrerequisites();

    // Step 2: Ensure directories
    ensureDirectories();

    // Step 3: Build server with esbuild
    log('🔨 Building server with esbuild...');

    const esbuildCommand = [
      'npx esbuild',
      SERVER_ENTRY,
      '--bundle',
      '--platform=node',
      '--target=node20',
      '--format=esm',
      `--outfile=${path.join(BUILD_DIR, OUTPUT_FILE)}`,
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
      '--sourcemap=external',
      '--log-level=warning'
    ].join(' ');

    execSync(esbuildCommand, { 
      stdio: 'inherit',
      timeout: 120000 // 2 minute timeout
    });

    // Step 4: Create production package.json
    createProductionPackage();

    // Step 5: Validate build output
    validateBuildOutput();

    log('🎉 Server build completed successfully!', 'success');

  } catch (error) {
    log(`❌ Server build failed: ${error.message}`, 'error');
    if (error.stderr) {
      log('Error details:', 'error');
      console.error(error.stderr.toString());
    }
    process.exit(1);
  }
}

// Run the main function
main();
