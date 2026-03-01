import { getFeedbackById } from '../../../actions'
import { AdminReviewClient } from './admin-review-client'
import { getUserProfile } from '@/lib/permissions-server'
import { ADMIN_ROLES } from '@/lib/permissions'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getUserProfile()
  if (!profile || !(ADMIN_ROLES as readonly string[]).includes(profile.role)) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { id } = await params
  const feedback = await getFeedbackById(id)
  if (!feedback) notFound()
  return <AdminReviewClient feedback={feedback} currentUserId={user?.id || ''} />
}
