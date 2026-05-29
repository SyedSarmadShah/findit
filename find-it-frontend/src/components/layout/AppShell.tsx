import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../ui/ThemeToggle'

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-full px-4 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-ink text-paper shadow-glow dark:bg-paper dark:text-ink'
      : 'text-ink/70 hover:bg-black/5 dark:text-paper/70 dark:hover:bg-white/5',
  ].join(' ')

export default function AppShell() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('findit-theme')
    return stored === 'dark' ? 'dark' : 'light'
  })

  const displayName = useMemo(() => user?.full_name || user?.email || 'Campus user', [user])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('findit-theme', theme)
  }, [theme])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen text-ink dark:text-paper">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[color:var(--app-bg)]/85 backdrop-blur-xl dark:border-white/10 dark:bg-[color:var(--app-bg)]/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-paper shadow-glow dark:bg-paper dark:text-ink">
              <span className="font-display text-lg font-bold">F</span>
            </div>
            <div>
              <div className="font-display text-xl font-bold tracking-tight">Find-It</div>
              <div className="text-xs uppercase tracking-[0.24em] text-ink/45 dark:text-paper/50">Campus recovery network</div>
            </div>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <NavLink to="/dashboard" className={navClass}>
              Dashboard
            </NavLink>
            <NavLink to="/items/lost" className={navClass}>
              Lost Items
            </NavLink>
            <NavLink to="/items/found" className={navClass}>
              Found Items
            </NavLink>
            <NavLink to="/items/new" className={() => 'rounded-full bg-moss px-4 py-2 text-sm font-medium text-paper transition hover:opacity-90 dark:bg-paper dark:text-ink'}>
              Post item
            </NavLink>
            <ThemeToggle theme={theme} onToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} />
            <span className="ml-2 rounded-full border border-black/5 bg-black/5 px-4 py-2 text-sm text-ink/70 dark:border-white/10 dark:bg-white/5 dark:text-paper/70">
              {displayName}
            </span>
            <button className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:opacity-90 dark:bg-paper dark:text-ink" onClick={() => void handleLogout()} type="button">
              Logout
            </button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle theme={theme} onToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} />
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium text-ink shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-paper"
            >
              Menu
            </button>
          </div>
        </div>

        <div className={`mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:hidden lg:px-8 ${menuOpen ? 'block' : 'hidden'}`}>
          <div className="grid gap-2 rounded-[1.5rem] border border-black/5 bg-white/80 p-3 shadow-glow backdrop-blur dark:border-white/10 dark:bg-white/5">
            <NavLink to="/dashboard" className={navClass} onClick={() => setMenuOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink to="/items/lost" className={navClass} onClick={() => setMenuOpen(false)}>
              Lost Items
            </NavLink>
            <NavLink to="/items/found" className={navClass} onClick={() => setMenuOpen(false)}>
              Found Items
            </NavLink>
            <NavLink to="/items/new" className={navClass} onClick={() => setMenuOpen(false)}>
              Post item
            </NavLink>
            <div className="flex items-center justify-between gap-3 rounded-full bg-black/5 px-4 py-2 text-sm text-ink/70 dark:bg-white/5 dark:text-paper/70">
              <span className="truncate">{displayName}</span>
              <button className="font-medium text-rust" onClick={() => void handleLogout()} type="button">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
