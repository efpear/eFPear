import { useState, useMemo, useCallback } from 'react';
import type { FichaSEPE } from './engine/sepeParser';
import { EligibilityCheck } from './components/EligibilityCheck';
import { obtenerDatosMF } from './data/boeRegistry';
import { HOTA0308_DATA } from './data/boeDataHOTA0308';
import type { BoeCertificadoData } from './types/boe';
import type { Certificado, Capacidad } from './types';
import { ProgramacionWizard } from './components/ProgramacionWizard';
import { FLAGS } from './config/flags';
import { PlanningDashboard } from './components/PlanningDashboard';
import { BoeGate } from './components/BoeGate';

// ============================================
// DEMO DATA
// ============================================
function boeToAppCert(boe: BoeCertificadoData): Certificado {
  return {
    codigo: boe.codigo,
    nombre: boe.denominacion,
    nivel: boe.nivel as 1 | 2 | 3,
    modulos: boe.modulos.map(mf => ({
      codigo: mf.codigoMF,
      titulo: mf.nombreMF,
      horas: mf.duracion,
      capacidades: mf.unidadesFormativas.flatMap(uf =>
        uf.capacidades.map(cap => ({
          id: cap.codigo,
          descripcion: cap.texto,
          criterios: cap.criterios.map(ce => ({ id: ce.codigo, descripcion: ce.texto })),
        }))
      ),
      contenidos: mf.unidadesFormativas.flatMap(uf =>
        uf.contenidos.map(cont => ({ id: cont.numero, descripcion: cont.titulo }))
      ),
    })),
  };
}

const GOLDEN_CERT = boeToAppCert(HOTA0308_DATA);

const DEMO_CERT: any = {
  codigo: 'HOTR0208',
  nombre: 'Operaciones Basicas de Cocina',
  nivel: 2,
  modulos: [
    {
      codigo: 'MF0255_1', titulo: 'Aprovisionamiento, preelaboracion y conservacion culinarios',
      horas: 120,
      capacidades: [
        { id: 'C1', descripcion: 'Recepcionar materias primas', criterios: [
          { id: 'CE1.1', descripcion: 'Recepcionar mercancias verificando su correspondencia' },
          { id: 'CE1.2', descripcion: 'Clasificar generos segun criterios de almacenamiento' },
        ]},
        { id: 'C2', descripcion: 'Almacenar materias primas', criterios: [
          { id: 'CE2.1', descripcion: 'Identificar las areas de almacenamiento' },
          { id: 'CE2.2', descripcion: 'Ordenar almacenes aplicando criterios FIFO' },
        ]},
      ] as Capacidad[],
      contenidos: [],
    },
    {
      codigo: 'MF0256_1', titulo: 'Elaboracion culinaria basica',
      horas: 150,
      capacidades: [
        { id: 'C1', descripcion: 'Realizar elaboraciones culinarias basicas', criterios: [
          { id: 'CE1.1', descripcion: 'Clasificar y describir las elaboraciones' },
          { id: 'CE1.2', descripcion: 'Realizar fondos, fumet, caldos segun protocolo' },
        ]},
      ] as Capacidad[],
      contenidos: [],
    },
    {
      codigo: 'MP0015', titulo: 'Modulo de practicas profesionales no laborales',
      horas: 80,
      capacidades: [
        { id: 'C1', descripcion: 'Participar en las operaciones de aprovisionamiento', criterios: [
          { id: 'CE1.1', descripcion: 'Colaborar en operaciones de recepcion y almacenamiento' },
        ]},
      ] as Capacidad[],
      contenidos: [],
    },
  ],
};

type Tab = 'elegibilidad' | 'calendario' | 'pedagogica';
type DataSource = 'demo' | 'uploaded';

// ============================================
// APP
// ============================================
export function App() {
  const [tab, setTab] = useState<Tab>('elegibilidad');
  const [selectedMod, setSelectedMod] = useState(0);
  const [dataSource, setDataSource] = useState<DataSource>('demo');
  const [activeCert, setActiveCert] = useState<Certificado>(DEMO_CERT);
  const [fichaInfo, setFichaInfo] = useState<FichaSEPE | null>(null);
  const [selectedUF, setSelectedUF] = useState<string>('UF0048');

  const handleCertificadoLoaded = useCallback((cert: Certificado, ficha: FichaSEPE) => {
    setActiveCert(cert);
    setFichaInfo(ficha);
    setDataSource('uploaded');
    setSelectedMod(0);
  }, []);

  const loadGoldenCase = useCallback(() => {
    setActiveCert(GOLDEN_CERT);
    setFichaInfo(null);
    setDataSource('uploaded');
    setSelectedMod(GOLDEN_CERT.modulos.findIndex(m => m.codigo === 'MF0265_3'));
  }, []);

  const resetToDemo = useCallback(() => {
    setActiveCert(DEMO_CERT);
    setFichaInfo(null);
    setDataSource('demo');
    setSelectedMod(0);
  }, []);

  // Current module + BOE data (for pedagogica tab)
  const currentMod = activeCert.modulos[selectedMod];
  const boeData = useMemo(() => {
    if (!currentMod) return null;
    return obtenerDatosMF(currentMod.codigo) ?? null;
  }, [currentMod]);

  // Unused fichaInfo reference kept to satisfy handleCertificadoLoaded type
  void fichaInfo;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/logo-icon-color.png" alt="eFPear" className="h-10 w-10" />
              <div>
                <h1 className="text-lg font-bold text-slate-900">eFPear <span className="text-green-700">CertiCalc</span></h1>
                <p className="text-xs text-slate-500">Planificacion formativa FP</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                v2.2 beta
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                dataSource === 'uploaded' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {dataSource === 'uploaded' ? activeCert.codigo : 'Demo'}
              </span>
              {dataSource === 'uploaded' && (
                <button onClick={resetToDemo} className="text-xs text-slate-500 hover:text-slate-700 underline">
                  Volver a demo
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6">
          {[
            { id: 'elegibilidad' as Tab, icon: '🚦', label: 'Elegibilidad' },
            { id: 'calendario' as Tab, icon: '📅', label: 'Planificacion temporal' },
            { id: 'pedagogica' as Tab, icon: '📚', label: 'Programacion didactica' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-green-600 text-green-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {tab === 'elegibilidad' ? (
          <EligibilityCheck
            onPlanificar={(_codigoMF, _nombreMF) => {
              setTab('calendario');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : tab === 'calendario' ? (
          // Block A: Planning Dashboard only -- self-contained
          FLAGS.ENABLE_PLANNING_DASHBOARD ? (
            <PlanningDashboard />
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-6 py-8 text-center">
              <p className="text-sm text-slate-600">Planificacion temporal no disponible</p>
            </div>
          )
        ) : (
          <div className="space-y-6">
            {/* Block B: BOE Gate + Programacion Wizard */}
            {FLAGS.ENABLE_BOE_GATE ? (
              <BoeGate>
                <div className="space-y-6">
                  {/* Module selector -- loads cert for wizard context */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-semibold text-slate-900 mb-4">Seleccionar modulo formativo</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeCert.modulos.map((m, i) => (
                        <button key={m.codigo} onClick={() => setSelectedMod(i)}
                          className={`rounded-lg border-2 p-3 text-left transition-all ${
                            selectedMod === i
                              ? 'border-green-600 bg-green-50 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}>
                          <div className="text-sm font-semibold text-slate-900">{m.codigo}</div>
                          <div className="text-xs text-slate-500 mt-1 line-clamp-2">{m.titulo}</div>
                          <div className="text-xs font-medium text-green-700 mt-2">{m.horas}h</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wizard */}
                  {FLAGS.ENABLE_PROGRAMACION_WIZARD && currentMod && boeData ? (() => {
                    const ufs = boeData.unidadesFormativas;
                    return (
                      <div className="space-y-6">
                        {ufs.length > 1 && (
                          <div className="flex gap-2 flex-wrap">
                            {ufs.map(uf => (
                              <button key={uf.codigo}
                                onClick={() => setSelectedUF(uf.codigo)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                                  selectedUF === uf.codigo
                                    ? 'border-green-600 bg-green-50 text-green-700'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}>
                                {uf.codigo} ({uf.duracion}h)
                              </button>
                            ))}
                          </div>
                        )}
                        {(() => {
                          const activeUF = ufs.find(uf => uf.codigo === selectedUF) || ufs[0];
                          if (!activeUF) return null;
                          return (
                            <ProgramacionWizard
                              key={activeUF.codigo}
                              uf={activeUF}
                              moduloCodigo={currentMod.codigo}
                              moduloNombre={currentMod.titulo}
                              moduloHoras={currentMod.horas}
                              certificadoCodigo={activeCert.codigo}
                              certificadoNombre={activeCert.nombre}
                              certificadoDuracion={activeCert.modulos.reduce((s: number, m: any) => s + m.horas, 0)}
                            />
                          );
                        })()}
                      </div>
                    );
                  })() : (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-6 py-8 text-center space-y-4">
                      <div className="text-3xl">📋</div>
                      <h3 className="text-sm font-semibold text-slate-800">Wizard de Programacion Didactica</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        El modulo actual ({currentMod?.codigo}) no tiene datos BOE cargados.
                      </p>
                      <button onClick={loadGoldenCase}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-sm transition-colors">
                        Probar con HOTA0308 (Golden Case)
                      </button>
                      <p className="text-[10px] text-slate-400">
                        Golden Case: HOTA0308 · MF0265_3 · UF0048 + UF0049
                      </p>
                    </div>
                  )}
                </div>
              </BoeGate>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-6 py-8 text-center">
                <p className="text-sm text-slate-600">Programacion Didactica desactivada</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-slate-200 py-2 z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400">
            eFPear CertiCalc v2.2 · {dataSource === 'uploaded' ? activeCert.codigo : 'Demo'} · GDPR by design · 100% local
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Herramienta orientativa de uso privado · Sin valor legal ni administrativo
          </p>
        </div>
      </footer>
    </div>
  );
}
