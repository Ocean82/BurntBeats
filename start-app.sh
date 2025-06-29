#!/bin/bash

echo "🚀 Starting Burnt Beats Application..."

# Kill any existing processes
pkill -f "node dist/index.cjs" 2>/dev/null || true
sleep 2

# Set environment variables
export NODE_ENV=production
export PORT=5000

# Ensure directories exist
mkdir -p dist/public uploads storage/voices storage/temp storage/music

# Verify build exists
if [ ! -f "dist/index.cjs" ]; then
    echo "❌ Server build not found. Running build..."
    npm run build:server
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "❌ Frontend not found. Frontend should be in dist/public/"
    exit 1
fi

# Start the server
echo "🎵 Starting server on port 5000..."
node dist/index.cjs

echo "✅ Application should be running on http://localhost:5000"