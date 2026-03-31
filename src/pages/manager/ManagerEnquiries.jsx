import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import NewEnquiryModal from '../../components/modals/NewEnquiryModal'
import Toast from '../../components/Toast'
import banner from '../../assets/dashboard-banner.png'

const PRIMARY = '#122C41'
const BORDER  = '#e2e8f0'
const FONT    = "'Inter', 'Segoe UI', sans-serif"

const fmt = n => new Intl.NumberFormat('en-IN').format(n ?? 0)

// ─── Status ────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  NEW:         { bg: '#e8f4ff', color: '#1a7fd4', dot: '#1a7fd4', border: '#a8d4f5' },
  PENDING:     { bg: '#fffbe6', color: '#c8860a', dot: '#f0a500', border: '#f5d98a' },
  NEGOTIATION: { bg: '#fdf0ff', color: '#9b30c8', dot: '#b84fe0', border: '#dfa8f5' },
  QUOTED:      { bg: '#e6fff5', color: '#0a9e6e', dot: '#0fc878', border: '#80e8c0' },
  PO_RECEIVED: { bg: '#e6faf0', color: '#0a8c5a', dot: '#12b76a', border: '#6edcaa' },
  LOST:        { bg: '#fff0f0', color: '#d12b2b', dot: '#f04040', border: '#f5a8a8' },
  REGRET:      { bg: '#f5f0ff', color: '#7e22ce', dot: '#a855f7', border: '#d4b0f5' },
}

const STATUS_LABELS = {
  NEW:         'New Enquiry',
  PENDING:     'Pending Enquiry',
  NEGOTIATION: 'Under Negotiation',
  QUOTED:      'Quoted Enquiry',
  PO_RECEIVED: 'PO Received',
  LOST:        'Enquiry Lost',
  REGRET:      'Regret',
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', border: '#e2e8f0' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      padding: '4px 12px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {STATUS_LABELS[status] || status}
    </span>
  )
}

// ─── Priority flags ─────────────────────────────────────────────────────────
const PRIORITY_ORDER  = ['LOW', 'MEDIUM', 'HIGH']
const PRIORITY_COLORS = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444' }

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
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
      {PRIORITY_ORDER.map(p => (
        <FlagIcon key={p} active={priority === p} color={PRIORITY_COLORS[p]} size={14} />
      ))}
    </div>
  )
}

// ─── Days badge ──────────────────────────────────────────────────────────────
function DaysBadge({ days }) {
  if (days === null || days === undefined) return <span>—</span>
  const bg    = days > 7 ? '#fee2e2' : days > 3 ? '#fef3c7' : '#dcfce7'
  const color = days > 7 ? '#b91c1c' : days > 3 ? '#92400e' : '#15803d'
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 10, background: bg, color, fontSize: 12, fontWeight: 600 }}>
      {days}
    </span>
  )
}

// ─── Stat card ───────────────────────────────────────────────────────────────
const STAT_ICONS = {
  'Pending Enquiry':   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  'Quoted Enquiry':    'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  'Under Negotiation': 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
  'Enquiry Lost':      'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
}

function StatCard({ label, value, trend, trendLabel, highlight }) {
  const iconPath = STAT_ICONS[label]
  return (
    <div style={{
      background: '#fff',
      border: highlight ? '1.5px solid #fca5a5' : `1px solid ${BORDER}`,
      borderRadius: 12, padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 6,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 7 }}>
        {iconPath && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPath} />
          </svg>
        )}
        {label}
      </p>
      <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: highlight ? '#dc2626' : PRIMARY, letterSpacing: '-0.5px' }}>
        {value ?? '—'}
      </h2>
      {trendLabel && (
        <p style={{ margin: 0, fontSize: 12, color: trend === 'up' ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
          {trend === 'up' ? '↑' : '↓'} {trendLabel}
        </p>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  return `${dd}/${m}/${y}`
}

function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
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

function Spinner() {
  return (
    <div style={{ width: 16, height: 16, border: '2px solid #e5e7eb', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ManagerEnquiries() {
  const navigate = useNavigate()

  const [enquiries,     setEnquiries]     = useState([])
  const [empMap,        setEmpMap]        = useState({})
  const [stats,         setStats]         = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [showModal,     setShowModal]     = useState(false)
  const [toast,         setToast]         = useState(null)
  const [search,        setSearch]        = useState('')
  const [locationFilter,setLocationFilter]= useState('')
  const [dateFilter,    setDateFilter]    = useState('')
  const [statusFilter,  setStatusFilter]  = useState('')
  const [createdByFilter, setCreatedByFilter] = useState('') // New filter for created by
  const [showFilters,   setShowFilters]   = useState(false)

  const fetchAll = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/enquiries/'),
      api.get('/enquiries/stats/'),
      api.get('/accounts/tenant/employees/').catch(() => ({ data: [] })),
    ])
      .then(([enqRes, statsRes, empRes]) => {
        setEnquiries(enqRes.data?.results || enqRes.data || [])
        setStats(statsRes.data)
        const empList = empRes.data?.results || empRes.data || []
        const map = {}
        empList.forEach(emp => {
          const id   = resolveEmpId(emp)
          const name = resolveEmpName(emp)
          if (id != null && name) { map[id] = name; map[String(id)] = name }
        })
        setEmpMap(map)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const getSalesRep = (assignedTo) => {
    if (!assignedTo) return '—'
    return empMap[assignedTo] || empMap[String(assignedTo)] || '—'
  }

  const getCreatedByName = (enquiry) => {
    // Use created_by_name from API if available
    if (enquiry.created_by_name) {
      return enquiry.created_by_name
    }
    // Fallback to mapping from empMap
    if (enquiry.created_by) {
      return empMap[enquiry.created_by] || empMap[String(enquiry.created_by)] || '—'
    }
    return '—'
  }

  // Get unique list of creators for dropdown
  const creatorsList = useMemo(() => {
    const creators = new Set()
    enquiries.forEach(enquiry => {
      const creatorName = getCreatedByName(enquiry)
      if (creatorName !== '—') {
        creators.add(creatorName)
      }
    })
    return Array.from(creators).sort()
  }, [enquiries, empMap])

  const filtered = enquiries
    .filter(e => {
      const q   = search.toLowerCase()
      const cs  = e.customer_detail || e.customer_snapshot || {}
      const loc = locationFilter.toLowerCase()
      const matchSearch   = !search        || (e.enquiry_number || '').toLowerCase().includes(q) || (cs.company_name || '').toLowerCase().includes(q)
      const matchLocation = !locationFilter|| (cs.city || '').toLowerCase().includes(loc) || (cs.state || '').toLowerCase().includes(loc) || (cs.country || '').toLowerCase().includes(loc)
      const matchDate     = !dateFilter    || e.enquiry_date === dateFilter
      const matchStatus   = !statusFilter  || e.status === statusFilter
      const matchCreatedBy = !createdByFilter || getCreatedByName(e) === createdByFilter
      return matchSearch && matchLocation && matchDate && matchStatus && matchCreatedBy
    })
    .sort((a, b) => {
      if (!a.created_at && !b.created_at) return 0
      if (!a.created_at) return 1
      if (!b.created_at) return -1
      return new Date(b.created_at) - new Date(a.created_at)
    })

  const handleExport = () => {
    const headers = ['Enquiry #','Date','Target Date','Entity Name','Status','Sales Rep','Created By','Value','Source','Days','Priority','Phone','Type','Location']
    const rows = filtered.map(e => {
      const cs = e.customer_detail || e.customer_snapshot || {}
      return [
        e.enquiry_number || '', e.enquiry_date || '', e.target_submission_date || '',
        cs.company_name || '', e.status || '', getSalesRep(e.assigned_to),
        getCreatedByName(e),
        e.prospective_value ? `${e.currency || 'INR'} ${e.prospective_value}` : '',
        e.source_of_enquiry || '', daysSince(e.last_activity_at) ?? '—',
        e.priority || '—', cs.phone || cs.telephone_primary || '', e.enquiry_type || '',
        [cs.city, cs.state, cs.country].filter(Boolean).join(', '),
      ]
    })
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'manager_enquiries.csv'
    a.click()
  }

  const statCards = [
    { label: 'Pending Enquiry',   value: stats?.pending ?? '—',             trend: 'up',   trendLabel: '5% Increment since past week' },
    { label: 'Quoted Enquiry',    value: stats?.quoted ?? '—' },
    { label: 'Under Negotiation', value: stats?.under_negotiation ?? '—' },
    {
      label: 'Enquiry Lost',
      value: stats?.lost !== undefined ? `${Math.round((stats.lost / Math.max(stats.total, 1)) * 100)}%` : '—',
      trend: 'down',
      trendLabel: stats?.lost !== undefined ? `Dropped by ${stats.lost} since last month` : undefined,
      highlight: true,
    },
  ]

  return (
    <div style={{ fontFamily: FONT, background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }

        .enq-row { transition: background 0.15s; cursor: pointer; }
        .enq-row:hover td { background: #f4f7fb !important; }

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
          pointer-events: none;
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
          padding: 13px 14px; text-align: left;
          white-space: nowrap; border-right: 1px solid rgba(255,255,255,0.07);
        }
        thead th:first-child { border-radius: 8px 0 0 0; }
        thead th:last-child  { border-radius: 0 8px 0 0; border-right: none; }

        tbody td {
          padding: 12px 14px; font-size: 13px; color: #374151;
          border-bottom: 1px solid #f1f5f9; white-space: nowrap;
          border-right: 1px solid #f5f7fa;
        }
        tbody td:last-child  { border-right: none; }
        tbody tr:last-child td { border-bottom: none; }
        
        .filter-select {
          border: 1.5px solid ${BORDER};
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          font-family: ${FONT};
          width: 100%;
          background: #fff;
          color: #1e293b;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .filter-select:focus {
          border-color: ${PRIMARY};
          box-shadow: 0 0 0 3px rgba(18,44,65,0.08);
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
          <div>
            <h1 style={{ color: '#fff', fontSize: 26, margin: '0 0 4px', fontWeight: 700, letterSpacing: '-0.3px' }}>
              Enquiries ({fmt(stats?.total || enquiries.length)})
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: 13 }}>
              Overview of all enquiries across your team
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: '#fff', border: 'none',
              padding: '11px 22px', borderRadius: 10,
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              color: PRIMARY, fontFamily: FONT,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            + New Enquiry
          </button>
        </div>

        {/* STAT CARDS */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: PRIMARY }}>Enquiry Stats</h3>
            <button
              onClick={() => navigate('/manager/enquiries/all')}
              title="View all enquiries"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </button>
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
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto auto', gap: 12, marginBottom: 14, alignItems: 'end' }}>
          <div style={{ position: 'relative' }}>
            <span className="filter-label">Search Enquiry</span>
            <input
              className="filter-input"
              placeholder="Enter Enquiry Name / Number"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <span className="filter-label">Location</span>
            <input
              className="filter-input"
              placeholder="Enter Location"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <span className="filter-label">Date</span>
            <input
              type="date"
              className="filter-input"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
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
            display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
            padding: '12px 16px', background: '#f8fafc',
            border: `1px solid ${BORDER}`, borderRadius: 9, marginBottom: 14,
          }}>
            <div style={{ minWidth: 150 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginRight: 8 }}>Status:</span>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 140, display: 'inline-block', marginLeft: 8 }}
              >
                <option value="">All Statuses</option>
                <option value="NEW">New Enquiry</option>
                <option value="PENDING">Pending Enquiry</option>
                <option value="NEGOTIATION">Under Negotiation</option>
                <option value="QUOTED">Quoted Enquiry</option>
                <option value="PO_RECEIVED">PO Received</option>
                <option value="LOST">Enquiry Lost</option>
                <option value="REGRET">Regret</option>
              </select>
            </div>
            
            <div style={{ minWidth: 150 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginRight: 8 }}>Created By:</span>
              <select
                className="filter-select"
                value={createdByFilter}
                onChange={e => setCreatedByFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 140, display: 'inline-block', marginLeft: 8 }}
              >
                <option value="">All Users</option>
                {creatorsList.map(creator => (
                  <option key={creator} value={creator}>{creator}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => { setStatusFilter(''); setCreatedByFilter(''); setLocationFilter(''); setDateFilter(''); setSearch('') }}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: FONT }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Active filters chips */}
        {(statusFilter || createdByFilter) && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {statusFilter && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#eff6ff', color: PRIMARY,
                padding: '4px 12px', borderRadius: 20,
                fontSize: 12, fontWeight: 500, border: `1px solid #bfdbfe`,
              }}>
                Status: {STATUS_LABELS[statusFilter] || statusFilter}
                <button onClick={() => setStatusFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
              </span>
            )}
            {createdByFilter && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#eff6ff', color: PRIMARY,
                padding: '4px 12px', borderRadius: 20,
                fontSize: 12, fontWeight: 500, border: `1px solid #bfdbfe`,
              }}>
                Created By: {createdByFilter}
                <button onClick={() => setCreatedByFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
              </span>
            )}
          </div>
        )}

        {/* Results count */}
        <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
          Showing {filtered.length} of {enquiries.length} enquiries
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${BORDER}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1300 }}>
            <thead>
              <tr>
                {[
                  'Enquiry Number','Date','Target Date','Entity Name','Status',
                  'Sales Rep','Created By','Prospective Value','Source','Days Since Activity',
                  'Priority','Phone (Mobile)','Enq. Type','Location',
                ].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Spinner /> Loading...
                    </div>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={14} style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    No enquiries found.
                    <br />
                    <button onClick={() => setShowModal(true)} style={{ marginTop: 8, background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, fontFamily: FONT }}>
                      + Create your first enquiry
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map(enq => {
                  const cs   = enq.customer_detail || enq.customer_snapshot || {}
                  const loc  = [cs.city, cs.state, cs.country].filter(Boolean).join(', ')
                  const days = daysSince(enq.last_activity_at)
                  const companyName = cs.company_name || cs.entity_name || '—'
                  return (
                    <tr key={enq.id} className="enq-row" onClick={() => navigate(`/manager/enquiries/${enq.id}`)}>
                      <td style={{ fontWeight: 600, color: PRIMARY }}>{enq.enquiry_number}</td>
                      <td>{formatDate(enq.enquiry_date)}</td>
                      <td>{formatDate(enq.target_submission_date)}</td>
                      <td>{companyName}</td>
                      <td><StatusBadge status={enq.status} /></td>
                      <td>{getSalesRep(enq.assigned_to)}</td>
                      <td>{getCreatedByName(enq)}</td>
                      <td style={{ fontWeight: 500 }}>
                        {enq.prospective_value ? `${enq.currency || 'INR'} ${Number(enq.prospective_value).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td>{enq.source_of_enquiry || '—'}</td>
                      <td style={{ textAlign: 'center' }}><DaysBadge days={days} /></td>
                      <td style={{ textAlign: 'center' }}><PriorityFlags priority={enq.priority} /></td>
                      <td>{cs.phone || cs.telephone_primary || '—'}</td>
                      <td>{enq.enquiry_type || '—'}</td>
                      <td>{loc || '—'}</td>
                     </tr>
                  )
                })
              )}
            </tbody>
           </table>
        </div>
      </div>

      <NewEnquiryModal open={showModal} onClose={() => setShowModal(false)} onSuccess={msg => { setShowModal(false); setToast(msg); fetchAll() }} />
    </div>
  )
}