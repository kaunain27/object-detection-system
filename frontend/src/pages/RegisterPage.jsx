import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import toast from 'react-hot-toast'
import { Cpu, Eye, EyeOff, UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome aboard.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, animation: 'fadeIn 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, background: 'var(--teal)', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: 'var(--shadow-teal)' }}>
            <Cpu size={28} color="#080d14" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--teal)', letterSpacing: 2, marginBottom: 4 }}>OD SYSTEM</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Create your account</p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 36, boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>Fill in the details below</p>

          <form onSubmit={submit}>
            {[
              { name: 'full_name', label: 'Full Name', placeholder: 'John Doe', type: 'text', required: false },
              { name: 'username', label: 'Username', placeholder: 'john_doe', type: 'text', required: true },
              { name: 'email', label: 'Email', placeholder: 'john@example.com', type: 'email', required: true },
            ].map(f => (
              <div key={f.name} style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{f.label}{!f.required && <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>(optional)</span>}</label>
                <input name={f.name} type={f.type} value={form[f.name]} onChange={handle}
                  required={f.required} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}

            <div style={{ marginBottom: 26, position: 'relative' }}>
              <label style={labelStyle}>Password</label>
              <input name="password" type={showPwd ? 'text' : 'password'} value={form.password}
                onChange={handle} required placeholder="Min. 6 characters" style={{ ...inputStyle, paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 12, top: 34, background: 'none', color: 'var(--text-muted)', padding: 4 }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button type="submit" disabled={loading} style={btnStyle(loading)}>
              {loading
                ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                : <><UserPlus size={16} /> Create Account</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--teal)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }
const inputStyle = { width: '100%', padding: '11px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }
const btnStyle = (loading) => ({ width: '100%', padding: '13px', background: loading ? 'var(--teal-dim)' : 'var(--teal)', color: '#080d14', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: loading ? 'not-allowed' : 'pointer' })
