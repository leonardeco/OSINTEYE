import httpx
import crud
from database import SessionLocal

async def run(target: str) -> dict:
    """
    Query Shodan for information about the target IP/Domain if the API Key is present in the database.
    """
    db = SessionLocal()
    try:
        shodan_key_setting = crud.get_setting(db, "shodan_api_key")
        if not shodan_key_setting or not shodan_key_setting.value:
            return {"status": "skipped", "reason": "No Shodan API Key configured in Settings."}
        
        api_key = shodan_key_setting.value
    finally:
        db.close()
        
    results = {}
    
    # We query the Shodan Host API which expects an IP. 
    # For a domain, it might fail unless we resolve it, but Shodan /shodan/host/{ip} is standard.
    # Alternatively, we can use /shodan/host/search?query={target} to see if it finds it.
    url = f"https://api.shodan.io/shodan/host/search?key={api_key}&query={target}"
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                results["total_matches"] = data.get("total", 0)
                
                # Extract first 5 matches for brief info
                matches = []
                for match in data.get("matches", [])[:5]:
                    matches.append({
                        "ip": match.get("ip_str"),
                        "port": match.get("port"),
                        "org": match.get("org"),
                        "os": match.get("os"),
                        "hostnames": match.get("hostnames", [])
                    })
                results["top_matches"] = matches
            elif response.status_code == 401:
                results["error"] = "Invalid Shodan API Key."
            else:
                results["error"] = f"Shodan API returned status: {response.status_code}"
                
    except httpx.RequestError as exc:
        results["error"] = f"Request to Shodan failed: {exc}"
    except Exception as exc:
        results["error"] = str(exc)
        
    return results
