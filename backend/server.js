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
// Remove trailing slash if present
const cleanFrontendUrl = frontendUrl.replace(/\/$/, '');

console.log('🔧 Configuring Socket.io with frontend URL:', cleanFrontendUrl);

const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests from frontend URL or any origin in development
      if (!origin || origin === cleanFrontendUrl || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type']
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  path: '/socket.io/',
  serveClient: false
});

// Middleware - CORS must be before other middleware
app.use(cors({
  origin: cleanFrontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Explicit OPTIONS handler for all Socket.io paths
app.options('*', (req, res, next) => {
  if (req.path.startsWith('/socket.io/')) {
    res.header('Access-Control-Allow-Origin', cleanFrontendUrl);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.sendStatus(204);
  }
  next();
});

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
  .then(() => {
    console.log('✅ MongoDB Connected');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    console.error('❌ MONGODB_URI:', process.env.MONGODB_URI ? 'Set (hidden)' : 'NOT SET');
    process.exit(1);
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    frontendUrl: cleanFrontendUrl,
    socketIoEnabled: true,
    activeUsers: activeUsers.size,
    corsOrigin: cleanFrontendUrl
  });
});

// Socket.io connection test endpoint (for debugging)
app.get('/socket-test', (req, res) => {
  res.status(200).json({
    message: 'Socket.io endpoint should be available at /socket.io/',
    frontendUrl: cleanFrontendUrl,
    corsConfigured: true
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Socket.io connection handling
const Message = require('./models/Message');

// Active users tracking (must be defined before health check)
const activeUsers = new Map();

// Socket.io authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.user.username} (ID: ${socket.user.id})`);
  
  activeUsers.set(socket.user.id, {
    id: socket.user.id,
    username: socket.user.username,
    socketId: socket.id
  });

  // Immediately send active users to the newly connected user
  socket.emit('activeUsers', Array.from(activeUsers.values()));
  
  // Broadcast to all other users
  socket.broadcast.emit('activeUsers', Array.from(activeUsers.values()));

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

// Verify critical environment variables
console.log('🔍 Environment Check:');
console.log(`  - PORT: ${PORT}`);
console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`  - FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}`);
console.log(`  - MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'NOT SET'}`);
console.log(`  - JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'NOT SET'}`);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${cleanFrontendUrl}`);
  console.log(`🔌 Socket.io enabled on path: /socket.io/`);
  console.log(`✅ CORS configured for: ${cleanFrontendUrl}`);
  console.log(`📡 Socket.io server initialized: ${io ? 'Yes' : 'No'}`);
  console.log(`🔗 Server listening on: http://0.0.0.0:${PORT}`);
  console.log(`✅ Health check available at: /health`);
  console.log(`✅ Socket.io available at: /socket.io/`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server Error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

