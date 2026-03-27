import React from 'react';
import { useAdminDashboardQuery } from '@/hooks/useAdminQueries';
import { AdminEntityHeader } from '@/components/admin/AdminEntityHeader';
import { AdminQueryState } from '@/components/admin/AdminStates';

export default function AdminDashboard() {
    const { data, isFetching, isError, error } = useAdminDashboardQuery();

    const cards = [
        { label: 'Total Active Crises', value: data?.totalActiveCrises ?? 0 },
        { label: 'High Severity Count', value: data?.highSeverityCount ?? 0 },
        { label: 'Active Streams', value: data?.activeStreams ?? 0 },
        { label: 'Recent Alerts', value: data?.recentAlerts?.length ?? 0 }
    ];

    return (
        <div className="space-y-6">
            <AdminEntityHeader
                title="Admin Dashboard"
                subtitle="Mission control overview for live crises and command operations."
                metrics={cards}
            />
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h2 className="mb-3 text-sm font-bold uppercase text-slate-300">Recent Alerts</h2>
                <AdminQueryState
                    isLoading={isFetching && !data}
                    isError={isError}
                    error={error}
                    isEmpty={(data?.recentAlerts || []).length === 0}
                    skeleton={<div className="h-24 animate-pulse rounded bg-white/10" />}
                    emptyTitle="No recent alerts"
                    emptySubtitle="No high-priority alerts have been recorded yet."
                    errorTitle="Unable to load dashboard alerts"
                    errorSubtitle="Failed to fetch recent alert feed. Please retry."
                >
                    <div className="space-y-2">
                        {(data?.recentAlerts || []).map((a) => (
                            <div key={a.id} className="flex items-center justify-between rounded bg-black/30 px-3 py-2">
                                <span>{a.title}</span>
                                <span className="text-xs text-red-400">Severity {a.severity}</span>
                            </div>
                        ))}
                    </div>
                </AdminQueryState>
            </div>
        </div>
    );
}
