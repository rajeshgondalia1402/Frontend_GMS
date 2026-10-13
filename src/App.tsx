import { RouterProvider } from 'react-router-dom'
import { ToastProvider } from '@/components/ui'
import { AuthProvider } from '@/context/AuthContext'
import { AdminAuthProvider } from '@/context/AdminAuthContext'
import { router } from '@/routes'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        {/* The platform admin's session sits alongside the garage owner's, so
            the shared shell can read whichever one it is running as. */}
        <AdminAuthProvider>
          <RouterProvider router={router} />
        </AdminAuthProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
