// src/components/HealthPanel.tsx — Validation Health Panel
//
// Consumes ValidationIssue[] from validationEngine and renders
// an expandable health summary panel below the wizard.

import React, { useMemo, useState } from 'react';
import type { ValidationIssue, Severity } from '../engine/validationEngine';

interface HealthPanelProps {
  issues: ValidationIssue[];
}

const SEVERITY_CONFIG: Record<Severity, { icon: string; label: string; bg: string; text: string; border: string }> = {
  error: {
    icon: '❌',
    label: 'Error Crítico',
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
  },
  warning: {
    icon: '⚠️',
    label: 'Aviso',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
};

export function HealthPanel({ issues }: HealthPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const { errors, warnings } = useMemo(() => ({
    errors: issues.filter(i => i.level === 'error'),
    warnings: issues.filter(i => i.level === 'warning'),
  }), [issues]);

  const allClear = issues.length === 0;

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">
            🏥 Salud de la Programación
          </span>
          {allClear ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
              ✓ Todo correcto
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              {errors.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                  {errors.length} error{errors.length !== 1 ? 'es' : ''}
                </span>
              )}
              {warnings.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                  {warnings.length} aviso{warnings.length !== 1 ? 's' : ''}
                </span>
              )}
            </span>
          )}
        </div>
        <span className="text-slate-400 text-xs">{expanded ? '▾' : '▸'}</span>
      </button>

      {/* Issue List */}
      {expanded && !allClear && (
        <div className="divide-y divide-slate-100">
          {/* Errors first */}
          {errors.map((issue, idx) => (
            <IssueRow key={`err-${idx}`} issue={issue} />
          ))}
          {/* Then warnings */}
          {warnings.map((issue, idx) => (
            <IssueRow key={`warn-${idx}`} issue={issue} />
          ))}
        </div>
      )}

      {/* All clear message */}
      {expanded && allClear && (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-green-600 font-medium">✅ Todas las validaciones superadas</p>
          <p className="text-[10px] text-slate-400 mt-1">Horas, criterios, contenidos y SdAs están correctos.</p>
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue }: { issue: ValidationIssue }) {
  const config = SEVERITY_CONFIG[issue.level];
  return (
    <div className={`flex items-start gap-3 px-4 py-2.5 ${config.bg}`}>
      <span className="text-sm flex-shrink-0 mt-0.5">{config.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>
            {config.label}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            ({issue.id})
          </span>
        </div>
        <p className={`text-xs ${config.text} mt-0.5`}>{issue.message}</p>
      </div>
    </div>
  );
}

export default HealthPanel;
