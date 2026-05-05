import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import {
  LayoutDashboard, ScanSearch, History, LogOut, Cpu, User, ChevronRight
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/detect',    icon: ScanSearch,       label: 'Detect' },
  { to: '/history',   icon: History,          label: 'History' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, background: 'var(--teal)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Cpu size={20} color="#080d14" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--teal)', letterSpacing: 1 }}>OD SYSTEM</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2 }}>v1.0 · YOLOv8</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              borderRadius: 'var(--radius-sm)', marginBottom: 4, fontSize: 14, fontWeight: 500,
              color: isActive ? 'var(--teal)' : 'var(--text-secondary)',
              background: isActive ? 'var(--teal-glow)' : 'transparent',
              border: isActive ? '1px solid rgba(0,201,167,0.2)' : '1px solid transparent',
              transition: 'var(--transition)',
            })}>
              <Icon size={17} />
              {label}
              {({ isActive }) => isActive && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--teal), var(--blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            background: 'transparent', color: 'var(--text-secondary)',
            border: '1px solid var(--border)', fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'var(--transition)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Outlet />
      </main>
    </div>
  )
}
