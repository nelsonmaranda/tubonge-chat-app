require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const { verifySocketToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Socket.io configuration
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const io = socketIo(server, {
  cors: {
    origin: frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Authorization']
  },
  transports: ['polling', 'websocket'], // Prefer polling for Render compatibility
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware - CORS must be before other middleware
app.use(cors({
  origin: frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type']
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Allow Socket.io
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    frontendUrl: frontendUrl,
    socketIoEnabled: true
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Socket.io connection handling
const Message = require('./models/Message');

io.use(verifySocketToken);

const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.user.username}`);
  
  activeUsers.set(socket.user.id, {
    username: socket.user.username,
    socketId: socket.id
  });

  // Broadcast active users
  io.emit('activeUsers', Array.from(activeUsers.values()));

  // Join user to their room
  socket.join(socket.user.id);

  // Handle new message
  socket.on('sendMessage', async (data) => {
    try {
      const message = new Message({
        sender: socket.user.id,
        content: data.content,
        timestamp: new Date()
      });
      
      await message.save();
      
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username');
      
      io.emit('newMessage', populatedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', () => {
    socket.broadcast.emit('userTyping', { username: socket.user.username });
  });

  socket.on('stopTyping', () => {
    socket.broadcast.emit('userStopTyping', { username: socket.user.username });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.user.username}`);
    activeUsers.delete(socket.user.id);
    io.emit('activeUsers', Array.from(activeUsers.values()));
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});

