/**
 * BOE Annex Data Types
 * Types for structured BOE annex data (capacidades, criterios, contenidos)
 */

/** Single criterio de evaluacion */
export interface BoeCriterio {
  /** e.g. 'CE1.1', 'CE2.3' */
  codigo: string;
  /** Full literal text from BOE */
  texto: string;
}

/** Capacidad with its criterios */
export interface BoeCapacidad {
  /** e.g. 'C1', 'C2' */
  codigo: string;
  /** Full literal text of the capacidad */
  texto: string;
  /** Associated criterios de evaluacion */
  criterios: BoeCriterio[];
}

/** Contenido subsection */
export interface BoeContenidoItem {
  texto: string;
  subitems?: string[];
}

/** Contenido section (numbered) */
export interface BoeContenido {
  /** e.g. '1', '2' */
  numero: string;
  /** Section heading */
  titulo: string;
  /** Subsections/items */
  items: BoeContenidoItem[];
}

/** Complete UF data from BOE */
export interface BoeUFData {
  codigo: string;
  denominacion: string;
  duracion: number;
  capacidades: BoeCapacidad[];
  contenidos: BoeContenido[];
}

/** Complete MF data from BOE */
export interface BoeModuloData {
  codigoMF: string;
  nombreMF: string;
  duracion: number;
  unidadesFormativas: BoeUFData[];
  /** Espacios formativos requirement */
  espacios?: {
    nombre: string;
    superficie15: number;
    superficie25: number;
  }[];
  /** Equipamiento by space */
  equipamiento?: Record<string, string[]>;
  /** Requisitos formadores */
  requisitosFormadores?: {
    titulaciones: string[];
    experiencia: string;
  };
}

/** Complete certificate BOE annex data */
export interface BoeCertificadoData {
  codigo: string;
  denominacion: string;
  nivel: number;
  familia: string;
  duracionTotal: number;
  modulos: BoeModuloData[];
}
