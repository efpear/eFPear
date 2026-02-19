/**
 * planning.ts - Types for Block A: Temporal Planning Dataset
 * Updated: 2026-02-19 - Slice 6
 */

/** Type of module for planning purposes */
export type ModuleTipo = 'MF' | 'MO' | 'MP';

/** A single module entry in the planning dataset */
export interface PlanningModule {
  id: string;
  codigo: string;
  titulo: string;
  horas: number;
  tipo: ModuleTipo;
  /** If true: excluded from imparticion date computation (MO/MP modules) */
  excluido: boolean;
}

/** Dataset produced by parsing a SEPE document or entered manually */
export interface PlanningDataset {
  /** Certificate code (e.g. HOTA0308), empty if not detected */
  codigoCertificado: string;
  /** Certificate title */
  tituloCertificado: string;
  modules: PlanningModule[];
  /** Sum of horas for non-excluded modules (MF only) */
  totalHorasLectivas: number;
  /** Sum of horas for excluded modules (MO/MP) */
  totalHorasPracticas: number;
  /** Source of data */
  source: 'pdf' | 'manual';
  /** Parse warnings if any */
  warnings: string[];
}

/** Result of imparticion calendar computation */
export interface ImparticionEntry {
  modulo: PlanningModule;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string;   // YYYY-MM-DD
  semanas: number;
}

export interface ImparticionCalendarResult {
  entries: ImparticionEntry[];
  fechaInicioGlobal: string;
  fechaFinGlobal: string;
  totalSemanas: number;
}
