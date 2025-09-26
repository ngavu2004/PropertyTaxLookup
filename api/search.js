const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

let properties = [];

// Load CSV data once when the serverless function starts
const loadProperties = () => {
  return new Promise((resolve, reject) => {
    // Try multiple possible paths for the CSV file
    const possiblePaths = [
      path.join(process.cwd(), 'backend', 'properties.csv'),
      path.join(process.cwd(), 'properties.csv'),
      path.join(__dirname, '..', 'backend', 'properties.csv'),
      path.join(__dirname, '..', 'properties.csv')
    ];
    
    let csvPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        csvPath = testPath;
        break;
      }
    }
    
    if (!csvPath) {
      reject(new Error('CSV file not found in any expected location'));
      return;
    }
    
    console.log(`Loading CSV from: ${csvPath}`);
    const results = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', () => {
        properties = results;
        console.log(`Loaded ${properties.length} properties`);
        resolve();
      })
      .on('error', reject);
  });
};

// Initialize properties data
let propertiesLoaded = false;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Load properties if not already loaded
    if (!propertiesLoaded) {
      await loadProperties();
      propertiesLoaded = true;
    }

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

    // Reorder the keys to show "Estimated Property Tax" first
// Step 1: Determine keys where ALL values are empty
const keysToRemove = [];
if (filtered.length > 0) {
  const keys = Object.keys(filtered[0]);
  for (const key of keys) {
    const allEmpty = filtered.every(
      (row) =>
        row[key] === null ||
        row[key] === undefined ||
        row[key].toString().trim() === ""
    );
    if (allEmpty) {
      keysToRemove.push(key);
    }
  }
}

// Step 2: Remove empty columns and re-order Estimated Property Tax first
filtered = filtered.map((row) => {
  const newRow = {};
  const estimatedTax = row["Estimated Property Tax"];

  // Add Estimated Property Tax first
  newRow["Estimated Property Tax"] = estimatedTax;

  // Add remaining keys except those in keysToRemove
  for (const key in row) {
    if (key !== "Estimated Property Tax" && !keysToRemove.includes(key)) {
      newRow[key] = row[key];
    }
  }

  return newRow;
});




    if (filtered.length > 10) {
      filtered = filtered.slice(0, 10);
    }

    console.log("Filtered results:", filtered);
    res.status(200).json(filtered);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

