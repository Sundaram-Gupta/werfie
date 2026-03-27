import React from 'react';

export function AdminFilterBar({
    value,
    onChange,
    onApply,
    placeholder = 'Search...',
    actions = null
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <input
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
            <button
                onClick={onApply}
                className="rounded bg-white px-4 py-2 text-sm font-semibold text-black"
            >
                Filter
            </button>
            {actions}
        </div>
    );
}

