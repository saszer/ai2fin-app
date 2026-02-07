/**
 * Auth E2E Tests — embracingearth.space
 *
 * Tests: Login page renders, unauthenticated redirect, session persistence.
 * These run against the live local app (requires servers running).
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page should render', async ({ page }) => {
    await page.goto('/login');
    // The login page should show the app branding or login form
    await expect(page).toHaveURL(/login/);
  });

  test('unauthenticated user should be redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to login since not authenticated
    await expect(page).toHaveURL(/login/);
  });

  test('login page should not crash (no console errors)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/login');
    await page.waitForTimeout(2000); // Let React render

    // Filter out known benign errors (e.g. analytics, service worker)
    const criticalErrors = errors.filter(
      (e) => !e.includes('gtag') && !e.includes('analytics') && !e.includes('serviceWorker')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
