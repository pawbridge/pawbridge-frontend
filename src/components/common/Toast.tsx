import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'info', isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: 'bg-emerald-500 dark:bg-emerald-600 text-white',
    error: 'bg-red-500 dark:bg-red-600 text-white',
    info: 'bg-blue-500 dark:bg-blue-600 text-white',
  };

  const iconMap = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className={`${typeStyles[type]} flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl shadow-gray-900/20`}>
        <span className="material-symbols-outlined text-xl">{iconMap[type]}</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

