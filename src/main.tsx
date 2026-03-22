import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import CssBaseline from '@mui/material/CssBaseline'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import WhatsAppChat from './components/WhatsAppChat'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import './index.css'
import router from './routes'

function AppChrome() {
  const { locale } = useLanguage()
  return (
    <>
      <RouterProvider router={router} />
      <WhatsAppChat />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={locale === 'ar'}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <CssBaseline />
      <AuthProvider>
        <AppChrome />
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
