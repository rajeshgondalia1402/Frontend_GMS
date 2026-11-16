import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initPwa } from './lib/pwa'
import './index.css'

// Before React mounts, so an early `beforeinstallprompt` is not missed.
initPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
