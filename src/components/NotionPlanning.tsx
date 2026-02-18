import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { ModuloConSesiones, Sesion } from '../types';

// ============================================
// TYPES
// ============================================
type PlanningView = 'tabla' | 'calendario' | 'timeline';

interface NotionPlanningProps {
  modulosCascada: ModuloConSesiones[];
  modulos: Array<{ codigo: string; titulo: string; horas: number }>;
  metricas: {
    totalModulos: number;
    totalHoras: number;
    horasFormativas: number;
    horasPracticas: number;
    totalSesiones: number;
    totalDiasLectivos: number;
    fechaInicio: string;
    fechaFin: string;
    porcentajeCompletado: number;
  };
  coherencia: { coherente: boolean; alertas: Array<{ tipo: string; mensaje: string }> };
}

// ============================================
// COLORS
// ============================================
const MOD_COLORS = [
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', bar: 'bg-emerald-400' },
  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', bar: 'bg-blue-400' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', bar: 'bg-amber-400' },
  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500', bar: 'bg-purple-400' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', bar: 'bg-rose-400' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500', bar: 'bg-cyan-400' },
  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', bar: 'bg-indigo-400' },
  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', bar: 'bg-orange-400' },
];

// ============================================
// MAIN COMPONENT
// ============================================
export function NotionPlanning({ modulosCascada, modulos, metricas, coherencia }: NotionPlanningProps) {
  const [view, setView] = useState<PlanningView>('tabla');
  const [selectedMod, setSelectedMod] = useState<number | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    if (modulosCascada.length > 0 && modulosCascada[0].sesiones.length > 0) {
      const first = modulosCascada[0].sesiones[0].fecha;
      return first.substring(0, 7); // YYYY-MM
    }
    return new Date().toISOString().substring(0, 7);
  });

  return (
    <div className="space-y-0">
      {/* Notion-style top bar */}
      <div className="flex items-center justify-between px-1 py-3">
        <div className="flex items-center gap-4">
          {/* View switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            {([
              { id: 'tabla' as PlanningView, icon: '\u2261', label: 'Tabla' },
              { id: 'calendario' as PlanningView, icon: '\u25A6', label: 'Calendario' },
              { id: 'timeline' as PlanningView, icon: '\u2500', label: 'Timeline' },
            ]).map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  view === v.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}>
                <span className="mr-1.5">{v.icon}</span>{v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inline metrics — Notion style */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{metricas.totalModulos} m\u00F3dulos</span>
          <span className="text-slate-300">|</span>
          <span>{metricas.horasFormativas}h formativas</span>
          {metricas.horasPracticas > 0 && (
            <>
              <span className="text-slate-300">+</span>
              <span className="text-amber-500">{metricas.horasPracticas}h pr\u00E1cticas</span>
            </>
          )}
          <span className="text-slate-300">|</span>
          <span>{metricas.totalSesiones} sesiones</span>
          <span className="text-slate-300">|</span>
          <span>{metricas.fechaInicio} \u2192 {metricas.fechaFin}</span>
          {!coherencia.coherente && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-amber-600">{'\u26A0'} {coherencia.alertas.length} alertas</span>
            </>
          )}
        </div>
      </div>

      {/* View content */}
      {view === 'tabla' && (
        <TablaView
          modulosCascada={modulosCascada}
          modulos={modulos}
          selectedMod={selectedMod}
          onSelect={setSelectedMod}
        />
      )}
      {view === 'calendario' && (
        <CalendarioView
          modulosCascada={modulosCascada}
          modulos={modulos}
          month={calMonth}
          onMonthChange={setCalMonth}
        />
      )}
      {view === 'timeline' && (
        <TimelineView
          modulosCascada={modulosCascada}
          modulos={modulos}
        />
      )}

      {/* Side panel */}
      {selectedMod !== null && view === 'tabla' && (
        <SidePanel
          mod={modulosCascada[selectedMod]}
          info={modulos[selectedMod]}
          color={MOD_COLORS[selectedMod % MOD_COLORS.length]}
          onClose={() => setSelectedMod(null)}
        />
      )}
    </div>
  );
}

// ============================================
// TABLE VIEW (Notion database table)
// ============================================
function TablaView({ modulosCascada, modulos, selectedMod, onSelect }: {
  modulosCascada: ModuloConSesiones[];
  modulos: Array<{ codigo: string; titulo: string; horas: number }>;
  selectedMod: number | null;
  onSelect: (i: number | null) => void;
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-12 gap-0 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
        <div className="col-span-4 px-4 py-2.5">M\u00F3dulo</div>
        <div className="col-span-1 px-3 py-2.5 text-right">Horas</div>
        <div className="col-span-1 px-3 py-2.5 text-right">Sesiones</div>
        <div className="col-span-2 px-3 py-2.5">Inicio</div>
        <div className="col-span-2 px-3 py-2.5">Fin</div>
        <div className="col-span-2 px-3 py-2.5">Progreso</div>
      </div>

      {/* Rows */}
      {modulosCascada.map((mod, i) => {
        const info = modulos[i];
        const color = MOD_COLORS[i % MOD_COLORS.length];
        const primera = mod.sesiones[0];
        const ultima = mod.sesiones[mod.sesiones.length - 1];
        const isSelected = selectedMod === i;

        return (
          <div key={mod.id || i}
            onClick={() => onSelect(isSelected ? null : i)}
            className={`grid grid-cols-12 gap-0 border-b border-slate-100 last:border-b-0 cursor-pointer transition-colors ${
              isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
            }`}>
            {/* Module name */}
            <div className="col-span-4 px-4 py-3 flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 truncate">{mod.codigo}</span>
                  {/^MP\d/i.test(mod.codigo) && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200">
                      Pr\u00E1cticas \u00B7 empresa
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 truncate">{info?.titulo || ''}</div>
              </div>
            </div>

            {/* Hours */}
            <div className="col-span-1 px-3 py-3 text-right">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color.bg} ${color.text}`}>
                {mod.horasTotales}h
              </span>
            </div>

            {/* Sessions */}
            <div className="col-span-1 px-3 py-3 text-right text-sm text-slate-600">
              {mod.sesiones.length}
            </div>

            {/* Start date */}
            <div className="col-span-2 px-3 py-3 text-sm text-slate-600">
              {primera?.fecha || '\u2014'}
            </div>

            {/* End date */}
            <div className="col-span-2 px-3 py-3 text-sm text-slate-600">
              {ultima?.fecha || '\u2014'}
            </div>

            {/* Progress bar */}
            <div className="col-span-2 px-3 py-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color.bar}`} style={{ width: '100%' }} />
              </div>
              <span className="text-xs text-slate-500 font-medium">{mod.horasTotales}h</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// CALENDAR VIEW (Month grid)
// ============================================
function CalendarioView({ modulosCascada, modulos, month, onMonthChange }: {
  modulosCascada: ModuloConSesiones[];
  modulos: Array<{ codigo: string; titulo: string; horas: number }>;
  month: string;
  onMonthChange: (m: string) => void;
}) {
  const DIAS = ['Lun', 'Mar', 'Mi\u00E9', 'Jue', 'Vie', 'S\u00E1b', 'Dom'];
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const [year, monthNum] = month.split('-').map(Number);

  const prevMonth = () => {
    const d = new Date(year, monthNum - 2, 1);
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const d = new Date(year, monthNum, 1);
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // Build session map: date -> [{ modIndex, sesion }]
  const sessionMap = useMemo(() => {
    const map = new Map<string, Array<{ modIndex: number; sesion: any }>>();
    modulosCascada.forEach((mod, modIndex) => {
      mod.sesiones.forEach((s: Sesion) => {
        const key = s.fecha;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ modIndex, sesion: s });
      });
    });
    return map;
  }, [modulosCascada]);

  // Build calendar grid
  const grid = useMemo(() => {
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
    const totalDays = lastDay.getDate();

    const cells: Array<{ day: number; date: string; inMonth: boolean }> = [];

    // Padding before
    for (let i = 0; i < startDow; i++) {
      const d = new Date(year, monthNum - 1, -startDow + i + 1);
      cells.push({ day: d.getDate(), date: formatDate(d), inMonth: false });
    }

    // Current month
    for (let d = 1; d <= totalDays; d++) {
      const date = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, date, inMonth: true });
    }

    // Padding after (fill to 6 rows)
    while (cells.length < 42) {
      const d = new Date(year, monthNum, cells.length - startDow - totalDays + 1);
      cells.push({ day: d.getDate(), date: formatDate(d), inMonth: false });
    }

    return cells;
  }, [year, monthNum]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors">
          <span className="text-sm">{'\u2190'}</span>
        </button>
        <h3 className="text-sm font-semibold text-slate-900">{MESES[monthNum - 1]} {year}</h3>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors">
          <span className="text-sm">{'\u2192'}</span>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {DIAS.map(d => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium text-slate-500">{d}</div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {grid.map((cell, idx) => {
          const sessions: Array<{ modIndex: number; sesion: Sesion }> = sessionMap.get(cell.date) || [];
          const isToday = cell.date === today;
          const isWeekend = idx % 7 >= 5;

          return (
            <div key={idx}
              className={`min-h-[80px] border-b border-r border-slate-100 p-1 transition-colors ${
                !cell.inMonth ? 'bg-slate-50/50' :
                isWeekend ? 'bg-slate-50/30' :
                sessions.length > 0 ? 'bg-white' : 'bg-white'
              }`}>
              <div className={`text-xs mb-1 px-1 ${
                !cell.inMonth ? 'text-slate-300' :
                isToday ? 'text-white bg-green-600 rounded-full w-5 h-5 flex items-center justify-center font-bold' :
                'text-slate-500'
              }`}>
                {cell.day}
              </div>
              <div className="space-y-0.5">
                {sessions.slice(0, 3).map((s: { modIndex: number; sesion: Sesion }, j: number) => {
                  const color = MOD_COLORS[s.modIndex % MOD_COLORS.length];
                  return (
                    <div key={j}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${color.bg} ${color.text} truncate font-medium`}>
                      {modulosCascada[s.modIndex].codigo} {'\u00B7'} {s.sesion.horas}h
                    </div>
                  );
                })}
                {sessions.length > 3 && (
                  <div className="text-[10px] px-1.5 text-slate-400">+{sessions.length - 3} m\u00E1s</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-3">
        {modulosCascada.map((mod, i) => {
          const color = MOD_COLORS[i % MOD_COLORS.length];
          return (
            <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className={`w-2.5 h-2.5 rounded-sm ${color.bar}`} />
              {mod.codigo}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// TIMELINE VIEW (Gantt-style)
// ============================================
function TimelineView({ modulosCascada, modulos }: {
  modulosCascada: ModuloConSesiones[];
  modulos: Array<{ codigo: string; titulo: string; horas: number }>;
}) {
  const { minDate, maxDate, totalDays, months } = useMemo(() => {
    let min = '9999-12-31';
    let max = '0000-01-01';
    modulosCascada.forEach(mod => {
      mod.sesiones.forEach((s: Sesion) => {
        if (s.fecha < min) min = s.fecha;
        if (s.fecha > max) max = s.fecha;
      });
    });

    const start = new Date(min);
    const end = new Date(max);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Month markers
    const ms: Array<{ label: string; offset: number; width: number }> = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      const mStart = new Date(Math.max(cursor.getTime(), start.getTime()));
      const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const mEnd = new Date(Math.min(nextMonth.getTime(), end.getTime()));
      const offset = Math.ceil((mStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const width = Math.ceil((mEnd.getTime() - mStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const MESES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      ms.push({ label: `${MESES_SHORT[cursor.getMonth()]} ${cursor.getFullYear()}`, offset, width });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { minDate: min, maxDate: max, totalDays: days, months: ms };
  }, [modulosCascada]);

  const dayToPercent = (date: string) => {
    const d = new Date(date);
    const start = new Date(minDate);
    const offset = Math.ceil((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return (offset / totalDays) * 100;
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Month headers */}
      <div className="flex bg-slate-50 border-b border-slate-200 relative h-8">
        {months.map((m, i) => (
          <div key={i}
            className="absolute top-0 h-full flex items-center border-r border-slate-200"
            style={{ left: `${(m.offset / totalDays) * 100}%`, width: `${(m.width / totalDays) * 100}%` }}>
            <span className="text-xs font-medium text-slate-500 px-2 truncate">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Bars */}
      <div className="divide-y divide-slate-100">
        {modulosCascada.map((mod, i) => {
          const color = MOD_COLORS[i % MOD_COLORS.length];
          const primera = mod.sesiones[0];
          const ultima = mod.sesiones[mod.sesiones.length - 1];
          if (!primera || !ultima) return null;

          const left = dayToPercent(primera.fecha);
          const right = dayToPercent(ultima.fecha);
          const width = Math.max(right - left, 1);

          return (
            <div key={i} className="relative h-12 hover:bg-slate-50 transition-colors">
              {/* Module label */}
              <div className="absolute left-0 top-0 h-full flex items-center z-10 pl-3">
                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1">
                  <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                  <span className="text-xs font-medium text-slate-900">{mod.codigo}</span>
                  <span className="text-[10px] text-slate-400">{mod.horasTotales}h</span>
                </div>
              </div>

              {/* Bar */}
              <div className="absolute top-2 h-8 flex items-center"
                style={{ left: `${left}%`, width: `${width}%` }}>
                <div className={`w-full h-3 rounded-full ${color.bar} opacity-60`} />
              </div>

              {/* Session dots */}
              {mod.sesiones.map((s: Sesion, j: number) => {
                const pos = dayToPercent(s.fecha);
                return (
                  <div key={j}
                    className={`absolute top-4 w-1.5 h-1.5 rounded-full ${color.dot}`}
                    style={{ left: `${pos}%` }}
                    title={`${s.fecha} \u00B7 ${s.horas}h`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// SIDE PANEL
// ============================================
function SidePanel({ mod, info, color, onClose }: {
  mod: ModuloConSesiones;
  info: { codigo: string; titulo: string; horas: number };
  color: typeof MOD_COLORS[0];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-slate-200 shadow-xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${color.dot}`} />
          <div>
            <h3 className="text-sm font-bold text-slate-900">{mod.codigo}</h3>
            <p className="text-xs text-slate-500">{info?.titulo}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
          <span className="text-lg">{'\u00D7'}</span>
        </button>
      </div>

      {/* Properties (Notion-style) */}
      <div className="px-5 py-4 space-y-3 border-b border-slate-100">
        {[
          { label: 'Horas totales', value: `${mod.horasTotales}h` },
          { label: 'Sesiones', value: `${mod.sesiones.length}` },
          { label: 'Primera sesi\u00F3n', value: mod.sesiones[0]?.fecha || '\u2014' },
          { label: '\u00DAltima sesi\u00F3n', value: mod.sesiones[mod.sesiones.length - 1]?.fecha || '\u2014' },
        ].map(p => (
          <div key={p.label} className="flex items-center text-sm">
            <span className="w-32 text-slate-500 flex-shrink-0">{p.label}</span>
            <span className="text-slate-900 font-medium">{p.value}</span>
          </div>
        ))}
      </div>

      {/* Session list */}
      <div className="px-5 py-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sesiones</h4>
        <div className="space-y-1">
          {mod.sesiones.map((s: Sesion, i: number) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono w-6">#{i + 1}</span>
                <span className="text-sm text-slate-700">{s.fecha}</span>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color.bg} ${color.text}`}>
                {s.horas}h
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================
function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
