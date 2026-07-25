import { useState } from 'react';
import { API_BASE_URL } from '../types';
import { showToast } from './Toast';

interface SettingsViewProps {
  anthropicKey: string;
  shodanKey: string;
  onAnthropicKeyChange: (key: string) => void;
  onShodanKeyChange: (key: string) => void;
}

export function SettingsView({
  anthropicKey, shodanKey, onAnthropicKeyChange, onShodanKeyChange
}: SettingsViewProps) {
  const [isSaving, setIsSaving] = useState(false);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch(`${API_BASE_URL}/settings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'anthropic_api_key', value: anthropicKey })
      });
      await fetch(`${API_BASE_URL}/settings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'shodan_api_key', value: shodanKey })
      });
      showToast('Configuración guardada correctamente', 'success');
    } catch (err) {
      showToast('Error guardando configuración', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Integra servicios externos mediante sus API Keys.</p>
        </div>
      </div>
      <div className="glass-panel settings-panel">
        <form onSubmit={saveSettings} className="settings-form">
          <div className="form-group">
            <label className="form-label">Anthropic API Key (Claude para el Chatbot)</label>
            <input
              type="password" className="search-input full-width"
              value={anthropicKey} onChange={e => onAnthropicKeyChange(e.target.value)}
              placeholder="sk-..."
            />
            <p className="form-hint">Permite al Asistente OSINTOJO razonar respuestas complejas.</p>
          </div>
          <div className="form-group">
            <label className="form-label">Shodan API Key (Opcional)</label>
            <input
              type="password" className="search-input full-width"
              value={shodanKey} onChange={e => onShodanKeyChange(e.target.value)}
              placeholder="Clave de Shodan..."
            />
            <p className="form-hint">Permite obtener datos de infraestructura expuesta en internet.</p>
          </div>
          <button type="submit" className="ai-bot-button" disabled={isSaving}>
            {isSaving ? 'Guardando...' : '💾 Guardar Configuración'}
          </button>
        </form>
      </div>
    </>
  );
}
