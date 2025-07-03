# Burnt Beats CI/CD Pipeline Setup

## Overview

This document outlines the complete CI/CD pipeline implementation for the Burnt Beats AI music generation platform. The pipeline includes automated testing, building, security auditing, and deployment preparation.

## Workflow Structure

### 1. Build and Test Pipeline (`.github/workflows/build-and-test.yml`)

**Triggers:** Push and Pull Request events

**Features:**
- ✅ PostgreSQL service container for database testing
- ✅ Node.js 20 setup with npm caching
- ✅ Global tool installation (TypeScript, tsx)
- ✅ Environment variable configuration
- ✅ Database migration execution
- ✅ Type checking with TypeScript
- ✅ Client and server builds
- ✅ Complete test suite execution
- ✅ Build artifact uploading

**Jobs:**
1. **Build Job** - Main application build and test
2. **Security Audit** - NPM vulnerability scanning
3. **Deploy Staging** - Preparation for deployment (main branch only)

### 2. Production Deployment (`.github/workflows/deploy.yml`)

**Triggers:** Manual dispatch and main branch pushes

**Features:**
- ✅ Production-optimized builds
- ✅ Deployment package creation
- ✅ Artifact archival (30-day retention)
- ✅ Deployment summary reporting

## Environment Setup

### Required Environment Variables

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db
NODE_ENV=test
SESSION_SECRET=test-secret-key
```

### CI Environment Features

- **PostgreSQL 16** service container
- **Node.js 20** with npm caching
- **Global tools**: TypeScript, tsx, drizzle-kit
- **Health checks** for database connectivity
- **Automatic retry logic** for service startup

## Build Process

### Client Build
```bash
npm run build:client
```
- Vite-powered frontend compilation
- Asset optimization and bundling
- Static file generation for deployment

### Server Build  
```bash
npm run build:server
```
- TypeScript compilation to optimized bundle
- CommonJS format for Node.js compatibility
- Dependency externalization for performance

### Testing Pipeline
```bash
npm test
```
- Unit tests for core functionality
- Integration tests for API endpoints  
- Frontend component testing
- Security validation tests
- Performance benchmarking

## Security Features

### NPM Audit Integration
- **High-level vulnerability** scanning
- **Production dependency** security checks
- **Automated security reporting**

### Environment Security
- Secure handling of database credentials
- Session secret management
- API key protection patterns

## Deployment Process

### 1. Automated Checks
- All tests must pass
- Security audit must be clean
- Type checking must succeed
- Builds must complete successfully

### 2. Package Creation
- Production-optimized bundles
- Minimal dependency packaging
- Asset optimization

### 3. Artifact Management
- 30-day retention for production builds
- 7-day retention for development artifacts
- Automatic cleanup and optimization

## Integration with Existing Scripts

The CI/CD pipeline leverages existing package.json scripts:

```json
{
  "build:client": "node package-scripts.js build:client",
  "build:server": "node package-scripts.js build:server", 
  "test": "jest",
  "type-check": "tsc --noEmit",
  "lint": "eslint . --ext .ts,.tsx"
}
```

## Local Development Integration

### CI Setup Script
```bash
node scripts/ci-setup.js
```

This script validates:
- Environment variables
- Build system configuration
- Dependency requirements
- Test environment setup

## Replit Deployment Integration

The CI/CD pipeline creates deployment-ready packages that work seamlessly with Replit's deployment system:

1. **Build artifacts** are optimized for cloud deployment
2. **Environment variables** are properly configured
3. **Health endpoints** are available for monitoring
4. **Database migrations** are handled automatically

## Monitoring and Reporting

### Build Reports
- Deployment package size tracking
- Build time monitoring
- Test coverage reporting
- Security audit results

### Artifact Information
- Automated build summaries
- Deployment readiness indicators
- Performance metrics tracking

## Best Practices Implemented

1. **Fail Fast Strategy** - Stop pipeline on first failure
2. **Parallel Processing** - Security audit runs independently
3. **Environment Isolation** - Separate test database
4. **Artifact Optimization** - Minimal production packages
5. **Security First** - Vulnerability scanning before deployment
6. **Comprehensive Testing** - All test suites in pipeline

## Usage Instructions

### For Developers
1. Push code to any branch - triggers build and test
2. Create pull request - full validation pipeline runs
3. Merge to main - triggers deployment preparation

### For Production Deployment
1. Manual dispatch from GitHub Actions
2. Automatic trigger on main branch updates
3. Download deployment artifacts for Replit deployment

This CI/CD setup ensures code quality, security, and deployment readiness for the Burnt Beats platform while maintaining compatibility with Replit's hosting environment.