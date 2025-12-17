'use client'

import { createContext, useContext, useState, useMemo, ReactNode } from 'react'
import { UserRole, UserPermissions } from '@/types/permissions'
import {
  canUsePreviewFeature,
  getEffectiveRole,
  getEffectivePermissions,
} from '@/lib/preview-utils'

export interface PreviewContextType {
  previewRole: UserRole | null
  setPreviewRole: (role: UserRole | null) => void
  effectiveRole: UserRole
  effectivePermissions: UserPermissions
  isPreviewActive: boolean
  canUsePreview: boolean
}

const PreviewContext = createContext<PreviewContextType | null>(null)

export interface PreviewProviderProps {
  children: ReactNode
  actualRole: UserRole
  actualPermissions: UserPermissions
}

export function PreviewProvider({
  children,
  actualRole,
  actualPermissions,
}: PreviewProviderProps) {
  const [previewRole, setPreviewRoleState] = useState<UserRole | null>(null)

  const canUsePreview = useMemo(
    () => canUsePreviewFeature(actualRole),
    [actualRole]
  )

  const setPreviewRole = (role: UserRole | null) => {
    // Only allow setting preview if user can use preview feature
    if (canUsePreview) {
      setPreviewRoleState(role)
    }
  }

  const effectiveRole = useMemo(
    () => getEffectiveRole(actualRole, previewRole),
    [actualRole, previewRole]
  )

  const effectivePermissions = useMemo(
    () => getEffectivePermissions(actualRole, actualPermissions, previewRole),
    [actualRole, actualPermissions, previewRole]
  )

  const isPreviewActive = previewRole !== null && canUsePreview

  const value: PreviewContextType = {
    previewRole,
    setPreviewRole,
    effectiveRole,
    effectivePermissions,
    isPreviewActive,
    canUsePreview,
  }

  return (
    <PreviewContext.Provider value={value}>
      {children}
    </PreviewContext.Provider>
  )
}

export function usePreviewContext(): PreviewContextType {
  const context = useContext(PreviewContext)
  if (!context) {
    throw new Error('usePreviewContext must be used within a PreviewProvider')
  }
  return context
}
