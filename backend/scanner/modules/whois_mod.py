import whois
import asyncio

async def run(target: str) -> dict:
    """
    Query whois for the target domain.
    """
    def sync_whois():
        try:
            w = whois.whois(target)
            return dict(w)
        except Exception as e:
            return {"error": str(e)}

    # Run blocking whois in an executor
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, sync_whois)
    
    # clean up datetime objects to strings for JSON serialization
    for key, value in result.items():
        if hasattr(value, 'isoformat'):
            result[key] = value.isoformat()
        elif isinstance(value, list):
            result[key] = [v.isoformat() if hasattr(v, 'isoformat') else str(v) for v in value]
            
    return result
