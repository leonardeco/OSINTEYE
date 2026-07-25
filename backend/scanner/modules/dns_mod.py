import dns.resolver
import asyncio

async def run(target: str) -> dict:
    """
    Query DNS records (A, MX, NS, TXT) for the target domain.
    """
    def sync_dns():
        results = {}
        record_types = ['A', 'AAAA', 'MX', 'NS', 'TXT']
        
        for rtype in record_types:
            try:
                answers = dns.resolver.resolve(target, rtype)
                results[rtype] = [str(rdata) for rdata in answers]
            except dns.resolver.NoAnswer:
                results[rtype] = []
            except dns.resolver.NXDOMAIN:
                return {"error": f"Domain {target} does not exist."}
            except Exception as e:
                # Catch timeout or other errors gracefully per record type
                pass
                
        return results

    loop = asyncio.get_running_loop()
    try:
        result = await loop.run_in_executor(None, sync_dns)
        return result
    except Exception as e:
        return {"error": str(e)}
