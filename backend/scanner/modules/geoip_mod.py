import httpx
import socket

async def run(target: str) -> dict:
    """
    Query ip-api.com to get geographical location and ISP of the target.
    If the target is a domain, resolve it to an IP first.
    """
    results = {}
    
    # Try to resolve to IP if it looks like a domain
    ip_to_scan = target
    try:
        # Very basic check, if it has letters, assume domain and resolve
        if any(c.isalpha() for c in target):
            ip_to_scan = socket.gethostbyname(target)
            results["resolved_ip"] = ip_to_scan
    except socket.gaierror:
        return {"error": f"Could not resolve {target} to an IP address for GeoIP."}
    
    url = f"http://ip-api.com/json/{ip_to_scan}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    results["geo_data"] = data
                else:
                    results["error"] = data.get("message", "Failed to retrieve GeoIP data.")
            else:
                results["error"] = f"GeoIP API returned status: {response.status_code}"
                
    except httpx.RequestError as exc:
        results["error"] = f"Request to GeoIP failed: {exc}"
    except Exception as exc:
        results["error"] = str(exc)
        
    return results
