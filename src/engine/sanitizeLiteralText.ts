/**
 * sanitizeLiteralText.ts — Agent A: The Text Sanitizer
 *
 * Deep text cleaning for BOE content. Every piece of text that enters
 * the system or goes to the UI/export MUST pass through this function.
 *
 * Rules:
 *  - Remove invisible Unicode chars (ZWSP, BOM, soft hyphens, etc.)
 *  - Normalize whitespace (multiple spaces → single, trim)
 *  - Normalize dashes (em-dash, en-dash → standard hyphen where appropriate)
 *  - Strip non-printable control chars
 *  - Normalize quotes (smart quotes → straight quotes)
 *  - Preserve intentional line breaks (for multi-paragraph fields)
 *  - NO content modification — only cleaning
 */

// Characters to strip completely
const INVISIBLE_CHARS = /[\u200B\u200C\u200D\uFEFF\u00AD\u2060\u180E\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

// Control characters except newline, tab
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

// Multiple spaces (but not newlines)
const MULTI_SPACES = /[^\S\n]+/g;

// Multiple newlines (3+ → 2)
const EXCESS_NEWLINES = /\n{3,}/g;

/**
 * Sanitize a single piece of literal BOE text.
 * Returns cleaned text. Null/undefined → empty string.
 */
export function sanitizeLiteralText(raw: string | null | undefined): string {
  if (!raw) return '';

  let t = raw;

  // 1. Strip BOM
  t = t.replace(/^\uFEFF/, '');

  // 2. Remove invisible Unicode chars
  t = t.replace(INVISIBLE_CHARS, '');

  // 3. Remove non-printable control chars
  t = t.replace(CONTROL_CHARS, '');

  // 4. Normalize smart quotes → straight
  t = t.replace(/[\u2018\u2019\u201A\u201B]/g, "'");
  t = t.replace(/[\u201C\u201D\u201E\u201F]/g, '"');

  // 5. Normalize dashes: en-dash → hyphen (keep em-dash for intentional use)
  t = t.replace(/\u2013/g, '-'); // en-dash → hyphen
  // Note: em-dash (\u2014) kept as-is — sometimes used intentionally in BOE

  // 6. Normalize ellipsis
  t = t.replace(/\u2026/g, '...');

  // 7. Collapse multiple spaces (preserve newlines)
  t = t.replace(MULTI_SPACES, ' ');

  // 8. Collapse excessive newlines
  t = t.replace(EXCESS_NEWLINES, '\n\n');

  // 9. Trim each line
  t = t.split('\n').map(line => line.trim()).join('\n');

  // 10. Final trim
  t = t.trim();

  return t;
}

/**
 * Sanitize all string values in an object recursively.
 * Use to clean entire parsed BOE data structures in one pass.
 */
export function sanitizeDeep<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitizeLiteralText(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeDeep(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = sanitizeDeep(value);
    }
    return cleaned as T;
  }
  return obj;
}
