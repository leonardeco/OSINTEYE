# Pendientes — OSINTEYE

---

## ✅ Completado en este deploy

- [x] Proyecto renombrado de OSINTOJO → OSINTEYE en todos los archivos
- [x] Routing inteligente de módulos por tipo (domain/ip/email/phone)
- [x] Timeout de 30s por módulo de escaneo
- [x] Validación de formato en frontend antes de lanzar investigación
- [x] `investigation_type` persistido en la base de datos
- [x] Endpoint `/investigations/{id}/results` agregado
- [x] `requirements.txt` y `.env.example` creados
- [x] `.gitignore` configurado correctamente
- [x] Subido al repo https://github.com/leonardeco/OSINTEYE

---

## 🚧 Pendiente — Compilar ejecutable Tauri

- Máquina con solo 3.44 GB de RAM y sin permisos de administrador → los builds en modo `release` fallan por falta de memoria.
- Ya instalado: Rust (rustup, stable-x86_64-pc-windows-msvc) y Visual Studio Build Tools.
- `frontend/src-tauri/Cargo.toml` tiene `[profile.dev]` con `opt-level = 0`, `debug = false`, `incremental = false`.

**Para reintentar en una máquina con más RAM:**
```powershell
$env:PATH += ";$env:USERPROFILE\.cargo\bin"
$env:CARGO_BUILD_JOBS = "1"
cd frontend
npm run tauri build -- --debug
```

---

## 🎨 Plan de Mejora de Interfaz (UI/UX)

> **Prioridad:** Alta — la interfaz actual funciona pero es básica. Las mejoras de abajo la harían significativamente más profesional y usable.

### 1. Dashboard / Home Page

**Objetivo:** Agregar una vista principal con estadísticas en tiempo real.

**Componentes a crear:**
- `DashboardView.tsx` — nueva vista inicial
- Cards con métricas: total investigaciones, módulos ejecutados, herramientas en catálogo, última actividad
- Gráfico de actividad semanal (usar `recharts` — ya popular en el ecosistema React)
- Accesos rápidos a "Nueva Investigación" y "Buscar herramienta"

**Cambios requeridos:**
- Agregar `'dashboard'` a `ViewType` en `types.ts`
- Agregar botón en `Sidebar.tsx`
- En `App.tsx` hacer que `dashboard` sea la vista inicial

---

### 2. Sidebar mejorado con iconos y collapse

**Objetivo:** Sidebar más visual y organizado.

**Componentes a modificar:**
- `Sidebar.tsx` — agregar iconos SVG inline o usar `lucide-react`
- Agregar toggle para colapsar/expandir el sidebar (mostrar solo iconos)
- Resaltar visualmente la vista activa con animación suave
- Mostrar badge con count de investigaciones activas en el tab "Investigar"

**Dependencia nueva:** `lucide-react` (iconos ligeros, tree-shakeable)

---

### 3. Tarjetas de herramientas del catálogo mejoradas

**Objetivo:** Las herramientas del catálogo ahora son texto plano, deberían ser cards visuales.

**Componentes a crear/modificar:**
- `ToolCard.tsx` — card con: nombre, descripción truncada, badges de categoría/tipo, botón "Abrir" y botón "Recomendar al AI"
- `CatalogView.tsx` — layout de grid responsivo (2-3 columnas) en lugar de lista plana
- Filtros visuales: por tipo de acceso (web/API/local), por si requiere registro, por status
- Búsqueda con highlight de texto encontrado

---

### 4. Vista de Investigación mejorada

**Objetivo:** Los resultados de módulos son difíciles de leer en su estado actual.

**Mejoras:**
- Tabs por módulo en lugar de grid de cards pequeñas — más espacio para cada resultado
- Indicador de progreso visual durante el escaneo (barra de progreso con módulos completados)
- Timestamp de cuándo terminó cada módulo
- Botón de "copiar al portapapeles" en cada resultado relevante
- El grafo de inteligencia debería abrirse en un modal full-screen con controles zoom/pan

---

### 5. Componente de Chat (AI Assistant) mejorado

**Objetivo:** El modal de chat se siente básico.

**Mejoras:**
- Hacer el chat un panel lateral deslizable (slide-in desde la derecha) en lugar de modal
- Markdown rendering en respuestas del AI (usar `react-markdown`)
- Timestamps en mensajes
- Botón de "Copiar respuesta"
- Sugerencias rápidas pre-configuradas: "¿Cómo investigo un dominio?", "¿Qué módulos usa IP?", etc.
- Historial de conversaciones (guardar en localStorage)

---

### 6. Sistema de Temas (Dark/Light)

**Objetivo:** La app solo tiene modo oscuro, agregar toggle.

**Implementación:**
- Variable CSS `data-theme` en `<html>`
- Todas las variables de color en `index.css` ya usan variables CSS — solo agregar un set de overrides para `[data-theme="light"]`
- Botón toggle en el header o Sidebar
- Guardar preferencia en `localStorage`

---

### 7. Notificaciones y Estado Global

**Objetivo:** El sistema de Toast actual es básico y los estados de carga están dispersos.

**Mejoras:**
- Notificación push del navegador cuando una investigación termina (usar Web Notifications API)
- Context/Zustand para estado global en lugar del prop-drilling actual en App.tsx
- Indicador global de "investigación en progreso" en el sidebar

---

### 8. Página de Reportes dedicada

**Objetivo:** Los reportes HTML descargables son buenos pero desconectados de la app.

**Nueva vista:**
- `ReportsView.tsx` — lista de todas las investigaciones completadas
- Preview del reporte dentro de la app (iframe o componente de renderizado)
- Filtros por fecha, objetivo, tipo
- Comparación de dos investigaciones side-by-side

---

## 📋 Orden de implementación sugerido

| Prioridad | Tarea | Esfuerzo estimado |
|-----------|-------|-------------------|
| 1 | Tarjetas de catálogo mejoradas (Task 3) | 3-4 horas |
| 2 | Vista de investigación con tabs + progreso (Task 4) | 4-5 horas |
| 3 | Sidebar con iconos y badge (Task 2) | 2-3 horas |
| 4 | Panel de chat mejorado (Task 5) | 3-4 horas |
| 5 | Dashboard con métricas (Task 1) | 4-5 horas |
| 6 | Sistema de temas dark/light (Task 6) | 2 horas |
| 7 | Notificaciones + estado global (Task 7) | 3-4 horas |
| 8 | Página de reportes (Task 8) | 4-5 horas |

**Dependencias nuevas a instalar:**
```bash
cd frontend
npm install lucide-react recharts react-markdown
```

---

## 🔧 Deuda técnica conocida

- La DB existente (`osint_catalog.db`) no tiene la columna `investigation_type` si se creó antes de este deploy. Eliminar y reiniciar el backend para migrar.
- `App.tsx` tiene prop-drilling pesado — considerar Context o Zustand en la siguiente iteración.
- Los módulos de escaneo no tienen tests unitarios.
- El `email_check.py` depende de herramientas externas (`holehe`) — documentar dependencias adicionales.
