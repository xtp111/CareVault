import { test, expect } from '@playwright/test';

test.describe('Comprehensive Registration Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
  });

  test('Test 1 - Caregiver Registration (CRITICAL)', async ({ page }) => {
    console.log('\n==================================================');
    console.log('=== TEST 1: CAREGIVER REGISTRATION (CRITICAL) ===');
    console.log('==================================================\n');
    
    // Step 1: Take screenshot of login page
    await page.screenshot({ 
      path: 'test-screenshots/comprehensive-01-login-page.png',
      fullPage: true 
    });
    console.log('✓ Step 1: Screenshot of login page captured');

    // Step 2: Click "Sign Up" or switch to registration mode
    const signUpButton = page.locator('button:has-text("Don\'t have an account?"), button:has-text("Register"), a:has-text("Sign Up")');
    await signUpButton.first().click();
    await page.waitForTimeout(1500);
    console.log('✓ Step 2: Switched to registration mode');

    // Step 3: Select "Caregiver" role
    const caregiverRadio = page.locator('input[name="role"][value="caregiver"]');
    await caregiverRadio.check();
    await page.waitForTimeout(500);
    console.log('✓ Step 3: Caregiver role selected');

    // Step 4: Fill in the form
    const timestamp = Date.now();
    const caregiverEmail = `test-caregiver-${timestamp}@example.com`;
    
    await page.locator('input#email').fill(caregiverEmail);
    await page.locator('input#password').fill('TestPass123!');
    await page.locator('input#fullName').fill('Alice Caregiver');
    
    // Check if phone field exists
    const phoneField = page.locator('input#phone');
    if (await phoneField.isVisible()) {
      await phoneField.fill('555-1234');
    }
    console.log('✓ Step 4: Form filled with:');
    console.log(`   Email: ${caregiverEmail}`);
    console.log('   Password: TestPass123!');
    console.log('   Full Name: Alice Caregiver');
    console.log('   Phone: 555-1234');

    // Setup console listener
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    const networkRequests: any[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    page.on('response', async response => {
      if (response.url().includes('supabase') || response.url().includes('auth')) {
        try {
          const body = await response.text();
          networkRequests.push({
            url: response.url(),
            status: response.status(),
            body: body.substring(0, 500)
          });
        } catch (e) {
          // Ignore if body can't be read
        }
      }
    });

    // Step 5: Click "Sign Up" button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    console.log('✓ Step 5: Clicked Sign Up button');

    // Step 6: Wait 5 seconds for registration and redirect
    console.log('⏳ Step 6: Waiting 5 seconds for registration and redirect...');
    await page.waitForTimeout(5000);

    // Step 7: Take screenshot of resulting page
    await page.screenshot({ 
      path: 'test-screenshots/comprehensive-02-caregiver-result.png',
      fullPage: true 
    });
    console.log('✓ Step 7: Screenshot of resulting page captured');

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Step 8 & 9: VERIFY CRITICAL - Check header and button
    console.log('\n=== CRITICAL VERIFICATION ===');
    
    // Check for header text
    const headerTexts = [
      'Caregiver Portal',
      'Patient Portal',
      'Patient Portal (Read-Only)',
      'Dashboard'
    ];
    
    let foundHeader = '';
    for (const headerText of headerTexts) {
      const header = page.locator(`h1:has-text("${headerText}"), h2:has-text("${headerText}"), div:has-text("${headerText}")`);
      if (await header.first().isVisible().catch(() => false)) {
        foundHeader = headerText;
        break;
      }
    }
    
    if (foundHeader) {
      console.log(`✓ Step 8: Page header says: "${foundHeader}"`);
    } else {
      console.log('✗ Step 8: Could not find expected header text');
      // Try to get any h1/h2 text
      const anyHeader = await page.locator('h1, h2').first().textContent().catch(() => 'none');
      console.log(`   Found header text: "${anyHeader}"`);
    }

    // Check for "Add Your First Patient" button or similar
    const addPatientButtons = [
      'Add Your First Patient',
      'Add Patient',
      'Add Care Recipient',
      'Add Your First Care Recipient'
    ];
    
    let foundButton = '';
    for (const buttonText of addPatientButtons) {
      const button = page.locator(`button:has-text("${buttonText}"), a:has-text("${buttonText}")`);
      if (await button.first().isVisible().catch(() => false)) {
        foundButton = buttonText;
        break;
      }
    }
    
    if (foundButton) {
      console.log(`✓ Step 9: "${foundButton}" button is visible`);
    } else {
      console.log('✗ Step 9: Could not find "Add Your First Patient" button');
      // Try to find any buttons
      const allButtons = await page.locator('button').allTextContents();
      console.log(`   Available buttons: ${allButtons.join(', ')}`);
    }

    // Step 10: Check console for errors
    console.log('\n=== CONSOLE MESSAGES ===');
    if (consoleMessages.length > 0) {
      consoleMessages.slice(-20).forEach(msg => console.log(msg));
    } else {
      console.log('No console messages');
    }
    
    if (consoleErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS (CRITICAL) ===');
      consoleErrors.forEach(err => console.log('ERROR:', err));
    } else {
      console.log('\n✓ No console errors detected');
    }

    // Network requests
    if (networkRequests.length > 0) {
      console.log('\n=== SUPABASE/AUTH NETWORK REQUESTS ===');
      networkRequests.forEach(req => {
        console.log(`${req.status} ${req.url}`);
        if (req.body) console.log(`   Body: ${req.body}`);
      });
    }

    // Save caregiver email for Test 3
    (global as any).caregiverEmail = caregiverEmail;
    
    console.log('\n==================================================');
    console.log('=== TEST 1 COMPLETE ===');
    console.log('==================================================\n');
  });

  test('Test 2 - Check Dashboard State', async ({ page }) => {
    console.log('\n==================================================');
    console.log('=== TEST 2: CHECK DASHBOARD STATE ===');
    console.log('==================================================\n');
    
    // This test assumes the user is still logged in from Test 1
    // If not, we need to login first
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('⚠ Still on login page, skipping dashboard check');
      return;
    }

    // Step 1: Take screenshot showing dashboard elements
    await page.screenshot({ 
      path: 'test-screenshots/comprehensive-03-dashboard-state.png',
      fullPage: true 
    });
    console.log('✓ Step 1: Dashboard screenshot captured');

    // Check header text
    const headerText = await page.locator('h1, h2').first().textContent().catch(() => 'none');
    console.log(`   Header text: "${headerText}"`);

    // Check for empty state card
    const emptyStateCard = page.locator('[class*="empty"], [class*="EmptyState"], div:has-text("No patients"), div:has-text("Add Your First")');
    const hasEmptyState = await emptyStateCard.first().isVisible().catch(() => false);
    console.log(`   Empty state card visible: ${hasEmptyState}`);
    
    if (hasEmptyState) {
      const emptyStateText = await emptyStateCard.first().textContent();
      console.log(`   Empty state content: "${emptyStateText}"`);
    }

    // Check all visible buttons
    const allButtons = await page.locator('button').allTextContents();
    console.log(`   Visible buttons: ${allButtons.filter(b => b.trim()).join(', ')}`);

    // Step 2: Try to log out if possible
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Log Out"), button:has-text("Sign Out")');
    if (await logoutButton.first().isVisible().catch(() => false)) {
      await logoutButton.first().click();
      await page.waitForTimeout(2000);
      console.log('✓ Step 2: Logged out successfully');
    } else {
      console.log('⚠ Step 2: Logout button not found');
    }

    console.log('\n==================================================');
    console.log('=== TEST 2 COMPLETE ===');
    console.log('==================================================\n');
  });

  test('Test 3 - Patient Registration', async ({ page }) => {
    console.log('\n==================================================');
    console.log('=== TEST 3: PATIENT REGISTRATION ===');
    console.log('==================================================\n');
    
    // Step 1: Navigate to /login again
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    console.log('✓ Step 1: Navigated to /login');

    // Step 2: Switch to registration mode
    const signUpButton = page.locator('button:has-text("Don\'t have an account?"), button:has-text("Register"), a:has-text("Sign Up")');
    await signUpButton.first().click();
    await page.waitForTimeout(1500);
    console.log('✓ Step 2: Switched to registration mode');

    // Step 3: Select "Patient" role
    const patientRadio = page.locator('input[name="role"][value="patient"]');
    await patientRadio.check();
    await page.waitForTimeout(1000);
    console.log('✓ Step 3: Patient role selected');

    // Step 4: Fill in the form
    const timestamp = Date.now();
    const patientEmail = `test-patient-${timestamp}@example.com`;
    const caregiverEmail = (global as any).caregiverEmail || 'test-caregiver-new@example.com';
    
    await page.locator('input#email').fill(patientEmail);
    await page.locator('input#password').fill('TestPass123!');
    await page.locator('input#fullName').fill('Bob Patient');
    
    // Fill caregiver fields if visible
    const caregiverEmailField = page.locator('input#caregiverEmail');
    const caregiverNameField = page.locator('input#caregiverName');
    
    if (await caregiverEmailField.isVisible().catch(() => false)) {
      await caregiverEmailField.fill(caregiverEmail);
      console.log(`   Caregiver Email: ${caregiverEmail}`);
    }
    
    if (await caregiverNameField.isVisible().catch(() => false)) {
      await caregiverNameField.fill('Alice Caregiver');
    }
    
    console.log('✓ Step 4: Form filled with:');
    console.log(`   Email: ${patientEmail}`);
    console.log('   Password: TestPass123!');
    console.log('   Full Name: Bob Patient');
    console.log(`   Caregiver Email: ${caregiverEmail}`);
    console.log('   Caregiver Name: Alice Caregiver');

    // Setup console listener
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Step 5: Click Sign Up button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    console.log('✓ Step 5: Clicked Sign Up button');

    // Step 6: Wait 5 seconds
    console.log('⏳ Step 6: Waiting 5 seconds for registration...');
    await page.waitForTimeout(5000);

    // Step 7: Take screenshot of result
    await page.screenshot({ 
      path: 'test-screenshots/comprehensive-04-patient-result.png',
      fullPage: true 
    });
    console.log('✓ Step 7: Screenshot of result captured');

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Step 8: VERIFY - Check for success or error
    console.log('\n=== VERIFICATION ===');
    
    // Check for error messages
    const errorMessages = [
      'caregiver doesn\'t exist',
      'Caregiver not found',
      'Invalid caregiver',
      'error',
      'Error'
    ];
    
    let foundError = '';
    for (const errorText of errorMessages) {
      const errorElement = page.locator(`div:has-text("${errorText}"), span:has-text("${errorText}"), p:has-text("${errorText}")`);
      if (await errorElement.first().isVisible().catch(() => false)) {
        foundError = await errorElement.first().textContent() || '';
        break;
      }
    }
    
    if (foundError) {
      console.log(`✗ Step 8: Error message shown: "${foundError}"`);
    } else if (currentUrl.includes('/dashboard')) {
      console.log('✓ Step 8: Registration succeeded, redirected to dashboard');
    } else if (currentUrl.includes('/login')) {
      console.log('⚠ Step 8: Still on login page, checking for error messages');
      const pageText = await page.locator('body').textContent();
      console.log(`   Page content: ${pageText?.substring(0, 300)}`);
    } else {
      console.log(`⚠ Step 8: Unexpected state - URL: ${currentUrl}`);
    }

    // Check console
    if (consoleErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      consoleErrors.forEach(err => console.log('ERROR:', err));
    } else {
      console.log('\n✓ No console errors detected');
    }

    console.log('\n==================================================');
    console.log('=== TEST 3 COMPLETE ===');
    console.log('==================================================\n');
  });

  test('Test 4 - Database Verification', async ({ page }) => {
    console.log('\n==================================================');
    console.log('=== TEST 4: DATABASE VERIFICATION ===');
    console.log('==================================================\n');
    
    const networkRequests: any[] = [];
    const consoleErrors: string[] = [];
    
    // Step 1: Setup network listener
    page.on('response', async response => {
      if (response.url().includes('supabase') || 
          response.url().includes('auth') ||
          response.url().includes('rest')) {
        try {
          const body = await response.text();
          networkRequests.push({
            method: response.request().method(),
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            body: body.substring(0, 1000)
          });
        } catch (e) {
          networkRequests.push({
            method: response.request().method(),
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            body: 'Could not read body'
          });
        }
      }
    });

    // Step 2: Setup console listener
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('✓ Network and console listeners setup');
    console.log('ℹ This test monitors network traffic and console errors');
    console.log('ℹ Run this alongside other tests to capture API calls');

    // Navigate to login to trigger any API calls
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(3000);

    // Step 3: Report findings
    console.log('\n=== NETWORK REQUESTS TO SUPABASE ===');
    if (networkRequests.length > 0) {
      networkRequests.forEach((req, idx) => {
        console.log(`\nRequest ${idx + 1}:`);
        console.log(`  Method: ${req.method}`);
        console.log(`  URL: ${req.url}`);
        console.log(`  Status: ${req.status} ${req.statusText}`);
        if (req.body && req.body !== 'Could not read body') {
          console.log(`  Body: ${req.body}`);
        }
      });
    } else {
      console.log('No Supabase requests captured yet');
    }

    // Step 4: Report console errors
    console.log('\n=== CONSOLE ERRORS RELATED TO ROLE/PERMISSIONS ===');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => {
        if (err.toLowerCase().includes('role') || 
            err.toLowerCase().includes('permission') ||
            err.toLowerCase().includes('auth')) {
          console.log(`ERROR: ${err}`);
        }
      });
    } else {
      console.log('No role/permission related errors detected');
    }

    console.log('\n==================================================');
    console.log('=== TEST 4 COMPLETE ===');
    console.log('==================================================\n');
  });

  test.afterAll(async () => {
    console.log('\n');
    console.log('==================================================');
    console.log('=== COMPREHENSIVE TEST SUITE COMPLETE ===');
    console.log('==================================================');
    console.log('\nPlease check the following:');
    console.log('1. test-screenshots/comprehensive-*.png files');
    console.log('2. Console output above for critical verification');
    console.log('3. Look for the following key information:');
    console.log('   - Does Caregiver see "Caregiver Portal" header?');
    console.log('   - Does Caregiver see "Add Your First Patient" button?');
    console.log('   - Did Patient registration succeed or fail?');
    console.log('   - Were there any console errors about roles?');
    console.log('==================================================\n');
  });
});
