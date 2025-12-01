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
            'Estimated_Property_Tax': 'Estimated_Property_Tax'
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
            .limit(200)
            .lean();

        const projection = [
          "Estimated_Property_Tax", "AIN", "APN", "SitusAddress", "SitusCity", "SitusZIP", "Roll_LandValue", 'Avg_Tax_Rate'
        ];

        const projected = filtered.map(p => {
        const projectedObj = {};

        projection.forEach(field => {
          if (p[field] !== undefined) {
            projectedObj[field] = p[field];
          }
        });

        return projectedObj;
      });

      // Rename fields for frontend
      const formatted = projected.map(p => ({
        "Estimated Property Tax": p.Estimated_Property_Tax,
        "AIN": p.AIN,
        "APN": p.APN,
        "Address": p.SitusAddress,
        "City": p.SitusCity,
        "ZIP Code": p.SitusZIP,
        "Assessed LPV": p.Roll_LandValue,
        "Average Tax Rate": p.Avg_Tax_Rate
      }));

      res.json(formatted);

        
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message 
        });
    }
});

// === Database Statistics ===
// GET /api/statistics
app.get('/api/statistics', async (req, res) => {
  try {
    // Get total count
    const totalProperties = await Property.countDocuments();

    // Get tax statistics
    const taxStats = await Property.aggregate([
      {
        $project: {
          tax: {
            $convert: {
              input: { $trim: { input: { $ifNull: ['$Estimated_Property_Tax', '0'] } } },
              to: 'double',
              onError: null,
              onNull: null
            }
          }
        }
      },
      {
        $match: {
          tax: { $exists: true, $ne: null, $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          averageTax: { $avg: '$tax' },
          highestTax: { $max: '$tax' },
          lowestTax: { $min: '$tax' }
        }
      }
    ]);

    // Get unique cities count
    const citiesCount = await Property.distinct('SitusCity').then(cities => cities.filter(city => city && city.trim() !== '').length);

    // Get unique ZIP codes count
    const zipCodesCount = await Property.distinct('SitusZIP').then(zips => zips.filter(zip => zip && zip.trim() !== '').length);

    // Get top cities by property count
    const topCities = await Property.aggregate([
      {
        $match: {
          SitusCity: { 
            $exists: true, 
            $ne: null,
            $nin: ['', 'N/A', 'n/a', 'N/a', 'NA', 'na', 'Na']
          }
        }
      },
      {
        $addFields: {
          cityTrimmed: { $trim: { input: { $ifNull: ['$SitusCity', ''] } } }
        }
      },
      {
        $match: {
          cityTrimmed: { $ne: '', $nin: ['N/A', 'n/a', 'N/a', 'NA', 'na', 'Na'] }
        }
      },
      {
        $group: {
          _id: '$cityTrimmed',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          count: 1
        }
      }
    ]);

    const stats = {
      totalProperties,
      averageTax: taxStats[0]?.averageTax || 0,
      highestTax: taxStats[0]?.highestTax || 0,
      lowestTax: taxStats[0]?.lowestTax || 0,
      totalCities: citiesCount,
      totalZipCodes: zipCodesCount,
      topCities: topCities
    };

    res.json(stats);
  } catch (err) {
    console.error('Statistics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === Cities for Map ===
// GET /api/cities
app.get('/api/cities', async (req, res) => {
  try {
    const cities = await Property.aggregate([
      {
        $match: {
          SitusCity: { 
            $exists: true, 
            $ne: null,
            $nin: ['', 'N/A', 'n/a', 'N/a', 'NA', 'na', 'Na']
          },
          CENTER_LAT: { $exists: true, $ne: null, $ne: '' },
          CENTER_LON: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $addFields: {
          cityTrimmed: { $trim: { input: { $ifNull: ['$SitusCity', ''] } } },
          lat: {
            $convert: {
              input: { $trim: { input: { $ifNull: ['$CENTER_LAT', '0'] } } },
              to: 'double',
              onError: null,
              onNull: null
            }
          },
          lon: {
            $convert: {
              input: { $trim: { input: { $ifNull: ['$CENTER_LON', '0'] } } },
              to: 'double',
              onError: null,
              onNull: null
            }
          }
        }
      },
      {
        $match: {
          cityTrimmed: { $ne: '', $nin: ['N/A', 'n/a', 'N/a', 'NA', 'na', 'Na'] },
          lat: { $exists: true, $ne: null, $gt: 0 },
          lon: { $exists: true, $ne: null, $lt: 0 }
        }
      },
      {
        $group: {
          _id: '$cityTrimmed',
          count: { $sum: 1 },
          avgLat: { $avg: '$lat' },
          avgLon: { $avg: '$lon' },
          minLat: { $min: '$lat' },
          maxLat: { $max: '$lat' },
          minLon: { $min: '$lon' },
          maxLon: { $max: '$lon' }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          count: 1,
          centroid: {
            lat: { $round: ['$avgLat', 6] },
            lon: { $round: ['$avgLon', 6] }
          },
          bounds: {
            minLat: { $round: ['$minLat', 6] },
            maxLat: { $round: ['$maxLat', 6] },
            minLon: { $round: ['$minLon', 6] },
            maxLon: { $round: ['$maxLon', 6] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(cities);
  } catch (err) {
    console.error('Cities error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === City Statistics ===
// GET /api/city-statistics?city=NAME
app.get('/api/city-statistics', async (req, res) => {
  try {
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    const cityName = city.trim();

    // Get total properties in city (matching trimmed city names)
    const totalPropertiesResult = await Property.aggregate([
      {
        $addFields: {
          cityTrimmed: { $trim: { input: { $ifNull: ['$SitusCity', ''] } } }
        }
      },
      {
        $match: {
          cityTrimmed: { $regex: new RegExp(`^${cityName}$`, 'i') }
        }
      },
      {
        $count: 'total'
      }
    ]);

    const totalProperties = totalPropertiesResult[0]?.total || 0;

    if (totalProperties === 0) {
      return res.json({
        city: cityName,
        totalProperties: 0,
        averageTax: 0,
        highestTax: 0,
        lowestTax: 0,
        totalZipCodes: 0
      });
    }

    // Get tax statistics for the city
    const taxStats = await Property.aggregate([
      {
        $addFields: {
          cityTrimmed: { $trim: { input: { $ifNull: ['$SitusCity', ''] } } }
        }
      },
      {
        $match: {
          cityTrimmed: { $regex: new RegExp(`^${cityName}$`, 'i') }
        }
      },
      {
        $project: {
          tax: {
            $convert: {
              input: { $trim: { input: { $ifNull: ['$Estimated_Property_Tax', '0'] } } },
              to: 'double',
              onError: null,
              onNull: null
            }
          }
        }
      },
      {
        $match: {
          tax: { $exists: true, $ne: null, $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          averageTax: { $avg: '$tax' },
          highestTax: { $max: '$tax' },
          lowestTax: { $min: '$tax' }
        }
      }
    ]);

    // Get unique ZIP codes count for the city
    const zipCodesResult = await Property.aggregate([
      {
        $addFields: {
          cityTrimmed: { $trim: { input: { $ifNull: ['$SitusCity', ''] } } }
        }
      },
      {
        $match: {
          cityTrimmed: { $regex: new RegExp(`^${cityName}$`, 'i') }
        }
      },
      {
        $group: {
          _id: '$SitusZIP'
        }
      }
    ]);

    const zipCodesCount = zipCodesResult.filter(zip => zip._id && zip._id.trim() !== '').length;

    const stats = {
      city: cityName,
      totalProperties,
      averageTax: taxStats[0]?.averageTax || 0,
      highestTax: taxStats[0]?.highestTax || 0,
      lowestTax: taxStats[0]?.lowestTax || 0,
      totalZipCodes: zipCodesCount
    };

    res.json(stats);
  } catch (err) {
    console.error('City statistics error:', err);
    res.status(500).json({ error: 'Internal server error' });
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

