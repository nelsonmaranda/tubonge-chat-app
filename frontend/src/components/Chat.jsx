import { useState, useEffect, useRef } from 'react';
import { initializeSocket, disconnectSocket } from '../utils/socket';
import { messageAPI } from '../utils/api';

function Chat({ user, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
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

    // Setup socket event listeners (only once)
    const setupSocketListeners = () => {
      if (!socketRef.current) {
        console.warn('⚠️ Socket not available for listener setup');
        return;
      }

      // Remove existing listeners first to prevent duplicates
      socketRef.current.off('activeUsers');
      socketRef.current.off('newMessage');
      socketRef.current.off('userTyping');
      socketRef.current.off('userStopTyping');
      socketRef.current.off('error');

      console.log('🎧 Setting up Socket.io listeners...');

      // Active users listener
      socketRef.current.on('activeUsers', (users) => {
        console.log('👥 Active users received:', users);
        setActiveUsers(users || []);
      });

      // New message listener - prevent duplicates by checking message ID
      socketRef.current.on('newMessage', (message) => {
        console.log('💬 New message received:', message);
        console.log('💬 Message content:', message.content);
        console.log('💬 Message sender:', message.sender);
        
        if (!message || !message._id) {
          console.warn('⚠️ Invalid message received:', message);
          return;
        }
        
        // Ensure message has required fields
        if (!message.content) {
          console.warn('⚠️ Message missing content:', message);
          return;
        }
        
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(msg => msg._id === message._id);
          if (exists) {
            console.log('⚠️ Duplicate message ignored:', message._id);
            return prev;
          }
          console.log('✅ Adding message to state:', message);
          return [...prev, message];
        });
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

    // Setup listeners when socket connects
    if (socketRef.current.connected) {
      setupSocketListeners();
    } else {
      socketRef.current.once('connect', () => {
        console.log('✅ Socket connected, setting up listeners...');
        setupSocketListeners();
      });
    }

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
    if (!newMessage.trim() || !socketRef.current) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    socketRef.current.emit('stopTyping');
    
    // Send message via socket - don't add to state here, wait for server response
    socketRef.current.emit('sendMessage', { content: messageContent });
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

  const handleUserClick = (clickedUser) => {
    // Don't allow selecting yourself
    if (clickedUser.id === user._id || clickedUser.username === user.username) {
      return;
    }
    setSelectedUser(clickedUser);
    console.log('💬 Selected user for chat:', clickedUser.username);
  };

  const handleBackToAll = () => {
    setSelectedUser(null);
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
              activeUsers.map((activeUser) => {
                const isCurrentUser = activeUser.id === user._id || activeUser.username === user.username;
                const isSelected = selectedUser && (selectedUser.id === activeUser.id || selectedUser.username === activeUser.username);
                
                return (
                  <div
                    key={activeUser.id || activeUser.username}
                    className={`user-item ${isCurrentUser ? 'current-user' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => !isCurrentUser && handleUserClick(activeUser)}
                    style={{ cursor: isCurrentUser ? 'default' : 'pointer' }}
                  >
                    <span className="user-indicator"></span>
                    <span className="user-name">
                      {activeUser.username}
                      {isCurrentUser ? ' (You)' : ''}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="messages-container">
          {selectedUser && (
            <div className="chat-with-header">
              <button className="back-button" onClick={handleBackToAll}>← Back</button>
              <span className="chatting-with">Chatting with: <strong>{selectedUser.username}</strong></span>
            </div>
          )}
        {messages.map((message, index) => {
          // Safely access message properties
          const senderId = message.sender?._id || (typeof message.sender === 'string' ? message.sender : null);
          const senderUsername = message.sender?.username || 'Unknown';
          
          // Extract content - handle different message structures
          let messageContent = '';
          if (message.content !== undefined && message.content !== null) {
            messageContent = String(message.content).trim();
          } else if (message.text !== undefined && message.text !== null) {
            messageContent = String(message.text).trim();
          } else if (message.message !== undefined && message.message !== null) {
            messageContent = String(message.message).trim();
          }
          
          const isOwnMessage = senderId === user._id;
          
          // Debug logging for empty messages
          if (!messageContent && message._id) {
            console.warn('⚠️ Empty message content detected:', {
              messageId: message._id,
              fullMessage: JSON.stringify(message, null, 2),
              sender: senderUsername,
              hasContent: !!message.content,
              contentValue: message.content,
              contentType: typeof message.content
            });
          }
          
          return (
            <div
              key={message._id || `msg-${index}`}
              className={`message ${isOwnMessage ? 'own' : ''}`}
            >
              <div className="message-sender">{senderUsername}</div>
              <div className="message-content">
                {messageContent || '(empty message)'}
              </div>
              <div className="message-time">{message.timestamp ? formatTime(message.timestamp) : ''}</div>
            </div>
          );
        })}
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

