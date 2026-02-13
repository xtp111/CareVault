import { test, expect } from '@playwright/test';

test.describe('User Registration Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Wait for page to fully load including styles
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('Caregiver Registration', async ({ page }) => {
    // Wait for and click Register button
    const signUpLink = page.getByRole('button', { name: /Register/i });
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();
    
    // Wait for form to update
    await page.waitForTimeout(1000);
    
    // Wait for role selector to appear
    const caregiverRadio = page.locator('input[name="role"][value="caregiver"]');
    await expect(caregiverRadio).toBeVisible({ timeout: 10000 });
    await caregiverRadio.check();

    // Fill registration form
    const timestamp = Date.now();
    await page.locator('input#email').fill(`test-caregiver-${timestamp}@example.com`);
    await page.locator('input#password').fill('Password123!');
    await page.locator('input#fullName').fill('John Caregiver');
    
    const phoneField = page.locator('input#phone');
    if (await phoneField.isVisible()) {
      await phoneField.fill('1234567890');
    }

    // Submit
    await page.locator('button[type="submit"]').click();
    
    // Wait for navigation
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 });
    
    // Verify redirect
    expect(page.url()).not.toContain('/login');
  });

  test('Patient Registration', async ({ page }) => {
    // Wait for and click Register button
    const signUpLink = page.getByRole('button', { name: /Register/i });
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();
    
    // Wait for form to update
    await page.waitForTimeout(1000);

    // Select Patient role
    const patientRadio = page.locator('input[name="role"][value="patient"]');
    await expect(patientRadio).toBeVisible({ timeout: 10000 });
    await patientRadio.check();
    await page.waitForTimeout(500);

    // Verify patient fields are visible
    const caregiverEmailField = page.locator('input#caregiverEmail');
    await expect(caregiverEmailField).toBeVisible();

    // Fill registration form
    const timestamp = Date.now();
    await page.locator('input#email').fill(`test-patient-${timestamp}@example.com`);
    await page.locator('input#password').fill('Password123!');
    await page.locator('input#fullName').fill('Jane Patient');
    await caregiverEmailField.fill('existing-caregiver@example.com');
    
    const caregiverNameField = page.locator('input#caregiverName');
    if (await caregiverNameField.isVisible()) {
      await caregiverNameField.fill('John Caregiver');
    }

    // Submit
    await page.locator('button[type="submit"]').click();
    
    // Wait for result
    await page.waitForTimeout(5000);
  });
});
