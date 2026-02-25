/**
 * Standardized return type for server actions.
 * Uses discriminated union for type-safe error handling.
 *
 * Usage:
 *   async function createItem(data: Input): Promise<ActionResult<Item>> {
 *     // success: return { success: true, data: item }
 *     // error:   return { success: false, error: 'message' }
 *   }
 *
 * Consumer:
 *   const result = await createItem(data)
 *   if (result.success) { result.data } else { result.error }
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * For list/query actions that also return a count.
 */
export type PaginatedResult<T> =
  | { success: true; data: T[]; count: number }
  | { success: false; error: string }
