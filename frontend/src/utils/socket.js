import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }
  
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('✅ Socket.io connected');
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket.io disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.io connection error:', error);
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

