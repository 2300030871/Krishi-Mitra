const fs = require('fs');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

async function importCrops() {
    if (!uri) {
        console.error('MONGO_URI is missing in environment variables.');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB");
        
        const db = dbName ? client.db(dbName) : client.db();
        const cropsCollection = db.collection('crops');

        // Read CSV file
        const csvData = fs.readFileSync('./data.csv', 'utf-8');
        const lines = csvData.trim().split('\n');
        
        // Parse CSV
        const header = lines[0].split(',');
        const crops = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const crop = {};
            header.forEach((key, index) => {
                const value = values[index] ? values[index].trim() : '';
                // Convert numeric fields
                if (key === 'price' || key === 'quantity') {
                    crop[key] = parseInt(value) || 0;
                } else {
                    crop[key] = value;
                }
            });
            crop.createdAt = new Date();
            crops.push(crop);
        }

        // Insert crops
        console.log(`📊 Inserting ${crops.length} crops...`);
        const result = await cropsCollection.insertMany(crops);
        
        console.log(`✅ Successfully inserted ${result.insertedCount} crops into MongoDB`);
        console.log(`🎯 Sample inserted crop:`, crops[0]);
        
    } catch (err) {
        console.error("❌ Error importing crops:", err.message);
        process.exit(1);
    } finally {
        await client.close();
        console.log("🔌 MongoDB connection closed");
        process.exit(0);
    }
}

importCrops();
