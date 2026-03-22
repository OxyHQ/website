import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AskPage from './pages/AskPage'
import Landing2 from './pages/Landing2'
import PartnersPage from './pages/PartnersPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AskPage />} />
        <Route path="/landing2" element={<Landing2 />} />
        <Route path="/partners" element={<PartnersPage />} />
      </Routes>
    </BrowserRouter>
  )
}
