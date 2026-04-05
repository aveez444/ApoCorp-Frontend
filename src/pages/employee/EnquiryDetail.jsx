import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import Toast from '../../components/Toast'
import CreateQuoteModal from '../../components/modals/CreateQuoteModal'

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
  xCircle:   'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM15 9l-6 6M9 9l6 6',
  quote:     'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  pin:       'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  user:      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  mail:      'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  phone:     'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  eye:       'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  download:  'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  file:      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  check:     'M20 6L9 17l-5-5',
  attach:    'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49',
}

const STATUS_COLORS = {
  NEW:         { bg:'#eff6ff', color:'#1d4ed8', dot:'#3b82f6' },
  NEGOTIATION: { bg:'#fefce8', color:'#92400e', dot:'#f59e0b' },
  PO_RECEIVED: { bg:'#f0fdf4', color:'#166534', dot:'#22c55e' },
  LOST:        { bg:'#fef2f2', color:'#991b1b', dot:'#ef4444' },
  REGRET:      { bg:'#fdf4ff', color:'#6b21a8', dot:'#a855f7' },
}
const STATUS_LABELS = {
  NEW:'New Enquiry', NEGOTIATION:'Under Negotiation',
  PO_RECEIVED:'PO Received', LOST:'Enquiry Lost', REGRET:'Regret',
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg:'#f1f5f9', color:'#64748b', dot:'#94a3b8' }
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      background:s.bg, color:s.color,
      fontSize:12, fontWeight:700, fontFamily:FONT,
      padding:'5px 12px', borderRadius:99,
    }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:s.dot, display:'inline-block', flexShrink:0 }} />
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display:'flex', gap:8, marginBottom:10, fontSize:13.5, fontFamily:FONT }}>
      <span style={{ color:LABEL, fontWeight:500, minWidth:160, flexShrink:0 }}>{label} :</span>
      <span style={{ color:'#111827', fontWeight:600 }}>{value || '—'}</span>
    </div>
  )
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────
function EditEnquiryModal({ enquiry, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({
    subject: enquiry.subject || '',
    product_name: enquiry.product_name || '',
    currency: enquiry.currency || 'INR',
    prospective_value: enquiry.prospective_value || '',
    enquiry_type: enquiry.enquiry_type || '',
    source_of_enquiry: enquiry.source_of_enquiry || '',
    priority: enquiry.priority || 'MEDIUM',
    due_date: enquiry.due_date || '',
    target_submission_date: enquiry.target_submission_date || '',
    status: enquiry.status || 'NEW',
    region: enquiry.region || '',
    regional_manager: enquiry.regional_manager || '',
  })
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/accounts/users/?role=all')
        setUsers(response.data || [])
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }
    fetchUsers()
  }, [])

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch(`/enquiries/${enquiry.id}/`, {
        ...form,
        prospective_value: form.prospective_value ? parseFloat(form.prospective_value) : null,
        regional_manager: form.regional_manager || null,
      })
      if (files.length > 0) {
        setUploading(true)
        for (const f of files) {
          const fd = new FormData()
          fd.append('file', f)
          await api.post(`/enquiries/${enquiry.id}/upload_file/`, fd)
        }
        setUploading(false)
      }
      onSaved()
    } catch (e) {
      console.error(e)
      alert(e.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Something went wrong')
    } finally { setSaving(false) }
  }

  const baseInput = {
    border:`1px solid ${BORDER}`, borderRadius:7, padding:'10px 13px',
    fontSize:'13.5px', fontFamily:FONT, color:TEXT, outline:'none',
    background:'#fff', width:'100%', boxSizing:'border-box',
    transition:'border-color 0.15s',
  }
  const selectBase = {
    ...baseInput,
    appearance:'none',
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat:'no-repeat', backgroundPosition:'right 13px center', paddingRight:38, cursor:'pointer',
  }
  const Field = ({ label, children, style }) => (
    <div style={{ position:'relative', ...style }}>
      <span style={{ position:'absolute', top:-9, left:10, background:'#fff', padding:'0 4px', fontSize:'11px', fontWeight:600, color:LABEL, fontFamily:FONT, zIndex:1, pointerEvents:'none' }}>
        {label}
      </span>
      {children}
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:720, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 25px 60px rgba(0,0,0,.2)' }}>
        <div style={{ padding:'22px 28px', borderBottom:'1px solid #eef0f4', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:PRIMARY, fontFamily:FONT }}>Edit Enquiry</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', padding:4, borderRadius:6 }}>
            <Icon d={ic.xCircle} size={20} color="#9ca3af" />
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Field label="Email Subject">
              <input style={baseInput} placeholder="Email subject / description" value={form.subject} onChange={e => sf('subject', e.target.value)} />
            </Field>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 140px 1fr', gap:16 }}>
              <Field label="Product / Item">
                <input style={baseInput} placeholder="Product or item" value={form.product_name} onChange={e => sf('product_name', e.target.value)} />
              </Field>
              <Field label="Currency">
                <select style={selectBase} value={form.currency} onChange={e => sf('currency', e.target.value)}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </Field>
              <Field label="Prospective Value">
                <input style={baseInput} type="number" placeholder="Value" value={form.prospective_value} onChange={e => sf('prospective_value', e.target.value)} />
              </Field>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
              <Field label="Enquiry Type">
                <select style={selectBase} value={form.enquiry_type} onChange={e => sf('enquiry_type', e.target.value)}>
                  <option value="">— Select —</option>
                  <option value="Budgetary">Budgetary</option>
                  <option value="Firm">Firm</option>
                  <option value="Repeat Order">Repeat Order</option>
                </select>
              </Field>
              <Field label="Source of Enquiry">
                <input style={baseInput} placeholder="e.g. Sales Engineer" value={form.source_of_enquiry} onChange={e => sf('source_of_enquiry', e.target.value)} />
              </Field>
              <Field label="Priority">
                <select style={selectBase} value={form.priority} onChange={e => sf('priority', e.target.value)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </Field>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
              <Field label="Due Date">
                <input type="date" style={baseInput} value={form.due_date} onChange={e => sf('due_date', e.target.value)} />
              </Field>
              <Field label="Target Date Submission">
                <input type="date" style={baseInput} value={form.target_submission_date} onChange={e => sf('target_submission_date', e.target.value)} />
              </Field>
              <Field label="Status">
                <select style={selectBase} value={form.status} onChange={e => sf('status', e.target.value)}>
                  <option value="NEW">New Enquiry</option>
                  <option value="NEGOTIATION">Under Negotiation</option>
                  <option value="PO_RECEIVED">PO Received</option>
                  <option value="LOST">Enquiry Lost</option>
                  <option value="REGRET">Regret</option>
                </select>
              </Field>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <Field label="Region">
                <select
                  style={selectBase}
                  value={form.region}
                  onChange={e => sf('region', e.target.value)}
                >
                  <option value="">— Select Region —</option>
                  <option value="NORTH">North</option>
                  <option value="SOUTH">South</option>
                  <option value="EAST">East</option>
                  <option value="WEST">West</option>
                  <option value="CENTRAL">Central</option>
                </select>
              </Field>

              <Field label="Regional Manager">
                <select
                  style={selectBase}
                  value={form.regional_manager}
                  onChange={e => sf('regional_manager', e.target.value)}
                >
                  <option value="">— Select Manager —</option>
                  {users
                    .filter(u => u.role === 'manager')
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.first_name || u.last_name
                          ? `${u.first_name} ${u.last_name}`.trim()
                          : u.username}{' '}
                        (Manager)
                      </option>
                    ))}
                </select>
              </Field>
            </div>

            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:14, fontWeight:600, color:PRIMARY, fontFamily:FONT }}>Attach Files ({files.length})</span>
                <button type="button" onClick={() => fileRef.current?.click()} style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:`1px solid ${BORDER}`, borderRadius:7, padding:'7px 14px', fontSize:'13px', fontWeight:600, cursor:'pointer', color:'#374151', fontFamily:FONT }}>
                  <Icon d={ic.attach} size={13} color="#374151" /> Attach
                </button>
                <input ref={fileRef} type="file" multiple style={{ display:'none' }} onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])} />
              </div>
              {files.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', border:`1px solid ${BORDER}`, borderRadius:8, padding:'8px 12px', background:'#fafafa' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Icon d={ic.file} size={14} color={ACCENT} />
                        <span style={{ fontSize:13, fontFamily:FONT, color:TEXT }}>{f.name}</span>
                      </div>
                      <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', padding:2 }}>
                        <Icon d="M18 6L6 18M6 6l12 12" size={13} color="#9ca3af" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding:'16px 28px', borderTop:'1px solid #eef0f4', display:'flex', gap:12, justifyContent:'flex-end', flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'10px 28px', border:`1px solid ${BORDER}`, borderRadius:8, background:'#fff', fontSize:'13.5px', fontWeight:600, cursor:'pointer', color:'#374151', fontFamily:FONT }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || uploading} style={{ padding:'10px 28px', border:'none', borderRadius:8, background: saving ? '#94a3b8' : PRIMARY, fontSize:'13.5px', fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', color:'#fff', fontFamily:FONT }}>
            {saving ? 'Saving…' : uploading ? 'Uploading…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Reject Modal (Enquiry Lost) ─────────────────────────────────────────────────────────────
function RejectModal({ enquiry, onClose, onSuccess }) {
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState('LOST')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) { alert('Please provide a reason'); return }
    setSaving(true)
    try {
      await api.patch(`/enquiries/${enquiry.id}/`, { status, rejection_reason: reason })
      onSuccess()
    } catch (e) {
      console.error(e)
      alert(e.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Something went wrong')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:440, padding:'32px', boxShadow:'0 25px 60px rgba(0,0,0,.2)' }}>
        <div style={{ width:52, height:52, borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <Icon d={ic.xCircle} size={24} color="#ef4444" />
        </div>
        <h2 style={{ textAlign:'center', fontSize:18, fontWeight:700, color:'#111827', margin:'0 0 6px', fontFamily:FONT }}>Reject Enquiry</h2>
        <p style={{ textAlign:'center', color:'#6b7280', fontSize:13.5, margin:'0 0 22px', fontFamily:FONT }}>Provide reason and final status for this enquiry</p>

        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:600, color:LABEL, marginBottom:6, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'.04em' }}>Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={{ width:'100%', padding:'10px 13px', border:`1px solid ${BORDER}`, borderRadius:8, fontSize:13.5, fontFamily:FONT, color:TEXT, cursor:'pointer', appearance:'none' }}
          >
            <option value="LOST">Enquiry Lost</option>
            <option value="REGRET">Regret</option>
          </select>
        </div>

        <div style={{ marginBottom:22 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:600, color:LABEL, marginBottom:6, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'.04em' }}>Reason</label>
          <textarea
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Explain why this enquiry is being rejected…"
            style={{ width:'100%', padding:'10px 13px', border:`1px solid ${BORDER}`, borderRadius:8, fontSize:13.5, fontFamily:FONT, color:TEXT, resize:'none', outline:'none', boxSizing:'border-box' }}
          />
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px 0', borderRadius:9, border:`1px solid ${BORDER}`, background:'#fff', color:'#4b5563', fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex:1, padding:'11px 0', borderRadius:9, border:'none', background:'#dc2626', color:'#fff', fontSize:13.5, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1, fontFamily:FONT }}>
            {saving ? 'Rejecting…' : 'Reject Enquiry'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PO Received Modal ─────────────────────────────────────────────────────────────
function PoReceivedModal({ enquiry, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await api.patch(`/enquiries/${enquiry.id}/`, { status: 'PO_RECEIVED' })
      onSuccess()
    } catch (e) {
      console.error(e)
      alert(e.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Something went wrong')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:440, padding:'32px', boxShadow:'0 25px 60px rgba(0,0,0,.2)' }}>
        <div style={{ width:52, height:52, borderRadius:'50%', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <Icon d="M20 6L9 17l-5-5" size={24} color="#22c55e" />
        </div>
        <h2 style={{ textAlign:'center', fontSize:18, fontWeight:700, color:'#111827', margin:'0 0 6px', fontFamily:FONT }}>Mark as PO Received</h2>
        <p style={{ textAlign:'center', color:'#6b7280', fontSize:13.5, margin:'0 0 22px', fontFamily:FONT }}>
          Are you sure you want to mark enquiry <strong>{enquiry.enquiry_number}</strong> as PO Received?
        </p>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px 0', borderRadius:9, border:`1px solid ${BORDER}`, background:'#fff', color:'#4b5563', fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex:1, padding:'11px 0', borderRadius:9, border:'none', background:'#22c55e', color:'#fff', fontSize:13.5, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1, fontFamily:FONT }}>
            {saving ? 'Updating...' : 'Confirm PO Received'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Regret Modal ─────────────────────────────────────────────────────────────
function RegretModal({ enquiry, onClose, onSuccess }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) { alert('Please provide a reason'); return }
    setSaving(true)
    try {
      await api.patch(`/enquiries/${enquiry.id}/`, { status: 'REGRET', rejection_reason: reason })
      onSuccess()
    } catch (e) {
      console.error(e)
      alert(e.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Something went wrong')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:440, padding:'32px', boxShadow:'0 25px 60px rgba(0,0,0,.2)' }}>
        <div style={{ width:52, height:52, borderRadius:'50%', background:'#fdf4ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <Icon d={ic.xCircle} size={24} color="#a855f7" />
        </div>
        <h2 style={{ textAlign:'center', fontSize:18, fontWeight:700, color:'#111827', margin:'0 0 6px', fontFamily:FONT }}>Mark as Regret</h2>
        <p style={{ textAlign:'center', color:'#6b7280', fontSize:13.5, margin:'0 0 22px', fontFamily:FONT }}>
          Provide a reason for regretting this enquiry
        </p>

        <div style={{ marginBottom:22 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:600, color:LABEL, marginBottom:6, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'.04em' }}>Reason</label>
          <textarea
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Explain why this enquiry is being regretted…"
            style={{ width:'100%', padding:'10px 13px', border:`1px solid ${BORDER}`, borderRadius:8, fontSize:13.5, fontFamily:FONT, color:TEXT, resize:'none', outline:'none', boxSizing:'border-box' }}
          />
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px 0', borderRadius:9, border:`1px solid ${BORDER}`, background:'#fff', color:'#4b5563', fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex:1, padding:'11px 0', borderRadius:9, border:'none', background:'#a855f7', color:'#fff', fontSize:13.5, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1, fontFamily:FONT }}>
            {saving ? 'Updating...' : 'Confirm Regret'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Detail Page ─────────────────────────────────────────────────────────
export default function EnquiryDetail({ basePath = '/employee/enquiries' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [enquiry, setEnquiry] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [editOpen, setEditOpen]     = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [poReceivedOpen, setPoReceivedOpen] = useState(false)
  const [regretOpen, setRegretOpen] = useState(false)
  const [quoteOpen, setQuoteOpen]   = useState(false)
  const [toast, setToast] = useState(null)

  const load = () => {
    setLoading(true)
    api.get(`/enquiries/${id}/`)
      .then(r => setEnquiry(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, fontFamily:FONT, color:'#94a3b8', gap:12 }}>
      <div style={{ width:20, height:20, border:'2px solid #e2e8f0', borderTopColor:PRIMARY, borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      Loading…
    </div>
  )

  if (!enquiry) return (
    <div style={{ textAlign:'center', padding:60, fontFamily:FONT, color:'#94a3b8' }}>Enquiry not found.</div>
  )

  const customer = enquiry.customer_detail || {}
  const primaryPoc = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
  const billingAddr = customer.addresses?.find(a => a.address_type === 'BILLING') || {}

  const canReject = ['NEW', 'NEGOTIATION'].includes(enquiry.status)
  const canMarkPoReceived = enquiry.status === 'NEGOTIATION'
  const canMarkRegret = ['NEW', 'NEGOTIATION'].includes(enquiry.status) && !['LOST', 'REGRET'].includes(enquiry.status)
  const isRejected = ['LOST', 'REGRET'].includes(enquiry.status)

  const getRegionLabel = (regionCode) => {
    const regionMap = {
      'NORTH': 'North',
      'SOUTH': 'South',
      'EAST': 'East',
      'WEST': 'West',
      'CENTRAL': 'Central',
    }
    return regionMap[regionCode] || regionCode || '—'
  }

  return (
    <div style={{ fontFamily:FONT, color:TEXT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        .file-card:hover { border-color: ${ACCENT} !important; background: #f0f8ff !important; }
      `}</style>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ width:36, height:36, borderRadius:9, border:'1.5px solid #e5e7eb', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
          >
            <Icon d={ic.arrowLeft} size={16} color="#6b7280" />
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:PRIMARY }}>{enquiry.enquiry_number}</h1>
            <StatusBadge status={enquiry.status} />
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={() => setEditOpen(true)} style={outlineBtn}>
            <Icon d={ic.edit} size={14} color={PRIMARY} /> Edit
          </button>
          <button onClick={() => window.print()} style={outlineBtn}>
            <Icon d={ic.print} size={14} color={PRIMARY} /> Print
          </button>
          
          {canMarkPoReceived && (
            <button onClick={() => setPoReceivedOpen(true)} style={poReceivedBtn}>
              <Icon d={ic.check} size={14} color="#16a34a" /> PO Received
            </button>
          )}
          
          {canMarkRegret && (
            <button onClick={() => setRegretOpen(true)} style={regretBtn}>
              <Icon d={ic.xCircle} size={14} color="#9333ea" /> Regret
            </button>
          )}
          
          {canReject && (
            <button onClick={() => setRejectOpen(true)} style={rejectBtn}>
              <Icon d={ic.xCircle} size={14} color="#dc2626" /> Reject Enquiry
            </button>
          )}
          
          {/* Create Quote Button Logic */}
          {(() => {
            const hasQuotation = enquiry.quotation !== null && enquiry.quotation !== undefined;
            
            if (['LOST', 'REGRET'].includes(enquiry.status)) {
              return null;
            }
            
            if (enquiry.status === 'NEW' && !hasQuotation) {
              return (
                <button
                  onClick={() => setQuoteOpen(true)}
                  style={createQuoteBtn}
                >
                  <Icon d={ic.quote} size={14} color="#fff" /> Create Quote
                </button>
              );
            }
            
            if (hasQuotation) {
              return (
                <button
                  disabled
                  style={{
                    ...createQuoteBtn,
                    background: '#9ca3af',
                    cursor: 'not-allowed',
                    boxShadow: 'none',
                    opacity: 0.7
                  }}
                  title="A quotation already exists for this enquiry"
                >
                  <Icon d={ic.quote} size={14} color="#fff" /> Quote Exists
                </button>
              );
            }
            
            if (!hasQuotation) {
              return (
                <button
                  disabled
                  style={{
                    ...createQuoteBtn,
                    background: '#9ca3af',
                    cursor: 'not-allowed',
                    boxShadow: 'none',
                    opacity: 0.7
                  }}
                  title="Quote can only be created for New Enquiries"
                >
                  <Icon d={ic.quote} size={14} color="#fff" /> Create Quote
                </button>
              );
            }
            
            return null;
          })()}
        </div>
      </div>

      {/* Sub-header info */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, fontSize:13.5 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, color:'#374151', fontWeight:600 }}>
          <Icon d={ic.user} size={14} color="#6b7280" />
          {customer.company_name || '—'}
        </div>
        <span style={{ color:'#d1d5db' }}>|</span>
        <div style={{ display:'flex', alignItems:'center', gap:6, color:'#374151' }}>
          <Icon d={ic.pin} size={14} color="#6b7280" />
          {[billingAddr.city || customer.city, customer.country].filter(Boolean).join(', ') || '—'}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeUp .3s ease' }}>

        {/* Enquiry Details */}
        <div style={card}>
          <SectionTitle>Enquiry Details</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:0 }}>
            <InfoRow label="POC" value={primaryPoc.name} />
            <InfoRow label="Entity Name" value={customer.company_name} />
            <InfoRow label="Designation" value={primaryPoc.designation} />
            <InfoRow label="Phone (Landline)" value={customer.telephone_primary} />
            <InfoRow label="Phone (Mobile)" value={primaryPoc.phone || customer.telephone_primary} />
            <InfoRow label="Email ID" value={primaryPoc.email || customer.email} />
            <InfoRow label="City" value={billingAddr.city || customer.city} />
            <InfoRow label="State" value={billingAddr.state || customer.state} />
          </div>
          {(billingAddr.address_line || customer.address) && (
            <InfoRow label="Detailed Address" value={billingAddr.address_line || customer.address} />
          )}
        </div>

        {/* Requirement Details */}
        <div style={card}>
          <SectionTitle>Requirement Details</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:0 }}>
            <InfoRow label="Email Subject" value={enquiry.subject} />
            <div />
            <div />
            <InfoRow label="Quotation Number" value={enquiry.enquiry_number} />
            <InfoRow label="Product / Item" value={enquiry.product_name} />
            <InfoRow label="Prospective Value" value={enquiry.prospective_value ? `${enquiry.currency || 'INR'} ${new Intl.NumberFormat('en-IN').format(enquiry.prospective_value)}` : '—'} />
            <InfoRow label="Enquiry Assigned to" value={enquiry.assigned_to_name || '—'} />
            <InfoRow label="Enquiry Type" value={enquiry.enquiry_type || '—'} />
            <InfoRow label="Source of Enquiry" value={enquiry.source_of_enquiry || '—'} />
            <InfoRow label="Region" value={getRegionLabel(enquiry.region)} />
            <InfoRow label="Regional Manager" value={enquiry.regional_manager_name || '—'} />
            <InfoRow label="Priority" value={enquiry.priority === 'LOW' ? 'Low' : enquiry.priority === 'MEDIUM' ? 'Medium' : enquiry.priority === 'HIGH' ? 'High' : enquiry.priority} />
            <InfoRow label="Due Date" value={enquiry.due_date} />
            <InfoRow label="Target Date Submission" value={enquiry.target_submission_date} />
          </div>
          {isRejected && enquiry.rejection_reason && (
            <div style={{ marginTop:10, padding:'12px 16px', background:'#fef2f2', borderRadius:8, border:'1px solid #fecaca' }}>
              <span style={{ fontSize:12.5, fontWeight:600, color:'#991b1b', fontFamily:FONT }}>Rejection Reason: </span>
              <span style={{ fontSize:13, color:'#7f1d1d', fontFamily:FONT }}>{enquiry.rejection_reason}</span>
            </div>
          )}
        </div>

        {enquiry.attachments?.length > 0 && (
          <div style={card}>
            <SectionTitle>Attached Files</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:12 }}>
              {enquiry.attachments.map((att, i) => {
                const fileUrl = att.file_url || att.file
                const fileName = fileUrl.split('/').pop() || 'Unknown file'
                const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE'
                
                return (
                  <div
                    key={att.id || i}
                    className="file-card"
                    style={{ 
                      display:'flex', 
                      alignItems:'center', 
                      justifyContent:'space-between', 
                      border:'1.5px solid #e5e7eb', 
                      borderRadius:10, 
                      padding:'12px 16px', 
                      background:'#fafafa', 
                      transition:'all .15s', 
                      cursor:'default' 
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ 
                        width:38, 
                        height:38, 
                        borderRadius:8, 
                        background:'#EEF3FF', 
                        display:'flex', 
                        alignItems:'center', 
                        justifyContent:'center', 
                        flexShrink:0 
                      }}>
                        <Icon d={ic.file} size={18} color={PRIMARY} />
                      </div>
                      <div>
                        <div style={{ 
                          fontSize:13, 
                          fontWeight:600, 
                          color:TEXT, 
                          fontFamily:FONT,
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {fileName}
                        </div>
                        <div style={{ fontSize:11.5, color:'#9ca3af', fontFamily:FONT }}>
                          {ext} File
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ 
                          display:'flex', 
                          alignItems:'center', 
                          justifyContent:'center', 
                          width:30, 
                          height:30, 
                          borderRadius:6, 
                          border:'1px solid #e5e7eb', 
                          background:'#fff', 
                          textDecoration:'none' 
                        }}
                      >
                        <Icon d={ic.eye} size={13} color="#6b7280" />
                      </a>
                      <a 
                        href={fileUrl} 
                        download 
                        style={{ 
                          display:'flex', 
                          alignItems:'center', 
                          justifyContent:'center', 
                          width:30, 
                          height:30, 
                          borderRadius:6, 
                          border:'1px solid #e5e7eb', 
                          background:'#fff', 
                          textDecoration:'none' 
                        }}
                      >
                        <Icon d={ic.download} size={13} color="#6b7280" />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {editOpen && (
        <EditEnquiryModal
          enquiry={enquiry}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); setToast('Enquiry updated successfully!'); load() }}
        />
      )}

      {rejectOpen && (
        <RejectModal
          enquiry={enquiry}
          onClose={() => setRejectOpen(false)}
          onSuccess={() => { setRejectOpen(false); setToast('Enquiry rejected.'); load() }}
        />
      )}

      {poReceivedOpen && (
        <PoReceivedModal
          enquiry={enquiry}
          onClose={() => setPoReceivedOpen(false)}
          onSuccess={() => { setPoReceivedOpen(false); setToast('Enquiry marked as PO Received!'); load() }}
        />
      )}

      {regretOpen && (
        <RegretModal
          enquiry={enquiry}
          onClose={() => setRegretOpen(false)}
          onSuccess={() => { setRegretOpen(false); setToast('Enquiry marked as Regret.'); load() }}
        />
      )}

      {quoteOpen && (
        <CreateQuoteModal
          open={quoteOpen}
          enquiry={enquiry}
          onClose={() => setQuoteOpen(false)}
          onSuccess={() => {
            setQuoteOpen(false)
            setToast('Quotation created successfully!')
            load()
          }}
        />
      )}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize:'15px', fontWeight:700, color:PRIMARY,
      fontFamily:FONT, marginBottom:16, paddingBottom:10,
      borderBottom:'1.5px solid #eef0f4',
    }}>
      {children}
    </div>
  )
}

const card = {
  background:'#fff', borderRadius:12, padding:'20px 24px',
  boxShadow:'0 1px 8px rgba(0,0,0,.06)',
}
const outlineBtn = {
  display:'flex', alignItems:'center', gap:6,
  padding:'8px 18px', border:`1.5px solid ${PRIMARY}`,
  borderRadius:8, background:'#fff', color:PRIMARY,
  fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FONT,
}
const rejectBtn = {
  display:'flex', alignItems:'center', gap:6,
  padding:'8px 18px', border:'1.5px solid #fca5a5',
  borderRadius:8, background:'#fff', color:'#dc2626',
  fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FONT,
}
const poReceivedBtn = {
  display:'flex', alignItems:'center', gap:6,
  padding:'8px 18px', border:'1.5px solid #22c55e',
  borderRadius:8, background:'#fff', color:'#16a34a',
  fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FONT,
}
const regretBtn = {
  display:'flex', alignItems:'center', gap:6,
  padding:'8px 18px', border:'1.5px solid #a855f7',
  borderRadius:8, background:'#fff', color:'#9333ea',
  fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FONT,
}
const createQuoteBtn = {
  display:'flex', alignItems:'center', gap:6,
  padding:'9px 20px', border:'none',
  borderRadius:8, background:PRIMARY, color:'#fff',
  fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:FONT,
  boxShadow:'0 2px 10px rgba(18,44,65,.25)',
}