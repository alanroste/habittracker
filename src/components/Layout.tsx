import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Today', icon: '☑' },
  { to: '/stats', label: 'Stats', icon: '📈' },
  { to: '/friends', label: 'Friends', icon: '👥' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <main className="safe-t flex-1 px-4 pb-24 pt-3">
        <Outlet />
      </main>
      <nav className="safe-b fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${isActive ? 'text-accent' : 'text-ink-3'}`
              }
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
