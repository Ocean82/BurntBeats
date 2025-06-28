const http = require('http');
const { spawn } = require('child_process');

async function runBurntBeatsHealthCheck() {
  console.log('🎵 Burnt Beats Health Check Starting...\n');
  
  // Start server
  console.log('Starting server...');
  const server = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  let serverOutput = '';
  server.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  const tests = [
    {
      name: 'Health endpoint',
      url: 'http://localhost:5000/health',
      expectedStatus: 200
    },
    {
      name: 'Business profile endpoint', 
      url: 'http://localhost:5000/api/business-profile',
      expectedStatus: 200
    },
    {
      name: 'System status endpoint',
      url: 'http://localhost:5000/api/system-status', 
      expectedStatus: 200
    },
    {
      name: 'Static files (homepage)',
      url: 'http://localhost:5000/',
      expectedStatus: 200
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const response = await makeHttpRequest('GET', test.url);
      const passed = response.statusCode === test.expectedStatus;
      
      console.log(`${passed ? '✅' : '❌'} ${test.name}: ${response.statusCode}`);
      results.push({ ...test, passed, actualStatus: response.statusCode });
      
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      results.push({ ...test, passed: false, error: error.message });
    }
  }
  
  // Check server startup logs
  const serverStarted = serverOutput.includes('server running') || serverOutput.includes('Server listening');
  console.log(`${serverStarted ? '✅' : '❌'} Server startup: ${serverStarted ? 'SUCCESS' : 'ISSUES'}`);
  
  // Summary
  const passedTests = results.filter(r => r.passed).length;
  console.log(`\n📊 Results: ${passedTests}/${results.length} tests passed`);
  
  if (passedTests === results.length && serverStarted) {
    console.log('🎉 All health checks passed - Burnt Beats is operational!');
  } else {
    console.log('⚠️  Some issues detected - check logs above');
  }
  
  // Cleanup
  server.kill();
  
  return {
    passed: passedTests === results.length && serverStarted,
    results,
    serverStarted
  };
}

function makeHttpRequest(method, url) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method }, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          data: data
        });
      });
    });
    
    request.on('error', reject);
    request.setTimeout(5000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
    
    request.end();
  });
}

// Run the health check
runBurntBeatsHealthCheck().catch(console.error);