import React from 'react';

export function AdminEntityHeader({ title, subtitle, actions = null, metrics = null }) {
    return (
        <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    {subtitle ? <p className="text-sm text-slate-400">{subtitle}</p> : null}
                </div>
                {actions}
            </div>
            {Array.isArray(metrics) && metrics.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-4">
                    {metrics.map((m) => (
                        <div key={m.label} className="rounded-lg border border-white/10 bg-white/5 p-3">
                            <p className="text-xs uppercase text-slate-400">{m.label}</p>
                            <p className="mt-1 text-2xl font-bold">{m.value}</p>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

