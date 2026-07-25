import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy } from 'lucide-react';
import { API_BASE_URL } from '../types';
import type { ChatMessage } from '../types';
import { useApp } from '../context/AppContext';

const QUICK_SUGGESTIONS = [
  '¿Cómo investigo un dominio?',
  '¿Qué módulos usa IP?',
  '¿Qué es Shodan?',
];

export function ChatPanel(): JSX.Element {
  const { state, dispatch } = useApp();
  const { isChatOpen } = state;

  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('osintojo_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('osintojo_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const submitMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    const updatedHistory = [
      ...chatHistory,
      { sender: 'user' as const, text: userMessage, timestamp: new Date().toISOString() },
    ];
    setChatHistory(updatedHistory);
    setChatQuery('');
    setIsTyping(true);

    const apiHistory = chatHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, history: apiHistory })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { sender: 'ai', text: data.response, timestamp: new Date().toISOString() }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'ai', text: '⚠️ Error al conectar con la IA. Verifica que el backend esté corriendo.', timestamp: new Date().toISOString() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMessage(chatQuery);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setChatQuery(suggestion);
    submitMessage(suggestion);
  };

  return (
    <div className={`chat-panel glass-panel ${isChatOpen ? 'open' : ''}`}>
      <div className="chat-header">
        <h3 className="chat-title">🤖 Asistente OSINTOJO</h3>
        <div>
          <button
            onClick={() => {
              if (window.confirm('¿Borrar historial de chat?')) {
                setChatHistory([]);
              }
            }}
            className="chat-close"
            title="Limpiar chat"
            style={{ marginRight: '8px' }}
          >
            🧹
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_CHAT_OPEN', open: false })}
            className="chat-close"
            title="Cerrar"
          >
            ✖
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {chatHistory.length === 0 && (
          <div className="chat-welcome">
            ¡Hola! 👋 Dime qué buscas y te sugeriré herramientas de nuestro catálogo.
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.sender === 'user' ? 'chat-user' : 'chat-ai'}`}>
            {msg.sender === 'ai' ? (
              <>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
                <button
                  className="chat-close"
                  title="Copiar"
                  onClick={() => navigator.clipboard.writeText(msg.text)}
                  style={{ padding: 0, fontSize: '0.8rem' }}
                >
                  <Copy size={14} />
                </button>
              </>
            ) : (
              msg.text
            )}
            {msg.timestamp && (
              <span className="chat-timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="chat-typing">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {chatHistory.length === 0 && (
        <div className="chat-suggestions">
          {QUICK_SUGGESTIONS.map(suggestion => (
            <button
              key={suggestion}
              type="button"
              className="chat-suggestion-chip"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleChatSubmit} className="chat-input-area">
        <input
          type="text"
          value={chatQuery}
          onChange={e => setChatQuery(e.target.value)}
          placeholder="Ej: herramientas para instagram..."
          className="chat-input"
        />
        <button type="submit" className="chat-send" disabled={isTyping}>
          ➤
        </button>
      </form>
    </div>
  );
}
