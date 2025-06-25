#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, statSync, unlinkSync, writeFileSync, readdirSync } from 'fs';
import { mkdir, writeFile, readdir, stat, copyFile } from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { glob } from 'glob';

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

// Get Git commit hash
function getGitCommit() {
  try {
    const gitCommit = execSync('git rev-parse --short HEAD', { 
      stdio: 'pipe',
      encoding: 'utf8' 
    }).toString().trim();
    return gitCommit;
  } catch (error) {
    console.warn('⚠️  Could not get git commit hash:', error.message);
    return 'unknown';
  }
}

// Calculate file hash for versioning
function calculateFileHash(filePath) {
  try {
    const fileBuffer = require('fs').readFileSync(filePath);
    return createHash('md5').update(fileBuffer).digest('hex').substring(0, 8);
  } catch (error) {
    console.warn(`⚠️  Could not hash file ${filePath}:`, error.message);
    return Date.now().toString(36);
  }
}

// Enhanced asset handling with globby
async function handleAssets() {
  console.log('📦 Processing assets with glob patterns...');
  
  const assetDirs = [
    'client/public',
    'attached_assets'
  ];
  
  let copiedFiles = 0;
  let totalSize = 0;
  
  for (const assetDir of assetDirs) {
    if (existsSync(assetDir)) {
      try {
        // Use glob for robust cross-platform file matching
        const pattern = path.join(assetDir, '**/*').replace(/\\/g, '/');
        const files = await glob(pattern, { 
          nodir: true,
          dot: false 
        });
        
        for (const file of files) {
          try {
            const relativePath = path.relative(assetDir, file);
            const destPath = path.join('dist/public', relativePath);
            
            // Ensure destination directory exists
            await mkdir(path.dirname(destPath), { recursive: true });
            
            // Optional: Add hash suffix for long-term caching
            const shouldHash = args.includes('--hash-assets');
            let finalDestPath = destPath;
            
            if (shouldHash && !relativePath.includes('index.html')) {
              const fileHash = calculateFileHash(file);
              const ext = path.extname(relativePath);
              const nameWithoutExt = path.basename(relativePath, ext);
              const dir = path.dirname(destPath);
              finalDestPath = path.join(dir, `${nameWithoutExt}.${fileHash}${ext}`);
            }
            
            await copyFile(file, finalDestPath);
            
            const stats = await stat(finalDestPath);
            totalSize += stats.size;
            copiedFiles++;
            
          } catch (fileError) {
            console.warn(`⚠️  Could not copy ${file}:`, fileError.message);
          }
        }
        
        console.log(`✅ Copied ${files.length} files from ${assetDir}`);
        
      } catch (error) {
        console.warn(`⚠️  Could not process assets from ${assetDir}:`, error.message);
      }
    }
  }
  
  return { copiedFiles, totalSize };
}

// Calculate build size summary
async function calculateBuildSize() {
  const distPath = 'dist/public';
  if (!existsSync(distPath)) {
    return { totalSizeKB: 0, numFiles: 0 };
  }
  
  try {
    const files = await glob(path.join(distPath, '**/*').replace(/\\/g, '/'), { 
      nodir: true 
    });
    
    let totalSize = 0;
    for (const file of files) {
      try {
        const stats = await stat(file);
        totalSize += stats.size;
      } catch (error) {
        console.warn(`⚠️  Could not stat ${file}:`, error.message);
      }
    }
    
    return {
      totalSizeKB: Math.round(totalSize / 1024),
      numFiles: files.length
    };
  } catch (error) {
    console.warn('⚠️  Could not calculate build size:', error.message);
    return { totalSizeKB: 0, numFiles: 0 };
  }
}

// Validate build output
async function validateBuildOutput() {
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
  
  // Calculate and log build size summary
  const { totalSizeKB, numFiles } = await calculateBuildSize();
  console.log(`🚢 Final artifact: dist/public (est. ${totalSizeKB}KB across ${numFiles} files)`);
  
  return { totalSizeKB, numFiles };
}

// Create enhanced build manifest with git commit
async function createBuildManifest() {
  const gitCommit = getGitCommit();
  const { totalSizeKB, numFiles } = await calculateBuildSize();
  
  const manifest = {
    buildTime: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    gitCommit,
    nodeVersion: process.version,
    platform: process.platform,
    environment: 'production',
    buildStats: {
      totalSizeKB,
      numFiles,
      reportGenerated: shouldGenerateReport
    },
    features: {
      reportGenerated: shouldGenerateReport,
      assetsProcessed: true,
      qualityChecksRun: true,
      assetHashing: args.includes('--hash-assets')
    }
  };
  
  await writeFile('dist/public/build-manifest.json', JSON.stringify(manifest, null, 2));
  console.log('📋 Build manifest created');
  console.log(`📊 Git commit: ${gitCommit}`);
  
  return manifest;
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
  
  // Step 5: Handle additional assets with glob
  const assetStats = await handleAssets();
  console.log(`📁 Asset processing: ${assetStats.copiedFiles} files (${Math.round(assetStats.totalSize / 1024)}KB)`);
  
  // Step 6: Create enhanced build manifest
  const manifest = await createBuildManifest();
  
  // Step 7: Validate output and show summary
  await validateBuildOutput();
  
  console.log('✅ Client build completed successfully');
  
  if (shouldGenerateReport) {
    console.log('📊 Build report available at: dist/reports/build-report.html');
  }
  
  // Final build summary
  console.log('\n🎯 Build Summary:');
  console.log(`   Version: ${manifest.version} (${manifest.gitCommit})`);
  console.log(`   Size: ${manifest.buildStats.totalSizeKB}KB across ${manifest.buildStats.numFiles} files`);
  console.log(`   Features: ${Object.entries(manifest.features).filter(([, enabled]) => enabled).map(([key]) => key).join(', ')}`);
  
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
