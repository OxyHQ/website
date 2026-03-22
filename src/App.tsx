import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AskPage from './pages/AskPage'
import Landing2 from './pages/Landing2'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AskPage />} />
        <Route path="/landing2" element={<Landing2 />} />
      </Routes>
    </BrowserRouter>
  )
}
