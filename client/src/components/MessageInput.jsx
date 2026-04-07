import { useState, useRef, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import EmojiPicker from "emoji-picker-react";

export default function MessageInput({ chat, user, onSend, editingMsg, onEditSubmit, onCancelEdit }) {
  const { socket } = useSocket();
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (editingMsg) { setText(editingMsg.content); textareaRef.current?.focus(); }
    else setText("");
  }, [editingMsg]);

  const handleTyping = () => {
    socket?.emit("typing", { chatId: chat._id, userId: user._id, userName: user.name });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("stop-typing", { chatId: chat._id, userId: user._id });
    }, 1500);
  };

  const handleFileChange = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setFilePreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : f.name);
  };

  const handleSend = () => {
    if (editingMsg) { if (!text.trim()) return; onEditSubmit(editingMsg._id, text.trim()); return; }
    if (!text.trim() && !file) return;
    onSend(text.trim(), file);
    setText(""); setFile(null); setFilePreview(null); setShowEmoji(false);
    socket?.emit("stop-typing", { chatId: chat._id, userId: user._id });
  };

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div>
      {editingMsg && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 18px", background:"rgba(139,92,246,0.1)", borderTop:"1px solid rgba(139,92,246,0.15)", fontSize:13, color:"var(--purple-bright)" }}>
          <span>✏️ Editing message</span>
          <button onClick={onCancelEdit} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:16 }}>✕</button>
        </div>
      )}

      {filePreview && (
        <div className="file-preview">
          {file?.type.startsWith("image/")
            ? <img src={filePreview} alt="preview" style={{ height:48, borderRadius:8 }}/>
            : <span>📄 {filePreview}</span>}
          <button onClick={() => { setFile(null); setFilePreview(null); }}>✕</button>
        </div>
      )}

      {showEmoji && (
        <div className="emoji-picker-wrapper">
          <EmojiPicker onEmojiClick={e => { setText(p => p + e.emoji); textareaRef.current?.focus(); }} height={340} width={300}/>
        </div>
      )}

      <div className="input-area">
        <div className="input-wrapper">
          <button className="emoji-btn" onClick={() => setShowEmoji(!showEmoji)} title="Emoji">😊</button>
          <textarea
            ref={textareaRef} className="msg-input"
            placeholder="Type a message…" value={text} rows={1}
            onChange={e => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
          />
          {!editingMsg && (
            <>
              <button className="attach-btn" onClick={() => fileInputRef.current?.click()} title="Attach">📎</button>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display:"none" }} onChange={handleFileChange}/>
            </>
          )}
        </div>
        <button className="send-btn" onClick={handleSend} title="Send">
          {editingMsg ? "✓" : "➤"}
        </button>
      </div>
    </div>
  );
}
