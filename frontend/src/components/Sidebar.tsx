import type { Category, ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (cat: Category) => void;
  onClearSearch: () => void;
}

export function Sidebar({
  currentView, onViewChange, categories, selectedCategory, onSelectCategory, onClearSearch
}: SidebarProps) {
  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          <span className="sidebar-logo">👁️</span> OSINTEYE
        </h2>
        <p className="sidebar-subtitle">Intelligence Platform</p>
      </div>

      <div className="nav-tabs">
        <button
          onClick={() => onViewChange('catalog')}
          className={`nav-tab ${currentView === 'catalog' ? 'active' : ''}`}
        >
          📚 Catálogo
        </button>
        <button
          onClick={() => onViewChange('investigations')}
          className={`nav-tab ${currentView === 'investigations' ? 'active' : ''}`}
        >
          🔍 Investigar
        </button>
        <button
          onClick={() => onViewChange('settings')}
          className={`nav-tab ${currentView === 'settings' ? 'active' : ''}`}
        >
          ⚙️ Ajustes
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
