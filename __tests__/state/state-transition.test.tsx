import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '@/app/page'
import { supabase } from '@/lib/supabase'

describe('Home Component - State Transition Tests', () => {
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

  describe('Document Form Modal State Transitions', () => {
    test('should transition from closed to open state', async () => {
      render(<Home />)
      
      // Initial state: modal is closed
      expect(screen.queryByText('Add New Document')).not.toBeInTheDocument()
      
      // Trigger transition: click Add Document button
      const addButton = screen.getAllByText('Add Document')[0]
      fireEvent.click(addButton)
      
      // Final state: modal is open
      await waitFor(() => {
        expect(screen.getByText('Add New Document')).toBeInTheDocument()
      })
    })

    test('should transition from open to closed state via Cancel', async () => {
      render(<Home />)
      
      // Open modal
      const addButton = screen.getAllByText('Add Document')[0]
      fireEvent.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('Add New Document')).toBeInTheDocument()
      })
      
      // Trigger transition: click Cancel
      const cancelButtons = screen.getAllByText('Cancel')
      fireEvent.click(cancelButtons[0])
      
      // Final state: modal is closed
      await waitFor(() => {
        expect(screen.queryByText('Add New Document')).not.toBeInTheDocument()
      })
    })

    test('should transition from open to closed state via X button', async () => {
      render(<Home />)
      
      // Open modal
      const addButton = screen.getAllByText('Add Document')[0]
      fireEvent.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('Add New Document')).toBeInTheDocument()
      })
      
      // Find and click X button
      const closeButtons = screen.getAllByRole('button')
      const xButton = closeButtons.find(btn => {
        const svg = btn.querySelector('svg')
        return svg?.classList.contains('lucide-x')
      })
      
      if (xButton) {
        fireEvent.click(xButton)
        
        await waitFor(() => {
          expect(screen.queryByText('Add New Document')).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('Medical Record Form Modal State Transitions', () => {
    test('should transition from closed to open state', async () => {
      render(<Home />)
      
      // Initial state: modal is closed
      expect(screen.queryByText(/Enter medical record information/i)).not.toBeInTheDocument()
      
      // Trigger transition
      const addButton = screen.getByText('Add Medical Record')
      fireEvent.click(addButton)
      
      // Final state: modal is open
      await waitFor(() => {
        expect(screen.getByText(/Enter medical record information/i)).toBeInTheDocument()
      })
    })

    test('should transition from open to closed state via Cancel', async () => {
      render(<Home />)
      
      const addButton = screen.getByText('Add Medical Record')
      fireEvent.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Enter medical record information/i)).toBeInTheDocument()
      })
      
      const cancelButtons = screen.getAllByText('Cancel')
      const medicalCancelButton = cancelButtons[cancelButtons.length - 1]
      fireEvent.click(medicalCancelButton)
      
      await waitFor(() => {
        expect(screen.queryByText(/Enter medical record information/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Emergency Summary Modal State Transitions', () => {
    test('should transition from closed to open state', async () => {
      render(<Home />)
      
      expect(screen.queryByText('Emergency Information Summary')).not.toBeInTheDocument()
      
      const emergencyButton = screen.getAllByText('Emergency Summary')[0]
      fireEvent.click(emergencyButton)
      
      await waitFor(() => {
        expect(screen.getByText('Emergency Information Summary')).toBeInTheDocument()
      })
    })

    test('should transition from open to closed state', async () => {
      render(<Home />)
      
      const emergencyButton = screen.getAllByText('Emergency Summary')[0]
      fireEvent.click(emergencyButton)
      
      await waitFor(() => {
        expect(screen.getByText('Emergency Information Summary')).toBeInTheDocument()
      })
      
      const closeButton = screen.getByText('Close')
      fireEvent.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Emergency Information Summary')).not.toBeInTheDocument()
      })
    })
  })

  describe('File Upload State Transitions', () => {
    test('should update state when file is selected', async () => {
      render(<Home />)
      
      const addButton = screen.getAllByText('Add Document')[0]
      fireEvent.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('Add New Document')).toBeInTheDocument()
      })
      
      const fileInput = screen.getByLabelText(/Upload File/i)
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(fileInput, 'files', {
        value: [file],
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(screen.getByText('Selected: test.pdf')).toBeInTheDocument()
      })
    })

    test('should auto-populate document name when file is selected', async () => {
      render(<Home />)
      
      const addButton = screen.getAllByText('Add Document')[0]
      fireEvent.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('Add New Document')).toBeInTheDocument()
      })
      
      const fileInput = screen.getByLabelText(/Upload File/i) as HTMLInputElement
      const nameInput = screen.getByLabelText('Document Name') as HTMLInputElement
      
      // Name should be empty initially
      expect(nameInput.value).toBe('')
      
      // Select a file
      const file = new File(['test content'], 'medical-report.pdf', { type: 'application/pdf' })
      Object.defineProperty(fileInput, 'files', {
        value: [file],
      })
      
      fireEvent.change(fileInput)
      
      // Name should be auto-populated with filename
      await waitFor(() => {
        expect(nameInput.value).toBe('medical-report.pdf')
      })
    })
  })

  describe('Appointment List State Transitions', () => {
    test('should toggle appointment list visibility', async () => {
      render(<Home />)
      
      // Initial state: list is hidden
      expect(screen.queryByText(/Manage your appointments/i)).not.toBeInTheDocument()
      
      // Find and click the Appointment Reminder button
      const appointmentButton = screen.getByText('Appointment Reminder')
      fireEvent.click(appointmentButton)
      
      // State should change: list is visible
      await waitFor(() => {
        expect(screen.getByText(/Manage your appointments/i)).toBeInTheDocument()
      })
    })
  })

  describe('Appointment Modal State Transitions', () => {
    test('should toggle appointment list visibility and show empty state', async () => {
      render(<Home />)
      
      // Open appointment list
      const appointmentButton = screen.getByText('Appointment Reminder')
      fireEvent.click(appointmentButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Manage your appointments/i)).toBeInTheDocument()
      })
      
      // Should show empty state messages
      expect(screen.getByText(/No upcoming appointments/i)).toBeInTheDocument()
      expect(screen.getByText(/No past appointments/i)).toBeInTheDocument()
    })
  })

  describe('Data Loading State Transitions', () => {
    test('should display empty state initially', () => {
      render(<Home />)
      
      // Check for empty state indicators
      expect(screen.getAllByText(/No documents yet/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/No records yet/i).length).toBeGreaterThan(0)
    })

    test('should display documents after data is loaded', async () => {
      const mockDocuments = [
        {
          id: '1',
          name: 'Insurance Card',
          category: 'medical',
          date: '2024-01-01',
        },
        {
          id: '2',
          name: 'ID Card',
          category: 'identification',
          date: '2024-01-02',
        }
      ]

      ;(supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'documents') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockDocuments, error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }
      })

      render(<Home />)
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Insurance Card')).toBeInTheDocument()
        expect(screen.getByText('ID Card')).toBeInTheDocument()
      })
    })
  })
})
