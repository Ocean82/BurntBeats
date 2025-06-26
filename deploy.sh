#!/bin/bash

# Production deployment script for Replit Cloud Run
set -e

echo "Burnt Beats - Production Deployment"
echo "================================="

# Set production environment
export NODE_ENV=production
export PORT=5000

# Build production server
echo "Building production server..."
npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=cjs \
  --outfile=dist/index.cjs \
  --external:pg-native \
  --external:bufferutil \
  --external:utf-8-validate \
  --external:fsevents \
  --minify

# Create production package.json
echo "Creating production package.json..."
cat > dist/package.json << EOF
{
  "name": "burnt-beats-production",
  "version": "1.0.0",
  "type": "commonjs",
  "main": "index.cjs",
  "scripts": {
    "start": "node index.cjs"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "dependencies": {
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "express-session": "^1.18.1",
    "connect-pg-simple": "^10.0.0",
    "express-rate-limit": "^7.5.1",
    "multer": "^2.0.1",
    "stripe": "^18.2.1",
    "drizzle-orm": "^0.39.1",
    "@neondatabase/serverless": "^0.10.4",
    "zod": "^3.24.2",
    "sanitize-filename": "^1.6.3",
    "nanoid": "^5.1.5",
    "ws": "^8.18.0"
  }
}
EOF

# Ensure directories exist
mkdir -p dist/uploads
mkdir -p dist/public

# Create minimal index.html if it doesn't exist
if [ ! -f "dist/public/index.html" ]; then
  cat > dist/public/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Burnt Beats - AI Music Creation Platform</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #1a1a1a; color: white; text-align: center; }
    h1 { color: #ff6b35; }
  </style>
</head>
<body>
  <h1>🎵 Burnt Beats</h1>
  <p>AI-Powered Music Creation Platform</p>
  <p>Production deployment ready</p>
</body>
</html>
EOF
fi

echo "Production build completed successfully!"
echo "Server bundle: $(ls -lh dist/index.cjs | awk '{print $5}')"
echo "Ready for Cloud Run deployment"