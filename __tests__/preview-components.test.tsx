import { describe, it, expect, vi, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { PreviewDropdown } from '@/components/preview/preview-dropdown'
import { PreviewBanner } from '@/components/preview/preview-banner'
import { PREVIEW_ROLES, getRoleDisplayName } from '@/lib/preview-utils'
import { UserRole } from '@/types/permissions'

const ALL_ROLES: UserRole[] = ['owner', 'admin', 'manager', 'finance', 'sales', 'ops', 'viewer']

describe('Preview Components', () => {
  afterEach(() => {
    cleanup()
  })

  /**
   * Property 3: Preview banner displays correct role
   * **Feature: v0.9.7-role-preview, Property 3: Preview banner displays correct role**
   * *For any* active preview role, the preview banner SHALL be visible AND SHALL contain
   * the text "PREVIEW MODE: Viewing as [RoleName]"
   * **Validates: Requirements 2.1, 2.2**
   */
  describe('Property 3: Preview banner displays correct role', () => {
    it('should display banner with correct role name for any preview role', () => {
      ALL_ROLES.forEach((previewRole) => {
        cleanup()
        const onExit = vi.fn()
        render(<PreviewBanner previewRole={previewRole} onExit={onExit} />)

        // Banner should be visible
        const banner = screen.getByText(/PREVIEW MODE/i)
        expect(banner).toBeDefined()

        // Should contain the role display name
        const roleDisplayName = getRoleDisplayName(previewRole)
        expect(screen.getByText(new RegExp(`Viewing as ${roleDisplayName}`, 'i'))).toBeDefined()
      })
    })

    it('should include Exit Preview button', () => {
      render(<PreviewBanner previewRole="admin" onExit={vi.fn()} />)
      expect(screen.getByText(/Exit Preview/i)).toBeDefined()
    })
  })

  /**
   * Property 4: Exit preview restores owner role
   * **Feature: v0.9.7-role-preview, Property 4: Exit preview restores owner role**
   * *For any* active preview state, clicking "Exit Preview" SHALL call onExit
   * **Validates: Requirements 2.4**
   */
  describe('Property 4: Exit preview restores owner role', () => {
    it('should call onExit when Exit Preview is clicked for any preview role', () => {
      ALL_ROLES.forEach((previewRole) => {
        cleanup()
        const onExit = vi.fn()
        render(<PreviewBanner previewRole={previewRole} onExit={onExit} />)

        const exitButton = screen.getByText(/Exit Preview/i)
        fireEvent.click(exitButton)

        expect(onExit).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('PreviewDropdown', () => {
    it('should not render when canUsePreview is false', () => {
      const { container } = render(
        <PreviewDropdown
          currentRole="admin"
          onRoleSelect={vi.fn()}
          canUsePreview={false}
        />
      )
      expect(container.firstChild).toBeNull()
    })

    it('should render when canUsePreview is true', () => {
      render(
        <PreviewDropdown
          currentRole="owner"
          onRoleSelect={vi.fn()}
          canUsePreview={true}
        />
      )
      expect(screen.getByText(/Preview as:/i)).toBeDefined()
    })

    it('should show all preview roles in dropdown', () => {
      render(
        <PreviewDropdown
          currentRole="owner"
          onRoleSelect={vi.fn()}
          canUsePreview={true}
        />
      )

      // Click to open dropdown
      const trigger = screen.getByRole('combobox')
      fireEvent.click(trigger)

      // All roles should be available (use getAllByText since some may appear multiple times)
      PREVIEW_ROLES.forEach((role) => {
        const displayName = getRoleDisplayName(role)
        const elements = screen.getAllByText(new RegExp(displayName, 'i'))
        expect(elements.length).toBeGreaterThan(0)
      })
    })
  })
})
