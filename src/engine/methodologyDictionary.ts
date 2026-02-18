/**
 * Diccionario Metodologico v1.2
 *
 * Base de conocimiento pedagogico del sistema.
 * Mapea niveles Bloom a estrategias metodologicas con plantillas de texto
 * enriquecidas, alineadas con SSCE0110.
 *
 * Cada estrategia contiene:
 * - Plantillas con placeholders {contenido} y {ce_principal}
 * - Fases sugeridas (Inicio/Desarrollo/Cierre)
 * - Duracion base y recursos
 *
 * @module methodologyDictionary
 */

import type {
  BloomLevel,
  EstrategiaMetodologica,
  MetodoDidactico,
} from '../types/sda';

// ============================================
// ESTRATEGIAS BASE
// ============================================

/** Expositivo basico — Bloom 1-2 (Recordar, Comprender) */
const EXPOSITIVO_BASICO: EstrategiaMetodologica = {
  id: 'EXPOSITIVO_BASICO',
  metodo: 'Expositivo',
  fasesSugeridas: ['Inicio', 'Desarrollo'],
  nombresActividad: [
    'Presentacion de {contenido}',
    'Introduccion a {contenido}',
    'Contextualizacion de {contenido}',
    'Marco conceptual de {contenido}',
  ],
  plantillaObjetivo:
    'Conocer y comprender los fundamentos de {contenido}, identificando los conceptos clave y su relacion con el entorno profesional ({ce_principal}).',
  plantillaMetodologia:
    'Metodo expositivo participativo. El/la docente presenta los contenidos clave mediante exposicion oral apoyada en recursos audiovisuales, intercalando preguntas abiertas al grupo para verificar la comprension. Se facilita material de referencia para consulta posterior.',
  plantillaDesarrollo:
    '1. El/la docente introduce el tema de {contenido} contextualizando su relevancia en el ambito profesional (10 min).\n2. Exposicion de los conceptos fundamentales con apoyo de presentacion multimedia y ejemplos reales del sector (30 min).\n3. Ronda de preguntas y aclaraciones, fomentando la participacion activa del alumnado (15 min).\n4. Sintesis de los puntos clave y entrega de material complementario de referencia (5 min).',
  recursosSugeridos: [
    'Presentacion multimedia',
    'Pizarra digital / proyector',
    'Material de referencia impreso o digital',
    'Documentacion tecnica del sector',
  ],
  duracionBase: 1.5,
};

/** Expositivo con debate — Bloom 2 (Comprender) */
const EXPOSITIVO_DEBATE: EstrategiaMetodologica = {
  id: 'EXPOSITIVO_DEBATE',
  metodo: 'Expositivo',
  fasesSugeridas: ['Desarrollo'],
  nombresActividad: [
    'Debate dirigido sobre {contenido}',
    'Foro de discusion: {contenido}',
    'Analisis grupal de {contenido}',
  ],
  plantillaObjetivo:
    'Comprender y analizar críticamente {contenido} mediante la discusion guiada, desarrollando la capacidad de argumentacion en relacion con {ce_principal}.',
  plantillaMetodologia:
    'Metodo expositivo combinado con debate dirigido. Tras una breve exposicion introductoria, se plantean cuestiones abiertas que el grupo debate bajo la moderacion del/la docente. Se fomenta la escucha activa, la argumentacion fundamentada y el contraste de opiniones.',
  plantillaDesarrollo:
    '1. Breve exposicion del marco teorico de {contenido} (15 min).\n2. Planteamiento de preguntas-guia para el debate (5 min).\n3. Debate moderado en gran grupo, con turnos de palabra y registro de aportaciones (25 min).\n4. Sintesis de conclusiones y conexion con la practica profesional (15 min).',
  recursosSugeridos: [
    'Presentacion multimedia',
    'Fichas con preguntas-guia',
    'Pizarra para registro de ideas',
    'Casos reales del sector para debate',
  ],
  duracionBase: 1.5,
};

/** Interrogativo — Bloom 2-3 (Comprender, Aplicar) */
const INTERROGATIVO_CASO: EstrategiaMetodologica = {
  id: 'INTERROGATIVO_CASO',
  metodo: 'Interrogativo',
  fasesSugeridas: ['Desarrollo'],
  nombresActividad: [
    'Estudio de caso: {contenido}',
    'Analisis de caso practico sobre {contenido}',
    'Resolucion de supuesto: {contenido}',
  ],
  plantillaObjetivo:
    'Aplicar los conocimientos adquiridos sobre {contenido} al analisis de un caso practico real, ejercitando el razonamiento critico ({ce_principal}).',
  plantillaMetodologia:
    'Metodo interrogativo basado en estudio de caso. Se presenta un caso real o simulado del sector profesional y el alumnado, en grupos reducidos, analiza la situacion, identifica problemas y propone soluciones, guiados por preguntas orientadoras del/la docente.',
  plantillaDesarrollo:
    '1. Presentacion del caso practico vinculado a {contenido} (10 min).\n2. Lectura individual y analisis de las preguntas guia (10 min).\n3. Trabajo en grupos reducidos (3-4 personas): analisis, debate interno y propuesta de solucion (30 min).\n4. Puesta en comun: cada grupo expone sus conclusiones; el/la docente facilita el debate y aporta feedback (20 min).\n5. Cierre con sintesis de aprendizajes y conexion con {ce_principal} (10 min).',
  recursosSugeridos: [
    'Ficha del caso practico',
    'Preguntas orientadoras',
    'Material de apoyo normativo/tecnico',
    'Plantilla de resolucion',
  ],
  duracionBase: 2,
};

/** Demostrativo — Bloom 3 (Aplicar) */
const DEMOSTRATIVO_TALLER: EstrategiaMetodologica = {
  id: 'DEMOSTRATIVO_TALLER',
  metodo: 'Demostrativo',
  fasesSugeridas: ['Desarrollo'],
  nombresActividad: [
    'Taller practico: {contenido}',
    'Practica guiada de {contenido}',
    'Simulacion de {contenido}',
    'Ejercicio practico: {contenido}',
  ],
  plantillaObjetivo:
    'Ejecutar de manera guiada las tecnicas y procedimientos de {contenido}, demostrando la adquisicion de competencias practicas ({ce_principal}).',
  plantillaMetodologia:
    'Metodo demostrativo en cuatro fases: el/la docente demuestra el procedimiento completo, luego el alumnado lo reproduce paso a paso con asistencia, a continuacion lo practica de forma autonoma y finalmente se revisan los resultados. Se trabaja en grupos reducidos para asegurar atencion individualizada.',
  plantillaDesarrollo:
    '1. Demostracion completa por el/la docente del procedimiento de {contenido}, explicando cada paso y los criterios de calidad (15 min).\n2. Reproduccion guiada: el alumnado replica el proceso paso a paso, con supervision directa (25 min).\n3. Practica autonoma: el alumnado repite el ejercicio sin asistencia directa, consolidando la tecnica (25 min).\n4. Revision de resultados: feedback individual y grupal, identificacion de errores comunes y buenas practicas (15 min).',
  recursosSugeridos: [
    'Equipamiento del aula-taller',
    'Material fungible necesario',
    'Ficha de procedimiento paso a paso',
    'Checklist de calidad/autocomprobacion',
  ],
  duracionBase: 2,
};

/** Demostrativo con rol-play — Bloom 3-4 (Aplicar, Analizar) */
const DEMOSTRATIVO_ROLEPLAY: EstrategiaMetodologica = {
  id: 'DEMOSTRATIVO_ROLEPLAY',
  metodo: 'Demostrativo',
  fasesSugeridas: ['Desarrollo'],
  nombresActividad: [
    'Role-play: {contenido}',
    'Simulacion de situacion profesional: {contenido}',
    'Dramatizacion: {contenido}',
  ],
  plantillaObjetivo:
    'Aplicar y analizar las competencias de {contenido} en un contexto simulado que reproduce situaciones profesionales reales ({ce_principal}).',
  plantillaMetodologia:
    'Metodo demostrativo mediante simulacion/role-play. Se asignan roles profesionales al alumnado, que debe resolver una situacion realista aplicando los conocimientos adquiridos. El resto del grupo observa y evalua segun criterios predefinidos. Cierre con analisis grupal.',
  plantillaDesarrollo:
    '1. Presentacion del escenario profesional vinculado a {contenido} y asignacion de roles (10 min).\n2. Preparacion: los participantes revisan su rol y planifican su actuacion (10 min).\n3. Ejecucion de la simulacion ante el grupo (20 min).\n4. Analisis colectivo: el grupo observador aporta feedback usando la ficha de evaluacion; el/la docente sintetiza y conecta con {ce_principal} (20 min).',
  recursosSugeridos: [
    'Fichas de roles y escenario',
    'Ficha de observacion/evaluacion para observadores',
    'Material ambientador (opcional)',
    'Camara para grabacion (opcional, analisis posterior)',
  ],
  duracionBase: 1.5,
};

/** Descubrimiento — Bloom 4-5 (Analizar, Evaluar) */
const DESCUBRIMIENTO_PROYECTO: EstrategiaMetodologica = {
  id: 'DESCUBRIMIENTO_PROYECTO',
  metodo: 'Descubrimiento',
  fasesSugeridas: ['Desarrollo'],
  nombresActividad: [
    'Proyecto: {contenido}',
    'Proyecto integrador: {contenido}',
    'Trabajo de investigacion: {contenido}',
  ],
  plantillaObjetivo:
    'Analizar, disenar y evaluar una propuesta original relacionada con {contenido}, integrando conocimientos de forma autonoma y critica ({ce_principal}).',
  plantillaMetodologia:
    'Metodo por descubrimiento / Aprendizaje Basado en Proyectos (ABP). El alumnado, en grupos de trabajo, desarrolla un proyecto real o simulado que integra multiples conocimientos. El/la docente actua como facilitador/a, proporcionando recursos, resolviendo dudas y marcando hitos intermedios.',
  plantillaDesarrollo:
    '1. Presentacion del reto/proyecto vinculado a {contenido} y formacion de equipos (15 min).\n2. Fase de investigacion y planificacion: los equipos recopilan informacion, distribuyen tareas y disenan su propuesta (40 min).\n3. Fase de desarrollo: ejecucion del proyecto con hitos de revision intermedios por el/la docente (60 min, distribuidos en sesiones).\n4. Presentacion de resultados ante el grupo (20 min por equipo).\n5. Evaluacion colectiva con rubrica y reflexion sobre aprendizajes adquiridos y su conexion con {ce_principal} (15 min).',
  recursosSugeridos: [
    'Guia del proyecto / brief',
    'Rubrica de evaluacion',
    'Acceso a fuentes de informacion (internet, biblioteca)',
    'Materiales y herramientas segun el proyecto',
    'Plantilla de planificacion de proyecto',
  ],
  duracionBase: 3,
};

/** Descubrimiento — analisis critico — Bloom 4-5 */
const DESCUBRIMIENTO_ANALISIS: EstrategiaMetodologica = {
  id: 'DESCUBRIMIENTO_ANALISIS',
  metodo: 'Descubrimiento',
  fasesSugeridas: ['Desarrollo', 'Cierre'],
  nombresActividad: [
    'Analisis critico de {contenido}',
    'Evaluacion comparativa: {contenido}',
    'Diagnostico y propuesta de mejora: {contenido}',
  ],
  plantillaObjetivo:
    'Evaluar criticamente practicas actuales de {contenido}, identificando fortalezas y debilidades, y proponiendo mejoras fundamentadas ({ce_principal}).',
  plantillaMetodologia:
    'Metodo por descubrimiento mediante analisis critico. El alumnado examina un caso, proceso o producto real del sector, identifica puntos fuertes y areas de mejora, y elabora una propuesta de optimizacion. Se trabaja tanto individual como grupalmente.',
  plantillaDesarrollo:
    '1. Presentacion del objeto de analisis relacionado con {contenido} (10 min).\n2. Analisis individual: cada alumno/a examina el caso usando una ficha guia (20 min).\n3. Puesta en comun en pequenos grupos: contraste de analisis y elaboracion de diagnostico conjunto (20 min).\n4. Elaboracion de propuesta de mejora fundamentada (20 min).\n5. Exposicion de propuestas y debate, con feedback del/la docente vinculando a {ce_principal} (20 min).',
  recursosSugeridos: [
    'Caso/proceso/producto para analizar',
    'Ficha guia de analisis',
    'Plantilla de diagnostico y propuesta de mejora',
    'Rubrica de evaluacion',
  ],
  duracionBase: 2,
};

/** Sintesis y cierre — cualquier Bloom */
const CIERRE_SINTESIS: EstrategiaMetodologica = {
  id: 'CIERRE_SINTESIS',
  metodo: 'Interrogativo',
  fasesSugeridas: ['Cierre'],
  nombresActividad: [
    'Sintesis y evaluacion: {contenido}',
    'Recapitulacion y autoevaluacion: {contenido}',
    'Cierre formativo: {contenido}',
  ],
  plantillaObjetivo:
    'Sintetizar los aprendizajes adquiridos sobre {contenido} y autoevaluar el grado de consecucion de los objetivos formativos ({ce_principal}).',
  plantillaMetodologia:
    'Metodo interrogativo aplicado al cierre formativo. Se realiza una recapitulacion dialogada de los contenidos trabajados, seguida de una actividad de autoevaluacion que permite al alumnado identificar fortalezas y areas de refuerzo.',
  plantillaDesarrollo:
    '1. Recapitulacion dialogada: el/la docente plantea preguntas clave sobre {contenido} y el grupo reconstruye colectivamente los conceptos principales (15 min).\n2. Actividad de autoevaluacion individual (cuestionario, mapa conceptual o ficha reflexiva) (15 min).\n3. Puesta en comun de resultados y resolucion de dudas finales (10 min).\n4. Orientacion para el estudio autonomo y anticipacion de contenidos siguientes (5 min).',
  recursosSugeridos: [
    'Cuestionario de autoevaluacion',
    'Mapa conceptual o esquema de sintesis',
    'Ficha reflexiva',
    'Pizarra para recapitulacion visual',
  ],
  duracionBase: 1,
};

/** Inicio y activacion — cualquier Bloom */
const INICIO_ACTIVACION: EstrategiaMetodologica = {
  id: 'INICIO_ACTIVACION',
  metodo: 'Interrogativo',
  fasesSugeridas: ['Inicio'],
  nombresActividad: [
    'Activacion de conocimientos previos: {contenido}',
    'Dinamica de inicio: {contenido}',
    'Exploracion inicial: {contenido}',
  ],
  plantillaObjetivo:
    'Activar los conocimientos previos del alumnado sobre {contenido} y establecer las bases de partida para el desarrollo de la unidad ({ce_principal}).',
  plantillaMetodologia:
    'Metodo interrogativo de activacion. Se inicia con una dinamica grupal (lluvia de ideas, cuestionario diagnostico o debate breve) que permite al/la docente evaluar el punto de partida del grupo y al alumnado conectar sus experiencias previas con los nuevos contenidos.',
  plantillaDesarrollo:
    '1. Bienvenida y presentacion de los objetivos de la unidad (5 min).\n2. Dinamica de activacion: lluvia de ideas / cuestionario rapido sobre {contenido} (15 min).\n3. Recogida de resultados y comentario del/la docente sobre el nivel de partida del grupo (10 min).\n4. Presentacion del itinerario formativo de la unidad y vinculacion con {ce_principal} (10 min).',
  recursosSugeridos: [
    'Cuestionario diagnostico (papel o digital)',
    'Pizarra/post-its para lluvia de ideas',
    'Presentacion con objetivos de la unidad',
  ],
  duracionBase: 1,
};

// ============================================
// BLOOM → STRATEGIES MAP
// ============================================

/**
 * Mapeo de niveles Bloom a estrategias disponibles.
 * - Bloom 1-2 (Bajo): Expositivo + Interrogativo basico
 * - Bloom 3 (Medio): Demostrativo + Aplicacion
 * - Bloom 4-5 (Alto): Descubrimiento + Proyecto + Analisis critico
 *
 * INICIO_ACTIVACION y CIERRE_SINTESIS estan disponibles en todos los niveles.
 */
export const BLOOM_TO_STRATEGIES: Record<BloomLevel, EstrategiaMetodologica[]> = {
  1: [INICIO_ACTIVACION, EXPOSITIVO_BASICO, EXPOSITIVO_DEBATE, CIERRE_SINTESIS],
  2: [INICIO_ACTIVACION, EXPOSITIVO_BASICO, EXPOSITIVO_DEBATE, INTERROGATIVO_CASO, CIERRE_SINTESIS],
  3: [INICIO_ACTIVACION, DEMOSTRATIVO_TALLER, DEMOSTRATIVO_ROLEPLAY, INTERROGATIVO_CASO, CIERRE_SINTESIS],
  4: [INICIO_ACTIVACION, DESCUBRIMIENTO_PROYECTO, DESCUBRIMIENTO_ANALISIS, DEMOSTRATIVO_ROLEPLAY, CIERRE_SINTESIS],
  5: [INICIO_ACTIVACION, DESCUBRIMIENTO_PROYECTO, DESCUBRIMIENTO_ANALISIS, CIERRE_SINTESIS],
};

/**
 * Obtiene estrategias filtradas por fase para un nivel Bloom dado.
 */
export function getStrategiesForBloomAndPhase(
  bloom: BloomLevel,
  fase: import('../types/sda').Fase
): EstrategiaMetodologica[] {
  const all = BLOOM_TO_STRATEGIES[bloom] || BLOOM_TO_STRATEGIES[3];
  return all.filter(s => s.fasesSugeridas.includes(fase));
}
