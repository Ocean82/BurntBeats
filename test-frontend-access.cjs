const http = require('http');
const fs = require('fs');

function testFrontendAccess() {
  console.log('🧪 Testing Frontend Access...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Response Status: ${res.statusCode}`);
    console.log(`✅ Response Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ Response received (${data.length} bytes)`);
      
      if (data.includes('<title>Burnt Beats')) {
        console.log('✅ Frontend HTML is loading correctly!');
      } else {
        console.log('❌ Frontend HTML not found in response');
      }
      
      if (data.includes('burnt-beats-app.js')) {
        console.log('✅ Frontend JavaScript reference found!');
      } else {
        console.log('❌ Frontend JavaScript reference missing');
      }
      
      // Save response for debugging
      fs.writeFileSync('/tmp/frontend_response.html', data);
      console.log('📝 Response saved to /tmp/frontend_response.html');
    });
  });

  req.on('error', (err) => {
    console.error('❌ Connection error:', err.message);
  });

  req.on('timeout', () => {
    console.error('❌ Request timeout');
    req.destroy();
  });

  req.end();
}

// Test API endpoint
function testAPIEndpoint() {
  console.log('🧪 Testing API Endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ API Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ API Response:`, data);
    });
  });

  req.on('error', (err) => {
    console.error('❌ API error:', err.message);
  });

  req.end();
}

// Run tests
setTimeout(() => {
  testFrontendAccess();
  setTimeout(() => {
    testAPIEndpoint();
  }, 2000);
}, 3000);