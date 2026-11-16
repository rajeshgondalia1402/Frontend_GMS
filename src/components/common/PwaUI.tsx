import { useEffect, useState } from 'react'
import { Download, RefreshCw, WifiOff, Wifi, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { useInstallAction } from '@/components/pwa/InstallApp'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { isInstallBannerSnoozed, reloadForUpdate, snoozeInstallBanner } from '@/lib/pwa'

/**
 * Install banner — only when the browser can really install GaragePilot (or
 * on iPhone / iPad, where it explains Add to Home Screen), never once the app
 * is installed, and "Not now" keeps it away for two weeks.
 */
export function InstallPrompt() {
  const { installable, install, iosHelp } = useInstallAction()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!installable || isInstallBannerSnoozed()) {
      setVisible(false)
      return
    }
    const t = setTimeout(() => setVisible(true), 4000)
    return () => clearTimeout(t)
  }, [installable])

  function close() {
    setVisible(false)
    snoozeInstallBanner()
  }

  return (
    <>
      {visible && installable && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-4 sm:left-auto sm:right-4 sm:px-0 print:hidden">
          <div className="mx-auto flex max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <img src="/icons/pwa-192x192.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">Install GaragePilot App</p>
              <p className="mt-0.5 text-xs text-slate-500">Open your garage straight from the home screen.</p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={() => {
                    close()
                    void install()
                  }}
                >
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
      )}
      {iosHelp}
    </>
  )
}

/** A new version was installed in the background — offer a one-tap reload. */
export function UpdateBanner() {
  const { updateReady } = usePwaInstall()
  if (!updateReady) return null

  return (
    <div className="flex items-center justify-center gap-3 bg-primary-600 px-4 py-2 text-center text-xs font-medium text-white print:hidden">
      <RefreshCw className="h-4 w-4 shrink-0" />
      A new version of GaragePilot is ready.
      <button onClick={reloadForUpdate} className="rounded-md bg-white/15 px-2.5 py-1 font-semibold hover:bg-white/25">
        Refresh
      </button>
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
