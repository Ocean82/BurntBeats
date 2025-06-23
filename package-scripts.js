#!/usr/bin/env node

/**
 * Build scripts for deployment
 * This file provides the missing build commands needed for deployment
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

function runCommand(command, description) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function ensureDirectories() {
  const dirs = ['dist', 'dist/public'];
  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

async function buildClient() {
  ensureDirectories();
  runCommand('npx vite build', 'Building client application');
}

async function buildServer() {
  ensureDirectories();
  const command = `npx esbuild server/index.ts --bundle --platform=node --target=node20 --format=esm --outfile=dist/index.js --external:pg-native --external:bufferutil --external:utf-8-validate --external:fsevents`;
  runCommand(command, 'Building server application');
}

async function start() {
  runCommand('node dist/index.js', 'Starting production server');
}

// Parse command line arguments
const command = process.argv[2];

switch (command) {
  case 'build:client':
    buildClient();
    break;
  case 'build:server':
    buildServer();
    break;
  case 'build':
    console.log('🚀 Starting full build process...');
    await buildClient();
    await buildServer();
    console.log('✅ Build process completed successfully');
    break;
  case 'start':
    start();
    break;
  default:
    console.log(`
Available commands:
  node package-scripts.js build:client   - Build client application
  node package-scripts.js build:server   - Build server application  
  node package-scripts.js build          - Build both client and server
  node package-scripts.js start          - Start production server
`);
    break;
}