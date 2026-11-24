import { createRoot } from 'react-dom/client'
import App from './App'
import { initPwa } from './lib/pwa'
import './index.css'

// Before React mounts, so an early `beforeinstallprompt` is not missed.
initPwa()

// No <StrictMode>: in development it mounts every page twice on purpose, which
// sent each page's API calls twice under `npm run dev` (e.g. opening Vehicles
// fired GET /auth/vehicle two times). Production builds were never affected.
createRoot(document.getElementById('root')!).render(<App />)
