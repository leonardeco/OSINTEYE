from pydantic import BaseModel
from typing import List, Optional, Any
import datetime

class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: str
    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: str
    class Config:
        from_attributes = True

class SourceBase(BaseModel):
    name: str
    category_id: str
    url: str
    access_type: str = "web"
    requires_registration: bool = False
    requires_api_key: bool = False
    status: str = "active"
    description: str
    notes: Optional[str] = None

class SourceCreate(SourceBase):
    pass

class Source(SourceBase):
    id: str
    added_at: datetime.datetime
    category_rel: Optional[Category] = None
    tags: List[Tag] = []
    class Config:
        from_attributes = True

# --- Automation Schemas ---

class ScanResultBase(BaseModel):
    module_name: str
    status: str
    raw_data: Optional[Any] = None

class ScanResultCreate(ScanResultBase):
    investigation_id: str

class ScanResult(ScanResultBase):
    id: str
    created_at: datetime.datetime
    class Config:
        from_attributes = True

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

class Setting(BaseModel):
    key: str
    value: str

    class Config:
        from_attributes = True
