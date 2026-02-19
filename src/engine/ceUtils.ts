/**
 * ceUtils.ts — Shared CE Classification & Mapping Utilities
 *
 * Single source of truth for:
 *  - CE tipología classification (deterministic, verb-based)
 *  - Contenido → CE mapping
 *
 * Used by: ProgramacionWizard, anexoIVMapper, Step 2/3 components
 */

import type { BoeUFData } from '../types/boe';

// ============================================
// CE TIPOLOGÍA CLASSIFICATION
// ============================================

export type TipologiaCE = 'conocimiento' | 'destreza' | 'habilidad';

const CONOCIMIENTO_VERBS = [
  'describir', 'identificar', 'diferenciar', 'clasificar', 'definir',
  'enumerar', 'reconocer', 'indicar', 'señalar', 'distinguir',
  'relacionar', 'explicar', 'interpretar', 'citar',
];

const DESTREZA_VERBS = [
  'calcular', 'elaborar', 'comparar', 'determinar', 'aplicar',
  'resolver', 'confeccionar', 'redactar', 'diseñar', 'realizar',
  'evaluar', 'analizar', 'proponer', 'formular', 'plantear',
  'estimar', 'seleccionar', 'utilizar', 'ejecutar', 'cumplimentar',
  'comprobar', 'verificar', 'manejar', 'operar',
];

const HABILIDAD_VERBS = [
  'justificar', 'argumentar', 'valorar', 'participar',
  'colaborar', 'comunicar', 'demostrar', 'asumir', 'respetar',
  'mantener', 'mostrar',
];

/**
 * Classify a CE by its literal text. 100% deterministic.
 * Priority: pattern override > first verb match > fallback to conocimiento.
 */
export function clasificarCE(texto: string): TipologiaCE {
  const t = texto.trim();

  // Pattern overrides (practical exercises are always destreza)
  if (/^en supuestos?\s+prácticos?/i.test(t)) return 'destreza';
  if (/^en casos?\s+prácticos?/i.test(t)) return 'destreza';
  if (/^en situaciones\s+prácticas/i.test(t)) return 'destreza';
  if (/^en diversas\s+situaciones/i.test(t)) return 'destreza';
  if (/^a partir de/i.test(t)) return 'destreza';

  // Extract first verb (lowercase)
  const match = t.match(/^(?:CE\d+\.\d+\s+)?(\w+)/i);
  const verb = match?.[1]?.toLowerCase() ?? '';

  if (DESTREZA_VERBS.includes(verb)) return 'destreza';
  if (HABILIDAD_VERBS.includes(verb)) return 'habilidad';
  if (CONOCIMIENTO_VERBS.includes(verb)) return 'conocimiento';

  return 'conocimiento'; // Safe fallback
}

export const TIPOLOGIA_COLORS: Record<TipologiaCE, { bg: string; text: string; label: string }> = {
  conocimiento: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Conocimiento' },
  destreza: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Destreza' },
  habilidad: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Habilidad' },
};

// ============================================
// CONTENIDO → CE MAPPING
// ============================================

/**
 * Build a map from contenido text → CE IDs.
 * Heuristic: maps tema[n] items to capacidad[n] CEs.
 *
 * TODO: For production, use explicit ce_vinculados from parsed BOE data.
 * This heuristic works for the golden case (UF0048) where temas
 * roughly align with capacidades by index.
 */
export function buildContenidoCEMap(uf: BoeUFData): Map<string, string[]> {
  const map = new Map<string, string[]>();

  uf.contenidos.forEach((tema, temaIdx) => {
    const cap = uf.capacidades[temaIdx];
    const ceIds = cap ? cap.criterios.map(ce => ce.codigo) : [];

    tema.items.forEach(item => {
      map.set(item.texto, ceIds);
    });
  });

  return map;
}

/**
 * Collect all CE IDs linked to a set of tema indices.
 */
export function collectCEsForTemas(
  uf: BoeUFData,
  temaIndices: number[],
  ceMap: Map<string, string[]>,
): Set<string> {
  const ceIds = new Set<string>();
  temaIndices.forEach(temaIdx => {
    const tema = uf.contenidos[temaIdx];
    tema?.items.forEach(item => {
      (ceMap.get(item.texto) || []).forEach(id => ceIds.add(id));
    });
  });
  return ceIds;
}
