import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import banner from '../../assets/dashboard-banner.png'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const FONT    = "'Lato', 'Inter', 'Segoe UI', sans-serif"

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const fmt     = n  => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n ?? 0)
const fmtDate = d  => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'

// ── Icon ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const ic = {
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  print:    'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  export:   'M12 3v12M8 11l4 4 4-4M3 17v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1',
  filter:   'M4 6h16M8 12h8M11 18h2',
  clock:    'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2',
  gear:     'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  check:    'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  plus:     'M12 5v14M5 12h14',
  phone:    'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CFG = {
  HOLD:        { label:'On Hold',      color:'#f59e0b', bg:'#fffbeb', dot:'#f59e0b' },
  IN_PROGRESS: { label:'In Progress',  color:'#1e88e5', bg:'#eff6ff', dot:'#1e88e5' },
  COMPLETED:   { label:'Completed',    color:'#10b981', bg:'#ecfdf5', dot:'#10b981' },
}

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || { label: status, color:'#6b7280', bg:'#f3f4f6', dot:'#9ca3af' }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:20, background:s.bg, color:s.color, fontSize:11, fontWeight:600, fontFamily:FONT, border:`1px solid ${s.dot}33`, whiteSpace:'nowrap' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }} />
      {s.label}
    </span>
  )
}

// ── Contact hover cell ────────────────────────────────────────────────────────
function ContactCell({ phone, name }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{ position:'relative', display:'inline-block' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={{ color: ACCENT, cursor:'pointer', fontSize:13, fontFamily:FONT }}>{phone || '—'}</span>
      {hover && phone && (
        <div style={{ position:'absolute', top:'100%', left:0, zIndex:200, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 14px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', minWidth:200, marginTop:4 }}>
          {name && (
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#374151', marginBottom:6 }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {name}
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#374151' }}>
            <Icon d={ic.phone} size={11} color="#6b7280" /> {phone}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Float label input ─────────────────────────────────────────────────────────
function FloatInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ position:'relative', flex:'1 1 180px', minWidth:150 }}>
      <span style={{ position:'absolute', top:-9, left:10, background:'#f4f6fb', padding:'0 4px', fontSize:11, color:'#6b7280', fontFamily:FONT, zIndex:1, pointerEvents:'none' }}>{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'10px 14px', border:'1px solid #d1d5db', borderRadius:7, fontSize:13, fontFamily:FONT, outline:'none', background:'#fff', boxSizing:'border-box', color:'#111827' }} />
    </div>
  )
}

// ── Shared button styles ──────────────────────────────────────────────────────
const outlineBtn = {
  display:'flex', alignItems:'center', gap:7, padding:'9px 16px',
  border:'1px solid #d1d5db', borderRadius:7, background:'#fff',
  fontSize:13, fontWeight:600, cursor:'pointer', color:'#374151',
  fontFamily:FONT, whiteSpace:'nowrap',
}
const thStyle = {
  padding:'12px 14px', fontSize:13, fontWeight:700, color:PRIMARY,
  textAlign:'left', fontFamily:FONT, background:'#EEF3FF',
  whiteSpace:'nowrap', borderBottom:'1px solid #D8E3FF',
}
const tdStyle = {
  padding:'12px 14px', fontSize:13, color:'#232323',
  fontFamily:FONT, borderBottom:'1px solid #F0F0F0', whiteSpace:'nowrap',
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Orders({ basePath = '/employee/orders' }) {
  const navigate = useNavigate()

  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search,        setSearch]        = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [contactFilter,  setContactFilter]  = useState('')
  const [dateFilter,     setDateFilter]     = useState('')
  const [showFilters,    setShowFilters]    = useState(false)
  const [statusFilter,   setStatusFilter]   = useState('')

  const fetchOrders = useCallback(() => {
    setLoading(true)
    api.get('/orders/orders/')
      .then(r => {
        const data = r.data?.results ?? r.data ?? []
        setOrders([...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ── Counts for stat cards ──
  const counts = {
    HOLD:        orders.filter(o => o.status === 'HOLD').length,
    IN_PROGRESS: orders.filter(o => o.status === 'IN_PROGRESS').length,
    COMPLETED:   orders.filter(o => o.status === 'COMPLETED').length,
  }

  // ── Filtering ──
  const filtered = orders.filter(o => {
    const customer = o.customer_detail ?? {}
    const company  = customer.company_name?.toLowerCase() ?? ''
    const num      = o.order_number?.toLowerCase() ?? ''
    const phone    = customer.pocs?.[0]?.phone ?? customer.telephone_primary ?? ''
    const region   = (customer.region ?? customer.city ?? '').toLowerCase()

    if (search        && !company.includes(search.toLowerCase()) && !num.includes(search.toLowerCase())) return false
    if (locationFilter && !region.includes(locationFilter.toLowerCase())) return false
    if (contactFilter  && !phone.includes(contactFilter)) return false
    if (dateFilter     && !o.created_at?.startsWith(dateFilter)) return false
    if (statusFilter   && o.status !== statusFilter) return false
    return true
  })

  return (
    <div style={{ fontFamily:FONT, minHeight:'100vh', background:'#f5f7fa' }}>

      {/* ── BANNER ── */}
      <div style={{
        backgroundImage:`linear-gradient(125deg,rgba(13,31,48,0.75) 0%,rgba(18,44,65,0.65) 40%,rgba(26,74,110,0.45) 100%),url(${banner})`,
        backgroundSize:'cover', backgroundPosition:'center',
        borderRadius:16, padding:'28px 32px 80px',
        position:'relative', overflow:'visible', marginBottom:64,
      }}>
        {/* Header row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative', zIndex:1 }}>
          <div>
            <p style={{ margin:'0 0 4px', color:'rgba(255,255,255,.5)', fontSize:11.5, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase' }}>
              Order Management
            </p>
            <h1 style={{ margin:0, fontSize:30, fontWeight:700, color:'#fff', letterSpacing:'-0.02em' }}>
              Orders
              <span style={{ fontSize:20, fontWeight:400, opacity:.55 }}> ({orders.length})</span>
            </h1>
          </div>
          <button
            onClick={() => navigate(`${basePath}/new`)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:10, border:'none', background:'#fff', color:PRIMARY, fontWeight:600, fontSize:13, cursor:'pointer' }}
          >
            <Icon d={ic.plus} size={14} color={PRIMARY} /> New Order
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, position:'absolute', bottom:-54, left:32, right:32, zIndex:10 }}>
          {[
            { key:'HOLD',        label:'On Hold',      icon:ic.clock, iconColor:'#f59e0b' },
            { key:'IN_PROGRESS', label:'In Progress',  icon:ic.gear,  iconColor:ACCENT },
            { key:'COMPLETED',   label:'Completed',    icon:ic.check, iconColor:'#10b981' },
          ].map(s => (
            <div
              key={s.key}
              onClick={() => setStatusFilter(prev => prev === s.key ? '' : s.key)}
              style={{
                background:'#fff', borderRadius:12, padding:'16px 20px',
                boxShadow:'0 4px 20px rgba(0,0,0,.09)', cursor:'pointer',
                border: statusFilter === s.key ? `2px solid ${ACCENT}` : '2px solid transparent',
                transition:'border-color .15s',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:12.5, fontWeight:600, color:'#6b7280' }}>{s.label}</span>
                <div style={{ width:32, height:32, borderRadius:8, background:`${s.iconColor}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon d={s.icon} size={15} color={s.iconColor} />
                </div>
              </div>
              <div style={{ fontSize:28, fontWeight:700, color:PRIMARY, letterSpacing:'-0.02em' }}>{counts[s.key]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ padding:'0 32px 32px' }}>

        {/* Toolbar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:15, fontWeight:700, color:PRIMARY }}>Order Data</span>
            <span style={{ fontSize:13, color:'#9ca3af', fontWeight:400 }}>({filtered.length} results)</span>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => window.print()} style={outlineBtn}>
              <Icon d={ic.print} size={13} /> Print
            </button>
            <button style={outlineBtn}>
              <Icon d={ic.export} size={13} /> Export to Excel
            </button>
          </div>
        </div>

        {/* Search + filter row */}
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', marginBottom:12 }}>
          <FloatInput label="Search Order"          value={search}         onChange={setSearch}         placeholder="Customer Name / Order Number" />
          <FloatInput label="Location"              value={locationFilter} onChange={setLocationFilter} placeholder="Enter Location" />
          <FloatInput label="Contact Number"        value={contactFilter}  onChange={setContactFilter}  placeholder="Enter Contact Number" />
          <FloatInput label="Order Date"            value={dateFilter}     onChange={setDateFilter}     type="date" />
          <button style={{ ...outlineBtn, background:PRIMARY, color:'#fff', border:'none' }}>
            <Icon d={ic.search} size={13} color="#fff" /> Search
          </button>
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{ ...outlineBtn, background:showFilters ? PRIMARY : '#fff', color:showFilters ? '#fff' : '#374151', borderColor:showFilters ? PRIMARY : '#d1d5db' }}
          >
            <Icon d={ic.filter} size={13} color={showFilters ? '#fff' : '#374151'} /> Filters
          </button>
        </div>

        {/* Filter pills */}
        {showFilters && (
          <div style={{ display:'flex', gap:8, alignItems:'center', padding:'12px 16px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, marginBottom:12, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, fontWeight:600, color:'#6b7280', fontFamily:FONT }}>Status:</span>
            {[['', 'All'], ['HOLD','On Hold'], ['IN_PROGRESS','In Progress'], ['COMPLETED','Completed']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setStatusFilter(v)}
                style={{ padding:'5px 14px', borderRadius:20, cursor:'pointer', fontFamily:FONT, border:`1px solid ${statusFilter === v ? PRIMARY : '#d1d5db'}`, background:statusFilter === v ? PRIMARY : '#fff', color:statusFilter === v ? '#fff' : '#374151', fontSize:12, fontWeight:600 }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        <div style={{ background:'#fff', borderRadius:10, border:'1px solid #e5e5e5', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
              <thead>
                <tr>
                  {['Order Number', 'OA Number', 'Order Date', 'Dispatch Date', 'Entity Name', 'Contact', 'Location', 'Amount', 'Status'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ padding:52, textAlign:'center', color:'#9ca3af', fontSize:14 }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:16, height:16, border:'2px solid #e2e8f0', borderTopColor:PRIMARY, borderRadius:'50%', animation:'spin .8s linear infinite' }} />
                      Loading orders…
                    </div>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding:52, textAlign:'center', color:'#9ca3af', fontSize:14 }}>No orders found.</td></tr>
                ) : filtered.map((o, i) => {
                  const customer = o.customer_detail ?? {}
                  const poc      = customer.pocs?.[0] ?? {}
                  const phone    = poc.phone ?? customer.telephone_primary ?? ''
                  const location = customer.region ?? customer.city ?? '—'
                  const dispatchDate = o.oa?.commercial_terms?.schedule_dispatch_date

                  return (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`${basePath}/${o.id}`)}
                      style={{ background: i % 2 === 0 ? '#FAF9F9' : '#fff', cursor:'pointer', transition:'background .12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#EEF3FF'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#FAF9F9' : '#fff'}
                    >
                      <td style={{ ...tdStyle, color:PRIMARY, fontWeight:700 }}>{o.order_number}</td>
                      <td style={tdStyle}>{o.oa_number ?? '—'}</td>
                      <td style={tdStyle}>{fmtDate(o.created_at)}</td>
                      <td style={tdStyle}>{dispatchDate ? fmtDate(dispatchDate) : '—'}</td>
                      <td style={{ ...tdStyle, fontWeight:600 }}>{customer.company_name ?? '—'}</td>
                      <td style={tdStyle}><ContactCell phone={phone} name={customer.company_name} /></td>
                      <td style={tdStyle}>{location}</td>
                      <td style={{ ...tdStyle, fontWeight:700 }}>{fmt(o.total_value)}</td>
                      <td style={tdStyle}><StatusBadge status={o.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}