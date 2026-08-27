import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, KeyRound, LogOut, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { SubscriptionPill } from './SubscriptionPill'
import { ChangePasswordModal } from './ChangePasswordModal'
import { useToast } from '@/components/ui'
import { getFirstName, getInitial } from '@/lib/utils'

/** Which account the shell is signed in as. */
export type ShellVariant = 'owner' | 'admin'

interface TopbarProps {
  title: string
  onMenuClick: () => void
  showSearch?: boolean
  variant?: ShellVariant
}

export function Topbar({ title, onMenuClick, showSearch = true, variant = 'owner' }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { admin, logout: adminLogout } = useAdminAuth()
  const { toast } = useToast()

  const isAdmin = variant === 'admin'

  // The two accounts differ in everything the menu shows and does: whose name
  // is on it, where signing out lands, and whether there is a profile at all.
  const displayName = isAdmin ? admin?.name : user?.ownerName
  const subtitle = isAdmin ? admin?.mobileNumber : user?.garageName
  const signedIn = isAdmin ? Boolean(admin) : Boolean(user)
  const loginPath = isAdmin ? '/admin/login' : '/login'

  const handleLogout = () => {
    setMenuOpen(false)
    if (isAdmin) adminLogout('manual')
    else logout('manual')
    toast('You have been logged out.', 'info')
    navigate(loginPath, { replace: true })
  }

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

      <div className="ml-auto flex items-center gap-2">
        {/* The platform admin has no subscription of its own. */}
        {!isAdmin && <SubscriptionPill />}

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 items-center gap-2 rounded-lg px-2 hover:bg-slate-100"
            aria-label="Account"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {getInitial(displayName)}
            </span>
            <span className="hidden text-sm font-medium text-slate-700 lg:block">
              {getFirstName(displayName) || 'Account'}
            </span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-56 animate-scale-in rounded-lg border border-slate-200 bg-white py-1 shadow-soft">
                {signedIn && (
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                    <p className="truncate text-xs text-slate-500">{subtitle}</p>
                  </div>
                )}
                {!isAdmin && (
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('/app/profile')
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <User className="h-4 w-4 text-slate-400" /> Profile
                  </button>
                )}
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    setPasswordOpen(true)
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <KeyRound className="h-4 w-4 text-slate-400" /> Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <ChangePasswordModal
        open={passwordOpen}
        variant={variant}
        onClose={() => setPasswordOpen(false)}
      />
    </header>
  )
}
