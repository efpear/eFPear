import { useState } from 'react';

/**
 * eFPear CertiCalc — App Shell
 * 
 * Tabs:
 * 1. Planificación temporal (calendario)
 * 2. Programación didáctica / Anexo IV (nuevo)
 */
export function App() {
  const [activeTab, setActiveTab] = useState<'calendario' | 'pedagogica'>('calendario');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍐</span>
              <div>
                <h1 className="text-lg font-bold text-slate-900">eFPear CertiCalc</h1>
                <p className="text-xs text-slate-500">Planificación formativa FP</p>
              </div>
            </div>
            <span className="efpear-badge bg-primary-100 text-primary-700">v2.2</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('calendario')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'calendario'
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              📅 Planificación temporal
            </button>
            <button
              onClick={() => setActiveTab('pedagogica')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pedagogica'
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              📚 Programación didáctica / Anexo IV
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calendario' ? (
          <div className="efpear-card p-8 text-center">
            <span className="text-4xl mb-4 block">📅</span>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Planificación temporal</h2>
            <p className="text-slate-500 mb-4">
              Calendario de sesiones, festivos y turnos.
              Selecciona un certificado y módulo para empezar.
            </p>
            <p className="text-sm text-slate-400">
              Motor: calendarEngine • 17 CCAA • Festivos insulares Canarias
            </p>
          </div>
        ) : (
          <div className="efpear-card p-8 text-center">
            <span className="text-4xl mb-4 block">📚</span>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Programación didáctica</h2>
            <p className="text-slate-500 mb-4">
              Generación automática de UAs, SdAs y Anexo IV.
              Selecciona un módulo para generar la programación.
            </p>
            <p className="text-sm text-slate-400">
              Motores: distributionEngine (Bloom) • curriculumEngine (7 pasos) • sdaEngine • anexoTemplates
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-slate-200 py-2">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400">
            eFPear CertiCalc v2.2 — GDPR by design • Sin cookies • Sin analytics • 100% local
          </p>
        </div>
      </footer>
    </div>
  );
}
