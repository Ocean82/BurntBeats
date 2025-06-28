const http = require('http');
const { spawn } = require('child_process');

async function runFrontendHealthCheck() {
  console.log('🎵 Burnt Beats Frontend Health Check...\n');
  
  // Start server
  const server = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Wait for server startup
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  try {
    // Test homepage loads
    const response = await makeHttpRequest('GET', 'http://localhost:5000/');
    
    if (response.statusCode !== 200) {
      console.log('❌ Homepage not accessible');
      return false;
    }
    
    const html = response.data;
    console.log('✅ Homepage loads successfully');
    
    // Check for root element
    const hasRoot = html.includes('id="root"') || html.includes("id='root'");
    console.log(`${hasRoot ? '✅' : '❌'} Root element (#root): ${hasRoot ? 'FOUND' : 'MISSING'}`);
    
    // Check for JavaScript bundles
    const scriptMatches = html.match(/<script[^>]*src=['"']([^'"]*)['"'][^>]*>/g) || [];
    const scriptSources = scriptMatches.map(match => {
      const srcMatch = match.match(/src=['"']([^'"]*)['"']/);
      return srcMatch ? srcMatch[1] : '';
    }).filter(src => src);
    
    console.log('📦 JavaScript bundles found:');
    scriptSources.forEach(src => {
      console.log(`   - ${src}`);
    });
    
    const hasMainBundle = scriptSources.some(src => 
      src.includes('main') || 
      src.includes('index') || 
      src.includes('app') ||
      src.includes('.js')
    );
    console.log(`${hasMainBundle ? '✅' : '❌'} JavaScript bundle loaded: ${hasMainBundle ? 'YES' : 'NO'}`);
    
    // Check for Burnt Beats title
    const hasTitle = html.includes('Burnt Beats') || html.includes('<title>');
    console.log(`${hasTitle ? '✅' : '❌'} Page title present: ${hasTitle ? 'YES' : 'NO'}`);
    
    // Check for React/Vite indicators
    const hasReact = html.includes('react') || html.includes('vite') || html.includes('__vite');
    console.log(`${hasReact ? '✅' : '❌'} React/Vite framework: ${hasReact ? 'DETECTED' : 'NOT DETECTED'}`);
    
    // Check for basic HTML structure
    const hasBody = html.includes('<body') && html.includes('</body>');
    const hasHead = html.includes('<head') && html.includes('</head>');
    console.log(`${hasBody ? '✅' : '❌'} HTML body structure: ${hasBody ? 'VALID' : 'INVALID'}`);
    console.log(`${hasHead ? '✅' : '❌'} HTML head structure: ${hasHead ? 'VALID' : 'INVALID'}`);
    
    // Summary
    const allChecks = [hasRoot, hasMainBundle, hasTitle, hasBody, hasHead];
    const passedChecks = allChecks.filter(check => check).length;
    
    console.log(`\n📊 Frontend Health: ${passedChecks}/${allChecks.length} checks passed`);
    
    if (passedChecks === allChecks.length) {
      console.log('🎉 Frontend is fully operational!');
    } else {
      console.log('⚠️  Frontend issues detected - check logs above');
    }
    
    return passedChecks === allChecks.length;
    
  } catch (error) {
    console.log('❌ Frontend health check failed:', error.message);
    return false;
  } finally {
    server.kill();
  }
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
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
    
    request.end();
  });
}

// Run the frontend health check
runFrontendHealthCheck().catch(console.error);