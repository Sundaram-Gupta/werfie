import React from 'react';

export function RowActionButton({ loading, loadingText = 'Working...', children, className = '', ...props }) {
    return (
        <button
            disabled={loading || props.disabled}
            className={`${className} disabled:opacity-40`}
            {...props}
        >
            {loading ? loadingText : children}
        </button>
    );
}

