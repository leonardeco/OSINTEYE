import { useState, useEffect, useCallback } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

let toastCounter = 0;
let addToastExternal: ((text: string, type: 'success' | 'error' | 'info') => void) | null = null;

export function showToast(text: string, type: 'success' | 'error' | 'info' = 'info') {
  if (addToastExternal) {
    addToastExternal(text, type);
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    const id = ++toastCounter;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastExternal = addToast;
    return () => { addToastExternal = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'info' && 'ℹ️'}
          </span>
          <span>{toast.text}</span>
          <button
            className="toast-close"
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
