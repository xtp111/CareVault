import { test, expect } from '@playwright/test';

test.describe('Registration Form UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Switch to registration mode
    const registerToggle = page.getByRole('button', { name: /Register/i });
    await registerToggle.click();
    await page.waitForTimeout(500);
  });

  test('Caregiver registration form shows correct fields', async ({ page }) => {
    // Caregiver should be selected by default
    const caregiverRadio = page.locator('input[name="role"][value="caregiver"]');
    await expect(caregiverRadio).toBeVisible({ timeout: 5000 });
    await expect(caregiverRadio).toBeChecked();

    // Verify common fields are visible
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#fullName')).toBeVisible();
    await expect(page.locator('input#phone')).toBeVisible();

    // Patient-specific fields should NOT be visible
    await expect(page.locator('input#caregiverEmail')).not.toBeVisible();
    await expect(page.locator('input#caregiverName')).not.toBeVisible();
  });

  test('Patient registration form shows caregiver fields', async ({ page }) => {
    // Select Patient role
    const patientRadio = page.locator('input[name="role"][value="patient"]');
    await expect(patientRadio).toBeVisible({ timeout: 5000 });
    await patientRadio.check();
    await page.waitForTimeout(500);

    // Verify patient-specific caregiver fields appear
    await expect(page.locator('input#caregiverEmail')).toBeVisible();
    await expect(page.locator('input#caregiverName')).toBeVisible();

    // Common fields should still be visible
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#fullName')).toBeVisible();
  });

  test('Can toggle back to sign in mode', async ({ page }) => {
    // We are in registration mode from beforeEach
    // Verify registration fields are visible
    await expect(page.locator('input#fullName')).toBeVisible();

    // Click "Already have an account? Sign In"
    const signInToggle = page.getByRole('button', { name: /Sign In/i });
    await signInToggle.click();
    await page.waitForTimeout(500);

    // Registration fields should disappear
    await expect(page.locator('input#fullName')).not.toBeVisible();

    // Login fields should remain
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
  });
});
