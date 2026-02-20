/**
 * ProgramacionWizard.tsx -- Agent C: The UI Wizard Dev
 *
 * 3-step Minerva flow for Anexo IV Programacion Didactica:
 *   Step 1: Contenidos (Col 2) -- select BOE content blocks per UA
 *   Step 2: Criterios (Col 1) -- auto-derived from selected contenidos (read-only)
 *   Step 3: SdAs (Col 3) -- build learning situations from Col1 x Col2
 *
 * OAT redesign: oat-card, oat-badge, oat-module-card, semantic details/summary,
 * Lucide icons, CSS custom property UA palette.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Check, Plus, X, FileText, AlertTriangle } from 'lucide-react';
import type { BoeUFData } from '../types/boe';
import { clasificarCE, TIPOLOGIA_COLORS, buildContenidoCEMap } from '../engine/ceUtils';
import { downloadAnexoIVDocx } from '../engine/anexoIVExport';
import { runValidations } from '../engine/validationEngine';
import { HealthPanel } from './HealthPanel';
import type { AnexoIVExportData, UAExport } from '../engine/anexoIVExport';

// ============================================
// TYPES
// ============================================

type WizardStep = 1 | 2 | 3;

interface ContenidoCELink {
  contenidoTema: number;
  contenidoIndex: number;
  ceIds: string[];
}

interface UADefinition {
  id: string;
  titulo: string;
  horas: number;
  temaIndices: number[];
}

const AGRUPAMIENTOS = [
  'Individual',
  'Parejas',
  'Pequeno grupo',
  'Grupos 3-4',
  'Grupos 5-6',
  'Gran grupo',
  'Individual y parejas',
  'Individual, grupos 3-4 y gran grupo',
  'Grupos 3-4 y gran grupo',
  'Grupos 5-6 y gran grupo',
  'Parejas y gran grupo',
];

type SdAFase = 'Inicio' | 'Desarrollo' | 'Cierre';

interface SdADraft {
  numero: number;
  fase: SdAFase;
  nombre: string;
  objetivo: string;
  ceVinculados: string[];
  metodologia: string;
  agrupamiento: string;
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
// UA COLOUR PALETTE -- hex injected as --mc
// ============================================

const UA_PALETTE = [
  { mc: '#059669', text: '#065f46', light: '#ecfdf5' },
  { mc: '#0284c7', text: '#0c4a6e', light: '#e0f2fe' },
  { mc: '#d97706', text: '#78350f', light: '#fffbeb' },
  { mc: '#7c3aed', text: '#4c1d95', light: '#ede9fe' },
  { mc: '#e11d48', text: '#881337', light: '#fff1f2' },
  { mc: '#0891b2', text: '#164e63', light: '#ecfeff' },
];

// Legacy alias for Step1/2 sub-components that reference UA_COLORS
const UA_COLORS = UA_PALETTE.map(p => ({
  bg:     '',
  text:   '',
  border: '',
  mc:     p.mc,
  tcText: p.text,
  light:  p.light,
}));

// ============================================
// METHODOLOGY OPTIONS
// ============================================

const METODOLOGIAS = [
  'Metodo interrogativo',
  'Metodo expositivo-interrogativo',
  'Expositivo con ejemplo aplicado',
  'Aprendizaje basado en problemas',
  'Expositivo-participativo',
  'Estudio de caso',
  'Analisis de textos y discusion guiada',
  'Role-playing (simulacion)',
  'Metodo demostrativo',
  'Investigacion guiada y debate',
  'Demostrativo en aula informatica',
  'Resolucion de problemas',
  'Demostrativo + practica individual',
  'Debate dirigido con analisis de dilemas',
  'Clase de sintesis con participacion activa',
];

// ============================================
// STEP INDICATOR
// ============================================

function StepIndicator({ current, total }: { current: WizardStep; total: number }) {
  const steps = [
    { n: 1 as WizardStep, label: 'Contenidos', desc: 'Seleccionar bloques BOE' },
    { n: 2 as WizardStep, label: 'Criterios',  desc: 'Capacidades y CEs derivados' },
    { n: 3 as WizardStep, label: 'Situaciones', desc: 'Construir SdAs' },
  ];

  return (
    <div className="flex items-center gap-0">
      {steps.slice(0, total).map((s, i) => (
        <div key={s.n} className="flex items-center">
          {i > 0 && (
            <div
              className="h-px mx-3"
              style={{ width: '3rem', backgroundColor: s.n <= current ? 'var(--primary)' : 'var(--border)' }}
            />
          )}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
              style={{
                backgroundColor: s.n <= current ? 'var(--primary)' : 'var(--muted)',
                color:           s.n <= current ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                boxShadow:       s.n === current ? '0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent)' : 'none',
              }}
            >
              {s.n < current ? <Check size={12} /> : s.n}
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: s.n <= current ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                {s.label}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{s.desc}</div>
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
      {/* UA summary bar */}
      <div className="oat-card flex items-center justify-between flex-wrap gap-3" style={{ padding: '0.625rem 1rem' }}>
        <div className="flex items-center gap-4">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <strong style={{ color: 'var(--foreground)' }}>{uaDefs.length}</strong> UAs
          </span>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <strong style={{ color: 'var(--foreground)' }}>{totalHoras}</strong>/{uf.duracion}h
          </span>
          {unassignedCount > 0 ? (
            <span className="oat-badge warning">{unassignedCount} temas sin asignar</span>
          ) : (
            <span className="oat-badge success">Todos asignados</span>
          )}
        </div>
        <button
          onClick={onCreateUA}
          className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          style={{ background: 'none', border: 'none', padding: '0.375rem 0.75rem', color: 'var(--primary)', borderRadius: 'var(--radius-medium)', backgroundColor: 'color-mix(in srgb, var(--primary) 8%, transparent)' }}
        >
          <Plus size={13} /> Nueva UA
        </button>
      </div>

      {/* Content blocks */}
      <div className="space-y-2">
        {uf.contenidos.map((tema, temaIdx) => {
          const assignedUA  = temaAssignment.get(temaIdx);
          const uaIdx       = assignedUA ? uaDefs.findIndex(u => u.id === assignedUA) : -1;
          const p           = uaIdx >= 0 ? UA_PALETTE[uaIdx % UA_PALETTE.length] : null;

          return (
            <div
              key={temaIdx}
              className="rounded-lg border overflow-hidden transition-colors"
              style={{
                borderColor:     p ? p.mc + '50' : 'var(--border)',
                backgroundColor: p ? p.light      : 'var(--card)',
              }}
            >
              <div className="flex items-center justify-between px-4 py-2.5 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <code className="text-[10px] font-bold flex-shrink-0" style={{ color: p ? p.mc : 'var(--muted-foreground)' }}>
                    T{temaIdx + 1}
                  </code>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{tema.titulo}</div>
                    <div className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{tema.items.length} contenidos</div>
                  </div>
                </div>
                <select
                  value={assignedUA || ''}
                  onChange={e => onAssign(temaIdx, e.target.value || null)}
                  style={{ fontSize: 'var(--text-8)', marginBlockStart: 0, width: 'auto', minWidth: '8rem', flexShrink: 0 }}
                >
                  <option value="">Sin asignar</option>
                  {uaDefs.map(ua => (
                    <option key={ua.id} value={ua.id}>{ua.id} ({ua.horas}h)</option>
                  ))}
                </select>
              </div>

              <details style={{ border: 'none', borderRadius: 0 }}>
                <summary
                  style={{
                    padding: '0.375rem 1rem',
                    fontSize: 'var(--text-8)',
                    color: 'var(--muted-foreground)',
                    borderTop: '1px solid var(--border)',
                    backgroundColor: 'transparent',
                  }}
                >
                  Ver contenidos ({tema.items.length})
                </summary>
                <div style={{ padding: '0.5rem 1rem 0.75rem 2.5rem' }} className="space-y-0.5">
                  {tema.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                      {item.texto}
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
        <div className="oat-card" style={{ padding: '1rem' }}>
          <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Horas por UA</h4>
          <div className="flex flex-wrap gap-2">
            {uaDefs.map((ua, i) => {
              const p = UA_PALETTE[i % UA_PALETTE.length];
              return (
                <div
                  key={ua.id}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5"
                  style={{ backgroundColor: p.light, border: '1px solid ' + p.mc + '40' }}
                >
                  <code className="text-[11px] font-bold" style={{ color: p.mc }}>{ua.id}</code>
                  <input
                    type="number"
                    min={1}
                    max={uf.duracion}
                    value={ua.horas}
                    onChange={e => onSetHoras(ua.id, parseInt(e.target.value) || 0)}
                    style={{ width: '3.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-8)', marginBlockStart: 0 }}
                  />
                  <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>h</span>
                  <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{ua.temaIndices.length} temas</span>
                  {uaDefs.length > 1 && (
                    <button
                      onClick={() => onRemoveUA(ua.id)}
                      title="Eliminar UA"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', display: 'flex', padding: '0.125rem' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {totalHoras !== uf.duracion && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertTriangle size={12} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <p className="text-[10px]" style={{ color: 'var(--warning)' }}>
                Horas asignadas ({totalHoras}h) distinto de duracion UF ({uf.duracion}h)
              </p>
            </div>
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
  const ceMap = useMemo(() => buildContenidoCEMap(uf), [uf]);

  return (
    <div className="space-y-4">
      {uaDefs.map((ua, uaIdx) => {
        const ceIdsSet = new Set<string>();
        ua.temaIndices.forEach(temaIdx => {
          const tema = uf.contenidos[temaIdx];
          tema?.items.forEach(item => {
            const ces = ceMap.get(item.texto) || [];
            ces.forEach(id => ceIdsSet.add(id));
          });
        });

        const filteredCaps = uf.capacidades
          .map(cap => ({
            ...cap,
            criterios: cap.criterios.filter(ce => ceIdsSet.has(ce.codigo)),
          }))
          .filter(cap => cap.criterios.length > 0);

        const p = UA_PALETTE[uaIdx % UA_PALETTE.length];

        return (
          <div
            key={ua.id}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid ' + p.mc + '50' }}
          >
            {/* UA header */}
            <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: p.light }}>
              <div className="flex items-center gap-2">
                <code className="text-xs font-bold" style={{ color: p.mc }}>{ua.id}</code>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{ua.horas}h &middot; {ua.temaIndices.length} temas</span>
              </div>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {filteredCaps.length} capacidades &middot; {[...ceIdsSet].length} CEs
              </span>
            </div>

            {/* Capacidades / CEs */}
            <div className="divide-y">
              {filteredCaps.map(cap => (
                <div key={cap.codigo} className="px-4 py-3" style={{ backgroundColor: 'var(--card)' }}>
                  <div className="flex items-start gap-2 mb-2">
                    <code className="text-xs font-bold flex-shrink-0 w-6" style={{ color: 'var(--foreground)' }}>{cap.codigo}</code>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground)' }}>{cap.texto}</p>
                  </div>
                  <div className="ml-6 space-y-1.5">
                    {cap.criterios.map(ce => {
                      const tipo = clasificarCE(ce.texto);
                      const tipColor = TIPOLOGIA_COLORS[tipo];
                      return (
                        <div key={ce.codigo} className="flex items-start gap-2">
                          <code className="text-[10px] font-bold flex-shrink-0 w-10 pt-0.5" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
                            {ce.codigo}
                          </code>
                          <span className={'inline-flex items-center px-1.5 rounded text-[9px] font-medium flex-shrink-0 ' + tipColor.bg + ' ' + tipColor.text}>
                            {tipColor.label}
                          </span>
                          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--foreground)' }}>{ce.texto}</p>
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
// STEP 3 HELPERS
// ============================================

function autoGenerateSdAs(
  uf: BoeUFData,
  ua: UADefinition,
  ceMap: Map<string, string[]>,
): SdADraft[] {
  const ceIdsSet = new Set<string>();
  ua.temaIndices.forEach(temaIdx => {
    const tema = uf.contenidos[temaIdx];
    tema?.items.forEach(item => {
      const ces = ceMap.get(item.texto) || [];
      ces.forEach(id => ceIdsSet.add(id));
    });
  });

  const ceList: { id: string; texto: string; capId: string; capTexto: string }[] = [];
  uf.capacidades.forEach(cap => {
    cap.criterios.forEach(ce => {
      if (ceIdsSet.has(ce.codigo)) {
        ceList.push({ id: ce.codigo, texto: ce.texto, capId: cap.codigo, capTexto: cap.texto });
      }
    });
  });

  const horasEval = Math.max(2, Math.round(ua.horas * 0.15));
  const horasAuto = Math.max(1, Math.round(ua.horas * 0.1));
  const horasSdA  = ua.horas - horasEval - horasAuto;

  const groups: typeof ceList[] = [];
  let i = 0;
  while (i < ceList.length) {
    const ce = ceList[i];
    if (ce.texto.length > 200 || /^en (supuestos?|casos?|diversas|situaciones)/i.test(ce.texto)) {
      groups.push([ce]);
      i++;
    } else if (i + 1 < ceList.length && ceList[i + 1].texto.length < 150) {
      groups.push([ce, ceList[i + 1]]);
      i += 2;
    } else {
      groups.push([ce]);
      i++;
    }
  }

  const hoursPerSdA = groups.length > 0 ? Math.max(1, Math.round(horasSdA / groups.length)) : 2;

  let sdaNum = 1;
  return groups.map((ceGroup, gIdx) => {
    const ceIds     = ceGroup.map(ce => ce.id);
    const primaryCE = ceGroup[0];
    const tipo      = clasificarCE(primaryCE.texto);

    const actionVerb   = primaryCE.texto.match(/^(\w+)/)?.[1] || 'Actividad';
    const topicSnippet = primaryCE.texto.substring(
      primaryCE.texto.indexOf(' ') + 1,
      Math.min(primaryCE.texto.length, 80)
    ).replace(/[.,;:]$/, '');

    const metIdx     = gIdx % METODOLOGIAS.length;
    const metodologia = tipo === 'destreza'
      ? METODOLOGIAS[Math.min(metIdx + 3, METODOLOGIAS.length - 1)]
      : tipo === 'habilidad'
        ? METODOLOGIAS[Math.min(metIdx + 6, METODOLOGIAS.length - 1)]
        : METODOLOGIAS[metIdx];

    return {
      numero:       sdaNum++,
      fase:         gIdx === 0 ? 'Inicio' as SdAFase : (gIdx === groups.length - 1 ? 'Cierre' as SdAFase : 'Desarrollo' as SdAFase),
      nombre:       actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1) + ' ' + topicSnippet,
      objetivo:     ceGroup.map(ce => ce.texto).join(' '),
      ceVinculados: ceIds,
      metodologia,
      desarrollo:   'El alumnado ' + primaryCE.texto.charAt(0).toLowerCase() + primaryCE.texto.slice(1),
      agrupamiento: 'Gran grupo',
      recursos:     'Pizarra, material de aula, presentacion multimedia.',
      tiempo:       Math.min(hoursPerSdA, 4),
    };
  });
}

// ============================================
// STEP 3: SdA BUILDER
// ============================================

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

  const [initialized, setInitialized] = useState<Set<string>>(new Set());

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
    <div className="space-y-5">
      {uaDefs.map((ua, uaIdx) => {
        const sdas       = sdaState[ua.id] || [];
        const p          = UA_PALETTE[uaIdx % UA_PALETTE.length];
        const horasEval  = Math.max(2, Math.round(ua.horas * 0.15));
        const horasAuto  = Math.max(1, Math.round(ua.horas * 0.1));
        const horasTarget = ua.horas - horasEval - horasAuto;
        const totalHorasSdA = sdas.reduce((s, sda) => s + sda.tiempo, 0);
        const horasOk    = totalHorasSdA === horasTarget;

        return (
          <div
            key={ua.id}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid ' + p.mc + '50' }}
          >
            {/* UA header */}
            <div className="flex items-center justify-between px-4 py-2.5 flex-wrap gap-2" style={{ backgroundColor: p.light }}>
              <div className="flex items-center gap-3">
                <code className="text-sm font-bold" style={{ color: p.mc }}>{ua.id}</code>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{ua.horas}h total</span>
              </div>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                <span>Eval: {horasEval}h</span>
                <span>Autonomo: {horasAuto}h</span>
                <span className={horasOk ? '' : ''} style={{ color: horasOk ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                  SdAs: {totalHorasSdA}/{horasTarget}h
                </span>
                <span>{sdas.length} SdAs</span>
              </div>
            </div>

            {/* SdA list */}
            <div className="divide-y" style={{ backgroundColor: 'var(--card)' }}>
              {sdas.map((sda, sdaIdx) => (
                <div key={sdaIdx} className="px-4 py-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                  {/* SdA header */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                    >
                      {sda.numero}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={sda.nombre}
                        onChange={e => {
                          const updated = [...sdas];
                          updated[sdaIdx] = { ...sda, nombre: e.target.value };
                          onUpdateSdAs(ua.id, updated);
                        }}
                        className="w-full text-sm font-semibold"
                        style={{ background: 'transparent', border: 'none', borderBottom: '1px solid transparent', outline: 'none', paddingBlock: '0.125rem', color: 'var(--foreground)' }}
                        onFocus={e => { e.target.style.borderBottomColor = 'var(--primary)'; }}
                        onBlur={e => { e.target.style.borderBottomColor = 'transparent'; }}
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
                        style={{ width: '3rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-8)', marginBlockStart: 0 }}
                      />
                      <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>h</span>
                    </div>
                  </div>

                  {/* CE badges */}
                  <div className="flex flex-wrap gap-1 ml-9">
                    {sda.ceVinculados.map(ceId => (
                      <code
                        key={ceId}
                        className="oat-badge"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 8%, transparent)', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}
                      >
                        {ceId}
                      </code>
                    ))}
                  </div>

                  {/* Fields */}
                  <div className="ml-9 space-y-2">
                    {/* Objetivo */}
                    <div>
                      <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)', display: 'block', marginBlockStart: 0 }}>
                        Objetivo
                      </label>
                      <textarea
                        value={sda.objetivo}
                        rows={2}
                        onChange={e => {
                          const updated = [...sdas];
                          updated[sdaIdx] = { ...sda, objetivo: e.target.value };
                          onUpdateSdAs(ua.id, updated);
                        }}
                        style={{ marginBlockStart: '0.25rem', fontSize: 'var(--text-8)' }}
                      />
                    </div>

                    {/* Fase + Metodologia */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)', display: 'block', marginBlockStart: 0 }}>Fase</label>
                        <select
                          value={sda.fase || 'Desarrollo'}
                          onChange={e => {
                            const updated = [...sdas];
                            updated[sdaIdx] = { ...sda, fase: e.target.value as SdAFase };
                            onUpdateSdAs(ua.id, updated);
                          }}
                          style={{ fontSize: 'var(--text-8)', marginBlockStart: '0.25rem' }}
                        >
                          <option value="Inicio">Inicio</option>
                          <option value="Desarrollo">Desarrollo</option>
                          <option value="Cierre">Cierre</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)', display: 'block', marginBlockStart: 0 }}>Metodologia</label>
                        <select
                          value={sda.metodologia}
                          onChange={e => {
                            const updated = [...sdas];
                            updated[sdaIdx] = { ...sda, metodologia: e.target.value };
                            onUpdateSdAs(ua.id, updated);
                          }}
                          style={{ fontSize: 'var(--text-8)', marginBlockStart: '0.25rem' }}
                        >
                          {METODOLOGIAS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Agrupamiento */}
                    <div>
                      <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)', display: 'block', marginBlockStart: 0 }}>Agrupamiento</label>
                      <select
                        value={sda.agrupamiento || 'Gran grupo'}
                        onChange={e => {
                          const updated = [...sdas];
                          updated[sdaIdx] = { ...sda, agrupamiento: e.target.value };
                          onUpdateSdAs(ua.id, updated);
                        }}
                        style={{ fontSize: 'var(--text-8)', marginBlockStart: '0.25rem' }}
                      >
                        {AGRUPAMIENTOS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>

                    {/* Desarrollo (collapsible) */}
                    <details>
                      <summary style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)', cursor: 'pointer', border: 'none', background: 'none', padding: '0.125rem 0' }}>
                        Desarrollo de la actividad
                      </summary>
                      <textarea
                        value={sda.desarrollo}
                        rows={3}
                        onChange={e => {
                          const updated = [...sdas];
                          updated[sdaIdx] = { ...sda, desarrollo: e.target.value };
                          onUpdateSdAs(ua.id, updated);
                        }}
                        style={{ marginBlockStart: '0.25rem', fontSize: 'var(--text-8)', resize: 'vertical' }}
                      />
                    </details>

                    {/* Recursos */}
                    <div>
                      <label style={{ fontSize: 'var(--text-8)', color: 'var(--muted-foreground)', display: 'block', marginBlockStart: 0 }}>Recursos</label>
                      <input
                        type="text"
                        value={sda.recursos}
                        onChange={e => {
                          const updated = [...sdas];
                          updated[sdaIdx] = { ...sda, recursos: e.target.value };
                          onUpdateSdAs(ua.id, updated);
                        }}
                        style={{ fontSize: 'var(--text-8)', marginBlockStart: '0.25rem' }}
                      />
                    </div>
                  </div>

                  {/* Delete SdA */}
                  <div className="ml-9">
                    <button
                      onClick={() => {
                        const updated = sdas.filter((_, idx) => idx !== sdaIdx);
                        onUpdateSdAs(ua.id, updated);
                      }}
                      className="text-[10px] cursor-pointer transition-colors"
                      style={{ background: 'none', border: 'none', padding: 0, color: 'var(--muted-foreground)' }}
                      onMouseOver={e => { (e.target as HTMLElement).style.color = 'var(--danger)'; }}
                      onMouseOut={e => { (e.target as HTMLElement).style.color = 'var(--muted-foreground)'; }}
                    >
                      Eliminar SdA
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add SdA */}
            <div className="px-4 py-2 border-t" style={{ borderColor: p.mc + '30', backgroundColor: p.light }}>
              <button
                onClick={() => {
                  const newSda: SdADraft = {
                    numero: sdas.length + 1,
                    fase: 'Desarrollo',
                    nombre: 'Nueva situacion de aprendizaje',
                    objetivo: '',
                    ceVinculados: [],
                    metodologia: METODOLOGIAS[0],
                    agrupamiento: 'Gran grupo',
                    desarrollo: '',
                    recursos: 'Pizarra, material de aula.',
                    tiempo: 2,
                  };
                  onUpdateSdAs(ua.id, [...sdas, newSda]);
                }}
                className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                style={{ background: 'none', border: 'none', color: p.mc, padding: '0.25rem 0' }}
              >
                <Plus size={13} /> Anadir SdA
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// MAIN WIZARD COMPONENT
// ============================================

export function ProgramacionWizard({ uf, moduloCodigo, moduloNombre, moduloHoras, certificadoCodigo, certificadoNombre, certificadoDuracion }: ProgramacionWizardProps) {
  const [step, setStep]       = useState<WizardStep>(1);
  const [sdaState, setSdaState] = useState<Record<string, SdADraft[]>>({});

  const handleUpdateSdAs = useCallback((uaId: string, sdas: SdADraft[]) => {
    setSdaState(prev => ({ ...prev, [uaId]: sdas }));
  }, []);

  const [uaDefs, setUaDefs] = useState<UADefinition[]>(() => {
    const mid   = Math.ceil(uf.contenidos.length / 2);
    const tema1 = Array.from({ length: mid }, (_, i) => i);
    const tema2 = Array.from({ length: uf.contenidos.length - mid }, (_, i) => i + mid);
    return [
      { id: 'UA1', titulo: '', horas: Math.round(uf.duracion / 2), temaIndices: tema1 },
      { id: 'UA2', titulo: '', horas: uf.duracion - Math.round(uf.duracion / 2), temaIndices: tema2 },
    ];
  });

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
      return [...prev, { id: 'UA' + nextNum, titulo: '', horas: 10, temaIndices: [] }];
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

  const canAdvance = useMemo(() => {
    if (step === 1) {
      const assigned = uaDefs.reduce((s, ua) => s + ua.temaIndices.length, 0);
      return assigned === uf.contenidos.length && uaDefs.every(ua => ua.temaIndices.length > 0);
    }
    if (step === 2) return uaDefs.every(ua => ua.temaIndices.length > 0);
    return true;
  }, [step, uaDefs, uf.contenidos.length]);

  const validationIssues = useMemo(() => {
    if (step !== 3 || uaDefs.length === 0) return [];
    const ceMap = buildContenidoCEMap(uf);
    const ufForValidation = {
      uas: uaDefs.map(ua => {
        const sdas     = sdaState[ua.id] || [];
        const horasEval = Math.max(2, Math.round(ua.horas * 0.15));
        const horasAuto = Math.max(1, Math.round(ua.horas * 0.1));
        const contenidoBlocks = ua.temaIndices.map(temaIdx => {
          const tema = uf.contenidos[temaIdx];
          return { lineas: (tema?.items || []).map(item => ({ ces: ceMap.get(item.texto) || [] })) };
        });
        const ceIds = new Set<string>();
        contenidoBlocks.forEach(b => b.lineas.forEach(l => l.ces.forEach((id: string) => ceIds.add(id))));
        return {
          uaNumero: parseInt(ua.id.replace('UA', ''), 10) || 1,
          uaHorasTotales: ua.horas,
          uaEvaluacionProcesoHoras: horasEval,
          uaAutonomoHoras: horasAuto,
          sdas,
          contenidoBlocks,
          capacidades: [{ codigo: 'C-auto', conocimientos: [...ceIds].map(id => ({ codigo: id })), destrezas: [], habilidades: [] }],
        };
      }),
    };
    return runValidations(ufForValidation);
  }, [step, uaDefs, sdaState, uf]);

  return (
    <div className="space-y-4">

      {/* UF header card */}
      <div className="oat-card" style={{ padding: '1rem 1.25rem' }}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="oat-badge success">{uf.codigo}</span>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{moduloCodigo} &middot; {uf.duracion}h</span>
        </div>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{uf.denominacion}</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {uf.capacidades.length} capacidades &middot; {uf.capacidades.reduce((s, c) => s + c.criterios.length, 0)} criterios &middot; {uf.contenidos.length} bloques de contenido
        </p>
      </div>

      {/* Step indicator */}
      <div className="oat-card" style={{ padding: '0.875rem 1.25rem' }}>
        <StepIndicator current={step} total={3} />
      </div>

      {/* Step content */}
      <div className="oat-card" style={{ padding: '1.25rem' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {step === 1 && 'Paso 1: Asignar contenidos BOE a Unidades de Aprendizaje'}
            {step === 2 && 'Paso 2: Capacidades y Criterios de Evaluacion (derivados)'}
            {step === 3 && 'Paso 3: Situaciones de Aprendizaje'}
          </h3>
          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
            {step === 1 && 'Regla Minerva: los contenidos determinan la estructura'}
            {step === 2 && 'Auto-derivados del Paso 1 -- solo lectura'}
            {step === 3 && 'Construir desde Col1 x Col2'}
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

            {/* Inline validation summary */}
            <div className="mt-4 rounded-lg p-3 space-y-1.5" style={{ backgroundColor: 'var(--faint)', border: '1px solid var(--border)' }}>
              <h4 className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Validacion pre-export</h4>
              {uaDefs.map(ua => {
                const sdas       = sdaState[ua.id] || [];
                const horasEval  = Math.max(2, Math.round(ua.horas * 0.15));
                const horasAuto  = Math.max(1, Math.round(ua.horas * 0.1));
                const horasTarget = ua.horas - horasEval - horasAuto;
                const horasSdA   = sdas.reduce((s, sda) => s + sda.tiempo, 0);
                const horasOk    = horasSdA === horasTarget;
                const allCEs     = sdas.every(sda => sda.ceVinculados.length > 0);
                const allNamed   = sdas.every(sda => sda.nombre.trim().length > 3);
                const mkColor    = (ok: boolean) => ({ color: ok ? 'var(--success)' : 'var(--warning)' });
                return (
                  <div key={ua.id} className="flex items-center gap-3 text-xs flex-wrap">
                    <code style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)', fontWeight: 600, width: '2rem' }}>{ua.id}</code>
                    <span style={mkColor(horasOk)}>Horas: {horasSdA}/{horasTarget}h</span>
                    <span style={mkColor(allCEs)}>CEs vinculados</span>
                    <span style={mkColor(allNamed)}>Nombres</span>
                    <span style={{ color: 'var(--muted-foreground)' }}>{sdas.length} SdAs</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Health panel -- Step 3 only */}
      {step === 3 && <HealthPanel issues={validationIssues} />}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1) as WizardStep)}
          disabled={step === 1}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          style={{
            background: 'none',
            border: 'none',
            color: step === 1 ? 'var(--muted-foreground)' : 'var(--foreground)',
            cursor: step === 1 ? 'not-allowed' : 'pointer',
            opacity: step === 1 ? 0.4 : 1,
          }}
        >
          Anterior
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(s => Math.min(3, s + 1) as WizardStep)}
            disabled={!canAdvance}
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: 'var(--text-7)',
              fontWeight: 'var(--font-semibold)',
              borderRadius: 'var(--radius-medium)',
              border: 'none',
              cursor: canAdvance ? 'pointer' : 'not-allowed',
              backgroundColor: canAdvance ? 'var(--primary)' : 'var(--muted)',
              color: canAdvance ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              transition: 'background-color var(--transition-fast)',
            }}
          >
            Siguiente
          </button>
        ) : (
          <button
            onClick={() => {
              const exportUAs: UAExport[] = uaDefs.map(ua => {
                const sdas      = sdaState[ua.id] || [];
                const horasEval = Math.max(2, Math.round(ua.horas * 0.15));
                const horasAuto = Math.max(1, Math.round(ua.horas * 0.1));
                const ceMap     = buildContenidoCEMap(uf);
                const ceIds     = new Set<string>();
                ua.temaIndices.forEach(temaIdx => {
                  const tema = uf.contenidos[temaIdx];
                  tema?.items.forEach(item => {
                    (ceMap.get(item.texto) || []).forEach(id => ceIds.add(id));
                  });
                });
                return {
                  id:            ua.id,
                  titulo:        ua.temaIndices.map(i => uf.contenidos[i]?.titulo || '').join('; '),
                  horas:         ua.horas,
                  horasEvaluacion: horasEval,
                  horasAutonomo:  horasAuto,
                  horasSdA:       ua.horas - horasEval - horasAuto,
                  temaIndices:    ua.temaIndices,
                  capacidadIds:   [...ceIds],
                  sdas:           sdas.map(s => ({
                    numero: s.numero, fase: s.fase, nombre: s.nombre, objetivo: s.objetivo,
                    ceVinculados: s.ceVinculados, metodologia: s.metodologia, agrupamiento: s.agrupamiento,
                    desarrollo: s.desarrollo, recursos: s.recursos, tiempo: s.tiempo,
                  })),
                };
              });
              const exportData: AnexoIVExportData = {
                certificado: { codigo: certificadoCodigo, nombre: certificadoNombre, duracion: certificadoDuracion },
                modulo:      { codigo: moduloCodigo, nombre: moduloNombre, horas: moduloHoras },
                uf,
                uas: exportUAs,
              };
              downloadAnexoIVDocx(exportData).catch(err => {
                console.error('Export failed:', err);
                alert('Error al exportar: ' + (err?.message || 'Unknown error'));
              });
            }}
            className="flex items-center gap-2 cursor-pointer"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: 'var(--text-7)',
              fontWeight: 'var(--font-semibold)',
              borderRadius: 'var(--radius-medium)',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              transition: 'background-color var(--transition-fast)',
            }}
          >
            <FileText size={14} /> Generar Anexo IV (.docx)
          </button>
        )}
      </div>

    </div>
  );
}
