import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminStore } from '@/store/admin.store';
import { getAdminCrises } from '@/services/crisis-admin.api';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { AdminCrisisRow } from '@/components/admin/AdminCrisisRow';
import { AdminTableSkeleton } from '@/components/admin/AdminStates';
import { AdminFilterBar } from '@/components/admin/AdminFilterBar';
import { AdminResourcePage } from '@/components/admin/AdminResourcePage';
import { AdminEntityHeader } from '@/components/admin/AdminEntityHeader';
import { AdminPageSection } from '@/components/admin/AdminPageSection';
import { usePaginatedPrefetch } from '@/hooks/usePaginatedPrefetch';
import { useAdminPageController } from '@/hooks/useAdminPageController';
import { useRowAsyncAction } from '@/hooks/useRowAsyncAction';
import {
    useAdminCrisesQuery,
    useDeleteCrisisMutation,
    useIncreaseSeverityMutation,
    useResolveCrisisMutation
} from '@/hooks/useAdminQueries';

export default function AdminCrisisList() {
    const controller = useAdminPageController({ initialPage: 1, limit: 20 });
    const [localQ, setLocalQ] = useState('');
    const rowAction = useRowAsyncAction();
    const q = useAdminStore((s) => s.crisisSearch);
    const setQ = useAdminStore((s) => s.setCrisisSearch);
    const { data, refetch, isFetching, isError, error } = useAdminCrisesQuery({
        q,
        page: controller.page,
        limit: controller.limit
    });
    const state = controller.bindQuery({ data, isFetching, isError, error });
    const resolveMutation = useResolveCrisisMutation();
    const severityMutation = useIncreaseSeverityMutation();
    const deleteMutation = useDeleteCrisisMutation();
    const prefetchParams = useMemo(() => ({ q }), [q]);

    useEffect(() => {
        setLocalQ(q);
    }, [q]);

    usePaginatedPrefetch({
        pagination: state.pagination,
        page: controller.page,
        limit: controller.limit,
        queryKey: 'admin-crises',
        queryFn: getAdminCrises,
        extraParams: prefetchParams
    });

    return (
        <AdminResourcePage
            topBar={(
                <>
                    <AdminEntityHeader
                        title="Crisis Management"
                        subtitle="Search, prioritize, and control live crisis incidents."
                    />
                    <AdminFilterBar
                        value={localQ}
                        onChange={setLocalQ}
                        onApply={() => { setQ(localQ); controller.setPage(1); }}
                        placeholder="Search crisis..."
                        actions={<Link to="/admin/crisis/create" className="rounded bg-red-600 px-4 py-2 text-sm font-semibold">Create</Link>}
                    />
                </>
            )}
        >
            <AdminPageSection
                queryState={state.queryState}
                skeleton={<AdminTableSkeleton rows={6} cols={5} />}
                emptyTitle="No crises found"
                emptySubtitle="No crisis matches the current filter criteria."
                errorTitle="Unable to load crises"
                errorSubtitle="Failed to fetch crisis records. Please retry."
            >
                <AdminDataTable
                    headers={['Title', 'Region', 'Status', 'Severity', 'Actions']}
                    rows={state.rows}
                    rowKey={(c) => c.id}
                    page={state.tablePagination.page}
                    pages={state.tablePagination.pages}
                    isFetching={state.tablePagination.isFetching}
                    onPageChange={state.tablePagination.onPageChange}
                    paginationClassName="border-t-0 p-0"
                    renderRow={(c) => {
                        const actions = rowAction.bindEntity(c.id);
                        return (
                            <AdminCrisisRow
                                crisis={c}
                                resolveLoading={actions.isActive('resolve')}
                                severityLoading={actions.isActive('severity')}
                                deleteLoading={actions.isActive('delete')}
                                onResolve={() => actions.run('resolve', () => resolveMutation.mutateAsync(c.id))}
                                onIncreaseSeverity={() => actions.run('severity', () => severityMutation.mutateAsync(c.id))}
                                onDelete={() => actions.run('delete', async () => {
                                    await deleteMutation.mutateAsync(c.id);
                                    refetch();
                                })}
                            />
                        );
                    }}
                />
            </AdminPageSection>
        </AdminResourcePage>
    );
}
