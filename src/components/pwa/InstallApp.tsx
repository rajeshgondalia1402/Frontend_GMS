import { useState } from 'react'
import { Download, PlusSquare, Share, Smartphone } from 'lucide-react'
import { Button, Modal, useToast } from '@/components/ui'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { cn } from '@/lib/utils'

/**
 * Shared click handler for every install entry point: the native prompt on
 * Android / desktop Chromium, the Add to Home Screen steps on iPhone / iPad.
 */
export function useInstallAction() {
  const pwa = usePwaInstall()
  const { toast } = useToast()
  const [iosHelpOpen, setIosHelpOpen] = useState(false)

  const install = async () => {
    if (pwa.canPromptInstall) {
      const outcome = await pwa.promptInstall()
      if (outcome === 'accepted') toast('GaragePilot is being added to your home screen.', 'success')
      return
    }
    if (pwa.ios) setIosHelpOpen(true)
  }

  const iosHelp = <IosInstallModal open={iosHelpOpen} onClose={() => setIosHelpOpen(false)} />

  return { ...pwa, install, iosHelp }
}

/** Add to Home Screen steps for Safari on iPhone / iPad (no install prompt there). */
export function IosInstallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const steps = [
    { icon: Smartphone, text: <>Open <strong>GaragePilot</strong> in <strong>Safari</strong>.</> },
    {
      icon: Share,
      text: (
        <>
          Tap the <strong>Share</strong> button <span className="text-slate-500">(square with an arrow)</span>.
        </>
      ),
    },
    { icon: PlusSquare, text: <>Select <strong>Add to Home Screen</strong>.</> },
    { icon: Download, text: <>Tap <strong>Add</strong>. GaragePilot appears on your home screen.</> },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Install GaragePilot on iPhone"
      size="sm"
      footer={
        <Button fullWidth onClick={onClose}>
          Got it
        </Button>
      }
    >
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-1 items-start gap-2 pt-1.5 text-sm text-slate-700">
              <step.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
              <p>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        Open it from the home screen icon and sign in as usual — it runs full screen like an app.
      </p>
    </Modal>
  )
}

/**
 * "Install GaragePilot App" card — login page and Garage Profile. Renders
 * nothing when the app is installed or the browser cannot install it.
 */
export function InstallAppCard({ className }: { className?: string }) {
  const { installable, install, iosHelp } = useInstallAction()
  if (!installable) return null

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border border-primary-100 bg-gradient-to-r from-primary-50 to-white p-3.5',
          className,
        )}
      >
        <img
          src="/icons/pwa-192x192.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-xl shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Install GaragePilot App</p>
          <p className="text-xs text-slate-500">Open your garage from the home screen, full screen.</p>
        </div>
        <Button size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => void install()}>
          Install
        </Button>
      </div>
      {iosHelp}
    </>
  )
}
