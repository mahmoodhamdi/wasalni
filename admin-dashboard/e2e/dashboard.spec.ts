import { test, expect } from '@playwright/test';

// Helper to mock authentication
async function mockLogin(page: ReturnType<typeof test>['page']) {
  // Set mock auth token in localStorage
  await page.addInitScript(() => {
    localStorage.setItem('wasalni-admin-auth', JSON.stringify({
      state: {
        token: 'mock-test-token',
        user: {
          _id: 'test-admin',
          name: 'Test Admin',
          email: 'admin@wasalni.com',
          role: 'admin',
        },
        isAuthenticated: true,
      },
    }));
  });
}

test.describe('Dashboard Pages (Visual Tests)', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page);
  });

  test('dashboard page should load', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for main dashboard elements
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('drivers page should load', async ({ page }) => {
    await page.goto('/dashboard/drivers');

    // Should have drivers heading
    await expect(page.locator('text=السائقين')).toBeVisible({ timeout: 10000 });
  });

  test('passengers page should load', async ({ page }) => {
    await page.goto('/dashboard/passengers');

    // Should have passengers heading
    await expect(page.locator('text=الركاب')).toBeVisible({ timeout: 10000 });
  });

  test('trips page should load', async ({ page }) => {
    await page.goto('/dashboard/trips');

    // Should have trips heading
    await expect(page.locator('text=الرحلات')).toBeVisible({ timeout: 10000 });
  });

  test('promos page should load', async ({ page }) => {
    await page.goto('/dashboard/promos');

    // Should have promos heading
    await expect(page.locator('text=الأكواد')).toBeVisible({ timeout: 10000 });
  });

  test('settings page should load', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Should have settings heading
    await expect(page.locator('text=الإعدادات')).toBeVisible({ timeout: 10000 });
  });

  test('zones page should load', async ({ page }) => {
    await page.goto('/dashboard/zones');

    // Should have zones/fares content
    await expect(page.locator('text=المناطق')).toBeVisible({ timeout: 10000 });
  });

  test('finance page should load', async ({ page }) => {
    await page.goto('/dashboard/finance');

    // Should have finance heading
    await expect(page.locator('text=التقارير المالية')).toBeVisible({ timeout: 10000 });
  });
});
