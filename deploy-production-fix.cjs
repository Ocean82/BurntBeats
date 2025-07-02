#!/usr/bin/env node

/**
 * Reliable Production Deployment Script for Burnt Beats
 * 
 * This script creates a bulletproof deployment by:
 * 1. Using only core Node.js modules and installed dependencies
 * 2. Creating a self-contained server bundle with esbuild
 * 3. Generating a minimal but functional client
 * 4. Validating all deployment artifacts
 * 
 * No external build tool dependencies - maximum reliability
 */

const { execSync } = require('child_process');
const { existsSync, mkdirSync, writeFileSync, readFileSync, statSync } = require('fs');
const path = require('path');

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

// Execute command with comprehensive error handling
function runCommand(command, description, options = {}) {
  log(`Executing: ${description}`, 'info');
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      timeout: 300000, // 5 minute timeout
      ...options
    });
    log(`✅ ${description} completed successfully`, 'success');
    return result;
  } catch (error) {
    log(`❌ ${description} failed`, 'error');
    if (error.stdout) console.error('STDOUT:', error.stdout.toString());
    if (error.stderr) console.error('STDERR:', error.stderr.toString());
    if (error.signal) console.error('Signal:', error.signal);
    if (error.status) console.error('Exit Code:', error.status);
    
    if (!options.continueOnError) {
      process.exit(1);
    }
    return null;
  }
}

// Validate deployment environment
function validateEnvironment() {
  log('🔍 Validating deployment environment', 'info');
  
  // Check essential files
  const requiredFiles = [
    'package.json',
    'server/index.ts'
  ];
  
  const missingFiles = requiredFiles.filter(file => !existsSync(file));
  if (missingFiles.length > 0) {
    log(`❌ Missing required files: ${missingFiles.join(', ')}`, 'error');
    process.exit(1);
  }
  
  // Check Node.js version
  const nodeVersion = parseInt(process.versions.node.split('.')[0]);
  if (nodeVersion < 18) {
    log(`❌ Node.js 18+ required (current: ${process.versions.node})`, 'error');
    process.exit(1);
  }
  
  // Check if npm is available
  try {
    const npmVersion = execSync('npm --version', { stdio: 'pipe' }).toString().trim();
    log(`Using npm v${npmVersion}`, 'info');
  } catch (error) {
    log('❌ npm not available', 'error');
    process.exit(1);
  }
  
  log('✅ Environment validation passed', 'success');
}

// Create required directory structure
function ensureDirectories() {
  log('📁 Creating deployment directory structure', 'info');
  
  const dirs = [
    'dist',
    'dist/public',
    'dist/assets', 
    'uploads'
  ];
  
  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      log(`Created directory: ${dir}`, 'info');
    }
  });
  
  log('✅ Directory structure ready', 'success');
}

// Create production package.json with minimal dependencies
function createProductionPackage() {
  log('📦 Creating production package.json', 'info');
  
  // Read current package.json to get dependency versions
  let currentPackage;
  try {
    currentPackage = JSON.parse(readFileSync('package.json', 'utf8'));
  } catch (error) {
    log('❌ Cannot read package.json', 'error');
    process.exit(1);
  }
  
  // Create minimal production package with only runtime dependencies
  const prodPackage = {
    "name": "burnt-beats-production",
    "version": "1.0.0",
    "type": "module",
    "engines": {
      "node": ">=18"
    },
    "scripts": {
      "start": "node index.js"
    },
    "dependencies": {
      // Core server dependencies only
      "@neondatabase/serverless": currentPackage.dependencies["@neondatabase/serverless"],
      "@google-cloud/storage": currentPackage.dependencies["@google-cloud/storage"],
      "express": currentPackage.dependencies["express"],
      "express-session": currentPackage.dependencies["express-session"],
      "express-rate-limit": currentPackage.dependencies["express-rate-limit"],
      "connect-pg-simple": currentPackage.dependencies["connect-pg-simple"],
      "cors": currentPackage.dependencies["cors"],
      "helmet": currentPackage.dependencies["helmet"],
      "multer": currentPackage.dependencies["multer"],
      "stripe": currentPackage.dependencies["stripe"],
      "ws": currentPackage.dependencies["ws"],
      "zod": currentPackage.dependencies["zod"],
      "drizzle-orm": currentPackage.dependencies["drizzle-orm"],
      "nanoid": currentPackage.dependencies["nanoid"]
    }
  };
  
  const packagePath = path.join('dist', 'package.json');
  writeFileSync(packagePath, JSON.stringify(prodPackage, null, 2));
  log(`✅ Production package.json created at ${packagePath}`, 'success');
}

// Create self-contained client application
function createClientApplication() {
  log('🌐 Creating production client application', 'info');
  
  const clientHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Burnt Beats - AI Music Creation Platform</title>
    <meta name="description" content="Transform text into professional-quality songs with AI-powered music generation, voice cloning, and advanced editing capabilities.">
    <meta name="keywords" content="AI music generation, voice cloning, song creation, music production">
    
    <!-- Open Graph / Social Media -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="Burnt Beats - AI Music Creation Platform">
    <meta property="og:description" content="Create unlimited songs for free • Pay only to download high-quality versions">
    <meta property="og:url" content="https://burnt-beats-sammyjernigan.replit.app">
    
    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎵</text></svg>">
    
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%);
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1.6;
        }
        
        .container { 
            text-align: center; 
            max-width: 700px; 
            padding: 3rem 2rem; 
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .logo { 
            width: 120px; 
            height: 120px; 
            margin: 0 auto 2rem; 
            background: linear-gradient(45deg, #ff6b35, #f7931e); 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 4rem; 
            box-shadow: 0 8px 32px rgba(255, 107, 53, 0.3);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        h1 { 
            font-size: 3.5rem; 
            margin-bottom: 1rem; 
            background: linear-gradient(45deg, #ff6b35, #f7931e, #ff6b35); 
            background-size: 200% 200%;
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent;
            animation: gradient 3s ease infinite;
            font-weight: 700;
        }
        
        @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        .tagline { 
            font-size: 1.3rem; 
            margin-bottom: 1rem; 
            opacity: 0.9;
            font-weight: 300;
        }
        
        .description { 
            font-size: 1.1rem; 
            margin-bottom: 2.5rem; 
            opacity: 0.8;
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2.5rem;
        }
        
        .feature {
            padding: 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            font-size: 0.9rem;
        }
        
        .btn { 
            background: linear-gradient(45deg, #ff6b35, #f7931e);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
            margin: 0 10px 10px 0;
        }
        
        .btn:hover { 
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
        }
        
        .btn-secondary {
            background: transparent;
            border: 2px solid #ff6b35;
            box-shadow: none;
        }
        
        .btn-secondary:hover {
            background: #ff6b35;
            box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
        }
        
        .status { 
            margin-top: 2.5rem; 
            padding: 1.5rem; 
            background: rgba(255, 255, 255, 0.1); 
            border-radius: 15px; 
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .status-indicator {
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #ff6b35;
            animation: spin 1s ease-in-out infinite;
            margin-right: 10px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
            .container { padding: 2rem 1rem; }
            h1 { font-size: 2.5rem; }
            .tagline { font-size: 1.1rem; }
            .features { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎵</div>
        <h1>Burnt Beats</h1>
        <p class="tagline">AI-Powered Music Creation Platform</p>
        <p class="description">Transform your lyrics into professional songs with cutting-edge AI technology</p>
        
        <div class="features">
            <div class="feature">
                <strong>🎤 Voice Cloning</strong><br>
                Clone any voice for your songs
            </div>
            <div class="feature">
                <strong>🎹 Advanced Editing</strong><br>
                Professional audio editing tools
            </div>
            <div class="feature">
                <strong>💰 Pay Per Download</strong><br>
                Create unlimited • Pay to download
            </div>
        </div>
        
        <div>
            <a href="/api/health" class="btn">Check System Status</a>
            <a href="/api/songs" class="btn btn-secondary">Browse Songs</a>
        </div>
        
        <div class="status">
            <p class="status-indicator">
                <span class="loading" id="loading"></span>
                <strong>Status:</strong> <span id="status">Initializing system...</span>
            </p>
            <p><small>AI music generation platform starting up</small></p>
        </div>
    </div>
    
    <script>
        // System status check
        function checkSystemStatus() {
            fetch('/api/health')
                .then(res => res.json())
                .then(data => {
                    const statusEl = document.getElementById('status');
                    const loadingEl = document.getElementById('loading');
                    
                    if (data.status === 'ok') {
                        statusEl.textContent = 'System Online ✅';
                        statusEl.style.color = '#4ade80';
                        loadingEl.style.display = 'none';
                    } else {
                        statusEl.textContent = 'Starting up...';
                        setTimeout(checkSystemStatus, 2000);
                    }
                })
                .catch(() => {
                    document.getElementById('status').textContent = 'Connecting...';
                    setTimeout(checkSystemStatus, 3000);
                });
        }
        
        // Start status checking
        checkSystemStatus();
    </script>
</body>
</html>`;
  
  const clientPath = path.join('dist', 'public', 'index.html');
  writeFileSync(clientPath, clientHtml);
  log(`✅ Production client created at ${clientPath}`, 'success');
}

// Build server bundle using esbuild directly
function buildServerBundle() {
  log('🖥️ Building production server bundle', 'info');
  
  // Check if esbuild is available
  try {
    execSync('npx esbuild --version', { stdio: 'pipe' });
  } catch (error) {
    log('❌ esbuild not available', 'error');
    process.exit(1);
  }
  
  // Build server with esbuild - comprehensive configuration
  const esbuildArgs = [
    'npx esbuild server/index.ts',
    '--bundle',
    '--platform=node', 
    '--target=node18',
    '--format=esm',
    '--outfile=dist/index.js',
    '--external:pg-native',
    '--external:bufferutil', 
    '--external:utf-8-validate',
    '--external:fsevents',
    '--external:@replit/database',
    '--minify',
    '--sourcemap=external',
    '--metafile=dist/build-meta.json',
    '--log-level=warning'
  ];
  
  const esbuildCommand = esbuildArgs.join(' ');
  runCommand(esbuildCommand, 'Creating optimized server bundle with esbuild');
  
  // Verify bundle was created and get size
  if (existsSync('dist/index.js')) {
    const stats = statSync('dist/index.js');
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    log(`✅ Server bundle created: ${sizeMB} MB`, 'success');
  } else {
    log('❌ Server bundle creation failed', 'error');
    process.exit(1);
  }
}

// Comprehensive deployment validation
function validateDeployment() {
  log('✅ Validating deployment artifacts', 'info');
  
  const requiredFiles = [
    { path: 'dist/index.js', description: 'Server bundle' },
    { path: 'dist/package.json', description: 'Production dependencies' },
    { path: 'dist/public/index.html', description: 'Client application' }
  ];
  
  let totalSize = 0;
  let validationPassed = true;
  
  for (const file of requiredFiles) {
    if (existsSync(file.path)) {
      const stats = statSync(file.path);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalSize += stats.size;
      log(`✅ ${file.description}: ${sizeKB} KB`, 'success');
    } else {
      log(`❌ Missing ${file.description}: ${file.path}`, 'error');
      validationPassed = false;
    }
  }
  
  if (!validationPassed) {
    log('❌ Deployment validation failed', 'error');
    process.exit(1);
  }
  
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
  log(`📊 Total deployment size: ${totalSizeMB} MB`, 'info');
  log('✅ Deployment validation passed - ready for production', 'success');
}

// Main deployment orchestrator
async function main() {
  const startTime = Date.now();
  
  try {
    log('🎵 Burnt Beats - Production Deployment Build', 'info');
    log('=============================================', 'info');
    
    // Phase 1: Environment validation
    validateEnvironment();
    
    // Phase 2: Directory structure
    ensureDirectories();
    
    // Phase 3: Production package.json
    createProductionPackage();
    
    // Phase 4: Client application
    createClientApplication();
    
    // Phase 5: Server bundle
    buildServerBundle();
    
    // Phase 6: Final validation
    validateDeployment();
    
    const buildTime = Math.round((Date.now() - startTime) / 1000);
    log(`🎉 Production deployment completed in ${buildTime}s`, 'success');
    log('🚀 Ready for Replit deployment', 'success');
    log('=============================================', 'info');
    
  } catch (error) {
    const buildTime = Math.round((Date.now() - startTime) / 1000);
    log(`❌ Deployment failed after ${buildTime}s: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Execute deployment
main().catch(error => {
  log(`💥 Fatal deployment error: ${error.message}`, 'error');
  console.error(error.stack);
  process.exit(1);
});