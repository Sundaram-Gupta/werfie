import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const allow = new Set(['Admin', 'CrisisManager', 'Publisher', 'Viewer', 'ADMIN', 'CRISIS_MANAGER', 'PUBLISHER', 'VIEWER']);

export function AdminRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (!allow.has(user.role || '')) return <Navigate to="/crisis-command" replace />;
    return children;
}
