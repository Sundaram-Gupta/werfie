import React from 'react';
import { RowActionButton } from '@/components/admin/RowActionButton';

export function AdminStatusToggleButton({
    status,
    loading = false,
    onToggle,
    onClick
}) {
    const isSuspended = status === 'SUSPENDED';

    return (
        <RowActionButton
            loading={loading}
            loadingText="Saving..."
            onClick={onToggle || onClick}
            className="rounded bg-red-700/60 px-2 py-1 text-xs"
        >
            {isSuspended ? 'Enable' : 'Disable'}
        </RowActionButton>
    );
}

