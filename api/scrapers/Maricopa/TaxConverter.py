import pdfplumber
import csv
import re

pdf_path = "scrapers/Maricopa/tax_rates_2025.pdf"
csv_path = "scrapers/Maricopa/tax_code_rates.csv"

# Pattern to capture the whole row: tax code followed by names and 3 floats
row_pattern = re.compile(
    r'(?P<code>\d{6})\s+'
    r'(?P<elem>.+?)\s+'
    r'(?P<high>.+?)\s+'
    r'(?P<city>.+?)\s+'
    r'(?P<primary>\d+\.\d{4})\s+'
    r'(?P<residential>\d+\.\d{4})\s+'
    r'(?P<secondary>\d+\.\d{4})'
)

rows = []

with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        if not text:
            continue
        for line in text.splitlines():
            # Try to find all matches (some lines have multiple rows)
            for match in row_pattern.finditer(line):
                rows.append([
                    match.group("code"),
                    match.group("elem"),
                    match.group("high"),
                    match.group("city"),
                    match.group("primary"),
                    match.group("residential"),
                    match.group("secondary"),
                ])

# Write to CSV
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "Tax Area Code", "Elementary District", "High School District", "City",
        "Primary Rate", "Residential Rate", "Secondary Rate"
    ])
    writer.writerows(rows)

print(f"Extracted {len(rows)} rows to {csv_path}")
