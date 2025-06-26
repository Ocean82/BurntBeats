#!/bin/bash

# Burnt Beats Application Startup Script
echo "🎵 Starting Burnt Beats..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Installing..."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo "✅ npm $(npm --version) detected"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check environment variables
echo "🔧 Checking environment..."
if [ -f ".env" ]; then
    echo "✅ Environment file found"
else
    echo "⚠️  No .env file found, using defaults"
fi

# Start the development server
echo "🚀 Starting Burnt Beats development server..."
npm run dev