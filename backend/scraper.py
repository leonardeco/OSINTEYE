import requests
import re
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import schemas
import crud

# Make sure tables are created
models.Base.metadata.create_all(bind=engine)

def fetch_readme():
    url = "https://raw.githubusercontent.com/jivoi/awesome-osint/master/README.md"
    response = requests.get(url)
    response.raise_for_status()
    return response.text

def parse_and_insert(markdown_text: str):
    db = SessionLocal()
    
    current_category = None
    
    for line in markdown_text.splitlines():
        line = line.strip()
        
        # Match category header: ## [↑](#-table-of-contents) Category Name
        cat_match = re.match(r'^##\s+\[.*?\]\(.*?\)\s+(.+)$', line)
        if cat_match:
            cat_name = cat_match.group(1).strip()
            # Ignore Contributing and Credits and similar
            if cat_name in ["Contributing", "Credits", "Related Awesome Lists"]:
                current_category = None
                continue
            
            # Check if category exists
            db_cat = crud.get_category_by_name(db, cat_name)
            if not db_cat:
                cat_create = schemas.CategoryCreate(name=cat_name)
                db_cat = crud.create_category(db, cat_create)
            current_category = db_cat
            continue
            
        # Match source line: * [Name](URL) - Description
        if current_category:
            src_match = re.match(r'^\*\s+\[(.*?)\]\((.*?)\)(?:\s*-\s*(.*))?$', line)
            if src_match:
                name = src_match.group(1).strip()
                url = src_match.group(2).strip()
                desc = src_match.group(3)
                description = desc.strip() if desc else "No description"
                
                # Create source
                source_create = schemas.SourceCreate(
                    name=name,
                    category_id=current_category.id,
                    url=url,
                    description=description
                )
                crud.create_source(db, source_create)
                print(f"Added: {name} in {current_category.name}")
    
    db.close()

if __name__ == "__main__":
    print("Fetching awesome-osint README...")
    text = fetch_readme()
    print("Parsing and inserting to database...")
    parse_and_insert(text)
    print("Done!")
