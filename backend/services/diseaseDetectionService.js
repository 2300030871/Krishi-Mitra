const DEMO_RESULTS = {
  tomato: {
    diagnosisType: 'disease',
    diseaseOrPest: 'Early Blight',
    confidence: 87,
    severity: 'moderate',
    symptoms: ['Brown spots on leaves', 'Yellowing around leaf lesions'],
    possibleCauses: ['Fungal infection', 'Warm and humid conditions'],
    prevention: ['Remove infected leaves', 'Avoid overhead watering', 'Rotate crops'],
  },
  rice: {
    diagnosisType: 'disease',
    diseaseOrPest: 'Bacterial Leaf Blight',
    confidence: 84,
    severity: 'high',
    symptoms: ['Water-soaked leaf edges', 'Leaves drying from the tip'],
    possibleCauses: ['Bacterial infection', 'Excess nitrogen or standing water'],
    prevention: ['Use resistant varieties', 'Maintain field drainage', 'Remove affected debris'],
  },
  potato: {
    diagnosisType: 'disease',
    diseaseOrPest: 'Early Blight',
    confidence: 82,
    severity: 'moderate',
    symptoms: ['Concentric brown leaf spots', 'Lower leaves affected first'],
    possibleCauses: ['Fungal infection', 'Plant stress or poor nutrition'],
    prevention: ['Use certified seed', 'Maintain plant nutrition', 'Remove infected foliage'],
  },
  cotton: {
    diagnosisType: 'pest',
    diseaseOrPest: 'Aphid',
    confidence: 79,
    severity: 'moderate',
    symptoms: ['Clusters of small insects', 'Curled or yellowing leaves'],
    possibleCauses: ['Aphid infestation', 'Excessively tender plant growth'],
    prevention: ['Monitor leaf undersides', 'Encourage beneficial insects', 'Remove heavily infested leaves'],
  },
  chilli: {
    diagnosisType: 'disease',
    diseaseOrPest: 'Leaf Curl',
    confidence: 81,
    severity: 'high',
    symptoms: ['Upward curling leaves', 'Stunted plant growth'],
    possibleCauses: ['Viral infection', 'Whitefly transmission'],
    prevention: ['Control vector insects', 'Remove infected plants', 'Use healthy seedlings'],
  },
};

const defaultResult = {
  diagnosisType: 'unknown',
  diseaseOrPest: 'Unable to classify in demo mode',
  confidence: 0,
  severity: 'unknown',
  symptoms: ['No demo result is configured for this crop'],
  possibleCauses: ['A trained detection model is required'],
  prevention: ['Consult an agricultural expert for field diagnosis'],
};

const detectDisease = async (imagePath, crop) => {
  if (!imagePath) throw new Error('An image path is required for disease detection.');

  const key = String(crop || '').trim().toLowerCase();
  return {
    ...(DEMO_RESULTS[key] || defaultResult),
    detectionSource: 'mock',
  };
};

module.exports = {
  detectDisease,
};
