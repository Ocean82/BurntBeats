
// Build scripts for deployment

/**
 * Enhanced Build Scripts for Deployment
 * Cross-platform compatible build tool with watch mode and better error handling
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

function runCommand(command, description, options = {}) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit',
      ...options
    });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    
    // Enhanced error logging with more context
    if (error.stderr) {
      console.error('STDERR:', error.stderr.toString());
    }
    if (error.stdout) {
      console.error('STDOUT:', error.stdout.toString());
    }
    if (error.message) {
      console.error('Message:', error.message);
    }
    if (error.status) {
      console.error('Exit Code:', error.status);
    }
    
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

async function buildClient(watch = false) {
  ensureDirectories();
  const watchFlag = watch ? ' --watch' : '';
  const description = watch ? 'Watching client rebuilds' : 'Building client application';
  
  runCommand(`npx vite build${watchFlag}`, description);
}

async function buildServer() {
  ensureDirectories();
  const command = `npx esbuild server/index.ts --bundle --platform=node --target=node20 --format=esm --outfile=dist/index.js --external:pg-native --external:bufferutil --external:utf-8-validate --external:fsevents`;
  runCommand(command, 'Building server application');
}

async function start() {
  runCommand('cross-env NODE_ENV=production node dist/index.js', 'Starting production server');
}

async function dev() {
  runCommand('cross-env NODE_ENV=development tsx server/index.ts', 'Starting development server');
}

async function dryRun(command) {
  console.log(`🔍 DRY RUN MODE - Would execute: ${command}`);
  console.log('To actually run, remove the --dry-run flag');
}

function showHelp() {
  console.log(`
🎵 Burnt Beats Build Tool

Available commands:
  node package-scripts.js build:client      - Build client application
  node package-scripts.js build:server     - Build server application  
  node package-scripts.js build            - Build both client and server
  node package-scripts.js start            - Start production server
  node package-scripts.js dev              - Start development server
  node package-scripts.js watch            - Watch client for changes and rebuild
  node package-scripts.js --dry-run <cmd>  - Show what would be executed without running

Examples:
  npm run build                    - Full build
  node package-scripts.js watch   - Watch mode for development
  node package-scripts.js --dry-run build - See what build would do
`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const command = args.find(arg => !arg.startsWith('--')) || 'build';

// Main execution
async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  console.log('🎵 Burnt Beats Build Tool');
  console.log('========================');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE ENABLED');
  }

  try {
    switch (command) {
      case 'build:client':
        console.log('🏗️  Building client application...');
        if (isDryRun) {
          await dryRun('npx vite build');
        } else {
          await buildClient();
        }
        break;
        
      case 'build:server':
        console.log('🖥️  Building server application...');
        if (isDryRun) {
          await dryRun('npx esbuild server/index.ts [options]');
        } else {
          await buildServer();
        }
        break;
        
      case 'start':
        console.log('🚀 Starting production server...');
        if (isDryRun) {
          await dryRun('cross-env NODE_ENV=production node dist/index.js');
        } else {
          if (!existsSync('dist/index.js')) {
            console.error('❌ Production build not found. Run build first.');
            process.exit(1);
          }
          await start();
        }
        break;
        
      case 'dev':
        console.log('🔧 Starting development server...');
        if (isDryRun) {
          await dryRun('cross-env NODE_ENV=development tsx server/index.ts');
        } else {
          await dev();
        }
        break;
        
      case 'watch':
        console.log('👀 Starting watch mode for client...');
        if (isDryRun) {
          await dryRun('npx vite build --watch');
        } else {
          await buildClient(true);
        }
        break;
        
      case 'build':
      default:
        console.log('🚀 Starting full build process...');
        if (isDryRun) {
          await dryRun('Full build: client + server');
        } else {
          await buildClient();
          await buildServer();
          console.log('✅ Build process completed successfully');
        }
        break;
    }
  } catch (error) {
    console.error('❌ Build tool failed:', error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for programmatic use
export { buildClient, buildServer, start, dev, ensureDirectories, runCommand };
