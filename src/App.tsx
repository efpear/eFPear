import { useState, useMemo } from 'react';
import {
  calcularDistribucionPedagogicaConBloom,
  sugerirBloomPorNivel,
  BLOOM_LABELS,
  METODO_POR_BLOOM,
} from './engine/distributionEngine';
import {
  asignarCapacidadesAUA,
  generarSdAParaUA,
} from './engine/curriculumEngine';
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
import type { Capacidad } from './types';

// ============================================
// DEMO DATA — HOTR0208 Operaciones Básicas de Cocina
// ============================================
const DEMO_CERT = {
  codigo: 'HOTR0208',
  titulo: 'Operaciones Básicas de Cocina',
  nivel: 2 as const,
  modulos: [
    {
      id: 'mf01', codigo: 'MF0255_1', titulo: 'Aprovisionamiento, preelaboración y conservación culinarios',
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
    },
    {
      id: 'mf02', codigo: 'MF0256_1', titulo: 'Elaboración culinaria básica',
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
    },
    {
      id: 'mf03', codigo: 'MP0015', titulo: 'Módulo de prácticas profesionales no laborales',
      horas: 80,
      capacidades: [
        { id: 'C1', descripcion: 'Participar en las operaciones de aprovisionamiento del centro de producción', criterios: [
          { id: 'CE1.1', descripcion: 'Colaborar en operaciones de recepción y almacenamiento' },
        ]},
        { id: 'C2', descripcion: 'Colaborar en preelaboraciones y elaboraciones culinarias', criterios: [
          { id: 'CE2.1', descripcion: 'Realizar tareas básicas de cocina bajo supervisión' },
        ]},
      ] as Capacidad[],
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

type Tab = 'calendario' | 'pedagogica';

// ============================================
// APP
// ============================================
export function App() {
  const [tab, setTab] = useState<Tab>('calendario');
  const [ccaa, setCcaa] = useState<CCAA>('canarias');
  const [isla, setIsla] = useState<IslaCanaria>('tenerife');
  const [turno, setTurno] = useState<'manana' | 'tarde' | 'completo'>('manana');
  const [fechaInicio, setFechaInicio] = useState('2025-09-15');
  const [selectedMod, setSelectedMod] = useState(0);

  // Calendar engine
  const calConfig: ConfiguracionCalendario = useMemo(() => ({
    fechaInicio: fechaInicio as any,
    turnos: DEFAULT_TURNOS[turno],
    regional: { ccaa, isla: ccaa === 'canarias' ? isla : undefined },
    anioAcademico: parseInt(fechaInicio.substring(0, 4)),
  }), [ccaa, isla, turno, fechaInicio]);

  const modulosCascada = useMemo(() =>
    calcularModulosCascada(DEMO_CERT.modulos, calConfig),
  [calConfig]);

  const metricas = useMemo(() => calcularMetricas(modulosCascada, calConfig), [modulosCascada, calConfig]);
  const coherencia = useMemo(() => verificarCoherencia(modulosCascada, calConfig), [modulosCascada, calConfig]);

  // Curriculum engine
  const distribucion = useMemo(() =>
    calcularDistribucionPedagogicaConBloom(
      DEMO_CERT.modulos[selectedMod].horas,
      sugerirBloomPorNivel(DEMO_CERT.nivel, 4)
    ),
  [selectedMod]);

  const capPorUA = useMemo(() =>
    asignarCapacidadesAUA(DEMO_CERT.modulos[selectedMod].capacidades, distribucion.uas.length),
  [selectedMod, distribucion]);

  const sdas = useMemo(() =>
    distribucion.uas.map((ua, i) =>
      generarSdAParaUA(ua, capPorUA[i] || [], [])
    ),
  [distribucion, capPorUA]);

  const metTextos = useMemo(() =>
    distribucion.uas.map(ua => {
      const m = ua.metodoPrincipal;
      const bloom = `Bloom ${ua.bloomLevel} (${ua.bloomLabel})`;
      return `La metodología de la UA ${ua.numero} se basa en un enfoque ${m.toLowerCase()}, aplicando técnica ${ua.tecnicaBase} con agrupación ${ua.agrupacionSugerida}. Nivel ${bloom}. Duración: ${ua.horasTotales}h en ${ua.sdasAjustadas} situaciones de aprendizaje.`;
    }),
  [distribucion]);

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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                Demo: {DEMO_CERT.codigo}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6">
          {[
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
        {tab === 'calendario' ? (
          <div className="space-y-6">
            {/* Config Panel */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Configuración regional y turnos</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CCAA</label>
                  <select value={ccaa} onChange={e => setCcaa(e.target.value as CCAA)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500">
                    {CCAA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {ccaa === 'canarias' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Isla</label>
                    <select value={isla} onChange={e => setIsla(e.target.value as IslaCanaria)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500">
                      {ISLA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Turno</label>
                  <select value={turno} onChange={e => setTurno(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500">
                    <option value="manana">Mañana (5h/día)</option>
                    <option value="tarde">Tarde (5h/día)</option>
                    <option value="completo">Completo (8h/día)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fecha inicio</label>
                  <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                </div>
              </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Módulos', value: metricas.totalModulos, icon: '📦' },
                { label: 'Horas totales', value: `${metricas.totalHoras}h`, icon: '⏱️' },
                { label: 'Sesiones', value: metricas.totalSesiones, icon: '📋' },
                { label: 'Días lectivos', value: metricas.totalDiasLectivos, icon: '📅' },
                { label: 'Progreso', value: `${metricas.porcentajeCompletado}%`, icon: coherencia.coherente ? '✅' : '⚠️' },
              ].map(m => (
                <div key={m.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
                  <div className="text-2xl mb-1">{m.icon}</div>
                  <div className="text-xl font-bold text-slate-900">{m.value}</div>
                  <div className="text-xs text-slate-500">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Module Sessions Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-base font-semibold text-slate-900">Sesiones por módulo (cascada)</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {metricas.fechaInicio} → {metricas.fechaFin} · {ccaa === 'canarias' ? `Canarias / ${isla}` : ccaa}
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {modulosCascada.map((mod, i) => {
                  const primeraSesion = mod.sesiones[0];
                  const ultimaSesion = mod.sesiones[mod.sesiones.length - 1];
                  return (
                    <div key={mod.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold text-white ${
                            i === 0 ? 'bg-green-600' : i === 1 ? 'bg-blue-600' : 'bg-amber-600'
                          }`}>{i + 1}</span>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{mod.codigo}</div>
                            <div className="text-xs text-slate-500">{DEMO_CERT.modulos[i].titulo}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <div className="font-medium text-slate-900">{mod.horasTotales}h</div>
                            <div className="text-xs text-slate-500">{mod.sesiones.length} sesiones</div>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            <div>{primeraSesion?.fecha || '—'}</div>
                            <div>{ultimaSesion?.fecha || '—'}</div>
                          </div>
                        </div>
                      </div>
                      {/* Session mini-timeline */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {mod.sesiones.slice(0, 30).map((s, j) => (
                          <div key={j} title={`${s.fecha} · ${s.horas}h`}
                            className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-medium ${
                              i === 0 ? 'bg-green-100 text-green-700' : i === 1 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {s.horas}
                          </div>
                        ))}
                        {mod.sesiones.length > 30 && (
                          <div className="w-5 h-5 rounded bg-slate-100 text-slate-500 text-[10px] flex items-center justify-center">+{mod.sesiones.length - 30}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coherence Alerts */}
            {coherencia.alertas.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-amber-800 mb-2">Alertas de coherencia</h3>
                {coherencia.alertas.map((a, i) => (
                  <div key={i} className="text-xs text-amber-700 flex items-center gap-2 py-1">
                    <span>{a.tipo === 'error' ? '🔴' : a.tipo === 'warning' ? '🟡' : 'ℹ️'}</span>
                    {a.mensaje}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* PEDAGOGICA TAB */
          <div className="space-y-6">
            {/* Module Selector */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Seleccionar módulo formativo</h2>
              <div className="flex gap-3">
                {DEMO_CERT.modulos.map((m, i) => (
                  <button key={m.id} onClick={() => setSelectedMod(i)}
                    className={`flex-1 rounded-lg border-2 p-3 text-left transition-all ${
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

            {/* Distribution Summary */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-1">Distribución pedagógica</h2>
              <p className="text-xs text-slate-500 mb-4">
                {DEMO_CERT.modulos[selectedMod].codigo} · {distribucion.horasTotalesMF}h → {distribucion.uas.length} UAs
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {distribucion.uas.map((ua, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-900">UA {ua.numero}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        ua.bloomLevel >= 4 ? 'bg-purple-100 text-purple-700' :
                        ua.bloomLevel >= 3 ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        Bloom {ua.bloomLevel} · {BLOOM_LABELS[ua.bloomLevel]}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Horas:</span>
                        <span className="font-medium">{ua.horasTotales}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SdAs:</span>
                        <span className="font-medium">{ua.sdasAjustadas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Método:</span>
                        <span className="font-medium">{METODO_POR_BLOOM[ua.bloomLevel]}</span>
                      </div>
                      {capPorUA[i] && capPorUA[i].length > 0 && (
                        <div className="pt-1 border-t border-slate-100 mt-2">
                          <span className="text-slate-500">Capacidades: </span>
                          {capPorUA[i].map(c => (
                            <span key={c.id} className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-xs font-medium mr-1">
                              {c.id}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SdAs por UA */}
            {distribucion.uas.map((ua, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-900">
                    UA {ua.numero} — Situaciones de Aprendizaje
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {sdas[i]?.length || 0} SdAs · {ua.horasTotales}h · Bloom {ua.bloomLevel} ({BLOOM_LABELS[ua.bloomLevel]})
                  </p>
                </div>
                <div className="divide-y divide-slate-100">
                  {(sdas[i] || []).map((sda, j) => (
                    <div key={j} className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          sda.fase === 'Inicio' ? 'bg-emerald-100 text-emerald-700' :
                          sda.fase === 'Cierre' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{sda.fase}</span>
                        <span className="text-sm font-medium text-slate-900">SdA {sda.numero}</span>
                        <span className="text-xs text-slate-500">{sda.duracionHoras}h · {sda.metodo} · {sda.agrupacion}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {sda.criterios.map(c => (
                          <span key={c.id} className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">
                            {c.id}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Methodology Text Preview */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Vista previa: Metodología (Anexo IV)</h2>
              <div className="space-y-4">
                {metTextos.map((texto, i) => (
                  <div key={i} className="border-l-4 border-green-500 pl-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">UA {i + 1}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{texto}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-slate-200 py-2 z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400">
            eFPear CertiCalc v2.2 · Demo: {DEMO_CERT.codigo} {DEMO_CERT.titulo} · GDPR by design · 100% local
          </p>
        </div>
      </footer>
    </div>
  );
}
