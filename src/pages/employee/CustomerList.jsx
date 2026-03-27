import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const FONT    = "'Inter', 'Segoe UI', sans-serif"

const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ic = {
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  plus:      'M12 5v14M5 12h14',
  search:    'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  filter:    'M22 3H2l8 9.46V19l4 2v-8.54z',
  print:     'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  export:    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  lock:      'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  unlock:    'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 9.9-1',
  eye:       'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  x:         'M18 6L6 18M6 6l12 12',
  chevL:     'M15 18l-6-6 6-6',
  chevR:     'M9 18l6-6-6-6',
}

function TierBadge({ tier }) {
  const m = { A: ['#2e7d32', '#e8f5e9'], B: ['#1565c0', '#e3f2fd'], C: ['#e65100', '#fff3e0'] }
  const [c, bg] = m[tier] || ['#64748b', '#f1f5f9']
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:28, height:28, borderRadius:'50%',
      background:bg, color:c, fontWeight:700, fontSize:13, fontFamily:FONT
    }}>{tier}</span>
  )
}

function ConfirmModal({ open, onClose, onConfirm, isLocked, customerName, loading }) {
  if (!open) return null
  const action = isLocked ? 'Unlock' : 'Lock'
  const accent = isLocked ? '#16a34a' : '#dc2626'
  const bg     = isLocked ? '#f0fdf4' : '#fef2f2'
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(3px)' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'36px 40px', maxWidth:420, width:'90%', boxShadow:'0 20px 48px rgba(0,0,0,.16)' }}>
        <div style={{ width:56, height:56, borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <Icon d={isLocked ? ic.unlock : ic.lock} size={24} color={accent} />
        </div>
        <h2 style={{ textAlign:'center', fontSize:19, fontWeight:700, color:'#111827', margin:'0 0 10px' }}>{action} Customer Account?</h2>
        <p style={{ textAlign:'center', color:'#6b7280', fontSize:13.5, lineHeight:1.6, margin:'0 0 24px' }}>
          {isLocked
            ? <>Unlocking <strong style={{ color:'#111827' }}>{customerName}</strong> will allow new transactions on this account.</>
            : <>Locking <strong style={{ color:'#111827' }}>{customerName}</strong> will prevent any new transactions from being entered.</>}
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px 0', borderRadius:9, border:'1.5px solid #e5e7eb', background:'#fff', color:'#4b5563', fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex:1, padding:'11px 0', borderRadius:9, border:'none', background:accent, color:'#fff', fontSize:13.5, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, fontFamily:FONT }}>
            {loading ? 'Please wait…' : `${action} Account`}
          </button>
        </div>
      </div>
    </div>
  )
}

const fmt = n => new Intl.NumberFormat('en-IN').format(n ?? 0)

export default function CustomerList({ basePath = '/employee/customers' }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState(searchParams.get('search') || '')
  const [location, setLocation]   = useState(searchParams.get('location') || '')
  const [tierFilter, setTierFilter] = useState(searchParams.get('tier') || '')
  const [lockModal, setLockModal] = useState({ open:false, customer:null, loading:false })
  const [page, setPage]           = useState(1)
  const [total, setTotal]         = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const PAGE = 15

  // Debounced filters
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [debouncedLocation, setDebouncedLocation] = useState(location)
  const [debouncedTier, setDebouncedTier] = useState(tierFilter)

  // Debounce search inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(location)
    }, 300)
    return () => clearTimeout(timer)
  }, [location])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTier(tierFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [tierFilter])

  // Update URL params when filters change
  useEffect(() => {
    const params = {}
    if (debouncedSearch) params.search = debouncedSearch
    if (debouncedLocation) params.location = debouncedLocation
    if (debouncedTier) params.tier = debouncedTier
    setSearchParams(params)
  }, [debouncedSearch, debouncedLocation, debouncedTier, setSearchParams])

  // Fetch customers with all filters from backend
  const fetchCustomers = useCallback(async (pageNum = 1) => {
    setLoading(true)
    try {
      const params = {
        page: pageNum,
        limit: PAGE,
        detail: 'true'
      }
      
      if (debouncedSearch) params.q = debouncedSearch
      if (debouncedLocation) params.location = debouncedLocation
      if (debouncedTier) params.tier = debouncedTier
      
      const res = await api.get('/customers/search/', { params })
      setCustomers(res.data.results || [])
      setTotal(res.data.total)
      setTotalPages(res.data.pages)
      setPage(pageNum)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, debouncedLocation, debouncedTier, PAGE])

  // Initial load and when filters change
  useEffect(() => {
    fetchCustomers(1)
  }, [fetchCustomers])

  const handleLockClick = (c, e) => { 
    e.stopPropagation() 
    setLockModal({ open:true, customer:c, loading:false }) 
  }

  const confirmLock = async () => {
    const { customer } = lockModal
    setLockModal(p => ({ ...p, loading: true }))
    try {
      await api.post(`/customers/${customer.id}/${customer.is_locked ? 'unlock' : 'lock'}/`)
      await fetchCustomers(page)
      setLockModal({ open:false, customer:null, loading:false })
    } catch(e) {
      console.error(e)
      setLockModal(p => ({ ...p, loading: false }))
    }
  }

  const handleSearch = () => {
    fetchCustomers(1)
  }

  const clearFilters = () => {
    setSearch('')
    setLocation('')
    setTierFilter('')
    setDebouncedSearch('')
    setDebouncedLocation('')
    setDebouncedTier('')
    setPage(1)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchCustomers(newPage)
    }
  }

  const handleExport = () => {
    const exportParams = {
      page: 1,
      limit: 10000,
      detail: 'true'
    }
    if (debouncedSearch) exportParams.q = debouncedSearch
    if (debouncedLocation) exportParams.location = debouncedLocation
    if (debouncedTier) exportParams.tier = debouncedTier
    
    api.get('/customers/search/', { params: exportParams })
      .then(res => {
        const allCustomers = res.data.results || []
        const headers = ['Customer ID', 'Customer Name', 'Tier', 'Life Time Value', 'Avg Order Size', 'Current Projects', 'Contact', 'Location']
        const rows = allCustomers.map(c => [c.customer_code||'', c.company_name||'', c.tier||'', c.lifetime_value||0, c.avg_order_size||0, c.current_projects||0, c.telephone_primary||'', [c.city,c.country].filter(Boolean).join(', ')])
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=`customers_${new Date().toISOString().slice(0,19)}.csv`; a.click()
      })
      .catch(console.error)
  }

  return (
    <div style={{ fontFamily: FONT, color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .row-hover:hover   { background: #f0f5ff !important; cursor: pointer; }
        .icon-btn:hover    { opacity:.8; }
        input:focus { outline:none; border-color:${ACCENT} !important; box-shadow:0 0 0 3px ${ACCENT}1a !important; }
        select:focus { outline:none; }
        ::-webkit-scrollbar{height:5px;width:5px} ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:99px}
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button
            onClick={() => navigate(basePath)}
            style={{ width:36, height:36, borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
          >
            <Icon d={ic.arrowLeft} size={16} color="#6b7280" />
          </button>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:PRIMARY }}>
            Customer Data&nbsp;
            <span style={{ fontWeight:500, fontSize:15, color:'#9ca3af' }}>({fmt(total)})</span>
          </h1>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => window.print()} style={outlineBtn}><Icon d={ic.print} size={14} color="#6b7280" /> Print</button>
          <button onClick={handleExport}         style={outlineBtn}><Icon d={ic.export} size={14} color="#6b7280" /> Export to Excel</button>
          <button onClick={() => navigate(`${basePath}/new`)} style={addBtn}>
            <Icon d={ic.plus} size={14} color="#fff" /> Add New Customer
          </button>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div style={{ background:'#fff', borderRadius:12, padding:'18px 20px', boxShadow:'0 1px 8px rgba(0,0,0,.06)', marginBottom:14 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          <FloatingInput label="Search Customer"          value={search}   onChange={setSearch}   placeholder="Enter Customer Name / Number" />
          <FloatingInput label="Location"                 value={location} onChange={setLocation} placeholder="Enter Location" />
          <div style={{ position:'relative', flex:'1 1 150px', minWidth:140 }}>
            <span style={{
              position:'absolute', top:-9, left:10,
              background:'#fff', padding:'0 4px',
              fontSize:11, fontWeight:600, color:'#9ca3af',
              fontFamily:FONT, zIndex:1, letterSpacing:'.04em', textTransform:'uppercase',
            }}>Tier</span>
            <select
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value)}
              style={{
                width:'100%', padding:'10px 14px',
                border:'1.5px solid #e5e7eb', borderRadius:8,
                fontSize:13.5, fontFamily:FONT, color:'#111827',
                background:'#fff', cursor:'pointer'
              }}
            >
              <option value="">All Tiers</option>
              <option value="A">Tier A</option>
              <option value="B">Tier B</option>
              <option value="C">Tier C</option>
            </select>
          </div>
          <button onClick={handleSearch} style={searchBtn}><Icon d={ic.search} size={14} color="#fff" /> Search</button>
          <button
            onClick={() => setShowFilters(p => !p)}
            style={{ ...outlineBtn, borderColor:showFilters?ACCENT:'#e5e7eb', color:showFilters?ACCENT:'#6b7280', background:showFilters?`${ACCENT}0d`:'#fff' }}
          >
            <Icon d={ic.filter} size={14} color={showFilters?ACCENT:'#6b7280'} /> Filters
          </button>
        </div>

        {(search || location || tierFilter) && (
          <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f3f4f6', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            {search && (
              <span className="tag-chip">
                Search: {search}
                <button onClick={() => setSearch('')}>×</button>
              </span>
            )}
            {location && (
              <span className="tag-chip">
                Location: {location}
                <button onClick={() => setLocation('')}>×</button>
              </span>
            )}
            {tierFilter && (
              <span className="tag-chip">
                Tier: {tierFilter}
                <button onClick={() => setTierFilter('')}>×</button>
              </span>
            )}
            <button onClick={clearFilters} style={{
              padding:'5px 12px', borderRadius:99, cursor:'pointer', fontFamily:FONT,
              border:'1.5px solid #ef4444', background:'#fff', color:'#ef4444',
              fontSize:12.5, fontWeight:600, display:'flex', alignItems:'center', gap:4,
            }}>
              <Icon d={ic.x} size={11} color="#ef4444" /> Clear All
            </button>
          </div>
        )}
      </div>

      {/* ── TABLE ── */}
      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,.06)', overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:920, fontSize:13.5 }}>
            <thead>
              <tr style={{ background: PRIMARY }}>
                {['Customer ID','Customer Name','Location','Contact Details','Current Projects','Avg. Order Size (INR)','Last Order','Pending Invoice',''].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
                </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding:48, textAlign:'center', color:'#9ca3af' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                    <div style={{ width:18, height:18, border:'2px solid #e5e7eb', borderTopColor:PRIMARY, borderRadius:'50%', animation:'spin .8s linear infinite' }} />
                    Loading…
                  </div>
                </td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={9} style={{ padding:48, textAlign:'center', color:'#9ca3af', fontSize:14 }}>
                  {total === 0 ? 'No customers found.' : 'No customers match your filters.'}
                  {total === 0 && (
                    <button onClick={() => navigate(`${basePath}/new`)} style={{ background:'none', border:'none', color:ACCENT, cursor:'pointer', fontWeight:600, fontFamily:FONT, marginLeft: 8 }}>
                      Add your first →
                    </button>
                  )}
                </td></tr>
              ) : customers.map((c, i) => (
                <tr
                  key={c.id}
                  className="row-hover"
                  onClick={() => navigate(`${basePath}/${c.id}`)}
                  style={{ background:i%2===0?'#fafafa':'#fff', borderBottom:'1px solid #f3f4f6', transition:'background .1s' }}
                >
                  <td style={{ ...td, color:PRIMARY, fontWeight:700, fontFamily:'monospace', fontSize:12.5 }}>{c.customer_code}</td>
                  <td style={{ ...td, fontWeight:600, color:'#111827' }}>{c.company_name}</td>
                  <td style={td}>{[c.city,c.country].filter(Boolean).join(', ') || '—'}</td>
                  <td style={{ ...td, color:ACCENT }}>{c.telephone_primary || '—'}</td>
                  <td style={{ ...td, textAlign:'center' }}>{c.current_projects || 0}</td>
                  <td style={td}>{c.avg_order_size ? `₹${fmt(c.avg_order_size)}` : '—'}</td>
                  <td style={{ ...td, color:'#9ca3af' }}>—</td>
                  <td style={{ ...td, textAlign:'center' }}>—</td>
                  <td style={{ ...td, borderRight:'none' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button
                        className="icon-btn"
                        onClick={e => { e.stopPropagation(); navigate(`${basePath}/${c.id}`) }}
                        style={iconBtn}
                        title="View"
                      >
                        <Icon d={ic.eye} size={14} color={ACCENT} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={e => handleLockClick(c, e)}
                        style={{ ...iconBtn, background:c.is_locked?'#f0fdf4':'#fef2f2' }}
                        title={c.is_locked ? 'Unlock' : 'Lock'}
                      >
                        <Icon d={c.is_locked?ic.unlock:ic.lock} size={14} color={c.is_locked?'#16a34a':'#dc2626'} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 20px', borderTop:'1px solid #f3f4f6' }}>
            <span style={{ fontSize:13, color:'#6b7280' }}>
              Showing {(page-1)*PAGE+1}–{Math.min(page*PAGE, total)} of {fmt(total)}
            </span>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={()=>handlePageChange(page-1)} disabled={page===1} style={pgBtn(page===1)}>
                <Icon d={ic.chevL} size={14} />
              </button>
              {Array.from({length:Math.min(7,totalPages)},(_,i)=>{
                let pg = page <= 4 ? i+1 : page+i-3
                if (pg < 1 || pg > totalPages) return null
                return <button key={pg} onClick={()=>handlePageChange(pg)} style={pgBtn(false,pg===page)}>{pg}</button>
              })}
              <button onClick={()=>handlePageChange(page+1)} disabled={page===totalPages} style={pgBtn(page===totalPages)}>
                <Icon d={ic.chevR} size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={lockModal.open}
        onClose={() => setLockModal({open:false,customer:null,loading:false})}
        onConfirm={confirmLock}
        isLocked={lockModal.customer?.is_locked}
        customerName={lockModal.customer?.company_name}
        loading={lockModal.loading}
      />
    </div>
  )
}

function FloatingInput({ label, value, onChange, placeholder }) {
  return (
    <div style={{ position:'relative', flex:'1 1 180px', minWidth:160 }}>
      <span style={{
        position:'absolute', top:-9, left:10,
        background:'#fff', padding:'0 4px',
        fontSize:11, fontWeight:600, color:'#9ca3af',
        fontFamily:FONT, zIndex:1, letterSpacing:'.04em', textTransform:'uppercase',
      }}>{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width:'100%', padding:'10px 14px',
          border:'1.5px solid #e5e7eb', borderRadius:8,
          fontSize:13.5, fontFamily:FONT, color:'#111827',
          background:'#fff', transition:'border .15s, box-shadow .15s',
        }}
      />
    </div>
  )
}

/* ── shared styles ── */
const th = {
  padding:'12px 16px', color:'#fff', fontWeight:600,
  textAlign:'left', whiteSpace:'nowrap', fontSize:13,
  fontFamily:FONT, borderRight:'1px solid rgba(255,255,255,.08)',
}
const td = {
  padding:'12px 16px', color:'#374151',
  borderRight:'1px solid #f3f4f6', whiteSpace:'nowrap', verticalAlign:'middle',
}
const outlineBtn = {
  display:'flex', alignItems:'center', gap:6,
  padding:'9px 16px', border:'1.5px solid #e5e7eb',
  borderRadius:8, background:'#fff', color:'#4b5563',
  fontSize:13, fontWeight:500, cursor:'pointer',
  fontFamily:FONT, whiteSpace:'nowrap',
}
const addBtn = {
  display:'flex', alignItems:'center', gap:6,
  padding:'10px 20px', borderRadius:8, border:'none',
  background:PRIMARY, color:'#fff',
  fontSize:13, fontWeight:700, cursor:'pointer',
  fontFamily:FONT, whiteSpace:'nowrap',
}
const searchBtn = {
  display:'flex', alignItems:'center', gap:6,
  padding:'10px 22px', borderRadius:8, border:'none',
  background:ACCENT, color:'#fff',
  fontSize:13, fontWeight:600, cursor:'pointer',
  fontFamily:FONT, whiteSpace:'nowrap',
}
const iconBtn = {
  width:30, height:30, borderRadius:7, border:'none',
  background:'#f3f4f6', display:'flex', alignItems:'center',
  justifyContent:'center', cursor:'pointer', transition:'opacity .15s',
}
const pgBtn = (disabled, active=false) => ({
  minWidth:34, height:34, borderRadius:7, border:'1.5px solid',
  borderColor:active?PRIMARY:'#e5e7eb',
  background:active?PRIMARY:'#fff',
  color:active?'#fff':disabled?'#d1d5db':'#4b5563',
  fontSize:13, fontWeight:600, cursor:disabled?'not-allowed':'pointer',
  display:'flex', alignItems:'center', justifyContent:'center',
  fontFamily:FONT, opacity:disabled?0.5:1, padding:'0 8px',
})