import { createClient } from '@/lib/supabase/server'

/**
 * Lightweight server action performance tracker.
 * Logs actions that take >1s to a `performance_logs` table.
 * Runs silently — no impact on response to user.
 */
export async function trackSlowAction(
  actionName: string,
  durationMs: number,
  metadata?: Record<string, unknown>
) {
  // Only log slow actions (>1000ms)
  if (durationMs < 1000) return

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fire-and-forget — don't await, don't block the response
    void supabase
      .from('performance_logs' as never)
      .insert({
        action_name: actionName,
        duration_ms: Math.round(durationMs),
        user_id: user?.id || null,
        user_email: user?.email || null,
        metadata: metadata || null,
        created_at: new Date().toISOString(),
      } as never)
  } catch {
    // Never let tracking break the app
  }
}

/**
 * Wrap a server action to automatically track its execution time.
 * Usage:
 *   export const createPJO = withPerformanceTracking('createPJO', async (data) => { ... })
 */
export function withPerformanceTracking<TArgs extends unknown[], TResult>(
  actionName: string,
  action: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    const start = performance.now()
    try {
      const result = await action(...args)
      const duration = performance.now() - start
      trackSlowAction(actionName, duration)
      return result
    } catch (error) {
      const duration = performance.now() - start
      trackSlowAction(actionName, duration, { error: true })
      throw error
    }
  }
}
