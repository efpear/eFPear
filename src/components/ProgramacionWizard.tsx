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

import { useState, useMemo, useCallback } from 'react';
import type { BoeUFData, BoeCapacidad, BoeContenido } from '../types/boe';

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
}

// ============================================
// CE CLASSIFICATION (deterministic, verb-based)
// ============================================

type TipologiaCE = 'conocimiento' | 'destreza' | 'habilidad';

const CONOCIMIENTO_VERBS = ['describir', 'identificar', 'diferenciar', 'clasificar', 'definir', 'enumerar', 'reconocer', 'indicar', 'señalar', 'distinguir', 'relacionar', 'explicar', 'interpretar', 'citar'];
const DESTREZA_VERBS = ['calcular', 'elaborar', 'comparar', 'determinar', 'aplicar', 'resolver', 'confeccionar', 'redactar', 'diseñar', 'realizar', 'evaluar', 'analizar', 'proponer', 'formular', 'plantear', 'estimar', 'seleccionar', 'utilizar', 'ejecutar', 'cumplimentar', 'comprobar', 'verificar'];
const HABILIDAD_VERBS = ['justificar', 'argumentar', 'valorar', 'participar', 'colaborar', 'comunicar', 'demostrar', 'asumir', 'respetar', 'mantener', 'mostrar'];

function clasificarCE(texto: string): TipologiaCE {
  const t = texto.trim();
  // Pattern overrides
  if (/^en supuestos?\s+prácticos?/i.test(t)) return 'destreza';
  if (/^en casos?\s+prácticos?/i.test(t)) return 'destreza';
  if (/^en situaciones\s+prácticas/i.test(t)) return 'destreza';
  if (/^en diversas\s+situaciones/i.test(t)) return 'destreza';
  if (/^a partir de/i.test(t)) return 'destreza';
  // First verb
  const match = t.match(/^(\w+)/i);
  const verb = match?.[1]?.toLowerCase() ?? '';
  if (DESTREZA_VERBS.includes(verb)) return 'destreza';
  if (HABILIDAD_VERBS.includes(verb)) return 'habilidad';
  if (CONOCIMIENTO_VERBS.includes(verb)) return 'conocimiento';
  return 'conocimiento';
}

const TIPOLOGIA_COLORS: Record<TipologiaCE, { bg: string; text: string; label: string }> = {
  conocimiento: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Conocimiento' },
  destreza: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Destreza' },
  habilidad: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Habilidad' },
};

// ============================================
// CONTENT-TO-CE MAPPING (from golden sample)
// ============================================

/**
 * Build a map from contenido text → CE IDs.
 * For now, uses a heuristic: match CE codes mentioned in contenido items,
 * or fall back to matching by capacidad theme number.
 */
function buildContenidoCEMap(uf: BoeUFData): Map<string, string[]> {
  // For the golden case, we need to use the known mapping.
  // In production, this would come from a parsed BOE structure.
  // For now, we assign CEs to contenidos by matching tema number to capacidad number.
  const map = new Map<string, string[]>();

  uf.contenidos.forEach((tema, temaIdx) => {
    // Find capacidad(es) that correspond to this theme
    // Heuristic: tema index maps roughly to capacidad index
    const cap = uf.capacidades[temaIdx];
    const ceIds = cap ? cap.criterios.map(ce => ce.codigo) : [];

    tema.items.forEach(item => {
      map.set(item.texto, ceIds);
    });
  });

  return map;
}

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

function Step3SdAs({
  uf,
  uaDefs,
}: {
  uf: BoeUFData;
  uaDefs: UADefinition[];
}) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <p className="text-sm font-semibold text-amber-800">🚧 En construcción — Slice 3 Step 3</p>
        <p className="text-xs text-amber-700 mt-1">
          El constructor de Situaciones de Aprendizaje se activará en la próxima iteración.
          Los pasos 1 y 2 ya son funcionales: asigna temas a UAs y verifica los criterios derivados.
        </p>
      </div>

      {uaDefs.map((ua, i) => {
        const color = UA_COLORS[i % UA_COLORS.length];
        return (
          <div key={ua.id} className={`border rounded-lg ${color.border} ${color.bg} px-4 py-3`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${color.text}`}>{ua.id}</span>
              <span className="text-xs text-slate-500">{ua.horas}h — SdAs pendientes</span>
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

export function ProgramacionWizard({ uf, moduloCodigo, moduloNombre }: ProgramacionWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [uaDefs, setUaDefs] = useState<UADefinition[]>(() => [
    { id: 'UA1', titulo: '', horas: Math.round(uf.duracion / 2), temaIndices: [] },
    { id: 'UA2', titulo: '', horas: uf.duracion - Math.round(uf.duracion / 2), temaIndices: [] },
  ]);

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
    const nextNum = uaDefs.length + 1;
    setUaDefs(prev => [...prev, {
      id: `UA${nextNum}`,
      titulo: '',
      horas: 10,
      temaIndices: [],
    }]);
  }, [uaDefs.length]);

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
      const assigned = uaDefs.reduce((s, ua) => s + ua.temaIndices.length, 0);
      return assigned === uf.contenidos.length && uaDefs.every(ua => ua.temaIndices.length > 0);
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
        {step === 3 && <Step3SdAs uf={uf} uaDefs={uaDefs} />}
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
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-sm">
              Generar Anexo IV
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
