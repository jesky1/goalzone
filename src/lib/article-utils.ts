// ============================================================
// GOALZONE — Shared Article Utilities
// ============================================================
// Common functions for article processing: slug generation,
// read time calculation, and meta description helpers.
// ============================================================

/**
 * Generate a clean, URL-friendly slug from a title.
 *
 * Examples:
 *   "Hasil Strasbourg vs Rayo"     → "hasil-strasbourg-vs-rayo"
 *   "Liverpool 3-1 Man City: Wow!" → "liverpool-3-1-man-city-wow"
 *   "¿Qué pasa con el fútbol?"     → "que-pasa-con-el-futbol"
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')                    // split accented chars: é → e + ́
    .replace(/[\u0300-\u036f]/g, '')     // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')        // remove non-alphanumeric (except space & hyphen)
    .replace(/\s+/g, '-')                // spaces → hyphens
    .replace(/-+/g, '-')                 // collapse multiple hyphens
    .replace(/^-+|-+$/g, '')             // trim leading/trailing hyphens
    .substring(0, 120)                   // truncate to max 120 chars
}

/**
 * Calculate estimated read time in minutes based on word count.
 *
 * Uses the industry-standard ~200 words/minute for Indonesian text,
 * which accounts for slightly slower reading than English (~238 wpm)
 * due to affixation and longer compound words.
 *
 * Minimum read time is 1 minute.
 *
 * @param content - The article content (HTML or plain text)
 * @returns Read time in minutes (rounded up, minimum 1)
 */
export function calculateReadTime(content: string): number {
  // Strip HTML tags to get plain text
  const plainText = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  if (!plainText) return 1

  const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length
  const wordsPerMinute = 200
  const minutes = Math.ceil(wordCount / wordsPerMinute)

  return Math.max(1, minutes)
}

/**
 * Truncate text to a maximum character length, breaking at word boundary.
 * Adds ellipsis (...) if truncated.
 */
export function truncateMeta(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text

  // Try to break at the last space before the limit
  const truncated = text.substring(0, maxLength - 3)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.6) {
    return truncated.substring(0, lastSpace) + '...'
  }

  return truncated + '...'
}
