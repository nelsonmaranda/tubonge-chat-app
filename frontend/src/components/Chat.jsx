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
    // Initialize socket
    socketRef.current = initializeSocket(user.token);

    // Load previous messages
    messageAPI.getMessages()
      .then(response => {
        setMessages(response.data || []);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading messages:', error);
        setMessages([]);
        setLoading(false);
      });

    // Wait for socket connection before setting up listeners
    const setupSocketListeners = () => {
      if (!socketRef.current) return;

      // Socket event listeners
      socketRef.current.on('newMessage', (message) => {
        setMessages(prev => [...prev, message]);
      });

      socketRef.current.on('activeUsers', (users) => {
        setActiveUsers(users || []);
      });

      socketRef.current.on('userTyping', ({ username }) => {
        setTypingUser(username);
        setTimeout(() => setTypingUser(null), 3000);
      });

      socketRef.current.on('userStopTyping', () => {
        setTypingUser(null);
      });

      socketRef.current.on('error', (error) => {
        console.error('Socket error:', error);
      });
    };

    // Setup listeners when connected
    if (socketRef.current.connected) {
      setupSocketListeners();
    } else {
      socketRef.current.on('connect', () => {
        setupSocketListeners();
      });
    }

    return () => {
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

