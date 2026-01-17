import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '@/app/page'
import { supabase } from '@/lib/supabase'

// Mock data
const mockDocuments = [
  {
    id: '1',
    name: 'Test Document',
    category: 'medical',
    date: '2024-01-01',
    file_url: 'https://example.com/test.pdf',
    file_name: 'test.pdf',
    file_size: 1024,
  },
]

const mockMedicalRecords = [
  {
    id: '1',
    type: 'medications',
    name: 'Aspirin',
    details: '100mg daily',
    date: '2024-01-01',
  },
]

describe('Home Component - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Setup default mock implementations
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
  })

  test('should render main heading', () => {
    render(<Home />)
    expect(screen.getByText('CareVault')).toBeInTheDocument()
  })

  test('should render Add Document button', () => {
    render(<Home />)
    const buttons = screen.getAllByText('Add Document')
    expect(buttons.length).toBeGreaterThan(0)
  })

  test('should render Add Medical Record button', () => {
    render(<Home />)
    expect(screen.getByText('Add Medical Record')).toBeInTheDocument()
  })

  test('should render Emergency Summary button', () => {
    render(<Home />)
    expect(screen.getByText('Emergency Summary')).toBeInTheDocument()
  })

  test('should open document form modal when Add Document is clicked', async () => {
    render(<Home />)
    const addButton = screen.getAllByText('Add Document')[0]
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('Add New Document')).toBeInTheDocument()
    })
  })

  test('should open medical record form modal when Add Medical Record is clicked', async () => {
    render(<Home />)
    const addButton = screen.getByText('Add Medical Record')
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('Add Medical Record')).toBeInTheDocument()
    })
  })

  test('should display document categories', () => {
    render(<Home />)
    expect(screen.getByText('Legal Documents')).toBeInTheDocument()
    expect(screen.getByText('Medical Documents')).toBeInTheDocument()
    expect(screen.getByText('Financial Documents')).toBeInTheDocument()
    expect(screen.getByText('Identification')).toBeInTheDocument()
  })

  test('should display medical record types', () => {
    render(<Home />)
    expect(screen.getByText('Doctor Information')).toBeInTheDocument()
    expect(screen.getByText('Medication List')).toBeInTheDocument()
    expect(screen.getByText('Medical Conditions')).toBeInTheDocument()
  })

  test('should close document form modal when Cancel is clicked', async () => {
    render(<Home />)
    const addButton = screen.getAllByText('Add Document')[0]
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('Add New Document')).toBeInTheDocument()
    })

    const cancelButtons = screen.getAllByText('Cancel')
    fireEvent.click(cancelButtons[0])
    
    await waitFor(() => {
      expect(screen.queryByText('Add New Document')).not.toBeInTheDocument()
    })
  })

  test('should validate document name before submission', async () => {
    // Mock alert
    global.alert = jest.fn()

    render(<Home />)
    const addButton = screen.getAllByText('Add Document')[0]
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('Add New Document')).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /Add Document/i })
    fireEvent.click(submitButton)

    expect(global.alert).toHaveBeenCalledWith('Please enter a document name')
  })
})
