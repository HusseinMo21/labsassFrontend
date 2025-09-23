import { Routes, Route } from 'react-router-dom'
import MedicalLanding from './components/MedicalLanding'
import Services from './components/Services'
import Contact from './components/Contact'

function App() {
  return (
    <Routes>
      <Route path="*" element={<MedicalLanding />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  )
}

export default App
