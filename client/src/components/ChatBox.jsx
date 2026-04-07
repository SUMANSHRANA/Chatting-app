import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { getMessages, sendMessage, markAsRead, deleteMessage, editMessage } from "../api";
import MessageInput from "./MessageInput";

export default function ChatBox({ chat, user, onlineUsers, onBack, onChatUpdate }) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [editingMsg, setEditingMsg] = useState(null);
  const messagesEndRef = useRef(null);

  const getChatName = () => {
    if (chat.isGroupChat) return chat.chatName;
    return chat.users.find(u => u._id !== user._id)?.name || "Unknown";
  };
  const getOtherUser = () => chat.users.find(u => u._id !== user._id);
  const isOtherOnline = () => {
    if (chat.isGroupChat) return false;
    const other = getOtherUser();
    return other && onlineUsers.includes(other._id);
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMessages(chat._id);
      setMessages(data);
      scrollToBottom();
      await markAsRead(chat._id);
      socket?.emit("message-read", { chatId: chat._id, userId: user._id });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [chat._id, socket, user._id]);

  useEffect(() => {
    loadMessages();
    socket?.emit("join-chat", chat._id);
    return () => socket?.emit("leave-chat", chat._id);
  }, [chat._id, loadMessages, socket]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (!socket) return;
    socket.on("message-received", msg => {
      if (msg.chat._id === chat._id) {
        setMessages(prev => [...prev, msg]);
        markAsRead(chat._id);
        socket.emit("message-read", { chatId: chat._id, userId: user._id });
      }
    });
    socket.on("typing", ({ userId, userName }) => {
      if (userId !== user._id) setTypingUsers(prev => prev.includes(userName) ? prev : [...prev, userName]);
    });
    socket.on("stop-typing", ({ userId }) => {
      const u = chat.users.find(u => u._id === userId);
      if (u) setTypingUsers(prev => prev.filter(n => n !== u.name));
    });
    socket.on("message-read", ({ chatId }) => {
      if (chatId === chat._id) {
        setMessages(prev => prev.map(m => m.readBy.includes(user._id) ? m : { ...m, readBy: [...m.readBy, user._id] }));
      }
    });
    socket.on("message-deleted", ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, content: "This message was deleted" } : m));
    });
    socket.on("message-edited", ({ message }) => {
      setMessages(prev => prev.map(m => m._id === message._id ? message : m));
    });
    return () => {
      socket.off("message-received"); socket.off("typing"); socket.off("stop-typing");
      socket.off("message-read"); socket.off("message-deleted"); socket.off("message-edited");
    };
  }, [socket, chat, user._id]);

  const handleSend = async (content, file) => {
    try {
      const formData = new FormData();
      if (content) formData.append("content", content);
      formData.append("chatId", chat._id);
      if (file) formData.append("file", file);
      const { data } = await sendMessage(formData);
      setMessages(prev => [...prev, data]);
      socket?.emit("new-message", data);
      onChatUpdate();
    } catch (err) { console.error("Send failed", err); }
  };

  const handleDelete = async (msgId) => {
    try {
      await deleteMessage(msgId);
      socket?.emit("message-deleted", { messageId: msgId, chatId: chat._id });
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isDeleted: true, content: "This message was deleted" } : m));
    } catch (err) { console.error(err); }
  };

  const handleEdit = async (msgId, content) => {
    try {
      const { data } = await editMessage(msgId, content);
      socket?.emit("message-edited", { message: data, chatId: chat._id });
      setMessages(prev => prev.map(m => m._id === data._id ? data : m));
      setEditingMsg(null);
    } catch (err) { console.error(err); }
  };

  const formatTime = d => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDate = d => {
    const date = new Date(d), today = new Date(), yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yest.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg); return groups;
  }, {});

  // Only show double tick (✓✓) — single tick removed entirely
  const isRead = msg => {
    const others = chat.users.filter(u => u._id !== user._id);
    return others.every(u => msg.readBy?.includes(u._id));
  };

  const chatName = getChatName();
  const otherOnline = isOtherOnline();

  return (
    <>
      {/* Header */}
      <div className="chat-header">
        <button className="icon-btn" onClick={onBack} id="back-btn" style={{ display: "none" }}>←</button>
        <div className="avatar">
          <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: 15 }}>
            {chat.isGroupChat ? "👥" : chatName[0]?.toUpperCase()}
          </div>
          {otherOnline && <div className="online-dot" />}
        </div>
        <div className="chat-header-info">
          <h3>{chatName}</h3>
          <span>
            {chat.isGroupChat ? `${chat.users.length} members`
              : otherOnline ? "● Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {loading && <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 24, fontSize: 13 }}>Loading messages...</div>}

        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="date-divider"><span>{date}</span></div>
            {msgs.map(msg => {
              const isOwn = msg.sender._id === user._id;
              const read = isRead(msg);
              return (
                <div key={msg._id} className={`message-wrapper ${isOwn ? "outgoing" : "incoming"}`}>
                  {chat.isGroupChat && !isOwn && <div className="sender-name">{msg.sender.name}</div>}

                  <div className={`message-bubble ${msg.isDeleted ? "deleted" : ""}`}>
                    {msg.fileType === "image" && !msg.isDeleted && (
                      <img src={msg.fileUrl} alt="shared" className="message-image" onClick={() => window.open(msg.fileUrl)}/>
                    )}
                    {msg.fileType === "pdf" && !msg.isDeleted && (
                      <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="message-pdf">📄 View PDF</a>
                    )}
                    {msg.content && (
                      <span>
                        {msg.content}
                        {msg.isEdited && !msg.isDeleted && <span className="edited-tag">(edited)</span>}
                      </span>
                    )}
                    <div className="message-meta">
                      <span>{formatTime(msg.createdAt)}</span>
                      {/* Only show double tick when read — single tick removed */}
                      {isOwn && read && (
                        <span className="tick read">✓✓</span>
                      )}
                    </div>
                  </div>

                  {isOwn && !msg.isDeleted && (
                    <div className="msg-actions">
                      {msg.fileType === "none" && (
                        <button className="msg-action-btn" onClick={() => setEditingMsg(msg)}>✏️ Edit</button>
                      )}
                      <button className="msg-action-btn" onClick={() => handleDelete(msg._id)}>🗑️ Delete</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="typing-indicator">
        {typingUsers.length > 0 && `${typingUsers.join(", ")} ${typingUsers.length === 1 ? "is" : "are"} typing...`}
      </div>

      <MessageInput
        chat={chat} user={user} onSend={handleSend}
        editingMsg={editingMsg} onEditSubmit={handleEdit} onCancelEdit={() => setEditingMsg(null)}
      />
    </>
  );
}
