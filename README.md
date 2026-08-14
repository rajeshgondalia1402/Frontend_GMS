# GaragePro — Garage Management SaaS (Frontend)

A **frontend-only** UI prototype for a Garage Management SaaS application, built
mobile-first with React, TypeScript and Tailwind CSS. All data is mocked — there
is no backend, API, authentication, or payment logic.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** (dev/build tooling)
- **Tailwind CSS** (design system)
- **React Router v6** (routing)
- **React Hook Form** (forms)
- **Lucide React** (icons)

## Getting Started

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

Open the printed local URL (default `http://localhost:5173`).

## Panels & Routes

The app has two separate panels with their own layouts and navigation.

### Authentication (`/`)
| Route | Screen |
| --- | --- |
| `/login` | Login |
| `/register` | Create garage account |
| `/verify-otp` | 6-digit OTP verification |
| `/forgot-password` | Request reset OTP |
| `/reset-password` | Set new password |

### Garage Owner (`/app`)
Dashboard, Customers, Vehicles, Job Cards, Billing, Staff, Salary, Reports,
Subscription, Garage Profile and Settings — plus add/edit forms and job-card
details.

### Platform Admin (`/admin`)
Platform dashboard, Garages, Subscription Plans, Payments and Reports.

> Tip: from the Login screen use **Login** to enter the Garage Owner panel, or the
> **Admin login** link to open the Platform Admin panel.

## Responsive Design

- **Mobile-first** layouts tested at 375 / 390 / 414 / 768 / 1024 / 1440 px.
- Desktop uses a fixed sidebar; mobile uses a hamburger **drawer** + a **bottom
  navigation bar** with a **More** sheet for secondary modules.
- Data tables on desktop collapse to **cards/lists** on mobile.
- No unwanted horizontal scrolling.

## Design System

Reusable components live in `src/components/`:

- **`ui/`** — Button, Input, Select, Textarea, PasswordInput, OtpInput, Card,
  Badge, StatusBadge, Modal (bottom-sheet on mobile), Drawer, ConfirmDialog,
  Skeleton, EmptyState, ErrorState, LoadingState, Toast.
- **`common/`** — PageHeader, SearchInput, FilterButton, StatCard, DataTable,
  ResponsiveList, BarChart, SubscriptionBanner, PWA UI (install prompt +
  offline/online banners).
- **`layout/`** — Sidebar, Topbar, BottomNav.

## Project Structure

```
src/
├── components/   ui/ · layout/ · common/ · forms/
├── pages/        auth/ · owner/ · admin/
├── layouts/      AppShell, OwnerLayout, AdminLayout, AuthLayout, navigation
├── routes/       route definitions
├── hooks/
├── types/        shared TypeScript types
├── mock/         static mock data
└── lib/          utilities
```

## Notes

- Every form uses **mock submission** (simulated latency + toast); nothing is
  persisted.
- PWA UI (install prompt, offline / back-online banners) is **UI-only** — no
  service worker or sync is implemented.
