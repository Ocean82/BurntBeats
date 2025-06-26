#!/usr/bin/env node

// Production server start script for Replit deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('Starting Burnt Beats production server...');

// Ensure production build exists
if (!fs.existsSync('dist/index.cjs')) {
  console.log('Building server...');
  execSync('npx esbuild server/index.ts --bundle --platform=node --target=node20 --format=cjs --outfile=dist/index.cjs --external:pg-native --external:bufferutil --external:utf-8-validate --external:fsevents --minify', { stdio: 'inherit' });
}

// Ensure directories exist
if (!fs.existsSync('dist/uploads')) {
  fs.mkdirSync('dist/uploads', { recursive: true });
}

// Change to dist directory and start server
process.chdir('dist');

// Start the server
require('./index.cjs');