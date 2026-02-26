/**
 * Sanitize user input for use in PostgREST .or() / .ilike() filters.
 * Escapes characters that have special meaning in PostgREST filter syntax.
 *
 * PostgREST uses commas to separate conditions in .or(), parentheses for
 * grouping, and periods to separate field.operator.value. Without escaping,
 * user input like "test,status.eq.deleted" could inject extra filter conditions.
 */
export function sanitizeSearchInput(input: string): string {
  return input
    .replace(/\\/g, '\\\\')  // escape backslashes first
    .replace(/,/g, '\\,')     // commas separate .or() conditions
    .replace(/\(/g, '\\(')    // open parens for grouping
    .replace(/\)/g, '\\)')    // close parens for grouping
}
