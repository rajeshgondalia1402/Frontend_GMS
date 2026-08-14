import { NavLink } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import type { NavItem } from '@/layouts/navigation'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  items: NavItem[]
  onMoreClick: () => void
}

export function BottomNav({ items, onMoreClick }: BottomNavProps) {
  const primary = items.filter((i) => i.primary).slice(0, 3)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="grid grid-cols-4">
        {primary.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/app' || item.to === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary-600' : 'text-slate-500',
              )
            }
          >
            <item.icon className="h-[22px] w-[22px]" />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-slate-500"
        >
          <MoreHorizontal className="h-[22px] w-[22px]" />
          More
        </button>
      </div>
    </nav>
  )
}
