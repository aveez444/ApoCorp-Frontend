import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'

// ─── Customer data helper ─────────────────────────────────────────────────────
const cd = q => q.customer_detail || {}

const REVIEW_COLORS = {
  UNDER_REVIEW: { bg: '#FFF8E1', color: '#F59E0B', dot: '#F59E0B', label: 'Under Review' },
  APPROVED:     { bg: '#EEFFEE', color: '#43A047', dot: '#43A047', label: 'Approved' },
  REJECTED:     { bg: '#FFF5F5', color: '#E53935', dot: '#E53935', label: 'Rejected' },
}
const CLIENT_COLORS = {
  DRAFT:              { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', label: 'Draft' },
  SENT:               { bg: '#E2F1FF', color: '#1E88E5', dot: '#1E88E5', label: 'Sent/Quoted' },
  UNDER_NEGOTIATION:  { bg: '#FAE7FF', color: '#8E24AA', dot: '#8E24AA', label: 'Under Negotiation' },
  ACCEPTED:           { bg: '#EEFFEE', color: '#43A047', dot: '#43A047', label: 'Accepted' },
  REJECTED_BY_CLIENT: { bg: '#FFF5F5', color: '#E53935', dot: '#E53935', label: 'Rejected by Client' },
}

function StatusBadge({ status, external }) {
  const map = external ? CLIENT_COLORS : REVIEW_COLORS
  const s = map[status] || { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', label: status }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 20, fontSize: '11px', fontWeight: 600, fontFamily: 'Lato, sans-serif', border: `1px solid ${s.dot}33`, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

function ContactCell({ phone, email, name }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span style={{ color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontFamily: 'Lato, sans-serif' }}>{phone || '—'}</span>
      {hover && phone && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 200, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, marginTop: 4 }}>
          {name && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#374151', fontFamily: 'Lato, sans-serif', marginBottom: 5 }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>{name}
          </div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#374151', fontFamily: 'Lato, sans-serif', marginBottom: email ? 5 : 0 }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>{phone}
          </div>
          {email && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#2563eb', fontFamily: 'Lato, sans-serif' }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>{email}
          </div>}
        </div>
      )}
    </div>
  )
}

function FloatInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 150 }}>
      <span style={{ position: 'absolute', top: -9, left: 10, background: '#f4f6fb', padding: '0 4px', fontSize: '11px', color: '#6b7280', fontFamily: 'Lato, sans-serif', zIndex: 1, pointerEvents: 'none' }}>{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '13px', fontFamily: 'Lato, sans-serif', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
    </div>
  )
}

const thStyle = { padding: '12px 14px', fontSize: '13px', fontWeight: 700, color: '#122C41', textAlign: 'left', fontFamily: 'Lato, sans-serif', background: '#EEF3FF', whiteSpace: 'nowrap', borderBottom: '1px solid #D8E3FF' }
const tdStyle = { padding: '12px 14px', fontSize: '13px', color: '#232323', fontFamily: 'Lato, sans-serif', borderBottom: '1px solid #F0F0F0', whiteSpace: 'nowrap' }
const outlineBtn = { display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', border: '1px solid #d1d5db', borderRadius: 7, background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151', fontFamily: 'Lato, sans-serif', whiteSpace: 'nowrap' }

export default function QuotationDataList() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const [quotations, setQuotations]         = useState([])
  const [loading, setLoading]               = useState(true)
  const [isExternal, setIsExternal]         = useState(searchParams.get('tab') === 'external')
  const [search, setSearch]                 = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [contactFilter, setContactFilter]   = useState('')
  const [dateFilter, setDateFilter]         = useState('')
  const [showFilters, setShowFilters]       = useState(false)
  const [statusFilter, setStatusFilter]     = useState('')

  const fetchData = useCallback(() => {
    setLoading(true)
    api.get('/quotations/')
      .then(r => setQuotations(r.data?.results || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const byVisibility = quotations.filter(q =>
    isExternal ? q.visibility === 'EXTERNAL' : q.visibility === 'INTERNAL'
  )

// In QuotationDataList.jsx, replace the filtered constant (around line 105-120) with:

  const filtered = byVisibility
    .filter(q => {
      const customer    = cd(q)
      const poc         = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
      const phone       = poc.phone || customer.telephone_primary || ''
      const companyName = customer.company_name?.toLowerCase() || ''
      const city        = customer.city?.toLowerCase() || ''
      const state       = customer.state?.toLowerCase() || ''

      const matchSearch  = !search        || companyName.includes(search.toLowerCase()) || q.quotation_number?.toLowerCase().includes(search.toLowerCase())
      const matchLoc     = !locationFilter || city.includes(locationFilter.toLowerCase()) || state.includes(locationFilter.toLowerCase())
      const matchContact = !contactFilter  || phone.includes(contactFilter)
      const matchDate    = !dateFilter     || q.created_at?.startsWith(dateFilter)
      const matchStatus  = !statusFilter   || (isExternal ? q.client_status === statusFilter : q.review_status === statusFilter)
      return matchSearch && matchLoc && matchContact && matchDate && matchStatus
    })
    // Add sorting by created_at descending (newest first)
    .sort((a, b) => {
      if (!a.created_at && !b.created_at) return 0
      if (!a.created_at) return 1
      if (!b.created_at) return -1
      return new Date(b.created_at) - new Date(a.created_at)
    })
  
  const handleExport = () => {
    const headers = ['Quotation No.', 'Date', 'Due Date', 'Target Sub.', 'Entity Name', 'Contact', 'Location', 'Amount', 'Remark', 'Status']
    const rows = filtered.map(q => {
      const customer = cd(q)
      const poc      = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
      return [
        q.quotation_number || '',
        q.created_at?.slice(0, 10) || '',
        q.enquiry?.due_date || '',
        q.enquiry?.target_submission_date || '',
        customer.company_name || '',
        poc.phone || customer.telephone_primary || '',
        [customer.city, customer.state, customer.country].filter(Boolean).join(', '),
        q.grand_total ? `INR ${q.grand_total}` : '',
        q.manager_remark || 'NIL',
        isExternal ? q.client_status : q.review_status,
      ]
    })
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `quotations_${isExternal ? 'external' : 'internal'}.csv`; a.click()
  }

  const internalOpts = [['', 'All'], ['UNDER_REVIEW', 'Under Review'], ['APPROVED', 'Approved'], ['REJECTED', 'Rejected']]
  const externalOpts = [['', 'All'], ['DRAFT', 'Draft'], ['SENT', 'Sent'], ['UNDER_NEGOTIATION', 'Under Negotiation'], ['ACCEPTED', 'Accepted'], ['REJECTED_BY_CLIENT', 'Rejected by Client']]

  return (
    <div style={{ fontFamily: 'Lato, sans-serif', padding: '20px 0' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .q-row:hover { background: #EEF3FF !important; cursor: pointer; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/employee/quotations')}
            style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#122C41', fontFamily: 'Lato, sans-serif', margin: 0 }}>Quotation Data</h1>
            <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'Lato, sans-serif', marginTop: 2 }}>
              {filtered.length} {isExternal ? 'external' : 'internal'} quotation{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Internal/External toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: isExternal ? '#9ca3af' : '#122C41', fontFamily: 'Lato, sans-serif' }}>Internal</span>
            <div
              onClick={() => { setIsExternal(e => !e); setStatusFilter('') }}
              style={{ width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative', background: isExternal ? '#122C41' : '#d1d5db', transition: 'background 0.2s' }}
            >
              <div style={{ position: 'absolute', top: 3, left: isExternal ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: isExternal ? '#122C41' : '#9ca3af', fontFamily: 'Lato, sans-serif' }}>External</span>
          </div>
          <button onClick={() => window.print()} style={outlineBtn}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
          <button onClick={handleExport} style={outlineBtn}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/></svg>
            Export to Excel
          </button>
        </div>
      </div>

      {/* Search + filter row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <FloatInput label="Search Quotation" value={search} onChange={setSearch} placeholder="Enter Customer Name / Quotation Number" />
        <FloatInput label="Location" value={locationFilter} onChange={setLocationFilter} placeholder="Enter Location" />
        <FloatInput label="Search by Contact Number" value={contactFilter} onChange={setContactFilter} placeholder="Enter Contact Number" />
        <FloatInput label="Date" value={dateFilter} onChange={setDateFilter} type="date" />
        <button style={outlineBtn}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
          Search
        </button>
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{ ...outlineBtn, background: showFilters ? '#122C41' : '#fff', color: showFilters ? '#fff' : '#374151', borderColor: showFilters ? '#122C41' : '#d1d5db' }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          Filters
        </button>
      </div>

      {showFilters && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', fontFamily: 'Lato, sans-serif' }}>Status:</span>
          {(isExternal ? externalOpts : internalOpts).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              style={{ padding: '5px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'Lato, sans-serif', border: `1px solid ${statusFilter === val ? '#122C41' : '#d1d5db'}`, background: statusFilter === val ? '#122C41' : '#fff', color: statusFilter === val ? '#fff' : '#374151', fontSize: '12px', fontWeight: 600 }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E5E5', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1050 }}>
            <thead>
              <tr>
                {['Quotation No.', 'Enquiry No.', 'Quotation Date', 'Entity Name', 'Contact Detail', 'Location', 'Amount', 'Remark', 'Status'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ padding: '52px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', fontFamily: 'Lato, sans-serif' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 16, height: 16, border: '2px solid #e2e8f0', borderTopColor: '#122C41', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                    Loading…
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: '52px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', fontFamily: 'Lato, sans-serif' }}>
                  No {isExternal ? 'external' : 'internal'} quotations found.
                </td></tr>
              ) : filtered.map((q, i) => {
                const customer = cd(q)
                const poc      = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
                const phone    = poc.phone || customer.telephone_primary || ''
                const email    = poc.email || customer.email || ''
                const loc      = [customer.city, customer.state, customer.country].filter(Boolean).join(', ')
                // due_date and target_submission_date come from the enquiry side
                const enqData  = q.enquiry_number ? q : {}
                const path     = isExternal ? `/employee/quotations/${q.id}/external` : `/employee/quotations/${q.id}`
                return (
                  <tr key={q.id} className="q-row" onClick={() => navigate(path)} style={{ background: i % 2 === 0 ? '#FAF9F9' : '#fff' }}>
                  <td style={{ ...tdStyle, color: '#122C41', fontWeight: 700 }}>{q.quotation_number}</td>
                  <td style={tdStyle}>{q.enquiry_number || '—'}</td>
                  <td style={tdStyle}>{q.created_at?.slice(0, 10) || '—'}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{customer.company_name || '—'}</td>
                    <td style={tdStyle}><ContactCell phone={phone} email={email} name={customer.company_name} /></td>
                    <td style={tdStyle}>{loc || '—'}</td>
                    <td style={tdStyle}>{q.grand_total ? `₹${Number(q.grand_total).toLocaleString('en-IN')}` : '—'}</td>
                    <td style={tdStyle}>{q.manager_remark || 'NIL'}</td>
                    <td style={tdStyle}>
                      {isExternal
                        ? <StatusBadge status={q.client_status} external={true} />
                        : <StatusBadge status={q.review_status} external={false} />
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}