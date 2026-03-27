import React from 'react';

export function AdminTable({ headers = [], children }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-slate-300">
                    <tr>
                        {headers.map((header) => (
                            <th key={header} className="px-3 py-2 text-left">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    );
}

