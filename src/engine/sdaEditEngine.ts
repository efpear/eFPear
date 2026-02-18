/**
 * ============================================
 * eFPear CertiCalc - SdA Edit Engine
 * ============================================
 * CRUD operations for SdAs within a UA.
 * Immutable-style: each operation returns a new SdA[].
 * 
 * Operations:
 *   - addSdA: Insert new SdA at position
 *   - duplicateSdA: Clone existing SdA
 *   - deleteSdA: Remove SdA by id
 *   - updateSdA: Patch SdA fields
 *   - addCEToSdA: Attach a CE to a SdA
 *   - removeCEFromSdA: Detach a CE from a SdA
 *   - reorderSdAs: Move SdA to new position
 *   - recalcularFases: Reassign Inicio/Desarrollo/Cierre phases
 *   - recalcularIds: Reassign sequential ids
 * 
 * 100% determinístico. Pure functions only.
 * @module sdaEditEngine
 */

import type { SdA, FaseSdA } from '../types';

// ============================================
// ADD
// ============================================

/**
 * Creates a new blank SdA and inserts it at the given position.
 * If no position, appends at end.
 */
export function addSdA(
  sdas: SdA[],
  defaults?: Partial<SdA>,
  position?: number
): SdA[] {
  const newId = sdas.length > 0 ? Math.max(...sdas.map(s => s.id)) + 1 : 1;
  const newSdA: SdA = {
    id: newId,
    numero: newId,
    fase: 'Desarrollo',
    titulo: 'Nueva actividad',
    objetivo: '',
    estrategia: '',
    desarrollo: '',
    medios: [],
    espacios: '',
    duracionHoras: 2,
    ceAsociados: [],
    ...defaults,
  };

  const result = [...sdas];
  if (position !== undefined && position >= 0 && position <= result.length) {
    result.splice(position, 0, newSdA);
  } else {
    result.push(newSdA);
  }

  return recalcularFases(recalcularIds(result));
}

// ============================================
// DUPLICATE
// ============================================

/**
 * Duplicates an existing SdA (by id) and places the copy right after it.
 */
export function duplicateSdA(sdas: SdA[], sdaId: number): SdA[] {
  const idx = sdas.findIndex(s => s.id === sdaId);
  if (idx === -1) return sdas;

  const original = sdas[idx];
  const newId = Math.max(...sdas.map(s => s.id)) + 1;
  const copy: SdA = {
    ...original,
    id: newId,
    numero: newId,
    titulo: `${original.titulo} (copia)`,
    ceAsociados: [...original.ceAsociados],
    medios: [...original.medios],
  };

  const result = [...sdas];
  result.splice(idx + 1, 0, copy);
  return recalcularFases(recalcularIds(result));
}

// ============================================
// DELETE
// ============================================

/**
 * Removes a SdA by id. Reassigns phases and ids.
 * Returns unchanged array if id not found.
 */
export function deleteSdA(sdas: SdA[], sdaId: number): SdA[] {
  const filtered = sdas.filter(s => s.id !== sdaId);
  if (filtered.length === sdas.length) return sdas; // not found
  return recalcularFases(recalcularIds(filtered));
}

// ============================================
// UPDATE
// ============================================

/**
 * Patches fields on a specific SdA. Immutable.
 */
export function updateSdA(
  sdas: SdA[],
  sdaId: number,
  patch: Partial<Omit<SdA, 'id' | 'numero'>>
): SdA[] {
  return sdas.map(s =>
    s.id === sdaId ? { ...s, ...patch } : s
  );
}

// ============================================
// CE MANAGEMENT
// ============================================

/**
 * Adds a CE id to a SdA (if not already present).
 */
export function addCEToSdA(sdas: SdA[], sdaId: number, ceId: string): SdA[] {
  return sdas.map(s => {
    if (s.id !== sdaId) return s;
    if (s.ceAsociados.includes(ceId)) return s;
    return { ...s, ceAsociados: [...s.ceAsociados, ceId] };
  });
}

/**
 * Removes a CE id from a SdA.
 */
export function removeCEFromSdA(sdas: SdA[], sdaId: number, ceId: string): SdA[] {
  return sdas.map(s => {
    if (s.id !== sdaId) return s;
    return { ...s, ceAsociados: s.ceAsociados.filter(id => id !== ceId) };
  });
}

// ============================================
// REORDER
// ============================================

/**
 * Moves a SdA from its current position to a new index.
 */
export function reorderSdAs(sdas: SdA[], sdaId: number, newIndex: number): SdA[] {
  const currentIdx = sdas.findIndex(s => s.id === sdaId);
  if (currentIdx === -1) return sdas;
  if (newIndex < 0 || newIndex >= sdas.length) return sdas;
  if (currentIdx === newIndex) return sdas;

  const result = [...sdas];
  const [item] = result.splice(currentIdx, 1);
  result.splice(newIndex, 0, item);
  return recalcularFases(recalcularIds(result));
}

// ============================================
// PHASE & ID RECALCULATION
// ============================================

/**
 * Reassigns sequential ids and numeros (1-indexed).
 */
export function recalcularIds(sdas: SdA[]): SdA[] {
  return sdas.map((s, i) => ({
    ...s,
    id: i + 1,
    numero: i + 1,
  }));
}

/**
 * Reassigns Inicio/Desarrollo/Cierre phases based on position.
 * - 1 SdA → Desarrollo
 * - 2 SdAs → Inicio, Cierre
 * - 3+ SdAs → Inicio, Desarrollo..., Cierre
 */
export function recalcularFases(sdas: SdA[]): SdA[] {
  if (sdas.length === 0) return sdas;
  if (sdas.length === 1) {
    return [{ ...sdas[0], fase: 'Desarrollo' }];
  }
  if (sdas.length === 2) {
    return [
      { ...sdas[0], fase: 'Inicio' },
      { ...sdas[1], fase: 'Cierre' },
    ];
  }
  return sdas.map((s, i) => ({
    ...s,
    fase: i === 0 ? 'Inicio' : i === sdas.length - 1 ? 'Cierre' : 'Desarrollo',
  }));
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validates SdA array integrity.
 */
export function validarSdAs(sdas: SdA[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (sdas.length === 0) {
    errors.push('Debe haber al menos 1 SdA');
    return { valid: false, errors };
  }

  // Check sequential ids
  sdas.forEach((s, i) => {
    if (s.numero !== i + 1) errors.push(`SdA ${s.id}: número incorrecto (expected ${i + 1})`);
  });

  // Check phases
  if (sdas.length >= 3) {
    if (sdas[0].fase !== 'Inicio') errors.push('Primera SdA debe ser fase Inicio');
    if (sdas[sdas.length - 1].fase !== 'Cierre') errors.push('Última SdA debe ser fase Cierre');
  }

  // Check durations
  sdas.forEach(s => {
    if (s.duracionHoras <= 0) errors.push(`SdA ${s.id}: duración debe ser positiva`);
  });

  return { valid: errors.length === 0, errors };
}
