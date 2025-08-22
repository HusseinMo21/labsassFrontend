import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import WhatsAppChat from './components/WhatsAppChat'
import './index.css'
import router from './routes'
import theme from './theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
             <ThemeProvider theme={theme}>
           <CssBaseline />
           <RouterProvider router={router} />
           <WhatsAppChat />
         </ThemeProvider>
  </StrictMode>,
)
