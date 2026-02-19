/**
 * Golden Sample — UF0048 (INCUAL Canonical Format)
 *
 * Certificado: HOTA0308 Recepción en Alojamientos
 * Módulo: MF0265_3 Gestión de departamentos del área de alojamiento (120h)
 * UF: UF0048 Procesos de gestión de departamentos del área de alojamiento (70h)
 *
 * This file uses INCUAL canonical types. All text is literal BOE.
 * Used as the backtesting reference for the Anexo IV mapper.
 */

import type {
  AnexoIV_Completo,
  Capacidad_C,
  BloqueContenido_BOE,
  SituacionDeAprendizaje_SdA,
} from '../../types/incual';

// ============================================
// ALL CAPACIDADES FOR THIS UF (full BOE list)
// ============================================

export const CAPACIDADES_UF0048: Capacidad_C[] = [
  {
    id: 'C1',
    texto_literal: 'Analizar la función y el proceso de planificación empresarial y definir planes que resulten adecuados para áreas y departamentos de alojamiento.',
    criterios_evaluacion: [
      { id: 'CE1.1', texto_literal: 'Justificar la importancia de la planificación en el proceso de administración de empresas o entidades.', tipologia: 'habilidad_personal_social' },
      { id: 'CE1.2', texto_literal: 'Diferenciar los principales tipos de planes, empresariales.', tipologia: 'conocimiento' },
      { id: 'CE1.3', texto_literal: 'Describir las fases y pasos lógicos de un proceso de planificación como enfoque racional para establecer objetivos, tomar decisiones y seleccionar medios.', tipologia: 'conocimiento' },
      { id: 'CE1.4', texto_literal: 'Identificar los elementos básicos para establecer un proceso de dirección por objetivos.', tipologia: 'conocimiento' },
      { id: 'CE1.5', texto_literal: 'En supuestos prácticos de alojamientos: formular objetivos para un área de alojamiento determinada en el marco de hipotéticos planes generales de empresa o entidad; seleccionar las opciones de actuación más convenientes para la consecución de los objetivos propuestos; plantear los programas que se deriven de tales opciones, determinando los medios humanos y materiales necesarios.', tipologia: 'destreza_cognitiva_practica' },
      { id: 'CE1.6', texto_literal: 'Justificar propuestas para la elaboración de planes de emergencia adaptados a distintos tipos de alojamientos.', tipologia: 'destreza_cognitiva_practica' },
      { id: 'CE1.7', texto_literal: 'Argumentar la importancia de la revisión periódica de los planes en función de la aplicación de los sistemas de control característicos de cada tipo de alojamiento.', tipologia: 'habilidad_personal_social' },
    ],
  },
  {
    id: 'C2',
    texto_literal: 'Analizar la gestión y control presupuestarios en el marco de las áreas de alojamiento de establecimientos turísticos y no turísticos, identificar costes y elaborar presupuestos económicos que permitan establecer programas de actuación.',
    criterios_evaluacion: [
      { id: 'CE2.1', texto_literal: 'Identificar los tipos de costes empresariales y comparar estructuras de costes de distintos tipos de áreas de alojamientos.', tipologia: 'conocimiento' },
      { id: 'CE2.2', texto_literal: 'Calcular costes totales unitarios y márgenes con respecto a los precios de venta de diferentes servicios de alojamiento.', tipologia: 'destreza_cognitiva_practica' },
      { id: 'CE2.3', texto_literal: 'Justificar la gestión presupuestaria como subfunción empresarial vinculada a las de planificación y control.', tipologia: 'conocimiento' },
      { id: 'CE2.4', texto_literal: 'Diferenciar los tipos de presupuestos más utilizados en las actividades de alojamiento, expresando los objetivos de cada uno de ellos y describiendo la estructura y las partidas que los componen.', tipologia: 'conocimiento' },
      { id: 'CE2.5', texto_literal: 'Identificar las variables que se deben tener en cuenta en la confección de presupuestos.', tipologia: 'conocimiento' },
      { id: 'CE2.6', texto_literal: 'En situaciones prácticas de gestión presupuestaria: elaborar presupuestos económicos para establecer programas de actuación; determinar los costes de los distintos recursos; calcular el punto muerto de explotación y los niveles de productividad.', tipologia: 'destreza_cognitiva_practica' },
      { id: 'CE2.7', texto_literal: 'En casos prácticos de gestión y control presupuestario: calcular las desviaciones; analizar las causas de su aparición y los efectos que producen; proponer soluciones alternativas, estableciendo métodos de seguimiento y control presupuestarios.', tipologia: 'destreza_cognitiva_practica' },
      { id: 'CE2.8', texto_literal: 'Justificar la necesidad de intervenir en los procesos de control económico del área de alojamiento con un alto sentido de la responsabilidad y honradez personales.', tipologia: 'habilidad_personal_social' },
    ],
  },
  {
    id: 'C3',
    texto_literal: 'Analizar estructuras organizativas y funcionales propias de diferentes tipos de alojamiento y su entorno de relaciones internas y externas, justificando estructuras organizativas y tipo de relaciones adecuadas a cada tipo de establecimiento.',
    criterios_evaluacion: [
      { id: 'CE3.1', texto_literal: 'Clasificar y caracterizar las diferentes fórmulas de alojamiento en función de capacidad, categoría, servicios, tipo y ubicación, normativa.', tipologia: 'conocimiento' },
      { id: 'CE3.2', texto_literal: 'Describir los factores y criterios de estructuración que determinan una organización eficaz.', tipologia: 'conocimiento' },
      { id: 'CE3.3', texto_literal: 'Comparar las estructuras y relaciones departamentales más características de los distintos tipos de alojamientos turísticos y no turísticos, identificando los objetivos de cada departamento o área y la consecuente distribución de funciones.', tipologia: 'destreza_cognitiva_practica' },
      { id: 'CE3.4', texto_literal: 'Describir los circuitos, tipos de información y documentos internos y externos que se generan en el marco de estructuras y relaciones interdepartamentales de distintos tipos de alojamientos turísticos y no turísticos.', tipologia: 'conocimiento' },
      { id: 'CE3.5', texto_literal: 'Describir las relaciones externas de los alojamientos turísticos y no turísticos con otras empresas, y las relaciones de las áreas de alojamiento de tales establecimientos con otras áreas.', tipologia: 'conocimiento' },
      { id: 'CE3.6', texto_literal: 'A partir de estructuras organizativas de alojamientos turísticos y no turísticos: evaluar la organización, juzgando críticamente las soluciones organizativas adoptadas; proponer soluciones y organigramas alternativos, justificando los cambios introducidos en función de una organización más eficaz.', tipologia: 'destreza_cognitiva_practica' },
      { id: 'CE3.8', texto_literal: 'En casos prácticos de análisis de estructuras organizativas y funcionales: definir límites de responsabilidad, funciones y tareas de cada componente de los equipos de trabajo; estimar los tiempos de trabajo de las actividades profesionales más significativas.', tipologia: 'destreza_cognitiva_practica' },
    ],
  },
  {
    id: 'C4',
    texto_literal: 'Analizar los métodos para la definición de puestos de trabajo y selección de personal apropiados para áreas y departamentos de alojamiento, comparándolos críticamente.',
    criterios_evaluacion: [
      { id: 'CE4.1', texto_literal: 'Comparar críticamente los principales métodos para la definición de puestos correspondientes a trabajadores semicualificados y cualificados del área de alojamiento.', tipologia: 'destreza_cognitiva_practica' },
      { id: 'CE4.2', texto_literal: 'Comparar críticamente los principales métodos para la selección de trabajadores semicualificados y cualificados del área de alojamiento.', tipologia: 'destreza_cognitiva_practica' },
    ],
  },
  {
    id: 'C5',
    texto_literal: 'Analizar la función gerencial de integración de personal como instrumento para la debida adaptación del personal dependiente a los requerimientos profesionales que se derivan de la estructura organizativa y de cada puesto de trabajo de los departamentos de pisos y recepción.',
    criterios_evaluacion: [
      { id: 'CE5.1', texto_literal: 'Justificar la finalidad de la función de integración como complementaria de la función de organización.', tipologia: 'conocimiento' },
      { id: 'CE5.2', texto_literal: 'Comparar diversos manuales reales de operaciones del departamento de pisos y recepción, identificando puntos comunes y divergencias, y aportando de forma razonada alternativas de complementación o mejora.', tipologia: 'destreza_cognitiva_practica' },
      { id: 'CE5.3', texto_literal: 'En diversas situaciones prácticas de integración personal: explicar un supuesto manual de acogida del establecimiento; asignar a nuevos empleados un período determinado de adaptación; redactar y explicar las operaciones y procesos más significativos; aplicar técnicas para la comunicación intragrupal.', tipologia: 'destreza_cognitiva_practica' },
    ],
  },
];

// ============================================
// ALL CONTENIDOS FOR THIS UF (full BOE list)
// ============================================

export const CONTENIDOS_UF0048: BloqueContenido_BOE[] = [
  {
    numero_tema: 1,
    titulo_literal: 'La planificación en las empresas y entidades de alojamiento',
    items: [
      { texto_literal: 'La planificación en el proceso de administración.', ce_vinculados: ['CE1.1'] },
      { texto_literal: 'Principales tipos de planes: objetivos, estrategias y políticas; relación entre ellos.', ce_vinculados: ['CE1.2'] },
      { texto_literal: 'Pasos lógicos del proceso de planificación como enfoque racional para establecer objetivos, tomar decisiones y seleccionar medios en las distintas empresas y entidades del subsector.', ce_vinculados: ['CE1.3'] },
      { texto_literal: 'Revisión periódica de los planes en función de la aplicación de los sistemas de control característicos de estas empresas.', ce_vinculados: ['CE1.7'] },
    ],
  },
  {
    numero_tema: 2,
    titulo_literal: 'Gestión y control presupuestarios en las áreas de alojamiento',
    items: [
      { texto_literal: 'La gestión presupuestaria en función de sus etapas fundamentales: previsión, presupuesto y control.', ce_vinculados: ['CE2.3'] },
      { texto_literal: 'Concepto y propósito de los presupuestos. Justificación.', ce_vinculados: ['CE2.3'] },
      { texto_literal: 'Definición de ciclo presupuestario.', ce_vinculados: ['CE2.3'] },
      { texto_literal: 'Diferenciación y elaboración de los tipos de presupuestos más característicos para las áreas de alojamiento.', ce_vinculados: ['CE2.4'] },
    ],
  },
  {
    numero_tema: 3,
    titulo_literal: 'Estructura financiera de las empresas y áreas de alojamiento',
    items: [
      { texto_literal: 'Identificación y caracterización de fuentes de financiación.', ce_vinculados: ['CE2.5'] },
      { texto_literal: 'Relación óptima entre recursos propios y ajenos.', ce_vinculados: ['CE2.5'] },
      { texto_literal: 'Ventajas y desventajas de los principales métodos para evaluar inversiones según cada tipo de alojamiento. Aplicaciones informáticas.', ce_vinculados: ['CE2.6'] },
    ],
  },
  {
    numero_tema: 4,
    titulo_literal: 'Evaluación de costes, productividad y análisis económico para áreas de alojamiento',
    items: [
      { texto_literal: 'Estructura de la cuenta de resultados en las áreas de alojamiento.', ce_vinculados: ['CE2.1'] },
      { texto_literal: 'Tipos y cálculo de costes.', ce_vinculados: ['CE2.1', 'CE2.2'] },
      { texto_literal: 'Aplicación de métodos para la determinación, imputación, control y evaluación de consumos.', ce_vinculados: ['CE2.7'] },
      { texto_literal: 'Cálculo y análisis de niveles de productividad y de puntos muertos de explotación o umbrales de rentabilidad, utilizando herramientas informáticas.', ce_vinculados: ['CE2.6'] },
      { texto_literal: 'Identificación de parámetros establecidos para evaluar: ratios y porcentajes. Márgenes de beneficio y rentabilidad.', ce_vinculados: ['CE2.2', 'CE2.7'] },
    ],
  },
  {
    numero_tema: 5,
    titulo_literal: 'La organización en los establecimientos de alojamiento',
    items: [
      { texto_literal: 'Interpretación de las diferentes normativas sobre autorización y clasificación de establecimientos de alojamiento.', ce_vinculados: ['CE3.1'] },
      { texto_literal: 'Tipología y clasificación de los establecimientos de alojamiento.', ce_vinculados: ['CE3.1'] },
      { texto_literal: 'Naturaleza y propósito de la organización y relación con otras funciones gerenciales.', ce_vinculados: ['CE3.2'] },
      { texto_literal: 'Patrones básicos de departamentalización tradicional en las áreas de alojamiento: ventajas e inconvenientes.', ce_vinculados: ['CE3.2'] },
      { texto_literal: 'Estructuras y relaciones departamentales y externas características de los distintos tipos de alojamientos.', ce_vinculados: ['CE3.3', 'CE3.5'] },
      { texto_literal: 'Diferenciación de los objetivos de cada departamento del área de alojamiento y distribución de funciones.', ce_vinculados: ['CE3.3'] },
      { texto_literal: 'Circuitos, tipos de información y documentos internos y externos que se generan en el marco de tales estructuras y relaciones interdepartamentales.', ce_vinculados: ['CE3.4'] },
      { texto_literal: 'Definición de puestos de trabajo y selección de personal en las áreas de alojamiento: principales métodos para la definición de puestos correspondientes a trabajadores semicualificados y cualificados de tales áreas; principales métodos para la selección de trabajadores semicualificados y cualificados en tales áreas.', ce_vinculados: ['CE4.1', 'CE4.2'] },
    ],
  },
  {
    numero_tema: 6,
    titulo_literal: 'La función de integración de personal en los departamentos de pisos y recepción',
    items: [
      { texto_literal: 'Definición y objetivos.', ce_vinculados: ['CE5.1'] },
      { texto_literal: 'Relación con la función de organización.', ce_vinculados: ['CE5.1'] },
      { texto_literal: 'Manuales de operaciones de los departamentos de pisos y recepción: análisis, comparación y redacción.', ce_vinculados: ['CE5.2'] },
      { texto_literal: 'Programas de formación para personal dependiente de los departamentos de pisos y recepción: análisis, comparación y propuestas razonadas.', ce_vinculados: ['CE5.4'] },
      { texto_literal: 'Técnicas de comunicación y de motivación adaptadas a la integración de personal: identificación y aplicaciones.', ce_vinculados: ['CE5.3'] },
    ],
  },
];

// ============================================
// GOLDEN EXPECTED OUTPUT — Full Anexo IV
// ============================================

export const GOLDEN_ANEXO_UF0048: AnexoIV_Completo = {
  encabezado: {
    certificado: { codigo: 'HOTA0308', nombre_literal: 'Recepción en Alojamientos', duracion_horas: 630 },
    modulo_formativo: { codigo: 'MF0265_3', nombre_literal: 'Gestión de departamentos del área de alojamiento', horas: 120 },
    unidad_formativa: { codigo: 'UF0048', nombre_literal: 'Procesos de gestión de departamentos del área de alojamiento', horas: 70 },
  },
  objetivo_general_modulo: [
    { id: 'RP1', texto_literal: 'Proponer objetivos y planes para el departamento o área de su responsabilidad que sean viables y se integren en la planificación general del establecimiento.' },
    { id: 'RP2', texto_literal: 'Confeccionar los presupuestos del departamento o área de su responsabilidad y efectuar el seguimiento económico y el control presupuestario.' },
    { id: 'RP3', texto_literal: 'Establecer la estructura organizativa general del área de su responsabilidad que dé respuesta a los objetivos del establecimiento.' },
    { id: 'RP4', texto_literal: 'Colaborar en la integración del personal dependiente de los departamentos de pisos y recepción, participando en su formación y evaluación, para que realice las tareas asignadas con eficacia y eficiencia.' },
    { id: 'RP5', texto_literal: 'Dirigir al personal dependiente, involucrándolo en los objetivos y motivándolo para que tenga una alta capacidad de respuesta a las necesidades de los clientes y desarrolle su profesionalidad.' },
    { id: 'RP6', texto_literal: 'Implementar y gestionar, en su ámbito de responsabilidad, la cultura de la calidad y el sistema de calidad adoptado por la entidad.' },
  ],
  unidades_aprendizaje: [
    // UA1 and UA2 full data... (abbreviated here, full 20 SdAs in previous commit)
    // The golden case validates the MAPPER output against this expected structure.
  ],
  espacios_formativos: [
    { nombre: 'Aula de gestión', superficie_m2_15alumnos: 45, superficie_m2_25alumnos: 60 },
    { nombre: 'Taller de recepción en alojamientos', superficie_m2_15alumnos: 80, superficie_m2_25alumnos: 80 },
    { nombre: 'Aula de idiomas', superficie_m2_15alumnos: 45, superficie_m2_25alumnos: 60 },
  ],
  equipamiento: [
    'Equipos audiovisuales.',
    'PCs instalados en red, cañón de proyección e internet.',
    'Software específico de la especialidad.',
    'Pizarras para escribir con rotulador.',
    'Rotafolios.',
    'Material de aula.',
    'Mesa y silla para formador.',
    'Mesas y sillas para alumnos.',
  ],
  instalaciones_texto: 'En cuanto a las condiciones ambientales del aula, donde se desarrollarán las diferentes clases, son adecuadas para el desarrollo de la actividad de la acción formativa, tanto en la parte teórica como práctica, disponiendo de todos los recursos didácticos mencionados anteriormente, así como de las herramientas y útiles necesarios para el desarrollo de la actividad de los contenidos procedimentales. Las instalaciones y equipamientos cumplen con la normativa industrial e higiénico-sanitaria correspondiente y respetan las medidas de accesibilidad universal y seguridad de los/as participantes. En el caso de que la formación se dirija a personas con discapacidad se realizarán las adaptaciones y los ajustes razonables para asegurar su participación en condiciones de igualdad.',
};

// ============================================
// BACKTESTING METRICS
// ============================================
export const GOLDEN_METRICS = {
  totalCapacidades: 5,
  totalCEs: 28,
  totalContenidoItems: 30,
  totalSdAs: 20,
  ua1: { horas: 20, eval: 3, auto: 2, sdaH: 15, sdas: 8, caps: 4, ces: 20, temas: [1, 5, 6] },
  ua2: { horas: 30, eval: 3, auto: 3, sdaH: 24, sdas: 12, caps: 1, ces: 8, temas: [2, 3, 4] },
  /** Wizard Step 1 test: assign temas [1,5,6] to UA1, [2,3,4] to UA2 → derived CEs must match golden */
  step1Test: 'Assign temas [1,5,6]→UA1, [2,3,4]→UA2. derivarCriteriosDesdeContenidos must return C1,C3,C4,C5 for UA1 and C2 for UA2.',
};
