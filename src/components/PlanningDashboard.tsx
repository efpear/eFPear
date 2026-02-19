import { useState, useCallback, useRef } from 'react';
import {
  parsePDFForPlanning,
  createEmptyPlanningDataset,
  recalcTotals,
} from '../engine/planningParser';
import type {
  PlanningDataset,
  PlanningModule,
  ModuleTipo,
} from '../types/planning';

// ============================================================
// ImparticionDashboard -- primary output, live-rendered
// ============================================================

interface ImparticionDashboardProps {
  dataset: PlanningDataset;
  fechaInicio: string;
  horasDia: number;
  diasSemana: number;
  onReset: () => void;
  onAddModule?: () => void;
  onUpdateModule?: (id: string, patch: Partial<PlanningModule>) => void;
  onRemoveModule?: (id: string) => void;
  isManual: boolean;
}

function addBusinessDays(date: Date, calendarDays: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + calendarDays);
  return d;
}

function skipWeekend(date: Date): Date {
  const d = new Date(date);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

function fmt(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function ImparticionDashboard({
  dataset, fechaInicio, horasDia, diasSemana, onReset, onAddModule, onUpdateModule, onRemoveModule, isManual
}: ImparticionDashboardProps) {
  const lectivos = dataset.modules.filter(m => !m.excluido);
  const excluidos = dataset.modules.filter(m => m.excluido);
  const horasSemanales = horasDia * diasSemana;
  const [showModules, setShowModules] = useState(false);

  let cursor = skipWeekend(new Date(fechaInicio));
  const entries: Array<{ mod: PlanningModule; inicio: Date; fin: Date; semanas: number }> = [];

  for (const mod of lectivos) {
    const semanas = horasSemanales > 0 ? Math.ceil(mod.horas / horasSemanales) : 0;
    const inicio = new Date(cursor);
    const fin = addBusinessDays(inicio, semanas * 7 - 1);
    entries.push({ mod, inicio, fin, semanas });
    cursor = addBusinessDays(fin, 1);
  }

  const fechaFin = entries.length > 0 ? entries[entries.length - 1].fin : new Date(fechaInicio);
  const totalSemanas = entries.reduce((s, e) => s + e.semanas, 0);

  // Colour palette for modules
  const COLOURS = [
    { bg: 'bg-green-100', text: 'text-green-800', bar: 'bg-green-500', border: 'border-green-200' },
    { bg: 'bg-blue-100', text: 'text-blue-800', bar: 'bg-blue-500', border: 'border-blue-200' },
    { bg: 'bg-violet-100', text: 'text-violet-800', bar: 'bg-violet-500', border: 'border-violet-200' },
    { bg: 'bg-amber-100', text: 'text-amber-800', bar: 'bg-amber-500', border: 'border-amber-200' },
    { bg: 'bg-rose-100', text: 'text-rose-800', bar: 'bg-rose-500', border: 'border-rose-200' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800', bar: 'bg-cyan-500', border: 'border-cyan-200' },
  ];

  return (
    <div className="space-y-4">
      {/* Config bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Inicio:</span>
            <input
              type="date" value={fechaInicio}
              onChange={e => { /* handled by parent state */ }}
              data-field="fechaInicio"
              className="text-xs border border-slate-200 rounded px-2 py-1 font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Horas/dia:</span>
            <input type="number" min={1} max={10} value={horasDia}
              data-field="horasDia"
              onChange={() => {}}
              className="w-12 text-xs border border-slate-200 rounded px-2 py-1 text-center font-mono" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Dias/sem:</span>
            <input type="number" min={1} max={6} value={diasSemana}
              data-field="diasSemana"
              onChange={() => {}}
              className="w-12 text-xs border border-slate-200 rounded px-2 py-1 text-center font-mono" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            {dataset.codigoCertificado && (
              <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {dataset.codigoCertificado}
              </span>
            )}
            <button onClick={onReset} className="text-xs text-slate-400 hover:text-slate-600 underline">
              Cambiar PDF
            </button>
          </div>
        </div>
        {/* Summary strip */}
        <div className="border-t border-slate-100 px-4 py-2 flex flex-wrap gap-6 bg-slate-50 rounded-b-xl">
          <div className="text-center">
            <div className="text-sm font-bold text-slate-800">{lectivos.length}</div>
            <div className="text-[10px] text-slate-500">modulos</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-green-700">{dataset.totalHorasLectivas}h</div>
            <div className="text-[10px] text-slate-500">lectivas</div>
          </div>
          {excluidos.length > 0 && (
            <div className="text-center">
              <div className="text-sm font-bold text-orange-600">{dataset.totalHorasPracticas}h</div>
              <div className="text-[10px] text-slate-500">practicas</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-sm font-bold text-slate-700">{totalSemanas}</div>
            <div className="text-[10px] text-slate-500">semanas</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-slate-800">{fmt(new Date(fechaInicio))}</div>
            <div className="text-[10px] text-slate-500">inicio</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-slate-800">{fmt(fechaFin)}</div>
            <div className="text-[10px] text-slate-500">fin estimado</div>
          </div>
          {horasSemanales > 0 && (
            <div className="text-center">
              <div className="text-sm font-bold text-slate-600">{horasSemanales}h/sem</div>
              <div className="text-[10px] text-slate-500">{horasDia}h x {diasSemana}d</div>
            </div>
          )}
        </div>
      </div>

      {/* Module timeline cards */}
      <div className="space-y-2">
        {entries.map(({ mod, inicio, fin, semanas }, i) => {
          const c = COLOURS[i % COLOURS.length];
          return (
            <div key={mod.id} className={'rounded-xl border ' + c.border + ' bg-white overflow-hidden'}>
              <div className={'px-4 py-3 flex items-center gap-4 ' + c.bg}>
                <div className={'w-2 h-10 rounded-full flex-shrink-0 ' + c.bar} />
                <div className="flex-1 min-w-0">
                  <div className={'text-sm font-bold ' + c.text}>{mod.codigo}</div>
                  <div className="text-xs text-slate-600 truncate mt-0.5">{mod.titulo}</div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0 text-right">
                  <div>
                    <div className={'text-lg font-bold ' + c.text}>{mod.horas}h</div>
                    <div className="text-[10px] text-slate-500">{semanas} sem</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-700">{fmtISO(inicio)}</div>
                    <div className="text-[10px] text-slate-400">al {fmtISO(fin)}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {excluidos.map(mod => (
          <div key={mod.id} className="rounded-xl border border-orange-200 bg-orange-50/40 px-4 py-3 flex items-center gap-4">
            <div className="w-2 h-8 rounded-full bg-orange-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-orange-700">{mod.codigo}</div>
              <div className="text-xs text-orange-600 truncate">{mod.titulo}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-bold text-orange-600">{mod.horas}h</div>
              <div className="text-[10px] text-orange-400">practicas -- sin fecha</div>
            </div>
          </div>
        ))}

        {/* Manual: add module */}
        {isManual && onAddModule && (
          <button onClick={onAddModule}
            className="w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-xs text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-colors">
            + Anadir modulo
          </button>
        )}
      </div>

      {/* Collapsible: inspect/edit extracted modules (PDF path) */}
      {!isManual && (
        <details open={showModules} onToggle={e => setShowModules((e.target as HTMLDetailsElement).open)}>
          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 py-1">
            {showModules ? 'Ocultar' : 'Ver'} modulos extraidos del PDF
          </summary>
          <div className="mt-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[11px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                  <th className="px-3 py-2 text-left">Codigo</th>
                  <th className="px-3 py-2 text-left">Titulo</th>
                  <th className="px-3 py-2 text-right">Horas</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {dataset.modules.map(mod => (
                  <tr key={mod.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-3 py-2">
                      <input className="w-24 font-mono border border-slate-200 rounded px-1.5 py-0.5"
                        value={mod.codigo}
                        onChange={e => onUpdateModule && onUpdateModule(mod.id, { codigo: e.target.value })} />
                    </td>
                    <td className="px-3 py-2">
                      <input className="w-full border border-slate-200 rounded px-1.5 py-0.5"
                        value={mod.titulo}
                        onChange={e => onUpdateModule && onUpdateModule(mod.id, { titulo: e.target.value })} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" className="w-14 text-right border border-slate-200 rounded px-1.5 py-0.5"
                        value={mod.horas}
                        onChange={e => onUpdateModule && onUpdateModule(mod.id, { horas: parseInt(e.target.value) || 0 })} />
                    </td>
                    <td className="px-3 py-2">
                      <select className="border border-slate-200 rounded px-1.5 py-0.5" value={mod.tipo}
                        onChange={e => {
                          const tipo = e.target.value as ModuleTipo;
                          onUpdateModule && onUpdateModule(mod.id, { tipo, excluido: tipo === 'MO' || tipo === 'MP' });
                        }}>
                        <option value="MF">MF</option>
                        <option value="MO">MO/MP</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

let _nextId = 1;
function newId() { return 'manual-' + (_nextId++); }

export function PlanningDashboard() {
  const [fechaInicio, setFechaInicio] = useState('2025-09-15');
  const [dataset, setDataset] = useState<PlanningDataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [horasDia, setHorasDia] = useState(5);
  const [diasSemana, setDiasSemana] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') { setError('Solo se aceptan archivos PDF'); return; }
    setIsLoading(true); setError(null);
    try {
      const parsed = await parsePDFForPlanning(file);
      setDataset(parsed);
    } catch (err: unknown) {
      setError('Error al procesar el PDF: ' + (err instanceof Error ? err.message : 'desconocido'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const startManual = useCallback(() => {
    setDataset(createEmptyPlanningDataset());
    setError(null);
  }, []);

  const addModule = useCallback(() => {
    setDataset(prev => {
      if (!prev) return prev;
      const mod: PlanningModule = { id: newId(), codigo: 'MF0000_0', titulo: 'Nuevo modulo', horas: 60, tipo: 'MF', excluido: false };
      return recalcTotals({ ...prev, modules: [...prev.modules, mod] });
    });
  }, []);

  const updateModule = useCallback((id: string, patch: Partial<PlanningModule>) => {
    setDataset(prev => {
      if (!prev) return prev;
      return recalcTotals({ ...prev, modules: prev.modules.map(m => m.id === id ? { ...m, ...patch } : m) });
    });
  }, []);

  const removeModule = useCallback((id: string) => {
    setDataset(prev => {
      if (!prev) return prev;
      return recalcTotals({ ...prev, modules: prev.modules.filter(m => m.id !== id) });
    });
  }, []);

  const reset = useCallback(() => {
    setDataset(null); setError(null);
  }, []);

  // Config change handlers -- live recalculation
  const handleConfigChange = (field: string, value: string | number) => {
    if (field === 'fechaInicio') setFechaInicio(value as string);
    if (field === 'horasDia') setHorasDia(Number(value));
    if (field === 'diasSemana') setDiasSemana(Number(value));
  };

  // ---- ENTRY PANEL ----
  if (!dataset) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Planificacion de fechas de imparticion</h3>
          <p className="text-xs text-slate-500 mt-1">
            Sube una ficha SEPE, certificado o anexo en PDF para generar el calendario automaticamente.
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onClick={() => fileInputRef.current?.click()}
          className={'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ' +
            (dragActive ? 'border-green-500 bg-green-50' :
             isLoading ? 'border-amber-300 bg-amber-50' :
             'border-slate-300 hover:border-green-400 hover:bg-green-50/50')}
        >
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          {isLoading ? (
            <div className="space-y-2">
              <div className="text-2xl animate-pulse">&#9203;</div>
              <p className="text-sm text-amber-700">Extrayendo modulos del PDF...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl">&#128196;</div>
              <p className="text-sm font-medium text-slate-700">
                Arrastra aqui tu ficha, certificado o anexo PDF
              </p>
              <p className="text-xs text-slate-400">Ficha SEPE - Certificado completo - Anexo del certificado</p>
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-slate-200" />
          <span className="text-xs text-slate-400">o</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        <button onClick={startManual}
          className="w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors">
          Introducir modulos manualmente
        </button>
      </div>
    );
  }

  // ---- DASHBOARD (live) ----
  return (
    <div onClick={e => {
      const t = e.target as HTMLInputElement;
      const field = t.dataset.field;
      if (field) {
        const v = t.type === 'number' ? parseInt(t.value) || 0 : t.value;
        handleConfigChange(field, v);
      }
    }} onChange={e => {
      const t = e.target as HTMLInputElement;
      const field = t.dataset.field;
      if (field) {
        const v = t.type === 'number' ? parseInt(t.value) || 0 : t.value;
        handleConfigChange(field, v);
      }
    }}>
      <ImparticionDashboard
        dataset={dataset}
        fechaInicio={fechaInicio}
        horasDia={horasDia}
        diasSemana={diasSemana}
        onReset={reset}
        onAddModule={addModule}
        onUpdateModule={updateModule}
        onRemoveModule={removeModule}
        isManual={dataset.source === 'manual'}
      />
    </div>
  );
}
