const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const connectDB = require('../config/database');
const Property = require('../models/Property');

// Connect to database
connectDB();

const importCSV = async () => {
  try {
    console.log('Starting CSV import...');
    
    // Clear existing data (optional - remove if you want to keep existing data)
    console.log('Clearing existing properties...');
    await Property.deleteMany({});
    
    // List all csv files in the data directory
    const csvFiles = fs.readdirSync(path.join(__dirname, '../data'));
    console.log('CSV files:', csvFiles);
    
    
    const properties = [];
    let processedCount = 0;
    
    console.log('Reading CSV file...');
    
    // For each csv file, import the data into the database
    for (const csvFile of csvFiles) {
      const csvPath = path.join(__dirname, '../data', csvFile);
      console.log('CSV path:', csvPath);
      
      const properties = [];
      let processedCount = 0;
      
      console.log('Reading CSV file...');

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Clean up the data - remove empty values and convert to proper format
          const cleanedRow = {};
          Object.keys(row).forEach(key => {
            const value = row[key];
            // Convert empty strings to null for better database storage
            cleanedRow[key] = value === '' ? null : value;
          });
          properties.push(cleanedRow);
          processedCount++;
        })
        .on('end', async () => {
          try {
            console.log(`Finished reading CSV. Total records: ${processedCount}`);
            console.log('Inserting data into MongoDB...');
            
            // Insert in batches to avoid memory issues
            const batchSize = 1000;
            for (let i = 0; i < properties.length; i += batchSize) {
              const batch = properties.slice(i, i + batchSize);
              await Property.insertMany(batch, { ordered: false });
              console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(properties.length / batchSize)}`);
            }
            
            console.log('CSV import completed successfully!');
            console.log(`Total properties imported: ${properties.length}`);
            
            // Get some statistics
            const totalInDB = await Property.countDocuments();
            console.log(`Total properties in database: ${totalInDB}`);
            
            process.exit(0);
          } catch (error) {
            console.error('Error inserting data:', error);
            process.exit(1);
          }
        })
        .on('error', (error) => {
          console.error('Error reading CSV file:', error);
          process.exit(1);
        });
    }
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
};

// Run the import
importCSV();
