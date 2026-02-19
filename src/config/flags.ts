/**
 * Feature Flags
 * Use to enable/disable modules in development without breaking production.
 * Updated: 2026-02-19 — Slice 5 Validation Engine + Health Panel
 */
export const FLAGS = {
  ENABLE_ELIGIBILITY: true,
  ENABLE_ANEXO_IV: true,
  ENABLE_CALENDAR_BRIDGE: true, // Slice 2: Eligibility → Calendar context
  ENABLE_PROGRAMACION_WIZARD: true, // Slice 3: Minerva 3-step wizard (Contenidos → Criterios → SdA)
  ENABLE_DOCX_EXPORT: true, // Slice 4: DOCX export of Anexo IV
  ENABLE_HEALTH_PANEL: true, // Slice 5: Validation engine + Health Panel
} as const;
