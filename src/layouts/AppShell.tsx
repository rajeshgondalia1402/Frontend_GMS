import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { ShellVariant } from '@/components/layout/Topbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Drawer, Modal } from '@/components/ui'
import { InstallPrompt, NetworkBanner } from '@/components/common/PwaUI'
import { findNavItem, flattenNav } from './navigation'
import type { NavItem } from './navigation'
import { cn } from '@/lib/utils'

interface AppShellProps {
  nav: NavItem[]
  brand: string
  /** Which account the shell is signed in as (default: the garage owner). */
  variant?: ShellVariant
}

export function AppShell({ nav, brand, variant = 'owner' }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  // A page filed under a group is titled by its own label, not the group's.
  const current = findNavItem(nav, location.pathname)?.label ?? brand

  // Close overlays on route change
  useEffect(() => {
    setDrawerOpen(false)
    setMoreOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-slate-50">
      <NetworkBanner />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-slate-200 bg-white lg:block">
        <Sidebar items={nav} brand={brand} />
      </aside>

      {/* Mobile drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} side="left">
        <Sidebar items={nav} brand={brand} onNavigate={() => setDrawerOpen(false)} />
      </Drawer>

      {/* Content column */}
      <div className="lg:pl-60">
        <Topbar title={current} variant={variant} onMenuClick={() => setDrawerOpen(true)} />
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav items={nav} onMoreClick={() => setMoreOpen(true)} />

      {/* More menu (bottom sheet) */}
      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Menu">
        <div className="grid grid-cols-3 gap-3 pb-2">
          {/* Groups have no page of their own, so the sheet lists what is
              under them instead of the heading. */}
          {flattenNav(nav)
            .filter((item) => !item.children)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app' || item.to === '/admin'}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-3 text-center text-xs font-medium transition-colors',
                    isActive
                      ? 'border-primary-200 bg-primary-50 text-primary-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )
                }
              >
                <item.icon className="h-6 w-6" />
                {item.label}
              </NavLink>
            ))}
        </div>
      </Modal>

      <InstallPrompt />
    </div>
  )
}
