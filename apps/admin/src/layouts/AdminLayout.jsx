import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

import { Toaster } from 'sonner';

export function AdminLayout() {
    return (
        <div className="flex min-h-screen">
            <div className="hidden md:flex w-[280px] flex-col fixed inset-y-0 z-50">
                <Sidebar className="h-full" />
            </div>
            <div className="flex-1 md:pl-[280px] flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
            <Toaster position="top-right" theme="system" />
        </div>
    );
}
