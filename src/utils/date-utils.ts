/**
 * ============================================
 * eFPear CertiCalc - Date Utilities
 * ============================================
 * Matemática de sesiones y utilidades de fecha.
 * Sin dependencias externas. Determinístico.
 */

import type { FechaISO } from '../types';

// ============================================
// CONSTANTS
// ============================================

export const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const DIAS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ============================================
// CORE DATE OPERATIONS
// ============================================

/** Crea una FechaISO a partir de un Date */
export const toFechaISO = (date: Date): FechaISO => {
  return date.toISOString().split('T')[0] as FechaISO;
};

/** Obtiene el día del mes (1-31) */
export const obtenerDia = (fecha: FechaISO): number => {
  return new Date(fecha + 'T12:00:00').getDate();
};

/** Obtiene el día de la semana (0=lunes, 6=domingo) */
export const obtenerDiaSemana = (fecha: FechaISO): number => {
  const d = new Date(fecha + 'T12:00:00').getDay();
  return d === 0 ? 6 : d - 1; // Convert Sunday=0 to Monday=0
};

/** Primer día del mes */
export const primerDiaMes = (fecha: FechaISO): FechaISO => {
  const d = new Date(fecha + 'T12:00:00');
  d.setDate(1);
  return toFechaISO(d);
};

/** Suma N días a una fecha */
export const sumarDias = (fecha: FechaISO, dias: number): FechaISO => {
  const d = new Date(fecha + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return toFechaISO(d);
};

/** Resta N días a una fecha */
export const restarDias = (fecha: FechaISO, dias: number): FechaISO => {
  return sumarDias(fecha, -dias);
};

/** ¿Es fin de semana? */
export const esFinDeSemana = (fecha: FechaISO): boolean => {
  const dia = obtenerDiaSemana(fecha);
  return dia >= 5; // 5=sáb, 6=dom
};

/** ¿Es día laborable? (no fin de semana) */
export const esDiaLaborable = (fecha: FechaISO): boolean => {
  return !esFinDeSemana(fecha);
};

/** Formatea fecha en formato largo español */
export const formatearLargo = (fecha: FechaISO): string => {
  const d = new Date(fecha + 'T12:00:00');
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// ============================================
// SESSION MATH (Matemática de Sesiones)
// ============================================

/** Convierte horas totales en número de días lectivos reales */
export const calcularDiasLectivos = (totalHoras: number, horasPorDia: number): number => {
  return Math.ceil(totalHoras / horasPorDia);
};

/** Valida si una UA cumple con los límites normativos (10h - 30h) */
export const esUAValida = (horas: number): boolean => {
  return horas >= 10 && horas <= 30;
};

/** Formatea el tiempo para el Anexo IV (Ej: "2 horas") */
export const formatoTiempoSdA = (horas: number): string => {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (m === 0) return `${h} horas`;
  return `${h}h ${m}min`;
};

/** Calcula el "Margen de Aula" (El 20% de Minerva) */
export const calcularMargenCortesia = (horasUA: number, porcentaje: number = 0.2): number => {
  return horasUA * porcentaje;
};
