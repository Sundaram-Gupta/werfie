import React from 'react';
import { AdminRowActions } from '@/components/admin/AdminRowActions';
import { AdminRoleSelect } from '@/components/admin/AdminRoleSelect';
import { AdminStatusToggleButton } from '@/components/admin/AdminStatusToggleButton';

export function AdminUserRow({
    user,
    roles,
    roleLoading = false,
    statusLoading = false,
    onRoleChange,
    onToggleStatus
}) {
    return (
        <tr className="border-t border-white/10">
            <td className="px-3 py-2">{user.name || user.handle || user.id.slice(0, 8)}</td>
            <td className="px-3 py-2">{user.email}</td>
            <td className="px-3 py-2">
                <AdminRoleSelect
                    value={user.role}
                    roles={roles}
                    disabled={roleLoading}
                    onChange={onRoleChange}
                />
            </td>
            <td className="px-3 py-2">{user.status}</td>
            <td>
                <AdminRowActions>
                    <AdminStatusToggleButton
                        status={user.status}
                        loading={statusLoading}
                        onToggle={onToggleStatus}
                    />
                </AdminRowActions>
            </td>
        </tr>
    );
}

