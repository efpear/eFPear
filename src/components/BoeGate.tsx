import { useState, useCallback, useRef } from "react";

interface BoeGateProps {
  children: React.ReactNode;
}

/**
 * BoeGate — Block B hard gate for Programacion Didactica tab.
 *
 * The wizard is completely blocked until the user uploads a BOE PDF.
 * Once uploaded, the file is stored in state and the wizard is unlocked.
 * Slice 6: file stored as File object. Slice 7 will parse it.
 */
export function BoeGate({ children }: BoeGateProps) {
  const [boeFile, setBoeFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file.type !== "application/pdf") {
      setError("El BOE debe ser un archivo PDF");
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

  // BOE not yet uploaded — show hard gate
  if (!boeFile) {
    return (
      <div className="space-y-6">
        {/* Hard gate card */}
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 shadow-sm p-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100">
            <span className="text-3xl">📋</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Programacion Didactica — Anexo IV
            </h3>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
              Para generar una programacion didactica fiable, es necesario subir el BOE del certificado.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              El BOE es la fuente normativa oficial. Sin el, no es posible garantizar la literalidad exigida por la Directiva v2.2.
            </p>
          </div>

          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onClick={() => inputRef.current?.click()}
            className={`mx-auto max-w-sm border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${
              dragActive
                ? "border-green-500 bg-green-50"
                : "border-slate-300 hover:border-green-400 hover:bg-green-50/50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <div className="space-y-2">
              <div className="text-2xl">📄</div>
              <p className="text-sm font-medium text-slate-700">
                Sube el PDF del BOE aqui
              </p>
              <p className="text-xs text-slate-400">
                Arrastra o haz clic para seleccionar
              </p>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 max-w-sm mx-auto">
              {error}
            </p>
          )}

          <div className="text-[10px] text-slate-400 space-y-1 max-w-sm mx-auto text-left border-t border-slate-100 pt-4">
            <p className="font-medium text-slate-500">¿Que es el BOE del certificado?</p>
            <p>El Real Decreto que regula el certificado de profesionalidad. Contiene capacidades, criterios de evaluacion, contenidos, espacios y equipamientos oficiales.</p>
            <p>Ejemplo: BOE-A-2011-9517 para HOTA0308 Recepcion en Alojamientos.</p>
          </div>
        </div>
      </div>
    );
  }

  // BOE uploaded — show children (Wizard) with a dismissible header
  return (
    <div className="space-y-4">
      {/* BOE loaded indicator */}
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <span className="text-xs font-medium text-green-800">
            BOE cargado: {boeFile.name}
          </span>
          <span className="text-[10px] text-green-600">
            ({(boeFile.size / 1024).toFixed(0)} KB) · Parser activo en Slice 7
          </span>
        </div>
        <button
          onClick={() => setBoeFile(null)}
          className="text-xs text-green-600 hover:text-green-800 underline ml-4"
        >
          Cambiar BOE
        </button>
      </div>

      {/* Wizard content */}
      {children}
    </div>
  );
}
