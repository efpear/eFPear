/**
 * Eligibility Engine Types v1.0
 *
 * Motor de Elegibilidad: determina en <2s si un usuario puede
 * impartir un MF concreto segun el BOE.
 */

// ============================================
// INPUTS
// ============================================

/** Perfil del formador/a */
export interface TrainerProfile {
  // Academico
  /** Titulaciones (ej. ["Grado en Turismo", "Licenciado en Filologia"]) */
  titulaciones: string[];
  /** Nivel maximo EQF/MECES (1-5) */
  nivelMaximo: 1 | 2 | 3 | 4 | 5;

  // Experiencia Profesional (Sectorial)
  /** Anos de experiencia en el sector */
  experienciaSectorial: number;
  /** Familia profesional (ej. "Hosteleria y Turismo") */
  familiaProfesional: string;

  // Competencia Docente
  /** Tiene CAP o Master de Profesorado */
  tieneCapOMaster: boolean;
  /** Tiene SSCE0110 (Certificado de docencia FP) */
  tieneSSCE0110: boolean;
  /** Horas totales de experiencia docente */
  horasExperienciaDocente: number;

  // Extras
  /** Idiomas acreditados: { "Ingles": "C1", "Frances": "B2" } */
  idiomas: Record<string, string>;
}

/** Requisitos del BOE para un MF concreto */
export interface BoeRequirements {
  /** Codigo del MF (ej. "MF0265_3") */
  codigoMF: string;
  /** Nombre del MF */
  nombreMF: string;

  // Requisitos Academicos
  /** Lista de titulaciones aceptadas (ej. ["Licenciado", "Grado", "Diplomado"]) */
  titulacionesRequeridas: string[];
  /** Nivel minimo requerido EQF/MECES (1-5) */
  nivelMinimoRequerido?: number;

  // Experiencia Profesional Requerida (anos)
  /** Anos con titulacion */
  experienciaConTitulacion: number;
  /** Anos sin titulacion (si aplica normativa general) */
  experienciaSinTitulacion: number;
  /** Permite expertos sin titulacion */
  permiteExpertosSinTitulacion: boolean;

  // Requisitos Especificos
  /** Idioma requerido (null si no aplica) */
  idiomaRequerido?: { idioma: string; nivel: string };
  /** Otros requisitos especificos */
  otrosRequisitos?: string[];
}

// ============================================
// OUTPUTS
// ============================================

/** Estado de elegibilidad */
export type EligibilityStatus = 'ELIGIBLE' | 'CONDICIONAL' | 'NO_ELIGIBLE';

/** Tipo de mensaje en el resultado */
export type EligibilityMessageType = 'success' | 'warning' | 'error';

/** Mensaje individual en el resultado */
export interface EligibilityMessage {
  tipo: EligibilityMessageType;
  /** Texto explicativo para el usuario */
  texto: string;
  /** Cita literal del requisito BOE */
  referenciaBoe: string;
  /** Categoria del check */
  categoria: 'academico' | 'experiencia' | 'docente' | 'especifico';
}

/** Resultado completo de la evaluacion */
export interface EligibilityResult {
  status: EligibilityStatus;
  mensajes: EligibilityMessage[];
  /** Resumen de una linea */
  resumen: string;
}
