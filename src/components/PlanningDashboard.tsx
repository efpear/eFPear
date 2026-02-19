import { useState, useCallback, useRef, useMemo } from 'react';
import {
  parsePDFForPlanning,
  createEmptyPlanningDataset,
  recalcTotals,
} from '../engine/planningParser';
import type { PlanningDataset, PlanningModule, ModuleTipo } from '../types/planning';

type ViewMode = 'cards' | 'gantt' | 'calendar';

interface ColorSet {
  bg: string;
  text: string;
  bar: string;
  border: string;
}

const COLOURS: ColorSet[] = [
  { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500', border: 'border-emerald-200' },
  { bg: 'bg-blue-50',    text: 'text-blue-700',    bar: 'bg-blue-500',    border: 'border-blue-200'    },
  { bg: 'bg-violet-50',  text: 'text-violet-700',  bar: 'bg-violet-500',  border: 'border-violet-200'  },
  { bg: 'bg-amber-50',   text: 'text-amber-700',   bar: 'bg-amber-500',   border: 'border-amber-200'   },
  { bg: 'bg-rose-50',    text: 'text-rose-700',    bar: 'bg-rose-500',    border: 'border-rose-200'    },
  { bg: 'bg-cyan-50',    text: 'text-cyan-700',    bar: 'bg-cyan-500',    border: 'border-cyan-200'    },
];

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

interface ModuleEntry {
  mod: PlanningModule;
  inicio: Date;
  fin: Date;
  semanas: number;
  sesiones: number;
  c: ColorSet;
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
    const sesiones = horasDia > 0 ? Math.ceil(mod.horas / horasDia) : mod.horas;
    const inicio   = new Date(cursor);
    const fin      = skipWeekend(addDays(inicio, semanas * 7 - 3));
    result.push({ mod, inicio, fin, semanas, sesiones, c: COLOURS[idx % COLOURS.length] });
    cursor = skipWeekend(addDays(fin, 1));
  });
  return result;
}

// -- Stat pill --
function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="text-center">
      <div className={'text-sm font-bold tabular-nums ' + (muted ? 'text-slate-500' : 'text-slate-800')}>{value}</div>
      <div className="text-[10px] text-slate-400">{label}</div>
    </div>
  );
}

// -- Module legend: pills with code + name --
function ModuleLegend({ entries }: { entries: ModuleEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(({ mod, c }) => (
        <div
          key={mod.id}
          className={'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ' + c.bg + ' ' + c.text}
          title={mod.titulo}
        >
          <div className={'w-1.5 h-1.5 rounded-full flex-shrink-0 ' + c.bar} />
          <span className="font-mono">{mod.codigo}</span>
          <span className="text-[10px] opacity-70 max-w-[120px] truncate">&nbsp;{mod.titulo}</span>
        </div>
      ))}
    </div>
  );
}

// -- Practicos info: excluded modules listed with explanation --
function PracticosInfo({ modules }: { modules: PlanningModule[] }) {
  const excluidos = modules.filter(m => m.excluido);
  if (excluidos.length === 0) return null;
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-600">Modulos de practicas (MO/MP)</span>
        <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
          Cuentan en el total de horas, no en el calendario de imparticion
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {excluidos.map(mod => (
          <div key={mod.id} className="flex items-center gap-3 px-4 py-2">
            <span className="text-[11px] font-mono font-bold text-slate-500 flex-shrink-0">{mod.codigo}</span>
            <span className="text-xs text-slate-600 flex-1 min-w-0 truncate">{mod.titulo}</span>
            <span className="text-xs font-bold text-slate-500 tabular-nums flex-shrink-0">{mod.horas}h</span>
            <span className="text-[10px] text-slate-400 bg-slate-200 rounded px-1.5 py-0.5 flex-shrink-0">{mod.tipo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// CARDS VIEW
// ============================================================
function CardsView({ entries, totalHoras }: { entries: ModuleEntry[]; totalHoras: number }) {
  return (
    <div className="space-y-2">
      {entries.map(({ mod, inicio, fin, semanas, sesiones, c }) => {
        const pct = totalHoras > 0 ? Math.round((mod.horas / totalHoras) * 100) : 0;
        return (
          <div key={mod.id} className={'rounded-xl border ' + c.border + ' bg-white'}>
            <div className="px-4 py-3 flex items-start gap-4">
              <div className={'w-1 self-stretch rounded-full flex-shrink-0 ' + c.bar} />
              <div className="flex-1 min-w-0">
                <div className={'text-[11px] font-mono font-bold tracking-wide ' + c.text}>{mod.codigo}</div>
                <div
                  className="text-sm text-slate-800 font-medium leading-snug mt-0.5"
                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}
                >
                  {mod.titulo}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className={'h-1 rounded-full ' + c.bar} style={{ width: pct + '%' }} />
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">{pct}%</span>
                </div>
              </div>
              <div className="flex items-start gap-5 flex-shrink-0 text-right">
                <div>
                  <div className={'text-2xl font-bold tabular-nums ' + c.text}>
                    {mod.horas}<span className="text-sm font-normal">h</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{semanas}sem &middot; {sesiones}ses</div>
                </div>
                <div className="pt-0.5">
                  <div className="text-xs font-semibold text-slate-700">{fmtISO(inicio)}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{fmtISO(fin)}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
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
    const mEndMs   = Math.min(rangeEnd.getTime(),   mNext.getTime());
    months.push({
      label:    mCur.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }).toUpperCase(),
      leftPct:  ((mStartMs - rangeStart.getTime()) / totalMs) * 100,
      widthPct: ((mEndMs   - mStartMs)             / totalMs) * 100,
    });
    mCur = mNext;
  }

  function toPct(d: Date): number {
    return Math.max(0, Math.min(100, ((d.getTime() - rangeStart.getTime()) / totalMs) * 100));
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex border-b border-slate-100 bg-slate-50">
        <div className="w-44 flex-shrink-0 border-r border-slate-100" />
        <div className="flex-1 relative h-7">
          {months.map((m, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 flex items-center px-2 border-r border-slate-200 last:border-0"
              style={{ left: m.leftPct + '%', width: m.widthPct + '%' }}
            >
              <span className="text-[9px] font-semibold text-slate-400 tracking-wider whitespace-nowrap">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-50">
        {entries.map(({ mod, inicio, fin, semanas, c }) => {
          const leftPct  = toPct(inicio);
          const widthPct = Math.max(1, toPct(fin) - leftPct);
          return (
            <div key={mod.id} className="flex items-center min-h-[56px]">
              <div className="w-44 flex-shrink-0 px-3 border-r border-slate-100 py-2">
                <div className={'text-[10px] font-mono font-bold ' + c.text}>{mod.codigo}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate" title={mod.titulo}>{mod.titulo}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{semanas}sem &middot; {mod.horas}h</div>
              </div>
              <div className="flex-1 relative h-8 px-1">
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-r border-slate-100 pointer-events-none"
                    style={{ left: (m.leftPct + m.widthPct) + '%' }}
                  />
                ))}
                <div
                  className={'absolute top-1 bottom-1 rounded-lg flex items-center overflow-hidden ' + c.bar}
                  style={{ left: leftPct + '%', width: widthPct + '%' }}
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
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {months.map(({ year, month }) => {
        const monthLabel  = new Date(year, month, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        const firstDay    = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDow    = firstDay.getDay();
        const startOffset = firstDow === 0 ? 6 : firstDow - 1;

        const cells: Array<Date | null> = Array(startOffset).fill(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
        while (cells.length % 7 !== 0) cells.push(null);

        const weeks: Array<Array<Date | null>> = [];
        for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

        return (
          <div key={year + '-' + month} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
              <span className="text-xs font-semibold text-slate-700 capitalize">{monthLabel}</span>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-7 mb-1">
                {['L','M','X','J','V','S','D'].map(d => (
                  <div key={d} className="text-center text-[9px] font-medium text-slate-300">{d}</div>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-px">
                  {week.map((day, di) => {
                    if (!day) return <div key={di} className="h-6" />;
                    const entry     = entryFor(day);
                    const isInRange = day >= rangeStart && day <= rangeEnd;
                    const isWeekend = di >= 5;
                    return (
                      <div
                        key={di}
                        className={'flex items-center justify-center rounded h-6 text-[11px] ' + (
                          isWeekend
                            ? 'text-slate-200'
                            : entry && isInRange
                              ? entry.c.bg + ' ' + entry.c.text + ' font-semibold'
                              : 'text-slate-400'
                        )}
                        title={entry ? entry.mod.codigo + ' - ' + entry.mod.titulo : ''}
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
  const [showModules, setShowModules] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Solo se aceptan archivos PDF');
      return;
    }
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

  const summary = useMemo(() => {
    if (!dataset || entries.length === 0) return null;
    const excluidos    = dataset.modules.filter(m => m.excluido);
    const totalSemanas = entries.reduce((s, e) => s + e.semanas, 0);
    const fechaFin     = entries[entries.length - 1].fin;
    return {
      nModulos:            dataset.modules.filter(m => !m.excluido).length,
      nExcluidos:          excluidos.length,
      totalHorasLectivas:  dataset.totalHorasLectivas,
      totalHorasPracticas: dataset.totalHorasPracticas,
      totalSemanas,
      fechaFin,
    };
  }, [dataset, entries]);

  if (!dataset) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Planificacion temporal de imparticion</h3>
          <p className="text-xs text-slate-500 mt-1">
            Sube una ficha SEPE, certificado o anexo en PDF para generar el calendario automaticamente.
          </p>
        </div>
        <label
          htmlFor="planning-file-input"
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          className={'block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ' + (
            dragActive  ? 'border-green-500 bg-green-50' :
            isLoading   ? 'border-amber-300 bg-amber-50' :
            'border-slate-300 hover:border-green-400 hover:bg-slate-50'
          )}
        >
          <input
            id="planning-file-input"
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {isLoading ? (
            <div className="space-y-2">
              <div className="text-2xl">&#9203;</div>
              <p className="text-sm text-amber-700">Extrayendo modulos del PDF...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl">&#128196;</div>
              <p className="text-sm font-medium text-slate-700">Arrastra tu ficha, certificado o anexo PDF</p>
              <p className="text-xs text-slate-400">Ficha SEPE &middot; Certificado completo &middot; Anexo del certificado</p>
            </div>
          )}
        </label>
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-slate-200" />
          <span className="text-xs text-slate-400">o</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>
        <button
          onClick={startManual}
          className="w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Introducir modulos manualmente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Inicio</span>
            <input
              type="date" value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 font-mono bg-slate-50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">h/dia</span>
            <input
              type="number" min={1} max={10} value={horasDia}
              onChange={e => setHorasDia(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 text-xs border border-slate-200 rounded-lg px-2 py-1 text-center font-mono bg-slate-50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">dias/sem</span>
            <input
              type="number" min={1} max={6} value={diasSemana}
              onChange={e => setDiasSemana(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 text-xs border border-slate-200 rounded-lg px-2 py-1 text-center font-mono bg-slate-50"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            {dataset.codigoCertificado && (
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {dataset.codigoCertificado}
              </span>
            )}
            <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 underline">
              Cambiar PDF
            </button>
          </div>
        </div>
        {summary && (
          <div className="border-t border-slate-100 px-4 py-2 flex flex-wrap gap-6 bg-slate-50">
            <Stat label="modulos"   value={String(summary.nModulos)} />
            <Stat label="lectivas"  value={summary.totalHorasLectivas + 'h'} />
            {summary.nExcluidos > 0 && (
              <Stat label={'MO/MP (' + summary.nExcluidos + ')'} value={summary.totalHorasPracticas + 'h'} muted />
            )}
            <Stat label="semanas"   value={String(summary.totalSemanas)} />
            <Stat label="inicio"    value={fmtISO(new Date(fechaInicio))} />
            <Stat label="fin est."  value={fmtISO(summary.fechaFin)} />
            <Stat label="h/sem"     value={(horasDia * diasSemana) + 'h'} muted />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(['cards', 'gantt', 'calendar'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={'px-3 py-1.5 text-xs font-medium rounded-md transition-all ' + (
              viewMode === mode
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {mode === 'cards' ? 'Tarjetas' : mode === 'gantt' ? 'Gantt' : 'Calendario'}
          </button>
        ))}
      </div>

      {viewMode === 'cards'    && <CardsView entries={entries} totalHoras={summary?.totalHorasLectivas ?? 0} />}
      {viewMode === 'gantt'    && <GanttView entries={entries} />}
      {viewMode === 'calendar' && <CalendarView entries={entries} />}

      {(viewMode === 'gantt' || viewMode === 'calendar') && (
        <ModuleLegend entries={entries} />
      )}

      {dataset && <PracticosInfo modules={dataset.modules} />}

      {dataset.source !== 'manual' && (
        <details onToggle={e => setShowModules((e.target as HTMLDetailsElement).open)}>
          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 select-none py-1">
            {showModules ? 'Ocultar' : 'Ver'} modulos extraidos ({dataset.modules.length})
          </summary>
          <div className="mt-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[11px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                  <th className="px-3 py-2 text-left">Codigo</th>
                  <th className="px-3 py-2 text-left">Titulo</th>
                  <th className="px-3 py-2 text-right">Horas</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {dataset.modules.map(mod => (
                  <tr key={mod.id} className={'border-b border-slate-50 last:border-0 ' + (mod.excluido ? 'opacity-50' : '')}>
                    <td className="px-3 py-2">
                      <input
                        className="w-24 font-mono border border-slate-200 rounded px-1.5 py-0.5"
                        value={mod.codigo}
                        onChange={e => updateModule(mod.id, { codigo: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full border border-slate-200 rounded px-1.5 py-0.5"
                        value={mod.titulo}
                        onChange={e => updateModule(mod.id, { titulo: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-14 text-right border border-slate-200 rounded px-1.5 py-0.5"
                        value={mod.horas}
                        onChange={e => updateModule(mod.id, { horas: parseInt(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="border border-slate-200 rounded px-1.5 py-0.5"
                        value={mod.excluido ? 'MO' : 'MF'}
                        onChange={e => {
                          const excluido = e.target.value !== 'MF';
                          const tipo = e.target.value as ModuleTipo;
                          updateModule(mod.id, { tipo: excluido ? tipo : 'MF', excluido });
                        }}
                      >
                        <option value="MF">MF</option>
                        <option value="MO">MO/MP</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeModule(mod.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors text-xs"
                      >
                        x
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {dataset.source === 'manual' && (
        <button
          onClick={addModule}
          className="w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-xs text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-colors"
        >
          + Anadir modulo
        </button>
      )}

    </div>
  );
}
