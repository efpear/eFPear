/**
 * types/anexoIV.ts — Type definitions for Anexo IV (Programación Didáctica)
 *
 * These types define the complete structure of an Anexo IV document
 * as required by Spanish FPE regulations (Certificados de Profesionalidad).
 *
 * Structure follows the 3-column layout:
 *   Col 1: Objetivos específicos (Capacidades + Criterios de Evaluación)
 *   Col 2: Contenidos (organized by BOE themes)
 *   Col 3: Situaciones de Aprendizaje (learning activities)
 */

// ============================================
// CORE BUILDING BLOCKS
// ============================================

export type CategoriasCE = 'conocimiento' | 'destreza' | 'habilidad';

export interface CriterioEvaluacion {
  id: string;           // e.g. "CE1.2"
  texto: string;        // Full criterion text from BOE
  categoria: CategoriasCE;
}

export interface Capacidad {
  id: string;           // e.g. "C1", "C2"
  texto: string;        // Full capacity text from BOE
  criterios: CriterioEvaluacion[];
}

// ============================================
// COLUMN 2: CONTENIDOS
// ============================================

export interface ContenidoItem {
  texto: string;
  ceVinculado: string[];  // CE IDs this content maps to
}

export interface BloqueContenido {
  numero: number;       // BOE theme number (e.g. 1, 5, 6)
  titulo: string;       // Theme title from BOE
  items: ContenidoItem[];
}

// ============================================
// COLUMN 3: SITUACIONES DE APRENDIZAJE
// ============================================

export interface SituacionDeAprendizaje {
  numero: number;       // Sequential across all UAs in the UF
  nombre: string;
  objetivo: string;
  ceVinculado: string[];
  metodologia: string;
  desarrollo: string;
  recursos: string;
  tiempo: number;       // Hours
}

// ============================================
// UNIDAD DE APRENDIZAJE (groups cols 1-2-3)
// ============================================

export interface UnidadAprendizaje {
  id: string;               // "UA1", "UA2", etc.
  titulo: string;           // Combined BOE themes
  horas: number;            // Total hours for this UA
  horasEvaluacion: number;  // Hours reserved for evaluation
  horasAutonomo: number;    // Hours for self-directed learning
  horasSdA: number;         // Hours allocated to SdAs
  temasBOE: number[];       // BOE theme numbers grouped in this UA
  parrafoMetodologico?: string;  // Methodological intro (only first UA of UF)
  // Column 1
  capacidades: Capacidad[];
  // Column 2
  contenidos: BloqueContenido[];
  // Column 3
  situacionesAprendizaje: SituacionDeAprendizaje[];
}

// ============================================
// DOCUMENT-LEVEL STRUCTURES
// ============================================

export interface EspacioFormativo {
  nombre: string;
  superficie15: number;  // m² for 15 students
  superficie25: number;  // m² for 25 students
}

export interface AnexoIVEncabezado {
  certificado: { codigo: string; nombre: string; duracion: number };
  modulo: { codigo: string; nombre: string; horas: number };
  uf: { codigo: string; nombre: string; horas: number };
  fechasImparticion?: { inicio: string; fin: string };
  centro?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
}

export interface AnexoIVData {
  encabezado: AnexoIVEncabezado;
  objetivoGeneral: string[];          // RPs from UC
  unidadesAprendizaje: UnidadAprendizaje[];
  espacios: EspacioFormativo[];
  equipamiento: string[];
  instalacionesTexto: string;
}

// ============================================
// ENGINE OUTPUT (what the generator produces)
// ============================================

export interface AnexoIVGeneratorInput {
  /** BOE data: capacidades, criterios, contenidos */
  boeData: {
    capacidades: Capacidad[];
    contenidos: BloqueContenido[];
    realizacionesProfesionales: string[];
  };
  /** Calendar data: hours per UA, evaluation split */
  calendarData: {
    horasUF: number;
    uas: Array<{
      id: string;
      horas: number;
      temasBOE: number[];
    }>;
  };
  /** Config: centro, fechas, etc. */
  config: Partial<AnexoIVEncabezado>;
}

export interface AnexoIVValidation {
  horasMatch: boolean;        // Sum of UA hours ≤ UF hours
  allCEsCovered: boolean;     // Every CE appears in at least one SdA
  contenidosMapped: boolean;  // Every contenido has CE link
  sdaHoursValid: boolean;     // SdA hours + eval + autonomo = UA hours
  warnings: string[];
}
