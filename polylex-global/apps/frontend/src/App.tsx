import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { authApi } from '@/api/client';
import { useAuthStore } from '@/store/auth.store';
import { useOtaUpdate } from '@/hooks/useOtaUpdate';
import { useReviewReminder } from '@/hooks/useReviewReminder';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import VocabularyPage from '@/pages/VocabularyPage';
import ReviewPage from '@/pages/ReviewPage';
import RoadmapPage from '@/pages/RoadmapPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import QuickNotePage from '@/pages/QuickNotePage';
import ProfilePage from '@/pages/ProfilePage';
import DialoguePage from '@/pages/DialoguePage';
import VideosPage from '@/pages/VideosPage';
import VideosHubPage from '@/pages/VideosHubPage';
import OnboardingPage from '@/pages/OnboardingPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import SupportPage from '@/pages/SupportPage';
import { QuickNoteProvider } from '@/contexts/QuickNoteContext';

function RequireAuth() {
  const isAuthed = useAuthStore((s) => !!s.accessToken);
  return isAuthed ? <Outlet /> : <Navigate to="/login" replace />;
}

/**
 * Wraps every authenticated page with the global quick-note system: a provider
 * (sheet + result popup + background AI polling + toasts) and a floating button
 * that lets the user capture a note from anywhere without leaving the page.
 */
function ProtectedShell() {
  return (
    <QuickNoteProvider>
      <Outlet />
    </QuickNoteProvider>
  );
}

export default function App() {
  useOtaUpdate();
  useReviewReminder();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setTokens = useAuthStore((s) => s.setTokens);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  // Wait for Zustand persist to rehydrate from localStorage before deciding
  // whether to issue a new demo session. Without this guard, the effect fires
  // with accessToken = null on the first render (before hydration completes),
  // creating a brand-new demo user on every page refresh.
  const [storeHydrated, setStoreHydrated] = useState(
    () => useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (storeHydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => setStoreHydrated(true));
    return unsub;
  }, [storeHydrated]);

  useEffect(() => {
    if (!storeHydrated) return;

    let isMounted = true;

    const bootstrapDemoSession = async () => {
      if (accessToken) {
        if (isMounted) {
          setIsBootstrapping(false);
        }
        return;
      }

      try {
        const demo = await authApi.issueDemoSession();
        if (!isMounted) {
          return;
        }
        setTokens(demo);
      } catch {
        // keep unauthenticated state; /login remains accessible
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrapDemoSession();

    return () => {
      isMounted = false;
    };
  }, [storeHydrated, accessToken, setTokens]);

  if (isBootstrapping) {
    return <div className="min-h-screen bg-[#0A0A14]" />;
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-card)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-line)',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/support" element={<SupportPage />} />

        {/* Protected */}
        <Route element={<RequireAuth />}>
          <Route element={<ProtectedShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="vocabulary" element={<VocabularyPage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="review/path/:userPathId" element={<ReviewPage />} />
            <Route path="review/:filter" element={<ReviewPage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="quick-notes" element={<QuickNotePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="dialogue/:pathStageId" element={<DialoguePage />} />
            <Route path="videos" element={<VideosHubPage />} />
            <Route path="videos/:pathStageId" element={<VideosPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
