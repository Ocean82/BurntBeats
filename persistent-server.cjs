const { spawn } = require('child_process');
const http = require('http');

// Kill any existing processes
try {
  require('child_process').execSync('pkill -f "node.*dist/index.cjs"', { stdio: 'ignore' });
} catch (e) {}

console.log('Starting persistent server...');

// Set environment
process.env.NODE_ENV = 'production';
process.env.PORT = '8080';

let serverProcess;
let isReady = false;

function startServer() {
  serverProcess = spawn('node', ['dist/index.cjs'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: true
  });

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    if (output.includes('Ready to create amazing music!') && !isReady) {
      isReady = true;
      console.log('\n=== SERVER READY ===');
      setTimeout(validateServer, 2000);
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('Server stderr:', data.toString());
  });

  serverProcess.on('error', (err) => {
    console.error('Server process error:', err);
    restart();
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`Server exited with code ${code}, signal ${signal}`);
    if (code !== 0) {
      restart();
    }
  });
}

function restart() {
  console.log('Restarting server in 3 seconds...');
  isReady = false;
  setTimeout(startServer, 3000);
}

function validateServer() {
  console.log('Validating server...');
  
  const req = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/health',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    console.log(`Health check: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Server validation successful');
      console.log('Frontend accessible at http://localhost:8080');
      
      // Keep process alive
      setInterval(() => {
        console.log('Server still running...');
      }, 60000);
    });
  });
  
  req.on('error', (err) => {
    console.error('Validation failed:', err.message);
    restart();
  });
  
  req.end();
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

// Start the server
startServer();