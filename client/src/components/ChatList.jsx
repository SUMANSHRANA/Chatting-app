import { useState, useRef, useEffect } from "react";
import { searchUsers } from "../api";
import { format } from "../utils/dateUtils";

export default function ChatList({ chats, selectedChat, onSelectChat, onNewChat, onlineUsers, user, onLogout, darkMode, onToggleDark, loadChats }) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) { setSearchResults([]); setSearch(""); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = async val => {
    setSearch(val);
    if (!val.trim()) return setSearchResults([]);
    setSearching(true);
    try { const { data } = await searchUsers(val); setSearchResults(data); }
    catch (err) { console.error(err); }
    finally { setSearching(false); }
  };

  const getChatName = chat => chat.isGroupChat ? chat.chatName : (chat.users.find(u => u._id !== user._id)?.name || "Unknown");
  const getChatAvatar = chat => chat.isGroupChat ? null : chat.users.find(u => u._id !== user._id)?.avatar;
  const isOnline = chat => {
    if (chat.isGroupChat) return false;
    const other = chat.users.find(u => u._id !== user._id);
    return other && onlineUsers.includes(other._id);
  };
  const getPreview = chat => {
    if (!chat.latestMessage) return "No messages yet";
    const msg = chat.latestMessage;
    if (msg.isDeleted) return "🚫 Message deleted";
    if (msg.fileType !== "none") return msg.fileType === "image" ? "📷 Image" : "📄 PDF";
    return msg.content;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>💬 ChatApp</h2>
        <div className="header-actions">
          <button className="icon-btn" onClick={onToggleDark} title="Toggle theme">{darkMode ? "☀️" : "🌙"}</button>
          <button className="icon-btn" onClick={onLogout} title="Logout">🚪</button>
        </div>
      </div>

      <div className="search-box" ref={searchRef} style={{ position: "relative" }}>
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search or start new chat" value={search} onChange={e => handleSearch(e.target.value)}/>
        </div>
        {searchResults.length > 0 && (
          <div className="search-results">
            {searching && <div style={{ padding:"10px 14px", fontSize:13, color:"var(--text-muted)" }}>Searching...</div>}
            {searchResults.map(u => (
              <div key={u._id} className="search-result-item" onClick={() => { onNewChat(u._id); setSearchResults([]); setSearch(""); }}>
                <div className="avatar">
                  {u.avatar ? <img src={u.avatar} alt={u.name}/> : <div className="avatar-placeholder">{u.name[0].toUpperCase()}</div>}
                  {onlineUsers.includes(u._id) && <div className="online-dot"/>}
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:14, color:"var(--text-primary)" }}>{u.name}</div>
                  <div style={{ fontSize:12, color:"var(--text-muted)" }}>{u.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="chat-list">
        {chats.length === 0 && (
          <div style={{ padding:24, textAlign:"center", color:"var(--text-muted)", fontSize:13 }}>
            Search for a user above to start chatting
          </div>
        )}
        {chats.map(chat => {
          const name = getChatName(chat);
          const avatar = getChatAvatar(chat);
          const online = isOnline(chat);
          const preview = getPreview(chat);
          const time = chat.latestMessage ? format(chat.latestMessage.createdAt) : "";
          return (
            <div key={chat._id} className={`chat-item ${selectedChat?._id === chat._id ? "active" : ""}`} onClick={() => onSelectChat(chat)}>
              <div className="avatar">
                {avatar ? <img src={avatar} alt={name}/> : (
                  <div className="avatar-placeholder">{chat.isGroupChat ? "👥" : name[0]?.toUpperCase()}</div>
                )}
                {online && <div className="online-dot"/>}
              </div>
              <div className="chat-info">
                <div className="chat-name-row">
                  <span className="chat-name">{name}</span>
                  <span className="chat-time">{time}</span>
                </div>
                <div className="chat-preview">{preview}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
