import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api.js'
import { Image as ImageIcon, Video, Clock, Package, ChevronRight, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HistoryPage() {
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    api.get('/detections/?limit=50')
      .then(r => setDetections(r.data))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const del = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this detection?')) return
    await api.delete(`/detections/${id}`)
    toast.success('Deleted')
    setDetections(d => d.filter(x => x.id !== id))
  }

  return (
    <div style={{ padding: 'var(--page-pad)', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)', letterSpacing: 2, marginBottom: 8 }}>DETECTION LOG</div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{detections.length} detection{detections.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={load} style={{ padding: '9px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 76, background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', animation: 'pulse 2s infinite' }} />
          ))}
        </div>
      ) : detections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Clock size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No detections yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Run your first detection to see it here</p>
          <button onClick={() => navigate('/detect')} style={{ padding: '10px 20px', background: 'var(--teal)', color: '#080d14', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 700 }}>
            Start Detecting
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'var(--history-cols)', gap: 12, padding: '8px 18px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
            <span>File</span><span>Type</span><span>Objects</span><span>Time</span><span>Status</span><span />
          </div>

          {detections.map(d => (
            <div key={d.id} onClick={() => navigate(`/history/${d.id}`)} style={{ display: 'grid', gridTemplateColumns: 'var(--history-cols)', gap: 12, padding: '14px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', alignItems: 'center', cursor: 'pointer', transition: 'var(--transition)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.background = 'var(--bg-card-hover)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: d.file_type === 'image' ? 'rgba(0,201,167,0.1)' : 'rgba(46,134,193,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {d.file_type === 'image' ? <ImageIcon size={16} color="var(--teal)" /> : <Video size={16} color="var(--blue)" />}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.original_filename}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(d.created_at).toLocaleString()}</div>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{d.file_type}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Package size={13} color="var(--teal)" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--teal)', fontWeight: 700 }}>{d.objects_detected}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                {d.processing_time_ms ? `${d.processing_time_ms.toFixed(0)}ms` : '—'}
              </span>
              <StatusBadge status={d.status} />
              <button onClick={e => del(d.id, e)} style={{ width: 32, height: 32, borderRadius: 6, background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { done: ['#27ae60', '✓'], failed: ['#e74c3c', '✕'], processing: ['#f39c12', '⟳'], pending: ['#7badc8', '…'] }
  const [color, icon] = map[status] || ['#7badc8', '?']
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${color}22`, color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {icon} {status}
    </span>
  )
}
