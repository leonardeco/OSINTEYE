import { useState } from 'react';
import { API_BASE_URL, INVESTIGATION_TYPES } from '../types';
import type { Investigation, InvestigationType } from '../types';
import { Spinner } from './Spinner';
import { showToast } from './Toast';
import ForceGraph2D from 'react-force-graph-2d';

interface InvestigationsViewProps {
  investigations: Investigation[];
  onRefresh: () => void;
  isLoading: boolean;
}

export function InvestigationsView({ investigations, onRefresh, isLoading }: InvestigationsViewProps) {
  const [newTarget, setNewTarget] = useState('');
  const [newName, setNewName] = useState('');
  const [investigationType, setInvestigationType] = useState<InvestigationType>('domain');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] } | null>(null);

  const validateTarget = (target: string, type: InvestigationType): string | null => {
    const trimmed = target.trim();
    if (!trimmed) return 'El objetivo no puede estar vacío.';
    if (type === 'email') {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(trimmed)) return 'Formato de email inválido (ej. user@gmail.com)';
    }
    if (type === 'ip') {
      const ipRe = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRe.test(trimmed)) return 'Formato de IP inválido (ej. 8.8.8.8)';
    }
    if (type === 'phone') {
      if (!trimmed.startsWith('+')) return 'El número de teléfono debe incluir el código de país con "+" (ej. +573226993891)';
      if (!/^\+\d{7,15}$/.test(trimmed)) return 'Formato de teléfono inválido. Solo dígitos después del "+"';
    }
    if (type === 'domain') {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return 'Ingresa solo el dominio sin http:// (ej. google.com)';
    }
    return null;
  };

  const handleCreateInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newTarget) return;

    const validationError = validateTarget(newTarget, investigationType);
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/investigations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, target: newTarget.trim(), investigation_type: investigationType })
      });
      setNewName('');
      setNewTarget('');
      showToast('Investigación iniciada correctamente', 'success');
      onRefresh();
    } catch (err) {
      showToast('Error al crear la investigación', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportInvestigation = (inv: Investigation) => {
    const reportHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte OSINTEYE: ${inv.target}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; }
          .container { max-width: 900px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
          h1 { color: #38bdf8; border-bottom: 2px solid #334155; padding-bottom: 10px; }
          h2 { color: #10b981; margin-top: 30px; }
          .meta { background: #334155; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
          .module { margin-bottom: 20px; padding: 15px; border: 1px solid #475569; border-radius: 8px; background: #0f172a; }
          pre { background: #000; padding: 15px; border-radius: 6px; overflow-x: auto; color: #a5b4fc; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>👁️ OSINTEYE Intelligence Report</h1>
          <div class="meta">
            <strong>Nombre del Caso:</strong> ${inv.name}<br>
            <strong>Objetivo:</strong> ${inv.target}<br>
            <strong>Fecha de Escaneo:</strong> ${new Date(inv.created_at).toLocaleString()}<br>
            <strong>Estado Global:</strong> ${inv.status.toUpperCase()}
          </div>
          <h2>Resultados de Módulos</h2>
          ${inv.results.map(r => `
            <div class="module">
              <h3 style="margin-top: 0; color: #f472b6;">Módulo: ${r.module_name.toUpperCase()}</h3>
              <div><strong>Estado:</strong> ${r.status}</div>
              <pre>${JSON.stringify(r.raw_data, null, 2)}</pre>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_OSINTEYE_${inv.target}_${inv.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Reporte exportado correctamente', 'success');
  };

  const handleDeleteInvestigation = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta investigación?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/investigations/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showToast('Investigación eliminada', 'success');
        onRefresh();
      } else {
        showToast('Error al eliminar la investigación', 'error');
      }
    } catch (err) {
      showToast('Error de red al eliminar', 'error');
    }
  };

  const generateGraphData = (inv: Investigation) => {
    const nodes: any[] = [{ id: inv.target, group: 1, label: inv.target }];
    const links: any[] = [];

    inv.results.forEach(res => {
      const modNodeId = `${inv.target}_${res.module_name}`;
      nodes.push({ id: modNodeId, group: 2, label: res.module_name });
      links.push({ source: inv.target, target: modNodeId });

      if (res.module_name === 'crt.sh' && res.raw_data?.subdomains) {
        res.raw_data.subdomains.slice(0, 15).forEach((sub: string) => {
          nodes.push({ id: sub, group: 3, label: sub });
          links.push({ source: modNodeId, target: sub });
        });
      }
      if (res.module_name === 'dns' && res.raw_data?.A) {
        res.raw_data.A.forEach((ip: string) => {
          nodes.push({ id: ip, group: 4, label: ip });
          links.push({ source: modNodeId, target: ip });
        });
      }
      if (res.module_name === 'port_scan' && res.raw_data?.details) {
        res.raw_data.details.forEach((p: any) => {
          const portId = `Port_${p.port}`;
          nodes.push({ id: portId, group: 5, label: `${p.port} (${p.service})` });
          links.push({ source: modNodeId, target: portId });
        });
      }
      if (res.module_name === 'shodan' && res.raw_data?.top_matches) {
        res.raw_data.top_matches.forEach((match: any) => {
          const ipId = `Shodan_${match.ip}`;
          nodes.push({ id: ipId, group: 6, label: `${match.ip} (${match.org || 'Desconocido'})` });
          links.push({ source: modNodeId, target: ipId });
        });
      }
      if (res.module_name === 'geoip' && res.raw_data?.geo_data) {
        const geo = res.raw_data.geo_data;
        const geoId = `Geo_${geo.countryCode}_${geo.city}`;
        nodes.push({ id: geoId, group: 7, label: `📍 ${geo.city}, ${geo.country}` });
        links.push({ source: modNodeId, target: geoId });
      }
    });

    setGraphData({ nodes, links });
  };

  const getModuleIcon = (moduleName: string) => {
    const icons: Record<string, string> = {
      'dns': '🌐 Registros DNS',
      'port_scan': '🔌 Escaneo de Puertos',
      'whois': '🕵️ Datos WHOIS',
      'crt.sh': '🔐 Subdominios (crt.sh)',
      'web_analyzer': '🌍 Cabeceras Web',
      'shodan': '👁️ Shodan Intel',
      'geoip': '📍 Geolocalización',
      'phone_check': '📱 Verificación Telefónica',
      'email_check': '📧 Verificación de Email',
    };
    return icons[moduleName] || moduleName;
  };

  return (
    <>
      <div className="header">
        <div>
          <h1 className="page-title">Casos de Investigación</h1>
          <p className="page-subtitle">Lanza escaneos automatizados sobre dominios, celulares, emails o IPs.</p>
        </div>
      </div>

      <div className="glass-card investigation-form-card">
        <h3 className="form-title">🔍 Nueva Investigación</h3>

        <div className="type-selector">
          {INVESTIGATION_TYPES.map(type => (
            <button
              key={type.key}
              type="button"
              onClick={() => setInvestigationType(type.key)}
              className={`type-btn ${investigationType === type.key ? 'active' : ''}`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleCreateInvestigation} className="investigation-form">
          <input
            type="text" className="search-input" placeholder="Nombre del caso (ej. Caso #001)"
            value={newName} onChange={e => setNewName(e.target.value)} required
            style={{ flex: '1 1 200px' }}
          />
          <input
            type="text" className="search-input"
            placeholder={INVESTIGATION_TYPES.find(t => t.key === investigationType)?.placeholder || 'Objetivo'}
            value={newTarget} onChange={e => setNewTarget(e.target.value)} required
            style={{ flex: '2 1 300px' }}
          />
          <button type="submit" className="ai-bot-button" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size={18} /> : '🚀 Iniciar Escaneo'}
          </button>
        </form>

        <div className="type-hint">
          {investigationType === 'phone' && '📱 Incluye el código de país con "+" (ej. +57 para Colombia, +1 para USA)'}
          {investigationType === 'domain' && '🌐 Ingresa solo el dominio sin http:// (ej. google.com)'}
          {investigationType === 'email' && '📧 Se analizarán los registros públicos asociados al email'}
          {investigationType === 'ip' && '🖥️ Se realizará geolocalización, escaneo de puertos y Shodan'}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-center">
          <Spinner size={40} label="Cargando investigaciones..." />
        </div>
      ) : (
        <div className="investigations-list">
          {investigations.map(inv => (
            <div key={inv.id} className="glass-panel investigation-card">
              <div className="investigation-header">
                <div>
                  <h3 className="investigation-name">{inv.name}</h3>
                  <div className="investigation-target">{inv.target}</div>
                </div>
                <div className="investigation-actions">
                  {inv.status === 'completed' && (
                    <button onClick={() => generateGraphData(inv)} className="btn-outline btn-primary-outline">
                      🕸️ Ver Grafo
                    </button>
                  )}
                  <button onClick={() => exportInvestigation(inv)} className="btn-outline">
                    💾 Exportar
                  </button>
                  <button onClick={() => handleDeleteInvestigation(inv.id)} className="btn-outline btn-danger-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                    🗑️ Eliminar
                  </button>
                  <span className={`badge ${inv.status === 'completed' ? 'badge-success' : inv.status === 'running' ? 'badge-warning' : 'badge-info'}`}>
                    {inv.status === 'running' && <span className="pulse-dot" />}
                    {inv.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="results-grid">
                {inv.results?.map(res => (
                  <div key={res.id} className="result-card">
                    <h4 className="result-module-name">{getModuleIcon(res.module_name)}</h4>
                    <div className="result-content">
                      {res.status === 'error' ? (
                        <span className="result-error">Error: {res.raw_data?.error || 'Error desconocido'}</span>
                      ) : (
                        <ResultRenderer moduleName={res.module_name} rawData={res.raw_data} />
                      )}
                    </div>
                  </div>
                ))}
                {(!inv.results || inv.results.length === 0) && inv.status === 'running' && (
                  <div className="empty-state">
                    <Spinner size={24} label="Escaneando objetivo..." />
                  </div>
                )}
              </div>
            </div>
          ))}
          {investigations.length === 0 && (
            <div className="empty-state">No hay investigaciones activas.</div>
          )}
        </div>
      )}

      {/* Graph Modal */}
      {graphData && (
        <div className="modal-overlay">
          <div className="modal-header">
            <h2 className="modal-title">Visualización de Inteligencia (OSINT Graph)</h2>
            <button onClick={() => setGraphData(null)} className="modal-close">✖</button>
          </div>
          <div className="modal-body">
            <ForceGraph2D
              graphData={graphData}
              nodeLabel="label"
              nodeAutoColorBy="group"
              nodeRelSize={6}
              linkColor={() => 'rgba(255,255,255,0.2)'}
              backgroundColor="transparent"
            />
          </div>
        </div>
      )}
    </>
  );
}

/* Sub-component for rendering individual module results */
function ResultRenderer({ moduleName, rawData }: { moduleName: string; rawData: any }) {
  if (!rawData) return <span>Sin datos</span>;

  switch (moduleName) {
    case 'dns':
      return (
        <div className="result-list">
          {['A', 'MX', 'NS', 'TXT'].map(record =>
            rawData[record]?.length > 0 && (
              <div key={record}>
                <strong className="result-label">{record}:</strong>
                <ul className="result-items">
                  {rawData[record].map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )
          )}
        </div>
      );

    case 'port_scan':
      return (
        <div className="badge-list">
          {rawData.details?.map((portInfo: any, i: number) => (
            <span key={i} className="badge badge-success">
              {portInfo.port} ({portInfo.service})
            </span>
          ))}
          {rawData.details?.length === 0 && <span>No se encontraron puertos abiertos.</span>}
        </div>
      );

    case 'crt.sh':
      return (
        <div>
          <div className="result-count">Encontrados: {rawData.count} subdominios</div>
          <div className="badge-list">
            {rawData.subdomains?.map((sub: string, i: number) => (
              <span key={i} className="badge badge-subtle">{sub}</span>
            ))}
          </div>
        </div>
      );

    case 'web_analyzer':
      return (
        <div className="result-list">
          {['https', 'http'].map(scheme =>
            rawData[scheme] && !rawData[scheme].error && (
              <div key={scheme} className="result-subcard">
                <div className="result-label">{scheme.toUpperCase()} — {rawData[scheme].status_code}</div>
                {rawData[scheme].title && <div className="result-highlight">"{rawData[scheme].title}"</div>}
                {Object.entries(rawData[scheme].headers || {}).map(([h, v]: any) => (
                  <div key={h}><strong className="result-dim">{h}:</strong> {v}</div>
                ))}
              </div>
            )
          )}
        </div>
      );

    case 'shodan':
      return (
        <div className="result-list">
          <div className="result-count">{rawData.total_matches} coincidencias encontradas</div>
          {rawData.top_matches?.map((m: any, i: number) => (
            <div key={i} className="result-subcard">
              <strong className="result-highlight">{m.ip}</strong> — {m.org || 'Sin Org'}
              <div className="result-dim">Puerto: {m.port} | OS: {m.os || 'N/A'}</div>
            </div>
          ))}
          {rawData.top_matches?.length === 0 && <span>Sin resultados públicos en Shodan.</span>}
        </div>
      );

    case 'geoip':
      if (!rawData.geo_data) return <span>Sin datos de geolocalización</span>;
      return (
        <div className="result-list">
          <div><strong>🗺️ Ubicación:</strong> {rawData.geo_data.city}, {rawData.geo_data.regionName}, {rawData.geo_data.country}</div>
          <div><strong>📡 ISP:</strong> {rawData.geo_data.isp} ({rawData.geo_data.org})</div>
          <div><strong>🌐 IP:</strong> {rawData.geo_data.query || rawData.resolved_ip}</div>
          <div><strong>🕒 Zona Horaria:</strong> {rawData.geo_data.timezone}</div>
        </div>
      );

    case 'phone_check':
      return (
        <div className="result-list">
          <div><strong>📞 Formato:</strong> {rawData.formato_internacional}</div>
          <div><strong>🌍 Código de País:</strong> +{rawData.codigo_pais}</div>
          <div><strong>📱 Número Nacional:</strong> {rawData.numero_nacional}</div>
          <div><strong>✅ Válido:</strong> <span className={rawData.es_valido ? 'text-success' : 'text-danger'}>{rawData.es_valido ? 'Sí' : 'No'}</span></div>
          {rawData.region && <div><strong>📍 Región:</strong> {rawData.region}</div>}
          {rawData.operador && <div><strong>📡 Operador:</strong> {rawData.operador}</div>}
          {rawData.zonas_horarias?.length > 0 && (
            <div><strong>🕒 Zona Horaria:</strong> {rawData.zonas_horarias.join(', ')}</div>
          )}
        </div>
      );

    case 'email_check':
      return (
        <div className="result-list">
          <div><strong>📧 Objetivo:</strong> {rawData.target_email}</div>
          {rawData.registered_sites?.length > 0 ? (
            <>
              <div><strong>✅ Sitios Registrados:</strong></div>
              <div className="badge-list">
                {rawData.registered_sites.map((site: string, i: number) => (
                  <span key={i} className="badge badge-info">{site}</span>
                ))}
              </div>
            </>
          ) : (
            <div><strong>ℹ️ No se encontraron registros claros.</strong></div>
          )}
          {rawData.raw_output && (
            <div style={{ marginTop: '8px' }}>
              <strong>📋 Salida Bruta:</strong>
              <pre className="result-json">{rawData.raw_output}</pre>
            </div>
          )}
        </div>
      );

    default:
      return (
        <pre className="result-json">{JSON.stringify(rawData, null, 2)}</pre>
      );
  }
}
