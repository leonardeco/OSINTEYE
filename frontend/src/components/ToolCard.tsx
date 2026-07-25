import type { ReactNode } from 'react';
import type { Source } from '../types';

interface ToolCardProps {
  source: Source;
  searchTerm: string;
  onOpenChat: () => void;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(text: string, term: string): ReactNode {
  if (!term.trim()) return text;

  const splitRegex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
  const testRegex = new RegExp(`^${escapeRegExp(term)}$`, 'i');
  const parts = text.split(splitRegex);

  return parts.map((part, idx) =>
    testRegex.test(part) ? <mark key={idx}>{part}</mark> : part
  );
}

export function ToolCard({ source, searchTerm, onOpenChat }: ToolCardProps) {
  return (
    <div className="glass-card animate-fade-in">
      <h3 className="tool-name">{highlightMatch(source.name, searchTerm)}</h3>
      <p className="tool-desc">{highlightMatch(source.description, searchTerm)}</p>
      <div className="tool-meta">
        <span className="badge">{source.access_type}</span>
        <span className={`badge ${source.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
          {source.status}
        </span>
      </div>
      <div className="tool-actions">
        <button className="btn-outline" onClick={() => window.open(source.url, '_blank')}>
          Abrir
        </button>
        <button className="btn-outline btn-primary-outline" onClick={onOpenChat}>
          Recomendar al AI
        </button>
      </div>
    </div>
  );
}
