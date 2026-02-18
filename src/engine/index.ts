/**
 * eFPear CertiCalc - Engine Barrel Export
 * Central import point for all engines.
 */

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
