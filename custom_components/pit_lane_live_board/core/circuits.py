"""The time zone of each circuit, for "local time at the track" (decision 50).

Jolpica gives a circuit's id and country but no time zone. The IANA name is kept
here per circuit, so daylight saving time is handled by the browser's own
database; a circuit not listed falls back to its country when the country has one
time zone. Countries with several (the USA, Australia, Russia, Brazil) need the
circuit, and give nothing otherwise rather than a wrong hour.
"""

from __future__ import annotations

# Every circuit of the modern calendar and the recent past.
CIRCUITS: dict[str, str] = {
    "albert_park": "Australia/Melbourne",
    "adelaide": "Australia/Adelaide",
    "americas": "America/Chicago",
    "bahrain": "Asia/Bahrain",
    "baku": "Asia/Baku",
    "buddh": "Asia/Kolkata",
    "catalunya": "Europe/Madrid",
    "estoril": "Europe/Lisbon",
    "fuji": "Asia/Tokyo",
    "hockenheimring": "Europe/Berlin",
    "hungaroring": "Europe/Budapest",
    "imola": "Europe/Rome",
    "indianapolis": "America/Indiana/Indianapolis",
    "interlagos": "America/Sao_Paulo",
    "istanbul": "Europe/Istanbul",
    "jeddah": "Asia/Riyadh",
    "jerez": "Europe/Madrid",
    "kyalami": "Africa/Johannesburg",
    "losail": "Asia/Qatar",
    "madring": "Europe/Madrid",
    "magny_cours": "Europe/Paris",
    "marina_bay": "Asia/Singapore",
    "miami": "America/New_York",
    "monaco": "Europe/Monaco",
    "monza": "Europe/Rome",
    "mugello": "Europe/Rome",
    "nurburgring": "Europe/Berlin",
    "portimao": "Europe/Lisbon",
    "red_bull_ring": "Europe/Vienna",
    "ricard": "Europe/Paris",
    "rodriguez": "America/Mexico_City",
    "sepang": "Asia/Kuala_Lumpur",
    "shanghai": "Asia/Shanghai",
    "silverstone": "Europe/London",
    "sochi": "Europe/Moscow",
    "spa": "Europe/Brussels",
    "suzuka": "Asia/Tokyo",
    "valencia": "Europe/Madrid",
    "vegas": "America/Los_Angeles",
    "villeneuve": "America/Toronto",
    "yas_marina": "Asia/Dubai",
    "yeongam": "Asia/Seoul",
    "zandvoort": "Europe/Amsterdam",
}

# Countries with a single time zone, as Jolpica names them.
COUNTRIES: dict[str, str] = {
    "Argentina": "America/Argentina/Buenos_Aires",
    "Austria": "Europe/Vienna",
    "Azerbaijan": "Asia/Baku",
    "Bahrain": "Asia/Bahrain",
    "Belgium": "Europe/Brussels",
    "China": "Asia/Shanghai",
    "France": "Europe/Paris",
    "Germany": "Europe/Berlin",
    "Hungary": "Europe/Budapest",
    "India": "Asia/Kolkata",
    "Italy": "Europe/Rome",
    "Japan": "Asia/Tokyo",
    "Korea": "Asia/Seoul",
    "Malaysia": "Asia/Kuala_Lumpur",
    "Monaco": "Europe/Monaco",
    "Morocco": "Africa/Casablanca",
    "Netherlands": "Europe/Amsterdam",
    "Portugal": "Europe/Lisbon",
    "Qatar": "Asia/Qatar",
    "Saudi Arabia": "Asia/Riyadh",
    "Singapore": "Asia/Singapore",
    "South Africa": "Africa/Johannesburg",
    "Spain": "Europe/Madrid",
    "Sweden": "Europe/Stockholm",
    "Switzerland": "Europe/Zurich",
    "Turkey": "Europe/Istanbul",
    "UAE": "Asia/Dubai",
    "UK": "Europe/London",
}


def circuit_timezone(circuit_id: str | None, country: str | None) -> str | None:
    """The IANA time zone at the track, or None when it cannot be told."""
    if circuit_id and circuit_id in CIRCUITS:
        return CIRCUITS[circuit_id]
    if country:
        return COUNTRIES.get(country)
    return None
