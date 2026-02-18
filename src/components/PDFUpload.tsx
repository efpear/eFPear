import { useState, useCallback, useRef } from 'react';
import { parseFichaPDF, fichaACertificado } from '../engine/sepeParser';
import type { FichaSEPE } from '../engine/sepeParser';
import type { Certificado } from '../types';

interface PDFUploadProps {
  onCertificadoLoaded: (cert: Certificado, ficha: FichaSEPE) => void;
}

export function PDFUpload({ onCertificadoLoaded }: PDFUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parseResult, setParseResult] = useState<FichaSEPE | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Solo se aceptan archivos PDF');
      return;
    }

    setIsLoading(true);
    setError(null);
    setParseResult(null);

    try {
      const ficha = await parseFichaPDF(file);
      setParseResult(ficha);

      const cert = fichaACertificado(ficha);
      onCertificadoLoaded(cert, ficha);
    } catch (err: any) {
      setError(`Error al procesar el PDF: ${err.message || 'desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  }, [onCertificadoLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-green-500 bg-green-50'
            : isLoading
            ? 'border-amber-300 bg-amber-50'
            : 'border-slate-300 hover:border-green-400 hover:bg-green-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleInputChange}
          className="hidden"
        />

        {isLoading ? (
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100">
              <svg className="animate-spin h-6 w-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-amber-700">Procesando ficha SEPE...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100">
              <span className="text-2xl">{'\uD83D\uDCC4'}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Arrastra tu ficha SEPE aqu\u00ED
              </p>
              <p className="text-xs text-slate-500 mt-1">
                o haz clic para seleccionar un PDF
              </p>
            </div>
            <p className="text-xs text-slate-400">
              Ficha de Certificado de Profesionalidad (PDF)
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{'\u274C'} {error}</p>
        </div>
      )}

      {/* Parse result summary */}
      {parseResult && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{'\u2705'}</span>
            <h3 className="text-sm font-semibold text-green-800">Ficha procesada correctamente</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
            <div><span className="font-medium">C\u00F3digo:</span> {parseResult.codigo}</div>
            <div><span className="font-medium">Nivel:</span> {parseResult.nivel}</div>
            <div><span className="font-medium">Familia:</span> {parseResult.familiaProfesional}</div>
            <div><span className="font-medium">Horas totales:</span> {parseResult.horasTotales}h</div>
          </div>
          <div className="text-xs text-green-600">
            {parseResult.modulos.length} m\u00F3dulos formativos
            {parseResult.practicasModulo ? ' + pr\u00E1cticas' : ''}
            {' \u00B7 '}
            {parseResult.modulos.reduce((s, m) => s + m.unidadesFormativas.length, 0)} UFs detectadas
          </div>
          {parseResult._parseWarnings.length > 0 && (
            <div className="border-t border-green-200 pt-2 mt-2">
              <p className="text-xs font-medium text-amber-600">{'\u26A0\uFE0F'} Avisos:</p>
              {parseResult._parseWarnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-600">\u2022 {w}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
