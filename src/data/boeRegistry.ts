/**
 * boeRegistry.ts - BOE Data Registry
 *
 * Central lookup for BOE annex data.
 * Currently holds Golden Case A (HOTA0308 / MF0265_3).
 * Extensible: add imports from new boeData*.ts files as golden cases grow.
 */

import type { BoeUFData, BoeModuloData, BoeCertificadoData } from '../types/boe';
import { UF0048_DATA, UF0049_DATA, MF0265_3_DATA, HOTA0308_DATA } from './boeDataHOTA0308';

// ============================================
// REGISTRY MAPS
// ============================================

/** UF code -> UF BOE data */
const UF_REGISTRY: Record<string, BoeUFData> = {
  'UF0048': UF0048_DATA,
  'UF0049': UF0049_DATA,
};

/** MF code -> MF BOE data */
const MF_REGISTRY: Record<string, BoeModuloData> = {
  'MF0265_3': MF0265_3_DATA,
};

/** Certificate code -> full certificate data */
const CERT_REGISTRY: Record<string, BoeCertificadoData> = {
  'HOTA0308': HOTA0308_DATA,
};

// ============================================
// PUBLIC API
// ============================================

/** Check if BOE data exists for a UF */
export function tieneDatosBoe(codigoUF: string): boolean {
  return codigoUF in UF_REGISTRY;
}

/** Get BOE data for a UF, or null if not available */
export function obtenerDatosUF(codigoUF: string): BoeUFData | null {
  return UF_REGISTRY[codigoUF] ?? null;
}

/** Get BOE data for a MF, or null */
export function obtenerDatosMF(codigoMF: string): BoeModuloData | null {
  return MF_REGISTRY[codigoMF] ?? null;
}

/** Get BOE data for a certificate, or null */
export function obtenerDatosCertificado(codigo: string): BoeCertificadoData | null {
  return CERT_REGISTRY[codigo] ?? null;
}

/** Get all available UF codes with BOE data */
export function codigosUFDisponibles(): string[] {
  return Object.keys(UF_REGISTRY);
}

/** Get all available MF codes with BOE data */
export function codigosMFDisponibles(): string[] {
  return Object.keys(MF_REGISTRY);
}
