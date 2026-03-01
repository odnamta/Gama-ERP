import { createClient } from '@/lib/supabase/server'
import { getMyFeedback } from '../actions'
import { getUserPointCounter } from '../scoring-actions'
import { MyFeedbackClient } from './my-feedback-client'

export default async function MyFeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [feedback, pointData] = await Promise.all([
    getMyFeedback(),
    getUserPointCounter(),
  ])
  return (
    <MyFeedbackClient
      feedback={feedback}
      currentUserId={user?.id || ''}
      actualTotalPoints={pointData?.points ?? 0}
    />
  )
}
