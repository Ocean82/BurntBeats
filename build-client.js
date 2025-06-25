
#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

console.log('🏗️  Building client application...');

// Parse command line arguments
const args = process.argv.slice(2);
const shouldGenerateReport = args.includes('--report');

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

// Enhanced directory validation with asset handling
async function ensureDirectories() {
  const dirs = [
    'dist', 
    'dist/public',
    'dist/assets',
    'dist/reports'
  ];
  
  // Use Promise.all for parallel directory creation
  await Promise.all(
    dirs.map(async (dir) => {
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    })
  );
}

// Cross-platform cleanup function
function cleanupBuildArtifacts() {
  const artifactsToClean = [
    'dist/public/index.html',
    'dist/public/assets',
    'dist/reports/build-report.html'
  ];
  
  artifactsToClean.forEach(artifact => {
    try {
      if (existsSync(artifact)) {
        if (statSync(artifact).isDirectory()) {
          execSync(`rm -rf "${artifact}"`, { stdio: 'pipe' });
        } else {
          unlinkSync(artifact);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not clean ${artifact}:`, error.message);
    }
  });
  
  console.log('🧹 Cleaned up partial build artifacts');
}

// Type checking and linting stage
function runQualityChecks() {
  console.log('🔍 Running quality checks...');
  
  try {
    // Type check the client code
    execSync('npx tsc --noEmit --project client', { 
      stdio: 'inherit',
      timeout: 30000 
    });
    console.log('✅ TypeScript type checking passed');
  } catch (error) {
    console.warn('⚠️  TypeScript type checking failed:', error.message);
    // Continue with build but warn user
  }
  
  try {
    // Lint the client code
    execSync('npx eslint client/src --ext .ts,.tsx', { 
      stdio: 'inherit',
      timeout: 30000 
    });
    console.log('✅ ESLint passed');
  } catch (error) {
    console.warn('⚠️  ESLint found issues:', error.message);
    // Continue with build but warn user
  }
}

// Generate build report if requested
async function generateBuildReport() {
  if (!shouldGenerateReport) return;
  
  console.log('📊 Generating build size report...');
  
  try {
    // First, run vite build with metafile generation
    const metafilePath = 'dist/reports/metafile.json';
    
    execSync(`npx vite build --outDir dist/public --metafile ${metafilePath}`, {
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        VITE_API_URL: '/api'
      }
    });
    
    // Install esbuild-analyze if not present
    try {
      execSync('npx esbuild-analyze --version', { stdio: 'pipe' });
    } catch {
      console.log('📦 Installing esbuild-analyze...');
      execSync('npm install --no-save esbuild-analyze', { stdio: 'inherit' });
    }
    
    // Generate HTML report
    execSync(`npx esbuild-analyze ${metafilePath} --format html --open false > dist/reports/build-report.html`, {
      stdio: 'inherit'
    });
    
    console.log('✅ Build report generated at dist/reports/build-report.html');
    
  } catch (error) {
    console.warn('⚠️  Could not generate build report:', error.message);
  }
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
  console.log(`📊 Build size: ${Math.round(stats.size / 1024)}KB`);
}

// Enhanced asset handling
async function handleAssets() {
  console.log('📦 Processing assets...');
  
  // Copy any additional assets if they exist
  const assetDirs = [
    'client/public',
    'attached_assets'
  ];
  
  for (const assetDir of assetDirs) {
    if (existsSync(assetDir)) {
      try {
        execSync(`cp -r ${assetDir}/* dist/public/ 2>/dev/null || true`, { stdio: 'pipe' });
        console.log(`✅ Copied assets from ${assetDir}`);
      } catch (error) {
        console.warn(`⚠️  Could not copy assets from ${assetDir}`);
      }
    }
  }
}

// Create build manifest
async function createBuildManifest() {
  const manifest = {
    buildTime: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    platform: process.platform,
    environment: 'production',
    features: {
      reportGenerated: shouldGenerateReport,
      assetsProcessed: true,
      qualityChecksRun: true
    }
  };
  
  await writeFile('dist/public/build-manifest.json', JSON.stringify(manifest, null, 2));
  console.log('📋 Build manifest created');
}

try {
  // Step 1: Validate prerequisites
  validatePrerequisites();
  
  // Step 2: Ensure directories (async)
  await ensureDirectories();
  
  // Step 3: Run quality checks
  runQualityChecks();
  
  // Step 4: Build client (with or without report)
  if (shouldGenerateReport) {
    await generateBuildReport();
  } else {
    console.log('📦 Running Vite build...');
    execSync('npx vite build --outDir dist/public', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        VITE_API_URL: '/api'
      }
    });
  }
  
  // Step 5: Handle additional assets
  await handleAssets();
  
  // Step 6: Create build manifest
  await createBuildManifest();
  
  // Step 7: Validate output
  validateBuildOutput();
  
  console.log('✅ Client build completed successfully');
  
  if (shouldGenerateReport) {
    console.log('📊 Build report available at: dist/reports/build-report.html');
  }
  
} catch (error) {
  console.error('❌ Client build failed:', error.message);
  
  // Cross-platform cleanup on failure
  try {
    cleanupBuildArtifacts();
  } catch (cleanupError) {
    console.warn('⚠️  Failed to cleanup build artifacts:', cleanupError.message);
  }
  
  process.exit(1);
}
