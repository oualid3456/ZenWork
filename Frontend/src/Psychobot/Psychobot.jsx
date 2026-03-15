import { useState, useEffect, useRef } from "react";
import "./PsychoBot.css";

const API = "http://localhost:8000";

export default function PsychoBot() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour ! Je suis PsychoBot. Comment vous sentez-vous aujourd'hui ?" }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/psychobot/chat/message/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: newMessages.slice(0, -1),
          message: text,
        }),
      });
      const data = await res.json();

      if (data.response) {
        setMessages([...newMessages, { role: "assistant", content: data.response }]);
      } else {
        setError(data.error || "Erreur inattendue.");
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="psycho-page">

      {/* Header */}
      <div className="psycho-header">
        <div className="psycho-avatar">🤖</div>
        <div>
          <h2>PsychoBot</h2>
          <p>Assistant bien-être — confidentiel</p>
        </div>
        <div className="psycho-status" />
      </div>

      {/* Messages */}
      <div className="psycho-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`msg-row ${msg.role}`}>
            <div className="msg-icon">
              {msg.role === "assistant" ? "🤖" : "👤"}
            </div>
            <div className="bubble">{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div className="msg-row assistant">
            <div className="msg-icon">🤖</div>
            <div className="typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        {error && <p className="psycho-error">⚠ {error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="psycho-input-zone">
        <div className="input-row">
          <textarea
            className="psycho-textarea"
            value={input}
            placeholder="Écrivez votre message…"
            rows={1}
            disabled={loading}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            ➤
          </button>
        </div>
        <p className="psycho-hint">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
      </div>

    </div>
  );
}