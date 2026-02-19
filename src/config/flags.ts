/**
 * Feature Flags
 * Use to enable/disable modules in development without breaking production.
 * Updated: 2026-02-19 — Slice 3 Programación Wizard
 */
export const FLAGS = {
  ENABLE_ELIGIBILITY: true,
  ENABLE_ANEXO_IV: true,
  ENABLE_CALENDAR_BRIDGE: true, // Slice 2: Eligibility → Calendar context
  ENABLE_PROGRAMACION_WIZARD: true, // Slice 3: Minerva 3-step wizard (Contenidos → Criterios → SdA)
  ENABLE_DOCX_EXPORT: false, // En desarrollo
} as const;
