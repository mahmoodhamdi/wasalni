import { expect, test } from '@playwright/test';

test.describe('driver home page', () => {
  test('root redirects to default locale', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(ar|en)$/);
  });

  test('Arabic landing shows the driver brand + warning card', async ({ page }) => {
    await page.goto('/ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByText('للسواق', { exact: false }).first()).toBeVisible();
    // The honest "you must keep the app open" warning card
    await expect(page.getByText(/مهم|كيب|التطبيق مفتوح/i).first()).toBeVisible();
  });

  test('English landing shows the driver brand + warning', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByText(/driver/i).first()).toBeVisible();
    await expect(page.getByText(/important|keep.*open/i).first()).toBeVisible();
  });

  test('CTAs lead to /auth/login', async ({ page }) => {
    await page.goto('/en');
    const cta = page.getByRole('link', { name: /sign up|already have/i }).first();
    await cta.click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('driver endpoints', () => {
  test('healthz returns driver-web app id', async ({ request }) => {
    const res = await request.get('/api/healthz');
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { app: string };
    expect(body.app).toBe('driver-web');
  });

  test('manifest serves a driver-flavoured PWA', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { short_name: string };
    expect(body.short_name).toMatch(/سائق|driver/i);
  });

  test('pending screen renders without auth and explains the state', async ({ page }) => {
    await page.goto('/en/auth/pending');
    await expect(page.getByText(/review/i).first()).toBeVisible();
  });
});
