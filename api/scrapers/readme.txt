Example Main Code for Scrapers:

from fastapi import FastAPI
import csv, uvicorn, asyncio, aiohttp
from scrapers.pinal_scraper import PinalScraper
from scrapers.maricopa_api import MaricopaCounty
from scrapers.pima_scraper import PimaScraper

#   #########################################
#   Modular AZ County Scraper and API Manager
#   #########################################

# Possible AZ Counties
COUNTY_SCRAPERS = {
    "pinal": PinalScraper(),
    "maricopa": MaricopaCounty(),
    "pima": PimaScraper()
}

# Different Search Function Types:    APN | Address | Owner
def get_property_tax_by_apn(county: str, apn: str):
    scraper = COUNTY_SCRAPERS.get(county.lower())
    if not scraper:
        return {"error": f"No scraper for {county}"}
    return scraper.search_by_apn(apn)

def get_property_tax_by_address(county: str, st_number: str, st_direction: str, st_name: str, st_suffix: str):
    scraper = COUNTY_SCRAPERS.get(county.lower())
    if not scraper:
        return {"error": f"No scraper for {county}"}
    return scraper.search_by_address(st_number, st_direction, st_name, st_suffix)

def get_property_tax_by_owner(county: str, owner: str):
    scraper = COUNTY_SCRAPERS.get(county.lower())
    if not scraper:
        return {"error": f"No scraper for {county}"}
    return scraper.search_by_owner(owner)

# Main
if __name__ == "__main__":
    
    # --- SCHEMA --- #
    #   List of :: Estimated Property Tax | AIN | APN | Street Address | City | State | Zip Code | Primary Owner | Secondary Owner | Assessed LPV | Tax Rate
    #   All unassociated fields filled with: "N/A"
    # -------------- #

    # TEST VALUES for searches, would be filled by user input in text fields
    #searched_county = "pima"
    searched_county = "pinal"
    #searched_county = "maricopa"
    
    searched_owner = "Smith"

    searched_apn = "13275013"

    street_number = ""
    street_direction = ""
    street_name = "Main"
    street_suffix = ""

    # Test searches in different ways, would be determined by which fields are filled by user

    # Search by APN
    #search_result = get_property_tax_by_apn(searched_county, searched_apn)

    # Search by Owner - Returns around a 10 element list of properties(each property is a list as well) - Each property follows the schema
    search_result = get_property_tax_by_owner(searched_county, searched_owner)

    # Search by Address
    #search_result = get_property_tax_by_address(searched_county, street_number, street_direction, street_name, street_suffix)


    # Output to CSV: searched_properties.csv
    formatted_search_result = search_result
    
    if not formatted_search_result:
        print("No results found. CSV will not be created.")
    else:
        with open("searched_properties.csv", "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=formatted_search_result[0].keys())
            writer.writeheader()
            writer.writerows(formatted_search_result)
        print("CSV created successfully.")