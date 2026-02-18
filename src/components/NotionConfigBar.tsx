import { useState } from 'react';
import type {
  CCAA,
  IslaCanaria,
} from '../engine/calendarEngine';

interface NotionConfigBarProps {
  ccaa: CCAA;
  isla: IslaCanaria;
  turno: 'manana' | 'tarde' | 'completo';
  fechaInicio: string;
  onCcaaChange: (v: CCAA) => void;
  onIslaChange: (v: IslaCanaria) => void;
  onTurnoChange: (v: 'manana' | 'tarde' | 'completo') => void;
  onFechaChange: (v: string) => void;
}

const CCAA_MAP: Record<string, string> = {
  canarias: 'Canarias', andalucia: 'Andaluc\u00EDa', madrid: 'Madrid', cataluna: 'Catalu\u00F1a',
  valencia: 'Valencia', galicia: 'Galicia', pais_vasco: 'Pa\u00EDs Vasco', aragon: 'Arag\u00F3n',
  castilla_leon: 'Castilla y Le\u00F3n', castilla_mancha: 'Castilla-La Mancha', asturias: 'Asturias',
  baleares: 'Baleares', cantabria: 'Cantabria', extremadura: 'Extremadura', murcia: 'Murcia',
  navarra: 'Navarra', rioja: 'La Rioja', ceuta: 'Ceuta', melilla: 'Melilla',
};

const ISLA_MAP: Record<string, string> = {
  tenerife: 'Tenerife', gran_canaria: 'Gran Canaria', lanzarote: 'Lanzarote',
  fuerteventura: 'Fuerteventura', la_palma: 'La Palma', la_gomera: 'La Gomera', el_hierro: 'El Hierro',
};

const TURNO_MAP: Record<string, string> = {
  manana: 'Ma\u00F1ana (5h)', tarde: 'Tarde (5h)', completo: 'Completo (8h)',
};

export function NotionConfigBar({
  ccaa, isla, turno, fechaInicio,
  onCcaaChange, onIslaChange, onTurnoChange, onFechaChange,
}: NotionConfigBarProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const toggle = (id: string) => setOpenFilter(openFilter === id ? null : id);

  return (
    <div className="flex items-center gap-2 py-2 flex-wrap">
      <span className="text-xs text-slate-400 mr-1">{'\u2699'} Filtros</span>

      {/* CCAA pill */}
      <FilterPill
        label="CCAA"
        value={CCAA_MAP[ccaa]}
        isOpen={openFilter === 'ccaa'}
        onToggle={() => toggle('ccaa')}
      >
        <div className="py-1 max-h-48 overflow-y-auto">
          {Object.entries(CCAA_MAP).map(([k, v]) => (
            <button key={k}
              onClick={() => { onCcaaChange(k as CCAA); setOpenFilter(null); }}
              className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors ${
                k === ccaa ? 'text-green-700 font-medium bg-green-50' : 'text-slate-700'
              }`}>
              {v}
            </button>
          ))}
        </div>
      </FilterPill>

      {/* Isla pill (only for Canarias) */}
      {ccaa === 'canarias' && (
        <FilterPill
          label="Isla"
          value={ISLA_MAP[isla]}
          isOpen={openFilter === 'isla'}
          onToggle={() => toggle('isla')}
        >
          <div className="py-1">
            {Object.entries(ISLA_MAP).map(([k, v]) => (
              <button key={k}
                onClick={() => { onIslaChange(k as IslaCanaria); setOpenFilter(null); }}
                className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors ${
                  k === isla ? 'text-green-700 font-medium bg-green-50' : 'text-slate-700'
                }`}>
                {v}
              </button>
            ))}
          </div>
        </FilterPill>
      )}

      {/* Turno pill */}
      <FilterPill
        label="Turno"
        value={TURNO_MAP[turno]}
        isOpen={openFilter === 'turno'}
        onToggle={() => toggle('turno')}
      >
        <div className="py-1">
          {Object.entries(TURNO_MAP).map(([k, v]) => (
            <button key={k}
              onClick={() => { onTurnoChange(k as any); setOpenFilter(null); }}
              className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors ${
                k === turno ? 'text-green-700 font-medium bg-green-50' : 'text-slate-700'
              }`}>
              {v}
            </button>
          ))}
        </div>
      </FilterPill>

      {/* Fecha pill */}
      <FilterPill
        label="Inicio"
        value={fechaInicio}
        isOpen={openFilter === 'fecha'}
        onToggle={() => toggle('fecha')}
      >
        <div className="p-3">
          <input type="date" value={fechaInicio}
            onChange={e => { onFechaChange(e.target.value); setOpenFilter(null); }}
            className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </FilterPill>
    </div>
  );
}

// ============================================
// FILTER PILL (Notion-style dropdown trigger)
// ============================================
function FilterPill({ label, value, isOpen, onToggle, children }: {
  label: string;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button onClick={onToggle}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
          isOpen
            ? 'bg-green-50 text-green-700 ring-1 ring-green-300'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}>
        <span className="text-slate-400">{label}:</span>
        <span>{value}</span>
        <span className="text-slate-400 ml-0.5">{isOpen ? '\u25B2' : '\u25BC'}</span>
      </button>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg border border-slate-200 shadow-lg z-50">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
