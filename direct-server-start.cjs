const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Direct Server Startup');

// Kill any existing processes
try {
  require('child_process').execSync('pkill -f "node.*dist/index.cjs"', { stdio: 'ignore' });
} catch (e) {
  // No existing processes to kill
}

// Set environment
process.env.NODE_ENV = 'production';
process.env.PORT = '5000';

console.log('Starting server directly...');

// Start server with proper stdio handling
const server = spawn('node', ['dist/index.cjs'], {
  detached: false,
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverReady = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  if (output.includes('Ready to create amazing music!') && !serverReady) {
    serverReady = true;
    console.log('✅ Server startup complete');
    
    // Test connection after server is ready
    setTimeout(() => {
      testConnection();
    }, 2000);
  }
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  if (code !== 0) {
    console.error('Server crashed');
    process.exit(1);
  }
});

function testConnection() {
  console.log('🧪 Testing server connection...');
  
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    console.log(`✅ Health check response: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('✅ Server is responding correctly');
      console.log('📊 Health data:', data);
      
      // Test frontend
      testFrontend();
    });
  });
  
  req.on('error', (err) => {
    console.error('❌ Connection test failed:', err.message);
  });
  
  req.end();
}

function testFrontend() {
  console.log('🧪 Testing frontend access...');
  
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    console.log(`✅ Frontend response: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (data.includes('Burnt Beats')) {
        console.log('✅ Frontend is loading correctly!');
        console.log('🎵 Application is fully operational');
      } else {
        console.log('⚠️ Frontend response unexpected');
      }
    });
  });
  
  req.on('error', (err) => {
    console.error('❌ Frontend test failed:', err.message);
  });
  
  req.end();
}

// Keep process alive
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.kill();
  process.exit(0);
});