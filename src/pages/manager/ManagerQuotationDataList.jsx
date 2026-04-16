// ManagerQuotationDataList.jsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import { printQuotationReport } from '../../components/PrintQuotationReport'

const PRIMARY = '#122C41'
const BORDER = '#e2e8f0'
const FONT = "'Inter', 'Segoe UI', sans-serif"

// ─── Status maps ──────────────────────────────────────────────────────────────
const REVIEW_COLORS = {
  UNDER_REVIEW: { bg: '#fffbe6', color: '#c8860a', dot: '#f0a500', border: '#f5d98a', label: 'Pending' },
  APPROVED:     { bg: '#e6faf0', color: '#0a8c5a', dot: '#12b76a', border: '#6edcaa', label: 'Approved' },
  REJECTED:     { bg: '#fff0f0', color: '#d12b2b', dot: '#f04040', border: '#f5a8a8', label: 'Rejected' },
}
const CLIENT_COLORS = {
  DRAFT:              { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', border: '#cbd5e1', label: 'Draft' },
  SENT:               { bg: '#e8f4ff', color: '#1a7fd4', dot: '#1a7fd4', border: '#a8d4f5', label: 'New/Quoted' },
  UNDER_NEGOTIATION:  { bg: '#fdf0ff', color: '#9b30c8', dot: '#b84fe0', border: '#dfa8f5', label: 'Under Negotiation' },
  ACCEPTED:           { bg: '#e6faf0', color: '#0a8c5a', dot: '#12b76a', border: '#6edcaa', label: 'Accepted' },
  REJECTED_BY_CLIENT: { bg: '#fff0f0', color: '#d12b2b', dot: '#f04040', border: '#f5a8a8', label: 'Rejected' },
}

function StatusBadge({ status, external }) {
  const map = external ? CLIENT_COLORS : REVIEW_COLORS
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', border: '#e2e8f0', label: status }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color, padding: '4px 12px',
      borderRadius: 20, fontSize: '11px', fontWeight: 600,
      fontFamily: FONT, border: `1px solid ${s.border}`, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

// ─── Priority flags ───────────────────────────────────────────────────────────
function toPriorityKey(p) {
  if (p === 1) return 'HIGH'
  if (p === 3) return 'LOW'
  return 'MEDIUM'
}

function FlagIcon({ active, color, size = 14 }) {
  const c = active ? color : '#d1d5db'
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="4" y1="2" x2="4" y2="18" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 3.5 L15.5 3.5 Q16.5 3.5 16 4.5 L13.5 8.5 L16 12.5 Q16.5 13.5 15.5 13.5 L4 13.5 Z" fill={c} />
    </svg>
  )
}

function PriorityFlags({ priority }) {
  const key = toPriorityKey(priority)
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
      {[{ k: 'LOW', c: '#22c55e' }, { k: 'MEDIUM', c: '#f59e0b' }, { k: 'HIGH', c: '#ef4444' }].map(({ k, c }) => (
        <FlagIcon key={k} active={key === k} color={c} size={14} />
      ))}
    </div>
  )
}

// ─── Contact hover cell ───────────────────────────────────────────────────────
function ContactCell({ phone, email, name }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={{ color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
        {phone || '—'}
      </span>
      {hover && phone && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 300,
          background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10,
          padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: 210, marginTop: 6,
        }}>
          {name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#374151', marginBottom: 7 }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={2}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <span style={{ fontWeight: 500 }}>{name}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#374151', marginBottom: email ? 7 : 0 }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={2}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span style={{ color: '#2563eb', fontWeight: 500 }}>{phone}</span>
          </div>
          {email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#2563eb' }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={2}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>{email}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Floating Input component ────────────────────────────────────────────────
function FloatInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 150 }}>
      <span style={{ position: 'absolute', top: -9, left: 10, background: '#f8fafc', padding: '0 4px', fontSize: '11px', color: '#6b7280', fontFamily: FONT, zIndex: 1, pointerEvents: 'none' }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 14px',
          border: `1.5px solid ${BORDER}`, borderRadius: 7,
          fontSize: '13px', fontFamily: FONT, outline: 'none',
          background: '#fff', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const thStyle = {
  padding: '12px 14px', fontSize: '12px', fontWeight: 700,
  fontFamily: FONT, color: '#e2e8f0', textAlign: 'left',
  background: PRIMARY, whiteSpace: 'nowrap',
  borderRight: '1px solid rgba(255,255,255,0.07)',
}
const tdStyle = {
  padding: '12px 14px', fontSize: '13px', fontFamily: FONT,
  color: '#374151', borderBottom: `1px solid ${BORDER}`,
  whiteSpace: 'nowrap', borderRight: '1px solid #f5f7fa',
}
const outlineBtn = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '9px 16px', border: `1.5px solid ${BORDER}`,
  borderRadius: 7, background: '#fff', fontSize: '13px',
  fontWeight: 600, cursor: 'pointer', color: '#374151',
  fontFamily: FONT, whiteSpace: 'nowrap',
}
const primaryBtn = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '9px 18px', border: 'none', borderRadius: 7,
  background: PRIMARY, fontSize: '13px', fontWeight: 600,
  cursor: 'pointer', color: '#fff', fontFamily: FONT,
  whiteSpace: 'nowrap',
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ManagerQuotationDataList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [isExternal, setIsExternal] = useState(searchParams.get('tab') === 'external')
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [contactFilter, setContactFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchData = useCallback(() => {
    setLoading(true)
    api.get('/quotations/')
      .then(r => {
        const data = r.data?.results || r.data || []
        setQuotations(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const byVisibility = quotations.filter(q =>
    isExternal ? q.visibility === 'EXTERNAL' : q.visibility === 'INTERNAL'
  )

  const filtered = byVisibility
    .filter(q => {
      const customer = q.customer_detail || {}
      const poc = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
      const phone = poc.phone || customer.telephone_primary || ''
      const email = poc.email || customer.email || ''
      const companyName = customer.company_name?.toLowerCase() || ''
      const qNum = q.quotation_number?.toLowerCase() || ''
      const city = customer.city?.toLowerCase() || ''
      const state = customer.state?.toLowerCase() || ''
      const country = customer.country?.toLowerCase() || ''

      const matchSearch = !search || companyName.includes(search.toLowerCase()) || qNum.includes(search.toLowerCase())
      const matchLoc = !locationFilter || city.includes(locationFilter.toLowerCase()) || state.includes(locationFilter.toLowerCase()) || country.includes(locationFilter.toLowerCase())
      const matchContact = !contactFilter || phone.includes(contactFilter) || email.toLowerCase().includes(contactFilter.toLowerCase())
      const matchDate = !dateFilter || q.created_at?.startsWith(dateFilter)
      const matchStatus = !statusFilter || (isExternal ? q.client_status === statusFilter : q.review_status === statusFilter)
      return matchSearch && matchLoc && matchContact && matchDate && matchStatus
    })
    // Sort by created_at descending (newest first)
    .sort((a, b) => {
      if (!a.created_at && !b.created_at) return 0
      if (!a.created_at) return 1
      if (!b.created_at) return -1
      return new Date(b.created_at) - new Date(a.created_at)
    })

      // Calculate stats for filtered quotations
    const filteredStats = {
      under_review: filtered.filter(q => !isExternal && q.review_status === 'UNDER_REVIEW').length,
      approved: filtered.filter(q => !isExternal && q.review_status === 'APPROVED').length,
      rejected: filtered.filter(q => !isExternal && q.review_status === 'REJECTED').length,
      accepted: filtered.filter(q => isExternal && q.client_status === 'ACCEPTED').length,
      negotiation: filtered.filter(q => isExternal && q.client_status === 'UNDER_NEGOTIATION').length,
    }

    const handlePrint = () => {
    printQuotationReport(filtered, filteredStats, isExternal)
    }

    const handleExport = () => {
        const headers = isExternal
          ? ['Quotation No.', 'Enquiry No.', 'Quotation Date', 'Entity Name', 'Contact', 'Location', 'Amount', 'Status']
          : ['Quotation No.', 'Enquiry No.', 'Quotation Date', 'Entity Name', 'Contact', 'Location', 'Amount', 'Status', 'Sales Rep']

    const rows = filtered.map(q => {
      const customer = q.customer_detail || {}
      const poc = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
      const phone = poc.phone || customer.telephone_primary || ''
      const email = poc.email || customer.email || ''
      const loc = [customer.city, customer.state, customer.country].filter(Boolean).join(', ')
      
    const row = [
      q.quotation_number || '',
      q.enquiry_number || '',
      q.created_at?.slice(0, 10) || '',
      customer.company_name || '',
      isExternal ? `${phone}${email ? ` (${email})` : ''}` : phone,
      loc || '',
      q.grand_total ? `₹${Number(q.grand_total).toLocaleString('en-IN')}` : '',
      isExternal ? (CLIENT_COLORS[q.client_status]?.label || q.client_status) : (REVIEW_COLORS[q.review_status]?.label || q.review_status),
    ]

    if (!isExternal) {
      row.push(q.assigned_to_name || '—')
    }
      
      return row.map(v => v || '')
    })
    
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `manager_quotations_${isExternal ? 'external' : 'internal'}.csv`
    a.click()
  }

  const internalOpts = [['', 'All'], ['UNDER_REVIEW', 'Pending'], ['APPROVED', 'Approved'], ['REJECTED', 'Rejected']]
  const externalOpts = [['', 'All'], ['SENT', 'New/Quoted'], ['UNDER_NEGOTIATION', 'Under Negotiation'], ['ACCEPTED', 'Accepted'], ['REJECTED_BY_CLIENT', 'Rejected']]

  // Table headers based on visibility
  const HEADERS = isExternal
    ? ['Quotation No.', 'Enquiry No.', 'Quotation Date', 'Entity Name', 'Contact Detail', 'Location', 'Amount', 'Status']
    : ['Quotation No.', 'Enquiry No.', 'Quotation Date', 'Entity Name', 'Contact Detail', 'Location', 'Amount', 'Status', 'Sales Rep', 'Priority']
    
  return (
    <div style={{ fontFamily: FONT, background: '#f8fafc', minHeight: '100vh', padding: '20px 0' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .q-row { transition: background 0.15s; cursor: pointer; }
        .q-row:hover td { background: #f4f7fb !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/manager/quotations')}
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: `1.5px solid ${BORDER}`, background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#122C41" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: PRIMARY, fontFamily: FONT, margin: 0 }}>
              Quotation Data
            </h1>
            <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT, marginTop: 2 }}>
              {filtered.length} {isExternal ? 'external' : 'internal'} quotation{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Internal/External toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', border: `1.5px solid ${BORDER}`,
            borderRadius: 8, padding: '6px 14px',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: !isExternal ? PRIMARY : '#9ca3af', fontFamily: FONT }}>
              Internal
            </span>
            <div
              onClick={() => { setIsExternal(e => !e); setStatusFilter('') }}
              style={{
                width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
                position: 'relative', background: isExternal ? PRIMARY : '#cbd5e1',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: isExternal ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
              }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: isExternal ? PRIMARY : '#9ca3af', fontFamily: FONT }}>
              External
            </span>
          </div>
          
          <button onClick={handlePrint} style={outlineBtn}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print / PDF
          </button>
          <button onClick={handleExport} style={outlineBtn}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Export to Excel
          </button>
        </div>
      </div>

      {/* Search + filter row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <FloatInput label="Search Quotation" value={search} onChange={setSearch} placeholder="Enter Customer Name / Quotation Number" />
        <FloatInput label="Location" value={locationFilter} onChange={setLocationFilter} placeholder="Enter Location" />
        <FloatInput label="Search by Contact" value={contactFilter} onChange={setContactFilter} placeholder="Enter Phone / Email" />
        <FloatInput label="Date" value={dateFilter} onChange={setDateFilter} type="date" />
        <button style={outlineBtn}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          Search
        </button>
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{
            ...outlineBtn,
            background: showFilters ? PRIMARY : '#fff',
            color: showFilters ? '#fff' : '#374151',
            borderColor: showFilters ? PRIMARY : BORDER,
          }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          padding: '12px 16px', background: '#fff',
          border: `1px solid ${BORDER}`, borderRadius: 8,
          marginBottom: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', fontFamily: FONT }}>
            Status:
          </span>
          {(isExternal ? externalOpts : internalOpts).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              style={{
                padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                fontFamily: FONT, border: `1px solid ${statusFilter === val ? PRIMARY : BORDER}`,
                background: statusFilter === val ? PRIMARY : '#fff',
                color: statusFilter === val ? '#fff' : '#374151',
                fontSize: '12px', fontWeight: 600,
              }}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => { setStatusFilter(''); setLocationFilter(''); setDateFilter(''); setSearch(''); setContactFilter('') }}
            style={{
              padding: '5px 14px', borderRadius: 20, border: '1px solid #fca5a5',
              background: '#fff', color: '#dc2626', fontSize: '12px',
              fontWeight: 500, cursor: 'pointer', fontFamily: FONT,
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Active status chip */}
      {statusFilter && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#eff6ff', color: PRIMARY,
            padding: '4px 12px', borderRadius: 20,
            fontSize: '12px', fontWeight: 500, border: '1px solid #bfdbfe',
          }}>
            {(isExternal ? CLIENT_COLORS : REVIEW_COLORS)[statusFilter]?.label || statusFilter}
            <button onClick={() => setStatusFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
          </span>
        </div>
      )}

      {/* Table */}
      <div style={{
        background: '#fff', borderRadius: 10,
        border: `1px solid ${BORDER}`, overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isExternal ? 1200 : 1000 }}>
            <thead>
              <tr>
                {HEADERS.map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={HEADERS.length} style={{ padding: '52px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 16, height: 16, border: '2px solid #e2e8f0', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                      Loading…
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={HEADERS.length} style={{ padding: '52px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                    No {isExternal ? 'external' : 'internal'} quotations found.
                  </td>
                </tr>
              ) : (
                filtered.map((q, i) => {
                  const customer = q.customer_detail || {}
                  const poc = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
                  const phone = poc.phone || customer.telephone_primary || ''
                  const email = poc.email || customer.email || ''
                  const loc = [customer.city, customer.state, customer.country].filter(Boolean).join(', ')
                  const path = `/manager/quotations/${q.id}/external`

                  return (
                    <tr
                      key={q.id}
                      className="q-row"
                      onClick={() => navigate(path)}
                      style={{ background: i % 2 === 0 ? '#FAF9F9' : '#fff' }}
                    >
                    <td style={{ ...tdStyle, color: PRIMARY, fontWeight: 700 }}>{q.quotation_number || '—'}</td>
                    <td style={tdStyle}>{q.enquiry_number || '—'}</td>
                    <td style={tdStyle}>{q.created_at?.slice(0, 10) || '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{customer.company_name || '—'}</td>
                      <td style={tdStyle} onClick={e => e.stopPropagation()}>
                        <ContactCell phone={phone} email={email} name={customer.company_name} />
                      </td>
                      <td style={tdStyle}>{loc || '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>
                        {q.grand_total ? `₹${Number(q.grand_total).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={tdStyle}>
                        <StatusBadge status={isExternal ? q.client_status : q.review_status} external={isExternal} />
                      </td>
                      {!isExternal && (
                        <>
                          <td style={tdStyle}>{q.assigned_to_name || '—'}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <PriorityFlags priority={q.enquiry_priority} />
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}