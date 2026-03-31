# VigiLens

**VigiLens** is a real-time crime mapping platform for Indian cities. It scrapes live crime news, filters and structures it through a hybrid local-cloud AI pipeline, geocodes each incident using Google Maps, and displays them as interactive pie-chart polygons on a Google Map.

---

## 🚀 Prerequisites

- **Node.js 18+** — for the Next.js frontend
- **Python 3.10+** — for the FastAPI backend
- **MongoDB** — caching layer for scraped articles ([Download](https://www.mongodb.com/try/download/community))
- **Ollama** — local AI model for Stage 1 filtering ([Download](https://ollama.com))

---

## 🛠️ Installation & Running

### Frontend (Next.js)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   Create `.env.local` in the project root:

   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_js_api_key
   ```

   > Requires **Maps JavaScript API** enabled in [Google Cloud Console](https://console.cloud.google.com/apis/library).

3. **Start the dev server**

   ```bash
   npm run dev
   ```

   Frontend will be live at **http://localhost:3000**

---

### Backend (FastAPI)

1. **Download the local AI model**

   ```bash
   ollama run llama3.1
   ```

   Leave Ollama running in the background.

2. **Install Python dependencies**

   ```bash
   pip install fastapi uvicorn gnews langchain langchain-google-genai langchain-ollama motor pymongo python-dotenv geopy httpx
   ```

3. **Set up environment variables**

   Create `.env` inside `backend/app/`:

   ```env
   GOOGLE_API_KEY=your_gemini_api_key
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   MONGODB_URI=mongodb://localhost:27017
   ```

   | Key | Where to get it |
   |-----|-----------------|
   | `GOOGLE_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) (Gemini) |
   | `GOOGLE_MAPS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (Geocoding API enabled) |
   | `MONGODB_URI` | Local MongoDB or [MongoDB Atlas](https://www.mongodb.com/atlas) |

4. **Start the backend server**

   ```bash
   cd backend/app
   uvicorn main:app --reload
   ```

   Backend API will be live at **http://localhost:8000**

---

## 🔌 Usage

1. Open **http://localhost:3000** in your browser
2. Type an Indian city name (e.g., "Delhi", "Chennai") in the search bar
3. The backend scrapes, filters, and geocodes crime news — results appear on the map
4. Click polygons or incident cards to explore details, filter by crime type or area
