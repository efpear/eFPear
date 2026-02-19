/**
 * boeDataHOTA0308.ts - Golden Case BOE Annex Data
 *
 * Literal data from BOE Anexo VI: HOTA0308 Recepcion en alojamientos
 * RD 1096/2011 (modified by RD 619/2013)
 *
 * Golden Case A: MF0265_3 / UF0048 + UF0049
 * Contains ALL capacidades, criterios de evaluacion, and contenidos
 * extracted from the official BOE annex PDF.
 */

import type {
  BoeCertificadoData,
  BoeModuloData,
  BoeUFData,
  BoeCapacidad,
  BoeContenido,
} from '../types/boe';

// ============================================
// UF0048 - Procesos de gestion de departamentos del area de alojamiento (70h)
// ============================================

export const UF0048_DATA: BoeUFData = {
  codigo: 'UF0048',
  denominacion: 'Procesos de gestion de departamentos del area de alojamiento',
  duracion: 70,
  capacidades: [
    {
      codigo: "C1",
      texto: "Analizar la función y el proceso de planificación empresarial y definir planes que resulten adecuados para áreas y departamentos de alojamiento.",
      criterios: [
        { codigo: "CE1.1", texto: "Justificar la importancia de la planificación en el proceso de administración de empresas o entidades." },
        { codigo: "CE1.2", texto: "Diferenciar los principales tipos de planes, empresariales." },
        { codigo: "CE1.3", texto: "Describir las fases y pasos lógicos de un proceso de planificación como enfoque racional para establecer objetivos, tomar decisiones y seleccionar medios." },
        { codigo: "CE1.4", texto: "Identificar los elementos básicos para establecer un proceso de dirección por objetivos." },
        { codigo: "CE1.5", texto: "En supuestos prácticos de alojamientos: Formular objetivos para un área de alojamiento determinada en el marco de hipotéticos planes generales de empresa o entidad. Seleccionar las opciones de actuación más convenientes para la consecución de los objetivos propuestos. Plantear los programas que se deriven de tales opciones, determinando los medios humanos y materiales necesarios." },
        { codigo: "CE1.6", texto: "Justificar propuestas para la elaboración de planes de emergencia adaptados a distintos tipos de alojamientos." },
        { codigo: "CE1.7", texto: "Argumentar la importancia de la revisión periódica de los planes en función de la aplicación de los sistemas de control característicos de cada tipo de alojamiento." },
      ],
    },
    {
      codigo: "C2",
      texto: "Analizar la gestión y control presupuestarios en el marco de las áreas de alojamiento de establecimientos turísticos y no turísticos, identificar costes y elaborar presupuestos económicos que permitan establecer programas de actuación.",
      criterios: [
        { codigo: "CE2.1", texto: "Identificar los tipos de costes empresariales y comparar estructuras de costes de distintos tipos de áreas de alojamientos." },
        { codigo: "CE2.2", texto: "Calcular costes totales unitarios y márgenes con respecto a los precios de venta de diferentes servicios de alojamiento." },
        { codigo: "CE2.3", texto: "Justificar la gestión presupuestaria como subfunción empresarial vinculada a las de planificación y control." },
        { codigo: "CE2.4", texto: "Diferenciar los tipos de presupuestos más utilizados en las actividades de alojamiento, expresando los objetivos de cada uno de ellos y describir la estructura y las partidas que componen dichos presupuestos." },
        { codigo: "CE2.5", texto: "Identificar las variables que se deben tener en cuenta en la confección de presupuestos." },
        { codigo: "CE2.6", texto: "En situaciones prácticas, de gestión presupuestaria y a partir de unos supuestos objetivos económicos de producto, de costes directos e indirectos y de volumen de negocio para períodos de tiempo establecidos: Elaborar presupuestos económicos para establecer programas de actuación en el marco de los períodos fijados. Determinar los costes de los distintos recursos. Calcular el punto muerto de explotación y los niveles de productividad." },
        { codigo: "CE2.7", texto: "En casos prácticos de gestión y control presupuestario, y partiendo de las previsiones presupuestarias correspondientes y de los resultados reales obtenidos: Calcular las desviaciones. Analizar las causas de su aparición y los efectos que producen. Proponer soluciones alternativas, estableciendo métodos de seguimiento y control presupuestarios." },
        { codigo: "CE2.8", texto: "Justificar la necesidad de intervenir en los procesos de control económico del área de alojamiento con un alto sentido de la responsabilidad y honradez personales." },
      ],
    },
    {
      codigo: "C3",
      texto: "Analizar estructuras organizativas y funcionales propias de diferentes tipos de alojamiento y su entorno de relaciones internas y externas, justificando estructuras organizativas y tipo de relaciones adecuadas a cada tipo de establecimiento.",
      criterios: [
        { codigo: "CE3.1", texto: "Clasificar y caracterizar las diferentes fórmulas de alojamiento en función de: Capacidad, Categoría del establecimiento, Servicios prestados, Tipo y ubicación del establecimiento, Normativa europea, nacional y autonómica." },
        { codigo: "CE3.2", texto: "Describir los factores y criterios de estructuración que determinan una organización eficaz." },
        { codigo: "CE3.3", texto: "Comparar las estructuras y relaciones departamentales más características de los distintos tipos de alojamientos turísticos y no turísticos, identificando los objetivos de cada departamento o área y la consecuente distribución de funciones." },
        { codigo: "CE3.4", texto: "Describir los circuitos, tipos de información y documentos internos y externos que se generan en el marco de estructuras y relaciones interdepartamentales de distintos tipos de alojamientos turísticos y no turísticos." },
        { codigo: "CE3.5", texto: "Describir las relaciones externas de los alojamientos turísticos y no turísticos con otras empresas, y las relaciones de las áreas de alojamiento de tales establecimientos con otras áreas." },
        { codigo: "CE3.6", texto: "A partir de estructuras organizativas y funcionales de alojamientos turísticos y no turísticos: Evaluar la organización, juzgando críticamente las soluciones organizativas adoptadas. Proponer soluciones y organigramas alternativos a las estructuras y relaciones interdepartamentales caracterizadas, justificando los cambios introducidos en función de una organización más eficaz." },
        { codigo: "CE3.7", texto: "Describir los puestos de trabajo más característicos del área de alojamiento, caracterizándolos por la competencia profesional expresada en términos de capacidades y logros a los niveles requeridos en el mundo laboral." },
        { codigo: "CE3.8", texto: "En casos prácticos de análisis de estructuras organizativas y funcionales propias de diferentes tipos de alojamiento: Definir los límites de responsabilidad, funciones y tareas de cada componente de los equipos de trabajo del área de alojamiento. Estimar los tiempos de trabajo de las actividades profesionales más significativas." },
      ],
    },
    {
      codigo: "C4",
      texto: "Analizar los métodos para la definición de puestos de trabajo y selección de personal apropiados para áreas y departamentos de alojamiento, comparándolos críticamente.",
      criterios: [
        { codigo: "CE4.1", texto: "Comparar críticamente los principales métodos para la definición de puestos correspondientes a trabajadores semicualificados y cualificados del área de alojamiento." },
        { codigo: "CE4.2", texto: "Comparar críticamente los principales métodos para la selección de trabajadores semicualificados y cualificados del área de alojamiento." },
      ],
    },
    {
      codigo: "C5",
      texto: "Analizar la función gerencial de integración de personal como instrumento para la debida adaptación del personal dependiente a los requerimientos profesionales que se derivan de la estructura organizativa y de cada puesto de trabajo de los departamentos de pisos y recepción.",
      criterios: [
        { codigo: "CE5.1", texto: "Justificar la finalidad de la función de integración como complementaria de la función de organización." },
        { codigo: "CE5.2", texto: "Comparar diversos manuales reales de operaciones del departamento de pisos y recepción, identificando puntos comunes y divergencias, y aportando de forma razonada alternativas de complementación o mejora." },
        { codigo: "CE5.3", texto: "En diversas situaciones prácticas de integración personal: Explicar un supuesto manual de acogida del establecimiento. Asignar a los supuestos nuevos empleados, y en función de los puestos a cubrir, un período determinado de adaptación a los mismos. Redactar y explicar las operaciones y procesos más significativos que cada nuevo empleado debe desarrollar y los criterios que permitan evaluar el desempeño profesional y sus resultados. Dar una breve información sobre el establecimiento, su organización, su imagen corporativa, utilizando material audiovisual. Aplicar técnicas para la comunicación intragrupal entre los supuestos miembros antiguos y nuevos del departamento, simulando delegaciones de autoridad, animando a la iniciativa personal y la creatividad como medida de motivación y exigiendo responsabilidades." },
        { codigo: "CE5.4", texto: "Comparar diversos programas de formación relacionados con los puestos de trabajo que dependen del responsable de los departamentos de recepción y pisos, identificando puntos comunes y divergencias, y aportando de forma razonada alternativas de complementación o mejora." },
      ],
    },
    {
      codigo: "C6",
      texto: "Analizar y utilizar técnicas de dirección de personal aplicables en departamentos del área de alojamiento.",
      criterios: [
        { codigo: "CE6.1", texto: "Identificar procesos y situaciones habituales de comunicación y negociación en el marco de los establecimientos de alojamiento." },
        { codigo: "CE6.2", texto: "Explicar la lógica de los procesos de toma de decisiones." },
        { codigo: "CE6.3", texto: "Justificar la figura del directivo y del líder en una organización." },
        { codigo: "CE6.4", texto: "Describir las técnicas de dirección y dinamización de equipos y reuniones de trabajo aplicables a los establecimientos de alojamiento." },
        { codigo: "CE6.5", texto: "Justificar los procesos de motivación del personal adscrito al área de alojamiento." },
        { codigo: "CE6.6", texto: "En supuestos prácticos de relaciones jerárquicas entre miembros de establecimientos de alojamiento: Utilizar eficazmente las técnicas de comunicación idóneas para recibir y emitir instrucciones e información, intercambiar ideas u opiniones, asignar tareas y coordinar planes de trabajo. Intervenir en los supuestos conflictos originados mediante la negociación y la consecución de la participación de todos los miembros del grupo en la detección del origen del problema, evitando juicios de valor y resolviendo el conflicto, centrándose en aquellos aspectos que se puedan modificar. Adoptar las decisiones idóneas en función de las circunstancias que las propician y las opiniones de los demás respecto a las vías de solución posibles. Ejercer el liderazgo, de una manera efectiva, en el marco de sus competencias profesionales, adoptando el estilo más apropiado en cada situación. Dirigir equipos de trabajo, integrando y coordinando las necesidades del grupo en el marco de objetivos, políticas o directrices predeterminados. Dirigir, animar y participar en reuniones de trabajo, dinamizándolas, colaborando activamente o consiguiendo la colaboración de los participantes, y actuando de acuerdo con los fines de la reunión." },
      ],
    },
  ],
  contenidos: [
    {
      numero: "1",
      titulo: "La planificación en las empresas y entidades de alojamiento",
      items: [
        { texto: "La planificación en el proceso de administración." },
        { texto: "Principales tipos de planes: objetivos, estrategias y políticas; relación entre ellos." },
        { texto: "Pasos lógicos del proceso de planificación como enfoque racional para establecer objetivos, tomar decisiones y seleccionar medios en las distintas empresas y entidades del subsector." },
        { texto: "Revisión periódica de los planes en función de la aplicación de los sistemas de control característicos de estas empresas." },
      ],
    },
    {
      numero: "2",
      titulo: "Gestión y control presupuestarios en las áreas de alojamiento",
      items: [
        { texto: "La gestión presupuestaria en función de sus etapas fundamentales: previsión, presupuesto y control." },
        { texto: "Concepto y propósito de los presupuestos. Justificación." },
        { texto: "Definición de ciclo presupuestario." },
        { texto: "Diferenciación y elaboración de los tipos de presupuestos más característicos para las áreas de alojamiento." },
      ],
    },
    {
      numero: "3",
      titulo: "Estructura financiera de las empresas y áreas de alojamiento",
      items: [
        { texto: "Identificación y caracterización de fuentes de financiación." },
        { texto: "Relación óptima entre recursos propios y ajenos." },
        { texto: "Ventajas y desventajas de los principales métodos para evaluar inversiones según cada tipo de alojamiento. Aplicaciones informáticas." },
      ],
    },
    {
      numero: "4",
      titulo: "Evaluación de costes, productividad y análisis económico para áreas de alojamiento",
      items: [
        { texto: "Estructura de la cuenta de resultados en las áreas de alojamiento." },
        { texto: "Tipos y cálculo de costes." },
        { texto: "Aplicación de métodos para la determinación, imputación, control y evaluación de consumos. Cálculo y análisis de niveles de productividad y de puntos muertos de explotación o umbrales de rentabilidad, utilizando herramientas informáticas." },
        { texto: "Identificación de parámetros establecidos para evaluar: Ratios y porcentajes. Márgenes de beneficio y rentabilidad." },
      ],
    },
    {
      numero: "5",
      titulo: "La organización en los establecimientos de alojamiento",
      items: [
        { texto: "Interpretación de las diferentes normativas sobre autorización y clasificación de establecimientos de alojamiento." },
        { texto: "Tipología y clasificación de los establecimientos de alojamiento." },
        { texto: "Naturaleza y propósito de la organización y relación con otras funciones gerenciales." },
        { texto: "Patrones básicos de departamentalización tradicional en las áreas de alojamiento: ventajas e inconvenientes." },
        { texto: "Estructuras y relaciones departamentales y externas características de los distintos tipos de alojamientos." },
        { texto: "Diferenciación de los objetivos de cada departamento del área de alojamiento y distribución de funciones." },
        { texto: "Circuitos, tipos de información y documentos internos y externos que se generan en el marco de tales estructuras y relaciones interdepartamentales." },
        { texto: "Definición de puestos de trabajo y selección de personal en las áreas de alojamiento: Principales métodos para la definición de puestos correspondientes a trabajadores semicualificados y cualificados de tales áreas. Principales métodos para la selección de trabajadores semicualificados y cualificados en tales áreas." },
      ],
    },
    {
      numero: "6",
      titulo: "La función de integración de personal en los departamentos de pisos y recepción",
      items: [
        { texto: "Definición y objetivos." },
        { texto: "Relación con la función de organización." },
        { texto: "Manuales de operaciones de los departamentos de pisos y recepción: análisis, comparación y redacción." },
        { texto: "Programas de formación para personal dependiente de los departamentos de pisos y recepción: análisis, comparación y propuestas razonadas." },
        { texto: "Técnicas de comunicación y de motivación adaptadas a la integración de personal: identificación y aplicaciones." },
      ],
    },
    {
      numero: "7",
      titulo: "La dirección de personal en el área de alojamiento",
      items: [
        { texto: "La comunicación en las organizaciones de trabajo: procesos y aplicaciones." },
        { texto: "Negociación en el entorno laboral: procesos y aplicaciones." },
        { texto: "Solución de problemas y toma de decisiones." },
        { texto: "El liderazgo en las organizaciones: justificación y aplicaciones." },
        { texto: "Dirección y dinamización de equipos y reuniones de trabajo." },
        { texto: "La motivación en el entorno laboral." },
      ],
    },
    {
      numero: "8",
      titulo: "Aplicaciones informáticas específicas para la administración de áreas de alojamiento",
      items: [
        { texto: "Tipos y comparación." },
        { texto: "Programas a medida y oferta estándar del mercado." },
        { texto: "Utilización." },
      ],
    },
  ],
};

// ============================================
// UF0049 - Procesos de gestion de calidad en hosteleria y turismo (50h)
// ============================================

export const UF0049_DATA: BoeUFData = {
  codigo: 'UF0049',
  denominacion: 'Procesos de gestion de calidad en hosteleria y turismo',
  duracion: 50,
  capacidades: [
    {
      codigo: "C1",
      texto: "Analizar sistemas y planes de calidad aplicables a empresas de hostelería y turismo.",
      criterios: [
        { codigo: "CE1.1", texto: "Explicar el concepto de calidad, justificando su aplicación en el sector de la hostelería y el turismo." },
        { codigo: "CE1.2", texto: "Describir la función de gestión de la calidad en relación con los objetivos de la empresa y de los diferentes departamentos de establecimientos de hostelería y turismo." },
        { codigo: "CE1.3", texto: "Colaborar en la implantación de un sistema de calidad, interpretando y aplicando las correspondientes normas de calidad, estableciendo objetivos, identificando factores clave y barreras, y definiendo el programa para su implementación en lo referente a las actuaciones que se deban realizar y sus plazos." },
        { codigo: "CE1.4", texto: "Identificar y valorar las dimensiones y atributos de calidad del producto, y diseñar y definir los servicios de los respectivos departamentos, determinando y elaborando las necesarias especificaciones de calidad y estándares de calidad del servicio, normas, procedimientos e instrucciones de trabajo entre otras." },
        { codigo: "CE1.5", texto: "A partir de un plan de calidad de un proceso de producción o servicio de hostelería y turismo: Analizar los elementos del plan de calidad en relación con sus objetivos. Interpretar y manejar con destreza el manual de calidad y el manual de procedimientos." },
        { codigo: "CE1.6", texto: "Argumentar la necesaria participación personal en la aplicación de la gestión de la calidad como factor que facilita el logro de mejores resultados y una mayor satisfacción de los usuarios de servicios." },
      ],
    },
    {
      codigo: "C2",
      texto: "Definir o realizar procesos de control de calidad de los servicios y productos de hostelería y turismo, identificando las características de calidad más significativas.",
      criterios: [
        { codigo: "CE2.1", texto: "Describir los instrumentos y dispositivos utilizados para la valoración de la calidad." },
        { codigo: "CE2.2", texto: "Aplicar técnicas de control de calidad del servicio." },
        { codigo: "CE2.3", texto: "Aplicar técnicas de control de calidad del producto." },
        { codigo: "CE2.4", texto: "Proponer medidas correctivas ante desviaciones detectadas." },
      ],
    },
  ],
  contenidos: [
    {
      numero: "1",
      titulo: "La cultura de la calidad en las empresas y/o entidades de hostelería y turismo",
      items: [
        { texto: "El concepto de calidad y excelencia en el servicio hostelero y turístico.", subitems: ["Necesidad de aseguramiento de la calidad en la empresa hostelera y turística.", "El coste de medición y mejora de la calidad.", "Calidad y productividad.", "Calidad y gestión del rendimiento.", "Herramientas la calidad y la no calidad."] },
        { texto: "Sistemas de calidad: implantación y aspectos claves.", subitems: ["El modelo EFQM."] },
        { texto: "Aspectos legales y normativos.", subitems: ["Legislación nacional e internacional.", "Normalización, acreditación y certificación."] },
        { texto: "El plan de turismo español Horizonte 2020." },
      ],
    },
    {
      numero: "2",
      titulo: "La gestión de la calidad en la organización hostelera y turística",
      items: [
        { texto: "Organización de la calidad.", subitems: ["Enfoque de los Sistemas de Gestión de la Organización.", "Compromiso de la Dirección.", "Coordinación.", "Evaluación."] },
        { texto: "Gestión por procesos en hostelería y turismo.", subitems: ["Identificación de procesos.", "Planificación de procesos.", "Medida y mejora de procesos."] },
      ],
    },
    {
      numero: "3",
      titulo: "Procesos de control de calidad de los servicios y productos de hostelería y turismo",
      items: [
        { texto: "Procesos de producción y servicio.", subitems: ["Comprobación de la Calidad.", "Organización y Métodos de Comprobación de la Calidad."] },
        { texto: "Supervisión y medida del proceso y producto/servicio.", subitems: ["Satisfacción del cliente.", "Supervisión y medida de productos/servicios."] },
        { texto: "Gestión de los datos.", subitems: ["Objetivos.", "Sistema de información de la calidad a la Dirección.", "Informes.", "La calidad asistida por ordenador.", "Métodos estadísticos."] },
        { texto: "Evaluación de resultados.", subitems: ["Propuestas de mejora."] },
      ],
    },
  ],
};

// ============================================
// MF0265_3 - Gestion de departamentos del area de alojamiento (120h)
// ============================================

export const MF0265_3_DATA: BoeModuloData = {
  codigoMF: 'MF0265_3',
  nombreMF: 'Gestion de departamentos del area de alojamiento',
  duracion: 120,
  unidadesFormativas: [UF0048_DATA, UF0049_DATA],
  espacios: [
    { nombre: 'Aula de gestion', superficie15: 45, superficie25: 60 },
    { nombre: 'Taller de recepcion en alojamientos', superficie15: 80, superficie25: 80 },
  ],
  equipamiento: {
    'Aula de gestion': [
      'Equipos audiovisuales',
      'PCs instalados en red, canon de proyeccion e internet',
      'Software especifico de la especialidad',
      '2 Pizarras para escribir con rotulador',
      'Rotafolios',
      'Material de aula',
      'Mesa y silla para formador',
      'Mesas y sillas para alumnos',
    ],
    'Taller de recepcion en alojamientos': [
      'Mostrador de alojamiento',
      'Impresora laser color',
      'Escaner',
      'Fotocopiadora',
      'Calculadoras con funcion de impresion',
      'Telefonos de practicas',
      'Armario con baldas',
      'Caja de seguridad tipo habitacion instalada en armario',
      'Mueble estanteria especial',
      'Muebles-archivadores de carpetas colgantes',
      'Material consumible de recepcion',
    ],
  },
  requisitosFormadores: {
    titulaciones: [
      'Licenciado en Administracion y Direccion de Empresas',
      'Licenciado en Ciencias Actuariales y Financieras',
      'Licenciado en Economia',
      'Diplomado en Turismo',
      'Diplomado en Ciencias Empresariales',
    ],
    experiencia: '2 anos de experiencia profesional en el ambito de la unidad de competencia.',
  },
};

// ============================================
// Complete HOTA0308 certificate structure
// ============================================

export const HOTA0308_DATA: BoeCertificadoData = {
  codigo: 'HOTA0308',
  denominacion: 'Recepcion en alojamientos',
  nivel: 3,
  familia: 'Hosteleria y turismo',
  duracionTotal: 630,
  modulos: [
    {
      codigoMF: 'MF0263_3',
      nombreMF: 'Acciones comerciales y reservas',
      duracion: 150,
      unidadesFormativas: [
        { codigo: 'UF0050', denominacion: 'Gestion de reservas de habitaciones y otros servicios de alojamientos', duracion: 60, capacidades: [], contenidos: [] },
        { codigo: 'UF0051', denominacion: 'Diseno y ejecucion de acciones comerciales en alojamientos', duracion: 60, capacidades: [], contenidos: [] },
        { codigo: 'UF0042', denominacion: 'Comunicacion y atencion al cliente en hosteleria y turismo', duracion: 30, capacidades: [], contenidos: [] },
      ],
    },
    {
      codigoMF: 'MF0264_3',
      nombreMF: 'Recepcion y atencion al cliente',
      duracion: 180,
      unidadesFormativas: [
        { codigo: 'UF0052', denominacion: 'Organizacion y prestacion del servicio de recepcion en alojamientos', duracion: 90, capacidades: [], contenidos: [] },
        { codigo: 'UF0042', denominacion: 'Comunicacion y atencion al cliente en hosteleria y turismo', duracion: 30, capacidades: [], contenidos: [] },
        { codigo: 'UF0043', denominacion: 'Gestion de protocolo', duracion: 30, capacidades: [], contenidos: [] },
        { codigo: 'UF0044', denominacion: 'Funcion del mando intermedio en la Prevencion de riesgos laborales', duracion: 30, capacidades: [], contenidos: [] },
      ],
    },
    MF0265_3_DATA,
    {
      codigoMF: 'MF1057_2',
      nombreMF: 'Ingles profesional para turismo',
      duracion: 90,
      unidadesFormativas: [],
    },
  ],
};

/**
 * Lookup BOE data by MF or UF code
 */
export function buscarDatosBoe(codigo: string): BoeUFData | BoeModuloData | null {
  if (codigo === 'MF0265_3') return MF0265_3_DATA;
  if (codigo === 'UF0048') return UF0048_DATA;
  if (codigo === 'UF0049') return UF0049_DATA;
  // Extensible: add more golden cases here
  return null;
}
