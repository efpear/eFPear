/**
 * Feature Flags
 * Use to enable/disable modules in development without breaking production.
 * Updated: 2026-02-19 — Slice 2 complete
 */
export const FLAGS = {
  ENABLE_ELIGIBILITY: true,
  ENABLE_ANEXO_IV: true,
  ENABLE_CALENDAR_BRIDGE: true, // Slice 2: Eligibility → Calendar context
  ENABLE_DOCX_EXPORT: false, // En desarrollo
} as const;
