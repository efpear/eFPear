/**
 * SdA Types v1.2 — Situaciones de Aprendizaje Avanzadas
 * Aligned with SSCE0110 methodology and Anexo IV output requirements.
 */

/** Nivel cognitivo de Bloom simplificado */
export type BloomLevel = 1 | 2 | 3 | 4 | 5;

/** Fase didactica de la actividad */
export type Fase = 'Inicio' | 'Desarrollo' | 'Cierre';

/** Tipo de Metodo Didactico (segun literatura SSCE0110) */
export type MetodoDidactico =
  | 'Expositivo'
  | 'Demostrativo'
  | 'Interrogativo'
  | 'Descubrimiento';

/**
 * Definicion de una Estrategia Metodologica Completa (Template).
 * Cada estrategia es una plantilla reutilizable para generar SdAs.
 */
export interface EstrategiaMetodologica {
  /** Identificador unico interno (ej. "EXPOSITIVO_BASICO") */
  id: string;
  /** Metodo didactico principal */
  metodo: MetodoDidactico;
  /** Fases donde esta estrategia es optima */
  fasesSugeridas: Fase[];

  /**
   * Lista de plantillas para el NOMBRE de la actividad.
   * Usar {contenido} como placeholder.
   * Ej: "Analisis critico de {contenido}"
   */
  nombresActividad: string[];

  /** Plantilla de texto para el campo Objetivo. Placeholders: {contenido}, {ce_principal} */
  plantillaObjetivo: string;
  /** Plantilla de texto para la columna "Metodologia" */
  plantillaMetodologia: string;
  /** Plantilla de texto para la columna "Desarrollo de la actividad" */
  plantillaDesarrollo: string;

  /** Lista base de recursos sugeridos */
  recursosSugeridos: string[];
  /** Duracion recomendada en horas (ej. 1, 1.5, 2, 3) */
  duracionBase: number;
}

/**
 * Estructura Final de una SdA (Output para Anexo IV).
 * Todos los campos visibles estan listos para renderizar.
 */
export interface SituacionAprendizaje {
  /** UUID */
  id: string;
  /** Correlativo (1, 2, 3...) */
  numero: number;
  /** Metadato interno para logica de fases */
  fase: Fase;

  // === CAMPOS VISIBLES EN ANEXO IV (Orden Estricto) ===
  /** Nombre descriptivo de la actividad */
  nombre: string;
  /** Objetivo de aprendizaje */
  objetivo: string;
  /** Array de codigos CE vinculados (ej. ["CE1.1", "CE1.2"]) */
  ceVinculado: string[];
  /** Texto de metodologia aplicada */
  metodologia: string;
  /** Texto de desarrollo de la actividad */
  desarrollo: string;
  /** Recursos necesarios (texto) */
  recursos: string;
  /** Duracion en horas */
  tiempo: number;
}

/**
 * Configuracion del generador de SdA.
 */
export interface SdAGeneratorConfig {
  /** Horas reservadas para evaluacion de proceso (por UA) */
  horasEvalProceso?: number;
  /** Horas reservadas para evaluacion final (por UA) */
  horasEvalFinal?: number;
  /** Margen de horas de cortesia (por UA) */
  margenHoras?: number;
  /** Duracion minima de una SdA (horas). Default: 0.5 */
  duracionMinSdA?: number;
  /** Duracion maxima de una SdA (horas). Default: 4 */
  duracionMaxSdA?: number;
}
