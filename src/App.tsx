import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import AskPage from './pages/AskPage'
import Landing2 from './pages/Landing2'
import Landing3 from './pages/Landing3'
import PartnersPage from './pages/PartnersPage'
import CareersPage from './pages/CareersPage'
import PricingPage from './pages/PricingPage'
import NewsroomPage from './pages/NewsroomPage'
import BlogPage from './pages/BlogPage'
import NotFoundPage from './pages/NotFoundPage'
import HelpPage from './pages/HelpPage'
import ChangelogPage from './pages/ChangelogPage'
import DocsPage from './pages/DocsPage'
import DocsIntroPage from './pages/DocsIntroPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<AskPage />} />
        <Route path="/landing2" element={<Landing2 />} />
        <Route path="/landing3" element={<Landing3 />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/company/careers" element={<CareersPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/newsroom" element={<NewsroomPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/developers/docs" element={<DocsIntroPage />} />
        <Route path="/developers/docs/overview" element={<DocsPage />} />
        <Route path="/company/news" element={<BlogPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
