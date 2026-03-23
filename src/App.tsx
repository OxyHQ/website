import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WebOxyProvider, useWebOxy } from '@oxyhq/auth'
import { BloomThemeProvider } from '@oxyhq/bloom/theme'
import { ImageResolverProvider } from '@oxyhq/bloom/image-resolver'
import { getSavedMode, getSavedPreset, applyUserColor, type ThemeMode, type AppColorName } from './theme'
import { LocaleProvider } from './contexts/LocaleContext'
import { initApiClient } from './api/client'

import AdminPage from './pages/AdminPage'
import AskPage from './pages/AskPage'
import Landing2 from './pages/Landing2'
import Landing3 from './pages/Landing3'
import PartnersPage from './pages/PartnersPage'
import CareersPage from './pages/CareersPage'
import PricingPage from './pages/PricingPage'
import NewsroomPage from './pages/NewsroomPage'
import BlogPage from './pages/BlogPage'
import CodeaPage from './pages/CodeaPage'
import CodexExtensionPage from './pages/CodexExtensionPage'
import OxyOSPage from './pages/OxyOSPage'
import CareerDetailPage from './pages/CareerDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import HelpPage from './pages/HelpPage'
import ChangelogPage from './pages/ChangelogPage'
import DocsPage from './pages/DocsPage'
import DocsIntroPage from './pages/DocsIntroPage'
import SettingsPage from './pages/SettingsPage'
import FixedPromptInput from './components/ui/FixedPromptInput'

const OXY_API = 'https://api.oxy.so'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

/**
 * Bridges @oxyhq/auth's OxyServices to Bloom's ImageResolverProvider.
 * Must be rendered inside WebOxyProvider so useWebOxy() is available.
 */
function OxyImageResolver({ children }: { children: ReactNode }) {
  const { oxyServices } = useWebOxy()

  useEffect(() => { initApiClient(oxyServices) }, [oxyServices])

  const resolve = useCallback(
    (fileId: string): string | undefined => {
      if (!fileId) return undefined
      if (fileId.startsWith('http')) return fileId
      return oxyServices.getFileDownloadUrl(fileId, 'thumb')
    },
    [oxyServices],
  )

  return <ImageResolverProvider value={resolve}>{children}</ImageResolverProvider>
}

function LocaleLayout() {
  return (
    <LocaleProvider>
      <Outlet />
    </LocaleProvider>
  )
}

/** Public routes that support locale prefix */
function PublicRoutes() {
  return (
    <>
      <Route index element={<AskPage />} />
      <Route path="landing2" element={<Landing2 />} />
      <Route path="landing3" element={<Landing3 />} />
      <Route path="partners" element={<PartnersPage />} />
      <Route path="company/careers" element={<CareersPage />} />
      <Route path="careers/:slug" element={<CareerDetailPage />} />
      <Route path="pricing" element={<PricingPage />} />
      <Route path="newsroom" element={<NewsroomPage />} />
      <Route path="help" element={<HelpPage />} />
      <Route path="changelog" element={<ChangelogPage />} />
      <Route path="developers/docs" element={<DocsIntroPage />} />
      <Route path="developers/docs/overview" element={<DocsPage />} />
      <Route path="company/news" element={<BlogPage />} />
      <Route path="codea" element={<CodeaPage />} />
      <Route path="codea/extension" element={<CodexExtensionPage />} />
      <Route path="os" element={<OxyOSPage />} />
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
        <OxyImageResolver>
          <BloomThemeProvider mode={mode} colorPreset={preset}>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                {/* Admin routes — outside locale system */}
                <Route path="/admin/*" element={<AdminPage />} />

                {/* Public routes — default locale (no prefix) */}
                <Route path="/" element={<LocaleLayout />}>
                  {PublicRoutes()}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
              <FixedPromptInput />
            </BrowserRouter>
          </BloomThemeProvider>
        </OxyImageResolver>
      </WebOxyProvider>
    </QueryClientProvider>
  )
}
