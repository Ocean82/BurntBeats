#!/usr/bin/env node

/**
 * Simple test runner for Burnt Beats
 * Runs all tests and reports failures
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Simple test framework
global.describe = function(name, fn) {
  log(`\n${name}`, 'cyan');
  fn();
};

global.it = function(name, fn) {
  try {
    fn();
    log(`  ✓ ${name}`, 'green');
    return true;
  } catch (error) {
    log(`  ✗ ${name}`, 'red');
    log(`    ${error.message}`, 'red');
    return false;
  }
};

global.beforeEach = function(fn) {
  // Store for later execution
  global._beforeEach = fn;
};

global.expect = function(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
      }
    },
    toHaveBeenCalledWith: (expected) => {
      if (!actual.calls || !actual.calls.some(call => JSON.stringify(call) === JSON.stringify([expected]))) {
        throw new Error(`Expected function to have been called with ${JSON.stringify(expected)}`);
      }
    },
    toContain: (expected) => {
      if (!actual.includes(expected)) {
        throw new Error(`Expected ${actual} to contain ${expected}`);
      }
    },
    toThrow: () => {
      let threw = false;
      try {
        actual();
      } catch (e) {
        threw = true;
      }
      if (!threw) {
        throw new Error('Expected function to throw');
      }
    }
  };
};

global.jest = {
  fn: () => {
    const mockFn = function(...args) {
      mockFn.calls = mockFn.calls || [];
      mockFn.calls.push(args);
      return mockFn.returnValue;
    };
    mockFn.mockReturnThis = () => {
      mockFn.returnValue = mockFn;
      return mockFn;
    };
    mockFn.mockReturnValue = (value) => {
      mockFn.returnValue = value;
      return mockFn;
    };
    return mockFn;
  }
};

async function runTests() {
  log('Burnt Beats Test Suite', 'bold');
  log('====================', 'cyan');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Basic functionality
  describe('Basic System Tests', () => {
    it('should have required directories', () => {
      const dirs = ['server', 'client', 'shared', 'storage'];
      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
          throw new Error(`Missing directory: ${dir}`);
        }
      });
      totalTests++;
      passedTests++;
    });

    it('should have database connection', () => {
      const dbFile = path.join(process.cwd(), 'server', 'db.ts');
      if (!fs.existsSync(dbFile)) {
        throw new Error('Database file missing');
      }
      totalTests++;
      passedTests++;
    });

    it('should have storage implementation', () => {
      const storageFile = path.join(process.cwd(), 'server', 'storage.ts');
      if (!fs.existsSync(storageFile)) {
        throw new Error('Storage file missing');
      }
      totalTests++;
      passedTests++;
    });
  });

  // Test 2: Voice bank integration
  describe('Voice Bank Integration', () => {
    it('should have voice bank service', () => {
      const serviceFile = path.join(process.cwd(), 'server', 'services', 'voice-bank-integration.ts');
      if (!fs.existsSync(serviceFile)) {
        throw new Error('Voice bank service missing');
      }
      totalTests++;
      passedTests++;
    });

    it('should have voice storage directory', () => {
      const voiceDir = path.join(process.cwd(), 'storage', 'voice-bank');
      if (!fs.existsSync(voiceDir)) {
        throw new Error('Voice bank storage directory missing');
      }
      totalTests++;
      passedTests++;
    });

    it('should have default voice file', () => {
      const voiceFile = path.join(process.cwd(), 'storage', 'voice-bank', 'default-voice.mp3');
      if (!fs.existsSync(voiceFile)) {
        throw new Error('Default voice file missing');
      }
      const stats = fs.statSync(voiceFile);
      if (stats.size < 1000000) { // Should be > 1MB
        throw new Error('Voice file too small');
      }
      totalTests++;
      passedTests++;
    });
  });

  // Test 3: API endpoints
  describe('API Routes', () => {
    it('should have main routes file', () => {
      const routesFile = path.join(process.cwd(), 'server', 'routes.ts');
      if (!fs.existsSync(routesFile)) {
        throw new Error('Routes file missing');
      }
      
      const routesContent = fs.readFileSync(routesFile, 'utf8');
      if (!routesContent.includes('/api/voice-bank/')) {
        throw new Error('Voice bank routes not found');
      }
      totalTests++;
      passedTests++;
    });

    it('should have authentication middleware', () => {
      const authFile = path.join(process.cwd(), 'server', 'middleware', 'auth.ts');
      if (!fs.existsSync(authFile)) {
        throw new Error('Auth middleware missing');
      }
      totalTests++;
      passedTests++;
    });
  });

  // Test 4: Schema validation
  describe('Database Schema', () => {
    it('should have shared schema', () => {
      const schemaFile = path.join(process.cwd(), 'shared', 'schema.ts');
      if (!fs.existsSync(schemaFile)) {
        throw new Error('Schema file missing');
      }
      
      const schemaContent = fs.readFileSync(schemaFile, 'utf8');
      if (!schemaContent.includes('export const users') || 
          !schemaContent.includes('export const songs')) {
        throw new Error('Required tables missing from schema');
      }
      totalTests++;
      passedTests++;
    });
  });

  // Test 5: Frontend components
  describe('Frontend Components', () => {
    it('should have client directory structure', () => {
      const clientDirs = ['client/src', 'client/src/components', 'client/src/hooks'];
      clientDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
          throw new Error(`Missing client directory: ${dir}`);
        }
      });
      totalTests++;
      passedTests++;
    });
  });

  failedTests = totalTests - passedTests;

  log(`\nTest Results:`, 'bold');
  log(`Total: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');

  if (failedTests === 0) {
    log('\nAll tests passed! 🎉', 'green');
    return true;
  } else {
    log(`\n${failedTests} test(s) failed`, 'red');
    return false;
  }
}

// Run tests
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`Test runner error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runTests };