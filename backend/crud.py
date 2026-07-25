from sqlalchemy.orm import Session
import models, schemas
import uuid

def get_category(db: Session, category_id: str):
    return db.query(models.Category).filter(models.Category.id == category_id).first()

def get_category_by_name(db: Session, name: str):
    return db.query(models.Category).filter(models.Category.name == name).first()

def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Category).offset(skip).limit(limit).all()

def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(name=category.name, parent_id=category.parent_id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_source(db: Session, source_id: str):
    return db.query(models.Source).filter(models.Source.id == source_id).first()

def get_sources(db: Session, skip: int = 0, limit: int = 100, category_id: str = None):
    query = db.query(models.Source)
    if category_id:
        query = query.filter(models.Source.category_id == category_id)
    return query.offset(skip).limit(limit).all()

def create_source(db: Session, source: schemas.SourceCreate):
    db_source = models.Source(**source.model_dump())
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    return db_source

def get_investigations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Investigation).order_by(models.Investigation.created_at.desc()).offset(skip).limit(limit).all()

def get_investigation(db: Session, investigation_id: str):
    return db.query(models.Investigation).filter(models.Investigation.id == investigation_id).first()

def create_investigation(db: Session, investigation: schemas.InvestigationCreate):
    db_investigation = models.Investigation(**investigation.model_dump())
    db.add(db_investigation)
    db.commit()
    db.refresh(db_investigation)
    return db_investigation

def update_investigation_status(db: Session, investigation_id: str, status: str):
    db_inv = get_investigation(db, investigation_id)
    if db_inv:
        db_inv.status = status
        db.commit()
        db.refresh(db_inv)
    return db_inv

def delete_investigation(db: Session, investigation_id: str):
    db_inv = get_investigation(db, investigation_id)
    if db_inv:
        # Delete associated scan results first to maintain referential integrity if cascade is not set
        db.query(models.ScanResult).filter(models.ScanResult.investigation_id == investigation_id).delete()
        db.delete(db_inv)
        db.commit()
        return True
    return False

def create_scan_result(db: Session, result: schemas.ScanResultCreate):
    db_res = models.ScanResult(**result.model_dump())
    db.add(db_res)
    db.commit()
    db.refresh(db_res)
    return db_res

def get_setting(db: Session, key: str):
    return db.query(models.Setting).filter(models.Setting.key == key).first()

def get_settings(db: Session):
    return db.query(models.Setting).all()

def set_setting(db: Session, key: str, value: str):
    db_setting = get_setting(db, key)
    if db_setting:
        db_setting.value = value
    else:
        db_setting = models.Setting(key=key, value=value)
        db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

