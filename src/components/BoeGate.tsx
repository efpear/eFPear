import { useState, useCallback } from 'react';

interface BoeGateProps {
  children: React.ReactNode;
}

/**
 * BoeGate -- Block B hard gate for Programacion Didactica tab.
 *
 * Uses native label+htmlFor pattern for reliable cross-browser file input.
 * Slice 6: file stored as File object. Slice 7 will parse it.
 */
export function BoeGate({ children }: BoeGateProps) {
  const [boeFile, setBoeFile]       = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('El BOE debe ser un archivo PDF');
      return;
    }
    setError(null);
    setBoeFile(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (!boeFile) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100">
              <span className="text-2xl">&#128217;</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Programacion Didactica &mdash; Anexo IV
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Para generar una programacion didactica fiable, es necesario subir el BOE del certificado.
            </p>
          </div>

          {/* Drop zone using label+htmlFor -- reliable cross-browser pattern */}
          <label
            htmlFor="boe-file-input"
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            className={'block mx-auto max-w-sm border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ' + (
              dragActive
                ? 'border-green-500 bg-green-50'
                : 'border-slate-300 hover:border-green-400 hover:bg-slate-50'
            )}
          >
            <input
              id="boe-file-input"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <div className="space-y-2">
              <div className="text-4xl">&#128196;</div>
              <p className="text-sm font-medium text-slate-700">Sube el PDF del BOE aqui</p>
              <p className="text-xs text-slate-400">Arrastra o haz clic para seleccionar</p>
            </div>
          </label>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 max-w-sm mx-auto text-center">
              {error}
            </p>
          )}

          <div className="text-[10px] text-slate-400 space-y-1 max-w-sm mx-auto border-t border-slate-100 pt-4">
            <p className="font-medium text-slate-500">Que es el BOE del certificado?</p>
            <p>El Real Decreto que regula el certificado de profesionalidad. Contiene capacidades, criterios de evaluacion, contenidos, espacios y equipamientos oficiales.</p>
            <p>Ejemplo: BOE-A-2011-9517 para HOTA0308 Recepcion en Alojamientos.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-green-600">&#10003;</span>
          <span className="text-xs font-medium text-green-800">
            BOE cargado: {boeFile.name}
          </span>
          <span className="text-[10px] text-green-600">
            ({(boeFile.size / 1024).toFixed(0)} KB) &middot; Parser activo en Slice 7
          </span>
        </div>
        <button
          onClick={() => setBoeFile(null)}
          className="text-xs text-green-600 hover:text-green-800 underline ml-4"
        >
          Cambiar BOE
        </button>
      </div>
      {children}
    </div>
  );
}
