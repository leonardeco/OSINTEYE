import httpx

async def run(target: str) -> dict:
    """
    Query crt.sh for subdomains of the target domain.
    """
    url = f"https://crt.sh/?q=%25.{target}&output=json"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                # extract unique subdomains
                subdomains = set()
                for entry in data:
                    name = entry.get("name_value", "")
                    if name:
                        subdomains.update(name.split('\n'))
                
                return {
                    "count": len(subdomains),
                    "subdomains": list(subdomains)[:100] # limit to 100 to avoid huge payloads
                }
            else:
                return {"error": f"Status code {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}
