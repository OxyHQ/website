import { useState, useCallback, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OxyProvider, useOxy } from '@oxyhq/services'
import type { User } from '@oxyhq/core'
import { BloomThemeProvider } from '@oxyhq/bloom/theme'
import { ImageResolverProvider } from '@oxyhq/bloom/image-resolver'
import { getSavedMode, getSavedPreset, applyUserColor, type ThemeMode, type AppColorName } from './theme'
import { LocaleProvider } from './lib/i18n'
import { setOxyServices } from './api/client'
import { isFairCoinHost } from './lib/host'
import ErrorBoundary from './components/ErrorBoundary'

import HomePage from './pages/HomePage'
import FairCoinLanding from './pages/FairCoinLanding'
const FairCoinBridgePage = lazy(() => import('./pages/FairCoinBridge'))
const FairCoinBuyPage = lazy(() => import('./pages/FairCoinBuy'))
const FairCoinUnwrapPage = lazy(() => import('./pages/FairCoinUnwrap'))
const FairCoinWalletPage = lazy(() => import('./pages/FairCoinWallet'))
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
const LessonPage = lazy(() => import('./pages/LessonPage'))
const BlogPage = lazy(() => import('./pages/BlogPage'))
const CodeaPage = lazy(() => import('./pages/CodeaPage'))
const CodexExtensionPage = lazy(() => import('./pages/CodexExtensionPage'))
const OxyOSPage = lazy(() => import('./pages/OxyOSPage'))
const TNPPage = lazy(() => import('./pages/TNPPage'))
const TNPInstallPage = lazy(() => import('./pages/TNPInstallPage'))
const HomiioPage = lazy(() => import('./pages/HomiioPage'))
const MentionPage = lazy(() => import('./pages/MentionPage'))
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
const DocsThumbnailPage = lazy(() => import('./pages/DocsThumbnailPage'))
const BloomPlayground = lazy(() => import('./components/docs/BloomPlayground'))
const DevelopersPage = lazy(() => import('./pages/DevelopersPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'))
const UserFollowersPage = lazy(() => import('./pages/UserFollowersPage'))
const FeatureBoardPage = lazy(() => import('./pages/FeatureBoardPage'))
const AstroPage = lazy(() => import('./pages/AstroPage'))
const AIPage = lazy(() => import('./pages/AIPage'))
const CompanyPage = lazy(() => import('./pages/CompanyPage'))
const TeamPage = lazy(() => import('./pages/TeamPage'))
const ManifestoPage = lazy(() => import('./pages/ManifestoPage'))
const TransparencyPage = lazy(() => import('./pages/TransparencyPage'))
const BusinessPage = lazy(() => import('./pages/BusinessPage'))
const TechnologiesPage = lazy(() => import('./pages/TechnologiesPage'))
const StatusPage = lazy(() => import('./pages/StatusPage'))
const ReferralsPage = lazy(() => import('./pages/ReferralsPage'))
const ReferralsDashboardPage = lazy(() => import('./pages/ReferralsDashboardPage'))
const SustainPage = lazy(() => import('./pages/SustainPage'))

// Oxy platform API base URL. Sourced from the website's standard `VITE_*` env
// convention so deploys can override it, with the production URL as the
// committed default.
const OXY_API =
  (import.meta.env.VITE_OXY_API as string | undefined) || 'https://api.oxy.so'

// Registered Oxy OAuth client id for the public website. Sourced from the
// website's standard `VITE_*` env convention so deploys can override it, with
// the registered production client id as the committed default.
const OXY_CLIENT_ID =
  (import.meta.env.VITE_OXY_CLIENT_ID as string | undefined) ||
  'oxy_dk_e572a3df046f98c2c29098f1349a7927183751e08ca2b757'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  // Derived-state pattern: react to location changes during render without
  // reaching for useEffect. Track the last (pathname, hash) tuple and pick
  // one of two behaviours when it changes:
  //
  //   1. hash present → defer to rAF so the target element has had a chance
  //      to render, then `scrollIntoView` on it. Falls back to scrollTo(0,0)
  //      if the element is missing.
  //   2. no hash      → scroll to top synchronously (original behaviour).
  //
  // rAF is needed for case 1 because react-router updates `location`
  // synchronously during render — the new page hasn't mounted yet at this
  // point, so `getElementById` would return null.
  const [lastKey, setLastKey] = useState(`${pathname}${hash}`)
  const currentKey = `${pathname}${hash}`
  if (lastKey !== currentKey) {
    setLastKey(currentKey)
    if (typeof window !== 'undefined') {
      if (hash) {
        const targetId = hash.slice(1)
        requestAnimationFrame(() => {
          const el = document.getElementById(targetId)
          if (el) {
            el.scrollIntoView({ block: 'start' })
          } else {
            window.scrollTo(0, 0)
          }
        })
      } else {
        window.scrollTo(0, 0)
      }
    }
  }
  return null
}

function AppSetup({ children }: { children: React.ReactNode }) {
  const { oxyServices } = useOxy()

  // Wire the website's own-backend fetch client to the SDK session so every
  // /api call carries the current bearer token without manual token plumbing.
  setOxyServices(oxyServices)

  // Resolve Bloom image file IDs to download URLs. The optional `variant`
  // selects the rendition (e.g. 'thumb') and is forwarded from Avatar's
  // variant prop — the single chokepoint for cloud.oxy.so URL construction.
  const resolveImage = useCallback(
    (fileId: string, variant?: string): string | undefined => {
      if (!fileId) return undefined
      if (fileId.startsWith('http')) return fileId
      return oxyServices.getFileDownloadUrl(fileId, variant)
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
  // The SPA serves two brands. On fairco.in only the FairCoin surface is
  // mounted; every Oxy route falls through to NotFoundPage. On oxy.so the
  // FairCoin landing + bridge are mounted under /faircoin alongside the full
  // Oxy site. Same SPA, hostname picks which routes exist.
  if (isFairCoinHost()) {
    return (
      <>
        <Route index element={<FairCoinLanding />} />
        <Route path="buy" element={<FairCoinBuyPage />} />
        <Route path="unwrap" element={<FairCoinUnwrapPage />} />
        <Route path="redeem" element={<FairCoinUnwrapPage />} />
        <Route path="bridge" element={<FairCoinBridgePage />} />
        <Route path="wallet" element={<FairCoinWalletPage />} />
      </>
    )
  }
  return (
    <>
      <Route index element={<HomePage />} />
      <Route path="faircoin" element={<FairCoinLanding />} />
      <Route path="faircoin/buy" element={<FairCoinBuyPage />} />
      <Route path="faircoin/unwrap" element={<FairCoinUnwrapPage />} />
      <Route path="faircoin/redeem" element={<FairCoinUnwrapPage />} />
      <Route path="faircoin/bridge" element={<FairCoinBridgePage />} />
      <Route path="faircoin/wallet" element={<FairCoinWalletPage />} />
      <Route path="partners" element={<PartnersPage />} />
      <Route path="referrals" element={<ReferralsPage />} />
      <Route path="referrals/dashboard" element={<ReferralsDashboardPage />} />
      <Route path="technologies" element={<TechnologiesPage />} />
      <Route path="products" element={<Navigate to="/technologies" replace />} />
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
      <Route path="academy/:slug/:lesson" element={<LessonPage />} />
      <Route path="help" element={<HelpPage />} />
      <Route path="help/*" element={<HelpArticlePage />} />
      <Route path="changelog" element={<ChangelogPage />} />
      <Route path="developers" element={<DevelopersPage />} />
      <Route path="developers/docs" element={<DocsIntroPage />} />
      <Route path="developers/docs/_thumbnail/:name" element={<DocsThumbnailPage />} />
      <Route path="developers/docs/api" element={<DocsPage />} />
      <Route path="developers/docs/api/:version" element={<DocsPage />} />
      {/*
        Interactive Bloom playground.

        Mounted before the generic docs catch-alls so its `playground`
        slug resolves to the interactive page instead of routing through
        DocsPage (which would return a 404 since there's no MDX file
        with that slug in the typedoc output).
      */}
      <Route path="developers/docs/bloom/playground" element={<BloomPlayground />} />
      <Route path="developers/docs/bloom/:version/playground" element={<BloomPlayground />} />
      {/*
        Docs routing.

        Versioned packages (SDKs, libraries, REST APIs) use the explicit
        `:version` segment. Non-versioned end-user apps (Accounts, Inbox,
        Console, Mention, Allo, ...) skip the version segment entirely —
        the deepest catch-all `:package/*` below handles their slugs.

        `DocsPage` resolves the route by reading the package's
        `docs.config.json`: if `versioned: true`, the URL must include a
        version (otherwise it redirects to `latestVersion`); if missing,
        the catch-all matches and renders directly without redirect.
      */}
      <Route path="developers/docs/:package" element={<DocsPage />} />
      <Route path="developers/docs/:package/:version" element={<DocsPage />} />
      <Route path="developers/docs/:package/:version/*" element={<DocsPage />} />
      <Route path="developers/docs/:package/*" element={<DocsPage />} />
      <Route path="company/news" element={<BlogPage />} />
      <Route path="codea" element={<CodeaPage />} />
      <Route path="codea/extension" element={<CodexExtensionPage />} />
      <Route path="inbox" element={<InboxPage />} />
      <Route path="ai" element={<AIPage />} />
      <Route path="ai/pricing" element={<AIPricingPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route
        path="initiative"
        element={
          <ErrorBoundary>
            <InitiativePage />
          </ErrorBoundary>
        }
      />
      <Route path="os" element={<OxyOSPage />} />
      <Route path="tnp" element={<TNPPage />} />
      <Route path="tnp/install" element={<TNPInstallPage />} />
      <Route path="homiio" element={<HomiioPage />} />
      <Route path="mention" element={<MentionPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="legal" element={<LegalPage />} />
      <Route path="legal/:section" element={<LegalPage />} />
      <Route path="u/:username" element={<UserProfilePage />} />
      <Route path="u/:username/followers" element={<UserFollowersPage initialTab="followers" />} />
      <Route path="u/:username/following" element={<UserFollowersPage initialTab="following" />} />
      <Route path="astro" element={<AstroPage />} />
      <Route path="features" element={<FeatureBoardPage />} />
      <Route path="sustain" element={<SustainPage />} />
    </>
  )
}

export default function App() {
  const [mode] = useState<ThemeMode>(getSavedMode)
  // `getSavedPreset()` is host-aware — on the FairCoin apex it always returns
  // `'faircoin'`, ignoring the localStorage value. So Bloom's faircoin preset
  // is what gets written to `:root` for the entire document. On oxy.so the
  // saved preset wins for the whole site, including `/faircoin/*` — those
  // routes intentionally render as Oxy subpages with Oxy chrome and Oxy
  // theme, only the page body shows FairCoin content. The full FairCoin
  // brand (green Bloom theme + dedicated nav/footer) only takes over on
  // fairco.in itself.
  const [preset] = useState<AppColorName>(getSavedPreset)
  // `applyUserColor()` is also host-aware (no-op on FairCoin), but we forward
  // it through here so the auth event still fires for any future hooks.
  const handleAuthChange = useCallback(
    (user: unknown) => applyUserColor((user as User | null)?.color),
    [],
  )

  return (
    <QueryClientProvider client={queryClient}>
      <OxyProvider
        baseURL={OXY_API}
        clientId={OXY_CLIENT_ID}
        queryClient={queryClient}
        onAuthStateChange={handleAuthChange}
      >
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
      </OxyProvider>
    </QueryClientProvider>
  )
}
