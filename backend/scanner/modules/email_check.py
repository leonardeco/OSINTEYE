import asyncio
import json

async def run(target: str) -> dict:
    """
    Check if an email is registered on various platforms including Instagram, Facebook, and Google.
    We will use the 'holehe' library for this.
    """
    if "@" not in target:
        return {"error": "El objetivo no parece ser un correo electrónico válido."}
        
    try:
        # Run holehe via subprocess to capture its JSON output
        # Holehe checks over 120 sites, including IG, FB, Twitter, etc.
        process = await asyncio.create_subprocess_exec(
            "holehe", target, "--only-used", "--no-color", "--no-clear",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        output = stdout.decode('utf-8', errors='ignore')
        
        results = {
            "target_email": target,
            "registered_sites": [],
            "error": None
        }
        
        # Holehe's output format check
        lines = output.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Usually holehe prints "[+] Email used" for registered sites
            if "[+] Email used" in line or "[+] Email is registered" in line:
                parts = line.split()
                # Try to extract the site name, which is usually at the end of the line
                # e.g. "[+] Email used on instagram.com"
                if "on" in parts:
                    idx = parts.index("on")
                    site = " ".join(parts[idx+1:]).strip()
                    if site and site not in results["registered_sites"]:
                        results["registered_sites"].append(site)
            elif "[+]" in line and "used" not in line.lower() and "registered" not in line.lower():
                # Some versions just put [+] SiteName
                parts = line.split("[+]")
                if len(parts) > 1:
                    site = parts[1].strip()
                    # Filter out some common non-site lines
                    if site and not site.startswith("Rate limit") and site not in results["registered_sites"]:
                        results["registered_sites"].append(site)

        # Let's also do a fallback if parsing failed but it ran successfully
        if not results["registered_sites"] and "Rate limit" not in output:
            results["raw_output"] = output[:1000] # Limit output size
            
        return results
        
    except FileNotFoundError:
        return {"error": "La herramienta 'holehe' no está instalada en el sistema. Ejecuta 'pip install holehe'."}
    except Exception as e:
        return {"error": f"Error ejecutando verificación de email: {str(e)}"}

if __name__ == "__main__":
    # Test
    res = asyncio.run(run("test@example.com"))
    print(res)
