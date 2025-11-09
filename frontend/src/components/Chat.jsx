import { useState, useEffect, useRef } from 'react';
import { initializeSocket, disconnectSocket } from '../utils/socket';
import { messageAPI } from '../utils/api';

function Chat({ user, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    console.log('🔌 Setting up Socket.io connection...');
    
    // Initialize socket
    socketRef.current = initializeSocket(user.token);

    // Load previous messages
    messageAPI.getMessages()
      .then(response => {
        console.log('📨 Loaded messages:', response.data?.length || 0);
        setMessages(response.data || []);
        setLoading(false);
      })
      .catch(error => {
        console.error('❌ Error loading messages:', error);
        setMessages([]);
        setLoading(false);
      });

    // Setup socket event listeners
    const setupSocketListeners = () => {
      if (!socketRef.current) {
        console.warn('⚠️ Socket not available for listener setup');
        return;
      }

      console.log('🎧 Setting up Socket.io listeners...');

      // Active users listener
      socketRef.current.on('activeUsers', (users) => {
        console.log('👥 Active users received:', users);
        setActiveUsers(users || []);
      });

      // New message listener
      socketRef.current.on('newMessage', (message) => {
        console.log('💬 New message received:', message);
        setMessages(prev => [...prev, message]);
      });

      // Typing indicators
      socketRef.current.on('userTyping', ({ username }) => {
        console.log('⌨️ User typing:', username);
        setTypingUser(username);
        setTimeout(() => setTypingUser(null), 3000);
      });

      socketRef.current.on('userStopTyping', () => {
        setTypingUser(null);
      });

      // Error handling
      socketRef.current.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });
    };

    // Setup listeners immediately and also on connect
    setupSocketListeners();
    
    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected, setting up listeners...');
      setupSocketListeners();
    });

    return () => {
      console.log('🧹 Cleaning up Socket.io connection...');
      if (socketRef.current) {
        socketRef.current.off('newMessage');
        socketRef.current.off('activeUsers');
        socketRef.current.off('userTyping');
        socketRef.current.off('userStopTyping');
        socketRef.current.off('error');
        socketRef.current.off('connect');
      }
      disconnectSocket();
    };
  }, [user.token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socketRef.current.emit('sendMessage', { content: newMessage });
    setNewMessage('');
    socketRef.current.emit('stopTyping');
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!typingTimeoutRef.current) {
      socketRef.current.emit('typing');
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stopTyping');
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="loading">Loading messages...</div>
      </div>
    );
  }

  // Filter out current user from active users list
  const otherUsers = activeUsers.filter(u => u.id !== user._id && u.username !== user.username);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>💬 Tubonge</h2>
        <div className="header-info">
          <div className="active-users">
            <span className="online-indicator"></span>
            <span>{activeUsers.length} online</span>
          </div>
          <span>Welcome, {user.username}!</span>
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="chat-body">
        <div className="users-sidebar">
          <div className="users-header">
            <h3>👥 Online Users</h3>
            <span className="users-count">{activeUsers.length}</span>
          </div>
          <div className="users-list">
            {activeUsers.length === 0 ? (
              <div className="no-users">No other users online</div>
            ) : (
              activeUsers.map((activeUser) => (
                <div
                  key={activeUser.id || activeUser.username}
                  className={`user-item ${activeUser.id === user._id || activeUser.username === user.username ? 'current-user' : ''}`}
                >
                  <span className="user-indicator"></span>
                  <span className="user-name">
                    {activeUser.username}
                    {activeUser.id === user._id || activeUser.username === user.username ? ' (You)' : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={message._id || index}
            className={`message ${message.sender._id === user._id ? 'own' : ''}`}
          >
            <div className="message-sender">{message.sender.username}</div>
            <div className="message-content">{message.content}</div>
            <div className="message-time">{formatTime(message.timestamp)}</div>
          </div>
        ))}
        {typingUser && (
          <div className="typing-indicator">{typingUser} is typing...</div>
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="message-input-container">
        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="message-input"
            placeholder="Type your message..."
            value={newMessage}
            onChange={handleTyping}
            maxLength="1000"
          />
          <button type="submit" className="send-button" disabled={!newMessage.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;

