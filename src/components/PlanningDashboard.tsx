import { useState, useCallback, useRef, useMemo } from 'react';
import { FileUp, RotateCcw, Plus, Trash2, LayoutGrid, BarChart2, CalendarDays } from 'lucide-react';
import {
  parsePDFForPlanning,
  createEmptyPlanningDataset,
  recalcTotals,
} from '../engine/planningParser';
import type { PlanningDataset, PlanningModule, ModuleTipo } from '../types/planning';

type ViewMode = 'cards' | 'gantt' | 'calendar';

// ============================================================
// MODULE COLOUR PALETTE (hex -- injected as --mc CSS var)
// ============================================================

const PALETTE = [
  { mc: '#059669', text: '#065f46', light: '#ecfdf5' },
  { mc: '#0284c7', text: '#0c4a6e', light: '#e0f2fe' },
  { mc: '#7c3aed', text: '#4c1d95', light: '#ede9fe' },
  { mc: '#d97706', text: '#78350f', light: '#fffbeb' },
  { mc: '#e11d48', text: '#881337', light: '#fff1f2' },
  { mc: '#0891b2', text: '#164e63', light: '#ecfeff' },
];

type PaletteEntry = typeof PALETTE[number];

// ============================================================
// DATE UTILITIES
// ============================================================

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function skipWeekend(date: Date): Date {
  const d = new Date(date);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function fmtISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ============================================================
// ENTRY CALCULATION
// ============================================================

interface ModuleEntry {
  mod: PlanningModule;
  inicio: Date;
  fin: Date;
  semanas: number;
  sesiones: number;
  p: PaletteEntry;
}

function calcEntries(
  modules: PlanningModule[],
  fechaInicio: string,
  horasDia: number,
  diasSemana: number
): ModuleEntry[] {
  const lectivos    = modules.filter(m => !m.excluido);
  const horasSemana = horasDia * diasSemana;
  let cursor        = skipWeekend(new Date(fechaInicio));
  const result: ModuleEntry[] = [];
  lectivos.forEach((mod, idx) => {
    const semanas  = horasSemana > 0 ? Math.ceil(mod.horas / horasSemana) : 1;
    const sesiones = horasDia    > 0 ? Math.ceil(mod.horas / horasDia)    : mod.horas;
    const inicio   = new Date(cursor);
    const fin      = skipWeekend(addDays(inicio, semanas * 7 - 3));
    result.push({ mod, inicio, fin, semanas, sesiones, p: PALETTE[idx % PALETTE.length] });
    cursor = skipWeekend(addDays(fin, 1));
  });
  return result;
}

// ============================================================
// LEGEND
// ============================================================

function ModuleLegend({ entries }: { entries: ModuleEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {entries.map(({ mod, p }) => (
        <div
          key={mod.id}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border text-[11px]"
          style={{ borderColor: p.mc + '40', backgroundColor: p.light, color: p.text }}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.mc }} />
          <span className="font-mono font-bold">{mod.codigo}</span>
          <span className="text-current opacity-70 truncate max-w-[150px]">{mod.titulo}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// STAT TILE
// ============================================================

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="oat-stat">
      <span className={'oat-stat-value ' + (muted ? 'opacity-60' : '')}>{value}</span>
      <span className="oat-stat-label">{label}</span>
    </div>
  );
}

// ============================================================
// CARDS VIEW
// ============================================================

function CardsView({
  entries,
  excluded,
  totalHoras,
}: {
  entries: ModuleEntry[];
  excluded: PlanningModule[];
  totalHoras: number;
}) {
  return (
    <div className="space-y-2.5">
      {entries.map(({ mod, inicio, fin, semanas, sesiones, p }) => {
        const pct = totalHoras > 0 ? Math.round((mod.horas / totalHoras) * 100) : 0;
        return (
          <div
            key={mod.id}
            className="oat-module-card px-4 py-3"
            style={{ '--mc': p.mc } as React.CSSProperties}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-[11px] font-bold" style={{ color: p.mc }}>{mod.codigo}</code>
                  <span className="text-sm font-medium text-gray-800 leading-snug">{mod.titulo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <progress
                    value={pct}
                    max={100}
                    aria-label={pct + '% del total'}
                    style={{ '--progress-color': p.mc } as React.CSSProperties}
                  />
                  <span className="text-[10px] text-gray-400 flex-shrink-0 w-8 text-right">{pct}%</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right space-y-0.5">
                <div className="text-xl font-bold tabular-nums" style={{ color: p.mc }}>
                  {mod.horas}<span className="text-xs font-normal text-gray-400">h</span>
                </div>
                <div className="text-[10px] text-gray-400">{semanas}sem &middot; {sesiones}ses</div>
                <div className="text-xs font-medium text-gray-600 mt-1">{fmtISO(inicio)}</div>
                <div className="text-[10px] text-gray-400">{fmtISO(fin)}</div>
              </div>
            </div>
          </div>
        );
      })}

      {excluded.length > 0 && (
        <div className="pt-1">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="flex-1 border-t" style={{ borderColor: 'var(--border)' }} />
            <span className="oat-badge secondary">Practicas / FCT -- no computan en calendario</span>
            <div className="flex-1 border-t" style={{ borderColor: 'var(--border)' }} />
          </div>
          <div className="space-y-2">
            {excluded.map(mod => (
              <div
                key={mod.id}
                className="oat-card px-4 py-3 opacity-60"
                style={{ borderLeft: '4px solid var(--muted-foreground)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-bold text-gray-500">{mod.codigo}</code>
                      <span className="oat-badge secondary">{mod.tipo}</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium mt-0.5 leading-snug">{mod.titulo}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      En horas totales del certificado -- excluido del calculo de imparticion
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-lg font-bold tabular-nums text-gray-400">
                      {mod.horas}<span className="text-xs font-normal">h</span>
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">empresa / FCT</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// GANTT VIEW
// ============================================================

function GanttView({ entries }: { entries: ModuleEntry[] }) {
  if (entries.length === 0) return null;

  const rangeStart = entries[0].inicio;
  const rangeEnd   = entries[entries.length - 1].fin;
  const totalMs    = Math.max(1, rangeEnd.getTime() - rangeStart.getTime());

  const months: Array<{ label: string; leftPct: number; widthPct: number }> = [];
  let mCur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  while (mCur <= rangeEnd) {
    const mNext    = new Date(mCur.getFullYear(), mCur.getMonth() + 1, 1);
    const mStartMs = Math.max(rangeStart.getTime(), mCur.getTime());
    const mEndMs   = Math.min(rangeEnd.getTime(), mNext.getTime());
    months.push({
      label:    mCur.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }).toUpperCase(),
      leftPct:  ((mStartMs - rangeStart.getTime()) / totalMs) * 100,
      widthPct: ((mEndMs - mStartMs) / totalMs) * 100,
    });
    mCur = mNext;
  }

  function toPct(d: Date): number {
    return Math.max(0, Math.min(100, ((d.getTime() - rangeStart.getTime()) / totalMs) * 100));
  }

  return (
    <div className="oat-card" style={{ padding: 0 }}>
      {/* Month header */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--faint)' }}>
        <div className="flex-shrink-0 border-r" style={{ width: '11rem', borderColor: 'var(--border)' }} />
        <div className="flex-1 relative h-7">
          {months.map((m, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 flex items-center px-2 border-r last:border-0"
              style={{ left: m.leftPct + '%', width: m.widthPct + '%', borderColor: 'var(--border)' }}
            >
              <span className="text-[9px] font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Module rows */}
      <div >
        {entries.map(({ mod, inicio, fin, semanas, p }) => {
          const leftPct  = toPct(inicio);
          const widthPct = Math.max(1, toPct(fin) - leftPct);
          return (
            <div key={mod.id} className="flex items-center min-h-[52px] border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex-shrink-0 px-3 border-r py-2 space-y-0.5" style={{ width: '11rem', borderColor: 'var(--border)' }}>
                <code className="text-[10px] font-bold block" style={{ color: p.mc }}>{mod.codigo}</code>
                <p className="text-[11px] leading-tight line-clamp-2" style={{ color: 'var(--foreground)' }}>{mod.titulo}</p>
                <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{semanas}sem &middot; {mod.horas}h</p>
              </div>
              <div className="flex-1 relative h-8 px-1">
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-r pointer-events-none"
                    style={{ left: (m.leftPct + m.widthPct) + '%', borderColor: 'var(--border)' }}
                  />
                ))}
                <div
                  className="absolute top-1.5 bottom-1.5 rounded-md flex items-center overflow-hidden"
                  style={{ left: leftPct + '%', width: widthPct + '%', backgroundColor: p.mc }}
                >
                  <span className="px-2 text-[10px] text-white font-medium whitespace-nowrap truncate">
                    {fmtShort(inicio)} - {fmtShort(fin)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// CALENDAR VIEW
// ============================================================

function CalendarView({ entries }: { entries: ModuleEntry[] }) {
  if (entries.length === 0) return null;

  const rangeStart = entries[0].inicio;
  const rangeEnd   = entries[entries.length - 1].fin;

  const months: Array<{ year: number; month: number }> = [];
  let mc = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  while (mc <= rangeEnd) {
    months.push({ year: mc.getFullYear(), month: mc.getMonth() });
    mc = new Date(mc.getFullYear(), mc.getMonth() + 1, 1);
  }

  function entryFor(d: Date): ModuleEntry | null {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) return null;
    return entries.find(e => d >= e.inicio && d <= e.fin) ?? null;
  }

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
      {months.map(({ year, month }) => {
        const monthLabel  = new Date(year, month, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDow    = new Date(year, month, 1).getDay();
        const startOffset = firstDow === 0 ? 6 : firstDow - 1;

        const cells: Array<Date | null> = Array(startOffset).fill(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
        while (cells.length % 7 !== 0) cells.push(null);

        const weeks: Array<Array<Date | null>> = [];
        for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

        return (
          <div key={year + '-' + month} className="oat-card" style={{ padding: 0 }}>
            <div className="px-3 py-2 border-b capitalize text-xs font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--faint)' }}>
              {monthLabel}
            </div>
            <div className="p-3">
              <div className="grid grid-cols-7 mb-1">
                {['L','M','X','J','V','S','D'].map(d => (
                  <div key={d} className="text-center text-[9px] font-medium" style={{ color: 'var(--faint-foreground)' }}>{d}</div>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-px">
                  {week.map((day, di) => {
                    if (!day) return <div key={di} className="h-6" />;
                    const entry     = entryFor(day);
                    const isWeekend = di >= 5;
                    return (
                      <div
                        key={di}
                        className="flex items-center justify-center rounded h-6 text-[11px] font-medium"
                        style={entry && !isWeekend
                          ? { backgroundColor: entry.p.light, color: entry.p.text }
                          : { color: isWeekend ? 'var(--faint-foreground)' : 'var(--muted-foreground)' }
                        }
                        title={entry ? entry.mod.codigo + ' -- ' + entry.mod.titulo : ''}
                      >
                        {day.getDate()}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// MODULE TABLE (inside details accordion)
// ============================================================

function ModuleTable({
  modules,
  onUpdate,
  onRemove,
}: {
  modules: PlanningModule[];
  onUpdate: (id: string, patch: Partial<PlanningModule>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <table style={{ fontSize: 'var(--text-8)' }}>
      <thead>
        <tr>
          <th style={{ width: '7rem' }}>Codigo</th>
          <th>Titulo</th>
          <th style={{ width: '4rem', textAlign: 'right' }}>Horas</th>
          <th style={{ width: '5rem' }}>Tipo</th>
          <th style={{ width: '2rem' }} />
        </tr>
      </thead>
      <tbody>
        {modules.map(mod => (
          <tr key={mod.id} style={{ opacity: mod.excluido ? 0.55 : 1 }}>
            <td>
              <input
                value={mod.codigo}
                onChange={e => onUpdate(mod.id, { codigo: e.target.value })}
                style={{ fontFamily: 'var(--font-mono)', width: '100%' }}
              />
            </td>
            <td>
              <input
                value={mod.titulo}
                onChange={e => onUpdate(mod.id, { titulo: e.target.value })}
                style={{ width: '100%' }}
              />
            </td>
            <td>
              <input
                type="number"
                value={mod.horas}
                onChange={e => onUpdate(mod.id, { horas: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', textAlign: 'right', fontFamily: 'var(--font-mono)' }}
              />
            </td>
            <td>
              <select
                value={mod.excluido ? 'MO' : 'MF'}
                onChange={e => {
                  const excluido = e.target.value !== 'MF';
                  const tipo = e.target.value as ModuleTipo;
                  onUpdate(mod.id, { tipo: excluido ? tipo : 'MF', excluido });
                }}
              >
                <option value="MF">MF</option>
                <option value="MO">MO/MP</option>
              </select>
            </td>
            <td style={{ textAlign: 'center' }}>
              <button
                onClick={() => onRemove(mod.id)}
                aria-label="Eliminar modulo"
                style={{ background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer', color: 'var(--muted-foreground)' }}
              >
                <Trash2 size={13} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

let _nextId = 1;
function newId() { return 'manual-' + (_nextId++); }

export function PlanningDashboard() {
  const [fechaInicio, setFechaInicio] = useState('2025-09-15');
  const [horasDia,    setHorasDia]    = useState(5);
  const [diasSemana,  setDiasSemana]  = useState(5);
  const [viewMode,    setViewMode]    = useState<ViewMode>('cards');
  const [dataset,     setDataset]     = useState<PlanningDataset | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [dragActive,  setDragActive]  = useState(false);
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

  const reset = useCallback(() => { setDataset(null); setError(null); }, []);

  const entries = useMemo(() => {
    if (!dataset) return [];
    return calcEntries(dataset.modules, fechaInicio, horasDia, diasSemana);
  }, [dataset, fechaInicio, horasDia, diasSemana]);

  const excluded = useMemo(() => {
    if (!dataset) return [];
    return dataset.modules.filter(m => m.excluido);
  }, [dataset]);

  const summary = useMemo(() => {
    if (!dataset || entries.length === 0) return null;
    const totalSemanas = entries.reduce((s, e) => s + e.semanas, 0);
    const fechaFin     = entries[entries.length - 1].fin;
    return {
      nModulos:            entries.length,
      nExcluidos:          excluded.length,
      totalHoras:          dataset.totalHorasLectivas,
      totalHorasPracticas: dataset.totalHorasPracticas,
      totalSemanas,
      fechaFin,
    };
  }, [dataset, entries, excluded]);

  // ---- UPLOAD STATE ----

  if (!dataset) {
    return (
      <div className="space-y-3 max-w-xl mx-auto">
        <div className="oat-card" style={{ padding: 0 }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Planificacion temporal de imparticion
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Sube una ficha SEPE, certificado o anexo en PDF. Los modulos de practicas
              (MO/MP/FCT) se detectan y excluyen del calculo de fechas de imparticion.
            </p>
          </div>

          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Subir PDF"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            className="mx-5 my-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-12 cursor-pointer transition-colors"
            style={{
              borderColor: dragActive ? 'var(--primary)' : isLoading ? 'var(--warning)' : 'var(--border)',
              backgroundColor: dragActive ? 'color-mix(in srgb, var(--primary) 5%, transparent)' : isLoading ? 'color-mix(in srgb, var(--warning) 5%, transparent)' : 'transparent',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {isLoading ? (
              <>
                <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--warning)', borderTopColor: 'transparent' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--warning)' }}>Extrayendo modulos del PDF...</p>
              </>
            ) : (
              <>
                <FileUp size={32} style={{ color: dragActive ? 'var(--primary)' : 'var(--muted-foreground)' }} />
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Arrastra aqui o pulsa para seleccionar
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Ficha SEPE &middot; Certificado completo &middot; Anexo del certificado
                  </p>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="mx-5 mb-4 px-3 py-2 rounded-lg text-xs border" style={{ backgroundColor: 'color-mix(in srgb, var(--danger) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div className="px-5 pb-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t" style={{ borderColor: 'var(--border)' }} />
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>o introduce manualmente</span>
              <div className="flex-1 border-t" style={{ borderColor: 'var(--border)' }} />
            </div>
            <button
              onClick={startManual}
              className="w-full flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent' }}
            >
              <Plus size={14} />
              Anadir modulos manualmente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- ACTIVE STATE ----

  return (
    <div className="space-y-3">

      {/* Config + summary card */}
      <div className="oat-card" style={{ padding: 0 }}>

        {/* Config bar */}
        <div className="px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)', fontWeight: 'var(--font-medium)' }}>
            Inicio
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-8)', marginBlockStart: 0 }}
            />
          </label>
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)', fontWeight: 'var(--font-medium)' }}>
            h/dia
            <input
              type="number" min={1} max={10} value={horasDia}
              onChange={e => setHorasDia(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: '3.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-8)', marginBlockStart: 0 }}
            />
          </label>
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)', fontWeight: 'var(--font-medium)' }}>
            dias/sem
            <input
              type="number" min={1} max={6} value={diasSemana}
              onChange={e => setDiasSemana(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: '3.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-8)', marginBlockStart: 0 }}
            />
          </label>
          <div className="ml-auto flex items-center gap-3">
            {dataset.codigoCertificado && (
              <code className="oat-badge secondary" style={{ fontFamily: 'var(--font-mono)' }}>
                {dataset.codigoCertificado}
              </code>
            )}
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs cursor-pointer"
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--muted-foreground)' }}
            >
              <RotateCcw size={12} />
              Cambiar PDF
            </button>
          </div>
        </div>

        {/* Stats strip */}
        {summary && (
          <div className="px-4 py-2.5 flex flex-wrap gap-x-6 gap-y-1" style={{ backgroundColor: 'var(--faint)' }}>
            <Stat label="MF lectivos"  value={String(summary.nModulos)} />
            <Stat label="h lectivas"   value={summary.totalHoras + 'h'} />
            {summary.nExcluidos > 0 && (
              <Stat label="h MO/MP"    value={summary.totalHorasPracticas + 'h'} muted />
            )}
            <Stat label="semanas"      value={String(summary.totalSemanas)} />
            <Stat label="h/semana"     value={(horasDia * diasSemana) + 'h'} muted />
            <Stat label="inicio"       value={fmtISO(new Date(fechaInicio))} />
            <Stat label="fin est."     value={fmtISO(summary.fechaFin)} />
          </div>
        )}
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-3 flex-wrap">
        <div role="tablist" className="oat-tabs">
          {([
            { id: 'cards',    label: 'Tarjetas', icon: LayoutGrid  },
            { id: 'gantt',    label: 'Gantt',    icon: BarChart2   },
            { id: 'calendar', label: 'Calendario', icon: CalendarDays },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={viewMode === id}
              onClick={() => setViewMode(id)}
              className="flex items-center gap-1.5"
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Views */}
      {viewMode === 'cards' && (
        <CardsView entries={entries} excluded={excluded} totalHoras={summary?.totalHoras ?? 0} />
      )}
      {viewMode === 'gantt'    && <GanttView entries={entries} />}
      {viewMode === 'calendar' && <CalendarView entries={entries} />}

      {(viewMode === 'gantt' || viewMode === 'calendar') && (
        <ModuleLegend entries={entries} />
      )}

      {/* Module extraction disclosure */}
      {dataset.source !== 'manual' && (
        <details className="accordion">
          <summary style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-8)' }}>
            Ver modulos extraidos del PDF ({dataset.modules.length})
          </summary>
          <ModuleTable modules={dataset.modules} onUpdate={updateModule} onRemove={removeModule} />
        </details>
      )}

      {/* Manual flow: add module */}
      {dataset.source === 'manual' && (
        <div className="space-y-2">
          <ModuleTable modules={dataset.modules} onUpdate={updateModule} onRemove={removeModule} />
          <button
            onClick={addModule}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-xs font-medium cursor-pointer transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'none' }}
          >
            <Plus size={14} />
            Anadir modulo
          </button>
        </div>
      )}

    </div>
  );
}
