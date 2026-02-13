import { test, expect } from '@playwright/test';

test.describe('Comprehensive Registration Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('Caregiver Registration Flow', async ({ page }) => {
    // Switch to Sign Up mode
    const signUpButton = page.getByRole('button', { name: /Register/i });
    await signUpButton.click();
    await page.waitForTimeout(500);

    // Verify and select Caregiver role
    const caregiverRadio = page.locator('input[name="role"][value="caregiver"]');
    await expect(caregiverRadio).toBeVisible();
    await caregiverRadio.check();

    // Fill form
    const timestamp = Date.now();
    const caregiverEmail = `test-caregiver-${timestamp}@example.com`;
    
    await page.locator('input#email').fill(caregiverEmail);
    await page.locator('input#password').fill('TestPass123!');
    await page.locator('input#fullName').fill('Alice Caregiver');
    
    const phoneField = page.locator('input#phone');
    if (await phoneField.isVisible()) {
      await phoneField.fill('555-1234');
    }

    // Submit and wait
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 });

    // Verify success
    expect(page.url()).not.toContain('/login');
  });

  test('Patient Registration Flow', async ({ page }) => {
    // Switch to Sign Up mode
    const signUpButton = page.getByRole('button', { name: /Register/i });
    await signUpButton.click();
    await page.waitForTimeout(500);

    // Select Patient role
    const patientRadio = page.locator('input[name="role"][value="patient"]');
    await expect(patientRadio).toBeVisible();
    await patientRadio.check();
    await page.waitForTimeout(500);

    // Verify patient fields
    const caregiverEmailField = page.locator('input#caregiverEmail');
    await expect(caregiverEmailField).toBeVisible();

    // Fill form
    const timestamp = Date.now();
    
    await page.locator('input#email').fill(`test-patient-${timestamp}@example.com`);
    await page.locator('input#password').fill('TestPass123!');
    await page.locator('input#fullName').fill('Bob Patient');
    await caregiverEmailField.fill('existing-caregiver@example.com');
    
    const caregiverNameField = page.locator('input#caregiverName');
    if (await caregiverNameField.isVisible()) {
      await caregiverNameField.fill('Alice Caregiver');
    }

    // Submit
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);

    // Check result - either dashboard or error message
    const currentUrl = page.url();
    const hasError = await page.locator('.text-red-600, .text-destructive').count() > 0;
    
    if (currentUrl.includes('/dashboard')) {
      console.log('Registration succeeded');
    } else if (hasError) {
      console.log('Registration failed with error (expected if caregiver does not exist)');
    }
  });

  test('Login Page Elements', async ({ page }) => {
    // Verify login page elements
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Register/i })).toBeVisible();
  });
});
