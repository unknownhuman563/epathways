import { test, expect, Page } from '@playwright/test';

/**
 * Accommodation Expression of Interest (HOT + COLD) — submission + the
 * "invisible server-error" fix (jump back to the erroring section).
 *
 * Prereqs: app on http://localhost:8000 (php artisan serve + built/served assets).
 * Run: npx playwright test e2e/accommodation-eoi.spec.ts
 */

async function next(page: Page) {
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);
}

// Fill sections 1–7 (0-indexed 0..6) with valid data except the supplied email.
// Leaves the wizard on the final Declaration & Consent section.
async function fillThroughDeclaration(page: Page, opts: { isHot: boolean; email: string }) {
    const form = page.locator('form');
    const tb = (i: number) => form.getByRole('textbox').nth(i);
    const radio = (name: string) => form.getByRole('radio', { name, exact: true });
    const scopeRadio = (labelSub: string, name: string) =>
        form.locator(`div:has(> label:has-text("${labelSub}"))`).getByRole('radio', { name, exact: true });

    // Section 1 — Personal Details
    await tb(0).fill('Jane Q Doe');
    await tb(1).fill('LX1');
    await radio('Work Visa').check();
    await radio('Filipino').check();
    await tb(2).fill('Jane');
    await tb(3).fill(opts.email);
    await tb(4).fill('0211234567');
    await form.getByRole('spinbutton').fill('25');
    await next(page);

    // Section 2 — Property & Room Interest
    if (opts.isHot) await tb(0).fill('Test Property — Hobsonville');
    await form.locator('input[type="date"]').fill('2026-08-01');
    await radio('One Ensuite Room (private toilet and bathroom)').check();
    await radio('12 months').check();
    await next(page);

    // Section 3 — Occupancy
    await radio('Just me').check();
    await tb(0).fill('28');
    await scopeRadio('Any children', 'No').check();
    await scopeRadio('Any pets', 'No').check();
    await next(page);

    // Section 4 — Employment / Study
    await radio('Full-time employment').check();
    await next(page);

    // Section 5 — Rental Background
    await tb(0).fill('1 Test St, Hobsonville');
    await radio('Yes').check(); // have you rented before
    await tb(1).fill('2 years');
    await radio('Renting').check();
    await tb(2).fill('Closer to work');
    await next(page);

    // Section 6 — Lifestyle & Compatibility
    await scopeRadio('Do you smoke or vape', 'No').check();
    await radio('Socially').check();
    await radio('Day').check();
    await tb(0).fill('Tidy, quiet, respectful of shared spaces.');
    await next(page);

    // Section 7 — Viewing Availability
    await radio('Yes').check(); // available within 7 days
    await radio('Flexible').check();
    await next(page);

    // Now on Section 8 — Declaration & Consent
    await expect(page.getByText('Section 8 of 8')).toBeVisible();
}

async function acceptDeclaration(page: Page) {
    const cbs = page.locator('form').getByRole('checkbox');
    await cbs.nth(0).check();
    await cbs.nth(1).check();
}

test('HOT form: valid submission reaches the thank-you screen', async ({ page }) => {
    await page.goto('/accommodation/expression-of-interest-hot');
    await fillThroughDeclaration(page, { isHot: true, email: 'jane.hot@example.com' });
    await acceptDeclaration(page);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('heading', { name: /Thank you for registering/i })).toBeVisible({ timeout: 15000 });
});

test('COLD form: valid submission reaches the thank-you screen', async ({ page }) => {
    await page.goto('/accommodation/expression-of-interest-cold');
    await fillThroughDeclaration(page, { isHot: false, email: 'jane.cold@example.com' });
    await acceptDeclaration(page);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('heading', { name: /Thank you for registering/i })).toBeVisible({ timeout: 15000 });
});

test('HOT form: invalid email jumps back to Personal Details and shows the error (the fix)', async ({ page }) => {
    await page.goto('/accommodation/expression-of-interest-hot');
    // "notanemail" passes the client non-empty check but fails the server email rule.
    await fillThroughDeclaration(page, { isHot: true, email: 'notanemail' });
    await acceptDeclaration(page);
    await page.getByRole('button', { name: 'Submit' }).click();

    // The fix: instead of silently doing nothing, the wizard jumps to Section 1
    // (Personal Details) and surfaces the server validation error.
    await expect(page.getByText('Section 1 of 8')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/valid email/i)).toBeVisible();
});
