const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting Burnt Beats Production Server...');

// Environment setup
process.env.NODE_ENV = 'production';
process.env.PORT = '8080';

// Kill existing processes
try {
  require('child_process').execSync('pkill -f "node.*8080" || pkill -f "node.*5000" || true', { stdio: 'ignore' });
} catch (e) {}

function startServer() {
  console.log('📡 Launching server on port 8080...');
  
  const server = spawn('node', ['dist/index.cjs'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '8080' }
  });

  let serverReady = false;

  server.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    if (output.includes('Ready to create amazing music!') && !serverReady) {
      serverReady = true;
      console.log('\n🎯 Server ready! Testing frontend...');
      setTimeout(testFrontend, 2000);
    }
  });

  server.stderr.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('Missing optional environment variables') && 
        !error.includes('Failed to initialize voice bank')) {
      console.error('❌ Server error:', error);
    }
  });

  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
  });

  return server;
}

function testFrontend() {
  console.log('🧪 Testing frontend access...');
  
  const req = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Frontend accessible - application ready!');
      console.log('🌐 Open: http://localhost:8080');
      console.log('🎵 Burnt Beats is live and ready for music creation!');
    } else {
      console.log(`⚠️ Frontend returned status: ${res.statusCode}`);
    }
  });
  
  req.on('error', (err) => {
    console.log(`❌ Frontend test failed: ${err.message}`);
  });
  
  req.end();
}

// Start server
const serverProcess = startServer();

// Keep alive
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Burnt Beats...');
  serverProcess.kill();
  process.exit(0);
});

// Handle cleanup
process.on('exit', () => {
  try {
    require('child_process').execSync('pkill -f "node.*8080"', { stdio: 'ignore' });
  } catch (e) {}
});