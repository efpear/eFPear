/**
 * EligibilityCheck.tsx — Semaforo de Elegibilidad
 *
 * UI for Slice 1: "El Gancho"
 * Simple form to input trainer profile + select MF → instant result.
 */
import { useState, useMemo, useCallback } from 'react';
import {
  evaluarElegibilidad,
  GOLDEN_CASE_A_REQUIREMENTS,
  GOLDEN_CASE_B_REQUIREMENTS,
  LEGAL_DISCLAIMER,
} from '../engine/eligibilityEngine';
import type {
  TrainerProfile,
  BoeRequirements,
  EligibilityResult,
} from '../types/eligibility';

// ============================================
// DEFAULT PROFILE (empty)
// ============================================
const EMPTY_PROFILE: TrainerProfile = {
  titulaciones: [],
  nivelMaximo: 2,
  experienciaSectorial: 0,
  familiaProfesional: '',
  tieneCapOMaster: false,
  tieneSSCE0110: false,
  horasExperienciaDocente: 0,
  idiomas: {},
};

// ============================================
// PRESET BOE REQUIREMENTS
// ============================================
const PRESETS: { label: string; value: BoeRequirements }[] = [
  { label: 'MF0265_3 — Servicio de vinos (HOTA0308)', value: GOLDEN_CASE_A_REQUIREMENTS },
  { label: 'MF1057_2 — Ingles N2 (idioma requerido)', value: GOLDEN_CASE_B_REQUIREMENTS },
];

// ============================================
// COMPONENT
// ============================================
export function EligibilityCheck() {
  const [titulacionInput, setTitulacionInput] = useState('');
  const [nivelMaximo, setNivelMaximo] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [experiencia, setExperiencia] = useState(0);
  const [familia, setFamilia] = useState('');
  const [tieneCAP, setTieneCAP] = useState(false);
  const [tieneSSCE, setTieneSSCE] = useState(false);
  const [horasDocencia, setHorasDocencia] = useState(0);
  const [idiomaIngles, setIdiomaIngles] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [result, setResult] = useState<EligibilityResult | null>(null);

  const buildProfile = useCallback((): TrainerProfile => ({
    titulaciones: titulacionInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean),
    nivelMaximo,
    experienciaSectorial: experiencia,
    familiaProfesional: familia,
    tieneCapOMaster: tieneCAP,
    tieneSSCE0110: tieneSSCE,
    horasExperienciaDocente: horasDocencia,
    idiomas: idiomaIngles ? { 'Ingles': idiomaIngles } : {},
  }), [titulacionInput, nivelMaximo, experiencia, familia, tieneCAP, tieneSSCE, horasDocencia, idiomaIngles]);

  const handleEvaluar = useCallback(() => {
    const perfil = buildProfile();
    const requisitos = PRESETS[selectedPreset].value;
    const res = evaluarElegibilidad(perfil, requisitos);
    setResult(res);
  }, [buildProfile, selectedPreset]);

  // Status color
  const statusColor = result
    ? result.status === 'ELIGIBLE'
      ? 'bg-green-500'
      : result.status === 'CONDICIONAL'
        ? 'bg-amber-500'
        : 'bg-red-500'
    : 'bg-slate-300';

  const statusLabel = result
    ? result.status === 'ELIGIBLE'
      ? 'ELEGIBLE (orientativo)'
      : result.status === 'CONDICIONAL'
        ? 'CONDICIONAL (orientativo)'
        : 'NO ELEGIBLE (orientativo)'
    : '';

  return (
    <div className="space-y-6">
      {/* Legal disclaimer banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0">&#x2696;&#xFE0F;</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Herramienta orientativa</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              eFPear CertiCalc es un proyecto privado de uso personal. Los resultados son estimaciones
              basadas en la interpretacion automatizada de normativa publicada en el BOE y
              <strong> no tienen valor legal ni administrativo</strong>. La habilitacion oficial la determina
              exclusivamente el organo competente. Consulte siempre la normativa vigente.
            </p>
          </div>
        </div>
      </div>

      {/* MF Selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Seleccionar modulo formativo</h2>
        <div className="flex flex-wrap gap-3">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => { setSelectedPreset(i); setResult(null); }}
              className={`rounded-lg border-2 px-4 py-2 text-sm text-left transition-all ${
                selectedPreset === i
                  ? 'border-green-600 bg-green-50 font-medium'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Tu perfil</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Titulaciones */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Titulaciones (separadas por coma)
            </label>
            <input
              type="text"
              value={titulacionInput}
              onChange={e => setTitulacionInput(e.target.value)}
              placeholder="Ej: Grado en Turismo, Licenciado en Filologia"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Nivel */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nivel academico maximo</label>
            <select
              value={nivelMaximo}
              onChange={e => setNivelMaximo(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
            >
              <option value={1}>1 — Certificado profesionalidad N1</option>
              <option value={2}>2 — Tecnico / Diplomado</option>
              <option value={3}>3 — Grado / Licenciado</option>
              <option value={4}>4 — Master</option>
              <option value={5}>5 — Doctorado</option>
            </select>
          </div>

          {/* Experiencia */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Anos de experiencia sectorial</label>
            <input
              type="number"
              min={0}
              max={50}
              step={0.5}
              value={experiencia}
              onChange={e => setExperiencia(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Familia profesional */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Familia profesional</label>
            <input
              type="text"
              value={familia}
              onChange={e => setFamilia(e.target.value)}
              placeholder="Ej: Hosteleria y Turismo"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Competencia docente */}
          <div className="md:col-span-2 border-t border-slate-100 pt-4">
            <label className="block text-xs font-medium text-slate-700 mb-3">Competencia docente</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={tieneCAP} onChange={e => setTieneCAP(e.target.checked)}
                  className="rounded border-slate-300 text-green-600 focus:ring-green-500" />
                CAP / Master Profesorado
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={tieneSSCE} onChange={e => setTieneSSCE(e.target.checked)}
                  className="rounded border-slate-300 text-green-600 focus:ring-green-500" />
                SSCE0110
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-700">Horas docencia:</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={horasDocencia}
                  onChange={e => setHorasDocencia(Number(e.target.value))}
                  className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Idioma (for Golden Case B) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nivel de Ingles acreditado</label>
            <select
              value={idiomaIngles}
              onChange={e => setIdiomaIngles(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
            >
              <option value="">Sin acreditar</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </div>
        </div>

        {/* Evaluar button */}
        <div className="mt-6">
          <button
            onClick={handleEvaluar}
            className="w-full sm:w-auto bg-green-600 text-white rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
          >
            Evaluar elegibilidad
          </button>
        </div>
      </div>

      {/* Result — Semaforo */}
      {result && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Status bar */}
          <div className={`px-6 py-4 flex items-center gap-4 ${
            result.status === 'ELIGIBLE' ? 'bg-green-50 border-b border-green-200' :
            result.status === 'CONDICIONAL' ? 'bg-amber-50 border-b border-amber-200' :
            'bg-red-50 border-b border-red-200'
          }`}>
            <div className={`w-5 h-5 rounded-full flex-shrink-0 ${statusColor}`} />
            <div>
              <div className={`text-sm font-bold ${
                result.status === 'ELIGIBLE' ? 'text-green-800' :
                result.status === 'CONDICIONAL' ? 'text-amber-800' :
                'text-red-800'
              }`}>
                {statusLabel}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">{result.resumen}</div>
            </div>
          </div>

          {/* Messages detail */}
          <div className="p-6 space-y-3">
            {/* Legal disclaimer on result */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="flex items-start gap-2">
                <span className="text-xs flex-shrink-0">&#x2696;&#xFE0F;</span>
                <div>
                  <div className="text-xs font-medium text-slate-700">{LEGAL_DISCLAIMER.titulo}</div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{LEGAL_DISCLAIMER.texto}</div>
                </div>
              </div>
            </div>
            {result.mensajes.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 border ${
                  msg.tipo === 'success' ? 'bg-green-50 border-green-200' :
                  msg.tipo === 'warning' ? 'bg-amber-50 border-amber-200' :
                  'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm flex-shrink-0">
                    {msg.tipo === 'success' ? {'✅'} : msg.tipo === 'warning' ? {'⚠️'} : {'❌'}}
                  </span>
                  <div>
                    <div className="text-sm text-slate-800">{msg.texto}</div>
                    <div className="text-xs text-slate-500 mt-1 italic">{msg.referenciaBoe}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
