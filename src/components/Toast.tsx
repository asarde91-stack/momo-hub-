'use client';

import { useEffect, useState } from 'react';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  action?: ToastAction;
  onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, action, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  function handleClose() {
    setIsExiting(true);
    setTimeout(() => onClose(), 300);
  }

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  }[type];

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white transition-all duration-300 ${
        bgColor
      } ${isVisible && !isExiting ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
    >
      <span className="text-lg">
        {type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}
      </span>
      <span className="flex-1 font-medium text-sm">{message}</span>
      {action && (
        <button
          onClick={() => {
            action.onClick();
            handleClose();
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
            action.variant === 'danger'
              ? 'bg-white/20 hover:bg-white/30'
              : 'bg-white/20 hover:bg-white/30'
          }`}
        >
          {action.label}
        </button>
      )}
      <button
        onClick={handleClose}
        className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
