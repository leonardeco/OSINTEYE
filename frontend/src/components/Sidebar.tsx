import { useState } from 'react';
import {
  LayoutDashboard, BookOpen, Search, FileText, Settings,
  ChevronLeft, ChevronRight, Eye, MessageSquare, Sun, Moon
} from 'lucide-react';
import type { Category, ViewType } from '../types';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (cat: Category) => void;
  onClearSearch: () => void;
  activeCount: number;
  onOpenChat: () => void;
}

const NAV_ITEMS: { view: ViewType; label: string; icon: React.ReactNode; badge?: string }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { view: 'catalog', label: 'Catálogo', icon: <BookOpen size={18} /> },
  { view: 'investigations', label: 'Investigar', icon: <Search size={18} /> },
  { view: 'reports', label: 'Reportes', icon: <FileText size={18} /> },
  { view: 'settings', label: 'Ajustes', icon: <Settings size={18} /> },
];

export function Sidebar({
  currentView, onViewChange, categories, selectedCategory,
  onSelectCategory, onClearSearch, activeCount, onOpenChat,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useApp();

  return (
    <div className={`sidebar glass-panel ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header">
        {!collapsed && (
          <div>
            <h2 className="sidebar-title">
              <Eye size={22} style={{ color: '#6366f1' }} /> OSINTEYE
            </h2>
            <p className="sidebar-subtitle">Intelligence Platform</p>
          </div>
        )}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Eye size={22} style={{ color: '#6366f1' }} />
          </div>
        )}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const isActive = currentView === item.view;
          const showBadge = item.view === 'investigations' && activeCount > 0;
          return (
            <button
              key={item.view}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onViewChange(item.view)}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {!collapsed && <span className="nav-item-label">{item.label}</span>}
              {showBadge && (
                <span className="nav-badge">{activeCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Category list (only for catalog view, not collapsed) */}
      {currentView === 'catalog' && !collapsed && (
        <div className="sidebar-categories">
          <div className="sidebar-section-title">Categorías</div>
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

      {/* Sidebar info for other views */}
      {currentView === 'investigations' && !collapsed && (
        <div className="sidebar-info">
          {activeCount > 0
            ? `${activeCount} escaneo${activeCount > 1 ? 's' : ''} en progreso.`
            : 'Lanza escaneos sobre dominios, IPs, emails y teléfonos.'}
        </div>
      )}

      {/* Bottom actions */}
      <div className="sidebar-bottom">
        <button
          className="sidebar-action-btn"
          onClick={onOpenChat}
          title="Abrir asistente IA"
        >
          <MessageSquare size={18} />
          {!collapsed && <span>Asistente IA</span>}
        </button>
        <button
          className="sidebar-action-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>}
        </button>
      </div>
    </div>
  );
}
