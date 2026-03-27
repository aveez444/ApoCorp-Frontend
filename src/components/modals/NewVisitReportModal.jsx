import { useState, useRef } from 'react'
import api from '../../api/axios'

const FONT    = 'Lato, sans-serif'
const PRIMARY = '#122C41'
const BORDER  = '#d1d5db'
const LABEL   = '#6b7280'
const TEXT    = '#1a1a2e'

const baseInput = {
  border: `1px solid ${BORDER}`, borderRadius: 7,
  padding: '12px 14px', fontSize: '14px',
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

function FileCard({ file, onRemove }) {
  const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE'
  const size = file.size < 1024 * 1024
    ? `${Math.round(file.size / 1024)} KB`
    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      border: `1.5px solid #e5e7eb`, borderRadius: 10,
      padding: '10px 14px', background: '#fafafa',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: '#EEF3FF', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, fontFamily: FONT, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </div>
          <div style={{ fontSize: 11.5, color: '#9ca3af', fontFamily: FONT }}>{ext} · {size}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

const EMPTY = {
  date: new Date().toISOString().slice(0, 10),
  type_of_report: '',
  company_name: '',
  department: '',
  author: '',
  attendants: '',
  subject: '',
  agenda: '',
  details_of_meeting: '',
  remarks: '',
}

export default function NewVisitReportModal({ open, onClose, onSuccess }) {
  const [form, setForm]         = useState(EMPTY)
  const [files, setFiles]       = useState([])
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef()

  if (!open) return null

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleFileAdd = (e) => {
    const added = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...added])
    e.target.value = ''
  }

  const handleSubmit = async () => {
    if (!form.date) { alert('Please enter a date.'); return }
    setSubmitting(true)
    try {
      const res = await api.post('/reports/visit-reports/', form)
      const reportId = res.data.id

      if (files.length > 0) {
        const fd = new FormData()
        files.forEach(f => fd.append('files', f))
        await api.post(`/visit-reports/${reportId}/upload_attachment/`, fd)
      }

      setForm(EMPTY)
      setFiles([])
      onSuccess?.('Visit report created successfully!')
    } catch (e) {
      console.error(e)
      alert(e.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        .vr-modal-input:focus { border-color: #1e88e5 !important; }
        .vr-modal-overlay { animation: vrFadeIn .15s ease; }
        @keyframes vrFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .vr-modal-box { animation: vrSlideUp .2s ease; }
        @keyframes vrSlideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
      `}</style>

      <div
        className="vr-modal-overlay"
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)', padding: 20,
        }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div
          className="vr-modal-box"
          style={{
            background: '#fff', borderRadius: 16,
            width: '100%', maxWidth: 760,
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,.2)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 28px', borderBottom: '1px solid #eef0f4',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
                New Visit Report
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#9ca3af', fontFamily: FONT }}>
                Log a new customer or site visit
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 6 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Row 1: Date + Type of Report */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <Field label="Date *">
                  <input
                    className="vr-modal-input"
                    type="date"
                    style={baseInput}
                    value={form.date}
                    onChange={e => sf('date', e.target.value)}
                  />
                </Field>
                <Field label="Type of Report">
                  <input
                    className="vr-modal-input"
                    style={baseInput}
                    placeholder="e.g. Site Visit, Customer Meeting"
                    value={form.type_of_report}
                    onChange={e => sf('type_of_report', e.target.value)}
                  />
                </Field>
              </div>

              {/* Row 2: Company Name */}
              <Field label="Company Name">
                <input
                  className="vr-modal-input"
                  style={baseInput}
                  placeholder="Enter company name"
                  value={form.company_name}
                  onChange={e => sf('company_name', e.target.value)}
                />
              </Field>

              {/* Row 3: Department + Author */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <Field label="Department">
                  <input
                    className="vr-modal-input"
                    style={baseInput}
                    placeholder="e.g. Procurement"
                    value={form.department}
                    onChange={e => sf('department', e.target.value)}
                  />
                </Field>
                <Field label="Author">
                  <input
                    className="vr-modal-input"
                    style={baseInput}
                    placeholder="Author name"
                    value={form.author}
                    onChange={e => sf('author', e.target.value)}
                  />
                </Field>
              </div>

              {/* Row 4: Attendants + Subject */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <Field label="Attendants">
                  <input
                    className="vr-modal-input"
                    style={baseInput}
                    placeholder="Names, comma-separated"
                    value={form.attendants}
                    onChange={e => sf('attendants', e.target.value)}
                  />
                </Field>
                <Field label="Subject">
                  <input
                    className="vr-modal-input"
                    style={baseInput}
                    placeholder="Meeting subject"
                    value={form.subject}
                    onChange={e => sf('subject', e.target.value)}
                  />
                </Field>
              </div>

              {/* Row 5: Agenda */}
              <Field label="Agenda">
                <textarea
                  className="vr-modal-input"
                  style={{ ...baseInput, resize: 'vertical', minHeight: 72 }}
                  placeholder="Meeting agenda..."
                  value={form.agenda}
                  onChange={e => sf('agenda', e.target.value)}
                />
              </Field>

              {/* Row 6: Details of Meeting */}
              <Field label="Details of Meeting">
                <textarea
                  className="vr-modal-input"
                  style={{ ...baseInput, resize: 'vertical', minHeight: 100 }}
                  placeholder="Detailed notes from the meeting..."
                  value={form.details_of_meeting}
                  onChange={e => sf('details_of_meeting', e.target.value)}
                />
              </Field>

              {/* Row 7: Remarks */}
              <Field label="Remarks">
                <textarea
                  className="vr-modal-input"
                  style={{ ...baseInput, resize: 'vertical', minHeight: 72 }}
                  placeholder="Any additional remarks..."
                  value={form.remarks}
                  onChange={e => sf('remarks', e.target.value)}
                />
              </Field>

              {/* File Upload */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: 12,
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
                    Upload Files ({files.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: '#fff', border: `1px solid ${BORDER}`,
                      borderRadius: 7, padding: '8px 16px',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      color: '#374151', fontFamily: FONT,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                    </svg>
                    Attach Files
                  </button>
                  <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileAdd} />
                </div>

                {files.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 10 }}>
                    {files.map((f, i) => (
                      <FileCard key={i} file={f} onRemove={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} />
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{
                      border: `1.5px dashed ${BORDER}`, borderRadius: 8,
                      padding: '24px 20px', textAlign: 'center',
                      cursor: 'pointer', color: '#9ca3af', fontSize: 13,
                      fontFamily: FONT, background: '#fafafa',
                    }}
                  >
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 8px' }}>
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49" strokeLinecap="round" />
                    </svg>
                    Click to attach files
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 28px', borderTop: '1px solid #eef0f4',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: 12, flexShrink: 0,
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '11px 28px', border: `1px solid ${BORDER}`,
                borderRadius: 8, background: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                color: '#374151', fontFamily: FONT,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '11px 28px', border: 'none',
                borderRadius: 8, background: submitting ? '#94a3b8' : PRIMARY,
                fontSize: 14, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                color: '#fff', fontFamily: FONT,
              }}
            >
              {submitting ? 'Saving...' : 'Save Visit Report'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}