'use client';

import { useEffect, useState } from 'react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  function handleClose(callback: () => void) {
    setIsVisible(false);
    setTimeout(callback, 200);
  }

  const confirmBg = variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-orange-600';

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center p-6 transition-all duration-200 ${
        isVisible ? 'bg-black/40 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={() => handleClose(onCancel)}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 transition-all duration-200 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={() => handleClose(onCancel)}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-colors active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => handleClose(onConfirm)}
            className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-colors active:scale-95 ${confirmBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
