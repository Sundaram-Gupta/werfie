import React from 'react';

export function AdminResourcePage({ topBar = null, children, className = 'space-y-4' }) {
    return (
        <div className={className}>
            {topBar}
            {children}
        </div>
    );
}

