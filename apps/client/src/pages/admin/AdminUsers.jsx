import React from 'react';
import {
    useAdminUsersQuery,
    useDisableUserMutation,
    useUpdateUserRoleMutation
} from '@/hooks/useAdminQueries';
import { getAdminUsers } from '@/services/crisis-admin.api';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { AdminUserRow } from '@/components/admin/AdminUserRow';
import { AdminQueryState, AdminTableSkeleton } from '@/components/admin/AdminStates';
import { AdminResourcePage } from '@/components/admin/AdminResourcePage';
import { AdminEntityHeader } from '@/components/admin/AdminEntityHeader';
import { usePaginatedPrefetch } from '@/hooks/usePaginatedPrefetch';
import { useAdminPageController } from '@/hooks/useAdminPageController';
import { useRowAsyncAction } from '@/hooks/useRowAsyncAction';

const ROLES = ['Admin', 'CrisisManager', 'Publisher', 'Viewer'];

export default function AdminUsers() {
    const controller = useAdminPageController({ initialPage: 1, limit: 20 });
    const rowAction = useRowAsyncAction();
    const { data, isFetching, isError, error } = useAdminUsersQuery({
        page: controller.page,
        limit: controller.limit
    });
    const state = controller.bindQuery({ data, isFetching, isError, error });
    const updateRoleMutation = useUpdateUserRoleMutation();
    const disableUserMutation = useDisableUserMutation();

    usePaginatedPrefetch({
        pagination: state.pagination,
        page: controller.page,
        limit: controller.limit,
        queryKey: 'admin-users',
        queryFn: getAdminUsers
    });

    return (
        <AdminResourcePage className="space-y-0">
            <div className="pb-4">
                <AdminEntityHeader
                    title="User Management"
                    subtitle="Manage platform roles and account status."
                />
            </div>
            <AdminQueryState
                isLoading={state.queryState.isLoading}
                isError={state.queryState.isError}
                error={state.queryState.error}
                isEmpty={state.queryState.isEmpty}
                skeleton={<AdminTableSkeleton rows={6} cols={5} />}
                emptyTitle="No users found"
                emptySubtitle="No users available for this page/filter."
                errorTitle="Unable to load users"
                errorSubtitle="Failed to fetch user records. Please retry."
            >
                <AdminDataTable
                    headers={['User', 'Email', 'Role', 'Status', 'Actions']}
                    rows={state.rows}
                    rowKey={(u) => u.id}
                    page={state.tablePagination.page}
                    pages={state.tablePagination.pages}
                    isFetching={state.tablePagination.isFetching}
                    onPageChange={state.tablePagination.onPageChange}
                    renderRow={(u) => {
                        const actions = rowAction.bindEntity(u.id);
                        return (
                            <AdminUserRow
                                key={u.id}
                                user={u}
                                roles={ROLES}
                                roleLoading={actions.isActive('role')}
                                statusLoading={actions.isActive('status')}
                                onRoleChange={(role) => actions.run(
                                    'role',
                                    () => updateRoleMutation.mutateAsync({ id: u.id, role })
                                )}
                                onToggleStatus={() => actions.run(
                                    'status',
                                    () => disableUserMutation.mutateAsync({ id: u.id, disabled: u.status !== 'SUSPENDED' })
                                )}
                            />
                        );
                    }}
                />
            </AdminQueryState>
        </AdminResourcePage>
    );
}
