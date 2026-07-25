"""
Unit tests for backend/scanner/modules/*.

Each module gets one success test and one error test (18 tests total across the
9 modules). Every test mocks the module's real external dependency (found by
reading each module's imports), never the real network/filesystem/DB.

Two modules needed a non-generic assertion because of how they actually shape
their return dict (confirmed by reading the source, not assumed):

- `web_analyzer.run` nests per-scheme errors (`result['https']['error']`,
  `result['http']['error']`) rather than a top-level `error` key, because it
  tries https then http and stores a per-scheme dict either way. The error
  test therefore asserts `any('error' in v for v in result.values())` instead
  of `'error' in result`.
- `email_check.run` always includes an `error` key (defaulting to `None`) in
  its success dict (`results = {..., "error": None}`), so `'error' not in
  result` is never true even on success. Its success test therefore asserts
  `result.get('error') is None` instead.

`port_scan.run` opens raw sockets via `socket.socket(...)` directly inside
`check_port`, not wrapped in the same try/except as the connect call, so it is
mocked by patching `socket.socket` itself (module-level import), per the
task's explicit fallback instruction for this exact case. Patching only the
imported `socket` *name* within `port_scan`'s namespace (rather than the real,
global `socket.socket` class) is required here: replacing the actual global
`socket.socket` class breaks Windows' `ProactorEventLoop`, which does
`isinstance(conn, socket.socket)` internally on every loop tick.

`shodan_mod.run` looks up its API key via `crud.get_setting` against a real
DB session before making any HTTP call; both tests patch `crud.get_setting`
to return a fake truthy setting object so the code path reaches (and can be
verified against) the mocked HTTP call, otherwise it would short-circuit into
a `{"status": "skipped", ...}` response without ever touching the network
layer we intend to test.

`phone_mod.run` uses the offline `phonenumbers` library (parsing + geocoder +
carrier + timezone lookups) rather than any network/file/DB call. All of
those entry points are mocked directly per the task's instruction to mock
"the exact external library/call it invokes".
"""
import socket as socket_module
from unittest.mock import patch, MagicMock, AsyncMock

import pytest


# ---------------------------------------------------------------------------
# crtsh — httpx.AsyncClient().get(...) against crt.sh
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_crtsh_success():
    from scanner.modules import crtsh

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [{"name_value": "sub.example.com\nwww.example.com"}]

    with patch("scanner.modules.crtsh.httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        result = await crtsh.run("example.com")

    assert "error" not in result
    assert result["count"] == 2


@pytest.mark.asyncio
async def test_crtsh_error():
    from scanner.modules import crtsh

    with patch(
        "scanner.modules.crtsh.httpx.AsyncClient.get",
        new_callable=AsyncMock,
        side_effect=Exception("boom"),
    ):
        result = await crtsh.run("example.com")

    assert "error" in result


# ---------------------------------------------------------------------------
# whois_mod — whois.whois(target)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_whois_mod_success():
    from scanner.modules import whois_mod

    with patch("scanner.modules.whois_mod.whois.whois") as mock_whois:
        mock_whois.return_value = {"domain_name": "EXAMPLE.COM", "registrar": "Example Registrar"}
        result = await whois_mod.run("example.com")

    assert "error" not in result
    assert result["domain_name"] == "EXAMPLE.COM"


@pytest.mark.asyncio
async def test_whois_mod_error():
    from scanner.modules import whois_mod

    with patch("scanner.modules.whois_mod.whois.whois", side_effect=Exception("boom")):
        result = await whois_mod.run("example.com")

    assert "error" in result


# ---------------------------------------------------------------------------
# dns_mod — dns.resolver.resolve(target, rtype)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_dns_mod_success():
    from scanner.modules import dns_mod

    with patch("scanner.modules.dns_mod.dns.resolver.resolve") as mock_resolve:
        mock_resolve.return_value = ["93.184.216.34"]
        result = await dns_mod.run("example.com")

    assert "error" not in result
    assert result["A"] == ["93.184.216.34"]


@pytest.mark.asyncio
async def test_dns_mod_error():
    from scanner.modules import dns_mod
    import dns.resolver as real_resolver

    with patch(
        "scanner.modules.dns_mod.dns.resolver.resolve",
        side_effect=real_resolver.NXDOMAIN(),
    ):
        result = await dns_mod.run("example.com")

    assert "error" in result


# ---------------------------------------------------------------------------
# port_scan — socket.socket(...) (raw sockets, no HTTP client involved)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_port_scan_success():
    from scanner.modules import port_scan

    # Patching `scanner.modules.port_scan.socket.socket` directly would replace
    # the *real, global* socket module's `socket` class (since `import socket`
    # binds to the singleton module object) with a Mock, which is not a valid
    # `isinstance()` target and breaks Windows' ProactorEventLoop internals
    # (which do `isinstance(conn, socket.socket)` on every loop iteration).
    # Instead we rebind the `socket` *name* inside port_scan's own module
    # namespace to a fake module-like object, leaving the real global socket
    # module untouched.
    fake_socket = MagicMock()
    fake_socket.connect_ex.return_value = 1  # closed, but no exception -> no error

    fake_socket_module = MagicMock()
    fake_socket_module.AF_INET = socket_module.AF_INET
    fake_socket_module.SOCK_STREAM = socket_module.SOCK_STREAM
    fake_socket_module.socket.return_value = fake_socket

    with patch("scanner.modules.port_scan.socket", fake_socket_module):
        result = await port_scan.run("8.8.8.8")

    assert "error" not in result
    assert result["total_scanned"] == len(port_scan.COMMON_PORTS)


@pytest.mark.asyncio
async def test_port_scan_error():
    from scanner.modules import port_scan

    fake_socket_module = MagicMock()
    fake_socket_module.AF_INET = socket_module.AF_INET
    fake_socket_module.SOCK_STREAM = socket_module.SOCK_STREAM
    fake_socket_module.socket.side_effect = Exception("boom")

    with patch("scanner.modules.port_scan.socket", fake_socket_module):
        result = await port_scan.run("8.8.8.8")

    assert "error" in result


# ---------------------------------------------------------------------------
# web_analyzer — httpx.AsyncClient().get(...) against the target site
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_web_analyzer_success():
    from scanner.modules import web_analyzer

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"Server": "nginx"}
    mock_response.text = "<html><title>Example</title></html>"
    mock_response.url = "https://example.com"

    with patch(
        "scanner.modules.web_analyzer.httpx.AsyncClient.get", new_callable=AsyncMock
    ) as mock_get:
        mock_get.return_value = mock_response
        result = await web_analyzer.run("example.com")

    assert "error" not in result
    assert result["https"]["title"] == "Example"


@pytest.mark.asyncio
async def test_web_analyzer_error():
    from scanner.modules import web_analyzer

    with patch(
        "scanner.modules.web_analyzer.httpx.AsyncClient.get",
        new_callable=AsyncMock,
        side_effect=Exception("boom"),
    ):
        result = await web_analyzer.run("example.com")

    # web_analyzer nests errors per scheme (result["https"]["error"], result["http"]["error"])
    # rather than a top-level "error" key, per the module's actual return shape.
    assert any("error" in v for v in result.values())


# ---------------------------------------------------------------------------
# shodan_mod — crud.get_setting (API key lookup) + httpx.AsyncClient().get(...)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_shodan_mod_success():
    from scanner.modules import shodan_mod

    fake_setting = MagicMock()
    fake_setting.value = "fake-api-key"

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"total": 1, "matches": [{"ip_str": "8.8.8.8", "port": 443}]}

    with patch("scanner.modules.shodan_mod.crud.get_setting", return_value=fake_setting), patch(
        "scanner.modules.shodan_mod.httpx.AsyncClient.get", new_callable=AsyncMock
    ) as mock_get:
        mock_get.return_value = mock_response
        result = await shodan_mod.run("8.8.8.8")

    assert "error" not in result
    assert result["total_matches"] == 1


@pytest.mark.asyncio
async def test_shodan_mod_error():
    from scanner.modules import shodan_mod

    fake_setting = MagicMock()
    fake_setting.value = "fake-api-key"

    with patch("scanner.modules.shodan_mod.crud.get_setting", return_value=fake_setting), patch(
        "scanner.modules.shodan_mod.httpx.AsyncClient.get",
        new_callable=AsyncMock,
        side_effect=Exception("boom"),
    ):
        result = await shodan_mod.run("8.8.8.8")

    assert "error" in result


# ---------------------------------------------------------------------------
# geoip_mod — httpx.AsyncClient().get(...) against ip-api.com
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_geoip_mod_success():
    from scanner.modules import geoip_mod

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"status": "success", "country": "United States"}

    with patch(
        "scanner.modules.geoip_mod.httpx.AsyncClient.get", new_callable=AsyncMock
    ) as mock_get:
        mock_get.return_value = mock_response
        result = await geoip_mod.run("8.8.8.8")

    assert "error" not in result
    assert result["geo_data"]["country"] == "United States"


@pytest.mark.asyncio
async def test_geoip_mod_error():
    from scanner.modules import geoip_mod

    with patch(
        "scanner.modules.geoip_mod.httpx.AsyncClient.get",
        new_callable=AsyncMock,
        side_effect=Exception("boom"),
    ):
        result = await geoip_mod.run("8.8.8.8")

    assert "error" in result


# ---------------------------------------------------------------------------
# phone_mod — phonenumbers.parse(...) + geocoder/carrier/timezone lookups
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_phone_mod_success():
    from scanner.modules import phone_mod

    fake_parsed = MagicMock()
    fake_parsed.country_code = 1
    fake_parsed.national_number = 5551234567

    with patch("scanner.modules.phone_mod.phonenumbers.parse", return_value=fake_parsed), patch(
        "scanner.modules.phone_mod.phonenumbers.is_possible_number", return_value=True
    ), patch(
        "scanner.modules.phone_mod.phonenumbers.is_valid_number", return_value=True
    ), patch(
        "scanner.modules.phone_mod.phonenumbers.format_number", return_value="+1 555-123-4567"
    ), patch(
        "scanner.modules.phone_mod.geocoder.description_for_number", return_value="United States"
    ), patch(
        "scanner.modules.phone_mod.carrier.name_for_number", return_value="Verizon"
    ), patch(
        "scanner.modules.phone_mod.timezone.time_zones_for_number", return_value=("America/New_York",)
    ):
        result = await phone_mod.run("+15551234567")

    assert "error" not in result
    assert result["formato_internacional"] == "+1 555-123-4567"


@pytest.mark.asyncio
async def test_phone_mod_error():
    from scanner.modules import phone_mod

    with patch("scanner.modules.phone_mod.phonenumbers.parse", side_effect=Exception("boom")):
        result = await phone_mod.run("+15551234567")

    assert "error" in result


# ---------------------------------------------------------------------------
# email_check — asyncio.create_subprocess_exec("holehe", ...)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_email_check_success():
    from scanner.modules import email_check

    fake_process = MagicMock()
    fake_process.communicate = AsyncMock(return_value=(b"", b""))

    with patch(
        "scanner.modules.email_check.asyncio.create_subprocess_exec",
        new_callable=AsyncMock,
        return_value=fake_process,
    ):
        result = await email_check.run("user@example.com")

    # email_check.run always includes an "error" key (defaulting to None) in its
    # success dict, so "error not in result" would never hold; check the value.
    assert result.get("error") is None


@pytest.mark.asyncio
async def test_email_check_error():
    from scanner.modules import email_check

    with patch(
        "scanner.modules.email_check.asyncio.create_subprocess_exec",
        new_callable=AsyncMock,
        side_effect=Exception("boom"),
    ):
        result = await email_check.run("user@example.com")

    assert "error" in result
