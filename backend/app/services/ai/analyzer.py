import os
import json
import logging
import asyncio
from typing import List, Dict, Any, Tuple
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama #Running the model Locally
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

# Load environment variables explicitly from the backend/app directory
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(dotenv_path=env_path)

# Configure logging
logger = logging.getLogger(__name__)



# Define the expected output schema using Pydantic for Gemini's structured output
class CrimeArticleSchema(BaseModel):
    newsTitle: str = Field(description="A clean, concise, and objective title factually summarizing the specific incident, stripped of journalistic clickbait.")
    date: str = Field(description="The date of the incident or publication in YYYY-MM-DD format")
    location: str = Field(description="Strictly the City name only (e.g. 'Delhi', 'Chennai')")
    area: str = Field(description="A specific local neighborhood, street, or landmark. If not explicitly mentioned, output 'Unknown'. Do NOT repeat the city name.")
    crimeType: List[str] = Field(description="List of crime types, e.g., ['Sexual Assault', 'Robbery']")
    sources: str = Field(description="The URL of the single best original article covering this crime event")
    summary: str = Field(description="A concise 2-3 sentence summary of what actively occurred and any police action")

class ArticlesResponseSchema(BaseModel):
    articles: List[CrimeArticleSchema]

async def analyze_articles(scraped_articles: List[Dict[str, Any]], timeframe_months: int = 4, searched_city: str = "") -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Sends raw scraped articles through a 2-stage LangChain pipeline:
    1. Filter: 8B model async parallel filtering to drop non-violent junk.
    2. Extract: 70B model structural extraction schema enforcement.
    """
    if not scraped_articles:
        # Even if there are no articles, we should still warn if the city is clearly invalid
        pass

    try:
        # Stage 1: The Bouncer
        llm_bouncer = ChatOllama(model="llama3.1", temperature=0.0)
        
        # Stage 2: The Expert (Google Gemini)
        llm_expert = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.1)
        
        structured_expert = llm_expert.with_structured_output(ArticlesResponseSchema, include_raw=True)
    except ValueError as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to initialize models or config: {e}")
        raise ValueError(f"CRITICAL ERROR - {e.__class__.__name__}: {str(e)}")

    if not scraped_articles:
        return [], {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    # Shared token tracking
    total_prompt_tokens = 0
    total_completion_tokens = 0

    # --- STAGE 1: THE BOUNCER ---
    bouncer_prompt = PromptTemplate.from_template(
        "You are a strict filtering AI.\n"
        "Does this article describe an ACTUAL, RECENT physical crime event directly harming a person?\n"
        "EXAMPLES TO ALLOW: Murder, Assault, Sexual Assault, Robbery, Kidnapping, Domestic Violence.\n"
        "CRITICAL EXCEPTIONS TO EXCLUDE:\n"
        "- Exclude opinion pieces, protests, or politicians/celebrities merely 'condemning' or 'calling out' past crimes or hypothetical issues.\n"
        "- Exclude white-collar crimes, politics, accidents, non-violent drug busts, or policy changes.\n\n"
        "Article Snippet:\n{article_payload}\n\n"
        "Reply strictly with only the word YES or NO. Do not explain anything."
    )
    bouncer_chain = bouncer_prompt | llm_bouncer
    
    async def filter_article(article):
        text = article.get("full_text") or article.get("title", "")
        if not text: 
            return None, 0, 0
            
        if len(text) > 6000: 
            text = text[:6000] + "..."
            
        payload = f"TITLE: {article.get('title', 'Unknown')}\nSTRIPPED CONTENT:\n{text}"
        
        try:
            result = await bouncer_chain.ainvoke({"article_payload": payload})
            
            # Extract usage metadata securely
            usage = result.usage_metadata if hasattr(result, "usage_metadata") and result.usage_metadata else {}
            p_tok = usage.get("input_tokens", 0)
            c_tok = usage.get("output_tokens", 0)
            
            answer = result.content.strip().upper()
            if "YES" in answer:
                return article, p_tok, c_tok
            return None, p_tok, c_tok
        except Exception:
            return None, 0, 0

    articles_to_process = scraped_articles[:25]
    print(f"[DEBUG] Stage 1 (Bouncer): Analyzing {len(articles_to_process)} raw articles in parallel...")
    
    # Run all 15 articles simultaneously!
    filter_tasks = [filter_article(a) for a in articles_to_process]
    filter_results = await asyncio.gather(*filter_tasks)
    
    surviving_articles = []
    for art, p_tok, c_tok in filter_results:
        total_prompt_tokens += p_tok
        total_completion_tokens += c_tok
        if art:
            surviving_articles.append(art)
            
    print(f"[DEBUG] Stage 1 Finished: Only {len(surviving_articles)} articles survived the strict violent crime filter.")
    
    if not surviving_articles:
        return [], {
            "prompt_tokens": total_prompt_tokens, 
            "completion_tokens": total_completion_tokens, 
            "total_tokens": total_prompt_tokens + total_completion_tokens
        }

    # --- STAGE 2: THE EXPERT ---
    current_date = datetime.now()
    cutoff_date = current_date - timedelta(days=timeframe_months * 30)
    current_date_str = current_date.strftime("%Y-%m-%d")
    cutoff_date_str = cutoff_date.strftime("%Y-%m-%d")

    expert_instructions = f"""You are an expert crime analyst AI. Your job is to extract, filter, structure, and DE-DUPLICATE crime reports from the provided scraped news articles.

TIMING CONTEXT: The current date is {current_date_str}. Discard any article before {cutoff_date_str}.

CRITICAL RULES:
1. ONLY include ACTUAL specific crimes that directly physically harm a person.
2. EXCLUDE opinion pieces, people 'condemning' or 'calling out' a crime without an actual incident actively being reported.
3. EXCLUDE older historical cases. If the crime occurred before {cutoff_date_str}, you MUST skip the article entirely.
4. DE-DUPLICATE EVENTS: If multiple articles talk about the exact SAME incident (e.g. an attack on an Odisha youth), combine them into a SINGLE JSON entry and pick the single most descriptive URL for the 'sources' string field. Do NOT output two entries for the same event.
5. CLEAN TITLE: Rewrite the 'newsTitle' to be a clean, objective fact-based headline (e.g., "Odisha Youth Attacked in Tiruttani").
6. ESCAPE QUOTES: Absolutely do NOT use literal double quotes (") inside any of your generated text fields. Use single quotes instead to prevent JSON validation crashes.
7. STRICT LOCATION: The user specifically searched for crimes in '{searched_city}'. The 'location' JSON field MUST strictly be exactly '{searched_city}' for every single article, regardless of what the journalist's dateline says.
8. PRECISE AREA: The 'area' field MUST be a local street or neighborhood. If the article only broadly mentions the entire city, output 'Unknown' for 'area'. DO NOT duplicate the city name into the area field.

ARTICLES TO ANALYZE:
{{articles_payload}}"""
    
    expert_prompt = PromptTemplate.from_template(expert_instructions)
    expert_chain = expert_prompt | structured_expert

    articles_payload = ""
    for i, article in enumerate(surviving_articles):
        text = article.get("full_text") or article.get("title", "")
        if len(text) > 8000: text = text[:8000] + "..."
        
        # Escape quotes rigorously to prevent Groq API 'tool_use_failed' strict JSON validation crashes
        text = text.replace('"', "'")
        title = article.get('title', 'Unknown').replace('"', "'")
            
        articles_payload += f"\n--- ARTICLE {i+1} ---\n"
        articles_payload += f"TITLE: {title}\n"
        articles_payload += f"URL: {article.get('url', 'Unknown')}\n"
        articles_payload += f"DATE: {article.get('published_date', 'Unknown')}\n"
        articles_payload += f"CONTENT:\n{text}\n"

    try:
        response = await expert_chain.ainvoke({"articles_payload": articles_payload})
        
        parsed_data = response.get("parsed")
        raw_message = response.get("raw")
        
        try:
            raw_response = response.get("raw")
            if hasattr(raw_response, "usage_metadata") and raw_response.usage_metadata:
                usage = raw_response.usage_metadata
                total_prompt_tokens += usage.get("input_tokens", 0)
                total_completion_tokens += usage.get("output_tokens", 0)
            elif hasattr(raw_response, "response_metadata") and "token_usage" in raw_response.response_metadata:
                expert_tokens = raw_response.response_metadata["token_usage"]
                total_prompt_tokens += expert_tokens.get("prompt_tokens", 0)
                total_completion_tokens += expert_tokens.get("completion_tokens", 0)
        except Exception:
            pass # Keep tracking neutral if API doesn't provide tokens
        
        final_usage = {
            "prompt_tokens": total_prompt_tokens,
            "completion_tokens": total_completion_tokens,
            "total_tokens": total_prompt_tokens + total_completion_tokens
        }
        
        print(f"[DEBUG] Stage 2 Total Chain Usage: {final_usage}")
        
        if parsed_data and parsed_data.articles:
            articles_list = [v.model_dump() for v in parsed_data.articles]
            return articles_list, final_usage
        else:
            return [], final_usage
            
    except Exception as e:
        logger.error(f"Error during Expert LangChain analysis: {e}")
        raise ValueError(f"AI Analysis failed: {str(e)}")
