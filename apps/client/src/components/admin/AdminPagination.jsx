import React from 'react';

export function AdminPagination({ page, pages, isFetching, onPrev, onNext, className = '' }) {
    return (
        <div className={`flex items-center justify-end gap-2 border-t border-white/10 p-3 text-sm ${className}`.trim()}>
            <button
                disabled={page <= 1}
                onClick={onPrev}
                className="rounded border border-white/20 px-3 py-1 disabled:opacity-40"
            >
                Prev
            </button>
            <span className="text-slate-300">Page {page} / {pages || 1}{isFetching ? ' (loading...)' : ''}</span>
            <button
                disabled={!pages || page >= pages}
                onClick={onNext}
                className="rounded border border-white/20 px-3 py-1 disabled:opacity-40"
            >
                Next
            </button>
        </div>
    );
}

