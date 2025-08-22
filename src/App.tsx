import { Routes, Route } from 'react-router-dom'
import SignIn from './pages/auth/SignIn'
import MedicalLanding from './components/MedicalLanding'
import Services from './components/Services'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MedicalLanding />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/services" element={<Services />} />
    </Routes>
  )
}

export default App