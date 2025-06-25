#!/bin/bash
# Burnt Beats Production Deployment Script

echo "🚀 Starting Burnt Beats production deployment..."

# Set production environment
export NODE_ENV=production
export PORT=80

# Navigate to dist directory
cd dist

# Start the server
echo "🎵 Starting Burnt Beats server..."
node index.cjs