"""
Seed script: pobla la base de datos con herramientas OSINT reales.
Uso: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

# ─────────────────────────────────────────────
# DATOS
# ─────────────────────────────────────────────

CATEGORIES = [
    "Búsqueda de Personas",
    "Dominios & DNS",
    "Direcciones IP & Redes",
    "Redes Sociales",
    "Email & Credenciales",
    "Teléfonos & Móviles",
    "Imágenes & Multimedia",
    "Mapas & Geolocalización",
    "Empresas & Registros",
    "Vulnerabilidades & Exploits",
    "Dark Web & Leaks",
    "Metadatos & Archivos",
    "Criptomonedas & Blockchain",
    "Vehículos & Matrículas",
    "Frameworks & Plataformas",
]

# (nombre, categoria, url, access_type, requires_registration, requires_api_key, status, descripcion)
SOURCES = [

    # ── Búsqueda de Personas ─────────────────────────────────────────────
    ("Pipl", "Búsqueda de Personas", "https://pipl.com", "freemium", True, True, "active",
     "Motor de búsqueda de personas con datos de contacto, redes sociales y registros públicos."),
    ("Spokeo", "Búsqueda de Personas", "https://www.spokeo.com", "freemium", False, False, "active",
     "Agrega información pública de personas: direcciones, teléfonos, emails y redes sociales."),
    ("WhitePages", "Búsqueda de Personas", "https://www.whitepages.com", "freemium", False, False, "active",
     "Directorio de personas y negocios en EE.UU. con datos de contacto y registros públicos."),
    ("TruePeopleSearch", "Búsqueda de Personas", "https://www.truepeoplesearch.com", "free", False, False, "active",
     "Búsqueda gratuita de personas en EE.UU. con direcciones, teléfonos y familiares."),
    ("FastPeopleSearch", "Búsqueda de Personas", "https://www.fastpeoplesearch.com", "free", False, False, "active",
     "Búsqueda rápida y gratuita de personas con historial de direcciones y números de teléfono."),
    ("Intelius", "Búsqueda de Personas", "https://www.intelius.com", "paid", True, False, "active",
     "Informes detallados de personas con historial criminal, propiedades y familiares."),
    ("411", "Búsqueda de Personas", "https://www.411.com", "free", False, False, "active",
     "Directorio telefónico y de personas en EE.UU. con búsqueda por nombre o número."),
    ("PeekYou", "Búsqueda de Personas", "https://www.peekyou.com", "free", False, False, "active",
     "Agrega perfiles de redes sociales, blogs y registros web de personas reales."),

    # ── Dominios & DNS ───────────────────────────────────────────────────
    ("Shodan", "Dominios & DNS", "https://www.shodan.io", "freemium", True, True, "active",
     "Motor de búsqueda de dispositivos conectados a internet: servidores, cámaras, IoT y más."),
    ("VirusTotal", "Dominios & DNS", "https://www.virustotal.com", "freemium", True, True, "active",
     "Analiza URLs, dominios, IPs y archivos con más de 70 motores antivirus y reputación."),
    ("DNSdumpster", "Dominios & DNS", "https://dnsdumpster.com", "free", False, False, "active",
     "Reconocimiento DNS: descubre subdominios, registros MX, NS y mapa de red del dominio."),
    ("SecurityTrails", "Dominios & DNS", "https://securitytrails.com", "freemium", True, True, "active",
     "Historial DNS completo, subdominios, registros WHOIS actuales e históricos."),
    ("crt.sh", "Dominios & DNS", "https://crt.sh", "free", False, False, "active",
     "Transparencia de certificados SSL/TLS: descubre subdominios mediante certificados emitidos."),
    ("Censys", "Dominios & DNS", "https://search.censys.io", "freemium", True, True, "active",
     "Escaneo de internet para inventario de activos: hosts, certificados y dominios expuestos."),
    ("MXToolbox", "Dominios & DNS", "https://mxtoolbox.com", "free", False, False, "active",
     "Diagnóstico de DNS, MX, SPF, DKIM y DMARC. Herramientas de salud de correo y dominios."),
    ("Sublist3r", "Dominios & DNS", "https://github.com/aboul3la/Sublist3r", "free", False, False, "active",
     "Herramienta Python para enumeración de subdominios usando motores de búsqueda y DNS."),
    ("RiskIQ PassiveTotal", "Dominios & DNS", "https://community.riskiq.com", "freemium", True, True, "active",
     "Inteligencia de amenazas: DNS pasivo, WHOIS histórico, rastreo de infraestructura atacante."),
    ("BGPView", "Dominios & DNS", "https://bgpview.io", "free", False, False, "active",
     "Información de ASN, prefijos BGP y geolocalización de bloques de IPs."),
    ("Whoxy", "Dominios & DNS", "https://www.whoxy.com", "freemium", False, True, "active",
     "API WHOIS con historial de registros, búsqueda inversa por email y nombre de propietario."),

    # ── Direcciones IP & Redes ───────────────────────────────────────────
    ("AbuseIPDB", "Direcciones IP & Redes", "https://www.abuseipdb.com", "freemium", True, True, "active",
     "Base de datos colaborativa de IPs maliciosas con historial de reportes de abuso."),
    ("IPinfo", "Direcciones IP & Redes", "https://ipinfo.io", "freemium", False, True, "active",
     "Geolocalización, ASN, ISP y datos de red de cualquier dirección IP."),
    ("IPVoid", "Direcciones IP & Redes", "https://www.ipvoid.com", "free", False, False, "active",
     "Verificación de reputación de IPs contra múltiples blacklists y servicios de amenazas."),
    ("Wigle", "Direcciones IP & Redes", "https://wigle.net", "freemium", True, False, "active",
     "Base de datos global de redes WiFi geolocalizadas con historial de SSIDs y MACs."),
    ("Shodan Honeyscore", "Direcciones IP & Redes", "https://honeyscore.shodan.io", "free", False, False, "active",
     "Determina si una IP es un honeypot usando análisis de Shodan."),
    ("GreyNoise", "Direcciones IP & Redes", "https://viz.greynoise.io", "freemium", True, True, "active",
     "Clasifica IPs que escanean internet masivamente para separar ruido de amenazas reales."),
    ("Talos Intelligence", "Direcciones IP & Redes", "https://talosintelligence.com", "free", False, False, "active",
     "Reputación de IPs, dominios y emails de Cisco Talos con contexto de amenazas globales."),

    # ── Redes Sociales ───────────────────────────────────────────────────
    ("Sherlock", "Redes Sociales", "https://github.com/sherlock-project/sherlock", "free", False, False, "active",
     "Herramienta Python que busca un nombre de usuario en más de 300 redes sociales simultáneamente."),
    ("Social Searcher", "Redes Sociales", "https://www.social-searcher.com", "freemium", False, False, "active",
     "Monitoreo de redes sociales en tiempo real: búsqueda por keyword, hashtag o usuario."),
    ("Maltego", "Redes Sociales", "https://www.maltego.com", "freemium", True, True, "active",
     "Plataforma de análisis de relaciones OSINT con grafos interactivos y +50 fuentes de datos."),
    ("IntelX", "Redes Sociales", "https://intelx.io", "freemium", True, True, "active",
     "Motor de búsqueda OSINT para emails, dominios, IPs, Bitcoin, pastes y dark web."),
    ("Namechk", "Redes Sociales", "https://namechk.com", "free", False, False, "active",
     "Verifica disponibilidad de un nombre de usuario en más de 100 redes sociales y dominios."),
    ("Knowem", "Redes Sociales", "https://knowem.com", "freemium", False, False, "active",
     "Búsqueda de nombre de usuario en más de 500 redes sociales, marcas y dominios."),
    ("Twint", "Redes Sociales", "https://github.com/twintproject/twint", "free", False, False, "degraded",
     "Scraper de Twitter/X sin API: extrae tweets, seguidores, likes y más datos de perfiles."),
    ("OSINTgram", "Redes Sociales", "https://github.com/Datalux/Osintgram", "free", False, False, "active",
     "Herramienta OSINT para Instagram: extrae seguidores, seguidos, posts y datos de perfil."),

    # ── Email & Credenciales ─────────────────────────────────────────────
    ("Have I Been Pwned", "Email & Credenciales", "https://haveibeenpwned.com", "free", False, False, "active",
     "Verifica si un email o teléfono aparece en brechas de datos conocidas."),
    ("Hunter.io", "Email & Credenciales", "https://hunter.io", "freemium", True, True, "active",
     "Encuentra y verifica emails corporativos asociados a un dominio con patrones de formato."),
    ("Emailrep.io", "Email & Credenciales", "https://emailrep.io", "freemium", False, True, "active",
     "Reputación de emails: detecta cuentas desechables, spam y riesgo de phishing."),
    ("DeHashed", "Email & Credenciales", "https://dehashed.com", "paid", True, True, "active",
     "Base de datos de credenciales filtradas: búsqueda por email, usuario, IP, contraseña y hash."),
    ("Snov.io", "Email & Credenciales", "https://snov.io", "freemium", True, True, "active",
     "Buscador y verificador de emails con tecnología de inteligencia artificial."),
    ("Verify-Email", "Email & Credenciales", "https://verify-email.org", "free", False, False, "active",
     "Verificación gratuita de emails: comprueba existencia del buzón sin enviar mensaje."),
    ("Infoga", "Email & Credenciales", "https://github.com/m4ll0k/Infoga", "free", False, False, "active",
     "Recopila información de cuentas de email desde fuentes públicas y APIs abiertas."),
    ("LeakCheck", "Email & Credenciales", "https://leakcheck.io", "freemium", True, True, "active",
     "Búsqueda en bases de datos de filtraciones: emails, contraseñas, usuarios y dominios."),

    # ── Teléfonos & Móviles ──────────────────────────────────────────────
    ("Truecaller", "Teléfonos & Móviles", "https://www.truecaller.com", "freemium", True, False, "active",
     "Identificación de llamadas y búsqueda inversa de números de teléfono a nivel mundial."),
    ("NumLookup", "Teléfonos & Móviles", "https://www.numlookup.com", "free", False, False, "active",
     "Búsqueda inversa gratuita de números de teléfono con datos del operador y localización."),
    ("PhoneInfoga", "Teléfonos & Móviles", "https://github.com/sundowndev/phoneinfoga", "free", False, False, "active",
     "Framework de reconocimiento avanzado para números de teléfono internacionales."),
    ("SpyDialer", "Teléfonos & Móviles", "https://spydialer.com", "free", False, False, "active",
     "Búsqueda inversa de teléfonos en EE.UU. con nombres y ubicaciones asociadas."),
    ("CallerID Test", "Teléfonos & Móviles", "https://www.calleridtest.com", "free", False, False, "active",
     "Verifica el nombre registrado en el CallerID de números telefónicos de EE.UU."),
    ("Carrier Lookup", "Teléfonos & Móviles", "https://www.carrierlookup.com", "freemium", False, True, "active",
     "Identifica el operador móvil y tipo de línea (móvil/fija/VoIP) de cualquier número."),

    # ── Imágenes & Multimedia ────────────────────────────────────────────
    ("Google Images", "Imágenes & Multimedia", "https://images.google.com", "free", False, False, "active",
     "Búsqueda inversa de imágenes para encontrar fuentes originales, personas y objetos."),
    ("TinEye", "Imágenes & Multimedia", "https://tineye.com", "freemium", False, True, "active",
     "Motor de búsqueda inversa de imágenes especializado con índice de más de 60 mil millones de imágenes."),
    ("Yandex Images", "Imágenes & Multimedia", "https://yandex.com/images", "free", False, False, "active",
     "Búsqueda inversa de imágenes de Yandex, especialmente eficaz para rostros y personas de Europa del Este."),
    ("PimEyes", "Imágenes & Multimedia", "https://pimeyes.com", "freemium", False, False, "active",
     "Motor de reconocimiento facial para búsqueda inversa de rostros en internet."),
    ("FotoForensics", "Imágenes & Multimedia", "https://fotoforensics.com", "free", False, False, "active",
     "Análisis forense de imágenes: detección de manipulación, metadatos EXIF y análisis ELA."),
    ("Jeffrey's EXIF Viewer", "Imágenes & Multimedia", "https://exif.regex.info/exif.cgi", "free", False, False, "active",
     "Extrae y visualiza metadatos EXIF completos de imágenes incluyendo GPS y datos de cámara."),
    ("InVID WeVerify", "Imágenes & Multimedia", "https://weverify.eu/tools", "free", False, False, "active",
     "Verificación de imágenes y videos: búsqueda inversa, keyframes y análisis de metadatos."),

    # ── Mapas & Geolocalización ──────────────────────────────────────────
    ("Google Earth", "Mapas & Geolocalización", "https://earth.google.com", "free", False, False, "active",
     "Imágenes satelitales de alta resolución con vista histórica y Street View 3D."),
    ("Overpass Turbo", "Mapas & Geolocalización", "https://overpass-turbo.eu", "free", False, False, "active",
     "API de consulta para OpenStreetMap: extrae datos geoespaciales con consultas personalizadas."),
    ("GeoHack", "Mapas & Geolocalización", "https://geohack.toolforge.org", "free", False, False, "active",
     "Agrega coordenadas geográficas con links a múltiples mapas y herramientas de localización."),
    ("SunCalc", "Mapas & Geolocalización", "https://www.suncalc.org", "free", False, False, "active",
     "Calcula posición solar, sombras y ángulos de luz para verificar geolocalización por imágenes."),
    ("Creepy", "Mapas & Geolocalización", "https://github.com/ilektrojohn/creepy", "free", False, False, "active",
     "Extrae y visualiza geolocalización de publicaciones en redes sociales en un mapa."),
    ("OpenCelliD", "Mapas & Geolocalización", "https://opencellid.org", "freemium", True, True, "active",
     "Base de datos abierta de torres de celular con geolocalización por triangulación."),

    # ── Empresas & Registros ─────────────────────────────────────────────
    ("OpenCorporates", "Empresas & Registros", "https://opencorporates.com", "freemium", False, True, "active",
     "Base de datos global de empresas con información de registros mercantiles de 140+ países."),
    ("OCCRP Aleph", "Empresas & Registros", "https://aleph.occrp.org", "free", True, False, "active",
     "Plataforma de OSCRP con documentos filtrados, registros corporativos y datos de Panama Papers."),
    ("OpenSanctions", "Empresas & Registros", "https://www.opensanctions.org", "freemium", False, True, "active",
     "Base de datos de personas y empresas sancionadas, PEPs y entidades de alto riesgo."),
    ("EDGAR SEC", "Empresas & Registros", "https://www.sec.gov/cgi-bin/browse-edgar", "free", False, False, "active",
     "Sistema de búsqueda de registros públicos de empresas ante la SEC de EE.UU."),
    ("Dun & Bradstreet", "Empresas & Registros", "https://www.dnb.com", "freemium", True, False, "active",
     "Información financiera y crediticia de empresas a nivel mundial con datos D-U-N-S."),
    ("LittleSis", "Empresas & Registros", "https://littlesis.org", "free", False, False, "active",
     "Base de datos de relaciones entre personas poderosas: políticos, ejecutivos y donantes."),
    ("Offshore Leaks", "Empresas & Registros", "https://offshoreleaks.icij.org", "free", False, False, "active",
     "Base de datos del ICIJ con Panama Papers, Pandora Papers y otras filtraciones offshore."),

    # ── Vulnerabilidades & Exploits ──────────────────────────────────────
    ("NVD NIST", "Vulnerabilidades & Exploits", "https://nvd.nist.gov", "free", False, False, "active",
     "Base de datos nacional de vulnerabilidades del NIST con CVEs, CVSS scores y parches."),
    ("Exploit-DB", "Vulnerabilidades & Exploits", "https://www.exploit-db.com", "free", False, False, "active",
     "Archivo público de exploits y software vulnerable mantenido por Offensive Security."),
    ("CVEdetails", "Vulnerabilidades & Exploits", "https://www.cvedetails.com", "free", False, False, "active",
     "Base de datos de CVEs con estadísticas por vendedor, producto y severidad."),
    ("Vulners", "Vulnerabilidades & Exploits", "https://vulners.com", "freemium", True, True, "active",
     "Motor de búsqueda de vulnerabilidades con datos de 150+ fuentes y correlación de CVEs."),
    ("Packet Storm", "Vulnerabilidades & Exploits", "https://packetstormsecurity.com", "free", False, False, "active",
     "Repositorio de exploits, advisories, herramientas y whitepapers de seguridad."),
    ("Full Disclosure", "Vulnerabilidades & Exploits", "https://seclists.org/fulldisclosure", "free", False, False, "active",
     "Lista de correo histórica de divulgación completa de vulnerabilidades de seguridad."),

    # ── Dark Web & Leaks ─────────────────────────────────────────────────
    ("IntelligenceX", "Dark Web & Leaks", "https://intelx.io", "freemium", True, True, "active",
     "Busca en dark web, pastes, datos filtrados, emails, dominios y Bitcoin en un solo lugar."),
    ("Ahmia", "Dark Web & Leaks", "https://ahmia.fi", "free", False, False, "active",
     "Motor de búsqueda para servicios .onion de la red Tor, indexa sitios de la dark web."),
    ("Pastebin Search", "Dark Web & Leaks", "https://psbdmp.ws", "free", False, False, "active",
     "Archivo de Pastebin con más de 40 millones de pastes indexados y buscables."),
    ("BreachDirectory", "Dark Web & Leaks", "https://breachdirectory.org", "freemium", False, True, "active",
     "Búsqueda en filtraciones: verifica si emails o usuarios aparecen en brechas de seguridad."),
    ("GhostProject", "Dark Web & Leaks", "https://ghostproject.fr", "freemium", True, False, "active",
     "Búsqueda de emails y contraseñas en bases de datos filtradas de la dark web."),

    # ── Metadatos & Archivos ─────────────────────────────────────────────
    ("ExifTool", "Metadatos & Archivos", "https://exiftool.org", "free", False, False, "active",
     "Herramienta de línea de comandos para leer, escribir y editar metadatos de archivos."),
    ("Metagoofil", "Metadatos & Archivos", "https://github.com/laramies/metagoofil", "free", False, False, "active",
     "Extrae metadatos de documentos públicos (PDF, DOC, XLS) de un dominio objetivo."),
    ("FOCA", "Metadatos & Archivos", "https://github.com/ElevenPaths/FOCA", "free", False, False, "active",
     "Extrae metadatos de documentos encontrados en Google y Bing para reconocimiento de red."),
    ("CachedView", "Metadatos & Archivos", "https://cachedview.nl", "free", False, False, "active",
     "Accede a versiones cacheadas de Google y Wayback Machine de cualquier URL."),
    ("Wayback Machine", "Metadatos & Archivos", "https://web.archive.org", "free", False, False, "active",
     "Archivo histórico de internet con más de 800 mil millones de páginas web capturadas."),

    # ── Criptomonedas & Blockchain ───────────────────────────────────────
    ("Blockchain Explorer", "Criptomonedas & Blockchain", "https://www.blockchain.com/explorer", "free", False, False, "active",
     "Explorador de blockchain Bitcoin y Ethereum: transacciones, wallets y bloques en tiempo real."),
    ("Etherscan", "Criptomonedas & Blockchain", "https://etherscan.io", "freemium", False, True, "active",
     "Explorador y analítica de la red Ethereum: contratos, tokens, transacciones y wallets."),
    ("Chainalysis Reactor", "Criptomonedas & Blockchain", "https://www.chainalysis.com", "paid", True, True, "active",
     "Plataforma profesional de análisis blockchain para investigación de cripto-delitos."),
    ("OXT", "Criptomonedas & Blockchain", "https://oxt.me", "free", False, False, "active",
     "Análisis de privacidad y exploración de la blockchain de Bitcoin con grafos de transacciones."),
    ("CryptoScamDB", "Criptomonedas & Blockchain", "https://cryptoscamdb.org", "free", False, False, "active",
     "Base de datos de estafas cripto: dominios fraudulentos, wallets y URLs de phishing."),

    # ── Vehículos & Matrículas ───────────────────────────────────────────
    ("Carfax", "Vehículos & Matrículas", "https://www.carfax.com", "paid", True, False, "active",
     "Historial completo de vehículos en EE.UU.: accidentes, propietarios y mantenimiento."),
    ("VINCheck NHTSA", "Vehículos & Matrículas", "https://www.nhtsa.gov/vehicle-safety/recalls#vin", "free", False, False, "active",
     "Verificación de VIN con historial de recalls de seguridad de la NHTSA de EE.UU."),
    ("Faxvin", "Vehículos & Matrículas", "https://www.faxvin.com", "freemium", False, False, "active",
     "Decodificador de VIN gratuito con datos básicos de especificación del vehículo."),
    ("VehicleHistory", "Vehículos & Matrículas", "https://www.vehiclehistory.com", "freemium", False, False, "active",
     "Informe de historial de vehículos con accidentes, títulos y datos de mercado."),

    # ── Frameworks & Plataformas ─────────────────────────────────────────
    ("Recon-ng", "Frameworks & Plataformas", "https://github.com/lanmaster53/recon-ng", "free", False, False, "active",
     "Framework de reconocimiento web modular escrito en Python con +50 módulos OSINT."),
    ("SpiderFoot", "Frameworks & Plataformas", "https://www.spiderfoot.net", "freemium", False, False, "active",
     "Plataforma OSINT automatizada con más de 200 módulos de inteligencia y visualización de grafos."),
    ("theHarvester", "Frameworks & Plataformas", "https://github.com/laramies/theHarvester", "free", False, False, "active",
     "Recopila emails, dominios, hosts, empleados y subdominios desde fuentes OSINT públicas."),
    ("OSINT Framework", "Frameworks & Plataformas", "https://osintframework.com", "free", False, False, "active",
     "Árbol interactivo de herramientas OSINT categorizadas por tipo de investigación."),
    ("Mitaka", "Frameworks & Plataformas", "https://github.com/ninoseki/mitaka", "free", False, False, "active",
     "Extensión de navegador que busca IPs, dominios, hashes y URLs en múltiples OSINT sources."),
    ("OSINT Industries", "Frameworks & Plataformas", "https://osint.industries", "freemium", True, True, "active",
     "Plataforma todo-en-uno para investigaciones OSINT con 200+ módulos y reportes automatizados."),
    ("Maltego CE", "Frameworks & Plataformas", "https://www.maltego.com/maltego-community", "free", True, False, "active",
     "Edición comunitaria gratuita de Maltego para análisis de relaciones OSINT con grafos."),
    ("Hunchly", "Frameworks & Plataformas", "https://www.hunch.ly", "paid", True, False, "active",
     "Captura automática de evidencia web durante investigaciones OSINT con cadena de custodia."),
]


# ─────────────────────────────────────────────
# INSERCIÓN
# ─────────────────────────────────────────────

def seed():
    db = SessionLocal()

    # Evita duplicados
    existing_cats = {c.name for c in db.query(models.Category).all()}
    existing_sources = {s.name for s in db.query(models.Source).all()}

    # 1. Insertar categorías
    cat_map = {}
    for cat_name in CATEGORIES:
        if cat_name not in existing_cats:
            cat = models.Category(name=cat_name)
            db.add(cat)
            db.flush()
        else:
            cat = db.query(models.Category).filter_by(name=cat_name).first()
        cat_map[cat_name] = cat.id

    db.commit()

    # 2. Insertar herramientas
    inserted = 0
    skipped = 0
    for row in SOURCES:
        name, cat_name, url, access_type, req_reg, req_key, status, desc = row
        if name in existing_sources:
            skipped += 1
            continue
        source = models.Source(
            name=name,
            category_id=cat_map[cat_name],
            url=url,
            access_type=access_type,
            requires_registration=req_reg,
            requires_api_key=req_key,
            status=status,
            description=desc,
        )
        db.add(source)
        inserted += 1

    db.commit()
    db.close()

    print(f"Seed completado: {inserted} herramientas insertadas, {skipped} ya existían.")
    print(f"Categorías: {len(cat_map)}")


if __name__ == "__main__":
    seed()
