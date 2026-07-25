import phonenumbers
from phonenumbers import geocoder, carrier, timezone

async def run(target: str) -> dict:
    """
    Parses a target as a phone number and returns verification info.
    If the target is not a valid phone number format, returns an error immediately.
    """
    try:
        # Require a plus sign for international parsing, if missing we might not know the country code
        if not target.startswith('+'):
            return {"error": "El objetivo debe empezar con '+' y el código de país (ej. +57)"}
            
        parsed_number = phonenumbers.parse(target)
        
        is_possible = phonenumbers.is_possible_number(parsed_number)
        is_valid = phonenumbers.is_valid_number(parsed_number)
        
        if not is_valid:
            return {"error": "Número de teléfono no válido o inactivo"}
            
        region = geocoder.description_for_number(parsed_number, "es")
        operator = carrier.name_for_number(parsed_number, "es")
        timezones = timezone.time_zones_for_number(parsed_number)
        
        return {
            "formato_internacional": phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.INTERNATIONAL),
            "codigo_pais": parsed_number.country_code,
            "numero_nacional": parsed_number.national_number,
            "es_valido": is_valid,
            "region": region,
            "operador": operator,
            "zonas_horarias": list(timezones)
        }
    except phonenumbers.NumberParseException:
        return {"error": "El objetivo no tiene un formato de número de teléfono válido"}
    except Exception as e:
        return {"error": str(e)}
