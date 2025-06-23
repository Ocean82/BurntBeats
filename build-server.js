#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

// Ensure dist directory exists
if (!existsSync('dist')) {
  mkdirSync('dist', { recursive: true });
}

console.log('Building server application...');

try {
  // Build server with esbuild
  const esbuildCommand = [
    'npx esbuild server/index.ts',
    '--bundle',
    '--platform=node',
    '--target=node20',
    '--format=esm',
    '--outfile=dist/index.js',
    '--external:pg-native',
    '--external:bufferutil',
    '--external:utf-8-validate',
    '--external:fsevents',
    '--external:lightningcss',
    '--external:@babel/preset-typescript',
    '--external:@babel/core',
    '--external:tailwindcss',
    '--external:autoprefixer',
    '--external:postcss',
    '--external:vite',
    '--external:@vitejs/plugin-react',
    '--external:@replit/vite-plugin-cartographer',
    '--external:@replit/vite-plugin-runtime-error-modal',
    '--minify'
  ].join(' ');
  
  execSync(esbuildCommand, { stdio: 'inherit' });
  
  // Create production package.json
  const prodPackage = {
    "name": "burnt-beats",
    "version": "1.0.0",
    "type": "module",
    "engines": {
      "node": ">=20.0.0"
    },
    "scripts": {
      "start": "node index.js"
    },
    "dependencies": {
      "express": "^4.21.2",
      "express-session": "^1.18.1",
      "cors": "^2.8.5",
      "multer": "^2.0.1",
      "drizzle-orm": "^0.39.1",
      "@neondatabase/serverless": "^0.10.4",
      "connect-pg-simple": "^10.0.0",
      "passport": "^0.7.0",
      "passport-local": "^1.0.0",
      "openid-client": "^6.5.3",
      "stripe": "^18.2.1",
      "ws": "^8.18.0",
      "zod": "^3.24.2",
      "nanoid": "^5.1.5"
    }
  };
  
  writeFileSync('dist/package.json', JSON.stringify(prodPackage, null, 2));
  
  console.log('✅ Server build completed successfully');
  console.log('✅ Production package.json created');
} catch (error) {
  console.error('❌ Server build failed:', error.message);
  process.exit(1);
}