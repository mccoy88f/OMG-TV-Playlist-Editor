// Toast.jsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { TOAST_TYPES } from '@/lib/constants';
import { X } from 'lucide-react';

const toastStyles = {
  [TOAST_TYPES.SUCCESS]: 'bg-green-50 border-green-500 text-green-900',
  [TOAST_TYPES.ERROR]: 'bg-red-50 border-red-500 text-red-900',
  [TOAST_TYPES.WARNING]: 'bg-yellow-50 border-yellow-500 text-yellow-900',
  [TOAST_TYPES.INFO]: 'bg-blue-50 border-blue-500 text-blue-900',
};

export function Toast({
  message,
  type = TOAST_TYPES.INFO,
  onClose,
  duration = 5000,
  className,
}) {
  const timeoutRef = useRef();

  useEffect(() => {
    if (duration) {
      timeoutRef.current = setTimeout(onClose, duration);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [duration, onClose]);

  return createPortal(
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'fixed right-4 top-4 z-50 w-full max-w-sm rounded-lg border p-4 shadow-lg',
        'transform transition-all duration-200 ease-in-out',
        toastStyles[type],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="mr-4 flex-1">{message}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-black/10"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}