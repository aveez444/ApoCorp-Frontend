import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import Toast from '../../components/Toast'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const FONT    = "'Inter', 'Segoe UI', sans-serif"
const BORDER  = '#d1d5db'
const LABEL   = '#6b7280'
const TEXT    = '#1a1a2e'

const Icon = ({ d, size = 16, color = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const ic = {
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  edit:      'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  print:     'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  attach:    'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49',
  file:      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  eye:       'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  download:  'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  trash:     'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  xCircle:   'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM15 9l-6 6M9 9l6 6',
  calendar:  'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18',
  user:      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  building:  'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  users:     'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
}

const baseInput = {
  border: `1px solid ${BORDER}`, borderRadius: 7,
  padding: '10px 13px', fontSize: '13.5px',
  fontFamily: FONT, color: TEXT, outline: 'none',
  background: '#fff', width: '100%', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

function Field({ label, children, style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <span style={{
        position: 'absolute', top: -9, left: 10,
        background: '#fff', padding: '0 4px',
        fontSize: '11px', fontWeight: 600,
        color: LABEL, fontFamily: FONT,
        zIndex: 1, pointerEvents: 'none',
      }}>
        {label}
      </span>
      {children}
    </div>
  )
}

function EditModal({ report, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: report.date || '',
    type_of_report: report.type_of_report || '',
    company_name: report.company_name || '',
    department: report.department || '',
    author: report.author || '',
    attendants: report.attendants || '',
    subject: report.subject || '',
    agenda: report.agenda || '',
    details_of_meeting: report.details_of_meeting || '',
    remarks: report.remarks || '',
  })
  const [newFiles, setNewFiles] = useState([])
  const fileRef = useRef()

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch(`/reports/visit-reports/${report.id}/`, form)
      if (newFiles.length > 0) {
        const fd = new FormData()
        newFiles.forEach(f => fd.append('files', f))
        await api.post(`/reports/visit-reports/${report.id}/upload_attachment/`, fd)
      }
      onSaved()
    } catch (e) {
      console.error(e)
      alert(e.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Something went wrong.')
    } finally { setSaving(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 720,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,.2)',
      }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #eef0f4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>Edit Visit Report</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 6 }}>
            <Icon d={ic.xCircle} size={20} color="#9ca3af" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <Field label="Date">
                <input type="date" style={baseInput} value={form.date} onChange={e => sf('date', e.target.value)} />
              </Field>
              <Field label="Type of Report">
                <input style={baseInput} placeholder="e.g. Site Visit" value={form.type_of_report} onChange={e => sf('type_of_report', e.target.value)} />
              </Field>
            </div>
            <Field label="Company Name">
              <input style={baseInput} placeholder="Company name" value={form.company_name} onChange={e => sf('company_name', e.target.value)} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <Field label="Department">
                <input style={baseInput} placeholder="Department" value={form.department} onChange={e => sf('department', e.target.value)} />
              </Field>
              <Field label="Author">
                <input style={baseInput} placeholder="Author" value={form.author} onChange={e => sf('author', e.target.value)} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <Field label="Attendants">
                <input style={baseInput} placeholder="Comma-separated names" value={form.attendants} onChange={e => sf('attendants', e.target.value)} />
              </Field>
              <Field label="Subject">
                <input style={baseInput} placeholder="Meeting subject" value={form.subject} onChange={e => sf('subject', e.target.value)} />
              </Field>
            </div>
            <Field label="Agenda">
              <textarea style={{ ...baseInput, resize: 'vertical', minHeight: 72 }} value={form.agenda} onChange={e => sf('agenda', e.target.value)} />
            </Field>
            <Field label="Details of Meeting">
              <textarea style={{ ...baseInput, resize: 'vertical', minHeight: 100 }} value={form.details_of_meeting} onChange={e => sf('details_of_meeting', e.target.value)} />
            </Field>
            <Field label="Remarks">
              <textarea style={{ ...baseInput, resize: 'vertical', minHeight: 72 }} value={form.remarks} onChange={e => sf('remarks', e.target.value)} />
            </Field>

            {/* Attach more files */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
                  Add More Files {newFiles.length > 0 && `(${newFiles.length})`}
                </span>
                <button type="button" onClick={() => fileRef.current?.click()} style={outlineSmBtn}>
                  <Icon d={ic.attach} size={13} color={PRIMARY} /> Attach
                </button>
                <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => setNewFiles(p => [...p, ...Array.from(e.target.files || [])])} />
              </div>
              {newFiles.map((f, i) => (
                <div key={i} style={{ fontSize: 13, color: '#374151', fontFamily: FONT, padding: '4px 0' }}>
                  📎 {f.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid #eef0f4', display: 'flex', justifyContent: 'flex-end', gap: 12, flexShrink: 0 }}>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ ...saveBtn, background: saving ? '#94a3b8' : PRIMARY, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, icon }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 13.5, fontFamily: FONT, alignItems: 'flex-start' }}>
      {icon && <span style={{ color: '#9ca3af', flexShrink: 0, marginTop: 1 }}><Icon d={icon} size={14} color="#9ca3af" /></span>}
      <span style={{ color: LABEL, fontWeight: 500, minWidth: 170, flexShrink: 0 }}>{label} :</span>
      <span style={{ color: '#111827', fontWeight: 600, wordBreak: 'break-word' }}>{value || '—'}</span>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 15, fontWeight: 700, color: PRIMARY,
      fontFamily: FONT, marginBottom: 16, paddingBottom: 10,
      borderBottom: '1.5px solid #eef0f4',
    }}>
      {children}
    </div>
  )
}

const fmt = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function VisitReportDetail({ basePath = '/employee/reports/visit-reports' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [toast, setToast]       = useState(null)
  const [deleting, setDeleting] = useState(null) // attachment id being deleted
  const fileRef = useRef()

  const load = () => {
    setLoading(true)
    api.get(`/reports/visit-reports/${id}/`)
      .then(r => setReport(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    try {
      await api.post(`/reports/visit-reports/${id}/upload_attachment/`, fd)
      setToast('Files uploaded!')
      load()
    } catch { setToast('Upload failed.') }
    e.target.value = ''
  }

  const handleDeleteAttachment = async (attId) => {
    if (!window.confirm('Delete this attachment?')) return
    setDeleting(attId)
    try {
      await api.delete(`/reports/visit-reports/${id}/attachments/${attId}/`)
      setToast('Attachment deleted.')
      load()
    } catch { setToast('Delete failed.') }
    finally { setDeleting(null) }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, fontFamily: FONT }}>
        <div style={{ width: 24, height: 24, border: '2.5px solid #e2e8f0', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!report) return (
    <div style={{ textAlign: 'center', padding: 60, fontFamily: FONT, color: '#6b7280' }}>
      Report not found.
    </div>
  )

  return (
    <div style={{ fontFamily: FONT, color: TEXT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        .att-card:hover { background: #f0f5ff !important; border-color: #bfdbfe !important; }
        .vr-det-btn:hover { background: #f8fafc !important; }
      `}</style>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate(basePath)}
            style={{ width: 36, height: 36, borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icon d={ic.arrowLeft} size={16} color="#6b7280" />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
              {report.visit_number}
            </h1>
            <span style={{ fontSize: 12.5, color: '#9ca3af', fontFamily: FONT }}>
              Created {fmt(report.created_at)}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="vr-det-btn" onClick={() => window.print()} style={actionBtn}>
            <Icon d={ic.print} size={13} color="#475569" /> Print
          </button>
          <button className="vr-det-btn" onClick={() => fileRef.current?.click()} style={actionBtn}>
            <Icon d={ic.attach} size={13} color="#475569" /> Attach
          </button>
          <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
          <button onClick={() => setEditOpen(true)} style={primaryBtn}>
            <Icon d={ic.edit} size={13} color="#fff" /> Edit Report
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, animation: 'fadeUp .3s ease' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Visit Info */}
          <div style={card}>
            <SectionTitle>Visit Information</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              <InfoRow label="Visit Number" value={report.visit_number} />
              <InfoRow label="Date" value={fmt(report.date)} />
              <InfoRow label="Type of Report" value={report.type_of_report} />
              <InfoRow label="Company Name" value={report.company_name} />
              <InfoRow label="Department" value={report.department} />
              <InfoRow label="Author" value={report.author} />
            </div>
            <InfoRow label="Attendants" value={report.attendants} />
            <InfoRow label="Subject" value={report.subject} />
          </div>

          {/* Meeting Details */}
          {(report.agenda || report.details_of_meeting) && (
            <div style={card}>
              <SectionTitle>Meeting Details</SectionTitle>
              {report.agenda && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: LABEL, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Agenda</div>
                  <div style={{ fontSize: 14, color: '#374151', fontFamily: FONT, lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#fafafa', borderRadius: 8, padding: '12px 16px', border: '1px solid #f1f5f9' }}>
                    {report.agenda}
                  </div>
                </div>
              )}
              {report.details_of_meeting && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: LABEL, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Details of Meeting</div>
                  <div style={{ fontSize: 14, color: '#374151', fontFamily: FONT, lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#fafafa', borderRadius: 8, padding: '12px 16px', border: '1px solid #f1f5f9' }}>
                    {report.details_of_meeting}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Remarks */}
          {report.remarks && (
            <div style={card}>
              <SectionTitle>Remarks</SectionTitle>
              <div style={{ fontSize: 14, color: '#374151', fontFamily: FONT, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {report.remarks}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Meta */}
          <div style={card}>
            <SectionTitle>Meta</SectionTitle>
            <InfoRow label="Created By" value={report.created_by_name || '—'} />
            <InfoRow label="Created At" value={fmt(report.created_at)} />
            <InfoRow label="Last Updated" value={fmt(report.updated_at)} />
          </div>

          {/* Attachments */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 10, borderBottom: '1.5px solid #eef0f4' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
                Attachments ({report.attachments?.length || 0})
              </span>
              <button onClick={() => fileRef.current?.click()} style={outlineSmBtn} className="vr-det-btn">
                <Icon d={ic.attach} size={12} color={PRIMARY} /> Add
              </button>
            </div>

            {!report.attachments?.length ? (
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `1.5px dashed ${BORDER}`, borderRadius: 8,
                  padding: '22px 16px', textAlign: 'center',
                  cursor: 'pointer', color: '#9ca3af', fontSize: 13,
                  fontFamily: FONT, background: '#fafafa',
                }}
              >
                <div style={{ marginBottom: 6 }}><Icon d={ic.attach} size={20} color="#d1d5db" /></div>
                Click to attach files
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {report.attachments.map(att => {
                  const fileUrl = att.file_url || att.file
                  const fileName = att.file_name || fileUrl?.split('/').pop() || 'File'
                  const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE'
                  return (
                    <div
                      key={att.id}
                      className="att-card"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        border: '1.5px solid #e5e7eb', borderRadius: 10,
                        padding: '10px 12px', background: '#fafafa', transition: 'all .15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon d={ic.file} size={15} color={PRIMARY} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: TEXT, fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                            {fileName}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: FONT }}>
                            {ext} · {att.file_size_display || '—'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        <a href={fileUrl} target="_blank" rel="noreferrer" style={iconBtn}>
                          <Icon d={ic.eye} size={12} color="#6b7280" />
                        </a>
                        <a href={fileUrl} download style={iconBtn}>
                          <Icon d={ic.download} size={12} color="#6b7280" />
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          disabled={deleting === att.id}
                          style={{ ...iconBtn, cursor: 'pointer', border: '1px solid #fca5a5', background: '#fff3f3' }}
                        >
                          <Icon d={ic.trash} size={12} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {editOpen && (
        <EditModal
          report={report}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); setToast('Report updated!'); load() }}
        />
      )}
    </div>
  )
}

const card = {
  background: '#fff', borderRadius: 12, padding: '20px 24px',
  boxShadow: '0 1px 8px rgba(0,0,0,.06)',
}
const actionBtn = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', border: '1.5px solid #e5e7eb',
  borderRadius: 8, background: '#fff', color: '#475569',
  fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: FONT,
}
const primaryBtn = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', border: 'none', borderRadius: 8,
  background: PRIMARY, color: '#fff',
  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
}
const outlineSmBtn = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '6px 12px', border: `1px solid ${PRIMARY}`,
  borderRadius: 6, background: '#fff', color: PRIMARY,
  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
}
const iconBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 28, height: 28, borderRadius: 6,
  border: '1px solid #e5e7eb', background: '#fff',
  textDecoration: 'none',
}
const cancelBtn = {
  padding: '10px 26px', border: `1px solid ${BORDER}`,
  borderRadius: 8, background: '#fff',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
  color: '#374151', fontFamily: FONT,
}
const saveBtn = {
  padding: '10px 26px', border: 'none',
  borderRadius: 8, color: '#fff',
  fontSize: 14, fontWeight: 700, fontFamily: FONT,
}
