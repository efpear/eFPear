/**
 * ============================================
 * eFPear CertiCalc - SdA Engine
 * ============================================
 * Generación automática de Situaciones de Aprendizaje (SdA)
 * con texto metodológico completo, listas para Anexo IV.
 * 
 * Consume: distributionEngine, verbsDictionary, textTemplates
 * Produce: SdA[] con todos los campos rellenos (objetivo, estrategia,
 *          desarrollo, medios, espacios, duración, CE asociados)
 * 
 * 100% determinístico.
 * @module sdaEngine
 */

import type {
  BloomLevel,
  FaseSdA,
  SdA,
  Capacidad,
  Criterio,
  Contenido,
} from '../types';

import type { UADistribution } from './distributionEngine';
import { METODO_POR_BLOOM, AGRUPACION_POR_METODO } from './distributionEngine';
import { inferirBloomDeTexto } from './verbsDictionary';
import {
  generarEstrategia,
  generarDesarrollo,
  generarObjetivoSdA,
} from './textTemplates';

// ============================================
// CONFIGURATION
// ============================================

export interface SdAGenerationConfig {
  /** Medios por defecto si no se especifican */
  mediosDefault: string[];
  /** Espacio formativo por defecto */
  espacioDefault: string;
  /** Recursos didácticos por defecto (para generarEstrategia) */
  recursosDefault?: string;
}

export const DEFAULT_SDA_CONFIG: SdAGenerationConfig = {
  mediosDefault: [
    'Ordenador con conexión a Internet',
    'Proyector / pantalla digital',
    'Material audiovisual específico',
    'Documentación técnica del módulo',
  ],
  espacioDefault: 'Aula polivalente / Aula-taller',
};

// ============================================
// CORE GENERATION
// ============================================

/**
 * Genera SdAs completas para una UA, con todos los textos rellenos.
 * 
 * @param ua - Distribución de la UA (horas, Bloom, nº SdAs)
 * @param capacidades - Capacidades asignadas a esta UA
 * @param contenidos - Contenidos asignados a esta UA
 * @param config - Configuración opcional de medios/espacios
 * @returns SdA[] con textos completos
 */
export function generarSdAsCompletas(
  ua: UADistribution,
  capacidades: Capacidad[],
  contenidos: Contenido[],
  config: SdAGenerationConfig = DEFAULT_SDA_CONFIG
): SdA[] {
  const criterios = capacidades.flatMap(c => c.criterios);
  const numSdA = ua.sdasAjustadas;
  const sdas: SdA[] = [];

  // Distribute criteria across SdAs (circular)
  const criterioPorSda = criterios.length > 0
    ? Math.max(1, Math.floor(criterios.length / numSdA))
    : 0;

  // Distribute hours
  const duracionBase = Math.floor(ua.horasTotales / numSdA);
  const duracionResto = ua.horasTotales - duracionBase * numSdA;

  // Build content description string for text generation
  const contenidoTexto = contenidos.length > 0
    ? contenidos.map(c => c.descripcion.toLowerCase()).join(', ')
    : 'los contenidos de la unidad';

  for (let i = 0; i < numSdA; i++) {
    // Determine phase
    let fase: FaseSdA;
    if (numSdA === 1) fase = 'Desarrollo';
    else if (i === 0) fase = 'Inicio';
    else if (i === numSdA - 1) fase = 'Cierre';
    else fase = 'Desarrollo';

    // Assign criteria (circular)
    const criteriosAsignados: Criterio[] = [];
    if (criterios.length > 0) {
      const start = i * criterioPorSda;
      for (let k = 0; k < criterioPorSda; k++) {
        criteriosAsignados.push(criterios[(start + k) % criterios.length]);
      }
      // Last SdA gets remaining criteria
      if (i === numSdA - 1) {
        const assigned = new Set(criteriosAsignados.map(c => c.id));
        for (const ce of criterios) {
          if (!assigned.has(ce.id)) {
            criteriosAsignados.push(ce);
            assigned.add(ce.id);
          }
        }
      }
    }

    const duracion = i === numSdA - 1 ? duracionBase + duracionResto : duracionBase;
    const bloom = ua.bloomLevel;

    // Generate title
    const titulo = fase === 'Inicio'
      ? `Introducción y contextualización`
      : fase === 'Cierre'
        ? `Síntesis y evaluación formativa`
        : criteriosAsignados.length > 0
          ? `${criteriosAsignados[0].descripcion.substring(0, 60)}${criteriosAsignados[0].descripcion.length > 60 ? '...' : ''}`
          : `Actividad de desarrollo ${i}`;

    // Generate all text fields
    const estrategia = generarEstrategia({
      bloom,
      contenido: contenidoTexto,
      recursos: config.recursosDefault,
      fase,
    });

    const desarrollo = generarDesarrollo({
      bloom,
      contenido: contenidoTexto,
      duracionHoras: duracion,
      fase,
    });

    const objetivo = generarObjetivoSdA(
      criteriosAsignados.map(c => c.descripcion),
      bloom
    );

    sdas.push({
      id: i + 1,
      numero: i + 1,
      fase,
      titulo,
      objetivo,
      estrategia,
      desarrollo,
      medios: [...config.mediosDefault],
      espacios: config.espacioDefault,
      duracionHoras: duracion,
      ceAsociados: criteriosAsignados.map(c => c.id),
    });
  }

  return sdas;
}

/**
 * Valida la cobertura de criterios de evaluación en las SdAs generadas.
 * Devuelve los IDs de criterios no cubiertos.
 */
export function validarCoberturaCriterios(
  sdas: SdA[],
  criteriosTotales: Criterio[]
): string[] {
  const cubiertos = new Set(sdas.flatMap(s => s.ceAsociados));
  return criteriosTotales
    .filter(ce => !cubiertos.has(ce.id))
    .map(ce => ce.id);
}

/**
 * Calcula estadísticas de una lista de SdAs.
 */
export function estadisticasSdAs(sdas: SdA[]): {
  totalSdAs: number;
  totalHoras: number;
  horasInicio: number;
  horasDesarrollo: number;
  horasCierre: number;
  criteriosCubiertos: number;
} {
  const totalHoras = sdas.reduce((acc, s) => acc + s.duracionHoras, 0);
  const horasInicio = sdas.filter(s => s.fase === 'Inicio').reduce((acc, s) => acc + s.duracionHoras, 0);
  const horasDesarrollo = sdas.filter(s => s.fase === 'Desarrollo').reduce((acc, s) => acc + s.duracionHoras, 0);
  const horasCierre = sdas.filter(s => s.fase === 'Cierre').reduce((acc, s) => acc + s.duracionHoras, 0);
  const criteriosCubiertos = new Set(sdas.flatMap(s => s.ceAsociados)).size;

  return {
    totalSdAs: sdas.length,
    totalHoras,
    horasInicio,
    horasDesarrollo,
    horasCierre,
    criteriosCubiertos,
  };
}
