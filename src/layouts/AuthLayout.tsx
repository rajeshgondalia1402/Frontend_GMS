import { Outlet } from 'react-router-dom'
import { BrandMark } from '@/components/public/BrandMark'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <BrandMark height={56} />
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-card sm:border sm:border-slate-200">
            <Outlet />
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">
            © 2026 GaragePilot. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
