"""
News Scrapper Service
---------------------
Uses GNews to find crime news articles for a given city
and extract full article content using its built-in newspaper3k integration.

Output is raw structured data designed for downstream AI analysis.
"""

from datetime import datetime, timedelta
from gnews import GNews


def fetch_news(city: str, months: int = 4, max_results: int = 30) -> list[dict]:
    """
    Use GNews to find recent crime news articles for a city.

    Args:
        city: City name to search for (e.g. "Chennai")
        months: How many months back to search (default 4)
        max_results: Maximum number of articles to return

    Returns:
        List of dicts with keys: title, url, published_date, source
    """
    start_date = datetime.now() - timedelta(days=months * 30)
    end_date = datetime.now()

    google_news = GNews(
        language="en",
        country="IN",
        start_date=start_date,
        end_date=end_date,
        max_results=max_results,
    )

    query = f"{city} local crime news"
    raw_articles = google_news.get_news(query)

    articles = []
    for article in raw_articles:
        articles.append({
            "title": article.get("title", ""),
            "url": article.get("url", ""),
            "published_date": article.get("published date", ""),
            "source": article.get("publisher", {}).get("title", "Unknown"),
        })

    return articles


def scrape_article(url: str) -> tuple[str | None, str]:
    """
    Scrape full article text from a URL using GNews's built-in newspaper3k integration.
    Returns (article_text, resolved_url). resolved_url is the actual article URL
    (not the Google News redirect), which is what users should see.
    """
    google_news = GNews()
    try:
        full_article = google_news.get_full_article(url)
        if full_article and full_article.text:
            # Use the resolved URL (actual article page) instead of Google redirect
            resolved_url = full_article.url if full_article.url else url
            return full_article.text, resolved_url
        return None, url
    except Exception:
        return None, url


def fetch_and_scrape(city: str, months: int = 3, max_results: int = 25) -> list[dict]:
    """
    Full pipeline: find crime news articles for a city, then scrape all of them.

    Args:
        city: City name to search for
        months: How many months back to search (default 4)
        max_results: Max articles to fetch from GNews

    Returns:
        List of dicts, each with:
            - title: Article headline
            - url: Original article URL
            - published_date: When it was published
            - source: Publisher name
            - full_text: Scraped article content, or None if scraping failed
    """
    # Step 1: Fetch article metadata from GNews
    articles = fetch_news(city, months=months, max_results=max_results)

    if not articles:
        return []

    # Step 2: Scrape full content from each article URL
    for article in articles:
        text, resolved_url = scrape_article(article["url"])
        article["full_text"] = text
        article["url"] = resolved_url  # Replace Google redirect with actual article URL

    return articles
