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

  // Set production environment
  process.env.NODE_ENV = 'production';
  process.env.PORT = process.env.PORT || '5000';

  // Start the server
  const server = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: process.env
  });

  server.on('error', (error) => {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  });

  server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    if (code !== 0) {
      process.exit(code);
    }
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
}

// Main execution
try {
  validateProductionEnvironment();
  startServer();
} catch (error) {
  console.error('❌ Production startup failed:', error.message);
  process.exit(1);
}