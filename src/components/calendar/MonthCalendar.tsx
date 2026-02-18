/**
 * eFPear CertiCalc - Calendario Mensual
 * Grid mensual de calendario
 */

import type { FechaISO, ModuloConSesiones } from '@/types';
import { obtenerDiaSemana, primerDiaMes, restarDias, sumarDias, MESES_ES, DIAS_ES } from '@/utils/date-utils';
import { DayCell } from './DayCell';

interface MonthCalendarProps {
  anio: number;
  mes: number;
  modulos: ModuloConSesiones[];
  festivos: Set<FechaISO>;
  onDayClick?: (fecha: FechaISO) => void;
  fechaSeleccionada?: FechaISO;
}

export function MonthCalendar({ anio, mes, modulos, festivos, onDayClick, fechaSeleccionada }: MonthCalendarProps) {
  const primerDia = primerDiaMes(`${anio}-${String(mes).padStart(2, '0')}-01` as FechaISO);
  const primerDiaSemana = obtenerDiaSemana(primerDia);
  const diasAnteriores: FechaISO[] = [];
  for (let i = primerDiaSemana; i > 0; i--) diasAnteriores.push(restarDias(primerDia, i));
  const diasMes: FechaISO[] = [];
  let actual = primerDia;
  while (new Date(actual).getMonth() + 1 === mes) { diasMes.push(actual); actual = sumarDias(actual, 1); }
  const ultimoDiaSemana = obtenerDiaSemana(diasMes[diasMes.length - 1]!);
  const diasSiguientes: FechaISO[] = [];
  for (let i = 1; i < 7 - ultimoDiaSemana; i++) diasSiguientes.push(sumarDias(diasMes[diasMes.length - 1]!, i));
  const todosLosDias = [...diasAnteriores, ...diasMes, ...diasSiguientes];
  const semanas: FechaISO[][] = [];
  for (let i = 0; i < todosLosDias.length; i += 7) semanas.push(todosLosDias.slice(i, i + 7));

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">{MESES_ES[mes - 1]} {anio}</h3>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-200">
        {DIAS_ES.map(dia => (<div key={dia} className="py-2 text-center text-sm font-medium text-slate-500">{dia}</div>))}
      </div>
      <div className="divide-y divide-slate-100">
        {semanas.map((semana, idx) => (
          <div key={idx} className="grid grid-cols-7 divide-x divide-slate-100">
            {semana.map(fecha => (
              <DayCell key={fecha} fecha={fecha} modulos={modulos} festivos={festivos}
                esMesActual={new Date(fecha).getMonth() + 1 === mes}
                isSelected={fecha === fechaSeleccionada}
                onClick={() => onDayClick?.(fecha)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
