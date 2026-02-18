/**
 * ============================================
 * eFPear CertiCalc - Anexo IV Templates
 * ============================================
 * Renderizado HTML del Anexo IV completo.
 * Genera HTML semántico listo para:
 *   - Vista previa en la app (innerHTML)
 *   - Exportación a PDF (html2pdf / puppeteer)
 *   - Exportación a DOCX (html-docx-js)
 * 
 * Estructura del Anexo IV:
 *   1. Cabecera (datos centro, certificado, módulo)
 *   2. Objetivo general (realizaciones profesionales)
 *   3. Tablas de SdA por UA
 *   4. Espacios formativos (copiado del BOE)
 *   5. Metodología y evaluación por UA
 * 
 * 100% determinístico.
 * @module anexoTemplates
 */

import type { SdA, BloomLevel } from '../types';
import type { UACompleta, CurriculumResult } from './curriculumEngine';
import { BLOOM_LABELS } from './distributionEngine';

// ============================================
// DATA TYPES
// ============================================

export interface DatosCentro {
  nombreCentro: string;
  codigoCentro: string;
  localidad: string;
  provincia: string;
  comunidadAutonoma: string;
  cursoAcademico: string;
}

export interface DatosCertificado {
  codigo: string;
  nombre: string;
  nivel: 1 | 2 | 3;
  familia: string;
  area: string;
}

export interface DatosModulo {
  codigo: string;
  titulo: string;
  horas: number;
  objetivoGeneral?: string;
}

export interface EspacioFormativo {
  nombre: string;
  superficie: string;
  equipamiento: string[];
}

// ============================================
// HTML RENDERERS
// ============================================

/**
 * Renderiza la cabecera del Anexo IV.
 */
export function renderCabeceraAnexo(
  centro: DatosCentro,
  certificado: DatosCertificado,
  modulo: DatosModulo
): string {
  return `
<div class="anexo-cabecera">
  <h1>ANEXO IV – PROGRAMACIÓN DIDÁCTICA</h1>
  <table class="datos-generales">
    <tr><th>Centro formativo</th><td>${centro.nombreCentro} (${centro.codigoCentro})</td></tr>
    <tr><th>Localidad</th><td>${centro.localidad}, ${centro.provincia}</td></tr>
    <tr><th>Comunidad Autónoma</th><td>${centro.comunidadAutonoma}</td></tr>
    <tr><th>Curso académico</th><td>${centro.cursoAcademico}</td></tr>
    <tr><th>Certificado de profesionalidad</th><td>${certificado.nombre} (${certificado.codigo})</td></tr>
    <tr><th>Nivel</th><td>${certificado.nivel}</td></tr>
    <tr><th>Familia profesional</th><td>${certificado.familia}</td></tr>
    <tr><th>Área profesional</th><td>${certificado.area}</td></tr>
    <tr><th>Módulo formativo</th><td>${modulo.titulo} (${modulo.codigo})</td></tr>
    <tr><th>Horas</th><td>${modulo.horas}h</td></tr>
  </table>
</div>`;
}

/**
 * Renderiza la sección de objetivo general.
 */
export function renderObjetivoGeneral(objetivo?: string): string {
  if (!objetivo) return '';
  return `
<div class="anexo-seccion">
  <h2>1. OBJETIVO GENERAL DEL MÓDULO</h2>
  <p>${objetivo}</p>
</div>`;
}

/**
 * Renderiza la tabla de SdAs para una UA.
 */
export function renderTablaSdA(ua: UACompleta): string {
  const rows = ua.sdas.map((sda, i) => {
    // Use SdA fields from the full type
    const ceText = 'ceAsociados' in sda
      ? (sda as any).ceAsociados?.join(', ') || ''
      : sda.criterios?.map((c: any) => c.id).join(', ') || '';

    const titulo = 'titulo' in sda ? (sda as any).titulo : `SdA ${sda.numero}`;
    const objetivo = 'objetivo' in sda ? (sda as any).objetivo : '';
    const estrategia = 'estrategia' in sda ? (sda as any).estrategia : '';
    const desarrollo = 'desarrollo' in sda ? (sda as any).desarrollo : '';
    const medios = 'medios' in sda ? (sda as any).medios?.join(', ') : '';
    const espacios = 'espacios' in sda ? (sda as any).espacios : '';
    const duracion = sda.duracionHoras;

    return `
    <tr>
      <td>${sda.numero}</td>
      <td><span class="fase-badge fase-${sda.fase.toLowerCase()}">${sda.fase}</span></td>
      <td>${titulo}</td>
      <td>${objetivo}</td>
      <td>${estrategia}</td>
      <td>${desarrollo}</td>
      <td>${medios}</td>
      <td>${espacios}</td>
      <td>${duracion}h</td>
      <td>${ceText}</td>
    </tr>`;
  }).join('');

  return `
<div class="anexo-ua">
  <h3>UA ${ua.numero} – ${ua.bloomLabel} (Bloom ${ua.bloomLevel})</h3>
  <p><strong>Horas:</strong> ${ua.horasTotales}h | <strong>Método:</strong> ${ua.metodoPrincipal} | <strong>Técnica:</strong> ${ua.tecnicaBase}</p>
  <table class="tabla-sda">
    <thead>
      <tr>
        <th>Nº</th>
        <th>Fase</th>
        <th>Título</th>
        <th>Objetivo</th>
        <th>Estrategia metodológica</th>
        <th>Desarrollo</th>
        <th>Medios</th>
        <th>Espacios</th>
        <th>Duración</th>
        <th>CE asociados</th>
      </tr>
    </thead>
    <tbody>${rows}
    </tbody>
  </table>
</div>`;
}

/**
 * Renderiza la sección de espacios formativos.
 */
export function renderEspacios(espacios: EspacioFormativo[]): string {
  if (espacios.length === 0) return '';

  const rows = espacios.map(e => `
    <tr>
      <td>${e.nombre}</td>
      <td>${e.superficie}</td>
      <td><ul>${e.equipamiento.map(eq => `<li>${eq}</li>`).join('')}</ul></td>
    </tr>`).join('');

  return `
<div class="anexo-seccion">
  <h2>ESPACIOS FORMATIVOS</h2>
  <table class="tabla-espacios">
    <thead>
      <tr><th>Espacio formativo</th><th>Superficie m²</th><th>Equipamiento</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

/**
 * Renderiza la sección de metodología y evaluación por UA.
 */
export function renderMetodologiaEvaluacion(uas: UACompleta[]): string {
  return uas.map(ua => `
<div class="anexo-seccion">
  <h3>Metodología – UA ${ua.numero}</h3>
  <div class="texto-metodologia">${ua.textoMetodologia.replace(/\n/g, '<br/>')}</div>

  <h3>Evaluación – UA ${ua.numero}</h3>
  <div class="texto-evaluacion">${ua.textoEvaluacion.replace(/\n/g, '<br/>')}</div>
</div>`).join('');
}

// ============================================
// FULL ANEXO IV
// ============================================

export interface AnexoIVOptions {
  centro: DatosCentro;
  certificado: DatosCertificado;
  modulo: DatosModulo;
  espacios?: EspacioFormativo[];
  includeStyles?: boolean;
}

/**
 * Genera el HTML completo del Anexo IV.
 */
export function renderAnexoIVCompleto(
  result: CurriculumResult,
  options: AnexoIVOptions
): string {
  const { centro, certificado, modulo, espacios = [], includeStyles = true } = options;

  const cabecera = renderCabeceraAnexo(centro, certificado, modulo);
  const objetivo = renderObjetivoGeneral(modulo.objetivoGeneral);
  const tablasUA = result.uas.map(ua => renderTablaSdA(ua)).join('');
  const seccionEspacios = renderEspacios(espacios);
  const metodologia = renderMetodologiaEvaluacion(result.uas);

  const styles = includeStyles ? getAnexoStyles() : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anexo IV – ${modulo.titulo}</title>
  ${styles}
</head>
<body>
  ${cabecera}
  ${objetivo}

  <div class="anexo-seccion">
    <h2>2. PROGRAMACIÓN DE UNIDADES DE APRENDIZAJE</h2>
    <p><strong>Total UAs:</strong> ${result.resumen.totalUAs} | 
       <strong>Total SdAs:</strong> ${result.resumen.totalSdAs} | 
       <strong>Cobertura criterios:</strong> ${result.resumen.coberturaCriterios}%</p>
    ${tablasUA}
  </div>

  ${seccionEspacios}

  <div class="anexo-seccion">
    <h2>3. METODOLOGÍA Y EVALUACIÓN</h2>
    ${metodologia}
  </div>

  <div class="anexo-footer">
    <p>Generado automáticamente por eFPear CertiCalc — ${result.generadoEn}</p>
  </div>
</body>
</html>`;
}

// ============================================
// STYLES
// ============================================

function getAnexoStyles(): string {
  return `<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 210mm; margin: 0 auto; padding: 20mm; color: #1e293b; }
  h1 { text-align: center; font-size: 1.5em; border-bottom: 2px solid #16a34a; padding-bottom: 8px; }
  h2 { color: #16a34a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px; }
  h3 { color: #334155; margin-top: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 0.85em; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f1f5f9; font-weight: 600; }
  .datos-generales th { width: 35%; background: #f0fdf4; }
  .fase-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; }
  .fase-inicio { background: #dbeafe; color: #1e40af; }
  .fase-desarrollo { background: #dcfce7; color: #166534; }
  .fase-cierre { background: #fef3c7; color: #92400e; }
  .tabla-sda { font-size: 0.8em; }
  .tabla-sda td:nth-child(5), .tabla-sda td:nth-child(6) { max-width: 200px; }
  .texto-metodologia, .texto-evaluacion { background: #f8fafc; padding: 12px; border-radius: 6px; border-left: 3px solid #16a34a; margin: 8px 0; }
  .anexo-footer { text-align: center; color: #94a3b8; font-size: 0.8em; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  @media print { body { padding: 10mm; } .anexo-footer { position: fixed; bottom: 10mm; } }
</style>`;
}

// ============================================
// PREVIEW (simplified for in-app display)
// ============================================

/**
 * Generates a simplified HTML preview suitable for embedding in the app
 * (no full HTML document, just the content div).
 */
export function renderAnexoIVPreview(
  result: CurriculumResult,
  options: Omit<AnexoIVOptions, 'includeStyles'>
): string {
  const { centro, certificado, modulo, espacios = [] } = options;

  const cabecera = renderCabeceraAnexo(centro, certificado, modulo);
  const objetivo = renderObjetivoGeneral(modulo.objetivoGeneral);
  const tablasUA = result.uas.map(ua => renderTablaSdA(ua)).join('');
  const metodologia = renderMetodologiaEvaluacion(result.uas);

  return `<div class="anexo-preview">
  ${cabecera}
  ${objetivo}
  <h2>Programación de Unidades de Aprendizaje</h2>
  ${tablasUA}
  <h2>Metodología y Evaluación</h2>
  ${metodologia}
</div>`;
}
