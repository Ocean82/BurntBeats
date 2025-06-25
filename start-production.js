#!/usr/bin/env node

/**
 * Production start script for Burnt Beats
 * Handles environment validation and graceful startup
 */

import { existsSync } from 'fs';
import { spawn } from 'child_process';

function validateProductionEnvironment() {
  console.log('🔧 Validating production environment...');

  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }

  console.log('✅ Production environment validated');
}

function startServer() {
  if (!existsSync('dist/index.js')) {
    console.error('❌ Production build not found at dist/index.js');
    console.error('Run the build process first: node quick-deploy.js build');
    process.exit(1);
  }

  console.log('🚀 Starting Burnt Beats production server...');
  console.log('🎵 Burnt Beats - AI Music Creation Platform');
  console.log('=====================================');
  console.log(`📍 Server will start on port: ${process.env.PORT || '5000'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Set production environment
  process.env.NODE_ENV = 'production';
  process.env.PORT = process.env.PORT || '5000';

  // Add debug info
  console.log('🔍 Environment check:');
  console.log(`  - DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - PORT: ${process.env.PORT}`);

  // Start the server with better error capture
  console.log('🎯 Launching server process...');
  const server = spawn('node', ['dist/index.js'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: process.env,
    cwd: process.cwd()
  });

  server.on('spawn', () => {
    console.log('✅ Server process spawned successfully');
  });

  server.on('error', (error) => {
    console.error('❌ Server startup error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  });

  server.on('exit', (code, signal) => {
    console.log(`🛑 Server process exited with code ${code}, signal ${signal}`);
    if (code !== 0) {
      console.error('❌ Server failed to start properly');
      process.exit(code || 1);
    }
  });

  // Keep the process alive
  server.on('close', (code) => {
    console.log(`Server process closed with code ${code}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    server.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    server.kill('SIGINT');
  });

  // Add timeout to detect hanging
  setTimeout(() => {
    console.log('⏰ Server startup timeout check (30s)');
    if (server.exitCode === null) {
      console.log('✅ Server is still running after 30 seconds - looks good!');
    }
  }, 30000);
}

// Main execution
try {
  validateProductionEnvironment();
  startServer();
} catch (error) {
  console.error('❌ Production startup failed:', error.message);
  process.exit(1);
}