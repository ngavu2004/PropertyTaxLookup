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

// === Appeal comparison (average vs. user) ===
// GET /api/appeal-comparison?locationType=zip&locationValue=90272-4365&userTax=20000
app.get('/api/appeal-comparison', async (req, res) => {
  try {
    const { locationType = 'zip', locationValue = '', userTax } = req.query;

    if (!locationValue) return res.status(400).json({ error: 'locationValue is required' });
    const userTaxNum = Number(userTax);
    if (Number.isNaN(userTaxNum)) return res.status(400).json({ error: 'userTax must be a number' });

    // choose field + normalize input
    const fieldForMatch = locationType === 'city' ? 'SitusCity' : 'SitusZIP';
    const normalizeZip = z => (z || '').toString().replace(/[^0-9]/g, '');
    // build match value (regex)
    const matchValue =
      locationType === 'zip'
        ? new RegExp(`^${normalizeZip(locationValue).slice(0, 5)}`, 'i') // match 5-digit prefix of ZIP+4
        : new RegExp(`^${locationValue}$`, 'i'); // case-insensitive exact city

    // LA County baseline rate from CSV notes (1.18%)
    const TAX_RATE = 0.0118;

    const pipeline = [
      { $match: { [fieldForMatch]: matchValue } },
      {
        $addFields: {
          _land: { $convert: { input: { $trim: { input: { $ifNull: ['$Roll_LandValue', '0'] } } }, to: 'double', onError: 0, onNull: 0 } },
          _imp:  { $convert: { input: { $trim: { input: { $ifNull: ['$Roll_ImpValue', '0'] } } },  to: 'double', onError: 0, onNull: 0 } },
          _pers: { $convert: { input: { $trim: { input: { $ifNull: ['$Roll_PersPropValue', '0'] } } }, to: 'double', onError: 0, onNull: 0 } },
          _fix:  { $convert: { input: { $trim: { input: { $ifNull: ['$Roll_FixtureValue', '0'] } } },  to: 'double', onError: 0, onNull: 0 } },
          _hex:  { $convert: { input: { $trim: { input: { $ifNull: ['$Roll_HomeOwnersExemp', '0'] } } }, to: 'double', onError: 0, onNull: 0 } },
          _rex:  { $convert: { input: { $trim: { input: { $ifNull: ['$Roll_RealEstateExemp', '0'] } } }, to: 'double', onError: 0, onNull: 0 } },
          _pex:  { $convert: { input: { $trim: { input: { $ifNull: ['$Roll_PersPropExemp', '0'] } } }, to: 'double', onError: 0, onNull: 0 } },
          _fex:  { $convert: { input: { $trim: { input: { $ifNull: ['$Roll_FixtureExemp', '0'] } } }, to: 'double', onError: 0, onNull: 0 } },
        }
      },
      {
        $addFields: {
          _assessed: {
            $subtract: [
              { $add: ['$_land', '$_imp', '$_pers', '$_fix'] },
              { $add: ['$_hex', '$_rex', '$_pex', '$_fex'] }
            ]
          }
        }
      },
      { $addFields: { EstimatedTax: { $multiply: ['$_assessed', TAX_RATE] } } },
      { $group: { _id: null, avgTax: { $avg: '$EstimatedTax' }, count: { $sum: 1 } } }
    ];

    const result = await Property.aggregate(pipeline);

    if (!result.length || !result[0].count) {
      return res.json({
        averageTax: '0.00',
        userTax: userTaxNum.toFixed(2),
        difference: userTaxNum.toFixed(2),
        message: 'No comparable records were found for that location.'
      });
    }

    const avg = result[0].avgTax || 0;
    const diff = userTaxNum - avg;
    const fmt = n => Number(n).toFixed(2);

    const message =
      diff > 0 ? `You are paying $${fmt(Math.abs(diff))} more than the local average.`
      : diff < 0 ? `You are paying $${fmt(Math.abs(diff))} less than the local average.`
      : `You are paying about the local average.`;

    res.json({
      averageTax: fmt(avg),
      userTax: fmt(userTaxNum),
      difference: fmt(diff),
      recordsCompared: result[0].count,
      message
    });
  } catch (err) {
    console.error('appeal-comparison error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
