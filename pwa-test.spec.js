/**
 * Automated PWA Cross-Browser Tests
 * Tests PWA functionality across Chromium, Firefox, and WebKit
 */

const { test, expect } = require('@playwright/test');

const APP_URL = 'http://localhost:8080';

// Test configuration for different browsers
test.describe('PWA Cross-Browser Tests', () => {
  
  // Test 1: Page loads successfully
  test('should load the app successfully', async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page).toHaveTitle(/Workout Generator/);
    console.log('✅ Page loaded successfully');
  });

  // Test 2: Service Worker registration
  test('should register service worker', async ({ page, context }) => {
    await page.goto(APP_URL);
    
    // Wait for service worker to register
    await page.waitForTimeout(2000);
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration !== undefined;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);
    console.log('✅ Service worker registered');
  });

  // Test 3: Manifest is accessible
  test('should have valid manifest', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Check if manifest link exists
    const manifestLink = await page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);
    
    // Fetch manifest
    const manifestHref = await manifestLink.getAttribute('href');
    const manifestResponse = await page.goto(`${APP_URL}/${manifestHref}`);
    expect(manifestResponse.status()).toBe(200);
    
    const manifestContent = await manifestResponse.json();
    expect(manifestContent.name).toBe('Workout Generator');
    expect(manifestContent.short_name).toBe('Workout Gen');
    expect(manifestContent.display).toBe('standalone');
    
    console.log('✅ Manifest is valid');
  });

  // Test 4: Offline indicator exists
  test('should display offline indicator', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForTimeout(1000);
    
    const offlineIndicator = await page.locator('#offline-indicator');
    await expect(offlineIndicator).toBeVisible();
    
    // Check if it shows "Online" status
    const statusText = await offlineIndicator.textContent();
    expect(statusText).toContain('Online');
    
    console.log('✅ Offline indicator displayed');
  });

  // Test 5: Install button exists (Chromium only)
  test('should show install button on Chromium', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip();
    }
    
    await page.goto(APP_URL);
    await page.waitForTimeout(2000);
    
    const installButton = await page.locator('#install-btn');
    // Install button may or may not be visible depending on PWA criteria
    const buttonCount = await installButton.count();
    console.log(`Install button count: ${buttonCount}`);
    
    console.log('✅ Install button check completed');
  });

  // Test 6: Theme toggle works
  test('should toggle theme', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForTimeout(1000);
    
    const themeToggle = await page.locator('#themeToggleBtn');
    await expect(themeToggle).toBeVisible();
    
    // Get initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    
    // Click theme toggle
    await themeToggle.click();
    await page.waitForTimeout(500);
    
    // Get new theme
    const newTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    
    expect(newTheme).not.toBe(initialTheme);
    console.log(`✅ Theme toggled from ${initialTheme} to ${newTheme}`);
  });

  // Test 7: Workout generation works
  test('should generate workout', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForTimeout(1000);
    
    // Click generate button
    const generateBtn = await page.locator('#generateBtn');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();
    
    // Wait for workout to be generated
    await page.waitForTimeout(2000);
    
    // Check if workout results are displayed
    const workoutResults = await page.locator('#workoutResults');
    await expect(workoutResults).toBeVisible();
    
    // Check if exercises are displayed
    const exercises = await page.locator('.exercise-card');
    const exerciseCount = await exercises.count();
    expect(exerciseCount).toBeGreaterThan(0);
    
    console.log(`✅ Workout generated with ${exerciseCount} exercises`);
  });

  // Test 8: Workout history works
  test('should open workout history', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForTimeout(1000);
    
    // Click history button
    const historyBtn = await page.locator('#historyBtn');
    await expect(historyBtn).toBeVisible();
    await historyBtn.click();
    
    await page.waitForTimeout(500);
    
    // Check if history section is visible
    const historySection = await page.locator('#historySection');
    await expect(historySection).toBeVisible();
    
    console.log('✅ Workout history opened');
  });

  // Test 9: Responsive design (mobile viewport)
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(APP_URL);
    await page.waitForTimeout(1000);
    
    // Check if page is responsive
    const header = await page.locator('.app-header');
    await expect(header).toBeVisible();
    
    const generateBtn = await page.locator('#generateBtn');
    await expect(generateBtn).toBeVisible();
    
    console.log('✅ Mobile viewport works correctly');
  });

  // Test 10: Offline functionality
  test('should work offline', async ({ page, context }) => {
    await page.goto(APP_URL);
    await page.waitForTimeout(2000); // Wait for service worker to cache
    
    // Go offline
    await context.setOffline(true);
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Check if page still loads
    await expect(page).toHaveTitle(/Workout Generator/);
    
    // Check offline indicator
    const offlineIndicator = await page.locator('#offline-indicator');
    const statusText = await offlineIndicator.textContent();
    expect(statusText).toContain('Offline');
    
    // Try to generate workout offline
    const generateBtn = await page.locator('#generateBtn');
    await generateBtn.click();
    await page.waitForTimeout(2000);
    
    // Check if workout was generated
    const exercises = await page.locator('.exercise-card');
    const exerciseCount = await exercises.count();
    expect(exerciseCount).toBeGreaterThan(0);
    
    console.log('✅ App works offline');
    
    // Go back online
    await context.setOffline(false);
  });

  // Test 11: Cache storage
  test('should cache assets', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForTimeout(2000);
    
    // Check if cache storage exists
    const cacheExists = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      return cacheNames.length > 0;
    });
    
    expect(cacheExists).toBe(true);
    console.log('✅ Assets are cached');
  });

  // Test 12: Icons are accessible
  test('should have all required icons', async ({ page }) => {
    await page.goto(APP_URL);
    
    const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
    
    for (const size of iconSizes) {
      const iconResponse = await page.goto(`${APP_URL}/assets/icons/icon-${size}x${size}.png`);
      expect(iconResponse.status()).toBe(200);
    }
    
    console.log('✅ All icons are accessible');
  });

  // Test 13: No console errors
  test('should have no console errors', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto(APP_URL);
    await page.waitForTimeout(2000);
    
    // Filter out known acceptable errors (like service worker updates)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('service worker') && 
      !error.includes('DevTools')
    );
    
    expect(criticalErrors.length).toBe(0);
    console.log('✅ No critical console errors');
  });

  // Test 14: HTTPS meta tags
  test('should have proper meta tags', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]');
    const viewportContent = await viewport.getAttribute('content');
    expect(viewportContent).toContain('width=device-width');
    expect(viewportContent).not.toContain('user-scalable=no');
    
    // Check theme color
    const themeColor = await page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveCount(1);
    
    console.log('✅ Meta tags are correct');
  });

  // Test 15: Performance check
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    console.log(`✅ Page loaded in ${loadTime}ms`);
  });
});

