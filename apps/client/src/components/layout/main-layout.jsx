/**
 * Main Layout Component
 * 
 * The primary layout wrapper for the application that provides the three-column structure:
 * - Left: Navigation sidebar (always visible)
 * - Center: Main content area (variable width based on route)
 * - Right: Trending/suggestions sidebar (conditionally hidden)
 * 
 * Layout Behavior:
 * - Chat and Werfie AI pages: Full-width content (no right sidebar)
 * - Other pages: Standard 600px content width with right sidebar
 * 
 * @component
 */

import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "./sidebar"
import { RightSidebar } from "./right-sidebar"
import CrisisBanner from "../crisis/CrisisBanner"

export default function MainLayout() {
    // Get current route to determine layout configuration
    const location = useLocation()

    /**
     * Determines if right sidebar should be hidden
     * Hidden on: /chat, /werfie-ai (full-width pages)
     * Visible on: all other routes
     */
    const hideRightSidebar = location.pathname === "/chat" ||
                             location.pathname === "/chat/settings" || 
                             location.pathname === "/werfie-ai" || 
                             location.pathname === "/settings/institutional" || 
                             location.pathname === "/announcements" || 
                             location.pathname === "/enterprise" ||
                             location.pathname === "/crisis-command" ||
                             location.pathname === "/soapbox" ||
                             location.pathname.startsWith("/soapbox/") ||
                             location.pathname === "/debate" ||
                             location.pathname.startsWith("/debate/")

    // On chat routes, keep the main sidebar icon-only (do not remove the chat page sidebar).
    const collapseMainSidebar = location.pathname === "/chat" || location.pathname === "/chat/settings"

    return (
        // Outer container: centers content and applies theme colors
        <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30">
            <CrisisBanner />
            {/* Inner container: max-width 1300px, three-column flex layout */}
            <div className="w-full max-w-[1300px] flex items-start mx-auto">
                {/* Left column: Navigation sidebar (88px collapsed, 275px expanded) */}
                <Sidebar forceCollapsed={collapseMainSidebar} />

                {/* Center column: Main content area with dynamic width */}
                <main className={`flex-1 ${hideRightSidebar ? 'max-w-full' : 'max-w-[600px]'} min-h-screen border-r border-l border-border/50`}>
                    {/* React Router outlet - renders current route's component */}
                    <Outlet />
                </main>

                {/* Right column: Trending/suggestions sidebar (conditionally rendered) */}
                {!hideRightSidebar && <RightSidebar />}
            </div>
        </div>
    )
}
