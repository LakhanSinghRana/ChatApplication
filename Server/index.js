const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: [
            "https://chatapplication-1-an8x.onrender.com"
        ],
        methods: ["GET", "POST"]
    }
});
const path = require('path');

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// Store active users and their join times
const activeUsers = new Map();
// Store messages with timestamps and user information
const messages = [];

// Function to get messages for a specific user
const getUserMessages = (username) => {
  return messages.filter(msg => msg.name === username);
};

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('new-user-joined', (name) => {
    // Store user's join time
    const joinTime = Date.now();
    activeUsers.set(socket.id, { name, joinTime });
    
    // Send user's previous messages
    const userMessages = getUserMessages(name);
    socket.emit('load-messages', userMessages);
    
    // Broadcast to all users that a new user joined
    socket.broadcast.emit('user-joined', name);
    
    // Send list of active users to everyone
    const userList = Array.from(activeUsers.values()).map(user => user.name);
    io.emit('userList', userList);
  });

  socket.on('send', (message) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const messageData = {
      name: user.name,
      message: message,
      timestamp: Date.now()
    };
    
    // Store the message
    messages.push(messageData);
    
    // Send to all connected users except the sender
    socket.broadcast.emit('receive', messageData);
  });

  socket.on('typing', (data) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    
    // Broadcast typing status to all other users
    socket.broadcast.emit('typing', { name: user.name });
  });

  socket.on('clear-history', (username) => {
    // Remove messages for the specific user
    messages = messages.filter(msg => msg.name !== username);
  });

  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      io.emit('left', user.name);
      activeUsers.delete(socket.id);
      
      // Update user list
      const userList = Array.from(activeUsers.values()).map(user => user.name);
      io.emit('userList', userList);
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
