import { test, expect } from '@playwright/test'

test('Debug: Caregiver Registration Flow with Console Logs', async ({ page }) => {
  const timestamp = Date.now()
  const testEmail = `debug-caregiver-${timestamp}@test.com`

  // Capture console messages
  const consoleLogs: string[] = []
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`
    consoleLogs.push(text)
    console.log(text)
  })

  // Capture network requests
  const networkRequests: any[] = []
  page.on('request', request => {
    if (request.url().includes('supabase') || request.url().includes('auth')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      })
      console.log(`[REQUEST] ${request.method()} ${request.url()}`)
    }
  })

  // Navigate to login page
  console.log('=== STEP 1: Navigate to login page ===')
  await page.goto('http://localhost:3006/login')
  await page.waitForLoadState('networkidle')
  
  // Screenshot 1: Initial login page
  await page.screenshot({ path: 'test-screenshots/debug-01-login-page.png', fullPage: true })
  console.log('Screenshot saved: debug-01-login-page.png')

  // Click "Sign Up" tab (toggle to registration)
  console.log('\n=== STEP 2: Switch to Sign Up mode ===')
  const signUpToggle = page.locator('button:has-text("Don\'t have an account? Register")')
  await signUpToggle.click()
  await page.waitForTimeout(500)
  
  // Screenshot 2: Sign up form
  await page.screenshot({ path: 'test-screenshots/debug-02-signup-form.png', fullPage: true })
  console.log('Screenshot saved: debug-02-signup-form.png')

  // Verify "Caregiver" radio is selected by default
  console.log('\n=== STEP 3: Verify Caregiver role is selected ===')
  const caregiverRadio = page.locator('input[type="radio"][value="caregiver"]')
  const isChecked = await caregiverRadio.isChecked()
  console.log(`Caregiver radio checked: ${isChecked}`)
  expect(isChecked).toBe(true)

  // Fill registration form
  console.log('\n=== STEP 4: Fill registration form ===')
  await page.fill('input[type="email"]', testEmail)
  await page.fill('input[type="password"]', 'Test123456!')
  await page.fill('input#fullName', 'Debug Caregiver')
  await page.fill('input#phone', '1234567890')
  
  console.log(`Email: ${testEmail}`)
  console.log('Password: Test123456!')
  console.log('Full Name: Debug Caregiver')
  console.log('Phone: 1234567890')
  console.log('Role: caregiver')

  // Screenshot 3: Filled form
  await page.screenshot({ path: 'test-screenshots/debug-03-filled-form.png', fullPage: true })
  console.log('Screenshot saved: debug-03-filled-form.png')

  // Open DevTools Console in the page context
  console.log('\n=== STEP 5: Click Sign Up button and monitor network ===')
  
  // Click Sign Up button
  const signUpButton = page.locator('button[type="submit"]:has-text("Sign Up")')
  await signUpButton.click()
  
  // Wait for navigation or error
  console.log('Waiting for navigation...')
  await Promise.race([
    page.waitForURL('http://localhost:3006/', { timeout: 10000 }),
    page.waitForURL('http://localhost:3006/dashboard', { timeout: 10000 }),
    page.waitForTimeout(10000)
  ]).catch(() => console.log('No navigation detected or timeout'))

  // Screenshot 4: After signup (either error or redirect)
  await page.screenshot({ path: 'test-screenshots/debug-04-after-signup.png', fullPage: true })
  console.log('Screenshot saved: debug-04-after-signup.png')

  const currentUrl = page.url()
  console.log(`Current URL: ${currentUrl}`)

  // Check for error messages on page
  const errorElement = page.locator('.text-red-600, .text-destructive')
  const errorCount = await errorElement.count()
  if (errorCount > 0) {
    const errorText = await errorElement.first().textContent()
    console.log(`ERROR on page: ${errorText}`)
  }

  // If redirected to dashboard, check the header
  if (currentUrl.includes('/') && !currentUrl.includes('/login')) {
    console.log('\n=== STEP 6: Check Dashboard Portal Type ===')
    await page.waitForTimeout(2000)
    
    // Screenshot 5: Dashboard
    await page.screenshot({ path: 'test-screenshots/debug-05-dashboard.png', fullPage: true })
    console.log('Screenshot saved: debug-05-dashboard.png')

    // Check header text
    const headerText = await page.locator('header').textContent()
    console.log(`Header content: ${headerText}`)

    const caregiverPortal = page.locator('text=Caregiver Portal')
    const patientPortal = page.locator('text=Patient Portal')
    
    const isCaregiverPortal = await caregiverPortal.count() > 0
    const isPatientPortal = await patientPortal.count() > 0
    
    console.log(`Shows "Caregiver Portal": ${isCaregiverPortal}`)
    console.log(`Shows "Patient Portal": ${isPatientPortal}`)

    // Get localStorage token
    const token = await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      const authKey = keys.find(k => k.includes('supabase.auth.token'))
      return authKey ? localStorage.getItem(authKey) : null
    })
    
    if (token) {
      console.log('\n=== JWT Token Found ===')
      try {
        const tokenData = JSON.parse(token)
        console.log('Token structure:', JSON.stringify(tokenData, null, 2))
      } catch (e) {
        console.log('Raw token:', token.substring(0, 100) + '...')
      }
    }
  }

  // Print all console logs captured
  console.log('\n=== CAPTURED CONSOLE LOGS ===')
  consoleLogs.forEach(log => console.log(log))

  // Print network requests
  console.log('\n=== CAPTURED NETWORK REQUESTS ===')
  networkRequests.forEach(req => {
    console.log(`${req.method} ${req.url}`)
    if (req.postData) {
      console.log('POST Data:', req.postData)
    }
  })

  console.log('\n=== Test Complete ===')
  console.log(`Test email used: ${testEmail}`)
  console.log('Please check Supabase Database > public.users table for this email')
  console.log('Verify the role column value')
})
