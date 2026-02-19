/**
 * types/incual.ts — INCUAL Canonical Schema
 *
 * Field names follow the Glosario INCUAL 2023 ontology exactly.
 * This is the master type system for all BOE data in eFPear.
 *
 * Hierarchy:
 *   Certificado de Profesionalidad
 *     └─ Módulo Formativo (MF)
 *          └─ Unidad Formativa (UF)
 *               └─ Unidad de Aprendizaje (UA) — grouping of Temas BOE
 *                    ├─ Columna 1: Capacidades (C) → Criterios de Evaluación (CE)
 *                    ├─ Columna 2: Contenidos (bloques temáticos del BOE)
 *                    └─ Columna 3: Situaciones de Aprendizaje (SdA)
 *
 * Key principle: INCUAL says "Capacidades (C)" → our field is `capacidades_c`.
 * No paraphrasing. Literal mapping.
 */

// ============================================
// TIPOLOGÍA CE (INCUAL classification by verb)
// ============================================

/**
 * CE classification based on the literal verb in the criterion text.
 * This classification is deterministic and based on INCUAL rules:
 *   - conocimiento: "Describir", "Identificar", "Diferenciar", "Clasificar"
 *   - destreza: "Calcular", "Elaborar", "Comparar", "En supuestos prácticos..."
 *   - habilidad: "Justificar", "Argumentar" (when social/attitudinal)
 */
export type TipologiaCE = 'conocimiento' | 'destreza_cognitiva_practica' | 'habilidad_personal_social';

// ============================================
// BUILDING BLOCKS — Literal BOE structures
// ============================================

/** Realización Profesional — from the UC (Unidad de Competencia) */
export interface RealizacionProfesional_RP {
  id: string;         // "RP1", "RP2", etc.
  texto_literal: string;  // Exact BOE text, sanitized
}

/** Capacidad — from the BOE RD Anexo */
export interface Capacidad_C {
  id: string;         // "C1", "C2", etc.
  texto_literal: string;
  criterios_evaluacion: CriterioEvaluacion_CE[];
}

/** Criterio de Evaluación — classified by tipología */
export interface CriterioEvaluacion_CE {
  id: string;         // "CE1.1", "CE2.3", etc.
  texto_literal: string;
  tipologia: TipologiaCE;
}

/** Contenido — a single item within a BOE theme block */
export interface ContenidoItem {
  texto_literal: string;
  ce_vinculados: string[];  // CE IDs this content maps to
}

/** Bloque de Contenido — one numbered BOE theme section */
export interface BloqueContenido_BOE {
  numero_tema: number;      // BOE theme number (e.g. 1, 2, 3...)
  titulo_literal: string;   // Exact theme title from BOE
  items: ContenidoItem[];
}

// ============================================
// SITUACIÓN DE APRENDIZAJE (SdA)
// ============================================

/**
 * SdA structure follows the exact Minerva order:
 * Nombre → Objetivo → CE vinculado → Metodología → Desarrollo → Recursos → Tiempo
 */
export interface SituacionDeAprendizaje_SdA {
  numero: number;           // Sequential across all UAs in the UF
  fase: 'Inicio' | 'Desarrollo' | 'Cierre';
  nombre: string;
  objetivo: string;
  ce_vinculados: string[];  // CE IDs addressed by this SdA
  metodologia: string;
  /** Must be one of: 'Individual', 'Parejas', 'Pequeño grupo', 'Grupos 3-4', 'Grupos 5-6', 'Gran grupo' (or combination) */
  agrupamiento: string;
  desarrollo_actividad: string;  // Must explicitly mention the agrupamiento
  recursos: string;
  tiempo_horas: number;
}

// ============================================
// UNIDAD DE APRENDIZAJE (UA)
// ============================================

export interface UnidadAprendizaje_UA {
  id: string;                   // "UA1", "UA2", etc.
  titulo_literal: string;       // Born from selected contenidos (Step 1)
  horas_totales: number;
  horas_evaluacion: number;
  horas_autonomo: number;
  horas_sda: number;            // = horas_totales - horas_evaluacion - horas_autonomo
  temas_boe: number[];          // BOE theme numbers grouped here

  /** Only on the first UA of the UF */
  parrafo_metodologico?: string;

  /** Column 1 — derived from selected contenidos (Step 2) */
  capacidades_c: Capacidad_C[];

  /** Column 2 — selected BOE blocks (Step 1 — THE STARTING POINT) */
  contenidos_boe: BloqueContenido_BOE[];

  /** Column 3 — built from cross of Col1 × Col2 (Step 3) */
  situaciones_aprendizaje: SituacionDeAprendizaje_SdA[];
}

// ============================================
// ESPACIOS, INSTALACIONES, EQUIPAMIENTO
// ============================================

export interface EspacioFormativo {
  nombre: string;
  superficie_m2_15alumnos: number;
  superficie_m2_25alumnos: number;
}

// ============================================
// DOCUMENT LEVEL — Encabezado Anexo IV
// ============================================

export interface EncabezadoAnexoIV {
  certificado: {
    codigo: string;       // "HOTA0308"
    nombre_literal: string;
    duracion_horas: number;
  };
  modulo_formativo: {
    codigo: string;       // "MF0265_3"
    nombre_literal: string;
    horas: number;
  };
  unidad_formativa: {
    codigo: string;       // "UF0048"
    nombre_literal: string;
    horas: number;
  };
  // User-supplied
  fechas_imparticion?: { inicio: string; fin: string };
  centro_formacion?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
}

// ============================================
// MASTER DOCUMENT — Full Anexo IV
// ============================================

export interface AnexoIV_Completo {
  encabezado: EncabezadoAnexoIV;
  objetivo_general_modulo: RealizacionProfesional_RP[];
  unidades_aprendizaje: UnidadAprendizaje_UA[];
  espacios_formativos: EspacioFormativo[];
  equipamiento: string[];
  instalaciones_texto: string;
}

// ============================================
// WIZARD STATE (UI flow: Contenidos → Criterios → SdA)
// ============================================

/** Step 1: User selects which BOE content blocks go into each UA */
export interface WizardStep1_Contenidos {
  uf_codigo: string;
  contenidos_disponibles: BloqueContenido_BOE[];  // All BOE blocks for this UF
  asignacion_ua: Array<{
    ua_id: string;
    temas_seleccionados: number[];  // Which tema numbers assigned to this UA
    horas: number;
  }>;
}

/** Step 2: System auto-derives capacidades/CEs from selected contenidos */
export interface WizardStep2_Criterios {
  ua_id: string;
  /** Auto-filtered: only C/CEs whose IDs appear in the contenidos' ce_vinculados */
  capacidades_filtradas: Capacidad_C[];
  /** Validation: CEs not covered by any contenido in this UA */
  ce_sin_cobertura: string[];
}

/** Step 3: SdA builder — one SdA per CE or CE group */
export interface WizardStep3_SdA {
  ua_id: string;
  sda_draft: SituacionDeAprendizaje_SdA[];
  /** Validation */
  horas_asignadas: number;
  horas_disponibles: number;
  ce_cubiertos: string[];
  ce_pendientes: string[];
}

// ============================================
// VALIDATION (Quality Checkpoints)
// ============================================

export interface AnexoIVValidation {
  /** Test 1: Trazabilidad — every phrase in Col1/Col2 traceable to BOE */
  trazabilidad_ok: boolean;
  /** Test 2: Tipología — CEs classified by literal verb */
  tipologia_ok: boolean;
  /** Test 3: Formato — RPs in bold, coletilla in normal */
  formato_ok: boolean;
  /** Test 4: Estructura SdA — correct field order */
  estructura_sda_ok: boolean;
  /** Hours check */
  horas_match: boolean;
  /** All CEs covered by at least one SdA */
  cobertura_ce_completa: boolean;
  /** All contenidos mapped to CEs */
  contenidos_mapeados: boolean;

  warnings: string[];
  errors: string[];
}
