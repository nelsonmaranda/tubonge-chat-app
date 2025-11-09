import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initializeSocket = (token) => {
  // Always create a new connection to ensure fresh state
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  console.log('🔌 Initializing Socket.io connection to:', SOCKET_URL);

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    timeout: 20000,
    forceNew: true,
    path: '/socket.io/'
  });

  socket.on('connect', () => {
    console.log('✅ Socket.io connected successfully');
    console.log('Socket ID:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.io disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket.io connection error:', error.message);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket.io error:', error);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

