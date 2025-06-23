
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    
    // Check Core Web Vitals
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcpEntry = entries[entries.length - 1];
          resolve(lcpEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    expect(lcp).toBeLessThan(2500); // LCP should be < 2.5s
  });

  test('should handle concurrent song generation requests', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);

    const pages = await Promise.all(contexts.map(context => context.newPage()));

    // Start concurrent song generations
    const generationPromises = pages.map(async (page, index) => {
      await page.goto('/');
      await page.click('text=Get Started');
      await page.fill('[data-testid="lyrics-input"]', `Test song ${index + 1}`);
      await page.selectOption('[data-testid="genre-select"]', 'pop');
      
      const startTime = Date.now();
      await page.click('[data-testid="generate-button"]');
      await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 60000 });
      const endTime = Date.now();
      
      return endTime - startTime;
    });

    const times = await Promise.all(generationPromises);
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    
    // All generations should complete within reasonable time
    expect(avgTime).toBeLessThan(30000); // Average under 30 seconds
    
    // Clean up
    await Promise.all(contexts.map(context => context.close()));
  });

  test('should maintain performance under memory pressure', async ({ page }) => {
    // Generate multiple songs to test memory usage
    for (let i = 0; i < 5; i++) {
      await page.goto('/');
      await page.click('text=Get Started');
      await page.fill('[data-testid="lyrics-input"]', `Memory test song ${i + 1}`);
      await page.selectOption('[data-testid="genre-select"]', 'pop');
      await page.click('[data-testid="generate-button"]');
      await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 60000 });
      
      // Check memory usage doesn't grow excessively
      const memoryUsage = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize);
      if (memoryUsage) {
        expect(memoryUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      }
    }
  });
});
