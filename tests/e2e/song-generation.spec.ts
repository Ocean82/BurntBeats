
import { test, expect } from '@playwright/test';

test.describe('Song Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full song generation flow', async ({ page }) => {
    // Navigate to song generator
    await page.click('text=Get Started');
    
    // Fill out song form
    await page.fill('[data-testid="lyrics-input"]', 'This is a test song for E2E testing');
    await page.selectOption('[data-testid="genre-select"]', 'pop');
    await page.selectOption('[data-testid="mood-select"]', 'happy');
    await page.fill('[data-testid="tempo-slider"]', '120');

    // Start generation
    await page.click('[data-testid="generate-button"]');

    // Wait for generation to complete
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="generation-complete"]')).toBeVisible({ timeout: 60000 });

    // Verify audio player appears
    await expect(page.locator('[data-testid="audio-player"]')).toBeVisible();

    // Test audio controls
    await page.click('[data-testid="play-button"]');
    await expect(page.locator('[data-testid="play-button"]')).toHaveAttribute('data-playing', 'true');

    // Test download functionality
    await page.click('[data-testid="download-button"]');
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.mp3$/);
  });

  test('should handle form validation', async ({ page }) => {
    await page.click('text=Get Started');
    
    // Try to generate without lyrics
    await page.click('[data-testid="generate-button"]');
    
    // Should show validation error
    await expect(page.locator('text=Lyrics are required')).toBeVisible();
    
    // Should not start generation
    await expect(page.locator('[data-testid="generation-progress"]')).not.toBeVisible();
  });

  test('should work on mobile devices', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');

    await page.click('text=Get Started');
    
    // Test mobile-specific interactions
    await page.fill('[data-testid="lyrics-input"]', 'Mobile test song');
    await page.tap('[data-testid="genre-select"]');
    await page.tap('text=Pop');
    
    // Test swipe gestures if applicable
    await page.locator('[data-testid="tempo-slider"]').tap();
    
    await page.tap('[data-testid="generate-button"]');
    
    // Verify mobile UI elements
    await expect(page.locator('[data-testid="mobile-player"]')).toBeVisible();
  });
});

test.describe('Voice Cloning Flow', () => {
  test('should upload and clone voice sample', async ({ page }) => {
    await page.goto('/voice-cloning');
    
    // Upload voice sample
    const fileInput = page.locator('[data-testid="voice-upload"]');
    await fileInput.setInputFiles('./tests/fixtures/voice-sample.wav');
    
    // Configure cloning options
    await page.selectOption('[data-testid="genre-select"]', 'pop');
    await page.selectOption('[data-testid="style-select"]', 'natural');
    
    // Start cloning process
    await page.click('[data-testid="clone-voice-button"]');
    
    // Wait for processing stages
    await expect(page.locator('text=Extracting voice embedding...')).toBeVisible();
    await expect(page.locator('text=Analyzing similarity...')).toBeVisible();
    await expect(page.locator('text=Voice cloned successfully')).toBeVisible({ timeout: 60000 });
    
    // Test cloned voice in song generation
    await page.goto('/');
    await page.click('text=Get Started');
    await page.selectOption('[data-testid="voice-sample-select"]', 'Custom Voice');
  });
});

test.describe('Authentication Flow', () => {
  test('should register and login user', async ({ page }) => {
    // Test registration
    await page.click('text=Sign Up');
    await page.fill('[data-testid="email-input"]', 'e2e-test@example.com');
    await page.fill('[data-testid="password-input"]', 'securepassword123');
    await page.fill('[data-testid="name-input"]', 'E2E Test User');
    await page.click('[data-testid="register-button"]');
    
    // Should redirect to dashboard
    await expect(page.locator('text=Welcome, E2E Test User')).toBeVisible();
    
    // Test logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    
    // Should redirect to home
    await expect(page.locator('text=Sign In')).toBeVisible();
    
    // Test login
    await page.click('text=Sign In');
    await page.fill('[data-testid="email-input"]', 'e2e-test@example.com');
    await page.fill('[data-testid="password-input"]', 'securepassword123');
    await page.click('[data-testid="login-button"]');
    
    // Should be logged in
    await expect(page.locator('text=Welcome, E2E Test User')).toBeVisible();
  });
});
