
#!/usr/bin/env node

import { existsSync } from 'fs';
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';

console.log('🎵 Starting Burnt Beats Production Server...');

// Check if build exists
if (!existsSync('dist/index.js')) {
  console.error('❌ Production build not found. Please run build first.');
  console.log('Available commands:');
  console.log('  node build-client.js    - Build client');
  console.log('  node build-server.js    - Build server');
  process.exit(1);
}

// Check if port 5000 is available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(port, '0.0.0.0', () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

// Kill any existing processes on port 5000
function killExistingProcesses() {
  try {
    console.log('🔍 Checking for existing processes on port 5000...');
    execSync('pkill -f "node dist/index.js" || true', { stdio: 'pipe' });
    execSync('pkill -f "port 5000" || true', { stdio: 'pipe' });
    console.log('✅ Cleaned up existing processes');
  } catch (error) {
    // Ignore errors - processes might not exist
  }
}

async function startServer() {
  try {
    // Clean up any existing processes
    killExistingProcesses();
    
    // Wait a moment for processes to clean up
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if port is available
    const portAvailable = await checkPort(5000);
    if (!portAvailable) {
      console.error('❌ Port 5000 is still in use. Trying to force cleanup...');
      execSync('fuser -k 5000/tcp || true', { stdio: 'pipe' });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('🚀 Launching server on port 5000...');
    
    // Start the server with proper error handling
    const serverProcess = spawn('node', ['dist/index.js'], {
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        PORT: '5000'
      }
    });
    
    // Handle server process events
    serverProcess.on('error', (error) => {
      console.error('❌ Server process error:', error.message);
      process.exit(1);
    });
    
    serverProcess.on('exit', (code, signal) => {
      if (code !== 0) {
        console.error(`❌ Server exited with code ${code}, signal ${signal}`);
        process.exit(1);
      }
    });
    
    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('📝 Received SIGTERM, shutting down gracefully...');
      serverProcess.kill('SIGTERM');
    });
    
    process.on('SIGINT', () => {
      console.log('📝 Received SIGINT, shutting down gracefully...');
      serverProcess.kill('SIGTERM');
    });
    
  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1);
  }
}

startServer();
