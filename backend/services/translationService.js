const { toCanonicalLanguage, toLanguageCode } = require('../utils/language');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const translateWithOpenAI = async ({ text, sourceLanguage, targetLanguage }) => {
  const sourceCode = toLanguageCode(sourceLanguage);
  const targetCode = toLanguageCode(targetLanguage);

  if (sourceCode === targetCode) {
    return {
      translatedText: text,
      didTranslate: false,
      sourceLanguage: toCanonicalLanguage(sourceLanguage),
      targetLanguage: toCanonicalLanguage(targetLanguage),
    };
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TRANSLATION_MODEL || 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'You are a translation engine. Return only translated text with no explanation, no quotes, no markdown.',
        },
        {
          role: 'user',
          content: `Translate from ${toCanonicalLanguage(sourceLanguage)} to ${toCanonicalLanguage(
            targetLanguage
          )}:\n${text}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Translation failed: ${message}`);
  }

  const data = await response.json();
  const translated = data?.choices?.[0]?.message?.content?.trim();

  if (!translated) {
    throw new Error('Translation returned empty text.');
  }

  return {
    translatedText: translated,
    didTranslate: true,
    sourceLanguage: toCanonicalLanguage(sourceLanguage),
    targetLanguage: toCanonicalLanguage(targetLanguage),
  };
};

const translateText = async ({ text, sourceLanguage, targetLanguage }) => {
  const safeText = String(text || '').trim();

  if (!safeText) {
    return {
      translatedText: '',
      didTranslate: false,
      sourceLanguage: toCanonicalLanguage(sourceLanguage),
      targetLanguage: toCanonicalLanguage(targetLanguage),
    };
  }

  const sourceCode = toLanguageCode(sourceLanguage);
  const targetCode = toLanguageCode(targetLanguage);

  if (sourceCode === targetCode) {
    return {
      translatedText: safeText,
      didTranslate: false,
      sourceLanguage: toCanonicalLanguage(sourceLanguage),
      targetLanguage: toCanonicalLanguage(targetLanguage),
    };
  }

  if (!OPENAI_API_KEY) {
    return {
      translatedText: safeText,
      didTranslate: false,
      sourceLanguage: toCanonicalLanguage(sourceLanguage),
      targetLanguage: toCanonicalLanguage(targetLanguage),
      fallback: true,
    };
  }

  try {
    return await translateWithOpenAI({
      text: safeText,
      sourceLanguage,
      targetLanguage,
    });
  } catch (error) {
    return {
      translatedText: safeText,
      didTranslate: false,
      sourceLanguage: toCanonicalLanguage(sourceLanguage),
      targetLanguage: toCanonicalLanguage(targetLanguage),
      fallback: true,
      error: error.message,
    };
  }
};

module.exports = {
  translateText,
};
