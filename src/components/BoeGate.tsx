import { useState, useCallback, useRef } from 'react';
import { FileText } from 'lucide-react';

interface BoeGateProps {
  children: React.ReactNode;
}

/**
 * BoeGate -- Block B hard gate for Programacion Didactica tab.
 * OAT redesign: Lucide icons, oat-card drop zone, CSS vars.
 */
export function BoeGate({ children }: BoeGateProps) {
  const [boeFile, setBoeFile]       = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const fileInputRef                 = useRef<HTMLInputElement>(null);

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
      <div className="space-y-3 max-w-xl mx-auto">
        <div className="oat-card" style={{ padding: 0 }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Programacion Didactica &mdash; Anexo IV
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Para generar una programacion didactica fiable es necesario subir el BOE del certificado.
            </p>
          </div>

          <div
            role="button"
            tabIndex={0}
            aria-label="Subir BOE PDF"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            className="mx-5 my-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-12 cursor-pointer transition-colors"
            style={{
              borderColor: dragActive ? 'var(--primary)' : 'var(--border)',
              backgroundColor: dragActive ? 'color-mix(in srgb, var(--primary) 5%, transparent)' : 'transparent',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <FileText size={32} style={{ color: dragActive ? 'var(--primary)' : 'var(--muted-foreground)' }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Arrastra el PDF del BOE aqui
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Arrastra o haz clic para seleccionar
              </p>
            </div>
          </div>

          {error && (
            <div className="mx-5 mb-4 px-3 py-2 rounded-lg text-xs border" style={{
              backgroundColor: 'color-mix(in srgb, var(--danger) 8%, transparent)',
              borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)',
              color: 'var(--danger)',
            }}>
              {error}
            </div>
          )}

          <div className="px-5 pb-5">
            <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              El BOE debe contener el texto completo del certificado de profesionalidad con
              capacidades, criterios de evaluacion, contenidos, duracion de UFs y requisitos de espacios.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // BOE uploaded: show file badge and render children
  return (
    <div className="space-y-3">
      <div className="oat-card" style={{ padding: '0.75rem 1rem' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
              {boeFile.name}
            </span>
            <span className="oat-badge secondary">{(boeFile.size / 1024).toFixed(0)} KB</span>
          </div>
          <button
            onClick={() => setBoeFile(null)}
            className="text-xs cursor-pointer"
            style={{ background: 'none', border: 'none', padding: '0.25rem', color: 'var(--muted-foreground)' }}
          >
            Cambiar
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
