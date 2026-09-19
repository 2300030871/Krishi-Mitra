const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const LogisticsProvider = require('../models/LogisticsProvider');
const providerSeed = require('../data/logisticsProviderSeed');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedLogisticsProviders = async () => {
  await connectDB();

  for (const provider of providerSeed) {
    await LogisticsProvider.findOneAndUpdate(
      { providerName: provider.providerName },
      { $set: provider },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Seeded ${providerSeed.length} sample logistics providers.`);
  process.exit(0);
};

seedLogisticsProviders().catch((error) => {
  console.error('Failed to seed logistics providers:', error.message);
  process.exit(1);
});
