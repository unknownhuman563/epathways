import { test, expect } from '@playwright/test';

/**
 * Team profile (digital card) page.
 * Prerequisites: php artisan serve (:8000) + npm run dev.
 * Run: npx playwright test e2e/team-profile.spec.ts
 */

test('renders a known member profile with name and role', async ({ page }) => {
  await page.goto('http://localhost:8000/team/dinah-suarin');
  await expect(page.getByRole('heading', { name: /dinah suarin/i })).toBeVisible();
  await expect(page.getByText(/co-founding member/i)).toBeVisible();
});

test('shows a not-found state for an unknown slug', async ({ page }) => {
  await page.goto('http://localhost:8000/team/no-such-person');
  await expect(page.getByRole('heading', { name: /profile not found/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /meet the team/i })).toBeVisible();
});

test('any rendered booking button opens in a new tab', async ({ page }) => {
  await page.goto('http://localhost:8000/team/dinah-suarin');
  const book = page.getByRole('link', { name: /book a call/i });
  // Only asserted when a real booking link has been filled in.
  if (await book.count()) {
    await expect(book).toHaveAttribute('target', '_blank');
    await expect(book).toHaveAttribute('rel', /noopener/);
  }
});
