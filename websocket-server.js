import { Server } from 'socket.io';
import { createServer } from 'http';

const port = 3002;

// Create HTTP server for Socket.io
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store active users and their info
const activeUsers = new Map();
const userColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Generate random user name and color
  const userName = `User${Math.floor(Math.random() * 1000)}`;
  const userColor = userColors[Math.floor(Math.random() * userColors.length)];

  const user = {
    id: socket.id,
    name: userName,
    color: userColor,
    lastSeen: new Date()
  };

  activeUsers.set(socket.id, user);

  // Send user info back to client
  socket.emit('user-info', user);

  // Handle joining a todo list room
  socket.on('join-list', (listId) => {
    socket.join(`list-${listId}`);
    console.log(`${userName} joined list ${listId}`);

    // Broadcast to others in the room that a new user joined
    socket.to(`list-${listId}`).emit('user-joined', {
      user,
      listId
    });

    // Send current active users in this list to the new user
    const roomUsers = Array.from(activeUsers.values()).filter(u => u.id !== socket.id);
    socket.emit('active-users', roomUsers);
  });

  // Handle leaving a todo list room
  socket.on('leave-list', (listId) => {
    socket.leave(`list-${listId}`);
    console.log(`${userName} left list ${listId}`);

    // Broadcast to others in the room that user left
    socket.to(`list-${listId}`).emit('user-left', {
      userId: socket.id,
      listId
    });
  });

  // Handle todo updates
  socket.on('todo-update', (update) => {
    console.log(`Todo update from ${userName}:`, update);

    // Broadcast the update to all other users in the same list
    socket.to(`list-${update.listId}`).emit('todo-updated', {
      ...update,
      userId: socket.id,
      userName
    });
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    console.log(`${userName} typing status:`, data.isTyping);

    // Broadcast typing status to others in the room
    socket.to(`list-${data.listId}`).emit('user-typing', {
      ...data,
      userId: socket.id,
      userName
    });
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    activeUsers.delete(socket.id);

    // Broadcast to all rooms that user disconnected
    socket.broadcast.emit('user-disconnected', {
      userId: socket.id
    });
  });

  // Handle heartbeat to update last seen
  socket.on('heartbeat', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      user.lastSeen = new Date();
      activeUsers.set(socket.id, user);
    }
  });
});

httpServer.listen(port, () => {
  console.log(`> WebSocket server ready on http://localhost:${port}`);
});
