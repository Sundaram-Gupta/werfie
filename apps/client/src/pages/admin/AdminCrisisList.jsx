import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminStore } from '@/store/admin.store';
import { getAdminCrises } from '@/services/crisis-admin.api';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { RowActionButton } from '@/components/admin/RowActionButton';
import { AdminRowActions } from '@/components/admin/AdminRowActions';
import { AdminQueryState, AdminTableSkeleton } from '@/components/admin/AdminStates';
import { AdminFilterBar } from '@/components/admin/AdminFilterBar';
import { AdminResourcePage } from '@/components/admin/AdminResourcePage';
import { AdminEntityHeader } from '@/components/admin/AdminEntityHeader';
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
            <AdminQueryState
                isLoading={state.queryState.isLoading}
                isError={state.queryState.isError}
                error={state.queryState.error}
                isEmpty={state.queryState.isEmpty}
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
                            <tr key={c.id} className="border-t border-white/10">
                            <td className="px-3 py-2">{c.title}</td>
                            <td className="px-3 py-2">{c.region}, {c.country}</td>
                            <td className="px-3 py-2"><span className="rounded bg-blue-600/30 px-2 py-1 text-xs">{c.status}</span></td>
                            <td className="px-3 py-2">{c.severity}</td>
                            <td>
                                <AdminRowActions>
                                    <Link to={`/admin/crisis/${c.id}/edit`} className="rounded bg-white/10 px-2 py-1 text-xs">Edit</Link>
                                    <RowActionButton
                                        loading={actions.isActive('resolve')}
                                        loadingText="Resolving..."
                                        onClick={() => actions.run('resolve', () => resolveMutation.mutateAsync(c.id))}
                                        className="rounded bg-emerald-700/50 px-2 py-1 text-xs"
                                    >
                                        Resolve
                                    </RowActionButton>
                                    <RowActionButton
                                        loading={actions.isActive('severity')}
                                        loadingText="Updating..."
                                        onClick={() => actions.run('severity', () => severityMutation.mutateAsync(c.id))}
                                        className="rounded bg-amber-700/50 px-2 py-1 text-xs"
                                    >
                                        +Severity
                                    </RowActionButton>
                                    <RowActionButton
                                        loading={actions.isActive('delete')}
                                        loadingText="Deleting..."
                                        onClick={() => actions.run('delete', async () => {
                                            await deleteMutation.mutateAsync(c.id);
                                            refetch();
                                        })}
                                        className="rounded bg-red-700/60 px-2 py-1 text-xs"
                                    >
                                        Delete
                                    </RowActionButton>
                                </AdminRowActions>
                            </td>
                            </tr>
                        );
                    }}
                />
            </AdminQueryState>
        </AdminResourcePage>
    );
}
