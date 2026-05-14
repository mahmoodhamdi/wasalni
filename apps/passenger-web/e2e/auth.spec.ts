import { expect, test } from '@playwright/test';

test.describe('auth flow (UI-only, no backend)', () => {
  test('clicking "Sign in" navigates to /auth/login', async ({ page }) => {
    await page.goto('/en');
    const cta = page
      .getByRole('link', { name: /sign in/i })
      .or(page.getByRole('link', { name: 'Book a ride' }));
    await cta.first().click();
    await expect(page).toHaveURL(/\/en\/auth\/login/);
    await expect(page.getByPlaceholder(/01XXXXXXXXX/)).toBeVisible();
  });

  test('login form rejects invalid phone client-side', async ({ page }) => {
    await page.goto('/en/auth/login');
    await page.getByPlaceholder(/01XXXXXXXXX/).fill('123');
    await page.getByRole('button', { name: 'Next' }).click();
    // No nav because the form blocks; we should still be on /login.
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('verify page redirects to /login when no phone in URL', async ({ page }) => {
    const res = await page.goto('/ar/auth/verify');
    // Next renders a 200 redirect chain; final URL must be the login page.
    expect(res?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('offline route', () => {
  test('renders the offline message', async ({ page }) => {
    await page.goto('/en/offline');
    await expect(page.getByText(/offline|no internet/i).first()).toBeVisible();
  });
});
