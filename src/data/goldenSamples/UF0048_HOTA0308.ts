/**
 * Golden Sample — UF0048 Procesos de gestión de departamentos del área de alojamiento
 * Certificado: HOTA0308 Recepción en Alojamientos
 * Módulo: MF0265_3 Gestión de departamentos del área de alojamiento (120h)
 * UF: UF0048 (70h) — UA1 (20h) + UA2 (30h)
 *
 * Source: Minerva/BOE Anexo IV real structure, provided as golden case.
 * This file defines the EXACT expected output for the Anexo IV renderer.
 */

import type { AnexoIVData } from '../../types/anexoIV';

// ============================================
// TYPES (will be extracted to types/anexoIV.ts)
// ============================================

export interface CriterioEvaluacion {
  id: string;       // e.g. "CE1.2"
  texto: string;
  categoria: 'conocimiento' | 'destreza' | 'habilidad';
}

export interface Capacidad {
  id: string;       // e.g. "C1"
  texto: string;
  criterios: CriterioEvaluacion[];
}

export interface ContenidoItem {
  texto: string;
  ceVinculado: string[];  // e.g. ["CE1.1"]
}

export interface BloqueContenido {
  numero: number;
  titulo: string;
  items: ContenidoItem[];
}

export interface SituacionAprendizaje {
  numero: number;
  nombre: string;
  objetivo: string;
  ceVinculado: string[];
  metodologia: string;
  desarrollo: string;
  recursos: string;
  tiempo: number; // horas
}

export interface UnidadAprendizaje {
  id: string;        // "UA1", "UA2"
  titulo: string;
  horas: number;
  horasEvaluacion: number;
  horasAutonomo: number;
  horasSdA: number;
  temasBOE: number[];  // e.g. [1, 5, 6] = temas del BOE agrupados
  parrafoMetodologico?: string;  // solo UA1
  capacidades: Capacidad[];
  contenidos: BloqueContenido[];
  situacionesAprendizaje: SituacionAprendizaje[];
}

export interface EspacioFormativo {
  nombre: string;
  superficie15: number;
  superficie25: number;
}

export interface GoldenSampleUF {
  // Encabezado
  certificado: { codigo: string; nombre: string; duracion: number };
  modulo: { codigo: string; nombre: string; horas: number };
  uf: { codigo: string; nombre: string; horas: number };
  objetivoGeneral: string[];  // RPs
  // UAs
  unidadesAprendizaje: UnidadAprendizaje[];
  // Espacios
  espacios: EspacioFormativo[];
  equipamiento: string[];
  instalacionesTexto: string;
}

// ============================================
// GOLDEN DATA — UF0048
// ============================================

export const GOLDEN_UF0048: GoldenSampleUF = {
  certificado: {
    codigo: 'HOTA0308',
    nombre: 'Recepción en Alojamientos',
    duracion: 630,
  },
  modulo: {
    codigo: 'MF0265_3',
    nombre: 'Gestión de departamentos del área de alojamiento',
    horas: 120,
  },
  uf: {
    codigo: 'UF0048',
    nombre: 'Procesos de gestión de departamentos del área de alojamiento',
    horas: 70,
  },
  objetivoGeneral: [
    'RP1: Proponer objetivos y planes para el departamento o área de su responsabilidad que sean viables y se integren en la planificación general del establecimiento.',
    'RP2: Confeccionar los presupuestos del departamento o área de su responsabilidad y efectuar el seguimiento económico y el control presupuestario.',
    'RP3: Establecer la estructura organizativa general del área de su responsabilidad que dé respuesta a los objetivos del establecimiento.',
    'RP4: Colaborar en la integración del personal dependiente de los departamentos de pisos y recepción, participando en su formación y evaluación, para que realice las tareas asignadas con eficacia y eficiencia.',
    'RP5: Dirigir al personal dependiente, involucrándolo en los objetivos y motivándolo para que tenga una alta capacidad de respuesta a las necesidades de los clientes y desarrolle su profesionalidad.',
    'RP6: Implementar y gestionar, en su ámbito de responsabilidad, la cultura de la calidad y el sistema de calidad adoptado por la entidad.',
  ],

  // =====================
  // UA1 — 20h
  // =====================
  unidadesAprendizaje: [
    {
      id: 'UA1',
      titulo: 'La planificación en las empresas y entidades de alojamiento; La organización en los establecimientos de alojamiento; La función de integración de personal en los departamentos de pisos y recepción',
      horas: 20,
      horasEvaluacion: 3,
      horasAutonomo: 2,
      horasSdA: 15,
      temasBOE: [1, 5, 6],
      parrafoMetodologico: 'Se utilizarán diferentes estrategias metodológicas que faciliten la participación activa del alumnado en la construcción de sus aprendizajes, el desarrollo de la motivación, la autonomía, la iniciativa y la responsabilidad necesarias en el desarrollo de la actividad profesional y personal.',

      capacidades: [
        {
          id: 'C1',
          texto: 'Analizar la función y el proceso de planificación empresarial y definir planes que resulten adecuados para áreas y departamentos de alojamiento.',
          criterios: [
            { id: 'CE1.1', texto: 'Justificar la importancia de la planificación en el proceso de administración de empresas o entidades.', categoria: 'habilidad' },
            { id: 'CE1.2', texto: 'Diferenciar los principales tipos de planes, empresariales.', categoria: 'conocimiento' },
            { id: 'CE1.3', texto: 'Describir las fases y pasos lógicos de un proceso de planificación como enfoque racional para establecer objetivos, tomar decisiones y seleccionar medios.', categoria: 'conocimiento' },
            { id: 'CE1.4', texto: 'Identificar los elementos básicos para establecer un proceso de dirección por objetivos.', categoria: 'conocimiento' },
            { id: 'CE1.5', texto: 'En supuestos prácticos de alojamientos: formular objetivos para un área de alojamiento determinada en el marco de hipotéticos planes generales de empresa o entidad; seleccionar las opciones de actuación más convenientes para la consecución de los objetivos propuestos; plantear los programas que se deriven de tales opciones, determinando los medios humanos y materiales necesarios.', categoria: 'destreza' },
            { id: 'CE1.6', texto: 'Justificar propuestas para la elaboración de planes de emergencia adaptados a distintos tipos de alojamientos.', categoria: 'destreza' },
            { id: 'CE1.7', texto: 'Argumentar la importancia de la revisión periódica de los planes en función de la aplicación de los sistemas de control característicos de cada tipo de alojamiento.', categoria: 'habilidad' },
          ],
        },
        {
          id: 'C3',
          texto: 'Analizar estructuras organizativas y funcionales propias de diferentes tipos de alojamiento y su entorno de relaciones internas y externas, justificando estructuras organizativas y tipo de relaciones adecuadas a cada tipo de establecimiento.',
          criterios: [
            { id: 'CE3.1', texto: 'Clasificar y caracterizar las diferentes fórmulas de alojamiento en función de capacidad, categoría, servicios, tipo y ubicación, normativa.', categoria: 'conocimiento' },
            { id: 'CE3.2', texto: 'Describir los factores y criterios de estructuración que determinan una organización eficaz.', categoria: 'conocimiento' },
            { id: 'CE3.3', texto: 'Comparar las estructuras y relaciones departamentales más características de los distintos tipos de alojamientos turísticos y no turísticos, identificando los objetivos de cada departamento o área y la consecuente distribución de funciones.', categoria: 'destreza' },
            { id: 'CE3.4', texto: 'Describir los circuitos, tipos de información y documentos internos y externos que se generan en el marco de estructuras y relaciones interdepartamentales de distintos tipos de alojamientos turísticos y no turísticos.', categoria: 'conocimiento' },
            { id: 'CE3.5', texto: 'Describir las relaciones externas de los alojamientos turísticos y no turísticos con otras empresas, y las relaciones de las áreas de alojamiento de tales establecimientos con otras áreas.', categoria: 'conocimiento' },
            { id: 'CE3.6', texto: 'A partir de estructuras organizativas de alojamientos turísticos y no turísticos: evaluar la organización, juzgando críticamente las soluciones organizativas adoptadas; proponer soluciones y organigramas alternativos, justificando los cambios introducidos en función de una organización más eficaz.', categoria: 'destreza' },
            { id: 'CE3.8', texto: 'En casos prácticos de análisis de estructuras organizativas y funcionales: definir límites de responsabilidad, funciones y tareas de cada componente de los equipos de trabajo; estimar los tiempos de trabajo de las actividades profesionales más significativas.', categoria: 'destreza' },
          ],
        },
        {
          id: 'C4',
          texto: 'Analizar los métodos para la definición de puestos de trabajo y selección de personal apropiados para áreas y departamentos de alojamiento, comparándolos críticamente.',
          criterios: [
            { id: 'CE4.1', texto: 'Comparar críticamente los principales métodos para la definición de puestos correspondientes a trabajadores semicualificados y cualificados del área de alojamiento.', categoria: 'destreza' },
            { id: 'CE4.2', texto: 'Comparar críticamente los principales métodos para la selección de trabajadores semicualificados y cualificados del área de alojamiento.', categoria: 'destreza' },
          ],
        },
        {
          id: 'C5',
          texto: 'Analizar la función gerencial de integración de personal como instrumento para la debida adaptación del personal dependiente a los requerimientos profesionales que se derivan de la estructura organizativa y de cada puesto de trabajo de los departamentos de pisos y recepción.',
          criterios: [
            { id: 'CE5.1', texto: 'Justificar la finalidad de la función de integración como complementaria de la función de organización.', categoria: 'conocimiento' },
            { id: 'CE5.2', texto: 'Comparar diversos manuales reales de operaciones del departamento de pisos y recepción, identificando puntos comunes y divergencias, y aportando de forma razonada alternativas de complementación o mejora.', categoria: 'destreza' },
            { id: 'CE5.3', texto: 'En diversas situaciones prácticas de integración personal: explicar un supuesto manual de acogida del establecimiento; asignar a nuevos empleados un período determinado de adaptación; redactar y explicar las operaciones y procesos más significativos; aplicar técnicas para la comunicación intragrupal.', categoria: 'destreza' },
          ],
        },
      ],

      contenidos: [
        {
          numero: 1,
          titulo: 'La planificación en las empresas y entidades de alojamiento',
          items: [
            { texto: 'La planificación en el proceso de administración.', ceVinculado: ['CE1.1'] },
            { texto: 'Principales tipos de planes: objetivos, estrategias y políticas; relación entre ellos.', ceVinculado: ['CE1.2'] },
            { texto: 'Pasos lógicos del proceso de planificación como enfoque racional para establecer objetivos, tomar decisiones y seleccionar medios en las distintas empresas y entidades del subsector.', ceVinculado: ['CE1.3'] },
            { texto: 'Revisión periódica de los planes en función de la aplicación de los sistemas de control característicos de estas empresas.', ceVinculado: ['CE1.7'] },
          ],
        },
        {
          numero: 5,
          titulo: 'La organización en los establecimientos de alojamiento',
          items: [
            { texto: 'Interpretación de las diferentes normativas sobre autorización y clasificación de establecimientos de alojamiento.', ceVinculado: ['CE3.1'] },
            { texto: 'Tipología y clasificación de los establecimientos de alojamiento.', ceVinculado: ['CE3.1'] },
            { texto: 'Naturaleza y propósito de la organización y relación con otras funciones gerenciales.', ceVinculado: ['CE3.2'] },
            { texto: 'Patrones básicos de departamentalización tradicional en las áreas de alojamiento: ventajas e inconvenientes.', ceVinculado: ['CE3.2'] },
            { texto: 'Estructuras y relaciones departamentales y externas características de los distintos tipos de alojamientos.', ceVinculado: ['CE3.3', 'CE3.5'] },
            { texto: 'Diferenciación de los objetivos de cada departamento del área de alojamiento y distribución de funciones.', ceVinculado: ['CE3.3'] },
            { texto: 'Circuitos, tipos de información y documentos internos y externos que se generan en el marco de tales estructuras y relaciones interdepartamentales.', ceVinculado: ['CE3.4'] },
            { texto: 'Definición de puestos de trabajo y selección de personal en las áreas de alojamiento: principales métodos para la definición de puestos correspondientes a trabajadores semicualificados y cualificados de tales áreas; principales métodos para la selección de trabajadores semicualificados y cualificados en tales áreas.', ceVinculado: ['CE4.1', 'CE4.2'] },
          ],
        },
        {
          numero: 6,
          titulo: 'La función de integración de personal en los departamentos de pisos y recepción',
          items: [
            { texto: 'Definición y objetivos.', ceVinculado: ['CE5.1'] },
            { texto: 'Relación con la función de organización.', ceVinculado: ['CE5.1'] },
            { texto: 'Manuales de operaciones de los departamentos de pisos y recepción: análisis, comparación y redacción.', ceVinculado: ['CE5.2'] },
            { texto: 'Programas de formación para personal dependiente de los departamentos de pisos y recepción: análisis, comparación y propuestas razonadas.', ceVinculado: ['CE5.4'] },
            { texto: 'Técnicas de comunicación y de motivación adaptadas a la integración de personal: identificación y aplicaciones.', ceVinculado: ['CE5.3'] },
          ],
        },
      ],

      situacionesAprendizaje: [
        { numero: 1, nombre: 'Lluvia de ideas sobre planificación en alojamientos', objetivo: 'Justificar la importancia de la planificación y relacionarla con la realidad de los alojamientos.', ceVinculado: ['CE1.1'], metodologia: 'Método interrogativo, combinando preguntas abiertas y test, para activar conocimientos previos y motivar al grupo.', desarrollo: 'El alumnado, en gran grupo, aportará ejemplos de decisiones planificadas en un hotel; se registrarán en la pizarra y se organizarán según su naturaleza.', recursos: 'Pizarra, rotuladores, guía de preguntas.', tiempo: 2 },
        { numero: 2, nombre: 'Esquema de tipos de planes en empresas de alojamiento', objetivo: 'Diferenciar los principales tipos de planes empresariales y su aplicación en alojamientos.', ceVinculado: ['CE1.2'], metodologia: 'Método expositivo-interrogativo con apoyo de presentación multimedia.', desarrollo: 'El alumnado elaborará individualmente un esquema de tipos de planes (estratégicos, tácticos, operativos) y lo contrastará en parejas.', recursos: 'Presentación multimedia, manual, fichas de esquema.', tiempo: 2 },
        { numero: 3, nombre: 'Análisis del proceso de planificación y dirección por objetivos', objetivo: 'Describir las fases del proceso de planificación e identificar elementos de la dirección por objetivos.', ceVinculado: ['CE1.3', 'CE1.4'], metodologia: 'Expositivo con ejemplo aplicado y preguntas de comprobación.', desarrollo: 'Se presentará un caso de planificación de campaña en un hotel; el alumnado identificará fases y elementos de DPO en una ficha de trabajo.', recursos: 'Caso práctico, ficha de trabajo, pizarra.', tiempo: 2 },
        { numero: 4, nombre: 'Supuesto práctico de formulación de objetivos y planes de emergencia', objetivo: 'Formular objetivos, seleccionar opciones de actuación y justificar propuestas de planes de emergencia.', ceVinculado: ['CE1.5', 'CE1.6'], metodologia: 'Aprendizaje basado en problemas.', desarrollo: 'En grupos de 3–4, los estudiantes diseñarán objetivos y un esquema de plan de emergencia para un área de alojamiento dadas unas condiciones iniciales.', recursos: 'Caso práctico, plantillas de planificación, normativa básica de emergencias.', tiempo: 2 },
        { numero: 5, nombre: 'Clasificación y análisis de fórmulas de alojamiento', objetivo: 'Clasificar fórmulas de alojamiento y describir factores de estructuración.', ceVinculado: ['CE3.1', 'CE3.2'], metodologia: 'Expositivo-participativo.', desarrollo: 'A partir de ejemplos de alojamientos, el alumnado clasificará establecimientos y justificará el tipo de estructura organizativa más adecuada.', recursos: 'Fichas de ejemplos, pizarra, presentación.', tiempo: 2 },
        { numero: 6, nombre: 'Análisis de organigramas y circuitos de información', objetivo: 'Comparar estructuras departamentales e identificar circuitos de información y documentos internos y externos.', ceVinculado: ['CE3.3', 'CE3.4', 'CE3.5'], metodologia: 'Estudio de caso.', desarrollo: 'En pequeños grupos, se analizará el organigrama y el circuito documental de un hotel, proponiendo mejoras en la organización y en los flujos de información.', recursos: 'Organigramas, diagramas de flujo, pizarra.', tiempo: 2 },
        { numero: 7, nombre: 'Comparación de métodos de definición de puestos y selección', objetivo: 'Comparar críticamente métodos de definición de puestos y selección de personal.', ceVinculado: ['CE4.1', 'CE4.2'], metodologia: 'Análisis de textos y discusión guiada.', desarrollo: 'El alumnado comparará distintos métodos de definición de puestos y selección, identificando ventajas e inconvenientes en un cuadro comparativo.', recursos: 'Documentos de métodos, fichas comparativas.', tiempo: 2 },
        { numero: 8, nombre: 'Simulación de integración de nuevo personal', objetivo: 'Explicar el manual de acogida y aplicar técnicas de comunicación y motivación en la integración del personal.', ceVinculado: ['CE5.2', 'CE5.3'], metodologia: 'Role-playing (simulación).', desarrollo: 'Por parejas, uno asume el rol de responsable de departamento y otro de nuevo empleado; se simula la acogida y explicación del manual, con feedback del docente.', recursos: 'Manual de acogida, guion de rol.', tiempo: 1 },
      ],
    },

    // =====================
    // UA2 — 30h
    // =====================
    {
      id: 'UA2',
      titulo: 'Gestión y control presupuestarios en las áreas de alojamiento; Estructura financiera de las empresas y áreas de alojamiento; Evaluación de costes, productividad y análisis económico para áreas de alojamiento',
      horas: 30,
      horasEvaluacion: 3,
      horasAutonomo: 3,
      horasSdA: 24,
      temasBOE: [2, 3, 4],

      capacidades: [
        {
          id: 'C2',
          texto: 'Analizar la gestión y control presupuestarios en el marco de las áreas de alojamiento de establecimientos turísticos y no turísticos, identificar costes y elaborar presupuestos económicos que permitan establecer programas de actuación.',
          criterios: [
            { id: 'CE2.1', texto: 'Identificar los tipos de costes empresariales y comparar estructuras de costes de distintos tipos de áreas de alojamientos.', categoria: 'conocimiento' },
            { id: 'CE2.2', texto: 'Calcular costes totales unitarios y márgenes con respecto a los precios de venta de diferentes servicios de alojamiento.', categoria: 'destreza' },
            { id: 'CE2.3', texto: 'Justificar la gestión presupuestaria como subfunción empresarial vinculada a las de planificación y control.', categoria: 'conocimiento' },
            { id: 'CE2.4', texto: 'Diferenciar los tipos de presupuestos más utilizados en las actividades de alojamiento, expresando los objetivos de cada uno de ellos y describiendo la estructura y las partidas que los componen.', categoria: 'conocimiento' },
            { id: 'CE2.5', texto: 'Identificar las variables que se deben tener en cuenta en la confección de presupuestos.', categoria: 'conocimiento' },
            { id: 'CE2.6', texto: 'En situaciones prácticas de gestión presupuestaria: elaborar presupuestos económicos para establecer programas de actuación; determinar los costes de los distintos recursos; calcular el punto muerto de explotación y los niveles de productividad.', categoria: 'destreza' },
            { id: 'CE2.7', texto: 'En casos prácticos de gestión y control presupuestario: calcular las desviaciones; analizar las causas de su aparición y los efectos que producen; proponer soluciones alternativas, estableciendo métodos de seguimiento y control presupuestarios.', categoria: 'destreza' },
            { id: 'CE2.8', texto: 'Justificar la necesidad de intervenir en los procesos de control económico del área de alojamiento con un alto sentido de la responsabilidad y honradez personales.', categoria: 'habilidad' },
          ],
        },
      ],

      contenidos: [
        {
          numero: 2,
          titulo: 'Gestión y control presupuestarios en las áreas de alojamiento',
          items: [
            { texto: 'La gestión presupuestaria en función de sus etapas fundamentales: previsión, presupuesto y control.', ceVinculado: ['CE2.3'] },
            { texto: 'Concepto y propósito de los presupuestos. Justificación.', ceVinculado: ['CE2.3'] },
            { texto: 'Definición de ciclo presupuestario.', ceVinculado: ['CE2.3'] },
            { texto: 'Diferenciación y elaboración de los tipos de presupuestos más característicos para las áreas de alojamiento.', ceVinculado: ['CE2.4'] },
          ],
        },
        {
          numero: 3,
          titulo: 'Estructura financiera de las empresas y áreas de alojamiento',
          items: [
            { texto: 'Identificación y caracterización de fuentes de financiación.', ceVinculado: ['CE2.5'] },
            { texto: 'Relación óptima entre recursos propios y ajenos.', ceVinculado: ['CE2.5'] },
            { texto: 'Ventajas y desventajas de los principales métodos para evaluar inversiones según cada tipo de alojamiento. Aplicaciones informáticas.', ceVinculado: ['CE2.6'] },
          ],
        },
        {
          numero: 4,
          titulo: 'Evaluación de costes, productividad y análisis económico para áreas de alojamiento',
          items: [
            { texto: 'Estructura de la cuenta de resultados en las áreas de alojamiento.', ceVinculado: ['CE2.1'] },
            { texto: 'Tipos y cálculo de costes.', ceVinculado: ['CE2.1', 'CE2.2'] },
            { texto: 'Aplicación de métodos para la determinación, imputación, control y evaluación de consumos.', ceVinculado: ['CE2.7'] },
            { texto: 'Cálculo y análisis de niveles de productividad y de puntos muertos de explotación o umbrales de rentabilidad, utilizando herramientas informáticas.', ceVinculado: ['CE2.6'] },
            { texto: 'Identificación de parámetros establecidos para evaluar: ratios y porcentajes. Márgenes de beneficio y rentabilidad.', ceVinculado: ['CE2.2', 'CE2.7'] },
          ],
        },
      ],

      situacionesAprendizaje: [
        { numero: 9, nombre: 'Esquema del ciclo presupuestario', objetivo: 'Justificar la gestión presupuestaria e identificar sus etapas fundamentales.', ceVinculado: ['CE2.3'], metodologia: 'Método expositivo con apoyo gráfico y preguntas de comprobación.', desarrollo: 'El alumnado elaborará un esquema del ciclo presupuestario, identificando previsión, presupuesto y control con ejemplos del área de alojamiento.', recursos: 'Presentación, pizarra, fichas de esquema.', tiempo: 2 },
        { numero: 10, nombre: 'Identificación de variables y tipos de presupuestos', objetivo: 'Diferenciar tipos de presupuestos y reconocer variables relevantes en su confección.', ceVinculado: ['CE2.4', 'CE2.5'], metodologia: 'Expositivo-interrogativo.', desarrollo: 'En pequeños grupos, a partir de un presupuesto modelo, los alumnos identificarán tipos de presupuestos y variables clave (costes, ventas, ocupación).', recursos: 'Presupuesto modelo, pizarra, fichas.', tiempo: 2 },
        { numero: 11, nombre: 'Clasificación de costes empresariales', objetivo: 'Identificar tipos de costes y comparar estructuras de costes.', ceVinculado: ['CE2.1'], metodologia: 'Expositivo con ejercicio aplicado.', desarrollo: 'El alumnado clasifica una lista de costes en fijos/variables y directos/indirectos, y discute su impacto en diferentes tipos de alojamientos.', recursos: 'Listado de costes, pizarra.', tiempo: 2 },
        { numero: 12, nombre: 'Cálculo de costes unitarios y márgenes', objetivo: 'Calcular costes unitarios y márgenes con respecto a precios de venta.', ceVinculado: ['CE2.2'], metodologia: 'Método demostrativo.', desarrollo: 'El docente resuelve un ejemplo de cálculo de coste unitario y margen de una habitación; luego el alumnado resuelve ejercicios similares individualmente.', recursos: 'Calculadora/Excel, ejercicios impresos, pizarra.', tiempo: 2 },
        { numero: 13, nombre: 'Análisis de fuentes de financiación', objetivo: 'Identificar y caracterizar fuentes de financiación y su adecuación a distintas situaciones.', ceVinculado: ['CE2.5'], metodologia: 'Investigación guiada y debate.', desarrollo: 'Los alumnos investigan distintos tipos de financiación y presentan sus ventajas y desventajas en el contexto de un establecimiento de alojamiento.', recursos: 'Internet, manual, fichas.', tiempo: 2 },
        { numero: 14, nombre: 'Evaluación de inversiones con apoyo informático', objetivo: 'Aplicar métodos sencillos para evaluar inversiones con herramientas informáticas.', ceVinculado: ['CE2.6'], metodologia: 'Demostrativo en aula informática.', desarrollo: 'El alumnado sigue una guía para calcular retorno de una inversión básica utilizando hoja de cálculo.', recursos: 'Ordenadores, hoja de cálculo, guía de pasos.', tiempo: 2 },
        { numero: 15, nombre: 'Elaboración de un presupuesto económico de área de alojamiento', objetivo: 'Elaborar un presupuesto económico a partir de datos proporcionados.', ceVinculado: ['CE2.6'], metodologia: 'Resolución de problemas.', desarrollo: 'En grupos, se elabora un presupuesto para el departamento de recepción usando datos de ocupación, precios y costes previstos.', recursos: 'Plantilla de presupuesto, datos de ejemplo, pizarra.', tiempo: 2 },
        { numero: 16, nombre: 'Cálculo del punto muerto y niveles de productividad', objetivo: 'Calcular el punto muerto de explotación y niveles de productividad utilizando herramientas informáticas.', ceVinculado: ['CE2.6'], metodologia: 'Demostrativo + práctica individual.', desarrollo: 'El docente muestra el cálculo del punto muerto en Excel y el alumnado lo replica con datos distintos.', recursos: 'Ordenadores, hoja de cálculo.', tiempo: 2 },
        { numero: 17, nombre: 'Control de consumos y análisis de desviaciones', objetivo: 'Aplicar métodos para evaluar consumos y calcular desviaciones.', ceVinculado: ['CE2.7'], metodologia: 'Estudio de caso.', desarrollo: 'A partir de datos de consumo previsto y real, el alumnado calcula desviaciones y comenta posibles causas.', recursos: 'Datos de caso, calculadora/Excel.', tiempo: 2 },
        { numero: 18, nombre: 'Propuesta de medidas correctoras presupuestarias', objetivo: 'Proponer soluciones alternativas ante desviaciones y definir métodos de seguimiento.', ceVinculado: ['CE2.7'], metodologia: 'Aprendizaje basado en problemas.', desarrollo: 'En grupos, se elabora un breve informe proponiendo medidas correctoras ante desviaciones significativas en un presupuesto de alojamiento.', recursos: 'Caso práctico, plantilla de informe.', tiempo: 2 },
        { numero: 19, nombre: 'Ética y responsabilidad en el control económico', objetivo: 'Justificar la necesidad de intervenir en el control económico con responsabilidad y honradez.', ceVinculado: ['CE2.8'], metodologia: 'Debate dirigido con análisis de dilemas.', desarrollo: 'Se presentan uno o dos dilemas éticos; el alumnado analiza y discute qué conductas serían adecuadas.', recursos: 'Fichas de dilema, pizarra.', tiempo: 2 },
        { numero: 20, nombre: 'Síntesis del proceso de gestión y control presupuestario', objetivo: 'Integrar los conocimientos sobre gestión y control presupuestarios trabajados en la UA.', ceVinculado: ['CE2.3', 'CE2.7'], metodologia: 'Clase de síntesis con participación activa.', desarrollo: 'El docente guía una recapitulación general; el alumnado elabora un mapa mental del proceso completo.', recursos: 'Pizarra, folios, rotuladores.', tiempo: 2 },
      ],
    },
  ],

  // =====================
  // ESPACIOS
  // =====================
  espacios: [
    { nombre: 'Aula de gestión', superficie15: 45, superficie25: 60 },
    { nombre: 'Taller de recepción en alojamientos', superficie15: 80, superficie25: 80 },
    { nombre: 'Aula de idiomas', superficie15: 45, superficie25: 60 },
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

  instalacionesTexto: 'En cuanto a las condiciones ambientales del aula, donde se desarrollarán las diferentes clases, son adecuadas para el desarrollo de la actividad de la acción formativa, tanto en la parte teórica como práctica, disponiendo de todos los recursos didácticos mencionados anteriormente, así como de las herramientas y útiles necesarios para el desarrollo de la actividad de los contenidos procedimentales. Las instalaciones y equipamientos cumplen con la normativa industrial e higiénico-sanitaria correspondiente y respetan las medidas de accesibilidad universal y seguridad de los/as participantes. En el caso de que la formación se dirija a personas con discapacidad se realizarán las adaptaciones y los ajustes razonables para asegurar su participación en condiciones de igualdad.',
};

// ============================================
// VALIDATION METRICS (for engine testing)
// ============================================
export const GOLDEN_UF0048_METRICS = {
  totalHorasUF: 70,
  ua1: { horas: 20, evaluacion: 3, autonomo: 2, sdaHoras: 15, numSdAs: 8, numCapacidades: 4, numCEs: 20 },
  ua2: { horas: 30, evaluacion: 3, autonomo: 3, sdaHoras: 24, numSdAs: 12, numCapacidades: 1, numCEs: 8 },
  totalSdAs: 20,
  totalCapacidades: 5,
  totalCEs: 28,
  horasCheck: 'UA1(15+3+2=20) + UA2(24+3+3=30) = 50 of 70 UF hours (remaining 20h for UA3+UA4 not in sample)',
};
