import React from 'react';

export function AdminAuditLogRow({ entry }) {
    return (
        <tr className="border-t border-white/10">
            <td className="px-3 py-2">{entry.userId}</td>
            <td className="px-3 py-2">{entry.action}</td>
            <td className="px-3 py-2">{entry.entityType}:{entry.entityId}</td>
            <td className="px-3 py-2">{new Date(entry.timestamp).toLocaleString()}</td>
        </tr>
    );
}
