import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { Investigation } from '../types';
import { useApp } from '../context/AppContext';

const SPANISH_DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function computeWeeklyActivity(
  investigations: Investigation[]
): { day: string; count: number }[] {
  const buckets: { day: string; count: number; date: Date }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    buckets.push({ day: SPANISH_DAY_LABELS[date.getDay()], count: 0, date });
  }

  investigations.forEach(inv => {
    const created = new Date(inv.created_at);
    const bucket = buckets.find(
      b =>
        b.date.getFullYear() === created.getFullYear() &&
        b.date.getMonth() === created.getMonth() &&
        b.date.getDate() === created.getDate()
    );
    if (bucket) {
      bucket.count += 1;
    }
  });

  return buckets.map(({ day, count }) => ({ day, count }));
}

export function DashboardView(): JSX.Element {
  const { state, dispatch } = useApp();

  const totalInvestigations = state.investigations.length;
  const totalModulesExecuted = state.investigations.reduce(
    (sum, inv) => sum + inv.results.length,
    0
  );
  const totalTools = state.allSources.length;
  const lastActivity = state.investigations[0]?.created_at
    ? new Date(state.investigations[0].created_at).toLocaleString()
    : 'N/A';

  const weeklyActivity = computeWeeklyActivity(state.investigations);

  return (
    <>
      <div className="header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen general de tu actividad de investigación.</p>
        </div>
        <div className="header-actions">
          <button
            className="ai-bot-button"
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'investigations' })}
          >
            🔍 Nueva Investigación
          </button>
          <button
            className="btn-outline"
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'catalog' })}
          >
            📚 Buscar herramienta
          </button>
        </div>
      </div>

      <div
        className="tools-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}
      >
        <div className="glass-card">
          <p className="page-subtitle" style={{ margin: 0 }}>Total Investigaciones</p>
          <h2 style={{ margin: '8px 0 0' }}>{totalInvestigations}</h2>
        </div>
        <div className="glass-card">
          <p className="page-subtitle" style={{ margin: 0 }}>Módulos Ejecutados</p>
          <h2 style={{ margin: '8px 0 0' }}>{totalModulesExecuted}</h2>
        </div>
        <div className="glass-card">
          <p className="page-subtitle" style={{ margin: 0 }}>Herramientas en Catálogo</p>
          <h2 style={{ margin: '8px 0 0' }}>{totalTools}</h2>
        </div>
        <div className="glass-card">
          <p className="page-subtitle" style={{ margin: 0 }}>Última Actividad</p>
          <h2 style={{ margin: '8px 0 0', fontSize: '1.1rem' }}>{lastActivity}</h2>
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '24px', cursor: 'default' }}>
        <p className="page-subtitle" style={{ margin: '0 0 12px' }}>Actividad Semanal</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyActivity}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
