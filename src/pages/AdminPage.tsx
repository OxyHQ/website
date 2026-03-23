import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@oxyhq/auth'
import AdminLayout, { ADMIN_USERNAMES } from '../components/admin/AdminLayout'
import SiteSettingsAdmin from '../components/admin/sections/SiteSettingsAdmin'
import NavigationAdmin from '../components/admin/sections/NavigationAdmin'
import FooterAdmin from '../components/admin/sections/FooterAdmin'
import PagesAdmin from '../components/admin/sections/PagesAdmin'
import NewsroomAdmin from '../components/admin/sections/NewsroomAdmin'
import PricingAdmin from '../components/admin/sections/PricingAdmin'
import TestimonialsAdmin from '../components/admin/sections/TestimonialsAdmin'
import ChangelogAdmin from '../components/admin/sections/ChangelogAdmin'
import JobsAdmin from '../components/admin/sections/JobsAdmin'
import McpTokensAdmin from '../components/admin/sections/McpTokensAdmin'
import LocalesAdmin from '../components/admin/sections/LocalesAdmin'
import NotFoundPage from './NotFoundPage'

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null
  if (!isAuthenticated || !user || !ADMIN_USERNAMES.includes(user.username)) {
    return <NotFoundPage />
  }

  return (
    <Routes>
      <Route index element={<Navigate to="settings" replace />} />
      <Route path="settings" element={<AdminLayout><SiteSettingsAdmin /></AdminLayout>} />
      <Route path="navigation" element={<AdminLayout><NavigationAdmin /></AdminLayout>} />
      <Route path="footer" element={<AdminLayout><FooterAdmin /></AdminLayout>} />
      <Route path="pages" element={<AdminLayout><PagesAdmin /></AdminLayout>} />
      <Route path="newsroom" element={<AdminLayout><NewsroomAdmin /></AdminLayout>} />
      <Route path="pricing" element={<AdminLayout><PricingAdmin /></AdminLayout>} />
      <Route path="testimonials" element={<AdminLayout><TestimonialsAdmin /></AdminLayout>} />
      <Route path="changelog" element={<AdminLayout><ChangelogAdmin /></AdminLayout>} />
      <Route path="jobs" element={<AdminLayout><JobsAdmin /></AdminLayout>} />
      <Route path="locales" element={<AdminLayout><LocalesAdmin /></AdminLayout>} />
      <Route path="mcp-tokens" element={<AdminLayout><McpTokensAdmin /></AdminLayout>} />
      <Route path="*" element={<Navigate to="settings" replace />} />
    </Routes>
  )
}
