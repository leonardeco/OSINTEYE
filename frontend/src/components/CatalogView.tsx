import { useState } from 'react';
import { Search, ExternalLink, Lock, Unlock, Key, Sparkles } from 'lucide-react';
import type { Source, Category } from '../types';
import { Spinner } from './Spinner';

interface CatalogViewProps {
  selectedCategory: Category | null;
  sources: Source[];
  search: string;
  onSearchChange: (search: string) => void;
  onOpenChat: () => void;
  isLoading: boolean;
  categories: Category[];
}

function getAccessIcon(accessType: string) {
  if (accessType === 'free') return <Unlock size={13} />;
  if (accessType === 'freemium') return <Key size={13} />;
  return <Lock size={13} />;
}

function getAccessColor(accessType: string) {
  if (accessType === 'free') return 'badge-success';
  if (accessType === 'freemium') return 'badge-warning';
  return 'badge-danger';
}

function getCategoryName(categories: Category[], categoryId: string): string {
  return categories.find(c => c.id === categoryId)?.name || '';
}

export function CatalogView({
  selectedCategory, sources, search, onSearchChange, onOpenChat, isLoading, categories
}: CatalogViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  let filteredSources = sources;
  if (search.trim()) {
    filteredSources = sources.filter(src =>
      src.name.toLowerCase().includes(search.toLowerCase()) ||
      src.description.toLowerCase().includes(search.toLowerCase())
    );
  } else if (selectedCategory) {
    filteredSources = sources.filter(src => src.category_id === selectedCategory.id);
  }

  return (
    <>
      <div className="header">
        <div>
          <h1 className="page-title">
            {search.trim() ? 'Resultados de Búsqueda' : (selectedCategory?.name || 'Cargando...')}
          </h1>
          <p className="page-subtitle">
            {search.trim()
              ? `${filteredSources.length} resultado${filteredSources.length !== 1 ? 's' : ''} para "${search}"`
              : `${filteredSources.length} herramientas disponibles`}
          </p>
        </div>
        <div className="header-actions">
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar herramientas..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn-outline ${viewMode === 'grid' ? 'btn-primary-outline' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista en cuadrícula"
              style={{ padding: '8px 12px' }}
            >
              ⊞
            </button>
            <button
              className={`btn-outline ${viewMode === 'list' ? 'btn-primary-outline' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista en lista"
              style={{ padding: '8px 12px' }}
            >
              ☰
            </button>
          </div>
          <button className="ai-bot-button" onClick={onOpenChat}>
            <Sparkles size={16} /> Asistente IA
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-center">
          <Spinner size={40} label="Cargando herramientas..." />
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'tools-grid' : 'tools-list'}>
          {filteredSources.map((src, idx) => (
            viewMode === 'grid' ? (
              <ToolCard key={src.id} src={src} idx={idx} categories={categories} />
            ) : (
              <ToolRow key={src.id} src={src} categories={categories} />
            )
          ))}

          {filteredSources.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <Search size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div>No se encontraron herramientas.</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ToolCard({ src, idx, categories }: { src: Source; idx: number; categories: Category[] }) {
  const catName = getCategoryName(categories, src.category_id);

  return (
    <div
      className="glass-card tool-card animate-fade-in"
      style={{ animationDelay: `${Math.min(idx * 0.04, 0.8)}s` }}
      onClick={() => window.open(src.url, '_blank')}
    >
      <div className="tool-card-header">
        <div className="tool-card-icon">
          {src.name.charAt(0).toUpperCase()}
        </div>
        <div className="tool-card-meta-top">
          {catName && <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{catName}</span>}
          <ExternalLink size={13} style={{ color: '#64748b', marginLeft: 'auto' }} />
        </div>
      </div>

      <h3 className="tool-name">{src.name}</h3>
      <p className="tool-desc">{src.description || 'Sin descripción disponible.'}</p>

      <div className="tool-meta">
        <span className={`badge ${getAccessColor(src.access_type)}`}>
          {getAccessIcon(src.access_type)}
          {src.access_type}
        </span>
        <span className={`badge ${src.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
          {src.status === 'active' ? '● Activo' : '● Inactivo'}
        </span>
      </div>
    </div>
  );
}

function ToolRow({ src, categories }: { src: Source; categories: Category[] }) {
  const catName = getCategoryName(categories, src.category_id);

  return (
    <div
      className="tool-row"
      onClick={() => window.open(src.url, '_blank')}
    >
      <div className="tool-row-icon">{src.name.charAt(0).toUpperCase()}</div>
      <div className="tool-row-info">
        <span className="tool-row-name">{src.name}</span>
        <span className="tool-row-desc">{src.description}</span>
      </div>
      <div className="tool-row-badges">
        {catName && <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{catName}</span>}
        <span className={`badge ${getAccessColor(src.access_type)}`}>
          {getAccessIcon(src.access_type)} {src.access_type}
        </span>
        <span className={`badge ${src.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
          {src.status === 'active' ? '● Activo' : '● Inactivo'}
        </span>
      </div>
      <ExternalLink size={14} style={{ color: '#64748b', flexShrink: 0 }} />
    </div>
  );
}
