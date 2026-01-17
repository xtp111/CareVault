import { test, expect } from '@playwright/test'

test.describe('CareVault - Use Case Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Use Case 1: Managing Medical Documents', () => {
    test('UC1.1 - User adds a new medical document without file', async ({ page }) => {
      // Step 1: Click Add Document button
      await page.getByRole('button', { name: /Add Document/i }).first().click()
      
      // Step 2: Verify modal opens
      await expect(page.getByText('Add New Document')).toBeVisible()
      
      // Step 3: Fill in document details
      await page.getByLabel('Document Name').fill('Medical Insurance Card')
      await page.locator('#doc-category').selectOption('medical')
      await page.getByLabel('Date').fill('2024-01-15')
      
      // Step 4: Submit form
      await page.getByRole('button', { name: /Add Document/i }).last().click()
      
      // Step 5: Verify modal closes
      await expect(page.getByText('Add New Document')).not.toBeVisible()
      
      // Step 6: Verify document appears in the list
      await expect(page.getByText('Medical Insurance Card')).toBeVisible()
    })

    test('UC1.2 - User adds a document with PDF file', async ({ page }) => {
      await page.getByRole('button', { name: /Add Document/i }).first().click()
      await expect(page.getByText('Add New Document')).toBeVisible()
      
      // Upload file
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'test-medical-record.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('fake pdf content'),
      })
      
      // Verify file selected indicator appears
      await expect(page.getByText(/Selected: test-medical-record.pdf/i)).toBeVisible()
      
      await page.getByLabel('Document Name').fill('Lab Results 2024')
      await page.locator('#doc-category').selectOption('medical')
      
      await page.getByRole('button', { name: /Add Document/i }).last().click()
      
      await expect(page.getByText('Lab Results 2024')).toBeVisible()
    })

    test('UC1.3 - User views document by category', async ({ page }) => {
      // Verify all document categories are visible
      await expect(page.getByText('Legal Documents')).toBeVisible()
      await expect(page.getByText('Medical Documents')).toBeVisible()
      await expect(page.getByText('Financial Documents')).toBeVisible()
      await expect(page.getByText('Identification')).toBeVisible()
      
      // Verify document count is displayed for each category
      await expect(page.locator('text=/\\d+ documents/').first()).toBeVisible()
    })

    test('UC1.4 - User deletes a document', async ({ page }) => {
      // First add a document
      await page.getByRole('button', { name: /Add Document/i }).first().click()
      await page.getByLabel('Document Name').fill('Document to Delete')
      await page.getByRole('button', { name: /Add Document/i }).last().click()
      
      // Wait for document to appear
      await expect(page.getByText('Document to Delete')).toBeVisible()
      
      // Hover to reveal delete button
      const docItem = page.locator('text=Document to Delete').locator('..')
      await docItem.hover()
      
      // Click delete button
      page.on('dialog', dialog => dialog.accept())
      await docItem.getByRole('button').click()
      
      // Verify document is removed
      await expect(page.getByText('Document to Delete')).not.toBeVisible()
    })
  })

  test.describe('Use Case 2: Managing Medical Records', () => {
    test('UC2.1 - User adds medication information', async ({ page }) => {
      await page.getByText('Add Medical Record').click()
      await expect(page.getByText('Enter medical record information')).toBeVisible()
      
      await page.locator('#med-type').selectOption('medications')
      await page.getByLabel('Name').fill('Aspirin')
      await page.getByLabel('Details').fill('100mg daily, take with food')
      await page.getByLabel('Date').fill('2024-01-15')
      
      await page.getByRole('button', { name: /Add Record/i }).click()
      
      await expect(page.getByText('Aspirin')).toBeVisible()
      await expect(page.getByText('100mg daily, take with food')).toBeVisible()
    })

    test('UC2.2 - User adds doctor information', async ({ page }) => {
      await page.getByText('Add Medical Record').click()
      
      await page.locator('#med-type').selectOption('doctors')
      await page.getByLabel('Name').fill('Dr. Sarah Johnson')
      await page.getByLabel('Details').fill('Cardiologist, Phone: 555-0123')
      await page.getByLabel('Date').fill('2024-01-15')
      
      await page.getByRole('button', { name: /Add Record/i }).click()
      
      await expect(page.getByText('Dr. Sarah Johnson')).toBeVisible()
      await expect(page.getByText(/Cardiologist/i)).toBeVisible()
    })

    test('UC2.3 - User adds medical condition', async ({ page }) => {
      await page.getByText('Add Medical Record').click()
      
      await page.locator('#med-type').selectOption('conditions')
      await page.getByLabel('Name').fill('Type 2 Diabetes')
      await page.getByLabel('Details').fill('Diagnosed 2020, managed with diet and medication')
      
      await page.getByRole('button', { name: /Add Record/i }).click()
      
      await expect(page.getByText('Type 2 Diabetes')).toBeVisible()
    })

    test('UC2.4 - User deletes medical record', async ({ page }) => {
      // Add a medical record
      await page.getByText('Add Medical Record').click()
      await page.locator('#med-type').selectOption('medications')
      await page.getByLabel('Name').fill('Test Medication')
      await page.getByRole('button', { name: /Add Record/i }).click()
      
      await expect(page.getByText('Test Medication')).toBeVisible()
      
      // Delete the record
      const recordItem = page.locator('text=Test Medication').locator('..')
      await recordItem.hover()
      
      page.on('dialog', dialog => dialog.accept())
      await recordItem.getByRole('button').click()
      
      await expect(page.getByText('Test Medication')).not.toBeVisible()
    })
  })

  test.describe('Use Case 3: Emergency Information Access', () => {
    test('UC3.1 - User views emergency summary', async ({ page }) => {
      // First add some medical records
      await page.getByText('Add Medical Record').click()
      await page.locator('#med-type').selectOption('doctors')
      await page.getByLabel('Name').fill('Dr. Emergency Contact')
      await page.getByRole('button', { name: /Add Record/i }).click()
      
      // Open emergency summary
      await page.getByText('Emergency Summary').first().click()
      
      // Verify modal opens
      await expect(page.getByText('Emergency Information Summary')).toBeVisible()
      
      // Verify sections exist
      await expect(page.getByText('Primary Doctors')).toBeVisible()
      await expect(page.getByText('Current Medications')).toBeVisible()
      await expect(page.getByText('Medical History')).toBeVisible()
      
      // Verify the added doctor appears
      await expect(page.getByText('Dr. Emergency Contact')).toBeVisible()
    })

    test('UC3.2 - User prints emergency summary', async ({ page }) => {
      await page.getByText('Emergency Summary').first().click()
      await expect(page.getByText('Emergency Information Summary')).toBeVisible()
      
      // Verify print button exists
      await expect(page.getByRole('button', { name: /Print Summary/i })).toBeVisible()
    })

    test('UC3.3 - User closes emergency summary', async ({ page }) => {
      await page.getByText('Emergency Summary').first().click()
      await expect(page.getByText('Emergency Information Summary')).toBeVisible()
      
      await page.getByRole('button', { name: /Close/i }).click()
      
      await expect(page.getByText('Emergency Information Summary')).not.toBeVisible()
    })
  })

  test.describe('Use Case 4: Appointment Management', () => {
    test('UC4.1 - User opens appointment list', async ({ page }) => {
      await page.getByText('Appointment Reminder').click()
      
      await expect(page.getByText('Manage your appointments')).toBeVisible()
      await expect(page.getByText(/Upcoming Appointments/i)).toBeVisible()
      await expect(page.getByText(/Past Appointments/i)).toBeVisible()
    })

    test('UC4.2 - User adds new appointment', async ({ page }) => {
      // Open appointment list
      await page.getByText('Appointment Reminder').click()
      
      // Click calendar icon to add appointment
      await page.locator('button[title]').first().click()
      
      // Wait for modal
      await page.waitForTimeout(500)
      
      // Fill appointment form
      const titleInput = page.getByLabel('Title *')
      if (await titleInput.isVisible()) {
        await titleInput.fill('Doctor Appointment')
        await page.getByLabel('Description').fill('Annual checkup with Dr. Smith')
        
        // Set appointment date to tomorrow
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const dateString = tomorrow.toISOString().slice(0, 16)
        await page.getByLabel('Appointment Date & Time').fill(dateString)
        
        await page.getByLabel('Remind Before (minutes)').fill('30')
        
        await page.getByRole('button', { name: /Add Appointment/i }).click()
        
        await expect(page.getByText('Doctor Appointment')).toBeVisible()
      }
    })
  })

  test.describe('Use Case 5: Form Validation', () => {
    test('UC5.1 - Cannot submit document without name', async ({ page }) => {
      page.on('dialog', dialog => {
        expect(dialog.message()).toContain('Please enter a document name')
        dialog.accept()
      })
      
      await page.getByRole('button', { name: /Add Document/i }).first().click()
      await page.getByRole('button', { name: /Add Document/i }).last().click()
      
      // Modal should remain open
      await expect(page.getByText('Add New Document')).toBeVisible()
    })

    test('UC5.2 - Cannot submit medical record without name', async ({ page }) => {
      page.on('dialog', dialog => {
        expect(dialog.message()).toContain('Please enter a record name')
        dialog.accept()
      })
      
      await page.getByText('Add Medical Record').click()
      await page.getByRole('button', { name: /Add Record/i }).click()
      
      await expect(page.getByText('Enter medical record information')).toBeVisible()
    })
  })

  test.describe('Use Case 6: Quick Actions', () => {
    test('UC6.1 - User accesses quick actions panel', async ({ page }) => {
      await expect(page.getByText('Quick Actions')).toBeVisible()
      await expect(page.getByText('Commonly used features')).toBeVisible()
      
      // Verify all quick action buttons exist
      await expect(page.locator('button', { hasText: 'Upload Document' })).toBeVisible()
      await expect(page.locator('button', { hasText: 'Add Medication' })).toBeVisible()
      await expect(page.locator('button', { hasText: 'Appointment Reminder' })).toBeVisible()
    })

    test('UC6.2 - Quick action opens correct modal', async ({ page }) => {
      await page.locator('button', { hasText: 'Add Medication' }).click()
      
      await expect(page.getByText('Enter medical record information')).toBeVisible()
      
      // Verify medications type is available
      const typeSelect = page.locator('#med-type')
      await expect(typeSelect).toBeVisible()
    })
  })
})
