import type { Source, Category } from '../types';
import { Spinner } from './Spinner';

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

      {isLoading ? (
        <div className="loading-center">
          <Spinner size={40} label="Cargando herramientas..." />
        </div>
      ) : (
        <div className="tools-grid">
          {filteredSources.map((src, idx) => (
            <div
              key={src.id}
              className="glass-card animate-fade-in"
              style={{ animationDelay: `${idx * 0.05}s` }}
              onClick={() => window.open(src.url, '_blank')}
            >
              <h3 className="tool-name">{src.name}</h3>
              <p className="tool-desc">{src.description}</p>
              <div className="tool-meta">
                <span className="badge">{src.access_type}</span>
                <span className={`badge ${src.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                  {src.status}
                </span>
              </div>
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
