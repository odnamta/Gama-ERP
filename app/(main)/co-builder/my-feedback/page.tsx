import { createClient } from '@/lib/supabase/server'
import { getMyFeedback } from '../actions'
import { getUserPointCounter } from '../scoring-actions'
import { getThreadSummaries } from '@/lib/support-thread-actions'
import { MyFeedbackClient } from './my-feedback-client'

export default async function MyFeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [feedback, pointData] = await Promise.all([
    getMyFeedback(),
    getUserPointCounter(),
  ])

  // Get unread thread counts for all feedback items
  const feedbackIds = feedback.map(f => f.id)
  const threadSummaries = await getThreadSummaries('competition_feedback', feedbackIds)
  const unreadMap: Record<string, number> = {}
  threadSummaries.forEach((summary, entityId) => {
    if (summary.unreadCount > 0) {
      unreadMap[entityId] = summary.unreadCount
    }
  })

  return (
    <MyFeedbackClient
      feedback={feedback}
      currentUserId={user?.id || ''}
      actualTotalPoints={pointData?.points ?? 0}
      unreadCounts={unreadMap}
    />
  )
}
