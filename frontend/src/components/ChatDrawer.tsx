import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Trash2, Send, Bot, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../types';
import type { ChatMessage } from '../types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_SUGGESTIONS = [
  'Herramientas para investigar Instagram',
  'Mejores OSINT para dominios',
  'Cómo analizar una IP sospechosa',
  'Herramientas de geolocalización',
];

export function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('osinteye_chat_history');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('osinteye_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage = text.trim();
    const updatedHistory: ChatMessage[] = [...chatHistory, { sender: 'user', text: userMessage }];
    setChatHistory(updatedHistory);
    setChatQuery('');
    setIsTyping(true);

    const apiHistory = chatHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, history: apiHistory }),
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { sender: 'ai', text: data.response }]);
    } catch {
      setChatHistory(prev => [...prev, { sender: 'ai', text: '⚠️ Error al conectar con la IA. Verifica que el backend esté corriendo.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(chatQuery);
  };

  const clearHistory = () => {
    if (window.confirm('¿Borrar historial de chat?')) {
      setChatHistory([]);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="drawer-backdrop" onClick={onClose} />
      )}

      {/* Drawer */}
      <div className={`chat-drawer ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-header-info">
            <div className="drawer-avatar">
              <Bot size={20} />
            </div>
            <div>
              <div className="drawer-title">Asistente OSINTEYE</div>
              <div className="drawer-subtitle">Powered by Claude AI</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {chatHistory.length > 0 && (
              <button className="drawer-icon-btn" onClick={clearHistory} title="Limpiar chat">
                <Trash2 size={16} />
              </button>
            )}
            <button className="drawer-icon-btn" onClick={onClose} title="Cerrar">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="drawer-messages">
          {chatHistory.length === 0 && (
            <div className="drawer-welcome">
              <div className="drawer-welcome-icon">
                <Sparkles size={32} color="#6366f1" />
              </div>
              <div className="drawer-welcome-title">¡Hola! Soy tu asistente OSINT</div>
              <div className="drawer-welcome-text">
                Pregúntame sobre herramientas, técnicas de investigación o cómo analizar un objetivo.
              </div>
              <div className="drawer-suggestions">
                {QUICK_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    className="suggestion-chip"
                    onClick={() => sendMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatHistory.map((msg, i) => (
            <div key={i} className={`drawer-message ${msg.sender === 'user' ? 'drawer-message-user' : 'drawer-message-ai'}`}>
              {msg.sender === 'ai' && (
                <div className="message-avatar"><Bot size={14} /></div>
              )}
              <div className="message-bubble">
                {msg.sender === 'ai' ? (
                  <div className="markdown-content">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <span>{msg.text}</span>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="drawer-message drawer-message-ai">
              <div className="message-avatar"><Bot size={14} /></div>
              <div className="message-bubble">
                <div className="chat-typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions (when there's history) */}
        {chatHistory.length > 0 && chatHistory.length < 4 && (
          <div className="drawer-suggestions-bar">
            {QUICK_SUGGESTIONS.slice(0, 2).map((s, i) => (
              <button key={i} className="suggestion-chip" onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="drawer-input-area">
          <input
            ref={inputRef}
            type="text"
            value={chatQuery}
            onChange={e => setChatQuery(e.target.value)}
            placeholder="Ej: herramientas para redes sociales..."
            className="chat-input"
            disabled={isTyping}
          />
          <button type="submit" className="chat-send" disabled={isTyping || !chatQuery.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );
}
