// src/components/HealthPanel.tsx -- Validation Health Panel
// OAT redesign: details.accordion, oat-badge, Lucide icons

import { useMemo } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import type { ValidationIssue, Severity } from '../engine/validationEngine';

interface HealthPanelProps {
  issues: ValidationIssue[];
}

const SEVERITY_CFG: Record<Severity, { icon: typeof AlertCircle; badgeClass: string; label: string }> = {
  error:   { icon: AlertCircle,   badgeClass: 'danger',  label: 'Error critico' },
  warning: { icon: AlertTriangle, badgeClass: 'warning', label: 'Aviso' },
};

function IssueRow({ issue }: { issue: ValidationIssue }) {
  const cfg = SEVERITY_CFG[issue.level];
  const Icon = cfg.icon;
  return (
    <div className="flex items-start gap-3 px-4 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <Icon size={13} style={{ flexShrink: 0, marginTop: '2px', color: issue.level === 'error' ? 'var(--danger)' : 'var(--warning)' }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={'oat-badge ' + cfg.badgeClass}>{cfg.label}</span>
          <code className="text-[10px]" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
            {issue.ruleId}
          </code>
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--foreground)' }}>{issue.message}</p>
      </div>
    </div>
  );
}

export function HealthPanel({ issues }: HealthPanelProps) {
  const { errors, warnings } = useMemo(() => ({
    errors:   issues.filter(i => i.level === 'error'),
    warnings: issues.filter(i => i.level === 'warning'),
  }), [issues]);

  const allClear = issues.length === 0;

  return (
    <details className="accordion" open={!allClear}>
      <summary style={{ color: 'var(--foreground)', fontSize: 'var(--text-7)' }}>
        <span className="flex items-center gap-2">
          {allClear
            ? <CheckCircle size={14} style={{ color: 'var(--success)' }} />
            : <AlertCircle size={14} style={{ color: errors.length > 0 ? 'var(--danger)' : 'var(--warning)' }} />
          }
          <span className="font-medium">Salud de la Programacion</span>
          {allClear && <span className="oat-badge success">Todo correcto</span>}
          {errors.length > 0 && <span className="oat-badge danger">{errors.length} {errors.length === 1 ? 'error' : 'errores'}</span>}
          {warnings.length > 0 && <span className="oat-badge warning">{warnings.length} {warnings.length === 1 ? 'aviso' : 'avisos'}</span>}
        </span>
      </summary>

      {allClear ? (
        <div className="flex items-center gap-2 px-4 py-3">
          <CheckCircle size={14} style={{ color: 'var(--success)' }} />
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            No se detectaron problemas. Puedes exportar el Anexo IV.
          </p>
        </div>
      ) : (
        <div style={{ padding: 0 }}>
          {errors.map((issue, i) => <IssueRow key={`e-${i}`} issue={issue} />)}
          {warnings.map((issue, i) => <IssueRow key={`w-${i}`} issue={issue} />)}
        </div>
      )}
    </details>
  );
}
