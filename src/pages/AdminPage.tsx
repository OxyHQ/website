import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@oxyhq/services'
import AdminLayout from '../components/admin/AdminLayout'
import { ADMIN_USERNAMES } from '../constants'
import SiteSettingsAdmin from '../components/admin/sections/SiteSettingsAdmin'
import SeoAdmin from '../components/admin/sections/SeoAdmin'
import NavigationAdmin from '../components/admin/sections/NavigationAdmin'
import FooterAdmin from '../components/admin/sections/FooterAdmin'
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
import BadgesAdmin from '../components/admin/sections/BadgesAdmin'
import ReferralsAdmin from '../components/admin/sections/ReferralsAdmin'
import MediaAdmin from '../components/admin/sections/MediaAdmin'
import NotFoundPage from './NotFoundPage'

export default function AdminPage() {
  const { user, isLoading } = useAuth()

  // Render as soon as a user is resolved. Waiting on `isLoading` first is not
  // safe here: the SDK's auth cold boot can stay pending indefinitely on this
  // origin, and because `/admin/*` is a top-level route (no shared layout),
  // returning null then blanks the entire page. `isAuthenticated` has the same
  // problem — it additionally requires that cold boot to resolve, so it stays
  // false for a signed-in admin and rendered this page as a 404.
  //
  // This check only decides whether to show the UI. Real authorization is
  // enforced server-side: every /api admin route runs adminOnly, which checks
  // the Oxy user id against OXY_ADMIN_USER_IDS (server/utils/adminAccess.ts).
  if (!user) {
    return isLoading ? null : <NotFoundPage />
  }
  if (!ADMIN_USERNAMES.includes(user.username)) {
    return <NotFoundPage />
  }

  return (
    <Routes>
      <Route index element={<Navigate to="settings" replace />} />
      <Route path="settings" element={<AdminLayout><SiteSettingsAdmin /></AdminLayout>} />
      <Route path="seo" element={<AdminLayout><SeoAdmin /></AdminLayout>} />
      <Route path="navigation" element={<AdminLayout><NavigationAdmin /></AdminLayout>} />
      <Route path="footer" element={<AdminLayout><FooterAdmin /></AdminLayout>} />
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
      <Route path="badges" element={<AdminLayout><BadgesAdmin /></AdminLayout>} />
      <Route path="referrals" element={<AdminLayout><ReferralsAdmin /></AdminLayout>} />
      <Route path="media" element={<AdminLayout><MediaAdmin /></AdminLayout>} />
      <Route path="*" element={<Navigate to="settings" replace />} />
    </Routes>
  )
}
