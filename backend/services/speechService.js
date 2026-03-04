const fs = require('fs');
const path = require('path');
const { toLanguageCode } = require('../utils/language');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const translatedVoiceDir = path.join(uploadsDir, 'voice-translated');

if (!fs.existsSync(translatedVoiceDir)) {
  fs.mkdirSync(translatedVoiceDir, { recursive: true });
}

const transcribeAudio = async ({ filePath, language }) => {
  if (!filePath || !OPENAI_API_KEY) {
    return { text: '', fallback: true };
  }

  try {
    const buffer = fs.readFileSync(filePath);
    const blob = new Blob([buffer], { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('model', process.env.OPENAI_STT_MODEL || 'gpt-4o-mini-transcribe');
    formData.append('file', blob, path.basename(filePath));
    formData.append('language', toLanguageCode(language));

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Transcription failed: ${message}`);
    }

    const data = await response.json();
    return { text: String(data?.text || '').trim() };
  } catch (error) {
    return { text: '', fallback: true, error: error.message };
  }
};

const synthesizeSpeech = async ({ text, language, prefix = 'tts' }) => {
  const safeText = String(text || '').trim();
  if (!safeText) return { audioUrl: '' };

  if (!OPENAI_API_KEY) {
    return { audioUrl: '', fallback: true };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
        voice: process.env.OPENAI_TTS_VOICE || 'alloy',
        input: safeText,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`TTS failed: ${message}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const fileName = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e8)}-${toLanguageCode(language)}.mp3`;
    const outputPath = path.join(translatedVoiceDir, fileName);
    fs.writeFileSync(outputPath, audioBuffer);

    return {
      audioUrl: `/uploads/voice-translated/${fileName}`,
    };
  } catch (error) {
    return { audioUrl: '', fallback: true, error: error.message };
  }
};

module.exports = {
  transcribeAudio,
  synthesizeSpeech,
};
