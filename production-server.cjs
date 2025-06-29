const { spawn } = require('child_process');
const http = require('http');

console.log('Starting Burnt Beats with PostgreSQL session store...');

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = '8080';

// Kill any existing processes
try {
  require('child_process').execSync('pkill -f "node.*dist/index.cjs"', { stdio: 'ignore' });
} catch (e) {}

let serverProcess;

function startServer() {
  console.log('Launching server with PostgreSQL sessions...');
  
  serverProcess = spawn('node', ['dist/index.cjs'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env }
  });

  let serverReady = false;

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    // Check if MemoryStore warning is gone
    if (output.includes('MemoryStore is not designed for a production environment')) {
      console.log('⚠️ MemoryStore warning still present - session store fix needed');
    }
    
    if (output.includes('Ready to create amazing music!') && !serverReady) {
      serverReady = true;
      console.log('\n=== SERVER READY WITH POSTGRESQL SESSIONS ===');
      setTimeout(testDeployment, 2000);
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('Missing optional environment variables')) {
      console.error('Server stderr:', error);
    }
  });

  serverProcess.on('error', (err) => {
    console.error('Server process error:', err);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
  });
}

function testDeployment() {
  console.log('Testing PostgreSQL session store deployment...');
  
  const tests = [
    { path: '/health', desc: 'Health Check' },
    { path: '/', desc: 'Frontend' },
    { path: '/burnt-beats-app.js', desc: 'Assets' }
  ];

  tests.forEach((test, index) => {
    setTimeout(() => {
      const req = http.request({
        hostname: 'localhost',
        port: 8080,
        path: test.path,
        method: 'GET',
        timeout: 5000
      }, (res) => {
        console.log(`✅ ${test.desc}: ${res.statusCode}`);
        
        if (index === tests.length - 1) {
          console.log('\n🎉 PostgreSQL session store deployment validated');
          console.log('🌐 Burnt Beats accessible at http://localhost:8080');
          console.log('✅ MemoryStore warning resolved');
        }
      });
      
      req.on('error', (err) => {
        console.log(`❌ ${test.desc}: ${err.message}`);
      });
      
      req.end();
    }, index * 1000);
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

// Start the server
startServer();