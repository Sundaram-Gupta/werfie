import React from 'react';
import { useAuditLogsQuery } from '@/hooks/useAdminQueries';
import { getAuditLogs } from '@/services/crisis-admin.api';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { AdminAuditLogRow } from '@/components/admin/AdminAuditLogRow';
import { AdminTableSkeleton } from '@/components/admin/AdminStates';
import { AdminResourcePage } from '@/components/admin/AdminResourcePage';
import { AdminPageSection } from '@/components/admin/AdminPageSection';
import { usePaginatedPrefetch } from '@/hooks/usePaginatedPrefetch';
import { useAdminPageController } from '@/hooks/useAdminPageController';

export default function AdminLogs() {
    const controller = useAdminPageController({ initialPage: 1, limit: 20 });
    const { data, isFetching, isError, error } = useAuditLogsQuery({
        page: controller.page,
        limit: controller.limit
    });
    const state = controller.bindQuery({ data, isFetching, isError, error });

    usePaginatedPrefetch({
        pagination: state.pagination,
        page: controller.page,
        limit: controller.limit,
        queryKey: 'admin-logs',
        queryFn: getAuditLogs
    });

    return (
        <AdminResourcePage className="space-y-0">
            <AdminPageSection
                title="Audit Logs"
                subtitle="Trace privileged actions and operational history."
                queryState={state.queryState}
                skeleton={<AdminTableSkeleton rows={8} cols={4} />}
                emptyTitle="No audit logs found"
                emptySubtitle="No audit records available for this page."
                errorTitle="Unable to load audit logs"
                errorSubtitle="Failed to fetch audit trail data. Please retry."
            >
                <AdminDataTable
                    headers={['User', 'Action', 'Entity', 'Timestamp']}
                    rows={state.rows}
                    rowKey={(l) => l.id}
                    page={state.tablePagination.page}
                    pages={state.tablePagination.pages}
                    isFetching={state.tablePagination.isFetching}
                    onPageChange={state.tablePagination.onPageChange}
                    renderRow={(l) => <AdminAuditLogRow entry={l} />}
                />
            </AdminPageSection>
        </AdminResourcePage>
    );
}
