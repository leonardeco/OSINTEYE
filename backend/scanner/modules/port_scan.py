import socket
import asyncio

# Common ports to check for a quick scan
COMMON_PORTS = {
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    3306: "MySQL",
    3389: "RDP",
    5432: "PostgreSQL",
    8080: "HTTP-Proxy"
}

async def check_port(target: str, port: int) -> dict:
    loop = asyncio.get_running_loop()
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(2.0)
    
    def try_connect():
        try:
            result = s.connect_ex((target, port))
            return result == 0
        except Exception:
            return False
        finally:
            s.close()
            
    is_open = await loop.run_in_executor(None, try_connect)
    return {"port": port, "service": COMMON_PORTS[port], "open": is_open}

async def run(target: str) -> dict:
    """
    Perform a quick TCP port scan on common ports.
    """
    try:
        tasks = [check_port(target, port) for port in COMMON_PORTS.keys()]
        results = await asyncio.gather(*tasks)
        
        open_ports = [res for res in results if res["open"]]
        
        return {
            "total_scanned": len(COMMON_PORTS),
            "open_ports_found": len(open_ports),
            "details": open_ports
        }
    except Exception as e:
        return {"error": str(e)}
