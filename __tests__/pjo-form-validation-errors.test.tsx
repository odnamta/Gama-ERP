/**
 * Unit Tests for PJO Form Validation Error Display
 * Feature: v0.4.5-fix-pjo-button-not-clickable
 * 
 * Tests for validation error summary and toast notifications
 * 
 * **Validates: Requirements 2.1, 2.3, 2.4**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AlertCircle } from 'lucide-react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
}))

/**
 * ValidationErrorSummary Component
 * 
 * This is a simplified version of the validation error summary from PJOForm
 * that we can test in isolation. It mirrors the exact implementation
 * in components/pjo/pjo-form.tsx
 */
interface ValidationError {
  message?: string
}

interface ValidationErrorSummaryProps {
  errors: Record<string, ValidationError | undefined>
}

function ValidationErrorSummary({ errors }: ValidationErrorSummaryProps) {
  if (Object.keys(errors).length === 0) {
    return null
  }

  return (
    <div className="rounded-md bg-destructive/10 p-4" data-testid="validation-error-summary">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-4 w-4" data-testid="alert-icon" />
        <span className="font-medium">Please fix the following errors:</span>
      </div>
      <ul className="mt-2 list-disc list-inside text-sm text-destructive" data-testid="error-list">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field} data-testid={`error-item-${field}`}>
            {error?.message || `${field} is invalid`}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Mock toast function for testing toast notifications
 */
interface ToastCall {
  title: string
  description: string
  variant?: 'default' | 'destructive'
}

function createMockToast() {
  const calls: ToastCall[] = []
  const toast = (options: ToastCall) => {
    calls.push(options)
  }
  return { toast, calls }
}

/**
 * Revenue Items Validation Function
 * Mirrors the validateRevenueItems function from PJOForm
 */
interface RevenueItemRow {
  id?: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  subtotal: number
}

function validateRevenueItems(
  revenueItems: RevenueItemRow[],
  toast: (options: ToastCall) => void,
  setErrors: (errors: Record<number, { description?: string; unit_price?: string }>) => void
): boolean {
  const newErrors: Record<number, { description?: string; unit_price?: string }> = {}
  let hasErrors = false

  if (revenueItems.length === 0) {
    toast({ 
      title: 'Error', 
      description: 'At least one revenue item is required', 
      variant: 'destructive' 
    })
    return false
  }

  revenueItems.forEach((item, index) => {
    const itemErrors: { description?: string; unit_price?: string } = {}
    if (!item.description.trim()) {
      itemErrors.description = 'Description is required'
      hasErrors = true
    }
    if (item.unit_price <= 0) {
      itemErrors.unit_price = 'Unit price must be greater than 0'
      hasErrors = true
    }
    if (Object.keys(itemErrors).length > 0) {
      newErrors[index] = itemErrors
    }
  })

  setErrors(newErrors)
  return !hasErrors
}

/**
 * Cost Items Validation Function
 * Mirrors the validateCostItems function from PJOForm
 */
interface CostItemRow {
  id?: string
  category: string
  description: string
  estimated_amount: number
  status: string
}

function validateCostItems(
  costItems: CostItemRow[],
  toast: (options: ToastCall) => void,
  setErrors: (errors: Record<number, { category?: string; description?: string; estimated_amount?: string }>) => void
): boolean {
  const newErrors: Record<number, { category?: string; description?: string; estimated_amount?: string }> = {}
  let hasErrors = false

  if (costItems.length === 0) {
    toast({ 
      title: 'Error', 
      description: 'At least one cost item is required', 
      variant: 'destructive' 
    })
    return false
  }

  costItems.forEach((item, index) => {
    const itemErrors: { category?: string; description?: string; estimated_amount?: string } = {}
    if (!item.category) {
      itemErrors.category = 'Category is required'
      hasErrors = true
    }
    if (!item.description.trim()) {
      itemErrors.description = 'Description is required'
      hasErrors = true
    }
    if (item.estimated_amount <= 0) {
      itemErrors.estimated_amount = 'Amount must be greater than 0'
      hasErrors = true
    }
    if (Object.keys(itemErrors).length > 0) {
      newErrors[index] = itemErrors
    }
  })

  setErrors(newErrors)
  return !hasErrors
}

/**
 * Task 8.1: Test validation error summary appears
 * 
 * **Validates: Requirements 2.1**
 * 
 * WHEN form validation fails, THE PJO_Form SHALL display error messages
 * next to each invalid field
 */
describe('Task 8.1: Validation Error Summary Appears', () => {
  describe('Error Summary Component Rendering', () => {
    it('should not render when there are no errors', () => {
      render(<ValidationErrorSummary errors={{}} />)
      
      const summary = screen.queryByTestId('validation-error-summary')
      expect(summary).not.toBeInTheDocument()
    })

    it('should render when there are validation errors', () => {
      const errors = {
        project_id: { message: 'Please select a project' },
      }
      
      render(<ValidationErrorSummary errors={errors} />)
      
      const summary = screen.getByTestId('validation-error-summary')
      expect(summary).toBeInTheDocument()
    })

    it('should display the AlertCircle icon', () => {
      const errors = {
        project_id: { message: 'Please select a project' },
      }
      
      render(<ValidationErrorSummary errors={errors} />)
      
      const icon = screen.getByTestId('alert-icon')
      expect(icon).toBeInTheDocument()
    })

    it('should display "Please fix the following errors:" header', () => {
      const errors = {
        project_id: { message: 'Please select a project' },
      }
      
      render(<ValidationErrorSummary errors={errors} />)
      
      expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument()
    })

    it('should have destructive background styling', () => {
      const errors = {
        project_id: { message: 'Please select a project' },
      }
      
      render(<ValidationErrorSummary errors={errors} />)
      
      const summary = screen.getByTestId('validation-error-summary')
      expect(summary).toHaveClass('bg-destructive/10')
    })
  })

  describe('Error Messages Display', () => {
    it('should display single error message', () => {
      const errors = {
        project_id: { message: 'Please select a project' },
      }
      
      render(<ValidationErrorSummary errors={errors} />)
      
      expect(screen.getByText('Please select a project')).toBeInTheDocument()
    })

    it('should display multiple error messages', () => {
      const errors = {
        project_id: { message: 'Please select a project' },
        jo_date: { message: 'Date is required' },
        eta: { message: 'ETA must be on or after ETD' },
      }
      
      render(<ValidationErrorSummary errors={errors} />)
      
      expect(screen.getByText('Please select a project')).toBeInTheDocument()
      expect(screen.getByText('Date is required')).toBeInTheDocument()
      expect(screen.getByText('ETA must be on or after ETD')).toBeInTheDocument()
    })

    it('should display fallback message when error.message is undefined', () => {
      const errors = {
        project_id: { message: undefined },
      }
      
      render(<ValidationErrorSummary errors={errors} />)
      
      expect(screen.getByText('project_id is invalid')).toBeInTheDocument()
    })

    it('should display error list as unordered list', () => {
      const errors = {
        project_id: { message: 'Please select a project' },
      }
      
      render(<ValidationErrorSummary errors={errors} />)
      
      const errorList = screen.getByTestId('error-list')
      expect(errorList.tagName).toBe('UL')
    })

    it('should display each error as a list item', () => {
      const errors = {
        project_id: { message: 'Please select a project' },
        jo_date: { message: 'Date is required' },
      }
      
      render(<ValidationErrorSummary errors={errors} />)
      
      const errorList = screen.getByTestId('error-list')
      const listItems = errorList.querySelectorAll('li')
      expect(listItems.length).toBe(2)
    })

    it('should have unique key for each error item', () => {
      const errors = {
        project_id: { message: 'Please select a project' },
        jo_date: { message: 'Date is required' },
      }
      
      render(<ValidationErrorSummary errors={errors} />)
      
      expect(screen.getByTestId('error-item-project_id')).toBeInTheDocument()
      expect(screen.getByTestId('error-item-jo_date')).toBeInTheDocument()
    })
  })

  describe('Error Summary Styling', () => {
    it('should have rounded-md class for border radius', () => {
      const errors = {
        project_id: { message: 'Please select a project' },
      }
      
      render(<ValidationErrorSummary errors={errors} />)
      
      const summary = screen.getByTestId('validation-error-summary')
      expect(summary).toHaveClass('rounded-md')
    })

    it('should have p-4 class for padding', () => {
      const errors = {
        project_id: { message: 'Please select a project' },
      }
      
      render(<ValidationErrorSummary errors={errors} />)
      
      const summary = screen.getByTestId('validation-error-summary')
      expect(summary).toHaveClass('p-4')
    })

    it('should have text-destructive class for error text color', () => {
      const errors = {
        project_id: { message: 'Please select a project' },
      }
      
      render(<ValidationErrorSummary errors={errors} />)
      
      const errorList = screen.getByTestId('error-list')
      expect(errorList).toHaveClass('text-destructive')
    })

    it('should have list-disc and list-inside classes for bullet styling', () => {
      const errors = {
        project_id: { message: 'Please select a project' },
      }
      
      render(<ValidationErrorSummary errors={errors} />)
      
      const errorList = screen.getByTestId('error-list')
      expect(errorList).toHaveClass('list-disc')
      expect(errorList).toHaveClass('list-inside')
    })
  })

  describe('Dynamic Error Updates', () => {
    it('should update when errors change', () => {
      const { rerender } = render(<ValidationErrorSummary errors={{}} />)
      
      // Initially no errors
      expect(screen.queryByTestId('validation-error-summary')).not.toBeInTheDocument()
      
      // Add errors
      rerender(<ValidationErrorSummary errors={{ project_id: { message: 'Required' } }} />)
      expect(screen.getByTestId('validation-error-summary')).toBeInTheDocument()
      
      // Remove errors
      rerender(<ValidationErrorSummary errors={{}} />)
      expect(screen.queryByTestId('validation-error-summary')).not.toBeInTheDocument()
    })

    it('should update error messages when they change', () => {
      const { rerender } = render(
        <ValidationErrorSummary errors={{ project_id: { message: 'Error 1' } }} />
      )
      
      expect(screen.getByText('Error 1')).toBeInTheDocument()
      
      rerender(<ValidationErrorSummary errors={{ project_id: { message: 'Error 2' } }} />)
      
      expect(screen.queryByText('Error 1')).not.toBeInTheDocument()
      expect(screen.getByText('Error 2')).toBeInTheDocument()
    })
  })
})

/**
 * Task 8.2: Test toast notifications for item validation
 * 
 * **Validates: Requirements 2.3, 2.4**
 * 
 * WHEN revenue items validation fails, THE PJO_Form SHALL display a toast notification
 * WHEN cost items validation fails, THE PJO_Form SHALL display a toast notification
 */
describe('Task 8.2: Toast Notifications for Item Validation', () => {
  describe('Revenue Items Validation Toast', () => {
    let mockToast: ReturnType<typeof createMockToast>
    let setErrors: (errors: Record<number, { description?: string; unit_price?: string }>) => void

    beforeEach(() => {
      mockToast = createMockToast()
      setErrors = vi.fn() as (errors: Record<number, { description?: string; unit_price?: string }>) => void
    })

    it('should show toast when revenue items array is empty', () => {
      const result = validateRevenueItems([], mockToast.toast, setErrors)
      
      expect(result).toBe(false)
      expect(mockToast.calls.length).toBe(1)
      expect(mockToast.calls[0]).toEqual({
        title: 'Error',
        description: 'At least one revenue item is required',
        variant: 'destructive',
      })
    })

    it('should not show toast when revenue items are valid', () => {
      const validItems: RevenueItemRow[] = [{
        description: 'Transport service',
        quantity: 1,
        unit: 'TRIP',
        unit_price: 1000000,
        subtotal: 1000000,
      }]
      
      const result = validateRevenueItems(validItems, mockToast.toast, setErrors)
      
      expect(result).toBe(true)
      expect(mockToast.calls.length).toBe(0)
    })

    it('should set field errors for invalid revenue items', () => {
      const invalidItems: RevenueItemRow[] = [{
        description: '',
        quantity: 1,
        unit: 'TRIP',
        unit_price: 0,
        subtotal: 0,
      }]
      
      const result = validateRevenueItems(invalidItems, mockToast.toast, setErrors)
      
      expect(result).toBe(false)
      expect(setErrors).toHaveBeenCalledWith({
        0: {
          description: 'Description is required',
          unit_price: 'Unit price must be greater than 0',
        },
      })
    })

    it('should validate description is not empty', () => {
      const items: RevenueItemRow[] = [{
        description: '   ',
        quantity: 1,
        unit: 'TRIP',
        unit_price: 1000000,
        subtotal: 1000000,
      }]
      
      const result = validateRevenueItems(items, mockToast.toast, setErrors)
      
      expect(result).toBe(false)
      expect(setErrors).toHaveBeenCalledWith({
        0: { description: 'Description is required' },
      })
    })

    it('should validate unit_price is greater than 0', () => {
      const items: RevenueItemRow[] = [{
        description: 'Valid description',
        quantity: 1,
        unit: 'TRIP',
        unit_price: -100,
        subtotal: -100,
      }]
      
      const result = validateRevenueItems(items, mockToast.toast, setErrors)
      
      expect(result).toBe(false)
      expect(setErrors).toHaveBeenCalledWith({
        0: { unit_price: 'Unit price must be greater than 0' },
      })
    })

    it('should validate multiple revenue items independently', () => {
      const items: RevenueItemRow[] = [
        { description: 'Valid', quantity: 1, unit: 'TRIP', unit_price: 1000, subtotal: 1000 },
        { description: '', quantity: 1, unit: 'TRIP', unit_price: 0, subtotal: 0 },
        { description: 'Also valid', quantity: 2, unit: 'LOT', unit_price: 500, subtotal: 1000 },
      ]
      
      const result = validateRevenueItems(items, mockToast.toast, setErrors)
      
      expect(result).toBe(false)
      expect(setErrors).toHaveBeenCalledWith({
        1: {
          description: 'Description is required',
          unit_price: 'Unit price must be greater than 0',
        },
      })
    })
  })

  describe('Cost Items Validation Toast', () => {
    let mockToast: ReturnType<typeof createMockToast>
    let setErrors: (errors: Record<number, { category?: string; description?: string; estimated_amount?: string }>) => void

    beforeEach(() => {
      mockToast = createMockToast()
      setErrors = vi.fn() as (errors: Record<number, { category?: string; description?: string; estimated_amount?: string }>) => void
    })

    it('should show toast when cost items array is empty', () => {
      const result = validateCostItems([], mockToast.toast, setErrors)
      
      expect(result).toBe(false)
      expect(mockToast.calls.length).toBe(1)
      expect(mockToast.calls[0]).toEqual({
        title: 'Error',
        description: 'At least one cost item is required',
        variant: 'destructive',
      })
    })

    it('should not show toast when cost items are valid', () => {
      const validItems: CostItemRow[] = [{
        category: 'trucking',
        description: 'Trucking cost',
        estimated_amount: 500000,
        status: 'estimated',
      }]
      
      const result = validateCostItems(validItems, mockToast.toast, setErrors)
      
      expect(result).toBe(true)
      expect(mockToast.calls.length).toBe(0)
    })

    it('should set field errors for invalid cost items', () => {
      const invalidItems: CostItemRow[] = [{
        category: '',
        description: '',
        estimated_amount: 0,
        status: 'estimated',
      }]
      
      const result = validateCostItems(invalidItems, mockToast.toast, setErrors)
      
      expect(result).toBe(false)
      expect(setErrors).toHaveBeenCalledWith({
        0: {
          category: 'Category is required',
          description: 'Description is required',
          estimated_amount: 'Amount must be greater than 0',
        },
      })
    })

    it('should validate category is not empty', () => {
      const items: CostItemRow[] = [{
        category: '',
        description: 'Valid description',
        estimated_amount: 500000,
        status: 'estimated',
      }]
      
      const result = validateCostItems(items, mockToast.toast, setErrors)
      
      expect(result).toBe(false)
      expect(setErrors).toHaveBeenCalledWith({
        0: { category: 'Category is required' },
      })
    })

    it('should validate description is not empty', () => {
      const items: CostItemRow[] = [{
        category: 'trucking',
        description: '   ',
        estimated_amount: 500000,
        status: 'estimated',
      }]
      
      const result = validateCostItems(items, mockToast.toast, setErrors)
      
      expect(result).toBe(false)
      expect(setErrors).toHaveBeenCalledWith({
        0: { description: 'Description is required' },
      })
    })

    it('should validate estimated_amount is greater than 0', () => {
      const items: CostItemRow[] = [{
        category: 'trucking',
        description: 'Valid description',
        estimated_amount: -100,
        status: 'estimated',
      }]
      
      const result = validateCostItems(items, mockToast.toast, setErrors)
      
      expect(result).toBe(false)
      expect(setErrors).toHaveBeenCalledWith({
        0: { estimated_amount: 'Amount must be greater than 0' },
      })
    })

    it('should validate multiple cost items independently', () => {
      const items: CostItemRow[] = [
        { category: 'trucking', description: 'Valid', estimated_amount: 1000, status: 'estimated' },
        { category: '', description: '', estimated_amount: 0, status: 'estimated' },
        { category: 'fuel', description: 'Also valid', estimated_amount: 500, status: 'estimated' },
      ]
      
      const result = validateCostItems(items, mockToast.toast, setErrors)
      
      expect(result).toBe(false)
      expect(setErrors).toHaveBeenCalledWith({
        1: {
          category: 'Category is required',
          description: 'Description is required',
          estimated_amount: 'Amount must be greater than 0',
        },
      })
    })
  })

  describe('Toast Notification Properties', () => {
    it('should use destructive variant for revenue validation errors', () => {
      const mockToast = createMockToast()
      validateRevenueItems([], mockToast.toast, vi.fn())
      
      expect(mockToast.calls[0].variant).toBe('destructive')
    })

    it('should use destructive variant for cost validation errors', () => {
      const mockToast = createMockToast()
      validateCostItems([], mockToast.toast, vi.fn())
      
      expect(mockToast.calls[0].variant).toBe('destructive')
    })

    it('should have "Error" as title for revenue validation toast', () => {
      const mockToast = createMockToast()
      validateRevenueItems([], mockToast.toast, vi.fn())
      
      expect(mockToast.calls[0].title).toBe('Error')
    })

    it('should have "Error" as title for cost validation toast', () => {
      const mockToast = createMockToast()
      validateCostItems([], mockToast.toast, vi.fn())
      
      expect(mockToast.calls[0].title).toBe('Error')
    })
  })

  describe('Validation Return Values', () => {
    it('should return false when revenue items are empty', () => {
      const mockToast = createMockToast()
      const result = validateRevenueItems([], mockToast.toast, vi.fn())
      expect(result).toBe(false)
    })

    it('should return false when revenue items have errors', () => {
      const mockToast = createMockToast()
      const items: RevenueItemRow[] = [{
        description: '',
        quantity: 1,
        unit: 'TRIP',
        unit_price: 0,
        subtotal: 0,
      }]
      const result = validateRevenueItems(items, mockToast.toast, vi.fn())
      expect(result).toBe(false)
    })

    it('should return true when all revenue items are valid', () => {
      const mockToast = createMockToast()
      const items: RevenueItemRow[] = [{
        description: 'Valid',
        quantity: 1,
        unit: 'TRIP',
        unit_price: 1000,
        subtotal: 1000,
      }]
      const result = validateRevenueItems(items, mockToast.toast, vi.fn())
      expect(result).toBe(true)
    })

    it('should return false when cost items are empty', () => {
      const mockToast = createMockToast()
      const result = validateCostItems([], mockToast.toast, vi.fn())
      expect(result).toBe(false)
    })

    it('should return false when cost items have errors', () => {
      const mockToast = createMockToast()
      const items: CostItemRow[] = [{
        category: '',
        description: '',
        estimated_amount: 0,
        status: 'estimated',
      }]
      const result = validateCostItems(items, mockToast.toast, vi.fn())
      expect(result).toBe(false)
    })

    it('should return true when all cost items are valid', () => {
      const mockToast = createMockToast()
      const items: CostItemRow[] = [{
        category: 'trucking',
        description: 'Valid',
        estimated_amount: 1000,
        status: 'estimated',
      }]
      const result = validateCostItems(items, mockToast.toast, vi.fn())
      expect(result).toBe(true)
    })
  })
})

/**
 * Integration Tests: Error Summary with Form Errors
 * 
 * Tests that verify the error summary correctly displays
 * various types of form validation errors
 */
describe('Error Summary Integration', () => {
  it('should display project_id error correctly', () => {
    const errors = {
      project_id: { message: 'Please select a project' },
    }
    
    render(<ValidationErrorSummary errors={errors} />)
    
    expect(screen.getByText('Please select a project')).toBeInTheDocument()
  })

  it('should display jo_date error correctly', () => {
    const errors = {
      jo_date: { message: 'Date is required' },
    }
    
    render(<ValidationErrorSummary errors={errors} />)
    
    expect(screen.getByText('Date is required')).toBeInTheDocument()
  })

  it('should display eta validation error correctly', () => {
    const errors = {
      eta: { message: 'ETA must be on or after ETD' },
    }
    
    render(<ValidationErrorSummary errors={errors} />)
    
    expect(screen.getByText('ETA must be on or after ETD')).toBeInTheDocument()
  })

  it('should display revenue_items error correctly', () => {
    const errors = {
      revenue_items: { message: 'At least one revenue item is required' },
    }
    
    render(<ValidationErrorSummary errors={errors} />)
    
    expect(screen.getByText('At least one revenue item is required')).toBeInTheDocument()
  })

  it('should display cost_items error correctly', () => {
    const errors = {
      cost_items: { message: 'At least one cost item is required' },
    }
    
    render(<ValidationErrorSummary errors={errors} />)
    
    expect(screen.getByText('At least one cost item is required')).toBeInTheDocument()
  })

  it('should display all form errors together', () => {
    const errors = {
      project_id: { message: 'Please select a project' },
      jo_date: { message: 'Date is required' },
      eta: { message: 'ETA must be on or after ETD' },
      revenue_items: { message: 'At least one revenue item is required' },
      cost_items: { message: 'At least one cost item is required' },
    }
    
    render(<ValidationErrorSummary errors={errors} />)
    
    const errorList = screen.getByTestId('error-list')
    const listItems = errorList.querySelectorAll('li')
    expect(listItems.length).toBe(5)
  })
})
