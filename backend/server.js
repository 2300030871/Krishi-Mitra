const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('./config/db');
const cropRoutes = require('./routes/cropRoutes');
const cropV2Routes = require('./routes/cropV2Routes');
const contentRoutes = require('./routes/contentRoutes');
const authRoutes = require('./routes/authRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const adminRoutes = require('./routes/adminRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const { initializeSocketHandlers } = require('./socket');

const app = express();
const server = http.createServer(app);
const allowedOrigins = String(process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

const onlineUsers = new Set();
app.locals.onlineUsers = onlineUsers;

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running.' });
});

app.use('/api', cropRoutes);
app.use('/api', cropV2Routes);
app.use('/api', contentRoutes);
app.use('/api', authRoutes);
app.use('/api', weatherRoutes);
app.use('/api', adminRoutes);
app.use('/api', messageRoutes);
app.use('/api', userRoutes);

app.use((error, req, res, next) => {
  if (error?.name === 'MulterError') {
    return res.status(400).json({ message: error.message || 'File upload failed.' });
  }

  if (error?.message === 'Only image files are allowed.' || error?.message === 'Only audio files are allowed.') {
    return res.status(400).json({ message: error.message });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid resource id.' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error.' });
});

initializeSocketHandlers(io, onlineUsers);

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start backend server:', error.message);
    process.exit(1);
  }
})();
