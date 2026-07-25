from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
import datetime
import uuid

from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, index=True)
    parent_id = Column(String, ForeignKey("categories.id"), nullable=True)

    subcategories = relationship("Category", backref="parent", remote_side="Category.id", foreign_keys=[parent_id])
    sources = relationship("Source", back_populates="category_rel")


class Source(Base):
    __tablename__ = "sources"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, index=True)
    category_id = Column(String, ForeignKey("categories.id"))
    url = Column(String)
    access_type = Column(String, default="web") # web | tool_local | dork | api | telegram_bot
    requires_registration = Column(Boolean, default=False)
    requires_api_key = Column(Boolean, default=False)
    status = Column(String, default="active") # active | degraded | down | deprecated
    description = Column(Text)
    notes = Column(Text, nullable=True)
    added_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    category_rel = relationship("Category", back_populates="sources")
    tags = relationship("Tag", secondary="source_tags", back_populates="sources")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, index=True)

    sources = relationship("Source", secondary="source_tags", back_populates="tags")

class SourceTag(Base):
    __tablename__ = "source_tags"

    source_id = Column(String, ForeignKey("sources.id"), primary_key=True)
    tag_id = Column(String, ForeignKey("tags.id"), primary_key=True)

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, index=True)
    target = Column(String, index=True) # Domain, IP, email, phone
    investigation_type = Column(String, nullable=True, default=None) # domain, ip, email, phone
    status = Column(String, default="pending") # pending, running, completed, error
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    results = relationship("ScanResult", back_populates="investigation")

class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    investigation_id = Column(String, ForeignKey("investigations.id"))
    module_name = Column(String, index=True)
    raw_data = Column(JSON, nullable=True)
    status = Column(String, default="success") # success, error, empty
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    investigation = relationship("Investigation", back_populates="results")

class Setting(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)
