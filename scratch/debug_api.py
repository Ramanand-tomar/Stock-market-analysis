import requests
import json

URL = "https://stock-market-analysis-by6y.onrender.com/stocks"
try:
    resp = requests.get(URL, params={"page": 1, "per_page": 10})
    print(f"Status: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
