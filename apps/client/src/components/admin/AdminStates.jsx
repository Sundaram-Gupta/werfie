import React from 'react';

export function AdminEmptyState({ title = 'No data found', subtitle = 'Try adjusting filters or creating a new item.' }) {
    return (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
            <p className="text-base font-semibold text-slate-100">{title}</p>
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
    );
}

export function AdminTableSkeleton({ rows = 6, cols = 5 }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
                <tbody>
                    {Array.from({ length: rows }).map((_, rIdx) => (
                        <tr key={rIdx} className="border-t border-white/10">
                            {Array.from({ length: cols }).map((__, cIdx) => (
                                <td key={`${rIdx}-${cIdx}`} className="px-3 py-3">
                                    <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function AdminErrorState({ title = 'Failed to load data', subtitle = 'Please retry in a few moments.' }) {
    return (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <p className="text-base font-semibold text-red-200">{title}</p>
            <p className="mt-1 text-sm text-red-100/80">{subtitle}</p>
        </div>
    );
}

export function AdminQueryState({
    isLoading = false,
    isError = false,
    error = null,
    isEmpty = false,
    skeleton = null,
    emptyTitle = 'No data found',
    emptySubtitle = 'Try adjusting filters or creating a new item.',
    errorTitle = 'Failed to load data',
    errorSubtitle = null,
    children
}) {
    if (isLoading) {
        return skeleton;
    }
    if (isError) {
        return (
            <AdminErrorState
                title={errorTitle}
                subtitle={errorSubtitle || error?.message || 'Please retry in a few moments.'}
            />
        );
    }
    if (isEmpty) {
        return <AdminEmptyState title={emptyTitle} subtitle={emptySubtitle} />;
    }
    return children;
}

