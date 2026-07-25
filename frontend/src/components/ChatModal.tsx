import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../types';
import type { ChatMessage } from '../types';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatModal({ isOpen, onClose }: ChatModalProps) {
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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    const userMessage = chatQuery;
    const updatedHistory = [...chatHistory, { sender: 'user' as const, text: userMessage }];
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
      setChatHistory(prev => [...prev, { sender: 'ai', text: data.response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'ai', text: '⚠️ Error al conectar con la IA. Verifica que el backend esté corriendo.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-modal">
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
          <button onClick={onClose} className="chat-close" title="Cerrar">✖</button>
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
            {msg.text}
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
