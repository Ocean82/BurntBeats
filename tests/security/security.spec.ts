
import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('should prevent XSS attacks in lyrics input', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Get Started');
    
    const maliciousScript = '<script>alert("XSS")</script>';
    await page.fill('[data-testid="lyrics-input"]', maliciousScript);
    
    // Should not execute the script
    let alertFired = false;
    page.on('dialog', () => {
      alertFired = true;
    });
    
    await page.click('[data-testid="generate-button"]');
    
    expect(alertFired).toBe(false);
    
    // Content should be escaped
    const lyricsValue = await page.inputValue('[data-testid="lyrics-input"]');
    expect(lyricsValue).toContain('&lt;script&gt;');
  });

  test('should require authentication for protected endpoints', async ({ page }) => {
    // Test direct API access without authentication
    const response = await page.request.post('/api/music/generate', {
      data: {
        lyrics: 'Test unauthorized access',
        genre: 'pop'
      }
    });
    
    expect(response.status()).toBe(401);
  });

  test('should validate file upload types', async ({ page }) => {
    await page.goto('/voice-cloning');
    
    // Try to upload non-audio file
    const fileInput = page.locator('[data-testid="voice-upload"]');
    
    // Create a malicious file
    const maliciousFile = Buffer.from('<?php echo "malicious code"; ?>');
    await fileInput.setInputFiles({
      name: 'malicious.php',
      mimeType: 'application/x-php',
      buffer: maliciousFile
    });
    
    await page.click('[data-testid="upload-button"]');
    
    // Should show error for invalid file type
    await expect(page.locator('text=Invalid file type')).toBeVisible();
  });

  test('should sanitize user input in all forms', async ({ page }) => {
    const maliciousInputs = [
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '"><script>alert("XSS")</script>',
      "'; DROP TABLE users; --"
    ];

    for (const input of maliciousInputs) {
      await page.goto('/');
      await page.click('text=Get Started');
      
      // Test all form fields
      await page.fill('[data-testid="lyrics-input"]', input);
      await page.fill('[data-testid="song-title-input"]', input);
      
      // Should not cause script execution or database errors
      await page.click('[data-testid="generate-button"]');
      
      // Check that input is properly escaped
      const lyricsValue = await page.inputValue('[data-testid="lyrics-input"]');
      expect(lyricsValue).not.toContain('<script>');
    }
  });

  test('should enforce rate limiting', async ({ page }) => {
    const requests = [];
    
    // Make multiple rapid requests
    for (let i = 0; i < 10; i++) {
      requests.push(
        page.request.post('/api/music/generate', {
          data: {
            lyrics: `Rate limit test ${i}`,
            genre: 'pop'
          }
        })
      );
    }
    
    const responses = await Promise.all(requests);
    const tooManyRequests = responses.filter(r => r.status() === 429);
    
    // Should rate limit excessive requests
    expect(tooManyRequests.length).toBeGreaterThan(0);
  });
});
