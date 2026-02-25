/**
 * Co-Builder Server Actions
 * Barrel re-export file — split into:
 *   - submission-actions.ts (feedback submissions + reviews + upload)
 *   - scenario-actions.ts (test scenarios)
 *   - scoring-actions.ts (leaderboard + stats + points + top5 + activity)
 */

export {
  submitCompetitionFeedback,
  getAllCompetitionFeedback,
  getMyFeedback,
  getFeedbackById,
  reviewFeedback,
  uploadCompetitionScreenshot,
} from './submission-actions'

export type {
  CompetitionFeedback,
} from './submission-actions'

export {
  getTestScenarios,
  getScenarioByCode,
  completeScenario,
} from './scenario-actions'

export type {
  TestScenario,
} from './scenario-actions'

export {
  getLeaderboard,
  getUserCompetitionStats,
  getUserPointCounter,
  getUnseenPointEvents,
  markPointEventsSeen,
  submitTop5,
  getRecentActivity,
} from './scoring-actions'

export type {
  LeaderboardEntry,
  PointEvent,
  UserCompetitionStats,
} from './scoring-actions'
