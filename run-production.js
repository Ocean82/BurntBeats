#!/usr/bin/env node

// Direct production server runner for Replit deployment
const path = require('path');
const fs = require('fs');

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('Starting Burnt Beats production server...');
console.log(`Port: ${process.env.PORT}`);
console.log(`Environment: ${process.env.NODE_ENV}`);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'dist', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Start the server directly
require('./dist/index.cjs');