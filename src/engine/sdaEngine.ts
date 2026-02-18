/**
 * sdaEngine.ts v1.2 — Generador SdA Avanzado
 *
 * Genera Situaciones de Aprendizaje pedagogicamente ricas, variadas
 * y alineadas con la normativa, listas para insercion en Anexo IV.
 *
 * Proceso:
 * 1. Calcula horas disponibles (UA - evaluaciones - margen)
 * 2. Itera generando SdAs hasta cubrir las horas
 * 3. Selecciona estrategias por Bloom + fase (circular determinista)
 * 4. Instancia templates con contenido y CE reales
 *
 * 100% deterministico: mismo input -> mismo output.
 * @module sdaEngine
 */

import type {
  BloomLevel,
  Fase,
  SituacionAprendizaje,
  SdAGeneratorConfig,
  EstrategiaMetodologica,
} from '../types/sda';

import { BLOOM_TO_STRATEGIES, getStrategiesForBloomAndPhase } from './methodologyDictionary';

// Re-export types for backward compatibility
export type { SituacionAprendizaje, SdAGeneratorConfig };

// ============================================
// DEFAULTS
// ============================================

const DEFAULT_CONFIG: Required<SdAGeneratorConfig> = {
  horasEvalProceso: 0,
  horasEvalFinal: 0,
  margenHoras: 0,
  duracionMinSdA: 0.5,
  duracionMaxSdA: 4,
};

// ============================================
// INPUT INTERFACE
// ============================================

export interface UAInput {
  /** Horas totales de la UA */
  horasTotales: number;
  /** Nivel Bloom de la UA (1-5) */
  bloom: BloomLevel;
  /**
   * Contenidos asignados a esta UA.
   * Cada string es el titulo/descripcion de un bloque de contenido.
   */
  contenidos: string[];
  /**
   * Criterios de evaluacion asignados a esta UA.
   * Cada string es el codigo CE (ej. "CE1.1")
   */
  criterios: string[];
  /** Numero de la UA (para seed determinista) */
  uaNumero?: number;
}

// ============================================
// CORE GENERATION
// ============================================

/**
 * Genera SdAs completas para una UA, listas para Anexo IV.
 *
 * @param ua - Datos de la UA (horas, Bloom, contenidos, criterios)
 * @param config - Configuracion opcional
 * @returns Array de SituacionAprendizaje con todos los campos rellenos
 */
export function generarSdAsParaUA(
  ua: UAInput,
  config: SdAGeneratorConfig = {}
): SituacionAprendizaje[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // 1. Horas disponibles para SdAs
  const horasSdA = Math.max(
    0,
    ua.horasTotales - cfg.horasEvalProceso - cfg.horasEvalFinal - cfg.margenHoras
  );

  if (horasSdA <= 0) return [];

  // 2. Iterative generation loop
  const sdas: SituacionAprendizaje[] = [];
  let horasAcumuladas = 0;
  let i = 0;

  // Circular counters for deterministic selection
  let contenidoIdx = 0;
  let criterioIdx = 0;

  // Strategy selection state (circular per phase)
  const strategyCounters: Record<string, number> = {};

  while (horasAcumuladas < horasSdA) {
    // 2a. Determine phase
    const fase = determinarFase(horasAcumuladas, horasSdA, i);

    // 2b. Select strategy (circular deterministic)
    const estrategia = seleccionarEstrategia(
      ua.bloom, fase, strategyCounters
    );

    // 2c. Assign contenido (circular)
    const contenido = ua.contenidos.length > 0
      ? ua.contenidos[contenidoIdx % ua.contenidos.length]
      : 'los contenidos de la unidad';
    if (ua.contenidos.length > 0) contenidoIdx++;

    // 2d. Assign CE (circular, 1-2 per SdA)
    const ceCount = Math.min(2, Math.max(1, Math.ceil(ua.criterios.length / Math.max(1, Math.ceil(horasSdA / estrategia.duracionBase)))));
    const ceVinculado: string[] = [];
    if (ua.criterios.length > 0) {
      for (let k = 0; k < ceCount; k++) {
        ceVinculado.push(ua.criterios[criterioIdx % ua.criterios.length]);
        criterioIdx++;
      }
    }

    // 2e. Calculate duration
    let tiempo = Math.min(estrategia.duracionBase, cfg.duracionMaxSdA);
    const horasRestantes = horasSdA - horasAcumuladas;

    // Overflow control
    if (horasAcumuladas + tiempo > horasSdA) {
      tiempo = horasRestantes;
    }

    // If remaining time is too small, absorb into previous SdA
    if (tiempo < cfg.duracionMinSdA && sdas.length > 0) {
      sdas[sdas.length - 1].tiempo += tiempo;
      break;
    }

    // 2f. Instantiate SdA from template
    const cePrincipal = ceVinculado.length > 0 ? ceVinculado.join(', ') : 'las competencias de la unidad';

    const sda: SituacionAprendizaje = {
      id: `sda-${(ua.uaNumero || 1)}-${i + 1}`,
      numero: i + 1,
      fase,
      nombre: fillTemplate(
        estrategia.nombresActividad[i % estrategia.nombresActividad.length],
        contenido, cePrincipal
      ),
      objetivo: fillTemplate(estrategia.plantillaObjetivo, contenido, cePrincipal),
      ceVinculado,
      metodologia: fillTemplate(estrategia.plantillaMetodologia, contenido, cePrincipal),
      desarrollo: fillTemplate(estrategia.plantillaDesarrollo, contenido, cePrincipal),
      recursos: estrategia.recursosSugeridos.join('; '),
      tiempo,
    };

    sdas.push(sda);
    horasAcumuladas += tiempo;
    i++;

    // Safety: prevent infinite loops
    if (i > 50) break;
  }

  return sdas;
}

// ============================================
// HELPERS
// ============================================

/**
 * Determine phase based on accumulated hours position.
 */
function determinarFase(
  horasAcumuladas: number,
  horasTotales: number,
  index: number
): Fase {
  if (index === 0) return 'Inicio';

  const porcentajeAvance = horasAcumuladas / horasTotales;

  // Last ~15% of hours -> Cierre (but only trigger once, near the end)
  if (porcentajeAvance >= 0.85) return 'Cierre';

  return 'Desarrollo';
}

/**
 * Select strategy deterministically (circular within Bloom+phase).
 */
function seleccionarEstrategia(
  bloom: BloomLevel,
  fase: Fase,
  counters: Record<string, number>
): EstrategiaMetodologica {
  const candidates = getStrategiesForBloomAndPhase(bloom, fase);

  if (candidates.length === 0) {
    // Fallback: any strategy for this Bloom level
    const fallback = BLOOM_TO_STRATEGIES[bloom] || BLOOM_TO_STRATEGIES[3];
    const key = `fallback-${bloom}`;
    counters[key] = (counters[key] || 0);
    const idx = counters[key] % fallback.length;
    counters[key]++;
    return fallback[idx];
  }

  const key = `${bloom}-${fase}`;
  counters[key] = (counters[key] || 0);
  const idx = counters[key] % candidates.length;
  counters[key]++;
  return candidates[idx];
}

/**
 * Replace {contenido} and {ce_principal} placeholders in template text.
 */
function fillTemplate(
  template: string,
  contenido: string,
  cePrincipal: string
): string {
  return template
    .replace(/\{contenido\}/g, contenido)
    .replace(/\{ce_principal\}/g, cePrincipal);
}

// ============================================
// VALIDATION & STATS
// ============================================

/**
 * Validate CE coverage across generated SdAs.
 * Returns uncovered CE codes.
 */
export function validarCoberturaCE(
  sdas: SituacionAprendizaje[],
  criteriosTotales: string[]
): string[] {
  const cubiertos = new Set(sdas.flatMap(s => s.ceVinculado));
  return criteriosTotales.filter(ce => !cubiertos.has(ce));
}

/**
 * Statistics for a set of SdAs.
 */
export function estadisticasSdAs(sdas: SituacionAprendizaje[]): {
  totalSdAs: number;
  totalHoras: number;
  horasInicio: number;
  horasDesarrollo: number;
  horasCierre: number;
  criteriosCubiertos: number;
} {
  const totalHoras = sdas.reduce((acc, s) => acc + s.tiempo, 0);
  const horasInicio = sdas.filter(s => s.fase === 'Inicio').reduce((acc, s) => acc + s.tiempo, 0);
  const horasDesarrollo = sdas.filter(s => s.fase === 'Desarrollo').reduce((acc, s) => acc + s.tiempo, 0);
  const horasCierre = sdas.filter(s => s.fase === 'Cierre').reduce((acc, s) => acc + s.tiempo, 0);
  const criteriosCubiertos = new Set(sdas.flatMap(s => s.ceVinculado)).size;

  return { totalSdAs: sdas.length, totalHoras, horasInicio, horasDesarrollo, horasCierre, criteriosCubiertos };
}
