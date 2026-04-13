import { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WebOxyProvider, useAuth, useWebOxy } from '@oxyhq/auth'
import { BloomThemeProvider } from '@oxyhq/bloom/theme'
import { ImageResolverProvider } from '@oxyhq/bloom/image-resolver'
import { getSavedMode, getSavedPreset, applyUserColor, type ThemeMode, type AppColorName } from './theme'
import { LocaleProvider } from './contexts/LocaleContext'
import { setTokenGetter } from './api/client'

import HomePage from './pages/HomePage'
import { AccountPanelProvider } from './contexts/AccountPanelContext'

const FixedPromptInput = lazy(() => import('./components/ui/FixedPromptInput'))
const AccountPanel = lazy(() => import('./components/layout/AccountPanel'))

const AdminPage = lazy(() => import('./pages/AdminPage'))
const PartnersPage = lazy(() => import('./pages/PartnersPage'))
const CareersPage = lazy(() => import('./pages/CareersPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const NewsroomPage = lazy(() => import('./pages/NewsroomPage'))
const NewsroomPostPage = lazy(() => import('./pages/NewsroomPostPage'))
const BlogPage = lazy(() => import('./pages/BlogPage'))
const CodeaPage = lazy(() => import('./pages/CodeaPage'))
const CodexExtensionPage = lazy(() => import('./pages/CodexExtensionPage'))
const OxyOSPage = lazy(() => import('./pages/OxyOSPage'))
const TNPPage = lazy(() => import('./pages/TNPPage'))
const TNPInstallPage = lazy(() => import('./pages/TNPInstallPage'))
const CareerDetailPage = lazy(() => import('./pages/CareerDetailPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const InboxPage = lazy(() => import('./pages/InboxPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const InitiativePage = lazy(() => import('./pages/InitiativePage'))
const AIPricingPage = lazy(() => import('./pages/AIPricingPage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'))
const DocsPage = lazy(() => import('./pages/DocsPage'))
const DocsIntroPage = lazy(() => import('./pages/DocsIntroPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'))
const FeatureBoardPage = lazy(() => import('./pages/FeatureBoardPage'))
const AstroPage = lazy(() => import('./pages/AstroPage'))
const AIPage = lazy(() => import('./pages/AIPage'))
const CompanyPage = lazy(() => import('./pages/CompanyPage'))
const TeamPage = lazy(() => import('./pages/TeamPage'))

const OXY_API = 'https://api.oxy.so'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function AppSetup({ children }: { children: React.ReactNode }) {
  const { authManager } = useAuth()
  const { oxyServices } = useWebOxy()

  // Set API client auth token getter (same pattern as console)
  setTokenGetter(() => authManager.getAccessToken())

  // Resolve Bloom image file IDs to download URLs
  const resolveImage = useCallback(
    (fileId: string): string | undefined => {
      if (!fileId) return undefined
      if (fileId.startsWith('http')) return fileId
      return oxyServices.getFileDownloadUrl(fileId, 'thumb')
    },
    [oxyServices],
  )

  return <ImageResolverProvider value={resolveImage}>{children}</ImageResolverProvider>
}

function LocaleLayout() {
  return (
    <LocaleProvider>
      <Outlet />
    </LocaleProvider>
  )
}

function PublicRoutes() {
  return (
    <>
      <Route index element={<HomePage />} />
      <Route path="partners" element={<PartnersPage />} />
      <Route path="company" element={<CompanyPage />} />
      <Route path="company/team" element={<TeamPage />} />
      <Route path="company/careers" element={<CareersPage />} />
      <Route path="company/careers/:slug" element={<CareerDetailPage />} />
      <Route path="pricing" element={<PricingPage />} />
      <Route path="newsroom" element={<NewsroomPage />} />
      <Route path="newsroom/:slug" element={<NewsroomPostPage />} />
      <Route path="help" element={<HelpPage />} />
      <Route path="changelog" element={<ChangelogPage />} />
      <Route path="developers/docs" element={<DocsIntroPage />} />
      <Route path="developers/docs/overview" element={<DocsPage />} />
      <Route path="company/news" element={<BlogPage />} />
      <Route path="codea" element={<CodeaPage />} />
      <Route path="codea/extension" element={<CodexExtensionPage />} />
      <Route path="inbox" element={<InboxPage />} />
      <Route path="ai" element={<AIPage />} />
      <Route path="ai/pricing" element={<AIPricingPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="initiative" element={<InitiativePage />} />
      <Route path="os" element={<OxyOSPage />} />
      <Route path="tnp" element={<TNPPage />} />
      <Route path="tnp/install" element={<TNPInstallPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="legal" element={<LegalPage />} />
      <Route path="legal/:section" element={<LegalPage />} />
      <Route path="u/:username" element={<UserProfilePage />} />
      <Route path="astro" element={<AstroPage />} />
      <Route path="features" element={<FeatureBoardPage />} />
    </>
  )
}

export default function App() {
  const [mode] = useState<ThemeMode>(getSavedMode)
  const [preset] = useState<AppColorName>(getSavedPreset)

  return (
    <QueryClientProvider client={queryClient}>
      <WebOxyProvider baseURL={OXY_API} onAuthStateChange={(user) => applyUserColor(user?.color)}>
        <AppSetup>
          <BloomThemeProvider mode={mode} colorPreset={preset}>
            <BrowserRouter>
              <AccountPanelProvider>
                <ScrollToTop />
                <Suspense fallback={<div className="min-h-screen" />}>
                  <Routes>
                    <Route path="/admin/*" element={<AdminPage />} />
                    <Route path="/" element={<LocaleLayout />}>
                      {PublicRoutes()}
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                  <FixedPromptInput />
                  <AccountPanel />
                </Suspense>
              </AccountPanelProvider>
            </BrowserRouter>
          </BloomThemeProvider>
        </AppSetup>
      </WebOxyProvider>
    </QueryClientProvider>
  )
}
