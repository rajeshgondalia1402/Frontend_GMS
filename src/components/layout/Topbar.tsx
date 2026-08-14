import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, LogOut, User } from 'lucide-react'

interface TopbarProps {
  title: string
  onMenuClick: () => void
  showSearch?: boolean
}

export function Topbar({ title, onMenuClick, showSearch = true }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="truncate text-base font-semibold text-slate-900 lg:hidden">{title}</h1>

      {showSearch && (
        <div className="relative hidden max-w-md flex-1 lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-1">
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 items-center gap-2 rounded-lg px-2 hover:bg-slate-100"
            aria-label="Account"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              R
            </span>
            <span className="hidden text-sm font-medium text-slate-700 lg:block">Rajesh</span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-48 animate-scale-in rounded-lg border border-slate-200 bg-white py-1 shadow-soft">
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/app/settings')
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <User className="h-4 w-4 text-slate-400" /> Profile
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/login')
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
