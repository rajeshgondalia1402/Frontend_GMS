import { NavLink } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import type { NavItem } from '@/layouts/navigation'
import { cn } from '@/lib/utils'

interface SidebarProps {
  items: NavItem[]
  brand: string
  onNavigate?: () => void
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
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/app' || item.to === '/admin'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
