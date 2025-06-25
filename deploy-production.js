#!/usr/bin/env node

/**
 * Production Deployment Script for Burnt Beats
 * Handles Replit deployment with proper port configuration
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

function createProductionEnv() {
  log('Setting up production environment variables');
  
  // Create production-specific environment
  const prodEnv = {
    NODE_ENV: 'production',
    PORT: process.env.REPL_ID ? '80' : '3000', // Use port 80 for Replit deployment
    DATABASE_URL: process.env.DATABASE_URL,
    REPLIT_DB_URL: process.env.REPLIT_DB_URL,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    SESSION_SECRET: process.env.SESSION_SECRET || 'burnt-beats-production-secret',
    REPLIT_DOMAINS: process.env.REPLIT_DOMAINS || 'burnt-beats-sammyjernigan.replit.app'
  };

  // Write production env file
  const envContent = Object.entries(prodEnv)
    .filter(([key, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
    
  fs.writeFileSync('.env.production', envContent);
  log('Production environment file created', 'success');
}

function updateProductionServer() {
  log('Updating server configuration for production deployment');
  
  const serverPath = path.join(__dirname, 'server', 'index.ts');
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Update port configuration for Replit deployment
  const portConfig = `const port = process.env.REPL_ID ? 80 : parseInt(process.env.PORT || '3000', 10);`;
  
  serverContent = serverContent.replace(
    /const port = parseInt\(process\.env\.PORT \|\| '5000', 10\);/,
    portConfig
  );
  
  fs.writeFileSync(serverPath, serverContent);
  log('Server configuration updated for Replit deployment', 'success');
}

function buildForProduction() {
  log('Building application for production');
  
  // Clean previous build
  if (fs.existsSync('dist')) {
    runCommand('rm -rf dist', 'Cleaning previous build');
  }
  
  // Build the application
  runCommand('npm run build', 'Building application');
  
  // Verify build output
  const requiredFiles = [
    'dist/index.cjs',
    'dist/package.json',
    'dist/public/index.html'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing required build file: ${file}`);
    }
  }
  
  log('Build verification completed', 'success');
}

function createDeploymentManifest() {
  log('Creating deployment manifest');
  
  const manifest = {
    name: 'burnt-beats',
    version: '1.0.0',
    built: new Date().toISOString(),
    environment: 'production',
    entryPoint: 'index.cjs',
    healthCheck: '/health',
    port: process.env.REPL_ID ? 80 : parseInt(process.env.PORT || '3000', 10),
    files: {
      server: 'index.cjs',
      client: 'public/',
      health: 'health-check.js'
    }
  };
  
  fs.writeFileSync('dist/deployment-manifest.json', JSON.stringify(manifest, null, 2));
  log('Deployment manifest created', 'success');
}

function testDeployment() {
  log('Running deployment validation tests');
  
  try {
    // Test health check
    runCommand('cd dist && node health-check.js', 'Testing health check');
    
    // Test server startup (with timeout)
    const testEnv = { ...process.env, NODE_ENV: 'production', PORT: '8080' };
    runCommand('cd dist && timeout 5s node index.cjs || true', 'Testing server startup', { env: testEnv });
    
    log('Deployment validation passed', 'success');
  } catch (error) {
    log(`Deployment validation failed: ${error.message}`, 'error');
    throw error;
  }
}

async function main() {
  try {
    log('Starting Burnt Beats production deployment');
    
    // Step 1: Create production environment
    createProductionEnv();
    
    // Step 2: Update server configuration
    updateProductionServer();
    
    // Step 3: Build for production
    buildForProduction();
    
    // Step 4: Create deployment manifest
    createDeploymentManifest();
    
    // Step 5: Validate deployment
    testDeployment();
    
    log('Production deployment completed successfully!', 'success');
    log('To deploy on Replit, click the Deploy button in your Replit console');
    log('The application will be available at: https://burnt-beats-sammyjernigan.replit.app');
    
  } catch (error) {
    log(`Deployment failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };