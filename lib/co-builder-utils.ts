/**
 * Co-Builder competition utility functions (shared between client and server)
 */

export function calculateEffortLevel(feedback: {
  description: string
  steps_to_reproduce?: string | null
  suggestion?: string | null
  screenshot_url?: string | null
}): { level: 'quick' | 'standard' | 'detailed'; basePoints: number } {
  const descLength = feedback.description?.length || 0
  const hasScreenshot = !!feedback.screenshot_url
  const hasSteps = !!feedback.steps_to_reproduce && feedback.steps_to_reproduce.length > 20
  const hasSuggestion = !!feedback.suggestion && feedback.suggestion.length > 20

  if (descLength > 200 && (hasScreenshot || hasSuggestion)) {
    return { level: 'detailed', basePoints: 15 }
  }
  if (descLength >= 50 || hasSteps) {
    return { level: 'standard', basePoints: 8 }
  }
  return { level: 'quick', basePoints: 3 }
}
