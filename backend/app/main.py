from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import RedirectResponse
import logging
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from geopy.geocoders import Nominatim

try:
    from services.scrapper.news_scrapper import fetch_and_scrape
    from services.ai.analyzer import analyze_articles
    from services.db.mongo import insert_analyzed_articles, get_articles_by_city
    from services.geocoder import geocode_location, get_city_config
except ModuleNotFoundError:
    from backend.app.services.scrapper.news_scrapper import fetch_and_scrape
    from backend.app.services.ai.analyzer import analyze_articles
    from backend.app.services.db.mongo import insert_analyzed_articles, get_articles_by_city
    from backend.app.services.geocoder import geocode_location, get_city_config

app = FastAPI(title="Vigilens API")

# Allow the Next.js frontend (port 3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# @ http://127.0.0.1:8000/ , running FastAPI on an uvicorn Server .
@app.get("/")
async def root():
    return RedirectResponse(url="http://localhost:3000")


async def enrich_articles(articles: list[dict], city: str) -> list[dict]:
    """
    Post-process articles from the AI pipeline:
    1. Geocode each article's area+city → inject lat/lng
    2. Assign sequential IDs
    3. Merge area+location into "Area, City" format for the frontend
    """
    async def geocode_single(article, idx):
        area = article.get("area", "Unknown")
        location_city = article.get("location", city)
        
        coords = await geocode_location(area, location_city)
        
        # Build the enriched article
        enriched = article.copy()
        enriched["id"] = idx + 1
        
        if coords:
            enriched["lat"] = coords["lat"]
            enriched["lng"] = coords["lng"]
        else:
            # Fallback: skip articles we can't place on the map
            enriched["lat"] = None
            enriched["lng"] = None
        
        # Merge area + city into the "Area, City" format the frontend expects
        if area and area.lower() != "unknown":
            enriched["location"] = f"{area}, {location_city}"
        else:
            enriched["location"] = location_city
        
        # Remove the separate 'area' field (frontend doesn't use it)
        enriched.pop("area", None)
        
        return enriched

    # Geocode all articles in parallel
    tasks = [geocode_single(article, i) for i, article in enumerate(articles)]
    enriched = await asyncio.gather(*tasks)
    
    # Filter out articles with no coordinates
    return [a for a in enriched if a.get("lat") is not None]


# Handles city input from the frontend — fetches & scrapes crime news
@app.get("/search")
async def search(
    city: str = Query(..., min_length=2, max_length=30, description="The specific city name to search for crime reports", pattern=r"^[A-Za-z\s\.\-]+$")
):
    months = 3 # Hardcoded back to 3 months locally until frontend supports the toggle
    
    # --- 0. CITY VALIDATION ---
    try:
        geolocator = Nominatim(user_agent="vigilens_crime_analyzer")
        location = geolocator.geocode(city, timeout=5)
        if not location or "india" not in location.address.lower():
            raise HTTPException(status_code=400, detail=f"'{city}' does not appear to be a recognized city or region in India.")
    except HTTPException:
        raise
    except Exception as geopy_err:
        logging.warning(f"Geocoding API failed or timed out: {geopy_err}. Bypassing strict validation.")

    # --- Generate city config for front-end map ---
    city_config = await get_city_config(city)

    # --- 1. DB CACHE CHECK ---
    existing_articles = await get_articles_by_city(city)
    
    if existing_articles:
        # Cached articles may already have lat/lng if they were enriched before storage.
        # If not, enrich them now.
        needs_enrichment = any(a.get("lat") is None for a in existing_articles)
        if needs_enrichment:
            existing_articles = await enrich_articles(existing_articles, city)
        
        return {
            "city": city,
            "cityConfig": city_config,
            "countOfScrapedArticles": 0,
            "countOfAnalyzedArticles": len(existing_articles),
            "countInsertedToDB": 0,
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            "source": "database",
            "articles": existing_articles,
        }
        
    # --- 2. LIVE SCRAPE & ANALYSIS ---
    raw_articles = fetch_and_scrape(city)

    try:
        analyzed_articles, token_usage = await analyze_articles(raw_articles, timeframe_months=months, searched_city=city)
        
        # --- 3. GEOCODE & ENRICH ---
        enriched_articles = await enrich_articles(analyzed_articles, city)
        
        # Insert enriched articles (with lat/lng) into MongoDB
        if enriched_articles:
            inserted_count = await insert_analyzed_articles(city, enriched_articles)
        else:
            inserted_count = 0
            
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
      
    return {
        "city": city,
        "cityConfig": city_config,
        "countOfScrapedArticles": len(raw_articles),
        "countOfAnalyzedArticles": len(enriched_articles),
        "countInsertedToDB": inserted_count,
        "usage": token_usage,
        "source": "live_scrape",
        "articles": enriched_articles,
    }