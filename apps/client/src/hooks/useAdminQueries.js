import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    attachAnnouncements,
    disableUser,
    getAdminCrises,
    getAdminDashboard,
    getAdminUsers,
    getAuditLogs,
    increaseCrisisSeverity,
    resolveCrisis,
    toggleCrisisStreamLive,
    updateUserRole
} from '@/services/crisis-admin.api';
import { deleteCrisis } from '@/services/crisis.api';
import { toast } from 'sonner';

const retryDelay = (attempt) => Math.min(1000 * 2 ** attempt, 8000);
const shouldRetry = (failureCount, error) => {
    const status = error?.response?.status;
    if (status && status >= 400 && status < 500) return false;
    return failureCount < 3;
};

export function useAdminDashboardQuery() {
    return useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: getAdminDashboard,
        refetchInterval: 15000,
        staleTime: 10000,
        gcTime: 5 * 60 * 1000,
        retry: shouldRetry,
        retryDelay
    });
}

export function useAdminCrisesQuery(params) {
    return useQuery({
        queryKey: ['admin-crises', params],
        queryFn: () => getAdminCrises(params),
        staleTime: 5000,
        gcTime: 5 * 60 * 1000,
        retry: shouldRetry,
        retryDelay
    });
}

export function useResolveCrisisMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: resolveCrisis,
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: ['admin-crises'] });
            const snapshots = qc.getQueriesData({ queryKey: ['admin-crises'] });
            snapshots.forEach(([key, value]) => {
                if (!value?.data) return;
                qc.setQueryData(key, {
                    ...value,
                    data: value.data.map((row) => (row.id === id ? { ...row, status: 'resolved' } : row))
                });
            });
            return { snapshots };
        },
        onError: (_err, _id, ctx) => {
            ctx?.snapshots?.forEach(([key, value]) => qc.setQueryData(key, value));
            toast.error('Failed to resolve crisis');
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-crises'] });
            qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
            toast.success('Crisis marked resolved');
        }
    });
}

export function useIncreaseSeverityMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: increaseCrisisSeverity,
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: ['admin-crises'] });
            const snapshots = qc.getQueriesData({ queryKey: ['admin-crises'] });
            snapshots.forEach(([key, value]) => {
                if (!value?.data) return;
                qc.setQueryData(key, {
                    ...value,
                    data: value.data.map((row) =>
                        row.id === id ? { ...row, severity: Math.min((row.severity || 1) + 1, 5) } : row
                    )
                });
            });
            return { snapshots };
        },
        onError: (_err, _id, ctx) => {
            ctx?.snapshots?.forEach(([key, value]) => qc.setQueryData(key, value));
            toast.error('Failed to increase severity');
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-crises'] });
            qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
            toast.success('Severity updated');
        }
    });
}

export function useAdminUsersQuery(params) {
    return useQuery({
        queryKey: ['admin-users', params],
        queryFn: () => getAdminUsers(params),
        staleTime: 15000,
        gcTime: 5 * 60 * 1000,
        retry: shouldRetry,
        retryDelay
    });
}

export function useAuditLogsQuery(params) {
    return useQuery({
        queryKey: ['admin-logs', params],
        queryFn: () => getAuditLogs(params),
        staleTime: 10000,
        gcTime: 5 * 60 * 1000,
        retry: shouldRetry,
        retryDelay
    });
}

export function useDeleteCrisisMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteCrisis,
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: ['admin-crises'] });
            const snapshots = qc.getQueriesData({ queryKey: ['admin-crises'] });
            snapshots.forEach(([key, value]) => {
                if (!value?.data) return;
                qc.setQueryData(key, {
                    ...value,
                    data: value.data.filter((row) => row.id !== id)
                });
            });
            return { snapshots };
        },
        onError: (_err, _id, ctx) => {
            ctx?.snapshots?.forEach(([key, value]) => qc.setQueryData(key, value));
            toast.error('Failed to delete crisis');
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-crises'] });
            qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
            qc.invalidateQueries({ queryKey: ['admin-logs'] });
            toast.success('Crisis deleted');
        }
    });
}

export function useUpdateUserRoleMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, role }) => updateUserRole(id, role),
        onMutate: async ({ id, role }) => {
            await qc.cancelQueries({ queryKey: ['admin-users'] });
            const snapshots = qc.getQueriesData({ queryKey: ['admin-users'] });
            snapshots.forEach(([key, value]) => {
                if (!value?.data) return;
                qc.setQueryData(key, {
                    ...value,
                    data: value.data.map((row) => (row.id === id ? { ...row, role } : row))
                });
            });
            return { snapshots };
        },
        onError: (_err, _payload, ctx) => {
            ctx?.snapshots?.forEach(([key, value]) => qc.setQueryData(key, value));
            toast.error('Failed to update role');
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            qc.invalidateQueries({ queryKey: ['admin-logs'] });
            toast.success('User role updated');
        }
    });
}

export function useDisableUserMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, disabled }) => disableUser(id, disabled),
        onMutate: async ({ id, disabled }) => {
            await qc.cancelQueries({ queryKey: ['admin-users'] });
            const snapshots = qc.getQueriesData({ queryKey: ['admin-users'] });
            snapshots.forEach(([key, value]) => {
                if (!value?.data) return;
                qc.setQueryData(key, {
                    ...value,
                    data: value.data.map((row) =>
                        row.id === id ? { ...row, status: disabled ? 'SUSPENDED' : 'ACTIVE' } : row
                    )
                });
            });
            return { snapshots };
        },
        onError: (_err, _payload, ctx) => {
            ctx?.snapshots?.forEach(([key, value]) => qc.setQueryData(key, value));
            toast.error('Failed to update user status');
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            qc.invalidateQueries({ queryKey: ['admin-logs'] });
            toast.success('User status updated');
        }
    });
}

export function useAttachAnnouncementsMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ crisisId, announcementIds }) => attachAnnouncements(crisisId, announcementIds),
        onError: () => toast.error('Failed to link announcements'),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-crises'] });
            qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
            qc.invalidateQueries({ queryKey: ['admin-logs'] });
            toast.success('Announcements linked');
        }
    });
}

export function useToggleStreamLiveMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ streamId, isLive }) => toggleCrisisStreamLive(streamId, isLive),
        onError: () => toast.error('Failed to update stream status'),
        onSuccess: (_data, payload) => {
            qc.invalidateQueries({ queryKey: ['admin-crises'] });
            qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
            qc.invalidateQueries({ queryKey: ['admin-logs'] });
            toast.success(payload.isLive ? 'Stream marked live' : 'Stream stopped');
        }
    });
}
