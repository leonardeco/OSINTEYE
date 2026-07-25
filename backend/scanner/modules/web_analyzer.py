import httpx
import re

async def run(target: str) -> dict:
    """
    Analyze the web server headers and HTML title.
    """
    results = {}
    
    # Try HTTPS first, then HTTP
    for scheme in ["https", "http"]:
        url = f"{scheme}://{target}"
        try:
            async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
                response = await client.get(url, follow_redirects=True)
                
                # Extract headers of interest
                headers_to_check = ["Server", "X-Powered-By", "X-AspNet-Version"]
                found_headers = {h: response.headers.get(h) for h in headers_to_check if h in response.headers}
                
                # Extract title
                title = None
                title_match = re.search(r"<title>(.*?)</title>", response.text, re.IGNORECASE)
                if title_match:
                    title = title_match.group(1).strip()
                    
                results[scheme] = {
                    "status_code": response.status_code,
                    "final_url": str(response.url),
                    "headers": found_headers,
                    "title": title
                }
                
                # If HTTPS succeeds, no need to check HTTP usually, but we can do both if we want.
                # Let's break if we get a good response on HTTPS to save time.
                if response.status_code == 200:
                    break
                    
        except httpx.RequestError as exc:
            results[scheme] = {"error": f"Request failed: {exc}"}
        except Exception as exc:
            results[scheme] = {"error": str(exc)}
            
    return results
