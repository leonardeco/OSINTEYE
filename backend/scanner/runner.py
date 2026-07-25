import asyncio
from database import SessionLocal
import crud
import schemas

from scanner.modules import crtsh, whois_mod, dns_mod, port_scan, web_analyzer, shodan_mod, geoip_mod, phone_mod, email_check

ALL_MODULES = {
    "crt.sh": crtsh.run,
    "whois": whois_mod.run,
    "dns": dns_mod.run,
    "port_scan": port_scan.run,
    "web_analyzer": web_analyzer.run,
    "shodan": shodan_mod.run,
    "geoip": geoip_mod.run,
    "phone_check": phone_mod.run,
    "email_check": email_check.run
}

TYPE_MODULE_MAP = {
    "domain": ["crt.sh", "whois", "dns", "port_scan", "web_analyzer", "shodan", "geoip"],
    "ip":     ["port_scan", "shodan", "geoip", "whois"],
    "email":  ["email_check"],
    "phone":  ["phone_check"],
}

MODULE_TIMEOUT = 30.0  # seconds per module


def get_modules_for_type(investigation_type: str | None) -> dict:
    if investigation_type and investigation_type in TYPE_MODULE_MAP:
        keys = TYPE_MODULE_MAP[investigation_type]
        return {k: ALL_MODULES[k] for k in keys if k in ALL_MODULES}
    return ALL_MODULES


async def run_investigation(investigation_id: str):
    db = SessionLocal()
    try:
        crud.update_investigation_status(db, investigation_id, "running")
        inv = crud.get_investigation(db, investigation_id)
        if not inv:
            return

        modules = get_modules_for_type(inv.investigation_type)
        tasks = [
            run_module_and_save(investigation_id, mod_name, mod_func, inv.target)
            for mod_name, mod_func in modules.items()
        ]
        await asyncio.gather(*tasks)
        crud.update_investigation_status(db, investigation_id, "completed")

    except Exception as e:
        crud.update_investigation_status(db, investigation_id, "error")
        print(f"Investigation {investigation_id} failed: {e}")
    finally:
        db.close()


async def run_module_and_save(investigation_id: str, mod_name: str, mod_func, target: str):
    db = SessionLocal()
    status = "error"
    result_data = {}
    try:
        result_data = await asyncio.wait_for(mod_func(target), timeout=MODULE_TIMEOUT)
        status = "error" if "error" in result_data else "success"
    except asyncio.TimeoutError:
        result_data = {"error": f"Módulo '{mod_name}' superó el tiempo límite de {int(MODULE_TIMEOUT)}s"}
    except Exception as e:
        result_data = {"error": str(e)}
    finally:
        result_create = schemas.ScanResultCreate(
            investigation_id=investigation_id,
            module_name=mod_name,
            status=status,
            raw_data=result_data
        )
        crud.create_scan_result(db, result_create)
        db.close()
