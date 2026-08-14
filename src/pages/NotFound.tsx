import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl font-bold text-primary-600">404</p>
      <h1 className="mt-3 text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">The page you're looking for doesn't exist.</p>
      <Link to="/app" className="mt-6">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  )
}
