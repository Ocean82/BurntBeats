#!/usr/bin/env node

import { build } from 'vite';
import { build as esbuild } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildClient() {
  console.log('Building client...');
  await build({
    configFile: path.resolve(__dirname, 'vite.config.ts'),
    mode: 'production'
  });
  console.log('Client build complete');
}

async function buildServer() {
  console.log('Building server...');
  await esbuild({
    entryPoints: [path.resolve(__dirname, 'server/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outfile: path.resolve(__dirname, 'dist/index.js'),
    external: [
      'pg-native',
      'bufferutil',
      'utf-8-validate',
      'fsevents'
    ],
    banner: {
      js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`
    },
    define: {
      'import.meta.dirname': '__dirname'
    }
  });
  console.log('Server build complete');
}

async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'client':
        await buildClient();
        break;
      case 'server':
        await buildServer();
        break;
      case 'all':
      default:
        await buildClient();
        await buildServer();
        break;
    }
    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

main();