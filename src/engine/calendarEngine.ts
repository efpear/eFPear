/**
 * ============================================
 * eFPear CertiCalc - Calendar Engine
 * ============================================
 * Motor de planificación temporal de sesiones formativas.
 * 
 * Responsabilidad:
 *   - Calcular fechas de sesión descontando festivos y fines de semana
 *   - Soportar 17 CCAA con festivos nacionales + autonómicos
 *   - Lógica profunda de Canarias (festivos insulares por isla)
 *   - Configuración de turnos (mañana/tarde, horas/día)
 *   - Recálculo en cascada cuando se mueve una sesión
 *   - Verificación de coherencia (solapamientos, horas)
 *   - Métricas para dashboard
 * 
 * 100% determinístico. Sin dependencias externas.
 * @module calendarEngine
 */

import type { FechaISO, ModuloConSesiones, Sesion } from '../types';
import {
  toFechaISO,
  sumarDias,
  esDiaLaborable,
} from '../utils/date-utils';

// ============================================
// TYPES
// ============================================

export type CCAA =
  | 'andalucia' | 'aragon' | 'asturias' | 'baleares'
  | 'canarias' | 'cantabria' | 'castilla_leon' | 'castilla_mancha'
  | 'cataluna' | 'ceuta' | 'extremadura' | 'galicia'
  | 'madrid' | 'melilla' | 'murcia' | 'navarra'
  | 'pais_vasco' | 'rioja' | 'valencia';

export type IslaCanaria =
  | 'tenerife' | 'gran_canaria' | 'lanzarote' | 'fuerteventura'
  | 'la_palma' | 'la_gomera' | 'el_hierro';

export type Turno = 'manana' | 'tarde' | 'completo';

export interface ConfiguracionTurnos {
  turno: Turno;
  horasPorDia: number;
  horaInicio: string;  // "08:00"
  horaFin: string;     // "14:00"
}

export interface ConfiguracionRegional {
  ccaa: CCAA;
  isla?: IslaCanaria;
  festivosPersonalizados?: FechaISO[];
}

export interface ConfiguracionCalendario {
  fechaInicio: FechaISO;
  turnos: ConfiguracionTurnos;
  regional: ConfiguracionRegional;
  anioAcademico: number; // e.g., 2025 for 2025-2026
}

export interface MetricasPlanificacion {
  totalModulos: number;
  totalHoras: number;
  totalSesiones: number;
  totalDiasLectivos: number;
  fechaInicio: FechaISO;
  fechaFin: FechaISO;
  horasAsignadas: number;
  horasRestantes: number;
  porcentajeCompletado: number;
  alertas: Alerta[];
}

export interface Alerta {
  tipo: 'error' | 'warning' | 'info';
  modulo?: string;
  mensaje: string;
}

export interface ResultadoCoherencia {
  coherente: boolean;
  alertas: Alerta[];
  solapamientos: Array<{
    fecha: FechaISO;
    modulos: string[];
  }>;
}

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

export const DEFAULT_TURNOS: Record<Turno, ConfiguracionTurnos> = {
  manana: { turno: 'manana', horasPorDia: 5, horaInicio: '08:00', horaFin: '14:00' },
  tarde: { turno: 'tarde', horasPorDia: 5, horaInicio: '15:00', horaFin: '21:00' },
  completo: { turno: 'completo', horasPorDia: 8, horaInicio: '08:00', horaFin: '21:00' },
};

export const DEFAULT_CONFIG: ConfiguracionCalendario = {
  fechaInicio: '2025-09-15' as FechaISO,
  turnos: DEFAULT_TURNOS.manana,
  regional: { ccaa: 'canarias' },
  anioAcademico: 2025,
};

// ============================================
// FESTIVOS - NACIONALES
// ============================================

/**
 * Festivos nacionales fijos (aplicables a toda España).
 * Año parametrizable.
 */
export function festivosNacionales(anio: number): FechaISO[] {
  return [
    `${anio}-01-01`,  // Año Nuevo
    `${anio}-01-06`,  // Reyes
    `${anio}-05-01`,  // Día del Trabajo
    `${anio}-08-15`,  // Asunción
    `${anio}-10-12`,  // Fiesta Nacional
    `${anio}-11-01`,  // Todos los Santos
    `${anio}-12-06`,  // Constitución
    `${anio}-12-08`,  // Inmaculada
    `${anio}-12-25`,  // Navidad
  ] as FechaISO[];
}

/**
 * Semana Santa (fechas móviles). Calcula Jueves y Viernes Santo.
 * Algoritmo de Gauss para calcular la Pascua.
 */
export function semanaSanta(anio: number): FechaISO[] {
  // Algoritmo de Gauss/Computus para Pascua
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;

  // Domingo de Pascua
  const pascua = new Date(anio, mes - 1, dia);
  pascua.setHours(12, 0, 0, 0);

  // Jueves Santo = Pascua - 3 días
  const jueves = new Date(pascua);
  jueves.setDate(jueves.getDate() - 3);

  // Viernes Santo = Pascua - 2 días
  const viernes = new Date(pascua);
  viernes.setDate(viernes.getDate() - 2);

  return [toFechaISO(jueves), toFechaISO(viernes)];
}

// ============================================
// FESTIVOS - CANARIAS (DEEP LOGIC)
// ============================================

/**
 * Festivos autonómicos de Canarias.
 * Incluye el Día de Canarias (30 mayo) y festivos insulares.
 */
export function festivosCanarias(anio: number, isla?: IslaCanaria): FechaISO[] {
  const autonomicos: FechaISO[] = [
    `${anio}-02-02` as FechaISO,  // Día de la Candelaria (Canarias)
    `${anio}-05-30` as FechaISO,  // Día de Canarias
  ];

  // Festivos insulares específicos
  const insulares: Record<IslaCanaria, FechaISO[]> = {
    tenerife: [`${anio}-02-02` as FechaISO],       // Virgen de Candelaria
    gran_canaria: [`${anio}-04-29` as FechaISO],    // San Pedro Mártir de Verona
    lanzarote: [`${anio}-09-15` as FechaISO],       // Virgen de los Dolores
    fuerteventura: [`${anio}-09-15` as FechaISO],   // Virgen de la Peña
    la_palma: [`${anio}-08-05` as FechaISO],        // Virgen de las Nieves
    la_gomera: [`${anio}-10-01` as FechaISO],       // Virgen de Guadalupe (aprox.)
    el_hierro: [`${anio}-09-24` as FechaISO],       // Virgen de los Reyes (aprox.)
  };

  if (isla && insulares[isla]) {
    return [...autonomicos, ...insulares[isla]];
  }

  return autonomicos;
}

// ============================================
// FESTIVOS - TODAS LAS CCAA
// ============================================

/**
 * Festivos autonómicos por CCAA (simplificado a los más relevantes).
 * Para una versión completa, cada CCAA tendría su propio set.
 */
export function festivosAutonomicos(anio: number, ccaa: CCAA, isla?: IslaCanaria): FechaISO[] {
  const map: Partial<Record<CCAA, FechaISO[]>> = {
    canarias: festivosCanarias(anio, isla),
    andalucia: [`${anio}-02-28` as FechaISO],       // Día de Andalucía
    aragon: [`${anio}-04-23` as FechaISO],           // San Jorge
    asturias: [`${anio}-09-08` as FechaISO],         // Covadonga
    baleares: [`${anio}-03-01` as FechaISO],         // Día de Baleares
    cantabria: [`${anio}-07-28` as FechaISO],        // Día de las Instituciones
    castilla_leon: [`${anio}-04-23` as FechaISO],    // Día de Castilla y León
    castilla_mancha: [`${anio}-05-31` as FechaISO],  // Día de CLM
    cataluna: [`${anio}-06-24` as FechaISO, `${anio}-09-11` as FechaISO],
    ceuta: [`${anio}-09-02` as FechaISO],            // Día de Ceuta
    extremadura: [`${anio}-09-08` as FechaISO],      // Día de Extremadura
    galicia: [`${anio}-07-25` as FechaISO],          // Santiago Apóstol
    madrid: [`${anio}-05-02` as FechaISO],           // Dos de Mayo
    melilla: [`${anio}-09-17` as FechaISO],          // Día de Melilla
    murcia: [`${anio}-06-09` as FechaISO],           // Día de Murcia
    navarra: [`${anio}-12-03` as FechaISO],          // San Francisco Javier
    pais_vasco: [`${anio}-10-25` as FechaISO],       // Día del País Vasco (Euskadi)
    rioja: [`${anio}-06-09` as FechaISO],            // Día de La Rioja
    valencia: [`${anio}-10-09` as FechaISO],         // Día de la Comunitat Valenciana
  };

  return map[ccaa] || [];
}

/**
 * Genera el Set completo de festivos para un año académico.
 * Cubre el año actual y el siguiente (sept → julio).
 */
export function generarSetFestivos(config: ConfiguracionRegional, anioAcademico: number): Set<FechaISO> {
  const festivos = new Set<FechaISO>();

  // Two academic years worth of holidays
  for (const anio of [anioAcademico, anioAcademico + 1]) {
    // Nacionales
    festivosNacionales(anio).forEach(f => festivos.add(f));
    // Semana Santa
    semanaSanta(anio).forEach(f => festivos.add(f));
    // Autonómicos
    festivosAutonomicos(anio, config.ccaa, config.isla).forEach(f => festivos.add(f));
  }

  // Festivos personalizados
  config.festivosPersonalizados?.forEach(f => festivos.add(f));

  return festivos;
}

// ============================================
// CORE: SESSION CALCULATION
// ============================================

/**
 * Genera sesiones para un módulo a partir de una fecha de inicio.
 * Salta fines de semana y festivos.
 */
export function calcularSesionesModulo(
  horasTotales: number,
  fechaInicio: FechaISO,
  turnos: ConfiguracionTurnos,
  festivos: Set<FechaISO>
): Sesion[] {
  const sesiones: Sesion[] = [];
  let horasRestantes = horasTotales;
  let fechaActual = fechaInicio;
  let intentos = 0;
  const MAX_INTENTOS = 365; // Safety break

  while (horasRestantes > 0 && intentos < MAX_INTENTOS) {
    if (esDiaLaborable(fechaActual) && !festivos.has(fechaActual)) {
      const horasSesion = Math.min(turnos.horasPorDia, horasRestantes);
      sesiones.push({
        fecha: fechaActual,
        horas: horasSesion,
        tipo: 'normal',
      });
      horasRestantes -= horasSesion;
    }
    fechaActual = sumarDias(fechaActual, 1);
    intentos++;
  }

  return sesiones;
}

/**
 * Calcula sesiones en cascada para múltiples módulos.
 * Cada módulo empieza el día siguiente al último del anterior.
 * 
 * Si `paralelo = true`, todos empiezan en la misma fecha
 * (para módulos que se imparten simultáneamente).
 */
export function calcularModulosCascada(
  modulos: Array<{ id: string; codigo: string; titulo: string; horas: number }>,
  config: ConfiguracionCalendario,
  paralelo: boolean = false
): ModuloConSesiones[] {
  const festivos = generarSetFestivos(config.regional, config.anioAcademico);
  const resultado: ModuloConSesiones[] = [];
  let fechaSiguiente = config.fechaInicio;

  for (const modulo of modulos) {
    const inicio = paralelo ? config.fechaInicio : fechaSiguiente;
    const sesiones = calcularSesionesModulo(
      modulo.horas,
      inicio,
      config.turnos,
      festivos
    );

    resultado.push({
      id: modulo.id,
      codigo: modulo.codigo,
      titulo: modulo.titulo,
      horasTotales: modulo.horas,
      sesiones,
    });

    if (!paralelo && sesiones.length > 0) {
      // Next module starts the day after the last session
      fechaSiguiente = sumarDias(sesiones[sesiones.length - 1].fecha, 1);
    }
  }

  return resultado;
}

// ============================================
// COHERENCE CHECK
// ============================================

/**
 * Verifica la coherencia de una planificación:
 * - Solapamientos de módulos en el mismo día
 * - Exceso de horas diarias
 * - Conservación total de horas
 */
export function verificarCoherencia(
  modulos: ModuloConSesiones[],
  config: ConfiguracionCalendario
): ResultadoCoherencia {
  const alertas: Alerta[] = [];
  const solapamientos: Array<{ fecha: FechaISO; modulos: string[] }> = [];

  // Build a map: fecha → list of (módulo, horas)
  const mapa = new Map<FechaISO, Array<{ codigo: string; horas: number }>>();

  for (const modulo of modulos) {
    // Check hour conservation
    const horasAsignadas = modulo.sesiones.reduce((acc, s) => acc + s.horas, 0);
    if (horasAsignadas !== modulo.horasTotales) {
      alertas.push({
        tipo: 'error',
        modulo: modulo.codigo,
        mensaje: `${modulo.codigo}: ${horasAsignadas}h asignadas vs ${modulo.horasTotales}h requeridas`,
      });
    }

    for (const sesion of modulo.sesiones) {
      if (!mapa.has(sesion.fecha)) {
        mapa.set(sesion.fecha, []);
      }
      mapa.get(sesion.fecha)!.push({ codigo: modulo.codigo, horas: sesion.horas });
    }
  }

  // Check for overlaps and excess hours
  for (const [fecha, sesiones] of mapa) {
    if (sesiones.length > 1) {
      solapamientos.push({
        fecha,
        modulos: sesiones.map(s => s.codigo),
      });
    }

    const totalHoras = sesiones.reduce((acc, s) => acc + s.horas, 0);
    if (totalHoras > config.turnos.horasPorDia) {
      alertas.push({
        tipo: 'warning',
        mensaje: `${fecha}: ${totalHoras}h programadas (máximo ${config.turnos.horasPorDia}h/día)`,
      });
    }
  }

  if (solapamientos.length > 0) {
    alertas.push({
      tipo: 'warning',
      mensaje: `${solapamientos.length} día(s) con módulos solapados`,
    });
  }

  return {
    coherente: alertas.filter(a => a.tipo === 'error').length === 0,
    alertas,
    solapamientos,
  };
}

// ============================================
// METRICS
// ============================================

/**
 * Calcula métricas resumen para el dashboard.
 */
export function calcularMetricas(
  modulos: ModuloConSesiones[],
  config: ConfiguracionCalendario
): MetricasPlanificacion {
  const alertas: Alerta[] = [];
  const todasLasFechas = new Set<FechaISO>();
  let totalHoras = 0;
  let horasAsignadas = 0;

  for (const modulo of modulos) {
    totalHoras += modulo.horasTotales;
    const horasMod = modulo.sesiones.reduce((acc, s) => acc + s.horas, 0);
    horasAsignadas += horasMod;
    modulo.sesiones.forEach(s => todasLasFechas.add(s.fecha));

    if (horasMod < modulo.horasTotales) {
      alertas.push({
        tipo: 'warning',
        modulo: modulo.codigo,
        mensaje: `${modulo.codigo}: faltan ${modulo.horasTotales - horasMod}h por asignar`,
      });
    }
  }

  const fechasOrdenadas = [...todasLasFechas].sort();
  const fechaInicio = fechasOrdenadas[0] ?? config.fechaInicio;
  const fechaFin = fechasOrdenadas[fechasOrdenadas.length - 1] ?? config.fechaInicio;

  return {
    totalModulos: modulos.length,
    totalHoras,
    totalSesiones: modulos.reduce((acc, m) => acc + m.sesiones.length, 0),
    totalDiasLectivos: todasLasFechas.size,
    fechaInicio,
    fechaFin,
    horasAsignadas,
    horasRestantes: totalHoras - horasAsignadas,
    porcentajeCompletado: totalHoras > 0 ? Math.round((horasAsignadas / totalHoras) * 100) : 0,
    alertas,
  };
}

// ============================================
// SESSION MANIPULATION
// ============================================

/**
 * Mueve una sesión de un módulo a una nueva fecha.
 * Returns updated ModuloConSesiones.
 */
export function moverSesion(
  modulo: ModuloConSesiones,
  fechaOriginal: FechaISO,
  fechaNueva: FechaISO
): ModuloConSesiones {
  return {
    ...modulo,
    sesiones: modulo.sesiones.map(s =>
      s.fecha === fechaOriginal ? { ...s, fecha: fechaNueva } : s
    ).sort((a, b) => a.fecha.localeCompare(b.fecha)),
  };
}

/**
 * Recalcula en cascada a partir de un módulo que se movió.
 * Módulos posteriores al movido se replanifican.
 */
export function recalcularCascada(
  modulos: ModuloConSesiones[],
  moduloMovidoIndex: number,
  config: ConfiguracionCalendario
): ModuloConSesiones[] {
  const festivos = generarSetFestivos(config.regional, config.anioAcademico);
  const resultado = [...modulos];

  // Keep modules before the moved one unchanged
  for (let i = moduloMovidoIndex + 1; i < resultado.length; i++) {
    const prevModulo = resultado[i - 1]!;
    const ultimaSesion = prevModulo.sesiones[prevModulo.sesiones.length - 1];

    if (!ultimaSesion) continue;

    const nuevaFechaInicio = sumarDias(ultimaSesion.fecha, 1);
    const nuevasSesiones = calcularSesionesModulo(
      resultado[i].horasTotales,
      nuevaFechaInicio,
      config.turnos,
      festivos
    );

    resultado[i] = {
      ...resultado[i],
      sesiones: nuevasSesiones,
    };
  }

  return resultado;
}
