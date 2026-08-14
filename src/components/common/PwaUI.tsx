import { useEffect, useState } from 'react'
import { Download, WifiOff, Wifi, X } from 'lucide-react'
import { Button } from '@/components/ui'

/** Install prompt — mock UI, appears once per session after a short delay. */
export function InstallPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem('pwa-install-dismissed')
    if (dismissed) return
    const t = setTimeout(() => setVisible(true), 4000)
    return () => clearTimeout(t)
  }, [])

  function close() {
    setVisible(false)
    sessionStorage.setItem('pwa-install-dismissed', '1')
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-4 sm:left-auto sm:right-4 sm:px-0">
      <div className="mx-auto flex max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Install GaragePro</p>
          <p className="mt-0.5 text-xs text-slate-500">Install the app for faster access to your garage.</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={close}>
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={close}>
              Not Now
            </Button>
          </div>
        </div>
        <button onClick={close} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/** Offline / back-online banner driven by the browser online status. */
export function NetworkBanner() {
  const [online, setOnline] = useState(true)
  const [showBackOnline, setShowBackOnline] = useState(false)

  useEffect(() => {
    const goOnline = () => {
      setOnline(true)
      setShowBackOnline(true)
      setTimeout(() => setShowBackOnline(false), 2500)
    }
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (!online) {
    return (
      <div className="flex items-center justify-center gap-2 bg-slate-800 px-4 py-2 text-center text-xs font-medium text-white">
        <WifiOff className="h-4 w-4" />
        You're offline. Some features may be unavailable.
      </div>
    )
  }

  if (showBackOnline) {
    return (
      <div className="flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-center text-xs font-medium text-white">
        <Wifi className="h-4 w-4" />
        You're back online.
      </div>
    )
  }

  return null
}
