import React from 'react';
import { Link } from 'react-router-dom';
import { RowActionButton } from '@/components/admin/RowActionButton';
import { AdminRowActions } from '@/components/admin/AdminRowActions';

export function AdminCrisisRow({
    crisis,
    resolveLoading = false,
    severityLoading = false,
    deleteLoading = false,
    onResolve,
    onIncreaseSeverity,
    onDelete
}) {
    const editTo = `/admin/crisis/${crisis.id}/edit`;

    return (
        <tr className="border-t border-white/10">
            <td className="px-3 py-2">{crisis.title}</td>
            <td className="px-3 py-2">{crisis.region}, {crisis.country}</td>
            <td className="px-3 py-2">
                <span className="rounded bg-blue-600/30 px-2 py-1 text-xs">{crisis.status}</span>
            </td>
            <td className="px-3 py-2">{crisis.severity}</td>
            <td>
                <AdminRowActions>
                    <Link to={editTo} className="rounded bg-white/10 px-2 py-1 text-xs">Edit</Link>
                    <RowActionButton
                        loading={resolveLoading}
                        loadingText="Resolving..."
                        onClick={onResolve}
                        className="rounded bg-emerald-700/50 px-2 py-1 text-xs"
                    >
                        Resolve
                    </RowActionButton>
                    <RowActionButton
                        loading={severityLoading}
                        loadingText="Updating..."
                        onClick={onIncreaseSeverity}
                        className="rounded bg-amber-700/50 px-2 py-1 text-xs"
                    >
                        +Severity
                    </RowActionButton>
                    <RowActionButton
                        loading={deleteLoading}
                        loadingText="Deleting..."
                        onClick={onDelete}
                        className="rounded bg-red-700/60 px-2 py-1 text-xs"
                    >
                        Delete
                    </RowActionButton>
                </AdminRowActions>
            </td>
        </tr>
    );
}
