# Design Spec: OSINTEYE Rename + Smart Module Routing
**Date:** 2026-07-25  
**Status:** Approved (auto-mode)

## Goal
Publicar el proyecto en GitHub bajo el nombre OSINTEYE (renombrando todas las referencias internas de OSINTOJO), y corregir el bug central donde el backend ejecuta TODOS los módulos de escaneo independientemente del tipo de investigación seleccionado por el usuario.

## Chosen Approach
**Mínimo cambio estructural — un campo nuevo, routing condicional.**

1. Agregar `investigation_type: Optional[str]` a la tabla `investigations` (columna nullable para no romper datos existentes).
2. Actualizar schema Pydantic y endpoint POST para recibir el campo.
3. En `runner.py`, mapear el `type` a un subconjunto de módulos. Si no se provee type, correr todos (backwards compatible).
4. Añadir `asyncio.wait_for(mod_func(target), timeout=30.0)` por módulo.
5. En frontend, enviar `type` en el POST body y validar formato del target antes de submitir.

## Rejected Alternatives
- **Endpoint por tipo** (`POST /investigations/domain/`): más REST puro pero rompe el cliente existente y duplica lógica de routing.
- **Routing solo en frontend**: no protege la API directa y duplica la lógica de "qué módulos aplican".

## Code-Graph Anchors (archivos afectados)
- `backend/models.py:54` — clase `Investigation` — agregar columna `investigation_type`
- `backend/schemas.py:66-79` — `InvestigationBase`, `InvestigationCreate`, `Investigation` — agregar campo
- `backend/crud.py:43-48` — `create_investigation` — ya usa `model_dump()`, fluye automático
- `backend/runner.py:22-48` — `run_investigation()` — agregar routing map + timeout
- `backend/ai_service.py:111-126` — `system_prompt` string — rename OSINTOJO → OSINTEYE
- `frontend/src/components/InvestigationsView.tsx:21-40` — `handleCreateInvestigation` — agregar `type` al body + validación
- `frontend/src/components/Sidebar.tsx:19` — nombre "OSINTOJO" en UI
- `frontend/src/components/InvestigationsView.tsx:61,85` — strings "OSINTOJO" en report/filename

## Global Constraints
- SQLite: agregar columna nullable con `ALTER TABLE` es soportado — SQLAlchemy `create_all` NO altera tablas existentes, se necesita la columna en el modelo con `nullable=True` y la DB existente debe ser eliminada o migrada manualmente (documentar en README).
- Python 3.10+, FastAPI, asyncio — `asyncio.wait_for` disponible.
- React 19 + TypeScript — validación pura JS, sin librerías extra.
- Timeout: 30 segundos por módulo.

## Module Routing Map
```
domain → crtsh, whois, dns, port_scan, web_analyzer, shodan, geoip
ip     → port_scan, shodan, geoip, whois
email  → email_check
phone  → phone_check
None   → todos (backwards compatible)
```

## Threat Model & Mitigations
- **User input → network requests**: el `target` llega a módulos que hacen requests externos. Validación de formato en frontend reduce inputs malformados. Los módulos ya manejan errores en try/except.
- **Secrets en repo**: `.gitignore` excluye `*.env`, `.env`; `.env.example` solo tendrá placeholders.
- **DB con datos sensibles**: `*.db` excluido del `.gitignore`.
- **No auth en API**: la API no tiene autenticación — el sistema asume uso local/privado (anotado en README).
