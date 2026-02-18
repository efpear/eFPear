import { useState, useMemo, useCallback, useRef } from 'react';
import { parseBulkPDF, agruparPorFamilia, buscarFichas } from '../engine/sepeBulkParser';
import type { BulkParseProgress, BulkParseResult } from '../engine/sepeBulkParser';
import type { FichaSEPE } from '../engine/sepeParser';
import { fichaACertificado } from '../engine/sepeParser';
import type { Certificado } from '../types';

// ============================================
// TYPES
// ============================================
interface CatalogProps {
  onCertificadoSelected: (cert: Certificado, ficha: FichaSEPE) => void;
  currentCodigo?: string;
}

// ============================================
// LEVEL BADGES
// ============================================
const NIVEL_STYLE: Record<number, string> = {
  1: 'bg-blue-50 text-blue-700 border-blue-200',
  2: 'bg-green-50 text-green-700 border-green-200',
  3: 'bg-purple-50 text-purple-700 border-purple-200',
};

// ============================================
// MAIN COMPONENT
// ============================================
export function CatalogBrowser({ onCertificadoSelected, currentCodigo }: CatalogProps) {
  const [fichas, setFichas] = useState<FichaSEPE[]>([]);
  const [progress, setProgress] = useState<BulkParseProgress | null>(null);
  const [result, setResult] = useState<BulkParseResult | null>(null);
  const [search, setSearch] = useState('');
  const [expandedFam, setExpandedFam] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Search
  const filtered = useMemo(() => buscarFichas(fichas, search), [fichas, search]);
  const grouped = useMemo(() => agruparPorFamilia(filtered), [filtered]);
  const familias = useMemo(() => [...grouped.keys()].sort(), [grouped]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Solo se aceptan archivos PDF');
      return;
    }
    setError(null);
    setProgress({ phase: 'extracting', current: 0, total: 0, message: 'Iniciando...' });

    try {
      const res = await parseBulkPDF(file, setProgress);
      setResult(res);
      setFichas(res.fichas);
      // Auto-expand first family
      const firstFam = agruparPorFamilia(res.fichas).keys().next();
      if (firstFam.value) setExpandedFam(firstFam.value);
    } catch (err: any) {
      setError(`Error procesando PDF: ${err.message}`);
      setProgress(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const selectFicha = useCallback((ficha: FichaSEPE) => {
    const cert = fichaACertificado(ficha);
    onCertificadoSelected(cert, ficha);
  }, [onCertificadoSelected]);

  // ============================================
  // UPLOAD STATE (no catalog loaded yet)
  // ============================================
  if (fichas.length === 0 && !progress) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-all"
      >
        <input ref={fileRef} type="file" accept=".pdf" className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <div className="text-3xl mb-3">{'\uD83D\uDCDA'}</div>
        <div className="text-sm font-semibold text-slate-700">
          Cargar repertorio de certificados
        </div>
        <div className="text-xs text-slate-500 mt-1">
          PDF con m{'\u00FA'}ltiples fichas SEPE {'\u00B7'} arrastra o haz clic
        </div>
        {error && <div className="text-xs text-red-600 mt-3">{error}</div>}
      </div>
    );
  }

  // ============================================
  // LOADING STATE (parsing in progress)
  // ============================================
  if (progress && progress.phase !== 'done' && fichas.length === 0) {
    const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
    return (
      <div className="border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full" />
          <span className="text-sm font-medium text-slate-700">{progress.message}</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-slate-400 mt-2 text-right">{pct}%</div>
      </div>
    );
  }

  // ============================================
  // CATALOG LOADED — Notion-style browser
  // ============================================
  return (
    <div className="space-y-3">
      {/* Stats bar */}
      {result && (
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-semibold text-green-700">{'\u2714'} {fichas.length} certificados</span>
          <span className="text-slate-300">|</span>
          <span>{familias.length} familias</span>
          <span className="text-slate-300">|</span>
          <span>{result.totalPages} p{'\u00E1'}ginas</span>
          <span className="text-slate-300">|</span>
          <span>{(result.duration / 1000).toFixed(1)}s</span>
          {result.parseErrors.length > 0 && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-amber-600">{'\u26A0'} {result.parseErrors.length} errores</span>
            </>
          )}
          <button onClick={() => { setFichas([]); setResult(null); setProgress(null); }}
            className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Cambiar PDF
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por c{'\u00F3'}digo, t{'\u00ED'}tulo o familia..."
          className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
        />
        <span className="absolute left-3 top-2.5 text-slate-400 text-sm">{'\uD83D\uDD0D'}</span>
        {search && (
          <span className="absolute right-3 top-2 text-xs text-slate-400">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Family groups */}
      <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
        {familias.map(fam => {
          const fichasFam = grouped.get(fam) || [];
          const isOpen = expandedFam === fam || !!search;

          return (
            <div key={fam}>
              {/* Family header */}
              <button
                onClick={() => setExpandedFam(isOpen && !search ? null : fam)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 transition-transform" style={{
                    display: 'inline-block',
                    transform: isOpen ? 'rotate(90deg)' : 'none'
                  }}>{'\u25B6'}</span>
                  <span className="text-sm font-medium text-slate-800">{fam}</span>
                </div>
                <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                  {fichasFam.length}
                </span>
              </button>

              {/* Fichas list */}
              {isOpen && (
                <div className="bg-white">
                  {fichasFam.map(ficha => {
                    const isActive = ficha.codigo === currentCodigo;
                    const totalHoras = ficha.modulos.reduce((a, m) => a + m.horas, 0);
                    const nivelStyle = NIVEL_STYLE[ficha.nivel] || NIVEL_STYLE[2];

                    return (
                      <div key={ficha.codigo}
                        onClick={() => selectFicha(ficha)}
                        className={`flex items-center gap-3 px-4 py-2 pl-10 cursor-pointer transition-colors border-l-2 ${
                          isActive
                            ? 'bg-green-50 border-green-500'
                            : 'border-transparent hover:bg-slate-50'
                        }`}>
                        {/* Code */}
                        <span className="text-xs font-mono font-semibold text-slate-700 w-24 flex-shrink-0">
                          {ficha.codigo}
                        </span>

                        {/* Title */}
                        <span className="text-sm text-slate-700 truncate flex-1">
                          {ficha.titulo || 'Sin t\u00EDtulo'}
                        </span>

                        {/* Properties */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Level badge */}
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${nivelStyle}`}>
                            N{ficha.nivel}
                          </span>
                          {/* Modules */}
                          <span className="text-[10px] text-slate-400">
                            {ficha.modulos.length} MF
                          </span>
                          {/* Hours */}
                          <span className="text-[10px] text-slate-500 font-medium w-12 text-right">
                            {totalHoras}h
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
