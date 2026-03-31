"""
Geocoder Service
-----------------
Uses Google Maps Geocoding API to convert area/city names into lat/lng coordinates
and to generate city configuration (center, bounds, zoom) for the frontend map.
"""

import os
import logging
import httpx
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


async def geocode_location(area: str, city: str) -> dict | None:
    """
    Geocode an area within a city using Google Maps Geocoding API.

    Args:
        area: Neighborhood/street name (or "Unknown")
        city: City name (e.g. "Delhi")

    Returns:
        {"lat": float, "lng": float} or None if geocoding fails
    """
    if not GOOGLE_MAPS_API_KEY:
        logger.warning("GOOGLE_MAPS_API_KEY not set — skipping geocode")
        return None

    # Build the address query
    if area and area.lower() != "unknown":
        address = f"{area}, {city}, India"
    else:
        address = f"{city}, India"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(GEOCODE_URL, params={
                "address": address,
                "key": GOOGLE_MAPS_API_KEY,
                "region": "in",                    # Bias results towards India
                "components": "country:IN",         # Restrict to India
            })
            data = resp.json()

        if data.get("status") == "OK" and data.get("results"):
            location = data["results"][0]["geometry"]["location"]
            return {"lat": location["lat"], "lng": location["lng"]}

        logger.warning(f"Geocode failed for '{address}': {data.get('status')}")

        # Fallback: if area geocoding failed, try just the city
        if area and area.lower() != "unknown":
            return await geocode_location("Unknown", city)

        return None

    except Exception as e:
        logger.error(f"Geocoding error for '{address}': {e}")
        return None


async def get_city_config(city: str) -> dict:
    """
    Generate a cityConfig object for the frontend map by geocoding the city.

    Returns:
        {
            "name": str,
            "center": {"lat": float, "lng": float},
            "zoom": int,
            "bounds": {"north": float, "south": float, "east": float, "west": float}
        }
    """
    # Default fallback (Delhi)
    default = {
        "name": city,
        "center": {"lat": 28.6139, "lng": 77.209},
        "zoom": 11,
        "bounds": {"north": 28.88, "south": 28.40, "east": 77.35, "west": 76.84},
    }

    if not GOOGLE_MAPS_API_KEY:
        return default

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(GEOCODE_URL, params={
                "address": f"{city}, India",
                "key": GOOGLE_MAPS_API_KEY,
            })
            data = resp.json()

        if data.get("status") != "OK" or not data.get("results"):
            return default

        result = data["results"][0]
        geometry = result["geometry"]
        location = geometry["location"]

        # Use the viewport from Google to derive bounds
        viewport = geometry.get("viewport", {})
        ne = viewport.get("northeast", {})
        sw = viewport.get("southwest", {})

        bounds = {
            "north": ne.get("lat", location["lat"] + 0.25),
            "south": sw.get("lat", location["lat"] - 0.25),
            "east": ne.get("lng", location["lng"] + 0.25),
            "west": sw.get("lng", location["lng"] - 0.25),
        }

        # Expand bounds slightly so the map doesn't feel too restricted
        lat_padding = (bounds["north"] - bounds["south"]) * 0.15
        lng_padding = (bounds["east"] - bounds["west"]) * 0.15
        bounds["north"] += lat_padding
        bounds["south"] -= lat_padding
        bounds["east"] += lng_padding
        bounds["west"] -= lng_padding

        return {
            "name": city,
            "center": {"lat": location["lat"], "lng": location["lng"]},
            "zoom": 11,
            "bounds": bounds,
        }

    except Exception as e:
        logger.error(f"City config geocoding error for '{city}': {e}")
        return default
