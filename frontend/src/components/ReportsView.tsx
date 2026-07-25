import { useState } from 'react';
import type { Investigation } from '../types';
import { useApp } from '../context/AppContext';
import { buildReportHtml } from '../lib/report';

export interface ReportFilters {
  target?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function filterInvestigations(
  investigations: Investigation[],
  filters: ReportFilters
): Investigation[] {
  return investigations.filter(inv => {
    if (filters.target && filters.target.trim() !== '') {
      if (!inv.target.toLowerCase().includes(filters.target.toLowerCase())) {
        return false;
      }
    }

    if (filters.type && filters.type.trim() !== '' && inv.investigation_type) {
      if (inv.investigation_type !== filters.type) {
        return false;
      }
    }

    if (filters.dateFrom && filters.dateFrom.trim() !== '') {
      if (inv.created_at < filters.dateFrom) {
        return false;
      }
    }

    if (filters.dateTo && filters.dateTo.trim() !== '') {
      if (inv.created_at > filters.dateTo) {
        return false;
      }
    }

    return true;
  });
}

export function ReportsView(): JSX.Element {
  const { state } = useApp();
  const completed = state.investigations.filter(i => i.status === 'completed');

  const [targetFilter, setTargetFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [previewInv, setPreviewInv] = useState<Investigation | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const filtered = filterInvestigations(completed, { target: targetFilter, dateFrom, dateTo });

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const compareInvs = compareIds
    .map(id => completed.find(inv => inv.id === id))
    .filter((inv): inv is Investigation => Boolean(inv));

  return (
    <>
      <div className="header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Genera y compara reportes de investigaciones completadas.</p>
        </div>
        <div className="header-actions">
          <button
            className="ai-bot-button"
            disabled={compareIds.length !== 2}
            onClick={() => setShowCompare(true)}
          >
            Comparar
          </button>
        </div>
      </div>

      <div
        className="glass-card"
        style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}
      >
        <input
          type="text"
          placeholder="Filtrar por objetivo..."
          value={targetFilter}
          onChange={(e) => setTargetFilter(e.target.value)}
          className="search-input"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="search-input"
          aria-label="Desde"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="search-input"
          aria-label="Hasta"
        />
      </div>

      <div className="glass-card" style={{ padding: 0 }}>
        {filtered.length === 0 && (
          <div className="empty-state">No hay investigaciones completadas que coincidan con los filtros.</div>
        )}
        {filtered.map(inv => (
          <div
            key={inv.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <input
              type="checkbox"
              checked={compareIds.includes(inv.id)}
              onChange={() => toggleCompare(inv.id)}
              aria-label={`Seleccionar ${inv.name} para comparar`}
            />
            <div style={{ flex: 1 }}>
              <strong>{inv.name}</strong>
              <div className="page-subtitle" style={{ margin: 0 }}>
                {inv.target} &middot; {new Date(inv.created_at).toLocaleString()}
              </div>
            </div>
            <button className="btn-outline" onClick={() => setPreviewInv(inv)}>
              Vista Previa
            </button>
          </div>
        ))}
      </div>

      {previewInv && (
        <div className="modal-overlay">
          <div className="modal-header">
            <h2 className="modal-title">Vista Previa: {previewInv.name}</h2>
            <button onClick={() => setPreviewInv(null)} className="modal-close">✖</button>
          </div>
          <div className="modal-body">
            <iframe
              title="report-preview"
              sandbox="allow-same-origin"
              srcDoc={buildReportHtml(previewInv)}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      )}

      {showCompare && compareInvs.length === 2 && (
        <div className="modal-overlay">
          <div className="modal-header">
            <h2 className="modal-title">Comparar Reportes</h2>
            <button onClick={() => setShowCompare(false)} className="modal-close">✖</button>
          </div>
          <div
            className="modal-body"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}
          >
            {compareInvs.map(inv => (
              <iframe
                key={inv.id}
                title={`report-compare-${inv.id}`}
                sandbox="allow-same-origin"
                srcDoc={buildReportHtml(inv)}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
