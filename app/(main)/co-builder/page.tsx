import { getLeaderboard, getUserCompetitionStats, getRecentActivity } from './actions'
import { LeaderboardClient } from './leaderboard-client'

export default async function CoBuilderPage() {
  const [leaderboard, stats, activity] = await Promise.all([
    getLeaderboard(),
    getUserCompetitionStats(),
    getRecentActivity(),
  ])

  return (
    <LeaderboardClient
      leaderboard={leaderboard}
      stats={stats}
      activity={activity}
    />
  )
}
