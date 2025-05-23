import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() === '') {
      setError('Please enter a username');
      return;
    }
    login(username);
    navigate('/chat');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/chat.png" alt="Chat Logo" className="logo" />
        <h1>Welcome to Chat App</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="name-input"
            />
            {error && <div className="error-message">{error}</div>}
          </div>
          <button type="submit" className="login-btn">
            Start Chatting
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 