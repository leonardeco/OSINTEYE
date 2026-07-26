import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Search, BookOpen, FileText, Settings, TrendingUp, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import type { ViewType, Investigation } from '../types';

interface DashboardViewProps {
  onNavigate: (view: ViewType) => void;
  totalSources: number;
  totalCategories: number;
  investigations: Investigation[];
}

export function DashboardView({ onNavigate, totalSources, totalCategories, investigations }: DashboardViewProps) {
  const [recentActivity, setRecentActivity] = useState<{ name: string; value: number }[]>([]);

  const completed = investigations.filter(i => i.status === 'completed').length;
  const running = investigations.filter(i => i.status === 'running' || i.status === 'pending').length;
  const errored = investigations.filter(i => i.status === 'error').length;

  useEffect(() => {
    // Build last 7 days activity chart from investigations
    const now = new Date();
    const days: { name: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString('es', { weekday: 'short' });
      const count = investigations.filter(inv => {
        const created = new Date(inv.created_at);
        return (
          created.getDate() === d.getDate() &&
          created.getMonth() === d.getMonth() &&
          created.getFullYear() === d.getFullYear()
        );
      }).length;
      days.push({ name: dayLabel, value: count });
    }
    setRecentActivity(days);
  }, [investigations]);

  const metrics = [
    {
      label: 'Herramientas OSINT',
      value: totalSources,
      icon: <BookOpen size={22} />,
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.15)',
      action: () => onNavigate('catalog'),
      actionLabel: 'Ver catálogo',
    },
    {
      label: 'Categorías',
      value: totalCategories,
      icon: <TrendingUp size={22} />,
      color: '#a855f7',
      bg: 'rgba(168,85,247,0.15)',
      action: () => onNavigate('catalog'),
      actionLabel: 'Explorar',
    },
    {
      label: 'Investigaciones',
      value: investigations.length,
      icon: <Search size={22} />,
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.15)',
      action: () => onNavigate('investigations'),
      actionLabel: 'Ver todas',
    },
    {
      label: 'En progreso',
      value: running,
      icon: <Activity size={22} />,
      color: '#eab308',
      bg: 'rgba(234,179,8,0.15)',
      action: () => onNavigate('investigations'),
      actionLabel: 'Ver activas',
    },
  ];

  const quickActions = [
    { label: 'Nueva Investigación', icon: <Search size={20} />, view: 'investigations' as ViewType, color: '#6366f1' },
    { label: 'Catálogo OSINT', icon: <BookOpen size={20} />, view: 'catalog' as ViewType, color: '#a855f7' },
    { label: 'Reportes', icon: <FileText size={20} />, view: 'reports' as ViewType, color: '#22c55e' },
    { label: 'Configuración', icon: <Settings size={20} />, view: 'settings' as ViewType, color: '#64748b' },
  ];

  return (
    <div className="dashboard-container">
      <div className="header">
        <div>
          <h1 className="page-title">Panel de Control</h1>
          <p className="page-subtitle">Resumen general de tu plataforma de inteligencia OSINT.</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="dashboard-metrics">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="metric-card glass-card"
            onClick={m.action}
            style={{ cursor: 'pointer' }}
          >
            <div className="metric-icon" style={{ background: m.bg, color: m.color }}>
              {m.icon}
            </div>
            <div className="metric-body">
              <div className="metric-value" style={{ color: m.color }}>{m.value.toLocaleString()}</div>
              <div className="metric-label">{m.label}</div>
            </div>
            <span className="metric-action">{m.actionLabel} →</span>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Activity Chart */}
        <div className="glass-card dashboard-chart-card">
          <h3 className="dashboard-section-title">Actividad (últimos 7 días)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={recentActivity} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f8fafc' }}
                cursor={{ fill: 'rgba(99,102,241,0.1)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {recentActivity.map((_, index) => (
                  <Cell key={index} fill={index === recentActivity.length - 1 ? '#6366f1' : '#334155'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Summary */}
        <div className="glass-card dashboard-status-card">
          <h3 className="dashboard-section-title">Estado de Investigaciones</h3>
          <div className="status-list">
            <div className="status-item">
              <CheckCircle size={18} color="#22c55e" />
              <span>Completadas</span>
              <span className="status-count" style={{ color: '#22c55e' }}>{completed}</span>
            </div>
            <div className="status-item">
              <Activity size={18} color="#eab308" />
              <span>En progreso</span>
              <span className="status-count" style={{ color: '#eab308' }}>{running}</span>
            </div>
            <div className="status-item">
              <AlertCircle size={18} color="#ef4444" />
              <span>Con error</span>
              <span className="status-count" style={{ color: '#ef4444' }}>{errored}</span>
            </div>
          </div>

          {investigations.length > 0 && (
            <div className="status-bar-wrapper">
              <div className="status-bar">
                {completed > 0 && (
                  <div className="status-bar-fill" style={{ width: `${(completed / investigations.length) * 100}%`, background: '#22c55e' }} />
                )}
                {running > 0 && (
                  <div className="status-bar-fill" style={{ width: `${(running / investigations.length) * 100}%`, background: '#eab308' }} />
                )}
                {errored > 0 && (
                  <div className="status-bar-fill" style={{ width: `${(errored / investigations.length) * 100}%`, background: '#ef4444' }} />
                )}
              </div>
              <div className="status-bar-label">{investigations.length} total</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card" style={{ marginTop: 24, cursor: 'default' }}>
        <h3 className="dashboard-section-title" style={{ marginBottom: 16 }}>Acceso Rápido</h3>
        <div className="quick-actions">
          {quickActions.map((a, i) => (
            <button
              key={i}
              className="quick-action-btn"
              style={{ '--action-color': a.color } as React.CSSProperties}
              onClick={() => onNavigate(a.view)}
            >
              <span className="quick-action-icon" style={{ color: a.color }}>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Investigations */}
      {investigations.length > 0 && (
        <div className="glass-card" style={{ marginTop: 24, cursor: 'default' }}>
          <h3 className="dashboard-section-title" style={{ marginBottom: 16 }}>Investigaciones Recientes</h3>
          <div className="recent-list">
            {investigations.slice(0, 5).map(inv => (
              <div key={inv.id} className="recent-item" onClick={() => onNavigate('investigations')}>
                <div className="recent-info">
                  <span className="recent-name">{inv.name}</span>
                  <span className="recent-target">{inv.target}</span>
                </div>
                <div className="recent-meta">
                  <span className={`badge ${inv.status === 'completed' ? 'badge-success' : inv.status === 'running' ? 'badge-warning' : inv.status === 'error' ? 'badge-danger' : 'badge-info'}`}>
                    {inv.status}
                  </span>
                  <span className="recent-date">{new Date(inv.created_at).toLocaleDateString('es')}</span>
                </div>
              </div>
            ))}
          </div>
          {investigations.length > 5 && (
            <button className="btn-outline btn-primary-outline" style={{ marginTop: 12, width: '100%' }} onClick={() => onNavigate('investigations')}>
              Ver todas ({investigations.length}) →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
