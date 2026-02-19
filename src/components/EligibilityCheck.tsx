import { useState, useMemo, useCallback } from 'react';
import {
  evaluarElegibilidad,
  LEGAL_DISCLAIMER,
  CATALOG,
} from '../engine/eligibilityEngine';
import type { CatalogEntry } from '../engine/eligibilityEngine';
import type { TrainerProfile, EligibilityResult } from '../types/eligibility';

// ============================================================
// TYPES
// ============================================================

interface CatalogResult {
  entry: CatalogEntry;
  result: EligibilityResult;
}

// ============================================================
// HELPERS
// ============================================================

function buildProfile(
  titulacionInput: string,
  nivelMaximo: 1 | 2 | 3 | 4 | 5,
  experiencia: number,
  familia: string,
  tieneCap: boolean,
  tieneSsce: boolean,
  horasDocencia: number,
  idiomaIngles: string
): TrainerProfile {
  return {
    titulaciones: titulacionInput.split(',').map(t => t.trim()).filter(Boolean),
    nivelMaximo,
    experienciaSectorial: experiencia,
    familiaProfesional: familia,
    tieneCapOMaster: tieneCap,
    tieneSSCE0110: tieneSsce,
    horasExperienciaDocente: horasDocencia,
    idiomas: idiomaIngles ? { Ingles: idiomaIngles } : {},
  };
}

// Status config
const STATUS_CFG = {
  ELEGIBLE:    { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Elegible' },
  CONDICIONAL: { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200',      label: 'Condicional' },
  NO_ELEGIBLE: { dot: 'bg-slate-300',   badge: 'bg-slate-50 text-slate-500 border-slate-200',      label: 'No elegible' },
} as const;

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatusBadge({ status }: { status: 'ELEGIBLE' | 'CONDICIONAL' | 'NO_ELEGIBLE' }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className={'text-[10px] font-semibold px-2 py-0.5 rounded-full border ' + cfg.badge}>
      {cfg.label}
    </span>
  );
}

// Single MF result row
function MFRow({
  result,
  onPlanificar,
}: {
  result: CatalogResult;
  onPlanificar?: (codigoMF: string, nombreMF: string) => void;
}) {
  const { entry, result: res } = result;
  const cfg = STATUS_CFG[res.status];
  const canPlan = res.status === 'ELEGIBLE' || res.status === 'CONDICIONAL';

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
      <div className={'w-2 h-2 rounded-full flex-shrink-0 ' + cfg.dot} />
      <span className="text-[11px] font-mono font-bold text-slate-500 w-20 flex-shrink-0">{entry.codigoMF}</span>
      <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">{entry.nombreMF}</span>
      <StatusBadge status={res.status} />
      {canPlan && onPlanificar && (
        <button
          onClick={() => onPlanificar(entry.codigoMF, entry.nombreMF)}
          className="text-[11px] font-medium text-emerald-600 hover:text-emerald-800 hover:underline flex-shrink-0 ml-1"
        >
          Planificar
        </button>
      )}
    </div>
  );
}

// Results grouped by familia -> CP
function ResultsPanel({
  results,
  filterFamilia,
  onPlanificar,
}: {
  results: CatalogResult[];
  filterFamilia: string;
  onPlanificar?: (codigoMF: string, nombreMF: string) => void;
}) {
  const filtered = filterFamilia
    ? results.filter(r => r.entry.familiaProfesional === filterFamilia)
    : results;

  // Group: familia -> CP code -> results
  const groups = new Map<string, Map<string, CatalogResult[]>>();
  for (const r of filtered) {
    const fam = r.entry.familiaProfesional;
    const cert = r.entry.codigoCert;
    if (!groups.has(fam)) groups.set(fam, new Map());
    const byCert = groups.get(fam)!;
    if (!byCert.has(cert)) byCert.set(cert, []);
    byCert.get(cert)!.push(r);
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-400">
        No hay modulos para los filtros seleccionados.
      </div>
    );
  }

  // Summary counts
  const nElegible    = results.filter(r => r.result.status === 'ELEGIBLE').length;
  const nCondicional = results.filter(r => r.result.status === 'CONDICIONAL').length;

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      <div className="flex items-center gap-4 text-xs px-1">
        <span className="text-slate-500">Habilitaciones encontradas:</span>
        <span className="font-semibold text-emerald-600">{nElegible} elegibles</span>
        {nCondicional > 0 && (
          <span className="font-semibold text-amber-600">{nCondicional} condicionales</span>
        )}
      </div>

      {[...groups.entries()].map(([familia, byCert]) => (
        <div key={familia} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Familia header */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{familia}</span>
          </div>

          {[...byCert.entries()].map(([certCode, items]) => (
            <div key={certCode}>
              {/* CP header */}
              <div className="px-4 py-2 flex items-center gap-2 border-b border-slate-50">
                <span className="text-xs font-mono font-bold text-slate-700">{certCode}</span>
                <span className="text-xs text-slate-400">&middot; {items[0].entry.nombreCert}</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 ml-auto">
                  Niv. {items[0].entry.nivelCert}
                </span>
              </div>

              {/* MF rows */}
              <div className="divide-y divide-slate-50">
                {items.map(r => (
                  <MFRow key={r.entry.codigoMF} result={r} onPlanificar={onPlanificar} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

interface EligibilityCheckProps {
  onPlanificar?: (codigoMF: string, nombreMF: string) => void;
}

export function EligibilityCheck({ onPlanificar }: EligibilityCheckProps) {
  // -- Profile state --
  const [titulacionInput, setTitulacionInput] = useState('');
  const [nivelMaximo, setNivelMaximo]          = useState<1|2|3|4|5>(3);
  const [experiencia, setExperiencia]          = useState(0);
  const [familia, setFamilia]                  = useState('');
  const [tieneCap, setTieneCap]                = useState(false);
  const [tieneSsce, setTieneSsce]              = useState(false);
  const [horasDocencia, setHorasDocencia]      = useState(0);
  const [idiomaIngles, setIdiomaIngles]        = useState('');

  // -- Results state --
  const [results, setResults]         = useState<CatalogResult[] | null>(null);
  const [filterFamilia, setFilterFamilia] = useState('');

  // Familia options for filter
  const familias = useMemo(
    () => [...new Set(CATALOG.map(e => e.familiaProfesional))].sort(),
    []
  );

  const handleEvaluar = useCallback(() => {
    const perfil = buildProfile(
      titulacionInput, nivelMaximo, experiencia, familia,
      tieneCap, tieneSsce, horasDocencia, idiomaIngles
    );
    const catalogResults: CatalogResult[] = CATALOG.map(entry => ({
      entry,
      result: evaluarElegibilidad(perfil, entry),
    }));
    // Sort: ELEGIBLE first, then CONDICIONAL, then NO_ELEGIBLE
    const order = { ELEGIBLE: 0, CONDICIONAL: 1, NO_ELEGIBLE: 2 };
    catalogResults.sort((a, b) => order[a.result.status] - order[b.result.status]);
    setResults(catalogResults);
  }, [titulacionInput, nivelMaximo, experiencia, familia, tieneCap, tieneSsce, horasDocencia, idiomaIngles]);

  // -- Render --------------------------------------------------

  return (
    <div className="space-y-4">

      {/* Legal disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-amber-800">{LEGAL_DISCLAIMER.titulo}</p>
        <p className="text-[10px] text-amber-700 leading-relaxed">{LEGAL_DISCLAIMER.texto}</p>
        <p className="text-[10px] text-amber-600 italic">{LEGAL_DISCLAIMER.base_legal}</p>
      </div>

      {/* ---- PROFILE FORM ---- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Tu perfil de formador/a</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Rellena tus credenciales y pulsa Evaluar para ver para que modulos estas habilitado/a.
          </p>
        </div>

        <div className="px-4 py-4 space-y-4">

          {/* Titulacion */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Titulacion academica
              <span className="text-slate-400 font-normal ml-1">(separadas por coma si tienes varias)</span>
            </label>
            <input
              type="text"
              value={titulacionInput}
              onChange={e => setTitulacionInput(e.target.value)}
              placeholder="ej. Diplomado en Turismo, Grado en ADE"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Nivel + Experiencia */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nivel MECU / EQF
              </label>
              <select
                value={nivelMaximo}
                onChange={e => setNivelMaximo(parseInt(e.target.value) as 1|2|3|4|5)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              >
                <option value={1}>Nivel 1</option>
                <option value={2}>Nivel 2</option>
                <option value={3}>Nivel 3 (FP Superior / Diplomaturas)</option>
                <option value={4}>Nivel 4 (Grado universitario)</option>
                <option value={5}>Nivel 5 (Postgrado / Master / Doctorado)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Experiencia profesional (anos)
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={experiencia}
                onChange={e => setExperiencia(parseFloat(e.target.value) || 0)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-center font-mono"
              />
            </div>
          </div>

          {/* Familia profesional */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Familia profesional principal
            </label>
            <input
              type="text"
              value={familia}
              onChange={e => setFamilia(e.target.value)}
              placeholder="ej. Hosteleria y Turismo"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Docencia */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700">Competencia docente</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tieneCap}
                  onChange={e => setTieneCap(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-500"
                />
                <span className="text-xs text-slate-700">CAP / Master de Profesorado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tieneSsce}
                  onChange={e => setTieneSsce(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-500"
                />
                <span className="text-xs text-slate-700">SSCE0110 (cert. docencia FP)</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 w-36 flex-shrink-0">Horas docencia impartidas</label>
              <input
                type="number"
                min={0}
                value={horasDocencia}
                onChange={e => setHorasDocencia(parseInt(e.target.value) || 0)}
                className="w-20 text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-center font-mono"
              />
              <span className="text-xs text-slate-400">(exencion docente con &gt;600h)</span>
            </div>
          </div>

          {/* Idiomas */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nivel de ingles acreditado
              <span className="text-slate-400 font-normal ml-1">(dejar vacio si no aplica)</span>
            </label>
            <select
              value={idiomaIngles}
              onChange={e => setIdiomaIngles(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              <option value="">-- No acreditado --</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </div>

          {/* Evaluate button */}
          <button
            onClick={handleEvaluar}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
          >
            Ver mis habilitaciones
          </button>
        </div>
      </div>

      {/* ---- RESULTS ---- */}
      {results === null ? (
        <div className="text-center py-6 text-xs text-slate-400">
          Rellena tu perfil y pulsa Evaluar para ver los certificados y modulos para los que estas habilitado/a.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Familia filter (only when catalog has multiple familias) */}
          {familias.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 flex-shrink-0">Filtrar por familia:</span>
              <select
                value={filterFamilia}
                onChange={e => setFilterFamilia(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
              >
                <option value="">Todas</option>
                {familias.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          )}

          <ResultsPanel
            results={results}
            filterFamilia={filterFamilia}
            onPlanificar={onPlanificar}
          />

          {/* INCUAL exceptions note */}
          <p className="text-[10px] text-slate-400 px-1">
            Nota: el BOE HOTA0308 no especifica excepciones generales para expertos sin titulacion. INCUAL puede contemplar habilitaciones adicionales no recogidas en este sistema. Consulta con el organo competente.
          </p>
        </div>
      )}

    </div>
  );
}
