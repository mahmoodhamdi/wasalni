import { test, expect } from '@playwright/test';

test.describe('Dashboard Pages (Visual Tests)', () => {
  // Setup authentication before each test
  test.beforeEach(async ({ page }) => {
    // Set auth state via context to persist across navigations
    await page.context().addInitScript(() => {
      window.localStorage.setItem('wasalni-admin-auth', JSON.stringify({
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
  });

  test('dashboard page should load', async ({ page }) => {
    await page.goto('/dashboard');
    // Check for any heading (page loaded)
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });

  test('drivers page should load', async ({ page }) => {
    await page.goto('/dashboard/drivers');
    // Use flexible selector - first visible heading
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });

  test('passengers page should load', async ({ page }) => {
    await page.goto('/dashboard/passengers');
    // Use flexible selector
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });

  test('trips page should load', async ({ page }) => {
    await page.goto('/dashboard/trips');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });

  test('promos page should load', async ({ page }) => {
    await page.goto('/dashboard/promos');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });

  test('settings page should load', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });

  test('zones page should load', async ({ page }) => {
    await page.goto('/dashboard/zones');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });

  test('finance page should load', async ({ page }) => {
    await page.goto('/dashboard/finance');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });
});
