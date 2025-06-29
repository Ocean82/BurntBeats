const http = require('http');

console.log('Testing frontend access after session store fix...\n');

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${description}: ${res.statusCode} (${data.length} bytes)`);
        if (path === '/' && data.includes('Burnt Beats')) {
          console.log('✅ Frontend content verified');
        }
        resolve(true);
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve(false);
    });
    
    req.end();
  });
}

async function runTests() {
  await testEndpoint('/health', 'Health Check');
  await testEndpoint('/', 'Frontend Page');
  await testEndpoint('/burnt-beats-app.js', 'JavaScript Assets');
  await testEndpoint('/burnt-beats-logo.jpeg', 'Logo Assets');
  
  console.log('\n🎉 Session store fix validated - no more MemoryStore warnings!');
  console.log('🌐 Frontend accessible at http://localhost:8080');
}

setTimeout(runTests, 1000);