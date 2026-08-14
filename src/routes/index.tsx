import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AuthLayout } from '@/layouts/AuthLayout'
import { OwnerLayout } from '@/layouts/OwnerLayout'
import { AdminLayout } from '@/layouts/AdminLayout'

import { Login } from '@/pages/auth/Login'
import { Register } from '@/pages/auth/Register'
import { VerifyOtp } from '@/pages/auth/VerifyOtp'
import { ForgotPassword } from '@/pages/auth/ForgotPassword'
import { ResetPassword } from '@/pages/auth/ResetPassword'

import { Dashboard } from '@/pages/owner/Dashboard'
import { Customers } from '@/pages/owner/Customers'
import { CustomerForm } from '@/pages/owner/CustomerForm'
import { Vehicles } from '@/pages/owner/Vehicles'
import { VehicleForm } from '@/pages/owner/VehicleForm'
import { JobCards } from '@/pages/owner/JobCards'
import { JobCardForm } from '@/pages/owner/JobCardForm'
import { JobCardDetails } from '@/pages/owner/JobCardDetails'
import { Billing } from '@/pages/owner/Billing'
import { Staff } from '@/pages/owner/Staff'
import { Salary } from '@/pages/owner/Salary'
import { Reports } from '@/pages/owner/Reports'
import { GarageProfile } from '@/pages/owner/GarageProfile'
import { Settings } from '@/pages/owner/Settings'
import { Subscription } from '@/pages/owner/Subscription'

import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminGarages } from '@/pages/admin/AdminGarages'
import { AdminPlans } from '@/pages/admin/AdminPlans'
import { AdminPayments } from '@/pages/admin/AdminPayments'
import { AdminReports } from '@/pages/admin/AdminReports'

import { NotFound } from '@/pages/NotFound'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },

  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/verify-otp', element: <VerifyOtp /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
    ],
  },

  {
    path: '/app',
    element: <OwnerLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'customers', element: <Customers /> },
      { path: 'customers/new', element: <CustomerForm /> },
      { path: 'customers/:id', element: <CustomerForm /> },
      { path: 'vehicles', element: <Vehicles /> },
      { path: 'vehicles/new', element: <VehicleForm /> },
      { path: 'vehicles/:id', element: <VehicleForm /> },
      { path: 'job-cards', element: <JobCards /> },
      { path: 'job-cards/new', element: <JobCardForm /> },
      { path: 'job-cards/:id', element: <JobCardDetails /> },
      { path: 'billing', element: <Billing /> },
      { path: 'staff', element: <Staff /> },
      { path: 'salary', element: <Salary /> },
      { path: 'reports', element: <Reports /> },
      { path: 'profile', element: <GarageProfile /> },
      { path: 'settings', element: <Settings /> },
      { path: 'subscription', element: <Subscription /> },
    ],
  },

  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'garages', element: <AdminGarages /> },
      { path: 'plans', element: <AdminPlans /> },
      { path: 'payments', element: <AdminPayments /> },
      { path: 'reports', element: <AdminReports /> },
    ],
  },

  { path: '*', element: <NotFound /> },
])
