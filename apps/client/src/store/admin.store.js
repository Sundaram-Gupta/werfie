import { create } from 'zustand';

export const useAdminStore = create((set) => ({
    crisisSearch: '',
    setCrisisSearch: (crisisSearch) => set({ crisisSearch }),
    notifications: [],
    pushNotification: (message) =>
        set((state) => ({
            notifications: [{ id: crypto.randomUUID(), text: message, ts: Date.now() }, ...state.notifications].slice(0, 20)
        })),
    clearNotifications: () => set({ notifications: [] })
}));
