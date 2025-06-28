const http = require('http');
const { spawn } = require('child_process');

describe('Burnt Beats Health Check', () => {
  let server;
  const PORT = 5000;

  beforeAll(async () => {
    // Start the server for testing
    server = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 8000));
  });

  afterAll(async () => {
    if (server) {
      server.kill();
    }
  });

  test('Server responds on port 5000', async () => {
    const response = await makeHttpRequest('GET', `http://localhost:${PORT}/health`);
    expect(response.statusCode).toBe(200);
  });

  test('Business profile endpoint accessible', async () => {
    const response = await makeHttpRequest('GET', `http://localhost:${PORT}/api/business-profile`);
    expect(response.statusCode).toBe(200);
  });

  test('Static files served correctly', async () => {
    const response = await makeHttpRequest('GET', `http://localhost:${PORT}/`);
    expect(response.statusCode).toBe(200);
    expect(response.data).toContain('html');
  });

  test('Database endpoints respond', async () => {
    const response = await makeHttpRequest('GET', `http://localhost:${PORT}/api/system-status`);
    expect(response.statusCode).toBe(200);
  });
});

// Helper function for HTTP requests
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