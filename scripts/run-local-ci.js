#!/usr/bin/env node

/**
 * Local CI/CD Simulation Script for Burnt Beats
 * Runs the same checks that GitHub Actions will perform
 */

import { execSync } from 'child_process';
import fs from 'fs';

class LocalCI {
  constructor() {
    this.failed = false;
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  runCommand(command, description) {
    this.log(`Running: ${description}`);
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 120000 // 2 minute timeout
      });
      this.log(`${description} - Success`, 'success');
      return output;
    } catch (error) {
      this.log(`${description} - Failed: ${error.message}`, 'error');
      this.failed = true;
      return null;
    }
  }

  async runLocalCIPipeline() {
    this.log('🚀 Starting Local CI/CD Pipeline Simulation...\n');

    // Step 1: Environment Setup
    this.log('=== Step 1: Environment Setup ===');
    this.runCommand('node scripts/ci-setup.js', 'CI Environment Setup');

    // Step 2: Install Dependencies
    this.log('\n=== Step 2: Install Dependencies ===');
    this.runCommand('npm ci', 'Install Dependencies');

    // Step 3: Type Checking
    this.log('\n=== Step 3: Type Checking ===');
    this.runCommand('npm run type-check', 'TypeScript Type Check');

    // Step 4: Linting
    this.log('\n=== Step 4: Code Linting ===');
    this.runCommand('npm run lint', 'ESLint Code Quality Check');

    // Step 5: Build Client
    this.log('\n=== Step 5: Build Client ===');
    this.runCommand('npm run build:client', 'Frontend Build');

    // Step 6: Build Server
    this.log('\n=== Step 6: Build Server ===');
    this.runCommand('npm run build:server', 'Backend Build');

    // Step 7: Run Tests
    this.log('\n=== Step 7: Run Tests ===');
    this.runCommand('npm test', 'Test Suite Execution');

    // Step 8: Security Audit
    this.log('\n=== Step 8: Security Audit ===');
    this.runCommand('npm audit --audit-level=high', 'NPM Security Audit');

    // Step 9: Validation
    this.log('\n=== Step 9: CI/CD Validation ===');
    this.runCommand('node scripts/validate-ci.js', 'CI/CD Component Validation');

    // Step 10: Build Analysis
    this.log('\n=== Step 10: Build Analysis ===');
    this.analyzeBuildOutput();

    // Final Report
    this.generateFinalReport();
  }

  analyzeBuildOutput() {
    try {
      if (fs.existsSync('dist')) {
        const stats = this.getDirectorySize('dist');
        this.log(`Build output size: ${(stats / 1024 / 1024).toFixed(2)} MB`);
        
        const files = this.getFileList('dist');
        this.log(`Build files: ${files.length} files generated`);
        
        if (fs.existsSync('dist/index.cjs')) {
          this.log('Server bundle: Ready for deployment', 'success');
        } else {
          this.log('Server bundle: Not found', 'error');
          this.failed = true;
        }

        if (fs.existsSync('dist/public')) {
          this.log('Client assets: Ready for deployment', 'success');
        } else {
          this.log('Client assets: Not found', 'warning');
        }
      } else {
        this.log('Build directory not found', 'error');
        this.failed = true;
      }
    } catch (error) {
      this.log(`Build analysis failed: ${error.message}`, 'error');
      this.failed = true;
    }
  }

  getDirectorySize(dirPath) {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = `${dirPath}/${file.name}`;
      if (file.isDirectory()) {
        totalSize += this.getDirectorySize(filePath);
      } else {
        totalSize += fs.statSync(filePath).size;
      }
    }
    
    return totalSize;
  }

  getFileList(dirPath) {
    let files = [];
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = `${dirPath}/${item.name}`;
      if (item.isDirectory()) {
        files = files.concat(this.getFileList(itemPath));
      } else {
        files.push(itemPath);
      }
    }
    
    return files;
  }

  generateFinalReport() {
    this.log('\n' + '='.repeat(50));
    this.log('🏁 LOCAL CI/CD PIPELINE COMPLETE');
    this.log('='.repeat(50));

    if (this.failed) {
      this.log('❌ Pipeline Failed - Some checks did not pass', 'error');
      this.log('Review the errors above and fix before deploying');
      process.exit(1);
    } else {
      this.log('✅ Pipeline Succeeded - All checks passed!', 'success');
      this.log('🚀 Ready for deployment to production');
      this.log('\nNext Steps:');
      this.log('• Push to GitHub to trigger automated CI/CD');
      this.log('• Use GitHub Actions for deployment');
      this.log('• Monitor deployment logs for any issues');
      process.exit(0);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  new LocalCI().runLocalCIPipeline();
}

export default LocalCI;