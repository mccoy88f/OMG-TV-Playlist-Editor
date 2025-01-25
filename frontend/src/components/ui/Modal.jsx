import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  isTopmost = true
}) {
  const contentRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isTopmost) {
        onClose();
      }
    };

    const handleTab = (e) => {
      if (!contentRef.current) return;
      
      const focusableElements = contentRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        lastElement?.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement?.focus();
        e.preventDefault();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTab);
      document.body.style.overflow = 'hidden';
      firstElement?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      if (!document.querySelector('[role="dialog"]')) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, onClose, isTopmost]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black bg-opacity-50',
        isTopmost ? 'pointer-events-auto' : 'pointer-events-none'
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={contentRef}
        className={cn(
          'w-full rounded-lg bg-white shadow-xl',
          'transform transition-all duration-200',
          sizeClasses[size],
          className
        )}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-md p-2 hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {title && (
          <div className="border-b px-6 py-4">
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
          </div>
        )}

        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}