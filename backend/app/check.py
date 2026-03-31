import os
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
api_key = os.environ.get("GOOGLE_API_KEY")

if not api_key:
    print("NO GOOGLE_API_KEY FOUND IN .ENV")
else:
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    resp = requests.get(url)
    try:
        data = resp.json()
        if "error" in data:
            print(f"API ERROR: {data['error']['message']}")
        else:
            models = [m['name'].replace('models/', '') for m in data.get('models', []) if 'generateContent' in m.get('supportedGenerationMethods', [])]
            print(f"AVAILABLE NATIVE MODELS: {models}")
    except Exception as e:
        print(f"CRASH: {e} - {resp.text}")
