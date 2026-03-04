const languageMap = {
  english: 'en',
  hindi: 'hi',
  telugu: 'te',
  en: 'en',
  hi: 'hi',
  te: 'te',
};

const canonicalMap = {
  en: 'english',
  hi: 'hindi',
  te: 'telugu',
};

const normalizeLanguageKey = (value) => {
  const key = String(value || '').trim().toLowerCase();
  return languageMap[key] || null;
};

const toCanonicalLanguage = (value, fallback = 'english') => {
  const key = normalizeLanguageKey(value);
  return key ? canonicalMap[key] : fallback;
};

const toLanguageCode = (value) => {
  return normalizeLanguageKey(value) || 'en';
};

const languageBadge = (value) => {
  const code = toLanguageCode(value);
  if (code === 'hi') return 'HI';
  if (code === 'te') return 'TE';
  return 'EN';
};

module.exports = {
  toCanonicalLanguage,
  toLanguageCode,
  languageBadge,
};
