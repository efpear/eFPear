/**
 * eFPear CertiCalc - Engine Barrel Export
 * Central import point for all engines.
 */

// Calendar Engine (sessions, holidays, cascade)
export {
  calcularSesionesModulo,
  calcularModulosCascada,
  verificarCoherencia,
  calcularMetricas,
  moverSesion,
  recalcularCascada,
  generarSetFestivos,
  festivosNacionales,
  festivosCanarias,
  festivosAutonomicos,
  semanaSanta,
  DEFAULT_TURNOS,
  DEFAULT_CONFIG,
} from './calendarEngine';
export type {
  CCAA,
  IslaCanaria,
  Turno,
  ConfiguracionTurnos,
  ConfiguracionRegional,
  ConfiguracionCalendario,
  MetricasPlanificacion,
  Alerta,
  ResultadoCoherencia,
} from './calendarEngine';

// Distribution Engine (Bloom v1.1)
export {
  calcularDistribucionPedagogicaConBloom,
  sugerirBloomPorNivel,
  BLOOM_LABELS,
  METODO_POR_BLOOM,
  TECNICA_BASE,
  AGRUPACION_POR_METODO,
  DEFAULT_DISTRIBUTION_CONFIG,
} from './distributionEngine';
export type {
  DistributionConfig,
  UADistribution,
  DistributionResult,
} from './distributionEngine';

// Curriculum Engine (7-step pipeline)
export {
  asignarCapacidadesAUA,
  asignarContenidosAUA,
  generarSdAParaUA,
  generarTextoMetodologiaUA,
  generarTextoEvaluacionUA,
  procesarModuloFormativo,
  procesarCertificadoCompleto,
} from './curriculumEngine';
export type {
  UACompleta,
  CurriculumResult,
  AnexoIVData,
} from './curriculumEngine';

// Verb Dictionary
export {
  DICCIONARIO_VERBOS,
  buscarVerbo,
  inferirBloomDeTexto,
  verbosPorNivel,
} from './verbsDictionary';

// Text Templates
export {
  generarEstrategia,
  generarDesarrollo,
  generarObjetivoSdA,
  generarMetodologiaUA,
  generarEvaluacionUA,
} from './textTemplates';

// SdA Engine
export {
  generarSdAsCompletas,
  validarCoberturaCriterios,
  estadisticasSdAs,
  DEFAULT_SDA_CONFIG,
} from './sdaEngine';
export type { SdAGenerationConfig } from './sdaEngine';

// SdA Edit Engine
export {
  addSdA,
  duplicateSdA,
  deleteSdA,
  updateSdA,
  addCEToSdA,
  removeCEFromSdA,
  reorderSdAs,
  recalcularFases,
  recalcularIds,
  validarSdAs,
} from './sdaEditEngine';

// Anexo IV Templates
export {
  renderCabeceraAnexo,
  renderObjetivoGeneral,
  renderTablaSdA,
  renderEspacios,
  renderMetodologiaEvaluacion,
  renderAnexoIVCompleto,
  renderAnexoIVPreview,
} from './anexoTemplates';
export type {
  DatosCentro,
  DatosCertificado,
  DatosModulo,
  EspacioFormativo,
  AnexoIVOptions,
} from './anexoTemplates';

// Eligibility Engine v1.0
export {
  evaluarElegibilidad,
  GOLDEN_CASE_A_REQUIREMENTS,
  GOLDEN_CASE_B_REQUIREMENTS,
} from './eligibilityEngine';
export type { EligibilityResult, TrainerProfile, BoeRequirements } from './eligibilityEngine';

// BOE Data Registry
export { obtenerDatosUF, obtenerDatosMF, obtenerDatosCertificado, tieneDatosBoe, codigosUFDisponibles, codigosMFDisponibles } from '../data/boeRegistry';
