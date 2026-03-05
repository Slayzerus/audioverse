import React from 'react';

type Toast = { id: number; message: string; level?: 'info' | 'success' | 'error' };

const ToastContext = React.createContext<{ showToast: (msg: string, level?: Toast['level']) => void }>({ showToast: () => {} });

export const useToast = () => React.useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const nextId = React.useRef(1);

  const showToast = (message: string, level: Toast['level'] = 'info') => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message, level }]);
    window.setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} className={`alert alert-${t.level === 'error' ? 'danger' : t.level === 'success' ? 'success' : 'info'} py-1 px-2 mb-0`} style={{minWidth:200}}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
