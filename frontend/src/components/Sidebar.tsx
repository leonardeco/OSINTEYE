import { useState } from 'react';
import { BookOpen, Search, Settings, LayoutDashboard, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Category, Investigation, ViewType } from '../types';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (cat: Category) => void;
  onClearSearch: () => void;
}

export function countActiveInvestigations(investigations: Investigation[]): number {
  return investigations.filter(i => i.status === 'running' || i.status === 'pending').length;
}

export function Sidebar({
  currentView, onViewChange, categories, selectedCategory, onSelectCategory, onClearSearch
}: SidebarProps) {
  const { state } = useApp();
  const activeCount = countActiveInvestigations(state.investigations);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`sidebar glass-panel ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          <span className="sidebar-logo">👁️</span> OSINTEYE
        </h2>
        <p className="sidebar-subtitle">Intelligence Platform</p>
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="nav-tabs">
        <button
          onClick={() => onViewChange('dashboard')}
          className={`nav-tab ${currentView === 'dashboard' ? 'active' : ''}`}
          title="Dashboard"
        >
          <LayoutDashboard size={18} /> <span className="nav-tab-label">Dashboard</span>
        </button>
        <button
          onClick={() => onViewChange('catalog')}
          className={`nav-tab ${currentView === 'catalog' ? 'active' : ''}`}
          title="Catálogo"
        >
          <BookOpen size={18} /> <span className="nav-tab-label">Catálogo</span>
        </button>
        <button
          onClick={() => onViewChange('investigations')}
          className={`nav-tab ${currentView === 'investigations' ? 'active' : ''}`}
          title="Investigar"
        >
          <Search size={18} /> <span className="nav-tab-label">Investigar</span>
          {activeCount > 0 && <span className="badge badge-warning" style={{ marginLeft: '6px' }}>{activeCount}</span>}
        </button>
        <button
          onClick={() => onViewChange('settings')}
          className={`nav-tab ${currentView === 'settings' ? 'active' : ''}`}
          title="Ajustes"
        >
          <Settings size={18} /> <span className="nav-tab-label">Ajustes</span>
        </button>
        <button
          onClick={() => onViewChange('reports')}
          className={`nav-tab ${currentView === 'reports' ? 'active' : ''}`}
          title="Reportes"
        >
          <FileText size={18} /> <span className="nav-tab-label">Reportes</span>
        </button>
      </div>

      {currentView === 'catalog' && (
        <div className="sidebar-categories">
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`category-item ${selectedCategory?.id === cat.id ? 'active' : ''}`}
              onClick={() => {
                onClearSearch();
                onSelectCategory(cat);
              }}
            >
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
      )}

      {currentView === 'investigations' && (
        <div className="sidebar-info">
          Historial de casos activos y escaneos automatizados.
        </div>
      )}
      {currentView === 'settings' && (
        <div className="sidebar-info">
          Configuración del sistema y gestión de llaves API.
        </div>
      )}
    </div>
  );
}
