#!/usr/bin/env node

/**
 * CI/CD Setup Script for Burnt Beats
 * Prepares environment for automated testing and deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CISetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.requiredEnvVars = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'NODE_ENV'
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  validateEnvironment() {
    this.log('Validating CI environment...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    this.log(`Node.js version: ${nodeVersion}`);
    
    // Check for required environment variables
    const missingVars = this.requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingVars.length > 0) {
      this.log(`Missing environment variables: ${missingVars.join(', ')}`, 'error');
      this.setupTestEnvironment();
    } else {
      this.log('All required environment variables present', 'success');
    }
  }

  setupTestEnvironment() {
    this.log('Setting up test environment variables...');
    
    const testEnv = {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test_db',
      SESSION_SECRET: 'test-secret-key-for-ci',
      NODE_ENV: 'test'
    };

    Object.entries(testEnv).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
        this.log(`Set ${key} for testing`);
      }
    });
  }

  validateBuildSystem() {
    this.log('Validating build system...');
    
    const requiredScripts = [
      'build:client',
      'build:server', 
      'test',
      'type-check'
    ];

    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length > 0) {
        this.log(`Missing scripts: ${missingScripts.join(', ')}`, 'error');
      } else {
        this.log('All required npm scripts present', 'success');
      }
    } catch (error) {
      this.log(`Error validating build system: ${error.message}`, 'error');
    }
  }

  run() {
    this.log('Starting CI/CD environment setup...');
    
    try {
      this.validateEnvironment();
      this.validateBuildSystem();
      
      this.log('CI/CD setup completed successfully!', 'success');
      process.exit(0);
    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  new CISetup().run();
}

export default CISetup;