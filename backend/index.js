const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());

let properties = [];

// Map the qyuery parameters to the CSV columns
const queryParamMapping = {
    'AIN': 'AIN',
    'PID': 'PID',
    'Address': 'Address',
    'ZIP Code': 'ZIP Code',
    'City': 'City',
    'County': 'County',
    'Estimated Property Tax': 'Estimated Property Tax'
};

fs.createReadStream('properties.csv')
  .pipe(csv())
  .on('data', (row) => {
    properties.push(row);
  })
  .on('end', () => {
    console.log(properties)
    console.log('CSV file successfully processed');
  });

app.get('/api/search', (req, res) => {

    const query = req.query;
    console.log("Query parameters:", query);
    let filtered = properties;

    for (const key in query) {
        console.log(`Filtering by ${key}: ${query[key]}`);
        if (query[key].trim() === "") {
          // Skip filtering if the query value is an empty string
          continue;
        }
        filtered = filtered.filter((prop) =>
            prop[key] && (prop[key].toLowerCase() == query[key].toLowerCase())
        );
    }

    // Create mock data for testing
    // filtered = [
    //     { AIN: '12345', PID: '67890', Address: '123 Main St', 'ZIP Code': '12345', City: 'Sample City', County: 'Sample County' },
    //     { AIN: '54321', PID: '09876', Address: '456 Elm St', 'ZIP Code': '54321', City: 'Another City', County: 'Another County'},
    // ]

    // Reorder the keys to show "Estimated Property Tax" first
    filtered = filtered.map((prop) => {
        const { "Estimated Property Tax": estimatedPropertyTax, ...rest } = prop;
        return { "Estimated Property Tax": estimatedPropertyTax, ...rest };
    });

    if (filtered.length > 10) {
        filtered = filtered.slice(0, 10);
    }

    console.log("Filtered results:", filtered);
    res.json(filtered);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
