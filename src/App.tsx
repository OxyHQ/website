import { useState, useCallback, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WebOxyProvider, useAuth, useWebOxy } from '@oxyhq/auth'
import { BloomThemeProvider } from '@oxyhq/bloom/theme'
import { ImageResolverProvider } from '@oxyhq/bloom/image-resolver'
import { getSavedMode, getSavedPreset, applyUserColor, type ThemeMode, type AppColorName } from './theme'
import { LocaleProvider } from './contexts/LocaleContext'
import { setTokenGetter } from './api/client'
import { isFairCoinHost } from './lib/host'

import HomePage from './pages/HomePage'
import FairCoinLanding from './pages/FairCoinLanding'
import FairCoinBridgePage from './pages/FairCoinBridge'
import { AccountPanelProvider } from './contexts/AccountPanelContext'

const FixedPromptInput = lazy(() => import('./components/ui/FixedPromptInput'))
const AccountPanel = lazy(() => import('./components/layout/AccountPanel'))

const AdminPage = lazy(() => import('./pages/AdminPage'))
const PartnersPage = lazy(() => import('./pages/PartnersPage'))
const CareersPage = lazy(() => import('./pages/CareersPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const NewsroomPage = lazy(() => import('./pages/NewsroomPage'))
const NewsroomPostPage = lazy(() => import('./pages/NewsroomPostPage'))
const AcademyPage = lazy(() => import('./pages/AcademyPage'))
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'))
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
const HelpArticlePage = lazy(() => import('./pages/HelpArticlePage'))
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
const ManifestoPage = lazy(() => import('./pages/ManifestoPage'))
const TransparencyPage = lazy(() => import('./pages/TransparencyPage'))
const BusinessPage = lazy(() => import('./pages/BusinessPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const StatusPage = lazy(() => import('./pages/StatusPage'))
const ReferralsPage = lazy(() => import('./pages/ReferralsPage'))
const ReferralsDashboardPage = lazy(() => import('./pages/ReferralsDashboardPage'))

const OXY_API = 'https://api.oxy.so'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

function ScrollToTop() {
  const { pathname } = useLocation()
  // Derived-state pattern: scroll to top when the pathname changes without
  // reaching for useEffect. The compare runs during render, React batches the
  // resulting state update, and window.scrollTo executes synchronously.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }
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
  // On fairco.in (apex + www), the root path renders the FairCoin landing
  // natively instead of the Oxy homepage. Everything else on that host falls
  // through to NotFoundPage via the catch-all in App. On oxy.so the root
  // stays HomePage and /faircoin still resolves to the same landing.
  const onFairCoinHost = isFairCoinHost()
  const IndexElement = onFairCoinHost ? <FairCoinLanding /> : <HomePage />
  return (
    <>
      <Route index element={IndexElement} />
      {onFairCoinHost && <Route path="bridge" element={<FairCoinBridgePage />} />}
      <Route path="faircoin" element={<FairCoinLanding />} />
      <Route path="faircoin/bridge" element={<FairCoinBridgePage />} />
      <Route path="partners" element={<PartnersPage />} />
      <Route path="referrals" element={<ReferralsPage />} />
      <Route path="referrals/dashboard" element={<ReferralsDashboardPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="status" element={<StatusPage />} />
      <Route path="company" element={<CompanyPage />} />
      <Route path="company/team" element={<TeamPage />} />
      <Route path="company/manifesto" element={<ManifestoPage />} />
      <Route path="company/transparency" element={<TransparencyPage />} />
      <Route path="company/business" element={<BusinessPage />} />
      <Route path="company/careers" element={<CareersPage />} />
      <Route path="company/careers/:slug" element={<CareerDetailPage />} />
      <Route path="pricing" element={<PricingPage />} />
      <Route path="newsroom" element={<NewsroomPage />} />
      <Route path="newsroom/:slug" element={<NewsroomPostPage />} />
      <Route path="academy" element={<AcademyPage />} />
      <Route path="academy/:slug" element={<CourseDetailPage />} />
      <Route path="help" element={<HelpPage />} />
      <Route path="help/:slug" element={<HelpArticlePage />} />
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
