import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import api from '../utils/api.js'
import toast from 'react-hot-toast'
import { Upload, ScanSearch, X, Image as ImageIcon, Video, Sliders, CheckCircle, AlertCircle, Loader } from 'lucide-react'

const ACCEPTED = {
  'image/*': [],
  'video/*': [],
}

export default function DetectPage() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [confidence, setConfidence] = useState(0.45)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [resultImageUrl, setResultImageUrl] = useState(null)
  const [resultImageLoading, setResultImageLoading] = useState(false)
  const [resultImageError, setResultImageError] = useState('')

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setResult(null)
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED, maxFiles: 1, multiple: false,
    onDropRejected: () => toast.error('Unsupported file type or too large'),
  })

  useEffect(() => {
    let blobUrl = null
    let cancelled = false

    const loadResultImage = async () => {
      if (!result || result.file_type !== 'image' || !result.result_filename) {
        setResultImageUrl(null)
        setResultImageError('')
        setResultImageLoading(false)
        return
      }

      setResultImageLoading(true)
      setResultImageError('')

      try {
        const { data } = await api.get(`/detections/${result.id}/result-image`, { responseType: 'blob' })
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
  }, [result?.id, result?.file_type, result?.result_filename])

  const clear = () => { setFile(null); setPreview(null); setResult(null) }

  const runDetection = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)
    const form = new FormData()
    form.append('file', file)
    form.append('confidence', confidence)
    try {
      const { data } = await api.post('/detections/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(data)
      toast.success(`Detected ${data.objects_detected} object${data.objects_detected !== 1 ? 's' : ''}!`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Detection failed')
    } finally { setLoading(false) }
  }

  const isVideo = file?.type?.startsWith('video/')

  return (
    <div style={{ padding: '40px 40px 60px', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)', letterSpacing: 2, marginBottom: 8 }}>DETECTION CONSOLE</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Object Detection</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Upload an image or video and let YOLOv8 detect objects in real time.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Left: upload + settings */}
        <div>
          {/* Dropzone */}
          {!file ? (
            <div {...getRootProps()} style={{
              border: `2px dashed ${isDragActive ? 'var(--teal)' : 'var(--border-light)'}`,
              borderRadius: 'var(--radius)', padding: '60px 40px', textAlign: 'center', cursor: 'pointer',
              background: isDragActive ? 'var(--teal-glow)' : 'var(--bg-card)',
              transition: 'var(--transition)', marginBottom: 20,
            }}>
              <input {...getInputProps()} />
              <Upload size={40} color={isDragActive ? 'var(--teal)' : 'var(--text-muted)'} style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: isDragActive ? 'var(--teal)' : 'var(--text-primary)' }}>
                {isDragActive ? 'Drop it!' : 'Drag & drop here'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>or click to browse</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['ALL IMAGES', 'ALL VIDEOS'].map(t => (
                  <span key={t} style={{ fontSize: 11, padding: '2px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t}</span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 20 }}>
              {/* File header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                {isVideo ? <Video size={18} color="var(--blue)" /> : <ImageIcon size={18} color="var(--teal)" />}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}</div>
                </div>
                <button onClick={clear} style={{ background: 'none', color: 'var(--text-muted)', padding: 4 }}>
                  <X size={16} />
                </button>
              </div>
              {/* Preview */}
              {preview && (
                <div style={{ maxHeight: 320, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                  <img src={preview} alt="preview" style={{ maxHeight: 320, objectFit: 'contain' }} />
                </div>
              )}
              {isVideo && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                  <Video size={32} color="var(--blue)" style={{ margin: '0 auto 8px' }} />
                  Video file ready for detection
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 22px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Sliders size={15} color="var(--text-secondary)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Detection Settings</span>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Confidence Threshold</label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--teal)', fontWeight: 700 }}>{(confidence * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min="0.25" max="0.95" step="0.05" value={confidence}
                onChange={e => setConfidence(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--teal)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>More detections (10%)</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Fewer, higher quality (95%)</span>
              </div>
            </div>
          </div>

          {/* Run button */}
          <button onClick={runDetection} disabled={!file || loading} style={{
            width: '100%', padding: 14, background: (!file || loading) ? '#0d1520' : 'var(--teal)',
            color: (!file || loading) ? 'var(--text-muted)' : '#080d14',
            border: `1px solid ${(!file || loading) ? 'var(--border)' : 'transparent'}`,
            borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: (!file || loading) ? 'not-allowed' : 'pointer', transition: 'var(--transition)',
          }}>
            {loading
              ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</>
              : <><ScanSearch size={18} /> Run Detection</>
            }
          </button>
        </div>

        {/* Right: results */}
        {result && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              {/* Result header */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(0,201,167,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="var(--teal)" />
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--teal)' }}>Detection Complete</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {result.processing_time_ms?.toFixed(0)}ms
                </div>
              </div>

              {/* Annotated image */}
              {result.file_type === 'image' && result.result_filename && (
                <div style={{ background: '#000', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {resultImageLoading && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading image...</span>}
                  {!resultImageLoading && resultImageError && <span style={{ fontSize: 13, color: 'var(--red)' }}>{resultImageError}</span>}
                  {!resultImageLoading && !resultImageError && resultImageUrl && (
                    <img src={resultImageUrl} alt="annotated" style={{ width: '100%', maxHeight: 360, objectFit: 'contain' }} />
                  )}
                </div>
              )}

              {/* Stats bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'Objects Found', value: result.objects_detected },
                  { label: 'Confidence', value: `${(confidence * 100).toFixed(0)}%` },
                  { label: 'Time', value: `${result.processing_time_ms?.toFixed(0)}ms` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '14px 16px', borderRight: '1px solid var(--border)', textAlign: 'center', lastChild: { borderRight: 'none' } }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--teal)', marginBottom: 2 }}>{value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Class breakdown */}
              {result.detection_data?.class_counts && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Classes Detected</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(result.detection_data.class_counts).map(([label, count], i) => (
                      <span key={label} style={{ fontSize: 12, padding: '4px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 20, color: 'var(--text-primary)', fontWeight: 600 }}>
                        {label} <span style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>×{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual detections */}
              <div style={{ padding: '16px 20px', maxHeight: 280, overflowY: 'auto' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>All Detections</div>
                {result.detection_data?.detections?.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--teal-glow)', border: '1px solid rgba(0,201,167,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--teal)', fontWeight: 700 }}>{i + 1}</div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{d.label}</span>
                    </div>
                    <ConfidenceBar value={d.confidence} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfidenceBar({ value }) {
  const pct = (value * 100).toFixed(1)
  const color = value >= 0.8 ? 'var(--teal)' : value >= 0.6 ? 'var(--yellow)' : 'var(--red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 80, height: 5, background: 'var(--bg-secondary)', borderRadius: 3 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color, minWidth: 38, textAlign: 'right' }}>{pct}%</span>
    </div>
  )
}
