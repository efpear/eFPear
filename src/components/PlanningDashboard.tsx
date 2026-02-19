import { useState, useCallback, useRef } from "react";
import {
  parsePDFForPlanning,
  createEmptyPlanningDataset,
  recalcTotals,
} from "../engine/planningParser";
import type {
  PlanningDataset,
  PlanningModule,
  ModuleTipo,
} from "../types/planning";

// ============================================================
// SUBCOMPONENT: Module row editor
// ============================================================

interface ModuleRowProps {
  mod: PlanningModule;
  onUpdate: (id: string, patch: Partial<PlanningModule>) => void;
  onRemove: (id: string) => void;
}

function ModuleRow({ mod, onUpdate, onRemove }: ModuleRowProps) {
  return (
    <tr className={`border-b border-slate-100 ${mod.excluido ? "bg-orange-50/40" : "bg-white"}`}>
      <td className="px-3 py-2">
        <input
          className="w-24 text-xs border border-slate-200 rounded px-2 py-1 font-mono"
          value={mod.codigo}
          onChange={(e) => onUpdate(mod.id, { codigo: e.target.value })}
        />
      </td>
      <td className="px-3 py-2">
        <input
          className="w-full text-xs border border-slate-200 rounded px-2 py-1"
          value={mod.titulo}
          onChange={(e) => onUpdate(mod.id, { titulo: e.target.value })}
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={0}
          className="w-16 text-xs border border-slate-200 rounded px-2 py-1 text-right"
          value={mod.horas}
          onChange={(e) => onUpdate(mod.id, { horas: parseInt(e.target.value) || 0 })}
        />
      </td>
      <td className="px-3 py-2">
        <select
          className="text-xs border border-slate-200 rounded px-2 py-1"
          value={mod.tipo}
          onChange={(e) => {
            const tipo = e.target.value as ModuleTipo;
            onUpdate(mod.id, { tipo, excluido: tipo === "MO" || tipo === "MP" });
          }}
        >
          <option value="MF">MF</option>
          <option value="MO">MO/MP</option>
        </select>
      </td>
      <td className="px-3 py-2 text-center">
        {mod.excluido ? (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700">
            excluido
          </span>
        ) : (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
            lectivo
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        <button
          onClick={() => onRemove(mod.id)}
          className="text-slate-400 hover:text-red-500 text-xs transition-colors"
          title="Eliminar"
        >
          x
        </button>
      </td>
    </tr>
  );
}

// ============================================================
// SUBCOMPONENT: Imparticion summary dashboard
// ============================================================

interface ImparticionDashboardProps {
  dataset: PlanningDataset;
  fechaInicio: string;
  horasDia: number;
  diasSemana: number;
}

function ImparticionDashboard({ dataset, fechaInicio, horasDia, diasSemana }: ImparticionDashboardProps) {
  const lectivos = dataset.modules.filter((m) => !m.excluido);
  const excluidos = dataset.modules.filter((m) => m.excluido);
  const horasSemanales = horasDia * diasSemana;

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

  function formatDate(d: Date): string {
    return d.toISOString().split("T")[0];
  }

  let cursor = new Date(fechaInicio);
  const entries: Array<{ mod: PlanningModule; inicio: string; fin: string; semanas: number }> = [];

  for (const mod of lectivos) {
    const semanasNeed = horasSemanales > 0 ? Math.ceil(mod.horas / horasSemanales) : 0;
    const diasNeed = semanasNeed * 7;
    const inicio = skipWeekend(cursor);
    const fin = addDays(inicio, diasNeed - 1);
    entries.push({ mod, inicio: formatDate(inicio), fin: formatDate(fin), semanas: semanasNeed });
    cursor = addDays(fin, 1);
  }

  const fechaFinGlobal = entries.length > 0 ? entries[entries.length - 1].fin : fechaInicio;

  return (
    <div className="space-y-4">
      {/* Summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-700">{dataset.totalHorasLectivas}h</div>
          <div className="text-[10px] text-green-600 mt-1">Horas lectivas</div>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-orange-600">{dataset.totalHorasPracticas}h</div>
          <div className="text-[10px] text-orange-600 mt-1">Practicas (excluidas)</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
          <div className="text-base font-bold text-slate-700">{fechaInicio}</div>
          <div className="text-[10px] text-slate-500 mt-1">Inicio</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
          <div className="text-base font-bold text-slate-700">{fechaFinGlobal}</div>
          <div className="text-[10px] text-slate-500 mt-1">Fin estimado</div>
        </div>
      </div>

      {/* Module timeline */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h4 className="text-sm font-semibold text-slate-800">Calendario de imparticion</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {horasDia}h/dia - {diasSemana} dias/semana - {horasSemanales}h/semana
          </p>
        </div>
        <div className="divide-y divide-slate-50">
          {entries.map(({ mod, inicio, fin, semanas }) => (
            <div key={mod.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-24 flex-shrink-0">
                <span className="text-[10px] font-mono font-semibold text-slate-700">{mod.codigo}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-600 truncate">{mod.titulo}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{mod.horas}h - {semanas} semanas</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[10px] font-medium text-slate-700">{inicio}</div>
                <div className="text-[10px] text-slate-400">al {fin}</div>
              </div>
            </div>
          ))}
          {excluidos.length > 0 && (
            <div className="px-4 py-3 bg-orange-50/50">
              <div className="text-[10px] text-orange-600 font-medium mb-1">Modulos de practicas (no computan para fechas):</div>
              {excluidos.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-[10px] text-orange-700 py-0.5">
                  <span className="font-mono">{m.codigo}</span>
                  <span className="text-orange-400">-</span>
                  <span>{m.titulo}</span>
                  <span className="text-orange-500">({m.horas}h)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT: PlanningDashboard (Block A) -- self-contained
// ============================================================

let _nextId = 1;
function newId() { return 'manual-' + (_nextId++); }

export function PlanningDashboard() {
  // Self-contained state -- no external props needed
  const [fechaInicio, setFechaInicio] = useState('2025-09-15');
  const [dataset, setDataset] = useState<PlanningDataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [horasDia, setHorasDia] = useState(5);
  const [diasSemana, setDiasSemana] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Solo se aceptan archivos PDF");
      return;
    }
    setIsLoading(true);
    setError(null);
    setShowDashboard(false);
    try {
      const parsed = await parsePDFForPlanning(file);
      setDataset(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "desconocido";
      setError('Error al procesar el PDF: ' + msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const startManual = useCallback(() => {
    setDataset(createEmptyPlanningDataset());
    setError(null);
    setShowDashboard(false);
  }, []);

  const addModule = useCallback(() => {
    setDataset((prev) => {
      if (!prev) return prev;
      const mod: PlanningModule = {
        id: newId(), codigo: 'MF0000_0', titulo: 'Nuevo modulo',
        horas: 60, tipo: 'MF', excluido: false,
      };
      return recalcTotals({ ...prev, modules: [...prev.modules, mod] });
    });
  }, []);

  const updateModule = useCallback((id: string, patch: Partial<PlanningModule>) => {
    setDataset((prev) => {
      if (!prev) return prev;
      const modules = prev.modules.map((m) => m.id === id ? { ...m, ...patch } : m);
      return recalcTotals({ ...prev, modules });
    });
  }, []);

  const removeModule = useCallback((id: string) => {
    setDataset((prev) => {
      if (!prev) return prev;
      return recalcTotals({ ...prev, modules: prev.modules.filter((m) => m.id !== id) });
    });
  }, []);

  return (
    <div className="space-y-4">
      {/* ENTRY PANEL */}
      {!dataset && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Planificacion de fechas de imparticion</h3>
            <p className="text-xs text-slate-500 mt-1">
              Sube una ficha SEPE, certificado o anexo en PDF para extraer los modulos automaticamente.
            </p>
          </div>

          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onClick={() => fileInputRef.current?.click()}
            className={'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ' +
              (dragActive ? 'border-green-500 bg-green-50' :
               isLoading ? 'border-amber-300 bg-amber-50' :
               'border-slate-300 hover:border-green-400 hover:bg-green-50/50')}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
            />
            {isLoading ? (
              <div className="space-y-2">
                <div className="text-2xl animate-pulse">⏳</div>
                <p className="text-sm text-amber-700">Extrayendo modulos del PDF...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-3xl">📄</div>
                <p className="text-sm font-medium text-slate-700">
                  Arrastra aqui tu ficha, certificado o anexo PDF
                </p>
                <p className="text-xs text-slate-400">Ficha SEPE · Certificado completo · Anexo del certificado</p>
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

          <button
            onClick={startManual}
            className="w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Introducir modulos manualmente
          </button>
        </div>
      )}

      {/* MODULE TABLE */}
      {dataset && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {dataset.codigoCertificado
                  ? (dataset.codigoCertificado + ' - ' + dataset.tituloCertificado)
                  : 'Modulos (entrada manual)'}
              </h3>
              {dataset.source === 'pdf' && (
                <p className="text-[10px] text-slate-500 mt-0.5">Extraido del PDF - Revisa y ajusta si es necesario</p>
              )}
            </div>
            <button
              onClick={() => { setDataset(null); setShowDashboard(false); }}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Cambiar PDF
            </button>
          </div>

          {dataset.warnings.length > 0 && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
              <p className="text-[10px] text-amber-700">Aviso: {dataset.warnings.slice(0, 2).join(' - ')}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-3 py-2 text-left font-medium">Codigo</th>
                  <th className="px-3 py-2 text-left font-medium">Titulo</th>
                  <th className="px-3 py-2 text-right font-medium">Horas</th>
                  <th className="px-3 py-2 text-left font-medium">Tipo</th>
                  <th className="px-3 py-2 text-center font-medium">Estado</th>
                  <th className="px-3 py-2 text-center font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {dataset.modules.map((mod) => (
                  <ModuleRow key={mod.id} mod={mod} onUpdate={updateModule} onRemove={removeModule} />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td colSpan={2} className="px-3 py-2">
                    <button onClick={addModule} className="text-xs text-green-700 hover:text-green-800 font-medium">
                      + Anadir modulo
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="text-xs font-semibold text-green-700">{dataset.totalHorasLectivas}h lectivas</div>
                    <div className="text-[10px] text-orange-600">+{dataset.totalHorasPracticas}h practicas</div>
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Config + Calcular */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600">Fecha inicio:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="text-xs border border-slate-200 rounded px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600">Horas/dia:</label>
              <input
                type="number" min={1} max={10} value={horasDia}
                onChange={(e) => setHorasDia(parseInt(e.target.value) || 5)}
                className="w-14 text-xs border border-slate-200 rounded px-2 py-1 text-right"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600">Dias/semana:</label>
              <input
                type="number" min={1} max={6} value={diasSemana}
                onChange={(e) => setDiasSemana(parseInt(e.target.value) || 5)}
                className="w-14 text-xs border border-slate-200 rounded px-2 py-1 text-right"
              />
            </div>
            <button
              onClick={() => setShowDashboard(true)}
              disabled={dataset.modules.filter((m) => !m.excluido).length === 0}
              className="ml-auto px-5 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              Calcular fechas
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {showDashboard && dataset && (
        <ImparticionDashboard
          dataset={dataset}
          fechaInicio={fechaInicio}
          horasDia={horasDia}
          diasSemana={diasSemana}
        />
      )}
    </div>
  );
}
