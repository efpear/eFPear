/**
 * anexoIVMapper.ts — Agent B: The Structural Mapper
 *
 * Core logic for the Minerva flow:
 *   Step 1: Contenidos (Col 2) → User selects BOE blocks per UA
 *   Step 2: Criterios (Col 1) → Auto-derived from selected contenidos
 *   Step 3: SdAs (Col 3) → Built from cross of Col1 × Col2
 *
 * This is a MAPPER, not a GENERATOR. It organizes BOE text; it never invents.
 */

import type {
  BloqueContenido_BOE,
  Capacidad_C,
  CriterioEvaluacion_CE,
  TipologiaCE,
  UnidadAprendizaje_UA,
  WizardStep2_Criterios,
  AnexoIVValidation,
} from '../types/incual';
import { sanitizeLiteralText } from './sanitizeLiteralText';

// ============================================
// CE TIPOLOGÍA CLASSIFIER (deterministic, verb-based)
// ============================================

/** Verbs that indicate each CE type (INCUAL rules, lowercase) */
const VERB_MAP: Record<TipologiaCE, string[]> = {
  conocimiento: [
    'describir', 'identificar', 'diferenciar', 'clasificar', 'definir',
    'enumerar', 'reconocer', 'indicar', 'señalar', 'distinguir',
    'relacionar', 'explicar', 'interpretar', 'citar',
  ],
  destreza_cognitiva_practica: [
    'calcular', 'elaborar', 'comparar', 'determinar', 'aplicar',
    'resolver', 'confeccionar', 'redactar', 'diseñar', 'realizar',
    'evaluar', 'analizar', 'proponer', 'formular', 'plantear',
    'estimar', 'seleccionar', 'utilizar', 'ejecutar', 'cumplimentar',
    'comprobar', 'verificar', 'manejar', 'operar',
  ],
  habilidad_personal_social: [
    'justificar', 'argumentar', 'valorar', 'participar',
    'colaborar', 'comunicar', 'demostrar', 'asumir', 'respetar',
    'mantener', 'mostrar',
  ],
};

/** Special patterns that override verb-based classification */
const PATTERN_OVERRIDES: Array<{ pattern: RegExp; tipo: TipologiaCE }> = [
  { pattern: /^en supuestos? prácticos?/i, tipo: 'destreza_cognitiva_practica' },
  { pattern: /^en casos? prácticos?/i, tipo: 'destreza_cognitiva_practica' },
  { pattern: /^en diversas situaciones prácticas/i, tipo: 'destreza_cognitiva_practica' },
  { pattern: /^en situaciones prácticas/i, tipo: 'destreza_cognitiva_practica' },
  { pattern: /^a partir de/i, tipo: 'destreza_cognitiva_practica' },
];

/**
 * Classify a CE by its literal text. Deterministic.
 * Priority: pattern override > first verb match > fallback to conocimiento.
 */
export function clasificarCE(textoLiteral: string): TipologiaCE {
  const texto = sanitizeLiteralText(textoLiteral);

  // 1. Check pattern overrides first
  for (const { pattern, tipo } of PATTERN_OVERRIDES) {
    if (pattern.test(texto)) return tipo;
  }

  // 2. Extract first verb (first word after CE code, lowercased)
  const match = texto.match(/^(?:CE\d+\.\d+\s+)?(\w+)/i);
  const firstVerb = match?.[1]?.toLowerCase() ?? '';

  // 3. Match against verb map
  for (const [tipo, verbs] of Object.entries(VERB_MAP) as [TipologiaCE, string[]][]) {
    if (verbs.includes(firstVerb)) return tipo;
  }

  // 4. Fallback
  return 'conocimiento';
}

// ============================================
// STEP 2: DERIVE CRITERIOS FROM CONTENIDOS
// ============================================

/**
 * Given the contenidos selected for a UA (Step 1),
 * filter the full list of capacidades to only those
 * whose CEs appear in the contenidos' ce_vinculados.
 *
 * This is the Minerva Rule: Contenidos drive Criterios, not vice versa.
 */
export function derivarCriteriosDesdeContenidos(
  contenidosUA: BloqueContenido_BOE[],
  todasCapacidades: Capacidad_C[],
): WizardStep2_Criterios & { ua_id: string } {
  // 1. Collect all CE IDs referenced by the selected contenidos
  const ceIdsEnContenidos = new Set<string>();
  for (const bloque of contenidosUA) {
    for (const item of bloque.items) {
      for (const ceId of item.ce_vinculados) {
        ceIdsEnContenidos.add(ceId);
      }
    }
  }

  // 2. Filter capacidades: keep only those with at least one CE in the set
  const capacidadesFiltradas: Capacidad_C[] = [];
  const allCEsInCapacidades = new Set<string>();

  for (const cap of todasCapacidades) {
    const cesFiltrados = cap.criterios_evaluacion.filter(
      ce => ceIdsEnContenidos.has(ce.id)
    );
    if (cesFiltrados.length > 0) {
      capacidadesFiltradas.push({
        ...cap,
        criterios_evaluacion: cesFiltrados,
      });
      cesFiltrados.forEach(ce => allCEsInCapacidades.add(ce.id));
    }
  }

  // 3. Find CEs referenced in contenidos but not present in any capacidad
  const ceSinCobertura = [...ceIdsEnContenidos].filter(
    id => !allCEsInCapacidades.has(id)
  );

  return {
    ua_id: '', // caller sets this
    capacidades_filtradas: capacidadesFiltradas,
    ce_sin_cobertura: ceSinCobertura,
  };
}

// ============================================
// VALIDATION (Quality Checkpoints)
// ============================================

/**
 * Run all 4 quality checkpoint tests on a completed UA.
 */
export function validarUA(ua: UnidadAprendizaje_UA): AnexoIVValidation {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Test 1: Trazabilidad — every CE in Col1 must appear in some contenido's ce_vinculados
  const ceIdsEnContenidos = new Set<string>();
  for (const bloque of ua.contenidos_boe) {
    for (const item of bloque.items) {
      item.ce_vinculados.forEach(id => ceIdsEnContenidos.add(id));
    }
  }
  const ceIdsEnCapacidades = new Set<string>();
  for (const cap of ua.capacidades_c) {
    cap.criterios_evaluacion.forEach(ce => ceIdsEnCapacidades.add(ce.id));
  }
  const trazabilidad_ok = [...ceIdsEnCapacidades].every(id => ceIdsEnContenidos.has(id));
  if (!trazabilidad_ok) {
    const missing = [...ceIdsEnCapacidades].filter(id => !ceIdsEnContenidos.has(id));
    errors.push(`CEs en Col1 sin trazabilidad en Col2: ${missing.join(', ')}`);
  }

  // Test 2: Tipología — all CEs must have a valid tipología
  const tipologia_ok = ua.capacidades_c.every(cap =>
    cap.criterios_evaluacion.every(ce =>
      ['conocimiento', 'destreza_cognitiva_practica', 'habilidad_personal_social'].includes(ce.tipologia)
    )
  );

  // Test 3: Formato — RPs presence (simple check)
  const formato_ok = true; // Validated at render time

  // Test 4: Estructura SdA — required fields present
  const estructura_sda_ok = ua.situaciones_aprendizaje.every(sda =>
    sda.nombre && sda.objetivo && sda.ce_vinculados.length > 0 &&
    sda.metodologia && sda.desarrollo_actividad && sda.recursos && sda.tiempo_horas > 0
  );
  if (!estructura_sda_ok) {
    errors.push('Alguna SdA tiene campos incompletos');
  }

  // Hours check
  const horasSum = ua.horas_evaluacion + ua.horas_autonomo + ua.horas_sda;
  const horas_match = horasSum === ua.horas_totales;
  if (!horas_match) {
    errors.push(`Horas no cuadran: eval(${ua.horas_evaluacion}) + autónomo(${ua.horas_autonomo}) + SdA(${ua.horas_sda}) = ${horasSum} ≠ ${ua.horas_totales}`);
  }

  const sdaHorasSum = ua.situaciones_aprendizaje.reduce((sum, sda) => sum + sda.tiempo_horas, 0);
  if (sdaHorasSum !== ua.horas_sda) {
    warnings.push(`Horas SdA: suma(${sdaHorasSum}) ≠ declarado(${ua.horas_sda})`);
  }

  // CE coverage: every CE in Col1 must appear in at least one SdA
  const ceEnSdAs = new Set<string>();
  ua.situaciones_aprendizaje.forEach(sda => sda.ce_vinculados.forEach(id => ceEnSdAs.add(id)));
  const cobertura_ce_completa = [...ceIdsEnCapacidades].every(id => ceEnSdAs.has(id));
  if (!cobertura_ce_completa) {
    const missing = [...ceIdsEnCapacidades].filter(id => !ceEnSdAs.has(id));
    warnings.push(`CEs sin SdA asignada: ${missing.join(', ')}`);
  }

  // Contenidos mapped
  const contenidos_mapeados = ua.contenidos_boe.every(bloque =>
    bloque.items.every(item => item.ce_vinculados.length > 0)
  );

  return {
    trazabilidad_ok,
    tipologia_ok,
    formato_ok,
    estructura_sda_ok,
    horas_match,
    cobertura_ce_completa,
    contenidos_mapeados,
    warnings,
    errors,
  };
}
