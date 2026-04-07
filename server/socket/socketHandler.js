const socketHandler = (io) => {
  // Track online users: userId -> socketId
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User comes online
    socket.on("user-online", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;

      // Broadcast online status to all
      io.emit("online-users", Array.from(onlineUsers.keys()));
      console.log(`User online: ${userId}`);
    });

    // Join a chat room
    socket.on("join-chat", (chatId) => {
      socket.join(chatId);
      console.log(`User joined room: ${chatId}`);
    });

    // Leave a chat room
    socket.on("leave-chat", (chatId) => {
      socket.leave(chatId);
      console.log(`User left room: ${chatId}`);
    });

    // New message received
    socket.on("new-message", (message) => {
      const chat = message.chat;
      if (!chat || !chat.users) return;

      // Send to all users in chat EXCEPT the sender
      chat.users.forEach((user) => {
        if (user._id === message.sender._id) return;
        socket.to(onlineUsers.get(user._id)).emit("message-received", message);
      });
    });

    // Typing indicator
    socket.on("typing", ({ chatId, userId, userName }) => {
      socket.to(chatId).emit("typing", { userId, userName });
    });

    socket.on("stop-typing", ({ chatId, userId }) => {
      socket.to(chatId).emit("stop-typing", { userId });
    });

    // Read receipts
    socket.on("message-read", ({ chatId, userId }) => {
      socket.to(chatId).emit("message-read", { chatId, userId });
    });

    // Message deleted
    socket.on("message-deleted", ({ messageId, chatId }) => {
      socket.to(chatId).emit("message-deleted", { messageId });
    });

    // Message edited
    socket.on("message-edited", ({ message, chatId }) => {
      socket.to(chatId).emit("message-edited", { message });
    });

    // User goes offline
    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit("online-users", Array.from(onlineUsers.keys()));
        console.log(`User offline: ${socket.userId}`);
      }
    });
  });
};

module.exports = socketHandler;
