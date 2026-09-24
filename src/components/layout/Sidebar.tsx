import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Wrench } from 'lucide-react'
import type { NavItem } from '@/layouts/navigation'
import { cn } from '@/lib/utils'

interface SidebarProps {
  items: NavItem[]
  brand: string
  onNavigate?: () => void
}

const LINK_CLASS = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors'
const ACTIVE_CLASS = 'bg-primary-50 text-primary-700'
const IDLE_CLASS = 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'

/** True while the current path is one of this group's pages, or under one. */
function holdsPath(item: NavItem, path: string): boolean {
  return (item.children ?? []).some(
    (child) => path === child.to || path.startsWith(`${child.to}/`),
  )
}

/** A page filed under a group: the same link, indented under its heading. */
function SubLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(LINK_CLASS, 'py-2 pl-11 text-[13px]', isActive ? ACTIVE_CLASS : IDLE_CLASS)
      }
    >
      {item.label}
    </NavLink>
  )
}

/**
 * A heading that opens its pages rather than navigating itself. It opens on
 * its own while one of those pages is the current one, so a reload lands with
 * the menu the user left it in.
 */
function NavGroup({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const holds = holdsPath(item, pathname)
  const [open, setOpen] = useState(holds)

  useEffect(() => {
    if (holds) setOpen(true)
  }, [holds])

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={cn(LINK_CLASS, 'w-full', holds ? ACTIVE_CLASS : IDLE_CLASS)}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="mt-1 space-y-1">
          {(item.children ?? []).map((child) => (
            <SubLink key={child.to} item={child} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ items, brand, onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
          <Wrench className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold text-slate-900">{brand}</span>
      </div>
      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) =>
          item.children ? (
            <NavGroup key={item.to} item={item} onNavigate={onNavigate} />
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app' || item.to === '/admin'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(LINK_CLASS, isActive ? ACTIVE_CLASS : IDLE_CLASS)
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ),
        )}
      </nav>
    </div>
  )
}
