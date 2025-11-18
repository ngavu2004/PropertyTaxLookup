from playwright.async_api import async_playwright
from flask import Flask
import asyncio, json

app = Flask(__name__)

URL = "https://www.asr.pima.gov/search-results"
DETAIL_API = "https://www.asr.pima.gov/AssessorSiteData/api/get/parceldetails/"

class PimaScraper:

    @app.route('/pima/owner')
    def search_by_owner(self, owner: str) -> list:
        return asyncio.run(self.general_search(owner, "PropertyOwnerResults"))

    @app.route('/pima/address')
    def search_by_address(self, st_number, st_direction, st_name, st_suffix) -> list:
        full_address = " ".join(filter(None, [st_number, st_direction, st_name, st_suffix]))
        return asyncio.run(self.general_search(full_address, "AdvancedSearchResult"))

    @app.route('/pima/apn')
    def search_by_apn(self, apn: str) -> list:
        return asyncio.run(self.general_search(apn, "SearchResults"))

    async def general_search(self, query: str, type: str) -> list:
        
        async with async_playwright() as p:

            browser = await p.chromium.launch(headless=False)
            page = await browser.new_page()

            parcels = []

            async def get_parcels(response):
                if type in response.url:
                    try:
                        data = await response.json()
                        for item in data[:10]:
                            parcels.append(item.get("Parcel"))
                    except:
                        pass

            page.on("response", get_parcels)

            await page.goto(URL)
            await page.fill('input[name="new-search"]', query)
            await page.press('input[name="new-search"]', "Enter")
            await page.wait_for_timeout(2000)

            parcel_details_list = []

            semaphore = asyncio.Semaphore(10)

            async def fetch_with_limit(parcel_number):
                async with semaphore:
                    return await self.fetch_parcel_details(page, parcel_number)

            tasks = [fetch_with_limit(parcel_number) for parcel_number in parcels]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, dict):
                    parcel_details_list.append(result)
                elif isinstance(result, Exception):
                    print(f"Error: {result}")

            await browser.close()

            return parcel_details_list
        
    async def fetch_parcel_details(self, page, parcel_number: str, taxyear: int = 2026):
        
        headers = {
            "Content-Type": "application/json",
            "Referer": "https://www.asr.pima.gov/search-results",
            "X-Requested-With": "XMLHttpRequest"
        }

        payload = {
            "parcel": parcel_number,
            "taxyear": taxyear
        }

        response = await page.request.post(
            DETAIL_API,
            headers=headers,
            data=json.dumps(payload)
        )

        raw_text = await response.text()
        if raw_text.strip('"') == "invalid":
            print(f"Parcel {parcel_number} returned invalid response.")
            return None

        try:
            data = await response.json()
        except Exception as e:
            print(f"Parcel {parcel_number} returned invalid JSON: {e}")
            return None

        try:
            situs_list = data.get("SITUS", [])
            valuation_list = data.get("NoticedValuationData", [])

            if not situs_list or not valuation_list:
                return None

            situs = situs_list[0]
            valuation = valuation_list[0]

            mailing = data.get("Mailing", {})

            street_address = f"{situs['StreetNumber']} {situs.get('StreetDirection','')} {situs['StreetName']}".strip()
            formatted_apn = self.format_apn(parcel_number)

            lpv = valuation.get("LimitedAssessed", 0)
            assessed_lpv = f"${lpv:,.2f}"
            tax_rate = 8.4

            tax = lpv * tax_rate / 100
            property_tax = f"${tax:,.2f}"
            
            return {
                "Estimated Property Tax": property_tax,
                "APN": formatted_apn,
                "AIN": "N/A",
                "Street Address": street_address,
                "City": situs.get("City", ""),
                "State": "AZ",
                "Zip Code": mailing.get("Zip", ""),
                "Primary Owner": mailing.get("ParcelOwner", "").strip(),
                "Secondary Owner": "N/A",
                "LimitedAssessed": assessed_lpv,
                "Tax Rate": tax_rate
            }
        
        except Exception as e:
            print(f"Parcel {parcel_number} missing expected fields: {e}")
            return None

    def format_apn(self, apn):

        apn_digits = "".join(filter(str.isdigit, apn))

        return f"{apn_digits[:3]}-{apn_digits[3:5]}-{apn_digits[5:]}"