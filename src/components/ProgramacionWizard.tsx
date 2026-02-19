/**
 * ProgramacionWizard.tsx — Agent C: The UI Wizard Dev
 *
 * 3-step Minerva flow for Anexo IV Programación Didáctica:
 *   Step 1: Contenidos (Col 2) — select BOE content blocks per UA
 *   Step 2: Criterios (Col 1) — auto-derived from selected contenidos (read-only)
 *   Step 3: SdAs (Col 3) — build learning situations from Col1 × Col2
 *
 * Style: Notion-inspired (high density, clean, thin borders, professional typography)
 *
 * Data flow: uses existing boeDataHOTA0308.ts as source (BoeUFData format)
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { BoeUFData } from '../types/boe';
import { clasificarCE, TIPOLOGIA_COLORS, buildContenidoCEMap } from '../engine/ceUtils';
import { downloadAnexoIVDocx } from '../engine/anexoIVExport';
import type { AnexoIVExportData, UAExport } from '../engine/anexoIVExport';

// ============================================
// TYPES
// ============================================

type WizardStep = 1 | 2 | 3;

/** Which CEs are linked to each contenido item */
interface ContenidoCELink {
  contenidoTema: number;
  contenidoIndex: number;
  ceIds: string[]; // e.g. ["CE1.1", "CE1.2"]
}

/** UA definition from Step 1 */
interface UADefinition {
  id: string;
  titulo: string;
  horas: number;
  temaIndices: number[]; // indices into uf.contenidos
}

/** SdA draft from Step 3 */
interface SdADraft {
  numero: number;
  nombre: string;
  objetivo: string;
  ceVinculados: string[];
  metodologia: string;
  desarrollo: string;
  recursos: string;
  tiempo: number;
}

interface ProgramacionWizardProps {
  uf: BoeUFData;
  moduloCodigo: string;
  moduloNombre: string;
  moduloHoras: number;
  certificadoCodigo: string;
  certificadoNombre: string;
  certificadoDuracion: number;
}

// ============================================
// CE CLASSIFICATION (deterministic, verb-based)
// ============================================

// ============================================
// CONTENT-TO-CE MAPPING (from golden sample)
// ============================================

/**
 * Build a map from contenido text → CE IDs.
 * For now, uses a heuristic: match CE codes mentioned in contenido items,
 * or fall back to matching by capacidad theme number.
 */


// ============================================
// STEP INDICATOR
// ============================================

function StepIndicator({ current, total }: { current: WizardStep; total: number }) {
  const steps = [
    { n: 1, label: 'Contenidos', desc: 'Seleccionar bloques BOE' },
    { n: 2, label: 'Criterios', desc: 'Capacidades y CEs derivados' },
    { n: 3, label: 'Situaciones', desc: 'Construir SdAs' },
  ];

  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.slice(0, total).map((s, i) => (
        <div key={s.n} className="flex items-center">
          {i > 0 && (
            <div className={`w-12 h-px mx-2 ${s.n <= current ? 'bg-green-400' : 'bg-slate-200'}`} />
          )}
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              s.n < current ? 'bg-green-600 text-white' :
              s.n === current ? 'bg-green-600 text-white ring-2 ring-green-200' :
              'bg-slate-100 text-slate-400'
            }`}>
              {s.n < current ? '✓' : s.n}
            </div>
            <div>
              <div className={`text-xs font-semibold ${s.n <= current ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.label}
              </div>
              <div className="text-[10px] text-slate-400">{s.desc}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// STEP 1: CONTENIDOS SELECTOR
// ============================================

function Step1Contenidos({
  uf,
  uaDefs,
  onAssign,
  onCreateUA,
  onRemoveUA,
  onSetHoras,
}: {
  uf: BoeUFData;
  uaDefs: UADefinition[];
  onAssign: (temaIdx: number, uaId: string | null) => void;
  onCreateUA: () => void;
  onRemoveUA: (uaId: string) => void;
  onSetHoras: (uaId: string, horas: number) => void;
}) {
  // Track which temas are assigned to which UA
  const temaAssignment = useMemo(() => {
    const map = new Map<number, string>();
    uaDefs.forEach(ua => {
      ua.temaIndices.forEach(idx => map.set(idx, ua.id));
    });
    return map;
  }, [uaDefs]);

  const unassignedCount = uf.contenidos.length - temaAssignment.size;
  const totalHoras = uaDefs.reduce((s, ua) => s + ua.horas, 0);

  return (
    <div className="space-y-4">
      {/* UA Summary bar */}
      <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span><strong>{uaDefs.length}</strong> UAs</span>
          <span><strong>{totalHoras}</strong>/{uf.duracion}h asignadas</span>
          <span className={unassignedCount > 0 ? 'text-amber-600 font-medium' : 'text-green-600'}>
            {unassignedCount > 0 ? `${unassignedCount} temas sin asignar` : '✓ Todos asignados'}
          </span>
        </div>
        <button onClick={onCreateUA}
          className="text-xs font-medium text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors">
          + Nueva UA
        </button>
      </div>

      {/* Content blocks */}
      <div className="space-y-3">
        {uf.contenidos.map((tema, temaIdx) => {
          const assignedUA = temaAssignment.get(temaIdx);
          const uaColor = assignedUA
            ? UA_COLORS[uaDefs.findIndex(u => u.id === assignedUA) % UA_COLORS.length]
            : null;

          return (
            <div key={temaIdx}
              className={`border rounded-lg overflow-hidden transition-all ${
                assignedUA
                  ? `${uaColor?.border} ${uaColor?.bg}`
                  : 'border-slate-200 bg-white'
              }`}>
              {/* Theme header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-8">T{temaIdx + 1}</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{tema.titulo}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{tema.items.length} contenidos</div>
                  </div>
                </div>
                {/* UA assignment dropdown */}
                <select
                  value={assignedUA || ''}
                  onChange={e => onAssign(temaIdx, e.target.value || null)}
                  className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500">
                  <option value="">Sin asignar</option>
                  {uaDefs.map(ua => (
                    <option key={ua.id} value={ua.id}>{ua.id} ({ua.horas}h)</option>
                  ))}
                </select>
              </div>

              {/* Content items (collapsible) */}
              <details className="group">
                <summary className="px-4 py-1.5 text-[10px] text-slate-400 cursor-pointer hover:text-slate-600 border-t border-slate-100">
                  Ver contenidos ▸
                </summary>
                <div className="px-4 pb-3 space-y-1">
                  {tema.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="text-xs text-slate-600 pl-11 py-0.5 leading-relaxed">
                      • {item.texto}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          );
        })}
      </div>

      {/* UA hour editors */}
      {uaDefs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-3">Horas por UA</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {uaDefs.map((ua, i) => {
              const color = UA_COLORS[i % UA_COLORS.length];
              return (
                <div key={ua.id} className={`flex items-center gap-2 ${color.bg} ${color.border} border rounded-md px-3 py-2`}>
                  <span className={`text-xs font-bold ${color.text}`}>{ua.id}</span>
                  <input
                    type="number"
                    min={1}
                    max={uf.duracion}
                    value={ua.horas}
                    onChange={e => onSetHoras(ua.id, parseInt(e.target.value) || 0)}
                    className="w-14 text-xs text-center border border-slate-200 rounded px-1 py-1 bg-white"
                  />
                  <span className="text-[10px] text-slate-400">h</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{ua.temaIndices.length} temas</span>
                  {uaDefs.length > 1 && (
                    <button onClick={() => onRemoveUA(ua.id)}
                      className="text-slate-300 hover:text-red-500 text-xs ml-1" title="Eliminar UA">✕</button>
                  )}
                </div>
              );
            })}
          </div>
          {totalHoras !== uf.duracion && (
            <p className="text-[10px] text-amber-600 mt-2">
              ⚠ Horas asignadas ({totalHoras}h) ≠ duración UF ({uf.duracion}h)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// STEP 2: CRITERIOS (auto-derived, read-only)
// ============================================

function Step2Criterios({
  uf,
  uaDefs,
}: {
  uf: BoeUFData;
  uaDefs: UADefinition[];
}) {
  // Build CE map from contenidos
  const ceMap = useMemo(() => buildContenidoCEMap(uf), [uf]);

  return (
    <div className="space-y-6">
      {uaDefs.map((ua, uaIdx) => {
        // Collect all CEs from assigned temas
        const ceIdsSet = new Set<string>();
        ua.temaIndices.forEach(temaIdx => {
          const tema = uf.contenidos[temaIdx];
          tema?.items.forEach(item => {
            const ces = ceMap.get(item.texto) || [];
            ces.forEach(id => ceIdsSet.add(id));
          });
        });

        // Filter capacidades to only those with matching CEs
        const filteredCaps = uf.capacidades
          .map(cap => ({
            ...cap,
            criterios: cap.criterios.filter(ce => ceIdsSet.has(ce.codigo)),
          }))
          .filter(cap => cap.criterios.length > 0);

        const color = UA_COLORS[uaIdx % UA_COLORS.length];

        return (
          <div key={ua.id} className={`border rounded-lg overflow-hidden ${color.border}`}>
            <div className={`px-4 py-3 ${color.bg} flex items-center justify-between`}>
              <div>
                <span className={`text-sm font-bold ${color.text}`}>{ua.id}</span>
                <span className="text-xs text-slate-500 ml-2">{ua.horas}h · {ua.temaIndices.length} temas</span>
              </div>
              <span className="text-xs text-slate-500">
                {filteredCaps.length} capacidades · {[...ceIdsSet].length} CEs
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredCaps.map(cap => (
                <div key={cap.codigo} className="px-4 py-3">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-900 flex-shrink-0 w-6">{cap.codigo}</span>
                    <p className="text-xs text-slate-700 leading-relaxed">{cap.texto}</p>
                  </div>
                  <div className="ml-8 space-y-1.5">
                    {cap.criterios.map(ce => {
                      const tipo = clasificarCE(ce.texto);
                      const tipColor = TIPOLOGIA_COLORS[tipo];
                      return (
                        <div key={ce.codigo} className="flex items-start gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400 flex-shrink-0 w-10 pt-0.5">
                            {ce.codigo}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0 rounded text-[9px] font-medium flex-shrink-0 ${tipColor.bg} ${tipColor.text}`}>
                            {tipColor.label}
                          </span>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{ce.texto}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// STEP 3: SdA BUILDER (placeholder for now)
// ============================================

/** Methodology options for SdA (from golden sample patterns) */
const METODOLOGIAS = [
  'Método interrogativo',
  'Método expositivo-interrogativo',
  'Expositivo con ejemplo aplicado',
  'Aprendizaje basado en problemas',
  'Expositivo-participativo',
  'Estudio de caso',
  'Análisis de textos y discusión guiada',
  'Role-playing (simulación)',
  'Método demostrativo',
  'Investigación guiada y debate',
  'Demostrativo en aula informática',
  'Resolución de problemas',
  'Demostrativo + práctica individual',
  'Debate dirigido con análisis de dilemas',
  'Clase de síntesis con participación activa',
];

/**
 * Auto-generate SdA drafts from the CE × contenido cross.
 * Strategy: 1 SdA per CE (or per small CE group), using literal BOE text.
 */
function autoGenerateSdAs(
  uf: BoeUFData,
  ua: UADefinition,
  ceMap: Map<string, string[]>,
): SdADraft[] {
  // 1. Collect CEs for this UA
  const ceIdsSet = new Set<string>();
  ua.temaIndices.forEach(temaIdx => {
    const tema = uf.contenidos[temaIdx];
    tema?.items.forEach(item => {
      const ces = ceMap.get(item.texto) || [];
      ces.forEach(id => ceIdsSet.add(id));
    });
  });

  // 2. Get full CE objects in order
  const ceList: { id: string; texto: string; capId: string; capTexto: string }[] = [];
  uf.capacidades.forEach(cap => {
    cap.criterios.forEach(ce => {
      if (ceIdsSet.has(ce.codigo)) {
        ceList.push({ id: ce.codigo, texto: ce.texto, capId: cap.codigo, capTexto: cap.texto });
      }
    });
  });

  // 3. Calculate hours per SdA
  const horasEval = Math.max(2, Math.round(ua.horas * 0.15)); // ~15% for evaluation
  const horasAuto = Math.max(1, Math.round(ua.horas * 0.1));  // ~10% autonomous
  const horasSdA = ua.horas - horasEval - horasAuto;

  // Group CEs: pair small CEs, keep complex ones solo
  const groups: typeof ceList[] = [];
  let i = 0;
  while (i < ceList.length) {
    const ce = ceList[i];
    // "En supuestos/casos prácticos" are typically longer → solo
    if (ce.texto.length > 200 || /^en (supuestos?|casos?|diversas|situaciones)/i.test(ce.texto)) {
      groups.push([ce]);
      i++;
    } else if (i + 1 < ceList.length && ceList[i + 1].texto.length < 150) {
      // Pair two short CEs
      groups.push([ce, ceList[i + 1]]);
      i += 2;
    } else {
      groups.push([ce]);
      i++;
    }
  }

  const hoursPerSdA = groups.length > 0 ? Math.max(1, Math.round(horasSdA / groups.length)) : 2;

  // 4. Generate SdA drafts
  let sdaNum = 1;
  return groups.map((ceGroup, gIdx) => {
    const ceIds = ceGroup.map(ce => ce.id);
    const primaryCE = ceGroup[0];
    const tipo = clasificarCE(primaryCE.texto);

    // Name: derive from CE text (first 60 chars + action focus)
    const actionVerb = primaryCE.texto.match(/^(\w+)/)?.[1] || 'Actividad';
    const topicSnippet = primaryCE.texto.substring(
      primaryCE.texto.indexOf(' ') + 1,
      Math.min(primaryCE.texto.length, 80)
    ).replace(/[.,;:]$/, '');

    // Methodology: pick based on tipología
    const metIdx = gIdx % METODOLOGIAS.length;
    const metodologia = tipo === 'destreza'
      ? METODOLOGIAS[Math.min(metIdx + 3, METODOLOGIAS.length - 1)] // bias toward practical
      : tipo === 'habilidad'
        ? METODOLOGIAS[Math.min(metIdx + 6, METODOLOGIAS.length - 1)] // bias toward debate/roleplay
        : METODOLOGIAS[metIdx]; // knowledge → expositivo

    return {
      numero: sdaNum++,
      nombre: `${actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)} ${topicSnippet}`,
      objetivo: ceGroup.map(ce => ce.texto).join(' '),
      ceVinculados: ceIds,
      metodologia,
      desarrollo: `El alumnado ${primaryCE.texto.charAt(0).toLowerCase() + primaryCE.texto.slice(1)}`,
      recursos: 'Pizarra, material de aula, presentación multimedia.',
      tiempo: Math.min(hoursPerSdA, 4),
    };
  });
}

function Step3SdAs({
  uf,
  uaDefs,
  sdaState,
  onUpdateSdAs,
}: {
  uf: BoeUFData;
  uaDefs: UADefinition[];
  sdaState: Record<string, SdADraft[]>;
  onUpdateSdAs: (uaId: string, sdas: SdADraft[]) => void;
}) {
  const ceMap = useMemo(() => buildContenidoCEMap(uf), [uf]);

  // Auto-generate SdAs for UAs that don't have any yet (runs once per UA)
  const [initialized, setInitialized] = useState<Set<string>>(new Set());

  // useEffect to avoid render-time state mutation
  React.useEffect(() => {
    const toInit: string[] = [];
    uaDefs.forEach(ua => {
      if (!initialized.has(ua.id) && (!sdaState[ua.id] || sdaState[ua.id].length === 0)) {
        toInit.push(ua.id);
      }
    });
    if (toInit.length > 0) {
      toInit.forEach(uaId => {
        const ua = uaDefs.find(u => u.id === uaId);
        if (ua) {
          const generated = autoGenerateSdAs(uf, ua, ceMap);
          onUpdateSdAs(uaId, generated);
        }
      });
      setInitialized(prev => {
        const next = new Set(prev);
        toInit.forEach(id => next.add(id));
        return next;
      });
    }
  }, [uaDefs, sdaState, initialized, uf, ceMap, onUpdateSdAs]);

  return (
    <div className="space-y-6">
      {uaDefs.map((ua, uaIdx) => {
        const sdas = sdaState[ua.id] || [];
        const color = UA_COLORS[uaIdx % UA_COLORS.length];
        const totalHorasSdA = sdas.reduce((s, sda) => s + sda.tiempo, 0);
        const horasEval = Math.max(2, Math.round(ua.horas * 0.15));
        const horasAuto = Math.max(1, Math.round(ua.horas * 0.1));
        const horasTarget = ua.horas - horasEval - horasAuto;

        return (
          <div key={ua.id} className={`border rounded-lg overflow-hidden ${color.border}`}>
            {/* UA Header */}
            <div className={`px-4 py-3 ${color.bg} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${color.text}`}>{ua.id}</span>
                <span className="text-xs text-slate-500">{ua.horas}h total</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-slate-500">
                <span>Eval: {horasEval}h</span>
                <span>Autónomo: {horasAuto}h</span>
                <span className={totalHorasSdA === horasTarget ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                  SdAs: {totalHorasSdA}/{horasTarget}h
                </span>
                <span>{sdas.length} SdAs</span>
              </div>
            </div>

            {/* SdA List */}
            <div className="divide-y divide-slate-100">
              {sdas.map((sda, sdaIdx) => (
                <div key={sdaIdx} className="px-4 py-4 space-y-3">
                  {/* SdA Header: number + name + time */}
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
                      {sda.numero}
                    </span>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={sda.nombre}
                        onChange={e => {
                          const updated = [...sdas];
                          updated[sdaIdx] = { ...sda, nombre: e.target.value };
                          onUpdateSdAs(ua.id, updated);
                        }}
                        className="w-full text-sm font-semibold text-slate-900 border-0 border-b border-transparent hover:border-slate-200 focus:border-green-500 focus:ring-0 px-0 py-0.5 bg-transparent"
                      />
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <input
                        type="number"
                        min={0.5}
                        max={8}
                        step={0.5}
                        value={sda.tiempo}
                        onChange={e => {
                          const updated = [...sdas];
                          updated[sdaIdx] = { ...sda, tiempo: parseFloat(e.target.value) || 1 };
                          onUpdateSdAs(ua.id, updated);
                        }}
                        className="w-12 text-xs text-center border border-slate-200 rounded px-1 py-0.5"
                      />
                      <span className="text-[10px] text-slate-400">h</span>
                    </div>
                  </div>

                  {/* CE badges */}
                  <div className="flex flex-wrap gap-1 ml-9">
                    {sda.ceVinculados.map(ceId => (
                      <span key={ceId} className="inline-flex items-center px-1.5 py-0 rounded bg-green-50 text-green-700 text-[10px] font-medium">
                        {ceId}
                      </span>
                    ))}
                  </div>

                  {/* Editable fields */}
                  <div className="ml-9 space-y-2">
                    {/* Objetivo */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Objetivo</label>
                      <textarea
                        value={sda.objetivo}
                        onChange={e => {
                          const updated = [...sdas];
                          updated[sdaIdx] = { ...sda, objetivo: e.target.value };
                          onUpdateSdAs(ua.id, updated);
                        }}
                        rows={2}
                        className="w-full text-xs text-slate-600 border border-slate-100 rounded-md px-2 py-1.5 hover:border-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-200 resize-none"
                      />
                    </div>

                    {/* Metodología */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Metodología</label>
                      <select
                        value={sda.metodologia}
                        onChange={e => {
                          const updated = [...sdas];
                          updated[sdaIdx] = { ...sda, metodologia: e.target.value };
                          onUpdateSdAs(ua.id, updated);
                        }}
                        className="w-full text-xs border border-slate-100 rounded-md px-2 py-1.5 bg-white hover:border-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-200">
                        {METODOLOGIAS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>

                    {/* Desarrollo */}
                    <details className="group">
                      <summary className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600">
                        Desarrollo de la actividad ▸
                      </summary>
                      <textarea
                        value={sda.desarrollo}
                        onChange={e => {
                          const updated = [...sdas];
                          updated[sdaIdx] = { ...sda, desarrollo: e.target.value };
                          onUpdateSdAs(ua.id, updated);
                        }}
                        rows={3}
                        className="w-full mt-1 text-xs text-slate-600 border border-slate-100 rounded-md px-2 py-1.5 hover:border-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-200 resize-y"
                      />
                    </details>

                    {/* Recursos */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Recursos</label>
                      <input
                        type="text"
                        value={sda.recursos}
                        onChange={e => {
                          const updated = [...sdas];
                          updated[sdaIdx] = { ...sda, recursos: e.target.value };
                          onUpdateSdAs(ua.id, updated);
                        }}
                        className="w-full text-xs text-slate-600 border border-slate-100 rounded-md px-2 py-1.5 hover:border-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                      />
                    </div>
                  </div>

                  {/* Delete SdA button */}
                  <div className="ml-9">
                    <button
                      onClick={() => {
                        const updated = sdas.filter((_, idx) => idx !== sdaIdx);
                        onUpdateSdAs(ua.id, updated);
                      }}
                      className="text-[10px] text-slate-300 hover:text-red-500 transition-colors">
                      Eliminar SdA
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add SdA button */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => {
                  const newSda: SdADraft = {
                    numero: sdas.length + 1,
                    nombre: 'Nueva situación de aprendizaje',
                    objetivo: '',
                    ceVinculados: [],
                    metodologia: METODOLOGIAS[0],
                    desarrollo: '',
                    recursos: 'Pizarra, material de aula.',
                    tiempo: 2,
                  };
                  onUpdateSdAs(ua.id, [...sdas, newSda]);
                }}
                className="text-xs text-green-600 hover:text-green-700 font-medium">
                + Añadir SdA
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// UA COLORS
// ============================================

const UA_COLORS = [
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
];

// ============================================
// MAIN WIZARD COMPONENT
// ============================================

export function ProgramacionWizard({ uf, moduloCodigo, moduloNombre, moduloHoras, certificadoCodigo, certificadoNombre, certificadoDuracion }: ProgramacionWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [sdaState, setSdaState] = useState<Record<string, SdADraft[]>>({});

  const handleUpdateSdAs = useCallback((uaId: string, sdas: SdADraft[]) => {
    setSdaState(prev => ({ ...prev, [uaId]: sdas }));
  }, []);
  const [uaDefs, setUaDefs] = useState<UADefinition[]>(() => {
    // Auto-assign: split temas roughly in half between 2 UAs
    const mid = Math.ceil(uf.contenidos.length / 2);
    const tema1 = Array.from({ length: mid }, (_, i) => i);
    const tema2 = Array.from({ length: uf.contenidos.length - mid }, (_, i) => i + mid);
    return [
      { id: 'UA1', titulo: '', horas: Math.round(uf.duracion / 2), temaIndices: tema1 },
      { id: 'UA2', titulo: '', horas: uf.duracion - Math.round(uf.duracion / 2), temaIndices: tema2 },
    ];
  });

  // Step 1: Assign a tema to a UA
  const handleAssign = useCallback((temaIdx: number, uaId: string | null) => {
    setUaDefs(prev => prev.map(ua => ({
      ...ua,
      temaIndices: uaId === ua.id
        ? [...ua.temaIndices.filter(i => i !== temaIdx), temaIdx].sort()
        : ua.temaIndices.filter(i => i !== temaIdx),
    })));
  }, []);

  const handleCreateUA = useCallback(() => {
    setUaDefs(prev => {
      const nextNum = prev.length + 1;
      return [...prev, {
        id: `UA${nextNum}`,
        titulo: '',
        horas: 10,
        temaIndices: [],
      }];
    });
  }, []);

  const handleRemoveUA = useCallback((uaId: string) => {
    setUaDefs(prev => prev.filter(ua => ua.id !== uaId));
  }, []);

  const handleSetHoras = useCallback((uaId: string, horas: number) => {
    setUaDefs(prev => prev.map(ua =>
      ua.id === uaId ? { ...ua, horas: Math.max(1, Math.min(horas, uf.duracion)) } : ua
    ));
  }, [uf.duracion]);

  // Validation: can advance?
  const canAdvance = useMemo(() => {
    if (step === 1) {
      // All temas must be assigned and every UA must have at least 1 tema
      const assigned = uaDefs.reduce((s, ua) => s + ua.temaIndices.length, 0);
      return assigned === uf.contenidos.length && uaDefs.every(ua => ua.temaIndices.length > 0);
    }
    if (step === 2) {
      // At least 1 CE must exist per UA (sanity check)
      return uaDefs.every(ua => ua.temaIndices.length > 0);
    }
    return true;
  }, [step, uaDefs, uf.contenidos.length]);

  return (
    <div className="space-y-6">
      {/* UF Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
            {uf.codigo}
          </span>
          <span className="text-xs text-slate-500">{moduloCodigo} · {uf.duracion}h</span>
        </div>
        <h2 className="text-base font-semibold text-slate-900">{uf.denominacion}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {uf.capacidades.length} capacidades · {uf.capacidades.reduce((s, c) => s + c.criterios.length, 0)} criterios · {uf.contenidos.length} bloques de contenido
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator current={step} total={3} />

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">
            {step === 1 && 'Paso 1: Asignar contenidos BOE a Unidades de Aprendizaje'}
            {step === 2 && 'Paso 2: Capacidades y Criterios de Evaluación (derivados)'}
            {step === 3 && 'Paso 3: Situaciones de Aprendizaje'}
          </h3>
          <span className="text-[10px] text-slate-400">
            {step === 1 && 'Regla Minerva: los contenidos determinan la estructura'}
            {step === 2 && 'Auto-derivados del Paso 1 — solo lectura'}
            {step === 3 && 'Construir desde Col1 × Col2'}
          </span>
        </div>

        {step === 1 && (
          <Step1Contenidos
            uf={uf}
            uaDefs={uaDefs}
            onAssign={handleAssign}
            onCreateUA={handleCreateUA}
            onRemoveUA={handleRemoveUA}
            onSetHoras={handleSetHoras}
          />
        )}
        {step === 2 && <Step2Criterios uf={uf} uaDefs={uaDefs} />}
        {step === 3 && (
          <>
            <Step3SdAs uf={uf} uaDefs={uaDefs} sdaState={sdaState} onUpdateSdAs={handleUpdateSdAs} />

            {/* Validation Summary Panel */}
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <h4 className="text-xs font-semibold text-slate-700">✓ Validación pre-export</h4>
              {uaDefs.map((ua, i) => {
                const sdas = sdaState[ua.id] || [];
                const horasEval = Math.max(2, Math.round(ua.horas * 0.15));
                const horasAuto = Math.max(1, Math.round(ua.horas * 0.1));
                const horasTarget = ua.horas - horasEval - horasAuto;
                const horasSdA = sdas.reduce((s, sda) => s + sda.tiempo, 0);
                const horasOk = horasSdA === horasTarget;
                const allCEsCovered = sdas.every(sda => sda.ceVinculados.length > 0);
                const allNamed = sdas.every(sda => sda.nombre.trim().length > 3);
                return (
                  <div key={ua.id} className="flex items-center gap-3 text-xs">
                    <span className="font-medium text-slate-700 w-8">{ua.id}</span>
                    <span className={horasOk ? 'text-green-600' : 'text-amber-600'}>
                      {horasOk ? '✓' : '⚠'} Horas: {horasSdA}/{horasTarget}h
                    </span>
                    <span className={allCEsCovered ? 'text-green-600' : 'text-amber-600'}>
                      {allCEsCovered ? '✓' : '⚠'} CEs vinculados
                    </span>
                    <span className={allNamed ? 'text-green-600' : 'text-amber-600'}>
                      {allNamed ? '✓' : '⚠'} Nombres
                    </span>
                    <span className="text-slate-400">{sdas.length} SdAs</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1) as WizardStep)}
          disabled={step === 1}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            step === 1
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          }`}>
          ← Anterior
        </button>

        <div className="flex items-center gap-3">
          {step < 3 ? (
            <button
              onClick={() => setStep(s => Math.min(3, s + 1) as WizardStep)}
              disabled={!canAdvance}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                canAdvance
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}>
              Siguiente →
            </button>
          ) : (
            <button
              onClick={() => {
                // Build export data from wizard state
                const exportUAs: UAExport[] = uaDefs.map(ua => {
                  const sdas = sdaState[ua.id] || [];
                  const horasEval = Math.max(2, Math.round(ua.horas * 0.15));
                  const horasAuto = Math.max(1, Math.round(ua.horas * 0.1));
                  // Collect CE IDs for this UA
                  const ceMap = buildContenidoCEMap(uf);
                  const ceIds = new Set<string>();
                  ua.temaIndices.forEach(temaIdx => {
                    const tema = uf.contenidos[temaIdx];
                    tema?.items.forEach(item => {
                      (ceMap.get(item.texto) || []).forEach(id => ceIds.add(id));
                    });
                  });
                  return {
                    id: ua.id,
                    titulo: ua.temaIndices.map(i => uf.contenidos[i]?.titulo || '').join('; '),
                    horas: ua.horas,
                    horasEvaluacion: horasEval,
                    horasAutonomo: horasAuto,
                    horasSdA: ua.horas - horasEval - horasAuto,
                    temaIndices: ua.temaIndices,
                    capacidadIds: [...ceIds],
                    sdas: sdas.map(s => ({
                      numero: s.numero,
                      nombre: s.nombre,
                      objetivo: s.objetivo,
                      ceVinculados: s.ceVinculados,
                      metodologia: s.metodologia,
                      desarrollo: s.desarrollo,
                      recursos: s.recursos,
                      tiempo: s.tiempo,
                    })),
                  };
                });
                const exportData: AnexoIVExportData = {
                  certificado: { codigo: certificadoCodigo, nombre: certificadoNombre, duracion: certificadoDuracion },
                  modulo: { codigo: moduloCodigo, nombre: moduloNombre, horas: moduloHoras },
                  uf,
                  uas: exportUAs,
                };
                downloadAnexoIVDocx(exportData).catch(err => {
                  console.error('Export failed:', err);
                  alert('Error al exportar: ' + (err?.message || 'Unknown error'));
                });
              }}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-sm flex items-center gap-2">
              <span>📄</span> Generar Anexo IV (.docx)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
