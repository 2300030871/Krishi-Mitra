const path = require('path');
const { io } = require(path.resolve(process.cwd(), 'frontend/node_modules/socket.io-client'));

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:5000';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const postJson = async (url, payload, token) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
};

const main = async () => {
  const unique = Date.now();

  const farmerEmail = `farmer.${unique}@agrimandi.test`;
  const buyerEmail = `buyer.${unique}@agrimandi.test`;
  const password = 'Test@12345';

  const farmerReg = await postJson(`${API_BASE}/auth/register`, {
    name: 'Farmer Smoke',
    email: farmerEmail,
    password,
    role: 'farmer',
  });

  if (!farmerReg.ok) {
    throw new Error(`Farmer registration failed: ${JSON.stringify(farmerReg.data)}`);
  }

  const buyerReg = await postJson(`${API_BASE}/auth/register`, {
    name: 'Buyer Smoke',
    email: buyerEmail,
    password,
    role: 'buyer',
  });

  if (!buyerReg.ok) {
    throw new Error(`Buyer registration failed: ${JSON.stringify(buyerReg.data)}`);
  }

  const farmerToken = farmerReg.data.token;
  const buyerToken = buyerReg.data.token;
  const farmerId = farmerReg.data.user.id;
  const buyerId = buyerReg.data.user.id;

  const events = {
    farmerReceived: null,
    buyerReceived: null,
    onlineSnapshots: [],
  };

  const connectUserSocket = (userId, key) => {
    return new Promise((resolve, reject) => {
      const socket = io(SOCKET_URL, {
        transports: ['websocket'],
        timeout: 8000,
      });

      const connectTimeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error(`${key} socket connection timed out`));
      }, 9000);

      socket.on('connect', () => {
        clearTimeout(connectTimeout);
        socket.emit('user:online', userId);
        resolve(socket);
      });

      socket.on('connect_error', (error) => {
        clearTimeout(connectTimeout);
        reject(error);
      });

      socket.on('users:online', (list) => {
        events.onlineSnapshots.push({ key, list });
      });

      socket.on('message:new', (message) => {
        const isVoice = message?.messageType === 'voice' || Boolean(message?.originalAudioUrl);
        if (!isVoice) return;

        if (key === 'farmer' && !events.farmerReceived) {
          events.farmerReceived = {
            id: message?._id,
            messageType: message?.messageType,
            originalAudioUrl: message?.originalAudioUrl,
            translatedAudioUrl: message?.translatedAudioUrl,
            createdAt: message?.createdAt,
          };
        }

        if (key === 'buyer' && !events.buyerReceived) {
          events.buyerReceived = {
            id: message?._id,
            messageType: message?.messageType,
            originalAudioUrl: message?.originalAudioUrl,
            translatedAudioUrl: message?.translatedAudioUrl,
            createdAt: message?.createdAt,
          };
        }
      });
    });
  };

  const farmerSocket = await connectUserSocket(farmerId, 'farmer');
  const buyerSocket = await connectUserSocket(buyerId, 'buyer');

  await sleep(600);

  const audioBytes = new Uint8Array(Array.from({ length: 1024 }, (_, i) => i % 255));
  const blob = new Blob([audioBytes], { type: 'audio/webm' });
  const formData = new FormData();
  formData.append('receiverId', buyerId);
  formData.append('voice', blob, `voice-${unique}.webm`);

  const voiceResponse = await fetch(`${API_BASE}/messages/voice`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${farmerToken}`,
    },
    body: formData,
  });

  const voiceData = await voiceResponse.json().catch(() => ({}));

  await sleep(1600);

  const convoResponse = await fetch(`${API_BASE}/messages/${farmerId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${buyerToken}`,
    },
  });
  const conversation = await convoResponse.json().catch(() => []);
  const latestVoice = Array.isArray(conversation)
    ? [...conversation].reverse().find((item) => item?.messageType === 'voice' || item?.originalAudioUrl)
    : null;

  farmerSocket.disconnect();
  buyerSocket.disconnect();

  const summary = {
    apiStatus: voiceResponse.status,
    apiMessageType: voiceData?.messageType,
    apiOriginalAudioUrl: voiceData?.originalAudioUrl,
    apiTranslatedAudioUrl: voiceData?.translatedAudioUrl,
    farmerRealtimeReceived: Boolean(events.farmerReceived),
    buyerRealtimeReceived: Boolean(events.buyerReceived),
    farmerRealtimePayload: events.farmerReceived,
    buyerRealtimePayload: events.buyerReceived,
    storedConversationVoice: latestVoice
      ? {
          id: latestVoice._id,
          messageType: latestVoice.messageType,
          originalAudioUrl: latestVoice.originalAudioUrl,
          translatedAudioUrl: latestVoice.translatedAudioUrl,
          createdAt: latestVoice.createdAt,
        }
      : null,
  };

  console.log(JSON.stringify(summary, null, 2));

  const pass =
    voiceResponse.ok &&
    summary.apiMessageType === 'voice' &&
    Boolean(summary.apiOriginalAudioUrl) &&
    summary.farmerRealtimeReceived &&
    summary.buyerRealtimeReceived &&
    Boolean(summary.storedConversationVoice?.originalAudioUrl);

  if (!pass) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error('Smoke test failed:', error.message || error);
  process.exit(1);
});
