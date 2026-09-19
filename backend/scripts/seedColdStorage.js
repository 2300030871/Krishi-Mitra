const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const ColdStorage = require('../models/ColdStorage');
const coldStorageSeed = require('../data/coldStorageSeed');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedColdStorage = async () => {
  await connectDB();

  for (const storage of coldStorageSeed) {
    await ColdStorage.findOneAndUpdate(
      { name: storage.name, location: storage.location },
      { $set: storage },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Seeded ${coldStorageSeed.length} sample cold-storage records.`);
  process.exit(0);
};

seedColdStorage().catch((error) => {
  console.error('Failed to seed cold storage:', error.message);
  process.exit(1);
});
