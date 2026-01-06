import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              `fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-[calc(100%-2rem)] max-w-md max-h-[85vh]
              bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]
              border border-[var(--color-border)] dark:border-[var(--color-dark-border)]
              rounded-2xl shadow-xl
              overflow-hidden
              flex flex-col`,
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                {title && (
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] dark:text-[var(--color-dark-text-muted)] dark:hover:text-[var(--color-dark-text-primary)] dark:hover:bg-[var(--color-dark-surface-secondary)] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Confirm Dialog variant
interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onCancel} title={title} showCloseButton={false}>
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
          {message}
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm font-medium rounded-xl bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)] text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] hover:bg-[var(--color-border)] dark:hover:bg-[var(--color-dark-border)] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-colors',
              variant === 'danger'
                ? 'bg-[var(--color-error)] text-white hover:bg-red-600'
                : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] dark:bg-[var(--color-dark-accent)] dark:text-[var(--color-dark-background)] dark:hover:bg-[var(--color-dark-accent-hover)]'
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
