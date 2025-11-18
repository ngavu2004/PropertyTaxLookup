import requests
import re, pprint
from bs4 import BeautifulSoup
from flask import Flask
from scrapers.base_county import BaseCountyScraper

app = Flask(__name__)

class PinalScraper(BaseCountyScraper):

    @app.route('/pinal/owner')
    def search_by_owner(self, owner: str):

        search_url = "https://app1.pinal.gov/search/parcel-search.aspx"
        session = requests.Session()

        resp = session.get(search_url)
        soup = BeautifulSoup(resp.text, "html.parser")

        payload = {
            "__VIEWSTATE": soup.select_one("#__VIEWSTATE")["value"],
            "__VIEWSTATEGENERATOR": soup.select_one("#__VIEWSTATEGENERATOR")["value"],
            "__EVENTVALIDATION": soup.select_one("#__EVENTVALIDATION")["value"],
            "__SCROLLPOSITIONX": "0",
            "__SCROLLPOSITIONY": "0",

            "txtOwner": owner,
            "btnSearchOwner": "Search"
        }

        # POST
        resp = session.post(search_url, data=payload)
        soup = BeautifulSoup(resp.text, "html.parser")

        searched_properties = []
        table = soup.select_one("table#gvSearchName")
        if table:
            for row in table.select("tr")[1:]:
                classes = row.get("class") or []
                if "grid-pager" in classes or "grid-header" in classes:
                    continue

                cols = [c.get_text(strip=True) for c in row.select("td")]
                if not cols:
                    continue
                
                if len(cols[0]) == 1:
                    continue

                apn = cols[0]

                # Fill each property with a property search by apn that returns a list which follows the schema
                property_list = self.search_by_apn(apn)
                if property_list:
                    searched_properties.extend(property_list)


        else:
            print("No table found")

        return searched_properties

    @app.route('/pinal/apn')
    def search_by_apn(self, apn: str) -> list:

        apn_digits = "".join(filter(str.isdigit, apn))

        # Insert dashes to match expected pattern
        # This assumes 3-2-3/4 digits format with optional split
        if len(apn_digits) < 8:  # too short to parse
            print("Invalid APN length")
            return []

        # Build a string with dashes for regex matching
        # Example: 210730020 -> 210-73-0020
        formatted_apn = f"{apn_digits[:3]}-{apn_digits[3:5]}-{apn_digits[5:]}"

        match = re.match(r"(\d{3})-(\d{2})-(\d{3,4})([A-Z]?)", formatted_apn)
        if not match:
            print("Invalid parcel number format")
            return []

        book, map, parcel, split = match.groups()
        split = split or "0"

        if len(parcel) == 4 and split == "0":
            split = parcel[-1]
            parcel = parcel[:-1]

        base_url = "https://app1.pinal.gov"
        search_url = "https://app1.pinal.gov/search/parcel-search.aspx"
        session = requests.Session()

        resp = session.get(search_url)
        soup = BeautifulSoup(resp.text, "html.parser")

        payload = {
            "__VIEWSTATE": soup.select_one("#__VIEWSTATE")["value"],
            "__VIEWSTATEGENERATOR": soup.select_one("#__VIEWSTATEGENERATOR")["value"],
            "__EVENTVALIDATION": soup.select_one("#__EVENTVALIDATION")["value"],
            "__SCROLLPOSITIONX": "0",
            "__SCROLLPOSITIONY": "0",
            "__EVENTTARGET": "",
            "__EVENTARGUMENT": "",

            "txtBook": book,
            "txtMap": map,
            "txtParcel": parcel,
            "ddlSplit": split,

            "btnSearchParcel": "Search"
        }

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
            "Referer": search_url
        }

        # Post
        resp = session.post(search_url, data=payload, headers=headers)
        soup = BeautifulSoup(resp.text, "html.parser")

        table = soup.select_one("table#gvSearchParcel")
        if not table:
            #print("No results found")
            return []

        # Get the searched property
        searched_property = []
        row = table.select_one("tr:nth-of-type(2)")  
        if row:

            cols = [c.get_text(strip=True) for c in row.select("td")]
            city_state = cols[2] if len(cols) > 2 else "N/A"

            city, state = "N/A", "N/A"
            if "," in city_state:
                try:
                    city, state = city_state.split(",", 1)
                    city, state = city.strip(), state.strip()
                except ValueError:
                    pass

            onclick = row.get("onclick", "")
            parcel_id = None
            detail_url = None

            if onclick:
                m = re.search(r"parcel_ID=([\w\d]+)", onclick)
                if m:
                    parcel_id = m.group(1)

                    #Get the URL for the searched property page
                    detail_url = f"{base_url}/Search/Parcel-Details.aspx?parcel_ID={parcel_id}"

                    #Go to that searched property page
                    resp2 = session.get(detail_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                    detail_soup = BeautifulSoup(resp2.text, "html.parser")

                    searched_property = self.fill_property(apn, detail_soup)
        
        return searched_property

    @app.route('/pinal/address')
    def search_by_address(self, st_number, st_direction, st_name, st_suffix) -> dict:
        
        if st_name == "":
            print("Street Name needed.")
            return []
        
        st_suffix = st_suffix.upper()
        st_direction = st_direction.upper()
        
        search_url = "https://app1.pinal.gov/search/parcel-search.aspx"
        session = requests.Session()

        resp = session.get(search_url)
        soup = BeautifulSoup(resp.text, "html.parser")

        payload = {
            "__VIEWSTATE": soup.select_one("#__VIEWSTATE")["value"],
            "__VIEWSTATEGENERATOR": soup.select_one("#__VIEWSTATEGENERATOR")["value"],
            "__EVENTVALIDATION": soup.select_one("#__EVENTVALIDATION")["value"],
            "__SCROLLPOSITIONX": "0",
            "__SCROLLPOSITIONY": "0",
            "__EVENTTARGET": "",
            "__EVENTARGUMENT": "",

            "txtNumber": st_number,
            "ddlDirection": st_direction,
            "txtStreetName": st_name,
            "ddlSuffix": st_suffix,

            "btnSearchAddress": "Search"
        }

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
            "Referer": search_url
        }

        # Post
        resp = session.post(search_url, data=payload, headers=headers)
        soup = BeautifulSoup(resp.text, "html.parser")

        searched_properties = []
        table = soup.select_one("table#gvSearchAddress")
        if table:
            for row in table.select("tr")[1:]:
                classes = row.get("class") or []
                if "grid-pager" in classes or "grid-header" in classes:
                    continue

                cols = [c.get_text(strip=True) for c in row.select("td")]
                if not cols:
                    continue
                
                if len(cols[0]) == 1:
                    continue

                apn = cols[0]
                # Fill each property with a property search by apn that returns a list which follows the schema
                property_list = self.search_by_apn(apn)
                if property_list:  # only if search_by_apn returned something
                    searched_properties.extend(property_list)

        else:
            print("No table found")

        return searched_properties

    def get_assessed_lpv(self, detail_soup) -> str:

        assessed_lpv_span = detail_soup.select_one("#lblAssessedLPV")

        if assessed_lpv_span:
            assessed_lpv_value = assessed_lpv_span.get_text(strip=True)
        else:
            assessed_lpv_value = "N/A"

        return assessed_lpv_value
        
    def get_primary_owner(self, detail_soup) -> str:

        primary_owner_span = detail_soup.select_one("#lblOwner1")

        if primary_owner_span:
            primary_owner_value = primary_owner_span.get_text(strip=True)
        else:
            primary_owner_value = "N/A"

        return primary_owner_value
    
    def get_secondary_owner(self, detail_soup) -> str:

        secondary_owner_span = detail_soup.select_one("#lblOwner2")

        if secondary_owner_span:
            secondary_owner_value = secondary_owner_span.get_text(strip=True)
        else:
            secondary_owner_value = "N/A"

        return secondary_owner_value
        
    def get_address(self, detail_soup) -> str:

        address_span = detail_soup.select_one("#lblPropAddress")

        if address_span:
            address = address_span.get_text(strip=True)
        else:
            address = "N/A"

        return address
        
    def parse_address(self, full_address: str) -> dict:

        full_address = " ".join(full_address.strip().split())

        suffixes = ["AVE", "BND", "BLVD", "CIR", "CT", "DR", "HWY", "LN", "LOOP", "PASS", "PATH", "PKWY", "PL", "RD", "ST", "TRL", "WAY"]

        last_suffix = None
        pos = -1
        for suffix in suffixes:

            pattern = r"\b" + re.escape(suffix) + r"[.,]?\b"
            match = re.search(pattern, full_address.upper())
            if match and match.end() > pos:
                pos = match.end()
                last_suffix = suffix

        if not last_suffix:

            parts = full_address.split()
            if len(parts) >= 3 and re.match(r"^\d{5}(-\d{4})?$", parts[-1]):
                zipcode = parts[-1]
                state = parts[-2]
                city = " ".join(parts[:-2])
                return {
                    "Street Address": "N/A",
                    "City": city,
                    "State": state,
                    "ZIP Code": zipcode
                }
            return {
                "Street Address": full_address,
                "City": "N/A",
                "State": "N/A",
                "ZIP Code": "N/A"
            }

        street = full_address[:pos].strip(",. ")
        remainder = full_address[pos:].strip()

        parts = remainder.split()
        if len(parts) < 3:
            return {
                "Street Address": street,
                "City": remainder,
                "State": "N/A",
                "ZIP Code": "N/A"
            }

        zipcode = parts[-1]
        state = parts[-2]
        city = " ".join(parts[:-2])

        return {
            "Street Address": street,
            "City": city,
            "State": state,
            "ZIP Code": zipcode
        }
    
    def fill_property(self, apn, detail_soup) -> list:

        # Get Assessed Full Cash Value
        assessed_lpv_unstripped = self.get_assessed_lpv(detail_soup)
        assessed_lpv_stripped = assessed_lpv_unstripped.replace("$", "").replace(",", "")
        assessed_lpv = float(assessed_lpv_stripped)
        assessed_lpv = round(assessed_lpv, 2)
                    
        #Rate
        general_tax_rate = 3.4753
                    
        #Perform Property Tax Calculation
        property_tax = (assessed_lpv * general_tax_rate) / 100
        property_tax = f"${property_tax:,.2f}"
                    
        # Get Address
        full_address = self.get_address(detail_soup)
        parsed_address_dictionary = self.parse_address(full_address)

        #Get Primary Owner
        primary_owner = self.get_primary_owner(detail_soup)
                    
        # Get Secondary Owner
        secondary_owner = self.get_secondary_owner(detail_soup)
        
        searched_property = []
        # Fill list with housing details following schema
        searched_property.append({
            "Estimated Property Tax": property_tax,
            "AIN": "N/A",
            "APN": apn,
            "Street Address": parsed_address_dictionary["Street Address"],
            "City": parsed_address_dictionary["City"],
            "State": parsed_address_dictionary["State"],
            "ZIP Code": parsed_address_dictionary["ZIP Code"],
            "Primary Owner": primary_owner,
            "Secondary Owner": secondary_owner,
            "Assessed LPV": assessed_lpv_unstripped,
            "Tax Rate": general_tax_rate
        })

        return searched_property