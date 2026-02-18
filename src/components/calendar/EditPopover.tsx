/**
 * eFPear CertiCalc - Popover de Edición
 * Popover para editar día / mover sesión
 */

import { useState } from 'react';
import type { FechaISO, ModuloConSesiones } from '@/types';
import { formatearLargo } from '@/utils/date-utils';

interface EditPopoverProps {
  fecha: FechaISO;
  modulos: ModuloConSesiones[];
  onClose: () => void;
  onChangeDate: (moduloId: string, nuevaFecha: FechaISO) => void;
}

export function EditPopover({ fecha, modulos, onClose, onChangeDate }: EditPopoverProps) {
  const [selectedModulo, setSelectedModulo] = useState('');
  const [newDate, setNewDate] = useState(fecha);
  const modulosConSesiones = modulos.filter(m => m.sesiones.some(s => s.fecha === fecha));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">{formatearLargo(fecha)}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Sesiones programadas</h4>
            {modulosConSesiones.length === 0 ? (
              <p className="text-sm text-slate-500">No hay sesiones este día</p>
            ) : (
              <div className="space-y-2">
                {modulosConSesiones.map(modulo => {
                  const sesion = modulo.sesiones.find(s => s.fecha === fecha);
                  return (
                    <div key={modulo.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div>
                        <span className="font-medium text-slate-900">{modulo.codigo}</span>
                        <span className="text-sm text-slate-500 ml-2">{sesion?.horas}h</span>
                      </div>
                      <button onClick={() => setSelectedModulo(modulo.id)} className="text-sm text-green-600 hover:text-green-700">Mover</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {selectedModulo && (
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Mover sesión a nueva fecha</h4>
              <div className="flex gap-2">
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value as FechaISO)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500" />
                <button onClick={() => { onChangeDate(selectedModulo, newDate); setSelectedModulo(''); }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Confirmar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
