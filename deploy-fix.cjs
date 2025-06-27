#!/usr/bin/env node

/**
 * Comprehensive Deployment Fix for Burnt Beats
 * Addresses all deployment configuration issues for Replit
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function runCommand(command, description, options = {}) {
  log(`${description}...`);
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      ...options 
    });
    log(`${description} completed`, 'success');
    return result;
  } catch (error) {
    log(`${description} failed: ${error.message}`, 'error');
    throw error;
  }
}

function ensureDirectories() {
  const directories = ['dist', 'dist/public', 'dist/uploads'];
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Created directory: ${dir}`);
    }
  });
}

function createProductionPackageJson() {
  const productionPackage = {
    "name": "burnt-beats-production",
    "version": "1.0.0",
    "type": "commonjs",
    "main": "index.cjs",
    "scripts": {
      "start": "node index.cjs"
    },
    "engines": {
      "node": ">=20.0.0"
    },
    "dependencies": {
      "express": "^4.21.2",
      "cors": "^2.8.5",
      "express-session": "^1.18.1",
      "connect-pg-simple": "^10.0.0",
      "express-rate-limit": "^7.5.1",
      "multer": "^2.0.1",
      "stripe": "^18.2.1",
      "drizzle-orm": "^0.39.1",
      "@neondatabase/serverless": "^0.10.4",
      "zod": "^3.24.2",
      "sanitize-filename": "^1.6.3",
      "nanoid": "^5.1.5",
      "ws": "^8.18.0",
      "helmet": "^8.1.0",
      "passport": "^0.7.0",
      "passport-local": "^1.0.0",
      "openid-client": "^6.5.3"
    }
  };

  fs.writeFileSync('dist/package.json', JSON.stringify(productionPackage, null, 2));
  log('Created production package.json', 'success');
}

function updateMainPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Ensure we have the correct start script
  packageContent.scripts.start = "node dist/index.cjs";
  packageContent.scripts.build = "npm run build:client && npm run build:server";
  
  fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));
  log('Updated main package.json with production scripts', 'success');
}

function buildClient() {
  log('Building client application...');
  runCommand('npx vite build', 'Client build');
}

function buildServer() {
  log('Building server application...');
  const command = [
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
    '--minify'
  ].join(' ');
  
  runCommand(command, 'Server build');
}

function createHealthCheck() {
  const healthCheckContent = `const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'burnt-beats',
    version: '1.0.0'
  });
});

module.exports = app;
`;

  fs.writeFileSync('dist/health-check.js', healthCheckContent);
  log('Created health check endpoint', 'success');
}

function validateBuild() {
  const requiredFiles = [
    'dist/index.cjs',
    'dist/package.json',
    'dist/public/index.html'
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    log(`Missing required files: ${missingFiles.join(', ')}`, 'error');
    throw new Error('Build validation failed');
  }

  log('Build validation passed', 'success');
}

function createStartupScript() {
  const startupScript = `#!/bin/bash
# Burnt Beats Production Startup Script

echo "🎵 Starting Burnt Beats Production Server..."

# Set environment variables
export NODE_ENV=production
export PORT=\${PORT:-5000}

# Ensure all directories exist
mkdir -p dist/uploads

# Start the server
echo "Starting server on port \$PORT..."
cd dist && npm start
`;

  fs.writeFileSync('start-production.sh', startupScript);
  fs.chmodSync('start-production.sh', '755');
  log('Created startup script', 'success');
}

async function main() {
  try {
    log('Starting deployment fix for Burnt Beats...', 'info');
    
    // Step 1: Ensure directories exist
    ensureDirectories();
    
    // Step 2: Update package.json files
    updateMainPackageJson();
    createProductionPackageJson();
    
    // Step 3: Build the application
    buildClient();
    buildServer();
    
    // Step 4: Create additional deployment files
    createHealthCheck();
    createStartupScript();
    
    // Step 5: Validate the build
    validateBuild();
    
    log('Deployment fix completed successfully!', 'success');
    log('Ready for Replit deployment with the following configuration:', 'info');
    log('- Run command: npm start', 'info');
    log('- Build command: npm run build', 'info');
    log('- Working directory: . (root)', 'info');
    log('- Port: 5000', 'info');
    
  } catch (error) {
    log(`Deployment fix failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the deployment fix
main();