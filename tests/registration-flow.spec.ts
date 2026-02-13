import { test, expect } from '@playwright/test';

test.describe('Login Page UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('Login page renders correctly', async ({ page }) => {
    // Verify core login elements are visible
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();

    // Verify Sign In button exists
    const signInButton = page.getByRole('button', { name: /Sign In/i });
    await expect(signInButton).toBeVisible();

    // Verify Register toggle link exists
    const registerToggle = page.getByRole('button', { name: /Register/i });
    await expect(registerToggle).toBeVisible();
  });

  test('Can switch to registration mode', async ({ page }) => {
    // Click Register toggle
    const registerToggle = page.getByRole('button', { name: /Register/i });
    await registerToggle.click();
    await page.waitForTimeout(500);

    // Verify registration fields appear
    const caregiverRadio = page.locator('input[name="role"][value="caregiver"]');
    await expect(caregiverRadio).toBeVisible({ timeout: 5000 });

    const patientRadio = page.locator('input[name="role"][value="patient"]');
    await expect(patientRadio).toBeVisible();

    // Verify common registration fields
    await expect(page.locator('input#fullName')).toBeVisible();
    await expect(page.locator('input#phone')).toBeVisible();

    // Verify Sign Up button appears
    const signUpButton = page.getByRole('button', { name: /Sign Up/i });
    await expect(signUpButton).toBeVisible();
  });
});
