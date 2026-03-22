import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AskPage from './pages/AskPage'
import Landing2 from './pages/Landing2'
import Landing3 from './pages/Landing3'
import PartnersPage from './pages/PartnersPage'
import CareersPage from './pages/CareersPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AskPage />} />
        <Route path="/landing2" element={<Landing2 />} />
        <Route path="/landing3" element={<Landing3 />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/company/careers" element={<CareersPage />} />
      </Routes>
    </BrowserRouter>
  )
}
