import { expect, test } from '@playwright/test';

test.describe('home page', () => {
  test('root redirects to default locale (/ar)', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response).toBeTruthy();
    await expect(page).toHaveURL(/\/(ar|en)$/);
  });

  test('Arabic landing renders the brand and tagline', async ({ page }) => {
    await page.goto('/ar');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByText('وصلني', { exact: false }).first()).toBeVisible();
  });

  test('English landing renders LTR', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByText('Wasalni').first()).toBeVisible();
  });

  test('locale switcher flips between AR and EN', async ({ page }) => {
    await page.goto('/ar');
    await page
      .getByRole('button', { name: /Switch language to English|غير اللغة لـ English/ })
      .click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('static endpoints', () => {
  test('healthz returns JSON', async ({ request }) => {
    const res = await request.get('/api/healthz');
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { status: string; app: string };
    expect(body.status).toBe('ok');
    expect(body.app).toBe('passenger-web');
  });

  test('manifest is served as application/manifest+json', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    expect(res.ok()).toBe(true);
    expect(res.headers()['content-type']).toContain('manifest');
  });

  test('sw.js is served and ~tens of KB', async ({ request }) => {
    const res = await request.get('/sw.js');
    expect(res.ok()).toBe(true);
    const body = await res.body();
    expect(body.length).toBeGreaterThan(1000);
  });
});
