import os
from sqlalchemy.orm import Session
import crud
from typing import List, Dict

def get_ai_response(db: Session, query: str, history: List[Dict[str, str]] = None) -> str:
    """
    Get response from Claude if API Key is set, otherwise fallback to local keyword heuristic.
    Supports conversation history for multi-turn chats.
    """
    anthropic_key_setting = crud.get_setting(db, "anthropic_api_key")
    if anthropic_key_setting and anthropic_key_setting.value:
        try:
            return get_real_llm_response(db, query, anthropic_key_setting.value, history or [])
        except Exception as e:
            print(f"Error LLM: {e}")
            # Si es error de créditos/billing, usar fallback local en vez de mostrar error
            err_str = str(e).lower()
            if "credit" in err_str or "billing" in err_str or "balance" in err_str or "quota" in err_str:
                return get_fallback_response(db, query)
            return f"⚠️ Error conectando con Claude: {e}"

    # Fallback heuristic (no API key configured)
    return get_fallback_response(db, query)


def get_fallback_response(db: Session, query: str) -> str:
    """Smart local keyword matching when no API key is set."""
    query_lower = query.lower()
    
    # Expanded keyword synonyms for better matching
    keyword_map = {
        "telefono": ["phone", "telefono", "celular", "móvil", "movil", "número", "numero", "llamada"],
        "email": ["email", "correo", "mail", "e-mail", "gmail", "outlook"],
        "persona": ["persona", "people", "nombre", "identidad", "buscar persona", "investigar persona"],
        "dominio": ["dominio", "domain", "sitio", "web", "website", "url", "ip"],
        "red social": ["social", "instagram", "facebook", "twitter", "linkedin", "tiktok", "usuario", "username"],
        "imagen": ["imagen", "foto", "image", "photo", "cara", "face", "facial", "reconocimiento"],
        "dark web": ["dark", "darknet", "onion", "tor", "deep web"],
        "empresa": ["empresa", "company", "compañía", "negocio", "business"],
        "contraseña": ["contraseña", "password", "breach", "leak", "filtración", "datos"],
    }
    
    # Find relevant categories from keyword map
    matched_categories = set()
    search_terms = []
    for category_key, synonyms in keyword_map.items():
        if any(syn in query_lower for syn in synonyms):
            matched_categories.add(category_key)
            search_terms.extend(synonyms)
    
    # Also use individual words as search terms
    keywords = [word for word in query_lower.split() if len(word) > 2]
    search_terms.extend(keywords)
    search_terms = list(set(search_terms))
    
    sources = crud.get_sources(db, limit=1000)
    matched_tools = []
    seen_names = set()
    
    for src in sources:
        name_lower = src.name.lower()
        desc_lower = src.description.lower() if src.description else ""
        
        if any(k in name_lower or k in desc_lower for k in search_terms):
            if src.name not in seen_names:
                matched_tools.append(src)
                seen_names.add(src.name)
                if len(matched_tools) >= 8:
                    break
    
    if not matched_tools:
        return (
            "🔍 No encontré herramientas directas para tu búsqueda.\n\n"
            "💡 Tip: Configura tu API Key de Claude en ⚙️ Ajustes para obtener "
            "respuestas inteligentes y recomendaciones avanzadas.\n\n"
            "También puedes explorar el Catálogo en la barra lateral para encontrar herramientas manualmente."
        )
    
    response = "🔍 *Modo Básico* (Sin API Key de Claude configurada)\n\n"
    response += "Te recomiendo estas herramientas:\n\n"
    for idx, tool in enumerate(matched_tools, 1):
        response += f"🔹 **{tool.name}**\n"
        response += f"   {tool.description}\n"
        response += f"   🔗 {tool.url}\n\n"
    
    response += "---\n💡 Configura Claude en ⚙️ Ajustes para respuestas más inteligentes y detalladas."
    return response


def get_real_llm_response(db: Session, query: str, api_key: str, history: List[Dict[str, str]]) -> str:
    from anthropic import Anthropic
    client = Anthropic(api_key=api_key)
    
    # Get broader catalog context organized by category
    categories = crud.get_categories(db, limit=100)
    sources = crud.get_sources(db, limit=200)
    
    # Build structured catalog
    catalog_by_category = {}
    for src in sources:
        cat_id = src.category_id
        if cat_id not in catalog_by_category:
            catalog_by_category[cat_id] = []
        catalog_by_category[cat_id].append(src)
    
    catalog_context = ""
    cat_map = {c.id: c.name for c in categories}
    for cat_id, cat_sources in catalog_by_category.items():
        cat_name = cat_map.get(cat_id, "Sin Categoría")
        catalog_context += f"\n## {cat_name}\n"
        for src in cat_sources[:10]:  # Max 10 per category
            catalog_context += f"- {src.name}: {src.description} ({src.url})\n"
    
    system_prompt = (
        "Eres OSINTEYE AI, un asistente experto en ciberseguridad, inteligencia de fuentes abiertas (OSINT) "
        "y análisis de amenazas. Respondes en español.\n\n"
        "Tu rol principal es:\n"
        "1. Recomendar herramientas OSINT del catálogo cuando el usuario busca investigar algo\n"
        "2. Explicar técnicas de investigación digital\n"
        "3. Guiar al usuario paso a paso en sus investigaciones\n"
        "4. Advertir sobre límites legales y éticos de cada técnica\n\n"
        "Reglas:\n"
        "- Responde de forma concisa pero completa\n"
        "- Usa emojis para hacer las respuestas más legibles\n"
        "- Si recomiendas herramientas, incluye siempre el enlace\n"
        "- Si no tienes una herramienta en el catálogo, puedes recomendar de tu conocimiento general\n"
        "- Siempre menciona consideraciones legales cuando sea apropiado\n\n"
        f"CATÁLOGO DE HERRAMIENTAS OSINT DISPONIBLES:\n{catalog_context}"
    )
    
    # Build messages with conversation history
    messages = []
    for msg in history:
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    messages.append({"role": "user", "content": query})
    
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        system=system_prompt,
        messages=messages
    )
    
    return response.content[0].text
