# Plan: OSINTEYE Rename + Smart Module Routing
**Date:** 2026-07-25  
**Spec:** docs/hydraia/specs/2026-07-25-osinteye-rename-smartrouting-design.md  
**Goal:** Subir proyecto al repo GitHub como OSINTEYE y corregir el routing de módulos por tipo.  
**Stack:** Python 3.10+ / FastAPI / SQLAlchemy / SQLite | React 19 / TypeScript / Vite / Tauri

## Architecture
Backend FastAPI monolítico + SQLite. Frontend React SPA. El campo `investigation_type` fluye: frontend → POST body → schema Pydantic → modelo SQLAlchemy → runner.py que lo usa para seleccionar módulos.

## Global Constraints
- `nullable=True` en nueva columna para no romper DB existente
- Timeout 30s por módulo con `asyncio.wait_for`
- Sin nuevas dependencias en frontend
- `.gitignore` debe excluir `venv/`, `node_modules/`, `__pycache__/`, `*.db`, `dist/`, `src-tauri/target/`, `.env`

## File Structure
| Acción | Archivo |
|--------|---------|
| Crear | `.gitignore` |
| Crear | `backend/requirements.txt` |
| Crear | `.env.example` |
| Modificar | `backend/models.py` — agregar columna `investigation_type` |
| Modificar | `backend/schemas.py` — agregar campo `investigation_type` |
| Modificar | `backend/runner.py` — routing map + timeout |
| Modificar | `backend/ai_service.py` — rename OSINTOJO→OSINTEYE en system_prompt |
| Modificar | `backend/main.py` — endpoint `/investigations/{id}/results` |
| Modificar | `frontend/src/components/Sidebar.tsx` — rename OSINTOJO→OSINTEYE |
| Modificar | `frontend/src/components/InvestigationsView.tsx` — send type, validación, rename strings |
| Modificar | `README.md` — rename OSINTOJO→OSINTEYE |

---

## Task 1: Crear .gitignore y archivos de configuración base

**Files:**
- Create: `.gitignore`
- Create: `backend/requirements.txt`
- Create: `.env.example`

**Steps:**
1. Crear `.gitignore` con el siguiente contenido EXACTO:
```
# Python
venv/
__pycache__/
*.pyc
*.pyo
*.db
*.sqlite3
.env
*.egg-info/

# Node
node_modules/
dist/

# Tauri / Rust
src-tauri/target/
src-tauri/WixTools/

# OS
.DS_Store
Thumbs.db
```

2. Crear `backend/requirements.txt` con el siguiente contenido EXACTO:
```
fastapi==0.115.0
uvicorn[standard]==0.32.0
sqlalchemy==2.0.36
pydantic==2.9.2
anthropic==0.40.0
httpx==0.27.2
python-whois==0.9.5
dnspython==2.7.0
shodan==1.31.0
phonenumbers==8.13.47
python-dotenv==1.0.1
```

3. Crear `.env.example` con el siguiente contenido EXACTO:
```
# Copia este archivo a .env y rellena tus claves
ANTHROPIC_API_KEY=sk-ant-...
SHODAN_API_KEY=your_shodan_key_here
```

**Verification:**
- `ls .gitignore backend/requirements.txt .env.example` → los 3 archivos existen

---

## Task 2: Renombrar OSINTOJO → OSINTEYE en todos los archivos

**Files:**
- Modify: `README.md`
- Modify: `backend/ai_service.py`
- Modify: `frontend/src/components/Sidebar.tsx`
- Modify: `frontend/src/components/InvestigationsView.tsx`
- Modify: `PENDIENTES.md`

**Edits exactas:**

### README.md — reemplazar título y referencias
- old: `# 👁️ OSINTOJO — Intelligence Platform`
- new: `# 👁️ OSINTEYE — Intelligence Platform`

- old: `Plataforma de inteligencia OSINT (Open Source Intelligence) para investigaciones digitales. Permite catalogar herramientas, lanzar escaneos automatizados, y consultar un asistente IA especializado en ciberseguridad.`
- new: `Plataforma de inteligencia OSINT (Open Source Intelligence) para investigaciones digitales. Permite catalogar herramientas, lanzar escaneos automatizados con routing inteligente por tipo de objetivo, y consultar un asistente IA especializado en ciberseguridad.`

- old (en estructura del proyecto): `OSINTOJO/`
- new: `OSINTEYE/`

- old: `<title>Reporte OSINTOJO:` (en InvestigationsView — Task 5 lo maneja)
- NOTE: README no tiene esto, solo se reemplaza el nombre del directorio raíz.

### ai_service.py — system_prompt
- old: `"Eres OSINTOJO AI, un asistente experto en ciberseguridad, inteligencia de fuentes abiertas (OSINT) "`
- new: `"Eres OSINTEYE AI, un asistente experto en ciberseguridad, inteligencia de fuentes abiertas (OSINT) "`

### Sidebar.tsx
- old: `<h2 className="sidebar-title">\n          <span className="sidebar-logo">👁️</span> OSINTOJO\n        </h2>`
- new: `<h2 className="sidebar-title">\n          <span className="sidebar-logo">👁️</span> OSINTEYE\n        </h2>`

### PENDIENTES.md — primera línea
- old: `# Pendientes — OSINTOJO`
- new: `# Pendientes — OSINTEYE`

**Verification:**
- `grep -r "OSINTOJO" backend/ frontend/src/ README.md PENDIENTES.md` → 0 resultados (InvestigationsView strings se manejan en Task 5)

---

## Task 3: Backend — agregar `investigation_type` al modelo y schema

**Files:**
- Modify: `backend/models.py`
- Modify: `backend/schemas.py`

**Edits exactas:**

### models.py — clase Investigation (líneas 54-63)
Reemplazar:
```python
class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, index=True)
    target = Column(String, index=True) # Domain, IP, email, etc.
    status = Column(String, default="pending") # pending, running, completed, error
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    results = relationship("ScanResult", back_populates="investigation")
```
Con:
```python
class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, index=True)
    target = Column(String, index=True) # Domain, IP, email, phone
    investigation_type = Column(String, nullable=True, default=None) # domain, ip, email, phone
    status = Column(String, default="pending") # pending, running, completed, error
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    results = relationship("ScanResult", back_populates="investigation")
```

### schemas.py — InvestigationBase y Investigation
Reemplazar:
```python
class InvestigationBase(BaseModel):
    name: str
    target: str

class InvestigationCreate(InvestigationBase):
    pass

class Investigation(InvestigationBase):
    id: str
    status: str
    created_at: datetime.datetime
    results: List[ScanResult] = []
    class Config:
        from_attributes = True
```
Con:
```python
class InvestigationBase(BaseModel):
    name: str
    target: str
    investigation_type: Optional[str] = None

class InvestigationCreate(InvestigationBase):
    pass

class Investigation(InvestigationBase):
    id: str
    status: str
    created_at: datetime.datetime
    results: List[ScanResult] = []
    class Config:
        from_attributes = True
```

**Verification:**
- `cd backend && python -c "import models, schemas; print('OK')"` → `OK`

---

## Task 4: Backend — runner.py con routing inteligente y timeout por módulo

**Files:**
- Modify: `backend/scanner/runner.py`

**Contenido completo del nuevo runner.py:**
```python
import asyncio
from database import SessionLocal
import crud
import schemas

from scanner.modules import crtsh, whois_mod, dns_mod, port_scan, web_analyzer, shodan_mod, geoip_mod, phone_mod, email_check

ALL_MODULES = {
    "crt.sh": crtsh.run,
    "whois": whois_mod.run,
    "dns": dns_mod.run,
    "port_scan": port_scan.run,
    "web_analyzer": web_analyzer.run,
    "shodan": shodan_mod.run,
    "geoip": geoip_mod.run,
    "phone_check": phone_mod.run,
    "email_check": email_check.run
}

TYPE_MODULE_MAP = {
    "domain": ["crt.sh", "whois", "dns", "port_scan", "web_analyzer", "shodan", "geoip"],
    "ip":     ["port_scan", "shodan", "geoip", "whois"],
    "email":  ["email_check"],
    "phone":  ["phone_check"],
}

MODULE_TIMEOUT = 30.0  # seconds per module

def get_modules_for_type(investigation_type: str | None) -> dict:
    if investigation_type and investigation_type in TYPE_MODULE_MAP:
        keys = TYPE_MODULE_MAP[investigation_type]
        return {k: ALL_MODULES[k] for k in keys if k in ALL_MODULES}
    return ALL_MODULES

async def run_investigation(investigation_id: str):
    db = SessionLocal()
    try:
        crud.update_investigation_status(db, investigation_id, "running")
        inv = crud.get_investigation(db, investigation_id)
        if not inv:
            return

        modules = get_modules_for_type(inv.investigation_type)
        tasks = [
            run_module_and_save(investigation_id, mod_name, mod_func, inv.target)
            for mod_name, mod_func in modules.items()
        ]
        await asyncio.gather(*tasks)
        crud.update_investigation_status(db, investigation_id, "completed")

    except Exception as e:
        crud.update_investigation_status(db, investigation_id, "error")
        print(f"Investigation {investigation_id} failed: {e}")
    finally:
        db.close()

async def run_module_and_save(investigation_id: str, mod_name: str, mod_func, target: str):
    db = SessionLocal()
    try:
        result_data = await asyncio.wait_for(mod_func(target), timeout=MODULE_TIMEOUT)
        status = "error" if "error" in result_data else "success"
    except asyncio.TimeoutError:
        result_data = {"error": f"Módulo '{mod_name}' superó el tiempo límite de {int(MODULE_TIMEOUT)}s"}
        status = "error"
    except Exception as e:
        result_data = {"error": str(e)}
        status = "error"
    finally:
        result_create = schemas.ScanResultCreate(
            investigation_id=investigation_id,
            module_name=mod_name,
            status=status,
            raw_data=result_data
        )
        crud.create_scan_result(db, result_create)
        db.close()
```

**Verification:**
- `cd backend && python -c "from scanner import runner; print('OK')"` → `OK`

---

## Task 5: Backend — nuevo endpoint /investigations/{id}/results + rename en main.py

**Files:**
- Modify: `backend/main.py`

**Agregar el siguiente endpoint DESPUÉS de la línea `def get_investigation(...):`**

Texto a agregar justo después del bloque `get_investigation` (después de la línea `return db_inv`):
```python

@app.get("/investigations/{investigation_id}/results", response_model=List[schemas.ScanResult])
def get_investigation_results(investigation_id: str, db: Session = Depends(get_db)):
    db_inv = crud.get_investigation(db, investigation_id)
    if not db_inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return db_inv.results
```

**Verification:**
- `cd backend && python -c "import main; print('OK')"` → `OK`

---

## Task 6: Frontend — InvestigationsView.tsx: enviar type, validar formato, renombrar strings

**Files:**
- Modify: `frontend/src/components/InvestigationsView.tsx`

**Edit 1 — agregar validación + enviar type en el POST (handleCreateInvestigation)**

Reemplazar:
```typescript
  const handleCreateInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newTarget) return;
    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/investigations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, target: newTarget })
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
```
Con:
```typescript
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
```

**Edit 2 — renombrar "OSINTOJO" → "OSINTEYE" en el título del reporte HTML**

Reemplazar:
```typescript
        <title>Reporte OSINTOJO: ${inv.target}</title>
```
Con:
```typescript
        <title>Reporte OSINTEYE: ${inv.target}</title>
```

**Edit 3 — renombrar en el h1 del reporte**

Reemplazar:
```typescript
          <h1>👁️ OSINTOJO Intelligence Report</h1>
```
Con:
```typescript
          <h1>👁️ OSINTEYE Intelligence Report</h1>
```

**Edit 4 — renombrar en el nombre del archivo de descarga**

Reemplazar:
```typescript
    a.download = `Reporte_OSINTOJO_${inv.target}_${inv.name.replace(/\s+/g, '_')}.html`;
```
Con:
```typescript
    a.download = `Reporte_OSINTEYE_${inv.target}_${inv.name.replace(/\s+/g, '_')}.html`;
```

**Verification:**
- `grep -n "OSINTOJO" frontend/src/components/InvestigationsView.tsx` → 0 resultados

---

## Task 7: Git init, commit inicial y push a GitHub

**Steps:**
1. Desde el directorio raíz del proyecto (`C:\Users\LEONARDO GUZMAN\Documents\Proyectos Mios\OSINTOJO`):
```bash
git init
git add .gitignore
git add backend/ --ignore-errors
git add frontend/src/ frontend/index.html frontend/package.json frontend/vite.config.ts frontend/tsconfig*.json frontend/.gitignore frontend/.oxlintrc.json
git add README.md PENDIENTES.md docker-compose.yml run_web.bat run_dev.bat build_exe.bat docs/
git commit -m "feat: initial commit — OSINTEYE Intelligence Platform

- React 19 + TypeScript + Vite + Tauri v2 frontend
- FastAPI + SQLAlchemy + SQLite backend
- 9 OSINT scan modules (domain, ip, email, phone routing)
- Claude AI assistant with fallback heuristic
- Force-graph intelligence visualization
- HTML report export
- Smart module routing by investigation type
- Per-module 30s timeout
- Format validation for all target types

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git remote add origin https://github.com/leonardeco/OSINTEYE.git
git branch -M main
git push -u origin main
```

**Verification:**
- `git log --oneline -1` → muestra el commit
- `git remote -v` → muestra origin → https://github.com/leonardeco/OSINTEYE.git
