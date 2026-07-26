import { useState, useMemo } from 'react';
import { FileText, Download, Trash2, Search, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import type { Investigation } from '../types';
import { showToast } from './Toast';
import { API_BASE_URL } from '../types';

interface ReportsViewProps {
  investigations: Investigation[];
  onRefresh: () => void;
}

type FilterStatus = 'all' | 'completed' | 'error';

export function ReportsView({ investigations, onRefresh }: ReportsViewProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  const filtered = useMemo(() => {
    let list = investigations.filter(inv => inv.status !== 'running' && inv.status !== 'pending');

    if (filterStatus !== 'all') {
      list = list.filter(inv => inv.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(inv =>
        inv.name.toLowerCase().includes(q) || inv.target.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'date') {
      list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [investigations, filterStatus, search, sortBy]);

  const exportReport = (inv: Investigation) => {
    const reportHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte OSINTEYE: ${inv.target}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; }
    .container { max-width: 900px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; }
    h1 { color: #38bdf8; border-bottom: 2px solid #334155; padding-bottom: 10px; }
    h2 { color: #10b981; margin-top: 30px; }
    .meta { background: #334155; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .module { margin-bottom: 20px; padding: 15px; border: 1px solid #475569; border-radius: 8px; background: #0f172a; }
    pre { background: #000; padding: 15px; border-radius: 6px; overflow-x: auto; color: #a5b4fc; }
  </style>
</head>
<body>
  <div class="container">
    <h1>👁️ OSINTEYE Intelligence Report</h1>
    <div class="meta">
      <strong>Caso:</strong> ${inv.name}<br>
      <strong>Objetivo:</strong> ${inv.target}<br>
      <strong>Fecha:</strong> ${new Date(inv.created_at).toLocaleString('es')}<br>
      <strong>Estado:</strong> ${inv.status.toUpperCase()}
    </div>
    <h2>Resultados de Módulos (${inv.results?.length || 0})</h2>
    ${(inv.results || []).map(r => `
    <div class="module">
      <h3 style="margin-top:0;color:#f472b6;">Módulo: ${r.module_name.toUpperCase()}</h3>
      <div><strong>Estado:</strong> ${r.status}</div>
      <pre>${JSON.stringify(r.raw_data, null, 2)}</pre>
    </div>`).join('')}
  </div>
</body>
</html>`;
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_OSINTEYE_${inv.target}_${inv.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Reporte exportado', 'success');
  };

  const deleteInvestigation = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar el reporte "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/investigations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Reporte eliminado', 'success');
        onRefresh();
      } else {
        showToast('Error al eliminar', 'error');
      }
    } catch {
      showToast('Error de red', 'error');
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle size={16} color="#22c55e" />;
    if (status === 'error') return <AlertCircle size={16} color="#ef4444" />;
    return <Clock size={16} color="#94a3b8" />;
  };

  const getModuleCount = (inv: Investigation) => inv.results?.length || 0;
  const getSuccessModules = (inv: Investigation) => inv.results?.filter(r => r.status !== 'error').length || 0;

  return (
    <>
      <div className="header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Historial de investigaciones completadas y exportaciones.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="reports-filters glass-card" style={{ marginBottom: 24, cursor: 'default' }}>
        <div className="reports-filter-row">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre o objetivo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div className="reports-filter-group">
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Estado:</span>
            {(['all', 'completed', 'error'] as FilterStatus[]).map(s => (
              <button
                key={s}
                className={`type-btn ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}
                style={{ padding: '6px 14px' }}
              >
                {s === 'all' ? 'Todos' : s === 'completed' ? 'Completados' : 'Con error'}
              </button>
            ))}
          </div>
          <div className="reports-filter-group">
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Ordenar:</span>
            <button className={`type-btn ${sortBy === 'date' ? 'active' : ''}`} onClick={() => setSortBy('date')} style={{ padding: '6px 14px' }}>
              <Calendar size={14} style={{ marginRight: 4 }} />Fecha
            </button>
            <button className={`type-btn ${sortBy === 'name' ? 'active' : ''}`} onClick={() => setSortBy('name')} style={{ padding: '6px 14px' }}>
              A-Z
            </button>
          </div>
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 8 }}>
          {filtered.length} reporte{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Reports Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: 60 }}>
          <FileText size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div>No hay reportes que coincidan con los filtros.</div>
        </div>
      ) : (
        <div className="reports-grid">
          {filtered.map(inv => (
            <div key={inv.id} className="glass-card report-card" style={{ cursor: 'default' }}>
              <div className="report-card-header">
                <div className="report-card-icon">
                  <FileText size={20} color="#6366f1" />
                </div>
                <div className="report-card-info">
                  <div className="report-card-name">{inv.name}</div>
                  <div className="report-card-target">{inv.target}</div>
                </div>
                <div className="report-card-status">
                  {getStatusIcon(inv.status)}
                </div>
              </div>

              <div className="report-card-meta">
                <div className="report-meta-item">
                  <Calendar size={13} />
                  <span>{new Date(inv.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="report-meta-item">
                  <CheckCircle size={13} />
                  <span>{getSuccessModules(inv)}/{getModuleCount(inv)} módulos OK</span>
                </div>
              </div>

              {/* Module progress bar */}
              {getModuleCount(inv) > 0 && (
                <div className="report-progress">
                  <div
                    className="report-progress-fill"
                    style={{ width: `${(getSuccessModules(inv) / getModuleCount(inv)) * 100}%` }}
                  />
                </div>
              )}

              <div className="report-card-actions">
                <button
                  className="btn-outline btn-primary-outline"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => exportReport(inv)}
                >
                  <Download size={14} /> Exportar HTML
                </button>
                <button
                  className="btn-outline"
                  style={{ borderColor: '#ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => deleteInvestigation(inv.id, inv.name)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
