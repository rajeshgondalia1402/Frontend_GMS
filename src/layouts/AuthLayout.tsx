import { Outlet } from 'react-router-dom'
import { Wrench } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
              <Wrench className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-slate-900">GaragePro</span>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-card sm:border sm:border-slate-200">
            <Outlet />
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">
            © 2026 GaragePro. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
