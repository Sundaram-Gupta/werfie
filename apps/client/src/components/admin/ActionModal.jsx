import React, { useEffect, useRef } from 'react';

export function ActionModal({ open, title, children, footer, maxWidth = 'max-w-2xl', onClose }) {
    const panelRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        focusables[0]?.focus();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose?.();
                return;
            }
            if (event.key !== 'Tab') return;
            const panel = panelRef.current;
            if (!panel) return;
            const focusables = Array.from(
                panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
            ).filter((el) => !el.hasAttribute('disabled'));
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose?.();
        }}>
            <div ref={panelRef} role="dialog" aria-modal="true" aria-label={title} className={`w-full ${maxWidth} rounded-xl border border-white/10 bg-slate-950 p-4`}>
                <h3 className="mb-3 text-lg font-semibold">{title}</h3>
                <div>{children}</div>
                {footer ? <div className="mt-4">{footer}</div> : null}
            </div>
        </div>
    );
}

