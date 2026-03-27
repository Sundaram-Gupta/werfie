import React from 'react';

export function AdminRoleSelect({
    value,
    roles = [],
    disabled = false,
    onChange
}) {
    return (
        <select
            value={value}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.value)}
            className="rounded border border-white/10 bg-black/40 px-2 py-1 disabled:opacity-40"
        >
            {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
            ))}
        </select>
    );
}

