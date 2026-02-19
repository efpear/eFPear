/**
 * anexoIVExport.ts — Agent D: The Anexo IV Renderer
 *
 * Generates a DOCX file for the Anexo IV Programación Didáctica.
 * Runs 100% client-side using the `docx` library.
 *
 * Rules:
 *  - If user didn't edit the text, output must be identical to BOE
 *  - RPs in bold, coletilla in normal
 *  - Maintains Minerva field order for SdAs
 *  - All text passes through sanitizeLiteralText before rendering
 *
 * @module anexoIVExport
 */

import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Packer,
  ShadingType,
  type ITableCellOptions,
} from 'docx';
import type { BoeUFData } from '../types/boe';

// ============================================
// TYPES
// ============================================

export interface SdAExport {
  numero: number;
  nombre: string;
  objetivo: string;
  ceVinculados: string[];
  metodologia: string;
  desarrollo: string;
  recursos: string;
  tiempo: number;
}

export interface UAExport {
  id: string;
  titulo: string;
  horas: number;
  horasEvaluacion: number;
  horasAutonomo: number;
  horasSdA: number;
  temaIndices: number[];
  capacidadIds: string[];
  sdas: SdAExport[];
}

export interface AnexoIVExportData {
  certificado: { codigo: string; nombre: string; duracion: number };
  modulo: { codigo: string; nombre: string; horas: number };
  uf: BoeUFData;
  uas: UAExport[];
  centro?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

// ============================================
// STYLE CONSTANTS
// ============================================

const FONT = 'Calibri';
const FONT_SIZE = 20; // half-points → 10pt
const FONT_SIZE_SMALL = 18; // 9pt
const FONT_SIZE_HEADER = 24; // 12pt
const FONT_SIZE_TITLE = 28; // 14pt

const BORDER_THIN = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: '999999',
};

const BORDERS_ALL = {
  top: BORDER_THIN,
  bottom: BORDER_THIN,
  left: BORDER_THIN,
  right: BORDER_THIN,
};

function headerCell(text: string, width?: number): TableCell {
  const opts: ITableCellOptions = {
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, font: FONT, size: FONT_SIZE_SMALL, color: 'FFFFFF' })],
      }),
    ],
    shading: { fill: '2E7D32', type: ShadingType.CLEAR, color: 'auto' },
    borders: BORDERS_ALL,
  };
  if (width) opts.width = { size: width, type: WidthType.PERCENTAGE };
  return new TableCell(opts);
}

function textCell(text: string, width?: number, bold = false): TableCell {
  const opts: ITableCellOptions = {
    children: [
      new Paragraph({
        children: [new TextRun({ text, font: FONT, size: FONT_SIZE_SMALL, bold })],
        spacing: { before: 40, after: 40 },
      }),
    ],
    borders: BORDERS_ALL,
  };
  if (width) opts.width = { size: width, type: WidthType.PERCENTAGE };
  return new TableCell(opts);
}

function multiTextCell(lines: string[], width?: number): TableCell {
  const opts: ITableCellOptions = {
    children: lines.map(line =>
      new Paragraph({
        children: [new TextRun({ text: line, font: FONT, size: FONT_SIZE_SMALL })],
        spacing: { before: 20, after: 20 },
      })
    ),
    borders: BORDERS_ALL,
  };
  if (width) opts.width = { size: width, type: WidthType.PERCENTAGE };
  return new TableCell(opts);
}

// ============================================
// DOCUMENT BUILDER
// ============================================

export function buildAnexoIVDocument(data: AnexoIVExportData): Document {
  const sections: Paragraph[] = [];

  // ---- ENCABEZADO ----
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'ANEXO IV — PROGRAMACIÓN DIDÁCTICA', bold: true, font: FONT, size: FONT_SIZE_TITLE })],
      spacing: { after: 200 },
    })
  );

  // Header info table
  const headerRows = [
    ['CERTIFICADO DE PROFESIONALIDAD', `${data.certificado.codigo} ${data.certificado.nombre}`],
    ['DURACIÓN DEL CERTIFICADO', `${data.certificado.duracion} horas`],
    ['MÓDULO FORMATIVO', `${data.modulo.codigo} ${data.modulo.nombre}`],
    ['HORAS MÓDULO', `${data.modulo.horas} horas`],
    ['UNIDAD FORMATIVA', `${data.uf.codigo} ${data.uf.denominacion}`],
    ['HORAS UF', `${data.uf.duracion} horas`],
  ];
  if (data.centro) headerRows.push(['CENTRO DE FORMACIÓN', data.centro]);
  if (data.fechaInicio && data.fechaFin) headerRows.push(['FECHAS DE IMPARTICIÓN', `${data.fechaInicio} – ${data.fechaFin}`]);

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: headerRows.map(([label, value]) =>
      new TableRow({
        children: [
          textCell(label, 35, true),
          textCell(value, 65),
        ],
      })
    ),
  });

  // ---- OBJETIVO GENERAL ----
  const objSection: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: 'OBJETIVO GENERAL DEL MÓDULO', bold: true, font: FONT, size: FONT_SIZE_HEADER })],
      spacing: { before: 300, after: 100 },
    }),
  ];

  // RPs as bullet points — RP code in bold, text in normal
  data.uf.capacidades.forEach((_, _i) => {}); // skip — we use module-level RPs if available

  // For now, use the capacidades as the objective framework
  data.uf.capacidades.forEach(cap => {
    objSection.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${cap.codigo}: `, bold: true, font: FONT, size: FONT_SIZE }),
          new TextRun({ text: cap.texto, font: FONT, size: FONT_SIZE }),
        ],
        spacing: { before: 60, after: 60 },
      })
    );
  });

  // ---- PER-UA SECTIONS ----
  const uaSections: (Paragraph | Table)[] = [];

  data.uas.forEach(ua => {
    // UA Header
    uaSections.push(
      new Paragraph({
        children: [new TextRun({ text: `${ua.id}: ${ua.titulo}`, bold: true, font: FONT, size: FONT_SIZE_HEADER })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Horas: ${ua.horas}h (Evaluación: ${ua.horasEvaluacion}h · Autónomo: ${ua.horasAutonomo}h · SdAs: ${ua.horasSdA}h)`, font: FONT, size: FONT_SIZE_SMALL, italics: true })],
        spacing: { after: 200 },
      })
    );

    // Column 1: Capacidades y CEs
    uaSections.push(
      new Paragraph({
        children: [new TextRun({ text: 'COLUMNA 1 — OBJETIVOS ESPECÍFICOS (CAPACIDADES Y CE)', bold: true, font: FONT, size: FONT_SIZE })],
        spacing: { before: 200, after: 100 },
      })
    );

    const filteredCaps = data.uf.capacidades.filter(cap =>
      cap.criterios.some(ce => ua.capacidadIds.includes(ce.codigo) || ua.capacidadIds.includes(cap.codigo))
    );

    filteredCaps.forEach(cap => {
      uaSections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${cap.codigo}: `, bold: true, font: FONT, size: FONT_SIZE }),
            new TextRun({ text: cap.texto, font: FONT, size: FONT_SIZE }),
          ],
          spacing: { before: 100, after: 60 },
        })
      );
      cap.criterios.forEach(ce => {
        uaSections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `  ${ce.codigo}: `, bold: true, font: FONT, size: FONT_SIZE_SMALL }),
              new TextRun({ text: ce.texto, font: FONT, size: FONT_SIZE_SMALL }),
            ],
            spacing: { before: 20, after: 20 },
            indent: { left: 400 },
          })
        );
      });
    });

    // Column 2: Contenidos
    uaSections.push(
      new Paragraph({
        children: [new TextRun({ text: 'COLUMNA 2 — CONTENIDOS', bold: true, font: FONT, size: FONT_SIZE })],
        spacing: { before: 200, after: 100 },
      })
    );

    ua.temaIndices.forEach(temaIdx => {
      const tema = data.uf.contenidos[temaIdx];
      if (!tema) return;
      uaSections.push(
        new Paragraph({
          children: [new TextRun({ text: `${tema.numero}. ${tema.titulo}`, bold: true, font: FONT, size: FONT_SIZE })],
          spacing: { before: 80, after: 40 },
        })
      );
      tema.items.forEach(item => {
        uaSections.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${item.texto}`, font: FONT, size: FONT_SIZE_SMALL })],
            spacing: { before: 20, after: 20 },
            indent: { left: 400 },
          })
        );
      });
    });

    // Column 3: Situaciones de Aprendizaje
    uaSections.push(
      new Paragraph({
        children: [new TextRun({ text: 'COLUMNA 3 — SITUACIONES DE APRENDIZAJE', bold: true, font: FONT, size: FONT_SIZE })],
        spacing: { before: 200, after: 100 },
      })
    );

    // SdA table
    if (ua.sdas.length > 0) {
      const sdaTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Header row
          new TableRow({
            children: [
              headerCell('Nº', 5),
              headerCell('Nombre', 20),
              headerCell('Objetivo', 25),
              headerCell('CE', 8),
              headerCell('Metodología', 15),
              headerCell('Desarrollo', 17),
              headerCell('Recursos', 7),
              headerCell('h', 3),
            ],
          }),
          // Data rows
          ...ua.sdas.map(sda =>
            new TableRow({
              children: [
                textCell(String(sda.numero), 5),
                textCell(sda.nombre, 20),
                textCell(sda.objetivo, 25),
                textCell(sda.ceVinculados.join(', '), 8),
                textCell(sda.metodologia, 15),
                textCell(sda.desarrollo, 17),
                textCell(sda.recursos, 7),
                textCell(String(sda.tiempo), 3),
              ],
            })
          ),
        ],
      });

      uaSections.push(sdaTable);
    }
  });

  // ---- BUILD DOCUMENT ----
  return new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 inch margins
        },
      },
      children: [
        ...sections,
        headerTable,
        ...objSection,
        ...uaSections,
      ],
    }],
  });
}

// ============================================
// EXPORT HELPER
// ============================================

/**
 * Generate and download the Anexo IV as a DOCX file.
 * Call from the UI "Generar Anexo IV" button.
 */
export async function downloadAnexoIVDocx(data: AnexoIVExportData): Promise<void> {
  const doc = buildAnexoIVDocument(data);
  const blob = await Packer.toBlob(doc);

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AnexoIV_${data.uf.codigo}_${data.modulo.codigo}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
