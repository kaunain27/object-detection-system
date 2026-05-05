import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import toast from 'react-hot-toast'
import { Cpu, Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Welcome back!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, background: 'var(--teal)', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: 'var(--shadow-teal)' }}>
            <Cpu size={28} color="#080d14" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--teal)', letterSpacing: 2, marginBottom: 4 }}>OD SYSTEM</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Real-time Object Detection · YOLOv8</p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 36, boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Sign In</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>Enter your credentials to continue</p>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Username</label>
              <input name="username" value={form.username} onChange={handle} required
                placeholder="your_username" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 24, position: 'relative' }}>
              <label style={labelStyle}>Password</label>
              <input name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={handle} required
                placeholder="••••••••" style={{ ...inputStyle, paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 12, top: 34, background: 'none', color: 'var(--text-muted)', padding: 4 }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button type="submit" disabled={loading} style={btnStyle(loading)}>
              {loading ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} /> : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            No account? <Link to="/register" style={{ color: 'var(--teal)', fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }
const inputStyle = { width: '100%', padding: '11px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'var(--transition)' }
const btnStyle = (loading) => ({ width: '100%', padding: '13px', background: loading ? 'var(--teal-dim)' : 'var(--teal)', color: '#080d14', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: loading ? 'not-allowed' : 'pointer', transition: 'var(--transition)' })
