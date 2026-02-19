import { useState, useMemo, useCallback } from 'react';
import {
  calcularModulosCascada,
  calcularMetricas,
  verificarCoherencia,
} from './engine/calendarEngine';
import type {
  CCAA,
  IslaCanaria,
  ConfiguracionCalendario,
} from './engine/calendarEngine';
import { DEFAULT_TURNOS } from './engine/calendarEngine';
import { PDFUpload } from './components/PDFUpload';
import { CatalogBrowser } from './components/CatalogBrowser';
import { NotionPlanning } from './components/NotionPlanning';
import { NotionConfigBar } from './components/NotionConfigBar';
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
// DEMO DATA — HOTR0208 Operaciones Básicas de Cocina
// ============================================
/** Convert BOE certificado data to the app's Certificado type for golden case testing */
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
          criterios: cap.criterios.map(ce => ({
            id: ce.codigo,
            descripcion: ce.texto,
          })),
        }))
      ),
      contenidos: mf.unidadesFormativas.flatMap(uf =>
        uf.contenidos.map(cont => ({
          id: cont.numero,
          descripcion: cont.titulo,
        }))
      ),
    })),
  };
}

const GOLDEN_CERT = boeToAppCert(HOTA0308_DATA);

const DEMO_CERT: any = {
  codigo: 'HOTR0208',
  nombre: 'Operaciones Básicas de Cocina',
  nivel: 2,
  modulos: [
    {
      codigo: 'MF0255_1', titulo: 'Aprovisionamiento, preelaboración y conservación culinarios',
      horas: 120,
      capacidades: [
        { id: 'C1', descripcion: 'Recepcionar materias primas para su posterior almacenamiento y distribución', criterios: [
          { id: 'CE1.1', descripcion: 'Recepcionar mercancías verificando su correspondencia' },
          { id: 'CE1.2', descripcion: 'Clasificar géneros según criterios de almacenamiento' },
        ]},
        { id: 'C2', descripcion: 'Almacenar materias primas y regenerar las que procedan', criterios: [
          { id: 'CE2.1', descripcion: 'Identificar las áreas de almacenamiento' },
          { id: 'CE2.2', descripcion: 'Ordenar almacenes aplicando criterios FIFO' },
        ]},
        { id: 'C3', descripcion: 'Preelaborar alimentos según instrucciones recibidas', criterios: [
          { id: 'CE3.1', descripcion: 'Seleccionar útiles, herramientas y equipos de trabajo' },
          { id: 'CE3.2', descripcion: 'Ejecutar técnicas de limpieza, corte y preparación' },
        ]},
        { id: 'C4', descripcion: 'Aplicar métodos sencillos de conservación', criterios: [
          { id: 'CE4.1', descripcion: 'Identificar los métodos de conservación según género' },
          { id: 'CE4.2', descripcion: 'Realizar procedimientos de envasado y conservación' },
        ]},
      ] as Capacidad[],
      contenidos: [],
    },
    {
      codigo: 'MF0256_1', titulo: 'Elaboración culinaria básica',
      horas: 150,
      capacidades: [
        { id: 'C1', descripcion: 'Realizar elaboraciones culinarias básicas de múltiples aplicaciones', criterios: [
          { id: 'CE1.1', descripcion: 'Clasificar y describir las elaboraciones' },
          { id: 'CE1.2', descripcion: 'Realizar fondos, fumet, caldos según protocolo' },
        ]},
        { id: 'C2', descripcion: 'Preparar y presentar elaboraciones culinarias sencillas', criterios: [
          { id: 'CE2.1', descripcion: 'Interpretar fichas técnicas de elaboración' },
          { id: 'CE2.2', descripcion: 'Realizar técnicas culinarias básicas' },
        ]},
        { id: 'C3', descripcion: 'Elaborar platos combinados y aperitivos sencillos', criterios: [
          { id: 'CE3.1', descripcion: 'Identificar las elaboraciones más significativas' },
          { id: 'CE3.2', descripcion: 'Realizar platos combinados y aperitivos' },
        ]},
      ] as Capacidad[],
      contenidos: [],
    },
    {
      codigo: 'MP0015', titulo: 'Módulo de prácticas profesionales no laborales',
      horas: 80,
      capacidades: [
        { id: 'C1', descripcion: 'Participar en las operaciones de aprovisionamiento', criterios: [
          { id: 'CE1.1', descripcion: 'Colaborar en operaciones de recepción y almacenamiento' },
        ]},
        { id: 'C2', descripcion: 'Colaborar en preelaboraciones y elaboraciones culinarias', criterios: [
          { id: 'CE2.1', descripcion: 'Realizar tareas básicas de cocina bajo supervisión' },
        ]},
      ] as Capacidad[],
      contenidos: [],
    },
  ],
};

const CCAA_OPTIONS: { value: CCAA; label: string }[] = [
  { value: 'canarias', label: 'Canarias' },
  { value: 'andalucia', label: 'Andalucía' },
  { value: 'madrid', label: 'Madrid' },
  { value: 'cataluna', label: 'Cataluña' },
  { value: 'valencia', label: 'Valencia' },
  { value: 'galicia', label: 'Galicia' },
  { value: 'pais_vasco', label: 'País Vasco' },
  { value: 'aragon', label: 'Aragón' },
  { value: 'castilla_leon', label: 'Castilla y León' },
  { value: 'castilla_mancha', label: 'Castilla-La Mancha' },
  { value: 'asturias', label: 'Asturias' },
  { value: 'baleares', label: 'Baleares' },
  { value: 'cantabria', label: 'Cantabria' },
  { value: 'extremadura', label: 'Extremadura' },
  { value: 'murcia', label: 'Murcia' },
  { value: 'navarra', label: 'Navarra' },
  { value: 'rioja', label: 'La Rioja' },
  { value: 'ceuta', label: 'Ceuta' },
  { value: 'melilla', label: 'Melilla' },
];

const ISLA_OPTIONS: { value: IslaCanaria; label: string }[] = [
  { value: 'tenerife', label: 'Tenerife' },
  { value: 'gran_canaria', label: 'Gran Canaria' },
  { value: 'lanzarote', label: 'Lanzarote' },
  { value: 'fuerteventura', label: 'Fuerteventura' },
  { value: 'la_palma', label: 'La Palma' },
  { value: 'la_gomera', label: 'La Gomera' },
  { value: 'el_hierro', label: 'El Hierro' },
];

type Tab = 'elegibilidad' | 'calendario' | 'pedagogica';
type DataSource = 'demo' | 'uploaded';

// ============================================
// APP
// ============================================
export function App() {
  const [tab, setTab] = useState<Tab>('elegibilidad');
  const [ccaa, setCcaa] = useState<CCAA>('canarias');
  const [isla, setIsla] = useState<IslaCanaria>('tenerife');
  const [turno, setTurno] = useState<'manana' | 'tarde' | 'completo'>('manana');
  const [fechaInicio, setFechaInicio] = useState('2025-09-15');
  const [selectedMod, setSelectedMod] = useState(0);
  const [dataSource, setDataSource] = useState<DataSource>('demo');
  const [activeCert, setActiveCert] = useState<Certificado>(DEMO_CERT);
  const [fichaInfo, setFichaInfo] = useState<FichaSEPE | null>(null);
  const [eligibilityContext, setEligibilityContext] = useState<{ codigoMF: string; nombreMF: string } | null>(null);
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

  // Calendar engine
  const calConfig: ConfiguracionCalendario = useMemo(() => ({
    fechaInicio: fechaInicio as any,
    turnos: DEFAULT_TURNOS[turno],
    regional: { ccaa, isla: ccaa === 'canarias' ? isla : undefined },
    anioAcademico: parseInt(fechaInicio.substring(0, 4)),
  }), [ccaa, isla, turno, fechaInicio]);

  const modulosCascada = useMemo(() =>
    calcularModulosCascada(activeCert.modulos.map((m, i) => ({ id: `mod-${i}`, ...m })), calConfig),
  [activeCert, calConfig]);

  const metricas = useMemo(() => calcularMetricas(modulosCascada, calConfig), [modulosCascada, calConfig]);
  const coherencia = useMemo(() => verificarCoherencia(modulosCascada, calConfig), [modulosCascada, calConfig]);

  // Current module reference
  const currentMod = activeCert.modulos[selectedMod];

  // BOE data lookup for real capacidades/criterios/contenidos
  const boeData = useMemo(() => {
    if (!currentMod) return null;
    // Try to find BOE data for this MF's UFs
    const mfData = obtenerDatosMF(currentMod.codigo);
    if (mfData) return mfData;
    return null;
  }, [currentMod]);


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
                <p className="text-xs text-slate-500">Planificación formativa FP</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                v2.2 beta
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                dataSource === 'uploaded' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {dataSource === 'uploaded' ? activeCert.codigo : `Demo: ${activeCert.codigo}`}
              </span>
              {dataSource === 'uploaded' && (
                <button onClick={resetToDemo}
                  className="text-xs text-slate-500 hover:text-slate-700 underline">
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
            { id: 'calendario' as Tab, icon: '📅', label: 'Planificación temporal' },
            { id: 'pedagogica' as Tab, icon: '📚', label: 'Programación didáctica' },
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
              onPlanificar={(codigoMF, nombreMF) => {
                // Slice 2: Eligibility -> Calendar bridge with context
                setEligibilityContext({ codigoMF, nombreMF });
                setTab('calendario');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
        ) : tab === 'calendario' ? (
          <div className="space-y-4">
            {/* Block A: Planning Dashboard — PDF upload for imparticion dates */}
            {FLAGS.ENABLE_PLANNING_DASHBOARD && (
              <PlanningDashboard fechaInicio={fechaInicio} />
            )}

            {/* PDF Upload for calendar engine — collapsible */}
            {/* Catalog Browser OR single ficha upload */}
            <details className="group" open={dataSource !== 'uploaded'}>
              <summary className="flex items-center gap-2 cursor-pointer text-sm text-slate-500 hover:text-slate-700 py-2">
                <span className="transition-transform group-open:rotate-90">▶</span>
                {dataSource === 'uploaded' ? `${fichaInfo?.codigo || 'Certificado'} cargado — cambiar` : 'Cargar certificado(s)'}
              </summary>
              <div className="mt-2 space-y-3">
                {/* Bulk catalog (multi-ficha PDF) */}
                <CatalogBrowser
                  onCertificadoSelected={(cert, ficha) => handleCertificadoLoaded(cert, ficha)}
                  currentCodigo={fichaInfo?.codigo}
                />
                {/* Single ficha fallback */}
                <details className="group/single">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                    → O cargar ficha individual
                  </summary>
                  <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <PDFUpload onCertificadoLoaded={handleCertificadoLoaded} />
                  </div>
                </details>
              </div>
            </details>

            {/* Slice 2: Eligibility context banner */}
            {eligibilityContext && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-lg">🚦</span>
                  <div>
                    <span className="text-sm font-semibold text-green-800">
                      {eligibilityContext.codigoMF}
                    </span>
                    <span className="text-sm text-green-700 ml-1.5">
                      {eligibilityContext.nombreMF}
                    </span>
                    <p className="text-xs text-green-600 mt-0.5">
                      Resultado de elegibilidad positivo — configura fechas y turno para este módulo
                    </p>
                  </div>
                </div>
                <button onClick={() => setEligibilityContext(null)}
                  className="text-xs text-green-600 hover:text-green-800 underline flex-shrink-0 ml-4">
                  ✕ Cerrar
                </button>
              </div>
            )}

            {/* Notion-style config pills */}
            <NotionConfigBar
              ccaa={ccaa} isla={isla} turno={turno} fechaInicio={fechaInicio}
              onCcaaChange={setCcaa} onIslaChange={setIsla}
              onTurnoChange={setTurno} onFechaChange={setFechaInicio}
            />

            {/* Notion-style planning views */}
            <NotionPlanning
              modulosCascada={modulosCascada}
              modulos={activeCert.modulos}
              metricas={metricas}
              coherencia={coherencia}
            />

            {/* Coherence alerts */}
            {coherencia.alertas.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-500">⚠</span>
                  <span className="text-xs font-semibold text-amber-800">Alertas de coherencia</span>
                </div>
                {coherencia.alertas.map((a, i) => (
                  <div key={i} className="text-xs text-amber-700 py-0.5 pl-5">
                    {a.mensaje}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Block B: BOE Gate — hard gate for Programacion Didactica */}
            {FLAGS.ENABLE_BOE_GATE ? (
              <BoeGate>
                <div className="space-y-6">
            {/* Module Selector */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Seleccionar módulo formativo</h2>
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
                    <div className="text-xs font-medium text-green-700 mt-2">{m.horas}h · {m.capacidades.length} capacidades</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Wizard: if BOE data available and flag enabled */}
            {FLAGS.ENABLE_PROGRAMACION_WIZARD && currentMod && boeData ? (() => {
              // Find UFs for this module and show wizard for each
              const ufs = boeData.unidadesFormativas;
              return (
                <div className="space-y-6">
                  {/* UF Selector if multiple */}
                  {ufs.length > 1 && (
                    <div className="flex gap-2 flex-wrap">
                      {ufs.map(uf => (
                        <button
                          key={uf.codigo}
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

                  {/* Wizard for selected UF */}
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
              /* No BOE data for current module — show CTA to load golden case */
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-6 py-8 text-center space-y-4">
                <div className="text-3xl">📋</div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Wizard de Programación Didáctica
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  El módulo actual ({currentMod?.codigo}) no tiene datos BOE cargados.
                  Puedes subir una ficha SEPE con datos BOE o probar con el caso golden.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={loadGoldenCase}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-sm transition-colors">
                    Probar con HOTA0308 (Golden Case)
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Caso golden: HOTA0308 Recepción en Alojamientos · MF0265_3 · UF0048 + UF0049
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

      {/* Footer — Legal disclaimer */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-slate-200 py-2 z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400">
            eFPear CertiCalc v2.2 · {dataSource === 'uploaded' ? activeCert.codigo : `Demo: ${activeCert.codigo}`}
            {' '}{activeCert.nombre} · GDPR by design · 100% local
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Herramienta orientativa de uso privado · Sin valor legal ni administrativo · Consulte siempre normativa vigente
          </p>
        </div>
      </footer>
    </div>
  );
}