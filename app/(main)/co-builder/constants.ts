/**
 * Co-Builder Competition Constants
 * Single source of truth for competition dates and checks.
 */

export const COMPETITION_END = new Date('2026-03-12T23:59:59+07:00')
export const COMPETITION_START = new Date('2026-02-12T00:00:00+07:00')
export const PERFECT_ATTENDANCE_START = new Date('2026-02-23T00:00:00+07:00')

export function isCompetitionOver(): boolean {
  return new Date() > COMPETITION_END
}
