import requests
from flask import Flask
import csv, aiohttp, asyncio
from .base_county import BaseCountyScraper

app = Flask(__name__)

SEARCH_URL = "https://mcassessor.maricopa.gov/search/property/?q="
BASE_URL = "https://mcassessor.maricopa.gov/";
API_TOKEN = "81a924da-2b3e-4d55-a30d-ff3c4c5f6695"; 
DEFAULT_SEARCH_QUERY = "Main St";

class MaricopaCounty(BaseCountyScraper):

    @app.route('/maricopa/owner')
    def search_by_owner(self, owner: str) -> list:
        return self.general_search(owner)

    @app.route('/maricopa/address')
    def search_by_address(self, st_number, st_direction, st_name, st_suffix):
        full_address = " ".join([st_number, st_direction, st_name, st_suffix])
        return self.general_search(full_address)

    @app.route('/maricopa/apn')
    def search_by_apn(self, apn: str) -> list:
        return self.general_search(apn)
    
    def general_search(self, input: str) -> list:
        headers = {"AUTHORIZATION": API_TOKEN, "User-Agent": "null"}
        url = SEARCH_URL + requests.utils.quote(input)
        property_list = []

        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()

            properties = data.get("Results", [])

            taxRatesFile = "scrapers/Maricopa/tax_code_rates.csv"
            taxRates = self.load_tax_rates(taxRatesFile)

            # Collect APNs to fetch data concurrently
            apns = [prop.get("APN", "N/A") for prop in properties[:10]]

            apn_results = asyncio.run(self.async_fetch_all_apns(apns))

            for prop, (_, lpv_str, tax_code) in zip(properties[:10], apn_results):
                formatted_apn = self.format_apn(prop.get("APN", "N/A"))
                try:
                    lpv = float(lpv_str.strip())
                except:
                    lpv = 0

                if len(tax_code) >= 2:
                    tax_code = tax_code[:-2] + "00"
                rate = taxRates.get(tax_code, 0)

                address = prop.get("SitusAddress", "N/A")
                city = prop.get("SitusCity", "N/A")
                state = "AZ"
                zip_code = prop.get("SitusZip", "N/A")
                primary_owner = prop.get("Ownership", "N/A")
                secondary_owner = "N/A"
                assessed_lpv = f"${lpv:,.2f}"
                tax = lpv * rate / 100
                property_tax = f"${tax:,.2f}"

                property_list.append({
                    "Estimated Property Tax": property_tax,
                    "AIN": "N/A",
                    "APN": formatted_apn,
                    "Street Address": address,
                    "City": city,
                    "State": state,
                    "ZIP Code": zip_code,
                    "Primary Owner": primary_owner,
                    "Secondary Owner": secondary_owner,
                    "Assessed LPV": assessed_lpv,
                    "Tax Rate": rate
                })

        except Exception as e:
            print("Error fetching property data:", e)

        return property_list


    async def async_get_lpv_and_tax_code_for_apn(self, session, apn):
        url = f"{BASE_URL}/parcel/{apn}"
        headers = {"AUTHORIZATION": API_TOKEN, "User-Agent": "null"}
        try:
            async with session.get(url, headers=headers) as resp:
                data = await resp.json()
                valuations = data.get("Valuations", [])
                if valuations:
                    lpv = valuations[0].get("LimitedPropertyValue", "N/A")
                    tax_code = valuations[0].get("TaxAreaCode", "N/A")
                    return apn, lpv, tax_code
                return apn, "N/A", "N/A"
        except Exception as e:
            print(f"Error fetching LPV and Tax Area Code for {apn}: {e}")
            return apn, "N/A", "N/A"
    
    async def async_fetch_all_apns(self, apns):
        async with aiohttp.ClientSession() as session:
            tasks = [self.async_get_lpv_and_tax_code_for_apn(session, apn) for apn in apns]
            results = await asyncio.gather(*tasks)
        return results  # list of tuples: (apn, lpv, tax_code)

    def format_apn(self, apn):

        apn_digits = "".join(filter(str.isdigit, apn))

        return f"{apn_digits[:3]}-{apn_digits[3:5]}-{apn_digits[5:]}"
    
    def load_tax_rates(self, file_path):

        tax_rates = {}

        try:
            with open(file_path, newline='', encoding='utf-8') as csvfile:
                reader = csv.reader(csvfile)
                next(reader, None)  # skip header row
                for row in reader:
                    if len(row) < 6:
                        continue  # skip rows that are too short
                    tax_area_code = row[0].strip()
                    try:
                        residential_rate = float(row[5].strip())
                        tax_rates[tax_area_code] = residential_rate
                    except ValueError:
                        pass
        except Exception as e:
            print(f"Error reading the CSV file: {e}")

        return tax_rates