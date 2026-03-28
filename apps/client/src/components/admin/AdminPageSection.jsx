import React from 'react';
import { AdminEntityHeader } from '@/components/admin/AdminEntityHeader';
import { AdminQueryState } from '@/components/admin/AdminStates';

export function AdminPageSection({
    title,
    subtitle,
    queryState,
    skeleton,
    emptyTitle,
    emptySubtitle,
    errorTitle,
    errorSubtitle,
    headerClassName = 'pb-4',
    children
}) {
    const showHeader = title != null && title !== '';

    return (
        <>
            {showHeader && (
                <div className={headerClassName}>
                    <AdminEntityHeader title={title} subtitle={subtitle} />
                </div>
            )}
            <AdminQueryState
                isLoading={queryState.isLoading}
                isError={queryState.isError}
                error={queryState.error}
                isEmpty={queryState.isEmpty}
                skeleton={skeleton}
                emptyTitle={emptyTitle}
                emptySubtitle={emptySubtitle}
                errorTitle={errorTitle}
                errorSubtitle={errorSubtitle}
            >
                {children}
            </AdminQueryState>
        </>
    );
}
