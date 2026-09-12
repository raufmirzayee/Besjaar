/**
 * Values going into a PostgREST `or(...)` filter.
 *
 * `.eq("email", value)` is safe: supabase-js puts the value in its own query
 * parameter and nothing in it can change the shape of the request. `.or(...)`
 * is not — its argument is a single string in PostgREST's own filter grammar,
 * and building that string with a template literal is the same mistake as
 * building SQL with one.
 *
 * A search for `a,id.gte.0` turns
 *
 *     name.ilike.%a,id.gte.0%,internal_sku.ilike.%a,id.gte.0%
 *
 * into three conditions instead of two, the third matching every row in the
 * table. Repeat with `email.like.j*`, `email.like.ja*` and so on and the filter
 * becomes a way to read values a query was never meant to return.
 *
 * PostgREST's answer is quoting: a double-quoted value is taken literally, with
 * `\` and `"` escaped inside it. That is what these helpers produce.
 */

/**
 * Quotes one value for use inside a filter string.
 *
 * The quotes are part of the grammar, not part of the value, so the caller
 * writes `name.ilike.${quoteFilterValue(x)}` with no quotes of its own.
 */
export function quoteFilterValue(value: string): string {
  // Backslash first: escaping the quotes first would then escape the
  // backslashes this step adds.
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * A quoted `%term%` pattern for an `ilike` filter.
 *
 * `%` and `_` keep their wildcard meaning on purpose — a shopkeeper typing
 * `lamp%30` into a search box means the wildcard, and the worst it does is
 * match more rows of a table they can already read. It is the grammar
 * characters that matter here, and quoting handles those.
 */
export function likePattern(term: string): string {
  return quoteFilterValue(`%${term.trim()}%`);
}
