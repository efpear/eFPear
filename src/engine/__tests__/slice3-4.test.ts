/**
 * eFPear CertiCalc — Slice 3–4 Engine Tests
 * Tests for sanitizer, CE classifier, contenido-CE mapper, and DOCX export data.
 *
 * Run: npx vitest run src/engine/__tests__/slice3-4.test.ts
 */

import { describe, it, expect } from 'vitest';
import { sanitizeLiteralText, sanitizeDeep } from '../sanitizeLiteralText';
import { clasificarCE, buildContenidoCEMap, TIPOLOGIA_COLORS } from '../ceUtils';
import type { BoeUFData } from '../../types/boe';

// ============================================
// SANITIZER TESTS
// ============================================

describe('sanitizeLiteralText', () => {

  describe('null/empty handling', () => {
    it('returns empty string for null', () => {
      expect(sanitizeLiteralText(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(sanitizeLiteralText(undefined)).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(sanitizeLiteralText('')).toBe('');
    });
  });

  describe('BOM removal', () => {
    it('strips BOM at start', () => {
      expect(sanitizeLiteralText('\uFEFFRecepcionar materias primas'))
        .toBe('Recepcionar materias primas');
    });
  });

  describe('invisible Unicode chars', () => {
    it('strips soft hyphens', () => {
      expect(sanitizeLiteralText('Almace\u00ADnar mate\u00ADrias pri\u00ADmas'))
        .toBe('Almacenar materias primas');
    });

    it('strips zero-width spaces', () => {
      expect(sanitizeLiteralText('Recepcionar\u200Bmercancías'))
        .toBe('Recepcionarmercancías');
    });
  });

  describe('smart quotes normalization', () => {
    it('normalizes smart double quotes', () => {
      expect(sanitizeLiteralText('La \u201Cgestión\u201D'))
        .toBe('La "gestión"');
    });

    it('normalizes smart single quotes', () => {
      expect(sanitizeLiteralText('\u2018calidad\u2019'))
        .toBe("'calidad'");
    });
  });

  describe('dash normalization', () => {
    it('converts en-dash to hyphen', () => {
      expect(sanitizeLiteralText('Nivel 1\u20133'))
        .toBe('Nivel 1-3');
    });

    it('preserves em-dash', () => {
      expect(sanitizeLiteralText('Recepción \u2014 área'))
        .toBe('Recepción \u2014 área');
    });
  });

  describe('whitespace normalization', () => {
    it('collapses multiple spaces', () => {
      expect(sanitizeLiteralText('Clasificar    géneros   según    criterios'))
        .toBe('Clasificar géneros según criterios');
    });

    it('normalizes non-breaking space', () => {
      expect(sanitizeLiteralText('120\u00A0horas'))
        .toBe('120 horas');
    });
  });

  describe('control characters', () => {
    it('replaces control chars with space (not empty)', () => {
      expect(sanitizeLiteralText('Gestión\x0Bde\x0Cdepartamentos'))
        .toBe('Gestión de departamentos');
    });
  });

  describe('ellipsis normalization', () => {
    it('normalizes Unicode ellipsis to three dots', () => {
      expect(sanitizeLiteralText('Técnicas\u2026'))
        .toBe('Técnicas...');
    });
  });

  describe('combined dirty input', () => {
    it('handles BOM + smart quotes + multi-space', () => {
      expect(sanitizeLiteralText('\uFEFF\u201CRecepción   en   alojamientos\u201D'))
        .toBe('"Recepción en alojamientos"');
    });
  });

  describe('clean text passthrough', () => {
    it('does not modify clean Spanish text', () => {
      const clean = 'Identificar los principales métodos de dirección y gestión';
      expect(sanitizeLiteralText(clean)).toBe(clean);
    });

    it('preserves diacritics áéíóúñ', () => {
      const text = 'Planificación económica en área de alojamiento';
      expect(sanitizeLiteralText(text)).toBe(text);
    });
  });
});

describe('sanitizeDeep', () => {
  it('recursively sanitizes all strings in an object', () => {
    const dirty = {
      titulo: '\uFEFFGestión',
      items: [{ texto: 'Plan\u00ADificación' }],
    };
    const result = sanitizeDeep(dirty);
    expect(result.titulo).toBe('Gestión');
    expect(result.items[0].texto).toBe('Planificación');
  });

  it('passes through numbers and booleans', () => {
    const obj = { count: 42, active: true, name: 'test' };
    expect(sanitizeDeep(obj)).toEqual({ count: 42, active: true, name: 'test' });
  });
});

// ============================================
// CE CLASSIFIER TESTS
// ============================================

describe('clasificarCE', () => {

  describe('conocimiento verbs', () => {
    const cases = [
      'Describir los tipos de alojamiento',
      'Identificar las principales fuentes',
      'Diferenciar los departamentos',
      'Clasificar los establecimientos',
      'Definir los conceptos básicos',
      'Enumerar las características',
      'Reconocer las normas de calidad',
      'Explicar la estructura organizativa',
    ];
    cases.forEach(text => {
      it(`"${text.substring(0, 40)}..." → conocimiento`, () => {
        expect(clasificarCE(text)).toBe('conocimiento');
      });
    });
  });

  describe('destreza verbs', () => {
    const cases = [
      'Calcular los costes de producción',
      'Elaborar presupuestos departamentales',
      'Comparar distintos métodos de evaluación',
      'Determinar las necesidades de personal',
      'Aplicar técnicas de comunicación',
      'Seleccionar los recursos necesarios',
    ];
    cases.forEach(text => {
      it(`"${text.substring(0, 40)}..." → destreza`, () => {
        expect(clasificarCE(text)).toBe('destreza');
      });
    });
  });

  describe('destreza by pattern (supuestos prácticos)', () => {
    it('"En supuestos prácticos..." → destreza', () => {
      expect(clasificarCE('En supuestos prácticos debidamente definidos'))
        .toBe('destreza');
    });

    it('"En un supuesto práctico..." → destreza', () => {
      expect(clasificarCE('En un supuesto práctico de gestión'))
        .toBe('destreza');
    });

    it('"En casos prácticos..." → destreza', () => {
      expect(clasificarCE('En casos prácticos de organización'))
        .toBe('destreza');
    });

    it('"A partir de..." → destreza', () => {
      expect(clasificarCE('A partir de la información proporcionada'))
        .toBe('destreza');
    });
  });

  describe('habilidad verbs', () => {
    const cases = [
      'Justificar la importancia de la formación',
      'Argumentar las ventajas del trabajo en equipo',
      'Valorar la importancia de la calidad',
      'Participar activamente en las actividades',
      'Colaborar con los diferentes departamentos',
      'Demostrar habilidades de liderazgo',
      'Respetar las normas de convivencia',
    ];
    cases.forEach(text => {
      it(`"${text.substring(0, 40)}..." → habilidad`, () => {
        expect(clasificarCE(text)).toBe('habilidad');
      });
    });
  });

  describe('determinism', () => {
    it('same input → same output (10 runs)', () => {
      const text = 'Describir los tipos de alojamiento turístico';
      const results = Array.from({ length: 10 }, () => clasificarCE(text));
      expect(new Set(results).size).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('empty string → conocimiento (fallback)', () => {
      expect(clasificarCE('')).toBe('conocimiento');
    });

    it('handles CE prefix (CE1.1 Describir...)', () => {
      expect(clasificarCE('CE1.1 Describir los tipos')).toBe('conocimiento');
    });
  });
});

describe('TIPOLOGIA_COLORS', () => {
  it('has colors for all three types', () => {
    expect(TIPOLOGIA_COLORS.conocimiento).toBeDefined();
    expect(TIPOLOGIA_COLORS.destreza).toBeDefined();
    expect(TIPOLOGIA_COLORS.habilidad).toBeDefined();
  });
});

// ============================================
// CONTENIDO-CE MAP TESTS
// ============================================

describe('buildContenidoCEMap', () => {
  const mockUF: BoeUFData = {
    codigo: 'UF_TEST',
    denominacion: 'Test UF',
    duracion: 60,
    capacidades: [
      {
        codigo: 'C1',
        texto: 'Capacidad 1',
        criterios: [
          { codigo: 'CE1.1', texto: 'Describir algo' },
          { codigo: 'CE1.2', texto: 'Calcular costes' },
        ],
      },
      {
        codigo: 'C2',
        texto: 'Capacidad 2',
        criterios: [
          { codigo: 'CE2.1', texto: 'Justificar importancia' },
        ],
      },
    ],
    contenidos: [
      {
        numero: '1',
        titulo: 'Tema 1',
        items: [
          { texto: 'Concepto de alojamiento' },
          { texto: 'Tipos de establecimientos' },
        ],
      },
      {
        numero: '2',
        titulo: 'Tema 2',
        items: [
          { texto: 'Estructura organizativa' },
        ],
      },
    ],
  };

  it('maps tema[0] items to C1 CE codes', () => {
    const map = buildContenidoCEMap(mockUF);
    expect(map.get('Concepto de alojamiento')).toEqual(['CE1.1', 'CE1.2']);
    expect(map.get('Tipos de establecimientos')).toEqual(['CE1.1', 'CE1.2']);
  });

  it('maps tema[1] items to C2 CE codes', () => {
    const map = buildContenidoCEMap(mockUF);
    expect(map.get('Estructura organizativa')).toEqual(['CE2.1']);
  });

  it('returns empty array for unmapped texts', () => {
    const map = buildContenidoCEMap(mockUF);
    expect(map.get('nonexistent item')).toBeUndefined();
  });

  it('handles more temas than capacidades', () => {
    const uf3temas: BoeUFData = {
      ...mockUF,
      contenidos: [
        ...mockUF.contenidos,
        { numero: '3', titulo: 'Tema 3 (orphan)', items: [{ texto: 'Orphan item' }] },
      ],
    };
    const map = buildContenidoCEMap(uf3temas);
    expect(map.get('Orphan item')).toEqual([]);
  });
});
