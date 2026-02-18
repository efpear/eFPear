/**
 * ============================================
 * eFPear CertiCalc - Curriculum Engine
 * ============================================
 * Pipeline curricular determinístico de 7 pasos:
 *   1. Modelo de datos BOE (types/index.ts)
 *   2. Distribución MF → UA via Bloom (distributionEngine)
 *   3. Mapeo capacidades → UA (circular secuencial)
 *   4. Mapeo contenidos → UA (proporcional por horas)
 *   5. Generación de SdA por UA (criterios + fases + Bloom)
 *   6. Generador de texto metodología (parametrizado)
 *   7. Output final para Anexo IV
 *
 * REGLAS:
 *   - 100% determinístico: misma entrada → misma salida
 *   - Justificable ante inspección
 *   - Sin dependencias externas (React-free, API-free)
 *   - Consume distributionEngine como única dependencia interna
 *
 * @module curriculumEngine
 */

import type {
  BloomLevel,
  MetodoPrincipal,
  FaseSdA,
  Certificado,
  ModuloFormativo,
  Capacidad,
  Criterio,
  Contenido,
} from '../types';

import type {
  UADistribution,
  DistributionResult,
  DistributionConfig,
} from './distributionEngine';

import {
  calcularDistribucionPedagogicaConBloom,
  sugerirBloomPorNivel,
  METODO_POR_BLOOM,
  TECNICA_BASE,
  BLOOM_LABELS,
} from './distributionEngine';

// ============================================
// SdA (Engine-specific, extends base SdA)
// ============================================

export interface EngineSdA {
  numero: number;
  fase: FaseSdA;
  criterios: Criterio[];
  contenidos: Contenido[];
  metodo: MetodoPrincipal;
  tecnica: string;
  agrupacion: string;
  duracionHoras: number;
}

// ============================================
// UA COMPLETA
// ============================================

export interface UACompleta {
  numero: number;
  horasTotales: number;
  bloomLevel: BloomLevel;
  bloomLabel: string;
  metodoPrincipal: MetodoPrincipal;
  tecnicaBase: string;
  agrupacionSugerida: string;
  capacidades: Capacidad[];
  contenidos: Contenido[];
  sdas: EngineSdA[];
  textoMetodologia: string;
  textoEvaluacion: string;
}

export interface CurriculumResult {
  modulo: { codigo: string; titulo: string; horas: number };
  distribucion: DistributionResult;
  uas: UACompleta[];
  resumen: {
    totalUAs: number;
    totalSdAs: number;
    totalCapacidadesAsignadas: number;
    totalCriteriosAsignados: number;
    totalContenidosAsignados: number;
    coberturaCriterios: number;
  };
  generadoEn: string;
}

export interface AnexoIVData {
  certificado: { codigo: string; nombre: string; nivel: 1 | 2 | 3 };
  modulos: CurriculumResult[];
  generadoEn: string;
}

// ============================================
// PASO 3: MAPEO CAPACIDADES → UA (circular)
// ============================================

export function asignarCapacidadesAUA(
  capacidades: Capacidad[],
  numeroUA: number
): Capacidad[][] {
  if (numeroUA <= 0) throw new Error('Número de UAs debe ser positivo');
  if (capacidades.length === 0) return Array.from({ length: numeroUA }, () => []);
  const result: Capacidad[][] = Array.from({ length: numeroUA }, () => []);
  capacidades.forEach((cap, index) => {
    result[index % numeroUA].push(cap);
  });
  return result;
}

// ============================================
// PASO 4: MAPEO CONTENIDOS → UA (proporcional)
// ============================================

export function asignarContenidosAUA(
  contenidos: Contenido[],
  uas: UADistribution[]
): Contenido[][] {
  if (uas.length === 0) throw new Error('Debe haber al menos 1 UA');
  if (contenidos.length === 0) return Array.from({ length: uas.length }, () => []);

  const totalContenidos = contenidos.length;
  const totalHoras = uas.reduce((acc, ua) => acc + ua.horasTotales, 0);
  const resultado: Contenido[][] = Array.from({ length: uas.length }, () => []);
  let cursor = 0;

  uas.forEach((ua, i) => {
    if (i === uas.length - 1) {
      resultado[i] = contenidos.slice(cursor);
      return;
    }
    const cuota = Math.max(1, Math.round((ua.horasTotales / totalHoras) * totalContenidos));
    resultado[i] = contenidos.slice(cursor, cursor + cuota);
    cursor += cuota;
  });

  return resultado;
}

// ============================================
// PASO 5: GENERADOR DE SdA
// ============================================

export function generarSdAParaUA(
  ua: UADistribution,
  capacidadesUA: Capacidad[],
  contenidosUA: Contenido[]
): EngineSdA[] {
  const criterios = capacidadesUA.flatMap(c => c.criterios);
  const numSdA = ua.sdasAjustadas;
  const sdas: EngineSdA[] = [];

  const criterioPorSda = criterios.length > 0
    ? Math.max(1, Math.floor(criterios.length / numSdA))
    : 0;

  const duracionBase = Math.floor(ua.horasTotales / numSdA);
  const duracionResto = ua.horasTotales - duracionBase * numSdA;

  for (let i = 0; i < numSdA; i++) {
    let fase: FaseSdA;
    if (numSdA === 1) fase = 'Desarrollo';
    else if (i === 0) fase = 'Inicio';
    else if (i === numSdA - 1) fase = 'Cierre';
    else fase = 'Desarrollo';

    const criteriosAsignados: Criterio[] = [];
    if (criterios.length > 0) {
      for (let k = 0; k < criterioPorSda; k++) {
        criteriosAsignados.push(criterios[(i * criterioPorSda + k) % criterios.length]);
      }
    }

    sdas.push({
      numero: i + 1,
      fase,
      criterios: criteriosAsignados,
      contenidos: contenidosUA,
      metodo: ua.metodoPrincipal,
      tecnica: ua.tecnicaBase,
      agrupacion: fase === 'Inicio' || fase === 'Cierre' ? 'Gran grupo' : ua.agrupacionSugerida,
      duracionHoras: i === numSdA - 1 ? duracionBase + duracionResto : duracionBase,
    });
  }

  return sdas;
}

// ============================================
// PASO 6: TEXTO METODOLOGÍA + EVALUACIÓN
// ============================================

export function generarTextoMetodologiaUA(ua: UACompleta): string {
  const metodo = ua.metodoPrincipal;
  const numSdAs = ua.sdas.length;
  const tieneGrupos = ua.sdas.some(s => s.agrupacion.includes('Grupos'));
  const numCriterios = ua.capacidades.flatMap(c => c.criterios).length;

  const razonamiento: Record<MetodoPrincipal, string> = {
    'Expositivo': 'un enfoque deductivo, partiendo de los conceptos generales hacia la aplicación particular',
    'Demostrativo': 'un enfoque inductivo-demostrativo, donde la observación de la práctica guía la comprensión teórica',
    'Interrogativo': 'un enfoque analítico-interrogativo, estimulando la reflexión crítica sobre casos reales',
    'Descubrimiento': 'un enfoque de descubrimiento guiado, donde el alumnado construye conocimiento mediante la experimentación',
    'Proyecto': 'un enfoque de aprendizaje basado en proyectos (ABP), integrando teoría y práctica en un producto final',
  };

  const textoActividades = tieneGrupos
    ? 'trabajo en pequeños grupos (3-4 personas) y actividades individuales'
    : 'actividades en gran grupo con participación activa';

  return [
    `La metodología de la Unidad de Aprendizaje ${ua.numero} se fundamenta en ${razonamiento[metodo]}.`,
    ``,
    `El nivel cognitivo predominante es "${ua.bloomLabel}" (Bloom), lo que determina el uso del método ${metodo.toLowerCase()} como eje didáctico principal, complementado con la técnica de ${ua.tecnicaBase.toLowerCase()}.`,
    ``,
    `La secuencia didáctica se articula en ${numSdAs} Situaciones de Aprendizaje (SdA), organizadas en tres fases:`,
    ``,
    `- **Fase de inicio**: activación de conocimientos previos en gran grupo, establecimiento de objetivos y contextualización del aprendizaje.`,
    `- **Fase de desarrollo**: ${textoActividades}, centradas en la resolución de tareas vinculadas a ${numCriterios} criterio(s) de evaluación.`,
    `- **Fase de cierre**: síntesis en gran grupo, explicitación de aprendizajes logrados y feedback formativo.`,
    ``,
    `Este diseño respeta los principios metodológicos de organización, orientación, finalidad, adecuación y economía recogidos en la programación didáctica del módulo formativo.`,
  ].join('\n');
}

export function generarTextoEvaluacionUA(ua: UACompleta): string {
  const criterios = ua.capacidades.flatMap(c => c.criterios);
  const numCriterios = criterios.length;
  const numCapacidades = ua.capacidades.length;

  const instrumentos: Record<BloomLevel, string[]> = {
    1: ['Cuestionario tipo test', 'Prueba escrita de respuesta corta'],
    2: ['Prueba escrita de desarrollo', 'Mapa conceptual'],
    3: ['Lista de cotejo de práctica', 'Rúbrica de ejecución'],
    4: ['Estudio de caso con rúbrica', 'Informe analítico'],
    5: ['Rúbrica de evaluación entre pares', 'Defensa oral ante grupo'],
    6: ['Rúbrica de proyecto final', 'Portfolio de evidencias'],
  };

  const instrumentosUA = instrumentos[ua.bloomLevel] || instrumentos[3];

  return [
    `La evaluación de la Unidad de Aprendizaje ${ua.numero} se realiza de forma continua e integradora, verificando la adquisición de ${numCapacidades} capacidad(es) profesional(es) a través de ${numCriterios} criterio(s) de evaluación.`,
    ``,
    `**Instrumentos de evaluación:**`,
    ...instrumentosUA.map(inst => `- ${inst}`),
    ``,
    `**Criterios de evaluación asociados:**`,
    ...criterios.map(ce => `- ${ce.id}: ${ce.descripcion}`),
    ``,
    `La calificación se obtiene mediante la valoración conjunta de los criterios de evaluación, requiriéndose un dominio suficiente de cada uno de ellos para considerar superada la unidad de aprendizaje.`,
  ].join('\n');
}

// ============================================
// PASO 7: PIPELINE COMPLETO
// ============================================

export function procesarModuloFormativo(
  mf: ModuloFormativo,
  nivelCertificado: 1 | 2 | 3,
  bloomOverride?: BloomLevel[],
  configOverride?: Partial<DistributionConfig>
): CurriculumResult {
  const distribucion = calcularDistribucionPedagogicaConBloom(
    mf.horas, bloomOverride, configOverride
  );

  const capacidadesPorUA = asignarCapacidadesAUA(mf.capacidades, distribucion.totalUAs);
  const contenidosPorUA = asignarContenidosAUA(mf.contenidos, distribucion.uas);

  const uasCompletas: UACompleta[] = distribucion.uas.map((uaDist, i) => {
    const capacidades = capacidadesPorUA[i];
    const contenidos = contenidosPorUA[i];
    const sdas = generarSdAParaUA(uaDist, capacidades, contenidos);

    const uaCompleta: UACompleta = {
      numero: uaDist.numero,
      horasTotales: uaDist.horasTotales,
      bloomLevel: uaDist.bloomLevel,
      bloomLabel: uaDist.bloomLabel,
      metodoPrincipal: uaDist.metodoPrincipal,
      tecnicaBase: uaDist.tecnicaBase,
      agrupacionSugerida: uaDist.agrupacionSugerida,
      capacidades, contenidos, sdas,
      textoMetodologia: '',
      textoEvaluacion: '',
    };

    uaCompleta.textoMetodologia = generarTextoMetodologiaUA(uaCompleta);
    uaCompleta.textoEvaluacion = generarTextoEvaluacionUA(uaCompleta);

    return uaCompleta;
  });

  const todosLosCriterios = mf.capacidades.flatMap(c => c.criterios);
  const criteriosEnSdAs = new Set<string>();
  uasCompletas.forEach(ua => {
    ua.sdas.forEach(sda => {
      sda.criterios.forEach(ce => criteriosEnSdAs.add(ce.id));
    });
  });

  return {
    modulo: { codigo: mf.codigo, titulo: mf.titulo, horas: mf.horas },
    distribucion,
    uas: uasCompletas,
    resumen: {
      totalUAs: uasCompletas.length,
      totalSdAs: uasCompletas.reduce((acc, ua) => acc + ua.sdas.length, 0),
      totalCapacidadesAsignadas: mf.capacidades.length,
      totalCriteriosAsignados: todosLosCriterios.length,
      totalContenidosAsignados: mf.contenidos.length,
      coberturaCriterios: todosLosCriterios.length > 0
        ? Math.round((criteriosEnSdAs.size / todosLosCriterios.length) * 100) : 100,
    },
    generadoEn: new Date().toISOString(),
  };
}

export function procesarCertificadoCompleto(
  certificado: Certificado,
  bloomOverrides?: Record<string, BloomLevel[]>,
  configOverride?: Partial<DistributionConfig>
): AnexoIVData {
  return {
    certificado: { codigo: certificado.codigo, nombre: certificado.nombre, nivel: certificado.nivel },
    modulos: certificado.modulos.map(mf =>
      procesarModuloFormativo(mf, certificado.nivel, bloomOverrides?.[mf.codigo], configOverride)
    ),
    generadoEn: new Date().toISOString(),
  };
}
