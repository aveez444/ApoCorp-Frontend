import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import banner from "../../assets/dashboard-banner.png"

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const BORDER = "#e2e8f0"
const FONT    = "'Inter', 'Segoe UI', sans-serif"

const Icon = ({ d, size = 16, color = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ic = {
  users:   'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  home:    'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  globe:   'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  lock:    'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  plus:    'M12 5v14M5 12h14',
  print:   'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  export:  'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  arrow:   'M5 12h14M12 5l7 7-7 7',
  trendUp: 'M23 6l-9.5 9.5-5-5L1 18',
  trendDn: 'M23 18l-9.5-9.5-5 5L1 6',
  search:  'M21 21l-4.35-4.35M11 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 11a8 8 0 1 0-16 0 8 8 0 0 0 16 0z',
  filter:  'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
}

function TierBadge({ tier }) {
  const m = { A: ['#2e7d32', '#e8f5e9'], B: ['#1565c0', '#e3f2fd'], C: ['#e65100', '#fff3e0'] }
  const [c, bg] = m[tier] || ['#64748b', '#f1f5f9']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 28, height: 28, borderRadius: '50%',
      background: bg, color: c, fontWeight: 700, fontSize: 13, fontFamily: FONT
    }}>{tier}</span>
  )
}

const fmt = n => new Intl.NumberFormat('en-IN').format(n ?? 0)

export default function Customers({ basePath = '/employee/customers' }) {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [stats, setStats] = useState({
    active: 0,
    domestic: 0,
    offshore: 0,
    inactive: 0
  })

  // Filter states
  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  
  // Debounced filters
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [debouncedTier, setDebouncedTier] = useState("")
  const [debouncedLocation, setDebouncedLocation] = useState("")

  // Debounce search inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTier(tierFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [tierFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(locationFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [locationFilter])

  // Fetch customers with all filters from backend
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page: 1,
        limit: 6, // Just fetch 6 for preview
        detail: 'true'
      }
      
      // Add filters if they exist
      if (debouncedSearch) params.q = debouncedSearch
      if (debouncedTier) params.tier = debouncedTier
      if (debouncedLocation) params.location = debouncedLocation
      
      const res = await api.get('/customers/search/', { params })
      const fetchedCustomers = res.data.results || []
      setCustomers(fetchedCustomers)
      setTotalCustomers(res.data.total)
      
      // For stats, we need to fetch all customers without pagination
      // Or better, create a stats endpoint. For now, we'll fetch with a larger limit
      const statsParams = {
        page: 1,
        limit: 10000,
        detail: 'true'
      }
      if (debouncedSearch) statsParams.q = debouncedSearch
      if (debouncedTier) statsParams.tier = debouncedTier
      if (debouncedLocation) statsParams.location = debouncedLocation
      
      const statsRes = await api.get('/customers/search/', { params: statsParams })
      const allFilteredCustomers = statsRes.data.results || []
      
      // Calculate stats from filtered data
      setStats({
        active: allFilteredCustomers.filter(c => c.is_active && !c.is_locked).length,
        domestic: allFilteredCustomers.filter(c => ['india', 'in'].includes((c.country || '').toLowerCase())).length,
        offshore: allFilteredCustomers.filter(c => { 
          const co = (c.country || '').toLowerCase(); 
          return co && !['india', 'in'].includes(co) 
        }).length,
        inactive: allFilteredCustomers.filter(c => c.is_locked || !c.is_active).length,
      })
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, debouncedTier, debouncedLocation])

  // Fetch when filters change
  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Clear all filters
  const clearFilters = () => {
    setSearch("")
    setTierFilter("")
    setLocationFilter("")
  }

  const statCards = [
    { label: 'Active Customers',    value: stats.active,   icon: ic.users,  trend: '+30% since past month', up: true  },
    { label: 'Domestic Customers',  value: stats.domestic, icon: ic.home,   trend: '+12% since past month', up: true  },
    { label: 'Off Shore Customers', value: stats.offshore, icon: ic.globe,  trend: '−5% since past month',  up: false },
    { label: 'Inactive Customers',  value: stats.inactive, icon: ic.lock,   trend: '+5% since past month',  up: true  },
  ]

  const handleExport = () => {
    // Export with current filters
    const exportParams = {
      page: 1,
      limit: 10000,
      detail: 'true'
    }
    if (debouncedSearch) exportParams.q = debouncedSearch
    if (debouncedTier) exportParams.tier = debouncedTier
    if (debouncedLocation) exportParams.location = debouncedLocation
    
    api.get('/customers/search/', { params: exportParams })
      .then(res => {
        const allCustomers = res.data.results || []
        const headers = ['Customer ID', 'Entity Name', 'Tier', 'Life Time Value', 'Avg Order Size', 'Current Projects', 'Contact', 'Location']
        const rows = allCustomers.map(c => [c.customer_code || '', c.company_name || '', c.tier || '', c.lifetime_value || 0, c.avg_order_size || 0, c.current_projects || 0, c.telephone_primary || '', [c.city, c.country].filter(Boolean).join(', ')])
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `customers_${new Date().toISOString().slice(0,19)}.csv`; a.click()
      })
      .catch(console.error)
  }

  return (
    <div style={{ fontFamily: FONT, color: '#1a1a2e', background: "#f8fafc", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .stat-card:hover   { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.12) !important; }
        .stat-card         { transition: transform .2s, box-shadow .2s; }
        .row-hover:hover   { background: #f0f5ff !important; cursor: pointer; }
        .ghost-btn:hover   { background: rgba(255,255,255,.18) !important; }
        .add-btn:hover     { background: #f0f5ff !important; }
        .text-btn:hover    { text-decoration: underline; }
        ::-webkit-scrollbar { height: 5px; width: 5px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }

        .filter-input {
          border: 1.5px solid #e2e8f0;
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
          border-color: #122C41;
          box-shadow: 0 0 0 3px rgba(18,44,65,0.08);
        }
        .filter-input::placeholder { color: #94a3b8; }

        .filter-label {
          position: absolute;
          top: -9px;
          left: 12px;
          background: #fff;
          padding: 0 4px;
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
          pointer-events: none;
        }

        .btn-outline {
          border: 1.5px solid #e2e8f0;
          background: #fff;
          color: #374151;
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: ${FONT};
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .btn-outline:hover { background: #f1f5f9; border-color: #cbd5e1; }

        .btn-primary {
          background: ${PRIMARY};
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: ${FONT};
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .btn-primary:hover { background: #1a3f5c; }

        .btn-secondary {
          background: #e2e8f0;
          color: #334155;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: ${FONT};
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .btn-secondary:hover { background: #cbd5e1; }

        .tag-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .tag-chip button {
          background: none;
          border: none;
          cursor: pointer;
          color: #93c5fd;
          font-size: 14px;
          line-height: 1;
          padding: 0;
          display: flex;
          align-items: center;
        }
        .tag-chip button:hover { color: #2563eb; }

        select.filter-input {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
        }

        thead th {
          background: ${PRIMARY};
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 13px 16px;
          text-align: left;
          border-bottom: none;
          white-space: nowrap;
        }
        thead th:first-child { border-radius: 8px 0 0 0; }
        thead th:last-child  { border-radius: 0 8px 0 0; }

        tbody td {
          padding: 13px 16px;
          font-size: 13px;
          color: #374151;
          border-bottom: 1px solid #f1f5f9;
          white-space: nowrap;
        }

        tbody tr:last-child td { border-bottom: none; }
      `}</style>

      {/* ── BANNER ── */}
      <div style={{
        backgroundImage: `linear-gradient(125deg, rgba(13,31,48,0.7) 0%, rgba(18,44,65,0.6) 40%, rgba(26,74,110,0.4) 100%), url(${banner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 16,
        padding: '28px 32px 110px',
        position: 'relative',
        marginBottom: 72,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(120deg,rgba(18,44,65,.72),rgba(18,44,65,.4))",
          borderRadius: 16
        }} />

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative', zIndex:1 }}>
          <div>
            <p style={{ margin:'0 0 4px', color:'rgba(255,255,255,.5)', fontSize:11.5, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase' }}>Customer Management</p>
            <h1 style={{ margin:0, fontSize:30, fontWeight:700, color:'#fff', letterSpacing:'-0.02em' }}>
              Customers&nbsp;
              <span style={{ fontSize:20, fontWeight:400, opacity:.55 }}>({fmt(totalCustomers)})</span>
            </h1>
          </div>

          <div style={{ display:'flex', gap:10, alignItems:'center' }}>


            <button className="add-btn" onClick={() => navigate(`${basePath}/new`)} style={addBtn}>
              <Icon d={ic.plus} size={14} color={PRIMARY} /> Add New Customer
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16,
          position: 'absolute', bottom: -54, left: 32, right: 32, zIndex: 10,
        }}>
          {statCards.map((s, i) => (
            <div key={i} className="stat-card" style={{
              background: '#fff', borderRadius: 12, padding: '16px 20px',
              boxShadow: '0 4px 20px rgba(0,0,0,.09)',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7280' }}>{s.label}</span>
                <div style={{ width:32, height:32, borderRadius:8, background:`${ACCENT}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon d={s.icon} size={15} color={ACCENT} />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: PRIMARY, letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(s.value)}</div>
              <div style={{ display:'flex', alignItems:'center', gap: 4, marginTop: 8, fontSize: 11.5, fontWeight: 600, color: s.up ? '#16a34a' : '#dc2626' }}>
                <Icon d={s.up ? ic.trendUp : ic.trendDn} size={11} color={s.up ? '#16a34a' : '#dc2626'} />
                {s.trend}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN TABLE CARD ── */}
      <div style={{
        background: '#fff',
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: "24px 24px 20px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
        animation: 'fadeUp .35s ease'
      }}>

        {/* TOP BAR */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 20
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: PRIMARY }}>
              Customer Data
            </h3>
            <button
              onClick={() => navigate(`${basePath}/list?search=${encodeURIComponent(search)}&tier=${encodeURIComponent(tierFilter)}&location=${encodeURIComponent(locationFilter)}`)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center"
              }}
              title="View All Customers"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transition: "all 0.15s" }}
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </button>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
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

        {/* SEARCH ROW */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1.5fr auto auto",
          gap: 12,
          marginBottom: 16,
          alignItems: "end"
        }}>
          <div style={{ position: "relative" }}>
            <span className="filter-label">Search Customer</span>
            <input
              className="filter-input"
              placeholder="Search by name, code, email, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ position: "relative" }}>
            <span className="filter-label">Tier</span>
            <select
              className="filter-input"
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value)}
            >
              <option value="">All Tiers</option>
              <option value="A">Tier A</option>
              <option value="B">Tier B</option>
              <option value="C">Tier C</option>
            </select>
          </div>
          <div style={{ position: "relative" }}>
            <span className="filter-label">Location</span>
            <input
              className="filter-input"
              placeholder="City or Country"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
            />
          </div>
          <button 
            className="btn-primary"
            onClick={() => fetchCustomers()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            Search
          </button>
          <button 
            className="btn-secondary"
            onClick={clearFilters}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="4" y1="20" x2="20" y2="4" />
            </svg>
            Clear Filters
          </button>
        </div>

        {/* Active Filters Display */}
        {(search || tierFilter || locationFilter) && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {search && (
              <span className="tag-chip">
                Search: {search}
                <button onClick={() => setSearch("")}>×</button>
              </span>
            )}
            {tierFilter && (
              <span className="tag-chip">
                Tier: {tierFilter}
                <button onClick={() => setTierFilter("")}>×</button>
              </span>
            )}
            {locationFilter && (
              <span className="tag-chip">
                Location: {locationFilter}
                <button onClick={() => setLocationFilter("")}>×</button>
              </span>
            )}
          </div>
        )}

        {/* Results count */}
        <div style={{ marginBottom: 12, fontSize: 13, color: "#64748b" }}>
          Showing {customers.length} of {fmt(totalCustomers)} customers
          {(search || tierFilter || locationFilter) && " (filtered)"}
        </div>

        {/* TABLE */}
        <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${BORDER}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {['Customer ID', 'Entity Name', 'Tier', 'Life Time Value', 'Avg. Order Size', 'Current Projects', 'Contact', 'Location', 'Pending Invoice'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: 44, textAlign:'center', color:'#94a3b8' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                      <div style={{ width:18, height:18, border:'2px solid #e2e8f0', borderTopColor:PRIMARY, borderRadius:'50%', animation:'spin .8s linear infinite' }} />
                      Loading customers…
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding:44, textAlign:'center', color:'#94a3b8', fontSize:14 }}>
                    {totalCustomers === 0 ? 'No customers found.' : 'No customers match your filters.'}
                    {totalCustomers === 0 && (
                      <button onClick={() => navigate(`${basePath}/new`)} style={{ background:'none', border:'none', color:ACCENT, cursor:'pointer', fontSize:13.5, fontWeight:600, fontFamily:FONT, marginLeft: 8 }}>
                        Add your first →
                      </button>
                    )}
                  </td>
                </tr>
              ) : customers.map((c, i) => (
                <tr
                  key={c.id}
                  className="row-hover"
                  onClick={() => navigate(`${basePath}/${c.id}`)}
                  style={{ background: i % 2 === 0 ? '#fafafa' : '#fff', borderBottom:'1px solid #f1f5f9', transition:'background .1s' }}
                >
                  <td style={{ ...td, color: PRIMARY, fontWeight: 700, fontFamily:'monospace', fontSize:12.5 }}>{c.customer_code}</td>
                  <td style={{ ...td, fontWeight: 600, color: '#111827' }}>{c.company_name}</td>
                  <td style={td}><TierBadge tier={c.tier} /></td>
                  <td style={td}>{c.lifetime_value  ? `₹${fmt(c.lifetime_value)}` : '—'}</td>
                  <td style={td}>{c.avg_order_size  ? `₹${fmt(c.avg_order_size)}` : '—'}</td>
                  <td style={{ ...td, textAlign:'center' }}>{c.current_projects || 0}</td>
                  <td style={{ ...td, color: ACCENT }}>{c.telephone_primary || '—'}</td>
                  <td style={td}>{[c.city, c.country].filter(Boolean).join(', ') || '—'}</td>
                  <td style={{ ...td, textAlign:'center' }}>—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalCustomers > 6 && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              onClick={() => navigate(`${basePath}/list?search=${encodeURIComponent(search)}&tier=${encodeURIComponent(tierFilter)}&location=${encodeURIComponent(locationFilter)}`)}
              style={{ padding:'9px 28px', borderRadius:8, border:`1.5px solid ${PRIMARY}`, background:'#fff', color:PRIMARY, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FONT, transition:'all .15s' }}
            >
              View All {fmt(totalCustomers)} Customers →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── shared style objects ── */
const td = {
  padding: '12px 16px', color: '#374151',
  borderRight: '1px solid #f1f5f9', whiteSpace: 'nowrap', verticalAlign: 'middle',
}
const ghostBtn = {
  display:'flex', alignItems:'center', gap:6,
  padding:'8px 16px', border:'1px solid rgba(255,255,255,.25)',
  borderRadius:8, background:'rgba(255,255,255,.1)',
  color:'#fff', fontSize:13, fontWeight:500,
  cursor:'pointer', fontFamily:"'Inter','Segoe UI',sans-serif",
  backdropFilter:'blur(4px)', transition:'background .15s', whiteSpace:'nowrap',
}
const addBtn = {
  display:'flex', alignItems:'center', gap:6,
  padding:'9px 18px', border:'none', borderRadius:8,
  background:'#fff', color:'#122C41',
  fontSize:13, fontWeight:700, cursor:'pointer',
  fontFamily:"'Inter','Segoe UI',sans-serif",
  boxShadow:'0 2px 10px rgba(0,0,0,.18)', transition:'background .15s', whiteSpace:'nowrap',
}