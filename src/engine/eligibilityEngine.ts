/**
 * eligibilityEngine.ts v1.1 -- Motor de Elegibilidad
 *
 * Evalua en cascada (fail-fast) si un formador/a puede impartir
 * un MF concreto segun el BOE.
 *
 * v1.1 additions:
 *   - CatalogEntry interface (extends BoeRequirements with cert metadata)
 *   - CATALOG: all HOTA0308 MFs with real BOE requirements
 *   - GOLDEN_CASE_A updated to match actual HOTA0308 BOE data
 *
 * Cascada de evaluacion:
 * 1. Check Academico (titulacion)
 * 2. Check Experiencia (anos sectoriales)
 * 3. Check Docente (CAP/Master/SSCE0110/>600h)
 * 4. Check Especifico (idiomas, otros)
 */

import type {
  TrainerProfile,
  BoeRequirements,
  EligibilityResult,
  EligibilityMessage,
  EligibilityStatus,
} from '../types/eligibility';

export type { EligibilityResult, TrainerProfile, BoeRequirements };

// ============================================================
// CATALOG TYPES
// ============================================================

/**
 * CatalogEntry extends BoeRequirements with certificate-level metadata
 * needed for grouping results by familia profesional and CP.
 */
export interface CatalogEntry extends BoeRequirements {
  /** e.g. 'HOTA0308' */
  codigoCert: string;
  /** e.g. 'Recepcion en alojamientos' */
  nombreCert: string;
  /** e.g. 'Hosteleria y Turismo' */
  familiaProfesional: string;
  /** Certificate level */
  nivelCert: 1 | 2 | 3;
}

// ============================================================
// CONSTANTS
// ============================================================

/** Horas de experiencia docente que eximen del titulo docente */
const HORAS_EXENCION_DOCENTE = 600;

/**
 * Aviso legal que debe acompanar todo resultado de elegibilidad.
 * OBLIGATORIO mostrar en UI.
 */
export const LEGAL_DISCLAIMER = {
  titulo: 'Resultado orientativo -- sin valor legal',
  texto: 'Esta herramienta realiza una estimacion orientativa basada en la interpretacion automatizada de los requisitos publicados en el BOE. No constituye certificacion, habilitacion ni resolucion administrativa. La determinacion oficial de la elegibilidad corresponde exclusivamente al organo competente de la Administracion. Consulte siempre la normativa vigente y la entidad acreditadora antes de tomar decisiones.',
  base_legal: 'Basado en RD que regula cada Certificado de Profesionalidad y normativa general de formacion profesional para el empleo.',
} as const;

/** Niveles de idioma ordenados (para comparacion) */
const NIVELES_IDIOMA = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// ============================================================
// MAIN EVALUATION
// ============================================================

/**
 * Evalua la elegibilidad de un formador para un MF.
 */
export function evaluarElegibilidad(
  perfil: TrainerProfile,
  requisitos: BoeRequirements
): EligibilityResult {
  const mensajes: EligibilityMessage[] = [];
  let status: EligibilityStatus = 'ELEGIBLE';
  let tieneTitulacion = false;
  let experienciaRequerida = 0;

  // ---- STEP 1: CHECK ACADEMICO ----
  const matchResult = checkAcademico(perfil, requisitos);
  tieneTitulacion = matchResult.cumple;
  mensajes.push(...matchResult.mensajes);

  if (tieneTitulacion) {
    experienciaRequerida = requisitos.experienciaConTitulacion;
  } else if (requisitos.permiteExpertosSinTitulacion) {
    experienciaRequerida = requisitos.experienciaSinTitulacion;
  } else {
    // No titulacion + no permite expertos = NO ELEGIBLE
    status = 'NO_ELEGIBLE';
    return {
      status,
      mensajes,
      resumen: 'No elegible para ' + requisitos.codigoMF + ': no cumple requisito academico.',
    };
  }

  // ---- STEP 2: CHECK EXPERIENCIA ----
  const expResult = checkExperiencia(perfil, experienciaRequerida, tieneTitulacion);
  mensajes.push(...expResult.mensajes);

  if (!expResult.cumple) {
    status = 'NO_ELEGIBLE';
    return {
      status,
      mensajes,
      resumen: 'No elegible para ' + requisitos.codigoMF + ': experiencia profesional insuficiente (' + perfil.experienciaSectorial + ' anos vs ' + experienciaRequerida + ' requeridos).',
    };
  }

  // ---- STEP 3: CHECK DOCENTE ----
  const docResult = checkDocente(perfil);
  mensajes.push(...docResult.mensajes);

  if (!docResult.cumple) {
    status = 'CONDICIONAL';
  }

  // ---- STEP 4: CHECK ESPECIFICO (idiomas, otros) ----
  const specResult = checkEspecifico(perfil, requisitos);
  mensajes.push(...specResult.mensajes);

  if (!specResult.cumple) {
    // Missing specific requirement downgrades to NO_ELEGIBLE
    status = 'NO_ELEGIBLE';
    return {
      status,
      mensajes,
      resumen: 'No elegible para ' + requisitos.codigoMF + ': no cumple requisito especifico.',
    };
  }

  // ---- BUILD RESULT ----
  const resumen = status === 'ELEGIBLE'
    ? 'Elegible para ' + requisitos.codigoMF + ' (' + requisitos.nombreMF + ').'
    : 'Elegible con condiciones para ' + requisitos.codigoMF + ': necesita acreditar competencia docente.';

  return { status, mensajes, resumen };
}

// ============================================================
// INDIVIDUAL CHECKS
// ============================================================

interface CheckResult {
  cumple: boolean;
  mensajes: EligibilityMessage[];
}

/** Check 1: Academico -- titulacion */
function checkAcademico(
  perfil: TrainerProfile,
  requisitos: BoeRequirements
): CheckResult {
  const mensajes: EligibilityMessage[] = [];

  // Normalize for comparison
  const perfilTitNorm = perfil.titulaciones.map(t => t.toLowerCase().trim());
  const reqTitNorm = requisitos.titulacionesRequeridas.map(t => t.toLowerCase().trim());

  // Check for direct match (substring: "grado" matches "grado en turismo")
  const match = perfilTitNorm.some(pt =>
    reqTitNorm.some(rt => pt.includes(rt) || rt.includes(pt))
  );

  // Also check by level if specified
  const nivelOk = requisitos.nivelMinimoRequerido
    ? perfil.nivelMaximo >= requisitos.nivelMinimoRequerido
    : true;

  const cumple = match || nivelOk;

  if (cumple) {
    const matchedTit = perfil.titulaciones.find(pt =>
      reqTitNorm.some(rt => pt.toLowerCase().includes(rt) || rt.includes(pt.toLowerCase()))
    );
    mensajes.push({
      tipo: 'success',
      texto: matchedTit
        ? 'Titulacion aceptada: ' + matchedTit + '.'
        : 'Nivel academico ' + perfil.nivelMaximo + ' cumple el minimo requerido.',
      referenciaBoe: 'Titulaciones requeridas: ' + requisitos.titulacionesRequeridas.join(', ') + '.',
      categoria: 'academico',
    });
  } else {
    if (requisitos.permiteExpertosSinTitulacion) {
      mensajes.push({
        tipo: 'warning',
        texto: 'No tienes titulacion requerida. Puedes acceder como experto con ' + requisitos.experienciaSinTitulacion + ' anos de experiencia.',
        referenciaBoe: 'Titulaciones requeridas: ' + requisitos.titulacionesRequeridas.join(', ') + '. Alternativa: experiencia profesional de ' + requisitos.experienciaSinTitulacion + ' anos.',
        categoria: 'academico',
      });
    } else {
      mensajes.push({
        tipo: 'error',
        texto: 'No cumples el requisito academico. No se admite acceso sin titulacion para este MF.',
        referenciaBoe: 'Titulaciones requeridas: ' + requisitos.titulacionesRequeridas.join(', ') + '.',
        categoria: 'academico',
      });
    }
  }

  return { cumple, mensajes };
}

/** Check 2: Experiencia profesional sectorial */
function checkExperiencia(
  perfil: TrainerProfile,
  experienciaRequerida: number,
  tieneTitulacion: boolean
): CheckResult {
  const mensajes: EligibilityMessage[] = [];
  const cumple = perfil.experienciaSectorial >= experienciaRequerida;

  if (cumple) {
    mensajes.push({
      tipo: 'success',
      texto: 'Experiencia profesional suficiente: ' + perfil.experienciaSectorial + ' anos (minimo: ' + experienciaRequerida + ').',
      referenciaBoe: tieneTitulacion
        ? 'Con titulacion: minimo ' + experienciaRequerida + ' ano(s) de experiencia.'
        : 'Sin titulacion (experto): minimo ' + experienciaRequerida + ' ano(s) de experiencia.',
      categoria: 'experiencia',
    });
  } else {
    const deficit = experienciaRequerida - perfil.experienciaSectorial;
    mensajes.push({
      tipo: 'error',
      texto: 'Experiencia insuficiente: ' + perfil.experienciaSectorial + ' anos (faltan ' + deficit.toFixed(1) + ' anos para el minimo de ' + experienciaRequerida + ').',
      referenciaBoe: tieneTitulacion
        ? 'Con titulacion: minimo ' + experienciaRequerida + ' ano(s) de experiencia profesional en el sector.'
        : 'Sin titulacion: minimo ' + experienciaRequerida + ' ano(s) de experiencia profesional en el sector.',
      categoria: 'experiencia',
    });
  }

  return { cumple, mensajes };
}

/** Check 3: Competencia docente */
function checkDocente(perfil: TrainerProfile): CheckResult {
  const mensajes: EligibilityMessage[] = [];

  const tieneAcreditacion =
    perfil.tieneCapOMaster ||
    perfil.tieneSSCE0110 ||
    perfil.horasExperienciaDocente >= HORAS_EXENCION_DOCENTE;

  if (tieneAcreditacion) {
    const via = perfil.tieneCapOMaster
      ? 'CAP / Master de Profesorado'
      : perfil.tieneSSCE0110
        ? 'SSCE0110 (Certificado de docencia FP)'
        : perfil.horasExperienciaDocente + 'h de experiencia docente (>600h)';

    mensajes.push({
      tipo: 'success',
      texto: 'Competencia docente acreditada: ' + via + '.',
      referenciaBoe: 'Se requiere CAP, Master de Profesorado, SSCE0110 o >600h de experiencia docente acreditada.',
      categoria: 'docente',
    });
  } else {
    mensajes.push({
      tipo: 'warning',
      texto: 'No tienes acreditacion docente. Necesitas obtener CAP, Master de Profesorado, SSCE0110 o acumular ' + HORAS_EXENCION_DOCENTE + 'h de docencia (tienes ' + perfil.horasExperienciaDocente + 'h).',
      referenciaBoe: 'Se requiere CAP, Master de Profesorado, SSCE0110 o >600h de experiencia docente acreditada.',
      categoria: 'docente',
    });
  }

  return { cumple: tieneAcreditacion, mensajes };
}

/** Check 4: Requisitos especificos (idiomas, otros) */
function checkEspecifico(
  perfil: TrainerProfile,
  requisitos: BoeRequirements
): CheckResult {
  const mensajes: EligibilityMessage[] = [];
  let cumple = true;

  // Check idioma
  if (requisitos.idiomaRequerido) {
    const { idioma, nivel: nivelRequerido } = requisitos.idiomaRequerido;
    const nivelPerfil = perfil.idiomas[idioma];

    if (nivelPerfil) {
      const idxPerfil    = NIVELES_IDIOMA.indexOf(nivelPerfil.toUpperCase());
      const idxRequerido = NIVELES_IDIOMA.indexOf(nivelRequerido.toUpperCase());

      if (idxPerfil >= idxRequerido) {
        mensajes.push({
          tipo: 'success',
          texto: 'Nivel de ' + idioma + ' acreditado: ' + nivelPerfil + ' (minimo: ' + nivelRequerido + ').',
          referenciaBoe: 'Se requiere acreditacion de ' + idioma + ' nivel ' + nivelRequerido + ' o superior.',
          categoria: 'especifico',
        });
      } else {
        cumple = false;
        mensajes.push({
          tipo: 'error',
          texto: 'Nivel de ' + idioma + ' insuficiente: ' + nivelPerfil + ' (minimo: ' + nivelRequerido + ').',
          referenciaBoe: 'Se requiere acreditacion de ' + idioma + ' nivel ' + nivelRequerido + ' o superior.',
          categoria: 'especifico',
        });
      }
    } else {
      cumple = false;
      mensajes.push({
        tipo: 'error',
        texto: 'No tienes ' + idioma + ' acreditado. Se requiere nivel ' + nivelRequerido + ' o superior.',
        referenciaBoe: 'Se requiere acreditacion de ' + idioma + ' nivel ' + nivelRequerido + ' o superior.',
        categoria: 'especifico',
      });
    }
  }

  // Check other specific requirements
  if (requisitos.otrosRequisitos && requisitos.otrosRequisitos.length > 0) {
    mensajes.push({
      tipo: 'warning',
      texto: 'Verifica que cumples estos requisitos adicionales: ' + requisitos.otrosRequisitos.join('; ') + '.',
      referenciaBoe: requisitos.otrosRequisitos.join('; '),
      categoria: 'especifico',
    });
  }

  return { cumple, mensajes };
}

// ============================================================
// GOLDEN CASE PRESETS (updated to match actual HOTA0308 BOE)
// ============================================================

/**
 * Requisitos BOE para HOTA0308 / MF0265_3 (Golden Case A).
 * Source: BOE-A-2011-9517 / RD 1057/2011
 * Titulaciones: Lic. ADE, Lic. CC Actuariales, Lic. Economia,
 *               Dipl. Turismo, Dipl. CC Empresariales
 * Experiencia con titulacion: 2 anos
 * Nota: permiteExpertosSinTitulacion pendiente verificacion INCUAL
 */
export const GOLDEN_CASE_A_REQUIREMENTS: BoeRequirements = {
  codigoMF: 'MF0265_3',
  nombreMF: 'Gestion de departamentos del area de alojamiento',
  titulacionesRequeridas: [
    'licenciado en administracion y direccion de empresas',
    'licenciado en ciencias actuariales y financieras',
    'licenciado en economia',
    'diplomado en turismo',
    'diplomado en ciencias empresariales',
    'grado',
  ],
  nivelMinimoRequerido: 2,
  experienciaConTitulacion: 2,
  experienciaSinTitulacion: 3,
  permiteExpertosSinTitulacion: true, // pending INCUAL exception verification
};

/**
 * Requisitos BOE para MF1057_2 (Golden Case B -- idioma requerido).
 * Source: BOE-A-2011-9517 / RD 1057/2011
 * Titulaciones: Lic. Filologia inglesa, Lic. Traduccion e interpretacion,
 *               Cualquier Titulacion Superior con cert EOI ingles
 */
export const GOLDEN_CASE_B_REQUIREMENTS: BoeRequirements = {
  codigoMF: 'MF1057_2',
  nombreMF: 'Ingles profesional para turismo',
  titulacionesRequeridas: [
    'licenciado en filologia inglesa',
    'licenciado en traduccion e interpretacion',
    'grado en estudios ingleses',
    'grado en traduccion e interpretacion',
    'cualquier titulacion superior con certificado EOI ingles',
  ],
  nivelMinimoRequerido: 2,
  experienciaConTitulacion: 1,
  experienciaSinTitulacion: 4,
  permiteExpertosSinTitulacion: true,
  idiomaRequerido: { idioma: 'Ingles', nivel: 'C1' },
};

// ============================================================
// FULL HOTA0308 CATALOG
// ============================================================

const HOTA0308_META = {
  codigoCert:         'HOTA0308',
  nombreCert:         'Recepcion en alojamientos',
  familiaProfesional: 'Hosteleria y Turismo',
  nivelCert:          3 as const,
};

/**
 * Complete module catalog for HOTA0308 based on BOE-A-2011-9517.
 * All modules share the same familia profesional.
 */
export const CATALOG: CatalogEntry[] = [
  {
    ...HOTA0308_META,
    codigoMF:   'MF0263_3',
    nombreMF:   'Acciones comerciales y reservas',
    titulacionesRequeridas: [
      'licenciado en administracion y direccion de empresas',
      'licenciado en publicidad y relaciones publicas',
      'licenciado en investigacion y tecnicas de mercado',
      'licenciado en economia',
      'diplomado en turismo',
      'diplomado en ciencias empresariales',
      'grado',
    ],
    nivelMinimoRequerido:          2,
    experienciaConTitulacion:      2,
    experienciaSinTitulacion:      3,
    permiteExpertosSinTitulacion:  true,
  },
  {
    ...HOTA0308_META,
    codigoMF:   'MF0264_3',
    nombreMF:   'Recepcion y atencion al cliente',
    titulacionesRequeridas: [
      'licenciado en administracion y direccion de empresas',
      'licenciado en publicidad y relaciones publicas',
      'licenciado en investigacion y tecnicas de mercado',
      'licenciado en economia',
      'diplomado en turismo',
      'diplomado en ciencias empresariales',
      'grado',
    ],
    nivelMinimoRequerido:          2,
    experienciaConTitulacion:      2,
    experienciaSinTitulacion:      3,
    permiteExpertosSinTitulacion:  true,
  },
  {
    ...HOTA0308_META,
    ...GOLDEN_CASE_A_REQUIREMENTS,
  },
  {
    ...HOTA0308_META,
    ...GOLDEN_CASE_B_REQUIREMENTS,
    nivelCert: 2 as const,
  },
];
