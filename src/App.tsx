import { useEffect, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WebOxyProvider, useAuth, useWebOxy } from '@oxyhq/auth'
import { BloomThemeProvider } from '@oxyhq/bloom/theme'
import { ImageResolverProvider } from '@oxyhq/bloom/image-resolver'
import { getSavedMode, getSavedPreset, applyUserColor, type ThemeMode, type AppColorName } from './theme'
import { LocaleProvider } from './contexts/LocaleContext'
import { setTokenGetter } from './api/client'

import AdminPage from './pages/AdminPage'
// import AskPage from './pages/AskPage'
// import Landing2 from './pages/Landing2'
// import Landing3 from './pages/Landing3'
import Landing4 from './pages/Landing4'
import PartnersPage from './pages/PartnersPage'
import CareersPage from './pages/CareersPage'
import PricingPage from './pages/PricingPage'
import NewsroomPage from './pages/NewsroomPage'
import NewsroomPostPage from './pages/NewsroomPostPage'
import BlogPage from './pages/BlogPage'
import CodeaPage from './pages/CodeaPage'
import CodexExtensionPage from './pages/CodexExtensionPage'
import OxyOSPage from './pages/OxyOSPage'
import TNPPage from './pages/TNPPage'
import TNPInstallPage from './pages/TNPInstallPage'
import CareerDetailPage from './pages/CareerDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import AIPage from './pages/AIPage'
import DashboardPage from './pages/DashboardPage'
import InitiativePage from './pages/InitiativePage'
import AIPricingPage from './pages/AIPricingPage'
import HelpPage from './pages/HelpPage'
import ChangelogPage from './pages/ChangelogPage'
import DocsPage from './pages/DocsPage'
import DocsIntroPage from './pages/DocsIntroPage'
import SettingsPage from './pages/SettingsPage'
import FixedPromptInput from './components/ui/FixedPromptInput'
import { AccountPanelProvider } from './contexts/AccountPanelContext'
import AppShell from './components/layout/AppShell'

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
      <Route index element={<Landing4 />} />
      {/* <Route path="landing2" element={<Landing2 />} /> */}
      {/* <Route path="landing3" element={<AskPage />} /> */}
      <Route path="partners" element={<PartnersPage />} />
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
      <Route path="ai" element={<AIPage />} />
      <Route path="ai/pricing" element={<AIPricingPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="initiative" element={<InitiativePage />} />
      <Route path="os" element={<OxyOSPage />} />
      <Route path="tnp" element={<TNPPage />} />
      <Route path="tnp/install" element={<TNPInstallPage />} />
      <Route path="settings" element={<SettingsPage />} />
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
                <AppShell>
                  <Routes>
                    <Route path="/admin/*" element={<AdminPage />} />
                    <Route path="/" element={<LocaleLayout />}>
                      {PublicRoutes()}
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                  <FixedPromptInput />
                </AppShell>
              </AccountPanelProvider>
            </BrowserRouter>
          </BloomThemeProvider>
        </AppSetup>
      </WebOxyProvider>
    </QueryClientProvider>
  )
}
