/**
 * ============================================
 * eFPear CertiCalc - Distribution Engine v1.1
 * ============================================
 * Motor de distribución pedagógica con taxonomía de Bloom
 * 
 * Responsabilidad: dado un MF con horas totales y niveles Bloom,
 * generar la estructura de UAs (Unidades de Aprendizaje) con:
 *   - Número de UAs
 *   - Horas por UA
 *   - Nivel Bloom por UA
 *   - Número de SdAs (Situaciones de Aprendizaje) por UA
 *   - Método principal y técnica por UA
 * 
 * 100% determinístico: misma entrada → misma salida
 * Sin dependencias externas (React-free, Node-free)
 * 
 * @module distributionEngine
 */

import type { BloomLevel, MetodoPrincipal } from '../types';

// ============================================
// CONSTANTS
// ============================================

/** Etiquetas Bloom en español */
export const BLOOM_LABELS: Record<BloomLevel, string> = {
  1: 'Recordar',
  2: 'Comprender',
  3: 'Aplicar',
  4: 'Analizar',
  5: 'Evaluar',
  6: 'Crear',
};

/** Mapeo Bloom → Método principal */
export const METODO_POR_BLOOM: Record<BloomLevel, MetodoPrincipal> = {
  1: 'Expositivo',
  2: 'Expositivo',
  3: 'Demostrativo',
  4: 'Interrogativo',
  5: 'Descubrimiento',
  6: 'Proyecto',
};

/** Técnicas base por método */
export const TECNICA_BASE: Record<MetodoPrincipal, string> = {
  'Expositivo': 'Lección magistral participativa',
  'Demostrativo': 'Demostración práctica + práctica guiada',
  'Interrogativo': 'Estudio de caso + debate dirigido',
  'Descubrimiento': 'Simulación + resolución de problemas',
  'Proyecto': 'Aprendizaje basado en proyectos (ABP)',
};

/** Agrupaciones sugeridas por método */
export const AGRUPACION_POR_METODO: Record<MetodoPrincipal, string> = {
  'Expositivo': 'Gran grupo',
  'Demostrativo': 'Gran grupo + parejas',
  'Interrogativo': 'Grupos 3-4',
  'Descubrimiento': 'Grupos 3-4',
  'Proyecto': 'Grupos 4-5',
};

// ============================================
// CONFIGURATION
// ============================================

export interface DistributionConfig {
  horasMinUA: number;
  horasMaxUA: number;
  horasPorSdA: number;
  sdasMinUA: number;
  sdasMaxUA: number;
}

export const DEFAULT_DISTRIBUTION_CONFIG: DistributionConfig = {
  horasMinUA: 8,
  horasMaxUA: 40,
  horasPorSdA: 2,
  sdasMinUA: 2,
  sdasMaxUA: 10,
};

// ============================================
// OUTPUT TYPES
// ============================================

export interface UADistribution {
  numero: number;
  horasTotales: number;
  bloomLevel: BloomLevel;
  bloomLabel: string;
  sdasAjustadas: number;
  metodoPrincipal: MetodoPrincipal;
  tecnicaBase: string;
  agrupacionSugerida: string;
}

export interface DistributionResult {
  horasTotalesMF: number;
  totalUAs: number;
  uas: UADistribution[];
  horasAsignadas: number;
  totalSdAs: number;
  config: DistributionConfig;
}

// ============================================
// CORE ENGINE
// ============================================

function calcularNumeroUAs(horasMF: number, config: DistributionConfig): number {
  const TARGET_HORAS_UA = 20;
  const candidato = Math.round(horasMF / TARGET_HORAS_UA);
  const minUAs = Math.max(1, Math.ceil(horasMF / config.horasMaxUA));
  const maxUAs = Math.max(1, Math.floor(horasMF / config.horasMinUA));
  return Math.max(minUAs, Math.min(maxUAs, candidato));
}

function distribuirHoras(horasMF: number, numUAs: number): number[] {
  const base = Math.floor(horasMF / numUAs);
  const sobrante = horasMF - base * numUAs;
  const horas: number[] = [];
  for (let i = 0; i < numUAs; i++) {
    horas.push(base + (i < sobrante ? 1 : 0));
  }
  return horas;
}

function generarBloomAutomatico(
  numUAs: number,
  bloomMin: BloomLevel = 1,
  bloomMax: BloomLevel = 5
): BloomLevel[] {
  if (numUAs === 1) {
    return [Math.ceil((bloomMin + bloomMax) / 2) as BloomLevel];
  }
  const levels: BloomLevel[] = [];
  for (let i = 0; i < numUAs; i++) {
    const ratio = i / (numUAs - 1);
    const bloom = Math.round(bloomMin + ratio * (bloomMax - bloomMin));
    levels.push(Math.max(1, Math.min(6, bloom)) as BloomLevel);
  }
  return levels;
}

function calcularSdAs(horasUA: number, config: DistributionConfig): number {
  const raw = Math.round(horasUA / config.horasPorSdA);
  return Math.max(config.sdasMinUA, Math.min(config.sdasMaxUA, raw));
}

// ============================================
// PUBLIC API
// ============================================

export function calcularDistribucionPedagogicaConBloom(
  horasMF: number,
  bloomPorUA?: BloomLevel[],
  config: Partial<DistributionConfig> = {}
): DistributionResult {
  const cfg: DistributionConfig = { ...DEFAULT_DISTRIBUTION_CONFIG, ...config };

  if (horasMF <= 0) {
    throw new Error(`Horas del MF deben ser positivas: ${horasMF}`);
  }

  let numUAs: number;
  if (bloomPorUA && bloomPorUA.length > 0) {
    numUAs = bloomPorUA.length;
  } else {
    numUAs = calcularNumeroUAs(horasMF, cfg);
  }

  const blooms: BloomLevel[] = bloomPorUA && bloomPorUA.length === numUAs
    ? [...bloomPorUA]
    : generarBloomAutomatico(numUAs);

  const horasDistribuidas = distribuirHoras(horasMF, numUAs);

  const uas: UADistribution[] = [];
  let totalSdAs = 0;

  for (let i = 0; i < numUAs; i++) {
    const bloom = blooms[i];
    const metodo = METODO_POR_BLOOM[bloom];
    const sdas = calcularSdAs(horasDistribuidas[i], cfg);
    totalSdAs += sdas;

    uas.push({
      numero: i + 1,
      horasTotales: horasDistribuidas[i],
      bloomLevel: bloom,
      bloomLabel: BLOOM_LABELS[bloom],
      sdasAjustadas: sdas,
      metodoPrincipal: metodo,
      tecnicaBase: TECNICA_BASE[metodo],
      agrupacionSugerida: AGRUPACION_POR_METODO[metodo],
    });
  }

  return {
    horasTotalesMF: horasMF,
    totalUAs: numUAs,
    uas,
    horasAsignadas: horasDistribuidas.reduce((a, b) => a + b, 0),
    totalSdAs,
    config: cfg,
  };
}

export function sugerirBloomPorNivel(
  nivelCertificado: 1 | 2 | 3,
  numUAs: number
): BloomLevel[] {
  const rangos: Record<number, [BloomLevel, BloomLevel]> = {
    1: [1, 3],
    2: [1, 4],
    3: [2, 5],
  };
  const [min, max] = rangos[nivelCertificado] || [1, 5];
  return generarBloomAutomatico(numUAs, min, max);
}
