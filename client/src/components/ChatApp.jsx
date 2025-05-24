import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import '../styles/chat.css';

const ChatApp = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userList, setUserList] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(new Audio('/tone.m4a'));
  const socketRef = useRef();
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    socketRef.current = io('https://chatapplication-98i2.onrender.com');
    socketRef.current.emit('new-user-joined', user);

    socketRef.current.on('load-messages', (previousMessages) => {
      const formattedMessages = previousMessages.map(msg => ({
        text: `${msg.name}: ${msg.message}`,
        type: msg.name === user ? 'right' : 'left'
      }));
      setMessages(prev => [...formattedMessages, ...prev]);
    });

    socketRef.current.on('user-joined', (name) => {
      setMessages(prev => [...prev, { text: `${name} joined the chat`, type: 'notification' }]);
    });

    socketRef.current.on('receive', (data) => {
      if (data.name !== user) {
        setMessages(prev => [...prev, { text: `${data.name}: ${data.message}`, type: 'left' }]);
        audioRef.current.play();
      }
    });

    socketRef.current.on('left', (name) => {
      setMessages(prev => [...prev, { text: `${name} left the chat`, type: 'notification' }]);
    });

    socketRef.current.on('userList', (users) => {
      setUserList(users);
    });

    socketRef.current.on('typing', (data) => {
      if (data.name !== user) {
        setTypingUsers(prev => [...new Set([...prev, data.name])]);
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(name => name !== data.name));
        }, 3000);
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() === '') return;

    setMessages(prev => [...prev, { text: `You: ${message}`, type: 'right' }]);
    socketRef.current.emit('send', message);
    setMessage('');
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', { name: user });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  const clearHistory = () => {
    setMessages([]);
    socketRef.current.emit('clear-history', user);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="chat-container">
      <nav className="chat-nav">
        <div className="nav-left">
          <img src="/chat.png" alt="Chat Logo" className="logo" />
          <h1>Hi! Let's Get Chatting.</h1>
        </div>
        <div className="nav-right">
          <button onClick={clearHistory} className="clear-btn">
            Clear History
          </button>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </nav>

      <div className="chat-main">
        <div className="user-list">
          <h3>Active Users ({userList.length})</h3>
          <ul>
            {userList.map((name, index) => (
              <li key={index} className={name === user ? 'current-user' : ''}>
                {name} {name === user && '(You)'}
              </li>
            ))}
          </ul>
        </div>

        <div className="chat-area">
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                {msg.text}
              </div>
            ))}
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="send-container">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                className="message-input"
              />
              <button type="submit" className="send-btn">
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatApp; 
