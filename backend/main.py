import os
from fastapi import Depends, FastAPI, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

import crud, models, schemas
from database import SessionLocal, engine
import ai_service
from scanner import runner
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="OSINT Catalog API")

# Enable CORS for Tauri frontend and all localhost Vite dev ports
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_origins=[
        "tauri://localhost",
        "https://tauri.localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def load_env_keys():
    """Carga API keys del .env a la base de datos si no están ya configuradas."""
    db = SessionLocal()
    try:
        anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
        if anthropic_key and not anthropic_key.startswith("sk-ant-..."):
            existing = crud.get_setting(db, "anthropic_api_key")
            if not existing or not existing.value:
                crud.set_setting(db, "anthropic_api_key", anthropic_key)

        shodan_key = os.getenv("SHODAN_API_KEY", "")
        if shodan_key and shodan_key != "your_shodan_key_here":
            existing = crud.get_setting(db, "shodan_api_key")
            if not existing or not existing.value:
                crud.set_setting(db, "shodan_api_key", shodan_key)
    finally:
        db.close()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to OSINT Catalog API"}

@app.post("/categories/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = crud.get_category_by_name(db, name=category.name)
    if db_category:
        raise HTTPException(status_code=400, detail="Category already registered")
    return crud.create_category(db=db, category=category)

@app.get("/categories/", response_model=List[schemas.Category])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = crud.get_categories(db, skip=skip, limit=limit)
    return categories

@app.get("/categories/{category_id}", response_model=schemas.Category)
def read_category(category_id: str, db: Session = Depends(get_db)):
    db_category = crud.get_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category

@app.post("/sources/", response_model=schemas.Source)
def create_source(source: schemas.SourceCreate, db: Session = Depends(get_db)):
    return crud.create_source(db=db, source=source)

@app.get("/sources/", response_model=List[schemas.Source])
def read_sources(skip: int = 0, limit: int = 100, category_id: str = None, db: Session = Depends(get_db)):
    sources = crud.get_sources(db, skip=skip, limit=limit, category_id=category_id)
    return sources

@app.get("/sources/{source_id}", response_model=schemas.Source)
def read_source(source_id: str, db: Session = Depends(get_db)):
    db_source = crud.get_source(db, source_id=source_id)
    if db_source is None:
        raise HTTPException(status_code=404, detail="Source not found")
    return db_source

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    history: list[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str

@app.post("/chat/", response_model=ChatResponse)
def chat_with_ai(request: ChatRequest, db: Session = Depends(get_db)):
    history_dicts = [{"role": m.role, "content": m.content} for m in request.history]
    response_text = ai_service.get_ai_response(db, request.query, history_dicts)
    return ChatResponse(response=response_text)

# --- Automation Endpoints ---

@app.post("/investigations/", response_model=schemas.Investigation)
def create_investigation(
    investigation: schemas.InvestigationCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    db_inv = crud.create_investigation(db, investigation)
    # Start the scan in the background
    background_tasks.add_task(runner.run_investigation, db_inv.id)
    return db_inv

@app.get("/investigations/", response_model=List[schemas.Investigation])
def get_investigations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_investigations(db, skip=skip, limit=limit)

@app.get("/investigations/{investigation_id}", response_model=schemas.Investigation)
def get_investigation(investigation_id: str, db: Session = Depends(get_db)):
    db_inv = crud.get_investigation(db, investigation_id)
    if not db_inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return db_inv

@app.get("/investigations/{investigation_id}/results", response_model=List[schemas.ScanResult])
def get_investigation_results(investigation_id: str, db: Session = Depends(get_db)):
    db_inv = crud.get_investigation(db, investigation_id)
    if not db_inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return db_inv.results

@app.delete("/investigations/{investigation_id}")
def delete_investigation(investigation_id: str, db: Session = Depends(get_db)):
    success = crud.delete_investigation(db, investigation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return {"detail": "Investigation deleted successfully"}

# --- Settings Endpoints ---

@app.get("/settings/", response_model=List[schemas.Setting])
def get_settings(db: Session = Depends(get_db)):
    return crud.get_settings(db)

@app.post("/settings/", response_model=schemas.Setting)
def set_setting(setting: schemas.Setting, db: Session = Depends(get_db)):
    return crud.set_setting(db, key=setting.key, value=setting.value)
