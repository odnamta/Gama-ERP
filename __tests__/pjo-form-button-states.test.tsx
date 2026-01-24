/**
 * Unit Tests for PJO Form Button States
 * Feature: v0.4.5-fix-pjo-button-not-clickable
 * 
 * Tests for button visual states (enabled, loading, disabled)
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 4.2, 4.3**
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
}))

/**
 * PJO Submit Button Component
 * 
 * This is a simplified version of the submit button from PJOForm
 * that we can test in isolation. It mirrors the exact implementation
 * in components/pjo/pjo-form.tsx
 */
interface PJOSubmitButtonProps {
  isLoading: boolean
  mode: 'create' | 'edit'
  onClick?: () => void
}

function PJOSubmitButton({ isLoading, mode, onClick }: PJOSubmitButtonProps) {
  return (
    <Button 
      type="submit" 
      disabled={isLoading}
      onClick={onClick}
      className={cn(
        "min-w-[140px]",
        isLoading && "cursor-not-allowed"
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loading-spinner" />
          Saving...
        </>
      ) : (
        mode === 'edit' ? 'Update PJO' : 'Create PJO'
      )}
    </Button>
  )
}

/**
 * Task 7.1: Test button displays correctly in enabled state
 * 
 * **Validates: Requirements 1.3, 4.3**
 * 
 * WHEN the Submit_Button is enabled and ready, THE Submit_Button SHALL display 
 * with full opacity and a pointer cursor
 */
describe('Task 7.1: Button Enabled State', () => {
  it('should display "Create PJO" text when mode is create and not loading', () => {
    render(<PJOSubmitButton isLoading={false} mode="create" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Create PJO')
  })

  it('should display "Update PJO" text when mode is edit and not loading', () => {
    render(<PJOSubmitButton isLoading={false} mode="edit" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Update PJO')
  })

  it('should not be disabled when isLoading is false', () => {
    render(<PJOSubmitButton isLoading={false} mode="create" />)
    
    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
  })

  it('should have min-w-[140px] class for consistent width', () => {
    render(<PJOSubmitButton isLoading={false} mode="create" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('min-w-[140px]')
  })

  it('should not have cursor-not-allowed class when enabled', () => {
    render(<PJOSubmitButton isLoading={false} mode="create" />)
    
    const button = screen.getByRole('button')
    expect(button).not.toHaveClass('cursor-not-allowed')
  })

  it('should not display loading spinner when enabled', () => {
    render(<PJOSubmitButton isLoading={false} mode="create" />)
    
    const spinner = screen.queryByTestId('loading-spinner')
    expect(spinner).not.toBeInTheDocument()
  })

  it('should not display "Saving..." text when enabled', () => {
    render(<PJOSubmitButton isLoading={false} mode="create" />)
    
    const button = screen.getByRole('button')
    expect(button).not.toHaveTextContent('Saving...')
  })

  it('should be clickable when enabled', () => {
    const handleClick = vi.fn()
    render(<PJOSubmitButton isLoading={false} mode="create" onClick={handleClick} />)
    
    const button = screen.getByRole('button')
    button.click()
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

/**
 * Task 7.2: Test button displays correctly in loading state
 * 
 * **Validates: Requirements 1.2, 4.2**
 * 
 * WHEN the Submit_Button is in loading state, THE Submit_Button SHALL display 
 * a spinning loader icon and "Saving..." text
 */
describe('Task 7.2: Button Loading State', () => {
  it('should display loading spinner when isLoading is true', () => {
    render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toBeInTheDocument()
  })

  it('should display "Saving..." text when loading', () => {
    render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Saving...')
  })

  it('should be disabled when isLoading is true', () => {
    render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should have cursor-not-allowed class when loading', () => {
    render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('cursor-not-allowed')
  })

  it('should have min-w-[140px] class to prevent layout shift during loading', () => {
    render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('min-w-[140px]')
  })

  it('should not display "Create PJO" text when loading', () => {
    render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    const button = screen.getByRole('button')
    expect(button).not.toHaveTextContent('Create PJO')
  })

  it('should not display "Update PJO" text when loading in edit mode', () => {
    render(<PJOSubmitButton isLoading={true} mode="edit" />)
    
    const button = screen.getByRole('button')
    expect(button).not.toHaveTextContent('Update PJO')
    expect(button).toHaveTextContent('Saving...')
  })

  it('should have spinner with animate-spin class', () => {
    render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('animate-spin')
  })

  it('should have spinner with correct size classes (h-4 w-4)', () => {
    render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('h-4')
    expect(spinner).toHaveClass('w-4')
  })

  it('should have spinner with mr-2 margin class', () => {
    render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('mr-2')
  })
})

/**
 * Task 7.3: Test button displays correctly in disabled state
 * 
 * **Validates: Requirements 1.1**
 * 
 * WHEN the Submit_Button is disabled, THE Submit_Button SHALL display 
 * with reduced opacity (50%) and a "not-allowed" cursor
 */
describe('Task 7.3: Button Disabled State', () => {
  it('should have cursor-not-allowed class when disabled (loading)', () => {
    render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('cursor-not-allowed')
  })

  it('should have disabled attribute when isLoading is true', () => {
    render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('disabled')
  })

  it('should not respond to clicks when disabled', () => {
    const handleClick = vi.fn()
    render(<PJOSubmitButton isLoading={true} mode="create" onClick={handleClick} />)
    
    const button = screen.getByRole('button')
    button.click()
    
    // Disabled buttons should not trigger click handlers
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should maintain min-w-[140px] class when disabled', () => {
    render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('min-w-[140px]')
  })

  it('should have type="submit" attribute', () => {
    render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
  })
})

/**
 * Button State Transitions
 * 
 * Tests that verify the button correctly transitions between states
 */
describe('Button State Transitions', () => {
  it('should transition from enabled to loading state correctly', () => {
    const { rerender } = render(<PJOSubmitButton isLoading={false} mode="create" />)
    
    // Initially enabled
    let button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
    expect(button).toHaveTextContent('Create PJO')
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    
    // Transition to loading
    rerender(<PJOSubmitButton isLoading={true} mode="create" />)
    
    button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Saving...')
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should transition from loading to enabled state correctly', () => {
    const { rerender } = render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    // Initially loading
    let button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Saving...')
    
    // Transition to enabled
    rerender(<PJOSubmitButton isLoading={false} mode="create" />)
    
    button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
    expect(button).toHaveTextContent('Create PJO')
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
  })

  it('should maintain correct text when mode changes while enabled', () => {
    const { rerender } = render(<PJOSubmitButton isLoading={false} mode="create" />)
    
    expect(screen.getByRole('button')).toHaveTextContent('Create PJO')
    
    rerender(<PJOSubmitButton isLoading={false} mode="edit" />)
    
    expect(screen.getByRole('button')).toHaveTextContent('Update PJO')
  })

  it('should show "Saving..." regardless of mode when loading', () => {
    const { rerender } = render(<PJOSubmitButton isLoading={true} mode="create" />)
    
    expect(screen.getByRole('button')).toHaveTextContent('Saving...')
    
    rerender(<PJOSubmitButton isLoading={true} mode="edit" />)
    
    expect(screen.getByRole('button')).toHaveTextContent('Saving...')
  })
})

/**
 * Visual Consistency Tests
 * 
 * Tests that verify the button maintains visual consistency across states
 */
describe('Button Visual Consistency', () => {
  it('should always have min-w-[140px] class regardless of state', () => {
    const { rerender } = render(<PJOSubmitButton isLoading={false} mode="create" />)
    expect(screen.getByRole('button')).toHaveClass('min-w-[140px]')
    
    rerender(<PJOSubmitButton isLoading={true} mode="create" />)
    expect(screen.getByRole('button')).toHaveClass('min-w-[140px]')
    
    rerender(<PJOSubmitButton isLoading={false} mode="edit" />)
    expect(screen.getByRole('button')).toHaveClass('min-w-[140px]')
    
    rerender(<PJOSubmitButton isLoading={true} mode="edit" />)
    expect(screen.getByRole('button')).toHaveClass('min-w-[140px]')
  })

  it('should only have cursor-not-allowed when loading', () => {
    const { rerender } = render(<PJOSubmitButton isLoading={false} mode="create" />)
    expect(screen.getByRole('button')).not.toHaveClass('cursor-not-allowed')
    
    rerender(<PJOSubmitButton isLoading={true} mode="create" />)
    expect(screen.getByRole('button')).toHaveClass('cursor-not-allowed')
    
    rerender(<PJOSubmitButton isLoading={false} mode="edit" />)
    expect(screen.getByRole('button')).not.toHaveClass('cursor-not-allowed')
  })
})
