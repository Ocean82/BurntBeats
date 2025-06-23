#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

// Ensure dist directory exists
if (!existsSync('dist')) {
  mkdirSync('dist', { recursive: true });
}
if (!existsSync('dist/public')) {
  mkdirSync('dist/public', { recursive: true });
}

console.log('Building client application...');

try {
  execSync('npx vite build', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  console.log('✅ Client build completed successfully');
} catch (error) {
  console.error('❌ Client build failed:', error.message);
  process.exit(1);
}