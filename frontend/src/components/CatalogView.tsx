import { useState } from 'react';
import type { Source, Category } from '../types';
import { Spinner } from './Spinner';
import { ToolCard } from './ToolCard';

interface CatalogViewProps {
  selectedCategory: Category | null;
  sources: Source[];
  search: string;
  onSearchChange: (search: string) => void;
  onOpenChat: () => void;
  isLoading: boolean;
}

export function CatalogView({
  selectedCategory, sources, search, onSearchChange, onOpenChat, isLoading
}: CatalogViewProps) {
  const [accessFilter, setAccessFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const accessTypes = Array.from(new Set(sources.map(s => s.access_type)));
  const statuses = Array.from(new Set(sources.map(s => s.status)));

  let filteredSources = sources;

  if (search.trim()) {
    // Global search active
    filteredSources = sources.filter(src =>
      src.name.toLowerCase().includes(search.toLowerCase()) ||
      src.description.toLowerCase().includes(search.toLowerCase())
    );
  } else if (selectedCategory) {
    // Only show category sources
    filteredSources = sources.filter(src => src.category_id === selectedCategory.id);
  }

  if (accessFilter) {
    filteredSources = filteredSources.filter(src => src.access_type === accessFilter);
  }
  if (statusFilter) {
    filteredSources = filteredSources.filter(src => src.status === statusFilter);
  }

  return (
    <>
      <div className="header">
        <div>
          <h1 className="page-title">{search.trim() ? 'Resultados de Búsqueda' : (selectedCategory?.name || 'Cargando...')}</h1>
          <p className="page-subtitle">
            {search.trim() 
              ? `Buscando "${search}" en todo el catálogo.` 
              : 'Explora las herramientas y fuentes de esta categoría.'}
          </p>
        </div>
        <div className="header-actions">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar herramientas..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button className="ai-bot-button" onClick={onOpenChat}>
            ✨ Asistente IA
          </button>
        </div>
      </div>

      <div className="nav-tabs" style={{ flexWrap: 'wrap' }}>
        <button
          className={`nav-tab ${accessFilter === null ? 'active' : ''}`}
          onClick={() => setAccessFilter(null)}
        >
          Todos los accesos
        </button>
        {accessTypes.map(type => (
          <button
            key={type}
            className={`nav-tab ${accessFilter === type ? 'active' : ''}`}
            onClick={() => setAccessFilter(accessFilter === type ? null : type)}
          >
            {type}
          </button>
        ))}
        <button
          className={`nav-tab ${statusFilter === null ? 'active' : ''}`}
          onClick={() => setStatusFilter(null)}
        >
          Todos los estados
        </button>
        {statuses.map(status => (
          <button
            key={status}
            className={`nav-tab ${statusFilter === status ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === status ? null : status)}
          >
            {status}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="loading-center">
          <Spinner size={40} label="Cargando herramientas..." />
        </div>
      ) : (
        <div className="tools-grid">
          {filteredSources.map((src, idx) => (
            <div key={src.id} style={{ animationDelay: `${idx * 0.05}s` }}>
              <ToolCard source={src} searchTerm={search} onOpenChat={onOpenChat} />
            </div>
          ))}

          {filteredSources.length === 0 && !isLoading && (
            <div className="empty-state">
              No se encontraron herramientas con tu búsqueda.
            </div>
          )}
        </div>
      )}
    </>
  );
}
