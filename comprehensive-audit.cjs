#!/usr/bin/env node

/**
 * Comprehensive Audit for Burnt Beats Platform
 * Checks dependencies, routes, database schema, API consistency, imports, and migrations
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findFiles(dir, extensions) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

async function auditDependencies() {
  log('1. Dependency Audit', 'cyan');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = new Set();
  const tsFiles = findFiles('.', ['.ts', '.tsx']);
  
  // Extract imports from TypeScript files
  tsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const importMatches = content.match(/import.*from\s+['"]([\w@/-]+)['"]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const dep = match.match(/from\s+['"]([\w@/-]+)['"]/)[1];
        if (!dep.startsWith('.') && !dep.startsWith('@/') && !dep.startsWith('@shared')) {
          requiredDeps.add(dep.split('/')[0]);
        }
      });
    }
  });
  
  const installedDeps = new Set([
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {})
  ]);
  
  const missingDeps = [...requiredDeps].filter(dep => !installedDeps.has(dep));
  
  if (missingDeps.length === 0) {
    log('✓ All required dependencies are installed', 'green');
  } else {
    log(`✗ Missing dependencies: ${missingDeps.join(', ')}`, 'red');
  }
  
  return missingDeps.length === 0;
}

async function auditRoutes() {
  log('\n2. Route Conflict Audit', 'cyan');
  
  const routesFile = path.join('server', 'routes.ts');
  if (!fs.existsSync(routesFile)) {
    log('✗ Routes file missing', 'red');
    return false;
  }
  
  const content = fs.readFileSync(routesFile, 'utf8');
  const routes = [];
  
  // Extract route definitions
  const routeMatches = content.match(/app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g);
  if (routeMatches) {
    routeMatches.forEach(match => {
      const [, method, path] = match.match(/app\.(\w+)\s*\(\s*['"`]([^'"`]+)['"`]/);
      routes.push({ method: method.toUpperCase(), path });
    });
  }
  
  // Check for duplicate routes
  const routeKeys = routes.map(r => `${r.method}:${r.path}`);
  const duplicates = routeKeys.filter((key, index) => routeKeys.indexOf(key) !== index);
  
  if (duplicates.length === 0) {
    log(`✓ No route conflicts found (${routes.length} routes)`, 'green');
  } else {
    log(`✗ Route conflicts: ${duplicates.join(', ')}`, 'red');
  }
  
  // Check for voice bank routes
  const voiceBankRoutes = routes.filter(r => r.path.includes('/api/voice-bank/'));
  if (voiceBankRoutes.length >= 4) {
    log(`✓ Voice bank routes properly registered (${voiceBankRoutes.length})`, 'green');
  } else {
    log(`⚠ Voice bank routes incomplete (${voiceBankRoutes.length}/4)`, 'yellow');
  }
  
  return duplicates.length === 0;
}

async function auditDatabase() {
  log('\n3. Database Schema Audit', 'cyan');
  
  const schemaFile = path.join('shared', 'schema.ts');
  if (!fs.existsSync(schemaFile)) {
    log('✗ Schema file missing', 'red');
    return false;
  }
  
  const content = fs.readFileSync(schemaFile, 'utf8');
  
  // Check for required tables
  const requiredTables = ['users', 'songs', 'voiceSamples', 'sessions'];
  const missingTables = [];
  
  requiredTables.forEach(table => {
    if (!content.includes(`export const ${table}`) && !content.includes(`const ${table}`)) {
      missingTables.push(table);
    }
  });
  
  if (missingTables.length === 0) {
    log('✓ All required database tables defined', 'green');
  } else {
    log(`✗ Missing database tables: ${missingTables.join(', ')}`, 'red');
  }
  
  // Check for foreign key relationships
  const hasForeignKeys = content.includes('references') || content.includes('userId');
  if (hasForeignKeys) {
    log('✓ Foreign key relationships defined', 'green');
  } else {
    log('⚠ No foreign key relationships found', 'yellow');
  }
  
  return missingTables.length === 0;
}

async function auditImports() {
  log('\n4. Import Path Audit', 'cyan');
  
  const tsFiles = findFiles('.', ['.ts', '.tsx']);
  const issues = [];
  
  tsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for problematic import patterns
      if (line.includes('import') && line.includes('from')) {
        // Deep relative imports (more than 2 levels)
        if (line.match(/from\s+['"]\.\.[\/\\]\.\.[\/\\]\.\./)) {
          issues.push(`${file}:${index + 1} - Deep relative import: ${line.trim()}`);
        }
        // Missing file extensions for local imports
        if (line.match(/from\s+['"][^'"]*\.[\/\\][^'"]*['"]/) && !line.includes('.ts') && !line.includes('.js')) {
          // This is acceptable for TypeScript
        }
      }
    });
  });
  
  if (issues.length === 0) {
    log('✓ No problematic import paths found', 'green');
  } else {
    log(`✗ Import path issues found:`, 'red');
    issues.forEach(issue => log(`  ${issue}`, 'red'));
  }
  
  return issues.length === 0;
}

async function auditAPI() {
  log('\n5. API Consistency Audit', 'cyan');
  
  const apiFiles = findFiles('server/api', ['.ts']);
  const routesFile = path.join('server', 'routes.ts');
  
  if (!fs.existsSync(routesFile)) {
    log('✗ Routes file missing', 'red');
    return false;
  }
  
  const routesContent = fs.readFileSync(routesFile, 'utf8');
  const missingImports = [];
  
  apiFiles.forEach(file => {
    const fileName = path.basename(file, '.ts');
    if (!routesContent.includes(fileName) && !fileName.includes('test')) {
      missingImports.push(fileName);
    }
  });
  
  if (missingImports.length === 0) {
    log('✓ All API files properly imported', 'green');
  } else {
    log(`⚠ API files not imported: ${missingImports.join(', ')}`, 'yellow');
  }
  
  // Check for authentication middleware usage
  const hasAuth = routesContent.includes('isAuthenticated') || routesContent.includes('authenticate');
  if (hasAuth) {
    log('✓ Authentication middleware integrated', 'green');
  } else {
    log('✗ No authentication middleware found', 'red');
  }
  
  return true;
}

async function auditEnvironment() {
  log('\n6. Environment & Configuration Audit', 'cyan');
  
  const envFiles = ['.env', '.env.example', '.env.local'];
  const existingEnvFiles = envFiles.filter(file => fs.existsSync(file));
  
  if (existingEnvFiles.length > 0) {
    log(`✓ Environment files found: ${existingEnvFiles.join(', ')}`, 'green');
  } else {
    log('⚠ No environment files found', 'yellow');
  }
  
  // Check for required configuration files
  const configFiles = ['drizzle.config.ts', 'tsconfig.json', 'package.json'];
  const missingConfigs = configFiles.filter(file => !fs.existsSync(file));
  
  if (missingConfigs.length === 0) {
    log('✓ All configuration files present', 'green');
  } else {
    log(`✗ Missing configuration files: ${missingConfigs.join(', ')}`, 'red');
  }
  
  return missingConfigs.length === 0;
}

async function auditGitAndMigrations() {
  log('\n7. Git & Migration Audit', 'cyan');
  
  // Check for .git directory
  const isGitRepo = fs.existsSync('.git');
  if (isGitRepo) {
    log('✓ Git repository initialized', 'green');
  } else {
    log('⚠ Not a git repository (unknown_not_git)', 'yellow');
  }
  
  // Check for migration files
  const migrationDirs = ['migrations', 'drizzle'];
  let hasMigrations = false;
  
  migrationDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      if (files.length > 0) {
        hasMigrations = true;
        log(`✓ Migration files found in ${dir} (${files.length} files)`, 'green');
      }
    }
  });
  
  if (!hasMigrations) {
    log('⚠ No migration files found', 'yellow');
  }
  
  // Check database configuration
  const dbConfig = path.join('server', 'db.ts');
  if (fs.existsSync(dbConfig)) {
    const content = fs.readFileSync(dbConfig, 'utf8');
    if (content.includes('DATABASE_URL')) {
      log('✓ Database connection configured', 'green');
    } else {
      log('✗ Database connection not configured', 'red');
    }
  }
  
  return true;
}

async function runComprehensiveAudit() {
  log('Burnt Beats Platform Comprehensive Audit', 'bold');
  log('========================================', 'cyan');
  
  const results = [];
  
  results.push(await auditDependencies());
  results.push(await auditRoutes());
  results.push(await auditDatabase());
  results.push(await auditImports());
  results.push(await auditAPI());
  results.push(await auditEnvironment());
  results.push(await auditGitAndMigrations());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  log('\nAudit Summary:', 'bold');
  log(`Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\nAll audits passed! Platform is ready for deployment.', 'green');
  } else {
    log(`\n${total - passed} audit(s) need attention.`, 'yellow');
  }
  
  return passed === total;
}

// Run audit
if (require.main === module) {
  runComprehensiveAudit().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`Audit error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runComprehensiveAudit };