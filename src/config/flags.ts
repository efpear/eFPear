/**
 * Feature Flags
 * Use to enable/disable modules in development without breaking production.
 * Updated: 2026-02-19 - Slice 6 Planning Dashboard + BOE Gate
 */
export const FLAGS = {
  ENABLE_ELIGIBILITY: true,
  ENABLE_ANEXO_IV: true,
  ENABLE_CALENDAR_BRIDGE: true,    // Slice 2: Eligibility -> Calendar context
  ENABLE_PROGRAMACION_WIZARD: true, // Slice 3: Minerva 3-step wizard (Contenidos -> Criterios -> SdA)
  ENABLE_DOCX_EXPORT: true,        // Slice 4: DOCX export of Anexo IV
  ENABLE_HEALTH_PANEL: true,       // Slice 5: Validation engine + Health Panel
  ENABLE_PLANNING_DASHBOARD: true, // Slice 6: Block A - PDF upload -> imparticion calendar
  ENABLE_BOE_GATE: true,           // Slice 6: Block B - Hard gate BOE in Programacion tab
} as const;
