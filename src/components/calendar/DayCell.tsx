/**
 * eFPear CertiCalc - Celda de Día
 * Celda individual del calendario
 */

import React from 'react';
import type { FechaISO, ModuloConSesiones } from '@/types';
import { obtenerDia, esFinDeSemana } from '@/utils/date-utils';

interface DayCellProps {
  fecha: FechaISO;
  modulos: ModuloConSesiones[];
  festivos: Set<FechaISO>;
  esMesActual: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export function DayCell({ fecha, modulos, festivos, esMesActual, isSelected = false, onClick }: DayCellProps) {
  const dia = obtenerDia(fecha);
  const esFestivo = festivos.has(fecha);
  const esFinSemana = esFinDeSemana(fecha);
  const sesionesHoy = modulos.flatMap(m => m.sesiones.filter(s => s.fecha === fecha).map(s => ({ ...s, modulo: m })));
  const horasTotales = sesionesHoy.reduce((sum, s) => sum + s.horas, 0);

  return (
    <div
      onClick={onClick}
      className={`min-h-[80px] p-2 cursor-pointer transition-all
        ${!esMesActual ? 'bg-slate-50 text-slate-400' : 'bg-white'}
        ${isSelected ? 'ring-2 ring-green-500 ring-inset' : ''}
        ${esFestivo ? 'bg-red-50' : ''}
        ${esFinSemana && !esFestivo ? 'bg-slate-50' : ''}
        hover:bg-slate-50`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${esFestivo ? 'text-red-600' : esFinSemana ? 'text-slate-400' : 'text-slate-700'}`}>{dia}</span>
        {esFestivo && <span className="text-xs text-red-500" title="Festivo">\u{1F389}</span>}
      </div>
      {sesionesHoy.length > 0 && (
        <div className="mt-1 space-y-1">
          {sesionesHoy.slice(0, 3).map((sesion, idx) => (
            <div key={idx} className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-800 truncate" title={`${sesion.modulo.codigo}: ${sesion.horas}h`}>
              {sesion.modulo.codigo}
            </div>
          ))}
          {sesionesHoy.length > 3 && <div className="text-xs text-slate-500 px-1">+{sesionesHoy.length - 3} más</div>}
        </div>
      )}
      {horasTotales > 0 && <div className="mt-1 text-xs text-slate-500">{horasTotales}h</div>}
    </div>
  );
}
