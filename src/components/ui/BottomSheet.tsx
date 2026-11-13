import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { cn } from '../../lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  ariaLabel: string;
  children: ReactNode;
}

const IOS_EASE = [0.32, 0.72, 0, 1] as const;

/**
 * iOS-style bottom sheet. Swipe down on the header, tap outside, press Esc or
 * tap × to close. Rendered in a portal so transformed parents can't trap it.
 */
export function BottomSheet({ isOpen, onClose, title, subtitle, ariaLabel, children }: BottomSheetProps) {
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);

  // Parents may re-render every second (workout timer); keep the open/close
  // side effects keyed to isOpen alone so they don't re-run on each tick.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previousFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      // Hand focus back to the trigger button, but never to a text field:
      // on iPhone that would pop the keyboard open.
      if (previousFocus instanceof HTMLButtonElement) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="sheet-backdrop"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm touch-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg max-h-[88dvh] flex flex-col rounded-t-[20px] bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-b-0 border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-xl outline-none"
            initial={{ y: '100%' }}
            animate={{ y: 0, transition: { duration: 0.42, ease: IOS_EASE } }}
            exit={{ y: '100%', transition: { duration: 0.26, ease: [0.4, 0, 1, 1] } }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 110 || info.velocity.y > 550) onClose();
            }}
          >
            {/* Header: also the drag handle */}
            <div className="shrink-0 touch-none select-none" onPointerDown={(e) => dragControls.start(e)}>
              <div className="flex justify-center pt-2.5 pb-1.5">
                <span className="w-9 h-[5px] rounded-full bg-[var(--color-border)] dark:bg-[var(--color-dark-border-subtle)]" />
              </div>
              <div className="flex items-start gap-3 px-5 pb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-[17px] font-semibold leading-tight text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] truncate">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className={cn('text-[13px] mt-0.5 truncate', 'text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]')}>
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Close"
                  className="w-8 h-8 -mr-1 flex items-center justify-center rounded-full bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)] text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] active:scale-95 transition-transform shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-safe">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
