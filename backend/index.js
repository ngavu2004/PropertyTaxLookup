const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const Property = require('./models/Property');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: process.env.CORS_TRUSTED_ORIGIN.split(','),
};
app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
connectDB();

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/api/search', async (req, res) => {
    try {
        const query = req.query;
        console.log("Query parameters:", query);
        
        // Build MongoDB query object
        const mongoQuery = {};
        
        // Map query parameters to database fields
        const fieldMapping = {
            'AIN': 'AIN',
            'APN': 'APN',
            'Address': 'SitusAddress',
            'SitusAddress': 'SitusAddress',
            'SitusFullAddress': 'SitusFullAddress',
            'ZIP Code': 'SitusZIP',
            'SitusZIP': 'SitusZIP',
            'City': 'SitusCity',
            'SitusCity': 'SitusCity',
            'County': 'LCITY',
            'LCITY': 'LCITY',
            'Estimated Property Tax': 'Estimated_Property_Tax',
            'Estimated_Property_Tax': 'Estimated_Property_Tax',
            'UseType': 'UseType',
            'UseDescription': 'UseDescription',
            'YearBuilt': 'YearBuilt1',
            'SQFT': 'SQFTmain1',
            'Bedrooms': 'Bedrooms1',
            'Bathrooms': 'Bathrooms1'
        };

        // Build the query object
        for (const key in query) {
            if (query[key] && query[key].trim() !== "") {
                const dbField = fieldMapping[key] || key;
                const value = query[key].trim();
                
                // Use case-insensitive regex search for text fields
                if (dbField === 'AIN' || dbField === 'APN') {
                    // Exact match for AIN and APN
                    mongoQuery[dbField] = value;
                } else {
                    // Case-insensitive regex for other fields
                    mongoQuery[dbField] = { $regex: value, $options: 'i' };
                }
                
                console.log(`Filtering by ${key} (${dbField}): ${value}`);
            }
        }

        console.log("MongoDB query:", mongoQuery);

        // Execute the query with limit
        const filtered = await Property.find(mongoQuery)
            .limit(10)
            .lean(); // Use lean() for better performance

        // Reorder the keys to show "Estimated Property Tax" first
        const reorderedResults = filtered.map((prop) => {
            const { Estimated_Property_Tax, ...rest } = prop;
            return { 
                "Estimated Property Tax": Estimated_Property_Tax, 
                ...rest 
            };
        });

        console.log(`Found ${reorderedResults.length} results`);
        res.json(reorderedResults);
        
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message 
        });
    }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
