const initializeSocketHandlers = (io, onlineUsers) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('user:online', (userId) => {
      const normalizedUserId = String(userId || '').trim();
      if (!normalizedUserId) return;

      socket.data.userId = normalizedUserId;
      socket.join(`user:${normalizedUserId}`);
      onlineUsers.add(normalizedUserId);
      io.emit('users:online', Array.from(onlineUsers));
    });

    socket.on('disconnect', () => {
      const { userId } = socket.data || {};
      if (userId) {
        onlineUsers.delete(String(userId));
        io.emit('users:online', Array.from(onlineUsers));
      }

      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = {
  initializeSocketHandlers,
};
