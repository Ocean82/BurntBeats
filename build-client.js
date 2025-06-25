
#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, statSync } from 'fs';
import path from 'path';

console.log('🏗️  Building client application...');

// Validation checks
function validatePrerequisites() {
  const requiredFiles = [
    'client/src/main.tsx',
    'client/src/App.tsx',
    'vite.config.ts'
  ];
  
  const missing = requiredFiles.filter(file => !existsSync(file));
  if (missing.length > 0) {
    throw new Error(`Missing required files: ${missing.join(', ')}`);
  }
  
  console.log('✅ Prerequisites validated');
}

// Ensure directories exist
function ensureDirectories() {
  const dirs = ['dist', 'dist/public'];
  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

// Validate build output
function validateBuildOutput() {
  const requiredFiles = [
    'dist/public/index.html'
  ];
  
  const missing = requiredFiles.filter(file => !existsSync(file));
  if (missing.length > 0) {
    throw new Error(`Build failed: Missing output files: ${missing.join(', ')}`);
  }
  
  // Check if index.html has content
  const indexPath = 'dist/public/index.html';
  const stats = statSync(indexPath);
  if (stats.size < 100) {
    throw new Error('Build failed: index.html appears to be empty or corrupted');
  }
  
  console.log('✅ Build output validated');
}

try {
  // Step 1: Validate prerequisites
  validatePrerequisites();
  
  // Step 2: Ensure directories
  ensureDirectories();
  
  // Step 3: Build client
  console.log('📦 Running Vite build...');
  execSync('npx vite build', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      VITE_API_URL: '/api'
    }
  });
  
  // Step 4: Validate output
  validateBuildOutput();
  
  console.log('✅ Client build completed successfully');
  console.log(`📊 Build size: ${Math.round(statSync('dist/public/index.html').size / 1024)}KB`);
  
} catch (error) {
  console.error('❌ Client build failed:', error.message);
  
  // Cleanup on failure
  try {
    if (existsSync('dist/public')) {
      execSync('rm -rf dist/public/*', { stdio: 'pipe' });
      console.log('🧹 Cleaned up partial build artifacts');
    }
  } catch (cleanupError) {
    console.warn('⚠️  Failed to cleanup build artifacts:', cleanupError.message);
  }
  
  process.exit(1);
}
