import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import socket from '../socket';
import { getStoredUser } from '../auth';
import { emitToast } from '../toast';
import { getConversation, sendTextMessage, sendVoiceMessage } from '../services/messageService';
import { getChatUsers } from '../services/userService';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const languageBadge = (language) => {
  const key = String(language || '').toLowerCase();
  if (key === 'hindi' || key === 'hi') return 'HI';
  if (key === 'telugu' || key === 'te') return 'TE';
  return 'EN';
};

const resolveAssetUrl = (url) => {
  if (!url) return '';
  if (String(url).startsWith('http')) return url;
  return `${API_ORIGIN}${url}`;
};

const formatMessageTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function ChatPanel({ title, compact = false }) {
  const { t } = useTranslation();
  const currentUser = getStoredUser();

  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoPlayMessageId, setAutoPlayMessageId] = useState('');
  const [error, setError] = useState('');

  const selectedContactRef = useRef('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const selectedContact = useMemo(
    () => contacts.find((user) => user._id === selectedContactId),
    [contacts, selectedContactId]
  );

  const loadContacts = async () => {
    try {
      const users = await getChatUsers();
      setContacts(users);
      if (users.length > 0 && !selectedContactRef.current) {
        setSelectedContactId(users[0]._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load chat users.');
    }
  };

  const loadConversation = async (targetUserId) => {
    if (!targetUserId) {
      setMessages([]);
      return;
    }

    try {
      const data = await getConversation(targetUserId);
      setMessages(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages.');
    }
  };

  useEffect(() => {
    selectedContactRef.current = selectedContactId;
  }, [selectedContactId]);

  useEffect(() => {
    if (currentUser?.id) {
      socket.emit('user:online', currentUser.id);
    }

    loadContacts();

    const handleIncomingMessage = (message) => {
      const senderId = String(message?.senderId?._id || message?.senderId || message?.sender?._id || message?.sender || '');
      const receiverId = String(
        message?.receiverId?._id || message?.receiverId || message?.receiver?._id || message?.receiver || ''
      );
      const activeContact = selectedContactRef.current;
      const isRelated = activeContact && (senderId === activeContact || receiverId === activeContact);

      if (!isRelated) return;

      setMessages((prev) => {
        if (prev.some((item) => item._id === message._id)) return prev;
        return [...prev, message];
      });

      if (receiverId === String(currentUser?.id) && message?.translatedAudioUrl) {
        setAutoPlayMessageId(String(message._id));
      }
    };

    socket.on('users:online', setOnlineUsers);
    socket.on('message:new', handleIncomingMessage);

    return () => {
      socket.off('users:online', setOnlineUsers);
      socket.off('message:new', handleIncomingMessage);
    };
  }, []);

  useEffect(() => {
    loadConversation(selectedContactId);
  }, [selectedContactId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleSendText = async (event) => {
    event.preventDefault();
    if (!selectedContactId || !messageText.trim() || loading) return;

    setLoading(true);
    setIsTranslating(true);
    try {
      await sendTextMessage({ receiverId: selectedContactId, text: messageText });
      setMessageText('');
      await loadConversation(selectedContactId);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setLoading(false);
      setIsTranslating(false);
    }
  };

  const clearRecorderState = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
  };

  const startRecording = async () => {
    if (!selectedContactId || isRecording || loading) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Voice recording is not supported on this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      streamRef.current = stream;
      recorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordSeconds(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blobType = mediaRecorder.mimeType || 'audio/webm';
        const voiceBlob = new Blob(chunksRef.current, { type: blobType });
        const extension = blobType.includes('ogg') ? 'ogg' : blobType.includes('mp4') ? 'mp4' : 'webm';
        const fileName = `voice-${Date.now()}.${extension}`;

        clearRecorderState();

        if (!voiceBlob.size) {
          setIsRecording(false);
          setRecordSeconds(0);
          setError('Could not capture voice message. Please try again.');
          return;
        }

        setLoading(true);
        setIsTranslating(true);
        try {
          await sendVoiceMessage({ receiverId: selectedContactRef.current, voiceBlob, fileName });
          await loadConversation(selectedContactRef.current);
          emitToast('Voice message sent.', 'success');
          setError('');
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to send voice message.');
        } finally {
          setLoading(false);
          setIsTranslating(false);
          setIsRecording(false);
          setRecordSeconds(0);
        }
      };

      mediaRecorder.start();
    } catch (err) {
      setIsRecording(false);
      setRecordSeconds(0);
      setError('Microphone access denied or unavailable.');
      clearRecorderState();
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current || recorderRef.current.state !== 'recording') return;
    recorderRef.current.stop();
  };

  return (
    <div className={compact ? 'farmer-chat-layout compact' : 'farmer-chat-layout'}>
      <aside className="card farmer-chat-users">
        <h3>{t('selectChatUser')}</h3>
        <div className="farmer-contact-list">
          {contacts.map((user) => {
            const isOnline = onlineUsers.includes(user._id);
            return (
              <button
                key={user._id}
                className={selectedContactId === user._id ? 'farmer-contact active' : 'farmer-contact'}
                onClick={() => setSelectedContactId(user._id)}
              >
                <span>{user.name}</span>
                <small>{user.role}</small>
                <small>{isOnline ? 'Online' : 'Offline'}</small>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="card farmer-chat-panel">
        <h3>{selectedContact ? selectedContact.name : title || t('messages')}</h3>
        {error ? <p className="error-text">{error}</p> : null}

        <div className="farmer-message-list">
          {messages.map((message) => {
            const senderId = String(
              message?.senderId?._id || message?.senderId || message?.sender?._id || message?.sender || ''
            );
            const receiverId = String(
              message?.receiverId?._id || message?.receiverId || message?.receiver?._id || message?.receiver || ''
            );
            const mine = senderId === String(currentUser?.id);
            const type = message.messageType || (message.originalAudioUrl || message.voiceUrl ? 'voice' : 'text');
            const preferredText = message.translatedText || message.originalText || message.text;
            const originalText = message.originalText || message.text;
            const playbackUrl = message.translatedAudioUrl || message.originalAudioUrl || message.voiceUrl;

            return (
              <article key={message._id} className={mine ? 'farmer-message mine' : 'farmer-message'}>
                <div className="language-row">
                  <span className="lang-pill">{languageBadge(message.originalLanguage)}</span>
                  <span className="lang-arrow">→</span>
                  <span className="lang-pill">{languageBadge(message.targetLanguage)}</span>
                </div>

                {preferredText ? <p className="translated-text">{preferredText}</p> : null}
                {originalText && preferredText && originalText !== preferredText ? <small className="original-text">{originalText}</small> : null}

                {type === 'voice' || playbackUrl ? (
                  <div className="voice-bubble">
                    <span className="voice-badge">▶</span>
                    <audio
                      controls
                      src={resolveAssetUrl(playbackUrl)}
                      autoPlay={autoPlayMessageId === String(message._id) && receiverId === String(currentUser?.id)}
                    />
                  </div>
                ) : null}
                <small>{formatMessageTime(message.createdAt)}</small>
              </article>
            );
          })}
        </div>

        <form className="farmer-chat-controls" onSubmit={handleSendText}>
          <input
            placeholder={t('typeMessage')}
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            disabled={!selectedContactId || loading || isRecording}
          />
          <button type="submit" disabled={!selectedContactId || loading || isRecording}>
            {t('send')}
          </button>
        </form>

        {isTranslating ? (
          <div className="translating-loader">
            <span className="record-dot" />
            <span>Translating...</span>
          </div>
        ) : null}

        <div className="recording-row">
          <button
            type="button"
            className={isRecording ? 'btn-danger mic-btn' : 'btn-ghost mic-btn'}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!selectedContactId || loading}
            title={isRecording ? t('stopRecording') : t('startRecording')}
          >
            {isRecording ? t('stopRecording') : t('startRecording')}
          </button>

          {isRecording ? (
            <div className="recording-indicator">
              <span className="record-dot" />
              <span>{t('recording')}</span>
              <strong>{formatDuration(recordSeconds)}</strong>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
