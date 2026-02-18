/**
 * ============================================
 * eFPear CertiCalc - Diccionario de Verbos Bloom
 * ============================================
 * Mapeo verbo → nivel Bloom + forma sustantiva.
 * Usado por textTemplates y sdaEngine para:
 *   - Inferir nivel Bloom de capacidades/criterios
 *   - Generar texto metodológico con sustantivos
 * 
 * 100% determinístico. Sin dependencias externas.
 * @module verbsDictionary
 */

import type { BloomLevel } from '../types';

export interface VerbEntry {
  /** Forma sustantiva del verbo */
  sustantivo: string;
  /** Nivel Bloom predominante */
  bloom: BloomLevel;
  /** Verbos alternativos/sinónimos en minúsculas */
  sinonimos?: string[];
}

/**
 * Diccionario principal de verbos pedagógicos.
 * Clave: verbo en infinitivo, primera letra mayúscula.
 * Ordenado por nivel Bloom ascendente.
 */
export const DICCIONARIO_VERBOS: Record<string, VerbEntry> = {
  // ── BLOOM 1: Recordar ──
  'Definir':      { sustantivo: 'Definición',      bloom: 1 },
  'Enumerar':     { sustantivo: 'Enumeración',     bloom: 1 },
  'Identificar':  { sustantivo: 'Identificación',  bloom: 1 },
  'Listar':       { sustantivo: 'Listado',         bloom: 1 },
  'Nombrar':      { sustantivo: 'Denominación',    bloom: 1 },
  'Reconocer':    { sustantivo: 'Reconocimiento',  bloom: 1 },
  'Recordar':     { sustantivo: 'Memorización',    bloom: 1 },
  'Repetir':      { sustantivo: 'Repetición',      bloom: 1 },
  'Señalar':      { sustantivo: 'Señalización',    bloom: 1 },

  // ── BLOOM 2: Comprender ──
  'Clasificar':   { sustantivo: 'Clasificación',   bloom: 2 },
  'Comparar':     { sustantivo: 'Comparación',     bloom: 2 },
  'Describir':    { sustantivo: 'Descripción',     bloom: 2 },
  'Diferenciar':  { sustantivo: 'Diferenciación',  bloom: 2 },
  'Explicar':     { sustantivo: 'Explicación',     bloom: 2 },
  'Interpretar':  { sustantivo: 'Interpretación',  bloom: 2 },
  'Resumir':      { sustantivo: 'Resumen',         bloom: 2 },
  'Traducir':     { sustantivo: 'Traducción',      bloom: 2 },

  // ── BLOOM 3: Aplicar ──
  'Aplicar':      { sustantivo: 'Aplicación',      bloom: 3 },
  'Calcular':     { sustantivo: 'Cálculo',         bloom: 3 },
  'Completar':    { sustantivo: 'Completado',      bloom: 3 },
  'Demostrar':    { sustantivo: 'Demostración',    bloom: 3 },
  'Ejecutar':     { sustantivo: 'Ejecución',       bloom: 3 },
  'Implementar':  { sustantivo: 'Implementación',  bloom: 3 },
  'Manipular':    { sustantivo: 'Manipulación',    bloom: 3 },
  'Operar':       { sustantivo: 'Operación',       bloom: 3 },
  'Preparar':     { sustantivo: 'Preparación',     bloom: 3 },
  'Realizar':     { sustantivo: 'Realización',     bloom: 3 },
  'Resolver':     { sustantivo: 'Resolución',      bloom: 3 },
  'Utilizar':     { sustantivo: 'Utilización',     bloom: 3 },

  // ── BLOOM 4: Analizar ──
  'Analizar':     { sustantivo: 'Análisis',        bloom: 4 },
  'Categorizar':  { sustantivo: 'Categorización',  bloom: 4 },
  'Deducir':      { sustantivo: 'Deducción',       bloom: 4 },
  'Descomponer':  { sustantivo: 'Descomposición',  bloom: 4 },
  'Diagnosticar': { sustantivo: 'Diagnóstico',     bloom: 4 },
  'Distinguir':   { sustantivo: 'Distinción',      bloom: 4 },
  'Examinar':     { sustantivo: 'Examen',          bloom: 4 },
  'Inspeccionar': { sustantivo: 'Inspección',      bloom: 4 },
  'Investigar':   { sustantivo: 'Investigación',   bloom: 4 },
  'Relacionar':   { sustantivo: 'Relación',        bloom: 4 },
  'Seleccionar':  { sustantivo: 'Selección',       bloom: 4 },
  'Verificar':    { sustantivo: 'Verificación',    bloom: 4 },

  // ── BLOOM 5: Evaluar ──
  'Argumentar':   { sustantivo: 'Argumentación',   bloom: 5 },
  'Comprobar':    { sustantivo: 'Comprobación',    bloom: 5 },
  'Criticar':     { sustantivo: 'Crítica',         bloom: 5 },
  'Evaluar':      { sustantivo: 'Evaluación',      bloom: 5 },
  'Juzgar':       { sustantivo: 'Juicio',          bloom: 5 },
  'Justificar':   { sustantivo: 'Justificación',   bloom: 5 },
  'Recomendar':   { sustantivo: 'Recomendación',   bloom: 5 },
  'Validar':      { sustantivo: 'Validación',      bloom: 5 },
  'Valorar':      { sustantivo: 'Valoración',      bloom: 5 },

  // ── BLOOM 6: Crear ──
  'Combinar':     { sustantivo: 'Combinación',     bloom: 6 },
  'Componer':     { sustantivo: 'Composición',     bloom: 6 },
  'Construir':    { sustantivo: 'Construcción',    bloom: 6 },
  'Crear':        { sustantivo: 'Creación',        bloom: 6 },
  'Desarrollar':  { sustantivo: 'Desarrollo',      bloom: 6 },
  'Diseñar':      { sustantivo: 'Diseño',          bloom: 6 },
  'Elaborar':     { sustantivo: 'Elaboración',     bloom: 6 },
  'Formular':     { sustantivo: 'Formulación',     bloom: 6 },
  'Generar':      { sustantivo: 'Generación',      bloom: 6 },
  'Idear':        { sustantivo: 'Ideación',        bloom: 6 },
  'Inventar':     { sustantivo: 'Invención',       bloom: 6 },
  'Planificar':   { sustantivo: 'Planificación',   bloom: 6 },
  'Producir':     { sustantivo: 'Producción',      bloom: 6 },
  'Proponer':     { sustantivo: 'Propuesta',       bloom: 6 },
  'Redactar':     { sustantivo: 'Redacción',       bloom: 6 },
};

/** Mapa inverso: buscar por verbo en minúsculas (para lookups rápidos) */
const _INDEX: Map<string, VerbEntry> = new Map();
for (const [verbo, entry] of Object.entries(DICCIONARIO_VERBOS)) {
  _INDEX.set(verbo.toLowerCase(), entry);
  entry.sinonimos?.forEach(s => _INDEX.set(s, entry));
}

/**
 * Busca un verbo en el diccionario (case-insensitive).
 * Extrae el primer verbo de una frase si se pasa texto largo.
 */
export function buscarVerbo(texto: string): VerbEntry | null {
  // Intento directo
  const direct = _INDEX.get(texto.toLowerCase());
  if (direct) return direct;

  // Extraer primer verbo (infinitivo) de una frase
  const match = texto.match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:ar|er|ir))\b/i);
  if (match) {
    const candidato = match[1].toLowerCase();
    return _INDEX.get(candidato) ?? null;
  }

  return null;
}

/**
 * Infiere el nivel Bloom de un texto (capacidad o criterio).
 * Busca verbos conocidos y devuelve el nivel más alto encontrado.
 * Default: 3 (Aplicar) si no se encuentran verbos.
 */
export function inferirBloomDeTexto(texto: string): BloomLevel {
  const palabras = texto.split(/\s+/);
  let maxBloom: BloomLevel = 0 as BloomLevel;
  let found = false;

  for (const palabra of palabras) {
    const clean = palabra.replace(/[.,;:()]/g, '').toLowerCase();
    const entry = _INDEX.get(clean);
    if (entry && entry.bloom > maxBloom) {
      maxBloom = entry.bloom;
      found = true;
    }
  }

  return found ? maxBloom : 3; // Default: Aplicar
}

/**
 * Devuelve todos los verbos de un nivel Bloom específico.
 */
export function verbosPorNivel(nivel: BloomLevel): string[] {
  return Object.entries(DICCIONARIO_VERBOS)
    .filter(([_, entry]) => entry.bloom === nivel)
    .map(([verbo]) => verbo);
}
