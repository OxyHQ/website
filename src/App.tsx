import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import AskPage from './pages/AskPage'
import Landing2 from './pages/Landing2'
import Landing3 from './pages/Landing3'
import PartnersPage from './pages/PartnersPage'
import CareersPage from './pages/CareersPage'
import PricingPage from './pages/PricingPage'
import NewsroomPage from './pages/NewsroomPage'
import NotFoundPage from './pages/NotFoundPage'
import HelpPage from './pages/HelpPage'
import ChangelogPage from './pages/ChangelogPage'

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
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
