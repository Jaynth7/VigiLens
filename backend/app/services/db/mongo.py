import os
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables explicitly from the backend/app directory
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(dotenv_path=env_path)

# Initialize MongoDB client
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)

# Select the database and collection
db = client.vigilens
# We can use a collection called 'crime_articles'
crime_articles_collection = db["crime_articles"]

async def insert_analyzed_articles(city: str, articles: list[dict]) -> int:
    """
    Insert the analyzed articles into MongoDB. Adds a timestamp and city reference.
    
    Args:
        city: The city the articles belong to
        articles: A list of analyzed article dictionaries
        
    Returns:
        int: Number of articles successfully inserted
    """
    if not articles:
        return 0
        
    documents = []
    # We append the searched 'city' and 'scraped_at' timestamp 
    # to every article before storing it
    from datetime import datetime
    now = datetime.utcnow()
    
    for article in articles:
        doc = article.copy()
        doc["searched_city"] = city
        doc["scraped_at"] = now
        documents.append(doc)
        
    try:
        # Insert them into the collection
        result = await crime_articles_collection.insert_many(documents)
        logger.info(f"Successfully inserted {len(result.inserted_ids)} articles for {city} into MongoDB.")
        return len(result.inserted_ids)
    except Exception as e:
        logger.error(f"Failed to insert articles into MongoDB: {e}")
        return 0

async def get_articles_by_city(city: str, max_age_hours: int = 1) -> list[dict]:
    """
    Retrieve already analyzed articles for a given city from the database.
    If the existing records for the city are older than `max_age_hours`, they are deleted.
    """
    from datetime import datetime
    
    # Case-insensitive query using regex
    query = {"searched_city": {"$regex": f"^{city}$", "$options": "i"}}
    
    # Find the most recent record to check the timestamp cache age
    latest_cursor = crime_articles_collection.find(query).sort("scraped_at", -1).limit(1)
    
    latest_doc = None
    async for doc in latest_cursor:
        latest_doc = doc
        
    # If no records exist, return empty
    if not latest_doc or "scraped_at" not in latest_doc:
        return []

    # If the latest cache is older than max_age_hours, automatically invalidate it
    now = datetime.utcnow()
    age_seconds = (now - latest_doc["scraped_at"]).total_seconds()
    
    if age_seconds > (max_age_hours * 3600):
        logger.info(f"Cache for '{city}' is older than {max_age_hours} hour(s). Deleting stale records to update the news.")
        await crime_articles_collection.delete_many(query)
        return []
        
    # If cache is fresh, retrieve and return all of them
    # We don't want to return the MongoDB '_id' or 'searched_city' internal flag in the API response
    projection = {"_id": 0, "searched_city": 0, "scraped_at": 0}
    
    cursor = crime_articles_collection.find(query, projection)
    
    articles = []
    async for doc in cursor:
        articles.append(doc)
        
    return articles

# Test connection method
async def ping_db():
    try:
        await db.command('ping')
        return True
    except Exception as e:
        logger.error(f"MongoDB Ping Failed: {e}")
        return False
