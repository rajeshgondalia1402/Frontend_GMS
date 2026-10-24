import { AppShell } from './AppShell'
import { adminNav } from './navigation'

export function AdminLayout() {
  return <AppShell nav={adminNav} brand="GaragePilot Admin" variant="admin" />
}
