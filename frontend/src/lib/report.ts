import type { Investigation } from '../types';

export function buildReportHtml(inv: Investigation): string {
  return `
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
}
