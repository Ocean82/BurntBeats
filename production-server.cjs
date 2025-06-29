const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Production Server Manager Starting...');

// Ensure all required directories exist
const requiredDirs = [
  'dist/public',
  'uploads',
  'storage/voices',
  'storage/temp', 
  'storage/music'
];

requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Verify build files exist
if (!fs.existsSync('dist/index.cjs')) {
  console.error('❌ Server build not found at dist/index.cjs');
  process.exit(1);
}

if (!fs.existsSync('dist/public/index.html')) {
  console.error('❌ Frontend not found at dist/public/index.html');
  process.exit(1);
}

console.log('✅ All required files and directories verified');

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.PORT = '5000';

// Start the server process
console.log('🎵 Starting Burnt Beats server...');

const serverProcess = spawn('node', ['dist/index.cjs'], {
  stdio: 'inherit',
  env: process.env
});

serverProcess.on('error', (err) => {
  console.error('❌ Server process error:', err);
});

serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  if (code !== 0) {
    console.error('❌ Server crashed, restarting in 5 seconds...');
    setTimeout(() => {
      console.log('🔄 Restarting server...');
      spawn('node', [__filename], { stdio: 'inherit' });
    }, 5000);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill();
  process.exit(0);
});

console.log('✅ Production server manager ready');
console.log('🌐 Server should be accessible on port 5000');