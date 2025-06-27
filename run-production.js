
#!/usr/bin/env node

/**
 * Unified Production Server Launcher for Replit
 * Enhanced with monitoring, error recovery, and resource management
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configure environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';
process.env.HOST = '0.0.0.0';

// Enhanced logging with colors and timestamps
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'
  };
  
  const timestamp = new Date().toISOString();
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

// Memory and performance monitoring
class ResourceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.setupMonitoring();
  }
  
  setupMonitoring() {
    // Monitor every 30 seconds in production
    setInterval(() => {
      const memory = process.memoryUsage();
      const uptime = Math.round((Date.now() - this.startTime) / 1000);
      
      log(`Memory: ${Math.round(memory.heapUsed / 1024 / 1024)}MB | Uptime: ${uptime}s`, 'info');
      
      // Alert if memory usage is high
      const memoryMB = memory.heapUsed / 1024 / 1024;
      if (memoryMB > 400) {
        log(`High memory usage detected: ${Math.round(memoryMB)}MB`, 'warn');
      }
    }, 30000);
  }
  
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      memory: Math.round(os.totalmem() / 1024 / 1024),
      cpus: os.cpus().length
    };
  }
}

// Directory structure manager
class DirectoryManager {
  static requiredDirs = [
    'dist',
    'dist/public',
    'uploads',
    'storage',
    'storage/voices',
    'storage/music',
    'storage/temp',
    'logs'
  ];
  
  static ensureDirectories() {
    log('Ensuring required directories exist...', 'info');
    
    this.requiredDirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        log(`Created directory: ${dir}`, 'success');
      }
    });
  }
  
  static cleanupTempFiles() {
    const tempDir = path.join(process.cwd(), 'storage', 'temp');
    if (fs.existsSync(tempDir)) {
      try {
        const files = fs.readdirSync(tempDir);
        let cleanedCount = 0;
        
        files.forEach(file => {
          const filePath = path.join(tempDir, file);
          const stats = fs.statSync(filePath);
          const age = Date.now() - stats.mtime.getTime();
          
          // Remove files older than 1 hour
          if (age > 3600000) {
            fs.unlinkSync(filePath);
            cleanedCount++;
          }
        });
        
        if (cleanedCount > 0) {
          log(`Cleaned up ${cleanedCount} temporary files`, 'success');
        }
      } catch (error) {
        log(`Error cleaning temp files: ${error.message}`, 'warn');
      }
    }
  }
}

// Build verification and management
class BuildManager {
  static verifyBuild() {
    log('Verifying build artifacts...', 'info');
    
    const requiredFiles = [
      'dist/index.cjs',
      'dist/package.json'
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
      log(`Missing build files: ${missingFiles.join(', ')}`, 'error');
      return false;
    }
    
    // Check if build is recent (less than 24 hours old)
    const buildFile = 'dist/index.cjs';
    const stats = fs.statSync(buildFile);
    const age = Date.now() - stats.mtime.getTime();
    const hoursOld = age / (1000 * 60 * 60);
    
    if (hoursOld > 24) {
      log(`Build is ${Math.round(hoursOld)} hours old, consider rebuilding`, 'warn');
    }
    
    log('Build verification completed successfully', 'success');
    return true;
  }
  
  static async ensureBuild() {
    if (!this.verifyBuild()) {
      log('Building application...', 'info');
      
      try {
        // Build the application
        execSync('npm run build', { 
          stdio: 'inherit',
          timeout: 300000 // 5 minute timeout
        });
        
        if (!this.verifyBuild()) {
          throw new Error('Build verification failed after rebuild');
        }
        
        log('Build completed successfully', 'success');
      } catch (error) {
        log(`Build failed: ${error.message}`, 'error');
        throw error;
      }
    }
  }
}

// Health check service
class HealthChecker {
  static createHealthEndpoint() {
    const healthCheck = `
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  };
  
  res.json(health);
});

app.get('/ready', (req, res) => {
  // Check if main server is ready
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

const port = parseInt(process.env.HEALTH_PORT || '5001', 10);
app.listen(port, '0.0.0.0', () => {
  console.log(\`Health check server running on port \${port}\`);
});
`;
    
    fs.writeFileSync('health-server.js', healthCheck);
    log('Health check endpoint created', 'success');
  }
}

// Process manager for graceful shutdown
class ProcessManager {
  static setupGracefulShutdown() {
    const shutdown = (signal) => {
      log(`Received ${signal} - initiating graceful shutdown`, 'warn');
      
      // Cleanup temp files
      DirectoryManager.cleanupTempFiles();
      
      // Give processes time to cleanup
      setTimeout(() => {
        log('Shutdown complete', 'info');
        process.exit(0);
      }, 5000);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    process.on('uncaughtException', (err) => {
      log(`Uncaught Exception: ${err.message}`, 'error');
      console.error(err.stack);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      log(`Unhandled Rejection: ${reason}`, 'error');
      console.error('Promise:', promise);
      process.exit(1);
    });
  }
}

// Main execution
async function main() {
  try {
    log('🎵 Starting Burnt Beats Production Server', 'info');
    log('=========================================', 'info');
    
    // Initialize monitoring
    const monitor = new ResourceMonitor();
    const systemInfo = monitor.getSystemInfo();
    log(`System: ${systemInfo.platform}/${systemInfo.arch} | Node: ${systemInfo.nodeVersion} | CPUs: ${systemInfo.cpus} | RAM: ${systemInfo.memory}MB`, 'info');
    
    // Setup graceful shutdown
    ProcessManager.setupGracefulShutdown();
    
    // Ensure directories
    DirectoryManager.ensureDirectories();
    
    // Cleanup old files
    DirectoryManager.cleanupTempFiles();
    
    // Verify and ensure build
    await BuildManager.ensureBuild();
    
    // Create health check
    HealthChecker.createHealthEndpoint();
    
    // Start health check server in background
    spawn('node', ['health-server.js'], {
      detached: false,
      stdio: 'inherit'
    });
    
    // Change to dist directory
    process.chdir('dist');
    
    log(`Server starting on http://0.0.0.0:${process.env.PORT}`, 'success');
    log('Health check available at /health', 'info');
    
    // Start the main server
    require('./index.cjs');
    
  } catch (error) {
    log(`❌ Production startup failed: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute if running directly
if (require.main === module) {
  main();
}

module.exports = { main };
