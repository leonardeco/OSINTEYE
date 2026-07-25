# 👁️ OSINTEYE — Intelligence Platform

Plataforma de inteligencia OSINT (Open Source Intelligence) para investigaciones digitales. Permite catalogar herramientas, lanzar escaneos automatizados con routing inteligente por tipo de objetivo, y consultar un asistente IA especializado en ciberseguridad.

## 🚀 Características

- **📚 Catálogo OSINT** — Base de datos curada de herramientas de investigación digital, organizada por categorías
- **🔍 Escaneos Inteligentes** — Routing automático de módulos según el tipo de objetivo:
  - **Dominio** → crt.sh, WHOIS, DNS, Port Scan, Web Analyzer, Shodan, GeoIP
  - **IP** → Port Scan, Shodan, GeoIP, WHOIS
  - **Email** → Email Check
  - **Celular** → Phone Check
- **⏱️ Timeout por módulo** — Cada módulo tiene un límite de 30 segundos para evitar bloqueos
- **🤖 Asistente IA** — Chatbot integrado con Claude (Anthropic) para recomendaciones inteligentes de herramientas
- **🕸️ Grafos de Inteligencia** — Visualización interactiva de relaciones entre datos recolectados
- **💾 Reportes HTML** — Exporta resultados como reportes estilizados descargables
- **🖥️ App de Escritorio** — Compilable como aplicación nativa con Tauri v2

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Desktop | Tauri v2 |
| Backend | FastAPI + SQLAlchemy |
| Base de Datos | SQLite (PostgreSQL ready) |
| IA | Claude (Anthropic) con fallback heurístico |
| Infraestructura | Docker Compose (PostgreSQL + Redis) |

## 📋 Requisitos Previos

- **Python 3.10+** con pip
- **Node.js 18+** con npm
- **Rust** (para compilar Tauri)

## 🏃 Inicio Rápido

### Modo Navegador Web (desarrollo)
```bash
run_web.bat
```
Esto inicia el backend en `http://127.0.0.1:8000` y el frontend en `http://localhost:5173`.

### Modo App de Escritorio (Tauri)
```bash
run_dev.bat
```

### Compilar Ejecutable
```bash
build_exe.bat
```

## ⚙️ Configuración de Claves API

Copia `.env.example` a `.env` y rellena tus claves:
```bash
cp .env.example .env
```

O configúralas directamente en la sección **Ajustes** de la app:
- **Anthropic API Key** — Para habilitar el asistente IA con Claude
- **Shodan API Key** — Para obtener datos de infraestructura expuesta

## 📁 Estructura del Proyecto

```
OSINTEYE/
├── backend/
│   ├── main.py              # API FastAPI
│   ├── models.py            # Modelos SQLAlchemy
│   ├── schemas.py           # Esquemas Pydantic
│   ├── crud.py              # Operaciones CRUD
│   ├── ai_service.py        # Servicio IA (Claude + fallback)
│   ├── database.py          # Configuración DB
│   ├── requirements.txt     # Dependencias Python
│   ├── scanner/
│   │   ├── runner.py         # Orquestador con routing inteligente
│   │   └── modules/          # Módulos de escaneo por tipo
│   └── venv/                 # Entorno virtual Python (excluido del repo)
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Componente principal
│   │   ├── types.ts          # Tipos compartidos
│   │   ├── index.css         # Sistema de diseño
│   │   └── components/       # Componentes React
│   ├── src-tauri/            # Configuración Tauri
│   └── dist/                 # Build de producción (excluido del repo)
├── .env.example              # Plantilla de variables de entorno
├── docker-compose.yml        # PostgreSQL + Redis
├── run_dev.bat               # Iniciar en modo Tauri
├── run_web.bat               # Iniciar en modo navegador
└── build_exe.bat             # Compilar ejecutable
```

## ⚠️ Nota sobre la Base de Datos

Si actualizas desde una versión anterior, la nueva columna `investigation_type` no se agrega automáticamente a una DB existente. Para migrar, elimina `backend/osint_catalog.db` y reinicia el backend (los datos del catálogo se recargan desde la DB incluida en el repo al hacer deploy nuevo).

## 📜 Licencia

Uso personal / Proyecto privado.
