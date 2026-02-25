import { getAllCompetitionFeedback, getLeaderboard } from '../actions'
import { AdminClient } from './admin-client'
import { getUserProfile } from '@/lib/permissions-server'
import { ADMIN_ROLES } from '@/lib/permissions'
import { notFound } from 'next/navigation'

export default async function AdminPage() {
  const profile = await getUserProfile()
  if (!profile || !(ADMIN_ROLES as readonly string[]).includes(profile.role)) {
    notFound()
  }

  const [feedback, leaderboard] = await Promise.all([
    getAllCompetitionFeedback(),
    getLeaderboard(),
  ])
  return <AdminClient feedback={feedback} leaderboard={leaderboard} />
}
