import { useEffect } from 'react';
import CheckCircleIcon from '../../assets/icons/material-symbols/check_circle.svg?react';
import ErrorIcon from '../../assets/icons/material-symbols/error.svg?react';
import InfoIcon from '../../assets/icons/material-symbols/info.svg?react';

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
    // 안내는 브랜드 파랑과 겹치지 않게 반전 무채색으로 둔다(bg/inverse).
    info: 'bg-brand-ink text-white dark:bg-gray-200 dark:text-brand-ink',
  };

  const iconMap = {
    success: CheckCircleIcon,
    error: ErrorIcon,
    info: InfoIcon,
  };
  const Icon = iconMap[type];

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className={`${typeStyles[type]} flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl shadow-gray-900/20`}>
        <Icon aria-hidden="true" className="icon text-xl" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

