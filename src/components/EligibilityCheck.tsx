import { useState, useMemo, useCallback } from 'react';
import {
  evaluarElegibilidad,
  LEGAL_DISCLAIMER,
  CATALOG,
} from '../engine/eligibilityEngine';
import type { CatalogEntry } from '../engine/eligibilityEngine';
import type { TrainerProfile, EligibilityResult } from '../types/eligibility';
import { Info } from 'lucide-react';

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

// OAT-mapped status config
const STATUS_CFG = {
  ELIGIBLE:    { dotColor: 'var(--success)', badgeClass: 'success',   label: 'Elegible' },
  CONDICIONAL: { dotColor: 'var(--warning)', badgeClass: 'warning',   label: 'Condicional' },
  NO_ELIGIBLE: { dotColor: 'var(--border)',  badgeClass: 'secondary', label: 'No elegible' },
} as const;

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatusBadge({ status }: { status: 'ELIGIBLE' | 'CONDICIONAL' | 'NO_ELIGIBLE' }) {
  const cfg = STATUS_CFG[status];
  return <span className={'oat-badge ' + cfg.badgeClass}>{cfg.label}</span>;
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
  const cfg    = STATUS_CFG[res.status];
  const canPlan = res.status === 'ELIGIBLE' || res.status === 'CONDICIONAL';

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 transition-colors"
      style={{ borderTop: '1px solid var(--border)' }}
      onMouseOver={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--faint)'; }}
      onMouseOut={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: cfg.dotColor }}
      />
      <code
        className="text-[11px] font-bold flex-shrink-0"
        style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)', width: '5rem' }}
      >
        {entry.codigoMF}
      </code>
      <span className="text-sm flex-1 min-w-0 truncate" style={{ color: 'var(--foreground)' }}>
        {entry.nombreMF}
      </span>
      <StatusBadge status={res.status} />
      {canPlan && onPlanificar && (
        <button
          onClick={() => onPlanificar(entry.codigoMF, entry.nombreMF)}
          className="text-[11px] font-medium flex-shrink-0 cursor-pointer"
          style={{ background: 'none', border: 'none', padding: '0 0.25rem', color: 'var(--primary)' }}
          onMouseOver={e => { (e.target as HTMLElement).style.textDecoration = 'underline'; }}
          onMouseOut={e => { (e.target as HTMLElement).style.textDecoration = 'none'; }}
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

  const groups = new Map<string, Map<string, CatalogResult[]>>();
  for (const r of filtered) {
    const fam  = r.entry.familiaProfesional;
    const cert = r.entry.codigoCert;
    if (!groups.has(fam)) groups.set(fam, new Map());
    const byCert = groups.get(fam)!;
    if (!byCert.has(cert)) byCert.set(cert, []);
    byCert.get(cert)!.push(r);
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-7)' }}>
        No hay modulos para los filtros seleccionados.
      </div>
    );
  }

  const nElegible    = results.filter(r => r.result.status === 'ELIGIBLE').length;
  const nCondicional = results.filter(r => r.result.status === 'CONDICIONAL').length;

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Habilitaciones encontradas:</span>
        <span className="oat-badge success">{nElegible} elegibles</span>
        {nCondicional > 0 && (
          <span className="oat-badge warning">{nCondicional} condicionales</span>
        )}
      </div>

      {[...groups.entries()].map(([familia, byCert]) => (
        <div key={familia} className="oat-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Familia header */}
          <div className="px-4 py-2" style={{ backgroundColor: 'var(--faint)', borderBottom: '1px solid var(--border)' }}>
            <span
              className="text-[10px] font-semibold uppercase"
              style={{ color: 'var(--muted-foreground)', letterSpacing: '0.06em' }}
            >
              {familia}
            </span>
          </div>

          {[...byCert.entries()].map(([certCode, items]) => (
            <div key={certCode}>
              {/* CP header */}
              <div
                className="px-4 py-2 flex items-center gap-2"
                style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
              >
                <code
                  className="text-xs font-bold"
                  style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}
                >
                  {certCode}
                </code>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  &middot; {items[0].entry.nombreCert}
                </span>
                <span className="oat-badge secondary" style={{ marginLeft: 'auto' }}>
                  Niv. {items[0].entry.nivelCert}
                </span>
              </div>

              {/* MF rows */}
              <div style={{ backgroundColor: 'var(--card)' }}>
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
  const [titulacionInput, setTitulacionInput] = useState('');
  const [nivelMaximo, setNivelMaximo]          = useState<1|2|3|4|5>(3);
  const [experiencia, setExperiencia]          = useState(0);
  const [familia, setFamilia]                  = useState('');
  const [tieneCap, setTieneCap]                = useState(false);
  const [tieneSsce, setTieneSsce]              = useState(false);
  const [horasDocencia, setHorasDocencia]      = useState(0);
  const [idiomaIngles, setIdiomaIngles]        = useState('');
  const [results, setResults]                  = useState<CatalogResult[] | null>(null);
  const [filterFamilia, setFilterFamilia]      = useState('');

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
    const order = { ELIGIBLE: 0, CONDICIONAL: 1, NO_ELIGIBLE: 2 };
    catalogResults.sort((a, b) => order[a.result.status] - order[b.result.status]);
    setResults(catalogResults);
  }, [titulacionInput, nivelMaximo, experiencia, familia, tieneCap, tieneSsce, horasDocencia, idiomaIngles]);

  return (
    <div className="space-y-4">

      {/* Legal disclaimer */}
      <div
        className="oat-card flex items-start gap-3"
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'color-mix(in srgb, var(--warning) 8%, var(--card))',
          borderColor: 'color-mix(in srgb, var(--warning) 35%, transparent)',
        }}
      >
        <Info size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '1px' }} />
        <div className="space-y-0.5">
          <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
            {LEGAL_DISCLAIMER.titulo}
          </p>
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            {LEGAL_DISCLAIMER.texto}
          </p>
          <p className="text-[10px] italic" style={{ color: 'var(--muted-foreground)' }}>
            {LEGAL_DISCLAIMER.base_legal}
          </p>
        </div>
      </div>

      {/* Profile form */}
      <div className="oat-card" style={{ padding: 0 }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Tu perfil de formador/a
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Rellena tus credenciales y pulsa Evaluar para ver para que modulos estas habilitado/a.
          </p>
        </div>

        <div className="px-4 py-4 space-y-4">

          {/* Titulacion */}
          <div>
            <label style={{ display: 'block', marginBlockEnd: '0.25rem' }}>
              Titulacion academica
              <span style={{ color: 'var(--muted-foreground)', fontWeight: 'normal', marginLeft: '0.25rem' }}>
                (separadas por coma si tienes varias)
              </span>
            </label>
            <input
              type="text"
              value={titulacionInput}
              onChange={e => setTitulacionInput(e.target.value)}
              placeholder="ej. Diplomatura en Turismo, Grado en ADE"
            />
          </div>

          {/* Nivel + Experiencia */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ display: 'block', marginBlockEnd: '0.25rem' }}>Nivel MECU / EQF</label>
              <select
                value={nivelMaximo}
                onChange={e => setNivelMaximo(parseInt(e.target.value) as 1|2|3|4|5)}
              >
                <option value={1}>Nivel 1</option>
                <option value={2}>Nivel 2</option>
                <option value={3}>Nivel 3 (FP Superior / Diplomaturas)</option>
                <option value={4}>Nivel 4 (Grado universitario)</option>
                <option value={5}>Nivel 5 (Postgrado / Master / Doctorado)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBlockEnd: '0.25rem' }}>
                Experiencia profesional (anos)
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={experiencia}
                onChange={e => setExperiencia(parseFloat(e.target.value) || 0)}
                style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          {/* Familia */}
          <div>
            <label style={{ display: 'block', marginBlockEnd: '0.25rem' }}>
              Familia profesional principal
            </label>
            <input
              type="text"
              value={familia}
              onChange={e => setFamilia(e.target.value)}
              placeholder="ej. Hosteleria y Turismo"
            />
          </div>

          {/* Competencia docente */}
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>Competencia docente</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tieneCap}
                  onChange={e => setTieneCap(e.target.checked)}
                />
                <span className="text-xs" style={{ color: 'var(--foreground)' }}>CAP / Master de Profesorado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tieneSsce}
                  onChange={e => setTieneSsce(e.target.checked)}
                />
                <span className="text-xs" style={{ color: 'var(--foreground)' }}>SSCE0110 (cert. docencia FP)</span>
              </label>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs flex-shrink-0" style={{ color: 'var(--foreground)', width: '9rem' }}>
                Horas docencia impartidas
              </label>
              <input
                type="number"
                min={0}
                value={horasDocencia}
                onChange={e => setHorasDocencia(parseInt(e.target.value) || 0)}
                style={{ width: '5rem', textAlign: 'center', fontFamily: 'var(--font-mono)', marginBlockStart: 0 }}
              />
              <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                (exencion docente con &gt;600h)
              </span>
            </div>
          </div>

          {/* Idiomas */}
          <div>
            <label style={{ display: 'block', marginBlockEnd: '0.25rem' }}>
              Nivel de ingles acreditado
              <span style={{ color: 'var(--muted-foreground)', fontWeight: 'normal', marginLeft: '0.25rem' }}>
                (dejar vacio si no aplica)
              </span>
            </label>
            <select
              value={idiomaIngles}
              onChange={e => setIdiomaIngles(e.target.value)}
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

          {/* Submit */}
          <button
            onClick={handleEvaluar}
            className="w-full cursor-pointer"
            style={{
              padding: '0.625rem',
              borderRadius: 'var(--radius-medium)',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontSize: 'var(--text-7)',
              fontWeight: 'var(--font-semibold)',
              transition: 'background-color var(--transition-fast)',
            }}
          >
            Ver mis habilitaciones
          </button>
        </div>
      </div>

      {/* Results area */}
      {results === null ? (
        <div className="text-center py-6" style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-8)' }}>
          Rellena tu perfil y pulsa Evaluar para ver los certificados y modulos para los que estas habilitado/a.
        </div>
      ) : (
        <div className="space-y-3">
          {familias.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>Filtrar por familia:</span>
              <select
                value={filterFamilia}
                onChange={e => setFilterFamilia(e.target.value)}
                style={{ width: 'auto', fontSize: 'var(--text-8)', marginBlockStart: 0 }}
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

          <p className="text-[10px] px-1" style={{ color: 'var(--muted-foreground)' }}>
            Nota: el BOE HOTA0308 no especifica excepciones generales para expertos sin titulacion.
            INCUAL puede contemplar habilitaciones adicionales no recogidas en este sistema.
            Consulta con el organo competente.
          </p>
        </div>
      )}

    </div>
  );
}
