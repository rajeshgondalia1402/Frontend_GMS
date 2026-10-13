import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl font-bold text-primary-600">404</p>
      <h1 className="mt-3 text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">The page you're looking for doesn't exist.</p>
      {/* Home, not the dashboard: an unmatched address is just as likely to be
          a visitor on the public site as an owner who is signed in. */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link to="/">
          <Button fullWidth>Back to Home</Button>
        </Link>
        <Link to="/app">
          <Button fullWidth variant="outline">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
