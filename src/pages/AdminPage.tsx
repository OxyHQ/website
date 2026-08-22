import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@oxyhq/services'
import * as Skeleton from '@oxyhq/bloom/skeleton'
import AdminLayout from '../components/admin/AdminLayout'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import { useAdminAccess } from '../hooks/useAdminAccess'
import SiteSettingsAdmin from '../components/admin/sections/SiteSettingsAdmin'
import SeoAdmin from '../components/admin/sections/SeoAdmin'
import HeroAdmin from '../components/admin/sections/HeroAdmin'
import PagesAdmin from '../components/admin/sections/PagesAdmin'
import ProductsAdmin from '../components/admin/sections/ProductsAdmin'
import CategoriesAdmin from '../components/admin/sections/CategoriesAdmin'
import NewsroomAdmin from '../components/admin/sections/NewsroomAdmin'
import CoursesAdmin from '../components/admin/sections/CoursesAdmin'
import ResourcesAdmin from '../components/admin/sections/ResourcesAdmin'
import HelpAdmin from '../components/admin/sections/HelpAdmin'
import PricingAdmin from '../components/admin/sections/PricingAdmin'
import TestimonialsAdmin from '../components/admin/sections/TestimonialsAdmin'
import ChangelogAdmin from '../components/admin/sections/ChangelogAdmin'
import JobsAdmin from '../components/admin/sections/JobsAdmin'
import TeamAdmin from '../components/admin/sections/TeamAdmin'
import McpTokensAdmin from '../components/admin/sections/McpTokensAdmin'
import LocalesAdmin from '../components/admin/sections/LocalesAdmin'
import BackupAdmin from '../components/admin/sections/BackupAdmin'
import CommentsAdmin from '../components/admin/sections/CommentsAdmin'
import FeaturesAdmin from '../components/admin/sections/FeaturesAdmin'
import ReposAdmin from '../components/admin/sections/ReposAdmin'
import BadgesAdmin from '../components/admin/sections/BadgesAdmin'
import ReferralsAdmin from '../components/admin/sections/ReferralsAdmin'
import MediaAdmin from '../components/admin/sections/MediaAdmin'

/** Shared chrome for the three non-admin outcomes below. */
function AdminGateScreen({ overline, title, children }: {
  overline: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <SEO title={title} description="Oxy website administration." canonicalPath="/admin" noIndex />
      <div className="w-full max-w-md text-center">
        <p className="text-overline text-muted-foreground">/ {overline}</p>
        <h1 className="mt-3 text-heading-responsive-sm">{title}</h1>
        {children}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { signIn } = useAuth()
  const { isAdmin, isAuthenticated, userId, username, isPending, isError, refetch } = useAdminAccess()

  // Authorization is the server's answer, never a guess made here — see
  // `useAdminAccess`. Each outcome below is a distinct, recoverable state:
  // earlier versions of this gate collapsed "still resolving" and "not allowed"
  // into a single terminal 404, which is how signed-in admins got locked out
  // whenever the SDK's auth cold boot resolved after the first render.

  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Skeleton.Box width={160} height={20} borderRadius={4} />
        <Skeleton.Box width={220} height={12} borderRadius={4} />
        <span className="sr-only">Checking admin access…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <AdminGateScreen overline="Status: unavailable" title="Couldn't verify access">
        <p className="mt-3 text-pretty text-muted-foreground">
          The website API didn't answer. Your session is fine — this is a connection problem.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="primary" size="md" onClick={() => void refetch()}>Try again</Button>
        </div>
      </AdminGateScreen>
    )
  }

  if (!isAuthenticated) {
    return (
      <AdminGateScreen overline="Status: signed out" title="Sign in to continue">
        <p className="mt-3 text-pretty text-muted-foreground">
          Administration requires an Oxy account with admin access.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="primary" size="md" onClick={() => signIn()}>Sign in</Button>
        </div>
      </AdminGateScreen>
    )
  }

  if (!isAdmin) {
    return (
      <AdminGateScreen overline="Status: 403" title="You don't have access">
        <p className="mt-3 text-pretty text-muted-foreground">
          You're signed in{username ? ` as @${username}` : ''}, but this account isn't an
          administrator.
        </p>
        {/* Shown so the exact value can be copied into OXY_ADMIN_USER_IDS on the
            backend — the allowlist is keyed on this id, not on the username. */}
        {userId && (
          <p className="mt-4 break-all rounded-md bg-surface px-3 py-2 font-mono text-xs text-muted-foreground">
            User ID: {userId}
          </p>
        )}
        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="md" href="/">Go to homepage</Button>
        </div>
      </AdminGateScreen>
    )
  }

  return (
    <Routes>
      <Route index element={<Navigate to="settings" replace />} />
      <Route path="settings" element={<AdminLayout><SiteSettingsAdmin /></AdminLayout>} />
      <Route path="seo" element={<AdminLayout><SeoAdmin /></AdminLayout>} />
      <Route path="hero" element={<AdminLayout><HeroAdmin /></AdminLayout>} />
      <Route path="pages" element={<AdminLayout><PagesAdmin /></AdminLayout>} />
      <Route path="products" element={<AdminLayout><ProductsAdmin /></AdminLayout>} />
      <Route path="categories" element={<AdminLayout><CategoriesAdmin /></AdminLayout>} />
      <Route path="newsroom" element={<AdminLayout><NewsroomAdmin /></AdminLayout>} />
      <Route path="courses" element={<AdminLayout><CoursesAdmin /></AdminLayout>} />
      <Route path="resources" element={<AdminLayout><ResourcesAdmin /></AdminLayout>} />
      <Route path="help" element={<AdminLayout><HelpAdmin /></AdminLayout>} />
      <Route path="pricing" element={<AdminLayout><PricingAdmin /></AdminLayout>} />
      <Route path="testimonials" element={<AdminLayout><TestimonialsAdmin /></AdminLayout>} />
      <Route path="changelog" element={<AdminLayout><ChangelogAdmin /></AdminLayout>} />
      <Route path="jobs" element={<AdminLayout><JobsAdmin /></AdminLayout>} />
      <Route path="team" element={<AdminLayout><TeamAdmin /></AdminLayout>} />
      <Route path="locales" element={<AdminLayout><LocalesAdmin /></AdminLayout>} />
      <Route path="mcp-tokens" element={<AdminLayout><McpTokensAdmin /></AdminLayout>} />
      <Route path="backup" element={<AdminLayout><BackupAdmin /></AdminLayout>} />
      <Route path="comments" element={<AdminLayout><CommentsAdmin /></AdminLayout>} />
      <Route path="features" element={<AdminLayout><FeaturesAdmin /></AdminLayout>} />
      <Route path="repos" element={<AdminLayout><ReposAdmin /></AdminLayout>} />
      <Route path="badges" element={<AdminLayout><BadgesAdmin /></AdminLayout>} />
      <Route path="referrals" element={<AdminLayout><ReferralsAdmin /></AdminLayout>} />
      <Route path="media" element={<AdminLayout><MediaAdmin /></AdminLayout>} />
      <Route path="*" element={<Navigate to="settings" replace />} />
    </Routes>
  )
}
