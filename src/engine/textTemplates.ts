/**
 * ============================================
 * eFPear CertiCalc - Text Templates Engine
 * ============================================
 * Plantillas parametrizadas para generar texto metodológico
 * y de evaluación para SdAs y UAs.
 * 
 * Cada template produce texto formal válido para Anexo IV,
 * justificable ante inspección.
 * 
 * 100% determinístico. Sin dependencias externas.
 * @module textTemplates
 */

import type { BloomLevel, MetodoPrincipal, FaseSdA } from '../types';
import { BLOOM_LABELS, METODO_POR_BLOOM, TECNICA_BASE } from './distributionEngine';

// ============================================
// STRATEGY TEMPLATES (for SdA.estrategia)
// ============================================

interface StrategyParams {
  bloom: BloomLevel;
  contenido: string;
  recursos?: string;
  fase: FaseSdA;
}

const DEFAULT_RECURSOS = 'material audiovisual, documentación técnica y equipamiento del aula-taller';

/**
 * Genera el texto de estrategia metodológica para una SdA.
 */
export function generarEstrategia(params: StrategyParams): string {
  const { bloom, contenido, recursos = DEFAULT_RECURSOS, fase } = params;
  const metodo = METODO_POR_BLOOM[bloom];

  // Fase-specific prefixes
  if (fase === 'Inicio') {
    return `El/la docente, a través del método ${metodo.toLowerCase()}, realizará una introducción contextualizada de ${contenido}. Mediante preguntas activadoras y apoyo de ${recursos}, se explorarán los conocimientos previos del alumnado y se establecerán los objetivos de aprendizaje de la sesión.`;
  }

  if (fase === 'Cierre') {
    return `El/la docente guiará una síntesis de los aprendizajes adquiridos sobre ${contenido}. Se realizará una puesta en común en gran grupo, identificando los conceptos clave y las dificultades encontradas. Se aplicará una evaluación formativa mediante ${bloom >= 4 ? 'rúbrica de autoevaluación' : 'cuestionario de revisión'}.`;
  }

  // Desarrollo — varies by Bloom level
  if (bloom >= 5) {
    return `El/la docente, mediante método activo e interrogativo, planteará una situación profesional real basada en ${contenido}. Con apoyo de ${recursos}, el alumnado diseñará y evaluará una solución técnica, justificando sus decisiones mediante argumentación fundamentada.`;
  }

  if (bloom === 4) {
    return `El/la docente, mediante método activo e interrogativo, planteará una situación real basada en ${contenido}. Con apoyo de ${recursos}, el alumnado realizará el análisis de una solución técnica, identificando variables críticas y relaciones causa-efecto.`;
  }

  if (bloom === 3) {
    return `El/la docente, mediante método demostrativo y con ayuda de ${recursos}, mostrará la secuencia lógica para la ejecución de ${contenido}. El alumnado replicará el procedimiento de forma guiada y posteriormente de forma autónoma.`;
  }

  if (bloom === 2) {
    return `El/la docente, a través del método expositivo-participativo y apoyado de ${recursos}, explicará los fundamentos de ${contenido}. Se emplearán ejemplos comparativos y esquemas que faciliten la comprensión de los conceptos.`;
  }

  // Bloom 1
  return `El/la docente, a través del método expositivo y apoyado de ${recursos}, presentará los conceptos fundamentales de ${contenido}. Se emplearán recursos visuales y repetición estructurada para facilitar la memorización y reconocimiento.`;
}

// ============================================
// DESARROLLO TEMPLATES (for SdA.desarrollo)
// ============================================

interface DesarrolloParams {
  bloom: BloomLevel;
  contenido: string;
  duracionHoras: number;
  fase: FaseSdA;
}

/**
 * Genera el texto de desarrollo (actividades concretas) para una SdA.
 */
export function generarDesarrollo(params: DesarrolloParams): string {
  const { bloom, contenido, duracionHoras, fase } = params;

  if (fase === 'Inicio') {
    return `Actividad de activación (${duracionHoras}h): Lluvia de ideas sobre ${contenido}. Visualización de material introductorio. Establecimiento de objetivos y criterios de evaluación.`;
  }

  if (fase === 'Cierre') {
    return `Actividad de síntesis (${duracionHoras}h): Puesta en común de resultados. Revisión de criterios de evaluación. ${bloom >= 4 ? 'Autoevaluación y coevaluación mediante rúbrica.' : 'Cuestionario de repaso y feedback formativo.'}`;
  }

  // Desarrollo
  if (bloom >= 5) {
    return `Actividad práctica (${duracionHoras}h): Proyecto/caso real sobre ${contenido}. Fases: planificación (20%), ejecución (50%), presentación y evaluación (30%). Trabajo en grupos de 4-5 con roles asignados.`;
  }

  if (bloom === 4) {
    return `Actividad analítica (${duracionHoras}h): Estudio de caso sobre ${contenido}. Análisis individual (30%), debate en grupos de 3-4 (40%), conclusiones en gran grupo (30%).`;
  }

  if (bloom === 3) {
    return `Actividad demostrativa (${duracionHoras}h): Demostración del procedimiento de ${contenido} por el/la docente (30%). Práctica guiada en parejas (40%). Práctica autónoma individual (30%).`;
  }

  return `Actividad expositiva (${duracionHoras}h): Explicación teórica de ${contenido} (50%). Ejercicios de comprensión y clasificación (30%). Resolución de dudas en gran grupo (20%).`;
}

// ============================================
// OBJETIVO TEMPLATES (for SdA.objetivo)
// ============================================

/**
 * Genera el objetivo de una SdA a partir de sus criterios.
 */
export function generarObjetivoSdA(
  criteriosDesc: string[],
  bloom: BloomLevel
): string {
  if (criteriosDesc.length === 0) {
    return `${BLOOM_LABELS[bloom]} los contenidos de la unidad de aprendizaje.`;
  }

  const verboBloom: Record<BloomLevel, string> = {
    1: 'Identificar y reconocer',
    2: 'Comprender y describir',
    3: 'Aplicar y ejecutar',
    4: 'Analizar y relacionar',
    5: 'Evaluar y justificar',
    6: 'Diseñar y crear',
  };

  const verbos = verboBloom[bloom];
  const criterioTexto = criteriosDesc.length === 1
    ? criteriosDesc[0].toLowerCase()
    : criteriosDesc.slice(0, -1).map(c => c.toLowerCase()).join(', ') + ' y ' + criteriosDesc[criteriosDesc.length - 1].toLowerCase();

  return `${verbos} los aspectos relacionados con: ${criterioTexto}.`;
}

// ============================================
// METHODOLOGY SUMMARY (for UA-level text)
// ============================================

interface MetodologiaUAParams {
  uaNumero: number;
  bloom: BloomLevel;
  numSdAs: number;
  numCriterios: number;
  tieneGrupos: boolean;
}

/**
 * Genera el texto de metodología para toda una UA.
 * Versión parametrizada usada por curriculumEngine.
 */
export function generarMetodologiaUA(params: MetodologiaUAParams): string {
  const { uaNumero, bloom, numSdAs, numCriterios, tieneGrupos } = params;
  const metodo = METODO_POR_BLOOM[bloom];
  const tecnica = TECNICA_BASE[metodo];
  const bloomLabel = BLOOM_LABELS[bloom];

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
    `La metodología de la Unidad de Aprendizaje ${uaNumero} se fundamenta en ${razonamiento[metodo]}.`,
    '',
    `El nivel cognitivo predominante es "${bloomLabel}" (Bloom), lo que determina el uso del método ${metodo.toLowerCase()} como eje didáctico principal, complementado con la técnica de ${tecnica.toLowerCase()}.`,
    '',
    `La secuencia didáctica se articula en ${numSdAs} Situaciones de Aprendizaje (SdA), organizadas en tres fases:`,
    '',
    '- **Fase de inicio**: activación de conocimientos previos en gran grupo, establecimiento de objetivos y contextualización del aprendizaje.',
    `- **Fase de desarrollo**: ${textoActividades}, centradas en la resolución de tareas vinculadas a ${numCriterios} criterio(s) de evaluación.`,
    '- **Fase de cierre**: síntesis en gran grupo, explicitación de aprendizajes logrados y feedback formativo.',
    '',
    'Este diseño respeta los principios metodológicos de organización, orientación, finalidad, adecuación y economía recogidos en la programación didáctica del módulo formativo.',
  ].join('\n');
}

// ============================================
// EVALUATION SUMMARY (for UA-level text)
// ============================================

interface EvaluacionUAParams {
  uaNumero: number;
  bloom: BloomLevel;
  numCapacidades: number;
  criterios: Array<{ id: string; descripcion: string }>;
}

/**
 * Genera el texto de evaluación para toda una UA.
 */
export function generarEvaluacionUA(params: EvaluacionUAParams): string {
  const { uaNumero, bloom, numCapacidades, criterios } = params;

  const instrumentos: Record<BloomLevel, string[]> = {
    1: ['Cuestionario tipo test', 'Prueba escrita de respuesta corta'],
    2: ['Prueba escrita de desarrollo', 'Mapa conceptual'],
    3: ['Lista de cotejo de práctica', 'Rúbrica de ejecución'],
    4: ['Estudio de caso con rúbrica', 'Informe analítico'],
    5: ['Rúbrica de evaluación entre pares', 'Defensa oral ante grupo'],
    6: ['Rúbrica de proyecto final', 'Portfolio de evidencias'],
  };

  const instrumentosUA = instrumentos[bloom] || instrumentos[3];

  return [
    `La evaluación de la Unidad de Aprendizaje ${uaNumero} se realiza de forma continua e integradora, verificando la adquisición de ${numCapacidades} capacidad(es) profesional(es) a través de ${criterios.length} criterio(s) de evaluación.`,
    '',
    '**Instrumentos de evaluación:**',
    ...instrumentosUA.map(inst => `- ${inst}`),
    '',
    '**Criterios de evaluación asociados:**',
    ...criterios.map(ce => `- ${ce.id}: ${ce.descripcion}`),
    '',
    'La calificación se obtiene mediante la valoración conjunta de los criterios de evaluación, requiriéndose un dominio suficiente de cada uno de ellos para considerar superada la unidad de aprendizaje.',
  ].join('\n');
}
