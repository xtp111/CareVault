import { test, expect } from '@playwright/test';

test.describe('User Registration Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000); // Wait for page to fully load
  });

  test('Test 1 - Caregiver Registration', async ({ page }) => {
    console.log('=== Test 1: Caregiver Registration ===');
    
    // Step 1: Take screenshot of login page
    await page.screenshot({ 
      path: 'c:/Users/aw/Downloads/caregiver_app_project/test-screenshots/01-login-page-initial.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 1: Login page captured');

    // Step 2: Click Sign Up link to switch to registration mode
    const signUpLink = page.locator('button:has-text("Don\'t have an account? Register")');
    await signUpLink.click();
    await page.waitForTimeout(1000);
    
    // Verify we are in sign up mode
    const signUpButton = await page.locator('button[type="submit"]').textContent();
    expect(signUpButton).toContain('Sign Up');
    console.log('✓ Switched to Sign Up mode');

    // Ensure Caregiver role is selected (should be default)
    await page.locator('input[name="role"][value="caregiver"]').check();
    console.log('✓ Caregiver role selected');

    // Step 3: Fill in Caregiver registration form
    await page.locator('input#email').fill('test-caregiver-001@example.com');
    await page.locator('input#password').fill('Password123!');
    await page.locator('input#fullName').fill('John Caregiver');
    await page.locator('input#phone').fill('1234567890');
    console.log('✓ Form filled with caregiver data');

    // Setup console listener for errors
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Step 4: Click Sign Up button
    await page.locator('button[type="submit"]').click();
    console.log('✓ Clicked Sign Up button');

    // Step 5: Wait 3 seconds for registration to complete
    await page.waitForTimeout(3000);

    // Step 6: Take screenshot showing the result
    await page.screenshot({ 
      path: 'c:/Users/aw/Downloads/caregiver_app_project/test-screenshots/02-caregiver-registration-result.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 2: Caregiver registration result captured');

    // Check if redirected
    const currentUrl = page.url();
    console.log(`Current URL after registration: ${currentUrl}`);

    // Step 7: Check console for errors
    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach(err => console.log('ERROR:', err));
    } else {
      console.log('✓ No console errors detected');
    }

    // Wait a bit more to see final state
    await page.waitForTimeout(2000);
    
    // Take final dashboard screenshot
    await page.screenshot({ 
      path: 'c:/Users/aw/Downloads/caregiver_app_project/test-screenshots/03-caregiver-dashboard.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 3: Caregiver dashboard captured');
  });

  test('Test 2 - Patient Registration', async ({ page }) => {
    console.log('\n=== Test 2: Patient Registration ===');
    
    // Step 1: Navigate to login page (already done in beforeEach)
    console.log('✓ Navigated to /login');

    // Step 2: Switch to Patient tab (registration mode first)
    const signUpLink = page.locator('button:has-text("Don\'t have an account? Register")');
    await signUpLink.click();
    await page.waitForTimeout(1000);
    
    // Select Patient role
    await page.locator('input[name="role"][value="patient"]').check();
    await page.waitForTimeout(1000);
    console.log('✓ Switched to Patient registration mode');

    // Verify patient-specific fields are visible
    const caregiverEmailField = await page.locator('input#caregiverEmail').isVisible();
    expect(caregiverEmailField).toBeTruthy();
    console.log('✓ Patient-specific fields visible');

    // Step 3: Fill in Patient registration form
    await page.locator('input#email').fill('test-patient-001@example.com');
    await page.locator('input#password').fill('Password123!');
    await page.locator('input#fullName').fill('Jane Patient');
    await page.locator('input#caregiverEmail').fill('test-caregiver-001@example.com');
    await page.locator('input#caregiverName').fill('John Caregiver');
    console.log('✓ Form filled with patient data');

    // Setup console listener for errors
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Step 4: Click Sign Up button
    await page.locator('button[type="submit"]').click();
    console.log('✓ Clicked Sign Up button');

    // Step 5: Wait 3 seconds for registration to complete
    await page.waitForTimeout(3000);

    // Step 6: Take screenshot showing the result
    await page.screenshot({ 
      path: 'c:/Users/aw/Downloads/caregiver_app_project/test-screenshots/04-patient-registration-result.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 4: Patient registration result captured');

    // Check if redirected
    const currentUrl = page.url();
    console.log(`Current URL after registration: ${currentUrl}`);

    // Step 7: Check console for errors
    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach(err => console.log('ERROR:', err));
    } else {
      console.log('✓ No console errors detected');
    }

    // Wait a bit more to see final state
    await page.waitForTimeout(2000);
    
    // Take final dashboard screenshot
    await page.screenshot({ 
      path: 'c:/Users/aw/Downloads/caregiver_app_project/test-screenshots/05-patient-dashboard.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 5: Patient dashboard captured');
  });
});