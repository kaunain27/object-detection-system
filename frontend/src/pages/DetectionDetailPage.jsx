import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api.js'
import toast from 'react-hot-toast'
import { ArrowLeft, Package, Clock, Cpu, CheckCircle, AlertCircle, Download } from 'lucide-react'

export default function DetectionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [det, setDet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resultImageUrl, setResultImageUrl] = useState(null)
  const [resultImageLoading, setResultImageLoading] = useState(false)
  const [resultImageError, setResultImageError] = useState('')

  useEffect(() => {
    api.get(`/detections/${id}`)
      .then(r => setDet(r.data))
      .catch(() => { toast.error('Not found'); navigate('/history') })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    let blobUrl = null
    let cancelled = false

    const loadResultImage = async () => {
      if (!det || det.file_type !== 'image' || !det.result_filename) {
        setResultImageUrl(null)
        setResultImageError('')
        setResultImageLoading(false)
        return
      }

      setResultImageLoading(true)
      setResultImageError('')

      try {
        const { data } = await api.get(`/detections/${det.id}/result-image`, { responseType: 'blob' })
        blobUrl = URL.createObjectURL(data)
        if (!cancelled) setResultImageUrl(blobUrl)
      } catch {
        if (!cancelled) {
          setResultImageUrl(null)
          setResultImageError('Could not load annotated image')
        }
      } finally {
        if (!cancelled) setResultImageLoading(false)
      }
    }

    loadResultImage()

    return () => {
      cancelled = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [det?.id, det?.file_type, det?.result_filename])

  if (loading) return (
    <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (!det) return null

  const detections = det.detection_data?.detections || []
  const classCounts = det.detection_data?.class_counts || {}

  return (
    <div style={{ padding: '40px 40px 60px', animation: 'fadeIn 0.4s ease' }}>
      {/* Back */}
      <button onClick={() => navigate('/history')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', background: 'none', marginBottom: 24, padding: '6px 0' }}>
        <ArrowLeft size={15} /> Back to History
      </button>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)', letterSpacing: 2, marginBottom: 8 }}>DETECTION #{det.id}</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, maxWidth: 600, wordBreak: 'break-all' }}>{det.original_filename}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(det.created_at).toLocaleString()}</p>
        </div>
        <StatusBadge status={det.status} />
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Objects Found', value: det.objects_detected, icon: Package, color: 'var(--teal)' },
          { label: 'Processing Time', value: `${det.processing_time_ms?.toFixed(0) ?? '—'}ms`, icon: Clock, color: 'var(--blue)' },
          { label: 'Model', value: det.model_used, icon: Cpu, color: 'var(--purple)' },
          { label: 'Confidence', value: `${(det.confidence_threshold * 100).toFixed(0)}%`, icon: CheckCircle, color: 'var(--yellow)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />
            <Icon size={16} color={color} style={{ marginBottom: 10 }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color, marginBottom: 2 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: det.file_type === 'image' ? '1.2fr 1fr' : '1fr', gap: 24 }}>
        {/* Annotated image */}
        {det.file_type === 'image' && det.result_filename && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Annotated Result</span>
              <a
                href={resultImageUrl || '#'}
                download={det.result_filename || 'result.jpg'}
                onClick={e => { if (!resultImageUrl) e.preventDefault() }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  color: resultImageUrl ? 'var(--teal)' : 'var(--text-muted)',
                  fontWeight: 600,
                  pointerEvents: resultImageUrl ? 'auto' : 'none',
                }}
              >
                <Download size={13} /> Download
              </a>
            </div>
            <div style={{ background: '#000', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {resultImageLoading && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading image...</span>}
              {!resultImageLoading && resultImageError && <span style={{ fontSize: 13, color: 'var(--red)' }}>{resultImageError}</span>}
              {!resultImageLoading && !resultImageError && resultImageUrl && (
                <img src={resultImageUrl} alt="annotated" style={{ width: '100%', maxHeight: 480, objectFit: 'contain' }} />
              )}
            </div>
          </div>
        )}

        {/* Detections list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Class summary */}
          {Object.keys(classCounts).length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Class Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(classCounts).sort((a, b) => b[1] - a[1]).map(([label, count]) => {
                  const max = Math.max(...Object.values(classCounts))
                  return (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 100 }}>{label}</span>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 3 }}>
                        <div style={{ width: `${(count / max) * 100}%`, height: '100%', background: 'var(--teal)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal)', minWidth: 20, textAlign: 'right' }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Individual detections */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>All Detections ({detections.length})</span>
            </div>
            <div style={{ maxHeight: 340, overflowY: 'auto', padding: '8px 0' }}>
              {detections.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No objects detected</div>
              ) : detections.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px', borderBottom: i < detections.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--teal)', fontWeight: 700 }}>{i + 1}</div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{d.label}</span>
                  </div>
                  <ConfBar value={d.confidence} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {det.status === 'failed' && (
        <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} color="var(--red)" />
          <span style={{ fontSize: 13, color: 'var(--red)' }}>{det.error_message || 'Detection failed'}</span>
        </div>
      )}
    </div>
  )
}

function ConfBar({ value }) {
  const pct = (value * 100).toFixed(1)
  const color = value >= 0.8 ? 'var(--teal)' : value >= 0.6 ? 'var(--yellow)' : 'var(--red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 70, height: 4, background: 'var(--bg-secondary)', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { done: ['#27ae60', 'Complete'], failed: ['#e74c3c', 'Failed'], processing: ['#f39c12', 'Processing'], pending: ['#7badc8', 'Pending'] }
  const [color, label] = map[status] || ['#7badc8', status]
  return <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, background: `${color}22`, color }}>{label}</span>
}
