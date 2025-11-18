from flask import Flask, request, jsonify
from scrapers.maricopa_api import MaricopaCounty as MaricopaScraper
from scrapers.pima_scraper import PimaScraper
from scrapers.pinal_scraper import PinalScraper
from flask_cors import CORS
import asyncio

app = Flask(__name__)
CORS(app)

scrapers = {
    "maricopa": MaricopaScraper(),
    "pima": PimaScraper(),
    "pinal": PinalScraper()
}

@app.post("/az/<county>")
def az_search(county):
    county = county.lower()
    if county not in scrapers:
        return jsonify({"error": "Unsupported county"}), 400
    
    data = request.json
    mode = data.get("mode")
    value = data.get("value")

    scraper = scrapers[county]

    try:
        if mode == "owner":
            results = scraper.search_by_owner(value)
        elif mode == "address":
            results = scraper.search_by_address(
                data.get("st_number"),
                data.get("st_direction"),
                data.get("st_name"),
                data.get("st_suffix")
            )
        elif mode == "apn":
            results = scraper.search_by_apn(value)
        else:
            return jsonify({"error": "Invalid mode"}), 400

        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=7000, host="0.0.0.0")
