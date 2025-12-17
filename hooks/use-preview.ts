'use client'

import { usePreviewContext, PreviewContextType } from '@/contexts/preview-context'

/**
 * Hook to access preview context
 * Must be used within a PreviewProvider
 */
export function usePreview(): PreviewContextType {
  return usePreviewContext()
}
