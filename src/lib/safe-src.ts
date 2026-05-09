/**
 * Returns the src string only if it's a valid non-empty URL.
 * Returns undefined for empty strings, whitespace-only, or nullish values.
 * This prevents the React warning:
 *   "An empty string ("") was passed to the src attribute."
 */
export function safeSrc(src: string | null | undefined): string | undefined {
  if (!src || src.trim() === '') return undefined;
  return src;
}
