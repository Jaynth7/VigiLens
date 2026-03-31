# Vigilens AI Backend

The **Vigilens Backend** is a powerful, hybrid local-cloud FastAPI architecture that instantly scrapes live crime news, aggressively filters it via a free local Llama 3.1 AI model, and extracts tightly structured JSON insights using Google's heavily generous Gemini 1.5 Flash cloud models.

---

## 🚀 Prerequisites
Ensure you have the following system dependencies installed entirely before attempting to run the application:

1. **Python 3.10+** (Ensure `pip` is installed locally on your PATH)
2. **MongoDB Community Server**: Download and run MongoDB locally. The backend physically acts as a caching layer and permanently connects to `mongodb://localhost:27017` to eliminate redundant AI generation costs.
3. **Ollama**: Download from [ollama.com](https://ollama.com). This handles the "Stage 1 Bouncer" AI pipeline completely natively for free so we don't spam the cloud API.

---

## 🛠️ Installation & Setup

### 1. Start the Local AI Engine
Open a terminal (Command Prompt or PowerShell) and execute the `ollama` CLI to download and start the Llama 3.1 model. 

```bash
ollama run llama3.1
```
*(Leave this terminal window completely running in the background. It acts exactly like an active database server!)*

### 2. Install Python Dependencies
Open a completely new terminal pointing to your root project folder and install the required PIP packages:

```bash
pip install fastapi uvicorn gnews langchain langchain-google-genai langchain-ollama motor pymongo python-dotenv geopy
```
*(Note: If Uvicorn later warns about broken URL dependencies, you may need to upgrade some core system libraries by running: `pip install --upgrade requests urllib3 charset-normalizer`)*

### 3. Environment Variable Setup (`.env`)
Create a `.env` file explicitly inside the `backend/app/` folder. It must contain your Google Gemini API key and local MongoDB URI.

```env
GOOGLE_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017
```

---

## ⚡ Running the Backend Server

Start the live hot-reloading FastAPI application via Uvicorn. Point your terminal at the main application root (`/Vigilens/Vigilens`):

```bash
uvicorn backend.app.main:app --reload
```
The API server will natively mount itself and officially be live at `http://localhost:8000`.

---

## 📡 Core API Endpoints

### `GET /search?city={CITY_NAME}`
Triggers a live multi-stage Web Scrape + AI Pipeline for any given city looking over the past 3 months.

**Architecture Technical Flow:**
1. **DB Cache Check**: Queries MongoDB to instantly return recent articles if this exact city was already scraped within the last 1 hour. If it's a cache miss, proceeds to step 2.
2. **City Validation (Stage 0)**: Uses the native `geopy` library and offline OpenStreetMap datasets to verify the searched city is a recognized geographical region within India, returning a 503 error early to protect API stability.
3. **Web Scraper**: Fetches up to 25 wildly recent news articles natively via Google News matching the target city limits.
4. **Stage 1 AI (Local)**: Slices context footprints down to 400 characters array chunks and sends all 25 articles concurrently natively to your local `Ollama` Llama 3.1 instance simultaneously. It strictly drops opinion pieces, politicians merely "condemning" topics, and non-violent crime articles automatically.
5. **Stage 2 AI (Cloud)**: Sends the confirmed payload to Google Gemini's high-speed API Endpoint to intelligently extract strictly structured JSON events natively.
   * **⚠️ Deep Deduplication Engine**: If 15 separate articles manage to survive Stage 1, but they are all reporting on the exact same 3 major local murders from different journalist perspectives, the AI will meticulously merge and compress them together so your frontend only receives exactly **3 purely independent, distinct original crime JSON objects!** It automatically picks the single most descriptive source link for each merged event.
6. **Database Storage**: Immediately saves the parsed array tree back to MongoDB for rapid caching on upcoming queries.
