import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom"
import MainLayout from "@/components/layout/main-layout"
import AuthLayout from "@/components/layout/auth-layout"
import Home from "@/pages/home"
import Login from "@/pages/login"
import Register from "@/pages/register"
import Notifications from "@/pages/notifications"
import Follow from "@/pages/follow"
import Chat from "@/pages/chat"
import ChatSettings from "@/pages/chat-settings"
import Explore from "@/pages/explore"
import Profile from "@/pages/profile"
import Lists from "@/pages/lists"
import ListDetail from "@/pages/list-detail"
import Business from "@/pages/business"
import Ads from "@/pages/ads"
import Spaces from "@/pages/spaces"
import CreatorStudio from "@/pages/creator-studio"
import Settings from "@/pages/settings"
import AudienceTaggingSettings from "@/pages/settings/audience-tagging"
import PhotoTaggingSettings from "@/pages/settings/photo-tagging"
import MuteAndBlockSettings from "@/pages/settings/mute-and-block"
import MuteBlockPlaceholder from "@/pages/settings/mute-block-placeholder"
import BlockedAccountsSettings from "@/pages/settings/blocked-accounts"
import MutedAccountsSettings from "@/pages/settings/muted-accounts"
import MutedWordsSettings from "@/pages/settings/muted-words"
import MutedNotificationsSettings from "@/pages/settings/muted-notifications"
import InstitutionalSetup from "@/pages/institutional-setup"
import Announcements from "@/pages/announcements"
import AnnouncementDetail from "@/pages/announcement-detail"
import ModerationPanel from "./pages/moderation-panel"
import WorldLeadersPage from "@/pages/world-leaders"
import LeaderProfilePage from "@/pages/leader-profile"
import Bookmarks from "@/pages/bookmarks"
import WerfieAI from "@/pages/werfie-ai"
import SearchPage from "@/pages/search"
import { Analytics, MediaLibrary, ScheduledPosts, AudienceInsights, PostDetail } from "@/pages/creator-tools"
import Monetization from "@/pages/monetization/index"
import EnterpriseDashboard from "@/pages/enterprise-dashboard"
import CrisisCommand from "@/pages/crisis-command"
import SoapboxView from "@/pages/soapbox-view"
import Soapbox from "@/pages/soapbox"
import DebateView from "@/pages/debate-view"
import Debate from "@/pages/debate"
import ArticleEditor from "@/pages/articles/ArticleEditor"
import ArticleDetail from "@/pages/articles/ArticleDetail"

import { AuthModalProvider } from "./components/auth/auth-modal-context"
import { AuthModal } from "./components/auth/auth-modal"
import { AuthProvider } from "./context/AuthContext"
import { SocketProvider } from "./context/SocketContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Toaster } from "sonner"

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AuthModalProvider>
            <Toaster position="bottom-center" richColors theme="dark" />
            <AuthModal />
            <Routes>
              {/* Protected Routes - Require Login */}
              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route path="/" element={<Home />} />
                <Route path="/posts" element={<Navigate to="/" replace />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/follow" element={<Follow />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/settings" element={<ChatSettings />} />
                <Route path="/profile/:userId?" element={<Profile />} />
                <Route path="/search" element={<SearchPage />} />

                {/* More Menu Routes */}
                {/* More Menu Routes */}
                <Route path="/creator-studio" element={<CreatorStudio />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/media/library" element={<MediaLibrary />} />
                <Route path="/scheduled-posts" element={<ScheduledPosts />} />
                <Route path="/audience-insights" element={<AudienceInsights />} />
                <Route path="/post/:id" element={<PostDetail />} />

                <Route path="/lists" element={<Lists />} />
                <Route path="/lists/:id" element={<ListDetail />} />
                <Route path="/spaces" element={<Spaces />} />
                <Route path="/werfie-ai" element={<WerfieAI />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/institutional" element={<InstitutionalSetup />} />
                <Route path="/settings/audience-and-tagging" element={<AudienceTaggingSettings />} />
                <Route path="/settings/photo-tagging" element={<PhotoTaggingSettings />} />
                <Route path="/settings/mute-and-block" element={<MuteAndBlockSettings />} />
                <Route path="/settings/blocked-accounts" element={<BlockedAccountsSettings />} />
                <Route path="/settings/muted-accounts" element={<MutedAccountsSettings />} />
                <Route path="/settings/muted-words" element={<MutedWordsSettings />} />
                <Route path="/settings/muted-notifications" element={<MutedNotificationsSettings />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/announcements/:id" element={<AnnouncementDetail />} />
                <Route path="/moderation" element={<ModerationPanel />} />
                <Route path="/world-leaders" element={<WorldLeadersPage />} />
                <Route path="/leaders/:id" element={<LeaderProfilePage />} />
                <Route path="/enterprise" element={<EnterpriseDashboard />} />
                <Route path="/crisis-command" element={<CrisisCommand />} />
                <Route path="/soapbox/:id" element={<SoapboxView />} />
                <Route path="/soapbox" element={<Soapbox />} />
                <Route path="/debate/:id" element={<DebateView />} />
                <Route path="/debate" element={<Debate />} />
                <Route path="/articles/new" element={<ArticleEditor />} />
                <Route path="/articles/edit/:id" element={<ArticleEditor />} />
                <Route path="/article/:id" element={<ArticleDetail />} />
              </Route>

              {/* Protected Standalone Layouts (No Main Sidebar) */}
              <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                 <Route path="/business" element={<Business />} />
                 <Route path="/ads" element={<Ads />} />
                 <Route path="/monetization/*" element={<Monetization />} />
              </Route>

              {/* Public Routes - No Login Required */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Register />} />
              </Route>
            </Routes>
          </AuthModalProvider>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
