import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Toast from '../../components/Toast'
import NewEnquiryModal from '../../components/modals/NewEnquiryModal'

const STATUS_COLORS = {
  'NEW':         { bg: '#E2F1FF', color: '#1E88E5', dot: '#1E88E5', label: 'New Enquiry' },
  'NEGOTIATION': { bg: '#FAE7FF', color: '#8E24AA', dot: '#8E24AA', label: 'Under Negotiation' },
  'PO_RECEIVED': { bg: '#EEFFEE', color: '#43A047', dot: '#43A047', label: 'PO Received' },
  'LOST':        { bg: '#FFF5F5', color: '#E53935', dot: '#E53935', label: 'Enquiry Lost' },
  'REGRET':      { bg: '#FFF6EB', color: '#FB8C00', dot: '#FB8C00', label: 'Regret' },
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', label: status }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color, padding: '3px 10px',
      borderRadius: 12, fontSize: '11px', fontWeight: 600,
      fontFamily: 'Lato, sans-serif', border: `1px solid ${s.dot}33`, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  )
}

function PriorityFlags({ priority }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[
        { key: 'LOW',    color: '#22c55e' },
        { key: 'MEDIUM', color: '#f59e0b' },
        { key: 'HIGH',   color: '#ef4444' },
      ].map(({ key, color }) => (
        <svg key={key} width="13" height="13" viewBox="0 0 24 24"
          fill={priority === key ? color : '#e5e7eb'}
          stroke={priority === key ? color : '#d1d5db'} strokeWidth={1.5}>
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      ))}
    </div>
  )
}

function FloatingInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ position: 'relative', flex: '1 1 160px', minWidth: 130 }}>
      <span style={{ position: 'absolute', top: -9, left: 10, background: '#f4f6fb', padding: '0 4px', fontSize: '11px', color: '#6b7280', fontFamily: 'Lato, sans-serif', zIndex: 1, pointerEvents: 'none' }}>
        {label}
      </span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '13px', fontFamily: 'Lato, sans-serif', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
      />
    </div>
  )
}

const thStyle = {
  padding: '12px 14px', fontSize: '12px', fontWeight: 700,
  fontFamily: 'Lato, sans-serif', color: '#fff', textAlign: 'left', whiteSpace: 'nowrap',
}
const tdStyle = {
  padding: '11px 14px', fontSize: '12px', fontFamily: 'Lato, sans-serif',
  color: '#232323', borderRight: '0.5px solid #E5E5E5', whiteSpace: 'nowrap',
}
const outlineBtn = {
  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
  border: '1px solid #d1d5db', borderRadius: 7, background: '#fff',
  fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151',
  fontFamily: 'Lato, sans-serif', whiteSpace: 'nowrap',
}
const primaryBtn = {
  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
  border: 'none', borderRadius: 7, background: '#122C41',
  fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#fff',
  fontFamily: 'Lato, sans-serif', whiteSpace: 'nowrap',
}

const TABLE_HEADERS = [
  'Enquiry Number', 'Date', 'Target Date Submission', 'Entity Name',
  'Prospective Value', 'Phone (Mobile)', 'Enq. Type', 'Status',
  'Sales Rep', 'Priority', 'Source of Enquiry', 'Location', 'Days Since Activity',
]

// ── Helper function to get sales rep name ────────────────────────────────────
function getSalesRepName(enquiry, usersMap = {}) {
  if (enquiry.assigned_to_name) {
    return enquiry.assigned_to_name;
  }
  if (enquiry.assigned_to) {
    return usersMap[enquiry.assigned_to] || `User ${enquiry.assigned_to}`;
  }
  return '—';
}

export default function ManagerEnquiryAllList() {
  const navigate = useNavigate()
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [users, setUsers] = useState({}) // Cache for user names
  const [employees, setEmployees] = useState([]) // For dropdown if needed

  const fetchEmployees = useCallback(() => {
    api.get('/accounts/tenant/employees/')
      .then(res => {
        const empData = res.data || [];
        setEmployees(empData);
        
        // Create a map of user IDs to usernames
        const userMap = {};
        empData.forEach(emp => {
          userMap[emp.id] = emp.username;
        });
        setUsers(userMap);
      })
      .catch(err => console.error('Failed to fetch employees:', err));
  }, []);

  const fetchAll = useCallback(() => {
    setLoading(true)
    api.get('/enquiries/')
      .then(r => {
        const data = r.data?.results || r.data || [];
        setEnquiries(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { 
    fetchAll(); 
    fetchEmployees(); // Fetch employees for name mapping
  }, [fetchAll, fetchEmployees])

  // In ManagerEnquiryAllList.jsx, replace the filtered constant with:

  const filtered = enquiries
    .filter(e => {
      const q = search.toLowerCase()
      const matchSearch = !search || e.enquiry_number?.toLowerCase().includes(q) || e.customer_name_snapshot?.toLowerCase().includes(q)
      const matchLocation = !location || e.customer_city_snapshot?.toLowerCase().includes(location.toLowerCase())
      const matchDate = !date || e.enquiry_date === date
      const matchStatus = !filterStatus || e.status === filterStatus
      return matchSearch && matchLocation && matchDate && matchStatus
    })
    // Add sorting by created_at descending (newest first)
    .sort((a, b) => {
      if (!a.created_at && !b.created_at) return 0
      if (!a.created_at) return 1
      if (!b.created_at) return -1
      return new Date(b.created_at) - new Date(a.created_at)
    })

  const handleExport = () => {
    const headers = TABLE_HEADERS
    const rows = filtered.map(e => [
      e.enquiry_number, e.enquiry_date, e.target_submission_date,
      e.customer_name_snapshot,
      e.prospective_value ? `${e.currency || 'INR'} ${e.prospective_value}` : '',
      e.customer_mobile_snapshot, e.enquiry_type, e.status,
      getSalesRepName(e, users),
      e.priority,
      e.source_of_enquiry,
      [e.customer_city_snapshot, e.customer_state_snapshot, e.customer_country_snapshot].filter(Boolean).join(', '),
      e.days_since_activity ?? '',
    ].map(v => v || ''))
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'all-enquiries.csv'; a.click()
  }

  return (
    <div style={{ fontFamily: 'Lato, sans-serif', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/manager/enquiries')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#122C41', display: 'flex' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#122C41', margin: 0, fontFamily: 'Lato, sans-serif' }}>
            Enquiry Stats ({filtered.length})
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={outlineBtn}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
            </svg>
            Print
          </button>
          <button onClick={handleExport} style={outlineBtn}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            Export to Excel
          </button>
          <button onClick={() => setShowModal(true)} style={primaryBtn}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Enquiry
          </button>
        </div>
      </div>

      {/* Search row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <FloatingInput label="Search Enquiry" value={search} onChange={setSearch} placeholder="Enter Enquiry Name / Number" />
        <FloatingInput label="Location" value={location} onChange={setLocation} placeholder="Enter Location" />
        <FloatingInput label="Date" value={date} onChange={setDate} type="date" />
        <button style={outlineBtn}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          Search
        </button>
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{ ...outlineBtn, background: showFilters ? '#122C41' : '#fff', color: showFilters ? '#fff' : '#374151', borderColor: showFilters ? '#122C41' : '#d1d5db' }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filters
        </button>
      </div>

      {/* Filter chips */}
      {showFilters && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', fontFamily: 'Lato, sans-serif' }}>Status:</span>
          {[['', 'All'], ['NEW', 'New Enquiry'], ['NEGOTIATION', 'Negotiation'], ['PO_RECEIVED', 'PO Received'], ['LOST', 'Lost'], ['REGRET', 'Regret']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterStatus(val)} style={{
              padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'Lato, sans-serif',
              border: `1px solid ${filterStatus === val ? '#122C41' : '#d1d5db'}`,
              background: filterStatus === val ? '#122C41' : '#fff',
              color: filterStatus === val ? '#fff' : '#374151',
              fontSize: '12px', fontWeight: 600,
            }}>{label}</button>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E5E5', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1500 }}>
            <thead>
              <tr style={{ background: '#122C41' }}>
                {TABLE_HEADERS.map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={TABLE_HEADERS.length} style={{ padding: '52px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', fontFamily: 'Lato, sans-serif' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={TABLE_HEADERS.length} style={{ padding: '52px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', fontFamily: 'Lato, sans-serif' }}>No enquiries found.</td></tr>
              ) : (
                filtered.map((enq, i) => {
                  const loc = [enq.customer_city_snapshot, enq.customer_state_snapshot, enq.customer_country_snapshot].filter(Boolean).join(', ')
                  const salesRepName = enq.assigned_to_name || users[enq.assigned_to] || (enq.assigned_to ? `User ${enq.assigned_to}` : '—');
                  
                  return (
                    <tr
                      key={enq.id}
                      onClick={() => navigate(`/manager/enquiries/${enq.id}`)}
                      style={{ background: i % 2 === 0 ? '#FAF9F9' : '#FFFFFF', borderBottom: '0.5px solid #E5E5E5', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#EEF3FF'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#FAF9F9' : '#FFFFFF'}
                    >
                      <td style={{ ...tdStyle, color: '#122C41', fontWeight: 700 }}>{enq.enquiry_number}</td>
                      <td style={tdStyle}>{enq.enquiry_date || '—'}</td>
                      <td style={tdStyle}>{enq.target_submission_date || '—'}</td>
                      <td style={tdStyle}>{enq.customer_name_snapshot || '—'}</td>
                      <td style={tdStyle}>{enq.prospective_value ? `${enq.currency || 'INR'} ${Number(enq.prospective_value).toLocaleString('en-IN')}` : '—'}</td>
                      <td style={tdStyle}>{enq.customer_mobile_snapshot || '—'}</td>
                      <td style={tdStyle}>{enq.enquiry_type || '—'}</td>
                      <td style={tdStyle}><StatusBadge status={enq.status} /></td>
                      <td style={tdStyle}>{salesRepName}</td>
                      <td style={tdStyle}><PriorityFlags priority={enq.priority} /></td>
                      <td style={tdStyle}>{enq.source_of_enquiry || '—'}</td>
                      <td style={tdStyle}>{loc || '—'}</td>
                      <td style={{ ...tdStyle, borderRight: 'none', textAlign: 'center' }}>{enq.days_since_activity ?? '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewEnquiryModal open={showModal} onClose={() => setShowModal(false)} onSuccess={(num) => { setToast(`${num} created successfully!`); fetchAll() }} />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}