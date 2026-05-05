import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import api from '../utils/api.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ScanSearch, Package, Zap, TrendingUp, Clock, ArrowRight, Activity } from 'lucide-react'

const COLORS = ['#00c9a7','#2e86c1','#8e44ad','#e74c3c','#f39c12','#27ae60','#1abc9c','#3498db','#9b59b6','#e67e22']

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/detections/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'Total Detections', value: stats.total_detections, icon: ScanSearch, color: 'var(--teal)' },
    { label: 'Objects Detected', value: stats.total_objects, icon: Package, color: 'var(--blue)' },
    { label: 'Avg per Detection', value: stats.avg_objects_per_detection.toFixed(1), icon: TrendingUp, color: 'var(--purple)' },
    { label: 'Model', value: 'YOLOv8n', icon: Zap, color: 'var(--yellow)' },
  ] : []

  return (
    <div style={{ padding: 'var(--page-pad)', animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 8px var(--teal)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)', letterSpacing: 2 }}>SYSTEM ONLINE</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
          Welcome back, <span style={{ color: 'var(--teal)' }}>{user?.username}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Here's your object detection overview.</p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(var(--stat-cols), 1fr)', gap: 18, marginBottom: 32 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 110, background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', animation: 'pulse 2s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(var(--stat-cols), 1fr)', gap: 18, marginBottom: 32 }}>
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />
              <Icon size={20} color={color} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color, marginBottom: 2 }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--dashboard-cols)', gap: 24, marginBottom: 24 }}>
        {/* Chart */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Activity size={16} color="var(--teal)" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Top Detected Objects</span>
          </div>
          {stats?.most_common_objects?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.most_common_objects} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: '#7badc8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7badc8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111c2d', border: '1px solid #1e3048', borderRadius: 8, color: '#e8f4fd', fontSize: 12 }} cursor={{ fill: 'rgba(0,201,167,0.05)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.most_common_objects.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No detection data yet. <span style={{ color: 'var(--teal)', marginLeft: 4, cursor: 'pointer' }} onClick={() => navigate('/detect')}>Run your first detection →</span>
            </div>
          )}
        </div>

        {/* Recent detections */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="var(--blue)" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Recent Detections</span>
            </div>
            <button onClick={() => navigate('/history')} style={{ fontSize: 12, color: 'var(--teal)', background: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats?.recent_detections?.length > 0 ? stats.recent_detections.map(d => (
              <div key={d.id} onClick={() => navigate(`/history/${d.id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.original_filename}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(d.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--teal)' }}>{d.objects_detected} obj</span>
                  <StatusBadge status={d.status} />
                </div>
              </div>
            )) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No detections yet</div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg, rgba(0,201,167,0.1), rgba(46,134,193,0.1))', border: '1px solid rgba(0,201,167,0.2)', borderRadius: 'var(--radius)', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal)', marginBottom: 6, letterSpacing: 1 }}>READY TO DETECT</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Upload an image or video</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>YOLO v8 detects 80+ object classes with bounding boxes & confidence scores in real time.</p>
        </div>
        <button onClick={() => navigate('/detect')} style={{ padding: '12px 24px', background: 'var(--teal)', color: '#080d14', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <ScanSearch size={16} /> Start Detecting
        </button>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const colors = { done: '#27ae60', failed: '#e74c3c', processing: '#f39c12', pending: '#7badc8' }
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${colors[status]}22`, color: colors[status], letterSpacing: 1, textTransform: 'uppercase' }}>
      {status}
    </span>
  )
}
