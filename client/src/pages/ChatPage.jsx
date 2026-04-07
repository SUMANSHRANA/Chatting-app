import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { fetchChats, accessChat } from "../api";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";

export default function ChatPage() {
  const { user, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [notification, setNotification] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  const loadChats = useCallback(async () => {
    try {
      const { data } = await fetchChats();
      setChats(data);
    } catch (err) {
      console.error("Failed to load chats", err);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Listen for incoming messages (for notification + chat list update)
  useEffect(() => {
    if (!socket) return;

    socket.on("message-received", (msg) => {
      // Show notification if not in that chat
      if (!selectedChat || selectedChat._id !== msg.chat._id) {
        setNotification(msg);
        setTimeout(() => setNotification(null), 4000);
      }
      // Refresh chat list for latest message preview
      loadChats();
    });

    return () => socket.off("message-received");
  }, [socket, selectedChat, loadChats]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setMobileOpen(true);
  };

  const handleNewChat = async (userId) => {
    try {
      const { data } = await accessChat(userId);
      setSelectedChat(data);
      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }
      setMobileOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="chat-layout">
      {/* Notification Toast */}
      {notification && (
        <div className="notification">
          <div className="notif-sender">
            💬 {notification.sender?.name}
          </div>
          <div className="notif-msg">
            {notification.content || "Sent a file"}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <ChatList
        chats={chats}
        selectedChat={selectedChat}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onlineUsers={onlineUsers}
        user={user}
        onLogout={logout}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(!darkMode)}
        loadChats={loadChats}
      />

      {/* Main chat area */}
      <div className={`chat-main ${mobileOpen ? "mobile-open" : ""}`}>
        {selectedChat ? (
          <ChatBox
            chat={selectedChat}
            user={user}
            onlineUsers={onlineUsers}
            onBack={() => setMobileOpen(false)}
            onChatUpdate={loadChats}
          />
        ) : (
          <div className="empty-state">
            <div className="icon">💬</div>
            <h3>ChatApp</h3>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
