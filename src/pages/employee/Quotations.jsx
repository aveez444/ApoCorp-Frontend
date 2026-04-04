import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Toast from '../../components/Toast'
import banner from '../../assets/dashboard-banner.png'

const PRIMARY = '#122C41'
const BORDER  = '#e2e8f0'
const FONT    = "'Inter', 'Segoe UI', sans-serif"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const cd  = q => q.customer_detail || {}
const fmt = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

// ─── Status maps ──────────────────────────────────────────────────────────────
const REVIEW_COLORS = {
  UNDER_REVIEW: { bg: '#fffbe6', color: '#c8860a', dot: '#f0a500', border: '#f5d98a', label: 'Under Review' },
  APPROVED:     { bg: '#e6faf0', color: '#0a8c5a', dot: '#12b76a', border: '#6edcaa', label: 'Approved' },
  REJECTED:     { bg: '#fff0f0', color: '#d12b2b', dot: '#f04040', border: '#f5a8a8', label: 'Rejected' },
}
const CLIENT_COLORS = {
  DRAFT:              { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', border: '#cbd5e1',  label: 'Draft' },
  SENT:               { bg: '#e8f4ff', color: '#1a7fd4', dot: '#1a7fd4', border: '#a8d4f5',  label: 'Quoted' },
  UNDER_NEGOTIATION:  { bg: '#fdf0ff', color: '#9b30c8', dot: '#b84fe0', border: '#dfa8f5',  label: 'Under Negotiation' },
  ACCEPTED:           { bg: '#e6faf0', color: '#0a8c5a', dot: '#12b76a', border: '#6edcaa',  label: 'Accepted' },
  REJECTED_BY_CLIENT: { bg: '#fff0f0', color: '#d12b2b', dot: '#f04040', border: '#f5a8a8',  label: 'Rejected by Client' },
}

function StatusBadge({ status, external }) {
  const map = external ? CLIENT_COLORS : REVIEW_COLORS
  const s   = map[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', border: '#e2e8f0', label: status }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

// ─── Contact hover cell ───────────────────────────────────────────────────────
function ContactCell({ phone, email, name }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={{ color: '#2563eb', cursor: 'pointer', fontSize: 13, fontFamily: FONT, fontWeight: 500 }}>
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

// ─── Stat card icons ──────────────────────────────────────────────────────────
const STAT_ICONS = {
  'Team Approved Quotes': 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  'Quoted':               'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  'Under Negotiation':    'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  'Quotes Accepted':      'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  'Quotes Rejected':      'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM15 9l-6 6M9 9l6 6',
}

function StatCard({ label, value, highlight }) {
  const iconPath = STAT_ICONS[label]
  return (
    <div style={{
      background: '#fff',
      border: highlight ? '1.5px solid #fca5a5' : `1px solid ${BORDER}`,
      borderRadius: 12, padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 7 }}>
        {iconPath && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPath} />
          </svg>
        )}
        {label}
      </p>
      <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: highlight ? '#dc2626' : PRIMARY, letterSpacing: '-0.5px' }}>
        {value}
      </h2>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Quotations() {
  const navigate = useNavigate()
  const [quotations,     setQuotations]     = useState([])
  const [stats,          setStats]          = useState({ under_review: 0, approved: 0, rejected: 0, accepted: 0, negotiation: 0 })
  const [loading,        setLoading]        = useState(true)
  const [isExternal,     setIsExternal]     = useState(false)
  const [toast,          setToast]          = useState(null)
  const [search,         setSearch]         = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [contactFilter,  setContactFilter]  = useState('')
  const [dateFilter,     setDateFilter]     = useState('')
  const [showFilters,    setShowFilters]    = useState(false)
  const [statusFilter,   setStatusFilter]   = useState('')

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/quotations/'),
      api.get('/quotations/dashboard_stats/'),
    ])
      .then(([qRes, sRes]) => {
        setQuotations(qRes.data?.results || qRes.data || [])
        setStats(sRes.data || {})
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
      const customer    = cd(q)
      const companyName = customer.company_name?.toLowerCase() || ''
      const qNum        = q.quotation_number?.toLowerCase() || ''
      const city        = customer.city?.toLowerCase() || ''
      const state       = customer.state?.toLowerCase() || ''
      const country     = customer.country?.toLowerCase() || ''
      const poc         = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
      const phone       = poc.phone || customer.telephone_primary || ''

      const matchSearch  = !search        || companyName.includes(search.toLowerCase()) || qNum.includes(search.toLowerCase())
      const matchLoc     = !locationFilter|| city.includes(locationFilter.toLowerCase()) || state.includes(locationFilter.toLowerCase()) || country.includes(locationFilter.toLowerCase())
      const matchContact = !contactFilter || phone.includes(contactFilter)
      const matchDate    = !dateFilter    || q.created_at?.startsWith(dateFilter)
      const matchStatus  = !statusFilter  || (isExternal ? q.client_status === statusFilter : q.review_status === statusFilter)
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
    const headers = ['Quotation No.', 'Date', 'Entity Name', 'Contact', 'Location', 'Amount', 'Remark', 'Status']
    const rows = filtered.map(q => {
      const customer = cd(q)
      const poc      = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
      return [
        q.quotation_number || '',
        q.created_at?.slice(0, 10) || '',
        customer.company_name || '',
        poc.phone || customer.telephone_primary || '',
        [customer.city, customer.country].filter(Boolean).join(', '),
        q.grand_total || '',
        q.manager_remark || 'NIL',
        isExternal ? q.client_status : q.review_status,
      ]
    })
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'quotations.csv'; a.click()
  }

  const internalOpts = [['', 'All'], ['UNDER_REVIEW', 'Under Review'], ['APPROVED', 'Approved'], ['REJECTED', 'Rejected']]
  const externalOpts = [['', 'All'], ['DRAFT', 'Draft'], ['SENT', 'Sent/Quoted'], ['UNDER_NEGOTIATION', 'Negotiation'], ['ACCEPTED', 'Accepted'], ['REJECTED_BY_CLIENT', 'Rejected by Client']]

  const statCards = [
    { label: 'Team Approved Quotes', value: stats.approved     || 0, highlight: false },
    { label: 'Quoted',               value: stats.negotiation  || 0, highlight: false },
    { label: 'Under Negotiation',    value: stats.negotiation  || 0, highlight: false },
    { label: 'Quotes Accepted',      value: stats.accepted     || 0, highlight: false },
    { label: 'Quotes Rejected',      value: stats.under_review || 0, highlight: true  },
  ]

  // External table columns differ from internal
  const isExternalCols = isExternal

  return (
    <div style={{ fontFamily: FONT, background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }

        .q-row { transition: background 0.15s; cursor: pointer; }
        .q-row:hover td { background: #f4f7fb !important; }

        .filter-input {
          border: 1.5px solid ${BORDER};
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          font-family: ${FONT};
          width: 100%;
          background: #fff;
          color: #1e293b;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .filter-input:focus {
          border-color: ${PRIMARY};
          box-shadow: 0 0 0 3px rgba(18,44,65,0.08);
        }
        .filter-input::placeholder { color: #94a3b8; }

        .filter-label {
          position: absolute; top: -9px; left: 12px;
          background: #fff; padding: 0 4px;
          font-size: 11px; color: #64748b; font-weight: 500;
          pointer-events: none; z-index: 1;
        }

        .btn-outline {
          border: 1.5px solid ${BORDER}; background: #fff; color: #374151;
          padding: 9px 18px; border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: ${FONT}; display: inline-flex; align-items: center; gap: 7px;
          transition: all 0.15s; white-space: nowrap;
        }
        .btn-outline:hover { background: #f1f5f9; border-color: #cbd5e1; }

        .btn-primary {
          background: ${PRIMARY}; color: #fff; border: none;
          padding: 10px 20px; border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: ${FONT}; display: inline-flex; align-items: center; gap: 7px;
          transition: background 0.15s; white-space: nowrap;
        }
        .btn-primary:hover { background: #1a3f5c; }

        .btn-filters-active {
          background: ${PRIMARY} !important; color: #fff !important; border-color: ${PRIMARY} !important;
        }

        thead th {
          background: ${PRIMARY}; color: #e2e8f0;
          font-size: 12px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.04em;
          padding: 13px 16px; text-align: left;
          white-space: nowrap; border-right: 1px solid rgba(255,255,255,0.07);
        }
        thead th:first-child { border-radius: 8px 0 0 0; }
        thead th:last-child  { border-radius: 0 8px 0 0; border-right: none; }

        tbody td {
          padding: 13px 16px; font-size: 13px; color: #374151;
          border-bottom: 1px solid #f1f5f9; white-space: nowrap;
          border-right: 1px solid #f5f7fa;
        }
        tbody td:last-child { border-right: none; }
        tbody tr:last-child td { border-bottom: none; }

        .toggle-track {
          width: 40px; height: 22px; border-radius: 11px;
          cursor: pointer; position: relative;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .toggle-thumb {
          position: absolute; top: 3px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; transition: left 0.2s;
        }
      `}</style>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* ── BANNER ── */}
      <div style={{
        backgroundImage: `url(${banner})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        borderRadius: 16, padding: '28px 32px 110px',
        position: 'relative', marginBottom: 72,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(120deg,rgba(18,44,65,.72),rgba(18,44,65,.4))',
          borderRadius: 16,
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <h1 style={{ color: '#fff', fontSize: 26, margin: 0, fontWeight: 700, letterSpacing: '-0.3px' }}>
            Quotation ({filtered.length})
          </h1>
          <button
            onClick={() => navigate('/employee/enquiries')}
            style={{
              background: '#fff', border: 'none',
              padding: '11px 22px', borderRadius: 10,
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              color: PRIMARY, fontFamily: FONT,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            Create Quotation
          </button>
        </div>

        {/* STAT CARDS — 5 columns */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14,
          position: 'absolute', bottom: -52, left: 32, right: 32,
        }}>
          {statCards.map((s, i) => <StatCard key={i} {...s} />)}
        </div>
      </div>

      {/* ── TABLE CARD ── */}
      <div style={{
        background: '#fff', border: `1px solid ${BORDER}`,
        borderRadius: 14, padding: '24px 24px 20px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
      }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Quotation Data link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: PRIMARY }}>Quotation Data</h3>
              <button
                onClick={() => navigate('/employee/quotation-data')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </button>
            </div>

            {/* Divider */}
            <span style={{ width: 1, height: 20, background: BORDER, display: 'inline-block' }} />

            {/* Internal / External toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div
                className="toggle-track"
                style={{ background: isExternal ? PRIMARY : '#cbd5e1' }}
                onClick={() => { setIsExternal(e => !e); setStatusFilter('') }}
              >
                <div className="toggle-thumb" style={{ left: isExternal ? 21 : 3 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: isExternal ? PRIMARY : '#94a3b8', fontFamily: FONT }}>
                {isExternal ? 'External Quotation' : 'Internal Quotation'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-outline" onClick={() => window.print()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
              </svg>
              Print
            </button>
            <button className="btn-outline" onClick={handleExport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
              </svg>
              Export to Excel
            </button>
          </div>
        </div>

        {/* Search row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr auto auto', gap: 12, marginBottom: 14, alignItems: 'end' }}>
          <div style={{ position: 'relative' }}>
            <span className="filter-label">Search Quotation</span>
            <input className="filter-input" placeholder="Enter Customer Name / Quotation Number" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ position: 'relative' }}>
            <span className="filter-label">Location</span>
            <input className="filter-input" placeholder="Enter Location" value={locationFilter} onChange={e => setLocationFilter(e.target.value)} />
          </div>
          <div style={{ position: 'relative' }}>
            <span className="filter-label">Search by Contact Number</span>
            <input className="filter-input" placeholder="Enter Contact Number" value={contactFilter} onChange={e => setContactFilter(e.target.value)} />
          </div>
          <div style={{ position: 'relative' }}>
            <span className="filter-label">Date</span>
            <input type="date" className="filter-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          </div>
          <button className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            Search
          </button>
          <button
            className={`btn-outline${showFilters ? ' btn-filters-active' : ''}`}
            onClick={() => setShowFilters(f => !f)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filters
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div style={{
            display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
            padding: '12px 16px', background: '#f8fafc',
            border: `1px solid ${BORDER}`, borderRadius: 9, marginBottom: 14,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginRight: 4 }}>Status:</span>
            {(isExternal ? externalOpts : internalOpts).map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                style={{
                  padding: '4px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: FONT,
                  border: `1px solid ${statusFilter === val ? PRIMARY : BORDER}`,
                  background: statusFilter === val ? PRIMARY : '#fff',
                  color: statusFilter === val ? '#fff' : '#374151',
                  fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
                }}
              >{lbl}</button>
            ))}
            <button
              onClick={() => { setStatusFilter(''); setLocationFilter(''); setDateFilter(''); setSearch(''); setContactFilter('') }}
              style={{ padding: '4px 14px', borderRadius: 20, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: FONT, marginLeft: 4 }}
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
              fontSize: 12, fontWeight: 500, border: '1px solid #bfdbfe',
            }}>
              {(isExternal ? CLIENT_COLORS : REVIEW_COLORS)[statusFilter]?.label || statusFilter}
              <button onClick={() => setStatusFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
            </span>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${BORDER}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isExternalCols ? 1000 : 900 }}>
            <thead>
              <tr>
            {(isExternalCols 
              ? ['Quotation No.', 'Quotation Date', 'Entity Name', 'Contact Detail', 'Location', 'Amount', 'Status']
              : ['Quotation No.', 'Quotation Date', 'Entity Name', 'Contact Detail', 'Location', 'Prospective Value', 'Remark', 'Status']
            ).map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <div style={{ width: 16, height: 16, border: '2px solid #e5e7eb', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                      Loading…
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    No {isExternal ? 'external' : 'internal'} quotations found.
                  </td>
                </tr>
              ) : filtered.map((q, i) => {
                const customer = cd(q)
                const poc      = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
                const phone    = poc.phone || customer.telephone_primary || ''
                const email    = poc.email || customer.email || ''
                const loc      = [customer.city, customer.state, customer.country].filter(Boolean).join(', ')
                const path     = isExternal ? `/employee/quotations/${q.id}/external` : `/employee/quotations/${q.id}`

                return (
                  <tr key={q.id} className="q-row" onClick={() => navigate(path)}>
                    <td style={{ fontWeight: 700, color: PRIMARY }}>{q.quotation_number}</td>
                    <td>{q.created_at?.slice(0, 10) || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{customer.company_name || '—'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <ContactCell phone={phone} email={email} name={poc.name || customer.company_name} />
                    </td>
                    <td>{loc || '—'}</td>
                    <td style={{ fontWeight: 500 }}>{fmt(q.grand_total)}</td>
                    {!isExternalCols && <td style={{ color: '#64748b' }}>{q.manager_remark || 'NIL'}</td>}
                    <td>
                      <StatusBadge status={isExternal ? q.client_status : q.review_status} external={isExternal} />
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