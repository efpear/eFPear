/**
 * ============================================
 * eFPear CertiCalc - Type Definitions
 * ============================================
 * Tipos compartidos entre engines, componentes y utilidades.
 * Fuente de verdad para todo el proyecto.
 */

// ============================================
// BRANDED TYPES
// ============================================

/** Fecha en formato ISO (YYYY-MM-DD) */
export type FechaISO = string & { readonly __brand: 'FechaISO' };

// ============================================
// BLOOM & METHODOLOGY
// ============================================

/** Niveles de la Taxonomía de Bloom (1-6) */
export type BloomLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Métodos de enfoque didáctico */
export type MetodoEnfoque = 'Expositivo' | 'Demostrativo' | 'Activo' | 'Interrogativo';

/** Métodos didácticos principales (extended) */
export type MetodoPrincipal =
  | 'Expositivo'
  | 'Demostrativo'
  | 'Interrogativo'
  | 'Descubrimiento'
  | 'Proyecto';

// ============================================
// SdA (Situación de Aprendizaje)
// ============================================

export type FaseSdA = 'Inicio' | 'Desarrollo' | 'Cierre';

export interface SdA {
  id: number;
  numero: number;
  fase: FaseSdA;
  titulo: string;
  objetivo: string;
  estrategia: string;
  desarrollo: string;
  medios: string[];
  espacios: string;
  duracionHoras: number;
  ceAsociados: string[];
}

// ============================================
// UNIDAD DE APRENDIZAJE (UA)
// ============================================

export interface UnidadAprendizaje {
  numero: number;
  titulo: string;
  horasTotales: number;
  bloomDominante: BloomLevel;
  sdas: SdA[];
}

// ============================================
// CONFIGURACIÓN
// ============================================

export interface ConfiguracionMotor {
  horasPorSesion: number;
  margenAulaPorcentaje: number;
  reservaExamenFinal: boolean;
  horasExamenFinal: number;
}

// ============================================
// RESULTADOS
// ============================================

export interface ResultadoDistribucion {
  idModulo: string;
  totalHoras: number;
  uas: UnidadAprendizaje[];
}

// ============================================
// CALENDAR / SESSIONS
// ============================================

export interface Sesion {
  fecha: FechaISO;
  horas: number;
  tipo?: 'normal' | 'examen' | 'recuperacion';
}

export interface ModuloConSesiones {
  id: string;
  codigo: string;
  titulo: string;
  horasTotales: number;
  sesiones: Sesion[];
}

// ============================================
// BOE DATA MODEL (Curriculum Engine)
// ============================================

export interface Certificado {
  codigo: string;
  nombre: string;
  nivel: 1 | 2 | 3;
  modulos: ModuloFormativo[];
}

export interface ModuloFormativo {
  codigo: string;
  titulo: string;
  horas: number;
  capacidades: Capacidad[];
  contenidos: Contenido[];
}

export interface Capacidad {
  id: string;
  descripcion: string;
  criterios: Criterio[];
}

export interface Criterio {
  id: string;
  descripcion: string;
}

export interface Contenido {
  id: string;
  descripcion: string;
}
