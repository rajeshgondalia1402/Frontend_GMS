import { useSyncExternalStore } from 'react'
import { getPwaState, promptInstall, subscribePwa } from '@/lib/pwa'
import type { InstallOutcome, PwaState } from '@/lib/pwa'

export interface PwaInstall extends PwaState {
  /**
   * Something useful can be offered: the native prompt (Android / desktop
   * Chromium) or Add to Home Screen steps (iPhone / iPad). False once the
   * app is installed or when the browser cannot install it at all.
   */
  installable: boolean
  promptInstall: () => Promise<InstallOutcome>
}

/** Shared install state for every "Install GaragePilot" entry point. */
export function usePwaInstall(): PwaInstall {
  const state = useSyncExternalStore(subscribePwa, getPwaState, getPwaState)
  const installable = !state.installed && (state.canPromptInstall || state.ios)
  return { ...state, installable, promptInstall }
}
