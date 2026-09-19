const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Treatment = require('../models/Treatment');
const treatmentSeed = require('../data/treatmentSeed');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedTreatments = async () => {
  await connectDB();

  for (const treatment of treatmentSeed) {
    await Treatment.findOneAndUpdate(
      { crop: treatment.crop, diseaseOrPest: treatment.diseaseOrPest },
      { $set: treatment },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Seeded ${treatmentSeed.length} treatment guidance records.`);
  process.exit(0);
};

seedTreatments().catch((error) => {
  console.error('Failed to seed treatment guidance:', error.message);
  process.exit(1);
});
