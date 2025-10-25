const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const connectDB = require('../config/database');
const Property = require('../models/Property');

// Connect to database
connectDB();

const updateDatabase = async () => {
  try {
    console.log('Starting database update...');
    
    const csvPath = path.join(__dirname, '../data/properties.csv');
    const properties = [];
    let processedCount = 0;
    let updatedCount = 0;
    let insertedCount = 0;
    
    console.log('Reading CSV file...');
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Clean up the data
        const cleanedRow = {};
        Object.keys(row).forEach(key => {
          const value = row[key];
          cleanedRow[key] = value === '' ? null : value;
        });
        
        properties.push(cleanedRow);
        processedCount++;
        
        if (processedCount % 1000 === 0) {
          console.log(`Processed ${processedCount} records...`);
        }
      })
      .on('end', async () => {
        try {
          console.log(`Finished reading CSV. Total records: ${processedCount}`);
          console.log('Updating database...');
          
          // Process each property
          for (const propertyData of properties) {
            try {
              // Try to find existing property by AIN
              const existingProperty = await Property.findOne({ AIN: propertyData.AIN });
              
              if (existingProperty) {
                // Update existing property
                await Property.updateOne(
                  { AIN: propertyData.AIN },
                  { $set: propertyData }
                );
                updatedCount++;
              } else {
                // Insert new property
                await Property.create(propertyData);
                insertedCount++;
              }
            } catch (error) {
              console.error(`Error processing property with AIN ${propertyData.AIN}:`, error.message);
            }
          }
          
          console.log('Database update completed!');
          console.log(`Properties updated: ${updatedCount}`);
          console.log(`Properties inserted: ${insertedCount}`);
          console.log(`Total processed: ${processedCount}`);
          
          // Get final statistics
          const totalInDB = await Property.countDocuments();
          console.log(`Total properties in database: ${totalInDB}`);
          
          process.exit(0);
        } catch (error) {
          console.error('Error updating database:', error);
          process.exit(1);
        }
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        process.exit(1);
      });
      
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
};

// Run the update
updateDatabase();
