import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { Toast as ToastType } from '../../types';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const colors = {
    success: 'bg-[var(--color-success)] text-white',
    error: 'bg-[var(--color-error)] text-white',
    info: 'bg-[var(--color-accent)] text-white dark:bg-[var(--color-dark-accent)] dark:text-[var(--color-dark-background)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg',
        colors[toast.type]
      )}
    >
      {icons[toast.type]}
      <span className="text-sm font-medium">{toast.message}</span>
    </motion.div>
  );
}

// Toast container and hook
let toastId = 0;
const listeners = new Set<(toasts: ToastType[]) => void>();
let toasts: ToastType[] = [];

function notify(listeners: Set<(toasts: ToastType[]) => void>) {
  listeners.forEach((listener) => listener([...toasts]));
}

export function toast(message: string, type: ToastType['type'] = 'info') {
  const id = String(++toastId);
  toasts = [...toasts, { id, message, type }];
  notify(listeners);
  return id;
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify(listeners);
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<ToastType[]>([]);

  useEffect(() => {
    listeners.add(setCurrentToasts);
    return () => {
      listeners.delete(setCurrentToasts);
    };
  }, []);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {currentToasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onDismiss={dismissToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
