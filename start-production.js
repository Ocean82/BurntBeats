#!/usr/bin/env node

import { existsSync } from 'fs';
import { execSync } from 'child_process';

console.log('🎵 Starting Burnt Beats Production Server...');

// Check if build exists
if (!existsSync('dist/index.js')) {
  console.error('❌ Production build not found. Please run build first.');
  console.log('Available commands:');
  console.log('  node build-client.js    - Build client');
  console.log('  node build-server.js    - Build server');
  process.exit(1);
}

try {
  console.log('🚀 Launching server...');
  execSync('node dist/index.js', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
} catch (error) {
  console.error('❌ Server failed to start:', error.message);
  process.exit(1);
}