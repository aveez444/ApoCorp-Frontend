import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Toast from '../../components/Toast'
import CreateQuoteModal from '../../components/modals/CreateQuoteModal'
import { printEnquiryDetail } from '../../components/PrintEnquiryDetail'

const FONT = 'Lato, sans-serif'
const PRIMARY = '#122C41'

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


const STATUS_CONFIG = {
  NEW:         { bg: '#E2F1FF', color: '#1565C0', dot: '#1E88E5', label: 'New Enquiry' },
  NEGOTIATION: { bg: '#F3E8FF', color: '#7B1FA2', dot: '#9C27B0', label: 'Under Negotiation' },
  PO_RECEIVED: { bg: '#E8F5E9', color: '#2E7D32', dot: '#43A047', label: 'PO Received' },
  LOST:        { bg: '#FFEBEE', color: '#C62828', dot: '#E53935', label: 'Enquiry Lost' },
  REGRET:      { bg: '#FFF3E0', color: '#E65100', dot: '#FB8C00', label: 'Regret' },
}

const PRIORITY_ORDER = ['LOW', 'MEDIUM', 'HIGH']
const PRIORITY_COLORS = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444' }
const PRIORITY_LABELS = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' }

function FlagIcon({ active, color, size = 18 }) {
  const c = active ? color : '#d1d5db'
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="4" y1="2" x2="4" y2="18" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 3.5 L15.5 3.5 Q16.5 3.5 16 4.5 L13.5 8.5 L16 12.5 Q16.5 13.5 15.5 13.5 L4 13.5 Z" fill={c} />
    </svg>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', label: status }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: s.bg, color: s.color, padding: '5px 14px', borderRadius: 20, fontSize: '13px', fontWeight: 600, fontFamily: FONT, border: `1px solid ${s.dot}55` }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

// A labelled info pair matching Figma's "Label : Value" style in the same row
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: '14px', color: '#4B5563', fontFamily: FONT, fontWeight: 400, whiteSpace: 'nowrap' }}>{label} :</span>
      <span style={{ fontSize: '14px', fontWeight: 600, color: PRIMARY, fontFamily: FONT }}>{value || '—'}</span>
    </div>
  )
}

function SectionCard({ title, children, noPad }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D1D5DB', overflow: 'hidden' }}>
      <div style={{ padding: '14px 24px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
        <span style={{ fontSize: '16px', fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>{title}</span>
      </div>
      <div style={noPad ? {} : { padding: '22px 24px' }}>{children}</div>
    </div>
  )
}

function EditField({ label, value, onChange, type = 'text', options, placeholder }) {
  const base = { padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '13.5px', fontFamily: FONT, color: '#374151', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' }
  const sel = { ...base, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 11px center', paddingRight: 32, cursor: 'pointer' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#6b7280', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
      {options ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={sel}>
          {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base, resize: 'vertical' }} />
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      )}
    </div>
  )
}

function resolveEmpName(emp) {
  if (!emp) return null
  const u = emp.user || emp
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  return full || u.username || null
}

function resolveEmpId(emp) {
  return emp?.user?.id ?? emp?.id ?? null
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  return `${dd}/${m}/${y}`
}

// Get region label for display
function getRegionLabel(regionCode) {
  const regionMap = {
    'NORTH': 'North',
    'SOUTH': 'South',
    'EAST': 'East',
    'WEST': 'West',
    'CENTRAL': 'Central',
  }
  return regionMap[regionCode] || regionCode || '—'
}

// Resolve first POC from customer_detail
function getPOC(customer) {
  if (!customer) return {}
  const poc = customer.pocs?.[0] || {}
  return poc
}

// Get billing address from customer_detail
function getAddress(customer) {
  if (!customer) return {}
  return customer.addresses?.find(a => a.address_type === 'BILLING') || customer.addresses?.[0] || {}
}

export default function ManagerEnquiryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [enquiry, setEnquiry] = useState(null)
  const [employees, setEmployees] = useState([])
  const [empMap, setEmpMap] = useState({})
  const [users, setUsers] = useState([]) // For regional manager dropdown
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)

  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const [showCreateQuote, setShowCreateQuote] = useState(false)
  const [savingPriority, setSavingPriority] = useState(false)
  const [savingAssign, setSavingAssign] = useState(false)
  const [assignTo, setAssignTo] = useState('')

  const refetch = () => {
    api.get(`/enquiries/${id}/`).then(r => {
      setEnquiry(r.data)
      setEditData(r.data)
      setAssignTo(String(r.data.assigned_to || ''))
    }).catch(console.error)
  }

  useEffect(() => {
    Promise.all([
      api.get(`/enquiries/${id}/`),
      api.get('/accounts/tenant/employees/').catch(() => ({ data: [] })),
      api.get('/accounts/users/?role=all').catch(() => ({ data: [] })), // Fetch users for regional manager
    ])
      .then(([enqRes, empRes, usersRes]) => {
        setEnquiry(enqRes.data)
        setEditData(enqRes.data)
        setAssignTo(String(enqRes.data.assigned_to || ''))
        const empList = empRes.data?.results || empRes.data || []
        setEmployees(empList)
        const map = {}
        empList.forEach(emp => {
          const eid = resolveEmpId(emp)
          const name = resolveEmpName(emp)
          const uname = (emp.user || emp).username || null
          if (eid != null) {
            map[eid] = { name, username: uname }
            map[String(eid)] = { name, username: uname }
          }
        })
        setEmpMap(map)
        
        // Set users for regional manager dropdown
        const usersList = usersRes.data?.results || usersRes.data || []
        setUsers(usersList)
      })
      .catch(() => navigate('/manager/enquiries'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const setField = field => val => setEditData(prev => ({ ...prev, [field]: val }))

  const getDisplayName = (userId) => {
    if (!userId) return '—'
    const entry = empMap[userId] || empMap[String(userId)]
    return entry?.name || entry?.username || '—'
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        subject: editData.subject,
        product_name: editData.product_name,
        prospective_value: editData.prospective_value,
        currency: editData.currency,
        enquiry_type: editData.enquiry_type,
        source_of_enquiry: editData.source_of_enquiry,
        due_date: editData.due_date || null,
        target_submission_date: editData.target_submission_date || null,
        priority: editData.priority,
        assigned_to: editData.assigned_to || null,
        region: editData.region || null,
        regional_manager: editData.regional_manager || null,
      }
      const res = await api.patch(`/enquiries/${id}/`, payload)
      setEnquiry(res.data); setEditData(res.data)
      setAssignTo(String(res.data.assigned_to || ''))
      setIsEditing(false)
      setToast('Enquiry updated successfully!')
    } catch (err) {
      alert(err?.response?.data ? JSON.stringify(err.response.data) : 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleSetPriority = async (priority) => {
    setSavingPriority(true)
    try {
      const res = await api.patch(`/enquiries/${id}/`, { priority })
      setEnquiry(res.data); setEditData(res.data)
      setToast(`Priority set to ${PRIORITY_LABELS[priority]}`)
    } catch { alert('Failed to set priority.') }
    finally { setSavingPriority(false) }
  }

  const handleAssign = async () => {
    if (!assignTo) return
    setSavingAssign(true)
    try {
      await api.post(`/enquiries/${id}/assign/`, { assigned_to: assignTo })
      refetch()
      setToast('Assigned successfully!')
    } catch (err) {
      alert(err?.response?.data ? JSON.stringify(err.response.data) : 'Assign failed.')
    } finally { setSavingAssign(false) }
  }

  const handleReject = async () => {
    setRejecting(true)
    try {
      const res = await api.patch(`/enquiries/${id}/`, { status: 'LOST', rejection_reason: rejectReason })
      setEnquiry(res.data); setEditData(res.data)
      setShowReject(false); setRejectReason('')
      setToast('Enquiry has been rejected.')
    } catch (err) {
      alert(err?.response?.data ? JSON.stringify(err.response.data) : 'Reject failed.')
    } finally { setRejecting(false) }
  }

  const handleQuoteSuccess = ({ quotationNumber, enquiryNumber }) => {
    setToast(`Quotation ${quotationNumber} created for ${enquiryNumber}`)
    refetch()
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320, color: '#9ca3af', fontFamily: FONT, fontSize: '15px', gap: 10 }}>
      <div style={{ width: 18, height: 18, border: '2px solid #e5e7eb', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Loading...
    </div>
  )

  if (!enquiry) return null

  // customer_detail is the nested serializer from EnquirySerializer
  const cd = enquiry.customer_detail || {}
  const poc = getPOC(cd)
  const addr = getAddress(cd)

  const canReject = !['LOST', 'REGRET', 'PO_RECEIVED'].includes(enquiry.status)
  
  // Create Quote button logic - matches employee side
  const hasQuotation = enquiry.quotation !== null && enquiry.quotation !== undefined;
  const canCreateQuote = enquiry.status === 'NEW' && !hasQuotation;
  const showCreateQuoteButton = !['LOST', 'REGRET'].includes(enquiry.status);
  
  const assignedName = getDisplayName(enquiry.assigned_to)
  const createdByName = getDisplayName(enquiry.created_by)
  const daysSinceActivity = enquiry.last_activity_at
    ? Math.floor((Date.now() - new Date(enquiry.last_activity_at)) / 86400000)
    : null

  // Build full address string
  const fullAddress = [addr.street, addr.city, addr.state, addr.country, addr.pincode].filter(Boolean).join(', ')

  return (
    <div style={{ fontFamily: FONT, padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} button:hover{opacity:0.88}`}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/manager/enquiries')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0, display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: PRIMARY, fontFamily: FONT, letterSpacing: '-0.01em' }}>
                {enquiry.enquiry_number}
              </span>
              <StatusBadge status={enquiry.status} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              {cd.company_name && (
                <span style={{ fontSize: '14px', color: '#4B5563', fontFamily: FONT }}>
                  {cd.company_name}
                </span>
              )}
              {(cd.city || cd.country) && (
                <span style={{ fontSize: '14px', color: '#6B7280', fontFamily: FONT }}>
                  {[cd.city, cd.country].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {isEditing ? (
            <>
              <button onClick={() => { setIsEditing(false); setEditData(enquiry) }} style={outlineBtn}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} style={outlineBtn}>Edit</button>
              <button onClick={() => printEnquiryDetail(enquiry)} style={outlineBtn}>
              <Icon d={ic.print} size={14} color={PRIMARY} /> Print
            </button>
              {canReject && (
                <button onClick={() => setShowReject(true)} style={rejectBtn}>Reject Enquiry</button>
              )}
              {showCreateQuoteButton && (
                canCreateQuote ? (
                  <button
                    onClick={() => setShowCreateQuote(true)}
                    style={primaryBtn}
                  >
                    Create Quote
                  </button>
                ) : hasQuotation ? (
                  <button
                    disabled
                    style={{ ...primaryBtn, opacity: 0.5, cursor: 'not-allowed', background: '#9ca3af' }}
                    title="A quotation already exists for this enquiry"
                  >
                    Quote Exists
                  </button>
                ) : (
                  <button
                    disabled
                    style={{ ...primaryBtn, opacity: 0.5, cursor: 'not-allowed', background: '#9ca3af' }}
                    title="Quote can only be created for New Enquiries"
                  >
                    Create Quote
                  </button>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Two-column main layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 20, alignItems: 'start' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Enquiry Details (POC / Customer info) - REMOVED Region from here */}
          <SectionCard title="Enquiry Details">
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '10px 14px', background: '#F3F4F6', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: '13px', color: '#6B7280', fontFamily: FONT }}>
                  Customer information is read-only. Edit enquiry specifics in the section below.
                </div>
                {/* Show read-only customer block even in edit mode */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', rowGap: 16, columnGap: 24 }}>
                  <InfoRow label="POC" value={[poc.first_name, poc.last_name].filter(Boolean).join(' ') || poc.name || '—'} />
                  <InfoRow label="Entity Name" value={cd.company_name} />
                  <InfoRow label="Designation" value={poc.designation} />
                  <InfoRow label="Phone (Landline)" value={cd.telephone_primary} />
                  <InfoRow label="Phone (Mobile)" value={poc.mobile} />
                  <InfoRow label="Email ID" value={poc.email || cd.email} />
                  {/* Region REMOVED from here */}
                  <InfoRow label="City" value={addr.city || cd.city} />
                  <InfoRow label="State" value={addr.state || cd.state} />
                </div>
                {fullAddress && (
                  <InfoRow label="Detailed Address" value={fullAddress} />
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', rowGap: 16, columnGap: 24 }}>
                  <InfoRow label="POC" value={[poc.first_name, poc.last_name].filter(Boolean).join(' ') || poc.name || '—'} />
                  <InfoRow label="Entity Name" value={cd.company_name} />
                  <InfoRow label="Designation" value={poc.designation} />
                  <InfoRow label="Phone (Landline)" value={cd.telephone_primary} />
                  <InfoRow label="Phone (Mobile)" value={poc.mobile} />
                  <InfoRow label="Email ID" value={poc.email || cd.email} />
                  {/* Region REMOVED from here */}
                  <InfoRow label="City" value={addr.city || cd.city} />
                  <InfoRow label="State" value={[addr.state || cd.state, cd.country].filter(Boolean).join(', ')} />
                </div>
                {fullAddress && (
                  <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 14 }}>
                    <InfoRow label="Detailed Address" value={fullAddress} />
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* Requirement Details - ADDED Region and Regional Manager fields */}
          <SectionCard title="Requirement Details">
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 13 }}>
                  <EditField label="Email Subject" value={editData.subject} onChange={setField('subject')} />
                  <EditField label="Product / Item" value={editData.product_name} onChange={setField('product_name')} />
                  <EditField label="Priority" value={editData.priority} onChange={setField('priority')}
                    options={[['LOW', 'Low'], ['MEDIUM', 'Medium'], ['HIGH', 'High']]} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 13 }}>
                  <EditField label="Currency" value={editData.currency} onChange={setField('currency')}
                    options={[['INR', 'INR (₹)'], ['USD', 'USD ($)'], ['EUR', 'EUR (€)'], ['GBP', 'GBP (£)']]} />
                  <EditField label="Prospective Value" value={editData.prospective_value} onChange={setField('prospective_value')} type="number" />
                  <EditField label="Enquiry Type" value={editData.enquiry_type} onChange={setField('enquiry_type')}
                    options={[['', '—'], ['Budgetary', 'Budgetary'], ['Firm', 'Firm'], ['Repeat Order', 'Repeat Order']]} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 13 }}>
                  <EditField label="Source of Enquiry" value={editData.source_of_enquiry} onChange={setField('source_of_enquiry')} />
                  <EditField label="Due Date" value={editData.due_date} onChange={setField('due_date')} type="date" />
                  <EditField label="Target Date Submission" value={editData.target_submission_date} onChange={setField('target_submission_date')} type="date" />
                </div>
                {/* Region and Regional Manager row - NEW */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
                  <EditField label="Region" value={editData.region} onChange={setField('region')}
                    options={[
                      ['', '— Select Region —'],
                      ['NORTH', 'North'],
                      ['SOUTH', 'South'],
                      ['EAST', 'East'],
                      ['WEST', 'West'],
                      ['CENTRAL', 'Central']
                    ]} />
                  <EditField label="Regional Manager" value={String(editData.regional_manager || '')} onChange={setField('regional_manager')}
                    options={[
                      ['', '— Select Manager —'],
                      ...users
                        .filter(u => u.role === 'manager')
                        .map(u => {
                          const uid = String(u.id)
                          const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.username
                          return [uid, `${name} (Manager)`]
                        })
                    ]} />
                </div>
                <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 12 }}>
                  <EditField label="Assigned To (Sales Rep)" value={String(editData.assigned_to || '')} onChange={setField('assigned_to')}
                    options={[['', '— Unassigned —'], ...employees.map(emp => {
                      const eid = String(resolveEmpId(emp))
                      const ename = resolveEmpName(emp) || eid
                      return [eid, ename]
                    })]}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', rowGap: 16, columnGap: 24 }}>
                  <InfoRow label="Email Subject" value={enquiry.subject} />
                  <InfoRow label="Quotation Number" value={enquiry.enquiry_number} />
                  <InfoRow label="Prospective Value" value={enquiry.prospective_value ? `${enquiry.currency || 'INR'} ${Number(enquiry.prospective_value).toLocaleString('en-IN')}` : null} />
                  <InfoRow label="Product / Item" value={enquiry.product_name} />
                  <InfoRow label="Enquiry Type" value={enquiry.enquiry_type} />
                  <InfoRow label="Source of Enquiry" value={enquiry.source_of_enquiry} />
                  <InfoRow label="Enquiry Assigned to" value={assignedName} />
                  <InfoRow label="Region" value={getRegionLabel(enquiry.region)} />
                  <InfoRow label="Regional Manager" value={enquiry.regional_manager_name || '—'} />
                  <InfoRow label="Priority" value={PRIORITY_LABELS[enquiry.priority] || enquiry.priority} />
                  <InfoRow label="Due Date" value={enquiry.due_date ? fmtDate(enquiry.due_date) : null} />
                  <InfoRow label="Target DT Submittion" value={enquiry.target_submission_date ? fmtDate(enquiry.target_submission_date) : null} />
                </div>
                {enquiry.rejection_reason && (
                  <div style={{ borderTop: '1px solid #fee2e2', paddingTop: 14 }}>
                    <div style={{ background: '#fff5f5', border: '1px solid #fee2e2', borderRadius: 8, padding: '11px 16px' }}>
                      <span style={{ fontSize: '14px', color: '#c62828', fontFamily: FONT, fontWeight: 600 }}>Rejection Reason: </span>
                      <span style={{ fontSize: '14px', color: '#7f1d1d', fontFamily: FONT }}>{enquiry.rejection_reason}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* Attached Files */}
          {enquiry.attachments?.length > 0 && (
            <SectionCard title={`Attached Files (${enquiry.attachments.length})`}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {enquiry.attachments.map((att, i) => {
                  const fileUrl = att.file_url || att.file
                  const filename = fileUrl?.split('/').pop() || `File ${i + 1}`
                  const ext = filename.split('.').pop()?.toUpperCase() || 'FILE'
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #D1D5DB', borderRadius: 8, padding: '11px 16px', background: '#F9FAFB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 7, background: '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #C7D7FF' }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={PRIMARY} strokeWidth={2}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#2563eb', fontFamily: FONT, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filename}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: FONT }}>{ext} File</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#6B7280', display: 'flex', padding: 4, borderRadius: 5, background: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </a>
                        <a href={fileUrl} download
                          style={{ color: '#6B7280', display: 'flex', padding: 4, borderRadius: 5, background: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Activity Days */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D1D5DB', padding: '18px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Activity</div>
            <div style={{ fontSize: '36px', fontWeight: 700, fontFamily: FONT, lineHeight: 1, color: daysSinceActivity > 7 ? '#ef4444' : daysSinceActivity > 3 ? '#f59e0b' : PRIMARY }}>
              {daysSinceActivity !== null ? daysSinceActivity : '—'}
              <span style={{ fontSize: '15px', fontWeight: 400, color: '#9ca3af', marginLeft: 5 }}>Days</span>
            </div>
            {enquiry.last_activity_at && (
              <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT, marginTop: 7 }}>
                Last: {new Date(enquiry.last_activity_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>

          {/* Set Priority */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D1D5DB', padding: '18px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Set Priority</div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {PRIORITY_ORDER.map(p => {
                const isActive = enquiry.priority === p
                return (
                  <button key={p} onClick={() => !savingPriority && handleSetPriority(p)} disabled={savingPriority}
                    title={PRIORITY_LABELS[p]}
                    style={{ background: 'none', border: 'none', cursor: savingPriority ? 'wait' : 'pointer', padding: 3, borderRadius: 5, opacity: isActive ? 1 : 0.3, transform: isActive ? 'scale(1.25)' : 'scale(1)', transition: 'all 0.15s' }}>
                    <FlagIcon active={true} color={PRIORITY_COLORS[p]} size={22} />
                  </button>
                )
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: '13px', color: '#4B5563', fontFamily: FONT }}>
              Current: <span style={{ fontWeight: 700, color: PRIORITY_COLORS[enquiry.priority] || '#6b7280' }}>{PRIORITY_LABELS[enquiry.priority] || '—'}</span>
            </div>
          </div>

          {/* Assign To */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D1D5DB', padding: '18px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Assigned To</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: '13.5px', fontFamily: FONT, color: '#374151', outline: 'none', background: '#fff', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 34, cursor: 'pointer' }}>
                <option value="">— Unassigned —</option>
                {employees.map(emp => {
                  const eid = String(resolveEmpId(emp))
                  const ename = resolveEmpName(emp) || eid
                  return <option key={eid} value={eid}>{ename}</option>
                })}
              </select>
              <button onClick={handleAssign}
                disabled={savingAssign || !assignTo || assignTo === String(enquiry.assigned_to || '')}
                style={{ padding: '10px', border: 'none', borderRadius: 8, background: (savingAssign || !assignTo || assignTo === String(enquiry.assigned_to || '')) ? '#F3F4F6' : PRIMARY, color: (savingAssign || !assignTo || assignTo === String(enquiry.assigned_to || '')) ? '#9ca3af' : '#fff', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s' }}>
                {savingAssign ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div style={{ background: '#F3F4F6', borderRadius: 10, border: '1px solid #D1D5DB', padding: '16px 18px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#4B5563', fontFamily: FONT, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Quick Info
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <QRow label="Enquiry Date" value={enquiry.enquiry_date ? fmtDate(enquiry.enquiry_date) : '—'} />
              <QRow label="Created By" value={createdByName} />
              <QRow label="Customer Tier" value={cd.tier || '—'} />
              <QRow label="Currency" value={enquiry.currency || '—'} />
              <QRow label="Priority" value={PRIORITY_LABELS[enquiry.priority] || '—'} />
              <QRow label="Region" value={getRegionLabel(enquiry.region)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Reject Modal ── */}
      {showReject && (
        <>
          <div onClick={() => setShowReject(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,35,0.45)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', borderRadius: 13, width: '90%', maxWidth: 480, zIndex: 1001, fontFamily: FONT, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '18px', color: PRIMARY }}>Reject Enquiry</span>
              <button onClick={() => setShowReject(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: PRIMARY }}>{enquiry.enquiry_number}</span>
                  <StatusBadge status={enquiry.status} />
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280', fontFamily: FONT }}>{cd.company_name}{cd.city ? ` • ${cd.city}` : ''}</div>
              </div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: 7, fontFamily: FONT }}>
                Rejection Reason <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Enter reason..." rows={4}
                style={{ width: '100%', padding: '10px 13px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: '13.5px', fontFamily: FONT, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowReject(false); setRejectReason('') }} style={outlineBtn}>Cancel</button>
              <button onClick={handleReject} disabled={rejecting}
                style={{ padding: '9px 22px', border: 'none', borderRadius: 8, background: rejecting ? '#fca5a5' : '#ef4444', color: '#fff', fontSize: '13.5px', fontWeight: 600, cursor: rejecting ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
                {rejecting ? 'Rejecting...' : 'Reject Enquiry'}
              </button>
            </div>
          </div>
        </>
      )}

      <CreateQuoteModal open={showCreateQuote} onClose={() => setShowCreateQuote(false)} enquiry={enquiry} onSuccess={handleQuoteSuccess} />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function QRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: '13px', color: '#6B7280', fontFamily: FONT, fontWeight: 400 }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: PRIMARY, fontFamily: FONT }}>{value}</span>
    </div>
  )
}

const outlineBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', border: '1px solid #D1D5DB', borderRadius: 8, background: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer', color: '#374151', fontFamily: FONT, whiteSpace: 'nowrap' }
const primaryBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', border: 'none', borderRadius: 8, background: PRIMARY, fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#fff', fontFamily: FONT, whiteSpace: 'nowrap' }
const rejectBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', border: '1.5px solid #ef4444', borderRadius: 8, background: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#ef4444', fontFamily: FONT, whiteSpace: 'nowrap' }