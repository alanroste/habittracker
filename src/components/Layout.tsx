import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { FriendsIcon, SettingsIcon, StatsIcon, TodayIcon, TodoIcon } from './icons'

const tabs = [
  { to: '/', label: 'To-Do', Icon: TodoIcon, end: true },
  { to: '/me', label: 'Me', Icon: TodayIcon, end: false },
  { to: '/stats', label: 'Stats', Icon: StatsIcon, end: false },
  { to: '/friends', label: 'Friends', Icon: FriendsIcon, end: false },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon, end: false },
]

export default function Layout() {
  // The personal link (/u/<token>) renders the To-Do page, so light that tab up.
  const onPersonalLink = useLocation().pathname.startsWith('/u/')
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <main className="safe-t flex-1 px-4 pb-28 pt-3">
        <Outlet />
      </main>
      <nav className="safe-b fixed inset-x-0 bottom-0 z-40 px-3">
        <div className="mx-auto flex max-w-2xl items-center gap-1 rounded-[26px] border border-border/80 bg-surface/90 p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.45)] backdrop-blur-xl">
          {tabs.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group relative flex flex-1 flex-col items-center gap-0.5 rounded-[20px] py-2.5 text-[10px] font-medium sm:text-[11px] transition-colors ${
                  isActive || (onPersonalLink && to === '/') ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
                }`
              }
            >
              {({ isActive: active }) => {
                const isActive = active || (onPersonalLink && to === '/')
                return (
                <>
                  {isActive && (
                    <span className="absolute inset-0 rounded-[20px] bg-surface-2 ring-1 ring-inset ring-border" aria-hidden />
                  )}
                  <Icon
                    className={`relative transition-transform ${isActive ? 'scale-105 text-accent' : 'text-ink-3 group-hover:text-ink-2'}`}
                  />
                  <span className="relative">{label}</span>
                </>
                )
              }}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
