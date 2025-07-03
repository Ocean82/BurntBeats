#!/usr/bin/env node

/**
 * CI/CD Validation Script for Burnt Beats
 * Validates that all CI/CD components are properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CIValidator {
  constructor() {
    this.projectRoot = path.dirname(__dirname);
    this.validationResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  addResult(component, status, message) {
    this.validationResults.push({ component, status, message });
  }

  validateWorkflowFiles() {
    this.log('Validating GitHub Actions workflow files...');
    
    const workflowFiles = [
      '.github/workflows/build-and-test.yml',
      '.github/workflows/deploy.yml'
    ];

    workflowFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for required workflow components
        const requiredComponents = [
          'name:',
          'on:',
          'jobs:',
          'runs-on: ubuntu-latest',
          'uses: actions/checkout@v4',
          'uses: actions/setup-node@v4'
        ];

        const missingComponents = requiredComponents.filter(component => 
          !content.includes(component)
        );

        if (missingComponents.length === 0) {
          this.addResult(file, 'success', 'All required components present');
          this.log(`${file}: All required components present`, 'success');
        } else {
          this.addResult(file, 'error', `Missing: ${missingComponents.join(', ')}`);
          this.log(`${file}: Missing components - ${missingComponents.join(', ')}`, 'error');
        }
      } else {
        this.addResult(file, 'error', 'File not found');
        this.log(`${file}: File not found`, 'error');
      }
    });
  }

  validateESLintConfig() {
    this.log('Validating ESLint configuration...');
    
    const eslintConfigPath = path.join(this.projectRoot, '.eslintrc.cjs');
    if (fs.existsSync(eslintConfigPath)) {
      const content = fs.readFileSync(eslintConfigPath, 'utf8');
      
      const requiredConfig = [
        'module.exports',
        '@typescript-eslint/recommended',
        'parser: \'@typescript-eslint/parser\'',
        'plugins: [\'@typescript-eslint\']'
      ];

      const hasAllConfig = requiredConfig.every(config => content.includes(config));
      
      if (hasAllConfig) {
        this.addResult('ESLint Config', 'success', 'Configuration is complete');
        this.log('ESLint configuration is properly set up', 'success');
      } else {
        this.addResult('ESLint Config', 'warning', 'Some configuration may be missing');
        this.log('ESLint configuration may need updates', 'warning');
      }
    } else {
      this.addResult('ESLint Config', 'error', 'Configuration file not found');
      this.log('ESLint configuration file not found', 'error');
    }
  }

  validatePackageScripts() {
    this.log('Validating package.json scripts...');
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredScripts = [
      'build:client',
      'build:server',
      'test',
      'type-check',
      'lint'
    ];

    const missingScripts = requiredScripts.filter(script => 
      !packageJson.scripts || !packageJson.scripts[script]
    );

    if (missingScripts.length === 0) {
      this.addResult('Package Scripts', 'success', 'All required scripts present');
      this.log('All required npm scripts are available', 'success');
    } else {
      this.addResult('Package Scripts', 'error', `Missing: ${missingScripts.join(', ')}`);
      this.log(`Missing npm scripts: ${missingScripts.join(', ')}`, 'error');
    }
  }

  validateDocumentation() {
    this.log('Validating CI/CD documentation...');
    
    const docFiles = [
      'CI_CD_SETUP.md'
    ];

    docFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasContent = content.length > 1000; // Basic content check
        
        if (hasContent) {
          this.addResult(file, 'success', 'Documentation is comprehensive');
          this.log(`${file}: Documentation is comprehensive`, 'success');
        } else {
          this.addResult(file, 'warning', 'Documentation may need more detail');
          this.log(`${file}: Documentation may need more detail`, 'warning');
        }
      } else {
        this.addResult(file, 'error', 'Documentation file not found');
        this.log(`${file}: Documentation file not found`, 'error');
      }
    });
  }

  generateValidationReport() {
    this.log('Generating validation report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      projectName: 'Burnt Beats',
      validationResults: this.validationResults,
      summary: {
        total: this.validationResults.length,
        success: this.validationResults.filter(r => r.status === 'success').length,
        warnings: this.validationResults.filter(r => r.status === 'warning').length,
        errors: this.validationResults.filter(r => r.status === 'error').length
      }
    };

    const reportPath = path.join(this.projectRoot, 'ci-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Validation report saved to: ${reportPath}`);
    
    // Print summary
    this.log('\n=== VALIDATION SUMMARY ===');
    this.log(`Total components checked: ${report.summary.total}`);
    this.log(`✅ Success: ${report.summary.success}`, 'success');
    this.log(`⚠️ Warnings: ${report.summary.warnings}`, 'warning');
    this.log(`❌ Errors: ${report.summary.errors}`, 'error');
    
    return report.summary.errors === 0;
  }

  run() {
    this.log('Starting CI/CD validation...\n');
    
    try {
      this.validateWorkflowFiles();
      this.validateESLintConfig();
      this.validatePackageScripts();
      this.validateDocumentation();
      
      const isValid = this.generateValidationReport();
      
      if (isValid) {
        this.log('\n🎉 CI/CD pipeline validation completed successfully!', 'success');
        process.exit(0);
      } else {
        this.log('\n⚠️ CI/CD pipeline validation completed with errors', 'warning');
        process.exit(1);
      }
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  new CIValidator().run();
}

export default CIValidator;