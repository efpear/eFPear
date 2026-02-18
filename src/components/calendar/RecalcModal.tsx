/**
 * eFPear CertiCalc - Modal de Recálculo
 * Modal de confirmación para recálculo en cascada
 */


interface RecalcModalProps {
  isOpen: boolean;
  afectados: number;
  moduloNombre: string;
  fechaAnterior: string;
  fechaNueva: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RecalcModal({ isOpen, afectados, moduloNombre, fechaAnterior, fechaNueva, onConfirm, onCancel }: RecalcModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">⚠️ Confirmar recálculo</h3>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-slate-700">Estás cambiando la fecha de <strong>{moduloNombre}</strong>:</p>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <span className="text-slate-500 line-through">{fechaAnterior}</span>
            <span className="mx-2 text-slate-400">→</span>
            <span className="text-green-600 font-medium">{fechaNueva}</span>
          </div>
          {afectados > 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800"><strong>Atención:</strong> Este cambio afectará a <strong>{afectados - 1}</strong> módulos posteriores que se recalcularán en cascada.</p>
            </div>
          )}
          <p className="text-sm text-slate-500">¿Deseas continuar con el recálculo?</p>
        </div>
        <div className="flex gap-2 p-4 border-t border-slate-200">
          <button onClick={onCancel} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Recalcular</button>
        </div>
      </div>
    </div>
  );
}
