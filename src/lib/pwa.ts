import { Workbox } from 'workbox-window'

/**
 * Progressive Web App plumbing: service worker registration and updates, the
 * "Install GaragePilot" state, and clearing caches on sign-out.
 *
 * Everything lives in one small module-level store so the browser's
 * `beforeinstallprompt` event — which can fire before React has mounted — is
 * never missed, and every install button on screen agrees on what to show.
 */

/** Chromium's install prompt event (not in the DOM lib typings). */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

export interface PwaState {
  /** Native install prompt is available (Android Chrome, desktop Chrome/Edge…). */
  canPromptInstall: boolean
  /** Running as the installed app, or the browser reported it was installed. */
  installed: boolean
  /** iPhone / iPad: no install prompt, show Add to Home Screen steps instead. */
  ios: boolean
  /** A new version was activated in the background; reloading picks it up. */
  updateReady: boolean
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

const INSTALLED_KEY = 'gp.pwa.installed'
const BANNER_DISMISSED_KEY = 'gp.pwa.bannerDismissedAt'
/** The bottom install banner stays away this long after "Not now". */
const BANNER_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000
/** How often an open app checks the server for a new deploy. */
const UPDATE_CHECK_MS = 60 * 60 * 1000

/** Caches our own service worker owns; all of them hold static files only. */
const OWN_CACHE_PREFIX = 'garagepilot-'

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage blocked (private mode) — nothing to remember */
  }
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** iPhone, iPod, or iPad (iPadOS reports itself as a Mac with touch). */
export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let state: PwaState = {
  canPromptInstall: false,
  installed: isStandalone() || readStorage(INSTALLED_KEY) === '1',
  ios: isIosDevice(),
  updateReady: false,
}
const listeners = new Set<() => void>()

function setState(patch: Partial<PwaState>): void {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

export function subscribePwa(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getPwaState(): PwaState {
  return state
}

/** Opens the browser's own install dialog, where one is available. */
export async function promptInstall(): Promise<InstallOutcome> {
  const event = deferredPrompt
  if (!event) return 'unavailable'

  // A prompt event can only be used once.
  deferredPrompt = null
  setState({ canPromptInstall: false })

  try {
    await event.prompt()
    const { outcome } = await event.userChoice
    return outcome
  } catch {
    return 'unavailable'
  }
}

/** The bottom-of-screen banner: shown at most once per fortnight. */
export function isInstallBannerSnoozed(): boolean {
  const at = Number(readStorage(BANNER_DISMISSED_KEY))
  return Number.isFinite(at) && at > 0 && Date.now() - at < BANNER_SNOOZE_MS
}

export function snoozeInstallBanner(): void {
  writeStorage(BANNER_DISMISSED_KEY, String(Date.now()))
}

export function reloadForUpdate(): void {
  window.location.reload()
}

/**
 * Deletes any Cache Storage entry that our service worker does not own.
 *
 * GaragePilot never caches API responses, so this is a safety net: if anything
 * ever put user data into Cache Storage on this origin, signing out removes it
 * before the next person uses the device. The app's own static caches (JS,
 * CSS, icons, fonts, the public HTML shell) are kept so the app still opens.
 */
export async function purgePrivateCaches(): Promise<void> {
  if (typeof caches === 'undefined') return
  try {
    const keys = await caches.keys()
    await Promise.all(
      keys.filter((key) => !key.startsWith(OWN_CACHE_PREFIX)).map((key) => caches.delete(key)),
    )
  } catch {
    /* Cache Storage unavailable — nothing was cached */
  }
}

function listenForInstallEvents(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Keep Chrome's mini-infobar away; our own button shows the prompt.
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    // The browser only offers this when the app is NOT installed, so any
    // "installed" flag left over from an uninstalled copy is stale.
    writeStorage(INSTALLED_KEY, null)
    setState({ canPromptInstall: true, installed: isStandalone() })
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    writeStorage(INSTALLED_KEY, '1')
    setState({ canPromptInstall: false, installed: true })
  })

  // Opening the installed app (or leaving it) flips display-mode.
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', (event) => {
    if (event.matches) setState({ installed: true, canPromptInstall: false })
  })
}

function registerServiceWorker(): void {
  // Dev server has no service worker (keeps hot reload and /api proxy simple).
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  const wb = new Workbox('/sw.js', { scope: '/' })

  // The new worker activates on its own (skipWaiting). Rather than reload
  // under someone halfway through a job card, offer a one-tap refresh — the
  // next launch of the app uses the new version either way.
  wb.addEventListener('controlling', (event) => {
    if (event.isUpdate) setState({ updateReady: true })
  })

  wb.register()
    .then((registration) => {
      if (!registration) return
      const check = () => {
        if (navigator.onLine) void registration.update().catch(() => undefined)
      }
      setInterval(check, UPDATE_CHECK_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    })
    .catch(() => {
      // No service worker (blocked, private mode, unsupported webview): the
      // site keeps working exactly as a normal website, just not installable.
    })
}

let initialised = false

/** Call once, before React renders. */
export function initPwa(): void {
  if (initialised || typeof window === 'undefined') return
  initialised = true
  listenForInstallEvents()
  if (document.readyState === 'complete') registerServiceWorker()
  else window.addEventListener('load', registerServiceWorker, { once: true })
}
