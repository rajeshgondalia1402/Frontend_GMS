import { AppShell } from './AppShell'
import { ownerNav } from './navigation'

export function OwnerLayout() {
  return <AppShell nav={ownerNav} brand="GaragePro" />
}
