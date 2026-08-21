import { RouterProvider } from 'react-router-dom'
import { ToastProvider } from '@/components/ui'
import { AuthProvider } from '@/context/AuthContext'
import { router } from '@/routes'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  )
}
