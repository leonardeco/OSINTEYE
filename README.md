<div align="center">

```
 ██████╗ ███████╗██╗███╗   ██╗████████╗███████╗██╗   ██╗███████╗
██╔═══██╗██╔════╝██║████╗  ██║╚══██╔══╝██╔════╝╚██╗ ██╔╝██╔════╝
██║   ██║███████╗██║██╔██╗ ██║   ██║   █████╗   ╚████╔╝ █████╗  
██║   ██║╚════██║██║██║╚██╗██║   ██║   ██╔══╝    ╚██╔╝  ██╔══╝  
╚██████╔╝███████║██║██║ ╚████║   ██║   ███████╗   ██║   ███████╗
 ╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝
```

**Open Source Intelligence Platform**

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=flat-square&logo=tauri&logoColor=black)](https://tauri.app)
[![Claude](https://img.shields.io/badge/Claude-AI-D97757?style=flat-square&logo=anthropic&logoColor=white)](https://anthropic.com)

*Investiga dominios, IPs, emails y teléfonos con inteligencia automatizada*

</div>

---

## ¿Qué es OSINTEYE?

OSINTEYE es una plataforma de inteligencia de fuentes abiertas (**OSINT**) diseñada para investigaciones digitales. Combina un catálogo curado de más de **100 herramientas OSINT**, escaneos automatizados con routing inteligente por tipo de objetivo, visualización de grafos de inteligencia y un asistente IA integrado con Claude.

---

## Características

### Catálogo de Herramientas
> **101 herramientas OSINT reales** organizadas en **15 categorías**

| Categoría | Herramientas destacadas |
|-----------|------------------------|
| Dominios & DNS | Shodan, VirusTotal, DNSdumpster, Censys, crt.sh, SecurityTrails |
| Email & Credenciales | HaveIBeenPwned, Hunter.io, DeHashed, LeakCheck |
| Redes Sociales | Sherlock, Maltego, IntelX, OSINTgram |
| Búsqueda de Personas | Pipl, Spokeo, TruePeopleSearch |
| Dark Web & Leaks | IntelligenceX, Ahmia, BreachDirectory |
| Frameworks | Recon-ng, SpiderFoot, theHarvester, OSINT Framework |
| + 9 categorías más | Imágenes, Geolocalización, Empresas, Blockchain... |

### Escaneos Automatizados
> Routing inteligente — cada tipo de objetivo activa solo los módulos relevantes

```
Dominio  →  crt.sh · WHOIS · DNS · Port Scan · Web Analyzer · Shodan · GeoIP
IP       →  Port Scan · Shodan · GeoIP · WHOIS
Email    →  Holehe (120+ sitios)
Celular  →  Carrier · Región · Zona Horaria · Validación internacional
```

- Todos los módulos corren **en paralelo** con timeout de 30s cada uno
- Resultados en tiempo real con auto-refresh cada 5 segundos
- Exportación de reportes como **HTML estilizado**

### Asistente IA
- Integrado con **Claude (Anthropic)** para recomendaciones inteligentes
- Fallback local con búsqueda por keywords cuando no hay créditos
- Historial de conversación persistente en localStorage
- Quick suggestions y soporte Markdown

### Visualización
- **Grafos de inteligencia** interactivos con `react-force-graph-2d`
- Nodos por tipo: objetivo, módulos, subdominios, IPs, puertos, geolocalización
- Vista de catálogo en **grid o lista**
- Dashboard con métricas y actividad reciente

---

## Stack Tecnológico

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│   React 19 · TypeScript · Vite · Tailwind-like CSS  │
│   lucide-react · recharts · react-force-graph-2d    │
├─────────────────────────────────────────────────────┤
│                    DESKTOP                          │
│              Tauri v2 (Rust + WebView)              │
├─────────────────────────────────────────────────────┤
│                    BACKEND                          │
│   FastAPI · SQLAlchemy · Pydantic · Uvicorn         │
│   SQLite (PostgreSQL-ready via DATABASE_URL)         │
├─────────────────────────────────────────────────────┤
│               MÓDULOS DE ESCANEO                    │
│   dnspython · python-whois · phonenumbers           │
│   holehe · shodan · httpx · crt.sh API              │
├─────────────────────────────────────────────────────┤
│                      IA                             │
│        Claude claude-sonnet-4-6 (Anthropic)         │
│        Fallback heurístico sin API key              │
└─────────────────────────────────────────────────────┘
```

---

## Inicio Rápido

### Requisitos

- Python 3.10+
- Node.js 18+ con npm
- Rust (solo para compilar la app de escritorio Tauri)

### 1 — Clonar el repositorio

```bash
git clone https://github.com/leonardeco/OSINTEYE.git
cd OSINTEYE
```

### 2 — Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus claves:

```env
ANTHROPIC_API_KEY=sk-ant-...   # Para el asistente IA con Claude
SHODAN_API_KEY=...             # Para datos de infraestructura expuesta
```

> Las claves se cargan automáticamente a la base de datos al iniciar el backend.  
> También puedes configurarlas desde **⚙️ Ajustes** dentro de la app.

### 3 — Instalar dependencias del backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

### 4 — Poblar el catálogo OSINT

```bash
python seed.py
# → 101 herramientas insertadas en 15 categorías
```

### 5 — Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

### 6 — Iniciar la aplicación

**Modo navegador web** (recomendado):
```bash
# Desde la raíz del proyecto
run_web.bat
```
Abre `http://localhost:5173` en tu navegador.

**Modo app de escritorio** (requiere Rust):
```bash
run_dev.bat
```

**Compilar ejecutable** (requiere Rust + 4GB+ RAM):
```bash
build_exe.bat
```

---

## Estructura del Proyecto

```
OSINTEYE/
├── backend/
│   ├── main.py              # API FastAPI + endpoints
│   ├── models.py            # Modelos SQLAlchemy
│   ├── schemas.py           # Esquemas Pydantic
│   ├── crud.py              # Operaciones CRUD
│   ├── ai_service.py        # Servicio Claude + fallback heurístico
│   ├── database.py          # Configuración DB (SQLite / PostgreSQL)
│   ├── seed.py              # 101 herramientas OSINT reales
│   ├── requirements.txt     # Dependencias Python
│   └── scanner/
│       ├── runner.py        # Orquestador con routing por tipo
│       └── modules/
│           ├── crtsh.py     # Certificados SSL → subdominios
│           ├── dns_mod.py   # Registros DNS (A, MX, NS, TXT)
│           ├── whois_mod.py # Datos WHOIS del dominio/IP
│           ├── port_scan.py # Escaneo de puertos comunes
│           ├── web_analyzer.py  # Cabeceras HTTP/HTTPS
│           ├── shodan_mod.py    # Inteligencia Shodan
│           ├── geoip_mod.py     # Geolocalización por IP
│           ├── phone_mod.py     # Análisis de números de teléfono
│           └── email_check.py   # Holehe — presencia en 120+ sitios
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Componente raíz + estado global
│   │   ├── types.ts             # Tipos TypeScript + API_BASE_URL
│   │   ├── index.css            # Sistema de diseño dark
│   │   ├── context/
│   │   │   └── AppContext.tsx   # Contexto global (tema, contadores)
│   │   └── components/
│   │       ├── Sidebar.tsx          # Navegación colapsable con iconos
│   │       ├── DashboardView.tsx    # Métricas + gráficos + accesos rápidos
│   │       ├── CatalogView.tsx      # 101 herramientas en grid/lista
│   │       ├── InvestigationsView.tsx # Escaneos + resultados + grafo
│   │       ├── ReportsView.tsx      # Historial y exportación
│   │       ├── SettingsView.tsx     # Configuración de API keys
│   │       ├── ChatDrawer.tsx       # Asistente IA slide-in
│   │       └── Toast.tsx            # Notificaciones globales
│   └── src-tauri/           # Configuración Tauri (Rust)
├── .env.example             # Plantilla de variables de entorno
├── docker-compose.yml       # PostgreSQL + Redis (producción)
├── run_web.bat              # Iniciar backend (8002) + frontend (5173)
├── run_dev.bat              # Iniciar en modo Tauri
└── build_exe.bat            # Compilar ejecutable nativo
```

---

## API Reference

El backend expone una REST API documentada automáticamente:

- **Swagger UI:** `http://127.0.0.1:8002/docs`
- **ReDoc:** `http://127.0.0.1:8002/redoc`

### Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/categories/` | Lista de categorías del catálogo |
| `GET` | `/sources/` | Herramientas OSINT con filtro por categoría |
| `POST` | `/investigations/` | Lanza una nueva investigación |
| `GET` | `/investigations/` | Lista todas las investigaciones |
| `GET` | `/investigations/{id}` | Detalle + resultados de una investigación |
| `DELETE` | `/investigations/{id}` | Elimina una investigación |
| `POST` | `/chat/` | Consulta al asistente IA |
| `GET` | `/settings/` | Lee configuración (API keys) |
| `POST` | `/settings/` | Guarda configuración |

---

## Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `ANTHROPIC_API_KEY` | Opcional | Habilita el asistente IA con Claude. Sin ella, usa fallback por keywords. |
| `SHODAN_API_KEY` | Opcional | Habilita el módulo Shodan en investigaciones de dominio/IP. |
| `DATABASE_URL` | Opcional | Por defecto `sqlite:///./osint_catalog.db`. Soporta PostgreSQL. |

---

## Licencia

Uso personal / Proyecto privado — © 2026 leonardeco
