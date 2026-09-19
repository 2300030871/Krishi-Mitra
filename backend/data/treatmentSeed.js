const commonEnglish = {
  immediateActions: [
    'Separate visibly affected plants or plant parts where practical.',
    'Remove fallen or heavily affected material and dispose of it away from the crop.',
    'Record the affected area and monitor nearby plants for changes.',
  ],
  treatmentOptions: [
    'Confirm the diagnosis with a local agriculture officer before selecting any product or intervention.',
    'Use only interventions approved for this crop and problem in your area, following the current product label exactly.',
    'Follow the recommended integrated pest or disease management plan for the crop.',
  ],
  organicMethods: [
    'Use clean planting material and maintain field sanitation.',
    'Encourage beneficial insects and avoid unnecessary broad-spectrum interventions.',
    'Use a locally verified biological or botanical option only when an agriculture expert recommends it.',
  ],
  prevention: [
    'Inspect plants regularly, especially new growth and leaf undersides.',
    'Maintain suitable spacing, drainage, and field hygiene.',
    'Rotate crops where practical and use locally recommended resistant varieties.',
  ],
  safetyNotes: [
    'This is general prototype guidance, not a pesticide prescription.',
    'Do not mix or apply agricultural products without current local label and expert guidance.',
    'Use appropriate protective equipment and observe all label, harvest, and re-entry requirements.',
  ],
  expertAdvice: [
    'Consult an agriculture expert when symptoms spread quickly, the crop is valuable, or the diagnosis is uncertain.',
    'Take clear images and a plant sample if your local extension service accepts samples.',
  ],
};

const commonHindi = {
  immediateActions: [
    'जहाँ संभव हो, प्रभावित पौधों या हिस्सों को अलग करें।',
    'गिरे हुए या अधिक प्रभावित हिस्सों को हटाकर खेत से दूर नष्ट करें।',
    'प्रभावित क्षेत्र को दर्ज करें और आसपास के पौधों की निगरानी करें।',
  ],
  treatmentOptions: [
    'किसी उत्पाद या उपाय को चुनने से पहले स्थानीय कृषि अधिकारी से पहचान की पुष्टि करें।',
    'अपने क्षेत्र में इस फसल और समस्या के लिए स्वीकृत उपाय ही इस्तेमाल करें और वर्तमान लेबल का पालन करें।',
    'फसल के लिए अनुशंसित एकीकृत कीट या रोग प्रबंधन योजना अपनाएँ।',
  ],
  organicMethods: [
    'स्वच्छ रोपण सामग्री का उपयोग करें और खेत की सफाई रखें।',
    'लाभकारी कीटों को बचाएँ और अनावश्यक व्यापक उपायों से बचें।',
    'स्थानीय विशेषज्ञ की सलाह पर ही सत्यापित जैविक या वनस्पति विकल्प अपनाएँ।',
  ],
  prevention: [
    'पौधों की नियमित जाँच करें, विशेषकर नई वृद्धि और पत्तियों की निचली सतह की।',
    'उचित दूरी, जल निकास और खेत की स्वच्छता बनाए रखें।',
    'जहाँ संभव हो फसल चक्र अपनाएँ और स्थानीय रूप से अनुशंसित प्रतिरोधी किस्में चुनें।',
  ],
  safetyNotes: [
    'यह सामान्य प्रोटोटाइप मार्गदर्शन है, कीटनाशक का नुस्खा नहीं।',
    'वर्तमान स्थानीय लेबल और विशेषज्ञ सलाह के बिना कृषि उत्पाद न मिलाएँ और न लगाएँ।',
    'सुरक्षा उपकरण और लेबल में दिए सभी निर्देशों का पालन करें।',
  ],
  expertAdvice: [
    'लक्षण तेजी से फैलें, फसल मूल्यवान हो या पहचान निश्चित न हो तो कृषि विशेषज्ञ से संपर्क करें।',
    'स्पष्ट तस्वीरें और नमूना लेकर स्थानीय कृषि सेवा से सलाह लें।',
  ],
};

const commonTelugu = {
  immediateActions: [
    'సాధ్యమైన చోట ప్రభావిత మొక్కలను లేదా భాగాలను వేరు చేయండి.',
    'పడిపోయిన లేదా తీవ్రంగా ప్రభావిత భాగాలను తొలగించి పొలానికి దూరంగా నాశనం చేయండి.',
    'ప్రభావిత ప్రాంతాన్ని నమోదు చేసి సమీప మొక్కలను గమనించండి.',
  ],
  treatmentOptions: [
    'ఏ ఉత్పత్తి లేదా చర్యను ఎంచుకునే ముందు స్థానిక వ్యవసాయ అధికారితో నిర్ధారించండి.',
    'మీ ప్రాంతంలో ఈ పంటకు ఆమోదించబడిన చర్యలను మాత్రమే ప్రస్తుత లేబుల్ ప్రకారం ఉపయోగించండి.',
    'పంటకు సూచించిన సమగ్ర పురుగు లేదా వ్యాధి నిర్వహణ పద్ధతిని అనుసరించండి.',
  ],
  organicMethods: [
    'శుభ్రమైన నాటే పదార్థాన్ని ఉపయోగించి పొలం పరిశుభ్రంగా ఉంచండి.',
    'ప్రయోజనకరమైన పురుగులను కాపాడండి మరియు అవసరం లేని చర్యలను నివారించండి.',
    'స్థానిక నిపుణుల సూచనతో మాత్రమే ధృవీకరించిన జీవ లేదా వృక్ష ఆధారిత పద్ధతిని ఉపయోగించండి.',
  ],
  prevention: [
    'మొక్కలను క్రమం తప్పకుండా పరిశీలించండి, ముఖ్యంగా కొత్త పెరుగుదల మరియు ఆకుల దిగువ భాగాలను.',
    'సరైన దూరం, నీటి పారుదల మరియు పొలం పరిశుభ్రతను పాటించండి.',
    'సాధ్యమైన చోట పంట మార్పిడి చేసి స్థానికంగా సూచించిన నిరోధక రకాలను ఎంచుకోండి.',
  ],
  safetyNotes: [
    'ఇది సాధారణ ప్రోటోటైప్ మార్గదర్శకం మాత్రమే, పురుగుమందు సూచన కాదు.',
    'ప్రస్తుత స్థానిక లేబుల్ మరియు నిపుణుల సలహా లేకుండా వ్యవసాయ ఉత్పత్తులను కలపకండి లేదా వాడకండి.',
    'రక్షణ పరికరాలు మరియు లేబుల్‌లోని అన్ని సూచనలను పాటించండి.',
  ],
  expertAdvice: [
    'లక్షణాలు వేగంగా వ్యాపిస్తే, పంట విలువైనదైతే లేదా గుర్తింపు స్పష్టంగా లేకపోతే వ్యవసాయ నిపుణుడిని సంప్రదించండి.',
    'స్పష్టమైన చిత్రాలు మరియు నమూనాతో స్థానిక వ్యవసాయ సేవను సంప్రదించండి.',
  ],
};

const createTreatment = ({ crop, diseaseOrPest, symptoms, diagnosisNote }) => ({
  crop,
  diseaseOrPest,
  symptoms,
  ...commonEnglish,
  translations: {
    english: { symptoms, ...commonEnglish },
    hindi: { symptoms: [`${diagnosisNote} के लक्षणों की स्थानीय विशेषज्ञ से पुष्टि करें।`], ...commonHindi },
    telugu: { symptoms: [`${diagnosisNote} లక్షణాలను స్థానిక నిపుణుడితో నిర్ధారించండి.`], ...commonTelugu },
  },
});

module.exports = [
  createTreatment({
    crop: 'Tomato',
    diseaseOrPest: 'Early Blight',
    diagnosisNote: 'अर्ली ब्लाइट',
    symptoms: ['Brown spots on older leaves', 'Yellowing around leaf lesions', 'Lesions may enlarge over time'],
  }),
  createTreatment({
    crop: 'Rice',
    diseaseOrPest: 'Bacterial Leaf Blight',
    diagnosisNote: 'बैक्टीरियल लीफ ब्लाइट',
    symptoms: ['Water-soaked leaf edges', 'Leaves drying from the tip', 'Lesions may extend along the leaf'],
  }),
  createTreatment({
    crop: 'Potato',
    diseaseOrPest: 'Early Blight',
    diagnosisNote: 'अर्ली ब्लाइट',
    symptoms: ['Concentric brown leaf spots', 'Lower leaves affected first', 'Premature leaf drop may occur'],
  }),
  createTreatment({
    crop: 'Potato',
    diseaseOrPest: 'Late Blight',
    diagnosisNote: 'लेट ब्लाइट',
    symptoms: ['Dark water-soaked lesions', 'Rapid browning in cool wet conditions', 'Affected tissue may collapse'],
  }),
  createTreatment({
    crop: 'Cotton',
    diseaseOrPest: 'Aphid',
    diagnosisNote: 'एफिड',
    symptoms: ['Clusters of small insects', 'Curled or yellowing leaves', 'Sticky residue may appear on leaves'],
  }),
  createTreatment({
    crop: 'Chilli',
    diseaseOrPest: 'Leaf Curl',
    diagnosisNote: 'लीफ कर्ल',
    symptoms: ['Upward curling leaves', 'Stunted plant growth', 'New leaves may be smaller than usual'],
  }),
];
