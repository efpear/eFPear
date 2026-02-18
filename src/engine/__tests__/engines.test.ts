/**
 * eFPear CertiCalc - Engine Tests
 * Vitest test suite for distribution + curriculum engines
 * 
 * Run: npx vitest run src/engine/__tests__/engines.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  calcularDistribucionPedagogicaConBloom,
  sugerirBloomPorNivel,
  METODO_POR_BLOOM,
  DEFAULT_DISTRIBUTION_CONFIG,
} from '../distributionEngine';
import type { BloomLevel } from '../../types';
import type { ModuloFormativo, Certificado } from '../../types';
import {
  asignarCapacidadesAUA,
  procesarModuloFormativo,
  procesarCertificadoCompleto,
} from '../curriculumEngine';

// ============================================
// DISTRIBUTION ENGINE TESTS
// ============================================

describe('Distribution Engine v1.1', () => {

  // --- HOUR CONSERVATION ---
  describe('Conservación de horas', () => {
    it('conserva horas exactas para 60h', () => {
      const r = calcularDistribucionPedagogicaConBloom(60);
      expect(r.horasAsignadas).toBe(60);
    });

    it('conserva horas para módulo pequeño (15h)', () => {
      const r = calcularDistribucionPedagogicaConBloom(15);
      expect(r.horasAsignadas).toBe(15);
    });

    it('conserva horas para módulo grande (120h)', () => {
      const r = calcularDistribucionPedagogicaConBloom(120);
      expect(r.horasAsignadas).toBe(120);
    });

    it('conserva horas con Bloom override', () => {
      const bloom: BloomLevel[] = [1, 3, 5];
      const r = calcularDistribucionPedagogicaConBloom(60, bloom);
      expect(r.horasAsignadas).toBe(60);
      expect(r.totalUAs).toBe(3);
    });

    it('conserva horas con config custom', () => {
      const r = calcularDistribucionPedagogicaConBloom(50, undefined, { horasMinUA: 10, horasMaxUA: 25 });
      expect(r.horasAsignadas).toBe(50);
    });
  });

  // --- DETERMINISM ---
  describe('Determinismo', () => {
    it('misma entrada → misma salida (3 runs)', () => {
      const results = Array.from({ length: 3 }, () =>
        calcularDistribucionPedagogicaConBloom(80)
      );
      expect(results[0]!).toEqual(results[1]!);
      expect(results[1]!).toEqual(results[2]!);
    });
  });

  // --- BLOOM ASSIGNMENT ---
  describe('Asignación Bloom', () => {
    it('genera Bloom progresivo automático', () => {
      const r = calcularDistribucionPedagogicaConBloom(100);
      const blooms = r.uas.map(ua => ua!.bloomLevel);
      for (let i = 1; i < blooms.length; i++) {
        expect(blooms[i]!).toBeGreaterThanOrEqual(blooms[i - 1]!);
      }
    });

    it('respeta Bloom override exacto', () => {
      const bloom: BloomLevel[] = [2, 4, 6];
      const r = calcularDistribucionPedagogicaConBloom(60, bloom);
      expect(r.uas.map(u => u.bloomLevel)).toEqual([2, 4, 6]);
    });

    it('sugerirBloomPorNivel nivel 1 → rango 1-3', () => {
      const b = sugerirBloomPorNivel(1, 3);
      expect(b.every(l => l >= 1 && l <= 3)).toBe(true);
    });

    it('sugerirBloomPorNivel nivel 3 → rango 2-5', () => {
      const b = sugerirBloomPorNivel(3, 4);
      expect(b.every(l => l >= 2 && l <= 5)).toBe(true);
    });
  });

  // --- METHOD DERIVATION ---
  describe('Derivación de métodos', () => {
    it('cada UA tiene método derivado de su Bloom', () => {
      const r = calcularDistribucionPedagogicaConBloom(80);
      r.uas.forEach(ua => {
        expect(ua.metodoPrincipal).toBe(METODO_POR_BLOOM[ua.bloomLevel]);
      });
    });
  });

  // --- EDGE CASES ---
  describe('Casos límite', () => {
    it('módulo mínimo (8h) → 1 UA', () => {
      const r = calcularDistribucionPedagogicaConBloom(8);
      expect(r.totalUAs).toBe(1);
      expect(r.horasAsignadas).toBe(8);
    });

    it('horas = 0 → error', () => {
      expect(() => calcularDistribucionPedagogicaConBloom(0)).toThrow();
    });

    it('horas negativas → error', () => {
      expect(() => calcularDistribucionPedagogicaConBloom(-10)).toThrow();
    });

    it('SdAs están dentro de límites', () => {
      const r = calcularDistribucionPedagogicaConBloom(200);
      r.uas.forEach(ua => {
        expect(ua.sdasAjustadas).toBeGreaterThanOrEqual(DEFAULT_DISTRIBUTION_CONFIG.sdasMinUA);
        expect(ua.sdasAjustadas).toBeLessThanOrEqual(DEFAULT_DISTRIBUTION_CONFIG.sdasMaxUA);
      });
    });
  });
});

// ============================================
// CURRICULUM ENGINE TESTS
// ============================================

describe('Curriculum Engine', () => {
  const mockMF: ModuloFormativo = {
    codigo: 'MF0711_2',
    titulo: 'Seguridad e higiene en restauración',
    horas: 60,
    capacidades: [
      { id: 'C1', descripcion: 'Analizar normas', criterios: [
        { id: 'CE1.1', descripcion: 'Identifica normativa' },
        { id: 'CE1.2', descripcion: 'Clasifica riesgos' },
      ]},
      { id: 'C2', descripcion: 'Aplicar protocolos', criterios: [
        { id: 'CE2.1', descripcion: 'Ejecuta limpieza' },
        { id: 'CE2.2', descripcion: 'Gestiona residuos' },
      ]},
      { id: 'C3', descripcion: 'Evaluar cumplimiento', criterios: [
        { id: 'CE3.1', descripcion: 'Verifica registro' },
      ]},
    ],
    contenidos: [
      { id: 'CT1', descripcion: 'Marco normativo APPCC' },
      { id: 'CT2', descripcion: 'Peligros y puntos críticos' },
      { id: 'CT3', descripcion: 'Limpieza y desinfección' },
      { id: 'CT4', descripcion: 'Gestión de alérgenos' },
      { id: 'CT5', descripcion: 'Trazabilidad' },
      { id: 'CT6', descripcion: 'Documentación sanitaria' },
    ],
  };

  // --- CAPACIDADES MAPPING ---
  describe('Mapeo capacidades → UA (circular)', () => {
    it('distribuye capacidades circularmente', () => {
      const result = asignarCapacidadesAUA(mockMF.capacidades, 2);
      expect(result.length).toBe(2);
      expect(result[0]!.length).toBe(2); // C1, C3
      expect(result[1]!.length).toBe(1); // C2
    });

    it('0 capacidades → arrays vacíos', () => {
      const result = asignarCapacidadesAUA([], 3);
      expect(result.every(a => a.length === 0)).toBe(true);
    });

    it('numUA <= 0 → error', () => {
      expect(() => asignarCapacidadesAUA(mockMF.capacidades, 0)).toThrow();
    });
  });

  // --- FULL PIPELINE ---
  describe('Pipeline completo', () => {
    it('procesa modulo formativo completo', () => {
      const result = procesarModuloFormativo(mockMF, 2);
      expect(result.modulo.codigo).toBe('MF0711_2');
      expect(result.modulo.horas).toBe(60);
      expect(result.uas.length).toBeGreaterThan(0);
      expect(result.resumen.totalUAs).toBe(result.uas.length);
      result.uas.forEach(ua => {
        expect(ua.textoMetodologia.length).toBeGreaterThan(50);
        expect(ua.textoEvaluacion.length).toBeGreaterThan(50);
        expect(ua.sdas.length).toBeGreaterThan(0);
      });
    });

    it('conserva horas en pipeline', () => {
      const result = procesarModuloFormativo(mockMF, 2);
      const totalHoras = result.uas.reduce((acc, ua) => acc + ua.horasTotales, 0);
      expect(totalHoras).toBe(60);
    });

    it('procesa certificado completo', () => {
      const cert: Certificado = {
        codigo: 'HOTR0508',
        nombre: 'Dirección en restauración',
        nivel: 2,
        modulos: [mockMF],
      };
      const result = procesarCertificadoCompleto(cert);
      expect(result.certificado.codigo).toBe('HOTR0508');
      expect(result.modulos.length).toBe(1);
      expect(result.modulos[0].modulo.codigo).toBe('MF0711_2');
    });

    it('pipeline es determinístico', () => {
      const r1 = procesarModuloFormativo(mockMF, 2);
      const r2 = procesarModuloFormativo(mockMF, 2);
      // Compare everything except timestamps
      expect(r1.uas.length).toBe(r2.uas.length);
      expect(r1.resumen).toEqual(r2.resumen);
      r1.uas.forEach((ua, i) => {
        expect(ua.horasTotales).toBe(r2.uas[i]!.horasTotales);
        expect(ua.bloomLevel).toBe(r2.uas[i]!.bloomLevel);
        expect(ua.sdas.length).toBe(r2.uas[i]!.sdas.length);
      });
    });
  });
});
